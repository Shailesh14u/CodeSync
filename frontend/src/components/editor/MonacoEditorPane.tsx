import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { FileCode, Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';

import { FileItem, CollabUser } from '../../types';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';

export interface MonacoEditorPaneProps {
  workspaceId: string;
  activeFile?: FileItem | null;
  onSave: () => void;
  onRun: () => void;
}

const PALETTE = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#14B8A6', // Teal
];

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

interface CollabSession {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  yText: Y.Text;
  isSynced: boolean;
  cleanups: Array<() => void>;
}

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
  workspaceId,
  activeFile,
  onSave,
  onRun,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const activeBindingRef = useRef<MonacoBinding | null>(null);

  // Per-file collaborative sessions cache to prevent duplicate inserts and reconnects on tab switch
  const sessionsRef = useRef<Map<string, CollabSession>>(new Map());

  const onSaveRef = useRef(onSave);
  const onRunRef = useRef(onRun);
  const activeFileRef = useRef(activeFile);
  useEffect(() => {
    onSaveRef.current = onSave;
    onRunRef.current = onRun;
    activeFileRef.current = activeFile;
  });

  const { token, user } = useAuthStore();
  const { 
    collabStatus, 
    collabUsers, 
    setCollabStatus, 
    setCollabUsers, 
    updateFileContent,
    fileContents,
    openTabs
  } = useEditorStore();

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Custom keyboard shortcuts always delegating to latest callbacks
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current();
    });
  };

  // Setup / Switch Yjs & Hocuspocus CRDT real-time binding when active file changes
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const fileId = activeFile.id;
    let session = sessionsRef.current.get(fileId);

    // If session doesn't exist yet for this open file, create it
    if (!session) {
      const ydoc = new Y.Doc();
      const yText = ydoc.getText('monaco');
      const wsUrl = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234';
      const documentName = `workspace:${workspaceId}:file:${fileId}`;

      const initialText = fileContents[fileId] !== undefined
        ? fileContents[fileId]
        : (activeFile.content || '');

      setCollabStatus('connecting');

      const provider = new HocuspocusProvider({
        url: wsUrl,
        name: documentName,
        token: token || undefined,
        document: ydoc,
        onStatus: ({ status }) => {
          if (activeFileRef.current?.id === fileId) {
            setCollabStatus(status as any);
          }
        },
        onSynced: () => {
          const currentSession = sessionsRef.current.get(fileId);
          if (currentSession) {
            currentSession.isSynced = true;
          }
          if (activeFileRef.current?.id === fileId) {
            setCollabStatus('connected');
          }
          // Seed ONLY if document is genuinely empty on server
          if (yText.length === 0 && initialText) {
            yText.insert(0, initialText);
          }
        },
        onClose: () => {
          if (activeFileRef.current?.id === fileId) {
            setCollabStatus('disconnected');
          }
        },
      });

      // User presence awareness
      const userColor = getDeterministicColor(user?.id || user?.username || 'user');
      provider.setAwarenessField('user', {
        id: user?.id,
        name: user?.username || 'Anonymous',
        color: userColor,
      });

      const onAwarenessChange = () => {
        if (!provider.awareness || activeFileRef.current?.id !== fileId) return;
        const states = Array.from(provider.awareness.getStates().values());
        const activePeers: CollabUser[] = states
          .map((s: any) => s.user)
          .filter((u: any) => !!u && !!u.name);
        setCollabUsers(activePeers);
      };

      if (provider.awareness) {
        provider.awareness.on('change', onAwarenessChange);
      }

      // Keep editor store content updated as Yjs changes occur
      const textObserver = () => {
        const text = yText.toString();
        updateFileContent(fileId, text);
      };
      yText.observe(textObserver);

      // Offline fallback: if after 1500ms still not synced and yText is empty, seed initial text
      const offlineTimer = setTimeout(() => {
        const curr = sessionsRef.current.get(fileId);
        if (curr && !curr.isSynced && yText.length === 0 && initialText) {
          yText.insert(0, initialText);
        }
      }, 1500);

      session = {
        ydoc,
        provider,
        yText,
        isSynced: false,
        cleanups: [
          () => clearTimeout(offlineTimer),
          () => yText.unobserve(textObserver),
          () => {
            if (provider.awareness) {
              provider.awareness.off('change', onAwarenessChange);
            }
          },
        ],
      };

      sessionsRef.current.set(fileId, session);
    } else {
      // Re-using existing active session without destroying/recreating!
      if (session.isSynced) {
        setCollabStatus('connected');
      } else {
        setCollabStatus((session.provider.status as any) || 'connecting');
      }

      // Re-evaluate collaborators for this file
      if (session.provider.awareness) {
        const states = Array.from(session.provider.awareness.getStates().values());
        const activePeers: CollabUser[] = states
          .map((s: any) => s.user)
          .filter((u: any) => !!u && !!u.name);
        setCollabUsers(activePeers);
      }
    }

    // Detach previous binding from editor
    if (activeBindingRef.current) {
      activeBindingRef.current.destroy();
      activeBindingRef.current = null;
    }

    // Bind Monaco editor model to this active file's Y.Text
    try {
      const binding = new MonacoBinding(
        session.yText,
        model,
        new Set([editor]),
        session.provider.awareness || undefined
      );
      activeBindingRef.current = binding;
    } catch (err) {
      console.warn('[Collab] Binding error:', err);
    }

    return () => {
      if (activeBindingRef.current) {
        activeBindingRef.current.destroy();
        activeBindingRef.current = null;
      }
    };
  }, [activeFile?.id, workspaceId, token, user, setCollabStatus, setCollabUsers, updateFileContent]);

  // Clean up sessions for closed tabs
  useEffect(() => {
    const openIds = new Set(openTabs.map((t) => t.id));
    for (const [fileId, session] of sessionsRef.current.entries()) {
      if (!openIds.has(fileId)) {
        session.cleanups.forEach((c) => c());
        session.provider.destroy();
        session.ydoc.destroy();
        sessionsRef.current.delete(fileId);
      }
    }
  }, [openTabs]);

  // Clean up all sessions on component unmount
  useEffect(() => {
    return () => {
      if (activeBindingRef.current) {
        activeBindingRef.current.destroy();
        activeBindingRef.current = null;
      }
      for (const [, session] of sessionsRef.current.entries()) {
        session.cleanups.forEach((c) => c());
        session.provider.destroy();
        session.ydoc.destroy();
      }
      sessionsRef.current.clear();
      setCollabStatus('disconnected');
      setCollabUsers([]);
    };
  }, []);

  const mapToMonacoLanguage = (lang?: string, name?: string): string => {
    if (name) {
      const lower = name.toLowerCase();
      if (lower.endsWith('.py')) return 'python';
      if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h')) return 'cpp';
      if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
      if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
      if (lower.endsWith('.java')) return 'java';
      if (lower.endsWith('.json')) return 'json';
      if (lower.endsWith('.md')) return 'markdown';
      if (lower.endsWith('.html')) return 'html';
      if (lower.endsWith('.css')) return 'css';
      if (lower.endsWith('.sql')) return 'sql';
    }

    if (!lang) return 'plaintext';
    switch (lang.toLowerCase()) {
      case 'python': return 'python';
      case 'cpp':
      case 'c++': return 'cpp';
      case 'javascript':
      case 'js': return 'javascript';
      case 'typescript':
      case 'ts': return 'typescript';
      case 'java': return 'java';
      case 'markdown':
      case 'md': return 'markdown';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'sql': return 'sql';
      default: return 'plaintext';
    }
  };

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background-main text-content-muted select-none">
        <FileCode className="w-12 h-12 mb-3 stroke-[1.25] text-content-muted/50" />
        <p className="text-sm font-medium text-content-secondary">No File Open</p>
        <p className="text-xs text-content-muted mt-1">Select or create a file in Explorer to begin editing</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background-main">
      {/* Collaboration Status & Active Collaborators floating pill bar */}
      <div className="absolute top-3 right-5 z-20 flex items-center gap-2 pointer-events-none">
        {/* Collaborators Avatars */}
        {collabUsers.length > 0 && (
          <div className="flex items-center -space-x-1.5 bg-background-panel/90 border border-border-subtle px-2 py-1 rounded-full shadow-panel backdrop-blur-sm pointer-events-auto">
            <Users className="w-3.5 h-3.5 text-accent-secondary mr-1.5" />
            {collabUsers.slice(0, 4).map((u) => (
              <div
                key={u.id}
                title={u.name}
                style={{ backgroundColor: u.color || '#6366F1' }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-background-panel uppercase"
              >
                {u.name.charAt(0)}
              </div>
            ))}
            {collabUsers.length > 4 && (
              <span className="text-[10px] text-content-secondary ml-1 font-mono">
                +{collabUsers.length - 4}
              </span>
            )}
          </div>
        )}

        {/* WebSocket Connection State Pill */}
        <div className="flex items-center gap-1.5 bg-background-panel/90 border border-border-subtle px-2.5 py-1 rounded-full text-[10px] font-mono shadow-panel backdrop-blur-sm pointer-events-auto">
          {collabStatus === 'connected' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">Live CRDT Sync</span>
            </>
          ) : collabStatus === 'connecting' ? (
            <>
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="text-amber-400">Connecting WS...</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="text-content-muted">Local Standalone</span>
            </>
          )}
        </div>
      </div>

      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        path={`file-${activeFile.id}-${activeFile.name}`}
        language={mapToMonacoLanguage(activeFile.language, activeFile.name)}
        onMount={handleEditorMount}
        options={{
          fontSize: 13.5,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          automaticLayout: true,
          minimap: {
            enabled: true,
            maxColumn: 80,
            renderCharacters: false,
          },
          padding: {
            top: 10,
            bottom: 10,
          },
          renderLineHighlight: 'all',
          tabSize: 4,
          wordWrap: 'on',
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
};
