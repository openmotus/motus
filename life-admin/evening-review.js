#!/usr/bin/env node

/**
 * Evening Review Workflow
 * Actual implementation that updates Obsidian daily notes
 */

const fs = require('fs').promises;
const path = require('path');
const DailyNoteUpdater = require('./daily-note-updater');
const readline = require('readline');

class EveningReview {
  constructor() {
    this.noteUpdater = new DailyNoteUpdater();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async askQuestion(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }

  async run() {
    console.log('\n' + '═'.repeat(60));
    console.log('🌙 EVENING REVIEW - Let\'s reflect on your day');
    console.log('═'.repeat(60) + '\n');

    try {
      // Step 1: Review accomplishments
      console.log('📝 Step 1/5: Today\'s Accomplishments\n');
      const accomplishments = await this.reviewAccomplishments();
      
      // Step 2: Tomorrow's priorities
      console.log('\n🎯 Step 2/5: Tomorrow\'s Top Priorities\n');
      const priorities = await this.getTomorrowPriorities();
      
      // Step 3: Health summary
      console.log('\n💪 Step 3/5: Health & Wellness Check\n');
      const health = await this.getHealthSummary();
      
      // Step 4: Gratitude
      console.log('\n🙏 Step 4/5: Gratitude Reflection\n');
      const gratitude = await this.getGratitude();
      
      // Step 5: Notes & Ideas
      console.log('\n💡 Step 5/5: Notes & Ideas\n');
      const notes = await this.getNotesAndIdeas();
      
      // Update the daily note
      console.log('\n📝 Updating your daily note...\n');
      await this.updateDailyNote({
        accomplishments,
        priorities,
        health,
        gratitude,
        notes
      });
      
      console.log('✅ Evening review complete! Your daily note has been updated.\n');
      
    } catch (error) {
      console.error('❌ Error during evening review:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async reviewAccomplishments() {
    // Read today's tasks from the daily note
    const result = await this.noteUpdater.readDailyNote();
    
    if (result.success && result.content) {
      // Extract completed tasks
      const completedTasks = [];
      const lines = result.content.split('\n');
      
      for (const line of lines) {
        if (line.includes('- [x]')) {
          const task = line.replace(/^.*- \[x\]\s*/, '').trim();
          if (task && !task.startsWith('Morning routine') && !task.startsWith('Exercise:')) {
            completedTasks.push(task);
          }
        }
      }
      
      if (completedTasks.length > 0) {
        console.log('Found completed tasks from today:');
        completedTasks.forEach(task => console.log(`  ✅ ${task}`));
      }
    }
    
    const additional = await this.askQuestion('\nAny other accomplishments to add? (or press Enter to skip): ');
    
    const accomplishments = [];
    
    // Add user input
    if (additional.trim()) {
      additional.split(',').forEach(item => {
        accomplishments.push(item.trim());
      });
    }
    
    return accomplishments;
  }

  async getTomorrowPriorities() {
    console.log('What are your top 3 priorities for tomorrow?');
    const priority1 = await this.askQuestion('1. ');
    const priority2 = await this.askQuestion('2. ');
    const priority3 = await this.askQuestion('3. ');
    
    const priorities = [];
    if (priority1.trim()) priorities.push(priority1.trim());
    if (priority2.trim()) priorities.push(priority2.trim());
    if (priority3.trim()) priorities.push(priority3.trim());
    
    return priorities;
  }

  async getHealthSummary() {
    const exercise = await this.askQuestion('Did you exercise today? (describe briefly or press Enter): ');
    const water = await this.askQuestion('Water intake (glasses, 1-8): ');
    const sleep = await this.askQuestion('How was your sleep last night? (1-10): ');
    
    return {
      exercise: exercise.trim() || null,
      water: water.trim() || null,
      sleep: sleep.trim() || null
    };
  }

  async getGratitude() {
    console.log('What are 3 things you\'re grateful for today?');
    const item1 = await this.askQuestion('1. ');
    const item2 = await this.askQuestion('2. ');
    const item3 = await this.askQuestion('3. ');
    
    const gratitude = [];
    if (item1.trim()) gratitude.push(item1.trim());
    if (item2.trim()) gratitude.push(item2.trim());
    if (item3.trim()) gratitude.push(item3.trim());
    
    return gratitude;
  }

  async getNotesAndIdeas() {
    const notes = await this.askQuestion('Any notes, ideas, or reflections from today? (or press Enter): ');
    return notes.trim() || null;
  }

  async updateDailyNote(data) {
    const result = await this.noteUpdater.readDailyNote();
    let noteContent;
    
    if (!result.success || !result.content) {
      console.log('Daily note not found. Creating evening review section...');
      noteContent = this.createEveningReviewSection(data);
      // Need to save this to the correct path
      const notePath = this.noteUpdater.getTodayNotePath();
      await require('fs').promises.writeFile(notePath, noteContent);
      return;
    }
    
    noteContent = result.content;
    
    // Update accomplishments section
    if (data.accomplishments.length > 0) {
      const accomplishmentsText = data.accomplishments.map(item => `- ${item}`).join('\n');
      noteContent = this.updateSection(noteContent, '### Accomplishments', accomplishmentsText);
    }
    
    // Update tomorrow's priorities
    if (data.priorities.length > 0) {
      const prioritiesText = data.priorities.map((item, i) => `${i + 1}. ${item}`).join('\n');
      noteContent = this.updateSection(noteContent, '### Tomorrow\'s Priorities', prioritiesText);
    }
    
    // Update health section
    if (data.health.exercise || data.health.water || data.health.sleep) {
      let healthUpdates = noteContent;
      
      if (data.health.exercise) {
        healthUpdates = healthUpdates.replace(
          /- \[ \] Exercise:.*/,
          `- [x] Exercise: ${data.health.exercise}`
        );
      }
      
      if (data.health.water) {
        const waterCount = parseInt(data.health.water) || 0;
        const boxes = '☑'.repeat(waterCount) + '☐'.repeat(Math.max(0, 8 - waterCount));
        healthUpdates = healthUpdates.replace(
          /- \[ \] Water intake \(8 glasses\):.*/,
          `- [x] Water intake (8 glasses): ${boxes}`
        );
      }
      
      if (data.health.sleep) {
        healthUpdates = healthUpdates.replace(
          /- Sleep quality \(1-10\):.*/,
          `- Sleep quality (1-10): ${data.health.sleep}`
        );
      }
      
      noteContent = healthUpdates;
    }
    
    // Update gratitude section
    if (data.gratitude.length > 0) {
      const gratitudeText = data.gratitude.map(item => `- ${item}`).join('\n');
      noteContent = this.updateSection(noteContent, '### Gratitude', gratitudeText);
    }
    
    // Update notes section
    if (data.notes) {
      noteContent = this.updateSection(noteContent, '### Notes & Ideas', `- ${data.notes}`);
    }
    
    // Add evening review timestamp
    const timestamp = new Date().toLocaleTimeString();
    const reviewNote = `\n*Evening review completed at ${timestamp}*`;
    
    // Add before the footer
    const footerIndex = noteContent.indexOf('\n---\n');
    if (footerIndex > -1) {
      noteContent = noteContent.slice(0, footerIndex) + reviewNote + noteContent.slice(footerIndex);
    } else {
      noteContent += reviewNote;
    }
    
    await require('fs').promises.writeFile(result.path, noteContent);
  }

  updateSection(content, sectionHeader, newContent) {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => line.trim() === sectionHeader);
    
    if (sectionIndex === -1) {
      // Section doesn't exist, add it
      const insertIndex = lines.findIndex(line => line.startsWith('---'));
      if (insertIndex > -1) {
        lines.splice(insertIndex, 0, '', sectionHeader, newContent, '');
      } else {
        lines.push('', sectionHeader, newContent);
      }
    } else {
      // Find the end of the section
      let endIndex = sectionIndex + 1;
      while (endIndex < lines.length && !lines[endIndex].startsWith('###') && !lines[endIndex].startsWith('---')) {
        endIndex++;
      }
      
      // Replace section content
      const existingContent = lines.slice(sectionIndex + 1, endIndex).filter(line => line.trim());
      if (existingContent.length === 0 || existingContent[0] === '') {
        // Empty section, just add content
        lines.splice(sectionIndex + 1, endIndex - sectionIndex - 1, newContent, '');
      } else {
        // Append to existing content
        lines.splice(endIndex, 0, newContent);
      }
    }
    
    return lines.join('\n');
  }

  createEveningReviewSection(data) {
    let content = `# Evening Review - ${new Date().toLocaleDateString()}\n\n`;
    
    if (data.accomplishments.length > 0) {
      content += '### Accomplishments\n';
      content += data.accomplishments.map(item => `- ${item}`).join('\n') + '\n\n';
    }
    
    if (data.priorities.length > 0) {
      content += '### Tomorrow\'s Priorities\n';
      content += data.priorities.map((item, i) => `${i + 1}. ${item}`).join('\n') + '\n\n';
    }
    
    if (data.gratitude.length > 0) {
      content += '### Gratitude\n';
      content += data.gratitude.map(item => `- ${item}`).join('\n') + '\n\n';
    }
    
    if (data.notes) {
      content += '### Notes & Ideas\n';
      content += `- ${data.notes}\n\n`;
    }
    
    return content;
  }
}

// Run if called directly
if (require.main === module) {
  const review = new EveningReview();
  review.run().catch(console.error);
}

module.exports = EveningReview;