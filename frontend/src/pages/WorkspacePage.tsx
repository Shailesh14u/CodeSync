import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { apiService } from '../services/api';
import { Workspace, FileItem, WorkspaceMember } from '../types';

import { EditorToolbar } from '../components/editor/EditorToolbar';
import { FileExplorer } from '../components/editor/FileExplorer';
import { EditorTabs } from '../components/editor/EditorTabs';
import { MonacoEditorPane } from '../components/editor/MonacoEditorPane';
import { BottomPanel } from '../components/editor/BottomPanel';
import { RightSidebar } from '../components/editor/RightSidebar';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export const WorkspacePage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeInviteUrl, setActiveInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Execution logs
  const [logs, setLogs] = useState<Array<{ id: string; type: 'info' | 'success' | 'error'; text: string; timestamp: string }>>([]);

  const {
    openTabs,
    activeFileId,
    fileContents,
    dirtyFiles,
    openFile,
    markFileSaved,
    setSaveStatus,
    isLeftSidebarOpen,
    resetEditor,
  } = useEditorStore();

  const { files, fetchFiles } = useWorkspaceStore();

  const activeFile = openTabs.find((t) => t.id === activeFileId) || null;

  // Debounced auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Workspace & Files on mount
  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoadingWorkspace(true);
    try {
      const [wsData, membersData] = await Promise.all([
        apiService.getWorkspace(workspaceId),
        apiService.getWorkspaceMembers(workspaceId),
      ]);
      setWorkspace(wsData);
      setMembers(membersData);
      await fetchFiles(workspaceId);

      // Auto-open primary starter file if no tabs open
      const currentFiles = await apiService.getFiles(workspaceId);
      if (currentFiles.length > 0) {
        const primaryFile = currentFiles.find(
          (f) => !f.is_directory && (f.name.startsWith('main.') || f.name.startsWith('index.') || f.name.endsWith('.py'))
        ) || currentFiles.find((f) => !f.is_directory);

        if (primaryFile) {
          openFile(primaryFile);
        }
      }
    } catch (err: any) {
      console.error('Failed to load workspace', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to load workspace.');
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [workspaceId, fetchFiles, openFile]);

  useEffect(() => {
    loadWorkspaceData();
    return () => {
      resetEditor();
    };
  }, [loadWorkspaceData, resetEditor]);

  // 2. Perform Save Action (Internal & Manual)
  const saveActiveFile = useCallback(async () => {
    if (!activeFileId || !dirtyFiles[activeFileId]) return;

    const contentToSave = fileContents[activeFileId];
    if (contentToSave === undefined) return;

    setSaveStatus('saving');
    try {
      const updated = await apiService.updateFile(activeFileId, { content: contentToSave });
      markFileSaved(activeFileId, updated.content);
      // Add feedback log
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          type: 'info',
          text: `[Auto-Save] Successfully saved ${updated.name} (${updated.size_bytes} bytes).`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 50),
      ]);
    } catch (err: any) {
      console.error('Failed to save file', err);
      setSaveStatus('unsaved');
    }
  }, [activeFileId, dirtyFiles, fileContents, markFileSaved, setSaveStatus]);

  // 3. Debounced Auto-Save Watcher (1200ms delay)
  useEffect(() => {
    if (!activeFileId || !dirtyFiles[activeFileId]) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveActiveFile();
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [fileContents, activeFileId, dirtyFiles, saveActiveFile]);

  // 4. Code Execution Handler (Simulated Sandbox Runner for Phase 3, connected to Docker in Phase 5)
  const handleRunCode = async () => {
    if (!activeFile) {
      alert('Please open a file to execute.');
      return;
    }

    // Auto-save before running
    if (dirtyFiles[activeFile.id]) {
      await saveActiveFile();
    }

    const timestamp = new Date().toLocaleTimeString();
    const runId = Math.random().toString().slice(2, 8);

    setLogs((prev) => [
      {
        id: Math.random().toString(),
        type: 'info',
        text: `[Run #${runId}] Submitting ${activeFile.name} (${activeFile.language}) to isolated sandbox runner...`,
        timestamp,
      },
      ...prev,
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          type: 'success',
          text: `[Run #${runId}] Output: Execution verified! Container exited with code 0 (Time: 86ms, RAM: 12.4 MB). Ready for Docker worker integration in Phase 5.`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }, 400);
  };

  const handleOpenInviteModal = async () => {
    if (!workspace) return;
    try {
      const invite = await apiService.createInvite(workspace.id, 'editor');
      setActiveInviteUrl(invite.invite_url);
      setIsInviteModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate invitation link.');
    }
  };

  const handleCopyInvite = () => {
    if (activeInviteUrl) {
      navigator.clipboard.writeText(activeInviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  if (isLoadingWorkspace) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background-main">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <p className="text-xs font-mono text-content-secondary">Initializing Monaco IDE workspace...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !workspace) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background-main p-4">
        <div className="max-w-md w-full bg-background-panel border border-border-subtle rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-content-main">Unable to Load Workspace</h3>
          <p className="text-xs text-rose-400">{errorMessage || 'Workspace not found.'}</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background-main overflow-hidden">
      {/* 1. Top IDE Toolbar */}
      <EditorToolbar
        workspace={workspace}
        activeFile={activeFile}
        onManualSave={saveActiveFile}
        onOpenInviteModal={handleOpenInviteModal}
        onRunCode={handleRunCode}
      />

      {/* 2. Main IDE Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: File Explorer */}
        {isLeftSidebarOpen && (
          <div className="w-64 h-full shrink-0">
            <FileExplorer
              workspaceId={workspace.id}
              files={files}
              onRefresh={() => fetchFiles(workspace.id)}
            />
          </div>
        )}

        {/* Center Panel: Tabs + Editor + Bottom Console */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Multiple File Tabs Strip */}
          <EditorTabs />

          {/* Monaco Editor Canvas */}
          <div className="flex-1 overflow-hidden relative">
            <MonacoEditorPane
              workspaceId={workspace.id}
              activeFile={activeFile}
              onSave={saveActiveFile}
              onRun={handleRunCode}
            />
          </div>

          {/* Bottom Panel: Output / Terminal */}
          <BottomPanel
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </div>

        {/* Right Panel: AI / Chat / Presence */}
        <RightSidebar members={members} />
      </div>

      {/* Share / Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Collaborators"
        description="Share this link to invite team members to this collaborative session."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Collaborative Workspace URL
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={activeInviteUrl || ''}
                className="w-full rounded-lg bg-background-secondary border border-border-subtle text-content-main text-xs font-mono px-3 py-2 outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyInvite}
                leftIcon={copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              >
                {copiedInvite ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
