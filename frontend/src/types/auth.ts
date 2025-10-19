/**
 * Authenticated user information returned from backend
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  authUrl: string;
  state: string;
}

/**
 * Callback response from backend
 */
export interface CallbackResponse {
  accessToken: string;
  user: AuthenticatedUser;
  returnUrl: string;
}

/**
 * Current user response from backend
 */
export interface MeResponse {
  user: AuthenticatedUser;
}

/**
 * Logout response from backend
 */
export interface LogoutResponse {
  success: boolean;
  logoutUrl?: string;
}

/**
 * Pending API request for retry after re-authentication
 */
export interface PendingRequest {
  url: string;
  method: string;
  body?: unknown;
  headers: Record<string, string>;
  timestamp: number;
}
