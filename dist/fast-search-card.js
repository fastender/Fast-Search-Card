class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // State
        this._hass = null;
        this._config = {};
        this.allItems = [];
        this.filteredItems = [];
        this.currentSearchType = 'entities';
        this.isSearching = false;
        this.searchValue = '';
        this.selectedFilters = new Set();
        this.isExpanded = false;
        this.isPanelExpanded = false;
        this.activeCategory = 'devices';
        this.activeSubcategory = 'all';
        this.isMenuView = false;
        this.isTyping = false;
        
        // Animation references
        this.animations = new Map();
    }

    setConfig(config) {
        if (!config.entities || !Array.isArray(config.entities)) {
            throw new Error('Entities configuration is required');
        }

        this._config = {
            title: 'Fast Search',
            show_unavailable: false,
            search_types: ['entities', 'automations', 'scripts', 'scenes'],
            default_search_type: 'entities',
            categories: ['all', 'lights', 'climate', 'covers', 'media'],
            entities: config.entities,
            ...config
        };
        
        this.currentSearchType = this._config.default_search_type;
        this.render();

        // Stelle sicher dass Panel initial collapsed ist
        setTimeout(() => {
            const searchPanel = this.shadowRoot.querySelector('.search-panel');
            searchPanel.classList.add('collapsed');
            const resultsContainer = this.shadowRoot.querySelector('.results-container');
            resultsContainer.style.display = 'none';
        }, 0);        
    }

    set hass(hass) {
        if (!hass) return;
        this._hass = hass;
        this.updateItems();
        this.updateDeviceStates();
    }

    render() {
        this.shadowRoot.innerHTML = `


            <style>
            :host {
                display: block;
                --vision-primary: rgba(10, 132, 255, 1);
                --vision-secondary: rgba(48, 209, 88, 1);
                --vision-surface: rgba(28, 28, 30, 0.68);
                --vision-surface-light: rgba(58, 58, 60, 0.4);
                --vision-text-primary: rgba(255, 255, 255, 0.95);
                --vision-text-secondary: rgba(255, 255, 255, 0.7);
                --vision-border: rgba(255, 255, 255, 0.15);
                --vision-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                --vision-blur: blur(20px);
            }
            
            .main-container {
                width: 100%;
                max-width: none;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .search-panel {
                background: 
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                    rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px) saturate(1.8);
                -webkit-backdrop-filter: blur(20px) saturate(1.8);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 24px;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
                overflow: hidden;
                transition: none;
                max-height: 72px;
                min-height: auto;
                position: relative;
                padding: 0px;
            }

            .search-content {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 14px 16px;
                width: 100%;
                box-sizing: border-box;
            }            

            .search-panel.collapsed {
                max-height: 72px;  /* Nur Searchbar sichtbar */
                overflow: hidden;
            }            
            
            .search-wrapper {
                flex: 1;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 0;
                position: relative;
                min-height: 48px;
                box-sizing: border-box;
                transition: none; /* KEINE CSS Transitions! */
            }

            .search-wrapper.shrunk {
                flex: 0 0 auto;
            }            
            
            .category-icon {
                order: 1;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: none;
            }
            
            .category-icon svg {
                width: 20px;
                height: 20px;
                fill: none;
                stroke: currentColor;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
                color: rgba(29, 29, 31, 0.7);
            }
            
            .searchbar-container {
                flex: 1;
                min-width: 0;
                order: 2;
                transition: none;
            }
            
            .searchbar {
                width: 100%;
                height: 44px;
                border: none;
                background: transparent;
                outline: none;
                font-size: 17px;
                color: rgba(29, 29, 31, 0.9);
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: block;
                visibility: visible;
            }
            
            .searchbar:focus {
                background: transparent;
            }
            
            .searchbar::placeholder {
                color: rgba(29, 29, 31, 0.6);
            }
            
            .close-icon {
                order: 3;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: none;
            }
            
            .close-icon.visible {
                opacity: 1;
                pointer-events: all;
            }
            
            .close-icon svg {
                width: 20px;
                height: 20px;
                stroke: rgba(29, 29, 31, 0.7);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            
            .filter-icon {
                order: 4;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .filter-icon svg {
                width: 20px;
                height: 20px;
                stroke: rgba(29, 29, 31, 0.7);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            
            .category-buttons {
                display: none;
                gap: 12px;
                flex-shrink: 0;
                overflow: hidden;
            }
                        
            .category-button {
                width: 52px;
                height: 52px;
                background: 
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                    rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px) saturate(1.8);
                -webkit-backdrop-filter: blur(20px) saturate(1.8);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
                transition: none;
                position: relative;
                overflow: hidden;
            }
            
            .category-button.active {
                border-width: 2px;
                background: 
                    linear-gradient(135deg, rgba(0, 122, 255, 0.4) 0%, rgba(0, 122, 255, 0.2) 100%),
                    rgba(0, 122, 255, 0.3);
                border-color: rgba(0, 122, 255, 0.6);
                box-shadow: 
                    0 8px 32px rgba(0, 122, 255, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.5);
            }
            
            .category-button svg {
                width: 24px;
                height: 24px;
                fill: none;
                stroke: currentColor;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            
            .category-button.active svg {
                color: white;
            }
            
            .subcategories {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                overflow-x: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            
            .subcategories::-webkit-scrollbar {
                display: none;
            }
            
            .subcategory-chip {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                color: rgba(29, 29, 31, 0.8);
                cursor: pointer;
                white-space: nowrap;
                transition: none;
            }
            
            .subcategory-chip.active {
                background: rgba(0, 122, 255, 0.3);
                border-color: rgba(0, 122, 255, 0.4);
                color: #007AFF;
            }
            
            .results-container {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 350px;
                overflow-y: auto;
            }
            
            .room-section {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .room-header {
                font-size: 16px;
                font-weight: 700;
                color: #1d1d1f;
                margin: 0;
                letter-spacing: -0.02em;
            }
            
            .devices-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
            }
            
            .device-card {
                background: rgba(255, 255, 255, 0.4);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                padding: 12px;
                cursor: pointer;
                transition: none;
                position: relative;
                overflow: hidden;
                aspect-ratio: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            .device-card.active {
                background: rgba(0, 122, 255, 0.2);
                border-color: rgba(0, 122, 255, 0.4);
                box-shadow: 0 4px 16px rgba(0, 122, 255, 0.2);
            }
            
            .device-icon {
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                margin-bottom: auto;
            }
            
            .device-card.active .device-icon {
                background: rgba(0, 122, 255, 0.3);
                color: #007AFF;
            }
            
            .device-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .device-name {
                font-size: 12px;
                font-weight: 600;
                color: #1d1d1f;
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .device-status {
                font-size: 10px;
                color: rgba(29, 29, 31, 0.6);
                margin: 0;
            }
            
            .device-card.active .device-status {
                color: #007AFF;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: rgba(29, 29, 31, 0.6);
            }
            
            .empty-icon {
                font-size: 32px;
                margin-bottom: 12px;
                opacity: 0.5;
            }
            
            .empty-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 6px;
                color: #1d1d1f;
            }
            
            .empty-subtitle {
                font-size: 12px;
                line-height: 1.4;
            }
            
            /* Focus Ring Animation for Panel */
            .search-panel::before {
                display: none;
            }
            
            .search-panel.focused::before {
                display: none;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .search-wrapper {
                    gap: 12px;
                    padding: 14px 16px;
                }
                
                .category-buttons {
                    gap: 8px;
                }
                
                .category-button {
                    width: 46px;
                    height: 46px;
                }
                
                .category-button svg {
                    width: 20px;
                    height: 20px;
                }
                
                .searchbar {
                    font-size: 16px;
                }
                
                .category-icon svg,
                .close-icon svg,
                .filter-icon svg {
                    width: 20px;
                    height: 20px;
                }
                
                .subcategories {
                    padding: 10px 16px;
                }
                
                .results-container {
                    padding: 12px 16px;
                }
                
                .devices-grid {
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 8px;
                }
            }
            </style>

            <div class="main-container">
                <div class="search-panel collapsed">
                    <div class="search-content"> <!-- NEUER CONTAINER! -->
                        <div class="search-wrapper">
                            <div class="category-icon category-devices">
                                <svg viewBox="0 0 24 24">
                                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                                    <path d="M12 18h.01"/>
                                </svg>
                            </div>
                            
                            <div class="searchbar-container">
                                <input 
                                    type="text" 
                                    class="searchbar" 
                                    placeholder="Geräte suchen..."
                                    autocomplete="off"
                                    spellcheck="false"
                                >
                            </div>
                            
                            <div class="close-icon">
                                <svg viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </div>
            
                            <div class="filter-icon">
                                <svg viewBox="0 0 24 24">
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
                        </div> <!-- search-wrapper Ende -->
                        
                        <!-- Category Buttons AUSSERHALB! -->
                        <div class="category-buttons">
                            <button class="category-button category-devices" data-category="devices" title="Geräte">
                                <svg viewBox="0 0 24 24">
                                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                                    <path d="M12 18h.01"/>
                                </svg>
                            </button>
                            
                            <button class="category-button category-scripts" data-category="scripts" title="Skripte">
                                <svg viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10,9 9,9 8,9"/>
                                </svg>
                            </button>
                            
                            <button class="category-button category-automations" data-category="automations" title="Automationen">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2v6l3-3 3 3"/>
                                    <path d="M12 18v4"/>
                                    <path d="M8 8v8"/>
                                    <path d="M16 8v8"/>
                                    <circle cx="12" cy="12" r="2"/>
                                </svg>
                            </button>
                            
                            <button class="category-button category-scenes" data-category="scenes" title="Szenen">
                                <svg viewBox="0 0 24 24">
                                    <path d="M2 3h6l2 13 13-13v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
                                    <path d="M8 3v4"/>
                                    <path d="M16 8v4"/>
                                </svg>
                            </button>
                        </div>
                    </div> <!-- search-content Ende -->
            
                    <div class="subcategories">
                        <div class="subcategory-chip active" data-subcategory="all">Alle</div>
                        <div class="subcategory-chip" data-subcategory="lights">Lichter</div>
                        <div class="subcategory-chip" data-subcategory="climate">Klima</div>
                        <div class="subcategory-chip" data-subcategory="covers">Rollos</div>
                        <div class="subcategory-chip" data-subcategory="media">Medien</div>
                    </div>
            
                    <div class="results-container">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const searchbar = this.shadowRoot.querySelector('.searchbar');
        const categoryIcon = this.shadowRoot.querySelector('.category-icon');
        const closeIcon = this.shadowRoot.querySelector('.close-icon');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        const categoryButtonsList = this.shadowRoot.querySelectorAll('.category-button');
        const subcategoryChips = this.shadowRoot.querySelectorAll('.subcategory-chip');

        // Focus Events
        searchbar.addEventListener('focus', () => this.onFocus());
        searchbar.addEventListener('blur', () => this.onBlur());
        
        // Input Events
        searchbar.addEventListener('input', (e) => this.onInput(e));
        
        // Expand panel on any interaction
        searchbar.addEventListener('click', () => this.expandPanel());
        categoryIcon.addEventListener('click', () => {
            if (!this.isMenuView) {
                // Panel ist geschlossen - öffne Kategorie-Auswahl
                this.showCategoryButtons();
            } else {
                // Kategorie-Buttons sind sichtbar - schließe sie
                this.hideCategoryButtons();
            }
        });

        
        // Close Icon Click
        closeIcon.addEventListener('click', () => this.onCloseClick());
        
        // Filter Icon Click
        filterIcon.addEventListener('click', () => this.onFilterClick());

        // Category Button Events
        categoryButtonsList.forEach(button => {
            button.addEventListener('click', () => this.onCategoryButtonSelect(button));
            button.addEventListener('mouseenter', () => this.animateButtonHover(button, true));
            button.addEventListener('mouseleave', () => this.animateButtonHover(button, false));
        });

        // Subcategory Events
        subcategoryChips.forEach(chip => {
            chip.addEventListener('click', (event) => this.onSubcategorySelect(chip, event));
        });

        document.addEventListener('click', (e) => {
            const searchWrapper = e.target.closest('.search-wrapper');
            const searchPanel = e.target.closest('.search-panel');
            
            if (!searchWrapper && !searchPanel) {
                if (this.isMenuView) {
                    this.hideCategoryButtons();
                }
                // Panel bleibt offen wenn bereits expandiert
            }
        });
    }

    updateItems() {
        if (!this._hass || !this._config.entities) return;

        this.allItems = [];

        // Process configured entities
        this._config.entities.forEach(entityConfig => {
            const entityId = entityConfig.entity;
            const state = this._hass.states[entityId];
            
            if (!state) return;

            const domain = entityId.split('.')[0];
            const item = {
                id: entityId,
                name: entityConfig.title || state.attributes.friendly_name || entityId,
                area: entityConfig.area || state.attributes.area || 'Unassigned',
                category: entityConfig.category || this.categorizeEntity(domain),
                domain: domain,
                state: state.state,
                attributes: state.attributes,
                icon: this.getEntityIcon(entityId, state),
                isActive: this.isEntityActive(state)
            };

            this.allItems.push(item);
        });

        this.renderResults();
    }

    updateDeviceStates() {
        if (!this._hass) return;

        const deviceCards = this.shadowRoot.querySelectorAll('.device-card');
        deviceCards.forEach(card => {
            const entityId = card.dataset.entity;
            const state = this._hass.states[entityId];
            
            if (state) {
                const isActive = this.isEntityActive(state);
                card.classList.toggle('active', isActive);
                
                const statusElement = card.querySelector('.device-status');
                if (statusElement) {
                    statusElement.textContent = this.getEntityStatus(state);
                }
            }
        });
    }

    renderResults() {
        const resultsContainer = this.shadowRoot.querySelector('.results-container');
        
        if (this.allItems.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">Keine Geräte gefunden</div>
                    <div class="empty-subtitle">Überprüfen Sie Ihre Konfiguration</div>
                </div>
            `;
            return;
        }

        // Group items by area
        const groupedItems = this.groupItemsByArea(this.filteredItems.length > 0 ? this.filteredItems : this.allItems);
        
        resultsContainer.innerHTML = '';
        
        Object.keys(groupedItems).forEach(area => {
            const roomSection = document.createElement('div');
            roomSection.className = 'room-section';
            
            const roomHeader = document.createElement('h2');
            roomHeader.className = 'room-header';
            roomHeader.textContent = area;
            
            const devicesGrid = document.createElement('div');
            devicesGrid.className = 'devices-grid';
            
            groupedItems[area].forEach(item => {
                const deviceCard = this.createDeviceCard(item);
                devicesGrid.appendChild(deviceCard);
            });
            
            roomSection.appendChild(roomHeader);
            roomSection.appendChild(devicesGrid);
            resultsContainer.appendChild(roomSection);
        });
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
        
        card.addEventListener('click', () => this.onDeviceClick(item));
        card.addEventListener('mouseenter', () => this.animateDeviceHover(card, true));
        card.addEventListener('mouseleave', () => this.animateDeviceHover(card, false));
        
        return card;
    }

    groupItemsByArea(items) {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.area]) {
                grouped[item.area] = [];
            }
            grouped[item.area].push(item);
        });
        return grouped;
    }

    categorizeEntity(domain) {
        const categoryMap = {
            light: 'lights',
            switch: 'lights',
            climate: 'climate',
            cover: 'covers',
            media_player: 'media',
            fan: 'climate',
            sensor: 'sensors',
            binary_sensor: 'sensors'
        };
        return categoryMap[domain] || 'other';
    }

    getEntityIcon(entityId, state) {
        const domain = entityId.split('.')[0];
        const iconMap = {
            light: '💡',
            switch: '🔌',
            climate: '🌡️',
            cover: '🪟',
            media_player: '🎵',
            fan: '💨',
            sensor: '📊',
            binary_sensor: '🔘'
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
                        return `An • ${percent}%`;
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
                    return `${state.state} • ${position}%`;
                }
                return state.state === 'open' ? 'Offen' : 'Geschlossen';
                
            case 'media_player':
                if (state.state === 'playing') {
                    return 'Spielt';
                } else if (state.state === 'paused') {
                    return 'Pausiert';
                }
                return 'Aus';
                
            default:
                return state.state === 'on' ? 'An' : 'Aus';
        }
    }

    // Event Handlers
    expandPanel() {
        if (this.isPanelExpanded || this.isMenuView) return;  // Nicht expandieren im Menu View
        
        if (this.isPanelExpanded) return;
        
        this.isPanelExpanded = true;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        searchPanel.classList.add('expanded');
        
        // Smooth panel expansion animation
        searchPanel.animate([
            { maxHeight: '80px' },
            { maxHeight: '400px' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });

        console.log('Panel expanded - Spotlight mode');
    }

    collapsePanel() {
        if (!this.isPanelExpanded) return;
        
        this.isPanelExpanded = false;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const resultsContainer = this.shadowRoot.querySelector('.results-container');
        
        // Panel verkleinern
        searchPanel.animate([
            { maxHeight: '300px' },
            { maxHeight: '60px' }
        ], {
            duration: 400,
            easing: 'ease-in-out',
            fill: 'forwards'
        }).finished.then(() => {
            searchPanel.classList.remove('expanded');
        });
        
        // Results verstecken
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
        
        console.log('Panel collapsed');
    }

    hideResults() {
        const resultsContainer = this.shadowRoot.querySelector('.results-container');
        const subcategories = this.shadowRoot.querySelector('.subcategories');
        
        // Results verstecken
        if (resultsContainer) {
            resultsContainer.animate([
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-10px)' }
            ], {
                duration: 200,
                easing: 'ease-in',
                fill: 'forwards'
            }).finished.then(() => {
                resultsContainer.style.display = 'none';
            });
        }
        
        // Subcategories auch verstecken
        if (subcategories) {
            subcategories.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration: 200,
                easing: 'ease-in',
                fill: 'forwards'
            }).finished.then(() => {
                subcategories.style.display = 'none';
            });
        }
        
        console.log('Results and subcategories hidden');
    }

    onCategoryButtonSelect(button) {
        const category = button.dataset.category;
        
        // Setze aktive Kategorie
        this.setActiveCategory(category);
        
        // Schließe Category Buttons
        this.hideCategoryButtons();
        
        // Expandiere Panel und zeige Ergebnisse
        setTimeout(() => {
            const searchPanel = this.shadowRoot.querySelector('.search-panel');
            searchPanel.classList.remove('collapsed');
            this.isPanelExpanded = true;
            this.expandPanel();
            this.showCategoryResults(category);
        }, 400);
    }

    expandSearchbar() {
        const searchWrapper = this.shadowRoot.querySelector('.search-wrapper');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        
        // Suchleiste wieder vergrößern
        searchWrapper.animate([
            { width: '60%' },
            { width: '100%' }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        // Filter Icon wieder anzeigen
        filterIcon.style.display = 'flex';
        filterIcon.animate([
            { opacity: 0, transform: 'scale(0.8)' },
            { opacity: 1, transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
        
        console.log('Searchbar expanded');
    }    

    showCategoryResults(category) {
        const resultsContainer = this.shadowRoot.querySelector('.results-container');
        
        // Filter items basierend auf Kategorie
        this.filterByCategory(category);
        
        // Results Container wieder anzeigen
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            resultsContainer.animate([
                { opacity: 0, transform: 'translateY(-10px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            });
        }
        
        this.isMenuView = false;
        console.log(`Showing results for category: ${category}`);
    }
    
    filterByCategory(category) {
        if (category === 'devices') {
            // Alle Entities außer Scripts, Automations, Scenes
            this.filteredItems = this.allItems.filter(item => {
                return !['script', 'automation', 'scene'].includes(item.domain);
            });
        } else if (category === 'scripts') {
            this.filteredItems = this.allItems.filter(item => item.domain === 'script');
        } else if (category === 'automations') {
            this.filteredItems = this.allItems.filter(item => item.domain === 'automation');
        } else if (category === 'scenes') {
            this.filteredItems = this.allItems.filter(item => item.domain === 'scene');
        } else {
            // Default: alle anzeigen
            this.filteredItems = this.allItems;
        }
        
        this.renderResults();
        console.log(`Filtered by category ${category}: ${this.filteredItems.length} items`);
    }        

    onFocus() {
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        searchPanel.classList.add('focused');

        // Nur expandieren wenn nicht im Menu View
        if (!this.isMenuView) {
            this.expandPanel();
        }
        
        this.expandPanel();
        
        // Focus animation
        searchPanel.animate([
            { 
                transform: 'scale(1)',
                filter: 'brightness(1)'
            },
            { 
                transform: 'scale(1.01)',
                filter: 'brightness(1.02)'
            },
            { 
                transform: 'scale(1)',
                filter: 'brightness(1)'
            }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
    }

    onBlur() {
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const searchbar = this.shadowRoot.querySelector('.searchbar');
        
        // Don't collapse immediately - let user interact with results
        setTimeout(() => {
            if (!searchPanel.contains(document.activeElement) && 
                !searchbar.value.trim()) {
                searchPanel.classList.remove('focused');
                this.collapsePanel();
            }
        }, 150);
    }

    onInput(e) {
        const value = e.target.value;
        const closeIcon = this.shadowRoot.querySelector('.close-icon');
        
        if (value.length > 0 && !this.isTyping) {
            this.isTyping = true;
            this.showCloseIcon();
        } else if (value.length === 0 && this.isTyping) {
            this.isTyping = false;
            this.hideCloseIcon();
        }
        
        this.animateTypingFeedback();
        this.performSearch(value);
    }

    performSearch(query) {
        const searchTerm = query.trim().toLowerCase();
        
        console.log('🔍 Searching for:', searchTerm);
        console.log('📦 All items count:', this.allItems.length);
        console.log('📦 All items:', this.allItems);
        
        if (searchTerm.length === 0) {
            this.showAllDevices();
            return;
        }
        
        // Filter items basierend auf Search Query
        this.filteredItems = this.allItems.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm);
            const areaMatch = item.area.toLowerCase().includes(searchTerm);
            const idMatch = item.id.toLowerCase().includes(searchTerm);
            
            const match = nameMatch || areaMatch || idMatch;
            
            if (match) {
                console.log('✅ Match found:', {
                    name: item.name,
                    area: item.area,
                    id: item.id,
                    matchType: nameMatch ? 'name' : areaMatch ? 'area' : 'id'
                });
            }
            
            return match;
        });
        
        // Results anzeigen
        this.renderResults();
        
        console.log(`Search for "${searchTerm}" returned ${this.filteredItems.length} results`);
        console.log('📋 Filtered results:', this.filteredItems);
    }

    showAllDevices() {
        // Alle Devices der aktuellen Kategorie anzeigen
        this.filteredItems = this.allItems.filter(item => {
            if (this.activeCategory === 'devices') {
                return item.type && item.type !== 'script' && item.type !== 'automation' && item.type !== 'scene';
            } else if (this.activeCategory === 'scripts') {
                return item.type === 'script';
            } else if (this.activeCategory === 'automations') {
                return item.type === 'automation';
            } else if (this.activeCategory === 'scenes') {
                return item.type === 'scene';
            }
            return true;
        });
        
        this.renderResults();
        
        console.log(`Showing all ${this.activeCategory}: ${this.filteredItems.length} items`);
    }    

    showCloseIcon() {
        const closeIcon = this.shadowRoot.querySelector('.close-icon');
        closeIcon.classList.add('visible');
        closeIcon.animate([
            { 
                opacity: 0,
                transform: 'scale(0.8)'
            },
            { 
                opacity: 1,
                transform: 'scale(1)'
            }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    hideCloseIcon() {
        const closeIcon = this.shadowRoot.querySelector('.close-icon');
        closeIcon.animate([
            { 
                opacity: 1,
                transform: 'scale(1)'
            },
            { 
                opacity: 0,
                transform: 'scale(0.8)'
            }
        ], {
            duration: 200,
            easing: 'ease-in',
            fill: 'forwards'
        }).finished.then(() => {
            closeIcon.classList.remove('visible');
        });
    }

    animateTypingFeedback() {
        const searchbar = this.shadowRoot.querySelector('.searchbar');
        searchbar.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.005)' },
            { transform: 'scale(1)' }
        ], {
            duration: 150,
            easing: 'ease-out'
        });
    }

    onCloseClick() {
        const searchbar = this.shadowRoot.querySelector('.searchbar');
        searchbar.value = '';
        this.isTyping = false;
        this.hideCloseIcon();
        this.showAllDevices();
        
        // Focus zurück auf Searchbar
        setTimeout(() => {
            searchbar.focus();
        }, 100);
    }

    onFilterClick() {
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        
        // Filter Icon Animation
        filterIcon.animate([
            { transform: 'rotate(0deg) scale(1)' },
            { transform: 'rotate(90deg) scale(1.1)' },
            { transform: 'rotate(0deg) scale(1)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        
        console.log('Filter clicked');
    }    

    showCategoryButtons() {
        const searchWrapper = this.shadowRoot.querySelector('.search-wrapper');
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        
        this.isMenuView = true;
        
        // 1. Filter Icon verstecken
        filterIcon.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: 200,
            fill: 'forwards'
        }).finished.then(() => {
            filterIcon.style.display = 'none';
        });
        
        // 2. Search-wrapper verkleinern
        searchWrapper.animate([
            { flex: '1 1 auto' },
            { flex: '0 0 auto' }
        ], {
            duration: 400,
            fill: 'forwards',
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        
        // 3. Category Buttons einblenden
        categoryButtons.style.display = 'flex';
        categoryButtons.animate([
            { 
                opacity: 0,
                width: '0px',
                transform: 'translateX(-20px)'
            },
            { 
                opacity: 1,
                width: '240px',
                transform: 'translateX(0)'
            }
        ], {
            duration: 400,
            delay: 200,
            fill: 'forwards',
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        
        // 4. Buttons einzeln animieren
        const buttons = categoryButtons.querySelectorAll('.category-button');
        buttons.forEach((button, index) => {
            button.animate([
                { opacity: 0, transform: 'scale(0.5)' },
                { opacity: 1, transform: 'scale(1)' }
            ], {
                duration: 300,
                delay: 300 + (index * 50),
                fill: 'forwards'
            });
        });
    }
    
    hideCategoryButtons() {
        const searchWrapper = this.shadowRoot.querySelector('.search-wrapper');
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        
        // 1. Buttons ausblenden
        categoryButtons.animate([
            { 
                opacity: 1,
                width: '240px',
                transform: 'translateX(0)'
            },
            { 
                opacity: 0,
                width: '0px',
                transform: 'translateX(-20px)'
            }
        ], {
            duration: 300,
            fill: 'forwards',
            easing: 'ease-in'
        }).finished.then(() => {
            categoryButtons.style.display = 'none';
            this.isMenuView = false;
        });
        
        // 2. Search-wrapper wieder vergrößern
        searchWrapper.animate([
            { flex: '0 0 auto' },
            { flex: '1 1 auto' }
        ], {
            duration: 400,
            fill: 'forwards',
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        // 3. Filter Icon wieder zeigen
        filterIcon.style.display = 'flex';
        filterIcon.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: 300,
            delay: 200,
            fill: 'forwards'
        });
    }

    

    onCategorySelect(button) {
        const category = button.dataset.category;
        
        if (category === this.activeCategory) {
            this.collapseButtons();
            return;
        }
        
        this.setActiveCategory(category);
        
        setTimeout(() => {
            this.collapseButtons();
        }, 200);
    }
    
    setActiveCategory(category) {
        // Remove old active state
        const oldButton = this.shadowRoot.querySelector(`.category-button[data-category="${this.activeCategory}"]`);
        if (oldButton) {
            oldButton.classList.remove('active');
        }
        
        // Set new active state
        this.activeCategory = category;
        const newButton = this.shadowRoot.querySelector(`.category-button[data-category="${category}"]`);
        if (newButton) {
            newButton.classList.add('active');
            this.animateButtonActivate(newButton);
        }
        
        // Update UI
        this.updateCategoryIcon();
        this.updatePlaceholder();
        
        console.log(`Switched to category: ${category}`);
    }

    updateCategoryIcon() {
        const categoryData = {
            devices: {
                icon: `<svg viewBox="0 0 24 24">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                    <path d="M12 18h.01"/>
                </svg>`,
                placeholder: 'Geräte suchen...'
            },
            scripts: {
                icon: `<svg viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>`,
                placeholder: 'Skripte suchen...'
            },
            automations: {
                icon: `<svg viewBox="0 0 24 24">
                    <path d="M12 2v6l3-3 3 3"/>
                    <path d="M12 18v4"/>
                    <path d="M8 8v8"/>
                    <path d="M16 8v8"/>
                    <circle cx="12" cy="12" r="2"/>
                </svg>`,
                placeholder: 'Automationen suchen...'
            },
            scenes: {
                icon: `<svg viewBox="0 0 24 24">
                    <path d="M2 3h6l2 13 13-13v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
                    <path d="M8 3v4"/>
                    <path d="M16 8v4"/>
                </svg>`,
                placeholder: 'Szenen suchen...'
            }
        };

        const data = categoryData[this.activeCategory];
        if (data) {
            const categoryIcon = this.shadowRoot.querySelector('.category-icon');
            categoryIcon.innerHTML = data.icon;
            categoryIcon.className = `category-icon category-${this.activeCategory}`;
        }
    }

    updatePlaceholder() {
        const categoryData = {
            devices: 'Geräte suchen...',
            scripts: 'Skripte suchen...',
            automations: 'Automationen suchen...',
            scenes: 'Szenen suchen...'
        };
        
        const searchbar = this.shadowRoot.querySelector('.searchbar');
        searchbar.placeholder = categoryData[this.activeCategory] || 'Suchen...';
    }

    onSubcategorySelect(chip, event) {
        const subcategory = chip.dataset.subcategory;
        
        // Event Propagation stoppen
        if (event) event.stopPropagation();
        
        if (subcategory === this.activeSubcategory) return;
        
        // Update active state
        this.shadowRoot.querySelector('.subcategory-chip.active').classList.remove('active');
        chip.classList.add('active');
        this.activeSubcategory = subcategory;
        
        // Animate chip selection
        chip.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(1.05)', filter: 'brightness(1.1)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], {
            duration: 200,
            easing: 'ease-out'
        });
        
        // Filter entities basierend auf Domain
        this.filterByDomain(subcategory);
        
        console.log(`Selected subcategory: ${subcategory}`);
    }

    filterByDomain(subcategory) {
        if (subcategory === 'all') {
            this.filteredItems = [...this.allItems];  // ← KOPIE erstellen
        } else {
            const domainMap = {
                'lights': ['light', 'switch'],      // ← lights UND switches
                'climate': ['climate'],
                'covers': ['cover'],
                'media': ['media_player']
            };
            
            const domains = domainMap[subcategory] || [];
            this.filteredItems = this.allItems.filter(item => {
                console.log(`Checking item: ${item.name}, domain: ${item.domain}, subcategory: ${subcategory}`);
                return domains.includes(item.domain);
            });
        }
        
        console.log(`🔍 filterByDomain(${subcategory}): ${this.filteredItems.length} items found`);
        this.renderResults();
    }
    
    onDeviceClick(item) {
        // Fire Home Assistant event
        this._hass.callService('homeassistant', 'toggle', {
            entity_id: item.id
        });
        
        console.log(`Device clicked: ${item.id}`);
    }

    animateButtonHover(button, isHover) {
        if (button.classList.contains('active')) return;
        
        button.animate([
            { 
                transform: isHover ? 'scale(1)' : 'scale(1.05)',
                filter: isHover ? 'brightness(1)' : 'brightness(1.1)'
            },
            { 
                transform: isHover ? 'scale(1.05)' : 'scale(1)',
                filter: isHover ? 'brightness(1.1)' : 'brightness(1)'
            }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    animateButtonActivate(button) {
        button.animate([
            { 
                transform: 'scale(1)',
                filter: 'brightness(1)'
            },
            { 
                transform: 'scale(1.15)',
                filter: 'brightness(1.2)'
            },
            { 
                transform: 'scale(1)',
                filter: 'brightness(1)'
            }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
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

    filterDevicesBySubcategory(subcategory) {
        if (subcategory === 'all') {
            this.filteredItems = [];
        } else {
            this.filteredItems = this.allItems.filter(item => item.category === subcategory);
        }
        this.renderResults();
    }

    performSearch(query) {
        if (!query.trim()) {
            this.filteredItems = [];
            this.renderResults();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        this.filteredItems = this.allItems.filter(item => {
            return item.name.toLowerCase().includes(searchTerm) ||
                   item.area.toLowerCase().includes(searchTerm) ||
                   item.id.toLowerCase().includes(searchTerm);
        });
        
        this.renderResults();
    }

    showAllDevices() {
        this.filteredItems = [];
        this.renderResults();
    }

    getCardSize() {
        return 3;
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
                    title: 'Beispiel Lampe',
                    area: 'Wohnzimmer',
                    category: 'lights'
                }
            ]
        };
    }
}

customElements.define('fast-search-card', FastSearchCard);

// Register with custom cards registry
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Apple Vision OS Spotlight-style search card for Home Assistant'
});

console.info(
    `%c FAST-SEARCH-CARD %c Vision OS Spotlight `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);
