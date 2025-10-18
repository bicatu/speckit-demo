import { IAuthProvider, AuthUser } from './IAuthProvider';

/**
 * Mock authentication provider for development and testing
 * Accepts any token and provides configurable user responses
 */
export class MockAuthProvider implements IAuthProvider {
  /**
   * Verify access token (mock implementation)
   * Token format: "user-<id>" or "admin-<id>" or "mock-admin-token"
   * @param accessToken Mock token
   * @returns Mock user information
   */
  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    if (!accessToken || accessToken === 'invalid' || accessToken === 'expired') {
      throw new Error('Invalid or expired access token');
    }

    // Determine if user is admin based on token pattern
    const isAdmin =
      accessToken === 'mock-admin-token' || accessToken.startsWith('admin-');

    // Extract user ID from token (or use token as ID)
    const sub = accessToken;

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
    redirectUri: string,
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
