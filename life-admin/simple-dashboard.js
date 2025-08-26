#!/usr/bin/env node

/**
 * Simple Dashboard - Text-based dashboard for Claude Code display
 */

class SimpleDashboard {
  renderDailyBrief(briefData) {
    let output = '';
    
    // Header
    output += '\n' + '═'.repeat(60) + '\n';
    output += '           🌅 DAILY BRIEFING - ' + new Date().toLocaleDateString() + '\n';
    output += '═'.repeat(60) + '\n\n';
    
    // Quote
    if (briefData.quote) {
      output += '💭 Quote of the Day:\n';
      output += `   "${briefData.quote.text}"\n`;
      output += `   — ${briefData.quote.author}\n\n`;
      output += '─'.repeat(60) + '\n\n';
    }
    
    // Weather
    if (briefData.weather) {
      output += '🌤️  WEATHER\n';
      output += '─'.repeat(20) + '\n';
      output += `Temperature: ${briefData.weather.temp}\n`;
      output += `Feels Like:  ${briefData.weather.feelsLike}\n`;
      output += `Condition:   ${briefData.weather.condition}\n`;
      output += `Humidity:    ${briefData.weather.humidity}\n`;
      if (briefData.weather.forecast && briefData.weather.forecast.length > 0) {
        output += '\nNext 3 Days:\n';
        briefData.weather.forecast.slice(0, 3).forEach(day => {
          const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          output += `  ${date}: ${day.minTemp} - ${day.maxTemp} | ${day.condition}\n`;
        });
      }
      output += '\n';
    }
    
    // Calendar
    output += '📅 TODAY\'S SCHEDULE\n';
    output += '─'.repeat(20) + '\n';
    if (briefData.calendar && briefData.calendar.length > 0) {
      briefData.calendar.forEach(event => {
        if (event && event.summary) {
          let time = 'All Day';
          if (event.start) {
            if (event.start.dateTime) {
              time = new Date(event.start.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
          }
          output += `${time} - ${event.summary}`;
          if (event.duration) output += ` (${event.duration})`;
          output += '\n';
          if (event.location) output += `        📍 ${event.location}\n`;
        }
      });
    } else {
      output += '✨ No meetings scheduled - focus time available!\n';
    }
    output += '\n';
    
    // Tasks
    output += '✅ PRIORITY TASKS\n';
    output += '─'.repeat(20) + '\n';
    if (briefData.tasks && briefData.tasks.length > 0) {
      const highPri = briefData.tasks.filter(t => t && t.priority === 'high');
      const medPri = briefData.tasks.filter(t => t && t.priority === 'medium');
      
      if (highPri.length > 0) {
        output += '🔴 High Priority:\n';
        highPri.forEach(task => {
          if (task && task.title) output += `   • ${task.title}\n`;
        });
      }
      
      if (medPri.length > 0) {
        output += '🟡 Medium Priority:\n';
        medPri.forEach(task => {
          if (task && task.title) output += `   • ${task.title}\n`;
        });
      }
      
      output += `\nTotal: ${briefData.tasks.length} tasks today\n`;
    } else {
      output += 'No tasks scheduled\n';
    }
    output += '\n';
    
    // Emails
    if (briefData.emails) {
      let emailList = Array.isArray(briefData.emails) ? briefData.emails : 
                     (briefData.emails.important || []);
      
      if (emailList.length > 0) {
        output += '📧 EMAIL SUMMARY\n';
        output += '─'.repeat(20) + '\n';
        
        const actionRequired = emailList.filter(e => e && e.actionRequired);
        if (actionRequired.length > 0) {
          output += `Action Required: ${actionRequired.length} emails\n\n`;
          actionRequired.slice(0, 3).forEach(email => {
            if (email) {
              output += `From: ${email.from || 'Unknown'}\n`;
              output += `Re: ${email.subject || 'No subject'}\n\n`;
            }
          });
        }
      }
    }
    
    // Insights
    if (briefData.insights && briefData.insights.length > 0) {
      output += '💡 INSIGHTS & RECOMMENDATIONS\n';
      output += '─'.repeat(20) + '\n';
      briefData.insights.forEach(insight => {
        output += `• ${insight}\n`;
      });
      output += '\n';
    }
    
    // Footer
    output += '═'.repeat(60) + '\n';
    output += `✅ Daily note created in Obsidian at ${new Date().toLocaleTimeString()}\n`;
    output += '═'.repeat(60) + '\n';
    
    // Output everything at once
    console.log(output);
  }
}

module.exports = SimpleDashboard;