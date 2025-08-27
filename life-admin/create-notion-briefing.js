#!/usr/bin/env node

/**
 * Create Complete Notion Daily Briefing
 * Compiles all data and creates properly formatted Notion entry
 */

const NotionManager = require('./notion-manager');

async function createCompleteDailyBriefing() {
  // This is the complete data structure with all information
  const briefingData = {
    weather: {
      temperature: 28.4,
      condition: 'Heavy rain',
      humidity: 74,
      feelsLike: 37.4,
      rainChance: 99,
      forecast: 'Heavy rain (99% chance) continuing through August 29',
      summary: '28.4°C | Heavy rain (99% chance) | Humidity: 74%'
    },
    oura: {
      sleepScore: 59,
      readinessScore: 48,
      totalSleep: '4h 48m',
      remSleep: '59m',
      deepSleep: '43m',
      lightSleep: '3h 6m',
      efficiency: 84,
      restlessPeriods: 50,
      lowestHR: 75,
      averageHRV: 15,
      targetSleep: '7.5h'
    },
    calendar: [
      {
        time: '6:30 AM',
        title: 'Morning Supplements',
        duration: '15 minutes',
        description: 'Yohimbine, SLU-PP-332, BPC-157, MOTS-C'
      }
    ],
    emails: [
      {
        from: 'Anthropic Team',
        subject: '[Research preview] Help us develop safe browser AI',
        preview: 'Join the research preview waitlist to test Claude\'s experimental browser extension',
        action: '🔴 Response needed'
      },
      {
        from: 'Webflow Forms',
        subject: 'You have a new form submission on your Webflow site!',
        preview: 'Form submission from Sean Symon - business inquiry via Darkstar VC site',
        action: '🔴 Response needed'
      },
      {
        from: 'Connor Norris (Superhuman)',
        subject: 'Action Needed: Please update payment information for Superhuman',
        preview: 'Update payment information to avoid service interruption',
        action: '🔴 Urgent - Payment update'
      },
      {
        from: 'Figma',
        subject: 'Subscription renewal reminder Sep 02, 2025',
        preview: 'Your Figma subscription will renew on September 2nd',
        action: '🟡 Review renewal'
      }
    ],
    tasks: {
      high: [
        'Reply to Anthropic Team - Claude Browser AI Research Preview (30 min)',
        'Respond to Webflow Form - Sean Symon business inquiry (20 min)',
        'Update Superhuman payment information (15 min)'
      ],
      medium: [
        'Project status review (45 min)',
        'Inbox processing (30 min)'
      ],
      low: [
        'Morning meditation (20 min)',
        'Monitor Figma subscription renewal (5 min)'
      ]
    },
    insights: [
      '💤 Prioritize rest due to poor sleep (4h 48m vs 7.5h goal)',
      '🌧️ Use rainy weather for indoor deep work sessions',
      '⏰ Handle time-sensitive emails first thing this morning',
      '🎯 Block 2-4 PM for focused work on high-priority items',
      '💪 Front-load high-priority tasks while energy permits'
    ],
    quote: {
      text: 'The way to get started is to quit talking and begin doing.',
      author: 'Walt Disney'
    }
  };

  const manager = new NotionManager();
  
  try {
    console.log('📝 Creating Complete Notion Daily Journal entry...');
    const result = await manager.createDailyEntry(briefingData);
    
    console.log('\n✅ Notion Daily Journal Created Successfully!\n');
    console.log(`📅 Date: ${new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`);
    console.log(`🔗 URL: ${result.url || `https://notion.so/${result.id?.replace(/-/g, '')}`}`);
    console.log(`📊 Page ID: ${result.id}`);
    
    // Summary of what was included
    console.log('\n📊 Complete Data Included:');
    console.log('  ✅ Weather: 28.4°C, Heavy rain (99%), Humidity 74%');
    console.log('  ✅ Oura Sleep: Score 59/100, Total 4h 48m');
    console.log('  ✅ Calendar: 1 event (Morning Supplements)');
    console.log('  ✅ Tasks: 3 high, 2 medium, 2 low priority');
    console.log('  ✅ Emails: 4 important (3 urgent, 1 review)');
    console.log('  ✅ Insights: 5 strategic recommendations');
    console.log('  ✅ Daily tracking sections');
    console.log('  ✅ Quote of the day');
    
    console.log(`\n⏰ Generated at: ${new Date().toLocaleTimeString()}`);
    
    return result;
  } catch (error) {
    console.error('\n❌ Failed to create Notion entry:', error.message);
    console.error('\nError details:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createCompleteDailyBriefing()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createCompleteDailyBriefing;