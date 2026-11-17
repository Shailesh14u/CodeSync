import React from 'react';
import { Sparkles, MessageSquare, Users, X, Send, Bot, CheckCircle2 } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { WorkspaceMember } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface RightSidebarProps {
  members: WorkspaceMember[];
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  members,
}) => {
  const { 
    isRightSidebarOpen, 
    toggleRightSidebar, 
    activeRightTab, 
    setActiveRightTab 
  } = useEditorStore();

  if (!isRightSidebarOpen) return null;

  return (
    <div className="w-80 h-full border-l border-border-subtle bg-background-panel flex flex-col select-none shrink-0">
      {/* Tab bar */}
      <div className="h-10 px-3 border-b border-border-subtle flex items-center justify-between bg-background-secondary/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveRightTab('ai')}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              activeRightTab === 'ai'
                ? 'text-accent-secondary bg-background-panel font-medium'
                : 'text-content-secondary hover:text-content-main'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
            AI Assistant
          </button>

          <button
            onClick={() => setActiveRightTab('chat')}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              activeRightTab === 'chat'
                ? 'text-accent-primary bg-background-panel font-medium'
                : 'text-content-secondary hover:text-content-main'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent-primary" />
            Chat
          </button>

          <button
            onClick={() => setActiveRightTab('collaborators')}
            className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              activeRightTab === 'collaborators'
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
      <div className="flex-1 p-3 overflow-y-auto">
        {/* AI Assistant Tab */}
        {activeRightTab === 'ai' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-background-secondary border border-border-subtle space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-content-main">
                <Bot className="w-4 h-4 text-accent-secondary" />
                <span>AI Pair Programmer</span>
                <Badge variant="accent" size="sm" className="ml-auto text-[10px]">Phase 6 Ready</Badge>
              </div>
              <p className="text-[11px] text-content-secondary leading-relaxed">
                Analyze your code, discover optimizations, debug exceptions, and generate test suites with reviewable diffs.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted font-mono">
                Quick Actions
              </span>
              <button
                onClick={() => alert("AI Explain Code is scheduled for Phase 6 LLM integration.")}
                className="w-full text-left p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main transition-colors flex items-center justify-between"
              >
                <span>Explain Selected Code</span>
                <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
              </button>
              <button
                onClick={() => alert("AI Debug Exceptions is scheduled for Phase 6 LLM integration.")}
                className="w-full text-left p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main transition-colors flex items-center justify-between"
              >
                <span>Debug Execution Errors</span>
                <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
              </button>
              <button
                onClick={() => alert("AI Complexity Review is scheduled for Phase 6 LLM integration.")}
                className="w-full text-left p-2 rounded-lg bg-background-secondary hover:bg-background-hover border border-border-subtle text-xs text-content-main transition-colors flex items-center justify-between"
              >
                <span>Analyze Time & Space (Big-O)</span>
                <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
              </button>
            </div>
          </div>
        )}

        {/* Team Chat Tab */}
        {activeRightTab === 'chat' && (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-background-secondary border border-border-subtle text-xs text-content-secondary">
                <span className="font-semibold text-content-main">Workspace Channel</span>
                <p className="text-[11px] mt-0.5">Discuss logic and pair-program in real-time.</p>
              </div>
              <div className="text-[11px] text-content-muted text-center py-8">
                No messages yet. Send a message to your team below.
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-background-secondary border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-content-main outline-none focus:border-accent-primary"
              />
              <Button variant="primary" size="sm" className="h-7 px-2">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Collaborators Tab */}
        {activeRightTab === 'collaborators' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted font-mono">
              Active Members
            </span>
            <div className="space-y-1.5">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-2 rounded-lg bg-background-secondary border border-border-subtle flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-[10px]">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-content-main">{member.username}</div>
                      <div className="text-[10px] text-content-muted capitalize">{member.role}</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm" className="text-[10px]">
                    Online
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
