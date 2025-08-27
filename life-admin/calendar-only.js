#!/usr/bin/env node

/**
 * Calendar Only Agent - Simple calendar fetcher for today's events
 */

require('dotenv').config();
const { google } = require('googleapis');

class CalendarAgent {
  constructor() {
    this.config = {
      googleCredentials: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
      },
      timezone: process.env.TIMEZONE || 'Asia/Bangkok'
    };
    this.oauth2Client = null;
  }

  async initializeGoogleAuth() {
    if (!this.config.googleCredentials.clientId || !this.config.googleCredentials.refreshToken) {
      console.log('⚠️  Google OAuth not configured. No data available.');
      return false;
    }

    try {
      this.oauth2Client = new google.auth.OAuth2(
        this.config.googleCredentials.clientId,
        this.config.googleCredentials.clientSecret,
        'http://localhost:3000/oauth2callback'
      );

      this.oauth2Client.setCredentials({
        refresh_token: this.config.googleCredentials.refreshToken
      });

      // Test the connection
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });
      
      return true;
    } catch (error) {
      console.log('⚠️  Google OAuth initialization failed:', error.message);
      return false;
    }
  }

  async fetchCalendarEvents() {
    if (!this.oauth2Client) {
      return [];
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Get events for today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items.map(event => {
        // Format time as HH:MM
        let formattedTime = '';
        if (event.start.dateTime) {
          const eventDate = new Date(event.start.dateTime);
          formattedTime = eventDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: this.config.timezone
          });
        } else {
          formattedTime = 'All day';
        }
        
        return {
          time: formattedTime,
          title: event.summary || 'Untitled Event',
          location: event.location,
          description: event.description,
          attendees: event.attendees?.map(a => a.email),
          meetingLink: this.extractMeetingLink(event),
          duration: this.calculateDuration(event.start, event.end)
        };
      });
    } catch (error) {
      console.error('Calendar fetch error:', error.message);
      return [];
    }
  }

  extractMeetingLink(event) {
    const description = event.description || '';
    const location = event.location || '';
    
    const patterns = [
      /https:\/\/[^\s]*zoom\.us[^\s]*/,
      /https:\/\/[^\s]*meet\.google[^\s]*/,
      /https:\/\/[^\s]*teams\.microsoft[^\s]*/
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern) || location.match(pattern);
      if (match) return match[0];
    }
    return null;
  }

  calculateDuration(start, end) {
    if (!start || !end) return null;
    const startTime = new Date(start.dateTime || start.date);
    const endTime = new Date(end.dateTime || end.date);
    const duration = (endTime - startTime) / (1000 * 60);
    
    if (duration < 60) return `${duration} mins`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours} hours ${mins} mins` : `${hours} hours`;
  }
}

// CLI handler
if (require.main === module) {
  const agent = new CalendarAgent();
  
  async function run() {
    try {
      await agent.initializeGoogleAuth();
      const events = await agent.fetchCalendarEvents();
      console.log(JSON.stringify(events, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  run();
}

module.exports = CalendarAgent;
