import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ColorRule {
  id: string;
  operator: '=' | '<' | '>' | '<=' | '>=';
  value: number;
  color: string;
}

export interface DataSource {
  id: string;
  name: string;
  field: string;
  apiUrl: string;
  colorRules: ColorRule[];
}

export interface Polygon {
  id: string;
  name: string;
  coordinates: [number, number][];
  dataSourceId: string;
  currentValue?: number;
  currentColor?: string;
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface TimeRange {
  start: Date;
  end: Date;
}

interface MapState {
  // Timeline state
  currentTime: Date;
  timeRange: TimeRange;
  isRangeMode: boolean;
  
  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  isDrawingMode: boolean;
  
  // Polygons
  polygons: Polygon[];
  selectedPolygonId: string | null;
  
  // Data sources
  dataSources: DataSource[];
  selectedDataSourceId: string;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setCurrentTime: (time: Date) => void;
  setTimeRange: (range: TimeRange) => void;
  setIsRangeMode: (isRange: boolean) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setIsDrawingMode: (isDrawing: boolean) => void;
  addPolygon: (polygon: Omit<Polygon, 'id'>) => void;
  updatePolygon: (id: string, updates: Partial<Polygon>) => void;
  deletePolygon: (id: string) => void;
  setSelectedPolygonId: (id: string | null) => void;
  addDataSource: (dataSource: Omit<DataSource, 'id'>) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  setSelectedDataSourceId: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  resetMapCenter: () => void;
}

const DEFAULT_CENTER: [number, number] = [52.52, 13.41]; // Berlin
const DEFAULT_ZOOM = 10;

// Create initial data source for Open-Meteo
const initialDataSource: DataSource = {
  id: 'open-meteo',
  name: 'Open-Meteo Weather',
  field: 'temperature_2m',
  apiUrl: 'https://archive-api.open-meteo.com/v1/archive',
  colorRules: [
    { id: '1', operator: '<', value: 10, color: '#ff4d4f' }, // Red
    { id: '2', operator: '>=', value: 10, color: '#1890ff' }, // Blue
    { id: '3', operator: '>=', value: 25, color: '#52c41a' }, // Green
  ]
};

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentTime: new Date(),
      timeRange: {
        start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
      isRangeMode: false,
      mapCenter: DEFAULT_CENTER,
      mapZoom: DEFAULT_ZOOM,
      isDrawingMode: false,
      polygons: [],
      selectedPolygonId: null,
      dataSources: [initialDataSource],
      selectedDataSourceId: 'open-meteo',
      isLoading: false,

      // Actions
      setCurrentTime: (time) => set({ currentTime: time }),
      setTimeRange: (range) => set({ timeRange: range }),
      setIsRangeMode: (isRange) => set({ isRangeMode: isRange }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      setIsDrawingMode: (isDrawing) => set({ isDrawingMode: isDrawing }),
      
      addPolygon: (polygon) => {
        const id = `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newPolygon: Polygon = { ...polygon, id };
        set({ polygons: [...get().polygons, newPolygon] });
      },
      
      updatePolygon: (id, updates) => {
        set({
          polygons: get().polygons.map(polygon =>
            polygon.id === id ? { ...polygon, ...updates } : polygon
          )
        });
      },
      
      deletePolygon: (id) => {
        set({
          polygons: get().polygons.filter(polygon => polygon.id !== id),
          selectedPolygonId: get().selectedPolygonId === id ? null : get().selectedPolygonId
        });
      },
      
      setSelectedPolygonId: (id) => set({ selectedPolygonId: id }),
      
      addDataSource: (dataSource) => {
        const id = `datasource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newDataSource: DataSource = { ...dataSource, id };
        set({ dataSources: [...get().dataSources, newDataSource] });
      },
      
      updateDataSource: (id, updates) => {
        set({
          dataSources: get().dataSources.map(ds =>
            ds.id === id ? { ...ds, ...updates } : ds
          )
        });
      },
      
      setSelectedDataSourceId: (id) => set({ selectedDataSourceId: id }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      resetMapCenter: () => set({ mapCenter: DEFAULT_CENTER, mapZoom: DEFAULT_ZOOM }),
    }),
    {
      name: 'map-store',
    }
  )
);