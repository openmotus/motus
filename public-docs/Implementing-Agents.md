# Implementing Agents

This guide explains how agents actually work in Motus - from definition files to implementation scripts, and how they get executed by Claude Code.

## Agent Architecture

Every agent in Motus has two parts:

1. **Agent Definition** (`.md` file) - Tells Claude Code what the agent does
2. **Implementation** (optional `.js` file or inline logic) - The actual code that executes

```
Agent = Definition + Implementation
```

### The Two-Part System

```
.claude/agents/weather-fetcher.md    ← Definition (what)
tasks/agents/weather-fetcher.js      ← Implementation (how)
```

**Why two parts?**
- **Definition** = Claude Code reads this to understand the agent's purpose
- **Implementation** = The actual code that runs when the agent is invoked

## Agent Definitions (.md files)

### Location

All agent definitions live in `.claude/agents/`:

```
.claude/
└── agents/
    ├── tasks-admin.md
    ├── task-fetcher.md
    ├── task-prioritizer.md
    └── weather-fetcher.md
```

### Structure

Agent definitions use **frontmatter** (YAML) + **markdown content**:

```markdown
---
name: weather-fetcher
description: Fetches current weather data from WeatherAPI
tools: Bash, Read
model: sonnet
color: cyan
---

You are the Weather Fetcher agent, a data fetcher for the Tasks department.

## Primary Responsibility

Fetch current weather conditions and forecasts from WeatherAPI.

## How This Agent Works

This agent executes a Node.js script that calls the WeatherAPI and returns
structured JSON data with temperature, conditions, and forecast.

## Execution

```bash
node tasks/agents/weather-fetcher.js [location]
```

## Output Format

Returns JSON with:
- location: City name
- temperature: Current temp in °F
- conditions: Weather description
- forecast: 3-day forecast array
```

### Frontmatter Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `name` | Yes | Agent identifier (kebab-case) | `weather-fetcher` |
| `description` | Yes | What the agent does | `Fetches weather data` |
| `tools` | Yes | Claude Code tools it can use | `Bash, Read, Write` |
| `model` | Yes | Claude model (`sonnet` or `opus`) | `sonnet` |
| `color` | No | Display color in UI | `cyan` |

### How Claude Code Uses Definitions

When you invoke an agent in Claude Code:

```
Use the weather-fetcher agent to get the weather for Seattle
```

Claude Code:
1. Reads `.claude/agents/weather-fetcher.md`
2. Understands the agent's purpose from the description
3. Sees it has `Bash` and `Read` tools available
4. Executes the implementation (script or inline logic)
5. Returns the result

## Implementation Files (.js scripts)

### When You Need Implementation Files

| Agent Type | Needs Script? | Why |
|------------|---------------|-----|
| **Data Fetcher** | Usually YES | Needs to call external APIs |
| **Specialist** | Sometimes | Depends on complexity |
| **Orchestrator** | NO | Uses Task tool to invoke others |

### Location

Implementation scripts live in your department's `agents/` directory:

```
tasks/
└── agents/
    ├── task-fetcher.js
    ├── task-prioritizer.js
    └── weather-fetcher.js
```

### Standard Script Structure

Here's the canonical structure for implementation scripts:

```javascript
#!/usr/bin/env node

/**
 * Agent Name
 * Description of what this agent does
 */

// Load environment variables
require('dotenv').config();

// Dependencies
const axios = require('axios');
const fs = require('fs');

/**
 * Main function - named after the agent
 * @param {string} param - Description of parameter
 * @returns {Object} - Structured data
 */
async function agentFunction(param) {
  try {
    // 1. Validate inputs
    if (!param) {
      throw new Error('Parameter is required');
    }

    // 2. Get credentials from environment
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY not found in environment');
    }

    // 3. Make API call or process data
    const response = await axios.get('https://api.example.com/data', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      params: { query: param }
    });

    // 4. Transform and return structured data
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // 5. Handle errors gracefully
    console.error('Error in agent:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// 6. CLI execution support
if (require.main === module) {
  const param = process.argv[2];
  agentFunction(param).then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// 7. Export for use in other scripts
module.exports = { agentFunction };
```

### The Seven Key Sections

1. **Shebang & Documentation** - Makes it executable, explains purpose
2. **Dependencies** - Import required libraries
3. **Main Function** - Core logic, named descriptively
4. **Validation** - Check inputs and environment
5. **Processing** - API calls, data manipulation
6. **CLI Support** - Allow running directly: `node script.js param`
7. **Module Export** - Allow importing in other scripts

## How Agents Get Executed

### Execution Flow

```
User message in Claude Code
         ↓
"Use the weather-fetcher agent to get Seattle weather"
         ↓
Claude Code reads .claude/agents/weather-fetcher.md
         ↓
Sees: tools: Bash, Read
         ↓
Executes: node tasks/agents/weather-fetcher.js "Seattle"
         ↓
Script returns JSON output
         ↓
Claude Code processes and responds to user
```

### The Task Tool

**Orchestrator agents** use the `Task` tool to invoke other agents:

```markdown
---
name: daily-coordinator
tools: Task, Read, Write
---

You are the Daily Coordinator. When invoked, you should:

1. Use the Task tool to invoke weather-fetcher in parallel
2. Use the Task tool to invoke calendar-fetcher in parallel
3. Compile results into a daily briefing
```

When Claude Code sees `Task` in tools, it knows this agent can invoke others.

### The Bash Tool

**Data Fetcher agents** use the `Bash` tool to run scripts:

```markdown
---
name: weather-fetcher
tools: Bash, Read
---

Execute: node tasks/agents/weather-fetcher.js [location]
```

When Claude Code sees `Bash` in tools, it can execute shell commands and scripts.

## Complete Example: Weather Agent

Let's build a complete weather agent from scratch.

### Step 1: Create the Agent Definition

File: `.claude/agents/weather-fetcher.md`

```markdown
---
name: weather-fetcher
description: Fetches current weather and 3-day forecast from WeatherAPI
tools: Bash, Read
model: sonnet
color: cyan
---

You are the Weather Fetcher agent for the Tasks department.

## Primary Responsibility

Fetch current weather conditions and forecasts for a given location.

## API Integration

This agent uses WeatherAPI.com to retrieve weather data.

**Required Environment Variable:**
- `WEATHER_API_KEY` - Your API key from weatherapi.com

## Execution

```bash
node tasks/agents/weather-fetcher.js [location]
```

**Parameters:**
- `location` - City name or zip code (e.g., "Seattle" or "98101")

## Output Format

Returns JSON with:
- `location`: Full location name
- `current`: Current conditions object
  - `temp_f`: Temperature in Fahrenheit
  - `condition`: Weather description
  - `humidity`: Humidity percentage
  - `wind_mph`: Wind speed
- `forecast`: Array of 3-day forecast objects
- `timestamp`: When data was fetched

## Usage Example

In Claude Code:
```
Use the weather-fetcher agent to get the weather for Seattle
```

The agent will execute the script and return formatted weather data.

## Error Handling

Returns structured error if:
- Location not found
- API key invalid
- API rate limit exceeded
```

### Step 2: Create the Implementation

File: `tasks/agents/weather-fetcher.js`

```javascript
#!/usr/bin/env node

/**
 * Weather Fetcher
 * Fetches current weather and 3-day forecast from WeatherAPI
 */

require('dotenv').config();
const axios = require('axios');

/**
 * Fetch weather data for a location
 * @param {string} location - City name or zip code
 * @returns {Object} Weather data with current conditions and forecast
 */
async function fetchWeather(location = 'Seattle') {
  try {
    // Validate API key
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('WEATHER_API_KEY not found in .env file');
    }

    // Validate location
    if (!location || location.trim().length === 0) {
      throw new Error('Location parameter is required');
    }

    // Call WeatherAPI
    const response = await axios.get('https://api.weatherapi.com/v1/forecast.json', {
      params: {
        key: apiKey,
        q: location,
        days: 3,
        aqi: 'no',
        alerts: 'no'
      }
    });

    // Transform response to our format
    const data = response.data;

    return {
      success: true,
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country
      },
      current: {
        temp_f: data.current.temp_f,
        temp_c: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        wind_mph: data.current.wind_mph,
        feelslike_f: data.current.feelslike_f
      },
      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        maxtemp_f: day.day.maxtemp_f,
        mintemp_f: day.day.mintemp_f,
        condition: day.day.condition.text,
        chance_of_rain: day.day.daily_chance_of_rain
      })),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // Handle API errors
    if (error.response) {
      // API returned an error
      return {
        success: false,
        error: error.response.data.error.message,
        timestamp: new Date().toISOString()
      };
    } else if (error.message.includes('WEATHER_API_KEY')) {
      // Missing API key
      return {
        success: false,
        error: 'Weather API key not configured. Add WEATHER_API_KEY to your .env file.',
        timestamp: new Date().toISOString()
      };
    } else {
      // Other errors
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// CLI execution
if (require.main === module) {
  const location = process.argv[2] || 'Seattle';

  fetchWeather(location).then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fetchWeather };
```

### Step 3: Configure Environment

Add to `.env`:

```bash
# Weather API
WEATHER_API_KEY=your_api_key_from_weatherapi.com
```

Get a free API key at https://www.weatherapi.com/signup.aspx

### Step 4: Test Independently

```bash
# Make executable
chmod +x tasks/agents/weather-fetcher.js

# Test with default location
node tasks/agents/weather-fetcher.js

# Test with specific location
node tasks/agents/weather-fetcher.js "New York"
```

**Expected Output:**

```json
{
  "success": true,
  "location": {
    "name": "New York",
    "region": "New York",
    "country": "United States of America"
  },
  "current": {
    "temp_f": 68.0,
    "temp_c": 20.0,
    "condition": "Partly cloudy",
    "humidity": 65,
    "wind_mph": 8.1,
    "feelslike_f": 68.0
  },
  "forecast": [
    {
      "date": "2025-10-09",
      "maxtemp_f": 72.0,
      "mintemp_f": 58.0,
      "condition": "Sunny",
      "chance_of_rain": 0
    },
    ...
  ],
  "timestamp": "2025-10-09T..."
}
```

### Step 5: Test in Claude Code

In Claude Code:

```
Use the weather-fetcher agent to get the current weather for San Francisco
```

Claude Code will:
1. Read the agent definition
2. Execute: `node tasks/agents/weather-fetcher.js "San Francisco"`
3. Return the formatted weather data to you

## Testing Your Agents

### Test Strategy

1. **Unit Test** - Test the script independently
2. **Integration Test** - Test with Claude Code
3. **Workflow Test** - Test in a complete workflow

### 1. Unit Testing (Script Level)

```bash
# Test the script directly
node tasks/agents/weather-fetcher.js "Seattle"

# Test error handling
node tasks/agents/weather-fetcher.js ""  # Should return error

# Test with invalid API key
WEATHER_API_KEY=invalid node tasks/agents/weather-fetcher.js "Seattle"
```

### 2. Integration Testing (Claude Code Level)

In Claude Code:

```
Use the weather-fetcher agent to get weather for:
1. Seattle
2. New York
3. London
```

Verify:
- ✅ Agent executes successfully
- ✅ Returns structured data
- ✅ Handles multiple requests
- ✅ Error messages are clear

### 3. Workflow Testing (End-to-End)

Create a test workflow:

```
/motus tasks workflow create test-weather
```

Run it:

```
/motus tasks test-weather
```

Verify the workflow executes and the agent returns expected data.

### Debugging Failed Agents

**Symptom**: Agent returns error in Claude Code

**Debug Steps:**

1. **Test script independently**
   ```bash
   node tasks/agents/agent-name.js [params]
   ```

2. **Check environment variables**
   ```bash
   echo $WEATHER_API_KEY
   # Or check .env file
   cat .env | grep WEATHER_API_KEY
   ```

3. **Verify API access**
   ```bash
   curl "https://api.weatherapi.com/v1/current.json?key=$WEATHER_API_KEY&q=Seattle"
   ```

4. **Check agent definition**
   ```bash
   cat .claude/agents/agent-name.md
   # Verify tools list includes Bash
   ```

5. **Review error output**
   - Read the error message carefully
   - Check if it's an API error, auth error, or code error

## Common Patterns

### Pattern 1: API Data Fetcher

**Use Case**: Get data from external API

**Definition:**
```markdown
---
tools: Bash, Read
---
Execute: node dept/agents/api-fetcher.js [param]
```

**Implementation:**
```javascript
async function fetchFromAPI(param) {
  const response = await axios.get(API_URL, { params: { q: param } });
  return { success: true, data: response.data };
}
```

### Pattern 2: File Processor

**Use Case**: Read and process local files

**Definition:**
```markdown
---
tools: Read, Write
---
Execute: node dept/agents/file-processor.js [input-file]
```

**Implementation:**
```javascript
async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const processed = transform(content);
  return { success: true, data: processed };
}
```

### Pattern 3: Analyst (No Script Needed)

**Use Case**: Analyze data using Claude's intelligence

**Definition:**
```markdown
---
tools: Read, Write
---

You are an analyst agent. When given data:
1. Read the input data
2. Analyze patterns and trends
3. Generate insights
4. Write summary report
```

**Implementation:** None needed - Claude does the analysis

### Pattern 4: Orchestrator

**Use Case**: Coordinate multiple agents

**Definition:**
```markdown
---
tools: Task, Read, Write
---

You are an orchestrator. Execute these steps:
1. Use Task tool to invoke agent-a in parallel with agent-b
2. Compile results from both agents
3. Write final report
```

**Implementation:** None needed - uses Task tool

## Best Practices

### ✅ DO

- **Keep scripts focused** - One clear responsibility
- **Validate inputs** - Check all parameters
- **Handle errors gracefully** - Return structured errors
- **Use environment variables** - Never hardcode API keys
- **Return consistent format** - Always include `success` and `timestamp`
- **Test independently first** - Before testing in Claude Code
- **Document execution** - Show exact command in agent definition
- **Make scripts executable** - `chmod +x script.js`

### ❌ DON'T

- **Don't hardcode secrets** - Use .env file
- **Don't ignore errors** - Always handle and return them
- **Don't return inconsistent formats** - Stick to a schema
- **Don't mix responsibilities** - Keep it single-purpose
- **Don't skip validation** - Check inputs and environment
- **Don't use `console.log` for data** - Use for errors only, return JSON for data
- **Don't forget the shebang** - `#!/usr/bin/env node` for direct execution

## Where to Put Implementation Files

### Recommended Structure

```
motus/
├── .claude/agents/          # All agent definitions
│   ├── tasks-admin.md
│   ├── task-fetcher.md
│   └── weather-fetcher.md
│
├── tasks/                   # Department directory
│   ├── agents/             # Implementation scripts
│   │   ├── task-fetcher.js
│   │   └── weather-fetcher.js
│   ├── workflows/          # Workflow orchestrators
│   │   └── daily-tasks.sh
│   └── data/               # Data files
│       └── tasks.json
│
└── .env                    # Environment variables
```

### Naming Convention

**Match the agent name:**
- Agent definition: `.claude/agents/weather-fetcher.md`
- Implementation: `dept/agents/weather-fetcher.js`

**Keep consistent:**
- Use kebab-case for both: `weather-fetcher`, `task-prioritizer`
- Match exactly: If agent is `weather-fetcher`, script is `weather-fetcher.js`

## Example: Building a Complete Specialist Agent

Let's build a sentiment analyzer that doesn't need a script.

### Agent Definition Only

File: `.claude/agents/sentiment-analyzer.md`

```markdown
---
name: sentiment-analyzer
description: Analyzes text sentiment and emotional tone
tools: Read, Write
model: sonnet
---

You are the Sentiment Analyzer, a specialist in emotional analysis.

## Primary Responsibility

Analyze text for sentiment, emotional tone, and overall mood.

## How This Works

You use Claude's natural language understanding to:
1. Read the provided text
2. Identify emotional indicators
3. Classify sentiment (positive/neutral/negative)
4. Detect specific emotions (joy, anger, sadness, etc.)
5. Provide confidence scores

## Analysis Framework

**Sentiment Scale:**
- Very Negative: -1.0 to -0.6
- Negative: -0.6 to -0.2
- Neutral: -0.2 to 0.2
- Positive: 0.2 to 0.6
- Very Positive: 0.6 to 1.0

**Emotions to Detect:**
- Joy, Excitement, Contentment
- Sadness, Disappointment, Grief
- Anger, Frustration, Irritation
- Fear, Anxiety, Worry
- Surprise, Confusion

## Output Format

Return JSON with:
```json
{
  "sentiment": {
    "score": 0.7,
    "label": "Positive",
    "confidence": 0.85
  },
  "emotions": [
    { "emotion": "joy", "intensity": 0.8 },
    { "emotion": "excitement", "intensity": 0.6 }
  ],
  "summary": "The text expresses strong positive emotion with high joy and excitement.",
  "keyPhrases": ["amazing experience", "couldn't be happier"],
  "timestamp": "2025-10-09T..."
}
```

## Usage Example

In Claude Code:
```
Use the sentiment-analyzer agent to analyze this text:
"I just finished the project and couldn't be happier! The team did an amazing job."
```
```

**No script needed** - Claude's intelligence does the analysis!

## Next Steps

- **[Creating Agents](Creating-Agents.md)** - Using the creation wizard
- **[Creating Workflows](Creating-Workflows.md)** - Combining agents
- **[Tutorial](Tutorial-First-Department.md)** - Build a complete system
- **[Troubleshooting](Troubleshooting.md)** - Debug agent issues

---

**Previous**: [Creating Agents ←](Creating-Agents.md) | **Next**: [Creating Workflows →](Creating-Workflows.md)
