/**
 * Registry Manager
 *
 * Central registry management for departments, agents, and workflows.
 * Provides CRUD operations, validation, querying, search, statistics,
 * and import/export. All registry data is persisted as JSON files in
 * `config/registries/`.
 *
 * @example
 * const registry = new RegistryManager('/path/to/motus');
 * await registry.load();
 * const dept = await registry.addDepartment({ name: 'analytics', displayName: 'Analytics', description: 'Data pipelines' });
 * const stats = await registry.getStatistics();
 */

const fs = require('fs').promises;
const path = require('path');
const TemplateEngine = require('./template-engine');
const OAuthRegistry = require('./oauth-registry');

/** Valid agent types that can be registered. */
const VALID_AGENT_TYPES = ['data-fetcher', 'orchestrator', 'specialist'];

class RegistryManager {
  constructor(basePath = null) {
    this.basePath = basePath || path.join(__dirname, '..');
    this.registriesPath = path.join(this.basePath, 'config', 'registries');
    this.templateEngine = new TemplateEngine();
    this.oauthRegistry = new OAuthRegistry(this.basePath);

    // Registry file paths
    this.paths = {
      departments: path.join(this.registriesPath, 'departments.json'),
      agents: path.join(this.registriesPath, 'agents.json'),
      workflows: path.join(this.registriesPath, 'workflows.json')
    };

    // In-memory registry data
    this.departments = { departments: {}, metadata: {} };
    this.agents = { agents: {}, metadata: {} };
    this.workflows = { workflows: {}, metadata: {} };

    this.loaded = false;
  }

  /**
   * Load all registries (departments, agents, workflows) from JSON files on
   * disk. Creates the registries directory if it does not exist.
   *
   * @returns {Promise<boolean>} `true` when loading succeeds.
   * @throws {Error} If a registry file exists but cannot be parsed.
   */
  async load() {
    try {
      // Ensure registries directory exists
      await fs.mkdir(this.registriesPath, { recursive: true });

      // Load departments
      try {
        const deptData = await fs.readFile(this.paths.departments, 'utf8');
        this.departments = JSON.parse(deptData);
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.departments = { departments: {}, metadata: { totalDepartments: 0, lastUpdated: new Date().toISOString() } };
        } else {
          throw error;
        }
      }

      // Load agents
      try {
        const agentData = await fs.readFile(this.paths.agents, 'utf8');
        this.agents = JSON.parse(agentData);
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.agents = { agents: {}, metadata: { totalAgents: 0, lastUpdated: new Date().toISOString() } };
        } else {
          throw error;
        }
      }

      // Load workflows
      try {
        const workflowData = await fs.readFile(this.paths.workflows, 'utf8');
        this.workflows = JSON.parse(workflowData);
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.workflows = { workflows: {}, metadata: { totalWorkflows: 0, lastUpdated: new Date().toISOString() } };
        } else {
          throw error;
        }
      }

      this.loaded = true;
      return true;
    } catch (error) {
      console.error('Error loading registries:', error);
      throw error;
    }
  }

  /**
   * Persist all in-memory registries to their JSON files on disk.
   *
   * @returns {Promise<boolean>} `true` when saving succeeds.
   * @throws {Error} If any file cannot be written.
   */
  async save() {
    try {
      // Update metadata
      this.departments.metadata.lastUpdated = new Date().toISOString();
      this.agents.metadata.lastUpdated = new Date().toISOString();
      this.workflows.metadata.lastUpdated = new Date().toISOString();

      // Save each registry
      await Promise.all([
        fs.writeFile(this.paths.departments, JSON.stringify(this.departments, null, 2)),
        fs.writeFile(this.paths.agents, JSON.stringify(this.agents, null, 2)),
        fs.writeFile(this.paths.workflows, JSON.stringify(this.workflows, null, 2))
      ]);

      return true;
    } catch (error) {
      console.error('Error saving registries:', error);
      throw error;
    }
  }

  // ========================================
  // DEPARTMENT OPERATIONS
  // ========================================

  /**
   * Register a new department and generate its admin agent file.
   *
   * @param {Object} data - Department definition.
   * @param {string} data.name - Kebab-case identifier (e.g. `marketing`).
   * @param {string} data.displayName - Human-readable name.
   * @param {string} data.description - What the department does.
   * @param {Array} [data.integrations=[]] - OAuth/API integrations.
   * @param {Array} [data.responsibilities=[]] - Responsibility groups.
   * @returns {Promise<Object>} The created department record.
   * @throws {Error} If required fields are missing or the name is taken.
   */
  async addDepartment(data) {
    await this.ensureLoaded();

    const { name, displayName, description, created, status = 'active', version = '1.0.0', integrations = [], responsibilities = [] } = data;

    const missing = [];
    if (!name) missing.push('name');
    if (!displayName) missing.push('displayName');
    if (!description) missing.push('description');
    if (missing.length > 0) {
      throw new Error(`Missing required department fields: ${missing.join(', ')}. Pass an object with {name, displayName, description} to addDepartment().`);
    }

    if (this.departments.departments[name]) {
      throw new Error(`Department '${name}' already exists`);
    }

    this.departments.departments[name] = {
      name,
      displayName,
      description,
      created: created || new Date().toISOString(),
      status,
      version,
      agents: [],
      workflows: [],
      integrations,
      responsibilities
    };

    this.departments.metadata.totalDepartments = Object.keys(this.departments.departments).length;

    // *** CRITICAL: Generate department master agent file ***
    await this._generateDepartmentAgentFile(this.departments.departments[name]);

    // *** CRITICAL: Register OAuth2 integrations with OAuth Manager ***
    await this._registerOAuthIntegrations(integrations);

    await this.save();
    return this.departments.departments[name];
  }

  /**
   * Merge updates into an existing department.
   *
   * @param {string} name - Department identifier.
   * @param {Object} updates - Fields to merge into the department record.
   * @returns {Promise<Object>} The updated department record.
   * @throws {Error} If the department does not exist or updates is not an object.
   */
  async updateDepartment(name, updates) {
    await this.ensureLoaded();

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a non-null object.');
    }

    if ('name' in updates && updates.name !== name) {
      throw new Error(`Cannot rename department via update. The 'name' field is an immutable key. Create a new department instead.`);
    }

    if (!this.departments.departments[name]) {
      throw new Error(`Department '${name}' not found`);
    }

    this.departments.departments[name] = {
      ...this.departments.departments[name],
      ...updates,
      updated: new Date().toISOString()
    };

    await this.save();
    return this.departments.departments[name];
  }

  /**
   * Look up a department by name.
   *
   * @param {string} name - Department identifier.
   * @returns {Object|null} The department record, or `null` if not found.
   */
  getDepartment(name) {
    this.ensureLoaded();
    return this.departments.departments[name] || null;
  }

  /**
   * List all departments, optionally filtered by status.
   *
   * @param {Object} [filters={}] - Optional filter criteria.
   * @param {string} [filters.status] - Only return departments with this status.
   * @returns {Promise<Object[]>} Array of department records.
   */
  async listDepartments(filters = {}) {
    await this.ensureLoaded();

    let depts = Object.values(this.departments.departments);

    if (filters.status) {
      depts = depts.filter(d => d.status === filters.status);
    }

    return depts;
  }

  /**
   * Check whether a department with the given name exists.
   *
   * @param {string} name - Department identifier.
   * @returns {boolean}
   */
  departmentExists(name) {
    this.ensureLoaded();
    return !!this.departments.departments[name];
  }

  /**
   * Generate department master agent file (CRITICAL: prevents registry/file desync)
   * @private
   */
  async _generateDepartmentAgentFile(department) {
    const { name, displayName, description, integrations, responsibilities } = department;

    const agentDefPath = path.join(this.basePath, '.claude', 'agents', `${name}-admin.md`);

    const context = {
      name: `${name}-admin`,
      displayName: `${displayName} Admin`,
      description: `Master agent for ${displayName} department`,
      department: name,
      departmentDescription: description,
      integrations: integrations || [],
      responsibilities: responsibilities || []
    };

    await this.templateEngine.renderToFile('department/department-agent.md', context, agentDefPath);
    console.log(`✅ Generated department agent: ${agentDefPath}`);

    return agentDefPath;
  }

  /**
   * Register OAuth2 integrations with OAuth Manager (CRITICAL: enables OAuth buttons)
   * @private
   */
  async _registerOAuthIntegrations(integrations) {
    if (!integrations || integrations.length === 0) {
      return;
    }

    // Load OAuth registry
    await this.oauthRegistry.load();

    // Filter OAuth2 integrations
    const oauthIntegrations = integrations.filter(i => i.type === 'oauth2');

    if (oauthIntegrations.length === 0) {
      console.log('ℹ  No OAuth2 integrations to register');
      return;
    }

    console.log(`\n🔐 Registering ${oauthIntegrations.length} OAuth2 integration(s)...`);

    for (const integration of oauthIntegrations) {
      try {
        // Get standard config if available
        const standardConfig = OAuthRegistry.getStandardConfig(integration.name);

        if (!standardConfig) {
          console.log(`  ⚠️  ${integration.name} is not OAuth2 or config not found, skipping`);
          continue;
        }

        // Check if already exists
        const exists = await this.oauthRegistry.integrationExists(standardConfig.id);
        if (exists) {
          console.log(`  ✓ ${integration.name} already registered in OAuth Manager`);
          continue;
        }

        // Build full integration config
        const fullConfig = {
          ...standardConfig,
          name: integration.name,
          envVars: integration.envVars
        };

        // Register with OAuth Manager
        await this.oauthRegistry.addIntegration(fullConfig);

      } catch (error) {
        console.error(`  ❌ Failed to register ${integration.name}:`, error.message);
      }
    }

    console.log('✅ OAuth integration registration complete\n');
  }

  // ========================================
  // AGENT OPERATIONS
  // ========================================

  /**
   * Register a new agent and generate its definition file(s).
   *
   * @param {Object} data - Agent definition.
   * @param {string} data.name - Kebab-case identifier.
   * @param {string} data.displayName - Human-readable name.
   * @param {string} data.department - Owning department name (must exist).
   * @param {string} data.type - One of `data-fetcher`, `orchestrator`, `specialist`.
   * @param {string} data.description - What the agent does.
   * @param {string[]} [data.tools] - Claude Code tools the agent may use.
   * @param {string} [data.model='sonnet'] - Model to use.
   * @param {string|null} [data.script=null] - Path to implementation script.
   * @returns {Promise<Object>} The created agent record.
   * @throws {Error} If required fields are missing, the department doesn't exist,
   *   the type is invalid, or the agent name is taken.
   */
  async addAgent(data) {
    await this.ensureLoaded();

    const { name, displayName, department, type, description, tools, model = 'sonnet', script = null, created } = data;

    const missingAgent = [];
    if (!name) missingAgent.push('name');
    if (!displayName) missingAgent.push('displayName');
    if (!department) missingAgent.push('department');
    if (!type) missingAgent.push('type');
    if (!description) missingAgent.push('description');
    if (missingAgent.length > 0) {
      throw new Error(`Missing required agent fields: ${missingAgent.join(', ')}. Pass an object with {name, displayName, department, type, description} to addAgent().`);
    }

    if (!this.departments.departments[department]) {
      const available = Object.keys(this.departments.departments);
      throw new Error(`Department '${department}' does not exist. Available departments: ${available.length ? available.join(', ') : '(none — create one first with addDepartment())'}`);
    }

    if (!VALID_AGENT_TYPES.includes(type)) {
      throw new Error(`Invalid agent type: '${type}'. Must be one of: ${VALID_AGENT_TYPES.join(', ')}`);
    }

    if (this.agents.agents[name]) {
      throw new Error(`Agent '${name}' already exists`);
    }

    this.agents.agents[name] = {
      name,
      displayName,
      department,
      type,
      description,
      tools: tools || [],
      model,
      script,
      created: created || new Date().toISOString(),
      version: data.version || '1.0.0',
      usedInWorkflows: []
    };

    // Add agent to department's agent list
    if (!this.departments.departments[department].agents.includes(name)) {
      this.departments.departments[department].agents.push(name);
    }

    this.agents.metadata.totalAgents = Object.keys(this.agents.agents).length;

    // *** CRITICAL: Generate agent definition file ***
    await this._generateAgentFiles(this.agents.agents[name]);

    await this.save();
    return this.agents.agents[name];
  }

  /**
   * Merge updates into an existing agent.
   *
   * @param {string} name - Agent identifier.
   * @param {Object} updates - Fields to merge.
   * @returns {Promise<Object>} The updated agent record.
   * @throws {Error} If the agent does not exist or updates is not an object.
   */
  async updateAgent(name, updates) {
    await this.ensureLoaded();

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a non-null object.');
    }

    if ('name' in updates && updates.name !== name) {
      throw new Error(`Cannot rename agent via update. The 'name' field is an immutable key. Create a new agent instead.`);
    }

    if (!this.agents.agents[name]) {
      throw new Error(`Agent '${name}' not found`);
    }

    this.agents.agents[name] = {
      ...this.agents.agents[name],
      ...updates,
      updated: new Date().toISOString()
    };

    await this.save();
    return this.agents.agents[name];
  }

  /**
   * Look up an agent by name.
   *
   * @param {string} name - Agent identifier.
   * @returns {Object|null} The agent record, or `null` if not found.
   */
  getAgent(name) {
    this.ensureLoaded();
    return this.agents.agents[name] || null;
  }

  /**
   * List all agents belonging to a specific department.
   *
   * @param {string} departmentName - Department identifier.
   * @returns {Promise<Object[]>} Array of agent records.
   */
  async listAgentsByDepartment(departmentName) {
    await this.ensureLoaded();

    return Object.values(this.agents.agents)
      .filter(agent => agent.department === departmentName);
  }

  /**
   * List all agents, optionally filtered by department and/or type.
   *
   * @param {Object} [filters={}] - Optional filter criteria.
   * @param {string} [filters.department] - Filter by department name.
   * @param {string} [filters.type] - Filter by agent type.
   * @returns {Promise<Object[]>} Array of agent records.
   */
  async listAgents(filters = {}) {
    await this.ensureLoaded();

    let agents = Object.values(this.agents.agents);

    if (filters.department) {
      agents = agents.filter(a => a.department === filters.department);
    }

    if (filters.type) {
      agents = agents.filter(a => a.type === filters.type);
    }

    return agents;
  }

  /**
   * Check whether an agent with the given name exists.
   *
   * @param {string} name - Agent identifier.
   * @returns {boolean}
   */
  agentExists(name) {
    this.ensureLoaded();
    return !!this.agents.agents[name];
  }

  /**
   * Generate agent definition files (CRITICAL: prevents registry/file desync)
   * @private
   */
  async _generateAgentFiles(agent) {
    const { name, displayName, department, type, description, tools, model, script } = agent;

    // 1. Generate agent definition file (.md)
    const agentDefPath = path.join(this.basePath, '.claude', 'agents', `${name}.md`);

    // Determine template based on agent type
    let templateName;
    if (type === 'orchestrator') {
      templateName = 'agent/orchestrator-agent.md';
    } else if (type === 'data-fetcher') {
      templateName = 'agent/data-fetcher-agent.md';
    } else if (type === 'specialist') {
      templateName = 'agent/specialist-agent.md';
    } else {
      throw new Error(`Unknown agent type: '${type}'. Valid types are: ${VALID_AGENT_TYPES.join(', ')}`);
    }

    const agentContext = {
      name,
      displayName,
      description,
      department,
      type,
      tools: tools || ['Read', 'Write', 'Task'],
      model: model || 'sonnet',
      scriptPath: script
    };

    await this.templateEngine.renderToFile(templateName, agentContext, agentDefPath);
    console.log(`✅ Generated agent definition: ${agentDefPath}`);

    // 2. Generate implementation script for data-fetchers
    if (type === 'data-fetcher' && script) {
      // Handle both absolute and relative script paths
      const scriptPath = path.isAbsolute(script) ? script : path.join(this.basePath, script);

      // Only generate if script doesn't already exist
      try {
        await fs.access(scriptPath);
        console.log(`⚠️  Script already exists: ${scriptPath}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Generate from template
          await this.templateEngine.renderToFile(
            'agent/data-fetcher-script.js',
            agentContext,
            scriptPath
          );

          // Make executable
          await fs.chmod(scriptPath, 0o755);
          console.log(`✅ Generated implementation script: ${scriptPath}`);
        } else {
          throw error;
        }
      }
    }

    return { agentDefPath, scriptPath: script };
  }

  // ========================================
  // WORKFLOW OPERATIONS
  // ========================================

  /**
   * Register a new workflow in a department.
   *
   * @param {Object} data - Workflow definition.
   * @param {string} data.name - Kebab-case identifier.
   * @param {string} data.displayName - Human-readable name.
   * @param {string} data.department - Owning department name (must exist).
   * @param {string} data.description - What the workflow does.
   * @param {string[]} [data.agents=[]] - Agent names used by this workflow.
   * @param {Object} [data.trigger] - Trigger config (`{type, schedule}`).
   * @param {Object} [data.output] - Output config (`{type, destination}`).
   * @returns {Promise<Object>} The created workflow record.
   * @throws {Error} If required fields are missing, the department doesn't exist,
   *   or the workflow name is taken in that department.
   */
  async addWorkflow(data) {
    await this.ensureLoaded();

    const { name, displayName, department, description, orchestrator, agents, trigger, output, estimatedDuration, created } = data;

    const missingWf = [];
    if (!name) missingWf.push('name');
    if (!displayName) missingWf.push('displayName');
    if (!department) missingWf.push('department');
    if (!description) missingWf.push('description');
    if (missingWf.length > 0) {
      throw new Error(`Missing required workflow fields: ${missingWf.join(', ')}. Pass an object with {name, displayName, department, description} to addWorkflow().`);
    }

    if (!this.departments.departments[department]) {
      const available = Object.keys(this.departments.departments);
      throw new Error(`Department '${department}' does not exist. Available departments: ${available.length ? available.join(', ') : '(none — create one first with addDepartment())'}`);
    }

    if (agents !== undefined && agents !== null && !Array.isArray(agents)) {
      throw new Error(`Workflow agents must be an array of agent names, got ${typeof agents}.`);
    }

    // Create unique workflow ID (department-workflow)
    const workflowId = `${department}-${name}`;

    if (this.workflows.workflows[workflowId]) {
      throw new Error(`Workflow '${name}' already exists in department '${department}'`);
    }

    this.workflows.workflows[workflowId] = {
      name,
      displayName,
      department,
      description,
      orchestrator: orchestrator || `${department}-orchestrator`,
      agents: agents || [],
      trigger: trigger || { type: 'manual', enabled: true },
      output: output || { type: 'console', destination: null },
      estimatedDuration: estimatedDuration || 'unknown',
      created: created || new Date().toISOString(),
      version: data.version || '1.0.0',
      lastRun: null,
      runCount: 0,
      successRate: 1.0
    };

    // Add workflow to department's workflow list
    if (!this.departments.departments[department].workflows.includes(name)) {
      this.departments.departments[department].workflows.push(name);
    }

    // Update agent usage tracking
    if (agents && Array.isArray(agents) && agents.length > 0) {
      agents.forEach(agentName => {
        if (this.agents.agents[agentName]) {
          if (!this.agents.agents[agentName].usedInWorkflows.includes(name)) {
            this.agents.agents[agentName].usedInWorkflows.push(name);
          }
        }
      });
    }

    this.workflows.metadata.totalWorkflows = Object.keys(this.workflows.workflows).length;

    await this.save();
    return this.workflows.workflows[workflowId];
  }

  /**
   * Merge updates into an existing workflow.
   *
   * @param {string} department - Department identifier.
   * @param {string} name - Workflow identifier.
   * @param {Object} updates - Fields to merge into the workflow record.
   * @returns {Promise<Object>} The updated workflow record.
   * @throws {Error} If the workflow does not exist or updates is not an object.
   */
  async updateWorkflow(department, name, updates) {
    await this.ensureLoaded();

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a non-null object.');
    }

    if ('name' in updates && updates.name !== name) {
      throw new Error(`Cannot rename workflow via update. The 'name' field is an immutable key. Create a new workflow instead.`);
    }

    if ('department' in updates && updates.department !== department) {
      throw new Error(`Cannot move workflow to a different department via update. Create a new workflow in the target department instead.`);
    }

    const workflowId = `${department}-${name}`;

    if (!this.workflows.workflows[workflowId]) {
      throw new Error(`Workflow '${name}' not found in department '${department}'`);
    }

    this.workflows.workflows[workflowId] = {
      ...this.workflows.workflows[workflowId],
      ...updates,
      updated: new Date().toISOString()
    };

    await this.save();
    return this.workflows.workflows[workflowId];
  }

  /**
   * Look up a workflow by department and name.
   *
   * @param {string} department - Department identifier.
   * @param {string} name - Workflow identifier.
   * @returns {Object|null} The workflow record, or `null` if not found.
   */
  getWorkflow(department, name) {
    this.ensureLoaded();
    const workflowId = `${department}-${name}`;
    return this.workflows.workflows[workflowId] || null;
  }

  /**
   * List all workflows belonging to a specific department.
   *
   * @param {string} departmentName - Department identifier.
   * @returns {Promise<Object[]>} Array of workflow records.
   */
  async listWorkflowsByDepartment(departmentName) {
    await this.ensureLoaded();

    return Object.values(this.workflows.workflows)
      .filter(workflow => workflow.department === departmentName);
  }

  /**
   * List all workflows, optionally filtered by department and/or trigger type.
   *
   * @param {Object} [filters={}] - Optional filter criteria.
   * @param {string} [filters.department] - Filter by department name.
   * @param {string} [filters.type] - Filter by trigger type (`manual`, `scheduled`).
   * @returns {Promise<Object[]>} Array of workflow records.
   */
  async listWorkflows(filters = {}) {
    await this.ensureLoaded();

    let workflows = Object.values(this.workflows.workflows);

    if (filters.department) {
      workflows = workflows.filter(w => w.department === filters.department);
    }

    if (filters.type) {
      workflows = workflows.filter(w => w.trigger.type === filters.type);
    }

    return workflows;
  }

  /**
   * Find all workflows that include a specific agent.
   *
   * @param {string} agentName - Agent identifier to search for.
   * @returns {Promise<Object[]>} Array of workflow records that use this agent.
   */
  async getWorkflowsByAgent(agentName) {
    await this.ensureLoaded();

    return Object.values(this.workflows.workflows)
      .filter(workflow => workflow.agents.includes(agentName));
  }

  /**
   * Check whether a workflow exists in a department.
   *
   * @param {string} department - Department identifier.
   * @param {string} name - Workflow identifier.
   * @returns {boolean}
   */
  workflowExists(department, name) {
    this.ensureLoaded();
    const workflowId = `${department}-${name}`;
    return !!this.workflows.workflows[workflowId];
  }

  // ========================================
  // STATISTICS & QUERIES
  // ========================================

  /**
   * Get aggregate statistics across all registries.
   *
   * @returns {Promise<Object>} Stats with `departments`, `agents`, `workflows`,
   *   and `integrations` counts, including breakdowns by type and department.
   */
  async getStatistics() {
    await this.ensureLoaded();

    const departments = Object.values(this.departments.departments);
    const agents = Object.values(this.agents.agents);
    const workflows = Object.values(this.workflows.workflows);

    return {
      departments: {
        total: departments.length,
        active: departments.filter(d => d.status === 'active').length,
        inactive: departments.filter(d => d.status !== 'active').length
      },
      agents: {
        total: agents.length,
        byType: {
          'data-fetcher': agents.filter(a => a.type === 'data-fetcher').length,
          'orchestrator': agents.filter(a => a.type === 'orchestrator').length,
          'specialist': agents.filter(a => a.type === 'specialist').length
        },
        byDepartment: departments.reduce((acc, dept) => {
          acc[dept.name] = agents.filter(a => a.department === dept.name).length;
          return acc;
        }, {})
      },
      workflows: {
        total: workflows.length,
        byType: {
          manual: workflows.filter(w => w.trigger.type === 'manual').length,
          scheduled: workflows.filter(w => w.trigger.type === 'scheduled').length
        },
        byDepartment: departments.reduce((acc, dept) => {
          acc[dept.name] = workflows.filter(w => w.department === dept.name).length;
          return acc;
        }, {})
      },
      integrations: {
        total: departments.reduce((sum, dept) => sum + (dept.integrations?.length || 0), 0)
      }
    };
  }

  /**
   * Validate referential integrity across all registries. Checks that agents
   * and workflows reference existing departments, and department lists match
   * the actual agent/workflow records.
   *
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validate() {
    await this.ensureLoaded();

    const errors = [];

    // Check that all agents reference valid departments
    Object.values(this.agents.agents).forEach(agent => {
      if (!this.departments.departments[agent.department]) {
        errors.push(`Agent '${agent.name}' references non-existent department '${agent.department}'`);
      }
    });

    // Check that all workflows reference valid departments
    Object.values(this.workflows.workflows).forEach(workflow => {
      if (!this.departments.departments[workflow.department]) {
        errors.push(`Workflow '${workflow.name}' references non-existent department '${workflow.department}'`);
      }

      // Check that workflow agents exist
      workflow.agents.forEach(agentName => {
        if (!this.agents.agents[agentName]) {
          errors.push(`Workflow '${workflow.name}' references non-existent agent '${agentName}'`);
        }
      });
    });

    // Check that department agent lists match reality
    Object.entries(this.departments.departments).forEach(([deptName, dept]) => {
      dept.agents.forEach(agentName => {
        if (!this.agents.agents[agentName]) {
          errors.push(`Department '${deptName}' lists non-existent agent '${agentName}'`);
        }
      });

      dept.workflows.forEach(workflowName => {
        const workflowId = `${deptName}-${workflowName}`;
        if (!this.workflows.workflows[workflowId]) {
          errors.push(`Department '${deptName}' lists non-existent workflow '${workflowName}'`);
        }
      });
    });

    // Check metadata counter consistency
    const actualDeptCount = Object.keys(this.departments.departments).length;
    const actualAgentCount = Object.keys(this.agents.agents).length;
    const actualWorkflowCount = Object.keys(this.workflows.workflows).length;

    if (this.departments.metadata.totalDepartments !== undefined &&
        this.departments.metadata.totalDepartments !== actualDeptCount) {
      errors.push(`Metadata totalDepartments (${this.departments.metadata.totalDepartments}) does not match actual count (${actualDeptCount})`);
    }

    if (this.agents.metadata.totalAgents !== undefined &&
        this.agents.metadata.totalAgents !== actualAgentCount) {
      errors.push(`Metadata totalAgents (${this.agents.metadata.totalAgents}) does not match actual count (${actualAgentCount})`);
    }

    if (this.workflows.metadata.totalWorkflows !== undefined &&
        this.workflows.metadata.totalWorkflows !== actualWorkflowCount) {
      errors.push(`Metadata totalWorkflows (${this.workflows.metadata.totalWorkflows}) does not match actual count (${actualWorkflowCount})`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that all registry entries have corresponding files
   * CRITICAL: Prevents registry/file desynchronization
   */
  async validateFiles() {
    await this.ensureLoaded();

    const errors = [];
    const warnings = [];

    // Check department agent files
    for (const [deptName, dept] of Object.entries(this.departments.departments)) {
      const agentDefPath = path.join(this.basePath, '.claude', 'agents', `${deptName}-admin.md`);
      try {
        await fs.access(agentDefPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          errors.push(`Department '${deptName}' missing agent file: ${agentDefPath}`);
        }
      }
    }

    // Check agent definition files
    for (const [agentName, agent] of Object.entries(this.agents.agents)) {
      const agentDefPath = path.join(this.basePath, '.claude', 'agents', `${agentName}.md`);
      try {
        await fs.access(agentDefPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          errors.push(`Agent '${agentName}' missing definition file: ${agentDefPath}`);
        }
      }

      // Check implementation scripts for data-fetchers
      if (agent.type === 'data-fetcher' && agent.script) {
        // Handle both absolute and relative script paths
        const scriptPath = path.isAbsolute(agent.script) ? agent.script : path.join(this.basePath, agent.script);
        try {
          await fs.access(scriptPath);
        } catch (error) {
          if (error.code === 'ENOENT') {
            warnings.push(`Data-fetcher '${agentName}' missing script: ${scriptPath}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Search across departments, agents, and workflows by name, display name,
   * or description (case-insensitive substring match).
   *
   * @param {string} query - Search term.
   * @returns {Promise<{departments: Object[], agents: Object[], workflows: Object[]}>}
   */
  async search(query) {
    await this.ensureLoaded();

    const lowerQuery = query.toLowerCase();

    const results = {
      departments: Object.values(this.departments.departments).filter(d =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.displayName.toLowerCase().includes(lowerQuery) ||
        d.description.toLowerCase().includes(lowerQuery)
      ),
      agents: Object.values(this.agents.agents).filter(a =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.displayName.toLowerCase().includes(lowerQuery) ||
        a.description.toLowerCase().includes(lowerQuery)
      ),
      workflows: Object.values(this.workflows.workflows).filter(w =>
        w.name.toLowerCase().includes(lowerQuery) ||
        w.displayName.toLowerCase().includes(lowerQuery) ||
        w.description.toLowerCase().includes(lowerQuery)
      )
    };

    return results;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Ensure registries are loaded
   */
  ensureLoaded() {
    if (!this.loaded) {
      throw new Error('Registries not loaded. Call await registry.load() before using any registry methods.');
    }
  }

  /**
   * Reset all registries to empty state and persist. Intended for testing.
   *
   * @returns {Promise<void>}
   */
  async reset() {
    this.departments = { departments: {}, metadata: { totalDepartments: 0, lastUpdated: new Date().toISOString() } };
    this.agents = { agents: {}, metadata: { totalAgents: 0, lastUpdated: new Date().toISOString() } };
    this.workflows = { workflows: {}, metadata: { totalWorkflows: 0, lastUpdated: new Date().toISOString() } };
    this.loaded = true;
    await this.save();
  }

  /**
   * Export all registries as a single object for backup or transfer.
   *
   * @returns {Promise<{departments: Object, agents: Object, workflows: Object, exported: string}>}
   */
  async export() {
    await this.ensureLoaded();

    return {
      departments: this.departments,
      agents: this.agents,
      workflows: this.workflows,
      exported: new Date().toISOString()
    };
  }

  /**
   * Import registries from a backup object, overwriting current state.
   *
   * @param {Object} data - Object with `departments`, `agents`, and/or `workflows` keys.
   * @returns {Promise<void>}
   * @throws {Error} If data is not a non-null object.
   */
  async import(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Import data must be a non-null object with departments, agents, and/or workflows keys.');
    }
    if (data.departments) this.departments = data.departments;
    if (data.agents) this.agents = data.agents;
    if (data.workflows) this.workflows = data.workflows;
    this.loaded = true;
    await this.save();
  }
}

module.exports = RegistryManager;
