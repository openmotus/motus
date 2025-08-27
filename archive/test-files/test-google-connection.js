#!/usr/bin/env node

/**
 * Test Google Calendar and Gmail Connection
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleConnection() {
  console.log('🔧 Testing Google Connection\n');
  
  // Check credentials
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Missing');
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ Missing');
  console.log('Refresh Token:', process.env.GOOGLE_REFRESH_TOKEN === 'your_google_refresh_token_here' ? '❌ Not set' : process.env.GOOGLE_REFRESH_TOKEN ? '✅ Found' : '❌ Missing');
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('\n❌ Missing credentials. Please check your .env file.');
    return;
  }
  
  if (!process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN === 'your_google_refresh_token_here') {
    console.log('\n⚠️ No refresh token set.');
    console.log('Please follow the OAuth setup process to get a refresh token.');
    console.log('\nAuthorization URL:');
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata'
      ],
      prompt: 'consent'
    });
    
    console.log('\n' + authUrl);
    console.log('\n1. Open this URL in your browser');
    console.log('2. Authorize the application');
    console.log('3. Run: node life-admin/setup-google-oauth.js');
    return;
  }
  
  // Try to connect
  console.log('\n🔐 Attempting to connect with refresh token...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  try {
    // Test Calendar API
    console.log('\n📅 Testing Calendar API...');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list({ maxResults: 1 });
    console.log('✅ Calendar access working!');
    console.log('Found', calendarList.data.items.length, 'calendar(s)');
    
    // Get today's events
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    console.log('📅 Today\'s events:', events.data.items.length);
    if (events.data.items.length > 0) {
      console.log('First event:', events.data.items[0].summary);
    }
    
    // Test Gmail API
    console.log('\n📧 Testing Gmail API...');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail access working!');
    console.log('Connected to:', profile.data.emailAddress);
    console.log('Total messages:', profile.data.messagesTotal);
    
    // Get recent emails
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
      q: 'is:unread'
    });
    
    console.log('Unread emails:', messages.data.messages ? messages.data.messages.length : 0);
    
    console.log('\n🎉 All connections successful!');
    console.log('Your Google Calendar and Gmail are ready to use.');
    console.log('\nRun: ./motus daily-brief');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\nThe refresh token has expired or is invalid.');
      console.log('Please run the OAuth setup again:');
      console.log('node life-admin/setup-google-oauth.js');
    } else {
      console.log('\nError details:', error);
    }
  }
}

testGoogleConnection().catch(console.error);