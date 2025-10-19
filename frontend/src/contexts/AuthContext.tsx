import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser, PendingRequest } from '../types/auth';
import * as authService from '../services/authService';

/**
 * Authentication state
 */
export interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication context methods
 */
export interface AuthContextType extends AuthState {
  login: (returnUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  retryPendingRequest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - manages global authentication state
 * Wraps the application to provide auth context to all components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Refresh the current session by fetching user from backend
   * Called on app initialization and after login callback
   * Verifies cached token validation via GET /api/auth/me
   */
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we have a token before attempting refresh
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Call GET /api/auth/me to validate token (uses cache on backend)
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      // Not authenticated or session expired
      setUser(null);
      console.error('Session refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiate login flow - redirect to auth provider
   */
  const login = async (returnUrl: string = '/') => {
    try {
      setError(null);
      await authService.login(returnUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Logout user and clear session
   */
  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Retry pending request after re-authentication
   * Checks sessionStorage for saved pending request and retries if <5 minutes old
   */
  const retryPendingRequest = async () => {
    const pendingRequestJson = sessionStorage.getItem('pendingRequest');
    if (!pendingRequestJson) {
      return;
    }

    try {
      const pendingRequest: PendingRequest = JSON.parse(pendingRequestJson);
      
      // Check if request is too old (>5 minutes)
      const ageMinutes = (Date.now() - pendingRequest.timestamp) / 60000;
      if (ageMinutes > 5) {
        console.log('Pending request too old, abandoning retry');
        sessionStorage.removeItem('pendingRequest');
        return;
      }

      // Clear pending request first
      sessionStorage.removeItem('pendingRequest');

      // Retry the request using fetch
      const response = await fetch(pendingRequest.url, {
        method: pendingRequest.method,
        headers: {
          ...pendingRequest.headers,
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
        },
        body: pendingRequest.body ? JSON.stringify(pendingRequest.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      console.log('Successfully retried pending request');
    } catch (err) {
      console.error('Failed to retry pending request:', err);
      sessionStorage.removeItem('pendingRequest');
    }
  };

  // Initialize session on mount
  useEffect(() => {
    refreshSession();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshSession,
    clearError,
    retryPendingRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
