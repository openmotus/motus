#!/usr/bin/env node

/**
 * CLI Dashboard - Beautiful terminal output for daily briefing
 */

const chalk = require('chalk');
const boxen = require('boxen');

class CLIDashboard {
  constructor() {
    this.colors = {
      header: chalk.cyan.bold,
      subheader: chalk.yellow.bold,
      accent: chalk.magenta,
      success: chalk.green,
      warning: chalk.yellow,
      danger: chalk.red,
      info: chalk.blue,
      muted: chalk.gray,
      white: chalk.white
    };
  }

  renderDailyBrief(briefData) {
    console.clear();
    
    // Header with date
    this.renderHeader(briefData.date);
    
    // Quote of the day
    this.renderQuote(briefData.quote);
    
    // Weather widget
    this.renderWeather(briefData.weather);
    
    // Calendar summary
    this.renderSchedule(briefData.calendar);
    
    // Tasks summary
    this.renderTasks(briefData.tasks);
    
    // Emails summary
    this.renderEmails(briefData.emails);
    
    // Insights
    this.renderInsights(briefData.insights);
    
    // Footer
    this.renderFooter();
  }

  renderHeader(date) {
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const header = boxen(
      this.colors.header(`☀️  ${dateStr.toUpperCase()}  ☀️`),
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: 'double',
        borderColor: 'cyan',
        textAlignment: 'center'
      }
    );
    
    console.log(header);
  }

  renderQuote(quote) {
    if (!quote) return;
    
    const quoteBox = boxen(
      `${this.colors.white.italic(`"${quote.text}"`)}\n${this.colors.muted(`— ${quote.author}`)}`,
      {
        padding: { left: 2, right: 2, top: 1, bottom: 1 },
        margin: { bottom: 1 },
        borderStyle: 'classic',
        borderColor: 'gray',
        textAlignment: 'center'
      }
    );
    
    console.log(quoteBox);
  }

  renderWeather(weather) {
    if (!weather) return;
    
    console.log(this.colors.subheader('\n🌤️  WEATHER\n'));
    
    const weatherGrid = `
  ${this.colors.white('Temperature:')} ${this.getTemperatureColor(weather.temp)(weather.temp)}    ${this.colors.white('Feels Like:')} ${this.getTemperatureColor(weather.feelsLike)(weather.feelsLike)}
  ${this.colors.white('Condition:')} ${this.colors.info(weather.condition)}
  ${this.colors.white('Humidity:')} ${this.colors.accent(weather.humidity)}    ${this.colors.white('Wind:')} ${this.colors.accent(weather.wind || 'N/A')}
    `.trim();
    
    console.log(boxen(weatherGrid, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }));
    
    // Forecast summary
    if (weather.forecast && weather.forecast.length > 0) {
      console.log(this.colors.muted('\n  📅 3-Day Forecast:'));
      weather.forecast.slice(0, 3).forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        console.log(`  ${this.colors.white(date)}: ${day.minTemp} - ${day.maxTemp} | ${day.condition} | 💧 ${day.chanceOfRain}`);
      });
    }
  }

  renderSchedule(calendar) {
    if (!calendar || calendar.length === 0) {
      console.log(this.colors.subheader('\n📅  SCHEDULE\n'));
      console.log(this.colors.success('  ✨ No meetings today - focus time available!'));
      return;
    }
    
    console.log(this.colors.subheader('\n📅  TODAY\'S SCHEDULE\n'));
    
    const now = new Date();
    calendar.slice(0, 5).forEach(event => {
      if (!event || !event.summary) return;
      
      // Handle different date formats
      let eventTime;
      if (event.start && event.start.dateTime) {
        eventTime = new Date(event.start.dateTime);
      } else if (event.start && event.start.date) {
        eventTime = new Date(event.start.date);
      } else if (event.start) {
        eventTime = new Date(event.start);
      } else {
        eventTime = new Date();
      }
      
      const isPast = eventTime < now;
      const timeStr = !isNaN(eventTime) ? eventTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'All Day';
      const durationStr = event.duration ? `(${event.duration})` : '';
      
      const eventColor = isPast ? this.colors.muted : this.colors.white;
      const indicator = isPast ? '✓' : '•';
      
      console.log(`  ${indicator} ${eventColor(timeStr)} - ${eventColor.bold(event.summary)} ${this.colors.muted(durationStr)}`);
      if (event.location && !isPast) {
        console.log(`    ${this.colors.muted(`📍 ${event.location}`)}`);
      }
    });
    
    if (calendar.length > 5) {
      console.log(this.colors.muted(`\n  ... and ${calendar.length - 5} more events`));
    }
  }

  renderTasks(tasks) {
    if (!tasks || tasks.length === 0) return;
    
    console.log(this.colors.subheader('\n✅  PRIORITY TASKS\n'));
    
    const highPriority = tasks.filter(t => t && t.priority === 'high');
    const mediumPriority = tasks.filter(t => t && t.priority === 'medium');
    
    if (highPriority.length > 0) {
      console.log(this.colors.danger('  🔴 High Priority:'));
      highPriority.slice(0, 3).forEach(task => {
        if (task && task.title) {
          console.log(`     • ${task.title}`);
        }
      });
    }
    
    if (mediumPriority.length > 0) {
      console.log(this.colors.warning('\n  🟡 Medium Priority:'));
      mediumPriority.slice(0, 2).forEach(task => {
        if (task && task.title) {
          console.log(`     • ${task.title}`);
        }
      });
    }
    
    const totalTasks = tasks.filter(t => t).length;
    console.log(this.colors.muted(`\n  📊 Total: ${totalTasks} tasks for today`));
  }

  renderEmails(emails) {
    if (!emails) return;
    
    // Handle both array format and object format with important property
    let emailList = [];
    if (Array.isArray(emails)) {
      emailList = emails;
    } else if (emails.important && Array.isArray(emails.important)) {
      emailList = emails.important;
    }
    
    if (emailList.length === 0) return;
    
    const unread = emailList.filter(e => e.labels && e.labels.includes('UNREAD'));
    const important = emailList.filter(e => e.labels && e.labels.includes('IMPORTANT'));
    
    console.log(this.colors.subheader('\n📧  EMAIL SUMMARY\n'));
    
    const actionRequired = emailList.filter(e => e && e.actionRequired).length;
    const stats = `
  ${this.colors.info('📥 Inbox:')} ${unread.length} unread
  ${this.colors.warning('⭐ Important:')} ${important.length} messages
  ${this.colors.accent('📮 Action Required:')} ${actionRequired} emails
    `.trim();
    
    console.log(boxen(stats, {
      padding: { left: 1, right: 1, top: 0, bottom: 0 },
      borderStyle: 'round',
      borderColor: 'magenta'
    }));
    
    // Show top important emails
    const topEmails = emailList.filter(e => e && e.actionRequired).slice(0, 2);
    if (topEmails.length > 0) {
      console.log(this.colors.muted('\n  📌 Action Required:'));
      topEmails.forEach(email => {
        if (email && email.from && email.subject) {
          console.log(`     • From: ${this.colors.white(email.from)}`);
          const subject = email.subject.length > 60 ? email.subject.substring(0, 60) + '...' : email.subject;
          console.log(`       ${this.colors.muted(subject)}`);
        }
      });
    }
  }

  renderInsights(insights) {
    if (!insights || insights.length === 0) return;
    
    console.log(this.colors.subheader('\n💡  INSIGHTS & RECOMMENDATIONS\n'));
    
    insights.slice(0, 4).forEach(insight => {
      console.log(`  ${this.colors.accent('•')} ${this.colors.white(insight)}`);
    });
  }

  renderFooter() {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    console.log('\n' + this.colors.muted('─'.repeat(60)));
    console.log(this.colors.muted(`  🤖 Motus Life Admin | Generated at ${time}`));
    console.log(this.colors.success(`  ✅ Daily note created in Obsidian`));
    console.log(this.colors.muted('─'.repeat(60)) + '\n');
  }

  getTemperatureColor(temp) {
    const celsiusMatch = temp.match(/(\d+)°C/);
    if (!celsiusMatch) return this.colors.white;
    
    const celsius = parseInt(celsiusMatch[1]);
    if (celsius < 15) return this.colors.info;
    if (celsius < 25) return this.colors.success;
    if (celsius < 30) return this.colors.warning;
    return this.colors.danger;
  }

  renderSimpleSummary(message) {
    const box = boxen(
      this.colors.success(`✅ ${message}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );
    console.log(box);
  }
}

module.exports = CLIDashboard;