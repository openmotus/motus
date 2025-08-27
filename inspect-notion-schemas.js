#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

async function inspectSchemas() {
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
  
  const databases = {
    tasks: process.env.NOTION_TASKS_DB,
    healthTracker: process.env.NOTION_HEALTH_TRACKER_DB
  };
  
  console.log('📊 Notion Database Schemas:\n');
  
  for (const [name, id] of Object.entries(databases)) {
    try {
      const db = await notion.databases.retrieve({ database_id: id });
      console.log(`\n${name.toUpperCase()} DATABASE:`);
      console.log(`Title: ${db.title[0]?.plain_text || 'N/A'}`);
      console.log('Properties:');
      
      for (const [propName, propConfig] of Object.entries(db.properties)) {
        console.log(`  - ${propName}: ${propConfig.type}`);
        if (propConfig.type === 'select' && propConfig.select?.options) {
          console.log(`    Options: ${propConfig.select.options.map(o => o.name).join(', ')}`);
        }
        if (propConfig.type === 'multi_select' && propConfig.multi_select?.options) {
          console.log(`    Options: ${propConfig.multi_select.options.map(o => o.name).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
}

inspectSchemas().catch(console.error);