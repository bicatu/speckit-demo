import { z } from 'zod';

/**
 * Environment-specific configuration validation schemas
 * Uses Zod to ensure auth provider environment variables are properly configured
 */

/**
 * Keycloak authentication provider configuration schema
 */
const keycloakSchema = z.object({
  KEYCLOAK_ISSUER_URL: z.string().url('KEYCLOAK_ISSUER_URL must be a valid URL'),
  KEYCLOAK_CLIENT_ID: z.string().min(1, 'KEYCLOAK_CLIENT_ID is required'),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1, 'KEYCLOAK_CLIENT_SECRET is required'),
});

/**
 * WorkOS authentication provider configuration schema
 */
const workosSchema = z.object({
  WORKOS_API_KEY: z
    .string()
    .min(1, 'WORKOS_API_KEY is required')
    .startsWith('sk_', 'WORKOS_API_KEY must start with sk_'),
  WORKOS_CLIENT_ID: z
    .string()
    .min(1, 'WORKOS_CLIENT_ID is required')
    .startsWith('client_', 'WORKOS_CLIENT_ID must start with client_'),
});

/**
 * Validate authentication provider configuration based on AUTH_PROVIDER setting
 * @param provider - The authentication provider type (mock, keycloak, workos)
 * @throws {Error} If validation fails with detailed error message
 */
export function validateAuthConfig(provider: string): void {
  if (provider === 'keycloak') {
    try {
      keycloakSchema.parse({
        KEYCLOAK_ISSUER_URL: process.env.KEYCLOAK_ISSUER_URL,
        KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
        KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
      });
      console.log('✅ Keycloak configuration validated');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
        throw new Error(`Keycloak configuration validation failed:\n${messages}`);
      }
      throw error;
    }
  } else if (provider === 'workos') {
    try {
      workosSchema.parse({
        WORKOS_API_KEY: process.env.WORKOS_API_KEY,
        WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
      });
      console.log('✅ WorkOS configuration validated');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
        throw new Error(`WorkOS configuration validation failed:\n${messages}`);
      }
      throw error;
    }
  } else if (provider === 'mock') {
    console.log('✅ Mock authentication provider selected (no configuration required)');
  } else {
    throw new Error(
      `Unknown AUTH_PROVIDER: ${provider}. Valid options are: mock, keycloak, workos`,
    );
  }
}
