// CodeSync AI - Hocuspocus Real-Time Collaboration Server
require('dotenv').config({ path: '../.env' });
const { Server } = require('@hocuspocus/server');
const jwt = require('jsonwebtoken');
const Y = require('yjs');

const PORT = parseInt(process.env.COLLAB_SERVER_PORT || '1234', 10);
const SECRET_KEY = process.env.SECRET_KEY || 'codesync-ai-super-secret-key-change-in-production-min-32-chars';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

console.log(`[CodeSync AI] Initializing Hocuspocus Collaboration Server on port ${PORT}...`);

const server = Server.configure({
  port: PORT,
  debounce: 2000,
  maxDebounce: 5000,

  async onAuthenticate(data) {
    const { token, documentName } = data;

    if (!token) {
      console.warn(`[Collab Auth] Rejected unauthenticated connection to ${documentName}`);
      throw new Error('Authentication token required');
    }

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.sub;
      const username = decoded.username || 'Developer';

      // Parse document name format: "workspace:{workspaceId}:file:{fileId}"
      const parts = documentName.split(':');
      let workspaceId = null;
      let fileId = null;

      if (parts.length >= 4 && parts[0] === 'workspace' && parts[2] === 'file') {
        workspaceId = parts[1];
        fileId = parts[3];
      }

      return {
        user: {
          id: userId,
          name: username,
          workspaceId,
          fileId,
        },
      };
    } catch (err) {
      console.warn(`[Collab Auth] Invalid token for ${documentName}:`, err.message);
      throw new Error('Invalid or expired authentication token');
    }
  },

  async onLoadDocument(data) {
    const { documentName, document } = data;
    const parts = documentName.split(':');
    if (parts.length < 4) return document;

    const fileId = parts[3];
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/collaboration/docs/${fileId}`, {
        headers: {
          'X-Internal-Secret': SECRET_KEY,
        },
      });
      if (res.ok) {
        const docData = await res.json();
        const monacoText = document.getText('monaco');

        if (docData.has_state && docData.state_base64) {
          const binaryBuffer = Buffer.from(docData.state_base64, 'base64');
          Y.applyUpdate(document, new Uint8Array(binaryBuffer));
        } else if (docData.fallback_content && monacoText.length === 0) {
          monacoText.insert(0, docData.fallback_content);
        }
      }
    } catch (err) {
      console.warn(`[Collab Load] Note loading fallback for ${documentName}:`, err.message);
    }

    return document;
  },

  async onStoreDocument(data) {
    const { documentName, document } = data;
    const parts = documentName.split(':');
    if (parts.length < 4) return;

    const fileId = parts[3];
    try {
      const stateUpdate = Y.encodeStateAsUpdate(document);
      const stateBase64 = Buffer.from(stateUpdate).toString('base64');
      const plainText = document.getText('monaco').toString();

      await fetch(`${BACKEND_URL}/api/v1/collaboration/docs/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': SECRET_KEY,
        },
        body: JSON.stringify({
          content: plainText,
          state_base64: stateBase64,
        }),
      });
    } catch (err) {
      console.warn(`[Collab Store] Note persisting ${documentName}:`, err.message);
    }
  },
});

server.listen().then(() => {
  console.log(`[CodeSync AI] Hocuspocus CRDT Collaboration Server listening on ws://localhost:${PORT}`);
});
