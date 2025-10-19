import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';

/**
 * Login Page Component
 * 
 * US2: New User Google Sign-In
 * - Shows login interface for unauthenticated users
 * - Redirects to Keycloak/WorkOS OAuth flow via backend /api/auth/login
 */
export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  // If already authenticated, redirect to home
  if (isAuthenticated && !isLoading) {
    return <Navigate to={returnUrl} replace />;
  }

  const handleLogin = async () => {
    try {
      await login(returnUrl);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '70vh',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        textAlign: 'center',
        backgroundColor: '#fff',
        padding: '3rem 2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: '600' }}>
          Welcome to MovieTrack
        </h1>
        <p style={{ marginBottom: '2rem', color: '#666', fontSize: '1rem' }}>
          Sign in to browse and rate movies
        </p>
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#fff',
            backgroundColor: '#1976d2',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#1565c0';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1976d2';
          }}
        >
          {isLoading ? 'Loading...' : 'Sign In with Google'}
        </button>

        <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#999' }}>
          New users will need administrator approval before accessing the application.
        </p>
      </div>
    </div>
  );
};
