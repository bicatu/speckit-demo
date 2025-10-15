<!--
Sync Impact Report:
Version change: 1.2.0 → 1.3.0
Modified principles: None
Added sections:
- VIII. Web API Architecture with Koa (framework setup, routing patterns, action file structure, validation integration)
Templates requiring updates:
- ✅ Updated .specify/templates/plan-template.md - added Koa Web API architecture check
- ⚠ .specify/templates/spec-template.md - may need web API endpoint examples (deferred - not critical)
- ✅ Updated .specify/templates/tasks-template.md - added Koa-specific UI layer task examples
- ✅ No command-specific files requiring updates (no agent-specific names found)
- ✅ No runtime guidance docs requiring updates (none found)
Follow-up TODOs:
- Consider adding API endpoint documentation section to spec template (low priority)
-->

# SpecKit-Demo Constitution

## Core Principles

### I. Layered Architecture (NON-NEGOTIABLE)

MUST maintain strict separation between UI, Application, Domain, and Infrastructure layers. Domain layer MUST contain only business logic and domain entities without dependencies on external frameworks. Application layer MUST orchestrate domain operations through Commands and Queries. Infrastructure layer MUST implement domain interfaces defined in the Domain layer. UI layer MUST only interact with the Application layer.

**Rationale**: Ensures clean separation of concerns, testability, and maintainability by preventing business logic from leaking into infrastructure or presentation concerns.

### II. Domain-Driven Design

Domain Objects MUST be defined as types or classes within `src/domain` folder, focused on core business concepts and essential domain logic only. Repository interfaces MUST be defined in Domain layer to abstract data access. All implementations MUST reside in Infrastructure layer. Domain entities MUST represent real business concepts like `User`, `Wallet`, not technical constructs.

**Rationale**: Keeps business logic isolated from technical implementation details, enabling the domain model to evolve independently of infrastructure concerns.

### III. Command/Query Separation

Application layer MUST implement Command/Query pattern for all business operations. Commands MUST represent state-changing actions (e.g., `CreateUserCommand`) with dedicated handlers. Queries MUST represent data retrieval requests (e.g., `GetWalletQuery`) with dedicated handlers. Command and Query types MUST be defined alongside their handlers.

**Rationale**: Provides clear separation between read and write operations, enabling different optimization strategies and clearer intent in the codebase.

### IV. Dependency Inversion

Application and Domain layers MUST depend only on abstractions (interfaces) defined in the Domain layer, never on concrete implementations from Infrastructure layer. Dependencies (repositories, external services) MUST be injected into Application layer handlers via constructor injection. When handlers return data, it MUST be read-only.

**Rationale**: Enables testability through dependency injection and prevents coupling between business logic and infrastructure implementation details.

### V. Testing Standards

All TypeScript projects MUST use Jest as the testing framework. Tests MUST be organized under `/tests` directory with namespace structure: unit tests in `/tests/unit/[ClassName].spec.ts` and integration tests in `/tests/integration/[ClassName].spec.ts`. Test structure MUST use `describe` to group tests by function and `it('should ...')` for individual test cases. Each `it` test MUST contain a single assertion/expect statement. Mocking MUST use `ts-jest-mocker` with `mock` and `Mock` imports for consistent mock creation.

**Rationale**: Standardizes testing approach across TypeScript projects, ensures clear test organization, and provides consistent mocking patterns for reliable test isolation.

### VI. TypeScript Code Standards

All TypeScript code MUST use single quotes for strings. UUID generation MUST use the internal `crypto.randomUUID()` function, not external libraries. Functions MUST prefer early returns to reduce nesting and improve readability. Avoid deep nesting with if-else chains; instead use guard clauses that return early for error conditions or edge cases.

**Rationale**: Ensures consistent code style across the codebase, reduces complexity through flatter control flow, and eliminates external dependencies for common operations like UUID generation.

### VII. Input Validation Strategy

Input validation MUST use Zod for schema definition and validation. Validation MUST occur at the UI layer (HTTP handlers, CLI input) and at the Infrastructure layer when receiving data from external services. Request schemas MUST be defined using `z.object()` with appropriate field validators. Type inference MUST use `z.infer<typeof Schema>` to derive TypeScript types from Zod schemas. Validation MUST use `safeParse()` for runtime validation with explicit error handling.

**Rationale**: Provides type-safe runtime validation at system boundaries, ensures data integrity before it enters the domain layer, and maintains a single source of truth for data structure through schema-to-type inference.

### VIII. Web API Architecture with Koa

Non-serverless web APIs MUST use Koa framework. Package dependencies MUST include `koa` (^2.16.1), `koa-bodyparser` (^4.4.1), `koa-router` (^13.0.1), and `@types/koa-bodyparser` (^4.3.12) in devDependencies. Server setup MUST be created in `src/ui/http/server.ts` with a `createServer()` function that accepts dependencies and returns configured Koa app. Router MUST be configured with bodyParser middleware, routes, and allowedMethods. Each endpoint MUST have a dedicated action file in `src/ui/http/actions/[entity]/[actionName].ts`.

Action files MUST follow this structure: (1) Define Zod schema for request validation, (2) Infer TypeScript type using `z.infer<typeof Schema>`, (3) Validate input with `safeParse()` and return 400 status with error details on failure, (4) Map validated request to Command/Query, (5) Call appropriate handler from container/dependencies, (6) Return appropriate HTTP status code with response body.

POST/PUT actions MUST validate `ctx.request.body`, GET actions MUST validate `ctx.params`. Error responses MUST include `message` and `errors` (formatted Zod errors). Success responses for POST MUST return 201 status with created resource ID. GET responses MUST return 200 status with resource data or 404 if not found. Server MUST be startable as standalone module using `if (require.main === module)` guard.

**Rationale**: Standardizes web API implementation with Koa framework, ensures consistent request validation and error handling patterns, maintains separation between HTTP concerns (UI layer) and business logic (Application layer), and provides clear action-based organization for HTTP endpoints.

## Architecture Constraints

All code MUST follow these DDD implementation patterns:

- **Repository Pattern**: Data access MUST be abstracted through Repository interfaces defined in Domain layer and implemented in Infrastructure layer (`src/infrastructure/domain`)
- **Handler Pattern**: All business operations MUST be implemented as Command/Query handlers with constructor-injected dependencies
- **Immutable Responses**: Handler return values MUST be read-only to prevent unintended state modifications
- **Domain Purity**: Domain entities MUST contain no framework dependencies or infrastructure concerns

Violations require explicit architectural justification in plan documentation.

## Testing Architecture

All TypeScript projects MUST follow these testing standards:

- **Test Structure**: Tests located under `/tests` with namespace organization (`/tests/unit/[ClassName].spec.ts`, `/tests/integration/[ClassName].spec.ts`)
- **Test Framework**: Jest MUST be used for all TypeScript-based projects
- **Test Organization**: Use `describe` blocks to group tests by function, `it('should ...')` for individual test cases
- **Assertion Strategy**: Single assertion/expect per `it` test for clear failure identification
- **Mocking Strategy**: Use `ts-jest-mocker` library with consistent `mock<T>()` and `Mock<T>` patterns for classes and interfaces

Mock implementations MUST follow these patterns:

- Class mocking: `const mockInstance = mock(ClassName)` with beforeEach setup
- Interface mocking: `const mockInstance = mock<InterfaceName>()` with type parameter
- All mocks MUST be properly typed and verified with `toHaveBeenCalled()` assertions

### TypeScript Coding Patterns

TypeScript code MUST follow these conventions:

- **String Literals**: Single quotes MUST be used for all string literals (e.g., `'hello'` not `"hello"`)
- **UUID Generation**: Use `crypto.randomUUID()` for generating UUIDs, no external UUID libraries
- **Early Returns**: Prefer guard clauses and early returns over nested if-else structures
- **Zod Validation**: Define request schemas using Zod, infer types with `z.infer<typeof Schema>`

Validation pattern example:

```typescript
import { z } from 'zod';

const RequestSchema = z.object({
  // schema definition
});

type RequestType = z.infer<typeof RequestSchema>;

// In handler logic
const result = RequestSchema.safeParse(ctx.request.body);
if (!result.success) {
  // handle validation error
}
const validatedData = result.data;
```

## Development Workflow

### Test-Driven Development

TDD MUST be followed for all Command/Query handlers. Tests MUST be written first, verified to fail, then implementation written to make tests pass. Red-Green-Refactor cycle MUST be enforced. Integration tests MUST cover Repository implementations and end-to-end Command/Query flows.

### Domain Model Evolution

Changes to domain entities MUST be reviewed for impact on existing Commands/Queries. New domain concepts MUST be introduced through proper DDD aggregates and value objects. Repository interfaces MUST evolve through versioning when breaking changes are required.

## Governance

This constitution supersedes all other development practices. All code reviews MUST verify DDD principle compliance. Architecture decisions contradicting these principles require explicit documentation and technical lead approval. Constitution amendments require team consensus and version increment.

Use project-specific guidance files for runtime development details while maintaining these core architectural principles.

**Version**: 1.3.0 | **Ratified**: 2025-10-14 | **Last Amended**: 2025-10-14
