# Contributing

Help improve Motus! This guide explains how to contribute to the project.

## Ways to Contribute

### 1. Report Bugs

Found a bug? Help us fix it!

**Steps**:
1. Check [existing issues](https://github.com/openmotus/slashmotus/issues)
2. Create new issue if not reported
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Motus version (`/motus --version`)
   - Environment (OS, Node version)
   - Error logs

**Template**:
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Run `/motus ...`
2. ...
3. Error occurs

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Motus version: 1.0.0
- Node.js: v18.0.0
- OS: macOS 14.0

## Error Logs
```
Paste error logs here
```
```

### 2. Suggest Features

Have an idea? We'd love to hear it!

**Steps**:
1. Check [existing feature requests](https://github.com/openmotus/slashmotus/issues?q=is%3Aissue+label%3Aenhancement)
2. Create new issue with label "enhancement"
3. Include:
   - Clear description
   - Use case
   - Example implementation
   - Benefits

**Template**:
```markdown
## Feature Request
Brief description

## Use Case
Who would use this and why?

## Proposed Implementation
How might this work?

## Benefits
What problems does this solve?

## Alternatives Considered
What other approaches did you consider?
```

### 3. Improve Documentation

Documentation can always be better!

**What to improve**:
- Fix typos
- Clarify confusing sections
- Add examples
- Update outdated info
- Translate to other languages

**How**:
1. Fork the repository
2. Edit files in `public-docs/`
3. Submit pull request
4. Describe what you changed and why

### 4. Share Examples

Help others by sharing your departments, agents, and workflows!

**What to share**:
- Complete department setups
- Useful agents
- Creative workflows
- Integration templates

**How**:
1. Add to `Examples.md`
2. Include:
   - Clear description
   - Setup steps
   - Code/config
   - Use case
3. Submit pull request

### 5. Contribute Code

Write code to improve Motus!

**Areas to contribute**:
- Core libraries
- Templates
- Agents
- Documentation generators
- Bug fixes
- Performance improvements

**How**:
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update docs
6. Submit pull request

## Development Setup

### Prerequisites

- Node.js 18+
- Git
- Claude Code CLI

### Setup Steps

1. **Fork and Clone**

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/slashmotus.git
cd slashmotus
```

2. **Install Dependencies**

```bash
npm install
```

3. **Create .env**

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Test Setup**

In Claude Code:
```
/motus --version
```

### Development Workflow

1. **Create Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**

Edit files, add features, fix bugs

3. **Test Changes**

```
/motus test
```

Run affected commands to verify

4. **Commit Changes**

```bash
git add .
git commit -m "feat: add new feature"
```

Use [conventional commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

5. **Push Branch**

```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**

- Go to GitHub
- Click "New Pull Request"
- Describe your changes
- Link related issues
- Request review

## Code Standards

### JavaScript Style

- Use ES6+ features
- Async/await over promises
- Clear variable names
- Comments for complex logic
- Error handling for all async operations

**Example**:
```javascript
// Good
async function fetchWeatherData() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch weather:', error.message);
    throw error;
  }
}

// Avoid
function fetchWeatherData() {
  return axios.get(API_URL)
    .then(r => r.data)
    .catch(e => console.error(e));
}
```

### Documentation Style

- Clear, concise writing
- Code examples for all features
- Real-world use cases
- Step-by-step instructions
- Use Claude Code commands (not bash)

**Example**:
```markdown
<!-- Good -->
## Creating an Agent

In Claude Code, use the creation wizard:

\```
/motus marketing agent create trend-analyzer
\```

<!-- Avoid -->
## Creating an Agent

You can create agents using the command line...
```

### Template Style

- Consistent formatting
- Clear placeholder comments
- Validation logic
- Error handling
- Documentation blocks

**Example**:
```handlebars
{{!-- Agent Definition Template --}}
---
subagent_type: {{type}}
description: {{description}}
tools: {{join tools ", "}}
---

{{#if (eq type "data-fetcher")}}
Execute the script: {{script}}
{{else}}
Perform the following tasks:
1. {{firstTask}}
2. {{secondTask}}
{{/if}}
```

## Testing

### Manual Testing

Test your changes:

1. **Unit level**: Test individual functions
2. **Integration level**: Test agent/workflow execution
3. **End-to-end**: Test complete user flows

### Test Cases

Create test cases for:
- Happy path (everything works)
- Error conditions
- Edge cases
- Different configurations

**Example Test**:
```javascript
// Test weather-fetcher agent
describe('weather-fetcher', () => {
  it('should fetch current weather', async () => {
    const result = await runAgent('weather-fetcher');
    expect(result).toHaveProperty('temperature');
    expect(result).toHaveProperty('conditions');
  });

  it('should handle API errors gracefully', async () => {
    // Test with invalid API key
    process.env.WEATHER_API_KEY = 'invalid';
    const result = await runAgent('weather-fetcher');
    expect(result.status).toBe('error');
  });
});
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Commits follow conventional format
- [ ] Branch is up to date with main

### PR Description

Include:
1. **What**: What does this PR do?
2. **Why**: Why is this change needed?
3. **How**: How does it work?
4. **Testing**: How was it tested?
5. **Screenshots**: If UI changes

**Template**:
```markdown
## Description
Brief description of changes

## Motivation
Why is this needed?

## Changes
- Added X
- Modified Y
- Fixed Z

## Testing
How to test:
1. Run `/motus ...`
2. Verify ...

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks**: CI runs tests
2. **Maintainer review**: Code review by team
3. **Revisions**: Address feedback
4. **Approval**: Maintainer approves
5. **Merge**: PR merged to main

## Community Guidelines

### Be Respectful

- Welcoming to all contributors
- Constructive feedback
- Patient with beginners
- Professional communication

### Be Helpful

- Answer questions
- Review pull requests
- Share knowledge
- Mentor new contributors

### Be Collaborative

- Discuss before major changes
- Consider different perspectives
- Compromise when needed
- Credit others' work

## Getting Help

### Questions?

- Check [Documentation](README.md)
- Search [existing issues](https://github.com/openmotus/slashmotus/issues)
- Ask in [Discussions](https://github.com/openmotus/slashmotus/discussions)

### Stuck?

- Comment on your PR
- Tag maintainers
- Join community chat

## Recognition

Contributors are recognized:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Featured in documentation

Thank you for contributing to Motus! 🚀

---

**Previous**: [API Reference ←](API-Reference.md) | **Next**: [FAQ →](FAQ.md)
