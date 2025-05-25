class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.updateDebouncer = null;
        this.selectedItems = new Set();
        this.keyboardSelectedIndex = -1;
        this.favorites = new Set(JSON.parse(localStorage.getItem('fast-search-favorites') || '[]'));
    }

    setConfig(config) {
        this.config = {
            title: "Suchen",
            show_unavailable: false,
            enable_favorites: true,
            enable_keyboard_nav: true,
            enable_multi_select: true,
            default_view: 'list',
            items_per_row: 4,
            show_room_headers: true,
            animation_speed: 'normal',
            ...config
        };
        
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
                    
                    /* Card fade-in beim Laden */
                    opacity: 0;
                    animation: cardFadeIn 0.6s ease-out 0.2s forwards;
                }

                /* Animation speed variants */
                :host([animation-speed="fast"]) * {
                    animation-duration: 0.2s !important;
                }
                
                :host([animation-speed="slow"]) * {
                    animation-duration: 1s !important;
                }
                
                :host([animation-speed="none"]) * {
                    animation: none !important;
                }

                .search-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden;
                    position: relative;
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

                .header-left {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .header-right {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .view-toggle {
                    display: flex;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                }

                .view-toggle-btn {
                    background: none;
                    border: none;
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    transition: all 0.2s;
                    position: relative;
                }

                .view-toggle-btn:hover {
                    background: #f5f5f5;
                }

                .view-toggle-btn.active {
                    background: #007aff;
                    color: white;
                }

                .view-toggle-btn + .view-toggle-btn {
                    border-left: 1px solid #ddd;
                }

                .favorites-toggle {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 8px 12px;
                    cursor: pointer;
                    color: #666;
                    transition: all 0.2s;
                }

                .favorites-toggle:hover {
                    background: #f5f5f5;
                }

                .favorites-toggle.active {
                    background: #ffd700;
                    color: #333;
                    border-color: #ffd700;
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
                    transition: all 0.3s ease;
                    position: relative;
                }

                .search-input:focus {
                    animation: elasticFocus 0.3s ease-out;
                    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
                }

                .search-input::placeholder {
                    color: #999;
                }

                /* Keyboard navigation highlight */
                .keyboard-selected {
                    outline: 2px solid #007aff !important;
                    outline-offset: 2px;
                }

                /* Multi-select highlight */
                .multi-selected {
                    background: rgba(0, 122, 255, 0.1) !important;
                    border-color: #007aff !important;
                }

                /* Typing indicator */
                .typing-indicator {
                    position: absolute;
                    right: 20px;
                    top: 20px;
                    display: flex;
                    gap: 3px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .typing-indicator.active {
                    opacity: 1;
                }

                .typing-dot {
                    width: 4px;
                    height: 4px;
                    background: #007aff;
                    border-radius: 50%;
                    animation: typing 1.5s infinite;
                }

                .typing-dot:nth-child(1) { animation-delay: 0s; }
                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }

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

                /* Batch Actions Bar */
                .batch-actions {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 25px;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    animation: slideUp 0.3s ease-out;
                    z-index: 1000;
                }

                .batch-actions button {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 16px;
                    border-radius: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .batch-actions button:hover {
                    background: rgba(255,255,255,0.3);
                }

                /* Animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeInStagger {
                    from {
                        opacity: 0;
                        transform: translateY(15px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes cardFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }

                @keyframes elasticFocus {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.02);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                /* Results container */
                .results-container {
                    max-height: 600px;
                    overflow-y: auto;
                }

                .results-container.loading {
                    animation: slideInFromBottom 0.4s ease-out;
                }

                @keyframes slideInFromBottom {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Grid View Styles */
                .grid-container {
                    padding: 20px;
                    animation: slideInFromBottom 0.4s ease-out;
                }

                .grid-scroll {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 16px;
                    padding: 4px 0 20px 0;
                }

                .grid-item {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    height: 140px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    will-change: transform, box-shadow;
                }

                .grid-item.fade-in {
                    opacity: 0;
                    animation: fadeInStagger 0.5s ease-out forwards;
                }

                .grid-item.fade-in:nth-child(1) { animation-delay: 0.1s; }
                .grid-item.fade-in:nth-child(2) { animation-delay: 0.15s; }
                .grid-item.fade-in:nth-child(3) { animation-delay: 0.2s; }
                .grid-item.fade-in:nth-child(4) { animation-delay: 0.25s; }
                .grid-item.fade-in:nth-child(5) { animation-delay: 0.3s; }
                .grid-item.fade-in:nth-child(6) { animation-delay: 0.35s; }

                .grid-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }

                .grid-item.active {
                    border: 2px solid #007aff;
                    background: rgba(0, 122, 255, 0.05);
                }

                .grid-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }

                .grid-item-icon {
                    font-size: 24px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .grid-item-favorite {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: all 0.2s;
                }

                .grid-item-favorite:hover {
                    opacity: 1;
                    transform: scale(1.2);
                }

                .grid-item-actions {
                    display: flex;
                    gap: 4px;
                }

                .grid-action-button {
                    padding: 4px 6px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #666;
                    min-width: 20px;
                    text-align: center;
                }

                .grid-action-button:hover {
                    background: #f5f5f5;
                    border-color: #ccc;
                }

                .grid-action-button.primary {
                    background: #007aff;
                    color: white;
                    border-color: #007aff;
                }

                .grid-action-button.primary:hover {
                    background: #0056b3;
                    border-color: #0056b3;
                }

                .grid-item-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                }

                .grid-item-name {
                    font-weight: 500;
                    font-size: 14px;
                    color: #333;
                    line-height: 1.2;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .grid-item-state {
                    font-size: 12px;
                    color: #666;
                    line-height: 1.1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .grid-item-trend {
                    font-size: 10px;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 4px;
                }

                .trend-up { color: #ff4444; }
                .trend-down { color: #44ff44; }
                .trend-stable { color: #666; }

                .grid-item-media {
                    font-size: 10px;
                    color: #999;
                    font-style: italic;
                    margin-top: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .grid-room-group {
                    margin-bottom: 32px;
                }

                .grid-room-header {
                    font-weight: 600;
                    font-size: 14px;
                    color: #495057;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                    padding: 0 4px;
                }

                /* List View Styles */
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
                    position: relative;
                }

                .item:hover {
                    background-color: #fafafa;
                }

                .item:last-child {
                    border-bottom: none;
                }

                .item-favorite {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: all 0.2s;
                }

                .item-favorite:hover {
                    opacity: 1;
                    transform: scale(1.2);
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

                @media (max-width: 768px) {
                    .grid-scroll {
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    }
                }
            </style>
            
            <div class="search-container">
                <div class="search-section">
                    <div class="search-header">
                        <div class="header-left">
                            <select class="search-type-dropdown" id="searchTypeDropdown">
                                <option value="entities">🏠 Geräte</option>
                                <option value="automations">🤖 Automationen</option>
                                <option value="scripts">📜 Skripte</option>
                                <option value="scenes">🎭 Szenen</option>
                            </select>
                        </div>
                        
                        <div class="header-right">
                            ${this.config?.enable_favorites !== false ? `
                                <button class="favorites-toggle" id="favoritesToggle" title="Nur Favoriten anzeigen">
                                    ⭐
                                </button>
                            ` : ''}
                            
                            <div class="view-toggle">
                                <button class="view-toggle-btn ${this.config?.default_view !== 'grid' ? 'active' : ''}" id="listViewBtn" data-view="list">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                                    </svg>
                                </button>
                                <button class="view-toggle-btn ${this.config?.default_view === 'grid' ? 'active' : ''}" id="gridViewBtn" data-view="grid">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="search-container-inner">
                        <div class="search-input-container">
                            <input type="text" class="search-input" placeholder="Suchen..." id="searchInput">
                            <div class="typing-indicator" id="typingIndicator">
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                            </div>
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
                <div id="batchActionsContainer"></div>
            </div>
        `;

        this.initializeCard();
    }

    initializeCard() {
        this.allItems = [];
        this.currentSearchType = 'entities';
        this.selectedRooms = new Set();
        this.selectedType = '';
        this.isInitialized = false;
        this.currentView = this.config?.default_view || 'list';
        this.showFavoritesOnly = false;
        
        // Set animation speed
        this.setAttribute('animation-speed', this.config?.animation_speed || 'normal');
        
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
        this.typingIndicator = this.shadowRoot.getElementById('typingIndicator');
        this.batchActionsContainer = this.shadowRoot.getElementById('batchActionsContainer');

        this.searchInput.addEventListener('input', () => this.handleSearchInput());
        this.searchTypeDropdown.addEventListener('change', () => this.onSearchTypeChange());
        
        // View Toggle Event Listeners
        this.shadowRoot.getElementById('listViewBtn').addEventListener('click', () => this.setView('list'));
        this.shadowRoot.getElementById('gridViewBtn').addEventListener('click', () => this.setView('grid'));
        
        // Favorites Toggle
        const favoritesToggle = this.shadowRoot.getElementById('favoritesToggle');
        if (favoritesToggle) {
            favoritesToggle.addEventListener('click', () => this.toggleFavorites());
        }
        
        // Keyboard Navigation
        if (this.config?.enable_keyboard_nav !== false) {
            this.setupKeyboardNavigation();
        }
        
        // Multi-select
        if (this.config?.enable_multi_select) {
            this.setupMultiSelect();
        }
        
        this.setupChipFilters();
        this.updateSearchUI();
    }

    setupKeyboardNavigation() {
        this.searchInput.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateResults(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateResults(-1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.executeSelectedItem();
                    break;
                case 'Escape':
                    this.searchInput.value = '';
                    this.applyFilters();
                    break;
            }
        });
    }

    navigateResults(direction) {
        const items = this.shadowRoot.querySelectorAll('.item, .grid-item');
        const currentIndex = Array.from(items).findIndex(item => 
            item.classList.contains('keyboard-selected')
        );
        
        items.forEach(item => item.classList.remove('keyboard-selected'));
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        items[newIndex]?.classList.add('keyboard-selected');
        items[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        this.keyboardSelectedIndex = newIndex;
    }

    executeSelectedItem() {
        const selectedElement = this.shadowRoot.querySelector('.keyboard-selected');
        if (selectedElement) {
            const itemId = selectedElement.getAttribute('data-item-id');
            const item = this.allItems.find(i => i.id === itemId);
            if (item) {
                this.executeDefaultAction(item);
            }
        }
    }

    setupMultiSelect() {
        this.shadowRoot.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.item, .grid-item');
            if (itemElement && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const itemId = itemElement.getAttribute('data-item-id');
                this.toggleItemSelection(itemId, itemElement);
            }
        });
    }

    toggleItemSelection(itemId, element) {
        if (this.selectedItems.has(itemId)) {
            this.selectedItems.delete(itemId);
            element.classList.remove('multi-selected');
        } else {
            this.selectedItems.add(itemId);
            element.classList.add('multi-selected');
        }
        
        this.updateBatchActions();
    }

    updateBatchActions() {
        if (this.selectedItems.size > 0) {
            this.batchActionsContainer.innerHTML = `
                <div class="batch-actions">
                    <span>${this.selectedItems.size} ausgewählt</span>
                    <button onclick="this.getRootNode().host.batchToggle()">Alle umschalten</button>
                    <button onclick="this.getRootNode().host.clearSelection()">Auswahl aufheben</button>
                </div>
            `;
        } else {
            this.batchActionsContainer.innerHTML = '';
        }
    }

    batchToggle() {
        this.selectedItems.forEach(itemId => {
            const item = this.allItems.find(i => i.id === itemId);
            if (item && ['light', 'switch', 'fan', 'automation'].includes(item.type)) {
                this.executeAction(item, 'toggle');
            }
        });
        this.clearSelection();
    }

    clearSelection() {
        this.selectedItems.clear();
        this.shadowRoot.querySelectorAll('.multi-selected').forEach(el => {
            el.classList.remove('multi-selected');
        });
        this.updateBatchActions();
    }

    toggleFavorites() {
        this.showFavoritesOnly = !this.showFavoritesOnly;
        const favoritesToggle = this.shadowRoot.getElementById('favoritesToggle');
        favoritesToggle.classList.toggle('active', this.showFavoritesOnly);
        this.applyFilters();
    }

    onSearchTypeChange() {
        this.currentSearchType = this.searchTypeDropdown.value;
        this.selectedRooms.clear();
        this.selectedType = '';
        this.isInitialized = false;
        this.updateSearchUI();
        this.updateItems();
    }

    setView(viewType) {
        this.currentView = viewType;
        
        // Toggle button states
        const listBtn = this.shadowRoot.getElementById('listViewBtn');
        const gridBtn = this.shadowRoot.getElementById('gridViewBtn');
        
        listBtn.classList.toggle('active', viewType === 'list');
        gridBtn.classList.toggle('active', viewType === 'grid');
        
        // Re-apply filters to refresh display
        this.applyFilters();
    }

    handleSearchInput() {
        // Typing indicator anzeigen
        this.showTypingIndicator();
        
        // Debounce für bessere Performance
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
            this.hideTypingIndicator();
        }, 300);
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('active');
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('active');
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

    updateItems() {
        if (!this._hass) return;

        // Debounced update
        if (this.updateDebouncer) {
            clearTimeout(this.updateDebouncer);
        }
        
        this.updateDebouncer = setTimeout(() => {
            this._performUpdate();
        }, 100);
    }

    _performUpdate() {
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

            // Add trend data for sensors
            this.addTrendData();

            // Nur Filter initialisieren, wenn noch nicht geschehen oder Typ geändert wurde
            if (!this.isInitialized) {
                this.initializeFilters();
                this.isInitialized = true;
            } else {
                // Nur die Kategorie-Chips aktualisieren (für Stats), Filter-Zustand beibehalten
                this.updateCategoryStats();
                
                // Bei Grid-Ansicht: Nur Zustände aktualisieren, keine komplette Neuerstellung
                if (this.currentView === 'grid') {
                    this.updateGridItemStates();
                } else {
                    // Bei Listen-Ansicht: Auch nur Zustände aktualisieren, keine Animation
                    this.updateListItemStates();
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Items:', error);
            this.showConfigError('Fehler beim Laden: ' + error.message);
        }
    }

    addTrendData() {
        // Simulate trend data for temperature sensors
        this.allItems.forEach(item => {
            if (item.type === 'sensor' && item.attributes.device_class === 'temperature') {
                // Store previous value (in real implementation, this would come from history)
                if (!item.previousValue) {
                    item.previousValue = parseFloat(item.state);
                }
                
                const currentValue = parseFloat(item.state);
                const diff = currentValue - item.previousValue;
                
                if (diff > 0.5) {
                    item.trend = 'up';
                } else if (diff < -0.5) {
                    item.trend = 'down';
                } else {
                    item.trend = 'stable';
                }
            }
        });
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

    updateCategoryStats() {
        const categories = [...new Set(this.allItems.map(d => d.category))].sort();
        const config = this.searchTypeConfigs[this.currentSearchType];
        
        categories.forEach(category => {
            const chip = this.shadowRoot.querySelector(`#typeFilterChips .filter-chip[data-value="${category}"]`);
            if (chip) {
                const stats = this.getCategoryStats(category);
                const countElement = chip.querySelector('.chip-count');
                if (countElement) {
                    countElement.textContent = stats;
                }
            }
        });
    }

    updateGridItemStates() {
        if (this.currentView !== 'grid') return;
        
        const gridItems = this.shadowRoot.querySelectorAll('.grid-item');
        gridItems.forEach(gridElement => {
            const itemId = gridElement.getAttribute('data-item-id');
            const item = this.allItems.find(i => i.id === itemId);
            
            if (item) {
                const isActive = this.isItemActive(item);
                gridElement.classList.toggle('active', isActive);
                
                const stateElement = gridElement.querySelector('.grid-item-state');
                if (stateElement) {
                    stateElement.textContent = this.getStateText(item);
                }
                
                const actionsElement = gridElement.querySelector('.grid-item-actions');
                if (actionsElement) {
                    actionsElement.innerHTML = this.getGridActionButtons(item);
                }
                
                // Update trend if exists
                const trendElement = gridElement.querySelector('.grid-item-trend');
                if (trendElement && item.trend) {
                    trendElement.innerHTML = this.getTrendIndicator(item);
                }
            }
        });
    }

    updateListItemStates() {
        if (this.currentView !== 'list') return;
        
        const listItems = this.shadowRoot.querySelectorAll('.item');
        listItems.forEach(listElement => {
            const itemId = listElement.getAttribute('data-item-id');
            const item = this.allItems.find(i => i.id === itemId);
            
            if (item) {
                const stateElement = listElement.querySelector('.item-state');
                if (stateElement) {
                    stateElement.textContent = this.getStateText(item);
                }
                
                const actionsElement = listElement.querySelector('.action-buttons');
                if (actionsElement) {
                    actionsElement.innerHTML = this.getActionButtons(item).replace('<div class="action-buttons">', '').replace('</div>', '');
                }
            }
        });
    }

    setupRoomChips(rooms) {
        const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
        
        const currentActiveRooms = Array.from(roomChips.querySelectorAll('.room-chip-small.active'))
            .map(chip => chip.getAttribute('data-value'));
        
        const existingRoomValues = Array.from(roomChips.querySelectorAll('.room-chip-small'))
            .map(chip => chip.getAttribute('data-value'));
        
        rooms.forEach((room, index) => {
            if (!existingRoomValues.includes(room)) {
                const chip = document.createElement('div');
                chip.className = 'room-chip-small';
                chip.setAttribute('data-value', room);
                chip.textContent = room;
                
                if (currentActiveRooms.includes(room)) {
                    chip.classList.add('active');
                }
                
                chip.style.animationDelay = `${index * 0.05}s`;
                
                roomChips.appendChild(chip);
            }
        });
    }

    setupCategoryChips(categories) {
        const categoryChips = this.shadowRoot.getElementById('typeFilterChips');
        
        if (!this.isInitialized) {
            const existingChips = categoryChips.querySelectorAll('.filter-chip:not([data-value=""])');
            existingChips.forEach(chip => chip.remove());
            
            const alleChip = categoryChips.querySelector('.filter-chip[data-value=""]');
            if (alleChip) {
                alleChip.classList.add('active');
            }
        }
        
        const existingCategoryValues = Array.from(categoryChips.querySelectorAll('.filter-chip'))
            .map(chip => chip.getAttribute('data-value'));
        
        const config = this.searchTypeConfigs[this.currentSearchType];
        
        categories.forEach(category => {
            if (!existingCategoryValues.includes(category)) {
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
                
                chip.style.animationDelay = `${categories.indexOf(category) * 0.1}s`;
                
                categoryChips.appendChild(chip);
            }
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

    searchItems(items, query) {
        if (!query) return items;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return items.filter(item => {
            const searchableText = [
                item.name,
                item.room,
                item.type,
                item.category,
                item.state,
                item.description || ''
            ].join(' ').toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        });
    }

    applyFilters() {
        const query = this.searchInput.value.toLowerCase().trim();
        
        let filteredItems = this.allItems.filter(item => {
            const matchesRoom = this.selectedRooms.size === 0 || this.selectedRooms.has(item.room);
            const matchesType = !this.selectedType || item.category === this.selectedType;
            const matchesFavorite = !this.showFavoritesOnly || this.favorites.has(item.id);
            
            return matchesRoom && matchesType && matchesFavorite;
        });
        
        // Apply fuzzy search
        filteredItems = this.searchItems(filteredItems, query);

        if (filteredItems.length === 0) {
            this.showNoResults('Keine Ergebnisse gefunden');
            return;
        }

        this.resultsContainer.classList.add('loading');
        
        setTimeout(() => {
            this.resultsContainer.classList.remove('loading');
        }, 400);

        if (this.currentView === 'grid') {
            this.displayItemsGrid(filteredItems);
        } else {
            this.displayItemsList(filteredItems);
        }
    }

    showNoResults(message) {
        this.resultsContainer.innerHTML = `<div class="no-results">${message}</div>`;
    }

    showConfigError(message) {
        this.resultsContainer.innerHTML = `<div class="config-error">${message}</div>`;
    }

    displayItemsList(itemList) {
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
            if (!this.config?.show_room_headers === false) {
                const roomGroup = document.createElement('div');
                roomGroup.className = 'room-group';
                
                const roomHeader = document.createElement('div');
                roomHeader.className = 'room-header';
                roomHeader.textContent = room;
                roomGroup.appendChild(roomHeader);
                
                itemsByRoom[room].forEach(item => {
                    const itemElement = this.createListItemElement(item, true);
                    roomGroup.appendChild(itemElement);
                });
                
                this.resultsContainer.appendChild(roomGroup);
            } else {
                itemsByRoom[room].forEach(item => {
                    const itemElement = this.createListItemElement(item, true);
                    this.resultsContainer.appendChild(itemElement);
                });
            }
        });
    }

    displayItemsGrid(itemList) {
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
            const roomGroup = document.createElement('div');
            roomGroup.className = 'grid-room-group';
            
            if (this.config?.show_room_headers !== false) {
                const roomHeader = document.createElement('div');
                roomHeader.className = 'grid-room-header';
                roomHeader.textContent = room;
                roomGroup.appendChild(roomHeader);
            }
            
            const gridScroll = document.createElement('div');
            gridScroll.className = 'grid-scroll';
            if (this.config?.items_per_row) {
                gridScroll.style.gridTemplateColumns = `repeat(${this.config.items_per_row}, 1fr)`;
            }
            
            itemsByRoom[room].forEach(item => {
                const itemElement = this.createGridItemElement(item, true);
                gridScroll.appendChild(itemElement);
            });
            
            roomGroup.appendChild(gridScroll);
            gridContainer.appendChild(roomGroup);
        });
        
        this.resultsContainer.appendChild(gridContainer);
    }

    createListItemElement(item, animate = false) {
        const element = document.createElement('div');
        element.className = animate ? 'item fade-in' : 'item';
        element.setAttribute('data-item-id', item.id);
        element.innerHTML = this.getItemHTML(item);
        
        element.addEventListener('click', (e) => {
            this.handleItemClick(item, e);
        });
        
        return element;
    }

    createGridItemElement(item, animate = false) {
        const element = document.createElement('div');
        element.className = animate ? 'grid-item fade-in' : 'grid-item';
        element.setAttribute('data-item-id', item.id);
        
        const isActive = this.isItemActive(item);
        if (isActive) {
            element.classList.add('active');
        }
        
        element.innerHTML = this.getGridItemHTML(item);
        
        element.addEventListener('click', (e) => {
            this.handleItemClick(item, e);
        });
        
        return element;
    }

    isItemActive(item) {
        switch (item.itemType) {
            case 'entity':
                return ['light', 'switch', 'fan', 'media_player'].includes(item.type) && item.state === 'on';
            case 'automation':
                return item.state === 'on';
            default:
                return false;
        }
    }

    isFavorite(itemId) {
        return this.favorites.has(itemId);
    }

    toggleFavorite(itemId) {
        if (this.favorites.has(itemId)) {
            this.favorites.delete(itemId);
        } else {
            this.favorites.add(itemId);
        }
        
        // Save to localStorage
        localStorage.setItem('fast-search-favorites', JSON.stringify([...this.favorites]));
        
        // Update UI
        this.applyFilters();
    }

    getTrendIndicator(item) {
        if (!item.trend) return '';
        
        const icons = {
            up: '↑',
            down: '↓',
            stable: '→'
        };
        
        const classes = {
            up: 'trend-up',
            down: 'trend-down',
            stable: 'trend-stable'
        };
        
        return `<span class="${classes[item.trend]}">${icons[item.trend]} ${item.state}${item.attributes.unit_of_measurement || ''}</span>`;
    }

    getAdditionalInfo(item) {
        switch (item.type) {
            case 'sensor':
                if (item.attributes.device_class === 'temperature' && item.trend) {
                    return `<div class="grid-item-trend">${this.getTrendIndicator(item)}</div>`;
                }
                break;
            case 'media_player':
                if (item.media_title) {
                    return `<div class="grid-item-media">${item.media_title}</div>`;
                }
                break;
        }
        return '';
    }

    getGridItemHTML(item) {
        const stateText = this.getStateText(item);
        const actionButtons = this.getGridActionButtons(item);
        const favoriteIcon = this.isFavorite(item.id) ? '⭐' : '☆';
        const additionalInfo = this.getAdditionalInfo(item);
        
        return `
            <div class="grid-item-header">
                <div class="grid-item-icon">${item.icon}</div>
                ${this.config?.enable_favorites !== false ? 
                    `<div class="grid-item-favorite" onclick="event.stopPropagation(); this.getRootNode().host.toggleFavorite('${item.id}')">${favoriteIcon}</div>` 
                    : ''}
                <div class="grid-item-actions">${actionButtons}</div>
            </div>
            <div class="grid-item-info">
                <div class="grid-item-name">${item.name}</div>
                <div class="grid-item-state">${stateText}</div>
                ${additionalInfo}
            </div>
        `;
    }

    getGridActionButtons(item) {
        switch (item.itemType) {
            case 'automation':
                const toggleSymbol = item.state === 'on' ? '⏸' : '▶';
                const triggerButton = `<div class="grid-action-button primary" data-action="trigger">🚀</div>`;
                const toggleButton = `<div class="grid-action-button" data-action="toggle">${toggleSymbol}</div>`;
                return `${triggerButton}${toggleButton}`;
                
            case 'script':
                return `<div class="grid-action-button primary" data-action="run">▶</div>`;
                
            case 'scene':
                return `<div class="grid-action-button primary" data-action="activate">🎬</div>`;
                
            case 'entity':
                if (['light', 'switch', 'fan'].includes(item.type)) {
                    const toggleSymbol = item.state === 'on' ? '⏸' : '▶';
                    return `<div class="grid-action-button primary" data-action="toggle">${toggleSymbol}</div>`;
                }
                return '';
                
            default:
                return '';
        }
    }

    getItemHTML(item) {
        const stateText = this.getStateText(item);
        const actionButtons = this.getActionButtons(item);
        const favoriteIcon = this.isFavorite(item.id) ? '⭐' : '☆';
        
        return `
            ${this.config?.enable_favorites !== false ? 
                `<div class="item-favorite" onclick="event.stopPropagation(); this.getRootNode().host.toggleFavorite('${item.id}')">${favoriteIcon}</div>` 
                : ''}
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

    handleItemClick(item, event) {
        event.stopPropagation();
        
        if (event.target.classList.contains('action-button') || event.target.classList.contains('grid-action-button')) {
            const action = event.target.getAttribute('data-action');
            this.executeAction(item, action, event.target);
            return;
        }
        
        // Multi-select handling
        if (this.config?.enable_multi_select && (event.ctrlKey || event.metaKey)) {
            const itemElement = event.currentTarget;
            const itemId = item.id;
            this.toggleItemSelection(itemId, itemElement);
            return;
        }
        
        // Standard action
        this.executeDefaultAction(item);
    }

    executeAction(item, action, buttonElement) {
        if (!this._hass) return;
        
        // Show loading state
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '⏳';
        buttonElement.disabled = true;
        
        let serviceCall;
        switch (action) {
            case 'toggle':
                if (item.itemType === 'automation') {
                    serviceCall = this._hass.callService('automation', 'toggle', { entity_id: item.id });
                } else {
                    const domain = item.type;
                    serviceCall = this._hass.callService(domain, 'toggle', { entity_id: item.id });
                }
                break;
                
            case 'trigger':
                serviceCall = this._hass.callService('automation', 'trigger', { entity_id: item.id });
                break;
                
            case 'run':
                serviceCall = this._hass.callService('script', 'turn_on', { entity_id: item.id });
                break;
                
            case 'activate':
                serviceCall = this._hass.callService('scene', 'turn_on', { entity_id: item.id });
                break;
        }
        
        // Restore button after delay
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }, 1000);
    }

    executeDefaultAction(item) {
        switch (item.itemType) {
            case 'automation':
                this.executeAction(item, 'trigger', { innerHTML: '', disabled: false });
                break;
            case 'script':
                this.executeAction(item, 'run', { innerHTML: '', disabled: false });
                break;
            case 'scene':
                this.executeAction(item, 'activate', { innerHTML: '', disabled: false });
                break;
            case 'entity':
                if (['light', 'switch', 'fan', 'media_player'].includes(item.type)) {
                    this.executeAction(item, 'toggle', { innerHTML: '', disabled: false });
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
            enable_favorites: true,
            enable_keyboard_nav: true,
            enable_multi_select: true,
            default_view: 'list',
            items_per_row: 4,
            show_room_headers: true,
            animation_speed: 'normal',
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
    name: 'Fast Search Card - Enhanced',
    description: 'Eine erweiterte universelle Suchkarte für Home Assistant mit Favoriten, Keyboard-Navigation und Multi-Select'
});

console.info(
    `%c FAST-SEARCH-CARD-ENHANCED %c v4.0.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);
