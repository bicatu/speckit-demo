# Google OAuth Setup Guide

This guide covers how to create and configure Google OAuth credentials for Google Sign-In.

**This is a shared guide** referenced by:
- [KEYCLOAK_SETUP.md](../KEYCLOAK_SETUP.md) - For local development with Keycloak
- [WORKOS_SETUP.md](../WORKOS_SETUP.md) - For production with WorkOS

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Creating Google OAuth Credentials](#creating-google-oauth-credentials)
- [Provider-Specific Configuration](#provider-specific-configuration)
  - [Keycloak Configuration (Development)](#keycloak-configuration-development)
  - [WorkOS Configuration (Production)](#workos-configuration-production)
- [Testing Google Sign-In](#testing-google-sign-in)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- A Google account (Gmail)
- Access to [Google Cloud Console](https://console.cloud.google.com)
- Keycloak running locally (for development) or WorkOS account (for production)
- Admin access to your Keycloak instance or WorkOS organization

## Creating Google OAuth Credentials

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click **New Project**
4. Enter project details:
   - **Project name**: `MovieTrack App` (or your preferred name)
   - **Organization**: Select your organization (optional)
5. Click **Create**

### Step 2: Enable Google+ API (if required)

1. In your project, navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" or "People API"
3. Click **Enable** (may already be enabled)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **User Type**:
   - **Internal**: Only users in your Google Workspace organization (recommended for private apps)
   - **External**: Any Google account user (select this for development/testing)
3. Click **Create**
4. Fill in the **App information**:
   - **App name**: `MovieTrack App`
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your app logo
   - **Application home page**: `http://localhost:5173` (dev) or your production URL
   - **Application privacy policy**: Your privacy policy URL (if available)
   - **Application terms of service**: Your terms of service URL (if available)
5. Under **Developer contact information**:
   - **Email addresses**: Your email address
6. Click **Save and Continue**
7. **Scopes**: Click **Add or Remove Scopes**
   - Add: `openid`
   - Add: `email`
   - Add: `profile`
   - Click **Update** then **Save and Continue**
8. **Test users** (if External):
   - Click **Add Users**
   - Add email addresses for testing (e.g., your Gmail address)
   - Click **Save and Continue**
9. Review and click **Back to Dashboard**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Application type**: `Web application`
4. Enter **Name**: `MovieTrack Web Client`
5. Add **Authorized JavaScript origins**:
   - For **Development/Keycloak**:
     - `http://localhost:8080`
   - For **Production/WorkOS**:
     - `https://yourdomain.com`
6. Add **Authorized redirect URIs**:
   - For **Development/Keycloak**:
     - `http://localhost:8080/realms/movietrack/broker/google/endpoint`
   - For **Production/WorkOS**:
     - `https://api.workos.com/sso/oauth/google/{your-connection-id}/callback`
     - (WorkOS will provide the exact URI)
7. Click **Create**
8. **Save your credentials**:
   - **Client ID**: `xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Important**: Keep these secure and never commit them to version control

## Provider-Specific Configuration

After creating your Google OAuth credentials, configure them in your authentication provider:

### Keycloak Configuration (Development)

**For detailed Keycloak setup**, see **[KEYCLOAK_SETUP.md](../KEYCLOAK_SETUP.md) - Step 5**

**Quick Reference:**

1. Access Keycloak Admin Console (<http://localhost:8080>)
2. Select `movietrack` realm
3. Go to **Identity Providers** → **Add provider** → **Google**
4. Configure:
   - **Client ID**: Paste your Google OAuth Client ID
   - **Client Secret**: Paste your Google OAuth Client Secret
   - **Default Scopes**: `openid profile email`
   - **Trust Email**: ON
5. Click **Save**
6. Copy the **Redirect URI**: `http://localhost:8080/realms/movietrack/broker/google/endpoint`
7. Add this redirect URI to Google Console
8. Test by logging into your app and clicking Google Sign-In

**Advanced Configuration:**

- **Email Mapper** (recommended): Ensures email sync from Google
  - Identity Providers → Google → Mappers → Add mapper
  - Type: Attribute Importer
  - Social Profile JSON Field: `email`
  - User Attribute Name: `email`

- **Hosted Domain** (optional): Restrict to specific Google Workspace domain

### WorkOS Configuration (Production)

**For detailed WorkOS setup**, see **[WORKOS_SETUP.md](../WORKOS_SETUP.md) - Step 4**

**Quick Reference:**

1. Log in to [WorkOS Dashboard](https://dashboard.workos.com)
2. Go to **Authentication** → **Connections** → **+ New Connection**
3. Select **Google OAuth**
4. Configure:
   - **Display Name**: `Google Sign-In`
   - **Client ID**: Paste your Google OAuth Client ID (production)
   - **Client Secret**: Paste your Google OAuth Client Secret (production)
5. Click **Create Connection**
6. Copy the **Redirect URI** provided by WorkOS
7. Add this redirect URI to your production Google OAuth client
8. Set connection **Status** to **Active**
9. Deploy your app with WorkOS configuration
10. Test by logging into production app and clicking Google Sign-In

**Important for Production:**
- Use a **separate** Google OAuth client for production
- Configure production domain in Google Console authorized origins
- Ensure WorkOS redirect URI uses `https://`
- Set up allowed domains in WorkOS if restricting access

## Testing Google Sign-In

### Development Testing Checklist

- [ ] Google button appears on Keycloak login page
- [ ] Clicking Google button redirects to Google Sign-In
- [ ] Can sign in with test Google account
- [ ] Profile information is captured (name, email)
- [ ] User is created in database with `approval_status = 'pending'`
- [ ] Admin receives email notification of new user
- [ ] Pending user sees "Pending Approval" message
- [ ] Admin can approve user from Pending Users page
- [ ] Approved user can access full application
- [ ] Log out successfully terminates session
- [ ] Can sign in again with same Google account

### Production Testing Checklist

- [ ] Google button appears on WorkOS login page
- [ ] Clicking Google button redirects to Google Sign-In
- [ ] Can sign in with production Google account
- [ ] Profile information is captured correctly
- [ ] User approval workflow functions correctly
- [ ] Email notifications are sent to admin
- [ ] Session management works correctly (refresh, logout)
- [ ] HTTPS is enforced on all auth endpoints
- [ ] Redirect URIs are using production domain

## Troubleshooting

### Issue: "Redirect URI Mismatch" Error

**Cause**: The redirect URI configured in Google Console doesn't match what's being requested.

**Solution**:
1. Check the exact redirect URI in the error message
2. Go to Google Cloud Console > Credentials
3. Edit your OAuth client
4. Add the exact redirect URI to **Authorized redirect URIs**
5. Wait 5-10 minutes for changes to propagate
6. Try again

### Issue: "Access Blocked: This app is not verified"

**Cause**: Google shows this warning for unverified apps with External user type.

**Solution for Development**:
1. Add your test users in Google Console > OAuth consent screen > Test users
2. Or click "Advanced" > "Go to [App Name] (unsafe)" during testing

**Solution for Production**:
1. Submit your app for verification: Google Console > OAuth consent screen > "Publish App"
2. Complete Google's verification process (may take days/weeks)
3. Or use Internal user type (Google Workspace only)

### Issue: "Email Not Available" After Login

**Cause**: Email scope not requested or mapper not configured.

**Solution for Keycloak**:
1. Check Identity Provider scopes include `email`
2. Verify "Trust Email" is enabled
3. Add email mapper as described in Step 7 above

**Solution for WorkOS**:
1. Verify Google connection has email scope enabled
2. Check WorkOS connection status is Active

### Issue: User Not Created in Database

**Cause**: OAuth callback handler may have failed.

**Solution**:
1. Check backend logs for errors during `/api/auth/callback`
2. Verify database connection is working
3. Check PostgreSQL logs for constraint violations
4. Ensure `AUTH_PROVIDER` environment variable is set correctly

### Issue: "Invalid Client" Error

**Cause**: Client ID or Client Secret is incorrect.

**Solution**:
1. Double-check your Google OAuth credentials
2. Ensure no extra spaces when copying credentials
3. Regenerate Client Secret if needed (Google Console > Credentials > Edit > "Reset Secret")
4. Update Keycloak/WorkOS with new credentials

### Issue: Email Notifications Not Sent

**Cause**: SMTP configuration issues.

**Solution**:
1. Check backend `.env` file for correct SMTP settings
2. Verify `ADMIN_EMAIL` is set
3. Test SMTP connection independently
4. Check backend logs for email service errors
5. See `docs/EMAIL_SETUP.md` for detailed email configuration

### Issue: Keycloak Shows "Invalid Parameter: redirect_uri"

**Cause**: Application's redirect URI doesn't match what's configured in Keycloak client.

**Solution**:
1. In Keycloak Admin Console, go to **Clients** > `movietrack-app`
2. Check **Valid Redirect URIs**:
   - Should include: `http://localhost:5173/*` (or your frontend URL)
3. Ensure **Web Origins** includes: `http://localhost:5173` (or `+` for auto-detect)
4. Save and try again

## Security Best Practices

### For Development

- Use separate Google OAuth clients for dev/staging/production
- Never commit OAuth credentials to version control
- Add test email addresses to Google Console test users (External apps)
- Regularly rotate Client Secrets

### For Production

- Use Internal user type if using Google Workspace (most secure)
- Complete Google app verification for External apps
- Use separate OAuth client for production environment
- Enable HTTPS only (never HTTP in production)
- Regularly audit authorized users in WorkOS
- Monitor authentication logs for suspicious activity
- Set up Google Cloud Console billing alerts
- Use Google Cloud Secret Manager for credential storage
- Rotate Client Secrets quarterly

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Keycloak Identity Provider Documentation](https://www.keycloak.org/docs/latest/server_admin/#_identity_broker)
- [WorkOS SSO Documentation](https://workos.com/docs/sso)
- [Google Cloud Console](https://console.cloud.google.com)

## Support

If you encounter issues not covered in this guide:

1. Check backend logs: `docker-compose logs backend`
2. Check Keycloak logs: `docker-compose logs keycloak`
3. Review Google Cloud Console error messages
4. Check WorkOS dashboard logs (production)
5. Verify all redirect URIs match exactly
6. Ensure environment variables are set correctly

For application-specific issues, see:
- `backend/AUTHENTICATION.md` - Authentication architecture
- `KEYCLOAK_SETUP.md` - Basic Keycloak setup
- `docs/EMAIL_SETUP.md` - Email configuration
