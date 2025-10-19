# Implementation Plan: Home Page Authentication & Admin Management

**Branch**: `003-update-application-with` | **Date**: October 19, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-update-application-with/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements home page authentication routing and admin management capabilities. Authenticated users will see the entry list directly on the home page, while unauthenticated users will be presented with a login page featuring Google SSO. New users who authenticate but don't exist in the system will trigger an email notification to admins and see a pending approval message. Admins will have access to a new management page for approving/rejecting pending users and managing tags and streaming platforms. The implementation follows backend-first approach with comprehensive testing before frontend integration.

## Technical Context

**Language/Version**: TypeScript 5.7.2 / Node.js 22.x LTS (backend), TypeScript 5.7.2 (frontend)
**Primary Dependencies**:

- Backend: Koa 2.16.1, Zod 3.22.4, **existing IAuthProvider abstraction (Keycloak/WorkOS)**, pg 8.11.3, nodemailer (to be added)
- Frontend: React 18.2.0, TanStack Query 5.17.0, React Router 6.21.0
- **Note**: Google Sign-In configured in Keycloak/WorkOS admin panel, NOT in application code

**Storage**: PostgreSQL 16 (existing user database with is_admin field)
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Web application (Linux server backend, browser frontend)
**Project Type**: Web (separate backend/frontend)
**Performance Goals**: <2s home page load for authenticated users, <30s Google OAuth flow, <1min email delivery
**Constraints**:

- Must maintain existing authentication abstraction (IAuthProvider) - **NO changes to auth providers**
- **Google OAuth configured externally in Keycloak/WorkOS** - NOT in application code
- Email service integration required for admin notifications
- Database schema addition for user approval status
- Existing `/api/auth/login` and `/api/auth/callback` endpoints work unchanged

**Scale/Scope**: Small feature addition - 3 new API endpoints (pending users, approve, reject), 4 new frontend pages/components, database schema extension, **NO new auth providers**

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**DDD Layered Architecture Check**:

- [x] Domain layer contains only business logic without external framework dependencies
- [x] Application layer orchestrates domain operations through Commands/Queries  
- [x] Infrastructure layer implements domain-defined interfaces only
- [x] UI layer interacts solely with Application layer

**Domain-Driven Design Check**:

- [x] Domain objects represent core business concepts (User entity already exists with approval status to be added)
- [x] Repository interfaces defined in Domain layer (IUserRepository exists)
- [x] All implementations reside in Infrastructure layer (PostgresUserRepository exists)
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

- [x] OpenID Connect (OAuth2 + identity layer) used for user authentication (existing IAuthProvider abstraction supports this)
- [x] Application does NOT store user passwords directly
- [x] Appropriate authorization grant type implemented (Authorization Code flow already implemented)
- [x] Authentication flow handles login, authentication, and logout operations (existing login/logout/callback endpoints)
- [x] Login redirects to identity provider and exchanges authorization code for tokens
- [x] Logout invalidates session and redirects to identity provider logout endpoint when available
- [x] Token validation occurs at UI layer (middleware/API gateway) - existing authMiddleware
- [x] Access tokens validated on every authenticated request
- [x] Validated JWT tokens cached in-memory to minimize round-trips to OAuth2/OIDC server (existing implementation)
- [x] Token cache respects token TTL and invalidates on expiration or logout
- [x] Authentication concerns isolated from Domain layer
- [x] User identity passed as Command/Query context (not authentication logic in handlers)
- [x] OpenID Connect client implementation provided in Infrastructure layer for external services (IAuthProvider implementations)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
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
│   ├── domain/
│   │   ├── entities/
│   │   │   └── User.ts                    # EXTEND: Add approval_status field
│   │   └── repositories/
│   │       └── IUserRepository.ts         # EXTEND: Add methods for pending users
│   ├── application/
│   │   ├── commands/
│   │   │   └── users/
│   │   │       ├── ApproveUserCommand.ts           # NEW
│   │   │       └── RejectUserCommand.ts            # NEW
│   │   └── queries/
│   │       └── users/
│   │           └── GetPendingUsersQuery.ts         # NEW
│   ├── infrastructure/
│   │   ├── domain/
│   │   │   └── PostgresUserRepository.ts  # EXTEND: Implement pending user methods
│   │   ├── persistence/
│   │   │   └── migrations/
│   │   │       └── 005_add_user_approval_status.sql # NEW
│   │   └── external/
│   │       ├── IEmailService.ts                    # NEW: Email service interface
│   │       └── NodemailerEmailService.ts           # NEW: Nodemailer implementation
│   └── ui/
│       └── http/
│           ├── actions/
│           │   ├── auth/
│           │   │   └── callback.ts                 # EXTEND: Handle new users with pending status
│           │   └── users/
│           │       ├── getPendingUsers.ts          # NEW
│           │       ├── approveUser.ts              # NEW
│           │       └── rejectUser.ts               # NEW
│           └── middleware/
│               └── authMiddleware.ts       # EXTEND: Handle pending users
└── tests/
    ├── unit/
    │   └── application/
    │       ├── commands/
    │       │   └── users/
    │       │       ├── ApproveUserCommandHandler.spec.ts  # NEW - TDD test
    │       │       └── RejectUserCommandHandler.spec.ts   # NEW - TDD test
    │       └── queries/
    │           └── users/
    │               └── GetPendingUsersQueryHandler.spec.ts # NEW - TDD test
    └── integration/
        └── ui/
            └── http/
                └── actions/
                    └── users/
                        ├── getPendingUsers.spec.ts # NEW - Integration test
                        ├── approveUser.spec.ts     # NEW - Integration test
                        └── rejectUser.spec.ts      # NEW - Integration test

frontend/
├── src/
│   ├── components/
│   │   ├── PendingApprovalMessage.tsx     # NEW: Show message to pending users
│   │   └── AdminManagementNav.tsx         # NEW: Admin navigation
│   ├── pages/
│   │   ├── HomePage.tsx                   # EXTEND: Route based on auth/approval status
│   │   ├── LoginPage.tsx                  # NEW: Redirects to /api/auth/login
│   │   ├── PendingUsersPage.tsx           # NEW: Admin only - approval interface
│   │   └── ManageResourcesPage.tsx        # NEW: Admin only (tags/platforms)
│   ├── hooks/
│   │   ├── usePendingUsers.ts             # NEW: Fetch pending users
│   │   ├── useApproveUser.ts              # NEW: Approve user mutation
│   │   └── useRejectUser.ts               # NEW: Reject user mutation
│   └── contexts/
│       └── AuthContext.tsx                # EXTEND: Handle approval_status field
└── tests/
    ├── unit/
    │   └── components/
    │       └── PendingApprovalMessage.spec.tsx # NEW
    └── integration/
        └── pages/
            ├── HomePage.spec.tsx          # NEW
            ├── LoginPage.spec.tsx         # NEW
            └── PendingUsersPage.spec.tsx  # NEW
```

**Structure Decision**: Web application with existing DDD structure in backend. Backend changes focus on extending User entity with approval status, adding Commands/Queries for user approval workflow, and implementing email notification service. **NO new authentication providers** - Google OAuth configured externally in Keycloak/WorkOS. Existing `/api/auth/callback` endpoint extended to create new users with pending status and trigger email notifications. Frontend adds new pages for home route, login redirect, and admin management with corresponding components and hooks. All changes follow existing patterns and maintain layered architecture.

## Complexity Tracking

No constitutional violations. All checks pass with existing architecture patterns.
