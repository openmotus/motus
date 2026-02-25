/**
 * Motus — Department-based AI automation framework for Claude Code
 *
 * @example
 * const { RegistryManager, TemplateEngine, Validator } = require('./index');
 *
 * const registry = new RegistryManager(__dirname);
 * await registry.load();
 *
 * await registry.addDepartment({
 *   name: 'marketing',
 *   displayName: 'Marketing',
 *   description: 'Social media, content, and campaign automation'
 * });
 */

const RegistryManager = require('./lib/registry-manager');
const TemplateEngine = require('./lib/template-engine');
const Validator = require('./lib/validator');
const DocGenerator = require('./lib/doc-generator');
const OAuthRegistry = require('./lib/oauth-registry');

module.exports = {
  RegistryManager,
  TemplateEngine,
  Validator,
  DocGenerator,
  OAuthRegistry
};
