// src/components/SubcategoryBar.jsx
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

export const SubcategoryBar = ({ 
  activeCategory = 'devices',
  items = [],
  onSubcategoryChange,
  mode = 'categories' // 'categories', 'areas', 'types'
}) => {
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [counts, setCounts] = useState({});
  const [activeCounts, setActiveCounts] = useState({}); // NEU: State für aktive Counts
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const scrollContainerRef = useRef(null);

  // Category mappings
  const domainToSubcategory = {
    'light': 'lights',
    'switch': 'lights',
    'climate': 'climate',
    'fan': 'climate',
    'humidifier': 'climate',
    'cover': 'covers',
    'media_player': 'media',
    'vacuum': 'cleaning',
    'camera': 'security',
    'lock': 'security',
    'siren': 'security',
    'valve': 'utilities'
  };

  const subcategoryLabels = {
    'all': 'Alle',
    'lights': 'Lichter',
    'climate': 'Klima',
    'covers': 'Rollos',
    'media': 'Medien',
    'cleaning': 'Reinigung',
    'security': 'Sicherheit',
    'utilities': 'Utilities'
  };

  const typeLabels = {
    'all': 'Alle',
    'script': 'Skripte',
    'automation': 'Automationen',
    'scene': 'Szenen',
    'playlist': 'Playlists',
    'custom_card': 'Karten',
    'lovelace_view': 'Views'
  };

  // Calculate available subcategories based on items
  const getAvailableSubcategories = () => {
    if (mode === 'areas') {
      const areas = new Set(items.map(item => item.area).filter(Boolean));
      return ['all', ...Array.from(areas).sort()];
    }
    
    if (mode === 'types' && activeCategory === 'custom') {
      const types = new Set(items.map(item => item.custom_data?.type).filter(Boolean));
      return ['all', ...Array.from(types)];
    }

    // Default: domain-based categories
    const availableDomains = new Set(items.map(item => item.domain));
    const availableSubcats = new Set();
    
    availableDomains.forEach(domain => {
      const subcat = domainToSubcategory[domain];
      if (subcat) availableSubcats.add(subcat);
    });

    const sortOrder = ['lights', 'climate', 'covers', 'media', 'cleaning', 'security', 'utilities'];
    const sorted = Array.from(availableSubcats).sort((a, b) => {
      const indexA = sortOrder.indexOf(a);
      const indexB = sortOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return ['all', ...sorted];
  };

  // Calculate counts for each subcategory - ERWEITERT MIT AKTIVEN COUNTS
  const calculateCounts = () => {
    const newCounts = {};
    const newActiveCounts = {};
    const subcategories = getAvailableSubcategories();

    subcategories.forEach(subcat => {
      if (subcat === 'all') {
        newCounts.all = items.length;
        newActiveCounts.all = items.filter(item => item.isActive).length;
      } else if (mode === 'areas') {
        const areaItems = items.filter(item => item.area === subcat);
        newCounts[subcat] = areaItems.length;
        newActiveCounts[subcat] = areaItems.filter(item => item.isActive).length;
      } else if (mode === 'types') {
        const typeItems = items.filter(item => item.custom_data?.type === subcat);
        newCounts[subcat] = typeItems.length;
        newActiveCounts[subcat] = typeItems.filter(item => item.isActive).length;
      } else {
        // Domain-based counting
        const domains = Object.entries(domainToSubcategory)
          .filter(([_, cat]) => cat === subcat)
          .map(([domain]) => domain);
        const domainItems = items.filter(item => domains.includes(item.domain));
        newCounts[subcat] = domainItems.length;
        newActiveCounts[subcat] = domainItems.filter(item => item.isActive).length;
      }
    });

    setCounts(newCounts);
    setActiveCounts(newActiveCounts);
  };

  // Check scroll indicators
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  // Update counts when items change
  useEffect(() => {
    calculateCounts();
  }, [items, mode, activeCategory]);

  // Reset subcategory when category changes
  useEffect(() => {
    setActiveSubcategory('all');
  }, [activeCategory, mode]);

  // Setup scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll(); // Initial check
      
      // Check on resize
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Handle chip selection
  const handleChipClick = (subcategory) => {
    // Toggle behavior: clicking active chip goes back to 'all'
    const newSubcategory = subcategory === activeSubcategory && subcategory !== 'all' 
      ? 'all' 
      : subcategory;
    
    setActiveSubcategory(newSubcategory);
    onSubcategoryChange?.(newSubcategory);

    // Animate the click
    const chip = scrollContainerRef.current?.querySelector(`[data-subcategory="${subcategory}"]`);
    if (chip) {
      chip.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
      ], {
        duration: 300,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });
    }
  };

  // Scroll to position
  const scrollTo = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Get label for subcategory
  const getLabel = (subcategory) => {
    if (mode === 'areas') {
      return subcategory === 'all' ? 'Alle Räume' : subcategory;
    }
    if (mode === 'types') {
      return typeLabels[subcategory] || subcategory;
    }
    return subcategoryLabels[subcategory] || subcategory;
  };

  const subcategories = getAvailableSubcategories();

  return (
    <div className="subcategory-bar-container">
      <style>{`
        .subcategory-bar-container {
          position: relative;
          margin: 10px 0;
          width: 100%;
        }

        .subcategory-bar {
          display: flex;
          gap: 8px;
          padding: 8px 15px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        .subcategory-bar::-webkit-scrollbar {
          display: none;
        }

        .subcategory-chip {
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
        }

        .subcategory-chip:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .subcategory-chip.active {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .chip-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .chip-count {
          font-size: 11px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .chip-active-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(0, 255, 0, 0.2);
          color: #00ff88;
          border-radius: 10px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
        }

        /* Scroll Indicators */
        .scroll-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          z-index: 10;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.3s, transform 0.2s;
        }

        .scroll-indicator.visible {
          opacity: 1;
        }

        .scroll-indicator:hover {
          transform: translateY(-50%) scale(1.1);
          background: rgba(0, 0, 0, 0.6);
        }

        .scroll-indicator-left {
          left: 5px;
        }

        .scroll-indicator-right {
          right: 5px;
        }

        .scroll-indicator svg {
          width: 14px;
          height: 14px;
        }
      `}</style>

      <div 
        ref={scrollContainerRef}
        className="subcategory-bar"
      >
        {subcategories.map((subcategory, index) => {
          const count = counts[subcategory] || 0;
          const activeCount = activeCounts[subcategory] || 0;
          const isActive = subcategory === activeSubcategory;
          
          return (
            <div
              key={subcategory}
              className={`subcategory-chip ${isActive ? 'active' : ''}`}
              data-subcategory={subcategory}
              onClick={() => handleChipClick(subcategory)}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="chip-label">
                {getLabel(subcategory)}
              </span>
              <span className="chip-count">
                {count}
              </span>
              {activeCount > 0 && (
                <span className="chip-active-badge">
                  {activeCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Scroll indicators */}
      <div 
        className={`scroll-indicator scroll-indicator-left ${showLeft ? 'visible' : ''}`}
        onClick={() => scrollTo('left')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      <div 
        className={`scroll-indicator scroll-indicator-right ${showRight ? 'visible' : ''}`}
        onClick={() => scrollTo('right')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  );
};