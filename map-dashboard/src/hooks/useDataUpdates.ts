import { useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { useMapStore } from '@/store/mapStore';
import DataService, { PolygonDataUpdate } from '@/utils/dataService';

export const useDataUpdates = () => {
  const {
    polygons,
    dataSources,
    currentTime,
    timeRange,
    isRangeMode,
    isLoading,
    setIsLoading,
    updatePolygon,
  } = useMapStore();

  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastUpdateRef = useRef<string>('');

  // Create a unique key for the current state to prevent unnecessary updates
  const getStateKey = useCallback(() => {
    const timeKey = isRangeMode 
      ? `${timeRange.start.getTime()}-${timeRange.end.getTime()}`
      : currentTime.getTime().toString();
    
    const polygonKeys = polygons.map(p => `${p.id}-${p.dataSourceId}`).sort().join(',');
    
    return `${timeKey}-${polygonKeys}-${isRangeMode}`;
  }, [polygons, currentTime, timeRange, isRangeMode]);

  // Update polygon data
  const updatePolygonData = useCallback(async (force = false) => {
    const stateKey = getStateKey();
    
    // Skip if this is the same state as last update (unless forced)
    if (!force && lastUpdateRef.current === stateKey) {
      return;
    }

    // Skip if no polygons
    if (polygons.length === 0) {
      lastUpdateRef.current = stateKey;
      return;
    }

    // Validate polygons
    const validPolygons = polygons.filter(polygon => 
      DataService.validatePolygonForDataFetch(polygon, dataSources)
    );

    if (validPolygons.length === 0) {
      console.warn('No valid polygons found for data fetching');
      lastUpdateRef.current = stateKey;
      return;
    }

    setIsLoading(true);

    try {
      let updates: PolygonDataUpdate[];

      if (isRangeMode) {
        // Fetch data for time range
        updates = await DataService.batchUpdatePolygons(
          validPolygons,
          dataSources,
          undefined,
          { start: timeRange.start, end: timeRange.end },
          (completed, total) => {
            // Could show progress here if needed
            console.log(`Progress: ${completed}/${total} polygons updated`);
          }
        );
      } else {
        // Fetch data for single time point
        updates = await DataService.batchUpdatePolygons(
          validPolygons,
          dataSources,
          currentTime,
          undefined,
          (completed, total) => {
            console.log(`Progress: ${completed}/${total} polygons updated`);
          }
        );
      }

      // Apply updates to store
      updates.forEach(update => {
        updatePolygon(update.polygonId, {
          currentValue: update.value,
          currentColor: update.color,
        });
      });

      lastUpdateRef.current = stateKey;

      // Show success message for manual updates
      if (force) {
        message.success(`Updated ${updates.length} polygon(s) with latest data`);
      }

    } catch (error) {
      console.error('Error updating polygon data:', error);
      
      const errorMessage = DataService.getErrorMessage(error);
      message.error(errorMessage);
      
      // Set error state for all polygons
      validPolygons.forEach(polygon => {
        updatePolygon(polygon.id, {
          currentValue: undefined,
          currentColor: '#ff4d4f', // Red for error
        });
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    polygons,
    dataSources,
    currentTime,
    timeRange,
    isRangeMode,
    setIsLoading,
    updatePolygon,
    getStateKey,
  ]);

  // Debounced update function
  const debouncedUpdate = useCallback((force = false) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updatePolygonData(force);
    }, force ? 0 : 500); // Immediate for forced updates, 500ms debounce for automatic
  }, [updatePolygonData]);

  // Effect to trigger updates when dependencies change
  useEffect(() => {
    debouncedUpdate(false);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debouncedUpdate]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    debouncedUpdate(true);
  }, [debouncedUpdate]);

  // Function to update a single polygon
  const updateSinglePolygon = useCallback(async (polygonId: string) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId);
    if (!dataSource) return;

    if (!DataService.validatePolygonForDataFetch(polygon, dataSources)) {
      message.error('Invalid polygon data for fetching');
      return;
    }

    setIsLoading(true);

    try {
      let update: PolygonDataUpdate;

      if (isRangeMode) {
        update = await DataService.fetchPolygonDataForTimeRange(
          polygon,
          dataSource,
          timeRange.start,
          timeRange.end
        );
      } else {
        update = await DataService.fetchPolygonDataAtTime(
          polygon,
          dataSource,
          currentTime
        );
      }

      updatePolygon(update.polygonId, {
        currentValue: update.value,
        currentColor: update.color,
      });

      message.success(`Updated polygon "${polygon.name}"`);

    } catch (error) {
      console.error(`Error updating polygon ${polygonId}:`, error);
      const errorMessage = DataService.getErrorMessage(error);
      message.error(errorMessage);
      
      updatePolygon(polygonId, {
        currentValue: undefined,
        currentColor: '#ff4d4f',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    polygons,
    dataSources,
    currentTime,
    timeRange,
    isRangeMode,
    setIsLoading,
    updatePolygon,
  ]);

  return {
    refreshData,
    updateSinglePolygon,
    isLoading,
  };
};