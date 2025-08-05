'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Switch, Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { format, subDays, addDays, addHours, startOfDay } from 'date-fns';
import { useMapStore } from '@/store/useMapStore';

const TimelineSlider: React.FC = () => {
  const { timeRange, setTimeRange } = useMapStore();
  const [sliderMode, setSliderMode] = useState<'single' | 'range'>('single');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Create timeline: 15 days before and after today (30 days total, 720 hours)
  const today = new Date();
  const startDate = startOfDay(subDays(today, 15));
  const endDate = startOfDay(addDays(today, 15));
  const totalHours = 24 * 30; // 720 hours
  
  // Convert date to hour index
  const dateToHourIndex = useCallback((date: Date): number => {
    const diffMs = date.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }, [startDate]);
  
  // Convert hour index to date
  const hourIndexToDate = useCallback((index: number): Date => {
    return addHours(startDate, index);
  }, [startDate]);
  
  // Current slider values
  const [sliderValue, setSliderValue] = useState<number | [number, number]>(() => {
    if (sliderMode === 'single') {
      return dateToHourIndex(timeRange.start);
    } else {
      return [dateToHourIndex(timeRange.start), dateToHourIndex(timeRange.end)];
    }
  });
  
  // Update slider when timeRange changes
  useEffect(() => {
    if (sliderMode === 'single') {
      setSliderValue(dateToHourIndex(timeRange.start));
    } else {
      setSliderValue([dateToHourIndex(timeRange.start), dateToHourIndex(timeRange.end)]);
    }
  }, [timeRange, sliderMode, dateToHourIndex]);
  
  // Handle slider change
  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setSliderValue(value as [number, number]);
    } else {
      setSliderValue(value);
    }
    
    if (sliderMode === 'single' && typeof value === 'number') {
      const newDate = hourIndexToDate(value);
      setTimeRange({
        start: newDate,
        end: newDate,
        mode: 'single',
      });
    } else if (sliderMode === 'range' && Array.isArray(value)) {
      setTimeRange({
        start: hourIndexToDate(value[0]),
        end: hourIndexToDate(value[1]),
        mode: 'range',
      });
    }
  };
  
  // Toggle between single and range mode
  const handleModeChange = (checked: boolean) => {
    const newMode = checked ? 'range' : 'single';
    setSliderMode(newMode);
    
    if (newMode === 'single') {
      const currentHour = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
      setSliderValue(currentHour);
      const newDate = hourIndexToDate(currentHour);
      setTimeRange({
        start: newDate,
        end: newDate,
        mode: 'single',
      });
    } else {
      const currentHour = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
      const endHour = Math.min(currentHour + 24, totalHours - 1); // Default 24-hour range
      setSliderValue([currentHour, endHour]);
      setTimeRange({
        start: hourIndexToDate(currentHour),
        end: hourIndexToDate(endHour),
        mode: 'range',
      });
    }
  };
  
  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setSliderValue((prev) => {
          if (sliderMode === 'single' && typeof prev === 'number') {
            const next = (prev + 1) % totalHours;
            const newDate = hourIndexToDate(next);
            setTimeRange({
              start: newDate,
              end: newDate,
              mode: 'single',
            });
            return next;
          } else if (sliderMode === 'range' && Array.isArray(prev)) {
            const range = prev[1] - prev[0];
            const nextStart = (prev[0] + 1) % (totalHours - range);
            const nextEnd = nextStart + range;
            setTimeRange({
              start: hourIndexToDate(nextStart),
              end: hourIndexToDate(nextEnd),
              mode: 'range',
            });
            return [nextStart, nextEnd];
          }
          return prev;
        });
      }, 500); // Update every 500ms
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sliderMode, totalHours, setTimeRange, hourIndexToDate]);
  
  // Generate marks for the slider (show every 24 hours)
  const marks: Record<number, { label: string; style: React.CSSProperties }> = {};
  for (let i = 0; i < totalHours; i += 24) {
    const date = hourIndexToDate(i);
    marks[i] = {
      label: format(date, 'MM/dd'),
      style: { fontSize: '12px' },
    };
  }
  
  // Format current time display
  const formatTimeDisplay = () => {
    if (sliderMode === 'single') {
      return format(timeRange.start, 'MMM dd, yyyy HH:mm');
    } else {
      return `${format(timeRange.start, 'MMM dd, HH:mm')} - ${format(timeRange.end, 'MMM dd, HH:mm')}`;
    }
  };
  
  return (
    <Card className="mb-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Timeline Control</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Single</span>
              <Switch
                checked={sliderMode === 'range'}
                onChange={handleModeChange}
                size="small"
              />
              <span className="text-sm">Range</span>
            </div>
            <Button
              type="text"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause animation' : 'Play animation'}
            />
          </div>
        </div>
        
        {/* Current time display */}
        <div className="text-center">
          <div className="text-lg font-mono bg-gray-100 px-4 py-2 rounded">
            {formatTimeDisplay()}
          </div>
        </div>
        
        {/* Slider */}
        <div className="px-4 py-8">
          <Slider
            range={sliderMode === 'range'}
            min={0}
            max={totalHours - 1}
            value={sliderValue}
            onChange={handleSliderChange}
            marks={marks}
            step={1}
            trackStyle={sliderMode === 'range' ? { backgroundColor: '#1890ff' } : undefined}
            handleStyle={{
              borderColor: '#1890ff',
              backgroundColor: '#1890ff',
              boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
            }}
            railStyle={{ backgroundColor: '#f0f0f0' }}
            dotStyle={{ borderColor: '#d9d9d9' }}
            activeDotStyle={{ borderColor: '#1890ff' }}
          />
        </div>
        
        {/* Timeline info */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{format(startDate, 'MMM dd, yyyy')}</span>
          <span>Resolution: 1 hour</span>
          <span>{format(endDate, 'MMM dd, yyyy')}</span>
        </div>
      </div>
    </Card>
  );
};

export default TimelineSlider;