import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, ChevronRight, LogOut, LayoutDashboard, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'degraded'>('checking');
  const [version, setVersion] = useState<string>('v0.1.0');

  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    apiService.getHealth()
      .then((data) => {
        if (isMounted) {
          setBackendStatus(data.status === 'healthy' ? 'online' : 'degraded');
          if (data.version) setVersion(`v${data.version}`);
        }
      })
      .catch(() => {
        if (isMounted) setBackendStatus('degraded');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background-main/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center text-white shadow-glow-primary transition-transform group-hover:scale-105">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-content-main tracking-tight font-sans">CodeSync AI</span>
                <span className="text-[10px] font-mono text-content-muted px-1.5 py-0.5 rounded bg-background-panel border border-border-subtle">
                  {version}
                </span>
              </div>
            </div>
          </Link>

          {/* System status pill */}
          <div className="hidden md:flex items-center ml-4">
            <Badge
              variant={backendStatus === 'online' ? 'success' : backendStatus === 'checking' ? 'default' : 'warning'}
              size="sm"
              className="gap-1.5"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'online' ? 'bg-status-success animate-pulse' :
                backendStatus === 'checking' ? 'bg-slate-400' : 'bg-status-warning'
              }`} />
              <span className="font-mono text-[11px]">
                {backendStatus === 'online' ? 'API Online' : backendStatus === 'checking' ? 'Checking API...' : 'API Standalone'}
              </span>
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-content-secondary font-medium">
          {isAuthenticated && (
            <Link to="/dashboard" className="text-content-main flex items-center gap-1.5 hover:text-accent-primary transition-colors">
              <LayoutDashboard className="w-4 h-4 text-accent-primary" />
              Dashboard
            </Link>
          )}
          <a href="/#features" className="hover:text-content-main transition-colors">Features</a>
          <a href="/#architecture" className="hover:text-content-main transition-colors">Architecture</a>
          <a href="/#execution" className="hover:text-content-main transition-colors">Code Execution</a>
          <a href="/#ai-assistant" className="hover:text-content-main transition-colors">AI Engine</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/docs', '_blank')}
            className="hidden sm:inline-flex text-content-secondary hover:text-content-main text-xs"
          >
            API Docs
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-panel border border-border-subtle text-xs hover:border-border-light transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-[10px]">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-content-main font-mono">{user?.username}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Log Out"
                className="text-content-muted hover:text-rose-400 p-1.5"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
