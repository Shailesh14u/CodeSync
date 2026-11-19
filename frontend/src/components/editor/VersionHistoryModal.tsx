import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  RotateCcw,
  Plus,
  X,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { apiService, SnapshotItem, SnapshotDetail } from '../../services/api';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onRestoreSuccess: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onRestoreSuccess,
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotDetail | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New snapshot inputs
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadSnapshots();
    }
  }, [isOpen, workspaceId]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiService.getSnapshots(workspaceId);
      setSnapshots(data);
      if (data.length > 0) {
        loadSnapshotDetails(data[0].id);
      } else {
        setSelectedSnapshot(null);
      }
    } catch (err: any) {
      console.error('Failed to load snapshots:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to fetch version history.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSnapshotDetails = async (id: string) => {
    try {
      const details = await apiService.getSnapshot(id);
      setSelectedSnapshot(details);
      setSelectedFileIndex(0);
    } catch (err: any) {
      console.error('Failed to load snapshot details:', err);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim()) return;

    setIsCreating(true);
    setErrorMessage(null);
    try {
      const newSnap = await apiService.createSnapshot(workspaceId, {
        name: snapshotName.trim(),
        description: snapshotDesc.trim() || undefined,
      });

      setStatusMessage(`Snapshot '${newSnap.name}' saved!`);
      setSnapshotName('');
      setSnapshotDesc('');
      setShowCreateForm(false);
      await loadSnapshots();
      await loadSnapshotDetails(newSnap.id);
    } catch (err: any) {
      console.error('Failed to create snapshot:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to capture snapshot.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedSnapshot) return;
    const confirm = window.confirm(
      `Are you sure you want to restore snapshot "${selectedSnapshot.name}"?\nCurrent files in this workspace will be replaced with the snapshot version.`
    );
    if (!confirm) return;

    setIsRestoring(true);
    setErrorMessage(null);
    try {
      await apiService.restoreSnapshot(selectedSnapshot.id);
      setStatusMessage(`Successfully restored "${selectedSnapshot.name}"!`);
      onRestoreSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to restore snapshot:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to restore snapshot.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  const currentPreviewFile = selectedSnapshot?.files_data[selectedFileIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-[#161D2B] border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111827]">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Version History & Snapshots</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Capture milestone versions and safely roll back to previous code states.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Snapshot</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Snapshot Inline Banner */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateSnapshot}
            className="p-4 bg-[#0F1420] border-b border-gray-800 flex flex-wrap items-center gap-3 text-xs"
          >
            <input
              type="text"
              required
              placeholder="Snapshot Name (e.g. v1.2-stable, Before Refactor)"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#161D2B] border border-gray-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Optional description"
              value={snapshotDesc}
              onChange={(e) => setSnapshotDesc(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#161D2B] border border-gray-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isCreating || !snapshotName.trim()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save Version</span>
            </button>
          </form>
        )}

        {/* Status / Error Toast */}
        {statusMessage && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Snapshot Timeline List */}
          <div className="w-72 border-r border-gray-800 bg-[#111827] flex flex-col overflow-y-auto">
            <div className="p-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 font-mono border-b border-gray-800/80">
              Timeline Milestones ({snapshots.length})
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-xs text-gray-400 flex flex-col items-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Loading timeline...</span>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 space-y-2">
                <Clock className="w-8 h-8 text-gray-600 mx-auto" />
                <p>No snapshots captured yet.</p>
                <p className="text-[11px] text-gray-400">
                  Click &ldquo;Capture Snapshot&rdquo; to save your current work as a milestone.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {snapshots.map((snap) => {
                  const isSelected = selectedSnapshot?.id === snap.id;
                  return (
                    <button
                      key={snap.id}
                      onClick={() => loadSnapshotDetails(snap.id)}
                      className={`w-full text-left p-3 text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/15 border-l-2 border-indigo-500'
                          : 'hover:bg-gray-800/50 text-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span className="truncate">{snap.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                          {snap.file_count} files
                        </span>
                      </div>
                      {snap.description && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                          {snap.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 mt-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(snap.created_at).toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Snapshot File Preview & Details */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19]">
            {selectedSnapshot ? (
              <>
                {/* Snapshot metadata header */}
                <div className="px-6 py-3 border-b border-gray-800 bg-[#111827] flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-white">{selectedSnapshot.name}</h4>
                      <span className="text-xs text-gray-400">
                        • {new Date(selectedSnapshot.created_at).toLocaleString()}
                      </span>
                    </div>
                    {selectedSnapshot.description && (
                      <p className="text-xs text-gray-400">{selectedSnapshot.description}</p>
                    )}
                  </div>

                  <button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span>Restore this Version</span>
                  </button>
                </div>

                {/* File Tabs within snapshot */}
                <div className="flex items-center space-x-1 px-4 py-2 bg-[#0F1420] border-b border-gray-800 overflow-x-auto text-xs font-mono">
                  <Layers className="w-3.5 h-3.5 text-gray-400 mr-1" />
                  {selectedSnapshot.files_data.map((f, idx) => (
                    <button
                      key={f.path}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                        selectedFileIndex === idx
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <FileCode className="w-3 h-3" />
                      <span>{f.name}</span>
                    </button>
                  ))}
                </div>

                {/* File Preview Editor */}
                <div className="flex-1 min-h-0">
                  {currentPreviewFile ? (
                    <Editor
                      height="100%"
                      language={currentPreviewFile.language || 'python'}
                      value={currentPreviewFile.content}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">
                      No files in this snapshot.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400 space-y-2">
                <History className="w-10 h-10 text-gray-600" />
                <p>Select a snapshot from the timeline to preview contents and restore.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
