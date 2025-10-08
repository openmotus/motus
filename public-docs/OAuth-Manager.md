# OAuth Manager

Guide to the OAuth Manager server for managing OAuth2 integrations.

## Overview

The OAuth Manager is a local web server at http://localhost:3001 that handles OAuth2 authorization for services like Google, LinkedIn, and Facebook.

## Quick Start

### Start OAuth Manager

```
/motus oauth start
```

Server runs at http://localhost:3001 and opens in browser.

### Stop OAuth Manager

```
/motus oauth stop
```

### Check Status

```
/motus oauth status
```

Shows connected integrations and token status.

## Using OAuth Manager

### Web Interface

When started, OAuth Manager shows:
- Cards for each OAuth integration
- Connection status
- "Connect" buttons
- Token expiration times

### Connecting a Service

1. Start OAuth Manager: `/motus oauth start`
2. Click "Connect" on desired service card
3. Sign in and authorize permissions
4. Redirected back automatically
5. Integration ready to use!

### Example: Google

1. `/motus oauth start`
2. Click "Connect" on Google card
3. Sign in to Google
4. Allow Calendar and Gmail access
5. Done - Google connected!

## Available Integrations

- **Google**: Calendar, Gmail
- **LinkedIn**: Profile, Posts
- **Facebook**: Page analytics, Posts
- **Twitter**: Tweets, Trends

## Managing Tokens

### View Tokens

```
/motus oauth tokens
```

### Refresh Token

```
/motus integrations refresh <service>
```

### Disconnect

```
/motus integrations disconnect <service>
```

## Automatic Token Refresh

Tokens automatically refresh when they expire. No manual action needed!

## Troubleshooting

### Port in Use

If port 3001 is busy:
```
/motus oauth start --port 3002
```

Update redirect URIs to new port!

### Authorization Fails

1. Check redirect URI matches: `http://localhost:3001/oauth/<service>/callback`
2. Verify Client ID and Secret in .env
3. Clear browser cookies
4. Try again

### Token Expired

```
/motus integrations refresh <service>
```

If still fails, disconnect and reconnect.

## Security

- Tokens encrypted at rest
- Not committed to Git
- Secure file permissions
- HTTP-only cookies

## Next Steps

1. **[Setup Integrations](Setup-Integrations.md)** - Connect services
2. **[Troubleshooting](Troubleshooting.md)** - Solve issues

---

**Previous**: [Setup Integrations ←](Setup-Integrations.md) | **Next**: [Troubleshooting →](Troubleshooting.md)
