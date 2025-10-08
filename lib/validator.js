/**
 * Validator Library
 *
 * Comprehensive validation for departments, agents, workflows, and related data.
 * Provides naming validation, schema validation, and format checking.
 */

const fs = require('fs').promises;
const path = require('path');

class Validator {
  constructor() {
    // Validation patterns
    this.patterns = {
      kebabCase: /^[a-z][a-z0-9-]{2,50}$/,
      camelCase: /^[a-z][a-zA-Z0-9]{2,50}$/,
      pascalCase: /^[A-Z][a-zA-Z0-9]{2,50}$/,
      snakeCase: /^[a-z][a-z0-9_]{2,50}$/,
      upperSnakeCase: /^[A-Z][A-Z0-9_]{2,50}$/,
      actionNoun: /^[a-z]+-[a-z]+(-[a-z]+)*$/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      semver: /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9]+)?$/
    };

    // Agent type keywords for type detection
    this.agentTypeKeywords = {
      'data-fetcher': ['fetch', 'get', 'retrieve', 'pull', 'read', 'collect', 'api', 'data', 'from', 'endpoint'],
      'orchestrator': ['orchestrate', 'coordinate', 'manage', 'combine', 'workflow', 'agents', 'multiple', 'parallel', 'steps'],
      'specialist': ['analyze', 'process', 'transform', 'calculate', 'determine', 'generate', 'create']
    };
  }

  // ========================================
  // NAME VALIDATION
  // ========================================

  /**
   * Validate department name
   */
  validateDepartmentName(name) {
    const errors = [];

    if (!name) {
      errors.push('Department name is required');
      return { valid: false, errors };
    }

    if (typeof name !== 'string') {
      errors.push('Department name must be a string');
      return { valid: false, errors };
    }

    if (name.length < 3) {
      errors.push('Department name must be at least 3 characters');
    }

    if (name.length > 30) {
      errors.push('Department name must be less than 30 characters');
    }

    if (!this.patterns.kebabCase.test(name)) {
      errors.push('Department name must be in kebab-case (lowercase, hyphens only)');
      errors.push('Examples: marketing, finance, customer-success');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate agent name
   */
  validateAgentName(name) {
    const errors = [];

    if (!name) {
      errors.push('Agent name is required');
      return { valid: false, errors };
    }

    if (typeof name !== 'string') {
      errors.push('Agent name must be a string');
      return { valid: false, errors };
    }

    if (name.length < 3) {
      errors.push('Agent name must be at least 3 characters');
    }

    if (name.length > 50) {
      errors.push('Agent name must be less than 50 characters');
    }

    if (!this.patterns.kebabCase.test(name)) {
      errors.push('Agent name must be in kebab-case (lowercase, hyphens only)');
    }

    // Check for action-noun pattern
    const parts = name.split('-');
    if (parts.length < 2) {
      errors.push('Agent name should follow action-noun pattern (e.g., data-fetcher, trend-analyzer, report-creator)');
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions: this.suggestAgentName(name)
    };
  }

  /**
   * Validate workflow name
   */
  validateWorkflowName(name) {
    const errors = [];

    if (!name) {
      errors.push('Workflow name is required');
      return { valid: false, errors };
    }

    if (typeof name !== 'string') {
      errors.push('Workflow name must be a string');
      return { valid: false, errors };
    }

    if (name.length < 3) {
      errors.push('Workflow name must be at least 3 characters');
    }

    if (name.length > 50) {
      errors.push('Workflow name must be less than 50 characters');
    }

    if (!this.patterns.kebabCase.test(name)) {
      errors.push('Workflow name must be in kebab-case (lowercase, hyphens only)');
      errors.push('Examples: daily-brief, weekly-report, monthly-summary');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate environment variable name
   */
  validateEnvVarName(name) {
    const errors = [];

    if (!name) {
      errors.push('Environment variable name is required');
      return { valid: false, errors };
    }

    if (!this.patterns.upperSnakeCase.test(name)) {
      errors.push('Environment variable must be in UPPER_SNAKE_CASE');
      errors.push('Examples: API_KEY, TWITTER_API_SECRET, DATABASE_URL');
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions: name.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    };
  }

  // ========================================
  // TYPE DETECTION
  // ========================================

  /**
   * Detect agent type from description
   */
  detectAgentType(description) {
    if (!description) return null;

    const lowerDesc = description.toLowerCase();
    const scores = {};

    // Score each type based on keyword matches
    Object.entries(this.agentTypeKeywords).forEach(([type, keywords]) => {
      scores[type] = keywords.filter(keyword => lowerDesc.includes(keyword)).length;
    });

    // Find type with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return null;

    const detectedType = Object.entries(scores)
      .filter(([_, score]) => score === maxScore)
      .map(([type, _]) => type)[0];

    return {
      type: detectedType,
      confidence: maxScore / this.agentTypeKeywords[detectedType].length,
      scores
    };
  }

  /**
   * Detect parallel vs sequential execution
   */
  detectParallelExecution(stepDescription) {
    const lowerDesc = stepDescription.toLowerCase();

    // Indicators of multiple operations
    const parallelIndicators = [
      'and', '&', ',',
      'fetch.*and', 'get.*and',
      'multiple', 'all', 'both'
    ];

    const hasMultipleActions = parallelIndicators.some(indicator =>
      new RegExp(indicator).test(lowerDesc)
    );

    // Count action verbs
    const actionVerbs = ['fetch', 'get', 'retrieve', 'analyze', 'process', 'create', 'update'];
    const actionCount = actionVerbs.filter(verb => lowerDesc.includes(verb)).length;

    return {
      shouldBeParallel: hasMultipleActions || actionCount > 1,
      actionCount,
      confidence: hasMultipleActions ? 0.8 : 0.5
    };
  }

  // ========================================
  // CONTENT VALIDATION
  // ========================================

  /**
   * Validate description length and quality
   */
  validateDescription(description, minLength = 10, maxLength = 500) {
    const errors = [];

    if (!description) {
      errors.push('Description is required');
      return { valid: false, errors };
    }

    if (description.length < minLength) {
      errors.push(`Description must be at least ${minLength} characters (currently ${description.length})`);
    }

    if (description.length > maxLength) {
      errors.push(`Description must be less than ${maxLength} characters (currently ${description.length})`);
    }

    // Check for generic descriptions
    const genericPhrases = ['does stuff', 'handles things', 'manages data', 'tbd', 'todo', 'placeholder'];
    const isGeneric = genericPhrases.some(phrase => description.toLowerCase().includes(phrase));

    if (isGeneric) {
      errors.push('Description appears to be generic or placeholder text. Please provide a specific description.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate URL format
   */
  validateUrl(url) {
    const errors = [];

    if (!url) {
      errors.push('URL is required');
      return { valid: false, errors };
    }

    if (!this.patterns.url.test(url)) {
      errors.push('Invalid URL format. Must start with http:// or https://');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate schedule format
   */
  validateSchedule(schedule) {
    const errors = [];

    if (!schedule) {
      errors.push('Schedule is required');
      return { valid: false, errors };
    }

    const validFormats = [
      /^daily \d{1,2}:\d{2}$/,              // daily 9:00
      /^weekly (monday|tuesday|wednesday|thursday|friday|saturday|sunday) \d{1,2}:\d{2}$/i,  // weekly monday 10:00
      /^monthly \d{1,2}(st|nd|rd|th) \d{1,2}:\d{2}$/,  // monthly 1st 08:00
      /^hourly$/,                           // hourly
      /^every \d+ (hours|minutes)$/         // every 4 hours
    ];

    const isValid = validFormats.some(format => format.test(schedule));

    if (!isValid) {
      errors.push('Invalid schedule format');
      errors.push('Valid formats:');
      errors.push('  - daily HH:MM (e.g., daily 9:00)');
      errors.push('  - weekly DAY HH:MM (e.g., weekly monday 10:00)');
      errors.push('  - monthly Nth HH:MM (e.g., monthly 1st 08:00)');
      errors.push('  - hourly');
      errors.push('  - every N hours/minutes (e.g., every 4 hours)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate file path exists
   */
  async validateFilePath(filePath) {
    const errors = [];

    try {
      await fs.access(filePath);
    } catch (error) {
      errors.push(`File or directory does not exist: ${filePath}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // SCHEMA VALIDATION
  // ========================================

  /**
   * Validate agent context against schema
   */
  validateAgentContext(context) {
    const errors = [];

    // Required fields
    const required = ['name', 'description', 'department', 'type'];
    required.forEach(field => {
      if (!context[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate name format
    if (context.name) {
      const nameValidation = this.validateAgentName(context.name);
      if (!nameValidation.valid) {
        errors.push(...nameValidation.errors);
      }
    }

    // Validate description
    if (context.description) {
      const descValidation = this.validateDescription(context.description);
      if (!descValidation.valid) {
        errors.push(...descValidation.errors);
      }
    }

    // Validate type
    if (context.type && !['data-fetcher', 'orchestrator', 'specialist'].includes(context.type)) {
      errors.push(`Invalid agent type: ${context.type}. Must be data-fetcher, orchestrator, or specialist`);
    }

    // Validate tools array
    if (context.tools && !Array.isArray(context.tools)) {
      errors.push('Tools must be an array');
    }

    if (context.tools && context.tools.length === 0) {
      errors.push('At least one tool must be specified');
    }

    // Validate environment variable names
    if (context.envVar) {
      const envValidation = this.validateEnvVarName(context.envVar);
      if (!envValidation.valid) {
        errors.push(...envValidation.errors);
      }
    }

    // Validate API URL if provided
    if (context.apiUrl) {
      const urlValidation = this.validateUrl(context.apiUrl);
      if (!urlValidation.valid) {
        errors.push(...urlValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate department context against schema
   */
  validateDepartmentContext(context) {
    const errors = [];

    // Required fields
    const required = ['name', 'displayName', 'description'];
    required.forEach(field => {
      if (!context[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate name format
    if (context.name) {
      const nameValidation = this.validateDepartmentName(context.name);
      if (!nameValidation.valid) {
        errors.push(...nameValidation.errors);
      }
    }

    // Validate description
    if (context.description) {
      const descValidation = this.validateDescription(context.description, 20, 500);
      if (!descValidation.valid) {
        errors.push(...descValidation.errors);
      }
    }

    // Validate arrays
    if (context.agents && !Array.isArray(context.agents)) {
      errors.push('Agents must be an array');
    }

    if (context.workflows && !Array.isArray(context.workflows)) {
      errors.push('Workflows must be an array');
    }

    if (context.integrations && !Array.isArray(context.integrations)) {
      errors.push('Integrations must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate workflow context against schema
   */
  validateWorkflowContext(context) {
    const errors = [];

    // Required fields
    const required = ['name', 'displayName', 'description', 'department', 'steps'];
    required.forEach(field => {
      if (!context[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate name format
    if (context.name) {
      const nameValidation = this.validateWorkflowName(context.name);
      if (!nameValidation.valid) {
        errors.push(...nameValidation.errors);
      }
    }

    // Validate description
    if (context.description) {
      const descValidation = this.validateDescription(context.description, 20, 500);
      if (!descValidation.valid) {
        errors.push(...descValidation.errors);
      }
    }

    // Validate steps
    if (context.steps) {
      if (!Array.isArray(context.steps)) {
        errors.push('Steps must be an array');
      } else if (context.steps.length === 0) {
        errors.push('At least one step is required');
      } else if (context.steps.length > 15) {
        errors.push('Maximum 15 steps allowed');
      }

      // Validate each step
      context.steps.forEach((step, index) => {
        if (!step.agents || !Array.isArray(step.agents) || step.agents.length === 0) {
          errors.push(`Step ${index + 1}: must have at least one agent`);
        }

        step.agents.forEach((agent, agentIndex) => {
          if (!agent.name) {
            errors.push(`Step ${index + 1}, Agent ${agentIndex + 1}: missing agent name`);
          }
          if (!agent.prompt) {
            errors.push(`Step ${index + 1}, Agent ${agentIndex + 1}: missing prompt`);
          }
        });
      });
    }

    // Validate trigger
    if (context.trigger) {
      if (context.trigger.type === 'scheduled' && !context.trigger.schedule) {
        errors.push('Scheduled trigger must have a schedule');
      }

      if (context.trigger.schedule) {
        const scheduleValidation = this.validateSchedule(context.trigger.schedule);
        if (!scheduleValidation.valid) {
          errors.push(...scheduleValidation.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // SUGGESTIONS
  // ========================================

  /**
   * Suggest corrections for agent name
   */
  suggestAgentName(name) {
    if (!name) return [];

    const suggestions = [];

    // Convert to kebab-case
    const kebab = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
    if (kebab !== name) {
      suggestions.push(kebab);
    }

    // Add action prefix if missing
    const parts = kebab.split('-');
    if (parts.length === 1) {
      const actions = ['data', 'trend', 'report', 'content', 'task'];
      suggestions.push(...actions.map(action => `${action}-${kebab}`));
    }

    return [...new Set(suggestions)].slice(0, 3);
  }

  /**
   * Suggest tools based on agent type
   */
  suggestTools(agentType, needsApi = false) {
    const toolSuggestions = {
      'data-fetcher': ['Bash', 'Read'],
      'orchestrator': ['Task', 'Read', 'Write'],
      'specialist': ['Read', 'Write', 'Task']
    };

    const tools = toolSuggestions[agentType] || ['Read', 'Write'];

    if (needsApi && !tools.includes('Bash')) {
      tools.unshift('Bash');
    }

    return tools;
  }

  /**
   * Suggest environment variable name
   */
  suggestEnvVarName(department, service) {
    const deptPart = department.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const servicePart = service.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    return `${deptPart}_${servicePart}_KEY`;
  }
}

module.exports = Validator;
