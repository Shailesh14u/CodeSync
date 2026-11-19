import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { useEditorStore } from '../stores/editorStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { apiService } from '../services/api';
import { Workspace, FileItem, WorkspaceMember, ExecutionResponse } from '../types';

import { EditorToolbar } from '../components/editor/EditorToolbar';
import { FileExplorer } from '../components/editor/FileExplorer';
import { EditorTabs } from '../components/editor/EditorTabs';
import { MonacoEditorPane } from '../components/editor/MonacoEditorPane';
import { BottomPanel } from '../components/editor/BottomPanel';
import { RightSidebar } from '../components/editor/RightSidebar';
import { VersionHistoryModal } from '../components/editor/VersionHistoryModal';
import { InterviewModeModal } from '../components/editor/InterviewModeModal';
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [activeInviteUrl, setActiveInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Execution logs & history
  const [logs, setLogs] = useState<Array<{ id: string; type: 'info' | 'success' | 'error' | 'header'; text: string; timestamp: string }>>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResponse[]>([]);

  // Adjustable window dimensions (with local persistence)
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('codesync_ide_left_width');
      return saved ? Math.max(160, Math.min(480, parseInt(saved, 10))) : 240;
    } catch {
      return 240;
    }
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('codesync_ide_right_width');
      return saved ? Math.max(260, Math.min(650, parseInt(saved, 10))) : 340;
    } catch {
      return 340;
    }
  });

  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('codesync_ide_bottom_height');
      return saved ? Math.max(100, Math.min(600, parseInt(saved, 10))) : 220;
    } catch {
      return 220;
    }
  });

  const [isResizing, setIsResizing] = useState<'left' | 'right' | 'bottom' | null>(null);

  const {
    openTabs,
    activeFileId,
    fileContents,
    dirtyFiles,
    openFile,
    markFileSaved,
    setSaveStatus,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    isBottomPanelOpen,
    resetEditor,
  } = useEditorStore();

  const { files, fetchFiles } = useWorkspaceStore();

  const activeFile = openTabs.find((t) => t.id === activeFileId) || null;

  // Debounced auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Resize Drag Listener
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing === 'left') {
        const newWidth = Math.max(160, Math.min(window.innerWidth * 0.45, e.clientX));
        setLeftWidth(newWidth);
        try { localStorage.setItem('codesync_ide_left_width', String(Math.round(newWidth))); } catch {}
      } else if (isResizing === 'right') {
        const newWidth = Math.max(260, Math.min(window.innerWidth * 0.5, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
        try { localStorage.setItem('codesync_ide_right_width', String(Math.round(newWidth))); } catch {}
      } else if (isResizing === 'bottom') {
        const newHeight = Math.max(90, Math.min(window.innerHeight * 0.7, window.innerHeight - e.clientY));
        setBottomHeight(newHeight);
        try { localStorage.setItem('codesync_ide_bottom_height', String(Math.round(newHeight))); } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      // Trigger Monaco editor layout recalculation
      window.dispatchEvent(new Event('resize'));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    if (isResizing === 'bottom') {
      document.body.style.cursor = 'row-resize';
    } else {
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('left');
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('right');
  };

  const handleMouseDownBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('bottom');
  };

  // 1. Load Workspace, Files & History on mount
  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoadingWorkspace(true);
    try {
      const [wsData, membersData, historyData] = await Promise.all([
        apiService.getWorkspace(workspaceId),
        apiService.getWorkspaceMembers(workspaceId),
        apiService.getExecutionHistory(workspaceId).catch(() => []),
      ]);
      setWorkspace(wsData);
      setMembers(membersData);
      setExecutionHistory(historyData);
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
    const editorState = useEditorStore.getState();
    const currentActiveId = editorState.activeFileId;
    if (!currentActiveId || !editorState.dirtyFiles[currentActiveId]) return;

    const contentToSave = editorState.fileContents[currentActiveId];
    if (contentToSave === undefined) return;

    setSaveStatus('saving');
    try {
      const updated = await apiService.updateFile(currentActiveId, { content: contentToSave });
      markFileSaved(currentActiveId, updated.content);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Failed to save file', err);
      setSaveStatus('unsaved');
    }
  }, [markFileSaved, setSaveStatus]);

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

  // 4. Code Execution Handler
  const handleRunCode = async () => {
    const editorState = useEditorStore.getState();
    const currentActiveFile = editorState.openTabs.find((t) => t.id === editorState.activeFileId);

    if (!currentActiveFile || !workspace) {
      alert('Please select and open a file to execute.');
      return;
    }

    // Auto-detect real execution language from file extension
    const lowerName = currentActiveFile.name.toLowerCase();
    let runLanguage = currentActiveFile.language;
    if (lowerName.endsWith('.py')) runLanguage = 'python';
    else if (lowerName.endsWith('.js') || lowerName.endsWith('.jsx')) runLanguage = 'javascript';
    else if (lowerName.endsWith('.ts') || lowerName.endsWith('.tsx')) runLanguage = 'typescript';
    else if (lowerName.endsWith('.cpp') || lowerName.endsWith('.c') || lowerName.endsWith('.h')) runLanguage = 'cpp';
    else if (lowerName.endsWith('.java')) runLanguage = 'java';

    // Auto-save active file if dirty before executing
    if (editorState.dirtyFiles[currentActiveFile.id]) {
      await saveActiveFile();
    }

    // Ensure bottom panel is open and focused on Output tab
    editorState.setActiveBottomTab('output');
    if (!editorState.isBottomPanelOpen) {
      editorState.toggleBottomPanel();
    }

    const timestamp = new Date().toLocaleTimeString();
    const runId = Math.random().toString().slice(2, 8);

    const startEntry = {
      id: Math.random().toString(),
      type: 'header' as const,
      text: `🚀 [Sandbox Execution #${runId}] Running ${currentActiveFile.name} (${runLanguage})...`,
      timestamp,
    };
    setLogs((prev) => [...prev, startEntry]);

    try {
      // Collect workspace files with latest live buffer content
      const filesPayload = editorState.openTabs.map((t) => ({
        name: t.name,
        content: editorState.fileContents[t.id] !== undefined ? editorState.fileContents[t.id] : t.content,
      }));

      // Ensure active file is present with current buffer
      if (!filesPayload.some((f) => f.name === currentActiveFile.name)) {
        filesPayload.push({
          name: currentActiveFile.name,
          content: editorState.fileContents[currentActiveFile.id] !== undefined
            ? editorState.fileContents[currentActiveFile.id]
            : currentActiveFile.content,
        });
      }

      const execResult = await apiService.runCode({
        workspace_id: workspace.id,
        language: runLanguage,
        entrypoint: currentActiveFile.name,
        files: filesPayload,
        timeout_sec: 10,
      });

      // Update history
      setExecutionHistory((prev) => [execResult, ...prev]);

      // Output formatting
      const newLogEntries: Array<{ id: string; type: 'info' | 'success' | 'error' | 'header'; text: string; timestamp: string }> = [];

      if (execResult.stdout && execResult.stdout.trim()) {
        newLogEntries.push({
          id: Math.random().toString(),
          type: 'info',
          text: execResult.stdout.trimEnd(),
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (!execResult.stderr && execResult.exit_code === 0) {
        newLogEntries.push({
          id: Math.random().toString(),
          type: 'info',
          text: '(Program executed successfully with no stdout output)',
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      if (execResult.stderr && execResult.stderr.trim()) {
        newLogEntries.push({
          id: Math.random().toString(),
          type: 'error',
          text: execResult.stderr.trimEnd(),
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      const isSuccess = execResult.status === 'success' && execResult.exit_code === 0;
      newLogEntries.push({
        id: Math.random().toString(),
        type: isSuccess ? 'success' : 'error',
        text: `✨ [Completed in ${execResult.execution_time_ms}ms] Exit code: ${execResult.exit_code} (Status: ${execResult.status.toUpperCase()}) | Memory: ${execResult.memory_used_mb}MB`,
        timestamp: new Date().toLocaleTimeString(),
      });

      setLogs((prev) => [...prev, ...newLogEntries]);
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'error',
          text: `[Execution Failed] ${err.response?.data?.detail || err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleOpenInviteModal = async () => {
    if (!workspace) return;
    try {
      const invite = await apiService.createInvite(workspace.id, 'editor');
      const normalizedUrl = invite.invite_url && !invite.invite_url.includes('localhost')
        ? invite.invite_url
        : `${window.location.origin}/join/${invite.token}`;
      setActiveInviteUrl(normalizedUrl);
      setIsInviteModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate invitation link.');
    }
  };

  const handleRestoreSuccess = async () => {
    if (!workspace) return;
    try {
      const updatedFiles = await apiService.getFiles(workspace.id);
      await fetchFiles(workspace.id);
      const editor = useEditorStore.getState();
      for (const file of updatedFiles) {
        if (editor.openTabs.some((t) => t.id === file.id)) {
          editor.updateFileContent(file.id, file.content);
          editor.markFileSaved(file.id, file.content);
          if (editor.activeFileId === file.id && editor.applyContentHandler) {
            editor.applyContentHandler(file.content);
          }
        }
      }
    } catch (err) {
      console.error('Failed to reload files after restore', err);
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
      <div className="flex-1 w-full flex items-center justify-center bg-background-main">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <p className="text-xs font-mono text-content-secondary">Initializing Monaco IDE workspace...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !workspace) {
    return (
      <div className="flex-1 w-full flex items-center justify-center bg-background-main p-4">
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
    <div className="flex-1 w-full flex flex-col bg-background-main overflow-hidden min-h-0 select-none">
      {/* 1. Top IDE Toolbar */}
      <EditorToolbar
        workspace={workspace}
        activeFile={activeFile}
        onManualSave={saveActiveFile}
        onOpenInviteModal={handleOpenInviteModal}
        onRunCode={handleRunCode}
        onOpenVersionHistory={() => setIsHistoryModalOpen(true)}
        onOpenInterviewMode={() => setIsInterviewModalOpen(true)}
      />

      {/* 2. Main Resizable IDE Workspace Grid */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Panel: File Explorer (Resizable Width) */}
        {isLeftSidebarOpen && (
          <>
            <div style={{ width: leftWidth }} className="h-full shrink-0 flex flex-col overflow-hidden">
              <FileExplorer
                workspaceId={workspace.id}
                files={files}
                onRefresh={() => fetchFiles(workspace.id)}
              />
            </div>

            {/* Draggable Splitter Left */}
            <div
              onMouseDown={handleMouseDownLeft}
              onDoubleClick={() => setLeftWidth(240)}
              className={`w-1.5 h-full relative z-20 cursor-col-resize shrink-0 transition-colors group flex items-center justify-center select-none ${
                isResizing === 'left' ? 'bg-accent-primary' : 'bg-transparent hover:bg-accent-primary/40'
              }`}
              title="Drag to resize File Explorer • Double-click to reset"
            >
              <div className="w-[1px] h-full bg-border-subtle group-hover:bg-accent-primary transition-colors" />
              <div className="absolute flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
                <div className="w-1 h-1 rounded-full bg-accent-primary" />
              </div>
            </div>
          </>
        )}

        {/* Center Panel: Tabs + Editor + Bottom Console (Flex 1) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Multiple File Tabs Strip */}
          <EditorTabs />

          {/* Monaco Editor Canvas */}
          <div className="flex-1 overflow-hidden relative min-h-0">
            <MonacoEditorPane
              workspaceId={workspace.id}
              activeFile={activeFile}
              onSave={saveActiveFile}
              onRun={handleRunCode}
            />
          </div>

          {/* Bottom Panel: Output / Terminal with Top Draggable Splitter */}
          {isBottomPanelOpen && (
            <>
              {/* Draggable Splitter Bottom */}
              <div
                onMouseDown={handleMouseDownBottom}
                onDoubleClick={() => setBottomHeight(220)}
                className={`h-1.5 w-full relative z-20 cursor-row-resize shrink-0 transition-colors group flex items-center justify-center select-none ${
                  isResizing === 'bottom' ? 'bg-accent-primary' : 'bg-transparent hover:bg-accent-primary/40'
                }`}
                title="Drag to resize Output Console • Double-click to reset"
              >
                <div className="h-[1px] w-full bg-border-subtle group-hover:bg-accent-primary transition-colors" />
                <div className="absolute flex flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-1 h-1 rounded-full bg-accent-primary" />
                  <div className="w-1 h-1 rounded-full bg-accent-primary" />
                  <div className="w-1 h-1 rounded-full bg-accent-primary" />
                </div>
              </div>

              {/* Bottom Console Panel Container (Resizable Height) */}
              <div style={{ height: bottomHeight }} className="shrink-0 overflow-hidden flex flex-col">
                <BottomPanel
                  logs={logs}
                  executionHistory={executionHistory}
                  onClearLogs={() => setLogs([])}
                />
              </div>
            </>
          )}
        </div>

        {/* Right Panel: AI Assistant / Team Chat / Collaborators (Resizable Width) */}
        {isRightSidebarOpen && (
          <>
            {/* Draggable Splitter Right */}
            <div
              onMouseDown={handleMouseDownRight}
              onDoubleClick={() => setRightWidth(340)}
              className={`w-1.5 h-full relative z-20 cursor-col-resize shrink-0 transition-colors group flex items-center justify-center select-none ${
                isResizing === 'right' ? 'bg-accent-secondary' : 'bg-transparent hover:bg-accent-secondary/40'
              }`}
              title="Drag to resize Assistant & Chat • Double-click to reset"
            >
              <div className="w-[1px] h-full bg-border-subtle group-hover:bg-accent-secondary transition-colors" />
              <div className="absolute flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="w-1 h-1 rounded-full bg-accent-secondary" />
                <div className="w-1 h-1 rounded-full bg-accent-secondary" />
                <div className="w-1 h-1 rounded-full bg-accent-secondary" />
              </div>
            </div>

            <div style={{ width: rightWidth }} className="h-full shrink-0 flex flex-col overflow-hidden">
              <RightSidebar members={members} workspaceId={workspaceId} />
            </div>
          </>
        )}
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

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        workspaceId={workspace.id}
        onRestoreSuccess={handleRestoreSuccess}
      />

      {/* Coding Challenge / Technical Interview Mode Modal */}
      <InterviewModeModal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        workspaceId={workspace.id}
      />
    </div>
  );
};
