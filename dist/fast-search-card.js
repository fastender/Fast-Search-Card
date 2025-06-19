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
        this.coverUpdateTimeout = null;
        this.climateUpdateTimeout = null;
        this.mediaPlayerUpdateTimeout = null;
    }

    setConfig(config) {
        if (!config.entities || !Array.isArray(config.entities)) {
            throw new Error('Entities configuration is required');
        }

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
                --accent-light: rgba(0, 122, 255, 0.15);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                --neumorphic-base: #2c2f33;
                --neumorphic-shadow-dark: #23272b;
                --neumorphic-shadow-light: #35373b;
                --media-player-accent: #FFCC00; /* Yellow for media player */
                --media-player-accent-rgb: 255, 204, 0;
                --media-player-accent-light: rgba(255, 204, 0, 0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* TTS Styles */
            .tts-section {
                margin-top: 16px;
                padding: 0px; /* Adjust padding as needed */
                background: transparent;
                border-radius: 12px;
            }
            .tts-input-container {
                margin-bottom: 16px;
            }
            .tts-textarea {
                width: 100%;
                min-height: 80px;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.2); /* Adjust for glassmorphism */
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                box-sizing: border-box;
                transition: border-color 0.2s;
                background: rgba(0, 0, 0, 0.15); /* Glassmorphism background */
                color: var(--text-primary);
                outline: none;
            }
            .tts-textarea:focus {
                border-color: var(--accent);
                box-shadow: 0 0 0 2px var(--accent-light);
            }
            .tts-textarea::placeholder {
                color: var(--text-secondary);
            }
            .tts-counter {
                text-align: right;
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            .tts-counter.warning {
                color: #ff6b35; /* Orange for warning */
                font-weight: 600;
            }
            .tts-controls {
                display: flex;
                gap: 12px;
                align-items: center;
                margin-bottom: 16px;
            }
            .tts-language-select {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                font-size: 14px;
                background: rgba(0, 0, 0, 0.15);
                color: var(--text-primary);
                cursor: pointer;
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22rgba(255,255,255,0.7)%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E');
                background-repeat: no-repeat;
                background-position: right 8px center;
                background-size: 16px;
            }
            .tts-speak-button {
                background: var(--accent);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
                min-width: 100px;
                justify-content: center;
            }
            .tts-speak-button:hover {
                background: rgba(var(--accent-rgb), 0.8);
            }
            .tts-speak-button:disabled {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.4);
                cursor: not-allowed;
            }
            .tts-speak-button.speaking {
                background: #ff4444; /* Red while speaking */
            }
            .tts-speak-button.speaking:hover {
                background: #cc3333;
            }
            .tts-presets {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); /* Adjusted for more flexibility */
                gap: 8px;
            }
            .tts-preset-button {
                background: rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .tts-preset-button:hover {
                background: rgba(0, 0, 0, 0.25);
                border-color: rgba(255, 255, 255, 0.25);
            }
            .tts-preset-button:active {
                transform: translateY(1px);
            }
            @media (max-width: 768px) {
                .tts-controls {
                    flex-direction: column;
                    align-items: stretch;
                }
                .tts-presets {
                    grid-template-columns: 1fr;
                }
            }
            /* END TTS Styles */

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
                padding: 16px 20px;
            }

            .detail-right {
                flex: 1;
                display: flex;
                flex-direction: column;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 0 24px 24px 0;
                box-sizing: border-box;
                overflow: hidden;
            }

            .detail-left-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0px;
                flex-shrink: 0;
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
                width: 300px;
                height: 300px;
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
                text-align: center;
                color: var(--text-primary);
                margin-top: 16px;
            }
            .detail-name {
                font-size: 22px;
                font-weight: 600;
                margin: 0;
                line-height: 1em;
            }
            .detail-area {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 0px;
            }

            .detail-info-row {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                margin-top: 16px;
                opacity: 0;
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
                overflow-y: auto;
                padding: 20px;
                box-sizing: border-box;
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
            /* Specific color for media player */
            .circular-slider-container.media-player .progress-fill {
                stroke: var(--media-player-accent) !important;
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
            /* Specific color for media player handle */
            .circular-slider-container.media-player .handle {
                border-color: var(--media-player-accent) !important;
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

            @media (max-width: 768px) {
                .detail-content { flex-direction: column; }
                .detail-divider { display: none; }
                .detail-left { padding: 16px; flex: none; }
                .detail-right { padding: 0; border-radius: 0 0 24px 24px; margin: 0 10px 10px 10px;}
                #tab-content-container { padding: 16px; }
                .icon-content { justify-content: flex-start; }
                .icon-background-wrapper { width: 180px; height: 180px; }
                .detail-title-area { margin-top: 20px; }
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

        // Update detail view if active and current item is a media player
        if (this.isDetailView && this.currentDetailItem && this.currentDetailItem.domain === 'media_player') {
            this.updateMediaPlayerControlsUI(this.currentDetailItem);
        }
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
                return state.state === 'on' ? 'Aus' : 'Aus';
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

            const iconBackground = detailPanel.querySelector('.icon-background');
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
        } else if (item.domain === 'climate') {
            this.updateClimateControlsUI(item);
        } else if (item.domain === 'media_player') {
            this.updateMediaPlayerControlsUI(item);
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

        const tabsConfig = this._config.detail_tabs || [
            { id: 'controls', title: 'Steuerung', default: true, svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>` },
            { id: 'shortcuts', title: 'Shortcuts', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M9.8525 14.6334L3.65151 10.6873C2.41651 9.90141 2.41651 8.09858 3.65151 7.31268L9.8525 3.36659C11.1628 2.53279 12.8372 2.53279 14.1475 3.36659L20.3485 7.31268C21.5835 8.09859 21.5835 9.90142 20.3485 10.6873L14.1475 14.6334C12.8372 15.4672 11.1628 15.4672 9.8525 14.6334Z" stroke="currentColor"></path><path d="M18.2857 12L20.3485 13.3127C21.5835 14.0986 21.5835 15.9014 20.3485 16.6873L14.1475 20.6334C12.8372 21.4672 11.1628 21.4672 9.8525 20.6334L3.65151 16.6873C2.41651 15.9014 2.41651 14.0986 3.65151 13.3127L5.71429 12" stroke="currentColor"></path></svg>` },
            { id: 'history', title: 'Verlauf', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" stroke-linecap="round"></path><path d="M6 17L20 17" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21L20 21" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 7L15 7" stroke="currentColor" stroke-linecap="round"></path></svg>` }
        ];

        // Add TTS and Music Assistant tabs if media_player
        if (item.domain === 'media_player') {
             tabsConfig.splice(1, 0, { id: 'music', title: 'Musik', svg: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 14V3L9 5V16" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 19H18C19.1046 19 20 18.1046 20 17V14H17C15.8954 14 15 14.8954 15 16V17C15 18.1046 15.8954 19 17 19Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 21H7C8.10457 21 9 20.1046 9 19V16H6C4.89543 16 4 16.8954 4 18V19C4 20.1046 4.89543 21 6 21Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>` });
             tabsConfig.splice(2, 0, { id: 'tts', title: 'Sprechen', svg: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M7 12L17 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 8L13 8" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 20.2895V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7.96125C7.35368 17 6.77906 17.2762 6.39951 17.7506L4.06852 20.6643C3.71421 21.1072 3 20.8567 3 20.2895Z" stroke="currentColor" stroke-width="1"></path></svg>` });
        }


        const tabsHTML = `
            <div class="detail-tabs-container">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                     ${tabsConfig.map(tab => `<a href="#" class="detail-tab ${tab.default ? 'active' : ''}" data-tab="${tab.id}" title="${tab.title}">${tab.svg}</a>`).join('')}
                </div>
            </div>
        `;

        return `
            <div class="detail-left-header">
                <button class="back-button">${newBackButtonSVG}</button>
                ${tabsHTML}
            </div>
            <div class="icon-content">
                <div class="icon-background-wrapper">
                    <div class="icon-background" style="${backgroundStyle}">
                    </div>
                </div>
                <div class="detail-title-area">
                    <h3 class="detail-name">${item.name}</h3>
                    <p class="detail-area">${item.area}</p>
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

    getDetailRightPaneHTML(item) {
        const controlsHTML = this.getDeviceControlsHTML(item);
        const tabsConfig = this._config.detail_tabs || [
            { id: 'controls', title: 'Steuerung', default: true },
            { id: 'shortcuts', title: 'Shortcuts' },
            { id: 'history', title: 'Verlauf' }
        ];

        // Add TTS and Music Assistant content if media_player
        if (item.domain === 'media_player') {
            tabsConfig.splice(1, 0, { id: 'music', title: 'Musik' });
            tabsConfig.splice(2, 0, { id: 'tts', title: 'Sprechen' });
        }


        return `
            <div id="tab-content-container">
                 ${tabsConfig.map(tab => `
                    <div class="detail-tab-content ${tab.default ? 'active' : ''}" data-tab-content="${tab.id}">
                        ${tab.id === 'controls' ? controlsHTML :
                           tab.id === 'tts' ? this.getTTSHTML(item) : /* Add TTS HTML */
                           tab.id === 'music' ? this.getMusicAssistantHTML(item) : /* Add Music Assistant HTML */
                           `<div>${tab.title} coming soon.</div>`
                        }
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
            case 'media_player':
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

    getMediaPlayerControlsHTML(item) {
        const state = this._hass.states[item.id];
        const volumeLevel = state.attributes.volume_level ?? 0;
        const isMuted = state.attributes.is_volume_muted ?? false;
        const isActive = this.isEntityActive(state);
        const mediaState = state.state;

        const playPauseButton = (mediaState === 'playing') ?
            `<button class="device-control-button" data-action="pause" title="Pause">
                <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor" stroke-width="1"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor" stroke-width="1"></path></svg>
            </button>` :
            `<button class="device-control-button" data-action="play" title="Play">
                <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            </button>`;

        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container media-player ${!isActive ? 'off' : ''}" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg">
                        <circle class="progress-bg" cx="80" cy="80" r="68"></circle>
                        <circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: var(--media-player-accent);"></circle>
                    </svg>
                    <div class="slider-inner ${!isActive ? 'off' : ''}">
                        <div class="power-icon">${isMuted ? '🔇' : '🔊'}</div>
                        <div class="circular-value">${isMuted ? 'MUTE' : Math.round(volumeLevel * 100) + '%'}</div>
                        <div class="circular-label">Volume</div>
                    </div>
                    <div class="handle" style="border-color: var(--media-player-accent);"></div>
                </div>

                <div class="device-control-row">
                    <button class="device-control-button" data-action="previous" title="Previous">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 7V17" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.0282 5.2672C17.4217 4.95657 18 5.23682 18 5.73813V18.2619C18 18.7632 17.4217 19.0434 17.0282 18.7328L9.09651 12.4709C8.79223 12.2307 8.79223 11.7693 9.09651 11.5291L17.0282 5.2672Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    ${playPauseButton}
                    <button class="device-control-button" data-action="next" title="Next">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M18 7V17" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.97179 5.2672C6.57832 4.95657 6 5.23682 6 5.73813V18.2619C6 18.7632 6.57832 19.0434 6.97179 18.7328L14.9035 12.4709C15.2078 12.2307 15.2078 11.7693 14.9035 11.5291L6.97179 5.2672Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="toggle-music-assistant" title="Music Assistant">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 14V3L9 5V16" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 19H18C19.1046 19 20 18.1046 20 17V14H17C15.8954 14 15 14.8954 15 16V17C15 18.1046 15.8954 19 17 19Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 21H7C8.10457 21 9 20.1046 9 19V16H6C4.89543 16 4 16.8954 4 18V19C4 20.1046 4.89543 21 6 21Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="toggle-tts" title="Text-to-Speech">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M7 12L17 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 8L13 8" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 20.2895V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7.96125C7.35368 17 6.77906 17.2762 6.39951 17.7506L4.06852 20.6643C3.71421 21.1072 3 20.8567 3 20.2895Z" stroke="currentColor" stroke-width="1"></path></svg>
                    </button>
                </div>
                <div class="device-control-presets media-player-options" data-is-open="false">
                    <div class="device-control-presets-grid">
                        ${this.getTTSHTML(item)} <div class="empty-state" style="padding: 20px 0; grid-column: 1 / -1;">
                            <div class="empty-title">Music Assistant Coming Soon</div>
                            <div class="empty-subtitle">More music controls will appear here.</div>
                        </div>
                    </div>
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

        // Update circular slider if exists
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(currentTemp, state.state !== 'off');
        }

        // Update active classes for HVAC modes
        climateContainer.querySelectorAll('[data-hvac-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.hvacMode === state.state);
        });

        // Update all setting options dynamically
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
                case 'swing_mode':
                    isActive = state.attributes.swing_mode === settingValue;
                    break;
                case 'fan_mode':
                    isActive = state.attributes.fan_mode === settingValue;
                    break;
            }

            opt.classList.toggle('active', isActive);
        });
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
                const presetsContainer = climateContainer.querySelector('.device-control-presets.climate');
                const isOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                this.animatePresetStagger(presetsContainer, presetsContainer.querySelectorAll('.climate-setting-option'), !isOpen);
                presetsContainer.setAttribute('data-is-open', String(!isOpen));
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

    updateMediaPlayerControlsUI(item) {
        const mediaContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!mediaContainer) return;

        const state = this._hass.states[item.id];
        const volumeLevel = state.attributes.volume_level ?? 0;
        const isMuted = state.attributes.is_volume_muted ?? false;
        const isActive = this.isEntityActive(state);
        const mediaState = state.state;

        const circularContainer = mediaContainer.querySelector('.circular-slider-container.media-player');
        const sliderInner = mediaContainer.querySelector('.slider-inner');
        const circularValue = mediaContainer.querySelector('.circular-value');
        const powerIcon = mediaContainer.querySelector('.power-icon');

        if (circularContainer) {
            circularContainer.classList.toggle('off', !isActive);
        }
        if (sliderInner) {
            sliderInner.classList.toggle('off', !isActive);
        }
        if (circularValue) {
            circularValue.textContent = isMuted ? 'MUTE' : `${Math.round(volumeLevel * 100)}%`;
        }
        if (powerIcon) {
            powerIcon.textContent = isMuted ? '🔇' : '🔊';
        }

        // Update circular slider if exists
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(Math.round(volumeLevel * 100), !isMuted);
        }

        // Update Play/Pause button
        const playPauseButtonContainer = mediaContainer.querySelector('[data-action="play"]').parentElement || mediaContainer.querySelector('[data-action="pause"]').parentElement;
        if (playPauseButtonContainer) {
            const currentPlayPauseButton = playPauseButtonContainer.querySelector('[data-action="play"], [data-action="pause"]');
            let newButtonHTML;
            if (mediaState === 'playing') {
                newButtonHTML = `<button class="device-control-button" data-action="pause" title="Pause">
                    <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor" stroke-width="1"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor" stroke-width="1"></path></svg>
                </button>`;
            } else {
                newButtonHTML = `<button class="device-control-button" data-action="play" title="Play">
                    <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </button>`;
            }
            if (currentPlayPauseButton && currentPlayPauseButton.outerHTML !== newButtonHTML) {
                currentPlayPauseButton.outerHTML = newButtonHTML;
                const newButton = playPauseButtonContainer.querySelector('[data-action="play"], [data-action="pause"]');
                if (newButton) {
                    if (mediaState === 'playing') {
                        newButton.addEventListener('click', () => {
                            this.callMediaPlayerService('media_pause', item.id);
                            this.updateMediaPlayerControlsUI({...item, state: 'paused'});
                        });
                    } else {
                        newButton.addEventListener('click', () => {
                            this.callMediaPlayerService('media_play', item.id);
                            this.updateMediaPlayerControlsUI({...item, state: 'playing'});
                        });
                    }
                }
            }
        }
    }


    callLightService(service, entity_id, data = {}) {
        this._hass.callService('light', service, { entity_id, ...data });
    }

    callCoverService(service, entity_id, data = {}) {
        this._hass.callService('cover', service, { entity_id, ...data });
    }

    callMediaPlayerService(service, entity_id, data = {}) {
        this._hass.callService('media_player', service, { entity_id, ...data });
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
            case 'light': return { status: state.state === 'on' ? 'Ein' : 'Aus' };
            case 'climate': return { status: state.attributes.hvac_action || state.state };
            case 'cover': return { status: state.state === 'open' ? 'Offen' : 'Geschlossen' };
            case 'media_player': return { status: state.state === 'playing' ? 'Spielt' : (state.state === 'paused' ? 'Pausiert' : (state.state === 'off' ? 'Aus' : state.state)) };
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
                 if (state.attributes.volume_level != null) {
                     stats.push(`${Math.round(state.attributes.volume_level * 100)}% Lautstärke`);
                 }
                 if (state.attributes.is_volume_muted) {
                     stats.push('Stumm');
                 }
                 if (state.attributes.media_title) {
                     stats.push(`♪ ${state.attributes.media_title}`);
                 } else if (state.state === 'playing' || state.state === 'paused') {
                    stats.push(state.state === 'playing' ? 'Spielt' : 'Pausiert');
                 }
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

    /* TTS Integration START */
    checkTTSAvailability() {
        if (!this._hass || !this._hass.services) return false;
        
        // Prefer Amazon Polly
        if (this._hass.services.tts && this._hass.services.tts.amazon_polly_say) {
            return true;
        }
        
        // Fallback to generic TTS if any is available
        const ttsServices = Object.keys(this._hass.services.tts || {});
        if (ttsServices.length > 0) return true;

        return false;
    }

    getBestTTSService() {
        if (!this._hass || !this._hass.services) return null;

        if (this._hass.services.tts && this._hass.services.tts.amazon_polly_say) {
            return { domain: 'tts', service: 'amazon_polly_say' };
        }
        if (this._hass.services.tts && this._hass.services.tts.cloud_say) {
            return { domain: 'tts', service: 'cloud_say' };
        }
        const ttsMethods = Object.keys(this._hass.services.tts || {});
        if (ttsMethods.length > 0) {
            return { domain: 'tts', service: ttsMethods[0] };
        }
        return null;
    }

    getTTSHTML(item) {
        if (!this.checkTTSAvailability()) {
            return '<div class="empty-state">TTS nicht verfügbar.</div>';
        }
        
        return `
            <div class="tts-section" id="tts-section-${item.id}">
                <div class="tts-input-container">
                    <textarea 
                        class="tts-textarea" 
                        placeholder="Text eingeben der vorgelesen werden soll..." 
                        maxlength="300"
                        data-tts-input="${item.id}"></textarea>
                    <div class="tts-counter" data-tts-counter="${item.id}">0 / 300 Zeichen</div>
                </div>
                
                <div class="tts-controls">
                    <select class="tts-language-select" data-tts-language="${item.id}">
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="it">🇮🇹 Italiano</option>
                    </select>
                    <button 
                        class="tts-speak-button" 
                        data-tts-speak="${item.id}"
                        disabled>
                        🗣️ Vorlesen
                    </button>
                </div>
                
                <div class="tts-presets">
                    <button class="tts-preset-button" data-tts-preset="🏠 Willkommen zu Hause!">
                        🏠 Willkommen
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🍽️ Das Essen ist fertig!">
                        🍽️ Essen fertig
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🚪 Bitte zur Haustür kommen.">
                        🚪 Zur Haustür
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🌙 Gute Nacht und schöne Träume!">
                        🌙 Gute Nacht
                    </button>
                    <button class="tts-preset-button" data-tts-preset="⚠️ Achtung! Wichtige Durchsage.">
                        ⚠️ Durchsage
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🎵 Die Musik ist zu laut!">
                        🎵 Musik leiser
                    </button>
                </div>
            </div>
        `;
    }

    setupTTSEventListeners(item) {
        const ttsInput = this.shadowRoot.querySelector(`[data-tts-input="${item.id}"]`);
        const ttsCounter = this.shadowRoot.querySelector(`[data-tts-counter="${item.id}"]`);
        const ttsLanguage = this.shadowRoot.querySelector(`[data-tts-language="${item.id}"]`);
        const ttsSpeakButton = this.shadowRoot.querySelector(`[data-tts-speak="${item.id}"]`);
        const ttsPresets = this.shadowRoot.querySelectorAll(`[data-tts-preset]`);
        
        if (!ttsInput || !ttsSpeakButton) return;
        
        ttsInput.addEventListener('input', (e) => {
            const text = e.target.value;
            const length = text.length;
            
            if (ttsCounter) {
                ttsCounter.textContent = `${length} / 300 Zeichen`;
                ttsCounter.classList.toggle('warning', length > 250);
            }
            
            ttsSpeakButton.disabled = length === 0 || length > 300;
        });
        
        ttsPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const presetText = preset.getAttribute('data-tts-preset');
                if (presetText && ttsInput) {
                    ttsInput.value = presetText;
                    const inputEvent = new Event('input');
                    ttsInput.dispatchEvent(inputEvent);
                    
                    preset.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        preset.style.transform = '';
                    }, 150);
                }
            });
        });
        
        ttsSpeakButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const text = ttsInput.value.trim();
            if (!text) return;
            
            const language = ttsLanguage ? ttsLanguage.value : 'de';
            const isSpeaking = ttsSpeakButton.classList.contains('speaking');
            
            if (isSpeaking) {
                await this.stopTTS(item.id);
                this.updateTTSButton(ttsSpeakButton, false);
            } else {
                const success = await this.speakTTS(item.id, text, language, ttsSpeakButton);
                if (success) {
                    this.updateTTSButton(ttsSpeakButton, true);
                    const wordCount = text.split(' ').length;
                    const estimatedDuration = Math.max(3000, (wordCount / 150) * 60 * 1000);
                    
                    setTimeout(() => {
                        this.updateTTSButton(ttsSpeakButton, false);
                    }, estimatedDuration);
                }
            }
        });
    }

    async speakTTS(entityId, text, language = 'de', buttonElement = null) {
        if (!this._hass || !text) return false;
        
        try {
            if (buttonElement) {
                buttonElement.disabled = true;
                buttonElement.innerHTML = '⏳ Spreche...';
            }
            
            const serviceData = {
                entity_id: entityId,
                message: text,
                language: language // Add language to service data
            };
            
            // Prioritize amazon_polly_say if available, otherwise use generic tts.speak or others
            const bestTts = this.getBestTTSService();
            if (bestTts && bestTts.domain === 'tts' && bestTts.service === 'amazon_polly_say') {
                this._hass.callService('tts', 'amazon_polly_say', serviceData).catch(error => {
                    if (error.message && (error.message.includes('timeout') || error.message.includes('5XX'))) {
                        console.log('ℹ️ Polly Proxy-Fehler ignoriert - Audio läuft vermutlich trotzdem');
                    } else {
                        console.error('❌ Polly TTS Fehler:', error);
                    }
                });
            } else if (bestTts) {
                 this._hass.callService(bestTts.domain, bestTts.service, serviceData);
            } else {
                 console.warn('No suitable TTS service found.');
                 if (buttonElement) {
                    buttonElement.innerHTML = '❌ Kein TTS-Dienst';
                    buttonElement.disabled = false;
                    setTimeout(() => this.updateTTSButton(buttonElement, false), 3000);
                }
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ TTS Start fehlgeschlagen:', error);
            if (buttonElement) {
                buttonElement.innerHTML = '❌ TTS-Fehler';
                buttonElement.disabled = false;
                setTimeout(() => this.updateTTSButton(buttonElement, false), 3000);
            }
            return false;
        }
    }

    async stopTTS(entityId) {
        if (!this._hass) return false;
        try {
            await this._hass.callService('media_player', 'media_stop', {
                entity_id: entityId
            });
            return true;
        } catch (error) {
            console.error('TTS Stop Fehler:', error);
            return false;
        }
    }
    
    updateTTSButton(button, isSpeaking) {
        if (!button) return;
        if (isSpeaking) {
            button.classList.add('speaking');
            button.innerHTML = '⏹️ Stoppen';
            button.disabled = false;
        } else {
            button.classList.remove('speaking');
            button.innerHTML = '🗣️ Vorlesen';
            button.disabled = false;
        }
    }
    /* TTS Integration END */

    /* Music Assistant (Placeholder for now, structure from old code) */
    getMusicAssistantHTML(item) {
        // This is a placeholder structure, actual implementation for MA search is complex
        // and needs more context from your old MA integration.
        return `
            <div class="ma-search-container">
                <div class="ma-search-bar-container">
                    <input type="text"
                           class="ma-search-input"
                           placeholder="Künstler, Album oder Song suchen..."
                           data-ma-search="${item.id}" disabled>
                    <div class="ma-enqueue-mode" data-ma-enqueue="${item.id}" style="pointer-events: none; opacity: 0.5;">
                        <span class="ma-enqueue-icon">▶️</span>
                        <span class="ma-enqueue-text">Play now</span>
                    </div>
                </div>
                <div class="ma-filter-container" id="ma-filters-${item.id}">
                    <div class="ma-filter-chip ma-filter-active" data-filter="all" style="pointer-events: none; opacity: 0.5;">
                        <span class="ma-filter-icon">🔗</span>
                        <span>Alle</span>
                    </div>
                </div>
                <div class="ma-search-results" id="ma-results-${item.id}">
                    <div class="empty-state">
                        <div class="empty-title">Music Assistant Coming Soon</div>
                        <div class="empty-subtitle">Hier werden Musiksuchergebnisse angezeigt, wenn MA vollständig integriert ist.</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupMusicAssistantEventListeners(item) {
        // Placeholder for MA event listeners
        const presetsContainer = this.shadowRoot.querySelector('.media-player-options');
        const emptyStateElements = presetsContainer.querySelectorAll('.empty-state');
        // This will now activate the empty state from getMusicAssistantHTML
        this.animatePresetStagger(presetsContainer, emptyStateElements, true);
    }
    /* END Music Assistant */


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
