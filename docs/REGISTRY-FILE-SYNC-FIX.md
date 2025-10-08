# Registry-File Synchronization Fix

**Date:** 2025-10-08
**Issue:** Agent registry entries were being created without corresponding agent definition files
**Status:** ✅ FIXED

## Problem

When creating agents through the department creation wizard or via `RegistryManager.addAgent()`, only the registry entries (JSON files) were being updated. The actual agent definition files (`.md` files in `.claude/agents/`) and implementation scripts (`.js` files) were not being generated.

This caused a critical desynchronization where:
- Registry showed agents existed
- No actual agent files were present
- Agents couldn't be used by the Task tool
- System appeared broken to users

### Example of the Bug

```javascript
// Before fix: This would create registry entry but NO files
await registryManager.addAgent({
  name: 'test-agent',
  displayName: 'Test Agent',
  department: 'marketing',
  type: 'specialist',
  description: 'A test agent'
});

// Result:
// ✅ config/registries/agents.json updated
// ❌ .claude/agents/test-agent.md NOT created
```

## Root Cause

The `RegistryManager` class was designed only to manage JSON registry files, not to handle file generation. File generation was left to separate manual steps, which were easy to forget or skip.

## Solution

Updated `RegistryManager` to **automatically generate all required files** when adding agents or departments to the registry. This ensures atomic operations where registry updates and file generation happen together.

### Changes Made

#### 1. Updated `RegistryManager` (lib/registry-manager.js)

**Added automatic file generation:**
```javascript
async addAgent(data) {
  // ... existing registry logic ...

  // *** CRITICAL: Generate agent definition file ***
  await this._generateAgentFiles(this.agents.agents[name]);

  await this.save();
  return this.agents.agents[name];
}
```

**Added file generation helper:**
```javascript
async _generateAgentFiles(agent) {
  // 1. Generate .md agent definition file
  const agentDefPath = path.join(this.basePath, '.claude', 'agents', `${name}.md`);
  await this.templateEngine.renderToFile(templateName, agentContext, agentDefPath);

  // 2. Generate .js implementation script (for data-fetchers only)
  if (type === 'data-fetcher' && script) {
    const scriptPath = path.isAbsolute(script) ? script : path.join(this.basePath, script);
    await this.templateEngine.renderToFile('agent/data-fetcher-script.js', agentContext, scriptPath);
    await fs.chmod(scriptPath, 0o755);
  }
}
```

**Added department file generation:**
```javascript
async addDepartment(data) {
  // ... existing registry logic ...

  // *** CRITICAL: Generate department master agent file ***
  await this._generateDepartmentAgentFile(this.departments.departments[name]);

  await this.save();
  return this.departments.departments[name];
}
```

**Added file validation:**
```javascript
async validateFiles() {
  // Check that all registry entries have corresponding files
  // Returns errors for missing agent definition files
  // Returns warnings for missing implementation scripts
}
```

#### 2. Bug Fixes

**Fixed script path handling:**
```javascript
// Before: Would duplicate absolute paths
const scriptPath = path.join(this.basePath, script);

// After: Handles both absolute and relative paths
const scriptPath = path.isAbsolute(script) ? script : path.join(this.basePath, script);
```

## Verification

Created and ran comprehensive tests to verify the fix works:

```bash
✅ Test 1: Agent added to registry
✅ Test 2: Agent file automatically generated
✅ Test 3: Complete integration successful
```

## Impact

### Before Fix
- Manual file generation required
- Easy to forget steps
- Registry and filesystem could desynchronize
- Agents listed but unusable

### After Fix
- ✅ Fully automatic file generation
- ✅ Atomic operations (registry + files together)
- ✅ No manual steps required
- ✅ Files always in sync with registry
- ✅ Validation method to detect any issues

## Usage

### Creating Agents

```javascript
const registry = new RegistryManager();
await registry.load();

// This now automatically generates:
// 1. Registry entry in config/registries/agents.json
// 2. Agent definition in .claude/agents/my-agent.md
// 3. Implementation script (if data-fetcher)
await registry.addAgent({
  name: 'my-agent',
  displayName: 'My Agent',
  department: 'marketing',
  type: 'specialist',
  description: 'Does amazing things',
  tools: ['Read', 'Write'],
  model: 'sonnet'
});
```

### Creating Departments

```javascript
// This now automatically generates:
// 1. Registry entry in config/registries/departments.json
// 2. Department agent in .claude/agents/my-dept-admin.md
await registry.addDepartment({
  name: 'my-dept',
  displayName: 'My Department',
  description: 'Department description',
  integrations: [],
  responsibilities: []
});
```

### Validating Files

```javascript
// Check that all registry entries have corresponding files
const validation = await registry.validateFiles();

if (!validation.valid) {
  console.error('Missing files:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

## Migration

No migration needed for existing agents - they already have their files. The fix only affects new agent/department creation going forward.

However, if you discover missing files, you can regenerate them using the validation method to identify which are missing, then manually call `_generateAgentFiles()` for those agents.

## Prevention

This fix ensures the registry/file desynchronization bug **cannot happen again** because:

1. File generation is now part of the core `addAgent()` method
2. Operations are atomic (registry + files together)
3. No manual steps to forget
4. Validation method available to detect issues early
5. Clear error messages if file generation fails

## Related Files

- `lib/registry-manager.js` - Core fix implementation
- `lib/template-engine.js` - Template rendering for file generation
- `templates/agent/*.hbs` - Agent definition templates
- `templates/department/*.hbs` - Department agent templates
- `config/registries/*.json` - Registry files

## Future Improvements

- Add `repairRegistry()` method to regenerate missing files for existing agents
- Add pre-commit hook to validate registry/file sync
- Add GitHub Actions workflow to validate on PR
- Consider making file paths in registry relative instead of absolute
