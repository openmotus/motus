#!/usr/bin/env node

/**
 * trend-analyzer
 * Generated: 2025-10-08T05:26:53.905Z
 * **********************************************************************
 */

require('dotenv').config();
const axios = require('axios');

/**
 * Trend-analyzer
 * Fetches trending topics from Twitter API
 */

async function trendAnalyzer(locationId) {
  try {
    const apiKey = process.env.TWITTER_API_KEY;

    const response = await axios.get('https://api.twitter.com/1.1/trends/place.json', {
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      params: {
        id: '1',
      }
    });

    const data = {
      trends: response.data[0].trends,
      location: response.data[0].locations[0].name,
      timestamp: new Date().toISOString()
    };

    return data;
  } catch (error) {
    console.error('Error in trendAnalyzer:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// If run directly, output JSON
if (require.main === module) {
  const locationId = process.argv[2] || '1';
  trendAnalyzer(locationId).then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(console.error);
}

module.exports = { trendAnalyzer };
