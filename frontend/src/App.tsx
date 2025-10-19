import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowseEntriesPage } from './pages/BrowseEntriesPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { CallbackPage } from './pages/CallbackPage';
import LoginErrorPage from './pages/LoginErrorPage';
import { LoginButton } from './components/LoginButton';
import { UserProfile } from './components/UserProfile';
import { LogoutButton } from './components/LogoutButton';

// Placeholder components (will be implemented in subsequent phases)
const HomePage: React.FC = () => <div>Home Page - Coming Soon</div>;

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
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/login-error" element={<LoginErrorPage />} />
        <Route path="/entries" element={<BrowseEntriesPage />} />
        <Route path="/entries/add" element={isAuthenticated ? <AddEntryPage /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/" replace />} />
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
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
