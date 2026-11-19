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

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
  workspaceId,
  activeFile,
  onSave,
  onRun,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  const onSaveRef = useRef(onSave);
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onSaveRef.current = onSave;
    onRunRef.current = onRun;
  });

  const { token, user } = useAuthStore();
  const { 
    collabStatus, 
    collabUsers, 
    setCollabStatus, 
    setCollabUsers, 
    updateFileContent,
    fileContents 
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

  // Setup / Teardown Yjs & Hocuspocus CRDT real-time binding when active file changes
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // 1. Cleanup previous session
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234';
    const documentName = `workspace:${workspaceId}:file:${activeFile.id}`;

    setCollabStatus('connecting');

    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: documentName,
      token: token || undefined,
      document: ydoc,
      onStatus: ({ status }) => {
        setCollabStatus(status as any);
      },
      onSynced: () => {
        setCollabStatus('connected');
      },
      onClose: () => {
        setCollabStatus('disconnected');
      },
    });
    providerRef.current = provider;

    // Set user awareness (name, unique color, ID)
    const userColor = getDeterministicColor(user?.id || user?.username || 'user');
    provider.setAwarenessField('user', {
      id: user?.id,
      name: user?.username || 'Anonymous',
      color: userColor,
    });

    // Track active collaborators via awareness protocol
    if (provider.awareness) {
      provider.awareness.on('change', () => {
        if (!provider.awareness) return;
        const states = Array.from(provider.awareness.getStates().values());
        const activePeers: CollabUser[] = states
          .map((s: any) => s.user)
          .filter((u: any) => !!u && !!u.name);

        setCollabUsers(activePeers);
      });
    }

    const yText = ydoc.getText('monaco');

    // Seed initial content if yText is empty
    const initialText = fileContents[activeFile.id] !== undefined
      ? fileContents[activeFile.id]
      : activeFile.content;

    if (yText.length === 0 && initialText) {
      yText.insert(0, initialText);
    }

    // Bind Monaco editor model to Y.Text with cursor awareness
    try {
      const binding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        provider.awareness || undefined
      );
      bindingRef.current = binding;

      // Keep editor store content updated as Yjs changes occur
      yText.observe(() => {
        const text = yText.toString();
        updateFileContent(activeFile.id, text);
      });
    } catch (err) {
      console.warn('[Collab] Fallback to standalone mode:', err);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      setCollabStatus('disconnected');
      setCollabUsers([]);
    };
  }, [activeFile?.id, workspaceId, token, user, setCollabStatus, setCollabUsers, updateFileContent]);

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
      case 'markdown': return 'markdown';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'sql': return 'sql';
      default: return 'plaintext';
    }
  };

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-background-main text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-background-panel border border-border-subtle flex items-center justify-center text-accent-primary mb-4 shadow-panel">
          <FileCode className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-content-main">No File Open</h3>
        <p className="mt-1.5 text-xs text-content-secondary max-w-xs leading-relaxed">
          Select a file from the explorer on the left or create a new file to begin editing.
        </p>
        <div className="mt-6 flex items-center gap-4 text-xs font-mono text-content-muted">
          <span>Ctrl + S: Save</span>
          <span>•</span>
          <span>Ctrl + Enter: Run</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-[#1E1E1E]">
      {/* Real-time Connection Status & Active Collaborators floating bar */}
      <div className="absolute top-2 right-6 z-20 flex items-center gap-2 pointer-events-none">
        {/* Collaborator Avatars */}
        {collabUsers.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden bg-background-panel/90 border border-border-subtle px-2 py-1 rounded-full shadow-panel backdrop-blur-sm pointer-events-auto">
            {collabUsers.map((u, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background-panel uppercase"
                style={{ backgroundColor: u.color }}
                title={`${u.name} (Active now)`}
              >
                {u.name.charAt(0)}
              </span>
            ))}
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
        language={mapToMonacoLanguage(activeFile.language, activeFile.name)}
        onMount={handleEditorMount}
        onChange={(val) => {
          if (activeFile) {
            updateFileContent(activeFile.id, val || '');
          }
        }}
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
        loading={
          <div className="h-full flex items-center justify-center bg-background-panel text-xs font-mono text-content-secondary">
            Loading Monaco Editor & Yjs Mesh...
          </div>
        }
      />
    </div>
  );
};
