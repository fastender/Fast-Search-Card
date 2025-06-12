class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Minimal State - nur das Nötige!
        this._hass = null;
        this._config = {};
        this.allItems = [];
        this.filteredItems = [];
        this.activeFilter = 'all';
        this.isSearching = false;
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
        this._hass = hass;
        this.updateItems();
        this.updateStates();
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

            .search-container {
                background: 
                    linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                    rgba(255, 255, 255, 0.08);
                backdrop-filter: var(--glass-blur) saturate(1.8);
                -webkit-backdrop-filter: var(--glass-blur) saturate(1.8);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                padding: 20px;
                box-shadow: var(--glass-shadow);
                overflow: hidden;
                position: relative;
            }

            .search-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                opacity: 0.6;
            }

            .search-bar {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                padding: 12px 16px;
                transition: none;
            }

            .search-icon {
                width: 20px;
                height: 20px;
                opacity: 0.7;
                flex-shrink: 0;
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
                width: 20px;
                height: 20px;
                border: none;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
                flex-shrink: 0;
            }

            .clear-button.visible {
                display: flex;
            }

            .filter-chips {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                overflow-x: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
                padding: 2px;
            }

            .filter-chips::-webkit-scrollbar {
                display: none;
            }

            .filter-chip {
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
                transition: none;
                position: relative;
                overflow: hidden;
            }

            .filter-chip.active {
                background: var(--accent-light);
                border-color: var(--accent);
                color: var(--accent);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
            }

            .filter-chip::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
            }

            .filter-chip:hover::before {
                left: 100%;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
                min-height: 200px;
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
                transition: none;
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
                position: relative;
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
                .search-container {
                    padding: 16px;
                    border-radius: 20px;
                }
                
                .results-grid {
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 10px;
                }
                
                .device-card {
                    padding: 12px;
                }
                
                .search-input {
                    font-size: 16px;
                }
            }

            /* Animations werden via Web Animations API gehandelt */
            .animate-in {
                animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            </style>

            <div class="search-container">
                <div class="search-bar">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Geräte suchen..."
                        autocomplete="off"
                        spellcheck="false"
                    >
                    
                    <button class="clear-button">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div class="filter-chips">
                    <div class="filter-chip active" data-filter="all">Alle</div>
                    <div class="filter-chip" data-filter="lights">Lichter</div>
                    <div class="filter-chip" data-filter="climate">Klima</div>
                    <div class="filter-chip" data-filter="covers">Rollos</div>
                    <div class="filter-chip" data-filter="media">Medien</div>
                </div>

                <div class="results-grid">
                    <!-- Results werden hier eingefügt -->
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const filterChips = this.shadowRoot.querySelectorAll('.filter-chip');

        // Search Events
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        
        // Clear Button
        clearButton.addEventListener('click', () => this.clearSearch());
        
        // Filter Chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => this.handleFilterSelect(chip));
        });
    }

    handleSearch(query) {
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        
        // Show/Hide Clear Button mit Animation
        if (query.length > 0) {
            clearButton.classList.add('visible');
            this.animateElementIn(clearButton, { scale: [0, 1], opacity: [0, 1] });
        } else {
            this.animateElementOut(clearButton).then(() => {
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
        
        this.performSearch(query);
    }

    handleSearchFocus() {
        const searchBar = this.shadowRoot.querySelector('.search-bar');
        
        // Focus glow effect
        searchBar.animate([
            { 
                boxShadow: '0 0 0 rgba(0, 122, 255, 0)',
                borderColor: 'rgba(255, 255, 255, 0.15)'
            },
            { 
                boxShadow: '0 0 20px rgba(0, 122, 255, 0.3)',
                borderColor: 'var(--accent)'
            }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    clearSearch() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        
        searchInput.value = '';
        this.animateElementOut(clearButton).then(() => {
            clearButton.classList.remove('visible');
        });
        
        this.showAllItems();
        searchInput.focus();
    }

    handleFilterSelect(selectedChip) {
        const filter = selectedChip.dataset.filter;
        if (filter === this.activeFilter) return;
        
        // Update active state
        this.shadowRoot.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        selectedChip.classList.add('active');
        
        // Animate selection
        selectedChip.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(1.05)', filter: 'brightness(1.1)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        
        this.activeFilter = filter;
        this.filterItems();
    }

    updateItems() {
        if (!this._hass || !this._config.entities) return;

        this.allItems = this._config.entities.map(entityConfig => {
            const entityId = entityConfig.entity;
            const state = this._hass.states[entityId];
            
            if (!state) return null;

            const domain = entityId.split('.')[0];
            return {
                id: entityId,
                name: entityConfig.title || state.attributes.friendly_name || entityId,
                domain: domain,
                category: this.categorizeEntity(domain),
                state: state.state,
                attributes: state.attributes,
                icon: this.getEntityIcon(domain),
                isActive: this.isEntityActive(state)
            };
        }).filter(Boolean);

        this.showAllItems();
    }

    updateStates() {
        if (!this._hass) return;

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
            media_player: 'media'
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
            media_player: '🎵'
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
                
            default:
                return state.state === 'on' ? 'An' : 'Aus';
        }
    }

    performSearch(query) {
        if (!query.trim()) {
            this.showAllItems();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        this.filteredItems = this.allItems.filter(item => {
            return item.name.toLowerCase().includes(searchTerm) ||
                   item.id.toLowerCase().includes(searchTerm);
        });
        
        this.renderResults();
    }

    filterItems() {
        if (this.activeFilter === 'all') {
            this.filteredItems = [...this.allItems];
        } else {
            this.filteredItems = this.allItems.filter(item => item.category === this.activeFilter);
        }
        
        this.renderResults();
    }

    showAllItems() {
        this.filteredItems = [...this.allItems];
        this.renderResults();
    }

    renderResults() {
        const resultsGrid = this.shadowRoot.querySelector('.results-grid');
        
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
        
        this.filteredItems.forEach((item, index) => {
            const card = this.createDeviceCard(item);
            resultsGrid.appendChild(card);
            
            // Staggered entrance animation
            setTimeout(() => {
                this.animateElementIn(card, {
                    opacity: [0, 1],
                    transform: ['translateY(20px) scale(0.9)', 'translateY(0) scale(1)']
                });
            }, index * 50);
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
        
        card.addEventListener('click', () => this.handleDeviceClick(item, card));
        card.addEventListener('mouseenter', () => this.animateDeviceHover(card, true));
        card.addEventListener('mouseleave', () => this.animateDeviceHover(card, false));
        
        return card;
    }

    handleDeviceClick(item, card) {
        // Optimistic UI update
        const wasActive = card.classList.contains('active');
        card.classList.toggle('active', !wasActive);
        this.animateStateChange(card, !wasActive);
        
        // Call Home Assistant service
        this._hass.callService('homeassistant', 'toggle', {
            entity_id: item.id
        });
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
