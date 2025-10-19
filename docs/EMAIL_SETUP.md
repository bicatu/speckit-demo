# Email Notification Setup Guide

This guide covers how to configure email notifications for the Movie Tracking Application. Email notifications are sent when new users request account approval.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [SMTP Configuration](#smtp-configuration)
- [Gmail Setup (Development)](#gmail-setup-development)
- [SendGrid Setup (Production)](#sendgrid-setup-production)
- [AWS SES Setup (Production)](#aws-ses-setup-production)
- [Testing Email Notifications](#testing-email-notifications)
- [Troubleshooting](#troubleshooting)

## Overview

The application sends email notifications in the following scenarios:

- **New User Request**: When a new user signs up via OAuth and their account is created with `pending` approval status, an email is sent to the admin
- **Email Content**: Includes user's name, email address, and a timestamp of the request

### Email Service Architecture

- **Backend**: Uses Nodemailer with IEmailService interface abstraction
- **Configuration**: SMTP settings in backend `.env` file
- **Error Handling**: Non-blocking - email failures won't prevent user creation
- **Logging**: All email send attempts are logged for debugging

## Prerequisites

- SMTP server credentials (Gmail, SendGrid, AWS SES, or other provider)
- Admin email address for receiving notifications
- Backend environment file (`backend/.env`)

## SMTP Configuration

### Environment Variables

Add the following to your `backend/.env` file:

```bash
# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password-or-app-password
SMTP_FROM_NAME=MovieTrack App
SMTP_FROM_EMAIL=noreply@example.com
ADMIN_EMAIL=admin@example.com
```

### Configuration Parameters

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` (TLS), `465` (SSL), `25` (plain) |
| `SMTP_SECURE` | Use SSL connection | `true` for port 465, `false` for 587 |
| `SMTP_USER` | SMTP authentication username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP authentication password | App password or regular password |
| `SMTP_FROM_NAME` | Sender display name | `MovieTrack App` |
| `SMTP_FROM_EMAIL` | Sender email address | `noreply@yourdomain.com` |
| `ADMIN_EMAIL` | Admin email for notifications | `admin@yourdomain.com` |

## Gmail Setup (Development)

Gmail is a convenient option for development and testing.

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Navigate to **2-Step Verification**
3. Follow prompts to enable 2FA (required for App Passwords)

### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **2-Step Verification**
3. Scroll down to **App passwords**
4. Click **App passwords**
5. Select app: **Mail**
6. Select device: **Other (Custom name)**
7. Enter name: `MovieTrack Dev`
8. Click **Generate**
9. Copy the 16-character app password (format: `xxxx xxxx xxxx xxxx`)

⚠️ **Important**: Save this password immediately - it's only shown once!

### Step 3: Configure Backend Environment

Update `backend/.env`:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Your app password (remove spaces)
SMTP_FROM_NAME=MovieTrack Dev
SMTP_FROM_EMAIL=your-gmail@gmail.com
ADMIN_EMAIL=your-admin-email@gmail.com
```

### Step 4: Restart Backend Server

```bash
cd backend
npm run dev
```

### Gmail Limitations

- **Daily sending limit**: 500 emails per day (free Gmail)
- **Rate limiting**: ~20-30 emails per minute
- **Not recommended for production**: Use dedicated email service instead

## SendGrid Setup (Production)

SendGrid is a reliable email service with generous free tier (100 emails/day).

### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://signup.sendgrid.com/)
2. Sign up for a free account
3. Complete email verification
4. Complete sender verification process

### Step 2: Verify Sender Identity

**Option A: Single Sender Verification** (Quick, for testing):

1. In SendGrid dashboard, go to **Settings** > **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address
4. Check your email and click verification link

**Option B: Domain Authentication** (Recommended for production):

1. Go to **Settings** > **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Choose your DNS host
4. Add provided DNS records to your domain
5. Wait for verification (can take up to 48 hours)

### Step 3: Create API Key

1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Name: `MovieTrack Production`
4. Permissions: **Restricted Access**
   - Enable: **Mail Send** > **Full Access**
5. Click **Create & View**
6. Copy the API key (starts with `SG.`)

⚠️ **Important**: Save this key immediately - it's only shown once!

### Step 4: Configure Backend Environment

Update `backend/.env`:

```bash
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey  # Literally the string "apikey"
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your API key
SMTP_FROM_NAME=MovieTrack App
SMTP_FROM_EMAIL=noreply@yourdomain.com  # Must be verified sender
ADMIN_EMAIL=admin@yourdomain.com
```

### SendGrid Benefits

- **Free tier**: 100 emails/day free
- **Reliability**: 99.9% uptime SLA
- **Analytics**: Email open/click tracking
- **Scale**: Easy to upgrade as you grow

## AWS SES Setup (Production)

AWS Simple Email Service (SES) is cost-effective for high-volume sending.

### Step 1: Create AWS Account

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Sign up or log in to your AWS account

### Step 2: Verify Email Address or Domain

**Email Verification** (Quick start):

1. Open [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Select your region (e.g., `us-east-1`)
3. Go to **Verified identities**
4. Click **Create identity**
5. Select **Email address**
6. Enter your email address
7. Click **Create identity**
8. Check your email and click verification link

**Domain Verification** (Production):

1. Go to **Verified identities** > **Create identity**
2. Select **Domain**
3. Enter your domain name
4. Choose **Easy DKIM** (recommended)
5. Copy the provided DNS records
6. Add DNS records to your domain
7. Wait for verification (up to 72 hours)

### Step 3: Request Production Access

By default, AWS SES is in **Sandbox mode** (can only send to verified emails).

To send to any email:

1. In SES Console, click **Get Started** under "Request production access"
2. Fill out the form:
   - **Use case description**: "Transactional emails for user registration and approval notifications"
   - **Sending limit**: Estimate your needs
3. Submit request
4. AWS typically approves within 24 hours

### Step 4: Create SMTP Credentials

1. In SES Console, go to **SMTP settings**
2. Click **Create SMTP credentials**
3. Enter IAM user name: `movietrack-ses-smtp`
4. Click **Create**
5. Download credentials (contains SMTP username and password)

### Step 5: Configure Backend Environment

Update `backend/.env`:

```bash
# AWS SES SMTP Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Check your region
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAXXXXXXXXXXXXXXXX  # From downloaded credentials
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # From credentials
SMTP_FROM_NAME=MovieTrack App
SMTP_FROM_EMAIL=noreply@yourdomain.com  # Must be verified
ADMIN_EMAIL=admin@yourdomain.com
```

### AWS SES Benefits

- **Cost-effective**: $0.10 per 1,000 emails (after free tier)
- **Free tier**: 62,000 emails/month (if sending from EC2)
- **Scalability**: Can handle millions of emails
- **Integration**: Works well with other AWS services

## Testing Email Notifications

### Manual Test

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Trigger a new user signup**:
   - Open your frontend: <http://localhost:5173>
   - Click **Log In**
   - Sign in with a NEW Google account (not previously registered)
   - Complete the OAuth flow

3. **Check admin email**:
   - Open the email inbox for `ADMIN_EMAIL`
   - Look for email with subject: "New User Registration - Approval Required"
   - Verify email contains:
     - User's name
     - User's email address
     - Timestamp of request

4. **Check backend logs**:
   ```bash
   # Look for email send confirmation
   [INFO] Email sent successfully to admin@example.com
   ```

### Automated Test Script

Create a test script to verify email configuration:

```bash
# backend/scripts/test-email.ts
import { Container } from '../src/config/Container';

async function testEmail() {
  const container = Container.getInstance();
  const emailService = container.getEmailService();

  try {
    await emailService.sendNewUserNotification({
      userName: 'Test User',
      userEmail: 'test@example.com',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com'
    });
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

testEmail();
```

Run the test:

```bash
cd backend
npx ts-node scripts/test-email.ts
```

## Troubleshooting

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Cause** (Gmail): Using regular password instead of App Password, or 2FA not enabled.

**Solution**:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password (see Gmail setup above)
3. Use the app password in `SMTP_PASSWORD`
4. Remove any spaces from the app password

**Cause** (SendGrid): Incorrect API key or not using "apikey" as username.

**Solution**:
1. Verify `SMTP_USER=apikey` (literally)
2. Double-check your API key in `SMTP_PASSWORD`
3. Ensure API key has Mail Send permissions

### Issue: "Connection timeout" or "ECONNREFUSED"

**Cause**: Incorrect SMTP host or port, or firewall blocking connection.

**Solution**:
1. Verify `SMTP_HOST` is correct for your provider
2. Check `SMTP_PORT` (587 for TLS, 465 for SSL)
3. If using SSL (port 465), set `SMTP_SECURE=true`
4. Check firewall rules allow outbound SMTP connections
5. Test connection with telnet: `telnet smtp.gmail.com 587`

### Issue: "SMTP FROM: 550 Sender not allowed"

**Cause**: Sender email not verified or doesn't match authenticated user.

**Solution**:
1. Verify the sender email address with your provider
2. For SendGrid: Complete sender verification
3. For AWS SES: Verify domain or email in SES console
4. Ensure `SMTP_FROM_EMAIL` matches verified identity

### Issue: Emails going to spam folder

**Cause**: Poor sender reputation or missing email authentication.

**Solution**:
1. **SPF Record**: Add TXT record to your domain:
   ```
   v=spf1 include:_spf.google.com ~all  # For Gmail
   v=spf1 include:sendgrid.net ~all     # For SendGrid
   v=spf1 include:amazonses.com ~all    # For AWS SES
   ```

2. **DKIM**: Enable in your email provider (SendGrid/SES handle automatically)

3. **DMARC**: Add TXT record:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

4. Use dedicated sending domain (not Gmail for production)
5. Warm up your IP address (gradually increase sending volume)

### Issue: "No admin email notification received"

**Cause**: `ADMIN_EMAIL` not configured or email service failed silently.

**Solution**:
1. Check `ADMIN_EMAIL` is set in `backend/.env`
2. Check backend logs for email errors:
   ```bash
   docker-compose logs backend | grep -i email
   ```
3. Verify SMTP configuration with test script (see above)
4. Check spam/junk folder
5. Ensure backend server restarted after `.env` changes

### Issue: "Email service is not configured" error

**Cause**: Missing required SMTP environment variables.

**Solution**:
1. Verify all required variables are in `backend/.env`:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
2. Restart backend server to load new variables
3. Check for typos in variable names

## Email Templates

The application uses the following email template:

### New User Registration Email

**Subject**: `New User Registration - Approval Required`

**Body**:
```
Hello Admin,

A new user has requested access to the MovieTrack application:

Name: [User Full Name]
Email: [User Email Address]
Requested At: [Timestamp]

Please log in to the admin panel to review and approve or reject this request:
http://localhost:5173/admin/pending-users

Best regards,
MovieTrack System
```

### Customizing Email Templates

To customize email templates, edit:

- **Backend**: `backend/src/infrastructure/external/NodemailerEmailService.ts`
- Look for the `sendNewUserNotification` method
- Modify subject line and HTML/text body as needed

## Security Best Practices

### For Development

- Never commit SMTP credentials to version control
- Use App Passwords (Gmail) instead of regular passwords
- Add `.env` to `.gitignore`
- Rotate credentials if accidentally exposed

### For Production

- Use dedicated email service (SendGrid, AWS SES)
- Enable SPF, DKIM, and DMARC authentication
- Use environment variables or secrets manager for credentials
- Monitor email bounce and complaint rates
- Set up email rate limiting
- Use separate sending domains for transactional vs marketing emails
- Regularly audit email logs for suspicious activity
- Implement email verification for user signups
- Use TLS/SSL encryption (SMTP_SECURE=true for port 465)

## Cost Estimation

### Gmail (Development Only)

- **Free**: 500 emails/day
- **Limitation**: Not suitable for production

### SendGrid

- **Free tier**: 100 emails/day forever
- **Essentials**: $19.95/mo (50,000 emails/month)
- **Pro**: $89.95/mo (1.5M emails/month)

### AWS SES

- **Free tier**: 62,000 emails/month (if sending from EC2)
- **Pay-as-you-go**: $0.10 per 1,000 emails
- **Example**: 100,000 emails/month = ~$10/month

## Monitoring and Logs

### Check Email Send Status

```bash
# View backend logs
docker-compose logs -f backend | grep -i email

# Look for success messages
[INFO] Email sent successfully to admin@example.com

# Look for error messages
[ERROR] Failed to send email: Connection timeout
```

### Email Provider Dashboards

- **SendGrid**: View delivery stats, bounces, opens in dashboard
- **AWS SES**: Monitor via CloudWatch metrics
- **Gmail**: Check "Sent" folder for delivery confirmation

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [SendGrid SMTP Integration](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/)

## Support

If you encounter email issues not covered in this guide:

1. Check backend logs: `docker-compose logs backend`
2. Test SMTP connection: `telnet SMTP_HOST SMTP_PORT`
3. Verify environment variables are loaded
4. Check email provider status page
5. Review provider-specific documentation

For application-specific issues, see:
- `backend/AUTHENTICATION.md` - Authentication architecture
- `docs/GOOGLE_OAUTH_SETUP.md` - Google Sign-In setup
