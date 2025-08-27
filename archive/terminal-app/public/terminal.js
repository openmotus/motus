/**
 * Motus Terminal Client
 * Beautiful terminal interface for Life automation
 */

class MotusTerminal {
  constructor() {
    this.socket = io();
    this.commandHistory = [];
    this.historyIndex = 0;
    this.currentWizard = null;
    
    this.initializeElements();
    this.bindEvents();
    this.connectSocket();
  }

  initializeElements() {
    this.outputContainer = document.getElementById('output-container');
    this.commandInput = document.getElementById('command-input');
    this.dashboardContainer = document.getElementById('dashboard-container');
    this.wizardContainer = document.getElementById('wizard-container');
    this.connectionStatus = document.getElementById('connection-status');
  }

  bindEvents() {
    // Command input
    this.commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleCommand();
      } else if (e.key === 'ArrowUp') {
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        this.navigateHistory(1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleAutoComplete();
      }
    });

    // Dashboard close
    document.querySelector('.dashboard-close')?.addEventListener('click', () => {
      this.closeDashboard();
    });

    // Wizard controls
    document.getElementById('wizard-back')?.addEventListener('click', () => {
      this.wizardBack();
    });

    document.getElementById('wizard-next')?.addEventListener('click', () => {
      this.wizardNext();
    });

    // Window click to focus input
    document.addEventListener('click', () => {
      this.commandInput.focus();
    });
  }

  connectSocket() {
    this.socket.on('connect', () => {
      this.connectionStatus.style.background = '#27c93f';
      this.appendOutput('Connected to Motus server', 'success');
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus.style.background = '#ff5f56';
      this.appendOutput('Disconnected from server', 'error');
    });

    this.socket.on('output', (data) => {
      this.handleOutput(data);
    });

    this.socket.on('dashboard', (data) => {
      this.showDashboard(data);
    });

    this.socket.on('wizard-start', (data) => {
      this.startWizard(data);
    });

    this.socket.on('workflow-start', (data) => {
      this.showWorkflowProgress(data);
    });

    this.socket.on('workflow-step', (data) => {
      this.updateWorkflowStep(data);
    });

    this.socket.on('workflow-complete', (data) => {
      this.completeWorkflow(data);
    });

    this.socket.on('clear', () => {
      this.clearOutput();
    });
  }

  handleCommand() {
    const command = this.commandInput.value.trim();
    if (!command) return;

    // Add to history
    this.commandHistory.push(command);
    this.historyIndex = this.commandHistory.length;

    // Display command
    this.appendOutput(`motus@life > ${command}`, 'system');

    // Send to server
    this.socket.emit('command', command);

    // Clear input
    this.commandInput.value = '';
  }

  handleOutput(data) {
    if (data.type === 'workflow-list') {
      this.displayWorkflowList(data.content);
    } else if (data.type === 'help') {
      this.appendOutput(data.content, 'info');
    } else {
      this.appendOutput(data.content, data.type || 'stdout');
    }
  }

  appendOutput(text, className = '') {
    const line = document.createElement('div');
    line.className = `output-line ${className} fade-in`;
    line.textContent = text;
    this.outputContainer.appendChild(line);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
  }

  clearOutput() {
    this.outputContainer.innerHTML = '';
  }

  navigateHistory(direction) {
    const newIndex = this.historyIndex + direction;
    if (newIndex >= 0 && newIndex < this.commandHistory.length) {
      this.historyIndex = newIndex;
      this.commandInput.value = this.commandHistory[newIndex];
    } else if (newIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.commandInput.value = '';
    }
  }

  handleAutoComplete() {
    const input = this.commandInput.value;
    const commands = [
      '/motus daily-brief',
      '/motus evening-review',
      '/motus workflow list',
      '/motus workflow run',
      '/motus workflow create',
      '/motus wizard',
      '/motus dashboard',
      'clear',
      'help'
    ];

    const matches = commands.filter(cmd => cmd.startsWith(input));
    if (matches.length === 1) {
      this.commandInput.value = matches[0];
    } else if (matches.length > 1) {
      this.appendOutput(`Available completions: ${matches.join(', ')}`, 'info');
    }
  }

  // Dashboard Functions
  showDashboard(data) {
    if (data.type === 'daily-brief') {
      this.renderDailyBrief(data.data);
    } else if (data.type === 'overview') {
      this.renderOverviewDashboard(data.data);
    }
    
    this.dashboardContainer.style.display = 'block';
  }

  closeDashboard() {
    this.dashboardContainer.style.display = 'none';
  }

  renderDailyBrief(data) {
    const content = document.querySelector('.dashboard-content');
    content.innerHTML = `
      <div class="dashboard-section">
        <div class="section-title">🌤️ Weather</div>
        <div class="weather-card">
          <div class="weather-icon">☀️</div>
          <div class="weather-details">
            <div class="weather-temp">${data.weather?.temp || 'N/A'}</div>
            <div class="weather-condition">${data.weather?.condition || 'Loading...'}</div>
            <div style="color: #64748b; margin-top: 8px;">
              Feels like ${data.weather?.feelsLike || 'N/A'} | Humidity: ${data.weather?.humidity || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-title">📅 Today's Schedule</div>
        ${this.renderCalendarEvents(data.calendar)}
      </div>

      <div class="dashboard-section">
        <div class="section-title">✅ Priority Tasks</div>
        ${this.renderTasks(data.tasks)}
      </div>

      <div class="dashboard-section">
        <div class="section-title">📧 Important Emails</div>
        ${this.renderEmails(data.emails)}
      </div>

      <div class="dashboard-section">
        <div class="section-title">💡 Insights</div>
        ${this.renderInsights(data.insights)}
      </div>
    `;
  }

  renderCalendarEvents(events) {
    if (!events || events.length === 0) {
      return '<p style="color: #64748b;">No events scheduled for today</p>';
    }
    
    return events.map(event => `
      <div class="task-item">
        <div style="color: #60a5fa; min-width: 80px;">${this.getEventTime(event)}</div>
        <div class="task-text">${event.summary}</div>
        ${event.duration ? `<span style="color: #64748b;">${event.duration}</span>` : ''}
      </div>
    `).join('');
  }

  getEventTime(event) {
    if (event.start?.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'All Day';
  }

  renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
      return '<p style="color: #64748b;">No tasks for today</p>';
    }
    
    return tasks.map(task => `
      <div class="task-item">
        <div class="task-checkbox"></div>
        <div class="task-text">${task.title || task}</div>
        ${task.priority ? `<span class="task-priority ${task.priority}">${task.priority}</span>` : ''}
      </div>
    `).join('');
  }

  renderEmails(emails) {
    const emailList = emails?.important || [];
    if (emailList.length === 0) {
      return '<p style="color: #64748b;">No important emails</p>';
    }
    
    return emailList.slice(0, 3).map(email => `
      <div style="margin-bottom: 12px; padding: 12px; background: #0f0f1e; border-radius: 6px;">
        <div style="color: #60a5fa; font-weight: 600;">${email.from}</div>
        <div style="color: #e2e8f0; margin-top: 4px;">${email.subject}</div>
      </div>
    `).join('');
  }

  renderInsights(insights) {
    if (!insights || insights.length === 0) {
      return '<p style="color: #64748b;">No insights available</p>';
    }
    
    return insights.map(insight => `
      <div style="margin-bottom: 8px; color: #e2e8f0;">
        • ${insight}
      </div>
    `).join('');
  }

  // Wizard Functions
  startWizard(data) {
    this.currentWizard = {
      type: data.type,
      steps: data.steps,
      currentStep: 0,
      responses: {}
    };
    
    // Disable terminal input while wizard is active
    this.commandInput.disabled = true;
    
    this.wizardContainer.style.display = 'block';
    this.showWizardStep();
    
    // Stop event propagation to prevent terminal from capturing input
    this.wizardContainer.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    this.wizardContainer.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
  }

  showWizardStep() {
    const step = this.currentWizard.steps[this.currentWizard.currentStep];
    const progress = ((this.currentWizard.currentStep + 1) / this.currentWizard.steps.length) * 100;
    
    document.getElementById('wizard-title').textContent = step.title || 'Configuration';
    document.querySelector('.wizard-progress-bar').style.width = `${progress}%`;
    
    const content = document.getElementById('wizard-content');
    
    if (step.type === 'text' || step.type === 'multiline') {
      content.innerHTML = `
        <div class="wizard-field">
          <label class="wizard-label">${step.prompt}</label>
          ${step.type === 'multiline' 
            ? `<textarea class="wizard-input wizard-textarea" id="wizard-input"></textarea>`
            : `<input type="text" class="wizard-input" id="wizard-input">`
          }
        </div>
      `;
    } else if (step.type === 'list') {
      content.innerHTML = `
        <div class="wizard-field">
          <label class="wizard-label">${step.prompt}</label>
          ${Array.from({length: step.count || 3}, (_, i) => `
            <input type="text" class="wizard-input wizard-list-input" data-index="${i}" placeholder="${i + 1}." style="margin-bottom: 8px;">
          `).join('')}
        </div>
      `;
    } else if (step.type === 'choice') {
      content.innerHTML = `
        <div class="wizard-field">
          <label class="wizard-label">${step.prompt}</label>
          <select class="wizard-input" id="wizard-input">
            ${step.choices.map(choice => `
              <option value="${choice}">${choice}</option>
            `).join('')}
          </select>
        </div>
      `;
    } else if (Array.isArray(step.prompts)) {
      // Handle multiple prompts (like health section)
      content.innerHTML = step.prompts.map(prompt => `
        <div class="wizard-field">
          <label class="wizard-label">${prompt.prompt}</label>
          <input type="${prompt.type === 'number' ? 'number' : 'text'}" 
                 class="wizard-input" 
                 data-id="${prompt.id}"
                 ${prompt.min ? `min="${prompt.min}"` : ''}
                 ${prompt.max ? `max="${prompt.max}"` : ''}>
        </div>
      `).join('');
    }
    
    // Update button states
    document.getElementById('wizard-back').disabled = this.currentWizard.currentStep === 0;
    document.getElementById('wizard-next').textContent = 
      this.currentWizard.currentStep === this.currentWizard.steps.length - 1 ? 'Finish' : 'Next';
    
    // Focus the first input after a brief delay
    setTimeout(() => {
      const firstInput = content.querySelector('input, textarea, select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
    
    // Add enter key handler for inputs
    const inputs = content.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.wizardNext();
        }
      });
    });
  }

  wizardNext() {
    // Save current response
    const step = this.currentWizard.steps[this.currentWizard.currentStep];
    
    if (step.type === 'list') {
      // Collect all list inputs
      const listInputs = document.querySelectorAll('.wizard-list-input');
      const values = [];
      listInputs.forEach(input => {
        if (input.value.trim()) {
          values.push(input.value.trim());
        }
      });
      this.currentWizard.responses[step.id] = values;
    } else if (Array.isArray(step.prompts)) {
      // Handle multiple prompts
      const responses = {};
      step.prompts.forEach(prompt => {
        const input = document.querySelector(`[data-id="${prompt.id}"]`);
        if (input) {
          responses[prompt.id] = input.value;
        }
      });
      this.currentWizard.responses[step.id] = responses;
    } else {
      // Single input
      const input = document.getElementById('wizard-input');
      if (input) {
        this.currentWizard.responses[step.id] = input.value;
      }
    }
    
    if (this.currentWizard.currentStep < this.currentWizard.steps.length - 1) {
      this.currentWizard.currentStep++;
      this.showWizardStep();
    } else {
      // Complete wizard
      this.completeWizard();
    }
  }

  wizardBack() {
    if (this.currentWizard.currentStep > 0) {
      this.currentWizard.currentStep--;
      this.showWizardStep();
    }
  }

  completeWizard() {
    this.socket.emit('wizard-complete', {
      type: this.currentWizard.type,
      responses: this.currentWizard.responses
    });
    
    this.wizardContainer.style.display = 'none';
    this.commandInput.disabled = false;
    this.commandInput.focus();
    
    this.appendOutput(`✅ ${this.currentWizard.type} completed successfully!`, 'success');
    
    // Show the responses for debugging
    console.log('Wizard responses:', this.currentWizard.responses);
  }

  // Workflow Visualization
  displayWorkflowList(workflows) {
    this.appendOutput('\n📋 Available Workflows:\n', 'info');
    
    workflows.forEach(workflow => {
      const icon = workflow.type === 'template' ? '📝' : '⚡';
      this.appendOutput(`  ${icon} ${workflow.name} (${workflow.id})`, 'stdout');
      this.appendOutput(`      ${workflow.description}`, 'system');
      this.appendOutput(`      Schedule: ${workflow.schedule}\n`, 'system');
    });
  }

  showWorkflowProgress(data) {
    const progressHtml = `
      <div class="workflow-progress" id="workflow-${data.id}">
        <h3 style="color: #60a5fa; margin-bottom: 16px;">Running: ${data.name || data.id}</h3>
        <div id="workflow-steps"></div>
      </div>
    `;
    
    this.appendOutput('', 'stdout'); // Add spacing
    const progressDiv = document.createElement('div');
    progressDiv.innerHTML = progressHtml;
    this.outputContainer.appendChild(progressDiv);
  }

  updateWorkflowStep(data) {
    if (data.status === 'running') {
      const stepHtml = `
        <div class="workflow-step ${data.status}" id="step-${data.name.replace(/\s+/g, '-')}">
          <div class="step-icon ${data.status}">⚡</div>
          <div class="step-details">
            <div class="step-name">${data.name}</div>
            <div class="step-agent">Agent: ${data.agent} | Action: ${data.action}</div>
          </div>
        </div>
      `;
      
      const stepsContainer = document.getElementById('workflow-steps');
      if (stepsContainer) {
        const stepDiv = document.createElement('div');
        stepDiv.innerHTML = stepHtml;
        stepsContainer.appendChild(stepDiv.firstElementChild);
      }
    } else if (data.status === 'completed') {
      const stepElement = document.getElementById(`step-${data.name.replace(/\s+/g, '-')}`);
      if (stepElement) {
        stepElement.className = 'workflow-step completed';
        stepElement.querySelector('.step-icon').className = 'step-icon completed';
        stepElement.querySelector('.step-icon').textContent = '✅';
      }
    }
  }

  completeWorkflow(data) {
    this.appendOutput(`\n✅ Workflow "${data.name}" completed successfully!`, 'success');
  }
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.motusTerminal = new MotusTerminal();
});