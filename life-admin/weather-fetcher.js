#!/usr/bin/env node

/**
 * Weather Fetcher - Standalone weather data fetcher using WeatherAPI
 * Returns formatted weather data for use by agents
 */

require('dotenv').config();
const axios = require('axios');

async function fetchWeather() {
  try {
    const response = await axios.get(`${process.env.WEATHER_API_URL}/current.json`, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: process.env.WEATHER_LOCATION || 'Chiang Mai,TH'
      }
    });

    const weather = {
      temp: `${response.data.current.temp_c}°C`,
      condition: response.data.current.condition.text,
      feelsLike: `${response.data.current.feelslike_c}°C`,
      humidity: `${response.data.current.humidity}%`,
      wind: `${response.data.current.wind_kph} kph`,
      uv: response.data.current.uv,
      location: response.data.location.name,
      country: response.data.location.country,
      localTime: response.data.location.localtime
    };

    // Also fetch forecast
    const forecastResponse = await axios.get(`${process.env.WEATHER_API_URL}/forecast.json`, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: process.env.WEATHER_LOCATION || 'Chiang Mai,TH',
        days: 3
      }
    });

    weather.forecast = forecastResponse.data.forecast.forecastday.map(day => ({
      date: day.date,
      maxTemp: `${day.day.maxtemp_c}°C`,
      minTemp: `${day.day.mintemp_c}°C`,
      condition: day.day.condition.text,
      chanceOfRain: `${day.day.daily_chance_of_rain}%`
    }));

    return weather;
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return {
      temp: 'N/A',
      condition: 'Unable to fetch weather',
      feelsLike: 'N/A',
      humidity: 'N/A',
      error: error.message
    };
  }
}

// If run directly, output JSON
if (require.main === module) {
  fetchWeather().then(weather => {
    console.log(JSON.stringify(weather, null, 2));
  }).catch(console.error);
}

module.exports = { fetchWeather };