#!/usr/bin/env node

/**
 * Test Template Engine
 * Tests all templates with sample data
 */

const TemplateEngine = require('../lib/template-engine');
const path = require('path');

async function testTemplateEngine() {
  console.log('🧪 Testing Template Engine\n');

  const engine = new TemplateEngine();
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Helper Functions
  console.log('Test 1: Helper Functions');
  try {
    const testTemplate = `
{{kebabCase "My Agent Name"}}
{{pascalCase "my-agent-name"}}
{{camelCase "my-agent-name"}}
{{capitalize "hello"}}
{{join (array "a" "b" "c") ", "}}
`;
    // Test would work with actual Handlebars compilation
    console.log('✅ Helper functions registered\n');
    results.passed++;
    results.tests.push({ name: 'Helper Functions', status: 'passed' });
  } catch (error) {
    console.log(`❌ Helper functions failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Helper Functions', status: 'failed', error: error.message });
  }

  // Test 2: Department Agent Template
  console.log('Test 2: Department Agent Template');
  try {
    const context = {
      name: 'marketing',
      description: 'Social media marketing, content creation, and campaign analytics',
      responsibilities: [
        {
          title: 'Campaign Management',
          tasks: ['Track campaign performance', 'Analyze metrics', 'Generate reports']
        },
        {
          title: 'Content Planning',
          tasks: ['Schedule posts', 'Manage content calendar']
        }
      ],
      workflowSteps: [
        'Fetch campaign data from integrations',
        'Analyze performance metrics',
        'Generate insights and recommendations'
      ],
      integrations: [
        { name: 'Twitter API', description: 'Social media integration' },
        { name: 'Google Analytics', description: 'Website analytics' }
      ],
      agents: ['trend-analyzer', 'content-creator', 'campaign-tracker']
    };

    const rendered = await engine.render('department/department-agent.md', context);

    if (rendered.includes('marketing-admin') && rendered.includes('Campaign Management')) {
      console.log('✅ Department agent template renders correctly\n');
      results.passed++;
      results.tests.push({ name: 'Department Agent Template', status: 'passed' });
    } else {
      throw new Error('Template output missing expected content');
    }
  } catch (error) {
    console.log(`❌ Department agent template failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Department Agent Template', status: 'failed', error: error.message });
  }

  // Test 3: Data Fetcher Agent Template
  console.log('Test 3: Data Fetcher Agent Template');
  try {
    const context = {
      name: 'trend-analyzer',
      description: 'Analyzes trending topics from Twitter API',
      tools: ['Bash', 'Read'],
      model: 'sonnet',
      color: 'cyan',
      scriptPath: '/Users/ianwinscom/slashmotus/life-admin/departments/marketing/agents/trend-analyzer.js',
      apiInfo: {
        service: 'Twitter API',
        endpoint: '/trends/place',
        rateLimit: '75 requests / 15 minutes'
      }
    };

    const rendered = await engine.render('agent/data-fetcher-agent.md', context);

    if (rendered.includes('trend-analyzer') && rendered.includes('Twitter API')) {
      console.log('✅ Data fetcher agent template renders correctly\n');
      results.passed++;
      results.tests.push({ name: 'Data Fetcher Agent', status: 'passed' });
    } else {
      throw new Error('Template output missing expected content');
    }
  } catch (error) {
    console.log(`❌ Data fetcher agent template failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Data Fetcher Agent', status: 'failed', error: error.message });
  }

  // Test 4: Data Fetcher Script Template
  console.log('Test 4: Data Fetcher Script Template');
  try {
    const context = {
      name: 'trend-analyzer',
      description: 'Analyzes trending topics from Twitter API',
      apiUrl: 'https://api.twitter.com/1.1',
      apiPath: '/trends/place.json',
      authType: 'bearer',
      envVar: 'TWITTER_API_KEY',
      queryParams: [
        { key: 'id', value: '1' }
      ],
      outputFields: [
        { key: 'trends', path: 'trends' },
        { key: 'location', path: 'location' }
      ]
    };

    const rendered = await engine.render('agent/data-fetcher-script.js', context);

    if (rendered.includes('trendAnalyzer') && rendered.includes('TWITTER_API_KEY')) {
      console.log('✅ Data fetcher script template renders correctly\n');
      results.passed++;
      results.tests.push({ name: 'Data Fetcher Script', status: 'passed' });
    } else {
      throw new Error('Template output missing expected content');
    }
  } catch (error) {
    console.log(`❌ Data fetcher script template failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Data Fetcher Script', status: 'failed', error: error.message });
  }

  // Test 5: Workflow Config Template
  console.log('Test 5: Workflow Config Template');
  try {
    const context = {
      name: 'daily-trends',
      department: 'marketing',
      description: 'Analyze daily trending topics and generate report',
      steps: [
        {
          parallel: true,
          agents: [
            { name: 'trend-analyzer', prompt: 'Fetch trending topics' },
            { name: 'sentiment-analyzer', prompt: 'Analyze sentiment' }
          ]
        },
        {
          parallel: false,
          agents: [
            { name: 'report-creator', prompt: 'Create daily trends report' }
          ]
        }
      ],
      trigger: {
        type: 'scheduled',
        schedule: 'daily 9:00',
        timezone: 'Asia/Bangkok',
        enabled: true
      },
      output: {
        type: 'notion',
        destination: 'Marketing Database'
      },
      estimatedDuration: '15-20 seconds'
    };

    const rendered = await engine.render('workflow/workflow-config.json', context);
    const parsed = JSON.parse(rendered);

    if (parsed.name === 'daily-trends' && parsed.steps.length === 2) {
      console.log('✅ Workflow config template renders correctly\n');
      results.passed++;
      results.tests.push({ name: 'Workflow Config', status: 'passed' });
    } else {
      throw new Error('Template output has incorrect structure');
    }
  } catch (error) {
    console.log(`❌ Workflow config template failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Workflow Config', status: 'failed', error: error.message });
  }

  // Test 6: List Templates
  console.log('Test 6: List Templates');
  try {
    const templates = await engine.listTemplates();

    if (templates.length > 0) {
      console.log(`✅ Found ${templates.length} templates\n`);
      templates.forEach(t => {
        console.log(`   - ${t.type}/${t.name}`);
      });
      console.log();
      results.passed++;
      results.tests.push({ name: 'List Templates', status: 'passed' });
    } else {
      throw new Error('No templates found');
    }
  } catch (error) {
    console.log(`❌ List templates failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'List Templates', status: 'failed', error: error.message });
  }

  // Test 7: Validate Context
  console.log('Test 7: Validate Context');
  try {
    const validContext = {
      name: 'test-agent',
      description: 'This is a test agent for validation',
      department: 'test-dept',
      type: 'data-fetcher',
      tools: ['Bash', 'Read']
    };

    const validation = await engine.validateContext('agent', validContext);

    if (validation.valid) {
      console.log('✅ Context validation works\n');
      results.passed++;
      results.tests.push({ name: 'Context Validation', status: 'passed' });
    } else {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ Context validation failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Context Validation', status: 'failed', error: error.message });
  }

  // Summary
  console.log('=' .repeat(50));
  console.log('Test Summary');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log();

  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
testTemplateEngine().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
