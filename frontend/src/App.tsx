import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { JoinInvitePage } from './pages/JoinInvitePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

const AppContent: React.FC = () => {
  const { initAuth } = useAuthStore();
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/workspace/');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div
      className={`flex flex-col bg-background-main text-content-main font-sans selection:bg-accent-primary/20 selection:text-white ${
        isWorkspace ? 'h-screen w-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <Navbar />
      <main className={`flex-1 ${isWorkspace ? 'overflow-hidden flex flex-col min-h-0' : ''}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route path="/join/:token" element={<JoinInvitePage />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isWorkspace && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
