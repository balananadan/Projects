'use client';

import React, { useCallback, useMemo } from 'react';
import { Range } from 'react-range';
import { Button, Switch, Tooltip } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useMapStore } from '@/store/mapStore';

const TimelineSlider: React.FC = () => {
  const {
    currentTime,
    timeRange,
    isRangeMode,
    setCurrentTime,
    setTimeRange,
    setIsRangeMode,
  } = useMapStore();

  // Create a 30-day timeline (15 days before and after today)
  const timelineStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  }, []);

  const timelineEnd = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  }, []);

  // Convert dates to timestamps for slider calculations
  const minTimestamp = timelineStart.getTime();
  const maxTimestamp = timelineEnd.getTime();

  // Current slider values
  const singleValue = useMemo(() => [currentTime.getTime()], [currentTime]);
  const rangeValues = useMemo(() => [
    timeRange.start.getTime(),
    timeRange.end.getTime()
  ], [timeRange]);

  // Handle single time change
  const handleSingleChange = useCallback((values: number[]) => {
    const newTime = new Date(values[0]);
    setCurrentTime(newTime);
  }, [setCurrentTime]);

  // Handle range change
  const handleRangeChange = useCallback((values: number[]) => {
    const newRange = {
      start: new Date(values[0]),
      end: new Date(values[1])
    };
    setTimeRange(newRange);
  }, [setTimeRange]);

  // Format timestamp to readable string
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get major tick marks (every 24 hours)
  const majorTicks = useMemo(() => {
    const ticks = [];
    const start = new Date(timelineStart);
    start.setHours(0, 0, 0, 0); // Start at midnight
    
    for (let i = 0; i < 31; i++) { // 30 days + 1
      const tickTime = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      if (tickTime >= timelineStart && tickTime <= timelineEnd) {
        ticks.push(tickTime.getTime());
      }
    }
    return ticks;
  }, [timelineStart, timelineEnd]);

  const handleModeChange = (checked: boolean) => {
    setIsRangeMode(checked);
  };

  const resetToNow = () => {
    const now = new Date();
    if (isRangeMode) {
      setTimeRange({
        start: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour before
        end: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour after
      });
    } else {
      setCurrentTime(now);
    }
  };

  return (
    <div className="bg-white p-6 shadow-lg rounded-lg border-b">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <ClockCircleOutlined className="mr-2" />
            Timeline Control
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Single Time</span>
            <Switch
              checked={isRangeMode}
              onChange={handleModeChange}
              size="small"
            />
            <span className="text-sm text-gray-600">Time Range</span>
          </div>
        </div>
        
        <Button
          icon={<CalendarOutlined />}
          onClick={resetToNow}
          type="primary"
          size="small"
        >
          Reset to Now
        </Button>
      </div>

      <div className="mb-4">
        {isRangeMode ? (
          <div className="text-sm text-gray-600 mb-2">
            <strong>Selected Range:</strong> {formatTimestamp(timeRange.start.getTime())} - {formatTimestamp(timeRange.end.getTime())}
          </div>
        ) : (
          <div className="text-sm text-gray-600 mb-2">
            <strong>Selected Time:</strong> {formatTimestamp(currentTime.getTime())}
          </div>
        )}
      </div>

      <div className="relative">
        {/* Timeline labels */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{timelineStart.toLocaleDateString()}</span>
          <span>Today</span>
          <span>{timelineEnd.toLocaleDateString()}</span>
        </div>

        {/* Major tick marks */}
        <div className="relative h-2 mb-4">
          {majorTicks.map((tick) => {
            const position = ((tick - minTimestamp) / (maxTimestamp - minTimestamp)) * 100;
            const date = new Date(tick);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <Tooltip key={tick} title={date.toLocaleDateString()}>
                <div
                  className={`absolute w-px h-2 ${isToday ? 'bg-blue-500' : 'bg-gray-300'}`}
                  style={{ left: `${position}%` }}
                />
              </Tooltip>
            );
          })}
        </div>

        {/* Slider */}
        <div className="px-2">
          <Range
            step={1000 * 60 * 60} // 1 hour steps
            min={minTimestamp}
            max={maxTimestamp}
            values={isRangeMode ? rangeValues : singleValue}
            onChange={isRangeMode ? handleRangeChange : handleSingleChange}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className="h-2 w-full bg-gray-200 rounded-full"
                style={{
                  ...props.style,
                  background: isRangeMode 
                    ? `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((rangeValues[0] - minTimestamp) / (maxTimestamp - minTimestamp)) * 100}%, #3b82f6 ${((rangeValues[0] - minTimestamp) / (maxTimestamp - minTimestamp)) * 100}%, #3b82f6 ${((rangeValues[1] - minTimestamp) / (maxTimestamp - minTimestamp)) * 100}%, #e5e7eb ${((rangeValues[1] - minTimestamp) / (maxTimestamp - minTimestamp)) * 100}%)`
                    : '#e5e7eb'
                }}
              >
                {children}
              </div>
            )}
            renderThumb={({ props, index }) => (
              <Tooltip 
                title={formatTimestamp(isRangeMode ? rangeValues[index] : singleValue[0])}
                placement="top"
              >
                <div
                  {...props}
                  className="h-6 w-6 bg-blue-500 rounded-full shadow-lg border-2 border-white cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                  style={{
                    ...props.style,
                  }}
                />
              </Tooltip>
            )}
          />
        </div>

        {/* Hour indicators */}
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>-15 days</span>
          <span className="text-gray-600 font-medium">Now</span>
          <span>+15 days</span>
        </div>
      </div>

      {/* Range duration display */}
      {isRangeMode && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">
            Duration: {Math.round((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60))} hours
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineSlider;