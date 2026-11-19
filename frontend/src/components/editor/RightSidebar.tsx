import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  Users,
  X,
  Send,
  Bot,
  Loader2,
  Bug,
  Zap,
  CheckSquare,
  FileSearch,
  Cpu,
  ArrowRight,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  Settings,
  Check,
  UserMinus,
  LogOut,
  Shield,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';
import { WorkspaceMember, Workspace } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { apiService, AIResponse, ChatMessage } from '../../services/api';
import { DiffViewerModal } from './DiffViewerModal';

export interface RightSidebarProps {
  members: WorkspaceMember[];
  workspaceId?: string;
  onRefreshMembers?: () => void;
  currentWorkspace?: Workspace | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  members,
  workspaceId: propWorkspaceId,
  onRefreshMembers,
  currentWorkspace,
}) => {
  const { id: paramWorkspaceId } = useParams<{ id: string }>();
  const workspaceId = propWorkspaceId || paramWorkspaceId || '';
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const {
    isRightSidebarOpen,
    toggleRightSidebar,
    activeRightTab,
    setActiveRightTab,
    openTabs,
    activeFileId,
    fileContents,
    applyCodeToActiveEditor,
  } = useEditorStore();

  // AI state
  const [instruction, setInstruction] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // AI Provider & Key configuration
  const [aiProvider, setAiProvider] = useState<'mock' | 'gemini' | 'openai'>(() => {
    try {
      return (localStorage.getItem('codesync_ai_provider') as any) || 'mock';
    } catch {
      return 'mock';
    }
  });

  const [aiApiKey, setAiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('codesync_ai_key') || '';
    } catch {
      return '';
    }
  });

  const [showAiSettings, setShowAiSettings] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Poll chat messages when chat tab is active
  React.useEffect(() => {
    if (!workspaceId || activeRightTab !== 'chat') return;

    let isMounted = true;
    const fetchChat = async () => {
      try {
        const msgs = await apiService.getMessages(workspaceId);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Failed to load chat messages:', err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workspaceId, activeRightTab]);

  React.useEffect(() => {
    if (activeRightTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeRightTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat || !workspaceId) return;

    const content = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);

    try {
      const newMsg = await apiService.sendMessage(workspaceId, content);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const activeFile = openTabs.find((f) => f.id === activeFileId);
  const activeCode = (activeFileId && fileContents[activeFileId] !== undefined)
    ? fileContents[activeFileId]
    : (activeFile?.content || '');
  const activeLanguage = activeFile?.language || 'python';

  const handleRunAIAction = async (
    action: 'explain' | 'debug' | 'generate' | 'optimize' | 'review' | 'complexity' | 'tests',
    customPrompt?: string
  ) => {
    if (!workspaceId) {
      setAiError('Workspace context missing.');
      return;
    }

    setIsLoadingAI(true);
    setAiError(null);
    setAppliedSuccess(false);

    try {
      const res = await apiService.queryAI({
        workspace_id: workspaceId,
        action,
        code: activeCode || '# No code in current file',
        language: activeLanguage,
        instruction: customPrompt || instruction,
        provider: aiProvider !== 'mock' ? aiProvider : undefined,
        api_key: aiApiKey.trim() || undefined,
      });

      setAiResponse(res);
      if (customPrompt) {
        setInstruction('');
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      const detail = err.response?.data?.detail || err.message || 'AI request failed.';
      setAiError(detail);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const hasDiffToReview = Boolean(
    aiResponse?.suggested_code &&
    aiResponse.suggested_code.trim() !== (activeCode || '').trim()
  );

  const isCurrentUserOwner =
    currentWorkspace?.owner_id === user?.id ||
    members.some((m) => m.user_id === user?.id && m.role === 'owner');

  const handleKickMember = async (targetMember: WorkspaceMember) => {
    if (!workspaceId) return;
    const confirm = window.confirm(
      `Are you sure you want to remove "${targetMember.username}" from this workspace?\n\nThe workspace invitation code will be rotated immediately so they cannot re-join with the old link.`
    );
    if (!confirm) return;

    setIsRemoving(targetMember.user_id);
    try {
      await apiService.removeMember(workspaceId, targetMember.user_id);
      if (onRefreshMembers) {
        onRefreshMembers();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!workspaceId) return;
    const confirm = window.confirm(
      'Are you sure you want to leave this workspace?\n\nYou will lose access and need a new invitation link from the owner to re-join.'
    );
    if (!confirm) return;

    setIsLeaving(true);
    try {
      await apiService.leaveWorkspace(workspaceId);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to leave workspace.');
      setIsLeaving(false);
    }
  };

  if (!isRightSidebarOpen) return null;

  return (
    <>
      <div className="w-full h-full bg-background-panel flex flex-col select-none overflow-hidden">
        {/* Tab bar */}
        <div className="h-10 px-3 border-b border-border-subtle flex items-center justify-between bg-background-secondary/40">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveRightTab('ai')}
              className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${activeRightTab === 'ai'
                  ? 'text-accent-secondary bg-background-panel font-medium'
                  : 'text-content-secondary hover:text-content-main'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
              AI Assistant
            </button>

            <button
              onClick={() => setActiveRightTab('chat')}
              className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${activeRightTab === 'chat'
                  ? 'text-accent-primary bg-background-panel font-medium'
                  : 'text-content-secondary hover:text-content-main'
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-accent-primary" />
              Chat
            </button>

            <button
              onClick={() => setActiveRightTab('collaborators')}
              className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${activeRightTab === 'collaborators'
                  ? 'text-emerald-400 bg-background-panel font-medium'
                  : 'text-content-secondary hover:text-content-main'
                }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Members ({members.length})
            </button>
          </div>

          <button
            onClick={toggleRightSidebar}
            title="Close Sidebar"
            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-background-hover transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          {/* AI Assistant Tab */}
          {activeRightTab === 'ai' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-3 rounded-xl bg-background-secondary border border-border-subtle space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-content-main">
                  <Bot className="w-4 h-4 text-accent-secondary" />
                  <span>CodeSync AI Pair</span>
                  <button
                    onClick={() => setShowAiSettings(!showAiSettings)}
                    className={`ml-auto p-1 rounded transition-colors text-content-muted hover:text-content-main ${
                      showAiSettings ? 'bg-background-hover text-accent-secondary' : ''
                    }`}
                    title="Configure AI Provider & API Key"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <Badge variant="accent" size="sm" className="text-[10px] capitalize">
                    {aiProvider === 'gemini' ? 'Gemini 1.5' : aiProvider === 'openai' ? 'OpenAI GPT' : 'Heuristic'}
                  </Badge>
                </div>

                {/* AI Configuration Dropdown Box */}
                {showAiSettings && (
                  <div className="p-2.5 rounded-lg bg-background-panel border border-border-subtle space-y-2.5 my-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-content-main">
                      <span>AI Model Engine</span>
                      <span className="text-[10px] text-accent-secondary">Settings</span>
                    </div>

                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        const val = e.target.value as 'mock' | 'gemini' | 'openai';
                        setAiProvider(val);
                        try { localStorage.setItem('codesync_ai_provider', val); } catch {}
                      }}
                      className="w-full bg-background-secondary border border-border-subtle rounded-md px-2 py-1.5 text-xs text-content-main outline-none focus:border-accent-secondary"
                    >
                      <option value="mock">Offline Smart Engine (Free / No Key Required)</option>
                      <option value="gemini">Google Gemini 1.5 (Free AI Studio Key)</option>
                      <option value="openai">OpenAI (ChatGPT / GPT-4o)</option>
                    </select>

                    {aiProvider !== 'mock' && (
                      <div className="space-y-1.5 pt-1 border-t border-border-subtle">
                        <label className="text-[10px] text-content-muted flex items-center justify-between">
                          <span>API Key ({aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'}):</span>
                          {aiProvider === 'gemini' && (
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent-secondary hover:underline"
                            >
                              Get Free Key ↗
                            </a>
                          )}
                        </label>
                        <input
                          type="password"
                          value={aiApiKey}
                          onChange={(e) => {
                            setAiApiKey(e.target.value);
                            try { localStorage.setItem('codesync_ai_key', e.target.value); } catch {}
                          }}
                          placeholder={aiProvider === 'gemini' ? 'Paste AIzaSy... key' : 'Paste sk-... key'}
                          className="w-full bg-background-secondary border border-border-subtle rounded-md px-2 py-1.5 text-xs text-content-main outline-none font-mono focus:border-accent-secondary"
                        />
                        <p className="text-[10px] text-content-muted leading-tight">
                          Key is stored safely in your local browser and sent directly to the AI service.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Real-time code explanation, bug detection, performance optimization, and reviewable diffs.
                </p>
                {activeFile ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-content-muted pt-1 border-t border-border-subtle/50">
                    <FileCode2 className="w-3 h-3 text-accent-primary" />
                    <span className="font-mono text-content-secondary">{activeFile.name}</span>
                    <span>({activeLanguage})</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-400/90 pt-1">
                    No active file open. Open a file to target AI analysis.
                  </div>
                )}
              </div>

              {/* Natural Language Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-content-muted font-mono">
                  Custom Prompt / Code Generation
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. Refactor this to use recursion, or add error handling..."
                    disabled={isLoadingAI}
                    className="w-full bg-background-secondary border border-border-subtle rounded-lg px-2.5 py-2 text-xs text-content-main placeholder:text-content-muted/60 outline-none focus:border-accent-secondary resize-none"
                  />
                  <button
                    onClick={() => handleRunAIAction('generate')}
                    disabled={isLoadingAI || !instruction.trim()}
                    className="absolute right-2 bottom-2.5 p-1 rounded-md bg-accent-secondary hover:bg-accent-secondary/80 text-white disabled:opacity-40 transition-opacity"
                    title="Generate code"
                  >
                    {isLoadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted font-mono">
                  One-Click Actions
                </span>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleRunAIAction('explain')}
                    disabled={isLoadingAI || !activeFile}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main disabled:opacity-40 transition-colors text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent-secondary shrink-0" />
                    <span>Explain</span>
                  </button>

                  <button
                    onClick={() => handleRunAIAction('debug')}
                    disabled={isLoadingAI || !activeFile}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main disabled:opacity-40 transition-colors text-left"
                  >
                    <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Debug</span>
                  </button>

                  <button
                    onClick={() => handleRunAIAction('optimize')}
                    disabled={isLoadingAI || !activeFile}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main disabled:opacity-40 transition-colors text-left"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Optimize</span>
                  </button>

                  <button
                    onClick={() => handleRunAIAction('review')}
                    disabled={isLoadingAI || !activeFile}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main disabled:opacity-40 transition-colors text-left"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Review</span>
                  </button>

                  <button
                    onClick={() => handleRunAIAction('complexity')}
                    disabled={isLoadingAI || !activeFile}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main disabled:opacity-40 transition-colors text-left"
                  >
                    <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Big-O</span>
                  </button>

                  <button
                    onClick={() => handleRunAIAction('tests')}
                    disabled={isLoadingAI || !activeFile}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main disabled:opacity-40 transition-colors text-left"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Unit Tests</span>
                  </button>
                </div>
              </div>

              {/* Status & Error Alerts */}
              {isLoadingAI && (
                <div className="p-3 rounded-lg bg-accent-secondary/10 border border-accent-secondary/30 flex items-center gap-2.5 text-xs text-accent-secondary animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Synthesizing code analysis & review...</span>
                </div>
              )}

              {aiError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">AI Service Notice</p>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">{aiError}</p>
                  </div>
                </div>
              )}

              {appliedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Diff accepted and applied to buffer!</span>
                </div>
              )}

              {/* AI Response Card */}
              {aiResponse && !isLoadingAI && (
                <div className="p-3 rounded-xl bg-background-secondary border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-content-main capitalize flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
                      {aiResponse.action} Result
                    </span>
                    <span className="text-[10px] text-content-muted bg-background-panel px-1.5 py-0.5 rounded border border-border-subtle">
                      {aiResponse.provider}
                    </span>
                  </div>

                  {/* Complexity tags */}
                  {aiResponse.complexity && (
                    <div className="flex items-center gap-2 text-[11px] text-accent-secondary bg-accent-secondary/10 px-2 py-1 rounded border border-accent-secondary/20">
                      <Cpu className="w-3.5 h-3.5 shrink-0" />
                      <span>Time: <strong>{aiResponse.complexity.time_complexity}</strong></span>
                      <span>•</span>
                      <span>Space: <strong>{aiResponse.complexity.space_complexity}</strong></span>
                    </div>
                  )}

                  {/* Explanation text */}
                  <div className="text-xs text-content-secondary leading-relaxed bg-background-panel/60 p-2.5 rounded-lg border border-border-subtle/50 space-y-1.5">
                    <p>{aiResponse.explanation}</p>
                    {aiResponse.reasoning && (
                      <p className="text-[11px] text-content-muted pt-1 border-t border-border-subtle/40">
                        <strong className="text-content-secondary">Reasoning: </strong>
                        {aiResponse.reasoning}
                      </p>
                    )}
                  </div>

                  {/* Risks Alert */}
                  {aiResponse.risks && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong>Risks: </strong>
                        {aiResponse.risks}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for AI Suggested Code */}
                  {hasDiffToReview && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          applyCodeToActiveEditor(aiResponse.suggested_code);
                          setAppliedSuccess(true);
                          apiService.sendAIFeedback(aiResponse.request_id, true).catch(() => {});
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
                        title="Apply code directly to editor without diff modal"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply to Editor</span>
                      </button>

                      <button
                        onClick={() => setIsDiffModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
                      >
                        <span>Review Diff</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Chat Tab */}
          {activeRightTab === 'chat' && (
            <div className="h-full flex flex-col justify-between min-h-[300px]">
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle text-xs text-content-secondary">
                  <span className="font-semibold text-content-main">Workspace Channel</span>
                  <p className="text-[11px] mt-0.5">Discuss logic and pair-program in real-time.</p>
                </div>

                {messages.length === 0 ? (
                  <div className="text-[11px] text-content-muted text-center py-10">
                    No messages yet. Send a message to your team below.
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {messages.map((m) => (
                      <div key={m.id} className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-content-muted">
                          <span className="font-semibold text-accent-primary">{m.username}</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="bg-background-secondary p-2 rounded-lg border border-border-subtle/70 text-content-main break-words">
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="pt-2 border-t border-border-subtle flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-background-secondary border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-content-main outline-none focus:border-accent-primary"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSendingChat || !chatInput.trim()}
                  className="h-7 px-2"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </div>
          )}

          {/* Collaborators Tab */}
          {activeRightTab === 'collaborators' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-accent-primary" />
                  Workspace Members ({members.length})
                </span>
                {isCurrentUserOwner && (
                  <Badge variant="accent" size="sm" className="text-[10px] flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    Owner
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {members.map((member) => {
                  const isSelf = member.user_id === user?.id;
                  const isMemberOwner = member.role === 'owner';

                  return (
                    <div
                      key={member.id}
                      className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle flex items-center justify-between text-xs hover:border-border-focus/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-xs shrink-0 border border-accent-primary/30">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-content-main truncate flex items-center gap-1.5">
                            <span>{member.username}</span>
                            {isSelf && (
                              <span className="text-[9px] px-1 py-0.2 bg-accent-primary/20 text-accent-primary rounded font-mono">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-content-muted capitalize flex items-center gap-1">
                            {isMemberOwner ? (
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" /> Workspace Owner
                              </span>
                            ) : (
                              <span>Collaborator ({member.role})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Owner Kick Button */}
                        {isCurrentUserOwner && !isMemberOwner && !isSelf && (
                          <button
                            onClick={() => handleKickMember(member)}
                            disabled={isRemoving === member.user_id}
                            title={`Kick ${member.username} & rotate invitation link`}
                            className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all text-[11px] flex items-center gap-1 disabled:opacity-50"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Kick</span>
                          </button>
                        )}

                        <Badge variant="success" size="sm" className="text-[10px]">
                          Online
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leave Workspace Button for Non-Owners */}
              {!isCurrentUserOwner && (
                <div className="pt-3 border-t border-border-subtle">
                  <button
                    onClick={handleLeaveWorkspace}
                    disabled={isLeaving}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isLeaving ? 'Leaving Workspace...' : 'Leave Workspace'}</span>
                  </button>
                </div>
              )}

              {/* Security Note */}
              <div className="p-2.5 rounded-lg bg-background-panel border border-border-subtle text-[10px] text-content-muted leading-relaxed">
                <span className="font-semibold text-content-secondary block mb-0.5">🔒 Auto-Rotating Security:</span>
                Removing a member or leaving automatically invalidates prior invitation codes and issues a fresh one to prevent unauthorized re-access.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Non-Destructive Diff Viewer Modal */}
      {aiResponse && (
        <DiffViewerModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          originalCode={activeCode}
          aiResponse={aiResponse}
          language={activeLanguage}
          onApplySuccess={() => setAppliedSuccess(true)}
        />
      )}
    </>
  );
};
