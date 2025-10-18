import { IAuthProvider } from './IAuthProvider';
import { MockAuthProvider } from './MockAuthProvider';
import { KeycloakAuthProvider } from './KeycloakAuthProvider';
import { WorkOSAuthProvider } from './WorkOSAuthProvider';

/**
 * Supported authentication provider types
 */
export type AuthProviderType = 'mock' | 'keycloak' | 'workos';

/**
 * Factory for creating authentication providers based on configuration
 */
export class AuthProviderFactory {
  private static instance: IAuthProvider | null = null;

  /**
   * Get or create authentication provider based on environment configuration
   */
  static getInstance(): IAuthProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Create authentication provider based on AUTH_PROVIDER env variable
   */
  private static createProvider(): IAuthProvider {
    const providerType = (process.env.AUTH_PROVIDER || 'mock').toLowerCase() as AuthProviderType;

    switch (providerType) {
      case 'keycloak':
        return this.createKeycloakProvider();

      case 'workos':
        return this.createWorkOSProvider();

      case 'mock':
      default:
        console.warn('Using MockAuthProvider for authentication - not suitable for production');
        return new MockAuthProvider();
    }
  }

  /**
   * Create Keycloak authentication provider
   */
  private static createKeycloakProvider(): IAuthProvider {
    const issuerUrl = process.env.KEYCLOAK_ISSUER_URL;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!issuerUrl || !clientId || !clientSecret) {
      throw new Error(
        'Keycloak configuration missing: KEYCLOAK_ISSUER_URL, KEYCLOAK_CLIENT_ID, and KEYCLOAK_CLIENT_SECRET must be set',
      );
    }

    console.log(`Using KeycloakAuthProvider with issuer: ${issuerUrl}`);
    return new KeycloakAuthProvider(issuerUrl, clientId, clientSecret);
  }

  /**
   * Create WorkOS authentication provider
   */
  private static createWorkOSProvider(): IAuthProvider {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.WORKOS_CLIENT_ID;

    if (!apiKey || !clientId) {
      throw new Error(
        'WorkOS configuration missing: WORKOS_API_KEY and WORKOS_CLIENT_ID must be set',
      );
    }

    console.log('Using WorkOSAuthProvider');
    return new WorkOSAuthProvider(apiKey, clientId);
  }

  /**
   * Create provider with explicit type (useful for testing)
   */
  static createProviderForType(
    type: AuthProviderType,
    config?: Record<string, string>,
  ): IAuthProvider {
    switch (type) {
      case 'mock':
        return new MockAuthProvider();

      case 'keycloak':
        if (!config?.issuerUrl || !config?.clientId || !config?.clientSecret) {
          throw new Error('Keycloak configuration incomplete');
        }
        return new KeycloakAuthProvider(
          config.issuerUrl,
          config.clientId,
          config.clientSecret,
        );

      case 'workos':
        if (!config?.apiKey || !config?.clientId) {
          throw new Error('WorkOS configuration incomplete');
        }
        return new WorkOSAuthProvider(config.apiKey, config.clientId);

      default:
        throw new Error(`Unknown auth provider type: ${type}`);
    }
  }
}
