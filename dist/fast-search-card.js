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
        
        // Neue State-Variablen für Liquid Glass
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
                /* Angepasste Farben für den neuen Glas-Effekt */
                --glass-primary: rgba(255, 255, 255, 0.15); /* Weniger transparent für "milchiger" */
                --glass-secondary: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                --glass-blur: blur(20px); /* Basis-Unschärfe-Wert */
                --accent: #007AFF;
                --accent-light: rgba(0, 122, 255, 0.15);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                
                /* Neue CSS-Variablen für dynamische Effekte */
                --mouse-x: 50%;
                --mouse-y: 50%;
                --scroll-progress: 0; /* 0 beim oberen Ende, 1 beim unteren Ende */
                --tilt-x: 0deg;
                --tilt-y: 0deg;
                
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
                /* Dynamischer Hintergrund mit radialem Lichteffekt */
                background: 
                    radial-gradient(circle at var(--mouse-x) var(--mouse-y), 
                        rgba(255, 255, 255, 0.3) 0%, /* Heller Punkt am Mauszeiger */
                        rgba(255, 255, 255, 0.15) 30%, 
                        rgba(255, 255, 255, 0.1) 70%,
                        rgba(255, 255, 255, 0.08) 100% /* Basis-Glasfarbe */
                    ),
                    linear-gradient(135deg, /* Statischer Gradient als Fallback/zusätzlicher Effekt */
                        rgba(255, 255, 255, 0.25) 0%, 
                        rgba(255, 255, 255, 0.1) 100%
                    );
                
                /* Dynamischer Backdrop-Filter basierend auf Scroll-Position */
                backdrop-filter: blur(calc(20px + var(--scroll-progress) * 10px)) saturate(1.8);
                -webkit-backdrop-filter: blur(calc(20px + var(--scroll-progress) * 10px)) saturate(1.8);
                
                border: 1px solid transparent; /* Border wird über ::after animiert */
                border-radius: 24px;
                box-shadow: var(--glass-shadow);
                position: relative;
                transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease-out; /* Transform für Tilt-Effekt */
                max-height: 72px; 
                overflow: hidden; /* Muss hier bleiben, um Pseudo-Elemente zu maskieren */
                display: flex; 
                flex-direction: column; 
                
                /* Performance-Optimierungen */
                will-change: transform, max-height, backdrop-filter; 
                backface-visibility: hidden; 
                transform: perspective(1000px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); /* 3D-Tilt */
            }

            .search-panel.expanded {
                max-height: 400px;
                overflow-y: auto; /* Haupt-Scrolling für den Inhalt */
                -webkit-overflow-scrolling: touch; /* Flüssigeres Scrolling auf iOS */
            }

            /* Chromatic Aberration Border (::before) */
            .search-panel::before {
                content: '';
                position: absolute;
                inset: -1px; /* Erzeugt einen leichten Überhang */
                background: linear-gradient(45deg, 
                    rgba(255, 100, 100, 0.15) 0%, /* Rot */
                    rgba(100, 255, 100, 0.15) 33%, /* Grün */
                    rgba(100, 100, 255, 0.15) 66%, /* Blau */
                    rgba(255, 100, 255, 0.15) 100% /* Magenta */
                );
                border-radius: 25px; /* Etwas größer als Panel-Radius */
                filter: blur(0.5px); /* Leichte Unschärfe für den Effekt */
                z-index: -1; /* Hinter dem Panel-Inhalt */
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none; /* Interaktionen durchlassen */
                will-change: opacity, transform;
            }

            .search-panel:hover::before {
                opacity: 1; /* Sichtbar beim Hover */
            }

            /* Animated Gradient Border (::after) */
            .search-panel::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    var(--border-angle, 0deg), /* CSS-Variable für Animation */
                    rgba(255, 255, 255, 0.4) 0%,
                    rgba(255, 255, 255, 0.1) 25%,
                    rgba(0, 122, 255, 0.3) 50%, /* Akzentfarbe in der Mitte */
                    rgba(255, 255, 255, 0.1) 75%,
                    rgba(255, 255, 255, 0.4) 100%
                );
                border-radius: 24px;
                padding: 1px; /* Erzeugt den Rahmen um das Panel */
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: xor; /* Maskiert den Bereich innerhalb des Paddings */
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                opacity: 0;
                transition: opacity 0.3s ease;
                animation: borderRotate 3s linear infinite; /* Animation des Winkels */
                pointer-events: none; /* Interaktionen durchlassen */
                will-change: background, opacity;
            }

            .search-panel.expanded::after {
                opacity: 1; /* Sichtbar, wenn Panel erweitert ist */
            }

            @keyframes borderRotate {
                0% { --border-angle: 0deg; }
                100% { --border-angle: 360deg; }
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                /* Hintergrund des Wrappers muss transparent sein, 
                   damit der backdrop-filter des Eltern-Panels durchscheint */
                background: transparent; 
                position: sticky; /* Suchleiste bleibt oben kleben */
                top: 0; 
                z-index: 1; /* Über dem Scroll-Inhalt */
                will-change: transform;
                backface-visibility: hidden;
            }

            /* Scrollbarer Bereich für Subkategorien und Ergebnisse */
            .scrollable-content {
                flex: 1;
                min-height: 0; /* Ermöglicht das Schrumpfen im Flex-Container */
                overflow-y: hidden; /* Verhindert doppelte Scrollbalken, 
                                     da scrolling auf .search-panel.expanded ist */
                overflow-x: hidden;
            }

            .subcategories {
                display: flex;
                gap: 8px;
                padding: 16px 20px;
                overflow-x: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
                -webkit-overflow-scrolling: touch; /* Optimiert das Scrolling in WebKit */
                transition: all 0.3s ease;
                flex-shrink: 0; 
                background-color: transparent; /* Muss transparent sein */
                will-change: transform, scroll-position; 
                backface-visibility: hidden;
                transform: translateZ(0); /* Erzwingt Hardware-Beschleunigung für das Scrolling-Element selbst */
            }

            .subcategories::-webkit-scrollbar {
                display: none;
            }

            .subcategory-chip {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1); /* Leicht transparent */
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
                transform: translateZ(0); /* Für Hardware-Beschleunigung */
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
                height: auto;
                overflow: visible; /* Container selbst nicht scrollbar, Parent übernimmt */
                background-color: transparent; /* Muss transparent sein */
                will-change: transform; /* Für Performance */
                backface-visibility: hidden;
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
                background-color: transparent; /* Muss transparent sein */
            }

            .area-header:first-child {
                margin-top: 0;
            }

            .device-card {
                /* Dynamischer Hintergrund mit radialem Lichteffekt für Karten */
                background: 
                    radial-gradient(circle at var(--card-mouse-x, 50%) var(--card-mouse-y, 50%), 
                        rgba(255, 255, 255, 0.2) 0%, 
                        rgba(255, 255, 255, 0.08) 50% /* Basis-Kartenfarbe */
                    );
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
                
                backdrop-filter: blur(10px); /* Leichter Backdrop-Filter für Karten */
                -webkit-backdrop-filter: blur(10px);
                
                /* Performance-Optimierung für 3D-Effekte */
                transform: translateZ(0); 
                will-change: transform, backdrop-filter;
                backface-visibility: hidden;
            }

            /* Card Displacement/Highlight Effect (::before) */
            .device-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at var(--card-mouse-x, 50%) var(--card-mouse-y, 50%), 
                        rgba(255, 255, 255, 0.2) 0%, /* Heller Punkt beim Hover */
                        transparent 60%
                    );
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none; /* Interaktionen durchlassen */
                will-change: opacity;
            }

            .device-card:hover::before {
                opacity: 1;
            }

            /* Card Chromatic Aberration (::after) */
            .device-card::after {
                content: '';
                position: absolute;
                inset: -0.5px; /* Leichter Überhang */
                background: linear-gradient(135deg, 
                    rgba(255, 0, 100, 0.1) 0%, /* Rot */
                    rgba(0, 255, 150, 0.1) 50%, /* Grün */
                    rgba(100, 0, 255, 0.1) 100% /* Blau */
                );
                border-radius: 17px; /* Etwas größer als Karten-Radius */
                filter: blur(0.3px); /* Leichte Unschärfe für den Effekt */
                z-index: -1; /* Hinter der Karte */
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none; /* Interaktionen durchlassen */
                will-change: opacity, transform;
            }

            .device-card:hover::after {
                opacity: 1;
            }

            .device-card:hover {
                transform: translateY(-2px) scale(1.02) translateZ(10px); /* Leichter 3D-Effekt */
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.15),
                    0 0 20px rgba(0, 122, 255, 0.1); /* Leichter blauer Schatten */
                backdrop-filter: blur(15px); /* Stärkere Unschärfe beim Hover */
                -webkit-backdrop-filter: blur(15px);
            }

            .device-card.active {
                background: 
                    radial-gradient(circle at var(--card-mouse-x, 50%) var(--card-mouse-y, 50%), 
                        rgba(0, 122, 255, 0.3) 0%, 
                        var(--accent-light) 50% /* Akzentfarbe beim Aktiv-Zustand */
                    );
                border-color: var(--accent);
                box-shadow: 
                    0 4px 20px rgba(0, 122, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 30px rgba(0, 122, 255, 0.15);
                transform: translateZ(20px); /* Noch stärkerer 3D-Effekt */
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

            /* Detail View Styles (angepasst für ähnlichen Glas-Look) */
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
                will-change: transform, backdrop-filter;
                backface-visibility: hidden;
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
                position: sticky; /* Sticky Header */
                top: 0;
                left: 0;
                right: 0;
                z-index: 10;
                background: inherit; /* Erbt Hintergrund vom Detail-Panel */
                backdrop-filter: inherit; /* Erbt Backdrop-Filter */
                -webkit-backdrop-filter: inherit;
                will-change: transform, backdrop-filter;
                backface-visibility: hidden;
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
                flex-direction: column; /* Neu: Inhalte vertikal anordnen */
                height: 100%;
                padding: 20px; /* Padding hier, nicht auf children */
                padding-top: 80px; /* Platz für den Sticky Header */
                overflow-y: auto; /* Inhalt des Detail-Panels scrollbar machen */
                -webkit-overflow-scrolling: touch;
                will-change: scroll-position;
                backface-visibility: hidden;
            }

            .detail-left, .detail-right {
                flex: none; /* Flex-Verhalten anpassen */
                width: 100%; /* Breitenanpassung */
                height: auto; /* Höhenanpassung */
                padding: 0; /* Padding wird von .detail-content gesteuert */
            }

            .detail-divider {
                width: 100%; /* Volle Breite */
                height: 1px;
                background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent); /* Horizontaler Divider */
                margin: 20px 0; /* Abstand */
            }

            /* Category Buttons */
            .category-buttons {
                display: none;
                flex-direction: column;
                gap: 12px;
                opacity: 0;
                transform: translateX(20px);
                will-change: transform, opacity; 
                backface-visibility: hidden;
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
                will-change: transform, backdrop-filter; 
                backface-visibility: hidden;
            }

            .category-button:hover {
                transform: scale(1.05);
                border-color: var(--accent);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
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
            @media (max-width: 480px) {
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
            }
            </style>

            <div class="main-container">
                <div class="search-row">
                    <div class="search-panel">
                        <div class="glass-reflection"></div> <!-- Neuer Layer für Reflexionen -->
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
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        const mainContainer = this.shadowRoot.querySelector('.main-container');

        // Maus-Tracking für Liquid Glass Effekte
        mainContainer.addEventListener('mousemove', (e) => {
            const rect = searchPanel.getBoundingClientRect();
            // X und Y Position der Maus relativ zum Element in Prozent
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Aktualisiere CSS-Variablen für Mausposition
            searchPanel.style.setProperty('--mouse-x', `${x}%`);
            searchPanel.style.setProperty('--mouse-y', `${y}%`);
            
            // 3D-Tilt Effekt
            const tiltX = (y - 50) / 10; // -5 bis +5 Grad
            const tiltY = (x - 50) / 10; // -5 bis +5 Grad
            searchPanel.style.setProperty('--tilt-x', `${tiltX}deg`);
            searchPanel.style.setProperty('--tilt-y', `${tiltY}deg`);
        });

        // Tilt auf 0 zurücksetzen, wenn die Maus das Element verlässt
        mainContainer.addEventListener('mouseleave', () => {
            searchPanel.style.setProperty('--tilt-x', '0deg');
            searchPanel.style.setProperty('--tilt-y', '0deg');
        });

        // Scroll-Fortschritt-Tracking für dynamische Unschärfe
        searchPanel.addEventListener('scroll', (e) => {
            const scrollTop = e.target.scrollTop;
            const scrollHeight = e.target.scrollHeight - e.target.clientHeight;
            // Berechne Fortschritt von 0 (oben) bis 1 (unten)
            const scrollProgress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
            
            searchPanel.style.setProperty('--scroll-progress', scrollProgress);
        });

        // Device card Maus-Tracking für individuelle Lichteffekte
        this.shadowRoot.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.device-card');
            if (card) {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                card.style.setProperty('--card-mouse-x', `${x}%`);
                card.style.setProperty('--card-mouse-y', `${y}%`);
            }
        });


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
        // Keine setTimeout-Verzögerung mehr, um die Reaktionszeit zu verbessern
        this.expandPanel();
        this.showCurrentCategoryItems();
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
            
            // Then filter by search term, including item.area
            return item.name.toLowerCase().includes(searchTerm) ||
                   item.id.toLowerCase().includes(searchTerm) ||
                   item.area.toLowerCase().includes(searchTerm); // Hinzugefügt: Suche nach Raum
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
                this.activeSubcategory = this.previousSearchState.activeSubcategory; // Wichtig für die Wiederherstellung des aktiven Chips
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
