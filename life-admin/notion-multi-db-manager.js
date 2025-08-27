#!/usr/bin/env node

/**
 * Enhanced Notion Manager for Multi-Database Operations
 * Distributes daily briefing data to appropriate databases
 */

const NotionManager = require('./notion-manager');

class NotionMultiDBManager extends NotionManager {
  constructor() {
    super();
  }

  /**
   * Distribute daily briefing data to multiple databases
   */
  async distributeDailyData(data) {
    const results = {
      dailyJournal: null,
      tasks: [],
      healthTracker: null,
      projects: [],
      errors: []
    };

    try {
      console.log('📊 Distributing data to multiple Notion databases...');
      
      // 1. Create/Update Daily Journal Entry (main briefing)
      try {
        console.log('📝 Checking for existing Daily Journal entry...');
        
        // Check if today's entry already exists
        const existingEntry = await this.findTodaysEntry();
        if (existingEntry) {
          console.log('📝 Found existing entry, updating...');
          const journalEntry = await this.updateDailyEntry(existingEntry.id, data);
          results.dailyJournal = {
            success: true,
            id: existingEntry.id,
            url: `https://notion.so/${existingEntry.id.replace(/-/g, '')}`,
            action: 'updated'
          };
        } else {
          console.log('📝 Creating new Daily Journal entry...');
          const journalEntry = await this.createDailyEntry(data);
          results.dailyJournal = {
            success: true,
            id: journalEntry.id,
            url: journalEntry.url || `https://notion.so/${journalEntry.id?.replace(/-/g, '')}`,
            action: 'created'
          };
        }
        console.log('✅ Daily Journal processed');
      } catch (error) {
        console.error('❌ Daily Journal error:', error.message);
        results.errors.push(`Daily Journal: ${error.message}`);
      }

      // 2. Create Tasks in Tasks Database
      if (data.tasks) {
        console.log('✅ Creating tasks in Tasks database...');
        const allTasks = this.extractAllTasks(data.tasks);
        
        for (const task of allTasks) {
          try {
            const taskResult = await this.createTaskEntry(task);
            results.tasks.push({
              title: task.title,
              priority: task.priority,
              id: taskResult.id,
              success: true
            });
          } catch (error) {
            console.error(`❌ Task creation error: ${task.title}`, error.message);
            results.errors.push(`Task "${task.title}": ${error.message}`);
          }
        }
        console.log(`✅ Created ${results.tasks.length} tasks`);
      }

      // 3. Add Health Metrics to Health Tracker
      if (data.oura) {
        console.log('💍 Adding health metrics to Health Tracker...');
        try {
          const healthResult = await this.createHealthEntry(data.oura);
          results.healthTracker = {
            success: true,
            id: healthResult.id,
            metrics: {
              sleepScore: data.oura.sleepScore,
              readinessScore: data.oura.readinessScore,
              totalSleep: data.oura.totalSleep
            }
          };
          console.log('✅ Health metrics added');
        } catch (error) {
          console.error('❌ Health Tracker error:', error.message);
          results.errors.push(`Health Tracker: ${error.message}`);
        }
      }

      // 4. Update Projects Database (if project-related tasks exist)
      const projectTasks = this.extractProjectRelatedTasks(data);
      if (projectTasks.length > 0) {
        console.log('📁 Updating Projects database...');
        for (const project of projectTasks) {
          try {
            const projectResult = await this.updateProjectStatus(project);
            results.projects.push({
              name: project.name,
              update: project.update,
              success: true
            });
          } catch (error) {
            console.error(`❌ Project update error: ${project.name}`, error.message);
            results.errors.push(`Project "${project.name}": ${error.message}`);
          }
        }
      }

      return results;

    } catch (error) {
      console.error('❌ Distribution error:', error);
      results.errors.push(`General error: ${error.message}`);
      return results;
    }
  }

  /**
   * Extract all tasks from various formats
   */
  extractAllTasks(tasks) {
    const allTasks = [];
    
    // Handle different task structures
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (typeof task === 'string') {
          allTasks.push({
            title: task,
            priority: 'Medium',
            dueDate: new Date().toISOString().split('T')[0]
          });
        } else {
          allTasks.push({
            title: task.title || task.name || task.description,
            priority: task.priority || 'Medium',
            dueDate: task.dueDate || new Date().toISOString().split('T')[0]
          });
        }
      });
    } else if (typeof tasks === 'object') {
      // Handle categorized tasks (high, medium, low)
      if (tasks.high) {
        tasks.high.forEach(task => {
          allTasks.push({
            title: typeof task === 'string' ? task : (task.title || task),
            priority: 'High',
            dueDate: new Date().toISOString().split('T')[0]
          });
        });
      }
      if (tasks.medium) {
        tasks.medium.forEach(task => {
          allTasks.push({
            title: typeof task === 'string' ? task : (task.title || task),
            priority: 'Medium',
            dueDate: new Date().toISOString().split('T')[0]
          });
        });
      }
      if (tasks.low) {
        tasks.low.forEach(task => {
          allTasks.push({
            title: typeof task === 'string' ? task : (task.title || task),
            priority: 'Low',
            dueDate: new Date().toISOString().split('T')[0]
          });
        });
      }
    }
    
    return allTasks;
  }

  /**
   * Create task in Tasks database
   */
  async createTaskEntry(task) {
    if (!this.databases.tasks) {
      console.log('⚠️ Tasks database not configured, skipping...');
      return { skipped: true };
    }

    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databases.tasks,
        },
        properties: {
          Task: {  // Changed from 'Name' to 'Task' - the actual title property
            title: [{
              text: { content: task.title }
            }]
          },
          Priority: {
            select: { name: task.priority }
          },
          Status: {
            select: { name: 'Todo' }
          },
          'Due Date': task.dueDate ? {
            date: { start: task.dueDate }
          } : {
            date: { start: new Date().toISOString().split('T')[0] }
          },
          'Task description': {  // Added task description field
            rich_text: [{
              text: { content: task.description || task.title }
            }]
          },
          Notes: {
            rich_text: [{
              text: { content: 'Created by Motus Daily Briefing' }
            }]
          }
        }
      });
      
      console.log(`✅ Task created: ${task.title}`);
      return response;
    } catch (error) {
      // If certain properties don't exist, try with minimal properties
      console.log(`⚠️ Error creating task "${task.title}": ${error.message}`);
      console.log('Trying simplified task creation...');
      try {
        const response = await this.notion.pages.create({
          parent: {
            database_id: this.databases.tasks,
          },
          properties: {
            Task: {  // Changed from 'Name' to 'Task'
              title: [{
                text: { content: task.title }
              }]
            },
            Status: {
              select: { name: 'Todo' }
            }
          }
        });
        console.log(`✅ Task created (simplified): ${task.title}`);
        return response;
      } catch (simpleError) {
        console.error(`❌ Failed to create task: ${simpleError.message}`);
        throw simpleError;
      }
    }
  }

  /**
   * Create health entry in Health Tracker database
   */
  async createHealthEntry(ouraData) {
    if (!this.databases.healthTracker) {
      console.log('⚠️ Health Tracker database not configured, skipping...');
      return { skipped: true };
    }

    // Parse sleep duration to hours
    let sleepHours = null;
    if (ouraData.totalSleep) {
      const match = ouraData.totalSleep.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        sleepHours = parseFloat((parseInt(match[1]) + parseInt(match[2]) / 60).toFixed(2));
      }
    }

    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databases.healthTracker,
        },
        properties: {
          Name: {  // Changed from 'Date' to 'Name' - the actual title property
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
          Date: {  // Date as a date property
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          },
          'Sleep Score': {
            number: ouraData.sleepScore || null
          },
          'Sleep Duration': {  // Using the correct property name
            number: sleepHours
          },
          Exercise: {  // Default to false, can be updated later
            checkbox: false
          },
          Notes: {
            rich_text: [{
              text: { 
                content: `Oura Data - Readiness: ${ouraData.readinessScore}/100, REM: ${ouraData.remSleep || 'N/A'}, Deep: ${ouraData.deepSleep || 'N/A'}, Light: ${ouraData.lightSleep || 'N/A'}, Efficiency: ${ouraData.efficiency || 'N/A'}%, Restless: ${ouraData.restlessPeriods || 0} periods`
              }
            }]
          }
        }
      });
      
      console.log(`✅ Health metrics recorded for ${new Date().toLocaleDateString()}`);
      return response;
    } catch (error) {
      // Try with minimal properties if full schema fails
      console.log(`⚠️ Error creating health entry: ${error.message}`);
      console.log('Trying simplified health entry...');
      try {
        const response = await this.notion.pages.create({
          parent: {
            database_id: this.databases.healthTracker,
          },
          properties: {
            Name: {  // Changed to use correct title property
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
              number: ouraData.sleepScore || null
            }
          }
        });
        console.log(`✅ Health entry created (simplified)`);
        return response;
      } catch (simpleError) {
        console.error(`❌ Failed to create health entry: ${simpleError.message}`);
        throw simpleError;
      }
    }
  }

  /**
   * Extract project-related tasks from data
   */
  extractProjectRelatedTasks(data) {
    const projectTasks = [];
    
    // Look for project mentions in tasks or emails
    if (data.tasks) {
      const allTasks = this.extractAllTasks(data.tasks);
      allTasks.forEach(task => {
        if (task.title.toLowerCase().includes('project') || 
            task.title.toLowerCase().includes('review') ||
            task.title.toLowerCase().includes('darkstar') ||
            task.title.toLowerCase().includes('client')) {
          projectTasks.push({
            name: this.extractProjectName(task.title),
            update: task.title,
            status: 'In Progress'
          });
        }
      });
    }
    
    return projectTasks;
  }

  /**
   * Extract project name from task title
   */
  extractProjectName(title) {
    // Try to identify specific project names
    if (title.toLowerCase().includes('darkstar')) return 'Darkstar VC';
    if (title.toLowerCase().includes('claude')) return 'Claude Integration';
    if (title.toLowerCase().includes('motus')) return 'Motus System';
    
    // Default to generic project
    return 'General Project';
  }

  /**
   * Update project status in Projects database
   */
  async updateProjectStatus(project) {
    if (!this.databases.projects) {
      console.log('⚠️ Projects database not configured, skipping...');
      return { skipped: true };
    }

    try {
      // First, try to find existing project
      const existingProject = await this.findProject(project.name);
      
      if (existingProject) {
        // Update existing project
        return await this.notion.pages.update({
          page_id: existingProject.id,
          properties: {
            Status: {
              select: { name: project.status }
            },
            'Last Updated': {
              date: { start: new Date().toISOString().split('T')[0] }
            }
          }
        });
      } else {
        // Create new project entry
        return await this.notion.pages.create({
          parent: {
            database_id: this.databases.projects,
          },
          properties: {
            'Project Name': {  // Fixed: Using correct title property
              title: [{
                text: { content: project.name }
              }]
            },
            Status: {
              select: { name: project.status }
            },
            'Start Date': {
              date: { start: new Date().toISOString().split('T')[0] }
            },
            Notes: {
              rich_text: [{
                text: { content: `Created from task: ${project.update}` }
              }]
            }
          }
        });
      }
    } catch (error) {
      console.error('Project update error:', error);
      return { error: error.message };
    }
  }

  /**
   * Find project by name
   */
  async findProject(name) {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databases.projects,
        filter: {
          property: 'Project Name',  // Fixed: Using correct title property
          title: {
            contains: name
          }
        }
      });
      
      return response.results[0] || null;
    } catch (error) {
      console.error('Error finding project:', error);
      return null;
    }
  }

  /**
   * Generate summary of distributed data
   */
  generateSummary(results) {
    const summary = [];
    
    summary.push('📊 Data Distribution Summary\n');
    
    if (results.dailyJournal?.success) {
      summary.push(`✅ Daily Journal: Created successfully`);
      summary.push(`   URL: ${results.dailyJournal.url}\n`);
    } else if (results.errors.some(e => e.includes('Daily Journal'))) {
      summary.push(`❌ Daily Journal: Failed to create\n`);
    }
    
    if (results.tasks.length > 0) {
      summary.push(`✅ Tasks Database: ${results.tasks.length} tasks created`);
      const highPriority = results.tasks.filter(t => t.priority === 'High').length;
      const mediumPriority = results.tasks.filter(t => t.priority === 'Medium').length;
      const lowPriority = results.tasks.filter(t => t.priority === 'Low').length;
      summary.push(`   - High Priority: ${highPriority}`);
      summary.push(`   - Medium Priority: ${mediumPriority}`);
      summary.push(`   - Low Priority: ${lowPriority}\n`);
    }
    
    if (results.healthTracker?.success) {
      summary.push(`✅ Health Tracker: Metrics recorded`);
      summary.push(`   - Sleep Score: ${results.healthTracker.metrics.sleepScore}/100`);
      summary.push(`   - Readiness: ${results.healthTracker.metrics.readinessScore}/100`);
      summary.push(`   - Total Sleep: ${results.healthTracker.metrics.totalSleep}\n`);
    }
    
    if (results.projects.length > 0) {
      summary.push(`✅ Projects Database: ${results.projects.length} projects updated\n`);
    }
    
    if (results.errors.length > 0) {
      summary.push('\n⚠️ Errors encountered:');
      results.errors.forEach(error => {
        summary.push(`   - ${error}`);
      });
    }
    
    return summary.join('\n');
  }
}

// Export for use in other modules
module.exports = NotionMultiDBManager;

// CLI interface
if (require.main === module) {
  const manager = new NotionMultiDBManager();
  
  // Parse command line arguments for data
  const dataArg = process.argv[2];
  
  if (!dataArg) {
    console.error('Usage: node notion-multi-db-manager.js \'{"weather":{...}, "tasks":{...}, ...}\'');
    process.exit(1);
  }
  
  async function run() {
    try {
      const data = JSON.parse(dataArg);
      console.log('🚀 Starting multi-database distribution...\n');
      
      const results = await manager.distributeDailyData(data);
      
      // Generate and display summary
      const summary = manager.generateSummary(results);
      console.log('\n' + summary);
      
      // Exit with appropriate code
      process.exit(results.errors.length > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }
  }
  
  run();
}