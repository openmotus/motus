#!/usr/bin/env node

/**
 * Test Enhanced Life Department with Real Integrations
 */

require('dotenv').config();
const EnhancedLifeDepartment = require('./lib/life-department-enhanced');

async function testEnhancedBriefing() {
  console.log('🧪 Testing Enhanced Life Department with Real Data\n');
  console.log('Weather Location:', process.env.WEATHER_LOCATION);
  console.log('Weather API:', process.env.WEATHER_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('Google OAuth:', process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '⏳ Ready when you are');
  console.log('-'.repeat(60));

  const lifeDept = new EnhancedLifeDepartment();
  
  // Test morning briefing
  await lifeDept.morningBriefing();
  
  // Optional: Test evening review
  // await lifeDept.eveningReview();
}

testEnhancedBriefing().catch(console.error);