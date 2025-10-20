import { IAuthProvider, AuthUser } from './IAuthProvider';
import * as crypto from 'crypto';

/**
 * Mock authentication provider for development and testing
 * Accepts any token and provides configurable user responses
 * Supports PKCE for testing OAuth flows
 */
export class MockAuthProvider implements IAuthProvider {
  // In-memory storage for PKCE challenges
  private pkceStore = new Map<
    string,
    { codeChallenge: string; createdAt: number }
  >();
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
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: {
      codeChallenge: string;
      codeChallengeMethod: 'S256';
    },
  ): string {
    const mockCode = crypto.randomBytes(16).toString('hex');

    // Store PKCE challenge if provided
    if (pkceParams) {
      this.pkceStore.set(mockCode, {
        codeChallenge: pkceParams.codeChallenge,
        createdAt: Date.now(),
      });
    }

    const params = new URLSearchParams({
      code: mockCode,
      redirect_uri: redirectUri,
      ...(state && { state }),
    });

    return `${redirectUri}?${params.toString()}`;
  }

  /**
   * Mock code exchange - returns mock tokens
   * Validates PKCE if code_challenge was provided during authorization
   */
  async authenticateWithCode(
    code: string,
    _redirectUri: string,
    codeVerifier?: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    user: AuthUser;
  }> {
    // Validate PKCE if challenge was provided
    const storedPKCE = this.pkceStore.get(code);

    if (storedPKCE) {
      if (!codeVerifier) {
        throw new Error(
          'PKCE code_verifier is required but was not provided',
        );
      }

      // Verify challenge matches verifier
      const computedChallenge = this.generateCodeChallenge(codeVerifier);

      if (computedChallenge !== storedPKCE.codeChallenge) {
        throw new Error(
          'PKCE validation failed: code_verifier does not match code_challenge',
        );
      }

      // Clean up
      this.pkceStore.delete(code);
    }

    // In mock mode, generate a mock user
    const sub = crypto.randomBytes(16).toString('hex');
    const isAdmin = code.includes('admin');

    const user: AuthUser = {
      sub,
      email: isAdmin ? 'admin@example.com' : `user-${sub.substring(0, 8)}@example.com`,
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
   * Generate code_challenge from code_verifier using SHA256
   * Implements RFC 7636 specification
   */
  private generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url'); // Node.js 16+ supports base64url
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
