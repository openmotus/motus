# Setup Integrations

Complete guide to connecting external services to Motus.

## Overview

Integrations connect Motus with external services like Google Calendar, Weather APIs, and social media platforms.

**Integration Types**:
1. **API Key** - Simple key-based authentication  
2. **OAuth2** - Secure delegated access

## Quick Commands

```
/motus integrations list          # Show all integrations
/motus integrations test <name>   # Test an integration
/motus oauth start                 # Start OAuth Manager
```

## Weather API

**Type**: API Key

**Setup**:
1. Sign up at [WeatherAPI.com](https://www.weatherapi.com/)
2. Copy your API key
3. Add to environment:
```
/motus env set WEATHER_API_KEY your_key
```
4. Test: `/motus integrations test weather`

**Free Tier**: 1M calls/month

## Google (Calendar, Gmail)

**Type**: OAuth2

**Setup**:
1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API and Gmail API
3. Create OAuth credentials with redirect URI: `http://localhost:3001/oauth/google/callback`
4. Add to environment:
```
/motus env set GOOGLE_CLIENT_ID your_id
/motus env set GOOGLE_CLIENT_SECRET your_secret
```
5. Authorize:
```
/motus oauth start
```
   Click Connect on Google card

**Scopes**: Calendar (read), Gmail (read/send)

## Notion

**Type**: API Key

**Setup**:
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create new integration named Motus
3. Copy Integration Token
4. Create Daily Journal database in Notion
5. Share database with integration
6. Copy database ID from URL
7. Add to environment:
```
/motus env set NOTION_API_KEY secret_your_token
/motus env set NOTION_DATABASE_ID your_database_id
```

## Oura Ring

**Type**: API Key

**Setup**:
1. Go to [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Create Personal Access Token
3. Add to environment:
```
/motus env set OURA_ACCESS_TOKEN your_token
```

**Requirements**: Oura Ring + active membership

## Social Media

### Twitter
**Type**: API Key/OAuth

1. Create app at [Twitter Developer Portal](https://developer.twitter.com/)
2. Get Bearer Token
3. Add: `/motus env set TWITTER_BEARER_TOKEN your_token`

### LinkedIn  
**Type**: OAuth2

1. Create app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Add redirect URI: `http://localhost:3001/oauth/linkedin/callback`
3. Add credentials to .env
4. Authorize via `/motus oauth start`

### Facebook
**Type**: OAuth2

1. Create app at [Meta for Developers](https://developers.facebook.com/)
2. Add Facebook Login product
3. Configure OAuth redirect
4. Authorize via OAuth Manager

## Managing Integrations

### List Integrations
```
/motus integrations list
```

### Test Integration
```
/motus integrations test <name>
```

### Refresh OAuth Token
```
/motus integrations refresh <name>
```

### Disconnect
```
/motus integrations disconnect <name>
```

### View Details
```
/motus integrations info <name>
```

## Troubleshooting

**API Key Not Working**:
1. Check .env file
2. Verify no extra spaces
3. Ensure key is active
4. Test: `/motus integrations test <name>`

**OAuth Fails**:
1. Check OAuth Manager: `/motus oauth status`
2. Verify redirect URI matches exactly
3. Clear browser cookies and retry

**Token Expired**:
```
/motus integrations refresh <name>
```

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
