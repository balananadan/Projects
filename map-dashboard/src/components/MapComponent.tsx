'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLng, Polygon as LeafletPolygon } from 'leaflet';
import { Button, message, Modal, Select } from 'antd';
import { 
  DeleteOutlined, 
  PlusOutlined, 
  HomeOutlined,
  StopOutlined 
} from '@ant-design/icons';
import { useMapStore } from '@/store/mapStore';
import type { Polygon } from '@/store/mapStore';

// Fix for default markers in Leaflet with Next.js
import 'leaflet/dist/leaflet.css';

// Import marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

interface MapEventsProps {
  onMapClick: (latlng: LatLng) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onMapClick }) => {
  const {
    setMapCenter,
    setMapZoom,
  } = useMapStore();

  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
    moveend: () => {
      const center = map.getCenter();
      setMapCenter([center.lat, center.lng]);
    },
    zoomend: () => {
      setMapZoom(map.getZoom());
    },
  });

  return null;
};

interface PolygonLayerProps {
  polygons: Polygon[];
  onPolygonClick: (polygon: Polygon) => void;
  onPolygonEdit: () => void;
}

const PolygonLayer: React.FC<PolygonLayerProps> = ({ 
  polygons, 
  onPolygonClick, 
  onPolygonEdit 
}) => {
  const map = useMap();
  const polygonRefs = useRef<Map<string, LeafletPolygon>>(new Map());

  useEffect(() => {
    // Clear existing polygons
    polygonRefs.current.forEach((polygon) => {
      map.removeLayer(polygon);
    });
    polygonRefs.current.clear();

    // Add current polygons
    polygons.forEach((polygon) => {
      const leafletPolygon = L.polygon(
        polygon.coordinates,
        {
          color: polygon.currentColor || '#3388ff',
          fillColor: polygon.currentColor || '#3388ff',
          fillOpacity: 0.3,
          weight: 2,
        }
      ).addTo(map);

      // Add popup with polygon info
      leafletPolygon.bindPopup(`
        <div>
          <strong>${polygon.name}</strong><br/>
          Points: ${polygon.coordinates.length}<br/>
          ${polygon.currentValue !== undefined ? `Value: ${polygon.currentValue}°C` : ''}
        </div>
      `);

      // Add click event
      leafletPolygon.on('click', () => {
        onPolygonClick(polygon);
      });

      // Add double-click event for editing
      leafletPolygon.on('dblclick', () => {
        onPolygonEdit();
      });

      polygonRefs.current.set(polygon.id, leafletPolygon);
    });

    return () => {
      // Cleanup on unmount
      polygonRefs.current.forEach((polygon) => {
        map.removeLayer(polygon);
      });
    };
  }, [polygons, map, onPolygonClick, onPolygonEdit]);

  return null;
};

const MapComponent: React.FC = () => {
  const {
    mapCenter,
    mapZoom,
    isDrawingMode,
    polygons,
    dataSources,
    selectedDataSourceId,
    setIsDrawingMode,
    addPolygon,
    deletePolygon,
    setSelectedPolygonId,
    resetMapCenter,
  } = useMapStore();

  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<LatLng[] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Calculate bounding box from coordinates
  const calculateBoundingBox = useCallback((coordinates: [number, number][]) => {
    const lats = coordinates.map(coord => coord[0]);
    const lngs = coordinates.map(coord => coord[1]);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, []);

  // Create polygon with selected data source
  const createPolygon = useCallback((coordinates: [number, number][], dataSourceId: string) => {
    const boundingBox = calculateBoundingBox(coordinates);
    const polygonName = `Polygon ${polygons.length + 1}`;

    const newPolygon: Omit<Polygon, 'id'> = {
      name: polygonName,
      coordinates,
      dataSourceId,
      boundingBox,
    };

    addPolygon(newPolygon);
    message.success(`Polygon "${polygonName}" created successfully!`);
  }, [polygons.length, addPolygon, calculateBoundingBox]);

  // Finish drawing polygon
  const finishDrawing = useCallback((points: LatLng[]) => {
    if (points.length < 3) {
      message.error('Polygon must have at least 3 points');
      return;
    }

    const coordinates: [number, number][] = points.map(point => [point.lat, point.lng]);
    
    if (dataSources.length > 1) {
      setPendingPolygon(points);
      setShowDataSourceModal(true);
    } else {
      // Auto-select the only available data source
      createPolygon(coordinates, selectedDataSourceId);
    }

    setDrawingPoints([]);
    setIsDrawingMode(false);
  }, [dataSources.length, selectedDataSourceId, createPolygon, setIsDrawingMode]);

  // Handle map click for drawing
  const handleMapClick = useCallback((latlng: LatLng) => {
    if (!isDrawingMode) return;

    const newPoints = [...drawingPoints, latlng];
    setDrawingPoints(newPoints);

    // Check if we've reached the maximum points
    if (newPoints.length >= 12) {
      message.warning('Maximum 12 points reached. Finishing polygon.');
      finishDrawing(newPoints);
    }
  }, [isDrawingMode, drawingPoints, finishDrawing]);

  // Handle data source selection for new polygon
  const handleDataSourceSelect = useCallback((dataSourceId: string) => {
    if (pendingPolygon) {
      const coordinates: [number, number][] = pendingPolygon.map(point => [point.lat, point.lng]);
      createPolygon(coordinates, dataSourceId);
      setPendingPolygon(null);
    }
    setShowDataSourceModal(false);
  }, [pendingPolygon, createPolygon]);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    setDrawingPoints([]);
    setIsDrawingMode(true);
    message.info('Click on the map to add polygon points. Minimum 3 points, maximum 12 points.');
  }, [setIsDrawingMode]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    setDrawingPoints([]);
    setIsDrawingMode(false);
    message.info('Drawing cancelled');
  }, [setIsDrawingMode]);

  // Handle polygon click
  const handlePolygonClick = useCallback((polygon: Polygon) => {
    setSelectedPolygonId(polygon.id);
  }, [setSelectedPolygonId]);

  // Handle polygon edit (bonus feature)
  const handlePolygonEdit = useCallback(() => {
    message.info('Polygon editing is a bonus feature - not implemented in this version');
  }, []);

  // Handle polygon delete
  const handlePolygonDelete = useCallback((polygonId: string) => {
    Modal.confirm({
      title: 'Delete Polygon',
      content: 'Are you sure you want to delete this polygon?',
      onOk: () => {
        deletePolygon(polygonId);
        message.success('Polygon deleted successfully');
      },
    });
  }, [deletePolygon]);

  return (
    <div className="relative h-full">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
          <Button
            type={isDrawingMode ? "primary" : "default"}
            icon={<PlusOutlined />}
            onClick={startDrawing}
            disabled={isDrawingMode}
            size="small"
            block
          >
            Draw Polygon
          </Button>
          
          {isDrawingMode && (
            <>
              <Button
                icon={<StopOutlined />}
                onClick={() => finishDrawing(drawingPoints)}
                disabled={drawingPoints.length < 3}
                size="small"
                block
              >
                Finish ({drawingPoints.length} points)
              </Button>
              
              <Button
                danger
                onClick={cancelDrawing}
                size="small"
                block
              >
                Cancel
              </Button>
            </>
          )}
          
          <Button
            icon={<HomeOutlined />}
            onClick={resetMapCenter}
            size="small"
            block
          >
            Reset View
          </Button>
        </div>

        {/* Drawing status */}
        {isDrawingMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="font-medium text-blue-800 mb-1">Drawing Mode Active</div>
            <div className="text-blue-600">
              Points: {drawingPoints.length}/12<br/>
              {drawingPoints.length < 3 && 'Need at least 3 points'}
              {drawingPoints.length >= 3 && 'Click "Finish" or continue adding points'}
            </div>
          </div>
        )}
      </div>

      {/* Polygon List */}
      {polygons.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h3 className="font-medium text-gray-800 mb-2">Polygons ({polygons.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {polygons.map((polygon) => (
                <div
                  key={polygon.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                  style={{ borderColor: polygon.currentColor || '#d1d5db' }}
                >
                  <div>
                    <div className="font-medium">{polygon.name}</div>
                    <div className="text-xs text-gray-500">
                      {polygon.coordinates.length} points
                      {polygon.currentValue !== undefined && (
                        <span> • {polygon.currentValue}°C</span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handlePolygonDelete(polygon.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={handleMapClick} />
        
        <PolygonLayer
          polygons={polygons}
          onPolygonClick={handlePolygonClick}
          onPolygonEdit={handlePolygonEdit}
        />
      </MapContainer>

      {/* Drawing points overlay */}
      {isDrawingMode && drawingPoints.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-[999]">
          {/* This would show temporary drawing lines - simplified for now */}
        </div>
      )}

      {/* Data Source Selection Modal */}
      <Modal
        title="Select Data Source for Polygon"
        open={showDataSourceModal}
        onCancel={() => {
          setShowDataSourceModal(false);
          setPendingPolygon(null);
        }}
        footer={null}
      >
        <div className="space-y-4">
          <p>Choose a data source for this polygon:</p>
          
          <Select
            style={{ width: '100%' }}
            placeholder="Select a data source"
            onChange={handleDataSourceSelect}
            options={dataSources.map(ds => ({
              label: ds.name,
              value: ds.id,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MapComponent;