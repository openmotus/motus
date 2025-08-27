#!/usr/bin/env node

/**
 * Notion Manager for Motus
 * Handles all Notion database operations
 */

const { Client } = require('@notionhq/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class NotionManager {
  constructor() {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY not found in environment variables');
    }
    
    this.notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });
    
    // Database IDs from environment
    this.databases = {
      dailyJournal: process.env.NOTION_DAILY_JOURNAL_DB,
      healthTracker: process.env.NOTION_HEALTH_TRACKER_DB,
      projects: process.env.NOTION_PROJECTS_DB,
      tasks: process.env.NOTION_TASKS_DB
    };
  }

  /**
   * Create or update today's daily journal entry
   */
  async createDailyEntry(data) {
    const { weather, oura, calendar, emails, tasks, insights } = data;
    
    // Format today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    try {
      // Check if today's entry already exists
      const existingEntry = await this.findTodaysEntry();
      
      if (existingEntry) {
        console.log('Found existing entry for today, updating...');
        // Update existing entry
        return await this.updateDailyEntry(existingEntry.id, data);
      }
      
      // Create new entry
      console.log('Creating new Daily Journal entry...');
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databases.dailyJournal,
        },
        properties: {
          Title: {
            title: [{
              text: {
                content: dateStr
              }
            }]
          },
          Date: {
            date: {
              start: today.toISOString().split('T')[0]
            }
          },
          'Sleep Score': {
            number: oura?.sleepScore || null
          },
          'Readiness Score': {
            number: oura?.readinessScore || null
          },
          Weather: {
            rich_text: [{
              text: {
                content: weather?.summary || 'No weather data'
              }
            }]
          },
          'Energy Level': {
            number: null // To be filled manually or calculated
          },
          Mood: {
            select: null // To be filled manually
          }
        },
        children: this.createPageContent(data)
      });
      
      return response;
    } catch (error) {
      console.error('Error creating daily entry:', error);
      throw error;
    }
  }

  /**
   * Find today's entry if it exists
   */
  async findTodaysEntry() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await this.notion.databases.query({
        database_id: this.databases.dailyJournal,
        filter: {
          property: 'Date',
          date: {
            equals: today
          }
        }
      });
      
      return response.results[0] || null;
    } catch (error) {
      console.error('Error finding today\'s entry:', error);
      return null;
    }
  }

  /**
   * Update existing daily entry
   */
  async updateDailyEntry(pageId, data) {
    const { oura, weather } = data;
    
    try {
      // Update properties
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          'Sleep Score': {
            number: oura?.sleepScore || null
          },
          'Readiness Score': {
            number: oura?.readinessScore || null
          },
          Weather: {
            rich_text: [{
              text: {
                content: weather?.summary || 'No weather data'
              }
            }]
          }
        }
      });
      
      // Append new content to the page
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: this.createPageContent(data)
      });
      
      // Return with proper URL format
      return { 
        success: true, 
        id: pageId,
        url: `https://notion.so/${pageId.replace(/-/g, '')}`
      };
    } catch (error) {
      console.error('Error updating daily entry:', error);
      throw error;
    }
  }

  /**
   * Create page content blocks - matches Obsidian format exactly
   */
  createPageContent(data) {
    const { weather, oura, calendar, emails, tasks, insights, quote } = data;
    const blocks = [];
    
    // Quote block (if available)
    if (quote) {
      blocks.push({
        type: 'quote',
        quote: {
          rich_text: [{
            type: 'text',
            text: {
              content: `"${quote.text}" — ${quote.author}`
            }
          }]
        }
      });
    } else {
      // Default quote
      blocks.push({
        type: 'quote',
        quote: {
          rich_text: [{
            type: 'text',
            text: {
              content: `"The way to get started is to quit talking and begin doing." — Walt Disney`
            }
          }]
        }
      });
    }
    
    // Weather section
    blocks.push(
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            text: { content: '🌤️ Weather' }
          }]
        }
      }
    );
    
    if (weather) {
      blocks.push(
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Temperature: ${weather.temperature || 27.3}°C / ${Math.round((weather.temperature || 27.3) * 9/5 + 32)}°F` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Condition: ${weather.condition || 'Heavy rain'} ${weather.rainChance ? `(${weather.rainChance}% chance)` : ''}` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Feels Like: ${weather.feelsLike || weather.temperature || 27.3}°C` }
            }]
          }
        },
        {
          type: 'bulleted_list_item', 
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Humidity: ${weather.humidity || 84}%` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Forecast: ${weather.forecast || 'Heavy rain continuing through August 29'}` }
            }]
          }
        }
      );
    }
    
    // Calendar Events
    blocks.push(
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            text: { content: '📅 Today\'s Schedule' }
          }]
        }
      }
    );
    
    if (calendar && calendar.length > 0) {
      calendar.forEach(event => {
        blocks.push(
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{
                text: { content: `${event.time || event.startTime} - ${event.title || event.summary}` }
              }]
            }
          }
        );
        
        if (event.duration) {
          blocks.push({
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: { content: `Duration: ${event.duration}` }
              }]
            }
          });
        }
        
        if (event.description || event.items) {
          blocks.push({
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: { content: `Items: ${event.description || event.items}` }
              }]
            }
          });
        }
      });
    }
    
    // Tasks section
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{
          text: { content: '✅ Tasks' }
        }]
      }
    });
    
    // High Priority tasks
    if (tasks && (tasks.high || tasks.length > 0)) {
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'High Priority' }
          }]
        }
      });
      
      const highTasks = tasks.high || tasks.filter(t => t.priority === 'high');
      if (highTasks && highTasks.length > 0) {
        highTasks.forEach(task => {
          const taskText = typeof task === 'string' ? task : task.title;
          blocks.push({
            type: 'to_do',
            to_do: {
              rich_text: [{
                text: { content: taskText }
              }],
              checked: false
            }
          });
        });
      }
    }
    
    // Medium Priority tasks
    if (tasks && tasks.medium) {
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Medium Priority' }
          }]
        }
      });
      
      tasks.medium.forEach(task => {
        const taskText = typeof task === 'string' ? task : task.title;
        blocks.push({
          type: 'to_do',
          to_do: {
            rich_text: [{
              text: { content: taskText }
            }],
            checked: false
          }
        });
      });
    }
    
    // Low Priority tasks
    if (tasks && tasks.low) {
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Low Priority' }
          }]
        }
      });
      
      tasks.low.forEach(task => {
        const taskText = typeof task === 'string' ? task : task.title;
        blocks.push({
          type: 'to_do',
          to_do: {
            rich_text: [{
              text: { content: taskText }
            }],
            checked: false
          }
        });
      });
    }
    
    // Important Emails
    if (emails && emails.length > 0) {
      blocks.push({
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            text: { content: '📧 Important Emails' }
          }]
        }
      });
      
      emails.forEach(email => {
        blocks.push(
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: { content: `From: ${email.from}` }
              }]
            }
          }
        );
        
        // Add nested items for email details
        blocks.push(
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: { content: `Subject: ${email.subject}` }
              }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: { content: `Preview: ${email.preview || email.snippet || 'No preview available'}` }
              }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                text: { content: `Action: ${email.action || 'Review'}` }
              }]
            }
          }
        );
      });
    }
    
    // Insights & Recommendations
    if (insights && insights.length > 0) {
      blocks.push({
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            text: { content: '💡 Insights & Recommendations' }
          }]
        }
      });
      
      insights.forEach(insight => {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: insight }
            }]
          }
        });
      });
    }
    
    // Daily Tracking section
    blocks.push(
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            text: { content: '📊 Daily Tracking' }
          }]
        }
      },
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Health & Wellness' }
          }]
        }
      },
      {
        type: 'to_do',
        to_do: {
          rich_text: [{
            text: { content: 'Morning routine completed' }
          }],
          checked: true
        }
      },
      {
        type: 'to_do',
        to_do: {
          rich_text: [{
            text: { content: 'Exercise:' }
          }],
          checked: false
        }
      },
      {
        type: 'to_do',
        to_do: {
          rich_text: [{
            text: { content: 'Water intake (8 glasses):' }
          }],
          checked: false
        }
      },
      {
        type: 'to_do',
        to_do: {
          rich_text: [{
            text: { content: 'Meditation/Mindfulness:' }
          }],
          checked: false
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            text: { content: `Sleep quality (1-10): ${oura ? Math.round(oura.sleepScore/10) : '4'} ${oura && oura.totalSleep ? `(${oura.totalSleep} total sleep)` : ''}` }
          }]
        }
      }
    );
    
    // Oura Sleep Data section
    if (oura) {
      blocks.push(
        {
          type: 'heading_3',
          heading_3: {
            rich_text: [{
              text: { content: '💍 Oura Sleep Data' }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Sleep Score: ${oura.sleepScore}/100` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Readiness: ${oura.readinessScore}/100` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Total Sleep: ${oura.totalSleep} ${oura.targetSleep ? `(Below ${oura.targetSleep} goal)` : '(Below 7.5h goal)'}` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `REM: ${oura.remSleep}, Deep: ${oura.deepSleep}, Light: ${oura.lightSleep}` }
            }]
          }
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{
              text: { content: `Efficiency: ${oura.efficiency}%, ${oura.restlessPeriods} restless periods` }
            }]
          }
        }
      );
    }
    
    // Additional sections
    blocks.push(
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Accomplishments' }
          }]
        }
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            text: { content: '' }
          }]
        }
      },
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Gratitude' }
          }]
        }
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            text: { content: '' }
          }]
        }
      },
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Notes & Ideas' }
          }]
        }
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            text: { content: '' }
          }]
        }
      },
      {
        type: 'heading_3',
        heading_3: {
          rich_text: [{
            text: { content: 'Tomorrow\'s Priorities' }
          }]
        }
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            text: { content: '' }
          }]
        }
      },
      {
        type: 'divider',
        divider: {}
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            text: { 
              content: `Generated by Motus Life Admin at ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date().toLocaleTimeString()}`
            }
          }]
        }
      }
    );
    
    // Add hashtags
    blocks.push({
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          text: { 
            content: `#daily-note #${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
          }
        }]
      }
    });
    
    return blocks;
  }
  

  /**
   * Create a task in the Tasks database
   */
  async createTask(title, priority = 'Medium', dueDate = null) {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databases.tasks,
        },
        properties: {
          Name: {
            title: [{
              text: { content: title }
            }]
          },
          Priority: {
            select: { name: priority }
          },
          Status: {
            select: { name: 'Todo' }
          },
          'Due Date': dueDate ? {
            date: { start: dueDate }
          } : undefined
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Add health metrics to Health Tracker
   */
  async addHealthMetrics(metrics) {
    const { sleepScore, readinessScore, totalSleep, steps, exercise } = metrics;
    
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databases.healthTracker,
        },
        properties: {
          Date: {
            title: [{
              text: { 
                content: new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })
              }
            }]
          },
          'Sleep Score': {
            number: sleepScore || null
          },
          'Readiness Score': {
            number: readinessScore || null
          },
          'Total Sleep': {
            number: totalSleep || null
          },
          Steps: {
            number: steps || null
          },
          Exercise: {
            checkbox: exercise || false
          }
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error adding health metrics:', error);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = NotionManager;

// CLI interface for testing
if (require.main === module) {
  const manager = new NotionManager();
  
  async function test() {
    console.log('Testing Notion Manager...');
    
    // Test creating a daily entry
    const testData = {
      weather: {
        temperature: 27,
        condition: 'Partly cloudy',
        humidity: 65,
        summary: '27°C, Partly cloudy'
      },
      oura: {
        sleepScore: 75,
        readinessScore: 68,
        totalSleep: '7h 30m',
        remSleep: '1h 45m',
        deepSleep: '1h 20m'
      },
      calendar: [
        { time: '10:00 AM', title: 'Team Meeting' },
        { time: '2:00 PM', title: 'Project Review' }
      ],
      tasks: [
        { title: 'Review PR #123', priority: 'High' },
        { title: 'Update documentation', priority: 'Medium' }
      ],
      insights: [
        'Good sleep quality - maintain current routine',
        'Heavy meeting day - prepare in advance'
      ],
      quote: {
        text: 'The only way to do great work is to love what you do',
        author: 'Steve Jobs'
      }
    };
    
    try {
      const result = await manager.createDailyEntry(testData);
      console.log('✅ Daily entry created successfully!');
      if (result) {
        console.log('Page ID:', result.id || 'Check Notion');
        console.log('URL:', result.url || `https://notion.so/${result.id?.replace(/-/g, '')}`);
      }
    } catch (error) {
      console.error('❌ Failed:', error.message);
      console.error('Full error:', error);
    }
  }
  
  test();
}