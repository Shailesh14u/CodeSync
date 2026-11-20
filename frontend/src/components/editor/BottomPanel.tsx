import React, { useState } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  X, 
  Trash2, 
  CheckCircle2, 
  History, 
  Cpu, 
  Clock, 
  Play, 
  CornerDownLeft, 
  Keyboard, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { ExecutionResponse } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface BottomPanelProps {
  logs: Array<{ id: string; type: 'info' | 'success' | 'error' | 'header'; text: string; timestamp: string }>;
  executionHistory: ExecutionResponse[];
  onClearLogs: () => void;
  customStdin?: string;
  onStdinChange?: (value: string) => void;
  onRunCodeWithStdin?: (overrideStdin?: string) => void;
  isRunning?: boolean;
  requiresInput?: boolean;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  logs,
  executionHistory,
  onClearLogs,
  customStdin = '',
  onStdinChange,
  onRunCodeWithStdin,
  isRunning = false,
  requiresInput,
}) => {
  const { 
    isBottomPanelOpen, 
    toggleBottomPanel, 
    activeBottomTab, 
    setActiveBottomTab,
    openTabs,
    activeFileId,
    fileContents
  } = useEditorStore();

  const [quickInput, setQuickInput] = useState('');
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  const activeFile = openTabs.find((t) => t.id === activeFileId);
  const activeCode = (activeFileId && fileContents[activeFileId] !== undefined)
    ? fileContents[activeFileId]
    : (activeFile?.content || '');

  const hasEofError = logs.some((l) => 
    l.type === 'error' && (l.text.includes('EOFError') || l.text.includes('EOF when reading a line'))
  );

  // Dynamically detect whether active code requires standard input
  const codeNeedsInput = React.useMemo(() => {
    if (requiresInput !== undefined) return requiresInput;
    if (hasEofError) return true;
    if (!activeCode) return false;

    // Python: input(...) or sys.stdin
    if (/\binput\s*\(/.test(activeCode) || /sys\.stdin/.test(activeCode)) return true;
    // C / C++: cin >> or scanf(...) or getline(...) or getchar(...)
    if (/\bcin\s*>>/.test(activeCode) || /\bscanf\s*\(/.test(activeCode) || /\bgetline\s*\(/.test(activeCode) || /\bgetchar\s*\(/.test(activeCode)) return true;
    // Java: Scanner(...) or System.in or BufferedReader
    if (/\bScanner\s*\(/.test(activeCode) || /\bSystem\.in\b/.test(activeCode) || /\bBufferedReader\b/.test(activeCode)) return true;
    // JavaScript / Node: readline or process.stdin or prompt(...)
    if (/\breadline\b/.test(activeCode) || /process\.stdin/.test(activeCode) || /\bprompt\s*\(/.test(activeCode)) return true;

    return false;
  }, [requiresInput, hasEofError, activeCode]);

  // If code does NOT need input and the active tab is 'input', switch back to 'output'
  React.useEffect(() => {
    if (!codeNeedsInput && activeBottomTab === 'input') {
      setActiveBottomTab('output');
    }
  }, [codeNeedsInput, activeBottomTab, setActiveBottomTab]);

  React.useEffect(() => {
    if (activeBottomTab === 'output') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeBottomTab]);

  const handleQuickRun = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onRunCodeWithStdin) return;

    const val = quickInput.trim();
    if (val && onStdinChange) {
      onStdinChange(val);
    }
    onRunCodeWithStdin(val || customStdin);
  };

  const handleRunFullStdin = () => {
    if (onRunCodeWithStdin) {
      onRunCodeWithStdin(customStdin);
    }
  };

  if (!isBottomPanelOpen) return null;

  const hasStdinContent = customStdin.trim().length > 0;

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

          {codeNeedsInput && (
            <button
              onClick={() => setActiveBottomTab('input')}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors relative ${
                activeBottomTab === 'input'
                  ? 'text-emerald-400 bg-background-panel font-medium'
                  : 'text-content-secondary hover:text-content-main'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Input (stdin)</span>
              {hasStdinContent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Stdin has input data" />
              )}
            </button>
          )}

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
      <div className="flex-1 overflow-hidden flex flex-col font-mono text-xs bg-[#0B0F19]">
        {/* Output Console Tab */}
        {activeBottomTab === 'output' && (
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
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

              {/* Friendly Hint if EOFError occurred */}
              {hasEofError && (
                <div className="my-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2 select-text">
                  <div className="flex items-center gap-2 font-semibold text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Program Expected User Input (input())</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Your code called <code className="bg-amber-500/20 px-1 py-0.5 rounded text-white font-mono">input()</code>, but Standard Input (stdin) was empty. Type your value below and press <strong>Enter</strong> or click <strong>Run</strong>!
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('input')}
                      className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-mono transition-colors flex items-center gap-1"
                    >
                      <Keyboard className="w-3 h-3" />
                      Open Full Multi-Line Input Tab →
                    </button>
                  </div>
                </div>
              )}

              <div ref={logsEndRef} />
            </div>

            {/* Quick Interactive Stdin Prompt Bar (Only shown if code requires user input) */}
            {codeNeedsInput && (
              <form onSubmit={handleQuickRun} className="mt-2 pt-2 border-t border-border-subtle flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-[11px] text-content-muted font-mono shrink-0">
                  <CornerDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-content-secondary">stdin:</span>
                </div>
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder={hasStdinContent ? `Current: "${customStdin.slice(0, 30)}${customStdin.length > 30 ? '...' : ''}" (Type new value to run)` : 'Type program input (e.g. Shailesh) and press Enter to Run...'}
                  className="flex-1 bg-background-panel border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-content-main font-mono outline-none focus:border-emerald-500 transition-colors"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isRunning}
                  className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 shrink-0"
                >
                  <Play className="w-3 h-3 fill-current mr-1" />
                  <span>{isRunning ? 'Running...' : 'Run with Input'}</span>
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Input (stdin) Tab (Only shown if code requires user input) */}
        {activeBottomTab === 'input' && codeNeedsInput && (
          <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-xs text-content-muted shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-content-main font-mono flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-emerald-400" />
                  Standard Input (stdin)
                </span>
                <span className="text-[10px] text-content-muted">
                  • Fed to input(), cin, Scanner line by line
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onStdinChange && onStdinChange('Shailesh\n25')}
                  className="px-2 py-0.5 rounded text-[10px] bg-background-secondary text-content-muted hover:text-content-main border border-border-subtle"
                >
                  Load Sample
                </button>
                <button
                  type="button"
                  onClick={() => onStdinChange && onStdinChange('')}
                  title="Clear Stdin"
                  className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunFullStdin}
                  disabled={isRunning}
                  className="h-6 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500"
                >
                  <Play className="w-3 h-3 fill-current mr-1" />
                  Run
                </Button>
              </div>
            </div>

            <textarea
              value={customStdin}
              onChange={(e) => onStdinChange && onStdinChange(e.target.value)}
              placeholder={`Enter input for your program here (one line per input() call)...\n\nExample:\nShailesh\n10\n20`}
              className="flex-1 w-full bg-background-panel border border-border-subtle rounded-lg p-2.5 text-xs text-content-main font-mono outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Runs History Tab */}
        {activeBottomTab === 'terminal' && (
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
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
          <div className="flex-1 p-4 flex flex-col items-center justify-center text-content-muted">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1 opacity-70" />
            <p>No syntax problems detected.</p>
          </div>
        )}
      </div>
    </div>
  );
};
