#!/usr/bin/env node

const NotionMultiDBManager = require('./life-admin/notion-multi-db-manager');

async function testMultiDB() {
  const manager = new NotionMultiDBManager();
  
  const testData = {
    weather: {
      temperature: 27.4,
      condition: 'Light rain',
      humidity: 84,
      summary: '27.4°C, Light rain'
    },
    oura: {
      sleepScore: 59,
      readinessScore: 48,
      totalSleep: '4h 48m',
      remSleep: '59m',
      deepSleep: '43m',
      lightSleep: '3h 6m',
      efficiency: 84,
      restlessPeriods: 50
    },
    calendar: [
      { time: '06:30 AM', title: 'Morning Supplements', duration: '15 mins' }
    ],
    tasks: {
      high: [
        'Reply to Anthropic Team about Claude Browser AI',
        'Respond to Sean Symon Webflow form'
      ],
      medium: [
        'Project status review',
        'Inbox processing'
      ],
      low: [
        'Morning meditation',
        'Complete daily health tracking'
      ]
    },
    emails: [
      {
        from: 'Anthropic Team',
        subject: 'Claude Browser Extension',
        preview: 'Join the research preview waitlist',
        action: 'Reply to join waitlist'
      }
    ],
    insights: [
      'Sleep Recovery Priority - Only 4h 48m sleep',
      'Email Triage Block - Handle urgent emails first',
      'Indoor Work Day - Heavy rain perfect for focused work'
    ]
  };
  
  console.log('🚀 Testing Multi-Database Distribution...\n');
  
  try {
    const results = await manager.distributeDailyData(testData);
    const summary = manager.generateSummary(results);
    console.log('\n' + summary);
    
    if (results.errors.length === 0) {
      console.log('\n✅ All databases updated successfully!');
    } else {
      console.log('\n⚠️ Some errors occurred, check logs above.');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMultiDB();