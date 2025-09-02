// src/components/tabs/ControlTab.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export const ControlTab = ({ item, onServiceCall }) => {
  // Render different controls based on device type
  const renderDeviceControls = () => {
    switch(item?.domain) {
      case 'light':
        return <LightControls item={item} onServiceCall={onServiceCall} />;
      case 'climate':
        return <ClimateControls item={item} onServiceCall={onServiceCall} />;
      case 'cover':
        return <CoverControls item={item} onServiceCall={onServiceCall} />;
      case 'media_player':
        return <MediaControls item={item} onServiceCall={onServiceCall} />;
      case 'fan':
        return <FanControls item={item} onServiceCall={onServiceCall} />;
      case 'switch':
        return <SwitchControls item={item} onServiceCall={onServiceCall} />;
      default:
        return <GenericControls item={item} onServiceCall={onServiceCall} />;
    }
  };

  return (
    <div className="control-tab">
      {renderDeviceControls()}
    </div>
  );
};

// Light Controls Component
const LightControls = ({ item, onServiceCall }) => {
  const [brightness, setBrightness] = useState(item?.attributes?.brightness || 128);
  const [colorTemp, setColorTemp] = useState(item?.attributes?.color_temp || 350);
  const [isOn, setIsOn] = useState(item?.state === 'on');

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    onServiceCall?.('light', newState ? 'turn_on' : 'turn_off', {
      entity_id: item.entity_id
    });
  };

  const handleBrightnessChange = (value) => {
    setBrightness(value);
    if (isOn) {
      onServiceCall?.('light', 'turn_on', {
        entity_id: item.entity_id,
        brightness: value
      });
    }
  };

  const handleColorTempChange = (value) => {
    setColorTemp(value);
    if (isOn) {
      onServiceCall?.('light', 'turn_on', {
        entity_id: item.entity_id,
        color_temp: value
      });
    }
  };

  return (
    <div className="light-controls">
      <style>{`
        .light-controls {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .main-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .power-button {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: ${isOn ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
          border: 2px solid ${isOn ? 'gold' : 'rgba(255, 255, 255, 0.2)'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: ${isOn ? '0 0 30px rgba(255, 215, 0, 0.3)' : 'none'};
        }

        .power-button:hover {
          transform: scale(1.05);
          box-shadow: ${isOn ? '0 0 40px rgba(255, 215, 0, 0.4)' : '0 0 20px rgba(255, 255, 255, 0.2)'};
        }

        .power-button svg {
          width: 50px;
          height: 50px;
          stroke: ${isOn ? 'gold' : 'rgba(255, 255, 255, 0.6)'};
          stroke-width: 2;
          fill: none;
        }

        .control-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 16px;
        }

        .control-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slider {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          position: relative;
          cursor: pointer;
        }

        .slider-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.8), gold);
          border-radius: 3px;
          transition: width 0.2s ease;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          cursor: grab;
          transition: left 0.2s ease;
        }

        .slider-thumb:active {
          cursor: grabbing;
          transform: translate(-50%, -50%) scale(1.1);
        }

        .slider-value {
          min-width: 45px;
          text-align: right;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .preset-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .preset-button {
          flex: 1;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .preset-button:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="main-toggle">
        <button className="power-button" onClick={handleToggle}>
          <svg viewBox="0 0 24 24">
            <path d="M12 2v10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22c5.523 0 10-4.477 10-10 0-3.11-1.423-5.886-3.658-7.72" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.342 4.28C6.107 6.114 4.684 8.89 4.684 12c0 5.523 4.477 10 10 10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {isOn && (
        <>
          <div className="control-section">
            <div className="control-label">Helligkeit</div>
            <div className="slider-container">
              <div className="slider" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const value = Math.round(percent * 255);
                handleBrightnessChange(Math.max(0, Math.min(255, value)));
              }}>
                <div className="slider-fill" style={{ width: `${(brightness / 255) * 100}%` }} />
                <div className="slider-thumb" style={{ left: `${(brightness / 255) * 100}%` }} />
              </div>
              <div className="slider-value">{Math.round((brightness / 255) * 100)}%</div>
            </div>
            <div className="preset-buttons">
              <button className="preset-button" onClick={() => handleBrightnessChange(64)}>25%</button>
              <button className="preset-button" onClick={() => handleBrightnessChange(128)}>50%</button>
              <button className="preset-button" onClick={() => handleBrightnessChange(192)}>75%</button>
              <button className="preset-button" onClick={() => handleBrightnessChange(255)}>100%</button>
            </div>
          </div>

          {item?.attributes?.supported_color_modes?.includes('color_temp') && (
            <div className="control-section">
              <div className="control-label">Farbtemperatur</div>
              <div className="slider-container">
                <div className="slider" style={{
                  background: 'linear-gradient(90deg, rgb(255, 200, 140), rgb(255, 255, 255), rgb(200, 220, 255))'
                }} onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  const value = Math.round(153 + percent * (500 - 153));
                  handleColorTempChange(value);
                }}>
                  <div className="slider-thumb" style={{ 
                    left: `${((colorTemp - 153) / (500 - 153)) * 100}%`,
                    background: 'white'
                  }} />
                </div>
                <div className="slider-value">{colorTemp}K</div>
              </div>
              <div className="preset-buttons">
                <button className="preset-button" onClick={() => handleColorTempChange(153)}>Warm</button>
                <button className="preset-button" onClick={() => handleColorTempChange(300)}>Neutral</button>
                <button className="preset-button" onClick={() => handleColorTempChange(500)}>Kalt</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Climate Controls Component
const ClimateControls = ({ item, onServiceCall }) => {
  const [temperature, setTemperature] = useState(item?.attributes?.temperature || 20);
  const [currentTemp] = useState(item?.attributes?.current_temperature || 20);
  const [hvacMode, setHvacMode] = useState(item?.attributes?.hvac_mode || 'off');

  const hvacModes = ['off', 'heat', 'cool', 'auto'];
  const modeIcons = {
    off: '⏻',
    heat: '🔥',
    cool: '❄️',
    auto: '♻️'
  };

  return (
    <div className="climate-controls">
      <style>{`
        .climate-controls {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .temperature-display {
          text-align: center;
          padding: 30px;
        }

        .current-temp {
          font-size: 48px;
          font-weight: 200;
          color: white;
          margin-bottom: 8px;
        }

        .current-temp-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .target-temp {
          margin-top: 20px;
          font-size: 24px;
          color: rgba(255, 255, 255, 0.8);
        }

        .temp-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .temp-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .temp-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .temp-value {
          font-size: 32px;
          font-weight: 300;
          color: white;
          min-width: 80px;
          text-align: center;
        }

        .hvac-modes {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .hvac-mode-button {
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .hvac-mode-button.active {
          background: rgba(0, 122, 255, 0.3);
          border-color: var(--accent);
        }

        .hvac-mode-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .hvac-mode-icon {
          font-size: 24px;
        }

        .hvac-mode-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
        }
      `}</style>

      <div className="temperature-display">
        <div className="current-temp">{currentTemp}°C</div>
        <div className="current-temp-label">Aktuelle Temperatur</div>
        
        <div className="target-temp">
          <div className="temp-controls">
            <button className="temp-button" onClick={() => {
              const newTemp = temperature - 0.5;
              setTemperature(newTemp);
              onServiceCall?.('climate', 'set_temperature', {
                entity_id: item.entity_id,
                temperature: newTemp
              });
            }}>−</button>
            <div className="temp-value">{temperature}°</div>
            <button className="temp-button" onClick={() => {
              const newTemp = temperature + 0.5;
              setTemperature(newTemp);
              onServiceCall?.('climate', 'set_temperature', {
                entity_id: item.entity_id,
                temperature: newTemp
              });
            }}>+</button>
          </div>
        </div>
      </div>

      <div className="hvac-modes">
        {hvacModes.map(mode => (
          <button
            key={mode}
            className={`hvac-mode-button ${hvacMode === mode ? 'active' : ''}`}
            onClick={() => {
              setHvacMode(mode);
              onServiceCall?.('climate', 'set_hvac_mode', {
                entity_id: item.entity_id,
                hvac_mode: mode
              });
            }}
          >
            <div className="hvac-mode-icon">{modeIcons[mode]}</div>
            <div className="hvac-mode-label">{mode}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Cover Controls Component  
const CoverControls = ({ item, onServiceCall }) => {
  const [position, setPosition] = useState(item?.attributes?.current_position || 0);

  return (
    <div className="cover-controls">
      <style>{`
        .cover-controls {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cover-visual {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 20px;
          height: 200px;
          position: relative;
          overflow: hidden;
        }

        .window-frame {
          width: 100%;
          height: 100%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .cover-shade {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, 
            rgba(100, 100, 100, 0.9) 0%, 
            rgba(80, 80, 80, 0.9) 100%);
          border-radius: 6px 6px 0 0;
          transition: height 0.5s ease;
        }

        .cover-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .cover-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .cover-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .cover-button svg {
          width: 24px;
          height: 24px;
          stroke: white;
          stroke-width: 2;
          fill: none;
        }

        .position-display {
          text-align: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }

        .position-value {
          font-size: 36px;
          font-weight: 200;
          color: white;
        }

        .position-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
      `}</style>

      <div className="cover-visual">
        <div className="window-frame">
          <div className="cover-shade" style={{ height: `${100 - position}%` }} />
        </div>
      </div>

      <div className="position-display">
        <div className="position-value">{position}%</div>
        <div className="position-label">Geöffnet</div>
      </div>

      <div className="cover-buttons">
        <button className="cover-button" onClick={() => {
          onServiceCall?.('cover', 'open_cover', {
            entity_id: item.entity_id
          });
          setPosition(100);
        }}>
          <svg viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <button className="cover-button" onClick={() => {
          onServiceCall?.('cover', 'stop_cover', {
            entity_id: item.entity_id
          });
        }}>
          <svg viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <button className="cover-button" onClick={() => {
          onServiceCall?.('cover', 'close_cover', {
            entity_id: item.entity_id
          });
          setPosition(0);
        }}>
          <svg viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Media Controls Component
const MediaControls = ({ item, onServiceCall }) => {
  const [isPlaying, setIsPlaying] = useState(item?.state === 'playing');
  const [volume, setVolume] = useState(Math.round((item?.attributes?.volume_level || 0.5) * 100));

  return (
    <div className="media-controls">
      <style>{`
        .media-controls {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .media-info {
          text-align: center;
          padding: 20px;
        }

        .media-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
        }

        .media-artist {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .playback-controls {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
        }

        .playback-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .playback-button.primary {
          width: 64px;
          height: 64px;
          background: rgba(0, 122, 255, 0.3);
        }

        .playback-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .playback-button svg {
          width: 20px;
          height: 20px;
          stroke: white;
          stroke-width: 2;
          fill: white;
        }

        .playback-button.primary svg {
          width: 24px;
          height: 24px;
        }

        .volume-control {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 16px;
        }
      `}</style>

      <div className="media-info">
        <div className="media-title">{item?.attributes?.media_title || item.name}</div>
        <div className="media-artist">{item?.attributes?.media_artist || 'Keine Wiedergabe'}</div>
      </div>

      <div className="playback-controls">
        <button className="playback-button" onClick={() => {
          onServiceCall?.('media_player', 'media_previous_track', {
            entity_id: item.entity_id
          });
        }}>
          <svg viewBox="0 0 24 24">
            <polygon points="11 19 2 12 11 5 11 19"/>
            <polygon points="22 19 13 12 22 5 22 19"/>
          </svg>
        </button>

        <button className={`playback-button primary`} onClick={() => {
          const action = isPlaying ? 'media_pause' : 'media_play';
          setIsPlaying(!isPlaying);
          onServiceCall?.('media_player', action, {
            entity_id: item.entity_id
          });
        }}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        <button className="playback-button" onClick={() => {
          onServiceCall?.('media_player', 'media_next_track', {
            entity_id: item.entity_id
          });
        }}>
          <svg viewBox="0 0 24 24">
            <polygon points="13 19 22 12 13 5 13 19"/>
            <polygon points="2 19 11 12 2 5 2 19"/>
          </svg>
        </button>
      </div>

      <div className="volume-control">
        <div className="control-label">Lautstärke</div>
        <div className="slider-container">
          <div className="slider" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const value = Math.round(percent * 100);
            setVolume(value);
            onServiceCall?.('media_player', 'volume_set', {
              entity_id: item.entity_id,
              volume_level: value / 100
            });
          }}>
            <div className="slider-fill" style={{ width: `${volume}%` }} />
            <div className="slider-thumb" style={{ left: `${volume}%` }} />
          </div>
          <div className="slider-value">{volume}%</div>
        </div>
      </div>
    </div>
  );
};

// Generic Controls for other device types
const GenericControls = ({ item, onServiceCall }) => {
  const [isOn, setIsOn] = useState(item?.state === 'on');

  return (
    <div className="generic-controls">
      <style>{`
        .generic-controls {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .state-display {
          text-align: center;
        }

        .state-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .state-text {
          font-size: 24px;
          color: white;
          margin-bottom: 8px;
        }

        .state-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>

      <div className="state-display">
        <div className="state-icon">{item?.icon || '📦'}</div>
        <div className="state-text">{item?.state || 'Unbekannt'}</div>
        <div className="state-label">{item?.entity_id}</div>
      </div>

      {(item?.domain === 'switch' || item?.domain === 'input_boolean') && (
        <button className="power-button" onClick={() => {
          const newState = !isOn;
          setIsOn(newState);
          onServiceCall?.(item.domain, newState ? 'turn_on' : 'turn_off', {
            entity_id: item.entity_id
          });
        }}>
          <svg viewBox="0 0 24 24">
            <path d="M12 2v10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22c5.523 0 10-4.477 10-10 0-3.11-1.423-5.886-3.658-7.72" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.342 4.28C6.107 6.114 4.684 8.89 4.684 12c0 5.523 4.477 10 10 10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

// Fan Controls Component
const FanControls = ({ item, onServiceCall }) => {
  const [isOn, setIsOn] = useState(item?.state === 'on');
  const [speed, setSpeed] = useState(item?.attributes?.percentage || 0);

  return (
    <div className="fan-controls">
      <style>{`
        .fan-controls {
          padding: 20px;
        }
        
        .fan-icon {
          text-align: center;
          font-size: 64px;
          margin: 40px 0;
          animation: ${isOn ? 'spin 3s linear infinite' : 'none'};
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="fan-icon">💨</div>
      
      <div className="control-section">
        <div className="control-label">Geschwindigkeit</div>
        <div className="slider-container">
          <div className="slider" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const value = Math.round(percent * 100);
            setSpeed(value);
            onServiceCall?.('fan', 'set_percentage', {
              entity_id: item.entity_id,
              percentage: value
            });
          }}>
            <div className="slider-fill" style={{ width: `${speed}%` }} />
            <div className="slider-thumb" style={{ left: `${speed}%` }} />
          </div>
          <div className="slider-value">{speed}%</div>
        </div>
      </div>
    </div>
  );
};

// Switch Controls Component  
const SwitchControls = ({ item, onServiceCall }) => {
  const [isOn, setIsOn] = useState(item?.state === 'on');

  return (
    <div className="switch-controls">
      <div className="main-toggle">
        <button className="power-button" onClick={() => {
          const newState = !isOn;
          setIsOn(newState);
          onServiceCall?.('switch', newState ? 'turn_on' : 'turn_off', {
            entity_id: item.entity_id
          });
        }}>
          <svg viewBox="0 0 24 24">
            <path d="M12 2v10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22c5.523 0 10-4.477 10-10 0-3.11-1.423-5.886-3.658-7.72" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.342 4.28C6.107 6.114 4.684 8.89 4.684 12c0 5.523 4.477 10 10 10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ControlTab;