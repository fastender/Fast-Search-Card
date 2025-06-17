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
    }

    setConfig(config) {
        if (!config.entities || !Array.isArray(config.entities)) {
            throw new Error('Entities configuration is required');
        }

        this._config = {
            title: 'Fast Search',
            entities: config.entities,
            ...config
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
                --accent-light: rgba(0, 122, 255, 0.15);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                --neumorphic-base: #2c2f33;
                --neumorphic-shadow-dark: #23272b;
                --neumorphic-shadow-light: #35373b;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .glass-panel {
                position: relative;
                border-radius: 24px;
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
                height: 500px;
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
                max-height: 500px; 
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: sticky; 
                top: 0; 
                z-index: 2;
                background-color: rgba(255, 255, 255, 0.01);
            }

            .category-icon {
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

            .category-icon:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }

            .category-icon svg {
                width: 18px;
                height: 18px;
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
                font-size: 17px;
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
                padding: 0 20px 16px 20px;
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
                padding: 6px 16px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.2s ease;
                text-align: center;
                height: 50px;
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
                line-height: 1.2;
                gap: 2px;
                color: var(--text-primary);
            }

            .subcategory-name {
                font-size: 14px;
                font-weight: 500;
            }

            .subcategory-status {
                font-size: 11px;
                color: var(--text-secondary);
                opacity: 0.9;
                min-height: 13px;
            }

            .subcategory-chip.active .subcategory-status {
                color: var(--accent);
            }
            
            .subcategory-chip.active .chip-content {
                 color: var(--accent);
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
                margin: 16px 0 8px 0;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .area-header:first-child {
                margin-top: 0;
            }

            .device-card {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 16px;
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
                margin: 0 0 4px 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.2;
            }

            .device-status {
                font-size: 11px;
                color: var(--text-secondary);
                margin: 0;
                opacity: 0.8;
            }

            .device-card.active .device-status {
                color: var(--accent);
                opacity: 1;
            }
            
            .detail-header {
                padding: 20px;
                display: flex;
                align-items: center;
                position: relative;
                z-index: 10;
            }

            .back-button {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(0, 0, 0, 0.15);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 2;
                flex-shrink: 0;
            }

            .back-button:hover {
                background: rgba(0, 0, 0, 0.25);
                transform: scale(1.1);
            }

            .back-button svg {
                width: 18px;
                height: 18px;
                stroke: var(--text-primary);
                stroke-width: 2;
            }
            
            .detail-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1;
            }

            .detail-content {
                display: flex;
                height: 100%;
                padding-top: 0px;
                overflow-y: hidden;
            }

            .detail-left {
                flex: 1.2;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .detail-right {
                flex: 1;
                padding: 20px;
                display: flex;
                flex-direction: column;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 0 24px 24px 0; /* Modified */
                box-sizing: border-box;
            }

            .detail-divider {
                width: 1px;
                background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent);
                margin: 20px 0;
            }
            
            .icon-background {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 60%;
                height: 60%;
                transform: translate(-50%, -50%);
                background-size: cover;
                background-position: center;
                z-index: 0;
                transition: all 0.8s ease;
                border-radius: 20px;
                opacity: 0;
            }
            .icon-content {
                position: relative;
                z-index: 1;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                padding: 20px;
                box-sizing: border-box;
                flex-grow: 1;
            }
            .status-indicator-large {
                position: absolute;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                opacity: 0;
            }
            .status-indicator-large.active {
                 background: var(--accent);
                 border-color: var(--accent);
            }
            .quick-stats {
                position: absolute;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                align-items: flex-end;
                opacity: 0;
            }
            .stat-item {
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 6px 12px;
                font-size: 11px;
                color: var(--text-secondary);
                font-weight: 500;
                white-space: nowrap;
            }
            .icon-content.light-on .quick-stats {
                flex-direction: row;
                gap: 8px;
            }

            .category-buttons {
                display: none;
                flex-direction: column;
                gap: 12px;
                opacity: 0;
                transform: translateX(20px);
            }

            .category-buttons.visible {
                display: flex;
            }

            .category-button {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .category-button:hover {
                transform: scale(1.05);
                border-color: var(--accent);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            }

            .category-button.active {
                background: var(--accent-light);
                border-color: var(--accent);
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
                padding: 0 20px;
            }
            .detail-tabs {
                position: relative;
                background: rgba(0, 0, 0, 0.25);
                border-radius: 24px;
                display: inline-flex;
                gap: 6px;
                padding: 5px;
                margin-bottom: 24px;
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
                overflow-y: auto;
                scrollbar-width: none;
            }
            #tab-content-container::-webkit-scrollbar { display: none; }

            .detail-tab-content { display: none; }
            .detail-tab-content.active { display: block; }
            
            .device-control-design {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                position: relative;
                z-index: 5;
                padding-top: 24px;
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
                background: rgba(255, 255, 255, 0.15);
            }
            .progress-svg {
                position: absolute;
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            .progress-bg {
                stroke: transparent;
                stroke-width: 0;
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
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }
            .slider-inner:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .slider-inner.off {
                opacity: 0.3;
            }
            .slider-inner.off:hover {
                opacity: 0.5;
            }
            .circular-value {
                font-size: 24px;
                font-weight: 300;
                color: var(--text-primary);
                margin-bottom: 4px;
                transition: all 0.2s ease;
            }
            .circular-label {
                font-size: 11px;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: all 0.2s ease;
            }
            .power-icon {
                font-size: 20px;
                margin-bottom: 8px;
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
                width: 14px;
                height: 14px;
                background: white;
                border: 3px solid #FF9500;
                border-radius: 50%;
                cursor: grab;
                transition: transform 0.1s ease;
                z-index: 10;
                box-shadow: none;
            }
            .handle:hover {
                transform: scale(1.2);
            }
            .handle:active {
                cursor: grabbing;
            }

            /* SLIDER (re-used for brightness and position) */
            .position-slider-container {
                --percentage: 50%;
                --slider-color-rgb: var(--accent-rgb); /* Use RGB components */
                --main-color: 255,255,255;
                --el-bg-color: 100,100,100;
                display: flex;
                width: 280px;
                height: 20px;
                padding: 20px 20px;
                background: rgba(var(--main-color), 0.07);
                border: 1px solid rgba(var(--main-color), 0.03);
                border-radius: 50px;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
                margin: 16px auto;
                z-index: 10;
            }

            .position-slider-container::after {
                content: "";
                height: 100%;
                opacity: 0;
                left: 0;
                position: absolute;
                top: 0;
                transition: opacity 500ms;
                width: 100%;
                background: radial-gradient(
                    500px circle at var(--mouse-x) var(--mouse-y),
                    rgba(var(--main-color), 0.06),
                    transparent 40%
                );
                z-index: -1;
            }

            .position-slider-container:hover::after {
                opacity: 1;
            }

            .position-icon, .brightness-icon {
                fill: rgba(255, 255, 255, 0.8);
                margin-right: 1em;
                cursor: pointer;
                width: 24px;
                height: 24px;
                z-index: 11;
                position: relative;
            }
            
            .position-slider, .brightness-slider {
                margin: 0 10px;
                appearance: none;
                width: 100%;
                height: 5px;
                border-radius: 50px;
                outline: none;
                transition: .2s;
                cursor: pointer;
                background: rgba(var(--el-bg-color), 0.3) !important;
                background-image: none !important;
                position: relative;
                overflow: hidden;
                z-index: 11;
            }

            .position-slider::before, .brightness-slider::before {
                position: absolute;
                content: "";
                height: 100%;
                width: calc(var(--percentage));
                border-radius: 50px;
                background: rgb(var(--slider-color-rgb));
                transition: all 0.2s ease;
                left: 0;
                top: 0;
                z-index: 1;
            }

            .position-slider::after, .brightness-slider::after {
                position: absolute;
                content: "";
                height: 100%;
                width: 10px;
                border-radius: 0 50px 50px 0;
                background-color: rgb(var(--slider-color-rgb));
                transition: all 0.2s ease;
                left: calc(var(--percentage) - 10px);
                top: 0;
                z-index: 2;
            }

            .position-slider::-webkit-slider-thumb, .brightness-slider::-webkit-slider-thumb {
                appearance: none;
                visibility: hidden;
                width: 1px;
                height: 10px;
            }

            .position-slider:hover, .brightness-slider:hover {
                height: 1em;
            }

            .position-value-display, .brightness-value-display {
                font-family: sans-serif;
                color: rgba(255, 255, 255, 0.9);
                min-width: 3em;
                text-align: right;
                font-size: 14px;
                z-index: 11;
                position: relative;
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
                flex-grow: 1;
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
                width: 24px; height: 24px; stroke: var(--text-primary); stroke-width: 1.5;
            }
            .device-control-button:hover { transform: scale(1.05); background: rgba(255,255,255,0.2); }
            .device-control-button.active { background: var(--accent); }

            .device-control-presets { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.4s ease; width: 100%; max-width: 280px;}
            .device-control-presets.visible { max-height: 150px; opacity: 1; margin-top: 16px;}
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

            @media (max-width: 768px) {
                .detail-content { flex-direction: column; padding-top: 0px; }
                .detail-divider { display: none; }
                .detail-left { min-height: 250px; flex: none; justify-content: flex-start; padding: 0;}
                .detail-right { padding: 16px; border-radius: 0 0 24px 24px; margin: 0 10px 10px 10px;}
                .icon-content { justify-content: flex-end; }
                .status-indicator-large, .quick-stats { position: absolute; }
                .quick-stats { flex-direction: row; }
                .handle {
                    width: 14px;
                    height: 14px;
                }
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
                        <div class="detail-content">
                            <div class="detail-left">
                                </div>
                            <div class="detail-divider"></div>
                            <div class="detail-right">
                                </div>
                        </div>
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
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        searchPanel.animate([{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)' }, { boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)', borderColor: 'var(--accent)' }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
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
        this.expandPanel();
        this.showCurrentCategoryItems();
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
                return !['off', 'unavailable', 'idle', 'standby'].includes(state.state);
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
                const position = state.attributes.current_position;
                if (position !== undefined) {
                    if (position > 0) return `${position}% Offen`;
                    return 'Geschlossen';
                }
                return state.state === 'open' ? 'Offen' : 'Geschlossen';
            case 'media_player':
                return state.state === 'playing' ? 'Spielt' : 'Aus';
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
        card.innerHTML = `<div class="device-icon"><span class="math-inline">\{item\.icon\}</div\><div class\="device\-info"\><div class\="device\-name"\></span>{item.name}</div><div class="device-status">${this.getEntityStatus(this._hass.states[item.id])}</div></div>`;
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
        const detailLeft = this.shadowRoot.querySelector('.detail-left');
        const detailRight = this.shadowRoot.querySelector('.detail-right');
        
        if (!this.currentDetailItem) return;
        
        const item = this.currentDetailItem;
        
        detailLeft.innerHTML = this.getDetailLeftHTML(item);
        detailRight.innerHTML = this.getDetailRightHTML(item);

        this.shadowRoot.querySelector('.detail-panel .back-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleBackClick();
        });

        this.setupDetailTabs(item);
        
        const statusIndicator = detailLeft.querySelector('.status-indicator-large');
        const quickStats = detailLeft.querySelector('.quick-stats');
        const iconBackground = detailLeft.querySelector('.icon-background');

        if(iconBackground) this.animateElementIn(iconBackground, { opacity: [0, 1] }, { duration: 800 });
        if(statusIndicator) this.animateElementIn(statusIndicator, { opacity: [0, 1], transform: ['translateX(-20px)', 'translateX(0)'] }, { delay: 600 });
        if(quickStats) this.animateElementIn(quickStats, { opacity: [0, 1], transform: ['translateX(20px)', 'translateX(0)'] }, { delay: 800 });
    }

    updateDetailViewStates() {
        if (!this.isDetailView || !this.currentDetailItem || !this._hass) return;
        
        const item = this.currentDetailItem;
        const state = this._hass.states[item.id];
        if (!state) return;

        const detailLeft = this.shadowRoot.querySelector('.detail-left');
        if (detailLeft) {
            const isActive = this.isEntityActive(state);
            const statusIndicator = detailLeft.querySelector('.status-indicator-large');
            if (statusIndicator) {
                statusIndicator.textContent = this.getDetailedStateText(item).status;
                statusIndicator.classList.toggle('active', isActive);
            }
            const quickStats = detailLeft.querySelector('.quick-stats');
            if (quickStats) {
                quickStats.innerHTML = this.getQuickStats(item).map(stat => `<div class="stat-item">${stat}</div>`).join('');
            }
            const iconBackground = detailLeft.querySelector('.icon-background');
            if (iconBackground) {
                const newBg = item.domain === 'media_player' ? this.getAlbumArtUrl(item) : this.getBackgroundImageForItem({...item, state: state.state});
                const currentBg = iconBackground.style.backgroundImage;
                if (currentBg !== `url("${newBg}")`) {
                   iconBackground.style.backgroundImage = `url('${newBg}')`;
                   iconBackground.style.opacity = '0';
                   setTimeout(() => { iconBackground.style.opacity = '1'; }, 100);
                }
            }
        }
        
        if (item.domain === 'light') {
            this.updateLightControlsUI(item);
        } else if (item.domain === 'cover') {
            this.updateCoverControlsUI(item);
        }
    }

    getDetailLeftHTML(item) {
        const state = this._hass.states[item.id];
        const isActive = this.isEntityActive(state);
        const stateInfo = this.getDetailedStateText(item);
        const quickStats = this.getQuickStats(item);
        const backgroundImage = this.getBackgroundImageForItem(item);
        const albumArt = (item.domain === 'media_player') ? this.getAlbumArtUrl(item) : null;
        
        const backgroundStyle = albumArt 
            ? `background-image: url('${albumArt}');`
            : `background-image: url('${backgroundImage}');`;

        const lightOnClass = (item.domain === 'light' && isActive) ? 'light-on' : '';

        return `
            <div class="detail-header">
                <button class="back-button">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5"/>
                        <path d="M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <h3 class="detail-title">${item.name}</h3>
            </div>
            <div class="icon-content <span class="math-inline">\{lightOnClass\}"\>
<div class\="icon\-background" style\="</span>{backgroundStyle}"></div>
                <div class="status-indicator-large <span class="math-inline">\{isActive ? 'active' \: ''\}"\></span>{stateInfo.status}</div>
                <div class="quick-stats">
                    ${quickStats.map(stat => `<div class="stat-item">${stat}</div>`).join('')}
                </div>
            </div>
        `;
    }

    getDetailRightHTML(item) {
        const controlsHTML = this.getDeviceControlsHTML(item);
        
        return `
            <div class="detail-tabs-container">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                    <a href="#" class="detail-tab active" data-tab="controls">🎮 Steuerung</a>
                    <a href="#" class="detail-tab" data-tab="shortcuts">⚡ Shortcuts</a>
                    <a href="#" class="detail-tab" data-tab="history">📈 Verlauf</a>
                </div>
            </div>
            <div id="tab-content-container">
                <div class="detail-tab-content active" data-tab-content="controls">
                    ${controlsHTML}
                </div>
                <div class="detail-tab-content" data-tab-content="shortcuts">
                    <div>Shortcuts coming soon.</div>
                </div>
                <div class="detail-tab-content" data-tab-content="history">
                    <div>History coming soon.</div>
                </div>
            </div>
        `;
    }
    
    getDeviceControlsHTML(item) {
        switch (item.domain) {
            case 'light':
                return this.getLightControlsHTML(item);
            case 'cover':
                return this.getCoverControlsHTML(item);
            default:
                return `<div>No special controls for ${item.domain}.</div>`;
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
                <div class="power-switch">
                    <input type="checkbox" ${isOn ? 'checked' : ''} data-action="toggle" />
                    <div class="button">
                        <svg class="power-off"><use xlink:href="#line" class="line"/><use xlink:href="#circle" class="circle"/></svg>
                        <svg class="power-on"><use xlink:href="#line" class="line"/><use xlink:href="#circle" class="circle"/></svg>
                    </div>
                </div>
                <div class="position-slider-container brightness-slider-container <span class="math-inline">\{isOn ? 'visible' \: ''\}" style\="\-\-slider\-color\-rgb\: 255,255,255;"\>
<svg class\="brightness\-icon" xmlns\="http\://www\.w3\.org/2000/svg" viewBox\="0 0 24 24"\>
<path d\="M12 18c\-3\.314 0\-6\-2\.686\-6\-6s2\.686\-6 6\-6 6 2\.686 6 6\-2\.686 6\-6 6zm0\-10c\-2\.206 0\-4 1\.794\-4 4s1\.794 4 4 4 4\-1\.794 4\-4\-1\.794\-4\-4\-4zm0\-2V2c0\-\.552\-\.448\-1\-1\-1s\-1 \.448\-1 1v4c0 \.552\.448 1 1 1s1\-\.448 1\-1zm0 16v\-4c0\-\.552\-\.448\-1\-1\-1s\-1 \.448\-1 1v4c0 \.552\.448 1 1 1s1\-\.448 1\-1zm8\-8h\-4c\-\.552 0\-1 \.448\-1 1s\.448 1 1 1h4c\.552 0 1\-\.448 1\-1s\-\.448\-1\-1\-1zM6 12H2c\-\.552 0\-1 \.448\-1 1s\.448 1 1 1h4c\.552 0 1\-\.448 1\-1s\-\.448\-1\-1\-1zm11\.657\-5\.657l\-2\.828 2\.828c\-\.391\.391\-\.391 1\.024 0 1\.414\.195\.195\.451\.293\.707\.293s\.512\-\.098\.707\-\.293l2\.828\-2\.828c\.391\-\.391\.391\-1\.024 0\-1\.414s\-1\.024\-\.391\-1\.414 0zM8\.464 15\.536l\-2\.828 2\.828c\-\.391\.391\-\.391 1\.024 0 1\.414\.195\.195\.451\.293\.707\.293s\.512\-\.098\.707\-\.293l2\.828\-2\.828c\.391\-\.391\.391\-1\.024 0\-1\.414s\-1\.024\-\.391\-1\.414 0zm8 0c\-\.391\.391\-\.391 1\.024 0 1\.414l2\.828 2\.828c\.195\.195\.451\.293\.707\.293s\.512\-\.098\.707\-\.293c\.391\-\.391\.391\-1\.024 0\-1\.414l\-2\.828\-2\.828c\-\.391\-\.391\-1\.024\-\.391\-1\.414 0zM8\.464 8\.464c\-\.391\.391\-\.391 1\.024 0 1\.414l2\.828 2\.828c\.195\.195\.451\.293\.707\.293s\.512\-\.098\.707\-\.293c\.391\-\.391\.391\-1\.024 0\-1\.414L9\.878 8\.464c\-\.391\-\.391\-1\.024\-\.391\-1\.414 0z"/\>
</svg\>
<input type\="range" class\="brightness\-slider" data\-control\="brightness" min\="0" max\="100" value\="</span>{brightness}">
                    <span class="brightness-value-display">${brightness}%</span>
                </div>
                <div class="device-control-row ${isOn && (hasTempSupport || hasColorSupport) ? '' : 'hidden'}">
                    ${hasTempSupport ? `
                        <button class="device-control-button" data-temp="2700" title="Warm White"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.5 4.5l7 7-7 7"/></svg></button>
                        <button class="device-control-button" data-temp="4000" title="Natural White"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></button>
                        <button class="device-control-button" data-temp="6500" title="Cool White"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/></svg></button>
                    ` : ''}
                    ${hasColorSupport ? `
                        <button class="device-control-button" data-action="toggle-colors" title="Farbe ändern"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></button>
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
        const position = state.attributes.current_position ?? 100;

        return `
            <div class="device-control-design" id="device-control-<span class="math-inline">\{item\.id\}"\>
<div class\="position\-slider\-container" style\="\-\-slider\-color\-rgb\: var\(\-\-accent\-rgb\);"\>
<svg class\="position\-icon" viewBox\="0 0 24 24" fill\="none" stroke\="currentColor"\><path d\="M3 5v14h18V5H3zm0 4h18M3 13h18" stroke\-width\="2" stroke\-linecap\="round" stroke\-linejoin\="round"/\></svg\>
<input type\="range" class\="position\-slider" data\-control\="position" min\="0" max\="100" value\="</span>{position}">
                    <span class="position-value-display">${position}%</span>
                </div>

                <div class="device-control-row">
                    <button class="device-control-button" data-action="open" title="Öffnen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button class="device-control-button" data-action="stop" title="Stopp">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    </button>
                    <button class="device-control-button" data-action="close" title="Schließen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <button class="device-control-button" data-action="toggle-presets" title="Szenen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
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
    
    updateLightControlsUI(item) {
        const lightContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!lightContainer) return;
        const state = this._hass.states[item.id];
        const isOn = state.state === 'on';
        const brightness = isOn ? Math.round((state.attributes.brightness || 0) / 2.55) : 0;
        
        const powerSwitch = lightContainer.querySelector('.power-switch input');
        if (powerSwitch) powerSwitch.checked = isOn;
        
        const sliderContainer = lightContainer.querySelector('.brightness-slider-container');
        if (sliderContainer) sliderContainer.classList.toggle('visible', isOn);
        
        const controlsRow = lightContainer.querySelector('.device-control-row');
        if (controlsRow) controlsRow.classList.toggle('hidden', !isOn);
        
        const brightnessValueLabel = lightContainer.querySelector('.brightness-value-display');
        if(brightnessValueLabel) brightnessValueLabel.textContent = `${brightness}%`;
        
        const brightnessSlider = lightContainer.querySelector('[data-control="brightness"]');
        if(brightnessSlider) {
            brightnessSlider.value = brightness;
            if (sliderContainer) sliderContainer.style.setProperty('--percentage', `${brightness}%`);
        }
        
        if (!isOn) {
            const presetsContainer = lightContainer.querySelector('.device-control-presets');
            if (presetsContainer.classList.contains('visible')) {
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
        
        const positionSlider = coverContainer.querySelector('[data-control="position"]');
        if (positionSlider) positionSlider.value = position;
        
        const positionValueDisplay = coverContainer.querySelector('.position-value-display');
        if (positionValueDisplay) positionValueDisplay.textContent = `${position}%`;

        const sliderContainer = coverContainer.querySelector('.position-slider-container');
        if (sliderContainer) sliderContainer.style.setProperty('--percentage', `${position}%`);

        const presets = coverContainer.querySelectorAll('.device-control-preset');
        presets.forEach(p => p.classList.remove('active'));
        const activePreset = coverContainer.querySelector(`.device-control-preset[data-position="${position}"]`);
        if (activePreset) activePreset.classList.add('active');
    }

    setupDetailTabs(item) {
        const tabsContainer = this.shadowRoot.querySelector('.detail-tabs');
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
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                moveSlider(tab);
                
                contents.forEach(c => c.classList.remove('active'));
                this.shadowRoot.querySelector(`[data-tab-content="${targetId}"]`).classList.add('active');
            });
        });

        if (item.domain === 'light') {
            this.setupLightControls(item);
        } else if (item.domain === 'cover') {
            this.setupCoverControls(item);
        }
    }
    
    setupLightControls(item) {
        const lightContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!lightContainer) return;

        const powerSwitch = lightContainer.querySelector('.power-switch input[data-action="toggle"]');
        const brightnessSlider = lightContainer.querySelector('.brightness-slider');
        const sliderContainer = lightContainer.querySelector('.brightness-slider-container');
        const brightnessValueLabel = lightContainer.querySelector('.brightness-value-display');
        const tempButtons = lightContainer.querySelectorAll('[data-temp]');
        const colorToggle = lightContainer.querySelector('[data-action="toggle-colors"]');
        const colorPresets = lightContainer.querySelectorAll('.device-control-preset');
        const presetsContainer = lightContainer.querySelector('.device-control-presets');

        if (powerSwitch) {
            powerSwitch.addEventListener('change', () => this.callLightService('toggle', item.id));
        }
        
        if (brightnessSlider) {
            const updateSlider = (value) => {
                if (brightnessValueLabel) brightnessValueLabel.textContent = `${value}%`;
                if (sliderContainer) sliderContainer.style.setProperty('--percentage', `${value}%`);
            };
            
            brightnessSlider.addEventListener('input', (e) => updateSlider(parseInt(e.target.value, 10)));
            brightnessSlider.addEventListener('change', (e) => {
                const value = parseInt(e.target.value, 10);
                if (value === 0) {
                    this.callLightService('turn_off', item.id);
                } else {
                    this.callLightService('turn_on', item.id, { brightness_pct: value });
                }
            });
            
            if (sliderContainer) {
                sliderContainer.onmousemove = e => {
                    const rect = sliderContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    sliderContainer.style.setProperty("--mouse-x", `${x}px`);
                    sliderContainer.style.setProperty("--mouse-y", `${y}px`);
                };
            }
        }
        
        tempButtons.forEach(btn => btn.addEventListener('click', () => {
            const kelvin = parseInt(btn.dataset.temp, 10);
            this.callLightService('turn_on', item.id, { kelvin: kelvin });
            if (sliderContainer) {
                let rgb = [255, 255, 255]; // default
                if (kelvin <= 2700) rgb = [255, 166, 87];
                else if (kelvin <= 4000) rgb = [255, 219, 186];
                else rgb = [201, 226, 255];
                sliderContainer.style.setProperty('--slider-color-rgb', rgb.join(','));
            }
        }));

        if (colorToggle) {
            colorToggle.addEventListener('click', () => {
                const isOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                this.animatePresetStagger(presetsContainer, colorPresets, !isOpen);
                presetsContainer.setAttribute('data-is-open', String(!isOpen));
            });
        }
        
        colorPresets.forEach(preset => preset.addEventListener('click', () => {
            const rgb = preset.dataset.rgb.split(',').map(Number);
            this.callLightService('turn_on', item.id, { rgb_color: rgb });
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            if (sliderContainer) sliderContainer.style.setProperty('--slider-color-rgb', rgb.join(','));
        }));
    }

    setupCoverControls(item) {
        const coverContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!coverContainer) return;
    
        const positionSlider = coverContainer.querySelector('.position-slider');
        const sliderContainer = coverContainer.querySelector('.position-slider-container');
        const positionValueDisplay = coverContainer.querySelector('.position-value-display');
        const openBtn = coverContainer.querySelector('[data-action="open"]');
        const stopBtn = coverContainer.querySelector('[data-action="stop"]');
        const closeBtn = coverContainer.querySelector('[data-action="close"]');
        const presetsToggle = coverContainer.querySelector('[data-action="toggle-presets"]');
        const presetsContainer = coverContainer.querySelector('.device-control-presets');
        const positionPresets = coverContainer.querySelectorAll('.device-control-preset');

        if (positionSlider) {
            const updateSlider = (value) => {
                if (positionValueDisplay) positionValueDisplay.textContent = `${value}%`;
                if (sliderContainer) sliderContainer.style.setProperty('--percentage', `${value}%`);
            };
            
            positionSlider.addEventListener('input', e => updateSlider(parseInt(e.target.value, 10)));
            positionSlider.addEventListener('change', e => {
                const position = parseInt(e.target.value, 10);
                this.callCoverService('set_cover_position', item.id, { position });
            });

            if (sliderContainer) {
                sliderContainer.onmousemove = e => {
                    const rect = sliderContainer.getBoundingClientRect();
                    sliderContainer.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                    sliderContainer.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                };
            }
        }
        
        if(openBtn) openBtn.addEventListener('click', () => this.callCoverService('open_cover', item.id));
        if(stopBtn) stopBtn.addEventListener('click', () => this.callCoverService('stop_cover', item.id));
        if(closeBtn) closeBtn.addEventListener('click', () => this.callCoverService('close_cover', item.id));

        if (presetsToggle) {
            presetsToggle.addEventListener('click', () => {
                const isOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                this.animatePresetStagger(presetsContainer, positionPresets, !isOpen);
                presetsContainer.setAttribute('data-is-open', String(!isOpen));
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
                { opacity: isOpening ? 0 : 1, transform: `scale(<span class="math-inline">\{isOpening ? 0\.5 \: 1\}\) translateY\(</span>{isOpening ? '-20px' : '0'})` },
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
            case 'light': return { status: state.state === 'on' ? 'Ein' : 'Aus' };
            case 'climate': return { status: state.state !== 'off' ? state.state : 'Aus' };
            case 'cover': return { status: state.state === 'open' ? 'Offen' : 'Geschlossen' };
            case 'media_player': return { status: state.state === 'playing' ? 'Spielt' : (state.state === 'paused' ? 'Pausiert' : 'Aus') };
            default: return { status: state.state };
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
                if (state.attributes.current_temperature) stats.push(`${state.attributes.current_temperature}°C Ist`);
                if (state.attributes.temperature) stats.push(`${state.attributes.temperature}°C Soll`);
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
        const attrs = item.attributes;
        return attrs.entity_picture || attrs.media_image_url || null;
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
}

customElements.define('fast-search-card', FastSearchCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Modern Apple Vision OS inspired search card'
});
console.info(`%c FAST-SEARCH-CARD %c Modern Vision OS Design `, 'color: #007AFF; font-weight: bold; background: black', 'color: white; font-weight: bold; background: #007AFF');
