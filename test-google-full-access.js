#!/usr/bin/env node

/**
 * Test Google API Full Access (Read/Write)
 * Verifies that calendar and email write permissions are working
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleFullAccess() {
  console.log('🔍 Testing Google API Full Access (Read/Write)\n');
  
  // Check credentials
  if (!process.env.GOOGLE_CLIENT_ID || 
      !process.env.GOOGLE_CLIENT_SECRET || 
      !process.env.GOOGLE_REFRESH_TOKEN) {
    console.error('❌ Missing Google OAuth credentials in .env');
    console.log('Run: ./setup-google-oauth-manual.sh to configure');
    return;
  }

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  console.log('Testing Calendar Access...');
  console.log('-'.repeat(40));
  
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Test READ access
    console.log('📖 Testing Calendar READ access...');
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 3,
      singleEvents: true,
      orderBy: 'startTime',
    });
    console.log(`✅ Can read calendar - Found ${events.data.items.length} upcoming events`);
    
    // Test WRITE access (create a test event)
    console.log('✏️ Testing Calendar WRITE access...');
    const testEvent = {
      summary: 'Motus Test Event (DELETE ME)',
      description: 'This is a test event created to verify write access. Safe to delete.',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Bangkok',
      },
      end: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Bangkok',
      },
    };
    
    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: testEvent,
    });
    console.log(`✅ Can write to calendar - Created test event ID: ${createdEvent.data.id}`);
    
    // Clean up - delete the test event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: createdEvent.data.id,
    });
    console.log('🧹 Test event deleted successfully');
    
  } catch (error) {
    console.error('❌ Calendar access failed:', error.message);
    console.log('You may need to re-authorize with broader scopes');
  }

  console.log('\nTesting Gmail Access...');
  console.log('-'.repeat(40));
  
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Test READ access
    console.log('📖 Testing Gmail READ access...');
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 3,
    });
    console.log(`✅ Can read emails - Found ${messages.data.messages ? messages.data.messages.length : 0} recent messages`);
    
    // Test DRAFT creation (safer than sending)
    console.log('✏️ Testing Gmail WRITE access (draft creation)...');
    const utf8Subject = `=?utf-8?B?${Buffer.from('Motus Test Draft (DELETE ME)').toString('base64')}?=`;
    const messageParts = [
      'To: test@example.com',
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'This is a test draft created by Motus to verify Gmail write access. Safe to delete.'
    ];
    
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });
    console.log(`✅ Can write to Gmail - Created draft ID: ${draft.data.id}`);
    
    // Clean up - delete the test draft
    await gmail.users.drafts.delete({
      userId: 'me',
      id: draft.data.id,
    });
    console.log('🧹 Test draft deleted successfully');
    
    // Get user profile
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log(`\n📧 Connected to: ${profile.data.emailAddress}`);
    
  } catch (error) {
    console.error('❌ Gmail access failed:', error.message);
    console.log('You may need to re-authorize with broader scopes');
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  console.log('\nRequired OAuth Scopes for Full Access:');
  console.log('  ✓ https://www.googleapis.com/auth/calendar');
  console.log('  ✓ https://www.googleapis.com/auth/calendar.events');
  console.log('  ✓ https://www.googleapis.com/auth/gmail.modify');
  console.log('  ✓ https://www.googleapis.com/auth/gmail.compose');
  console.log('  ✓ https://www.googleapis.com/auth/gmail.send');
  
  console.log('\n💡 If any tests failed, you need to:');
  console.log('1. Run: ./setup-google-oauth-manual.sh');
  console.log('2. Make sure to select ALL the broader scopes listed above');
  console.log('3. Get a new refresh token and update .env');
  console.log('\n✨ Once all tests pass, you can use all Motus features!');
}

// Run test
testGoogleFullAccess().catch(console.error);