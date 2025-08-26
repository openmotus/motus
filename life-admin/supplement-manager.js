#!/usr/bin/env node

/**
 * Supplement Schedule Manager
 * Parses natural language supplement schedules and creates calendar events
 */

require('dotenv').config();
const { google } = require('googleapis');

class SupplementManager {
  constructor(oauth2Client) {
    this.oauth2Client = oauth2Client;
    this.dayMap = {
      'monday': 'MO', 'mon': 'MO', 'm': 'MO',
      'tuesday': 'TU', 'tue': 'TU', 'tu': 'TU',
      'wednesday': 'WE', 'wed': 'WE', 'w': 'WE',
      'thursday': 'TH', 'thu': 'TH', 'th': 'TH',
      'friday': 'FR', 'fri': 'FR', 'f': 'FR',
      'saturday': 'SA', 'sat': 'SA', 's': 'SA',
      'sunday': 'SU', 'sun': 'SU', 'su': 'SU'
    };
  }

  /**
   * Parse supplement schedule from natural language
   */
  parseSupplementSchedule(text) {
    const schedules = [];
    
    // Split by periods or "and" to get individual supplement statements
    const statements = text.split(/\.\s+|\sand\s/i).filter(s => s.trim());
    
    statements.forEach(statement => {
      const schedule = this.parseStatement(statement);
      if (schedule) {
        schedules.push(schedule);
      }
    });
    
    return this.groupSchedules(schedules);
  }

  /**
   * Parse a single supplement statement
   */
  parseStatement(statement) {
    // Clean up the statement first
    let cleanStatement = statement.trim();
    
    // Handle "and X" at the beginning (from split)
    cleanStatement = cleanStatement.replace(/^and\s+/i, '');
    
    // Common patterns for supplements - more specific
    const patterns = [
      // "I take X mg/mcg of Y everyday/at time, days"
      /(?:I\s+)?take\s+([0-9.]+)\s*(mg|mcg|iu|ml)\s+(?:of\s+)?([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*?)\s+(?:everyday|every day|daily|every|on|at)\s*(?:at\s+)?([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)?(?:[,\s]+)?(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun|M-W-F|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekday|Mon-Sat|Mon-Fri|Monday\s*(?:through|to|-)\s*Friday|Monday\s*(?:through|to|-)\s*Saturday).*)?/i,
      // "X mg/mcg NAME every/on DAYS at TIME"
      /([0-9.]+)\s*(mg|mcg|iu|ml)\s+([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*?)\s+(?:every|on)\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|M-W-F|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekday|Mon-Sat|Mon-Fri|Monday\s*(?:through|to|-)\s*Friday|Monday\s*(?:through|to|-)\s*Saturday).*?(?:\s+at\s+)?([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)?/i,
      // "X mg/mcg NAME before gym/workout at TIME on DAYS"
      /([0-9.]+)\s*(mg|mcg|iu|ml)\s+([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*?)\s+before\s+(?:the\s+)?(?:gym|workout)\s+at\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)\s+on\s+(.*)/i
    ];
    
    for (const pattern of patterns) {
      const match = statement.match(pattern);
      if (match) {
        const [_, dose, unit, name, time1, days, time2] = match;
        const time = time1 || time2;
        
        // Clean up the name
        let cleanName = name.trim();
        // Remove trailing prepositions
        cleanName = cleanName.replace(/\s+(every|at|on|before|after)\s*$/i, '').trim();
        
        // Parse days
        const daysList = this.parseDays(days || statement);
        
        // Parse time
        const timeStr = this.parseTime(time || statement);
        
        // Determine if it's pre-workout
        const isPreWorkout = statement.toLowerCase().includes('before gym') || 
                            statement.toLowerCase().includes('before workout') ||
                            statement.toLowerCase().includes('pre-workout');
        
        return {
          name: cleanName,
          dose: dose,
          unit: unit || 'mg',
          time: timeStr,
          days: daysList,
          isPreWorkout: isPreWorkout,
          original: statement.trim()
        };
      }
    }
    
    return null;
  }

  /**
   * Parse days from text
   */
  parseDays(text) {
    if (!text) return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    
    const lower = text.toLowerCase();
    
    // Check for "everyday" or "daily"
    if (lower.includes('everyday') || lower.includes('daily')) {
      return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    }
    
    // Check for weekdays
    if (lower.includes('weekday')) {
      return ['MO', 'TU', 'WE', 'TH', 'FR'];
    }
    
    // Check for Mon-Fri, Monday through Friday patterns
    if (lower.match(/mon(?:day)?\s*(?:-|through|to)\s*fri(?:day)?/i)) {
      return ['MO', 'TU', 'WE', 'TH', 'FR'];
    }
    
    // Check for Mon-Sat pattern
    if (lower.match(/mon(?:day)?\s*(?:-|through|to)\s*sat(?:urday)?/i)) {
      return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    }
    
    // Check for M-W-F pattern
    if (lower.match(/m-w-f|mon-wed-fri/i)) {
      return ['MO', 'WE', 'FR'];
    }
    
    // Parse individual days
    const days = [];
    for (const [dayName, dayCode] of Object.entries(this.dayMap)) {
      if (lower.includes(dayName)) {
        if (!days.includes(dayCode)) {
          days.push(dayCode);
        }
      }
    }
    
    // Sort days in week order
    const dayOrder = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    return days.length > 0 ? days : ['MO', 'TU', 'WE', 'TH', 'FR'];
  }

  /**
   * Parse time from text
   */
  parseTime(text) {
    if (!text) return '06:30';
    
    // Match time patterns
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let [_, hours, minutes, ampm] = timeMatch;
      hours = parseInt(hours);
      minutes = minutes ? parseInt(minutes) : 0;
      
      if (ampm) {
        if (ampm.toLowerCase() === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm.toLowerCase() === 'am' && hours === 12) {
          hours = 0;
        }
      }
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    return '06:30'; // Default morning time
  }

  /**
   * Group schedules by time and days for efficient calendar events
   */
  groupSchedules(schedules) {
    const grouped = {};
    
    schedules.forEach(schedule => {
      const key = `${schedule.time}_${schedule.days.join(',')}`;
      if (!grouped[key]) {
        grouped[key] = {
          time: schedule.time,
          days: schedule.days,
          supplements: [],
          isPreWorkout: schedule.isPreWorkout
        };
      }
      grouped[key].supplements.push({
        name: schedule.name,
        dose: schedule.dose,
        unit: schedule.unit
      });
    });
    
    return Object.values(grouped);
  }

  /**
   * Create calendar events for supplement schedules
   */
  async createCalendarEvents(groupedSchedules) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    const events = [];
    
    for (const group of groupedSchedules) {
      // Create event title
      let title = '';
      if (group.isPreWorkout) {
        title = '💊 Pre-Workout Supplements';
      } else if (group.time === '06:30') {
        title = '💊 Morning Supplement Stack';
      } else {
        title = '💊 Supplements';
      }
      
      // Create description with all supplements
      const description = group.supplements
        .map(s => `• ${s.dose}${s.unit} ${s.name}`)
        .join('\n');
      
      // Calculate start date (next occurrence)
      const startDate = this.getNextOccurrence(group.days[0]);
      const [hours, minutes] = group.time.split(':').map(n => parseInt(n));
      startDate.setHours(hours, minutes, 0, 0);
      
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
        }
      };
      
      try {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event
        });
        
        events.push({
          id: response.data.id,
          title: title,
          time: group.time,
          days: group.days,
          supplements: group.supplements
        });
      } catch (error) {
        console.error('Error creating event:', error.message);
      }
    }
    
    return events;
  }

  /**
   * Get next occurrence of a day
   */
  getNextOccurrence(dayCode) {
    const dayMap = { 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6, 'SU': 0 };
    const targetDay = dayMap[dayCode];
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate;
  }

  /**
   * Get today's supplements from the schedule
   */
  getTodaySupplements(groupedSchedules) {
    const today = new Date();
    const dayCode = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][today.getDay()];
    const todaySupplements = [];
    
    groupedSchedules.forEach(group => {
      if (group.days.includes(dayCode)) {
        todaySupplements.push({
          time: group.time,
          supplements: group.supplements,
          isPreWorkout: group.isPreWorkout
        });
      }
    });
    
    // Sort by time
    todaySupplements.sort((a, b) => a.time.localeCompare(b.time));
    
    return todaySupplements;
  }
}

module.exports = SupplementManager;