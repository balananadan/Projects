import axios from 'axios';

export interface WeatherData {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

export interface WeatherDataPoint {
  time: string;
  temperature_2m: number;
}

export class WeatherAPI {
  private static cache = new Map<string, WeatherData>();

  static async fetchWeatherData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<WeatherData> {
    const cacheKey = `${latitude}-${longitude}-${startDate}-${endDate}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
          latitude: latitude.toFixed(2),
          longitude: longitude.toFixed(2),
          start_date: startDate,
          end_date: endDate,
          hourly: 'temperature_2m',
          timezone: 'UTC'
        }
      });

      const data: WeatherData = response.data;
      
      // Cache the result
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  static async getTemperatureForTimeRange(
    latitude: number,
    longitude: number,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    const startDate = startTime.toISOString().split('T')[0];
    const endDate = endTime.toISOString().split('T')[0];

    try {
      const data = await this.fetchWeatherData(latitude, longitude, startDate, endDate);
      
      // Filter data for the specific time range
      const filteredData: WeatherDataPoint[] = [];
      
      for (let i = 0; i < data.hourly.time.length; i++) {
        const timeStr = data.hourly.time[i];
        const time = new Date(timeStr);
        
        if (time >= startTime && time <= endTime) {
          filteredData.push({
            time: timeStr,
            temperature_2m: data.hourly.temperature_2m[i]
          });
        }
      }

      if (filteredData.length === 0) {
        throw new Error('No data available for the specified time range');
      }

      // Calculate average temperature
      const avgTemperature = filteredData.reduce((sum, point) => sum + point.temperature_2m, 0) / filteredData.length;
      
      return Math.round(avgTemperature * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error getting temperature for time range:', error);
      throw error;
    }
  }

  static async getTemperatureAtTime(
    latitude: number,
    longitude: number,
    time: Date
  ): Promise<number> {
    const date = time.toISOString().split('T')[0];
    
    try {
      const data = await this.fetchWeatherData(latitude, longitude, date, date);
      
      // Find the closest hour
      const targetHour = time.getUTCHours();
      const targetTimeStr = `${date}T${targetHour.toString().padStart(2, '0')}:00`;
      
      const index = data.hourly.time.findIndex(t => t === targetTimeStr);
      
      if (index === -1) {
        throw new Error('No data available for the specified time');
      }

      return Math.round(data.hourly.temperature_2m[index] * 10) / 10;
    } catch (error) {
      console.error('Error getting temperature at time:', error);
      throw error;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export default WeatherAPI;