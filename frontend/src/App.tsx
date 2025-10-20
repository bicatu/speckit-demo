import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { BrowseEntriesPage } from './pages/BrowseEntriesPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { PendingUsersPage } from './pages/PendingUsersPage';
import { ManageResourcesPage } from './pages/ManageResourcesPage';
import { CallbackPage } from './pages/CallbackPage';
import LoginErrorPage from './pages/LoginErrorPage';
import { LoginButton } from './components/LoginButton';
import { UserProfile } from './components/UserProfile';
import { LogoutButton } from './components/LogoutButton';

/**
 * Header component with authentication-aware navigation
 */
const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  return (
    <nav style={{ 
      padding: '10px 20px', 
      backgroundColor: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
        <Link to="/entries" style={{ marginRight: '15px' }}>Browse</Link>
        {isAuthenticated && <Link to="/entries/add" style={{ marginRight: '15px' }}>Add Entry</Link>}
        {isAdmin && <Link to="/admin" style={{ marginRight: '15px' }}>Admin</Link>}
        {isAdmin && <Link to="/admin/pending-users" style={{ marginRight: '15px' }}>Pending Users</Link>}
        {isAdmin && <Link to="/admin/manage-resources" style={{ marginRight: '15px' }}>Manage Resources</Link>}
        {isAuthenticated && <Link to="/settings" style={{ marginRight: '15px' }}>Settings</Link>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated ? (
          <>
            <UserProfile />
            <LogoutButton />
          </>
        ) : (
          <LoginButton returnUrl={window.location.pathname} />
        )}
      </div>
    </nav>
  );
};

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/login-error" element={<LoginErrorPage />} />
        <Route path="/entries" element={<BrowseEntriesPage />} />
        <Route path="/entries/add" element={isAuthenticated ? <AddEntryPage /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/" replace />} />
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}
        {isAdmin && <Route path="/admin/pending-users" element={<PendingUsersPage />} />}
        {isAdmin && <Route path="/admin/manage-resources" element={<ManageResourcesPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    // Clean up expired PKCE verifiers on app load
    const cleanupExpiredPKCE = () => {
      const prefix = 'pkce_verifier_';
      const keysToRemove: string[] = [];

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(prefix)) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key)!);
            if (Date.now() > data.expiresAt) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Invalid data, remove it
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired entries
      keysToRemove.forEach(key => sessionStorage.removeItem(key));

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired PKCE verifier(s)`);
      }
    };

    cleanupExpiredPKCE();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
