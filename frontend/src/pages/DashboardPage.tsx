import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  FileCode, 
  Terminal, 
  Clock, 
  Share2, 
  Trash2, 
  ArrowUpRight, 
  Sparkles, 
  Check, 
  Copy,
  Layers,
  Code2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { apiService } from '../services/api';
import { Workspace } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    workspaces, 
    fetchWorkspaces, 
    createWorkspace, 
    deleteWorkspace, 
    joinWorkspace, 
    isLoading 
  } = useWorkspaceStore();
  const navigate = useNavigate();

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeInviteUrl, setActiveInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Form states
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsLang, setNewWsLang] = useState('python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [joinToken, setJoinToken] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) {
      setModalError('Workspace name is required.');
      return;
    }
    setModalError('');
    setIsSubmitting(true);

    const created = await createWorkspace({
      name: newWsName.trim(),
      description: newWsDesc.trim() || undefined,
      default_language: newWsLang,
    });

    setIsSubmitting(false);
    if (created) {
      setIsCreateModalOpen(false);
      setNewWsName('');
      setNewWsDesc('');
      setNewWsLang('python');
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinToken.trim()) {
      setModalError('Invitation token is required.');
      return;
    }
    setModalError('');
    setIsSubmitting(true);

    const joined = await joinWorkspace(joinToken.trim());
    setIsSubmitting(false);
    if (joined) {
      setIsJoinModalOpen(false);
      setJoinToken('');
    }
  };

  const handleGenerateInvite = async (ws: Workspace) => {
    try {
      const invite = await apiService.createInvite(ws.id, 'editor');
      const normalizedUrl = invite.invite_url && !invite.invite_url.includes('localhost')
        ? invite.invite_url
        : `${window.location.origin}/join/${invite.token}`;
      setActiveInviteUrl(normalizedUrl);
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

  const handleDeleteWorkspace = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete workspace "${name}"? This action cannot be undone.`)) {
      await deleteWorkspace(id);
    }
  };

  // Filter workspaces
  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch = ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang = selectedLanguage === 'all' || ws.default_language === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  const languageIcons: Record<string, { icon: string; name: string }> = {
    python: { icon: '🐍', name: 'Python' },
    cpp: { icon: '⚡', name: 'C++' },
    javascript: { icon: '📜', name: 'Node.js' },
    java: { icon: '☕', name: 'Java' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-content-main font-sans tracking-tight">
              Workspaces
            </h1>
            <Badge variant="accent" size="sm">
              {workspaces.length} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-content-secondary">
            Welcome, <span className="text-content-main font-medium">{user?.full_name || user?.username}</span>. Manage your projects and collaborate in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setModalError('');
              setIsJoinModalOpen(true);
            }}
            leftIcon={<Users className="w-4 h-4 text-accent-secondary" />}
          >
            Join with Code
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalError('');
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Workspace
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search workspaces by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-content-muted" />}
          />
        </div>

        {/* Language Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['all', 'python', 'cpp', 'javascript', 'java'].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors capitalize ${
                selectedLanguage === lang
                  ? 'bg-accent-primary text-white font-medium shadow-sm'
                  : 'bg-background-secondary text-content-secondary hover:text-content-main hover:bg-background-hover border border-border-subtle'
              }`}
            >
              {lang === 'all' ? 'All Languages' : lang}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Cards Grid */}
      <div className="mt-8">
        {isLoading && workspaces.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-mono text-content-secondary">Loading workspaces...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-border-subtle bg-background-panel/40 p-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-background-secondary border border-border-subtle flex items-center justify-center text-accent-primary mx-auto mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-content-main">
              {searchQuery ? 'No matching workspaces' : 'No workspaces yet'}
            </h3>
            <p className="mt-1.5 text-xs text-content-secondary max-w-sm mx-auto leading-relaxed">
              {searchQuery 
                ? 'Try adjusting your search query or language filter.' 
                : 'Create your first collaborative workspace or join an existing session with an invite code.'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                className="mt-5"
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Workspace
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((ws) => {
              const langInfo = languageIcons[ws.default_language] || { icon: '📁', name: ws.default_language };

              return (
                <Card
                  key={ws.id}
                  hoverEffect
                  className="flex flex-col justify-between p-5 space-y-4 group relative"
                >
                  {/* Card top */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" title={langInfo.name}>{langInfo.icon}</span>
                        <Badge variant="outline" size="sm" className="font-mono text-[11px] capitalize">
                          {langInfo.name}
                        </Badge>
                      </div>

                      <Badge
                        variant={ws.role === 'owner' ? 'accent' : 'success'}
                        size="sm"
                        className="text-[10px] font-mono capitalize"
                      >
                        {ws.role}
                      </Badge>
                    </div>

                    <h3 className="text-base font-semibold text-content-main font-sans group-hover:text-accent-primary transition-colors line-clamp-1">
                      {ws.name}
                    </h3>
                    <p className="mt-1 text-xs text-content-secondary line-clamp-2 leading-relaxed min-h-[2rem]">
                      {ws.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Card metadata */}
                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-content-muted">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1" title="Files in workspace">
                        <FileCode className="w-3.5 h-3.5" />
                        {ws.files_count}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Collaborators">
                        <Users className="w-3.5 h-3.5" />
                        {ws.members_count}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono">
                      {new Date(ws.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Card bottom actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => navigate(`/workspace/${ws.id}`)}
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      Open IDE
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => handleGenerateInvite(ws)}
                      title="Invite Collaborators"
                    >
                      <Share2 className="w-3.5 h-3.5 text-accent-secondary" />
                    </Button>

                    {ws.role === 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Workspace */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workspace"
        description="Initialize a collaborative development space with starter code and real-time syncing."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          {modalError && (
            <p className="text-xs text-status-error">{modalError}</p>
          )}

          <Input
            label="Workspace Name *"
            placeholder="e.g. Distributed System Lab"
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Description (Optional)
            </label>
            <textarea
              className="w-full rounded-lg bg-background-secondary border border-border-subtle text-content-main placeholder:text-content-muted text-sm px-3.5 py-2 transition-all duration-150 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary resize-none"
              rows={3}
              placeholder="Brief description of the project goal or challenge..."
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Primary Language & Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'python', name: 'Python 3.12', icon: '🐍' },
                { id: 'cpp', name: 'C++ (GCC 13)', icon: '⚡' },
                { id: 'javascript', name: 'Node.js LTS', icon: '📜' },
                { id: 'java', name: 'Java 21', icon: '☕' },
              ].map((template) => (
                <button
                  type="button"
                  key={template.id}
                  onClick={() => setNewWsLang(template.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors text-xs font-mono ${
                    newWsLang === template.id
                      ? 'border-accent-primary bg-accent-primary/10 text-white font-medium'
                      : 'border-border-subtle bg-background-secondary text-content-secondary hover:border-border-light hover:text-content-main'
                  }`}
                >
                  <span className="text-base">{template.icon}</span>
                  <span>{template.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Workspace */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join Workspace"
        description="Enter the 12-character invitation code provided by the workspace owner."
      >
        <form onSubmit={handleJoinWorkspace} className="space-y-4">
          {modalError && (
            <p className="text-xs text-status-error">{modalError}</p>
          )}

          <Input
            label="Invitation Code *"
            placeholder="e.g. 9B1DEB4D3B7D"
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value.toUpperCase())}
            required
            autoFocus
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsJoinModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Join Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Share / Invite */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Collaborators"
        description="Anyone with this link or code can join this workspace as an Editor."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Shareable Invitation Link
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
