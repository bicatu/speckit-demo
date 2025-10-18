# Authentication Provider Abstraction

This document explains the authentication abstraction layer that allows switching between different OAuth2/OIDC providers via environment configuration.

## Overview

The application supports three authentication providers:
1. **Mock** - For development and testing (no real OAuth)
2. **Keycloak** - Self-hosted open-source OAuth2/OIDC provider
3. **WorkOS** - Managed authentication service

## Architecture

### Interface (`IAuthProvider`)

All providers implement the same interface:

```typescript
interface IAuthProvider {
  verifyAccessToken(accessToken: string): Promise<AuthUser>;
  getAuthorizationUrl(redirectUri: string, state?: string): string;
  authenticateWithCode(code: string, redirectUri: string): Promise<{...}>;
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

**Setup:** See `KEYCLOAK_SETUP.md` for complete configuration guide.

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
# 1. Set up Keycloak (see KEYCLOAK_SETUP.md)
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

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [WorkOS Documentation](https://workos.com/docs)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- [JWT RFC](https://datatracker.ietf.org/doc/html/rfc7519)
