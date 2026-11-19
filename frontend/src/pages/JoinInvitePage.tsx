import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

export const JoinInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { joinWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      // Store intended join token in sessionStorage and redirect to login
      if (token) {
        sessionStorage.setItem('pending_join_token', token);
      }
      navigate('/login', { state: { message: 'Please log in to accept this workspace invitation.' } });
      return;
    }

    if (token) {
      joinWorkspace(token)
        .then((ws) => {
          if (ws) {
            setWorkspaceName(ws.name);
            setStatus('success');
            setTimeout(() => {
              navigate(`/workspace/${ws.id}`);
            }, 1200);
          } else {
            setStatus('error');
            setErrorMessage('Invalid or expired invitation token.');
          }
        })
        .catch((err) => {
          setStatus('error');
          setErrorMessage(err.response?.data?.detail || 'Failed to join workspace.');
        });
    }
  }, [token, isAuthenticated, isAuthLoading, joinWorkspace, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            <h3 className="text-base font-semibold text-content-main">Accepting Workspace Invitation...</h3>
            <p className="text-xs text-content-secondary">Validating invitation token and permissions.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <h3 className="text-base font-semibold text-content-main">Successfully Joined!</h3>
            <p className="text-xs text-content-secondary">
              You are now a collaborator on <span className="text-content-main font-medium">{workspaceName}</span>. Redirecting to workspace...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <h3 className="text-base font-semibold text-content-main">Invitation Error</h3>
            <p className="text-xs text-rose-400">{errorMessage}</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
