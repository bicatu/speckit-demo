# Quickstart: Login/Logout Authentication UI

**Feature**: Login/Logout Authentication UI  
**Target Audience**: Developers setting up local development environment  
**Time Estimate**: 15-20 minutes

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 22.x LTS installed
- [x] Docker and Docker Compose installed
- [x] PostgreSQL 16 running (via Docker Compose)
- [x] Git repository cloned
- [x] Backend dependencies installed (`npm install` in `backend/`)
- [x] Frontend dependencies installed (`npm install` in `frontend/`)

## Overview

This quickstart guide walks you through setting up local authentication using **Keycloak** as the OpenID Connect provider. The application supports two authentication providers:

- **Keycloak** (Development): Runs locally in Docker, no account signup required
- **WorkOS** (Production): Cloud service, requires account and API keys

For local development, we'll use Keycloak.

---

## Step 1: Start Keycloak with Docker Compose

The project includes a `docker-compose.yml` file that starts Keycloak alongside PostgreSQL.

### 1.1 Start Services

```bash
cd /home/mbneto/Development/speckit-demo
docker-compose up -d
```

**Expected Output:**
```
[+] Running 2/2
 ✔ Container speckit-demo-postgres-1   Started
 ✔ Container speckit-demo-keycloak-1   Started
```

### 1.2 Verify Keycloak is Running

Wait 30-60 seconds for Keycloak to fully start, then visit:

```
http://localhost:8080
```

You should see the Keycloak welcome page.

### 1.3 Access Keycloak Admin Console

1. Click **Administration Console**
2. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin`

---

## Step 2: Configure Keycloak Realm and Client

### 2.1 Create Realm

1. In Keycloak admin console, hover over **Master** (top-left)
2. Click **Create Realm**
3. Set **Realm name**: `speckit-demo`
4. Click **Create**

### 2.2 Create OAuth Client

1. In `speckit-demo` realm, navigate to **Clients** (left sidebar)
2. Click **Create client**
3. Configure client:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `speckit-demo-client`
   - Click **Next**
4. Capability config:
   - **Client authentication**: `On` (confidential client)
   - **Authorization**: `Off`
   - **Authentication flow**: Enable only:
     - [x] Standard flow
     - [x] Direct access grants
   - Click **Next**
5. Login settings:
   - **Valid redirect URIs**: `http://localhost:3000/auth/callback`
   - **Valid post logout redirect URIs**: `http://localhost:3000`
   - **Web origins**: `http://localhost:3000`
   - Click **Save**

### 2.3 Get Client Secret

1. In client details, click **Credentials** tab
2. Copy **Client secret** (you'll need this for environment variables)

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 2.4 Create Test User

1. Navigate to **Users** (left sidebar)
2. Click **Add user**
3. Set:
   - **Username**: `testuser`
   - **Email**: `testuser@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - **Email verified**: `On`
4. Click **Create**
5. Click **Credentials** tab
6. Click **Set password**
7. Set password: `password123`
8. Turn off **Temporary** toggle
9. Click **Save**

---

## Step 3: Configure Backend Environment Variables

### 3.1 Create `.env` File

Create `backend/.env` file:

```bash
cd backend
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://speckit:password@localhost:5432/speckit

# Authentication Provider (keycloak or workos)
AUTH_PROVIDER=keycloak

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=speckit-demo
KEYCLOAK_CLIENT_ID=speckit-demo-client
KEYCLOAK_CLIENT_SECRET=<YOUR_CLIENT_SECRET_FROM_STEP_2.3>
KEYCLOAK_REDIRECT_URI=http://localhost:3000/auth/callback

# Server
PORT=3001
NODE_ENV=development
EOF
```

**Replace** `<YOUR_CLIENT_SECRET_FROM_STEP_2.3>` with actual client secret from Step 2.3.

### 3.2 Verify Configuration

```bash
cat backend/.env
```

Ensure `KEYCLOAK_CLIENT_SECRET` is not empty.

---

## Step 4: Configure Frontend Environment Variables

### 4.1 Create `.env` File

Create `frontend/.env` file:

```bash
cd frontend
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
EOF
```

This tells the frontend where to find the backend API.

---

## Step 5: Initialize Database

### 5.1 Run Database Migrations (if applicable)

If you have migration scripts:

```bash
cd backend
npm run migrate
```

### 5.2 Seed Test Data (Optional)

```bash
npm run seed
```

This creates sample platforms, tags, and entries for testing.

---

## Step 6: Start Backend Server

### 6.1 Start in Development Mode

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server listening on port 3001
Database connected
Auth provider: keycloak
```

### 6.2 Verify Backend Health

In another terminal:

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

---

## Step 7: Start Frontend Development Server

### 7.1 Start Vite Dev Server

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 7.2 Open Browser

Visit: `http://localhost:3000`

You should see the movie tracking application home page.

---

## Step 8: Test Authentication Flow

### 8.1 Initiate Login

1. Click **Log In** button (if visible) or navigate to protected page
2. You should be redirected to Keycloak login page at:
   ```
   http://localhost:8080/realms/speckit-demo/protocol/openid-connect/auth?...
   ```

### 8.2 Authenticate with Test User

1. Enter credentials:
   - **Username or email**: `testuser`
   - **Password**: `password123`
2. Click **Sign In**

### 8.3 Verify Redirect Back to App

After successful authentication:
- You should be redirected back to `http://localhost:3000` (or return URL)
- You should see user info in UI (e.g., "Welcome, Test User")
- Browser should have access token in memory (not in localStorage)

### 8.4 Test Session Validation

1. Open browser DevTools → Network tab
2. Refresh the page
3. Look for `GET /api/auth/me` request
4. Should return 200 with user info:
   ```json
   {
     "id": "550e8400-...",
     "email": "testuser@example.com",
     "displayName": "Test User",
     "isAdmin": false
   }
   ```

### 8.5 Test Logout

1. Click **Log Out** button
2. You should be redirected to Keycloak logout (or home page)
3. User info should disappear from UI
4. Refresh page → should not be authenticated

---

## Step 9: Verify Token Caching (Optional)

### 9.1 Enable Backend Debug Logging

Add to `backend/.env`:

```bash
LOG_LEVEL=debug
```

Restart backend server.

### 9.2 Make Multiple API Requests

1. Login with test user
2. In browser DevTools console, run:
   ```javascript
   // Make 5 requests to same endpoint
   for(let i=0; i<5; i++) {
     fetch('/api/auth/me', {
       headers: { 'Authorization': `Bearer ${accessToken}` }
     }).then(r => r.json()).then(console.log);
   }
   ```

### 9.3 Check Backend Logs

You should see:
- **First request**: "Token validation: cache miss → calling auth provider"
- **Next 4 requests**: "Token validation: cache hit → returning cached user"

This confirms in-memory token caching is working.

---

## Troubleshooting

### Issue: Keycloak not starting

**Symptoms**: `docker-compose up` fails or Keycloak unreachable

**Solutions**:
1. Check logs: `docker-compose logs keycloak`
2. Ensure port 8080 not in use: `lsof -i :8080`
3. Restart services: `docker-compose down && docker-compose up -d`

### Issue: "Invalid redirect URI" error

**Symptoms**: After login, Keycloak shows error page

**Solutions**:
1. Verify redirect URI in Keycloak client config matches exactly:
   ```
   http://localhost:3000/auth/callback
   ```
2. No trailing slash
3. Correct protocol (http vs https)

### Issue: "OAuth state not found" error

**Symptoms**: Backend returns 401 with message about missing state

**Solutions**:
1. Backend restarted between login initiation and callback (state stored in memory)
2. Wait 5 seconds and try login again
3. Check backend logs for errors

### Issue: Backend can't connect to Keycloak

**Symptoms**: Backend logs show "ECONNREFUSED" to localhost:8080

**Solutions**:
1. Verify Keycloak is running: `docker ps | grep keycloak`
2. Check `KEYCLOAK_URL` in `backend/.env` is correct
3. Try: `curl http://localhost:8080/health` (should return 200)

### Issue: Frontend can't call backend API

**Symptoms**: Network errors in browser DevTools, CORS errors

**Solutions**:
1. Verify backend is running on port 3001: `lsof -i :3001`
2. Check `VITE_API_BASE_URL` in `frontend/.env` is `http://localhost:3001`
3. Ensure backend has CORS enabled for `http://localhost:3000`

### Issue: Token expired mid-session

**Symptoms**: 401 errors after some time

**Solutions**:
1. Expected behavior: tokens expire after 5-15 minutes (depending on Keycloak config)
2. Frontend should auto-redirect to login with "Session expired" message
3. After re-login, pending action should complete (per spec)

---

## Next Steps

After completing quickstart:

1. **Test Edge Cases**:
   - [ ] Multi-device login (open app in incognito window)
   - [ ] Token expiry handling (wait 15 minutes, make API request)
   - [ ] Logout from all devices (logout in one browser, check other)
   - [ ] Invalid return URL (try `?returnUrl=https://evil.com`)

2. **Review Implementation**:
   - [ ] Read `backend/src/infrastructure/external/TokenCache.ts`
   - [ ] Read `backend/src/ui/http/routes/auth.ts`
   - [ ] Read `frontend/src/context/AuthContext.tsx`

3. **Run Tests**:
   ```bash
   cd backend && npm test
   cd frontend && npm test
   ```

4. **Configure WorkOS (Production)**:
   - Follow `KEYCLOAK_SETUP.md` for WorkOS configuration
   - Set `AUTH_PROVIDER=workos` in production environment

---

## Configuration Reference

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `AUTH_PROVIDER` | Yes | - | `keycloak` or `workos` |
| `KEYCLOAK_URL` | If Keycloak | - | Keycloak server URL |
| `KEYCLOAK_REALM` | If Keycloak | - | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | If Keycloak | - | OAuth client ID |
| `KEYCLOAK_CLIENT_SECRET` | If Keycloak | - | OAuth client secret |
| `KEYCLOAK_REDIRECT_URI` | If Keycloak | - | OAuth callback URL |
| `WORKOS_API_KEY` | If WorkOS | - | WorkOS API key |
| `WORKOS_CLIENT_ID` | If WorkOS | - | WorkOS client ID |
| `PORT` | No | 3001 | Backend server port |
| `NODE_ENV` | No | development | Environment mode |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API base URL |

---

## Additional Resources

- **Keycloak Docs**: https://www.keycloak.org/docs/latest/
- **OpenID Connect Spec**: https://openid.net/specs/openid-connect-core-1_0.html
- **WorkOS Docs**: https://workos.com/docs (for production setup)
- **Feature Spec**: `specs/002-add-login-logout/spec.md`
- **Implementation Plan**: `specs/002-add-login-logout/plan.md`

---

**Status**: Quickstart guide complete. Development environment ready for implementation.
