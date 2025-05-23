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
                    cursor: pointer;
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

                .config-error {
                    padding: 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    color: #856404;
                    margin: 10px;
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
                            <div class="filter-label">Kategorien</div>
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
        
        // Erweiterte Kategorie-Namen für Anzeige
        this.categoryNames = {
            'lights': 'Lichter',
            'climate': 'Klima', 
            'switches': 'Schalter',
            'covers': 'Rollos',
            'fans': 'Ventilatoren',
            'sensors': 'Sensoren',
            'media': 'Medien',
            'security': 'Sicherheit',
            'other': 'Sonstiges'
        };

        // Icons für Kategorien
        this.categoryIcons = {
            'lights': '💡',
            'climate': '🌡️',
            'switches': '🔌',
            'covers': '🪟',
            'fans': '🌀',
            'sensors': '📊',
            'media': '📺',
            'security': '🔒',
            'other': '📱'
        };

        this.searchInput = this.shadowRoot.getElementById('searchInput');
        this.resultsContainer = this.shadowRoot.getElementById('resultsContainer');
        this.noResults = this.shadowRoot.getElementById('noResults');

        this.searchInput.addEventListener('input', () => this.applyFilters());
        
        this.setupChipFilters();
    }

    updateDevices() {
        if (!this._hass) return;

        try {
            this.devices = [];
            
            if (this.useManualEntities) {
                // Manuelle Entitäten-Konfiguration verwenden
                this.loadManualEntities();
            } else {
                // Automatisches Laden aller verfügbaren Entitäten (wie vorher)
                this.loadAllEntities();
            }

            this.initializeFilters();
        } catch (error) {
            console.error('Fehler beim Laden der Geräte:', error);
            this.showConfigError('Fehler beim Laden der Geräte: ' + error.message);
        }
    }

    loadManualEntities() {
        this.config.entities.forEach(entityConfig => {
            // Validierung der Entitätskonfiguration
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
                config: entityConfig // Originalkonfiguration beibehalten
            };

            // Spezifische Attribute je nach Domain hinzufügen
            this.addDomainSpecificAttributes(device, domain, state);
            
            this.devices.push(device);
        });
    }

    loadAllEntities() {
        // Originale Logik für automatisches Laden
        Object.keys(this._hass.states).forEach(entityId => {
            const state = this._hass.states[entityId];
            const domain = entityId.split('.')[0];
            
            // Skip unwanted domains
            if (['automation', 'script', 'zone', 'person'].includes(domain)) return;
            
            const device = {
                id: entityId,
                name: state.attributes.friendly_name || entityId,
                type: domain,
                category: this.mapDomainToCategory(domain),
                room: state.attributes.room || 'Unbekannt',
                state: state.state,
                attributes: state.attributes,
                icon: this.getDeviceIcon(domain, state)
            };

            this.addDomainSpecificAttributes(device, domain, state);
            this.devices.push(device);
        });
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
        // Bereiche/Räume initialisieren
        const rooms = [...new Set(this.devices.map(d => d.room))].sort();
        this.setupRoomChips(rooms);
        
        // Kategorien initialisieren
        const categories = [...new Set(this.devices.map(d => d.category))].sort();
        this.setupCategoryChips(categories);

        this.applyFilters();
    }

    setupRoomChips(rooms) {
        const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
        
        // Vorhandene Chips löschen (außer "Alle")
        const existingChips = roomChips.querySelectorAll('.room-chip-small:not([data-value=""])');
        existingChips.forEach(chip => chip.remove());
        
        // Neue Raum-Chips hinzufügen
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
        
        // Vorhandene Chips löschen (außer "Alle")
        const existingChips = categoryChips.querySelectorAll('.filter-chip:not([data-value=""])');
        existingChips.forEach(chip => chip.remove());
        
        // Neue Kategorie-Chips hinzufügen
        categories.forEach(category => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-value', category);
            
            const stats = this.getCategoryStats(category);
            const icon = this.categoryIcons[category] || '📱';
            
            chip.innerHTML = `
                <div class="chip-icon">${icon}</div>
                <div class="chip-content">
                    <div class="chip-type-name">${this.categoryNames[category] || category}</div>
                    <div class="chip-count">${stats}</div>
                </div>
            `;
            
            categoryChips.appendChild(chip);
        });
    }

    setupChipFilters() {
        // Raum-Filter (Mehrfachauswahl)
        this.shadowRoot.getElementById('roomChipsInSearch').addEventListener('click', (e) => {
            if (e.target.classList.contains('room-chip-small')) {
                this.handleRoomChipClick(e.target);
            }
        });

        // Kategorie-Filter
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
            // "Alle" wurde geklickt
            this.selectedRooms.clear();
            const chips = this.shadowRoot.querySelectorAll('#roomChipsInSearch .room-chip-small');
            chips.forEach(chip => chip.classList.remove('active'));
            chip.classList.add('active');
        } else {
            // Spezifischer Raum wurde geklickt
            const alleChip = this.shadowRoot.querySelector('#roomChipsInSearch .room-chip-small[data-value=""]');
            alleChip.classList.remove('active');
            
            if (this.selectedRooms.has(value)) {
                this.selectedRooms.delete(value);
                chip.classList.remove('active');
            } else {
                this.selectedRooms.add(value);
                chip.classList.add('active');
            }
            
            // Wenn keine Räume selektiert, "Alle" aktivieren
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
        
        let filteredDevices = this.devices.filter(device => {
            // Textsuche
            const matchesSearch = !query || 
                device.name.toLowerCase().includes(query) ||
                device.type.toLowerCase().includes(query) ||
                device.room.toLowerCase().includes(query) ||
                device.category.toLowerCase().includes(query);
            
            // Raum-Filter
            const matchesRoom = this.selectedRooms.size === 0 || this.selectedRooms.has(device.room);
            
            // Kategorie-Filter
            const matchesType = !this.selectedType || device.category === this.selectedType;
            
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

    showConfigError(message) {
        this.resultsContainer.innerHTML = `<div class="config-error">${message}</div>`;
    }

    displayDevices(deviceList) {
        this.resultsContainer.innerHTML = '';
        
        // Nach Raum und dann nach Name sortieren
        const sortedDevices = deviceList.sort((a, b) => {
            if (a.room !== b.room) {
                return a.room.localeCompare(b.room);
            }
            return a.name.localeCompare(b.name);
        });
        
        // Nach Räumen gruppieren
        const devicesByRoom = {};
        sortedDevices.forEach(device => {
            if (!devicesByRoom[device.room]) {
                devicesByRoom[device.room] = [];
            }
            devicesByRoom[device.room].push(device);
        });
        
        // Raum-Gruppen erstellen
        Object.keys(devicesByRoom).forEach(room => {
            const roomGroup = document.createElement('div');
            roomGroup.className = 'room-group';
            
            const roomHeader = document.createElement('div');
            roomHeader.className = 'room-header';
            roomHeader.textContent = room;
            roomGroup.appendChild(roomHeader);
            
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
        
        // Click-Handler für Geräteinteraktion
        element.addEventListener('click', () => {
            this.toggleDevice(device);
        });
        
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

    toggleDevice(device) {
        if (!this._hass) return;
        
        const domain = device.type;
        const entityId = device.id;
        
        // Standard Toggle-Services für verschiedene Domains
        const serviceMap = {
            'light': 'light.toggle',
            'switch': 'switch.toggle',
            'fan': 'fan.toggle',
            'media_player': 'media_player.media_play_pause',
            'cover': device.state === 'open' ? 'cover.close_cover' : 'cover.open_cover'
        };
        
        const service = serviceMap[domain];
        if (service) {
            const [serviceDomain, serviceAction] = service.split('.');
            this._hass.callService(serviceDomain, serviceAction, {
                entity_id: entityId
            });
        }
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
        const devicesOfCategory = this.devices.filter(d => d.category === category);
        const total = devicesOfCategory.length;
        
        switch (category) {
            case 'lights':
                const lightsOn = devicesOfCategory.filter(d => d.state === 'on').length;
                return `${lightsOn} An`;
                
            case 'switches':
                const switchesOn = devicesOfCategory.filter(d => d.state === 'on').length;
                return `${switchesOn} Ein`;
                
            case 'covers':
                const coversOpen = devicesOfCategory.filter(d => d.state === 'open').length;
                return `${coversOpen} Offen`;
                
            case 'climate':
                const climateOn = devicesOfCategory.filter(d => d.state === 'heat' || d.state === 'cool').length;
                return `${climateOn} Aktiv`;
                
            case 'fans':
                const fansOn = devicesOfCategory.filter(d => d.state === 'on').length;
                return `${fansOn} An`;
                
            case 'media':
                const mediaPlaying = devicesOfCategory.filter(d => d.state === 'playing').length;
                return `${mediaPlaying} Aktiv`;
                
            case 'sensors':
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
        return {
            title: "Geräte suchen",
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

// Tell Home Assistant about this card
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Eine moderne Suchkarte für Home Assistant mit individueller Entitätskonfiguration'
});

console.info(
    `%c FAST-SEARCH-CARD %c v2.0.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);
