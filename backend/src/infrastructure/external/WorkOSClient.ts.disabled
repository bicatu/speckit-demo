import { WorkOS } from '@workos-inc/node';

/**
 * Singleton WorkOS client for OAuth authentication
 */
export class WorkOSClient {
  private static instance: WorkOS | null = null;

  private constructor() {}

  /**
   * Get or create the WorkOS client instance
   * @returns Configured WorkOS client
   */
  public static getInstance(): WorkOS {
    if (!WorkOSClient.instance) {
      const apiKey = process.env.WORKOS_API_KEY;
      const clientId = process.env.WORKOS_CLIENT_ID;

      if (!apiKey || !clientId) {
        throw new Error('WORKOS_API_KEY and WORKOS_CLIENT_ID must be set in environment variables');
      }

      WorkOSClient.instance = new WorkOS(apiKey, {
        clientId,
      });
    }

    return WorkOSClient.instance;
  }

  /**
   * Generate authorization URL for OAuth flow
   * @param redirectUri URI to redirect after authentication
   * @param state Optional state parameter for CSRF protection
   * @returns Authorization URL for user redirect
   */
  public static getAuthorizationUrl(redirectUri: string, state?: string): string {
    const workos = WorkOSClient.getInstance();
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit',
      redirectUri,
      state,
    });

    return authorizationUrl;
  }

  /**
   * Exchange authorization code for access token and user profile
   * @param code Authorization code from OAuth callback
   * @returns User profile information
   */
  public static async authenticateWithCode(code: string): Promise<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }> {
    const workos = WorkOSClient.getInstance();

    const { accessToken, user } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID!,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Verify access token and get user information
   * @param accessToken JWT access token
   * @returns User information from token
   */
  public static async verifyAccessToken(accessToken: string): Promise<{
    sid: string;
    sub: string;
  }> {
    const workos = WorkOSClient.getInstance();

    const { sid, sub } = await workos.userManagement.verifyAccessToken(accessToken);

    return { sid, sub };
  }
}
