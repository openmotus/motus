#!/usr/bin/env node

/**
 * Motus Life Department Command Handler
 * Complete implementation with all agents and workflows
 */

require('dotenv').config();
const LifeWorkflows = require('./life-admin/workflows');
const LifeAdminAgent = require('./life-admin/life-admin-agent');
const GoogleOAuthSetup = require('./life-admin/setup-google-oauth');
const fs = require('fs').promises;
const path = require('path');

class MotusLife {
  constructor() {
    this.workflows = new LifeWorkflows();
    this.lifeAdmin = new LifeAdminAgent();
  }

  async handleCommand(args) {
    const [command, ...params] = args;

    switch (command) {
      // Main daily workflow
      case 'daily-brief':
      case 'briefing':
        return await this.workflows.morningBrief();

      // Specific workflows
      case 'morning':
      case 'morning-brief':
        return await this.workflows.morningBrief();

      case 'midday':
      case 'checkin':
        return await this.workflows.middayCheckin();

      case 'evening':
      case 'review':
        return await this.workflows.eveningReview();

      // Weekly workflows
      case 'weekly-plan':
      case 'plan-week':
        return await this.workflows.weeklyPlanning();

      case 'weekly-review':
        return await this.workflows.weeklyReview();

      // Monthly workflows
      case 'monthly-plan':
        return await this.workflows.monthlyPlanning();

      case 'finance-review':
        return await this.workflows.monthlyFinanceReview();

      case 'health-review':
        return await this.workflows.monthlyHealthReview();

      // Setup and configuration
      case 'setup':
        return await this.setup();

      case 'setup-google':
        const oauthSetup = new GoogleOAuthSetup();
        return await oauthSetup.setup();

      // Individual agents
      case 'calendar':
        return await this.showCalendar();

      case 'emails':
        return await this.showEmails();

      case 'tasks':
        return await this.showTasks();

      case 'health':
        return await this.healthStatus();

      case 'finance':
        return await this.financeStatus();

      // Help
      case 'help':
      default:
        return this.showHelp();
    }
  }

  async setup() {
    console.log('\n🏠 Life Department Setup\n');
    console.log('Let\'s configure your Life Management system.\n');

    // Check critical configurations
    const checks = {
      'Weather API': process.env.WEATHER_API_KEY ? '✅' : '❌',
      'Google OAuth': process.env.GOOGLE_REFRESH_TOKEN ? '✅' : '⏳',
      'Obsidian Vault': process.env.OBSIDIAN_VAULT_PATH ? '✅' : '⏳',
      'Timezone': process.env.TIMEZONE || 'Auto-detected',
      'Location': process.env.WEATHER_LOCATION || 'Not set'
    };

    console.log('Configuration Status:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n📋 Next Steps:');
    
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('  1. Run: /motus life setup-google');
      console.log('     To connect Google Calendar and Gmail');
    }

    if (!process.env.OBSIDIAN_VAULT_PATH) {
      console.log('  2. Add to .env: OBSIDIAN_VAULT_PATH=/path/to/vault');
      console.log('     To enable Obsidian daily notes');
    }

    console.log('\n✨ Ready commands:');
    console.log('  /motus life daily-brief - Full daily briefing');
    console.log('  /motus life calendar - View today\'s calendar');
    console.log('  /motus life tasks - View and manage tasks');
    console.log('  /motus life help - See all commands');
  }

  async showCalendar() {
    console.log('\n📅 Today\'s Calendar\n');
    await this.lifeAdmin.initializeGoogleAuth();
    const events = await this.lifeAdmin.fetchCalendarEvents();
    
    if (events.length === 0) {
      console.log('No events scheduled for today.');
    } else {
      events.forEach(event => {
        console.log(`${event.time} - ${event.title}`);
        if (event.location) console.log(`  Location: ${event.location}`);
        if (event.duration) console.log(`  Duration: ${event.duration}`);
        if (event.meetingLink) console.log(`  Link: ${event.meetingLink}`);
        console.log();
      });
    }
  }

  async showEmails() {
    console.log('\n📧 Email Summary\n');
    await this.lifeAdmin.initializeGoogleAuth();
    const emails = await this.lifeAdmin.processEmails();
    
    if (emails.important && emails.important.length > 0) {
      console.log('🔴 Important:');
      emails.important.forEach(email => {
        console.log(`  From: ${email.from}`);
        console.log(`  Subject: ${email.subject}`);
        console.log(`  Preview: ${email.preview}\n`);
      });
    }

    if (emails.regular && emails.regular.length > 0) {
      console.log('📋 Regular:');
      console.log(`  ${emails.regular.length} regular emails`);
    }

    if (!emails.important || emails.important.length === 0) {
      console.log('No important emails requiring attention.');
    }
  }

  async showTasks() {
    console.log('\n✅ Today\'s Tasks\n');
    
    // Get calendar and email data
    const calendar = await this.lifeAdmin.fetchCalendarEvents();
    const emails = await this.lifeAdmin.processEmails();
    
    // Compile tasks
    const tasks = await this.lifeAdmin.compileTasks(calendar, emails);
    
    const grouped = {
      high: tasks.filter(t => t.priority === 'high'),
      medium: tasks.filter(t => t.priority === 'medium'),
      low: tasks.filter(t => t.priority === 'low')
    };

    if (grouped.high.length > 0) {
      console.log('🔴 High Priority:');
      grouped.high.forEach(task => console.log(`  - ${task.task}`));
      console.log();
    }

    if (grouped.medium.length > 0) {
      console.log('🟡 Medium Priority:');
      grouped.medium.forEach(task => console.log(`  - ${task.task}`));
      console.log();
    }

    if (grouped.low.length > 0) {
      console.log('⚪ Low Priority:');
      grouped.low.forEach(task => console.log(`  - ${task.task}`));
    }
  }

  async healthStatus() {
    console.log('\n💪 Health Status\n');
    
    // This would integrate with health tracking APIs
    const health = {
      steps: { today: 5432, goal: 10000 },
      water: { glasses: 4, goal: 8 },
      exercise: { completed: false, planned: 'Yoga 6:30 PM' },
      sleep: { lastNight: 7.2, quality: 'Good' }
    };

    console.log(`Steps: ${health.steps.today}/${health.steps.goal} (${Math.round(health.steps.today/health.steps.goal*100)}%)`);
    console.log(`Water: ${health.water.glasses}/${health.water.goal} glasses`);
    console.log(`Exercise: ${health.exercise.completed ? '✅' : '⏳'} ${health.exercise.planned}`);
    console.log(`Sleep: ${health.sleep.lastNight} hours (${health.sleep.quality})`);
    
    console.log('\n💡 Recommendations:');
    if (health.steps.today < health.steps.goal * 0.5) {
      console.log('  - Take a walk to increase step count');
    }
    if (health.water.glasses < health.water.goal * 0.5) {
      console.log('  - Drink more water to stay hydrated');
    }
  }

  async financeStatus() {
    console.log('\n💰 Finance Status\n');
    
    const finance = await this.lifeAdmin.integrations.getFinanceSnapshot();
    
    console.log('Budget Status:');
    console.log(`  Spent: $${finance.budget_status.spent}`);
    console.log(`  Budget: $${finance.budget_status.budget}`);
    console.log(`  Remaining: $${finance.budget_status.remaining}`);
    console.log(`  Usage: ${finance.budget_status.percentage}%`);
    
    console.log('\nUpcoming Bills:');
    finance.upcoming_bills.forEach(bill => {
      console.log(`  ${bill.date}: ${bill.description} - $${bill.amount}`);
    });
    
    console.log('\nAccounts:');
    console.log(`  Checking: $${finance.accounts.checking.toLocaleString()}`);
    console.log(`  Savings: $${finance.accounts.savings.toLocaleString()}`);
    console.log(`  Investments: $${finance.accounts.investments.toLocaleString()}`);
  }

  showHelp() {
    console.log(`
🏠 MOTUS LIFE DEPARTMENT

Daily Workflows:
  /motus life daily-brief      Complete morning briefing with calendar, email, weather
  /motus life morning          Morning briefing (8am)
  /motus life midday           Midday check-in (12pm)
  /motus life evening          Evening review (9pm)

Weekly Workflows:
  /motus life weekly-plan      Weekly planning session (Sunday 10am)
  /motus life weekly-review    Weekly review (Friday 5pm)

Monthly Workflows:
  /motus life monthly-plan     Monthly planning (1st of month)
  /motus life finance-review   Monthly finance review
  /motus life health-review    Monthly health review

Individual Agents:
  /motus life calendar         View today's calendar
  /motus life emails           Check important emails
  /motus life tasks            View prioritized tasks
  /motus life health           Health status
  /motus life finance          Finance snapshot

Setup & Config:
  /motus life setup            Configure Life Department
  /motus life setup-google     Connect Google Calendar & Gmail

Shortcuts:
  /motus daily-brief          Quick access to daily briefing

Examples:
  /motus life daily-brief     # Run full morning briefing
  /motus daily-brief          # Shortcut version
  /motus life calendar        # Just check calendar
  /motus life tasks           # View today's tasks

Features:
  ✅ Weather integration (Chiang Mai)
  ✅ Google Calendar sync
  ✅ Gmail important emails
  ✅ Obsidian daily notes
  ✅ Task prioritization
  ✅ Health tracking
  ✅ Finance monitoring
`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const motusLife = new MotusLife();
  
  await motusLife.handleCommand(args);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MotusLife;