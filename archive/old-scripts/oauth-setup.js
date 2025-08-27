#!/usr/bin/env node

/**
 * Simple Google OAuth Setup
 * Gets refresh token with proper browser flow
 */

require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Generate auth URL with broader scopes
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'
  ],
  prompt: 'consent'
});

console.log('🔐 Motus Google OAuth Setup\n');
console.log('Opening your browser to authorize access...\n');
console.log('If browser doesn\'t open, visit this URL:');
console.log(authUrl);
console.log('\n');

// Create server to handle callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/oauth2callback') {
    const code = parsedUrl.query.code;
    
    if (code) {
      try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Update .env file
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
          );
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        
        // Success response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head>
              <title>Motus OAuth Success</title>
              <style>
                body { font-family: -apple-system, sans-serif; padding: 40px; background: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #4CAF50; }
                .emoji { font-size: 48px; margin: 20px 0; }
                code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="emoji">✅</div>
                <h1>Authorization Successful!</h1>
                <p>Motus is now connected to your Google account.</p>
                <p>You can close this window and return to the terminal.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><strong>Next step:</strong> Run <code>/motus daily-brief</code> in Claude Code</p>
              </div>
            </body>
          </html>
        `);
        
        console.log('\n✅ SUCCESS! Google authorization complete.');
        console.log('📝 Refresh token has been saved to .env file');
        console.log('\nYou can now use: /motus daily-brief');
        console.log('\nClosing in 3 seconds...');
        
        setTimeout(() => {
          process.exit(0);
        }, 3000);
        
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error: ${error.message}</h1><p>Please try again.</p>`);
        console.error('❌ Error:', error.message);
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>No authorization code received</h1>');
    }
  }
});

server.listen(PORT, () => {
  console.log(`📡 Waiting for authorization on port ${PORT}...\n`);
  
  // Try to open browser
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' :
                  platform === 'win32' ? 'start' :
                  'xdg-open';
  
  exec(`${command} "${authUrl}"`, (error) => {
    if (error) {
      console.log('Please open the URL above in your browser');
    }
  });
});