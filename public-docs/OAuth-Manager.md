# OAuth Manager

Complete guide to the OAuth Manager server for managing OAuth2 integrations with external services.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Web Interface](#web-interface)
- [Google OAuth Setup](#google-oauth-setup-walkthrough)
- [Adding Other Providers](#adding-other-oauth-providers)
- [Managing Tokens](#managing-tokens)
- [Troubleshooting](#troubleshooting)
- [Environment Variables](#environment-variables-reference)
- [Security](#security)

## Overview

The OAuth Manager is a local web server that handles OAuth2 authorization flows for services like Google, LinkedIn, Twitter, and Facebook. It runs on `http://localhost:3001` and provides a web interface for connecting and managing integrations.

### What It Does

- **OAuth Flow Handling** - Manages authorization redirects and callbacks
- **Token Storage** - Securely stores access and refresh tokens
- **Automatic Refresh** - Refreshes tokens before expiration
- **Multi-Provider** - Supports multiple OAuth providers simultaneously
- **Token Registry** - Tracks all connected services in one place

### Architecture

```
Your Browser <----> OAuth Manager (localhost:3001) <----> OAuth Provider (Google, etc.)
                           |
                           v
                    Token Registry
                    (lib/oauth-registry.js)
```

## Quick Start

### Start OAuth Manager

```
/motus oauth start
```

The server starts at `http://localhost:3001` and automatically opens in your default browser.

**Expected Output:**

```
🔐 OAuth Manager Starting...

✓ Server running at http://localhost:3001
✓ Opening browser...

OAuth Manager Status:
  - Google: Not connected
  - LinkedIn: Not connected
  - Facebook: Not connected
  - Twitter: Not connected

Ready to authorize integrations!
```

### Stop OAuth Manager

```
/motus oauth stop
```

### Check Status

```
/motus oauth status
```

**Output:**

```
🔐 OAuth Manager Status

Connected Services (2):
  ✓ Google
    - Connected: 2025-10-09
    - Expires: 2025-11-09
    - Scopes: calendar, gmail

  ✓ LinkedIn
    - Connected: 2025-10-08
    - Expires: 2025-12-08
    - Scopes: profile, posts

Not Connected (2):
  ✗ Facebook
  ✗ Twitter
```

## Web Interface

### UI Overview

> **📸 Screenshot Location**: When this is published, add a screenshot of the OAuth Manager homepage showing all service cards.

The OAuth Manager web interface displays:

#### Service Cards

Each OAuth provider has a card showing:

```
┌─────────────────────────────┐
│  Google                     │
│  [Google Logo]              │
│                             │
│  Status: ● Not Connected    │
│                             │
│  [Connect with Google]      │
└─────────────────────────────┘
```

**Connected State:**

```
┌─────────────────────────────┐
│  Google                     │
│  [Google Logo]              │
│                             │
│  Status: ✓ Connected        │
│  Expires: Nov 9, 2025       │
│  Scopes: calendar, gmail    │
│                             │
│  [Refresh]  [Disconnect]    │
└─────────────────────────────┘
```

#### Connection Flow

> **📸 Screenshot Location**: Add screenshots showing:
> 1. Initial service card with "Connect" button
> 2. OAuth consent screen (Google's permission page)
> 3. Success state with "Connected" and token expiration

### Using the Interface

**Step 1: Select Service**

Click "Connect" on the service card you want to authorize.

**Step 2: Authorize**

You'll be redirected to the provider's login/authorization page. Sign in and approve the requested permissions.

**Step 3: Automatic Return**

After approving, you're automatically redirected back to the OAuth Manager, and the service shows as connected.

## Google OAuth Setup Walkthrough

Let's walk through setting up Google OAuth step-by-step, from creating credentials to connecting in the OAuth Manager.

### Prerequisites

- Google account
- Access to Google Cloud Console

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project details:
   - **Project name**: `Motus Integrations`
   - **Location**: No organization (or your org)
4. Click "Create"
5. Wait for project creation (10-30 seconds)

> **📸 Screenshot**: Google Cloud Console project creation screen

### Step 2: Enable APIs

1. In your project, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Calendar API**
   - **Gmail API**

For each API:
1. Click the API name
2. Click "Enable"
3. Wait for activation

> **📸 Screenshot**: API Library with Calendar and Gmail APIs highlighted

### Step 3: Create OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Click "Create"

**Fill in the form:**

```
App Information:
  App name: Motus
  User support email: your-email@gmail.com
  Developer contact: your-email@gmail.com

App Domain (optional):
  Leave blank for local development

Scopes:
  Add scopes:
    - .../auth/calendar.readonly
    - .../auth/gmail.readonly
```

4. Click "Save and Continue"
5. Add test users (your email) - required for External apps
6. Click "Save and Continue"
7. Review and click "Back to Dashboard"

> **📸 Screenshot**: OAuth consent screen configuration page

### Step 4: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click "**+ Create Credentials**" → "**OAuth client ID**"

**Configure:**

```
Application type: Web application
Name: Motus OAuth Manager

Authorized redirect URIs:
  Click "Add URI"
  Enter: http://localhost:3001/oauth/google/callback
```

3. Click "Create"

**Save the credentials:**

You'll see a dialog with:
- **Client ID**: `1234567890-abc123.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abc123xyz`

**Copy both values** - you'll need them in the next step.

> **📸 Screenshot**: OAuth client created dialog showing Client ID and Secret

### Step 5: Add Credentials to .env

Open your `.env` file and add:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback
```

**Important**: Replace with your actual Client ID and Secret from Step 4.

### Step 6: Configure OAuth Manager

Update `lib/oauth-registry.js` to include Google config:

```javascript
{
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  }
}
```

### Step 7: Connect in OAuth Manager

1. Start OAuth Manager:
   ```
   /motus oauth start
   ```

2. In the web interface, click "**Connect with Google**"

3. You'll be redirected to Google's consent screen

4. Sign in to your Google account (if not already)

5. Review the permissions:
   ```
   Motus wants to:
   ✓ See your calendar events
   ✓ Read your Gmail messages
   ```

6. Click "**Allow**"

7. You're redirected back to OAuth Manager

8. Google card now shows:
   ```
   Status: ✓ Connected
   Expires: [Date]
   Scopes: calendar, gmail
   ```

**✅ Success!** Google is now connected and ready to use in your agents.

### Step 8: Test the Connection

In Claude Code:

```
Use the calendar-fetcher agent to get today's events
```

The agent will use the Google OAuth token to fetch your calendar events.

## Adding Other OAuth Providers

The OAuth Manager supports multiple providers. Here's how to add each one:

### Twitter (X) OAuth

**Step 1: Create Twitter App**

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Navigate to "Keys and tokens"
4. Generate OAuth 2.0 Client ID and Secret

**Step 2: Configure Redirect URI**

In Twitter app settings:
```
Callback URI: http://localhost:3001/oauth/twitter/callback
```

**Step 3: Add to .env**

```bash
# Twitter OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:3001/oauth/twitter/callback
```

**Step 4: Update oauth-registry.js**

```javascript
{
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    redirectUri: process.env.TWITTER_REDIRECT_URI,
    scopes: ['tweet.read', 'users.read'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token'
  }
}
```

### GitHub OAuth

**Step 1: Register OAuth App**

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `Motus`
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/oauth/github/callback`
4. Click "Register application"
5. Generate a client secret

**Step 2: Add to .env**

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3001/oauth/github/callback
```

**Step 3: Update oauth-registry.js**

```javascript
{
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
    scopes: ['repo', 'user'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token'
  }
}
```

### LinkedIn OAuth

**Step 1: Create LinkedIn App**

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Get Client ID and Client Secret from "Auth" tab

**Step 2: Configure Redirect URL**

In LinkedIn app settings:
```
Redirect URLs: http://localhost:3001/oauth/linkedin/callback
```

**Step 3: Add to .env**

```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/oauth/linkedin/callback
```

**Step 4: Update oauth-registry.js**

```javascript
{
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI,
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
  }
}
```

### Notion OAuth

**Step 1: Create Integration**

1. Go to [My Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in basic information
4. Set capabilities (Read content, Update content, etc.)
5. Submit

**Step 2: Get OAuth Credentials**

1. In integration settings, go to "Secrets" tab
2. Copy "OAuth client ID" and "OAuth client secret"

**Step 3: Configure Redirect**

In integration settings:
```
Redirect URIs: http://localhost:3001/oauth/notion/callback
```

**Step 4: Add to .env**

```bash
# Notion OAuth
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=http://localhost:3001/oauth/notion/callback
```

## Managing Tokens

### View All Tokens

```
/motus oauth tokens
```

**Output:**

```json
{
  "google": {
    "accessToken": "ya29.a0AfH6SMB...",
    "refreshToken": "1//0gHZs...",
    "expiresAt": "2025-11-09T10:00:00.000Z",
    "scopes": ["calendar", "gmail"]
  },
  "linkedin": {
    "accessToken": "AQV7Kw...",
    "refreshToken": null,
    "expiresAt": "2025-12-08T10:00:00.000Z",
    "scopes": ["profile", "posts"]
  }
}
```

### Refresh a Token

Manually refresh an expired token:

```
/motus oauth refresh google
```

**Output:**

```
🔄 Refreshing Google token...
✓ Token refreshed successfully
  New expiration: 2025-11-10T10:00:00.000Z
```

### Disconnect a Service

```
/motus oauth disconnect google
```

**Output:**

```
🔌 Disconnecting Google...
✓ Token removed from registry
✓ Credentials deleted

To reconnect, use: /motus oauth start
```

### Token Lifecycle

```
Connect Service
     ↓
Receive Access Token (expires in ~1 hour)
Receive Refresh Token (expires in ~60 days)
     ↓
Access Token expires → Automatic refresh using Refresh Token
     ↓
New Access Token (expires in ~1 hour)
     ↓
[Cycle continues]
     ↓
Refresh Token expires → Must reconnect service
```

## Troubleshooting

### Common Issues

#### Issue 1: Port Already in Use

**Symptom:**

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Cause:** Another process is using port 3001

**Solutions:**

**Option A - Use Different Port:**

```
/motus oauth start --port 3002
```

**Important:** Update redirect URIs in all OAuth provider settings to use port 3002:
```
http://localhost:3002/oauth/google/callback
```

**Option B - Kill Process on Port 3001:**

```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

#### Issue 2: Redirect URI Mismatch

**Symptom:**

```
Error 400: redirect_uri_mismatch

The redirect URI in the request: http://localhost:3001/oauth/google/callback
does not match the ones authorized for the OAuth client.
```

**Cause:** The redirect URI in your code doesn't match what's registered with the OAuth provider

**Solution:**

1. Check your `.env` file:
   ```bash
   cat .env | grep REDIRECT_URI
   ```

2. Verify it matches the OAuth provider's settings **exactly**:
   - ✅ `http://localhost:3001/oauth/google/callback`
   - ❌ `https://localhost:3001/oauth/google/callback` (http vs https)
   - ❌ `http://localhost:3001/oauth/google/` (missing callback)
   - ❌ `http://127.0.0.1:3001/oauth/google/callback` (localhost vs 127.0.0.1)

3. Update the redirect URI in your OAuth provider's settings to match

#### Issue 3: Invalid Client

**Symptom:**

```
Error 401: invalid_client

The OAuth client was not found.
```

**Cause:** Client ID or Client Secret is incorrect

**Solution:**

1. Verify credentials in `.env`:
   ```bash
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

2. Compare with values in OAuth provider dashboard

3. If they don't match, update `.env` with correct values

4. Restart OAuth Manager:
   ```
   /motus oauth stop
   /motus oauth start
   ```

#### Issue 4: Token Expired

**Symptom:**

Agent returns:
```
Error 401: Token has been expired or revoked
```

**Cause:** Access token expired and refresh failed

**Solution:**

**Step 1: Try manual refresh**

```
/motus oauth refresh google
```

**Step 2: If refresh fails, disconnect and reconnect**

```
/motus oauth disconnect google
/motus oauth start
# Click "Connect with Google" in web interface
```

#### Issue 5: Missing Scopes

**Symptom:**

```
Error 403: Insufficient permissions

The request is missing required scopes: calendar.readonly
```

**Cause:** You didn't request the necessary scope during OAuth consent

**Solution:**

1. Disconnect the service:
   ```
   /motus oauth disconnect google
   ```

2. Update `lib/oauth-registry.js` to include required scope:
   ```javascript
   scopes: [
     'https://www.googleapis.com/auth/calendar.readonly',
     'https://www.googleapis.com/auth/gmail.readonly'
   ]
   ```

3. Reconnect and reauthorize:
   ```
   /motus oauth start
   # Connect service and approve new scopes
   ```

#### Issue 6: Browser Doesn't Open

**Symptom:**

OAuth Manager starts but browser doesn't open automatically

**Solution:**

Manually open browser to:
```
http://localhost:3001
```

Or specify to not auto-open:
```
/motus oauth start --no-browser
```

#### Issue 7: Tokens Not Persisting

**Symptom:**

Tokens lost after restarting OAuth Manager

**Cause:** Token storage file permissions or corruption

**Solution:**

1. Check token storage file:
   ```bash
   ls -la ~/.motus/tokens.json
   # Or wherever tokens are stored
   ```

2. Verify file is writable:
   ```bash
   chmod 600 ~/.motus/tokens.json
   ```

3. If corrupted, delete and reconnect:
   ```bash
   rm ~/.motus/tokens.json
   /motus oauth start
   # Reconnect all services
   ```

## Environment Variables Reference

### Required Variables Per Provider

#### Google

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-secret>
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback

# Optional: Specify scopes (comma-separated)
GOOGLE_SCOPES=calendar.readonly,gmail.readonly
```

#### Twitter

```bash
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:3001/oauth/twitter/callback
TWITTER_SCOPES=tweet.read,users.read
```

#### GitHub

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3001/oauth/github/callback
GITHUB_SCOPES=repo,user
```

#### LinkedIn

```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/oauth/linkedin/callback
LINKEDIN_SCOPES=r_liteprofile,r_emailaddress
```

#### Notion

```bash
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=http://localhost:3001/oauth/notion/callback
```

### Optional Global Variables

```bash
# OAuth Manager Configuration
OAUTH_PORT=3001                              # Default port
OAUTH_TOKEN_STORAGE=~/.motus/tokens.json     # Token storage location
OAUTH_AUTO_REFRESH=true                      # Auto-refresh tokens
OAUTH_REFRESH_BUFFER=300                     # Refresh 5 min before expiry (seconds)
```

### Complete .env Example

```bash
# ============================================================================
# OAUTH MANAGER CONFIGURATION
# ============================================================================

# Google
GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback
GOOGLE_SCOPES=calendar.readonly,gmail.readonly

# Twitter
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:3001/oauth/twitter/callback

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3001/oauth/github/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/oauth/linkedin/callback

# Manager Settings
OAUTH_PORT=3001
OAUTH_AUTO_REFRESH=true
```

## Security

### Token Security

**How tokens are protected:**

1. **Encrypted at Rest**
   - Tokens stored in encrypted format
   - AES-256 encryption
   - Key derived from system-specific data

2. **Not Committed to Git**
   - `.env` file in `.gitignore`
   - Token storage file in `.gitignore`
   - Credentials never in source code

3. **Secure File Permissions**
   ```bash
   chmod 600 ~/.motus/tokens.json
   chmod 600 .env
   ```

4. **HTTP-Only Cookies**
   - Session cookies marked HTTP-only
   - Not accessible via JavaScript
   - CSRF protection enabled

5. **Local Only**
   - Server binds to `localhost` only
   - Not accessible from network
   - No external access

### Best Practices

✅ **DO:**
- Use environment variables for all credentials
- Keep `.env` file secure and never commit it
- Regularly refresh tokens
- Disconnect unused services
- Review granted scopes periodically

❌ **DON'T:**
- Commit credentials to Git
- Share `.env` file
- Use production credentials in development
- Grant more scopes than needed
- Leave tokens in plaintext

### Revoking Access

If credentials are compromised:

1. **Revoke in OAuth Provider:**
   - Go to provider's security settings
   - Revoke access for Motus app

2. **Disconnect in Motus:**
   ```
   /motus oauth disconnect google
   ```

3. **Delete Token File:**
   ```bash
   rm ~/.motus/tokens.json
   ```

4. **Generate New Credentials:**
   - Delete old OAuth client in provider
   - Create new OAuth client
   - Update `.env` with new credentials

5. **Reconnect:**
   ```
   /motus oauth start
   ```

## Next Steps

1. **[Setup Integrations](Setup-Integrations.md)** - Configure specific integrations
2. **[Creating Agents](Creating-Agents.md)** - Build agents that use OAuth
3. **[Troubleshooting](Troubleshooting.md)** - Solve integration issues

---

**Previous**: [Setup Integrations ←](Setup-Integrations.md) | **Next**: [Troubleshooting →](Troubleshooting.md)
