'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Layout, Spin, Button, Typography, Tooltip } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { useDataUpdates } from '@/hooks/useDataUpdates';
import { useMapStore } from '@/store/mapStore';

// Dynamic imports to avoid SSR issues
const TimelineSlider = dynamic(() => import('./TimelineSlider'), { ssr: false });
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

// Loading component for map
const MapLoader = () => (
  <div className="flex items-center justify-center h-full bg-gray-100">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-gray-600">Loading map...</div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { isLoading } = useMapStore();
  const { refreshData } = useDataUpdates();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout className="h-screen">
      {/* Header with Timeline */}
      <Header className="bg-white p-0 h-auto border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Title level={3} className="mb-0">
              Weather Data Dashboard
            </Title>
            <Tooltip title="Visualize weather data over time and space">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={isLoading}
              type="primary"
              size="small"
            >
              Refresh Data
            </Button>
          </div>
        </div>
        
        <TimelineSlider />
      </Header>

      <Layout>
        {/* Main Map Content */}
        <Content className="relative">
          <Suspense fallback={<MapLoader />}>
            <MapComponent />
          </Suspense>
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[2000]">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <Spin size="large" />
                <div className="mt-2 text-center text-gray-600">
                  Fetching weather data...
                </div>
              </div>
            </div>
          )}
        </Content>

        {/* Sidebar */}
        <Sider 
          width={320} 
          className="bg-white border-l"
          collapsible={false}
        >
          <Sidebar />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default Dashboard;