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
        
        console.log('🔍 HASS Update received', new Date().toLocaleTimeString());
        
        const oldHass = this._hass;
        this._hass = hass;
        
        // Nur Items updaten wenn sich wirklich was geändert hat
        if (!oldHass || this.shouldUpdateItems(oldHass, hass)) {
            console.log('📝 Updating items...');
            this.updateItems();
        }
        
        // States nur updaten wenn nicht in Detail-View und nicht am Suchen
        if (!this.isDetailView && !this.isSearching) {
            console.log('🔄 Updating states...');
            this.updateStates();
        } else {
            console.log('⏭️ Skipping state update (DetailView:', this.isDetailView, ', Searching:', this.isSearching, ')');
        }
    }

    shouldUpdateItems(oldHass, newHass) {
        // Prüfe ob sich relevante Entitäten geändert haben
        if (!this._config.entities) return false;
        
        for (const entityConfig of this._config.entities) {
            const entityId = entityConfig.entity;
            const oldState = oldHass.states[entityId];
            const newState = newHass.states[entityId];
            
            if (!oldState && newState) return true; // Neue Entität
            if (oldState && !newState) return true; // Entität entfernt
            if (oldState && newState && oldState.attributes.friendly_name !== newState.attributes.friendly_name) {
                return true; // Name geändert
            }
        }
        
        return false;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
            :host {
                display: block;
                --glass-primary: rgba(255, 255, 255, 0.15);
                --glass-secondary: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                --glass-blur: blur(20px);
                --accent: #007AFF;
                --accent-light: rgba(0, 122, 255, 0.15);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .main-container {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .search-row {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                width: 100%;
            }

            .search-panel {
                flex: 1;
                background: 
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                    rgba(255, 255, 255, 0.08);
                backdrop-filter: var(--glass-blur) saturate(1.8);
                -webkit-backdrop-filter: var(--glass-blur) saturate(1.8);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                box-shadow: var(--glass-shadow);
                position: relative;
                transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                max-height: 72px;
                overflow: hidden;
            }

            .search-panel.expanded {
                max-height: 400px;
            }

            /* DEBUG: Temporäre Debug-Styles */
            .scrollable-content {
                background: rgba(255, 0, 0, 0.1) !important; /* Rot für Debug */
                border: 2px solid red !important;
            }
            
            .subcategories {
                background: rgba(0, 255, 0, 0.1) !important; /* Grün für Debug */
                border: 2px solid green !important;
            }
            
            .results-container {
                background: rgba(0, 0, 255, 0.1) !important; /* Blau für Debug */
                border: 2px solid blue !important;
            }

            .search-panel::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                opacity: 0.6;
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
                transition: all 0.3s ease;
            }

            .search-panel.expanded .subcategories {
                opacity: 1;
                transform: translateY(0);
            }

            .subcategories::-webkit-scrollbar {
                display: none;
            }

            .subcategory-chip {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-secondary);
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
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

            .results-container {
                padding: 0 20px 20px 20px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                height: 280px;
                overflow-y: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
                position: relative;
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
                padding-bottom: 20px;
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
            }

            .device-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .device-card:hover::before {
                opacity: 1;
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

            /* Detail View Styles */
            .detail-panel {
                flex: 1;
                background: 
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                    rgba(255, 255, 255, 0.08);
                backdrop-filter: var(--glass-blur) saturate(1.8);
                -webkit-backdrop-filter: var(--glass-blur) saturate(1.8);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                box-shadow: var(--glass-shadow);
                overflow: hidden;
                position: relative;
                height: 400px;
                display: none;
            }

            .detail-panel.visible {
                display: block;
            }

            .detail-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                gap: 16px;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10;
                background: inherit;
                backdrop-filter: inherit;
                -webkit-backdrop-filter: inherit;
            }

            .back-button {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .back-button:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.05);
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
            }

            .detail-content {
                display: flex;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }

            /* Mobile Detail View - Stack vertically */
            @media (max-width: 480px) {
                .detail-panel {
                    background: rgba(255, 255, 0, 0.3) !important; /* Gelb für Debug Mobile */
                    border: 3px solid orange !important;
                }
                
                .detail-content {
                    flex-direction: column !important;
                    background: rgba(255, 0, 255, 0.2) !important; /* Magenta für Debug */
                }
                
                .detail-left {
                    flex: none !important;
                    width: 100% !important;
                    height: 50% !important;
                    background: rgba(0, 255, 255, 0.2) !important; /* Cyan für Debug */
                    border: 2px solid cyan !important;
                }
                
                .detail-right {
                    flex: none !important;
                    width: 100% !important;
                    height: 50% !important;
                    background: rgba(255, 255, 0, 0.2) !important; /* Gelb für Debug */
                    border: 2px solid yellow !important;
                }
                
                .detail-divider {
                    width: 100% !important;
                    height: 1px !important;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent) !important;
                    margin: 0 !important;
                }
            }

            .detail-left, .detail-right {
                flex: 1;
                padding: 20px;
            }

            .detail-divider {
                width: 1px;
                background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent);
                margin: 20px 0;
            }

            /* Category Buttons */
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
                background: 
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                    rgba(255, 255, 255, 0.08);
                backdrop-filter: var(--glass-blur) saturate(1.8);
                -webkit-backdrop-filter: var(--glass-blur) saturate(1.8);
                border: 1px solid var(--glass-border);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                transition: all 0.2s ease;
                box-shadow: var(--glass-shadow);
            }

            .category-button:hover {
                transform: scale(1.05);
                border-color: var(--accent);
                box-shadow: 0 8px 25px rgba(0, 122, 255, 0.2);
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

            /* Responsive */
            @container (max-width: 480px) {
                .search-row {
                    flex-direction: column;
                    gap: 12px;
                }
                
                .category-buttons.visible {
                    flex-direction: row;
                    justify-content: center;
                }
                
                .category-button {
                    width: 48px;
                    height: 48px;
                }
                
                .results-grid {
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 10px;
                }
                
                .search-input {
                    font-size: 16px;
                }

                .results-container {
                    height: 200px;
                }
                
                .results-grid {
                    padding-bottom: 15px;
                }
            }
            </style>

            <div class="main-container">
                <div class="search-row">
                    <div class="search-panel">
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

                        <div class="scrollable-content">
                            <div class="subcategories">
                                <div class="subcategory-chip active" data-subcategory="all">Alle</div>
                                <div class="subcategory-chip" data-subcategory="lights">Lichter</div>
                                <div class="subcategory-chip" data-subcategory="climate">Klima</div>
                                <div class="subcategory-chip" data-subcategory="covers">Rollos</div>
                                <div class="subcategory-chip" data-subcategory="media">Medien</div>
                                <div class="subcategory-chip" data-subcategory="none">Keine</div>
                            </div>

                            <div class="results-container">
                                <div class="results-grid">
                                    <!-- Results werden hier eingefügt -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-panel">
                        <div class="detail-header">
                            <button class="back-button">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M19 12H5"/>
                                    <path d="M12 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <h3 class="detail-title">Gerätedetails</h3>
                        </div>
                        <div class="detail-content">
                            <div class="detail-left">
                                <!-- Linke Seite -->
                            </div>
                            <div class="detail-divider"></div>
                            <div class="detail-right">
                                <!-- Rechte Seite -->
                            </div>
                        </div>
                    </div>

                    <div class="category-buttons">
                        <button class="category-button active" data-category="devices" title="Geräte">
                            <svg viewBox="0 0 24 24" fill="none">
                                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                                <path d="M12 18h.01"/>
                            </svg>
                        </button>
                        
                        <button class="category-button" data-category="scripts" title="Skripte">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                        </button>
                        
                        <button class="category-button" data-category="automations" title="Automationen">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v6l3-3 3 3"/>
                                <path d="M12 18v4"/>
                                <path d="M8 8v8"/>
                                <path d="M16 8v8"/>
                                <circle cx="12" cy="12" r="2"/>
                            </svg>
                        </button>
                        
                        <button class="category-button" data-category="scenes" title="Szenen">
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
        const backButton = this.shadowRoot.querySelector('.back-button');

        // Search Events
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        
        // Clear Button
        clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearSearch();
        });
        
        // Category Icon - Toggle Category Buttons
        categoryIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCategoryButtons();
        });

        // Filter Icon
        filterIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleFilterClick();
        });

        // Category Buttons
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCategorySelect(button);
            });
        });

        // Back Button
        backButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleBackClick();
        });

        // Subcategory Chips - Event Delegation
        this.shadowRoot.querySelector('.subcategories').addEventListener('click', (e) => {
            const chip = e.target.closest('.subcategory-chip');
            if (chip) {
                e.stopPropagation();
                this.handleSubcategorySelect(chip);
            }
        });

        // Card click handler - prevent bubbling
        this.shadowRoot.querySelector('.main-container').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Global click handler
        document.addEventListener('click', (e) => {
            if (!e.target.closest('fast-search-card')) {
                this.hideCategoryButtons();
                this.collapsePanel();
            }
        });
    }

    handleSearch(query) {
        console.log('🔍 Search triggered:', query);
        
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        
        // Set searching flag
        this.isSearching = query.trim().length > 0;
        console.log('🎯 isSearching set to:', this.isSearching);
        
        // Clear any existing search timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Show/Hide Clear Button
        if (query.length > 0) {
            clearButton.classList.add('visible');
            this.animateElementIn(clearButton, { scale: [0, 1], opacity: [0, 1] });
        } else {
            this.isSearching = false; // Reset wenn leer
            const animation = this.animateElementOut(clearButton);
            animation.finished.then(() => {
                clearButton.classList.remove('visible');
            });
        }
        
        // Search Animation Feedback
        searchInput.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.02)' },
            { transform: 'scale(1)' }
        ], {
            duration: 200,
            easing: 'ease-out'
        });
        
        // Expand panel if not expanded
        if (!this.isPanelExpanded) {
            this.expandPanel();
        }
        
        // Perform search immediately without debounce
        this.performSearch(query);
    }

    handleSearchFocus() {
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        
        // Focus glow effect
        searchPanel.animate([
            { 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            { 
                boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)',
                borderColor: 'var(--accent)'
            }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Auto-expand panel
        if (!this.isPanelExpanded) {
            this.expandPanel();
        }
    }

    clearSearch() {
        console.log('🧹 Clear search triggered');
        
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        
        searchInput.value = '';
        this.isSearching = false; // Reset searching flag
        console.log('🎯 isSearching reset to false');
        
        const animation = this.animateElementOut(clearButton);
        animation.finished.then(() => {
            clearButton.classList.remove('visible');
        });
        
        // Reset to current category items without triggering new searches
        this.hasAnimated = false;
        this.showCurrentCategoryItems();
        searchInput.focus();
    }

    toggleCategoryButtons() {
        if (this.isMenuView) {
            this.hideCategoryButtons();
        } else {
            this.showCategoryButtons();
        }
    }

    showCategoryButtons() {
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        this.isMenuView = true;
        
        categoryButtons.classList.add('visible');
        categoryButtons.animate([
            { 
                opacity: 0,
                transform: 'translateX(20px) scale(0.9)'
            },
            { 
                opacity: 1,
                transform: 'translateX(0) scale(1)'
            }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });
    }

    hideCategoryButtons() {
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        
        if (!this.isMenuView) return;
        
        const animation = categoryButtons.animate([
            { 
                opacity: 1,
                transform: 'translateX(0) scale(1)'
            },
            { 
                opacity: 0,
                transform: 'translateX(20px) scale(0.9)'
            }
        ], {
            duration: 300,
            easing: 'ease-in',
            fill: 'forwards'
        });

        animation.finished.then(() => {
            categoryButtons.classList.remove('visible');
            this.isMenuView = false;
        });
    }

    handleCategorySelect(selectedButton) {
        const category = selectedButton.dataset.category;
        if (category === this.activeCategory) return;

        // Update active states
        this.shadowRoot.querySelectorAll('.category-button').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedButton.classList.add('active');

        // Animate selection
        selectedButton.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });

        this.activeCategory = category;
        this.updateCategoryIcon();
        this.updatePlaceholder();
        
        // Hide category buttons and expand panel
        this.hideCategoryButtons();
        setTimeout(() => {
            this.expandPanel();
            this.showCurrentCategoryItems();
        }, 300);
    }

    handleSubcategorySelect(selectedChip) {
        const subcategory = selectedChip.dataset.subcategory;
        if (subcategory === this.activeSubcategory) return;

        console.log('🏷️ Subcategory selected:', subcategory);

        // Update active states
        this.shadowRoot.querySelectorAll('.subcategory-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        selectedChip.classList.add('active');

        // Animate selection
        selectedChip.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });

        this.activeSubcategory = subcategory;
        this.hasAnimated = false;
        
        // Clear search input to prevent conflicts
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (searchInput.value.trim()) {
            console.log('🧹 Clearing search input due to subcategory change');
            searchInput.value = '';
            this.isSearching = false; // Reset searching flag
            const clearButton = this.shadowRoot.querySelector('.clear-button');
            clearButton.classList.remove('visible');
        }
        
        this.filterBySubcategory();
    }

    handleFilterClick() {
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        
        filterIcon.animate([
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(180deg)' },
            { transform: 'rotate(0deg)' }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
    }

    expandPanel() {
        if (this.isPanelExpanded) return;
        
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        this.isPanelExpanded = true;
        
        searchPanel.classList.add('expanded');
        
        // Show initial items if no search active
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (!searchInput.value.trim()) {
            this.showCurrentCategoryItems();
        }
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
            devices: `<svg viewBox="0 0 24 24" fill="none">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                <path d="M12 18h.01"/>
            </svg>`,
            scripts: `<svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>`,
            automations: `<svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2v6l3-3 3 3"/>
                <path d="M12 18v4"/>
                <circle cx="12" cy="12" r="2"/>
            </svg>`,
            scenes: `<svg viewBox="0 0 24 24" fill="none">
                <path d="M2 3h6l2 13 13-13v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
                <path d="M8 3v4"/>
            </svg>`
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
            // Verwende area aus der Konfiguration, falls verfügbar
            const configArea = entityConfig.area;
            const areaName = configArea || 'Ohne Raum';

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

        // Sortiere nach Räumen
        this.allItems.sort((a, b) => a.area.localeCompare(b.area));

        // Show items based on current active category
        this.showCurrentCategoryItems();
    }

    updateStates() {
        if (!this._hass || this.isDetailView || this.isSearching) {
            console.log('⏭️ Skipping updateStates - DetailView:', this.isDetailView, ', Searching:', this.isSearching);
            return;
        }

        console.log('🔄 Updating device states...');
        const deviceCards = this.shadowRoot.querySelectorAll('.device-card');
        deviceCards.forEach(card => {
            const entityId = card.dataset.entity;
            const state = this._hass.states[entityId];
            
            if (state) {
                const isActive = this.isEntityActive(state);
                const wasActive = card.classList.contains('active');
                
                card.classList.toggle('active', isActive);
                
                // Animate state change
                if (isActive !== wasActive) {
                    this.animateStateChange(card, isActive);
                }
                
                const statusElement = card.querySelector('.device-status');
                if (statusElement) {
                    statusElement.textContent = this.getEntityStatus(state);
                }
            }
        });
    }

    categorizeEntity(domain) {
        const categoryMap = {
            light: 'lights',
            switch: 'lights',
            climate: 'climate',
            fan: 'climate',
            cover: 'covers',
            media_player: 'media',
            script: 'scripts',
            automation: 'automations',
            scene: 'scenes'
        };
        return categoryMap[domain] || 'other';
    }

    getEntityIcon(domain) {
        const iconMap = {
            light: '💡',
            switch: '🔌',
            climate: '🌡️',
            fan: '💨',
            cover: '🪟',
            media_player: '🎵',
            script: '📄',
            automation: '⚙️',
            scene: '🎬'
        };
        return iconMap[domain] || '⚙️';
    }

    isEntityActive(state) {
        const activeStates = ['on', 'playing', 'open', 'heat', 'cool', 'auto'];
        return activeStates.includes(state.state);
    }

    getEntityStatus(state) {
        if (!state) return 'Unbekannt';
        
        const domain = state.entity_id.split('.')[0];
        
        switch (domain) {
            case 'light':
                if (state.state === 'on') {
                    const brightness = state.attributes.brightness;
                    if (brightness) {
                        const percent = Math.round((brightness / 255) * 100);
                        return `${percent}%`;
                    }
                    return 'An';
                }
                return 'Aus';
                
            case 'climate':
                const temp = state.attributes.current_temperature;
                return temp ? `${temp}°C` : state.state;
                
            case 'cover':
                const position = state.attributes.current_position;
                if (position !== undefined) {
                    return `${position}%`;
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
        if (!query.trim()) {
            this.showCurrentCategoryItems();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        this.filteredItems = this.allItems.filter(item => {
            // First filter by current category
            const isInCategory = this.isItemInCategory(item, this.activeCategory);
            if (!isInCategory) return false;
            
            // Then filter by search term
            return item.name.toLowerCase().includes(searchTerm) ||
                   item.id.toLowerCase().includes(searchTerm);
        });
        
        this.renderResults();
    }

    showCurrentCategoryItems() {
        // Filter items by current active category
        this.filteredItems = this.allItems.filter(item => 
            this.isItemInCategory(item, this.activeCategory)
        );
        
        // Apply subcategory filter if not 'all'
        if (this.activeSubcategory !== 'all') {
            this.filterBySubcategory();
        } else {
            this.renderResults();
        }
    }

    isItemInCategory(item, category) {
        switch (category) {
            case 'devices':
                return !['script', 'automation', 'scene'].includes(item.domain);
            case 'scripts':
                return item.domain === 'script';
            case 'automations':
                return item.domain === 'automation';
            case 'scenes':
                return item.domain === 'scene';
            default:
                return true;
        }
    }

    filterBySubcategory() {
        if (this.activeSubcategory === 'all') {
            this.showCurrentCategoryItems();
            return;
        }
        
        // Neue "Keine" Kategorie
        if (this.activeSubcategory === 'none') {
            this.filteredItems = [];
            this.renderResults();
            return;
        }

        // Get items from current category first
        const categoryItems = this.allItems.filter(item => 
            this.isItemInCategory(item, this.activeCategory)
        );

        // Then filter by subcategory
        const domainMap = {
            'lights': ['light', 'switch'],
            'climate': ['climate', 'fan'],
            'covers': ['cover'],
            'media': ['media_player']
        };

        const domains = domainMap[this.activeSubcategory] || [];
        this.filteredItems = categoryItems.filter(item => domains.includes(item.domain));
        
        this.renderResults();
    }

    renderResults() {
        const resultsGrid = this.shadowRoot.querySelector('.results-grid');
        
        // Clear any pending animations
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts = [];
        
        if (this.filteredItems.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">Keine Ergebnisse</div>
                    <div class="empty-subtitle">Versuchen Sie einen anderen Suchbegriff</div>
                </div>
            `;
            return;
        }

        resultsGrid.innerHTML = '';
        
        // Gruppiere nach Räumen
        const groupedItems = this.filteredItems.reduce((groups, item) => {
            const area = item.area || 'Ohne Raum';
            if (!groups[area]) {
                groups[area] = [];
            }
            groups[area].push(item);
            return groups;
        }, {});
        
        let cardIndex = 0;
        
        // Rendere gruppiert nach Räumen
        Object.keys(groupedItems).sort().forEach(area => {
            // Raum-Header
            const areaHeader = document.createElement('div');
            areaHeader.className = 'area-header';
            areaHeader.textContent = area;
            resultsGrid.appendChild(areaHeader);
            
            // Items in diesem Raum
            groupedItems[area].forEach((item) => {
                const card = this.createDeviceCard(item);
                resultsGrid.appendChild(card);
                
                // Only animate on first render or when category changes
                if (!this.hasAnimated) {
                    const timeout = setTimeout(() => {
                        this.animateElementIn(card, {
                            opacity: [0, 1],
                            transform: ['translateY(20px) scale(0.9)', 'translateY(0) scale(1)']
                        });
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
        
        card.innerHTML = `
            <div class="device-icon">${item.icon}</div>
            <div class="device-info">
                <div class="device-name">${item.name}</div>
                <div class="device-status">${this.getEntityStatus(this._hass.states[item.id])}</div>
            </div>
        `;
        
        card.addEventListener('click', () => this.handleDeviceClick(item, card));
        card.addEventListener('mouseenter', () => this.animateDeviceHover(card, true));
        card.addEventListener('mouseleave', () => this.animateDeviceHover(card, false));
        
        return card;
    }

    handleDeviceClick(item, card) {
        // Speichere aktuellen Zustand
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
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        
        this.isDetailView = true;
        
        // Animate out search panel
        searchPanel.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(-100%)' }
        ], {
            duration: 300,
            easing: 'ease-in',
            fill: 'forwards'
        }).finished.then(() => {
            searchPanel.style.display = 'none';
            detailPanel.classList.add('visible');
            
            // Animate in detail panel
            detailPanel.animate([
                { opacity: 0, transform: 'translateX(100%)' },
                { opacity: 1, transform: 'translateX(0)' }
            ], {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            });
        });
        
        this.renderDetailView();
    }

    handleBackClick() {
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        
        this.isDetailView = false;
        
        // Animate out detail panel
        detailPanel.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(100%)' }
        ], {
            duration: 300,
            easing: 'ease-in',
            fill: 'forwards'
        }).finished.then(() => {
            detailPanel.classList.remove('visible');
            searchPanel.style.display = 'block';
            
            // Restore previous state
            if (this.previousSearchState) {
                this.shadowRoot.querySelector('.search-input').value = this.previousSearchState.searchValue;
                this.activeCategory = this.previousSearchState.activeCategory;
                this.activeSubcategory = this.previousSearchState.activeSubcategory;
                this.filteredItems = this.previousSearchState.filteredItems;
                
                this.updateCategoryIcon();
                this.updatePlaceholder();
                this.renderResults();
            }
            
            // Animate in search panel
            searchPanel.animate([
                { opacity: 0, transform: 'translateX(-100%)' },
                { opacity: 1, transform: 'translateX(0)' }
            ], {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            });
        });
    }

    renderDetailView() {
        const detailLeft = this.shadowRoot.querySelector('.detail-left');
        const detailRight = this.shadowRoot.querySelector('.detail-right');
        const detailTitle = this.shadowRoot.querySelector('.detail-title');
        
        if (!this.currentDetailItem) return;
        
        const item = this.currentDetailItem;
        const state = this._hass.states[item.id];
        
        detailTitle.textContent = item.name;
        
        detailLeft.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">${item.icon}</div>
                <h3 style="margin: 0; color: var(--text-primary);">${item.name}</h3>
                <p style="margin: 8px 0 0 0; color: var(--text-secondary);">Raum: ${item.area}</p>
            </div>
        `;
        
        detailRight.innerHTML = `
            <div style="color: var(--text-primary);">
                <h4 style="margin: 0 0 16px 0;">Status</h4>
                <p style="margin: 0 0 8px 0;">Zustand: ${this.getEntityStatus(state)}</p>
                <p style="margin: 0 0 8px 0;">Entität: ${item.id}</p>
                <p style="margin: 0;">Typ: ${item.domain}</p>
            </div>
        `;
    }

    // Animation Helpers - Pure Web Animations API
    animateElementIn(element, keyframes, options = {}) {
        return element.animate(keyframes, {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
            ...options
        });
    }

    animateElementOut(element, options = {}) {
        return element.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.8)' }
        ], {
            duration: 200,
            easing: 'ease-in',
            fill: 'forwards',
            ...options
        });
    }

    animateDeviceHover(card, isHover) {
        card.animate([
            { 
                transform: isHover ? 'scale(1)' : 'scale(1.02)',
                filter: isHover ? 'brightness(1)' : 'brightness(1.05)'
            },
            { 
                transform: isHover ? 'scale(1.02)' : 'scale(1)',
                filter: isHover ? 'brightness(1.05)' : 'brightness(1)'
            }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    animateStateChange(card, isActive) {
        const icon = card.querySelector('.device-icon');
        
        // State change ripple effect
        card.animate([
            { boxShadow: '0 0 0 rgba(0, 122, 255, 0)' },
            { boxShadow: '0 0 20px rgba(0, 122, 255, 0.4)' },
            { boxShadow: '0 0 0 rgba(0, 122, 255, 0)' }
        ], {
            duration: 600,
            easing: 'ease-out'
        });
        
        // Icon pulse
        icon.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.2)' },
            { transform: 'scale(1)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
    }

    // Home Assistant Integration
    getCardSize() {
        return 4;
    }

    static getConfigElement() {
        return document.createElement('fast-search-card-editor');
    }

    static getStubConfig() {
        return {
            type: 'custom:fast-search-card',
            entities: [
                {
                    entity: 'light.example_light',
                    title: 'Beispiel Lampe'
                }
            ]
        };
    }
}

customElements.define('fast-search-card', FastSearchCard);

// Register with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Modern Apple Vision OS inspired search card'
});

console.info(
    `%c FAST-SEARCH-CARD %c Modern Vision OS Design `,
    'color: #007AFF; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: #007AFF'
);
