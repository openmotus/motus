# Setup Integrations

Complete guide to connecting external services to Motus.

## Overview

Integrations connect Motus with external services like Google Calendar, Weather APIs, and social media platforms.

**Integration Types**:
1. **API Key** - Simple key-based authentication
2. **OAuth2** - Secure delegated access via OAuth Manager

## Weather API

**Type**: API Key

**Setup**:
1. Sign up at [WeatherAPI.com](https://www.weatherapi.com/)
2. Copy your API key from the dashboard
3. Add to your `.env` file:
```bash
WEATHER_API_KEY=your_key_here
```

**Free Tier**: 1M calls/month

## Google (Calendar, Gmail)

**Type**: OAuth2

**Setup**:
1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API and Gmail API
3. Create OAuth credentials with redirect URI: `http://localhost:3001/oauth/google/callback`
4. Add to your `.env` file:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback
```
5. Start OAuth Manager and authorize:
```bash
./start-oauth-manager.sh
```
   Then open `http://localhost:3001` and click Connect on the Google card.

**Scopes**: Calendar (read), Gmail (read/send)

## Notion

**Type**: API Key

**Setup**:
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create new integration named "Motus"
3. Copy Integration Token
4. Create Daily Journal database in Notion
5. Share database with your integration
6. Copy database ID from URL (the part after the workspace name and before `?`)
7. Add to your `.env` file:
```bash
NOTION_API_KEY=secret_your_token
NOTION_DATABASE_ID=your_database_id
```

## Oura Ring

**Type**: API Key

**Setup**:
1. Go to [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Create Personal Access Token
3. Add to your `.env` file:
```bash
OURA_ACCESS_TOKEN=your_token
```

**Requirements**: Oura Ring + active membership

## Social Media

### Twitter
**Type**: API Key/OAuth

1. Create app at [Twitter Developer Portal](https://developer.twitter.com/)
2. Get Bearer Token
3. Add to your `.env` file:
```bash
TWITTER_BEARER_TOKEN=your_token
```

### LinkedIn
**Type**: OAuth2

1. Create app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Add redirect URI: `http://localhost:3001/oauth/linkedin/callback`
3. Add credentials to `.env`
4. Authorize via OAuth Manager at `http://localhost:3001`

### Facebook
**Type**: OAuth2

1. Create app at [Meta for Developers](https://developers.facebook.com/)
2. Add Facebook Login product
3. Configure OAuth redirect URI
4. Authorize via OAuth Manager

## Managing Integrations

### View Integration Status

Check which integrations are configured by reviewing your `.env` file or visiting the OAuth Manager at `http://localhost:3001` for OAuth-based integrations.

### Test an Integration

Test your integration by running a simple agent that uses it. For example, test weather:
```
/motus life weather
```

Or create a test agent to verify API connectivity.

### Refresh OAuth Token

OAuth tokens automatically refresh when they expire. If you encounter authentication errors, disconnect and reconnect through the OAuth Manager web interface.

## Troubleshooting

**API Key Not Working**:
1. Check `.env` file for typos
2. Verify no extra spaces around the `=` sign
3. Ensure key is active at the provider
4. Try a simple API test with curl

**OAuth Fails**:
1. Check OAuth Manager is running at `http://localhost:3001`
2. Verify redirect URI matches **exactly** in provider settings
3. Clear browser cookies and retry

**Token Expired**:
Disconnect and reconnect through the OAuth Manager web interface at `http://localhost:3001`.

## Security Best Practices

- Never commit .env to Git (already in .gitignore)
- Use least-privilege permissions
- Rotate credentials regularly
- Monitor API usage

## Next Steps

1. **[OAuth Manager](OAuth-Manager.md)** - OAuth details
2. **[Creating Departments](Creating-Departments.md)** - Use integrations
3. **[Troubleshooting](Troubleshooting.md)** - Common issues

---

**Previous**: [Setup Environment ←](Setup-Environment.md) | **Next**: [OAuth Manager →](OAuth-Manager.md)
