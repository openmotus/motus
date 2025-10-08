/**
 * OAuth Registry Manager
 *
 * Manages OAuth configurations in the OAuth Manager server
 * Automatically registers new OAuth integrations when departments are created
 */

const fs = require('fs').promises;
const path = require('path');

class OAuthRegistry {
  constructor(basePath = null) {
    this.basePath = basePath || path.join(__dirname, '..');
    this.serverPath = path.join(this.basePath, 'oauth-manager', 'server.js');
    this.oauthConfigs = {};
  }

  /**
   * Load current OAuth configurations from server.js
   */
  async load() {
    try {
      const serverContent = await fs.readFile(this.serverPath, 'utf8');

      // Extract OAUTH_CONFIGS object
      const configMatch = serverContent.match(/const OAUTH_CONFIGS = \{([\s\S]*?)\n\};/);
      if (configMatch) {
        // We have the configs, but parsing them is complex
        // For now, we'll track them separately
        console.log('✓ OAuth Registry loaded');
      }

      return true;
    } catch (error) {
      console.error('Error loading OAuth Registry:', error.message);
      return false;
    }
  }

  /**
   * Add an OAuth integration to the OAuth Manager
   *
   * @param {Object} integration - Integration configuration
   * @param {string} integration.id - Service ID (e.g., 'facebook', 'linkedin')
   * @param {string} integration.name - Display name (e.g., 'Facebook API')
   * @param {string} integration.icon - Emoji icon (e.g., '📘')
   * @param {string[]} integration.envVars - Required environment variables
   * @param {string} integration.authUrl - OAuth authorization URL
   * @param {string} integration.tokenUrl - OAuth token endpoint URL
   * @param {string[]} integration.scopes - OAuth scopes
   */
  async addIntegration(integration) {
    const { id, name, icon, envVars, authUrl, tokenUrl, scopes } = integration;

    if (!id || !name || !envVars || envVars.length === 0) {
      throw new Error('Missing required integration fields: id, name, envVars');
    }

    console.log(`Adding OAuth integration: ${name}...`);

    // Read current server.js
    let serverContent = await fs.readFile(this.serverPath, 'utf8');

    // 1. Add to OAUTH_CONFIGS object
    const serviceConfig = this._generateServiceConfig(integration);

    // Find the OAUTH_CONFIGS object and add the new service
    const configsRegex = /(const OAUTH_CONFIGS = \{[\s\S]*?)(\n\  \/\/ Future services)/;
    const match = serverContent.match(configsRegex);

    if (match) {
      // Insert before "// Future services" comment
      const newConfigs = match[1] + ',\n' + serviceConfig + match[2];
      serverContent = serverContent.replace(configsRegex, newConfigs);
    } else {
      console.warn('⚠️  Could not find insertion point in OAUTH_CONFIGS');
      return false;
    }

    // 2. Add initialization function
    const initFunction = this._generateInitFunction(integration);

    // Find where to insert the init function (after existing ones)
    const initRegex = /(oauthClients\.oura = initOuraOAuth\(\);)/;
    serverContent = serverContent.replace(initRegex, `$1\n\n${initFunction}\n\noauthClients.${id} = init${this._pascalCase(id)}OAuth();`);

    // 3. Add connect handler
    const connectHandler = this._generateConnectHandler(integration);

    // Find the connect endpoint and add new service handler
    const connectRegex = /(res\.json\(\{ authUrl \}\);\n  })/;
    serverContent = serverContent.replace(connectRegex, `res.json({ authUrl });${connectHandler}\n  }`);

    // 4. Add callback handler
    const callbackHandler = this._generateCallbackHandler(integration);

    // Find the callback endpoint and add new service handler
    const callbackRegex = /(} else if \(service === 'oura'[\s\S]*?res\.redirect\('\?error=token_exchange_failed'\);[\s\S]*?\})/;
    serverContent = serverContent.replace(callbackRegex, `$1${callbackHandler}`);

    // Write updated server.js
    await fs.writeFile(this.serverPath, serverContent);
    console.log(`✅ Added ${name} to OAuth Manager`);

    return true;
  }

  /**
   * Check if an OAuth integration exists
   */
  async integrationExists(id) {
    const serverContent = await fs.readFile(this.serverPath, 'utf8');
    return serverContent.includes(`${id}: {`);
  }

  /**
   * Generate service configuration for OAUTH_CONFIGS
   * @private
   */
  _generateServiceConfig(integration) {
    const { id, name, icon, envVars, authUrl, tokenUrl, scopes } = integration;

    // Quote the key if it contains hyphens
    const key = id.includes('-') ? `'${id}'` : id;

    let config = `  ${key}: {\n`;
    config += `    name: '${name}',\n`;
    config += `    icon: '${icon || '🔗'}',\n`;

    if (scopes && scopes.length > 0) {
      config += `    scopes: [${scopes.map(s => `'${s}'`).join(', ')}],\n`;
    }

    if (authUrl) {
      config += `    authorizationBaseUrl: '${authUrl}',\n`;
    }

    if (tokenUrl) {
      config += `    tokenUrl: '${tokenUrl}',\n`;
    }

    config += `    requiredEnvVars: [${envVars.map(v => `'${v}'`).join(', ')}],\n`;
    config += `    tokenFile: path.join(process.env.HOME, '.motus', '${id}-token.json')\n`;
    config += `  }`;

    return config;
  }

  /**
   * Generate initialization function
   * @private
   */
  _generateInitFunction(integration) {
    const { id, envVars, authUrl, tokenUrl } = integration;
    const className = this._pascalCase(id);

    let func = `// Initialize ${integration.name} OAuth client\n`;
    func += `function init${className}OAuth() {\n`;
    func += `  if (!process.env.${envVars[0]} || !process.env.${envVars[1]}) {\n`;
    func += `    return null;\n`;
    func += `  }\n`;
    func += `  \n`;
    func += `  return {\n`;
    func += `    clientId: process.env.${envVars[0]},\n`;
    func += `    clientSecret: process.env.${envVars[1]},\n`;
    func += `    redirectUri: \`http://localhost:\${PORT}/callback/${id}\`,\n`;

    if (authUrl) {
      func += `    authorizationBaseUrl: OAUTH_CONFIGS.${id}.authorizationBaseUrl,\n`;
    }

    if (tokenUrl) {
      func += `    tokenUrl: OAUTH_CONFIGS.${id}.tokenUrl\n`;
    }

    func += `  };\n`;
    func += `}`;

    return func;
  }

  /**
   * Generate connect handler
   * @private
   */
  _generateConnectHandler(integration) {
    const { id, authUrl, scopes } = integration;

    let handler = ` else if (service === '${id}' && oauthClients.${id}) {\n`;
    handler += `    const state = '${id}_' + Date.now();\n`;
    handler += `    const redirectEncoded = encodeURIComponent(oauthClients.${id}.redirectUri);\n`;

    if (scopes && scopes.length > 0) {
      const scopesStr = scopes.join(',');
      handler += `    const authUrl = \`${authUrl}?client_id=\${oauthClients.${id}.clientId}&state=\${state}&redirect_uri=\${redirectEncoded}&response_type=code&scope=${scopesStr}\`;\n`;
    } else {
      handler += `    const authUrl = \`${authUrl}?client_id=\${oauthClients.${id}.clientId}&state=\${state}&redirect_uri=\${redirectEncoded}&response_type=code\`;\n`;
    }

    handler += `    \n`;
    handler += `    res.json({ authUrl });\n`;
    handler += `  }`;

    return handler;
  }

  /**
   * Generate callback handler
   * @private
   */
  _generateCallbackHandler(integration) {
    const { id } = integration;

    let handler = ` else if (service === '${id}' && oauthClients.${id}) {\n`;
    handler += `    try {\n`;
    handler += `      const tokenParams = new URLSearchParams({\n`;
    handler += `        grant_type: 'authorization_code',\n`;
    handler += `        code: code,\n`;
    handler += `        client_id: oauthClients.${id}.clientId,\n`;
    handler += `        client_secret: oauthClients.${id}.clientSecret,\n`;
    handler += `        redirect_uri: oauthClients.${id}.redirectUri\n`;
    handler += `      });\n`;
    handler += `      \n`;
    handler += `      const tokenResponse = await fetch(oauthClients.${id}.tokenUrl, {\n`;
    handler += `        method: 'POST',\n`;
    handler += `        headers: {\n`;
    handler += `          'Content-Type': 'application/x-www-form-urlencoded'\n`;
    handler += `        },\n`;
    handler += `        body: tokenParams\n`;
    handler += `      });\n`;
    handler += `      \n`;
    handler += `      if (!tokenResponse.ok) {\n`;
    handler += `        throw new Error(\`Token exchange failed: \${tokenResponse.status}\`);\n`;
    handler += `      }\n`;
    handler += `      \n`;
    handler += `      const tokens = await tokenResponse.json();\n`;
    handler += `      \n`;
    handler += `      const tokenDir = path.dirname(OAUTH_CONFIGS.${id}.tokenFile);\n`;
    handler += `      await fs.mkdir(tokenDir, { recursive: true });\n`;
    handler += `      await fs.writeFile(OAUTH_CONFIGS.${id}.tokenFile, JSON.stringify(tokens, null, 2));\n`;
    handler += `      \n`;
    handler += `      res.redirect('/?success=true');\n`;
    handler += `    } catch (error) {\n`;
    handler += `      console.error('${integration.name} OAuth callback error:', error);\n`;
    handler += `      res.redirect('/?error=token_exchange_failed');\n`;
    handler += `    }\n`;
    handler += `  }`;

    return handler;
  }

  /**
   * Convert to PascalCase
   * @private
   */
  _pascalCase(str) {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Map common service names to standard OAuth configurations
   * This provides defaults for well-known services
   */
  static getStandardConfig(serviceName) {
    const standards = {
      'Facebook API': {
        id: 'facebook',
        icon: '📘',
        authUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
        scopes: ['email', 'public_profile']
      },
      'LinkedIn API': {
        id: 'linkedin',
        icon: '💼',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: ['r_liteprofile', 'r_emailaddress']
      },
      'Google Analytics': {
        id: 'google-analytics',
        icon: '📊',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/analytics.readonly']
      },
      'Twitter API': null, // API key only, not OAuth2
      'Buffer': null, // API key only, not OAuth2
      'Slack': {
        id: 'slack',
        icon: '💬',
        authUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['channels:read', 'chat:write']
      },
      'Notion': {
        id: 'notion',
        icon: '📝',
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        scopes: []
      }
    };

    return standards[serviceName] || null;
  }
}

module.exports = OAuthRegistry;
