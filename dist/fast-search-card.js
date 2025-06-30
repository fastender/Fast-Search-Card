// MiniSearch Local Implementation (~5KB)
// Source: https://github.com/lucaong/minisearch (MIT License)
class MiniSearch {
    constructor(options = {}) {
        this.fields = options.fields || [];
        this.storeFields = options.storeFields || this.fields;
        this.searchOptions = options.searchOptions || {};
        this.idField = options.idField || 'id';
        
        this.documentCount = 0;
        this.documentIds = {};
        this.fieldIds = {};
        this.fieldLength = {};
        this.averageFieldLength = {};
        this.storedFields = {};
        this.index = {};
        this.termCount = 0;

        // Nur Memory initialisieren
        this.customTimers = {};        
        
        this.extractField = (document, fieldName) => {
            return fieldName.split('.').reduce((doc, key) => doc && doc[key], document);
        };
    }
    
    add(document) {
        const id = this.extractField(document, this.idField);
        if (this.documentIds[id]) {
            this.discard(id);
        }
        
        this.documentIds[id] = this.documentCount++;
        this.storedFields[id] = {};
        
        for (const field of this.storeFields) {
            this.storedFields[id][field] = this.extractField(document, field);
        }
        
        for (const field of this.fields) {
            const value = this.extractField(document, field);
            if (value == null) continue;
            
            const text = String(value).toLowerCase();
            const tokens = this.tokenize(text);
            
            if (!this.fieldIds[field]) {
                this.fieldIds[field] = Object.keys(this.fieldIds).length;
                this.fieldLength[field] = {};
                this.averageFieldLength[field] = 0;
            }
            
            this.fieldLength[field][id] = tokens.length;
            
            for (const token of tokens) {
                this.addTerm(token, id, field);
            }
        }
        
        this.updateAverageFieldLength();
    }
    
    addAll(documents) {
        for (const document of documents) {
            this.add(document);
        }
    }
    
    search(query, options = {}) {
        const searchOptions = { ...this.searchOptions, ...options };
        const queryTokens = this.tokenize(query.toLowerCase());
        const results = new Map();
        
        for (const token of queryTokens) {
            const matches = this.searchToken(token, searchOptions);
            
            for (const [id, score] of matches) {
                if (results.has(id)) {
                    results.set(id, results.get(id) + score);
                } else {
                    results.set(id, score);
                }
            }
        }
        
        return Array.from(results.entries())
            .map(([id, score]) => ({ ...this.storedFields[id], score }))
            .sort((a, b) => b.score - a.score);
    }
    
    tokenize(text) {
        return text.split(/\W+/).filter(token => token.length > 0);
    }
    
    addTerm(term, docId, field) {
        if (!this.index[term]) {
            this.index[term] = {};
        }
        if (!this.index[term][field]) {
            this.index[term][field] = {};
        }
        if (!this.index[term][field][docId]) {
            this.index[term][field][docId] = 0;
        }
        this.index[term][field][docId]++;
    }
    
    searchToken(token, options) {
        const results = new Map();
        const boost = options.boost || {};
        const fuzzy = options.fuzzy || 0;
        
        // Exact matches
        if (this.index[token]) {
            for (const field in this.index[token]) {
                const fieldBoost = boost[field] || 1;
                for (const docId in this.index[token][field]) {
                    const tf = this.index[token][field][docId];
                    const score = tf * fieldBoost;
                    const currentScore = results.get(docId) || 0;
                    results.set(docId, currentScore + score);
                }
            }
        }
        
        // Fuzzy matches
        if (fuzzy > 0) {
            for (const indexedToken in this.index) {
                if (indexedToken === token) continue;
                
                const similarity = this.fuzzyMatch(token, indexedToken);
                if (similarity >= fuzzy) {
                    for (const field in this.index[indexedToken]) {
                        const fieldBoost = (boost[field] || 1) * similarity * 0.8; // Fuzzy penalty
                        for (const docId in this.index[indexedToken][field]) {
                            const tf = this.index[indexedToken][field][docId];
                            const score = tf * fieldBoost;
                            const currentScore = results.get(docId) || 0;
                            results.set(docId, currentScore + score);
                        }
                    }
                }
            }
        }
        
        return results;
    }
    
    fuzzyMatch(a, b) {
        if (a === b) return 1;
        if (a.length === 0 || b.length === 0) return 0;
        
        // Simple fuzzy matching - checks if all characters of 'a' appear in 'b' in order
        let aIndex = 0;
        for (let bIndex = 0; bIndex < b.length && aIndex < a.length; bIndex++) {
            if (a[aIndex] === b[bIndex]) {
                aIndex++;
            }
        }
        
        if (aIndex === a.length) {
            return Math.max(0.3, 1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length));
        }
        
        return 0;
    }
    
    updateAverageFieldLength() {
        for (const field in this.fieldLength) {
            const lengths = Object.values(this.fieldLength[field]);
            this.averageFieldLength[field] = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
        }
    }
    
    discard(id) {
        delete this.documentIds[id];
        delete this.storedFields[id];
        
        for (const field in this.fieldLength) {
            delete this.fieldLength[field][id];
        }
        
        // Remove from index (simplified)
        for (const term in this.index) {
            for (const field in this.index[term]) {
                delete this.index[term][field][id];
                if (Object.keys(this.index[term][field]).length === 0) {
                    delete this.index[term][field];
                }
            }
            if (Object.keys(this.index[term]).length === 0) {
                delete this.index[term];
            }
        }
        
        this.updateAverageFieldLength();
    }
}





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
        this.currentViewMode = 'grid';
        this.subcategoryMode = 'categories';

        // Filter UI State
        this.isFilterOpen = false;
        this.filterOpenTimeout = null;        

        // Circular Slider State
        this.circularSliders = {};
        this.lightUpdateTimeout = null;
        this.coverUpdateTimeout = null; // Hinzugefügt für Rollladen
        this.climateUpdateTimeout = null;
        this.mediaUpdateTimeout = null;  // NEU HINZUFÜGEN
        this.mediaPositionUpdateInterval = null;        

        // --- NEU: Music Assistant State ---
        this.musicAssistantSearchTimeout = null;
        this.musicAssistantEnqueueMode = 'play'; // 'play', 'add', 'next'
        this.maListenersAttached = new WeakSet(); // Verhindert doppelte Event Listeners
        this.lastMusicAssistantResults = null; // Cache für Suchergebnisse
        this.musicAssistantConfigEntryId = null; // Cache für die Config Entry ID       

        // NEU HINZUFÜGEN: MiniSearch Integration
        this.searchIndex = null;
        this.searchOptions = {
            fields: ['name', 'area', 'id'],
            storeFields: ['id', 'name', 'domain', 'category', 'area', 'state', 'attributes', 'icon', 'isActive'],
            idField: 'id',
            searchOptions: {
                boost: { 
                    name: 1.0,    // Höchste Priorität für Gerätename
                    area: 0.7,    // Mittlere Priorität für Raum
                    id: 0.3       // Niedrigste Priorität für ID
                },
                fuzzy: 0.3        // Fuzzy-Threshold (0-1, niedriger = strenger)
            }
        };    
        
        // NEU: Autocomplete State
        this.currentSuggestion = '';
        this.autocompleteTimeout = null;        
    }

    setConfig(config) {
        if (!config) {
            throw new Error('Configuration is required');
        }
    
        // Erweiterte Standardkonfiguration
        this._config = {
            title: 'Fast Search',
            default_view: 'grid',
            
            // NEU: Auto-Discovery Options
            auto_discover: false,
            include_domains: ['light', 'switch', 'media_player', 'cover', 'climate', 'fan', 'script', 'automation', 'scene'],
            exclude_domains: [],
            exclude_entities: [],
            include_areas: [], // Leer = alle Areas
            exclude_areas: [],
            
            // Bestehend: Manual entities (optional)
            entities: config.entities || [],

            custom_mode: {
                enabled: false,
                data_sources: [],
                data_source: null,
                category_name: 'Custom',
                icon: '📄', 
                area: 'Custom',
                ...config.custom_mode
            },
                                
            ...config
        };
        
        // Erweiterte Validierung
        const hasAutoDiscover = this._config.auto_discover;
        const hasEntities = this._config.entities && this._config.entities.length > 0;
        const hasCustomMode = this._config.custom_mode && this._config.custom_mode.enabled;
        
        // NEU: Custom Mode Validierung
        let hasValidCustomData = false;
        if (hasCustomMode) {
            const hasMultipleSources = this._config.custom_mode.data_sources && 
                                      this._config.custom_mode.data_sources.length > 0;
            const hasLegacySource = this._config.custom_mode.data_source;
            hasValidCustomData = hasMultipleSources || hasLegacySource;
        }
        
        if (!hasAutoDiscover && !hasEntities && !hasValidCustomData) {
            throw new Error('Either auto_discover must be true, entities must be provided, or custom_mode must be enabled with valid data sources');
        }
        
        this.currentViewMode = this._config.default_view || 'grid';
        this.render();
    }

    set hass(hass) {
        if (!hass) return;
        
        const oldHass = this._hass;
        this._hass = hass;

        // NEU: Beim ersten Laden Timer aus Input Helper laden
        if (!oldHass && hass) {
            setTimeout(() => {
                this.loadTimersFromInputHelper();
            }, 100);
        }        
        
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
                --accent-light: rgba(255, 255, 255, 0.35);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                --neumorphic-base: #2c2f33;
                --neumorphic-shadow-dark: #23272b;
                --neumorphic-shadow-light: #35373b;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .glass-panel {
                position: relative;
                border-radius: 35px;
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
                height: 700px;
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
                max-height: 700px; 
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
                position: sticky;
                top: 0; 
                z-index: 2;
                background-color: rgba(255, 255, 255, 0.01);
            }

            .search-wrapper::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 20px;
                right: 20px;
                height: 1px;
                background-color: rgba(255, 255, 255, 0.1);
            }            

            .category-icon {
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0); 
                flex-shrink: 0;
                transition: all 0.2s ease;
            }

            .category-icon:hover {
                background: rgba(255, 255, 255, 0);
                transform: scale(1.05);
            }

            .category-icon svg {
                width: 24px;
                height: 24px;
                stroke: var(--text-secondary);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }




            .search-input-container {
                position: relative;
                flex: 1;
                min-width: 0;
            }
            
            .search-input {
                flex: 1;
                border: none;
                background: transparent;
                outline: none;
                font-size: 24px;
                color: var(--text-primary);
                font-family: inherit;
                min-width: 0;
                position: relative;
                z-index: 2;
                background: transparent;
            }
            
            .search-input::placeholder {
                color: var(--text-secondary);
            }

            .search-input.filter-active {
                pointer-events: none;
                opacity: 0.5;
                cursor: default;
            }            
            
            .search-suggestion {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: none;
                background: transparent;
                outline: none;
                font-size: 24px;
                font-family: inherit;
                color: rgba(255, 255, 255, 0.4);
                pointer-events: none;
                z-index: 1;
                white-space: nowrap;
                overflow: hidden;
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

            /* Filter Container & Animation Styles */
            .filter-container {
                position: relative;
                display: flex;
                align-items: center;
                gap: 0;
            }
            
            .filter-main-button {
                width: 44px;
                height: 44px;
                border: none;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                z-index: 10;
                flex-shrink: 0;
            }
            
            .filter-main-button:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.05);
            }
            
            .filter-main-button.active {
                background: var(--accent);
            }
            
            .filter-main-button svg {
                width: 20px;
                height: 20px;
                stroke: rgba(255, 255, 255, 0.8);
                stroke-width: 1.5;
            }
            
            .filter-groups {
                position: absolute;
                right: 100%;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                align-items: center;
                gap: 12px;
                margin-right: 12px;
                opacity: 0;
                pointer-events: none;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .filter-groups.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .filter-group {
                display: flex;
                align-items: center;
                gap: 3px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 60px;
                padding: 10px 0px 10px 0px;
                border: 0px solid rgba(255, 255, 255, 0);
                transform: translateX(20px) scale(0.8);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                height: 25px;
            }
            
            .filter-groups.visible .filter-group {
                transform: translateX(0) scale(1);
            }
            
            .filter-groups.visible .filter-group:nth-child(1) {
                transition-delay: 0.1s;
            }
            
            .filter-groups.visible .filter-group:nth-child(2) {
                transition-delay: 0.2s;
            }
            
            .filter-button {
                width: 45px;
                height: 45px;
                border: none;
                background: rgba(255, 255, 255, 0);
                border-radius: 60px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3px;
                transition: all 0.2s ease;
                padding: 0px;
                box-sizing: border-box;
            }
            
            .filter-button:hover {
                background: rgba(0, 0, 0, 0.25);
            }
            
            .filter-button.active {
                background: rgba(0, 0, 0, 0.35);
            }
            
            .filter-button svg {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
            }
            
            .filter-button-label {
                font-size: 8px;
                font-weight: 500;
                color: white;
                text-align: center;
                line-height: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                display: none;
            }
            

            .subcategories {
                display: flex;
                gap: 8px;
                padding: 5px 20px 16px 20px;
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
                padding: 5px 15px 5px 15px;
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.2s ease;
                text-align: center;
                height: 30px;
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
                line-height: 1.1;
                gap: 2px;
                color: var(--text-primary);
            }

            .subcategory-name {
                font-size: 12px;
                font-weight: 600;
            }

            .subcategory-status {
                font-size: 12px;
                color: var(--text-secondary);
                opacity: 0.9;
                min-height: 13px;
            }

            .subcategory-chip.active .subcategory-status {
                color: var(--text-primary);
            }
            
            .subcategory-chip.active .chip-content {
                 color: var(--text-primary);
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
                grid-template-columns: repeat(auto-fill, minmax(144px, 1fr));
                gap: 14px;
                min-height: 200px;
                padding-left: 20px; 
                padding-right: 20px; 
            }

            .area-header {
                grid-column: 1 / -1;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 16px 0 0px 0;
                padding-top: 8px;
                border-bottom: 0px solid rgba(255, 255, 255, 0.1);
            }

            .area-header:first-child {
                margin-top: 0;
            }

            .device-card {
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
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
                margin: 0 0 0 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.1;
            }

            .device-status {
                font-size: 13px;
                color: var(--text-secondary);
                margin: 0;
                opacity: 0.8;
                line-height: 1.1;
            }

            .device-card.active .device-status {
                color: var(--text-secondary);
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
                padding: 22px 20px;
            }

            .detail-right {
                flex: 1;
                display: flex;
                flex-direction: column;
                border-radius: 0 24px 24px 0; 
                box-sizing: border-box;
                overflow: hidden;
            }
            
            .detail-left-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
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
                width: 500px;
                height: 500px;
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
                flex: 1;
                min-width: 0;
                text-align: left;
                margin-top: 0;
            }
            .detail-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0px;
                line-height: 1.05em;
            }
            
            .detail-area {
                font-size: 15px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 0;
                line-height: 1.05em;
            }
            
            .detail-info-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
                margin-top: 20px;
            }
            
            .category-buttons {
                display: none;
                flex-direction: row;
                gap: 12px;
                opacity: 0;
                transform: translateX(20px);
            }

            .category-buttons.visible {
                display: flex;
            }

            .category-button {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                background: var(--glass-shadow);
            }
            
            .category-button:hover {
                transform: scale(1.05);
                background: var(--accent-light);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            }

            .category-button.active {
                background: var(--accent-light);
                
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
                stroke: var(--text-primary);
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
                justify-content: flex-end;
                padding-right: 20px;
                padding-top: 20px;
                padding-bottom: 10px;                
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
                overflow-y: hidden;
                padding: 20px;
                box-sizing: border-box;
                scrollbar-width: none;
                max-height: 100%;
            }
            #tab-content-container::-webkit-scrollbar { display: none; }

            .detail-tab-content { display: none; }
            .detail-tab-content.active { display: block; }
            
            .device-control-design {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0px;
                position: relative;
                z-index: 5;
            }

            .device-control-design[data-focus-mode] {
                position: relative;
                overflow: visible;
            }
            
            .device-control-presets.visible {
                z-index: 10;
                position: relative;
            }            

            .device-control-presets.cover-presets.visible {
                max-height: 150px;
                opacity: 1;
            }            


            /* Desktop: Desktop-Tabs zeigen, Mobile-Tabs verstecken */
            .desktop-tabs {
                display: block;
                display: flex;
                justify-content: flex-end;
                padding-right: 20px;
                padding-top: 20px;
                padding-bottom: 10px;
            }
            
            .mobile-tabs {
                display: none;
            }
            
            /* Mobile: Mobile-Tabs zeigen, Desktop-Tabs verstecken */
            @media (max-width: 768px) {
                .desktop-tabs {
                    display: none;
                }
                
                .mobile-tabs {
                    display: block;
                }
                
                .detail-content { 
                    flex-direction: column; 
                }
                
                .detail-divider { 
                    width: calc(100% - 40px);
                    height: 1px;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
                    margin: 10px 0px 0px 0px;
                    align-self: center;
                }
                
                .detail-left { 
                    padding: 16px; 
                    flex: none; 
                }

                
                .detail-left-header {
                    align-items: center;
                    gap: 12px;
                }
                
                .detail-info-row {
                    padding-left: 0;
                    justify-content: center;
                    margin-top: 20px;
                }

                
                .detail-right { 
                    padding: 0; 
                    border-radius: 0 0 24px 24px; 
                    margin: 0 10px 10px 10px;
                }
                
                #tab-content-container { 
                    flex-grow: 1;
                    overflow-y: hidden;
                    padding: 30px 10px;
                    box-sizing: border-box;
                    scrollbar-width: none;
                    max-height: 100%;
                }
                
                .icon-content { 
                    justify-content: flex-start; 
                }
                
                .icon-background-wrapper { 
                    width: 150px; 
                    height: 150px; 
                }
                
                .detail-title-area { 
                    margin-top: 5px; 
                }
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
            .device-control-presets.visible { max-height: 400px; opacity: 1; margin-top: 30px;}
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

            /* Media Player Individual Presets */
            .device-control-presets.music-assistant-presets,
            .device-control-presets.tts-presets {
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: all 0.4s ease;
                width: 100%;
                max-width: 500px;
            }
            
            .device-control-presets.music-assistant-presets.visible,
            .device-control-presets.tts-presets.visible {
                max-height: 500px;
                opacity: 1;
                margin-top: 16px;
            }
            
            .preset-content {
                padding: 20px;
                text-align: center;
                color: var(--text-secondary);
                font-size: 14px;
            }

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
            .climate-category-header {
                font-size: 14px; 
                font-weight: 600; 
                color: var(--text-secondary);
                padding: 0px;
                border-bottom: 0px solid rgba(255,255,255,0.1);
                margin-bottom: 8px;
            }            

            @media (max-width: 768px) {
                .detail-content { flex-direction: column; }                
                .detail-left { padding: 16px; flex: none; }
                .detail-right { padding: 0; border-radius: 0 0 24px 24px; margin: 0 10px 10px 10px;}
                .icon-content { justify-content: flex-start; }
            }

            /* Media Player Service Presets */
            .device-control-presets.media-services .device-control-presets-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }
            
            .device-control-preset.media-service {
                height: 80px;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 8px;
                border-radius: 16px;
                position: relative;
                overflow: hidden;
            }
            
            .device-control-preset.media-service svg {
                width: 24px;
                height: 24px;
            }
            
            .device-control-preset.media-service span {
                font-size: 12px;
                font-weight: 600;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }
            
            /* Media Player Circular Slider Color */
            .circular-slider-container.media .progress-fill {
                stroke: #1DB954 !important;
            }
            
            .circular-slider-container.media .handle {
                border-color: #1DB954 !important;
            }

            /* Media Position Display */
            .media-position-display {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 16px 0;
                width: 100%;
                max-width: 280px;
            }
            
            .current-time, .total-time {
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
                min-width: 35px;
                text-align: center;
            }
            
            .position-bar {
                flex: 1;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                position: relative;
            }
            
            .position-progress {
                height: 100%;
                background: #1DB954;
                border-radius: 2px;
                transition: width 0.3s ease;
            }       
            
            /* --- NEU: Music Assistant Specific Styles --- */
            .music-assistant-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 12px 4px;
            }
            .ma-search-bar-container {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0 8px;
            }
            .ma-search-input {
                flex-grow: 1;
                border: none;
                background: rgba(0,0,0,0.2);
                outline: none;
                color: var(--text-primary);
                font-size: 14px;
                padding: 10px 14px;
                border-radius: 10px;
                transition: background 0.2s ease, box-shadow 0.2s ease;
            }
            .ma-search-input:focus {
                background: rgba(0,0,0,0.3);
                box-shadow: 0 0 0 2px var(--accent);
            }
            .ma-search-input::placeholder {
                color: rgba(255,255,255,0.7);
            }
            
            .ma-enqueue-toggle {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                flex-shrink: 0;
                transition: transform 0.1s ease;
            }
            .ma-enqueue-toggle:active {
                transform: scale(0.9);
            }
            .ma-enqueue-toggle svg { width: 18px; height: 18px; }
            
            .ma-filter-chips {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                scrollbar-width: none;
                padding: 0 8px 4px 8px;
            }
            .ma-filter-chips::-webkit-scrollbar { display: none; }
            
            .ma-chip {
                padding: 6px 14px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                cursor: pointer;
                white-space: nowrap;
                flex-shrink: 0;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 500;
                color: var(--text-secondary);
            }
            .ma-chip:hover {
                background: rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
            }
            .ma-chip.active {
                background: var(--accent);
                border-color: var(--accent);
                color: white;
            }
            
            .ma-results-container {
                min-height: 250px;
                max-height: 300px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
                padding: 0 8px;
            }
             .ma-results-container::-webkit-scrollbar { width: 4px; }
             .ma-results-container::-webkit-scrollbar-track { background: transparent; }
             .ma-results-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
            
            .ma-grid-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 16px;
            }
            .ma-grid-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                cursor: pointer;
                border-radius: 12px;
                padding: 8px;
                transition: background 0.2s ease;
            }
            .ma-grid-item:hover { background: rgba(255,255,255,0.1); }
            .ma-grid-image {
                width: 80px; height: 80px;
                border-radius: 8px;
                background-color: rgba(0,0,0,0.3);
                margin-bottom: 8px;
                display: flex; align-items: center; justify-content: center;
                font-size: 24px;
            }
            .ma-grid-image img { width: 100%; height: 100%; border-radius: 8px; object-fit: cover; }
            .ma-grid-name {
                font-size: 12px; font-weight: 600; color: var(--text-primary);
                line-height: 1.3; width: 100%;
                overflow: hidden; text-overflow: ellipsis;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            }
            .ma-grid-artist { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
            
            .ma-list-container { display: flex; flex-direction: column; gap: 8px; }
            .ma-list-item {
                display: grid;
                grid-template-columns: 40px 1fr auto;
                align-items: center;
                gap: 12px;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .ma-list-item:hover { background: rgba(255,255,255,0.1); }
            .ma-list-image { width: 40px; height: 40px; border-radius: 4px; background-color: rgba(0,0,0,0.3); }
            .ma-list-image img { width: 100%; height: 100%; border-radius: 4px; object-fit: cover; }
            .ma-list-info { overflow: hidden; }
            .ma-list-name { font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .ma-list-artist { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            
            .ma-category-header {
                font-size: 14px; font-weight: 600; color: var(--text-secondary);
                padding: 12px 8px 4px 8px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                margin-bottom: 8px;
            }
            .ma-loading-state, .ma-empty-state {
                text-align: center; color: var(--text-secondary);
                padding: 40px 20px; font-style: italic; font-size: 13px;
            }


            /* List View Styles */
            .results-list {
                display: none;
                flex-direction: column;
                gap: 8px;
                padding-left: 20px;
                padding-right: 20px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .search-panel.expanded .results-list {
                opacity: 1;
                transform: translateY(0);
            }
            
            .results-list.active {
                display: flex;
            }
            
            .device-list-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.12);
                border-radius: 30px;
                cursor: pointer;
                transition: all 0.2s ease;
                will-change: transform, opacity;
                position: relative;
                overflow: hidden;
            }
            
            .device-list-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            }
            
            .device-list-item:hover {
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            .device-list-item:hover::before {
                opacity: 1;
            }
            
            .device-list-item.active {
                background: var(--accent-light);
                border-color: var(--accent);
                box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2);
            }
            
            .device-list-icon {
                width: 48px;
                height: 48px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 20px;
                transition: all 0.2s ease;
            }
            
            .device-list-item.active .device-list-icon {
                background: rgba(0, 122, 255, 0.3);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
            }
            
            .device-list-content {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .device-list-name {
                font-size: 15px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.05em;
            }
            
            .device-list-status {
                font-size: 15px;
                color: var(--text-secondary);
                margin: 0;
                opacity: 0.8;
                line-height: 1.05em;
            }
            
            .device-list-item.active .device-list-status {
                color: var(--text-secondary);
                opacity: 1;
            }
            
            .device-list-area {
                font-size: 15px;
                color: var(--text-secondary);
                opacity: 0.7;
                text-align: left;
                flex-shrink: 0;
                font-weight: 500;
                order: -1; /* ← NEU: Area über Name positionieren */
                line-height: 1.05em;
            }

            .device-list-quick-action {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: all 0.2s ease;
                margin-left: 8px;
            }
            
            .device-list-quick-action:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .device-list-quick-action.active {
                background: var(--accent-light);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
            }
            
            .device-list-quick-action svg {
                width: 18px;
                height: 18px;
                stroke: var(--text-secondary);
                stroke-width: 1.5;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            
            .device-list-quick-action.active svg {
                stroke: var(--accent);
            }         

            /* Custom Items Specific Styles */
            .icon-background.custom-item {
                opacity: 1 !important;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
            }
            
            .custom-item-card {
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                border: 1px solid rgba(255,255,255,0.15);
            }
            
            .custom-item-card:hover {
                background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08));
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            }
            
            .custom-item-icon {
                background: linear-gradient(135deg, #FF6B35, #F7931E);
                color: white;
                font-weight: bold;
            }
            
            .custom-detail-status {
                background: linear-gradient(135deg, #06D6A0, #118AB2);
                color: white;
                font-weight: 600;
            }


            /* Custom Items: Flexible Höhe für Accordions */
            .detail-panel.custom-detail {
                height: auto;
                min-height: 700px;
                max-height: none;
            }
            
            .detail-panel.custom-detail .detail-right {
                overflow-y: auto;
                max-height: none;
                height: auto;
            }
            
            .detail-panel.custom-detail #tab-content-container {
                max-height: none;
                height: auto;
                overflow-y: visible;
            }
            
            .detail-panel.custom-detail .accordion-content.open {
                max-height: none;
                height: auto;
                background: rgba(0, 0, 0, 0.3);
            }
            
            /* Für Mobile Custom Items */
            @media (max-width: 768px) {
                .detail-panel.custom-detail {
                    height: auto;
                    min-height: 600px;
                }
                
                .detail-panel.custom-detail .detail-right {
                    height: auto;
                    max-height: none;
                }
            }           


            .accordion-item {
                border: 0px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                margin-bottom: 8px;
                overflow: hidden;
            }
            .accordion-header {
                padding: 16px 20px;
                background: rgba(255,255,255,0.05);
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
                color: var(--text-primary);
                transition: all 0.3s ease;
            }
            .accordion-header:hover {
                background: rgba(255,255,255,0.1);
            }
            .accordion-header.active {
                background: rgba(0, 0, 0, 0.3);
            }
            .accordion-arrow {
                width: 34px;
                height: 34px;
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .accordion-arrow svg {
                width: 30px;
                height: 30px;
                stroke: currentColor;
                transition: transform 0.3s ease;
            }
            .accordion-header.active .accordion-arrow svg {
                transform: rotate(45deg);
            }
            .accordion-content {
                padding: 0 20px;
                max-height: 0;
                overflow: hidden;
                transition: all 0.3s ease;
                color: var(--text-secondary);
            }
            .accordion-content.open {
                padding: 20px;
                max-height: 500px;
            }
            .accordion-content h1, .accordion-content h2, .accordion-content h3 {
                color: var(--text-primary);
                margin: 10px 0;
            }
            .accordion-content ul {
                list-style: none;
                padding-left: 0;
            }
            .accordion-content li {
                padding: 4px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .accordion-content li:last-child {
                border-bottom: none;
            }
            .accordion-content blockquote {
                background: rgba(255,255,255,0.05);
                border-left: 4px solid var(--accent);
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 8px;
                font-style: italic;
            }            








            
            /* Markdown Editor Styles */
            .markdown-editor-container {
                padding: 0px;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-width: 100%;
                box-sizing: border-box;
            }
            
            .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 12px;
            }
            
            .editor-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .editor-controls {
                display: flex;
                gap: 8px;
            }
            
            .editor-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                color: var(--text-secondary);
            }
            
            .editor-btn:hover {
                background: rgba(255,255,255,0.2);
                color: var(--text-primary);
                transform: scale(1.05);
            }
            
            .editor-btn.active {
                background: var(--accent);
                color: white;
            }
            
            .editor-btn svg {
                width: 18px;
                height: 18px;
            }
            
            .editor-content {
                flex: 1;
                position: relative;
                min-height: 300px;
                max-width: 100%;
                box-sizing: border-box;
            }
            
            .markdown-textarea {
                width: 100%;
                height: 100%;
                min-height: 300px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                color: var(--text-primary);
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
                line-height: 1.5;
                padding: 16px;
                resize: vertical;
                outline: none;
                transition: all 0.2s ease;
                max-width: 100%;
                box-sizing: border-box;
            }
            
            .markdown-textarea:focus {
                border-color: var(--accent);
                box-shadow: 0 0 0 2px rgba(0,122,255,0.2);
            }
            
            .markdown-textarea::placeholder {
                color: rgba(255,255,255,0.4);
                font-style: italic;
            }
            
            .live-preview {
                position: absolute;
                top: 0;
                right: 0;
                width: 50%;
                height: 100%;
                background: rgba(0,0,0,0.35);
                border: 1px solid rgba(0,0,0,0.35);
                border-radius: 12px;
                padding: 16px;
                overflow-y: auto;
                box-sizing: border-box;
                transition: width 0.3s ease;
            }
            
            .live-preview.hidden {
                display: none;
            }

            /* NEU: Full-Width Preview Mode */
            .live-preview.fullwidth {
                width: 100% !important;
                left: 0;
                right: 0;
            }
            
            /* NEU: Textarea hidden when preview is fullwidth */
            .markdown-textarea.preview-hidden {
                display: none;
            }            
            
            .preview-content {
                color: var(--text-primary);
                line-height: 1.6;
            }
            
            .preview-content h1, .preview-content h2, .preview-content h3 {
                color: var(--text-primary);
                margin: 16px 0 8px 0;
            }
            
            .preview-content ul, .preview-content ol {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .preview-content blockquote {
                background: rgba(255,255,255,0.05);
                border-left: 4px solid var(--accent);
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 8px;
                font-style: italic;
            }
            
            .editor-footer {            
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;  /* ← Exakt drei gleiche Spalten */
                align-items: flex-start;
                padding-top: 12px;
                border-top: 1px solid rgba(255,255,255,0.1);
                gap: 16px;                
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: var(--text-secondary);
                justify-self: start;
                line-height: 1.1em;
            }

            .editor-info {
            }
            
            .markdown-help {
            }            
            
            .status-indicator[data-status="saving"]::before {
                content: "💾";
            }
            
            .status-indicator[data-status="saved"]::before {
                content: "✅";
            }
            
            .status-indicator[data-status="error"]::before {
                content: "❌";
            }
            
            .status-indicator[data-status="ready"]::before {
                content: "📝";
            }
            
            .markdown-help details {
                color: var(--text-secondary);
            }
            
            .markdown-help summary {
                cursor: pointer;
                font-size: 13px;
                padding: 4px 8px;
                border-radius: 6px;
                transition: background 0.2s ease;
            }
            
            .markdown-help summary:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .help-content {
                margin-top: 8px;
                padding: 12px;
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                font-size: 12px;
            }

            /* History Tab Styles */
            .history-container {
                padding: 20px;
                height: calc(100vh - 300px); /* Feste Höhe statt 100% */
                max-height: 500px; /* Fallback für kleinere Screens */
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
                -ms-overflow-style: none;
            }
            
            .history-container::-webkit-scrollbar {
                width: 4px;
            }
            
            .history-container::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .history-container::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
            }
            
            .history-container::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .history-header h3 {
                margin: 0;
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
            }
            
            .history-controls {
                display: flex;
                gap: 8px;
            }
            
            .history-btn {
                padding: 6px 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
                font-weight: 500;
            }
            
            .history-btn.active, .history-btn:hover {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            
            .history-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 12px;
                margin-bottom: 20px;
            }

            .history-warning {
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid rgba(255, 152, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
                color: #FF9800;
                font-size: 13px;
                font-weight: 500;
            }            
            
            .stat-card {
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 12px;
                padding: 12px;
                text-align: center;
            }
            
            .stat-title {
                font-size: 11px;
                color: var(--text-secondary);
                margin-bottom: 4px;
                font-weight: 500;
            }
            
            .stat-value {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .timeline-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .timeline-event {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                transition: all 0.2s ease;
            }
            
            .timeline-event:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .timeline-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--text-secondary);
                flex-shrink: 0;
            }
            
            .timeline-event.active .timeline-dot {
                background: #4CAF50;
            }
            
            .timeline-event.inactive .timeline-dot {
                background: #757575;
            }
            
            .timeline-content {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .timeline-time {
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
            }
            
            .timeline-state {
                font-size: 13px;
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .loading-indicator {
                text-align: center;
                color: var(--text-secondary);
                padding: 40px 20px;
                font-style: italic;
                font-size: 14px;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .history-container {
                    height: calc(100vh - 400px);
                    max-height: 400px;
                }            
                
                .history-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }
                
                .history-stats {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                
                .timeline-content {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
            }

            
            .shortcuts-container {
                padding: 20px;
                height: calc(100vh - 300px);
                max-height: 500px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
                -ms-overflow-style: none;
                display: flex;
                flex-direction: column;
            }
            
            .shortcuts-container::-webkit-scrollbar {
                width: 4px;
            }
            
            .shortcuts-container::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .shortcuts-container::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
            }
            
            .shortcuts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .shortcuts-header h3 {
                margin: 0;
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
            }
            
            .shortcuts-controls {
                display: flex;
                gap: 8px;
            }
            
            .shortcuts-btn {
                padding: 6px 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
                font-weight: 500;
            }
            
            .shortcuts-btn.active, 
            .shortcuts-btn:hover {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            
            .shortcuts-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .shortcuts-stat-card {
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 12px;
                padding: 12px;
                text-align: center;
            }
            
            .stat-title {
                font-size: 11px;
                color: var(--text-secondary);
                margin-bottom: 4px;
                font-weight: 500;
            }
            
            .stat-value {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .shortcuts-content {
                flex: 1;
                overflow-y: auto;
            }
            
            .shortcuts-tab-content {
                display: none;
            }
            
            .shortcuts-tab-content.active {
                display: block;
            }
            
            /* Mobile Responsive - genau wie History */
            @media (max-width: 768px) {
                .shortcuts-container {
                    height: calc(100vh - 400px);
                    max-height: 400px;
                }
                
                .shortcuts-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }
                
                .shortcuts-stats {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
            }    

            .shortcuts-timeline-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .shortcuts-timeline-event {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .shortcuts-timeline-event:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .shortcuts-timeline-event.editing {
                background: rgba(0,122,255,0.1);
                border: 1px solid rgba(0,122,255,0.3);
            }
            
            .shortcuts-timeline-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--text-secondary);
                flex-shrink: 0;
            }
            
            .shortcuts-timeline-event.active .shortcuts-timeline-dot {
                background: #4CAF50;
            }
            
            .shortcuts-timeline-event.inactive .shortcuts-timeline-dot {
                background: #757575;
            }
            
            .shortcuts-timeline-content {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .shortcuts-timeline-info {
                flex: 1;
            }
            
            .shortcuts-timeline-action {
                font-size: 13px;
                color: var(--text-primary);
                font-weight: 600;
                line-height: 1.2;
            }
            
            .shortcuts-timeline-time {
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
                margin-top: 2px;
            }
            
            .shortcuts-timeline-controls {
                display: flex;
                gap: 8px;
            }
            
            .shortcuts-timeline-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .shortcuts-timeline-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .shortcuts-add-button {
                width: 100%;
                padding: 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                font-weight: 500;
            }
            
            .shortcuts-add-button:hover {
                background: rgba(255,255,255,0.12);
                color: var(--text-primary);
            }
            
            .shortcuts-empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-secondary);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .empty-icon {
                font-size: 24px;
                opacity: 0.5;
            }
            
            .empty-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .empty-subtitle {
                font-size: 12px;
                opacity: 0.7;
            }            


            .shortcuts-edit-panel {
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                animation: slideDown 0.3s ease;
            }
            
            .shortcuts-edit-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .shortcuts-edit-header h4 {
                margin: 0;
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
            }
            
            .shortcuts-edit-close {
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
                color: var(--text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .shortcuts-edit-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .shortcuts-edit-content {
                margin-bottom: 16px;
            }
            
            .shortcuts-edit-field {
                margin-bottom: 16px;
            }
            
            .shortcuts-edit-label {
                display: block;
                font-size: 12px;
                color: var(--text-secondary);
                margin-bottom: 6px;
                font-weight: 500;
            }
            
            .shortcuts-edit-input,
            .shortcuts-edit-select {
                width: 100%;
                padding: 10px 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                color: var(--text-primary);
                font-size: 14px;
                font-family: inherit;
                outline: none;
                transition: all 0.2s ease;
            }
            
            .shortcuts-edit-input:focus,
            .shortcuts-edit-select:focus {
                border-color: var(--accent);
                box-shadow: 0 0 0 2px rgba(0,122,255,0.2);
            }
            
            .shortcuts-edit-toggle-group {
                display: flex;
                gap: 8px;
            }
            
            .shortcuts-edit-toggle {
                flex: 1;
                padding: 8px 12px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                color: var(--text-secondary);
                cursor: pointer;
                text-align: center;
                font-size: 13px;
                transition: all 0.2s ease;
            }
            
            .shortcuts-edit-toggle.active {
                background: var(--accent);
                border-color: var(--accent);
                color: white;
            }
            
            .shortcuts-edit-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .shortcuts-btn-secondary,
            .shortcuts-btn-primary {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .shortcuts-btn-secondary {
                background: rgba(255,255,255,0.08);
                color: var(--text-secondary);
            }
            
            .shortcuts-btn-secondary:hover {
                background: rgba(255,255,255,0.15);
            }
            
            .shortcuts-btn-primary {
                background: var(--accent);
                color: white;
            }
            
            .shortcuts-btn-primary:hover {
                background: #0056CC;
            }
            
            .shortcuts-timeline-event:not(.editing) {
                opacity: 0.3;
                pointer-events: none;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }            
                                    
            </style>

            <div class="main-container">
                <div class="search-row">
                    <div class="search-panel glass-panel">
                    
                        <div class="search-wrapper">
                            <div class="category-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M8 15.4V8.6C8 8.26863 8.26863 8 8.6 8H15.4C15.7314 8 16 8.26863 16 8.6V15.4C16 15.7314 15.7314 16 15.4 16H8.6C8.26863 16 8 15.7314 8 15.4Z"/>
                                    <path d="M20 4.6V19.4C20 19.7314 19.7314 20 19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6Z"/>
                                    <path d="M17 4V2"/><path d="M12 4V2"/><path d="M7 4V2"/>
                                    <path d="M7 20V22"/><path d="M12 20V22"/><path d="M17 20V22"/>
                                    <path d="M20 17H22"/><path d="M20 12H22"/><path d="M20 7H22"/>
                                    <path d="M4 17H2"/><path d="M4 12H2"/><path d="M4 7H2"/>
                                </svg>
                            </div>
                            

                            <div class="search-input-container">
                                <input type="text" class="search-suggestion" readonly tabindex="-1">
                                <input 
                                    type="text" 
                                    class="search-input" 
                                    placeholder="Geräte suchen..."
                                    autocomplete="off"
                                    spellcheck="false"
                                >
                            </div>                            


                            <button class="clear-button">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                            
                            <div class="filter-container">
                                <div class="filter-groups" id="filterGroups">
                                    <!-- View Group -->
                                    <div class="filter-group">
                                        <button class="filter-button active" data-action="grid" title="Grid-Ansicht">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M14 20.4V14.6C14 14.2686 14.2686 14 14.6 14H20.4C20.7314 14 21 14.2686 21 14.6V20.4C21 20.7314 20.7314 21 20.4 21H14.6C14.2686 21 14 20.7314 14 20.4Z" stroke="#ffffff" stroke-width="1"></path>
                                                <path d="M3 20.4V14.6C3 14.2686 3.26863 14 3.6 14H9.4C9.73137 14 10 14.2686 10 14.6V20.4C10 20.7314 9.73137 21 9.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z" stroke="#ffffff" stroke-width="1"></path>
                                                <path d="M14 9.4V3.6C14 3.26863 14.2686 3 14.6 3H20.4C20.7314 3 21 3.26863 21 3.6V9.4C21 9.73137 20.7314 10 20.4 10H14.6C14.2686 10 14 9.73137 14 9.4Z" stroke="#ffffff" stroke-width="1"></path>
                                                <path d="M3 9.4V3.6C3 3.26863 3.26863 3 3.6 3H9.4C9.73137 3 10 3.26863 10 3.6V9.4C10 9.73137 9.73137 10 9.4 10H3.6C3.26863 10 3 9.73137 3 9.4Z" stroke="#ffffff" stroke-width="1"></path>
                                            </svg>
                                            <span class="filter-button-label">Grid</span>
                                        </button>
                                        <button class="filter-button" data-action="list" title="Listen-Ansicht">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M8 6L20 6" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M4 6.01L4.01 5.99889" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M4 12.01L4.01 11.9989" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M4 18.01L4.01 17.9989" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 12L20 12" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M8 18L20 18" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                            <span class="filter-button-label">Liste</span>
                                        </button>
                                    </div>
                            
                                    <!-- Filter Group -->
                                    <div class="filter-group">
                                        <button class="filter-button active" data-action="categories" title="Kategorien">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M20.777 13.3453L13.4799 21.3721C12.6864 22.245 11.3136 22.245 10.5201 21.3721L3.22304 13.3453C2.52955 12.5825 2.52955 11.4175 3.22304 10.6547L10.5201 2.62787C11.3136 1.755 12.6864 1.755 13.4799 2.62787L20.777 10.6547C21.4705 11.4175 21.4705 12.5825 20.777 13.3453Z" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                            <span class="filter-button-label">Kategorie</span>
                                        </button>
                                        <button class="filter-button" data-action="areas" title="Räume">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M11 19V21" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M11 12V16" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M16 12V16L14 16" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M21 12L8 12" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M5 12H3" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M3 5L12 3L21 5" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M21 8.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V8.6C3 8.26863 3.26863 8 3.6 8H20.4C20.7314 8 21 8.26863 21 8.6Z" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                            <span class="filter-button-label">Räume</span>
                                        </button>
                                        <button class="filter-button" data-action="types" title="Typen" style="display: none;" id="typeButton">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M5.21173 15.1113L2.52473 12.4243C2.29041 12.1899 2.29041 11.8101 2.52473 11.5757L5.21173 8.88873C5.44605 8.65442 5.82595 8.65442 6.06026 8.88873L8.74727 11.5757C8.98158 11.8101 8.98158 12.1899 8.74727 12.4243L6.06026 15.1113C5.82595 15.3456 5.44605 15.3456 5.21173 15.1113Z" stroke="#ffffff" stroke-width="1"></path>
                                                <path d="M11.5757 21.475L8.88874 18.788C8.65443 18.5537 8.65443 18.1738 8.88874 17.9395L11.5757 15.2525C11.8101 15.0182 12.19 15.0182 12.4243 15.2525L15.1113 17.9395C15.3456 18.1738 15.3456 18.5537 15.1113 18.788L12.4243 21.475C12.19 21.7094 11.8101 21.7094 11.5757 21.475Z" stroke="#ffffff" stroke-width="1"></path>
                                                <path d="M11.5757 8.7475L8.88874 6.06049C8.65443 5.82618 8.65443 5.44628 8.88874 5.21197L11.5757 2.52496C11.8101 2.29065 12.19 2.29065 12.4243 2.52496L15.1113 5.21197C15.3456 5.44628 15.3456 5.82618 15.1113 6.06049L12.4243 8.7475C12.19 8.98181 11.8101 8.98181 11.5757 8.7475Z" stroke="#ffffff" stroke-width="1"></path>
                                                <path d="M17.9396 15.1113L15.2526 12.4243C15.0183 12.1899 15.0183 11.8101 15.2526 11.5757L17.9396 8.88873C18.174 8.65442 18.5539 8.65442 18.7882 8.88873L21.4752 11.5757C21.7095 11.8101 21.7095 12.1899 21.4752 12.4243L18.7882 15.1113C18.5539 15.3456 18.174 15.3456 17.9396 15.1113Z" stroke="#ffffff" stroke-width="1"></path>
                                            </svg>
                                            <span class="filter-button-label">Typen</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <button class="filter-main-button" id="filterMainButton">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <line x1="4" y1="21" x2="4" y2="14"></line>
                                        <line x1="4" y1="10" x2="4" y2="3"></line>
                                        <line x1="12" y1="21" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12" y2="3"></line>
                                        <line x1="20" y1="21" x2="20" y2="16"></line>
                                        <line x1="20" y1="12" x2="20" y2="3"></line>
                                        <line x1="1" y1="14" x2="7" y2="14"></line>
                                        <line x1="9" y1="8" x2="15" y2="8"></line>
                                        <line x1="17" y1="16" x2="23" y2="16"></line>
                                    </svg>
                                </button>
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

                            <div class="results-list">
                            </div>

                            
                        </div>
                    </div>

                    <div class="detail-panel glass-panel">
                        </div>

                    <div class="category-buttons">
                        <button class="category-button glass-panel active" data-category="devices" title="Geräte">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 15.4V8.6C8 8.26863 8.26863 8 8.6 8H15.4C15.7314 8 16 8.26863 16 8.6V15.4C16 15.7314 15.7314 16 15.4 16H8.6C8.26863 16 8 15.7314 8 15.4Z"/>
                                <path d="M20 4.6V19.4C20 19.7314 19.7314 20 19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6Z"/>
                                <path d="M17 4V2"/><path d="M12 4V2"/><path d="M7 4V2"/>
                                <path d="M7 20V22"/><path d="M12 20V22"/><path d="M17 20V22"/>
                                <path d="M20 17H22"/><path d="M20 12H22"/><path d="M20 7H22"/>
                                <path d="M4 17H2"/><path d="M4 12H2"/><path d="M4 7H2"/>
                            </svg>
                        </button>
                        
                        <button class="category-button glass-panel" data-category="scripts" title="Skripte">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143"/>
                                <path d="M6 17L20 17"/><path d="M6 21L20 21"/>
                                <path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17"/>
                                <path d="M9 7L15 7"/>
                            </svg>
                        </button>
                        
                        <button class="category-button glass-panel" data-category="automations" title="Automationen">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 12L15 15"/><path d="M12 3V6"/><path d="M18 12L18 15"/>
                                <path d="M12 18L21 18"/><path d="M18 21H21"/><path d="M6 12H9"/>
                                <path d="M6 6.01111L6.01 6"/><path d="M12 12.0111L12.01 12"/>
                                <path d="M3 12.0111L3.01 12"/><path d="M12 9.01111L12.01 9"/>
                                <path d="M12 15.0111L12.01 15"/><path d="M15 21.0111L15.01 21"/>
                                <path d="M12 21.0111L12.01 21"/><path d="M21 12.0111L21.01 12"/>
                                <path d="M21 15.0111L21.01 15"/><path d="M18 6.01111L18.01 6"/>
                                <path d="M9 3.6V8.4C9 8.73137 8.73137 9 8.4 9H3.6C3.26863 9 3 8.73137 3 8.4V3.6C3 3.26863 3.26863 3 3.6 3H8.4C8.73137 3 9 3.26863 9 3.6Z"/>
                                <path d="M21 3.6V8.4C21 8.73137 20.7314 9 20.4 9H15.6C15.2686 9 15 8.73137 15 8.4V3.6C15 3.26863 15.2686 3 15.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z"/>
                                <path d="M6 18.0111L6.01 18"/>
                                <path d="M9 15.6V20.4C9 20.7314 8.73137 21 8.4 21H3.6C3.26863 21 3 20.7314 3 20.4V15.6C3 15.2686 3.26863 15 3.6 15H8.4C8.73137 15 9 15.2686 9 15.6Z"/>
                            </svg>
                        </button>
                        
                        <button class="category-button glass-panel" data-category="scenes" title="Szenen">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.5096 9.54C20.4243 9.77932 20.2918 9.99909 20.12 10.1863C19.9483 10.3735 19.7407 10.5244 19.5096 10.63C18.2796 11.1806 17.2346 12.0745 16.5002 13.2045C15.7659 14.3345 15.3733 15.6524 15.3696 17C15.3711 17.4701 15.418 17.9389 15.5096 18.4C15.5707 18.6818 15.5747 18.973 15.5215 19.2564C15.4682 19.5397 15.3588 19.8096 15.1996 20.05C15.0649 20.2604 14.8877 20.4403 14.6793 20.5781C14.4709 20.7158 14.2359 20.8085 13.9896 20.85C13.4554 20.9504 12.9131 21.0006 12.3696 21C11.1638 21.0006 9.97011 20.7588 8.85952 20.2891C7.74893 19.8194 6.74405 19.1314 5.90455 18.2657C5.06506 17.4001 4.40807 16.3747 3.97261 15.2502C3.53714 14.1257 3.33208 12.9252 3.36959 11.72C3.4472 9.47279 4.3586 7.33495 5.92622 5.72296C7.49385 4.11097 9.60542 3.14028 11.8496 3H12.3596C14.0353 3.00042 15.6777 3.46869 17.1017 4.35207C18.5257 5.23544 19.6748 6.49885 20.4196 8C20.6488 8.47498 20.6812 9.02129 20.5096 9.52V9.54Z"/>
                                <path d="M8 16.01L8.01 15.9989"/><path d="M6 12.01L6.01 11.9989"/>
                                <path d="M8 8.01L8.01 7.99889"/><path d="M12 6.01L12.01 5.99889"/>
                                <path d="M16 8.01L16.01 7.99889"/>
                            </svg>
                        </button>
                    
                        <button class="category-button glass-panel" data-category="custom" title="Custom">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z"/>
                                <path d="M20.5 16.7222L12.2914 12.1619C12.1102 12.0612 11.8898 12.0612 11.7086 12.1619L3.5 16.7222"/>
                                <path d="M3.52844 7.29357L11.7086 11.8381C11.8898 11.9388 12.1102 11.9388 12.2914 11.8381L20.5 7.27777"/>
                                <path d="M12 21L12 3"/>
                            </svg>
                        </button>                                            
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateViewToggleIcon();
        this.updateSubcategoryToggleIcon();
    }

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const suggestionInput = this.shadowRoot.querySelector('.search-suggestion');        
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const categoryIcon = this.shadowRoot.querySelector('.category-icon');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
        
        // Input Events
        searchInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
        searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        searchInput.addEventListener('blur', () => this.clearSuggestion());
        clearButton.addEventListener('click', (e) => { e.stopPropagation(); this.clearSearch(); });
        categoryIcon.addEventListener('click', (e) => { e.stopPropagation(); this.toggleCategoryButtons(); });
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
                // Filter schließen wenn außerhalb geklickt
                if (this.isFilterOpen) {
                    this.toggleFilter();
                }
            }
        });
    
        // NEU: Resize Listener für Viewport-Wechsel
        window.addEventListener('resize', () => {
            if (this.isDetailView && this.currentDetailItem) {
                setTimeout(() => {
                    const container = this.shadowRoot.getElementById(`device-control-${this.currentDetailItem.id}`);
                    if (container) {
                        container.offsetHeight; // Force reflow
                        
                        // Update UI states
                        if (this.currentDetailItem.domain === 'light') {
                            this.updateLightControlsUI(this.currentDetailItem);
                        } else if (this.currentDetailItem.domain === 'cover') {
                            this.updateCoverControlsUI(this.currentDetailItem);
                        } else if (this.currentDetailItem.domain === 'climate') {
                            this.updateClimateControlsUI(this.currentDetailItem);
                        } else if (this.currentDetailItem.domain === 'media_player') {
                            this.updateMediaPlayerControlsUI(this.currentDetailItem);
                        }
                    }
                }, 150);
            }
        });
    
        // Filter Button Events
        const filterMainButton = this.shadowRoot.querySelector('.filter-main-button');
        const filterGroups = this.shadowRoot.querySelector('.filter-groups');
        
        if (filterMainButton) {
            filterMainButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFilter();
            });
        }
        
        // Filter Group Button Events
        if (filterGroups) {
            filterGroups.addEventListener('click', (e) => {
                const filterButton = e.target.closest('.filter-button');
                if (filterButton) {
                    e.stopPropagation();
                    this.handleFilterButtonClick(filterButton);
                }
            });
        }
    }


    handleEditTimer(timerId, item) {
        const timer = this.getDeviceTimers(item.id).find(t => t.id === timerId);
        if (!timer) return;
        
        this.showEditPanel(timer, item, 'edit');
    }
    
    handleAddTimer(item) {
        const newTimer = {
            id: 'new',
            time: '12:00',
            action: 'turn_on',
            duration: null,
            repeat: 'once'
        };
        
        this.showEditPanel(newTimer, item, 'add');
    }
    
    async handleDeleteTimer(timerId, item) {
        if (confirm('Timer löschen?')) {
            try {
                // Aus Input Helper entfernen
                await this.removeTimerFromInputHelper(timerId);
                
                // Aus Memory entfernen
                this.removeTimerFromMemory(timerId, item.id);
                
                this.showTimerFeedback('Timer gelöscht!', 'success');
                this.refreshTimerList(item);
                
            } catch (error) {
                console.error('Error deleting timer:', error);
                this.showTimerFeedback('Fehler beim Löschen!', 'error');
            }
        }
    }
    
    handleTimerClick(timerId, item) {
        console.log('Timer clicked:', timerId);
        // TODO: Implement timer click (maybe edit?)
    }
    
    showEditPanel(timer, item, mode) {
        const editPanel = this.shadowRoot.getElementById('shortcuts-edit-panel');
        const titleElement = this.shadowRoot.getElementById('edit-panel-title');
        const contentElement = this.shadowRoot.getElementById('edit-panel-content');
        
        // Update title
        titleElement.textContent = mode === 'add' ? 'Neuer Timer' : 'Timer bearbeiten';
        
        // Generate device-specific form
        contentElement.innerHTML = this.getTimerEditForm(timer, item);
        
        // Show panel
        editPanel.style.display = 'block';
        
        // Fade other timers
        this.fadeOtherTimers(timer.id);
        
        // Setup form event listeners
        this.setupEditFormListeners(timer, item, mode);
    }
    
    getTimerEditForm(timer, item) {
        const actionOptions = this.getDeviceActionOptions(item.domain);
        
        return `
            <div class="shortcuts-edit-field">
                <label class="shortcuts-edit-label">⏰ Zeit</label>
                <input type="time" class="shortcuts-edit-input" id="edit-time" value="${timer.time || '12:00'}">
            </div>
            
            <div class="shortcuts-edit-field">
                <label class="shortcuts-edit-label">${this.getActionLabel(item.domain)} Aktion</label>
                <div class="shortcuts-edit-toggle-group" id="edit-actions">
                    ${actionOptions.map(option => `
                        <button class="shortcuts-edit-toggle ${timer.action === option.value ? 'active' : ''}" 
                                data-action="${option.value}">
                            ${option.icon} ${option.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            ${this.getDeviceSpecificFields(timer, item)}
            
            <div class="shortcuts-edit-field">
                <label class="shortcuts-edit-label">🔄 Wiederholen</label>
                <div class="shortcuts-edit-toggle-group" id="edit-repeat">
                    <button class="shortcuts-edit-toggle ${timer.repeat === 'once' ? 'active' : ''}" data-repeat="once">Einmalig</button>
                    <button class="shortcuts-edit-toggle ${timer.repeat === 'daily' ? 'active' : ''}" data-repeat="daily">Täglich</button>
                    <button class="shortcuts-edit-toggle ${timer.repeat === 'weekdays' ? 'active' : ''}" data-repeat="weekdays">Wochentags</button>
                </div>
            </div>
        `;
    }
    
    getDeviceActionOptions(domain) {
        switch(domain) {
            case 'light':
                return [
                    { value: 'turn_on', icon: '💡', label: 'Ein' },
                    { value: 'turn_off', icon: '🔴', label: 'Aus' }
                ];
            case 'climate':
                return [
                    { value: 'heat', icon: '🔥', label: 'Heizen' },
                    { value: 'cool', icon: '❄️', label: 'Kühlen' },
                    { value: 'turn_off', icon: '🔴', label: 'Aus' }
                ];
            case 'cover':
                return [
                    { value: 'open', icon: '⬆️', label: 'Öffnen' },
                    { value: 'close', icon: '⬇️', label: 'Schließen' }
                ];
            default:
                return [
                    { value: 'turn_on', icon: '▶️', label: 'Ein' },
                    { value: 'turn_off', icon: '⏹️', label: 'Aus' }
                ];
        }
    }
    
    getActionLabel(domain) {
        const labels = {
            'light': '💡',
            'climate': '🌡️',
            'cover': '🪟',
            'media_player': '🎵'
        };
        return labels[domain] || '⚙️';
    }
    
    getDeviceSpecificFields(timer, item) {
        switch(item.domain) {
            case 'light':
                return `
                    <div class="shortcuts-edit-field">
                        <label class="shortcuts-edit-label">⏱️ Dauer</label>
                        <div class="shortcuts-edit-toggle-group">
                            <button class="shortcuts-edit-toggle ${!timer.duration ? 'active' : ''}" data-duration="permanent">Permanent</button>
                            <button class="shortcuts-edit-toggle ${timer.duration ? 'active' : ''}" data-duration="timed">Zeitgesteuert</button>
                        </div>
                        ${timer.duration ? `<input type="number" class="shortcuts-edit-input" id="edit-duration" value="${timer.duration}" placeholder="Minuten" style="margin-top: 8px;">` : ''}
                    </div>
                `;
            case 'climate':
                return `
                    <div class="shortcuts-edit-field">
                        <label class="shortcuts-edit-label">🎯 Temperatur</label>
                        <input type="number" class="shortcuts-edit-input" id="edit-temperature" value="${timer.temperature || 22}" min="16" max="30" step="0.5">
                    </div>
                    <div class="shortcuts-edit-field">
                        <label class="shortcuts-edit-label">⏱️ Dauer (Minuten)</label>
                        <input type="number" class="shortcuts-edit-input" id="edit-duration" value="${timer.duration || 60}" placeholder="0 = Permanent">
                    </div>
                `;
            default:
                return '';
        }
    }
    
    fadeOtherTimers(editingId) {
        const timerEvents = this.shadowRoot.querySelectorAll('.shortcuts-timeline-event');
        timerEvents.forEach(event => {
            if (event.dataset.timerId !== editingId) {
                event.classList.add('editing');
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
        this.hideCategoryButtons();
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        searchPanel.animate([
            { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)' },
            { 
                boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)'
                /* Die Zeile für 'borderColor' wurde hier entfernt */
            }
        ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
        if (!this.isPanelExpanded) { this.expandPanel(); }
    }    

    clearSearch() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        
        searchInput.value = '';
        this.isSearching = false; 
        this.clearSuggestion(); // NEU HINZUFÜGEN
        
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
        this.collapsePanel(); // <-- HINZUGEFÜGTE ZEILE
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
        
        // NEU: Wenn gleiche Kategorie → Menü schließen
        if (category === this.activeCategory) {
            this.hideCategoryButtons();
            return;
        }
        
        this.shadowRoot.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
        selectedButton.classList.add('active');
        selectedButton.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        this.activeCategory = category;
        
        // Reset subcategory mode für Custom
        if (category === 'custom') {
            this.subcategoryMode = 'categories'; // Start with categories for custom
        } else {
            this.subcategoryMode = 'categories'; // Standard mode for others
        }        
        
        this.updateCategoryIcon();
        this.updatePlaceholder();
        this.updateSubcategoryToggleIcon();
        this.updateSubcategoryChips();
        this.hideCategoryButtons();
        // Hinzufügen:
        this.updateTypeButtonVisibility();
        this.updateFilterButtonStates();        
        // this.expandPanel(); // ENTFERNT
        // this.showCurrentCategoryItems(); // ENTFERNT
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

    toggleFilter() {
        this.isFilterOpen = !this.isFilterOpen;
        
        const filterMainButton = this.shadowRoot.querySelector('.filter-main-button');
        const filterGroups = this.shadowRoot.querySelector('.filter-groups');
        const searchInputContainer = this.shadowRoot.querySelector('.search-input-container');
        const categoryIcon = this.shadowRoot.querySelector('.category-icon'); // ← NEU
        
        if (this.isFilterOpen) {
            // Filter öffnen
            filterMainButton.classList.add('active');
            filterGroups.classList.add('visible');
            
            // Input-Container komplett verstecken
            if (searchInputContainer) {
                searchInputContainer.style.opacity = '0';
                searchInputContainer.style.pointerEvents = 'none';
                searchInputContainer.style.visibility = 'hidden';
            }
            
            // Category-Icon verstecken
            if (categoryIcon) {
                categoryIcon.style.opacity = '0';
                categoryIcon.style.pointerEvents = 'none';
                categoryIcon.style.visibility = 'hidden';
            }
            
            this.updateTypeButtonVisibility();
            
        } else {
            // Filter schließen
            filterMainButton.classList.remove('active');
            filterGroups.classList.remove('visible');
            
            // Input-Container wieder anzeigen
            if (searchInputContainer) {
                searchInputContainer.style.opacity = '1';
                searchInputContainer.style.pointerEvents = 'auto';
                searchInputContainer.style.visibility = 'visible';
            }
            
            // Category-Icon wieder anzeigen
            if (categoryIcon) {
                categoryIcon.style.opacity = '1';
                categoryIcon.style.pointerEvents = 'auto';
                categoryIcon.style.visibility = 'visible';
            }
        }
    }
        
    
    handleFilterButtonClick(button) {
        const action = button.dataset.action;
        const group = button.closest('.filter-group');
        
        // Visual feedback
        button.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1)' }
        ], { duration: 150, easing: 'ease-out' });
        
        // Remove active from siblings
        const siblings = group.querySelectorAll('.filter-button');
        siblings.forEach(sibling => sibling.classList.remove('active'));
        button.classList.add('active');
        
        // Handle actions
        switch (action) {
            case 'grid':
                this.currentViewMode = 'grid';
                this.renderResults();
                break;
            case 'list':
                this.currentViewMode = 'list';
                this.renderResults();
                break;
            case 'categories':
                this.subcategoryMode = 'categories';
                this.updateSubcategoryChips();
                this.activeSubcategory = 'all';
                this.renderResults();
                break;
            case 'areas':
                this.subcategoryMode = 'areas';
                this.updateSubcategoryChips();
                this.activeSubcategory = 'all';
                this.renderResults();
                break;
            case 'types':
                this.subcategoryMode = 'types';
                this.updateSubcategoryChips();
                this.activeSubcategory = 'all';
                this.renderResults();
                break;
        }
    }
    
    updateTypeButtonVisibility() {
        const typeButton = this.shadowRoot.querySelector('#typeButton');
        if (typeButton) {
            const shouldShow = this.activeCategory === 'custom';
            typeButton.style.display = shouldShow ? 'flex' : 'none';
        }
    }
    
    updateFilterButtonStates() {
        const filterGroups = this.shadowRoot.querySelector('.filter-groups');
        if (!filterGroups) return;
        
        // Update view buttons
        const gridBtn = filterGroups.querySelector('[data-action="grid"]');
        const listBtn = filterGroups.querySelector('[data-action="list"]');
        
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('active', this.currentViewMode === 'grid');
            listBtn.classList.toggle('active', this.currentViewMode === 'list');
        }
        
        // Update subcategory buttons
        const categoriesBtn = filterGroups.querySelector('[data-action="categories"]');
        const areasBtn = filterGroups.querySelector('[data-action="areas"]');
        const typesBtn = filterGroups.querySelector('[data-action="types"]');
        
        if (categoriesBtn) categoriesBtn.classList.toggle('active', this.subcategoryMode === 'categories');
        if (areasBtn) areasBtn.classList.toggle('active', this.subcategoryMode === 'areas');
        if (typesBtn) typesBtn.classList.toggle('active', this.subcategoryMode === 'types');
    }    

    expandPanel() {
        if (this.isPanelExpanded) return;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        this.isPanelExpanded = true;
        searchPanel.classList.add('expanded');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        if (!searchInput.value.trim()) { this.showCurrentCategoryItems(); }

        // Update filter button states when panel expands
        this.updateFilterButtonStates();        
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
            devices: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 15.4V8.6C8 8.26863 8.26863 8 8.6 8H15.4C15.7314 8 16 8.26863 16 8.6V15.4C16 15.7314 15.7314 16 15.4 16H8.6C8.26863 16 8 15.7314 8 15.4Z"/><path d="M20 4.6V19.4C20 19.7314 19.7314 20 19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6Z"/><path d="M17 4V2"/><path d="M12 4V2"/><path d="M7 4V2"/><path d="M7 20V22"/><path d="M12 20V22"/><path d="M17 20V22"/><path d="M20 17H22"/><path d="M20 12H22"/><path d="M20 7H22"/><path d="M4 17H2"/><path d="M4 12H2"/><path d="M4 7H2"/></svg>`,
            scripts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143"/><path d="M6 17L20 17"/><path d="M6 21L20 21"/><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17"/><path d="M9 7L15 7"/></svg>`,
            automations: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12L15 15"/><path d="M12 3V6"/><path d="M18 12L18 15"/><path d="M12 18L21 18"/><path d="M18 21H21"/><path d="M6 12H9"/><path d="M6 6.01111L6.01 6"/><path d="M12 12.0111L12.01 12"/><path d="M3 12.0111L3.01 12"/><path d="M12 9.01111L12.01 9"/><path d="M12 15.0111L12.01 15"/><path d="M15 21.0111L15.01 21"/><path d="M12 21.0111L12.01 21"/><path d="M21 12.0111L21.01 12"/><path d="M21 15.0111L21.01 15"/><path d="M18 6.01111L18.01 6"/><path d="M9 3.6V8.4C9 8.73137 8.73137 9 8.4 9H3.6C3.26863 9 3 8.73137 3 8.4V3.6C3 3.26863 3.26863 3 3.6 3H8.4C8.73137 3 9 3.26863 9 3.6Z"/><path d="M21 3.6V8.4C21 8.73137 20.7314 9 20.4 9H15.6C15.2686 9 15 8.73137 15 8.4V3.6C15 3.26863 15.2686 3 15.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z"/><path d="M6 18.0111L6.01 18"/><path d="M9 15.6V20.4C9 20.7314 8.73137 21 8.4 21H3.6C3.26863 21 3 20.7314 3 20.4V15.6C3 15.2686 3.26863 15 3.6 15H8.4C8.73137 15 9 15.2686 9 15.6Z"/></svg>`,
            scenes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5096 9.54C20.4243 9.77932 20.2918 9.99909 20.12 10.1863C19.9483 10.3735 19.7407 10.5244 19.5096 10.63C18.2796 11.1806 17.2346 12.0745 16.5002 13.2045C15.7659 14.3345 15.3733 15.6524 15.3696 17C15.3711 17.4701 15.418 17.9389 15.5096 18.4C15.5707 18.6818 15.5747 18.973 15.5215 19.2564C15.4682 19.5397 15.3588 19.8096 15.1996 20.05C15.0649 20.2604 14.8877 20.4403 14.6793 20.5781C14.4709 20.7158 14.2359 20.8085 13.9896 20.85C13.4554 20.9504 12.9131 21.0006 12.3696 21C11.1638 21.0006 9.97011 20.7588 8.85952 20.2891C7.74893 19.8194 6.74405 19.1314 5.90455 18.2657C5.06506 17.4001 4.40807 16.3747 3.97261 15.2502C3.53714 14.1257 3.33208 12.9252 3.36959 11.72C3.4472 9.47279 4.3586 7.33495 5.92622 5.72296C7.49385 4.11097 9.60542 3.14028 11.8496 3H12.3596C14.0353 3.00042 15.6777 3.46869 17.1017 4.35207C18.5257 5.23544 19.6748 6.49885 20.4196 8C20.6488 8.47498 20.6812 9.02129 20.5096 9.52V9.54Z"/><path d="M8 16.01L8.01 15.9989"/><path d="M6 12.01L6.01 11.9989"/><path d="M8 8.01L8.01 7.99889"/><path d="M12 6.01L12.01 5.99889"/><path d="M16 8.01L16.01 7.99889"/></svg>`,
            custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z"/><path d="M20.5 16.7222L12.2914 12.1619C12.1102 12.0612 11.8898 12.0612 11.7086 12.1619L3.5 16.7222"/><path d="M3.52844 7.29357L11.7086 11.8381C11.8898 11.9388 12.1102 11.9388 12.2914 11.8381L20.5 7.27777"/><path d="M12 21L12 3"/></svg>`
        };
        categoryIcon.innerHTML = icons[this.activeCategory] || icons.devices;
    }    

    updatePlaceholder() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const placeholders = {
            devices: 'Geräte suchen...',
            scripts: 'Skripte suchen...',
            automations: 'Automationen suchen...',
            scenes: 'Szenen suchen...',
            custom: 'Custom suchen...'
        };
        searchInput.placeholder = placeholders[this.activeCategory] || placeholders.devices;
    }

    async updateItems() {
        if (!this._hass) return;
        
        let allEntityConfigs = [];
        
        // 1. Auto-Discovery wenn aktiviert
        if (this._config.auto_discover) {
            const discoveredEntities = this.discoverEntities();
            allEntityConfigs = [...discoveredEntities];
            console.log(`Auto-discovered: ${discoveredEntities.length} entities`);
        }
    
        // 1.5. Custom Data Sources (NEU: IMMER prüfen, nicht nur bei activeCategory)
        if (this._config.custom_mode.enabled) {
            console.log(`🔄 Loading custom items...`);
            const customItems = await this.parseCustomDataSources();
            if (customItems && Array.isArray(customItems)) { // ← Sicherheitscheck hinzufügen
                allEntityConfigs = [...allEntityConfigs, ...customItems];
                console.log(`🍳 Custom items: ${customItems.length} items`);
            } else {
                console.log(`🍳 No custom items found`);
            }
        }
        
        // 2. Manuelle Entities hinzufügen (überschreiben Auto-Discovery)
        if (this._config.entities && this._config.entities.length > 0) {
            const manualEntityIds = new Set(this._config.entities.map(e => e.entity));
            
            // Entferne Auto-Discovery Duplikate
            allEntityConfigs = allEntityConfigs.filter(entity => !manualEntityIds.has(entity.entity));
            
            // Füge manuelle Entities hinzu
            allEntityConfigs = [...allEntityConfigs, ...this._config.entities];
            console.log(`Added ${this._config.entities.length} manual entities`);
        }
        
        console.log(`Total entities to process: ${allEntityConfigs.length}`);
        
        // 3. Entity-Objekte erstellen
        this.allItems = allEntityConfigs.map(entityConfig => {
            // Custom Items bereits fertig verarbeitet
            if (entityConfig.domain === 'custom') {
                return entityConfig;
            }

            // Regular HA entities
            const entityId = entityConfig.entity;
            const state = this._hass.states[entityId];
            if (!state) {
                console.warn(`Entity not found: ${entityId}`);
                return null;
            }
            
            const domain = entityId.split('.')[0];
            const areaName = entityConfig.area || this.getEntityArea(entityId, state);
            
            return {
                id: entityId,
                name: entityConfig.title || state.attributes.friendly_name || entityId,
                domain: domain,
                category: this.categorizeEntity(domain),
                area: areaName,
                state: state.state,
                attributes: state.attributes,
                icon: this.getEntityIcon(domain),
                isActive: this.isEntityActive(state),
                auto_discovered: entityConfig.auto_discovered || false
            };
        }).filter(Boolean);
        
        this.allItems.sort((a, b) => {
            const areaA = a.area || 'Unbekannt';
            const areaB = b.area || 'Unbekannt';
            return areaA.localeCompare(areaB);
        });
        
        this.rebuildSearchIndex();      
        this.showCurrentCategoryItems();
        this.updateSubcategoryCounts();
        
        console.log(`Final items: ${this.allItems.length} (${this.allItems.filter(i => i.auto_discovered).length} auto-discovered, ${this.allItems.filter(i => i.domain === 'custom').length} custom)`);
    }


    // NEU: Hauptmethode für Multiple Data Sources
    async parseCustomDataSources() {
        const customMode = this._config.custom_mode;
        let allCustomItems = [];
        
        // NEU: Multiple data_sources unterstützen
        if (customMode.data_sources && customMode.data_sources.length > 0) {
            console.log(`🔗 Processing ${customMode.data_sources.length} data sources...`);
            
            for (let i = 0; i < customMode.data_sources.length; i++) {
                const dataSource = customMode.data_sources[i];
                console.log(`📊 Processing data source ${i + 1}/${customMode.data_sources.length}: ${dataSource.type}`);
                
                try {
                    const items = await this.parseSingleDataSource(dataSource, i);
                    if (items && Array.isArray(items)) {
                        allCustomItems = [...allCustomItems, ...items];
                        console.log(`✅ Loaded ${items.length} items from ${dataSource.entity || dataSource.type}`);
                    } else {
                        console.warn(`⚠️ No items returned from data source ${i + 1}`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing data source ${i + 1}:`, error);
                    continue; // Skip fehlerhafte Datenquelle, aber andere fortsetzen
                }
            }
        }
        // LEGACY: Einzelne data_source unterstützen (Rückwärtskompatibilität)
        else if (customMode.data_source) {
            console.log(`📄 Processing single legacy data source...`);
            try {
                allCustomItems = await this.parseSingleDataSource(customMode.data_source, 0);
            } catch (error) {
                console.error(`❌ Error processing legacy data source:`, error);
                allCustomItems = [];
            }
        }
        
        console.log(`🎯 Total custom items loaded: ${allCustomItems.length}`);
        return allCustomItems || [];
    }
    
    // NEU: Einzelne Datenquelle verarbeiten
    async parseSingleDataSource(dataSource, index = 0) {
        // Validierung
        if (!dataSource || !dataSource.type) {
            console.warn('Invalid data source: missing type');
            return [];
        }
        
        console.log(`🔍 Parsing ${dataSource.type} data source:`, dataSource.entity || 'static');
        
        switch (dataSource.type) {
            case 'template_sensor':
                return this.parseTemplateSensor(dataSource, index);
            case 'sensor': 
                return this.parseSensor(dataSource, index);
            case 'mqtt':
                return this.parseMqttSensor(dataSource, index);
            case 'static':
                return this.parseStaticData(dataSource, index);
            default:
                console.warn(`Unknown data source type: ${dataSource.type}`);
                return [];
        }
    }    


    // NEU: Static Data Support
    parseStaticData(dataSource, sourceIndex = 0) {
        const items = dataSource.items || [];
        const sourcePrefix = dataSource.prefix || `static_${sourceIndex}`;
        
        console.log(`📄 Processing ${items.length} static items with prefix: ${sourcePrefix}`);
        
        return items.map((item, index) => {
            const itemId = `${sourcePrefix}_${item.id || index}`;
            
            // 🆕 HIER: Prüfe ob gespeicherte Version in localStorage existiert
            const storageKey = `fast_search_static_${itemId}`;
            let content = item.content || `# ${item.name}\n\nStatischer Eintrag`;
            
            try {
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    content = parsedData.content || content; // Verwende gespeicherten Content
                    console.log(`✅ Loaded saved content for: ${item.name}`);
                }
            } catch (error) {
                console.warn(`⚠️ Could not load saved content for ${item.name}:`, error);
                // Fallback to original content
            }
            
            return {
                id: itemId,
                name: item.name || `Static Item ${index + 1}`,
                domain: 'custom',
                category: 'custom',
                area: item.area || dataSource.area || this._config.custom_mode.area,
                state: 'available',
                attributes: {
                    friendly_name: item.name,
                    custom_type: 'static',
                    source_prefix: sourcePrefix,
                    source_index: sourceIndex
                },
                icon: item.icon || dataSource.icon || this._config.custom_mode.icon,
                isActive: false,
                custom_data: {
                    type: 'static',
                    content: content, // 🆕 Hier wird der gespeicherte Content verwendet
                    metadata: {
                        ...item,
                        data_source: 'static',
                        source_index: sourceIndex,
                        has_saved_content: !!localStorage.getItem(storageKey) // Info ob gespeichert
                    }
                }
            };
        });
    }
    
    parseMqttSensor(dataSource, sourceIndex = 0) {
        const state = this._hass.states[dataSource.entity];
        if (!state || !state.attributes) {
            console.warn(`MQTT Sensor not found: ${dataSource.entity}`);
            return [];
        }
        
        const contentAttr = dataSource.content_attribute || 'items';
        let items = state.attributes[contentAttr];
        
        // Parse JSON string if needed
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error('Failed to parse JSON from MQTT sensor:', e);
                return [];
            }
        }
        
        if (!Array.isArray(items)) {
            console.warn(`No valid array found in MQTT sensor ${contentAttr}`);
            return [];
        }
    
        const sourcePrefix = dataSource.prefix || 
                            dataSource.entity.replace(/[^a-zA-Z0-9]/g, '_') || 
                            `mqtt_${sourceIndex}`;
        
        console.log(`📡 Processing ${items.length} MQTT items with prefix: ${sourcePrefix}`);
        
        return items.map((item, index) => ({
            id: `${sourcePrefix}_${item.id || index}`,
            name: item.name || `MQTT Item ${index + 1}`,
            domain: 'custom',
            category: 'custom',
            area: item.area || dataSource.area || this._config.custom_mode.area,
            state: 'available',
            attributes: {
                friendly_name: item.name,
                custom_type: 'mqtt',
                source_entity: dataSource.entity,
                source_prefix: sourcePrefix,
                source_index: sourceIndex
            },
            icon: item.icon || dataSource.icon || '📡',
            isActive: false,
            custom_data: {
                type: 'mqtt',
                content: item.content || `# ${item.name}\n\nMQTT Eintrag`,
                metadata: {
                    ...item,
                    data_source: dataSource.entity,
                    source_index: sourceIndex
                }
            }
        }));
    }
    
    rebuildSearchIndex() {
        // Standard search options für normale Items
        const standardSearchOptions = {
            fields: ['name', 'area', 'id'],
            storeFields: ['id', 'name', 'domain', 'category', 'area', 'state', 'attributes', 'icon', 'isActive'],
            idField: 'id',
            searchOptions: {
                boost: { 
                    name: 1.0,
                    area: 0.7,
                    id: 0.3
                },
                fuzzy: 0.4
            }
        };
    
        // Erweiterte search options für Custom Items
        const customSearchOptions = {
            fields: [
                'name',           // Item name
                'area',           // Area
                'id',             // ID
                'content',        // Markdown content (VOLLTEXT!)
                'category',       // metadata.category
                'difficulty',     // metadata.difficulty  
                'time',           // metadata.time
                'icon',           // metadata.icon
                'type',           // custom_data.type
                'all_metadata'    // Alle metadata als String (flexibel für neue Felder)
            ],
            storeFields: ['id', 'name', 'domain', 'category', 'area', 'state', 'attributes', 'icon', 'isActive', 'custom_data'],
            idField: 'id',
            searchOptions: {
                boost: { 
                    name: 2.0,        // Höchste Priorität
                    category: 1.5,    // Hoch für Kategorien
                    difficulty: 1.2,  // Mittel-hoch
                    time: 1.0,        // Standard
                    content: 0.8,     // Niedriger für Volltext
                    area: 0.7,        // Standard
                    all_metadata: 0.5, // Niedrig für catch-all
                    id: 0.3           // Niedrigste Priorität
                },
                fuzzy: 0.5  // Höhere Fuzzy-Toleranz für Custom
            }
        };
    
        // Erstelle zwei getrennte Indizes
        this.searchIndex = new MiniSearch(standardSearchOptions);
        this.customSearchIndex = new MiniSearch(customSearchOptions);
        
        if (this.allItems && this.allItems.length > 0) {
            try {
                // Standard Items (non-custom)
                const standardItems = this.allItems.filter(item => item.domain !== 'custom');
                if (standardItems.length > 0) {
                    this.searchIndex.addAll(standardItems);
                }
                
                // Custom Items mit erweiterten Feldern
                const customItems = this.allItems
                    .filter(item => item.domain === 'custom')
                    .map(item => this.enrichCustomItemForSearch(item));
                    
                if (customItems.length > 0) {
                    this.customSearchIndex.addAll(customItems);
                }
                
                console.log(`Search index built: ${standardItems.length} standard, ${customItems.length} custom items`);
            } catch (error) {
                console.error('Error building search index:', error);
                this.searchIndex = null;
                this.customSearchIndex = null;
            }
        }
    }

    enrichCustomItemForSearch(item) {
        const metadata = item.custom_data?.metadata || {};
        const content = item.custom_data?.content || '';
        
        // Extrahiere alle Metadata-Werte als durchsuchbaren String
        const allMetadataValues = Object.entries(metadata)
            .filter(([key, value]) => 
                key !== 'content' && // Content separat behandeln
                typeof value === 'string' || typeof value === 'number'
            )
            .map(([key, value]) => `${key}:${value}`)
            .join(' ');
        
        return {
            ...item,
            // Erweiterte Suchfelder
            content: this.stripMarkdown(content),           // Content ohne Markdown-Syntax
            category: metadata.category || '',              // z.B. "Hauptspeise"
            difficulty: metadata.difficulty || '',          // z.B. "Mittel"
            time: metadata.time || '',                      // z.B. "25 min"
            icon: metadata.icon || item.icon || '',         // Icon
            type: item.custom_data?.type || '',             // "template_sensor", "mqtt", etc.
            all_metadata: allMetadataValues                 // Catch-all für neue Felder
        };
    }

    stripMarkdown(markdown) {
        if (!markdown) return '';
        
        return markdown
            // Entferne Markdown-Syntax
            .replace(/#{1,6}\s/g, '')           // Headers
            .replace(/\*\*(.*?)\*\*/g, '$1')    // Bold
            .replace(/\*(.*?)\*/g, '$1')        // Italic ← KORRIGIERT: Klammern hinzugefügt
            .replace(/`(.*?)`/g, '$1')          // Code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
            .replace(/>\s/g, '')                // Blockquotes
            .replace(/[-*+]\s/g, '')            // Lists
            .replace(/\d+\.\s/g, '')            // Numbered lists
            .replace(/\n+/g, ' ')               // Newlines zu Spaces
            .replace(/\s+/g, ' ')               // Mehrfache Spaces
            .trim();
    }

    
    discoverEntities() {
        if (!this._hass) {
            console.warn('HASS not available for auto-discovery');
            return [];
        }
        
        try {
            const discoveredEntities = [];
            const manualEntityIds = new Set((this._config.entities || []).map(e => e.entity));
            
            // Durch alle Entitäten in Home Assistant gehen
            for (const entityId in this._hass.states) {
                try {
                    const state = this._hass.states[entityId];
                    if (!state) continue;
                    
                    // Skip wenn bereits manuell definiert
                    if (manualEntityIds.has(entityId)) continue;
                    
                    const domain = entityId.split('.')[0];
                    
                    // Domain-Filter anwenden
                    if (this._config.include_domains.length > 0 && !this._config.include_domains.includes(domain)) continue;
                    if (this._config.exclude_domains.includes(domain)) continue;
                    
                    // Entity-Filter anwenden
                    if (this._config.exclude_entities.includes(entityId)) continue;
                    
                    // Area ermitteln
                    const areaName = this.getEntityArea(entityId, state);
                    
                    // Area-Filter anwenden
                    if (this._config.include_areas.length > 0 && !this._config.include_areas.includes(areaName)) continue;
                    if (this._config.exclude_areas.includes(areaName)) continue;
                    
                    // Versteckte/System-Entitäten überspringen
                    if (this.isSystemEntity(entityId, state)) continue;
                    
                    // Auto-discovered Entity erstellen
                    discoveredEntities.push({
                        entity: entityId,
                        title: state.attributes.friendly_name || entityId,
                        area: areaName,
                        auto_discovered: true
                    });
                    
                } catch (entityError) {
                    console.warn(`Error processing entity ${entityId}:`, entityError);
                    continue; // Skip problematic entity
                }
            }
            
            console.log(`Auto-discovered ${discoveredEntities.length} entities`);
            return discoveredEntities;
            
        } catch (error) {
            console.error('Error in auto-discovery:', error);
            return []; // Fallback to empty array
        }
    }
    
    getEntityArea(entityId, state) {
            try {
                // 1. PRIORITÄT: Echte Home Assistant Area (Entity Registry)
                if (this._hass.areas && this._hass.entities && this._hass.entities[entityId]) {
                    const entityRegistry = this._hass.entities[entityId];
                    if (entityRegistry.area_id && this._hass.areas[entityRegistry.area_id]) {
                        const area = this._hass.areas[entityRegistry.area_id];
                        return area.name;
                    }
                }
    
                // 2. PRIORITÄT: Device-based Area (Device Registry)
                if (this._hass.devices && this._hass.entities && this._hass.entities[entityId]) {
                    const entityRegistry = this._hass.entities[entityId];
                    if (entityRegistry.device_id && this._hass.devices[entityRegistry.device_id]) {
                        const device = this._hass.devices[entityRegistry.device_id];
                        
                        if (device.area_id && this._hass.areas && this._hass.areas[device.area_id]) {
                            const area = this._hass.areas[device.area_id];
                            return area.name;
                        }
                    }
                }
    
                // 3. PRIORITÄT: Intelligente friendly_name Analyse
                if (state.attributes.friendly_name) {
                    const friendlyName = state.attributes.friendly_name;
                    
                    // Liste der echten Areas aus Home Assistant für Matching
                    const realAreas = this._hass.areas ? Object.values(this._hass.areas).map(area => area.name.toLowerCase()) : [];
                    
                    // Suche nach echten Area-Namen im friendly_name (case-insensitive)
                    for (const areaName of realAreas) {
                        if (friendlyName.toLowerCase().includes(areaName)) {
                            // Finde die echte Area mit richtigem Case
                            const matchedArea = Object.values(this._hass.areas).find(area => 
                                area.name.toLowerCase() === areaName
                            );
                            if (matchedArea) {
                                return matchedArea.name;
                            }
                        }
                    }
                }
                
                // PURISTISCHER ANSATZ: Kein "Erstes-Wort-Fallback" mehr
                // Wenn nichts Eindeutiges gefunden wird, ist es "Ohne Raum"
                // Dies verhindert das Raten und fördert saubere Daten in Home Assistant
                return 'Ohne Raum';
                
            } catch (error) {
                console.warn(`❌ Error getting area for ${entityId}:`, error);
                return 'Ohne Raum';
            }
        }
 
    parseTemplateSensor(dataSource, sourceIndex = 0) {           
        const state = this._hass.states[dataSource.entity];
        
        if (!state || !state.attributes) {
            console.warn(`Template Sensor not found: ${dataSource.entity}`);
            return [];
        }        
        
        const contentAttr = dataSource.content_attribute || 'items';
        let items = state.attributes[contentAttr];
        
        // Parse logic...
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error('Failed to parse JSON from template sensor:', e);
                return [];
            }
        }
        
        if (!Array.isArray(items)) {
            console.warn(`No valid array found in ${contentAttr}`);
            return [];
        }
    
        const sourcePrefix = dataSource.prefix || 
                            dataSource.entity.replace(/[^a-zA-Z0-9]/g, '_') || 
                            `source_${sourceIndex}`;
    
        return items.map((item, index) => {
            const storageEntity = item.storage_entity;
            let content = item.content || 'Kein Inhalt.';
    
            if (storageEntity && this._hass.states[storageEntity]) {
                content = this._hass.states[storageEntity].state;
            }
    
            // 🔍 FIXED: Verbesserte Area Logic - Item area hat höchste Priorität
            let itemArea;
            
            // 1. Priorität: Area direkt am Item definiert
            if (item.area && item.area.trim() !== '') {
                itemArea = item.area.trim();
            }
            // 2. Priorität: Area in der dataSource definiert  
            else if (dataSource.area && dataSource.area.trim() !== '') {
                itemArea = dataSource.area.trim();
            }
            // 3. Priorität: Global definierte Area in custom_mode
            else if (this._config.custom_mode?.area && this._config.custom_mode.area.trim() !== '') {
                itemArea = this._config.custom_mode.area.trim();
            }
            // 4. Fallback
            else {
                itemArea = 'Ohne Raum';
            }
    
            return {
                id: `${sourcePrefix}_${item.id || index}`,
                name: item.name || `Item ${index + 1}`,
                domain: 'custom',
                category: 'custom',
                area: itemArea,
                state: 'available',
                attributes: {
                    friendly_name: item.name,
                    custom_type: 'template_sensor',
                    source_entity: dataSource.entity,
                    source_prefix: sourcePrefix,
                    source_index: sourceIndex,
                    area: itemArea  // 🆕 Explizit auch in attributes setzen
                },
                icon: item.icon || dataSource.icon || this._config.custom_mode?.icon,
                isActive: false,
                custom_data: {
                    type: 'template_sensor',
                    content: content,
                    metadata: {
                        ...item,
                        area: itemArea,  // 🆕 Auch in metadata
                        data_source: dataSource.entity,
                        source_index: sourceIndex
                    }
                }
            };
        });
    }
    
    generateFallbackContent(item) {
        let content = `# ${item.name || 'Template Item'}\n\n`;
        Object.entries(item).forEach(([key, value]) => {
            if (key !== 'name' && key !== 'content') {
                content += `- **${key}:** ${value}\n`;
            }
        });
        return content;
    }    

    parseSensor(dataSource) {
        const state = this._hass.states[dataSource.entity];
        if (!state || !state.attributes) {
            console.warn(`Sensor not found: ${dataSource.entity}`);
            return [];
        }
    
        // Try to find array data in attributes
        const possibleArrays = ['items', 'data', 'list', 'entries', 'components'];
        let items = null;
        
        for (const attrName of possibleArrays) {
            if (state.attributes[attrName]) {
                items = state.attributes[attrName];
                break;
            }
        }
        
        // If custom attribute specified, use that
        if (dataSource.content_attribute) {
            items = state.attributes[dataSource.content_attribute];
        }
        
        // Parse JSON if string
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error('Failed to parse JSON from sensor:', e);
                return [];
            }
        }
        
        // If no array found, create single item from sensor itself
        if (!Array.isArray(items)) {
            return [{
                id: `sensor_${dataSource.entity}`,
                name: state.attributes.friendly_name || state.entity_id,
                domain: 'custom',
                category: 'custom',
                area: this._config.custom_mode.area || 'Sensors',
                state: state.state,
                attributes: {
                    friendly_name: state.attributes.friendly_name,
                    custom_type: 'sensor_single',
                    source_entity: dataSource.entity
                },
                icon: this._config.custom_mode.icon || '📊',
                isActive: false,
                custom_data: {
                    type: 'sensor_single',
                    content: this.generateSensorContent(state),
                    metadata: { sensor_state: state.state, ...state.attributes }
                }
            }];
        }
        
        // Process array items
        const fields = dataSource.fields || {
            name: 'name',
            content: 'content',
            icon: 'icon'
        };
    
        return items.map((item, index) => ({
            id: `sensor_${dataSource.entity}_${item.id || index}`,
            name: item[fields.name] || `Item ${index + 1}`,
            domain: 'custom',
            category: 'custom',
            area: this._config.custom_mode.area || 'Sensors',
            state: 'available',
            attributes: {
                friendly_name: item[fields.name],
                custom_type: 'sensor_array',
                source_entity: dataSource.entity
            },
            icon: item[fields.icon] || this._config.custom_mode.icon || '📊',
            isActive: false,
            custom_data: {
                type: 'sensor_array',
                content: item[fields.content] || this.generateFallbackContent(item),
                metadata: item
            }
        }));
    }
    
    generateSensorContent(state) {
        // Auto-generate markdown from sensor attributes
        let content = `# ${state.attributes.friendly_name || state.entity_id}\n\n`;
        content += `## Aktueller Wert\n**${state.state}** ${state.attributes.unit_of_measurement || ''}\n\n`;
        
        content += `## Attribute\n`;
        Object.entries(state.attributes).forEach(([key, value]) => {
            if (!['friendly_name', 'unit_of_measurement'].includes(key)) {
                content += `- **${key}:** ${value}\n`;
            }
        });
    
        content += `\n## Historie\n`;
        content += `Letzte Aktualisierung: ${new Date(state.last_updated).toLocaleString()}\n`;
    
        return content;
    }    



    parseMarkdown(markdown) {
        if (!markdown) return '';
        
        // Einfacher Markdown Parser
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            
            // Bold & Italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Lists
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>')
            
            // Blockquotes
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            
            // Line breaks
            .replace(/\n/g, '<br>');
        
        // Wrap lists
        html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        
        return html;
    }

    parseFilterSyntax(query) {
        // Erkenne Filter-Syntax: "präfix:wert rest des queries"
        const filterPattern = /(\w+):([^\s]+)/g;
        const filters = [];
        let cleanedQuery = query;
        
        let match;
        while ((match = filterPattern.exec(query)) !== null) {
            const [fullMatch, key, value] = match;
            
            // Normalisiere Filter-Keys (deutsch und englisch)
            const normalizedKey = this.normalizeFilterKey(key.toLowerCase());
            
            if (normalizedKey) {
                filters.push({
                    key: normalizedKey,
                    value: value.toLowerCase(),
                    originalFilter: fullMatch
                });
                
                // Entferne Filter aus dem Haupt-Query
                cleanedQuery = cleanedQuery.replace(fullMatch, '').trim();
            }
        }
        
        return {
            originalQuery: query,
            cleanedQuery: cleanedQuery,
            filters: filters
        };
    }    

    preprocessQuery(query) {
        let processedQuery = query.toLowerCase().trim();
        
        // 1. Entferne häufige Leerzeichen-Probleme
        processedQuery = processedQuery.replace(/\s+/g, ' '); // Mehrfache Leerzeichen
        
        // 2. NEUE: Zeit-Pattern direkt behandeln (vor anderen Normalisierungen)
        processedQuery = processedQuery.replace(/(\d+)min\b/g, '$1 min');
        processedQuery = processedQuery.replace(/(\d+)mins\b/g, '$1 min');
        processedQuery = processedQuery.replace(/(\d+)h\b/g, '$1 h');
        processedQuery = processedQuery.replace(/(\d+)std\b/g, '$1 h');
        processedQuery = processedQuery.replace(/(\d+)stunden\b/g, '$1 h');
        processedQuery = processedQuery.replace(/(\d+)minuten\b/g, '$1 min');
        
        // 3. Normalisiere häufige Schreibweisen (GEÄNDERT - Zeit-Patterns entfernt)
        const normalizations = {
            // Häufige Tippfehler (für deine Rezepte)
            'carboanra': 'carbonara',
            'carbonnara': 'carbonara', 
            'tiramisu': 'tiramisu',
            'tiramisù': 'tiramisu',
            'tiramisú': 'tiramisu',
            'margherita': 'margherita',
            'margarita': 'margherita', // Häufiger Fehler
            'margarhita': 'margherita',
            
            // Akzent-Normalisierung
            'café': 'cafe',
            'crème': 'creme',
            'naïve': 'naive'
        };
        
        // Wende Normalisierungen an
        Object.entries(normalizations).forEach(([wrong, correct]) => {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            processedQuery = processedQuery.replace(regex, correct);
        });
        
        // 3. Entferne häufige Füllwörter bei Custom Search
        if (this.activeCategory === 'custom') {
            const stopWords = ['der', 'die', 'das', 'und', 'oder', 'mit', 'ohne', 'für', 'von', 'zu', 'in', 'an', 'auf'];
            const words = processedQuery.split(' ');
            const filteredWords = words.filter(word => 
                word.length > 2 && !stopWords.includes(word)
            );
            
            // Nur filtern wenn genug Wörter übrig bleiben
            if (filteredWords.length > 0 && filteredWords.length >= words.length * 0.5) {
                processedQuery = filteredWords.join(' ');
            }
        }
        
        return processedQuery;
    }    

    enhanceSearchResults(results, originalQuery) {
        // Zusätzliche Fuzzy-Matches für sehr ähnliche Begriffe
        const enhancedResults = [...results];
        
        if (results.length < 3 && originalQuery.length >= 4) {
            // Versuche ähnliche Begriffe zu finden
            const similarMatches = this.findSimilarMatches(originalQuery);
            enhancedResults.push(...similarMatches);
        }
        
        // Sortiere nach Relevanz (Score + String-Ähnlichkeit)
        enhancedResults.sort((a, b) => {
            const scoreA = a.searchScore || a.score || 0;
            const scoreB = b.searchScore || b.score || 0;
            
            // Bei ähnlichen Scores: bevorzuge exakte Matches
            if (Math.abs(scoreA - scoreB) < 0.1) {
                const exactMatchA = a.name.toLowerCase().includes(originalQuery.toLowerCase()) ? 1 : 0;
                const exactMatchB = b.name.toLowerCase().includes(originalQuery.toLowerCase()) ? 1 : 0;
                return exactMatchB - exactMatchA;
            }
            
            return scoreB - scoreA;
        });
        
        // Entferne Duplikate
        const uniqueResults = enhancedResults.filter((item, index, array) => 
            array.findIndex(other => other.id === item.id) === index
        );
        
        return uniqueResults;
    }    

    calculateContentSimilarity(query, content) {
        if (!content || query.length < 3) return 0;
        
        const cleanContent = this.stripMarkdown(content).toLowerCase();
        const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
        
        let totalSimilarity = 0;
        let matchedWords = 0;
        
        queryWords.forEach(word => {
            // Suche ähnliche Wörter im Content
            const contentWords = cleanContent.split(' ').filter(w => w.length > 2);
            
            for (const contentWord of contentWords) {
                const similarity = this.calculateStringSimilarity(word, contentWord);
                if (similarity > 0.7) {
                    totalSimilarity += similarity;
                    matchedWords++;
                    break; // Nur besten Match pro Query-Word
                }
            }
        });
        
        return matchedWords > 0 ? totalSimilarity / queryWords.length : 0;
    }
    
    calculateStringSimilarity(str1, str2) {
        // Levenshtein Distance implementierung (vereinfacht)
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        // Matrix initialisieren
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        // Matrix füllen
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i-1] === str2[j-1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i-1][j] + 1,     // Deletion
                    matrix[i][j-1] + 1,     // Insertion  
                    matrix[i-1][j-1] + cost // Substitution
                );
            }
        }
        
        // Ähnlichkeit berechnen (0-1)
        const maxLen = Math.max(len1, len2);
        return 1 - (matrix[len1][len2] / maxLen);
    }    

    findSimilarMatches(query) {
        const similarMatches = [];
        const categoryItems = this.allItems.filter(item => 
            this.isItemInCategory(item, this.activeCategory)
        );
        
        categoryItems.forEach(item => {
            const similarity = this.calculateStringSimilarity(query.toLowerCase(), item.name.toLowerCase());
            
            // Wenn sehr ähnlich (>70%), als Match betrachten
            if (similarity > 0.7) {
                similarMatches.push({
                    ...item,
                    searchScore: similarity * 0.8, // Etwas niedrigerer Score als exakte Matches
                    fuzzyMatch: true
                });
            }
            
            // Auch Content durchsuchen bei Custom Items
            if (item.domain === 'custom' && item.custom_data?.content) {
                const contentSimilarity = this.calculateContentSimilarity(query, item.custom_data.content);
                if (contentSimilarity > 0.6) {
                    similarMatches.push({
                        ...item,
                        searchScore: contentSimilarity * 0.6,
                        fuzzyMatch: true
                    });
                }
            }
        });
        
        return similarMatches;
    }    

    normalizeFilterKey(key) {
        // Mapping von verschiedenen Bezeichnungen zu Standard-Keys
        const keyMappings = {
            // Type/Typ
            'typ': 'type',
            'type': 'type',
            'art': 'type',
            
            // Category/Kategorie  
            'kategorie': 'category',
            'category': 'category',
            'cat': 'category',
            'gruppe': 'category',
            
            // Area/Raum
            'raum': 'area',
            'area': 'area',
            'bereich': 'area',
            'zimmer': 'area',
            
            // Difficulty/Schwierigkeit
            'schwierigkeit': 'difficulty',
            'difficulty': 'difficulty',
            'level': 'difficulty',
            
            // Time/Zeit
            'zeit': 'time',
            'time': 'time',
            'dauer': 'time',
            
            // Status
            'status': 'status',
            'zustand': 'status',
            
            // Priority/Priorität
            'priorität': 'priority',
            'priority': 'priority',
            'prio': 'priority'
        };
        
        return keyMappings[key] || null;
    }    
    
    isSystemEntity(entityId, state) {
        // System-Entitäten überspringen
        const systemPrefixes = ['sun.', 'zone.', 'persistent_notification.', 'updater.'];
        if (systemPrefixes.some(prefix => entityId.startsWith(prefix))) return true;
        
        // Versteckte Entitäten
        if (state.attributes.hidden === true) return true;
        
        // Entitäten ohne friendly_name (meist system)
        if (!state.attributes.friendly_name && !entityId.includes('_')) return true;
        
        return false;
    }    

    getSubcategoryStatusText(subcategory, count) {
        const textMap = { 'lights': 'An', 'climate': 'Aktiv', 'covers': 'Offen', 'media': 'Aktiv' };
        const text = textMap[subcategory] || 'Aktiv'; 
        return `${count} ${text}`;
    }

    updateSubcategoryCounts() {
        if (!this._hass || !this.allItems) return;
        
        // Domain-zu-Subcategory Mapping (gleich wie in renderCategoryChips)
        const domainMap = { 
            'lights': ['light', 'switch'], 
            'climate': ['climate', 'fan'], 
            'covers': ['cover'], 
            'media': ['media_player'] 
        };
        
        // Nur für verfügbare Subcategories Counts berechnen
        for (const subcategory in domainMap) {
            const chip = this.shadowRoot.querySelector(`.subcategory-chip[data-subcategory="${subcategory}"]`);
            if (!chip) continue; // Skip wenn Chip nicht existiert (weil Domain nicht verfügbar)
            
            const domains = domainMap[subcategory];
            const categoryItems = this.allItems.filter(item => 
                this.isItemInCategory(item, 'devices') && domains.includes(item.domain)
            );
            
            const activeCount = categoryItems.filter(item => {
                const state = this._hass.states[item.id];
                return state && this.isEntityActive(state);
            }).length;
            
            const statusText = this.getSubcategoryStatusText(subcategory, activeCount);
            const statusElement = chip.querySelector('.subcategory-status');
            if (statusElement) { 
                statusElement.textContent = statusText; 
            }
        }
        
        // "Alle" Chip Count aktualisieren
        const allChip = this.shadowRoot.querySelector(`.subcategory-chip[data-subcategory="all"]`);
        if (allChip) {
            const allCategoryItems = this.allItems.filter(item => this.isItemInCategory(item, 'devices'));
            const allActiveCount = allCategoryItems.filter(item => {
                const state = this._hass.states[item.id];
                return state && this.isEntityActive(state);
            }).length;
            
            const statusElement = allChip.querySelector('.subcategory-status');
            if (statusElement) {
                statusElement.textContent = `${allActiveCount} Aktiv`;
            }
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

        const deviceListItems = this.shadowRoot.querySelectorAll('.device-list-item');
        deviceListItems.forEach(listItem => {
            const entityId = listItem.dataset.entity;
            const state = this._hass.states[entityId];
            if (state) {
                const isActive = this.isEntityActive(state);
                const wasActive = listItem.classList.contains('active');
                listItem.classList.toggle('active', isActive);
                
                if (isActive !== wasActive) {
                    this.animateStateChange(listItem, isActive);
                }
                
                // Update status text
                const statusElement = listItem.querySelector('.device-list-status');
                if (statusElement) {
                    statusElement.textContent = this.getEntityStatus(state);
                }
                
                // Update quick action button
                const quickActionBtn = listItem.querySelector('.device-list-quick-action');
                if (quickActionBtn) {
                    this.updateQuickActionButton(quickActionBtn, entityId, state);
                }
            }
        });
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
                // SMART CHECK: Nur als aktiv zählen wenn wirklich etwas läuft
                if (!['playing', 'paused'].includes(state.state)) return false;
                
                // Zusätzliche Prüfung für beendete Songs
                const duration = state.attributes.media_duration || 0;
                const position = state.attributes.media_position || 0;
                const updatedAt = state.attributes.media_position_updated_at;
                
                if (state.state === 'playing' && duration > 0 && updatedAt) {
                    const now = new Date();
                    const updateTime = new Date(updatedAt);
                    const elapsedSinceUpdate = (now - updateTime) / 1000;
                    const realPosition = position + elapsedSinceUpdate;
                    
                    // Nicht aktiv wenn Song zu Ende
                    if (realPosition >= duration) return false;
                }
                
                return true;
                
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
                const coverPosition = state.attributes.current_position; // UMBENANNT!
                if (coverPosition !== undefined) {
                    if (coverPosition > 0) return `${coverPosition}% Offen`;
                    return 'Geschlossen';
                }
                return state.state === 'open' ? 'Offen' : 'Geschlossen';
            case 'media_player':
                // SMART STATUS: Prüfe ob Song wirklich noch läuft
                const duration = state.attributes.media_duration || 0;
                const mediaPosition = state.attributes.media_position || 0; // UMBENANNT!
                const updatedAt = state.attributes.media_position_updated_at;
                
                // Berechne echte Position
                let realPosition = mediaPosition; // ANGEPASST!
                if (state.state === 'playing' && updatedAt) {
                    const now = new Date();
                    const updateTime = new Date(updatedAt);
                    const elapsedSinceUpdate = (now - updateTime) / 1000;
                    realPosition = mediaPosition + elapsedSinceUpdate; // ANGEPASST!
                }
                
                // Status basierend auf echter Position
                if (state.state === 'playing' && duration > 0 && realPosition >= duration) {
                    return 'Bereit';
                } else if (state.state === 'playing') {
                    return 'Spielt';
                } else if (state.state === 'paused') {
                    return 'Pausiert';
                } else {
                    return 'Aus';
                }
                
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

    getCustomStatusText(item) {
        const metadata = item.custom_data?.metadata || {};
        
        // Zeige relevante Info als Status
        if (metadata.category) return metadata.category;
        if (metadata.type) return metadata.type;
        return 'Custom Item';
    }    

    performSearch(query) {
        const startTime = performance.now();
        
        if (!query.trim()) { 
            this.showCurrentCategoryItems(); 
            return; 
        }
        
        // NEU: Query preprocessing
        const preprocessedQuery = this.preprocessQuery(query);
        
        const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
        
        // KORREKTUR: Parse Filter-Syntax mit preprocessedQuery (nicht original query)
        const parsedQuery = this.parseFilterSyntax(preprocessedQuery);
        const searchQuery = parsedQuery.cleanedQuery;
        
        if (parsedQuery.filters.length > 0) {
            console.log('Filter-Syntax detected:', {
                original: query,
                preprocessed: preprocessedQuery,  // ← NEU hinzugefügt
                cleaned: parsedQuery.cleanedQuery,
                filters: parsedQuery.filters
            });
        }
        
        if (this.activeCategory === 'custom' && this.customSearchIndex) {
            // CUSTOM SEARCH mit Filter-Syntax
            try {
                let searchResults;
                
                if (searchQuery.trim()) {
                    // Normale Suche mit Rest-Query
                    searchResults = this.customSearchIndex.search(searchQuery);
                    
                    // ← NEU: Enhance results mit Fuzzy Matching
                    searchResults = this.enhanceSearchResults(searchResults, query);
                } else {
                    // Nur Filter, keine Text-Suche → alle Custom Items
                    searchResults = categoryItems.map(item => ({ ...item, score: 1 }));
                }
                
                let filteredResults = searchResults
                    .filter(result => this.isItemInCategory(result, 'custom'))
                    .map(result => {
                        const originalItem = this.allItems.find(item => item.id === result.id);
                        return originalItem ? { ...originalItem, searchScore: result.score || result.searchScore } : null;  // ← KORREKTUR
                    })
                    .filter(Boolean);
                
                // Filter-Syntax anwenden
                filteredResults = this.applyFilterSyntax(filteredResults, parsedQuery.filters);
                
                this.filteredItems = filteredResults;
                console.log(`Enhanced Custom search: ${this.filteredItems.length} results (${parsedQuery.filters.length} filters applied)`);  // ← GEÄNDERT
                
            } catch (error) {
                console.error('Custom search error, falling back:', error);
                this.fallbackSearch(query, categoryItems);
            }
        } else if (this.searchIndex && categoryItems.length > 0) {
            // STANDARD SEARCH mit preprocessing
            try {
                const searchResults = this.searchIndex.search(searchQuery);
                
                this.filteredItems = searchResults
                    .filter(result => this.isItemInCategory(result, this.activeCategory))
                    .map(result => {
                        const originalItem = this.allItems.find(item => item.id === result.id);
                        return originalItem ? { ...originalItem, searchScore: result.score } : null;
                    })
                    .filter(Boolean);
                    
                console.log(`Enhanced Standard search: ${this.filteredItems.length} results`);  // ← GEÄNDERT
                
            } catch (error) {
                console.error('Standard search error, falling back:', error);
                this.fallbackSearch(query, categoryItems);
            }
        } else {
            // FALLBACK SEARCH
            this.fallbackSearch(query, categoryItems);
        }
    
        this.logSearchPerformance(query, startTime, 'EnhancedFuzzySearch', this.filteredItems.length);  // ← GEÄNDERT
        this.renderResults();
    }

    applyFilterSyntax(items, filters) {
        if (!filters || filters.length === 0) {
            return items;
        }
        
        return items.filter(item => {
            return filters.every(filter => {
                const metadata = item.custom_data?.metadata || {};
                
                switch (filter.key) {
                    case 'type':
                        const itemType = (item.custom_data?.type || '').toLowerCase();
                        return itemType.includes(filter.value);
                        
                    case 'category':
                        const category = (metadata.category || '').toLowerCase();
                        return category.includes(filter.value);
                        
                    case 'area':
                        const area = (item.area || '').toLowerCase();
                        return area.includes(filter.value);
                        
                    case 'difficulty':
                        const difficulty = (metadata.difficulty || '').toLowerCase();
                        return difficulty.includes(filter.value);
                        
                    case 'time':
                        const time = (metadata.time || '').toLowerCase();
                        return time.includes(filter.value);
                        
                    case 'status':
                        const status = (metadata.status || '').toLowerCase();
                        return status.includes(filter.value);
                        
                    case 'priority':
                        const priority = (metadata.priority || metadata.priorität || '').toLowerCase();
                        return priority.includes(filter.value);
                        
                    default:
                        // Fallback: Suche in allen Metadata-Feldern
                        const allMetadata = Object.values(metadata)
                            .filter(value => typeof value === 'string')
                            .join(' ')
                            .toLowerCase();
                        return allMetadata.includes(filter.value);
                }
            });
        });
    }    
    
    fallbackSearch(query, categoryItems) {
        const searchTerm = query.toLowerCase();
        this.filteredItems = categoryItems.filter(item => {
            return item.name.toLowerCase().includes(searchTerm) || 
                   item.id.toLowerCase().includes(searchTerm) || 
                   item.area.toLowerCase().includes(searchTerm);
        });
        
        console.log(`Fallback search found ${this.filteredItems.length} results for "${query}"`);
    }

    logSearchPerformance(query, startTime, method, resultCount) {
        const duration = performance.now() - startTime;
        console.log(`🔍 Search "${query}" via ${method}: ${resultCount} results in ${duration.toFixed(2)}ms`);
    }    

    handleSearchInput(value) {
        console.log('📝 handleSearchInput called with:', value);
        
        // Standard search logic
        this.handleSearch(value);
        
        // Autocomplete logic
        if (value.length >= 2) {
            console.log('🕐 Setting autocomplete timeout for:', value);
            clearTimeout(this.autocompleteTimeout);
            this.autocompleteTimeout = setTimeout(() => {
                console.log('⏰ Timeout fired, checking autocomplete type:', value);
                
                // NEU: Prüfe zuerst Filter-Autocomplete
                console.log('🔧 About to call updateFilterAutocomplete...');
                const usedFilterAutocomplete = this.updateFilterAutocomplete(value);
                console.log('🔧 Filter autocomplete result:', usedFilterAutocomplete);
                
                if (!usedFilterAutocomplete) {
                    // Standard Autocomplete nur wenn kein Filter-Autocomplete
                    this.updateAutocomplete(value);
                }
            }, 150);
        } else {
            console.log('❌ Value too short, clearing suggestion');
            this.clearSuggestion();
        }
    }
    
    handleSearchKeydown(e) {
        if (e.key === 'Tab' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.acceptSuggestion();
        } else if (e.key === 'Escape') {
            this.clearSuggestion();
        }
    }

    updateAutocomplete(query) {
        console.log('🔍 updateAutocomplete called with:', query);
        
        if (!query.trim() || query.length < 2) {
            console.log('❌ Query too short or empty');
            this.clearSuggestion();
            return;
        }
        
        // NEU: Verwende den richtigen Index basierend auf Category
        let searchIndex;
        if (this.activeCategory === 'custom' && this.customSearchIndex) {
            searchIndex = this.customSearchIndex;
        } else if (this.searchIndex) {
            searchIndex = this.searchIndex;
        } else {
            console.log('❌ No search index available');
            this.clearSuggestion();
            return;
        }
        
        try {
            console.log('✅ Starting autocomplete search with correct index...');
            
            const searchResults = searchIndex.search(query);
            console.log('📊 Autocomplete search results:', searchResults);
            
            // NEU: Filtere nach aktueller Category
            const categoryResults = searchResults.filter(result => 
                this.isItemInCategory(result, this.activeCategory)
            );
            
            console.log('📊 Category-filtered results:', categoryResults);
            
            if (categoryResults.length > 0) {
                const firstResult = categoryResults[0];
                console.log('🔍 First result details:', firstResult);
                
                // Suggestion basierend auf dem gefundenen Feld
                let suggestionText = '';
                
                // Intelligentere Suggestion-Logik
                if (this.activeCategory === 'custom') {
                    // Für Custom Items: bessere Feld-Priorisierung
                    if (firstResult.name && firstResult.name.toLowerCase().includes(query.toLowerCase())) {
                        suggestionText = firstResult.name;
                    } else if (firstResult.category && firstResult.category.toLowerCase().includes(query.toLowerCase())) {
                        suggestionText = firstResult.category;
                    } else if (firstResult.area && firstResult.area.toLowerCase().includes(query.toLowerCase())) {
                        suggestionText = firstResult.area;
                    } else {
                        suggestionText = firstResult.name; // Fallback
                    }
                } else {
                    // Für Standard Items
                    if (firstResult.name && firstResult.name.toLowerCase().includes(query.toLowerCase())) {
                        suggestionText = firstResult.name;
                    } else if (firstResult.area && firstResult.area.toLowerCase().includes(query.toLowerCase())) {
                        suggestionText = firstResult.area;
                    } else {
                        suggestionText = firstResult.name;
                    }
                }
                
                console.log('💡 Suggestion text:', suggestionText);
                this.showSuggestion(query, suggestionText);
            } else {
                console.log('❌ No category results');
                this.clearSuggestion();
            }
            
        } catch (error) {
            console.error('Autocomplete error:', error);
            this.clearSuggestion();
        }
    }

    updateFilterAutocomplete(query) {
        console.log('🎯 updateFilterAutocomplete called with:', query);
        
        // Erkenne ob User Filter-Syntax tippt
        const filterMatch = query.match(/([^\s:]+):([^\s:]*)$/);
        console.log('🔍 Filter match:', filterMatch);
        
        if (filterMatch) {
            const [, filterKey, filterValue] = filterMatch;
            console.log('🔑 Filter parts:', { filterKey, filterValue });
            
            const normalizedKey = this.normalizeFilterKey(filterKey.toLowerCase());
            console.log('🎲 Normalized key:', normalizedKey);
            
            if (normalizedKey && this.activeCategory === 'custom') {
                console.log('✅ Valid filter key and custom category');
                
                // Zeige verfügbare Werte für den Filter-Key
                const suggestions = this.getFilterValueSuggestions(normalizedKey, filterValue);
                console.log('💡 Filter suggestions:', suggestions);
                
                if (suggestions.length > 0) {
                    const suggestion = suggestions[0];
                    console.log('🎯 Best suggestion:', suggestion);
                    
                    // ✅ KORREKTUR: Prüfe ob Suggestion mit filterValue beginnt
                    if (suggestion.toLowerCase().startsWith(filterValue.toLowerCase())) {
                        // ✅ KORREKTUR: Korrekte Regex-Ersetzung
                        const fullSuggestion = query.replace(new RegExp(`${filterKey}:${filterValue}$`), `${filterKey}:${suggestion}`);
                        console.log(`💡 Filter Suggestion: "${query}" → "${fullSuggestion}"`);
                        this.showSuggestion(query, fullSuggestion);
                        return true; // Filter-Autocomplete verwendet
                    } else {
                        console.log('❌ Suggestion does not start with filter value');
                    }
                } else {
                    console.log('❌ No suggestions found');
                }
                
                // ✅ NEU: Auch wenn keine Suggestions, trotzdem als Filter-Autocomplete behandeln
                console.log(`⚠️ No filter suggestions found, but still filter syntax`);
                this.clearSuggestion();
                return true; // Verhindert Standard-Autocomplete
            } else {
                console.log('❌ Invalid filter key or not custom category');
            }
        } else {
            console.log('❌ No filter syntax detected');
        }
        
        // Erkenne unvollständige Filter-Keys
        const partialFilterMatch = query.match(/(\w+)$/);
        if (partialFilterMatch && !query.includes(':')) {
            const partialKey = partialFilterMatch[1].toLowerCase();
            const filterKeys = ['typ:', 'kategorie:', 'raum:', 'schwierigkeit:', 'zeit:', 'status:', 'priority:'];
            
            const matchingKey = filterKeys.find(key => 
                key.startsWith(partialKey) && key.length > partialKey.length
            );
            
            if (matchingKey) {
                const suggestion = query.replace(new RegExp(partialKey + '$'), matchingKey);
                console.log(`💡 Filter Key Suggestion: "${query}" → "${suggestion}"`);
                this.showSuggestion(query, suggestion);
                return true; // Filter-Key Autocomplete verwendet
            }
        }
        
        console.log('❌ No filter autocomplete used');
        return false; // Kein Filter-Autocomplete
    }

    getFilterValueSuggestions(filterKey, partialValue) {
            const customItems = this.allItems.filter(item => item.domain === 'custom');
            const suggestions = new Set();
            
            customItems.forEach(item => {
                const metadata = item.custom_data?.metadata || {};
                
                let values = [];
                switch (filterKey) {
                    case 'type':
                        values = [item.custom_data?.type].filter(Boolean);
                        break;
                    case 'category':
                        values = [metadata.category].filter(Boolean);
                        break;
                    case 'area':
                        values = [item.area].filter(Boolean);
                        break;
                    case 'difficulty':
                        values = [metadata.difficulty].filter(Boolean);
                        break;
                    case 'time':
                        values = [metadata.time].filter(Boolean);
                        break;
                    case 'status':
                        values = [metadata.status].filter(Boolean);
                        break;
                    case 'priority':
                        values = [metadata.priority, metadata.priorität].filter(Boolean);
                        break;
                }
                
                values.forEach(value => {
                    const lowerValue = value.toLowerCase();
                    const lowerPartial = partialValue.toLowerCase();
                    
                    // ✅ KORREKTUR: Verwende startsWith statt includes
                    if (lowerValue.startsWith(lowerPartial)) {
                        suggestions.add(value);
                    }
                });
            });
            
            // ✅ NEU: Sortiere nach Länge (kürzeste zuerst) für bessere Autocomplete-Erfahrung
            return Array.from(suggestions).sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const partial = partialValue.toLowerCase();
                
                // Exakte Matches zuerst
                if (aLower === partial && bLower !== partial) return -1;
                if (bLower === partial && aLower !== partial) return 1;
                
                // Dann nach Länge sortieren (kürzeste zuerst)
                return a.length - b.length;
            });
        }
        
    showSuggestion(query, suggestionText) {
        console.log('🔍 Suggestion:', query, '→', suggestionText); // DEBUG
        
        const suggestionInput = this.shadowRoot.querySelector('.search-suggestion');

        if (!suggestionInput) {
            console.error('❌ suggestion input not found'); // DEBUG
            return;
        }
        
        // Suggestion = query + rest of suggestion in gray
        const completion = suggestionText.slice(query.length);
        this.currentSuggestion = suggestionText;

        console.log('💡 Setting suggestion value:', query + completion); // DEBUG
        suggestionInput.value = query + completion;
    }
    
    acceptSuggestion() {
        if (this.currentSuggestion) {
            const searchInput = this.shadowRoot.querySelector('.search-input');
            searchInput.value = this.currentSuggestion;
            this.handleSearch(this.currentSuggestion);
            this.clearSuggestion();
        }
    }
    
    clearSuggestion() {
        const suggestionInput = this.shadowRoot.querySelector('.search-suggestion');
        suggestionInput.value = '';
        this.currentSuggestion = '';
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
            case 'custom': return item.domain === 'custom';
            default: return true;
        }
    }

    filterBySubcategory() {
        if (this.activeSubcategory === 'all') { 
            this.showCurrentCategoryItems(); 
            return; 
        }
        if (this.activeSubcategory === 'none') { 
            this.filteredItems = []; 
            this.renderResults(); 
            return; 
        }
    
        const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
        
        if (this.activeCategory === 'custom') {
            // Custom Category Filtering
            if (this.subcategoryMode === 'categories') {
                // Filter by metadata.category
                this.filteredItems = categoryItems.filter(item => {
                    const category = item.custom_data?.metadata?.category;
                    return category === this.activeSubcategory;
                });
            } else if (this.subcategoryMode === 'areas') {
                // Filter by area
                this.filteredItems = categoryItems.filter(item => item.area === this.activeSubcategory);
            } else if (this.subcategoryMode === 'types') {
                // Filter by custom_data.type
                this.filteredItems = categoryItems.filter(item => {
                    const type = item.custom_data?.type;
                    return type === this.activeSubcategory;
                });
            }
        } else if (this.subcategoryMode === 'areas') {
            // Standard area filtering
            this.filteredItems = categoryItems.filter(item => item.area === this.activeSubcategory);
        } else {
            // Standard device category filtering
            const domainMap = { 'lights': ['light', 'switch'], 'climate': ['climate', 'fan'], 'covers': ['cover'], 'media': ['media_player'] };
            const domains = domainMap[this.activeSubcategory] || [];
            this.filteredItems = categoryItems.filter(item => domains.includes(item.domain));
        }
        
        this.renderResults();
    }

    renderResults() {
        const resultsGrid = this.shadowRoot.querySelector('.results-grid');
        const resultsList = this.shadowRoot.querySelector('.results-list');
        
        // Clear timeouts
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts = [];
        
        // Hide both containers initially
        resultsGrid.style.display = this.currentViewMode === 'grid' ? 'grid' : 'none';
        resultsList.classList.toggle('active', this.currentViewMode === 'list');
        
        if (this.filteredItems.length === 0) {
            const emptyState = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Keine Ergebnisse</div><div class="empty-subtitle">Versuchen Sie einen anderen Suchbegriff</div></div>`;
            if (this.currentViewMode === 'grid') {
                resultsGrid.innerHTML = emptyState;
            } else {
                resultsList.innerHTML = emptyState;
            }
            return;
        }
        
        if (this.currentViewMode === 'grid') {
            this.renderGridResults(resultsGrid);
        } else {
            this.renderListResults(resultsList);
        }
    }
    
    renderGridResults(resultsGrid) {
        resultsGrid.innerHTML = '';
        const groupedItems = this.groupItemsByArea();
        
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
    
    renderListResults(resultsList) {
        resultsList.innerHTML = '';
        const groupedItems = this.groupItemsByArea();
        
        let itemIndex = 0;
        Object.keys(groupedItems).sort().forEach(area => {
            const areaHeader = document.createElement('div');
            areaHeader.className = 'area-header';
            areaHeader.textContent = area;
            resultsList.appendChild(areaHeader);
            
            groupedItems[area].forEach((item) => {
                const listItem = this.createDeviceListItem(item);
                resultsList.appendChild(listItem);
                if (!this.hasAnimated) {
                    const timeout = setTimeout(() => {
                        this.animateElementIn(listItem, { 
                            opacity: [0, 1], 
                            transform: ['translateX(-20px)', 'translateX(0)'] 
                        });
                    }, itemIndex * 30);
                    this.animationTimeouts.push(timeout);
                }
                itemIndex++;
            });
        });
        this.hasAnimated = true;
    }
    
    groupItemsByArea() {
        return this.filteredItems.reduce((groups, item) => {
            const area = item.area || 'Ohne Raum';
            if (!groups[area]) { groups[area] = []; }
            groups[area].push(item);
            return groups;
        }, {});
    }


    createDeviceCard(item) {
        const card = document.createElement('div');
        card.className = `device-card ${item.isActive ? 'active' : ''}`;
        
        if (item.domain === 'custom') {
            card.className += ' custom-item-card';
        }
        
        card.dataset.entity = item.id;
        
        const statusText = item.domain === 'custom' ? 
            this.getCustomStatusText(item) : 
            this.getEntityStatus(this._hass.states[item.id]);

        
        card.innerHTML = `<div class="device-icon">${item.icon}</div><div class="device-info"><div class="device-name">${item.name}</div><div class="device-status">${statusText}</div></div>`;
        card.addEventListener('click', () => this.handleDeviceClick(item, card));
        return card;
    }



    getCustomStatusText(item) {
        const metadata = item.custom_data?.metadata || {};
        
        if (metadata.category) return metadata.category;
        if (metadata.type) return metadata.type;
        return 'Custom Item';
    }


    


    toggleViewMode() {
        this.currentViewMode = this.currentViewMode === 'grid' ? 'list' : 'grid';
        this.updateViewToggleIcon();
        this.renderResults();
        // Hinzufügen:
        this.updateFilterButtonStates();        
    }
    
    updateViewToggleIcon() {
        // Legacy method - now handled by filter buttons
        this.updateFilterButtonStates();
    }

    toggleSubcategoryMode() {
        if (this.activeCategory === 'custom') {
            // Custom Category: 3 Modi cycling
            const customModes = ['categories', 'areas', 'types'];
            const currentIndex = customModes.indexOf(this.subcategoryMode);
            const nextIndex = (currentIndex + 1) % customModes.length;
            this.subcategoryMode = customModes[nextIndex];
        } else {
            // Standard: 2 Modi cycling
            this.subcategoryMode = this.subcategoryMode === 'categories' ? 'areas' : 'categories';
        }
        
        this.updateSubcategoryToggleIcon();
        this.updateSubcategoryChips();
        this.activeSubcategory = 'all'; // Reset selection
        this.renderResults();
        
        // Hinzufügen:
        this.updateFilterButtonStates();        
    }
    
    updateSubcategoryToggleIcon() {
        // Legacy method - now handled by filter buttons
        this.updateFilterButtonStates();
    }
    
    updateSubcategoryChips() {
        const subcategoriesContainer = this.shadowRoot.querySelector('.subcategories');
        
        if (this.activeCategory === 'custom') {
            this.renderCustomSubcategoryChips(subcategoriesContainer);
        } else if (this.subcategoryMode === 'areas') {
            this.renderAreaChips(subcategoriesContainer);
        } else {
            this.renderCategoryChips(subcategoriesContainer);
        }
    }

    renderCustomSubcategoryChips(container) {
        const customItems = this.allItems.filter(item => item.domain === 'custom');
        
        if (this.subcategoryMode === 'categories') {
            // Categories aus metadata sammeln
            const categories = new Set();
            customItems.forEach(item => {
                const category = item.custom_data?.metadata?.category;
                if (category) categories.add(category);
            });
            
            const chipsHTML = ['Alle', ...Array.from(categories).sort(), 'Keine'].map(cat => {
                const isActive = (cat === 'Alle' && this.activeSubcategory === 'all') || 
                                (cat === this.activeSubcategory);
                
                let count;
                if (cat === 'Alle') {
                    count = customItems.length;
                } else if (cat === 'Keine') {
                    count = customItems.filter(item => !item.custom_data?.metadata?.category).length;
                } else {
                    count = customItems.filter(item => item.custom_data?.metadata?.category === cat).length;
                }
                
                const subcategoryValue = cat === 'Alle' ? 'all' : 
                                       cat === 'Keine' ? 'none' : cat;
                
                return `
                    <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategoryValue}">
                        <div class="chip-content">
                            <span class="subcategory-name">${cat}</span>
                            <span class="subcategory-status">${count} Items</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = chipsHTML;
            
        } else if (this.subcategoryMode === 'areas') {
            // Custom Areas (nur aus Custom Items)
            const areas = new Set(customItems.map(item => item.area).filter(Boolean));
            
            const chipsHTML = ['Alle Räume', ...Array.from(areas).sort(), 'Keine'].map(area => {
                const isActive = (area === 'Alle Räume' && this.activeSubcategory === 'all') || 
                                (area === this.activeSubcategory);
                
                let count;
                if (area === 'Alle Räume') {
                    count = customItems.length;
                } else if (area === 'Keine') {
                    count = customItems.filter(item => !item.area).length;
                } else {
                    count = customItems.filter(item => item.area === area).length;
                }
                
                const subcategoryValue = area === 'Alle Räume' ? 'all' : 
                                       area === 'Keine' ? 'none' : area;
                
                return `
                    <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategoryValue}">
                        <div class="chip-content">
                            <span class="subcategory-name">${area}</span>
                            <span class="subcategory-status">${count} Items</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = chipsHTML;
            
        } else if (this.subcategoryMode === 'types') {
            // Custom Types
            const types = new Set(customItems.map(item => item.custom_data?.type).filter(Boolean));
            
            const typeLabels = {
                'template_sensor': 'Template Sensor',
                'mqtt': 'MQTT',
                'static': 'Static',
                'sensor': 'Sensor'
            };
            
            const chipsHTML = ['Alle', ...Array.from(types).sort(), 'Keine'].map(type => {
                const isActive = (type === 'Alle' && this.activeSubcategory === 'all') || 
                                (type === this.activeSubcategory);
                
                let count;
                if (type === 'Alle') {
                    count = customItems.length;
                } else if (type === 'Keine') {
                    count = customItems.filter(item => !item.custom_data?.type).length;
                } else {
                    count = customItems.filter(item => item.custom_data?.type === type).length;
                }
                
                const displayName = type === 'Alle' || type === 'Keine' ? type : 
                                   (typeLabels[type] || type);
                
                const subcategoryValue = type === 'Alle' ? 'all' : 
                                       type === 'Keine' ? 'none' : type;
                
                return `
                    <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategoryValue}">
                        <div class="chip-content">
                            <span class="subcategory-name">${displayName}</span>
                            <span class="subcategory-status">${count} Items</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = chipsHTML;
        }
    }    
    
    renderAreaChips(container) {
        // Get all unique areas from items
        const areas = ['Alle Räume', ...new Set(this.allItems.map(item => item.area).filter(Boolean)), 'Keine'];
        
        const chipsHTML = areas.map(area => {
            const isActive = (area === 'Alle Räume' && this.activeSubcategory === 'all') || 
                            (area === this.activeSubcategory);
            const deviceCount = area === 'Alle Räume' ? this.allItems.length : 
                              area === 'Keine' ? 0 :
                              this.allItems.filter(item => item.area === area).length;
            
            const subcategoryValue = area === 'Alle Räume' ? 'all' : 
                                   area === 'Keine' ? 'none' : area;
            
            return `
                <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategoryValue}">
                    <div class="chip-content">
                        <span class="subcategory-name">${area}</span>
                        <span class="subcategory-status">${deviceCount} Geräte</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = chipsHTML;
    }
    
    renderCategoryChips(container) {
        // Dynamisch die verfügbaren Domains aus den aktuellen Items ermitteln
        const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
        const availableDomains = [...new Set(categoryItems.map(item => item.domain))];
        
        // Domain-zu-Subcategory Mapping
        const domainToSubcategory = {
            'light': 'lights',
            'switch': 'lights', 
            'climate': 'climate',
            'fan': 'climate',
            'cover': 'covers',
            'media_player': 'media'
        };
        
        // Deutsche Labels für Subcategories
        const subcategoryLabels = {
            'lights': 'Lichter',
            'climate': 'Klima', 
            'covers': 'Rollos',
            'media': 'Medien'
        };
        
        // Ermittle verfügbare Subcategories basierend auf verfügbaren Domains
        const availableSubcategories = [...new Set(
            availableDomains
                .map(domain => domainToSubcategory[domain])
                .filter(Boolean) // Entferne undefined Werte
        )];
        
        // Sortiere für konsistente Reihenfolge
        const sortOrder = ['lights', 'climate', 'covers', 'media'];
        availableSubcategories.sort((a, b) => {
            const indexA = sortOrder.indexOf(a);
            const indexB = sortOrder.indexOf(b);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        
        // Erstelle Chips: Immer "Alle" + dynamische Subcategories
        const chips = ['all', ...availableSubcategories];
        
        const chipsHTML = chips.map(subcategory => {
            const isActive = subcategory === this.activeSubcategory;
            const label = subcategory === 'all' ? 'Alle' : subcategoryLabels[subcategory];
            
            return `
                <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategory}">
                    <div class="chip-content">
                        <span class="subcategory-name">${label}</span>
                        <span class="subcategory-status"></span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = chipsHTML;
        
        // Update die Counts für die verfügbaren Subcategories
        this.updateSubcategoryCounts();
    }

    createDeviceListItem(item) {
        const listItem = document.createElement('div');
        listItem.className = `device-list-item ${item.isActive ? 'active' : ''}`;
        listItem.dataset.entity = item.id;
        
        const quickActionHTML = this.getQuickActionHTML(item);
        
        // Custom Items behandeln
        const statusText = item.domain === 'custom' ? 
            this.getCustomStatusText(item) : 
            this.getEntityStatus(this._hass.states[item.id]);
        
        listItem.innerHTML = `
            <div class="device-list-icon">${item.icon}</div>
            <div class="device-list-content">
                <div class="device-list-area">${item.area}</div>
                <div class="device-list-name">${item.name}</div>
                <div class="device-list-status">${statusText}</div>
            </div>
            ${quickActionHTML}
        `;
        
        // Event Listeners
        const content = listItem.querySelector('.device-list-content');
        const icon = listItem.querySelector('.device-list-icon');
        
        // Detail-View öffnen bei Klick auf Content oder Icon
        [content, icon].forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeviceClick(item, listItem);
            });
        });
        
        // Quick Action Event Listener
        const quickActionBtn = listItem.querySelector('.device-list-quick-action');
        if (quickActionBtn) {
            quickActionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleQuickAction(item, quickActionBtn);
            });
        }
        
        return listItem;
    }

    getQuickActionHTML(item) {
        const state = this._hass.states[item.id];
        if (!state) return '';
        
        const isActive = this.isEntityActive(state);
        
        switch (item.domain) {
            case 'light':
            case 'climate':
                return `
                    <button class="device-list-quick-action ${isActive ? 'active' : ''}" 
                            title="${isActive ? 'Ausschalten' : 'Einschalten'}"
                            data-action="power-toggle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M7 6a7.75 7.75 0 1 0 10 0" />
                            <path d="M12 4l0 8" />
                        </svg>
                    </button>
                `;
                
            case 'media_player':
                const isPlaying = state.state === 'playing';
                const playPauseIcon = isPlaying ? `
                    <svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor"></path>
                        <path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor"></path>
                    </svg>
                ` : `
                    <svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor"></path>
                    </svg>
                `;
                
                return `
                    <button class="device-list-quick-action ${isPlaying ? 'active' : ''}" 
                            title="${isPlaying ? 'Pause' : 'Play'}"
                            data-action="play-pause">
                        ${playPauseIcon}
                    </button>
                `;
                
            case 'cover':
                const position = state.attributes.current_position ?? 0;
                let coverAction = 'open';
                let coverIcon = '';
                let coverTitle = '';
                
                if (position === 0) {
                    coverAction = 'open';
                    coverTitle = 'Öffnen';
                    coverIcon = `
                        <svg stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 15L12 9L18 15" stroke="currentColor"></path>
                        </svg>
                    `;
                } else if (position === 100) {
                    coverAction = 'close';
                    coverTitle = 'Schließen';
                    coverIcon = `
                        <svg stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor"></path>
                        </svg>
                    `;
                } else {
                    coverAction = 'stop';
                    coverTitle = 'Stopp';
                    coverIcon = `
                        <svg viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 4L12 9L7 4" stroke="currentColor"></path>
                            <path d="M17 20L12 15L7 20" stroke="currentColor"></path>
                        </svg>
                    `;
                }
                
                return `
                    <button class="device-list-quick-action ${position > 0 ? 'active' : ''}" 
                            title="${coverTitle}"
                            data-action="${coverAction}">
                        ${coverIcon}
                    </button>
                `;
                
            default:
                return '';
        }
    }

    handleQuickAction(item, button) {
        const action = button.dataset.action;
        const state = this._hass.states[item.id];
        
        // Visual feedback
        button.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1)' }
        ], { duration: 150, easing: 'ease-out' });
        
        switch (item.domain) {
            case 'light':
                if (action === 'power-toggle') {
                    this.callLightService('toggle', item.id);
                }
                break;
                
            case 'climate':
                if (action === 'power-toggle') {
                    const isOn = !['off', 'unavailable'].includes(state.state);
                    this.callClimateService(isOn ? 'turn_off' : 'turn_on', item.id);
                }
                break;
                
            case 'media_player':
                if (action === 'play-pause') {
                    this.callMusicAssistantService('media_play_pause', item.id);
                }
                break;
                
            case 'cover':
                switch (action) {
                    case 'open':
                        this.callCoverService('open_cover', item.id);
                        break;
                    case 'close':
                        this.callCoverService('close_cover', item.id);
                        break;
                    case 'stop':
                        this.callCoverService('stop_cover', item.id);
                        break;
                }
                break;
        }
    }

    updateQuickActionButton(button, entityId, state) {
        const domain = entityId.split('.')[0];
        const isActive = this.isEntityActive(state);
        
        button.classList.toggle('active', isActive);
        
        // Update specific button states
        switch (domain) {
            case 'light':
            case 'climate':
                button.title = isActive ? 'Ausschalten' : 'Einschalten';
                break;
                
            case 'media_player':
                const isPlaying = state.state === 'playing';
                button.classList.toggle('active', isPlaying);
                button.title = isPlaying ? 'Pause' : 'Play';
                
                // Update icon
                const playIcon = `<svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor"></path></svg>`;
                const pauseIcon = `<svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor"></path></svg>`;
                
                button.innerHTML = isPlaying ? pauseIcon : playIcon;
                break;
                
            case 'cover':
                const position = state.attributes.current_position ?? 0;
                button.classList.toggle('active', position > 0);
                
                // Cover icons and actions change based on position - could be updated here
                break;
        }
    }    

    handleDeviceClick(item, card) {
        this.previousSearchState = {
            searchValue: this.shadowRoot.querySelector('.search-input').value,
            activeCategory: this.activeCategory,
            activeSubcategory: this.activeSubcategory,
            filteredItems: [...this.filteredItems]
        };
        this.currentDetailItem = item;

        // NEU: Check für Custom Items
        if (item.domain === 'custom') {
            this.showCustomDetailView();
        } else {
            this.showDetailView();
        }
    }

    showDetailView() {
        this.isDetailView = true;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        searchPanel.classList.add('hidden');
        detailPanel.classList.add('visible');
        this.renderDetailView();
    }

    showCustomDetailView() {
        this.isDetailView = true;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        
        searchPanel.classList.add('hidden');
        detailPanel.classList.add('visible', 'custom-detail'); // <- Hier custom-detail hinzufügen
        
        this.renderCustomDetailView();
    }    
    
    renderCustomDetailView() {
        const detailPanel = this.shadowRoot.querySelector('.detail-panel');
        if (!this.currentDetailItem) return;
        
        const item = this.currentDetailItem;
        
        const leftPaneHTML = this.getCustomDetailLeftPaneHTML(item);
        const rightPaneHTML = this.getCustomDetailRightPaneHTML(item);
    
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
    
        this.setupCustomDetailTabs(item);
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
    
            // Icon Background Update - BEIDE Fälle abdecken
            const iconBackground = detailPanel.querySelector('.icon-background');
            if (iconBackground) {
                if (item.domain === 'media_player') {
                    // MEDIA PLAYER: Aggressives Album Art Update
                    const newAlbumArt = this.getAlbumArtUrl(item);
                    const fallbackBg = this.getBackgroundImageForItem({...item, state: state.state});
                    
                    if (newAlbumArt) {
                        iconBackground.style.backgroundImage = `url("${newAlbumArt}")`;
                    } else {
                        iconBackground.style.backgroundImage = `url("${fallbackBg}")`;
                    }
                    
                    iconBackground.style.opacity = '1';        
                } else {
                    // ANDERE GERÄTE: Standard Background
                    const newBg = this.getBackgroundImageForItem({...item, state: state.state});
                    const currentBg = iconBackground.style.backgroundImage;
                    if (currentBg !== `url("${newBg}")`) {
                       iconBackground.style.backgroundImage = `url('${newBg}')`;
                       iconBackground.style.opacity = '0';
                       setTimeout(() => { iconBackground.style.opacity = '1'; }, 100);
                    }
                }
            }
        }
        
        // Device-spezifische Updates (bleibt gleich)
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

    toggleFocusMode(container, isEntering) {
        const slider = container.querySelector('.circular-slider-container');
        const positionDisplay = container.querySelector('.media-position-display');
        const controlRow = container.querySelector('.device-control-row');

        const activePresets = container.querySelector('.device-control-presets.visible') || 
                             container.querySelector('.device-control-presets[data-is-open="true"]');        



        
        // Bestimme Bewegung basierend auf Gerätetyp
        let moveDistance = '-270px'; // Standard für Media Player
        if (container.querySelector('.climate')) {
            moveDistance = '-210px'; // Weniger für Climate
        } else if (container.querySelector('.circular-slider-container.brightness')) {
            moveDistance = '-220px'; // Für Light (Farb-Presets)
        } else if (container.querySelector('.circular-slider-container.cover')) {
            moveDistance = '-220px'; // Für Cover (Positions-Presets)
        } else if (container.querySelector('.device-control-presets.tts-presets.visible')) {
            moveDistance = '-200px'; // Spezifisch für TTS (weniger als Music Assistant)
        }
        
        if (isEntering) {
            // ENTERING FOCUS MODE
            const timeline = [];
            
            // 1. Fade out slider und position display
            if (slider) {
                timeline.push(slider.animate([
                    { opacity: 1, transform: 'scale(1) translateY(0)' },
                    { opacity: 0, transform: 'scale(0.8) translateY(-20px)' }
                ], { duration: 300, easing: 'ease-in', fill: 'forwards' }));
            }
            
            if (positionDisplay) {
                timeline.push(positionDisplay.animate([
                    { opacity: 1, transform: 'translateY(0)' },
                    { opacity: 0, transform: 'translateY(-10px)' }
                ], { duration: 250, delay: 50, easing: 'ease-in', fill: 'forwards' }));
            }
            
            // 2. Move control row up (nach 200ms)
            setTimeout(() => {
                if (controlRow) {
                    controlRow.animate([
                        { transform: 'translateY(0)' },
                        { transform: `translateY(${moveDistance})` }
                    ], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
                }
            }, 200);
            


            // 3. Scale up presets container (nach 300ms)
            setTimeout(() => {
                if (activePresets) {
                    // Deaktiviere alle Transitions
                    activePresets.style.transition = 'none';
                    
                    // FORCE sichtbar machen
                    activePresets.classList.add('visible');
                    activePresets.style.display = 'block';
                    activePresets.style.opacity = '1';
                    activePresets.style.visibility = 'visible';
                    
                    // Force reflow
                    activePresets.offsetHeight;
                    
                    // Reaktiviere Transitions nach kurzer Zeit
                    setTimeout(() => {
                        activePresets.style.transition = '';
                    }, 50);
                    
                    const animation = activePresets.animate([
                        { transform: 'translateY(0) scale(1)', opacity: 1 },
                        { transform: `translateY(${moveDistance}) scale(1.05)`, opacity: 1 }
                    ], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
                }
            }, 300);
            
            
        } else {
            // EXITING FOCUS MODE
            
            // 1. Scale down presets und fade out
            if (activePresets) {
                activePresets.animate([
                    { transform: `translateY(${moveDistance}) scale(1.05)`, opacity: 1 },
                    { transform: 'translateY(0) scale(1)', opacity: 0 }
                ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
            }
            
            // 2. Move control row back (nach 100ms)
            setTimeout(() => {
                if (controlRow) {
                    controlRow.animate([
                        { transform: `translateY(${moveDistance})` },
                        { transform: 'translateY(0)' }
                    ], { duration: 400, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });
                }
            }, 100);
            
            // 3. Fade in slider und position (nach 200ms)
            setTimeout(() => {
                if (positionDisplay) {
                    positionDisplay.animate([
                        { opacity: 0, transform: 'translateY(-10px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ], { duration: 400, delay: 100, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });
                }
                
                if (slider) {
                    slider.animate([
                        { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
                        { opacity: 1, transform: 'scale(1) translateY(0)' }
                    ], { duration: 500, delay: 150, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });
                }
            }, 200);
        }
    }

    handleExpandableButton(button, container, presetSelector) {
        const presetsContainer = container.querySelector(presetSelector);
     
        const isCurrentlyOpen = presetsContainer.getAttribute('data-is-open') === 'true';

        
        if (!isCurrentlyOpen) {
            // ÖFFNEN
            container.setAttribute('data-focus-mode', 'true');
            button.classList.add('active');
            presetsContainer.setAttribute('data-is-open', 'true');
            
            this.toggleFocusMode(container, true);
            
        } else {
            // SCHLIESSEN  
            container.removeAttribute('data-focus-mode');
            button.classList.remove('active');
            presetsContainer.classList.remove('visible');
            presetsContainer.setAttribute('data-is-open', 'false');
            
            this.toggleFocusMode(container, false);
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
    
        // Tabs nur für Mobile-View hier (werden über CSS gesteuert)
        const tabsConfig = this._config.detail_tabs || [
            { id: 'controls', title: 'Steuerung', default: true, svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>` },
            { id: 'shortcuts', title: 'Shortcuts', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M9.8525 14.6334L3.65151 10.6873C2.41651 9.90141 2.41651 8.09858 3.65151 7.31268L9.8525 3.36659C11.1628 2.53279 12.8372 2.53279 14.1475 3.36659L20.3485 7.31268C21.5835 8.09859 21.5835 9.90142 20.3485 10.6873L14.1475 14.6334C12.8372 15.4672 11.1628 15.4672 9.8525 14.6334Z" stroke="currentColor"></path><path d="M18.2857 12L20.3485 13.3127C21.5835 14.0986 21.5835 15.9014 20.3485 16.6873L14.1475 20.6334C12.8372 21.4672 11.1628 21.4672 9.8525 20.6334L3.65151 16.6873C2.41651 15.9014 2.41651 14.0986 3.65151 13.3127L5.71429 12" stroke="currentColor"></path></svg>` },
            { id: 'history', title: 'Verlauf', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" stroke-linecap="round"></path><path d="M6 17L20 17" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21L20 21" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 7L15 7" stroke="currentColor" stroke-linecap="round"></path></svg>` }
        ];
    
        const mobileTabsHTML = `
            <div class="detail-tabs-container mobile-tabs">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                     ${tabsConfig.map(tab => `<a href="#" class="detail-tab ${tab.default ? 'active' : ''}" data-tab="${tab.id}" title="${tab.title}">${tab.svg}</a>`).join('')}
                </div>
            </div>
        `;
    
        return `
            <div class="detail-left-header">
                <button class="back-button">${newBackButtonSVG}</button>
                <div class="detail-title-area">
                    <h3 class="detail-name">${item.name}</h3>
                    <p class="detail-area">${item.area}</p>
                </div>
                ${mobileTabsHTML}
            </div>
            <div class="icon-content">
                <div class="icon-background-wrapper">
                    <div class="icon-background" style="${backgroundStyle}">
                    </div>
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

    getCustomDetailLeftPaneHTML(item) {
        const newBackButtonSVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        
        const customType = item.custom_data?.type || 'unknown';
        const backgroundImage = this.getCustomBackgroundImage(item);
        
        return `
            <div class="detail-left-header">
                <button class="back-button">${newBackButtonSVG}</button>
                <div class="detail-title-area">
                    <h3 class="detail-name">${item.name}</h3>
                    <p class="detail-area">${item.custom_data.metadata?.category || 'Custom'}</p>
                </div>
            </div>
            <div class="icon-content">
                <div class="icon-background-wrapper">
                    <div class="icon-background custom-item" style="background-image: url('${backgroundImage}');">
                    </div>
                </div>

             
                <div class="detail-info-row">                    
                    <div class="quick-stats">
                        ${this.getCustomQuickStats(item).map(stat => `<div class="stat-item">${stat}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    
    // 2. Ändere getDetailRightPaneHTML - füge tabsHTML am Anfang hinzu
    getDetailRightPaneHTML(item) {
        const controlsHTML = this.getDeviceControlsHTML(item);
        const tabsConfig = this._config.detail_tabs || [
            { id: 'controls', title: 'Steuerung', default: true, svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>` },
            { id: 'shortcuts', title: 'Shortcuts', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M9.8525 14.6334L3.65151 10.6873C2.41651 9.90141 2.41651 8.09858 3.65151 7.31268L9.8525 3.36659C11.1628 2.53279 12.8372 2.53279 14.1475 3.36659L20.3485 7.31268C21.5835 8.09859 21.5835 9.90142 20.3485 10.6873L14.1475 14.6334C12.8372 15.4672 11.1628 15.4672 9.8525 14.6334Z" stroke="currentColor"></path><path d="M18.2857 12L20.3485 13.3127C21.5835 14.0986 21.5835 15.9014 20.3485 16.6873L14.1475 20.6334C12.8372 21.4672 11.1628 21.4672 9.8525 20.6334L3.65151 16.6873C2.41651 15.9014 2.41651 14.0986 3.65151 13.3127L5.71429 12" stroke="currentColor"></path></svg>` },
            { id: 'history', title: 'Verlauf', svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" stroke-linecap="round"></path><path d="M6 17L20 17" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21L20 21" stroke="currentColor" stroke-linecap="round"></path><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 7L15 7" stroke="currentColor" stroke-linecap="round"></path></svg>` }
        ];
    
        const desktopTabsHTML = `
            <div class="detail-tabs-container desktop-tabs">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                     ${tabsConfig.map(tab => `<a href="#" class="detail-tab ${tab.default ? 'active' : ''}" data-tab="${tab.id}" title="${tab.title}">${tab.svg}</a>`).join('')}
                </div>
            </div>
        `;
    
        return `
            ${desktopTabsHTML}
            <div id="tab-content-container">
                 ${tabsConfig.map(tab => `
                    <div class="detail-tab-content ${tab.default ? 'active' : ''}" data-tab-content="${tab.id}">
                        ${this.getTabContent(tab.id, item, controlsHTML)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    getCustomDetailRightPaneHTML(item) {
        const customData = item.custom_data || {};
        
        // NUR MQTT ist editierbar
        const isEditable = customData.type === 'mqtt';
        
        if (!isEditable) {
            // Read-only: Nur Accordion View (Template Sensor + Static)
            return `
                <div id="tab-content-container" style="padding: 20px;">
                    ${this.renderMarkdownAccordions(item.custom_data.content, item.name)}
                </div>
            `;
        }
        
        // Editable: Tab-System mit Editor (nur MQTT)
        return `
            <div class="detail-tabs-container">
                <div class="detail-tabs">
                    <span class="tab-slider"></span>
                    <a href="#" class="detail-tab active" data-tab="view" title="Ansicht">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </a>
                    <a href="#" class="detail-tab" data-tab="edit" title="Bearbeiten">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </a>
                </div>
            </div>
            <div id="tab-content-container">
                <div class="detail-tab-content active" data-tab-content="view">
                    ${this.renderMarkdownAccordions(item.custom_data.content, item.name)}
                </div>
                <div class="detail-tab-content" data-tab-content="edit">
                    ${this.getMarkdownEditorHTML(item)}
                </div>
            </div>
        `;
    }

    getTabContent(tabId, item, controlsHTML) {
        switch(tabId) {
            case 'controls':
                return controlsHTML;
            case 'shortcuts':
                return this.getShortcutsHTML(item);  // NEU
            case 'history':
                return this.getHistoryHTML(item);
            default:
                return `<div style="padding: 20px; text-align: center; color: var(--text-secondary);">${tabId} coming soon.</div>`;
        }
    }

    getShortcutsHTML(item) {
        // Stats für die Cards berechnen
        const stats = this.getShortcutsStats(item);
        
        return `
            <div class="shortcuts-container">
                <div class="shortcuts-header">
                    <h3>Shortcuts für ${item.name}</h3>
                    <div class="shortcuts-controls">
                        <button class="shortcuts-btn active" data-shortcuts-tab="timer">Timer</button>
                        <button class="shortcuts-btn" data-shortcuts-tab="scenes">Szenen</button>
                        <button class="shortcuts-btn" data-shortcuts-tab="scripts">Skripte</button>
                    </div>
                </div>
                
                <div class="shortcuts-stats">
                    <div class="shortcuts-stat-card">
                        <div class="stat-title">Timer</div>
                        <div class="stat-value">${stats.timers} Aktiv</div>
                    </div>
                    <div class="shortcuts-stat-card">
                        <div class="stat-title">Szenen</div>
                        <div class="stat-value">${stats.scenes} vorhanden</div>
                    </div>
                    <div class="shortcuts-stat-card">
                        <div class="stat-title">Skripte</div>
                        <div class="stat-value">${stats.scripts} vorhanden</div>
                    </div>
                </div>
                
                <div class="shortcuts-content">
                    <div class="shortcuts-tab-content active" data-shortcuts-content="timer">
                        <div class="shortcuts-timeline-list" id="shortcuts-timer-list">
                            ${this.getTimerTimelineHTML(item)}
                        </div>
                        
                        <!-- NEU: Edit Panel -->
                        <div class="shortcuts-edit-panel" id="shortcuts-edit-panel" style="display: none;">
                            <div class="shortcuts-edit-header">
                                <h4 id="edit-panel-title">Timer bearbeiten</h4>
                                <button class="shortcuts-edit-close" id="edit-panel-close">✕</button>
                            </div>
                            <div class="shortcuts-edit-content" id="edit-panel-content">
                                <!-- Dynamic content wird hier eingefügt -->
                            </div>
                            <div class="shortcuts-edit-actions">
                                <button class="shortcuts-btn-secondary" id="edit-panel-cancel">Abbrechen</button>
                                <button class="shortcuts-btn-primary" id="edit-panel-save">Speichern</button>
                            </div>
                        </div>
                        
                        <button class="shortcuts-add-button" data-add-timer>
                            + Neuer Timer
                        </button>
                    </div>
                    <div class="shortcuts-tab-content" data-shortcuts-content="scenes">
                        <p>Szenen Content</p>
                    </div>
                    <div class="shortcuts-tab-content" data-shortcuts-content="scripts">
                        <p>Skripte Content</p>
                    </div>
                </div>
        `;
    }

    setupShortcutsEventListeners(item) {
        // Bestehende Tab-Switching Logic...
        const shortcutsButtons = this.shadowRoot.querySelectorAll('.shortcuts-btn');
        shortcutsButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = button.dataset.shortcutsTab;
                
                // Update active button
                shortcutsButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update content
                const contents = this.shadowRoot.querySelectorAll('.shortcuts-tab-content');
                contents.forEach(content => content.classList.remove('active'));
                this.shadowRoot.querySelector(`[data-shortcuts-content="${targetTab}"]`).classList.add('active');
            });
        });
    
        // Bestehende Timer Event Listeners...
        const timerList = this.shadowRoot.querySelector('#shortcuts-timer-list');
        if (timerList) {
            timerList.addEventListener('click', (e) => {
                const editBtn = e.target.closest('[data-edit-timer]');
                const deleteBtn = e.target.closest('[data-delete-timer]');
                const timerEvent = e.target.closest('.shortcuts-timeline-event');
                
                if (editBtn) {
                    e.stopPropagation();
                    this.handleEditTimer(editBtn.dataset.editTimer, item);
                } else if (deleteBtn) {
                    e.stopPropagation();
                    this.handleDeleteTimer(deleteBtn.dataset.deleteTimer, item);
                } else if (timerEvent) {
                    this.handleTimerClick(timerEvent.dataset.timerId, item);
                }
            });
        }
        
        // Bestehende Add Timer Button...
        const addTimerBtn = this.shadowRoot.querySelector('[data-add-timer]');
        if (addTimerBtn) {
            addTimerBtn.addEventListener('click', () => {
                this.handleAddTimer(item);
            });
        }
    
        // NEU: Edit Panel Event Listeners
        const editPanelClose = this.shadowRoot.getElementById('edit-panel-close');
        const editPanelCancel = this.shadowRoot.getElementById('edit-panel-cancel');
        const editPanelSave = this.shadowRoot.getElementById('edit-panel-save');
    
        if (editPanelClose) {
            editPanelClose.addEventListener('click', () => {
                this.hideEditPanel();
            });
        }
    
        if (editPanelCancel) {
            editPanelCancel.addEventListener('click', () => {
                this.hideEditPanel();
            });
        }
    
        if (editPanelSave) {
            editPanelSave.addEventListener('click', () => {
                this.saveTimer(item);
            });
        }
    }

    setupEditFormListeners(timer, item, mode) {
        // Action Toggle Buttons
        const actionGroup = this.shadowRoot.getElementById('edit-actions');
        if (actionGroup) {
            actionGroup.addEventListener('click', (e) => {
                const toggle = e.target.closest('.shortcuts-edit-toggle');
                if (!toggle) return;
                
                // Update active state
                actionGroup.querySelectorAll('.shortcuts-edit-toggle').forEach(btn => 
                    btn.classList.remove('active')
                );
                toggle.classList.add('active');
            });
        }
    
        // Repeat Toggle Buttons
        const repeatGroup = this.shadowRoot.getElementById('edit-repeat');
        if (repeatGroup) {
            repeatGroup.addEventListener('click', (e) => {
                const toggle = e.target.closest('.shortcuts-edit-toggle');
                if (!toggle) return;
                
                // Update active state
                repeatGroup.querySelectorAll('.shortcuts-edit-toggle').forEach(btn => 
                    btn.classList.remove('active')
                );
                toggle.classList.add('active');
            });
        }
    
        // Duration Toggle (nur für Licht)
        const durationToggles = this.shadowRoot.querySelectorAll('[data-duration]');
        durationToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const durationType = e.target.dataset.duration;
                
                // Update active state
                durationToggles.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show/Hide duration input
                const durationInput = this.shadowRoot.getElementById('edit-duration');
                if (durationType === 'timed' && !durationInput) {
                    // Add duration input
                    const inputHTML = `<input type="number" class="shortcuts-edit-input" id="edit-duration" value="30" placeholder="Minuten" style="margin-top: 8px;">`;
                    e.target.parentElement.insertAdjacentHTML('afterend', inputHTML);
                } else if (durationType === 'permanent' && durationInput) {
                    // Remove duration input
                    durationInput.remove();
                }
            });
        });
    }

    hideEditPanel() {
        const editPanel = this.shadowRoot.getElementById('shortcuts-edit-panel');
        editPanel.style.display = 'none';
        
        // Restore timer visibility
        const timerEvents = this.shadowRoot.querySelectorAll('.shortcuts-timeline-event');
        timerEvents.forEach(event => {
            event.classList.remove('editing');
        });
    }
    
    async saveTimer(item) {
        // Collect form data
        const formData = this.collectTimerFormData();
        
        if (!formData) {
            console.error('Invalid form data');
            return;
        }
        
        console.log('Saving timer:', formData);
        
        try {
            // Erstelle Timer basierend auf Device-Type
            await this.createTimerForDevice(item, formData);
            
            // Success feedback
            this.showTimerFeedback('Timer erstellt!', 'success');
            
            // Hide panel and refresh
            this.hideEditPanel();
            this.refreshTimerList(item);
            
        } catch (error) {
            console.error('Error saving timer:', error);
            this.showTimerFeedback('Fehler beim Speichern!', 'error');
        }
    }

    async createTimerForDevice(item, formData) {
        const scheduledTime = this.calculateScheduledTime(formData.time);
        const timerId = `custom_timer_${Date.now()}`;
        
        const timer = {
            id: timerId,
            type: 'custom',
            scheduledTime: scheduledTime.toISOString(),
            action: formData.action,
            active: true,
            duration: formData.duration,
            repeat: formData.repeat,
            temperature: formData.temperature,
            brightness: formData.brightness,
            source: 'fast_search_card',
            deviceId: item.id,
            created: new Date().toISOString()
        };
        
        try {
            // Nur Input Helper verwenden
            await this.saveTimerToInputHelper(timer);
            
            // In Memory für sofortige UI Updates
            this.addTimerToMemory(timer);
            
            // Timer planen
            this.scheduleTimerExecution(timer, item);
            
            console.log('Timer saved to Input Helper:', timer);
            return timerId;
            
        } catch (error) {
            console.error('Failed to save timer to Input Helper:', error);
            throw new Error('Input Helper nicht gefunden! Bitte erstelle: input_text.fast_search_timers');
        }
    }

    addTimerToMemory(timer) {
        if (!this.customTimers) {
            this.customTimers = {};
        }
        if (!this.customTimers[timer.deviceId]) {
            this.customTimers[timer.deviceId] = [];
        }
        this.customTimers[timer.deviceId].push(timer);
    }
    
    removeTimerFromMemory(timerId, deviceId) {
        if (this.customTimers && this.customTimers[deviceId]) {
            const timerIndex = this.customTimers[deviceId].findIndex(t => t.id === timerId);
            if (timerIndex !== -1) {
                const timer = this.customTimers[deviceId][timerIndex];
                
                // Cancel Timeout
                if (timer.timeoutId) {
                    clearTimeout(timer.timeoutId);
                }
                
                this.customTimers[deviceId].splice(timerIndex, 1);
            }
        }
    }    

    async saveTimerToInputHelper(timer) {
        const inputEntityId = 'input_text.fast_search_timers';
        
        // Prüfe ob Input Helper existiert
        if (!this._hass.states[inputEntityId]) {
            throw new Error(`Input Helper ${inputEntityId} not found`);
        }
        
        try {
            // Lade bestehende Timer
            let existingTimers = [];
            const currentState = this._hass.states[inputEntityId];
            
            if (currentState && currentState.state && currentState.state !== 'unknown') {
                try {
                    existingTimers = JSON.parse(currentState.state);
                    if (!Array.isArray(existingTimers)) {
                        existingTimers = [];
                    }
                } catch (e) {
                    console.warn('Could not parse existing timers, starting fresh');
                    existingTimers = [];
                }
            }
            
            // Füge neuen Timer hinzu
            existingTimers.push(timer);
            
            // Speichere zurück
            await this._hass.callService('input_text', 'set_value', {
                entity_id: inputEntityId,
                value: JSON.stringify(existingTimers)
            });
            
            console.log('Timer saved to Input Helper successfully');
            
        } catch (error) {
            console.error('Error saving to Input Helper:', error);
            throw error;
        }
    }
    
    async loadTimersFromInputHelper() {
        const inputEntityId = 'input_text.fast_search_timers';
        
        if (!this._hass.states[inputEntityId]) {
            console.warn(`Input Helper ${inputEntityId} not found`);
            this.showInputHelperSetupInfo();
            return;
        }
        
        try {
            const currentState = this._hass.states[inputEntityId];
            
            if (!currentState || !currentState.state || currentState.state === 'unknown') {
                console.log('Input Helper is empty');
                return;
            }
            
            const timers = JSON.parse(currentState.state);
            
            if (!Array.isArray(timers)) {
                console.warn('Invalid timer data in Input Helper');
                return;
            }
            
            // Reset Memory
            this.customTimers = {};
            
            // Lade nur noch gültige Timer
            const now = new Date();
            const validTimers = [];
            
            for (const timer of timers) {
                const timerTime = new Date(timer.scheduledTime);
                
                if (timer.active && timerTime > now) {
                    // Timer ist noch gültig
                    this.addTimerToMemory(timer);
                    this.scheduleTimerExecution(timer, { id: timer.deviceId });
                    validTimers.push(timer);
                    
                    console.log('Restored timer:', timer.id, 'for', timer.scheduledTime);
                } else {
                    console.log('Skipped expired timer:', timer.id);
                }
            }
            
            // Aktualisiere Input Helper (entferne abgelaufene Timer)
            if (validTimers.length !== timers.length) {
                await this.updateInputHelperTimers(validTimers);
            }
            
        } catch (error) {
            console.error('Error loading timers from Input Helper:', error);
        }
    }

    showInputHelperSetupInfo() {
        console.warn(`
    🔧 SETUP ERFORDERLICH:
    
    Bitte erstelle einen Input Helper in Home Assistant:
    
    1. Settings > Devices & Services > Helpers
    2. "Create Helper" > "Text"
    3. Name: "Fast Search Timers"
    4. Entity ID: input_text.fast_search_timers
    5. Maximum length: 10000
    
    Ohne diesen Helper funktionieren Timer nicht!
        `);
        
        // Optional: Toast Nachricht zeigen
        this.showTimerFeedback('Input Helper fehlt! Siehe Console für Setup.', 'error');
    }    
    
    async updateInputHelperTimers(timers) {
        const inputEntityId = 'input_text.fast_search_timers';
        
        try {
            await this._hass.callService('input_text', 'set_value', {
                entity_id: inputEntityId,
                value: JSON.stringify(timers)
            });
        } catch (error) {
            console.error('Error updating Input Helper:', error);
        }
    }
    
    async removeTimerFromInputHelper(timerId) {
        const inputEntityId = 'input_text.fast_search_timers';
        
        try {
            const currentState = this._hass.states[inputEntityId];
            
            if (!currentState || !currentState.state) return;
            
            let timers = JSON.parse(currentState.state);
            timers = timers.filter(timer => timer.id !== timerId);
            
            await this.updateInputHelperTimers(timers);
            
        } catch (error) {
            console.error('Error removing timer from Input Helper:', error);
        }
    }    

    scheduleTimerExecution(timer, item) {
        const now = new Date();
        const timerTime = new Date(timer.scheduledTime);
        const delay = timerTime.getTime() - now.getTime();
        
        if (delay <= 0) {
            // Timer sollte sofort ausgeführt werden
            this.executeTimer(timer, item);
            return;
        }
        
        // Setze Timeout
        const timeoutId = setTimeout(() => {
            this.executeTimer(timer, item);
        }, delay);
        
        // Speichere Timeout ID für Cancel-Möglichkeit
        timer.timeoutId = timeoutId;
        
        console.log(`Timer scheduled for ${timer.scheduledTime} (in ${Math.round(delay/1000)}s)`);
    }
    
    async executeTimer(timer, item) {
        console.log('Executing timer:', timer);
        
        try {
            // Führe die geplante Aktion aus
            const serviceCall = this.buildServiceCall(item, timer);
            
            await this._hass.callService(
                serviceCall.service.split('.')[0], 
                serviceCall.service.split('.')[1], 
                serviceCall.data
            );
            
            // Markiere Timer als abgeschlossen
            timer.active = false;
            timer.completed = new Date().toISOString();
            
            this.showTimerFeedback(`Timer ausgeführt: ${item.name} ${timer.action}`, 'success');
            
            // Refresh UI
            if (this.isDetailView && this.currentDetailItem?.id === item.id) {
                this.refreshTimerList(item);
            }
            
        } catch (error) {
            console.error('Timer execution failed:', error);
            this.showTimerFeedback('Timer-Ausführung fehlgeschlagen!', 'error');
        }
    }
    
    calculateScheduledTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, set for tomorrow
        if (scheduledTime < new Date()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        return scheduledTime;
    }
    
    async createTimerHelper(item, formData, scheduledTime) {
        const now = new Date();
        const durationSeconds = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
        
        // Generate unique timer name
        const timerName = `timer_${item.id.replace('.', '_')}_${Date.now()}`;
        
        // Create timer helper
        await this._hass.callService('timer', 'start', {
            entity_id: `timer.${timerName}`,
            duration: durationSeconds
        });
        
        return `timer.${timerName}`;
    }
    
    async createTimerAutomation(item, formData, timerEntityId, scheduledTime) {
        const automationId = `timer_automation_${Date.now()}`;
        
        // Build service call based on device and action
        const serviceCall = this.buildServiceCall(item, formData);
        
        // Create automation that triggers when timer finishes
        const automationConfig = {
            alias: `Timer: ${item.name} ${formData.action}`,
            description: `Auto-generated timer automation`,
            trigger: [
                {
                    platform: 'event',
                    event_type: 'timer.finished',
                    event_data: {
                        entity_id: timerEntityId
                    }
                }
            ],
            action: [serviceCall],
            mode: 'single'
        };
        
        // Create automation
        await this._hass.callService('automation', 'reload');
        
        // Note: Creating dynamic automations requires more complex setup
        // For now, we'll use a simpler approach with delays
        console.log('Would create automation:', automationConfig);
    }
    
    buildServiceCall(item, formData) {
        const domain = item.domain;
        
        switch (domain) {
            case 'light':
                if (formData.action === 'turn_on') {
                    const serviceData = { entity_id: item.id };
                    if (formData.brightness) {
                        serviceData.brightness_pct = formData.brightness;
                    }
                    return {
                        service: 'light.turn_on',
                        data: serviceData
                    };
                } else {
                    return {
                        service: 'light.turn_off',
                        data: { entity_id: item.id }
                    };
                }
                
            case 'climate':
                const serviceData = { entity_id: item.id };
                if (formData.temperature) {
                    serviceData.temperature = formData.temperature;
                }
                
                return {
                    service: `climate.set_hvac_mode`,
                    data: {
                        ...serviceData,
                        hvac_mode: formData.action
                    }
                };
                
            case 'cover':
                return {
                    service: `cover.${formData.action}`,
                    data: { entity_id: item.id }
                };
                
            default:
                return {
                    service: `${domain}.${formData.action}`,
                    data: { entity_id: item.id }
                };
        }
    }

    showTimerFeedback(message, type) {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
            ${type === 'success' ? 'background: #4CAF50;' : 'background: #f44336;'}
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }
    
    collectTimerFormData() {
        const time = this.shadowRoot.getElementById('edit-time')?.value;
        const activeAction = this.shadowRoot.querySelector('#edit-actions .shortcuts-edit-toggle.active')?.dataset.action;
        const activeRepeat = this.shadowRoot.querySelector('#edit-repeat .shortcuts-edit-toggle.active')?.dataset.repeat;
        const temperature = this.shadowRoot.getElementById('edit-temperature')?.value;
        const duration = this.shadowRoot.getElementById('edit-duration')?.value;
        const brightness = this.shadowRoot.getElementById('edit-brightness')?.value; // Falls du Brightness hinzufügst
        
        if (!time || !activeAction || !activeRepeat) {
            alert('Bitte alle Pflichtfelder ausfüllen!');
            return null;
        }
        
        return {
            time: time,
            action: activeAction,
            repeat: activeRepeat,
            temperature: temperature ? parseFloat(temperature) : null,
            duration: duration ? parseInt(duration) : null,
            brightness: brightness ? parseInt(brightness) : null
        };
    }
    
    refreshTimerList(item) {
        const timerList = this.shadowRoot.getElementById('shortcuts-timer-list');
        if (timerList) {
            timerList.innerHTML = this.getTimerTimelineHTML(item);
        }
    }

    

    getTimerTimelineHTML(item) {
        const deviceTimers = this.getDeviceTimers(item.id);
        
        if (deviceTimers.length === 0) {
            return `
                <div class="shortcuts-empty-state">
                    <div class="empty-icon">⏰</div>
                    <div class="empty-title">Keine Timer aktiv</div>
                    <div class="empty-subtitle">Erstelle deinen ersten Timer</div>
                </div>
            `;
        }
        
        return deviceTimers.map(timer => {
            const timeString = this.formatTimerTime(timer);
            const actionIcon = this.getTimerActionIcon(timer.action, item.domain);
            const statusClass = timer.active ? 'active' : 'inactive';
            
            return `
                <div class="shortcuts-timeline-event ${statusClass}" data-timer-id="${timer.id}">
                    <div class="shortcuts-timeline-dot"></div>
                    <div class="shortcuts-timeline-content">
                        <div class="shortcuts-timeline-info">
                            <div class="shortcuts-timeline-action">
                                ${actionIcon} ${this.getTimerActionText(timer.action, timer, item.domain)}
                            </div>
                            <div class="shortcuts-timeline-time">${timeString}</div>
                        </div>
                        <div class="shortcuts-timeline-controls">
                            <button class="shortcuts-timeline-btn" data-edit-timer="${timer.id}" title="Bearbeiten">✏️</button>
                            <button class="shortcuts-timeline-btn" data-delete-timer="${timer.id}" title="Löschen">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }    

    getTimerActionIcon(action, domain) {
        const icons = {
            'turn_on': '💡',
            'turn_off': '🔴',
            'set_brightness': '🔆',
            'heat': '🔥',
            'cool': '❄️',
            'open': '⬆️',
            'close': '⬇️'
        };
        return icons[action] || '⚙️';
    }
    
    getTimerActionText(action, timer, domain) {
        // Für Custom Timer
        if (timer.type === 'custom') {
            switch(domain) {
                case 'light':
                    if (action === 'turn_on') {
                        let text = timer.duration ? `Ein für ${timer.duration}min` : 'Einschalten';
                        if (timer.brightness) text += ` (${timer.brightness}%)`;
                        return text;
                    }
                    if (action === 'turn_off') return 'Ausschalten';
                    break;
                case 'climate':
                    if (action === 'heat') return `Heizen auf ${timer.temperature || 22}°C${timer.duration ? ` für ${timer.duration}min` : ''}`;
                    if (action === 'cool') return `Kühlen auf ${timer.temperature || 22}°C${timer.duration ? ` für ${timer.duration}min` : ''}`;
                    break;
                case 'cover':
                    if (action === 'open') return 'Öffnen';
                    if (action === 'close') return 'Schließen';
                    break;
            }
        }
        
        // Rest bleibt gleich...
        switch(domain) {
            case 'light':
                if (action === 'turn_on') return timer.duration ? `Ein für ${timer.duration}min` : 'Einschalten';
                if (action === 'turn_off') return 'Ausschalten';
                if (action === 'set_brightness') return `Dimmen auf ${timer.brightness || 50}%`;
                break;
            case 'climate':
                if (action === 'heat') return `Heizen auf ${timer.temperature || 22}°C${timer.duration ? ` für ${timer.duration}min` : ''}`;
                if (action === 'cool') return `Kühlen auf ${timer.temperature || 22}°C${timer.duration ? ` für ${timer.duration}min` : ''}`;
                break;
            case 'cover':
                if (action === 'open') return 'Öffnen';
                if (action === 'close') return 'Schließen';
                break;
        }
        return action;
    }
    
    formatTimerTime(timer) {
        const now = new Date();
        const timerTime = new Date(timer.scheduledTime);
        
        // Wenn Timer aktiv und in der Vergangenheit liegt (läuft gerade)
        if (timer.active && timerTime < now && timer.type === 'timer_helper') {
            const remaining = Math.max(0, Math.floor((timerTime.getTime() - now.getTime()) / 1000));
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} verbleibend`;
            } else {
                return `${minutes}:${seconds.toString().padStart(2, '0')} verbleibend`;
            }
        }
        
        // Standard time formatting
        if (timerTime.toDateString() === now.toDateString()) {
            return `Heute ${timerTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (timerTime.toDateString() === tomorrow.toDateString()) {
                return `Morgen ${timerTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
            }
        }
        
        return timerTime.toLocaleString('de-DE', { 
            weekday: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    getShortcutsStats(item) {
        // Placeholder Logic - wird später durch echte Discovery ersetzt
        const deviceTimers = this.getDeviceTimers(item.id);
        const roomScenes = this.getRoomScenes(item.area);
        const deviceScripts = this.getDeviceScripts(item.id, item.area);
        
        return {
            timers: deviceTimers.length,
            scenes: roomScenes.length, 
            scripts: deviceScripts.length
        };
    }
    
    getDeviceTimers(deviceId) {
        if (!this._hass) return [];
        
        const timers = [];
        
        // 1. Home Assistant Timer Helper (bestehend)
        Object.keys(this._hass.states).forEach(entityId => {
            if (entityId.startsWith('timer.')) {
                const timerState = this._hass.states[entityId];
                if (this.isTimerForDevice(timerState, deviceId)) {
                    timers.push(this.parseTimerHelper(timerState, deviceId));
                }
            }
        });
        
        // 2. NEU: Custom Timer aus Component State
        if (this.customTimers && this.customTimers[deviceId]) {
            const now = new Date();
            
            // Filter abgelaufene Timer raus
            this.customTimers[deviceId] = this.customTimers[deviceId].filter(timer => {
                const timerTime = new Date(timer.scheduledTime);
                return timerTime > now || timer.active;
            });
            
            // Füge aktive Custom Timer hinzu
            timers.push(...this.customTimers[deviceId]);
        }
        
        // 3. Automation-basierte Timer (bestehend)
        Object.keys(this._hass.states).forEach(entityId => {
            if (entityId.startsWith('automation.')) {
                const automation = this._hass.states[entityId];
                if (this.isTimeAutomationForDevice(automation, deviceId)) {
                    timers.push(this.parseTimeAutomation(automation, deviceId));
                }
            }
        });
        
        return timers.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    }



    // NEU: Nach den bestehenden getDeviceTimers() Methoden hinzufügen
    isTimerForDevice(timerState, deviceId) {
        // Prüfe friendly_name oder entity_id patterns
        const name = timerState.attributes.friendly_name || timerState.entity_id;
        const deviceName = this._hass.states[deviceId]?.attributes.friendly_name || deviceId;
        
        // Simple name matching - kann verfeinert werden
        return name.toLowerCase().includes(deviceName.toLowerCase().split(' ')[0]) ||
               name.toLowerCase().includes(deviceId.split('.')[1]);
    }

    parseTimerHelper(timerState, deviceId) {
        const now = new Date();
        const remaining = timerState.attributes.remaining;
        let scheduledTime = now;
        
        if (remaining && timerState.state === 'active') {
            // Parse remaining time (format: "0:45:23")
            const [hours, minutes, seconds] = remaining.split(':').map(Number);
            scheduledTime = new Date(now.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000);
        }
        
        return {
            id: timerState.entity_id,
            type: 'timer_helper',
            scheduledTime: scheduledTime.toISOString(),
            action: 'turn_off', // Default - Timer meist für "ausschalten"
            active: timerState.state === 'active',
            duration: null,
            repeat: 'once',
            source: timerState.entity_id
        };
    }

    isTimeAutomationForDevice(automation, deviceId) {
        if (!automation.attributes.action) return false;
        
        // Prüfe ob Device in actions ist
        const actions = JSON.stringify(automation.attributes.action);
        const hasDevice = actions.includes(deviceId);
        
        // Prüfe ob time-trigger vorhanden
        const triggers = automation.attributes.trigger || [];
        const hasTimeTrigger = triggers.some(trigger => 
            trigger.platform === 'time' || 
            trigger.platform === 'time_pattern' ||
            trigger.at
        );
        
        return hasDevice && hasTimeTrigger;
    }

    parseTimeAutomation(automation, deviceId) {
        const triggers = automation.attributes.trigger || [];
        const timeTrigger = triggers.find(trigger => 
            trigger.platform === 'time' || trigger.at
        );
        
        let scheduledTime = new Date();
        if (timeTrigger && timeTrigger.at) {
            // Parse time like "22:30:00"
            const [hours, minutes] = timeTrigger.at.split(':').map(Number);
            scheduledTime.setHours(hours, minutes, 0, 0);
            
            // If time has passed today, set for tomorrow
            if (scheduledTime < new Date()) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }
        }
        
        // Detect action type from automation actions
        const actions = automation.attributes.action || [];
        const deviceAction = actions.find(action => 
            action.entity_id === deviceId || 
            (action.entity_id && action.entity_id.includes && action.entity_id.includes(deviceId))
        );
        
        let actionType = 'turn_on';
        if (deviceAction) {
            if (deviceAction.service) {
                actionType = deviceAction.service.split('.')[1] || 'turn_on';
            }
        }
        
        return {
            id: automation.entity_id,
            type: 'automation',
            scheduledTime: scheduledTime.toISOString(),
            action: actionType,
            active: automation.state === 'on',
            duration: null,
            repeat: 'daily', // Automations are usually recurring
            source: automation.entity_id,
            name: automation.attributes.friendly_name
        };
    }

    isScheduleForDevice(schedule, deviceId) {
        // Check if schedule name or attributes mention the device
        const name = schedule.attributes.friendly_name || schedule.entity_id;
        const deviceName = this._hass.states[deviceId]?.attributes.friendly_name || deviceId;
        
        return name.toLowerCase().includes(deviceName.toLowerCase().split(' ')[0]);
    }

    parseScheduleHelper(schedule, deviceId) {
        // Schedule helpers haben meist next_time attribute
        const nextTime = schedule.attributes.next_time;
        let scheduledTime = new Date();
        
        if (nextTime) {
            scheduledTime = new Date(nextTime);
        }
        
        return {
            id: schedule.entity_id,
            type: 'schedule',
            scheduledTime: scheduledTime.toISOString(),
            action: 'turn_on', // Default
            active: schedule.state === 'on',
            duration: null,
            repeat: 'daily', // Schedules are usually recurring
            source: schedule.entity_id
        };
    }
















    
    
    getRoomScenes(deviceArea) {
        // TODO: Echte Szenen Discovery implementieren  
        return [
            { id: 'scene.arbeitsplatz', name: 'Arbeitsplatz' },
            { id: 'scene.entspannen', name: 'Entspannen' },
            { id: 'scene.konzentration', name: 'Konzentration' }
        ];
    }
    
    getDeviceScripts(deviceId, deviceArea) {
        // TODO: Echte Skripte Discovery implementieren
        return [
            { id: 'script.arbeitsplatz_vorbereiten', name: 'Arbeitsplatz vorbereiten' }
        ];
    }






    

    getHistoryHTML(item) {
        const state = this._hass.states[item.id];
        if (!state) return '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Keine Verlaufsdaten verfügbar</div>';
        
        return `
            <div class="history-container">
                <div class="history-header">
                    <h3>Verlauf für ${item.name}</h3>
                    <div class="history-controls">
                        <button class="history-btn" data-period="1d" data-entity="${item.id}">24h</button>
                        <button class="history-btn active" data-period="7d" data-entity="${item.id}">7 Tage</button>
                        <button class="history-btn" data-period="30d" data-entity="${item.id}">30 Tage</button>
                    </div>
                </div>
                
                <div class="history-stats">
                    <div class="stat-card">
                        <div class="stat-title">Letzte Aktivität</div>
                        <div class="stat-value">${this.formatLastChanged(state.last_changed)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Status</div>
                        <div class="stat-value">${this.getDetailedStateText(item).status}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">Heute aktiv</div>
                        <div class="stat-value" id="today-active-${item.id}">Wird geladen...</div>
                    </div>
                </div>
                
                <div class="history-timeline" id="history-timeline-${item.id}">
                    <div class="loading-indicator">Verlaufsdaten werden geladen...</div>
                </div>
            </div>
        `;
    }    

    formatLastChanged(timestamp) {
        const now = new Date();
        const changed = new Date(timestamp);
        const diffMinutes = Math.floor((now - changed) / 1000 / 60);
        
        if (diffMinutes < 1) return 'Gerade eben';
        if (diffMinutes < 60) return `vor ${diffMinutes} Min`;
        if (diffMinutes < 1440) return `vor ${Math.floor(diffMinutes / 60)} Std`;
        return `vor ${Math.floor(diffMinutes / 1440)} Tagen`;
    }    

    async loadHistoryData(item, period = '7d') {
        if (!this._hass) return null;
        
        const endTime = new Date();
        const startTime = new Date();
        
        switch(period) {
            case '1d': 
                startTime.setDate(endTime.getDate() - 1); 
                break;
            case '7d': 
                startTime.setDate(endTime.getDate() - 7); 
                break;
            case '30d': 
                startTime.setDate(endTime.getDate() - 30); 
                break;
        }

        console.log(`Loading history for ${item.id} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
                    
        try {
            const historyData = await this._hass.callApi('GET', 
                `history/period/${startTime.toISOString()}?filter_entity_id=${item.id}&end_time=${endTime.toISOString()}`
            );

            console.log(`History API returned:`, historyData);
            console.log(`Events found: ${historyData[0]?.length || 0}`);
            
            return this.processHistoryData(historyData[0] || [], item);
        } catch (error) {
            console.error('Fehler beim Laden der Verlaufsdaten:', error);
            return null;
        }
    }    

    processHistoryData(rawData, item) {
        if (!rawData || rawData.length === 0) return null;
        
        const events = rawData.map(entry => ({
            timestamp: new Date(entry.last_changed),
            state: entry.state,
            attributes: entry.attributes,
            friendlyState: this.getFriendlyStateName(entry.state, item.domain)
        }));
        
        // Sortiere nach Datum (neueste zuerst)
        events.sort((a, b) => b.timestamp - a.timestamp);
        
        // DEBUG: Zeige Datumsbereich der Events
        if (events.length > 0) {
            const oldestEvent = events[events.length - 1];
            const newestEvent = events[0];
            console.log(`Event range: ${oldestEvent.timestamp.toLocaleDateString()} - ${newestEvent.timestamp.toLocaleDateString()}`);
            console.log(`Oldest event: ${oldestEvent.timestamp.toISOString()}`);
            console.log(`Newest event: ${newestEvent.timestamp.toISOString()}`);
        }
        
        return {
            events: events.slice(0, 20), // Nur die letzten 20 Events
            stats: this.calculateTodayStats(events, item)
        };
    }

    getFriendlyStateName(state, domain) {
        switch(domain) {
            case 'light':
            case 'switch':
                return state === 'on' ? 'Eingeschaltet' : 'Ausgeschaltet';
            case 'climate':
                const climateStates = {
                    'off': 'Aus',
                    'heat': 'Heizen',
                    'cool': 'Kühlen',
                    'auto': 'Automatik',
                    'dry': 'Entfeuchten',
                    'fan_only': 'Nur Lüfter'
                };
                return climateStates[state] || state;
            case 'cover':
                const coverStates = {
                    'open': 'Offen',
                    'closed': 'Geschlossen',
                    'opening': 'Öffnet sich',
                    'closing': 'Schließt sich'
                };
                return coverStates[state] || state;
            case 'media_player':
                const mediaStates = {
                    'playing': 'Spielt',
                    'paused': 'Pausiert',
                    'idle': 'Bereit',
                    'off': 'Aus'
                };
                return mediaStates[state] || state;
            default:
                return state;
        }
    }
    
    calculateTodayStats(events, item) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayEvents = events.filter(event => event.timestamp >= today);
        
        let activeMinutes = 0;
        let currentState = null;
        
        // Berechne aktive Zeit heute
        for (let i = todayEvents.length - 1; i >= 0; i--) {
            const event = todayEvents[i];
            
            if (i === todayEvents.length - 1) {
                currentState = event.state;
                continue;
            }
            
            const nextEvent = todayEvents[i + 1];
            const duration = (nextEvent.timestamp - event.timestamp) / 1000 / 60; // Minuten
            
            if (this.isActiveState(currentState, item.domain)) {
                activeMinutes += duration;
            }
            
            currentState = event.state;
        }
        
        // Berechne Zeit vom letzten Event bis jetzt
        if (todayEvents.length > 0 && this.isActiveState(currentState, item.domain)) {
            const lastEvent = todayEvents[0];
            const nowMinutes = (new Date() - lastEvent.timestamp) / 1000 / 60;
            activeMinutes += nowMinutes;
        }
        
        return {
            activeMinutes: Math.round(activeMinutes),
            activeHours: (activeMinutes / 60).toFixed(1),
            eventCount: todayEvents.length
        };
    }

    isActiveState(state, domain) {
        switch(domain) {
            case 'light':
            case 'switch':
            case 'fan':
                return state === 'on';
            case 'climate':
                return state !== 'off';
            case 'cover':
                return state === 'open';
            case 'media_player':
                return ['playing', 'paused'].includes(state);
            default:
                return state === 'on';
        }
    }

    setupHistoryEventListeners(item) {
        // History-Buttons Event Listeners
        const historyButtons = this.shadowRoot.querySelectorAll('.history-btn');
        historyButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const period = button.dataset.period;
                const entityId = button.dataset.entity;
                
                // Update active button
                historyButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Load and display history data
                await this.loadAndDisplayHistory(item, period);
            });
        });
        
        // Initial load of 7-day history
        this.loadAndDisplayHistory(item, '7d');
    }    

    async loadAndDisplayHistory(item, period) {
        const timelineContainer = this.shadowRoot.getElementById(`history-timeline-${item.id}`);
        const todayActiveElement = this.shadowRoot.getElementById(`today-active-${item.id}`);
        
        if (!timelineContainer) return;
        
        // Loading state
        timelineContainer.innerHTML = '<div class="loading-indicator">Lade Verlaufsdaten...</div>';
        
        try {
            const historyData = await this.loadHistoryData(item, period);
            
            if (!historyData || !historyData.events || historyData.events.length === 0) {
                timelineContainer.innerHTML = '<div class="loading-indicator">Keine Verlaufsdaten gefunden.</div>';
                if (todayActiveElement) todayActiveElement.textContent = '0 Std';
                return;
            }
            
            // Update today active stats
            if (todayActiveElement) {
                todayActiveElement.textContent = `${historyData.stats.activeHours} Std`;
            }
            
            // Berechne tatsächlichen Datumsbereich
            const events = historyData.events;
            const oldestEvent = events[events.length - 1];
            const newestEvent = events[0];
            const actualDays = Math.ceil((newestEvent.timestamp - oldestEvent.timestamp) / (1000 * 60 * 60 * 24));
            
            // Zeige Warnung wenn weniger Daten als erwartet
            let warningHTML = '';
            const requestedDays = period === '1d' ? 1 : period === '7d' ? 7 : 30;
            if (actualDays < requestedDays) {
                warningHTML = `
                    <div class="history-warning">
                        ⚠️ Nur Daten der letzten ${actualDays} Tage verfügbar (angefordert: ${requestedDays} Tage)
                    </div>
                `;
            }
            
            // Render timeline
            this.renderHistoryTimeline(historyData.events, timelineContainer, item, warningHTML);
            
        } catch (error) {
            console.error('History loading error:', error);
            timelineContainer.innerHTML = '<div class="loading-indicator">Fehler beim Laden der Daten.</div>';
        }
    }

    renderHistoryTimeline(events, container, item, warningHTML = '') {
        const timelineHTML = events.map(event => {
            const timeString = this.formatEventTime(event.timestamp);
            const stateClass = this.isActiveState(event.state, item.domain) ? 'active' : 'inactive';
            
            return `
                <div class="timeline-event ${stateClass}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-time">${timeString}</div>
                        <div class="timeline-state">${event.friendlyState}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = warningHTML + `<div class="timeline-list">${timelineHTML}</div>`;
    }

    formatEventTime(timestamp) {
        const now = new Date();
        const event = new Date(timestamp);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const timeString = event.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (event >= today) {
            return `Heute ${timeString}`;
        } else if (event >= yesterday) {
            return `Gestern ${timeString}`;
        } else {
            const dateString = event.toLocaleDateString('de-DE', { 
                weekday: 'short', 
                day: '2-digit', 
                month: '2-digit' 
            });
            return `${dateString} ${timeString}`;
        }
    }
    
    
    
    getMarkdownEditorHTML(item) {
        const currentContent = item.custom_data.content || '';
        const customData = item.custom_data || {};
        const customType = customData.type;
        
        // Nur für MQTT relevante Info
        let saveInfo = '';
        let dataAttributes = `data-item-id="${item.id}" data-item-type="${customType}"`;
        
        if (customType === 'mqtt') {
            saveInfo = '📡 Speichert via MQTT (persistent auf Server)';
        } else {
            saveInfo = '🚫 Dieser Item-Typ ist nicht editierbar';
        }
        
        return `
            <div class="markdown-editor-container">
                <div class="editor-header">
                    <div class="editor-title">📝 ${item.name} bearbeiten</div>
                    <div class="editor-controls">
                        <button class="editor-btn" data-action="save" title="Speichern">
                            <!-- Save SVG -->
                        </button>
                        <button class="editor-btn" data-action="preview" title="Full-Preview">
                            <!-- Preview SVG -->
                        </button>
                    </div>
                </div>
                
                <div class="editor-content">
                    <textarea 
                        class="markdown-textarea" 
                        ${dataAttributes}
                        placeholder="# Dein Titel
    
    ## Sektion 1
    - Liste Item 1
    - Liste Item 2
    
    ## Sektion 2
    1. Nummerierte Liste
    2. Noch ein Punkt
    
    > Tipp: Nutze **fett** und *kursiv*"
                    >${currentContent}</textarea>
                    
                    <div class="live-preview hidden">
                        <div class="preview-content"></div>
                    </div>
                </div>
                
                <div class="editor-footer">
                    <div class="status-indicator" data-status="ready">
                        <span class="status-text">Bereit zum Bearbeiten</span>
                    </div>
                    <div class="editor-info">
                        <small style="color: var(--text-secondary); font-size: 12px;">${saveInfo}</small>
                    </div>
                    <div class="markdown-help">
                        <!-- Markdown Hilfe -->
                    </div>
                </div>
            </div>
        `;
    }

    setupMarkdownEditor(item) {
        const textarea = this.shadowRoot.querySelector('.markdown-textarea');
        const saveBtn = this.shadowRoot.querySelector('[data-action="save"]');
        const previewBtn = this.shadowRoot.querySelector('[data-action="preview"]');
        const statusIndicator = this.shadowRoot.querySelector('.status-indicator');
        const statusText = this.shadowRoot.querySelector('.status-text');
        const livePreview = this.shadowRoot.querySelector('.live-preview');
        const previewContent = this.shadowRoot.querySelector('.preview-content');
        
        if (!textarea) return; // Kein Editor vorhanden
        
        let saveTimeout;
        let isPreviewMode = false;
        
        // Auto-Save beim Tippen
        textarea.addEventListener('input', () => {
            statusIndicator.dataset.status = 'saving';
            statusText.textContent = 'Wird gespeichert...';
            
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveMarkdownContent(item, textarea.value);
            }, 1000); // 1 Sekunde Delay
        });
        
        // Manueller Save Button
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                clearTimeout(saveTimeout);
                this.saveMarkdownContent(item, textarea.value);
            });
        }
        
        // Live-Preview Toggle
        if (previewBtn && livePreview && previewContent) {
            previewBtn.addEventListener('click', () => {
                isPreviewMode = !isPreviewMode;
                
                if (isPreviewMode) {
                    // Zeige Full-Width Preview (Editor versteckt)
                    livePreview.classList.remove('hidden');
                    livePreview.classList.add('fullwidth');  // ← NEU: Full-width CSS class
                    textarea.classList.add('preview-hidden'); // ← NEU: Textarea verstecken
                    previewBtn.classList.add('active');
                    
                    // Update Preview Content
                    const html = this.parseMarkdown(textarea.value);
                    previewContent.innerHTML = html;
                    
                } else {
                    // Verstecke Preview, zeige Editor
                    livePreview.classList.add('hidden');
                    livePreview.classList.remove('fullwidth');  // ← NEU: Full-width entfernen
                    textarea.classList.remove('preview-hidden'); // ← NEU: Textarea wieder zeigen
                    previewBtn.classList.remove('active');
                }
            });
        }
        
        // Update Preview Function
        this.updatePreview = () => {
            if (isPreviewMode && previewContent) {
                const html = this.parseMarkdown(textarea.value);
                previewContent.innerHTML = html;
            }
        };
    }

    // NEU: showSaveStatus() Method hinzufügen
    showSaveStatus(status, message) {
        const statusIndicator = this.shadowRoot.querySelector('.status-indicator');
        const statusText = this.shadowRoot.querySelector('.status-text');
        
        if (!statusIndicator || !statusText) {
            console.warn('Status indicator elements not found');
            return;
        }
        
        // Update status
        statusIndicator.dataset.status = status;
        statusText.textContent = message;
        
        // Auto-clear nach 3 Sekunden (außer bei "ready")
        if (status !== 'ready') {
            setTimeout(() => {
                statusIndicator.dataset.status = 'ready';
                statusText.textContent = 'Bereit zum Bearbeiten';
            }, 3000);
        }
        
        console.log(`📱 Status: ${status} - ${message}`);
    }    

    saveMarkdownContent(item, content) {
        const customData = item.custom_data || {};
        const customType = customData.type;
        
        console.log(`💾 Saving content for ${item.name} (Type: ${customType})`);
        this.showSaveStatus('saving', 'Wird gespeichert...');
    
        // NUR MQTT unterstützen
        if (customType === 'mqtt') {
            this.saveToMqtt(item, content);
        } else {
            console.error('❌ Editieren nur für MQTT Items erlaubt:', customType);
            this.showSaveStatus('error', 'Nur MQTT Items sind editierbar!');
            return;
        }
    }
    
    // Template Sensor (bestehende Logik)
    saveToInputText(item, content) {
        const storageEntity = item.custom_data?.metadata?.storage_entity;
    
        if (!storageEntity) {
            console.error('❌ Keine storage_entity für dieses Template Sensor Item definiert.');
            this.showSaveStatus('error', 'Speicher-Entität fehlt!');
            // Fallback: Lokales Speichern
            item.custom_data.content = content;
            this.updateViewTab(item);
            return;
        }
    
        // Rufe den input_text.set_value Service auf
        this._hass.callService('text', 'set_value', {
            entity_id: storageEntity,
            value: content
        }).then(() => {
            console.log('✅ Content erfolgreich gespeichert in:', storageEntity);
            this.showSaveStatus('saved', 'Gespeichert!');
    
            // Update den lokalen Zustand
            item.custom_data.content = content;
            this.updateViewTab(item);
    
        }).catch(error => {
            console.error('❌ Fehler beim Speichern des input_text:', error);
            this.showSaveStatus('error', 'Fehler beim Speichern!');
        });
    }
    
    // NEU: Static Data speichern (Browser LocalStorage)
    saveToStatic(item, content) {
        console.log(`💾 Saving static content: ${item.name}`);
        
        try {
            const storageKey = `fast_search_static_${item.id}`;
            const staticData = {
                content: content,
                updated_at: new Date().toISOString(),
                item_id: item.id,
                item_name: item.name
            };
            
            // Browser localStorage verwenden
            localStorage.setItem(storageKey, JSON.stringify(staticData));
            
            this.showSaveStatus('saved', 'Lokal gespeichert!');
            
            // Lokales Update für sofortiges Feedback
            item.custom_data.content = content;
            this.updateViewTab(item);
            
            console.log(`✅ Static content saved to localStorage: ${storageKey}`);
            
        } catch (error) {
            console.error('❌ Fehler beim lokalen Speichern:', error);
            this.showSaveStatus('error', 'Speichern fehlgeschlagen!');
        }
    }
    
    saveToMqtt(item, content) {
        console.log(`💾 Saving to MQTT: ${item.name}`);
        
        // Source Entity und Collection Info holen
        const sourceEntity = item.attributes.source_entity;
        const sourcePrefix = item.attributes.source_prefix;
        
        if (!sourceEntity) {
            console.error('❌ No source entity for MQTT item');
            this.showSaveStatus('error', 'MQTT Konfigurationsfehler!');
            return;
        }
        
        const state = this._hass.states[sourceEntity];
        if (!state || !state.attributes) {
            console.error('❌ Could not load current MQTT collection state');
            this.showSaveStatus('error', 'MQTT Sensor nicht gefunden!');
            return;
        }
        
        // Aktuelle Items aus MQTT Sensor holen
        let items = state.attributes.items || [];
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error('❌ Failed to parse current MQTT items:', e);
                this.showSaveStatus('error', 'MQTT Daten-Fehler!');
                return;
            }
        }
        
        if (!Array.isArray(items)) {
            console.error('❌ MQTT items is not an array');
            this.showSaveStatus('error', 'MQTT Datenformat-Fehler!');
            return;
        }
        
        // Das spezifische Item in der Collection finden und updaten
        const itemId = item.id.replace(`${sourcePrefix}_`, ''); // Remove prefix
        const itemIndex = items.findIndex(i => i.id === itemId);
        
        if (itemIndex >= 0) {
            // Update existing item
            items[itemIndex] = {
                ...items[itemIndex],
                content: content,
                last_modified: new Date().toISOString()
            };
            console.log(`✅ Updated existing item: ${itemId}`);
        } else {
            // Add as new item (fallback)
            console.warn('⚠️ Item not found in collection, adding as new');
            items.push({
                id: itemId,
                name: item.name,
                content: content,
                last_modified: new Date().toISOString()
            });
        }
        
        // MQTT Topic aus Source Entity ableiten
        // z.B. sensor.cooking_bookmarks → homeassistant/fast_search/cooking_bookmarks/data
        const entityName = sourceEntity.replace('sensor.', '');
        const mqttTopic = `homeassistant/fast_search/${entityName}/data`;
        
        const payload = {
            items: items,
            count: items.length,
            last_updated: new Date().toISOString(),
            updated_by: 'fast_search_card'
        };
        
        console.log(`📡 Publishing to MQTT topic: ${mqttTopic}`);
        
        // MQTT Publish mit retain: true
        this._hass.callService('mqtt', 'publish', {
            topic: mqttTopic,
            payload: JSON.stringify(payload),
            retain: true  // 🔑 Persistent über Restarts!
        }).then(() => {
            console.log('✅ MQTT collection updated successfully');
            this.showSaveStatus('saved', 'Via MQTT gespeichert!');
            
            // Lokales Update für sofortiges UI Feedback
            item.custom_data.content = content;
            this.updateViewTab(item);
            
        }).catch(error => {
            console.error('❌ MQTT publish failed:', error);
            this.showSaveStatus('error', 'MQTT Publish-Fehler!');
        });
    }
    
    updateViewTab(item) {
        const viewTabContent = this.shadowRoot.querySelector('[data-tab-content="view"]');
        if (viewTabContent && item.custom_data.content) {
            viewTabContent.innerHTML = this.renderMarkdownAccordions(item.custom_data.content, item.name);
            this.setupAccordionListeners();
        }
    }
    
    setupAccordionListeners() {
        const accordionHeaders = this.shadowRoot.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            // Remove old listeners
            header.replaceWith(header.cloneNode(true));
            
            // Add new listeners
            const newHeader = this.shadowRoot.querySelector(`[data-accordion="${header.dataset.accordion}"]`);
            if (newHeader) {
                newHeader.addEventListener('click', () => {
                    const index = newHeader.dataset.accordion;
                    const content = this.shadowRoot.querySelector(`[data-content="${index}"]`);
                    const arrow = newHeader.querySelector('.accordion-arrow');
                    
                    const isOpen = content.classList.contains('open');
                    
                    if (isOpen) {
                        content.classList.remove('open');
                        newHeader.classList.remove('active');
                        arrow.textContent = '▶';
                    } else {
                        content.classList.add('open');
                        newHeader.classList.add('active');
                        arrow.textContent = '▼';
                    }
                });
            }
        });
    }    
    
    getCustomInfoHTML(item) {
        const customData = item.custom_data || {};
        
        // MARKDOWN CONTENT mit Accordions
        if (customData.content) {  // ← ÄNDERN: markdown_content zu content
            return this.renderMarkdownAccordions(customData.content, item.name);
        }
        
        // Fallback für andere Custom Types
        switch (customData.type) {
            case 'template_sensor':
                return `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px;">
                            ${item.name}
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
                            Template Sensor Item
                        </div>
                        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                                Quelle
                            </div>
                            <div style="font-size: 14px; color: var(--text-primary);">
                                ${item.attributes.source_entity}
                            </div>
                        </div>
                    </div>
                `;
            case 'sensor':
                return `
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px;">
                            ${item.name}
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
                            Sensor Data Item
                        </div>
                    </div>
                `;
            default:
                return `
                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        <div style="font-size: 16px; margin-bottom: 8px;">${item.name}</div>
                        <div style="font-size: 13px;">Custom Item Details</div>
                    </div>
                `;
        }
    }

    

    renderMarkdownAccordions(markdownContent, title) {  
        
        if (!markdownContent || markdownContent === 'unknown' || markdownContent === 'NO_CONTENT_FOUND') {
            return `
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 16px; margin-bottom: 8px;">⚠️ Kein Markdown Content</div>
                    <div style="font-size: 13px;">Content: "${markdownContent}"</div>
                </div>
            `;
        }        
        
        // Parse Markdown zu HTML
        const html = this.parseMarkdown(markdownContent);
        
        // Split nach H2 Überschriften für Accordions
        const sections = this.extractAccordionSections(html);
        
        let accordionHTML = `
            <div>
                <div class="accordion-container">
        `;
        
        sections.forEach((section, index) => {
            const isFirst = index === 0;
            accordionHTML += `
                <div class="accordion-item">
                    <div class="accordion-header ${isFirst ? 'active' : ''}" data-accordion="${index}">
                        <span>${section.title}</span>
                        <span class="accordion-arrow">
                            <svg width="20px" height="20px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </span>
                    </div>
                    <div class="accordion-content ${isFirst ? 'open' : ''}" data-content="${index}">
                        ${section.content}
                    </div>
                </div>
            `;
        });
        
        accordionHTML += `
                </div>
            </div>
        `;
        
        return accordionHTML;
    } // <- DIESE KLAMMER HAT GEFEHLT!
    
    // NEUE METHODE - AUSSERHALB der renderMarkdownAccordions Methode
    extractAccordionSections(html) {
        const sections = [];
        
        // Split HTML nach H2 Tags
        const parts = html.split(/<h2>(.*?)<\/h2>/);
        
        // Erstes Teil (vor erstem H2) überspringen
        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i];
            const content = parts[i + 1] || '';
            
            sections.push({
                title: title.trim(),
                content: content.trim()
            });
        }
        
        return sections;
    }



        
    getCustomActionsHTML(item) {
        const customData = item.custom_data || {};
        
        switch (customData.type) {
            case 'template_sensor':
            case 'sensor':
                return `
                    <div style="padding: 20px;">
                        <div class="device-control-row" style="margin-top: 0;">
                            <button class="device-control-button" data-custom-action="copy" title="Kopieren">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                            <button class="device-control-button" data-custom-action="reload" title="Neu laden">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="23,4 23,10 17,10"/>
                                    <polyline points="1,20 1,14 7,14"/>
                                    <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4-4.64,4.36A9,9,0,0,1,3.51,15"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            default:
                return `
                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        <div style="font-size: 14px;">Keine Aktionen verfügbar</div>
                    </div>
                `;
        }
    }


    getCustomStatus(item) {
        return ''; // Leer statt "Verfügbar"
    }
    
    getCustomQuickStats(item) {
        const stats = [];
        const metadata = item.custom_data?.metadata || {};
        
        // NEU: quick_stats von der spezifischen Data Source lesen
        const sourceEntity = item.attributes?.source_entity;
        let quickStatsConfig = [];
        
        // Finde die Data Source Config für dieses Item
        if (this._config.custom_mode?.data_sources) {
            const dataSource = this._config.custom_mode.data_sources.find(ds => 
                ds.entity === sourceEntity || 
                (ds.type === 'static' && item.attributes?.source_prefix?.startsWith(ds.prefix))
            );
            
            quickStatsConfig = dataSource?.quick_stats || [];
        }
        
        // Fallback: Global quick_stats (bestehende Logik)
        if (quickStatsConfig.length === 0) {
            quickStatsConfig = this._config.custom_mode?.quick_stats || [];
        }
        
        quickStatsConfig.forEach(statConfig => {
            const value = metadata[statConfig.field];
            if (value) {
                const icon = statConfig.icon || '📄';
                const displayValue = statConfig.label ? `${statConfig.label}: ${value}` : value;
                stats.push(`${icon} ${displayValue}`);
            }
        });
        
        return stats;
    }
    
    getCustomBackgroundImage(item) {
            const customData = item.custom_data || {};
            
            // 1. Prüfe ob Item ein eigenes Bild hat
            if (customData.metadata && customData.metadata.image_url) {
                return customData.metadata.image_url;
            }
            
            // 2. Fallback basierend auf Type
            const baseUrl = 'https://raw.githubusercontent.com/fastender/Fast-Search-Card/refs/heads/main/docs/';
            const fallbackImage = baseUrl + 'custom-default.png';
            console.log('⚠️ Using fallback image:', fallbackImage);
            
            switch (customData.type) {
                case 'template_sensor':
                    return baseUrl + 'template-sensor.png';
                case 'sensor':
                    return baseUrl + 'sensor-data.png';
                default:
                    return fallbackImage;
            }
        }
    
    setupCustomDetailTabs(item) {
        const customData = item.custom_data || {};
        
        // NUR MQTT ist editierbar
        const isEditable = customData.type === 'mqtt';
        
        if (!isEditable) {
            // Read-only: Nur Accordion Logic
            this.setupAccordionListeners();
            return;
        }
        
        // Editable: Full Tab System + Editor (nur für MQTT)
        const tabsContainer = this.shadowRoot.querySelector('.detail-tabs');
        if (tabsContainer) {
            const tabs = tabsContainer.querySelectorAll('.detail-tab');
            const slider = tabsContainer.querySelector('.tab-slider');
            const contents = this.shadowRoot.querySelectorAll('.detail-tab-content');
    
            const moveSlider = (targetTab) => {
                slider.style.width = `${targetTab.offsetWidth}px`;
                slider.style.left = `${targetTab.offsetLeft}px`;
            };
            
            const activeTab = tabsContainer.querySelector('.detail-tab.active');
            if (activeTab) {
                moveSlider(activeTab);
            }
    
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = tab.dataset.tab;
                    
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    moveSlider(tab);
                    
                    contents.forEach(c => c.classList.remove('active'));
                    this.shadowRoot.querySelector(`[data-tab-content="${targetId}"]`).classList.add('active');
                });
            });
        }
    
        this.setupAccordionListeners();
        this.setupMarkdownEditor(item);
    }
        


    setupAccordionListeners() {
        const accordionHeaders = this.shadowRoot.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const index = header.dataset.accordion;
                const content = this.shadowRoot.querySelector(`[data-content="${index}"]`);
                
                // Toggle
                const isOpen = content.classList.contains('open');
                
                if (isOpen) {
                    content.classList.remove('open');
                    header.classList.remove('active');
                } else {
                    content.classList.add('open');
                    header.classList.add('active');
                }
            });
        });
    }
        
    handleCustomAction(item, action) {
        const customData = item.custom_data || {};
        
        switch (action) {
            case 'copy':
                // Kopiere den gesamten Markdown-Content
                const contentToCopy = customData.content || item.name;
                navigator.clipboard.writeText(contentToCopy);
                console.log(`Copied to clipboard: ${item.name}`);
                break;
            case 'reload':
                // Template Sensor neu laden
                if (customData.type === 'template_sensor' || customData.type === 'sensor') {
                    console.log(`Reloading data for: ${item.name}`);
                    // Trigger updateItems to refresh the template sensor data
                    this.updateItems();
                }
                break;
        }
    }


    
    
    getDeviceControlsHTML(item) {
        switch (item.domain) {
            case 'light':
                return this.getLightControlsHTML(item);
            case 'cover':
                return this.getCoverControlsHTML(item);
            case 'climate':
                return this.getClimateControlsHTML(item);
            case 'media_player':  // NEU HINZUFÜGEN
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
                <div class="device-control-presets light-presets" data-is-open="false">
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

    getCoverControlsHTML(item) {
        const state = this._hass.states[item.id];
        const position = state.attributes.current_position ?? 0;
        
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container cover" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg">
                        <circle class="progress-bg" cx="80" cy="80" r="68"></circle>
                        <circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: #4A90E2;"></circle>
                    </svg>
                    <div class="slider-inner">
                        <div class="power-icon">⏻</div>
                        <div class="circular-value">${position}%</div>
                        <div class="circular-label">Offen</div>
                    </div>
                    <div class="handle" style="border-color: #4A90E2;"></div>
                </div>

                <div class="device-control-row">
                    <button class="device-control-button" data-action="open" title="Öffnen">
                        <svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 15L12 9L18 15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="stop" title="Stopp">
                       <svg viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M17 4L12 9L7 4" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 20L12 15L7 20" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="close" title="Schließen">
                        <svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="toggle-presets" title="Szenen">
                        <svg viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M5.5 6C5.77614 6 6 5.77614 6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 12.5C5.77614 12.5 6 12.2761 6 12C6 11.7239 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.7239 5 12C5 12.2761 5.22386 12.5 5.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 19C5.77614 19 6 18.7761 6 18.5C6 18.2239 5.77614 18 5.5 18C5.22386 18 5 18.2239 5 18.5C5 18.7761 5.22386 19 5.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 6C12.2761 6 12.5 5.77614 12.5 5.5C12.5 5.22386 12.2761 5 12 5C11.7239 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.7239 6 12 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 19C12.2761 19 12.5 18.7761 12.5 18.5C12.5 18.2239 12.2761 18 12 18C11.7239 18 11.5 18.2239 11.5 18.5C11.5 18.7761 11.7239 19 12 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 6C18.7761 6 19 5.77614 19 5.5C19 5.22386 18.7761 5 18.5 5C18.2239 5 18 5.22386 18 5.5C18 5.77614 18.2239 6 18.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 12.5C18.7761 12.5 19 12.2761 19 12C19 11.7239 18.7761 11.5 18.5 11.5C18.2239 11.5 18 11.7239 18 12C18 12.2761 18.2239 12.5 18.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 19C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 18C18.2239 18 18 18.2239 18 18.5C18 18.7761 18.2239 19 18.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
                <div class="device-control-presets cover-presets" data-is-open="false">
                    <div class="device-control-presets-grid">
                        <div class="device-control-preset" style="background: linear-gradient(45deg, #FF6B35, #F7931E);" data-position="20">20%</div>
                        <div class="device-control-preset" style="background: linear-gradient(45deg, #F7931E, #FFD23F);" data-position="40">40%</div>
                        <div class="device-control-preset" style="background: linear-gradient(45deg, #FFD23F, #06D6A0);" data-position="60">60%</div>
                        <div class="device-control-preset ${position === 80 ? 'active' : ''}" style="background: linear-gradient(45deg, #06D6A0, #118AB2);" data-position="80">80%</div>
                    </div>
                </div>
            </div>
        `;
    }

    getClimateControlsHTML(item) {
        const state = this._hass.states[item.id];
        const currentTemp = state.attributes.temperature || 20;

        // DEBUG
        console.log('MELCloud Attributes:');
        console.log('vane_horizontal:', state.attributes.vane_horizontal);
        console.log('vane_horizontal_positions:', state.attributes.vane_horizontal_positions);
        console.log('vane_vertical:', state.attributes.vane_vertical);
        console.log('vane_vertical_positions:', state.attributes.vane_vertical_positions);
        console.log('All attributes:', state.attributes);

        // Dynamisch aus dem Gerät lesen
        const supportedHvacModes = state.attributes.hvac_modes || [];
        const supportedFanModes = state.attributes.fan_modes || [];
        const supportedSwingModes = state.attributes.swing_modes || [];

        // Fallback-Listen mit den korrekten MELCloud-Werten
        const defaultHorizontalPositions = ['auto', '1_left', '2', '3', '4', '5_right', 'split', 'swing'];
        const defaultVerticalPositions = ['auto', '1_up', '2', '3', '4', '5_down', 'swing'];
    
        // Icon-Definitionen für alle möglichen Modi
        const hvacIcons = {
            heat: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 12L23 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 2V1" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 23V22" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 20L19 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 4L19 5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 20L5 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 4L5 5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 12L2 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            cool: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M3 7L6.5 9M21 17L17.5 15M12 12L6.5 9M12 12L6.5 15M12 12V5M12 12V18.5M12 12L17.5 15M12 12L17.5 9M12 2V5M12 22V18.5M21 7L17.5 9M3 17L6.5 15M6.5 9L3 10M6.5 9L6 5.5M6.5 15L3 14M6.5 15L6 18.5M12 5L9.5 4M12 5L14.5 4M12 18.5L14.5 20M12 18.5L9.5 20M17.5 15L18 18.5M17.5 15L21 14M17.5 9L21 10M17.5 9L18 5.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            dry: `<svg width="48px" height="48px" viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M5 11.9995C3.78555 12.9117 3 14.3641 3 15.9999C3 18.7613 5.23858 20.9999 8 20.9999C10.7614 20.9999 13 18.7613 13 15.9999C13 14.3641 12.2144 12.9117 11 11.9995" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 12V3H11V12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 3L13 3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 6L13 6" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 9H13" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 14C6.89543 14 6 14.8954 6 16C6 17.1046 6.89543 18 8 18C9.10457 18 10 17.1046 10 16C10 14.8954 9.10457 14 8 14ZM8 14V9" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M18.9991 3C18.9991 3 21.9991 5.99336 21.9994 7.88652C21.9997 9.5422 20.6552 10.8865 18.9997 10.8865C17.3442 10.8865 16.012 9.5422 16 7.88652C16.0098 5.99242 18.9991 3 18.9991 3Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            fan_only: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M18.2785 7C19.7816 7 21 8.11929 21 9.5C21 10.8807 19.7816 12 18.2785 12H3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.9375 20C19.0766 20 20.5 19.5 20.5 17.5C20.5 15.5 19.0766 15 17.9375 15H3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10.4118 4C11.8412 4 13 5.11929 13 6.5C13 7.88071 11.8412 9 10.4118 9H3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            auto: `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M7 14L11.7935 5.76839C11.9524 5.45014 12.4476 5.45014 12.6065 5.76839L17.4 14" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8.42105 11.3684H15.8947" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
        };
        // Labels für Fan-Modi
        const fanModeLabels = {
            auto: 'Auto', quiet: 'Leise', low: 'Niedrig', medium: 'Mittel', medium_low: 'Mittel-Niedrig', medium_high: 'Mittel-Hoch', high: 'Hoch', middle: 'Mittel', focus: 'Fokus', diffuse: 'Diffus', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5'
        };
        const hPositions = state.attributes.vane_horizontal_positions || defaultHorizontalPositions;
        const vPositions = state.attributes.vane_vertical_positions || defaultVerticalPositions;
        const showHControls = state.attributes.hasOwnProperty('vane_horizontal');
        const showVControls = state.attributes.hasOwnProperty('vane_vertical');
    
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container climate" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg">
                        <circle class="progress-bg" cx="80" cy="80" r="68"></circle>
                        <circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: #2E8B57;"></circle>
                    </svg>
                    <div class="slider-inner">
                        <div class="power-icon">⏻</div>
                        <div class="circular-value">${currentTemp.toFixed(1)}°C</div>
                        <div class="circular-label">Temperatur</div>
                    </div>
                    <div class="handle" style="border-color: #2E8B57;"></div>
                </div>
                
                <div class="device-control-row">
                    ${supportedHvacModes
                        .filter(mode => hvacIcons[mode])
                        .map(mode => `<button class="device-control-button ${state.state === mode ? 'active' : ''}" data-hvac-mode="${mode}" title="${mode}">${hvacIcons[mode]}</button>`)
                        .join('')}
                    ${(supportedFanModes.length > 0 || supportedSwingModes.length > 0 || showHControls || showVControls) ? `
                        <button class="device-control-button" data-action="toggle-presets" title="Einstellungen">
                            <svg viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M5.5 6C5.77614 6 6 5.77614 6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 12.5C5.77614 12.5 6 12.2761 6 12C6 11.7239 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.7239 5 12C5 12.2761 5.22386 12.5 5.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 19C5.77614 19 6 18.7761 6 18.5C6 18.2239 5.77614 18 5.5 18C5.22386 18 5 18.2239 5 18.5C5 18.7761 5.22386 19 5.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 6C12.2761 6 12.5 5.77614 12.5 5.5C12.5 5.22386 12.2761 5 12 5C11.7239 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.7239 6 12 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 19C12.2761 19 12.5 18.7761 12.5 18.5C12.5 18.2239 12.2761 18 12 18C11.7239 18 11.5 18.2239 11.5 18.5C11.5 18.7761 11.7239 19 12 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 6C18.7761 6 19 5.77614 19 5.5C19 5.22386 18.7761 5 18.5 5C18.2239 5 18 5.22386 18 5.5C18 5.77614 18.2239 6 18.5 6Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 12.5C18.7761 12.5 19 12.2761 19 12C19 11.7239 18.7761 11.5 18.5 11.5C18.2239 11.5 18 11.7239 18 12C18 12.2761 18.2239 12.5 18.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 19C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 18C18.2239 18 18 18.2239 18 18.5C18 18.7761 18.2239 19 18.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="device-control-presets climate" data-is-open="false">
                    ${showHControls ? `
                        <div class="climate-category-header">Horizontale Lamellen</div>
                        <div class="climate-setting-row" data-setting-type="vane_horizontal">
                            ${hPositions.map(value => `
                                <div class="climate-setting-option ${state.attributes.vane_horizontal === value ? 'active' : ''}"
                                     data-climate-setting="vane_horizontal"
                                     data-value="${value}">${this.getVaneLabel(value, 'horizontal')}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${showVControls ? `
                        <div class="climate-category-header">Vertikale Lamellen</div>
                        <div class="climate-setting-row" data-setting-type="vane_vertical">
                            ${vPositions.map(value => `
                                <div class="climate-setting-option ${state.attributes.vane_vertical === value ? 'active' : ''}"
                                     data-climate-setting="vane_vertical"
                                     data-value="${value}">${this.getVaneLabel(value, 'vertical')}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${supportedFanModes.length > 0 ? `
                        <div class="climate-category-header">Lüftergeschwindigkeit</div>
                        <div class="climate-setting-row" data-setting-type="fan_mode">
                            ${supportedFanModes.map(mode => `
                                <div class="climate-setting-option ${state.attributes.fan_mode === mode ? 'active' : ''}"
                                     data-climate-setting="fan_mode"
                                     data-value="${mode}">${fanModeLabels[mode] || mode}</div>
                            `).join('')}
                        </div>
                    ` : ''}
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
    
        // Force DOM reflow
        climateContainer.offsetHeight;
    
        // Update circular slider if exists
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(currentTemp, state.state !== 'off');
        }
    
        // Update active classes for HVAC modes
        climateContainer.querySelectorAll('[data-hvac-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.hvacMode === state.state);
        });
    
        // Längere Verzögerung für Mobile
        const isMobile = window.innerWidth <= 768;
        const delay = isMobile ? 200 : 50;
    
        setTimeout(() => {
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
                    case 'fan_mode':
                        isActive = state.attributes.fan_mode === settingValue;
                        break;
                }
    
                opt.classList.toggle('active', isActive);
            });
        }, delay);
    }

    updateMediaPlayerControlsUI(item) {
        const mediaContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!mediaContainer) return;
    
        const state = this._hass.states[item.id];
        const isPlaying = state.state === 'playing';
        const isPaused = state.state === 'paused';
        const isActive = isPlaying || isPaused;
        const volume = state.attributes.volume_level ? Math.round(state.attributes.volume_level * 100) : 50;
    
        // Update circular slider
        const sliderId = `slider-${item.id}`;
        if (this.circularSliders[sliderId]) {
            this.circularSliders[sliderId].updateFromState(volume, isActive);
        }
    
        // Update play/pause button
        const playPauseBtn = mediaContainer.querySelector('[data-action="play-pause"]');
        if (playPauseBtn) {
            playPauseBtn.classList.remove('active');
            playPauseBtn.title = isPlaying ? 'Pause' : 'Play';
            
            // Update icon
            const iconHTML = isPlaying ? `
                <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor" stroke-width="1"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor" stroke-width="1"></path></svg>
            ` : `
                <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            `;
            playPauseBtn.innerHTML = iconHTML;
        }

        // Update position display
        const currentTimeEl = mediaContainer.querySelector('.current-time');
        const totalTimeEl = mediaContainer.querySelector('.total-time');
        const positionProgress = mediaContainer.querySelector('.position-progress');
        
        if (currentTimeEl && totalTimeEl && positionProgress) {
            const duration = state.attributes.media_duration || 
                             state.attributes.duration || 
                             state.attributes.total_time || 0;
        
            let position = state.attributes.media_position || 
                           state.attributes.position || 
                           state.attributes.current_time || 
                           state.attributes.elapsed_time || 0;
            
            // BERECHNE ECHTE POSITION basierend auf updated_at
            const updatedAt = state.attributes.media_position_updated_at;
            if (isPlaying && updatedAt) {
                const now = new Date();
                const updateTime = new Date(updatedAt);
                const elapsedSinceUpdate = (now - updateTime) / 1000; // Sekunden seit letztem Update
                position = position + elapsedSinceUpdate;
                
                // Stelle sicher, dass Position nicht über Duration geht
                position = Math.min(position, duration);
            }
            
            // Entferne Debug-Code für weniger Spam
            // console.log('Media Debug:', ...);
            
            // Zeit formatieren (Sekunden zu MM:SS)
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            currentTimeEl.textContent = formatTime(position);
            totalTimeEl.textContent = formatTime(duration);
            
            // Progress Bar
            const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
            positionProgress.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
        }

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
                this.handleExpandableButton(
                    presetsToggle,
                    climateContainer,
                    '.device-control-presets.climate'
                );
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

    setupMediaPlayerControls(item) {
        const mediaContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!mediaContainer) return;
    
        const sliderId = `slider-${item.id}`;
        const circularContainer = mediaContainer.querySelector('.circular-slider-container.media');
    
        if (circularContainer) {
            const state = this._hass.states[item.id];
            const volume = state.attributes.volume_level ? Math.round(state.attributes.volume_level * 100) : 50;
            const isActive = ['playing', 'paused'].includes(state.state);
    
            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: 0,
                maxValue: 100,
                defaultValue: volume,
                step: 1,
                label: 'Lautstärke',
                hasPower: true,
                defaultPower: isActive,
                formatValue: (val) => `${Math.round(val)}%`,
                onValueChange: (value) => {
                    // Sofort UI aktualisieren (lokal)
                    const circularValue = mediaContainer.querySelector('.circular-value');
                    if (circularValue) {
                        circularValue.textContent = `${Math.round(value)}%`;
                    }
                    
                    // API Call mit Debouncing
                    clearTimeout(this.mediaUpdateTimeout);
                    this.mediaUpdateTimeout = setTimeout(() => {
                        this.callMediaPlayerService('volume_set', item.id, { volume_level: value / 100 });
                    }, 300);
                },
                onPowerToggle: (isOn) => {
                    this.callMediaPlayerService(isOn ? 'turn_on' : 'turn_off', item.id);
                }
            });
        }       
    
        // Media Control Buttons
        const prevBtn = mediaContainer.querySelector('[data-action="previous"]');
        const playPauseBtn = mediaContainer.querySelector('[data-action="play-pause"]');
        const nextBtn = mediaContainer.querySelector('[data-action="next"]');
        const musicAssistantBtn = mediaContainer.querySelector('[data-action="music-assistant"]');
        const ttsBtn = mediaContainer.querySelector('[data-action="tts"]');

        // DEBUG: Teste ob Buttons gefunden werden
        console.log('Music Assistant Button:', musicAssistantBtn);
        console.log('TTS Button:', ttsBtn);        
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.callMusicAssistantService('media_previous_track', item.id));
        if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.callMusicAssistantService('media_play_pause', item.id));
        if (nextBtn) nextBtn.addEventListener('click', () => this.callMusicAssistantService('media_next_track', item.id));

        // Music Assistant Toggle
        if (musicAssistantBtn) {
            musicAssistantBtn.addEventListener('click', () => {
                const ttsContainer = mediaContainer.querySelector('.device-control-presets.tts-presets');
                const isTtsOpen = ttsContainer && ttsContainer.getAttribute('data-is-open') === 'true';
                
                if (isTtsOpen) {
                    this.handleExpandableButton(ttsBtn, mediaContainer, '.device-control-presets.tts-presets');
                    setTimeout(() => {
                        const presetsContainer = mediaContainer.querySelector('.device-control-presets.music-assistant-presets');
                        const wasOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                        
                        this.handleExpandableButton(musicAssistantBtn, mediaContainer, '.device-control-presets.music-assistant-presets');
                        
                        if (!wasOpen && !this.maListenersAttached.has(presetsContainer)) {
                            this.setupMusicAssistantEventListeners(item, presetsContainer);
                            this.maListenersAttached.add(presetsContainer);
                        }
                    }, 400);
                } else {
                    const presetsContainer = mediaContainer.querySelector('.device-control-presets.music-assistant-presets');
                    const wasOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                    
                    this.handleExpandableButton(musicAssistantBtn, mediaContainer, '.device-control-presets.music-assistant-presets');
                    
                    if (!wasOpen && !this.maListenersAttached.has(presetsContainer)) {
                        this.setupMusicAssistantEventListeners(item, presetsContainer);
                        this.maListenersAttached.add(presetsContainer);
                    }
                }
            });
        }

        // TTS Toggle  
        if (ttsBtn) {
            ttsBtn.addEventListener('click', () => {
                const musicContainer = mediaContainer.querySelector('.device-control-presets.music-assistant-presets');
                const isMusicOpen = musicContainer && musicContainer.getAttribute('data-is-open') === 'true';
                
                if (isMusicOpen) {
                    // Schließe Music Assistant erst
                    this.handleExpandableButton(musicAssistantBtn, mediaContainer, '.device-control-presets.music-assistant-presets');
                    
                    // Warte bis Animation fertig, dann öffne TTS
                    setTimeout(() => {
                        this.handleExpandableButton(
                            ttsBtn,
                            mediaContainer,
                            '.device-control-presets.tts-presets'
                        );
                    }, 400); // Warte auf Schließ-Animation
                } else {
                    // Öffne TTS direkt (kein Music Assistant offen)
                    this.handleExpandableButton(
                        ttsBtn,
                        mediaContainer,
                        '.device-control-presets.tts-presets'
                    );
                }
            });
        }

        // Live Position Updates für Media Player
        if (item.domain === 'media_player') {
            this.mediaPositionUpdateInterval = setInterval(() => {
                if (this.isDetailView && this.currentDetailItem?.id === item.id) {
                    this.updateMediaPlayerControlsUI(this.currentDetailItem);
                }
            }, 1000); // Jede Sekunde für Position Updates
        }                
    }

    callMusicAssistantService(service, entity_id, data = {}) {
        // Prüfe ob es ein Music Assistant Player ist
        if (entity_id.includes('ma_') || entity_id.startsWith('music_assistant')) {
            this._hass.callService('music_assistant', service, { entity_id, ...data });
        } else {
            // Fallback zu Standard Media Player Service
            this._hass.callService('media_player', service, { entity_id, ...data });
        }
    }
    
    callMediaPlayerService(service, entity_id, data = {}) {
        this._hass.callService('media_player', service, { entity_id, ...data });
    }
    
    handleMediaServiceClick(service, item) {
        switch (service) {
            case 'music_assistant':
                // Hier könntest du Music Assistant spezifische Services aufrufen
                console.log('Music Assistant clicked for', item.id);
                break;
            case 'tts':
                // Hier könntest du TTS Services aufrufen
                console.log('TTS clicked for', item.id);
                break;
        }
    }
    
    getMediaPlayerControlsHTML(item) {
        const state = this._hass.states[item.id];
        const isPlaying = state.state === 'playing';
        const isPaused = state.state === 'paused';
        const volume = state.attributes.volume_level ? Math.round(state.attributes.volume_level * 100) : 50;
        
        const pauseIcon = `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" stroke="currentColor" stroke-width="1"></path><path d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" stroke="currentColor" stroke-width="1"></path></svg>`;
        const playIcon = `<svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        
        const offClass = (!isPlaying && !isPaused) ? 'off' : '';
        const buttonTitle = isPlaying ? 'Pause' : 'Play';
        const displayValue = (!isPlaying && !isPaused) ? 'AUS' : volume + '%';
        const playPauseIcon = isPlaying ? pauseIcon : playIcon;
        
        return `
            <div class="device-control-design" id="device-control-${item.id}">
                <div class="circular-slider-container media ${offClass}" data-entity="${item.id}">
                    <div class="slider-track"></div>
                    <svg class="progress-svg"><circle class="progress-bg" cx="80" cy="80" r="68"></circle><circle class="progress-fill" cx="80" cy="80" r="68" style="stroke: #1DB954;"></circle></svg>
                    <div class="slider-inner ${offClass}"><div class="power-icon">⏻</div><div class="circular-value">${displayValue}</div><div class="circular-label">Lautstärke</div></div>
                    <div class="handle" style="border-color: #1DB954;"></div>
                </div>
                
                <div class="media-position-display">
                    <span class="current-time">0:00</span>
                    <div class="position-bar"><div class="position-progress" style="width: 0%;"></div></div>
                    <span class="total-time">0:00</span>
                </div>                       
                



                <div class="device-control-row">
                    <button class="device-control-button" data-action="previous" title="Vorheriger Titel">
                        <svg width="48px" height="48px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M6 7V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.0282 5.2672C17.4217 4.95657 18 5.23682 18 5.73813V18.2619C18 18.7632 17.4217 19.0434 17.0282 18.7328L9.09651 12.4709C8.79223 12.2307 8.79223 11.7693 9.09651 11.5291L17.0282 5.2672Z" stroke="currentColor"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="play-pause" title="${buttonTitle}">
                        ${playPauseIcon}
                    </button>
                    <button class="device-control-button" data-action="next" title="Nächster Titel">
                        <svg width="48px" height="48px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M18 7V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.97179 5.2672C6.57832 4.95657 6 5.23682 6 5.73813V18.2619C6 18.7632 6.57832 19.0434 6.97179 18.7328L14.9035 12.4709C15.2078 12.2307 15.2078 11.7693 14.9035 11.5291L6.97179 5.2672Z" stroke="currentColor"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="music-assistant" title="Music Assistant">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M20 14V3L9 5V16" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 19H18C19.1046 19 20 18.1046 20 17V14H17C15.8954 14 15 14.8954 15 16V17C15 18.1046 15.8954 19 17 19Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 21H7C8.10457 21 9 20.1046 9 19V16H6C4.89543 16 4 16.8954 4 18V19C4 20.1046 4.89543 21 6 21Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button class="device-control-button" data-action="tts" title="Text-to-Speech">
                        <svg width="48px" height="48px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M7 12L17 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 8L13 8" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 20.2895V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7.96125C7.35368 17 6.77906 17.2762 6.39951 17.7506L4.06852 20.6643C3.71421 21.1072 3 20.8567 3 20.2895Z" stroke="currentColor" stroke-width="1"></path></svg>
                    </button>
                </div>
                <div class="device-control-presets music-assistant-presets" data-is-open="false">
                    ${this.getMusicAssistantHTML(item)}
                </div>

                <div class="device-control-presets tts-presets" data-is-open="false">
                    TTS coming soon
                </div>
                </div>
                
        `;
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

    // Circular Slider Class - embedded within the main class
    createCircularSliderClass() {
        if (window.CircularSlider) return; // Already exists
    
        window.CircularSlider = class {
            constructor(container, config) {
                this.container = container;
                this.handle = container.querySelector('.handle');
                this.progressFill = container.querySelector('.progress-fill');
                this.valueDisplay = container.querySelector('.circular-value');
                this.powerIcon = container.querySelector('.power-icon');
                this.sliderInner = container.querySelector('.slider-inner');
    
                this.config = config;
                this.centerX = 80;
                this.centerY = 80;
                this.radius = 68;
                this.currentValue = config.defaultValue;
                this.isOn = config.hasPower ? config.defaultPower : true;
    
                this.isDragging = false;
                this.circumference = 2 * Math.PI * 68;
    
                this.init();
            }
    
            init() {
                this.progressFill.style.strokeDasharray = `0 ${this.circumference}`;
                this.progressFill.style.strokeDashoffset = 0;
    
                // Power Button Event
                if (this.config.onPowerToggle) {
                    this.sliderInner.addEventListener('click', this.togglePower.bind(this));
                }
                this.updatePowerState();
                this.updateSlider();
                this.bindEvents();
            }
    
            togglePower() {
                if (!this.config.hasPower) return;
    
                this.isOn = !this.isOn;
                this.updatePowerState();
                this.updateSlider();
    
                if (this.config.onPowerToggle) {
                    this.config.onPowerToggle(this.isOn);
                }
            }
    
            updatePowerState() {
                if (this.config.hasPower) {
                    this.powerIcon.style.display = 'block';
                    this.sliderInner.style.cursor = 'pointer';
                    if (this.isOn) {
                        this.container.classList.remove('off');
                        this.sliderInner.classList.remove('off');
                        this.powerIcon.style.color = '#fff';
                    } else {
                        this.container.classList.add('off');
                        this.sliderInner.classList.add('off');
                        this.powerIcon.style.color = '#ccc';
                    }
                } else {
                    this.powerIcon.style.display = 'none';
                    this.sliderInner.style.cursor = 'default';
                    this.container.classList.remove('off');
                    this.sliderInner.classList.remove('off');
                }
            }
    
            bindEvents() {
                this.handle.addEventListener('mousedown', this.startDrag.bind(this));
                document.addEventListener('mousemove', this.drag.bind(this));
                document.addEventListener('mouseup', this.endDrag.bind(this));
    
                this.handle.addEventListener('touchstart', this.startDrag.bind(this));
                document.addEventListener('touchmove', this.drag.bind(this));
                document.addEventListener('touchend', this.endDrag.bind(this));
            }
    
            startDrag(e) {
                this.isDragging = true;
                e.preventDefault();
            }
    
            drag(e) {
                if (!this.isDragging || !this.isOn) return;
    
                const rect = this.container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
    
                const clientX = e.clientX || e.touches[0].clientX;
                const clientY = e.clientY || e.touches[0].clientY;
    
                const x = clientX - centerX;
                const y = clientY - centerY;
    
                let angle = Math.atan2(y, x) * 180 / Math.PI;
                angle = (angle + 360) % 360;
    
                let normalizedAngle = (angle + 90) % 360;
                let progress = normalizedAngle / 360;
    
                // Stopp-Zone bei 100%
                const maxProgress = (this.config.maxValue - this.config.minValue);
                const currentProgress = (this.currentValue - this.config.minValue);
                const currentProgressRatio = currentProgress / maxProgress;
    
                if (currentProgressRatio > 0.85 && progress < 0.15) {
                    progress = 1.0;
                } else if (currentProgressRatio < 0.15 && progress > 0.85) {
                    progress = 0.0;
                }
    
                const rawValue = this.config.minValue + progress * (this.config.maxValue - this.config.minValue);
                this.currentValue = Math.round(rawValue / this.config.step) * this.config.step;
                this.currentValue = Math.max(this.config.minValue, Math.min(this.config.maxValue, this.currentValue));
    
                this.updateSlider();
    
                if (this.config.onValueChange) {
                    this.config.onValueChange(this.currentValue, this.isOn);
                }
            }
    
            endDrag() {
                this.isDragging = false;
            }
    
            updateSlider() {
                const progress = (this.currentValue - this.config.minValue) / (this.config.maxValue - this.config.minValue);
                const angle = -90 + (progress * 360);
    
                // Handle Position
                const handleX = this.centerX + this.radius * Math.cos(angle * Math.PI / 180);
                const handleY = this.centerY + this.radius * Math.sin(angle * Math.PI / 180);
    
                this.handle.style.left = `${handleX - 8}px`;
                this.handle.style.top = `${handleY - 8}px`;
    
                // SVG Progress
                if (this.isOn || !this.config.hasPower) {
                    const progressLength = progress * this.circumference;
                    this.progressFill.style.strokeDasharray = `${progressLength} ${this.circumference}`;
                } else {
                    this.progressFill.style.strokeDasharray = `0 ${this.circumference}`;
                }
    
                // Wert anzeigen
                if (this.config.hasPower && !this.isOn) {
                    this.valueDisplay.textContent = 'AUS';
                } else {
                    this.valueDisplay.textContent = this.config.formatValue(this.currentValue);
                }
            }
    
            updateFromState(value, isOn) {
                this.currentValue = value;
                this.isOn = isOn;
                this.updatePowerState();
                this.updateSlider();
            }
        };
    }
    
    setupDetailTabs(item) {
        // Create CircularSlider class if not exists
        this.createCircularSliderClass();
    
        // Beide Tab-Container finden (Desktop und Mobile)
        const desktopTabsContainer = this.shadowRoot.querySelector('.desktop-tabs .detail-tabs');
        const mobileTabsContainer = this.shadowRoot.querySelector('.mobile-tabs .detail-tabs');
        
        // Setup für beide Container
        [desktopTabsContainer, mobileTabsContainer].forEach(tabsContainer => {
            if (!tabsContainer) return;
            
            const tabs = tabsContainer.querySelectorAll('.detail-tab');
            const slider = tabsContainer.querySelector('.tab-slider');
            const contents = this.shadowRoot.querySelectorAll('.detail-tab-content');
    
            const moveSlider = (targetTab) => {
                slider.style.width = `${targetTab.offsetWidth}px`;
                slider.style.left = `${targetTab.offsetLeft}px`;
            };
            
            const activeTab = tabsContainer.querySelector('.detail-tab.active');
            if (activeTab) {
                moveSlider(activeTab);
            }
    
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = tab.dataset.tab;
                    
                    // Sync beide Tab-Container
                    [desktopTabsContainer, mobileTabsContainer].forEach(container => {
                        if (!container) return;
                        container.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
                        const correspondingTab = container.querySelector(`[data-tab="${targetId}"]`);
                        if (correspondingTab) {
                            correspondingTab.classList.add('active');
                            const containerSlider = container.querySelector('.tab-slider');
                            if (containerSlider) {
                                containerSlider.style.width = `${correspondingTab.offsetWidth}px`;
                                containerSlider.style.left = `${correspondingTab.offsetLeft}px`;
                            }
                        }
                    });
                    
                    contents.forEach(c => c.classList.remove('active'));
                    this.shadowRoot.querySelector(`[data-tab-content="${targetId}"]`).classList.add('active');
                });
            });
        });
    
        // Rest der Device-Setup Logik bleibt gleich
        if (item.domain === 'light') {
            this.setupLightControls(item);
        } else if (item.domain === 'cover') {
            this.setupCoverControls(item);
        } else if (item.domain === 'climate') {
            this.setupClimateControls(item);
        } else if (item.domain === 'media_player') {
            this.setupMediaPlayerControls(item);            
        }
    
        // History Event Listeners hinzufügen  ← HIER EINFÜGEN
        this.setupHistoryEventListeners(item);

        // NEU: Shortcuts Tab Event Listeners
        this.setupShortcutsEventListeners(item);        
    }    
        
    
    setupLightControls(item) {
        const lightContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!lightContainer) return;
        // Create circular slider instance
        const sliderId = `slider-${item.id}`;
        const circularContainer = lightContainer.querySelector('.circular-slider-container');
    
        if (circularContainer) {
            const state = this._hass.states[item.id];
            const isOn = state.state === 'on';
            const brightness = isOn ? Math.round((state.attributes.brightness || 0) / 2.55) : 0;
    
            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: 0,
                maxValue: 100,
                defaultValue: brightness,
                step: 1,
                label: 'Helligkeit',
                hasPower: true,
                defaultPower: isOn,
                formatValue: (val) => `${Math.round(val)}%`,
                onValueChange: (value, isOn) => {
                    if (isOn) {
                        // Debounce the API calls
                        clearTimeout(this.lightUpdateTimeout);
                        this.lightUpdateTimeout = setTimeout(() => {
                            if (value === 0) {
                                this.callLightService('turn_off', item.id);
                            } else {
                                this.callLightService('turn_on', item.id, { brightness_pct: value });
                            }
                        }, 150); // 150ms delay instead of immediate
                    }
                },
                onPowerToggle: (isOn) => {
                    this.callLightService('toggle', item.id);
                }
            });
        }
        const tempButtons = lightContainer.querySelectorAll('[data-temp]');
        const colorToggle = lightContainer.querySelector('[data-action="toggle-colors"]');
        const colorPresets = lightContainer.querySelectorAll('.device-control-preset');
        const presetsContainer = lightContainer.querySelector('.device-control-presets');
        
        tempButtons.forEach(btn => btn.addEventListener('click', () => {
            const kelvin = parseInt(btn.dataset.temp, 10);
            this.callLightService('turn_on', item.id, { kelvin: kelvin });
        
            // Update slider color immediately
            const sliderId = `slider-${item.id}`;
            if (this.circularSliders[sliderId]) {
                let rgb = [255, 255, 255]; // default
                if (kelvin <= 2700) rgb = [255, 166, 87];
                else if (kelvin <= 4000) rgb = [255, 219, 186];
                else rgb = [201, 226, 255];
        
                const progressFill = this.circularSliders[sliderId].progressFill;
                progressFill.style.stroke = `rgb(${rgb.join(',')})`;
        
                const handle = this.circularSliders[sliderId].handle;
                handle.style.borderColor = `rgb(${rgb.join(',')})`;
            }
        }));

        if (colorToggle) {
            colorToggle.addEventListener('click', () => {
                this.handleExpandableButton(
                    colorToggle,
                    lightContainer,
                    '.device-control-presets'
                );
            });
        }        
    
        colorPresets.forEach(preset => preset.addEventListener('click', () => {
            const rgb = preset.dataset.rgb.split(',').map(Number);
            this.callLightService('turn_on', item.id, { rgb_color: rgb });
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
        
            // Update slider color immediately
            const sliderId = `slider-${item.id}`;
            if (this.circularSliders[sliderId]) {
                const progressFill = this.circularSliders[sliderId].progressFill;
                progressFill.style.stroke = `rgb(${rgb.join(',')})`;
        
                const handle = this.circularSliders[sliderId].handle;
                handle.style.borderColor = `rgb(${rgb.join(',')})`;
            }
        }));
    }

    setupCoverControls(item) {
        const coverContainer = this.shadowRoot.getElementById(`device-control-${item.id}`);
        if (!coverContainer) return;
        
        const sliderId = `slider-${item.id}`;
        const circularContainer = coverContainer.querySelector('.circular-slider-container.cover');
    
        if (circularContainer) {
            const state = this._hass.states[item.id];
            const position = state.attributes.current_position ?? 0;
    
            this.circularSliders[sliderId] = new CircularSlider(circularContainer, {
                minValue: 0,
                maxValue: 100,
                defaultValue: position,
                step: 1,
                label: 'Offen',
                hasPower: true,
                defaultPower: true, // Always on
                formatValue: (val) => `${Math.round(val)}%`,
                onValueChange: (value) => {
                    clearTimeout(this.coverUpdateTimeout);
                    this.coverUpdateTimeout = setTimeout(() => {
                        this.callCoverService('set_cover_position', item.id, { position: value });
                    }, 150);
                },
                onPowerToggle: () => {} // No action on power toggle
            });
        }

        const openBtn = coverContainer.querySelector('[data-action="open"]');
        const stopBtn = coverContainer.querySelector('[data-action="stop"]');
        const closeBtn = coverContainer.querySelector('[data-action="close"]');
        const presetsToggle = coverContainer.querySelector('[data-action="toggle-presets"]');
        const presetsContainer = coverContainer.querySelector('.device-control-presets');
        const positionPresets = coverContainer.querySelectorAll('.device-control-preset');
        
        if(openBtn) openBtn.addEventListener('click', () => this.callCoverService('open_cover', item.id));
        if(stopBtn) stopBtn.addEventListener('click', () => this.callCoverService('stop_cover', item.id));
        if(closeBtn) closeBtn.addEventListener('click', () => this.callCoverService('close_cover', item.id));

        if (presetsToggle) {
            presetsToggle.addEventListener('click', () => {
                this.handleExpandableButton(
                    presetsToggle,
                    coverContainer,
                    '.device-control-presets'
                );
            });
        }        
        
        positionPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const position = parseInt(preset.dataset.position, 10);
                this.callCoverService('set_cover_position', item.id, { position });
                positionPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            });
        });
    }

    callLightService(service, entity_id, data = {}) {
        this._hass.callService('light', service, { entity_id, ...data });
    }

    callCoverService(service, entity_id, data = {}) {
        this._hass.callService('cover', service, { entity_id, ...data });
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
            case 'light': 
                return { status: state.state === 'on' ? 'Ein' : 'Aus' };
            case 'climate': 
                return { status: state.attributes.hvac_action || state.state };
            case 'cover': 
                return { status: state.state === 'open' ? 'Offen' : 'Geschlossen' };
            case 'media_player': 
                // SMART STATUS: Prüfe ob Song wirklich noch läuft
                const duration = state.attributes.media_duration || 0;
                const position = state.attributes.media_position || 0;
                const updatedAt = state.attributes.media_position_updated_at;
                
                // Berechne echte Position
                let realPosition = position;
                if (state.state === 'playing' && updatedAt) {
                    const now = new Date();
                    const updateTime = new Date(updatedAt);
                    const elapsedSinceUpdate = (now - updateTime) / 1000;
                    realPosition = position + elapsedSinceUpdate;
                }
                
                // Status basierend auf echter Position
                if (state.state === 'playing' && duration > 0 && realPosition >= duration) {
                    return { status: 'Bereit' };
                } else if (state.state === 'playing') {
                    return { status: 'Spielt' };
                } else if (state.state === 'paused') {
                    return { status: 'Pausiert' };
                } else {
                    return { status: 'Aus' };
                }
            default: 
                return { status: state.state };
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
                 if (state.state === 'playing' && state.attributes.media_title) stats.push(`♪ ${state.attributes.media_title}`);
                 if (state.attributes.volume_level) stats.push(`${Math.round(state.attributes.volume_level * 100)}% Lautstärke`);
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
        if (!this._hass || !item.id) return null;
        
        const state = this._hass.states[item.id];
        if (!state) return null;
        
        // Live-State Attribute verwenden statt item.attributes
        return state.attributes.entity_picture || state.attributes.media_image_url || null;
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
        if (!card) return; // ← NEU HINZUFÜGEN
        
        const icon = card.querySelector('.device-icon') || card.querySelector('.device-list-icon'); // ← ANPASSEN für beide Typen
        if (!icon) return; // ← NEU HINZUFÜGEN
        
        card.animate([
            { boxShadow: '0 0 0 rgba(0, 122, 255, 0)' }, 
            { boxShadow: '0 0 20px rgba(0, 122, 255, 0.4)' }, 
            { boxShadow: '0 0 0 rgba(0, 122, 255, 0)' }
        ], { duration: 600, easing: 'ease-out' });
        
        icon.animate([
            { transform: 'scale(1)' }, 
            { transform: 'scale(1.2)' }, 
            { transform: 'scale(1)' }
        ], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }    

    getCardSize() { return 4; }
    static getConfigElement() { return document.createElement('fast-search-card-editor'); }
    static getStubConfig() { return { type: 'custom:fast-search-card', entities: [{ entity: 'light.example_light', title: 'Beispiel Lampe' }] }; }

    // --- NEUE METHODEN FÜR MUSIC ASSISTANT ---    
    getMusicAssistantHTML(item) {
        return `
            <div class="music-assistant-content">
                <div class="ma-search-bar-container">
                    <input type="text" class="ma-search-input" placeholder="Suchen in Music Assistant..." data-ma-search-input>
                    <button class="ma-enqueue-toggle" title="Wiedergabemodus ändern" data-ma-enqueue-toggle>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"></path></svg>
                    </button>
                </div>
                <div class="ma-filter-chips" data-ma-filter-chips>
                    <div class="ma-chip active" data-filter="all">Alle</div>
                    <div class="ma-chip" data-filter="artists">Künstler</div>
                    <div class="ma-chip" data-filter="albums">Alben</div>
                    <div class="ma-chip" data-filter="tracks">Titel</div>
                    <div class="ma-chip" data-filter="playlists">Playlists</div>
                </div>
                <div class="ma-results-container" data-ma-results-container>
                    <div class="ma-empty-state">Suche starten, um Ergebnisse zu sehen.</div>
                </div>
            </div>
        `;
    }
    
    async setupMusicAssistantEventListeners(item, container) {
        const searchInput = container.querySelector('[data-ma-search-input]');
        const resultsContainer = container.querySelector('[data-ma-results-container]');
        const enqueueToggle = container.querySelector('[data-ma-enqueue-toggle]');
        const filterChips = container.querySelector('[data-ma-filter-chips]');
    
        if (!searchInput || !resultsContainer || !enqueueToggle || !filterChips) {
            console.error("Music Assistant UI-Elemente nicht gefunden.");
            return;
        }
    
        if (!this.musicAssistantConfigEntryId) {
             try {
                const configEntries = await this._hass.callApi("GET", "config/config_entries/entry");
                const maEntry = configEntries.find(entry => entry.domain === "music_assistant" && entry.state === "loaded");
                if (maEntry) {
                    this.musicAssistantConfigEntryId = maEntry.entry_id;
                } else {
                    console.warn('Music Assistant Config-Entry nicht gefunden.');
                }
             } catch (e) {
                console.error("Fehler beim Abrufen der Config-Entries:", e);
             }
        }
    
        const enqueueModes = [
            { key: 'play', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"></path></svg>', title: 'Sofort abspielen' },
            { key: 'add', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7h14"></path></svg>', title: 'Zur Warteschlange hinzufügen' },
            { key: 'next', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v16M19 12L7 4v16z"></path></svg>', title: 'Als nächstes abspielen' },
        ];
        let currentModeIndex = 0;
        enqueueToggle.addEventListener('click', () => {
            currentModeIndex = (currentModeIndex + 1) % enqueueModes.length;
            const mode = enqueueModes[currentModeIndex];
            this.musicAssistantEnqueueMode = mode.key;
            enqueueToggle.innerHTML = mode.icon;
            enqueueToggle.title = mode.title;
        });
    
        filterChips.addEventListener('click', e => {
            const chip = e.target.closest('.ma-chip');
            if (!chip) return;
    
            filterChips.querySelector('.active').classList.remove('active');
            chip.classList.add('active');
            
            this.displayMusicAssistantResults(this.lastMusicAssistantResults, resultsContainer, item.id);
        });
    
        searchInput.addEventListener('input', () => {
            clearTimeout(this.musicAssistantSearchTimeout);
            const query = searchInput.value.trim();
    
            if (query.length < 2) {
                resultsContainer.innerHTML = '<div class="ma-empty-state">Mindestens 2 Zeichen eingeben...</div>';
                return;
            }
    
            resultsContainer.innerHTML = '<div class="ma-loading-state">Suche...</div>';
            
            this.musicAssistantSearchTimeout = setTimeout(async () => {
                const results = await this.searchMusicAssistant(query);
                this.lastMusicAssistantResults = results;
                this.displayMusicAssistantResults(results, resultsContainer, item.id);
            }, 300);
        });
    }
    
    async searchMusicAssistant(query) {
        // Leichte Verbesserung: Bessere Prüfung am Anfang
        if (!this._hass || !query || !this.musicAssistantConfigEntryId) {
            console.error("Music Assistant Suche nicht möglich: Hass-Objekt, Suchbegriff oder Config-Entry-ID fehlen.");
            return null;
        }
    
        try {
            const results = await this._hass.callWS({
                type: 'call_service',
                domain: 'music_assistant',
                service: 'search',
                service_data: {
                    name: query,
                    // KORREKTUR: Fehlender Parameter hier hinzugefügt
                    config_entry_id: this.musicAssistantConfigEntryId, 
                    limit: 20
                },
                return_response: true
            });
    
            // Die Antwort-Struktur sollte so korrekt sein
            if (results && results.response) {
                return this.processMusicAssistantResults(results.response);
            }
            return this.processMusicAssistantResults(results); // Fallback
    
        } catch (e) {
            console.error("Music Assistant Suche fehlgeschlagen:", e);
            return null;
        }
    }
    
    processMusicAssistantResults(results) {
        if (!results) return null;
        const processed = { artists: [], albums: [], tracks: [], playlists: [] };
        
        const getArray = (data) => Array.isArray(data) ? data : [];
    
        processed.artists = getArray(results.artists);
        processed.albums = getArray(results.albums);
        processed.tracks = getArray(results.tracks);
        processed.playlists = getArray(results.playlists);
    
        return processed;
    }
    
    displayMusicAssistantResults(results, container, entityId) {
        if (!results) {
            container.innerHTML = '<div class="ma-empty-state">Keine Ergebnisse gefunden.</div>';
            return;
        }
        
        const activeFilter = container.parentElement.querySelector('.ma-filter-chips .active').dataset.filter;
        let html = '';
    
        const renderGrid = (items, type) => {
            if (!items || items.length === 0) return '';
            let gridHtml = `<div class="ma-category-header">${type}</div><div class="ma-grid-container">`;
            const itemsToShow = (activeFilter === 'all') ? items.slice(0, 6) : items;
            itemsToShow.forEach(item => {
                const image = (item.metadata?.images?.[0]?.url || item.image);
                const defaultIcon = type === 'Künstler' ? '👤' : type === 'Alben' ? '💿' : '📋';
                gridHtml += `
                    <div class="ma-grid-item" data-uri="${item.uri}">
                        <div class="ma-grid-image">
                            ${image ? `<img src="${image}" loading="lazy">` : defaultIcon}
                        </div>
                        <div class="ma-grid-name">${item.name}</div>
                        ${item.artists ? `<div class="ma-grid-artist">${item.artists.map(a => a.name).join(', ')}</div>` : ''}
                    </div>`;
            });
            return gridHtml + '</div></div>';
        };
    
        const renderList = (items) => {
            if (!items || items.length === 0) return '';
            let listHtml = `<div class="ma-category-header">Titel</div><div class="ma-list-container">`;
            const itemsToShow = (activeFilter === 'all') ? items.slice(0, 5) : items;
            itemsToShow.forEach(track => {
                const image = track.album?.metadata?.images?.[0]?.url || track.album?.image;
                listHtml += `
                    <div class="ma-list-item" data-uri="${track.uri}">
                        <div class="ma-list-image">
                            ${image ? `<img src="${image}" loading="lazy">` : '🎵'}
                        </div>
                        <div class="ma-list-info">
                            <div class="ma-list-name">${track.name}</div>
                            <div class="ma-list-artist">${track.artists.map(a => a.name).join(', ')}</div>
                        </div>
                    </div>`;
            });
            return listHtml + '</div>';
        };
    
        if (activeFilter === 'all' || activeFilter === 'artists') html += renderGrid(results.artists, 'Künstler');
        if (activeFilter === 'all' || activeFilter === 'albums') html += renderGrid(results.albums, 'Alben');
        if (activeFilter === 'all' || activeFilter === 'playlists') html += renderGrid(results.playlists, 'Playlists');
        if (activeFilter === 'all' || activeFilter === 'tracks') html += renderList(results.tracks);
    
        container.innerHTML = html || '<div class="ma-empty-state">Keine Ergebnisse in dieser Kategorie.</div>';
        
        container.querySelectorAll('[data-uri]').forEach(el => {
            el.addEventListener('click', () => {
                const uri = el.dataset.uri;
                this.playMusicAssistantItem(uri, entityId);
            });
        });
    }
    
    async playMusicAssistantItem(uri, entityId) {
        if (!this._hass || !uri || !entityId) return;
        
        try {
            await this._hass.callService('media_player', 'play_media', {
                entity_id: entityId,
                media_content_id: uri,
                media_content_type: 'music',
                enqueue: this.musicAssistantEnqueueMode
            });
        } catch (e) {
            console.error("Fehler beim Abspielen via Music Assistant:", e);
        }
    }
}

customElements.define('fast-search-card', FastSearchCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'fast-search-card',
    name: 'Fast Search Card',
    description: 'Modern Apple Vision OS inspired search card'
});
console.info(`%c FAST-SEARCH-CARD %c Modern Vision OS Design `, 'color: #007AFF; font-weight: bold; background: black', 'color: white; font-weight: bold; background: #007AFF');
