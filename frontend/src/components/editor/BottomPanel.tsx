import React from 'react';
import { Terminal, Bug, AlertCircle, X, Trash2, CheckCircle2, History, Cpu, Clock } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { ExecutionResponse } from '../../types';
import { Badge } from '../ui/Badge';

export interface BottomPanelProps {
  logs: Array<{ id: string; type: 'info' | 'success' | 'error' | 'header'; text: string; timestamp: string }>;
  executionHistory: ExecutionResponse[];
  onClearLogs: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  logs,
  executionHistory,
  onClearLogs,
}) => {
  const { 
    isBottomPanelOpen, 
    toggleBottomPanel, 
    activeBottomTab, 
    setActiveBottomTab 
  } = useEditorStore();

  const logsEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeBottomTab === 'output') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeBottomTab]);

  if (!isBottomPanelOpen) return null;

  return (
    <div className="h-full w-full bg-background-panel flex flex-col select-none overflow-hidden">
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
            <History className="w-3.5 h-3.5" />
            Runs History ({executionHistory.length})
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
            Diagnostics (0)
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
        {/* Output Console Tab */}
        {activeBottomTab === 'output' && (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-content-muted italic">Click 'Run' or press Ctrl+Enter to compile and execute code.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[10px] text-content-muted shrink-0 select-none">[{log.timestamp}]</span>
                  <div
                    className={
                      log.type === 'error'
                        ? 'text-rose-400 whitespace-pre-wrap'
                        : log.type === 'success'
                        ? 'text-emerald-400 whitespace-pre-wrap font-medium'
                        : log.type === 'header'
                        ? 'text-accent-primary font-semibold'
                        : 'text-slate-300 whitespace-pre-wrap'
                    }
                  >
                    {log.text}
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        )}

        {/* Runs History Tab */}
        {activeBottomTab === 'terminal' && (
          <div className="space-y-2">
            {executionHistory.length === 0 ? (
              <p className="text-content-muted italic">No execution history recorded for this workspace yet.</p>
            ) : (
              executionHistory.map((run) => (
                <div
                  key={run.id}
                  className="p-2.5 rounded-lg bg-background-panel border border-border-subtle flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={run.status === 'success' ? 'success' : 'error'}
                      size="sm"
                      className="font-mono text-[10px] uppercase"
                    >
                      Exit {run.exit_code}
                    </Badge>
                    <span className="font-medium text-content-main font-mono">{run.entrypoint}</span>
                    <span className="text-content-muted capitalize text-[11px]">({run.language})</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-content-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {run.execution_time_ms}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {run.memory_used_mb}MB
                    </span>
                    <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        )}

        {/* Diagnostics / Problems */}
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
