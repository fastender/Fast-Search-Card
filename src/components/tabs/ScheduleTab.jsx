// src/components/tabs/ScheduleTab.jsx
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

export const ScheduleTab = ({ item, onTimerCreate, onScheduleCreate }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedMode, setExpandedMode] = useState(null);
  const [pickerMode, setPickerMode] = useState(null); // 'timer' or 'schedule'
  const [timeValue, setTimeValue] = useState({ hours: 0, minutes: 30, format: '24h' });
  const [selectedDays, setSelectedDays] = useState([]);
  const [activeTimers, setActiveTimers] = useState([]);
  const [activeSchedules, setActiveSchedules] = useState([]);
  
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const entity = item || { entity_id: 'unknown', name: 'Gerät', domain: 'light' };

  // Initialize with mock data
  useEffect(() => {
    // Mock timers
    setActiveTimers([
      {
        id: 1,
        name: `${entity.name} Timer`,
        time: '23:30',
        remaining: 15,
        type: 'timer',
        action: 'turn_off'
      }
    ]);
    
    // Mock schedules
    setActiveSchedules([
      {
        id: 1,
        name: `${entity.name} Morgenroutine`,
        time: '07:00',
        days: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
        enabled: true,
        type: 'schedule',
        action: 'turn_on'
      },
      {
        id: 2,
        name: `${entity.name} Abends`,
        time: '22:00',
        days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        enabled: true,
        type: 'schedule',
        action: 'turn_off'
      }
    ]);
  }, [entity.name]);

  // Combined list based on active tab
  const getFilteredItems = () => {
    if (activeTab === 'all') {
      return [...activeTimers, ...activeSchedules];
    } else if (activeTab === 'timer') {
      return activeTimers;
    } else {
      return activeSchedules;
    }
  };

  // Get time display for picker
  const getDisplayTime = () => {
    if (pickerMode === 'timer') {
      return {
        hours: String(timeValue.hours).padStart(2, '0'),
        minutes: String(timeValue.minutes).padStart(2, '0'),
        suffix: 'h'
      };
    }
    
    // Schedule mode with AM/PM
    let displayHours = timeValue.hours;
    let suffix = '';
    
    if (timeValue.format !== '24h') {
      suffix = timeValue.format.toUpperCase();
      if (timeValue.format === 'pm' && displayHours < 12) {
        displayHours += 12;
      } else if (timeValue.format === 'am' && displayHours >= 12) {
        displayHours -= 12;
      }
      
      // Convert for display (12h format)
      let display12 = displayHours;
      if (displayHours === 0) display12 = 12;
      else if (displayHours > 12) display12 = displayHours - 12;
      
      return {
        hours: String(display12).padStart(2, '0'),
        minutes: String(timeValue.minutes).padStart(2, '0'),
        suffix
      };
    }
    
    return {
      hours: String(displayHours).padStart(2, '0'),
      minutes: String(timeValue.minutes).padStart(2, '0'),
      suffix: ''
    };
  };

  // Scroll to value
  const scrollToValue = (type, value) => {
    const scrollRef = type === 'hours' ? hourScrollRef : minuteScrollRef;
    if (!scrollRef.current) return;
    
    const itemHeight = 44;
    const offset = type === 'hours' 
      ? value * itemHeight 
      : (value / 5) * itemHeight; // Minutes are in 5-minute steps
    
    scrollRef.current.scrollTop = offset - itemHeight; // Center the selected value
  };

  // Handle scroll
  const handleScroll = (type) => {
    const scrollRef = type === 'hours' ? hourScrollRef : minuteScrollRef;
    if (!scrollRef.current) return;
    
    const itemHeight = 44;
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round((scrollTop + itemHeight) / itemHeight);
    
    if (type === 'hours') {
      const maxHours = pickerMode === 'timer' ? 23 : 23;
      const newHours = Math.max(0, Math.min(maxHours, index));
      setTimeValue(prev => ({ ...prev, hours: newHours }));
    } else {
      const minuteValue = Math.max(0, Math.min(11, index)) * 5;
      setTimeValue(prev => ({ ...prev, minutes: minuteValue }));
    }
  };

  // Get icon based on type
  const getIcon = (itemOrType) => {
    const isTimer = itemOrType?.type === 'timer' || itemOrType === 'timer';
    if (isTimer) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 12C15.866 12 19 8.86599 19 5H5C5 8.86599 8.13401 12 12 12ZM12 12C15.866 12 19 15.134 19 19H5C5 15.134 8.13401 12 12 12Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 2L12 2L19 2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 22H12L19 22" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 2L15 2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 10L12 14" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 16.4183 6 12 6C7.58172 6 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  // Get time display text
  const getTimeText = (item) => {
    const isTimer = item.type === 'timer';
    
    if (isTimer) {
      return `Um ${item.time} - Noch ${item.remaining} Min`;
    }
    
    if (item.days) {
      const daysText = item.days.join(', ');
      return `Um ${item.time} - ${daysText}`;
    }
    
    return `Um ${item.time}`;
  };

  // Handle power button click
  const handlePowerClick = (powerType) => {
    const mode = activeTab === 'all' || activeTab === 'schedule' ? 'schedule' : 'timer';
    setPickerMode(mode);
    setExpandedMode(`${mode}-${powerType}`);
    
    if (mode === 'timer') {
      setTimeValue({ hours: 0, minutes: 30, format: '24h' });
    } else {
      setTimeValue({ hours: 18, minutes: 0, format: '24h' });
      setSelectedDays([]);
    }
    
    setTimeout(() => {
      if (hourScrollRef.current && minuteScrollRef.current) {
        scrollToValue('hours', timeValue.hours);
        scrollToValue('minutes', timeValue.minutes);
      }
    }, 300);
  };
  
  // Close expanded view
  const closeExpanded = () => {
    setExpandedMode(null);
    setPickerMode(null);
    setSelectedDays([]);
  };

  // Create timer/schedule
  const handleConfirm = () => {
    if (pickerMode === 'timer') {
      const totalMinutes = timeValue.hours * 60 + timeValue.minutes;
      onTimerCreate?.({
        entity_id: entity.entity_id,
        duration: totalMinutes,
        action: expandedMode?.includes('off') ? 'turn_off' : 'turn_on'
      });
      
      const newTimer = {
        id: Date.now(),
        name: `${entity.name} Timer`,
        time: new Date(Date.now() + totalMinutes * 60000).toLocaleTimeString('de-DE', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        remaining: totalMinutes,
        type: 'timer',
        action: expandedMode?.includes('off') ? 'turn_off' : 'turn_on'
      };
      setActiveTimers(prev => [...prev, newTimer]);
    } else {
      onScheduleCreate?.({
        entity_id: entity.entity_id,
        time: `${String(timeValue.hours).padStart(2, '0')}:${String(timeValue.minutes).padStart(2, '0')}`,
        days: selectedDays.length > 0 ? selectedDays : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        action: expandedMode?.includes('off') ? 'turn_off' : 'turn_on'
      });
      
      const newSchedule = {
        id: Date.now(),
        name: `${entity.name} Zeitplan`,
        time: `${String(timeValue.hours).padStart(2, '0')}:${String(timeValue.minutes).padStart(2, '0')}`,
        days: selectedDays.length > 0 ? selectedDays : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        enabled: true,
        type: 'schedule',
        action: expandedMode?.includes('off') ? 'turn_off' : 'turn_on'
      };
      setActiveSchedules(prev => [...prev, newSchedule]);
    }
    
    closeExpanded();
  };

  // Delete timer
  const deleteTimer = (timerId) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
  };

  // Toggle schedule
  const toggleSchedule = (scheduleId) => {
    setActiveSchedules(prev => 
      prev.map(s => s.id === scheduleId ? { ...s, enabled: !s.enabled } : s)
    );
  };

  // Delete schedule
  const deleteSchedule = (scheduleId) => {
    setActiveSchedules(prev => prev.filter(s => s.id !== scheduleId));
  };

  return (
    <div className="scheduler-tab">
      <style>{`
        .scheduler-tab {
          padding: 16px;
        }

        /* Tab Filter */
        .scheduler-filter {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .filter-tab {
          flex: 1;
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .filter-tab.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          color: white;
        }

        /* Power Buttons Grid */
        .scheduler-power-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .power-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .power-button.turn-on {
          background: linear-gradient(135deg, rgba(76, 217, 100, 0.1), rgba(52, 199, 89, 0.1));
          border-color: rgba(76, 217, 100, 0.3);
        }

        .power-button.turn-off {
          background: linear-gradient(135deg, rgba(255, 59, 48, 0.1), rgba(255, 45, 85, 0.1));
          border-color: rgba(255, 59, 48, 0.3);
        }

        .power-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .power-icon {
          width: 24px;
          height: 24px;
        }

        .power-button.turn-on .power-icon {
          stroke: #4cd964;
        }

        .power-button.turn-off .power-icon {
          stroke: #ff3b30;
        }

        .power-text {
          font-size: 16px;
          font-weight: 500;
        }

        /* Items List */
        .scheduler-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .scheduler-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .scheduler-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .item-icon {
          width: 32px;
          height: 32px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-right: 12px;
        }

        .item-icon svg {
          width: 100%;
          height: 100%;
          stroke: rgba(255, 255, 255, 0.7);
        }

        .item-content {
          flex: 1;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: white;
          margin-bottom: 2px;
        }

        .item-time {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .item-toggle {
          width: 44px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .item-toggle.enabled {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }

        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .item-toggle.enabled .toggle-knob {
          transform: translateX(20px);
        }

        .item-delete {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .item-delete:hover {
          background: rgba(255, 59, 48, 0.2);
          color: #ff3b30;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.3);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        /* Expanded Picker */
        .scheduler-expanded {
          margin-top: 20px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scheduler-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .scheduler-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .scheduler-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Mode Toggle */
        .scheduler-mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .scheduler-mode-btn {
          flex: 1;
          padding: 8px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .scheduler-mode-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        /* iOS Style Time Picker */
        .ios-time-picker-wrapper {
          position: relative;
          margin-bottom: 24px;
        }

        .ios-time-display-container {
          position: relative;
        }

        .ios-time-display {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 48px;
          font-weight: 200;
          color: white;
        }

        .ios-time-separator {
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .format-toggle-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .format-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .ios-time-picker {
          display: flex;
          gap: 16px;
          justify-content: center;
          height: 176px; /* 4 items * 44px */
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 16px;
          position: relative;
        }

        .ios-picker-column {
          flex: 1;
          max-width: 100px;
          position: relative;
        }

        .ios-picker-label {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .ios-scroll-container {
          height: 100%;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }

        .ios-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .ios-scroll-spacer {
          height: 44px;
        }

        .ios-picker-item {
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          scroll-snap-align: center;
          transition: all 0.2s ease;
        }

        .ios-picker-item.selected {
          color: white;
          font-size: 24px;
          font-weight: 300;
        }

        /* Selection Indicator */
        .ios-time-picker::before,
        .ios-time-picker::after {
          content: '';
          position: absolute;
          left: 16px;
          right: 16px;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }

        .ios-time-picker::before {
          top: calc(50% - 22px);
        }

        .ios-time-picker::after {
          top: calc(50% + 22px);
        }

        /* Weekdays */
        .scheduler-weekdays {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .scheduler-weekday-btn {
          flex: 1;
          padding: 12px 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .scheduler-weekday-btn.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          border-color: rgba(59, 130, 246, 0.5);
          color: white;
        }

        /* Action Buttons */
        .scheduler-actions {
          display: flex;
          gap: 12px;
        }

        .scheduler-btn {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .scheduler-btn.cancel {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .scheduler-btn.confirm {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }

        .scheduler-btn:hover {
          transform: translateY(-1px);
        }

        .scheduler-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      {/* Tab Filter */}
      <div className="scheduler-filter">
        {['all', 'timer', 'schedule'].map(tab => (
          <button
            key={tab}
            className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'Alle' : tab === 'timer' ? 'Timer' : 'Zeitpläne'}
          </button>
        ))}
      </div>

      {/* Power Buttons */}
      {!expandedMode && (
        <div className="scheduler-power-grid">
          <button className="power-button turn-on" onClick={() => handlePowerClick('on')}>
            <svg className="power-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M12 2v10M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="power-text">Einschalten</span>
          </button>
          
          <button className="power-button turn-off" onClick={() => handlePowerClick('off')}>
            <svg className="power-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M12 2v10M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="power-text">Ausschalten</span>
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="scheduler-items">
        {getFilteredItems().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'timer' ? '⏱️' : activeTab === 'schedule' ? '📅' : '⏰'}
            </div>
            <div>Keine {activeTab === 'timer' ? 'Timer' : activeTab === 'schedule' ? 'Zeitpläne' : 'Einträge'}</div>
          </div>
        ) : (
          getFilteredItems().map(item => (
            <div key={item.id} className="scheduler-item">
              <div className="item-icon">{getIcon(item)}</div>
              <div className="item-content">
                <div className="item-name">{item.name}</div>
                <div className="item-time">{getTimeText(item)}</div>
              </div>
              <div className="item-actions">
                {item.type === 'schedule' && (
                  <div 
                    className={`item-toggle ${item.enabled ? 'enabled' : ''}`}
                    onClick={() => toggleSchedule(item.id)}
                  >
                    <div className="toggle-knob" />
                  </div>
                )}
                <button 
                  className="item-delete"
                  onClick={() => item.type === 'timer' ? deleteTimer(item.id) : deleteSchedule(item.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expanded Time Picker */}
      {expandedMode && (
        <div className="scheduler-expanded">
          <div className="scheduler-header">
            <h3 className="scheduler-title">{entity.name}</h3>
            <p className="scheduler-subtitle">
              {pickerMode === 'timer' ? 'Timer einstellen' : 'Zeitplan erstellen'}
              {expandedMode?.includes('on') ? ' - Einschalten' : ' - Ausschalten'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="scheduler-mode-toggle">
            <button
              className={`scheduler-mode-btn ${pickerMode === 'timer' ? 'active' : ''}`}
              onClick={() => {
                setPickerMode('timer');
                setTimeValue({ hours: 0, minutes: 30, format: '24h' });
                setTimeout(() => {
                  scrollToValue('hours', 0);
                  scrollToValue('minutes', 30);
                }, 100);
              }}
            >
              Timer
            </button>
            <button
              className={`scheduler-mode-btn ${pickerMode === 'schedule' ? 'active' : ''}`}
              onClick={() => {
                setPickerMode('schedule');
                setTimeValue({ hours: 18, minutes: 0, format: '24h' });
                setTimeout(() => {
                  scrollToValue('hours', 18);
                  scrollToValue('minutes', 0);
                }, 100);
              }}
            >
              Zeitplan
            </button>
          </div>

          {/* Time Display */}
          <div className="ios-time-picker-wrapper">
            <div className="ios-time-display-container">
              <div className="ios-time-display">
                <span className="ios-time-value">{getDisplayTime().hours}</span>
                <span className="ios-time-separator">:</span>
                <span className="ios-time-value">{getDisplayTime().minutes}</span>
                {getDisplayTime().suffix && (
                  <span className="ios-time-value">{getDisplayTime().suffix}</span>
                )}
              </div>
              
              {pickerMode === 'schedule' && (
                <button 
                  className="format-toggle-btn"
                  onClick={() => {
                    setTimeValue(prev => {
                      let newFormat = '24h';
                      if (prev.format === '24h') newFormat = 'am';
                      else if (prev.format === 'am') newFormat = 'pm';
                      else newFormat = '24h';
                      return { ...prev, format: newFormat };
                    });
                  }}
                >
                  {timeValue.format === '24h' ? '24h' : timeValue.format.toUpperCase()}
                </button>
              )}
            </div>

            {/* iOS Scroll Wheels */}
            <div className="ios-time-picker">
              {/* Hours Column */}
              <div className="ios-picker-column">
                <div 
                  className="ios-scroll-container"
                  ref={hourScrollRef}
                  onScroll={() => handleScroll('hours')}
                >
                  <div className="ios-scroll-spacer"></div>
                  {Array.from({ length: pickerMode === 'timer' ? 24 : 24 }, (_, i) => (
                    <div
                      key={i}
                      className={`ios-picker-item ${timeValue.hours === i ? 'selected' : ''}`}
                      onClick={() => scrollToValue('hours', i)}
                    >
                      {String(i).padStart(2, '0')}
                    </div>
                  ))}
                  <div className="ios-scroll-spacer"></div>
                </div>
              </div>

              {/* Minutes Column */}
              <div className="ios-picker-column">
                <div 
                  className="ios-scroll-container"
                  ref={minuteScrollRef}
                  onScroll={() => handleScroll('minutes')}
                >
                  <div className="ios-scroll-spacer"></div>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => (
                    <div
                      key={minute}
                      className={`ios-picker-item ${timeValue.minutes === minute ? 'selected' : ''}`}
                      onClick={() => scrollToValue('minutes', minute)}
                    >
                      {String(minute).padStart(2, '0')}
                    </div>
                  ))}
                  <div className="ios-scroll-spacer"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekdays for Schedule */}
          {pickerMode === 'schedule' && (
            <div className="scheduler-weekdays">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <button
                  key={day}
                  className={`scheduler-weekday-btn ${selectedDays.includes(day) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDays(prev => 
                      prev.includes(day) 
                        ? prev.filter(d => d !== day)
                        : [...prev, day]
                    );
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="scheduler-actions">
            <button 
              className="scheduler-btn cancel"
              onClick={closeExpanded}
            >
              Abbrechen
            </button>
            <button 
              className="scheduler-btn confirm"
              onClick={handleConfirm}
              disabled={pickerMode === 'schedule' && selectedDays.length === 0}
            >
              {pickerMode === 'timer' ? 'Timer erstellen' : 'Zeitplan erstellen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTab;