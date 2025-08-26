#!/usr/bin/env node

/**
 * Create supplement events in Google Calendar
 * Creates recurring events that start today if applicable
 */

require('dotenv').config();
const { google } = require('googleapis');

async function createSupplementCalendarEvents(groupedSchedules, oauth2Client) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const createdEvents = [];
  
  for (const group of groupedSchedules) {
    try {
      // Create event title based on time and type
      let title = '';
      if (group.isPreWorkout) {
        title = '💊 Pre-Workout Supplements';
      } else if (group.time === '06:30') {
        title = '💊 Morning Supplement Stack';
      } else if (group.time.startsWith('13')) {
        title = '💊 Afternoon Supplements';
      } else {
        title = '💊 Supplements';
      }
      
      // Create description with all supplements
      const description = group.supplements
        .map(s => `• ${s.dose}${s.unit} ${s.name}`)
        .join('\n');
      
      // Start date should be today
      const today = new Date();
      const [hours, minutes] = group.time.split(':').map(n => parseInt(n));
      
      // Set the time for today
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, start tomorrow
      if (startDate < new Date()) {
        startDate.setDate(startDate.getDate() + 1);
      }
      
      // Create end time (15 minutes later)
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 15);
      
      // Create recurrence rule
      const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${group.days.join(',')}`;
      
      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Bangkok'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Bangkok'
        },
        recurrence: [rrule],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 }
          ]
        },
        colorId: '9' // Blue color for supplements
      };
      
      console.log(`Creating event: ${title} at ${group.time} on ${group.days.join(',')}`);
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      
      createdEvents.push({
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        title: title,
        time: group.time,
        days: group.days,
        supplements: group.supplements
      });
      
      console.log(`✅ Created: ${response.data.htmlLink}`);
      
    } catch (error) {
      console.error(`❌ Failed to create event:`, error.message);
      if (error.response && error.response.data) {
        console.error('Details:', error.response.data);
      }
    }
  }
  
  return createdEvents;
}

module.exports = { createSupplementCalendarEvents };

// Test if run directly
if (require.main === module) {
  const testSchedule = [
    {
      time: '06:30',
      days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
      supplements: [
        { name: 'Yohimbine', dose: '10', unit: 'mg' },
        { name: 'SLU-PP-332', dose: '250', unit: 'mcg' }
      ],
      isPreWorkout: false
    },
    {
      time: '13:00',
      days: ['MO', 'TU', 'TH', 'FR'],
      supplements: [
        { name: 'L-Carnitine', dose: '300', unit: 'mg' }
      ],
      isPreWorkout: true
    }
  ];
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  createSupplementCalendarEvents(testSchedule, oauth2Client)
    .then(events => {
      console.log(`\n✅ Created ${events.length} calendar events`);
    })
    .catch(console.error);
}