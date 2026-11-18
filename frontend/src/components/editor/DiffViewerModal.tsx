import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, Check, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { AIResponse, apiService } from '../../services/api';
import { useEditorStore } from '../../stores/editorStore';

interface DiffViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCode: string;
  aiResponse: AIResponse;
  language?: string;
  onApplySuccess?: () => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  isOpen,
  onClose,
  originalCode,
  aiResponse,
  language = 'python',
  onApplySuccess,
}) => {
  const { activeFileId, updateFileContent } = useEditorStore();
  const [submitting, setSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!activeFileId) return;
    setSubmitting(true);
    try {
      // 1. Apply code to active file in store (which syncs to editor and triggers auto-save)
      updateFileContent(activeFileId, aiResponse.suggested_code);

      // 2. Submit accepted feedback to backend
      await apiService.sendAIFeedback(aiResponse.request_id, true);

      if (onApplySuccess) {
        onApplySuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to accept AI diff:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      // Submit rejected feedback to backend
      await apiService.sendAIFeedback(aiResponse.request_id, false);
      onClose();
    } catch (err) {
      console.error('Failed to record AI rejection feedback:', err);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-[#161D2B] border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111827]">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white">Review AI Suggested Changes</h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 capitalize">
                  {aiResponse.action}
                </span>
                <span className="px-2 py-0.5 text-xs text-gray-400 bg-gray-800 rounded">
                  {aiResponse.provider}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Inspect changes side-by-side. Shared code will not be modified unless you click Accept.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complexity & Risks Banner */}
        <div className="px-6 py-2.5 bg-[#0B0F19] border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            {aiResponse.complexity && (
              <div className="flex items-center space-x-2 text-indigo-300">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Time: <strong>{aiResponse.complexity.time_complexity}</strong></span>
                <span>•</span>
                <span>Space: <strong>{aiResponse.complexity.space_complexity}</strong></span>
              </div>
            )}
          </div>
          {aiResponse.risks && (
            <div className="flex items-center space-x-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 max-w-xl truncate">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate"><strong>Risks:</strong> {aiResponse.risks}</span>
            </div>
          )}
        </div>

        {/* Diff Labels */}
        <div className="grid grid-cols-2 bg-[#111827] border-b border-gray-800 px-6 py-2 text-xs font-mono">
          <div className="text-gray-400">Current Buffer (Original)</div>
          <div className="text-emerald-400 flex items-center space-x-1">
            <span>AI Suggested Changes</span>
          </div>
        </div>

        {/* Diff Editor Pane */}
        <div className="flex-1 min-h-0 bg-[#0B0F19]">
          <DiffEditor
            original={originalCode}
            modified={aiResponse.suggested_code}
            language={language}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Explanation & Footer Actions */}
        <div className="p-4 bg-[#111827] border-t border-gray-800 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-300 max-w-2xl line-clamp-2">
            <span className="text-gray-400 font-medium">Reasoning: </span>
            {aiResponse.reasoning || aiResponse.explanation}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleReject}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
            >
              Reject Changes
            </button>
            <button
              onClick={handleAccept}
              disabled={submitting}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Accept & Apply Diff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
