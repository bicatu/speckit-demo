# Quick Reference: Authentication & User Approval

## 🚀 Quick Setup Checklist

### 1. Environment Configuration

**Backend `.env`:**
```bash
# Authentication Provider
AUTH_PROVIDER=keycloak  # or workos

# Keycloak Configuration
KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/movietrack
KEYCLOAK_CLIENT_ID=movietrack-app
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Email Configuration (for user approval notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**Frontend `.env`:**
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_AUTH_PROVIDER=keycloak
```

### 2. First-Time Setup Commands

```bash
# Start infrastructure
docker-compose up -d

# Run database migrations
cd backend
npm run migrate

# Start backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm run dev
```

### 3. Create First Admin User

```sql
-- After first user signs in, set as admin
UPDATE users SET is_admin = true, approval_status = 'approved' 
WHERE email = 'admin@yourdomain.com';
```

## 📋 User Approval Workflow

### New User Flow

1. **User signs in** → OAuth redirect to Keycloak/WorkOS
2. **Backend creates user** → Status: `pending`
3. **Admin gets email** → "New User Registration - Approval Required"
4. **User sees message** → "Your account is pending approval"

### Admin Approval Flow

**View Pending Users:**
```
GET /api/users/pending
```

**Approve User:**
```
POST /api/users/:id/approve
```

**Reject User:**
```
POST /api/users/:id/reject
```

## 🎨 Frontend Pages

| Route | Component | Access |
|-------|-----------|--------|
| `/` | HomePage | Public (shows EntryList if approved) |
| `/login` | LoginPage | Public |
| `/auth/callback` | CallbackPage | Public (OAuth callback) |
| `/settings` | SettingsPage | Authenticated |
| `/admin` | AdminPage | Admin only |
| `/admin/pending-users` | PendingUsersPage | Admin only |
| `/admin/manage-resources` | ManageResourcesPage | Admin only |

## 🔐 API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | GET | Initiate OAuth flow |
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/auth/logout` | POST | Terminate session |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/profile` | GET | Get current user |

### User Management (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/pending` | GET | List pending users |
| `/api/users/:id/approve` | POST | Approve user |
| `/api/users/:id/reject` | POST | Reject user |

### Admin Resource Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tags` | GET | List all tags |
| `/api/tags` | POST | Create tag (admin) |
| `/api/tags/:id` | DELETE | Delete tag (admin) |
| `/api/platforms` | GET | List all platforms |
| `/api/platforms` | POST | Create platform (admin) |
| `/api/platforms/:id` | DELETE | Delete platform (admin) |

## 📧 Email Notification Configuration

### Gmail (Development)

1. Enable 2FA on Google account
2. Generate App Password (Google Account Security)
3. Use app password in `SMTP_PASSWORD`

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password  # 16-char app password
```

### SendGrid (Production)

1. Create SendGrid account
2. Verify sender email/domain
3. Generate API key

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey  # Literally "apikey"
SMTP_PASSWORD=SG.your-api-key
```

### Test Email Configuration

```bash
cd backend
npx ts-node scripts/test-email.ts
```

## 🔍 Google OAuth Setup

### Development (Keycloak)

1. **Google Cloud Console:**
   - Create project
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:8080/realms/movietrack/broker/google/endpoint`

2. **Keycloak Admin Console:**
   - Identity Providers → Add Google
   - Paste Client ID and Client Secret
   - Enable "Trust Email"
   - Save

### Production (WorkOS)

1. **Google Cloud Console:**
   - Create separate OAuth client for production
   - Add WorkOS redirect URI

2. **WorkOS Dashboard:**
   - Authentication → Connections → New Connection
   - Select Google OAuth
   - Paste credentials

## 🧪 Testing Commands

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Test email service
cd backend
npx ts-node scripts/test-email.ts
```

## 🛠️ Troubleshooting Quick Fixes

### "Token verification failed"
```bash
# Check Keycloak is running
docker-compose ps keycloak

# Verify issuer URL
curl http://localhost:8080/realms/movietrack/.well-known/openid-configuration
```

### "Email not sent"
```bash
# Check backend logs
docker-compose logs backend | grep -i email

# Verify SMTP settings
node -e "console.log(process.env.SMTP_HOST)"
```

### "Redirect URI mismatch"
- Check Google Console authorized redirect URIs
- Verify Keycloak client redirect URIs
- Match exactly (including trailing slashes)

### "Admin access denied"
```sql
-- Verify user is admin
SELECT email, is_admin, approval_status FROM users WHERE email = 'your@email.com';

-- Set as admin
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| [README.md](../../README.md) | Project overview & quick start |
| [KEYCLOAK_SETUP.md](../../KEYCLOAK_SETUP.md) | Keycloak local setup |
| [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) | Google OAuth detailed guide |
| [EMAIL_SETUP.md](EMAIL_SETUP.md) | Email configuration guide |
| [AUTHENTICATION.md](../../backend/AUTHENTICATION.md) | Auth architecture & workflows |

## 🎯 User Roles & Permissions

| Feature | Anonymous | Pending | Approved | Admin |
|---------|-----------|---------|----------|-------|
| View login page | ✅ | ✅ | ✅ | ✅ |
| Sign in via OAuth | ✅ | ✅ | ✅ | ✅ |
| View pending message | ❌ | ✅ | ❌ | ❌ |
| Browse entries | ❌ | ❌ | ✅ | ✅ |
| Add ratings | ❌ | ❌ | ✅ | ✅ |
| Create entries | ❌ | ❌ | ✅ | ✅ |
| View pending users | ❌ | ❌ | ❌ | ✅ |
| Approve/reject users | ❌ | ❌ | ❌ | ✅ |
| Manage tags/platforms | ❌ | ❌ | ❌ | ✅ |

## 🔄 Common Workflows

### New User Registration
```
User clicks "Log In" 
→ Redirects to Keycloak/WorkOS 
→ User signs in with Google 
→ Backend creates user (status: pending) 
→ Admin receives email 
→ User sees "Pending Approval" page
```

### Admin User Approval
```
Admin receives email notification 
→ Admin logs in to app 
→ Navigates to "Pending Users" 
→ Reviews user details 
→ Clicks "Approve" or "Reject" 
→ User status updated 
→ User gains access (if approved)
```

### Admin Tag Management
```
Admin logs in 
→ Navigates to "Manage Resources" 
→ Creates new tag 
→ Tag appears in filter dropdowns 
→ (Optional) Deletes unused tag
```

## 🚨 Security Checklist

- [ ] HTTPS enabled in production
- [ ] Client secrets stored securely (not in version control)
- [ ] SMTP credentials use app passwords or API keys
- [ ] Google OAuth client separate for dev/prod
- [ ] Admin email configured for notifications
- [ ] Token expiration configured appropriately
- [ ] CORS origins restricted to known domains
- [ ] Database credentials secured
- [ ] Environment variables never committed

## 📊 Health Check URLs

| Service | URL |
|---------|-----|
| Backend API | <http://localhost:3000/api/health> |
| Frontend App | <http://localhost:5173> |
| Keycloak Admin | <http://localhost:8080> |
| PostgreSQL | `psql -h localhost -U movietrack -d movietrack_db` |

## 💡 Pro Tips

1. **Use Mock Provider for Unit Tests:** Set `AUTH_PROVIDER=mock` to skip OAuth
2. **Test Email in Dev:** Use Gmail with app password before deploying
3. **First Admin:** Manually set first user as admin in database
4. **Google Sign-In:** Configure in Keycloak for development convenience
5. **Session Refresh:** Implement automatic refresh 5 minutes before expiration
6. **Error Handling:** Email failures are non-blocking (logged only)
7. **Approval Flow:** New users can't access app until admin approves
8. **Pending Status:** Users with pending status can log in but see limited UI

---

**Need Help?** Check the comprehensive guides:
- Google OAuth issues → `docs/GOOGLE_OAUTH_SETUP.md`
- Email problems → `docs/EMAIL_SETUP.md`
- Auth architecture → `backend/AUTHENTICATION.md`
