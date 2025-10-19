# Research: Home Page Authentication & Admin Management

**Date**: October 19, 2025
**Feature**: Home Page Authentication & Admin Management
**Phase**: 0 - Research & Technical Decisions

## Overview

This document captures research findings and technical decisions for implementing home page authentication routing, Google SSO integration, user approval workflow, and admin management capabilities.

## Research Areas

### 1. Google Sign-In Integration

**Decision**: Configure Google as an identity provider in Keycloak/WorkOS (NO application code changes)

**Rationale**:
- Existing IAuthProvider abstraction (Keycloak/WorkOS) already handles OAuth flows
- Google Sign-In is configured in the OAuth provider's admin panel, not in our application
- No new authentication code needed - existing `/auth/login` and `/auth/callback` endpoints work unchanged
- Maintains separation of concerns: OAuth provider handles authentication, our app handles authorization

**How it works**:
1. User clicks login → Frontend redirects to backend `/auth/login`
2. Backend calls `authProvider.getAuthorizationUrl()` → Keycloak/WorkOS login page URL
3. **Keycloak/WorkOS displays "Sign in with Google" button** (configured in their admin UI)
4. User authenticates with Google through Keycloak/WorkOS
5. Keycloak/WorkOS redirects to frontend `/auth/callback` with code
6. Frontend sends code to backend `/auth/callback`
7. Backend calls `authProvider.authenticateWithCode()` → exchanges code for token
8. User is authenticated!

**Configuration Required** (in Keycloak/WorkOS admin panel, not code):
- **Keycloak**: Add Google Identity Provider in realm settings
  - Obtain Google OAuth client credentials from Google Cloud Console
  - Configure in Keycloak: Realm Settings → Identity Providers → Add Google
- **WorkOS**: Add Google OAuth connection in WorkOS dashboard
  - WorkOS handles Google OAuth configuration automatically

**No Application Code Changes Needed For Google OAuth**

**References**:
- Keycloak Google IDP Setup: https://www.keycloak.org/docs/latest/server_admin/#_google
- WorkOS Google OAuth: https://workos.com/docs/sso/google

### 2. Email Notification Service

**Decision**: Use Nodemailer with SMTP configuration

**Rationale**:
- Industry-standard Node.js email library with wide adoption
- Supports multiple transport methods (SMTP, SendGrid, AWS SES, etc.)
- Easy to mock and test
- Allows configuration flexibility for different environments
- Lightweight with minimal dependencies

**Alternatives Considered**:
- SendGrid SDK: Rejected due to vendor lock-in and additional cost
- AWS SES directly: Rejected because it requires AWS infrastructure
- Built-in Node.js mail: Too low-level and lacks features

**Implementation Details**:
- Create IEmailService interface in Infrastructure layer
- Implement NodemailerEmailService with SMTP configuration
- Support HTML and plain text email formats
- Include retry logic for transient failures
- Log all email attempts (success and failure) per FR-027
- Make email sending non-blocking (don't fail user auth if email fails)

**Configuration**:
```typescript
interface EmailConfig {
  host: string;           // SMTP_HOST
  port: number;           // SMTP_PORT
  secure: boolean;        // SMTP_SECURE
  auth: {
    user: string;         // SMTP_USER
    pass: string;         // SMTP_PASS
  };
  from: string;           // EMAIL_FROM
  adminEmail: string;     // ADMIN_EMAIL
}
```

**Email Template for New User Notification**:
- Subject: "New User Access Request - [user email]"
- Body includes: User email, full name, timestamp, link to pending users page
- Clear call-to-action for admin to review and approve

**References**:
- Nodemailer: https://nodemailer.com/
- SMTP Best Practices: https://nodemailer.com/smtp/

### 3. User Approval Status Management

**Decision**: Add approval_status ENUM field to users table

**Rationale**:
- Clear state machine with explicit states
- Allows future expansion (e.g., rejected, suspended states)
- Database-enforced constraints prevent invalid states
- Better than boolean flags for state management

**States**:
- `pending`: User authenticated but not approved (initial state for new users)
- `approved`: User has been approved by admin (can access system)
- `rejected`: User has been rejected by admin (cannot access system)

**Database Schema**:
```sql
CREATE TYPE user_approval_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE users 
  ADD COLUMN approval_status user_approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN approval_requested_at TIMESTAMP,
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMP;

CREATE INDEX idx_users_approval_status ON users(approval_status);
```

**Domain Model Extension**:
```typescript
class User {
  // Existing fields...
  private _approvalStatus: 'pending' | 'approved' | 'rejected';
  private _approvalRequestedAt: Date | null;
  private _approvedBy: string | null;
  private _approvedAt: Date | null;

  // Business methods
  public approve(adminUserId: string): void;
  public reject(): void;
  public isPending(): boolean;
  public isApproved(): boolean;
}
```

**Alternatives Considered**:
- Boolean flag (is_approved): Rejected because it doesn't capture rejected state
- Separate status table: Over-engineering for simple enum
- String field without enum: No database-level validation

### 4. Session Refresh Strategy

**Decision**: Implement token refresh interceptor in frontend with automatic retry

**Rationale**:
- Existing backend already supports token refresh via IAuthProvider
- Frontend needs to detect expiring tokens and refresh proactively
- Axios interceptors provide clean integration point
- Maintains user experience per FR-026 (silent refresh)

**Implementation Details**:
- Check token expiration in AuthContext on app load and periodically
- Refresh tokens 5 minutes before expiration
- Use axios request interceptor to attach fresh tokens
- Use axios response interceptor to handle 401 and retry with refreshed token
- Fall back to redirect to login if refresh fails

**Token Storage**:
- Store access token and refresh token in memory (AuthContext state)
- Store refresh token in httpOnly cookie for security (backend sets)
- Never store tokens in localStorage (XSS vulnerability)

**References**:
- OAuth Token Refresh: https://www.oauth.com/oauth2-servers/access-tokens/refreshing-access-tokens/
- Axios Interceptors: https://axios-http.com/docs/interceptors

### 5. Frontend Route Protection

**Decision**: Implement route guards using React Router and AuthContext

**Rationale**:
- React Router 6.21 supports loader functions for route protection
- AuthContext provides centralized authentication state
- Allows redirect logic based on authentication and approval status
- Maintains SPA experience with client-side routing

**Route Structure**:
```typescript
/ (HomePage)
  - If authenticated + approved → show EntryList component
  - If authenticated + pending → redirect to /pending-approval
  - If not authenticated → redirect to /login

/login (LoginPage)
  - Show Google login button
  - Redirect to / if already authenticated

/pending-approval (PendingApprovalPage)
  - Show pending message
  - Only accessible if authenticated + pending
  - Auto-refresh to check approval status

/admin/pending-users (PendingUsersPage)
  - Admin only route
  - Show list of pending users with approve/reject actions
  - Redirect to / if not admin

/admin/manage (ManageResourcesPage)
  - Admin only route
  - Tabs for tags and platforms management
  - Redirect to / if not admin
```

**Implementation Pattern**:
```typescript
function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireApproved = true 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireApproved && user?.approvalStatus === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }
  
  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
```

### 6. Backend-First Implementation Strategy

**Decision**: Implement and test all backend changes before frontend work

**Rationale**: Per user requirement: "make sure to do first backend changes, test them before doing the frontend changes"

**Implementation Order**:

**Phase A - Backend Foundation (Test after each step)**:
1. Database migration (approval_status field)
2. User entity extension (approval status methods)
3. Repository interface and implementation updates
4. Email service interface and Nodemailer implementation
5. Unit tests for domain and infrastructure layer

**Phase B - Backend Application Layer (Test after each step)**:
6. ApproveUserCommand and handler
7. RejectUserCommand and handler
8. GetPendingUsersQuery and handler
9. Unit tests for all command/query handlers

**Phase C - Backend API Layer (Test after each step)**:
10. **NO Google OAuth provider needed** (Keycloak/WorkOS handles this)
11. Extend existing auth callback to create new users with pending status
12. Add email notification in callback handler
13. Pending users endpoints (GET, POST approve, POST reject)
14. Middleware updates for pending user handling
15. Integration tests for all new endpoints

**Phase D - Backend Integration Testing**:
15. End-to-end tests for user approval workflow
16. Manual testing with Postman/curl
17. Verify email sending (use Mailtrap or similar for dev)

**Phase E - Frontend (After backend is complete and tested)**:
18. AuthContext updates
19. New pages and components
20. Route protection implementation
21. Frontend unit tests
22. Frontend integration tests
23. Manual E2E testing

**Testing Checkpoints**:
- After Phase A: Domain logic works correctly
- After Phase B: Application layer processes commands/queries
- After Phase C: API endpoints return correct responses
- After Phase D: Full backend workflow functional
- After Phase E: Complete feature works end-to-end

### 7. Google Sign-In Configuration (External to Application)

**Decision**: Configure Google as identity provider in Keycloak/WorkOS admin panel

**Rationale**:
- No application code changes required
- Separation of concerns: OAuth provider handles authentication
- Existing `/auth/login` and `/auth/callback` endpoints work unchanged
- Admin controls identity providers without code deployments

**Keycloak Configuration** (if using Keycloak):
1. Obtain Google OAuth credentials from Google Cloud Console
2. In Keycloak admin: Realm Settings → Identity Providers → Add Provider → Google
3. Enter Google Client ID and Secret
4. Configure attribute mappers (email, name, etc.)
5. Test the connection

**WorkOS Configuration** (if using WorkOS):
1. WorkOS dashboard → Connections → Add Connection → Google OAuth
2. WorkOS handles Google OAuth configuration automatically
3. No additional setup required

**No Environment Variables Needed in Application** - All Google OAuth configuration happens in Keycloak/WorkOS

**References**:
- Keycloak Google IDP: <https://www.keycloak.org/docs/latest/server_admin/#_google>
- WorkOS Google OAuth: <https://workos.com/docs/sso/google>

## Best Practices Applied

### Security

1. **Token Storage**: Refresh tokens in httpOnly cookies, access tokens in memory
2. **PKCE**: Use Proof Key for Code Exchange for OAuth flow
3. **Token Validation**: Verify JWT signatures using Google's public keys
4. **CSRF Protection**: Implement state parameter in OAuth flow
5. **Rate Limiting**: Add rate limits to approval endpoints (prevent abuse)

### Error Handling

1. **Email Failures**: Log and continue per FR-027
2. **OAuth Failures**: Show user-friendly messages per FR-019
3. **Network Errors**: Implement retry logic with exponential backoff
4. **Validation Errors**: Use Zod for consistent error formatting

### Performance

1. **Token Caching**: Cache validated tokens in-memory (existing implementation)
2. **Database Indexes**: Index approval_status field for fast queries
3. **Lazy Loading**: Load pending users list only when needed
4. **Optimistic Updates**: Update UI immediately, sync with backend

### Testing

1. **TDD**: Write tests before implementation (Red-Green-Refactor)
2. **Mocking**: Use ts-jest-mocker for consistent mocking
3. **Integration Tests**: Test full API workflows
4. **E2E Tests**: Verify complete user journeys

## Dependencies to Add

### Backend

```json
{
  "dependencies": {
    "nodemailer": "^6.9.7"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14"
  }
}
```

### Frontend

No new dependencies required. Using existing:
- React Router 6.21 for routing
- TanStack Query for data fetching
- Axios for HTTP requests

## Configuration Requirements

### Environment Variables (Backend)

```bash
# Existing
AUTH_PROVIDER=google  # or keep existing and add google as option
DATABASE_URL=postgresql://...
JWT_SECRET=...

# New - Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# New - Email Service
SMTP_HOST=smtp.gmail.com  # or mailtrap.io for dev
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=noreply@yourapp.com
ADMIN_EMAIL=admin@yourapp.com
```

### Environment Variables (Frontend)

```bash
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=...  # For frontend OAuth flow
```

## Migration Strategy

### Database Migration Steps

1. Create migration file `005_add_user_approval_status.sql`
2. Add approval_status enum type
3. Add new columns to users table
4. Set existing users to 'approved' status (backward compatibility)
5. Add indexes for performance
6. Update constraints

### Backward Compatibility

- Existing users default to 'approved' status
- Existing authentication flows continue to work
- New Google provider is additive, doesn't break existing providers
- Email service failures don't block user operations

## Risk Mitigation

1. **Email Service Downtime**: Users can still authenticate, admins check pending list manually
2. **Google OAuth Outage**: Existing providers (Keycloak/WorkOS) still functional if configured
3. **Database Migration Issues**: Test migration on staging first, have rollback script ready
4. **Token Refresh Failures**: Fall back to full re-authentication
5. **Admin Approval Bottleneck**: Notify multiple admins, provide bulk approval capability

## Success Metrics

- Database migration completes successfully
- All unit tests pass (100% coverage for new code)
- All integration tests pass
- Email notifications sent within 1 minute (FR-003)
- Google OAuth flow completes in <30 seconds (SC-002)
- Zero security vulnerabilities in OAuth implementation
- Backend API endpoints return correct status codes
- Frontend routes protect based on authentication and approval status

## Next Steps

Proceed to Phase 1: Design & Contracts
- Generate data-model.md with extended User entity
- Create OpenAPI contracts for new endpoints
- Generate quickstart.md with setup instructions
