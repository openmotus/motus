#!/usr/bin/env node

/**
 * Weather Fetcher — retrieves current weather from WeatherAPI
 *
 * Environment variables:
 *   WEATHER_API_KEY  — your WeatherAPI key (free at https://weatherapi.com)
 *   WEATHER_LOCATION — city name or lat,long (default: "Austin")
 */

const https = require('https');

const API_KEY = process.env.WEATHER_API_KEY;
const LOCATION = process.env.WEATHER_LOCATION || 'Austin';

if (!API_KEY) {
  console.error(JSON.stringify({
    error: 'WEATHER_API_KEY not set. Get a free key at https://weatherapi.com'
  }));
  process.exit(1);
}

const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(LOCATION)}&days=1`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (json.error) {
        console.error(JSON.stringify({ error: json.error.message }));
        process.exit(1);
      }

      const result = {
        location: json.location.name,
        temp_f: json.current.temp_f,
        temp_c: json.current.temp_c,
        condition: json.current.condition.text,
        humidity: json.current.humidity,
        high_f: json.forecast.forecastday[0].day.maxtemp_f,
        low_f: json.forecast.forecastday[0].day.mintemp_f,
        rain_chance: json.forecast.forecastday[0].day.daily_chance_of_rain
      };

      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(JSON.stringify({ error: `Failed to parse response: ${e.message}` }));
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error(JSON.stringify({ error: `Request failed: ${e.message}` }));
  process.exit(1);
});
