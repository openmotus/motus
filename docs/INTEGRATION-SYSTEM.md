# Integration Documentation & OAuth Management System

**Date:** 2025-10-08
**Status:** ✅ IMPLEMENTED

## Overview

We've created a comprehensive system that automatically:
1. Generates detailed integration setup instructions in department documentation
2. Registers OAuth2 integrations with the OAuth Manager when departments are created
3. Provides clear, step-by-step guidance for both OAuth2 and API key integrations

## What Was Improved

### 1. Department Documentation (✅ Complete)

**Before:**
```markdown
### Twitter API
- **Type**: api-key
- **Environment Variables**: `TWITTER_API_KEY`, `TWITTER_API_SECRET`
- **Setup**: Get API credentials from developer.twitter.com
```

**After:**
```markdown
### Twitter API

**Type:** API Key

#### Setup Instructions

1. **Get your API key**
   - Get API credentials from developer.twitter.com

2. **Add to .env file**
   ```bash
   TWITTER_API_KEY=your_api_key_here
   TWITTER_API_SECRET=your_api_key_here
   ```

3. **Verify the API key works**
   ```bash
   # Test that the environment variable is set
   echo $TWITTER_API_KEY
   ```

**Required Environment Variables:**
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/slashmotus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.TWITTER_API_KEY)"`
```

### 2. OAuth2 Integration Instructions (✅ Complete)

OAuth2 integrations now include:
- Quick setup guide linking to OAuth Manager
- Manual setup instructions for advanced users
- Environment variable setup
- Troubleshooting tips
- Verification steps

**Example (Google Analytics):**
```markdown
### Google Analytics

**Type:** OAuth 2.0 (Automatic Authorization)

#### Quick Setup (Recommended)

1. **Start the OAuth Manager**
   ```bash
   ./start-oauth-manager.sh
   ```

2. **Open in your browser:** http://localhost:3001

3. **Click "Connect"** on the Google Analytics card

4. **Authorize the application** when redirected

5. **Verify connection** by clicking "Test" button

#### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Get OAuth Credentials**
   - Configure via Google Cloud Console
   - You'll need a Client ID and Client Secret

2. **Add to .env file**
   ```bash
   GOOGLE_ANALYTICS_CLIENT_ID=your_client_id_here
   GOOGLE_ANALYTICS_CLIENT_SECRET=your_client_secret_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize
```

### 3. Automatic OAuth Registration (🚧 In Progress)

**Created:** `lib/oauth-registry.js` - OAuth Registry Manager

**Purpose:** Automatically register OAuth2 integrations with the OAuth Manager when departments are created.

**How It Works:**
1. When `RegistryManager.addDepartment()` is called, it:
   - Identifies OAuth2 integrations in the department config
   - Maps them to standard OAuth configurations (Facebook, LinkedIn, Google Analytics, etc.)
   - Automatically adds them to `oauth-manager/server.js`
   - Generates initialization functions
   - Creates connect/callback handlers

**Standard Configurations Available:**
- Facebook API
- LinkedIn API
- Google Analytics
- Slack
- Notion

**Status:**
✅ Core functionality implemented
⚠️  Has syntax issue with hyphenated IDs that needs fixing
📝 Needs testing before production use

## Files Modified

### 1. `lib/doc-generator.js`
- Added `generateIntegrationDocs()` method
- Creates detailed setup instructions for each integration type
- Differentiates between OAuth2 and API key integrations
- Includes troubleshooting sections

### 2. `lib/oauth-registry.js` (NEW)
- Manages OAuth configurations in OAuth Manager
- Programmatically modifies `oauth-manager/server.js`
- Provides standard configs for common services
- Generates init functions, connect handlers, callback handlers

### 3. `lib/registry-manager.js`
- Added `_registerOAuthIntegrations()` method
- Automatically called when creating departments
- Integrates with OAuthRegistry to register OAuth2 services

### 4. `marketing/agents/trend-analyzer.js`
- Fixed syntax error (line 31-32)
- Changed `response.data.[0]` to `response.data[0]`

## Current State

### ✅ Working Now
1. **Detailed Integration Documentation** - All department docs now have comprehensive integration instructions
2. **API Key Setup Guides** - Clear step-by-step for Twitter, Buffer, etc.
3. **OAuth2 Setup Guides** - Instructions point users to OAuth Manager
4. **Troubleshooting Sections** - Common issues and solutions documented

### 🚧 Needs Work
1. **Automatic OAuth Registration** - Has syntax issue with hyphenated service IDs
   - Issue: `google-analytics` creates invalid JavaScript syntax
   - Fix needed: Use bracket notation for hyphenated IDs
   - Alternative: Convert to camelCase (googleAnalytics) or underscore (google_analytics)

2. **OAuth Manager UI** - Buttons don't exist yet for new services
   - Facebook API
   - LinkedIn API
   - Google Analytics
   - Need to manually register these or fix automatic registration

## Usage

### Regenerating Documentation

To regenerate department documentation with the new detailed instructions:

```bash
node lib/doc-generator.js
```

This will update all department docs in `org-docs/departments/` with:
- Detailed integration instructions
- Setup verification commands
- Troubleshooting tips

### Viewing Improved Documentation

```bash
# View marketing department integration docs
cat org-docs/departments/marketing-department.md | grep -A 50 "## Integrations"
```

### Manual OAuth Registration (Until Automatic System is Fixed)

For now, OAuth2 integrations must be manually added to `oauth-manager/server.js`:

1. Add to `OAUTH_CONFIGS` object:
```javascript
facebook: {
  name: 'Facebook API',
  icon: '📘',
  scopes: ['email', 'public_profile'],
  authorizationBaseUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
  requiredEnvVars: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
  tokenFile: path.join(process.env.HOME, '.motus', 'facebook-token.json')
}
```

2. Add init function
3. Add connect handler
4. Add callback handler

## Next Steps

### Priority 1: Fix OAuth Registry
- [ ] Fix hyphenated ID syntax issue
- [ ] Use bracket notation or convert to valid JS identifiers
- [ ] Test with marketing department OAuth integrations
- [ ] Verify OAuth Manager shows new service cards

### Priority 2: Complete OAuth Integration
- [ ] Manually register Facebook, LinkedIn, Google Analytics
- [ ] Test OAuth flow for each service
- [ ] Verify tokens are saved correctly
- [ ] Test API calls with tokens

### Priority 3: Documentation
- [ ] Update CLAUDE.md with integration system info
- [ ] Create user guide for OAuth Manager
- [ ] Document standard OAuth configurations

## Benefits

### For Users
- ✅ Clear, step-by-step integration instructions
- ✅ Easy OAuth setup via OAuth Manager UI
- ✅ Troubleshooting help built into docs
- ✅ No need to hunt for setup instructions

### For Developers
- ✅ Automatic documentation generation
- ✅ Consistent integration format
- 🚧 Automatic OAuth registration (needs fix)
- ✅ Standard configs for common services

### For System
- ✅ Better integration discoverability
- ✅ Reduced setup errors
- ✅ Centralized OAuth management
- ✅ Validation and verification built in

## Testing

To test the documentation improvements:

```bash
# 1. Regenerate docs
node lib/doc-generator.js

# 2. View marketing department integrations
less org-docs/departments/marketing-department.md

# 3. Check for detailed instructions
grep -A 20 "### Twitter API" org-docs/departments/marketing-department.md
grep -A 30 "### Google Analytics" org-docs/departments/marketing-department.md
```

## Rollback

If issues arise, you can revert to basic integrations:

```bash
git checkout lib/doc-generator.js
node lib/doc-generator.js
```

## Related Documentation

- `docs/REGISTRY-FILE-SYNC-FIX.md` - Agent file generation fix
- `docs/STANDARDIZED-CREATION-SYSTEM-PLAN.md` - Overall system plan
- `CLAUDE.md` - Project instructions and architecture
