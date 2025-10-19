# Multi-User Movie & Series Tracking Application

A web application for tracking movies and series with community ratings, built with TypeScript, Node.js, Koa, React, and PostgreSQL.

## Features

- 🎬 Browse and discover movies and series
- ⭐ Rate content (1-10 stars) and view community ratings
- 🏷️ Filter by genre tags and streaming platforms
- � OAuth2/OIDC authentication (Keycloak for dev, WorkOS for production)
- 👨‍💼 Admin management of platforms and tags
- 📄 Pagination (10 items per page)
- 🔍 "New to me" filter for recent additions
- 🔒 Secure session management with in-memory token caching

## Tech Stack

- **Backend**: TypeScript 5.7.2, Node.js 22.x LTS, Koa 2.16.1, PostgreSQL 16
- **Frontend**: React 18.2.0, TypeScript 5.7.2, TanStack Query 5.17.0, Vite
- **Authentication**: Keycloak (dev/staging), WorkOS (production)
- **Testing**: Jest 29.7.0 (backend), Vitest (frontend)
- **Architecture**: Domain-Driven Design (DDD) with CQRS pattern

## Prerequisites

- Node.js 22.x LTS or higher
- npm 10.x or higher
- Docker and Docker Compose (for local development)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Services with Docker

Start PostgreSQL and Keycloak:

```bash
# From repository root
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs (Keycloak takes ~30-60 seconds to start)
docker-compose logs -f keycloak
```

### 3. Configure Environment Files

```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env and set KEYCLOAK_CLIENT_SECRET (see step 4)

# Frontend environment
cd ../frontend
cp .env.example .env
# Default values should work for local development
```

### 4. Set Up Authentication (Keycloak)

**Option A: Quick Setup (Recommended for first time)**

Follow the comprehensive guide:
```bash
cat KEYCLOAK_SETUP.md
```

This will walk you through:
1. Accessing Keycloak admin console (http://localhost:8080)
2. Creating the `movietrack` realm
3. Creating the `movietrack-app` client and getting the **client secret**
4. Creating test users (admin@test.com / admin123, user@test.com / user123)

**Option B: Already Configured**

If you already have Keycloak configured, just:
1. Copy the client secret from Keycloak admin console (Clients → movietrack-app → Credentials)
2. Paste it into `backend/.env` as `KEYCLOAK_CLIENT_SECRET`

**Important**: Update `backend/.env` with your Keycloak client secret:
```bash
KEYCLOAK_CLIENT_SECRET=<your-client-secret-here>
```

### 5. Initialize Database

```bash
cd backend

# Run migrations to create schema
npm run migrate

# (Optional) Seed sample data for testing
node scripts/seed-sample-data.ts
```

### 6. Start Development Servers

```bash
# Terminal 1: Start backend (from backend/)
cd backend
npm run dev
# Backend will run on http://localhost:3000

# Terminal 2: Start frontend (from frontend/)
cd frontend
npm run dev
# Frontend will run on http://localhost:5173
```

### 7. Test the Application

1. **Open the app**: http://localhost:5173
2. **Click "Log In"**: You'll be redirected to Keycloak
3. **Log in with test user**:
   - Email: `admin@test.com` / Password: `admin123` (admin user)
   - Email: `user@test.com` / Password: `user123` (regular user)
4. **Verify authentication**: You should see your name and "DEV" badge in the header
5. **Browse entries**: Navigate to entries, add ratings, test filters
6. **Admin features** (admin@test.com only): Create/delete platforms and tags via `/admin` page
7. **Click "Log Out"**: Session will be terminated

## API Endpoints

Once running, the backend API is available at:

- **Health Check**: http://localhost:3000/api/health
- **Entries**: http://localhost:3000/api/entries
- **Authentication**: http://localhost:3000/api/auth/*
- **Admin endpoints**: Require admin privileges (see AUTHENTICATION.md)

## Development

### Backend Commands

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend Commands

```bash
# Run tests
npm test

# Run tests with UI
npm test:ui

# Generate coverage report
npm test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── domain/           # Domain entities and business logic
│   │   ├── application/      # Application services (Commands/Queries)
│   │   ├── infrastructure/   # External concerns (Database, WorkOS)
│   │   └── ui/              # HTTP API (Koa)
│   └── tests/               # Unit, integration, and contract tests
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API client
│   └── tests/              # Component and integration tests
└── docker-compose.yml      # Local development services
```

## Testing

The project follows Test-Driven Development (TDD) with comprehensive test coverage:

- **Unit Tests**: Domain logic and business rules
- **Integration Tests**: Command/Query handlers and repositories
- **Contract Tests**: API endpoints with real database interactions
- **Component Tests**: React components (frontend)

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Backend tests with coverage
cd backend && npm test:coverage
```

### Test Database Setup

The backend tests use a separate test database to avoid interfering with development data.

1. **Create test environment file**:
   ```bash
   cd backend
   cp .env.test.example .env.test
   ```

2. **Initialize test database** (one-time setup):
   ```bash
   npm run test:db:setup
   ```

   This will:
   - Create the test database schema
   - Seed pre-configured test users (regular user and admin user)

3. **Run tests**:
   ```bash
   npm test
   ```

**Test Database Configuration**:
- Database: `movietrack_db_test` (automatically created by docker-compose)
- Pre-configured test users (UUIDs defined in `.env.test`):
  - Regular user: `550e8400-e29b-41d4-a716-446655440000`
  - Admin user: `550e8400-e29b-41d4-a716-446655440001`
- Tests automatically setup and cleanup database state

**Note**: The test database is automatically created when you run `docker-compose up`. If you need to reset it:
```bash
npm run test:db:reset
```

## Database

PostgreSQL database with the following schema:

- **users**: User accounts with OAuth2 identity
- **entries**: Movies and series with metadata
- **ratings**: User ratings (1-10 stars)
- **genre_tags**: Available genre categories
- **streaming_platforms**: Available streaming services
- **entry_tags**: Many-to-many relationship between entries and tags

## Authentication

The application uses **OAuth2/OpenID Connect (OIDC)** authentication with provider abstraction:

- **Development/Staging**: Keycloak (self-hosted, configured via Docker)
- **Production**: WorkOS AuthKit
- **Testing**: Mock provider (no external dependencies)

The provider is configured via the `AUTH_PROVIDER` environment variable. See `backend/AUTHENTICATION.md` for detailed architecture documentation and `KEYCLOAK_SETUP.md` for local setup instructions.

### Key Features

- **Provider-agnostic**: Switch between Keycloak/WorkOS without code changes
- **Secure session management**: JWT tokens with in-memory caching
- **Token cache**: >95% cache hit rate target, 10-minute token TTL
- **Error handling**: Automatic retry with user-friendly error messages
- **Environment indicator**: "DEV" badge visible in development mode

## Contributing

1. Follow TypeScript Constitution guidelines
2. Write tests first (TDD)
3. Use single quotes for strings
4. Use `crypto.randomUUID()` for UUIDs
5. Validate inputs with Zod at system boundaries

## License

MIT
