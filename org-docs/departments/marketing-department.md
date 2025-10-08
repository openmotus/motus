# Marketing Department

Social media marketing, content creation, campaign analytics, and brand management

**Created**: 10/8/2025
**Status**: active
**Version**: 1.0.0

## Overview

- **Total Agents**: 9
- **Total Workflows**: 4
- **Integrations**: 5

## Responsibilities

### Social Media Management

- Monitor trending topics across platforms
- Analyze social sentiment and engagement
- Schedule and post content
- Track social media metrics

### Content Creation

- Generate AI-powered content ideas
- Create and review marketing copy
- Manage content calendar
- Optimize content for SEO

### Campaign Analytics

- Track campaign performance
- Analyze ROI and conversion rates
- Generate marketing reports
- Provide actionable insights

## Agents (9)

### Orchestrator (2)

#### Marketing Admin
- **Name**: `marketing-admin`
- **Description**: Primary Marketing Department orchestrator for campaigns, content, and analytics
- **Tools**: Task, Read, Write, Edit, WebFetch, WebSearch, Bash, TodoWrite

#### Marketing Orchestrator
- **Name**: `marketing-orchestrator`
- **Description**: Workflow coordinator for marketing operations - manages parallel execution of campaigns and content workflows
- **Tools**: Task, Read, Write

### Data Fetcher (3)

#### Trend Analyzer
- **Name**: `trend-analyzer`
- **Description**: Fetches trending topics from Twitter API and analyzes social media trends
- **Tools**: Bash, Read
- **Used in workflows**: daily-trends

#### Analytics Fetcher
- **Name**: `analytics-fetcher`
- **Description**: Retrieves Google Analytics data including traffic, conversions, and user behavior
- **Tools**: Bash, Read
- **Used in workflows**: campaign-analytics

#### Social Fetcher
- **Name**: `social-fetcher`
- **Description**: Retrieves social media metrics from Twitter, Facebook, and LinkedIn APIs
- **Tools**: Bash, Read
- **Used in workflows**: daily-trends, campaign-analytics, social-report

### Specialist (4)

#### Sentiment Analyzer
- **Name**: `sentiment-analyzer`
- **Description**: Analyzes sentiment of social media mentions, comments, and brand perception
- **Tools**: Read, Write, Task
- **Used in workflows**: daily-trends, content-pipeline, social-report

#### Content Creator
- **Name**: `content-creator`
- **Description**: AI-powered content generation for social media posts, blog articles, and marketing copy
- **Tools**: Read, Write, WebFetch, Task
- **Used in workflows**: content-pipeline

#### Campaign Analyzer
- **Name**: `campaign-analyzer`
- **Description**: Analyzes marketing campaign performance, ROI, and conversion metrics
- **Tools**: Read, Write, Task
- **Used in workflows**: campaign-analytics

#### Report Creator
- **Name**: `report-creator`
- **Description**: Creates formatted marketing reports with charts, insights, and recommendations
- **Tools**: Read, Write, Task
- **Used in workflows**: daily-trends, campaign-analytics, social-report

## Workflows (4)

### Daily Trends Analysis

Analyze daily trending topics and social media sentiment

- **Trigger**: scheduled (daily 9:00)
- **Agents**: 4
- **Estimated Duration**: 15 seconds
- **Output**: file → data/marketing/daily-trends-{{date}}.md

**Agents:** trend-analyzer, social-fetcher, sentiment-analyzer, report-creator

**Run this workflow:**
```bash
/motus marketing daily-trends
```

### Content Pipeline

Content creation, review, and scheduling workflow

- **Trigger**: manual
- **Agents**: 2
- **Estimated Duration**: 20 seconds
- **Output**: file → data/marketing/content-{{date}}.md

**Agents:** content-creator, sentiment-analyzer

**Run this workflow:**
```bash
/motus marketing content-pipeline
```

### Campaign Analytics

Weekly campaign performance analysis and reporting

- **Trigger**: scheduled (weekly monday 10:00)
- **Agents**: 4
- **Estimated Duration**: 25 seconds
- **Output**: file → data/marketing/campaign-report-{{date}}.md

**Agents:** analytics-fetcher, social-fetcher, campaign-analyzer, report-creator

**Run this workflow:**
```bash
/motus marketing campaign-analytics
```

### Social Media Report

Generate comprehensive social media performance report

- **Trigger**: manual
- **Agents**: 3
- **Estimated Duration**: 18 seconds
- **Output**: file → data/marketing/social-report-{{date}}.md

**Agents:** social-fetcher, sentiment-analyzer, report-creator

**Run this workflow:**
```bash
/motus marketing social-report
```

## Integrations

This department requires the following integrations to function properly:

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
   GOOGLE_ANALYTICS_CLIENT_ID=your_google_analytics_client_id_here
   GOOGLE_ANALYTICS_CLIENT_SECRET=your_google_analytics_client_secret_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize

**Required Environment Variables:**
- `GOOGLE_ANALYTICS_CLIENT_ID`
- `GOOGLE_ANALYTICS_CLIENT_SECRET`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/slashmotus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.GOOGLE_ANALYTICS_CLIENT_ID)"`
- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager
- Check token file exists: `~/.motus/google-analytics-token.json`

### Facebook API

**Type:** OAuth 2.0 (Automatic Authorization)

#### Quick Setup (Recommended)

1. **Start the OAuth Manager**
   ```bash
   ./start-oauth-manager.sh
   ```

2. **Open in your browser:** http://localhost:3001

3. **Click "Connect"** on the Facebook API card

4. **Authorize the application** when redirected

5. **Verify connection** by clicking "Test" button

#### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Get OAuth Credentials**
   - Create app at developers.facebook.com
   - You'll need a Client ID and Client Secret

2. **Add to .env file**
   ```bash
   FACEBOOK_CLIENT_ID=your_facebook_client_id_here
   FACEBOOK_CLIENT_SECRET=your_facebook_client_secret_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize

**Required Environment Variables:**
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/slashmotus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.FACEBOOK_CLIENT_ID)"`
- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager
- Check token file exists: `~/.motus/facebook-api-token.json`

### LinkedIn API

**Type:** OAuth 2.0 (Automatic Authorization)

#### Quick Setup (Recommended)

1. **Start the OAuth Manager**
   ```bash
   ./start-oauth-manager.sh
   ```

2. **Open in your browser:** http://localhost:3001

3. **Click "Connect"** on the LinkedIn API card

4. **Authorize the application** when redirected

5. **Verify connection** by clicking "Test" button

#### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Get OAuth Credentials**
   - Configure at linkedin.com/developers
   - You'll need a Client ID and Client Secret

2. **Add to .env file**
   ```bash
   LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize

**Required Environment Variables:**
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/slashmotus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.LINKEDIN_CLIENT_ID)"`
- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager
- Check token file exists: `~/.motus/linkedin-api-token.json`

### Buffer

**Type:** API Key

#### Setup Instructions

1. **Get your API key**
   - Get API key from buffer.com/developers

2. **Add to .env file**
   ```bash
   BUFFER_API_KEY=your_api_key_here
   ```

3. **Verify the API key works**
   ```bash
   # Test that the environment variable is set
   echo $BUFFER_API_KEY
   ```

**Required Environment Variables:**
- `BUFFER_API_KEY`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/slashmotus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.BUFFER_API_KEY)"`

### Setup Verification

After configuring integrations, verify they work:

```bash
# Test all integrations for this department
/motus marketing test-integrations

# Or test specific workflows that use integrations
/motus marketing content-pipeline
```

---

*This document is auto-generated from `config/registries/`. Do not edit manually.*
*Last updated: 2025-10-08T05:39:47.443Z*
