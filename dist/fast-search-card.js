

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




    // Dynamische SVG Icons
    static LIGHT_OFF_SVG = `<svg width="39px" height="39px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
      <path d="M9 18H15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 21H14" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.00082 15C9.00098 13 8.50098 12.5 7.50082 11.5C6.50067 10.5 6.02422 9.48689 6.00082 8C5.95284 4.95029 8.00067 3 12.0008 3C16.001 3 18.0488 4.95029 18.0008 8C17.9774 9.48689 17.5007 10.5 16.5008 11.5C15.501 12.5 15.001 13 15.0008 15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    static LIGHT_ON_SVG = `<svg width="39px" height="39px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
      <path d="M21 2L20 3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 2L4 3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 16L20 15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 16L4 15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 18H15" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 21H14" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11.9998 3C7.9997 3 5.95186 4.95029 5.99985 8C6.02324 9.48689 6.4997 10.5 7.49985 11.5C8.5 12.5 9 13 8.99985 15H14.9998C15 13.0001 15.5 12.5 16.4997 11.5001L16.4998 11.5C17.4997 10.5 17.9765 9.48689 17.9998 8C18.0478 4.95029 16 3 11.9998 3Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // Cover Icons
    static COVER_CLOSED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="currentColor" color="currentColor">
      <path d="M5 19V5.615q0-.666.475-1.14Q5.949 4 6.615 4h10.77q.666 0 1.14.475q.475.474.475 1.14V19h1.5q.213 0 .356.144T21 19.5t-.144.356T20.5 20h-17q-.213 0-.356-.144Q3 19.712 3 19.5t.144-.356T3.5 19zM6 7.75h8.25V5H6.615q-.269 0-.442.173T6 5.615zm0 3.75h8.25V8.75H6zM6 19h12v-6.5h-2.75v2.248q.292.154.463.414t.172.588q0 .47-.334.802q-.333.333-.804.333t-.802-.333t-.33-.802q0-.329.172-.588q.17-.26.463-.414V12.5H6zm9.25-11.25H18V5.615q0-.269-.173-.442T17.385 5H15.25zm0 3.75H18V8.75h-2.75z"/>
    </svg>`;
    
    static COVER_OPEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="currentColor" color="currentColor">
      <path d="M5 19V5.615q0-.666.475-1.14Q5.949 4 6.615 4h10.77q.666 0 1.14.475q.475.474.475 1.14V19h1.5q.213 0 .356.144T21 19.5t-.144.356T20.5 20h-4.615q0 .475-.334.805t-.804.33t-.802-.333t-.33-.802H3.5q-.213 0-.356-.144Q3 19.712 3 19.5t.144-.356T3.5 19zM6 7.75h8.25V5H6.615q-.269 0-.442.173T6 5.615zm9.25 0H18V5.615q0-.269-.173-.442T17.385 5H15.25zM6 11.5h8.25V8.75H6zm9.25 0H18V8.75h-2.75zM6 15.25h8.25V12.5H6zm9.25 0H18V12.5h-2.75zM6 19h8.25v-2.75H6zm9.25 0H18v-2.75h-2.75z"/>
    </svg>`;
    
    // Media Player Icons
    static MEDIA_PAUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
      <path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    </svg>`;
    
    static MEDIA_PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M7 4v16l13 -8z" />
    </svg>`;
    
    static MEDIA_STOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M5 5m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />
    </svg>`;
    
    // Climate Icons
    static CLIMATE_OFF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M3 8m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
      <path d="M7 16v-3a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v3" />
    </svg>`;
    
    static CLIMATE_ON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M8 16a3 3 0 0 1 -3 3" />
      <path d="M16 16a3 3 0 0 0 3 3" />
      <path d="M12 16v4" />
      <path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
      <path d="M7 13v-3a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v3" />
    </svg>`;

    // Script, Automation, Scene Icons
    static SCRIPT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143"/>
      <path d="M6 17L20 17"/><path d="M6 21L20 21"/>
      <path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17"/>
      <path d="M9 7L15 7"/>
    </svg>`;

    static AUTOMATION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39px" height="39px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" color="currentColor">
      <path d="M4.40434 13.6099C3.51517 13.1448 3 12.5924 3 12C3 10.3431 7.02944 9 12 9C16.9706 9 21 10.3431 21 12C21 12.7144 20.2508 13.3705 19 13.8858"/>
      <path d="M12 11.01L12.01 10.9989"/>
      <path d="M16.8827 6C16.878 4.97702 16.6199 4.25309 16.0856 3.98084C14.6093 3.22864 11.5832 6.20912 9.32664 10.6379C7.07005 15.0667 6.43747 19.2668 7.91374 20.019C8.44117 20.2877 9.16642 20.08 9.98372 19.5"/>
      <path d="M9.60092 4.25164C8.94056 3.86579 8.35719 3.75489 7.91369 3.98086C6.43742 4.73306 7.06999 8.93309 9.32658 13.3619C11.5832 17.7907 14.6092 20.7712 16.0855 20.019C17.3977 19.3504 17.0438 15.9577 15.3641 12.1016"/>
    </svg>`;    
    
    static SCENE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="39" height="39" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.5096 9.54C20.4243 9.77932 20.2918 9.99909 20.12 10.1863C19.9483 10.3735 19.7407 10.5244 19.5096 10.63C18.2796 11.1806 17.2346 12.0745 16.5002 13.2045C15.7659 14.3345 15.3733 15.6524 15.3696 17C15.3711 17.4701 15.418 17.9389 15.5096 18.4C15.5707 18.6818 15.5747 18.973 15.5215 19.2564C15.4682 19.5397 15.3588 19.8096 15.1996 20.05C15.0649 20.2604 14.8877 20.4403 14.6793 20.5781C14.4709 20.7158 14.2359 20.8085 13.9896 20.85C13.4554 20.9504 12.9131 21.0006 12.3696 21C11.1638 21.0006 9.97011 20.7588 8.85952 20.2891C7.74893 19.8194 6.74405 19.1314 5.90455 18.2657C5.06506 17.4001 4.40807 16.3747 3.97261 15.2502C3.53714 14.1257 3.33208 12.9252 3.36959 11.72C3.4472 9.47279 4.3586 7.33495 5.92622 5.72296C7.49385 4.11097 9.60542 3.14028 11.8496 3H12.3596C14.0353 3.00042 15.6777 3.46869 17.1017 4.35207C18.5257 5.23544 19.6748 6.49885 20.4196 8C20.6488 8.47498 20.6812 9.02129 20.5096 9.52V9.54Z"/>
      <path d="M8 16.01L8.01 15.9989"/><path d="M6 12.01L6.01 11.9989"/>
      <path d="M8 8.01L8.01 7.99889"/><path d="M12 6.01L12.01 5.99889"/>
      <path d="M16 8.01L16.01 7.99889"/>
    </svg>`;
    
    
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

        // NEU: Favoriten-Cache hinzufügen
        this.favoritesCache = new Map();
        this.favoritesLoaded = false;
        this.favoriteLabel = null;        
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

            // Fügen Sie DANACH diese Zeile hinzu:
            action_favorites: config.action_favorites || {},            
                                
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
        
        // NEU: Favoriten beim ersten Start laden
        if (!oldHass && hass) {
            this.loadAllFavorites().then(() => {
                this.updateItems();
            });
        } else {
            const shouldUpdateAll = !oldHass || this.shouldUpdateItems(oldHass, hass);
            if (shouldUpdateAll) {
                this.updateItems();
            }
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
                width: 44px;
                height: 44px;
                border: none;
                background: rgba(0, 0, 0, 0.15);
                border-radius: 50%;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0;
                flex-shrink: 0;
                transition: all 0.2s ease;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                user-select: none;             
                z-index: 10;
                position: relative;
            }

            .clear-button.visible {
                display: flex !important;
                opacity: 1 !important;
                transform: scale(1) !important;
            }            

            .clear-button:hover {
                background: rgba(0, 0, 0, 0.25);
                transform: scale(1.1);
            }

            .clear-button svg {
                width: 24px;
                height: 24px;
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
                background: rgba(255, 255, 255, 0.08);
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
                background: rgba(255, 255, 255, 0.15);
            }
            
            .filter-button.active {
                background: var(--accent-light);
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
                padding: 10px 15px 10px 15px;
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
            }

            .subcategory-chip:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .chip-content {
                display: flex;
                flex-direction: column;
                line-height: 1.1;
                gap: 2px;
                color: var(--text-primary);
            }

            .subcategory-name {
                font-size: 16px;
                font-weight: 600;
            }

            .subcategory-status {
                font-size: 16px;
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
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 14px;
                min-height: 200px;
                padding-left: 20px; 
                padding-right: 20px; 
            }

            @media (max-width: 500px) {
                .results-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 10px;
                }
            }            

            .area-header {
                grid-column: 1 / -1;
                font-size: 16px;
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
                border-radius: 30px;
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
            }

            .device-icon {
                width: 62px;
                height: 62px;
                background: rgba(0, 0, 0, 0.15);
                border-radius: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                margin-bottom: auto;
                transition: all 0.2s ease;
                color: var(--text-primary);
            }

            .device-card.active .device-icon {
                background: rgba(0, 122, 255, 0.3);
                color: var(--text-primary);
            }

            .device-name {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0 0 0 0;
                overflow: hidden;
                white-space: nowrap;
                line-height: 1.1;
                background: linear-gradient(to right, var(--text-primary) 80%, transparent 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }    

            .device-status {
                font-size: 18px;
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
                justify-content: center;     /* ← Hinzufügen */
                gap: 16px;
                margin-bottom: 20px;
                position: relative;          /* ← Hinzufügen */
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
                position: absolute;
                left: 0;
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
                min-width: 0;
                text-align: left;
                margin-top: 0;
                flex: none;
                text-align: center;  
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

            /* Mobile: Category-Buttons zentrieren */
            @media (max-width: 768px) {
                .category-buttons {
                    justify-content: center;
                    width: 100%;
                    gap: 2px;
                }
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
            
            @media (max-width: 768px) {
                .desktop-tabs {
                    display: none;
                }
                
                .mobile-tabs {
                    display: flex;              /* ← flex statt block */
                    justify-content: flex-end;  /* ← rechts positionieren */
                    padding-right: 20px;        /* ← gleich wie Desktop */
                    padding-top: 20px;
                    padding-bottom: 10px;
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

                /* Mobile: History Tab spezifisches Padding */
                @media (max-width: 768px) {
                    #tab-content-container.history-active {
                        padding: 0px 10px;
                    }
                    #tab-content-container.shortcuts-active {
                        padding: 0px 10px;
                    }                 
                }                
                
                .icon-content { 
                    justify-content: flex-start; 
                }
                
                .icon-background-wrapper { 
                    width: 150px; 
                    height: 150px; 
                }
                
                .detail-title-area { 
                    margin-top: 4px; 
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
                flex-basis: 70px;
                flex-grow: 0;
                flex-shrink: 0;
                width: 70px;
                height: 70px; 
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
            }
            
            .device-list-icon {
                width: 68px;
                height: 68px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 20px;
                transition: all 0.2s ease;
                color: var(--text-primary);
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
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.05em;
            }
            
            .device-list-status {
                font-size: 18px;
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
                font-size: 18px;
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
                font-size: 14px;
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
                font-size: 14px;
                color: var(--text-secondary);
                font-weight: 500;
            }
            
            .timeline-state {
                font-size: 14px;
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
                    align-items: center;
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
                padding: 0px 0px 0px 20px;
                height: 100%;
                display: flex;
                flex-direction: column;
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
                padding: 10px 15px 10px 12px;
                background: rgba(255,255,255,0.08);
                border: 0px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 16px;
                font-weight: 600;
            }
            
            .shortcuts-btn.active, .shortcuts-btn:hover {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }            
            
            .shortcuts-tab {
                flex: 1;
                padding: 8px 16px;
                border: none;
                background: transparent;
                color: var(--text-secondary);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 500;
            }
            
            .shortcuts-tab.active {
                background: rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
            }
            
            .shortcuts-content {
                flex: 1;
                overflow: hidden auto;  /* horizontal: hidden, vertical: auto */
                max-width: 100%;                
            }
            
            .shortcuts-tab-content {
                display: none;
            }
            
            .shortcuts-tab-content.active {
                display: block;
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
                transition: all 0.2s ease;
            }
            
            .shortcuts-stat-card:hover {
                background: rgba(255,255,255,0.12);
            }
            
            .stat-title {
                font-size: 11px;
                color: var(--text-secondary);
                margin-bottom: 4px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .stat-value {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                line-height: 1.2;
            }
            
            /* Mobile Anpassung */
            @media (max-width: 768px) {

                .shortcuts-container {
                    height: calc(100vh - 400px);
                    max-height: 400px;
                    padding: 20px;
                }            
                
                .shortcuts-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: center;
                }
            
                .shortcuts-stats {
                    gap: 8px;
                }
                
                .shortcuts-stat-card {
                    padding: 10px;
                }
                
                .stat-value {
                    font-size: 13px;
                }
            }            


            /* Timer Tab Styles */
            .timer-actions {
                margin-top: 20px;
                padding: 16px;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
            }
            
            .quick-timer-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 12px;
            }
            
            .timer-mode-selector {
                display: flex;
                gap: 4px;
                margin-bottom: 20px;
                background: rgba(0, 0, 0, 0.25);
                border-radius: 12px;
                padding: 4px;
            }
            
            .timer-mode-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                background: transparent;
                color: var(--text-secondary);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
                font-weight: 500;
            }
            
            .timer-mode-btn.active {
                background: rgba(255, 255, 255, 0.2);
                color: var(--text-primary);
            }
            
            .quick-timer-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 8px;
            }
            
            .quick-timer-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 12px 8px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 500;
                text-align: center;
            }
            
            .quick-timer-btn:hover {
                background: rgba(255,255,255,0.15);
                transform: translateY(-1px);
            }
            
            .timer-icon {
                font-size: 16px;
            }
            
            .timer-text {
                font-weight: 600;
            }
            
            .timer-mode-hint {
                font-size: 10px;
                color: var(--text-secondary);
                opacity: 0.8;
            }

            .active-timers {
                padding: 0px;
                margin-bottom: 16px;
                min-height: 60px;
                max-height: 200px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
                -ms-overflow-style: none;
            }
            
            .active-timers::-webkit-scrollbar {
                width: 4px;
            }
            
            .active-timers::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .active-timers::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
            }
            
            .active-timers::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }       

            .active-timers-grid {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }            
            
            .loading-timers {
                text-align: center;
                color: var(--text-secondary);
                font-style: italic;
                padding: 20px;
            }      

            /* Active Timers Styles */
            .active-timers-header {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 8px;
                padding: 0 4px;
            }
            
            .active-timers-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .active-timer-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                transition: all 0.2s ease;
            }
            
            .active-timer-item:hover {
                background: rgba(255, 255, 255, 0.12);
            }
            
            .timer-info {
                flex: 1;
                min-width: 0;
            }
            
            .timer-name {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.15;
            }
            
            .timer-details {
                display: flex;
                gap: 6px;
                align-items: center;
                line-height: 1.15;
            }
            
            .timer-action {
                font-size: 18px;
                color: var(--text-secondary);
                font-weight: 500;
            }
            
            .timer-time {
                font-size: 18px;
                color: var(--text-secondary);
                font-weight: 600;
            }
            
            .timer-controls {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .timer-edit, .timer-delete {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                color: var(--text-secondary);
                margin-left: 8px;
            }

            .timer-edit:hover {
                background: rgba(0, 122, 255, 0.8);
                color: white;
                transform: scale(1.1);
            }
            
            .timer-delete:hover {
                background: rgba(255, 59, 48, 0.8);
                color: white;
                transform: scale(1.1);
            }
            
            .timer-edit svg, .timer-delete svg {
                width: 16px;
                height: 16px;
                stroke-width: 2;
            }      

            .timer-edit.active, .timer-delete.active {
                background: var(--accent);
            }            
    
            .no-timers {
                text-align: center;
                color: var(--text-secondary);
                font-style: italic;
                padding: 20px;
                font-size: 13px;
            }        




            /* Timer Main Buttons */
            .timer-main-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .timer-main-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 20px 16px;
                background: rgba(255,255,255,0.08);
                border: 2px solid rgba(255,255,255,0.15);
                border-radius: 16px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow: hidden;
            }
            
            .timer-main-btn::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .timer-main-btn:hover::before {
                opacity: 1;
            }
            
            .timer-main-btn.active {
                background: var(--accent-light);
                border-color: var(--accent);
                color: var(--accent);
                box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2);
            }
            
            .timer-btn-icon {
                font-size: 24px;
                margin-bottom: 4px;
            }
            
            .timer-btn-text {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 2px;
            }
            
            .timer-btn-desc {
                font-size: 11px;
                opacity: 0.8;
                color: var(--text-secondary);
            }
            
            .timer-main-btn.active .timer-btn-desc {
                color: var(--text-primary);
            }
            
            /* Timer Modal */
            .timer-modal-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(10px);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            .timer-modal-overlay.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .timer-modal {
                width: 90vw;
                max-width: 400px;
                max-height: 80vh;
                margin: 20px;
                transform: scale(0.9) translateY(20px);
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            .timer-modal-overlay.visible .timer-modal {
                transform: scale(1) translateY(0);
            }
            
            .timer-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .timer-back-btn,
            .timer-close-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                color: var(--text-primary);
            }
            
            .timer-back-btn:hover,
            .timer-close-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: scale(1.1);
            }
            
            .timer-back-btn svg,
            .timer-close-btn svg {
                width: 20px;
                height: 20px;
                stroke-width: 2;
            }
            
            .timer-modal-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .timer-modal-content {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            
            .loading-timers,
            .no-timers {
                text-align: center;
                color: var(--text-secondary);
                font-style: italic;
                padding: 20px;
                font-size: 13px;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
            }      

            /* Timer Modal Content */
            .step-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 20px;
                text-align: center;
            }
            
            .device-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: 12px;
            }
            
            .device-action-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 20px 16px;
                background: rgba(255,255,255,0.08);
                border: 2px solid rgba(255,255,255,0.15);
                border-radius: 16px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow: hidden;
            }
            
            .device-action-btn::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .device-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .device-action-btn:hover::before {
                opacity: 1;
            }
            
            .action-icon {
                font-size: 24px;
                margin-bottom: 4px;
            }
            
            .action-text {
                font-size: 13px;
                font-weight: 600;
                text-align: center;
            }            



            /* Timer Control Design - Scrollable wie History */
            .timer-control-design {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                margin-top: 20px;
                position: relative;
                z-index: 5;
                height: auto;
                max-height: none;
                overflow-y: visible;
                scrollbar-width: thin; /* ← NEU: Dünne Scrollbar */
                scrollbar-color: rgba(255,255,255,0.2) transparent; /* ← NEU */
                -ms-overflow-style: none; /* ← NEU */
                padding-right: 4px; /* ← NEU: Platz für Scrollbar */
            }
            
            /* NEU: Webkit Scrollbar Styling */
            .timer-control-design::-webkit-scrollbar {
                width: 4px;
            }
            
            .timer-control-design::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .timer-control-design::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
            }
            
            .timer-control-design::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }
            
            
            .timer-control-row {
                display: flex;
                gap: 16px;
                justify-content: center;
                margin-top: 16px;
                z-index: 9;
                position: relative;
            }
            
            .timer-control-button {
                flex-basis: 60px;
                flex-grow: 0;
                flex-shrink: 0;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: 8px;
            }
            
            .timer-control-button svg {
                width: 20px;
                height: 20px;
                stroke-width: 1;
            }
            
            .timer-button-label {
                font-size: 9px;
                font-weight: 600;
                line-height: 1;
            }
            
            .timer-control-button:hover {
                transform: scale(1.05);
                background: rgba(255, 255, 255, 0.2);
            }
            
            .timer-control-button.active {
                background: var(--accent);
                color: white;
            }
            
            /* Timer Presets (wie device-control-presets) */
            .timer-control-presets {
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: all 0.4s ease;
                width: 100%;
                max-width: 280px;
            }
            
            .timer-control-presets.visible {
                max-height: 400px;
                opacity: 1;
                margin-top: 30px;
            }

            /* ✅ NEUE größere Timer Presets - Design von timer-control-row übernehmen */
            .timer-control-presets.timer-action-presets,
            .timer-control-presets.schedule-action-presets {
                width: 100%;
                max-width: none; /* Entferne Begrenzung */
                margin: 0; /* Kein auto centering */
                padding: 0; /* Kein extra padding */
                background: transparent; /* Kein Background */
                border: none; /* Kein Border */
                border-radius: 0; /* Kein border-radius */
                overflow: visible; /* Sichtbar */
                transition: none; /* Keine Transition */
            }
            
            .timer-control-presets-grid {
                display: flex; /* ← GEÄNDERT: flex statt grid */
                justify-content: center; /* ← Mittig */
                align-items: center;
                gap: 16px; /* ← Abstand zwischen Buttons */
                margin: 10px; /* ← Abstand nach oben */
                width: 100%;
            }

            /* Mobile Anpassung */
            @media (max-width: 768px) {
                .timer-control-presets-grid {
                    gap: 12px; /* ← Etwas weniger Abstand auf Mobile */
                    margin-top: 20px; /* ← Weniger Abstand nach oben */
                }
            }            

            .timer-control-preset {
                flex-basis: 70px;
                flex-grow: 0;
                flex-shrink: 0;
                width: 70px;
                height: 70px;
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
                position: relative;
                flex-direction: column;
            }
            
            .timer-control-preset:hover {
                transform: scale(1.05);
                background: rgba(255, 255, 255, 0.2);
            }
            
            .timer-control-preset.active {
                background: var(--accent);
                border-color: white;
            }

            .timer-control-preset.active::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-weight: bold;
                text-shadow: 0 0 4px rgba(0,0,0,0.8);
            }            
            
            .timer-control-preset svg {
                width: 24px;
                height: 24px;
                stroke-width: 1;
            }

            /* ✅ Hover-Effekte für Icons und Labels */
            .timer-control-preset:hover svg {
                transform: scale(1.1);
            }
            
            .timer-control-preset:hover {
                transform: translateY(-1px);
            }          

            /* ✅ Mobile Anpassung */
            @media (max-width: 768px) {
                .timer-control-presets-grid {
                    grid-template-columns: repeat(2, 1fr); /* Auch mobile 2 Spalten */
                    gap: 10px;
                }          
                

            }            

            /* ✅ Spezielle Behandlung für Schedule Presets */
            .schedule-action-presets .timer-control-preset {
                /* Gleiche Styles wie Timer, aber mit schedule-spezifischen Farben */
                &:hover {
                    background: rgba(120, 119, 198, 0.15); /* Lila Tint für Schedule */
                }
                
                &.active {
                    background: linear-gradient(135deg, #7877c6, #5c5ce0);
                    border-color: #7877c6;
                }
            }


        
            
            .loading-timers,
            .no-timers {
                text-align: center;
                color: var(--text-secondary);
                font-style: italic;
                padding: 20px;
                font-size: 13px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
            }      

            /* Timer Time Selection - für Scrolling optimiert */
            .timer-time-selection {
                width: 100%;
                max-width: 320px;
                margin: 20px auto 0 auto;
                padding: 20px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                flex-shrink: 0; /* ← NEU: Verhindert Schrumpfen */
            }            
            
            .time-selection-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .selected-action-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                display: inline-flex;
            }
            
            .action-label {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .action-description {
                font-size: 13px;
                color: var(--text-secondary);
            }
            
            /* Time Picker */
            .time-picker-container {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
            }
            
            .time-picker-wheel {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .time-input-group {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .time-input {
                width: 60px;
                height: 40px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: var(--text-primary);
                text-align: center;
                font-size: 16px;
                font-weight: 600;
                outline: none;
                transition: all 0.2s ease;
            }
            
            .time-input:focus {
                border-color: var(--accent);
                box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
            }
            
            .time-label {
                font-size: 11px;
                font-weight: 600;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .time-separator {
                font-size: 24px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 0 4px;
            }
            
            /* Quick Time Buttons */
            .quick-time-buttons {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 20px;
            }
            
            .quick-time-btn {
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .quick-time-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                color: var(--text-primary);
                transform: translateY(-1px);
            }
            
            .quick-time-btn.active {
                background: var(--accent);
                border-color: var(--accent);
                color: white;
            }
            
            /* Create Actions */
            .timer-create-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            
            .timer-cancel-btn,
            .timer-create-btn {
                flex: 1;
                padding: 12px 20px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .timer-cancel-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: var(--text-secondary);
            }
            
            .timer-cancel-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                color: var(--text-primary);
            }
            
            .timer-create-btn {
                background: var(--accent);
                border: 1px solid var(--accent);
                color: white;
            }
            
            .timer-create-btn:hover {
                background: rgba(0, 122, 255, 0.8);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
            }      


            /* Verbesserte Schedule-Liste (Timer-Design übernommen) */
            .active-schedules {
                margin-bottom: 16px;
                min-height: 60px;
            }
            
            .schedules-header h4 {
                font-size: 12px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .schedules-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .schedule-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: rgba(120, 119, 198, 0.1); /* Lila für Zeitpläne */
                border-radius: 12px;
                border: 1px solid rgba(120, 119, 198, 0.2);
                transition: all 0.2s ease;
            }
            
            .schedule-item:hover {
                background: rgba(120, 119, 198, 0.15);
                border-color: rgba(120, 119, 198, 0.3);
            }
            
            .schedule-info {
                flex: 1;
            }
            
            .schedule-main .schedule-name {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-primary);
                margin-bottom: 2px;
            }
            
            .schedule-details {
                display: flex;
                gap: 8px;
                font-size: 11px;
                color: var(--text-secondary);
            }
            
            .schedule-days {
                color: #7877c6;
                font-weight: 500;
            }
            
            .schedule-controls {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .schedule-toggle-btn, .schedule-delete-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px;
                border-radius: 6px;
                transition: all 0.2s ease;
                color: var(--text-secondary);
            }
            
            .schedule-toggle-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .schedule-delete-btn:hover {
                background: rgba(255, 82, 82, 0.2);
                color: #ff5252;
            }     


            
            /* Minimal Time Picker Styles - Spezifische Klassen */
            .minimal-time-picker {
                max-width: 400px;
                margin: 0 auto;
                padding: 24px;
                background: white;
                border-radius: 12px;
            }
            
            .minimal-time-picker .mtp-display-container {
                margin-bottom: 24px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .minimal-time-picker .mtp-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            
            .minimal-time-picker .mtp-unit {
                position: relative;
                cursor: pointer;
                user-select: none;
            }
            
            .minimal-time-picker .mtp-value {
                font-size: 24px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-weight: bold;
                color: #1f2937;
                padding: 4px 8px;
                border-radius: 4px;
                height: 48px;
                display: flex;
                align-items: center;
            }
            
            .minimal-time-picker .mtp-separator {
                font-size: 24px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-weight: bold;
                color: #1f2937;
                height: 48px;
                display: flex;
                align-items: center;
            }
            
            .minimal-time-picker .mtp-chevron {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                padding: 4px;
                background: white;
                border: none;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                cursor: pointer;
                color: #6b7280;
                z-index: 10;
            }
            
            .minimal-time-picker .mtp-chevron:hover {
                color: #2563eb;
            }
            
            .minimal-time-picker .mtp-chevron-up {
                top: -24px;
            }
            
            .minimal-time-picker .mtp-chevron-down {
                bottom: -24px;
            }
            
            .minimal-time-picker .mtp-calendar-btn {
                margin-left: 16px;
                padding: 12px;
                background: transparent;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                color: #6b7280;
                transition: all 0.2s;
                height: 48px;
                width: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .minimal-time-picker .mtp-calendar-btn:hover {
                color: #2563eb;
                background: #eff6ff;
            }
            
            .minimal-time-picker .mtp-actions {
                display: flex;
                justify-content: center;
                gap: 8px;
            }
            
            .minimal-time-picker .mtp-action-btn {
                padding: 12px;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .minimal-time-picker .mtp-cancel {
                background: #dc2626;
                color: white;
            }
            
            .minimal-time-picker .mtp-cancel:hover {
                background: #b91c1c;
            }
            
            .minimal-time-picker .mtp-create {
                background: #2563eb;
                color: white;
            }
            
            .minimal-time-picker .mtp-create:hover {
                background: #1d4ed8;
            }

            
            
            /* Day Picker Styles */
            .minimal-time-picker .mtp-day-picker {
                width: 100%;
                height: 48px;
            }
            
            .minimal-time-picker .mtp-day-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                height: 48px;
            }
            
            .minimal-time-picker .mtp-chips-container {
                flex: 1;
                overflow-x: auto;
                padding-bottom: 8px;
                display: flex;
                gap: 8px;
                align-items: center;
                height: 48px;
                margin-top: 6px;
            }
            
            .minimal-time-picker .mtp-chips-container::-webkit-scrollbar {
                display: none;
            }
            
            .minimal-time-picker .mtp-chips-container {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            
            .minimal-time-picker .mtp-chip {
                padding: 8px 16px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                white-space: nowrap;
                flex-shrink: 0;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                cursor: pointer;
            }
            
            .minimal-time-picker .mtp-chip:hover {
                background: #eff6ff;
                border-color: #2563eb;
            }
            
            .minimal-time-picker .mtp-chip.active {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }
            
            .minimal-time-picker .mtp-weekday-chip {
                padding: 8px 12px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                white-space: nowrap;
                flex-shrink: 0;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                cursor: pointer;
            }
            
            .minimal-time-picker .mtp-weekday-chip:hover {
                background: #eff6ff;
                border-color: #2563eb;
            }
            
            .minimal-time-picker .mtp-weekday-chip.active {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }
            
            .minimal-time-picker .mtp-ok-btn {
                padding: 8px 16px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                flex-shrink: 0;
                font-weight: 500;
            }
            
            .minimal-time-picker .mtp-ok-btn:hover {
                background: #1d4ed8;
            }        
            
            .tts-content {
                padding: 16px !important;
            }
            
            .tts-input-section {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .tts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tts-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .tts-counter {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .tts-counter.warning {
                color: #FF9800;
            }
            
            .tts-textarea {
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                padding: 12px;
                color: var(--text-primary);
                font-size: 14px;
                resize: vertical;
                min-height: 80px;
            }
            
            .tts-textarea:focus {
                outline: none;
                border-color: var(--accent);
            }
            
            .tts-speak-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 24px;
                background: var(--accent);
                border: none;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .tts-speak-btn:disabled {
                background: rgba(255,255,255,0.1);
                color: var(--text-secondary);
                cursor: not-allowed;
            }
            
            .tts-speak-btn:not(:disabled):hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
            }  



            /* Actions Container - Scrollbar wie History */
            .actions-container {
                padding: 0px;
                height: calc(100vh - 300px);
                max-height: 500px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
                -ms-overflow-style: none;
            }
            
            .actions-container::-webkit-scrollbar {
                width: 4px;
            }
            
            .actions-container::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .actions-container::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.2);
                border-radius: 2px;
            }
            
            .actions-container::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
            }

            .actions-grid {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }        

            /* Action Timeline Events - Erweitert die bestehenden .timeline-event Styles */
            .action-timeline-event {
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .action-timeline-event:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .action-timeline-event.favorite-action {
                border: 1px solid rgba(255, 193, 7, 0.3);
                background: rgba(255, 193, 7, 0.05);
            }
            
            .action-execute-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                color: var(--text-secondary);
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
            }
            
            .action-execute-btn:hover {
                background: var(--accent);
                color: white;
                transform: translateY(-50%) scale(1.1); /* Kombination beider Transforms */
            }    

            .timeline-event-title {
               font-size: 18px;
               color: var(--text-primary);
               font-weight: 600;
            }            

            /* Action Meta Badges */
            .timeline-event-details {
                display: flex;
                gap: 6px;
                align-items: center;
                flex-wrap: wrap;
                margin-top: 4px;
            }
            
            .action-type-badge,
            .action-area-badge,
            .action-source-badge {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 6px;
                font-weight: 500;
            }
            
            .action-type-badge {
                background: rgba(33, 150, 243, 0.2);
                color: #2196F3;
            }
            
            .action-area-badge {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-secondary);
            }
            
            .action-source-badge {
                background: rgba(0, 0, 0, 0.2);
                color: var(--text-secondary);
            }
            
            /* Timer-spezifische Badge-Varianten */
            .timer-type-badge {
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
            }
            
            .timer-time-badge {
                background: rgba(255, 152, 0, 0.2);
                color: #FF9800;
            }
            
            .timer-status-badge {
                background: rgba(156, 39, 176, 0.2);
                color: #9C27B0;
            }
            
         
            
            /* Favoriten-spezifische Badge-Farben */
            .action-timeline-event.favorite-action .action-type-badge {
                background: rgba(255, 193, 7, 0.2);
                color: #FFC107;
            }           

            /* Domain-spezifische Icon-Farben */
            .action-timeline-event[data-action-domain="scene"] .timeline-event-icon {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
            }
            
            .action-timeline-event[data-action-domain="script"] .timeline-event-icon {
                background: linear-gradient(135deg, #FF9800, #F57C00);
                color: white;
            }
            
            .action-timeline-event[data-action-domain="automation"] .timeline-event-icon {
                background: linear-gradient(135deg, #4CAF50, #388E3C);
                color: white;
            }
            
            /* Icon-Container sollte rund sein */
            .action-timeline-event .timeline-event-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 600;
                flex-shrink: 0;
                padding: 10px;
            }    

            /* Actions Filter Chips - Subcategory-Chip Design */
            .actions-filter-chips {
                display: flex;
                gap: 8px;
                padding: 5px 20px 16px 0px;
                overflow-x: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
                -webkit-overflow-scrolling: touch;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
            
            .actions-filter-chips::-webkit-scrollbar {
                display: none;
            }
            
            .action-filter-chip {
                padding: 10px 15px;
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
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 600;
            }
            
            .action-filter-chip.active {
                background: var(--accent-light);
                border-color: var(--accent);
                color: var(--accent);
            }
            
            .action-filter-chip:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .chip-count {
                background: rgba(255,255,255,0.2);
                border-radius: 8px;
                padding: 2px 6px;
                font-size: 12px;
                font-weight: 600;
                min-width: 16px;
                text-align: center;
                margin-left: 6px;
            }
            
            .action-filter-chip.active .chip-count {
                background: rgba(255,255,255,0.3);
            }        


            /* Timer Item Styles - NEUE Klassen */
            .active-timer-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                background: rgba(255, 255, 255, 0.08);
                border: 0px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                transition: all 0.2s ease;
                cursor: pointer;
                position: relative;
            }
            
            .active-timer-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .timer-icon-container {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 600;
                flex-shrink: 0;
                padding: 10px;
                color: white;
                /* Kein Standard-Background mehr */
            }
            
            /* Action-spezifische Timer Icon Farben */
            .timer-item[data-action-type="turn_on"] .timer-icon-container {
                background: linear-gradient(135deg, #4CAF50, #388E3C); /* Grün für EIN */
            }
            
            .timer-item[data-action-type="turn_off"] .timer-icon-container {
                background: linear-gradient(135deg, #F44336, #D32F2F); /* Rot für AUS */
            }
            
            .timer-item[data-action-type="dim_30"] .timer-icon-container {
                background: linear-gradient(135deg, #FF9800, #F57C00); /* Orange für 30% */
            }
            
            .timer-item[data-action-type="dim_50"] .timer-icon-container {
                background: linear-gradient(135deg, #9C27B0, #7B1FA2); /* Lila für 50% */
            }        

            .timer-item[data-action-type="heat"] .timer-icon-container {
                background: linear-gradient(135deg, #FF5722, #E64A19); /* Orange/Rot für Heizen */
            }
            
            .timer-item[data-action-type="cool"] .timer-icon-container {
                background: linear-gradient(135deg, #2196F3, #1976D2); /* Blau für Kühlen */
            }
            
            .timer-item[data-action-type="dry"] .timer-icon-container {
                background: linear-gradient(135deg, #9C27B0, #7B1FA2); /* Lila für Entfeuchten */
            }
            
            .timer-item[data-action-type="fan"] .timer-icon-container {
                background: linear-gradient(135deg, #4CAF50, #388E3C); /* Grün für Lüften */
            }

            .timer-item[data-action-type="cover_open"] .timer-icon-container {
                background: linear-gradient(135deg, #4CAF50, #388E3C); /* Grün für Öffnen */
            }
            
            .timer-item[data-action-type="cover_close"] .timer-icon-container {
                background: linear-gradient(135deg, #F44336, #D32F2F); /* Rot für Schließen */
            }
            
            .timer-item[data-action-type="cover_50"] .timer-icon-container {
                background: linear-gradient(135deg, #FF9800, #F57C00); /* Orange für 50% */
            }       
            
            
            
            /* Timer Content Area */
            .timer-content-area {
                flex: 1;
                min-width: 0;
                margin-left: 12px;
            }
            
            .timer-item-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.15;
            }
            
            /* Timer Meta Badges */
            .timer-meta-badges {
                display: flex;
                gap: 6px;
                align-items: center;
                flex-wrap: wrap;
                margin-top: 4px;
            }
            
            .timer-type-badge {
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 6px;
                font-weight: 500;
            }
            
            .timer-time-badge {
                background: rgba(255, 152, 0, 0.2);
                color: #FF9800;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 6px;
                font-weight: 500;
            }
            
            /* Timer Action Buttons */
            .timer-action-buttons {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                align-items: center;
                gap: 0px;
            }

            /* Timer Edit/Delete Button Styles */
            .timer-action-buttons .timer-edit,
            .timer-action-buttons .timer-delete {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                color: var(--text-secondary);
            }
            
            .timer-action-buttons .timer-edit:hover {
                background: rgba(0, 122, 255, 0.8);
                color: white;
                transform: scale(1.1);
            }
            
            .timer-action-buttons .timer-delete:hover {
                background: rgba(255, 59, 48, 0.8);
                color: white;
                transform: scale(1.1);
            }
            
            .timer-action-buttons .timer-edit svg,
            .timer-action-buttons .timer-delete svg {
                width: 16px;
                height: 16px;
                stroke-width: 2;
            }
            
            /* Timer Item Responsive Positioning */
            .timer-item {
                position: relative;
            }            

            .favorite-button {
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
                color: var(--text-secondary);
                padding: 0;
                position: absolute;
                right: 0;
            }
            
            .favorite-button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }
            
            .favorite-button.active {
                color: #ff4757;
                background: rgba(255, 71, 87, 0.2);
            }
            
            .favorite-button.active svg {
                fill: #ff4757;
            }
            
            .favorite-button svg {
                width: 24px;
                height: 24px;
                transition: all 0.2s ease;
            }     

            .device-favorite-icon {
                position: absolute;
                top: 8px;
                right: 8px;
                font-size: 16px;
                opacity: 0.8;
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
                                <path d="M4.40434 13.6099C3.51517 13.1448 3 12.5924 3 12C3 10.3431 7.02944 9 12 9C16.9706 9 21 10.3431 21 12C21 12.7144 20.2508 13.3705 19 13.8858"/>
                                <path d="M12 11.01L12.01 10.9989"/>
                                <path d="M16.8827 6C16.878 4.97702 16.6199 4.25309 16.0856 3.98084C14.6093 3.22864 11.5832 6.20912 9.32664 10.6379C7.07005 15.0667 6.43747 19.2668 7.91374 20.019C8.44117 20.2877 9.16642 20.08 9.98372 19.5"/>
                                <path d="M9.60092 4.25164C8.94056 3.86579 8.35719 3.75489 7.91369 3.98086C6.43742 4.73306 7.06999 8.93309 9.32658 13.3619C11.5832 17.7907 14.6092 20.7712 16.0855 20.019C17.3977 19.3504 17.0438 15.9577 15.3641 12.1016"/>
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

        // Touch-Events für Mobile hinzufügen
        clearButton.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            this.clearSearch(); 
        });
        clearButton.addEventListener('touchend', (e) => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            this.clearSearch(); 
        });
                                                      
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

        // NEU: Search-Wrapper Klick Event hinzufügen
        const searchWrapper = this.shadowRoot.querySelector('.search-wrapper');
        if (searchWrapper) {
            searchWrapper.addEventListener('click', (e) => {
                // 1. Prüfen, ob der Klick auf einen Button ging. Wenn ja, nichts tun.
                if (e.target.closest('button')) {
                    return;
                }
        
                // 2. Wenn das Panel noch nicht offen ist, den Fokus auf das Input-Feld setzen.
                if (!this.isPanelExpanded) {
                    // Dies löst automatisch den bestehenden 'focus'-Event aus,
                    // der dann `expandPanel()` aufruft.
                    this.shadowRoot.querySelector('.search-input').focus();
                }
            });
        }        
    
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



    
    
    handleSearch(query) {
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        this.isSearching = query.trim().length > 0;
        if (this.searchTimeout) { clearTimeout(this.searchTimeout); }

        if (query.length > 0) {
            if (!clearButton.classList.contains('visible')) {
                clearButton.classList.add('visible');
                clearButton.offsetHeight; // Force reflow
                this.animateElementIn(clearButton, { scale: [0, 1], opacity: [0, 1] });
            }
        } else {
            this.isSearching = false; 

            if (clearButton.classList.contains('visible')) {
                const animation = this.animateElementOut(clearButton);
                animation.finished.then(() => { 
                    clearButton.classList.remove('visible');
                    clearButton.style.transform = '';
                    clearButton.style.scale = '';
                });
            }            
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
        ], { duration: 300, easing: 'ease-out' });
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

    isMobile() {
        return window.innerWidth <= 768;
    }    

    showCategoryButtons() {
        this.collapsePanel(); // <-- HINZUGEFÜGTE ZEILE

        // NEU: Search-Wrapper auf Mobile verstecken
        if (this.isMobile()) {
            const searchWrapper = this.shadowRoot.querySelector('.search-panel');
            if (searchWrapper) {
                searchWrapper.style.display = 'none';
            }
        }
        
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        this.isMenuView = true;
        categoryButtons.classList.add('visible');
        categoryButtons.animate([{ opacity: 0, transform: 'translateX(20px) scale(0.9)' }, { opacity: 1, transform: 'translateX(0) scale(1)' }], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    }
    
    hideCategoryButtons() {
        // NEU: Search-Wrapper wieder anzeigen  
        if (this.isMobile()) {
            const searchWrapper = this.shadowRoot.querySelector('.search-panel');
            if (searchWrapper) {
                searchWrapper.style.display = 'flex';
            }
        }
        
        const categoryButtons = this.shadowRoot.querySelector('.category-buttons');
        if (!this.isMenuView) return;
        const animation = categoryButtons.animate([{ opacity: 1, transform: 'translateX(0) scale(1)' }, { opacity: 0, transform: 'translateX(20px) scale(0.9)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
        animation.finished.then(() => { categoryButtons.classList.remove('visible'); this.isMenuView = false; });
    }

    handleCategorySelect(selectedButton) {
        const category = selectedButton.dataset.category;
        
        // Wenn gleiche Kategorie → Menü schließen
        if (category === this.activeCategory) {
            this.hideCategoryButtons();
            return;
        }
        
        // Animation für visuelles Feedback
        selectedButton.animate([
            { transform: 'scale(1)' }, 
            { transform: 'scale(1.1)' }, 
            { transform: 'scale(1)' }
        ], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        
        // Zentrale Navigation verwenden
        this.switchToCategory(category);
        
        // Menü schließen
        this.hideCategoryButtons();
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
                this.activeSubcategory = 'all';
                this.updateSubcategoryChips();                
                this.showCurrentCategoryItems(); 
                break;
            case 'areas':
                this.subcategoryMode = 'areas';
                this.activeSubcategory = 'all';
                this.updateSubcategoryChips();
                this.showCurrentCategoryItems(); 
                break;
            case 'types':
                this.subcategoryMode = 'types';
                this.activeSubcategory = 'all';
                this.updateSubcategoryChips();
                this.showCurrentCategoryItems(); 
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
            automations: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.40434 13.6099C3.51517 13.1448 3 12.5924 3 12C3 10.3431 7.02944 9 12 9C16.9706 9 21 10.3431 21 12C21 12.7144 20.2508 13.3705 19 13.8858"/><path d="M12 11.01L12.01 10.9989"/><path d="M16.8827 6C16.878 4.97702 16.6199 4.25309 16.0856 3.98084C14.6093 3.22864 11.5832 6.20912 9.32664 10.6379C7.07005 15.0667 6.43747 19.2668 7.91374 20.019C8.44117 20.2877 9.16642 20.08 9.98372 19.5"/><path d="M9.60092 4.25164C8.94056 3.86579 8.35719 3.75489 7.91369 3.98086C6.43742 4.73306 7.06999 8.93309 9.32658 13.3619C11.5832 17.7907 14.6092 20.7712 16.0855 20.019C17.3977 19.3504 17.0438 15.9577 15.3641 12.1016"/></svg>`,
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

    switchToCategory(newCategory) {
        console.log(`🔄 Switching to category: ${newCategory}`);
        
        // 1. Interne Variable setzen
        this.activeCategory = newCategory;
        
        // 2. Subcategory Mode zurücksetzen
        if (newCategory === 'custom') {
            this.subcategoryMode = 'categories';
        } else {
            this.subcategoryMode = 'categories';
        }
        
        // 3. Subcategory zurücksetzen
        this.activeSubcategory = 'all';
        
        // 4. UI-Komponenten aktualisieren
        this.updateCategoryIcon();
        this.updatePlaceholder();
        this.updateCategoryButtonStates(); // ← NEU
        this.updateSubcategoryChips();
        this.updateTypeButtonVisibility();
        this.updateFilterButtonStates();
        
        // 5. Items laden und anzeigen
        this.showCurrentCategoryItems();
        
        console.log(`✅ Category switched to: ${newCategory}`);
    }
    
    updateCategoryButtonStates() {
        this.shadowRoot.querySelectorAll('.category-button').forEach(btn => {
            const isActive = btn.dataset.category === this.activeCategory;
            btn.classList.toggle('active', isActive);
        });
    }    

    async updateItems() {
        if (!this._hass) return;
        
        let allEntityConfigs = [];
        
        // 1. Auto-Discovery wenn aktiviert (AWAIT HINZUGEFÜGT!)
        if (this._config.auto_discover) {
            const discoveredEntities = await this.discoverEntities(); // ← AWAIT hinzugefügt!
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

    async discoverEntities() {
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
                    
                    // INTELLIGENTE AREA-ERMITTLUNG basierend auf Domain
                    let areaName;
                    if (domain === 'script') {
                        areaName = await this.getScriptArea(entityId, state);
                    } else if (domain === 'scene') {
                        areaName = this.getSceneArea(entityId, state);
                    } else if (domain === 'automation') {
                        areaName = await this.getAutomationArea(entityId, state);
                    } else {
                        // Standard Area-Ermittlung für Geräte
                        areaName = this.getEntityArea(entityId, state);
                    }
                    
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
                        auto_discovered: true,
                        domain: domain,
                        category: this.categorizeEntity(domain)
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

    async getScriptArea(entityId, state) {
        try {
            console.log(`🔍 Analyzing script area for: ${entityId}`);
            
            // METHODE 1: Prüfe ob Skript explizit einer Area zugeordnet ist (Entity Registry)
            if (this._hass.areas && this._hass.entities && this._hass.entities[entityId]) {
                const entityRegistry = this._hass.entities[entityId];
                if (entityRegistry.area_id && this._hass.areas[entityRegistry.area_id]) {
                    const area = this._hass.areas[entityRegistry.area_id];
                    console.log(`✅ Script has explicit area: ${area.name}`);
                    return area.name;
                }
            }
            
            // METHODE 2: Analysiere Skript-Name nach Area-Keywords
            const scriptName = state.attributes.friendly_name || entityId;
            const detectedArea = this.extractAreaFromName(scriptName);
            if (detectedArea !== 'Ohne Raum') {
                console.log(`✅ Script area detected from name: ${detectedArea}`);
                return detectedArea;
            }
            
            // METHODE 3: Versuche Skript-Konfiguration zu analysieren (Advanced)
            try {
                const scriptConfig = await this.getScriptConfiguration(entityId);
                if (scriptConfig) {
                    const configArea = this.analyzeScriptTargets(scriptConfig);
                    if (configArea !== 'Ohne Raum') {
                        console.log(`✅ Script area detected from config: ${configArea}`);
                        return configArea;
                    }
                }
            } catch (configError) {
                console.warn(`Could not analyze script config for ${entityId}:`, configError);
            }
            
            // FALLBACK: Wenn keine Area ermittelt werden kann
            console.log(`❌ No area found for script: ${entityId}`);
            return 'Ohne Raum';
            
        } catch (error) {
            console.warn(`❌ Error getting script area for ${entityId}:`, error);
            return 'Ohne Raum';
        }
    }

    // 🎯 HILFSMETHODE: Extrahiere Area aus Namen (verbesserte Version)
    extractAreaFromName(name) {
        if (!name) return 'Ohne Raum';
        
        const normalizedName = name.toLowerCase();
        
        // Liste der echten Areas aus Home Assistant für Matching
        const realAreas = this._hass.areas ? 
            Object.values(this._hass.areas).map(area => area.name.toLowerCase()) : [];
        
        // Suche nach echten Area-Namen im Namen (case-insensitive)
        for (const areaName of realAreas) {
            if (normalizedName.includes(areaName)) {
                // Finde die echte Area mit richtigem Case
                const matchedArea = Object.values(this._hass.areas).find(area => 
                    area.name.toLowerCase() === areaName
                );
                if (matchedArea) {
                    return matchedArea.name;
                }
            }
        }
        
        // Zusätzliche Keywords für häufige Raum-Begriffe
        const roomKeywords = {
            'wohnzimmer': ['wohnzimmer', 'living', 'salon'],
            'küche': ['küche', 'kitchen', 'kueche'],
            'schlafzimmer': ['schlafzimmer', 'bedroom', 'schlafen'],
            'bad': ['bad', 'bathroom', 'badezimmer'],
            'arbeitszimmer': ['arbeitszimmer', 'office', 'büro', 'buero', 'arbeiten'],
            'kinderzimmer': ['kinderzimmer', 'children', 'kids'],
            'garten': ['garten', 'garden', 'outdoor'],
            'garage': ['garage', 'carport'],
            'keller': ['keller', 'basement', 'cellar']
        };
        
        for (const [room, keywords] of Object.entries(roomKeywords)) {
            if (keywords.some(keyword => normalizedName.includes(keyword))) {
                // Prüfe ob dieser Raum in Home Assistant existiert
                const existingArea = Object.values(this._hass.areas || {}).find(area => 
                    area.name.toLowerCase() === room
                );
                if (existingArea) {
                    return existingArea.name;
                }
                // Fallback: Nutze Keyword als Raumname
                return room.charAt(0).toUpperCase() + room.slice(1);
            }
        }
        
        return 'Ohne Raum';
    }

    async getScriptConfiguration(entityId) {
        try {
            // Home Assistant bietet keinen direkten API-Endpunkt für Skript-Konfiguration
            // Alternative: Nutze verfügbare Informationen aus dem State
            const state = this._hass.states[entityId];
            
            // Prüfe ob es Script-spezifische Attribute gibt
            if (state.attributes) {
                // Manche Skripte haben 'last_triggered' oder andere hilfreiche Attribute
                return {
                    attributes: state.attributes,
                    // Weitere Analyse könnte hier erfolgen
                };
            }
            
            return null;
        } catch (error) {
            console.warn(`Error getting script config for ${entityId}:`, error);
            return null;
        }
    }

    analyzeScriptTargets(scriptConfig) {
        try {
            // Da wir keinen direkten Zugriff auf Skript-Actions haben,
            // nutzen wir verfügbare Informationen intelligent
            
            // Placeholder für erweiterte Analyse
            // In Zukunft könnte hier eine tiefere Integration erfolgen
            
            return 'Ohne Raum';
        } catch (error) {
            console.warn('Error analyzing script targets:', error);
            return 'Ohne Raum';
        }
    }

    getSceneArea(entityId, state) {
        try {
            console.log(`🎬 Analyzing scene area for: ${entityId}`);
            
            // METHODE 1: Explizite Area-Zuordnung
            if (this._hass.areas && this._hass.entities && this._hass.entities[entityId]) {
                const entityRegistry = this._hass.entities[entityId];
                if (entityRegistry.area_id && this._hass.areas[entityRegistry.area_id]) {
                    const area = this._hass.areas[entityRegistry.area_id];
                    console.log(`✅ Scene has explicit area: ${area.name}`);
                    return area.name;
                }
            }
            
            // METHODE 2: Analysiere betroffene Entities in der Szene
            const entities = state.attributes.entity_id || [];
            const areas = new Set();
            
            entities.forEach(targetEntity => {
                if (this._hass.states[targetEntity]) {
                    const entityArea = this.getEntityArea(targetEntity, this._hass.states[targetEntity]);
                    if (entityArea !== 'Ohne Raum') {
                        areas.add(entityArea);
                    }
                }
            });
            
            // Wenn alle Entities in einem Raum sind
            if (areas.size === 1) {
                const area = [...areas][0];
                console.log(`✅ Scene area detected from entities: ${area}`);
                return area;
            }
            
            // METHODE 3: Area aus Namen extrahieren
            const detectedArea = this.extractAreaFromName(state.attributes.friendly_name || entityId);
            if (detectedArea !== 'Ohne Raum') {
                console.log(`✅ Scene area detected from name: ${detectedArea}`);
                return detectedArea;
            }
            
            // FALLBACK: Mehrere Räume oder unbekannt
            if (areas.size > 1) {
                console.log(`ℹ️ Scene affects multiple areas: ${[...areas].join(', ')}`);
                return 'Mehrere Räume';
            }
            
            console.log(`❌ No area found for scene: ${entityId}`);
            return 'Ohne Raum';
            
        } catch (error) {
            console.warn(`❌ Error getting scene area for ${entityId}:`, error);
            return 'Ohne Raum';
        }
    }
    
    // 🎯 AUTOMATIONS AREA-DISCOVERY (ähnlich wie Skripte)
    async getAutomationArea(entityId, state) {
        try {
            console.log(`⚙️ Analyzing automation area for: ${entityId}`);
            
            // METHODE 1: Explizite Area-Zuordnung
            if (this._hass.areas && this._hass.entities && this._hass.entities[entityId]) {
                const entityRegistry = this._hass.entities[entityId];
                if (entityRegistry.area_id && this._hass.areas[entityRegistry.area_id]) {
                    const area = this._hass.areas[entityRegistry.area_id];
                    console.log(`✅ Automation has explicit area: ${area.name}`);
                    return area.name;
                }
            }
            
            // METHODE 2: Area aus Namen extrahieren
            const detectedArea = this.extractAreaFromName(state.attributes.friendly_name || entityId);
            if (detectedArea !== 'Ohne Raum') {
                console.log(`✅ Automation area detected from name: ${detectedArea}`);
                return detectedArea;
            }
            
            // METHODE 3: Analyse von Automation-Attributen
            if (state.attributes.last_triggered || state.attributes.current) {
                // Weitere Analyse könnte hier erfolgen
            }
            
            console.log(`❌ No area found for automation: ${entityId}`);
            return 'Ohne Raum';
            
        } catch (error) {
            console.warn(`❌ Error getting automation area for ${entityId}:`, error);
            return 'Ohne Raum';
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

    getCategoryItemLabel(category, count = 1) {
        const labels = {
            'devices': count === 1 ? 'Gerät' : 'Geräte',
            'scripts': count === 1 ? 'Skript' : 'Skripte', 
            'automations': count === 1 ? 'Automation' : 'Automationen',
            'scenes': count === 1 ? 'Szene' : 'Szenen',
            'custom': count === 1 ? 'Item' : 'Items'
        };
        return labels[category] || (count === 1 ? 'Item' : 'Items');
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
            // 1. Items der AKTUELLEN Kategorie holen (hier wird der Fehler behoben)
            const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
        
            // 2. Gesamtzahl dieser Items ermitteln
            const totalCount = categoryItems.length;
        
            // 3. Gesamtzahl im Chip anzeigen
            const statusElement = allChip.querySelector('.subcategory-status');
            if (statusElement) {
                statusElement.textContent = `${totalCount} ${this.getCategoryItemLabel(this.activeCategory, totalCount)}`;
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
            case 'devices': return !['script', 'automation', 'scene', 'custom'].includes(item.domain);                
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
        
        // 🔧 FIX: Entferne diese Logik - die Gruppierung passiert in groupItemsByAreaCustom()
        // ❌ ENTFERNEN:
        // const favorites = this.getFavoriteItemsFromCache();
        // let itemsToRender = [...this.filteredItems];
        // if (favorites.length > 0) { ... }
        
        // ✅ VERWENDE DIREKT:
        let itemsToRender = [...this.filteredItems];
        
        if (itemsToRender.length === 0) {
            const emptyState = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Keine Ergebnisse</div><div class="empty-subtitle">Versuchen Sie einen anderen Suchbegriff</div></div>`;
            if (this.currentViewMode === 'grid') {
                resultsGrid.innerHTML = emptyState;
            } else {
                resultsList.innerHTML = emptyState;
            }
            return;
        }
        
        if (this.currentViewMode === 'grid') {
            this.renderGridResults(resultsGrid, itemsToRender);
        } else {
            this.renderListResults(resultsList, itemsToRender);
        }
    }
    
    renderGridResults(resultsGrid, itemsToRender = null) {
        resultsGrid.innerHTML = '';
        
        const items = itemsToRender || this.filteredItems;
        const enrichedItems = items.map(item => ({
            ...item,
            isFavorite: this.isFavoriteFromCache(item.id)
        }));
        
        const groupedItems = this.groupItemsByAreaCustom(enrichedItems);
        
        // 🎯 FIX: Custom Sortierung - Favoriten zuerst!
        const sortedAreas = Object.keys(groupedItems).sort((a, b) => {
            if (a === '💖 Favoriten') return -1;  // Favoriten immer zuerst
            if (b === '💖 Favoriten') return 1;   // Favoriten immer zuerst
            return a.localeCompare(b);            // Rest alphabetisch
        });
        
        let cardIndex = 0;
        sortedAreas.forEach(area => {
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
    
    renderListResults(resultsList, itemsToRender = null) {
        resultsList.innerHTML = '';
        
        const items = itemsToRender || this.filteredItems;
        const enrichedItems = items.map(item => ({
            ...item,
            isFavorite: this.isFavoriteFromCache(item.id)
        }));
        
        const groupedItems = this.groupItemsByAreaCustom(enrichedItems);
        
        // 🎯 FIX: Custom Sortierung - Favoriten zuerst!
        const sortedAreas = Object.keys(groupedItems).sort((a, b) => {
            if (a === '💖 Favoriten') return -1;  // Favoriten immer zuerst
            if (b === '💖 Favoriten') return 1;   // Favoriten immer zuerst
            return a.localeCompare(b);            // Rest alphabetisch
        });
        
        let itemIndex = 0;
        sortedAreas.forEach(area => {
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

    groupItemsByAreaCustom(items) {
        const grouped = {};
        
        // Favoriten separat sammeln (aber Items NICHT aus der Liste entfernen)
        const favorites = items.filter(item => item.isFavorite);
        
        // Favoriten-Gruppe hinzufügen (falls vorhanden)
        if (favorites.length > 0) {
            grouped['💖 Favoriten'] = favorites;
        }
        
        // ALLE Items (inkl. Favoriten) nach Area gruppieren
        items.forEach(item => {
            const area = item.area || 'Ohne Raum';
            if (!grouped[area]) {
                grouped[area] = [];
            }
            grouped[area].push(item);
        });
        
        return grouped;
    }

    getDynamicIcon(item) {
        if (item.domain === 'light') {
            return item.isActive ? 
                FastSearchCard.LIGHT_ON_SVG : 
                FastSearchCard.LIGHT_OFF_SVG;
        }
        
        if (item.domain === 'cover') {
            // Cover: isActive = offen (position > 0)
            return item.isActive ? 
                FastSearchCard.COVER_OPEN_SVG : 
                FastSearchCard.COVER_CLOSED_SVG;
        }
        
        if (item.domain === 'media_player') {
            const state = this._hass.states[item.id];
            if (state) {
                if (state.state === 'playing') {
                    return FastSearchCard.MEDIA_PAUSE_SVG; // Zeige Pause wenn spielt
                } else if (state.state === 'paused') {
                    return FastSearchCard.MEDIA_PLAY_SVG; // Zeige Play wenn pausiert
                } else {
                    return FastSearchCard.MEDIA_STOP_SVG; // Zeige Stop wenn gestoppt/idle
                }
            }
            return FastSearchCard.MEDIA_STOP_SVG;
        }
        
        if (item.domain === 'climate') {
            return item.isActive ? 
                FastSearchCard.CLIMATE_ON_SVG : 
                FastSearchCard.CLIMATE_OFF_SVG;
        }

        if (item.domain === 'script') {
            return FastSearchCard.SCRIPT_SVG;
        }
        
        if (item.domain === 'automation') {
            return FastSearchCard.AUTOMATION_SVG;
        }
        
        if (item.domain === 'scene') {
            return FastSearchCard.SCENE_SVG;
        }        
        
        // Fallback für andere Domains
        return item.icon;
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
        
        // NEU: Heart-Icon für Favoriten aus Cache
        const isFavorite = this.isFavoriteFromCache(item.id);
        const heartIcon = isFavorite ? 
            `<div class="device-favorite-icon">💖</div>` : '';
        
        card.innerHTML = `
            <div class="device-icon">${this.getDynamicIcon(item)}</div>
            <div class="device-info">
                <div class="device-name">${item.name}</div>
                <div class="device-status">${statusText}</div>
            </div>
            ${heartIcon}
        `;
        
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
            
            const chipsHTML = ['Alle', ...Array.from(categories).sort()].map(cat => {
                const isActive = (cat === 'Alle' && this.activeSubcategory === 'all') || 
                                (cat === this.activeSubcategory);
                
                let count;
                if (cat === 'Alle') {
                    count = customItems.length;
                } else {
                    count = customItems.filter(item => item.custom_data?.metadata?.category === cat).length;
                }
                
                const subcategoryValue = cat === 'Alle' ? 'all' : 
                                       cat === 'Keine' ? 'none' : cat;
                
                return `
                    <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategoryValue}">
                        <div class="chip-content">
                            <span class="subcategory-name">${cat}</span>
                            <span class="subcategory-status">${count} ${this.getCategoryItemLabel(this.activeCategory, count)}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = chipsHTML;
            
        } else if (this.subcategoryMode === 'areas') {
            // Custom Areas (nur aus Custom Items)
            const areas = new Set(customItems.map(item => item.area).filter(Boolean));
            
            const chipsHTML = ['Alle Räume', ...Array.from(areas).sort()].map(area => {
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
                            <span class="subcategory-status">${count} ${this.getCategoryItemLabel(this.activeCategory, count)}</span>
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
            
            const chipsHTML = ['Alle', ...Array.from(types).sort()].map(type => {
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
                            <span class="subcategory-status">${count} ${this.getCategoryItemLabel(this.activeCategory, count)}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = chipsHTML;
        }
    }    
    
    renderAreaChips(container) {
        // Get all unique areas from items
        const areas = ['Alle Räume', ...new Set(this.allItems.map(item => item.area).filter(Boolean))];
        
        const chipsHTML = areas.map(area => {
            const isActive = (area === 'Alle Räume' && this.activeSubcategory === 'all') || 
                            (area === this.activeSubcategory);
            
            // Zuerst nach der aktiven Kategorie filtern
            const categoryItems = this.allItems.filter(item => this.isItemInCategory(item, this.activeCategory));
            // Dann innerhalb dieser gefilterten Liste zählen
            const deviceCount = area === 'Alle Räume' ? categoryItems.length : 
                              categoryItems.filter(item => item.area === area).length;
            
            const subcategoryValue = area === 'Alle Räume' ? 'all' : area;
            
            return `
                <div class="subcategory-chip ${isActive ? 'active' : ''}" data-subcategory="${subcategoryValue}">
                    <div class="chip-content">
                        <span class="subcategory-name">${area}</span>
                        <span class="subcategory-status">${deviceCount} ${this.getCategoryItemLabel(this.activeCategory, deviceCount)}</span>
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
            <div class="device-list-icon">${this.getDynamicIcon(item)}</div>
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

        // NEU: Heart-Button Event-Listener
        const favoriteButton = this.shadowRoot.querySelector('.favorite-button');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleFavoriteClick(item);
            });
        }        
    
        this.setupCustomDetailTabs(item);
    }    

    async handleFavoriteClick(item) {
        try {
            if (!this.favoriteLabel) {
                this.favoriteLabel = await this.getFavoriteLabel();
            }
            
            await this.ensureFavoriteLabelExists();
            
            const isFavorite = this.isFavoriteFromCache(item.id); // ← Cache statt WebSocket
            
            if (isFavorite) {
                await this._hass.callWS({
                    type: 'config/entity_registry/update',
                    entity_id: item.id,
                    labels: await this.getEntityLabelsWithoutFavorite(item, this.favoriteLabel)
                });
                console.log('💔 Removed from favorites:', item.name);
                this.favoritesCache.set(item.id, false); // ← Cache aktualisieren
            } else {
                await this._hass.callWS({
                    type: 'config/entity_registry/update',
                    entity_id: item.id,
                    labels: await this.getEntityLabelsWithFavorite(item, this.favoriteLabel)
                });
                console.log('💖 Added to favorites:', item.name);
                this.favoritesCache.set(item.id, true); // ← Cache aktualisieren
            }
            
            this.updateFavoriteButtonStateFromCache(item);
            this.renderResults(); // ← Ohne await!
            
        } catch (error) {
            console.error('❌ Favorite action failed:', error);
        }
    }

    updateFavoriteButtonStateFromCache(item) {
        const favoriteButton = this.shadowRoot.querySelector('.favorite-button');
        if (!favoriteButton) return;
        
        const isFav = this.isFavoriteFromCache(item.id);
        favoriteButton.classList.toggle('active', isFav);
    }    
    
    async getEntityLabelsWithFavorite(item, favoriteLabel) {
        const currentLabels = this._hass.states[item.id]?.attributes?.labels || [];
        return [...currentLabels, favoriteLabel];
    }
    
    async getEntityLabelsWithoutFavorite(item, favoriteLabel) {
        const currentLabels = this._hass.states[item.id]?.attributes?.labels || [];
        return currentLabels.filter(label => label !== favoriteLabel);
    }        
    
    async ensureFavoriteLabelExists() {
        try {
            const favoriteLabel = await this.getFavoriteLabel();
            const userName = this._hass.user?.name || 'User';
            
            // Korrekte WebSocket API für Label-Erstellung
            await this._hass.callWS({
                type: 'config/label_registry/create',
                name: `Favoriten ${userName}`,
                icon: 'mdi:heart',
                color: '#ff4757'
            });
            
            console.log('✅ Created favorite label:', favoriteLabel);
        } catch (error) {
            // Label existiert bereits oder anderer Fehler
            console.log('ℹ️ Label creation result:', error.message);
        }
    }
    
    async isFavorite(item) {
        try {
            const favoriteLabel = await this.getFavoriteLabel();
            
            // Hole aktuelle Entity-Registry Daten statt State
            const entityRegistry = await this._hass.callWS({
                type: 'config/entity_registry/get',
                entity_id: item.id
            });
            
            return entityRegistry?.labels?.includes(favoriteLabel) || false;
        } catch (error) {
            console.warn('❌ Could not check favorite status:', error);
            return false;
        }
    }
    
    async updateFavoriteButtonState(item) {
        const favoriteButton = this.shadowRoot.querySelector('.favorite-button');
        if (!favoriteButton) return;
        
        const isFav = await this.isFavorite(item);
        favoriteButton.classList.toggle('active', isFav);
    }

    getFavoriteItemsFromCache() {
        if (!this.favoritesLoaded || !this.allItems) return [];
        
        const favorites = this.allItems.filter(item => 
            this.isFavoriteFromCache(item.id)
        ).map(item => ({
            ...item,
            isFavorite: true
        }));
        
        console.log('💖 Found favorites from cache:', favorites.length);
        return favorites;
    }


    // NEU: Bulk-Loading aller Favoriten
    async loadAllFavorites() {
        if (this.favoritesLoaded) return;
        
        try {
            console.log('🔄 Loading all favorites (bulk)...');
            this.favoriteLabel = await this.getFavoriteLabel();
            
            // Hole ALLE Entity Registry Entries auf einmal
            const allEntities = await this._hass.callWS({
                type: 'config/entity_registry/list'
            });
            
            // Cache alle Favoriten-Status
            this.favoritesCache.clear();
            allEntities.forEach(entity => {
                const isFav = entity.labels?.includes(this.favoriteLabel) || false;
                this.favoritesCache.set(entity.entity_id, isFav);
            });
            
            this.favoritesLoaded = true;
            console.log('✅ Favorites cache loaded:', this.favoritesCache.size, 'entities');
            
        } catch (error) {
            console.error('❌ Failed to load favorites cache:', error);
            this.favoritesLoaded = false;
        }
    }

    // NEU: Favoriten-Status aus Cache
    isFavoriteFromCache(entityId) {
        return this.favoritesCache.get(entityId) || false;
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

        // Heart-Button Event-Listener
        const favoriteButton = this.shadowRoot.querySelector('.favorite-button');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleFavoriteClick(item);
            });
            
            // NEU: Initial Favorite State setzen
            this.updateFavoriteButtonState(item);
        }        

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

        return `
            <div class="detail-left-header">
                <button class="back-button">${newBackButtonSVG}</button>
                <div class="detail-title-area">
                    <h3 class="detail-name">${item.name}</h3>
                    <p class="detail-area">${item.area}</p>
                </div>
                <button class="favorite-button" data-entity-id="${item.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="39px" height="39px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" color="currentColor">
                        <path d="M22 8.86222C22 10.4087 21.4062 11.8941 20.3458 12.9929C17.9049 15.523 15.5374 18.1613 13.0053 20.5997C12.4249 21.1505 11.5042 21.1304 10.9488 20.5547L3.65376 12.9929C1.44875 10.7072 1.44875 7.01723 3.65376 4.73157C5.88044 2.42345 9.50794 2.42345 11.7346 4.73157L11.9998 5.00642L12.2648 4.73173C13.3324 3.6245 14.7864 3 16.3053 3C17.8242 3 19.2781 3.62444 20.3458 4.73157C21.4063 5.83045 22 7.31577 22 8.86222Z"/>
                    </svg>
                </button>
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

        const mobileTabsHTML = `
                <div class="detail-tabs-container mobile-tabs">
                    <div class="detail-tabs">
                        <span class="tab-slider"></span>
                         ${tabsConfig.map(tab => `<a href="#" class="detail-tab ${tab.default ? 'active' : ''}" data-tab="${tab.id}" title="${tab.title}">${tab.svg}</a>`).join('')}
                    </div>
                </div>
            `;        
    
        return `
            ${desktopTabsHTML}
            ${mobileTabsHTML}
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
        return `
            <div class="shortcuts-container">
                <div class="shortcuts-header">
                    <h3>Shortcuts für ${item.name}</h3>
                    <div class="shortcuts-controls">
                        <button class="shortcuts-btn active" data-shortcuts-tab="timer">Timer</button>
                        <button class="shortcuts-btn" data-shortcuts-tab="zeitplan">Zeitplan</button>
                        <button class="shortcuts-btn" data-shortcuts-tab="actions">Aktionen</button>
                    </div>                    
                </div>
                
                <div class="shortcuts-content">            
                    <!-- ✅ TIMER TAB - Nur noch Timer-spezifische Inhalte -->
                    <div class="shortcuts-tab-content active" data-shortcuts-content="timer">
                        <div id="timer-section-${item.id}">
                            <!-- Aktive Timer Anzeige -->
                            <div class="active-timers" id="active-timers-${item.id}">
                                <div class="loading-timers">Lade Timer...</div>
                            </div>
                            
                            <!-- 🚨 HIER DIREKT TIMER-PRESETS - KEIN Timer/Zeitplan Button mehr -->
                            <div class="timer-control-design" id="timer-control-${item.id}">
                                <!-- ✅ Direkt die Action Presets (größeres Design) -->
                                <div class="timer-control-presets timer-action-presets visible" data-is-open="true">
                                    <div class="timer-control-presets-grid">
                                        ${this.getTimerPresetsForDevice(item)}                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <!-- ✅ NEUER ZEITPLAN TAB -->
                    <div class="shortcuts-tab-content" data-shortcuts-content="zeitplan">
                        <div id="schedule-section-${item.id}">
                            <!-- Aktive Zeitpläne Anzeige -->
                            <div class="active-schedules" id="active-schedules-${item.id}">
                                <div class="loading-schedules">Lade Zeitpläne...</div>
                            </div>
                            
                            <!-- Zeitplan Controls -->
                            <div class="schedule-control-design" id="schedule-control-${item.id}">
                                <div class="timer-control-presets schedule-action-presets visible" data-is-open="true">                                
                                    <div class="timer-control-presets-grid">
                                        ${this.getTimerPresetsForDevice(item)}                                    
                                    </div>
                               </div> 
                            </div>
                        </div>
                    </div>
    
                    <!-- ✅ AKTIONEN TAB -->
                    <div class="shortcuts-tab-content" data-shortcuts-content="actions">
                        <p>Aktionen Content - wird implementiert</p>
                    </div>
                </div>
            </div>
        `;
    }

    getTimerPresetsForDevice(item) {
        const domain = item.domain;
        
        switch (domain) {
            case 'light':
                return this.getLightTimerPresets();
            case 'climate':
                return this.getClimateTimerPresets(item);
            case 'media_player':
                return this.getMediaTimerPresets();
            case 'cover':
                return this.getCoverTimerPresets(item);
            case 'switch':
                return this.getSwitchTimerPresets();
            default:
                return this.getLightTimerPresets(); // Fallback
        }
    }    

    getLightTimerPresets() {
        return `
            <button class="timer-control-preset" data-action="turn_off" title="Ausschalten">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color="currentColor">
                    <g fill="currentColor" transform="matrix(1.08766, 0, 0, 1.08766, 1.124148, 2.126626)">
                        <path d="M4.477 5.46a.6.6 0 1 1 .854.842a6.018 6.018 0 0 0-1.731 4.24c0 3.312 2.643 5.992 5.9 5.992c3.257 0 5.9-2.68 5.9-5.992a6.02 6.02 0 0 0-1.731-4.24a.6.6 0 1 1 .854-.842a7.218 7.218 0 0 1 2.077 5.082c0 3.97-3.177 7.192-7.1 7.192c-3.923 0-7.1-3.222-7.1-7.192c0-1.93.756-3.743 2.077-5.082"/>
                        <path d="M8.878 1.25a.6.6 0 0 1 1.2 0v7.085a.6.6 0 0 1-1.2 0z"/>
                        <path d="M1.15 1.878a.514.514 0 0 1 .728-.727l16.971 16.971a.514.514 0 0 1-.727.727z"/>
                    </g>
                </svg>
            </button>
            
            <button class="timer-control-preset" data-action="turn_on" title="Einschalten">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color="currentColor">
                    <path d="M 5.994 8.065 C 6.334 7.696 6.947 7.833 7.097 8.312 C 7.171 8.55 7.104 8.81 6.922 8.981 C 5.712 10.21 5.035 11.867 5.04 13.593 C 5.04 17.195 7.914 20.11 11.457 20.11 C 14.999 20.11 17.874 17.195 17.874 13.593 C 17.879 11.868 17.202 10.21 15.991 8.981 C 15.627 8.636 15.772 8.025 16.254 7.882 C 16.493 7.81 16.751 7.882 16.92 8.065 C 18.372 9.538 19.184 11.525 19.179 13.593 C 19.179 17.911 15.724 21.415 11.457 21.415 C 7.19 21.415 3.735 17.911 3.735 13.593 C 3.735 11.494 4.557 9.522 5.994 8.065" fill="currentColor"/>
                    <path d="M 10.78 3.486 C 10.78 2.984 11.324 2.67 11.759 2.921 C 11.961 3.038 12.086 3.253 12.086 3.486 L 12.086 11.192 C 12.086 11.695 11.542 12.009 11.107 11.757 C 10.905 11.641 10.78 11.425 10.78 11.192 L 10.78 3.486 Z" fill="currentColor"/>
                </svg>
            </button>
            
            <button class="timer-control-preset" data-action="dim_30" title="30% Helligkeit">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" color="currentColor">
                    <path d="M3 11.5066C3 16.7497 7.25034 21 12.4934 21C16.2209 21 19.4466 18.8518 21 15.7259C12.4934 15.7259 8.27411 11.5066 8.27411 3C5.14821 4.55344 3 7.77915 3 11.5066Z"/>
                </svg>
            </button>
            
            <button class="timer-control-preset" data-action="dim_50" title="50% Helligkeit">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" color="currentColor">
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 3v18" />
                    <path d="M12 9l4.65 -4.65" />
                    <path d="M12 14.3l7.37 -7.37" />
                    <path d="M12 19.6l8.85 -8.85" />
                </svg>
            </button>
        `;
    }
    
    getClimateTimerPresets(item) {  // ← item Parameter hinzufügen
        return `
            <button class="timer-control-preset" data-action="turn_off" title="Ausschalten">
                ${this.getLightOffSVG()}
            </button>
            
            <button class="timer-control-preset" data-action="heat_24" title="Heizen auf 24°C">
                ${this.getHvacModeSVG('heat', item)}
            </button>
            
            <button class="timer-control-preset" data-action="cool_22" title="Kühlen auf 22°C">
                ${this.getHvacModeSVG('cool', item)}
            </button>
            
            <button class="timer-control-preset" data-action="dry_mode" title="Entfeuchten">
                ${this.getHvacModeSVG('dry', item)}
            </button>
            
            <button class="timer-control-preset" data-action="fan_only" title="Lüften">
                ${this.getHvacModeSVG('fan_only', item)}
            </button>
        `;
    }

    
    // SVG aus Light Turn-Off Button holen
    getLightOffSVG() {
        const lightHTML = this.getLightTimerPresets();  // ← Das war leer!
        const match = lightHTML.match(/data-action="turn_off"[^>]*>(.*?)<\/button>/s);
        if (match) {
            const svgMatch = match[1].match(/<svg[^>]*>.*?<\/svg>/s);
            return svgMatch ? svgMatch[0] : '';
        }
        return '';
    }
    
    // SVG aus Climate HVAC Mode Buttons holen
    getHvacModeSVG(mode, item) {
        const climateHTML = this.getClimateControlsHTML(item);
        const match = climateHTML.match(new RegExp(`data-hvac-mode="${mode}"[^>]*>(.*?)<\/button>`, 's'));
        if (match) {
            const svgMatch = match[1].match(/<svg[^>]*>.*?<\/svg>/s);
            return svgMatch ? svgMatch[0] : '';
        }
        return '';
    }    

    getMediaTimerPresets() {
        return `
            <button class="timer-control-preset" data-action="turn_off" title="Ausschalten">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M7 13C7.55228 13 8 12.5523 8 12C8 11.4477 7.55228 11 7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13Z"/>
                    <path d="M17 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17Z"/>
                </svg>

            </button>
            <button class="timer-control-preset" data-action="play" title="Abspielen">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>

            </button>
            <button class="timer-control-preset" data-action="pause" title="Pausieren">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>

            </button>
            <button class="timer-control-preset" data-action="volume_down" title="Leiser">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>

            </button>
        `;
    }
    
    getCoverTimerPresets(item) {
        return `
            <button class="timer-control-preset" data-action="open" title="Öffnen">
                ${this.getCoverActionSVG('open', item)}
            </button>
            <button class="timer-control-preset" data-action="close" title="Schließen">
                ${this.getCoverActionSVG('close', item)}
            </button>
            
            <button class="timer-control-preset" data-action="set_position_50" title="50% öffnen">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" color="currentColor">
                    <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"/>
                    <path d="M22 12L23 12"/>
                    <path d="M12 2V1"/>
                    <path d="M12 23V22"/>
                    <path d="M20 20L19 19"/>
                    <path d="M20 4L19 5"/>
                    <path d="M4 20L5 19"/>
                    <path d="M4 4L5 5"/>
                    <path d="M1 12L2 12"/>
                </svg>
            </button>
        `;
    }

    // SVG aus Cover Device Controls holen
    getCoverActionSVG(action, item) {
        const coverHTML = this.getCoverControlsHTML(item);
        let pattern = '';
        
        if (action === 'open') {
            pattern = /data-action="open"[^>]*>(.*?)<\/button>/s;
        } else if (action === 'close') {
            pattern = /data-action="close"[^>]*>(.*?)<\/button>/s;
        }
        
        const match = coverHTML.match(pattern);
        if (match) {
            const svgMatch = match[1].match(/<svg[^>]*>.*?<\/svg>/s);
            return svgMatch ? svgMatch[0] : '';
        }
        return '';
    }
    
    getSwitchTimerPresets() {
        return `
            <button class="timer-control-preset" data-action="turn_off" title="Ausschalten">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M7 13C7.55228 13 8 12.5523 8 12C8 11.4477 7.55228 11 7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13Z"/>
                    <path d="M17 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17Z"/>
                </svg>

            </button>
            <button class="timer-control-preset" data-action="turn_on" title="Einschalten">
                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M17 13C17.5523 13 18 12.5523 18 12C18 11.4477 17.5523 11 17 11C16.4477 11 16 11.4477 16 12C16 12.5523 16.4477 13 17 13Z"/>
                    <path d="M17 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17Z"/>
                </svg>

            </button>
        `;
    }








    
    
    // Placeholder Methoden (erstmal mit Dummy-Daten)
    getDeviceTimers(deviceId) {
        // TODO: Echte Timer Discovery implementieren
        return [
            { id: 'timer1', time: '19:00', action: 'turn_on' },
            { id: 'timer2', time: '22:30', action: 'turn_off' }
        ];
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

    setupTimerEventListeners(item) {
        const timerContainer = this.shadowRoot.getElementById(`timer-control-${item.id}`);
        console.log('🎯 Timer Container:', timerContainer);
        
        if (!timerContainer) return;
        
        // Timer Button (wie toggle-colors)
        const timerBtn = timerContainer.querySelector('[data-action="timer"]');
        console.log('🔘 Timer Button:', timerBtn);
        
        if (timerBtn) {
            timerBtn.addEventListener('click', () => {
                console.log('🖱️ Timer Button clicked!');
                console.log('📊 Current data-is-open:', presetsContainer?.getAttribute('data-is-open'));
                
                // Toggle Timer Presets
                const presetsContainer = timerContainer.querySelector('.timer-control-presets.timer-action-presets');
                if (presetsContainer) {
                    const isOpen = presetsContainer.getAttribute('data-is-open') === 'true';
                    presetsContainer.setAttribute('data-is-open', !isOpen);
                    presetsContainer.classList.toggle('visible', !isOpen);
                }
            });
        }
        
        // Zeitplan Toggle - analog zu Timer
        const schedulePresetsContainer = timerContainer.querySelector('.timer-control-presets.schedule-action-presets');
        if (schedulePresetsContainer) {
            const isOpen = schedulePresetsContainer.getAttribute('data-is-open') === 'true';
            schedulePresetsContainer.setAttribute('data-is-open', !isOpen);
            schedulePresetsContainer.classList.toggle('visible', !isOpen);
        }
        
        // ✅ ENTFERNT: Timer Preset Buttons Event Listeners
        // Diese werden jetzt in initializeTimerTab gehandhabt!
        
        // Load existing timers
        this.loadActiveTimers(item.id);  // ← Das war der Fehler!
    }

    getActionLabel(actionString) {
        const actionLabels = {
            // Light
            'turn_off': 'Ausschalten',
            'turn_on': 'Einschalten', 
            'dim_30': 'Dimmen 30%',
            'dim_50': 'Dimmen 50%',
            
            // Climate
            'heat_24': 'Heizen 24°C',
            'cool_22': 'Kühlen 22°C', 
            'dry_mode': 'Entfeuchten',
            'fan_only': 'Lüften',
            
            // Cover
            'open': 'Öffnen',
            'close': 'Schließen',
            'set_position_50': '50% öffnen',
            
            // Generic
            'toggle': 'Umschalten'
        };
        
        return actionLabels[actionString] || actionString || 'Aktion';
    }
 
    closeTimeSelection(container) {        
        const activeTimersSection = container.querySelector('.active-timers');
        const timerControlDesign = container.querySelector('.timer-control-design');
        
        // 1. Time Selection ausblenden
        if (timeSelectionContainer) {
            timeSelectionContainer.animate([
                { maxHeight: '300px', opacity: 1 },
                { maxHeight: '0px', opacity: 0 }
            ], {
                duration: 300,
                fill: 'forwards',
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }).finished.then(() => {
                timeSelectionContainer.remove();
            });
        }
        
        // 2. Timer Control zurück nach unten
        if (timerControlDesign) {
            timerControlDesign.animate([
                { transform: 'translateY(-60px)' },
                { transform: 'translateY(0)' }
            ], {
                duration: 400,
                fill: 'forwards',
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            });
        }
        
        // 3. Active Timers wieder einblenden
        if (activeTimersSection) {
            setTimeout(() => {
                activeTimersSection.animate([
                    { opacity: 0, transform: 'translateY(-20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], {
                    duration: 400,
                    fill: 'forwards',
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                });
            }, 200);
        }
        
        // Button-States zurücksetzen
        const timerPresets = container.querySelectorAll('.timer-control-preset');
        timerPresets.forEach(p => p.classList.remove('active'));
    }

    resetToInitialTimerState(container) {
        console.log('🔄 Reset to initial timer state (NEW - Simultaneous)');
    

        const activeTimersSection = container.querySelector('.active-timers');
        const timerControlDesign = container.querySelector('.timer-control-design');
    
        // 1. Zeitwahl-Panel ausblenden
        const fadeOutTimeSelection = timeSelectionContainer ? timeSelectionContainer.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-20px)' }
        ], {
            duration: 300,
            fill: 'forwards',
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }).finished : Promise.resolve();
    
        fadeOutTimeSelection.then(() => {
            if (timeSelectionContainer) {
                timeSelectionContainer.remove();
            }
    
            // 2. Timer-Liste und Steuerung GLEICHZEITIG wieder einblenden
            const fadeInAnimations = [];
    
            if (activeTimersSection) {
                const fadeInTimers = activeTimersSection.animate([
                    { opacity: 0, transform: 'translateY(-20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { 
                    duration: 400, 
                    fill: 'forwards', 
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)' 
                });
                fadeInAnimations.push(fadeInTimers);
            }
    
            if (timerControlDesign) {
                const fadeInControls = timerControlDesign.animate([
                    { opacity: 0, transform: 'translateY(-20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { 
                    duration: 400, 
                    fill: 'forwards', 
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)' 
                });
                fadeInAnimations.push(fadeInControls);
            }
    
            // 3. Button-States zurücksetzen nach Animations-Ende
            Promise.all(fadeInAnimations.map(anim => anim.finished)).then(() => {
                const timerPresets = container.querySelectorAll('.timer-control-preset');
                timerPresets.forEach(p => p.classList.remove('active'));
                console.log('✅ Reset complete - all elements restored');
            });
        });
    }

    async createActionTimer(item, action, durationMinutes) {
        const future = new Date(Date.now() + durationMinutes * 60 * 1000);
        const timeString = future.toTimeString().slice(0, 5);
        
        // Bestimme Service und Service Data basierend auf Action
        const { service, serviceData } = this.getActionServiceData(item, action);
        
        console.log(`🔧 Service: ${service}, Data:`, serviceData);
        
        await this._hass.callService('scheduler', 'add', {
            timeslots: [{
                start: timeString,
                actions: [{
                    service: service,
                    entity_id: item.id,
                    service_data: serviceData
                }]
            }],
            repeat_type: 'single',
            name: `${item.name} - ${this.getActionLabel(action)} (${durationMinutes}min)`
        });
        
        console.log(`✅ Timer erfolgreich erstellt: ${service} in ${durationMinutes} Minuten`);
    }





    showMinimalTimePicker(item, action, container, isScheduleMode = false, existingTimerData = null) {
    
        const isEditMode = !!existingTimerData;
        console.log(`🎯 Zeige Minimal Time Picker für ${action}, Schedule Mode: ${isScheduleMode}, Edit Mode: ${isEditMode}`);
        
        // State variables
        let initialHours = isScheduleMode ? 18 : 0;
        let initialMinutes = isScheduleMode ? 0 : 30;
        let scheduleId = null;
        
        if (isEditMode) {
            const totalMinutes = existingTimerData.duration;
            initialHours = Math.floor(totalMinutes / 60);
            initialMinutes = totalMinutes % 60;
            scheduleId = existingTimerData.schedule_id;
        }
        
        this.timePickerState = {
            selectedHours: initialHours,
            selectedMinutes: initialMinutes,
            isScheduleMode: isScheduleMode,
            scheduleId: scheduleId,
            hoverHours: false,
            hoverMinutes: false
        };
        
        // Container erstellen oder finden
        let timePickerContainer = container.querySelector('.minimal-time-picker');
        if (!timePickerContainer) {
            timePickerContainer = document.createElement('div');
            timePickerContainer.className = 'minimal-time-picker';
            container.insertBefore(timePickerContainer, container.firstChild);
        }
        
        // HTML erstellen
        timePickerContainer.innerHTML = `
            <div class="mtp-display-container">
                <div class="mtp-controls">
                    <!-- Stunden -->
                    <div class="mtp-unit" data-unit="hours">
                        <div class="mtp-value">${this.timePickerState.selectedHours.toString().padStart(2, '0')}</div>
                    </div>
                    
                    <!-- Separator -->
                    <div class="mtp-separator">:</div>
                    
                    <!-- Minuten -->
                    <div class="mtp-unit" data-unit="minutes">
                        <div class="mtp-value">${this.timePickerState.selectedMinutes.toString().padStart(2, '0')}</div>
                    </div>
                    
                    <!-- Kalender Button (nur bei Schedule Mode) -->
                    ${isScheduleMode ? `
                        <button class="mtp-calendar-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="mtp-actions">
                <button class="mtp-action-btn mtp-cancel">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <button class="mtp-action-btn mtp-create">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                </button>
            </div>
        `;
        
        // Event Listeners einrichten
        this.setupMinimalTimePickerEvents(item, action, timePickerContainer);
    }

    setupMinimalTimePickerEvents(item, action, container) {
        console.log('🎯 Setup Minimal Time Picker Events');
        
        // Stunden und Minuten Units
        const hoursUnit = container.querySelector('[data-unit="hours"]');
        const minutesUnit = container.querySelector('[data-unit="minutes"]');
        const cancelBtn = container.querySelector('.mtp-cancel');
        const createBtn = container.querySelector('.mtp-create');
        
        // Hover Events für Stunden
        hoursUnit.addEventListener('mouseenter', () => {
            this.showChevrons(hoursUnit, 'hours');
        });
        
        hoursUnit.addEventListener('mouseleave', () => {
            this.hideChevrons(hoursUnit);
        });
        
        // Hover Events für Minuten
        minutesUnit.addEventListener('mouseenter', () => {
            this.showChevrons(minutesUnit, 'minutes');
        });
        
        minutesUnit.addEventListener('mouseleave', () => {
            this.hideChevrons(minutesUnit);
        });
        
        // Cancel Button
        cancelBtn.addEventListener('click', () => {
            this.closeMinimalTimePicker(container.closest('.shortcuts-tab-content'));
        });
        
        // Create Button
        createBtn.addEventListener('click', () => {
            if (this.timePickerState && this.timePickerState.isScheduleMode) {
                this.createScheduleFromMinimalPicker(item, action);
            } else {
                this.createTimerFromMinimalPicker(item, action);
            }
        });

        // Kalender Button (nur im Schedule Mode)
        const calendarBtn = container.querySelector('.mtp-calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                this.showDayPicker(container);
            });
        }        
    }

    async createScheduleFromMinimalPicker(item, action) {
        console.log('📅 Erstelle Zeitplan vom Minimal Picker');
        
        // Prüfe ob Wochentage ausgewählt wurden
        if (!this.dayPickerState || (!this.dayPickerState.daySelection && this.dayPickerState.selectedDays.length === 0)) {
            console.warn('⚠️ Keine Wochentage ausgewählt');
            alert('Bitte wähle zuerst Wochentage aus');
            return;
        }
        
        // Konvertiere zu weekdays Array
        let weekdays = [];
        if (this.dayPickerState.daySelection) {
            switch (this.dayPickerState.daySelection) {
                case 'daily':
                    weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                    break;
                case 'workday':
                    weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
                    break;
                case 'weekend':
                    weekdays = ['sat', 'sun'];
                    break;
            }
        } else {
            weekdays = this.dayPickerState.selectedDays;
        }
        
        const hours = this.timePickerState.selectedHours;
        const minutes = this.timePickerState.selectedMinutes;
        
        console.log(`🎯 Erstelle Zeitplan: ${action} um ${hours}:${minutes.toString().padStart(2, '0')} an [${weekdays.join(', ')}]`);
        
        try {
            // Service und Service Data basierend auf Action bestimmen
            const serviceCall = this.getServiceCallForAction(action);
            
            // Zeit formatieren
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            // Scheduler Service Call
            await this._hass.callService('scheduler', 'add', {
                weekdays: weekdays,
                timeslots: [{
                    start: timeString,
                    actions: [{
                        entity_id: item.id,
                        service: serviceCall.service,
                        service_data: serviceCall.service_data || {}
                    }]
                }],
                name: `${item.name} ${this.getActionLabel(action)} ${weekdays.join('+')} ${timeString}`,
                repeat_type: 'repeat'
            });
    
            console.log('✅ Zeitplan erfolgreich erstellt');
            
            // Schließe den Picker
            const parentContainer = this.shadowRoot.querySelector('.minimal-time-picker').closest('.shortcuts-tab-content');
            this.closeMinimalTimePicker(parentContainer);
            
            // Lade Zeitpläne neu
            setTimeout(() => {
                this.loadActiveSchedules(item.id);
            }, 500);
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Zeitplans:', error);
            alert('Fehler beim Erstellen des Zeitplans');
        }
    }    
    
    showDayPicker(container) {
        console.log('📅 Zeige Day Picker');
        
        // Initialize day picker state
        this.dayPickerState = {
            showIndividualDays: false,
            daySelection: '',
            selectedDays: []
        };
        
        const displayContainer = container.querySelector('.mtp-display-container');
        
        // Ersetze Zeit-Anzeige mit Day Picker
        displayContainer.innerHTML = `
            <div class="mtp-day-picker">
                <div class="mtp-day-controls">
                    <div class="mtp-chips-container">
                        <button class="mtp-chip" data-preset="daily">Täglich</button>
                        <button class="mtp-chip" data-preset="workday">Werktags</button>
                        <button class="mtp-chip" data-preset="weekend">Wochenende</button>
                        <button class="mtp-chip" data-preset="individual">Individuell</button>
                    </div>
                    <button class="mtp-ok-btn">OK</button>
                </div>
            </div>
        `;
        
        this.setupDayPickerEvents(container);
    }

    setupDayPickerEvents(container) {
        console.log('📅 Setup Day Picker Events');
        
        const presetChips = container.querySelectorAll('[data-preset]');
        const okBtn = container.querySelector('.mtp-ok-btn');
        
        // Preset Chips Event Listeners
        presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const preset = chip.dataset.preset;
                
                if (preset === 'individual') {
                    this.showIndividualDayChips(container);
                } else {
                    // Standard Presets
                    presetChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    
                    this.dayPickerState.daySelection = preset;
                    this.dayPickerState.selectedDays = [];
                    this.dayPickerState.showIndividualDays = false;
                }
            });
        });
        
        // OK Button
        okBtn.addEventListener('click', () => {
            this.closeDayPicker(container);
        });
    }
    
    showIndividualDayChips(container) {
        console.log('📅 Zeige individuelle Wochentage');
        
        const chipsContainer = container.querySelector('.mtp-chips-container');
        const weekdays = [
            { key: 'mon', label: 'Mo' },
            { key: 'tue', label: 'Di' },
            { key: 'wed', label: 'Mi' },
            { key: 'thu', label: 'Do' },
            { key: 'fri', label: 'Fr' },
            { key: 'sat', label: 'Sa' },
            { key: 'sun', label: 'So' }
        ];
        
        chipsContainer.innerHTML = weekdays.map(day => 
            `<button class="mtp-weekday-chip" data-day="${day.key}">${day.label}</button>`
        ).join('');
        
        this.dayPickerState.showIndividualDays = true;
        this.dayPickerState.daySelection = '';
        
        // Event Listeners für Wochentag-Chips
        const weekdayChips = chipsContainer.querySelectorAll('.mtp-weekday-chip');
        weekdayChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const day = chip.dataset.day;
                
                if (this.dayPickerState.selectedDays.includes(day)) {
                    // Entfernen
                    this.dayPickerState.selectedDays = this.dayPickerState.selectedDays.filter(d => d !== day);
                    chip.classList.remove('active');
                } else {
                    // Hinzufügen
                    this.dayPickerState.selectedDays.push(day);
                    chip.classList.add('active');
                }
            });
        });
    }    
 
    closeDayPicker(container) {
        console.log('📅 Schließe Day Picker');
        
        const displayContainer = container.querySelector('.mtp-display-container');
        
        // Erstelle Day Selection Display Text
        let selectionText = '';
        if (this.dayPickerState.daySelection) {
            const labels = {
                'daily': 'Täglich',
                'workday': 'Werktags', 
                'weekend': 'Wochenende'
            };
            selectionText = labels[this.dayPickerState.daySelection];
        } else if (this.dayPickerState.selectedDays.length > 0) {
            const dayLabels = {
                'mon': 'Mo', 'tue': 'Di', 'wed': 'Mi', 'thu': 'Do',
                'fri': 'Fr', 'sat': 'Sa', 'sun': 'So'
            };
            selectionText = this.dayPickerState.selectedDays.map(day => dayLabels[day]).join(', ');
        }
        
        // Zurück zur Zeit-Anzeige mit Day Selection
        displayContainer.innerHTML = `
            <div class="mtp-controls">
                <!-- Stunden -->
                <div class="mtp-unit" data-unit="hours">
                    <div class="mtp-value">${this.timePickerState.selectedHours.toString().padStart(2, '0')}</div>
                </div>
                
                <!-- Separator -->
                <div class="mtp-separator">:</div>
                
                <!-- Minuten -->
                <div class="mtp-unit" data-unit="minutes">
                    <div class="mtp-value">${this.timePickerState.selectedMinutes.toString().padStart(2, '0')}</div>
                </div>
                
                <!-- Day Selection Display -->
                ${selectionText ? `
                    <div class="mtp-calendar-btn" style="background: #dbeafe; color: #1e40af; border-radius: 25px; padding: 8px 12px; margin-left: 16px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        ${selectionText}
                    </div>
                ` : `
                    <button class="mtp-calendar-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </button>
                `}
            </div>
        `;
        
        // Events neu einrichten
        this.setupTimeControlEvents(container);
        
        // Kalender Button Event (falls noch normal)
        const calendarBtn = container.querySelector('.mtp-calendar-btn');
        if (calendarBtn && !selectionText) {
            calendarBtn.addEventListener('click', () => {
                this.showDayPicker(container);
            });
        } else if (calendarBtn && selectionText) {
            calendarBtn.addEventListener('click', () => {
                this.showDayPicker(container);
            });
        }
    }
    
    setupTimeControlEvents(container) {
        // Stunden und Minuten Units
        const hoursUnit = container.querySelector('[data-unit="hours"]');
        const minutesUnit = container.querySelector('[data-unit="minutes"]');
        
        if (hoursUnit) {
            hoursUnit.addEventListener('mouseenter', () => {
                this.showChevrons(hoursUnit, 'hours');
            });
            
            hoursUnit.addEventListener('mouseleave', () => {
                this.hideChevrons(hoursUnit);
            });
        }
        
        if (minutesUnit) {
            minutesUnit.addEventListener('mouseenter', () => {
                this.showChevrons(minutesUnit, 'minutes');
            });
            
            minutesUnit.addEventListener('mouseleave', () => {
                this.hideChevrons(minutesUnit);
            });
        }
    }


    
    
    showChevrons(unitElement, type) {
        // Entferne existierende Chevrons
        this.hideChevrons(unitElement);
        
        // Up Chevron
        const upChevron = document.createElement('button');
        upChevron.className = 'mtp-chevron mtp-chevron-up';
        upChevron.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18,15 12,9 6,15"></polyline>
            </svg>
        `;
        upChevron.addEventListener('click', () => this.adjustTime(type, 1));
        
        // Down Chevron
        const downChevron = document.createElement('button');
        downChevron.className = 'mtp-chevron mtp-chevron-down';
        downChevron.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        `;
        downChevron.addEventListener('click', () => this.adjustTime(type, -1));
        
        unitElement.appendChild(upChevron);
        unitElement.appendChild(downChevron);
    }
    
    hideChevrons(unitElement) {
        const chevrons = unitElement.querySelectorAll('.mtp-chevron');
        chevrons.forEach(chevron => chevron.remove());
    }
    
    adjustTime(type, increment) {
        if (type === 'hours') {
            this.timePickerState.selectedHours += increment;
            if (this.timePickerState.selectedHours < 0) this.timePickerState.selectedHours = 23;
            if (this.timePickerState.selectedHours > 23) this.timePickerState.selectedHours = 0;
        } else if (type === 'minutes') {
            this.timePickerState.selectedMinutes += (increment * 15);
            if (this.timePickerState.selectedMinutes < 0) {
                this.timePickerState.selectedMinutes = 45;
                this.adjustTime('hours', -1);
            }
            if (this.timePickerState.selectedMinutes >= 60) {
                this.timePickerState.selectedMinutes = 0;
                this.adjustTime('hours', 1);
            }
        }
        
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        const container = this.shadowRoot.querySelector('.minimal-time-picker');
        if (!container) return;
        
        const hoursDisplay = container.querySelector('[data-unit="hours"] .mtp-value');
        const minutesDisplay = container.querySelector('[data-unit="minutes"] .mtp-value');
        
        if (hoursDisplay) {
            hoursDisplay.textContent = this.timePickerState.selectedHours.toString().padStart(2, '0');
        }
        if (minutesDisplay) {
            minutesDisplay.textContent = this.timePickerState.selectedMinutes.toString().padStart(2, '0');
        }
    }
    
    async createTimerFromMinimalPicker(item, action) {
        const totalMinutes = (this.timePickerState.selectedHours * 60) + this.timePickerState.selectedMinutes;
        
        if (totalMinutes === 0) {
            console.warn('⚠️ Timer kann nicht 0 Minuten haben');
            return;
        }
        
        // Prüfen ob Edit-Modus oder Create-Modus
        if (this.timePickerState.scheduleId) {
            // EDIT-MODUS
            console.log(`💾 Aktualisiere Timer ${this.timePickerState.scheduleId} auf ${totalMinutes} Minuten.`);
            await this.updateActionTimer(this.timePickerState.scheduleId, item, action, totalMinutes);
        } else {
            // CREATE-MODUS (wie bisher)
            console.log(`🎯 Erstelle Timer: ${action} in ${totalMinutes} Minuten`);
            await this.createActionTimer(item, action, totalMinutes);
        }
        
        try {
            // Schließe den Picker
            const parentContainer = this.shadowRoot.querySelector('.minimal-time-picker').closest('.shortcuts-tab-content');
            this.closeMinimalTimePicker(parentContainer);
            
            // Warte kurz und lade dann die Timer-Liste neu
            setTimeout(() => {
                this.loadActiveTimers(item.id);
            }, 500);
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Timers:', error);
        }
    }

    closeMinimalTimePicker(parentContainer) {
        const timePickerContainer = parentContainer.querySelector('.minimal-time-picker');
        if (timePickerContainer) {
            timePickerContainer.remove();
        }
        
        // Reset state
        this.timePickerState = null;
        
        // Zeige normale Timer-Controls wieder
        const timerControls = parentContainer.querySelector('.timer-control-design');
        const activeTimers = parentContainer.querySelector('.active-timers');
        const scheduleControls = parentContainer.querySelector('.schedule-control-design');
        const activeSchedules = parentContainer.querySelector('.active-schedules');
        
        if (timerControls) timerControls.style.display = '';
        if (activeTimers) activeTimers.style.display = '';  // ← Das war falsch!
        if (scheduleControls) scheduleControls.style.display = '';
        if (activeSchedules) activeSchedules.style.display = '';
        
        // Reset alle preset buttons
        const allPresets = parentContainer.querySelectorAll('.timer-control-preset');
        allPresets.forEach(p => p.classList.remove('active'));
        
        // Lade aktive Timer neu
        const entityId = parentContainer.closest('[data-entity-id]')?.dataset.entityId;
        if (entityId) {
            this.loadActiveTimers(entityId);
        }
        
        console.log('✅ Minimal Time Picker geschlossen');
    }      
    





    
    getActionServiceData(item, action) {
        const domain = item.domain;
        
        switch (domain) {
            case 'light':
                return this.getLightActionData(action);
            case 'climate':
                return this.getClimateActionData(action);
            case 'media_player':
                return this.getMediaActionData(action);
            case 'cover':
                return this.getCoverActionData(action);
            default:
                return this.getGenericActionData(domain, action);
        }
    }
    
    getLightActionData(action) {
        switch (action) {
            case 'turn_on':
                return { service: 'light.turn_on', serviceData: {} };
            case 'turn_off':
                return { service: 'light.turn_off', serviceData: {} };
            case 'dim_30':
                // 30% mit scale_factor 2.55: 30 * 2.55 = 76.5 ≈ 77
                return { service: 'light.turn_on', serviceData: { brightness: 77 } };
            case 'dim_50':
                // 50% mit scale_factor 2.55: 50 * 2.55 = 127.5 ≈ 128  
                return { service: 'light.turn_on', serviceData: { brightness: 128 } };
            default:
                return { service: 'light.turn_on', serviceData: {} };
        }
    }
    
    getClimateActionData(action) {
        switch (action) {
            case 'turn_off':
                return { service: 'climate.turn_off', serviceData: {} };
            case 'heat_24':
                return { 
                    service: 'climate.set_temperature', 
                    serviceData: { 
                        hvac_mode: 'heat',
                        temperature: 24 
                    } 
                };
            case 'cool_22':
                return { 
                    service: 'climate.set_temperature', 
                    serviceData: { 
                        hvac_mode: 'cool',
                        temperature: 22 
                    } 
                };
            case 'dry_mode':
                return { 
                    service: 'climate.set_hvac_mode', 
                    serviceData: { hvac_mode: 'dry' } 
                };
            case 'fan_only':
                return { 
                    service: 'climate.set_hvac_mode', 
                    serviceData: { hvac_mode: 'fan_only' } 
                };
            default:
                return { service: 'climate.turn_off', serviceData: {} };
        }
    }

    getCoverActionData(action) {
        switch (action) {
            case 'open':
                return { service: 'cover.open_cover', serviceData: {} };
            case 'close':
                return { service: 'cover.close_cover', serviceData: {} };
            case 'set_position_50':
                return { 
                    service: 'cover.set_cover_position', 
                    serviceData: { position: 50 } 
                };
            default:
                return { service: 'cover.close_cover', serviceData: {} };
        }
    }
    
    getMediaActionData(action) {
        switch (action) {
            case 'play':
                return { service: 'media_player.media_play', serviceData: {} };
            case 'pause':
                return { service: 'media_player.media_pause', serviceData: {} };
            case 'turn_off':
                return { service: 'media_player.turn_off', serviceData: {} };
            default:
                return { service: 'media_player.turn_off', serviceData: {} };
        }
    }
    
    getGenericActionData(domain, action) {
        switch (action) {
            case 'turn_on':
                return { service: `${domain}.turn_on`, serviceData: {} };
            case 'turn_off':
                return { service: `${domain}.turn_off`, serviceData: {} };
            default:
                return { service: `${domain}.turn_off`, serviceData: {} };
        }
    }
        
    animateTimerButtonSelection(selectedBtn, allButtons) {
        // Remove active from all buttons with animation
        allButtons.forEach(btn => {
            if (btn !== selectedBtn && btn.classList.contains('active')) {
                btn.animate([
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0.95)', opacity: 0.7 },
                    { transform: 'scale(1)', opacity: 1 }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                });
                btn.classList.remove('active');
            }
        });
        
        // Animate selected button
        selectedBtn.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
        
        selectedBtn.classList.add('active');
    }
    
    showTimerModal(item, timerType) {
        const modal = this.shadowRoot.getElementById(`timer-modal-${item.id}`);
        const content = this.shadowRoot.getElementById(`timer-modal-content-${item.id}`);
        
        // Update modal title
        const title = modal.querySelector('.timer-modal-title');
        title.textContent = timerType === 'timer' ? 'Timer erstellen' : 'Zeitplan erstellen';
        
        // Load appropriate content
        content.innerHTML = '<div style="text-align: center; padding: 40px;">Lade...</div>';
        
        // Show modal with animation
        modal.style.display = 'flex';
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
        
        // Load content after animation starts
        setTimeout(() => {
            this.loadTimerModalContent(item, timerType, content);
        }, 100);
        
        // Setup modal close handlers
        this.setupModalCloseHandlers(modal, item.id);
    }

    setupModalCloseHandlers(modal, itemId) {
        const backBtn = modal.querySelector('.timer-back-btn');
        const closeBtn = modal.querySelector('.timer-close-btn');
        const overlay = modal;
        
        // Back Button
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTimerModal(modal);
            });
        }
        
        // Close Button  
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTimerModal(modal);
            });
        }
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeTimerModal(modal);
            }
        });
        
        // ESC key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeTimerModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    closeTimerModal(modal) {
        // Animate out
        modal.animate([
            { opacity: 1, backdropFilter: 'blur(10px)' },
            { opacity: 0, backdropFilter: 'blur(0px)' }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });
        
        const modalContent = modal.querySelector('.timer-modal');
        modalContent.animate([
            { transform: 'scale(1) translateY(0)', opacity: 1 },
            { transform: 'scale(0.9) translateY(20px)', opacity: 0 }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });
        
        // Hide after animation
        setTimeout(() => {
            modal.classList.remove('visible');
            modal.style.display = 'none';
        }, 300);
    }
    
    loadTimerModalContent(item, timerType, container) {
        if (timerType === 'timer') {
            this.loadTimerContent(item, container);
        } else {
            this.loadScheduleContent(item, container);
        }
    }
    
    loadTimerContent(item, container) {
        // Step 1: Device Actions Selection
        const actions = this.getDeviceActions(item);
        
        const actionsHTML = actions.map(action => `
            <button class="device-action-btn" data-action="${action.id}">
                <div class="action-icon">${action.icon}</div>
                <div class="action-text">${action.name}</div>
            </button>
        `).join('');
        
        container.innerHTML = `
            <div class="timer-step" data-step="actions">
                <div class="step-title">Was soll passieren?</div>
                <div class="device-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
        
        // Animate in
        const actionBtns = container.querySelectorAll('.device-action-btn');
        actionBtns.forEach((btn, index) => {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px) scale(0.9)';
            
            setTimeout(() => {
                btn.animate([
                    { opacity: 0, transform: 'translateY(20px) scale(0.9)' },
                    { opacity: 1, transform: 'translateY(0) scale(1)' }
                ], {
                    duration: 300,
                    delay: index * 50,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards'
                });
            }, 100);
        });
        
        // Event listeners für Action Buttons
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleActionSelection(item, btn.dataset.action, container);
            });
        });
    }
    
    loadScheduleContent(item, container) {
        container.innerHTML = `
            <div class="timer-step" data-step="schedule">
                <div class="step-title">Zeitplan erstellen</div>
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    Zeitplan-Feature kommt bald...
                </div>
            </div>
        `;
    }
    
    getDeviceActions(item) {
        const actionsMap = {
            'light': [
                { id: 'turn_on', icon: '💡', name: 'Einschalten' },
                { id: 'turn_off', icon: '🔴', name: 'Ausschalten' },
                { id: 'dim_30', icon: '🌙', name: 'Dimmen auf 30%' },
                { id: 'dim_50', icon: '🌗', name: 'Dimmen auf 50%' }
            ],
            'climate': [
                { id: 'heat_22', icon: '🔥', name: 'Heizen auf 22°C' },
                { id: 'cool_18', icon: '❄️', name: 'Kühlen auf 18°C' },
                { id: 'turn_off', icon: '🔴', name: 'Ausschalten' }
            ],
            'media_player': [
                { id: 'play', icon: '▶️', name: 'Abspielen' },
                { id: 'pause', icon: '⏸️', name: 'Pausieren' },
                { id: 'turn_off', icon: '🔴', name: 'Ausschalten' }
            ]
        };
        
        return actionsMap[item.domain] || [
            { id: 'turn_on', icon: '🟢', name: 'Einschalten' },
            { id: 'turn_off', icon: '🔴', name: 'Ausschalten' }
        ];
    }
    
    handleActionSelection(item, actionId, container) {
        console.log(`Action selected: ${actionId} for ${item.name}`);
        
        // TODO: Next step - Time selection
        container.innerHTML = `
            <div class="timer-step" data-step="timing">
                <div class="step-title">Wann soll "${actionId}" ausgeführt werden?</div>
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    Time Picker kommt als nächstes...
                </div>
            </div>
        `;
    }    
        
    updateTimerModeHints(mode) {
        const hints = this.shadowRoot.querySelectorAll('.timer-mode-hint');
        hints.forEach(hint => {
            hint.textContent = mode === 'duration' ? 'Ein + Aus' : 'Nur Aus';
        });
    }    

    async createQuickTimer(item, durationMinutes, mode = 'duration') {
        console.log(`🎯 Erstelle ${mode} Timer für ${item.name}: ${durationMinutes} Minuten`);
        
        try {
            if (mode === 'duration') {
                await this.createDurationTimer(item, durationMinutes);
            } else {
                await this.createOffOnlyTimer(item, durationMinutes);
            }
            
            console.log('✅ Timer erfolgreich erstellt!');
            this.showTimerSuccess(item, durationMinutes, mode);
            
            // Refresh timer list
            setTimeout(() => {
                this.loadActiveTimers(item.id); // ← KORRIGIERT
            }, 500);
            
        } catch (error) {
            console.error('❌ Timer Fehler:', error);
            this.showTimerError(error);
        }
    }
    
    async createDurationTimer(item, durationMinutes) {
        const now = new Date();
        const future = new Date(now.getTime() + durationMinutes * 60 * 1000);
        
        console.log(`💡 Dauer-Timer: Ein um ${now.toTimeString().slice(0, 5)}, Aus um ${future.toTimeString().slice(0, 5)}`);
        
        // 1. Sofort einschalten
        await this._hass.callService('scheduler', 'add', {
            timeslots: [{
                start: now.toTimeString().slice(0, 5),
                actions: [{ 
                    service: 'light.turn_on', 
                    entity_id: item.id 
                }]
            }],
            repeat_type: 'single',
            name: `${item.name} Timer ON`
        });
        
        // 2. Nach Zeit ausschalten
        await this._hass.callService('scheduler', 'add', {
            timeslots: [{
                start: future.toTimeString().slice(0, 5),
                actions: [{ 
                    service: 'light.turn_off', 
                    entity_id: item.id 
                }]
            }],
            repeat_type: 'single',
            name: `${item.name} Timer OFF (${durationMinutes}min)`
        });
    }
    
    async createOffOnlyTimer(item, durationMinutes) {
        const future = new Date(Date.now() + durationMinutes * 60 * 1000);
        
        console.log(`🔴 Ausschalt-Timer: Aus um ${future.toTimeString().slice(0, 5)}`);
        
        await this._hass.callService('scheduler', 'add', {
            timeslots: [{
                start: future.toTimeString().slice(0, 5),
                actions: [{ 
                    service: 'light.turn_off', 
                    entity_id: item.id 
                }]
            }],
            repeat_type: 'single',
            name: `${item.name} Ausschalt-Timer (${durationMinutes}min)`
        });
    }
    
    showTimerSuccess(item, duration, mode) {
        const message = mode === 'duration' 
            ? `Timer für ${item.name}: ${duration}min Ein+Aus`
            : `Ausschalt-Timer für ${item.name}: ${duration}min`;
        
        console.log(`✅ ${message}`);
        // TODO: Toast Notification (später)
    }
    
    showTimerError(error) {
        console.error('❌ Timer Fehler:', error);
        // TODO: Error Toast (später)
    }
    
    async loadActiveTimers(entityId) {
        const container = this.shadowRoot.getElementById(`active-timers-${entityId}`);
        if (!container) return;
        
        container.innerHTML = '<div class="loading-timers">Lade Timer...</div>';
        
        try {
            // KORRIGIERT: Verwende die richtige API
            const allSchedules = await this._hass.callWS({
                type: 'scheduler'  // ← Das war der Fehler!
            });
            
            console.log('📋 Alle Scheduler Items (korrekte API):', allSchedules);
            
            // Filter für diese Entity UND nur echte Timer (keine Wochentage)
            const entityTimers = allSchedules.filter(schedule => {
                // Prüfe ob diese Entity in den timeslots/actions vorkommt
                const belongsToEntity = schedule.timeslots && schedule.timeslots.some(slot => 
                    slot.actions && slot.actions.some(action => action.entity_id === entityId)
                );            

                // Timer = einmalige Ausführung (erkennt man am Namen oder fehlendem repeat_type)
                const isTimer = !schedule.weekdays || 
                                schedule.weekdays.length === 0 || 
                                (schedule.name && schedule.name.includes('min)')) ||  // Timer haben oft "(30min)" im Namen
                                schedule.repeat_type === 'once' ||
                                !schedule.repeat_type;                

                // DEBUG: Zeige alle relevanten Schedules
                if (belongsToEntity) {
                    console.log(`🔍 TIMER DEBUG - Schedule: ${schedule.name}, weekdays: ${JSON.stringify(schedule.weekdays)}, isTimer: ${isTimer}`);
                }
                
                return belongsToEntity && isTimer;
            });
            
            console.log(`🎯 Timer für ${entityId}:`, entityTimers);
            
            this.renderActiveTimers(entityTimers, entityId);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Timer:', error);
            container.innerHTML = '<div class="loading-timers">Fehler beim Laden der Timer</div>';
        }
    }




    


    renderActiveTimers(timers, entityId) {
            const container = this.shadowRoot.getElementById(`active-timers-${entityId}`);
            if (!container) return;
            
            if (!timers || timers.length === 0) {
                container.innerHTML = '<div class="no-timers">Keine aktiven Timer</div>';
                return;
            }
            
            // Timer nach nächster Ausführung sortieren
            const sortedTimers = timers.sort((a, b) => {
                const nextA = this.getNextExecution(a);
                const nextB = this.getNextExecution(b);
                return nextA - nextB;
            });
            
            const timerHTML = sortedTimers.map(timer => {
                const nextExecution = this.getNextExecution(timer);
                const timeUntil = this.formatTimeUntil(nextExecution);
                const action = this.getTimerAction(timer);
                
                // Timer Icon basierend auf Action
                const timerIcon = this.getPresetIconForAction(action);
                


                // Bestimme Action-Type für CSS-Styling
                let actionType = 'default';
                if (action.includes('Einschalten') || action.includes('Ein')) {
                    actionType = 'turn_on';
                } else if (action.includes('Ausschalten') || action.includes('Aus')) {
                    actionType = 'turn_off';
                } else if (action.includes('30%')) {
                    actionType = 'dim_30';
                } else if (action.includes('50%')) {
                    actionType = 'dim_50';
                } else if (action.includes('Heizen')) {
                    actionType = 'heat';
                } else if (action.includes('Kühlen')) {
                    actionType = 'cool';
                } else if (action.includes('Entfeuchten')) {
                    actionType = 'dry';          // ← NEU
                } else if (action.includes('Lüften')) {
                    actionType = 'fan';          // ← NEU
                } else if (action.includes('Play') || action.includes('Abspielen')) {
                    actionType = 'play';
                } else if (action.includes('Pause')) {
                    actionType = 'pause';
                } else if (action.includes('Öffnen') && !action.includes('%')) {
                    actionType = 'cover_open';
                } else if (action.includes('Schließen')) {
                    actionType = 'cover_close';
                } else if (action.includes('50%')) {
                    actionType = 'cover_50';         // ← Nur noch 50%, nicht mehr 25% und 75%
                }
                


                return `
                    <div class="active-timer-item timer-item" data-timer-id="${timer.schedule_id}" data-action-type="${actionType}">
                       <div class="timer-icon-container">
                           ${timerIcon}
                       </div>
                       <div class="timer-content-area">
                           <div class="timer-item-title">
                               ${timer.name}
                           </div>
                           <div class="timer-meta-badges">
                               <span class="timer-type-badge">${action}</span>
                               <span class="timer-time-badge">${timeUntil}</span>
                           </div>
                       </div>




                       
                       <div class="timer-action-buttons">
                           <button class="timer-edit" data-timer-id="${timer.schedule_id}" title="Timer bearbeiten">
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                   <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                   <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                               </svg>
                           </button>
                           
                           <button class="timer-delete" data-timer-id="${timer.schedule_id}" title="Timer löschen">
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                   <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                   <path d="M4 7l16 0" />
                                   <path d="M10 11l0 6" />
                                   <path d="M14 11l0 6" />
                                   <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                                   <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                               </svg>
                           </button>
                       </div>
                   </div>
                `;

            }).join('');  // ← HINZUFÜGEN!                
    
            container.innerHTML = `
                <div class="active-timers-grid">
                    ${timerHTML}
                </div>
            `;
            
            // Event Listeners für Edit Buttons
            container.querySelectorAll('.timer-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const timerId = btn.dataset.timerId;
                    this.handleEditTimerClick(timerId, entityId);
                });
            });        
    
            // Event Listeners für Delete Buttons
            container.querySelectorAll('.timer-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const timerId = btn.dataset.timerId;
                    this.deleteTimer(timerId, entityId);
                });
            });       

            // Event Listeners für Timer Item Click (Edit-Modus)
            container.querySelectorAll('.timer-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Verhindere Edit wenn auf Edit/Delete Buttons geklickt wurde
                    if (e.target.closest('.timer-edit') || e.target.closest('.timer-delete')) {
                        return;
                    }
                    
                    const timerId = item.dataset.timerId || item.querySelector('.timer-edit')?.dataset.timerId;
                    if (timerId) {
                        this.handleEditTimerClick(timerId, entityId);
                    }
                });
            });       
    
            // Entrance-Animationen mit Web Animations API (wie bei Actions)
            const timerItems = container.querySelectorAll('.timer-item');
            timerItems.forEach((item, index) => {
                // Initial state
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                // Animate in mit gestaffeltem Delay
                setTimeout(() => {
                    item.animate([
                        { opacity: 0, transform: 'translateY(20px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ], {
                        duration: 300,
                        delay: index * 50,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        fill: 'forwards'
                    });
                }, 50);
            });
        }

    getPresetIconForAction(action) {
        console.log('🔍 DEBUG - Action eingegangen:', action);
        console.log('🔍 DEBUG - Action Type:', typeof action);
        
        let presetHTML = '';
        let match = null;
        
        // Light Actions
        if (action.includes('Einschalten') || action.includes('Ein')) {
            console.log('🔍 Einschalten erkannt');
            presetHTML = this.getLightTimerPresets();  // ← Das war leer!
            match = presetHTML.match(/data-action="turn_on"[^>]*>(.*?)<\/button>/s);
        } else if (action.includes('Ausschalten') || action.includes('Aus')) {
            console.log('🔍 Ausschalten erkannt');
            presetHTML = this.getLightTimerPresets();  // ← Das war leer!
            match = presetHTML.match(/data-action="turn_off"[^>]*>(.*?)<\/button>/s);
        } else if (action.includes('30%')) {
            console.log('🔍 30% erkannt');
            presetHTML = this.getLightTimerPresets();
            console.log('🔍 PresetHTML Länge:', presetHTML.length);
            match = presetHTML.match(/data-action="dim_30"[^>]*>(.*?)<\/button>/s);
            console.log('🔍 Match gefunden:', !!match);
        } else if (action.includes('50%')) {
            console.log('🔍 50% erkannt');
            presetHTML = this.getLightTimerPresets();
            match = presetHTML.match(/data-action="dim_50"[^>]*>(.*?)<\/button>/s);
            console.log('🔍 Match gefunden:', !!match);
        

        // Climate Actions
        } else if (action.includes('24°C') || action.includes('Heizen')) {
            console.log('🔍 Climate 24°C erkannt');
            console.log('🔍 currentDetailItem:', this.currentDetailItem);
            
            presetHTML = this.getClimateTimerPresets(this.currentDetailItem);
            console.log('🔍 Climate PresetHTML Länge:', presetHTML.length);
            console.log('🔍 Climate PresetHTML enthält heat_24:', presetHTML.includes('data-action="heat_24"'));
            
            match = presetHTML.match(/data-action="heat_24"[^>]*>(.*?)<\/button>/s);
            console.log('🔍 Climate Match gefunden:', !!match);
            if (match) {
                console.log('🔍 Climate Match[1]:', match[1]);
            }
            
        } else if (action.includes('22°C') || action.includes('Kühlen')) {
            presetHTML = this.getClimateTimerPresets(this.currentDetailItem);
            match = presetHTML.match(/data-action="cool_22"[^>]*>(.*?)<\/button>/s);
        } else if (action.includes('Entfeuchten')) {
            presetHTML = this.getClimateTimerPresets(this.currentDetailItem);
            match = presetHTML.match(/data-action="dry_mode"[^>]*>(.*?)<\/button>/s);
        } else if (action.includes('Lüften')) {
            presetHTML = this.getClimateTimerPresets(this.currentDetailItem);
            match = presetHTML.match(/data-action="fan_only"[^>]*>(.*?)<\/button>/s);
        
        // Cover Actions
        } else if (action.includes('Öffnen')) {
            console.log('🔍 Cover Öffnen erkannt');
            console.log('🔍 currentDetailItem:', this.currentDetailItem);
            
            presetHTML = this.getCoverTimerPresets(this.currentDetailItem);
            console.log('🔍 Cover PresetHTML Länge:', presetHTML.length);
            console.log('🔍 Cover PresetHTML enthält open:', presetHTML.includes('data-action="open"'));
            
            match = presetHTML.match(/data-action="open"[^>]*>(.*?)<\/button>/s);
            console.log('🔍 Cover Match gefunden:', !!match);
            if (match) {
                console.log('🔍 Cover Match[1]:', match[1]);
            }
            
        } else if (action.includes('Schließen')) {
            console.log('🔍 Cover Schließen erkannt');
            presetHTML = this.getCoverTimerPresets(this.currentDetailItem);
            match = presetHTML.match(/data-action="close"[^>]*>(.*?)<\/button>/s);
            
        } else if (action.includes('50%')) {
            console.log('🔍 Cover 50% erkannt');
            presetHTML = this.getCoverTimerPresets(this.currentDetailItem);
            match = presetHTML.match(/data-action="set_position_50"[^>]*>(.*?)<\/button>/s);
        }
        
        // SVG extrahieren und anpassen
        if (match) {
            const svgMatch = match[1].match(/<svg[^>]*>.*?<\/svg>/s);
            if (svgMatch) {
                return svgMatch[0]
                    .replace(/width="24"/g, 'width="16"')
                    .replace(/height="24"/g, 'height="16"');
            }
        }
        
        // Fallback
        console.log('🔍 Fallback wird verwendet');
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`;
    }
    
    getNextExecution(timer) {
        // Zuerst prüfen ob next_execution Attribut vorhanden ist
        if (timer.next_execution) {
            return new Date(timer.next_execution);
        }
        
        // Fallback: Aus timeslots berechnen
        if (timer.timeslots && timer.timeslots.length > 0) {
            const timeStr = timer.timeslots[0].start;
            const today = new Date();
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            const nextTime = new Date();
            nextTime.setHours(hours, minutes, 0, 0);
            
            // Wenn Zeit heute schon vorbei, dann morgen
            if (nextTime <= today) {
                nextTime.setDate(nextTime.getDate() + 1);
            }
            
            return nextTime;
        }
        
        return new Date();
    }
    
    formatTimeUntil(futureTime) {
        const now = new Date();
        const diffMs = futureTime - now;
        
        if (diffMs <= 0) return 'Läuft...';
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        
        if (diffHours > 0) {
            const remainingMinutes = diffMinutes % 60;
            return `in ${diffHours}h ${remainingMinutes}min`;
        } else {
            return `in ${diffMinutes}min`;
        }
    }
    
    getTimerAction(timer) {
        if (timer.timeslots && timer.timeslots.length > 0) {
            const firstAction = timer.timeslots[0].actions[0];
            const service = firstAction.service;
            const serviceData = firstAction.service_data;
            
            // Light Actions
            if (service.includes('light.turn_on')) {
                if (serviceData && serviceData.brightness) {
                    const brightness = serviceData.brightness;
                    if (brightness === 77) return 'Dimmen 30%';
                    if (brightness === 128) return 'Dimmen 50%';
                }
                return 'Einschalten';
            }
            if (service.includes('light.turn_off')) return 'Ausschalten';
            
            // Climate Actions - NEU!
            if (service.includes('climate.set_temperature')) {
                if (serviceData && serviceData.hvac_mode && serviceData.temperature) {
                    if (serviceData.hvac_mode === 'heat') return `Heizen ${serviceData.temperature}°C`;
                    if (serviceData.hvac_mode === 'cool') return `Kühlen ${serviceData.temperature}°C`;
                }
                return 'Temperatur setzen';
            }
            if (service.includes('climate.set_hvac_mode')) {
                if (serviceData && serviceData.hvac_mode) {
                    if (serviceData.hvac_mode === 'dry') return 'Entfeuchten';
                    if (serviceData.hvac_mode === 'fan_only') return 'Lüften';
                }
            }
            if (service.includes('climate.turn_off')) return 'Ausschalten';
            
            // Cover Actions - NEU hinzufügen!
            if (service.includes('cover.open_cover')) return 'Öffnen';
            if (service.includes('cover.close_cover')) return 'Schließen';
            if (service.includes('cover.set_cover_position')) {
                if (serviceData && serviceData.position) {
                    if (serviceData.position === 50) return '50% öffnen';
                    return `${serviceData.position}% öffnen`;
                }
                return 'Position setzen';
            }
        }
        return 'Aktion';
    }
            
    
    async deleteTimer(timerId, entityId) {
        console.log(`🗑️ Lösche Timer ${timerId}`);
        
        try {
            // KORREKTUR: Hole die Switch-Entity-ID
            const allSchedules = await this._hass.callWS({ type: 'scheduler' });
            const timerToDelete = allSchedules.find(s => s.schedule_id === timerId);
            
            if (!timerToDelete) {
                alert("Timer nicht gefunden");
                return;
            }
            
            await this._hass.callService('scheduler', 'remove', {
                entity_id: timerToDelete.entity_id  // ← Die Switch-Entity-ID verwenden
            });
            
            console.log(`✅ Timer ${timerId} erfolgreich gelöscht.`);
            setTimeout(() => this.loadActiveTimers(entityId), 300);
            
        } catch (error) {
            console.error('❌ Fehler beim Löschen des Timers:', error);
            alert(`Fehler beim Löschen des Timers:\n\n${error.message}`);
        }
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
                console.log('🗣️ TTS Button geklickt!');
                
                const musicContainer = mediaContainer.querySelector('.device-control-presets.music-assistant-presets');
                const isMusicOpen = musicContainer && musicContainer.getAttribute('data-is-open') === 'true';
                
                if (isMusicOpen) {
                    setTimeout(() => {
                        this.handleExpandableButton(ttsBtn, mediaContainer, '.device-control-presets.tts-presets');
                        
                        setTimeout(() => {
                            const ttsContainer = mediaContainer.querySelector('.device-control-presets.tts-presets');
                            console.log('🔍 TTS Container nach Toggle:', ttsContainer);
                            console.log('🔍 Data is open:', ttsContainer?.getAttribute('data-is-open'));
                            
                            // ✅ GEÄNDERT: data-is-open statt visible class
                            if (ttsContainer && ttsContainer.getAttribute('data-is-open') === 'true') {
                                this.setupTTSEventListeners(item, ttsContainer);
                            }
                        }, 100);
                    }, 400);
                } else {
                    this.handleExpandableButton(ttsBtn, mediaContainer, '.device-control-presets.tts-presets');
                    
                    setTimeout(() => {
                        const ttsContainer = mediaContainer.querySelector('.device-control-presets.tts-presets');
                        console.log('🔍 TTS Container nach Toggle:', ttsContainer);
                        console.log('🔍 Data is open:', ttsContainer?.getAttribute('data-is-open'));
                        
                        // ✅ GEÄNDERT: data-is-open statt visible class  
                        if (ttsContainer && ttsContainer.getAttribute('data-is-open') === 'true') {
                            this.setupTTSEventListeners(item, ttsContainer);
                        }
                    }, 100);
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

    speakTTS(text, entityId) {
        console.log(`🗣️ Speaking via Amazon Polly: "${text}" on ${entityId}`);
        
        try {
            this._hass.callService('tts', 'amazon_polly_say', {
                entity_id: entityId,
                message: text
            });
            
            this.updateTTSButtonState('speaking');
            
        } catch (error) {
            console.error('❌ TTS Amazon Polly failed:', error);
            this.updateTTSButtonState('error');
        }
    }

    updateTTSButtonState(state) {
        // Finde den aktuell aktiven TTS Button
        const activeTTSContainer = this.shadowRoot?.querySelector('.device-control-presets.tts-presets[data-is-open="true"]') ||
                                  document.querySelector('.device-control-presets.tts-presets[data-is-open="true"]');
        
        if (!activeTTSContainer) return;
        
        const speakBtn = activeTTSContainer.querySelector('.tts-speak-btn');
        const btnIcon = speakBtn?.querySelector('.tts-btn-icon');
        const btnText = speakBtn?.querySelector('.tts-btn-text');
        
        if (!speakBtn || !btnIcon || !btnText) return;
        
        switch (state) {
            case 'speaking':
                speakBtn.disabled = true;
                speakBtn.style.background = '#4CAF50'; // Grün
                btnIcon.textContent = '🔊';
                btnText.textContent = 'Spreche...';
                
                // Auto-Reset nach geschätzter Zeit (150 Wörter/min)
                const textarea = activeTTSContainer.querySelector('.tts-textarea');
                if (textarea) {
                    const wordCount = textarea.value.trim().split(/\s+/).length;
                    const estimatedDuration = Math.max(3000, (wordCount / 150) * 60 * 1000); // Min 3 Sekunden
                    
                    setTimeout(() => {
                        this.updateTTSButtonState('ready');
                        
                        // ✅ NEU: Auto-Resume nach TTS
                        const entityId = this.currentDetailItem?.id;
                        if (entityId) {
                            console.log('🎵 Auto-resuming music after TTS:', entityId);
                            setTimeout(() => {
                                this.callMusicAssistantService('media_play', entityId);
                            }, 1000); // 1 Sekunde warten nach TTS Ende
                        }
                    }, estimatedDuration);
                }
                break;
                
            case 'error':
                speakBtn.disabled = false;
                speakBtn.style.background = '#f44336'; // Rot
                btnIcon.textContent = '❌';
                btnText.textContent = 'Fehler - Erneut versuchen';
                
                // Reset nach 3 Sekunden
                setTimeout(() => {
                    this.updateTTSButtonState('ready');
                }, 3000);
                break;
                
            case 'ready':
            default:
                speakBtn.disabled = false;
                speakBtn.style.background = 'var(--accent)'; // Standard Blau
                btnIcon.textContent = '▶️';
                btnText.textContent = 'Sprechen';
                break;
        }
    }

    setupTTSEventListeners(item, container) {
        console.log('🔍 setupTTSEventListeners called for:', item.id);
        console.log('🔍 Container:', container);
        
        const textarea = container.querySelector('.tts-textarea');
        const speakBtn = container.querySelector('.tts-speak-btn');
        const counter = container.querySelector('.tts-counter');
        
        console.log('🔍 Elements found:', {textarea, speakBtn, counter});
        
        if (!textarea || !speakBtn || !counter) {
            console.error('❌ TTS elements not found in container');
            return;
        }
        
        // Verhindere doppelte Event Listener
        if (container.dataset.ttsListenersAttached === 'true') {
            console.log('⚠️ TTS Listeners already attached');
            return;
        }
        container.dataset.ttsListenersAttached = 'true';
        
        console.log('✅ Attaching TTS event listeners...');
        
        // Zeichenzähler Update
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            console.log('📝 Text input:', length, 'chars');
            counter.textContent = `${length}/300`;
            
            if (length > 250) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
            
            speakBtn.disabled = length === 0;
            console.log('🔘 Button disabled:', speakBtn.disabled);
        });
        
        // Sprechen Button
        speakBtn.addEventListener('click', () => {
            console.log('🗣️ Speak button clicked!');
            const text = textarea.value.trim();
            if (text && !speakBtn.disabled) {
                this.speakTTS(text, item.id);
            }
        });
        
        console.log('✅ TTS Event Listeners attached for', item.id);
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
                    ${this.getTTSHTML()}
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

                    // Tab-Content Container finden
                    const tabContainer = this.shadowRoot.querySelector('#tab-content-container');
                    
                    // Alle history-spezifischen Klassen entfernen
                    tabContainer.classList.remove('history-active', 'shortcuts-active');  

                    // Entsprechende Klasse hinzufügen
                    if (targetId === 'history') {
                        tabContainer.classList.add('history-active');
                    } else if (targetId === 'shortcuts') {
                        tabContainer.classList.add('shortcuts-active');
                    }                    
                    
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

        // NEU HINZUFÜGEN: Timer Event Listeners
        this.setupTimerEventListeners(item);        

        // Shortcuts-Buttons Event Listeners (NEU HINZUFÜGEN)
        this.initializeShortcutsEvents(item);     
    }

    initializeShortcutsEvents(item) {
        // ✅ WARTE bis DOM bereit ist
        setTimeout(() => {
            const shortcutsBtns = this.shadowRoot.querySelectorAll('.shortcuts-btn');
            console.log('🎯 Found shortcuts buttons:', shortcutsBtns.length);
            
            shortcutsBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const targetTab = btn.dataset.shortcutsTab;
                    console.log(`🎯 Switching to tab: ${targetTab}`);
                    
                    // Alle Buttons deaktivieren
                    shortcutsBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Alle Contents verstecken
                    const shortcutsContents = this.shadowRoot.querySelectorAll('.shortcuts-tab-content');
                    shortcutsContents.forEach(content => content.classList.remove('active'));
                    
                    // Ziel-Content anzeigen
                    const targetContent = this.shadowRoot.querySelector(`[data-shortcuts-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                        
                        // Tab-spezifische Initialisierung
                        switch(targetTab) {
                            case 'timer':
                                this.initializeTimerTab(item, targetContent);
                                break;
                            case 'zeitplan':
                                this.initializeScheduleTab(item, targetContent);
                                break;
                            case 'actions':
                                this.initializeActionsTab(item, targetContent);
                                break;
                        }
                    }
                });
            });
            
            // Initial Timer Tab aktivieren
            const timerContent = this.shadowRoot.querySelector('[data-shortcuts-content="timer"]');
            if (timerContent) {
                this.initializeTimerTab(item, timerContent);
            }
        }, 100);
    }        

    // ✅ Aktionen Tab Initialisierung 
    initializeActionsTab(item, container) {
        console.log('🎯 Initializing Actions Tab for', item.name);
        
        container.innerHTML = `
            <div class="actions-container">
                <div class="actions-header">
                    <h4>Verfügbare Aktionen für ${item.name}</h4>
                    <div class="actions-filter-chips">
                        <button class="action-filter-chip active" data-action-filter="all">
                            Alle <span class="chip-count" id="actions-all-count">0</span>
                        </button>
                        <button class="action-filter-chip" data-action-filter="favorites" style="display: none;">
                            ⭐ Favoriten <span class="chip-count" id="actions-favorites-count">0</span>
                        </button>
                        <button class="action-filter-chip" data-action-filter="scenes">
                            🎬 Szenen <span class="chip-count" id="actions-scenes-count">0</span>
                        </button>
                        <button class="action-filter-chip" data-action-filter="scripts">
                            📜 Skripte <span class="chip-count" id="actions-scripts-count">0</span>
                        </button>
                        <button class="action-filter-chip" data-action-filter="automations">
                            ⚙️ Automationen <span class="chip-count" id="actions-automations-count">0</span>
                        </button>
                    </div>
                </div>
                
                <div class="actions-results-container">
                    <div class="actions-loading">
                        🔄 Lade verfügbare Aktionen...
                    </div>
                    
                    <div class="actions-results" id="actions-results-${item.id}">
                        <!-- Content wird dynamisch gefüllt -->
                    </div>
                </div>
            </div>
        `;
        
        // Setup Filter Event Listeners
        this.setupActionsFilterListeners(item, container);
        
        // Load Actions
        this.loadRelatedActions(item, container);
        
        console.log('Actions Tab HTML erstellt');
    }    


    // 🎯 ACTIONS FILTER LISTENERS
    setupActionsFilterListeners(item, container) {
        const filterChips = container.querySelectorAll('.action-filter-chip');
        
        filterChips.forEach(chip => {
            // Hover-Animationen
            chip.addEventListener('mouseenter', () => {
                if (!chip.classList.contains('active')) {
                    chip.animate([
                        { transform: 'translateY(0)' },
                        { transform: 'translateY(-2px)' }
                    ], {
                        duration: 200,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });
                }
            });
            
            chip.addEventListener('mouseleave', () => {
                if (!chip.classList.contains('active')) {
                    chip.animate([
                        { transform: 'translateY(-2px)' },
                        { transform: 'translateY(0)' }
                    ], {
                        duration: 200,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });
                }
            });
            
            chip.addEventListener('click', () => {
                // Klick-Animation
                chip.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(0.95)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 150,
                    easing: 'ease-out'
                });
                
                // Update active state
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                // Filter results
                const filter = chip.dataset.actionFilter;
                console.log(`🔽 Filtering actions: ${filter}`);
                // Re-render mit Filter
                this.filterActionResults(item, filter, container);
            });
        });
    }

    // 🎯 FILTER ACTION RESULTS - Korrigiert für Favoriten
    filterActionResults(item, filter, container) {
        console.log(`🔍 Filtering actions for ${item.name} by: ${filter}`);
        
        const deviceArea = item.area;
        const deviceId = item.id;
        
        // ✅ SAMMLE ALLE RELEVANTEN ACTIONS (gleiche Logik wie loadRelatedActions)
        const relatedActions = {
            scenes: [
                ...this.findRelatedScenes(deviceId, deviceArea),
                ...this.getFavoriteScenes(deviceId)
            ],
            scripts: [
                ...this.findRelatedScripts(deviceId, deviceArea),
                ...this.getFavoriteScripts(deviceId)
            ],
            automations: [
                ...this.findRelatedAutomations(deviceId, deviceArea),
                ...this.getFavoriteAutomations(deviceId)
            ]
        };
        
        // ✅ DUPLIKATE ENTFERNEN
        relatedActions.scenes = this.removeDuplicateActions(relatedActions.scenes);
        relatedActions.scripts = this.removeDuplicateActions(relatedActions.scripts);
        relatedActions.automations = this.removeDuplicateActions(relatedActions.automations);
        
        // ✅ FAVORITEN MARKIEREN
        this.markFavoriteActions(relatedActions, deviceId);
        
        // Render mit Filter
        const resultsDiv = container.querySelector('.actions-results');
        this.renderActionResults(relatedActions, resultsDiv, filter);
        
    }

    // 🔍 DEBUG: Verfügbare Metadaten analysieren
    debugAvailableMetadata(entityId) {
        const state = this._hass.states[entityId];
        const entityRegistry = this._hass.entities ? this._hass.entities[entityId] : null;
        const deviceId = entityRegistry?.device_id;
        const device = deviceId && this._hass.devices ? this._hass.devices[deviceId] : null;
        
        console.log(`🔍 Entity: ${entityId}`);
        console.log(`🔍 State:`, state);
        console.log(`🔍 Entity Registry:`, entityRegistry);
        console.log(`🔍 Device ID:`, deviceId);
        console.log(`🔍 Device:`, device);
        console.log(`🔍 Available in _hass:`, {
            entities: !!this._hass.entities,
            devices: !!this._hass.devices,
            areas: !!this._hass.areas,
            labels: !!this._hass.labels
        });
        
        // Prüfe was bei Szenen/Skripten verfügbar ist
        const sceneExample = Object.keys(this._hass.states).find(id => id.startsWith('scene.'));
        const scriptExample = Object.keys(this._hass.states).find(id => id.startsWith('script.'));
        
        if (sceneExample) {
            const sceneState = this._hass.states[sceneExample];
            console.log(`🎬 Scene example (${sceneExample}):`, sceneState);
            console.log(`🎬 Scene attributes:`, sceneState.attributes);
        }
        
        if (scriptExample) {
            const scriptState = this._hass.states[scriptExample];
            console.log(`📜 Script example (${scriptExample}):`, scriptState);
            console.log(`📜 Script attributes:`, scriptState.attributes);
        }
    }
    
    // 🎯 LOAD RELATED ACTIONS - Echte Discovery
    loadRelatedActions(item, container) {

        // Am Anfang hinzufügen:
        console.log(`🔍 Debugging metadata for: ${item.id}`);
        this.debugAvailableMetadata(item.id);
        
        console.log(`🔍 Loading actions for device: ${item.name} in area: ${item.area}`);
        
        const deviceArea = item.area;
        const deviceId = item.id;
        const loadingDiv = container.querySelector('.actions-loading');
        const resultsDiv = container.querySelector('.actions-results');
        
        // Show loading
        loadingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';


        // Loading-Spinner Animation
            const createSpinner = () => {
                const spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                spinner.style.cssText = `
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid var(--text-secondary);
                    border-radius: 50%;
                    margin-right: 8px;
                `;
                
                // Rotate animation
                const rotate = () => {
                    spinner.animate([
                        { transform: 'rotate(0deg)' },
                        { transform: 'rotate(360deg)' }
                    ], {
                        duration: 1000,
                        iterations: Infinity,
                        easing: 'linear'
                    });
                };
                
                rotate();
                return spinner;
            };
            
            // Spinner zu loading text hinzufügen
            loadingDiv.innerHTML = '';
            loadingDiv.appendChild(createSpinner());
            loadingDiv.appendChild(document.createTextNode('Lade verfügbare Aktionen...'));
        
        
        // ✅ SAMMLE ALLE RELEVANTEN ACTIONS (Auto-Discovery + Favoriten)
        const relatedActions = {
            scenes: [
                ...this.findRelatedScenes(deviceId, deviceArea),
                ...this.getFavoriteScenes(deviceId)
            ],
            scripts: [
                ...this.findRelatedScripts(deviceId, deviceArea),
                ...this.getFavoriteScripts(deviceId)
            ],
            automations: [
                ...this.findRelatedAutomations(deviceId, deviceArea),
                ...this.getFavoriteAutomations(deviceId)
            ]
        };
        
        // ✅ DUPLIKATE ENTFERNEN
        relatedActions.scenes = this.removeDuplicateActions(relatedActions.scenes);
        relatedActions.scripts = this.removeDuplicateActions(relatedActions.scripts);
        relatedActions.automations = this.removeDuplicateActions(relatedActions.automations);
        
        // ✅ FAVORITEN MARKIEREN
        this.markFavoriteActions(relatedActions, deviceId);
        
        console.log('🎯 Found actions:', relatedActions);
        
        // Update counts
        this.updateActionCounts(relatedActions, container);
        
        // Render results
        const totalActions = Object.values(relatedActions).flat().length;
        
        if (totalActions === 0) {
            loadingDiv.style.display = 'none';
            resultsDiv.innerHTML = '<p>Keine Aktionen gefunden für dieses Gerät.</p>';
            resultsDiv.style.display = 'block';
        } else {
            this.renderActionResults(relatedActions, resultsDiv, 'all');
            loadingDiv.style.display = 'none';
            resultsDiv.style.display = 'block';
        }
    }

    // 🌟 REMOVE DUPLICATE ACTIONS
    removeDuplicateActions(actions) {
        const seen = new Set();
        return actions.filter(action => {
            if (seen.has(action.id)) {
                return false;
            }
            seen.add(action.id);
            return true;
        });
    }
    
    // 🌟 MARK FAVORITE ACTIONS
    markFavoriteActions(relatedActions, deviceId) {
        const favorites = this._config.action_favorites[deviceId];
        if (!favorites) return;
        
        ['scenes', 'scripts', 'automations'].forEach(type => {
            if (favorites[type]) {
                relatedActions[type].forEach(action => {
                    if (favorites[type].includes(action.id)) {
                        action.isFavorite = true;
                        action.favoriteReason = 'manual';
                    }
                });
            }
        });
    }    

    // 🎯 UPDATE ACTION COUNTS mit Animationen
    updateActionCounts(relatedActions, container) {
        const counts = {
            all: Object.values(relatedActions).flat().length,
            scenes: relatedActions.scenes.length,
            scripts: relatedActions.scripts.length,
            automations: relatedActions.automations.length,
            favorites: Object.values(relatedActions).flat().filter(a => a.isFavorite).length
        };
        
        // Update counts mit Animation
        Object.entries(counts).forEach(([type, count]) => {
            const countElement = container.querySelector(`#actions-${type}-count`);
            if (countElement) {
                const oldCount = parseInt(countElement.textContent) || 0;
                
                if (oldCount !== count) {
                    // Scale-Animation beim Count-Update
                    countElement.animate([
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.2)' },
                        { transform: 'scale(1)' }
                    ], {
                        duration: 300,
                        easing: 'ease-out'
                    });
                    
                    // Count-Up-Animation
                    const duration = 500;
                    const startTime = performance.now();
                    
                    const updateCount = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        const currentCount = Math.floor(oldCount + (count - oldCount) * progress);
                        countElement.textContent = currentCount;
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateCount);
                        }
                    };
                    
                    requestAnimationFrame(updateCount);
                }
            }
        });
        
        // Show/hide favorites chip based on count
        const favoritesChip = container.querySelector('[data-action-filter="favorites"]');
        if (favoritesChip) {
            if (counts.favorites > 0) {
                favoritesChip.style.display = 'flex';
            } else {
                favoritesChip.style.display = 'none';
            }
        }
    }

    // 🎯 FIND RELATED SCENES - Erweiterte Metadaten-Analyse
    findRelatedScenes(deviceId, deviceArea) {
        if (!this._hass || !this.allItems) return [];
        
        // Device-ID und Area-ID des Ziel-Devices ermitteln
        const targetDeviceId = this.getDeviceId(deviceId);
        const targetAreaId = this.getAreaId(deviceId, deviceArea);
        
        console.log(`🔍 Target Device ID: ${targetDeviceId}, Area ID: ${targetAreaId}`);
        
        return this.allItems.filter(item => {
            if (item.domain !== 'scene') return false;
            
            const state = this._hass.states[item.id];
            if (!state) return false;
            
            // METHODE 1: Direkte Entity-Analyse (bestehend)
            if (state.attributes.entity_id) {
                const targetEntities = state.attributes.entity_id;
                if (targetEntities.includes(deviceId)) {
                    console.log(`✅ Scene ${item.name} targets device directly`);
                    return true;
                }
            }
            
            // 🆕 METHODE 2: Device-ID Matching
            if (targetDeviceId && state.attributes.entity_id) {
                const sceneEntityIds = state.attributes.entity_id;
                for (const entityId of sceneEntityIds) {
                    const entityDeviceId = this.getDeviceId(entityId);
                    if (entityDeviceId === targetDeviceId) {
                        console.log(`✅ Scene ${item.name} targets same device via different entity`);
                        return true;
                    }
                }
            }
            
            // 🆕 METHODE 3: Area-ID Matching via alle Entities in der Area
            if (targetAreaId && state.attributes.entity_id) {
                const sceneEntityIds = state.attributes.entity_id;
                for (const entityId of sceneEntityIds) {
                    const entityAreaId = this.getAreaId(entityId);
                    if (entityAreaId === targetAreaId) {
                        console.log(`✅ Scene ${item.name} affects same area: ${targetAreaId}`);
                        return true;
                    }
                }
            }
            
            // METHODE 4: Gleiche Area (bestehend)
            if (item.area === deviceArea && deviceArea !== 'Ohne Raum') {
                console.log(`✅ Scene ${item.name} in same area: ${deviceArea}`);
                return true;
            }
            
            return false;
        });
    }

    // 🔧 Helper: Get Device ID for Entity
    getDeviceId(entityId) {
        if (!this._hass.entities || !this._hass.entities[entityId]) return null;
        return this._hass.entities[entityId].device_id || null;
    }
    
    // 🔧 Helper: Get Area ID for Entity
    getAreaId(entityId, fallbackAreaName = null) {
        // Direkt von Entity
        const entityRegistry = this._hass.entities?.[entityId];
        if (entityRegistry?.area_id) return entityRegistry.area_id;
        
        // Via Device
        const deviceId = this.getDeviceId(entityId);
        if (deviceId && this._hass.devices?.[deviceId]?.area_id) {
            return this._hass.devices[deviceId].area_id;
        }
        
        // Fallback: Area-Name zu Area-ID konvertieren
        if (fallbackAreaName && this._hass.areas) {
            const area = Object.values(this._hass.areas).find(a => a.name === fallbackAreaName);
            return area?.area_id || null;
        }
        
        return null;
    }
    
    // 🎯 FIND RELATED SCRIPTS - Erweiterte Metadaten-Analyse
    findRelatedScripts(deviceId, deviceArea) {
        if (!this._hass || !this.allItems) return [];
        
        // Device-ID und Area-ID des Ziel-Devices ermitteln
        const targetDeviceId = this.getDeviceId(deviceId);
        const targetAreaId = this.getAreaId(deviceId, deviceArea);
        
        console.log(`📜 Target Device ID: ${targetDeviceId}, Area ID: ${targetAreaId}`);
        
        return this.allItems.filter(item => {
            if (item.domain !== 'script') return false;
            
            // METHODE 1: Gleiche Area (bestehend)
            if (item.area === deviceArea && deviceArea !== 'Ohne Raum') {
                console.log(`✅ Script ${item.name} in same area: ${deviceArea}`);
                return true;
            }
            
            // 🆕 METHODE 2: Script hat gleiche Area-ID
            const scriptAreaId = this.getAreaId(item.id);
            if (targetAreaId && scriptAreaId === targetAreaId) {
                console.log(`✅ Script ${item.name} has same area ID: ${targetAreaId}`);
                return true;
            }
            
            // 🆕 METHODE 3: Script hat gleiche Device-ID
            const scriptDeviceId = this.getDeviceId(item.id);
            if (targetDeviceId && scriptDeviceId === targetDeviceId) {
                console.log(`✅ Script ${item.name} on same device: ${targetDeviceId}`);
                return true;
            }
            
            // METHODE 4: Name-Matching (bestehend, aber erweitert)
            const scriptName = item.name.toLowerCase();
            const deviceName = deviceId.split('.')[1].toLowerCase();
            const areaName = deviceArea.toLowerCase();
            
            // Erweiterte Name-Patterns
            const namePatterns = [
                deviceName,
                areaName,
                deviceId.replace(/[._]/g, ' ').toLowerCase(),
                // Device-spezifische Patterns
                deviceName.replace(/[._]/g, ' '),
                areaName.replace(/[._]/g, ' ')
            ];
            
            for (const pattern of namePatterns) {
                if (pattern && scriptName.includes(pattern)) {
                    console.log(`✅ Script ${item.name} matches pattern: ${pattern}`);
                    return true;
                }
            }
            
            return false;
        });
    }
    
    // 🎯 FIND RELATED AUTOMATIONS - Erweiterte Metadaten-Analyse
    findRelatedAutomations(deviceId, deviceArea) {
        if (!this._hass || !this.allItems) return [];
        
        // Device-ID und Area-ID des Ziel-Devices ermitteln
        const targetDeviceId = this.getDeviceId(deviceId);
        const targetAreaId = this.getAreaId(deviceId, deviceArea);
        
        console.log(`⚙️ Target Device ID: ${targetDeviceId}, Area ID: ${targetAreaId}`);
        
        return this.allItems.filter(item => {
            if (item.domain !== 'automation') return false;
            
            // METHODE 1: Gleiche Area (bestehend)
            if (item.area === deviceArea && deviceArea !== 'Ohne Raum') {
                console.log(`✅ Automation ${item.name} in same area: ${deviceArea}`);
                return true;
            }
            
            // 🆕 METHODE 2: Automation hat gleiche Area-ID
            const autoAreaId = this.getAreaId(item.id);
            if (targetAreaId && autoAreaId === targetAreaId) {
                console.log(`✅ Automation ${item.name} has same area ID: ${targetAreaId}`);
                return true;
            }
            
            // 🆕 METHODE 3: Automation hat gleiche Device-ID
            const autoDeviceId = this.getDeviceId(item.id);
            if (targetDeviceId && autoDeviceId === targetDeviceId) {
                console.log(`✅ Automation ${item.name} on same device: ${targetDeviceId}`);
                return true;
            }
            
            // METHODE 4: Name-Matching (erweitert wie bei Scripts)
            const autoName = item.name.toLowerCase();
            const deviceName = deviceId.split('.')[1].toLowerCase();
            const areaName = deviceArea.toLowerCase();
            
            const namePatterns = [
                deviceName,
                areaName,
                deviceId.replace(/[._]/g, ' ').toLowerCase(),
                deviceName.replace(/[._]/g, ' '),
                areaName.replace(/[._]/g, ' ')
            ];
            
            for (const pattern of namePatterns) {
                if (pattern && autoName.includes(pattern)) {
                    console.log(`✅ Automation ${item.name} matches pattern: ${pattern}`);
                    return true;
                }
            }
            
            return false;
        });
    }

    // 🎯 RENDER ACTION RESULTS
    renderActionResults(relatedActions, container, filter = 'all') {
        let actionsToShow = [];
        
        if (filter === 'all') {
            actionsToShow = [
                ...relatedActions.scenes,
                ...relatedActions.scripts,
                ...relatedActions.automations
            ];
        } else if (filter === 'favorites') {
            // 🌟 NUR FAVORITEN anzeigen
            actionsToShow = [
                ...relatedActions.scenes.filter(a => a.isFavorite),
                ...relatedActions.scripts.filter(a => a.isFavorite),
                ...relatedActions.automations.filter(a => a.isFavorite)
            ];
        } else {
            actionsToShow = relatedActions[filter] || [];
        }
        
        // Sort: Favoriten zuerst, dann nach Area, dann nach Name
        actionsToShow.sort((a, b) => {
            // Favoriten zuerst
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            
            // Dann nach Area
            const areaCompare = (a.area || 'Ohne Raum').localeCompare(b.area || 'Ohne Raum');
            if (areaCompare !== 0) return areaCompare;
            
            // Dann nach Name
            return a.name.localeCompare(b.name);
        });
        
        const resultsHTML = actionsToShow.map(action => this.renderActionItem(action)).join('');
        
        container.innerHTML = `
            <div class="actions-grid">
                ${resultsHTML}
            </div>
        `;

        // Entrance-Animationen mit Web Animations API
        const actionItems = container.querySelectorAll('.action-timeline-event');
        actionItems.forEach((item, index) => {
            // Initial state
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            // Animate in mit gestaffeltem Delay
            setTimeout(() => {
                item.animate([
                    { opacity: 0, transform: 'translateY(20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], {
                    duration: 300,
                    delay: index * 50,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards'
                });
            }, 50);
        });
        
        
        // Setup click handlers
        this.setupActionClickHandlers(container);
    }
    
    // 🎯 RENDER ACTION ITEM - Timeline-Event Design
    renderActionItem(action) {
        const state = this._hass.states[action.id];
        const isActive = this.isEntityActive(state);
        const icon = this.getActionIcon(action.domain);
        
        // Favoriten-Kennzeichnung
        const favoriteIcon = action.isFavorite ? '⭐ ' : '';
        const favoriteClass = action.isFavorite ? 'favorite-action' : '';
        
        // Status/Meta-Info
        const typeLabel = this.getActionTypeLabel(action.domain);
        const sourceLabel = action.isFavorite ? 'Favorit' : 'Auto-Discovery';
        const areaLabel = action.area !== 'Ohne Raum' ? action.area : '';
        
        return `
            <div class="timeline-event action-timeline-event ${favoriteClass}" 
                 data-action-id="${action.id}" 
                 data-action-domain="${action.domain}">
                <div class="timeline-event-icon">
                    ${icon}
                </div>
                <div class="timeline-event-content action-main-area" data-action-id="${action.id}">
                    <div class="timeline-event-title">
                        ${favoriteIcon}${action.name}
                    </div>
                    <div class="timeline-event-details">
                        <span class="action-type-badge">${typeLabel}</span>
                        ${areaLabel ? `<span class="action-area-badge">${areaLabel}</span>` : ''}
                        <span class="action-source-badge">${sourceLabel}</span>
                    </div>
                </div>
                <div class="timeline-event-time action-trigger-area" data-action-id="${action.id}">
                    <button class="action-execute-btn" title="${typeLabel} ausführen">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M8 5l8 7-8 7"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    getActionIcon(domain) {
        switch(domain) {
            case 'scene':
                return FastSearchCard.SCENE_SVG;
            case 'script':
                return FastSearchCard.SCRIPT_SVG;
            case 'automation':
                return FastSearchCard.AUTOMATION_SVG;
            default:
                return this.getEntityIcon(domain); // Fallback
        }
    }    
    
    // 🎯 HELPER METHODS
    getActionTypeLabel(domain) {
        const labels = {
            scene: 'Szene',
            script: 'Skript', 
            automation: 'Automation'
        };
        return labels[domain] || domain;
    }

    // 🎯 SETUP ACTION CLICK HANDLERS - Mit Navigation und Ausführung
    setupActionClickHandlers(container) {
        // 🎯 HAUPTBEREICH KLICKS → Navigation zur Detail-View
        const actionMainAreas = container.querySelectorAll('.action-main-area');
        actionMainAreas.forEach(area => {
            area.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionId = area.dataset.actionId;
                const actionDomain = area.closest('.action-timeline-event').dataset.actionDomain;
                const actionEvent = area.closest('.action-timeline-event');
                
                console.log(`🎯 Navigation to detail view: ${actionId} (${actionDomain})`);
                
                // Klick-Animation mit Web Animations API
                actionEvent.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(0.98)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 150,
                    easing: 'ease-out'
                });
                
                // Navigate to detail view
                this.navigateToActionDetail(actionId, actionDomain);
            });
        });
    
        // ▶️ EXECUTE BUTTONS → Direkte Ausführung
        const executeButtons = container.querySelectorAll('.action-execute-btn');
        executeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const actionId = btn.closest('.action-timeline-event').dataset.actionId;
                console.log(`🚀 Execute action: ${actionId}`);
                
                // Button-Animation mit Web Animations API
                btn.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(0.9)' },
                    { transform: 'scale(1.1)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 200,
                    easing: 'ease-out'
                });
                
                // Execute action
                this.triggerAction(actionId);
            });
        });
    }

    // 🎯 NAVIGATE TO ACTION DETAIL - Finale, funktionierende Version
    navigateToActionDetail(actionId, actionDomain) {
        console.log(`🎯 Simulating click on ${actionDomain}: ${actionId}`);
        
        // 1. Bestimme Ziel-Kategorie
        const targetCategory = this.getTargetCategoryForDomain(actionDomain);
        
        // Detail-View schließen
        this.isDetailView = false;
        this.currentDetailItem = null;
        
        // Zentrale Navigation verwenden
        this.switchToCategory(targetCategory);
        
        // 4. Warte zuverlässig mit requestAnimationFrame, bis das Element da ist
        const waitForElementAndClick = (selector, targetId, retries = 30) => {
            const element = this.shadowRoot.querySelector(`${selector}[data-entity="${targetId}"]`);
            
            // Wenn Element gefunden, klicken und aufhören
            if (element) {
                console.log(`✅ Element ${targetId} gefunden! Klick wird ausgeführt.`);
                element.click();
                return;
            }
            
            // Wenn Versuche aufgebraucht, abbrechen
            if (retries <= 0) {
                console.warn(`❌ Element ${targetId} wurde nach mehreren Versuchen nicht gefunden.`);
                return;
            }
            
            // Nächsten Versuch im nächsten Browser-Render-Frame planen (zuverlässiger als setTimeout)
            requestAnimationFrame(() => {
                waitForElementAndClick(selector, targetId, retries - 1);
            });
        };
    
        // Starte den Warte-Prozess
        const viewMode = this.currentViewMode;
        const itemSelector = viewMode === 'grid' ? '.device-card' : '.device-list-item';
        waitForElementAndClick(itemSelector, actionId);
    }
    
    // 🎯 GET TARGET CATEGORY FOR DOMAIN
    getTargetCategoryForDomain(domain) {
        const categoryMap = {
            'scene': 'scenes',
            'script': 'scripts',
            'automation': 'automations'
        };
        
        return categoryMap[domain] || 'devices';
    }
    
    // 🎯 TRIGGER ACTION
    triggerAction(actionId) {
        const domain = actionId.split('.')[0];
        
        console.log(`🚀 Triggering ${domain}: ${actionId}`);
        
        switch(domain) {
            case 'scene':
                this._hass.callService('scene', 'turn_on', { entity_id: actionId });
                console.log(`✅ Scene activated: ${actionId}`);
                break;
            case 'script':
                this._hass.callService('script', 'turn_on', { entity_id: actionId });
                console.log(`✅ Script executed: ${actionId}`);
                break;
            case 'automation':
                this._hass.callService('automation', 'trigger', { entity_id: actionId });
                console.log(`✅ Automation triggered: ${actionId}`);
                break;
            default:
                console.warn(`❌ Unknown action domain: ${domain}`);
        }
    }

    // 🌟 GET FAVORITE SCENES
    getFavoriteScenes(deviceId) {
        const favorites = this._config.action_favorites[deviceId];
        if (!favorites || !favorites.scenes) return [];
        
        return favorites.scenes.map(sceneId => {
            const sceneItem = this.allItems.find(item => item.id === sceneId);
            if (sceneItem) {
                return {
                    ...sceneItem,
                    isFavorite: true,
                    favoriteReason: 'manual'
                };
            }
            return null;
        }).filter(Boolean);
    }
    
    // 🌟 GET FAVORITE SCRIPTS
    getFavoriteScripts(deviceId) {
        const favorites = this._config.action_favorites[deviceId];
        if (!favorites || !favorites.scripts) return [];
        
        return favorites.scripts.map(scriptId => {
            const scriptItem = this.allItems.find(item => item.id === scriptId);
            if (scriptItem) {
                return {
                    ...scriptItem,
                    isFavorite: true,
                    favoriteReason: 'manual'
                };
            }
            return null;
        }).filter(Boolean);
    }
    
    // 🌟 GET FAVORITE AUTOMATIONS
    getFavoriteAutomations(deviceId) {
        const favorites = this._config.action_favorites[deviceId];
        if (!favorites || !favorites.automations) return [];
        
        return favorites.automations.map(autoId => {
            const autoItem = this.allItems.find(item => item.id === autoId);
            if (autoItem) {
                return {
                    ...autoItem,
                    isFavorite: true,
                    favoriteReason: 'manual'
                };
            }
            return null;
        }).filter(Boolean);
    }
    
        

    initializeTimerTab(item, container) {
        console.log('🔥 NEUE VERSION 2024 - Initializing Timer Tab for', item.name);
        
        const timerPresets = container.querySelectorAll('.timer-control-preset');
        console.log('🔍 Found timer presets:', timerPresets.length);
        
        timerPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const action = preset.dataset.action;
                console.log(`Timer Action ausgewählt: ${action} für ${item.name}`);
                
                // Skip timer/schedule toggle buttons
                if (action === 'timer' || action === 'schedule') {
                    return; // Diese werden separat behandelt
                }
                
                console.log(`🎯 Zeige Minimal Time Picker für Action: ${action}`);
                
                // Visual feedback
                timerPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                
                // Verstecke normale Controls
                const timerControls = container.querySelector('.timer-control-design');
                const activeTimers = container.querySelector('.active-timers');
                if (timerControls) timerControls.style.display = 'none';
                if (activeTimers) activeTimers.style.display = 'none';
                
                // Zeige Minimal Time Picker für Timer (nicht Schedule)
                this.showMinimalTimePicker(item, action, container, false);
            });
        });
        
        this.loadActiveTimers(item.id);
    }

    updateScheduleSelectionAction(item, action, container) {
        // Nur die Überschrift ändern, keine neue Animation
        const actionLabel = container.querySelector('.action-label');
        if (actionLabel) {
            actionLabel.textContent = this.getActionLabel(action);
        }
        
        // Visual feedback für Buttons
        const schedulePresets = container.querySelectorAll('.timer-control-preset');
        schedulePresets.forEach(p => p.classList.remove('active'));
        const activePreset = container.querySelector(`[data-action="${action}"]`);
        if (activePreset) {
            activePreset.classList.add('active');
        }
    }    

    animateScheduleSelectionContents(scheduleSelectionContainer) {
        console.log('🎭 Animating schedule selection contents');
        
        const animatableElements = scheduleSelectionContainer.querySelectorAll(
            '.time-selection-header, .weekdays-selection, .time-picker-container, .schedule-create-actions'
        );
        
        animatableElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            el.style.transition = `all 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 50}ms`;
            
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });
    }    

    applyWeekdayPreset(presetType, container) {
        const weekdayChips = container.querySelectorAll('.weekday-chip');
        
        // Alle erst deaktivieren
        weekdayChips.forEach(chip => chip.classList.remove('active'));
        
        // Je nach Preset aktivieren
        switch (presetType) {
            case 'daily':
                weekdayChips.forEach(chip => chip.classList.add('active'));
                break;
            case 'workday':
                ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
                    const chip = container.querySelector(`[data-day="${day}"]`);
                    if (chip) chip.classList.add('active');
                });
                break;
            case 'weekend':
                ['sat', 'sun'].forEach(day => {
                    const chip = container.querySelector(`[data-day="${day}"]`);
                    if (chip) chip.classList.add('active');
                });
                break;
        }
        
        this.updateScheduleCreateButton(container);
    }
    
    getSelectedWeekdays(container) {
        const activeChips = container.querySelectorAll('.weekday-chip.active');
        return Array.from(activeChips).map(chip => chip.dataset.day);
    }
    
    updateScheduleCreateButton(container) {
        const createBtn = container.querySelector('.schedule-create-btn');
        const selectedDays = this.getSelectedWeekdays(container);
        
        if (createBtn) {
            createBtn.disabled = selectedDays.length === 0;
            createBtn.textContent = selectedDays.length > 0 
                ? `Zeitplan erstellen (${selectedDays.length} Tage)` 
                : 'Wochentage auswählen';
        }
    }    

    getServiceCallForAction(action) {
        switch (action) {
            case 'turn_on':
                return { service: 'light.turn_on' };
            case 'turn_off':
                return { service: 'light.turn_off' };
            case 'dim_30':
                return { 
                    service: 'light.turn_on',
                    service_data: { brightness: 77 } // 30% von 255
                };
            case 'dim_50':
                return { 
                    service: 'light.turn_on',
                    service_data: { brightness: 128 } // 50% von 255
                };
                
            // NEUE Climate Actions:
            case 'heat_22':
                return { 
                    service: 'climate.set_temperature',
                    service_data: { temperature: 22 }
                };
            case 'cool_18':
                return { 
                    service: 'climate.set_temperature',
                    service_data: { temperature: 18 }
                };
            case 'auto_mode':
                return { 
                    service: 'climate.set_hvac_mode',
                    service_data: { hvac_mode: 'auto' }
                };
                
            // NEUE Media Player Actions:
            case 'play':
                return { service: 'media_player.media_play' };
            case 'pause':
                return { service: 'media_player.media_pause' };
            case 'volume_down':
                return { service: 'media_player.volume_down' };
                
            // NEUE Cover Actions:
            case 'open_cover':
                return { service: 'cover.open_cover' };
            case 'close_cover':
                return { service: 'cover.close_cover' };
            case 'stop_cover':
                return { service: 'cover.stop_cover' };
            case 'set_position_50':
                return { 
                    service: 'cover.set_cover_position',
                    service_data: { position: 50 }
                };
                
            default:
                return { service: 'light.turn_on' };
        }
    }

    resetToInitialScheduleState(container) {
        console.log('🔄 Reset to initial schedule state');
    
        const scheduleSelectionContainer = container.querySelector('.schedule-time-selection');
        const activeSchedulesSection = container.querySelector('.active-schedules');
        const scheduleControlDesign = container.querySelector('.schedule-control-design');
    
        // 1. Schedule-Panel ausblenden
        const fadeOutSelection = scheduleSelectionContainer ? scheduleSelectionContainer.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-20px)' }
        ], {
            duration: 300,
            fill: 'forwards',
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }).finished : Promise.resolve();
    
        fadeOutSelection.then(() => {
            if (scheduleSelectionContainer) {
                scheduleSelectionContainer.remove();
            }
    
            // 2. Schedule-Liste und Steuerung GLEICHZEITIG wieder einblenden
            const fadeInAnimations = [];
    
            if (activeSchedulesSection) {
                const fadeInSchedules = activeSchedulesSection.animate([
                    { opacity: 0, transform: 'translateY(-20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { 
                    duration: 400, 
                    fill: 'forwards', 
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)' 
                });
                fadeInAnimations.push(fadeInSchedules);
            }
    
            if (scheduleControlDesign) {
                const fadeInControls = scheduleControlDesign.animate([
                    { opacity: 0, transform: 'translateY(-20px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], { 
                    duration: 400, 
                    fill: 'forwards', 
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)' 
                });
                fadeInAnimations.push(fadeInControls);
            }
    
            // 3. Button-States zurücksetzen
            Promise.all(fadeInAnimations.map(anim => anim.finished)).then(() => {
                const schedulePresets = container.querySelectorAll('.timer-control-preset');
                schedulePresets.forEach(p => p.classList.remove('active'));
                console.log('✅ Schedule reset complete');
            });
        });
    }

    
    initializeScheduleTab(item, container) {
        console.log('📅 Initializing Schedule Tab for', item.name);
        
        const schedulePresets = container.querySelectorAll('.schedule-action-presets .timer-control-preset');
        console.log('🔍 Found schedule presets:', schedulePresets.length);
        
        schedulePresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const action = preset.dataset.action;
                console.log(`Schedule Action ausgewählt: ${action} für ${item.name}`);
                
                // Skip timer/schedule toggle buttons
                if (action === 'timer' || action === 'schedule') {
                    return; // Diese werden separat behandelt
                }
                
                console.log(`🎯 Zeige Minimal Time Picker für Schedule Action: ${action}`);
                
                // Visual feedback
                schedulePresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                
                // Verstecke normale Controls
                const scheduleControls = container.querySelector('.schedule-control-design');
                const activeSchedules = container.querySelector('.active-schedules');
                if (scheduleControls) scheduleControls.style.display = 'none';
                if (activeSchedules) activeSchedules.style.display = 'none';
                
                // Zeige Minimal Time Picker für Schedule (mit Kalender)
                this.showMinimalTimePicker(item, action, container, true);
            });
        });
        
        this.loadActiveSchedules(item.id);
    }
    
    // ✅ Szenen Tab Initialisierung 
    initializeScenesTab(item, container) {
        console.log('🎭 Initializing Scenes Tab for', item.name);
        
        // TODO: Szenen-spezifische Logik implementieren
        container.innerHTML = `
            <div class="scenes-content">
                <h4>Verfügbare Szenen für ${item.name}</h4>
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    Szenen-Feature wird implementiert...
                </div>
            </div>
        `;
    }
    
    // ✅ Skripte Tab Initialisierung 
    initializeScriptsTab(item, container) {
        console.log('📜 Initializing Scripts Tab for', item.name);
        
        // TODO: Skripte-spezifische Logik implementieren
        container.innerHTML = `
            <div class="scripts-content">
                <h4>Verfügbare Skripte für ${item.name}</h4>
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    Skripte-Feature wird implementiert...
                </div>
            </div>
        `;
    }
    
    async loadActiveSchedules(entityId) {
        const container = this.shadowRoot.getElementById(`active-schedules-${entityId}`);
        if (!container) return;
        
        container.innerHTML = '<div class="loading-schedules">Lade Zeitpläne...</div>';
        
        try {
            const allEntities = this._hass.states;
            const allSchedules = Object.keys(allEntities)
                .filter(key => key.startsWith('switch.schedule_'))
                .map(key => allEntities[key]);
    
            console.log('🔍 DEBUG: Alle Schedule-Entitäten:', allSchedules.length);
            
            // KORRIGIERTES FILTERING: entities statt actions in timeslots + nur echte Zeitpläne
            const scheduleEntities = allSchedules.filter(schedule => {
                const entities = schedule.attributes.entities || [];
                const hasMatch = entities.includes(entityId);
                
                // Zeitplan = hat Wochentage definiert (nicht leer)
                const weekdays = schedule.attributes.weekdays || [];
                
                // Echte Zeitpläne = wiederkehrend mit spezifischen Wochentagen (nicht "daily" für Timer)
                const isSchedule = weekdays.length > 0 && 
                                  !schedule.attributes.friendly_name?.includes('min)') && // Keine Timer mit "(30min)"
                                  (weekdays.includes('mon') || weekdays.includes('tue') || weekdays.includes('wed') || 
                                   weekdays.includes('thu') || weekdays.includes('fri') || weekdays.includes('sat') || 
                                   weekdays.includes('sun'));

                // DEBUG: Zeige alle relevanten Schedules  
                if (hasMatch) {
                    console.log(`🔍 ZEITPLAN DEBUG - Schedule: ${schedule.attributes.friendly_name}, weekdays: ${JSON.stringify(weekdays)}, isSchedule: ${isSchedule}`);
                }
   
                return hasMatch && isSchedule;
            });
    
            console.log(`📋 Gefundene Zeitpläne für ${entityId}:`, scheduleEntities.length);
    
            if (scheduleEntities.length === 0) {
                container.innerHTML = '<div class="no-schedules">Keine aktiven Zeitpläne</div>';
                return;
            }
    
            // KORRIGIERTE ANZEIGE mit neuer Datenstruktur
            const schedulesHTML = scheduleEntities.map(schedule => {
                const isEnabled = schedule.state === 'on';
                const nextTrigger = schedule.attributes.next_trigger;
                const weekdays = schedule.attributes.weekdays || [];
                const timeslots = schedule.attributes.timeslots || [];
                const entities = schedule.attributes.entities || [];
                const actions = schedule.attributes.actions || [];
                const scheduleName = schedule.attributes.friendly_name || schedule.entity_id;
    
                // Erste Timeslot für Anzeige - Zeit extrahieren aus "HH:MM:SS - HH:MM:SS"
                const firstTimeslot = timeslots[0];
                let timeString = 'Unbekannt';
                if (firstTimeslot && typeof firstTimeslot === 'string') {
                    const timeMatch = firstTimeslot.match(/^(\d{2}:\d{2})/);
                    timeString = timeMatch ? timeMatch[1] : firstTimeslot;
                }
                
                // Action für diese Entity finden - KORRIGIERT
                const entityIndex = entities.indexOf(entityId);
                let actionForEntity = 'Unbekannt';
                if (entityIndex >= 0 && actions[entityIndex]) {
                    const action = actions[entityIndex];
                    console.log('🔍 DEBUG Action Object:', action); // Debug-Zeile
                    
                    if (typeof action === 'string') {
                        actionForEntity = this.getActionLabel(action); // Verwende deine Funktion
                    } else if (action.service) {
                        // Service aus Object extrahieren (z.B. "light.turn_on" -> "turn_on")
                        const serviceAction = action.service.split('.').pop();
                        actionForEntity = this.getActionLabel(serviceAction);
                    } else if (action.action) {
                        actionForEntity = this.getActionLabel(action.action);
                    } else {
                        actionForEntity = 'Aktion';
                    }
                }
                
                return `
                    <div class="schedule-item ${isEnabled ? 'enabled' : 'disabled'}" data-entity-id="${schedule.entity_id}">
                        <div class="schedule-info">
                            <div class="schedule-main">
                                <span class="schedule-name">${actionForEntity} um ${timeString}</span>
                            </div>
                            <div class="schedule-details">
                                <span class="schedule-days">${this.formatWeekdays(weekdays)}</span>
                                ${nextTrigger ? `<span class="schedule-next">Nächste: ${this.formatNextTrigger(nextTrigger)}</span>` : ''}
                            </div>
                        </div>
                        <div class="schedule-controls">
                            <button class="schedule-toggle-btn" data-action="toggle" title="${isEnabled ? 'Deaktivieren' : 'Aktivieren'}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${isEnabled ? 
                                        '<path d="M6 18L18 6M6 6l12 12"/>' : 
                                        '<polyline points="20,6 9,17 4,12"/>'
                                    }
                                </svg>
                            </button>
                            <button class="schedule-delete-btn" data-action="delete" title="Löschen">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
    
            container.innerHTML = `
                <div class="schedules-header">
                    <h4>Aktive Zeitpläne (${scheduleEntities.length})</h4>
                </div>
                <div class="schedules-list">
                    ${schedulesHTML}
                </div>
            `;
    
            // Event Listeners für Schedule Controls
            this.setupScheduleControlEvents(container, entityId);
    
        } catch (error) {
            console.error('❌ Fehler beim Laden der Zeitpläne:', error);
            container.innerHTML = '<div class="schedules-error">Fehler beim Laden der Zeitpläne</div>';
        }
    }

    formatWeekdays(weekdays) {
        if (!weekdays || weekdays.length === 0) return 'Nie';
        
        const dayMap = {
            'mon': 'Mo', 'tue': 'Di', 'wed': 'Mi', 'thu': 'Do',
            'fri': 'Fr', 'sat': 'Sa', 'sun': 'So'
        };
        
        // Spezielle Fälle
        if (weekdays.includes('daily')) return 'Täglich';
        if (weekdays.includes('workday')) return 'Werktags';
        if (weekdays.includes('weekend')) return 'Wochenende';
        
        // Alle 7 Tage
        if (weekdays.length === 7) return 'Täglich';
        
        // Werktags-Check
        const workdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
        if (weekdays.length === 5 && workdays.every(day => weekdays.includes(day))) {
            return 'Werktags';
        }
        
        // Wochenende-Check
        if (weekdays.length === 2 && weekdays.includes('sat') && weekdays.includes('sun')) {
            return 'Wochenende';
        }
        
        // Einzelne Tage
        return weekdays.map(day => dayMap[day] || day).join(', ');
    }
    
    formatNextTrigger(nextTrigger) {
        const now = new Date();
        const trigger = new Date(nextTrigger);
        const diff = trigger - now;
        
        if (diff < 0) return 'Überfällig';
        
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) return `in ${days}d ${hours}h`;
        if (hours > 0) return `in ${hours}h ${minutes}m`;
        return `in ${minutes}m`;
    }
    
    setupScheduleControlEvents(container, entityId) {
        const toggleBtns = container.querySelectorAll('.schedule-toggle-btn');
        const deleteBtns = container.querySelectorAll('.schedule-delete-btn');
        
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const scheduleItem = btn.closest('.schedule-item');
                const scheduleEntityId = scheduleItem.dataset.entityId;
                
                try {
                    const currentState = this._hass.states[scheduleEntityId]?.state;
                    const newState = currentState === 'on' ? 'off' : 'on';
                    
                    await this._hass.callService('switch', `turn_${newState}`, {
                        entity_id: scheduleEntityId
                    });
                    
                    // UI sofort aktualisieren
                    setTimeout(() => this.loadActiveSchedules(entityId), 500);
                    
                } catch (error) {
                    console.error('Fehler beim Toggle des Zeitplans:', error);
                }
            });
        });
        
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const scheduleItem = btn.closest('.schedule-item');
                const scheduleEntityId = scheduleItem.dataset.entityId;
                
                try {
                    await this._hass.callService('scheduler', 'remove', {
                        entity_id: scheduleEntityId
                    });
                    
                    // UI aktualisieren
                    setTimeout(() => this.loadActiveSchedules(entityId), 500);
                    
                } catch (error) {
                    console.error('Fehler beim Löschen des Zeitplans:', error);
                }
            });
        });
    }
        
    
    getScheduleLabel(scheduleType) {
        const labels = {
            'schedule_daily': 'Täglich',
            'schedule_weekly': 'Wöchentlich', 
            'schedule_weekdays': 'Werktags',
            'schedule_custom': 'Benutzerdefiniert'
        };
        return labels[scheduleType] || scheduleType;
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
            // NEU: Hinzugefügte Domains
            case 'automation':
                return baseUrl + 'automation.png';
            case 'scene':
                return baseUrl + 'scene.png';
            case 'script':
                return baseUrl + 'script.png';
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

        // Reset alle Transform-Properties vor Animation
        element.style.transform = '';
        element.style.scale = '';
        element.style.opacity = '';        
        
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


    getTTSHTML() {
        return `
            <div class="preset-content tts-content">
                <div class="tts-input-section">
                    <div class="tts-header">
                        <span class="tts-title">🗣️ Text-to-Speech</span>
                        <span class="tts-counter">0/300</span>
                    </div>
                    <textarea 
                        class="tts-textarea" 
                        placeholder="Text eingeben... (max. 300 Zeichen)"
                        maxlength="300"
                        rows="4"></textarea>
                    <button class="tts-speak-btn" disabled>
                        <span class="tts-btn-icon">▶️</span>
                        <span class="tts-btn-text">Sprechen</span>
                    </button>
                </div>
            </div>
        `;
    }

    

    async handleEditTimerClick(scheduleId, entityId) {



        console.log('✏️ Bearbeitung für Timer', scheduleId, 'angefordert.');
        
        try {
            const allSchedules = await this._hass.callWS({ type: 'scheduler' });
            const timerToEdit = allSchedules.find(s => s.schedule_id === scheduleId);
        
            // DEBUG: Zeige die komplette Timer-Struktur
            console.log('🔍 DEBUG Timer-Struktur:', timerToEdit);
            console.log('🔍 DEBUG schedule_id:', timerToEdit.schedule_id);
            console.log('🔍 DEBUG entity_id:', timerToEdit.entity_id);            

            
            if (!timerToEdit) {
                alert("Dieser Timer wurde bereits ausgeführt oder gelöscht.");
                this.loadActiveTimers(entityId);
                return;
            }
    
            // ✅ KORREKTUR: Greife auf timeslots[0] zu, um actions zu finden.
            const timeslot = timerToEdit.timeslots?.[0];
            const actionData = timeslot?.actions?.[0];
    
            if (!actionData) {
                alert("Die Timer-Aktion konnte nicht gelesen werden. Der Timer ist möglicherweise fehlerhaft.");
                return;
            }
    
            const action = this.getActionNameFromService(actionData.service, actionData.service_data);
            const nextExecution = new Date(timerToEdit.next_trigger);
            const durationMinutes = Math.round((nextExecution - new Date()) / 60000);
    
            const item = this.allItems.find(i => i.id === entityId);
            const container = this.shadowRoot.querySelector(`[data-shortcuts-content="timer"]`);
    
            this.showMinimalTimePicker(item, action, container, false, {
                schedule_id: scheduleId,
                duration: durationMinutes > 0 ? durationMinutes : 0,
                action: action
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Timer-Daten:', error);
            alert('Fehler beim Laden der Timer-Daten für die Bearbeitung.');
        }
    }
    
    getActionNameFromService(service, service_data) {
        const serviceAction = service.split('.')[1];
        
        if (serviceAction === 'turn_on' && service_data && service_data.brightness) {
            // Konvertiere brightness zurück zu Prozent
            const brightness = service_data.brightness;
            const percentage = Math.round(brightness / 2.55);
            
            // Erkenne bekannte Dimm-Level
            if (percentage >= 28 && percentage <= 32) {
                return 'dim_30';
            } else if (percentage >= 48 && percentage <= 52) {
                return 'dim_50';
            }
            
            // Fallback für andere Helligkeiten
            return `dim_${percentage}`;
        }
        
        return serviceAction;
    }
    
    async updateActionTimer(scheduleId, item, action, durationMinutes) {
        console.log(`📡 Aktualisiere Timer ${scheduleId} mit Dauer ${durationMinutes}min.`);
        const future = new Date(Date.now() + durationMinutes * 60 * 1000);
        const timeString = future.toTimeString().slice(0, 5);
        const { service, serviceData } = this.getActionServiceData(item, action);
    
        try {
            // KORREKTUR: Hole die Switch-Entity-ID
            const allSchedules = await this._hass.callWS({ type: 'scheduler' });
            const timerToEdit = allSchedules.find(s => s.schedule_id === scheduleId);
            
            if (!timerToEdit) {
                alert("Timer nicht gefunden");
                return;
            }
    
            await this._hass.callService('scheduler', 'edit', {
                entity_id: timerToEdit.entity_id,  // ← Die Switch-Entity-ID verwenden
                timeslots: [{
                    start: timeString,
                    actions: [{ service, entity_id: item.id, service_data: serviceData }]
                }],
                name: `${item.name} - ${this.getActionLabel(action)} (${durationMinutes}min)`,
                repeat_type: 'single'
            });
            console.log(`✅ Timer ${scheduleId} erfolgreich aktualisiert.`);
        } catch (error) {
            console.error(`❌ Fehler beim Aufruf von scheduler.edit:`, error);
            alert(`Fehler beim Aktualisieren des Timers:\n\n${error.message}`);
        }
    }


    async getUserContext() {
        try {
            // Direkte WebSocket API-Nutzung statt Import
            const user = await this._hass.callWS({ type: 'auth/current_user' });
            console.log('✅ WebSocket user call successful:', user);
            return user.id || this.sanitizeUserForLabel(user.name) || 'unknown';
        } catch (error) {
            console.warn('❌ WebSocket user call failed, using fallback:', error);
            const hassUser = this._hass.user;
            return hassUser?.name ? this.sanitizeUserForLabel(hassUser.name) : 'unknown';
        }
    }
    
    sanitizeUserForLabel(userString) {
        return userString
            .toLowerCase()
            .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_-]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
    }
    
    async getFavoriteLabel() {
        const userContext = await this.getUserContext();
        return `fas-${userContext}`;
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
