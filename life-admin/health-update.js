#!/usr/bin/env node

/**
 * Health Update Command
 * Quick health metric updates via command line arguments
 */

const fs = require('fs').promises;
const path = require('path');

async function updateHealth(args) {
  // Parse the input string
  const input = args.join(' ').toLowerCase();
  const date = new Date();
  
  // Extract metrics using regex patterns
  const metrics = {
    exercise: (input.match(/exercise[d]?\s+([^,]+?)(?:,|water|drank|energy|mood|stress|sleep|steps|$)/i) || [])[1]?.trim(),
    water: (input.match(/(?:water|drank)\s+(\d+)/i) || [])[1],
    steps: (input.match(/(\d+)\s*steps/i) || [])[1] || (input.match(/steps\s+(\d+)/i) || [])[1],
    energy: (input.match(/energy\s+(\d+)/i) || [])[1],
    mood: (input.match(/mood\s+(\d+)/i) || [])[1],
    stress: (input.match(/stress\s+(\d+)/i) || [])[1],
    sleep: (input.match(/sleep\s+(\d+)/i) || [])[1],
    hours: (input.match(/(\d+\.?\d*)\s*hours/i) || [])[1],
    caffeine: (input.match(/caffeine\s+(\d+)/i) || [])[1] || (input.match(/(\d+)\s*(?:cups?\s+)?coffee/i) || [])[1],
  };

  // Build update summary
  let summary = '\n📊 Health Update Summary\n';
  summary += '══════════════════════════════════════\n';
  
  const updates = [];
  
  if (metrics.exercise) {
    updates.push(`✅ Exercise: ${metrics.exercise}`);
    summary += `✅ Exercise: ${metrics.exercise}\n`;
  }
  
  if (metrics.water) {
    const glasses = parseInt(metrics.water);
    const boxes = '☑'.repeat(Math.min(glasses, 8)) + '☐'.repeat(Math.max(0, 8 - glasses));
    updates.push(`💧 Water: ${boxes} (${glasses}/8)`);
    summary += `💧 Water: ${boxes} (${glasses}/8)\n`;
  }
  
  if (metrics.steps) {
    updates.push(`👟 Steps: ${metrics.steps}`);
    summary += `👟 Steps: ${metrics.steps}\n`;
  }
  
  if (metrics.energy) {
    updates.push(`⚡ Energy: ${metrics.energy}/10`);
    summary += `⚡ Energy: ${metrics.energy}/10\n`;
  }
  
  if (metrics.mood) {
    updates.push(`😊 Mood: ${metrics.mood}/10`);
    summary += `😊 Mood: ${metrics.mood}/10\n`;
  }
  
  if (metrics.stress) {
    updates.push(`😰 Stress: ${metrics.stress}/10`);
    summary += `😰 Stress: ${metrics.stress}/10\n`;
  }
  
  if (metrics.sleep) {
    updates.push(`😴 Sleep quality: ${metrics.sleep}/10`);
    summary += `😴 Sleep quality: ${metrics.sleep}/10\n`;
  }
  
  if (metrics.hours) {
    updates.push(`⏰ Hours slept: ${metrics.hours}`);
    summary += `⏰ Hours slept: ${metrics.hours}\n`;
  }
  
  if (metrics.caffeine) {
    updates.push(`☕ Caffeine: ${metrics.caffeine} cups`);
    summary += `☕ Caffeine: ${metrics.caffeine} cups\n`;
  }
  
  if (updates.length === 0) {
    console.log('\n❌ No health metrics detected in your input.\n');
    console.log('Usage examples:');
    console.log('  motus health "exercise 30 min run, water 6, energy 8, mood 9"');
    console.log('  motus health "10000 steps, sleep 7, stress 3"');
    console.log('  motus health "water 5 glasses, 2 cups coffee, energy 7"');
    return;
  }
  
  // Save to daily note
  const obsidianPath = '/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian';
  const dailyNotesPath = path.join(obsidianPath, 'Daily');
  
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).replace(',', '');
  
  const notePath = path.join(dailyNotesPath, `${dateStr}.md`);
  
  // Create health section
  let healthSection = '\n## Health Update\n';
  healthSection += `*Updated at ${date.toLocaleTimeString()}*\n\n`;
  healthSection += updates.map(u => `- ${u}`).join('\n');
  healthSection += '\n';
  
  try {
    // Try to read existing note
    let existingContent = '';
    try {
      existingContent = await fs.readFile(notePath, 'utf8');
    } catch (err) {
      // File doesn't exist, create new
      existingContent = `# ${dateStr}\n`;
    }
    
    // Check if health section already exists
    if (existingContent.includes('## Health Update')) {
      // Append to existing health section
      const lines = existingContent.split('\n');
      const healthIndex = lines.findIndex(line => line.includes('## Health Update'));
      
      // Find where to insert (after the timestamp line)
      let insertIndex = healthIndex + 2;
      while (insertIndex < lines.length && lines[insertIndex].startsWith('-')) {
        insertIndex++;
      }
      
      // Insert new updates
      lines.splice(insertIndex, 0, ...updates.map(u => `- ${u}`));
      existingContent = lines.join('\n');
    } else {
      // Add new health section
      existingContent += healthSection;
    }
    
    await fs.writeFile(notePath, existingContent);
    
    console.log(summary);
    console.log(`\n✅ Saved to: ${notePath}\n`);
    
  } catch (error) {
    console.error('❌ Error saving to daily note:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('\n💪 Health Update - Quick Entry\n');
    console.log('Usage: node health-update.js "your health metrics"\n');
    console.log('Examples:');
    console.log('  "exercise 30 min yoga, water 6, energy 8, mood 9"');
    console.log('  "10000 steps, sleep quality 8, 7.5 hours"');
    console.log('  "water 5, caffeine 2, stress 4"');
    console.log('\nSupported metrics:');
    console.log('  exercise, water, steps, energy, mood, stress,');
    console.log('  sleep, hours, caffeine/coffee\n');
  } else {
    updateHealth(args).catch(console.error);
  }
}

module.exports = { updateHealth };