import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  X,
  FileCode,
  ShieldAlert,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  apiService,
  InterviewSession,
  InterviewEvaluateResponse,
} from '../../services/api';
import { useEditorStore } from '../../stores/editorStore';

interface InterviewModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export const InterviewModeModal: React.FC<InterviewModeModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
}) => {
  const { openTabs, activeFileId, fileContents } = useEditorStore();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluateResponse | null>(null);
  const [aiFeedbackText, setAiFeedbackText] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Active Timer state
  const [timeLeft, setTimeLeft] = useState(45 * 60); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadInterviewSession();
    }
  }, [isOpen, workspaceId]);

  // Timer countdown
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const loadInterviewSession = async () => {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const data = await apiService.getInterview(workspaceId);
      setSession(data);
      setTimeLeft(data.time_limit_minutes * 60);
      if (data.ai_feedback) {
        setAiFeedbackText(data.ai_feedback);
      }
    } catch (err: any) {
      console.error('Failed to load interview session:', err);
      setErrorNotice(err.response?.data?.detail || 'Failed to initialize interview session.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeFile = openTabs.find((f) => f.id === activeFileId);
  const activeCode =
    (activeFileId && fileContents[activeFileId] !== undefined)
      ? fileContents[activeFileId]
      : (activeFile?.content || '');
  const activeLanguage = activeFile?.language || session?.language || 'python';

  const handleRunTestCases = async () => {
    if (!activeCode.trim()) {
      setErrorNotice('No code present in the active editor buffer.');
      return;
    }

    setIsEvaluating(true);
    setErrorNotice(null);
    try {
      const res = await apiService.evaluateInterview(workspaceId, {
        code: activeCode,
        language: activeLanguage,
      });
      setEvaluation(res);
      if (res.ai_feedback) {
        setAiFeedbackText(res.ai_feedback);
      }
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      setErrorNotice(err.response?.data?.detail || 'Execution of test cases failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!activeCode.trim()) {
      setErrorNotice('No code present to evaluate.');
      return;
    }

    setIsGeneratingFeedback(true);
    setErrorNotice(null);
    try {
      const res = await apiService.generateInterviewFeedback(workspaceId, {
        code: activeCode,
        language: activeLanguage,
      });
      setAiFeedbackText(res.feedback);
    } catch (err: any) {
      console.error('Failed to generate interview evaluation:', err);
      setErrorNotice(err.response?.data?.detail || 'Failed to generate interview feedback.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-[#161D2B] border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111827]">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white">
                  {session?.title || 'Collaborative Coding Challenge'}
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  {session?.difficulty || 'Medium'}
                </span>
                <span className="px-2 py-0.5 text-xs text-gray-400 bg-gray-800 rounded font-mono">
                  {activeLanguage}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Technical interview sandbox. Execute test cases against live candidate editor code.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Countdown Timer */}
            <div className="flex items-center space-x-2 bg-[#0B0F19] border border-gray-700/80 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className={`font-mono text-sm font-bold ${timeLeft < 300 ? 'text-rose-400' : 'text-amber-300'}`}>
                {formatTimer(timeLeft)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                className="p-1 hover:text-white text-gray-400 transition-colors"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setTimeLeft((session?.time_limit_minutes || 45) * 60)}
                title="Reset Timer"
                className="p-1 hover:text-white text-gray-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorNotice && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Body Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 min-h-0 bg-[#0B0F19]">
          {/* Left Column: Problem Description & Test Execution */}
          <div className="flex flex-col min-h-0 overflow-y-auto p-6 space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono mb-2">
                Problem Statement
              </h4>
              <div className="text-xs text-gray-300 leading-relaxed bg-[#111827] p-4 rounded-xl border border-gray-800 whitespace-pre-wrap font-sans">
                {session?.description}
              </div>
            </div>

            {/* Test Cases Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                  Test Cases ({session?.test_cases.length || 0})
                </h4>

                <button
                  onClick={handleRunTestCases}
                  disabled={isEvaluating}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Run Test Suite</span>
                </button>
              </div>

              {/* Test Cases List */}
              <div className="space-y-2">
                {(session?.test_cases || []).map((tc, idx) => {
                  const testRes = evaluation?.results?.find((r) => r.test_id === tc.id);
                  return (
                    <div
                      key={tc.id}
                      className={`p-3 rounded-lg border text-xs transition-colors ${
                        testRes
                          ? testRes.passed
                            ? 'bg-emerald-950/20 border-emerald-800/40'
                            : 'bg-rose-950/20 border-rose-800/40'
                          : 'bg-[#111827] border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white flex items-center space-x-1.5">
                          <span>Case #{idx + 1}</span>
                          {tc.hidden && (
                            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.2 rounded font-normal">
                              Hidden
                            </span>
                          )}
                        </span>

                        {testRes && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {testRes.execution_time_ms}ms
                            </span>
                            {testRes.passed ? (
                              <span className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Passed</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-rose-400 text-xs font-medium">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Failed</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1 text-gray-400">
                        <div className="bg-[#0B0F19] p-2 rounded">
                          <span className="text-gray-400 block text-[10px]">Input:</span>
                          <span className="text-gray-300">
                            {tc.hidden && !testRes ? '[Hidden]' : tc.input}
                          </span>
                        </div>
                        <div className="bg-[#0B0F19] p-2 rounded">
                          <span className="text-gray-400 block text-[10px]">Expected:</span>
                          <span className="text-gray-300">
                            {tc.hidden && !testRes ? '[Hidden]' : tc.expected_output}
                          </span>
                        </div>
                      </div>

                      {testRes && !testRes.passed && testRes.actual && (
                        <div className="mt-2 p-2 bg-rose-950/30 rounded border border-rose-900/40 text-[11px] font-mono text-rose-300">
                          <span className="block text-[10px] text-rose-400 font-bold">Your Output:</span>
                          <span>{testRes.actual}</span>
                          {testRes.error && <p className="text-rose-400 mt-1">{testRes.error}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Scorecard & AI Candidate Feedback */}
          <div className="flex flex-col min-h-0 overflow-y-auto p-6 space-y-5 bg-[#0D121F]">
            {/* Overall Score Header */}
            <div className="p-4 rounded-xl bg-[#161D2B] border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                  Candidate Score
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-extrabold text-white">
                    {evaluation ? `${evaluation.score}%` : session?.score !== null && session?.score !== undefined ? `${session.score}%` : '--'}
                  </span>
                  {evaluation && (
                    <span className="text-xs text-gray-400">
                      ({evaluation.passed_tests} / {evaluation.total_tests} test cases passed)
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerateFeedback}
                disabled={isGeneratingFeedback || isEvaluating}
                className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isGeneratingFeedback ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>AI Interview Assessment</span>
              </button>
            </div>

            {/* Candidate Code snippet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Submitted Code Buffer</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{activeFile?.name || 'buffer'}</span>
              </div>
              <pre className="p-3 bg-[#080B12] rounded-lg border border-gray-800 text-[11px] font-mono text-gray-300 max-h-44 overflow-y-auto">
                {activeCode || '// No code in active buffer'}
              </pre>
            </div>

            {/* AI Assessment Panel */}
            <div className="space-y-2 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interviewer Evaluation Card</span>
              </span>

              {isGeneratingFeedback ? (
                <div className="p-8 text-center text-xs text-indigo-400 bg-[#161D2B] rounded-xl border border-indigo-900/30 flex flex-col items-center space-y-2 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing algorithm critique, complexity, and recommendations...</span>
                </div>
              ) : aiFeedbackText ? (
                <div className="p-4 bg-[#161D2B] rounded-xl border border-gray-800 text-xs text-gray-300 space-y-3 leading-relaxed whitespace-pre-wrap font-sans">
                  {aiFeedbackText}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 bg-[#161D2B] rounded-xl border border-gray-800">
                  <p>No AI evaluation generated yet.</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Click &ldquo;AI Interview Assessment&rdquo; to analyze the candidate&apos;s code quality, edge cases, and time/space complexity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
