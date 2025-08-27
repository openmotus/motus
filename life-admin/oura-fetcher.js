#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Oura API configuration
const OURA_API_BASE = 'https://api.ouraring.com';
const TOKEN_FILE = path.join(process.env.HOME, '.motus', 'oura-token.json');

class OuraFetcher {
  constructor() {
    this.token = null;
  }

  async loadToken() {
    try {
      const tokenData = JSON.parse(await fs.readFile(TOKEN_FILE, 'utf8'));
      this.token = tokenData.access_token;
      return true;
    } catch (error) {
      console.error('❌ Oura not connected. Use OAuth Manager to connect.');
      return false;
    }
  }

  async fetchDailySleep(startDate, endDate) {
    if (!this.token) {
      if (!await this.loadToken()) return null;
    }

    try {
      const url = `${OURA_API_BASE}/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data; // Returns array of sleep sessions
    } catch (error) {
      console.error('Error fetching Oura sleep data:', error.message);
      return null;
    }
  }

  async fetchTodaysSleep() {
    const today = new Date().toISOString().split('T')[0];
    const sleepData = await this.fetchDailySleep(today, today);
    
    if (!sleepData || sleepData.length === 0) {
      // Try yesterday (sleep often crosses midnight)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return await this.fetchDailySleep(yesterdayStr, yesterdayStr);
    }
    
    return sleepData;
  }

  async fetchActivity(startDate, endDate) {
    if (!this.token) {
      if (!await this.loadToken()) return null;
    }

    try {
      const url = `${OURA_API_BASE}/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching Oura activity data:', error.message);
      return null;
    }
  }

  async fetchReadiness(startDate, endDate) {
    if (!this.token) {
      if (!await this.loadToken()) return null;
    }

    try {
      const url = `${OURA_API_BASE}/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching Oura readiness data:', error.message);
      return null;
    }
  }

  formatSleepData(sleepData) {
    if (!sleepData || sleepData.length === 0) {
      return {
        score: null,
        summary: 'No sleep data available',
        details: {}
      };
    }

    const latestSleep = sleepData[0]; // Most recent sleep session
    
    return {
      score: latestSleep.score,
      summary: `Sleep Score: ${latestSleep.score || 'N/A'}/100`,
      details: {
        totalSleep: this.formatMinutes(latestSleep.contributors?.total_sleep),
        efficiency: latestSleep.contributors?.efficiency,
        restfulness: latestSleep.contributors?.restfulness,
        timing: latestSleep.contributors?.timing,
        latency: this.formatMinutes(latestSleep.contributors?.latency),
        deepSleep: this.formatMinutes(latestSleep.contributors?.deep_sleep),
        remSleep: this.formatMinutes(latestSleep.contributors?.rem_sleep)
      },
      raw: latestSleep
    };
  }

  formatMinutes(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  async getDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    
    const [sleep, activity, readiness] = await Promise.all([
      this.fetchTodaysSleep(),
      this.fetchActivity(today, today),
      this.fetchReadiness(today, today)
    ]);

    const sleepFormatted = this.formatSleepData(sleep);
    
    return {
      sleep: sleepFormatted,
      activity: activity?.[0] || null,
      readiness: readiness?.[0] || null,
      summary: {
        sleepScore: sleepFormatted.score,
        activityScore: activity?.[0]?.score || null,
        readinessScore: readiness?.[0]?.score || null
      }
    };
  }
}

// CLI interface
async function main() {
  const fetcher = new OuraFetcher();
  const command = process.argv[2] || 'summary';

  switch (command) {
    case 'sleep':
      const sleepData = await fetcher.fetchTodaysSleep();
      console.log(JSON.stringify(fetcher.formatSleepData(sleepData), null, 2));
      break;
      
    case 'activity':
      const today = new Date().toISOString().split('T')[0];
      const activity = await fetcher.fetchActivity(today, today);
      console.log(JSON.stringify(activity?.[0] || {}, null, 2));
      break;
      
    case 'readiness':
      const todayDate = new Date().toISOString().split('T')[0];
      const readiness = await fetcher.fetchReadiness(todayDate, todayDate);
      console.log(JSON.stringify(readiness?.[0] || {}, null, 2));
      break;
      
    case 'summary':
    default:
      const summary = await fetcher.getDailySummary();
      console.log(JSON.stringify(summary, null, 2));
      break;
  }
}

// Export for use in other modules
module.exports = OuraFetcher;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}