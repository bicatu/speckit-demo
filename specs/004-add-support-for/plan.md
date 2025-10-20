# Implementation Plan: PKCE Support for OpenID Connect Authentication

**Branch**: `004-add-support-for` | **Date**: 2025-10-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-add-support-for/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements mandatory PKCE (Proof Key for Code Exchange) support for OpenID Connect authentication flows as required by the updated project constitution (v1.6.0). PKCE prevents authorization code interception attacks by generating a cryptographically random code_verifier (43-128 characters) and SHA256-derived code_challenge during the OAuth flow. Both frontend and backend implementations will be updated to support PKCE for all authentication providers (MockAuthProvider, KeycloakAuthProvider, WorkOSAuthProvider), maintaining backward compatibility while enhancing security for all client types.

## Technical Context

**Language/Version**: TypeScript 5.7.2 / Node.js 22.x LTS (backend), TypeScript 5.7.2 (frontend)
**Primary Dependencies**: Backend: Koa 2.16.1, existing IAuthProvider abstraction (KeycloakAuthProvider, WorkOSAuthProvider, MockAuthProvider); Frontend: React 18.2.0, existing AuthContext, Web Crypto API
**Storage**: Session storage (browser) for temporary code_verifier storage, no database changes required
**Testing**: Jest 29.7.0 (backend), Vitest (frontend)
**Target Platform**: Web application (SPA frontend + Node.js backend)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: PKCE overhead <100ms per auth flow, maintain <2 second total authentication flow completion time
**Constraints**: Must maintain backward compatibility with existing authentication flows, must support all three providers (MockAuthProvider, KeycloakAuthProvider, WorkOSAuthProvider), code_verifier must be 43-128 characters per RFC 7636
**Scale/Scope**: Affects all user authentication flows, impacts ~3 auth provider implementations, requires updates to frontend auth service and backend auth providers

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

- [x] OpenID Connect (OAuth2 + identity layer) used for user authentication (no custom auth mechanisms)
- [x] Application does NOT store user passwords directly
- [x] Authorization Code flow with PKCE (Proof Key for Code Exchange) implemented for ALL client types
- [x] PKCE implementation generates cryptographically random code_verifier (43-128 characters)
- [x] PKCE implementation derives code_challenge using SHA256 hash
- [x] Both frontend and backend support PKCE for authorization code flow
- [x] Authentication flow handles login, authentication, and logout operations
- [x] Login redirects to identity provider with PKCE parameters and exchanges authorization code using code_verifier
- [x] Logout invalidates session and redirects to identity provider logout endpoint when available
- [x] Token validation occurs at UI layer (middleware/API gateway)
- [x] Access tokens validated on every authenticated request
- [x] Validated JWT tokens cached in-memory to minimize round-trips to OAuth2/OIDC server
- [x] Token cache respects token TTL and invalidates on expiration or logout
- [x] Authentication concerns isolated from Domain layer
- [x] User identity passed as Command/Query context (not authentication logic in handlers)
- [x] OpenID Connect client implementation with PKCE support provided in Infrastructure layer for external services

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
│   └── infrastructure/  # External integrations
│       └── external/
│           ├── IAuthProvider.ts              # Existing interface - add PKCE methods
│           ├── MockAuthProvider.ts           # Update to support PKCE
│           ├── KeycloakAuthProvider.ts       # Update to support PKCE
│           └── WorkOSAuthProvider.ts         # Update to support PKCE
└── tests/
    ├── unit/
    │   └── infrastructure/
    │       └── external/
    │           ├── MockAuthProvider.spec.ts   # Test PKCE support
    │           ├── KeycloakAuthProvider.spec.ts
    │           └── WorkOSAuthProvider.spec.ts
    └── integration/
        └── ui/
            └── http/
                └── auth/                      # Integration tests for PKCE flow

frontend/
├── src/
│   ├── services/
│   │   └── authService.ts                    # Add PKCE generation/storage
│   ├── utils/
│   │   └── pkce.ts                          # New: PKCE helper functions
│   └── contexts/
│       └── AuthContext.tsx                   # Update to use PKCE flow
└── tests/
    └── unit/
        ├── services/
        │   └── authService.spec.ts           # Test PKCE integration
        └── utils/
            └── pkce.spec.ts                  # Test PKCE utilities
```

**Structure Decision**: Web application structure (Option 2). This feature extends the existing authentication infrastructure in both frontend and backend without requiring new domain entities or application layer changes. Updates are isolated to the Infrastructure layer (auth providers) and frontend services/contexts that handle OAuth flows.

## Complexity Tracking

No constitution violations. This feature extends existing authentication infrastructure following established patterns:

- Uses existing IAuthProvider abstraction (Infrastructure layer)
- Frontend updates isolated to services layer (no new domain concepts)
- No new repositories or domain entities required
- Maintains DDD layering and dependency inversion principles

---

## Artifacts Generated

This implementation plan includes the following deliverables:

### Phase 0: Research (✅ Complete)

**File**: [`research.md`](research.md)

- 10 comprehensive research tasks covering:
  - PKCE standard selection (RFC 7636 with SHA256)
  - Web Crypto API for secure random generation
  - sessionStorage strategy for code_verifier
  - Provider support verification (Keycloak v7.0+, WorkOS v7.0.0, Mock)
  - Error handling patterns
  - Security event logging
  - Backward compatibility approach
  - Testing strategy
- Technology decisions documented with rationale
- Performance impact analysis (<20ms PKCE overhead)

### Phase 1: Design (✅ Complete)

**File**: [`data-model.md`](data-model.md)

- Transient data structures (NO database changes)
- Frontend sessionStorage schema
- Backend in-memory mock provider structure
- IAuthProvider interface extensions
- Data flow lifecycle diagram
- Storage cleanup strategy
- Security considerations

**Directory**: [`contracts/`](contracts/)

- **File**: [`api-contracts.md`](contracts/api-contracts.md)
  - Modified endpoints: GET /api/auth/login, GET /api/auth/callback
  - Frontend PKCE utility functions (5 functions)
  - IAuthProvider interface changes (2 methods)
  - Provider-specific token exchange requests (Keycloak, WorkOS, Mock)
  - Error codes and logging formats
  - Testing contracts with 3 test scenarios
  - Migration strategy and backward compatibility notes

**File**: [`quickstart.md`](quickstart.md)

- Step-by-step implementation guide (2-3 hour estimate)
- Complete code examples for frontend and backend
- PKCE utility implementation with tests
- Login/callback flow updates
- Provider-specific setup (Keycloak, WorkOS, Mock)
- Troubleshooting guide with 4 common issues
- Performance monitoring guidance

### Agent Context (✅ Complete)

- Updated `.github/copilot-instructions.md` with PKCE technology additions
- Added TypeScript 5.7.2, Koa 2.16.1, React 18.2.0, Web Crypto API
- Documented session storage for code_verifier
- Recent changes logged for feature 004-add-support-for

---

## Next Steps

### Immediate Action: Generate Task Breakdown

```bash
# Run the task generation command
/speckit.tasks
```

This will create `specs/004-add-support-for/tasks.md` with a detailed task breakdown following the structure:

- Foundational setup tasks
- Implementation tasks (frontend PKCE utilities, backend provider updates)
- Testing tasks (unit, integration, end-to-end)
- Documentation tasks

### Re-validate Constitution Compliance

After completing Phase 1 design, re-check the Constitution Check section above:

**Key Question**: Does this design maintain DDD principles?

**Answer**: ✅ Yes
- No Domain layer changes (authentication is Infrastructure concern)
- No Application layer changes (no new Commands/Queries)
- All changes in Infrastructure layer (IAuthProvider, provider implementations)
- Frontend changes in services layer (not domain logic)

### Suggested Development Workflow

1. **Start with tests**: Write unit tests for PKCE utilities (TDD)
2. **Implement frontend utilities**: Create `frontend/src/utils/pkce.ts`
3. **Update frontend flows**: Modify login/callback handlers
4. **Update backend providers**: Extend IAuthProvider, update implementations
5. **Run integration tests**: Verify end-to-end PKCE flow
6. **Test with all providers**: Mock, Keycloak, WorkOS
7. **Monitor metrics**: Verify <20ms PKCE overhead

### Additional Resources

- **RFC 7636**: [PKCE Specification](https://tools.ietf.org/html/rfc7636)
- **Web Crypto API**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- **Keycloak PKCE**: [Server Admin Guide](https://www.keycloak.org/docs/latest/server_admin/#proof-key-for-code-exchange)
- **WorkOS SDK**: [SSO Documentation](https://workos.com/docs/sso/guide)

---

## Plan Completion Report

**Branch**: `004-add-support-for`  
**Implementation Plan**: `/home/mbneto/Development/speckit-demo/specs/004-add-support-for/plan.md`

**Status**: ✅ Planning Complete

**Generated Artifacts**:
- ✅ plan.md (this file)
- ✅ research.md (10 research tasks, technology decisions)
- ✅ data-model.md (transient structures, no DB changes)
- ✅ contracts/api-contracts.md (API changes, error codes, test scenarios)
- ✅ quickstart.md (implementation guide with code examples)
- ✅ .github/copilot-instructions.md (agent context updated)

**Total Complexity**: Low (extends existing patterns, no architecture changes)

**Estimated Implementation Time**: 2-3 hours (per quickstart guide)

**Next Command**: `/speckit.tasks` to generate detailed task breakdown
