# Troubleshooting

Common issues and solutions for Motus.

## Installation Issues

### npm install fails

**Issue**: Dependencies won't install

**Solutions**:
1. Check Node.js version: `node --version` (need 18+)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`
4. Run `npm install` again

### Permission denied

**Issue**: Can't execute OAuth Manager script

**Solution**:
```bash
chmod +x start-oauth-manager.sh
```

## Environment Issues

### Environment variables not loaded

**Issue**: "WEATHER_API_KEY is not defined"

**Solutions**:
1. Check `.env` exists in project root
2. Verify variable name spelling
3. No spaces around `=`: `KEY=value` not `KEY = value`
4. Restart Claude Code session

### Invalid path errors

**Issue**: "OBSIDIAN_VAULT_PATH does not exist"

**Solutions**:
1. Use absolute paths (start with `/`)
2. Check path exists
3. Verify no typos
4. Use correct path for your OS

## Integration Issues

### API key not working

**Issue**: Integration returns "unauthorized"

**Solutions**:
1. Verify key is correct in `.env`
2. Check for extra spaces or quotes around the value
3. Ensure key hasn't been revoked at the provider
4. Test by running an agent that uses the integration

### OAuth authorization fails

**Issue**: OAuth redirect fails

**Solutions**:
1. Start OAuth Manager: `./start-oauth-manager.sh`
2. Check redirect URI matches exactly in provider settings
3. Verify Client ID and Secret are correct in `.env`
4. Clear browser cookies
5. Try a different browser

### Token expired

**Issue**: "Token expired" error

**Solution**:
1. Open OAuth Manager at `http://localhost:3001`
2. Click "Refresh" on the service card
3. If that fails, click "Disconnect" and reconnect

## Department Issues

### Department not found

**Issue**: `/motus marketing` returns "not found"

**Solutions**:
1. Check spelling
2. List departments: `/motus department list`
3. Create if missing: `/motus department create marketing`

### Department won't create

**Issue**: Creation wizard fails

**Solutions**:
1. Check name is valid (lowercase, hyphens only)
2. Ensure name not already taken
3. Verify you have write permissions
4. Check disk space

## Agent Issues

### Agent won't execute

**Issue**: Agent fails to run

**Solutions**:
1. Check agent exists: `/motus <dept> agent list`
2. Verify agent definition file exists
3. Check integration credentials if agent uses API
4. Test integration: `/motus integrations test <name>`

### Agent returns no data

**Issue**: Agent runs but returns empty

**Solutions**:
1. Check API credentials
2. Verify data exists at source
3. Run in debug mode
4. Check agent logs

### Script not executable

**Issue**: "Permission denied" for agent script

**Solution**:
```bash
chmod +x <script-path>
```

## Workflow Issues

### Workflow not found

**Issue**: `/motus life daily-brief` fails

**Solutions**:
1. List workflows: `/motus life workflow list`
2. Check spelling
3. Verify workflow exists in department

### Workflow hangs

**Issue**: Workflow never completes

**Solutions**:
1. Check for agent errors
2. Use parallel execution for independent agents
3. Check API rate limits
4. Reduce timeout if needed

### Scheduled workflow doesn't run

**Issue**: Workflow not running at scheduled time

**Solutions**:
1. Check schedule syntax (cron format)
2. Verify workflow enabled
3. Check system cron running
4. Review automation logs

## OAuth Manager Issues

### Port already in use

**Issue**: Can't start OAuth Manager

**Solution**: Kill the process using port 3001:
```bash
lsof -ti:3001 | xargs kill -9
```

Then restart: `./start-oauth-manager.sh`

### Can't connect to localhost:3001

**Issue**: Browser can't reach OAuth Manager

**Solutions**:
1. Check OAuth Manager is running in your terminal
2. Try http://127.0.0.1:3001
3. Check firewall settings
4. Restart with `./start-oauth-manager.sh`

## Data Issues

### Obsidian note not created

**Issue**: Daily note not appearing

**Solutions**:
1. Check OBSIDIAN_VAULT_PATH correct
2. Verify vault exists
3. Check write permissions
4. Look in correct folder (Daily/)

### Notion page not created

**Issue**: Notion integration fails

**Solutions**:
1. Verify NOTION_API_KEY and NOTION_DATABASE_ID are set in `.env`
2. Check database is shared with your Notion integration
3. Test by running a notion-related agent
4. Verify database properties match what agents expect

## Performance Issues

### Slow execution

**Issue**: Commands take too long

**Solutions**:
1. Use parallel agent execution
2. Check internet connection
3. Reduce API calls
4. Check for rate limiting

### High memory usage

**Issue**: Process uses too much memory

**Solutions**:
1. Reduce parallel agents
2. Clear old data
3. Restart Claude Code
4. Check for memory leaks in custom agents

## Error Messages

### "Command not found"

**Issue**: `/motus` command not recognized

**Solutions**:
1. Make sure you're in Claude Code CLI, not a regular terminal
2. Check you're in the Motus project directory
3. Verify `.claude/commands/motus.md` exists

### "Registry not found"

**Issue**: Can't load registry file

**Solutions**:
1. Check `config/registries/` directory exists
2. Verify JSON files are not corrupted
3. Restore from backup if needed
4. Create fresh empty registries based on `.env.example`

### "Invalid JSON"

**Issue**: JSON parse error

**Solutions**:
1. Check for syntax errors in JSON files
2. Use JSON validator
3. Fix or restore from backup
4. Don't manually edit registry files

## Debug Mode

### Enable Debug Logging

When running agents or workflows, you can ask Claude Code for verbose output:
```
Run the workflow with detailed logging
```

Or check the terminal output when running OAuth Manager or other scripts.

### View Logs

Check agent script output for errors. Implementation scripts output to stdout/stderr which Claude Code captures and displays.

## Getting Help

### Check Documentation

1. **[Quick Start](Quick-Start.md)** - Basic setup
2. **[Concepts](Concepts.md)** - How Motus works
3. **[Examples](Examples.md)** - Working examples

### Report an Issue

If you can't solve the issue:

1. Gather information:
   - Node.js version: `node --version`
   - Error message
   - Steps to reproduce

2. Open issue: [GitHub Issues](https://github.com/openmotus/motus/issues)

3. Include:
   - Description of problem
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version)
   - Error logs

## Common Error Patterns

### "Cannot read property of undefined"

**Cause**: Missing or null data

**Fix**: Check data source, add null checks

### "ENOENT: no such file or directory"

**Cause**: File path doesn't exist

**Fix**: Verify paths, create directories

### "ECONNREFUSED"

**Cause**: Can't connect to service

**Fix**: Check internet, verify API endpoint

### "401 Unauthorized"

**Cause**: Invalid credentials

**Fix**: Check API keys, refresh OAuth tokens

### "429 Too Many Requests"

**Cause**: Rate limit exceeded

**Fix**: Reduce API calls, wait and retry

## Prevention

### Best Practices

1. **Regular backups**: Backup `.env` and registries
2. **Test changes**: Use test mode before production
3. **Monitor logs**: Check for warnings
4. **Update regularly**: Keep dependencies updated
5. **Validate data**: Check API responses

### Health Checks

Periodically verify your setup:
- Check `.env` file has all needed variables
- Verify OAuth tokens are valid at `http://localhost:3001`
- Test agents work by running simple workflows

## Next Steps

- **[FAQ](FAQ.md)** - Frequently asked questions
- **[Contributing](Contributing.md)** - Help improve Motus

---

**Previous**: [OAuth Manager ←](OAuth-Manager.md) | **Next**: [Examples →](Examples.md)
