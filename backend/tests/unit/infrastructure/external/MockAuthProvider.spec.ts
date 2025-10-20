import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockAuthProvider } from '../../../../src/infrastructure/external/MockAuthProvider';
import * as crypto from 'crypto';

describe('MockAuthProvider', () => {
  let provider: MockAuthProvider;

  beforeEach(() => {
    provider = new MockAuthProvider();
  });

  describe('PKCE Support', () => {
    describe('getAuthorizationUrl', () => {
      it('should generate authorization URL without PKCE', () => {
        const redirectUri = 'http://localhost:3000/callback';
        const state = 'test-state';

        const url = provider.getAuthorizationUrl(redirectUri, state);

        expect(url).toContain('code=');
        expect(url).toContain('redirect_uri=');
        expect(url).toContain('state=test-state');
      });

      it('should generate authorization URL with PKCE parameters', () => {
        const redirectUri = 'http://localhost:3000/callback';
        const state = 'test-state';
        const codeChallenge = 'test-challenge';

        const url = provider.getAuthorizationUrl(redirectUri, state, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        expect(url).toContain('code=');
        expect(url).toContain('redirect_uri=');
        expect(url).toContain('state=test-state');
      });

      it('should store code_challenge for PKCE validation', async () => {
        const redirectUri = 'http://localhost:3000/callback';
        const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        // Extract code from URL
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        // Should require code_verifier
        await expect(
          provider.authenticateWithCode(code, redirectUri),
        ).rejects.toThrow('PKCE code_verifier is required');
      });
    });

    describe('authenticateWithCode', () => {
      it('should succeed without PKCE when no challenge was provided', async () => {
        const redirectUri = 'http://localhost:3000/callback';
        const url = provider.getAuthorizationUrl(redirectUri);

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        const result = await provider.authenticateWithCode(code, redirectUri);

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('sub');
        expect(result.user).toHaveProperty('email');
      });

      it('should validate PKCE code_verifier when challenge was provided', async () => {
        const redirectUri = 'http://localhost:3000/callback';

        // Generate real PKCE parameters
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);

        // Get authorization URL with PKCE
        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        // Should succeed with correct verifier
        const result = await provider.authenticateWithCode(
          code,
          redirectUri,
          codeVerifier,
        );

        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('user');
      });

      it('should reject invalid code_verifier', async () => {
        const redirectUri = 'http://localhost:3000/callback';
        const codeChallenge = generateCodeChallenge('valid-verifier');

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        // Should reject with wrong verifier
        await expect(
          provider.authenticateWithCode(code, redirectUri, 'wrong-verifier'),
        ).rejects.toThrow('PKCE validation failed');
      });

      it('should require code_verifier when challenge was provided', async () => {
        const redirectUri = 'http://localhost:3000/callback';
        const codeChallenge = generateCodeChallenge('test-verifier');

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        // Should reject without verifier
        await expect(
          provider.authenticateWithCode(code, redirectUri),
        ).rejects.toThrow('PKCE code_verifier is required');
      });

      it('should clean up code_challenge after successful validation', async () => {
        const redirectUri = 'http://localhost:3000/callback';
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        // First authentication should succeed
        await provider.authenticateWithCode(code, redirectUri, codeVerifier);

        // Second authentication with same code should fail (no PKCE stored)
        const result = await provider.authenticateWithCode(code, redirectUri);

        // Should succeed because no PKCE challenge is stored anymore
        expect(result).toHaveProperty('accessToken');
      });

      it('should handle code_challenge with special characters', async () => {
        const redirectUri = 'http://localhost:3000/callback';
        const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
        const codeChallenge = generateCodeChallenge(codeVerifier);

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        const result = await provider.authenticateWithCode(
          code,
          redirectUri,
          codeVerifier,
        );

        expect(result).toHaveProperty('accessToken');
      });
    });

    describe('PKCE RFC 7636 Compliance', () => {
      it('should validate using SHA256 hashing', async () => {
        const redirectUri = 'http://localhost:3000/callback';

        // Test vector from RFC 7636 Appendix B
        const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
        const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge: expectedChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        // Should succeed with RFC test vector
        const result = await provider.authenticateWithCode(
          code,
          redirectUri,
          codeVerifier,
        );

        expect(result).toHaveProperty('accessToken');
      });

      it('should validate base64url encoding', async () => {
        const redirectUri = 'http://localhost:3000/callback';

        // Generate verifier with base64url-safe characters
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = generateCodeChallenge(codeVerifier);

        const url = provider.getAuthorizationUrl(redirectUri, undefined, {
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code')!;

        const result = await provider.authenticateWithCode(
          code,
          redirectUri,
          codeVerifier,
        );

        expect(result).toHaveProperty('accessToken');
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should accept valid tokens', async () => {
      const user = await provider.verifyAccessToken('user-123');

      expect(user).toHaveProperty('sub', 'user-123');
      expect(user).toHaveProperty('email');
      expect(user.isAdmin).toBe(false);
    });

    it('should identify admin tokens', async () => {
      const user = await provider.verifyAccessToken('admin-test');

      expect(user).toHaveProperty('sub', 'admin-test');
      expect(user.isAdmin).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      await expect(provider.verifyAccessToken('invalid')).rejects.toThrow(
        'Invalid or expired access token',
      );
    });

    it('should reject expired tokens', async () => {
      await expect(provider.verifyAccessToken('expired')).rejects.toThrow(
        'Invalid or expired access token',
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const result = await provider.refreshAccessToken('refresh-abc123');

      expect(result).toHaveProperty('accessToken', 'abc123');
      expect(result).toHaveProperty('refreshToken', 'refresh-abc123');
      expect(result).toHaveProperty('expiresIn', 3600);
    });
  });

  describe('getLogoutUrl', () => {
    it('should return redirect URI', () => {
      const url = provider.getLogoutUrl('http://localhost:3000/');

      expect(url).toBe('http://localhost:3000/');
    });

    it('should return default URL when no redirect URI provided', () => {
      const url = provider.getLogoutUrl();

      expect(url).toBe('http://localhost:3000/');
    });
  });
});

// Helper functions matching frontend implementation
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}
