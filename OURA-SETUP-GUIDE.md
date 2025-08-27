# Oura Ring OAuth Setup Guide

## Step 1: Register Your OAuth Application with Oura

1. **Go to Oura Cloud**:
   - Visit https://cloud.ouraring.com/
   - Log in with your Oura account

2. **Access Developer Section**:
   - Go to https://cloud.ouraring.com/oauth/developer
   - Or navigate to the Developer section from your account

3. **Create New Application**:
   - Click on "My Applications"
   - Click "New Application"
   - Fill in the following details:
     - **Application Name**: Motus Life Admin
     - **Application Description**: Personal life automation and tracking system
     - **Website URL**: http://localhost:3001
     - **Redirect URI**: http://localhost:3001/callback/oura
     - **Webhook URL**: (leave empty for now)

4. **Save Your Credentials**:
   - After creating, you'll receive:
     - **Client ID**: Copy this
     - **Client Secret**: Copy this (shown only once!)

## Step 2: Update Your .env File

Replace the placeholder values in your `.env` file:

```bash
# Oura Ring Integration
OURA_CLIENT_ID=<YOUR_ACTUAL_CLIENT_ID>
OURA_CLIENT_SECRET=<YOUR_ACTUAL_CLIENT_SECRET>
```

## Step 3: Restart OAuth Manager

1. Stop the current OAuth Manager (Ctrl+C in terminal)
2. Restart it:
   ```bash
   ./start-oauth-manager.sh
   ```

## Step 4: Connect Your Oura Ring

1. Open http://localhost:3001 in your browser
2. Click "Connect" next to Oura Ring
3. Authorize the application
4. You should be redirected back with a success message

## Important Notes

- **Redirect URI Must Match**: The redirect URI in your Oura app settings MUST be exactly:
  ```
  http://localhost:3001/callback/oura
  ```

- **10 User Limit**: Initially, your app is limited to 10 users (including yourself)
- **Oura Membership Required**: Gen3 ring users need an active Oura membership for API access

## Troubleshooting

### If you get 403 Access Denied:
- Verify the redirect URI matches exactly
- Check that your Client ID and Secret are correct
- Ensure you have an active Oura membership (for Gen3 rings)

### If token exchange fails:
- Make sure the Client Secret is correct (no extra spaces)
- Verify the OAuth Manager is running on port 3001

## Alternative: Personal Access Token (Simpler for Single User)

If you only need access for yourself, you can use a Personal Access Token instead:

1. Go to https://cloud.ouraring.com/personal-access-tokens
2. Create a new token
3. Copy the token (shown only once!)
4. We can update the scripts to use this token directly

Let me know if you'd prefer to use the Personal Access Token approach instead!