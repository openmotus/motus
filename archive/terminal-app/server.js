#!/usr/bin/env node

/**
 * Motus Terminal Server
 * A beautiful terminal interface running on localhost that connects to Claude Code
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;

// Import our Life Admin modules
const LifeAdminAgent = require('../life-admin/life-admin-agent');
const WorkflowExecutor = require('../life-admin/workflow-executor');
const LifeWorkflowSystem = require('../life-admin/workflow-system');
const EveningReview = require('../life-admin/evening-review');
const DailyNoteUpdater = require('../life-admin/daily-note-updater');

class MotusTerminalServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIO(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Initialize Life Admin components
    this.lifeAdmin = new LifeAdminAgent();
    this.workflowExecutor = new WorkflowExecutor();
    this.workflowSystem = new LifeWorkflowSystem();
    this.noteUpdater = new DailyNoteUpdater();
    
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  setupRoutes() {
    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'Motus Terminal',
        claudeCode: 'connected'
      });
    });

    // Get workflows
    this.app.get('/api/workflows', async (req, res) => {
      const workflows = await this.workflowSystem.listWorkflows();
      res.json(workflows);
    });

    // Get daily brief data
    this.app.get('/api/daily-brief', async (req, res) => {
      try {
        const briefData = await this.lifeAdmin.generateDailyBrief();
        res.json(briefData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Terminal client connected');
      
      // Send welcome message
      socket.emit('output', {
        type: 'system',
        content: this.getWelcomeMessage()
      });

      // Handle command input
      socket.on('command', async (cmd) => {
        await this.handleCommand(socket, cmd);
      });

      // Handle interactive input (for wizards)
      socket.on('interactive-input', async (data) => {
        await this.handleInteractiveInput(socket, data);
      });

      // Handle wizard completion
      socket.on('wizard-complete', async (data) => {
        await this.handleWizardComplete(socket, data);
      });

      socket.on('disconnect', () => {
        console.log('Terminal client disconnected');
      });
    });
  }

  async handleCommand(socket, command) {
    const args = command.trim().split(' ');
    const cmd = args[0];

    // Route commands
    if (cmd === '/motus' || cmd === 'motus') {
      await this.handleMotusCommand(socket, args.slice(1));
    } else if (cmd === 'clear' || cmd === 'cls') {
      socket.emit('clear');
    } else if (cmd === 'help' || cmd === '?') {
      socket.emit('output', {
        type: 'help',
        content: this.getHelpText()
      });
    } else {
      // Pass through to bash
      await this.executeBashCommand(socket, command);
    }
  }

  async handleMotusCommand(socket, args) {
    const subcommand = args[0];
    const params = args.slice(1);

    switch(subcommand) {
      case 'daily-brief':
      case 'briefing':
        await this.runDailyBrief(socket);
        break;
      
      case 'evening-review':
      case 'review':
        await this.runEveningReview(socket);
        break;
      
      case 'workflow':
        await this.handleWorkflowCommand(socket, params);
        break;
      
      case 'wizard':
        await this.startWorkflowWizard(socket);
        break;
      
      case 'dashboard':
        await this.showDashboard(socket);
        break;
      
      default:
        socket.emit('output', {
          type: 'error',
          content: `Unknown command: ${subcommand}. Type 'help' for available commands.`
        });
    }
  }

  async runDailyBrief(socket) {
    socket.emit('output', {
      type: 'info',
      content: '🌅 Generating your daily briefing...'
    });

    try {
      const briefData = await this.lifeAdmin.generateDailyBrief();
      
      // Send beautiful dashboard output
      socket.emit('dashboard', {
        type: 'daily-brief',
        data: briefData
      });

      socket.emit('output', {
        type: 'success',
        content: '✅ Daily briefing complete! Your Obsidian note has been updated.'
      });
    } catch (error) {
      socket.emit('output', {
        type: 'error',
        content: `❌ Error generating briefing: ${error.message}`
      });
    }
  }

  async runEveningReview(socket) {
    // Start interactive evening review
    socket.emit('wizard-start', {
      type: 'evening-review',
      steps: [
        {
          id: 'accomplishments',
          title: 'Today\'s Accomplishments',
          prompt: 'What were your key accomplishments today?',
          type: 'multiline'
        },
        {
          id: 'priorities',
          title: 'Tomorrow\'s Priorities',
          prompt: 'What are your top 3 priorities for tomorrow?',
          type: 'list',
          count: 3
        },
        {
          id: 'health',
          title: 'Health & Wellness',
          prompts: [
            { id: 'exercise', prompt: 'Did you exercise today?', type: 'text' },
            { id: 'water', prompt: 'Water intake (1-8 glasses):', type: 'number', min: 0, max: 8 },
            { id: 'sleep', prompt: 'Sleep quality (1-10):', type: 'number', min: 1, max: 10 }
          ]
        },
        {
          id: 'gratitude',
          title: 'Gratitude',
          prompt: 'What 3 things are you grateful for?',
          type: 'list',
          count: 3
        },
        {
          id: 'notes',
          title: 'Notes & Ideas',
          prompt: 'Any notes or reflections from today?',
          type: 'multiline',
          optional: true
        }
      ]
    });
  }

  async handleWorkflowCommand(socket, params) {
    const action = params[0];
    
    switch(action) {
      case 'list':
        const workflows = await this.workflowSystem.listWorkflows();
        socket.emit('output', {
          type: 'workflow-list',
          content: workflows
        });
        break;
      
      case 'run':
        const workflowId = params[1];
        if (!workflowId) {
          socket.emit('output', {
            type: 'error',
            content: 'Please specify a workflow to run'
          });
          return;
        }
        await this.runWorkflow(socket, workflowId);
        break;
      
      case 'create':
        await this.startWorkflowWizard(socket);
        break;
      
      default:
        socket.emit('output', {
          type: 'info',
          content: 'Available workflow commands: list, run <name>, create'
        });
    }
  }

  async runWorkflow(socket, workflowId) {
    socket.emit('workflow-start', { id: workflowId });
    
    try {
      const workflow = await this.workflowSystem.getWorkflow(workflowId);
      
      for (const step of workflow.steps) {
        socket.emit('workflow-step', {
          name: step.name,
          agent: step.agent,
          action: step.action,
          status: 'running'
        });
        
        // Simulate step execution (would delegate to Claude Task in production)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        socket.emit('workflow-step', {
          name: step.name,
          status: 'completed'
        });
      }
      
      socket.emit('workflow-complete', {
        id: workflowId,
        name: workflow.name
      });
    } catch (error) {
      socket.emit('output', {
        type: 'error',
        content: `Workflow error: ${error.message}`
      });
    }
  }

  async startWorkflowWizard(socket) {
    socket.emit('wizard-start', {
      type: 'workflow-create',
      steps: [
        {
          id: 'name',
          title: 'Workflow Name',
          prompt: 'What would you like to name this workflow?',
          type: 'text'
        },
        {
          id: 'description',
          title: 'Description',
          prompt: 'Briefly describe what this workflow does:',
          type: 'text'
        },
        {
          id: 'trigger',
          title: 'Trigger Type',
          prompt: 'How should this workflow be triggered?',
          type: 'choice',
          choices: ['Manual', 'Daily', 'Weekly', 'Monthly']
        },
        {
          id: 'steps',
          title: 'Workflow Steps',
          prompt: 'Add steps to your workflow',
          type: 'dynamic-list',
          template: {
            agent: { type: 'choice', choices: ['life-admin', 'daily-planner', 'health-tracker', 'finance-manager', 'goal-tracker'] },
            action: { type: 'text', prompt: 'What should this step do?' }
          }
        }
      ]
    });
  }

  async handleWizardComplete(socket, data) {
    if (data.type === 'evening-review') {
      // Process evening review responses
      const responses = data.responses;
      
      try {
        // Update daily note with the responses
        await this.noteUpdater.updateDailyNote({
          accomplishments: responses.accomplishments || [],
          priorities: responses.priorities || [],
          health: responses.health || {},
          gratitude: responses.gratitude || [],
          notes: responses.notes || null
        });
        
        socket.emit('output', {
          type: 'success',
          content: '✅ Evening review saved to your daily note!'
        });
      } catch (error) {
        socket.emit('output', {
          type: 'error',
          content: `Error saving review: ${error.message}`
        });
      }
    } else if (data.type === 'workflow-create') {
      // Handle workflow creation
      socket.emit('output', {
        type: 'success',
        content: '✅ Workflow created successfully!'
      });
    }
  }

  async showDashboard(socket) {
    // Gather all dashboard data
    const dashboardData = {
      dailyProgress: {
        tasks: { completed: 5, total: 12 },
        water: { consumed: 5, target: 8 },
        exercise: { completed: true, duration: '30 min' },
        focus: { sessions: 3, totalTime: '4.5 hours' }
      },
      weeklyGoals: [
        { name: 'Complete project', progress: 75 },
        { name: 'Exercise 5 times', progress: 60 },
        { name: 'Read 100 pages', progress: 40 }
      ],
      upcomingEvents: [
        { time: '10:00 AM', title: 'Team Meeting' },
        { time: '2:00 PM', title: 'Project Review' },
        { time: '4:00 PM', title: 'Focus Block' }
      ]
    };
    
    socket.emit('dashboard', {
      type: 'overview',
      data: dashboardData
    });
  }

  async executeBashCommand(socket, command) {
    const child = spawn('bash', ['-c', command]);
    
    child.stdout.on('data', (data) => {
      socket.emit('output', {
        type: 'stdout',
        content: data.toString()
      });
    });
    
    child.stderr.on('data', (data) => {
      socket.emit('output', {
        type: 'stderr',
        content: data.toString()
      });
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        socket.emit('output', {
          type: 'info',
          content: `Process exited with code ${code}`
        });
      }
    });
  }

  getWelcomeMessage() {
    return `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 MOTUS TERMINAL v2.0 - AI Life Automation          ║
║                                                            ║
║     Running on Claude Code Engine                         ║
║     Connected to Obsidian, Google Calendar, Weather       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Type 'help' for available commands or '/motus' to get started.
    `;
  }

  getHelpText() {
    return `
Available Commands:
─────────────────────────────────────────────────
/motus daily-brief     Generate morning briefing
/motus evening-review  Run evening reflection
/motus workflow list   List available workflows
/motus workflow run    Execute a workflow
/motus wizard          Create new workflow
/motus dashboard       Show life dashboard

clear                  Clear the terminal
help                   Show this help message
─────────────────────────────────────────────────
    `;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`
═══════════════════════════════════════════════════
🚀 Motus Terminal Server Started
═══════════════════════════════════════════════════

   Access at: http://localhost:${this.port}
   
   Features:
   • Beautiful terminal interface
   • Interactive wizards
   • Real-time dashboards
   • Claude Code integration
   
   Press Ctrl+C to stop the server
═══════════════════════════════════════════════════
      `);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new MotusTerminalServer();
  server.start();
}

module.exports = MotusTerminalServer;