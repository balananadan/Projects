# Map Dashboard with Timeline and Polygon Analytics

A dynamic data visualization dashboard built with React/Next.js that allows users to create polygons on an interactive map, visualize time-series data, and apply color-coded analytics based on configurable rules.

## 🚀 Features

### Core Functionality
- **Interactive Timeline Slider**: Navigate through 30 days of hourly data (15 days before/after today)
- **Dual Timeline Modes**: Single hour selection or range selection
- **Interactive Map**: Leaflet-based map with drawing capabilities
- **Polygon Drawing**: Create polygons with 3-12 points on the map
- **Data Source Integration**: Open-Meteo weather API integration
- **Dynamic Color Coding**: Configurable color rules based on data values
- **Real-time Updates**: Automatic polygon color updates when timeline changes

### Advanced Features
- **State Persistence**: Polygons and settings saved to localStorage
- **Data Caching**: Optimized API calls with intelligent caching
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful fallback to mock data when API fails
- **Animation**: Timeline autoplay functionality
- **Color Rule Management**: Visual color rule editor with validation

## 🛠️ Tech Stack

### Required Dependencies
- **Next.js 15.4.5**: React framework with App Router
- **TypeScript**: Type-safe development
- **React Leaflet**: Interactive map components
- **Ant Design**: UI component library
- **Zustand**: State management with persistence
- **Axios**: HTTP client for API calls
- **date-fns**: Date manipulation utilities
- **rc-slider**: Custom slider components

### Data Source
- **Open-Meteo Archive API**: Historical weather data
  - Endpoint: `https://archive-api.open-meteo.com/v1/archive`
  - Fields: Temperature, humidity, precipitation, wind speed
  - No API key required (free service)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd map-dashboard
npm install
```

### Step 2: Environment Setup
No environment variables required! The Open-Meteo API is free and doesn't require authentication.

### Step 3: Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Production Build
```bash
npm run build
npm start
```

## 🎯 Usage Guide

### 1. Timeline Control
- **Single Mode**: Select a specific hour to view data
- **Range Mode**: Select a time window to average data across hours
- **Autoplay**: Use play button to animate through time
- **Navigation**: Click or drag on timeline to change time

### 2. Drawing Polygons
1. Click "Draw Polygon" button
2. Click on map to add points (3-12 points allowed)
3. Click "Finish" when done
4. Select data source if multiple available
5. Polygon automatically colored based on data and rules

### 3. Color Rules Configuration
1. Open sidebar "Data Sources" section
2. Expand temperature data source
3. Add/edit color rules:
   - Choose operator (=, <, >, ≤, ≥)
   - Set threshold value
   - Pick color
4. Rules are applied in priority order

### 4. Managing Polygons
- **View**: All polygons listed in sidebar
- **Delete**: Click delete button in popup or sidebar
- **Info**: Click polygon to see current value and controls

## 🌐 API Integration

### Open-Meteo Weather API
The application uses the Open-Meteo Archive API for historical weather data:

```typescript
// Example API call
GET https://archive-api.open-meteo.com/v1/archive
  ?latitude=52.52
  &longitude=13.41
  &start_date=2025-01-01
  &end_date=2025-01-31
  &hourly=temperature_2m
  &timezone=UTC
```

### Data Processing
- **Polygon Centroid**: Uses center point of polygon for data fetching
- **Time Aggregation**: Averages values for range selections
- **Caching**: 5-minute cache prevents redundant API calls
- **Fallback**: Mock data generated if API unavailable

## 🎨 Customization

### Adding New Data Sources
1. Update `defaultDataSources` in `src/store/useMapStore.ts`
2. Ensure API endpoint supports the new field
3. Add appropriate color rules

### Custom Color Rules
Default temperature rules:
- < 0°C: Blue (freezing)
- 0-20°C: Green (mild)
- 20-30°C: Yellow (warm)
- 30-40°C: Orange (hot)
- > 40°C: Red (extreme)

### Styling
- Tailwind CSS for utility styling
- Ant Design for component theming
- Custom CSS in `src/app/globals.css`

## 📱 Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically

### Netlify
1. Build the application: `npm run build`
2. Deploy the `out` folder
3. Configure as SPA (Single Page Application)

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Development Notes

### State Management
- **Zustand Store**: Central state management
- **Persistence**: Automatic localStorage sync
- **TypeScript**: Fully typed state and actions

### Performance Optimizations
- **Dynamic Imports**: Map components loaded client-side only
- **API Caching**: Reduces redundant weather API calls
- **Debounced Updates**: Prevents excessive polygon updates
- **Memo Components**: Optimized re-rendering

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

**Map not displaying:**
- Ensure you're accessing via HTTP/HTTPS (not file://)
- Check browser console for Leaflet errors
- Verify public/leaflet/ icons exist

**API errors:**
- Application falls back to mock data automatically
- Check network connectivity
- Open-Meteo API may have rate limits

**Build errors:**
- Run `npm install` to ensure all dependencies
- Check Node.js version (18+ required)
- Clear .next cache: `rm -rf .next`

**Performance issues:**
- Reduce number of polygons
- Use shorter time ranges
- Clear browser cache

## 📄 License

This project is built for demonstration purposes. Feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues or questions:
- Check existing GitHub issues
- Create new issue with reproduction steps
- Include browser version and error messages

---

**Built with ❤️ using Next.js, TypeScript, and Open-Meteo API**
