# Quickstart Guide

**Feature**: Multi-User Movie & Series Tracking Application  
**Date**: 2025-10-15  
**Audience**: Developers setting up the project for the first time

## Prerequisites

- **Node.js**: 22.x LTS or higher
- **Docker**: 24.x or higher with Docker Compose
- **Git**: For version control
- **WorkOS Account**: For OAuth2 authentication (production) or use local mock
- **Code Editor**: VS Code recommended with TypeScript extensions

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd speckit-demo

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `.env` file in the `backend/` directory:

```bash
# backend/.env
NODE_ENV=development
PORT=3000

# Database configuration
DATABASE_URL=postgresql://movietrack:dev_password@localhost:5432/movietrack_dev

# WorkOS OAuth2 configuration
WORKOS_API_KEY=<your-workos-api-key>
WORKOS_CLIENT_ID=<your-workos-client-id>
WORKOS_REDIRECT_URI=http://localhost:3001/auth/callback

# OR use local OAuth mock (comment out WorkOS vars above)
# OAUTH_MOCK=true
# OAUTH_MOCK_URL=http://localhost:8080

# Session secret
SESSION_SECRET=<generate-random-secret>
```

Create `.env` file in the `frontend/` directory:

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WORKOS_CLIENT_ID=<your-workos-client-id>
# OR for OAuth mock
# VITE_OAUTH_MOCK=true
```

### 3. Start Docker Services

Start PostgreSQL and optional OAuth mock:

```bash
# From repository root
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:

```text
NAME                COMMAND                  SERVICE    STATUS
postgres            "docker-entrypoint.s…"   postgres   Up
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate

# Expected output: All migrations applied successfully
```

### 5. Seed Initial Data (Optional)

```bash
npm run seed

# Creates:
# - Admin user (admin@example.com)
# - Sample streaming platforms (Netflix, Disney+, HBO Max, etc.)
# - Sample genre tags (Action, Comedy, Drama, Sci-Fi, etc.)
# - Sample entries with ratings
```

### 6. Start Development Servers

**Terminal 1 - Backend**:

```bash
cd backend
npm run dev

# Server starts at http://localhost:3000
# API available at http://localhost:3000/api/v1
```

**Terminal 2 - Frontend**:

```bash
cd frontend
npm run dev

# Frontend starts at http://localhost:3001
```

### 7. Access the Application

- **Frontend**: http://localhost:3001
- **API Docs** (Swagger): http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## First-Time User Flow

1. **Navigate to** http://localhost:3001
2. **Click "Sign In"** - redirects to WorkOS (or OAuth mock)
3. **Authenticate** with your OAuth provider
4. **Redirected back** to application as authenticated user
5. **Browse entries** created by seed data
6. **Add a rating** to an existing entry
7. **Create a new entry** with title and genre tags

## Admin Access

To access admin features (platform/tag management):

1. **Set admin flag** in database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

2. **Refresh the application** - admin menu should appear
3. **Manage platforms and tags** via admin interface

## Testing

### Run All Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode for TDD
npm run test:watch
```

### Test Coverage

```bash
npm run test:coverage

# Coverage report generated in coverage/ directory
```

## Project Structure Overview

```text
backend/
├── src/
│   ├── domain/          # Business logic (entities, repository interfaces)
│   ├── application/     # Command/Query handlers
│   ├── infrastructure/  # Repository implementations, DB connections
│   └── ui/              # Koa HTTP actions, middleware
└── tests/               # Jest tests (unit, integration, contract)

frontend/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── services/        # API client
│   └── hooks/           # React hooks (TanStack Query)
└── tests/               # React Testing Library tests
```

## Common Commands

### Backend

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database migrations
npm run migrate

# Database seed
npm run seed

# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and format
npm run lint
npm run format
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f postgres

# Rebuild services
docker-compose up -d --build

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

## API Examples

### Create an Entry

```bash
curl -X POST http://localhost:3000/api/v1/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "The Matrix",
    "mediaType": "film",
    "tagIds": ["<action-tag-id>", "<sci-fi-tag-id>"],
    "platformId": "<netflix-id>",
    "personalRating": 9
  }'
```

### Get Entries with Filters

```bash
# Get all entries (page 1)
curl http://localhost:3000/api/v1/entries?page=1 \
  -H "Authorization: Bearer <your-token>"

# Filter by genre tag
curl "http://localhost:3000/api/v1/entries?tagIds=<action-tag-id>" \
  -H "Authorization: Bearer <your-token>"

# Filter by media type
curl "http://localhost:3000/api/v1/entries?mediaType=film" \
  -H "Authorization: Bearer <your-token>"

# Get entries new to me
curl "http://localhost:3000/api/v1/entries?newToMe=true" \
  -H "Authorization: Bearer <your-token>"
```

### Add/Update Rating

```bash
curl -X POST http://localhost:3000/api/v1/entries/<entry-id>/ratings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"stars": 8}'
```

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### OAuth Authentication Issues

1. **Verify WorkOS credentials** in `.env`
2. **Check redirect URI** matches WorkOS dashboard configuration
3. **Use OAuth mock** for local development (set `OAUTH_MOCK=true`)

### Migration Failures

```bash
# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Force reset (WARNING: deletes all data)
npm run migrate:reset
npm run migrate
npm run seed
```

### Test Failures

```bash
# Clear Jest cache
npm run test -- --clearCache

# Run tests in verbose mode
npm run test -- --verbose

# Run specific test file
npm run test -- path/to/test.spec.ts
```

## Development Workflow

### Test-Driven Development (TDD)

1. **Write failing test** for new feature (Red)
2. **Implement minimal code** to pass test (Green)
3. **Refactor code** while keeping tests green (Refactor)
4. **Commit changes** with descriptive message

Example:

```bash
# Start test watch mode
npm run test:watch

# Edit test file: tests/unit/application/commands/CreateEntryCommand.spec.ts
# Watch test fail (Red)

# Edit implementation: src/application/commands/CreateEntryCommand.ts
# Watch test pass (Green)

# Refactor if needed
# Commit changes
git add .
git commit -m "feat: add CreateEntryCommand with title validation"
```

### Adding a New Feature

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Write domain entities/value objects** (if needed)
3. **Define repository interfaces** in Domain layer
4. **Write Command/Query** in Application layer (TDD)
5. **Implement repository** in Infrastructure layer
6. **Create HTTP action** in UI layer with Zod validation
7. **Add route** to Koa router
8. **Write integration tests**
9. **Update OpenAPI spec** in `specs/001-multi-user-movie/contracts/openapi.yaml`
10. **Create pull request**

## Production Deployment

### Environment Configuration

Production `.env` should include:

```bash
NODE_ENV=production
PORT=8080

# Production database (managed PostgreSQL)
DATABASE_URL=<production-database-url>

# WorkOS production credentials
WORKOS_API_KEY=<production-api-key>
WORKOS_CLIENT_ID=<production-client-id>
WORKOS_REDIRECT_URI=https://yourdomain.com/auth/callback

# Strong session secret
SESSION_SECRET=<secure-random-secret>

# CORS origin
CORS_ORIGIN=https://yourdomain.com
```

### Build and Deploy

```bash
# Build backend
cd backend
npm run build
# Outputs to backend/dist/

# Build frontend
cd frontend
npm run build
# Outputs to frontend/dist/

# Deploy to hosting platform (e.g., Railway, Render, Vercel)
# OR containerize with Docker
```

### Database Migrations (Production)

```bash
# Run migrations before deployment
npm run migrate

# Verify migrations applied
npm run migrate:status
```

## Additional Resources

- **API Documentation**: See `contracts/openapi.yaml`
- **Data Model**: See `data-model.md`
- **Architecture**: See Constitution in `.specify/memory/constitution.md`
- **Feature Spec**: See `spec.md`
- **Implementation Plan**: See `plan.md`

## Getting Help

- **Issues**: Report bugs via GitHub Issues
- **Questions**: Check existing documentation first
- **Contributions**: Follow TDD workflow and Constitution principles

## Next Steps

After setup, consider:

1. **Explore the codebase** - start with `backend/src/domain/entities/`
2. **Run tests** - understand test patterns
3. **Read the spec** - understand user stories and acceptance criteria
4. **Try the API** - use Swagger UI or curl examples
5. **Make a change** - follow TDD workflow to add a small feature
