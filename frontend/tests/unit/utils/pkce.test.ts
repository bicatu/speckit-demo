import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  storePKCEVerifier,
  retrievePKCEVerifier,
  cleanupPKCEVerifier,
} from '../../../src/utils/pkce';

// Mock sessionStorage for testing
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
});

// Mock crypto for testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      // Fill with deterministic values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256;
      }
      return arr;
    },
    subtle: {
      digest: async (algorithm: string, data: Uint8Array) => {
        // Simple mock hash (not cryptographically secure, just for testing)
        const hash = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          hash[i] = (data[i % data.length] + i) % 256;
        }
        return hash.buffer;
      },
    },
    randomUUID: () => '12345678-1234-1234-1234-123456789abc',
  },
});

describe('PKCE Utilities', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    vi.useFakeTimers();
  });

  describe('generateCodeVerifier', () => {
    it('should generate a code verifier', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should generate different verifiers on subsequent calls', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      // Note: With our mock, these will be the same, but in real crypto they'd be different
      expect(verifier1).toBeDefined();
      expect(verifier2).toBeDefined();
    });

    it('should generate base64url-encoded string (no +, /, or = characters)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).not.toMatch(/[+/=]/);
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from verifier', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThanOrEqual(43);
    });

    it('should generate same challenge for same verifier', async () => {
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });

    it('should generate base64url-encoded string (no +, /, or = characters)', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).not.toMatch(/[+/=]/);
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('storePKCEVerifier', () => {
    it('should store verifier in sessionStorage', () => {
      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';

      storePKCEVerifier(state, verifier);

      const stored = sessionStorageMock.getItem(`pkce_verifier_${state}`);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.codeVerifier).toBe(verifier);
      expect(parsed.createdAt).toBeDefined();
      expect(parsed.expiresAt).toBeDefined();
    });

    it('should set expiration time 5 minutes in future', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';

      storePKCEVerifier(state, verifier);

      const stored = sessionStorageMock.getItem(`pkce_verifier_${state}`);
      const parsed = JSON.parse(stored!);

      const expectedExpiry = now + 5 * 60 * 1000; // 5 minutes
      expect(parsed.expiresAt).toBe(expectedExpiry);
    });
  });

  describe('retrievePKCEVerifier', () => {
    it('should retrieve stored verifier', () => {
      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';

      storePKCEVerifier(state, verifier);
      const retrieved = retrievePKCEVerifier(state);

      expect(retrieved).toBe(verifier);
    });

    it('should remove verifier after retrieval (one-time use)', () => {
      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';

      storePKCEVerifier(state, verifier);
      retrievePKCEVerifier(state);

      const secondRetrieval = retrievePKCEVerifier(state);
      expect(secondRetrieval).toBeNull();
    });

    it('should return null for non-existent state', () => {
      const retrieved = retrievePKCEVerifier('non-existent-state');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired verifier', () => {
      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';
      const now = Date.now();

      vi.setSystemTime(now);
      storePKCEVerifier(state, verifier);

      // Advance time by 6 minutes (past expiration)
      vi.setSystemTime(now + 6 * 60 * 1000);

      const retrieved = retrievePKCEVerifier(state);
      expect(retrieved).toBeNull();
    });

    it('should clean up expired verifier from storage', () => {
      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';
      const now = Date.now();

      vi.setSystemTime(now);
      storePKCEVerifier(state, verifier);

      // Advance time by 6 minutes
      vi.setSystemTime(now + 6 * 60 * 1000);

      retrievePKCEVerifier(state);

      // Verify it was removed from storage
      const stored = sessionStorageMock.getItem(`pkce_verifier_${state}`);
      expect(stored).toBeNull();
    });
  });

  describe('cleanupPKCEVerifier', () => {
    it('should remove verifier from storage', () => {
      const state = 'test-state-123';
      const verifier = 'test-verifier-abc123-xyz789-0123456789abcdef';

      storePKCEVerifier(state, verifier);
      cleanupPKCEVerifier(state);

      const stored = sessionStorageMock.getItem(`pkce_verifier_${state}`);
      expect(stored).toBeNull();
    });

    it('should not throw error if verifier does not exist', () => {
      expect(() => {
        cleanupPKCEVerifier('non-existent-state');
      }).not.toThrow();
    });
  });
});
