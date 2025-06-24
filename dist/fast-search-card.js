class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // State Management
        this._hass = null;
        this._config = {};
        this.allItems = [];
        this.filteredItems = [];
        this.activeCategory = 'devices';
        this.activeSubcategory = 'all';
        this.isMenuView = false;
        this.isPanelExpanded = false;
        this.animationTimeouts = [];
        this.hasAnimated = false;
        this.searchTimeout = null;
        this.isSearching = false;
        
        // Neue State-Variablen
        this.isDetailView = false;
        this.currentDetailItem = null;
        this.previousSearchState = null;

        // Circular Slider State
        this.circularSliders = {};
        this.lightUpdateTimeout = null;
        this.coverUpdateTimeout = null; // Hinzugefügt für Rollladen
        this.climateUpdateTimeout = null;
        this.mediaUpdateTimeout = null;  // NEU HINZUFÜGEN
        this.mediaPositionUpdateInterval = null;        

        // --- NEU: Music Assistant State ---
        this.musicAssistantSearchTimeout = null;
        this.musicAssistantEnqueueMode = 'play'; // 'play', 'add', 'next'
        this.maListenersAttached = new WeakSet(); // Verhindert doppelte Event Listeners
        this.lastMusicAssistantResults = null; // Cache für Suchergebnisse
        this.musicAssistantConfigEntryId = null; // Cache für die Config Entry ID        
    }

    setConfig(config) {
        if (!config.entities || !Array.isArray(config.entities)) {
            throw new Error('Entities configuration is required');
        }

        // Standardkonfiguration wird mit der Benutzerkonfiguration zusammengeführt
        this._config = {
            title: 'Fast Search',
            ...config,
            entities: config.entities
        };
        
        this.render();
    }

    set hass(hass) {
        if (!hass) return;
        
        const oldHass = this._hass;
        this._hass = hass;
        
        const shouldUpdateAll = !oldHass || this.shouldUpdateItems(oldHass, hass);
        if (shouldUpdateAll) {
            this.updateItems();
        }
        
        if (this.isDetailView && this.currentDetailItem) {
            const updatedItem = this.allItems.find(item => item.id === this.currentDetailItem.id);
            if(updatedItem) {
                this.currentDetailItem = updatedItem;
                this.updateDetailViewStates();
            }
        } else if (!this.isDetailView && !this.isSearching) {
            this.updateStates();
        }
    }

    shouldUpdateItems(oldHass, newHass) {
        if (!this._config.entities) return false;
        
        for (const entityConfig of this._config.entities) {
            const entityId = entityConfig.entity;
            const oldState = oldHass.states[entityId];
            const newState = newHass.states[entityId];
            
            if (!oldState && newState) return true;
            if (oldState && !newState) return true;
            if (oldState && newState && oldState.attributes.friendly_name !== newState.attributes.friendly_name) {
                return true;
            }
        }
        
        return false;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
            :host {
                display: block;
                --glass-blur-amount: 20px;
                --glass-border-color: rgba(255, 255, 255, 0.2);
                --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                --accent: #007AFF;
                --accent-rgb: 0, 122, 255;
                --accent-light: rgba(255, 255, 255, 0.35);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                --neumorphic-base: #2c2f33;
                --neumorphic-shadow-dark: #23272b;
                --neumorphic-shadow-light: #35373b;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .search-row {
                display: flex;
                gap: 16px;
                width: 100%;
                position: relative;
            }

            .search-panel, .detail-panel {
                transition: opacity 0.35s ease-in-out, transform 0.35s ease-in-out;
                background-color: rgba(0,0,0,0);
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            .search-panel {
                max-height: 72px;
                opacity: 1;
                transform: translateX(0) scale(1);
            }
            .search-panel.hidden {
                opacity: 0;
                pointer-events: none;
                transform: translateX(-5%) scale(0.95);
            }
            
            .detail-panel {
                position: absolute;
                top: 0;
                left: 0;
                height: 700px;
                opacity: 0;
                pointer-events: none;
                transform: translateX(5%) scale(0.95);
            }

            .detail-panel.visible {
                opacity: 1;
                pointer-events: auto;
                transform: translateX(0) scale(1);
            }

            .search-panel.expanded {
                max-height: 700px; 
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
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
            }

            .category-icon:hover {
                background: rgba(255, 255, 255, 0);
                transform: scale(1.05);
            }

            .category-icon svg {
                width: 24px;
                height: 24px;
                stroke: var(--text-secondary);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            .search-input {
                flex: 1;
                border: none;
                background: transparent;
                outline: none;
                font-size: 24px;
                color: var(--text-primary);
                font-family: inherit;
                min-width: 0;
            }

            .search-input::placeholder {
                color: var(--text-secondary);
            }

            .clear-button {
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 50%;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }

            .clear-button.visible {
                display: flex;
                opacity: 1;
            }

            .clear-button:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.1);
            }

            .clear-button svg {
                width: 12px;
                height: 12px;
                stroke: var(--text-secondary);
                stroke-width: 2;
            }

            .filter-icon {
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
                transition: all 0.2s ease;
            }

            .filter-icon:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: rotate(90deg);
            }

            .filter-icon svg {
                width: 18px;
                height: 18px;
                stroke: var(--text-secondary);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            .subcategories {
                display: flex;
                gap: 8px;
                padding: 5px 20px 16px 20px;
                overflow-x: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
                -webkit-overflow-scrolling: touch;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
          
            .subcategories::-webkit-scrollbar {
                display: none;
            }

            .subcategory-chip {
                padding: 5px 15px 5px 15px;
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.2s ease;
                text-align: center;
                height: 30px;
                display: flex;
                align-items: center;
            }

            .subcategory-chip.active {
                background: var(--accent-light);
                border-color: var(--accent);
                color: var(--accent);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
            }

            .subcategory-chip:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }

            .chip-content {
                display: flex;
                flex-direction: column;
                line-height: 1.1;
                gap: 2px;
                color: var(--text-primary);
            }

            .subcategory-name {
                font-size: 12px;
                font-weight: 600;
            }

            .subcategory-status {
                font-size: 12px;
                color: var(--text-secondary);
                opacity: 0.9;
                min-height: 13px;
            }

            .subcategory-chip.active .subcategory-status {
                color: var(--text-primary);
            }
            
            .subcategory-chip.active .chip-content {
                 color: var(--text-primary);
            }

            .results-container {
                flex-grow: 1; 
                overflow-y: auto; 
                scrollbar-width: none;
                -ms-overflow-style: none;
                -webkit-overflow-scrolling: touch;
                opacity: 0; 
                transform: translateY(-10px); 
                transition: all 0.3s ease; 
                padding-top: 16px; 
                padding-bottom: 20px;
            }

            .results-container::-webkit-scrollbar {
                display: none;
            }

            .search-panel.expanded .results-container {
                opacity: 1;
                transform: translateY(0);
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
                min-height: 200px;
                padding-left: 20px; 
                padding-right: 20px; 
            }

            .area-header {
                grid-column: 1 / -1;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 16px 0 0px 0;
                padding-top: 8px;
                border-bottom: 0px solid rgba(255, 255, 255, 0.1);
            }

            .area-header:first-child {
                margin-top: 0;
            }

            .device-card {
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                padding: 16px;
                cursor: pointer;
                aspect-ratio: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
                transition: all 0.2s ease;
                will-change: transform, opacity; 
            }
            
            .device-card:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }

            .device-card.active {
                background: var(--accent-light);
                border-color: var(--accent);
                box-shadow: 
                    0 4px 20px rgba(0, 122, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }

            .device-icon {
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                margin-bottom: auto;
                transition: all 0.2s ease;
            }

            .device-card.active .device-icon {
                background: rgba(0, 122, 255, 0.3);
                color: var(--accent);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
            }

            .device-name {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0 0 0 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.1;
            }

            .device-status {
                font-size: 13px;
                color: var(--text-secondary);
                margin: 0;
                opacity: 0.8;
                line-height: 1.1;
            }

            .device-card.active .device-status {
                color: var(--text-secondary);
                opacity: 1;
            }
            
            .detail-content {
                flex-grow: 1;
                display: flex;
                height: 100%;
                overflow-y: hidden;
            }

            .detail-left {
                flex: 1;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 22px 20px;
            }

            .detail-right {
                flex: 1;
                display: flex;
                flex-direction: column;
                border-radius: 0 24px 24px 0; 
                box-sizing: border-box;
                overflow: hidden;
            }
            
            .detail-left-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
            }
            
            .back-button {
                width: 39px;
                height: 39px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
                color: var(--text-primary);
                padding: 0;
            }

            .back-button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }

            .back-button svg {
                width: 29px;
                height: 29px;
            }

            .detail-divider {
                width: 1px;
                background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent);
                margin: 20px 0;
            }
            
            .icon-background-wrapper {
                position: relative;
                width: 500px;
                height: 500px;
                margin: 0 auto 0px;
                flex-shrink: 0;
            }

            .icon-background {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                z-index: 0;
                transition: all 0.8s ease;
                border-radius: 20px;
                opacity: 0;
                position: relative;
            }

            .icon-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
            }

            .status-indicator-large {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 500;
            }

            .status-indicator-large.active {
                 background: var(--accent);
                 border-color: var(--accent);
            }
            
            .quick-stats {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .stat-item {
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 6px 12px;
                font-size: 11px;
                color: var(--text-secondary);
                font-weight: 500;
                white-space: nowrap;
            }
            
            .detail-title-area {
                flex: 1;
                min-width: 0;
                text-align: left;
                margin-top: 0;
            }
            .detail-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0px;
                line-height: 1.05em;
            }
            
            .detail-area {
                font-size: 15px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 0;
                line-height: 1.05em;
            }
            
            .detail-info-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
                margin-top: 20px;
            }
            
            .category-buttons {
                display: none;
                flex-direction: row;
                gap: 12px;
                opacity: 0;
                transform: translateX(20px);
            }

            .category-buttons.visible {
                display: flex;
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
                border-color: var(--accent);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            }

            .category-button.active {
                background: var(--accent-light);
                box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
            }

            .category-button svg {
                width: 24px;
                height: 24px;
                stroke: var(--text-secondary);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
                transition: all 0.2s ease;
            }

            .category-button.active svg {
                stroke: var(--accent);
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

            .empty-icon {
                font-size: 32px;
                opacity: 0.5;
            }

            .empty-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
            }

            .empty-subtitle {
                font-size: 13px;
                opacity: 0.7;
                margin: 0;
            }

            /* Detail Tabs */
            .detail-tabs-container {
                display: flex;
                justify-content: center;
            }
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
                padding: 10px;
                border-radius: 50%;
                cursor: pointer;
                color: var(--text-secondary);
                transition: color 0.25s ease;
                z-index: 2;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 0;
            }
            .detail-tab.active {
                color: var(--text-primary);
            }
            .detail-tab svg {
              width: 20px;
              height: 20px;
              stroke-width: 1.5;
            }
            #tab-content-container {
                flex-grow: 1;
                overflow-y: hidden;
                padding: 20px;
                box-sizing: border-box;
                scrollbar-width: none;
                max-height: 100%;
            }
            #tab-content-container::-webkit-scrollbar { display: none; }

            .detail-tab-content { display: none; }
            .detail-tab-content.active { display: block; }
            
            .device-control-design {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0px;
                position: relative;
                z-index: 5;
            }

            .device-control-design[data-focus-mode] {
                position: relative;
                overflow: visible;
            }
            
            .device-control-presets.visible {
                z-index: 10;
                position: relative;
            }            


            /* Desktop: Desktop-Tabs zeigen, Mobile-Tabs verstecken */
            .desktop-tabs {
                display: block;
                display: flex;
                justify-content: flex-end;
                padding-right: 20px;
                padding-top: 20px;
                padding-bottom: 10px;
            }
            
            .mobile-tabs {
                display: none;
            }
            
            /* Mobile: Mobile-Tabs zeigen, Desktop-Tabs verstecken */
            @media (max-width: 768px) {
                .desktop-tabs {
                    display: none;
                }
                
                .mobile-tabs {
                    display: block;
                }
                
                .detail-content { 
                    flex-direction: column; 
                }
                
                .detail-divider { 
                    width: calc(100% - 40px);
                    height: 1px;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
                    margin: 10px 0px 0px 0px;
                    align-self: center;
                }
                
                .detail-left { 
                    padding: 16px; 
                    flex: none; 
                }

                
                .detail-left-header {
                    align-items: center;
                    gap: 12px;
                }
                
                .detail-info-row {
                    padding-left: 0;
                    justify-content: center;
                    margin-top: 20px;
                }

                
                .detail-right { 
                    padding: 0; 
                    border-radius: 0 0 24px 24px; 
                    margin: 0 10px 10px 10px;
                }
                
                #tab-content-container { 
                    flex-grow: 1;
                    overflow-y: hidden;
                    padding: 30px 10px;
                    box-sizing: border-box;
                    scrollbar-width: none;
                    max-height: 100%;
                }
                
                .icon-content { 
                    justify-content: flex-start; 
                }
                
                .icon-background-wrapper { 
                    width: 150px; 
                    height: 150px; 
                }
                
                .detail-title-area { 
                    margin-top: 5px; 
                }
            }            
            
            /* Circular Slider Styles */
            .circular-slider-container {
                position: relative;
                width: 160px;
                height: 160px;
                margin: 16px auto;
            }
            .slider-track {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0);
            }
            .progress-svg {
                position: absolute;
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            .progress-bg {
                stroke: rgba(255, 255, 255, 0.1);
                stroke-width: 16;
                fill: none;
            }
            .progress-fill {
                stroke: #FF9500;
                stroke-width: 16;
                fill: none;
                stroke-linecap: round;
                transition: stroke-dashoffset 0.2s ease;
            }
            .slider-inner {
                position: absolute;
                top: 12px;
                left: 12px;
                width: 136px;
                height: 136px;
                background: rgba(255, 255, 255, 0);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 0px solid rgba(255, 255, 255, 0.1);
            }
            .slider-inner:hover {
            }
            .slider-inner.off {
                opacity: 0.3;
            }
            .slider-inner.off:hover {
                opacity: 0.5;
            }
            .circular-value {
                font-size: 24px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: -10px;
                transition: all 0.2s ease;
            }
            .circular-label {
                font-size: 11px;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: all 0.2s ease;
                margin-top: 5px;
                margin-bottom: 15px;
            }
            .power-icon {
                font-size: 20px;
                margin-bottom: 0px;
                transition: all 0.2s ease;
                color: var(--text-secondary);
            }
            .circular-slider-container.off .progress-fill {
                stroke: rgba(255, 255, 255, 0.3) !important;
            }
            .circular-slider-container.off .handle {
                border-color: rgba(255, 255, 255, 0.3) !important;
                pointer-events: none;
            }
            .handle {
                position: absolute;
                width: 13px;
                height: 13px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #fff;
                border-radius: 50%;
                cursor: grab;
                transition: transform 0.1s ease;
                z-index: 10;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transform: scale(1.2);
            }
            .handle:hover {
                transform: scale(1.4);
            }
            .handle:active {
                cursor: grabbing;
            }

            /* Temp and Color Controls */
            .device-control-row {
                width: 100%; 
                max-width: 280px; 
                display: flex;
                gap: 12px; 
                justify-content: center;
                margin-top: 16px;
                z-index: 9;
                position: relative;
            }
            .device-control-row.hidden { display: none; }
            .device-control-button {
                flex-basis: 50px;
                flex-grow: 0;
                flex-shrink: 0;
                width: 50px;
                height: 50px; 
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1); 
                border: none;
                color: var(--text-primary); 
                cursor: pointer;
                transition: all 0.2s ease; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                padding: 0;
            }
            .device-control-button svg {
                width: 24px; height: 24px; stroke-width: 1;
            }
            .device-control-button:hover { transform: scale(1.05); background: rgba(255,255,255,0.2); }
            .device-control-button.active { background: var(--accent); }

            .device-control-presets { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.4s ease; width: 100%; max-width: 280px;}
            .device-control-presets.visible { max-height: 400px; opacity: 1; margin-top: 30px;}
            .device-control-presets-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; justify-items: center;}
            .device-control-preset {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                color: rgba(255,255,255,0.9);
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }
            .device-control-preset.active { border-color: white; }
            .device-control-preset.active::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; text-shadow: 0 0 4px rgba(0,0,0,0.8); }

            /* Media Player Individual Presets */
            .device-control-presets.music-assistant-presets,
            .device-control-presets.tts-presets {
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: all 0.4s ease;
                width: 100%;
                max-width: 500px;
            }
            
            .device-control-presets.music-assistant-presets.visible,
            .device-control-presets.tts-presets.visible {
                max-height: 500px;
                opacity: 1;
                margin-top: 16px;
            }
            
            .preset-content {
                padding: 20px;
                text-align: center;
                color: var(--text-secondary);
                font-size: 14px;
            }

            .device-control-presets.climate { max-width: 280px; }
            .climate-setting-row { 
                display: flex; 
                gap: 8px; 
                margin-bottom: 12px; 
                overflow-x: auto; 
                scrollbar-width: none; 
                -ms-overflow-style: none; 
                -webkit-overflow-scrolling: touch; 
                padding-bottom: 8px;
            }
            .climate-setting-row::-webkit-scrollbar { display: none; }
            .climate-setting-option { 
                padding: 8px 16px; 
                background: rgba(255, 255, 255, 0.08); 
                border: 1px solid rgba(255, 255, 255, 0.15); 
                border-radius: 20px;     
                cursor: pointer; 
                white-space: nowrap; 
                transition: all 0.2s ease; 
            } 
            .climate-setting-option.active { 
                background: var(--accent-light); 
                border-color: var(--accent); 
                color: var(--accent); 
            } 
            .climate-setting-option:hover { 
                background: rgba(255, 255, 255,0.2); 
            }
            .climate-category-header {
                font-size: 14px; 
                font-weight: 600; 
                color: var(--text-secondary);
                padding: 0px;
                border-bottom: 0px solid rgba(255,255,255,0.1);
                margin-bottom: 8px;
            }            

            @media (max-width: 768px) {
                .detail-content { flex-direction: column; }                
                .detail-left { padding: 16px; flex: none; }
                .detail-right { padding: 0; border-radius: 0 0 24px 24px; margin: 0 10px 10px 10px;}
                .icon-content { justify-content: flex-start; }
            }

            /* Media Player Service Presets */
            .device-control-presets.media-services .device-control-presets-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .device-control-preset.media-service {
                height: 80px;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 8px;
                border-radius: 16px;
                position: relative;
                overflow: hidden;
            }
            
            .device-control-preset.media-service svg {
                width: 24px;
                height: 24px;
            }
            
            .device-control-preset.media-service span {
                font-size: 12px;
                font-weight: 600;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }
            
            /* Media Player Circular Slider Color */
            .circular-slider-container.media .progress-fill {
                stroke: #1DB954 !important;
            }
            
            .circular-slider-container.media .handle {
                border-color: #1DB954 !important;
            }

            /* Media Position Display */
            .media-position-display {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 16px 0;
                width: 100%;
                max-width: 280px;
            }
            
            .current-time, .total-time {
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
                min-width: 35px;
                text-align: center;
            }
            
            .position-bar {
                flex: 1;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                position: relative;
            }
            
            .position-progress {
                height: 100%;
                background: #1DB954;
                border-radius: 2px;
                transition: width 0.3s ease;
            }       
            
            /* --- NEU: Music Assistant Specific Styles --- */
            .music-assistant-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 12px 4px;
            }
            .ma-search-bar-container {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0 8px;
            }
            .ma-search-input {
                flex-grow: 1;
                border: none;
                background: rgba(0,0,0,0.2);
                outline: none;
                color: var(--text-primary);
                font-size: 14px;
                padding: 10px 14px;
                border-radius: 10px;
                transition: background 0.2s ease, box-shadow 0.2s ease;
            }
            .ma-search-input:focus {
                background: rgba(0,0,0,0.3);
                box-shadow: 0 0 0 2px var(--accent);
            }
            .ma-search-input::placeholder {
                color: rgba(255,255,255,0.7);
            }
            
            .ma-enqueue-toggle {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                flex-shrink: 0;
                transition: transform 0.1s ease;
            }
            .ma-enqueue-toggle:active {
                transform: scale(0.9);
            }
            .ma-enqueue-toggle svg { width: 18px; height: 18px; }
            
            .ma-filter-chips {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                scrollbar-width: none;
                padding: 0 8px 4px 8px;
            }
            .ma-filter-chips::-webkit-scrollbar { display: none; }
            
            .ma-chip {
                padding: 6px 14px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 500;
                color: var(--text-secondary);
            }
            .ma-chip:hover {
                background: rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
            }
            .ma-chip.active {
                background: var(--accent);
                border-color: var(--accent);
                color: white;
            }
            
            .ma-results-container {
                min-height: 250px;
                max-height: 300px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
                padding: 0 8px;
            }
             .ma-results-container::-webkit-scrollbar { width: 4px; }
             .ma-results-container::-webkit-scrollbar-track { background: transparent; }
             .ma-results-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
            
            .ma-grid-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 16px;
            }
            .ma-grid-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                cursor: pointer;
                border-radius: 12px;
                padding: 8px;
                transition: background 0.2s ease;
            }
            .ma-grid-item:hover { background: rgba(255,255,255,0.1); }
            .ma-grid-image {
                width: 80px; height: 80px;
                border-radius: 8px;
                background-color: rgba(0,0,0,0.3);
                margin-bottom: 8px;
                display: flex; align-items: center; justify-content: center;
                font-size: 24px;
            }
            .ma-grid-image img { width: 100%; height: 100%; border-radius: 8px; object-fit: cover; }
            .ma-grid-name {
                font-size: 12px; font-weight: 600; color: var(--text-primary);
                line-height: 1.3; width: 100%;
                overflow: hidden; text-overflow: ellipsis;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            }
            .ma-grid-artist { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
            
            .ma-list-container { display: flex; flex-direction: column; gap: 8px; }
            .ma-list-item {
                display: grid;
                grid-template-columns: 40px 1fr auto;
                align-items: center;
                gap: 12px;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .ma-list-item:hover { background: rgba(255,255,255,0.1); }
            .ma-list-image { width: 40px; height: 40px; border-radius: 4px; background-color: rgba(0,0,0,0.3); }
            .ma-list-image img { width: 100%; height: 100%; border-radius: 4px; object-fit: cover; }
            .ma-list-info { overflow: hidden; }
            .ma-list-name { font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .ma-list-artist { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            
            .ma-category-header {
                font-size: 14px; font-weight: 600; color: var(--text-secondary);
                padding: 12px 8px 4px 8px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                margin-bottom: 8px;
            }
            .ma-loading-state, .ma-empty-state {
                text-align: center; color: var(--text-secondary);
                padding: 40px 20px; font-style: italic; font-size: 13px;
            }
                                    
            </style>

            <div class="main-container">
                <div class="search-row">
                    <div class="search-panel glass-panel">
                        <div class="search-wrapper">
                            <div class="category-icon">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                                    <path d="M12 18h.01"/>
                                </svg>
                            </div>
                            
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Geräte suchen..."
                                autocomplete="off"
                                spellcheck="false"
                            >
                            
                            <button class="clear-button">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>

                            <div class="filter-icon">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <line x1="4" y1="21" x2="4" y2="14"/>
                                    <line x1="4" y1="10" x2="4" y2="3"/>
                                    <line x1="12" y1="21" x2="12" y2="12"/>
                                    <line x1="12" y1="8" x2="12" y2="3"/>
                                    <line x1="20" y1="21" x2="20" y2="16"/>
                                    <line x1="20" y1="12" x2="20" y2="3"/>
                                    <line x1="1" y1="14" x2="7" y2="14"/>
                                    <line x1="9" y1="8" x2="15" y2="8"/>
                                    <line x1="17" y1="16" x2="23" y2="16"/>
                                </svg>
                            </div>
                        </div>

                        <div class="results-container">
                             <div class="subcategories">
                                <div class="subcategory-chip active" data-subcategory="all">
                                    <div class="chip-content">
                                        <span class="subcategory-name">Alle</span>
                                        <span class="subcategory-status"></span>
                                    </div>
                                </div>
                                <div class="subcategory-chip" data-subcategory="lights">
                                    <div class="chip-content">
                                        <span class="subcategory-name">Lichter</span>
                                        <span class="subcategory-status"></span>
                                    </div>
                                </div>
                                <div class="subcategory-chip" data-subcategory="climate">
                                    <div class="chip-content">
                                        <span class="subcategory-name">Klima</span>
                                        <span class="subcategory-status"></span>
                                    </div>
                                </div>
                                <div class="subcategory-chip" data-subcategory="covers">
                                    <div class="chip-content">
                                        <span class="subcategory-name">Rollos</span>
                                        <span class="subcategory-status"></span>
                                    </div>
                                </div>
                                <div class="subcategory-chip" data-subcategory="media">
                                    <div class="chip-content">
                                        <span class="subcategory-name">Medien</span>
                                        <span class="subcategory-status"></span>
                                    </div>
                                </div>
                                <div class="subcategory-chip" data-subcategory="none">
                                    <div class="chip-content">
                                        <span class="subcategory-name">Keine</span>
                                        <span class="subcategory-status"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="results-grid">
                            </div>
                        </div>
                    </div>

                    <div class="detail-panel glass-panel">
                        </div>

                    <div class="category-buttons">
                        <button class="category-button glass-panel active" data-category="devices" title="Geräte">
                            <svg viewBox="0 0 24 24" fill="none">
                                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                                <path d="M12 18h.01"/>
                            </svg>
                        </button>
                        
                        <button class="category-button glass-panel" data-category="scripts" title="Skripte">
                           <svg viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                        </button>
                        
                        <button class="category-button glass-panel" data-category="automations" title="Automationen">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v6l3-3 3 3"/>
                                <path d="M12 18v4"/>
                                <path d="M8 8v8"/>
                                <path d="M16 8v8"/>
                                <circle cx="12" cy="12" r="2"/>
                            </svg>
                        </button>
                        
                        <button class="category-button glass-panel" data-category="scenes" title="Szenen">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M2 3h6l2 13 13-13v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
                                <path d="M8 3v4"/>
                                <path d="M16 8v4"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const categoryIcon = this.shadowRoot.querySelector('.category-icon');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
        // Back button listener is now set dynamically in renderDetailView

        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        clearButton.addEventListener('click', (e) => { e.stopPropagation(); this.clearSearch(); });
        categoryIcon.addEventListener('click', (e) => { e.stopPropagation(); this.toggleCategoryButtons(); });
        filterIcon.addEventListener('click', (e) => { e.stopPropagation(); this.handleFilterClick(); });
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => { e.stopPropagation(); this.handleCategorySelect(button); });
        });
        this.shadowRoot.querySelector('.subcategories').addEventListener('click', (e) => {
            const chip = e.target.closest('.subcategory-chip');
            if (chip) { e.stopPropagation(); this.handleSubcategorySelect(chip); }
        });
        this.shadowRoot.querySelector('.main-container').addEventListener('click', (e) => { e.stopPropagation(); });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('fast-search-card')) {
                this.hideCategoryButtons();
                this.collapsePanel();
            }
        });
    }

    handleSearch(query) {
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        this.isSearching = query.trim().length > 0;
        if (this.searchTimeout) { clearTimeout(this.searchTimeout); }
        if (query.length > 0) {
            clearButton.classList.add('visible');
            this.animateElementIn(clearButton, { scale: [0, 1], opacity: [0, 1] });
        } else {
            this.isSearching = false; 
            const animation = this.animateElementOut(clearButton);
            animation.finished.then(() => { clearButton.classList.remove('visible'); });
        }
        searchInput.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' });
        if (!this.isPanelExpanded) { this.expandPanel(); }
        this.performSearch(query);
    }

    handleSearchFocus() {
        this.hideCategoryButtons();
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        searchPanel.animate([
            { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)' },
            { 
                boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)'
                /* Die Zeile für 'borderColor' wurde hier entfernt */
            }
        ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
        if (!this.isPanelExpanded) { this.expandPanel(); }
    }    

    clearSearch() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        searchInput.value = '';
        this.isSearching = false; 
        const animation = this.animateElementOut(clearButton);
        animation.finished.then(() => { clearButton.classList.remove('visible'); });
        this.hasAnimated = false;
        this.showCurrentCategoryItems();
        searchInput.focus();
    }

    toggleCategoryButtons() {
        if (this.isMenuView) { this.hideCategoryButtons(); } else { this.showCategoryButtons(); }
    }

    showCategoryButtons() {
        this.collapsePanel(); // <-- HINZUGEFÜGTE ZEILE
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        this.isMenuView = true;
        categoryButtons.classList.add('visible');
        categoryButtons.animate([{ opacity: 0, transform: 'translateX(20px) scale(0.9)' }, { opacity: 1, transform: 'translateX(0) scale(1)' }], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    }
    
    hideCategoryButtons() {
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        if (!this.isMenuView) return;
        const animation = categoryButtons.animate([{ opacity: 1, transform: 'translateX(0) scale(1)' }, { opacity: 0, transform: 'translateX(20px) scale(0.9)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
        animation.finished.then(() => { categoryButtons.classList.remove('visible'); this.isMenuView = false; });
    }

    handleCategorySelect(selectedButton) {
        const category = selectedButton.dataset.category;
        if (category === this.activeCategory) return;
        this.shadowRoot.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
        selectedButton.classList.add('active');
        selectedButton.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        this.activeCategory = category;
        this.updateCategoryIcon();
        this.updatePlaceholder();
        this.hideCategoryButtons();
        // this.expandPanel(); // ENTFERNT
        // this.showCurrentCategoryItems(); // ENTFERNT
    }

    handleSubcategorySelect(selectedChip) {
        let subcategory = selectedChip.dataset.subcategory;
        if (subcategory === this.activeSubcategory && subcategory !== 'all') {
            subcategory = 'all';
            selectedChip = this.shadowRoot.querySelector(`.subcategory-chip[data-subcategory="all"]`);
        } else if (subcategory === this.activeSubcategory) {
            return;
        }
        this.shadowRoot.querySelectorAll('.subcategory-chip').forEach(chip => chip.classList.remove('active'));
        selectedChip.classList.add('active');
        selectedChip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        this.activeSubcategory = subcategory;
        this.hasAnimated = false;
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (searchInput.value.trim()) {
            searchInput.value = '';
            this.isSearching = false; 
            const clearButton = this.shadowRoot.querySelector('.clear-button');
            clearButton.classList.remove('visible');
        }
        this.filterBySubcategory();
    }

    handleFilterClick() {
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        filterIcon.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }, { transform: 'rotate(0deg)' }], { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }

    expandPanel() {
        if (this.isPanelExpanded) return;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        this.isPanelExpanded = true;
        searchPanel.classList.add('expanded');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (!searchInput.value.trim()) { this.showCurrentCategoryItems(); }
    }

    collapsePanel() {
        if (!this.isPanelExpanded) return;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        this.isPanelExpanded = false;
        searchPanel.classList.remove('expanded');
    }

    updateCategoryIcon() {
        const categoryIcon = this.shadowRoot.querySelector('.category-icon');
        const icons = {
            devices: `<svg viewBox="0 0 24 24" fill="none"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
            scripts: `<svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
            automations: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2v6l3-3 3 3"/><path d="M12 18v4"/><circle cx="12" cy="12" r="2"/></svg>`,
            scenes: `<svg viewBox="0 0 24 24" fill="none"><path d="M2 3h6l2 13 13-13v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M8 3v4"/></svg>`
        };
        categoryIcon.innerHTML = icons[this.activeCategory] || icons.devices;
    }

    updatePlaceholder() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const placeholders = {
            devices: 'Geräte suchen...',
            scripts: 'Skripte suchen...',
            automations: 'Automationen suchen...',
            scenes: 'Szenen suchen...'
        };
        searchInput.placeholder = placeholders[this.activeCategory] || placeholders.devices;
    }

    updateItems() {
        if (!this._hass || !this._config.entities) return;
        this.allItems = this._config.entities.map(entityConfig => {
            const entityId = entityConfig.entity;
            const state = this._hass.states[entityId];
            if (!state) return null;
            const domain = entityId.split('.')[0];
            const areaName = entityConfig.area || 'Ohne Raum';
            return {
                id: entityId,
                name: entityConfig.title || state.attributes.friendly_name || entityId,
                domain: domain,
                category: this.categorizeEntity(domain),
                area: areaName,
                state: state.state,
                attributes: state.attributes,
                icon: this.getEntityIcon(domain),
                isActive: this.isEntityActive(state)
            };
        }).filter(Boolean);
        this.allItems.sort((a, b) => a.area.localeCompare(b.area));
        this.showCurrentCategoryItems();
        this.updateSubcategoryCounts();
    }

    getSubcategoryStatusText(subcategory, count) {
        const textMap = { 'lights': 'An', 'climate': 'Aktiv', 'covers': 'Offen', 'media': 'Aktiv' };
        const text = textMap[subcategory] || 'Aktiv'; 
        return `${count} ${text}`;
    }

    updateSubcategoryCounts() {
        if (!this._hass || !this.allItems) return;
        const domainMap = { 'lights': ['light', 'switch'], 'climate': ['climate', 'fan'], 'covers': ['cover'], 'media': ['media_player'] };
        for (const subcategory in domainMap) {
            const chip = this.shadowRoot.querySelector(`.subcategory-chip[data-subcategory="${subcategory}"]`);
            if (!chip) continue;
            const domains = domainMap[subcategory];
            const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, 'devices') && domains.includes(item.domain));
            const activeCount = categoryItems.filter(item => {
                const state = this._hass.states[item.id];
                return state && this.isEntityActive(state);
            }).length;
            const statusText = this.getSubcategoryStatusText(subcategory, activeCount);
            const statusElement = chip.querySelector('.subcategory-status');
            if (statusElement) { statusElement.textContent = statusText; }
        }
    }

    updateStates() {
        if (!this._hass || this.isDetailView || this.isSearching) { return; }
        this.updateSubcategoryCounts();
        const deviceCards = this.shadowRoot.querySelectorAll('.device-card');
        deviceCards.forEach(card => {
            const entityId = card.dataset.entity;
            const state = this._hass.states[entityId];
            if (state) {
                const isActive = this.isEntityActive(state);
                const wasActive = card.classList.contains('active');
                card.classList.toggle('active', isActive);
                if (isActive !== wasActive) { this.animateStateChange(card, isActive); }
                const statusElement = card.querySelector('.device-status');
                if (statusElement) { statusElement.textContent = this.getEntityStatus(state); }
            }
        });
    }

    categorizeEntity(domain) {
        const categoryMap = { light: 'lights', switch: 'lights', climate: 'climate', fan: 'climate', cover: 'covers', media_player: 'media', script: 'scripts', automation: 'automations', scene: 'scenes' };
        return categoryMap[domain] || 'other';
    }

    getEntityIcon(domain) {
        const iconMap = { light: '💡', switch: '🔌', climate: '🌡️', fan: '💨', cover: '🪟', media_player: '🎵', script: '📄', automation: '⚙️', scene: '🎬' };
        return iconMap[domain] || '⚙️';
    }

    isEntityActive(state) {
        if (!state) return false;
        const domain = state.entity_id.split('.')[0];
        switch (domain) {
            case 'climate':
                return !['off', 'unavailable'].includes(state.state);


            case 'media_player':
                // SMART CHECK: Nur als aktiv zählen wenn wirklich etwas läuft
                if (!['playing', 'paused'].includes(state.state)) return false;
                
                // Zusätzliche Prüfung für beendete Songs
                const duration = state.attributes.media_duration || 0;
                const position = state.attributes.media_position || 0;
                const updatedAt = state.attributes.media_position_updated_at;
                
                if (state.state === 'playing' && duration > 0 && updatedAt) {
                    const now = new Date();
                    const updateTime = new Date(updatedAt);
                    const elapsedSinceUpdate = (now - updateTime) / 1000;
                    const realPosition = position + elapsedSinceUpdate;
                    
                    // Nicht aktiv wenn Song zu Ende
                    if (realPosition >= duration) return false;
                }
                
                return true;
                
            case 'light':
            case 'switch':
            case 'fan':
                return state.state === 'on';
            case 'cover':
                return state.state === 'open' || (state.attributes.current_position != null && state.attributes.current_position > 0);
            case 'automation':
                return state.state === 'on';
            default:
                return state.state === 'on';
        }
    }

    getEntityStatus(state) {
        if (!state) return 'Unbekannt';
        const domain = state.entity_id.split('.')[0];
        switch (domain) {
            case 'light':
                if (state.state === 'on') {
                    const brightness = state.attributes.brightness;
                    if (brightness) { return `${Math.round((brightness / 255) * 100)}%`; }
                    return 'An';
                }
                return 'Aus';
            case 'climate':
                const temp = state.attributes.current_temperature;
                return temp ? `${temp}°C` : state.state;
            case 'cover':
                const coverPosition = state.attributes.current_position; // UMBENANNT!
                if (coverPosition !== undefined) {
                    if (coverPosition > 0) return `${coverPosition}% Offen`;
                    return 'Geschlossen';
                }
                return state.state === 'open' ? 'Offen' : 'Geschlossen';
            case 'media_player':
                // SMART STATUS: Prüfe ob Song wirklich noch läuft
                const duration = state.attributes.media_duration || 0;
                const mediaPosition = state.attributes.media_position || 0; // UMBENANNT!
                const updatedAt = state.attributes.media_position_updated_at;
                
                // Berechne echte Position
                let realPosition = mediaPosition; // ANGEPASST!
                if (state.state === 'playing' && updatedAt) {
                    const now = new Date();
                    const updateTime = new Date(updatedAt);
                    const elapsedSinceUpdate = (now - updateTime) / 1000;
                    realPosition = mediaPosition + elapsedSinceUpdate; // ANGEPASST!
                }
                
                // Status basierend auf echter Position
                if (state.state === 'playing' && duration > 0 && realPosition >= duration) {
                    return 'Bereit';
                } else if (state.state === 'playing') {
                    return 'Spielt';
                } else if (state.state === 'paused') {
                    return 'Pausiert';
                } else {
                    return 'Aus';
                }
                
            case 'script':
                return state.state === 'on' ? 'Läuft' : 'Bereit';
            case 'automation':
                return state.state === 'on' ? 'Aktiv' : 'Inaktiv';
            case 'scene':
                return 'Bereit';
            default:
                return state.state === 'on' ? 'An' : 'Aus';
        }
    }

    performSearch(query) {
        if (!query.trim()) { this.showCurrentCategoryItems(); return; }
        const searchTerm = query.toLowerCase();
        this.filteredItems = this.allItems.filter(item => {
            if (!this.isItemInCategory(item, this.activeCategory)) return false;
            return item.name.toLowerCase().includes(searchTerm) || item.id.toLowerCase().includes(searchTerm) || item.area.toLowerCase().includes(searchTerm);
        });
        this.renderResults();
    }

    showCurrentCategoryItems() {
        this.filteredItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
        if (this.activeSubcategory !== 'all') { this.filterBySubcategory(); } else { this.renderResults(); }
    }

    isItemInCategory(item, category) {
        switch (category) {
            case 'devices': return !['script', 'automation', 'scene'].includes(item.domain);
            case 'scripts': return item.domain === 'script';
            case 'automations': return item.domain === 'automation';
            case 'scenes': return item.domain === 'scene';
            default: return true;
        }
    }

    filterBySubcategory() {
        if (this.activeSubcategory === 'all') { this.showCurrentCategoryItems(); return; }
        if (this.activeSubcategory === 'none') { this.filteredItems = []; this.renderResults(); return; }
        const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
        const domainMap = { 'lights': ['light', 'switch'], 'climate': ['climate', 'fan'], 'covers': ['cover'], 'media': ['media_player'] };
        const domains = domainMap[this.activeSubcategory] || [];
        this.filteredItems = categoryItems.filter(item => domains.includes(item.domain));
        this.renderResults();
    }

    renderResults() {
        const resultsGrid = this.shadowRoot.querySelector('.results-grid');
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts = [];
        if (this.filteredItems.length === 0) {
            resultsGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Keine Ergebnisse</div><div class="empty-subtitle">Versuchen Sie einen anderen Suchbegriff</div></div>`;
            return;
        }
        resultsGrid.innerHTML = '';
        const groupedItems = this.filteredItems.reduce((groups, item) => {
            const area = item.area || 'Ohne Raum';
            if (!groups[area]) { groups[area] = []; }
            groups[area].push(item);
            return groups;
        }, {});
        let cardIndex = 0;
        Object.keys(groupedItems).sort().forEach(area => {
            const areaHeader = document.createElement('div');
            areaHeader.className = 'area-header';
            areaHeader.textContent = area;
            resultsGrid.appendChild(areaHeader);
            groupedItems[area].forEach((item) => {
                const card = this.createDeviceCard(item);
                resultsGrid.appendChild(card);
                if (!this.hasAnimated) {
                    const timeout = setTimeout(() => {
                        this.animateElementIn(card, { opacity: [0, 1], transform: ['translateY(20px) scale(0.9)', 'translateY(0) scale(1)'] });
                    }, cardIndex * 50);
                    this.animationTimeouts.push(timeout);
                }
                cardIndex++;
            });
        });
        this.hasAnimated = true;
    }

    createDeviceCard(item) {
        const card = document.createElement('div');
        card.className = `device-card ${item.isActive ? 'active' : ''}`;
        card.dataset.entity = item.id;
        card.innerHTML = `<div class="device-icon">${item.icon}</div><div class="device-info"><div class="device-name">${item.name}</div><div class="device-status">${this.getEntityStatus(this._hass.states[item.id])}</div></div>`;
        card.addEventListener('click', () => this.handleDeviceClick(item, card));
        return card;
    }

    handleDeviceClick(item, card) {
        this.previousSearchState = {
            searchValue: this.shadowRoot.querySelector('.search-input').value,
            activeCategory: this.activeCategory,
            activeSubcategory: this.activeSubcategory,
            filteredItems: [...this.filteredItems]
        };
        this.currentDetailItem = item;
        this.showDetailView();
    }

    showDetailView() {
        this.isDetailView = true;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        searchPanel.classList.add('hidden');
        detailPanel.classList.add('visible');
        this.renderDetailView();
    }

    handleBackClick() {
        this.isDetailView = false;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        searchPanel.classList.remove('hidden');
        detailPanel.classList.remove('visible');

        if (this.previousSearchState) {
            this.shadowRoot.querySelector('.search-input').value = this.previousSearchState.searchValue;
            this.activeCategory = this.previousSearchState.activeCategory;
            this.shadowRoot.querySelectorAll('.subcategory-chip').forEach(chip => { 
                chip.classList.toggle('active', chip.dataset.subcategory === this.previousSearchState.activeSubcategory);
            });
            this.activeSubcategory = this.previousSearchState.activeSubcategory;
            this.filteredItems = this.previousSearchState.filteredItems;
            
            this.updateCategoryIcon();
            this.updatePlaceholder();
            this.renderResults();
        }
    }
    
    renderDetailView() {
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        if (!this.currentDetailItem) return;
        
        const item = this.currentDetailItem;
        
        const leftPaneHTML = this.getDetailLeftPaneHTML(item);
        const rightPaneHTML = this.getDetailRightPaneHTML(item);

        detailPanel.innerHTML = `
            <div class="detail-content">
                <div class="detail-left">${leftPaneHTML}</div>
                <div class="detail-divider"></div>
                <div class="detail-right">${rightPaneHTML}</div>
            </div>
        `;

        this.shadowRoot.querySelector('.back-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleBackClick();
        });

        this.setupDetailTabs(item);
        
        const iconBackground = detailPanel.querySelector('.icon-background');
        const titleArea = detailPanel.querySelector('.detail-title-area');
        const infoRow = detailPanel.querySelector('.detail-info-row');

        if(iconBackground) this.animateElementIn(iconBackground, { opacity: [0, 1] }, { duration: 600 });
        if(titleArea) this.animateElementIn(titleArea, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] }, { delay: 300 });
        if(infoRow) this.animateElementIn(infoRow, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] }, { delay: 500 });
    }

    updateDetailViewStates() {
        if (!this.isDetailView || !this.currentDetailItem || !this._hass) return;
        
        const item = this.currentDetailItem;
        const state = this._hass.states[item.id];
        if (!state) return;
    
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        if (detailPanel) {
            const isActive = this.isEntityActive(state);
            const statusIndicator = detailPanel.querySelector('.status-indicator-large');
            if (statusIndicator) {
                statusIndicator.textContent = this.getDetailedStateText(item).status;
                statusIndicator.classList.toggle('active', isActive);
            }
    
            const quickStats = detailPanel.querySelector('.quick-stats');
            if (quickStats) {
                quickStats.innerHTML = this.getQuickStats(item).map(stat => `<div class="stat-item">${stat}</div>`).join('');
            }
            
            const detailInfoRow = detailPanel.querySelector('.detail-info-row');
            if(detailInfoRow) {
                 detailInfoRow.style.gap = isActive ? '12px' : '0px';
            }
            
            const detailName = detailPanel.querySelector('.detail-name');
            if (detailName) detailName.textContent = item.name;
            
            const detailArea = detailPanel.querySelector('.detail-area');
            if (detailArea) detailArea.textContent = item.area;
    
            // Icon Background Update - BEIDE Fälle abdecken
            const iconBackground = detailPanel.querySelector('.icon-background');
            if (iconBackground) {
                if (item.domain === 'media_player') {
                    // MEDIA PLAYER: Aggressives Album Art Update
                    const newAlbumArt = this.getAlbumArtUrl(item);
                    const fallbackBg = this.getBackgroundImageForItem({...item, state: state.state});
                    
                    if (newAlbumArt) {
                        iconBackground.style.backgroundImage = `url("${newAlbumArt}")`;
                    } else {
                        iconBackground.style.backgroundImage = `url("${fallbackBg}")`;
                    }
                    
                    iconBackground.style.opacity = '1';        
                } else {
                    // ANDERE GERÄTE: Standard Background
                    const newBg = this.getBackgroundImageForItem({...item, state: state.state});
                    const currentBg = iconBackground.style.backgroundImage;
                    if (currentBg !== `url("${newBg}")`) {
                       iconBackground.style.backgroundImage = `url('${newBg}')`;
                       iconBackground.style.opacity = '0';
                       setTimeout(() => { iconBackground.style.opacity = '1'; }, 100);
                    }
                }
            }
        }
        
        // Device-spezifische Updates (bleibt gleich)
        if (item.domain === 'light') {
            this.updateLightControlsUI(item);
        } else if (item.domain === 'cover') {
            this.updateCoverControlsUI(item);
        } else if (item.domain === 'climate') {
            this.updateClimateControlsUI(item);
        } else if (item.domain === 'media_player') {
            this.updateMediaPlayerControlsUI(item);
        }
    }        

    toggleFocusMode(container, isEntering) {
        const slider = container.querySelector('.circular-slider-container');
        const positionDisplay = container.querySelector('.media-position-display');
        const controlRow = container.querySelector('.device-control-row');
        const activePresets = container.querySelector('.device-control-presets.visible');
        
        // Bestimme Bewegung basierend auf Gerätetyp
        let moveDistance = '-270px'; // Standard für Media Player
        if (container.querySelector('.climate')) {
            moveDistance = '-210px'; // Weniger für Climate
        } else if (container.querySelector('.circular-slider-container.brightness')) {
            moveDistance = '-220px'; // Für Light (Farb-Presets)
        } else if (container.querySelector('.circular-slider-container.cover')) {
            moveDistance = '-220px'; // Für Cover (Positions-Presets)
        } else if (container.querySelector('.device-control-presets.tts-presets.visible')) {
            moveDistance = '-200px'; // Spezifisch für TTS (weniger als Music Assistant)
        }
        
        if (isEntering) {
            // ENTERING FOCUS MODE
            const timeline = [];
            
            // 1. Fade out slider und position display
            if (slider) {
                timeline.push(slider.animate([
                    { opacity: 1, transform: 'scale(1) translateY(0)' },
                    { opacity: 0, transform: 'scale(0.8) translateY(-20px)' }
                ], { duration: 300, easing: 'ease-in', fill: 'forwards' }));
            }
            
            if (positionDisplay) {
                timeline.push(positionDisplay.animate([
                    { opacity: 1, transform: 'translateY(0)' },
                    { opacity: 0, transform: 'translateY(-10px)' }
                ], { duration: 250, delay: 50, easing: 'ease-in', fill: 'forwards' }));
            }
            
            // 2. Move control row up (nach 200ms)
            setTimeout(() => {
                if (controlRow) {
                    controlRow.animate([
                        { transform: 'translateY(0)' },
                        { transform: `translateY(${moveDistance})` }
                    ], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
                }
            }, 200);
            
            // 3. Scale up presets container (nach 300ms)
            setTimeout(() => {
                if (activePresets) {
                    activePresets.animate([
                        { transform: 'translateY(0) scale(1)', opacity: 1 },
                        { transform: `translateY(${moveDistance}) scale(1.05)`, opacity: 1 }
                    ], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
                }
            }, 300);
            
        } else {
            // EXITING FOCUS MODE
            
            // 1. Scale down presets und fade out
            if (activePresets) {
                activePresets.animate([
                    { transform: `translateY(${moveDistance}) scale(1.05)`, opacity: 1 },
                    { transform: 'translateY(0) scale(1)', opacity: 0 }
                ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
            }
            
            // 2. Move control row back (nach 100ms)
            setTimeout(() => {
                if (controlRow) {
                    controlRow.animate([
                        { transform: `translateY(${moveDistance})` },
                        { transform: 'translateY(0)' }
                    ], { duration: 400, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });
                }
            }, 100);
            
            // 3. Fade in slider und position (nach 200ms)
            setTimeout(() => {
                if (positionDisplay) {
                    positionDisplay.animate([
                        { opacity: 0, transform: 'translateY(-10px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ], { duration: 400, delay: 100, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });
                }
                
                if (slider) {
                    slider.animate([
                        { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
                        { opacity: 1, transform: 'scale(1) translateY(0)' }
                    ], { duration: 500, delay: 150, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });
                }
            }, 200);
        }
    }

    handleExpandableButton(button, container, presetSelector) {
        const presetsContainer = container.querySelector(presetSelector);
        const isCurrentlyOpen = presetsContainer.getAttribute('data-is-open') === 'true';
        const isInFocusMode = container.hasAttribute('data-focus-mode');
        
        if (!isCurrentlyOpen) {
            // ÖFFNEN
            container.setAttribute('data-focus-mode', 'true');
            button.classList.add('active');
            presetsContainer.classList.add('visible');
            presetsContainer.setAttribute('data-is-open', 'true');
            
            this.toggleFocusMode(container, true);
            
        } else {
            // SCHLIESSEN  
            container.removeAttribute('data-focus-mode');
            button.classList.remove('active');
            presetsContainer.classList.remove('visible');
            presetsContainer.setAttribute('data-is-open', 'false');
            
            this.toggleFocusMode(container, false);
        }
    }
    

    getDetailLeftPaneHTML(item) {
        const newBackButtonSVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        const state = this._hass.states[item.id];
        const isActive = this.isEntityActive(state);
        const stateInfo = this.getDetailedStateText(item);
        const quickStats = this.getQuickStats(item);
        const backgroundImage = this.getBackgroundImageForItem(item);
        const albumArt = (item.domain === 'media_player') ? this.getAlbumArtUrl(item) : null;
        
        const backgroundStyle = albumArt 
            ? `background-image: url('${albumArt}');`
            : `background-image: url('${backgroundImage}');`;
    
        // Tabs nur für Mobile-View hier (werden über CSS gesteuert)
        const tabsConfig = this._config.detail_tabs || [
            { id: 'controls', title: 'Steuerung', default: true, svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>` },
            { id: 'shortcuts', title: 'Shortcuts', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M9.8525 14.6334L3.65151 10.6873C2.41651 9.90141 2.41651 8.09858 3.65151 7.31268L9.8525 3.36659C11.1628 2.53279 12.8372 2.53279 14.1475 3.36659L20.3485 7.31268C21.5835 8.09859 21.5835 9.90142 20.3485 10.6873L14.1475 14.6334C12.8372 15.4672 11.1628 15.4672 9.8525 14.6334Z" stroke="currentColor"></path><path d="M18.2857 12L20.3485 13.3127C21.5835 14.0986 21.5835 15.9014 20.3485 16.6873L14.1475 20.6334C12.8372 21.4672 11.1628 21.4672 9.8525 20.6334L3.65151 16.6873C2.41651 15.9014 2.41651 14.0986 3.65151 13.3127L5.71429 12" stroke="currentColor"></path></svg>` },
            { id: 'history', title: 'Verlauf', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" stroke-linecap="round"></path><path d="M6 17L20 17" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21L20 21" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 7L15 7" stroke="currentColor" stroke-linecap="round"></path></svg>` }
        ];
    
        const mobileTabsHTML = `
            <div class="detail-tabs-container mobile-tabs">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                     ${tabsConfig.map(tab => `<a href="#" class="detail-tab ${tab.default ? 'active' : ''}" data-tab="${tab.id}" title="${tab.title}">${tab.svg}</a>`).join('')}
                </div>
            </div>
        `;
    
        return `
            <div class="detail-left-header">
                <button class="back-button">${newBackButtonSVG}</button>
                <div class="detail-title-area">
                    <h3 class="detail-name">${item.name}</h3>
                    <p class="detail-area">${item.area}</p>
                </div>
                ${mobileTabsHTML}
            </div>
            <div class="icon-content">
                <div class="icon-background-wrapper">
                    <div class="icon-background" style="${backgroundStyle}">
                    </div>
                </div>
                <div class="detail-info-row" style="gap: ${isActive ? '12px' : '0px'}">
                    <div class="status-indicator-large ${isActive ? 'active' : ''}">${stateInfo.status}</div>
                    <div class="quick-stats">
                       ${quickStats.map(stat => `<div class="stat-item">${stat}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // 2. Ändere getDetailRightPaneHTML - füge tabsHTML am Anfang hinzu
    getDetailRightPaneHTML(item) {
        const controlsHTML = this.getDeviceControlsHTML(item);
        const tabsConfig = this._config.detail_tabs || [
            { id: 'controls', title: 'Steuerung', default: true, svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>` },
            { id: 'shortcuts', title: 'Shortcuts', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M9.8525 14.6334L3.65151 10.6873C2.41651 9.90141 2.41651 8.09858 3.65151 7.31268L9.8525 3.36659C11.1628 2.53279 12.8372 2.53279 14.1475 3.36659L20.3485 7.31268C21.5835 8.09859 21.5835 9.90142 20.3485 10.6873L14.1475 14.6334C12.8372 15.4672 11.1628 15.4672 9.8525 14.6334Z" stroke="currentColor"></path><path d="M18.2857 12L20.3485 13.3127C21.5835 14.0986 21.5835 15.9014 20.3485 16.6873L14.1475 20.6334C12.8372 21.4672 11.1628 21.4672 9.8525 20.6334L3.65151 16.6873C2.41651 15.9014 2.41651 14.0986 3.65151 13.3127L5.71429 12" stroke="currentColor"></path></svg>` },
            { id: 'history', title: 'Verlauf', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" stroke-linecap="round"></path><path d="M6 17L20 17" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21L20 21" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 7L15 7" stroke="currentColor" stroke-linecap="round"></path></svg>` }
        ];
    
        const desktopTabsHTML = `
            <div class="detail-tabs-container desktop-tabs">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                     ${tabsConfig.map(tab => `<a href="#" class="detail-tab ${tab.default ? 'active' : ''}" data-tab="${tab.id}" title="${tab.title}">${tab.svg}</a>`).join('')}
                </div>
            </div>
        `;
    
        return `
            ${desktopTabsHTML}
            <div id="tab-content-container">
                 ${tabsConfig.map(tab => `
                    <div class="detail-tab-content ${tab.default ? 'active' : ''}" data-tab-content="${tab.id}">
                        ${tab.id === 'controls' ? controlsHTML : `<div>${tab.title} coming soon.</div>`}
                    </div>
                `).join('')}
            </div>
        `;
    }



    
    
    getDeviceControlsHTML(item) {
        switch (item.domain) {
            case 'light':
                return this.getLightControlsHTML(item);
            case 'cover':
                return this.getCoverControlsHTML(item);
            case 'climate':
                return this.getClimateControlsHTML(item);
            case 'media_player':  // NEU HINZUFÜGEN
                return this.getMediaPlayerControlsHTML(item);                
            default:
                return `<div style="text-align: center; padding-top: 50px; color: var(--text-secondary);">Keine Steuerelemente für diesen Gerätetyp.</div>`;
        }
    }

    getLightControlsHTML(item) {
        const state = this._hass.states[item.id];
        const isOn = state.state === 'on';
        const brightness = isOn ? Math.round((state.attributes.brightness || 0) / 2.55) : 0;
        
        const supportedColorModes = state.attributes.supported_color_modes || [];
        const hasTempSupport = supportedColorModes.includes('color_temp');
        const hasColorSupport = supportedColorModes.some(mode => ['rgb', 'rgbw', 'rgbww', 'hs', 'xy'].includes(mode));
        
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container brightness ${isOn ? '' : 'off'}" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg">
                        <circle class="progress-bg" cx="80" cy="80" r="68"></circle>
                        <circle class="progress-fill" cx="80" cy="80" r="68"></circle>
                    </svg>
                    <div class="slider-inner ${isOn ? '' : 'off'}">
                        <div class="power-icon">⏻</div>
                        <div class="circular-value">${isOn ? brightness + '%' : 'AUS'}</div>
                        <div class="circular-label">Helligkeit</div>
                    </div>
                    <div class="handle"></div>
                </div>
                
                <div class="device-control-row ${isOn && (hasTempSupport || hasColorSupport) ? '' : 'hidden'}">
                    ${hasTempSupport ? `
                        <button class="device-control-button" data-temp="2700" title="Warm White"><svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M13.8062 5L12.8151 3.00376C12.4817 2.33208 11.5184 2.33208 11.1849 3.00376L10.6894 4.00188" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.011 7.427L15.4126 8.23599L16.8648 8.44704" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.7693 8.86914L21.2215 9.08019C21.9668 9.1885 22.2639 10.0994 21.7243 10.6219L20.6736 11.6394" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5724 13.6743L17.5217 14.6918L17.7697 16.1292" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.2656 19.0039L18.5135 20.4414C18.6409 21.1797 17.8614 21.7427 17.1945 21.394L15.8959 20.715" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10.4279 19.5L12 18.678L13.2986 19.357" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.67145 19.3689L5.48645 20.4414C5.35908 21.1797 6.13859 21.7428 6.80546 21.3941L7.65273 20.9511" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.25259 16L6.47826 14.6917L5.78339 14.0188" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3.69875 12L2.27575 10.6219C1.73617 10.0993 2.03322 9.18844 2.77852 9.08012L3.88926 8.9187" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 8.4666L8.58737 8.23591L9.39062 6.61792" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
                        <button class="device-control-button" data-temp="4000" title="Natural White"><svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M12.8151 3.00376C12.4817 2.33208 11.5184 2.33208 11.1849 3.00376L10.6894 4.00188" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 18.678L10.4279 19.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.67145 19.3689L5.48645 20.4414C5.35908 21.1797 6.13859 21.7428 6.80546 21.3941L7.65273 20.9511" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.25259 16L6.47826 14.6917L5.78339 14.0188" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3.69875 12L2.27575 10.6219C1.73617 10.0993 2.03322 9.18844 2.77852 9.08012L3.88926 8.9187" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 8.4666L8.58737 8.23591L9.39062 6.61792" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.4126 8.23597L12.8151 3.00376C12.6484 2.66792 12.3242 2.5 12 2.5V18.678L17.1945 21.3941C17.8614 21.7428 18.6409 21.1798 18.5135 20.4414L17.5217 14.6918L21.7243 10.6219C22.2638 10.0994 21.9668 9.18848 21.2215 9.08017L15.4126 8.23597Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
                        <button class="device-control-button" data-temp="6500" title="Cool White"><svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M8.58737 8.23597L11.1849 3.00376C11.5183 2.33208 12.4817 2.33208 12.8151 3.00376L15.4126 8.23597L21.2215 9.08017C21.9668 9.18848 22.2638 10.0994 21.7243 10.6219L17.5217 14.6918L18.5135 20.4414C18.6409 21.1798 17.8614 21.7428 17.1945 21.3941L12 18.678L6.80547 21.3941C6.1386 21.7428 5.35909 21.1798 5.48645 20.4414L6.47825 14.6918L2.27575 10.6219C1.73617 10.0994 2.03322 9.18848 2.77852 9.08017L8.58737 8.23597Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
                    ` : ''}
                    ${hasColorSupport ? `
                        <button class="device-control-button" data-action="toggle-colors" title="Farbe ändern"><svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20.5096 9.54C20.4243 9.77932 20.2918 9.99909 20.12 10.1863C19.9483 10.3735 19.7407 10.5244 19.5096 10.63C18.2796 11.1806 17.2346 12.0745 16.5002 13.2045C15.7659 14.3345 15.3733 15.6524 15.3696 17C15.3711 17.4701 15.418 17.9389 15.5096 18.4C15.5707 18.6818 15.5747 18.973 15.5215 19.2564C15.4682 19.5397 15.3588 19.8096 15.1996 20.05C15.0649 20.2604 14.8877 20.4403 14.6793 20.5781C14.4709 20.7158 14.2359 20.8085 13.9896 20.85C13.4554 20.9504 12.9131 21.0006 12.3696 21C11.1638 21.0006 9.97011 20.7588 8.85952 20.2891C7.74893 19.8194 6.74405 19.1314 5.90455 18.2657C5.06506 17.4001 4.40807 16.3747 3.97261 15.2502C3.53714 14.1257 3.33208 12.9252 3.36959 11.72C3.4472 9.47279 4.3586 7.33495 5.92622 5.72296C7.49385 4.11097 9.60542 3.14028 11.8496 3H12.3596C14.0353 3.00042 15.6777 3.46869 17.1017 4.35207C18.5257 5.23544 19.6748 6.49885 20.4196 8C20.6488 8.47498 20.6812 9.02129 20.5096 9.52V9.54Z" stroke="currentColor" stroke-width="1"></path><path d="M8 16.01L8.01 15.9989" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 12.01L6.01 11.9989" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 8.01L8.01 7.99889" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 6.01L12.01 5.99889" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 8.01L16.01 7.99889" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>
                    ` : ''}
                </div>
                <div class="device-control-presets device-control-colors" data-is-open="false">
                    <div class="device-control-presets-grid">
                        <div class="device-control-preset" style="background: #ff6b35;" data-rgb="255,107,53"></div>
                        <div class="device-control-preset" style="background: #f7931e;" data-rgb="247,147,30"></div>
                        <div class="device-control-preset" style="background: #ffd23f;" data-rgb="255,210,63"></div>
                        <div class="device-control-preset" style="background: #06d6a0;" data-rgb="6,214,160"></div>
                        <div class="device-control-preset" style="background: #118ab2;" data-rgb="17,138,178"></div>
                        <div class="device-control-preset" style="background: #8e44ad;" data-rgb="142,68,173"></div>
                        <div class="device-control-preset" style="background: #e91e63;" data-rgb="233,30,99"></div>
                        <div class="device-control-preset" style="background: #ffffff;" data-rgb="255,255,255"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getCoverControlsHTML(item) {
        const state = this._hass.states[item.id];
        const position = state.attributes.current_position ?? 0;
        
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container cover" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg">
                        <circle class="progress-bg" cx="80" cy="80" r="68"></circle>
                        <circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: #4A90E2;"></circle>
                    </svg>
                    <div class="slider-inner">
                        <div class="power-icon">⏻</div>
                        <div class="circular-value">${position}%</div>
                        <div class="circular-label">Offen</div>
                    </div>
                    <div class="handle" style="border-color: #4A90E2;"></div>
                </div>

                <div class="device-control-row">
                    <button class="device-control-button" data-action="open" title="Öffnen">
                        <svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 15L12 9L18 15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="stop" title="Stopp">
                       <svg viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M17 4L12 9L7 4" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 20L12 15L7 20" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="close" title="Schließen">
                        <svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="toggle-presets" title="Szenen">
                        <svg viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M5.5 6C5.77614 6 6 5.77614 6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 12.5C5.77614 12.5 6 12.2761 6 12C6 11.7239 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.7239 5 12C5 12.2761 5.22386 12.5 5.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 19C5.77614 19 6 18.7761 6 18.5C6 18.2239 5.77614 18 5.5 18C5.22386 18 5 18.2239 5 18.5C5 18.7761 5.22386 19 5.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 6C12.2761 6 12.5 5.77614 12.5 5.5C12.5 5.22386 12.2761 5 12 5C11.7239 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.7239 6 12 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 19C12.2761 19 12.5 18.7761 12.5 18.5C12.5 18.2239 12.2761 18 12 18C11.7239 18 11.5 18.2239 11.5 18.5C11.5 18.7761 11.7239 19 12 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 6C18.7761 6 19 5.77614 19 5.5C19 5.22386 18.7761 5 18.5 5C18.2239 5 18 5.22386 18 5.5C18 5.77614 18.2239 6 18.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 12.5C18.7761 12.5 19 12.2761 19 12C19 11.7239 18.7761 11.5 18.5 11.5C18.2239 11.5 18 11.7239 18 12C18 12.2761 18.2239 12.5 18.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 19C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 18C18.2239 18 18 18.2239 18 18.5C18 18.7761 18.2239 19 18.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
                <div class="device-control-presets" data-is-open="false">
                    <div class="device-control-presets-grid">
                        <div class="device-control-preset" style="background: linear-gradient(45deg, #FF6B35, #F7931E);" data-position="20">20%</div>
                        <div class="device-control-preset" style="background: linear-gradient(45deg, #F7931E, #FFD23F);" data-position="40">40%</div>
                        <div class="device-control-preset" style="background: linear-gradient(45deg, #FFD23F, #06D6A0);" data-position="60">60%</div>
                        <div class="device-control-preset ${position === 80 ? 'active' : ''}" style="background: linear-gradient(45deg, #06D6A0, #118AB2);" data-position="80">80%</div>
                    </div>
                </div>
            </div>
        `;
    }

    getClimateControlsHTML(item) {
        const state = this._hass.states[item.id];
        const currentTemp = state.attributes.temperature || 20;

        // DEBUG
        console.log('MELCloud Attributes:');
        console.log('vane_horizontal:', state.attributes.vane_horizontal);
        console.log('vane_horizontal_positions:', state.attributes.vane_horizontal_positions);
        console.log('vane_vertical:', state.attributes.vane_vertical);
        console.log('vane_vertical_positions:', state.attributes.vane_vertical_positions);
        console.log('All attributes:', state.attributes);

        // Dynamisch aus dem Gerät lesen
        const supportedHvacModes = state.attributes.hvac_modes || [];
        const supportedFanModes = state.attributes.fan_modes || [];
        const supportedSwingModes = state.attributes.swing_modes || [];

        // Fallback-Listen mit den korrekten MELCloud-Werten
        const defaultHorizontalPositions = ['auto', '1_left', '2', '3', '4', '5_right', 'split', 'swing'];
        const defaultVerticalPositions = ['auto', '1_up', '2', '3', '4', '5_down', 'swing'];
    
        // Icon-Definitionen für alle möglichen Modi
        const hvacIcons = {
            heat: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 12L23 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 2V1" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 23V22" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 20L19 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 4L19 5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 20L5 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 4L5 5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 12L2 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            cool: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M3 7L6.5 9M21 17L17.5 15M12 12L6.5 9M12 12L6.5 15M12 12V5M12 12V18.5M12 12L17.5 15M12 12L17.5 9M12 2V5M12 22V18.5M21 7L17.5 9M3 17L6.5 15M6.5 9L3 10M6.5 9L6 5.5M6.5 15L3 14M6.5 15L6 18.5M12 5L9.5 4M12 5L14.5 4M12 18.5L14.5 20M12 18.5L9.5 20M17.5 15L18 18.5M17.5 15L21 14M17.5 9L21 10M17.5 9L18 5.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            dry: `<svg width="48px" height="48px" viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M5 11.9995C3.78555 12.9117 3 14.3641 3 15.9999C3 18.7613 5.23858 20.9999 8 20.9999C10.7614 20.9999 13 18.7613 13 15.9999C13 14.3641 12.2144 12.9117 11 11.9995" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 12V3H11V12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 3L13 3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 6L13 6" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 9H13" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 14C6.89543 14 6 14.8954 6 16C6 17.1046 6.89543 18 8 18C9.10457 18 10 17.1046 10 16C10 14.8954 9.10457 14 8 14ZM8 14V9" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M18.9991 3C18.9991 3 21.9991 5.99336 21.9994 7.88652C21.9997 9.5422 20.6552 10.8865 18.9997 10.8865C17.3442 10.8865 16.012 9.5422 16 7.88652C16.0098 5.99242 18.9991 3 18.9991 3Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            fan_only: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M18.2785 7C19.7816 7 21 8.11929 21 9.5C21 10.8807 19.7816 12 18.2785 12H3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.9375 20C19.0766 20 20.5 19.5 20.5 17.5C20.5 15.5 19.0766 15 17.9375 15H3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10.4118 4C11.8412 4 13 5.11929 13 6.5C13 7.88071 11.8412 9 10.4118 9H3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            auto: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M7 14L11.7935 5.76839C11.9524 5.45014 12.4476 5.45014 12.6065 5.76839L17.4 14" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8.42105 11.3684H15.8947" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
        };
        // Labels für Fan-Modi
        const fanModeLabels = {
            auto: 'Auto', quiet: 'Leise', low: 'Niedrig', medium: 'Mittel', medium_low: 'Mittel-Niedrig', medium_high: 'Mittel-Hoch', high: 'Hoch', middle: 'Mittel', focus: 'Fokus', diffuse: 'Diffus', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5'
        };
        const hPositions = state.attributes.vane_horizontal_positions || defaultHorizontalPositions;
        const vPositions = state.attributes.vane_vertical_positions || defaultVerticalPositions;
        const showHControls = state.attributes.hasOwnProperty('vane_horizontal');
        const showVControls = state.attributes.hasOwnProperty('vane_vertical');
    
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container climate" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg">
                        <circle class="progress-bg" cx="80" cy="80" r="68"></circle>
                        <circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: #2E8B57;"></circle>
                    </svg>
                    <div class="slider-inner">
                        <div class="power-icon">⏻</div>
                        <div class="circular-value">${currentTemp.toFixed(1)}°C</div>
                        <div class="circular-label">Temperatur</div>
                    </div>
                    <div class="handle" style="border-color: #2E8B57;"></div>
                </div>
                
                <div class="device-control-row">
                    ${supportedHvacModes
                        .filter(mode => hvacIcons[mode])
                        .map(mode => `<button class="device-control-button ${state.state === mode ? 'active' : ''}" data-hvac-mode="${mode}" title="${mode}">${hvacIcons[mode]}</button>`)
                        .join('')}
                    ${(supportedFanModes.length > 0 || supportedSwingModes.length > 0 || showHControls || showVControls) ? `
                        <button class="device-control-button" data-action="toggle-presets" title="Einstellungen">
                            <svg viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M5.5 6C5.77614 6 6 5.77614 6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 12.5C5.77614 12.5 6 12.2761 6 12C6 11.7239 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.7239 5 12C5 12.2761 5.22386 12.5 5.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 19C5.77614 19 6 18.7761 6 18.5C6 18.2239 5.77614 18 5.5 18C5.22386 18 5 18.2239 5 18.5C5 18.7761 5.22386 19 5.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 6C12.2761 6 12.5 5.77614 12.5 5.5C12.5 5.22386 12.2761 5 12 5C11.7239 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.7239 6 12 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 19C12.2761 19 12.5 18.7761 12.5 18.5C12.5 18.2239 12.2761 18 12 18C11.7239 18 11.5 18.2239 11.5 18.5C11.5 18.7761 11.7239 19 12 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 6C18.7761 6 19 5.77614 19 5.5C19 5.22386 18.7761 5 18.5 5C18.2239 5 18 5.22386 18 5.5C18 5.77614 18.2239 6 18.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 12.5C18.7761 12.5 19 12.2761 19 12C19 11.7239 18.7761 11.5 18.5 11.5C18.2239 11.5 18 11.7239 18 12C18 12.2761 18.2239 12.5 18.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 19C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 18C18.2239 18 18 18.2239 18 18.5C18 18.7761 18.2239 19 18.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="device-control-presets climate" data-is-open="false">
                    ${showHControls ? `
                        <div class="climate-category-header">Horizontale Lamellen</div>
                        <div class="climate-setting-row" data-setting-type="vane_horizontal">
                            ${hPositions.map(value => `
                                <div class="climate-setting-option ${state.attributes.vane_horizontal === value ? 'active' : ''}"
                                     data-climate-setting="vane_horizontal"
                                     data-value="${value}">${this.getVaneLabel(value, 'horizontal')}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${showVControls ? `
                        <div class="climate-category-header">Vertikale Lamellen</div>
                        <div class="climate-setting-row" data-setting-type="vane_vertical">
                            ${vPositions.map(value => `
                                <div class="climate-setting-option ${state.attributes.vane_vertical === value ? 'active' : ''}"
                                     data-climate-setting="vane_vertical"
                                     data-value="${value}">${this.getVaneLabel(value, 'vertical')}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${supportedFanModes.length > 0 ? `
                        <div class="climate-category-header">Lüftergeschwindigkeit</div>
                        <div class="climate-setting-row" data-setting-type="fan_mode">
                            ${supportedFanModes.map(mode => `
                                <div class="climate-setting-option ${state.attributes.fan_mode === mode ? 'active' : ''}"
                                     data-climate-setting="fan_mode"
                                     data-value="${mode}">${fanModeLabels[mode] || mode}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getVaneLabel(value, direction) {
        const horizontalLabels = {
            'auto': 'Auto', '1_left': '← Links', '2': '‹', '3': 'Mitte', '4': '›', '5_right': 'Rechts →', 'split': 'Split', 'swing': 'Swing'
        };
    
        const verticalLabels = {
            'auto': 'Auto', '1_up': '↑ Oben', '2': '↗', '3': '→', '4': '↘', '5_down': '↓ Unten', 'swing': 'Swing'
        };
    
        return direction === 'horizontal' 
             ? (horizontalLabels[value] || value)
             : (verticalLabels[value] || value);
    }
    
    getSwingLabel(mode) {
        const swingLabels = {
            'off': 'Aus', 'on': 'Ein', 'vertical': 'Vertikal', 'horizontal': 'Horizontal', 'both': 'Beide'
        };
        return swingLabels[mode] || mode;
    }

    updateClimateControlsUI(item) {
        const climateContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!climateContainer) return;
    
        const state = this._hass.states[item.id];
        const currentTemp = state.attributes.temperature || 20;
    
        // Force DOM reflow
        climateContainer.offsetHeight;
    
        // Update circular slider if exists
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(currentTemp, state.state !== 'off');
        }
    
        // Update active classes for HVAC modes
        climateContainer.querySelectorAll('[data-hvac-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.hvacMode === state.state);
        });
    
        // Längere Verzögerung für Mobile
        const isMobile = window.innerWidth <= 768;
        const delay = isMobile ? 200 : 50;
    
        setTimeout(() => {
            climateContainer.querySelectorAll('.climate-setting-option').forEach(opt => {
                const settingType = opt.getAttribute('data-climate-setting');
                const settingValue = opt.getAttribute('data-value');
    
                let isActive = false;
                switch (settingType) {
                    case 'vane_horizontal':
                        isActive = state.attributes.vane_horizontal === settingValue;
                        break;
                    case 'vane_vertical':
                        isActive = state.attributes.vane_vertical === settingValue;
                        break;
                    case 'fan_mode':
                        isActive = state.attributes.fan_mode === settingValue;
                        break;
                }
    
                opt.classList.toggle('active', isActive);
            });
        }, delay);
    }

    updateMediaPlayerControlsUI(item) {
        const mediaContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!mediaContainer) return;
    
        const state = this._hass.states[item.id];
        const isPlaying = state.state === 'playing';
        const isPaused = state.state === 'paused';
        const isActive = isPlaying || isPaused;
        const volume = state.attributes.volume_level ? Math.round(state.attributes.volume_level * 100) : 50;
    
        // Update circular slider
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(volume, isActive);
        }
    
        // Update play/pause button
        const playPauseBtn = mediaContainer.querySelector('[data-action="play-pause"]');
        if (playPauseBtn) {
            playPauseBtn.classList.remove('active');
            playPauseBtn.title = isPlaying ? 'Pause' : 'Play';
            
            // Update icon
            const iconHTML = isPlaying ? `
                <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor" stroke-width="1"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor" stroke-width="1"></path></svg>
            ` : `
                <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            `;
            playPauseBtn.innerHTML = iconHTML;
        }

        // Update position display
        const currentTimeEl = mediaContainer.querySelector('.current-time');
        const totalTimeEl = mediaContainer.querySelector('.total-time');
        const positionProgress = mediaContainer.querySelector('.position-progress');
        
        if (currentTimeEl && totalTimeEl && positionProgress) {
            const duration = state.attributes.media_duration || 
                             state.attributes.duration || 
                             state.attributes.total_time || 0;
        
            let position = state.attributes.media_position || 
                           state.attributes.position || 
                           state.attributes.current_time || 
                           state.attributes.elapsed_time || 0;
            
            // BERECHNE ECHTE POSITION basierend auf updated_at
            const updatedAt = state.attributes.media_position_updated_at;
            if (isPlaying && updatedAt) {
                const now = new Date();
                const updateTime = new Date(updatedAt);
                const elapsedSinceUpdate = (now - updateTime) / 1000; // Sekunden seit letztem Update
                position = position + elapsedSinceUpdate;
                
                // Stelle sicher, dass Position nicht über Duration geht
                position = Math.min(position, duration);
            }
            
            // Entferne Debug-Code für weniger Spam
            // console.log('Media Debug:', ...);
            
            // Zeit formatieren (Sekunden zu MM:SS)
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            currentTimeEl.textContent = formatTime(position);
            totalTimeEl.textContent = formatTime(duration);
            
            // Progress Bar
            const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
            positionProgress.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
        }

    }        
    
    setupClimateControls(item) {
        const climateContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!climateContainer) return;

        const sliderId = `slider-${item.id}`;
        const circularContainer = climateContainer.querySelector('.circular-slider-container.climate');

        if (circularContainer) {
            const state = this._hass.states[item.id];
            const currentTemp = state.attributes.temperature || 20;

            // Dynamische Werte aus dem Gerät
            const minTemp = state.attributes.min_temp || 10;
            const maxTemp = state.attributes.max_temp || 30;
            const tempStep = state.attributes.target_temp_step || 0.5;

            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: minTemp,
                maxValue: maxTemp,
                defaultValue: currentTemp,
                step: tempStep,
                label: 'Temperatur',
                hasPower: true,
                defaultPower: state.state !== 'off',
                formatValue: (val) => `${val.toFixed(tempStep < 1 ? 1 : 0)}°C`,
                onValueChange: (value) => {
                    clearTimeout(this.climateUpdateTimeout);
                    this.climateUpdateTimeout = setTimeout(() => {
                        this.callClimateService('set_temperature', item.id, { temperature: value });
                    }, 150);
                },
                onPowerToggle: (isOn) => {
                    this.callClimateService(isOn ? 'turn_on' : 'turn_off', item.id);
                }
            });
        }

        // Event-Listener für HVAC-Modi
        climateContainer.querySelectorAll('[data-hvac-mode]').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.hvacMode;
                this.callClimateService('set_hvac_mode', item.id, { hvac_mode: mode });
            });
        });
    
        // Toggle für Einstellungen
        const presetsToggle = climateContainer.querySelector('[data-action="toggle-presets"]');
        if (presetsToggle) {
            presetsToggle.addEventListener('click', () => {
                this.handleExpandableButton(
                    presetsToggle,
                    climateContainer,
                    '.device-control-presets.climate'
                );
            });
        }

        // Event-Listener für alle Einstellungsoptionen
        climateContainer.querySelectorAll('.climate-setting-option').forEach(option => {
            option.addEventListener('click', () => {
                const settingType = option.getAttribute('data-climate-setting');
                const settingValue = option.getAttribute('data-value');
                const row = option.closest('.climate-setting-row');
                
                row.querySelectorAll('.climate-setting-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                let serviceDomain, serviceName, serviceData;

                switch (settingType) {
                    case 'vane_horizontal':
                        serviceDomain = 'melcloud';
                        serviceName = 'set_vane_horizontal';
                        serviceData = { entity_id: item.id, position: settingValue };
                        break;
                    case 'vane_vertical':
                        serviceDomain = 'melcloud';
                        serviceName = 'set_vane_vertical';
                        serviceData = { entity_id: item.id, position: settingValue };
                        break;
                    case 'swing_mode':
                        serviceDomain = 'climate';
                        serviceName = 'set_swing_mode';
                        serviceData = { entity_id: item.id, swing_mode: settingValue };
                        break;
                    case 'fan_mode':
                        serviceDomain = 'climate';
                        serviceName = 'set_fan_mode';
                        serviceData = { entity_id: item.id, fan_mode: settingValue };
                        break;
                }
    
                if (serviceDomain && serviceName) {
                    this._hass.callService(serviceDomain, serviceName, serviceData);
                }
            });
        });
    }

    setupMediaPlayerControls(item) {
        const mediaContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!mediaContainer) return;
    
        const sliderId = `slider-${item.id}`;
        const circularContainer = mediaContainer.querySelector('.circular-slider-container.media');
    
        if (circularContainer) {
            const state = this._hass.states[item.id];
            const volume = state.attributes.volume_level ? Math.round(state.attributes.volume_level * 100) : 50;
            const isActive = ['playing', 'paused'].includes(state.state);
    
            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: 0,
                maxValue: 100,
                defaultValue: volume,
                step: 1,
                label: 'Lautstärke',
                hasPower: true,
                defaultPower: isActive,
                formatValue: (val) => `${Math.round(val)}%`,
                onValueChange: (value) => {
                    // Sofort UI aktualisieren (lokal)
                    const circularValue = mediaContainer.querySelector('.circular-value');
                    if (circularValue) {
                        circularValue.textContent = `${Math.round(value)}%`;
                    }
                    
                    // API Call mit Debouncing
                    clearTimeout(this.mediaUpdateTimeout);
                    this.mediaUpdateTimeout = setTimeout(() => {
                        this.callMediaPlayerService('volume_set', item.id, { volume_level: value / 100 });
                    }, 300);
                },
                onPowerToggle: (isOn) => {
                    this.callMediaPlayerService(isOn ? 'turn_on' : 'turn_off', item.id);
                }
            });
        }       
    
        // Media Control Buttons
        const prevBtn = mediaContainer.querySelector('[data-action="previous"]');
        const playPauseBtn = mediaContainer.querySelector('[data-action="play-pause"]');
        const nextBtn = mediaContainer.querySelector('[data-action="next"]');
        const musicAssistantBtn = mediaContainer.querySelector('[data-action="music-assistant"]');
        const ttsBtn = mediaContainer.querySelector('[data-action="tts"]');

        // DEBUG: Teste ob Buttons gefunden werden
        console.log('Music Assistant Button:', musicAssistantBtn);
        console.log('TTS Button:', ttsBtn);        
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.callMusicAssistantService('media_previous_track', item.id));
        if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.callMusicAssistantService('media_play_pause', item.id));
        if (nextBtn) nextBtn.addEventListener('click', () => this.callMusicAssistantService('media_next_track', item.id));

        // Music Assistant Toggle
        if (musicAssistantBtn) {
            musicAssistantBtn.addEventListener('click', () => {
                // Schließe TTS falls offen
                const ttsContainer = mediaContainer.querySelector('.device-control-presets.tts-presets');
                if (ttsContainer && ttsContainer.getAttribute('data-is-open') === 'true') {
                    this.handleExpandableButton(ttsBtn, mediaContainer, '.device-control-presets.tts-presets');
                }
                
                const presetsContainer = mediaContainer.querySelector('.device-control-presets.music-assistant-presets');
                const wasOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                
                this.handleExpandableButton(
                    musicAssistantBtn, 
                    mediaContainer, 
                    '.device-control-presets.music-assistant-presets'
                );
                
                if (!wasOpen && !this.maListenersAttached.has(presetsContainer)) {
                    this.setupMusicAssistantEventListeners(item, presetsContainer);
                    this.maListenersAttached.add(presetsContainer);
                }
            });
        }
        
        // TTS Toggle  
        if (ttsBtn) {
            ttsBtn.addEventListener('click', () => {
                // Schließe Music Assistant falls offen
                const musicContainer = mediaContainer.querySelector('.device-control-presets.music-assistant-presets');
                if (musicContainer && musicContainer.getAttribute('data-is-open') === 'true') {
                    this.handleExpandableButton(musicAssistantBtn, mediaContainer, '.device-control-presets.music-assistant-presets');
                }
                
                this.handleExpandableButton(
                    ttsBtn,
                    mediaContainer,
                    '.device-control-presets.tts-presets'
                );
            });
        }

        // Live Position Updates für Media Player
        if (item.domain === 'media_player') {
            this.mediaPositionUpdateInterval = setInterval(() => {
                if (this.isDetailView && this.currentDetailItem?.id === item.id) {
                    this.updateMediaPlayerControlsUI(this.currentDetailItem);
                }
            }, 1000); // Jede Sekunde für Position Updates
        }                
    }

    callMusicAssistantService(service, entity_id, data = {}) {
        // Prüfe ob es ein Music Assistant Player ist
        if (entity_id.includes('ma_') || entity_id.startsWith('music_assistant')) {
            this._hass.callService('music_assistant', service, { entity_id, ...data });
        } else {
            // Fallback zu Standard Media Player Service
            this._hass.callService('media_player', service, { entity_id, ...data });
        }
    }
    
    callMediaPlayerService(service, entity_id, data = {}) {
        this._hass.callService('media_player', service, { entity_id, ...data });
    }
    
    handleMediaServiceClick(service, item) {
        switch (service) {
            case 'music_assistant':
                // Hier könntest du Music Assistant spezifische Services aufrufen
                console.log('Music Assistant clicked for', item.id);
                break;
            case 'tts':
                // Hier könntest du TTS Services aufrufen
                console.log('TTS clicked for', item.id);
                break;
        }
    }
    
    getMediaPlayerControlsHTML(item) {
        const state = this._hass.states[item.id];
        const isPlaying = state.state === 'playing';
        const isPaused = state.state === 'paused';
        const volume = state.attributes.volume_level ? Math.round(state.attributes.volume_level * 100) : 50;
        
        const pauseIcon = `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor" stroke-width="1"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor" stroke-width="1"></path></svg>`;
        const playIcon = `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        
        const offClass = (!isPlaying && !isPaused) ? 'off' : '';
        const buttonTitle = isPlaying ? 'Pause' : 'Play';
        const displayValue = (!isPlaying && !isPaused) ? 'AUS' : volume + '%';
        const playPauseIcon = isPlaying ? pauseIcon : playIcon;
        
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container media ${offClass}" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg"><circle class="progress-bg" cx="80" cy="80" r="68"></circle><circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: #1DB954;"></circle></svg>
                    <div class="slider-inner ${offClass}"><div class="power-icon">⏻</div><div class="circular-value">${displayValue}</div><div class="circular-label">Lautstärke</div></div>
                    <div class="handle" style="border-color: #1DB954;"></div>
                </div>
                
                <div class="media-position-display">
                    <span class="current-time">0:00</span>
                    <div class="position-bar"><div class="position-progress" style="width: 0%;"></div></div>
                    <span class="total-time">0:00</span>
                </div>                       
                



                <div class="device-control-row">
                    <button class="device-control-button" data-action="previous" title="Vorheriger Titel">
                        <svg width="48px" height="48px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 7V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.0282 5.2672C17.4217 4.95657 18 5.23682 18 5.73813V18.2619C18 18.7632 17.4217 19.0434 17.0282 18.7328L9.09651 12.4709C8.79223 12.2307 8.79223 11.7693 9.09651 11.5291L17.0282 5.2672Z" stroke="currentColor"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="play-pause" title="${buttonTitle}">
                        ${playPauseIcon}
                    </button>
                    <button class="device-control-button" data-action="next" title="Nächster Titel">
                        <svg width="48px" height="48px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M18 7V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.97179 5.2672C6.57832 4.95657 6 5.23682 6 5.73813V18.2619C6 18.7632 6.57832 19.0434 6.97179 18.7328L14.9035 12.4709C15.2078 12.2307 15.2078 11.7693 14.9035 11.5291L6.97179 5.2672Z" stroke="currentColor"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="music-assistant" title="Music Assistant">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 14V3L9 5V16" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 19H18C19.1046 19 20 18.1046 20 17V14H17C15.8954 14 15 14.8954 15 16V17C15 18.1046 15.8954 19 17 19Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 21H7C8.10457 21 9 20.1046 9 19V16H6C4.89543 16 4 16.8954 4 18V19C4 20.1046 4.89543 21 6 21Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="tts" title="Text-to-Speech">
                        <svg width="38px" height="38px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M7 12L17 12" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 8L13 8" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 20.2895V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7.96125C7.35368 17 6.77906 17.2762 6.39951 17.7506L4.06852 20.6643C3.71421 21.1072 3 20.8567 3 20.2895Z" stroke="#000000" stroke-width="1"></path></svg>
                    </button>
                </div>
                <div class="device-control-presets music-assistant-presets" data-is-open="false">
                    ${this.getMusicAssistantHTML(item)}
                </div>

                <div class="device-control-presets tts-presets" data-is-open="false">
                    TTS coming soon
                </div>
                </div>
                
        `;
    }        
    
    callClimateService(service, entity_id, data = {}) {
        this._hass.callService('climate', service, { entity_id, ...data });
    }
    
    updateLightControlsUI(item) {
        const lightContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!lightContainer) return;
    
        const state = this._hass.states[item.id];
        const isOn = state.state === 'on';
        const brightness = isOn ? Math.round((state.attributes.brightness || 0) / 2.55) : 0;
    
        const circularContainer = lightContainer.querySelector('.circular-slider-container');
        const sliderInner = lightContainer.querySelector('.slider-inner');
        const circularValue = lightContainer.querySelector('.circular-value');
        const controlsRow = lightContainer.querySelector('.device-control-row');
    
        if (circularContainer) {
            circularContainer.classList.toggle('off', !isOn);
        }
        if (sliderInner) {
            sliderInner.classList.toggle('off', !isOn);
        }
        if (circularValue) {
            circularValue.textContent = isOn ? `${brightness}%` : 'AUS';
        }
        if (controlsRow) {
            controlsRow.classList.toggle('hidden', !isOn);
        }
    
        // Update circular slider if exists
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(brightness, isOn);
        }
    
        if (!isOn) {
            const presetsContainer = lightContainer.querySelector('.device-control-presets');
            if (presetsContainer && presetsContainer.classList.contains('visible')) {
                presetsContainer.classList.remove('visible');
                presetsContainer.setAttribute('data-is-open', 'false');
            }
        }
    }

    updateCoverControlsUI(item) {
        const coverContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!coverContainer) return;

        const state = this._hass.states[item.id];
        const position = state.attributes.current_position ?? 100;
        
        // Update circular slider if exists
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(position, true);
        }
    }

    // Circular Slider Class - embedded within the main class
    createCircularSliderClass() {
        if (window.CircularSlider) return; // Already exists
    
        window.CircularSlider = class {
            constructor(container, config) {
                this.container = container;
                this.handle = container.querySelector('.handle');
                this.progressFill = container.querySelector('.progress-fill');
                this.valueDisplay = container.querySelector('.circular-value');
                this.powerIcon = container.querySelector('.power-icon');
                this.sliderInner = container.querySelector('.slider-inner');
    
                this.config = config;
                this.centerX = 80;
                this.centerY = 80;
                this.radius = 68;
                this.currentValue = config.defaultValue;
                this.isOn = config.hasPower ? config.defaultPower : true;
    
                this.isDragging = false;
                this.circumference = 2 * Math.PI * 68;
    
                this.init();
            }
    
            init() {
                this.progressFill.style.strokeDasharray = `0 ${this.circumference}`;
                this.progressFill.style.strokeDashoffset = 0;
    
                // Power Button Event
                if (this.config.onPowerToggle) {
                    this.sliderInner.addEventListener('click', this.togglePower.bind(this));
                }
                this.updatePowerState();
                this.updateSlider();
                this.bindEvents();
            }
    
            togglePower() {
                if (!this.config.hasPower) return;
    
                this.isOn = !this.isOn;
                this.updatePowerState();
                this.updateSlider();
    
                if (this.config.onPowerToggle) {
                    this.config.onPowerToggle(this.isOn);
                }
            }
    
            updatePowerState() {
                if (this.config.hasPower) {
                    this.powerIcon.style.display = 'block';
                    this.sliderInner.style.cursor = 'pointer';
                    if (this.isOn) {
                        this.container.classList.remove('off');
                        this.sliderInner.classList.remove('off');
                        this.powerIcon.style.color = '#fff';
                    } else {
                        this.container.classList.add('off');
                        this.sliderInner.classList.add('off');
                        this.powerIcon.style.color = '#ccc';
                    }
                } else {
                    this.powerIcon.style.display = 'none';
                    this.sliderInner.style.cursor = 'default';
                    this.container.classList.remove('off');
                    this.sliderInner.classList.remove('off');
                }
            }
    
            bindEvents() {
                this.handle.addEventListener('mousedown', this.startDrag.bind(this));
                document.addEventListener('mousemove', this.drag.bind(this));
                document.addEventListener('mouseup', this.endDrag.bind(this));
    
                this.handle.addEventListener('touchstart', this.startDrag.bind(this));
                document.addEventListener('touchmove', this.drag.bind(this));
                document.addEventListener('touchend', this.endDrag.bind(this));
            }
    
            startDrag(e) {
                this.isDragging = true;
                e.preventDefault();
            }
    
            drag(e) {
                if (!this.isDragging || !this.isOn) return;
    
                const rect = this.container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
    
                const clientX = e.clientX || e.touches[0].clientX;
                const clientY = e.clientY || e.touches[0].clientY;
    
                const x = clientX - centerX;
                const y = clientY - centerY;
    
                let angle = Math.atan2(y, x) * 180 / Math.PI;
                angle = (angle + 360) % 360;
    
                let normalizedAngle = (angle + 90) % 360;
                let progress = normalizedAngle / 360;
    
                // Stopp-Zone bei 100%
                const maxProgress = (this.config.maxValue - this.config.minValue);
                const currentProgress = (this.currentValue - this.config.minValue);
                const currentProgressRatio = currentProgress / maxProgress;
    
                if (currentProgressRatio > 0.85 && progress < 0.15) {
                    progress = 1.0;
                } else if (currentProgressRatio < 0.15 && progress > 0.85) {
                    progress = 0.0;
                }
    
                const rawValue = this.config.minValue + progress * (this.config.maxValue - this.config.minValue);
                this.currentValue = Math.round(rawValue / this.config.step) * this.config.step;
                this.currentValue = Math.max(this.config.minValue, Math.min(this.config.maxValue, this.currentValue));
    
                this.updateSlider();
    
                if (this.config.onValueChange) {
                    this.config.onValueChange(this.currentValue, this.isOn);
                }
            }
    
            endDrag() {
                this.isDragging = false;
            }
    
            updateSlider() {
                const progress = (this.currentValue - this.config.minValue) / (this.config.maxValue - this.config.minValue);
                const angle = -90 + (progress * 360);
    
                // Handle Position
                const handleX = this.centerX + this.radius * Math.cos(angle * Math.PI / 180);
                const handleY = this.centerY + this.radius * Math.sin(angle * Math.PI / 180);
    
                this.handle.style.left = `${handleX - 8}px`;
                this.handle.style.top = `${handleY - 8}px`;
    
                // SVG Progress
                if (this.isOn || !this.config.hasPower) {
                    const progressLength = progress * this.circumference;
                    this.progressFill.style.strokeDasharray = `${progressLength} ${this.circumference}`;
                } else {
                    this.progressFill.style.strokeDasharray = `0 ${this.circumference}`;
                }
    
                // Wert anzeigen
                if (this.config.hasPower && !this.isOn) {
                    this.valueDisplay.textContent = 'AUS';
                } else {
                    this.valueDisplay.textContent = this.config.formatValue(this.currentValue);
                }
            }
    
            updateFromState(value, isOn) {
                this.currentValue = value;
                this.isOn = isOn;
                this.updatePowerState();
                this.updateSlider();
            }
        };
    }
    
    setupDetailTabs(item) {
        // Create CircularSlider class if not exists
        this.createCircularSliderClass();
    
        // Beide Tab-Container finden (Desktop und Mobile)
        const desktopTabsContainer = this.shadowRoot.querySelector('.desktop-tabs .detail-tabs');
        const mobileTabsContainer = this.shadowRoot.querySelector('.mobile-tabs .detail-tabs');
        
        // Setup für beide Container
        [desktopTabsContainer, mobileTabsContainer].forEach(tabsContainer => {
            if (!tabsContainer) return;
            
            const tabs = tabsContainer.querySelectorAll('.detail-tab');
            const slider = tabsContainer.querySelector('.tab-slider');
            const contents = this.shadowRoot.querySelectorAll('.detail-tab-content');
    
            const moveSlider = (targetTab) => {
                slider.style.width = `${targetTab.offsetWidth}px`;
                slider.style.left = `${targetTab.offsetLeft}px`;
            };
            
            const activeTab = tabsContainer.querySelector('.detail-tab.active');
            if (activeTab) {
                moveSlider(activeTab);
            }
    
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = tab.dataset.tab;
                    
                    // Sync beide Tab-Container
                    [desktopTabsContainer, mobileTabsContainer].forEach(container => {
                        if (!container) return;
                        container.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
                        const correspondingTab = container.querySelector(`[data-tab="${targetId}"]`);
                        if (correspondingTab) {
                            correspondingTab.classList.add('active');
                            const containerSlider = container.querySelector('.tab-slider');
                            if (containerSlider) {
                                containerSlider.style.width = `${correspondingTab.offsetWidth}px`;
                                containerSlider.style.left = `${correspondingTab.offsetLeft}px`;
                            }
                        }
                    });
                    
                    contents.forEach(c => c.classList.remove('active'));
                    this.shadowRoot.querySelector(`[data-tab-content="${targetId}"]`).classList.add('active');
                });
            });
        });
    
        // Rest der Device-Setup Logik bleibt gleich
        if (item.domain === 'light') {
            this.setupLightControls(item);
        } else if (item.domain === 'cover') {
            this.setupCoverControls(item);
        } else if (item.domain === 'climate') {
            this.setupClimateControls(item);
        } else if (item.domain === 'media_player') {
            this.setupMediaPlayerControls(item);            
        }
    }
    
    setupLightControls(item) {
        const lightContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!lightContainer) return;
        // Create circular slider instance
        const sliderId = `slider-${item.id}`;
        const circularContainer = lightContainer.querySelector('.circular-slider-container');
    
        if (circularContainer) {
            const state = this._hass.states[item.id];
            const isOn = state.state === 'on';
            const brightness = isOn ? Math.round((state.attributes.brightness || 0) / 2.55) : 0;
    
            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: 0,
                maxValue: 100,
                defaultValue: brightness,
                step: 1,
                label: 'Helligkeit',
                hasPower: true,
                defaultPower: isOn,
                formatValue: (val) => `${Math.round(val)}%`,
                onValueChange: (value, isOn) => {
                    if (isOn) {
                        // Debounce the API calls
                        clearTimeout(this.lightUpdateTimeout);
                        this.lightUpdateTimeout = setTimeout(() => {
                            if (value === 0) {
                                this.callLightService('turn_off', item.id);
                            } else {
                                this.callLightService('turn_on', item.id, { brightness_pct: value });
                            }
                        }, 150); // 150ms delay instead of immediate
                    }
                },
                onPowerToggle: (isOn) => {
                    this.callLightService('toggle', item.id);
                }
            });
        }
        const tempButtons = lightContainer.querySelectorAll('[data-temp]');
        const colorToggle = lightContainer.querySelector('[data-action="toggle-colors"]');
        const colorPresets = lightContainer.querySelectorAll('.device-control-preset');
        const presetsContainer = lightContainer.querySelector('.device-control-presets');
        
        tempButtons.forEach(btn => btn.addEventListener('click', () => {
            const kelvin = parseInt(btn.dataset.temp, 10);
            this.callLightService('turn_on', item.id, { kelvin: kelvin });
        
            // Update slider color immediately
            const sliderId = `slider-${item.id}`;
            if (this.circularSliders[sliderId]) {
                let rgb = [255, 255, 255]; // default
                if (kelvin <= 2700) rgb = [255, 166, 87];
                else if (kelvin <= 4000) rgb = [255, 219, 186];
                else rgb = [201, 226, 255];
        
                const progressFill = this.circularSliders[sliderId].progressFill;
                progressFill.style.stroke = `rgb(${rgb.join(',')})`;
        
                const handle = this.circularSliders[sliderId].handle;
                handle.style.borderColor = `rgb(${rgb.join(',')})`;
            }
        }));

        if (colorToggle) {
            colorToggle.addEventListener('click', () => {
                this.handleExpandableButton(
                    colorToggle,
                    lightContainer,
                    '.device-control-presets'
                );
            });
        }        
    
        colorPresets.forEach(preset => preset.addEventListener('click', () => {
            const rgb = preset.dataset.rgb.split(',').map(Number);
            this.callLightService('turn_on', item.id, { rgb_color: rgb });
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
        
            // Update slider color immediately
            const sliderId = `slider-${item.id}`;
            if (this.circularSliders[sliderId]) {
                const progressFill = this.circularSliders[sliderId].progressFill;
                progressFill.style.stroke = `rgb(${rgb.join(',')})`;
        
                const handle = this.circularSliders[sliderId].handle;
                handle.style.borderColor = `rgb(${rgb.join(',')})`;
            }
        }));
    }

    setupCoverControls(item) {
        const coverContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!coverContainer) return;
        
        const sliderId = `slider-${item.id}`;
        const circularContainer = coverContainer.querySelector('.circular-slider-container.cover');
    
        if (circularContainer) {
            const state = this._hass.states[item.id];
            const position = state.attributes.current_position ?? 0;
    
            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: 0,
                maxValue: 100,
                defaultValue: position,
                step: 1,
                label: 'Offen',
                hasPower: true,
                defaultPower: true, // Always on
                formatValue: (val) => `${Math.round(val)}%`,
                onValueChange: (value) => {
                    clearTimeout(this.coverUpdateTimeout);
                    this.coverUpdateTimeout = setTimeout(() => {
                        this.callCoverService('set_cover_position', item.id, { position: value });
                    }, 150);
                },
                onPowerToggle: () => {} // No action on power toggle
            });
        }

        const openBtn = coverContainer.querySelector('[data-action="open"]');
        const stopBtn = coverContainer.querySelector('[data-action="stop"]');
        const closeBtn = coverContainer.querySelector('[data-action="close"]');
        const presetsToggle = coverContainer.querySelector('[data-action="toggle-presets"]');
        const presetsContainer = coverContainer.querySelector('.device-control-presets');
        const positionPresets = coverContainer.querySelectorAll('.device-control-preset');
        
        if(openBtn) openBtn.addEventListener('click', () => this.callCoverService('open_cover', item.id));
        if(stopBtn) stopBtn.addEventListener('click', () => this.callCoverService('stop_cover', item.id));
        if(closeBtn) closeBtn.addEventListener('click', () => this.callCoverService('close_cover', item.id));

        if (presetsToggle) {
            presetsToggle.addEventListener('click', () => {
                this.handleExpandableButton(
                    presetsToggle,
                    coverContainer,
                    '.device-control-presets'
                );
            });
        }        
        
        positionPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const position = parseInt(preset.dataset.position, 10);
                this.callCoverService('set_cover_position', item.id, { position });
                positionPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            });
        });
    }

    callLightService(service, entity_id, data = {}) {
        this._hass.callService('light', service, { entity_id, ...data });
    }

    callCoverService(service, entity_id, data = {}) {
        this._hass.callService('cover', service, { entity_id, ...data });
    }

    animatePresetStagger(container, presets, isOpening) {
        container.classList.toggle('visible', isOpening);
        presets.forEach((preset, index) => {
            preset.getAnimations().forEach(anim => anim.cancel());
            preset.animate([
                { opacity: isOpening ? 0 : 1, transform: `scale(${isOpening ? 0.5 : 1}) translateY(${isOpening ? '-20px' : '0'})` },
                { opacity: isOpening ? 1 : 0, transform: `scale(${isOpening ? 1 : 0.5}) translateY(0)` }
            ], {
                duration: isOpening ? 300 : 200,
                delay: index * 30,
                easing: isOpening ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-in',
                fill: 'forwards'
            });
        });
    }

    getDetailedStateText(item) {
        const state = this._hass.states[item.id];
        if (!state) return { status: 'Unbekannt' };
        
        switch (item.domain) {
            case 'light': 
                return { status: state.state === 'on' ? 'Ein' : 'Aus' };
            case 'climate': 
                return { status: state.attributes.hvac_action || state.state };
            case 'cover': 
                return { status: state.state === 'open' ? 'Offen' : 'Geschlossen' };
            case 'media_player': 
                // SMART STATUS: Prüfe ob Song wirklich noch läuft
                const duration = state.attributes.media_duration || 0;
                const position = state.attributes.media_position || 0;
                const updatedAt = state.attributes.media_position_updated_at;
                
                // Berechne echte Position
                let realPosition = position;
                if (state.state === 'playing' && updatedAt) {
                    const now = new Date();
                    const updateTime = new Date(updatedAt);
                    const elapsedSinceUpdate = (now - updateTime) / 1000;
                    realPosition = position + elapsedSinceUpdate;
                }
                
                // Status basierend auf echter Position
                if (state.state === 'playing' && duration > 0 && realPosition >= duration) {
                    return { status: 'Bereit' };
                } else if (state.state === 'playing') {
                    return { status: 'Spielt' };
                } else if (state.state === 'paused') {
                    return { status: 'Pausiert' };
                } else {
                    return { status: 'Aus' };
                }
            default: 
                return { status: state.state };
        }
    }

    getQuickStats(item) {
        const state = this._hass.states[item.id];
        if (!state) return [];
        const stats = [];
        switch (item.domain) {
            case 'light':
                if (state.state === 'on') {
                    if (state.attributes.brightness) stats.push(`${Math.round(state.attributes.brightness / 2.55)}% Helligkeit`);
                    if (state.attributes.color_temp) stats.push(`${state.attributes.color_temp}K`);
                }
                break;
            case 'climate':
                if (state.state !== 'off') {
                    if (state.attributes.current_temperature && state.attributes.temperature) {
                        stats.push(`${state.attributes.current_temperature}°C → ${state.attributes.temperature}°C`);
                    }
                    if (state.attributes.hvac_mode) stats.push(state.attributes.hvac_mode);
                    if (state.attributes.vane_horizontal) {
                        stats.push(`H: ${this.getVaneLabel(state.attributes.vane_horizontal, 'horizontal')}`);
                    }
                    if (state.attributes.vane_vertical) {
                        stats.push(`V: ${this.getVaneLabel(state.attributes.vane_vertical, 'vertical')}`);
                    }
                    if (state.attributes.fan_mode) stats.push(`Fan: ${state.attributes.fan_mode}`);
                }
                break;
            case 'media_player':
                 if (state.state === 'playing' && state.attributes.media_title) stats.push(`♪ ${state.attributes.media_title}`);
                 if (state.attributes.volume_level) stats.push(`${Math.round(state.attributes.volume_level * 100)}% Lautstärke`);
                 break;
            case 'cover':
                if (state.attributes.current_position != null) stats.push(`${state.attributes.current_position}%`);
                break;
        }
        return stats;
    }

    getBackgroundImageForItem(item) {
        const baseUrl = 'https://raw.githubusercontent.com/fastender/Fast-Search-Card/refs/heads/main/docs/';
        switch (item.domain) {
            case 'light':
                return baseUrl + (item.state === 'on' ? 'light-on.png' : 'light-off.png');
            case 'cover':
                return baseUrl + (item.state === 'open' ? 'cover-on.png' : 'cover-off.png');
            case 'climate':
                return baseUrl + (item.state !== 'off' ? 'climate-on.png' : 'climate-off.png');
            case 'media_player':
                return baseUrl + 'media-bg.png';
            default:
                return baseUrl + 'light-off.png';
        }
    }
    
    getAlbumArtUrl(item) {
        if (!this._hass || !item.id) return null;
        
        const state = this._hass.states[item.id];
        if (!state) return null;
        
        // Live-State Attribute verwenden statt item.attributes
        return state.attributes.entity_picture || state.attributes.media_image_url || null;
    }

    animateElementIn(element, keyframes, options = {}) {
        if (!element) return;
        return element.animate(keyframes, {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
            ...options
        });
    }

    animateElementOut(element, options = {}) {
        if (!element) return;
        return element.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.8)' }], { duration: 200, easing: 'ease-in', fill: 'forwards', ...options });
    }

    animateStateChange(card, isActive) {
        const icon = card.querySelector('.device-icon');
        card.animate([{ boxShadow: '0 0 0 rgba(0, 122, 255, 0)' }, { boxShadow: '0 0 20px rgba(0, 122, 255, 0.4)' }, { boxShadow: '0 0 0 rgba(0, 122, 255, 0)' }], { duration: 600, easing: 'ease-out' });
        icon.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }

    getCardSize() { return 4; }
    static getConfigElement() { return document.createElement('fast-search-card-editor'); }
    static getStubConfig() { return { type: 'custom:fast-search-card', entities: [{ entity: 'light.example_light', title: 'Beispiel Lampe' }] }; }

    // --- NEUE METHODEN FÜR MUSIC ASSISTANT ---    
    getMusicAssistantHTML(item) {
        return `
            <div class="music-assistant-content">
                <div class="ma-search-bar-container">
                    <input type="text" class="ma-search-input" placeholder="Suchen in Music Assistant..." data-ma-search-input>
                    <button class="ma-enqueue-toggle" title="Wiedergabemodus ändern" data-ma-enqueue-toggle>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"></path></svg>
                    </button>
                </div>
                <div class="ma-filter-chips" data-ma-filter-chips>
                    <div class="ma-chip active" data-filter="all">Alle</div>
                    <div class="ma-chip" data-filter="artists">Künstler</div>
                    <div class="ma-chip" data-filter="albums">Alben</div>
                    <div class="ma-chip" data-filter="tracks">Titel</div>
                    <div class="ma-chip" data-filter="playlists">Playlists</div>
                </div>
                <div class="ma-results-container" data-ma-results-container>
                    <div class="ma-empty-state">Suche starten, um Ergebnisse zu sehen.</div>
                </div>
            </div>
        `;
    }
    
    async setupMusicAssistantEventListeners(item, container) {
        const searchInput = container.querySelector('[data-ma-search-input]');
        const resultsContainer = container.querySelector('[data-ma-results-container]');
        const enqueueToggle = container.querySelector('[data-ma-enqueue-toggle]');
        const filterChips = container.querySelector('[data-ma-filter-chips]');
    
        if (!searchInput || !resultsContainer || !enqueueToggle || !filterChips) {
            console.error("Music Assistant UI-Elemente nicht gefunden.");
            return;
        }
    
        if (!this.musicAssistantConfigEntryId) {
             try {
                const configEntries = await this._hass.callApi("GET", "config/config_entries/entry");
                const maEntry = configEntries.find(entry => entry.domain === "music_assistant" && entry.state === "loaded");
                if (maEntry) {
                    this.musicAssistantConfigEntryId = maEntry.entry_id;
                } else {
                    console.warn('Music Assistant Config-Entry nicht gefunden.');
                }
             } catch (e) {
                console.error("Fehler beim Abrufen der Config-Entries:", e);
             }
        }
    
        const enqueueModes = [
            { key: 'play', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"></path></svg>', title: 'Sofort abspielen' },
            { key: 'add', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7h14"></path></svg>', title: 'Zur Warteschlange hinzufügen' },
            { key: 'next', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v16M19 12L7 4v16z"></path></svg>', title: 'Als nächstes abspielen' },
        ];
        let currentModeIndex = 0;
        enqueueToggle.addEventListener('click', () => {
            currentModeIndex = (currentModeIndex + 1) % enqueueModes.length;
            const mode = enqueueModes[currentModeIndex];
            this.musicAssistantEnqueueMode = mode.key;
            enqueueToggle.innerHTML = mode.icon;
            enqueueToggle.title = mode.title;
        });
    
        filterChips.addEventListener('click', e => {
            const chip = e.target.closest('.ma-chip');
            if (!chip) return;
    
            filterChips.querySelector('.active').classList.remove('active');
            chip.classList.add('active');
            
            this.displayMusicAssistantResults(this.lastMusicAssistantResults, resultsContainer, item.id);
        });
    
        searchInput.addEventListener('input', () => {
            clearTimeout(this.musicAssistantSearchTimeout);
            const query = searchInput.value.trim();
    
            if (query.length < 2) {
                resultsContainer.innerHTML = '<div class="ma-empty-state">Mindestens 2 Zeichen eingeben...</div>';
                return;
            }
    
            resultsContainer.innerHTML = '<div class="ma-loading-state">Suche...</div>';
            
            this.musicAssistantSearchTimeout = setTimeout(async () => {
                const results = await this.searchMusicAssistant(query);
                this.lastMusicAssistantResults = results;
                this.displayMusicAssistantResults(results, resultsContainer, item.id);
            }, 300);
        });
    }
    
    async searchMusicAssistant(query) {
        // Leichte Verbesserung: Bessere Prüfung am Anfang
        if (!this._hass || !query || !this.musicAssistantConfigEntryId) {
            console.error("Music Assistant Suche nicht möglich: Hass-Objekt, Suchbegriff oder Config-Entry-ID fehlen.");
            return null;
        }
    
        try {
            const results = await this._hass.callWS({
                type: 'call_service',
                domain: 'music_assistant',
                service: 'search',
                service_data: {
                    name: query,
                    // KORREKTUR: Fehlender Parameter hier hinzugefügt
                    config_entry_id: this.musicAssistantConfigEntryId, 
                    limit: 20
                },
                return_response: true
            });
    
            // Die Antwort-Struktur sollte so korrekt sein
            if (results && results.response) {
                return this.processMusicAssistantResults(results.response);
            }
            return this.processMusicAssistantResults(results); // Fallback
    
        } catch (e) {
            console.error("Music Assistant Suche fehlgeschlagen:", e);
            return null;
        }
    }
    
    processMusicAssistantResults(results) {
        if (!results) return null;
        const processed = { artists: [], albums: [], tracks: [], playlists: [] };
        
        const getArray = (data) => Array.isArray(data) ? data : [];
    
        processed.artists = getArray(results.artists);
        processed.albums = getArray(results.albums);
        processed.tracks = getArray(results.tracks);
        processed.playlists = getArray(results.playlists);
    
        return processed;
    }
    
    displayMusicAssistantResults(results, container, entityId) {
        if (!results) {
            container.innerHTML = '<div class="ma-empty-state">Keine Ergebnisse gefunden.</div>';
            return;
        }
        
        const activeFilter = container.parentElement.querySelector('.ma-filter-chips .active').dataset.filter;
        let html = '';
    
        const renderGrid = (items, type) => {
            if (!items || items.length === 0) return '';
            let gridHtml = `<div class="ma-category-header">${type}</div><div class="ma-grid-container">`;
            const itemsToShow = (activeFilter === 'all') ? items.slice(0, 6) : items;
            itemsToShow.forEach(item => {
                const image = (item.metadata?.images?.[0]?.url || item.image);
                const defaultIcon = type === 'Künstler' ? '👤' : type === 'Alben' ? '💿' : '📋';
                gridHtml += `
                    <div class="ma-grid-item" data-uri="${item.uri}">
                        <div class="ma-grid-image">
                            ${image ? `<img src="${image}" loading="lazy">` : defaultIcon}
                        </div>
                        <div class="ma-grid-name">${item.name}</div>
                        ${item.artists ? `<div class="ma-grid-artist">${item.artists.map(a => a.name).join(', ')}</div>` : ''}
                    </div>`;
            });
            return gridHtml + '</div></div>';
        };
    
        const renderList = (items) => {
            if (!items || items.length === 0) return '';
            let listHtml = `<div class="ma-category-header">Titel</div><div class="ma-list-container">`;
            const itemsToShow = (activeFilter === 'all') ? items.slice(0, 5) : items;
            itemsToShow.forEach(track => {
                const image = track.album?.metadata?.images?.[0]?.url || track.album?.image;
                listHtml += `
                    <div class="ma-list-item" data-uri="${track.uri}">
                        <div class="ma-list-image">
                            ${image ? `<img src="${image}" loading="lazy">` : '🎵'}
                        </div>
                        <div class="ma-list-info">
                            <div class="ma-list-name">${track.name}</div>
                            <div class="ma-list-artist">${track.artists.map(a => a.name).join(', ')}</div>
                        </div>
                    </div>`;
            });
            return listHtml + '</div>';
        };
    
        if (activeFilter === 'all' || activeFilter === 'artists') html += renderGrid(results.artists, 'Künstler');
        if (activeFilter === 'all' || activeFilter === 'albums') html += renderGrid(results.albums, 'Alben');
        if (activeFilter === 'all' || activeFilter === 'playlists') html += renderGrid(results.playlists, 'Playlists');
        if (activeFilter === 'all' || activeFilter === 'tracks') html += renderList(results.tracks);
    
        container.innerHTML = html || '<div class="ma-empty-state">Keine Ergebnisse in dieser Kategorie.</div>';
        
        container.querySelectorAll('[data-uri]').forEach(el => {
            el.addEventListener('click', () => {
                const uri = el.dataset.uri;
                this.playMusicAssistantItem(uri, entityId);
            });
        });
    }
    
    async playMusicAssistantItem(uri, entityId) {
        if (!this._hass || !uri || !entityId) return;
        
        try {
            await this._hass.callService('media_player', 'play_media', {
                entity_id: entityId,
                media_content_id: uri,
                media_content_type: 'music',
                enqueue: this.musicAssistantEnqueueMode
            });
        } catch (e) {
            console.error("Fehler beim Abspielen via Music Assistant:", e);
        }
    }
}

customElements.define('fast-search-card', FastSearchCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Modern Apple Vision OS inspired search card'
});
console.info(`%c FAST-SEARCH-CARD %c Modern Vision OS Design `, 'color: #007AFF; font-weight: bold; background: black', 'color: white; font-weight: bold; background: #007AFF');
