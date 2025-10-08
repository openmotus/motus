# Notion API Setup Guide - 2025 Edition

## Overview
This guide walks through setting up Notion API access for your Motus system using the latest Notion integration features. We'll create an integration with selective database access for maximum security and organization.

---

## Step 1: Create a Notion Integration

### 1.1 Access Notion Integrations
1. Go to: https://www.notion.so/my-integrations
2. Log in with your Notion account
3. You'll see the "My Integrations" dashboard

### 1.2 Create New Integration
1. Click **"+ New Integration"** button
2. Fill in the basic information:
   - **Name**: `Motus Life Admin` (or your preferred name)
   - **Logo**: Optional (you can upload a logo)
   - **Associated Workspace**: Select your personal workspace
   - **Type**: Select "Internal Integration"

### 1.3 Configure Capabilities
Select the following capabilities:

**Content Capabilities:**
- ✅ **Read content** - To read existing pages/databases
- ✅ **Update content** - To update existing pages
- ✅ **Insert content** - To create new pages/entries

**Comment Capabilities:**
- ⬜ Read comments (optional - not needed for automation)
- ⬜ Insert comments (optional)

**User Capabilities:**
- ⬜ No user information (keep unchecked for privacy)

### 1.4 Select Specific Databases (2025 Feature)
In the new setup flow, you can now:
1. Choose **"Select specific pages and databases"** instead of full workspace access
2. Search and select only the databases you want to automate:
   - Daily Notes database
   - Tasks database
   - Projects database
   - Health Metrics database
3. This provides better security by limiting access to only what's needed

### 1.5 Save and Get Token
1. Click **"Submit"** to create the integration
2. You'll be redirected to your integration's settings page
3. Find the **"Internal Integration Token"** section
4. Click **"Show"** and then **"Copy"**
5. **SAVE THIS TOKEN SECURELY** - You'll need it for the API

**Token format**: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Prepare Your Notion Workspace

### 2.1 Create Database Structure
Create these databases in your Notion workspace:

#### A. Daily Notes Database
1. Create a new page in Notion
2. Add a **Database - Full Page**
3. Name it: `Daily Notes`
4. Add these properties:
   ```
   - Title (Title) - The date
   - Date (Date) - The actual date
   - Weather (Text) - Weather summary
   - Sleep Score (Number) - From Oura
   - Readiness Score (Number) - From Oura
   - Tasks Completed (Number) - Daily count
   - Notes (Text) - Long form notes
   - Mood (Select) - Great/Good/Okay/Poor
   - Energy Level (Number) - 1-10
   ```

#### B. Tasks Database
1. Create another database page
2. Name it: `Tasks`
3. Add properties:
   ```
   - Task (Title) - Task description
   - Priority (Select) - High/Medium/Low
   - Status (Select) - Todo/In Progress/Done
   - Due Date (Date)
   - Project (Relation) - Link to projects
   - Time Estimate (Number) - In minutes
   - Assigned Date (Date) - When it was created
   - Completed Date (Date)
   ```

#### C. Projects Database
1. Create database: `Projects`
2. Properties:
   ```
   - Project Name (Title)
   - Status (Select) - Active/On Hold/Complete
   - Start Date (Date)
   - End Date (Date)
   - Progress (Number) - Percentage
   - Notes (Text)
   - Tasks (Relation) - Link to Tasks database
   ```

#### D. Health Metrics Database
1. Create database: `Health Metrics`
2. Properties:
   ```
   - Date (Date)
   - Sleep Duration (Number) - Hours
   - Sleep Score (Number) - From Oura
   - Steps (Number)
   - Exercise (Checkbox)
   - Exercise Type (Text)
   - Weight (Number)
   - Notes (Text)
   ```

### 2.2 Create Template Pages (Optional)
Create template pages for:
- Daily Note Template
- Weekly Review Template
- Project Template

---

## Step 3: Connect Integration to Databases (If Not Done During Setup)

### If You Selected "Full Workspace Access":
You'll need to manually share databases with your integration:

1. Open each database page
2. Click **"Share"** button (top right)
3. Search for your integration name (e.g., "Motus Life Admin")
4. Click to add the integration
5. The integration now has access to this database

### If You Selected Specific Databases During Setup:
✅ Your databases are already connected! Skip to Step 4.

---

## Step 4: Database Discovery (Simplified Approach)

### 4.1 Automatic Database Discovery
Instead of manually tracking database IDs, we can use the Notion API to discover your databases:

```javascript
// The integration can search for databases by title
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findDatabase(title) {
  const response = await notion.search({
    query: title,
    filter: { property: 'object', value: 'database' }
  });
  return response.results[0]?.id;
}

// Find your databases automatically
const dailyNotesDB = await findDatabase('Daily Notes');
const tasksDB = await findDatabase('Tasks');
```

### 4.2 Manual Database IDs (Optional)
If you prefer explicit IDs or have duplicate names:

1. Open the database in Notion
2. Use the Share menu → Copy link
3. The link contains the database ID: `notion.so/xxxxxxxxxxxxx`
4. Extract the 32-character ID (without dashes)

---

## Step 5: Set Up Environment Variables

Add these to your `.env` file:

```bash
# Notion Integration
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database Names (we'll auto-discover the IDs)
NOTION_DAILY_NOTES_NAME=Daily Notes
NOTION_TASKS_NAME=Tasks
NOTION_PROJECTS_NAME=Projects
NOTION_HEALTH_NAME=Health Metrics

# Optional: Manual Database IDs (if you have duplicates or prefer explicit IDs)
# NOTION_DAILY_NOTES_DB=your_daily_notes_database_id_here
# NOTION_TASKS_DB=your_tasks_database_id_here
```

---

## Step 6: Test Your Setup

### Quick Test with cURL
Test that your integration works by searching for databases:

```bash
curl -X POST https://api.notion.com/v1/search \
  -H "Authorization: Bearer YOUR_INTEGRATION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "object", "value": "database"}}'
```

Should return a JSON response with your accessible databases.

### Node.js Test Script with Auto-Discovery
Create `test-notion.js`:

```javascript
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function discoverDatabases() {
  try {
    // Search for all accessible databases
    const response = await notion.search({
      filter: { property: 'object', value: 'database' },
      page_size: 10
    });
    
    console.log('✅ Successfully connected to Notion!');
    console.log(`Found ${response.results.length} databases:\n`);
    
    response.results.forEach(db => {
      console.log(`  📊 ${db.title[0]?.plain_text || 'Untitled'}`);
      console.log(`     ID: ${db.id}`);
    });
    
    // Try to find specific databases
    const dailyNotes = response.results.find(
      db => db.title[0]?.plain_text === process.env.NOTION_DAILY_NOTES_NAME
    );
    
    if (dailyNotes) {
      console.log(`\n✅ Found Daily Notes database: ${dailyNotes.id}`);
    }
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
  }
}

discoverDatabases();
```

---

## Step 7: Workflow Routing Setup

### Smart Workflow Routing with Auto-Discovery

Create a NotionManager that automatically routes workflows:

```javascript
class NotionManager {
  constructor() {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY });
    this.databases = {};
  }
  
  async initialize() {
    // Auto-discover and cache database IDs
    const search = await this.notion.search({
      filter: { property: 'object', value: 'database' }
    });
    
    search.results.forEach(db => {
      const name = db.title[0]?.plain_text;
      if (name) this.databases[name] = db.id;
    });
  }
  
  async routeWorkflow(workflowType, data) {
    const mappings = {
      'daily-brief': 'Daily Notes',
      'task': 'Tasks',
      'project': 'Projects',
      'health': 'Health Metrics',
      'weekly-review': 'Daily Notes'
    };
    
    const dbName = mappings[workflowType];
    const dbId = this.databases[dbName];
    
    if (!dbId) throw new Error(`Database '${dbName}' not found`);
    
    // Create appropriate page in the database
    return this.createPage(dbId, data);
  }
}
```

---

## Security Best Practices

1. **Never commit your Integration Token** to Git
2. **Use environment variables** for all sensitive data
3. **Limit integration permissions** to only what's needed
4. **Regularly rotate tokens** (every 90 days recommended)
5. **Monitor API usage** in Notion's integration dashboard

---

## Common Issues & Solutions

### Issue: "Database not found"
**Solution**: Make sure you've shared the database with your integration

### Issue: "Insufficient permissions"
**Solution**: Check that your integration has the correct capabilities enabled

logical Issue: "API rate limit exceeded"
**Solution**: Notion allows 3 requests per second. Implement rate limiting in your code.

### Issue: "Invalid database_id"
**Solution**: Database IDs should be 32 characters without hyphens. Format: `a7b5c3d9e2f1234567890abcdef12345`

---

## Next Steps

Once you've completed this setup:

1. ✅ Integration created and token saved
2. ✅ Databases created with proper structure
3. ✅ Databases shared with integration
4. ✅ Database IDs collected
5. ✅ Environment variables configured
6. ✅ Connection tested successfully

You're ready to implement the Notion integration in your Motus system!

---

## Additional Resources

- [Notion API Documentation](https://developers.notion.com/)
- [API Reference](https://developers.notion.com/reference/intro)
- [SDK Documentation](https://github.com/makenotion/notion-sdk-js)
- [Rate Limits](https://developers.notion.com/reference/request-limits)
- [Best Practices](https://developers.notion.com/docs/best-practices)

---

*Last Updated: August 2025*

---

## Appendix: Integration Approaches

### Database ID Options

Based on the latest Notion documentation, you have three approaches for handling database IDs:

1. **Auto-Discovery (Recommended)**: Use the Search API to find databases by name
2. **Manual IDs**: Copy database IDs from share links if you have duplicate names
3. **Hybrid**: Auto-discover most, manually specify critical ones

The auto-discovery approach eliminates the need to manually track IDs and makes your integration more maintainable.