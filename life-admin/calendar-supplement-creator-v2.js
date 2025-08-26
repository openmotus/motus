#!/usr/bin/env node

/**
 * Create supplement events in Google Calendar V2
 * Creates events with complete supplement lists for each day/time combination
 */

require('dotenv').config();
const { google } = require('googleapis');

/**
 * Consolidate supplements by actual day and time combinations
 */
function consolidateSupplementsByDayTime(groupedSchedules) {
  const dayTimeMap = {};
  const daysOfWeek = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  
  // For each day of the week
  daysOfWeek.forEach(day => {
    // For each time slot
    groupedSchedules.forEach(group => {
      // If this group includes this day
      if (group.days.includes(day)) {
        const key = `${day}_${group.time}`;
        
        if (!dayTimeMap[key]) {
          dayTimeMap[key] = {
            day: day,
            time: group.time,
            supplements: [],
            isPreWorkout: group.isPreWorkout
          };
        }
        
        // Add all supplements from this group
        group.supplements.forEach(supp => {
          dayTimeMap[key].supplements.push(supp);
        });
      }
    });
  });
  
  // Now group by unique time + supplement combinations
  const uniqueEvents = {};
  
  Object.values(dayTimeMap).forEach(slot => {
    // Create a key based on time and supplement list
    const suppKey = slot.supplements
      .map(s => `${s.dose}${s.unit}_${s.name}`)
      .sort()
      .join('|');
    const eventKey = `${slot.time}_${suppKey}`;
    
    if (!uniqueEvents[eventKey]) {
      uniqueEvents[eventKey] = {
        time: slot.time,
        days: [],
        supplements: slot.supplements,
        isPreWorkout: slot.isPreWorkout
      };
    }
    
    uniqueEvents[eventKey].days.push(slot.day);
  });
  
  return Object.values(uniqueEvents);
}

async function createSupplementCalendarEventsV2(groupedSchedules, oauth2Client) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // First consolidate supplements by actual day/time
  const consolidatedEvents = consolidateSupplementsByDayTime(groupedSchedules);
  
  console.log(`\nConsolidated into ${consolidatedEvents.length} unique events:`);
  consolidatedEvents.forEach(event => {
    console.log(`  ${event.time} on ${event.days.join(',')}: ${event.supplements.map(s => s.name).join(', ')}`);
  });
  
  const createdEvents = [];
  
  for (const event of consolidatedEvents) {
    try {
      // Create event title based on time and type
      let title = '';
      if (event.isPreWorkout) {
        title = '💊 Pre-Workout Supplements';
      } else {
        const hour = parseInt(event.time.split(':')[0]);
        if (hour < 9) {
          title = '💊 Morning Supplement Stack';
        } else if (hour < 14) {
          title = '💊 Midday Supplements';
        } else if (hour < 18) {
          title = '💊 Afternoon Supplements';
        } else {
          title = '💊 Evening Supplements';
        }
      }
      
      // Create description with ALL supplements for this time
      const description = '📋 Supplements to take:\n\n' + 
        event.supplements
          .map(s => `• ${s.dose}${s.unit} ${s.name}`)
          .join('\n') +
        '\n\n⏰ Set a timer after taking to ensure consistency';
      
      // Calculate start date - always start from tomorrow to avoid timezone issues
      const [hours, minutes] = event.time.split(':').map(n => parseInt(n));
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow
      startDate.setHours(hours, minutes, 0, 0);
      startDate.setMilliseconds(0);
      
      // Create end time (15 minutes later)
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 15);
      
      // Create recurrence rule - handle single day events properly
      let recurrence = [];
      if (event.days.length === 1) {
        // For single day, use WEEKLY with specific day
        recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${event.days[0]}`];
      } else {
        // For multiple days
        const sortedDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].filter(d => event.days.includes(d));
        recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${sortedDays.join(',')}`];
      }
      
      // Format dates without the Z suffix when using timeZone
      const formatDateTimeForCalendar = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      const calendarEvent = {
        summary: title,
        description: description,
        start: {
          dateTime: formatDateTimeForCalendar(startDate),
          timeZone: process.env.TIMEZONE || 'Asia/Bangkok'
        },
        end: {
          dateTime: formatDateTimeForCalendar(endDate),
          timeZone: process.env.TIMEZONE || 'Asia/Bangkok'
        },
        recurrence: recurrence,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'notification', minutes: 5 }
          ]
        },
        colorId: '9' // Blue color for supplements
      };
      
      console.log(`\nCreating: ${title}`);
      console.log(`  Time: ${event.time} on ${event.days.join(',')}`);
      console.log(`  Supplements: ${event.supplements.map(s => s.name).join(', ')}`);
      console.log('  Event object:', JSON.stringify(calendarEvent, null, 2));
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent
      });
      
      createdEvents.push({
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        title: title,
        time: event.time,
        days: event.days,
        supplements: event.supplements
      });
      
      console.log(`  ✅ Created: ${response.data.htmlLink}`);
      
    } catch (error) {
      console.error(`❌ Failed to create event:`, error.message);
      if (error.response && error.response.data) {
        console.error('Details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  return createdEvents;
}

module.exports = { createSupplementCalendarEventsV2 };

// Test if run directly
if (require.main === module) {
  const SupplementParserV2 = require('./supplement-parser-v2');
  
  const testInput = "I take 10mg of Yohimbine and 250mcg of SLU-PP-332 everyday at 6:30am, Mon-Sat. I take 2mg of TB-500 every M-W-F at 6:30am. 250mcg BPC-157 Monday through Friday at 6:30am. 1mg MOTS-C Mon-Friday at 6:30am. 3mg Retatrutide every Monday at 6:30am. And L-Carnitine 300mg before the gym at 1pm on mon, tue, thu, fri";
  
  const parser = new SupplementParserV2();
  const groupedSchedules = parser.parse(testInput);
  
  console.log('Parsed schedules:');
  console.log(JSON.stringify(groupedSchedules, null, 2));
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  createSupplementCalendarEventsV2(groupedSchedules, oauth2Client)
    .then(events => {
      console.log(`\n✅ Successfully created ${events.length} calendar events`);
    })
    .catch(console.error);
}