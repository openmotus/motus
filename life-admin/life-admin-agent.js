#!/usr/bin/env node

/**
 * Life Admin Agent - Primary orchestrator for all life management
 * Coordinates sub-agents to handle calendar, email, tasks, and daily notes
 */

require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const DailyNoteUpdater = require('./daily-note-updater');
const SupplementManager = require('./supplement-manager');
const SupplementParserV2 = require('./supplement-parser-v2');
const { createSupplementCalendarEvents } = require('./calendar-supplement-creator');
const CLIDashboard = require('./cli-dashboard');
const SimpleDashboard = require('./simple-dashboard');

class LifeAdminAgent {
  constructor(config = {}) {
    this.config = {
      obsidianVaultPath: process.env.OBSIDIAN_VAULT_PATH || path.join(process.env.HOME, 'Obsidian'),
      dailyNotesFolder: process.env.OBSIDIAN_DAILY_NOTES || 'Daily Notes',
      googleCredentials: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
      },
      timezone: process.env.TIMEZONE || 'Asia/Bangkok',
      ...config
    };

    this.agents = this.initializeAgents();
    this.oauth2Client = null;
    this.dailyNoteUpdater = new DailyNoteUpdater(config);
    this.supplementManager = null;
    this.dashboard = new CLIDashboard();
    this.simpleDashboard = new SimpleDashboard();
  }

  initializeAgents() {
    return {
      calendarAgent: {
        name: 'Calendar Manager',
        capabilities: ['fetch events', 'create events', 'update events', 'analyze schedule', 'find conflicts', 'suggest optimizations']
      },
      emailAgent: {
        name: 'Email Processor',
        capabilities: ['fetch emails', 'send emails', 'draft responses', 'categorize importance', 'extract action items', 'manage labels']
      },
      taskAgent: {
        name: 'Task Coordinator',
        capabilities: ['prioritize tasks', 'create todo lists', 'track deadlines', 'manage projects']
      },
      noteAgent: {
        name: 'Note Compiler',
        capabilities: ['format daily notes', 'create templates', 'link references', 'organize knowledge']
      },
      analysisAgent: {
        name: 'Data Analyzer',
        capabilities: ['pattern recognition', 'time optimization', 'priority assessment', 'insight generation']
      }
    };
  }

  /**
   * Initialize Google OAuth2 client
   */
  async initializeGoogleAuth() {
    if (!this.config.googleCredentials.clientId || !this.config.googleCredentials.refreshToken) {
      console.log('⚠️  Google OAuth not configured. Using mock data.');
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
      
      console.log('✅ Google OAuth initialized successfully');
      return true;
    } catch (error) {
      console.log('⚠️  Google OAuth initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Main Daily Brief Workflow
   * This is what runs every day at 8am
   */
  async generateDailyBrief() {
    console.log('\n🌅 LIFE ADMIN: Generating Daily Brief\n');
    console.log('Time:', new Date().toLocaleString('en-US', { timeZone: this.config.timezone }));
    console.log('-'.repeat(60));

    // Initialize Google OAuth if not already done
    if (!this.oauth2Client) {
      await this.initializeGoogleAuth();
    }

    const briefData = {
      date: new Date(),
      calendar: [],
      emails: [],
      tasks: [],
      insights: [],
      weather: null,
      quotes: null
    };

    // Step 1: Fetch Calendar Events
    console.log('📅 Fetching calendar events...');
    briefData.calendar = await this.fetchCalendarEvents();

    // Step 2: Process Emails
    console.log('📧 Processing emails from last 24 hours...');
    briefData.emails = await this.processEmails();

    // Step 3: Compile Tasks
    console.log('✅ Compiling tasks and priorities...');
    briefData.tasks = await this.compileTasks(briefData.calendar, briefData.emails);

    // Step 4: Get Weather
    console.log('🌤️ Fetching weather...');
    briefData.weather = await this.fetchWeather();

    // Step 5: Generate Insights
    console.log('🧠 Generating insights...');
    briefData.insights = await this.generateInsights(briefData);

    // Step 6: Get Inspirational Quote
    briefData.quote = await this.getQuote();

    // Step 7: Create Obsidian Daily Note
    console.log('📝 Creating Obsidian daily note...');
    await this.createObsidianDailyNote(briefData);

    // Step 8: Display Summary
    this.displayDailyBrief(briefData);

    return briefData;
  }

  /**
   * Fetch Calendar Events from Google Calendar
   */
  async fetchCalendarEvents() {
    if (!this.oauth2Client) {
      return this.getMockCalendarEvents();
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
      return this.getMockCalendarEvents();
    }
  }

  getMockCalendarEvents() {
    return [
      {
        time: '09:00',
        title: 'Team Standup',
        location: 'Zoom',
        duration: '30 mins',
        meetingLink: 'https://zoom.us/j/123456'
      },
      {
        time: '11:00',
        title: 'Client Meeting',
        location: 'Google Meet',
        duration: '1 hour',
        attendees: ['client@example.com']
      },
      {
        time: '14:00',
        title: 'Deep Work Block',
        duration: '2 hours',
        description: 'Focus on project X'
      },
      {
        time: '16:30',
        title: 'Weekly Review',
        duration: '30 mins'
      }
    ];
  }

  /**
   * Process Emails from Gmail
   */
  async processEmails() {
    if (!this.oauth2Client) {
      return this.getMockEmails();
    }

    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      // Get recent unread emails (not just last 24 hours)
      const query = `is:unread`;

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10  // Limit to 10 most recent unread
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });
          return this.parseEmail(detail.data);
        })
      );

      // Categorize by importance
      return this.categorizeEmails(emails);
    } catch (error) {
      console.error('Email fetch error:', error.message);
      return this.getMockEmails();
    }
  }

  getMockEmails() {
    return {
      important: [
        {
          from: 'boss@company.com',
          subject: 'Q3 Report Review',
          preview: 'Please review the attached report before tomorrow\'s meeting',
          receivedAt: '7:30 AM',
          actionRequired: true
        },
        {
          from: 'client@bigcorp.com',
          subject: 'Project Update Request',
          preview: 'Could you send the latest status update?',
          receivedAt: '6:45 AM',
          actionRequired: true
        }
      ],
      regular: [
        {
          from: 'newsletter@medium.com',
          subject: 'Your Daily Digest',
          preview: 'Top stories from your network',
          receivedAt: 'Yesterday 8:00 PM'
        }
      ],
      notifications: [
        {
          from: 'github@github.com',
          subject: 'PR #123 merged',
          preview: 'Your pull request was successfully merged',
          receivedAt: '11:30 PM'
        }
      ]
    };
  }

  /**
   * Compile Tasks from calendar and emails
   */
  async compileTasks(calendar, emails) {
    const tasks = [];

    // Extract tasks from calendar
    calendar.forEach(event => {
      if (event.description && event.description.includes('TODO:')) {
        tasks.push({
          source: 'calendar',
          priority: 'high',
          task: event.description.split('TODO:')[1].trim(),
          deadline: event.time
        });
      }
    });

    // Extract action items from emails
    if (emails.important) {
      emails.important.forEach(email => {
        if (email.actionRequired) {
          tasks.push({
            source: 'email',
            priority: 'high',
            task: `Reply to ${email.from}: ${email.subject}`,
            context: email.preview
          });
        }
      });
    }

    // Add recurring daily tasks
    tasks.push(
      { source: 'routine', priority: 'medium', task: 'Morning meditation (20 min)' },
      { source: 'routine', priority: 'medium', task: 'Review and update project status' },
      { source: 'routine', priority: 'low', task: 'Process inbox to zero' }
    );

    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Fetch Weather
   */
  async fetchWeather() {
    try {
      const response = await axios.get(`${process.env.WEATHER_API_URL}/current.json`, {
        params: {
          key: process.env.WEATHER_API_KEY,
          q: process.env.WEATHER_LOCATION || 'Chiang Mai,TH'
        }
      });

      return {
        temp: `${response.data.current.temp_c}°C / ${response.data.current.temp_f}°F`,
        condition: response.data.current.condition.text,
        feelsLike: `${response.data.current.feelslike_c}°C`,
        humidity: `${response.data.current.humidity}%`,
        uv: response.data.current.uv
      };
    } catch (error) {
      return {
        temp: '26°C / 79°F',
        condition: 'Partly cloudy',
        feelsLike: '28°C',
        humidity: '75%'
      };
    }
  }

  /**
   * Generate Insights using AI analysis
   */
  async generateInsights(briefData) {
    const insights = [];

    // Schedule insights
    const meetingCount = briefData.calendar.filter(e => 
      e.title.toLowerCase().includes('meeting') || e.attendees
    ).length;
    
    if (meetingCount > 3) {
      insights.push('⚠️ Heavy meeting day - protect focus time between calls');
    }

    const focusBlocks = briefData.calendar.filter(e => 
      e.title.toLowerCase().includes('deep work') || e.title.toLowerCase().includes('focus')
    );
    
    if (focusBlocks.length === 0) {
      insights.push('💡 No focus time scheduled - consider blocking time for deep work');
    }

    // Email insights
    if (briefData.emails.important && briefData.emails.important.length > 5) {
      insights.push('📧 High email volume - schedule dedicated time for responses');
    }

    // Task insights
    const highPriorityTasks = briefData.tasks.filter(t => t.priority === 'high').length;
    if (highPriorityTasks > 3) {
      insights.push('🎯 Multiple high-priority items - consider delegation or rescheduling');
    }

    // Weather-based suggestions
    if (briefData.weather && briefData.weather.condition.includes('rain')) {
      insights.push('☔ Rainy day - perfect for indoor focused work');
    }

    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour < 12) {
      insights.push('🌅 Morning energy peak - tackle complex tasks first');
    }

    return insights;
  }

  /**
   * Get Daily Quote
   */
  async getQuote() {
    const quotes = [
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * Create Obsidian Daily Note
   */
  async createObsidianDailyNote(briefData) {
    const date = new Date();
    // Format filename as "Aug 26, 2025.md" for Obsidian
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const noteFilename = `${dateStr}.md`;
    const notePath = path.join(
      this.config.obsidianVaultPath,
      this.config.dailyNotesFolder,
      noteFilename
    );

    const noteContent = this.formatObsidianNote(briefData);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(notePath), { recursive: true });
      
      // Write the note
      await fs.writeFile(notePath, noteContent);
      
      console.log(`✅ Daily note created: ${notePath}`);
    } catch (error) {
      console.error('Failed to create Obsidian note:', error.message);
      
      // Fallback: save to local data directory
      const fallbackPath = path.join(
        process.env.MOTUS_DATA_DIR || './data',
        'daily-notes',
        noteFilename
      );
      await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
      await fs.writeFile(fallbackPath, noteContent);
      console.log(`📝 Daily note saved to: ${fallbackPath}`);
    }

    return notePath;
  }

  /**
   * Format Obsidian Note with proper markdown
   */
  formatObsidianNote(briefData) {
    const date = briefData.date;
    // Format as "Aug 26, 2025" for Obsidian
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    let content = `# ${dateStr}\n\n`;
    content += `> ${briefData.quote.text}\n> — ${briefData.quote.author}\n\n`;

    // Weather
    content += `## 🌤️ Weather\n`;
    content += `- **Temperature**: ${briefData.weather.temp}\n`;
    content += `- **Condition**: ${briefData.weather.condition}\n`;
    content += `- **Feels Like**: ${briefData.weather.feelsLike}\n`;
    content += `- **Humidity**: ${briefData.weather.humidity}\n\n`;

    // Schedule
    content += `## 📅 Today's Schedule\n\n`;
    if (briefData.calendar.length > 0) {
      briefData.calendar.forEach(event => {
        content += `### ${event.time} - ${event.title}\n`;
        if (event.duration) content += `- Duration: ${event.duration}\n`;
        if (event.location) content += `- Location: ${event.location}\n`;
        if (event.meetingLink) content += `- Link: ${event.meetingLink}\n`;
        if (event.description) content += `- Notes: ${event.description}\n`;
        content += '\n';
      });
    } else {
      content += `*No scheduled events*\n\n`;
    }

    // Tasks
    content += `## ✅ Tasks\n\n`;
    content += `### High Priority\n`;
    briefData.tasks.filter(t => t.priority === 'high').forEach(task => {
      content += `- [ ] ${task.task}\n`;
      if (task.context) content += `  - Context: ${task.context}\n`;
    });
    content += `\n### Medium Priority\n`;
    briefData.tasks.filter(t => t.priority === 'medium').forEach(task => {
      content += `- [ ] ${task.task}\n`;
    });
    content += `\n### Low Priority\n`;
    briefData.tasks.filter(t => t.priority === 'low').forEach(task => {
      content += `- [ ] ${task.task}\n`;
    });

    // Important Emails
    content += `\n## 📧 Important Emails\n\n`;
    if (briefData.emails.important && briefData.emails.important.length > 0) {
      briefData.emails.important.forEach(email => {
        content += `- **From**: ${email.from}\n`;
        content += `  - **Subject**: ${email.subject}\n`;
        content += `  - **Preview**: ${email.preview}\n`;
        content += `  - **Action**: ${email.actionRequired ? '🔴 Response needed' : '📋 Review'}\n\n`;
      });
    } else {
      content += `*No urgent emails*\n\n`;
    }

    // Insights
    content += `## 💡 Insights & Recommendations\n\n`;
    briefData.insights.forEach(insight => {
      content += `- ${insight}\n`;
    });

    // Daily Tracking Sections
    content += `\n## 📊 Daily Tracking\n\n`;
    content += `### Health & Wellness\n`;
    content += `- [ ] Morning routine completed\n`;
    content += `- [ ] Exercise: \n`;
    content += `- [ ] Water intake (8 glasses): ☐☐☐☐☐☐☐☐\n`;
    content += `- [ ] Meditation/Mindfulness: \n`;
    content += `- Sleep quality (1-10): \n\n`;

    content += `### Accomplishments\n\n\n`;
    content += `### Gratitude\n\n\n`;
    content += `### Notes & Ideas\n\n\n`;
    content += `### Tomorrow's Priorities\n\n\n`;

    // Footer
    content += `---\n`;
    content += `*Generated by Motus Life Admin at ${date.toLocaleTimeString()}*\n`;
    content += `#daily-note #${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    return content;
  }

  /**
   * Display Daily Brief in console with beautiful dashboard
   */
  displayDailyBrief(briefData) {
    // Use the beautiful CLI dashboard with colors and boxes
    this.dashboard.renderDailyBrief(briefData);
  }

  // Helper methods
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
    return `${Math.floor(duration / 60)} hours ${duration % 60} mins`;
  }

  parseEmail(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
    
    return {
      from: getHeader('From'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      snippet: message.snippet,
      id: message.id
    };
  }

  categorizeEmails(emails) {
    const categories = {
      important: [],
      regular: [],
      notifications: []
    };

    emails.forEach(email => {
      const fromLower = email.from.toLowerCase();
      const subjectLower = email.subject.toLowerCase();
      
      // Enhanced categorization logic
      if (
        // Direct business contacts
        fromLower.includes('blackrock') ||
        fromLower.includes('preqin') ||
        fromLower.includes('vc') ||
        fromLower.includes('capital') ||
        fromLower.includes('invest') ||
        // Keywords in subject
        subjectLower.includes('urgent') ||
        subjectLower.includes('important') ||
        subjectLower.includes('meeting') ||
        subjectLower.includes('deadline') ||
        subjectLower.includes('review') ||
        subjectLower.includes('proposal') ||
        subjectLower.includes('contract') ||
        // Reply threads
        subjectLower.startsWith('re:') ||
        // Forms and inquiries
        (fromLower.includes('webflow') && subjectLower.includes('form'))
      ) {
        categories.important.push({
          ...email,
          actionRequired: true,
          preview: email.snippet
        });
      } else if (
        fromLower.includes('github') || 
        fromLower.includes('notification') ||
        fromLower.includes('newsletter') ||
        fromLower.includes('gumroad') ||
        fromLower.includes('substack')
      ) {
        categories.notifications.push(email);
      } else {
        categories.regular.push(email);
      }
    });

    return categories;
  }

  /**
   * Create Calendar Event
   */
  async createCalendarEvent(eventDetails) {
    if (!this.oauth2Client) {
      await this.initializeGoogleAuth();
    }

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const event = {
      summary: eventDetails.title,
      location: eventDetails.location || '',
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.startTime,
        timeZone: this.config.timezone,
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: this.config.timezone,
      },
      attendees: eventDetails.attendees || [],
      reminders: eventDetails.reminders || {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        resource: event,
      });
      
      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error creating calendar event:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Email
   */
  async sendEmail(emailDetails) {
    if (!this.oauth2Client) {
      await this.initializeGoogleAuth();
    }

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    // Create email in RFC 2822 format
    const utf8Subject = `=?utf-8?B?${Buffer.from(emailDetails.subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${emailDetails.to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      emailDetails.body
    ];
    
    const message = messageParts.join('\n');
    
    // Encode in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      
      return {
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('Error sending email:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Draft Email
   */
  async createDraft(emailDetails) {
    if (!this.oauth2Client) {
      await this.initializeGoogleAuth();
    }

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    // Create email in RFC 2822 format
    const utf8Subject = `=?utf-8?B?${Buffer.from(emailDetails.subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${emailDetails.to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      emailDetails.body
    ];
    
    const message = messageParts.join('\n');
    
    // Encode in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });
      
      return {
        success: true,
        draftId: response.data.id
      };
    } catch (error) {
      console.error('Error creating draft:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update Calendar Event
   */
  async updateCalendarEvent(eventId, updates) {
    if (!this.oauth2Client) {
      await this.initializeGoogleAuth();
    }

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    try {
      const response = await calendar.events.patch({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: eventId,
        resource: updates,
      });
      
      return {
        success: true,
        event: response.data
      };
    } catch (error) {
      console.error('Error updating calendar event:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update Daily Note
   * Handles user updates to their daily tracking
   */
  async updateDailyNote(userInput) {
    console.log('\n📝 Updating Daily Note...');
    
    try {
      const result = await this.dailyNoteUpdater.parseAndUpdate(userInput);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        return result;
      } else {
        console.log(`❌ ${result.error}`);
        return result;
      }
    } catch (error) {
      console.error('Error updating daily note:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Read Daily Note
   * Returns the current daily note content
   */
  async readDailyNote() {
    console.log('\n📖 Reading Daily Note...');
    
    try {
      const result = await this.dailyNoteUpdater.readDailyNote();
      
      if (result.success) {
        console.log(`✅ Read daily note from: ${result.path}`);
        return result;
      } else {
        console.log(`❌ ${result.error}`);
        return result;
      }
    } catch (error) {
      console.error('Error reading daily note:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Daily Status
   * Returns a summary of today's progress
   */
  async getDailyStatus() {
    const result = await this.readDailyNote();
    
    if (!result.success) {
      return result;
    }
    
    const content = result.content;
    const status = {
      completed: [],
      pending: [],
      progress: {}
    };
    
    // Parse checkboxes
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.includes('- [x]')) {
        status.completed.push(line.replace('- [x]', '').trim());
      } else if (line.includes('- [ ]')) {
        status.pending.push(line.replace('- [ ]', '').trim());
      }
      
      // Check water intake
      if (line.includes('Water intake')) {
        const filledCount = (line.match(/☑/g) || []).length;
        status.progress.water = `${filledCount}/8 glasses`;
      }
      
      // Check sleep quality
      if (line.includes('Sleep quality')) {
        const match = line.match(/Sleep quality \(1-10\):\s*(\d+)/);
        if (match) {
          status.progress.sleep = `${match[1]}/10`;
        }
      }
    });
    
    return {
      success: true,
      status: status,
      summary: `Completed: ${status.completed.length} tasks, Pending: ${status.pending.length} tasks`
    };
  }

  /**
   * Setup Supplement Schedule
   * Parse natural language supplement schedule and create calendar events
   */
  async setupSupplementSchedule(scheduleText) {
    console.log('\n💊 Setting up supplement schedule...');
    
    // Initialize Google OAuth if needed
    if (!this.oauth2Client) {
      await this.initializeGoogleAuth();
    }
    
    if (!this.oauth2Client) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please run OAuth setup first.'
      };
    }
    
    // Initialize supplement manager
    if (!this.supplementManager) {
      this.supplementManager = new SupplementManager(this.oauth2Client);
    }
    
    try {
      // Parse the supplement schedule using V2 parser
      console.log('📝 Parsing supplement schedule...');
      const parser = new SupplementParserV2();
      const groupedSchedules = parser.parse(scheduleText);
      
      console.log(`Found ${groupedSchedules.length} supplement groups:`);
      groupedSchedules.forEach(group => {
        console.log(`  - ${group.time}: ${group.supplements.map(s => s.name).join(', ')} on ${group.days.join(',')}`);
      });
      
      // Create calendar events using the new creator
      console.log('\n📅 Creating recurring calendar events...');
      const events = await createSupplementCalendarEvents(groupedSchedules, this.oauth2Client);
      console.log(`✅ Created ${events.length} recurring events`);
      
      // Get today's supplements
      const todaySupplements = this.supplementManager.getTodaySupplements(groupedSchedules);
      
      // Add to today's daily note
      if (todaySupplements.length > 0) {
        console.log('\n📝 Adding to today\'s daily note...');
        await this.addSupplementsToDaily(todaySupplements);
      }
      
      return {
        success: true,
        schedules: groupedSchedules,
        events: events,
        todaySupplements: todaySupplements
      };
    } catch (error) {
      console.error('Error setting up supplements:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add supplements to daily note
   */
  async addSupplementsToDaily(todaySupplements) {
    const result = await this.dailyNoteUpdater.readDailyNote();
    
    if (!result.success) {
      console.log('Could not read daily note');
      return;
    }
    
    let content = result.content;
    const lines = content.split('\n');
    
    // Find the tasks section
    let tasksIndex = -1;
    let highPriorityIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('## ✅ Tasks')) {
        tasksIndex = i;
      }
      if (lines[i].includes('### High Priority')) {
        highPriorityIndex = i;
        break;
      }
    }
    
    if (highPriorityIndex === -1) {
      console.log('Could not find tasks section');
      return;
    }
    
    // Add supplements after High Priority header
    const supplementTasks = [];
    
    todaySupplements.forEach(group => {
      const timeStr = this.formatTime(group.time);
      group.supplements.forEach(supp => {
        const task = `- [ ] ${timeStr}: Take ${supp.dose}${supp.unit} ${supp.name}`;
        supplementTasks.push(task);
      });
    });
    
    // Insert the supplement tasks
    lines.splice(highPriorityIndex + 1, 0, ...supplementTasks);
    
    // Write back
    content = lines.join('\n');
    await fs.writeFile(result.path, content);
    console.log(`✅ Added ${supplementTasks.length} supplement tasks to daily note`);
  }

  /**
   * Format time for display
   */
  formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(n => parseInt(n));
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
}

// CLI handler
if (require.main === module) {
  const agent = new LifeAdminAgent();
  const command = process.argv[2];
  
  async function run() {
    try {
      if (command === 'daily-brief' || command === 'briefing') {
        console.log('🚀 Generating daily briefing with real data...\n');
        const result = await agent.generateDailyBrief();
        console.log('✅ Daily briefing complete!');
      } else if (command === 'update') {
        const updateText = process.argv.slice(3).join(' ');
        if (!updateText) {
          console.log('Usage: node life-admin-agent.js update [what you did]');
          console.log('Example: node life-admin-agent.js update "completed exercise from 2-3pm"');
          return;
        }
        const result = await agent.updateDailyNote(updateText);
      } else if (command === 'status') {
        const result = await agent.getDailyStatus();
        if (result.success) {
          console.log('\n📊 Daily Status:');
          console.log('Completed:', result.status.completed);
          console.log('Pending:', result.status.pending);
          console.log('Progress:', result.status.progress);
          console.log('\nSummary:', result.summary);
        }
      } else if (command === 'supplements' || command === 'peptides') {
        const scheduleText = process.argv.slice(3).join(' ');
        if (!scheduleText) {
          console.log('Usage: node life-admin-agent.js supplements "schedule description"');
          return;
        }
        const result = await agent.setupSupplementSchedule(scheduleText);
        if (result.success) {
          console.log('\n✅ Supplement schedule setup complete!');
          console.log(`Created ${result.events.length} recurring calendar events`);
          console.log(`Added ${result.todaySupplements.length} supplement groups to today's tasks`);
        }
      } else {
        console.log('Usage: node life-admin-agent.js [daily-brief|update|status|supplements]');
        console.log('  daily-brief - Generate morning briefing');
        console.log('  update "text" - Update daily note with activity');
        console.log('  status - Show daily progress');
        console.log('  supplements "schedule" - Setup supplement/peptide schedule');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  run();
}

module.exports = LifeAdminAgent;