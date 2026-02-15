#!/usr/bin/env node

/**
 * Validator Comprehensive Tests
 *
 * Tests for:
 * - Department/agent/workflow name validation
 * - Description quality validation
 * - URL validation
 * - Schedule format validation
 * - Environment variable name validation
 * - Agent type detection
 * - Parallel execution detection
 * - Context validation (agent, department, workflow)
 * - Name suggestions
 * - Tool suggestions
 */

const Validator = require('../lib/validator');

class TestSuite {
  constructor() {
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.tests = [];
  }

  async test(name, fn) {
    this.testCount++;
    try {
      await fn();
      this.passCount++;
      console.log(`\u2713 ${name}`);
      this.tests.push({ name, passed: true });
    } catch (error) {
      this.failCount++;
      console.error(`\u2717 ${name}`);
      console.error(`  Error: ${error.message}`);
      this.tests.push({ name, passed: false, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('Test Results');
    console.log('='.repeat(60));
    console.log(`Total: ${this.testCount}`);
    console.log(`Passed: ${this.passCount} \u2713`);
    console.log(`Failed: ${this.failCount} \u2717`);
    console.log('='.repeat(60));

    if (this.failCount > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n\ud83c\udf89 All tests passed!');
      process.exit(0);
    }
  }
}

async function runTests() {
  const suite = new TestSuite();
  const validator = new Validator();

  console.log('Validator Comprehensive Tests');
  console.log('='.repeat(60));

  // =============================================
  // Department Name Validation
  // =============================================
  console.log('\nDepartment Name Validation\n');

  await suite.test('validateDepartmentName: valid name passes', () => {
    const result = validator.validateDepartmentName('marketing');
    suite.assert(result.valid, 'marketing should be valid');
  });

  await suite.test('validateDepartmentName: hyphenated name passes', () => {
    const result = validator.validateDepartmentName('customer-success');
    suite.assert(result.valid, 'customer-success should be valid');
  });

  await suite.test('validateDepartmentName: too long fails', () => {
    const result = validator.validateDepartmentName('this-is-a-really-long-department-name-that-exceeds-limit');
    suite.assert(!result.valid, 'Long name should be invalid');
  });

  await suite.test('validateDepartmentName: uppercase fails', () => {
    const result = validator.validateDepartmentName('Marketing');
    suite.assert(!result.valid, 'Uppercase should be invalid');
    suite.assert(result.errors.some(e => e.includes('kebab-case')), 'Should mention kebab-case');
  });

  await suite.test('validateDepartmentName: with numbers passes', () => {
    const result = validator.validateDepartmentName('team-42');
    suite.assert(result.valid, 'Names with numbers should be valid');
  });

  await suite.test('validateDepartmentName: starting with number fails', () => {
    const result = validator.validateDepartmentName('42-team');
    suite.assert(!result.valid, 'Starting with number should be invalid');
  });

  // =============================================
  // Agent Name Validation
  // =============================================
  console.log('\nAgent Name Validation\n');

  await suite.test('validateAgentName: valid action-noun passes', () => {
    const result = validator.validateAgentName('weather-fetcher');
    suite.assert(result.valid, 'weather-fetcher should be valid');
  });

  await suite.test('validateAgentName: multi-part name passes', () => {
    const result = validator.validateAgentName('daily-trend-analyzer');
    suite.assert(result.valid, 'daily-trend-analyzer should be valid');
  });

  await suite.test('validateAgentName: single word warns about action-noun', () => {
    const result = validator.validateAgentName('weather');
    suite.assert(!result.valid, 'Single word should fail action-noun check');
    suite.assert(result.errors.some(e => e.includes('action-noun')), 'Should suggest action-noun pattern');
  });

  await suite.test('validateAgentName: provides name suggestions', () => {
    const result = validator.validateAgentName('Weather Fetcher');
    suite.assert(result.suggestions && result.suggestions.length > 0, 'Should provide suggestions');
  });

  await suite.test('validateAgentName: too long fails', () => {
    const result = validator.validateAgentName('this-is-an-extremely-long-agent-name-that-nobody-would-ever-use');
    suite.assert(!result.valid, 'Very long name should be invalid');
  });

  // =============================================
  // Workflow Name Validation
  // =============================================
  console.log('\nWorkflow Name Validation\n');

  await suite.test('validateWorkflowName: valid name passes', () => {
    const result = validator.validateWorkflowName('daily-brief');
    suite.assert(result.valid, 'daily-brief should be valid');
  });

  await suite.test('validateWorkflowName: underscores fail', () => {
    const result = validator.validateWorkflowName('daily_brief');
    suite.assert(!result.valid, 'Underscores should be invalid in kebab-case');
  });

  await suite.test('validateWorkflowName: too short fails', () => {
    const result = validator.validateWorkflowName('ab');
    suite.assert(!result.valid, 'Two-char name should be invalid');
  });

  await suite.test('validateWorkflowName: suggests kebab-case', () => {
    const result = validator.validateWorkflowName('DailyBrief');
    suite.assert(!result.valid, 'PascalCase should be invalid');
    suite.assert(result.errors.some(e => e.includes('kebab-case')), 'Should mention kebab-case');
  });

  // =============================================
  // Environment Variable Validation
  // =============================================
  console.log('\nEnvironment Variable Validation\n');

  await suite.test('validateEnvVarName: valid UPPER_SNAKE passes', () => {
    const result = validator.validateEnvVarName('WEATHER_API_KEY');
    suite.assert(result.valid, 'WEATHER_API_KEY should be valid');
  });

  await suite.test('validateEnvVarName: lowercase fails', () => {
    const result = validator.validateEnvVarName('weather_api_key');
    suite.assert(!result.valid, 'Lowercase should be invalid');
    suite.assert(result.errors.some(e => e.includes('UPPER_SNAKE_CASE')), 'Should mention UPPER_SNAKE_CASE');
  });

  await suite.test('validateEnvVarName: provides suggestion', () => {
    const result = validator.validateEnvVarName('my-api-key');
    suite.assert(result.suggestions, 'Should provide a suggestion');
    suite.assert(result.suggestions.includes('_'), 'Suggestion should use underscores');
  });

  await suite.test('validateEnvVarName: null fails', () => {
    const result = validator.validateEnvVarName(null);
    suite.assert(!result.valid, 'null should be invalid');
  });

  // =============================================
  // Description Validation
  // =============================================
  console.log('\nDescription Validation\n');

  await suite.test('validateDescription: valid description passes', () => {
    const result = validator.validateDescription('Fetches weather data from the WeatherAPI service');
    suite.assert(result.valid, 'Good description should pass');
  });

  await suite.test('validateDescription: too short fails', () => {
    const result = validator.validateDescription('short');
    suite.assert(!result.valid, 'Short description should fail');
    suite.assert(result.errors.some(e => e.includes('at least')), 'Should mention minimum length');
  });

  await suite.test('validateDescription: null fails', () => {
    const result = validator.validateDescription(null);
    suite.assert(!result.valid, 'null description should fail');
  });

  await suite.test('validateDescription: generic placeholder detected', () => {
    const result = validator.validateDescription('This agent does stuff and handles things');
    suite.assert(!result.valid, 'Generic description should fail');
    suite.assert(result.errors.some(e => e.includes('generic')), 'Should flag as generic');
  });

  await suite.test('validateDescription: TBD placeholder detected', () => {
    const result = validator.validateDescription('TBD - description to be written later');
    suite.assert(!result.valid, 'TBD should be flagged');
  });

  await suite.test('validateDescription: custom length bounds work', () => {
    const result = validator.validateDescription('Very long description that exceeds limit', 5, 20);
    suite.assert(!result.valid, 'Should fail custom max length');
    suite.assert(result.errors.some(e => e.includes('less than 20')), 'Should show custom max');
  });

  // =============================================
  // URL Validation
  // =============================================
  console.log('\nURL Validation\n');

  await suite.test('validateUrl: valid HTTPS URL passes', () => {
    const result = validator.validateUrl('https://api.example.com/v1/data');
    suite.assert(result.valid, 'HTTPS URL should be valid');
  });

  await suite.test('validateUrl: valid HTTP URL passes', () => {
    const result = validator.validateUrl('http://api.weatherapi.com/v1/forecast');
    suite.assert(result.valid, 'HTTP URL should be valid');
  });

  await suite.test('validateUrl: localhost URL rejected by pattern', () => {
    const result = validator.validateUrl('http://localhost:3000/callback');
    suite.assert(!result.valid, 'localhost should not match URL pattern (no TLD)');
  });

  await suite.test('validateUrl: missing protocol fails', () => {
    const result = validator.validateUrl('api.example.com/v1');
    suite.assert(!result.valid, 'URL without protocol should fail');
  });

  await suite.test('validateUrl: null fails', () => {
    const result = validator.validateUrl(null);
    suite.assert(!result.valid, 'null should fail');
  });

  // =============================================
  // Schedule Validation
  // =============================================
  console.log('\nSchedule Validation\n');

  await suite.test('validateSchedule: daily format passes', () => {
    const result = validator.validateSchedule('daily 9:00');
    suite.assert(result.valid, 'daily 9:00 should be valid');
  });

  await suite.test('validateSchedule: weekly format passes', () => {
    const result = validator.validateSchedule('weekly monday 10:00');
    suite.assert(result.valid, 'weekly monday 10:00 should be valid');
  });

  await suite.test('validateSchedule: monthly format passes', () => {
    const result = validator.validateSchedule('monthly 1st 8:00');
    suite.assert(result.valid, 'monthly 1st 8:00 should be valid');
  });

  await suite.test('validateSchedule: hourly format passes', () => {
    const result = validator.validateSchedule('hourly');
    suite.assert(result.valid, 'hourly should be valid');
  });

  await suite.test('validateSchedule: every N hours passes', () => {
    const result = validator.validateSchedule('every 4 hours');
    suite.assert(result.valid, 'every 4 hours should be valid');
  });

  await suite.test('validateSchedule: every N minutes passes', () => {
    const result = validator.validateSchedule('every 30 minutes');
    suite.assert(result.valid, 'every 30 minutes should be valid');
  });

  await suite.test('validateSchedule: invalid format fails with help', () => {
    const result = validator.validateSchedule('at 9am every day');
    suite.assert(!result.valid, 'Freeform should fail');
    suite.assert(result.errors.some(e => e.includes('Valid formats')), 'Should show valid formats');
  });

  await suite.test('validateSchedule: null fails', () => {
    const result = validator.validateSchedule(null);
    suite.assert(!result.valid, 'null should fail');
  });

  // =============================================
  // Agent Type Detection
  // =============================================
  console.log('\nAgent Type Detection\n');

  await suite.test('detectAgentType: returns null for empty description', () => {
    const result = validator.detectAgentType('');
    suite.assert(result === null, 'Empty description should return null');
  });

  await suite.test('detectAgentType: returns null for null', () => {
    const result = validator.detectAgentType(null);
    suite.assert(result === null, 'null should return null');
  });

  await suite.test('detectAgentType: returns confidence score', () => {
    const result = validator.detectAgentType('Fetches data from the weather API endpoint');
    suite.assert(result.confidence > 0, 'Should have confidence > 0');
    suite.assert(result.confidence <= 1, 'Confidence should be <= 1');
  });

  await suite.test('detectAgentType: returns all scores', () => {
    const result = validator.detectAgentType('Fetches data from the weather API endpoint');
    suite.assert(result.scores['data-fetcher'] > 0, 'data-fetcher score should be > 0');
    suite.assert(typeof result.scores['orchestrator'] === 'number', 'Should have orchestrator score');
    suite.assert(typeof result.scores['specialist'] === 'number', 'Should have specialist score');
  });

  await suite.test('detectAgentType: returns null for unrelated description', () => {
    const result = validator.detectAgentType('something completely unrelated');
    suite.assert(result === null, 'Unrelated description should return null');
  });

  // =============================================
  // Parallel Execution Detection
  // =============================================
  console.log('\nParallel Execution Detection\n');

  await suite.test('detectParallelExecution: parallel for "fetch X and Y"', () => {
    const result = validator.detectParallelExecution('Fetch weather and calendar data');
    suite.assert(result.shouldBeParallel, 'Should detect parallel for "and" with multiple actions');
  });

  await suite.test('detectParallelExecution: parallel for multiple verbs', () => {
    const result = validator.detectParallelExecution('Get weather, retrieve emails, fetch tasks');
    suite.assert(result.shouldBeParallel, 'Should detect parallel for multiple action verbs');
  });

  await suite.test('detectParallelExecution: sequential for single action', () => {
    const result = validator.detectParallelExecution('Create a summary report');
    suite.assert(!result.shouldBeParallel || result.actionCount <= 1, 'Single action should not be parallel');
  });

  await suite.test('detectParallelExecution: returns action count', () => {
    const result = validator.detectParallelExecution('Fetch and analyze data');
    suite.assert(typeof result.actionCount === 'number', 'Should return action count');
  });

  // =============================================
  // Agent Context Validation
  // =============================================
  console.log('\nAgent Context Validation\n');

  await suite.test('validateAgentContext: valid context passes', () => {
    const result = validator.validateAgentContext({
      name: 'weather-fetcher',
      description: 'Fetches current weather data from WeatherAPI',
      department: 'life',
      type: 'data-fetcher',
      tools: ['Bash', 'Read']
    });
    suite.assert(result.valid, 'Valid context should pass');
  });

  await suite.test('validateAgentContext: missing required fields fails', () => {
    const result = validator.validateAgentContext({});
    suite.assert(!result.valid, 'Empty context should fail');
    suite.assert(result.errors.length >= 4, 'Should report all 4 missing required fields');
  });

  await suite.test('validateAgentContext: invalid type fails', () => {
    const result = validator.validateAgentContext({
      name: 'my-agent',
      description: 'A test agent for validation purposes',
      department: 'test',
      type: 'invalid-type',
      tools: ['Read']
    });
    suite.assert(!result.valid, 'Invalid type should fail');
    suite.assert(result.errors.some(e => e.includes('invalid-type')), 'Should mention invalid type');
  });

  await suite.test('validateAgentContext: empty tools array fails', () => {
    const result = validator.validateAgentContext({
      name: 'my-agent',
      description: 'A test agent for validation purposes',
      department: 'test',
      type: 'specialist',
      tools: []
    });
    suite.assert(!result.valid, 'Empty tools should fail');
  });

  await suite.test('validateAgentContext: non-array tools fails', () => {
    const result = validator.validateAgentContext({
      name: 'my-agent',
      description: 'A test agent for validation purposes',
      department: 'test',
      type: 'specialist',
      tools: 'Bash'
    });
    suite.assert(!result.valid, 'String tools should fail');
  });

  // =============================================
  // Department Context Validation
  // =============================================
  console.log('\nDepartment Context Validation\n');

  await suite.test('validateDepartmentContext: valid context passes', () => {
    const result = validator.validateDepartmentContext({
      name: 'marketing',
      displayName: 'Marketing',
      description: 'Social media marketing and content creation department'
    });
    suite.assert(result.valid, 'Valid context should pass');
  });

  await suite.test('validateDepartmentContext: missing fields fails', () => {
    const result = validator.validateDepartmentContext({});
    suite.assert(!result.valid, 'Empty context should fail');
    suite.assert(result.errors.length >= 3, 'Should report missing fields');
  });

  await suite.test('validateDepartmentContext: non-array agents fails', () => {
    const result = validator.validateDepartmentContext({
      name: 'marketing',
      displayName: 'Marketing',
      description: 'Social media marketing and content creation department',
      agents: 'not-an-array'
    });
    suite.assert(!result.valid, 'Non-array agents should fail');
  });

  // =============================================
  // Workflow Context Validation
  // =============================================
  console.log('\nWorkflow Context Validation\n');

  await suite.test('validateWorkflowContext: valid context passes', () => {
    const result = validator.validateWorkflowContext({
      name: 'daily-brief',
      displayName: 'Daily Brief',
      description: 'Morning briefing workflow with weather and calendar',
      department: 'life',
      steps: [
        { parallel: true, agents: [{ name: 'weather-fetcher', prompt: 'Get weather' }] }
      ]
    });
    suite.assert(result.valid, 'Valid context should pass');
  });

  await suite.test('validateWorkflowContext: empty steps fails', () => {
    const result = validator.validateWorkflowContext({
      name: 'daily-brief',
      displayName: 'Daily Brief',
      description: 'Morning briefing workflow with weather and calendar',
      department: 'life',
      steps: []
    });
    suite.assert(!result.valid, 'Empty steps should fail');
  });

  await suite.test('validateWorkflowContext: step without agents fails', () => {
    const result = validator.validateWorkflowContext({
      name: 'daily-brief',
      displayName: 'Daily Brief',
      description: 'Morning briefing workflow with weather and calendar',
      department: 'life',
      steps: [{ parallel: false, agents: [] }]
    });
    suite.assert(!result.valid, 'Step without agents should fail');
  });

  await suite.test('validateWorkflowContext: too many steps fails', () => {
    const steps = Array.from({ length: 16 }, (_, i) => ({
      parallel: false,
      agents: [{ name: `agent-${i}`, prompt: `Step ${i}` }]
    }));
    const result = validator.validateWorkflowContext({
      name: 'huge-workflow',
      displayName: 'Huge Workflow',
      description: 'A workflow with too many steps for testing',
      department: 'test',
      steps
    });
    suite.assert(!result.valid, '16 steps should exceed max of 15');
  });

  await suite.test('validateWorkflowContext: scheduled trigger without schedule fails', () => {
    const result = validator.validateWorkflowContext({
      name: 'daily-brief',
      displayName: 'Daily Brief',
      description: 'Morning briefing workflow with weather and calendar',
      department: 'life',
      steps: [{ parallel: false, agents: [{ name: 'test', prompt: 'Test' }] }],
      trigger: { type: 'scheduled' }
    });
    suite.assert(!result.valid, 'Scheduled trigger without schedule should fail');
  });

  // =============================================
  // Suggestions
  // =============================================
  console.log('\nSuggestions\n');

  await suite.test('suggestAgentName: returns empty for null', () => {
    const suggestions = validator.suggestAgentName(null);
    suite.assert(Array.isArray(suggestions), 'Should return array');
    suite.assert(suggestions.length === 0, 'Should be empty for null');
  });

  await suite.test('suggestAgentName: converts to kebab-case', () => {
    const suggestions = validator.suggestAgentName('Weather Fetcher');
    suite.assert(suggestions.some(s => s === 'weather-fetcher'), 'Should suggest kebab-case version');
  });

  await suite.test('suggestAgentName: adds prefixes for single words', () => {
    const suggestions = validator.suggestAgentName('weather');
    suite.assert(suggestions.length > 0, 'Should suggest prefixed names');
    suite.assert(suggestions.some(s => s.includes('-weather')), 'Should suggest action-weather patterns');
  });

  await suite.test('suggestAgentName: limits to 3 suggestions', () => {
    const suggestions = validator.suggestAgentName('x');
    suite.assert(suggestions.length <= 3, 'Should return at most 3 suggestions');
  });

  await suite.test('suggestTools: data-fetcher gets Bash and Read', () => {
    const tools = validator.suggestTools('data-fetcher');
    suite.assert(tools.includes('Bash'), 'data-fetcher should get Bash');
    suite.assert(tools.includes('Read'), 'data-fetcher should get Read');
  });

  await suite.test('suggestTools: orchestrator gets Task', () => {
    const tools = validator.suggestTools('orchestrator');
    suite.assert(tools.includes('Task'), 'orchestrator should get Task');
  });

  await suite.test('suggestTools: unknown type gets defaults', () => {
    const tools = validator.suggestTools('unknown');
    suite.assert(tools.includes('Read'), 'Unknown type should get Read');
    suite.assert(tools.includes('Write'), 'Unknown type should get Write');
  });

  await suite.test('suggestTools: needsApi adds Bash', () => {
    const tools = validator.suggestTools('specialist', true);
    suite.assert(tools.includes('Bash'), 'API-needing specialist should get Bash');
  });

  await suite.test('suggestEnvVarName: formats correctly', () => {
    const name = validator.suggestEnvVarName('marketing', 'twitter');
    suite.assert(name === 'MARKETING_TWITTER_KEY', `Expected MARKETING_TWITTER_KEY, got ${name}`);
  });

  await suite.test('suggestEnvVarName: handles hyphens', () => {
    const name = validator.suggestEnvVarName('customer-success', 'api-service');
    suite.assert(name.includes('CUSTOMER'), 'Should uppercase department');
    suite.assert(name.includes('API'), 'Should uppercase service');
    suite.assert(!name.includes('-'), 'Should not contain hyphens');
  });

  suite.summary();
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
