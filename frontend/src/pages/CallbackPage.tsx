import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';

/**
 * CallbackPage - handles OAuth redirect after user authenticates with provider
 * Exchanges authorization code for access token and updates auth state
 */
export const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession, retryPendingRequest } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          setError('Missing authorization code or state');
          setIsProcessing(false);
          return;
        }

        // Exchange code for token
        const result = await authService.handleCallback(code, state);

        // Refresh auth context with new user
        await refreshSession();

        // Retry any pending request that was interrupted by auth expiry
        await retryPendingRequest();

        // Redirect to return URL or home
        navigate(result.returnUrl || '/', { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        console.error('Callback error:', err);
        
        // Extract error details if available
        let errorCode = 'AUTH_FAILED';
        let errorMessage = message;
        
        // Try to parse error response
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as any).response;
          if (response?.data?.error) {
            errorCode = response.data.error;
            errorMessage = response.data.message || message;
          }
        }
        
        // Redirect to error page with details
        navigate(`/login-error?error=${encodeURIComponent(errorCode)}&message=${encodeURIComponent(errorMessage)}`, {
          replace: true,
        });
        return;
      }
    };

    processCallback();
  }, [searchParams, navigate, refreshSession]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Authentication Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '0.5rem 1rem',
            marginTop: '1rem',
            cursor: 'pointer',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Completing Login...</h1>
        <p>Please wait while we complete your authentication.</p>
      </div>
    );
  }

  return null;
};
