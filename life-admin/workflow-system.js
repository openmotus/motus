#!/usr/bin/env node

/**
 * Life Department Workflow System
 * Manages workflows for personal life automation with sub-agent orchestration
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class LifeWorkflowSystem {
  constructor() {
    this.workflowsPath = path.join(__dirname, 'workflows');
    this.dataPath = path.join(process.env.HOME, '.motus', 'life', 'workflows');
    
    // Pre-defined Life workflow templates
    this.templates = {
      'evening-review': {
        name: 'Evening Review',
        description: 'Daily evening reflection and next-day preparation',
        schedule: '21:00',
        steps: [
          {
            name: 'Review Today',
            agent: 'life-admin',
            action: 'review-accomplishments',
            prompt: 'Review today\'s completed tasks and accomplishments from daily note'
          },
          {
            name: 'Tomorrow Prep',
            agent: 'daily-planner',
            action: 'prepare-tomorrow',
            prompt: 'Identify top 3 priorities for tomorrow based on calendar and pending tasks'
          },
          {
            name: 'Health Summary',
            agent: 'health-tracker',
            action: 'daily-summary',
            prompt: 'Summarize today\'s health metrics: exercise, water intake, sleep quality'
          },
          {
            name: 'Gratitude',
            agent: 'life-admin',
            action: 'gratitude-reflection',
            prompt: 'Prompt user for 3 things they\'re grateful for today'
          },
          {
            name: 'Update Daily Note',
            agent: 'life-admin',
            action: 'update-note',
            prompt: 'Update daily note with evening review sections'
          }
        ]
      },
      
      'weekly-planning': {
        name: 'Weekly Planning Session',
        description: 'Comprehensive weekly review and planning',
        schedule: 'Sunday 10:00',
        steps: [
          {
            name: 'Week Review',
            agent: 'goal-tracker',
            action: 'weekly-progress',
            prompt: 'Review progress on weekly goals and OKRs'
          },
          {
            name: 'Calendar Analysis',
            agent: 'daily-planner',
            action: 'analyze-week',
            prompt: 'Analyze next week\'s calendar for conflicts and optimization opportunities'
          },
          {
            name: 'Health Planning',
            agent: 'health-tracker',
            action: 'plan-workouts',
            prompt: 'Schedule workouts and meal prep for the week'
          },
          {
            name: 'Finance Check',
            agent: 'finance-manager',
            action: 'weekly-budget',
            prompt: 'Review weekly spending and adjust budget if needed'
          },
          {
            name: 'Task Prioritization',
            agent: 'daily-planner',
            action: 'prioritize-tasks',
            prompt: 'Review all pending tasks and prioritize for the week'
          },
          {
            name: 'Create Weekly Note',
            agent: 'life-admin',
            action: 'create-weekly-note',
            prompt: 'Create weekly planning note in Obsidian with all priorities and goals'
          }
        ]
      },
      
      'monthly-review': {
        name: 'Monthly Review & Planning',
        description: 'Deep monthly reflection and goal adjustment',
        schedule: 'Last Sunday 14:00',
        steps: [
          {
            name: 'Goals Review',
            agent: 'goal-tracker',
            action: 'monthly-assessment',
            prompt: 'Assess progress on monthly and quarterly goals, identify blockers'
          },
          {
            name: 'Finance Review',
            agent: 'finance-manager',
            action: 'monthly-analysis',
            prompt: 'Complete financial analysis: expenses, savings, investments'
          },
          {
            name: 'Health Metrics',
            agent: 'health-tracker',
            action: 'monthly-metrics',
            prompt: 'Analyze monthly health trends and adjust fitness goals'
          },
          {
            name: 'Habit Analysis',
            agent: 'goal-tracker',
            action: 'habit-review',
            prompt: 'Review habit tracking data and identify areas for improvement'
          },
          {
            name: 'Next Month Planning',
            agent: 'daily-planner',
            action: 'monthly-planning',
            prompt: 'Set priorities and milestones for next month'
          }
        ]
      },
      
      'health-checkin': {
        name: 'Daily Health Check-in',
        description: 'Quick health and wellness check',
        schedule: '20:00',
        steps: [
          {
            name: 'Activity Tracking',
            agent: 'health-tracker',
            action: 'log-activity',
            prompt: 'Log today\'s exercise and movement'
          },
          {
            name: 'Nutrition Log',
            agent: 'health-tracker',
            action: 'log-nutrition',
            prompt: 'Track meals and water intake'
          },
          {
            name: 'Energy Assessment',
            agent: 'health-tracker',
            action: 'assess-energy',
            prompt: 'Rate energy levels and identify patterns'
          },
          {
            name: 'Tomorrow\'s Workout',
            agent: 'health-tracker',
            action: 'plan-workout',
            prompt: 'Plan tomorrow\'s workout based on recovery and goals'
          }
        ]
      },
      
      'focus-session': {
        name: 'Deep Work Focus Session',
        description: 'Prepare for and track deep work sessions',
        schedule: 'manual',
        steps: [
          {
            name: 'Clear Distractions',
            agent: 'personal-assistant',
            action: 'focus-mode',
            prompt: 'Set do-not-disturb, close unnecessary apps, prepare workspace'
          },
          {
            name: 'Set Intention',
            agent: 'daily-planner',
            action: 'focus-intention',
            prompt: 'Define specific outcome for this focus session'
          },
          {
            name: 'Start Timer',
            agent: 'daily-planner',
            action: 'pomodoro-start',
            prompt: 'Start 90-minute focus block with break reminders'
          },
          {
            name: 'Log Session',
            agent: 'goal-tracker',
            action: 'log-focus',
            prompt: 'Log focus session results and insights'
          }
        ]
      },
      
      'learning-session': {
        name: 'Learning & Development',
        description: 'Structured learning and skill development',
        schedule: 'manual',
        steps: [
          {
            name: 'Curate Resources',
            agent: 'content-curator',
            action: 'find-learning',
            prompt: 'Find relevant learning resources based on current goals'
          },
          {
            name: 'Create Study Plan',
            agent: 'daily-planner',
            action: 'study-plan',
            prompt: 'Create structured study plan for the session'
          },
          {
            name: 'Take Notes',
            agent: 'life-admin',
            action: 'learning-notes',
            prompt: 'Create learning note in Obsidian'
          },
          {
            name: 'Practice',
            agent: 'goal-tracker',
            action: 'track-practice',
            prompt: 'Log practice time and key learnings'
          }
        ]
      }
    };
  }

  async initialize() {
    // Ensure workflow directories exist
    await fs.mkdir(this.workflowsPath, { recursive: true });
    await fs.mkdir(this.dataPath, { recursive: true });
  }

  async listWorkflows() {
    const workflows = [];
    
    // Add templates
    for (const [key, template] of Object.entries(this.templates)) {
      workflows.push({
        id: key,
        name: template.name,
        type: 'template',
        schedule: template.schedule,
        description: template.description
      });
    }
    
    // Add custom workflows
    try {
      const files = await fs.readdir(this.workflowsPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.workflowsPath, file), 'utf8');
          const workflow = JSON.parse(content);
          workflows.push({
            id: file.replace('.json', ''),
            name: workflow.name,
            type: 'custom',
            schedule: workflow.schedule || 'manual',
            description: workflow.description
          });
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
    
    return workflows;
  }

  async getWorkflow(id) {
    // Check if it's a template
    if (this.templates[id]) {
      return this.templates[id];
    }
    
    // Load custom workflow
    const workflowPath = path.join(this.workflowsPath, `${id}.json`);
    const content = await fs.readFile(workflowPath, 'utf8');
    return JSON.parse(content);
  }

  async saveWorkflow(id, workflow) {
    const workflowPath = path.join(this.workflowsPath, `${id}.json`);
    await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2));
  }

  async executeWorkflow(id, options = {}) {
    const workflow = await this.getWorkflow(id);
    const results = [];
    
    console.log(`\n🚀 Executing Workflow: ${workflow.name}`);
    console.log('─'.repeat(60));
    
    for (const step of workflow.steps) {
      console.log(`\n▶ Step: ${step.name}`);
      console.log(`  Agent: ${step.agent}`);
      console.log(`  Action: ${step.action}`);
      
      // This would integrate with Claude's Task tool
      // For now, we'll structure it for sub-agent delegation
      const result = {
        step: step.name,
        agent: step.agent,
        action: step.action,
        prompt: step.prompt,
        status: 'ready_for_execution'
      };
      
      results.push(result);
      
      // In actual implementation, this would call:
      // await Task({
      //   subagent_type: step.agent,
      //   description: step.name,
      //   prompt: step.prompt
      // });
    }
    
    return results;
  }

  async createCustomWorkflow(name, description) {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const workflow = {
      name,
      description,
      schedule: 'manual',
      created: new Date().toISOString(),
      steps: []
    };
    
    await this.saveWorkflow(id, workflow);
    return id;
  }

  async addStepToWorkflow(workflowId, step) {
    const workflow = await this.getWorkflow(workflowId);
    workflow.steps.push(step);
    await this.saveWorkflow(workflowId, workflow);
  }
}

module.exports = LifeWorkflowSystem;

// CLI interface when run directly
if (require.main === module) {
  const system = new LifeWorkflowSystem();
  const command = process.argv[2];
  
  async function run() {
    await system.initialize();
    
    switch(command) {
      case 'list':
        const workflows = await system.listWorkflows();
        console.log('\n📋 Available Life Workflows:\n');
        workflows.forEach(w => {
          const typeIcon = w.type === 'template' ? '📝' : '⚡';
          console.log(`${typeIcon} ${w.name} (${w.id})`);
          console.log(`   ${w.description}`);
          console.log(`   Schedule: ${w.schedule}\n`);
        });
        break;
        
      case 'run':
        const workflowId = process.argv[3];
        if (!workflowId) {
          console.log('Usage: workflow-system.js run <workflow-id>');
          process.exit(1);
        }
        await system.executeWorkflow(workflowId);
        break;
        
      case 'show':
        const showId = process.argv[3];
        if (!showId) {
          console.log('Usage: workflow-system.js show <workflow-id>');
          process.exit(1);
        }
        const workflow = await system.getWorkflow(showId);
        console.log('\n' + JSON.stringify(workflow, null, 2));
        break;
        
      default:
        console.log('Life Workflow System');
        console.log('Usage:');
        console.log('  workflow-system.js list         - List all workflows');
        console.log('  workflow-system.js run <id>     - Execute a workflow');
        console.log('  workflow-system.js show <id>    - Show workflow details');
    }
  }
  
  run().catch(console.error);
}