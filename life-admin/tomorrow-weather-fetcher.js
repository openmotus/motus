#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config({ path: '/Users/ianwinscom/slashmotus/.env' });

async function getTomorrowWeather() {
  try {
    const API_KEY = process.env.WEATHER_API_KEY;
    const API_URL = process.env.WEATHER_API_URL || 'http://api.weatherapi.com/v1';
    const location = process.env.WEATHER_LOCATION || 'Chiang Mai,TH';
    
    if (!API_KEY) {
      console.error('Error: WEATHER_API_KEY not found in environment variables');
      return;
    }
    
    const response = await axios.get(`${API_URL}/forecast.json`, {
      params: {
        key: API_KEY,
        q: location,
        days: 2,
        aqi: 'no'
      }
    });
    
    const tomorrow = response.data.forecast.forecastday[1];
    
    const result = {
      date: tomorrow.date,
      maxTemp: tomorrow.day.maxtemp_c,
      minTemp: tomorrow.day.mintemp_c,
      avgTemp: tomorrow.day.avgtemp_c,
      condition: tomorrow.day.condition.text,
      chanceOfRain: tomorrow.day.daily_chance_of_rain,
      sunrise: tomorrow.astro.sunrise,
      sunset: tomorrow.astro.sunset,
      humidity: tomorrow.day.avghumidity,
      wind: tomorrow.day.maxwind_kph
    };
    
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching tomorrow\'s weather:', error.message);
    process.exit(1);
  }
}

getTomorrowWeather();