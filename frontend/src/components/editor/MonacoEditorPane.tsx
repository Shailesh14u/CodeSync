import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { FileCode, Sparkles } from 'lucide-react';
import { FileItem } from '../../types';
import { useEditorStore } from '../../stores/editorStore';

export interface MonacoEditorPaneProps {
  activeFile?: FileItem | null;
  onSave: () => void;
  onRun: () => void;
}

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
  activeFile,
  onSave,
  onRun,
}) => {
  const editorRef = useRef<any>(null);
  const { fileContents, updateFileContent } = useEditorStore();

  const currentContent = activeFile 
    ? (fileContents[activeFile.id] !== undefined ? fileContents[activeFile.id] : activeFile.content)
    : '';

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom keyboard shortcuts
    // Ctrl+S / Cmd+S: Save file
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Ctrl+Enter / Cmd+Enter: Run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });
  };

  const handleContentChange: OnChange = (value) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.id, value);
    }
  };

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
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={mapToMonacoLanguage(activeFile.language, activeFile.name)}
        value={currentContent}
        onChange={handleContentChange}
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
        loading={
          <div className="h-full flex items-center justify-center bg-background-panel text-xs font-mono text-content-secondary">
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
};
