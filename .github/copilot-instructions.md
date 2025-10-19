# speckit-demo Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-15

## Active Technologies
- TypeScript 5.7.2 / Node.js 22.x LTS + Koa 2.16.1, Zod 3.22.4, WorkOS Node SDK 7.0.0, pg 8.11.3, React 18.2.0, TanStack Query 5.17.0 (001-multi-user-movie)
- TypeScript 5.7.2 / Node.js 22.x LTS (backend), TypeScript 5.7.2 (frontend) + Backend: Koa 2.16.1, Zod 3.22.4, existing IAuthProvider abstraction (Keycloak/WorkOS clients); Frontend: React 18.2.0, TanStack Query 5.17.0 (002-add-login-logout)
- PostgreSQL 16 (existing user database) (002-add-login-logout)
- PostgreSQL 16 (existing user database with is_admin field) (003-update-application-with)

## Project Structure
```
src/
tests/
```

## Commands
npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style
TypeScript 5.7.2 / Node.js 22.x LTS: Follow standard conventions

## Recent Changes
- 003-update-application-with: Added TypeScript 5.7.2 / Node.js 22.x LTS (backend), TypeScript 5.7.2 (frontend)
- 002-add-login-logout: Added TypeScript 5.7.2 / Node.js 22.x LTS (backend), TypeScript 5.7.2 (frontend) + Backend: Koa 2.16.1, Zod 3.22.4, existing IAuthProvider abstraction (Keycloak/WorkOS clients); Frontend: React 18.2.0, TanStack Query 5.17.0
- 001-multi-user-movie: Added TypeScript 5.7.2 / Node.js 22.x LTS + Koa 2.16.1, Zod 3.22.4, WorkOS Node SDK 7.0.0, pg 8.11.3, React 18.2.0, TanStack Query 5.17.0

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
