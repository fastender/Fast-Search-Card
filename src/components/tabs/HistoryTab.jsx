// src/components/tabs/HistoryTab.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Chart from 'react-apexcharts';

export const HistoryTab = ({ item, onDataRequest }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [chartExpanded, setChartExpanded] = useState(true);
  const [textExpanded, setTextExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [textEvents, setTextEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Generate mock data based on domain and time range
  const generateMockData = (range, domain) => {
    const now = Date.now();
    const data = [];
    const events = [];
    
    // Determine data points based on range
    let points, interval, aggregated;
    switch(range) {
      case '1h':
        points = 60; // Every minute
        interval = 60 * 1000;
        aggregated = false;
        break;
      case '24h':
        points = 288; // Every 5 minutes
        interval = 5 * 60 * 1000;
        aggregated = false;
        break;
      case '7d':
        points = 168; // Hourly aggregates
        interval = 60 * 60 * 1000;
        aggregated = true;
        break;
      default:
        points = 288;
        interval = 5 * 60 * 1000;
        aggregated = false;
    }
    
    // Generate data points
    for (let i = points; i > 0; i--) {
      const timestamp = now - (i * interval);
      const date = new Date(timestamp);
      let value = 0;
      let state = 'off';
      
      // Domain-specific patterns
      switch(domain) {
        case 'light':
          const hour = date.getHours();
          const isNight = hour < 6 || hour > 22;
          if (!isNight) {
            value = 50 + Math.sin(i / 10) * 30 + Math.random() * 20;
            state = value > 20 ? 'on' : 'off';
          } else {
            value = 0;
            state = 'off';
          }
          
          // Add state change events
          if (i === points || (data.length > 0 && 
              (data[data.length - 1].y === 0 && value > 0) || 
              (data[data.length - 1].y > 0 && value === 0))) {
            events.push({
              timestamp: date,
              type: value > 0 ? 'turned_on' : 'turned_off',
              value: Math.round(value),
              icon: '💡',
              color: value > 0 ? '#FFD700' : '#666'
            });
          }
          break;
          
        case 'climate':
          // Temperature pattern
          const baseTemp = 20;
          const dailyVariation = Math.sin((date.getHours() - 6) * Math.PI / 12) * 3;
          value = baseTemp + dailyVariation + (Math.random() - 0.5) * 2;
          
          if (Math.random() < 0.05) {
            events.push({
              timestamp: date,
              type: 'temperature_changed',
              value: value.toFixed(1),
              icon: '🌡️',
              color: '#4A90E2'
            });
          }
          break;
          
        case 'sensor':
          // Sensor reading pattern (e.g., humidity)
          value = 40 + Math.sin(i / 20) * 20 + Math.random() * 10;
          
          if (Math.random() < 0.03) {
            events.push({
              timestamp: date,
              type: 'reading_recorded',
              value: value.toFixed(1),
              icon: '📊',
              color: '#4CAF50'
            });
          }
          break;
          
        case 'media_player':
          // Media player usage
          const isEvening = date.getHours() >= 18 && date.getHours() <= 23;
          if (isEvening && Math.random() < 0.7) {
            value = 30 + Math.random() * 50;
            state = 'playing';
            
            if (Math.random() < 0.1) {
              events.push({
                timestamp: date,
                type: 'playback_started',
                value: `Volume: ${Math.round(value)}%`,
                icon: '🎵',
                color: '#FF6B35'
              });
            }
          } else {
            value = 0;
            state = 'idle';
          }
          break;
          
        case 'cover':
          // Cover position
          const morning = date.getHours() === 7;
          const evening = date.getHours() === 20;
          
          if (morning) {
            value = 100; // Open
            events.push({
              timestamp: date,
              type: 'opened',
              value: '100%',
              icon: '☀️',
              color: '#9C27B0'
            });
          } else if (evening) {
            value = 0; // Closed
            events.push({
              timestamp: date,
              type: 'closed',
              value: '0%',
              icon: '🌙',
              color: '#9C27B0'
            });
          } else {
            value = data.length > 0 ? data[data.length - 1].y : 50;
          }
          break;
          
        default:
          value = 50 + Math.random() * 50;
      }
      
      // Add data point
      data.push({
        x: timestamp,
        y: aggregated && data.length > 0 ? 
           (data[data.length - 1].y + value) / 2 : // Average for aggregation
           value
      });
    }
    
    return { data, events: events.reverse() }; // Newest events first
  };

  // Load data when time range changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockData(timeRange, item.domain);
      setChartData(mockData.data);
      setTextEvents(mockData.events);
      setIsLoading(false);
    }, 300);
  }, [timeRange, item.domain]);

  // Live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (chartData && chartData.length > 0) {
        // Add new data point
        const newPoint = {
          x: Date.now(),
          y: chartData[chartData.length - 1].y + (Math.random() - 0.5) * 10
        };
        
        setChartData(prev => {
          const updated = [...prev, newPoint];
          // Remove oldest point to maintain same number of points
          if (updated.length > 60) {
            updated.shift();
          }
          return updated;
        });
      }
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [chartData]);

  // Get domain-specific chart configuration
  const getChartConfig = () => {
    const baseConfig = {
      theme: {
        mode: 'dark'
      },
      chart: {
        type: 'area',
        height: 300,
        background: 'transparent',
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100, 100, 100]
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          style: {
            colors: 'rgba(255, 255, 255, 0.5)'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: 'rgba(255, 255, 255, 0.5)'
          },
          formatter: (value) => value.toFixed(1)
        }
      },
      tooltip: {
        theme: 'dark',
        x: {
          format: 'dd.MM HH:mm'
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        strokeDashArray: 4
      }
    };
    
    // Domain-specific configurations
    switch(item.domain) {
      case 'light':
        return {
          ...baseConfig,
          colors: ['#FFD700'],
          yaxis: {
            ...baseConfig.yaxis,
            min: 0,
            max: 100,
            title: {
              text: 'Helligkeit %',
              style: { color: 'rgba(255, 255, 255, 0.5)' }
            }
          }
        };
        
      case 'climate':
        return {
          ...baseConfig,
          colors: ['#4A90E2'],
          chart: {
            ...baseConfig.chart,
            type: 'line'
          },
          yaxis: {
            ...baseConfig.yaxis,
            min: 15,
            max: 30,
            title: {
              text: 'Temperatur °C',
              style: { color: 'rgba(255, 255, 255, 0.5)' }
            }
          }
        };
        
      case 'sensor':
        return {
          ...baseConfig,
          colors: ['#4CAF50'],
          yaxis: {
            ...baseConfig.yaxis,
            title: {
              text: 'Wert',
              style: { color: 'rgba(255, 255, 255, 0.5)' }
            }
          }
        };
        
      case 'media_player':
        return {
          ...baseConfig,
          colors: ['#FF6B35'],
          chart: {
            ...baseConfig.chart,
            type: 'bar'
          },
          plotOptions: {
            bar: {
              borderRadius: 4,
              columnWidth: '80%'
            }
          },
          yaxis: {
            ...baseConfig.yaxis,
            min: 0,
            max: 100,
            title: {
              text: 'Lautstärke %',
              style: { color: 'rgba(255, 255, 255, 0.5)' }
            }
          }
        };
        
      case 'cover':
        return {
          ...baseConfig,
          colors: ['#9C27B0'],
          chart: {
            ...baseConfig.chart,
            type: 'line'
          },
          stroke: {
            ...baseConfig.stroke,
            curve: 'stepline'
          },
          yaxis: {
            ...baseConfig.yaxis,
            min: 0,
            max: 100,
            title: {
              text: 'Position %',
              style: { color: 'rgba(255, 255, 255, 0.5)' }
            }
          }
        };
        
      default:
        return {
          ...baseConfig,
          colors: ['#9E9E9E']
        };
    }
  };

  // Format time for text view
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min`;
    if (hours < 24) return `vor ${hours}h`;
    if (days === 1) return 'Gestern';
    if (days < 7) return `vor ${days} Tagen`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartOptions = getChartConfig();
  const series = [{
    name: item.attributes?.friendly_name || item.entity_id,
    data: chartData || []
  }];

  return (
    <div className={`history-tab ${isVisible ? 'visible' : ''}`}>
      <style>{`
        .history-tab {
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .history-tab.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Time Range Selector */
        .time-range-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .time-range-button {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .time-range-button.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          color: white;
        }

        .time-range-button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
        }

        /* Accordion Styles */
        .accordion-item {
          margin-bottom: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          overflow: hidden;
        }

        .accordion-header {
          padding: 16px 20px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .accordion-header:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .accordion-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-size: 16px;
          font-weight: 500;
        }

        .accordion-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .accordion-icon.expanded {
          transform: rotate(90deg);
        }

        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .accordion-content.expanded {
          max-height: 600px;
        }

        .accordion-body {
          padding: 0 20px 20px;
        }

        /* Chart Container */
        .chart-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 15px;
          position: relative;
          min-height: 300px;
        }

        .chart-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255, 255, 255, 0.5);
        }

        /* Text View Styles */
        .text-view-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 15px;
          max-height: 400px;
          overflow-y: auto;
        }

        .text-view-container::-webkit-scrollbar {
          width: 6px;
        }

        .text-view-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .text-view-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .event-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid var(--event-color);
          transition: all 0.2s ease;
          opacity: 0;
          animation: slideInLeft 0.3s ease forwards;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .event-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .event-icon {
          font-size: 20px;
          width: 24px;
          text-align: center;
        }

        .event-content {
          flex: 1;
        }

        .event-time {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
        }

        .event-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .event-value {
          font-weight: 500;
          color: white;
        }

        .no-events {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.3);
        }

        .no-events-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .no-events-text {
          font-size: 14px;
        }
      `}</style>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        <button 
          className={`time-range-button ${timeRange === '1h' ? 'active' : ''}`}
          onClick={() => setTimeRange('1h')}
        >
          1h
        </button>
        <button 
          className={`time-range-button ${timeRange === '24h' ? 'active' : ''}`}
          onClick={() => setTimeRange('24h')}
        >
          24h
        </button>
        <button 
          className={`time-range-button ${timeRange === '7d' ? 'active' : ''}`}
          onClick={() => setTimeRange('7d')}
        >
          7d
        </button>
      </div>

      {/* Chart Accordion */}
      <div className="accordion-item">
        <div 
          className="accordion-header"
          onClick={() => setChartExpanded(!chartExpanded)}
        >
          <div className="accordion-title">
            <svg 
              className={`accordion-icon ${chartExpanded ? 'expanded' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>📊 Chart-Ansicht</span>
          </div>
        </div>
        
        <div className={`accordion-content ${chartExpanded ? 'expanded' : ''}`}>
          <div className="accordion-body">
            <div className="chart-container">
              {isLoading ? (
                <div className="chart-loading">Lade Daten...</div>
              ) : (
                <Chart
                  options={chartOptions}
                  series={series}
                  type={chartOptions.chart.type}
                  height={300}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text View Accordion */}
      <div className="accordion-item">
        <div 
          className="accordion-header"
          onClick={() => setTextExpanded(!textExpanded)}
        >
          <div className="accordion-title">
            <svg 
              className={`accordion-icon ${textExpanded ? 'expanded' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>📝 Text-Verlauf</span>
          </div>
        </div>
        
        <div className={`accordion-content ${textExpanded ? 'expanded' : ''}`}>
          <div className="accordion-body">
            <div className="text-view-container">
              {textEvents.length === 0 ? (
                <div className="no-events">
                  <div className="no-events-icon">📭</div>
                  <div className="no-events-text">Keine Ereignisse in diesem Zeitraum</div>
                </div>
              ) : (
                textEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className="event-item"
                    style={{ 
                      '--event-color': event.color,
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="event-icon">{event.icon}</div>
                    <div className="event-content">
                      <div className="event-time">{formatTime(event.timestamp)}</div>
                      <div className="event-description">
                        {event.type === 'turned_on' && 'Eingeschaltet'}
                        {event.type === 'turned_off' && 'Ausgeschaltet'}
                        {event.type === 'temperature_changed' && 'Temperatur geändert'}
                        {event.type === 'reading_recorded' && 'Messwert aufgezeichnet'}
                        {event.type === 'playback_started' && 'Wiedergabe gestartet'}
                        {event.type === 'opened' && 'Geöffnet'}
                        {event.type === 'closed' && 'Geschlossen'}
                        {event.value && (
                          <span className="event-value"> - {event.value}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;