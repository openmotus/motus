#!/usr/bin/env node

/**
 * Daily Note Updater
 * Reads and updates Obsidian daily notes based on user input
 */

const fs = require('fs').promises;
const path = require('path');

class DailyNoteUpdater {
  constructor(config = {}) {
    this.config = {
      obsidianVaultPath: process.env.OBSIDIAN_VAULT_PATH || path.join(process.env.HOME, 'Obsidian'),
      dailyNotesFolder: process.env.OBSIDIAN_DAILY_NOTES || 'Daily Notes',
      ...config
    };
  }

  /**
   * Get today's daily note path
   */
  getTodayNotePath() {
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return path.join(
      this.config.obsidianVaultPath,
      this.config.dailyNotesFolder,
      `${dateStr}.md`
    );
  }

  /**
   * Read the current daily note
   */
  async readDailyNote() {
    const notePath = this.getTodayNotePath();
    
    try {
      const content = await fs.readFile(notePath, 'utf8');
      return {
        success: true,
        path: notePath,
        content: content
      };
    } catch (error) {
      return {
        success: false,
        error: `Could not read daily note: ${error.message}`,
        path: notePath
      };
    }
  }

  /**
   * Update a checkbox item in the daily note
   */
  async updateCheckbox(itemText, checked = true, additionalNote = '') {
    const result = await this.readDailyNote();
    
    if (!result.success) {
      return result;
    }

    let content = result.content;
    const lines = content.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for unchecked items that match the text
      if (line.includes('- [ ]') && line.toLowerCase().includes(itemText.toLowerCase())) {
        if (checked) {
          // Check the box
          lines[i] = line.replace('- [ ]', '- [x]');
          
          // Add additional note if provided
          if (additionalNote) {
            // If the line has a colon, append after it
            if (lines[i].includes(':')) {
              lines[i] = lines[i].replace(/:\s*$/, `: ${additionalNote}`);
            } else {
              lines[i] = `${lines[i]} (${additionalNote})`;
            }
          }
        }
        updated = true;
        break;
      }
    }

    if (!updated) {
      return {
        success: false,
        error: `Could not find checkbox item containing: ${itemText}`
      };
    }

    // Write the updated content back
    content = lines.join('\n');
    await fs.writeFile(result.path, content);
    
    return {
      success: true,
      message: `Updated: ${itemText}`,
      path: result.path
    };
  }

  /**
   * Update water intake checkboxes
   */
  async updateWaterIntake(glasses) {
    const result = await this.readDailyNote();
    
    if (!result.success) {
      return result;
    }

    let content = result.content;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Water intake') && lines[i].includes('☐')) {
        // Replace the appropriate number of empty boxes with filled ones
        let boxes = '☐☐☐☐☐☐☐☐';
        let filledBoxes = '☑'.repeat(Math.min(glasses, 8)) + '☐'.repeat(Math.max(0, 8 - glasses));
        lines[i] = lines[i].replace(/[☐☑]{8}/, filledBoxes);
        break;
      }
    }

    content = lines.join('\n');
    await fs.writeFile(result.path, content);
    
    return {
      success: true,
      message: `Updated water intake: ${glasses} glasses`,
      path: result.path
    };
  }

  /**
   * Add content to a section
   */
  async addToSection(sectionName, content) {
    const result = await this.readDailyNote();
    
    if (!result.success) {
      return result;
    }

    let noteContent = result.content;
    const lines = noteContent.split('\n');
    let sectionFound = false;
    let insertIndex = -1;
    
    // Find the section
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`### ${sectionName}`)) {
        sectionFound = true;
        // Find where to insert (look for next empty line or next section)
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].startsWith('###') || lines[j].startsWith('---')) {
            // Found next section or footer
            insertIndex = j - 1;
            // Skip back over empty lines
            while (insertIndex > i && lines[insertIndex].trim() === '') {
              insertIndex--;
            }
            insertIndex++; // Insert after the last non-empty line
            break;
          }
        }
        if (insertIndex === -1) {
          insertIndex = lines.length - 1;
        }
        break;
      }
    }

    if (!sectionFound) {
      return {
        success: false,
        error: `Section not found: ${sectionName}`
      };
    }

    // Insert the content
    lines.splice(insertIndex, 0, content);
    
    noteContent = lines.join('\n');
    await fs.writeFile(result.path, noteContent);
    
    return {
      success: true,
      message: `Added to ${sectionName}: ${content}`,
      path: result.path
    };
  }

  /**
   * Update sleep quality rating
   */
  async updateSleepQuality(rating) {
    const result = await this.readDailyNote();
    
    if (!result.success) {
      return result;
    }

    let content = result.content;
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Sleep quality (1-10):')) {
        lines[i] = lines[i].replace(/Sleep quality \(1-10\):.*/, `Sleep quality (1-10): ${rating}`);
        break;
      }
    }

    content = lines.join('\n');
    await fs.writeFile(result.path, content);
    
    return {
      success: true,
      message: `Updated sleep quality: ${rating}/10`,
      path: result.path
    };
  }

  /**
   * Parse user input and update accordingly
   */
  async parseAndUpdate(userInput) {
    const input = userInput.toLowerCase();
    
    // Exercise completion
    if (input.includes('exercise') || input.includes('workout') || input.includes('gym')) {
      const timeMatch = input.match(/(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s*-\s*(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i);
      const durationMatch = input.match(/(\d+)\s*(?:min|minute|hour)/i);
      
      let note = '';
      if (timeMatch) {
        note = `${timeMatch[1]} - ${timeMatch[2]}`;
      } else if (durationMatch) {
        note = durationMatch[0];
      }
      
      return await this.updateCheckbox('exercise', true, note);
    }
    
    // Water intake
    if (input.includes('water') || input.includes('drank')) {
      const glassMatch = input.match(/(\d+)\s*(?:glass|glasses|cups?)/i);
      if (glassMatch) {
        return await this.updateWaterIntake(parseInt(glassMatch[1]));
      }
    }
    
    // Meditation
    if (input.includes('meditat') || input.includes('mindfulness')) {
      const timeMatch = input.match(/(\d+)\s*(?:min|minute)/i);
      const note = timeMatch ? timeMatch[0] : 'completed';
      return await this.updateCheckbox('meditation', true, note);
    }
    
    // Morning routine
    if (input.includes('morning routine')) {
      return await this.updateCheckbox('morning routine', true, 'completed');
    }
    
    // Sleep quality
    if (input.includes('sleep') && input.match(/\d+/)) {
      const ratingMatch = input.match(/(\d+)/);
      if (ratingMatch) {
        const rating = Math.min(10, Math.max(1, parseInt(ratingMatch[1])));
        return await this.updateSleepQuality(rating);
      }
    }
    
    // Accomplishments
    if (input.includes('accomplish') || input.includes('completed') || input.includes('finished')) {
      const accomplishment = userInput.replace(/.*(?:accomplished|completed|finished)/i, '').trim();
      if (accomplishment) {
        return await this.addToSection('Accomplishments', `- ${accomplishment}`);
      }
    }
    
    // Gratitude
    if (input.includes('grateful') || input.includes('gratitude') || input.includes('thankful')) {
      const gratitude = userInput.replace(/.*(?:grateful|gratitude|thankful)\s*(?:for)?/i, '').trim();
      if (gratitude) {
        return await this.addToSection('Gratitude', `- ${gratitude}`);
      }
    }
    
    // Notes & Ideas
    if (input.includes('idea') || input.includes('note')) {
      const note = userInput.replace(/.*(?:idea|note):?/i, '').trim();
      if (note) {
        return await this.addToSection('Notes & Ideas', `- ${note}`);
      }
    }
    
    // Tomorrow's priorities
    if (input.includes('tomorrow')) {
      const priority = userInput.replace(/.*tomorrow:?/i, '').trim();
      if (priority) {
        return await this.addToSection("Tomorrow's Priorities", `- ${priority}`);
      }
    }
    
    return {
      success: false,
      error: 'Could not understand the update request. Try: "completed exercise from 2-3pm", "drank 5 glasses of water", "sleep quality 8", etc.'
    };
  }
}

module.exports = DailyNoteUpdater;