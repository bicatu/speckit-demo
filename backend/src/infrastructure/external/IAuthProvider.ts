/**
 * Authenticated user information from OAuth provider
 */
export interface AuthUser {
  /**
   * Unique identifier from the OAuth provider (sub claim in JWT)
   */
  sub: string;

  /**
   * User's email address
   */
  email?: string;

  /**
   * User's first name
   */
  firstName?: string;

  /**
   * User's last name
   */
  lastName?: string;

  /**
   * Whether user has admin privileges
   * This may come from token claims or need to be fetched from database
   */
  isAdmin?: boolean;
}

/**
 * OAuth authentication provider interface
 * Implementations: WorkOS, Keycloak, Mock
 */
export interface IAuthProvider {
  /**
   * Verify and decode an access token
   * @param accessToken JWT access token to verify
   * @returns Authenticated user information
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(accessToken: string): Promise<AuthUser>;

  /**
   * Generate authorization URL for OAuth flow
   * @param redirectUri URI to redirect after authentication
   * @param state Optional state parameter for CSRF protection
   * @param pkceParams Optional PKCE parameters for enhanced security
   * @returns Authorization URL for user redirect
   */
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: {
      codeChallenge: string;
      codeChallengeMethod: 'S256';
    },
  ): string;

  /**
   * Exchange authorization code for access token and user info
   * @param code Authorization code from OAuth callback
   * @param redirectUri Original redirect URI used in authorization request
   * @param codeVerifier Optional PKCE code verifier for enhanced security
   * @returns Access token and user information
   */
  authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    user: AuthUser;
  }>;

  /**
   * Refresh an expired access token
   * @param refreshToken Refresh token
   * @returns New access token and optionally new refresh token
   */
  refreshAccessToken?(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>;

  /**
   * Get the logout URL for the OAuth provider
   * @param redirectUri Optional URI to redirect after logout
   * @returns Logout URL
   */
  getLogoutUrl?(redirectUri?: string): string;
}
