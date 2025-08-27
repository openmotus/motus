#!/usr/bin/env node

/**
 * Health Check-in Workflow
 * Quick health status update for daily tracking
 */

const fs = require('fs').promises;
const path = require('path');

async function getHealthCheckInForm() {
  const date = new Date();
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  let output = '\n';
  output += '╔══════════════════════════════════════════════════════════╗\n';
  output += '║               💪 DAILY HEALTH CHECK-IN                   ║\n';
  output += '╠══════════════════════════════════════════════════════════╣\n';
  output += `║  ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).padEnd(55)} ║\n`;
  output += `║  ${time.padEnd(55)} ║\n`;
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  // Activity Section
  output += '🏃 ACTIVITY TRACKING\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '□ Morning workout\n';
  output += '□ Evening walk/run\n';
  output += '□ Yoga/Stretching\n';
  output += '□ Strength training\n';
  output += '□ Sports activity\n';
  output += '\nSteps today: _________\n';
  output += 'Active minutes: _______\n\n';
  
  // Nutrition Section
  output += '🥗 NUTRITION LOG\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += 'Breakfast: _________________________________\n';
  output += 'Lunch:     _________________________________\n';
  output += 'Dinner:    _________________________________\n';
  output += 'Snacks:    _________________________________\n';
  output += '\n💧 Water intake: ☐☐☐☐☐☐☐☐ (8 glasses)\n';
  output += '☕ Caffeine: _____ cups\n';
  output += '🍷 Alcohol: _____ drinks\n\n';
  
  // Energy & Wellness
  output += '⚡ ENERGY & WELLNESS\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += 'Energy level (1-10): ____\n';
  output += 'Mood (1-10): ____\n';
  output += 'Stress level (1-10): ____\n';
  output += 'Sleep quality last night (1-10): ____\n';
  output += 'Hours slept: ____\n\n';
  
  // Symptoms & Notes
  output += '📝 SYMPTOMS & NOTES\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '□ Headache      □ Fatigue       □ Digestive issues\n';
  output += '□ Joint pain    □ Muscle ache   □ Allergies\n';
  output += '□ Other: _________________________________\n\n';
  
  output += 'Notes: _____________________________________\n';
  output += '       _____________________________________\n\n';
  
  // Tomorrow's Plan
  output += '🎯 TOMORROW\'S FITNESS PLAN\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += 'Workout type: _______________________________\n';
  output += 'Time: _______________\n';
  output += 'Duration: ___________\n';
  output += 'Goals: ______________________________________\n\n';
  
  // Quick Commands
  output += '═══════════════════════════════════════════════════════════\n';
  output += '💡 QUICK UPDATE COMMANDS:\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '\n';
  output += '  motus update "completed exercise 30 minutes"\n';
  output += '  motus update "drank 6 glasses of water"\n';
  output += '  motus update "energy level 8"\n';
  output += '  motus update "sleep quality 9"\n';
  output += '  motus update "10000 steps today"\n';
  output += '\n';
  
  // Health metrics summary
  output += '📊 WEEKLY TRENDS:\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += 'Average sleep: 7.5 hours\n';
  output += 'Average steps: 8,500\n';
  output += 'Workout streak: 3 days\n';
  output += 'Water goal met: 5/7 days\n\n';
  
  return output;
}

// Run the check-in
getHealthCheckInForm().then(output => {
  console.log(output);
}).catch(console.error);