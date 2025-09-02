// src/components/SearchField.jsx
import { h } from 'preact';
import { useState, useEffect, useRef, useMemo } from 'preact/hooks';  // Mit useMemo!
import { SubcategoryBar } from './SubcategoryBar';
import { DetailView } from './DetailView';
import { useFuzzySearch } from '../hooks/useFuzzySearch';  // Eine Ebene hoch
import { DeviceCard } from './DeviceCard';  // NEU hinzufügen
import { mockDevices } from '../data/mockDevices';

export const SearchField = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('devices');
  const [showCategories, setShowCategories] = useState(false);
  const [activeFilter, setActiveFilter] = useState('grid');
  const [activeSubFilter, setActiveSubFilter] = useState('categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const containerRef = useRef(null);
  const searchPanelRef = useRef(null);
  const resultsRef = useRef(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);

  // NEUE FUZZY SEARCH INTEGRATION
  const { 
    searchTerm: fuzzySearchTerm, 
    setSearchTerm: setFuzzySearchTerm, 
    results: fuzzyResults,
    isSearching: isFuzzySearching,
    getSuggestions 
  } = useFuzzySearch(mockDevices);

  // Suggestions generieren
  const suggestions = getSuggestions(searchValue, 5);  

  // Placeholder Text basierend auf Category
  const getPlaceholder = () => {
    if (showCategories && hoveredCategory) {
      const placeholders = {
        devices: 'Geräte suchen...',
        sensors: 'Sensoren suchen...',
        actions: 'Aktionen suchen...',
        custom: 'Benutzerdefiniert suchen...'
      };
      return placeholders[hoveredCategory];
    }
    const placeholders = {
      devices: 'Geräte suchen...',
      sensors: 'Sensoren suchen...',
      actions: 'Aktionen suchen...',
      custom: 'Benutzerdefiniert suchen...'
    };
    return placeholders[activeCategory] || 'Suchen...';
  };

  // Category icons mapping
  const categoryIcons = {
    devices: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    sensors: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22L12 2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.5715 17.5498L3.42819 7.24904" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.42822 17.5498L20.5716 7.24904" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    actions: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4.40434 13.6099C3.51517 13.1448 3 12.5924 3 12C3 10.3431 7.02944 9 12 9C16.9706 9 21 10.3431 21 12C21 12.7144 20.2508 13.3705 19 13.8858"/>
        <path d="M12 11.01L12.01 10.9989"/>
        <path d="M16.8827 6C16.878 4.97702 16.6199 4.25309 16.0856 3.98084C14.6093 3.22864 11.5832 6.20912 9.32664 10.6379C7.07005 15.0667 6.43747 19.2668 7.91374 20.019C8.44117 20.2877 9.16642 20.08 9.98372 19.5"/>
        <path d="M9.60092 4.25164C8.94056 3.86579 8.35719 3.75489 7.91369 3.98086C6.43742 4.73306 7.06999 8.93309 9.32658 13.3619C11.5832 17.7907 14.6092 20.7712 16.0855 20.019C17.3977 19.3504 17.0438 15.9577 15.3641 12.1016"/>
      </svg>
    ),
    custom: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z"/>
        <path d="M20.5 16.7222L12.2914 12.1619C12.1102 12.0612 11.8898 12.0612 11.7086 12.1619L3.5 16.7222"/>
        <path d="M3.52844 7.29357L11.7086 11.8381C11.8898 11.9388 12.1102 11.9388 12.2914 11.8381L20.5 7.27777"/>
        <path d="M12 21L12 3"/>
      </svg>
    )
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setFuzzySearchTerm(value);
    
    // Inline-Autocomplete Vorschlag
    if (value.length >= 1) {
      const suggestions = getSuggestions(value, 1);
      if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0].name;
        // Nur zeigen wenn der Vorschlag mit dem Input beginnt
        if (firstSuggestion.toLowerCase().startsWith(value.toLowerCase())) {
          setSuggestionText(firstSuggestion);
        } else {
          setSuggestionText('');
        }
      } else {
        setSuggestionText('');
      }
      
      // Panel öffnen wenn noch nicht offen
      if (!isExpanded) {
        expandPanel();
      }
    } else {
      setSuggestionText('');
    }
  };

  // handleKeyDown anpassen für Tab-Completion
  const handleKeyDown = (e) => {
    // Tab oder Rechtspfeil übernimmt den Vorschlag
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestionText && searchValue) {
      if (suggestionText.toLowerCase().startsWith(searchValue.toLowerCase())) {
        e.preventDefault();
        setSearchValue(suggestionText);
        setFuzzySearchTerm(suggestionText);
        setSuggestionText('');
      }
    }
    // Enter startet die Suche
    else if (e.key === 'Enter') {
      e.preventDefault();
      // Suche wird durch den searchValue bereits ausgelöst
    }
    // Escape löscht die Suche
    else if (e.key === 'Escape') {
      setSearchValue('');
      setSuggestionText('');
    }
  };    

  // Suggestion auswählen
  const selectSuggestion = (item) => {
    setSearchValue(item.name);

    // Optional: Direkt zur Detail View
    setSelectedDevice(item);
    setShowDetail(true);
  };  

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isExpanded) {
          collapsePanel();
        }
        if (showCategories) {
          setShowCategories(false);
        }
        if (isFilterOpen) {
          setIsFilterOpen(false);
        }
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isExpanded, showCategories, isFilterOpen]);

  const collapsePanel = () => {
    if (!isExpanded) return;
    
    if (resultsRef.current) {
      resultsRef.current.animate([
        { 
          height: '600px',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          opacity: 1
        },
        { 
          height: '0px',
          clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
          opacity: 0
        }
      ], {
        duration: 250,
        easing: 'ease-in',
        fill: 'forwards'
      }).finished.then(() => {
        setIsExpanded(false);
      });
    } else {
      setIsExpanded(false);
    }
  };

  const expandPanel = () => {
    if (isExpanded) return;
    
    setIsExpanded(true);
    
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.animate([
          { 
            height: '0px',
            clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
            opacity: 0
          },
          { 
            height: '300px',
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            opacity: 0.7
          },
          { 
            height: '600px',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            opacity: 1
          }
        ], {
          duration: 350,
          easing: 'ease-out',
          fill: 'forwards'
        });
      }
    }, 10);
  };

  const handleSearchFocus = () => {
    expandPanel();
    setShowCategories(false);
  };

  const handleCategoryClick = () => {
    collapsePanel();
    setShowCategories(!showCategories);
    setIsCategoryHovered(false);
  };

  const handleCategorySelect = (category) => {
    if (category === activeCategory) {
      setShowCategories(false);
      return;
    }
    setActiveCategory(category);
    setShowCategories(false);
    expandPanel();
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleClear = () => {
    setSearchValue('');
    setSuggestionText('');
    setFuzzySearchTerm('');
  };

  // Filter devices basierend auf Fuzzy Search UND Category/Subcategory
  const filteredDevices = useMemo(() => {
    // Wenn searchValue vorhanden, nutze Fuzzy Results
    let devices = searchValue ? fuzzyResults : mockDevices;
    
    // Dann filter nach Category
    devices = devices.filter(device => {
      let categoryMatch = false;
      if (activeCategory === 'devices') {
        categoryMatch = !['script', 'automation', 'sensor', 'binary_sensor'].includes(device.domain);
      } else if (activeCategory === 'sensors') {
        categoryMatch = ['sensor', 'binary_sensor'].includes(device.domain);
      } else if (activeCategory === 'actions') {
        categoryMatch = ['script', 'automation', 'scene'].includes(device.domain);
      } else {
        categoryMatch = true;
      }
      
      if (!categoryMatch) return false;
      
      // Filter by subcategory
      if (selectedSubcategory === 'all') return true;
      
      if (activeSubFilter === 'areas') {
        return device.area === selectedSubcategory;
      }
      
      const domainToSubcategory = {
        'light': 'lights',
        'switch': 'lights',
        'climate': 'climate',
        'fan': 'climate',
        'cover': 'covers',
        'media_player': 'media',
        'vacuum': 'cleaning',
        'camera': 'security',
        'lock': 'security'
      };
      
      const deviceSubcategory = domainToSubcategory[device.domain];
      return deviceSubcategory === selectedSubcategory;
    });
    
    return devices;
  }, [searchValue, fuzzyResults, mockDevices, activeCategory, selectedSubcategory, activeSubFilter]);


  const groupedSearchResults = useMemo(() => {
    if (!searchValue) return null;
    
    const grouped = {
      devices: [],
      sensors: [],
      actions: []
    };
    
    fuzzyResults.forEach(device => {
      if (['sensor', 'binary_sensor'].includes(device.domain)) {
        grouped.sensors.push(device);
      } else if (['script', 'automation', 'scene'].includes(device.domain)) {
        grouped.actions.push(device);
      } else {
        grouped.devices.push(device);
      }
    });
    
    return grouped;
  }, [searchValue, fuzzyResults]);

  // Hilfsfunktion für Highlighting
  const highlightName = (name, matches) => {
    if (!matches) return name;
    const nameMatch = matches.find(m => m.key === 'name');
    if (!nameMatch) return name;
    
    let result = '';
    let lastIndex = 0;
    
    nameMatch.indices.forEach(([start, end]) => {
      result += name.slice(lastIndex, start);
      result += `<mark>${name.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });
    
    result += name.slice(lastIndex);
    return result;
  };


  return (
    <div style={{
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

        .glass-panel {
          position: relative;
          border-radius: 35px;
          border: 1px solid var(--glass-border-color);
          box-shadow: var(--glass-shadow);
          overflow: hidden;
          isolation: isolate;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
        }

        .glass-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: -1;
          border-radius: inherit;
          -webkit-backdrop-filter: blur(var(--glass-blur-amount));
          backdrop-filter: blur(var(--glass-blur-amount));
          background: radial-gradient(
            circle at 50% 0%,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05) 70%
          );
        }
        
        .glass-panel::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 1;
          border-radius: inherit;
          pointer-events: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3),
                      inset 0 -1px 1px rgba(0, 0, 0, 0.1);
        }

        .main-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
        }

        .search-row {
          display: flex;
          gap: 16px;
          width: 100%;
          position: relative;
          align-items: flex-start;
        }

        .search-panel {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background-color: rgba(0,0,0,0);
          display: ${showCategories && isMobile ? 'none' : 'flex'};
          flex-direction: column;
          flex: ${!isMobile && showCategories ? '1 1 60%' : '1'};
          height: ${isExpanded ? '672px' : '72px'}; /* 72px header + 600px content */
          overflow: hidden;
        }

        .search-panel.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(-5%) scale(0.95);
          transition: all 0.35s ease-in-out;
        }

        .detail-panel-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 672px;
          z-index: 10;
          pointer-events: auto;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          height: 72px;
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: rgba(255, 255, 255, 0.01);
        }

        .search-wrapper::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background-color: rgba(255, 255, 255, 0.1);
          display: ${isExpanded ? 'block' : 'none'};
        }

        .category-icon {
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0);
          flex-shrink: 0;
          transition: all 0.2s ease;

          position: relative;
        }

        .category-icon:hover {
          transform: scale(1.05);
        }

        .category-icon svg,
        .category-icon .default-icon svg {
          width: 24px;
          height: 24px;
          stroke: var(--text-secondary);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          position: absolute;
          transition: opacity 0.2s ease;
        }

        .category-icon .default-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
          opacity: ${isCategoryHovered ? 0 : 1};
        }

        .category-icon .chevron-icon {
          opacity: ${isCategoryHovered ? 1 : 0};
          transform: rotate(0deg);  // Immer 0°, kein Drehen
          transition: opacity 0.2s ease, transform 0.3s ease;
        }

        .search-input-container {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .search-suggestion {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          font-size: 24px;
          font-family: inherit;
          color: rgba(255, 255, 255, 0.25);  /* Ghost Text Farbe */
          pointer-events: none;
          z-index: 1;
        }        
        
        .search-input {
          position: relative;
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          font-size: 24px;
          color: var(--text-primary);
          font-family: inherit;
          z-index: 2;
        }

        /* Gruppierte Suchergebnisse */
        .grouped-search-results {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 5px;
        }

        .search-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-group-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0;
        }

        .search-group-count {
          font-size: 11px;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          font-weight: 500;
        }

        /* Highlighting in Suchergebnissen */
        .device-name mark,
        .device-list-name mark {
          background: rgba(255, 220, 0, 0.3);
          color: inherit;
          font-weight: 700;
          padding: 0 2px;
          border-radius: 2px;
        }        
        
        .search-input::placeholder {
          color: var(--text-secondary);
        }

        .clear-button {
          width: 44px;
          height: 44px;
          border: none;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 50%;
          cursor: pointer;
          display: ${searchValue ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          z-index: 10;
          position: relative;
        }

        .clear-button:hover {
          background: rgba(0, 0, 0, 0.25);
          transform: scale(1.1);
        }

        .filter-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0;
        }
        
        .filter-main-button {
          width: 44px;
          height: 44px;
          border: none;
          background: ${isFilterOpen ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)'};
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 10;
          flex-shrink: 0;
        }
        
        .filter-main-button:hover {
          background: ${isFilterOpen ? 'var(--accent)' : 'rgba(255, 255, 255, 0.25)'};
          transform: scale(1.05);
        }
        
        .filter-groups {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-right: 12px;
          opacity: ${isFilterOpen ? 1 : 0};
          pointer-events: ${isFilterOpen ? 'auto' : 'none'};
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 60px;
          padding: 10px 0px;
          border: 0px solid rgba(255, 255, 255, 0);
          transform: translateX(${isFilterOpen ? '0' : '20px'}) scale(${isFilterOpen ? '1' : '0.8'});
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 45px;
          z-index: 1001;
        }
        
        .filter-group:nth-child(1) {
          transition-delay: ${isFilterOpen ? '0.1s' : '0s'};
        }
        
        .filter-group:nth-child(2) {
          transition-delay: ${isFilterOpen ? '0.2s' : '0s'};
        }
        
        .filter-button {
          width: 45px;
          height: 45px;
          border: none;
          background: rgba(255, 255, 255, 0);
          border-radius: 60px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          padding: 0px;
          box-sizing: border-box;
          position: relative;  /* Hinzufügen */          
        }
        
        .filter-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .filter-button.active {
          background: var(--accent-light);
        }
        
        .filter-button svg {
          width: 20px;
          height: 20px;
          stroke: #ffffff;
          stroke-width: 1;
          fill: none;
        }

        .category-buttons-container {
          display: ${showCategories ? 'flex' : 'none'};
          flex: ${!isMobile && showCategories ? '0 0 auto' : 'none'};
          padding: ${isMobile ? '20px' : '0'};
          width: ${isMobile ? '100%' : 'auto'};
          justify-content: ${isMobile ? 'center' : 'flex-end'};
          animation: ${showCategories ? 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'};
        }

        .category-buttons {
          display: flex;
          flex-direction: row;
          gap: ${isMobile ? '8px' : '12px'};
          flex-wrap: ${isMobile ? 'wrap' : 'nowrap'};
          justify-content: center;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .category-button {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--glass-shadow);
        }
        
        .category-button:hover {
          transform: scale(1.05);
          background: var(--accent-light);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .category-button.active {
          background: var(--accent-light);
        }

        .category-button svg {
          width: 24px;
          height: 24px;
          stroke: var(--text-secondary);
          stroke-width: 2;
          fill: none;
        }

        .category-button.active svg {
          stroke: var(--text-primary);
        }

        .results-container {
          padding: 20px;
          height: 600px; /* IMMER 600px */
          opacity: ${isExpanded ? 1 : 0};
          overflow-y: auto; /* Scrollbar wenn nötig */
          overflow-x: hidden;
          transition: none;
          flex-shrink: 0; /* Verhindert Schrumpfen */
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
          min-height: 200px;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        /* Device Grid inside Search */
        .device-grid-container {
          display: grid;
          gap: 16px;
          padding: 5px;
        }

        /* Desktop: Max 4 Spalten */
        @media (min-width: 1024px) {
          .device-grid-container {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Tablet: Max 3 Spalten */
        @media (min-width: 768px) and (max-width: 1023px) {
          .device-grid-container {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Mobile: Max 2 Spalten */
        @media (max-width: 767px) {
          .device-grid-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* List View Styles */
        .device-list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 5px;
          width: 100%;
        }




  


        /* Füge diese CSS Regeln am Ende des style Tags hinzu */
        .search-input-container {
          position: relative; /* WICHTIG für Autocomplete Positionierung */
        }




      `}</style>

      <div className="main-container" ref={containerRef}>
        <div className="search-row">
          <div className={`search-panel glass-panel ${showDetail ? 'hidden' : ''}`} ref={searchPanelRef}>
            <div className="search-wrapper">
              {/* Category Icon */}
              <div 
                className="category-icon" 
                onClick={handleCategoryClick}
                onMouseEnter={() => setIsCategoryHovered(true)}  // Immer hovern erlauben
                onMouseLeave={() => setIsCategoryHovered(false)}
              >
                <div className="default-icon">
                  {/* Zeige entweder das gehoverte Icon oder das aktive Icon */}
                  {showCategories && hoveredCategory ? categoryIcons[hoveredCategory] : categoryIcons[activeCategory]}
                </div>
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 6L9 12L15 18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Search Input */}
              <div className="search-input-container">
                {/* Ghost Text für Autocomplete */}
                <input
                  type="text"
                  className="search-suggestion"
                  value={suggestionText}
                  readonly
                  tabIndex="-1"
                />
                
                {/* Echter Input */}
                <input
                  type="text"
                  className="search-input"
                  placeholder={getPlaceholder()}
                  value={searchValue}
                  onChange={handleSearchInput}
                  onKeyDown={handleKeyDown}
                  onFocus={handleSearchFocus}
                />
              </div>

              {/* Clear Button */}
              <button className="clear-button" onClick={handleClear}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Filter System */}
              <div className="filter-container">
                <div className="filter-groups">
                  {/* View Mode Group */}
                  <div className="filter-group">
                    <button 
                      className={`filter-button ${activeFilter === 'grid' ? 'active' : ''}`} 
                      onClick={() => setActiveFilter('grid')}
                      title="Grid-Ansicht"
                    >
                      <svg viewBox="0 0 24 24">
                        <rect x="5" y="5" width="5" height="5"/>
                        <rect x="14" y="5" width="5" height="5"/>
                        <rect x="5" y="14" width="5" height="5"/>
                        <rect x="14" y="14" width="5" height="5"/>
                      </svg>
                    </button>
                    <button 
                      className={`filter-button ${activeFilter === 'list' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('list')}
                      title="Listen-Ansicht"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M8 6L20 6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 6.01L4.01 5.99889" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 12.01L4.01 11.9989" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 18.01L4.01 17.9989" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12L20 12" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 18L20 18" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* Sub-Filter Group */}
                  <div className="filter-group">
                    <button 
                      className={`filter-button ${activeSubFilter === 'categories' ? 'active' : ''}`}
                      onClick={() => setActiveSubFilter('categories')}
                      title="Kategorien"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M20.777 13.3453L13.4799 21.3721C12.6864 22.245 11.3136 22.245 10.5201 21.3721L3.22304 13.3453C2.52955 12.5825 2.52955 11.4175 3.22304 10.6547L10.5201 2.62787C11.3136 1.755 12.6864 1.755 13.4799 2.62787L20.777 10.6547C21.4705 11.4175 21.4705 12.5825 20.777 13.3453Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      className={`filter-button ${activeSubFilter === 'areas' ? 'active' : ''}`}
                      onClick={() => setActiveSubFilter('areas')}
                      title="Räume"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M11 19V21" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11 12V14" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 12V14" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 21H21" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 21V9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 21V9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 5V9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11 5V9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 9.6V7C21 4.23858 18.7614 2 16 2H8C5.23858 2 3 4.23858 3 7V9.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      className={`filter-button ${activeSubFilter === 'types' ? 'active' : ''}`}
                      onClick={() => setActiveSubFilter('types')}
                      title="Typen"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M10.0503 10.6066L2.97924 3.53553C2.19818 2.75447 2.19818 1.48816 2.97924 0.707107V0.707107C3.7603 -0.0739435 5.02661 -0.0739435 5.80766 0.707107L12.8787 7.77817" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.88874 8.7475L8.88874 6.06049C8.65443 5.82618 8.65443 5.44628 8.88874 5.21197L11.5757 2.52496C11.8101 2.29065 12.19 2.29065 12.4243 2.52496L15.1113 5.21197C15.3456 5.44628 15.3456 5.82618 15.1113 6.06049L12.4243 8.7475C12.19 8.98181 11.8101 8.98181 11.5757 8.7475Z"/>
                        <path d="M17.9396 15.1113L15.2526 12.4243C15.0183 12.1899 15.0183 11.8101 15.2526 11.5757L17.9396 8.88873C18.174 8.65442 18.5539 8.65442 18.7882 8.88873L21.4752 11.5757C21.7095 11.8101 21.7095 12.1899 21.4752 12.4243L18.7882 15.1113C18.5539 15.3456 18.174 15.3456 17.9396 15.1113Z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Main Filter Button */}
                <button className="filter-main-button" onClick={handleFilterToggle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5">
                    <path d="M3 6H21" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 12L17 12" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11 18L13 18" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Results Container */}
            <div ref={resultsRef} className="results-container">
              {/* SubcategoryBar - nur wenn NICHT gesucht wird */}
              {isExpanded && !searchValue && (
                <div style={{ marginBottom: '10px', marginTop: '-10px' }}>
                  <SubcategoryBar
                    activeCategory={activeCategory}
                    items={mockDevices.filter(device => {
                      if (activeCategory === 'devices') {
                        return !['script', 'automation', 'sensor', 'binary_sensor'].includes(device.domain);
                      }
                      if (activeCategory === 'sensors') {
                        return ['sensor', 'binary_sensor'].includes(device.domain);
                      }
                      if (activeCategory === 'actions') {
                        return ['script', 'automation', 'scene'].includes(device.domain);
                      }
                      return true;
                    })}
                    mode={activeSubFilter === 'areas' ? 'areas' : 'categories'}
                    onSubcategoryChange={(subcategory) => {
                      setSelectedSubcategory(subcategory);
                    }}
                  />
                </div>
              )}
              
              {/* Gruppierte Suchergebnisse wenn searchValue vorhanden */}
              {searchValue && groupedSearchResults ? (
                <div className="grouped-search-results">
                  {/* Keine Ergebnisse */}
                  {groupedSearchResults.devices.length === 0 && 
                  groupedSearchResults.sensors.length === 0 && 
                  groupedSearchResults.actions.length === 0 ? (
                    <div className="empty-state">
                      <div style={{fontSize: '32px', opacity: 0.5}}>🔍</div>
                      <h3 style={{fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0}}>
                        Keine Ergebnisse für "{searchValue}"
                      </h3>
                      <p style={{fontSize: '13px', opacity: 0.7, margin: 0}}>
                        Versuche es mit anderen Suchbegriffen
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Geräte Gruppe */}
                      {groupedSearchResults.devices.length > 0 && (
                        <div className="search-group">
                          <h3 className="search-group-title">
                            Geräte
                            <span className="search-group-count">{groupedSearchResults.devices.length}</span>
                          </h3>
                          <div className={activeFilter === 'list' ? 'device-list-container' : 'device-grid-container'}>

                            {groupedSearchResults.devices.map((device, index) => (
                              <DeviceCard 
                                key={device.id}
                                device={device}
                                viewMode={activeFilter}
                                onClick={() => {
                                  setSelectedDevice(device);
                                  setShowDetail(true);
                                }}
                                index={index}
                                lang="de"
                              />
                            ))}

                          </div>
                        </div>
                      )}
                      
                      {/* Sensoren Gruppe */}
                      {groupedSearchResults.sensors.length > 0 && (
                        <div className="search-group">
                          <h3 className="search-group-title">
                            Sensoren
                            <span className="search-group-count">{groupedSearchResults.sensors.length}</span>
                          </h3>
                          <div className={activeFilter === 'list' ? 'device-list-container' : 'device-grid-container'}>

                            {groupedSearchResults.sensors.map((device, index) => (
                              <DeviceCard 
                                key={device.id}
                                device={device}
                                viewMode={activeFilter}
                                onClick={() => {
                                  setSelectedDevice(device);
                                  setShowDetail(true);
                                }}
                                index={index}
                                lang="de"
                              />
                            ))}

                          </div>
                        </div>
                      )}
                      
                      {/* Aktionen Gruppe */}
                      {groupedSearchResults.actions.length > 0 && (
                        <div className="search-group">

                          <h3 className="search-group-title">
                            Aktionen
                            <span className="search-group-count">{groupedSearchResults.actions.length}</span>
                          </h3>


                          <div className={activeFilter === 'list' ? 'device-list-container' : 'device-grid-container'}>

                            {groupedSearchResults.actions.map((device, index) => (
                              <DeviceCard 
                                key={device.id}
                                device={device}
                                viewMode={activeFilter}
                                onClick={() => {
                                  setSelectedDevice(device);
                                  setShowDetail(true);
                                }}
                                index={index}
                                lang="de"
                              />
                            ))}

                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : !searchValue ? (

                // Normale Ansicht ohne Suche (bleibt unverändert)
                <div className={activeFilter === 'list' ? 'device-list-container' : 'device-grid-container'}>
                  {filteredDevices.map((device, index) => (
                    <DeviceCard 
                      key={device.id}
                      device={device}
                      viewMode={activeFilter}
                      onClick={() => {
                        setSelectedDevice(device);
                        setShowDetail(true);
                      }}
                      index={index}
                      lang="de"
                    />
                  ))}
                </div>


              ) : null}
            </div>
          </div>    

          {/* Category Buttons */}
          {showCategories && (
            <div className="category-buttons-container">
              <div className="category-buttons">

                {Object.entries(categoryIcons).map(([key, icon]) => (
                  <button 
                    key={key}
                    className={`category-button glass-panel ${activeCategory === key ? 'active' : ''}`} 
                    onClick={() => handleCategorySelect(key)}
                    onMouseEnter={() => setHoveredCategory(key)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                  >
                    {icon}
                  </button>
                ))}

              </div>
            </div>
          )}


          {/* DetailView - erscheint wenn ein Device ausgewählt wird */}
          {showDetail && (
            <div className="detail-panel-wrapper">
              <DetailView
                item={{
                  entity_id: selectedDevice?.id,
                  domain: selectedDevice?.domain,
                  name: selectedDevice?.name,
                  area: selectedDevice?.area,
                  state: selectedDevice?.isActive ? 'on' : 'off',
                  attributes: {
                    brightness: 180,
                    friendly_name: selectedDevice?.name
                  }
                }}
                isVisible={showDetail}
                onBack={() => setShowDetail(false)}
                onToggleFavorite={(id) => console.log('Favorite toggled:', id)}
              />
            </div>          
          )}
        </div>
      </div>
    </div>
  );
};