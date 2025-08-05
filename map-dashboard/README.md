# Weather Data Dashboard

A modern, interactive dashboard built with Next.js and TypeScript that visualizes dynamic weather data over both time and space. Users can draw polygons on a map, select time ranges, and apply color-coded data visualization based on customizable rules.

![Dashboard Preview](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Weather+Data+Dashboard)

## 🌟 Features

### Core Features ✅
- **Interactive Timeline Slider** - Navigate through 30-day time windows (15 days before/after today) with hourly precision
- **Dual-Mode Timeline** - Switch between single-time selection and time-range selection
- **Interactive Map** - Built with Leaflet for smooth interaction and OpenStreetMap tiles
- **Polygon Drawing** - Draw custom polygons with 3-12 points directly on the map
- **Real-time Weather Data** - Integration with Open-Meteo API for temperature data
- **Color-Coded Visualization** - Configure custom color rules based on data thresholds
- **Dynamic Updates** - Polygons automatically update colors when timeline changes
- **Data Source Management** - Extensible system for multiple data sources

### Bonus Features ⭐
- **API Caching** - Intelligent caching system to optimize API usage
- **Batch Processing** - Efficient handling of multiple polygon updates
- **Error Handling** - Comprehensive error states and user feedback
- **Responsive Design** - Optimized for different screen sizes
- **Loading States** - Professional loading indicators and progress feedback
- **Data Validation** - Input validation and error prevention

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm, yarn, or pnpm package manager
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd map-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

### Required Dependencies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Ant Design
- **State Management**: Zustand
- **Mapping**: Leaflet + React-Leaflet
- **HTTP Client**: Axios
- **UI Components**: Ant Design
- **Slider Component**: React-Range

### Development Dependencies
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript
- **CSS Framework**: Tailwind CSS
- **Build Tool**: Next.js built-in bundler

## 📖 Usage Guide

### 1. Timeline Control
- **Single Time Mode**: Select a specific hour to view data for that moment
- **Range Mode**: Select a time window to view averaged data across multiple hours
- **Navigation**: Use the slider handles to adjust time selection
- **Reset**: Click "Reset to Now" to return to current time

### 2. Drawing Polygons
1. Click "Draw Polygon" button on the map
2. Click on the map to add points (minimum 3, maximum 12)
3. Click "Finish" when done or reach 12 points automatically
4. Select a data source if multiple are available
5. Polygon will automatically fetch and display data

### 3. Configuring Color Rules
1. Open the sidebar (right panel)
2. Select your active data source
3. Click "Add Rule" to create color-coding rules
4. Set operator (=, <, >, ≤, ≥), threshold value, and color
5. Rules are applied in order - first match determines color

### 4. Managing Data
- **Automatic Updates**: Data refreshes when timeline changes
- **Manual Refresh**: Click "Refresh Data" button for manual updates
- **Error Handling**: Red coloring indicates data fetch errors
- **Progress Tracking**: Loading indicators show update progress

## 🔧 Configuration

### API Configuration

The application uses the Open-Meteo API for weather data:
- **API URL**: `https://archive-api.open-meteo.com/v1/archive`
- **Data Field**: `temperature_2m` (2-meter temperature)
- **No API Key Required**: Open-Meteo provides free access
- **Rate Limiting**: Built-in batching to respect API limits

### Environment Variables

No environment variables are required for basic functionality. All configuration is handled through the UI.

### Data Sources

Currently implemented:
- **Open-Meteo Weather API**: Temperature data with hourly resolution

To add additional data sources:
1. Extend the `DataSource` interface in `src/store/mapStore.ts`
2. Implement data fetching in `src/utils/api.ts`
3. Update the data service in `src/utils/dataService.ts`

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard layout
│   ├── TimelineSlider.tsx # Timeline control
│   ├── MapComponent.tsx   # Interactive map
│   └── Sidebar.tsx        # Data source & rules
├── store/                 # State management
│   └── mapStore.ts        # Zustand store
├── utils/                 # Utilities
│   ├── api.ts            # API client
│   └── dataService.ts    # Data processing
└── hooks/                 # Custom hooks
    └── useDataUpdates.ts  # Data update logic
```

### State Management

Using Zustand for global state management:
- **Timeline State**: Current time, time ranges, mode selection
- **Map State**: Center, zoom, drawing mode
- **Polygon Management**: List of polygons with data and colors
- **Data Sources**: Available APIs and color rules
- **Loading States**: API request status and progress

### Data Flow

1. User interacts with timeline or draws polygon
2. State updates trigger `useDataUpdates` hook
3. Hook validates polygons and batches API requests
4. `DataService` fetches weather data and applies color rules
5. Store updates with new data and colors
6. Components re-render with updated visualization

## 🎨 Design Decisions

### Color Rule System
- **Priority-based**: Rules applied in order (first match wins)
- **Flexible Operators**: Support for equality, comparison operators
- **Visual Feedback**: Immediate preview of color assignments
- **Default Fallback**: Gray color when no rules match

### Performance Optimizations
- **API Caching**: Prevent duplicate requests for same location/time
- **Batch Processing**: Update multiple polygons efficiently
- **Debounced Updates**: Avoid excessive API calls during slider interaction
- **Lazy Loading**: Components loaded on demand

### User Experience
- **Progressive Disclosure**: Advanced features in sidebar
- **Clear Feedback**: Loading states and error messages
- **Intuitive Controls**: Familiar map interactions
- **Responsive Design**: Works on desktop and tablet devices

## 🐛 Troubleshooting

### Common Issues

**Map not loading**
- Check internet connection
- Verify Leaflet CSS is loading correctly
- Clear browser cache and reload

**API errors**
- Check browser console for specific error messages
- Verify Open-Meteo API is accessible
- Try refreshing data manually

**Polygon drawing issues**
- Ensure JavaScript is enabled
- Try clicking directly on map tiles (not UI elements)
- Check that drawing mode is activated

**Performance issues**
- Limit number of polygons (recommended: <20)
- Use smaller time ranges when possible
- Clear browser cache if experiencing slowdowns

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔮 Future Enhancements

### Planned Features
- **Additional Data Sources**: Wind speed, humidity, precipitation
- **Polygon Editing**: Modify existing polygon shapes
- **Data Export**: Download polygon data as CSV/JSON
- **Time Animation**: Automatic playback through time ranges
- **Collaborative Features**: Share polygon configurations
- **Mobile Optimization**: Enhanced mobile user experience

### Technical Improvements
- **Offline Support**: Service worker for offline functionality
- **Real-time Updates**: WebSocket connection for live data
- **Advanced Caching**: IndexedDB for persistent storage
- **Performance Monitoring**: Analytics and error tracking

## 📝 License

This project is part of a technical assessment and is provided for evaluation purposes.

## 🙋‍♀️ Support

For questions or issues with the application:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure all dependencies are properly installed
4. Verify API connectivity to Open-Meteo

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
