#!/usr/bin/env node

/**
 * Interactive Health Check-in
 * Prompts for health metrics and saves to daily note
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

class HealthCheckIn {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.data = {};
  }

  async askQuestion(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }

  async run() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║           💪 INTERACTIVE HEALTH CHECK-IN                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('Press Enter to skip any question.\n');

    try {
      // Activity
      console.log('🏃 ACTIVITY TRACKING\n');
      this.data.exercise = await this.askQuestion('Did you exercise today? (describe): ');
      this.data.steps = await this.askQuestion('Steps today: ');
      this.data.activeMinutes = await this.askQuestion('Active minutes: ');
      
      // Nutrition
      console.log('\n🥗 NUTRITION\n');
      this.data.water = await this.askQuestion('Water glasses (0-8): ');
      this.data.caffeine = await this.askQuestion('Caffeine cups: ');
      this.data.meals = await this.askQuestion('How was your nutrition today? (brief): ');
      
      // Energy & Wellness
      console.log('\n⚡ ENERGY & WELLNESS\n');
      this.data.energy = await this.askQuestion('Energy level (1-10): ');
      this.data.mood = await this.askQuestion('Mood (1-10): ');
      this.data.stress = await this.askQuestion('Stress level (1-10): ');
      this.data.sleep = await this.askQuestion('Sleep quality last night (1-10): ');
      this.data.hours = await this.askQuestion('Hours slept: ');
      
      // Notes
      console.log('\n📝 NOTES\n');
      this.data.symptoms = await this.askQuestion('Any symptoms? (or Enter to skip): ');
      this.data.notes = await this.askQuestion('Additional notes: ');
      
      // Tomorrow's plan
      console.log('\n🎯 TOMORROW\'S PLAN\n');
      this.data.tomorrowWorkout = await this.askQuestion('Tomorrow\'s workout plan: ');
      
      // Save to daily note
      await this.saveToDailyNote();
      
      console.log('\n✅ Health check-in complete! Data saved to your daily note.\n');
      
    } catch (error) {
      console.error('❌ Error during check-in:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async saveToDailyNote() {
    const date = new Date();
    const obsidianPath = '/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian';
    const dailyNotesPath = path.join(obsidianPath, 'Daily');
    
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).replace(',', '');
    
    const notePath = path.join(dailyNotesPath, `${dateStr}.md`);
    
    // Create health check-in section
    let healthSection = '\n## Health Check-in\n';
    healthSection += `*Logged at ${date.toLocaleTimeString()}*\n\n`;
    
    if (this.data.exercise) {
      healthSection += `- [x] Exercise: ${this.data.exercise}\n`;
    }
    if (this.data.steps) {
      healthSection += `- Steps: ${this.data.steps}\n`;
    }
    if (this.data.activeMinutes) {
      healthSection += `- Active minutes: ${this.data.activeMinutes}\n`;
    }
    
    if (this.data.water) {
      const waterCount = parseInt(this.data.water) || 0;
      const boxes = '☑'.repeat(waterCount) + '☐'.repeat(Math.max(0, 8 - waterCount));
      healthSection += `- Water intake: ${boxes} (${waterCount}/8)\n`;
    }
    
    if (this.data.caffeine) {
      healthSection += `- Caffeine: ${this.data.caffeine} cups\n`;
    }
    
    if (this.data.meals) {
      healthSection += `- Nutrition notes: ${this.data.meals}\n`;
    }
    
    healthSection += '\n### Wellness Metrics\n';
    if (this.data.energy) healthSection += `- Energy: ${this.data.energy}/10\n`;
    if (this.data.mood) healthSection += `- Mood: ${this.data.mood}/10\n`;
    if (this.data.stress) healthSection += `- Stress: ${this.data.stress}/10\n`;
    if (this.data.sleep) healthSection += `- Sleep quality: ${this.data.sleep}/10\n`;
    if (this.data.hours) healthSection += `- Hours slept: ${this.data.hours}\n`;
    
    if (this.data.symptoms) {
      healthSection += `\n### Symptoms\n- ${this.data.symptoms}\n`;
    }
    
    if (this.data.notes) {
      healthSection += `\n### Notes\n${this.data.notes}\n`;
    }
    
    if (this.data.tomorrowWorkout) {
      healthSection += `\n### Tomorrow's Plan\n- ${this.data.tomorrowWorkout}\n`;
    }
    
    // Try to append to existing note or create new
    try {
      const existingContent = await fs.readFile(notePath, 'utf8');
      const updatedContent = existingContent + '\n' + healthSection;
      await fs.writeFile(notePath, updatedContent);
      console.log(`\n📝 Updated: ${notePath}`);
    } catch (err) {
      // Create new note with health section
      const newContent = `# ${dateStr}\n\n${healthSection}`;
      await fs.writeFile(notePath, newContent);
      console.log(`\n📝 Created: ${notePath}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checkIn = new HealthCheckIn();
  checkIn.run().catch(console.error);
}

module.exports = HealthCheckIn;