# Research: Login/Logout Authentication UI

**Feature**: Login/Logout Authentication UI  
**Date**: October 19, 2025  
**Status**: Complete

## Purpose

Research implementation patterns, best practices, and technical decisions for adding OpenID Connect authentication UI (login/logout) to an existing multi-user movie tracking application. Backend already has authentication provider abstraction (IAuthProvider, Keycloak, WorkOS providers). This feature adds the missing UI layer and session management.

## Technical Decisions

### Decision 1: Token Storage Strategy (Frontend)

**Decision**: Store access tokens in memory (React state/context) only, not in localStorage or sessionStorage

**Rationale**:
- **Security**: Prevents XSS attacks from stealing tokens via localStorage/sessionStorage access
- **Constitution alignment**: "Zero authentication tokens are leaked or exposed in browser console, URLs, or logs" (SC-009)
- **Trade-off**: Users must re-authenticate on browser refresh, but this is acceptable given token TTL is typically 1 hour
- **Industry practice**: OWASP recommends against storing sensitive tokens in browser storage

**Alternatives Considered**:
- **localStorage**: Rejected due to XSS vulnerability - any script can read localStorage
- **sessionStorage**: Rejected - only slightly better than localStorage (survives until tab close, but still XSS vulnerable)
- **httpOnly cookie**: Rejected because OAuth2 callback flow requires frontend access to token for API requests
- **Memory + httpOnly cookie hybrid**: Considered but adds complexity; memory-only sufficient for this use case

**Implementation Approach**:
- Use React Context (AuthContext) to store auth state in memory
- Tokens cleared on logout or browser refresh
- Users re-authenticate on refresh (acceptable UX given security benefit)

---

### Decision 2: In-Memory Token Cache Implementation (Backend)

**Decision**: Implement in-memory LRU (Least Recently Used) cache with TTL expiration using native Map + scheduled cleanup

**Rationale**:
- **Constitution requirement**: "Backend MUST cache validated JWT tokens in-memory to minimize round-trips" (FR-008)
- **Performance**: Cached validation <10ms vs uncached <500ms (SC-003, SC-004)
- **Simplicity**: No external dependencies (Redis), simpler deployment, fewer failure points
- **Scale**: Sufficient for 1000 concurrent users (SC-007) - each token ~1KB = ~1MB memory

**Alternatives Considered**:
- **Redis cache**: Rejected - adds infrastructure complexity, network latency, another failure point
- **No caching**: Rejected - violates constitution and performance requirements
- **node-cache library**: Considered but unnecessary - simple Map + TTL + LRU is sufficient

**Implementation Approach**:
- Map<tokenHash, {user, exp, timestamp}>
- Periodic cleanup interval (every 60 seconds) to remove expired entries
- LRU eviction when max size reached (10,000 entries = ~10MB max memory)
- Token hash using crypto.createHash('sha256') for O(1) lookup without storing full token

---

### Decision 3: OAuth State Parameter Management

**Decision**: Generate cryptographically secure random state, store in memory Map with 10-minute TTL, validate on callback

**Rationale**:
- **Security**: CSRF protection required (FR-017)
- **OAuth2 standard**: State parameter prevents authorization code interception attacks
- **Stateless goal**: Memory-only storage acceptable since state is short-lived (login flow duration)

**Alternatives Considered**:
- **Database storage**: Rejected - unnecessary persistence overhead for transient data
- **Signed JWT state**: Considered but adds complexity; random string + memory map simpler
- **No CSRF protection**: Rejected - violates security requirements

**Implementation Approach**:
- crypto.randomBytes(32).toString('hex') for state generation
- Map<state, {timestamp, redirectUri}> with periodic cleanup
- Validate state exists and not expired (10 min TTL) on callback

---

### Decision 4: Deep Linking (Return URL) Strategy

**Decision**: Encode intended URL in OAuth state parameter (alongside CSRF token)

**Rationale**:
- **Requirement**: "System MUST redirect users back to their originally requested page after successful authentication" (FR-016)
- **Simplicity**: Leverages existing state mechanism, no additional storage needed
- **Security**: State already validated for CSRF, return URL travels securely through OAuth flow

**Alternatives Considered**:
- **Separate session storage**: Rejected - requires session management, defeats stateless goal
- **Cookie**: Considered but adds cookie management complexity
- **Query parameter**: Rejected - URL length limits, less secure

**Implementation Approach**:
- State = `{csrfToken}-{base64(returnUrl)}`
- Parse state on callback to extract both CSRF token and return URL
- Validate return URL is same-origin before redirect (prevent open redirect vulnerability)

---

### Decision 5: Token Expiry Mid-Action Handling

**Decision**: Allow current API request to complete (may fail with 401), then redirect to login with preserved action context

**Rationale**:
- **Clarification answer**: "Allow current action to complete, then redirect to login with message; preserve intended action to retry after re-auth"
- **User experience**: Prevents data loss from partially completed forms
- **Technical simplicity**: Let backend naturally return 401, frontend catches and redirects

**Alternatives Considered**:
- **Proactive token refresh**: Rejected - adds complexity, refresh tokens not implemented yet (out of scope)
- **Token expiry warning**: Rejected - adds UI complexity, users may ignore warnings

**Implementation Approach**:
- Frontend API client (axios/fetch) intercepts 401 responses
- Save request context (URL, method, body) in memory before redirect
- After re-auth, check for saved context and retry request
- Show user-friendly "Session expired, please try again" message

---

### Decision 6: Authentication Provider Timeout Handling

**Decision**: 5-second timeout with 1 automatic retry, then fail with error and manual retry button

**Rationale**:
- **Clarification answer**: "5 second timeout with 1 automatic retry, then fail with error and manual retry option"
- **Balance**: Fast failure (users don't wait long) + resilience (transient network issues)
- **UX**: Clear error message + manual retry gives users control

**Implementation Approach**:
- axios timeout: 5000ms
- axios retry interceptor: maxRetries=1, retryDelay=1000ms
- Frontend error page: "Authentication service unavailable. [Retry] button"
- Error tracking: Log auth provider failures for monitoring

---

### Decision 7: Multi-Device Session Management

**Decision**: Allow unlimited concurrent sessions per user across devices

**Rationale**:
- **Clarification answer**: "Allow concurrent sessions on multiple devices (each device maintains independent session)"
- **Stateless architecture**: JWT tokens enable independent sessions by design
- **User experience**: Users expect to use phone + laptop + tablet simultaneously

**Alternatives Considered**:
- **Single session**: Rejected - poor UX for legitimate multi-device usage
- **Session limit (e.g., 3)**: Rejected - arbitrary limit, adds enforcement complexity

**Implementation Approach**:
- No session tracking required - each device has independent JWT token
- Logout on one device doesn't affect other devices
- Backend doesn't track session count (stateless)

---

### Decision 8: Frontend Routing for OAuth Callback

**Decision**: Use dedicated `/auth/callback` route that extracts code/state, calls backend, then redirects

**Rationale**:
- **OAuth2 flow**: Authorization server redirects to registered callback URL
- **Security**: Callback route handles sensitive authorization code, should not be a main app route
- **Separation of concerns**: Auth logic isolated from app routes

**Implementation Approach**:
- React Router route: `/auth/callback`
- CallbackPage component:
  1. Extract code & state from URL query parameters
  2. Call backend `/api/auth/callback` endpoint
  3. Store returned user + token in AuthContext
  4. Redirect to return URL (from state) or home
  5. Show error page if callback fails

---

### Decision 9: Backend API Endpoint Design

**Decision**: RESTful endpoints following existing Koa architecture pattern

**Endpoints**:
- `GET /api/auth/login` - Generate auth URL, return to frontend
- `POST /api/auth/callback` - Exchange code for token, validate, return user+token
- `POST /api/auth/logout` - Invalidate token cache, return logout URL
- `GET /api/auth/me` - Return current user info (requires auth)

**Rationale**:
- **Constitution compliance**: Follows Koa Web API Architecture principle
- **Consistency**: Matches existing backend endpoint patterns
- **RESTful**: Standard HTTP methods and resource naming

**Implementation Approach**:
- Each endpoint in dedicated file: `backend/src/ui/http/actions/auth/{login,callback,logout,me}.ts`
- Zod validation for request bodies
- Use existing AuthProviderFactory to get Keycloak/WorkOS provider
- Token caching middleware integrated into auth flow

---

### Decision 10: Frontend State Management

**Decision**: React Context API (AuthContext) for global auth state

**Rationale**:
- **Simplicity**: No external state library needed (Redux, Zustand, etc.)
- **React best practice**: Context API sufficient for simple global state
- **Existing pattern**: Project already uses React hooks + TanStack Query

**State Shape**:
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string; displayName: string; isAdmin: boolean } | null;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
  error: string | null;
}
```

**Implementation Approach**:
- AuthContext.tsx provides state + actions
- useAuth() custom hook for consuming components
- Persist only `isAuthenticated` flag check on mount (call GET /api/auth/me to restore session)

---

## Best Practices Applied

### Security Best Practices

1. **CSRF Protection**: OAuth2 state parameter with cryptographically secure random values
2. **Token Storage**: Memory-only storage (no localStorage/sessionStorage)
3. **Open Redirect Prevention**: Validate return URLs are same-origin before redirecting
4. **Token Hashing**: Cache keys use SHA-256 hash, not plaintext tokens
5. **Timeout Configuration**: Prevent indefinite hangs on auth provider failures
6. **HTTPS Enforcement**: Production environment must use HTTPS (documented in assumptions)

### Performance Best Practices

1. **Token Caching**: In-memory cache with TTL reduces auth provider API calls from every request to once per TTL
2. **LRU Eviction**: Prevents unbounded memory growth
3. **Lazy Loading**: Auth components loaded only when needed
4. **Concurrent Request Deduplication**: Multiple simultaneous requests for same token don't trigger multiple validations

### UX Best Practices

1. **Clear Error Messages**: Specific messages for different failure scenarios (expired, timeout, invalid, etc.)
2. **Loading States**: Show spinners during auth operations
3. **Deep Linking**: Return users to intended destination after login
4. **Graceful Degradation**: App remains functional for unauthenticated users (where appropriate)
5. **Multi-Device Support**: Users can seamlessly use multiple devices

### Code Quality Best Practices

1. **TypeScript Strict Mode**: Type safety for all auth-related code
2. **Zod Validation**: Runtime validation at API boundaries
3. **Single Responsibility**: Each component/function has one clear purpose
4. **Test Coverage**: Unit, integration, and E2E tests for critical auth flows
5. **Early Returns**: Avoid nested conditionals with guard clauses

---

## Technology Stack Summary

### Backend New Dependencies

**None required** - All functionality achievable with:
- Existing: Koa, Zod, IAuthProvider abstraction
- Native: crypto module for hashing and random generation
- Native: Map for in-memory caching

### Frontend New Dependencies

**None required** - All functionality achievable with:
- Existing: React 18.2, TanStack Query, React Router
- Native: fetch API for HTTP requests
- Native: URLSearchParams for OAuth callback parsing

### Development Tools

- Jest (backend testing) - existing
- Vitest (frontend testing) - existing
- TypeScript 5.7.2 - existing

---

## Risk Assessment

### Low Risk
- ✅ Token caching implementation (simple Map + TTL)
- ✅ Frontend UI components (standard React patterns)
- ✅ OAuth flow (leverages existing providers)

### Medium Risk
- ⚠️ **Token cache memory management**: Monitor production memory usage
  - **Mitigation**: LRU eviction, max size limit, periodic cleanup
- ⚠️ **State parameter cleanup**: Prevent memory leak from abandoned login flows
  - **Mitigation**: TTL expiration + periodic cleanup task

### Identified Risk - Mitigated
- ❌ **CSRF vulnerability**: Addressed with OAuth state parameter validation
- ❌ **XSS token theft**: Addressed with memory-only storage (no localStorage)
- ❌ **Open redirect**: Addressed with same-origin validation

---

## Implementation Sequence

**Phase 0**: Research (this document) ✅

**Phase 1**: Design & Contracts
1. Create data-model.md (auth entities, token cache structure)
2. Create contracts/openapi.yaml (auth endpoints)
3. Create quickstart.md (local dev setup, testing)
4. Update Copilot instructions with new technologies

**Phase 2**: Tasks (separate /speckit.tasks command)
- Task breakdown by user story
- Backend: Token cache, auth endpoints, middleware
- Frontend: Auth context, components, pages, hooks
- Tests: Unit, integration, E2E

---

## References

- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP Token Storage Guidance](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-storage-on-client-side)
- [React Context API](https://react.dev/reference/react/useContext)
- [Koa Framework](https://koajs.com/)

---

**Status**: All research complete. No NEEDS CLARIFICATION items remaining. Ready for Phase 1 (Design & Contracts).
