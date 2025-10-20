# Data Model: PKCE Support for OpenID Connect Authentication

**Feature**: PKCE Support  
**Date**: 2025-10-20

## Overview

This feature does not introduce new database entities or persistent data models. PKCE implementation uses transient, ephemeral data structures that exist only during the OAuth authorization flow (typically 10-60 seconds). All PKCE-related data is temporary and stored in browser session storage or backend memory.

## Transient Data Structures

### Frontend (Session Storage)

#### PKCE Verifier Entry

**Purpose**: Temporarily store code_verifier during OAuth flow between authorization request and callback

**Storage Location**: Browser sessionStorage

**Key Format**: `pkce_verifier_${oauthState}`

**Value Structure**:
```typescript
{
  codeVerifier: string;      // 43-128 characters, base64url-encoded
  createdAt: number;         // Unix timestamp (milliseconds)
  expiresAt: number;         // Unix timestamp (milliseconds) - typically +5 minutes
}
```

**Lifecycle**:
1. **Created**: When user initiates login
2. **Read**: When OAuth callback is received
3. **Deleted**: Immediately after successful token exchange or after expiration

**Validation Rules**:
- `codeVerifier` length: 43-128 characters
- `codeVerifier` format: Base64URL-encoded (a-z, A-Z, 0-9, -, _, no padding)
- `expiresAt`: Typically 5 minutes from creation
- Automatic cleanup if expired

### Backend (In-Memory - Mock Provider Only)

#### PKCE Challenge Store (Mock Provider)

**Purpose**: Store code_challenge for validation during token exchange (test/development only)

**Storage**: In-memory Map (not persisted)

**Key**: Authorization code (random UUID)

**Value Structure**:
```typescript
{
  codeChallenge: string;           // SHA256 hash of code_verifier, base64url-encoded
  codeChallengeMethod: 'S256';     // Always S256 (SHA256)
  createdAt: number;               // Unix timestamp
  expiresAt: number;               // Unix timestamp - typically +10 minutes
}
```

**Lifecycle**:
1. **Created**: When mock provider generates authorization code
2. **Read**: When token exchange request is received
3. **Deleted**: After successful token exchange or expiration

**Note**: Real providers (Keycloak, WorkOS) manage this internally - not part of our implementation.

## Modified Existing Structures

### IAuthProvider Interface (Extended)

**File**: `backend/src/infrastructure/external/IAuthProvider.ts`

**Added Methods** (optional - for explicit PKCE support):

```typescript
interface IAuthProvider {
  // Existing methods...
  verifyAccessToken(accessToken: string): Promise<AuthUser>;
  getAuthorizationUrl(redirectUri: string, state?: string): string;
  authenticateWithCode(code: string, redirectUri: string): Promise<{...}>;
  
  // PKCE support - method signature changes
  // getAuthorizationUrl now accepts optional PKCE parameters
  getAuthorizationUrl(
    redirectUri: string, 
    state?: string, 
    codeChallenge?: string,
    codeChallengeMethod?: 'S256'
  ): string;
  
  // authenticateWithCode now accepts optional code_verifier
  authenticateWithCode(
    code: string, 
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{...}>;
}
```

**Note**: Parameters are optional to maintain backward compatibility. PKCE-enabled flows will provide these parameters.

### Frontend Auth State (Extended)

**File**: `frontend/src/contexts/AuthContext.tsx`

**No persistent state changes**. PKCE data is managed in sessionStorage, not React state.

**Modified Flow**:
- Login initiation: Generate and store PKCE data before redirect
- Callback handling: Retrieve PKCE data from storage before token exchange
- Cleanup: Remove PKCE data after auth completion

## Non-Persistent Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Login"                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend generates:                                         │
│ - code_verifier (random, 43-128 chars)                      │
│ - code_challenge = SHA256(code_verifier)                    │
│ - oauth_state (random UUID)                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Store in sessionStorage:                                    │
│ Key: pkce_verifier_${oauth_state}                           │
│ Value: { codeVerifier, createdAt, expiresAt }               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Redirect to provider:                                       │
│ /authorize?code_challenge=xyz&code_challenge_method=S256    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Provider callback with code + state                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend retrieves from sessionStorage:                     │
│ Key: pkce_verifier_${state}                                 │
│ Gets: codeVerifier                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/auth/callback                                     │
│ Body: { code, state, code_verifier }                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend exchanges with provider:                            │
│ /token?code=xyz&code_verifier=abc                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Provider validates:                                         │
│ SHA256(code_verifier) == stored code_challenge              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend deletes from sessionStorage:                       │
│ removeItem('pkce_verifier_${state}')                        │
└─────────────────────────────────────────────────────────────┘
```

## Storage Cleanup Strategy

### Automatic Cleanup

1. **Successful Flow**: Immediate removal after token exchange
2. **Failed Flow**: Removal on error detection
3. **Expired Entries**: Frontend utility to clean expired entries on app init
4. **Session End**: Browser automatically clears sessionStorage on tab close

### Manual Cleanup (Edge Cases)

```typescript
// Frontend utility function
function cleanupExpiredPKCEData() {
  const prefix = 'pkce_verifier_';
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(prefix)) {
      const data = JSON.parse(sessionStorage.getItem(key)!);
      if (Date.now() > data.expiresAt) {
        sessionStorage.removeItem(key);
      }
    }
  }
}
```

## Security Considerations

### Data Exposure

- **code_verifier**: Sensitive, short-lived (5 min max), cleared immediately after use
- **code_challenge**: Public, safe to expose (one-way hash)
- **oauth_state**: Public, used for CSRF protection

### Storage Security

- **sessionStorage**: Tab-isolated, not accessible cross-origin or cross-tab
- **XSS Protection**: CSP headers prevent unauthorized script access
- **No Server Storage**: Backend never stores code_verifier (only providers store code_challenge)

### Audit Trail

- PKCE data creation/usage logged with correlation IDs
- No sensitive data (code_verifier) in logs
- Only security events logged (failures, missing verifiers)

## No Database Changes

This feature requires **zero database migrations or schema changes**:

- No new tables
- No new columns
- No changes to existing `users` table
- No persistent authentication state changes

All PKCE data is ephemeral and managed in browser storage and OAuth provider systems.

## Testing Data Structures

### Test Fixtures

```typescript
// Valid PKCE data for testing
export const validPKCEData = {
  codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', // 43 chars
  codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', // SHA256 hash
  codeChallengeMethod: 'S256' as const
};

// Expired PKCE data
export const expiredPKCEData = {
  codeVerifier: 'test_verifier_that_is_long_enough_to_meet_requirements_abc123',
  createdAt: Date.now() - 600000, // 10 minutes ago
  expiresAt: Date.now() - 300000  // Expired 5 minutes ago
};

// Invalid code verifier (too short)
export const invalidPKCEData = {
  codeVerifier: 'too_short', // Only 9 characters, minimum is 43
  createdAt: Date.now(),
  expiresAt: Date.now() + 300000
};
```

## Summary

This feature intentionally avoids persistent storage:

✅ **No database changes** - Zero migrations
✅ **Transient storage only** - sessionStorage (frontend), in-memory (backend mock)
✅ **Automatic cleanup** - Expiration and session-based removal
✅ **Security focused** - Minimal exposure window, isolated storage
✅ **Backward compatible** - Existing data structures unchanged
