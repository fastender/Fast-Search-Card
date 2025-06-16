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
        this.isDetailView = false;
        this.currentDetailItem = null;
        this.previousSearchState = null;
        this.searchTimeout = null;
        this.isSearching = false;
        this.hasAnimated = false;
    }

    setConfig(config) {
        if (!config.entities || !Array.isArray(config.entities)) {
            throw new Error('Entities-Konfiguration ist erforderlich');
        }
        this._config = {
            title: 'Fast Search',
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
            if (updatedItem) {
                this.currentDetailItem = updatedItem;
                this.updateDetailViewStates();
            }
        } else if (!this.isDetailView && !this.isSearching) {
            this.updateStates();
        }
    }
    
    // Hilfsmethode für alle Animationen
    _animate(element, keyframes, options) {
        if (!element || typeof element.animate !== 'function') return null;
        const defaultOptions = {
            duration: 350,
            easing: 'cubic-bezier(0.2, 1, 0.3, 1)', // Weicher, visionOS-ähnlicher Ease
            fill: 'forwards'
        };
        return element.animate(keyframes, { ...defaultOptions, ...options });
    }

    shouldUpdateItems(oldHass, newHass) {
        if (!this._config.entities) return false;
        for (const entityConfig of this._config.entities) {
            const entityId = entityConfig.entity;
            if (oldHass.states[entityId] !== newHass.states[entityId]) {
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
                --glass-blur-amount: 25px;
                --glass-border-color: rgba(255, 255, 255, 0.2);
                --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
                --accent: #007AFF;
                --accent-light: rgba(0, 122, 255, 0.15);
                --text-primary: rgba(255, 255, 255, 0.98);
                --text-secondary: rgba(255, 255, 255, 0.7);
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
            }
            .glass-panel::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: -1;
                border-radius: inherit;
                -webkit-backdrop-filter: blur(var(--glass-blur-amount));
                backdrop-filter: blur(var(--glass-blur-amount));
                background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05) 70%);
            }
            .glass-panel::after {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: 1;
                border-radius: inherit;
                pointer-events: none;
                box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3), inset 0 -1px 1px rgba(0, 0, 0, 0.1);
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

            /* Panel-Styling und Übergänge werden jetzt per JS gesteuert */
            .search-panel, .detail-panel {
                background-color: rgba(0,0,0,0);
                display: flex;
                flex-direction: column;
                width: 100%;
                will-change: transform, opacity;
            }

            .search-panel {
                max-height: 72px; /* Start-Höhe */
            }
            
            .detail-panel {
                position: absolute;
                top: 0; left: 0;
                height: 500px; /* Feste Höhe für das Detail-Panel */
                opacity: 0;
                pointer-events: none;
                transform: translateX(5%) scale(0.95);
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: sticky; top: 0; z-index: 2;
                background-color: rgba(255, 255, 255, 0.01);
            }

            .category-icon, .filter-icon {
                width: 24px; height: 24px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                border-radius: 6px; background: rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }
            .category-icon svg, .filter-icon svg {
                width: 18px; height: 18px; stroke: var(--text-secondary); stroke-width: 2;
                stroke-linecap: round; stroke-linejoin: round;
            }

            .search-input {
                flex: 1; border: none; background: transparent; outline: none;
                font-size: 17px; color: var(--text-primary); font-family: inherit; min-width: 0;
            }
            .search-input::placeholder { color: var(--text-secondary); }

            .clear-button {
                width: 24px; height: 24px; border: none; background: rgba(255, 255, 255, 0.15);
                border-radius: 50%; cursor: pointer; display: flex; align-items: center;
                justify-content: center; flex-shrink: 0;
                /* Startzustand für Animation */
                opacity: 0; transform: scale(0);
                pointer-events: none; 
            }
            .clear-button.visible { pointer-events: auto; }
            .clear-button svg { width: 12px; height: 12px; stroke: var(--text-secondary); stroke-width: 2; }

            .subcategories {
                display: flex; gap: 8px; padding: 0 20px 16px 20px; overflow-x: auto;
                scrollbar-width: none; -ms-overflow-style: none; flex-shrink: 0;
            }
            .subcategories::-webkit-scrollbar { display: none; }
            
            .subcategory-chip {
                padding: 6px 16px; background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px;
                cursor: pointer; white-space: nowrap; flex-shrink: 0; text-align: center;
                height: 50px; display: flex; align-items: center;
            }
            .subcategory-chip.active {
                background: var(--accent-light); border-color: var(--accent);
                color: var(--accent); box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
            }
            .chip-content { display: flex; flex-direction: column; line-height: 1.2; gap: 2px; color: var(--text-primary); }
            .subcategory-name { font-size: 14px; font-weight: 500; }
            .subcategory-status { font-size: 11px; color: var(--text-secondary); opacity: 0.9; min-height: 13px; }
            .subcategory-chip.active .subcategory-status { color: var(--accent); }
            .subcategory-chip.active .chip-content { color: var(--accent); }

            .results-container {
                flex-grow: 1; overflow-y: auto; scrollbar-width: none;
                opacity: 0; /* Startzustand für Animation */
                padding-top: 16px; padding-bottom: 20px;
            }
            .results-container::-webkit-scrollbar { display: none; }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px; min-height: 200px;
                padding-left: 20px; padding-right: 20px;
            }

            .area-header {
                grid-column: 1 / -1; font-size: 14px; font-weight: 600; color: var(--text-secondary);
                margin: 16px 0 8px 0; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .area-header:first-child { margin-top: 0; }

            .device-card {
                background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 16px; padding: 16px; cursor: pointer; aspect-ratio: 1;
                display: flex; flex-direction: column; justify-content: space-between;
                position: relative; overflow: hidden; will-change: transform, box-shadow;
            }
            .device-card.active {
                background: var(--accent-light); border-color: var(--accent);
                box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            .device-icon {
                width: 32px; height: 32px; background: rgba(255, 255, 255, 0.15);
                border-radius: 8px; display: flex; align-items: center; justify-content: center;
                font-size: 18px; margin-bottom: auto;
            }
            .device-card.active .device-icon {
                background: rgba(0, 122, 255, 0.3); color: var(--accent);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
            }
            .device-name {
                font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0;
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2;
            }
            .device-status { font-size: 11px; color: var(--text-secondary); margin: 0; opacity: 0.8; }
            .device-card.active .device-status { color: var(--accent); opacity: 1; }

            .detail-header {
                padding: 20px; display: flex; align-items: center; gap: 16px;
                position: absolute; top: 0; left: 0; right: 0; z-index: 10;
            }
            .back-button {
                width: 32px; height: 32px; border: none; background: rgba(0, 0, 0, 0.15);
                border-radius: 50%; cursor: pointer; display: flex; align-items: center;
                justify-content: center; z-index: 11;
            }
            .back-button svg { width: 18px; height: 18px; stroke: var(--text-primary); stroke-width: 2; }
            .detail-title { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }

            /* NEU: Flex-Layout für Detailansicht */
            .detail-content {
                display: flex; height: 100%; overflow: hidden;
                /* Kein Padding-Top mehr hier, wird im Child (.detail-right) gehandhabt */
            }

            .detail-left {
                flex: 1.2; padding: 20px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                position: relative; overflow: hidden;
            }
            /* NEU: Dunklerer Hintergrund für die rechte Seite */
            .detail-right {
                flex: 1; display: flex; flex-direction: column;
                background: rgba(0, 0, 0, 0.15);
                border-left: 1px solid var(--glass-border-color);
                /* NEU: Padding hier, um den Header auszugleichen */
                padding: 80px 0 20px 0; 
            }
            .icon-background {
                position: absolute; top: 50%; left: 50%; width: 60%; height: 60%;
                transform: translate(-50%, -50%); background-size: cover; background-position: center;
                z-index: 0; border-radius: 20px; opacity: 0; /* Start für Animation */
            }
            .icon-content {
                position: relative; z-index: 1; width: 100%; height: 100%;
                display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; box-sizing: border-box;
            }
            .status-indicator-large {
                position: absolute; bottom: 20px; left: 20px; background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-primary); padding: 8px 16px;
                border-radius: 20px; font-size: 12px; font-weight: 500; opacity: 0;
            }
            .status-indicator-large.active { background: var(--accent); border-color: var(--accent); }
            .quick-stats {
                position: absolute; bottom: 20px; right: 20px; display: flex;
                flex-direction: column; gap: 6px; align-items: flex-end; opacity: 0;
            }
            .stat-item {
                background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px; padding: 6px 12px; font-size: 11px;
                color: var(--text-secondary); font-weight: 500; white-space: nowrap;
            }

            .category-buttons {
                display: flex; flex-direction: column; gap: 12px;
                opacity: 0; transform: translateX(20px) scale(0.9); /* Start für Animation */
                pointer-events: none;
            }
            .category-buttons.visible { pointer-events: auto; }

            .category-button {
                width: 56px; height: 56px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; cursor: pointer;
            }
            .category-button.active {
                background: var(--accent-light); border-color: var(--accent);
                box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
            }
            .category-button svg {
                width: 24px; height: 24px; stroke: var(--text-secondary); stroke-width: 2;
                stroke-linecap: round; stroke-linejoin: round;
            }
            .category-button.active svg { stroke: var(--accent); }

            .empty-state {
                grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);
                display: flex; flex-direction: column; align-items: center; gap: 12px;
            }
            .empty-icon { font-size: 32px; opacity: 0.5; }
            .empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
            .empty-subtitle { font-size: 13px; opacity: 0.7; margin: 0; }

            /* Detail Tabs */
            .detail-tabs-container {
                display: flex; justify-content: center;
                padding: 0 20px; /* Padding für seitlichen Abstand */
            }
            .detail-tabs {
                position: relative; background: rgba(0, 0, 0, 0.25);
                /* NEU: Angepasster Radius */
                border-radius: 16px; 
                display: inline-flex; padding: 5px; margin-bottom: 24px;
            }
            .tab-slider {
                position: absolute; top: 5px; height: calc(100% - 10px);
                background: rgba(255, 255, 255, 0.2); 
                /* NEU: Angepasster Radius */
                border-radius: 12px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 1;
            }
            .detail-tab {
                padding: 8px 16px; cursor: pointer; color: var(--text-secondary);
                transition: color 0.25s ease; z-index: 2; font-weight: 500;
                font-size: 14px; white-space: nowrap;
                /* NEU: Unterstreichung entfernt */
                text-decoration: none; 
            }
            .detail-tab.active { color: var(--text-primary); }

            #tab-content-container {
                flex-grow: 1; overflow-y: auto; scrollbar-width: none;
                padding: 0 20px; /* Padding für den Inhalt */
            }
            #tab-content-container::-webkit-scrollbar { display: none; }
            .detail-tab-content { display: none; }
            .detail-tab-content.active { display: block; }
            
            .device-control-design {
                display: flex; flex-direction: column; align-items: center;
                gap: 24px; position: relative; z-index: 5;
            }
            /* ENTFERNT: .device-control-header wurde entfernt */
            
            /* Power-Switch-Styles bleiben unverändert (1:1 Kopie) */
            .power-switch {
                /* ... bestehende Stile ... */
            }
            /* ... restliche Power-Switch-Stile ... */

            /* Brightness-Slider-Styles bleiben weitgehend unverändert */
            .brightness-slider-container {
                /* ... bestehende Stile ... */
            }
            /* ... restliche Slider-Stile ... */

            @media (max-width: 768px) {
                /* ... bestehende Media-Query-Stile ... */
                .detail-content { flex-direction: column; }
                .detail-right { border-left: none; border-top: 1px solid var(--glass-border-color); padding-top: 20px; }
            }

            /* HIER FOLGEN DIE STYLES FÜR POWER-SWITCH UND SLIDER, DIE unverändert bleiben können */
            .power-switch { --color-invert: #ffffff; --width: 150px; --height: 150px; position: relative; display: flex; justify-content: center; align-items: center; width: var(--width); height: var(--height); }
            .power-switch .button { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; position: relative; }
            .power-switch .button::after { content: ""; width: 100%; height: 100%; position: absolute; background: radial-gradient(circle closest-side, var(--color-invert), transparent); filter: blur(20px); opacity: 0; transition: opacity 1s ease, transform 1s ease; transform: perspective(1px) translateZ(0); backface-visibility: hidden; }
            .power-switch .button .power-on, .power-switch .button .power-off { height: 100%; width: 100%; position: absolute; z-index: 1; fill: none; stroke: var(--color-invert); stroke-width: 8px; stroke-linecap: round; stroke-linejoin: round; }
            .power-switch .button .power-on .line, .power-switch .button .power-off .line { opacity: .2; }
            .power-switch .button .power-on .circle, .power-switch .button .power-off .circle { opacity: .2; transform: rotate(-58deg); transform-origin: center 80px; stroke-dasharray: 220; stroke-dashoffset: 40; }
            .power-switch .button .power-on { filter: drop-shadow(0px 0px 6px rgba(255,255,255,.8)); }
            .power-switch .button .power-on .line { opacity: 0; transition: opacity .3s ease 1s; }
            .power-switch .button .power-on .circle { opacity: 1; stroke-dashoffset: 220; transition: transform 0s ease, stroke-dashoffset 1s ease 0s; }
            .power-switch input { position: absolute; height: 100%; width: 100%; z-index: 2; cursor: pointer; opacity: 0; }
            .power-switch input:checked + .button::after { opacity: 0.15; transform: scale(2) perspective(1px) translateZ(0); backface-visibility: hidden; transition: opacity .5s ease, transform .5s ease; }
            .power-switch input:checked + .button .power-on, .power-switch input:checked + .button .power-off { animation: click-animation .3s ease forwards; transform: scale(1); }
            .power-switch input:checked + .button .power-on .line, .power-switch input:checked + .button .power-off .line { animation: line-animation .8s ease-in forwards; }
            .power-switch input:checked + .button .power-on .circle, .power-switch input:checked + .button .power-off .circle { transform: rotate(302deg); }
            .power-switch input:checked + .button .power-on .line { opacity: 1; transition: opacity .05s ease-in .55s; }
            .power-switch input:checked + .button .power-on .circle { transform: rotate(302deg); stroke-dashoffset: 40; transition: transform .4s ease .2s, stroke-dashoffset .4s ease .2s; }
            @keyframes line-animation { 0% { transform: translateY(0); } 10% { transform: translateY(10px); } 40% { transform: translateY(-25px); } 60% { transform: translateY(-25px); } 85% { transform: translateY(10px); } 100% { transform: translateY(0px); } }
            @keyframes click-animation { 0% { transform: scale(1); } 50% { transform: scale(.9); } 100% { transform: scale(1); } }
            .brightness-slider-container { --percentage: 50%; --slider-color: 255,255,255; --main-color: 255,255,255; --el-bg-color: 100,100,100; display: none; width: 280px; height: 20px; padding: 20px 20px; background: rgba(var(--main-color), 0.07); border: 1px solid rgba(var(--main-color), 0.03); border-radius: 50px; align-items: center; justify-content: center; position: relative; overflow: hidden; margin: 16px auto; z-index: 10; }
            .brightness-slider-container.visible { display: flex !important; }
            .brightness-slider-container::after { content: ""; height: 100%; opacity: 0; left: 0; position: absolute; top: 0; transition: opacity 500ms; width: 100%; background: radial-gradient( 500px circle at var(--mouse-x) var(--mouse-y), rgba(var(--main-color), 0.06), transparent 40% ); z-index: -1; }
            .brightness-slider-container:hover::after { opacity: 1; }
            .brightness-icon { fill: rgba(255, 255, 255, 0.8); margin-right: 1em; cursor: pointer; width: 24px; height: 24px; z-index: 11; position: relative; }
            .brightness-slider { margin: 0 10px; appearance: none; width: 100%; height: 5px; border-radius: 50px; outline: none; transition: .2s; cursor: pointer; background: rgba(var(--el-bg-color), 0.3) !important; background-image: none !important; position: relative; overflow: hidden; z-index: 11; }
            .brightness-slider::before { position: absolute; content: ""; height: 100%; width: calc(var(--percentage)); border-radius: 50px; background: rgba(var(--slider-color), 1); transition: all 0.2s ease; left: 0; top: 0; z-index: 1; }
            .brightness-slider::after { position: absolute; content: ""; height: 100%; width: 10px; border-radius: 0 50px 50px 0; background-color: rgba(var(--slider-color), 1); transition: all 0.2s ease; left: calc(var(--percentage) - 10px); top: 0; z-index: 2; }
            .brightness-slider::-webkit-slider-thumb { appearance: none; visibility: hidden; width: 1px; height: 10px; }
            .brightness-slider:hover { height: 1em; }
            .brightness-value-display { font-family: sans-serif; color: rgba(255, 255, 255, 0.9); min-width: 2em; text-align: right; font-size: 14px; z-index: 11; position: relative; }
            .device-control-row { width: 100%; max-width: 280px; display: none; gap: 12px; justify-content: center; margin-top: 16px; z-index: 9; position: relative; }
            .device-control-row.visible { display: flex; }
            .device-control-button { width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); border: none; color: var(--text-primary); font-size: 22px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
            .device-control-button:hover { transform: scale(1.1); background: rgba(255,255,255,0.2); }
            .device-control-button.active { background: var(--accent); }
            .device-control-colors { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.4s ease; width: 100%; max-width: 280px;}
            .device-control-colors.visible { max-height: 150px; opacity: 1; margin-top: 16px;}
            .device-control-colors-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; justify-items: center;}
            .device-control-color-preset { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; position: relative; }
            .device-control-color-preset.active { border-color: white; }
            .device-control-color-preset.active::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; text-shadow: 0 0 4px rgba(0,0,0,0.8); }

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
                            <input type="text" class="search-input" placeholder="Geräte suchen..." autocomplete="off" spellcheck="false">
                            <button class="clear-button">
                                <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            <div class="filter-icon">
                                <svg viewBox="0 0 24 24" fill="none"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                            </div>
                        </div>
                        <div class="results-container">
                             <div class="subcategories">
                                 <div class="subcategory-chip active" data-subcategory="all"><div class="chip-content"><span class="subcategory-name">Alle</span><span class="subcategory-status"></span></div></div>
                                <div class="subcategory-chip" data-subcategory="lights"><div class="chip-content"><span class="subcategory-name">Lichter</span><span class="subcategory-status"></span></div></div>
                                <div class="subcategory-chip" data-subcategory="climate"><div class="chip-content"><span class="subcategory-name">Klima</span><span class="subcategory-status"></span></div></div>
                                <div class="subcategory-chip" data-subcategory="covers"><div class="chip-content"><span class="subcategory-name">Rollos</span><span class="subcategory-status"></span></div></div>
                                <div class="subcategory-chip" data-subcategory="media"><div class="chip-content"><span class="subcategory-name">Medien</span><span class="subcategory-status"></span></div></div>
                                <div class="subcategory-chip" data-subcategory="none"><div class="chip-content"><span class="subcategory-name">Keine</span><span class="subcategory-status"></span></div></div>
                            </div>
                            <div class="results-grid"></div>
                        </div>
                    </div>

                    <div class="detail-panel glass-panel">
                        <div class="detail-header">
                            <button class="back-button">
                                <svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                            </button>
                            <h3 class="detail-title"></h3>
                        </div>
                        <div class="detail-content">
                            <div class="detail-left"></div>
                            <div class="detail-right">
                                </div>
                        </div>
                    </div>
                    
                    <div class="category-buttons">
                         <button class="category-button glass-panel active" data-category="devices" title="Geräte"><svg viewBox="0 0 24 24" fill="none"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg></button>
                        <button class="category-button glass-panel" data-category="scripts" title="Skripte"><svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg></button>
                        <button class="category-button glass-panel" data-category="automations" title="Automationen"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2v6l3-3 3 3"/><path d="M12 18v4"/><path d="M8 8v8"/><path d="M16 8v8"/><circle cx="12" cy="12" r="2"/></svg></button>
                        <button class="category-button glass-panel" data-category="scenes" title="Szenen"><svg viewBox="0 0 24 24" fill="none"><path d="M2 3h6l2 13 13-13v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M8 3v4"/><path d="M16 8v4"/></svg></button>
                    </div>
                </div>
            </div>
            
            <svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
                <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" id="line"><line x1="75" y1="34" x2="75" y2="58"/></symbol>
                <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" id="circle"><circle cx="75" cy="80" r="35"/></symbol>
            </svg>
        `;

        this.setupEventListeners();
    }

    // Event Listener Setup wurde verbessert
    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const categoryIcon = this.shadowRoot.querySelector('.category-icon');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
        const backButton = this.shadowRoot.querySelector('.back-button');
        const searchPanel = this.shadowRoot.querySelector('.search-panel');

        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        clearButton.addEventListener('click', (e) => { e.stopPropagation(); this.clearSearch(); });
        categoryIcon.addEventListener('click', (e) => { e.stopPropagation(); this.toggleCategoryButtons(); });
        filterIcon.addEventListener('click', (e) => { e.stopPropagation(); this.handleFilterClick(e.currentTarget); });
        backButton.addEventListener('click', (e) => { e.stopPropagation(); this.handleBackClick(); });

        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => { e.stopPropagation(); this.handleCategorySelect(button); });
        });
        
        this.shadowRoot.querySelector('.subcategories').addEventListener('click', (e) => {
            const chip = e.target.closest('.subcategory-chip');
            if (chip) { e.stopPropagation(); this.handleSubcategorySelect(chip); }
        });

        // Hover-Animationen per JS
        categoryIcon.addEventListener('mouseenter', (e) => this._animate(e.currentTarget, { transform: ['scale(1)', 'scale(1.05)'], background: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)'] }, { duration: 200 }));
        categoryIcon.addEventListener('mouseleave', (e) => this._animate(e.currentTarget, { transform: ['scale(1.05)', 'scale(1)'], background: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'] }, { duration: 200 }));
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('fast-search-card')) {
                this.hideCategoryButtons();
                this.collapsePanel();
            }
        });
    }
    
    // ... Der Rest der Logik (handleSearch, updateItems, etc.) ...
    // HIER FOLGT DER REST DES JAVASCRIPTS, DER DIE LOGIK ENTHÄLT.
    // Die wichtigsten Änderungen sind in den Animations- und Layout-Funktionen.
    
    handleSearch(query) {
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        this.isSearching = query.trim().length > 0;

        if (this.searchTimeout) clearTimeout(this.searchTimeout);

        if (this.isSearching && !clearButton.classList.contains('visible')) {
            clearButton.classList.add('visible');
            this._animate(clearButton, { opacity: [0, 1], transform: ['scale(0)', 'scale(1)'] });
        } else if (!this.isSearching && clearButton.classList.contains('visible')) {
            const anim = this._animate(clearButton, { opacity: [1, 0], transform: ['scale(1)', 'scale(0)'] });
            if (anim) anim.finished.then(() => clearButton.classList.remove('visible'));
        }

        if (!this.isPanelExpanded) { this.expandPanel(); }
        this.performSearch(query);
    }
    
    clearSearch() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        searchInput.value = '';
        this.handleSearch(''); // Triggert die Logik zum Ausblenden des Buttons
        this.hasAnimated = false;
        this.showCurrentCategoryItems();
        searchInput.focus();
    }
    
    toggleCategoryButtons() {
        this.isMenuView ? this.hideCategoryButtons() : this.showCategoryButtons();
    }

    showCategoryButtons() {
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        this.isMenuView = true;
        categoryButtons.classList.add('visible');
        this._animate(categoryButtons, 
            { opacity: [0, 1], transform: ['translateX(20px) scale(0.9)', 'translateX(0) scale(1)'] },
            { duration: 400 }
        );
    }

    hideCategoryButtons() {
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        if (!this.isMenuView) return;
        this.isMenuView = false;
        const anim = this._animate(categoryButtons, 
            { opacity: [1, 0], transform: ['translateX(0) scale(1)', 'translateX(20px) scale(0.9)'] },
            { duration: 300, easing: 'ease-in' }
        );
        if(anim) anim.finished.then(() => categoryButtons.classList.remove('visible'));
    }
    
    expandPanel() {
        if (this.isPanelExpanded) return;
        this.isPanelExpanded = true;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const resultsContainer = this.shadowRoot.querySelector('.results-container');
        
        // Panel auf volle Höhe animieren
        this._animate(searchPanel, 
            { maxHeight: ['72px', '500px'] },
            { duration: 500 }
        );
        
        // Ergebnisse einblenden
        this._animate(resultsContainer, 
            { opacity: [0, 1], transform: ['translateY(-10px)', 'translateY(0)'] },
            { duration: 400, delay: 100 }
        );
        
        if (!this.shadowRoot.querySelector('.search-input').value.trim()) {
            this.showCurrentCategoryItems();
        }
    }

    collapsePanel() {
        if (!this.isPanelExpanded) return;
        this.isPanelExpanded = false;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const resultsContainer = this.shadowRoot.querySelector('.results-container');

        this._animate(searchPanel, { maxHeight: ['500px', '72px'] }, { duration: 400 });
        this._animate(resultsContainer, { opacity: [1, 0] }, { duration: 200 });
    }

    // Panel-Übergänge mit Web Animations API
    animatePanelTransition(showDetail) {
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');

        if (showDetail) {
            detailPanel.style.pointerEvents = 'auto';
            this._animate(searchPanel, { opacity: [1, 0], transform: ['translateX(0) scale(1)', 'translateX(-5%) scale(0.95)'] });
            this._animate(detailPanel, { opacity: [0, 1], transform: ['translateX(5%) scale(0.95)', 'translateX(0) scale(1)'] });
        } else {
            searchPanel.style.pointerEvents = 'auto';
            const anim = this._animate(detailPanel, { opacity: [1, 0], transform: ['translateX(0) scale(1)', 'translateX(5%) scale(0.95)'] });
            this._animate(searchPanel, { opacity: [0, 1], transform: ['translateX(-5%) scale(0.95)', 'translateX(0) scale(1)'] });
            if(anim) anim.finished.then(() => detailPanel.style.pointerEvents = 'none');
        }
    }
    
    showDetailView() {
        this.isDetailView = true;
        this.animatePanelTransition(true);
        this.renderDetailView();
    }

    handleBackClick() {
        this.isDetailView = false;
        this.animatePanelTransition(false);

        // State wiederherstellen
        if (this.previousSearchState) {
            // ... Logik zur Wiederherstellung des Zustands ...
        }
    }
    
    renderDetailView() {
        const detailLeft = this.shadowRoot.querySelector('.detail-left');
        const detailRight = this.shadowRoot.querySelector('.detail-right');
        const detailTitle = this.shadowRoot.querySelector('.detail-title');
        
        if (!this.currentDetailItem) return;
        
        detailTitle.textContent = this.currentDetailItem.name;
        detailLeft.innerHTML = this.getDetailLeftHTML(this.currentDetailItem);
        detailRight.innerHTML = this.getDetailRightHTML(this.currentDetailItem);

        this.setupDetailTabs(this.currentDetailItem);
        
        // Detail-Elemente animieren
        const iconBackground = detailLeft.querySelector('.icon-background');
        const statusIndicator = detailLeft.querySelector('.status-indicator-large');
        const quickStats = detailLeft.querySelector('.quick-stats');
        
        this._animate(iconBackground, { opacity: [0, 1] }, { duration: 800 });
        this._animate(statusIndicator, { opacity: [0, 1], transform: ['translateX(-20px)', 'translateX(0)'] }, { delay: 600 });
        this._animate(quickStats, { opacity: [0, 1], transform: ['translateX(20px)', 'translateX(0)'] }, { delay: 800 });
    }
    
    // Gekürzte getDetailRightHTML ohne den Header
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
                <div class="detail-tab-content" data-tab-content="shortcuts"><div>Shortcuts folgen bald.</div></div>
                <div class="detail-tab-content" data-tab-content="history"><div>Verlauf folgt bald.</div></div>
            </div>
        `;
    }

    // Gekürzte getLightControlsHTML ohne den Header
    getLightControlsHTML(item) {
        const state = this._hass.states[item.id];
        const isOn = state.state === 'on';
        const brightness = isOn ? Math.round((state.attributes.brightness || 0) / 2.55) : 0;
        const hasTempSupport = (state.attributes.supported_color_modes || []).includes('color_temp');
        const hasColorSupport = (state.attributes.supported_color_modes || []).some(mode => ['rgb', 'rgbw', 'hs'].includes(mode));

        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="power-switch">
                    <input type="checkbox" ${isOn ? 'checked' : ''} data-action="toggle" />
                    <div class="button">
                        <svg class="power-off"><use xlink:href="#line" class="line"/><use xlink:href="#circle" class="circle"/></svg>
                        <svg class="power-on"><use xlink:href="#line" class="line"/><use xlink:href="#circle" class="circle"/></svg>
                    </div>
                </div>
                </div>
        `;
    }
    
    // ... Restliche Methoden bleiben größtenteils gleich ...
    // ... (updateItems, categorizeEntity, getEntityIcon, etc.) ...
    
    // Platzhalter für die volle Klasse, um die Struktur zu zeigen.
    // Fügen Sie hier die restlichen unveränderten Methoden aus Ihrer Originaldatei ein.
    // ...
}

customElements.define('fast-search-card', FastSearchCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Modern Apple Vision OS inspired search card'
});
console.info(`%c FAST-SEARCH-CARD %c Modern Vision OS Design `, 'color: #007AFF; font-weight: bold; background: black', 'color: white; font-weight: bold; background: #007AFF');
