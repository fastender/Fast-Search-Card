// src/components/DetailView.jsx
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { UniversalControlsTab } from './tabs/UniversalControlsTab';
import { HistoryTab } from './tabs/HistoryTab';  // <-- HIER
import { ScheduleTab } from './tabs/ScheduleTab';
import { ActionsTab } from './tabs/ActionsTab';

export const DetailView = ({ 
  item = {
    entity_id: 'light.wohnzimmer',
    domain: 'light',
    name: 'Wohnzimmer Licht',
    area: 'Wohnzimmer',
    state: 'on',
    attributes: {
      brightness: 180,
      color_temp: 350,
      friendly_name: 'Wohnzimmer Deckenlampe'
    }
  },
  isVisible = false,
  onBack,
  onToggleFavorite,
  onServiceCall,
  hass
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const detailPanelRef = useRef(null);
  const tabSliderRef = useRef(null);

  // Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tab Icons mit korrekten SVGs
  const tabIcons = [
    // Steuerung
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2V8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16V22" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12H8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 12H22" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.92896 4.92871L9.1716 9.17135" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.8284 14.8286L19.071 19.0713" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.92896 19.0713L9.1716 14.8286" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.8284 9.17139L19.071 4.92875" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // Schedule
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M12 6L12 12L18 12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // Verlauf
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M3 3V21H21" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 17L12 11L9 14L6 17" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // Actions
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M10 3H14V8L19 3.5L14 9V14H9L14 19L8 14H3V10H8L3 5L9 10V3H14" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ];

  // Helper Functions
  const getIconForDomain = (domain) => {
    const icons = {
      light: '💡',
      switch: '🔌',
      climate: '🌡️',
      cover: '🪟',
      media_player: '📺',
      vacuum: '🤖',
      fan: '💨',
      lock: '🔒',
      sensor: '📊',
      binary_sensor: '📡',
      camera: '📷'
    };
    return icons[domain] || '📦';
  };

  const getBackgroundStyle = (item) => {
    const gradients = {
      light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      climate: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      media_player: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      cover: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      vacuum: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    return { background: gradients[item.domain] || gradients.default };
  };

  const getStateText = (item) => {
    if (!item) return 'Unbekannt';
    
    if (item.domain === 'light') {
      if (item.state === 'on') {
        const brightness = item.attributes?.brightness;
        if (brightness) {
          const percent = Math.round((brightness / 255) * 100);
          return `An - ${percent}%`;
        }
        return 'An';
      }
      return 'Aus';
    }
    
    if (item.domain === 'climate') {
      const temp = item.attributes?.temperature;
      const current = item.attributes?.current_temperature;
      if (temp) {
        return `${current || '--'}° → ${temp}°C`;
      }
      return item.state;
    }
    
    if (item.domain === 'cover') {
      const position = item.attributes?.current_position;
      if (position !== undefined) {
        return `${position}% offen`;
      }
      return item.state === 'closed' ? 'Geschlossen' : 'Offen';
    }
    
    return item.state || 'Unbekannt';
  };

  const getStateDuration = (item) => {
    // In real implementation: calculate from last_changed
    const mockDurations = {
      'on': 'seit 2 Stunden',
      'off': 'seit 30 Minuten',
      'playing': 'seit 15 Minuten',
      'idle': 'seit 1 Stunde'
    };
    return mockDurations[item?.state] || 'gerade eben';
  };

  const getQuickStats = () => {
    const stats = [];
    
    if (item.domain === 'light') {
      if (item.attributes?.brightness) {
        const percent = Math.round((item.attributes.brightness / 255) * 100);
        stats.push(`${percent}% Helligkeit`);
      }
      if (item.attributes?.color_temp) {
        stats.push(`${item.attributes.color_temp} mired`);
      }
      if (item.state === 'on') {
        stats.push('Eingeschaltet');
      } else {
        stats.push('Ausgeschaltet');
      }
    }
    
    if (item.domain === 'climate') {
      if (item.attributes?.current_temperature) {
        stats.push(`${item.attributes.current_temperature}°C aktuell`);
      }
      if (item.attributes?.temperature) {
        stats.push(`${item.attributes.temperature}°C Ziel`);
      }
      if (item.attributes?.hvac_mode) {
        stats.push(item.attributes.hvac_mode);
      }
    }
    
    return stats.slice(0, 3);
  };

  // Tab slider animation
  useEffect(() => {
    if (tabSliderRef.current) {
      const tabWidth = 40;
      const gap = 6;
      const offset = activeTab * (tabWidth + gap);
      tabSliderRef.current.style.transform = `translateX(${offset}px)`;
      tabSliderRef.current.style.width = `${tabWidth}px`;
    }
  }, [activeTab]);

  // NEUE ANIMATION: Slide-in von rechts (wie in der JS)
  useEffect(() => {
    if (isVisible && detailPanelRef.current) {
      // Initial state
      detailPanelRef.current.style.clipPath = 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)';
      detailPanelRef.current.style.opacity = '0';
      
      // Force reflow
      detailPanelRef.current.offsetHeight;
      
      // Animate in - Slide von rechts nach links
      detailPanelRef.current.animate([
        { 
          clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
          opacity: 0,
          transform: 'translateX(0)'
        },
        { 
          clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
          opacity: 0.5,
          transform: 'translateX(0)'
        },
        { 
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          opacity: 1,
          transform: 'translateX(0)'
        }
      ], {
        duration: 350,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      });
    }
  }, [isVisible]);

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite?.(item.entity_id);
  };

  const handleBackClick = () => {
    if (detailPanelRef.current) {
      // Animate out - Slide nach rechts
      detailPanelRef.current.animate([
        { 
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          opacity: 1,
          transform: 'translateX(0)'
        },
        { 
          clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
          opacity: 0,
          transform: 'translateX(0)'
        }
      ], {
        duration: 250,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards'
      }).finished.then(() => {
        onBack?.();
      });
    } else {
      onBack?.();
    }
  };

  // Tab Content Components
  const renderTabContent = () => {
      const contents = [
        // Tab 0: Steuerung - Verwendet jetzt ControlTab
        <UniversalControlsTab item={item} onServiceCall={onServiceCall} />,
        
        // Tab 1: Zeitplan
        <ScheduleTab 
          item={item} 
          onTimerCreate={(data) => console.log('Timer:', data)}
          onScheduleCreate={(data) => console.log('Schedule:', data)}
        />,
        
        // Tab 2: Verlauf - HIER ÄNDERN
        <HistoryTab item={item} onDataRequest={(params) => console.log('Data request:', params)} />,
        
        // Tab 3: Aktionen
        <ActionsTab 
          item={item} 
          onActionExecute={(action) => console.log('Execute:', action)}
          onActionNavigate={(action) => console.log('Navigate:', action)}
          favoriteActions={[]}
        />
      ];
      
      return contents[activeTab] || contents[0];
    };

  if (!item) return null;

  return (
    <div 
      ref={detailPanelRef}
      className={`detail-panel ${isVisible ? 'visible' : ''}`}
      data-entity-id={item.entity_id}
    >
      <style>{`
        /* Main Container - ERSETZT das GANZE search-panel */
        .detail-panel {
          position: relative;
          width: 100%;
          height: 672px;
          min-height: 600px;
          background: rgba(50, 50, 60, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 35px; /* Gleich wie search-panel */
          display: flex;
          flex-direction: column;
          opacity: 0;
          pointer-events: none;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          margin: 0;
          padding: 0;
          
          /* Initial state für Animation */
          clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
        }

        .detail-panel.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Content Container */
        .detail-content {
          display: flex;
          flex: 1;
          overflow: hidden;
          height: 100%; /* Feste Höhe für den Content */
        }

        /* Linke Seite - 50% Breite */
        .detail-left {
          width: 50%;
          padding: 40px;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 35px 0 0 35px;
          box-sizing: border-box;
        }

        /* Header mit Back und Favorite */
        .detail-left-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .back-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .back-button svg {
          width: 20px;
          height: 20px;
          stroke: white;
        }

        .detail-left-title-info {
          flex: 1;
          text-align: center;
        }

        .detail-left-title-name {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .detail-left-title-area {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 4px 0 0 0;
          line-height: 1.2;
        }

        .favorite-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .favorite-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .favorite-button.active {
          background: rgba(255, 215, 0, 0.2);
          border-color: gold;
        }

        .favorite-button svg {
          width: 20px;
          height: 20px;
          stroke: white;
          fill: none;
        }

        .favorite-button.active svg {
          fill: gold;
          stroke: gold;
        }

        /* Icon Content */
        .icon-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .icon-background-wrapper {
          width: 260px;
          height: 260px;
          position: relative;
          margin-bottom: 25px;
        }

        .icon-background {
          width: 100%;
          height: 100%;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 70px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          background-size: cover;
          background-position: center;
        }

        /* Quick Stats */
        .detail-info-row {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .quick-stats {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 4px 0;
        }

        .quick-stats::-webkit-scrollbar {
          display: none;
        }

        .stat-item {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 8px 14px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Divider */
        .detail-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.15), transparent);
          margin: 40px 0;
        }

        /* Rechte Seite - 50% Breite */
        .detail-right {
          width: 50%;
          display: flex;
          flex-direction: column;
          border-radius: 0 35px 35px 0;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Desktop Tabs */
        .desktop-tabs {
          display: block;
          padding: 20px;
          padding-top: 25px;
        }

        .mobile-tabs {
          display: none;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .detail-header-info {
          text-align: left;
        }

        .detail-header-name {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: white;
          line-height: 1.3em;
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .detail-header-area {
          margin: 3px 0 0 0;
          font-size: 15px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.2em;
        }

        /* Tab Icons */
        .detail-tabs {
          position: relative;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 24px;
          display: inline-flex;
          gap: 6px;
          padding: 5px;
        }

        .tab-slider {
          position: absolute;
          top: 5px;
          height: calc(100% - 10px);
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 1;
        }

        .detail-tab {
          width: 40px;
          height: 40px;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.25s ease;
          z-index: 2;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }

        .detail-tab.active {
          color: white;
        }

        .detail-tab svg {
          width: 20px;
          height: 20px;
          stroke-width: 1.5;
        }

        /* Tab Content */
        #tab-content-container {
          flex-grow: 1;
          overflow-y: auto;
          padding: 20px;
          box-sizing: border-box;
          scrollbar-width: none;
        }

        #tab-content-container::-webkit-scrollbar {
          display: none;
        }

        /* MOBILE RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          .detail-panel {
            height: 500px; /* Etwas kleiner auf Mobile */
          }
          
          .desktop-tabs {
            display: none;
          }
          
          .mobile-tabs {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px;
            padding-top: 18px;
          }
          
          /* Mobile Tab Icons */
          .mobile-tabs .detail-tabs {
            position: relative;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 22px;
            display: inline-flex;
            gap: 5px;
            padding: 4px;
          }
          
          .mobile-tabs .tab-slider {
            position: absolute;
            top: 4px;
            height: calc(100% - 8px);
            background: rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 1;
            width: 36px;
          }
          
          .mobile-tabs .detail-tab {
            width: 36px;
            height: 36px;
            padding: 9px;
            border-radius: 50%;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.4);
            transition: color 0.25s ease;
            z-index: 2;
            border: none;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 0;
          }
          
          .mobile-tabs .detail-tab.active {
            color: white;
          }
          
          .mobile-tabs .detail-tab svg {
            width: 18px;
            height: 18px;
            stroke-width: 1.5;
          }
          
          /* Content wird untereinander angeordnet */
          .detail-content {
            flex-direction: column;
            height: 100%;
          }
          
          /* Divider wird horizontal */
          .detail-divider {
            width: calc(100% - 40px);
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent);
            margin: 10px auto;
            align-self: center;
          }
          
          /* Linke Seite Anpassungen */
          .detail-left {
            width: 100%;
            padding: 20px;
            flex: none;
            min-height: 260px;
            border-radius: 35px 35px 0 0;
          }
          
          .detail-left-header {
            margin-bottom: 20px;
          }
          
          .icon-background-wrapper {
            width: 160px;
            height: 160px;
            margin-bottom: 15px;
          }
          
          .icon-background {
            font-size: 50px;
            border-radius: 20px;
          }
          
          /* Rechte Seite Anpassungen */
          .detail-right {
            width: 100%;
            border-radius: 0 0 35px 35px;
            padding: 0;
            flex: 1;
            min-height: 200px;
          }
          
          #tab-content-container {
            padding: 15px;
          }
          
          /* Header Schriftgrößen anpassen */
          .detail-header-name {
            font-size: 15px;
            max-width: 180px;
          }
          
          .detail-header-area {
            font-size: 13px;
          }
          
          .detail-left-title-name {
            font-size: 15px;
          }
          
          .detail-left-title-area {
            font-size: 12px;
          }
          
          .back-button,
          .favorite-button {
            width: 36px;
            height: 36px;
          }
          
          .back-button svg,
          .favorite-button svg {
            width: 18px;
            height: 18px;
          }
          
          .stat-item {
            font-size: 11px;
            padding: 6px 12px;
          }
        }
      `}</style>

      <div className="detail-content">
        {/* LINKE SEITE */}
        <div className="detail-left">
          <div className="detail-left-header">
            <button className="back-button" onClick={handleBackClick}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
                <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="detail-left-title-info">
              <h3 className="detail-left-title-name">{item.name}</h3>
              <p className="detail-left-title-area">{item.area || 'Kein Raum'}</p>
            </div>
            
            <button 
              className={`favorite-button ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
                <path d="M22 8.86222C22 10.4087 21.4062 11.8941 20.3458 12.9929C17.9049 15.523 15.5374 18.1613 13.0053 20.5997C12.4249 21.1505 11.5042 21.1304 10.9488 20.5547L3.65376 12.9929C1.44875 10.7072 1.44875 7.01723 3.65376 4.73157C5.88044 2.42345 9.50794 2.42345 11.7346 4.73157L11.9998 5.00642L12.2648 4.73173C13.3324 3.6245 14.7864 3 16.3053 3C17.8242 3 19.2781 3.62444 20.3458 4.73157C21.4063 5.83045 22 7.31577 22 8.86222Z"/>
              </svg>
            </button>
          </div>
          
          <div className="icon-content">
            <div className="icon-background-wrapper">
              <div 
                className="icon-background"
                style={getBackgroundStyle(item)}
              >
                {getIconForDomain(item.domain)}
              </div>
            </div>
            
            <div className="detail-info-row">
              <div className="quick-stats">
                {getQuickStats().map((stat, index) => (
                  <div key={index} className="stat-item">{stat}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* DIVIDER */}
        <div className="detail-divider"></div>
        
        {/* RECHTE SEITE */}
        <div className="detail-right">
          {/* Mobile Tabs */}
          {isMobile && (
            <div className="mobile-tabs">
              <div className="detail-header-info">
                <h3 className="detail-header-name">{getStateText(item)}</h3>
                <p className="detail-header-area">{getStateDuration(item)}</p>
              </div>
              <div className="detail-tabs">
                <div ref={tabSliderRef} className="tab-slider"/>
                {tabIcons.map((icon, index) => (
                  <button
                    key={index}
                    className={`detail-tab ${activeTab === index ? 'active' : ''}`}
                    onClick={() => setActiveTab(index)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Desktop Tabs */}
          {!isMobile && (
            <div className="desktop-tabs">
              <div className="detail-header">
                <div className="detail-header-info">
                  <h3 className="detail-header-name">{getStateText(item)}</h3>
                  <p className="detail-header-area">{getStateDuration(item)}</p>
                </div>
                <div className="detail-tabs">
                  <div ref={tabSliderRef} className="tab-slider"/>
                  {tabIcons.map((icon, index) => (
                    <button
                      key={index}
                      className={`detail-tab ${activeTab === index ? 'active' : ''}`}
                      onClick={() => setActiveTab(index)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Content */}
          <div id="tab-content-container">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;