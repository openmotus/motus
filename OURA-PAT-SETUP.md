# Quick Fix: Use Oura Personal Access Token

Since the OAuth app is having issues, let's use the Personal Access Token approach which is actually better for personal use.

## Step 1: Get Your Personal Access Token

1. Go to: https://cloud.ouraring.com/personal-access-tokens
2. Log in if needed
3. Click "Create New Personal Access Token"
4. Name it: "Motus Integration"
5. **COPY THE TOKEN** (shown only once!)

## Step 2: Add to .env file

Add this line to your .env file:
```
OURA_PERSONAL_ACCESS_TOKEN=<paste-your-token-here>
```

## Step 3: Test It Works

Run this command:
```bash
node /Users/ianwinscom/motus/life-admin/oura-fetcher-pat.js sleep
```

You should see your sleep data!

## Step 4: Update the Agent to Use PAT

Once you confirm it works, I'll update the oura-sleep-fetcher agent to use the PAT version instead of OAuth.

## Why Personal Access Token is Better for You:

1. **No OAuth hassles** - Works immediately
2. **No redirect URI issues** - Direct API access
3. **Same data access** - Gets all your Oura data
4. **More reliable** - No token refresh needed
5. **Perfect for personal use** - Since it's just for you

The OAuth approach is only needed if you want OTHER users to connect their Oura rings to your app. For your personal automation, PAT is the way to go!