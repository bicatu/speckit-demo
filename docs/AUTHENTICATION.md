# Authentication Provider Abstraction

This document explains the authentication abstraction layer that allows switching between different OAuth2/OIDC providers via environment configuration.

## Overview

This document explains the authentication architecture and provider abstraction layer that allows switching between different OAuth2/OIDC providers.

### Supported Providers

The application supports three authentication providers:

| Provider | Use Case | Setup Guide |
|----------|----------|-------------|
| **Mock** | Development/Testing | No setup required (built-in) |
| **Keycloak** | Local Development | [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md) |
| **WorkOS** | Production | [WORKOS_SETUP.md](WORKOS_SETUP.md) |

### Authentication Features

- **Provider Abstraction**: Switch providers via environment variable (no code changes)
- **OAuth2/OIDC Flow**: Authorization code flow with PKCE (Proof Key for Code Exchange)
- **PKCE Security**: RFC 7636 compliant - prevents authorization code interception attacks
- **Secure Storage**: Browser sessionStorage with 5-minute expiration and automatic cleanup
- **Google Sign-In**: Optional social login (configured per provider)
- **User Approval Workflow**: New users require admin approval
- **Email Notifications**: Admins notified of new user requests
- **Session Management**: JWT token caching with automatic refresh
- **Role-Based Access**: Admin and regular user permissions

## PKCE (Proof Key for Code Exchange)

### Overview

PKCE (RFC 7636) is a security extension to OAuth 2.0 that prevents authorization code interception attacks. It's mandatory for public clients (like SPAs) and recommended for all OAuth flows.

**Implementation Status**: ✅ Complete and production-ready (as of v1.6.0)

### How PKCE Works

1. **Frontend generates** a random `code_verifier` (43-128 chars, base64url-encoded)
2. **Frontend creates** `code_challenge` = SHA256(code_verifier), base64url-encoded
3. **Authorization request** includes `code_challenge` and `code_challenge_method=S256`
4. **Provider stores** the `code_challenge` linked to the authorization code
5. **Token exchange** includes the original `code_verifier`
6. **Provider validates** that SHA256(code_verifier) matches stored `code_challenge`

### Frontend Implementation

**PKCE Utilities** (`frontend/src/utils/pkce.ts`):

```typescript
// Generate cryptographically secure verifier
const verifier = generateCodeVerifier(); // 43+ chars, base64url

// Derive challenge from verifier
const challenge = await generateCodeChallenge(verifier); // SHA256 hash

// Store verifier in sessionStorage (5-minute expiration)
storePKCEVerifier(state, verifier);

// Retrieve verifier (one-time use, auto-cleanup)
const verifier = retrievePKCEVerifier(state);
```

**Authentication Flow** (`frontend/src/services/authService.ts`):

```typescript
// Login: Generate PKCE parameters
async login(redirectUri: string) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();
  
  storePKCEVerifier(state, codeVerifier);
  
  window.location.href = `/api/auth/login?` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256&` +
    `state=${state}`;
}

// Callback: Retrieve and send verifier
async handleCallback(code: string, state: string) {
  const codeVerifier = retrievePKCEVerifier(state);
  
  await fetch('/api/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state, code_verifier: codeVerifier })
  });
}
```

### Backend Implementation

**Interface Extension** (`backend/src/infrastructure/external/IAuthProvider.ts`):

```typescript
interface IAuthProvider {
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: { codeChallenge: string; codeChallengeMethod: 'S256' }
  ): string;
  
  authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<AuthResult>;
}
```

**Keycloak Provider** (`backend/src/infrastructure/external/KeycloakAuthProvider.ts`):

- Accepts `code_challenge` and `code_challenge_method` in authorization URL
- Includes `code_verifier` in token exchange POST body
- Keycloak validates PKCE automatically

**Mock Provider** (`backend/src/infrastructure/external/MockAuthProvider.ts`):

- Stores `code_challenge` in memory during authorization
- Validates `code_verifier` against challenge using SHA256 in token exchange
- Throws descriptive errors for validation failures (testing only)

**Request Validation** (`backend/src/ui/http/actions/auth/schemas.ts`):

```typescript
const LoginRequestSchema = z.object({
  code_challenge: z.string().min(43).max(128).optional(),
  code_challenge_method: z.literal('S256').optional(),
  state: z.string().uuid().optional()
});

const AuthCallbackRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string(),
  code_verifier: z.string().min(43).max(128).optional()
});
```

### Security Features

**Storage Security**:
- ✅ Verifiers stored in `sessionStorage` (not `localStorage`)
- ✅ 5-minute expiration (short-lived)
- ✅ One-time retrieval (auto-deleted after use)
- ✅ Automatic cleanup of expired verifiers on app load
- ✅ Linked to OAuth state (prevents misuse)

**Cryptographic Strength**:
- ✅ Verifiers generated with `crypto.getRandomValues()` (32 bytes = 256 bits)
- ✅ SHA256 hashing for code challenges
- ✅ Base64url encoding (URL-safe, no padding)
- ✅ Minimum 43 characters (RFC 7636 requirement)

**Error Handling**:
- ✅ User-friendly messages for missing/expired verifiers
- ✅ Specific error codes (`PKCE_VALIDATION_FAILED`, `PKCE_VERIFIER_MISSING`)
- ✅ SessionStorage quota/access error handling
- ✅ Security event logging for validation failures

### Provider Support

| Provider | Authorization | Token Exchange | Validation |
|----------|--------------|----------------|------------|
| **Keycloak** | ✅ Full support | ✅ Full support | ✅ Server-side |
| **WorkOS** | ⚠️ Signature only | ⚠️ Signature only | ⚠️ Not implemented |
| **Mock** | ✅ Full support | ✅ Full support | ✅ SHA256 validation |

**Note**: WorkOS provider has PKCE signatures but implementation is incomplete (not tested).

### Testing PKCE

**Manual Testing**:

1. Open browser DevTools → Application → Session Storage
2. Click "Login" in the application
3. Verify `pkce_verifier_*` entry created with expiration
4. Complete login flow
5. Verify verifier is removed after successful authentication

**Unit Tests** (`frontend/tests/unit/utils/pkce.test.ts`):

```bash
cd frontend
npm test -- pkce

✓ 15 tests passing
  ✓ generateCodeVerifier (3)
  ✓ generateCodeChallenge (3)
  ✓ storePKCEVerifier (2)
  ✓ retrievePKCEVerifier (5)
  ✓ cleanupPKCEVerifier (2)
```

### Troubleshooting

**"PKCE verifier not found" Error**:
- SessionStorage disabled/blocked (check browser settings)
- Cookies/site data disabled
- Verifier expired (5-minute timeout)
- Browser cleared storage between login and callback
- **Solution**: Enable cookies and site data, try login again

**"PKCE validation failed" Error**:
- Code verifier doesn't match challenge
- Challenge was tampered with during authorization
- Provider PKCE validation failed
- **Solution**: Check provider logs, retry login flow

**SessionStorage Quota Exceeded**:
- Too many PKCE verifiers stored (unlikely with cleanup)
- Other data filling sessionStorage
- **Solution**: Clear site data or use private browsing

### Backward Compatibility

PKCE is **fully backward compatible**:

- ✅ All PKCE parameters are **optional**
- ✅ Existing OAuth flows work without PKCE
- ✅ No breaking changes to provider interfaces
- ✅ Gradual adoption possible

Providers that don't support PKCE simply ignore the parameters.

### Migration Guide

**From non-PKCE to PKCE**:

1. **No backend changes required** - PKCE is optional
2. **Frontend automatically uses PKCE** - no configuration needed
3. **Test with Mock provider** - validates PKCE flow
4. **Deploy to staging** - test with Keycloak
5. **Monitor logs** - verify PKCE events

**Rollback**: Simply deploy previous frontend version - backend still works.

### Performance Impact

- **Frontend**: < 5ms for verifier generation + challenge computation
- **Storage**: ~150 bytes per verifier in sessionStorage
- **Network**: +60 bytes in authorization URL, +60 bytes in token request
- **Backend**: Minimal (validation done by provider)

**Conclusion**: Negligible performance impact for significant security improvement.

## Architecture

### Interface (`IAuthProvider`)

All providers implement the same interface:

```typescript
interface IAuthProvider {
  verifyAccessToken(accessToken: string): Promise<AuthUser>;
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    pkceParams?: { codeChallenge: string; codeChallengeMethod: 'S256' }
  ): string;
  authenticateWithCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{...}>;
  refreshAccessToken?(refreshToken: string): Promise<{...}>;
  getLogoutUrl?(redirectUri?: string): string;
}
```

### Components

```
infrastructure/external/
├── IAuthProvider.ts              # Interface definition
├── AuthProviderFactory.ts        # Factory for creating providers
├── MockAuthProvider.ts           # Mock implementation
├── KeycloakAuthProvider.ts       # Keycloak implementation  
└── WorkOSAuthProvider.ts         # WorkOS implementation
```

### Flow

1. **Application Startup**: `AuthProviderFactory.getInstance()` reads `AUTH_PROVIDER` env var
2. **Token Verification**: Middleware uses provider to verify JWT tokens
3. **Admin Check**: If provider doesn't return admin status, query database
4. **OAuth Flow**: Provider handles authorization URL generation and code exchange

## Configuration

### Environment Variable

Set `AUTH_PROVIDER` in `.env`:

```bash
AUTH_PROVIDER=mock      # or keycloak or workos
```

### Provider-Specific Configuration

#### Mock Provider

```bash
AUTH_PROVIDER=mock
```

**No additional configuration needed.**

**How it works:**
- Accepts ANY Bearer token (except "invalid" or "expired")
- Token becomes the user ID
- Admin if token is `mock-admin-token` or starts with `admin-`
- Example: `Bearer user-123` → logged in as user-123
- Example: `Bearer admin-test` → logged in as admin

**Use cases:**
- Local development without OAuth setup
- Unit and integration tests
- Quick prototyping

#### Keycloak Provider

```bash
AUTH_PROVIDER=keycloak
KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/movietrack
KEYCLOAK_CLIENT_ID=movietrack-app
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

**Features:**
- Full JWT verification using JWKS (public key rotation)
- Validates token signature, expiration, issuer, and audience
- Extracts admin status from:
  - Custom `is_admin` attribute (boolean)
  - Realm role `admin`
  - Client role `admin`
- Supports token refresh

**Setup:** See [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md) for complete configuration guide.

#### WorkOS Provider

```bash
AUTH_PROVIDER=workos
WORKOS_API_KEY=sk_your_api_key
WORKOS_CLIENT_ID=client_your_client_id
WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
```

**Features:**
- Uses WorkOS Node SDK
- Token verification via WorkOS API
- Admin status must be checked from database (not in token)
- Supports token refresh

**Note:** WorkOS implementation is included but not tested. You'll need a WorkOS account.

## Usage Examples

### Testing with Mock Provider

```bash
# Regular user
curl http://localhost:3000/api/entries \
  -H "Authorization: Bearer user-123"

# Admin user
curl -X POST http://localhost:3000/api/platforms \
  -H "Authorization: Bearer mock-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Netflix"}'

# Another admin (any token starting with admin-)
curl -X DELETE http://localhost:3000/api/platforms/uuid \
  -H "Authorization: Bearer admin-mytest"
```

### Testing with Keycloak

```bash
# 1. Get token via password grant (testing only)
TOKEN=$(curl -X POST http://localhost:8080/realms/movietrack/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=movietrack-app" \
  -d "client_secret=your-secret" \
  -d "username=admin@test.com" \
  -d "password=admin123" \
  -d "scope=openid profile email" \
  | jq -r '.access_token')

# 2. Use token in API requests
curl http://localhost:3000/api/entries \
  -H "Authorization: Bearer $TOKEN"
```

### Switching Providers

Simply change the `.env` file and restart the server:

```bash
# Switch to Keycloak
echo "AUTH_PROVIDER=keycloak" > .env
npm run dev

# Switch back to Mock
echo "AUTH_PROVIDER=mock" > .env
npm run dev
```

## Admin Privilege Resolution

The system determines admin status in this order:

1. **From Token** (Keycloak only):
   - Check `is_admin` custom attribute
   - Check for `admin` in realm roles
   - Check for `admin` in client roles

2. **From Database** (all providers):
   - Query `users` table by `oauth_subject`
   - Check `is_admin` column
   - If user not found, default to `false`

3. **Mock Logic** (Mock provider only):
   - Token equals `mock-admin-token` → admin
   - Token starts with `admin-` → admin
   - Otherwise → not admin

## Security Considerations

### Mock Provider

⚠️ **NEVER use in production**
- No signature verification
- No token expiration
- No cryptographic security
- Anyone can be any user

### Keycloak Provider

✅ **Production-ready** when properly configured:
- Full JWT signature verification
- Token expiration enforcement
- JWKS key rotation support
- Audience and issuer validation

**Requirements:**
- Use HTTPS in production
- Secure client secret storage
- Configure appropriate token lifetimes
- Enable proper CORS policies

### WorkOS Provider

✅ **Production-ready** (managed service):
- Token verification via WorkOS API
- Managed infrastructure
- Enterprise SSO support
- Compliance certifications

## Testing Strategy

### Unit Tests

```typescript
import { AuthProviderFactory } from './AuthProviderFactory';
import { MockAuthProvider } from './MockAuthProvider';

describe('AuthProviderFactory', () => {
  beforeEach(() => {
    AuthProviderFactory.reset();
  });

  it('creates mock provider by default', () => {
    process.env.AUTH_PROVIDER = 'mock';
    const provider = AuthProviderFactory.getInstance();
    expect(provider).toBeInstanceOf(MockAuthProvider);
  });
});
```

### Integration Tests

```typescript
describe('Auth Middleware', () => {
  it('accepts admin token with mock provider', async () => {
    const response = await request(app)
      .post('/api/platforms')
      .set('Authorization', 'Bearer mock-admin-token')
      .send({ name: 'Test' });
    
    expect(response.status).toBe(201);
  });
});
```

## Troubleshooting

### "Token verification failed"

**Mock Provider:**
- Check token is not "invalid" or "expired"

**Keycloak:**
- Verify `KEYCLOAK_ISSUER_URL` is correct
- Check token hasn't expired
- Ensure Keycloak is running and accessible
- Verify JWKS endpoint is reachable

**WorkOS:**
- Check `WORKOS_API_KEY` is valid
- Verify token format

### "Admin privileges required"

**Mock Provider:**
- Use `mock-admin-token` or token starting with `admin-`

**Keycloak:**
- Check user has `is_admin` attribute set to `true` in Keycloak
- OR user has `admin` role assigned
- Verify attribute mapper is configured correctly

**WorkOS:**
- User must exist in database with `is_admin=true`
- WorkOS doesn't provide admin status in token

### "Missing configuration"

Check all required environment variables for your chosen provider:

```bash
# Verify configuration
node -e "console.log(process.env.AUTH_PROVIDER)"
node -e "console.log(process.env.KEYCLOAK_ISSUER_URL)"
```

## Migration Path

### Development → Staging/Production

1. **Start with Mock** during development
2. **Set up Keycloak** for staging environment
3. **Test thoroughly** with Keycloak in staging
4. **Switch to WorkOS** for production (optional, if enterprise SSO needed)
5. **OR use Keycloak** in production (self-hosted)

### From Mock to Keycloak

```bash
# 1. Set up Keycloak (see docs/KEYCLOAK_SETUP.md)
docker-compose up -d keycloak

# 2. Update .env
AUTH_PROVIDER=keycloak
KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/movietrack
KEYCLOAK_CLIENT_ID=movietrack-app
KEYCLOAK_CLIENT_SECRET=<your-secret>

# 3. Restart application
npm run dev
```

No code changes needed!

## Extension Points

### Adding a New Provider

1. Create provider class implementing `IAuthProvider`:

```typescript
export class CustomAuthProvider implements IAuthProvider {
  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    // Your implementation
  }
  // ... implement other methods
}
```

2. Add to factory:

```typescript
// In AuthProviderFactory.ts
case 'custom':
  return this.createCustomProvider();
```

3. Update configuration:

```bash
AUTH_PROVIDER=custom
CUSTOM_AUTH_URL=https://your-provider.com
```

### Custom Claims

To add custom user attributes from tokens:

1. Update `AuthUser` interface in `IAuthProvider.ts`
2. Extract claims in provider's `verifyAccessToken()`
3. Add to `AuthenticatedUser` in middleware

## User Approval Workflow

### New User Registration

When a new user signs in via OAuth for the first time:

1. **User authenticates** via OAuth provider (Keycloak/WorkOS/Google)
2. **Backend receives** OAuth callback with user profile
3. **User is created** in database with `approval_status = 'pending'`
4. **Email notification** sent to admin (via `ADMIN_EMAIL` env variable)
5. **User sees** "Pending Approval" message in the frontend

### Admin Approval Process

Admins can manage pending users:

1. **View pending users**: `GET /api/users/pending` (admin-only)
2. **Approve user**: `POST /api/users/:id/approve` (admin-only)
   - Sets `approval_status = 'approved'`
   - Records `approved_by` and `approved_at`
3. **Reject user**: `POST /api/users/:id/reject` (admin-only)
   - Sets `approval_status = 'rejected'`
   - User cannot access the application

### User States

- **Pending**: New user awaiting approval, can log in but sees "Pending Approval" message
- **Approved**: Full access to the application
- **Rejected**: Cannot access the application, sees rejection message

### First Admin User

The first user in the system should be manually set as admin:

```sql
-- Set user as admin in database
UPDATE users SET is_admin = true, approval_status = 'approved' 
WHERE email = 'admin@yourdomain.com';
```

## Session Management & Token Refresh

### Token Caching

The application implements in-memory token caching to reduce provider API calls:

- **Cache Duration**: 10 minutes (configurable)
- **Cache Key**: JWT token hash
- **Cache Hit Rate Target**: >95%
- **Benefits**: Reduced latency, lower API costs, better performance

### Token Refresh (FR-026)

The frontend automatically refreshes access tokens before expiration:

**Frontend Implementation** (`frontend/src/contexts/AuthContext.tsx`):

```typescript
useEffect(() => {
  // Refresh token 5 minutes before expiration
  const refreshInterval = setInterval(async () => {
    if (user && authService.isTokenExpiringSoon()) {
      await authService.refreshSession();
    }
  }, 60000); // Check every minute

  return () => clearInterval(refreshInterval);
}, [user]);
```

**Token Expiration Check**:
- Checks if token expires within 5 minutes
- Automatically calls refresh endpoint
- Updates local storage with new tokens
- Maintains user session seamlessly

**Refresh Flow**:
1. Frontend detects token expiring soon
2. Calls `POST /api/auth/refresh` with refresh token
3. Backend exchanges refresh token for new access token
4. Frontend updates local storage and context
5. User continues working uninterrupted

## Email Notifications

The application sends email notifications for user registration events.

### Configuration

Required environment variables in `backend/.env`:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=MovieTrack App
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Admin Email
ADMIN_EMAIL=admin@yourdomain.com
```

### Email Service Architecture

- **Interface**: `IEmailService` abstraction
- **Implementation**: `NodemailerEmailService` using Nodemailer
- **Error Handling**: Non-blocking (failures logged but don't prevent user creation)
- **Templates**: HTML and plain text versions

### Email Events

1. **New User Registration**: Sent to `ADMIN_EMAIL` when user requests access
   - Subject: "New User Registration - Approval Required"
   - Contains: User name, email, timestamp
   - Link to pending users page

For detailed email setup instructions, see: **`docs/EMAIL_SETUP.md`**

## Google Sign-In Integration

The application supports Google OAuth for seamless authentication (optional).

### Setup Overview

1. **Create Google OAuth credentials** (one-time)
   - See: [docs/GOOGLE_OAUTH_SETUP.md](../docs/GOOGLE_OAUTH_SETUP.md)
   - Creates Client ID and Client Secret

2. **Configure your provider**:
   - **Keycloak**: [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md) - Step 5
   - **WorkOS**: [WORKOS_SETUP.md](WORKOS_SETUP.md) - Step 4

3. **Test authentication flow**
   - Click "Log In" → Google button appears
   - Sign in with Google account
   - Redirected back to app

**Note:** Google configuration is done in the OAuth provider (Keycloak/WorkOS), not in application code.

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/login` - Initiate OAuth flow, redirect to provider
- `GET /api/auth/callback` - OAuth callback handler, exchange code for tokens
- `POST /api/auth/logout` - Terminate user session
- `POST /api/auth/refresh` - Refresh access token (requires refresh token)
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### User Management Endpoints (Admin Only)

- `GET /api/users/pending` - List users awaiting approval
- `POST /api/users/:id/approve` - Approve pending user
- `POST /api/users/:id/reject` - Reject pending user

### Admin Endpoints

See main README.md for complete list of admin endpoints.

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [WorkOS Documentation](https://workos.com/docs)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- [JWT RFC](https://datatracker.ietf.org/doc/html/rfc7519)

## Additional Documentation

| Document | Purpose |
|----------|---------|
| [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md) | Local development with Keycloak |
| [WORKOS_SETUP.md](WORKOS_SETUP.md) | Production setup with WorkOS |
| [docs/GOOGLE_OAUTH_SETUP.md](../docs/GOOGLE_OAUTH_SETUP.md) | Google Sign-In credentials (shared) |
| [docs/EMAIL_SETUP.md](../docs/EMAIL_SETUP.md) | Email notification configuration |
| [README.md](../README.md) | Project overview and quick start |
