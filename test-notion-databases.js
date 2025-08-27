#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testDatabases() {
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
  
  const databases = {
    dailyJournal: process.env.NOTION_DAILY_JOURNAL_DB,
    healthTracker: process.env.NOTION_HEALTH_TRACKER_DB,
    projects: process.env.NOTION_PROJECTS_DB,
    tasks: process.env.NOTION_TASKS_DB
  };
  
  console.log('Testing Notion Database Access:\n');
  
  for (const [name, id] of Object.entries(databases)) {
    if (!id) {
      console.log(`❌ ${name}: No ID configured`);
      continue;
    }
    
    try {
      const db = await notion.databases.retrieve({ database_id: id });
      console.log(`✅ ${name}: ${db.title[0]?.plain_text || 'Accessible'} (${id})`);
      
      // Show properties
      const props = Object.keys(db.properties).slice(0, 5);
      console.log(`   Properties: ${props.join(', ')}${props.length < Object.keys(db.properties).length ? '...' : ''}`);
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
}

testDatabases().catch(console.error);