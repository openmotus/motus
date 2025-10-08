# Setup Environment

Configure your Motus environment with API keys, paths, and settings for all integrations.

## Overview

Motus uses environment variables to store sensitive configuration like API keys, OAuth credentials, and file paths. All configuration is stored in a `.env` file at the project root.

### Why Use .env?

- **Security**: Keep secrets out of source control
- **Flexibility**: Change settings without modifying code
- **Portability**: Easy to share configuration template
- **Privacy**: Never commit `.env` to Git (it's in `.gitignore`)

## Quick Setup

### Step 1: Create .env File

In Claude Code, create your environment file:

```
/motus init env
```

This creates a `.env` file with all available configuration options.

**Alternative**: Copy the example file:

```bash
# Only use bash for initial file copy
cp .env.example .env
```

### Step 2: Configure Required Settings

Open the `.env` file in Claude Code and configure:

```
Tell Claude Code to open .env file for editing
```

### Step 3: Verify Configuration

Check your environment setup:

```
/motus env check
```

This validates all required variables are set.

## Environment Variables

### Core Settings

#### PROJECT_NAME
```
PROJECT_NAME=Motus
```
Your organization's name (optional).

#### TIMEZONE
```
TIMEZONE=America/Los_Angeles
```
Your local timezone for scheduling.

**Common Timezones**:
- `America/New_York` - US Eastern
- `America/Chicago` - US Central
- `America/Los_Angeles` - US Pacific
- `Europe/London` - UK
- `Asia/Bangkok` - Thailand
- `Australia/Sydney` - Australia

**Find Your Timezone**: [Full list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### File Paths

#### OBSIDIAN_VAULT_PATH
```
OBSIDIAN_VAULT_PATH=/Users/username/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyVault
```
Absolute path to your Obsidian vault.

**Finding Your Vault Path**:
1. Open Obsidian
2. Settings → Files & Links
3. Copy vault path
4. Paste into .env file

**Common Locations**:
- **macOS**: `/Users/username/Documents/ObsidianVault`
- **macOS iCloud**: `/Users/username/Library/Mobile Documents/iCloud~md~obsidian/Documents/VaultName`
- **Linux**: `/home/username/Documents/ObsidianVault`
- **Windows/WSL**: `/mnt/c/Users/username/Documents/ObsidianVault`

#### DATA_DIR
```
DATA_DIR=/Users/username/slashmotus/data
```
Where to store local data files.

**Default**: `./data` (relative to project root)

### Weather Integration

#### WEATHER_API_KEY
```
WEATHER_API_KEY=your_weatherapi_key_here
```

**How to Get**:
1. Visit [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for free account
3. Copy your API key from dashboard
4. Paste into .env file

**Free Tier**: 1,000,000 calls/month

### Google Integration

#### Google OAuth Credentials

```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback
```

**How to Get**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/oauth/google/callback`
6. Copy Client ID and Client Secret
7. Paste into .env file

**Detailed Guide**: See [Setup Integrations](Setup-Integrations.md#google)

### Notion Integration

#### Notion API Configuration

```
NOTION_API_KEY=secret_your_notion_integration_key
NOTION_DATABASE_ID=your_database_id_here
```

**How to Get**:
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "Motus"
4. Copy Internal Integration Token
5. Paste as `NOTION_API_KEY` in .env
6. Create a database in Notion for daily briefings
7. Share database with your integration
8. Copy database ID from URL
9. Paste as `NOTION_DATABASE_ID` in .env

**Database ID Location**: In the URL after `/` and before `?`
```
https://www.notion.so/workspace/DATABASE_ID_HERE?v=...
```

**Detailed Guide**: See [Setup Integrations](Setup-Integrations.md#notion)

### Oura Ring Integration

#### Oura API Configuration

```
OURA_ACCESS_TOKEN=your_oura_access_token
```

**How to Get**:
1. Visit [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Generate new Personal Access Token
3. Copy token
4. Paste into .env file

**Note**: Requires Oura Ring subscription

**Detailed Guide**: See [Setup Integrations](Setup-Integrations.md#oura)

### Social Media Integrations

#### Twitter API v2

```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

**How to Get**:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create app or use existing
3. Generate API keys and tokens
4. Copy all credentials
5. Paste into .env file

**Required Access**: Elevated access for full API

#### LinkedIn API

```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/oauth/linkedin/callback
```

**How to Get**:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create new app
3. Add redirect URL: `http://localhost:3001/oauth/linkedin/callback`
4. Copy Client ID and Client Secret
5. Paste into .env file

#### Facebook/Meta Graph API

```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/oauth/facebook/callback
```

**How to Get**:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create app
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:3001/oauth/facebook/callback`
5. Copy App ID and App Secret
6. Paste into .env file

### Buffer Integration

```
BUFFER_ACCESS_TOKEN=your_buffer_token
```

**How to Get**:
1. Go to [Buffer Developers](https://buffer.com/developers/apps)
2. Create app
3. Generate access token
4. Copy token
5. Paste into .env file

### AI Services

#### OpenAI API (Optional)

```
OPENAI_API_KEY=sk-your_openai_key
```

**How to Get**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account or sign in
3. Navigate to API Keys
4. Create new secret key
5. Copy key
6. Paste into .env file

**Note**: Optional - used for specific AI features beyond Claude

### Complete .env Example

Here's a complete example with all possible variables:

```bash
# Core Settings
PROJECT_NAME=Motus
TIMEZONE=America/Los_Angeles

# File Paths
OBSIDIAN_VAULT_PATH=/Users/username/Documents/ObsidianVault
DATA_DIR=./data

# Weather
WEATHER_API_KEY=your_weatherapi_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback

# Notion
NOTION_API_KEY=secret_your_notion_key
NOTION_DATABASE_ID=your_database_id

# Oura Ring
OURA_ACCESS_TOKEN=your_oura_token

# Twitter
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/oauth/linkedin/callback

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/oauth/facebook/callback

# Buffer
BUFFER_ACCESS_TOKEN=your_buffer_token

# OpenAI (Optional)
OPENAI_API_KEY=sk-your_openai_key
```

## Configuration by Department

Different departments require different integrations:

### Life Department

**Required**:
- `TIMEZONE` - For scheduling
- `OBSIDIAN_VAULT_PATH` - For daily notes

**Optional**:
- `WEATHER_API_KEY` - For weather in briefings
- `GOOGLE_CLIENT_ID/SECRET` - For calendar and Gmail
- `NOTION_API_KEY/DATABASE_ID` - For Notion briefings
- `OURA_ACCESS_TOKEN` - For health tracking

### Marketing Department

**Required**:
- `TIMEZONE` - For scheduling

**Optional**:
- `TWITTER_*` - For Twitter analytics
- `LINKEDIN_*` - For LinkedIn analytics
- `FACEBOOK_*` - For Facebook analytics
- `BUFFER_ACCESS_TOKEN` - For social posting

### Finance Department

**Required**:
- `TIMEZONE` - For scheduling
- `OBSIDIAN_VAULT_PATH` or `NOTION_*` - For reports

**Optional**:
- (Finance APIs as needed)

## Managing Environment Variables

### View Current Configuration

Check which variables are set:

```
/motus env list
```

Shows all environment variables (with secrets masked).

### Update a Variable

Change a specific variable:

```
/motus env set WEATHER_API_KEY new_key_value
```

### Remove a Variable

Delete a variable:

```
/motus env unset TWITTER_API_KEY
```

### Validate Configuration

Check if all required variables for a department are set:

```
/motus env validate <department>
```

Example:
```
/motus env validate life
```

Output:
```
✅ Life Department Configuration:

Required (2/2):
  ✅ TIMEZONE
  ✅ OBSIDIAN_VAULT_PATH

Optional (3/5):
  ✅ WEATHER_API_KEY
  ✅ GOOGLE_CLIENT_ID
  ✅ GOOGLE_CLIENT_SECRET
  ❌ NOTION_API_KEY (not set)
  ❌ OURA_ACCESS_TOKEN (not set)
```

## Security Best Practices

### ✅ Do

- **Keep .env private** - Never commit to Git
- **Use strong tokens** - Generate secure random values
- **Rotate keys regularly** - Change tokens periodically
- **Limit permissions** - Use least-privilege access
- **Back up safely** - Store backup securely (not in Git)

### ❌ Don't

- **Commit .env to Git** - It's in `.gitignore` for a reason
- **Share credentials** - Each user should have their own
- **Use production keys in development** - Separate environments
- **Store in plain text files** - Use .env only
- **Hardcode in source** - Always use environment variables

## Troubleshooting

### Variable Not Found

**Issue**: Error "WEATHER_API_KEY is not defined"

**Solution**:
1. Check `.env` file exists in project root
2. Verify variable name spelling
3. Restart Claude Code session
4. Run `/motus env check` to verify

### Invalid Path

**Issue**: "OBSIDIAN_VAULT_PATH does not exist"

**Solution**:
1. Verify path is absolute (starts with `/`)
2. Check path exists:
```
/motus env test-path OBSIDIAN_VAULT_PATH
```
3. Use correct path for your OS (macOS, Linux, Windows)

### OAuth Not Working

**Issue**: OAuth redirect fails

**Solution**:
1. Verify redirect URI matches exactly
2. Check OAuth Manager is running:
```
/motus oauth status
```
3. Restart OAuth Manager:
```
/motus oauth restart
```

### API Key Invalid

**Issue**: API returns "unauthorized" or "forbidden"

**Solution**:
1. Verify API key is correct
2. Check API has required permissions
3. Test API key directly:
```
/motus env test-key WEATHER_API_KEY
```
4. Regenerate key if needed

## Environment Templates

### Minimal Setup (Life Only)

```bash
# Minimal Life Department Setup
TIMEZONE=America/Los_Angeles
OBSIDIAN_VAULT_PATH=/Users/username/Documents/ObsidianVault
WEATHER_API_KEY=your_weatherapi_key
```

### Full Life + Marketing

```bash
# Full Setup with Life + Marketing
TIMEZONE=America/Los_Angeles
OBSIDIAN_VAULT_PATH=/Users/username/Documents/ObsidianVault

# Weather
WEATHER_API_KEY=your_weatherapi_key

# Google
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback

# Notion
NOTION_API_KEY=secret_your_notion_key
NOTION_DATABASE_ID=your_database_id

# Twitter
TWITTER_BEARER_TOKEN=your_bearer_token
```

## Next Steps

After setting up your environment:

1. **[Setup Integrations](Setup-Integrations.md)** - Configure each service
2. **[Creating Departments](Creating-Departments.md)** - Build your first department
3. **[OAuth Manager](OAuth-Manager.md)** - Setup OAuth connections

---

**Previous**: [Installation ←](Installation.md) | **Next**: [Setup Integrations →](Setup-Integrations.md)
