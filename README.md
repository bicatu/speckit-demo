# Multi-User Movie & Series Tracking Application

A web application for tracking movies and series with community ratings, built with TypeScript, Node.js, Koa, React, and PostgreSQL.

## Features

- 🎬 Browse and discover movies and series
- ⭐ Rate content (1-10 stars) and view community ratings
- 🏷️ Filter by genre tags and streaming platforms
- 👤 OAuth2 authentication via WorkOS
- 👨‍💼 Admin management of platforms and tags
- 📄 Pagination (10 items per page)
- 🔍 "New to me" filter for recent additions

## Tech Stack

- **Backend**: TypeScript 5.7.2, Node.js 22.x LTS, Koa 2.16.1, PostgreSQL 16
- **Frontend**: React 18.2.0, TypeScript 5.7.2, TanStack Query 5.17.0, Vite
- **Testing**: Jest 29.7.0 (backend), Vitest (frontend)
- **Architecture**: Domain-Driven Design (DDD) with CQRS pattern

## Prerequisites

- Node.js 22.x LTS or higher
- npm 10.x or higher
- Docker and Docker Compose (for local development)

## Quick Start

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Local Services

Start PostgreSQL and OAuth mock services:

```bash
# From repository root
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Configure Environment

```bash
# Backend environment
cd backend
cp .env.example .env

# Frontend environment
cd ../frontend
cp .env.example .env
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend (from backend/)
npm run dev

# Terminal 2: Start frontend (from frontend/)
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/docs (after implementation)

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
- **Contract Tests**: API endpoints
- **Component Tests**: React components (frontend)

Run all tests:

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
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

The application uses OAuth2 authentication via WorkOS:

- **Production**: WorkOS AuthKit
- **Local Development**: Docker-based OAuth mock service

## Contributing

1. Follow TypeScript Constitution guidelines
2. Write tests first (TDD)
3. Use single quotes for strings
4. Use `crypto.randomUUID()` for UUIDs
5. Validate inputs with Zod at system boundaries

## License

MIT
