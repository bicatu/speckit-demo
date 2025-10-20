# Multi-User Movie & Series Tracking Application

A web application for tracking movies and series with community ratings, built with TypeScript, Node.js, Koa, React, and PostgreSQL.

## Features

- 🎬 Browse and discover movies and series
- ⭐ Rate content (1-10 stars) and view community ratings
- 🏷️ Filter by genre tags and streaming platforms
- 🔐 OAuth2/OIDC authentication with PKCE (RFC 7636) and Google Sign-In
- 🛡️ PKCE security - prevents authorization code interception attacks
- 🔑 Secure code verifier storage with automatic expiration and cleanup
- 👥 User approval workflow - new users require admin approval
- 📧 Email notifications for new user requests
- 👨‍💼 Admin management: platforms, tags, and user approvals
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
- SMTP server credentials (for email notifications)
- Google OAuth credentials (for Google Sign-In)

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
# Edit .env and configure:
# - KEYCLOAK_CLIENT_SECRET (see step 4)
# - SMTP settings for email notifications (see docs/EMAIL_SETUP.md)
# - ADMIN_EMAIL for receiving new user notifications

# Frontend environment
cd ../frontend
cp .env.example .env
# Default values should work for local development
```

### 4. Set Up Authentication

The application uses OAuth2/OIDC authentication. Choose your environment:

**For Local Development:**
- Follow **[KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md)** for complete Keycloak configuration
- Includes Keycloak realm setup, client configuration, and Google Sign-In integration

**For Production:**
- Follow **[WORKOS_SETUP.md](WORKOS_SETUP.md)** for WorkOS configuration
- Includes WorkOS organization setup, Google SSO connection, and deployment guide

**Quick Start (Development):**
```bash
# 1. Start Keycloak
docker-compose up -d

# 2. Follow KEYCLOAK_SETUP.md to configure realm and client

# 3. Copy client secret to backend/.env
KEYCLOAK_CLIENT_SECRET=<your-client-secret-here>
```

**Note:** Both guides link to the [Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md) for configuring Google Sign-In credentials.

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

- **users**: User accounts with OAuth2 identity and approval status
- **entries**: Movies and series with metadata
- **ratings**: User ratings (1-10 stars)
- **genre_tags**: Available genre categories
- **streaming_platforms**: Available streaming services
- **entry_tags**: Many-to-many relationship between entries and tags

### User Approval Fields

The `users` table includes fields for the approval workflow:
- `approval_status`: ENUM ('pending', 'approved', 'rejected')
- `approval_requested_at`: Timestamp when approval was requested
- `approved_by`: UUID of admin who approved/rejected
- `approved_at`: Timestamp of approval/rejection

## Authentication & Authorization

The application uses **OAuth2/OpenID Connect (OIDC)** authentication with provider abstraction.

### Architecture Overview

For detailed authentication architecture, see **[backend/AUTHENTICATION.md](backend/AUTHENTICATION.md)**

**Key Features:**
- Provider-agnostic design (Keycloak, WorkOS, or Mock)
- **PKCE (RFC 7636)** - Prevents authorization code interception attacks
- **Secure storage** - SessionStorage with 5-minute expiration and automatic cleanup
- Google Sign-In integration
- User approval workflow with email notifications
- Secure session management with token caching
- Role-based access control (Admin/User)

### Security Features

**PKCE Implementation** (v1.6.0):
- ✅ Cryptographically secure code verifier generation (256-bit entropy)
- ✅ SHA256 code challenge derivation
- ✅ One-time use with automatic cleanup
- ✅ 5-minute expiration on stored verifiers
- ✅ User-friendly error messages for storage issues
- ✅ Full backward compatibility (PKCE is optional)

**What PKCE Protects Against:**
- Authorization code interception attacks
- Man-in-the-middle attacks during OAuth flow
- Malicious apps intercepting authorization codes

See [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md) for complete PKCE documentation.

### Setup Guides

| Environment | Guide | Description |
|-------------|-------|-------------|
| **Development** | [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md) | Local Keycloak configuration with Docker |
| **Production** | [WORKOS_SETUP.md](WORKOS_SETUP.md) | WorkOS managed authentication setup |
| **Google OAuth** | [docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md) | Google Sign-In credential setup (shared) |
| **Email** | [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md) | SMTP configuration for notifications |

### User Roles

| Role | Permissions |
|------|-------------|
| **Pending** | New users awaiting admin approval (limited access) |
| **User** | Browse entries, add ratings, create entries |
| **Admin** | All user permissions + approve users + manage tags/platforms |

## Contributing

1. Follow TypeScript Constitution guidelines
2. Write tests first (TDD)
3. Use single quotes for strings
4. Use `crypto.randomUUID()` for UUIDs
5. Validate inputs with Zod at system boundaries

## License

MIT
