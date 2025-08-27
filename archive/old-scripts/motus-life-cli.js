#!/usr/bin/env node

/**
 * Motus Life CLI - Enhanced Life Department with real functionality
 * This integrates with Claude Code's capabilities for actual task execution
 */

const LifeDepartment = require('./life-department');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const lifeDept = new LifeDepartment();

  // Route commands
  const [command, ...params] = args;

  switch (command) {
    case 'briefing':
      await lifeDept.morningBriefing();
      break;
    
    case 'review':
      await lifeDept.eveningReview();
      break;
    
    case 'plan':
      if (params[0] === 'week') {
        await lifeDept.weeklyPlanning();
      } else {
        console.log('Planning session for: ' + (params[0] || 'today'));
        console.log('Feature coming soon with full Task tool integration!');
      }
      break;
    
    case 'track':
      const [type, ...data] = params;
      if (type) {
        await lifeDept.track(type, data.join(' '));
      } else {
        console.log('Usage: motus-life track [habit|goal|health] [data]');
      }
      break;
    
    case 'help':
    default:
      console.log(`
🏠 Motus Life Department

Commands:
  briefing              Get your morning briefing
  review                Evening review session
  plan [day|week|month] Planning session
  track [type] [data]   Track habits, goals, or health
  help                  Show this help message

Examples:
  node motus-life-cli.js briefing
  node motus-life-cli.js track habit "exercised for 30 minutes"
  node motus-life-cli.js plan week
`);
  }
}

main().catch(console.error);