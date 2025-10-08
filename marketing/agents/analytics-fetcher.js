#!/usr/bin/env node

/**
 * analytics-fetcher
 * Generated: 2025-10-08T05:26:53.906Z
 * **********************************************************************
 */

require('dotenv').config();
const axios = require('axios');

/**
 * Analytics-fetcher
 * Retrieves Google Analytics data
 */

async function analyticsFetcher() {
  try {
    const apiKey = process.env.GOOGLE_ANALYTICS_TOKEN;

    const response = await axios.get('https://analyticsreporting.googleapis.com/v4/reports:batchGet', {
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
    });

    const data = {
      sessions: response.data.reports[0].data.totals[0].values[0],
      pageviews: response.data.reports[0].data.totals[0].values[1],
      timestamp: new Date().toISOString()
    };

    return data;
  } catch (error) {
    console.error('Error in analyticsFetcher:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// If run directly, output JSON
if (require.main === module) {
  analyticsFetcher().then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(console.error);
}

module.exports = { analyticsFetcher };
