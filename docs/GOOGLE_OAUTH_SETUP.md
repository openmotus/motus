# 🔐 Google OAuth Setup Guide

## Quick Setup Steps

### Step 1: Authorize Your Google Account

Click this link (or copy to your browser):
```
https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.metadata&prompt=consent&response_type=code&client_id=580582062962-g3bb67qrbtsmtbr21ui1eni14v8uq3n5.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2callback
```

### Step 2: Start the Callback Server

In a terminal, run:
```bash
cd /Users/ianwinscom/motus
node life-admin/setup-google-oauth.js
```

### Step 3: Complete Authorization

1. The browser will open to Google's authorization page
2. Select your Google account
3. Review the permissions (Calendar and Gmail read access)
4. Click "Allow"
5. You'll be redirected to localhost:3000 with a success message
6. The terminal will show "✅ Setup complete!"

### What This Enables

Once connected, your daily briefs will include:
- **Real calendar events** from your Google Calendar
- **Actual emails** from the last 24 hours
- **Meeting links** extracted from calendar events
- **Email prioritization** based on sender and content
- **Action items** extracted from emails

### Troubleshooting

If the browser doesn't open automatically:
1. Copy the URL from the terminal
2. Open it manually in your browser
3. Complete the authorization
4. Return to the terminal to see confirmation

If you see "invalid_grant" error:
- This means the token expired
- Just complete the setup process again

### Manual Token Setup (Alternative)

If the automatic process doesn't work, you can manually get a refresh token:

1. Go to: https://developers.google.com/oauthplayground/
2. Click the gear icon (⚙️) → Check "Use your own OAuth credentials"
3. Enter your Client ID and Secret from .env
4. Select these scopes:
   - Google Calendar API v3 → .../auth/calendar.readonly
   - Gmail API v1 → .../auth/gmail.readonly
5. Click "Authorize APIs"
6. Click "Exchange authorization code for tokens"
7. Copy the "Refresh token"
8. Add it to your .env file:
   ```
   GOOGLE_REFRESH_TOKEN=your_refresh_token_here
   ```

### Verify It's Working

After setup, run:
```bash
./motus daily-brief
```

You should see:
- Real calendar events (not mock data)
- Actual emails from your Gmail
- No "invalid_grant" errors

---

Ready? Start with Step 2 above!