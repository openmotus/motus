#!/usr/bin/env node

/**
 * Google OAuth Setup Helper
 * Helps users configure Google Calendar and Gmail access
 */

require('dotenv').config(); // Load .env file
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const open = require('open');

class GoogleOAuthSetup {
  constructor() {
    this.oauth2Client = null;
    this.PORT = 3000;
    this.REDIRECT_URI = `http://localhost:${this.PORT}/oauth2callback`;
  }

  async setup() {
    console.log('🔐 Google OAuth Setup for Motus Life Admin\n');
    console.log('This will help you connect your Google Calendar and Gmail.\n');
    
    // Check if credentials exist
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.log('⚠️  Missing Google OAuth credentials in .env file\n');
      console.log('Please follow these steps:\n');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Create a new project or select existing');
      console.log('3. Enable Google Calendar API and Gmail API');
      console.log('4. Create OAuth 2.0 credentials');
      console.log('5. Add http://localhost:3000/oauth2callback as authorized redirect URI');
      console.log('6. Copy Client ID and Client Secret to your .env file');
      console.log('\nThen run this setup again.');
      return;
    }

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      this.REDIRECT_URI
    );

    // Check if refresh token exists
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('✅ Google OAuth already configured!');
      console.log('\nTesting connection...');
      
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      try {
        // Test calendar access
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        const calendarList = await calendar.calendarList.list({ maxResults: 1 });
        console.log('✅ Calendar access working (read/write)');

        // Test gmail access
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        console.log('✅ Gmail access working');
        console.log(`📧 Connected to: ${profile.data.emailAddress}`);
        
        console.log('\n🎉 Everything is configured correctly!');
        console.log('You can now use: /motus daily-brief');
        return;
      } catch (error) {
        console.log('❌ Token validation failed. Need to re-authenticate.');
        console.log('Error:', error.message);
      }
    }

    // Start OAuth flow
    console.log('\n🚀 Starting OAuth authorization flow...\n');
    
    // Generate auth URL
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        // Full Calendar access for reading and writing events
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        // Full Gmail access for reading, writing, and sending emails
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send'
      ],
      prompt: 'consent'
    });

    // Start local server to receive callback
    const server = await this.startCallbackServer();
    
    console.log('📋 Opening browser for Google authorization...');
    console.log('\nIf browser doesn\'t open, visit this URL:');
    console.log(authUrl);
    console.log('\n⏳ Waiting for authorization...\n');

    // Open browser
    try {
      await open(authUrl);
    } catch (error) {
      console.log('Could not open browser automatically.');
    }

    // Wait for callback
    const code = await this.waitForCallback(server);
    
    if (code) {
      console.log('✅ Authorization code received!');
      
      // Exchange code for tokens
      try {
        const { tokens } = await this.oauth2Client.getToken(code);
        console.log('✅ Tokens received!');
        
        // Save refresh token
        await this.saveRefreshToken(tokens.refresh_token);
        
        console.log('\n🎉 Setup complete!');
        console.log('Your Google Calendar and Gmail are now connected.');
        console.log('\nYou can now use:');
        console.log('  /motus daily-brief');
        console.log('  /motus life briefing');
        console.log('\nThe refresh token has been added to your .env file.');
        
      } catch (error) {
        console.error('❌ Failed to exchange code for tokens:', error.message);
      }
    }
    
    server.close();
  }

  startCallbackServer() {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.listen(this.PORT, () => {
        console.log(`📡 Callback server listening on port ${this.PORT}`);
        resolve(server);
      });
    });
  }

  waitForCallback(server) {
    return new Promise((resolve) => {
      server.on('request', (req, res) => {
        const parsedUrl = url.parse(req.url, true);
        
        if (parsedUrl.pathname === '/oauth2callback') {
          const code = parsedUrl.query.code;
          const error = parsedUrl.query.error;
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          
          if (error) {
            res.end(`
              <html>
                <body style="font-family: sans-serif; padding: 40px;">
                  <h1>❌ Authorization Failed</h1>
                  <p>Error: ${error}</p>
                  <p>Please close this window and try again.</p>
                </body>
              </html>
            `);
            resolve(null);
          } else if (code) {
            res.end(`
              <html>
                <body style="font-family: sans-serif; padding: 40px;">
                  <h1>✅ Authorization Successful!</h1>
                  <p>You can close this window and return to the terminal.</p>
                  <p>Motus Life Admin is now connected to your Google account.</p>
                </body>
              </html>
            `);
            resolve(code);
          }
        }
      });
    });
  }

  async saveRefreshToken(refreshToken) {
    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
      console.log('Creating new .env file...');
    }

    // Update or add refresh token
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=.*/,
        `GOOGLE_REFRESH_TOKEN=${refreshToken}`
      );
    } else {
      envContent += `\n# Google OAuth Refresh Token (auto-generated)\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`;
    }

    // Write back to .env
    await fs.writeFile(envPath, envContent);
    
    // Also update process.env for current session
    process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new GoogleOAuthSetup();
  setup.setup().catch(console.error);
}

module.exports = GoogleOAuthSetup;