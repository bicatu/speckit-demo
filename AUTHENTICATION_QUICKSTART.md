# Authentication Abstraction - Quick Start

## What Changed?

Created a **provider abstraction layer** for authentication that allows switching between Mock, Keycloak, and WorkOS via environment configuration.

## Files Created

### Core Abstraction
- `backend/src/infrastructure/external/IAuthProvider.ts` - Interface definition
- `backend/src/infrastructure/external/AuthProviderFactory.ts` - Factory pattern for provider selection
- `backend/src/infrastructure/external/MockAuthProvider.ts` - Mock implementation (existing behavior)
- `backend/src/infrastructure/external/KeycloakAuthProvider.ts` - Keycloak OAuth2/OIDC implementation
- `backend/src/infrastructure/external/WorkOSAuthProvider.ts` - WorkOS implementation

### Updated Files
- `backend/src/ui/http/middleware/auth.ts` - Now uses factory pattern
- `backend/.env.example` - Added AUTH_PROVIDER configuration
- `backend/package.json` - Added dependencies: jsonwebtoken, jwks-rsa, axios

### Documentation
- `backend/AUTHENTICATION.md` - Complete guide to the abstraction layer
- `KEYCLOAK_SETUP.md` - Keycloak setup instructions (already created)

## How to Use

### 1. Choose Your Provider

Edit `.env` file:

```bash
# For development (default)
AUTH_PROVIDER=mock

# For local Keycloak testing
AUTH_PROVIDER=keycloak
KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/movietrack
KEYCLOAK_CLIENT_ID=movietrack-app
KEYCLOAK_CLIENT_SECRET=your-secret

# For production with WorkOS
AUTH_PROVIDER=workos
WORKOS_API_KEY=sk_your_key
WORKOS_CLIENT_ID=client_your_id
```

### 2. No Code Changes Needed

The application automatically uses the configured provider. All authentication logic remains the same:

```typescript
// Middleware automatically uses the right provider
router.post('/api/entries', authMiddleware, createEntry);
router.post('/api/platforms', authMiddleware, adminMiddleware, createPlatform);
```

### 3. Testing Examples

**Mock (current behavior - unchanged):**
```bash
# Regular user
curl http://localhost:3000/api/entries \
  -H "Authorization: Bearer user-123"

# Admin
curl -X POST http://localhost:3000/api/platforms \
  -H "Authorization: Bearer mock-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Netflix"}'
```

**Keycloak (real OAuth):**
```bash
# Get real JWT token
TOKEN=$(curl -X POST http://localhost:8080/realms/movietrack/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=movietrack-app" \
  -d "client_secret=your-secret" \
  -d "username=admin@test.com" \
  -d "password=admin123" \
  | jq -r '.access_token')

# Use in requests
curl http://localhost:3000/api/entries \
  -H "Authorization: Bearer $TOKEN"
```

## Key Features

✅ **Environment-driven** - Change provider via `.env` without code changes
✅ **Backward compatible** - Mock provider maintains exact current behavior
✅ **Production ready** - Keycloak and WorkOS implementations with full JWT verification
✅ **Type safe** - All providers implement the same TypeScript interface
✅ **Database integration** - Falls back to database for admin status if not in token
✅ **Easy testing** - Reset factory in tests, mock any provider

## Admin Privileges

**Mock Provider:**
- Token `mock-admin-token` → admin
- Token starting with `admin-` → admin

**Keycloak Provider:**
- Custom attribute `is_admin: true`
- OR realm role `admin`
- OR client role `admin`
- Fallback to database check

**WorkOS Provider:**
- Database check only (WorkOS tokens don't include custom claims)

## Next Steps

1. ✅ **Done**: Abstraction layer created
2. **To test Keycloak**:
   - Follow `KEYCLOAK_SETUP.md` to configure Keycloak
   - Set `AUTH_PROVIDER=keycloak` in `.env`
   - Restart backend
3. **For production**:
   - Use HTTPS
   - Secure secret storage (env vars, vault, etc.)
   - Set up proper CORS
   - Configure token lifetimes

## Documentation

- **Full Guide**: `backend/AUTHENTICATION.md`
- **Keycloak Setup**: `KEYCLOAK_SETUP.md`
- **API Reference**: See interface in `IAuthProvider.ts`

## Dependencies Added

```json
{
  "dependencies": {
    "axios": "^1.x",
    "jsonwebtoken": "^9.x",
    "jwks-rsa": "^3.x"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.x"
  }
}
```

Already installed via npm.
