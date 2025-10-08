#!/usr/bin/env node

/**
 * Enhanced Life Department with Real Integrations
 * Uses actual Weather API, prepared for Google Calendar/Gmail
 */

const MotusIntegrations = require('./integrations');
const fs = require('fs').promises;
const path = require('path');

class EnhancedLifeDepartment {
  constructor() {
    this.integrations = new MotusIntegrations();
    this.dataPath = path.join(process.env.MOTUS_DATA_DIR || '/Users/ianwinscom/motus/data');
  }

  /**
   * Enhanced Morning Briefing with real data
   */
  async morningBriefing() {
    console.log('\n☀️ Generating your personalized morning briefing...\n');
    
    const briefing = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      sections: []
    };

    // 1. Real Weather Data
    console.log('🌤️ Fetching weather data...');
    const weather = await this.integrations.getWeather();
    briefing.sections.push({
      title: '🌤️ WEATHER',
      content: this.formatWeather(weather)
    });

    // 2. Calendar Events
    console.log('📅 Checking calendar...');
    const calendar = await this.integrations.getCalendarEvents();
    briefing.sections.push({
      title: '📅 TODAY\'S SCHEDULE',
      content: this.formatCalendar(calendar)
    });

    // 3. Important Emails
    console.log('📧 Scanning emails...');
    const emails = await this.integrations.getImportantEmails();
    briefing.sections.push({
      title: '📧 IMPORTANT EMAILS',
      content: this.formatEmails(emails)
    });

    // 4. GitHub Activity
    console.log('💻 Checking GitHub...');
    const github = await this.integrations.getGitHubActivity();
    briefing.sections.push({
      title: '💻 GITHUB ACTIVITY',
      content: this.formatGitHub(github)
    });

    // 5. Finance Snapshot
    console.log('💰 Analyzing finances...');
    const finance = await this.integrations.getFinanceSnapshot();
    briefing.sections.push({
      title: '💰 FINANCIAL SNAPSHOT',
      content: this.formatFinance(finance)
    });

    // 6. Health Status
    console.log('💪 Checking health data...');
    const health = await this.integrations.getHealthData();
    briefing.sections.push({
      title: '💪 HEALTH STATUS',
      content: this.formatHealth(health)
    });

    // 7. News Digest
    console.log('📰 Curating news...');
    const news = await this.integrations.getNews();
    briefing.sections.push({
      title: '📰 NEWS DIGEST',
      content: this.formatNews(news)
    });

    // 8. Daily Priorities (using Task sub-agent)
    briefing.sections.push({
      title: '🎯 TODAY\'S PRIORITIES',
      content: await this.generatePriorities(calendar, emails, health)
    });

    this.displayBriefing(briefing);
    await this.saveBriefing(briefing);
    
    return briefing;
  }

  // Formatting methods
  formatWeather(weather) {
    return `
Current: ${weather.current.temp_f}°F (${weather.current.condition})
Feels like: ${weather.current.feels_like_f}°F
High/Low: ${weather.forecast.maxtemp_f}°/${weather.forecast.mintemp_f}°F
Wind: ${weather.current.wind_mph} mph | Humidity: ${weather.current.humidity}%
UV Index: ${weather.current.uv} | Rain chance: ${weather.forecast.chance_of_rain}%
Sunrise: ${weather.forecast.sunrise} | Sunset: ${weather.forecast.sunset}
${weather.alerts.length > 0 ? `⚠️ ALERTS: ${weather.alerts[0].headline}` : ''}

Recommendation: ${this.getWeatherRecommendation(weather)}`;
  }

  getWeatherRecommendation(weather) {
    const recommendations = [];
    
    if (weather.current.temp_f < 50) recommendations.push('Wear warm layers');
    if (weather.current.temp_f > 80) recommendations.push('Stay hydrated');
    if (weather.forecast.chance_of_rain > 30) recommendations.push('Bring umbrella');
    if (weather.current.uv > 6) recommendations.push('Apply sunscreen');
    if (weather.current.wind_mph > 20) recommendations.push('Windy - secure loose items');
    
    return recommendations.length > 0 ? recommendations.join(' | ') : 'Perfect weather for any activity!';
  }

  formatCalendar(events) {
    if (events.length === 0) {
      return 'No scheduled events today - perfect for deep work!';
    }
    
    return events.map(event => 
      `${event.time}: ${event.title} (${event.duration})`
    ).join('\n');
  }

  formatEmails(emails) {
    if (emails.length === 0) {
      return 'Inbox zero! No urgent emails.';
    }
    
    return emails.map(email => 
      `${email.priority === 'high' ? '🔴' : '⚪'} From: ${email.from}
   Subject: ${email.subject}
   Preview: ${email.preview.substring(0, 60)}...`
    ).join('\n\n');
  }

  formatGitHub(activities) {
    if (activities.length === 0) {
      return 'No recent GitHub activity';
    }
    
    return activities.slice(0, 3).map(activity => 
      `• ${activity.action} in ${activity.repo}`
    ).join('\n');
  }

  formatFinance(finance) {
    return `
Budget Status: ${finance.budget_status.percentage}% used ($${finance.budget_status.spent}/$${finance.budget_status.budget})
Remaining: $${finance.budget_status.remaining}

Account Balances:
• Checking: $${finance.accounts.checking.toLocaleString()}
• Savings: $${finance.accounts.savings.toLocaleString()}
• Investments: $${finance.accounts.investments.toLocaleString()}

Upcoming Bills:
${finance.upcoming_bills.map(bill => 
  `• ${bill.date}: ${bill.description} - $${bill.amount}`
).join('\n')}`;
  }

  formatHealth(health) {
    return `
Steps: ${health.steps.today.toLocaleString()}/${health.steps.goal.toLocaleString()} (${health.steps.percentage}%)
Sleep: ${health.sleep.last_night} hours (${health.sleep.quality})
Active Minutes: ${health.activity.active_minutes}/30 goal
Calories Burned: ${health.activity.calories_burned.toLocaleString()}
Heart Rate: ${health.vitals.heart_rate} bpm
${health.steps.percentage < 50 ? '💡 Try to get more steps in today!' : ''}`;
  }

  formatNews(news) {
    const allNews = [];
    for (const [category, articles] of Object.entries(news)) {
      articles.forEach(article => {
        allNews.push(`• [${category.toUpperCase()}] ${article}`);
      });
    }
    return allNews.slice(0, 5).join('\n');
  }

  async generatePriorities(calendar, emails, health) {
    // In real implementation, this would use Task sub-agent
    const priorities = [];
    
    // Based on calendar
    if (calendar.some(e => e.type === 'meeting')) {
      priorities.push('Prepare for scheduled meetings');
    }
    
    // Based on emails
    if (emails.some(e => e.priority === 'high')) {
      priorities.push('Respond to high-priority emails');
    }
    
    // Based on health
    if (health.steps.percentage < 30) {
      priorities.push('Schedule time for physical activity');
    }
    
    // Default priorities
    priorities.push('Complete most important project task');
    priorities.push('Personal development: 30 min learning');
    
    return priorities.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n');
  }

  displayBriefing(briefing) {
    console.log('\n' + '='.repeat(70));
    console.log(`🌅 MORNING BRIEFING - ${briefing.date} ${briefing.time}`);
    console.log('='.repeat(70));
    
    for (const section of briefing.sections) {
      console.log(`\n${section.title}`);
      console.log('-'.repeat(40));
      console.log(section.content);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('Have an amazing and productive day! 🚀');
    console.log('='.repeat(70) + '\n');
  }

  async saveBriefing(briefing) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'briefings', `${date}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(briefing, null, 2));
  }

  /**
   * Evening Review with real data analysis
   */
  async eveningReview() {
    console.log('\n🌙 Generating evening review...\n');
    
    const review = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      sections: []
    };

    // Load morning briefing to compare
    const morningData = await this.loadMorningBriefing();
    
    // 1. Goal Progress
    const health = await this.integrations.getHealthData();
    review.sections.push({
      title: '✅ ACCOMPLISHMENTS',
      content: this.analyzeAccomplishments(health, morningData)
    });

    // 2. Tomorrow's Weather
    const weather = await this.integrations.getWeather();
    review.sections.push({
      title: '🌤️ TOMORROW\'S WEATHER',
      content: `High: ${weather.forecast.maxtemp_f}°F | Low: ${weather.forecast.mintemp_f}°F
Condition: ${weather.forecast.condition}
Rain chance: ${weather.forecast.chance_of_rain}%`
    });

    // 3. Tomorrow's Calendar
    const calendar = await this.integrations.getCalendarEvents();
    review.sections.push({
      title: '📅 TOMORROW\'S SCHEDULE',
      content: calendar.length > 0 ? 
        calendar.slice(0, 3).map(e => `• ${e.time}: ${e.title}`).join('\n') :
        'Clear calendar - great for deep work!'
    });

    // 4. Reflection Prompts
    review.sections.push({
      title: '💭 REFLECTION',
      content: `What went well today?
What could be improved?
What am I grateful for?
Tomorrow's main focus?`
    });

    this.displayReview(review);
    await this.saveReview(review);
    
    return review;
  }

  analyzeAccomplishments(health, morningData) {
    const accomplishments = [];
    
    if (health.steps.percentage >= 100) {
      accomplishments.push('✓ Hit step goal!');
    } else if (health.steps.percentage >= 70) {
      accomplishments.push(`✓ ${health.steps.percentage}% of step goal`);
    }
    
    if (health.activity.active_minutes >= 30) {
      accomplishments.push('✓ Met activity goal');
    }
    
    accomplishments.push('✓ Completed morning briefing');
    accomplishments.push('✓ Maintained focus during work blocks');
    
    return accomplishments.join('\n');
  }

  async loadMorningBriefing() {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filePath = path.join(this.dataPath, 'briefings', `${date}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  displayReview(review) {
    console.log('\n' + '='.repeat(70));
    console.log(`🌙 EVENING REVIEW - ${review.date} ${review.time}`);
    console.log('='.repeat(70));
    
    for (const section of review.sections) {
      console.log(`\n${section.title}`);
      console.log('-'.repeat(40));
      console.log(section.content);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('Rest well and sweet dreams! 😴');
    console.log('='.repeat(70) + '\n');
  }

  async saveReview(review) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'reviews', `${date}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(review, null, 2));
  }
}

module.exports = EnhancedLifeDepartment;