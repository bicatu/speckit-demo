import { IAuthProvider, AuthUser } from './IAuthProvider';
// import { WorkOS } from '@workos-inc/node';

/**
 * WorkOS authentication provider
 * Wraps WorkOS SDK to implement IAuthProvider interface
 * 
 * NOTE: This implementation is incomplete as the WorkOS SDK doesn't have
 * a verifyAccessToken method in the current version. You would need to:
 * 1. Verify JWT tokens manually using jose library
 * 2. Use WorkOS JWKS endpoint for verification
 * 3. Or wait for SDK update with token verification support
 * 
 * For now, use MockAuthProvider or KeycloakAuthProvider instead.
 */
export class WorkOSAuthProvider implements IAuthProvider {
  // private readonly workos: WorkOS;
  // private readonly clientId: string;

  constructor(_apiKey: string, _clientId: string) {
    // this.workos = new WorkOS(apiKey, { clientId });
    // this.clientId = clientId;
    throw new Error(
      'WorkOSAuthProvider is not fully implemented. ' +
      'The WorkOS SDK does not provide verifyAccessToken method. ' +
      'Use MockAuthProvider or KeycloakAuthProvider instead.',
    );
  }

  /**
   * Verify WorkOS access token
   */
  async verifyAccessToken(_accessToken: string): Promise<AuthUser> {
    throw new Error('Not implemented');
  }

  /**
   * Generate WorkOS authorization URL
   */
  getAuthorizationUrl(
    _redirectUri: string,
    _state?: string,
    _pkceParams?: {
      codeChallenge: string;
      codeChallengeMethod: 'S256';
    },
  ): string {
    throw new Error('Not implemented');
  }

  /**
   * Exchange authorization code for tokens using WorkOS
   */
  async authenticateWithCode(
    _code: string,
    _redirectUri: string,
    _codeVerifier?: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    user: AuthUser;
  }> {
    throw new Error('Not implemented');
  }

  /**
   * Get WorkOS logout URL
   * Note: WorkOS uses session management, logout URL may vary
   */
  getLogoutUrl(redirectUri?: string): string {
    return redirectUri || '/';
  }
}
