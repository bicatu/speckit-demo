/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Implements RFC 7636 with SHA256 code challenge method
 */

const VERIFIER_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Base64URL encode (RFC 4648)
 * Standard base64 but with URL-safe characters and no padding
 */
function base64UrlEncode(buffer: Uint8Array): string {
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...buffer));

  // Make URL-safe: replace +/= with -_
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate cryptographically random code_verifier
 * Uses Web Crypto API for secure randomness
 *
 * @returns Base64URL-encoded string (43+ characters)
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes (will become 43+ chars in base64url)
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  return base64UrlEncode(randomBytes);
}

/**
 * Generate code_challenge from code_verifier using SHA256
 *
 * @param codeVerifier - The original verifier string
 * @returns Promise<Base64URL-encoded SHA256 hash>
 */
export async function generateCodeChallenge(
  codeVerifier: string,
): Promise<string> {
  // Convert verifier to UTF-8 bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);

  // Hash with SHA256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Encode as base64url
  return base64UrlEncode(new Uint8Array(hashBuffer));
}

/**
 * Store code_verifier in sessionStorage linked to OAuth state
 *
 * @param state - OAuth state parameter (UUID)
 * @param codeVerifier - Generated verifier to store
 */
export function storePKCEVerifier(state: string, codeVerifier: string): void {
  const storageKey = `pkce_verifier_${state}`;
  const storageValue = {
    codeVerifier,
    createdAt: Date.now(),
    expiresAt: Date.now() + VERIFIER_EXPIRY_MS,
  };

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(storageValue));
  } catch (error) {
    console.error('Failed to store PKCE verifier:', error);
    throw new Error(
      'Unable to store authentication data. Please enable cookies and retry.',
    );
  }
}

/**
 * Retrieve code_verifier from sessionStorage using OAuth state
 * Automatically removes expired or retrieved verifiers
 *
 * @param state - OAuth state parameter from callback
 * @returns code_verifier string or null if not found/expired
 */
export function retrievePKCEVerifier(state: string): string | null {
  const storageKey = `pkce_verifier_${state}`;

  try {
    const storedJson = sessionStorage.getItem(storageKey);
    if (!storedJson) {
      return null;
    }

    const stored = JSON.parse(storedJson);

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      sessionStorage.removeItem(storageKey);
      return null;
    }

    // Clean up after retrieval (one-time use)
    sessionStorage.removeItem(storageKey);

    return stored.codeVerifier;
  } catch (error) {
    console.error('Failed to retrieve PKCE verifier:', error);
    return null;
  }
}

/**
 * Clean up PKCE verifier from storage (manual cleanup)
 *
 * @param state - OAuth state parameter
 */
export function cleanupPKCEVerifier(state: string): void {
  const storageKey = `pkce_verifier_${state}`;
  sessionStorage.removeItem(storageKey);
}
