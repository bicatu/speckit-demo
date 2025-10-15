# Implementation Plan: Multi-User Movie & Series Tracking Application

**Branch**: `001-multi-user-movie` | **Date**: 2025-10-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multi-user-movie/spec.md`

**Status**: ✅ **Phase 0 & Phase 1 Complete** - Ready for Phase 2 (tasks generation via `/speckit.tasks`)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A multi-user web application for tracking movies and series with community ratings. Users can browse content, add new entries with genre tags, rate content (1-10 stars), and filter by various criteria. The application uses OAuth2 authentication via WorkOS (production) with Docker-based local mock, PostgreSQL database, and follows DDD architecture with TypeScript/Node.js. Key features include: unique title enforcement, pagination (10 per page), average rating calculation, streaming platform management, and admin-controlled genre tags and platforms.

## Technical Context

**Language/Version**: TypeScript 5.7.2 / Node.js 22.x LTS  
**Primary Dependencies**: Koa 2.16.1, Zod 3.22.4, WorkOS Node SDK 7.0.0, pg 8.11.3, React 18.2.0, TanStack Query 5.17.0  
**Storage**: PostgreSQL 16 (Docker-based for local development)  
**Testing**: Jest 29.7.0 with ts-jest 29.1.1, ts-jest-mocker 1.1.0, React Testing Library 14.1.2  
**Target Platform**: Web server (Linux/container deployment), React SPA frontend  
**Project Type**: Web application (backend API + React frontend)  
**Performance Goals**: Entry lists load within 3 seconds with 1000+ entries, pagination response <2 seconds, rating operations <30 seconds, target 100-500 concurrent users  
**Constraints**: Last-write-wins for concurrent edits (no conflict resolution), whole number ratings only (1-10), max 3 genre tags per entry, unique title enforcement, 10 items per page pagination  
**Scale/Scope**: Initial target: 500 users, 5,000 entries, 25,000 ratings; horizontally scalable to 5,000+ users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**DDD Layered Architecture Check**:

- [x] Domain layer contains only business logic without external framework dependencies
- [x] Application layer orchestrates domain operations through Commands/Queries  
- [x] Infrastructure layer implements domain-defined interfaces only
- [x] UI layer interacts solely with Application layer

**Domain-Driven Design Check**:

- [x] Domain objects represent core business concepts (User, Entry, Rating, StreamingPlatform, GenreTag)
- [x] Repository interfaces defined in Domain layer
- [x] All implementations reside in Infrastructure layer
- [x] No technical constructs leak into domain model

**Command/Query Separation Check**:

- [x] State-changing operations implemented as Commands with handlers (CreateEntryCommand, AddRatingCommand, UpdateEntryCommand, DeleteUserCommand)
- [x] Data retrieval operations implemented as Queries with handlers (GetEntriesQuery, GetEntryDetailsQuery, GetUserRatingsQuery)
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
- [x] All external services (databases, message queues, caches) defined with specific version tags (PostgreSQL 16)
- [x] Service ports exposed for local access (5432 for PostgreSQL)
- [x] Environment variables used for service configuration and credentials
- [x] Volume mappings defined for data persistence where appropriate
- [x] Health checks configured for service readiness
- [x] No manual installation of databases or message brokers required

**OAuth2 Authentication Check** (if user authentication required):

- [x] OAuth2 standard used for user authentication (WorkOS AuthKit)
- [x] Application does NOT store user passwords directly
- [x] Appropriate OAuth2 grant type implemented (Authorization Code flow)
- [x] Token validation occurs at UI layer (Koa middleware)
- [x] Access tokens validated on every authenticated request
- [x] Authentication concerns isolated from Domain layer
- [x] User identity passed as Command/Query context (not authentication logic in handlers)
- [x] OAuth2 client implementation provided in Infrastructure layer for external services

**Constitution Compliance**: ✅ All checks passed - no violations

**Post-Phase 1 Re-Validation**: ✅ All architectural decisions in data model, contracts, and project structure comply with Constitution principles. DDD layering preserved, OAuth2 properly abstracted, Docker services defined, Koa web API structure follows standards.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-user-movie/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command) ✅ COMPLETE
├── data-model.md        # Phase 1 output (/speckit.plan command) - TODO
├── quickstart.md        # Phase 1 output (/speckit.plan command) - TODO
├── contracts/           # Phase 1 output (/speckit.plan command) - TODO
│   └── openapi.yaml     # REST API specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (backend + frontend)
backend/
├── src/
│   ├── domain/              # Core business logic and entities
│   │   ├── entities/        # Domain entities (User, Entry, Rating, etc.)
│   │   │   ├── User.ts
│   │   │   ├── Entry.ts
│   │   │   ├── Rating.ts
│   │   │   ├── StreamingPlatform.ts
│   │   │   └── GenreTag.ts
│   │   ├── repositories/    # Repository interfaces
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IEntryRepository.ts
│   │   │   ├── IRatingRepository.ts
│   │   │   ├── IStreamingPlatformRepository.ts
│   │   │   └── IGenreTagRepository.ts
│   │   └── value-objects/   # Value objects (if needed)
│   │       └── EntryFilters.ts
│   ├── application/         # Application services and handlers
│   │   ├── commands/        # Command handlers
│   │   │   ├── CreateEntryCommand.ts
│   │   │   ├── UpdateEntryCommand.ts
│   │   │   ├── AddRatingCommand.ts
│   │   │   ├── UpdateRatingCommand.ts
│   │   │   ├── DeleteUserCommand.ts
│   │   │   ├── CreateStreamingPlatformCommand.ts
│   │   │   ├── DeleteStreamingPlatformCommand.ts
│   │   │   ├── CreateGenreTagCommand.ts
│   │   │   └── DeleteGenreTagCommand.ts
│   │   ├── queries/         # Query handlers
│   │   │   ├── GetEntriesQuery.ts
│   │   │   ├── GetEntryDetailsQuery.ts
│   │   │   ├── GetUserRatingsQuery.ts
│   │   │   ├── GetStreamingPlatformsQuery.ts
│   │   │   └── GetGenreTagsQuery.ts
│   │   └── interfaces/      # Application service interfaces (if needed)
│   ├── infrastructure/      # External concerns implementation
│   │   ├── domain/          # Repository implementations
│   │   │   ├── PostgresUserRepository.ts
│   │   │   ├── PostgresEntryRepository.ts
│   │   │   ├── PostgresRatingRepository.ts
│   │   │   ├── PostgresStreamingPlatformRepository.ts
│   │   │   └── PostgresGenreTagRepository.ts
│   │   ├── persistence/     # Database/storage implementations
│   │   │   ├── DatabaseConnection.ts
│   │   │   └── migrations/  # Database migration scripts
│   │   └── external/        # External service integrations
│   │       └── WorkOSAuthClient.ts
│   └── ui/                  # User interface layer
│       └── http/            # Koa HTTP interface
│           ├── server.ts    # Server setup with createServer()
│           ├── middleware/  # Koa middleware
│           │   └── authMiddleware.ts
│           └── actions/     # HTTP endpoint actions
│               ├── entries/
│               │   ├── createEntry.ts
│               │   ├── updateEntry.ts
│               │   ├── getEntries.ts
│               │   └── getEntryDetails.ts
│               ├── ratings/
│               │   ├── addRating.ts
│               │   └── updateRating.ts
│               ├── users/
│               │   └── deleteUser.ts
│               ├── platforms/
│               │   ├── createPlatform.ts
│               │   ├── deletePlatform.ts
│               │   └── getPlatforms.ts
│               └── tags/
│                   ├── createTag.ts
│                   ├── deleteTag.ts
│                   └── getTags.ts
├── tests/
│   ├── unit/                # Unit tests for domain logic
│   │   └── domain/
│   │       └── entities/
│   ├── integration/         # Integration tests for handlers
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   └── queries/
│   │   └── infrastructure/
│   │       └── domain/
│   └── contract/            # Contract tests for repositories
│       └── repositories/
├── package.json
├── tsconfig.json
└── jest.config.js

frontend/
├── src/
│   ├── components/      # UI components
│   │   ├── EntryList.tsx
│   │   ├── EntryCard.tsx
│   │   ├── EntryDetails.tsx
│   │   ├── RatingInput.tsx
│   │   ├── FilterBar.tsx
│   │   └── Pagination.tsx
│   ├── pages/           # Application pages
│   │   ├── HomePage.tsx
│   │   ├── EntryDetailsPage.tsx
│   │   ├── AddEntryPage.tsx
│   │   └── AdminPage.tsx
│   ├── services/        # Frontend services
│   │   └── api.ts       # Axios API client
│   ├── hooks/           # React hooks
│   │   └── useEntries.ts
│   ├── types/           # TypeScript types
│   │   └── api.ts
│   └── App.tsx
├── tests/
│   ├── unit/
│   │   └── components/
│   └── integration/
│       └── pages/
├── package.json
├── tsconfig.json
└── vite.config.ts

docker-compose.yml       # Local development services
.env.example            # Environment variable template
README.md               # Project documentation
```

**Structure Decision**: Web application with separate backend (DDD layers) and frontend (React SPA). Backend follows strict DDD layering: Domain → Application → Infrastructure → UI (HTTP). Frontend uses component-based architecture with TanStack Query for server state management. Docker Compose orchestrates local PostgreSQL and OAuth mock services.

## Complexity Tracking

No Constitution violations - all checks passed. No complexity justification required.
