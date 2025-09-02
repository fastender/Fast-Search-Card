// src/components/tabs/ActionsTab.jsx
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

export const ActionsTab = ({ item, onActionExecute, onActionNavigate, favoriteActions = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localFavorites, setLocalFavorites] = useState(favoriteActions);
  const scrollContainerRef = useRef(null);

  // Default item if none provided
  const defaultItem = {
    entity_id: 'light.wohnzimmer',
    domain: 'light',
    area: 'Wohnzimmer',
    attributes: {
      friendly_name: 'Wohnzimmer Licht'
    }
  };
  
  const entity = { ...defaultItem, ...item };

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Generate mock actions - FILTERED by entity relevance
  const generateMockActions = () => {
    const entityArea = entity.area || 'Wohnzimmer';
    const entityDomain = entity.domain;
    const entityId = entity.entity_id;
    
    // All available scenes
    const allScenes = [
      { 
        id: 'scene.filmabend', 
        name: 'Filmabend', 
        area: 'Wohnzimmer',
        icon: '🎬',
        entities: ['light.wohnzimmer', 'media_player.tv', 'cover.wohnzimmer'] 
      },
      { 
        id: 'scene.romantik', 
        name: 'Romantik', 
        area: 'Schlafzimmer',
        icon: '💕',
        entities: ['light.schlafzimmer', 'light.nachttisch'] 
      },
      { 
        id: 'scene.party', 
        name: 'Party', 
        area: 'Alle Räume',
        icon: '🎉',
        entities: ['light.*', 'media_player.*'] 
      },
      { 
        id: 'scene.gute_nacht', 
        name: 'Gute Nacht', 
        area: 'Haus',
        icon: '🌙',
        entities: ['light.*', 'cover.*', 'lock.*'] 
      },
      { 
        id: 'scene.aufwachen', 
        name: 'Aufwachen', 
        area: 'Schlafzimmer',
        icon: '☀️',
        entities: ['light.schlafzimmer', 'cover.schlafzimmer', 'climate.schlafzimmer'] 
      },
      {
        id: 'scene.arbeiten',
        name: 'Arbeiten',
        area: 'Büro',
        icon: '💻',
        entities: ['light.buero', 'climate.buero']
      },
      {
        id: 'scene.entspannen',
        name: 'Entspannen',
        area: 'Wohnzimmer',
        icon: '🛋️',
        entities: ['light.wohnzimmer', 'media_player.tv']
      }
    ];
    
    // All available scripts
    const allScripts = [
      { 
        id: 'script.alle_lichter_aus', 
        name: 'Alle Lichter aus', 
        area: 'Haus',
        icon: '💡',
        entities: ['light.*'] 
      },
      { 
        id: 'script.rollos_schliessen', 
        name: 'Rollläden schließen', 
        area: 'Haus',
        icon: '🪟',
        entities: ['cover.*'] 
      },
      { 
        id: 'script.heizung_nachtmodus', 
        name: 'Heizung Nachtmodus', 
        area: 'Haus',
        icon: '🌡️',
        entities: ['climate.*'] 
      },
      { 
        id: 'script.multimedia_aus', 
        name: 'Multimedia aus', 
        area: 'Haus',
        icon: '📺',
        entities: ['media_player.*'] 
      },
      {
        id: 'script.morgenroutine',
        name: 'Morgenroutine',
        area: 'Haus',
        icon: '🌅',
        entities: ['light.*', 'cover.*', 'climate.*']
      }
    ];
    
    // All available automations
    const allAutomations = [
      { 
        id: 'automation.motion_lights', 
        name: 'Bewegungslicht', 
        area: entityArea,
        icon: '🚶',
        entities: [`light.${entityArea.toLowerCase()}`, 'binary_sensor.motion_*'] 
      },
      { 
        id: 'automation.sunrise', 
        name: 'Sonnenaufgang Simulation', 
        area: 'Haus',
        icon: '🌄',
        entities: ['light.*', 'cover.*'] 
      },
      { 
        id: 'automation.vacation', 
        name: 'Urlaubsmodus', 
        area: 'Haus',
        icon: '✈️',
        entities: ['light.*', 'cover.*', 'climate.*'] 
      },
      {
        id: 'automation.energy_saving',
        name: 'Energiesparmodus',
        area: 'Haus',
        icon: '🔋',
        entities: ['light.*', 'climate.*', 'media_player.*']
      }
    ];
    
    // Filter actions based on entity relevance
    const isRelevant = (action) => {
      // Check if action is for same area
      if (action.area === entityArea || action.area === 'Haus' || action.area === 'Alle Räume') {
        return true;
      }
      
      // Check if action includes this entity
      return action.entities.some(e => {
        if (e === entityId) return true;
        if (e.endsWith('*')) {
          const prefix = e.slice(0, -1);
          return entityId.startsWith(prefix);
        }
        return false;
      });
    };
    
    // Map to standardized format with relevance scores
    const processedActions = [
      ...allScenes.filter(isRelevant).map(s => ({ 
        ...s, 
        type: 'scene',
        relevance: s.area === entityArea ? 100 : 50 
      })),
      ...allScripts.filter(isRelevant).map(s => ({ 
        ...s, 
        type: 'script',
        relevance: s.entities.includes(entityId) ? 90 : 40 
      })),
      ...allAutomations.filter(isRelevant).map(a => ({ 
        ...a, 
        type: 'automation',
        relevance: a.area === entityArea ? 80 : 30 
      }))
    ];
    
    // Sort by relevance and then by name
    return processedActions.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return a.name.localeCompare(b.name);
    });
  };

  // Load actions on mount
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const mockActions = generateMockActions();
      setActions(mockActions);
      setIsLoading(false);
    }, 300);
  }, [entity.entity_id]);

  // Toggle favorite
  const toggleFavorite = (actionId) => {
    setLocalFavorites(prev => 
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  // Get icon for action type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'scene': 
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 11V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V11M12 12V21M12 12C12 11.2348 12 10.8521 11.9239 10.5402C11.6469 9.4067 10.5937 8.35313 9.46018 8.07612C9.14794 8 8.76521 8 8 8C7.23479 8 6.85206 8 6.53982 8.07612C5.4063 8.35313 4.35313 9.4063 4.07612 10.5402C4 10.8521 4 11.2348 4 12M12 12C12 11.2348 12 10.8521 12.0761 10.5402C12.3531 9.4067 13.4063 8.35313 14.5402 8.07612C14.8521 8 15.2348 8 16 8C16.7652 8 17.1479 8 17.4602 8.07612C18.5937 8.35313 19.6469 9.4063 19.9239 10.5402C20 10.8521 20 11.2348 20 12" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 7.5V3M15 6L12 3L9 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'script':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 21L16.4 17.6C16.7314 17.2686 16.8971 17.1029 17.0896 17.0078C17.2598 16.9237 17.4458 16.8791 17.6343 16.8771C17.8478 16.8748 18.0579 16.9505 18.478 17.1019L21 18V7L17.6 10.4C17.2686 10.7314 17.1029 10.8971 16.9078 10.9896C16.7373 11.0697 16.5514 11.1144 16.3628 11.1163C16.1494 11.1186 15.9393 11.0429 15.5192 10.8915L12.9808 9.89153C12.5607 9.74006 12.3506 9.66432 12.1372 9.66629C11.9486 9.66817 11.7627 9.71281 11.5922 9.79289C11.3971 9.88542 11.2314 10.0511 10.9 10.3825L7.5 13.7825C7.16863 14.1139 7.00294 14.2796 6.80784 14.3721C6.63733 14.4522 6.4514 14.4969 6.26278 14.4987C6.04937 14.5009 5.83926 14.4252 5.41905 14.2737L3 13.5V4.6C3 3.84021 3 3.46031 3.13077 3.16405C3.24601 2.90366 3.43234 2.68234 3.66665 2.52538C3.93095 2.34883 4.28168 2.30472 4.98312 2.2165L12.2819 1.27291C12.6509 1.22728 12.8354 1.20446 13.0153 1.21893C13.1744 1.23179 13.3308 1.26564 13.4805 1.31961C13.6493 1.38051 13.807 1.47678 14.1223 1.66932L21 6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10L7 14L10 11L14 15L17 12L21 16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'automation':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 17.5C20 19.433 18.433 21 16.5 21C14.567 21 13 19.433 13 17.5C13 15.567 14.567 14 16.5 14C18.433 14 20 15.567 20 17.5ZM20 17.5H22M2 12C2 17.523 6.477 22 12 22" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 2.05V6M15.5 3.5L12.5 6.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Filter actions
  const filteredActions = actions.filter(action => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'favorites') return localFavorites.includes(action.id);
    if (selectedFilter === 'scenes') return action.type === 'scene';
    if (selectedFilter === 'scripts') return action.type === 'script';
    if (selectedFilter === 'automations') return action.type === 'automation';
    return false;
  });

  // Count actions per filter
  const counts = {
    all: actions.length,
    favorites: actions.filter(a => localFavorites.includes(a.id)).length,
    scenes: actions.filter(a => a.type === 'scene').length,
    scripts: actions.filter(a => a.type === 'script').length,
    automations: actions.filter(a => a.type === 'automation').length
  };

  // Handle horizontal scroll
  const handleWheel = (e) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div className={`actions-tab ${isVisible ? 'visible' : ''}`}>
      <style>{`
        .actions-tab {
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .actions-tab.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Action Bar */
        .action-bar-wrapper {
          margin: -16px -16px 16px;
          padding: 0 16px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .action-bar-container {
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .action-bar-container::-webkit-scrollbar {
          display: none;
        }

        .action-bar-inner {
          display: flex;
          gap: 8px;
          padding: 12px 0;
          min-width: min-content;
        }

        .filter-item {
          flex-shrink: 0;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          animation: slideIn 0.3s ease backwards;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .filter-item.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          border-color: rgba(59, 130, 246, 0.5);
          color: white;
        }

        .filter-item:hover:not(.active) {
          background: rgba(255, 255, 255, 0.08);
        }

        .filter-count {
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .filter-item.active .filter-count {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Actions Container */
        .actions-container {
          padding: 16px;
        }

        .actions-header {
          margin-bottom: 16px;
        }

        .actions-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          transition: all 0.2s ease;
          animation: fadeInUp 0.3s ease backwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-item:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(2px);
        }

        .action-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin-right: 12px;
          font-size: 20px;
        }

        .action-type-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          opacity: 0.6;
        }

        .action-type-icon svg {
          width: 100%;
          height: 100%;
        }

        .action-content {
          flex: 1;
        }

        .action-name {
          font-size: 14px;
          font-weight: 500;
          color: white;
          margin-bottom: 2px;
        }

        .action-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .action-type {
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .action-type.scene {
          background: rgba(147, 51, 234, 0.2);
          color: #a78bfa;
        }

        .action-type.script {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .action-type.automation {
          background: rgba(236, 72, 153, 0.2);
          color: #f9a8d4;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-favorite-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-favorite-btn.active svg {
          fill: #FFD700;
          stroke: #FFD700;
        }

        .action-favorite-btn:hover {
          transform: scale(1.2);
        }

        .action-execute-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.3);
          border-radius: 12px;
          color: #4CAF50;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-execute-btn:hover {
          background: rgba(76, 175, 80, 0.3);
          transform: scale(1.1);
        }

        .actions-loading,
        .actions-empty {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 14px;
        }
      `}</style>

      {/* Filter Bar */}
      <div className="action-bar-wrapper">
        <div 
          ref={scrollContainerRef}
          className="action-bar-container"
          onWheel={handleWheel}
        >
          <div className="action-bar-inner">
            {['all', 'favorites', 'scenes', 'scripts', 'automations'].map((filter, index) => (
              <button
                key={filter}
                className={`filter-item ${selectedFilter === filter ? 'active' : ''}`}
                onClick={() => setSelectedFilter(filter)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span>
                  {filter === 'all' ? 'Alle' :
                   filter === 'favorites' ? '⭐ Favoriten' :
                   filter === 'scenes' ? '🎬 Szenen' :
                   filter === 'scripts' ? '📜 Skripte' : '⚡ Automationen'}
                </span>
                <span className="filter-count">{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Container */}
      <div className="actions-container">
        <div className="actions-header">
          <h4>Verfügbare Aktionen für {entity.attributes?.friendly_name || entity.entity_id}</h4>
        </div>

        {isLoading ? (
          <div className="actions-loading">Lade Aktionen...</div>
        ) : filteredActions.length === 0 ? (
          <div className="actions-empty">
            <div className="empty-icon">
              {selectedFilter === 'favorites' ? '⭐' : '📭'}
            </div>
            <div className="empty-text">
              {selectedFilter === 'favorites' 
                ? 'Keine Favoriten markiert'
                : 'Keine Aktionen gefunden'}
            </div>
          </div>
        ) : (
          <div className="actions-list">
            {filteredActions.map((action, index) => (
              <div 
                key={action.id} 
                className="action-item"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="action-icon">{action.icon}</div>
                <div className="action-type-icon">{getTypeIcon(action.type)}</div>
                <div className="action-content">
                  <div className="action-name">{action.name}</div>
                  <div className="action-meta">
                    <span className={`action-type ${action.type}`}>
                      {action.type}
                    </span>
                    <span>{action.area}</span>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className={`action-favorite-btn ${localFavorites.includes(action.id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(action.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={localFavorites.includes(action.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                  <button
                    className="action-execute-btn"
                    onClick={() => {
                      onActionExecute?.(action);
                      // Visual feedback
                      const btn = event.currentTarget;
                      btn.style.transform = 'scale(0.95)';
                      setTimeout(() => {
                        btn.style.transform = '';
                      }, 200);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12L19 12M12 5L19 12L12 19" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionsTab;