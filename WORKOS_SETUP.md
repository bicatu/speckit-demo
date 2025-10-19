# WorkOS Setup Guide (Production)

This guide explains how to set up WorkOS for production OAuth2/OpenID Connect authentication.

## Overview

WorkOS is a managed authentication service ideal for production environments. It provides:
- Enterprise SSO (Google, Microsoft, Okta, etc.)
- User management dashboard
- Compliance certifications (SOC 2, HIPAA)
- No infrastructure to manage

## Prerequisites

- WorkOS account (sign up at [workos.com](https://workos.com))
- Production domain name
- Google OAuth credentials (if using Google Sign-In)

## Step 1: Create WorkOS Account

1. Go to [workos.com](https://workos.com)
2. Click **Sign Up** or **Get Started**
3. Complete account registration
4. Verify your email address

## Step 2: Create an Organization

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Click **Create Organization** (if not already created)
3. Enter organization details:
   - **Name**: Your company/app name
   - **Domains**: Your production domain(s)
4. Click **Create**

## Step 3: Get API Credentials

1. In WorkOS Dashboard, go to **API Keys** (left sidebar)
2. You'll see two keys:
   - **API Key**: `sk_live_...` (for backend authentication)
   - **Client ID**: `client_...` (for OAuth flow)
3. Copy both values - you'll need them for configuration

## Step 4: Configure Google SSO (Optional)

To enable Google Sign-In:

1. **Create Google OAuth Credentials** (one-time setup)
   - Follow **[docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)** - Steps 1-4 "Creating Google OAuth Credentials"
   - **Important**: Use a separate OAuth client for production
   - You'll need: Client ID and Client Secret

2. **Add Google Connection in WorkOS**:
   - In WorkOS Dashboard, go to **Authentication** → **Connections**
   - Click **+ New Connection**
   - Select **Google OAuth**
   - Enter:
     - **Display Name**: `Google Sign-In`
     - **Client ID**: Paste your Google OAuth Client ID
     - **Client Secret**: Paste your Google OAuth Client Secret
   - Click **Create Connection**
   - Copy the **Redirect URI** shown by WorkOS

3. **Add Redirect URI to Google Console**:
   - Go to Google Cloud Console → Credentials
   - Edit your production OAuth client
   - Add the WorkOS redirect URI to **Authorized redirect URIs**
   - Also add your production domain to **Authorized JavaScript origins**
   - Save

4. **Activate the Connection**:
   - Back in WorkOS Dashboard, set connection **Status** to **Active**
   - (Optional) Configure allowed domains if restricting access

**Need detailed help?** See: **[docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)** - Section "WorkOS Configuration (Production)"

## Step 5: Configure Backend Environment

Update your production `backend/.env`:

```bash
# Authentication Provider Selection
AUTH_PROVIDER=workos

# WorkOS Configuration
WORKOS_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OAuth Configuration
OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

**Important:**
- Use `sk_live_...` API key (not test key)
- Use your production domain in `OAUTH_REDIRECT_URI`
- Never commit these credentials to version control

## Step 6: Configure Frontend Environment

Update your production `frontend/.env`:

```bash
# API Configuration
VITE_API_BASE_URL=https://yourdomain.com

# OAuth2 Configuration
VITE_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback

# Auth Provider
VITE_AUTH_PROVIDER=workos
```

## Step 7: Configure Redirect URIs in WorkOS

1. In WorkOS Dashboard, go to **Redirects**
2. Click **Add Redirect URI**
3. Add your production callback URL:
   - `https://yourdomain.com/auth/callback`
4. Save

## Step 8: Email Configuration

WorkOS requires email notifications for user approval workflow.

Follow **[docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)** to configure:
- SendGrid (recommended for production)
- AWS SES
- Or another SMTP provider

**Required environment variables:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

## Step 9: Deploy Application

1. **Deploy backend** with updated environment variables
2. **Deploy frontend** with updated environment variables
3. **Verify environment variables** are loaded correctly
4. **Check logs** for any configuration errors

## Step 10: Test Authentication Flow

1. **Open production app**: `https://yourdomain.com`
2. **Click "Log In"**
3. **Verify redirect** to WorkOS authentication page
4. **Test Google Sign-In** (if configured)
5. **Verify callback** returns to your app
6. **Check new user** is created with `pending` status
7. **Verify admin email** notification is sent
8. **Test admin approval** workflow

## Testing Checklist

- [ ] Production app loads correctly
- [ ] Login button redirects to WorkOS
- [ ] Google Sign-In button appears (if configured)
- [ ] Can authenticate with Google account
- [ ] Callback returns to production app
- [ ] User profile is displayed correctly
- [ ] New users have `pending` status
- [ ] Admin receives email notification
- [ ] Admin can approve users
- [ ] Approved users can access full app
- [ ] Logout works correctly
- [ ] Session refresh works automatically

## Troubleshooting

### "Invalid redirect_uri"

**Cause**: Redirect URI mismatch between WorkOS and your configuration.

**Solution**:
1. Check WorkOS Dashboard → Redirects for registered URIs
2. Verify `OAUTH_REDIRECT_URI` in backend `.env` matches exactly
3. Ensure using `https://` (not `http://`) in production
4. Check for trailing slashes (must match exactly)

### "Unauthorized" or API key errors

**Cause**: Incorrect API key or Client ID.

**Solution**:
1. Verify using `sk_live_...` API key (not test key)
2. Double-check Client ID in WorkOS Dashboard → API Keys
3. Ensure no extra spaces when copying credentials
4. Regenerate API key if needed (WorkOS Dashboard → API Keys → Regenerate)

### Google Sign-In not appearing

**Cause**: Google connection not configured or not active.

**Solution**:
1. Check WorkOS Dashboard → Connections
2. Verify Google connection Status is **Active**
3. Check Google OAuth credentials are correct
4. Verify redirect URI is registered in Google Console

### Email notifications not sent

**Cause**: SMTP configuration issues.

**Solution**:
- See **[docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)** for detailed troubleshooting
- Check backend logs for email errors
- Verify SMTP credentials and settings
- Test SMTP connection with test script

### User not created in database

**Cause**: OAuth callback handler failure or database connection issue.

**Solution**:
1. Check backend logs for errors in `/api/auth/callback`
2. Verify database connection is working
3. Check PostgreSQL is accessible from production environment
4. Review WorkOS Dashboard → Events for authentication events

## Security Best Practices

### API Keys
- Use environment variables (never hardcode)
- Use `sk_live_...` keys in production
- Rotate API keys quarterly
- Use separate WorkOS organizations for staging/production

### Domain Security
- Enable HTTPS only (enforce SSL)
- Configure proper CORS origins
- Restrict WorkOS redirect URIs to your domain only
- Use HSTS headers

### Google OAuth
- Use separate OAuth clients for dev/staging/prod
- Restrict authorized domains in Google Console
- Enable Google Cloud Console billing alerts
- Complete Google app verification for production

### Monitoring
- Monitor WorkOS Dashboard → Events for suspicious activity
- Set up logging for authentication failures
- Track failed login attempts
- Monitor API rate limits

## WorkOS Features

### Available Authentication Methods

In addition to Google, WorkOS supports:
- Microsoft Azure AD / Office 365
- Okta
- OneLogin
- Custom SAML providers
- Magic link (passwordless)
- Email/password (with verification)

### User Management

WorkOS Dashboard provides:
- User directory
- Activity logs
- Session management
- Admin portal (optional)

### Compliance

WorkOS is compliant with:
- SOC 2 Type II
- GDPR
- HIPAA (Business Associate Agreement available)

## Cost Considerations

WorkOS Pricing (as of 2025):
- **Free tier**: Up to 1,000 monthly active users
- **Growth**: $0.05 per MAU after 1,000 users
- **Enterprise**: Custom pricing with SLA

See [workos.com/pricing](https://workos.com/pricing) for current pricing.

## Migration from Keycloak to WorkOS

If migrating from local Keycloak setup:

1. **Export users** from Keycloak (Admin Console → Export)
2. **Create WorkOS connections** for authentication providers
3. **Update environment variables** (change `AUTH_PROVIDER=workos`)
4. **Test in staging** environment first
5. **Migrate users** (may require re-authentication)
6. **Deploy to production**
7. **Monitor for issues** during migration period

**No code changes required** - the application uses provider abstraction.

## Support Resources

- [WorkOS Documentation](https://workos.com/docs)
- [WorkOS API Reference](https://workos.com/docs/reference)
- [WorkOS Support](https://workos.com/support)
- [WorkOS Status Page](https://status.workos.com)

## Next Steps

Once WorkOS is configured:

1. **Complete email setup**: [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)
2. **Review authentication architecture**: [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md)
3. **Set up monitoring** and alerts
4. **Create admin user** in production database
5. **Test complete user approval workflow**
6. **Monitor WorkOS Dashboard** for events and errors

## Additional Documentation

- **Authentication Architecture**: [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md)
- **Google OAuth Setup**: [docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)
- **Email Setup**: [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)
- **Main README**: [README.md](README.md)
