import React from 'react';
import { X, Circle } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { FileItem } from '../../types';

export const EditorTabs: React.FC = () => {
  const { openTabs, activeFileId, dirtyFiles, openFile, closeTab } = useEditorStore();

  if (openTabs.length === 0) {
    return null;
  }

  const getLanguageTag = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.py')) return '🐍';
    if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h')) return '⚡';
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return '📜';
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'TS';
    if (lower.endsWith('.java')) return '☕';
    if (lower.endsWith('.json')) return '{}';
    if (lower.endsWith('.md')) return 'M↓';
    return '📄';
  };

  return (
    <div className="flex items-center bg-background-main border-b border-border-subtle overflow-x-auto select-none no-scrollbar">
      {openTabs.map((tab) => {
        const isActive = activeFileId === tab.id;
        const isDirty = !!dirtyFiles[tab.id];

        return (
          <div
            key={tab.id}
            onClick={() => openFile(tab)}
            className={`group relative flex items-center gap-2 px-3.5 py-2 border-r border-border-subtle cursor-pointer text-xs font-mono transition-colors border-t-2 ${
              isActive
                ? 'bg-background-panel text-content-main border-accent-primary font-medium'
                : 'bg-background-main/50 text-content-secondary hover:text-content-main hover:bg-background-panel/50 border-transparent'
            }`}
          >
            <span className="text-xs shrink-0">{getLanguageTag(tab.name)}</span>
            <span className="truncate max-w-[140px]">{tab.name}</span>

            {/* Dirty or Close indicator */}
            <div className="flex items-center shrink-0 ml-1">
              {isDirty ? (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 rounded hover:bg-background-hover"
                  title="Unsaved changes. Click to close."
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:hidden inline-block" />
                  <X className="w-3 h-3 hidden group-hover:inline-block text-content-muted hover:text-content-main" />
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 rounded text-content-muted hover:text-content-main hover:bg-background-hover opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
