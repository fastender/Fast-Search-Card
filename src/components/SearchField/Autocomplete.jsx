import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

export const Autocomplete = ({ 
  suggestions = [],
  onSelect,
  isVisible = false,
  selectedIndex = -1,
  onIndexChange
}) => {
  const containerRef = useRef(null);
  
  if (!isVisible || suggestions.length === 0) return null;
  
  return (
    <div ref={containerRef} className="autocomplete-suggestions">
      {suggestions.map((item, index) => (
        <div
          key={item.id}
          className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(item)}
          onMouseEnter={() => onIndexChange(index)}
        >
          <div className="suggestion-icon">
            <span>{item.icon || '🔍'}</span>
          </div>
          <div className="suggestion-content">
            <div 
              className="suggestion-name"
              dangerouslySetInnerHTML={{ __html: item.highlight || item.name }}
            />
            <div className="suggestion-meta">
              {item.area} • {item.domain}
            </div>
          </div>
          <div className="suggestion-state">
            {item.status}
          </div>
        </div>
      ))}
    </div>
  );
};