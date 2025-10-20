# PKCE Implementation Quickstart Guide

**Feature**: Add Support for PKCE (Proof Key for Code Exchange)  
**Target Audience**: Developers implementing or maintaining authentication flows  
**Estimated Time**: 2-3 hours for complete implementation  
**Date**: 2025-10-20

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (5 Minutes)](#quick-start-5-minutes)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Implementation](#backend-implementation)
6. [Testing Your Implementation](#testing-your-implementation)
7. [Provider-Specific Setup](#provider-specific-setup)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through adding PKCE support to the existing OpenID Connect authentication flow. PKCE prevents authorization code interception attacks by requiring clients to prove they initiated the OAuth flow.

**What You'll Build**:
- Frontend PKCE utilities (code_verifier generation, SHA256 hashing, storage)
- Backend provider modifications (accepting PKCE parameters)
- End-to-end secure authentication flow

**Architecture**:
```
┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│   Browser   │                  │   Backend   │                  │  Provider   │
│  (React)    │                  │   (Koa)     │                  │ (Keycloak)  │
└──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
       │                                │                                │
       │ 1. Generate verifier           │                                │
       │    & challenge                 │                                │
       │                                │                                │
       │ 2. GET /api/auth/login         │                                │
       │    ?code_challenge=xxx         │                                │
       ├───────────────────────────────►│                                │
       │                                │ 3. Redirect with challenge     │
       │                                ├───────────────────────────────►│
       │                                │                                │
       │ 4. User authenticates          │                                │
       │◄───────────────────────────────┼────────────────────────────────┤
       │                                │                                │
       │ 5. Callback with code          │                                │
       │    + code_verifier             │                                │
       ├───────────────────────────────►│                                │
       │                                │ 6. Token exchange with         │
       │                                │    code_verifier               │
       │                                ├───────────────────────────────►│
       │                                │                                │
       │                                │ 7. Verify challenge matches    │
       │                                │    (SHA256(verifier) ==        │
       │                                │     challenge)                 │
       │                                │◄───────────────────────────────┤
       │                                │                                │
       │ 8. Return tokens               │                                │
       │◄───────────────────────────────┤                                │
```

---

## Prerequisites

**Required**:
- Node.js 22.x LTS
- TypeScript 5.7.2
- Existing OpenID Connect authentication setup
- Browser with Web Crypto API support (all modern browsers)

**Dependencies** (already installed):
- Backend: `koa@2.16.1`, `zod@3.22.4`
- Frontend: `react@18.2.0`
- No additional dependencies needed (uses Web Crypto API)

**Knowledge**:
- Basic OAuth 2.0 flow understanding
- TypeScript/React experience
- Familiarity with existing auth codebase

---

## Quick Start (5 Minutes)

**Step 1**: Install dependencies (if starting fresh)

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

**Step 2**: Verify existing authentication works

```bash
# Start backend
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm run dev

# Test login flow
# Navigate to http://localhost:5173
# Click "Login" button
# Complete authentication
# Verify you can access protected resources
```

**Step 3**: Check provider support

- **Mock Provider**: ✅ Will be updated in this implementation
- **Keycloak v7.0+**: ✅ Native PKCE support (no configuration needed)
- **WorkOS SDK v7.0.0+**: ✅ Native PKCE support

**Step 4**: Create feature branch

```bash
git checkout -b 004-add-support-for
```

You're now ready to implement PKCE!

---

## Frontend Implementation

### Step 1: Create PKCE Utility Module

**File**: `frontend/src/utils/pkce.ts`

```typescript
/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Implements RFC 7636 with SHA256 code challenge method
 */

const VERIFIER_LENGTH = 64; // 43-128 characters allowed
const VERIFIER_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cryptographically random code_verifier
 * Uses Web Crypto API for secure randomness
 * 
 * @returns Base64URL-encoded string (64 characters)
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
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
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
    throw new Error('Unable to store authentication data. Please enable cookies and retry.');
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

/**
 * Base64URL encode (RFC 4648)
 * Standard base64 but with URL-safe characters and no padding
 */
function base64UrlEncode(buffer: Uint8Array): string {
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...buffer));
  
  // Make URL-safe: replace +/= with -_
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

**Test the utility**:

```typescript
// frontend/src/utils/pkce.test.ts
import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

describe('PKCE Utilities', () => {
  it('should generate unique verifiers', () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
    expect(v1.length).toBeGreaterThanOrEqual(43);
  });

  it('should generate deterministic challenge from verifier', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge1 = await generateCodeChallenge(verifier);
    const challenge2 = await generateCodeChallenge(verifier);
    expect(challenge1).toBe(challenge2);
  });
});
```

### Step 2: Update Login Flow

**File**: `frontend/src/hooks/useLogin.ts` (or equivalent)

```typescript
import { generateCodeVerifier, generateCodeChallenge, storePKCEVerifier } from '@/utils/pkce';

export function useLogin() {
  const handleLogin = async () => {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Generate OAuth state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store verifier linked to state
    storePKCEVerifier(state, codeVerifier);
    
    // Redirect to login with PKCE parameters
    const loginUrl = `/api/auth/login?code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;
    window.location.href = loginUrl;
  };
  
  return { handleLogin };
}
```

### Step 3: Update Callback Handler

**File**: `frontend/src/pages/AuthCallbackPage.tsx` (or equivalent)

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { retrievePKCEVerifier, cleanupPKCEVerifier } from '@/utils/pkce';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (!code || !state) {
        console.error('Missing code or state parameter');
        navigate('/login?error=invalid_callback');
        return;
      }
      
      // Retrieve code_verifier
      const codeVerifier = retrievePKCEVerifier(state);
      
      if (!codeVerifier) {
        console.error('PKCE verifier not found or expired');
        navigate('/login?error=pkce_verifier_missing');
        return;
      }
      
      try {
        // Exchange code for tokens with PKCE verifier
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, code_verifier: codeVerifier }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error_description || 'Authentication failed');
        }
        
        const tokens = await response.json();
        
        // Store tokens (implementation-specific)
        localStorage.setItem('access_token', tokens.access_token);
        
        // Navigate to home
        navigate('/');
      } catch (error) {
        console.error('Authentication error:', error);
        
        // Clean up on error
        cleanupPKCEVerifier(state);
        
        navigate('/login?error=auth_failed');
      }
    }
    
    handleCallback();
  }, [searchParams, navigate]);
  
  return <div>Authenticating...</div>;
}
```

---

## Backend Implementation

### Step 1: Update IAuthProvider Interface

**File**: `backend/src/infrastructure/external/IAuthProvider.ts`

```typescript
export interface IAuthProvider {
  /**
   * Generate authorization URL for OAuth flow
   * 
   * @param redirectUri - Callback URL after authentication
   * @param state - CSRF protection token (optional)
   * @param pkceParams - PKCE parameters (optional for backward compatibility)
   */
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: {
      codeChallenge: string;
      codeChallengeMethod: 'S256';
    }
  ): string;

  /**
   * Exchange authorization code for access token
   * 
   * @param code - Authorization code from provider
   * @param redirectUri - Same URI used in authorization request
   * @param codeVerifier - PKCE verifier (optional for backward compatibility)
   */
  authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }>;

  // ... other methods remain unchanged
}
```

### Step 2: Update Keycloak Provider

**File**: `backend/src/infrastructure/external/KeycloakAuthProvider.ts`

```typescript
export class KeycloakAuthProvider implements IAuthProvider {
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: { codeChallenge: string; codeChallengeMethod: 'S256' }
  ): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      ...(state && { state }),
      ...(pkceParams && {
        code_challenge: pkceParams.codeChallenge,
        code_challenge_method: pkceParams.codeChallengeMethod,
      }),
    });

    return `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params}`;
  }

  async authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    const tokenUrl = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }
}
```

### Step 3: Update Mock Provider (for Testing)

**File**: `backend/src/infrastructure/external/MockAuthProvider.ts`

```typescript
import crypto from 'crypto';

export class MockAuthProvider implements IAuthProvider {
  // In-memory storage for PKCE challenges
  private pkceStore = new Map<string, { codeChallenge: string; createdAt: number }>();

  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: { codeChallenge: string; codeChallengeMethod: 'S256' }
  ): string {
    const mockCode = crypto.randomBytes(16).toString('hex');

    // Store PKCE challenge if provided
    if (pkceParams) {
      this.pkceStore.set(mockCode, {
        codeChallenge: pkceParams.codeChallenge,
        createdAt: Date.now(),
      });
    }

    const callbackParams = new URLSearchParams({
      code: mockCode,
      ...(state && { state }),
    });

    return `${redirectUri}?${callbackParams}`;
  }

  async authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    // Validate PKCE if challenge was provided
    const storedPKCE = this.pkceStore.get(code);

    if (storedPKCE) {
      if (!codeVerifier) {
        throw new Error('PKCE code_verifier is required but was not provided');
      }

      // Verify challenge matches verifier
      const computedChallenge = this.generateCodeChallenge(codeVerifier);

      if (computedChallenge !== storedPKCE.codeChallenge) {
        throw new Error('PKCE validation failed: code_verifier does not match code_challenge');
      }

      // Clean up
      this.pkceStore.delete(code);
    }

    // Generate mock tokens
    return {
      accessToken: crypto.randomBytes(32).toString('hex'),
      expiresIn: 3600,
    };
  }

  private generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url'); // Node.js 16+ supports base64url
  }
}
```

### Step 4: Update HTTP Route Handlers

**File**: `backend/src/ui/http/routes/authRoutes.ts`

```typescript
import { Context } from 'koa';

export async function handleLogin(ctx: Context) {
  const { code_challenge, code_challenge_method, state } = ctx.query;

  const authProvider = ctx.container.resolve<IAuthProvider>('authProvider');

  const redirectUri = `${ctx.protocol}://${ctx.host}/api/auth/callback`;

  const pkceParams =
    code_challenge && code_challenge_method === 'S256'
      ? { codeChallenge: code_challenge as string, codeChallengeMethod: 'S256' as const }
      : undefined;

  const authUrl = authProvider.getAuthorizationUrl(redirectUri, state as string, pkceParams);

  ctx.redirect(authUrl);
}

export async function handleCallback(ctx: Context) {
  const { code, state } = ctx.query;
  const { code_verifier } = ctx.request.body;

  if (!code) {
    ctx.status = 400;
    ctx.body = { error: 'invalid_request', error_description: 'Missing authorization code' };
    return;
  }

  const authProvider = ctx.container.resolve<IAuthProvider>('authProvider');
  const redirectUri = `${ctx.protocol}://${ctx.host}/api/auth/callback`;

  try {
    const tokens = await authProvider.authenticateWithCode(
      code as string,
      redirectUri,
      code_verifier
    );

    ctx.status = 200;
    ctx.body = tokens;
  } catch (error) {
    console.error('Authentication error:', error);

    ctx.status = 400;
    ctx.body = {
      error: 'invalid_grant',
      error_description: error.message || 'Authentication failed',
    };
  }
}
```

---

## Testing Your Implementation

### Unit Tests

**Frontend PKCE Utilities**:

```bash
cd frontend
npm run test -- pkce.test.ts
```

**Backend Provider Tests**:

```bash
cd backend
npm run test -- MockAuthProvider.test.ts
```

### Integration Tests

**Test Full OAuth Flow with PKCE**:

```typescript
// backend/tests/integration/auth/pkce-flow.test.ts
import request from 'supertest';
import { app } from '@/index';

describe('PKCE Authentication Flow', () => {
  it('should complete OAuth flow with valid PKCE', async () => {
    // Step 1: Generate PKCE params (simulate frontend)
    const verifier = 'test_verifier_43_chars_minimum_requirement';
    const challenge = 'computed_challenge_sha256_hash';

    // Step 2: Initiate login
    const loginResponse = await request(app.callback())
      .get('/api/auth/login')
      .query({ code_challenge: challenge, code_challenge_method: 'S256' });

    expect(loginResponse.status).toBe(302);
    const redirectUrl = new URL(loginResponse.headers.location);
    const code = redirectUrl.searchParams.get('code');

    // Step 3: Exchange code with verifier
    const callbackResponse = await request(app.callback())
      .post('/api/auth/callback')
      .query({ code })
      .send({ code_verifier: verifier });

    expect(callbackResponse.status).toBe(200);
    expect(callbackResponse.body.accessToken).toBeDefined();
  });

  it('should reject invalid PKCE verifier', async () => {
    const challenge = 'valid_challenge';

    const loginResponse = await request(app.callback())
      .get('/api/auth/login')
      .query({ code_challenge: challenge, code_challenge_method: 'S256' });

    const redirectUrl = new URL(loginResponse.headers.location);
    const code = redirectUrl.searchParams.get('code');

    const callbackResponse = await request(app.callback())
      .post('/api/auth/callback')
      .query({ code })
      .send({ code_verifier: 'wrong_verifier' });

    expect(callbackResponse.status).toBe(400);
    expect(callbackResponse.body.error).toBe('invalid_grant');
  });
});
```

### Manual Testing

**Test with Mock Provider**:

```bash
# Terminal 1: Start backend with Mock provider
cd backend
AUTH_PROVIDER=mock npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Browser:
# 1. Navigate to http://localhost:5173
# 2. Open DevTools -> Application -> Session Storage
# 3. Click "Login"
# 4. Observe: pkce_verifier_* entry created
# 5. Complete mock authentication
# 6. Observe: pkce_verifier_* entry removed
# 7. Verify: Access token received
```

**Test with Keycloak**:

```bash
# Start Keycloak (see KEYCLOAK_SETUP.md)
docker-compose up -d keycloak

# Start backend
cd backend
AUTH_PROVIDER=keycloak npm run dev

# Follow same browser test steps as above
```

---

## Provider-Specific Setup

### Keycloak (No Configuration Needed)

Keycloak v7.0+ **automatically supports PKCE** with no configuration changes required.

**Verify PKCE support**:
1. Navigate to Keycloak Admin Console: `http://localhost:8080`
2. Select realm → Clients → movietrack-app
3. Settings tab → Advanced Settings
4. Confirm "Proof Key for Code Exchange Code Challenge Method" is NOT set to "disabled"

### WorkOS (No Configuration Needed)

WorkOS SDK v7.0.0+ **automatically supports PKCE** when parameters are provided.

**Update WorkOS provider** (if not already done):

```typescript
// backend/src/infrastructure/external/WorkOSAuthProvider.ts
export class WorkOSAuthProvider implements IAuthProvider {
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: { codeChallenge: string; codeChallengeMethod: 'S256' }
  ): string {
    const options: any = {
      provider: 'GoogleOAuth',
      redirectUri,
      state,
    };

    if (pkceParams) {
      options.codeChallenge = pkceParams.codeChallenge;
      options.codeChallengeMethod = pkceParams.codeChallengeMethod;
    }

    return this.workos.sso.getAuthorizationURL(options);
  }

  async authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const options: any = { code };

    if (codeVerifier) {
      options.codeVerifier = codeVerifier;
    }

    const profile = await this.workos.sso.getProfileAndToken(options);

    return {
      accessToken: profile.access_token,
      expiresIn: 3600,
    };
  }
}
```

---

## Troubleshooting

### Issue: "PKCE verifier not found or expired"

**Symptoms**: Callback page shows error, sessionStorage empty

**Causes**:
- User took >5 minutes to authenticate (verifier expired)
- Browser cleared sessionStorage (privacy mode, tab closed)
- OAuth state mismatch

**Solutions**:
1. Check sessionStorage in DevTools before clicking "Login"
2. Complete authentication within 5 minutes
3. Verify state parameter matches between login and callback
4. Disable privacy extensions that block sessionStorage

### Issue: "PKCE validation failed"

**Symptoms**: Backend returns 400 error with "code_verifier does not match code_challenge"

**Causes**:
- Code_verifier corrupted during storage/retrieval
- SHA256 hashing implementation incorrect
- Base64URL encoding mismatch

**Solutions**:
1. Verify Web Crypto API is available: `console.log(crypto.subtle)`
2. Test PKCE utilities in isolation (unit tests)
3. Check backend logs for challenge/verifier values
4. Ensure base64URL encoding (not standard base64)

### Issue: Provider doesn't support PKCE

**Symptoms**: Provider rejects authorization request with unknown parameter error

**Causes**:
- Provider version too old (Keycloak <v7.0, WorkOS <v7.0.0)
- PKCE disabled in provider configuration

**Solutions**:
1. Upgrade provider to minimum version
2. Check provider admin console for PKCE settings
3. Use Mock provider for local testing
4. Implement backward compatibility (make PKCE optional)

### Issue: Performance degradation

**Symptoms**: Login flow takes >2 seconds

**Causes**:
- SHA256 hashing blocking main thread
- sessionStorage write failures
- Multiple unnecessary PKCE generations

**Diagnosis**:
```typescript
// Add performance logging
const start = performance.now();
const verifier = generateCodeVerifier();
console.log('Verifier generation:', performance.now() - start, 'ms');

const challengeStart = performance.now();
const challenge = await generateCodeChallenge(verifier);
console.log('Challenge generation:', performance.now() - start, 'ms');
```

**Solutions**:
- Ensure Web Crypto API is used (not polyfill)
- Check for sessionStorage quota exceeded errors
- Generate PKCE only once per login attempt

---

## Next Steps

After completing this implementation:

1. **Run full test suite**: `npm test` (backend + frontend)
2. **Test with all providers**: Mock, Keycloak, WorkOS
3. **Verify security logs**: Check PKCE events are logged
4. **Monitor performance**: Ensure <20ms PKCE overhead
5. **Update documentation**: Add PKCE notes to AUTHENTICATION.md
6. **Deploy to staging**: Test end-to-end in staging environment
7. **Monitor adoption**: Track PKCE usage in production logs

**Resources**:
- [RFC 7636 - PKCE Specification](https://tools.ietf.org/html/rfc7636)
- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Keycloak PKCE Support](https://www.keycloak.org/docs/latest/server_admin/#proof-key-for-code-exchange)
- [WorkOS SDK Documentation](https://workos.com/docs/sso/guide)

---

**Estimated Completion Time**: 2-3 hours  
**Complexity**: Medium  
**Risk Level**: Low (backward compatible, well-tested standard)

🎉 You're now ready to implement secure PKCE authentication!
