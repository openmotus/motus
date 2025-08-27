#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// OAuth configurations
const OAUTH_CONFIGS = {
  google: {
    name: 'Google',
    icon: '🔷',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    tokenFile: path.join(process.env.HOME, '.motus', 'google-token.json')
  },
  oura: {
    name: 'Oura Ring',
    icon: '💍',
    // Start with minimal scopes - can add more later
    scopes: ['personal', 'daily'],
    authorizationBaseUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    apiBaseUrl: 'https://api.ouraring.com',
    requiredEnvVars: ['OURA_CLIENT_ID', 'OURA_CLIENT_SECRET'],
    tokenFile: path.join(process.env.HOME, '.motus', 'oura-token.json')
  }
  // Future services can be added here
  // slack: { ... },
  // notion: { ... },
  // todoist: { ... }
};

// Initialize OAuth clients
const oauthClients = {};

// Initialize Google OAuth client
function initGoogleOAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${PORT}/callback/google`
  );
  
  // Try to load existing token
  try {
    if (fs.existsSync(OAUTH_CONFIGS.google.tokenFile)) {
      const token = JSON.parse(fs.readFileSync(OAUTH_CONFIGS.google.tokenFile));
      oauth2Client.setCredentials(token);
    }
  } catch (error) {
    console.log('No existing Google token found');
  }
  
  return oauth2Client;
}

oauthClients.google = initGoogleOAuth();

// Initialize Oura OAuth client
function initOuraOAuth() {
  if (!process.env.OURA_CLIENT_ID || !process.env.OURA_CLIENT_SECRET) {
    return null;
  }
  
  return {
    clientId: process.env.OURA_CLIENT_ID,
    clientSecret: process.env.OURA_CLIENT_SECRET,
    redirectUri: `http://localhost:${PORT}/callback/oura`,
    authorizationBaseUrl: OAUTH_CONFIGS.oura.authorizationBaseUrl,
    tokenUrl: OAUTH_CONFIGS.oura.tokenUrl
  };
}

oauthClients.oura = initOuraOAuth();

// API Routes

// Get status of all OAuth connections
app.get('/api/status', async (req, res) => {
  const status = {};
  
  for (const [service, config] of Object.entries(OAUTH_CONFIGS)) {
    status[service] = {
      name: config.name,
      icon: config.icon,
      configured: false,
      connected: false,
      error: null
    };
    
    // Check if environment variables are configured
    const missingVars = config.requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      status[service].error = `Missing environment variables: ${missingVars.join(', ')}`;
      continue;
    }
    
    status[service].configured = true;
    
    // Check if token exists and is valid
    try {
      const tokenExists = await fs.access(config.tokenFile).then(() => true).catch(() => false);
      if (tokenExists) {
        const tokenData = JSON.parse(await fs.readFile(config.tokenFile, 'utf8'));
        status[service].connected = !!tokenData.refresh_token || !!tokenData.access_token;
        
        // For Google, test the connection
        if (service === 'google' && oauthClients.google && status[service].connected) {
          try {
            const calendar = google.calendar({ version: 'v3', auth: oauthClients.google });
            await calendar.calendarList.list({ maxResults: 1 });
            status[service].connected = true;
          } catch (error) {
            status[service].connected = false;
            status[service].error = 'Token expired or invalid';
          }
        }
      }
    } catch (error) {
      status[service].connected = false;
    }
  }
  
  res.json(status);
});

// Initiate OAuth connection
app.post('/api/connect/:service', (req, res) => {
  const service = req.params.service;
  
  if (!OAUTH_CONFIGS[service]) {
    return res.status(400).json({ error: 'Unknown service' });
  }
  
  if (service === 'google' && oauthClients.google) {
    const authUrl = oauthClients.google.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH_CONFIGS.google.scopes,
      prompt: 'consent'
    });
    
    res.json({ authUrl });
  } else if (service === 'oura' && oauthClients.oura) {
    // Use exact format from Oura's documentation
    const state = 'oura_' + Date.now();
    const redirectEncoded = encodeURIComponent(oauthClients.oura.redirectUri);
    
    // Build URL exactly as Oura shows in their example
    const authUrl = `https://cloud.ouraring.com/oauth/authorize?client_id=${oauthClients.oura.clientId}&state=${state}&redirect_uri=${redirectEncoded}&response_type=code`;
    
    res.json({ authUrl });
  } else {
    res.status(400).json({ error: 'Service not configured' });
  }
});

// OAuth callback handler
app.get('/callback/:service', async (req, res) => {
  const service = req.params.service;
  const code = req.query.code;
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }
  
  if (service === 'google' && oauthClients.google) {
    try {
      const { tokens } = await oauthClients.google.getToken(code);
      oauthClients.google.setCredentials(tokens);
      
      // Save tokens
      const tokenDir = path.dirname(OAUTH_CONFIGS.google.tokenFile);
      await fs.mkdir(tokenDir, { recursive: true });
      await fs.writeFile(OAUTH_CONFIGS.google.tokenFile, JSON.stringify(tokens, null, 2));
      
      // Also update .env if we have a refresh token
      if (tokens.refresh_token) {
        await updateEnvFile('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
      }
      
      res.redirect('/?success=true');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/?error=token_exchange_failed');
    }
  } else if (service === 'oura' && oauthClients.oura) {
    try {
      // Exchange authorization code for access token
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: oauthClients.oura.clientId,
        client_secret: oauthClients.oura.clientSecret,
        redirect_uri: oauthClients.oura.redirectUri
      });
      
      const tokenResponse = await fetch(oauthClients.oura.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }
      
      const tokens = await tokenResponse.json();
      
      // Save tokens
      const tokenDir = path.dirname(OAUTH_CONFIGS.oura.tokenFile);
      await fs.mkdir(tokenDir, { recursive: true });
      await fs.writeFile(OAUTH_CONFIGS.oura.tokenFile, JSON.stringify(tokens, null, 2));
      
      // Also update .env if we have a refresh token
      if (tokens.refresh_token) {
        await updateEnvFile('OURA_REFRESH_TOKEN', tokens.refresh_token);
      }
      
      res.redirect('/?success=true');
    } catch (error) {
      console.error('Oura OAuth callback error:', error);
      res.redirect('/?error=token_exchange_failed');
    }
  } else {
    res.redirect('/?error=unknown_service');
  }
});

// Disconnect OAuth service
app.post('/api/disconnect/:service', async (req, res) => {
  const service = req.params.service;
  
  if (!OAUTH_CONFIGS[service]) {
    return res.status(400).json({ error: 'Unknown service' });
  }
  
  try {
    // Remove token file
    await fs.unlink(OAUTH_CONFIGS[service].tokenFile).catch(() => {});
    
    // Clear from memory
    if (service === 'google' && oauthClients.google) {
      oauthClients.google.setCredentials({});
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test connection
app.post('/api/test/:service', async (req, res) => {
  const service = req.params.service;
  
  if (service === 'google' && oauthClients.google) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauthClients.google });
      const events = await calendar.events.list({
        calendarId: 'primary',
        maxResults: 1
      });
      
      const gmail = google.gmail({ version: 'v1', auth: oauthClients.google });
      const messages = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1
      });
      
      res.json({ 
        success: true,
        services: {
          calendar: '✅ Connected',
          gmail: '✅ Connected'
        }
      });
    } catch (error) {
      res.json({ 
        success: false, 
        error: error.message,
        services: {
          calendar: '❌ Failed',
          gmail: '❌ Failed'
        }
      });
    }
  } else if (service === 'oura') {
    try {
      // Load token
      const tokenData = JSON.parse(await fs.readFile(OAUTH_CONFIGS.oura.tokenFile, 'utf8'));
      
      // Test API connection by fetching personal info
      const response = await fetch(`${OAUTH_CONFIGS.oura.apiBaseUrl}/v2/usercollection/personal_info`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      if (response.ok) {
        const personalInfo = await response.json();
        
        // Also test sleep data endpoint
        const today = new Date().toISOString().split('T')[0];
        const sleepResponse = await fetch(
          `${OAUTH_CONFIGS.oura.apiBaseUrl}/v2/usercollection/daily_sleep?start_date=${today}&end_date=${today}`,
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`
            }
          }
        );
        
        res.json({ 
          success: true,
          services: {
            'Personal Info': '✅ Connected',
            'Sleep Data': sleepResponse.ok ? '✅ Available' : '⚠️ No recent data',
            'API Status': '✅ Active'
          }
        });
      } else {
        throw new Error(`API test failed: ${response.status}`);
      }
    } catch (error) {
      res.json({ 
        success: false, 
        error: error.message,
        services: {
          'Personal Info': '❌ Failed',
          'Sleep Data': '❌ Failed',
          'API Status': '❌ Error'
        }
      });
    }
  } else {
    res.status(400).json({ error: 'Service not connected' });
  }
});

// Helper to update .env file
async function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    let envContent = await fs.readFile(envPath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}\n`;
    }
    
    await fs.writeFile(envPath, envContent);
    process.env[key] = value;
  } catch (error) {
    console.error('Failed to update .env:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║     OAuth Manager for Motus          ║
║                                      ║
║   Open in browser:                   ║
║   http://localhost:${PORT}              ║
║                                      ║
║   Press Ctrl+C to stop               ║
╚══════════════════════════════════════╝
  `);
});