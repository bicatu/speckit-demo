import { IAuthProvider, AuthUser } from './IAuthProvider';
import { WorkOS } from '@workos-inc/node';

/**
 * WorkOS authentication provider
 * Wraps WorkOS SDK to implement IAuthProvider interface
 */
export class WorkOSAuthProvider implements IAuthProvider {
  private readonly workos: WorkOS;
  private readonly clientId: string;

  constructor(apiKey: string, clientId: string) {
    this.workos = new WorkOS(apiKey, { clientId });
    this.clientId = clientId;
  }

  /**
   * Verify WorkOS access token
   */
  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    try {
      const { sid, sub } = await this.workos.userManagement.verifyAccessToken(
        accessToken,
      );

      // WorkOS doesn't include user details in token verification
      // We only get sub (user ID) and sid (session ID)
      // Additional user info would need to be fetched from WorkOS API or database
      return {
        sub,
        // TODO: Fetch user details from WorkOS or database
        // For now, we'll need to query the database for admin status
        isAdmin: undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Generate WorkOS authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    return this.workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens using WorkOS
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
    try {
      const { accessToken, refreshToken, user } =
        await this.workos.userManagement.authenticateWithCode({
          code,
          clientId: this.clientId,
        });

      return {
        accessToken,
        refreshToken,
        expiresIn: undefined, // WorkOS doesn't provide expires_in
        user: {
          sub: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          // Admin status needs to be determined from database
          isAdmin: undefined,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }
      throw new Error('Authentication failed');
    }
  }

  /**
   * Refresh WorkOS access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const response = await this.workos.userManagement.refreshToken({
        refreshToken,
        clientId: this.clientId,
      });

      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get WorkOS logout URL
   * Note: WorkOS uses session management, logout URL may vary
   */
  getLogoutUrl(redirectUri?: string): string {
    // WorkOS logout is typically handled through session management
    // This is a simplified implementation
    return redirectUri || '/';
  }
}
