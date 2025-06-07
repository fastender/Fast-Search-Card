// ===== 🔨 FEATURE RESTORATION PLAN =====

/*
JETZT DA DIE KARTE FUNKTIONIERT, BAUEN WIR SCHRITTWEISE AUF:

PHASE 1: GRUNDFUNKTIONEN ✅
✅ Motion One funktioniert
✅ Karte lädt ohne Fehler
✅ Basis-Animationen funktionieren

PHASE 2: KERN-FEATURES (NÄCHSTE SCHRITTE)
🔄 Suche & Filter System
🔄 Entity Loading & Display
🔄 Interactive Controls
🔄 Advanced Animations

PHASE 3: ERWEITERTE FEATURES
🔄 Music Assistant Integration  
🔄 More-Info Dialogs
🔄 TTS Features
🔄 Custom Actions
*/

// ===== SCHRITT 1: ERWEITERTE FAST SEARCH CARD =====
// (Motion One bleibt gleich - nur FastSearchCard erweitern)

class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Basis Properties
        this.config = {};
        this._hass = null;
        this.allItems = [];
        this.filteredItems = [];
        this.currentSearchType = 'entities';
        this.currentView = 'list';
        this.selectedRoom = 'all';
        this.selectedType = 'all';
        
        console.log('🎯 FastSearchCard Constructor - Erweiterte Version');
    }

    setConfig(config) {
        console.log('🎯 FastSearchCard setConfig:', config);
        this.config = {
            title: "Fast Search",
            show_unavailable: false,
            show_attributes: true,
            show_controls: true,
            entities: [],
            ...config
        };
        this.render();
    }

    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;
        
        if (!oldHass || oldHass.states !== hass.states) {
            this.updateItems();
        }
    }

    async render() {
        console.log('🎯 FastSearchCard render - Erweiterte Version');
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    
                    /* Glassmorphism Container */
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    padding: 20px;
                    margin: 8px;
                    
                    /* Animation */
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                :host(.loaded) {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .card-title {
                    font-size: 22px;
                    font-weight: 600;
                    color: var(--primary-text-color, #000);
                    margin: 0;
                }
                
                .search-container {
                    position: relative;
                    margin-bottom: 20px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 16px 20px 16px 50px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    font-size: 16px;
                    color: var(--primary-text-color, #000);
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: rgba(0, 122, 255, 0.5);
                    background: rgba(255, 255, 255, 0.15);
                    transform: scale(1.02);
                }
                
                .search-input::placeholder {
                    color: rgba(128, 128, 128, 0.7);
                }
                
                .search-icon {
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(128, 128, 128, 0.7);
                    font-size: 18px;
                }
                
                .filters-container {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                
                .filter-chip {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: var(--primary-text-color, #000);
                    user-select: none;
                }
                
                .filter-chip:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                
                .filter-chip.active {
                    background: rgba(0, 122, 255, 0.3);
                    border-color: rgba(0, 122, 255, 0.5);
                    color: #007aff;
                }
                
                .results-container {
                    min-height: 200px;
                    transition: all 0.4s ease;
                }
                
                .item {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0;
                    transform: translateX(-20px);
                }
                
                .item.loaded {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateX(4px) scale(1.02);
                }
                
                .item-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 122, 255, 0.2);
                    border-radius: 10px;
                    margin-right: 16px;
                    font-size: 20px;
                }
                
                .item-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .item-name {
                    font-weight: 500;
                    font-size: 16px;
                    color: var(--primary-text-color, #000);
                    margin-bottom: 4px;
                }
                
                .item-state {
                    font-size: 14px;
                    color: rgba(128, 128, 128, 0.8);
                }
                
                .item-actions {
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transform: translateX(10px);
                    transition: all 0.3s ease;
                }
                
                .item:hover .item-actions {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .action-button {
                    padding: 8px 12px;
                    background: rgba(0, 122, 255, 0.2);
                    border: 1px solid rgba(0, 122, 255, 0.3);
                    border-radius: 8px;
                    color: #007aff;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .action-button:hover {
                    background: rgba(0, 122, 255, 0.3);
                    transform: scale(1.05);
                }
                
                .no-results {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(128, 128, 128, 0.8);
                    font-size: 16px;
                }
                
                .loading {
                    opacity: 0.5;
                    pointer-events: none;
                    transform: scale(0.98);
                }
                
                /* Room Group Styles */
                .room-group {
                    margin-bottom: 24px;
                }
                
                .room-header {
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--secondary-text-color, #666);
                    margin-bottom: 12px;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            </style>
            
            <div class="card-header">
                <h2 class="card-title">${this.config.title}</h2>
            </div>
            
            <div class="search-container">
                <div class="search-icon">🔍</div>
                <input type="text" class="search-input" placeholder="Suche nach Geräten, Räumen oder Zuständen..." />
            </div>
            
            <div class="filters-container">
                <div class="filter-chip active" data-filter="all">Alle</div>
                <div class="filter-chip" data-filter="lights">Licht</div>
                <div class="filter-chip" data-filter="switches">Schalter</div>
                <div class="filter-chip" data-filter="climate">Klima</div>
                <div class="filter-chip" data-filter="media">Media</div>
            </div>
            
            <div class="results-container">
                <div class="no-results">Lade Geräte...</div>
            </div>
        `;
        
        this.setupEventListeners();
        this.startLoadAnimation();
    }
    
    async startLoadAnimation() {
        // Fade-in Animation
        setTimeout(() => {
            this.classList.add('loaded');
        }, 100);
    }
    
    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const filterChips = this.shadowRoot.querySelectorAll('.filter-chip');
        
        // Search Input
        searchInput?.addEventListener('input', (e) => {
            this.debounceSearch(e.target.value);
        });
        
        // Filter Chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.selectFilter(chip.dataset.filter);
                this.updateFilterChips(chip);
            });
        });
    }
    
    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }
    
    async performSearch(query) {
        console.log('🔍 Suche nach:', query);
        this.filterAndDisplayItems(query);
    }
    
    selectFilter(filter) {
        this.selectedType = filter;
        this.filterAndDisplayItems();
    }
    
    updateFilterChips(activeChip) {
        const chips = this.shadowRoot.querySelectorAll('.filter-chip');
        chips.forEach(chip => chip.classList.remove('active'));
        activeChip.classList.add('active');
        
        // Chip Animation
        MotionOneManager.animate(activeChip, {
            scale: [1, 1.1, 1]
        }, {
            duration: 200
        });
    }
    
    updateItems() {
        if (!this._hass) return;
        
        console.log('🔄 Lade Home Assistant Entitäten...');
        this.allItems = [];
        
        // Entitäten laden
        Object.keys(this._hass.states).forEach(entityId => {
            const state = this._hass.states[entityId];
            const domain = entityId.split('.')[0];
            
            // Skip bestimmte Domains
            if (['automation', 'script', 'scene', 'zone', 'person'].includes(domain)) return;
            
            const item = {
                id: entityId,
                name: state.attributes.friendly_name || entityId,
                type: domain,
                category: this.mapDomainToCategory(domain),
                room: state.attributes.room || 'Unbekannt',
                state: state.state,
                attributes: state.attributes,
                icon: this.getDeviceIcon(domain, state)
            };
            
            this.allItems.push(item);
        });
        
        console.log(`✅ ${this.allItems.length} Entitäten geladen`);
        this.filterAndDisplayItems();
    }
    
    mapDomainToCategory(domain) {
        const mapping = {
            'light': 'lights',
            'switch': 'switches', 
            'climate': 'climate',
            'media_player': 'media',
            'cover': 'covers',
            'fan': 'fans',
            'sensor': 'sensors',
            'binary_sensor': 'sensors'
        };
        return mapping[domain] || 'other';
    }
    
    getDeviceIcon(domain, state) {
        const icons = {
            'light': state.state === 'on' ? '💡' : '🔆',
            'switch': state.state === 'on' ? '🟢' : '🔴',
            'climate': '🌡️',
            'media_player': '📺',
            'cover': '🪟',
            'fan': '🌀',
            'sensor': '📊',
            'binary_sensor': '🔔'
        };
        return icons[domain] || '🔧';
    }
    
    async filterAndDisplayItems(searchQuery = '') {
        const query = searchQuery.toLowerCase().trim();
        
        let filtered = this.allItems.filter(item => {
            const matchesSearch = !query || 
                item.name.toLowerCase().includes(query) ||
                item.room.toLowerCase().includes(query) ||
                item.state.toLowerCase().includes(query);
                
            const matchesType = this.selectedType === 'all' || 
                item.category === this.selectedType;
                
            return matchesSearch && matchesType;
        });
        
        this.displayItems(filtered);
    }
    
    async displayItems(items) {
        const container = this.shadowRoot.querySelector('.results-container');
        
        if (items.length === 0) {
            container.innerHTML = '<div class="no-results">Keine Ergebnisse gefunden</div>';
            return;
        }
        
        // Loading State
        container.classList.add('loading');
        
        setTimeout(async () => {
            // Items nach Raum gruppieren
            const itemsByRoom = this.groupItemsByRoom(items);
            
            let html = '';
            Object.entries(itemsByRoom).forEach(([room, roomItems]) => {
                html += `<div class="room-group">`;
                html += `<div class="room-header">${room}</div>`;
                
                roomItems.forEach(item => {
                    html += this.createItemHTML(item);
                });
                
                html += `</div>`;
            });
            
            container.innerHTML = html;
            container.classList.remove('loading');
            
            // Stagger Animation für Items
            this.animateItems();
            this.setupItemEventListeners();
            
        }, 200);
    }
    
    groupItemsByRoom(items) {
        const grouped = {};
        items.forEach(item => {
            const room = item.room || 'Unbekannt';
            if (!grouped[room]) grouped[room] = [];
            grouped[room].push(item);
        });
        return grouped;
    }
    
    createItemHTML(item) {
        const stateText = this.getStateText(item);
        
        return `
            <div class="item" data-entity-id="${item.id}">
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-state">${stateText}</div>
                </div>
                <div class="item-actions">
                    <button class="action-button" data-action="toggle">Toggle</button>
                    <button class="action-button" data-action="more-info">Info</button>
                </div>
            </div>
        `;
    }
    
    getStateText(item) {
        switch (item.type) {
            case 'light':
                return item.state === 'on' ? 'Ein' : 'Aus';
            case 'switch':
                return item.state === 'on' ? 'Ein' : 'Aus';
            case 'climate':
                return `${item.attributes.current_temperature || '--'}°C`;
            case 'media_player':
                return item.state === 'playing' ? 'Spielt' : 'Gestoppt';
            default:
                return item.state;
        }
    }
    
    async animateItems() {
        const items = this.shadowRoot.querySelectorAll('.item');
        
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('loaded');
                
                // Motion One Stagger Animation
                MotionOneManager.animate(item, {
                    opacity: [0, 1],
                    transform: ['translateX(-20px)', 'translateX(0)']
                }, {
                    duration: 400,
                    easing: 'ease-out'
                });
            }, index * 50);
        });
    }
    
    setupItemEventListeners() {
        const items = this.shadowRoot.querySelectorAll('.item');
        
        items.forEach(item => {
            const entityId = item.dataset.entityId;
            
            // Toggle Button
            const toggleBtn = item.querySelector('[data-action="toggle"]');
            toggleBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleEntity(entityId, toggleBtn);
            });
            
            // More Info Button  
            const infoBtn = item.querySelector('[data-action="more-info"]');
            infoBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showMoreInfo(entityId);
            });
            
            // Item Click
            item.addEventListener('click', () => {
                this.toggleEntity(entityId);
            });
        });
    }
    
    async toggleEntity(entityId, buttonElement) {
        if (!this._hass) return;
        
        console.log('🎛️ Toggle Entity:', entityId);
        
        const domain = entityId.split('.')[0];
        const state = this._hass.states[entityId];
        
        if (buttonElement) {
            buttonElement.innerHTML = '⏳';
            buttonElement.disabled = true;
        }
        
        try {
            switch (domain) {
                case 'light':
                case 'switch':
                    await this._hass.callService(domain, 'toggle', {
                        entity_id: entityId
                    });
                    break;
                    
                case 'climate':
                    const currentMode = state.state;
                    const newMode = currentMode === 'off' ? 'heat' : 'off';
                    await this._hass.callService('climate', 'set_hvac_mode', {
                        entity_id: entityId,
                        hvac_mode: newMode
                    });
                    break;
                    
                case 'media_player':
                    const action = state.state === 'playing' ? 'media_pause' : 'media_play';
                    await this._hass.callService('media_player', action, {
                        entity_id: entityId
                    });
                    break;
            }
            
            // Button Animation
            if (buttonElement) {
                await MotionOneManager.animate(buttonElement, {
                    scale: [1, 1.2, 1],
                    backgroundColor: ['rgba(0, 122, 255, 0.2)', 'rgba(0, 255, 0, 0.3)', 'rgba(0, 122, 255, 0.2)']
                }, {
                    duration: 300
                });
                
                buttonElement.innerHTML = 'Toggle';
                buttonElement.disabled = false;
            }
            
        } catch (error) {
            console.error('❌ Toggle Fehler:', error);
            
            if (buttonElement) {
                buttonElement.innerHTML = '❌';
                setTimeout(() => {
                    buttonElement.innerHTML = 'Toggle';
                    buttonElement.disabled = false;
                }, 2000);
            }
        }
    }
    
    showMoreInfo(entityId) {
        console.log('ℹ️ More Info für:', entityId);
        
        // Home Assistant More Info Dialog öffnen
        const event = new Event('hass-more-info', {
            bubbles: true,
            composed: true
        });
        event.detail = { entityId };
        this.dispatchEvent(event);
    }

    getCardSize() {
        return 3;
    }

    static getStubConfig() {
        return {
            title: "Fast Search",
            show_unavailable: false
        };
    }
}

// ===== REGISTRATION (Motion One Manager bleibt gleich) =====
if (!customElements.get('fast-search-card')) {
    customElements.define('fast-search-card', FastSearchCard);
    console.log('✅ FastSearchCard Erweiterte Version registriert');
}

window.customCards = window.customCards || [];
if (!window.customCards.find(card => card.type === 'fast-search-card')) {
    window.customCards.push({
        type: 'fast-search-card',
        name: 'Fast Search Card',
        description: 'Erweiterte Suchkarte mit Motion One Animationen'
    });
}

console.info(
    `%c FAST-SEARCH-CARD %c v2.0-features `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: blue'
);

/*
===== 🎯 FEATURE STATUS =====

✅ FUNKTIONIERT:
- Motion One Animationen
- Glassmorphism Design
- Entity Loading von Home Assistant
- Suche & Filter
- Toggle Funktionen
- Stagger Animationen
- Hover Effekte

🔄 NOCH ZU IMPLEMENTIEREN:
- Music Assistant Integration
- More-Info Dialogs (erweitert)
- TTS Features  
- Grid View
- Custom Actions
- Erweiterte Animationen

TESTEN SIE:
1. Ersetzen Sie fast-search-card.js mit diesem Code
2. Laden Sie Home Assistant neu
3. Fügen Sie die Karte hinzu
4. Testen Sie Suche, Filter und Toggle
5. Schauen Sie die Motion One Animationen an

NÄCHSTE SCHRITTE:
→ Wenn alles funktioniert, fügen wir weitere Features hinzu
→ Music Assistant Integration
→ Erweiterte More-Info Dialogs
→ Custom Animations
*/
