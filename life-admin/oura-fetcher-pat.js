#!/usr/bin/env node

/**
 * Oura Fetcher using Personal Access Token
 * Simpler alternative to OAuth for single-user access
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Oura API configuration
const OURA_API_BASE = 'https://api.ouraring.com';

class OuraFetcherPAT {
  constructor() {
    // Use Personal Access Token from environment variable
    this.token = process.env.OURA_PERSONAL_ACCESS_TOKEN;
  }

  async fetchDailySleep(startDate, endDate) {
    if (!this.token) {
      console.error('❌ No Oura Personal Access Token found in .env file');
      console.error('Get one from: https://cloud.ouraring.com/personal-access-tokens');
      return null;
    }

    try {
      const url = `${OURA_API_BASE}/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Invalid or expired token. Get a new one from: https://cloud.ouraring.com/personal-access-tokens');
        }
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
    
    // Get daily sleep score
    const dailySleep = await this.fetchDailySleep(today, today);
    
    // Get detailed sleep session - check last 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];
    const sessions = await this.fetchSleepSessions(startDateStr, today);
    
    // Find most recent session
    const latestSession = sessions && sessions.length > 0 ? sessions[0] : null;
    
    return {
      daily: dailySleep,
      session: latestSession
    };
  }

  async fetchActivity(startDate, endDate) {
    if (!this.token) {
      return null;
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
      return null;
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

  async fetchSleepSessions(startDate, endDate) {
    if (!this.token) {
      return null;
    }

    try {
      const url = `${OURA_API_BASE}/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data; // Returns array of sleep sessions with detailed data
    } catch (error) {
      console.error('Error fetching sleep sessions:', error.message);
      return null;
    }
  }

  formatSleepData(sleepData, sleepSession) {
    // Use daily_sleep for score, sleep session for detailed durations
    const score = sleepData?.[0]?.score || null;
    
    if (!sleepSession) {
      return {
        score: score,
        summary: score ? `Sleep Score: ${score}/100` : 'No sleep data available',
        details: {}
      };
    }
    
    // Convert seconds to minutes for calculations
    const totalMinutes = Math.round(sleepSession.total_sleep_duration / 60);
    const deepMinutes = Math.round(sleepSession.deep_sleep_duration / 60);
    const remMinutes = Math.round(sleepSession.rem_sleep_duration / 60);
    const lightMinutes = Math.round(sleepSession.light_sleep_duration / 60);
    const awakeMinutes = Math.round(sleepSession.awake_time / 60);
    
    return {
      score: score,
      summary: `Sleep Score: ${score || 'N/A'}/100`,
      details: {
        totalSleep: this.formatMinutes(totalMinutes),
        deepSleep: this.formatMinutes(deepMinutes),
        remSleep: this.formatMinutes(remMinutes),
        lightSleep: this.formatMinutes(lightMinutes),
        awake: this.formatMinutes(awakeMinutes),
        efficiency: sleepSession.efficiency,
        lowestHR: sleepSession.lowest_heart_rate,
        avgHR: sleepSession.average_heart_rate,
        avgHRV: sleepSession.average_hrv,
        restlessPeriods: sleepSession.restless_periods
      },
      raw: {
        daily: sleepData?.[0],
        session: sleepSession
      }
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
    
    const [sleepData, activity, readiness] = await Promise.all([
      this.fetchTodaysSleep(),
      this.fetchActivity(today, today),
      this.fetchReadiness(today, today)
    ]);

    const sleepFormatted = this.formatSleepData(sleepData?.daily, sleepData?.session);
    
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
  const fetcher = new OuraFetcherPAT();
  const command = process.argv[2] || 'summary';

  switch (command) {
    case 'sleep':
      const sleepData = await fetcher.fetchTodaysSleep();
      console.log(JSON.stringify(fetcher.formatSleepData(sleepData?.daily, sleepData?.session), null, 2));
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
module.exports = OuraFetcherPAT;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}