import { IAuthProvider, AuthUser } from './IAuthProvider';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

/**
 * Keycloak OAuth2/OpenID Connect authentication provider
 */
export class KeycloakAuthProvider implements IAuthProvider {
  private readonly issuerUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly jwksClient: jwksClient.JwksClient;

  constructor(
    issuerUrl: string,
    clientId: string,
    clientSecret: string,
  ) {
    this.issuerUrl = issuerUrl.replace(/\/$/, ''); // Remove trailing slash
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    // Initialize JWKS client for JWT verification
    this.jwksClient = jwksClient({
      jwksUri: `${this.issuerUrl}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
    });
  }

  /**
   * Verify JWT access token using Keycloak's public keys
   */
  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    try {
      // Decode token header to get key ID
      const decodedHeader = jwt.decode(accessToken, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        throw new Error('Invalid token format');
      }

      const kid = decodedHeader.header.kid;
      if (!kid) {
        throw new Error('Token missing key ID');
      }

      // Get signing key from JWKS
      const key = await this.jwksClient.getSigningKey(kid);
      const signingKey = key.getPublicKey();

      // Verify and decode token
      const decoded = jwt.verify(accessToken, signingKey, {
        algorithms: ['RS256'],
        issuer: this.issuerUrl,
        audience: ['account', this.clientId],
      }) as jwt.JwtPayload;

      // Extract user information from token claims
      return {
        sub: decoded.sub!,
        email: decoded.email as string | undefined,
        firstName: decoded.given_name as string | undefined,
        lastName: decoded.family_name as string | undefined,
        // Check for custom is_admin claim or role
        isAdmin: this.extractAdminStatus(decoded),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Extract admin status from token claims
   * Checks for is_admin attribute or admin role
   */
  private extractAdminStatus(payload: jwt.JwtPayload): boolean {
    // Check custom is_admin attribute
    if (typeof payload.is_admin === 'boolean') {
      return payload.is_admin;
    }
    if (payload.is_admin === 'true') {
      return true;
    }

    // Check realm roles
    const realmRoles = payload.realm_access?.roles as string[] | undefined;
    if (realmRoles?.includes('admin')) {
      return true;
    }

    // Check client roles
    const clientRoles = payload.resource_access?.[this.clientId]?.roles as
      | string[]
      | undefined;
    if (clientRoles?.includes('admin')) {
      return true;
    }

    return false;
  }

  /**
   * Generate Keycloak authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      ...(state && { state }),
    });

    return `${this.issuerUrl}/protocol/openid-connect/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
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
      // Exchange code for tokens
      const tokenResponse = await axios.post(
        `${this.issuerUrl}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const {
        access_token,
        refresh_token,
        expires_in,
      } = tokenResponse.data;

      // Verify and decode access token to get user info
      const user = await this.verifyAccessToken(access_token);

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        user,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Token exchange failed: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const tokenResponse = await axios.post(
        `${this.issuerUrl}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const {
        access_token,
        refresh_token,
        expires_in,
      } = tokenResponse.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Token refresh failed: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get Keycloak logout URL
   */
  getLogoutUrl(redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      ...(redirectUri && { post_logout_redirect_uri: redirectUri }),
    });

    return `${this.issuerUrl}/protocol/openid-connect/logout?${params.toString()}`;
  }
}
