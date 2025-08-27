#!/usr/bin/env node

/**
 * Simple Evening Review - Non-interactive version
 */

const fs = require('fs').promises;
const path = require('path');

async function getEveningReviewTemplate() {
  const date = new Date();
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Get Obsidian vault path
  const obsidianPath = '/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian';
  const dailyNotesPath = path.join(obsidianPath, 'Daily');
  
  // Get today's note filename
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).replace(',', '');
  
  const notePath = path.join(dailyNotesPath, `${dateStr}.md`);
  
  let existingTasks = [];
  let todayHighlights = [];
  
  try {
    const content = await fs.readFile(notePath, 'utf8');
    const lines = content.split('\n');
    
    // Extract completed tasks
    for (const line of lines) {
      if (line.includes('- [x]')) {
        const task = line.replace(/^.*- \[x\]\s*/, '').trim();
        if (task && !task.startsWith('Morning routine') && !task.startsWith('Water intake')) {
          existingTasks.push(`  ✅ ${task}`);
        }
      }
    }
    
    // Check health metrics
    const exerciseMatch = lines.find(l => l.includes('- [x] Exercise:'));
    if (exerciseMatch) {
      todayHighlights.push('  💪 Completed exercise');
    }
    
    const waterMatch = lines.find(l => l.includes('Water intake') && l.includes('☑'));
    if (waterMatch) {
      const checkedCount = (waterMatch.match(/☑/g) || []).length;
      todayHighlights.push(`  💧 ${checkedCount}/8 glasses of water`);
    }
    
    const meditationMatch = lines.find(l => l.includes('- [x] Meditation'));
    if (meditationMatch) {
      todayHighlights.push('  🧘 Meditation completed');
    }
  } catch (err) {
    // No daily note found
  }
  
  // Create the review template
  let output = '\n';
  output += '╔══════════════════════════════════════════════════════════╗\n';
  output += '║              🌙 EVENING REVIEW & REFLECTION              ║\n';
  output += '╠══════════════════════════════════════════════════════════╣\n';
  output += `║  ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).padEnd(55)} ║\n`;
  output += `║  ${time} ${date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop().padEnd(48)} ║\n`;
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  // Today's accomplishments
  output += '📝 TODAY\'S ACCOMPLISHMENTS\n';
  output += '═══════════════════════════════════════════════════════════\n';
  if (existingTasks.length > 0) {
    output += existingTasks.join('\n') + '\n';
  } else {
    output += '  No tracked tasks found for today.\n';
  }
  output += '\n';
  
  // Health & Wellness
  output += '💪 HEALTH & WELLNESS\n';
  output += '═══════════════════════════════════════════════════════════\n';
  if (todayHighlights.length > 0) {
    output += todayHighlights.join('\n') + '\n';
  } else {
    output += '  No health metrics tracked today.\n';
  }
  output += '\n';
  
  // Reflection prompts
  output += '✨ EVENING REFLECTION GUIDE\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '\n';
  output += '🎯 Tomorrow\'s Top 3 Priorities:\n';
  output += '  1. _________________________________\n';
  output += '  2. _________________________________\n';
  output += '  3. _________________________________\n';
  output += '\n';
  
  output += '🙏 Gratitude (3 things you\'re grateful for):\n';
  output += '  • _________________________________\n';
  output += '  • _________________________________\n';
  output += '  • _________________________________\n';
  output += '\n';
  
  output += '💡 Notes & Ideas:\n';
  output += '  _____________________________________\n';
  output += '  _____________________________________\n';
  output += '\n';
  
  output += '⭐ Rate Today (1-10): ____\n';
  output += '\n';
  
  // Instructions
  output += '═══════════════════════════════════════════════════════════\n';
  output += '💫 TO UPDATE YOUR DAILY NOTE:\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '\n';
  output += 'Use these commands to update your daily note:\n';
  output += '\n';
  output += '  motus update "accomplished [task]"\n';
  output += '  motus update "grateful for [something]"\n';
  output += '  motus update "tomorrow [priority]"\n';
  output += '  motus update "idea [your note]"\n';
  output += '  motus update "sleep quality 8"\n';
  output += '\n';
  output += 'Or run the interactive review:\n';
  output += '  node /Users/ianwinscom/slashmotus/life-admin/evening-review.js\n';
  output += '\n';
  
  // Daily note path
  output += `📁 Today's note: ${notePath}\n`;
  
  return output;
}

// Run the review
getEveningReviewTemplate().then(output => {
  console.log(output);
}).catch(console.error);