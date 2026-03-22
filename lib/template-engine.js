/**
 * Template Engine
 *
 * Handlebars-based template rendering with 21 custom helpers, template
 * caching, and schema validation. Resolves templates from `templates/`
 * by type (agent, department, workflow, docs).
 *
 * @example
 * const engine = new TemplateEngine();
 * const output = await engine.render('agent/data-fetcher-agent.md', { name: 'weather-fetcher', description: 'Fetches weather' });
 * await engine.renderToFile('agent/data-fetcher-agent.md', context, '/path/to/output.md');
 */

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

class TemplateEngine {
  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.compiledTemplates = new Map();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  registerHelpers() {
    /**
     * Convert a string to kebab-case.
     * @example {{kebabCase "My Agent Name"}} → "my-agent-name"
     */
    Handlebars.registerHelper('kebabCase', function(str) {
      if (!str) return '';
      return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    });

    /**
     * Convert a string to PascalCase.
     * @example {{pascalCase "my-agent-name"}} → "MyAgentName"
     */
    Handlebars.registerHelper('pascalCase', function(str) {
      if (!str) return '';
      return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });

    /**
     * Convert a string to camelCase.
     * @example {{camelCase "my-agent-name"}} → "myAgentName"
     */
    Handlebars.registerHelper('camelCase', function(str) {
      if (!str) return '';
      const pascal = str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    /**
     * Capitalize the first letter of a string.
     * @example {{capitalize "hello"}} → "Hello"
     */
    Handlebars.registerHelper('capitalize', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    /**
     * Return the current ISO 8601 timestamp.
     * @example {{timestamp}} → "2026-02-18T03:00:00.000Z"
     */
    Handlebars.registerHelper('timestamp', function() {
      return new Date().toISOString();
    });

    /**
     * Format a date value as an ISO 8601 string. Falls back to current time.
     * @example {{formatDate createdAt}}
     */
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return new Date().toISOString();
      return new Date(date).toISOString();
    });

    /**
     * Join an array into a string with a separator.
     * @example {{join tools ", "}} → "Bash, Read, Write"
     */
    Handlebars.registerHelper('join', function(array, separator) {
      if (!Array.isArray(array)) return '';
      return array.join(separator || ', ');
    });

    /**
     * Block helper: render content if two values are strictly equal.
     * @example {{#eq type "specialist"}}...{{/eq}}
     */
    Handlebars.registerHelper('eq', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    /**
     * Block helper: render content if an array contains a value.
     * @example {{#contains tools "Bash"}}...{{/contains}}
     */
    Handlebars.registerHelper('contains', function(array, value, options) {
      if (!Array.isArray(array)) return options.inverse(this);
      return array.includes(value) ? options.fn(this) : options.inverse(this);
    });

    /**
     * Pluralize a word based on a count value.
     * @example {{pluralize agents.length "agent" "agents"}} → "agents"
     */
    Handlebars.registerHelper('pluralize', function(count, singular, plural) {
      return count === 1 ? singular : (plural || singular + 's');
    });

    /**
     * Indent every line of text by a number of spaces.
     * @example {{indent description 4}}
     */
    Handlebars.registerHelper('indent', function(text, spaces) {
      if (!text) return '';
      const indentation = ' '.repeat(spaces || 2);
      return text.split('\n').map(line => indentation + line).join('\n');
    });

    /**
     * Generate a multi-line JSDoc-style comment header with a timestamp.
     * @example {{commentHeader "Weather Fetcher Agent"}}
     */
    Handlebars.registerHelper('commentHeader', function(text) {
      const line = '*'.repeat(70);
      return `/**\n * ${text}\n * Generated: ${new Date().toISOString()}\n * ${line}\n */`;
    });

    /**
     * Format an array of agent names as a bulleted list.
     * @example {{agentList agents}} → "   - weather-fetcher\n   - calendar-fetcher"
     */
    Handlebars.registerHelper('agentList', function(agents) {
      if (!Array.isArray(agents)) return '';
      return agents.map(a => `   - ${a}`).join('\n');
    });

    /**
     * Format an array of tool names as a comma-separated string.
     * @example {{toolsList tools}} → "Bash, Read, Write"
     */
    Handlebars.registerHelper('toolsList', function(tools) {
      if (!Array.isArray(tools)) return '';
      return tools.join(', ');
    });

    /**
     * Generate YAML frontmatter from a data object.
     * @example {{frontmatter (hash name=name model=model)}}
     */
    Handlebars.registerHelper('frontmatter', function(data) {
      const lines = ['---'];
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          lines.push(`${key}: ${value}`);
        }
      }
      lines.push('---');
      return lines.join('\n');
    });

    /**
     * Block helper: render content if a value is non-empty (array, string, or object).
     * @example {{#ifNotEmpty integrations}}...{{/ifNotEmpty}}
     */
    Handlebars.registerHelper('ifNotEmpty', function(value, options) {
      if (Array.isArray(value) && value.length > 0) {
        return options.fn(this);
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return options.fn(this);
      }
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    /**
     * Convert a zero-based index to a 1-based step number.
     * @example {{stepNumber @index}} → 1
     */
    Handlebars.registerHelper('stepNumber', function(index) {
      return index + 1;
    });

    /**
     * Convert a string to UPPERCASE.
     * @example {{uppercase name}} → "WEATHER-FETCHER"
     */
    Handlebars.registerHelper('uppercase', function(str) {
      return str ? str.toUpperCase() : '';
    });

    /**
     * Convert a string to lowercase.
     * @example {{lowercase name}} → "weather-fetcher"
     */
    Handlebars.registerHelper('lowercase', function(str) {
      return str ? str.toLowerCase() : '';
    });

    /**
     * Create an array from variadic arguments. Useful for passing
     * inline arrays to other helpers like `join`.
     * @example {{join (array "a" "b" "c") ", "}} → "a, b, c"
     */
    Handlebars.registerHelper('array', function(...args) {
      // The last argument is the Handlebars options object — exclude it
      return args.slice(0, -1);
    });
  }

  /**
   * Load and compile a Handlebars template by name. Returns a cached copy
   * if the template has been loaded before.
   *
   * @param {string} templateName - Template identifier in `type/name` or `name.ext` format.
   * @returns {Promise<Function>} Compiled Handlebars template function.
   * @throws {Error} If the template file cannot be read.
   */
  async loadTemplate(templateName) {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error(`Template name must be a non-empty string, got ${templateName === '' ? 'empty string' : typeof templateName}.`);
    }

    // Check cache
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName);
    }

    // Determine file path
    const templatePath = this.resolveTemplatePath(templateName);

    try {
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const compiled = Handlebars.compile(templateContent);

      // Cache the compiled template
      this.compiledTemplates.set(templateName, compiled);

      return compiled;
    } catch (error) {
      throw new Error(`Failed to load template '${templateName}': ${error.message}. Check that the template exists in the templates/ directory.`);
    }
  }

  /**
   * Resolve a template name to an absolute file path inside `templates/`.
   *
   * @param {string} templateName - `type/name` (preferred) or `name.ext` format.
   * @returns {string} Absolute path to the `.hbs` template file.
   * @throws {Error} If the extension is unsupported in `name.ext` format.
   */
  resolveTemplatePath(templateName) {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error(`Template name must be a non-empty string, got ${templateName === '' ? 'empty string' : typeof templateName}.`);
    }

    // Template name format: "type/name" or "name.ext"
    const parts = templateName.split('/');

    if (parts.length === 2) {
      // type/name format
      const [type, name] = parts;
      return path.join(this.templatesDir, type, `${name}.hbs`);
    }

    // name.ext format - auto-detect type
    if (templateName.includes('.')) {
      const ext = path.extname(templateName);
      const baseName = path.basename(templateName, ext);

      // Determine directory by extension
      let dir;
      if (ext === '.md') {
        dir = templateName.includes('agent') ? 'agent' : 'docs';
      } else if (ext === '.js') {
        dir = 'agent';
      } else if (ext === '.json') {
        dir = 'workflow';
      } else if (ext === '.sh') {
        dir = 'workflow';
      } else {
        throw new Error(`Unsupported template extension '${ext}'. Use type/name format (e.g. 'agent/my-template.md') or a supported extension (.md, .js, .json, .sh).`);
      }

      return path.join(this.templatesDir, dir, `${baseName}.hbs`);
    }

    // Default to agent directory
    return path.join(this.templatesDir, 'agent', `${templateName}.hbs`);
  }

  /**
   * Render a template with the given context data.
   *
   * @param {string} templateName - Template identifier (see {@link resolveTemplatePath}).
   * @param {Object} [context={}] - Data passed to the Handlebars template.
   * @returns {Promise<string>} Rendered template output.
   */
  async render(templateName, context = {}) {
    const template = await this.loadTemplate(templateName);

    // Add default context values
    const fullContext = {
      timestamp: new Date().toISOString(),
      year: new Date().getFullYear(),
      ...context
    };

    return template(fullContext);
  }

  /**
   * Render a template and write the result to a file. Creates parent
   * directories automatically.
   *
   * @param {string} templateName - Template identifier.
   * @param {Object} context - Data passed to the Handlebars template.
   * @param {string} outputPath - Absolute path for the output file.
   * @returns {Promise<string>} The output path that was written.
   * @throws {Error} If the file cannot be written.
   */
  async renderToFile(templateName, context, outputPath) {
    const rendered = await this.render(templateName, context);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write file
    try {
      await fs.writeFile(outputPath, rendered);
    } catch (error) {
      throw new Error(`Failed to write rendered template to ${outputPath}: ${error.message}`);
    }

    return outputPath;
  }

  /**
   * Clear all cached compiled templates, forcing a re-read on next use.
   */
  clearCache() {
    this.compiledTemplates.clear();
  }

  /**
   * List available `.hbs` templates, optionally filtered by type directory.
   *
   * @param {string|null} [type=null] - Template type (`agent`, `department`,
   *   `workflow`, `docs`). Pass `null` to list all types.
   * @returns {Promise<Array<{name: string, type: string, path: string}>>}
   */
  async listTemplates(type = null) {
    const templates = [];

    const searchDirs = type
      ? [path.join(this.templatesDir, type)]
      : [
          path.join(this.templatesDir, 'department'),
          path.join(this.templatesDir, 'agent'),
          path.join(this.templatesDir, 'workflow'),
          path.join(this.templatesDir, 'docs')
        ];

    for (const dir of searchDirs) {
      try {
        const files = await fs.readdir(dir);
        const hbsFiles = files
          .filter(f => f.endsWith('.hbs'))
          .map(f => ({
            name: f.replace('.hbs', ''),
            type: path.basename(dir),
            path: path.join(dir, f)
          }));
        templates.push(...hbsFiles);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        // Directory doesn't exist yet — skip
      }
    }

    return templates;
  }

  /**
   * Validate template context against a JSON schema in `templates/schemas/`.
   * If no schema file exists for the template, validation passes automatically.
   *
   * @param {string} templateName - Template identifier used to locate the schema.
   * @param {Object} context - Data to validate.
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   * @throws {Error} If the schema file exists but cannot be read (non-ENOENT errors).
   */
  async validateContext(templateName, context) {
    const schemaPath = path.join(
      this.templatesDir,
      'schemas',
      `${templateName}-schema.json`
    );

    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);

      const errors = [];

      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in context) || context[field] === undefined || context[field] === null) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }

      // Check field types
      if (schema.properties) {
        for (const [field, fieldSchema] of Object.entries(schema.properties)) {
          if (field in context) {
            const value = context[field];
            const expectedType = fieldSchema.type;

            if (expectedType === 'array' && !Array.isArray(value)) {
              errors.push(`Field ${field} must be an array`);
            } else if (expectedType === 'string' && typeof value !== 'string') {
              errors.push(`Field ${field} must be a string`);
            } else if (expectedType === 'number' && typeof value !== 'number') {
              errors.push(`Field ${field} must be a number`);
            } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
              errors.push(`Field ${field} must be a boolean`);
            }

            // Check string patterns
            if (expectedType === 'string' && fieldSchema.pattern) {
              const regex = new RegExp(fieldSchema.pattern);
              if (!regex.test(value)) {
                errors.push(`Field ${field} doesn't match pattern: ${fieldSchema.pattern}`);
              }
            }

            // Check string length
            if (expectedType === 'string' && fieldSchema.minLength) {
              if (value.length < fieldSchema.minLength) {
                errors.push(`Field ${field} must be at least ${fieldSchema.minLength} characters`);
              }
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Schema doesn't exist — skip validation
        return { valid: true, errors: [] };
      }
      throw error;
    }
  }
}

module.exports = TemplateEngine;
