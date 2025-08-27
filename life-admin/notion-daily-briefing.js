#!/usr/bin/env node

/**
 * Notion Daily Briefing Script
 * Receives data from agents and creates Notion entry
 */

const NotionManager = require('./notion-manager');

async function createDailyBriefing() {
  // Get data passed as command line argument (JSON string)
  const dataArg = process.argv[2];
  
  let briefingData = {};
  
  if (dataArg) {
    try {
      briefingData = JSON.parse(dataArg);
    } catch (error) {
      console.error('Error parsing input data:', error.message);
      // Continue with empty data
    }
  }
  
  // Default structure with received data
  const data = {
    weather: briefingData.weather || null,
    oura: briefingData.oura || null,
    calendar: briefingData.calendar || [],
    emails: briefingData.emails || [],
    tasks: briefingData.tasks || [],
    insights: briefingData.insights || [],
    quote: briefingData.quote || null
  };
  
  // Add any missing Oura data processing
  if (data.oura && typeof data.oura === 'string') {
    try {
      data.oura = JSON.parse(data.oura);
    } catch (e) {
      // Keep as is if not JSON
    }
  }
  
  const manager = new NotionManager();
  
  try {
    console.log('📝 Creating Notion Daily Journal entry...');
    const result = await manager.createDailyEntry(data);
    
    console.log('\n✅ Notion Daily Journal Created!\n');
    console.log(`📅 Date: ${new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`);
    console.log(`🔗 URL: ${result.url || 'Check Notion'}`);
    console.log(`📊 Page ID: ${result.id}`);
    
    // Summary of what was included
    console.log('\n📊 Data included:');
    if (data.weather) console.log(`  - Weather: ${data.weather.summary || 'Included'}`);
    if (data.oura) console.log(`  - Sleep Score: ${data.oura.sleepScore || 'N/A'}/100`);
    if (data.calendar.length > 0) console.log(`  - Calendar: ${data.calendar.length} events`);
    if (data.tasks.length > 0) console.log(`  - Tasks: ${data.tasks.length} items`);
    if (data.emails.length > 0) console.log(`  - Emails: ${data.emails.length} important`);
    if (data.insights.length > 0) console.log(`  - Insights: ${data.insights.length} recommendations`);
    
    console.log(`\n⏰ Generated at: ${new Date().toLocaleTimeString()}`);
    
    // Return success for agent
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create Notion entry:', error.message);
    console.error('Please check:');
    console.error('  1. Notion API key is valid');
    console.error('  2. Database IDs are correct');
    console.error('  3. Integration has access to databases');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createDailyBriefing();
}