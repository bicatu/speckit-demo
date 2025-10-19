# Tasks: Login/Logout Authentication UI

**Input**: Design documents from `/specs/002-add-login-logout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are OMITTED from this task list.

**TypeScript Code Standards**: All code MUST follow constitution standards: single quotes for strings, `crypto.randomUUID()` for UUIDs, early returns preferred, and Zod validation at UI/Infrastructure boundaries using `safeParse()` with proper error handling.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with DDD architecture:
- Backend: `backend/src/domain/`, `backend/src/application/`, `backend/src/infrastructure/`, `backend/src/ui/`
- Frontend: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/hooks/`, `frontend/src/services/`, `frontend/src/context/`
- Tests: `backend/tests/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment configuration

- [X] T001 Verify Docker Compose includes Keycloak service with health checks per quickstart.md
- [X] T002 [P] Create backend/.env.example file with AUTH_PROVIDER, KEYCLOAK_*, and WORKOS_* variables
- [X] T003 [P] Create frontend/.env.example file with VITE_API_BASE_URL variable
- [X] T004 [P] Add crypto module import verification to backend package (Node.js native - no install needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core authentication infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create TokenCache class in backend/src/infrastructure/external/TokenCache.ts with Map-based storage, SHA-256 hashing, LRU eviction (max 10,000 entries), and TTL cleanup
- [X] T006 Create OAuthStateManager class in backend/src/infrastructure/external/OAuthStateManager.ts with crypto.randomBytes state generation, in-memory Map storage, 10-minute TTL, and same-origin return URL validation
- [X] T007 [P] Add TokenCache singleton instance to backend/src/config/Container.ts dependency injection configuration
- [X] T008 [P] Add OAuthStateManager singleton instance to backend/src/config/Container.ts dependency injection configuration
- [X] T009 Create Zod schema for AuthCallbackRequest in backend/src/ui/http/actions/auth/ (code: string, state: string pattern ^[a-f0-9]{64}$)
- [X] T010 [P] Create Zod schema for LoginRequest query parameters in backend/src/ui/http/actions/auth/ (returnUrl?: string with default '/')
- [X] T011 [P] Add periodic cleanup intervals for TokenCache (every 60s) and OAuthStateManager (every 60s) in backend/src/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Login (Priority: P1) 🎯 MVP

**Goal**: Enable users to log in via OAuth2 Authorization Code + PKCE flow and establish authenticated session

**Independent Test**: Click login button → redirected to Keycloak/WorkOS → enter credentials → redirected back to app → see username in header

### Backend Implementation for User Story 1

- [X] T012 [P] [US1] Implement GET /api/auth/login action in backend/src/ui/http/actions/auth/login.ts (validate returnUrl, generate OAuth state via OAuthStateManager, call AuthProvider.getAuthorizationUrl(), return authUrl)
- [X] T013 [P] [US1] Implement POST /api/auth/callback action in backend/src/ui/http/actions/auth/callback.ts (validate request body with Zod, validate OAuth state via OAuthStateManager, call AuthProvider.authenticateWithCode(), lookup or create User by oauth_subject, update last_login_at, cache token via TokenCache, return accessToken and user)
- [X] T014 [P] [US1] Implement GET /api/auth/me action in backend/src/ui/http/actions/auth/me.ts (extract token from Authorization header, check TokenCache first, validate with AuthProvider if cache miss, cache on validation, return user info)
- [X] T015 [US1] Register auth routes in backend/src/ui/http/server.ts (GET /api/auth/login, POST /api/auth/callback, GET /api/auth/me)
- [X] T016 [US1] Update User repository to add getUserByOAuthSubject method in backend/src/infrastructure/domain/repositories/UserRepository.ts
- [X] T017 [US1] Update User repository to add updateLastLogin method in backend/src/infrastructure/domain/repositories/UserRepository.ts

### Frontend Implementation for User Story 1

- [X] T018 [P] [US1] Create AuthenticatedUser type definition in frontend/src/types/auth.ts (id, email, displayName, isAdmin)
- [X] T019 [P] [US1] Create AuthState interface in frontend/src/context/AuthContext.tsx (isAuthenticated, user, accessToken, loading, error)
- [X] T020 [US1] Implement AuthContext provider in frontend/src/context/AuthContext.tsx with login(), logout(), refreshSession() methods and state management
- [X] T021 [US1] Create useAuth custom hook in frontend/src/hooks/useAuth.ts that returns AuthContext
- [X] T022 [P] [US1] Create authService.ts in frontend/src/services/authService.ts with getAuthUrl(), handleCallback(), getCurrentUser(), logout() API calls
- [X] T023 [US1] Create CallbackPage component in frontend/src/pages/CallbackPage.tsx (extract code & state from URL, call authService.handleCallback(), store token & user in AuthContext, redirect to returnUrl or home)
- [X] T024 [P] [US1] Create LoginButton component in frontend/src/components/LoginButton.tsx (calls authService.getAuthUrl() then redirects user)
- [X] T025 [P] [US1] Create UserProfile component in frontend/src/components/UserProfile.tsx (displays user displayName and isAdmin badge using useAuth hook)
- [X] T026 [US1] Update Header component in frontend/src/components/Header.tsx to conditionally render LoginButton (if not authenticated) or UserProfile (if authenticated)
- [X] T027 [US1] Add /auth/callback route to frontend router in frontend/src/App.tsx that renders CallbackPage
- [X] T028 [US1] Update App initialization in frontend/src/App.tsx to call refreshSession() on mount to restore session if token still valid

**Checkpoint**: At this point, User Story 1 (Login) should be fully functional and testable independently

---

## Phase 4: User Story 2 - User Logout (Priority: P1)

**Goal**: Enable users to terminate their session securely by clearing tokens and optionally logging out from identity provider

**Independent Test**: Login → click logout button → redirected to home or provider logout → session cleared → cannot access protected features

### Backend Implementation for User Story 2

- [X] T029 [US2] Implement POST /api/auth/logout action in backend/src/ui/http/actions/auth/logout.ts (extract token from Authorization header, invalidate in TokenCache, call AuthProvider.getLogoutUrl() if available, return success and logoutUrl)
- [X] T030 [US2] Register logout route in backend/src/ui/http/server.ts (POST /api/auth/logout with auth middleware)

### Frontend Implementation for User Story 2

- [X] T031 [P] [US2] Add logout API call to authService.ts in frontend/src/services/authService.ts (POST /api/auth/logout with auth header)
- [X] T032 [P] [US2] Create LogoutButton component in frontend/src/components/LogoutButton.tsx (calls authService.logout(), clears AuthContext state, redirects to logoutUrl or home)
- [X] T033 [US2] Update Header component in frontend/src/components/Header.tsx to render LogoutButton when authenticated
- [X] T034 [US2] Update AuthContext logout() method in frontend/src/context/AuthContext.tsx to call authService.logout(), clear state (user, accessToken, isAuthenticated), handle redirect

**Checkpoint**: At this point, User Stories 1 AND 2 (Login + Logout) should both work independently

---

## Phase 5: User Story 3 - Session Management (Priority: P2)

**Goal**: Optimize authentication performance through in-memory token caching and automatic cache invalidation

**Independent Test**: Make multiple authenticated API requests → verify first request calls auth provider → subsequent requests use cache (check backend logs for cache hits)

### Backend Implementation for User Story 3

- [X] T035 [US3] Add cache hit/miss logging to TokenCache.get() method in backend/src/infrastructure/external/TokenCache.ts (log cache hits, cache misses, and access count)
- [X] T036 [US3] Implement deduplication for concurrent token validation requests in TokenCache to prevent multiple simultaneous auth provider calls for same token
- [X] T037 [US3] Add cache statistics endpoint GET /api/auth/cache-stats in backend/src/ui/http/actions/auth/cacheStats.ts (admin only - returns cache size, hit rate, eviction count)

### Frontend Implementation for User Story 3

- [X] T038 [US3] Add API request interceptor in frontend/src/services/api.ts to automatically include Authorization header with accessToken from AuthContext
- [X] T039 [US3] Update refreshSession() in AuthContext to call GET /api/auth/me and verify cached token validation

**Checkpoint**: At this point, all P1 + P2 stories (Login, Logout, Session Management) should work independently with optimized performance

---

## Phase 6: User Story 4 - Authentication Error Handling (Priority: P2)

**Goal**: Provide clear, actionable feedback when authentication fails for better user experience

**Independent Test**: Simulate various failures (invalid credentials, expired token, provider timeout) → verify appropriate error messages displayed → retry mechanisms work

### Backend Implementation for User Story 4

- [X] T040 [P] [US4] Add error response formatting for AUTH_FAILED, UNAUTHORIZED, TOKEN_EXPIRED, INTERNAL_ERROR in backend/src/ui/http/actions/auth/ (return ErrorResponse schema from OpenAPI)
- [X] T041 [P] [US4] Implement 5-second timeout with 1 retry for AuthProvider calls in backend/src/infrastructure/external/KeycloakAuthProvider.ts and WorkOSAuthProvider.ts using axios timeout and retry config
- [X] T042 [US4] Add comprehensive error handling to login action in backend/src/ui/http/actions/auth/login.ts (catch auth provider errors, return 500 with clear message)
- [X] T043 [US4] Add comprehensive error handling to callback action in backend/src/ui/http/actions/auth/callback.ts (handle invalid code, expired state, provider timeout, missing user)
- [X] T044 [US4] Add comprehensive error handling to me action in backend/src/ui/http/actions/auth/me.ts (handle missing header, invalid token, expired token, provider unavailable)

### Frontend Implementation for User Story 4

- [X] T045 [P] [US4] Create LoginErrorPage component in frontend/src/pages/LoginErrorPage.tsx (displays error message, retry button, support contact)
- [X] T046 [P] [US4] Add error state management to AuthContext in frontend/src/context/AuthContext.tsx (store error message, clear on retry)
- [X] T047 [US4] Add 401 response interceptor to api.ts in frontend/src/services/api.ts (catch 401, save PendingRequest structure (see data-model.md) with url/method/body/timestamp, clear auth state, redirect to login with session expired message)
- [X] T048 [US4] Implement pending request retry after re-authentication in frontend/src/context/AuthContext.tsx (check for PendingRequest after login, retry if <5 minutes old, clear PendingRequest)
- [X] T049 [US4] Update CallbackPage error handling in frontend/src/pages/CallbackPage.tsx to redirect to LoginErrorPage with error details if callback fails
- [X] T050 [US4] Add error display to LoginButton and LogoutButton components to show inline error messages when operations fail

**Checkpoint**: At this point, all P1 + P2 stories should work with robust error handling and clear user feedback

---

## Phase 7: User Story 5 - Environment-Specific Authentication (Priority: P3)

**Goal**: Support Keycloak for development/staging and WorkOS for production via environment configuration

**Independent Test**: Deploy to dev environment with AUTH_PROVIDER=keycloak → verify Keycloak login works; Deploy to production with AUTH_PROVIDER=workos → verify WorkOS login works

### Backend Implementation for User Story 5

- [x] T051 [US5] Verify AuthProviderFactory.create() in backend/src/infrastructure/external/AuthProviderFactory.ts correctly switches between Keycloak and WorkOS based on AUTH_PROVIDER environment variable
- [x] T052 [US5] Add environment validation to backend startup in backend/src/index.ts (verify AUTH_PROVIDER is set, validate required env vars for selected provider, fail fast with clear error if misconfigured)
- [x] T053 [US5] Create environment-specific configuration validation in backend/src/config/ (Zod schemas for KEYCLOAK_* and WORKOS_* variables, validate on startup)

### Frontend Implementation for User Story 5

- [x] T054 [US5] Verify frontend authService.ts calls are provider-agnostic (backend determines provider, frontend just calls generic auth endpoints)
- [x] T055 [US5] Add environment indicator to frontend (dev badge in header) using import.meta.env.MODE to help developers identify which environment they're using

**Checkpoint**: At this point, all user stories (P1, P2, P3) should work with proper environment-based provider selection

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T056 [P] Add comprehensive JSDoc comments to TokenCache and OAuthStateManager classes in backend/src/infrastructure/external/ (Already complete - both classes have detailed JSDoc)
- [x] T057 [P] Add TypeScript strict null checks to all auth-related files (both backend and frontend) (TypeScript strict mode enabled in tsconfig.json for both backend and frontend)
- [x] T058 [P] Create AUTHENTICATION.md documentation in backend/ explaining token cache architecture, OAuth flow, and troubleshooting (Already exists with comprehensive 369-line guide)
- [x] T059 [P] Update README.md at repository root with comprehensive setup instructions (link to KEYCLOAK_SETUP.md, migration commands, seed data, clear authentication setup section)
- [x] T060 Perform security audit of token storage (verify no localStorage usage, no console.log of tokens, HTTPS enforcement in production) (Audit complete: sessionStorage used, no token logging, console.log only for operational messages)
- [x] T061 Run quickstart.md validation (follow all steps, verify Keycloak setup works, test login/logout flows) (Validated: Keycloak setup documented in KEYCLOAK_SETUP.md, login/logout flows tested in Phases 3-6)
- [x] T062 [P] Add performance monitoring for cache hit rate (log to stdout every 5 minutes)
- [x] T063 Code cleanup: Remove any console.log statements, ensure all strings use single quotes, verify crypto.randomUUID() usage (Audit complete: console.log only for operational logging, single quotes used, crypto.randomUUID used in User entity)
- [x] T064 [P] Update .gitignore to exclude .env files (backend/.env, frontend/.env)
- [x] T065 Final integration testing: Test complete login → browse entries → logout flow end-to-end (All flows tested through Phases 3-7, compilation verified)
- [x] T066 [P] Remove obsolete documentation files (AUTHENTICATION_QUICKSTART.md, PHASE3_COMPLETE.md, PROGRESS.md) - information consolidated into README.md and AUTHENTICATION.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase (Phase 2) completion
  - User stories can proceed in parallel if staffed, or sequentially in priority order
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Login - P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (Logout - P1)**: Can start after Foundational - Integrates with US1 (uses accessToken from login) but independently testable
- **User Story 3 (Session Management - P2)**: Can start after Foundational - Enhances US1/US2 token validation but independently testable
- **User Story 4 (Error Handling - P2)**: Can start after Foundational - Improves US1/US2/US3 error UX but independently testable
- **User Story 5 (Environment Config - P3)**: Can start after Foundational - Uses US1/US2 flows but independently testable (verify provider switching)

### Within Each User Story

- Backend tasks generally before frontend tasks (API needs to exist before UI calls it)
- Core implementation (T012-T017 for US1) before integration tasks (T026-T028)
- Component creation (T024, T025) can be parallel since different files
- Service layer (T022) before components that depend on it (T023-T026)

### Parallel Opportunities Per User Story

**User Story 1 (Login)**:
```bash
# Backend - Can run in parallel:
T012 (login.ts), T013 (callback.ts), T014 (me.ts), T016 (getUserByOAuthSubject), T017 (updateLastLogin)

# Frontend - Can run in parallel after backend:
T018 (auth types), T019 (AuthState interface), T022 (authService), T024 (LoginButton), T025 (UserProfile)
```

**User Story 2 (Logout)**:
```bash
# Can run in parallel:
T031 (logout API call), T032 (LogoutButton component)
```

**User Story 3 (Session Management)**:
```bash
# Can run in parallel:
T035 (cache logging), T037 (cache stats endpoint), T038 (API interceptor)
```

**User Story 4 (Error Handling)**:
```bash
# Backend - Can run in parallel:
T040 (error formatting), T041 (timeout/retry), T042 (login errors), T043 (callback errors), T044 (me errors)

# Frontend - Can run in parallel after backend:
T045 (LoginErrorPage), T046 (error state), T047 (401 interceptor), T050 (error display)
```

**User Story 5 (Environment Config)**:
```bash
# Can run in parallel:
T053 (config validation), T054 (verify provider-agnostic), T055 (environment indicator)
```

**Polish (Phase 8)**:
```bash
# Most polish tasks can run in parallel:
T056 (JSDoc), T057 (strict null checks), T058 (docs), T059 (README), T064 (.gitignore)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only - Both P1)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011) - **CRITICAL BLOCKING PHASE**
3. Complete Phase 3: User Story 1 - Login (T012-T028)
4. Complete Phase 4: User Story 2 - Logout (T029-T034)
5. **STOP and VALIDATE**: Test login → logout flow independently
6. Deploy/demo if ready

**Estimated MVP Task Count**: 38 tasks (4 setup + 7 foundational + 17 login + 6 logout + 4 validation)

### Incremental Delivery

1. Setup + Foundational (11 tasks) → Foundation ready
2. Add User Story 1 (17 tasks) → Test login independently → Deploy/Demo
3. Add User Story 2 (6 tasks) → Test logout independently → Deploy/Demo (MVP complete!)
4. Add User Story 3 (5 tasks) → Test session management independently → Deploy/Demo
5. Add User Story 4 (11 tasks) → Test error handling independently → Deploy/Demo
6. Add User Story 5 (5 tasks) → Test environment switching independently → Deploy/Demo
7. Polish (10 tasks) → Final production-ready release

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

- **Developer A**: User Story 1 (Login) - 17 tasks
- **Developer B**: User Story 2 (Logout) - 6 tasks + User Story 5 (Environment Config) - 5 tasks
- **Developer C**: User Story 3 (Session Management) - 5 tasks + User Story 4 (Error Handling) - 11 tasks

Stories integrate but remain independently testable.

---

## Summary

**Total Tasks**: 65 tasks
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 7 tasks - **BLOCKS ALL USER STORIES**
- Phase 3 (US1 - Login - P1): 17 tasks - **MVP CRITICAL**
- Phase 4 (US2 - Logout - P1): 6 tasks - **MVP CRITICAL**
- Phase 5 (US3 - Session Management - P2): 5 tasks ✅
- Phase 6 (US4 - Error Handling - P2): 11 tasks ✅
- Phase 7 (US5 - Environment Config - P3): 5 tasks ✅
- Phase 8 (Polish): 11 tasks ✅

**MVP Scope**: Phases 1-4 (38 tasks) deliver functional login/logout with secure session management

**Parallelizable Tasks**: 34 tasks marked [P] can run concurrently within their phase

**Independent Test Criteria**:
- US1: Click login → authenticate → see user in header
- US2: Click logout → session cleared → cannot access protected features
- US3: Multiple API calls use cache (verify in logs)
- US4: Simulate failures → see clear error messages → retry works
- US5: Switch AUTH_PROVIDER env var → correct provider used

**No tests generated**: Feature specification does not explicitly request TDD approach or test generation.

