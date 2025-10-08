/**
 * Template Engine
 * Handlebars-based template rendering with custom helpers
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
    // Convert to kebab-case
    Handlebars.registerHelper('kebabCase', function(str) {
      if (!str) return '';
      return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    });

    // Convert to PascalCase
    Handlebars.registerHelper('pascalCase', function(str) {
      if (!str) return '';
      return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });

    // Convert to camelCase
    Handlebars.registerHelper('camelCase', function(str) {
      if (!str) return '';
      const pascal = str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    // Capitalize first letter
    Handlebars.registerHelper('capitalize', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Current ISO timestamp
    Handlebars.registerHelper('timestamp', function() {
      return new Date().toISOString();
    });

    // Format date
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return new Date().toISOString();
      return new Date(date).toISOString();
    });

    // Join array with separator
    Handlebars.registerHelper('join', function(array, separator) {
      if (!Array.isArray(array)) return '';
      return array.join(separator || ', ');
    });

    // Conditional equality
    Handlebars.registerHelper('eq', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // Conditional contains
    Handlebars.registerHelper('contains', function(array, value, options) {
      if (!Array.isArray(array)) return options.inverse(this);
      return array.includes(value) ? options.fn(this) : options.inverse(this);
    });

    // Pluralize
    Handlebars.registerHelper('pluralize', function(count, singular, plural) {
      return count === 1 ? singular : (plural || singular + 's');
    });

    // Indent text
    Handlebars.registerHelper('indent', function(text, spaces) {
      if (!text) return '';
      const indentation = ' '.repeat(spaces || 2);
      return text.split('\n').map(line => indentation + line).join('\n');
    });

    // Generate comment header
    Handlebars.registerHelper('commentHeader', function(text) {
      const line = '*'.repeat(70);
      return `/**\n * ${text}\n * Generated: ${new Date().toISOString()}\n * ${line}\n */`;
    });

    // Format agent list
    Handlebars.registerHelper('agentList', function(agents) {
      if (!Array.isArray(agents)) return '';
      return agents.map(a => `   - ${a}`).join('\n');
    });

    // Format tools list
    Handlebars.registerHelper('toolsList', function(tools) {
      if (!Array.isArray(tools)) return '';
      return tools.join(', ');
    });

    // Generate frontmatter
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

    // Conditional if not empty
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

    // Generate step number
    Handlebars.registerHelper('stepNumber', function(index) {
      return index + 1;
    });

    // Uppercase
    Handlebars.registerHelper('uppercase', function(str) {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase
    Handlebars.registerHelper('lowercase', function(str) {
      return str ? str.toLowerCase() : '';
    });
  }

  /**
   * Load and compile a template
   */
  async loadTemplate(templateName) {
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
      throw new Error(`Failed to load template ${templateName}: ${error.message}`);
    }
  }

  /**
   * Resolve template path based on name
   */
  resolveTemplatePath(templateName) {
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
      }

      return path.join(this.templatesDir, dir, `${templateName}.hbs`);
    }

    // Default to agent directory
    return path.join(this.templatesDir, 'agent', `${templateName}.hbs`);
  }

  /**
   * Render a template with context
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
   * Render and save to file
   */
  async renderToFile(templateName, context, outputPath) {
    const rendered = await this.render(templateName, context);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write file
    await fs.writeFile(outputPath, rendered);

    return outputPath;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.compiledTemplates.clear();
  }

  /**
   * List available templates
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
        // Directory doesn't exist yet
      }
    }

    return templates;
  }

  /**
   * Validate template context against schema
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
      // Schema doesn't exist - skip validation
      return { valid: true, errors: [] };
    }
  }
}

module.exports = TemplateEngine;
