# Keycloak OAuth2/OpenID Connect Setup Guide

This guide explains how to set up Keycloak for local OAuth2/OpenID Connect authentication testing.

## Starting Keycloak

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for Keycloak to be ready** (may take 30-60 seconds on first start):
   ```bash
   docker-compose logs -f keycloak
   ```
   Look for: "Running the server in development mode. DO NOT use this configuration in production."

3. **Access Keycloak Admin Console:**
   - URL: http://localhost:8080
   - Username: `admin`
   - Password: `admin`

## Initial Configuration

### 1. Create a Realm

1. Click on the dropdown at the top left (currently showing "Master")
2. Click "Create Realm"
3. Set **Realm name**: `movietrack`
4. Click "Create"

### 2. Create a Client (Application)

1. Go to **Clients** in the left sidebar
2. Click "Create client"
3. Configure:
   - **Client type**: OpenID Connect
   - **Client ID**: `movietrack-app`
   - Click "Next"
4. **Capability config**:
   - Enable "Client authentication" (this makes it a confidential client)
   - Enable "Authorization"
   - Enable "Standard flow" (Authorization Code Flow)
   - Enable "Direct access grants" (Resource Owner Password Flow - for testing)
   - Click "Next"
5. **Login settings**:
   - **Root URL**: `http://localhost:5173`
   - **Home URL**: `http://localhost:5173`
   - **Valid redirect URIs**: 
     - `http://localhost:5173/*`
     - `http://localhost:3000/*` (for backend OAuth callback)
   - **Valid post logout redirect URIs**: `http://localhost:5173/*`
   - **Web origins**: `http://localhost:5173`, `http://localhost:3000`
   - Click "Save"

6. Go to the **Credentials** tab and copy the **Client Secret** (you'll need this)

### 3. Create Test Users

1. Go to **Users** in the left sidebar
2. Click "Add user"
3. Create **Admin User**:
   - **Username**: `admin@test.com`
   - **Email**: `admin@test.com`
   - **First name**: `Admin`
   - **Last name**: `User`
   - **Email verified**: ON
   - Click "Create"
4. Go to the **Credentials** tab:
   - Click "Set password"
   - Password: `admin123`
   - Temporary: OFF
   - Click "Save"
5. Go to the **Attributes** tab:
   - Add attribute: `is_admin` = `true`
   - Click "Save"

6. Repeat for **Regular User**:
   - **Username**: `user@test.com`
   - **Email**: `user@test.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - **Password**: `user123`
   - No `is_admin` attribute (or set to `false`)

### 4. Configure Client Scopes (Optional - for custom claims)

1. Go to **Client scopes** in the left sidebar
2. Create a new scope called `movietrack-roles`
3. Go to **Mappers** tab
4. Click "Add mapper" → "By configuration" → "User Attribute"
5. Configure:
   - **Name**: `is_admin mapper`
   - **User Attribute**: `is_admin`
   - **Token Claim Name**: `is_admin`
   - **Claim JSON Type**: `boolean`
   - Add to ID token: ON
   - Add to access token: ON
   - Add to userinfo: ON
   - Click "Save"
6. Go back to **Clients** → `movietrack-app` → **Client scopes** tab
7. Add `movietrack-roles` to **Assigned default client scopes**

## Backend Configuration

Update your backend `.env` file:

```bash
# Keycloak OAuth2 Configuration
OAUTH_ISSUER_URL=http://localhost:8080/realms/movietrack
OAUTH_CLIENT_ID=movietrack-app
OAUTH_CLIENT_SECRET=<your-client-secret-from-step-2>
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
OAUTH_JWKS_URI=http://localhost:8080/realms/movietrack/protocol/openid-connect/certs

# Application
PORT=3000
DATABASE_URL=postgresql://movietrack:movietrack_dev_password@localhost:5432/movietrack_db
```

## Frontend Configuration

Update your frontend `.env` file:

```bash
VITE_API_URL=http://localhost:3000
VITE_OAUTH_AUTHORITY=http://localhost:8080/realms/movietrack
VITE_OAUTH_CLIENT_ID=movietrack-app
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

## Testing the OAuth Flow

### 1. Authorization Code Flow (Standard)

```bash
# 1. Get authorization code (browser)
http://localhost:8080/realms/movietrack/protocol/openid-connect/auth?client_id=movietrack-app&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid%20profile%20email

# 2. Exchange code for tokens (backend)
curl -X POST http://localhost:8080/realms/movietrack/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=movietrack-app" \
  -d "client_secret=<your-client-secret>" \
  -d "code=<authorization-code-from-step-1>" \
  -d "redirect_uri=http://localhost:3000/auth/callback"
```

### 2. Direct Access (Testing Only)

```bash
# Get tokens directly with username/password
curl -X POST http://localhost:8080/realms/movietrack/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=movietrack-app" \
  -d "client_secret=<your-client-secret>" \
  -d "username=admin@test.com" \
  -d "password=admin123" \
  -d "scope=openid profile email"
```

### 3. Verify Token

```bash
# Introspect token
curl -X POST http://localhost:8080/realms/movietrack/protocol/openid-connect/token/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=movietrack-app" \
  -d "client_secret=<your-client-secret>" \
  -d "token=<access-token>"
```

## Useful Keycloak Endpoints

- **Well-known configuration**: http://localhost:8080/realms/movietrack/.well-known/openid-configuration
- **JWKS (public keys)**: http://localhost:8080/realms/movietrack/protocol/openid-connect/certs
- **UserInfo**: http://localhost:8080/realms/movietrack/protocol/openid-connect/userinfo
- **Token endpoint**: http://localhost:8080/realms/movietrack/protocol/openid-connect/token
- **Authorization endpoint**: http://localhost:8080/realms/movietrack/protocol/openid-connect/auth
- **Logout endpoint**: http://localhost:8080/realms/movietrack/protocol/openid-connect/logout

## Troubleshooting

### Keycloak won't start
```bash
# Check logs
docker-compose logs keycloak

# Restart Keycloak
docker-compose restart keycloak

# Full reset (WARNING: deletes all Keycloak data)
docker-compose down -v
docker-compose up -d
```

### Database connection issues
```bash
# Ensure PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL to verify keycloak_db exists
docker exec -it movietrack-postgres psql -U movietrack -l
```

### Token validation fails
1. Verify JWKS URI is accessible: http://localhost:8080/realms/movietrack/protocol/openid-connect/certs
2. Check that the `iss` claim in the JWT matches: `http://localhost:8080/realms/movietrack`
3. Ensure system clocks are synchronized (JWT timestamps are sensitive)

## Example JWT Token Structure

After successful authentication, you'll receive an access token with this structure:

```json
{
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "uuid",
  "iss": "http://localhost:8080/realms/movietrack",
  "aud": "account",
  "sub": "user-uuid",
  "typ": "Bearer",
  "azp": "movietrack-app",
  "session_state": "uuid",
  "acr": "1",
  "realm_access": {
    "roles": ["default-roles-movietrack"]
  },
  "scope": "openid profile email",
  "email_verified": true,
  "name": "Admin User",
  "preferred_username": "admin@test.com",
  "given_name": "Admin",
  "family_name": "User",
  "email": "admin@test.com",
  "is_admin": true
}
```

## Next Steps

1. Update `backend/src/infrastructure/external/WorkOSClient.ts` to use Keycloak instead of WorkOS
2. Update `backend/src/ui/http/middleware/auth.ts` to validate Keycloak JWT tokens
3. Implement OAuth2 flow in the frontend with redirect to Keycloak
4. Test the complete authentication flow end-to-end

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
