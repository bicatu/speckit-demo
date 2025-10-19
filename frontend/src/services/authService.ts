import {
  AuthenticatedUser,
  LoginResponse,
  CallbackResponse,
  MeResponse,
  LogoutResponse,
} from '../types/auth';

/**
 * Authentication service for frontend
 * 
 * DESIGN NOTE: This service is intentionally provider-agnostic.
 * It calls generic /api/auth/* endpoints without any knowledge of whether
 * the backend is using Keycloak, WorkOS, or another OAuth provider.
 * The backend's AuthProviderFactory handles provider-specific logic,
 * allowing the frontend to work with any OAuth2/OIDC provider without changes.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get authorization URL from backend to initiate login flow
 * @param returnUrl - URL to redirect to after successful login
 * @returns Authorization URL and state for CSRF protection
 */
export async function login(returnUrl: string = '/'): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(errorData.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  
  // Redirect to auth provider
  window.location.href = data.authUrl;
  
  return data;
}

/**
 * Handle OAuth callback - exchange authorization code for access token
 * @param code - Authorization code from OAuth provider
 * @param state - State parameter for CSRF protection
 * @returns Access token, user info, and return URL
 */
export async function handleCallback(code: string, state: string): Promise<CallbackResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(errorData.error || 'Authentication failed');
  }

  const data: CallbackResponse = await response.json();
  
  // Store access token in memory (will be managed by AuthContext)
  sessionStorage.setItem('accessToken', data.accessToken);
  
  return data;
}

/**
 * Get current authenticated user from backend
 * @returns Current user information
 * @throws Error if not authenticated
 */
export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const token = sessionStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No access token');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    // Clear invalid token
    sessionStorage.removeItem('accessToken');
    throw new Error('Not authenticated');
  }

  const data: MeResponse = await response.json();
  return data.user;
}

/**
 * Logout current user
 * @returns Logout result with optional logout URL for provider
 */
export async function logout(): Promise<LogoutResponse> {
  const token = sessionStorage.getItem('accessToken');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Logout request failed:', response.status);
    }

    const data: LogoutResponse = await response.json().catch(() => ({ success: true }));
    
    // Clear token regardless of backend response
    sessionStorage.removeItem('accessToken');
    
    // Redirect to provider logout if URL provided
    if (data.logoutUrl) {
      window.location.href = data.logoutUrl;
    }
    
    return data;
  } catch (err) {
    // Clear token even if request fails
    sessionStorage.removeItem('accessToken');
    console.error('Logout error:', err);
    return { success: true };
  }
}
