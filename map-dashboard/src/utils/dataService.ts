import WeatherAPI from './api';
import type { Polygon, ColorRule, DataSource } from '@/store/mapStore';

export interface PolygonDataUpdate {
  polygonId: string;
  value: number;
  color: string;
}

export class DataService {
  /**
   * Calculate the centroid of a polygon
   */
  static calculateCentroid(coordinates: [number, number][]): [number, number] {
    const totalCoords = coordinates.length;
    const sumLat = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const sumLng = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    
    return [sumLat / totalCoords, sumLng / totalCoords];
  }

  /**
   * Apply color rules to determine polygon color based on value
   */
  static applyColorRules(value: number, colorRules: ColorRule[]): string {
    // Sort rules by priority (you might want to implement a priority system)
    // For now, we'll apply rules in order and return the first match
    
    for (const rule of colorRules) {
      let matches = false;
      
      switch (rule.operator) {
        case '=':
          matches = Math.abs(value - rule.value) < 0.1; // Allow small tolerance for float comparison
          break;
        case '<':
          matches = value < rule.value;
          break;
        case '>':
          matches = value > rule.value;
          break;
        case '<=':
          matches = value <= rule.value;
          break;
        case '>=':
          matches = value >= rule.value;
          break;
      }
      
      if (matches) {
        return rule.color;
      }
    }
    
    // Default color if no rules match
    return '#8c8c8c'; // Gray
  }

  /**
   * Fetch data for a single polygon at a specific time
   */
  static async fetchPolygonDataAtTime(
    polygon: Polygon,
    dataSource: DataSource,
    time: Date
  ): Promise<PolygonDataUpdate> {
    try {
      // Calculate centroid for data fetching
      const [lat, lng] = this.calculateCentroid(polygon.coordinates);
      
      // Fetch temperature data
      const temperature = await WeatherAPI.getTemperatureAtTime(lat, lng, time);
      
      // Apply color rules
      const color = this.applyColorRules(temperature, dataSource.colorRules);
      
      return {
        polygonId: polygon.id,
        value: temperature,
        color,
      };
    } catch (error) {
      console.error(`Error fetching data for polygon ${polygon.id}:`, error);
      
      // Return default values on error
      return {
        polygonId: polygon.id,
        value: 0,
        color: '#ff4d4f', // Red to indicate error
      };
    }
  }

  /**
   * Fetch data for a single polygon over a time range (averaging values)
   */
  static async fetchPolygonDataForTimeRange(
    polygon: Polygon,
    dataSource: DataSource,
    startTime: Date,
    endTime: Date
  ): Promise<PolygonDataUpdate> {
    try {
      // Calculate centroid for data fetching
      const [lat, lng] = this.calculateCentroid(polygon.coordinates);
      
      // Fetch temperature data for the time range
      const avgTemperature = await WeatherAPI.getTemperatureForTimeRange(lat, lng, startTime, endTime);
      
      // Apply color rules
      const color = this.applyColorRules(avgTemperature, dataSource.colorRules);
      
      return {
        polygonId: polygon.id,
        value: avgTemperature,
        color,
      };
    } catch (error) {
      console.error(`Error fetching data for polygon ${polygon.id}:`, error);
      
      // Return default values on error
      return {
        polygonId: polygon.id,
        value: 0,
        color: '#ff4d4f', // Red to indicate error
      };
    }
  }

  /**
   * Fetch data for multiple polygons
   */
  static async fetchMultiplePolygonData(
    polygons: Polygon[],
    dataSources: DataSource[],
    time?: Date,
    timeRange?: { start: Date; end: Date }
  ): Promise<PolygonDataUpdate[]> {
    const updates: PolygonDataUpdate[] = [];
    
    // Process each polygon
    for (const polygon of polygons) {
      const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
      
      if (!dataSource) {
        console.warn(`Data source not found for polygon ${polygon.id}`);
        continue;
      }
      
      try {
        let update: PolygonDataUpdate;
        
        if (timeRange) {
          update = await this.fetchPolygonDataForTimeRange(
            polygon,
            dataSource,
            timeRange.start,
            timeRange.end
          );
        } else if (time) {
          update = await this.fetchPolygonDataAtTime(polygon, dataSource, time);
        } else {
          throw new Error('Either time or timeRange must be provided');
        }
        
        updates.push(update);
      } catch (error) {
        console.error(`Error processing polygon ${polygon.id}:`, error);
        // Add error state for this polygon
        updates.push({
          polygonId: polygon.id,
          value: 0,
          color: '#ff4d4f',
        });
      }
    }
    
    return updates;
  }

  /**
   * Batch update polygons with rate limiting
   */
  static async batchUpdatePolygons(
    polygons: Polygon[],
    dataSources: DataSource[],
    time?: Date,
    timeRange?: { start: Date; end: Date },
    onProgress?: (completed: number, total: number) => void
  ): Promise<PolygonDataUpdate[]> {
    const batchSize = 5; // Process 5 polygons at a time to avoid overwhelming the API
    const updates: PolygonDataUpdate[] = [];
    
    for (let i = 0; i < polygons.length; i += batchSize) {
      const batch = polygons.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (polygon) => {
        const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
        
        if (!dataSource) {
          return {
            polygonId: polygon.id,
            value: 0,
            color: '#8c8c8c',
          };
        }
        
        try {
          if (timeRange) {
            return await this.fetchPolygonDataForTimeRange(
              polygon,
              dataSource,
              timeRange.start,
              timeRange.end
            );
          } else if (time) {
            return await this.fetchPolygonDataAtTime(polygon, dataSource, time);
          } else {
            throw new Error('Either time or timeRange must be provided');
          }
        } catch (error) {
          console.error(`Error in batch update for polygon ${polygon.id}:`, error);
          return {
            polygonId: polygon.id,
            value: 0,
            color: '#ff4d4f',
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      updates.push(...batchResults);
      
      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, polygons.length), polygons.length);
      }
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < polygons.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return updates;
  }

  /**
   * Validate if a polygon can fetch data (has valid coordinates and data source)
   */
  static validatePolygonForDataFetch(polygon: Polygon, dataSources: DataSource[]): boolean {
    // Check if polygon has valid coordinates
    if (!polygon.coordinates || polygon.coordinates.length < 3) {
      return false;
    }
    
    // Check if data source exists
    const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
    if (!dataSource) {
      return false;
    }
    
    // Check if coordinates are within valid range
    for (const coord of polygon.coordinates) {
      const [lat, lng] = coord;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get readable error message for common API errors
   */
  static getErrorMessage(error: Error | unknown): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Failed to fetch weather data')) {
      return 'Unable to fetch weather data. Please check your internet connection.';
    }
    
    if (errorMessage.includes('No data available')) {
      return 'No weather data available for the selected time period.';
    }
    
    return 'An unexpected error occurred while fetching data.';
  }
}

export default DataService;