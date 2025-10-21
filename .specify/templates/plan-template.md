# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**DDD Layered Architecture Check**:

- [ ] Domain layer contains only business logic without external framework dependencies
- [ ] Application layer orchestrates domain operations through Commands/Queries  
- [ ] Infrastructure layer implements domain-defined interfaces only
- [ ] UI layer interacts solely with Application layer

**Domain-Driven Design Check**:

- [ ] Domain objects represent core business concepts (User, Wallet, etc.)
- [ ] Repository interfaces defined in Domain layer
- [ ] All implementations reside in Infrastructure layer
- [ ] No technical constructs leak into domain model

**Command/Query Separation Check**:

- [ ] State-changing operations implemented as Commands with handlers
- [ ] Data retrieval operations implemented as Queries with handlers
- [ ] Command/Query types defined alongside their handlers
- [ ] Clear separation between read and write operations
- [ ] Commands and Queries implemented as classes (NOT interfaces)
- [ ] Constructor parameters are positional (NOT object parameters)
- [ ] All Commands/Queries have auto-generated commandId (UUID) and timestamp properties
- [ ] Validation violations throw errors in constructor (NOT return error objects)
- [ ] No unnecessary UUID validation (crypto.randomUUID() always produces valid UUIDs)

**Dependency Inversion Check**:

- [ ] Application/Domain layers depend only on Domain-defined abstractions
- [ ] Infrastructure dependencies injected via constructor injection
- [ ] Handler return values are read-only
- [ ] No concrete Infrastructure dependencies in Application/Domain layers

**Test-Driven Development Check**:

- [ ] Tests written first for all Command/Query handlers
- [ ] Red-Green-Refactor cycle enforced
- [ ] Integration tests cover Repository implementations
- [ ] End-to-end tests cover Command/Query flows

**Testing Standards Check**:

- [ ] Jest configured as testing framework for TypeScript projects
- [ ] Tests organized under `/tests` with namespace structure (`/tests/unit/`, `/tests/integration/`)
- [ ] Test structure uses `describe` blocks for grouping and `it('should ...')` for individual tests
- [ ] Single assertion/expect per `it` test maintained
- [ ] `ts-jest-mocker` used for consistent mocking patterns

**TypeScript Code Standards Check** (if TypeScript project):

- [ ] Single quotes used for all string literals
- [ ] `crypto.randomUUID()` used for UUID generation (no external libraries)
- [ ] Early returns and guard clauses preferred over nested if-else
- [ ] Code follows flat control flow patterns for better readability

**Input Validation Check** (if TypeScript project):

- [ ] Zod schemas defined for all UI layer inputs (HTTP requests, CLI parameters)
- [ ] Zod schemas defined for Infrastructure layer external service responses
- [ ] Types inferred from schemas using `z.infer<typeof Schema>`
- [ ] Runtime validation uses `safeParse()` with explicit error handling
- [ ] Validation occurs at system boundaries before data enters domain layer

**Web API Architecture Check** (if Koa-based web API):

- [ ] Koa framework dependencies included (`koa`, `koa-bodyparser`, `koa-router`, `@types/koa-bodyparser`)
- [ ] Server setup created in `src/ui/http/server.ts` with `createServer()` function
- [ ] Router configured with bodyParser, routes, and allowedMethods middleware
- [ ] Each endpoint has dedicated action file in `src/ui/http/actions/[entity]/[actionName].ts`
- [ ] Action files follow structure: Zod validation → type inference → safeParse → map to Command/Query → call handler → return response
- [ ] POST/PUT actions validate `ctx.request.body`, GET actions validate `ctx.params`
- [ ] Error responses include `message` and `errors` (formatted Zod errors)
- [ ] Success responses use appropriate status codes (201 for POST, 200 for GET, 404 for not found)
- [ ] Server startable as standalone module with `require.main === module` guard

**Local Development with Docker Check** (if external services required):

- [ ] Docker Compose file (`docker-compose.yml`) present at repository root
- [ ] All external services (databases, message queues, caches) defined with specific version tags
- [ ] Service ports exposed for local access
- [ ] Environment variables used for service configuration and credentials
- [ ] Volume mappings defined for data persistence where appropriate
- [ ] Health checks configured for service readiness
- [ ] No manual installation of databases or message brokers required

**OpenID Connect Authentication Check** (if user authentication required):

- [ ] OpenID Connect (OAuth2 + identity layer) used for user authentication (no custom auth mechanisms)
- [ ] Application does NOT store user passwords directly
- [ ] Authorization Code flow with PKCE (Proof Key for Code Exchange) implemented for ALL client types
- [ ] PKCE implementation generates cryptographically random code_verifier (43-128 characters)
- [ ] PKCE implementation derives code_challenge using SHA256 hash
- [ ] Both frontend and backend support PKCE for authorization code flow
- [ ] Authentication flow handles login, authentication, and logout operations
- [ ] Login redirects to identity provider with PKCE parameters and exchanges authorization code using code_verifier
- [ ] Logout invalidates session and redirects to identity provider logout endpoint when available
- [ ] Token validation occurs at UI layer (middleware/API gateway)
- [ ] Access tokens validated on every authenticated request
- [ ] Validated JWT tokens cached in-memory to minimize round-trips to OAuth2/OIDC server
- [ ] Token cache respects token TTL and invalidates on expiration or logout
- [ ] Authentication concerns isolated from Domain layer
- [ ] User identity passed as Command/Query context (not authentication logic in handlers)
- [ ] OpenID Connect client implementation with PKCE support provided in Infrastructure layer for external services

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT) - DDD Structure
src/
├── domain/              # Core business logic and entities
│   ├── entities/        # Domain entities (User, Wallet, etc.)
│   ├── repositories/    # Repository interfaces
│   └── value-objects/   # Value objects
├── application/         # Application services and handlers
│   ├── commands/        # Command handlers
│   ├── queries/         # Query handlers
│   └── interfaces/      # Application service interfaces
├── infrastructure/      # External concerns implementation
│   ├── domain/          # Repository implementations
│   ├── persistence/     # Database/storage implementations
│   └── external/        # External service integrations
└── ui/                  # User interface layer
    ├── cli/             # CLI interface
    ├── web/             # Web interface (if applicable)
    └── api/             # API controllers

tests/
├── unit/                # Unit tests for domain logic
├── integration/         # Integration tests for handlers
└── contract/            # Contract tests for repositories

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── domain/          # Core business logic
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── value-objects/
│   ├── application/     # Application services
│   │   ├── commands/
│   │   ├── queries/
│   │   └── interfaces/
│   ├── infrastructure/  # External integrations
│   │   ├── domain/
│   │   ├── persistence/
│   │   └── external/
│   └── api/             # Web API controllers
└── tests/

frontend/
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Application pages
│   ├── services/        # Frontend services
│   └── application/     # Frontend application logic
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same DDD structure as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

Fill ONLY if Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
