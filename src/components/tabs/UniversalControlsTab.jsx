// src/components/tabs/UniversalControlsTab.jsx
import { h } from 'preact';
import { useState, useEffect, useRef, useMemo } from 'preact/hooks';

// Helper Functions for Configuration
const getControlConfig = (item) => {
  const domain = item?.domain || 'unknown';
  const state = item?.state;
  const attributes = item?.attributes || {};
  
  switch(domain) {
    case 'light':
      return {
        primary: [
          {
            id: 'brightness',
            icon: icons.brightness,
            label: 'Helligkeit',
            expandable: true
          },
          {
            id: 'colortemp',
            icon: icons.thermometer,
            label: 'Farbtemperatur',
            expandable: true
          },
          {
            id: 'color',
            icon: icons.palette,
            label: 'Farbe',
            expandable: true
          },
          {
            id: 'effects',
            icon: icons.settings,
            label: 'Effekte',
            expandable: true
          }
        ],
        expandable: [
          {
            id: 'brightness',
            service: 'turn_on',
            items: [
              { label: '10%', data: { brightness_pct: 10 }, style: { background: 'rgba(255, 255, 255, 0.1)' } },
              { label: '25%', data: { brightness_pct: 25 }, style: { background: 'rgba(255, 255, 255, 0.25)' } },
              { label: '50%', data: { brightness_pct: 50 }, style: { background: 'rgba(255, 255, 255, 0.5)' } },
              { label: '75%', data: { brightness_pct: 75 }, style: { background: 'rgba(255, 255, 255, 0.75)' } },
              { label: '100%', data: { brightness_pct: 100 }, style: { background: 'rgba(255, 215, 0, 0.9)' } }
            ]
          },
          {
            id: 'colortemp',
            service: 'turn_on',
            items: [
              { label: 'Sehr Warm', data: { kelvin: 2000 }, style: { background: '#ff8c42' } },
              { label: 'Warm', data: { kelvin: 2700 }, style: { background: '#ffb366' } },
              { label: 'Neutral', data: { kelvin: 3500 }, style: { background: '#ffd4a3' } },
              { label: 'Kalt', data: { kelvin: 5000 }, style: { background: '#e8e4ff' } },
              { label: 'Tageslicht', data: { kelvin: 6500 }, style: { background: '#d4e4ff' } }
            ]
          },
          {
            id: 'color',
            service: 'turn_on',
            items: [
              { label: 'Rot', data: { rgb_color: [255, 0, 0] }, style: { background: '#ff0000' } },
              { label: 'Grün', data: { rgb_color: [0, 255, 0] }, style: { background: '#00ff00' } },
              { label: 'Blau', data: { rgb_color: [0, 0, 255] }, style: { background: '#0000ff' } },
              { label: 'Gelb', data: { rgb_color: [255, 255, 0] }, style: { background: '#ffff00' } },
              { label: 'Cyan', data: { rgb_color: [0, 255, 255] }, style: { background: '#00ffff' } },
              { label: 'Magenta', data: { rgb_color: [255, 0, 255] }, style: { background: '#ff00ff' } },
              { label: 'Orange', data: { rgb_color: [255, 165, 0] }, style: { background: '#ffa500' } },
              { label: 'Pink', data: { rgb_color: [255, 192, 203] }, style: { background: '#ffc0cb' } }
            ]
          },
          {
            id: 'effects',
            service: 'turn_on',
            items: attributes.effect_list?.slice(0, 8).map(effect => ({
              label: effect,
              data: { effect },
              icon: '✨'
            })) || []
          }
        ]
      };
      
    case 'climate':
      return {
        primary: [
          {
            id: 'hvac',
            icon: icons.power,
            label: 'HVAC',
            expandable: true
          },
          {
            id: 'fan',
            icon: icons.wind,
            label: 'Lüfter',
            expandable: true
          },
          {
            id: 'preset',
            icon: icons.settings,
            label: 'Voreinstellung',
            expandable: true
          },
          {
            id: 'swing',
            icon: icons.radio,
            label: 'Schwenk',
            expandable: true
          }
        ],
        expandable: [
          {
            id: 'hvac',
            service: 'set_hvac_mode',
            items: (attributes.hvac_modes || []).map(mode => ({
              label: mode,
              data: { hvac_mode: mode },
              icon: mode === 'heat' ? '🔥' : mode === 'cool' ? '❄️' : mode === 'auto' ? '♻️' : '⏸️'
            }))
          },
          {
            id: 'fan',
            service: 'set_fan_mode',
            items: (attributes.fan_modes || []).map(mode => ({
              label: mode,
              data: { fan_mode: mode },
              icon: '💨'
            }))
          },
          {
            id: 'preset',
            service: 'set_preset_mode',
            items: (attributes.preset_modes || []).map(mode => ({
              label: mode,
              data: { preset_mode: mode },
              icon: '⚙️'
            }))
          },
          {
            id: 'swing',
            service: 'set_swing_mode',
            items: (attributes.swing_modes || []).map(mode => ({
              label: mode,
              data: { swing_mode: mode },
              icon: '🔄'
            }))
          }
        ]
      };
      
    case 'media_player':
      return {
        primary: [
          {
            id: 'play',
            icon: state === 'playing' ? icons.pause : icons.play,
            label: state === 'playing' ? 'Pause' : 'Play',
            action: state === 'playing' ? 'media_pause' : 'media_play'
          },
          {
            id: 'previous',
            icon: icons.skip_back,
            label: 'Zurück',
            action: 'media_previous_track'
          },
          {
            id: 'next',
            icon: icons.skip_forward,
            label: 'Weiter',
            action: 'media_next_track'
          },
          {
            id: 'source',
            icon: icons.tv,
            label: 'Quelle',
            expandable: true
          }
        ],
        expandable: [
          {
            id: 'source',
            service: 'select_source',
            items: (attributes.source_list || []).slice(0, 8).map(source => ({
              label: source,
              data: { source },
              icon: '📻'
            }))
          }
        ]
      };
      
    case 'cover':
      return {
        primary: [
          {
            id: 'open',
            icon: icons.arrow_up,
            label: 'Öffnen',
            action: 'open_cover'
          },
          {
            id: 'stop',
            icon: icons.pause,
            label: 'Stop',
            action: 'stop_cover'
          },
          {
            id: 'close',
            icon: icons.arrow_down,
            label: 'Schließen',
            action: 'close_cover'
          },
          {
            id: 'presets',
            icon: icons.map,
            label: 'Position',
            expandable: true
          }
        ],
        expandable: [
          {
            id: 'presets',
            service: 'set_cover_position',
            items: [
              { label: '0%', data: { position: 0 }, icon: '🌙' },
              { label: '25%', data: { position: 25 }, icon: '☁️' },
              { label: '50%', data: { position: 50 }, icon: '⛅' },
              { label: '75%', data: { position: 75 }, icon: '🌤️' },
              { label: '100%', data: { position: 100 }, icon: '☀️' }
            ]
          }
        ]
      };
      
    default:
      return {
        primary: [],
        expandable: []
      };
  }
};

const getSliderConfig = (item) => {
  const domain = item?.domain || 'unknown';
  const state = item?.state;
  const attributes = item?.attributes || {};
  
  switch(domain) {
    case 'light':
      const brightness = attributes.brightness || 0;
      return {
        value: Math.round((brightness / 255) * 100),
        min: 0,
        max: 100,
        unit: '%',
        label: 'Helligkeit',
        color: '#FFD700',
        showPower: true,
        powerState: state === 'on',
        interactive: true
      };
      
    case 'climate':
      const currentTemp = attributes.current_temperature || 20;
      const targetTemp = attributes.temperature || 20;
      return {
        value: targetTemp,
        min: attributes.min_temp || 16,
        max: attributes.max_temp || 30,
        unit: '°C',
        label: 'Zieltemperatur',
        displayValue: `${targetTemp}°`,
        subValue: `Aktuell: ${currentTemp}°C`,
        color: '#4A90E2',
        showPower: true,
        powerState: state !== 'off',
        interactive: true
      };
      
    case 'cover':
      const position = attributes.current_position || 0;
      return {
        value: position,
        min: 0,
        max: 100,
        unit: '%',
        label: 'Position',
        color: '#9C27B0',
        showPower: false,
        interactive: true
      };
      
    case 'media_player':
      const volume = Math.round((attributes.volume_level || 0) * 100);
      return {
        value: volume,
        min: 0,
        max: 100,
        unit: '%',
        label: 'Lautstärke',
        color: '#FF6B35',
        showPower: true,
        powerState: state !== 'off' && state !== 'unavailable',
        interactive: true
      };
      
    case 'fan':
      const speed = attributes.percentage || 0;
      return {
        value: speed,
        min: 0,
        max: 100,
        unit: '%',
        label: 'Geschwindigkeit',
        color: '#00BCD4',
        showPower: true,
        powerState: state === 'on',
        interactive: true
      };
      
    case 'sensor':
      if (item.entity_id?.includes('solar')) {
        return {
          value: parseFloat(state) || 0,
          min: 0,
          max: attributes.max || 10,
          unit: attributes.unit_of_measurement || 'kW',
          label: 'Solar Produktion',
          color: '#FFC107',
          showPower: false,
          interactive: false,
          progressMode: true
        };
      }
      return {
        value: parseFloat(state) || 0,
        min: attributes.min || 0,
        max: attributes.max || 100,
        unit: attributes.unit_of_measurement || '',
        label: attributes.friendly_name || 'Sensor',
        color: '#8BC34A',
        showPower: false,
        interactive: false
      };
      
    default:
      return {
        value: 0,
        min: 0,
        max: 100,
        unit: '%',
        label: 'Steuerung',
        color: '#9E9E9E',
        showPower: state === 'on' || state === 'off',
        powerState: state === 'on',
        interactive: false
      };
  }
};

// Icon definitions
const icons = {
  brightness: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  thermometer: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
  palette: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"/></svg>',
  wind: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
  power: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10M16.2 7.8A7 7 0 1 1 7.8 7.8" strokeLinecap="round" strokeLinejoin="round"/></svg>',
  radio: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>',
  map: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
  play: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  pause: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  skip_back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>',
  skip_forward: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>',
  tv: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>',
  arrow_up: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrow_down: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'
};

// Solar Carousel Component
const SolarCarousel = ({ data }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [startX, setStartX] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % data.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data]);

  const currentItem = data[carouselIndex];

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!startX) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCarouselIndex(prev => (prev + 1) % data.length);
      } else {
        setCarouselIndex(prev => (prev - 1 + data.length) % data.length);
      }
    }
    setStartX(null);
  };

  const radius = 140;
  const size = 320;
  const centerX = size / 2;
  const centerY = size / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (currentItem.value - currentItem.min) / (currentItem.max - currentItem.min);
  const offset = circumference - (percentage * circumference);

  return (
    <div 
      className={`circular-slider-container ${isVisible ? 'visible' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <svg width={size} height={size}>
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={currentItem.color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${centerX} ${centerY})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="circular-content">
        <div className="value-container">
          <div className="circular-value">
            {currentItem.value}
            <span className="circular-unit">{currentItem.unit}</span>
          </div>
          {currentItem.subValue && (
            <div className="circular-sub-value">{currentItem.subValue}</div>
          )}
        </div>
        <div className="label-container">
          <div className="circular-label">{currentItem.label}</div>
        </div>
      </div>
      <div className="carousel-dots">
        {data.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === carouselIndex ? 'active' : ''}`}
            onClick={() => setCarouselIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

// CircularSlider Component
const CircularSlider = ({ 
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  readOnly = false,
  label = '',
  displayValue = null,
  subValue = null,
  color = '#FFD700',
  showPower = false,
  powerState = false,
  onValueChange,
  onPowerToggle,
  progressMode = false,
  size = 320,
  showUnit = false,
  unit = '%',
  hideSlider = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const valueRef = useRef(null);

  // Text Scrolling Effect for long values
  useEffect(() => {
    const element = valueRef.current;
    if (!element) return;
    
    if (!displayValue || displayValue.length <= 7) {
      setScrollOffset(0);
      return;
    }
    
    const textWidth = element.scrollWidth;
    const containerWidth = element.clientWidth;
    
    if (textWidth > containerWidth) {
      let animationId;
      
      const animate = () => {
        setScrollOffset(prev => {
          const next = prev - 1;
          if (Math.abs(next) >= textWidth + 50) {
            return 0;
          }
          return next;
        });
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      
      return () => {
        if (animationId) cancelAnimationFrame(animationId);
      };
    }
  }, [displayValue]);

  const radius = 140;
  const centerX = size / 2;
  const centerY = size / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const valueToAngle = (val) => {
    const percentage = (val - min) / (max - min);
    return -90 + (percentage * 360);
  };

  const angleToValue = (angle) => {
    let normalizedAngle = ((angle + 90) % 360 + 360) % 360;
    const percentage = normalizedAngle / 360;
    return min + percentage * (max - min);
  };

  const getProgressOffset = () => {
    const percentage = (currentValue - min) / (max - min);
    return circumference - (percentage * circumference);
  };

  const handleInteraction = (clientX, clientY) => {
    if (readOnly || disabled) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const newValue = Math.round(angleToValue(angle) / step) * step;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    setCurrentValue(clampedValue);
    onValueChange?.(clampedValue);
  };

  const handleMouseDown = (e) => {
    if (readOnly || disabled) return;
    setIsDragging(true);
    setIsPressed(true);
    handleInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleInteraction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPressed(false);
  };

  const handleTouchStart = (e) => {
    if (readOnly || disabled) return;
    setIsDragging(true);
    setIsPressed(true);
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPressed(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const handleAngle = valueToAngle(currentValue);
  const handleX = centerX + radius * Math.cos(handleAngle * Math.PI / 180);
  const handleY = centerY + radius * Math.sin(handleAngle * Math.PI / 180);

  return (
    <div 
      ref={containerRef}
      className={`circular-slider-container ${disabled ? 'disabled' : ''} ${readOnly ? 'read-only' : ''} ${isVisible ? 'visible' : ''} ${isPressed ? 'pressed' : ''}`}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="circular-slider-svg"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
        />
        
        {progressMode ? (
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={getProgressOffset()}
            strokeLinecap="round"
            transform={`rotate(-90 ${centerX} ${centerY})`}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        ) : (
          <path
            d={`M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${Math.abs(handleAngle + 90) > 180 ? 1 : 0} 1 ${handleX} ${handleY}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            opacity={isDragging ? 0.8 : 1}
          />
        )}
        
        {!progressMode && !hideSlider && !readOnly && (
          <circle
            cx={handleX}
            cy={handleY}
            r="16"
            fill="white"
            stroke={color}
            strokeWidth="3"
            style={{ cursor: 'grab' }}
            className={isDragging ? 'handle-dragging' : 'handle'}
          />
        )}
      </svg>
      
      <div className="circular-content">
        {showPower && (
          <div className="power-toggle-container">
            <label className={`power-toggle ${powerState ? 'on' : 'off'} ${!showPower || readOnly || disabled ? 'disabled' : ''}`}>
              <input
                type="checkbox"
                checked={powerState}
                onChange={(e) => showPower && !readOnly && !disabled && onPowerToggle?.(e.target.checked)}
                disabled={!showPower || disabled || readOnly}
              />
              <span className="power-slider">
                <span className="power-icon">
                  <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v10M16.2 7.8A7 7 0 1 1 7.8 7.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
            </label>
          </div>
        )}
        <div className="value-container">
          <div className="circular-value" ref={valueRef}>
            <span style={{ transform: `translateX(${scrollOffset}px)`, display: 'inline-block', whiteSpace: 'nowrap' }}>
              {displayValue || Math.round(currentValue)}
              {scrollOffset < -50 && <span style={{ marginLeft: '50px' }}>{displayValue || Math.round(currentValue)}</span>}
            </span>
            {(showUnit || (!displayValue && !hideSlider)) && (
              <span className="circular-unit">{unit || '%'}</span>
            )}
          </div>
          {subValue && (
            <div className="circular-sub-value" style={{ marginTop: '4px' }}>{subValue}</div>
          )}
        </div>
        <div className="label-container" style={{ marginTop: '2px' }}>
          <div className="circular-label">{label}</div>
        </div>
      </div>
    </div>
  );
};

// Main Universal ControlsTab Component
export const UniversalControlsTab = ({ item, onServiceCall }) => {
  const [expandedControl, setExpandedControl] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const sliderRef = useRef(null);
  const buttonsRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const controlConfig = useMemo(() => {
    return getControlConfig(item);
  }, [item]);

  const sliderConfig = useMemo(() => {
    const config = getSliderConfig(item);
    console.log('SliderConfig for', item?.domain, ':', config);
    return config;
  }, [item]);

  const handleServiceCall = (service, data = {}) => {
    console.log('Service Call:', item?.domain, service, data);
    onServiceCall?.(item?.domain, service, {
      entity_id: item?.entity_id,
      ...data
    });
  };

  const handleSliderChange = (value) => {
    if (item?.domain === 'light') {
      handleServiceCall('turn_on', { brightness: Math.round(value * 2.55) });
    } else if (item?.domain === 'climate') {
      handleServiceCall('set_temperature', { temperature: value });
    } else if (item?.domain === 'cover') {
      handleServiceCall('set_cover_position', { position: value });
    } else if (item?.domain === 'media_player') {
      handleServiceCall('volume_set', { volume_level: value / 100 });
    } else if (item?.domain === 'fan') {
      handleServiceCall('set_percentage', { percentage: value });
    }
  };

  const handlePowerToggle = (state) => {
    if (item?.domain === 'light' || item?.domain === 'switch') {
      handleServiceCall(state ? 'turn_on' : 'turn_off');
    } else if (item?.domain === 'climate') {
      handleServiceCall('set_hvac_mode', { hvac_mode: state ? 'auto' : 'off' });
    } else if (item?.domain === 'media_player') {
      handleServiceCall(state ? 'media_play' : 'media_pause');
    } else if (item?.domain === 'fan') {
      handleServiceCall(state ? 'turn_on' : 'turn_off');
    }
  };

  const toggleExpandable = (controlId) => {
    setExpandedControl(expandedControl === controlId ? null : controlId);
  };

  // Check for solar data
  const isSolar = item?.entity_id?.includes('solar');
  const solarData = isSolar ? [
    { value: 5.2, min: 0, max: 10, unit: 'kW', label: 'Produktion', color: '#FFC107' },
    { value: 2.8, min: 0, max: 10, unit: 'kW', label: 'Verbrauch', color: '#4CAF50' },
    { value: 85, min: 0, max: 100, unit: '%', label: 'Batterie', color: '#2196F3' }
  ] : null;

  return (
    <div className={`controls-tab ${isVisible ? 'visible' : ''} ${isCompactMode ? 'compact-mode' : ''}`}>
      <style>{`
        .controls-tab {
          padding: 20px;
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .controls-tab.visible {
          opacity: 1;
        }

        /* Circular Slider Styles */
        .circular-slider-container {
          position: relative;
          width: 320px;
          height: 320px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.9);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .circular-slider-container.visible {
          opacity: 1;
          transform: scale(1);
        }

        .circular-slider-container.pressed {
          transform: scale(0.98);
        }

        .circular-slider-svg {
          position: absolute;
          cursor: grab;
        }

        .circular-slider-svg:active {
          cursor: grabbing;
        }

        .handle {
          transition: all 0.2s ease;
        }

        .handle-dragging {
          transform: scale(1.2);
        }

        .circular-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .power-toggle-container {
          margin-bottom: 20px;
          pointer-events: all;
        }

        .power-toggle {
          position: relative;
          width: 80px;
          height: 40px;
          display: block;
          cursor: pointer;
        }

        .power-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .power-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          padding: 0 5px;
        }

        .power-toggle.on .power-slider {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          border-color: #4CAF50;
        }

        .power-icon {
          width: 30px;
          height: 30px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .power-icon svg {
          width: 18px;
          height: 18px;
          stroke: #333;
        }

        .power-toggle.on .power-icon {
          transform: translateX(40px);
        }

        .power-toggle.on .power-icon svg {
          stroke: #4CAF50;
        }

        .power-toggle.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .value-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .circular-value {
          font-size: 72px;
          font-weight: 200;
          color: white;
          line-height: 1;
          display: flex;
          align-items: flex-start;
          overflow: hidden;
          max-width: 200px;
          position: relative;
        }

        .circular-unit {
          font-size: 24px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 4px;
          align-self: flex-start;
          margin-top: 8px;
        }

        .circular-sub-value {
          font-size: 24px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1;
          white-space: nowrap;
        }

        .circular-label {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        /* Carousel Dots */
        .carousel-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .carousel-dots .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .carousel-dots .dot.active {
          background: rgba(255, 255, 255, 0.8);
          transform: scale(1.2);
        }

        /* Control Buttons */
        .device-control-design {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 40px 30px 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: visible !important;
          min-height: 200px;
          position: relative;
        }

        .slider-wrapper {
          position: relative;
          z-index: 1;
        }

        .device-control-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .control-row {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .control-button {
          width: 72px;
          height: 72px;
          padding: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          position: relative;
          opacity: 0;
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .control-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.1);
        }

        .control-button.active {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .control-button.expanded {
          background: rgba(74, 144, 226, 0.3);
          border-color: rgba(74, 144, 226, 0.6);
        }

        .button-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .button-icon svg {
          width: 24px;
          height: 24px;
        }

        /* Expandable Presets */
        .control-presets {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease;
          margin-top: 0;
        }

        .control-presets.visible {
          max-height: 200px;
          opacity: 1;
          overflow: visible;
          margin-top: 12px;
        }

        .presets-scroll-container {
          display: flex !important;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 0 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          min-height: 86px;
          justify-content: center;
        }

        .presets-scroll-container::-webkit-scrollbar {
          height: 6px;
        }

        .presets-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .presets-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .preset-button {
          width: 86px;
          height: 86px;
          padding: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0;
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          text-align: center;
        }

        .preset-button:hover {
          transform: scale(1.1);
        }

        .preset-button.active {
          background: rgba(74, 144, 226, 0.3);
          border-color: rgba(74, 144, 226, 0.6);
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Circular Slider or Solar Carousel */}
      <div className="device-control-design">
        <div ref={sliderRef} className={`slider-wrapper ${isCompactMode ? 'hidden' : ''}`}>
          {solarData ? (
            <SolarCarousel data={solarData} />
          ) : (
            <CircularSlider
              {...sliderConfig}
              onValueChange={sliderConfig.interactive ? handleSliderChange : undefined}
              onPowerToggle={sliderConfig.showPower ? handlePowerToggle : undefined}
            />
          )}
        </div>
        
        {/* Control Buttons */}
        <div ref={buttonsRef} className={`device-control-buttons ${isCompactMode ? 'compact' : ''}`}>
          {/* Primary Actions */}
          <div className="control-row primary">
            {controlConfig.primary.map((control, index) => (
              <button
                key={index}
                className={`control-button ${control.active ? 'active' : ''} ${control.expandable && expandedControl === control.id ? 'expanded' : ''}`}
                onClick={() => {
                  if (control.action) {
                    handleServiceCall(control.action, control.data);
                  }
                  if (control.expandable || control.id === 'filter') {
                    toggleExpandable(control.id);
                  }
                }}
                title={control.label}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="button-icon" dangerouslySetInnerHTML={{ __html: control.icon }} />
              </button>
            ))}
          </div>
          
          {/* Expandable Presets */}
          {controlConfig.expandable.map((group) => (
            <div
              key={group.id}
              className={`control-presets ${expandedControl === group.id ? 'visible' : ''}`}
            >
              <div className="presets-scroll-container">
                {group.items.map((preset, index) => (
                  <button
                    key={index}
                    className={`preset-button ${activePreset === `${group.id}-${index}` ? 'active' : ''}`}
                    onClick={() => {
                      setActivePreset(`${group.id}-${index}`);
                      handleServiceCall(group.service, preset.data);
                    }}
                    style={{
                      ...preset.style,
                      animationDelay: `${index * 30}ms`
                    }}
                    title={preset.label}
                  >
                    {preset.icon ? (
                      <span style={{ fontSize: '32px' }}>{preset.icon}</span>
                    ) : (
                      preset.label
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UniversalControlsTab;