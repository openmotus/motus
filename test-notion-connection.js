#!/usr/bin/env node

/**
 * Test Notion Integration Connection
 * Discovers and displays all accessible databases
 */

const { Client } = require('@notionhq/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testNotionConnection() {
  // Check if API key exists
  if (!process.env.NOTION_API_KEY) {
    console.error(`${colors.red}❌ Missing NOTION_API_KEY in .env file${colors.reset}`);
    console.log(`\nPlease add your Notion integration token to .env:`);
    console.log(`NOTION_API_KEY=secret_xxxxxxxxxxxx`);
    process.exit(1);
  }

  // Initialize Notion client
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  console.log(`${colors.cyan}🔍 Testing Notion Integration...${colors.reset}\n`);

  try {
    // Search for all accessible databases
    console.log(`${colors.blue}Searching for databases...${colors.reset}`);
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      },
      page_size: 100
    });

    if (response.results.length === 0) {
      console.log(`${colors.yellow}⚠️  No databases found!${colors.reset}`);
      console.log(`\nMake sure you've:`);
      console.log(`1. Created databases in Notion`);
      console.log(`2. Given your integration access to them`);
      return;
    }

    console.log(`${colors.green}✅ Successfully connected to Notion!${colors.reset}`);
    console.log(`\n${colors.cyan}Found ${response.results.length} database(s):${colors.reset}\n`);

    // Store database mappings
    const databaseMap = {};
    
    // Display each database
    response.results.forEach((db, index) => {
      const title = db.title?.[0]?.plain_text || 'Untitled';
      const id = db.id;
      const url = db.url;
      
      // Store in map
      databaseMap[title] = id;
      
      console.log(`${colors.green}${index + 1}. 📊 ${title}${colors.reset}`);
      console.log(`   ID: ${colors.yellow}${id}${colors.reset}`);
      console.log(`   URL: ${colors.blue}${url}${colors.reset}`);
      console.log();
    });

    // Check for expected databases
    console.log(`${colors.cyan}Checking for Motus databases:${colors.reset}\n`);
    
    const expectedDatabases = [
      'Daily Journal',
      'Health Tracker',
      'Projects',
      'Tasks'
    ];

    expectedDatabases.forEach(dbName => {
      if (databaseMap[dbName]) {
        console.log(`${colors.green}✅ Found: ${dbName}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️  Missing: ${dbName}${colors.reset}`);
      }
    });

    // Test creating a sample entry in Daily Journal
    const dailyJournalId = databaseMap['Daily Journal'];
    if (dailyJournalId) {
      console.log(`\n${colors.cyan}Testing write access to Daily Journal...${colors.reset}`);
      
      try {
        // Get database schema first
        const database = await notion.databases.retrieve({ 
          database_id: dailyJournalId 
        });
        
        console.log(`${colors.green}✅ Can access Daily Journal database${colors.reset}`);
        
        // Display available properties
        console.log(`\n${colors.cyan}Database properties:${colors.reset}`);
        Object.entries(database.properties).forEach(([name, prop]) => {
          console.log(`  - ${name} (${prop.type})`);
        });
        
      } catch (error) {
        console.log(`${colors.red}❌ Cannot access Daily Journal: ${error.message}${colors.reset}`);
      }
    }

    // Generate .env suggestions
    console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Suggested .env configuration:${colors.reset}\n`);
    console.log(`# Notion Integration`);
    console.log(`NOTION_API_KEY=${process.env.NOTION_API_KEY || 'your_token_here'}`);
    console.log();
    console.log(`# Database Names (for auto-discovery)`);
    expectedDatabases.forEach(dbName => {
      const envName = dbName.toUpperCase().replace(/\s+/g, '_');
      console.log(`NOTION_${envName}_NAME="${dbName}"`);
    });
    console.log();
    console.log(`# Or use explicit IDs:`);
    expectedDatabases.forEach(dbName => {
      const envName = dbName.toUpperCase().replace(/\s+/g, '_');
      const id = databaseMap[dbName] || 'not_found';
      console.log(`NOTION_${envName}_DB=${id}`);
    });

  } catch (error) {
    console.error(`${colors.red}❌ Connection failed: ${error.message}${colors.reset}`);
    
    if (error.code === 'unauthorized') {
      console.log(`\n${colors.yellow}Check that your NOTION_API_KEY is correct${colors.reset}`);
    } else if (error.code === 'restricted_resource') {
      console.log(`\n${colors.yellow}The integration doesn't have access to this resource${colors.reset}`);
    }
    
    console.log(`\nFull error:`, error);
  }
}

// Run the test
testNotionConnection().catch(console.error);