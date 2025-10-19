import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * LoginErrorPage - Displays authentication errors with retry option
 * 
 * Query parameters:
 * - error: Error code (AUTH_FAILED, TOKEN_EXPIRED, etc.)
 * - message: Human-readable error message
 */
const LoginErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const error = searchParams.get('error') || 'UNKNOWN_ERROR';
  const message = searchParams.get('message') || 'An error occurred during authentication';

  const handleRetry = () => {
    // Clear error and redirect to home (which will show login button)
    navigate('/');
  };

  const getErrorTitle = (): string => {
    switch (error) {
      case 'AUTH_FAILED':
        return 'Authentication Failed';
      case 'TOKEN_EXPIRED':
        return 'Session Expired';
      case 'INTERNAL_ERROR':
        return 'Service Unavailable';
      case 'VALIDATION_ERROR':
        return 'Invalid Request';
      default:
        return 'Login Error';
    }
  };

  const getHelpText = (): string => {
    switch (error) {
      case 'AUTH_FAILED':
        return 'Your credentials could not be verified. Please check your username and password.';
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please log in again.';
      case 'INTERNAL_ERROR':
        return 'The authentication service is temporarily unavailable. Please try again in a few moments.';
      default:
        return 'Please try logging in again. If the problem persists, contact support.';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          fontSize: '3rem',
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          ⚠️
        </div>
        
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '0.5rem',
          textAlign: 'center',
          color: '#d32f2f',
        }}>
          {getErrorTitle()}
        </h1>
        
        <p style={{
          color: '#666',
          marginBottom: '1rem',
          textAlign: 'center',
        }}>
          {message}
        </p>
        
        <p style={{
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          {getHelpText()}
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleRetry}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Try Again
          </button>
          
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'transparent',
              color: '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Go Home
          </button>
        </div>
        
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #eee',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.85rem',
            color: '#999',
          }}>
            Need help? Contact{' '}
            <a href="mailto:support@example.com" style={{ color: '#1976d2' }}>
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginErrorPage;
