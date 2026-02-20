#!/usr/bin/env node

/**
 * Calendar Fetcher — retrieves today's events from Google Calendar
 *
 * This is a simplified example. For production use, set up OAuth2 via
 * the Motus OAuth Manager (./start-oauth-manager.sh) and use the
 * googleapis library with proper authentication.
 *
 * Environment variables:
 *   GOOGLE_CALENDAR_TOKEN_PATH — path to OAuth token file
 *   GOOGLE_CALENDAR_ID         — calendar ID (default: "primary")
 */

const fs = require('fs');
const https = require('https');

const TOKEN_PATH = process.env.GOOGLE_CALENDAR_TOKEN_PATH;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// If no token is available, return demo data so the example still runs
if (!TOKEN_PATH || !fs.existsSync(TOKEN_PATH)) {
  const now = new Date();
  const demo = {
    source: 'demo',
    date: now.toISOString().split('T')[0],
    events: [
      {
        time: '09:00',
        duration: '30m',
        title: 'Team standup',
        location: 'Zoom'
      },
      {
        time: '11:00',
        duration: '1h',
        title: 'Project review',
        location: 'Conference Room A'
      },
      {
        time: '14:00',
        duration: '45m',
        title: '1-on-1 with manager',
        location: 'Virtual'
      }
    ],
    total: 3
  };

  console.log(JSON.stringify(demo, null, 2));
  process.exit(0);
}

// Production path: use saved OAuth token to call Google Calendar API
try {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`;

  const options = {
    headers: { 'Authorization': `Bearer ${token.access_token}` }
  };

  https.get(calendarUrl, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const events = (json.items || []).map(event => ({
          time: event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'All day',
          title: event.summary || '(No title)',
          location: event.location || 'No location'
        }));

        console.log(JSON.stringify({
          date: now.toISOString().split('T')[0],
          events,
          total: events.length
        }, null, 2));
      } catch (e) {
        console.error(JSON.stringify({ error: `Failed to parse calendar response: ${e.message}` }));
        process.exit(1);
      }
    });
  }).on('error', (e) => {
    console.error(JSON.stringify({ error: `Calendar request failed: ${e.message}` }));
    process.exit(1);
  });
} catch (e) {
  console.error(JSON.stringify({ error: `Failed to read token: ${e.message}` }));
  process.exit(1);
}
