/**
 * Motus External Integrations
 * Handles all API connections for Weather, Google, and other services
 */

require('dotenv').config();
const axios = require('axios');

class MotusIntegrations {
  constructor() {
    this.weatherApiKey = process.env.WEATHER_API_KEY;
    this.weatherApiUrl = process.env.WEATHER_API_URL;
    this.weatherLocation = process.env.WEATHER_LOCATION || 'San Francisco,CA';
    
    this.googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  /**
   * Weather API Integration
   */
  async getWeather() {
    if (!this.weatherApiKey) {
      return this.getMockWeather();
    }

    try {
      const response = await axios.get(`${this.weatherApiUrl}/forecast.json`, {
        params: {
          key: this.weatherApiKey,
          q: this.weatherLocation,
          days: 1,
          aqi: 'yes',
          alerts: 'yes'
        }
      });

      const data = response.data;
      return {
        current: {
          temp_f: data.current.temp_f,
          temp_c: data.current.temp_c,
          condition: data.current.condition.text,
          icon: data.current.condition.icon,
          wind_mph: data.current.wind_mph,
          humidity: data.current.humidity,
          feels_like_f: data.current.feelslike_f,
          uv: data.current.uv,
          air_quality: data.current.air_quality
        },
        forecast: {
          maxtemp_f: data.forecast.forecastday[0].day.maxtemp_f,
          mintemp_f: data.forecast.forecastday[0].day.mintemp_f,
          condition: data.forecast.forecastday[0].day.condition.text,
          chance_of_rain: data.forecast.forecastday[0].day.daily_chance_of_rain,
          sunrise: data.forecast.forecastday[0].astro.sunrise,
          sunset: data.forecast.forecastday[0].astro.sunset
        },
        alerts: data.alerts?.alert || [],
        location: {
          name: data.location.name,
          region: data.location.region,
          country: data.location.country
        }
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.getMockWeather();
    }
  }

  getMockWeather() {
    return {
      current: {
        temp_f: 72,
        temp_c: 22,
        condition: 'Partly cloudy',
        wind_mph: 10,
        humidity: 65,
        feels_like_f: 70,
        uv: 5
      },
      forecast: {
        maxtemp_f: 75,
        mintemp_f: 60,
        condition: 'Partly cloudy',
        chance_of_rain: 20,
        sunrise: '6:30 AM',
        sunset: '7:45 PM'
      },
      alerts: [],
      location: {
        name: this.weatherLocation.split(',')[0],
        region: this.weatherLocation.split(',')[1] || '',
        country: 'US'
      }
    };
  }

  /**
   * Google Calendar Integration (prepared for OAuth)
   */
  async getCalendarEvents() {
    if (!this.googleRefreshToken) {
      return this.getMockCalendar();
    }

    // TODO: Implement Google Calendar API
    // This would use googleapis library with OAuth2
    return this.getMockCalendar();
  }

  getMockCalendar() {
    const today = new Date();
    return [
      {
        time: '09:00 AM',
        title: 'Team Standup',
        duration: '30 min',
        type: 'meeting'
      },
      {
        time: '11:00 AM',
        title: 'Project Review',
        duration: '1 hour',
        type: 'meeting'
      },
      {
        time: '02:00 PM',
        title: 'Deep Work Block',
        duration: '2 hours',
        type: 'focus'
      },
      {
        time: '05:30 PM',
        title: 'Workout',
        duration: '45 min',
        type: 'personal'
      }
    ];
  }

  /**
   * Google Gmail Integration (prepared for OAuth)
   */
  async getImportantEmails() {
    if (!this.googleRefreshToken) {
      return this.getMockEmails();
    }

    // TODO: Implement Gmail API
    return this.getMockEmails();
  }

  getMockEmails() {
    return [
      {
        from: 'boss@company.com',
        subject: 'Q3 Report Review',
        preview: 'Please review the attached Q3 report before tomorrow\'s meeting...',
        priority: 'high'
      },
      {
        from: 'newsletter@techcrunch.com',
        subject: 'AI Weekly Digest',
        preview: 'This week in AI: Major breakthroughs in autonomous systems...',
        priority: 'low'
      }
    ];
  }

  /**
   * GitHub Integration
   */
  async getGitHubActivity() {
    if (!this.githubToken) {
      return this.getMockGitHub();
    }

    try {
      const headers = {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      // Get user's recent activity
      const username = process.env.GITHUB_USERNAME;
      const response = await axios.get(
        `https://api.github.com/users/${username}/events`,
        { headers }
      );

      const events = response.data.slice(0, 5);
      return events.map(event => ({
        type: event.type,
        repo: event.repo.name,
        created: event.created_at,
        action: this.parseGitHubAction(event)
      }));
    } catch (error) {
      console.error('GitHub API error:', error.message);
      return this.getMockGitHub();
    }
  }

  parseGitHubAction(event) {
    switch (event.type) {
      case 'PushEvent':
        return `Pushed ${event.payload.commits?.length || 0} commits`;
      case 'CreateEvent':
        return `Created ${event.payload.ref_type}`;
      case 'IssuesEvent':
        return `${event.payload.action} issue`;
      case 'PullRequestEvent':
        return `${event.payload.action} PR`;
      default:
        return event.type.replace('Event', '');
    }
  }

  getMockGitHub() {
    return [
      {
        type: 'PushEvent',
        repo: 'user/project',
        created: new Date().toISOString(),
        action: 'Pushed 3 commits'
      },
      {
        type: 'IssuesEvent',
        repo: 'user/project',
        created: new Date().toISOString(),
        action: 'Opened issue'
      }
    ];
  }

  /**
   * News API Integration (can use various sources)
   */
  async getNews(categories = ['technology', 'ai', 'business']) {
    // This could integrate with NewsAPI, RSS feeds, etc.
    return {
      technology: [
        'OpenAI announces new model with 10x efficiency',
        'Quantum computing breakthrough at MIT'
      ],
      ai: [
        'EU passes comprehensive AI regulation framework',
        'Google DeepMind solves protein folding challenge'
      ],
      business: [
        'Stock markets reach new highs on tech earnings',
        'Startup funding increases 40% in Q3'
      ]
    };
  }

  /**
   * Finance Integration (prepared for banking APIs)
   */
  async getFinanceSnapshot() {
    // This would integrate with Plaid, banking APIs, etc.
    return {
      accounts: {
        checking: 5432.10,
        savings: 15678.90,
        investments: 45678.23
      },
      recent_transactions: [
        { date: '2025-08-25', description: 'Grocery Store', amount: -87.43 },
        { date: '2025-08-24', description: 'Gas Station', amount: -45.00 }
      ],
      upcoming_bills: [
        { date: '2025-09-01', description: 'Rent', amount: 2500.00 },
        { date: '2025-08-28', description: 'Internet', amount: 79.99 }
      ],
      budget_status: {
        spent: 3245.67,
        budget: 5000.00,
        remaining: 1754.33,
        percentage: 65
      }
    };
  }

  /**
   * Health Integration (prepared for fitness trackers)
   */
  async getHealthData() {
    // This would integrate with Fitbit, Apple Health, etc.
    return {
      steps: {
        today: 6543,
        goal: 10000,
        percentage: 65
      },
      sleep: {
        last_night: 7.5,
        quality: 'Good',
        deep_sleep: 1.8
      },
      activity: {
        calories_burned: 1876,
        active_minutes: 34,
        standing_hours: 8
      },
      vitals: {
        heart_rate: 68,
        heart_rate_variability: 45
      }
    };
  }
}

module.exports = MotusIntegrations;