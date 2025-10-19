# Data Model: Login/Logout Authentication UI

**Feature**: Login/Logout Authentication UI  
**Date**: October 19, 2025  
**Status**: Complete

## Overview

This feature adds authentication UI layer to existing backend that already has User entity and IAuthProvider abstraction. Focus is on transient session data structures (in-memory), not persistent database entities.

## Entities

### User (Existing - No Changes Required)

**Location**: `backend/src/domain/entities/User.ts`

**Purpose**: Represents a registered user in the system

**Attributes**:
- `id`: UUID - Unique user identifier
- `oauth_subject`: string - OAuth provider's user ID (from JWT `sub` claim)
- `email`: string - User's email address
- `display_name`: string - User's display name
- `is_admin`: boolean - Whether user has admin privileges
- `created_at`: Date - When user was created
- `last_login_at`: Date - Last successful login timestamp

**Relationships**:
- One-to-many with Entry (user creates entries)
- One-to-many with Rating (user creates ratings)

**Notes**:
- Already exists in database and domain layer
- No schema changes needed for this feature
- `last_login_at` will be updated on successful login

---

## Value Objects & Data Structures

### AuthUser (Infrastructure Layer)

**Location**: `backend/src/infrastructure/external/IAuthProvider.ts` (existing interface)

**Purpose**: Represents authenticated user information extracted from validated token

**Attributes**:
- `subject`: string - OAuth provider's user ID (maps to User.oauth_subject)
- `email`: string - User's email
- `displayName`: string - User's display name  
- `isAdmin`: boolean - Admin status (from token claims or database lookup)

**Lifecycle**: Created when token validated, passed to application layer as context

**Validation Rules**:
- `subject` MUST be non-empty string
- `email` MUST be valid email format
- `displayName` defaults to email if not provided
- `isAdmin` defaults to false if not specified

---

### TokenCacheEntry (Infrastructure Layer - NEW)

**Location**: `backend/src/infrastructure/external/TokenCache.ts`

**Purpose**: In-memory cache entry for validated JWT tokens to avoid repeated auth provider API calls

**Attributes**:
- `tokenHash`: string - SHA-256 hash of access token (cache key)
- `authUser`: AuthUser - Validated user information
- `expiresAt`: number - Unix timestamp when token expires
- `validatedAt`: number - Unix timestamp when token was validated
- `accessCount`: number - How many times this cached entry has been used (for monitoring)

**Lifecycle**:
- Created: When token validated for first time
- Updated: `accessCount` incremented on each cache hit
- Deleted: When token expires (TTL) or user logs out

**Storage**: In-memory Map<tokenHash, TokenCacheEntry>

**Size Limits**:
- Max entries: 10,000
- Eviction strategy: LRU (Least Recently Used)
- Estimated memory: ~1KB per entry = ~10MB max

**Validation Rules**:
- `tokenHash` MUST be 64-character hex string (SHA-256 output)
- `expiresAt` MUST be future timestamp
- `validatedAt` MUST be past timestamp
- `accessCount` MUST be >= 0

---

### OAuthState (Infrastructure Layer - NEW)

**Location**: `backend/src/ui/http/middleware/oauthState.ts`

**Purpose**: CSRF protection state for OAuth2 authorization flow

**Attributes**:
- `state`: string - Cryptographically random 64-character hex string
- `createdAt`: number - Unix timestamp when state created
- `returnUrl`: string - URL to redirect user after successful auth
- `expiresAt`: number - Unix timestamp when state expires (10 minutes from creation)

**Lifecycle**:
- Created: When user initiates login (GET /api/auth/login)
- Validated: When OAuth callback received (POST /api/auth/callback)
- Deleted: After successful validation or expiration

**Storage**: In-memory Map<state, OAuthState>

**Size Limits**:
- Max entries: 1,000 (assumes max 1000 concurrent login attempts)
- Eviction strategy: TTL expiration (10 minutes)
- Estimated memory: ~200 bytes per entry = ~200KB max

**Validation Rules**:
- `state` MUST be 64-character hex string (32 bytes random)
- `returnUrl` MUST be same-origin URL (prevent open redirect)
- `expiresAt` is `createdAt + 600000` (10 minutes in milliseconds)

---

### AuthContext (Frontend State - NEW)

**Location**: `frontend/src/context/AuthContext.tsx`

**Purpose**: React context for global authentication state management

**State Shape**:
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}
```

**Actions**:
- `login()`: Redirect to OAuth provider login page
- `logout()`: Clear session, invalidate token, redirect
- `refreshSession()`: Check if session still valid (call GET /api/auth/me)

**Lifecycle**:
- Initialized: On app mount, check for existing session
- Updated: After login/logout, on session validation
- Cleared: On logout, on 401 response from API

**Storage**: Memory only (React state)

**Validation Rules**:
- `isAuthenticated` true only if `user` and `accessToken` both non-null
- `user.id` must match backend User.id format (UUID)
- `accessToken` never exposed in logs, console, or localStorage

---

### PendingRequest (Frontend State - NEW)

**Location**: `frontend/src/services/authService.ts`

**Purpose**: Stores pending API request context for retry after re-authentication

**Attributes**:
- `url`: string - Original request URL
- `method`: string - HTTP method (GET, POST, PUT, DELETE)
- `body`: any - Request body (if POST/PUT)
- `headers`: Record<string, string> - Request headers
- `timestamp`: number - When request was attempted

**Lifecycle**:
- Created: When API returns 401 (token expired)
- Stored: In memory before redirecting to login
- Retrieved: After successful re-authentication
- Cleared: After retry completes or user cancels

**Storage**: Memory only (React state or sessionStorage if memory lost on redirect)

**Validation Rules**:
- `url` MUST be same-origin
- `timestamp` used to determine if request too old to retry (>5 minutes = abandon)

---

## Data Flows

### Login Flow Data Transformation

```
1. User clicks "Log In" button
   └─> Frontend: Call GET /api/auth/login

2. Backend generates OAuth URL
   ├─> Create OAuthState { state, returnUrl, createdAt, expiresAt }
   ├─> Store in memory: Map<state, OAuthState>
   └─> Return { authUrl: "https://provider.com/auth?...&state=xxx" }

3. Frontend redirects to authUrl
   └─> User authenticates at OAuth provider

4. OAuth provider redirects to /auth/callback?code=yyy&state=xxx
   └─> Frontend: Extract code & state from URL

5. Frontend: POST /api/auth/callback { code, state }
   ├─> Backend validates state exists and not expired
   ├─> Backend calls AuthProvider.authenticateWithCode(code)
   ├─> AuthProvider returns { accessToken, refreshToken?, user }
   ├─> Backend validates token (might already be done)
   ├─> Backend creates TokenCacheEntry
   ├─> Backend returns { user: AuthenticatedUser, accessToken }
   └─> Frontend stores in AuthContext (memory)

6. Frontend redirects to returnUrl
```

### Token Validation Flow Data Transformation

```
1. Frontend makes API request with Authorization: Bearer {token}
   └─> Backend auth middleware intercepts

2. Backend: Check TokenCache
   ├─> Hash token: SHA-256(token) = tokenHash
   ├─> Lookup: Map.get(tokenHash)
   ├─> If found and not expired:
   │   ├─> Increment accessCount
   │   ├─> Return cached AuthUser
   │   └─> Skip auth provider API call (PERFORMANCE WIN)
   └─> If not found or expired:
       ├─> Call AuthProvider.verifyAccessToken(token)
       ├─> Create TokenCacheEntry
       ├─> Store: Map.set(tokenHash, entry)
       └─> Return AuthUser

3. Backend attaches AuthUser to request context
   └─> Downstream handlers receive authenticated user identity
```

### Logout Flow Data Transformation

```
1. User clicks "Log Out" button
   └─> Frontend: POST /api/auth/logout { accessToken }

2. Backend invalidates token
   ├─> Hash token: SHA-256(token) = tokenHash
   ├─> Delete from cache: Map.delete(tokenHash)
   └─> Get logout URL from AuthProvider (if supported)

3. Backend returns { logoutUrl: "https://provider.com/logout" }
   └─> Frontend clears AuthContext state

4. Frontend redirects to logoutUrl (or home if no logout URL)
```

### Token Expiry Mid-Action Flow

```
1. User interacting with app (token expires during interaction)
   └─> Frontend makes API request with expired token

2. Backend validates token
   ├─> Token expired (or not in cache)
   ├─> Auth provider returns "token expired" error
   └─> Backend returns 401 Unauthorized

3. Frontend API interceptor catches 401
   ├─> Save PendingRequest { url, method, body, timestamp }
   ├─> Clear AuthContext (logout)
   └─> Redirect to login with message "Session expired"

4. User re-authenticates (see Login Flow)

5. After re-auth, frontend checks for PendingRequest
   ├─> If exists and timestamp < 5 min ago:
   │   ├─> Retry request with new token
   │   └─> Clear PendingRequest
   └─> If not exists or too old:
       └─> Just redirect to home/returnUrl
```

---

## Database Changes

**No database schema changes required.**

Existing `users` table already has all needed fields:
- `oauth_subject` for mapping OAuth provider user ID
- `last_login_at` will be updated on login (existing column)
- `is_admin` for authorization checks (existing column)

---

## Cache Memory Estimates

### TokenCache

- Entry size: ~1KB (user object + metadata)
- Max entries: 10,000
- Max memory: ~10MB
- Eviction: LRU when max size reached
- Cleanup: Periodic scan every 60s for expired entries

### OAuthStateCache

- Entry size: ~200 bytes (state string + URLs + timestamps)
- Max entries: 1,000
- Max memory: ~200KB
- Eviction: TTL expiration (10 minutes)
- Cleanup: Periodic scan every 60s for expired entries

### Total Memory Overhead

- TokenCache: ~10MB
- OAuthStateCache: ~200KB
- Other structures: ~1MB (error tracking, metrics)
- **Total: ~11MB** for authentication layer

---

## Security Considerations

### Token Hashing

- **Why**: Don't store plaintext tokens in cache (defense in depth)
- **Algorithm**: SHA-256 (crypto.createHash)
- **Performance**: Hashing adds <1ms overhead, negligible vs network call savings

### State Validation

- **CSRF Protection**: Random state prevents authorization code interception
- **TTL**: 10-minute expiration prevents replay attacks
- **Same-Origin**: Return URL validation prevents open redirect

### Token Storage (Frontend)

- **Memory Only**: Never in localStorage/sessionStorage (XSS protection)
- **No Logging**: Token never logged to console
- **Secure Transmission**: HTTPS only in production

---

## Type Definitions Summary

```typescript
// Backend - IAuthProvider.ts (existing)
interface AuthUser {
  subject: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

// Backend - TokenCache.ts (NEW)
interface TokenCacheEntry {
  tokenHash: string;
  authUser: AuthUser;
  expiresAt: number;
  validatedAt: number;
  accessCount: number;
}

class TokenCache {
  private cache: Map<string, TokenCacheEntry>;
  private maxSize: number = 10000;
  
  get(token: string): AuthUser | null;
  set(token: string, authUser: AuthUser, expiresAt: number): void;
  delete(token: string): void;
  cleanup(): void; // Remove expired entries
}

// Backend - oauthState.ts (NEW)
interface OAuthState {
  state: string;
  createdAt: number;
  returnUrl: string;
  expiresAt: number;
}

class OAuthStateManager {
  private states: Map<string, OAuthState>;
  
  create(returnUrl: string): string; // Returns state
  validate(state: string): OAuthState | null;
  delete(state: string): void;
  cleanup(): void;
}

// Frontend - AuthContext.tsx (NEW)
interface AuthState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Frontend - authService.ts (NEW)
interface PendingRequest {
  url: string;
  method: string;
  body?: any;
  headers: Record<string, string>;
  timestamp: number;
}
```

---

**Status**: Data model complete. All entities, value objects, and data structures defined. Ready for API contract definition (Phase 1 - Contracts).
