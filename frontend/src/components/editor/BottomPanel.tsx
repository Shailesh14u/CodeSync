import React from 'react';
import { Terminal, Bug, AlertCircle, X, Trash2, CheckCircle2 } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

export interface BottomPanelProps {
  logs: Array<{ id: string; type: 'info' | 'success' | 'error'; text: string; timestamp: string }>;
  onClearLogs: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  logs,
  onClearLogs,
}) => {
  const { 
    isBottomPanelOpen, 
    toggleBottomPanel, 
    activeBottomTab, 
    setActiveBottomTab 
  } = useEditorStore();

  if (!isBottomPanelOpen) return null;

  return (
    <div className="h-48 border-t border-border-subtle bg-background-panel flex flex-col select-none shrink-0">
      {/* Tab bar */}
      <div className="h-8 px-3 border-b border-border-subtle flex items-center justify-between bg-background-secondary/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveBottomTab('output')}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              activeBottomTab === 'output'
                ? 'text-accent-primary bg-background-panel font-medium'
                : 'text-content-secondary hover:text-content-main'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Output Console
          </button>

          <button
            onClick={() => setActiveBottomTab('terminal')}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              activeBottomTab === 'terminal'
                ? 'text-accent-primary bg-background-panel font-medium'
                : 'text-content-secondary hover:text-content-main'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Sandbox Terminal
          </button>

          <button
            onClick={() => setActiveBottomTab('problems')}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              activeBottomTab === 'problems'
                ? 'text-accent-primary bg-background-panel font-medium'
                : 'text-content-secondary hover:text-content-main'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Problems (0)
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClearLogs}
            title="Clear Output"
            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleBottomPanel}
            title="Close Panel"
            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-content-secondary bg-[#0B0F19]">
        {activeBottomTab === 'output' && (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-content-muted italic">Click 'Run' or press Ctrl+Enter to compile and execute code.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[10px] text-content-muted shrink-0">[{log.timestamp}]</span>
                  <span
                    className={
                      log.type === 'error'
                        ? 'text-rose-400'
                        : log.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeBottomTab === 'terminal' && (
          <div className="space-y-1">
            <div className="text-content-muted">CodeSync Sandboxed Environment (Ready)</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span>$</span>
              <span className="text-slate-300">echo "Docker runner container ready for Phase 5"</span>
            </div>
            <div className="text-content-secondary">Docker runner container ready for Phase 5</div>
          </div>
        )}

        {activeBottomTab === 'problems' && (
          <div className="py-4 text-center text-content-muted">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1 opacity-70" />
            <p>No syntax problems detected.</p>
          </div>
        )}
      </div>
    </div>
  );
};
