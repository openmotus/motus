#!/usr/bin/env node

/**
 * social-fetcher
 * Generated: 2025-10-08T05:26:53.906Z
 * **********************************************************************
 */

require('dotenv').config();
const axios = require('axios');

/**
 * Social-fetcher
 * Retrieves social media metrics from multiple platforms
 */

async function socialFetcher() {
  try {
    const apiKey = process.env.TWITTER_API_KEY;

    const response = await axios.get('https://api.twitter.com/2/users/:id/metrics', {
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
    });

    const data = {
      followers: response.data.public_metrics.followers_count,
      tweets: response.data.public_metrics.tweet_count,
      timestamp: new Date().toISOString()
    };

    return data;
  } catch (error) {
    console.error('Error in socialFetcher:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// If run directly, output JSON
if (require.main === module) {
  socialFetcher().then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(console.error);
}

module.exports = { socialFetcher };
