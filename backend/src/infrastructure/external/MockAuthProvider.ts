import { IAuthProvider, AuthUser } from './IAuthProvider';

/**
 * Mock authentication provider for development and testing
 * Accepts any token and provides configurable user responses
 */
export class MockAuthProvider implements IAuthProvider {
  /**
   * Verify access token (mock implementation)
   * Token format: 
   * - "user-<id>" or "admin-<id>" or "mock-admin-token" (for string tokens)
   * - Valid UUID format (admin status determined from database)
   * @param accessToken Mock token
   * @returns Mock user information
   */
  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    if (
      !accessToken ||
      accessToken === 'invalid' ||
      accessToken === 'expired' ||
      accessToken.startsWith('invalid-') ||
      accessToken.startsWith('expired-')
    ) {
      throw new Error('Invalid or expired access token');
    }

    // Extract user ID from token (or use token as ID)
    const sub = accessToken;

    // Check if token is a UUID (let database determine admin status)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(accessToken);

    if (isUuid) {
      // For UUID tokens, don't set isAdmin here - let middleware query database
      return {
        sub,
        email: `user-${sub.substring(0, 8)}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        isAdmin: undefined, // Will be determined from database
      };
    }

    // For non-UUID tokens, use token pattern to determine admin status
    const isAdmin =
      accessToken === 'mock-admin-token' || accessToken.startsWith('admin-');

    // Generate mock email
    const email = isAdmin
      ? `admin@example.com`
      : `${sub.replace(/[^a-z0-9]/gi, '')}@example.com`;

    return {
      sub,
      email,
      firstName: isAdmin ? 'Admin' : 'Test',
      lastName: 'User',
      isAdmin,
    };
  }

  /**
   * Generate mock authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      response_type: 'code',
      client_id: 'mock-client',
      ...(state && { state }),
    });

    return `http://localhost:3000/mock/auth?${params.toString()}`;
  }

  /**
   * Mock code exchange - returns mock tokens
   */
  async authenticateWithCode(
    code: string,
    _redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    user: AuthUser;
  }> {
    // In mock mode, code is the user identifier
    const isAdmin = code.startsWith('admin-');
    const sub = code;

    const user: AuthUser = {
      sub,
      email: isAdmin ? 'admin@example.com' : `${sub}@example.com`,
      firstName: isAdmin ? 'Admin' : 'Test',
      lastName: 'User',
      isAdmin,
    };

    return {
      accessToken: sub, // Token is just the user ID
      refreshToken: `refresh-${sub}`,
      expiresIn: 3600,
      user,
    };
  }

  /**
   * Mock token refresh
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    const sub = refreshToken.replace('refresh-', '');

    return {
      accessToken: sub,
      refreshToken: `refresh-${sub}`,
      expiresIn: 3600,
    };
  }

  /**
   * Mock logout URL
   */
  getLogoutUrl(redirectUri?: string): string {
    return redirectUri || 'http://localhost:3000/';
  }
}
