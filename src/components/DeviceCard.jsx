// src/components/DeviceCard.jsx
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { translateState, formatSensorValue, isEntityActive } from '../utils/translations';
import { getDeviceIcon } from './AnimatedDeviceIcons';

export const DeviceCard = ({ device, viewMode = 'grid', onClick, index = 0, lang = 'de' }) => {
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef(null);

  const isActive = device.isActive !== undefined 
    ? device.isActive 
    : isEntityActive(device);

  const getDisplayState = () => {
    if (device.domain === 'sensor' && !isNaN(parseFloat(device.state))) {
      const formatted = formatSensorValue(device.state, device.attributes, lang);
      return formatted.displayText;
    }
    
    return translateState(
      device.state, 
      device.domain, 
      device.attributes?.device_class,
      lang
    );
  };

  const renderSensorValue = () => {
    if (device.domain === 'sensor' && !isNaN(parseFloat(device.state))) {
      const formatted = formatSensorValue(device.state, device.attributes, lang);
      return (
        <div className="sensor-value-display">
          <span className="sensor-value">{formatted.value}</span>
          {formatted.unit && <span className="sensor-unit">{formatted.unit}</span>}
        </div>
      );
    }
    
    return getDeviceIcon(device);
  };

  useEffect(() => {
    if (!cardRef.current) return;

    cardRef.current.style.opacity = '0';
    cardRef.current.style.transform = viewMode === 'grid' 
      ? 'translateY(30px) scale(0.85)' 
      : 'translateX(-20px)';

    const timer = setTimeout(() => {
      if (!cardRef.current) return;

      cardRef.current.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      cardRef.current.offsetHeight;
      
      cardRef.current.style.opacity = '1';
      cardRef.current.style.transform = viewMode === 'grid' 
        ? 'translateY(0) scale(1)' 
        : 'translateX(0)';
    }, index * 60);

    return () => clearTimeout(timer);
  }, [viewMode, index]);

  const handleMouseDown = () => {
    setIsPressed(true);
    if (cardRef.current) {
      cardRef.current.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.97)' }
      ], {
        duration: 100,
        easing: 'ease-out',
        fill: 'forwards'
      });
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    if (cardRef.current) {
      cardRef.current.animate([
        { transform: 'scale(0.97)' },
        { transform: 'scale(1)' }
      ], {
        duration: 150,
        easing: 'ease-out',
        fill: 'forwards'
      });
    }
  };

  const handleClick = () => {
    if (onClick) onClick(device);
  };

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <>
        <style>{`
          .device-list-item {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 16px;
            padding: 16px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 16px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }

          .device-list-item:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateX(5px);
            box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
          }

          .device-list-item.active {
            background: rgba(255, 255, 255, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .device-list-icon {
            width: 68px;
            height: 68px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 24px;
            color: rgba(255, 255, 255, 0.95);
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
          }

          .device-list-icon.icon-active {
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
          }

          .sensor-list-value {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
          }

          .sensor-list-value .value {
            font-size: 22px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1;
          }

          .sensor-list-value .unit {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            opacity: 0.8;
          }

          .device-list-content {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .device-list-area {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.7);
            opacity: 0.7;
            text-align: left;
            flex-shrink: 0;
            font-weight: 500;
            order: -1;
            line-height: 1.05em;
          }

          .device-list-name {
            font-size: 18px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            margin: 0;
            overflow: hidden;
            white-space: nowrap;
            background: linear-gradient(to right, rgba(255, 255, 255, 0.95) 80%, transparent 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.05em;
          }

          .device-list-status {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
            opacity: 0.8;
            line-height: 1.05em;
          }

          .device-list-item.active .device-list-status {
            color: rgba(255, 255, 255, 0.7);
            opacity: 1;
          }

          .device-list-quick-action {
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s ease;
            margin-left: 8px;
          }

          .device-list-quick-action:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .device-list-quick-action.active {
            background: rgba(255, 255, 255, 0.35);
          }

          .device-list-quick-action svg {
            width: 18px;
            height: 18px;
            stroke: rgba(255, 255, 255, 0.7);
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          @media (max-width: 768px) {
            .device-list-item {
              padding: 10px 12px;
            }

            .device-list-icon {
              width: 48px;
              height: 48px;
            }

            .device-list-area,
            .device-list-name,
            .device-list-status {
              font-size: 14px;
            }
          }
        `}</style>
        <div 
          ref={cardRef}
          className={`device-list-item ${isActive ? 'active' : ''}`}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsPressed(false)}
          data-entity={device.id}
        >
          <div className={`device-list-icon ${isActive ? 'icon-active' : ''}`}>
            {device.domain === 'sensor' && !isNaN(parseFloat(device.state)) ? (
              <div className="sensor-list-value">
                <span className="value">{formatSensorValue(device.state, device.attributes, lang).value}</span>
                <span className="unit">{device.attributes?.unit_of_measurement || ''}</span>
              </div>
            ) : (
              getDeviceIcon(device)
            )}
          </div>
          <div className="device-list-content">
            <div className="device-list-area">{device.area || 'Kein Raum'}</div>
            <div className="device-list-name">{device.attributes?.friendly_name || device.name}</div>
            <div className="device-list-status">{getDisplayState()}</div>
          </div>
          {['light', 'climate', 'media_player', 'cover', 'fan', 'switch'].includes(device.domain) && (
            <button 
              className={`device-list-quick-action ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Quick action for:', device.id);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 6a7.75 7.75 0 1 0 10 0" />
                <path d="M12 4l0 8" />
              </svg>
            </button>
          )}
        </div>
      </>
    );
  }

  // GRID VIEW
  return (
    <>
      <style>{`
        .device-card {
          aspect-ratio: 1;
          width: 100%;
          min-width: 170px;
          min-height: 170px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 24px;
          padding: 20px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          box-sizing: border-box; 
        }

        .device-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .device-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
          background: rgba(255, 255, 255, 0.15);
        }

        .device-card:hover::before {
          opacity: 1;
        }

        .device-card.active {
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .device-card.active:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .device-icon {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          font-size: 36px;
          margin-bottom: auto;
          color: rgba(255, 255, 255, 0.95);
          opacity: 0.6;
        }

        .device-card.active .device-icon {
          opacity: 1;
        }

        .sensor-value-display {
          display: flex;
          align-items: flex-start;
          gap: 3px;
          margin-bottom: auto;
        }

        .sensor-value {
          font-size: 54px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1;
          opacity: 0.6;
        }

        .sensor-unit {
          font-size: 21px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          opacity: 0.5;
          margin-top: 6px;
        }

        .device-card.active .sensor-value {
          opacity: 1;
        }

        .device-card.active .sensor-unit {
          opacity: 0.8;
        }

        .device-info {
          display: flex;
          flex-direction: column;
          gap: 0;
          text-align: left;
          width: 100%;
        }

        .device-area,
        .device-name,
        .device-state {
          font-size: 20px;
          line-height: 1.15;
          margin: 0;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }

        .device-area {
          color: rgba(255, 255, 255, 0.7);
          opacity: 0.5;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.7) 80%, transparent 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .device-name {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          opacity: 0.6;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.95) 80%, transparent 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .device-state {
          color: rgba(255, 255, 255, 0.7);
          opacity: 0.5;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.7) 85%, transparent 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .device-card.active .device-area {
          opacity: 0.85;
        }

        .device-card.active .device-name {
          opacity: 1;
        }

        .device-card.active .device-state {
          opacity: 0.85;
        }

        @media (max-width: 768px) {
          .device-area,
          .device-name,
          .device-state {
            font-size: 16px;
          }

          .sensor-value {
            font-size: 48px;
          }

          .sensor-unit {
            font-size: 19px;
          }
        }

        @media (max-width: 480px) {
          .device-card {
            padding: 16px;
          }

          .device-area,
          .device-name,
          .device-state {
            font-size: 14px;
          }

          .sensor-value {
            font-size: 42px;
          }

          .sensor-unit {
            font-size: 18px;
          }

          .device-icon {
            font-size: 32px;
          }
        }
      `}</style>
      <div 
        ref={cardRef}
        className={`device-card ${isActive ? 'active' : ''} ${device.domain === 'sensor' ? 'sensor-card' : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPressed(false)}
        data-entity={device.id}
      >
        {renderSensorValue()}
        <div className="device-info">
          <div className="device-area">{device.area || 'Kein Raum'}</div>
          <div className="device-name">{device.attributes?.friendly_name || device.name}</div>
          <div className="device-state">{getDisplayState()}</div>
        </div>
      </div>
    </>
  );
};

// Demo component for testing
export const DeviceCardsDemo = ({ devices = [] }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [lang, setLang] = useState('de');

  const handleDeviceClick = (device) => {
    console.log('Device clicked:', device);
  };

  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        :root {
          --glass-blur-amount: 20px;
          --glass-border-color: rgba(255, 255, 255, 0.2);
          --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          --accent: #007AFF;
          --accent-rgb: 0, 122, 255;
          --accent-light: rgba(255, 255, 255, 0.35);
          --text-primary: rgba(255, 255, 255, 0.95);
          --text-secondary: rgba(255, 255, 255, 0.7);
        }

        * {
          box-sizing: border-box;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* View Toggle */
        .view-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          justify-content: center;
        }

        .toggle-button {
          padding: 8px 16px;
          border: 1px solid var(--glass-border-color);
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .toggle-button.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        /* Grid Container - WICHTIG: Hier ist das responsive Grid definiert */
        .results-grid {
          display: grid;
          gap: 20px;
          width: 100%;
          animation: fadeIn 0.5s ease;
        }

        /* Desktop: Max 4 Spalten */
        @media (min-width: 1024px) {
          .results-grid {
            grid-template-columns: repeat(4, 1fr);
            max-width: 100%;
          }
        }

        /* Tablet: Max 3 Spalten */
        @media (min-width: 768px) and (max-width: 1023px) {
          .results-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(170px, calc(33.333% - 14px)), 1fr));
          }
        }

        /* Mobile groß: Max 2 Spalten */
        @media (min-width: 480px) and (max-width: 767px) {
          .results-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(170px, calc(50% - 10px)), 1fr));
          }
        }

        /* Mobile klein: Max 2 Spalten */
        @media (max-width: 479px) {
          .results-grid {
            grid-template-columns: repeat(auto-fill, minmax(min(170px, calc(50% - 10px)), 1fr));
          }
        }

        /* List Container */
        .results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Language Toggle */
        .lang-toggle {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          justify-content: center;
        }

        .lang-button {
          padding: 4px 12px;
          border: 1px solid var(--glass-border-color);
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .lang-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .lang-button.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
      `}</style>

      <div className="container">
        {/* Language Toggle */}
        <div className="lang-toggle">
          <button 
            className={`lang-button ${lang === 'de' ? 'active' : ''}`}
            onClick={() => setLang('de')}
          >
            DE
          </button>
          <button 
            className={`lang-button ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button 
            className={`toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
          <button 
            className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>

        {/* Device Cards */}
        {viewMode === 'grid' ? (
          <div className="results-grid">
            {devices.map((device, index) => (
              <DeviceCard 
                key={device.id}
                device={device}
                viewMode={viewMode}
                onClick={handleDeviceClick}
                index={index}
                lang={lang}
              />
            ))}
          </div>
        ) : (
          <div className="results-list">
            {devices.map((device, index) => (
              <DeviceCard 
                key={device.id}
                device={device}
                viewMode={viewMode}
                onClick={handleDeviceClick}
                index={index}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};