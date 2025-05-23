class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.devices = [];
        this.selectedRooms = new Set();
        this.selectedType = '';
        this.config = {};
        this._hass = null;
    }

    setConfig(config) {
        if (!config) {
            throw new Error('Invalid configuration');
        }
        this.config = Object.assign({
            title: 'Geräte suchen',
            show_room_filter: true,
            show_type_filter: true,
            max_results: 50
        }, config);
        
        this.render();
    }

    set hass(hass) {
        if (!hass) return;
        
        const oldHass = this._hass;
        this._hass = hass;
        
        // Only update if hass actually changed or if this is the first time
        if (!oldHass || this.shouldUpdate(oldHass, hass)) {
            this.updateDevices();
        }
    }

    get hass() {
        return this._hass;
    }

    shouldUpdate(oldHass, newHass) {
        // Check if any entity states have changed
        if (!oldHass.states || !newHass.states) return true;
        
        // Simple check - compare state count first
        const oldKeys = Object.keys(oldHass.states);
        const newKeys = Object.keys(newHass.states);
        
        if (oldKeys.length !== newKeys.length) return true;
        
        // Check if any relevant entity has changed
        return oldKeys.some(entityId => {
    getTypeStats(type) {
        try {
            const devicesOfType = this.devices.filter(d => d.type === type);
            const total = devicesOfType.length;
            
            switch (type) {
                case 'light':
                    const lightsOn = devicesOfType.filter(d => d.state === 'on').length;
                    return `${lightsOn} An`;
                    
                case 'switch':
                    const switchesOn = devicesOfType.filter(d => d.state === 'on').length;
                    return `${switchesOn} Ein`;
                    
                case 'cover':
                    const coversOpen = devicesOfType.filter(d => d.state === 'open').length;
                    return `${coversOpen} Offen`;
                    
                case 'climate':
                    const climateOn = devicesOfType.filter(d => 
                        d.state === 'heat' || d.state === 'cool' || d.state === 'auto'
                    ).length;
                    return `${climateOn} Aktiv`;
                    
                case 'fan':
                    const fansOn = devicesOfType.filter(d => d.state === 'on').length;
                    return `${fansOn} An`;
                    
                case 'media_player':
                    const playersOn = devicesOfType.filter(d => 
                        d.state === 'on' || d.state === 'playing'
                    ).length;
                    return `${playersOn} Aktiv`;
                    
                case 'lock':
                    const locksLocked = devicesOfType.filter(d => d.state === 'locked').length;
                    return `${locksLocked} Gesperrt`;
                    
                case 'sensor':
                case 'binary_sensor':
                    return `${total} Sensoren`;
                    
                default:
                    return `${total} Geräte`;
            }
        } catch (error) {
            console.warn(`Error getting type stats for ${type}:`, error);
            return '0';
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
            title: 'Geräte suchen',
            show_room_filter: true,
            show_type_filter: true,
            max_results: 50
        };
    }

    static get version() {
        return '1.0.0';
    }
}

// Define the custom element
customElements.define('fast-search-card', FastSearchCard);

// Register with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Eine moderne Suchkarte für Home Assistant mit intelligenter Filterung',
    preview: true,
    documentationURL: 'https://github.com/fastender/Fast-Search-Card'
});

// Console info
console.info(
    `%c FAST-SEARCH-CARD %c v1.0.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
); oldState = oldHass.states[entityId];
            const newState = newHass.states[entityId];
            
            if (!oldState || !newState) return true;
            
            return oldState.state !== newState.state ||
                   oldState.attributes.brightness !== newState.attributes.brightness ||
                   oldState.attributes.current_temperature !== newState.attributes.current_temperature;
        });
    }

    render() {
        if (!this.shadowRoot) return;
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
                }

                .search-container {
                    background: var(--card-background-color, white);
                    border-radius: var(--ha-card-border-radius, 12px);
                    box-shadow: var(--ha-card-box-shadow, 0 4px 20px rgba(0,0,0,0.1));
                    overflow: hidden;
                    border: var(--ha-card-border-width, 1px) solid var(--divider-color, transparent);
                }

                .card-header {
                    padding: 16px 20px 0 20px;
                    background: var(--card-background-color, white);
                }

                .card-title {
                    font-size: 24px;
                    font-weight: 400;
                    color: var(--primary-text-color, #333);
                    margin: 0 0 16px 0;
                }

                .search-section {
                    background: var(--secondary-background-color, #f8f9fa);
                    padding: 20px 20px 0 20px;
                }

                .search-container-inner {
                    position: relative;
                    margin-bottom: 20px;
                }

                .search-input {
                    width: 100%;
                    padding: 15px 15px 60px 15px;
                    border: none;
                    font-size: 18px;
                    outline: none;
                    background: var(--card-background-color, white);
                    color: var(--primary-text-color, #333);
                    border-radius: 8px;
                    box-sizing: border-box;
                    font-family: inherit;
                }

                .search-input::placeholder {
                    color: var(--secondary-text-color, #999);
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
                    background: var(--secondary-background-color, #f8f9fa);
                    border: 1px solid var(--divider-color, #e9ecef);
                    border-radius: 12px;
                    font-size: 12px;
                    color: var(--secondary-text-color, #666);
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    user-select: none;
                }

                .room-chip-small:hover {
                    background: var(--divider-color, #e9ecef);
                }

                .room-chip-small.active {
                    background: var(--accent-color, #007aff);
                    color: white;
                    border-color: var(--accent-color, #007aff);
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
                    color: var(--secondary-text-color, #666);
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
                    background: var(--card-background-color, white);
                    border: 1px solid var(--divider-color, #ddd);
                    border-radius: 20px;
                    font-size: 14px;
                    color: var(--secondary-text-color, #666);
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    user-select: none;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    text-align: left;
                    min-width: 90px;
                }

                .filter-chip:hover {
                    background: var(--secondary-background-color, #f5f5f5);
                    border-color: var(--outline-color, #ccc);
                }

                .filter-chip.active {
                    background: var(--accent-color, #007aff);
                    color: white;
                    border-color: var(--accent-color, #007aff);
                }

                .filter-chip.all {
                    background: var(--secondary-background-color, #f8f9fa);
                    border-color: var(--divider-color, #e9ecef);
                    min-width: auto;
                }

                .filter-chip.all.active {
                    background: var(--secondary-text-color, #6c757d);
                    border-color: var(--secondary-text-color, #6c757d);
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
                    background: var(--secondary-background-color, #f8f9fa);
                    border-bottom: 1px solid var(--divider-color, #e9ecef);
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--secondary-text-color, #495057);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .device-item {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--divider-color, #f0f0f0);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: background-color 0.2s ease;
                    cursor: pointer;
                    margin-left: 0;
                }

                .device-item:hover {
                    background-color: var(--secondary-background-color, #fafafa);
                }

                .device-item:last-child {
                    border-bottom: none;
                }

                .room-group:last-child .device-item:last-child {
                    border-bottom: none;
                }

                .device-icon {
                    font-size: 24px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .device-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .device-name {
                    font-weight: 500;
                    font-size: 16px;
                    color: var(--primary-text-color, #333);
                }

                .device-state {
                    font-size: 14px;
                    color: var(--secondary-text-color, #888);
                }

                .no-results {
                    padding: 40px 20px;
                    text-align: center;
                    color: var(--secondary-text-color, #999);
                    font-style: italic;
                }

                .error-message {
                    padding: 20px;
                    background: var(--error-color, #f44336);
                    color: white;
                    text-align: center;
                    border-radius: 8px;
                    margin: 20px;
                }
            </style>
            
            <div class="search-container">
                ${this.config.title ? `
                <div class="card-header">
                    <h2 class="card-title">${this.config.title}</h2>
                </div>` : ''}
                
                <div class="search-section">
                    <div class="search-container-inner">
                        <input type="text" class="search-input" placeholder="Gerät suchen..." id="searchInput">
                        ${this.config.show_room_filter !== false ? `
                        <div class="room-chips-in-search" id="roomChipsInSearch">
                            <div class="room-chip-small active" data-value="">Alle</div>
                        </div>` : ''}
                    </div>
                    
                    ${this.config.show_type_filter !== false ? `
                    <div class="filter-section">
                        <div class="filter-row">
                            <div class="filter-label">Gerätetypen</div>
                            <div class="filter-scroll" id="typeFilterChips">
                                <div class="filter-chip all active" data-value="">Alle</div>
                            </div>
                        </div>
                    </div>` : ''}
                </div>
                <div class="results-container" id="resultsContainer">
                    <div class="no-results" id="noResults">Geben Sie einen Suchbegriff ein...</div>
                </div>
            </div>
        `;

        this.initializeCard();
    }

    initializeCard() {
        try {
            // Type mapping for German display
            this.typeNames = {
                'light': 'Lichter',
                'climate': 'Klima', 
                'switch': 'Schalter',
                'cover': 'Rollos',
                'fan': 'Ventilatoren',
                'sensor': 'Sensoren',
                'binary_sensor': 'Sensoren',
                'media_player': 'Medien',
                'camera': 'Kameras',
                'lock': 'Schlösser',
                'vacuum': 'Staubsauger'
            };

            // Type icons for filters
            this.typeIcons = {
                'light': '💡',
                'climate': '🌡️',
                'switch': '🔌', 
                'cover': '🪟',
                'fan': '🌀',
                'sensor': '📊',
                'binary_sensor': '📊',
                'media_player': '🎵',
                'camera': '📷',
                'lock': '🔒',
                'vacuum': '🤖'
            };

            this.searchInput = this.shadowRoot.getElementById('searchInput');
            this.resultsContainer = this.shadowRoot.getElementById('resultsContainer');
            this.noResults = this.shadowRoot.getElementById('noResults');

            if (this.searchInput) {
                this.searchInput.addEventListener('input', () => this.applyFilters());
            }
            
            this.setupChipFilters();
            
            // Initial device update if hass is available
            if (this._hass) {
                this.updateDevices();
            }
        } catch (error) {
            console.error('Error initializing Fast Search Card:', error);
            this.showError('Fehler beim Initialisieren der Karte');
        }
    }

    updateDevices() {
        try {
            if (!this._hass || !this._hass.states) {
                console.warn('No hass or states available');
                return;
            }

            this.devices = [];
            
            // Extract devices from Home Assistant
            Object.keys(this._hass.states).forEach(entityId => {
                try {
                    const state = this._hass.states[entityId];
                    if (!state) return;
                    
                    const domain = entityId.split('.')[0];
                    
                    // Skip unwanted domains
                    if (['automation', 'script', 'zone', 'person', 'group', 'device_tracker'].includes(domain)) {
                        return;
                    }
                    
                    // Skip hidden entities
                    if (state.attributes.hidden === true) return;
                    
                    const device = {
                        id: entityId,
                        name: state.attributes.friendly_name || entityId.replace(/_/g, ' '),
                        type: domain,
                        room: this.extractRoom(state),
                        state: state.state || 'unknown',
                        attributes: state.attributes || {},
                        icon: this.getDeviceIcon(domain, state)
                    };

                    // Add specific attributes based on domain
                    this.addDomainSpecificAttributes(device, domain, state);

                    this.devices.push(device);
                } catch (error) {
                    console.warn(`Error processing entity ${entityId}:`, error);
                }
            });

            console.log(`Loaded ${this.devices.length} devices`);
            this.initializeFilters();
        } catch (error) {
            console.error('Error updating devices:', error);
            this.showError('Fehler beim Laden der Geräte');
        }
    }

    extractRoom(state) {
        // Try multiple ways to get room information
        if (state.attributes.room) return state.attributes.room;
        if (state.attributes.area_id) return state.attributes.area_id;
        if (state.attributes.device_class) return state.attributes.device_class;
        
        // Extract from entity_id if contains room info
        const entityParts = state.entity_id.split('.');
        if (entityParts.length > 1) {
            const namePart = entityParts[1];
            const commonRooms = ['wohnzimmer', 'schlafzimmer', 'kueche', 'bad', 'flur', 'garten', 'garage'];
            const foundRoom = commonRooms.find(room => namePart.includes(room));
            if (foundRoom) return foundRoom.charAt(0).toUpperCase() + foundRoom.slice(1);
        }
        
        return 'Unbekannt';
    }

    addDomainSpecificAttributes(device, domain, state) {
        try {
            switch (domain) {
                case 'light':
                    device.brightness = state.attributes.brightness 
                        ? Math.round((state.attributes.brightness / 255) * 100) 
                        : 0;
                    break;
                        
                case 'climate':
                    device.current_temperature = state.attributes.current_temperature || null;
                    device.target_temperature = state.attributes.temperature || null;
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
                    device.media_title = state.attributes.media_title || null;
                    break;
            }
        } catch (error) {
            console.warn(`Error adding domain-specific attributes for ${device.id}:`, error);
        }
    }

    getDeviceIcon(domain, state) {
        // Use entity icon if available
        if (state.attributes.icon) {
            return state.attributes.icon;
        }
        
        const iconMap = {
            'light': '💡',
            'switch': '🔌',
            'climate': '🌡️',
            'cover': '🪟',
            'fan': '🌀',
            'sensor': '📊',
            'binary_sensor': '📊',
            'media_player': '🎵',
            'camera': '📷',
            'lock': '🔒',
            'vacuum': '🤖'
        };
        
        return iconMap[domain] || '📱';
    }

    initializeFilters() {
        try {
            if (this.config.show_room_filter !== false) {
                this.initializeRoomFilter();
            }
            
            if (this.config.show_type_filter !== false) {
                this.initializeTypeFilter();
            }
            
            this.applyFilters();
        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    }

    initializeRoomFilter() {
        const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
        if (!roomChips) return;
        
        // Get unique rooms
        const rooms = [...new Set(this.devices.map(d => d.room))].sort();
        
        // Clear existing chips except "Alle"
        const existingChips = roomChips.querySelectorAll('.room-chip-small:not([data-value=""])');
        existingChips.forEach(chip => chip.remove());
        
        // Add room chips to search field
        rooms.forEach(room => {
            if (room && room !== 'Unbekannt') {
                const chip = document.createElement('div');
                chip.className = 'room-chip-small';
                chip.setAttribute('data-value', room);
                chip.textContent = room;
                roomChips.appendChild(chip);
            }
        });
    }

    initializeTypeFilter() {
        const typeChips = this.shadowRoot.getElementById('typeFilterChips');
        if (!typeChips) return;
        
        // Get unique device types
        const types = [...new Set(this.devices.map(d => d.type))].sort();
        
        // Clear existing chips except "Alle"
        const existingTypeChips = typeChips.querySelectorAll('.filter-chip:not([data-value=""])');
        existingTypeChips.forEach(chip => chip.remove());
        
        // Add type chips
        types.forEach(type => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-value', type);
            
            const stats = this.getTypeStats(type);
            const icon = this.typeIcons[type] || '📱';
            
            chip.innerHTML = `
                <div class="chip-icon">${icon}</div>
                <div class="chip-content">
                    <div class="chip-type-name">${this.typeNames[type] || type}</div>
                    <div class="chip-count">${stats}</div>
                </div>
            `;
            
            typeChips.appendChild(chip);
        });
    }

    setupChipFilters() {
        try {
            // Room filter chips
            const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
            if (roomChips) {
                roomChips.addEventListener('click', (e) => this.handleRoomChipClick(e));
            }

            // Type filter chips  
            const typeChips = this.shadowRoot.getElementById('typeFilterChips');
            if (typeChips) {
                typeChips.addEventListener('click', (e) => this.handleTypeChipClick(e));
            }
        } catch (error) {
            console.error('Error setting up chip filters:', error);
        }
    }

    handleRoomChipClick(e) {
        if (!e.target.classList.contains('room-chip-small')) return;
        
        const value = e.target.getAttribute('data-value');
        
        if (value === '') {
            // "Alle" wurde geklickt - alle anderen deselektieren
            this.selectedRooms.clear();
            const chips = this.shadowRoot.querySelectorAll('#roomChipsInSearch .room-chip-small');
            chips.forEach(chip => chip.classList.remove('active'));
            e.target.classList.add('active');
        } else {
            // Spezifischer Raum wurde geklickt
            const alleChip = this.shadowRoot.querySelector('#roomChipsInSearch .room-chip-small[data-value=""]');
            if (alleChip) alleChip.classList.remove('active');
            
            if (this.selectedRooms.has(value)) {
                // Raum deselektieren
                this.selectedRooms.delete(value);
                e.target.classList.remove('active');
            } else {
                // Raum selektieren
                this.selectedRooms.add(value);
                e.target.classList.add('active');
            }
            
            // Wenn keine Räume selektiert sind, "Alle" aktivieren
            if (this.selectedRooms.size === 0 && alleChip) {
                alleChip.classList.add('active');
            }
        }
        
        this.applyFilters();
    }

    handleTypeChipClick(e) {
        // Check if clicked element or its parent is a filter chip
        let chip = e.target;
        if (!chip.classList.contains('filter-chip')) {
            chip = chip.closest('.filter-chip');
        }
        
        if (!chip || !chip.classList.contains('filter-chip')) return;
        
        const chips = this.shadowRoot.querySelectorAll('#typeFilterChips .filter-chip');
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        this.selectedType = chip.getAttribute('data-value');
        this.applyFilters();
    }

    applyFilters() {
        try {
            const query = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
            
            let filteredDevices = this.devices.filter(device => {
                // Text search
                const matchesSearch = !query || 
                    device.name.toLowerCase().includes(query) ||
                    device.type.toLowerCase().includes(query) ||
                    device.room.toLowerCase().includes(query) ||
                    device.id.toLowerCase().includes(query);
                
                // Room filter - mehrere Räume möglich
                const matchesRoom = this.selectedRooms.size === 0 || this.selectedRooms.has(device.room);
                
                // Type filter
                const matchesType = !this.selectedType || device.type === this.selectedType;
                
                return matchesSearch && matchesRoom && matchesType;
            });

            // Limit results if configured
            if (this.config.max_results && filteredDevices.length > this.config.max_results) {
                filteredDevices = filteredDevices.slice(0, this.config.max_results);
            }

            if (filteredDevices.length === 0) {
                this.showNoResults(query ? 'Keine Geräte gefunden' : 'Geben Sie einen Suchbegriff ein...');
                return;
            }

            this.displayDevices(filteredDevices);
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError('Fehler beim Filtern der Geräte');
        }
    }

    showNoResults(message) {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `<div class="no-results">${message}</div>`;
        }
    }

    showError(message) {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    displayDevices(deviceList) {
        if (!this.resultsContainer) return;
        
        this.resultsContainer.innerHTML = '';
        
        // Sort devices by room first, then by name
        const sortedDevices = deviceList.sort((a, b) => {
            if (a.room !== b.room) {
                return a.room.localeCompare(b.room);
            }
            return a.name.localeCompare(b.name);
        });
        
        // Group devices by room
        const devicesByRoom = {};
        sortedDevices.forEach(device => {
            if (!devicesByRoom[device.room]) {
                devicesByRoom[device.room] = [];
            }
            devicesByRoom[device.room].push(device);
        });
        
        // Create room groups
        Object.keys(devicesByRoom).forEach(room => {
            const roomGroup = document.createElement('div');
            roomGroup.className = 'room-group';
            
            // Room header
            const roomHeader = document.createElement('div');
            roomHeader.className = 'room-header';
            roomHeader.textContent = room;
            roomGroup.appendChild(roomHeader);
            
            // Devices in this room
            devicesByRoom[room].forEach(device => {
                const deviceElement = this.createDeviceElement(device);
                roomGroup.appendChild(deviceElement);
            });
            
            this.resultsContainer.appendChild(roomGroup);
        });
    }

    createDeviceElement(device) {
        const element = document.createElement('div');
        element.className = 'device-item';
        element.innerHTML = this.getDeviceHTML(device);
        
        // Add click handler for device interaction
        element.addEventListener('click', () => {
            this.handleDeviceClick(device);
        });
        
        return element;
    }

    handleDeviceClick(device) {
        // Fire more-info event to show device details
        const event = new CustomEvent('hass-more-info', {
            bubbles: true,
            composed: true,
            detail: { entityId: device.id }
        });
        this.dispatchEvent(event);
    }

    getDeviceHTML(device) {
        const stateText = this.getStateText(device);
        
        return `
            <div class="device-icon">${device.icon}</div>
            <div class="device-info">
                <div class="device-name">${this.escapeHtml(device.name)}</div>
                <div class="device-state">${this.escapeHtml(stateText)}</div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStateText(device) {
        try {
            switch (device.type) {
                case 'light':
                    return device.state === 'on' 
                        ? `Ein • ${device.brightness || 0}% Helligkeit` 
                        : 'Aus';
                        
                case 'climate':
                    const current = device.current_temperature ? `${device.current_temperature}°C` : '--°C';
                    const target = device.target_temperature ? `${device.target_temperature}°C` : '--°C';
                    return `${current} → ${target}`;
                    
                case 'switch':
                    return device.state === 'on' ? 'Ein' : 'Aus';
                    
                case 'cover':
                    return `${device.position || 0}% geöffnet`;
                    
                case 'fan':
                    return device.state === 'on' 
                        ? `Geschwindigkeit ${device.speed}/${device.max_speed}` 
                        : 'Aus';
                        
                case 'media_player':
                    if (device.state === 'playing' && device.media_title) {
                        return `Spielt: ${device.media_title}`;
                    }
                    return device.state === 'on' || device.state === 'playing' ? 'Ein' : 'Aus';
                    
                case 'sensor':
                case 'binary_sensor':
                    return device.state || 'Unbekannt';
                    
                default:
                    return device.state || 'Unbekannt';
            }
        } catch (error) {
            console.warn(`Error getting state text for ${device.id}:`, error);
            return 'Fehler';
        }
    }

    getTypeStats(type) {
        try {
            constclass FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
        this.config = config;
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        this.updateDevices();
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

                .device-item {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: background-color 0.2s;
                    margin-left: 0;
                }

                .device-item:hover {
                    background-color: #fafafa;
                }

                .device-item:last-child {
                    border-bottom: none;
                }

                .room-group:last-child .device-item:last-child {
                    border-bottom: none;
                }

                .device-icon {
                    font-size: 24px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .device-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .device-name {
                    font-weight: 500;
                    font-size: 16px;
                    color: #333;
                }

                .device-state {
                    font-size: 14px;
                    color: #888;
                }

                .no-results {
                    padding: 40px 20px;
                    text-align: center;
                    color: #999;
                    font-style: italic;
                }
            </style>
            
            <div class="search-container">
                <div class="search-section">
                    <div class="search-container-inner">
                        <input type="text" class="search-input" placeholder="Gerät suchen..." id="searchInput">
                        <div class="room-chips-in-search" id="roomChipsInSearch">
                            <div class="room-chip-small active" data-value="">Alle</div>
                        </div>
                    </div>
                    <div class="filter-section">
                        <div class="filter-row">
                            <div class="filter-label">Gerätetypen</div>
                            <div class="filter-scroll" id="typeFilterChips">
                                <div class="filter-chip all active" data-value="">Alle</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="results-container" id="resultsContainer">
                    <div class="no-results" id="noResults">Geben Sie einen Suchbegriff ein...</div>
                </div>
            </div>
        `;

        this.initializeCard();
    }

    initializeCard() {
        this.devices = [];
        this.selectedRooms = new Set();
        this.selectedType = '';
        
        // Type mapping for German display
        this.typeNames = {
            'light': 'Lichter',
            'climate': 'Klima', 
            'switch': 'Schalter',
            'cover': 'Rollos',
            'fan': 'Ventilatoren',
            'sensor': 'Sensoren'
        };

        // Type icons for filters
        this.typeIcons = {
            'light': '💡',
            'climate': '🌡️',
            'switch': '🔌', 
            'cover': '🪟',
            'fan': '🌀',
            'sensor': '📊'
        };

        this.searchInput = this.shadowRoot.getElementById('searchInput');
        this.resultsContainer = this.shadowRoot.getElementById('resultsContainer');
        this.noResults = this.shadowRoot.getElementById('noResults');

        this.searchInput.addEventListener('input', () => this.applyFilters());
        
        this.setupChipFilters();
    }

    updateDevices() {
        if (!this._hass) return;

        this.devices = [];
        
        // Extract devices from Home Assistant
        Object.keys(this._hass.states).forEach(entityId => {
            const state = this._hass.states[entityId];
            const domain = entityId.split('.')[0];
            
            // Skip unwanted domains
            if (['automation', 'script', 'zone', 'person'].includes(domain)) return;
            
            const device = {
                id: entityId,
                name: state.attributes.friendly_name || entityId,
                type: domain,
                room: state.attributes.room || 'Unbekannt',
                state: state.state,
                attributes: state.attributes,
                icon: this.getDeviceIcon(domain, state)
            };

            // Add specific attributes based on domain
            if (domain === 'light') {
                device.brightness = Math.round((state.attributes.brightness || 0) / 255 * 100);
            }
            if (domain === 'climate') {
                device.current_temperature = state.attributes.current_temperature;
                device.target_temperature = state.attributes.temperature;
            }
            if (domain === 'cover') {
                device.position = state.attributes.current_position || 0;
            }
            if (domain === 'fan') {
                device.speed = state.attributes.speed || 0;
                device.max_speed = state.attributes.speed_list?.length || 5;
            }

            this.devices.push(device);
        });

        this.initializeFilters();
    }

    getDeviceIcon(domain, state) {
        const iconMap = {
            'light': '💡',
            'switch': '🔌',
            'climate': '🌡️',
            'cover': '🪟',
            'fan': '🌀',
            'sensor': '📊',
            'binary_sensor': '📊'
        };
        
        return iconMap[domain] || '📱';
    }

    initializeFilters() {
        // Get unique rooms
        const rooms = [...new Set(this.devices.map(d => d.room))].sort();
        const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
        
        // Clear existing chips except "Alle"
        const existingChips = roomChips.querySelectorAll('.room-chip-small:not([data-value=""])');
        existingChips.forEach(chip => chip.remove());
        
        // Add room chips to search field
        rooms.forEach(room => {
            const chip = document.createElement('div');
            chip.className = 'room-chip-small';
            chip.setAttribute('data-value', room);
            chip.textContent = room;
            roomChips.appendChild(chip);
        });

        // Get unique device types
        const types = [...new Set(this.devices.map(d => d.type))].sort();
        const typeChips = this.shadowRoot.getElementById('typeFilterChips');
        
        // Clear existing chips except "Alle"
        const existingTypeChips = typeChips.querySelectorAll('.filter-chip:not([data-value=""])');
        existingTypeChips.forEach(chip => chip.remove());
        
        // Add type chips
        types.forEach(type => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-value', type);
            
            const stats = this.getTypeStats(type);
            const icon = this.typeIcons[type] || '📱';
            
            chip.innerHTML = `
                <div class="chip-icon">${icon}</div>
                <div class="chip-content">
                    <div class="chip-type-name">${this.typeNames[type] || type}</div>
                    <div class="chip-count">${stats}</div>
                </div>
            `;
            
            typeChips.appendChild(chip);
        });

        this.applyFilters();
    }

    setupChipFilters() {
        // Room filter chips (in search field) - Mehrfachauswahl
        this.shadowRoot.getElementById('roomChipsInSearch').addEventListener('click', (e) => {
            if (e.target.classList.contains('room-chip-small')) {
                const value = e.target.getAttribute('data-value');
                
                if (value === '') {
                    // "Alle" wurde geklickt - alle anderen deselektieren
                    this.selectedRooms.clear();
                    const chips = this.shadowRoot.querySelectorAll('#roomChipsInSearch .room-chip-small');
                    chips.forEach(chip => chip.classList.remove('active'));
                    e.target.classList.add('active');
                } else {
                    // Spezifischer Raum wurde geklickt
                    const alleChip = this.shadowRoot.querySelector('#roomChipsInSearch .room-chip-small[data-value=""]');
                    alleChip.classList.remove('active');
                    
                    if (this.selectedRooms.has(value)) {
                        // Raum deselektieren
                        this.selectedRooms.delete(value);
                        e.target.classList.remove('active');
                    } else {
                        // Raum selektieren
                        this.selectedRooms.add(value);
                        e.target.classList.add('active');
                    }
                    
                    // Wenn keine Räume selektiert sind, "Alle" aktivieren
                    if (this.selectedRooms.size === 0) {
                        alleChip.classList.add('active');
                    }
                }
                
                this.applyFilters();
            }
        });

        // Type filter chips  
        this.shadowRoot.getElementById('typeFilterChips').addEventListener('click', (e) => {
            // Check if clicked element or its parent is a filter chip
            let chip = e.target;
            if (!chip.classList.contains('filter-chip')) {
                chip = chip.closest('.filter-chip');
            }
            
            if (chip && chip.classList.contains('filter-chip')) {
                const chips = this.shadowRoot.querySelectorAll('#typeFilterChips .filter-chip');
                chips.forEach(chip => chip.classList.remove('active'));
                chip.classList.add('active');
                
                this.selectedType = chip.getAttribute('data-value');
                this.applyFilters();
            }
        });
    }

    applyFilters() {
        const query = this.searchInput.value.toLowerCase().trim();
        
        let filteredDevices = this.devices.filter(device => {
            // Text search
            const matchesSearch = !query || 
                device.name.toLowerCase().includes(query) ||
                device.type.toLowerCase().includes(query) ||
                device.room.toLowerCase().includes(query);
            
            // Room filter - mehrere Räume möglich
            const matchesRoom = this.selectedRooms.size === 0 || this.selectedRooms.has(device.room);
            
            // Type filter
            const matchesType = !this.selectedType || device.type === this.selectedType;
            
            return matchesSearch && matchesRoom && matchesType;
        });

        if (filteredDevices.length === 0) {
            this.showNoResults('Keine Geräte gefunden');
            return;
        }

        this.displayDevices(filteredDevices);
    }

    showNoResults(message) {
        this.resultsContainer.innerHTML = `<div class="no-results">${message}</div>`;
    }

    displayDevices(deviceList) {
        this.resultsContainer.innerHTML = '';
        
        // Sort devices by room first, then by name
        const sortedDevices = deviceList.sort((a, b) => {
            if (a.room !== b.room) {
                return a.room.localeCompare(b.room);
            }
            return a.name.localeCompare(b.name);
        });
        
        // Group devices by room
        const devicesByRoom = {};
        sortedDevices.forEach(device => {
            if (!devicesByRoom[device.room]) {
                devicesByRoom[device.room] = [];
            }
            devicesByRoom[device.room].push(device);
        });
        
        // Create room groups
        Object.keys(devicesByRoom).forEach(room => {
            const roomGroup = document.createElement('div');
            roomGroup.className = 'room-group';
            
            // Room header
            const roomHeader = document.createElement('div');
            roomHeader.className = 'room-header';
            roomHeader.textContent = room;
            roomGroup.appendChild(roomHeader);
            
            // Devices in this room
            devicesByRoom[room].forEach(device => {
                const deviceElement = this.createDeviceElement(device);
                roomGroup.appendChild(deviceElement);
            });
            
            this.resultsContainer.appendChild(roomGroup);
        });
    }

    createDeviceElement(device) {
        const element = document.createElement('div');
        element.className = 'device-item';
        element.innerHTML = this.getDeviceHTML(device);
        return element;
    }

    getDeviceHTML(device) {
        const stateText = this.getStateText(device);
        
        return `
            <div class="device-icon">${device.icon}</div>
            <div class="device-info">
                <div class="device-name">${device.name}</div>
                <div class="device-state">${stateText}</div>
            </div>
        `;
    }

    getStateText(device) {
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
            case 'sensor':
                return device.state;
            default:
                return device.state;
        }
    }

    getTypeStats(type) {
        const devicesOfType = this.devices.filter(d => d.type === type);
        const total = devicesOfType.length;
        
        switch (type) {
            case 'light':
                const lightsOn = devicesOfType.filter(d => d.state === 'on').length;
                return `${lightsOn} An`;
                
            case 'switch':
                const switchesOn = devicesOfType.filter(d => d.state === 'on').length;
                return `${switchesOn} Ein`;
                
            case 'cover':
                const coversOpen = devicesOfType.filter(d => d.state === 'open').length;
                return `${coversOpen} Offen`;
                
            case 'climate':
                const climateOn = devicesOfType.filter(d => d.state === 'heat' || d.state === 'cool').length;
                return `${climateOn} Aktiv`;
                
            case 'fan':
                const fansOn = devicesOfType.filter(d => d.state === 'on').length;
                return `${fansOn} An`;
                
            case 'sensor':
                return `${total} Sensoren`;
                
            default:
                return `${total} Geräte`;
        }
    }

    getCardSize() {
        return 3;
    }

    static getConfigElement() {
        return document.createElement('fast-search-card-editor');
    }

    static getStubConfig() {
        return {};
    }
}

customElements.define('fast-search-card', FastSearchCard);

// Tell Home Assistant about this card
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Eine moderne Suchkarte für Home Assistant mit intelligenter Filterung'
});

console.info(
    `%c FAST-SEARCH-CARD %c v1.0.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);
