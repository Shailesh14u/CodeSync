import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Share2, 
  Save, 
  Check, 
  Loader2, 
  Sparkles, 
  Terminal, 
  Sidebar as SidebarIcon,
  MessageSquare,
  Users,
  History,
  Trophy
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Logo } from '../ui/Logo';
import { Workspace, FileItem } from '../../types';
import { useEditorStore } from '../../stores/editorStore';

export interface EditorToolbarProps {
  workspace: Workspace;
  activeFile?: FileItem | null;
  onManualSave: () => void;
  onOpenInviteModal: () => void;
  onRunCode: () => void;
  onOpenVersionHistory?: () => void;
  onOpenInterviewMode?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  workspace,
  activeFile,
  onManualSave,
  onOpenInviteModal,
  onRunCode,
  onOpenVersionHistory,
  onOpenInterviewMode,
}) => {
  const navigate = useNavigate();
  const { 
    saveStatus, 
    setLanguage,
    isLeftSidebarOpen, 
    toggleLeftSidebar,
    isBottomPanelOpen, 
    toggleBottomPanel,
    isRightSidebarOpen, 
    toggleRightSidebar,
    activeRightTab,
    setActiveRightTab
  } = useEditorStore();

  const supportedLanguages = [
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
  ];

  return (
    <div className="h-12 border-b border-border-subtle bg-background-panel px-3 flex items-center justify-between select-none shrink-0">
      {/* Left section: Logo, navigation & workspace metadata */}
      <div className="flex items-center gap-2.5">
        <Link to="/" title="CodeSync AI Home" className="transition-transform hover:scale-105 shrink-0">
          <Logo size="sm" showText={false} />
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="h-8 px-2 text-content-muted hover:text-content-main"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <button
          onClick={toggleLeftSidebar}
          className={`p-1.5 rounded transition-colors ${
            isLeftSidebarOpen ? 'text-accent-primary bg-background-hover' : 'text-content-muted hover:text-content-main'
          }`}
          title="Toggle File Explorer"
        >
          <SidebarIcon className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs sm:text-sm text-content-main font-sans tracking-tight">
            {workspace.name}
          </span>
          <Badge variant="outline" size="sm" className="hidden sm:inline-flex text-[10px] font-mono capitalize">
            {workspace.default_language}
          </Badge>
        </div>
      </div>

      {/* Middle section: Save status & Language Selector */}
      <div className="flex items-center gap-3">
        {/* Save Status Indicator */}
        <div 
          onClick={saveStatus === 'unsaved' ? onManualSave : undefined}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors ${
            saveStatus === 'saved'
              ? 'text-emerald-400 bg-emerald-500/10'
              : saveStatus === 'saving'
              ? 'text-accent-primary bg-accent-primary/10'
              : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          }`}
          title="Click to save immediately (Ctrl+S)"
        >
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </div>

        {/* Language Override Selector */}
        {activeFile && (
          <select
            value={activeFile.language}
            onChange={(e) => setLanguage(activeFile.id, e.target.value)}
            className="bg-background-secondary border border-border-subtle text-content-secondary text-xs rounded px-2 py-1 outline-none font-mono focus:border-accent-primary"
            title="Syntax Language Mode"
          >
            {supportedLanguages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right section: Action Buttons & Panel Toggles */}
      <div className="flex items-center gap-2">
        {/* Version History Button */}
        {onOpenVersionHistory && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-content-secondary hover:text-content-main"
            onClick={onOpenVersionHistory}
            leftIcon={<History className="w-3.5 h-3.5 text-indigo-400" />}
            title="Snapshots & Version History"
          >
            <span className="hidden md:inline">History</span>
          </Button>
        )}

        {/* Interview Mode Button */}
        {onOpenInterviewMode && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            onClick={onOpenInterviewMode}
            leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
            title="Collaborative Interview Challenges"
          >
            <span className="hidden md:inline">Interview</span>
          </Button>
        )}

        {/* Share Button */}
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs px-2.5"
          onClick={onOpenInviteModal}
          leftIcon={<Share2 className="w-3.5 h-3.5 text-accent-secondary" />}
        >
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Run Code Button */}
        <Button
          variant="primary"
          size="sm"
          className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500"
          onClick={onRunCode}
          leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
        >
          Run
        </Button>

        <div className="h-4 w-px bg-border-subtle mx-1" />

        {/* Bottom panel toggle */}
        <button
          onClick={toggleBottomPanel}
          className={`p-1.5 rounded transition-colors ${
            isBottomPanelOpen ? 'text-accent-primary bg-background-hover' : 'text-content-muted hover:text-content-main'
          }`}
          title="Toggle Terminal & Console"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Right sidebar tab toggles */}
        <button
          onClick={() => {
            if (isRightSidebarOpen && activeRightTab === 'ai') {
              toggleRightSidebar();
            } else {
              setActiveRightTab('ai');
            }
          }}
          className={`p-1.5 rounded transition-colors ${
            isRightSidebarOpen && activeRightTab === 'ai'
              ? 'text-accent-secondary bg-background-hover'
              : 'text-content-muted hover:text-content-main'
          }`}
          title="AI Assistant Panel"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (isRightSidebarOpen && activeRightTab === 'chat') {
              toggleRightSidebar();
            } else {
              setActiveRightTab('chat');
            }
          }}
          className={`p-1.5 rounded transition-colors ${
            isRightSidebarOpen && activeRightTab === 'chat'
              ? 'text-accent-primary bg-background-hover'
              : 'text-content-muted hover:text-content-main'
          }`}
          title="Team Chat Panel"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (isRightSidebarOpen && activeRightTab === 'collaborators') {
              toggleRightSidebar();
            } else {
              setActiveRightTab('collaborators');
            }
          }}
          className={`p-1.5 rounded transition-colors ${
            isRightSidebarOpen && activeRightTab === 'collaborators'
              ? 'text-emerald-400 bg-background-hover'
              : 'text-content-muted hover:text-content-main'
          }`}
          title="Collaborators Presence"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
