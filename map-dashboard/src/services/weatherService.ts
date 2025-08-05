import axios from 'axios';
import { format } from 'date-fns';

export interface WeatherDataPoint {
  time: string;
  temperature_2m: number;
  relative_humidity_2m?: number;
  precipitation?: number;
  wind_speed_10m?: number;
}

export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m?: string;
    precipitation?: string;
    wind_speed_10m?: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    wind_speed_10m?: number[];
  };
}

class WeatherService {
  private cache = new Map<string, { data: WeatherDataPoint[]; timestamp: number }>();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Calculate the centroid of a polygon
   */
  private calculatePolygonCentroid(coordinates: [number, number][]): [number, number] {
    if (coordinates.length === 0) return [0, 0];
    
    let latSum = 0;
    let lngSum = 0;
    
    coordinates.forEach(([lat, lng]) => {
      latSum += lat;
      lngSum += lng;
    });
    
    return [latSum / coordinates.length, lngSum / coordinates.length];
  }

  /**
   * Calculate bounding box of a polygon
   */
  private calculateBoundingBox(coordinates: [number, number][]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = coordinates[0][0];
    let south = coordinates[0][0];
    let east = coordinates[0][1];
    let west = coordinates[0][1];

    coordinates.forEach(([lat, lng]) => {
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    });

    return { north, south, east, west };
  }

  /**
   * Create cache key for API request
   */
  private createCacheKey(lat: number, lng: number, startDate: Date, endDate: Date, fields: string[]): string {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    return `${lat.toFixed(2)},${lng.toFixed(2)},${start},${end},${fields.join(',')}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheExpiryMs;
  }

  /**
   * Fetch weather data from Open-Meteo API
   */
  async fetchWeatherData(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date,
    fields: string[] = ['temperature_2m']
  ): Promise<WeatherDataPoint[]> {
    const cacheKey = this.createCacheKey(latitude, longitude, startDate, endDate, fields);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('Returning cached weather data');
      return cached.data;
    }

    try {
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');
      
      const url = 'https://archive-api.open-meteo.com/v1/archive';
      const params = {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        start_date: start,
        end_date: end,
        hourly: fields.join(','),
        timezone: 'UTC',
      };

      console.log('Fetching weather data:', { url, params });

      const response = await axios.get<WeatherApiResponse>(url, { params });
      const data = response.data;

      // Transform the response into our format
      const weatherData: WeatherDataPoint[] = data.hourly.time.map((time, index) => ({
        time,
        temperature_2m: data.hourly.temperature_2m[index],
        relative_humidity_2m: data.hourly.relative_humidity_2m?.[index],
        precipitation: data.hourly.precipitation?.[index],
        wind_speed_10m: data.hourly.wind_speed_10m?.[index],
      }));

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      });

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.warn('Using expired cached data due to API error');
        return cached.data;
      }
      
      // Return mock data as fallback
      console.warn('Using mock data due to API error');
      return this.generateMockData(startDate, endDate);
    }
  }

  /**
   * Fetch weather data for a polygon (using centroid)
   */
  async fetchPolygonWeatherData(
    coordinates: [number, number][],
    startDate: Date,
    endDate: Date,
    fields: string[] = ['temperature_2m']
  ): Promise<WeatherDataPoint[]> {
    const [lat, lng] = this.calculatePolygonCentroid(coordinates);
    return this.fetchWeatherData(lat, lng, startDate, endDate, fields);
  }

  /**
   * Calculate average value for a time range
   */
  calculateAverageValue(
    data: WeatherDataPoint[],
    startTime: Date,
    endTime: Date,
    field: keyof WeatherDataPoint = 'temperature_2m'
  ): number {
    const filteredData = data.filter(point => {
      const pointTime = new Date(point.time);
      return pointTime >= startTime && pointTime <= endTime;
    });

    if (filteredData.length === 0) return 0;

    const sum = filteredData.reduce((acc, point) => {
      const value = point[field];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);

    return sum / filteredData.length;
  }

  /**
   * Get value for a specific time
   */
  getValueAtTime(
    data: WeatherDataPoint[],
    targetTime: Date,
    field: keyof WeatherDataPoint = 'temperature_2m'
  ): number {
    const targetTimeStr = format(targetTime, "yyyy-MM-dd'T'HH:00");
    
    const point = data.find(p => p.time.startsWith(targetTimeStr.substring(0, 13)));
    
    if (point) {
      const value = point[field];
      return typeof value === 'number' ? value : 0;
    }

    // If exact time not found, find closest
    const targetMs = targetTime.getTime();
    let closest = data[0];
    let closestDiff = Math.abs(new Date(data[0].time).getTime() - targetMs);

    data.forEach(point => {
      const diff = Math.abs(new Date(point.time).getTime() - targetMs);
      if (diff < closestDiff) {
        closest = point;
        closestDiff = diff;
      }
    });

    const value = closest[field];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Generate mock data for testing/fallback
   */
  private generateMockData(startDate: Date, endDate: Date): WeatherDataPoint[] {
    const data: WeatherDataPoint[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      data.push({
        time: current.toISOString(),
        temperature_2m: Math.random() * 30 - 5, // Random temp between -5 and 25°C
        relative_humidity_2m: Math.random() * 100,
        precipitation: Math.random() * 10,
        wind_speed_10m: Math.random() * 20,
      });
      
      current.setHours(current.getHours() + 1);
    }
    
    return data;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const weatherService = new WeatherService();