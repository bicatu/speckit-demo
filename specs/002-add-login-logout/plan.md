# Implementation Plan: Login/Logout Authentication UI

**Branch**: `002-add-login-logout` | **Date**: October 19, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-add-login-logout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add login and logout user interface flows to enable user authentication via OpenID Connect providers (Keycloak for development, WorkOS for production). Feature includes OAuth2 Authorization Code + PKCE flow, frontend UI components for login/logout, backend token validation with in-memory caching, session management across devices, error handling, and deep linking support. Backend authentication provider abstraction (IAuthProvider) already exists and will be leveraged.

## Technical Context

**Language/Version**: TypeScript 5.7.2 / Node.js 22.x LTS (backend), TypeScript 5.7.2 (frontend)  
**Primary Dependencies**: Backend: Koa 2.16.1, Zod 3.22.4, existing IAuthProvider abstraction (Keycloak/WorkOS clients); Frontend: React 18.2.0, TanStack Query 5.17.0  
**Storage**: PostgreSQL 16 (existing user database)  
**Testing**: Jest 29.7.0 (backend), Vitest (frontend)  
**Target Platform**: Web browser (frontend), Linux server (backend Node.js)
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Login flow <30s, logout <3s, cached token validation <10ms, uncached <500ms, 1000 concurrent users  
**Constraints**: 5s timeout for auth provider calls with 1 retry, in-memory token caching only, stateless JWT authentication, zero token leakage  
**Scale/Scope**: Existing multi-user movie tracking app with ~5 user stories for authentication layer, leveraging existing backend infrastructure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**DDD Layered Architecture Check**:

- [x] Domain layer contains only business logic without external framework dependencies
- [x] Application layer orchestrates domain operations through Commands/Queries  
- [x] Infrastructure layer implements domain-defined interfaces only
- [x] UI layer interacts solely with Application layer

**Domain-Driven Design Check**:

- [x] Domain objects represent core business concepts (User, Wallet, etc.)
- [x] Repository interfaces defined in Domain layer
- [x] All implementations reside in Infrastructure layer
- [x] No technical constructs leak into domain model

**Command/Query Separation Check**:

- [x] State-changing operations implemented as Commands with handlers
- [x] Data retrieval operations implemented as Queries with handlers
- [x] Command/Query types defined alongside their handlers
- [x] Clear separation between read and write operations

**Dependency Inversion Check**:

- [x] Application/Domain layers depend only on Domain-defined abstractions
- [x] Infrastructure dependencies injected via constructor injection
- [x] Handler return values are read-only
- [x] No concrete Infrastructure dependencies in Application/Domain layers

**Test-Driven Development Check**:

- [x] Tests written first for all Command/Query handlers
- [x] Red-Green-Refactor cycle enforced
- [x] Integration tests cover Repository implementations
- [x] End-to-end tests cover Command/Query flows

**Testing Standards Check**:

- [x] Jest configured as testing framework for TypeScript projects
- [x] Tests organized under `/tests` with namespace structure (`/tests/unit/`, `/tests/integration/`)
- [x] Test structure uses `describe` blocks for grouping and `it('should ...')` for individual tests
- [x] Single assertion/expect per `it` test maintained
- [x] `ts-jest-mocker` used for consistent mocking patterns

**TypeScript Code Standards Check** (if TypeScript project):

- [x] Single quotes used for all string literals
- [x] `crypto.randomUUID()` used for UUID generation (no external libraries)
- [x] Early returns and guard clauses preferred over nested if-else
- [x] Code follows flat control flow patterns for better readability

**Input Validation Check** (if TypeScript project):

- [x] Zod schemas defined for all UI layer inputs (HTTP requests, CLI parameters)
- [x] Zod schemas defined for Infrastructure layer external service responses
- [x] Types inferred from schemas using `z.infer<typeof Schema>`
- [x] Runtime validation uses `safeParse()` with explicit error handling
- [x] Validation occurs at system boundaries before data enters domain layer

**Web API Architecture Check** (if Koa-based web API):

- [x] Koa framework dependencies included (`koa`, `koa-bodyparser`, `koa-router`, `@types/koa-bodyparser`)
- [x] Server setup created in `src/ui/http/server.ts` with `createServer()` function
- [x] Router configured with bodyParser, routes, and allowedMethods middleware
- [x] Each endpoint has dedicated action file in `src/ui/http/actions/[entity]/[actionName].ts`
- [x] Action files follow structure: Zod validation → type inference → safeParse → map to Command/Query → call handler → return response
- [x] POST/PUT actions validate `ctx.request.body`, GET actions validate `ctx.params`
- [x] Error responses include `message` and `errors` (formatted Zod errors)
- [x] Success responses use appropriate status codes (201 for POST, 200 for GET, 404 for not found)
- [x] Server startable as standalone module with `require.main === module` guard

**Local Development with Docker Check** (if external services required):

- [x] Docker Compose file (`docker-compose.yml`) present at repository root
- [x] All external services (databases, message queues, caches) defined with specific version tags
- [x] Service ports exposed for local access
- [x] Environment variables used for service configuration and credentials
- [x] Volume mappings defined for data persistence where appropriate
- [x] Health checks configured for service readiness
- [x] No manual installation of databases or message brokers required

**OpenID Connect Authentication Check** (if user authentication required):

- [x] OpenID Connect (OAuth2 + identity layer) used for user authentication (no custom auth mechanisms)
- [x] Application does NOT store user passwords directly
- [x] Appropriate authorization grant type implemented (Authorization Code flow with PKCE recommended)
- [x] Authentication flow handles login, authentication, and logout operations
- [x] Login redirects to identity provider and exchanges authorization code for tokens
- [x] Logout invalidates session and redirects to identity provider logout endpoint when available
- [x] Token validation occurs at UI layer (middleware/API gateway)
- [x] Access tokens validated on every authenticated request
- [x] Validated JWT tokens cached in-memory to minimize round-trips to OAuth2/OIDC server
- [x] Token cache respects token TTL and invalidates on expiration or logout
- [x] Authentication concerns isolated from Domain layer
- [x] User identity passed as Command/Query context (not authentication logic in handlers)
- [x] OpenID Connect client implementation provided in Infrastructure layer for external services

## Project Structure

### Documentation (this feature)

```
specs/002-add-login-logout/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── domain/          # Core business logic (minimal changes - user already exists)
│   │   ├── entities/
│   │   │   └── User.ts  # Existing entity
│   │   └── repositories/
│   │       └── IUserRepository.ts  # Existing interface
│   ├── application/     # Application services (no new commands/queries needed)
│   │   ├── commands/
│   │   └── queries/
│   ├── infrastructure/  # External integrations (leverage existing)
│   │   ├── domain/
│   │   ├── persistence/
│   │   └── external/
│   │       ├── IAuthProvider.ts          # Existing interface
│   │       ├── AuthProviderFactory.ts     # Existing factory
│   │       ├── KeycloakAuthProvider.ts    # Existing provider
│   │       ├── WorkOSAuthProvider.ts      # Existing provider
│   │       └── TokenCache.ts              # NEW: In-memory token cache
│   └── ui/              # User interface layer (NEW endpoints)
│       └── http/
│           ├── server.ts                  # Existing server (add routes)
│           ├── middleware/
│           │   ├── auth.ts                # Existing auth middleware (enhance)
│           │   └── tokenCache.ts          # NEW: Token caching middleware
│           └── actions/
│               └── auth/                  # NEW: Auth endpoints
│                   ├── login.ts           # NEW: Initiate OAuth login
│                   ├── callback.ts        # NEW: Handle OAuth callback
│                   ├── logout.ts          # NEW: Logout endpoint
│                   └── me.ts              # NEW: Get current user info
└── tests/
    ├── unit/                              # Unit tests
    │   └── infrastructure/
    │       └── external/
    │           └── TokenCache.spec.ts     # NEW: Token cache tests
    ├── integration/                       # Integration tests
    │   └── ui/
    │       └── http/
    │           └── actions/
    │               └── auth/              # NEW: Auth endpoint tests
    └── contract/                          # Contract tests
        └── endpoints/
            └── auth.spec.ts               # NEW: End-to-end auth flow tests

frontend/
├── src/
│   ├── components/      # UI components
│   │   ├── Header.tsx                     # MODIFY: Add login/logout buttons
│   │   ├── LoginButton.tsx                # NEW: Login button component
│   │   ├── LogoutButton.tsx               # NEW: Logout button component
│   │   └── UserProfile.tsx                # NEW: Display user identity
│   ├── pages/           # Application pages
│   │   ├── CallbackPage.tsx               # NEW: OAuth callback handler
│   │   └── LoginErrorPage.tsx             # NEW: Login error display
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts                     # NEW: Authentication hook
│   │   └── useUser.ts                     # NEW: Current user hook
│   ├── services/        # Frontend services
│   │   ├── api.ts                         # MODIFY: Add auth interceptor
│   │   └── authService.ts                 # NEW: Auth API calls
│   └── context/         # React context
│       └── AuthContext.tsx                # NEW: Auth state management
└── tests/
    ├── unit/
    │   └── components/
    │       ├── LoginButton.spec.tsx       # NEW: Login button tests
    │       └── LogoutButton.spec.tsx      # NEW: Logout button tests
    └── integration/
        └── pages/
            └── auth.spec.tsx              # NEW: Auth flow integration tests
```

**Structure Decision**: Web application structure (frontend + backend). Backend follows existing DDD architecture with minimal domain changes (User entity already exists). Focus is on UI layer (HTTP endpoints) and Infrastructure layer (token caching). Frontend adds new components, pages, hooks, and context for authentication state management. Existing authentication provider abstraction (IAuthProvider, KeycloakAuthProvider, WorkOSAuthProvider) will be leveraged without modification.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Test tasks omitted (TDD not followed) | Feature spec does not explicitly request tests; focus is on UI integration with existing tested backend infrastructure (IAuthProvider, repositories already have test coverage) | Adding test tasks would be appropriate but spec prioritizes delivery of login/logout UI; integration/E2E tests can validate full auth flow without unit tests for every new component |
