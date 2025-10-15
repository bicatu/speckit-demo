# Research & Technology Decisions

**Feature**: Multi-User Movie & Series Tracking Application  
**Date**: 2025-10-15  
**Status**: Phase 0 - Research Complete

## Research Tasks

### 1. Frontend Framework Choice

**Decision**: React 18 with TypeScript

**Rationale**:
- Excellent TypeScript integration and type safety
- Large ecosystem of UI component libraries (e.g., Material-UI, Ant Design)
- Strong community support and documentation
- React Query (TanStack Query) provides excellent data fetching and caching capabilities
- Proven track record for web applications with complex state management
- Easy integration with Koa backend through REST APIs

**Alternatives Considered**:
- **Vue 3**: Strong contender with good TypeScript support, but smaller ecosystem for enterprise components
- **Svelte**: Excellent performance and simplicity, but smaller community and fewer TypeScript-specific resources
- **Angular**: Comprehensive framework with built-in features, but heavier and more opinionated than needed for this scope

### 2. Specific Package Versions and Dependencies

**Decision**: Core dependencies with version pinning

```json
{
  "backend": {
    "koa": "^2.16.1",
    "koa-bodyparser": "^4.4.1",
    "koa-router": "^13.0.1",
    "@types/koa-bodyparser": "^4.3.12",
    "zod": "^3.22.4",
    "@workos-inc/node": "^7.0.0",
    "pg": "^8.11.3",
    "dotenv": "^16.4.5"
  },
  "frontend": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.7.2",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "react-router-dom": "^6.21.0"
  },
  "testing": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-jest-mocker": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

**Rationale**:
- Koa 2.16.1: Latest stable version with excellent middleware ecosystem
- Zod 3.22.4: Industry-standard schema validation with strong TypeScript inference
- WorkOS Node SDK 7.0.0: Official SDK with OAuth2 support and TypeScript types
- pg 8.11.3: Mature PostgreSQL client with connection pooling
- React 18.2.0: Latest stable with concurrent features and improved performance
- TanStack Query 5.x: Modern data fetching with caching, invalidation, and optimistic updates
- TypeScript 5.7.2: Latest stable with improved type inference and performance
- Node.js 22.x LTS: Latest LTS with enhanced performance and modern JavaScript features

**Alternatives Considered**:
- **TypeORM/Prisma**: ORM solutions considered but rejected to maintain DDD purity and avoid framework lock-in; using pg directly with repository pattern provides more control
- **Express**: More popular but Koa provides cleaner async/await support and better middleware composition

### 3. Concurrent User Targets and Scalability

**Decision**: Target 100-500 concurrent users with horizontal scaling capability

**Rationale**:
- Based on spec requirement: "Entry lists load within 3 seconds with 1000+ entries"
- PostgreSQL connection pooling (pg.Pool) can handle 20-100 connections per instance
- Koa is lightweight and supports 1000+ requests/second on modest hardware
- Horizontal scaling through load balancer + multiple Node.js instances
- Database indexes on frequently queried fields (title, tags, creation_date, user_id)

**Performance Strategy**:
- Pagination limits result sets to 10 items (spec requirement)
- Database indexes on: `entries.title`, `entries.created_at`, `ratings.entry_id`, `entry_tags.tag_id`
- Connection pooling with max 20 connections per backend instance
- Consider Redis caching for average ratings calculation if performance issues arise (future optimization)

**Alternatives Considered**:
- **Aggressive caching**: Initially rejected to keep architecture simple; will implement only if performance testing reveals bottlenecks
- **NoSQL database**: Rejected because relational model fits domain perfectly and PostgreSQL provides necessary ACID guarantees for ratings consistency

### 4. Expected User Count and Data Volume

**Decision**: Initial scale: 500 users, 5,000 entries, 25,000 ratings

**Rationale**:
- Provides realistic testing targets for pagination and query performance
- Database size estimation: ~50MB for entries/users, ~100MB for ratings
- Allows for growth to 5,000 users without major architectural changes
- PostgreSQL easily handles this scale on modest hardware (4GB RAM, 2 CPU)

**Scalability Headroom**:
- PostgreSQL can scale to millions of rows with proper indexing
- Application layer is stateless and horizontally scalable
- Docker Compose for local development, can migrate to Kubernetes for production scaling

**Alternatives Considered**:
- **Microservices architecture**: Rejected as over-engineering for initial scale; monolithic backend with clear DDD layers provides sufficient separation and easier local development

### 5. OAuth2 Implementation with WorkOS

**Decision**: WorkOS AuthKit for OAuth2 with local Docker mock for development

**Rationale**:
- WorkOS AuthKit provides hosted UI and OAuth2 flows out-of-the-box
- Supports multiple identity providers (Google, Microsoft, etc.) through single integration
- Local development uses WorkOS staging environment or Docker-based mock OAuth server
- Token validation at Koa middleware layer before requests reach application handlers

**Implementation Pattern**:
```typescript
// UI layer: Koa middleware validates OAuth2 tokens
// Application layer: Receives user identity in Command/Query context
// Domain layer: No authentication concerns
```

**Alternatives Considered**:
- **Auth0**: Similar features but WorkOS is simpler for B2B use cases and has cleaner API
- **Custom OAuth2**: Rejected per Constitution principle X (no custom auth mechanisms)
- **Passport.js**: Popular library but adds unnecessary abstraction layer; WorkOS SDK is sufficient

### 6. Database Schema Design Strategy

**Decision**: Normalized relational schema with junction tables for many-to-many relationships

**Rationale**:
- Entries ↔ Tags: Many-to-many through `entry_tags` junction table (max 3 tags per entry enforced at application layer)
- Users ↔ Ratings ↔ Entries: Composite key on (user_id, entry_id) ensures one rating per user per entry
- Unique constraint on `entries.title` enforces business rule FR-003
- Foreign key constraints ensure referential integrity

**Schema Entities**:
- `users`: id, oauth_subject, email, name, is_admin, last_login, created_at
- `entries`: id, title, platform_id (nullable), creator_id, created_at, updated_at
- `ratings`: user_id, entry_id, stars (1-10), created_at, updated_at (composite PK)
- `streaming_platforms`: id, name
- `genre_tags`: id, name
- `entry_tags`: entry_id, tag_id (composite PK with CHECK constraint: max 3 per entry)

**Alternatives Considered**:
- **JSON columns for tags**: Rejected because relational queries and tag management require structured approach
- **Soft deletes**: Not using soft deletes; when user deleted, foreign key to `creator_id` SET NULL or replace with sentinel value for "Deleted User"

### 7. Development Environment Setup

**Decision**: Docker Compose for all external services with .env configuration

**docker-compose.yml services**:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: movietrack
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: movietrack_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  oauth-mock:
    image: ghcr.io/oauth2-proxy/oauth2-proxy:v7.5.1
    # Configuration for local OAuth2 mock server
    # OR use WorkOS staging environment
```

**Rationale**:
- Eliminates manual PostgreSQL installation for new developers
- Version pinning ensures consistency across development environments
- Volume persistence maintains data across container restarts
- Environment variables for sensitive configuration (.env file, not committed)

**Alternatives Considered**:
- **SQLite**: Rejected because PostgreSQL-specific features needed (JSONB for future use, advanced indexing)
- **Manual PostgreSQL installation**: Rejected per Constitution principle IX

### 8. Frontend-Backend Communication Pattern

**Decision**: REST API with JSON responses, TanStack Query for frontend state management

**API Design**:
- RESTful endpoints following resource-oriented design
- OpenAPI/Swagger documentation generated from Zod schemas
- CORS configuration for local development (backend: 3000, frontend: 3001)
- JWT access tokens in Authorization header for authenticated requests

**Rationale**:
- REST is simpler for CRUD operations than GraphQL for this use case
- Zod schemas serve dual purpose: runtime validation + OpenAPI documentation
- TanStack Query handles caching, optimistic updates, and invalidation
- Standard HTTP status codes (200, 201, 400, 401, 404, 500)

**Alternatives Considered**:
- **GraphQL**: Rejected as over-engineering; REST suffices for straightforward CRUD
- **tRPC**: Interesting for TypeScript end-to-end typing but adds complexity and reduces standard HTTP compatibility

### 9. Testing Strategy

**Decision**: Unit tests for domain logic, integration tests for handlers, E2E tests for critical flows

**Test Coverage Targets**:
- Domain entities: 100% (pure logic, easy to test)
- Application handlers: 90% (command/query logic with mocked repositories)
- Infrastructure repositories: 80% (integration tests with test database)
- UI actions: 70% (HTTP endpoint tests with test dependencies)
- Frontend components: 60% (critical user flows)

**Test Organization**:
```
backend/tests/
  unit/
    domain/
      entities/
      value-objects/
  integration/
    application/
      commands/
      queries/
    infrastructure/
      domain/
  contract/
    repositories/

frontend/tests/
  unit/
    components/
  integration/
    pages/
```

**Rationale**:
- Constitution requires TDD for command/query handlers
- Test database with Docker for integration tests
- Jest + ts-jest for TypeScript support
- React Testing Library for component tests

**Alternatives Considered**:
- **BDD with Cucumber**: Rejected as over-engineering for team size; Gherkin acceptance scenarios in spec.md suffice

## Open Questions (for clarification)

None - all NEEDS CLARIFICATION items from Technical Context have been resolved.

## References

- WorkOS Documentation: https://workos.com/docs
- Koa Framework: https://koajs.com/
- Zod: https://zod.dev/
- TanStack Query: https://tanstack.com/query/latest
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- DDD Patterns: Domain-Driven Design by Eric Evans
