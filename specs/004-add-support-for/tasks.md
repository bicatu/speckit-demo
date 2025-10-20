# Tasks: PKCE Support for OpenID Connect Authentication

**Input**: Design documents from `/home/mbneto/Development/speckit-demo/specs/004-add-support-for/`  
**Branch**: `004-add-support-for`  
**Generated**: 2025-10-20

## Overview

This task breakdown implements PKCE (Proof Key for Code Exchange) support for OpenID Connect authentication as mandated by constitution v1.6.0. Tasks are organized by user story to enable independent implementation and testing. No tests are generated as they were not explicitly requested in the specification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a **web application (frontend + backend)** project:
- Backend: `backend/src/infrastructure/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verification of existing infrastructure

- [ ] T001 Verify existing authentication infrastructure (IAuthProvider, KeycloakAuthProvider, WorkOSAuthProvider, MockAuthProvider)
- [ ] T002 [P] Verify Web Crypto API availability in target browsers (Chrome, Firefox, Safari, Edge)
- [ ] T003 [P] Verify Keycloak version >= 7.0 and WorkOS SDK version >= 7.0.0 in package.json
- [ ] T004 [P] Create feature branch 004-add-support-for from main branch

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core PKCE utilities and interface changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create frontend PKCE utilities module at frontend/src/utils/pkce.ts with base64UrlEncode helper function
- [ ] T006 [P] Implement generateCodeVerifier() function in frontend/src/utils/pkce.ts using crypto.getRandomValues() (32 random bytes, base64url-encoded)
- [ ] T007 [P] Implement generateCodeChallenge(codeVerifier) function in frontend/src/utils/pkce.ts using crypto.subtle.digest('SHA-256') and base64url encoding
- [ ] T008 [P] Implement storePKCEVerifier(state, codeVerifier) function in frontend/src/utils/pkce.ts to store in sessionStorage with key format pkce_verifier_${state}
- [ ] T009 [P] Implement retrievePKCEVerifier(state) function in frontend/src/utils/pkce.ts with automatic cleanup after retrieval
- [ ] T010 [P] Implement cleanupPKCEVerifier(state) function in frontend/src/utils/pkce.ts for manual cleanup
- [ ] T011 Extend IAuthProvider interface in backend/src/infrastructure/external/IAuthProvider.ts to add optional pkceParams parameter to getAuthorizationUrl()
- [ ] T012 Extend IAuthProvider interface in backend/src/infrastructure/external/IAuthProvider.ts to add optional codeVerifier parameter to authenticateWithCode()

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Authorization Code Flow with PKCE (Priority: P1) 🎯 MVP

**Goal**: Implement end-to-end PKCE flow from login initiation through token exchange, preventing authorization code interception attacks

**Independent Test**: Initiate login flow, capture authorization request to verify code_challenge presence, complete OAuth flow, verify token exchange includes code_verifier, confirm SHA256 hashing and cryptographic randomness

### Frontend Implementation for User Story 1

- [ ] T013 [P] [US1] Update login handler in frontend/src/hooks/useLogin.ts to generate code_verifier and code_challenge before redirecting
- [ ] T014 [US1] Update login handler in frontend/src/hooks/useLogin.ts to store code_verifier in sessionStorage linked to OAuth state parameter
- [ ] T015 [US1] Update login handler in frontend/src/hooks/useLogin.ts to include code_challenge and code_challenge_method=S256 in authorization URL query parameters
- [ ] T016 [P] [US1] Update callback handler in frontend/src/pages/AuthCallbackPage.tsx to retrieve code_verifier from sessionStorage using state parameter
- [ ] T017 [US1] Update callback handler in frontend/src/pages/AuthCallbackPage.tsx to include code_verifier in token exchange request body
- [ ] T018 [US1] Add error handling in frontend/src/pages/AuthCallbackPage.tsx for missing code_verifier (display clear message and prompt retry)
- [ ] T019 [US1] Add cleanup logic in frontend/src/pages/AuthCallbackPage.tsx to remove code_verifier from sessionStorage after successful token exchange

### Backend Implementation for User Story 1

- [ ] T020 [P] [US1] Update KeycloakAuthProvider.getAuthorizationUrl() in backend/src/infrastructure/external/KeycloakAuthProvider.ts to accept and include PKCE parameters
- [ ] T021 [P] [US1] Update WorkOSAuthProvider.getAuthorizationUrl() in backend/src/infrastructure/external/WorkOSAuthProvider.ts to accept and include PKCE parameters
- [ ] T022 [P] [US1] Update MockAuthProvider.getAuthorizationUrl() in backend/src/infrastructure/external/MockAuthProvider.ts to accept and store code_challenge in memory
- [ ] T023 [US1] Update KeycloakAuthProvider.authenticateWithCode() in backend/src/infrastructure/external/KeycloakAuthProvider.ts to include code_verifier in token exchange request
- [ ] T024 [US1] Update WorkOSAuthProvider.authenticateWithCode() in backend/src/infrastructure/external/WorkOSAuthProvider.ts to include code_verifier in token exchange request
- [ ] T025 [US1] Update MockAuthProvider.authenticateWithCode() in backend/src/infrastructure/external/MockAuthProvider.ts to validate code_verifier against stored code_challenge using SHA256
- [ ] T026 [US1] Add PKCE validation error handling in backend/src/infrastructure/external/MockAuthProvider.ts (throw error if verifier missing or invalid)

### HTTP Route Updates for User Story 1

- [ ] T027 [US1] Update login route handler in backend/src/ui/http/routes/authRoutes.ts to extract code_challenge and code_challenge_method from query parameters
- [ ] T028 [US1] Update login route handler in backend/src/ui/http/routes/authRoutes.ts to pass PKCE parameters to authProvider.getAuthorizationUrl()
- [ ] T029 [US1] Update callback route handler in backend/src/ui/http/routes/authRoutes.ts to extract code_verifier from request body
- [ ] T030 [US1] Update callback route handler in backend/src/ui/http/routes/authRoutes.ts to pass code_verifier to authProvider.authenticateWithCode()
- [ ] T031 [US1] Add error response handling in backend/src/ui/http/routes/authRoutes.ts for PKCE validation failures (400 Bad Request with error codes)

**Checkpoint**: User Story 1 complete - Full PKCE flow functional and independently testable

---

## Phase 4: User Story 2 - Backend PKCE Validation Support (Priority: P2)

**Goal**: Ensure backend properly handles and validates PKCE parameters, with appropriate error handling for PKCE-enforced providers

**Independent Test**: Send token exchange requests with and without code_verifier to backend callback endpoint, verify proper error responses when PKCE parameters missing or invalid

### Implementation for User Story 2

- [ ] T032 [P] [US2] Add Zod validation schema for PKCE parameters in backend/src/ui/http/routes/authRoutes.ts (code_challenge: optional string, code_challenge_method: optional 'S256')
- [ ] T033 [P] [US2] Add Zod validation schema for code_verifier in backend/src/ui/http/routes/authRoutes.ts (optional string, 43-128 characters, base64url format)
- [ ] T034 [US2] Implement PKCE parameter validation in login route using Zod safeParse() in backend/src/ui/http/routes/authRoutes.ts
- [ ] T035 [US2] Implement code_verifier validation in callback route using Zod safeParse() in backend/src/ui/http/routes/authRoutes.ts
- [ ] T036 [US2] Add error logging for PKCE validation failures in backend/src/ui/http/routes/authRoutes.ts (log to security event log)
- [ ] T037 [US2] Update error responses in backend/src/ui/http/routes/authRoutes.ts to return specific PKCE error codes (pkce_verifier_missing, pkce_validation_failed)

**Checkpoint**: User Story 2 complete - Backend PKCE validation robust and independently testable

---

## Phase 5: User Story 3 - Secure Code Verifier Storage (Priority: P3)

**Goal**: Implement secure sessionStorage-based code_verifier storage with proper expiration, cleanup, and multi-tab isolation

**Independent Test**: Initiate login, inspect sessionStorage to verify verifier presence and format, close/reopen tabs, verify callback retrieves verifier, confirm cleanup after auth completion

### Implementation for User Story 3

- [ ] T038 [P] [US3] Add expiration timestamp logic to storePKCEVerifier() in frontend/src/utils/pkce.ts (5 minutes from creation)
- [ ] T039 [P] [US3] Add expiration check to retrievePKCEVerifier() in frontend/src/utils/pkce.ts (return null if expired, cleanup expired entries)
- [ ] T040 [US3] Add try-catch error handling to storePKCEVerifier() in frontend/src/utils/pkce.ts for sessionStorage quota exceeded errors
- [ ] T041 [US3] Add try-catch error handling to retrievePKCEVerifier() in frontend/src/utils/pkce.ts for sessionStorage access errors
- [ ] T042 [US3] Implement automatic cleanup on page load in frontend/src/App.tsx to remove expired PKCE verifiers from sessionStorage
- [ ] T043 [US3] Add error message display in frontend/src/pages/AuthCallbackPage.tsx for sessionStorage errors (prompt user to enable cookies)

**Checkpoint**: User Story 3 complete - Secure storage mechanism implemented and independently testable

---

## Phase 6: Observability & Logging

**Purpose**: Implement security event logging and performance monitoring for PKCE flows

- [ ] T044 [P] Add security event logger utility in backend/src/infrastructure/logging/securityLogger.ts for PKCE events
- [ ] T045 [P] Add performance metrics logger utility in backend/src/infrastructure/logging/metricsLogger.ts for auth flow timing
- [ ] T046 Log PKCE generation events in frontend/src/utils/pkce.ts (verifier generation time, challenge generation time)
- [ ] T047 Log PKCE validation failures in backend/src/infrastructure/external/MockAuthProvider.ts (missing verifier, challenge mismatch)
- [ ] T048 Log PKCE validation failures in backend/src/infrastructure/external/KeycloakAuthProvider.ts (provider error responses)
- [ ] T049 Log PKCE validation failures in backend/src/infrastructure/external/WorkOSAuthProvider.ts (provider error responses)
- [ ] T050 Log total auth flow duration in backend/src/ui/http/routes/authRoutes.ts (from login to token exchange completion)
- [ ] T051 Add correlation_id to all PKCE-related log events in backend/src/ui/http/routes/authRoutes.ts for request tracing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, testing, and final validation across all user stories

- [ ] T052 [P] Update backend/AUTHENTICATION.md with PKCE implementation details (code_verifier generation, storage strategy, provider support)
- [ ] T053 [P] Update README.md with PKCE feature description and security benefits
- [ ] T054 [P] Create integration test for full PKCE flow in backend/tests/integration/ui/http/auth/pkce-flow.test.ts (login → callback → token exchange)
- [ ] T055 [P] Create unit tests for PKCE utilities in frontend/tests/unit/utils/pkce.test.ts (test all 5 utility functions)
- [ ] T056 [P] Create unit tests for MockAuthProvider PKCE validation in backend/tests/unit/infrastructure/external/MockAuthProvider.test.ts
- [ ] T057 Validate quickstart.md implementation guide by following steps for Mock provider
- [ ] T058 Validate quickstart.md implementation guide by following steps for Keycloak provider
- [ ] T059 Verify performance goals: measure PKCE overhead (<20ms), total auth flow (<2 seconds)
- [ ] T060 Run full test suite and verify all tests pass (npm test in backend and frontend)
- [ ] T061 Create centralized OpenAPI specification in docs/api/openapi.yaml documenting all authentication endpoints with PKCE parameters
- [ ] T062 Update backend/AUTHENTICATION.md to reference centralized OpenAPI spec at docs/api/openapi.yaml
- [ ] T063 Update README.md to reference centralized OpenAPI spec at docs/api/openapi.yaml for API documentation
- [ ] T064 Update all feature-specific contract documentation to link to centralized OpenAPI spec instead of duplicating endpoint definitions
- [ ] T065 [P] Verify backward compatibility by testing existing authentication flows without PKCE parameters to ensure graceful degradation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (if staffed) after Phase 2
  - Or sequentially in priority order: US1 (P1) → US2 (P2) → US3 (P3)
- **Observability (Phase 6)**: Depends on User Story 1 completion (core PKCE flow must exist to log events)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable

### Within Each User Story

- Frontend tasks can run in parallel with backend tasks (different codebases)
- Provider implementations (Keycloak, WorkOS, Mock) can run in parallel
- HTTP route updates depend on provider implementations being complete
- Validation/error handling tasks depend on core implementation tasks

### Parallel Opportunities

**Phase 1 (Setup)**: Tasks T002, T003, T004 can run in parallel

**Phase 2 (Foundational)**: Tasks T006, T007, T008, T009, T010 can run in parallel (all in same file but different functions)

**Phase 3 (User Story 1)**:
- Frontend group: T013, T016 can start in parallel
- Backend group: T020, T021, T022 can run in parallel (different provider files)
- Backend group: T023, T024 can run in parallel after T020, T021 complete

**Phase 4 (User Story 2)**: Tasks T032, T033 can run in parallel

**Phase 5 (User Story 3)**: Tasks T038, T039, T040, T041 can run in parallel

**Phase 6 (Observability)**: Tasks T044, T045 can run in parallel

**Phase 7 (Polish)**: Tasks T052, T053, T054, T055, T056, T065 can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Frontend tasks can run in parallel:
T013: "Update login handler in frontend/src/hooks/useLogin.ts to generate code_verifier and code_challenge"
T016: "Update callback handler in frontend/src/pages/AuthCallbackPage.tsx to retrieve code_verifier"

# Backend provider tasks can run in parallel:
T020: "Update KeycloakAuthProvider.getAuthorizationUrl()"
T021: "Update WorkOSAuthProvider.getAuthorizationUrl()"
T022: "Update MockAuthProvider.getAuthorizationUrl()"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify infrastructure)
2. Complete Phase 2: Foundational (PKCE utilities + interface changes) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (end-to-end PKCE flow)
4. **STOP and VALIDATE**: Test complete PKCE flow with Mock provider
5. Verify security: authorization code interception prevented
6. Deploy/demo if ready - **Working PKCE implementation achieved!**

### Incremental Delivery

1. **Milestone 1**: Setup + Foundational → Foundation ready (PKCE utilities exist)
2. **Milestone 2**: Add User Story 1 → Test independently → Deploy/Demo (**MVP - Core PKCE working!**)
3. **Milestone 3**: Add User Story 2 → Test independently → Deploy/Demo (Backend validation hardened)
4. **Milestone 4**: Add User Story 3 → Test independently → Deploy/Demo (Storage security enhanced)
5. **Milestone 5**: Add Observability → Security monitoring active
6. **Milestone 6**: Polish → Production-ready

### Parallel Team Strategy

With multiple developers after Phase 2 completes:

- **Developer A**: User Story 1 (Frontend + KeycloakAuthProvider)
- **Developer B**: User Story 1 (WorkOSAuthProvider + MockAuthProvider)
- **Developer C**: User Story 2 (Backend validation)
- **Developer D**: User Story 3 (Storage security)

Stories complete and integrate independently without blocking each other.

---

## Task Summary

**Total Tasks**: 65
- Setup: 4 tasks
- Foundational: 8 tasks (BLOCKING)
- User Story 1 (P1): 19 tasks
- User Story 2 (P2): 6 tasks
- User Story 3 (P3): 6 tasks
- Observability: 8 tasks
- Polish: 14 tasks

**Parallel Opportunities**: 26 tasks marked [P] can run in parallel within their phase

**Independent Test Criteria**:
- **US1**: Initiate login → Verify code_challenge in request → Complete OAuth → Verify code_verifier in token exchange → Confirm SHA256 hashing
- **US2**: Send token requests with/without code_verifier → Verify appropriate error responses
- **US3**: Initiate login → Inspect sessionStorage → Close/reopen tabs → Verify callback retrieves verifier → Confirm cleanup

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 31 tasks for working PKCE implementation

**Estimated Implementation Time**: 2-3 hours per quickstart.md (for experienced developer implementing MVP)

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All user story tasks include [Story] label (US1, US2, US3)
✅ All tasks include specific file paths
✅ Dependencies clearly documented
✅ Parallel opportunities identified
✅ Independent test criteria defined for each story

**Next Steps**: Begin implementation starting with Phase 1 Setup tasks, then proceed to Phase 2 Foundational (CRITICAL BLOCKER) before starting any user story work.
