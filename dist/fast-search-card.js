class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
        this.config = config;
        
        // Validierung der Konfiguration
        if (!config) {
            throw new Error('Konfiguration ist erforderlich');
        }
        
        // Entities können entweder als Array oder automatisch geladen werden
        this.useManualEntities = config.entities && Array.isArray(config.entities);
        
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        this.updateItems();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .search-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .search-section {
                    background: #f8f9fa;
                    padding: 20px 20px 0 20px;
                }

                .search-container-inner {
                    position: relative;
                    margin-bottom: 20px;
                }

                .search-header {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 12px;
                    justify-content: space-between;
                    align-items: center;
                }

                .view-toggle {
                    display: flex;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .view-button {
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                    background: transparent;
                    color: #666;
                }

                .view-button:hover {
                    background: #f5f5f5;
                }

                .view-button.active {
                    background: #007aff;
                    color: white;
                }

                .view-button svg {
                    width: 20px;
                    height: 20px;
                }

                .search-type-dropdown {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 14px;
                    color: #666;
                    cursor: pointer;
                    min-width: 120px;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 8px center;
                    background-repeat: no-repeat;
                    background-size: 16px;
                    padding-right: 32px;
                }

                .search-type-dropdown:focus {
                    outline: 2px solid #007aff;
                    border-color: #007aff;
                }

                .search-input-container {
                    position: relative;
                    flex: 1;
                }

                .search-input {
                    width: 100%;
                    padding: 15px 15px 60px 15px;
                    border: none;
                    font-size: 18px;
                    outline: none;
                    background: white;
                    border-radius: 8px;
                    box-sizing: border-box;
                }

                .search-input::placeholder {
                    color: #999;
                }

                .room-chips-in-search {
                    position: absolute;
                    bottom: 12px;
                    left: 15px;
                    right: 15px;
                    display: flex;
                    gap: 6px;
                    overflow-x: auto;
                    padding: 2px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .room-chips-in-search::-webkit-scrollbar {
                    display: none;
                }

                .room-chip-small {
                    padding: 4px 12px;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    font-size: 12px;
                    color: #666;
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.2s;
                    user-select: none;
                }

                .room-chip-small:hover {
                    background: #e9ecef;
                }

                .room-chip-small.active {
                    background: #007aff;
                    color: white;
                    border-color: #007aff;
                }

                .filter-section {
                    margin-bottom: 20px;
                }

                .filter-row {
                    margin-bottom: 12px;
                    position: relative;
                }

                .filter-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .filter-scroll {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 4px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .filter-scroll::-webkit-scrollbar {
                    display: none;
                }

                .filter-chip {
                    padding: 12px 16px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    font-size: 14px;
                    color: #666;
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.2s;
                    user-select: none;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    text-align: left;
                    min-width: 90px;
                }

                .filter-chip:hover {
                    background: #f5f5f5;
                    border-color: #ccc;
                }

                .filter-chip.active {
                    background: #007aff;
                    color: white;
                    border-color: #007aff;
                }

                .filter-chip.all {
                    background: #f8f9fa;
                    border-color: #e9ecef;
                    min-width: auto;
                }

                .filter-chip.all.active {
                    background: #6c757d;
                    border-color: #6c757d;
                    color: white;
                }

                .chip-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .chip-content {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .chip-type-name {
                    font-weight: 500;
                    line-height: 1.2;
                }

                .chip-count {
                    font-size: 11px;
                    opacity: 0.8;
                    margin-top: 2px;
                    line-height: 1;
                }

                .results-container {
                    max-height: 600px;
                    overflow-y: auto;
                }

                .room-group {
                    margin-bottom: 24px;
                }

                .room-header {
                    padding: 12px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    font-weight: 600;
                    font-size: 14px;
                    color: #495057;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .item {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: background-color 0.2s;
                    margin-left: 0;
                    cursor: pointer;
                }

                .item:hover {
                    background-color: #fafafa;
                }

                .item:last-child {
                    border-bottom: none;
                }

                .room-group:last-child .item:last-child {
                    border-bottom: none;
                }

                .item-icon {
                    font-size: 24px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .item-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .item-name {
                    font-weight: 500;
                    font-size: 16px;
                    color: #333;
                }

                .item-state {
                    font-size: 14px;
                    color: #888;
                }

                .item-description {
                    font-size: 12px;
                    color: #aaa;
                    margin-top: 2px;
                }

                .no-results {
                    padding: 40px 20px;
                    text-align: center;
                    color: #999;
                    font-style: italic;
                }

                .config-error {
                    padding: 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    color: #856404;
                    margin: 10px;
                }

                .action-buttons {
                    display: flex;
                    gap: 8px;
                    margin-left: auto;
                }

                .action-button {
                    padding: 6px 12px;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #666;
                }

                .action-button:hover {
                    background: #e9ecef;
                    color: #333;
                }

                .action-button.primary {
                    background: #007aff;
                    color: white;
                    border-color: #007aff;
                }

                .action-button.primary:hover {
                    background: #0056b3;
                    border-color: #0056b3;
                }

                /* Grid View Styles */
                .grid-container {
                    padding: 20px;
                }

                .room-grid-section {
                    margin-bottom: 32px;
                }

                .room-grid-header {
                    font-weight: 600;
                    font-size: 14px;
                    color: #495057;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                    padding: 0 4px;
                }

                .grid-scroll-container {
                    position: relative;
                    overflow: hidden;
                }

                .grid-items {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding: 4px;
                    scroll-behavior: smooth;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .grid-items::-webkit-scrollbar {
                    display: none;
                }

                .grid-item {
                    flex: 0 0 calc(50% - 8px);
                    min-width: 160px;
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 16px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .grid-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border-color: #007aff;
                }

                .grid-item-icon {
                    font-size: 36px;
                    margin-bottom: 12px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .grid-item-name {
                    font-weight: 500;
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 4px;
                    line-height: 1.2;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .grid-item-state {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 8px;
                }

                .grid-item-actions {
                    margin-top: auto;
                    width: 100%;
                }

                .grid-action-button {
                    width: 100%;
                    padding: 8px;
                    background: #007aff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .grid-action-button:hover {
                    background: #0056b3;
                }

                .grid-action-button.secondary {
                    background: #f8f9fa;
                    color: #666;
                    border: 1px solid #e9ecef;
                    margin-top: 6px;
                }

                .grid-action-button.secondary:hover {
                    background: #e9ecef;
                }

                /* State indicators for grid */
                .grid-item.state-on {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border-color: #0ea5e9;
                }

                .grid-item.state-active {
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border-color: #22c55e;
                }

                .grid-item.state-playing {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-color: #f59e0b;
                }

                /* Scroll indicators */
                .scroll-indicator {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 32px;
                    height: 32px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s;
                }

                .scroll-indicator:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .scroll-indicator.left {
                    left: -16px;
                }

                .scroll-indicator.right {
                    right: -16px;
                }

                .scroll-indicator.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .scroll-indicator svg {
                    width: 16px;
                    height: 16px;
                    stroke: #666;
                }
            </style>
            
            <div class="search-container">
                <div class="search-section">
                    <div class="search-header">
                        <select class="search-type-dropdown" id="searchTypeDropdown">
                            <option value="entities">🏠 Geräte</option>
                            <option value="automations">🤖 Automationen</option>
                            <option value="scripts">📜 Skripte</option>
                            <option value="scenes">🎭 Szenen</option>
                        </select>
                        <div class="view-toggle">
                            <div class="view-button active" data-view="list" title="Listenansicht">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </div>
                            <div class="view-button" data-view="grid" title="Kachelansicht">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="search-container-inner">
                        <div class="search-input-container">
                            <input type="text" class="search-input" placeholder="Suchen..." id="searchInput">
                            <div class="room-chips-in-search" id="roomChipsInSearch">
                                <div class="room-chip-small active" data-value="">Alle</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <div class="filter-row">
                            <div class="filter-label" id="filterLabel">Kategorien</div>
                            <div class="filter-scroll" id="typeFilterChips">
                                <div class="filter-chip all active" data-value="">Alle</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="results-container" id="resultsContainer">
                    <div class="no-results" id="noResults">Wählen Sie eine Kategorie und geben Sie einen Suchbegriff ein...</div>
                </div>
            </div>
        `;

        this.initializeCard();
    }

    initializeCard() {
        this.allItems = [];
        this.currentSearchType = 'entities';
        this.selectedRooms = new Set();
        this.selectedType = '';
        this.currentView = 'list'; // Neue Eigenschaft für die aktuelle Ansicht
        
        // Definitionen für verschiedene Suchtypen
        this.searchTypeConfigs = {
            entities: {
                placeholder: 'Gerät suchen...',
                filterLabel: 'Kategorien',
                categoryNames: {
                    'lights': 'Lichter',
                    'climate': 'Klima', 
                    'switches': 'Schalter',
                    'covers': 'Rollos',
                    'fans': 'Ventilatoren',
                    'sensors': 'Sensoren',
                    'media': 'Medien',
                    'security': 'Sicherheit',
                    'other': 'Sonstiges'
                },
                categoryIcons: {
                    'lights': '💡',
                    'climate': '🌡️',
                    'switches': '🔌',
                    'covers': '🪟',
                    'fans': '🌀',
                    'sensors': '📊',
                    'media': '📺',
                    'security': '🔒',
                    'other': '📱'
                }
            },
            automations: {
                placeholder: 'Automation suchen...',
                filterLabel: 'Status',
                categoryNames: {
                    'active': 'Aktiv',
                    'inactive': 'Inaktiv',
                    'triggered': 'Kürzlich ausgelöst'
                },
                categoryIcons: {
                    'active': '✅',
                    'inactive': '❌',
                    'triggered': '🔥'
                }
            },
            scripts: {
                placeholder: 'Skript suchen...',
                filterLabel: 'Kategorie',
                categoryNames: {
                    'lighting': 'Beleuchtung',
                    'climate': 'Klima',
                    'security': 'Sicherheit',
                    'media': 'Medien',
                    'maintenance': 'Wartung',
                    'other': 'Sonstiges'
                },
                categoryIcons: {
                    'lighting': '💡',
                    'climate': '🌡️',
                    'security': '🔒',
                    'media': '📺',
                    'maintenance': '🔧',
                    'other': '📜'
                }
            },
            scenes: {
                placeholder: 'Szene suchen...',
                filterLabel: 'Bereich',
                categoryNames: {
                    'morning': 'Morgen',
                    'evening': 'Abend',
                    'night': 'Nacht',
                    'entertainment': 'Unterhaltung',
                    'security': 'Sicherheit',
                    'other': 'Sonstiges'
                },
                categoryIcons: {
                    'morning': '🌅',
                    'evening': '🌆',
                    'night': '🌙',
                    'entertainment': '🎬',
                    'security': '🔒',
                    'other': '🎭'
                }
            }
        };

        this.searchInput = this.shadowRoot.getElementById('searchInput');
        this.searchTypeDropdown = this.shadowRoot.getElementById('searchTypeDropdown');
        this.resultsContainer = this.shadowRoot.getElementById('resultsContainer');
        this.noResults = this.shadowRoot.getElementById('noResults');
        this.filterLabel = this.shadowRoot.getElementById('filterLabel');

        this.searchInput.addEventListener('input', () => this.applyFilters());
        this.searchTypeDropdown.addEventListener('change', () => this.onSearchTypeChange());
        
        // View Toggle Event Listener
        this.shadowRoot.querySelectorAll('.view-button').forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });
        
        this.setupChipFilters();
        this.updateSearchUI();
    }

    onSearchTypeChange() {
        this.currentSearchType = this.searchTypeDropdown.value;
        this.selectedRooms.clear();
        this.selectedType = '';
        this.updateSearchUI();
        this.updateItems();
    }

    updateSearchUI() {
        const config = this.searchTypeConfigs[this.currentSearchType];
        this.searchInput.placeholder = config.placeholder;
        this.filterLabel.textContent = config.filterLabel;
        
        // Room chips zurücksetzen
        this.setupRoomChips([]);
        
        // Filter chips zurücksetzen
        this.setupCategoryChips([]);
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        this.shadowRoot.querySelectorAll('.view-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Re-render current results
        this.applyFilters();
    }

    updateItems() {
        if (!this._hass) return;

        try {
            this.allItems = [];
            
            switch (this.currentSearchType) {
                case 'entities':
                    if (this.useManualEntities) {
                        this.loadManualEntities();
                    } else {
                        this.loadAllEntities();
                    }
                    break;
                case 'automations':
                    this.loadAutomations();
                    break;
                case 'scripts':
                    this.loadScripts();
                    break;
                case 'scenes':
                    this.loadScenes();
                    break;
            }

            this.initializeFilters();
        } catch (error) {
            console.error('Fehler beim Laden der Items:', error);
            this.showConfigError('Fehler beim Laden: ' + error.message);
        }
    }

    loadManualEntities() {
        this.config.entities.forEach(entityConfig => {
            if (!entityConfig.entity) {
                console.warn('Entität ohne entity-ID gefunden:', entityConfig);
                return;
            }

            const entityId = entityConfig.entity;
            const state = this._hass.states[entityId];
            
            if (!state) {
                console.warn(`Entität ${entityId} nicht in Home Assistant gefunden`);
                return;
            }

            const domain = entityId.split('.')[0];
            
            const device = {
                id: entityId,
                name: entityConfig.title || entityConfig.name || state.attributes.friendly_name || entityId,
                type: domain,
                category: entityConfig.category || this.mapDomainToCategory(domain),
                room: entityConfig.area || entityConfig.room || state.attributes.room || 'Unbekannt',
                state: state.state,
                attributes: state.attributes,
                icon: entityConfig.icon || this.getDeviceIcon(domain, state),
                config: entityConfig,
                itemType: 'entity'
            };

            this.addDomainSpecificAttributes(device, domain, state);
            this.allItems.push(device);
        });
    }

    loadAllEntities() {
        Object.keys(this._hass.states).forEach(entityId => {
            const state = this._hass.states[entityId];
            const domain = entityId.split('.')[0];
            
            if (['automation', 'script', 'scene', 'zone', 'person'].includes(domain)) return;
            
            const device = {
                id: entityId,
                name: state.attributes.friendly_name || entityId,
                type: domain,
                category: this.mapDomainToCategory(domain),
                room: state.attributes.room || 'Unbekannt',
                state: state.state,
                attributes: state.attributes,
                icon: this.getDeviceIcon(domain, state),
                itemType: 'entity'
            };

            this.addDomainSpecificAttributes(device, domain, state);
            this.allItems.push(device);
        });
    }

    loadAutomations() {
        Object.keys(this._hass.states).forEach(entityId => {
            if (!entityId.startsWith('automation.')) return;
            
            const state = this._hass.states[entityId];
            const lastTriggered = state.attributes.last_triggered;
            const isRecentlyTriggered = lastTriggered && (Date.now() - new Date(lastTriggered).getTime()) < 24 * 60 * 60 * 1000;
            
            const automation = {
                id: entityId,
                name: state.attributes.friendly_name || entityId.replace('automation.', ''),
                type: 'automation',
                category: state.state === 'on' ? 'active' : 'inactive',
                room: state.attributes.room || 'System',
                state: state.state,
                attributes: state.attributes,
                icon: state.state === 'on' ? '🤖' : '⏸️',
                description: `Zuletzt ausgelöst: ${lastTriggered ? new Date(lastTriggered).toLocaleString('de-DE') : 'Nie'}`,
                itemType: 'automation',
                lastTriggered: lastTriggered
            };

            if (isRecentlyTriggered) {
                automation.category = 'triggered';
                automation.icon = '🔥';
            }

            this.allItems.push(automation);
        });
    }

    loadScripts() {
        Object.keys(this._hass.states).forEach(entityId => {
            if (!entityId.startsWith('script.')) return;
            
            const state = this._hass.states[entityId];
            const lastTriggered = state.attributes.last_triggered;
            
            const script = {
                id: entityId,
                name: state.attributes.friendly_name || entityId.replace('script.', ''),
                type: 'script',
                category: this.categorizeScript(entityId, state),
                room: state.attributes.room || 'System',
                state: state.state,
                attributes: state.attributes,
                icon: this.getScriptIcon(entityId, state),
                description: `Zuletzt ausgeführt: ${lastTriggered ? new Date(lastTriggered).toLocaleString('de-DE') : 'Nie'}`,
                itemType: 'script',
                lastTriggered: lastTriggered
            };

            this.allItems.push(script);
        });
    }

    loadScenes() {
        Object.keys(this._hass.states).forEach(entityId => {
            if (!entityId.startsWith('scene.')) return;
            
            const state = this._hass.states[entityId];
            
            const scene = {
                id: entityId,
                name: state.attributes.friendly_name || entityId.replace('scene.', ''),
                type: 'scene',
                category: this.categorizeScene(entityId, state),
                room: state.attributes.room || 'System',
                state: 'verfügbar',
                attributes: state.attributes,
                icon: this.getSceneIcon(entityId, state),
                description: state.attributes.entity_id ? `${state.attributes.entity_id.length} Entitäten` : '',
                itemType: 'scene'
            };

            this.allItems.push(scene);
        });
    }

    categorizeScript(entityId, state) {
        const name = entityId.toLowerCase();
        if (name.includes('light') || name.includes('lamp')) return 'lighting';
        if (name.includes('climate') || name.includes('heating')) return 'climate';
        if (name.includes('security') || name.includes('alarm')) return 'security';
        if (name.includes('media') || name.includes('music')) return 'media';
        if (name.includes('clean') || name.includes('maintenance')) return 'maintenance';
        return 'other';
    }

    categorizeScene(entityId, state) {
        const name = entityId.toLowerCase();
        if (name.includes('morning') || name.includes('wake')) return 'morning';
        if (name.includes('evening') || name.includes('sunset')) return 'evening';
        if (name.includes('night') || name.includes('sleep')) return 'night';
        if (name.includes('movie') || name.includes('entertainment')) return 'entertainment';
        if (name.includes('security') || name.includes('away')) return 'security';
        return 'other';
    }

    getScriptIcon(entityId, state) {
        const category = this.categorizeScript(entityId, state);
        return this.searchTypeConfigs.scripts.categoryIcons[category] || '📜';
    }

    getSceneIcon(entityId, state) {
        const category = this.categorizeScene(entityId, state);
        return this.searchTypeConfigs.scenes.categoryIcons[category] || '🎭';
    }

    mapDomainToCategory(domain) {
        const domainToCategoryMap = {
            'light': 'lights',
            'switch': 'switches',
            'climate': 'climate',
            'cover': 'covers',
            'fan': 'fans',
            'sensor': 'sensors',
            'binary_sensor': 'sensors',
            'media_player': 'media',
            'camera': 'security',
            'lock': 'security',
            'alarm_control_panel': 'security'
        };
        
        return domainToCategoryMap[domain] || 'other';
    }

    addDomainSpecificAttributes(device, domain, state) {
        switch (domain) {
            case 'light':
                device.brightness = Math.round((state.attributes.brightness || 0) / 255 * 100);
                break;
            case 'climate':
                device.current_temperature = state.attributes.current_temperature;
                device.target_temperature = state.attributes.temperature;
                break;
            case 'cover':
                device.position = state.attributes.current_position || 0;
                break;
            case 'fan':
                device.speed = state.attributes.speed || 0;
                device.max_speed = state.attributes.speed_list?.length || 5;
                break;
            case 'media_player':
                device.volume = Math.round((state.attributes.volume_level || 0) * 100);
                device.media_title = state.attributes.media_title;
                break;
        }
    }

    getDeviceIcon(domain, state) {
        const iconMap = {
            'light': '💡',
            'switch': '🔌',
            'climate': '🌡️',
            'cover': '🪟',
            'fan': '🌀',
            'sensor': '📊',
            'binary_sensor': '📊',
            'media_player': '📺',
            'camera': '📹',
            'lock': '🔒'
        };
        
        return iconMap[domain] || '📱';
    }

    initializeFilters() {
        const rooms = [...new Set(this.allItems.map(d => d.room))].sort();
        this.setupRoomChips(rooms);
        
        const categories = [...new Set(this.allItems.map(d => d.category))].sort();
        this.setupCategoryChips(categories);

        this.applyFilters();
    }

    setupRoomChips(rooms) {
        const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
        
        const existingChips = roomChips.querySelectorAll('.room-chip-small:not([data-value=""])');
        existingChips.forEach(chip => chip.remove());
        
        rooms.forEach(room => {
            const chip = document.createElement('div');
            chip.className = 'room-chip-small';
            chip.setAttribute('data-value', room);
            chip.textContent = room;
            roomChips.appendChild(chip);
        });
    }

    setupCategoryChips(categories) {
        const categoryChips = this.shadowRoot.getElementById('typeFilterChips');
        
        const existingChips = categoryChips.querySelectorAll('.filter-chip:not([data-value=""])');
        existingChips.forEach(chip => chip.remove());
        
        const config = this.searchTypeConfigs[this.currentSearchType];
        
        categories.forEach(category => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-value', category);
            
            const stats = this.getCategoryStats(category);
            const icon = config.categoryIcons[category] || '📱';
            
            chip.innerHTML = `
                <div class="chip-icon">${icon}</div>
                <div class="chip-content">
                    <div class="chip-type-name">${config.categoryNames[category] || category}</div>
                    <div class="chip-count">${stats}</div>
                </div>
            `;
            
            categoryChips.appendChild(chip);
        });
    }

    setupChipFilters() {
        this.shadowRoot.getElementById('roomChipsInSearch').addEventListener('click', (e) => {
            if (e.target.classList.contains('room-chip-small')) {
                this.handleRoomChipClick(e.target);
            }
        });

        this.shadowRoot.getElementById('typeFilterChips').addEventListener('click', (e) => {
            let chip = e.target;
            if (!chip.classList.contains('filter-chip')) {
                chip = chip.closest('.filter-chip');
            }
            
            if (chip && chip.classList.contains('filter-chip')) {
                this.handleCategoryChipClick(chip);
            }
        });
    }

    handleRoomChipClick(chip) {
        const value = chip.getAttribute('data-value');
        
        if (value === '') {
            this.selectedRooms.clear();
            const chips = this.shadowRoot.querySelectorAll('#roomChipsInSearch .room-chip-small');
            chips.forEach(chip => chip.classList.remove('active'));
            chip.classList.add('active');
        } else {
            const alleChip = this.shadowRoot.querySelector('#roomChipsInSearch .room-chip-small[data-value=""]');
            alleChip.classList.remove('active');
            
            if (this.selectedRooms.has(value)) {
                this.selectedRooms.delete(value);
                chip.classList.remove('active');
            } else {
                this.selectedRooms.add(value);
                chip.classList.add('active');
            }
            
            if (this.selectedRooms.size === 0) {
                alleChip.classList.add('active');
            }
        }
        
        this.applyFilters();
    }

    handleCategoryChipClick(chip) {
        const chips = this.shadowRoot.querySelectorAll('#typeFilterChips .filter-chip');
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        this.selectedType = chip.getAttribute('data-value');
        this.applyFilters();
    }

    applyFilters() {
        const query = this.searchInput.value.toLowerCase().trim();
        
        let filteredItems = this.allItems.filter(item => {
            const matchesSearch = !query || 
                item.name.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query) ||
                item.room.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query);
            
            const matchesRoom = this.selectedRooms.size === 0 || this.selectedRooms.has(item.room);
            const matchesType = !this.selectedType || item.category === this.selectedType;
            
            return matchesSearch && matchesRoom && matchesType;
        });

        if (filteredItems.length === 0) {
            this.showNoResults('Keine Ergebnisse gefunden');
            return;
        }

        if (this.currentView === 'grid') {
            this.displayGridItems(filteredItems);
        } else {
            this.displayItems(filteredItems);
        }
    }

    showNoResults(message) {
        this.resultsContainer.innerHTML = `<div class="no-results">${message}</div>`;
    }

    showConfigError(message) {
        this.resultsContainer.innerHTML = `<div class="config-error">${message}</div>`;
    }

    displayGridItems(itemList) {
        this.resultsContainer.innerHTML = '';
        
        const sortedItems = itemList.sort((a, b) => {
            if (a.room !== b.room) {
                return a.room.localeCompare(b.room);
            }
            return a.name.localeCompare(b.name);
        });
        
        const itemsByRoom = {};
        sortedItems.forEach(item => {
            if (!itemsByRoom[item.room]) {
                itemsByRoom[item.room] = [];
            }
            itemsByRoom[item.room].push(item);
        });
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        
        Object.keys(itemsByRoom).forEach(room => {
            const roomSection = document.createElement('div');
            roomSection.className = 'room-grid-section';
            
            const roomHeader = document.createElement('div');
            roomHeader.className = 'room-grid-header';
            roomHeader.textContent = room;
            roomSection.appendChild(roomHeader);
            
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'grid-scroll-container';
            
            const gridItems = document.createElement('div');
            gridItems.className = 'grid-items';
            
            itemsByRoom[room].forEach(item => {
                const gridItem = this.createGridItem(item);
                gridItems.appendChild(gridItem);
            });
            
            scrollContainer.appendChild(gridItems);
            
            // Add scroll indicators if needed
            if (itemsByRoom[room].length > 2) {
                const leftIndicator = this.createScrollIndicator('left');
                const rightIndicator = this.createScrollIndicator('right');
                
                scrollContainer.appendChild(leftIndicator);
                scrollContainer.appendChild(rightIndicator);
                
                // Setup scroll behavior
                this.setupScrollBehavior(gridItems, leftIndicator, rightIndicator);
            }
            
            roomSection.appendChild(scrollContainer);
            gridContainer.appendChild(roomSection);
        });
        
        this.resultsContainer.appendChild(gridContainer);
    }

    createGridItem(item) {
        const element = document.createElement('div');
        element.className = 'grid-item';
        
        // Add state-based styling
        if (item.state === 'on' || item.state === 'heat' || item.state === 'cool') {
            element.classList.add('state-on');
        } else if (item.state === 'playing') {
            element.classList.add('state-playing');
        } else if (item.itemType === 'automation' && item.state === 'on') {
            element.classList.add('state-active');
        }
        
        element.innerHTML = `
            <div class="grid-item-icon">${item.icon}</div>
            <div class="grid-item-name">${item.name}</div>
            <div class="grid-item-state">${this.getStateText(item)}</div>
            ${this.getGridActionButtons(item)}
        `;
        
        // Handle click events
        element.addEventListener('click', (e) => {
            if (!e.target.classList.contains('grid-action-button')) {
                this.executeDefaultAction(item);
            }
        });
        
        // Handle action button clicks
        element.querySelectorAll('.grid-action-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.executeAction(item, action);
            });
        });
        
        return element;
    }

    getGridActionButtons(item) {
        let buttons = '<div class="grid-item-actions">';
        
        switch (item.itemType) {
            case 'automation':
                buttons += `<button class="grid-action-button" data-action="trigger">Ausführen</button>`;
                if (item.state === 'on') {
                    buttons += `<button class="grid-action-button secondary" data-action="toggle">Deaktivieren</button>`;
                } else {
                    buttons += `<button class="grid-action-button secondary" data-action="toggle">Aktivieren</button>`;
                }
                break;
                
            case 'script':
                buttons += `<button class="grid-action-button" data-action="run">Ausführen</button>`;
                break;
                
            case 'scene':
                buttons += `<button class="grid-action-button" data-action="activate">Aktivieren</button>`;
                break;
                
            case 'entity':
                if (['light', 'switch', 'fan'].includes(item.type)) {
                    const text = item.state === 'on' ? 'Ausschalten' : 'Einschalten';
                    buttons += `<button class="grid-action-button" data-action="toggle">${text}</button>`;
                }
                break;
        }
        
        buttons += '</div>';
        return buttons;
    }

    createScrollIndicator(direction) {
        const indicator = document.createElement('div');
        indicator.className = `scroll-indicator ${direction}`;
        indicator.innerHTML = direction === 'left' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        
        return indicator;
    }

    setupScrollBehavior(scrollContainer, leftIndicator, rightIndicator) {
        const checkScroll = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const scrollWidth = scrollContainer.scrollWidth;
            const clientWidth = scrollContainer.clientWidth;
            
            leftIndicator.classList.toggle('hidden', scrollLeft <= 0);
            rightIndicator.classList.toggle('hidden', scrollLeft >= scrollWidth - clientWidth - 10);
        };
        
        // Initial check
        checkScroll();
        
        // Check on scroll
        scrollContainer.addEventListener('scroll', checkScroll);
        
        // Scroll buttons functionality
        leftIndicator.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -clientWidth / 2, behavior: 'smooth' });
        });
        
        rightIndicator.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: clientWidth / 2, behavior: 'smooth' });
        });
        
        // Check on resize
        const resizeObserver = new ResizeObserver(() => checkScroll());
        resizeObserver.observe(scrollContainer);
    }

    displayItems(itemList) {
        this.resultsContainer.innerHTML = '';
        
        const sortedItems = itemList.sort((a, b) => {
            if (a.room !== b.room) {
                return a.room.localeCompare(b.room);
            }
            return a.name.localeCompare(b.name);
        });
        
        const itemsByRoom = {};
        sortedItems.forEach(item => {
            if (!itemsByRoom[item.room]) {
                itemsByRoom[item.room] = [];
            }
            itemsByRoom[item.room].push(item);
        });
        
        Object.keys(itemsByRoom).forEach(room => {
            const roomGroup = document.createElement('div');
            roomGroup.className = 'room-group';
            
            const roomHeader = document.createElement('div');
            roomHeader.className = 'room-header';
            roomHeader.textContent = room;
            roomGroup.appendChild(roomHeader);
            
            itemsByRoom[room].forEach(item => {
                const itemElement = this.createItemElement(item);
                roomGroup.appendChild(itemElement);
            });
            
            this.resultsContainer.appendChild(roomGroup);
        });
    }

    createItemElement(item) {
        const element = document.createElement('div');
        element.className = 'item';
        element.innerHTML = this.getItemHTML(item);
        
        element.addEventListener('click', () => {
            this.handleItemClick(item);
        });
        
        return element;
    }

    getItemHTML(item) {
        const stateText = this.getStateText(item);
        const actionButtons = this.getActionButtons(item);
        
        return `
            <div class="item-icon">${item.icon}</div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-state">${stateText}</div>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            </div>
            ${actionButtons}
        `;
    }

    getActionButtons(item) {
        switch (item.itemType) {
            case 'automation':
                const toggleText = item.state === 'on' ? 'Deaktivieren' : 'Aktivieren';
                const triggerButton = `<div class="action-button primary" data-action="trigger">Ausführen</div>`;
                const toggleButton = `<div class="action-button" data-action="toggle">${toggleText}</div>`;
                return `<div class="action-buttons">${triggerButton}${toggleButton}</div>`;
                
            case 'script':
                return `<div class="action-buttons"><div class="action-button primary" data-action="run">Ausführen</div></div>`;
                
            case 'scene':
                return `<div class="action-buttons"><div class="action-button primary" data-action="activate">Aktivieren</div></div>`;
                
            case 'entity':
                if (['light', 'switch', 'fan'].includes(item.type)) {
                    const toggleText = item.state === 'on' ? 'Aus' : 'Ein';
                    return `<div class="action-buttons"><div class="action-button primary" data-action="toggle">${toggleText}</div></div>`;
                }
                return '';
                
            default:
                return '';
        }
    }

    handleItemClick(item) {
        // Event delegation für Action Buttons
        event.stopPropagation();
        
        if (event.target.classList.contains('action-button')) {
            const action = event.target.getAttribute('data-action');
            this.executeAction(item, action);
            return;
        }
        
        // Standard-Aktion beim Klick auf das Item
        this.executeDefaultAction(item);
    }

    executeAction(item, action) {
        if (!this._hass) return;
        
        switch (action) {
            case 'toggle':
                if (item.itemType === 'automation') {
                    this._hass.callService('automation', 'toggle', { entity_id: item.id });
                } else {
                    const domain = item.type;
                    this._hass.callService(domain, 'toggle', { entity_id: item.id });
                }
                break;
                
            case 'trigger':
                this._hass.callService('automation', 'trigger', { entity_id: item.id });
                break;
                
            case 'run':
                this._hass.callService('script', 'turn_on', { entity_id: item.id });
                break;
                
            case 'activate':
                this._hass.callService('scene', 'turn_on', { entity_id: item.id });
                break;
        }
    }

    executeDefaultAction(item) {
        switch (item.itemType) {
            case 'automation':
                this.executeAction(item, 'trigger');
                break;
            case 'script':
                this.executeAction(item, 'run');
                break;
            case 'scene':
                this.executeAction(item, 'activate');
                break;
            case 'entity':
                if (['light', 'switch', 'fan', 'media_player'].includes(item.type)) {
                    this.executeAction(item, 'toggle');
                }
                break;
        }
    }

    getStateText(item) {
        switch (item.itemType) {
            case 'automation':
                return item.state === 'on' ? 'Aktiv' : 'Inaktiv';
                
            case 'script':
                return item.state === 'on' ? 'Läuft...' : 'Bereit';
                
            case 'scene':
                return 'Bereit zur Aktivierung';
                
            case 'entity':
                return this.getEntityStateText(item);
                
            default:
                return item.state;
        }
    }

    getEntityStateText(device) {
        switch (device.type) {
            case 'light':
                return device.state === 'on' ? `Ein • ${device.brightness || 0}% Helligkeit` : 'Aus';
            case 'climate':
                return `${device.current_temperature || '--'}°C → ${device.target_temperature || '--'}°C`;
            case 'switch':
                return device.state === 'on' ? 'Ein' : 'Aus';
            case 'cover':
                return `${device.position || 0}% geöffnet`;
            case 'fan':
                return device.state === 'on' ? `Geschwindigkeit ${device.speed}/${device.max_speed}` : 'Aus';
            case 'media_player':
                if (device.state === 'playing' && device.media_title) {
                    return `Spielt: ${device.media_title}`;
                }
                return device.state === 'playing' ? 'Spielt' : device.state === 'paused' ? 'Pausiert' : 'Aus';
            case 'sensor':
                return device.state + (device.attributes.unit_of_measurement || '');
            default:
                return device.state;
        }
    }

    getCategoryStats(category) {
        const itemsOfCategory = this.allItems.filter(d => d.category === category);
        const total = itemsOfCategory.length;
        
        switch (this.currentSearchType) {
            case 'entities':
                return this.getEntityCategoryStats(category, itemsOfCategory);
                
            case 'automations':
                if (category === 'active') {
                    return `${total} Aktiv`;
                } else if (category === 'inactive') {
                    return `${total} Inaktiv`;
                } else if (category === 'triggered') {
                    return `${total} Kürzlich`;
                }
                return `${total} Items`;
                
            case 'scripts':
            case 'scenes':
                return `${total} Verfügbar`;
                
            default:
                return `${total} Items`;
        }
    }

    getEntityCategoryStats(category, itemsOfCategory) {
        switch (category) {
            case 'lights':
                const lightsOn = itemsOfCategory.filter(d => d.state === 'on').length;
                return `${lightsOn} An`;
                
            case 'switches':
                const switchesOn = itemsOfCategory.filter(d => d.state === 'on').length;
                return `${switchesOn} Ein`;
                
            case 'covers':
                const coversOpen = itemsOfCategory.filter(d => d.state === 'open').length;
                return `${coversOpen} Offen`;
                
            case 'climate':
                const climateOn = itemsOfCategory.filter(d => d.state === 'heat' || d.state === 'cool').length;
                return `${climateOn} Aktiv`;
                
            case 'fans':
                const fansOn = itemsOfCategory.filter(d => d.state === 'on').length;
                return `${fansOn} An`;
                
            case 'media':
                const mediaPlaying = itemsOfCategory.filter(d => d.state === 'playing').length;
                return `${mediaPlaying} Aktiv`;
                
            case 'sensors':
                return `${itemsOfCategory.length} Sensoren`;
                
            default:
                return `${itemsOfCategory.length} Geräte`;
        }
    }

    getCardSize() {
        return 3;
    }

    static getConfigElement() {
        return document.createElement('fast-search-card-editor');
    }

    static getStubConfig() {
        return {
            title: "Suchen",
            show_unavailable: false,
            entities: [
                {
                    entity: "light.wohnzimmer_decke",
                    title: "Wohnzimmer Deckenleuchte",
                    area: "Wohnzimmer",
                    category: "lights"
                }
            ]
        };
    }
}

customElements.define('fast-search-card', FastSearchCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Eine universelle Suchkarte für Home Assistant - Geräte, Automationen, Skripte und Szenen'
});

console.info(
    `%c FAST-SEARCH-CARD %c v3.0.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);