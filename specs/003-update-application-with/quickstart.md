# Quickstart Guide: Home Page Authentication & Admin Management

## Overview

This guide walks through setting up the development environment for the home page authentication and admin management feature. **Following the backend-first development approach**, we'll set up and test the backend completely before proceeding to frontend implementation.

**Important**: Google Sign-In is configured in **Keycloak/WorkOS**, NOT in our application code. Our application only needs to handle user approval workflow and admin management.

## Prerequisites

- Node.js 22.x LTS
- PostgreSQL 16
- Docker and Docker Compose (for running PostgreSQL)
- **Keycloak or WorkOS** configured with Google as identity provider (see setup below)
- SMTP server access or email service credentials (for admin notifications)

## Phase A-D: Backend Setup & Testing

### Step 1: Environment Configuration

Create or update your `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/moviedb
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/moviedb_test

# Authentication - Use existing Keycloak or WorkOS configuration
# See AUTHENTICATION.md and KEYCLOAK_SETUP.md for details
AUTH_PROVIDER=keycloak  # or workos or mock
JWT_SECRET=your-secret-key-here

# Keycloak Configuration (if using Keycloak)
KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/movietrack
KEYCLOAK_CLIENT_ID=movietrack-app
KEYCLOAK_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# WorkOS Configuration (if using WorkOS)
# WORKOS_API_KEY=sk_your_api_key
# WORKOS_CLIENT_ID=client_your_client_id
# OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@example.com

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

New dependencies being added:

- `nodemailer` - Email sending library (for admin notifications)
- `@types/nodemailer` - TypeScript definitions for nodemailer

**Note**: No Google OAuth libraries needed - authentication is handled by Keycloak/WorkOS

### Step 3: Configure Google Sign-In in Keycloak/WorkOS

**Important**: Google authentication is configured in your OAuth provider (Keycloak or WorkOS), NOT in the application code.

#### Option A: Keycloak Setup

If using Keycloak (recommended for development):

1. **Start Keycloak** (if not already running):
   ```bash
   docker-compose up -d keycloak
   ```

2. **Configure Google Identity Provider**:
   - See [KEYCLOAK_SETUP.md](/KEYCLOAK_SETUP.md) for detailed Keycloak setup
   - In Keycloak admin console: Realm Settings → Identity Providers → Add Google
   - Obtain Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Enter credentials in Keycloak

3. **Verify Configuration**:
   - Test login flow at `http://localhost:8080/realms/movietrack/account`
   - Should see "Sign in with Google" button

#### Option B: WorkOS Setup

If using WorkOS:

1. **WorkOS Dashboard**: Go to [WorkOS Dashboard](https://dashboard.workos.com/)
2. **Add Google Connection**: Connections → Add Connection → Google OAuth
3. WorkOS handles Google configuration automatically

#### Option C: Mock Provider (Development Only)

For quick local development without OAuth setup:

```bash
# In .env
AUTH_PROVIDER=mock
```

See [AUTHENTICATION.md](/backend/AUTHENTICATION.md) for mock provider usage.

### Step 4: Email Service Setup (Admin Notifications)

#### Option A: Gmail with App Password

1. Enable 2-factor authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in `SMTP_PASSWORD`

#### Option B: Development Mode (Console Logging)

For development, you can use a mock email service that logs to console:

```bash
EMAIL_PROVIDER=mock
```

### Step 5: Database Migration

Start PostgreSQL using Docker Compose:

```bash
cd ..
docker-compose up -d postgres
```

Run the new migration:

```bash
cd backend
npm run migrate
```

This applies migration `005_add_user_approval_status.sql`:

- Creates `approval_status` ENUM type
- Adds `approval_status` column to users table
- Adds `approval_requested_at` timestamp column
- Adds `approved_by` foreign key column
- Adds `approved_at` timestamp column
- Creates indexes on `approval_status` and `approval_requested_at`

### Step 6: Run Backend Tests

**Following backend-first approach: Test backend thoroughly before frontend work**

Run all tests:

```bash
npm test
```

Run specific test suites:

```bash
# Domain layer tests
npm test -- User.test.ts

# Application layer tests
npm test -- ApproveUserCommandHandler.test.ts
npm test -- RejectUserCommandHandler.test.ts
npm test -- GetPendingUsersQueryHandler.test.ts

# Infrastructure layer tests
npm test -- EmailService.test.ts
# Note: No GoogleAuthProvider tests needed - auth handled by Keycloak/WorkOS

# API endpoint tests
npm test -- auth.test.ts
npm test -- users.test.ts
```

Run integration tests:

```bash
npm test -- integration
```

Expected test coverage:

- Domain entities: >90%
- Command/Query handlers: >80%
- API endpoints: >80%

### Step 7: Start Backend Server

```bash
npm run dev
```

Backend should now be running on `http://localhost:3001`

### Step 8: Manual Backend Testing

Use curl or Postman to test endpoints:

```bash
# 1. Initiate OAuth login (redirects to Keycloak/WorkOS)
curl -v http://localhost:3001/api/auth/login

# 2. Get current user (should return 401 without token)
curl http://localhost:3001/api/auth/me

# 3. After completing OAuth flow in browser, get pending users (admin only)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/users/pending

# 4. Approve a user
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/users/USER_ID/approve

# 5. Reject a user
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/users/USER_ID/reject
```

### Step 9: Verify Backend Integration

Checklist before proceeding to frontend:

- [ ] OAuth flow initiates correctly (redirects to Keycloak/WorkOS)
- [ ] Keycloak/WorkOS shows "Sign in with Google" button
- [ ] OAuth callback successfully creates/authenticates users
- [ ] New users are created with `pending` approval status
- [ ] Admin email notification is sent for new user requests
- [ ] Admin can retrieve pending users list
- [ ] Admin can approve users (status changes to `approved`)
- [ ] Admin can reject users (status changes to `rejected`)
- [ ] Pending users cannot access protected endpoints (401 Forbidden)
- [ ] Approved users can access protected endpoints
- [ ] JWT tokens are issued correctly
- [ ] All unit tests pass
- [ ] All integration tests pass

**DO NOT proceed to frontend until all backend items are verified**

## Phase E: Frontend Setup

### Step 10: Frontend Environment Configuration

Create `.env` file in the `frontend/` directory:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

**Note**: No Google OAuth configuration needed in frontend - authentication is handled by backend through Keycloak/WorkOS.

### Step 11: Install Frontend Dependencies

```bash
cd frontend
npm install
```

**Note**: No new dependencies required - React Router and TanStack Query already in place. Authentication uses existing `/api/auth/login` and `/api/auth/callback` endpoints.

### Step 12: Start Frontend Development Server

```bash
npm run dev
```

Frontend should now be running on `http://localhost:3000`

### Step 13: Manual Frontend Testing

1. **Unauthenticated Access**
   - Visit `http://localhost:3000`
   - Should redirect to login page
   - Should NOT see entry list

2. **OAuth Sign-In Flow**
   - Click "Login" button
   - Redirects to Keycloak/WorkOS login page
   - **Keycloak/WorkOS shows "Sign in with Google" button**
   - Complete OAuth consent screen through Keycloak/WorkOS
   - First-time users: Redirected back, see "Awaiting Approval" message
   - Returning approved users: Redirected back, see entry list
   - Pending users: See "Awaiting Approval" message

3. **Admin User Workflow**
   - Log in as admin user
   - Navigate to Admin Management page
   - View pending users list
   - Approve/reject pending users
   - Verify status updates immediately

4. **Session Management**
   - Verify token refresh happens silently in background
   - Test logout functionality
   - Verify redirect to login page after logout

### Step 14: Run Frontend Tests

```bash
npm test
```

Run specific test suites:

```bash
# Component tests
npm test -- LoginPage.test.tsx
npm test -- PendingUsersPage.test.tsx
npm test -- AdminManagementPage.test.tsx

# Hook tests
npm test -- useAuth.test.ts

# Integration tests
npm test -- integration
```

## Development Workflow

### Backend-First Approach

1. **Backend Development (Phases A-D)**
   - Implement domain entities
   - Implement application layer (commands/queries)
   - Implement infrastructure (auth provider, email service)
   - Implement API endpoints
   - Write and pass all backend tests
   - Manually verify all endpoints

2. **Frontend Development (Phase E)**
   - Only after backend is fully tested
   - Implement UI components
   - Implement hooks and services
   - Connect to verified backend endpoints
   - Write and pass frontend tests

### Testing Strategy

- **Unit Tests**: Test each layer in isolation using mocks
- **Integration Tests**: Test backend flow end-to-end
- **Manual Tests**: Verify OAuth flow and email notifications
- **E2E Tests** (optional): Full user journey testing

## Troubleshooting

### Google OAuth Issues

**Problem**: "redirect_uri_mismatch" error

**Solution**: Ensure redirect URI in Google Console exactly matches `GOOGLE_REDIRECT_URI` in `.env`

### Email Not Sending

**Problem**: Admin notifications not received

**Solution**: 
- Check SMTP credentials in `.env`
- Verify `ADMIN_EMAIL` is correct
- Check email service logs: `npm run dev` output
- For Gmail: Ensure App Password is used, not regular password

### Database Migration Fails

**Problem**: Migration `005_add_user_approval_status.sql` fails

**Solution**:
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database connection: `psql -U postgres -h localhost moviedb`
- Verify no existing `approval_status` type: `\dT+ approval_status`

### Tests Failing

**Problem**: Backend tests fail with connection errors

**Solution**:
- Ensure test database exists: `createdb moviedb_test -U postgres`
- Check `TEST_DATABASE_URL` in `.env`
- Run migrations on test DB: `NODE_ENV=test npm run migrate`

### JWT Token Issues

**Problem**: `401 Unauthorized` on protected endpoints

**Solution**:
- Verify JWT token is included in `Authorization: Bearer TOKEN` header
- Check token expiry in JWT payload
- Verify `JWT_SECRET` matches between token generation and validation

## Next Steps

After completing the quickstart setup:

1. Review the [Implementation Plan](./plan.md) for detailed development phases
2. Review the [Data Model](./data-model.md) for entity and database details
3. Review the [API Contracts](./contracts/openapi.yaml) for endpoint specifications
4. Begin backend implementation following the constitution guidelines
5. Run tests continuously during development (TDD approach)

## Support

For issues or questions:

- Check the [spec.md](./spec.md) for functional requirements
- Review the [research.md](./research.md) for technical decisions
- Consult the backend [AUTHENTICATION.md](/backend/AUTHENTICATION.md) for auth patterns
