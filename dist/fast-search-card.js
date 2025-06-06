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
        
        // More-Info Dialog Konfiguration
        this.moreInfoConfig = {
            showAttributes: config.show_attributes !== false, // Standard: true
            showControls: config.show_controls !== false,     // Standard: true
            showHistory: config.show_history === true,        // Standard: false
            customActions: config.custom_actions || [],        // Benutzerdefinierte Aktionen
            displayMode: config.more_info_mode || 'popup', // Neue Option: 'popup' oder 'replace' 
        };
        
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
                    
                    /* Glassmorphism Container - Neuer Hintergrund */
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        inset 0 1px 1px rgba(255, 255, 255, 0.2);
                    padding: 0;
                    overflow: hidden;
                }                
                .search-container {
                    background: transparent;
                    border-radius: 0;
                    box-shadow: none;
                    overflow: hidden;
                }                

                .search-section {
                    background: transparent;
                    padding: 24px;
                }


                .search-header {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    justify-content: space-between;
                }                

                .view-toggle {
                    display: flex;
                    gap: 4px;
                }

                .view-toggle-btn {
                    background: rgba(0, 0, 0, 0.15);
                    border: none;
                    border-radius: 60px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .view-toggle-btn:hover:not(.active) {
                    background: rgba(0, 0, 0, 0.25);
                    transform: scale(1.05);
                }
                
                .view-toggle-btn.active {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                }

                .search-input-container {
                    flex: 1;
                    position: relative;
                }
                
                .search-input {
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 16px;
                    font-size: 16px;
                    outline: none;
                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                    box-sizing: border-box;
                    color: white;
                }                
                
                .search-input:focus {
                    background: rgba(0, 0, 0, 0.25);
                    box-shadow: 
                        inset 0 2px 8px rgba(0,0,0,0.15),
                        0 0 0 2px rgba(255, 255, 255, 0.2);
                }
                
                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                /* Typing indicator */
                .search-input.typing::after {
                    content: '';
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    width: 4px;
                    height: 4px;
                    background: #007aff;
                    border-radius: 50%;
                    animation: typing 1.5s infinite;
                }

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



                .filter-button {
                    background: rgba(0, 0, 0, 0.15);
                    border: none;
                    border-radius: 60px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: rgba(255, 255, 255, 0.8);
                    position: relative;
                }
                
                .filter-button:hover {
                    background: rgba(0, 0, 0, 0.25);
                    transform: scale(1.05);
                    
                }

                .filter-button:hover:not(.active) {
                    background: rgba(0, 0, 0, 0.25);
                    transform: scale(1.05);
                }
                
                
                .filter-button.active {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                }

                .filter-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #ff4444;
                    color: white;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                    min-width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.2s ease;
                }
                
                .filter-badge.active {
                    opacity: 1;
                    transform: scale(1);
                }                

                .filter-section {
                    padding: 0 24px 24px 24px;
                    background: transparent;
                }


                
                .active-filters {
                    padding: 8px 24px 0 24px;
                    background: transparent;
                }
                
                .active-filters-container {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    align-items: center;
                    padding-bottom: 12px;
                }
                
                .active-filter-tag {
                    display: flex;
                    align-items: center;
                    background: #4285f4;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                    gap: 6px;
                    animation: slideInTag 0.3s ease-out;
                }
                
                .active-filter-tag .tag-remove {
                    background: rgba(255, 255, 255, 0.3);
                    border: none;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 10px;
                    color: white;
                    transition: all 0.2s;
                }
                
                .active-filter-tag .tag-remove:hover {
                    background: rgba(255, 255, 255, 0.5);
                    transform: scale(1.1);
                }
                
                .active-filter-tag.removing {
                    animation: slideOutTag 0.2s ease-in forwards;
                }
                
                @keyframes slideInTag {
                    from {
                        opacity: 0;
                        transform: translateX(-20px) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                
                @keyframes slideOutTag {
                    to {
                        opacity: 0;
                        transform: translateX(-20px) scale(0.8);
                    }
                }
                

                .filter-row {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding: 4px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .filter-row::-webkit-scrollbar {
                    display: none;
                }

                .filter-chip {
                    background: rgba(0, 0, 0, 0.15);
                    border: none;
                    border-radius: 60px;
                    padding: 12px 20px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    cursor: pointer;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    font-weight: 500;
                    flex-shrink: 0;
                }
                
                .filter-chip:hover {
                    background: rgba(0, 0, 0, 0.25);
                }
                
                .filter-chip.active {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                }
                
                .filter-chip.all {
                    background: rgba(0, 0, 0, 0.15);
                }

                .filter-chip.all:hover {
                    background: rgba(0, 0, 0, 0.25);
                }                
                
                .filter-chip.all.active {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.15);
                    color: white;
                }
                
                .chip-icon {
                    font-size: 16px;
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

                .chip-name {
                    line-height: 1.2;
                }
                
                .chip-count {
                    font-size: 12px;
                    opacity: 0.8;
                    margin-top: 0px;
                }

                /* Eingangs-Animationen */
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

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
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

                /* Card fade-in Animation */
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

                /* Typing indicator */
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

                /* Loading dots */
                @keyframes loadingDots {
                    0%, 20% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                }

                /* Elastic focus */
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

                /* Hover glow */
                @keyframes hoverGlow {
                    0% {
                        box-shadow: 0 0 0 rgba(0, 122, 255, 0);
                    }
                    100% {
                        box-shadow: 0 0 20px rgba(0, 122, 255, 0.3);
                    }
                }

                /* Animation für Suchergebnisse */
                .results-container {
                    max-height: 600px;
                    overflow-y: auto;
                }

                .results-container.loading {
                    animation: slideInFromBottom 0.4s ease-out;
                }

                /* Grid View Styles */
                .grid-container {
                    padding: 20px;
                    animation: slideInFromBottom 0.4s ease-out;
                }

                .grid-scroll {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding: 4px 0 20px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .grid-scroll::-webkit-scrollbar {
                    display: none;
                }

                .grid-item {
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 12px;
                    padding: 16px;
                    min-width: 140px;
                    max-width: 180px;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    height: 120px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    will-change: transform, box-shadow;
                }

                /* Animation nur für neue Grid-Items beim ersten Laden */
                .grid-item.fade-in {
                    opacity: 0;
                    animation: fadeInStagger 0.5s ease-out forwards;
                }

                /* Stagger-Delays für Grid-Items - nur bei fade-in Klasse */
                .grid-item.fade-in:nth-child(1) { animation-delay: 0.1s; }
                .grid-item.fade-in:nth-child(2) { animation-delay: 0.15s; }
                .grid-item.fade-in:nth-child(3) { animation-delay: 0.2s; }
                .grid-item.fade-in:nth-child(4) { animation-delay: 0.25s; }
                .grid-item.fade-in:nth-child(5) { animation-delay: 0.3s; }
                .grid-item.fade-in:nth-child(6) { animation-delay: 0.35s; }
                .grid-item.fade-in:nth-child(7) { animation-delay: 0.4s; }
                .grid-item.fade-in:nth-child(8) { animation-delay: 0.45s; }
                .grid-item.fade-in:nth-child(9) { animation-delay: 0.5s; }
                .grid-item.fade-in:nth-child(10) { animation-delay: 0.55s; }

                .grid-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    background: rgba(0, 0, 0, 0.25);
                }

                .grid-item.active {
                    background: rgba(255, 255, 255, 0.15);
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
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.2;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .grid-item-state {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.1;
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
                    color: rgba(255, 255, 255, 0.9);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                    padding: 0 4px;
                }

                @media (max-width: 768px) {
                    .grid-item {
                        min-width: 120px;
                        max-width: 150px;
                    }
                }

                /* List View Styles */

                .room-group {
                    margin-bottom: 24px;
                }

                .room-header {
                    padding: 12px 20px;

                    
                    font-weight: 600;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .item {
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: background-color 0.2s;
                    margin-left: 0;
                    cursor: pointer;
                    margin: 10px 20px 10px 20px;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 20px;
                }

                .item:hover {
                    background: rgba(0, 0, 0, 0.25);
                }
                
                .item.active {
                    background: rgba(255, 255, 255, 0.15);
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
                    gap: 0px;
                }

                .item-name {
                    font-weight: 500;
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.2;
                }

                .item-state {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
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

                /* Loading dots component */
                .loading-dots {
                    display: inline-flex;
                    gap: 4px;
                    margin-left: 8px;
                }

                .loading-dot {
                    width: 4px;
                    height: 4px;
                    background: #007aff;
                    border-radius: 50%;
                    animation: loadingDots 1.4s infinite;
                }

                .loading-dot:nth-child(1) { animation-delay: 0s; }
                .loading-dot:nth-child(2) { animation-delay: 0.2s; }
                .loading-dot:nth-child(3) { animation-delay: 0.4s; }

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

                /* More-Info Dialog Styles */
                .more-info-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .more-info-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                .more-info-dialog {
                    /* Glassmorphism Container - Gleich wie Hauptkarte */
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        inset 0 1px 1px rgba(255, 255, 255, 0.2);
                    
                    max-width: 500px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    transform: scale(0.9) translateY(20px);
                    transition: all 0.3s ease;
                    position: relative;
                    padding: 0;
                }

                .more-info-overlay.active .more-info-dialog {
                    transform: scale(1) translateY(0);
                }

                .more-info-header {
                    background: transparent;
                    color: white;
                    padding: 24px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .more-info-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(0, 0, 0, 0.15);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 18px;
                }

                .more-info-close:hover {
                    background: rgba(0, 0, 0, 0.25);
                    color: white;
                    transform: scale(1.1);
                }

                .more-info-icon {
                    font-size: 32px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .more-info-title {
                    flex: 1;
                }

                .more-info-name {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                    line-height: 1.2;
                    color: white;
                }
                
                .more-info-type {
                    font-size: 14px;
                    opacity: 0.8;
                    margin: 4px 0 0 0;
                    color: rgba(255, 255, 255, 0.7);
                }

                .more-info-content {
                    padding: 0;
                    max-height: calc(80vh - 120px);
                    overflow-y: auto;
                    background: transparent;
                }
                
                .more-info-section {
                    padding: 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: transparent;
                }

                .more-info-section:last-child {
                    border-bottom: none;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0 0 16px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .state-display {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .state-value {
                    font-size: 28px;
                    font-weight: 700;
                    color: #007aff;
                    flex: 1;
                }

                .state-unit {
                    font-size: 16px;
                    color: #666;
                    font-weight: 400;
                }

                .state-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .state-badge.on {
                    background: #e3f2fd;
                    color: #1976d2;
                }

                .state-badge.off {
                    background: #f5f5f5;
                    color: #666;
                }

                .attribute-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }

                .attribute-item {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 16px;
                    border-left: 4px solid rgba(255, 255, 255, 0.3);
                }
                
                .attribute-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                
                .attribute-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    word-break: break-word;
                }

                .control-section {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .control-button {
                    flex: 1;
                    min-width: 120px;
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .control-button:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-1px);
                }
                
                .control-button.secondary {
                    background: rgba(0, 0, 0, 0.15);
                    color: rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .control-button.secondary:hover {
                    background: rgba(0, 0, 0, 0.25);
                    color: white;
                }

                .slider-control {
                    margin-top: 16px;
                }

                .slider-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(255, 255, 255, 0.2);
                    outline: none;
                    appearance: none;
                    cursor: pointer;
                }
                
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                @media (max-width: 768px) {
                    .more-info-overlay {
                        padding: 10px;
                    }
                    
                    .more-info-dialog {
                        max-height: 90vh;
                    }
                    
                    .more-info-header {
                        padding: 20px;
                    }
                    
                    .more-info-section {
                        padding: 20px;
                    }
                    
                    .attribute-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .control-section {
                        flex-direction: column;
                    }
                    
                    .control-button {
                        min-width: auto;
                    }
                }

                /* Replace Mode Styles - HIER EINFÜGEN */
                .more-info-replace {
                    display: none;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden;
                    position: relative;
                }

                .more-info-replace.active {
                    display: block;
                }

                .more-info-replace.active {
                    display: block;
                }
                
                .replace-header {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 10; /* NIEDRIGER z-index */
                    background: transparent;
                    color: white;
                    padding: 16px 20px 16px 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: none;
                    pointer-events: none; /* WICHTIG: Keine Maus-Events blockieren */
                }
                
                .replace-header .back-button {
                    pointer-events: all; /* Nur der Back-Button soll klickbar sein */
                }
                
                .replace-header .breadcrumb {
                    pointer-events: none; /* Breadcrumb nicht klickbar */
                }

                
                .back-button {
                    background: rgba(0, 0, 0, 0.15);
                    border: none;
                    border-radius: 60px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 18px;
                }
                
                .back-button:hover {
                    background: rgba(0, 0, 0, 0.25);
                    transform: scale(1.05);
                }
                
                .breadcrumb {
                    flex: 1;
                    font-size: 14px;
                    opacity: 0.9;
                    line-height: 1.2;
                }
                
                .breadcrumb-path {
                    font-size: 12px;
                    opacity: 0.7;
                    margin-bottom: 0px;
                }
                
                .breadcrumb-current {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .replace-content {
                    display: flex;
                    padding-top: 0;
                    min-height: 50vh;
                    background: transparent;
                }




                
                
                /* Icon Section Background Enhancement - KORRIGIERT */
                .icon-section {
                    flex: 1;
                    background: rgba(0, 0, 0, 0.15); /* NEU: Transparenter schwarzer Hintergrund */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    position: relative;
                    overflow: hidden;
                }
                
                .icon-background {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 60%; /* Kleiner als vorher */
                    height: 60%; /* Kleiner als vorher */
                    transform: translate(-50%, -50%);
                    background-size: cover;
                    background-position: center;
                    filter: none; /* KEIN BLUR MEHR */
                    z-index: 0;
                    transition: all 0.8s ease;
                    border-radius: 20px;
                    
                    /* Eingangsanimation */
                    opacity: 0;
                    animation: fadeInBounce 1.2s ease-out 0.3s forwards;
                }
                
                /* Content über dem Background */
                .icon-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    height: 100%;
                    width: 100%;
                }
                
                /* Device Icon ENTFERNT */
                .device-icon-large {
                    display: none !important;
                }
                
                /* Status Indicator - IMMER links unten */
                .status-indicator-large {
                    position: absolute;
                    bottom: 0px;
                    left: 15px;
                    background: #007aff;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    border: 1px solid #007aff;
                    
                    /* Eingangsanimation */
                    opacity: 0;
                    transform: translateX(-30px);
                    animation: slideInLeft 0.8s ease-out 0.6s forwards;
                }
                
                .status-indicator-large.off {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                /* Quick Stats - Position abhängig vom Zustand */
                .quick-stats {
                    position: absolute;
                    bottom: 0px;
                    z-index: 1;
                    display: flex;
                    flex-direction: row;
                    gap: 8px;
                    
                    /* Eingangsanimation */
                    opacity: 0;
                    animation: slideInRight 0.8s ease-out 0.8s forwards;
                }

                /* Licht AUS: Quick-Stats rechts unten (bleibt unverändert) */
                .icon-content.light-off .quick-stats {
                    right: 20px;
                    text-align: right;
                    transform: translateX(30px);
                }                
                
                /* Licht AN: Quick-Stats neben Status (horizontal) - WEITER RECHTS */
                .icon-content.light-on .quick-stats {
                    right: 20px; /* WEITER rechts - war 200px */
                    flex-direction: row;
                    gap: 8px;
                    transform: translateX(-30px);
                    bottom: 0px; /* Gleiche Höhe wie Status */
                }
                
                .stat-item {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    padding: 8px 12px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                /* Animationen */
                @keyframes fadeInBounce {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    60% {
                        opacity: 0.8;
                        transform: translate(-50%, -50%) scale(1.05);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                @keyframes slideInLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideInRight {
                    0% {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                


                /* Mobile Responsive - BEREINIGT */
                @media (max-width: 768px) {
                    .icon-section {
                        min-height: 350px;
                        background: rgba(0, 0, 0, 0.15);
                        position: relative; /* Wichtig für absolute Positionierung */
                    }
                    
                    .icon-background {
                        width: 65%;
                        height: 65%;
                        filter: none;
                    }
                    
                    /* icon-content nicht mehr relativ positionieren */
                    .icon-content {
                        position: static !important;
                    }
                    
                    /* Status-Indicator - NUR EINE REGEL */
                    .status-indicator-large {
                        position: absolute !important;
                        bottom: 60px !important;
                        left: 15px !important;
                        font-size: 12px;
                        padding: 6px 12px;
                        z-index: 1000 !important;
                    }
                    
                    /* Quick-Stats - NUR EINE REGEL */
                    .quick-stats {
                        position: absolute !important;
                        bottom: 20px !important;
                        left: 15px !important;
                        flex-direction: row !important;
                        gap: 4px !important;
                        z-index: 1000 !important;
                        text-align: left !important;
                    }
                    
                    .stat-item {
                        font-size: 11px;
                        padding: 6px 10px;
                    }
                }







                
                
                .details-section {
                    flex: 1;
                    padding: 30px 25px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                
                .entity-title-large {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.2;
                }
                
                .entity-subtitle-large {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 4px 0 0 0;
                }
                
                .control-group-large {
                    background: transparent;
                    border-radius: 12px;
                    padding: 0px;
                    border-left: 0px solid #007aff;
                }
                
                .control-title-large {
                    font-size: 14px;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0 0 16px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .main-control-large {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .toggle-button-large {
                    flex: 1;
                    background: #007aff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 20px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .toggle-button-large:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                }
                
                .toggle-button-large.off {
                    background: #6c757d;
                }
                
                .toggle-button-large.off:hover {
                    background: #545b62;
                }
                
                .brightness-control-large {
                    margin-top: 16px;
                }
                
                .slider-label-large {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                    color: #666;
                }
                
                .slider-label-large .value {
                    font-weight: 600;
                    color: #007aff;
                }
                
                .slider-large {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #ddd;
                    outline: none;
                    appearance: none;
                    cursor: pointer;
                }
                
                .slider-large::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007aff;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                }
                
                .slider-large::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007aff;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                }
                
                .attribute-grid-large {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .attribute-item-large {
                    background: transparent;
                    border: 0px solid #e9ecef;
                    border-radius: 8px;
                    padding: 12px 6px 12px 0px;
                }
                
                .attribute-label-large {
                    font-size: 12px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0px;
                }
                
                .attribute-value-large {
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                }


   



                
                
                /* Responsive für Replace Mode */
                @media (max-width: 768px) {
                    .replace-content {
                        flex-direction: column;
                        min-height: auto;
                    }
                    
                    .device-icon-large {
                        font-size: 60px;
                    }
                    
                    .details-section {
                        padding: 20px;
                    }
                }                

                
                /* Accordion Container */
                .accordion-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-top: 0px;
                }
                
                .accordion-item {
                    border: 0px solid #e9ecef;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .accordion-item.active {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .accordion-header {
                    background: transparent;
                    padding: 20px 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s;
                    user-select: none;
                }
                
                .accordion-item.active .accordion-header {
                    background: rgba(0, 0, 0, 0.25);
                }
                
                .accordion-header:hover {
                    background: rgba(0, 0, 0, 0.25);                 
                }
                
                .accordion-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .accordion-icon {
                    font-size: 20px;
                }
                
                .accordion-chevron {
                    font-size: 18px;
                    color: #666;
                    transition: transform 0.3s ease;
                }
                
                .accordion-item.active .accordion-chevron {
                    transform: rotate(180deg);
                }
                
                .accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.4s ease, padding 0.3s ease;
                    background: rgba(0, 0, 0, 0.25);
                }
                
                .accordion-item.active .accordion-content {
                    max-height: 400px;
                    padding: 0px 24px 24px 24px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    scrollbar-width: thin; /* Firefox: Dünne Scrollbar */
                    -webkit-overflow-scrolling: touch; /* iOS: Smooth scroll */                    
                }

                /* Optional: Scrollbar stylen */
                .accordion-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .accordion-content::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                
                .accordion-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }
                
                .accordion-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }                
                
                /* Historische Daten Styles */
                .history-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .history-tabs {
                    display: flex;
                    gap: 8px;
                    background: #f8f9fa;
                    padding: 4px;
                    border-radius: 12px;
                }
                
                .history-tab {
                    flex: 1;
                    padding: 12px 16px;
                    text-align: center;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .history-tab.active {
                    background: white;
                    color: #007aff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .chart-placeholder {
                    height: 200px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-style: italic;
                    border: 2px dashed #dee2e6;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .log-entries {
                    max-height: 250px;
                    overflow-y: auto;
                    border: 0px solid #e9ecef;
                    border-radius: 12px;
                    background: transparent;
                }
                
                .log-entry {
                    padding: 12px 0px 12px 0px;
                    border-bottom: 1px solid #f1f3f4;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 14px;
                }
                
                .log-entry:last-child {
                    border-bottom: none;
                }
                
                .log-action {
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                }
                
                .log-time {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                }
                
                .log-state {
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .log-state.on {
                    background: #d4edda;
                    color: #155724;
                }
                
                .log-state.off {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .log-loading {
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    background: white;
                }
                
                .log-loading .log-entry {
                    opacity: 0.7;
                    animation: logbookPulse 2s ease-in-out infinite;
                }
                
                .log-entries-container {
                    border: 0px solid #e9ecef;
                    border-radius: 12px;
                    background: transparent;
                    max-height: 250px;
                    overflow-y: auto;
                }
                
                @keyframes logbookPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                
                
                .shortcuts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 12px;
                    margin-top: 8px;
                }
                
                .shortcut-button {
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 16px 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                    min-height: 60px;
                }
                
                .shortcut-button:hover {
                    background: #e9ecef;
                    border-color: #007aff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
                }
                
                .shortcut-button:active {
                    transform: translateY(0);
                }
                
                .shortcut-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .shortcut-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .shortcut-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .shortcut-description {
                    font-size: 12px;
                    color: #666;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .shortcuts-empty {
                    text-align: center;
                    padding: 32px 16px;
                    color: #666;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .shortcuts-empty small {
                    font-size: 12px;
                    opacity: 0.8;
                    line-height: 1.4;
                }
                
                /* Info-Stil für Log-Einträge */
                .log-state.info {
                    background: #d1ecf1;
                    color: #0c5460;
                }
                
                @media (max-width: 768px) {
                    .shortcuts-grid {
                        grid-template-columns: 1fr;
                    }
                }
                

            
                /* Filter Menu Overlay */
                .filter-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: none;
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .filter-overlay.active {
                    display: flex;
                    opacity: 1;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                
                .filter-menu {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    max-width: 500px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    transform: scale(0.9);
                    transition: all 0.3s ease;
                }
                
                .filter-overlay.active .filter-menu {
                    transform: scale(1);
                }
                
                .filter-menu-header {
                    padding: 24px;
                    border-bottom: 1px solid #f1f3f4;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .filter-menu-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #202124;
                    margin: 0;
                }
                
                .close-button {
                    background: rgba(0, 0, 0, 0.08);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #5f6368;
                }
                
                .close-button:hover {
                    background: rgba(0, 0, 0, 0.12);
                }
                
                .filter-menu-content {
                    padding: 24px;
                    max-height: calc(80vh - 160px);
                    overflow-y: auto;
                }
                
                .filter-section-menu {
                    margin-bottom: 32px;
                }
                
                .filter-section-menu:last-child {
                    margin-bottom: 0;
                }
                
                .filter-section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #5f6368;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                }
                
                .filter-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }
                
                .filter-option {
                    background: #f8f9fa;
                    border: 2px solid transparent;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .filter-option:hover {
                    background: #e8eaed;
                }
                
                .filter-option.selected {
                    background: rgba(66, 133, 244, 0.1);
                    border-color: #4285f4;
                }
                
                .filter-option-icon {
                    font-size: 20px;
                    width: 32px;
                    height: 32px;
                    background: white;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .filter-option-info {
                    flex: 1;
                }
                
                .filter-option-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #202124;
                    margin-bottom: 2px;
                }
                
                .filter-option-count {
                    font-size: 12px;
                    color: #5f6368;
                }
                
                .filter-actions {
                    padding: 16px 24px;
                    border-top: 1px solid #f1f3f4;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .filter-action-button {
                    background: #f8f9fa;
                    color: #5f6368;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .filter-action-button:hover {
                    background: #e8eaed;
                }
                
                .filter-action-button.primary {
                    background: #4285f4;
                    color: white;
                }
                
                .filter-action-button.primary:hover {
                    background: #3367d6;
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .filter-overlay {
                        padding: 10px;
                    }
                    
                    .filter-menu {
                        max-height: 90vh;
                    }
                    
                    .filter-menu-header {
                        padding: 20px;
                    }
                    
                    .filter-menu-content {
                        padding: 20px;
                    }
                    
                    .filter-options {
                        grid-template-columns: 1fr;
                    }
                }


                
                .music-assistant-search {
                    margin-top: 20px;
                    padding: 0;
                    border: none;
                    border-radius: 0;
                    background: transparent;
                }
                
                .ma-search-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    container-type: inline-size;
                }
                
                .ma-search-bar-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .ma-search-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    background: rgba(0, 0, 0, 0.15);
                    color: rgba(255, 255, 255, 0.9);
                    box-sizing: border-box;
                    transition: all 0.2s;
                }
                
                .ma-search-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .ma-search-input:focus {
                    outline: none;
                    background: rgba(0, 0, 0, 0.25);
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
                }
                
                .ma-enqueue-mode {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    align-self: flex-start;
                }
                
                .ma-enqueue-mode:hover {
                    background: rgba(0, 0, 0, 0.25);
                }
                
                .ma-enqueue-icon {
                    font-size: 14px;
                }
                
                .ma-enqueue-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .ma-filter-container {
                    display: flex;
                    gap: 4px;
                    overflow-x: auto;
                    padding: 4px 0;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .ma-filter-container::-webkit-scrollbar {
                    display: none;
                }
                
                .ma-filter-chip {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    flex-shrink: 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .ma-filter-chip:hover:not(.ma-filter-active) {
                    background: rgba(0, 0, 0, 0.25);
                }
                
                .ma-filter-chip.ma-filter-active {
                    background: rgba(255, 255, 255, 0.15);
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .ma-filter-icon {
                    font-size: 16px;
                }
                
                .ma-search-results {
                    min-height: 200px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .ma-grid-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 16px;
                    padding: 16px 0;
                }
                
                .ma-grid-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                    border-radius: 8px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .ma-grid-item:hover {
                    transform: translateY(-4px);
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .ma-grid-image {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    background: rgba(0, 0, 0, 0.3);
                    margin-bottom: 8px;
                    object-fit: cover;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                
                .ma-grid-image img {
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                    object-fit: cover;
                }
                
                .ma-grid-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    line-height: 1.2;
                    width: 100%;
                }
                
                .ma-grid-artist {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    width: 100%;
                    margin-top: 4px;
                }
                
                .ma-list-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 16px 0;
                }
                
                .ma-list-item {
                    display: grid;
                    grid-template-columns: 50px 1fr auto;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .ma-list-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .ma-list-image {
                    width: 50px;
                    height: 50px;
                    border-radius: 4px;
                    background: rgba(0, 0, 0, 0.3);
                    object-fit: cover;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                
                .ma-list-image img {
                    width: 100%;
                    height: 100%;
                    border-radius: 4px;
                    object-fit: cover;
                }
                
                .ma-list-info {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .ma-list-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .ma-list-artist {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .ma-category-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin: 20px 0 12px 0;
                    cursor: pointer;
                }
                
                .ma-category-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0;
                }
                
                .ma-category-chevron {
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .ma-loading, .ma-no-results {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.7);
                    padding: 40px 20px;
                    font-style: italic;
                }
                
                .ma-empty-state {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 40px 20px;
                    font-size: 14px;
                }


                /* Text-to-Speech Styles - NACH den bestehenden .ma-empty-state Styles einfügen */
                .tts-section {
                    margin-top: 24px;
                    padding: 0px;
                    background: transparent;
                    border-radius: 12px;
                    border-left: 0px solid #007aff;
                }
                
                .tts-input-container {
                    margin-bottom: 16px;
                }
                
                .tts-textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    resize: vertical;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                
                .tts-textarea:focus {
                    outline: none;
                    border-color: #007aff;
                    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
                }
                
                .tts-counter {
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                    margin-top: 4px;
                }
                
                .tts-counter.warning {
                    color: #ff6b35;
                    font-weight: 600;
                }
                
                .tts-controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .tts-language-select {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    background: white;
                    cursor: pointer;
                }
                
                .tts-speak-button {
                    background: #007aff;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 100px;
                    justify-content: center;
                }
                
                .tts-speak-button:hover {
                    background: #0056b3;
                }
                
                .tts-speak-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .tts-speak-button.speaking {
                    background: #ff4444;
                }
                
                .tts-speak-button.speaking:hover {
                    background: #cc3333;
                }
                
                .tts-presets {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 8px;
                }
                
                .tts-preset-button {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .tts-preset-button:hover {
                    background: #f0f0f0;
                    border-color: #007aff;
                }
                
                .tts-preset-button:active {
                    transform: translateY(1px);
                }
                
                @media (max-width: 768px) {
                    .tts-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .tts-presets {
                        grid-template-columns: 1fr;
                    }
                }

                /* Media Player Tab System */
                .media-tabs-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .media-tabs {
                    display: flex;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 12px;
                    padding: 4px;
                    margin-bottom: 20px;
                    gap: 4px;
                }
                
                .media-tab {
                    flex: 1;
                    padding: 12px 16px;
                    text-align: center;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .media-tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .media-tab.active {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .media-tab-icon {
                    font-size: 16px;
                }
                
                .media-tab-content {
                    flex: 1;
                    display: none;
                    animation: fadeInTab 0.3s ease-out;
                }
                
                .media-tab-content.active {
                    display: block;
                }
                
                @keyframes fadeInTab {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .media-tab {
                        padding: 10px 8px;
                        font-size: 12px;
                    }
                    
                    .media-tab-icon {
                        font-size: 14px;
                    }                    
                }


                /* ===== MORE-INFO POPUP TAB SYSTEM ===== */
                .more-info-tabs-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .more-info-tabs {
                    display: flex;
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 12px;
                    padding: 4px;
                    margin-bottom: 20px;
                    gap: 4px;
                    flex-shrink: 0;
                }
                
                .more-info-tab {
                    flex: 1;
                    padding: 12px 16px;
                    text-align: center;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .more-info-tab:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .more-info-tab.active {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .more-info-tab-icon {
                    font-size: 16px;
                }
                
                .more-info-tab-content {
                    flex: 1;
                    display: none;
                    animation: fadeInMoreInfoTab 0.3s ease-out;
                    overflow-y: auto;
                }
                
                .more-info-tab-content.active {
                    display: block;
                }
                
                @keyframes fadeInMoreInfoTab {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                
                /* Replace Mode spezifische Anpassungen */
                .replace-content .ma-search-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                
                .replace-content .ma-search-results {
                    flex: 1;
                    max-height: none;
                    min-height: 300px;
                }
                
                /* Mobile Responsiveness für Replace Mode */
                @media (max-width: 768px) {
                    .replace-media-tab {
                        padding: 12px 10px;
                        font-size: 13px;
                    }
                    
                    .replace-media-tab-icon {
                        font-size: 16px;
                    }
                    
                    .replace-content {
                        flex-direction: column;
                    }
                    
                    .details-section {
                        padding: 20px 15px;
                    }
                }


                /* Media Player Container Layout */
                .replace-content.media-player {
                    display: flex;
                    height: auto;
                    padding-top: 0;
                }
                
                .album-container {
                    flex: 1;
                    position: relative;
                    overflow: hidden; /* WICHTIG: Verhindert Overflow */
                    background: transparent;
                }
                
                .details-container {
                    flex: 1;
                    background: transparent;
                    border-left: 0px solid rgba(255, 255, 255, 0.1);
                }
                
                /* Album Background - NUR innerhalb des Album Containers */
                .album-background-blur {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(40px) brightness(0.3) saturate(1.2);
                    z-index: 0;
                    transition: all 0.8s ease;
                    /* KEIN transform: scale mehr! */
                }
                
                /* Album Art Section */
                .album-art-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 0px 20px 0px 20px;
                    position: relative;
                    z-index: 1;
                    height: 100%;
                }


                
                
                .album-cover-large {
                    width: 280px;
                    height: 280px;
                    border-radius: 20px;
                    background-size: cover;
                    background-position: center;
                    background-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 
                        0 20px 60px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.1);
                    margin-bottom: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .album-cover-large::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.1) 0%,
                        rgba(255, 255, 255, 0.05) 50%,
                        rgba(0, 0, 0, 0.1) 100%
                    );
                    border-radius: inherit;
                }
                
                /* Pulsing animation for playing state */
                @keyframes albumPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                .album-cover-large.playing {
                    animation: albumPulse 3s ease-in-out infinite;
                }
                
                /* Now Playing Info */
                .now-playing-info {
                    text-align: center;
                    color: white;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    max-width: 280px;
                }
                
                .song-title-large {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.2;
                    color: white;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .artist-name-large {
                    font-size: 18px;
                    opacity: 0.8;
                    margin-bottom: 6px;
                    color: rgba(255, 255, 255, 0.9);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .album-name-large {
                    font-size: 14px;
                    opacity: 0.6;
                    color: rgba(255, 255, 255, 0.7);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                /* Details Section */
                .details-section.media-player {
                    padding: 20px 25px 30px 25px;
                    height: auto; /* Automatische Höhe */
                    background: transparent; /* Background ist jetzt im details-container */
                }
                
                /* Floating particles for extra atmosphere */
                .floating-particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                
                .particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    animation: float 6s ease-in-out infinite;
                }
                
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0px) rotate(0deg);
                        opacity: 0.3;
                    }
                    50% { 
                        transform: translateY(-20px) rotate(180deg);
                        opacity: 0.8;
                    }
                }
                
                .particle:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; }
                .particle:nth-child(2) { left: 20%; top: 40%; animation-delay: 1s; }
                .particle:nth-child(3) { left: 30%; top: 60%; animation-delay: 2s; }
                .particle:nth-child(4) { left: 40%; top: 80%; animation-delay: 3s; }
                .particle:nth-child(5) { left: 60%; top: 30%; animation-delay: 4s; }
                .particle:nth-child(6) { left: 70%; top: 50%; animation-delay: 5s; }
                .particle:nth-child(7) { left: 80%; top: 70%; animation-delay: 0.5s; }
                .particle:nth-child(8) { left: 90%; top: 90%; animation-delay: 1.5s; }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                
                    .replace-content.media-player {
                        flex-direction: column;
                    }
                    
                    .album-container {
                        height: auto;
                    }     
                    
                    .album-art-section {
                        padding: 70px 20px 30px 20px;
                        height: auto;
                    }
                    
                    .details-section.media-player {
                        padding: 20px 15px;
                        height: auto;           
                    }                        
                    
                    .album-cover-large {
                        width: 200px;
                        height: 200px;
                    }
                    
                    .song-title-large {
                        font-size: 20px;
                    }
                    
                    .artist-name-large {
                        font-size: 16px;
                    }
                }                


                /* NEUES LICHT DESIGN - Komplett Ersatz */
                .new-light-design {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0; /* WICHTIG: Kein Gap zwischen Hauptelementen */
                }
                
                .new-light-header {
                    text-align: center;
                    margin-bottom: 16px; /* Kontrollierter Abstand */
                }
                
                .new-light-name {
                    font-size: 20px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 6px;
                }
                
                .new-light-state {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                }
                
                /* Zentraler Slider */
                .new-light-slider-container {
                    width: 100%;
                    max-width: 280px;
                    position: relative;
                    margin: 0 0 16px 0; /* Nur Abstand nach unten */
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                .new-light-slider-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                }
                
                .new-light-slider-track-container {
                    position: relative;
                    width: 100%;
                    height: 50px;
                    border-radius: 60px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 0px solid rgba(255, 255, 255, 0.15);
                    overflow: hidden;
                }
                
                .new-light-slider-track {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background: #4CAF50;
                    border-radius: 25px;
                    transition: all 0.3s ease;
                    z-index: 1;
                }
                
                .new-light-slider-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    z-index: 3;
                    margin: 0;
                    background: transparent;
                    border: none;
                    outline: none;
                    appearance: none;
                }
                
                /* Runde Buttons Zeile */
                .new-light-controls-row {
                    display: flex;
                    flex-direction: row;
                    gap: 12px;
                    margin-top: 4px;
                    align-items: center; /* Vertikal zentriert */
                    justify-content: center; /* Horizontal zentriert */
                }
                
                .new-light-control-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 0px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                }
                
                .new-light-control-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    transform: scale(1.05);
                }
                
                .new-light-control-btn.active {
                    background: rgba(255, 255, 255, 0.25);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.4);
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                }


                /* Spezielle rote Hintergrundfarbe für aktive Climate Mode Buttons */
                .new-light-control-btn.secondary.active {
                    background: rgba(220, 53, 69, 0.8) !important;
                    color: white !important;
                    border-color: rgba(220, 53, 69, 1) !important;
                    box-shadow: 0 0 15px rgba(220, 53, 69, 0.4) !important;
                }
                
                .new-light-control-btn.secondary.active:hover {
                    background: rgba(220, 53, 69, 0.9) !important;
                    transform: scale(1.05);
                }
                
                
                .new-light-control-btn.power-on {
                    background: rgba(255, 255, 255, 0.9);
                }
                
                .new-light-control-btn.power-off {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.6);
                }
                
                /* Farbpalette */
                .new-light-colors {
                    width: 100%;
                    max-width: 280px;
                    margin: 16px 0 0 0; /* Nur Abstand nach oben */
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transform: translateY(-10px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                .new-light-colors-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    margin-top: 8px;
                }
                
                .new-light-color-preset {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.2s ease;
                    position: relative;
                    justify-self: center;
                }
                
                .new-light-color-preset:hover {
                    transform: scale(1.1);
                    border-color: rgba(255, 255, 255, 0.5);
                }
                
                .new-light-color-preset.active {
                    border-color: white;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
                    transform: scale(1.1);
                }
                
                .new-light-color-preset.active::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    text-shadow: 0 0 4px rgba(0,0,0,0.8);
                }
                
                /* Deaktivierter Zustand */
                .new-light-design.disabled .new-light-slider-container {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                .new-light-design.disabled .new-light-colors {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .new-light-design {
                        padding: 20px;
                        gap: 20px;
                    }
                    
                    .new-light-control-btn {
                        width: 50px;
                        height: 50px;
                        font-size: 20px;
                    }
                    
                    .new-light-controls-row {
                        gap: 12px;
                    }
                    
                    .new-light-color-preset {
                        width: 40px;
                        height: 40px;
                    }
                }


                /* Animationen für versteckte/sichtbare Elemente */
                .new-light-slider-container {
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                .new-light-slider-container.visible {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
                
                .new-light-controls-row {
                    display: none; /* NEU: komplett versteckt */
                    flex-direction: row;
                    gap: 12px;
                    margin: 0; /* KEIN Margin */
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                /* Zusätzliche Buttons (versteckt by default) */
                .new-light-control-btn.secondary {
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                    pointer-events: none;
                }
                
                .new-light-control-btn.secondary.visible {
                    opacity: 1;
                    transform: scale(1);
                    pointer-events: auto;
                }
                
                /* Farbauswahl Button */
                .new-light-color-toggle {
                    background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f, #06d6a0, #118ab2, #8e44ad, #e91e63, #ffffff);
                    background-size: 200% 200%;
                    animation: colorShift 3s ease infinite;
                }
                
                @keyframes colorShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .new-light-color-toggle:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                }
                
                /* Farbpalette Animation */
                .new-light-colors {
                    width: 100%;
                    max-width: 280px;
                    margin: 16px 0 0 0;
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transform: translateY(-10px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                .new-light-colors.visible {
                    max-height: 400px;
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
                
                /* Farb-Preset Stagger Animation */
                .new-light-color-preset {
                    opacity: 0;
                    transform: scale(0.7);
                    transition: all 0.3s ease;
                }
                
                .new-light-colors.visible .new-light-color-preset {
                    opacity: 1;
                    transform: scale(1);
                }
                
                .new-light-colors.visible .new-light-color-preset:nth-child(1) { transition-delay: 0.05s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(2) { transition-delay: 0.1s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(3) { transition-delay: 0.15s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(4) { transition-delay: 0.2s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(5) { transition-delay: 0.25s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(6) { transition-delay: 0.3s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(7) { transition-delay: 0.35s; }
                .new-light-colors.visible .new-light-color-preset:nth-child(8) { transition-delay: 0.4s; }
                
                /* Kompakte Buttons für mehr Platz */
                @media (max-width: 768px) {
                    .new-light-control-btn {
                        width: 50px;
                        height: 50px;
                        font-size: 20px;
                    }
                    
                    .new-light-controls-row {
                        gap: 8px;
                    }
                }


                /* Mittiger Power Button im Aus-Zustand */
                .new-light-power-center {
                    display: none; /* NEU: komplett versteckt */
                    justify-content: center;
                    margin: 0; /* KEIN Margin */
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.4s ease;
                }
                
                .new-light-power-center.visible {
                    display: flex; /* NEU: nur anzeigen wenn visible */
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .new-light-power-center .new-light-control-btn {
                    width: 60px;
                    height: 60px;
                    font-size: 24px;
                }
                
                .new-light-power-center .new-light-control-btn:hover {
                    transform: scale(1.1);                    
                }
                
                /* Controls Row verstecken im Aus-Zustand */
                .new-light-controls-row {
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                
                .new-light-controls-row.visible {
                    display: flex; /* NEU: nur anzeigen wenn visible */
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
                
                /* SMOOTH iOS-STYLE DROPDOWN */
                .dropdown-container {
                    position: relative;
                    width: 100%;
                    max-width: 200px;
                    z-index: 1000; /* HÖHER als replace-header */
                }
                
                .dropdown-button {
                    background: rgba(0, 0, 0, 0.15);
                    border: none;
                    border-radius: 20px;
                    color: white;
                    padding: 16px 20px;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    justify-content: space-between;
                    width: 100%;
                    position: relative;
                    transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* iOS ease-out */
                    opacity: 1;
                    font-family: inherit;
                }
                
                .dropdown-button:hover {
                    background: rgba(0, 0, 0, 0.25);                    
                }
                
                .dropdown-button.open {
                    opacity: 0;
                    pointer-events: none;
                }
                
                .dropdown-icon {
                    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                
                .dropdown-button:hover .dropdown-icon {
                }
                
                .dropdown-menu {
                    position: absolute;
                    top: 0; /* Exakt an gleicher Position wie Button */
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.25);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    border: 0px solid rgba(255, 255, 255, 0.1);
                    z-index: 1001; /* HÖCHSTER */
                    
                    /* Initial State: Unsichtbar und kleiner */
                    opacity: 0;
                    transform: scale(0.85); /* Startet kleiner für dramatischeren Effekt */
                    visibility: hidden;
                    
                    /* iOS spring animation */
                    transition: all 0.55s cubic-bezier(0.16, 1.08, 0.38, 0.98); /* Langsamerer Spring mit Überschwingen */
                    
                    overflow: hidden;
                }
                
                .dropdown-menu.open {
                    opacity: 1;
                    transform: scale(1);
                    visibility: visible;
                }
                
                .dropdown-item {
                    padding: 13px 20px 13px 20px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: none;
                    background: transparent;
                    width: 100%;
                    text-align: left;
                    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    
                    /* Items starten unsichtbar und verschoben */
                    opacity: 0;
                    transform: translateY(-12px) scale(0.9); /* Startet weiter oben und kleiner */
                }
                
                .dropdown-item:hover {
                    background: rgba(255, 255, 255, 0.1);                
                }
                
                .dropdown-item.active {
                    background: rgba(255, 255, 255, 0.2);
                    font-weight: inherit;
                }
                
                .dropdown-item-icon {
                    font-size: 16px;
                    width: 20px;
                    transition: transform 0.2s ease;
                }
                
                .dropdown-item:hover .dropdown-item-icon {
                    transform: scale(1.1);
                }
                
                .replace-dropdown-container .dropdown-item-icon {
                    display: none;
                }
                
                /* Staggered Animation für Items */
                .dropdown-menu.open .dropdown-item {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                
                .dropdown-menu.open .dropdown-item:nth-child(1) { 
                    transition-delay: 0.1s; /* Längere Delays */
                }
                .dropdown-menu.open .dropdown-item:nth-child(2) { 
                    transition-delay: 0.18s; 
                }
                .dropdown-menu.open .dropdown-item:nth-child(3) { 
                    transition-delay: 0.26s; 
                }
                .dropdown-menu.open .dropdown-item:nth-child(4) { 
                    transition-delay: 0.34s; 
                }
                .dropdown-menu.open .dropdown-item:nth-child(5) { 
                    transition-delay: 0.42s; 
                }
                .dropdown-menu.open .dropdown-item:nth-child(6) { 
                    transition-delay: 0.5s; 
                }
                
                /* Closing Animation: Items verschwinden in umgekehrter Reihenfolge */
                .dropdown-menu:not(.open) .dropdown-item {
                    transition-delay: 0s;
                    transition-duration: 0.2s;
                }
                
                .dropdown-menu:not(.open) .dropdown-item:nth-child(1) { 
                    transition-delay: 0.4s; /* Letztes Item verschwindet zuerst */
                }
                .dropdown-menu:not(.open) .dropdown-item:nth-child(2) { 
                    transition-delay: 0.32s; 
                }
                .dropdown-menu:not(.open) .dropdown-item:nth-child(3) { 
                    transition-delay: 0.24s; 
                }
                .dropdown-menu:not(.open) .dropdown-item:nth-child(4) { 
                    transition-delay: 0.16s; 
                }
                .dropdown-menu:not(.open) .dropdown-item:nth-child(5) { 
                    transition-delay: 0.08s; 
                }
                .dropdown-menu:not(.open) .dropdown-item:nth-child(6) { 
                    transition-delay: 0s; /* Erstes Item verschwindet zuletzt */
                }
                
                /* ===== ANDERE ELEMENTE HÖHER SETZEN ===== */
                
                /* More-Info Dialog Basis */
                .more-info-dialog {
                    position: relative;
                    z-index: 100 !important;
                }
                
                .more-info-content {
                    position: relative;
                    z-index: 101 !important;
                }
                
                /* Controls und interaktive Elemente */
                .control-button,
                .ma-search-input,
                .tts-textarea,
                .new-light-control-btn,
                .new-light-slider-input,
                .new-light-color-preset,
                .tts-speak-button,
                .tts-preset-button {
                    position: relative;
                    z-index: 102 !important;
                }
                
                .entity-header-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                    position: relative;
                }
                
                .entity-info {
                    flex: 1;
                    position: relative;
                }
                
                .replace-dropdown-container {
                    flex: 1;
                    display: flex;
                    justify-content: flex-end;
                    position: relative;
                }
                
                @media (max-width: 768px) {
                    .entity-header-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        z-index: 1;
                    }
                    
                    .entity-info {
                        flex: 1;
                        min-width: 0;
                        overflow: hidden;
                        z-index: 1;
                    }
                    
                    .entity-title-large {
                        font-size: 16px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    
                    .entity-subtitle-large {
                        font-size: 11px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        opacity: 0.8;
                    }
                    
                    .replace-dropdown-container {
                        flex: 0 0 auto;
                        margin-left: auto;
                        z-index: 1000; /* HÖHER */
                    }
                    
                    .dropdown-container {
                        max-width: 130px;
                        z-index: 1000; /* HÖHER */
                    }
                    
                    .dropdown-button {
                        min-width: 100px;
                        padding: 8px 12px;
                        font-size: 12px;
                        z-index: 1001; /* HÖCHSTER */
                    }
                    
                    /* Mobile Animation Anpassungen */
                    .dropdown-button {
                        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    }
                    
                    .dropdown-menu {
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                }


                /* Climate Settings Grid - Erweitert */
                .climate-settings-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: 8px 0;
                }
                
                .climate-setting-row {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .climate-setting-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    flex-shrink: 0;
                }
                
                /* Climate Setting Options - Scrollbar verstecken */
                .climate-setting-options {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 4px 0;
                    -webkit-overflow-scrolling: touch;
                    min-height: 44px;
                    
                    /* Scrollbar verstecken - wie bei filter-row */
                    scrollbar-width: none;  /* Firefox */
                    -ms-overflow-style: none;  /* Internet Explorer/Edge */
                }
                
                /* Webkit Scrollbar verstecken */
                .climate-setting-options::-webkit-scrollbar {
                    display: none;  /* Chrome, Safari, Opera */
                }  
                
                .climate-setting-option {
                    flex-shrink: 0;
                    min-width: 80px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.8);
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                
                .climate-setting-option:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                
                .climate-setting-option.active {
                    background: rgba(255, 255, 255, 0.25);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.4);
                }
                

                
            </style>
            
            <div class="search-container">
                <div class="search-section">
                    <div class="search-header">

                        <button class="filter-button" id="filterButton">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                            </svg>
                            <span class="filter-badge" id="filterBadge">0</span>
                        </button>                        
                        
                        <div class="search-input-container">
                            <input type="text" class="search-input" placeholder="Gerät suchen..." id="searchInput">
                            <div class="typing-indicator" id="typingIndicator">
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                            </div>
                        </div>
                        
                        <div class="view-toggle">
                            <button class="view-toggle-btn active" id="listViewBtn" data-view="list">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                                </svg>
                            </button>
                            <button class="view-toggle-btn" id="gridViewBtn" data-view="grid">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Aktive Filter Tags -->
                <div class="active-filters" id="activeFilters" style="display: none;">
                    <div class="active-filters-container">
                        <!-- Tags werden dynamisch eingefügt -->
                    </div>
                </div>                
            
                <div class="filter-section">
                    <div class="filter-row" id="typeFilterChips">
                        <div class="filter-chip all active" data-value="">
                            <span class="chip-icon">📋</span>
                            <span class="chip-name">Alle</span>
                        </div>
                    </div>
                </div>
                
                <div class="results-container" id="resultsContainer">
                    <div class="no-results" id="noResults">Wählen Sie eine Kategorie und geben Sie einen Suchbegriff ein...</div>
                </div>
            </div>



            <!-- Filter Overlay -->
            <div class="filter-overlay" id="filterOverlay">
                <div class="filter-menu">
                    <div class="filter-menu-header">
                        <h3 class="filter-menu-title">Filter & Suche</h3>
                        <button class="close-button" id="closeFilterButton">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="filter-menu-content">
                        <!-- Gerätekategorien -->
                        <div class="filter-section-menu">
                            <div class="filter-section-title">Kategorien</div>
                            <div class="filter-options" id="categoryOptions">
                                <div class="filter-option selected" data-type="entities">
                                    <div class="filter-option-icon">🏠</div>
                                    <div class="filter-option-info">
                                        <div class="filter-option-name">Alle Geräte</div>
                                        <div class="filter-option-count">-- Geräte</div>
                                    </div>
                                </div>
                                
                                <div class="filter-option" data-type="automations">
                                    <div class="filter-option-icon">🤖</div>
                                    <div class="filter-option-info">
                                        <div class="filter-option-name">Automationen</div>
                                        <div class="filter-option-count">-- Verfügbar</div>
                                    </div>
                                </div>
                                
                                <div class="filter-option" data-type="scripts">
                                    <div class="filter-option-icon">📜</div>
                                    <div class="filter-option-info">
                                        <div class="filter-option-name">Skripte</div>
                                        <div class="filter-option-count">-- Verfügbar</div>
                                    </div>
                                </div>
                                
                                <div class="filter-option" data-type="scenes">
                                    <div class="filter-option-icon">🎭</div>
                                    <div class="filter-option-info">
                                        <div class="filter-option-name">Szenen</div>
                                        <div class="filter-option-count">-- Verfügbar</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Räume -->
                        <div class="filter-section-menu">
                            <div class="filter-section-title">Räume</div>
                            <div class="filter-options" id="roomOptions">
                                <div class="filter-option selected" data-room="">
                                    <div class="filter-option-icon">🏠</div>
                                    <div class="filter-option-info">
                                        <div class="filter-option-name">Alle Räume</div>
                                        <div class="filter-option-count">-- Räume</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="filter-actions">
                        <button class="filter-action-button" id="resetFiltersButton">Zurücksetzen</button>
                        <button class="filter-action-button primary" id="applyFiltersButton">Anwenden</button>
                    </div>
                </div>
            </div>





            <!-- More-Info Replace Mode -->
            <div class="more-info-replace" id="moreInfoReplace">
                <!-- Content wird dynamisch generiert -->
            </div>
        `;        
        this.initializeCard();
    }   
    
    switchToReplaceMode(item) {
        const searchContainer = this.shadowRoot.querySelector('.search-container');
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        
        // Replace-Content generieren ABER versteckt halten
        replaceContainer.innerHTML = this.getReplaceContentHTML(item);
        replaceContainer.classList.add('active');
        
        // Replace initial komplett verstecken
        replaceContainer.style.position = 'absolute';
        replaceContainer.style.top = '0';
        replaceContainer.style.left = '100%'; // Außerhalb rechts
        replaceContainer.style.width = '100%';
        replaceContainer.style.opacity = '0';
        
        // Suche nach links rausschieben + fade-out
        searchContainer.style.transition = 'transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.35s ease';
        searchContainer.style.transform = 'translateX(-100%)';
        searchContainer.style.opacity = '0';
        
        // Replace nach 250ms von rechts reinschieben + fade-in (GLEICHZEITIG)
        setTimeout(() => {
            replaceContainer.style.transition = 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease';
            replaceContainer.style.left = '0%';
            replaceContainer.style.opacity = '1';
        }, 250);
        
        // Cleanup nach kompletter Animation
        setTimeout(() => {
            searchContainer.style.display = 'none';
            searchContainer.style.transform = '';
            searchContainer.style.opacity = '';
            searchContainer.style.transition = '';
            replaceContainer.style.position = '';
            replaceContainer.style.transition = '';
        }, 600);
        
        // Event Listeners für Replace-Mode
        this.setupReplaceEventListeners(item);
    }

    switchBackToSearch() {
        const searchContainer = this.shadowRoot.querySelector('.search-container');
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');

        // Cleanup: Album Art Update Timer stoppen
        const intervalId = replaceContainer.getAttribute('data-interval-id');
        if (intervalId) {
            clearInterval(parseInt(intervalId));
        }        
        
        // Replace nach rechts rausschieben + fade-out
        replaceContainer.style.transition = 'left 0.3s cubic-bezier(0.0, 0.0, 0.2, 1), opacity 0.3s ease';
        replaceContainer.style.left = '100%';
        replaceContainer.style.opacity = '0';
        
        // Suche nach 200ms von links reinschieben + fade-in
        setTimeout(() => {
            searchContainer.style.display = 'block';
            searchContainer.style.transform = 'translateX(-100%)';
            searchContainer.style.opacity = '0';
            searchContainer.style.transition = 'transform 0.3s cubic-bezier(0.0, 0.0, 0.2, 1), opacity 0.3s ease';
            
            // Animation starten
            requestAnimationFrame(() => {
                searchContainer.style.transform = 'translateX(0)';
                searchContainer.style.opacity = '1';
            });
        }, 200);
        
        // Cleanup
        setTimeout(() => {
            replaceContainer.classList.remove('active');
            replaceContainer.innerHTML = '';
            replaceContainer.style.left = '';
            replaceContainer.style.opacity = '';
            replaceContainer.style.position = '';
            replaceContainer.style.transition = '';
            searchContainer.style.transform = '';
            searchContainer.style.opacity = '';
            searchContainer.style.transition = '';
        }, 500);
    }        

    getReplaceContentHTML(item) {
        const breadcrumb = this.getBreadcrumbHTML(item);
    
        // In getReplaceContentHTML - Ersetze den Media Player Block:
        
        // Spezielle Behandlung für Media Player (mit vereinfachtem Dropdown-System)
        if (item.type === 'media_player') {
            const albumSection = this.getAlbumArtSectionHTML(item);
            const detailsSection = this.getReplaceTabDetailsSectionHTML(item);
            
            return `
                <div class="replace-header">
                    <button class="back-button" id="backToSearch">←</button>
                    <div class="breadcrumb">${breadcrumb}</div>
                </div>
                <div class="replace-content media-player">
                    <div class="album-container">
                        ${this.getAlbumBackgroundHTML(item)}
                        ${this.getFloatingParticlesHTML()}
                        <div class="album-art-section">
                            ${albumSection}
                        </div>
                    </div>
                    <div class="details-container">
                        <div class="details-section media-player">
                            ${detailsSection}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Dropdown-Layout für alle anderen Geräte
        const iconSection = this.getIconSectionHTML(item);
        const detailsSection = this.getReplaceTabDetailsSectionHTML(item);
        
        return `
            <div class="replace-header">
                <button class="back-button" id="backToSearch">←</button>
                <div class="breadcrumb">${breadcrumb}</div>
            </div>
            <div class="replace-content">
                <div class="icon-section">
                    ${iconSection}
                </div>
                <div class="details-section">
                    ${detailsSection}
                </div>
            </div>
        `;
    }

    // NEUE Methode für Replace-Mode Tab-Layout
    getReplaceTabDetailsSectionHTML(item) {
        const typeDisplayName = this.getTypeDisplayName(item);
        const controls = this.getReplaceControlsHTML(item);
        const attributes = this.getReplaceAttributesHTML(item);
        const history = this.getHistoryHTML(item);
        const shortcuts = this.getShortcutsHTML(item);
        
    
        return `
            <div class="entity-header-row">
                <div class="entity-info">
                    <h2 class="entity-title-large">${item.name}</h2>
                    <p class="entity-subtitle-large">${typeDisplayName} • ${item.room} • ${item.id}</p>
                </div>
                
                <div class="replace-dropdown-container">
                    <div class="dropdown-container">
                        <button class="dropdown-button" id="replaceDropdownButton">
                            <span>Steuerung</span>
                            <span class="dropdown-icon">
                                <svg viewBox="-4 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.0020846,16 L12,20.9980217 L6.99551,16 M6.99551,8 L12,3.00077787 L17.0020846,8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </button>
                        <div class="dropdown-menu" id="replaceDropdownMenu">
                            <div class="dropdown-item active" data-replace-section="controls">
                                <span class="dropdown-item-icon">${this.getControlIcon(item)}</span>
                                <span>Steuerung</span>
                            </div>
                            <div class="dropdown-item" data-replace-section="details">
                                <span class="dropdown-item-icon">📊</span>
                                <span>Details</span>
                            </div>
                            <div class="dropdown-item" data-replace-section="history">
                                <span class="dropdown-item-icon">📈</span>
                                <span>Logbuch</span>
                            </div>
                            <div class="dropdown-item" data-replace-section="shortcuts">
                                <span class="dropdown-item-icon">⚡</span>
                                <span>Aktionen</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="replace-section-content active" data-replace-content="controls">
                ${controls}
            </div>
            
            <div class="replace-section-content" data-replace-content="details" style="display: none;">
                ${attributes}
            </div>
            
            <div class="replace-section-content" data-replace-content="history" style="display: none;">
                ${history}
            </div>
            
            <div class="replace-section-content" data-replace-content="shortcuts" style="display: none;">
                ${shortcuts}
            </div>
        `;
    }

    setupReplaceDropdown(item) {
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (!replaceContainer) return;
        
        const dropdownButton = replaceContainer.querySelector('#replaceDropdownButton');
        const dropdownMenu = replaceContainer.querySelector('#replaceDropdownMenu');
        const dropdownItems = replaceContainer.querySelectorAll('.dropdown-item');
        const sections = replaceContainer.querySelectorAll('[data-replace-content]');
        
        if (!dropdownButton || !dropdownMenu) return;
        
        let isOpen = false;
        let animating = false;
        

        // Button Click Handler mit sanfter Animation
        dropdownButton.onclick = (e) => { // ← Arrow Function
            e.stopPropagation();
            
            if (animating) return; // Prevent rapid clicking
            
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        };        
        
        const openDropdown = () => {
            if (animating || isOpen) return;
            
            animating = true;
            isOpen = true;
            
            // Button fade-out
            dropdownButton.classList.add('open');
            
            // Menu erscheint nach etwas längerer Verzögerung für dramatischen Effekt
            setTimeout(() => {
                dropdownMenu.classList.add('open');
                
                // Animation beendet nach 800ms (wegen längerer Animation)
                setTimeout(() => {
                    animating = false;
                }, 800);
            }, 150); // Etwas längere Verzögerung
        };
        
        const closeDropdown = () => {
            if (animating || !isOpen) return;
            
            animating = true;
            isOpen = false;
            
            // Menu verschwindet zuerst
            dropdownMenu.classList.remove('open');
            
            // Button erscheint wieder nach Animation
            setTimeout(() => {
                dropdownButton.classList.remove('open');
                animating = false;
            }, 400); // Längere Wartezeit wegen reverse animation
        };
        
        // Item Click Handlers mit Haptic Feedback
        dropdownItems.forEach((item, index) => {
            item.onclick = (e) => { // ← Arrow Function statt function
                e.stopPropagation();
                
                const targetSection = item.getAttribute('data-replace-section');
                console.log('🔥 Section clicked:', targetSection); // Debug-Log
                
                // Subtle scale animation on click
                item.style.transform = 'translateY(0) scale(0.98)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 100);
                
                // Update active state
                dropdownItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Update button text mit fade
                const textSpan = item.querySelector('span:last-child');
                const buttonTextSpan = dropdownButton.querySelector('span:first-child');
                if (textSpan && buttonTextSpan) {
                    buttonTextSpan.style.transition = 'opacity 0.15s ease';
                    buttonTextSpan.style.opacity = '0';
                    setTimeout(() => {
                        buttonTextSpan.textContent = textSpan.textContent;
                        buttonTextSpan.style.opacity = '1';
                    }, 150);
                }
                
                // Hide all sections
                sections.forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                });
                
                // Show target section
                const targetElement = replaceContainer.querySelector(`[data-replace-content="${targetSection}"]`);
                if (targetElement) {
                    targetElement.style.display = 'block';
                    targetElement.classList.add('active');
                    
                    // Spezielle Initialisierung basierend auf Sektion
                    if (targetSection === 'tts' && item.type === 'media_player') {
                        console.log('🎤 Setting up TTS'); // Debug-Log
                        setTimeout(() => this.setupTTSEventListeners(item), 150);
                    } else if (targetSection === 'music' && item.type === 'media_player') {
                        console.log('🎵 Setting up Music'); // Debug-Log
                        setTimeout(() => this.setupMusicAssistantEventListeners(item), 150);
                    } else if (targetSection === 'history') {
                        console.log('📈 Loading Logbook'); // Debug-Log
                        this.loadRealLogEntries(item); // ← Jetzt funktioniert das `this`
                    } else if (targetSection === 'shortcuts') {
                        console.log('⚡ Setting up Shortcuts'); // Debug-Log
                        setTimeout(() => this.setupShortcutEventListeners(item), 150);
                    }
                }
                
                console.log('🔒 Closing dropdown for:', targetSection); // Debug-Log
                // Close dropdown
                closeDropdown();
            };
        });


        // Close on outside click - nur für diesen Container
        replaceContainer.addEventListener('click', function(e) {
            // Klick außerhalb des Dropdowns
            if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                console.log('🔒 Outside click - closing dropdown'); // Debug-Log
                closeDropdown();
            }
        });
        
        // ESC key support - nur wenn Container focus hat
        replaceContainer.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                console.log('🔒 ESC pressed - closing dropdown'); // Debug-Log
                closeDropdown();
            }
        });
        
        // Container fokussierbar machen
        replaceContainer.setAttribute('tabindex', '-1');
    }

    

    // NEUE Methode für Media Player Tab-Layout
    getMediaPlayerTabDetailsSectionHTML(item) {
        const typeDisplayName = this.getTypeDisplayName(item);
        const basicControls = this.getMediaPlayerBasicControls(item);
        const attributes = this.getReplaceAttributesHTML(item);
        const history = this.getHistoryHTML(item);
        const musicAssistantHTML = this.getMediaPlayerMusicSection(item);
        const ttsHTML = this.getMediaPlayerTTSSection(item);
        
        return `
            <div class="entity-info">
                <h2 class="entity-title-large">${item.name}</h2>
                <p class="entity-subtitle-large">${typeDisplayName} • ${item.room} • ${item.id}</p>
            </div>
            
            <div class="replace-tabs-container">
                <div class="replace-tabs">
                    <button class="replace-tab active" data-replace-general-tab="controls">
                        <span class="replace-tab-icon">🎮</span>
                        <span>Steuerung</span>
                    </button>
                    <button class="replace-tab" data-replace-general-tab="music">
                        <span class="replace-tab-icon">🎵</span>
                        <span>Musik</span>
                    </button>
                    <button class="replace-tab" data-replace-general-tab="tts">
                        <span class="replace-tab-icon">🗣️</span>
                        <span>Sprechen</span>
                    </button>
                    <button class="replace-tab" data-replace-general-tab="details">
                        <span class="replace-tab-icon">📊</span>
                        <span>Details</span>
                    </button>
                    <button class="replace-tab" data-replace-general-tab="history">
                        <span class="replace-tab-icon">📈</span>
                        <span>Logbuch</span>
                    </button>
                </div>
                
                <div class="replace-tab-content active" data-replace-general-tab-content="controls">
                    ${basicControls}
                </div>
                
                <div class="replace-tab-content" data-replace-general-tab-content="music">
                    ${musicAssistantHTML}
                </div>
                
                <div class="replace-tab-content" data-replace-general-tab-content="tts">
                    ${ttsHTML}
                </div>
                
                <div class="replace-tab-content" data-replace-general-tab-content="details">
                    ${attributes}
                </div>
                
                <div class="replace-tab-content" data-replace-general-tab-content="history">
                    ${history}
                </div>
            </div>
        `;
    }    


    // NEUE Helper-Methoden für Media Player Tab-System
    getMediaPlayerBasicControls(item) {
        const volume = item.volume || 0;
        const isPlaying = item.state === 'playing';
        
        return `
            <div class="control-group-large">
                <div class="main-control-large">
                    <button class="toggle-button-large" data-action="play_pause">
                        ${isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                    <button class="toggle-button-large off" data-action="previous">⏮️ Zurück</button>
                    <button class="toggle-button-large off" data-action="next">⏭️ Weiter</button>
                </div>
                <div class="slider-control-large">
                    <div class="slider-label-large">
                        <span>Lautstärke</span>
                        <span class="value">${volume}%</span>
                    </div>
                    <input type="range" class="slider-large" data-control="volume" 
                           min="0" max="100" value="${volume}">
                </div>
                ${item.media_title ? `
                    <div style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                        <div style="font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 4px;">
                            🎵 ${item.media_title}
                        </div>
                        ${item.attributes.media_artist ? `
                            <div style="font-size: 14px; color: rgba(255,255,255,0.7);">
                                👤 ${item.attributes.media_artist}
                            </div>
                        ` : ''}
                        ${item.attributes.media_album ? `
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                💿 ${item.attributes.media_album}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    getMediaPlayerMusicSection(item) {
        return this.checkMusicAssistantAvailability() ? `
            <div class="ma-search-container">
                <div class="ma-search-bar-container">
                    <input type="text" 
                           class="ma-search-input" 
                           placeholder="Künstler, Album oder Song suchen..." 
                           data-ma-search="${item.id}">
                    <div class="ma-enqueue-mode" data-ma-enqueue="${item.id}">
                        <span class="ma-enqueue-icon">▶️</span>
                        <span class="ma-enqueue-text">Play now</span>
                    </div>
                </div>
                <div class="ma-filter-container" id="ma-filters-${item.id}">
                    <div class="ma-filter-chip ma-filter-active" data-filter="all">
                        <span class="ma-filter-icon">🔗</span>
                        <span>Alle</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="artists">
                        <span class="ma-filter-icon">👤</span>
                        <span>Künstler</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="albums">
                        <span class="ma-filter-icon">💿</span>
                        <span>Alben</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="tracks">
                        <span class="ma-filter-icon">🎵</span>
                        <span>Songs</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="playlists">
                        <span class="ma-filter-icon">📋</span>
                        <span>Playlists</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="radio">
                        <span class="ma-filter-icon">📻</span>
                        <span>Radio</span>
                    </div>
                </div>
                <div class="ma-search-results" id="ma-results-${item.id}">
                    <div class="ma-empty-state">Gebe einen Suchbegriff ein um Musik zu finden...</div>
                </div>
            </div>
        ` : '<div class="ma-empty-state">Music Assistant Integration nicht verfügbar</div>';
    }
    
    getMediaPlayerTTSSection(item) {
        return this.getTTSHTML(item) || '<div class="ma-empty-state">Text-to-Speech nicht verfügbar</div>';
    }    
    

    getAlbumBackgroundHTML(item) {
        const albumArt = this.getAlbumArtUrl(item);
        if (albumArt) {
            return `<div class="album-background-blur album-side-only" style="background-image: url('${albumArt}');"></div>`;
        }
        return `<div class="album-background-blur album-side-only" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>`;
    }

    
    getFloatingParticlesHTML() {
        return `
            <div class="floating-particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
            </div>
        `;
    }
    
    getAlbumArtSectionHTML(item) {
        const albumArt = this.getAlbumArtUrl(item);
        const isPlaying = item.state === 'playing';
        const songTitle = item.attributes.media_title || 'Kein Titel';
        const artistName = item.attributes.media_artist || 'Unbekannter Künstler';
        const albumName = item.attributes.media_album || '';
        
        const albumCoverStyle = albumArt ? `background-image: url('${albumArt}');` : 
            `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`;
        
        return `
            <div class="album-cover-large ${isPlaying ? 'playing' : ''}" 
                 style="${albumCoverStyle}">
            </div>
            <div class="now-playing-info">
                <div class="song-title-large">${songTitle}</div>
                <div class="artist-name-large">${artistName}</div>
                ${albumName ? `<div class="album-name-large">${albumName}</div>` : ''}
            </div>
        `;
    }
    
    getAlbumArtUrl(item) {
        // Verschiedene Attribute prüfen wo Album Art gespeichert sein könnte
        const attributes = item.attributes;
        
        if (attributes.entity_picture) {
            return attributes.entity_picture;
        }
        
        if (attributes.entity_picture_local) {
            return attributes.entity_picture_local;
        }
        
        if (attributes.media_image_url) {
            return attributes.media_image_url;
        }
        
        // Für Music Assistant
        if (attributes.media_image_remotely_accessible_url) {
            return attributes.media_image_remotely_accessible_url;
        }
        
        // Fallback: Versuche Standard Home Assistant Media Image
        if (item.id && this._hass) {
            return `/api/media_player_proxy/${item.id}?token=${this._hass.auth.data.access_token}&cache=${Date.now()}`;
        }
        
        return null;
    }
    
    getBreadcrumbHTML(item) {
        const searchType = this.searchTypeConfigs[this.currentSearchType];
        const categoryName = searchType.categoryNames[item.category] || item.category;
        
        return `
            <div class="breadcrumb-path">Suche → ${item.room} → ${categoryName}</div>
            <div class="breadcrumb-current">${item.name}</div>
        `;
    }

    getIconSectionHTML(item) {
        const stateInfo = this.getDetailedStateText(item);
        const isActive = this.isItemActive(item);
        const quickStats = this.getQuickStats(item);
        const backgroundImage = this.getBackgroundImageForItem(item);
        
        // Spezielle Klasse für Licht AN/AUS
        const contentClass = (item.type === 'light' && item.state === 'on') ? 'light-on' : 'light-off';
        
        return `
            <!-- Background Image (20% kleiner, mittig) -->
            <div class="icon-background" style="background-image: url('${backgroundImage}');"></div>
            
            <!-- Content über dem Background -->
            <div class="icon-content ${contentClass}">
                ${(item.type === 'light' && item.state === 'on') ? 
                    // Licht AN: Status und Stats nebeneinander
                    `<div class="bottom-row">
                        <div class="status-indicator-large ${isActive ? '' : 'off'}">${stateInfo.status}</div>
                        <div class="quick-stats">
                            ${quickStats.map(stat => `<div class="stat-item">${stat}</div>`).join('')}
                        </div>
                    </div>` :
                    // Licht AUS: Standard Layout
                    `<div class="status-indicator-large ${isActive ? '' : 'off'}">${stateInfo.status}</div>
                     <div class="quick-stats">
                        ${quickStats.map(stat => `<div class="stat-item">${stat}</div>`).join('')}
                     </div>`
                }
            </div>
        `;
    }


    getBackgroundImageForItem(item) {
        const baseUrl = 'https://raw.githubusercontent.com/fastender/Fast-Search-Card/refs/heads/main/docs/';
        
        switch (item.type) {
            case 'light':
                const isOn = item.state === 'on';
                return baseUrl + (isOn ? 'light-on.png' : 'light-off.png');
                
            case 'media_player':
                return baseUrl + 'media-bg.png'; // Fallback für später
                
            case 'switch':
                const switchOn = item.state === 'on';
                return baseUrl + (switchOn ? 'light-on.png' : 'light-off.png'); // Vorerst Light-Bilder

            case 'cover':
                const position = item.position || 0;
                return baseUrl + (position === 0 ? 'cover-on.png' : 'cover-off.png'); 

            case 'climate':
                const isHeating = item.state === 'heat' || item.state === 'cool' || item.state === 'auto';
                return baseUrl + (isHeating ? 'climate-on.png' : 'climate-off.png');                
                
            default:
                // Fallback: Generisches Bild oder Gradient
                return baseUrl + 'light-off.png';
        }
    }
    

    getDetailsSectionHTML(item) {
        const typeDisplayName = this.getTypeDisplayName(item);
        const controls = this.getReplaceControlsHTML(item);
        const attributes = this.getReplaceAttributesHTML(item);
        
        return `
            <div class="entity-info">
                <h2 class="entity-title-large">${item.name}</h2>
                <p class="entity-subtitle-large">${typeDisplayName} • ${item.room} • ${item.id}</p>
            </div>
            ${controls}
            ${attributes}
        `;
    }


    getAccordionDetailsSectionHTML(item) {
            const typeDisplayName = this.getTypeDisplayName(item);
            const controls = this.getReplaceControlsHTML(item);
            const attributes = this.getReplaceAttributesHTML(item);
            const history = this.getHistoryHTML(item);
            
            return `
                <div class="entity-info">
                    <h2 class="entity-title-large">${item.name}</h2>
                    <p class="entity-subtitle-large">${typeDisplayName} • ${item.room} • ${item.id}</p>
                </div>
                
                <div class="accordion-container">
                    <!-- Steuerung Accordion -->
                    <div class="accordion-item active" data-accordion="control">
                        <div class="accordion-header">
                            <div class="accordion-title">
                                <span class="accordion-icon">${this.getControlIcon(item)}</span>
                                <span>STEUERUNG</span>
                            </div>
                            <span class="accordion-chevron">▼</span>
                        </div>
                        <div class="accordion-content">
                            ${controls}
                        </div>
                    </div>
                    
                    <!-- Details Accordion -->
                    <div class="accordion-item" data-accordion="details">
                        <div class="accordion-header">
                            <div class="accordion-title">
                                <span class="accordion-icon">📊</span>
                                <span>DETAILS</span>
                            </div>
                            <span class="accordion-chevron">▼</span>
                        </div>
                        <div class="accordion-content">
                            ${attributes}
                        </div>
                    </div>
                    
                    <!-- Historische Daten Accordion -->
                    <div class="accordion-item" data-accordion="history">
                        <div class="accordion-header">
                            <div class="accordion-title">
                                <span class="accordion-icon">📈</span>
                                <span>HISTORISCHE DATEN</span>
                            </div>
                            <span class="accordion-chevron">▼</span>
                        </div>
                        <div class="accordion-content">
                            ${history}
                        </div>
                    </div>
                </div>
            `;
        }    


    
    getControlIcon(item) {
            switch (item.itemType) {
                case 'entity':
                    switch (item.type) {
                        case 'light': return '💡';
                        case 'climate': return '🌡️';
                        case 'cover': return '🪟';
                        case 'media_player': return '📺';
                        case 'switch': return '🔌';
                        case 'fan': return '🌀';
                        default: return '🔧';
                    }
                case 'automation': return '🤖';
                case 'script': return '📜';
                case 'scene': return '🎭';
                default: return '🔧';
            }
        }
    

        getHistoryHTML(item) {
                return `
                    <div class="history-content">
                        <div class="log-entries" id="logEntries">
                            ${this.getLogEntriesHTML(item)}
                        </div>
                    </div>
                `;
            }            
        
    
        getChartTitle(item) {
            switch (item.type) {
                case 'light': return 'Helligkeitsverlauf der letzten 24 Stunden';
                case 'climate': return 'Temperaturverlauf der letzten 24 Stunden';
                case 'sensor': return 'Sensorwerte der letzten 24 Stunden';
                case 'media_player': return 'Aktivitätsverlauf der letzten 24 Stunden';
                default: return 'Statusverlauf der letzten 24 Stunden';
            }
        }
    



        
        
        
        
        getLogEntriesHTML(item) {
            // Zeige Loading-Indikator während des Ladens
            this.loadRealLogEntries(item);
            
            return `
                <div class="log-loading" id="logLoading-${item.id}">
                    <div class="log-entry">
                        <div class="log-action">⏳ Lade Logbook-Einträge...</div>
                    </div>
                </div>
                <div class="log-entries-container" id="logContainer-${item.id}" style="display: none;"></div>
            `;
        }
        

        async loadRealLogEntries(item) {
            if (!this._hass) return;
            
            try {
                // Zeitraum: Letzte 6 Stunden
                const endTime = new Date();
                const startTime = new Date(endTime.getTime() - (6 * 60 * 60 * 1000));
                
                console.log('Logbook API Call:', {
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    entity_id: item.id
                });
                
                // Home Assistant Logbook API aufrufen
                const logbookData = await this._hass.callWS({
                    type: 'logbook/get_events',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    entity_ids: [item.id]
                });
                
                console.log('Logbook Response:', logbookData);
                
                // Fallback: Verwende State-Historie falls Logbook leer ist
                if (!logbookData || logbookData.length === 0) {
                    console.log('Logbook leer, verwende History API...');
                    const historyData = await this._hass.callWS({
                        type: 'history/history_during_period',
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        entity_ids: [item.id]
                    });
                    
                    console.log('History Response:', historyData);
                    
                    if (historyData && historyData[0]) {
                        const processedEntries = this.processHistoryData(historyData[0], item);
                        this.updateLogbookUI(item.id, processedEntries);
                        return;
                    }
                }
                
                // Logbook-Einträge verarbeiten
                const processedEntries = this.processLogbookData(logbookData, item);
                this.updateLogbookUI(item.id, processedEntries);
                
            } catch (error) {
                console.error('Fehler beim Laden der Logbook-Daten:', error);
                this.showLogbookError(item.id);
            }
        }            




            
                
        
        processLogbookData(logbookData, item) {
            console.log('=== processLogbookData DEBUG ===');
            console.log('Raw logbookData:', logbookData);
            
            if (!logbookData || logbookData.length === 0) {
                console.log('❌ Keine Logbook-Daten verfügbar');
                return [{
                    message: 'Keine Aktivitäten in den letzten 6 Stunden',
                    when: 'Heute',
                    state: 'INFO',
                    stateClass: 'info'
                }];
            }
            
            const filteredData = logbookData.filter(entry => entry.entity_id === item.id);
            console.log('Filtered data for entity:', filteredData);
            
            const processedEntries = filteredData.map((entry, index) => {
                console.log(`--- Processing entry ${index} ---`);
                
                // KORREKTUR: Unix-Timestamp richtig konvertieren
                let entryDate;
                let timeSource = 'unknown';
                
                if (entry.when) {
                    // Home Assistant gibt Unix-Timestamp in SEKUNDEN (mit Dezimalstellen)
                    // JavaScript braucht MILLISEKUNDEN
                    const timestampMs = Math.floor(entry.when * 1000);
                    entryDate = new Date(timestampMs);
                    timeSource = 'entry.when (unix seconds → ms)';
                    console.log('Raw when:', entry.when);
                    console.log('Converted to ms:', timestampMs);
                    console.log('Final date:', entryDate.toString());
                } else if (entry.last_changed) {
                    entryDate = new Date(entry.last_changed);
                    timeSource = 'entry.last_changed';
                } else if (entry.timestamp) {
                    // Auch timestamp könnte Unix-Format sein
                    const timestamp = entry.timestamp;
                    if (typeof timestamp === 'number' && timestamp < 2000000000) {
                        // Wahrscheinlich Unix-Sekunden
                        entryDate = new Date(timestamp * 1000);
                        timeSource = 'entry.timestamp (unix seconds → ms)';
                    } else {
                        entryDate = new Date(timestamp);
                        timeSource = 'entry.timestamp';
                    }
                } else {
                    entryDate = new Date();
                    timeSource = 'fallback (now)';
                }
                
                console.log('Time source used:', timeSource);
                console.log('Parsed date:', entryDate.toString());
                console.log('Date valid:', !isNaN(entryDate.getTime()));
                
                const result = {
                    message: this.formatLogbookMessage(entry, item),
                    when: this.formatLogTime(entryDate),
                    state: this.formatLogbookState(entry, item),
                    stateClass: this.getLogbookStateClass(entry, item),
                    rawDate: entryDate
                };
                
                console.log('Final result:', result);
                return result;
            });
            
            const sortedEntries = processedEntries.sort((a, b) => b.rawDate - a.rawDate).slice(0, 20);
            console.log('Final sorted entries:', sortedEntries);
            
            return sortedEntries;
        }



        // Fallback: History-Daten verarbeiten
        processHistoryData(historyData, item) {
            if (!historyData || historyData.length === 0) {
                return [{
                    message: 'Keine Aktivitäten in den letzten 6 Stunden',
                    when: 'Heute',
                    state: 'INFO',
                    stateClass: 'info'
                }];
            }
            
            return historyData
                .slice(-20) // Letzte 20 Einträge
                .map(entry => {
                    const entryDate = new Date(entry.last_changed);
                    
                    return {
                        message: this.getStateChangeMessage(item, entry.state),
                        when: this.formatLogTime(entryDate),
                        state: entry.state.toUpperCase(),
                        stateClass: ['on', 'playing', 'open'].includes(entry.state) ? 'on' : 'off',
                        rawDate: entryDate
                    };
                })
                .sort((a, b) => b.rawDate - a.rawDate); // Neueste zuerst
        }
    

    
        
        formatLogbookMessage(entry, item) {
            // Verwende die originale Logbook-Nachricht wenn verfügbar
            if (entry.message) {
                return entry.message;
            }
            
            // Fallback: Generiere Nachricht basierend auf State-Änderung
            const newState = entry.state;
            const oldState = entry.old_state;
            
            switch (item.type) {
                case 'light':
                    if (newState === 'on' && oldState === 'off') {
                        return 'Licht eingeschaltet';
                    } else if (newState === 'off' && oldState === 'on') {
                        return 'Licht ausgeschaltet';
                    } else if (newState === 'on' && oldState === 'on') {
                        // Helligkeit geändert
                        const newBrightness = entry.attributes?.brightness;
                        const oldBrightness = entry.old_attributes?.brightness;
                        if (newBrightness !== oldBrightness) {
                            const newPercent = Math.round((newBrightness || 0) / 255 * 100);
                            return `Helligkeit auf ${newPercent}% geändert`;
                        }
                    }
                    return `Status: ${newState}`;
                    
                case 'switch':
                    return newState === 'on' ? 'Schalter eingeschaltet' : 'Schalter ausgeschaltet';
                    
                case 'climate':
                    const newTemp = entry.attributes?.temperature;
                    const oldTemp = entry.old_attributes?.temperature;
                    if (newTemp !== oldTemp) {
                        return `Temperatur auf ${newTemp}°C gesetzt`;
                    }
                    return `Thermostat: ${newState}`;
                    
                case 'cover':
                    if (newState === 'open') return 'Rolladen geöffnet';
                    if (newState === 'closed') return 'Rolladen geschlossen';
                    
                    const newPos = entry.attributes?.current_position;
                    const oldPos = entry.old_attributes?.current_position;
                    if (newPos !== oldPos) {
                        return `Position auf ${newPos}% gesetzt`;
                    }
                    return `Rolladen: ${newState}`;
                    
                case 'media_player':
                    if (newState === 'playing') return 'Wiedergabe gestartet';
                    if (newState === 'paused') return 'Wiedergabe pausiert';
                    if (newState === 'off') return 'Ausgeschaltet';
                    return `Status: ${newState}`;
                    
                default:
                    return `Status geändert: ${oldState} → ${newState}`;
            }
        }
        
        formatLogbookState(entry, item) {
            const state = entry.state;
            const attributes = entry.attributes || {};
            
            switch (item.type) {
                case 'light':
                    if (state === 'on' && attributes.brightness) {
                        return `${Math.round(attributes.brightness / 255 * 100)}%`;
                    }
                    return state === 'on' ? 'AN' : 'AUS';
                    
                case 'climate':
                    if (attributes.temperature) {
                        return `${attributes.temperature}°C`;
                    }
                    return state.toUpperCase();
                    
                case 'cover':
                    if (attributes.current_position !== undefined) {
                        return `${attributes.current_position}%`;
                    }
                    return state.toUpperCase();
                    
                case 'media_player':
                    if (state === 'playing' && attributes.media_title) {
                        return attributes.media_title.substring(0, 20) + '...';
                    }
                    return state.toUpperCase();
                    
                default:
                    return state.toUpperCase();
            }
        }
        
        getLogbookStateClass(entry, item) {
            const state = entry.state;
            const onStates = ['on', 'playing', 'open', 'home', 'heat', 'cool'];
            return onStates.includes(state) ? 'on' : 'off';
        }
        
        updateLogbookUI(itemId, entries) {
            const loadingElement = this.shadowRoot.getElementById(`logLoading-${itemId}`);
            const containerElement = this.shadowRoot.getElementById(`logContainer-${itemId}`);
            
            if (!loadingElement || !containerElement) return;
            
            // HTML für Einträge generieren
            const entriesHTML = entries.map(entry => `
                <div class="log-entry">
                    <div>
                        <div class="log-action">${entry.message}</div>
                        <div class="log-time">${entry.when}</div>
                    </div>
                    <span class="log-state ${entry.stateClass}">${entry.state}</span>
                </div>
            `).join('');
            
            containerElement.innerHTML = entriesHTML;
            
            // Loading verstecken, Container zeigen
            loadingElement.style.display = 'none';
            containerElement.style.display = 'block';
        }
        
        showLogbookError(itemId) {
            const loadingElement = this.shadowRoot.getElementById(`logLoading-${itemId}`);
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="log-entry">
                        <div class="log-action">❌ Fehler beim Laden des Logbooks</div>
                        <div class="log-time">Versuche es später erneut</div>
                    </div>
                `;
            }
        }


    






    
    
        generateMockLogEntries(item) {
            const now = new Date();
            const entries = [];
            
            // Aktuelle Zeit als erste Entry
            entries.push({
                action: this.getLastActionText(item),
                time: this.formatLogTime(now),
                state: this.formatLogState(item),
                stateClass: this.getLogStateClass(item)
            });
            
            // Weitere Mock-Entries basierend auf Gerätetyp
            for (let i = 1; i < 5; i++) {
                const pastTime = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // 2h intervals
                const mockEntry = this.createMockLogEntry(item, pastTime, i);
                entries.push(mockEntry);
            }
            
            return entries;
        }
    
        getLastActionText(item) {
            if (item.itemType === 'entity') {
                switch (item.type) {
                    case 'light':
                        return item.state === 'on' ? 'Licht eingeschaltet' : 'Licht ausgeschaltet';
                    case 'switch':
                        return item.state === 'on' ? 'Schalter eingeschaltet' : 'Schalter ausgeschaltet';
                    case 'climate':
                        return `Temperatur auf ${item.target_temperature || 20}°C gesetzt`;
                    case 'cover':
                        return `Position auf ${item.position || 0}% gesetzt`;
                    default:
                        return item.state === 'on' ? 'Eingeschaltet' : 'Ausgeschaltet';
                }
            }
            return 'Status geändert';
        }
    

        
        formatLogTime(date) {
            if (!date || isNaN(date.getTime())) {
                console.error('Ungültiges Datum:', date);
                return 'Unbekannte Zeit';
            }
            
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            // Wenn weniger als 1 Stunde her
            if (hours < 1) {
                if (minutes < 1) {
                    return 'Gerade eben';
                }
                return `Vor ${minutes} Min`;
            }
            
            // Wenn weniger als 24 Stunden her
            if (hours < 24) {
                return `Vor ${hours} Std`;
            }
            
            // Heute
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                return `Heute, ${date.toLocaleTimeString('de-DE', { 
                    hour: '2-digit', minute: '2-digit' 
                })}`;
            }
            
            // Gestern
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return `Gestern, ${date.toLocaleTimeString('de-DE', { 
                    hour: '2-digit', minute: '2-digit' 
                })}`;
            }
            
            // Älter
            return date.toLocaleString('de-DE', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }








    
    
        formatLogState(item) {
            if (item.itemType === 'entity') {
                switch (item.type) {
                    case 'light':
                        return item.state === 'on' ? `${item.brightness || 100}%` : 'AUS';
                    case 'climate':
                        return `${item.target_temperature || 20}°C`;
                    case 'cover':
                        return `${item.position || 0}%`;
                    default:
                        return item.state === 'on' ? 'AN' : 'AUS';
                }
            }
            return item.state.toUpperCase();
        }
    
        getLogStateClass(item) {
            return item.state === 'on' || item.state === 'playing' ? 'on' : 'off';
        }
    
        createMockLogEntry(item, time, index) {
            const isOn = index % 2 === 0; // Alternierend
            
            if (item.type === 'light') {
                return {
                    action: isOn ? 'Licht eingeschaltet' : 'Licht ausgeschaltet',
                    time: this.formatLogTime(time),
                    state: isOn ? `${Math.floor(Math.random() * 50) + 50}%` : 'AUS',
                    stateClass: isOn ? 'on' : 'off'
                };
            }
            
            return {
                action: isOn ? 'Eingeschaltet' : 'Ausgeschaltet',
                time: this.formatLogTime(time),
                state: isOn ? 'AN' : 'AUS',
                stateClass: isOn ? 'on' : 'off'
            };
        }
    




        getAccordionDetailsSectionHTML(item) {
                const typeDisplayName = this.getTypeDisplayName(item);
                const controls = this.getReplaceControlsHTML(item);
                const attributes = this.getReplaceAttributesHTML(item);
                const history = this.getHistoryHTML(item);
                const shortcuts = this.getShortcutsHTML(item);
                
                return `
                    <div class="entity-info">
                        <h2 class="entity-title-large">${item.name}</h2>
                        <p class="entity-subtitle-large">${typeDisplayName} • ${item.room} • ${item.id}</p>
                    </div>
                    
                    <div class="accordion-container">
                        <!-- Steuerung Accordion -->
                        <div class="accordion-item active" data-accordion="control">
                            <div class="accordion-header">
                                <div class="accordion-title">
                                    <span class="accordion-icon">${this.getControlIcon(item)}</span>
                                    <span>STEUERUNG</span>
                                </div>
                                <span class="accordion-chevron">▼</span>
                            </div>
                            <div class="accordion-content">
                                ${controls}
                            </div>
                        </div>
                        
                        <!-- Details Accordion -->
                        <div class="accordion-item" data-accordion="details">
                            <div class="accordion-header">
                                <div class="accordion-title">
                                    <span class="accordion-icon">📊</span>
                                    <span>DETAILS</span>
                                </div>
                                <span class="accordion-chevron">▼</span>
                            </div>
                            <div class="accordion-content">
                                ${attributes}
                            </div>
                        </div>
                        
                        <!-- Historische Daten Accordion -->
                        <div class="accordion-item" data-accordion="history">
                            <div class="accordion-header">
                                <div class="accordion-title">
                                    <span class="accordion-icon">📈</span>
                                    <span>LOGBUCH</span>
                                </div>
                                <span class="accordion-chevron">▼</span>
                            </div>
                            <div class="accordion-content">
                                ${history}
                            </div>
                        </div>
                        
                        <!-- Schnellzugriff Accordion -->
                        <div class="accordion-item" data-accordion="shortcuts">
                            <div class="accordion-header">
                                <div class="accordion-title">
                                    <span class="accordion-icon">⚡</span>
                                    <span>SCHNELLZUGRIFF</span>
                                </div>
                                <span class="accordion-chevron">▼</span>
                            </div>
                            <div class="accordion-content">
                                ${shortcuts}
                            </div>
                        </div>
                    </div>
                `;
            }



        
        
        
        getShortcutsHTML(item) {
                const contextualActions = this.getContextualActions(item);
                
                if (contextualActions.length === 0) {
                    return `
                        <div class="shortcuts-empty">
                            <span>🤷‍♂️ Keine kontextbezogenen Aktionen verfügbar</span>
                            <small>Erstelle Szenen oder Skripte für "${item.room}" um sie hier zu sehen</small>
                        </div>
                    `;
                }
                
                return `
                    <div class="shortcuts-grid">
                        ${contextualActions.map(action => `
                            <button class="shortcut-button" data-shortcut-action="${action.type}" data-shortcut-id="${action.id}">
                                <div class="shortcut-icon">${action.icon}</div>
                                <div class="shortcut-info">
                                    <div class="shortcut-name">${action.name}</div>
                                    <div class="shortcut-description">${action.description}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                `;
            }
        
            getContextualActions(item) {
                if (!this._hass) return [];
                
                const actions = [];
                const itemRoom = item.room.toLowerCase();
                const itemType = item.type;
                
                // Szenen für diesen Raum suchen
                Object.keys(this._hass.states).forEach(entityId => {
                    if (entityId.startsWith('scene.')) {
                        const sceneState = this._hass.states[entityId];
                        const sceneName = sceneState.attributes.friendly_name || entityId.replace('scene.', '');
                        const sceneNameLower = sceneName.toLowerCase();
                        
                        // Raum-bezogene Szenen
                        if (sceneNameLower.includes(itemRoom) || 
                            (sceneState.attributes.room && sceneState.attributes.room.toLowerCase() === itemRoom)) {
                            actions.push({
                                id: entityId,
                                type: 'scene',
                                name: sceneName,
                                description: 'Szene aktivieren',
                                icon: this.getSceneContextIcon(sceneName)
                            });
                        }
                        
                        // Geräte-typ bezogene Szenen
                        if (itemType === 'light' && (sceneNameLower.includes('licht') || sceneNameLower.includes('light'))) {
                            actions.push({
                                id: entityId,
                                type: 'scene',
                                name: sceneName,
                                description: 'Licht-Szene',
                                icon: '💡'
                            });
                        }
                    }
                });
                
                // Skripte für diesen Raum suchen
                Object.keys(this._hass.states).forEach(entityId => {
                    if (entityId.startsWith('script.')) {
                        const scriptState = this._hass.states[entityId];
                        const scriptName = scriptState.attributes.friendly_name || entityId.replace('script.', '');
                        const scriptNameLower = scriptName.toLowerCase();
                        
                        // Raum-bezogene Skripte
                        if (scriptNameLower.includes(itemRoom) || 
                            (scriptState.attributes.room && scriptState.attributes.room.toLowerCase() === itemRoom)) {
                            actions.push({
                                id: entityId,
                                type: 'script',
                                name: scriptName,
                                description: 'Skript ausführen',
                                icon: this.getScriptContextIcon(scriptName)
                            });
                        }
                        
                        // Geräte-typ bezogene Skripte
                        if (itemType === 'light' && (scriptNameLower.includes('licht') || scriptNameLower.includes('light'))) {
                            actions.push({
                                id: entityId,
                                type: 'script',
                                name: scriptName,
                                description: 'Licht-Skript',
                                icon: '💡'
                            });
                        }
                    }
                });
                
                // Ähnliche Geräte im Raum
                const roomDevices = this.getSameRoomDevices(item);
                roomDevices.forEach(device => {
                    if (device.id !== item.id) {
                        actions.push({
                            id: device.id,
                            type: 'device',
                            name: device.name,
                            description: `${device.type} steuern`,
                            icon: device.icon
                        });
                    }
                });
                
                // Begrenzen auf max 6 Aktionen
                return actions.slice(0, 6);
            }
        
            getSceneContextIcon(sceneName) {
                const name = sceneName.toLowerCase();
                if (name.includes('morgen') || name.includes('morning')) return '🌅';
                if (name.includes('abend') || name.includes('evening')) return '🌆';
                if (name.includes('nacht') || name.includes('night')) return '🌙';
                if (name.includes('film') || name.includes('movie')) return '🎬';
                if (name.includes('dimm') || name.includes('dim')) return '🔅';
                if (name.includes('hell') || name.includes('bright')) return '🔆';
                return '🎭';
            }
        
            getScriptContextIcon(scriptName) {
                const name = scriptName.toLowerCase();
                if (name.includes('licht') || name.includes('light')) return '💡';
                if (name.includes('heiz') || name.includes('heat')) return '🔥';
                if (name.includes('klima') || name.includes('climate')) return '❄️';
                if (name.includes('musik') || name.includes('music')) return '🎵';
                if (name.includes('sicher') || name.includes('security')) return '🔒';
                return '📜';
            }
        
            getSameRoomDevices(currentItem) {
                return this.allItems.filter(item => 
                    item.room === currentItem.room && 
                    item.itemType === 'entity' &&
                    item.id !== currentItem.id
                ).slice(0, 3); // Max 3 andere Geräte
            }

            
        

            setupReplaceEventListeners(item) {
                // Replace-Mode Dropdown
                this.setupReplaceDropdown(item);         
                
                // Back Button
                const backButton = this.shadowRoot.getElementById('backToSearch');
                backButton.addEventListener('click', () => this.switchBackToSearch());
                
                // Album Art Updates nur für Media Player
                if (item.type === 'media_player') {
                    this.setupAlbumArtUpdates(item);
                }                
                
                // Restliche Event Listeners
                this.setupRemainingReplaceEventListeners(item);
            }

            // Event Listeners in separater Methode für bessere Übersicht
            setupRemainingReplaceEventListeners(item) {
                // Shortcut Buttons
                const shortcutButtons = this.shadowRoot.querySelectorAll('.more-info-replace [data-shortcut-action]');
                shortcutButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const actionType = button.getAttribute('data-shortcut-action');
                        const actionId = button.getAttribute('data-shortcut-id');
                        this.executeShortcutAction(actionType, actionId, button);
                    });
                });
                
                // Control Buttons
                const controlButtons = this.shadowRoot.querySelectorAll('.more-info-replace [data-action]');
                controlButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const action = button.getAttribute('data-action');
                        this.executeReplaceAction(item, action, button);
                    });
                });
                
                // Sliders
                const sliders = this.shadowRoot.querySelectorAll('.more-info-replace [data-control]');
                sliders.forEach(slider => {
                    slider.addEventListener('input', (e) => {
                        this.handleReplaceSliderChange(item, slider.getAttribute('data-control'), e.target.value);
                    });
                });
                
                // Music Assistant Event Listeners
                this.setupMusicAssistantEventListeners(item);
                
                // TTS Event Listeners
                this.setupTTSEventListeners(item);
                
                // HA Light Control Event Listeners
                this.setupHALightControls(item);   
                
                // HA Cover Control Event Listeners
                this.setupHACoverControls(item);
                
                // HA Climate Control Event Listeners
                this.setupHAClimateControls(item);
                
                // Media Player TTS und Music Toggle Buttons - NEU HINZUGEFÜGT
                const mediaTTSToggle = this.shadowRoot.querySelector(`[id="new-media-tts-toggle-${item.id}"]`);
                const mediaMusicToggle = this.shadowRoot.querySelector(`[id="new-media-music-toggle-${item.id}"]`);
                const mediaTTSContainer = this.shadowRoot.querySelector(`[id="new-media-tts-${item.id}"]`);
                const mediaMusicContainer = this.shadowRoot.querySelector(`[id="new-media-music-${item.id}"]`);
            
                // TTS Toggle Event Listener
                if (mediaTTSToggle && mediaTTSContainer) {
                    mediaTTSToggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('🗣️ MEDIA TTS TOGGLE CLICKED!');
                        
                        const isOpen = mediaTTSContainer.getAttribute('data-is-open') === 'true';
                        
                        // Schließe Music Container falls offen
                        if (mediaMusicContainer) {
                            mediaMusicContainer.classList.remove('visible');
                            mediaMusicContainer.setAttribute('data-is-open', 'false');
                        }
                        
                        if (isOpen) {
                            // TTS schließen
                            mediaTTSContainer.classList.remove('visible');
                            mediaTTSContainer.setAttribute('data-is-open', 'false');
                        } else {
                            // TTS öffnen
                            mediaTTSContainer.classList.add('visible');
                            mediaTTSContainer.setAttribute('data-is-open', 'true');
                            
                            // TTS Event Listeners setup
                            setTimeout(() => this.setupTTSEventListeners(item), 150);
                        }
                        
                        // Button Animation
                        mediaTTSToggle.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            mediaTTSToggle.style.transform = '';
                        }, 150);
                    }, true);
                }
            
                // Music Toggle Event Listener
                if (mediaMusicToggle && mediaMusicContainer) {
                    mediaMusicToggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('🎵 MEDIA MUSIC TOGGLE CLICKED!');
                        
                        const isOpen = mediaMusicContainer.getAttribute('data-is-open') === 'true';
                        
                        // Schließe TTS Container falls offen
                        if (mediaTTSContainer) {
                            mediaTTSContainer.classList.remove('visible');
                            mediaTTSContainer.setAttribute('data-is-open', 'false');
                        }
                        
                        if (isOpen) {
                            // Music schließen
                            mediaMusicContainer.classList.remove('visible');
                            mediaMusicContainer.setAttribute('data-is-open', 'false');
                        } else {
                            // Music öffnen
                            mediaMusicContainer.classList.add('visible');
                            mediaMusicContainer.setAttribute('data-is-open', 'true');
                            
                            // Music Assistant Event Listeners setup
                            setTimeout(() => this.setupMusicAssistantEventListeners(item), 150);
                        }
                        
                        // Button Animation
                        mediaMusicToggle.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            mediaMusicToggle.style.transform = '';
                        }, 150);
                    }, true);
                }
            }


     


            setupHALightControls(item) {
                if (item.type !== 'light') return;
                
                console.log('=== SETUP DUAL POWER BUTTON LIGHT CONTROLS ===');
                console.log('Item:', item);
                
                const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
                if (!replaceContainer) {
                    console.log('❌ Replace container not found');
                    return;
                }
                
                // DOM Elemente
                const brightnessSlider = replaceContainer.querySelector(`[id="new-light-brightness-slider-${item.id}"]`);
                const brightnessValue = replaceContainer.querySelector(`[id="new-light-brightness-value-${item.id}"]`);
                const entityState = replaceContainer.querySelector(`[id="new-light-state-${item.id}"]`);
                
                // BEIDE Power Buttons
                const powerButtonCenter = replaceContainer.querySelector(`[id="new-light-toggle-center-${item.id}"]`);
                const powerButtonRow = replaceContainer.querySelector(`[id="new-light-toggle-${item.id}"]`);
                
                const colorToggleButton = replaceContainer.querySelector(`[id="new-light-color-toggle-${item.id}"]`);
                const colorsContainer = replaceContainer.querySelector(`[id="new-light-colors-${item.id}"]`);
                
                console.log('DOM Elements found:', {
                    brightnessSlider: !!brightnessSlider,
                    powerButtonCenter: !!powerButtonCenter,
                    powerButtonRow: !!powerButtonRow,
                    colorToggleButton: !!colorToggleButton,
                    colorsContainer: !!colorsContainer
                });
                
                // Brightness Slider Event Listener
                if (brightnessSlider) {
                    this.updateNewLightSliderColor(item);
                    
                    brightnessSlider.addEventListener('input', (e) => {
                        const brightness = parseInt(e.target.value);
                        
                        const container = brightnessSlider.parentElement;
                        const track = container.querySelector('.new-light-slider-track');
                        
                        if (track) {
                            track.style.width = brightness + '%';
                        }
                        
                        if (brightnessValue) {
                            brightnessValue.textContent = brightness + '%';
                        }
                        if (entityState && item.state === 'on') {
                            entityState.textContent = `Ein • ${brightness}% Helligkeit`;
                        }
                        
                        this.handleSliderChange(item, 'brightness', brightness);
                    });
                }
                
                // Power Button Event Handler Funktion
                const handlePowerClick = (button) => {
                    console.log('🔘 POWER BUTTON CLICKED!');
                    
                    const wasOn = item.state === 'on';
                    
                    // Service Call
                    this.executeReplaceAction(item, 'toggle', button).then(() => {
                        // Nach dem Service Call: UI animieren
                        setTimeout(() => {
                            this.animateLightControls(item.id, !wasOn);
                        }, 300);
                    });
                };
                
                // Center Power Button Event Listener
                if (powerButtonCenter) {
                    powerButtonCenter.addEventListener('click', () => {
                        handlePowerClick(powerButtonCenter);
                    });
                }
                
                // Row Power Button Event Listener
                if (powerButtonRow) {
                    powerButtonRow.addEventListener('click', () => {
                        handlePowerClick(powerButtonRow);
                    });
                }
                
                // Color Toggle Button Event Listener (FIXED: Kein automatisches Schließen)
                if (colorToggleButton) {
                    colorToggleButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        console.log('🎨 COLOR TOGGLE CLICKED!');
                        
                        if (colorsContainer) {
                            const isOpen = colorsContainer.getAttribute('data-is-open') === 'true';
                            
                            console.log('🎨 Current state:', { isOpen });
                            
                            if (isOpen) {
                                // Schließen
                                colorsContainer.classList.remove('visible');
                                colorsContainer.setAttribute('data-is-open', 'false');
                                console.log('🎨 Farbpalette geschlossen');
                            } else {
                                // Öffnen
                                colorsContainer.classList.add('visible');
                                colorsContainer.setAttribute('data-is-open', 'true');
                                console.log('🎨 Farbpalette geöffnet');
                            }
                            
                            // Button Animation
                            colorToggleButton.style.transform = 'scale(0.9)';
                            setTimeout(() => {
                                colorToggleButton.style.transform = '';
                            }, 150);
                        }
                    }, true); // WICHTIG: Capture Phase verwenden

                    // Zusätzlicher Schutz: Verhindere andere Events auf dem Button
                    colorToggleButton.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    });
                    
                    colorToggleButton.addEventListener('mouseup', (e) => {
                        e.stopPropagation();
                    });
                }                    
                
                // Temperature Presets
                const tempPresets = replaceContainer.querySelectorAll(`[id="new-light-${item.id}"] [data-temp]`);
                console.log('Temperature presets found:', tempPresets.length);
                
                tempPresets.forEach(preset => {
                    preset.addEventListener('click', () => {
                        console.log('🔥 TEMPERATURE PRESET CLICKED!');
                        tempPresets.forEach(p => p.classList.remove('active'));
                        preset.classList.add('active');
                        
                        const kelvin = parseInt(preset.getAttribute('data-kelvin'));
                        const mireds = Math.round(1000000 / kelvin);
                        
                        if (this._hass && item.state === 'on') {
                            this._hass.callService('light', 'turn_on', {
                                entity_id: item.id,
                                color_temp: mireds
                            }).then(() => {
                                setTimeout(() => {
                                    const currentState = this._hass.states[item.id];
                                    if (currentState) {
                                        Object.assign(item, {
                                            state: currentState.state,
                                            attributes: currentState.attributes
                                        });
                                        this.updateNewLightSliderColor(item);
                                    }
                                }, 500);
                            }).catch(error => {
                                console.error('Color temp service call failed:', error);
                            });
                        }
                    });
                });
                
                // Color Presets
                const colorPresets = replaceContainer.querySelectorAll(`[id="new-light-colors-${item.id}"] .new-light-color-preset`);
                console.log('Color presets found:', colorPresets.length);
                
                colorPresets.forEach(preset => {
                    preset.addEventListener('click', () => {
                        console.log('🎨 COLOR PRESET CLICKED!');
                        colorPresets.forEach(p => p.classList.remove('active'));
                        preset.classList.add('active');
                        
                        const rgbString = preset.getAttribute('data-rgb');
                        if (rgbString && this._hass && item.state === 'on') {
                            const [r, g, b] = rgbString.split(',').map(Number);
                            
                            const supportedColorModes = item.attributes.supported_color_modes || [];
                            
                            let serviceCall;
                            if (supportedColorModes.includes('rgb')) {
                                serviceCall = this._hass.callService('light', 'turn_on', {
                                    entity_id: item.id,
                                    rgb_color: [r, g, b]
                                });
                            } else if (supportedColorModes.includes('xy')) {
                                const xy = this.rgbToXy(r, g, b);
                                serviceCall = this._hass.callService('light', 'turn_on', {
                                    entity_id: item.id,
                                    xy_color: xy
                                });
                            } else if (supportedColorModes.includes('hs')) {
                                const hs = this.rgbToHs(r, g, b);
                                serviceCall = this._hass.callService('light', 'turn_on', {
                                    entity_id: item.id,
                                    hs_color: hs
                                });
                            }
                            
                            if (serviceCall) {
                                serviceCall.then(() => {
                                    setTimeout(() => {
                                        const currentState = this._hass.states[item.id];
                                        if (currentState) {
                                            Object.assign(item, {
                                                state: currentState.state,
                                                attributes: currentState.attributes
                                            });
                                            this.updateNewLightSliderColor(item);
                                        }
                                    }, 500);
                                }).catch(error => {
                                    console.error('Color service call failed:', error);
                                });
                            }
                        }
                    });
                });
            }
            
            // Aktualisierte Animation Methode (nur der relevante Teil)
            animateLightControls(itemId, isOn) {
                console.log('🎬 Animating dual power light controls:', { itemId, isOn });
                
                const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
                if (!replaceContainer) return;
                
                const sliderContainer = replaceContainer.querySelector(`[id="new-light-slider-container-${itemId}"]`);
                const controlsRow = replaceContainer.querySelector(`[id="new-light-controls-row-${itemId}"]`);
                const powerCenter = replaceContainer.querySelector(`[id="new-light-power-center-${itemId}"]`);
                const colorsContainer = replaceContainer.querySelector(`[id="new-light-colors-${itemId}"]`);
                
                if (isOn) {
                    // Licht an: Zeige Row-Controls, verstecke Center Power
                    if (powerCenter) {
                        powerCenter.classList.remove('visible');
                    }
                    
                    setTimeout(() => {
                        if (sliderContainer) {
                            sliderContainer.classList.add('visible');
                        }
                        if (controlsRow) {
                            controlsRow.classList.add('visible');
                        }
                    }, 200);
                    
                } else {
                    // Licht aus: Zeige Center Power, verstecke Row-Controls
                    if (colorsContainer) {
                        colorsContainer.classList.remove('visible'); // Nur visible entfernen
                        colorsContainer.setAttribute('data-is-open', 'false');
                    }
                    
                    if (controlsRow) {
                        controlsRow.classList.remove('visible');
                    }
                    if (sliderContainer) {
                        sliderContainer.classList.remove('visible');
                    }
                    
                    setTimeout(() => {
                        if (powerCenter) {
                            powerCenter.classList.add('visible');
                        }
                    }, 200);
                }
            }  



    
            
            // Neue Methode für Slider-Farbe (ersetzt updateSliderColor)
            updateNewLightSliderColor(item) {
                console.log('🔍 Updating new light slider color for:', item.id);
                
                const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
                if (!replaceContainer) return;
                
                const track = replaceContainer.querySelector(`[id="new-light-track-${item.id}"]`);
                
                if (!track) {
                    console.log('❌ New light track not found for:', item.id);
                    return;
                }
                
                let sliderColor = '#4CAF50'; // Fallback
                
                if (item.state === 'off') {
                    sliderColor = 'rgba(255, 255, 255, 0.3)';
                } else {
                    // Farbe basierend auf Licht-Attributen
                    if (item.attributes.rgb_color) {
                        const [r, g, b] = item.attributes.rgb_color;
                        sliderColor = `rgb(${r}, ${g}, ${b})`;
                    } else if (item.attributes.color_temp_kelvin) {
                        sliderColor = this.kelvinToRgb(item.attributes.color_temp_kelvin);
                    } else if (item.attributes.hs_color) {
                        const [h, s] = item.attributes.hs_color;
                        sliderColor = this.hsToRgb(h, s, 100);
                    } else if (item.attributes.xy_color) {
                        sliderColor = this.xyToRgb(item.attributes.xy_color[0], item.attributes.xy_color[1]);
                    }
                }
                
                track.style.background = sliderColor;
                console.log('✅ New light slider color updated:', sliderColor);
            }




    
            // RGB zu XY Konvertierung für Philips Hue und andere XY Lichter
            rgbToXy(r, g, b) {
                // Normalisiere RGB zu 0-1
                r = r / 255;
                g = g / 255;
                b = b / 255;
                
                // Gamma Korrektur
                r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : (r / 12.92);
                g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : (g / 12.92);
                b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : (b / 12.92);
                
                // RGB zu XYZ
                const X = r * 0.649926 + g * 0.103455 + b * 0.197109;
                const Y = r * 0.234327 + g * 0.743075 + b * 0.022598;
                const Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;
                
                // XYZ zu xy
                const x = X / (X + Y + Z);
                const y = Y / (X + Y + Z);
                
                // Clamp values
                return [
                    Math.max(0, Math.min(1, x || 0)),
                    Math.max(0, Math.min(1, y || 0))
                ];
            }
            
            // RGB zu HS Konvertierung (Fallback)
            rgbToHs(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const diff = max - min;
                
                let h = 0;
                let s = max === 0 ? 0 : diff / max;
                
                if (diff !== 0) {
                    switch (max) {
                        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / diff + 2; break;
                        case b: h = (r - g) / diff + 4; break;
                    }
                    h /= 6;
                }
                
                return [Math.round(h * 360), Math.round(s * 100)];
            }    


            
            // NEUE Methode: Slider-Farbe basierend auf Licht-Zustand
            updateSliderColor(item) {
                console.log('🔍 Suche Track für:', item.id);
                
                // ALLE möglichen Container durchsuchen
                let track = null;
                
                // 1. Replace Container
                const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
                if (replaceContainer) {
                    track = replaceContainer.querySelector(`[id="ha-track-${item.id}"]`);
                    console.log('🔍 Replace Container - Track gefunden:', !!track);
                }
                
                // 2. Fallback: Gesamtes shadowRoot
                if (!track) {
                    track = this.shadowRoot.querySelector(`[id="ha-track-${item.id}"]`);
                    console.log('🔍 ShadowRoot - Track gefunden:', !!track);
                }
                
                // 3. Alternative: Alle Tracks finden
                if (!track) {
                    const allTracks = this.shadowRoot.querySelectorAll('.ha-slider-track');
                    console.log('🔍 Alle Tracks gefunden:', allTracks.length);
                    allTracks.forEach((t, i) => console.log(`Track ${i}:`, t.id));
                    
                    // Nimm den letzten Track (wahrscheinlich der aktuelle)
                    track = allTracks[allTracks.length - 1];
                }
                    
                if (!track) {
                    console.log('❌ Track immer noch nicht gefunden für:', item.id);
                    return;
                }
                
                let sliderColor = '#4CAF50'; // Fallback Grün
                
                if (item.state === 'off') {
                    sliderColor = 'rgba(255, 255, 255, 0.3)'; // Grau wenn aus
                } else {
                    // Farbe basierend auf Licht-Attributen
                    if (item.attributes.rgb_color) {
                        // RGB Farbe direkt verwenden
                        const [r, g, b] = item.attributes.rgb_color;
                        sliderColor = `rgb(${r}, ${g}, ${b})`;
                        console.log('🎨 RGB Farbe gesetzt:', sliderColor);
                    } else if (item.attributes.color_temp_kelvin) {
                        // Farbtemperatur zu RGB konvertieren
                        sliderColor = this.kelvinToRgb(item.attributes.color_temp_kelvin);
                        console.log('🌡️ Kelvin Farbe gesetzt:', sliderColor);
                    } else if (item.attributes.hs_color) {
                        // HS zu RGB konvertieren
                        const [h, s] = item.attributes.hs_color;
                        sliderColor = this.hsToRgb(h, s, 100);
                        console.log('🌈 HS Farbe gesetzt:', sliderColor);
                    } else if (item.attributes.xy_color) {
                        // XY zu RGB konvertieren (vereinfacht)
                        sliderColor = this.xyToRgb(item.attributes.xy_color[0], item.attributes.xy_color[1]);
                        console.log('📍 XY Farbe gesetzt:', sliderColor);
                    }
                }
                
                track.style.background = sliderColor;
                console.log('✅ Slider-Farbe aktualisiert für:', item.id, 'Farbe:', sliderColor);
            }
            
            // Kelvin zu RGB Konvertierung
            kelvinToRgb(kelvin) {
                const temp = kelvin / 100;
                let r, g, b;
                
                if (temp <= 66) {
                    r = 255;
                    g = temp <= 19 ? 0 : 99.4708025861 * Math.log(temp - 10) - 161.1195681661;
                    b = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
                } else {
                    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
                    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
                    b = 255;
                }
                
                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));
                
                return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
            }
            
            // HS zu RGB Konvertierung
            hsToRgb(h, s, v) {
                h = h / 360;
                s = s / 100;
                v = v / 100;
                
                const i = Math.floor(h * 6);
                const f = h * 6 - i;
                const p = v * (1 - s);
                const q = v * (1 - f * s);
                const t = v * (1 - (1 - f) * s);
                
                let r, g, b;
                switch (i % 6) {
                    case 0: r = v; g = t; b = p; break;
                    case 1: r = q; g = v; b = p; break;
                    case 2: r = p; g = v; b = t; break;
                    case 3: r = p; g = q; b = v; break;
                    case 4: r = t; g = p; b = v; break;
                    case 5: r = v; g = p; b = q; break;
                }
                
                return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
            }
            
            // XY zu RGB Konvertierung (vereinfacht)
            xyToRgb(x, y) {
                const z = 1.0 - x - y;
                const Y = 1.0;
                const X = (Y / y) * x;
                const Z = (Y / y) * z;
                
                let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
                let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
                let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;
                
                r = Math.max(0, Math.min(1, r));
                g = Math.max(0, Math.min(1, g));
                b = Math.max(0, Math.min(1, b));
                
                return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
            } 

            openHAMoreInfo(entityId) {
                if (!this._hass) return;
                
                // Dispatch HA more-info event
                const event = new CustomEvent('hass-more-info', {
                    detail: { entityId: entityId },
                    bubbles: true,
                    composed: true
                });
                
                this.dispatchEvent(event);
            }
    


            setupAlbumArtUpdates(item) {
                // Speichere den aktuellen Media State für Vergleiche
                let lastMediaTitle = item.attributes.media_title;
                let lastEntityPicture = item.attributes.entity_picture;
                let lastMediaImageUrl = item.attributes.media_image_url;
                
                // Erstelle einen Timer für regelmäßige Updates
                const albumArtUpdateInterval = setInterval(() => {
                    if (!this._hass || !this._hass.states[item.id]) {
                        clearInterval(albumArtUpdateInterval);
                        return;
                    }
                    
                    const currentState = this._hass.states[item.id];
                    const currentMediaTitle = currentState.attributes.media_title;
                    const currentEntityPicture = currentState.attributes.entity_picture;
                    const currentMediaImageUrl = currentState.attributes.media_image_url;
                    
                    // Prüfe ob sich Media-Daten geändert haben
                    const hasMediaChanged = 
                        currentMediaTitle !== lastMediaTitle ||
                        currentEntityPicture !== lastEntityPicture ||
                        currentMediaImageUrl !== lastMediaImageUrl;
                    
                    if (hasMediaChanged) {
                        console.log('🎵 Album Art Update detected:', {
                            oldTitle: lastMediaTitle,
                            newTitle: currentMediaTitle,
                            oldPicture: lastEntityPicture,
                            newPicture: currentEntityPicture
                        });
                        
                        // Update item mit neuen Daten
                        Object.assign(item, {
                            state: currentState.state,
                            attributes: currentState.attributes
                        });
                        
                        // Album Art und Info aktualisieren
                        this.updateMediaPlayerAlbumArt(item);
                        
                        // Neue Werte speichern
                        lastMediaTitle = currentMediaTitle;
                        lastEntityPicture = currentEntityPicture;
                        lastMediaImageUrl = currentMediaImageUrl;
                    }
                    
                    // Playing State Animation updaten
                    const albumCover = this.shadowRoot.querySelector('.album-cover-large');
                    if (albumCover) {
                        const isPlaying = currentState.state === 'playing';
                        albumCover.classList.toggle('playing', isPlaying);
                    }
                    
                }, 2000); // Alle 2 Sekunden prüfen
                
                // Cleanup wenn Replace Mode verlassen wird
                const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
                if (replaceContainer) {
                    replaceContainer.setAttribute('data-interval-id', albumArtUpdateInterval);
                }
            }
    

                setupReplaceMediaPlayerTabs(item) {
                    const tabs = this.shadowRoot.querySelectorAll('.replace-media-tab');
                    const contents = this.shadowRoot.querySelectorAll('.replace-media-tab-content');
                    
                    tabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            const targetTab = tab.getAttribute('data-replace-tab');
                            
                            // Alle Tabs deaktivieren
                            tabs.forEach(t => t.classList.remove('active'));
                            contents.forEach(c => c.classList.remove('active'));
                            
                            // Aktiven Tab aktivieren
                            tab.classList.add('active');
                            const targetContent = this.shadowRoot.querySelector(`[data-replace-tab-content="${targetTab}"]`);
                            if (targetContent) {
                                targetContent.classList.add('active');
                                
                                // Spezielle Initialisierung für verschiedene Tabs
                                if (targetTab === 'music' && this.checkMusicAssistantAvailability()) {
                                    // Music Assistant Event Listeners neu setup mit Delay
                                    setTimeout(() => {
                                        this.setupMusicAssistantEventListeners(item);
                                    }, 150);
                                }
                                
                                if (targetTab === 'tts') {
                                    // TTS Event Listeners neu setup mit Delay
                                    setTimeout(() => {
                                        this.setupTTSEventListeners(item);
                                    }, 150);
                                }
                            }
                        });
                    });
                    
                    // Initial Setup für alle Tabs (aber nur der erste ist sichtbar)
                    setTimeout(() => {
                        this.setupTTSEventListeners(item);
                        this.setupMusicAssistantEventListeners(item);
                    }, 100);
                }    
                
                setupMusicAssistantEventListeners(item) {
                    const searchInput = this.shadowRoot.querySelector(`[data-ma-search="${item.id}"]`);
                    const resultsContainer = this.shadowRoot.getElementById(`ma-results-${item.id}`);
                    const enqueueMode = this.shadowRoot.querySelector(`[data-ma-enqueue="${item.id}"]`);
                    const filterContainer = this.shadowRoot.getElementById(`ma-filters-${item.id}`);
                    
                    if (!searchInput || !resultsContainer) return;
                    
                    let searchTimeout;
                    let currentFilter = 'all';
                    let currentEnqueueMode = 'play';
                    let lastResults = null;
                    
                    // Enqueue Mode Toggle
                    if (enqueueMode) {
                        const enqueueModes = [
                            { key: 'play', icon: '▶️', text: 'Play now' },
                            { key: 'replace', icon: '🔄', text: 'Replace queue' },
                            { key: 'next', icon: '⏭️', text: 'Add next' },
                            { key: 'add', icon: '➕', text: 'Add to queue' }
                        ];
                        
                        let currentModeIndex = 0;
                        
                        enqueueMode.addEventListener('click', () => {
                            currentModeIndex = (currentModeIndex + 1) % enqueueModes.length;
                            const mode = enqueueModes[currentModeIndex];
                            currentEnqueueMode = mode.key;
                            
                            enqueueMode.querySelector('.ma-enqueue-icon').textContent = mode.icon;
                            enqueueMode.querySelector('.ma-enqueue-text').textContent = mode.text;
                        });
                    }
                    
                    // Filter Chips
                    if (filterContainer) {
                        filterContainer.querySelectorAll('.ma-filter-chip').forEach(chip => {
                            chip.addEventListener('click', () => {
                                // Remove active class from all chips
                                filterContainer.querySelectorAll('.ma-filter-chip').forEach(c => {
                                    c.classList.remove('ma-filter-active');
                                });
                                
                                // Add active class to clicked chip
                                chip.classList.add('ma-filter-active');
                                
                                currentFilter = chip.getAttribute('data-filter');
                                
                                // Re-display results with new filter
                                if (lastResults) {
                                    this.displayMusicAssistantResults(lastResults, resultsContainer, item.id, currentFilter, currentEnqueueMode);
                                }
                            });
                        });
                    }
                    
                    // Search Input
                    searchInput.addEventListener('input', (e) => {
                        const query = e.target.value.trim();
                        
                        clearTimeout(searchTimeout);
                        
                        if (query.length < 2) {
                            resultsContainer.innerHTML = '<div class="ma-empty-state">Gebe mindestens 2 Zeichen ein um zu suchen...</div>';
                            lastResults = null;
                            return;
                        }
                        
                        searchTimeout = setTimeout(async () => {
                            resultsContainer.innerHTML = '<div class="ma-loading">Suche läuft...</div>';
                            
                            const results = await this.searchMusicAssistant(query, item.id);
                            lastResults = results;
                            this.displayMusicAssistantResults(results, resultsContainer, item.id, currentFilter, currentEnqueueMode);
                        }, 300);
                    });
                }
                
                // Komplett neue displayMusicAssistantResults Funktion:
                
                displayMusicAssistantResults(results, container, entityId, activeFilter = 'all', enqueueMode = 'play') {
                    if (!results || Object.keys(results).length === 0) {
                        container.innerHTML = '<div class="ma-no-results">Keine Ergebnisse gefunden</div>';
                        return;
                    }
                    
                    let html = '';
                    const categoryOrder = ['artists', 'albums', 'tracks', 'playlists', 'radio'];
                    
                    // Filter results based on active filter
                    const filteredResults = {};
                    if (activeFilter === 'all') {
                        Object.assign(filteredResults, results);
                    } else {
                        if (results[activeFilter]) {
                            filteredResults[activeFilter] = results[activeFilter];
                        }
                    }
                    
                    if (Object.keys(filteredResults).length === 0) {
                        container.innerHTML = '<div class="ma-no-results">Keine Ergebnisse in dieser Kategorie</div>';
                        return;
                    }
                    
                    // Display results
                    categoryOrder.forEach(type => {
                        const items = filteredResults[type];
                        if (!items || items.length === 0) return;
                        
                        const categoryName = this.getMusicAssistantCategoryName(type);
                        const isTrackType = type === 'tracks';
                        
                        if (activeFilter === 'all') {
                            html += `
                                <div class="ma-category-header" data-category="${type}">
                                    <h3 class="ma-category-title">${categoryName}</h3>
                                    <span class="ma-category-chevron">›</span>
                                </div>
                            `;
                        }
                        
                        if (isTrackType) {
                            // List view for tracks
                            html += '<div class="ma-list-container">';
                            const displayItems = activeFilter === 'all' ? items.slice(0, 5) : items;
                            
                            displayItems.forEach(item => {
                                const artistText = item.artists ? item.artists.map(a => a.name).join(', ') : '';
                                const imageUrl = item.image || (item.album ? item.album.image : '');
                                
                                html += `
                                    <div class="ma-list-item" data-uri="${item.uri}" data-type="${item.media_type}" data-name="${item.name}">
                                        <div class="ma-list-image">
                                            ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" />` : '🎵'}
                                        </div>
                                        <div class="ma-list-info">
                                            <div class="ma-list-name">${item.name}</div>
                                            <div class="ma-list-artist">${artistText}</div>
                                        </div>
                                    </div>
                                `;
                            });
                            html += '</div>';
                        } else {
                            // Grid view for artists, albums, playlists, radio
                            html += '<div class="ma-grid-container">';
                            const displayItems = activeFilter === 'all' ? items.slice(0, 6) : items;
                            
                            displayItems.forEach(item => {
                                const artistText = item.artists ? item.artists.map(a => a.name).join(', ') : '';
                                const imageUrl = item.image;
                                const defaultIcon = type === 'artists' ? '👤' : type === 'albums' ? '💿' : type === 'playlists' ? '📋' : '📻';
                                
                                html += `
                                    <div class="ma-grid-item" data-uri="${item.uri}" data-type="${item.media_type}" data-name="${item.name}">
                                        <div class="ma-grid-image">
                                            ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" />` : defaultIcon}
                                        </div>
                                        <div class="ma-grid-name">${item.name}</div>
                                        ${artistText ? `<div class="ma-grid-artist">${artistText}</div>` : ''}
                                    </div>
                                `;
                            });
                            html += '</div>';
                        }
                    });
                    
                    container.innerHTML = html;
                    
                    // Event Listeners für Items
                    container.querySelectorAll('.ma-list-item, .ma-grid-item').forEach(itemElement => {
                        itemElement.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            
                            const uri = itemElement.getAttribute('data-uri');
                            const mediaType = itemElement.getAttribute('data-type');
                            const name = itemElement.getAttribute('data-name');
                            
                            // Visual feedback
                            itemElement.style.opacity = '0.6';
                            
                            await this.playMusicAssistantItem({
                                uri: uri,
                                media_type: mediaType,
                                name: name
                            }, entityId, enqueueMode);
                            
                            setTimeout(() => {
                                itemElement.style.opacity = '1';
                            }, 1000);
                        });
                    });
                    
                    // Category header click handlers for "all" view
                    if (activeFilter === 'all') {
                        container.querySelectorAll('.ma-category-header').forEach(header => {
                            header.addEventListener('click', () => {
                                const category = header.getAttribute('data-category');
                                
                                // Switch to that category filter
                                const filterChip = this.shadowRoot.querySelector(`[data-filter="${category}"]`);
                                if (filterChip) {
                                    filterChip.click();
                                }
                            });
                        });
                    }
                }


                /**
                 * Richtet TTS Event Listeners ein
                 */
                setupTTSEventListeners(item) {
                    const ttsInput = this.shadowRoot.querySelector(`[data-tts-input="${item.id}"]`);
                    const ttsCounter = this.shadowRoot.querySelector(`[data-tts-counter="${item.id}"]`);
                    const ttsLanguage = this.shadowRoot.querySelector(`[data-tts-language="${item.id}"]`);
                    const ttsSpeakButton = this.shadowRoot.querySelector(`[data-tts-speak="${item.id}"]`);
                    const ttsPresets = this.shadowRoot.querySelectorAll(`[data-tts-preset]`);
                    
                    if (!ttsInput || !ttsSpeakButton) return;
                    
                    // Text Input Event Listener
                    ttsInput.addEventListener('input', (e) => {
                        const text = e.target.value;
                        const length = text.length;
                        
                        // Counter aktualisieren
                        if (ttsCounter) {
                            ttsCounter.textContent = `${length} / 300 Zeichen`;
                            ttsCounter.classList.toggle('warning', length > 250);
                        }
                        
                        // Speak Button aktivieren/deaktivieren
                        ttsSpeakButton.disabled = length === 0 || length > 300;
                    });
                    
                    // Preset Buttons Event Listeners
                    ttsPresets.forEach(preset => {
                        preset.addEventListener('click', (e) => {
                            const presetText = preset.getAttribute('data-tts-preset');
                            if (presetText && ttsInput) {
                                ttsInput.value = presetText;
                                
                                // Input Event manuell triggern
                                const inputEvent = new Event('input');
                                ttsInput.dispatchEvent(inputEvent);
                                
                                // Visual Feedback
                                preset.style.transform = 'scale(0.95)';
                                setTimeout(() => {
                                    preset.style.transform = '';
                                }, 150);
                            }
                        });
                    });
                    
                    // Speak Button Event Listener
                    ttsSpeakButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        
                        const text = ttsInput.value.trim();
                        if (!text) return;
                        
                        const language = ttsLanguage ? ttsLanguage.value : 'de';
                        const isSpeaking = ttsSpeakButton.classList.contains('speaking');
                        
                        if (isSpeaking) {
                            // Stoppen
                            await this.stopTTS(item.id);
                            this.updateTTSButton(ttsSpeakButton, false);
                        } else {
                            // Sprechen
                            const success = await this.speakTTS(item.id, text, language, ttsSpeakButton);
                            if (success) {
                                this.updateTTSButton(ttsSpeakButton, true);
                                
                                // Geschätzte Spieldauer (ca. 150 Wörter pro Minute)
                                const wordCount = text.split(' ').length;
                                const estimatedDuration = Math.max(3000, (wordCount / 150) * 60 * 1000);
                                
                                // Button nach geschätzter Zeit zurücksetzen
                                setTimeout(() => {
                                    this.updateTTSButton(ttsSpeakButton, false);
                                }, estimatedDuration);
                            }
                        }
                    });
                }



                

        
                /**
                 * Spricht Text über TTS aus - NUR AMAZON POLLY
                 */
                async speakTTS(entityId, text, language = 'de', buttonElement = null) {
                    if (!this._hass || !text) return false;
                    
                    try {
                        if (buttonElement) {
                            buttonElement.disabled = true;
                            buttonElement.innerHTML = '⏳ Spreche...';
                        }
                        
                        console.log('🗣️ Amazon Polly TTS:', { entityId, text });
                        
                        // Nur Amazon Polly verwenden - einfachste Parameter
                        const serviceData = {
                            entity_id: entityId,
                            message: text
                        };
                        
                        // Fire-and-Forget für Polly (gegen Proxy-Timeouts)
                        this._hass.callService('tts', 'amazon_polly_say', serviceData).catch(error => {
                            if (error.message.includes('timeout') || error.message.includes('5XX')) {
                                console.log('ℹ️ Polly Proxy-Fehler ignoriert - Audio läuft vermutlich trotzdem');
                            } else {
                                console.error('❌ Polly TTS Fehler:', error);
                            }
                        });
                        
                        console.log('✅ Amazon Polly TTS gestartet');
                        
                        // Button automatisch nach 4 Sekunden zurücksetzen
                        if (buttonElement) {
                            setTimeout(() => {
                                this.updateTTSButton(buttonElement, false);
                            }, 4000);
                        }
                        
                        return true;
                        
                    } catch (error) {
                        console.error('❌ Amazon Polly Start fehlgeschlagen:', error);
                        
                        if (buttonElement) {
                            buttonElement.innerHTML = '❌ Polly-Fehler';
                            buttonElement.disabled = false;
                            setTimeout(() => this.updateTTSButton(buttonElement, false), 3000);
                        }
                        return false;
                    }
                }




    
                
                /**
                 * Stoppt TTS Wiedergabe
                 */
                async stopTTS(entityId) {
                    if (!this._hass) return false;
                    
                    try {
                        // Media Player stoppen
                        await this._hass.callService('media_player', 'media_stop', {
                            entity_id: entityId
                        });
                        
                        console.log('TTS gestoppt');
                        return true;
                        
                    } catch (error) {
                        console.error('TTS Stop Fehler:', error);
                        return false;
                    }
                }
                
                /**
                 * Aktualisiert TTS Button Status
                 */
                updateTTSButton(button, isSpeaking) {
                    if (!button) return;
                    
                    if (isSpeaking) {
                        button.classList.add('speaking');
                        button.innerHTML = '⏹️ Stoppen';
                        button.disabled = false;
                    } else {
                        button.classList.remove('speaking');
                        button.innerHTML = '🗣️ Vorlesen';
                        button.disabled = false;
                    }
                }

                    
                executeShortcutAction(actionType, actionId, button) {
                    if (!this._hass) return;
                    
                    // Visual Feedback
                    const originalContent = button.innerHTML;
                    button.style.opacity = '0.6';
                    button.disabled = true;
                    
                    let serviceCall;
                    
                    switch (actionType) {
                        case 'scene':
                            serviceCall = this._hass.callService('scene', 'turn_on', { entity_id: actionId });
                            break;
                        case 'script':
                            serviceCall = this._hass.callService('script', 'turn_on', { entity_id: actionId });
                            break;
                        case 'device':
                            // Navigiere zu anderem Gerät
                            const targetItem = this.allItems.find(item => item.id === actionId);
                            if (targetItem) {
                                this.switchToReplaceMode(targetItem);
                                return;
                            }
                            break;
                    }
                    
                    if (serviceCall) {
                        serviceCall.then(() => {
                            // Success feedback
                            button.style.background = '#d4edda';
                            setTimeout(() => {
                                button.style.opacity = '1';
                                button.style.background = '';
                                button.disabled = false;
                            }, 1000);
                        }).catch(() => {
                            // Error feedback
                            button.style.background = '#f8d7da';
                            setTimeout(() => {
                                button.style.opacity = '1';
                                button.style.background = '';
                                button.disabled = false;
                            }, 1000);
                        });
                    } else {
                        setTimeout(() => {
                            button.style.opacity = '1';
                            button.disabled = false;
                        }, 500);
                    }
                }

    
    setupShortcutEventListeners(item) {
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (!replaceContainer) return;
        
        // Shortcut Buttons
        const shortcutButtons = replaceContainer.querySelectorAll('[data-shortcut-action]');
        shortcutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const actionType = button.getAttribute('data-shortcut-action');
                const actionId = button.getAttribute('data-shortcut-id');
                this.executeShortcutAction(actionType, actionId, button);
            });
        });
    }        
    
    toggleAccordion(header) {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Alle anderen schließen (Single-Accordion Verhalten)
            // Wenn du Multi-Accordion willst, entferne diesen Block
            this.shadowRoot.querySelectorAll('.more-info-replace .accordion-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Aktuelles Item togglen
            item.classList.toggle('active', !isActive);
        }
    
        switchHistoryTab(tab, viewType) {
            // Tab aktiv setzen
            this.shadowRoot.querySelectorAll('.more-info-replace .history-tab').forEach(t => {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            
            // Views umschalten
            this.shadowRoot.querySelectorAll('.more-info-replace [data-history-view]').forEach(view => {
                view.style.display = 'none';
            });
            
            const targetView = this.shadowRoot.querySelector(`.more-info-replace [data-history-view="${viewType}"]`);
            if (targetView) {
                targetView.style.display = 'block';
            }
        }

    

getQuickStats(item) {
        const stats = [];
        
        switch (item.itemType) {
            case 'entity':
                if (item.type === 'light' && item.state === 'on') {
                    stats.push(`${item.brightness || 0}% Helligkeit`);
                    if (item.attributes.color_temp) {
                        const tempK = Math.round(1000000 / item.attributes.color_temp);
                        stats.push(`${tempK}K Farbtemperatur`);
                    }
                } else if (item.type === 'climate') {
                    stats.push(`${item.current_temperature || '--'}°C Ist-Temperatur`);
                    stats.push(`${item.target_temperature || '--'}°C Soll-Temperatur`);
                } else if (item.type === 'media_player' && item.state === 'playing') {
                    if (item.media_title) stats.push(`♪ ${item.media_title}`);
                    stats.push(`${item.volume || 0}% Lautstärke`);
                } else if (item.type === 'cover') {
                    const position = item.position || 0;
                    const status = position === 0 ? 'Geschlossen' : 'Geöffnet';
                    stats.push(`${status} • ${position}%`);
                }
                break;
                
            case 'automation':
                if (item.lastTriggered) {
                    const lastDate = new Date(item.lastTriggered);
                    stats.push(`Zuletzt: ${lastDate.toLocaleDateString('de-DE')}`);
                }
                stats.push(item.state === 'on' ? 'Automatisch aktiv' : 'Manuell deaktiviert');
                break;
                
            case 'script':
                if (item.lastTriggered) {
                    const lastDate = new Date(item.lastTriggered);
                    stats.push(`Zuletzt: ${lastDate.toLocaleDateString('de-DE')}`);
                }
                stats.push('Manuell ausführbar');
                break;
                
            case 'scene':
                if (item.attributes.entity_id) {
                    stats.push(`${item.attributes.entity_id.length} Entitäten`);
                }
                stats.push('Szene bereit');
                break;
        }
        
        return stats;
    }

    getReplaceControlsHTML(item) {
        if (item.itemType !== 'entity') {
            return this.getNonEntityReplaceControls(item);
        }
        
        switch (item.type) {
            case 'light':
                return this.getLightReplaceControls(item);
            case 'climate':
                return this.getClimateReplaceControls(item);
            case 'cover':
                return this.getCoverReplaceControls(item);
            case 'media_player':
                return this.getMediaReplaceControls(item);
            case 'switch':
            case 'fan':
                return this.getBasicReplaceControls(item);
            default:
                return '';
        }
    }

    

    getLightReplaceControls(item) {
        const brightness = item.brightness || 0;
        const isOn = item.state === 'on';
        
        // Feature Detection
        const supportedColorModes = item.attributes.supported_color_modes || [];
        const hasTempSupport = 
            supportedColorModes.includes('color_temp') ||
            supportedColorModes.includes('ct') ||
            item.attributes.min_mireds !== undefined ||
            item.attributes.max_mireds !== undefined;
        
        const hasColorSupport = 
            supportedColorModes.includes('rgb') ||
            supportedColorModes.includes('hs') ||
            supportedColorModes.includes('xy') ||
            supportedColorModes.includes('rgbw') ||
            supportedColorModes.includes('rgbww');
        
        console.log('Centered Power Light Design:', {
            isOn,
            brightness,
            hasTempSupport,
            hasColorSupport
        });
        
        return `
            <div class="control-group-large">
                <div class="new-light-design" id="new-light-${item.id}">
                    
                    <!-- Header ohne Icon -->
                    <div class="new-light-header">
                        <div class="new-light-name">${item.name}</div>
                        <div class="new-light-state" id="new-light-state-${item.id}">
                            ${isOn ? `Ein • ${brightness}% Helligkeit` : 'Aus'}
                        </div>
                    </div>
                    
                    <!-- Mittiger Power Button (nur im Aus-Zustand sichtbar) -->
                    <div class="new-light-power-center ${!isOn ? 'visible' : ''}" id="new-light-power-center-${item.id}">
                        <button class="new-light-control-btn power-off" 
                                data-action="toggle" id="new-light-toggle-center-${item.id}">
                            🔌
                        </button>
                    </div>
                    
                    <!-- Zentraler Slider (nur sichtbar wenn an) -->
                    <div class="new-light-slider-container ${isOn ? 'visible' : ''}" id="new-light-slider-container-${item.id}">
                        <div class="new-light-slider-label">
                            <span>Helligkeit</span>
                            <span id="new-light-brightness-value-${item.id}">${brightness}%</span>
                        </div>
                        <div class="new-light-slider-track-container">
                            <div class="new-light-slider-track" style="width: ${brightness}%" id="new-light-track-${item.id}"></div>
                            <input type="range" class="new-light-slider-input" data-control="brightness" 
                                   min="1" max="100" value="${brightness}" id="new-light-brightness-slider-${item.id}">
                        </div>
                    </div>
                    
                    <!-- Control Buttons Row (nur sichtbar wenn an) -->
                    <div class="new-light-controls-row ${isOn ? 'visible' : ''}" id="new-light-controls-row-${item.id}">
                        <!-- Power Button -->
                        <button class="new-light-control-btn power-on" 
                                data-action="toggle" id="new-light-toggle-${item.id}">
                            💡
                        </button>
                        
                        ${hasTempSupport ? `
                        <!-- Temperature Buttons -->
                        <button class="new-light-control-btn secondary visible" data-temp="warm" data-kelvin="2700">
                            🔥
                        </button>
                        <button class="new-light-control-btn secondary visible" data-temp="neutral" data-kelvin="4000">
                            ☀️
                        </button>
                        <button class="new-light-control-btn secondary visible" data-temp="cool" data-kelvin="6500">
                            ❄️
                        </button>
                        ` : ''}
                        
                        ${hasColorSupport ? `
                        <!-- Farbauswahl Toggle Button -->
                        <button class="new-light-control-btn secondary new-light-color-toggle visible" 
                                id="new-light-color-toggle-${item.id}" data-action="toggle-colors">
                            🎨
                        </button>
                        ` : ''}
                    </div>
                    
                    ${hasColorSupport ? `
                    <!-- Farbpalette (versteckt by default) -->
                    <div class="new-light-colors" id="new-light-colors-${item.id}" data-is-open="false">
                        <div class="new-light-colors-grid">
                            <div class="new-light-color-preset" style="background: #ff6b35;" data-color="red" data-rgb="255,107,53"></div>
                            <div class="new-light-color-preset" style="background: #f7931e;" data-color="orange" data-rgb="247,147,30"></div>
                            <div class="new-light-color-preset" style="background: #ffd23f;" data-color="yellow" data-rgb="255,210,63"></div>
                            <div class="new-light-color-preset" style="background: #06d6a0;" data-color="green" data-rgb="6,214,160"></div>
                            <div class="new-light-color-preset" style="background: #118ab2;" data-color="blue" data-rgb="17,138,178"></div>
                            <div class="new-light-color-preset" style="background: #8e44ad;" data-color="purple" data-rgb="142,68,173"></div>
                            <div class="new-light-color-preset" style="background: #e91e63;" data-color="pink" data-rgb="233,30,99"></div>
                            <div class="new-light-color-preset active" style="background: #ffffff;" data-color="white" data-rgb="255,255,255"></div>
                        </div>
                    </div>
                    ` : ''}
                    
                </div>
            </div>
        `;
    }



    

    getBasicReplaceControls(item) {
        const isOn = item.state === 'on';
        
        return `
            <div class="control-group-large">
                
                <div class="main-control-large">
                    <button class="toggle-button-large ${isOn ? '' : 'off'}" data-action="toggle">
                        ${isOn ? '⏹️ Ausschalten' : '▶️ Einschalten'}
                    </button>
                </div>
            </div>
        `;
    }

    getClimateReplaceControls(item) {
        const targetTemp = item.target_temperature || 20;
        const isOn = ['heat', 'cool', 'auto', 'dry', 'fan_only'].includes(item.state);
        
        // MELCloud spezifische Attribute
        const currentVaneHorizontal = item.attributes.vane_horizontal || 'auto';
        const currentVaneVertical = item.attributes.vane_vertical || 'auto';
        const currentFanMode = item.attributes.fan_mode || 'auto';
        
        // Verfügbare Positionen aus Attributen oder Defaults
        const availableHorizontal = item.attributes.vane_horizontal_positions || ['auto', '1', '2', '3', '4', '5', 'split', 'swing'];
        const availableVertical = item.attributes.vane_vertical_positions || ['auto', '1', '2', '3', '4', '5', 'swing'];
        const availableFanModes = item.attributes.fan_modes || ['auto', 'quiet', '1', '2', '3', '4', '5'];
        
        console.log('🌡️ MELCloud Climate data:', {
            vane_horizontal: currentVaneHorizontal,
            vane_vertical: currentVaneVertical,
            fan_mode: currentFanMode,
            available: { horizontal: availableHorizontal, vertical: availableVertical, fan: availableFanModes }
        });
        
        return `
            <div class="control-group-large">
                <div class="new-light-design" id="new-climate-${item.id}">
                    
                    <!-- Header -->
                    <div class="new-light-header">
                        <div class="new-light-name">${item.name}</div>
                        <div class="new-light-state" id="new-climate-state-${item.id}">
                            ${isOn ? `Ein • ${targetTemp}°C Zieltemperatur` : 'Aus'}
                        </div>
                    </div>
                    
                    <!-- Mittiger Ein/Aus Button (nur im Aus-Zustand) -->
                    <div class="new-light-power-center ${!isOn ? 'visible' : ''}" id="new-climate-power-center-${item.id}">
                        <button class="new-light-control-btn power-off" 
                                data-action="heat" id="new-climate-toggle-center-${item.id}">
                            🌡️
                        </button>
                    </div>
                    
                    <!-- Zentraler Temperatur-Slider (nur sichtbar wenn an) -->
                    <div class="new-light-slider-container ${isOn ? 'visible' : ''}" id="new-climate-slider-container-${item.id}">
                        <div class="new-light-slider-label">
                            <span>Zieltemperatur</span>
                            <span id="new-climate-temp-value-${item.id}">${targetTemp}°C</span>
                        </div>
                        <div class="new-light-slider-track-container">
                            <div class="new-light-slider-track" style="width: ${((targetTemp - 10) / 20) * 100}%" id="new-climate-track-${item.id}"></div>
                            <input type="range" class="new-light-slider-input" data-control="temperature" 
                                   min="10" max="30" step="0.5" value="${targetTemp}" id="new-climate-temp-slider-${item.id}">
                        </div>
                    </div>
                    
                    <!-- Control Buttons Row (nur sichtbar wenn an) -->
                    <div class="new-light-controls-row ${isOn ? 'visible' : ''}" id="new-climate-controls-row-${item.id}">
                        <!-- Ein/Aus Button -->
                        <button class="new-light-control-btn power-on" 
                                data-action="off" id="new-climate-toggle-${item.id}">
                            🌡️
                        </button>
                        
                        ${(item.hvac_modes || []).includes('heat') ? `
                        <!-- Heizen Button -->
                        <button class="new-light-control-btn secondary visible ${(item.hvac_mode || item.state) === 'heat' ? 'active' : ''}" data-action="heat">
                            🔥
                        </button>
                        ` : ''}
                        
                        ${(item.hvac_modes || []).includes('cool') ? `
                        <!-- Kühlen Button -->
                        <button class="new-light-control-btn secondary visible ${(item.hvac_mode || item.state) === 'cool' ? 'active' : ''}" data-action="cool">
                            ❄️
                        </button>
                        ` : ''}
                        
                        ${(item.hvac_modes || []).includes('dry') ? `
                        <!-- Entfeuchtung Button -->
                        <button class="new-light-control-btn secondary visible ${(item.hvac_mode || item.state) === 'dry' ? 'active' : ''}" data-action="dry">
                            💧
                        </button>
                        ` : ''}
                        
                        ${(item.hvac_modes || []).includes('fan_only') ? `
                        <!-- Lüfter Button -->
                        <button class="new-light-control-btn secondary visible ${(item.hvac_mode || item.state) === 'fan_only' ? 'active' : ''}" data-action="fan_only">
                            🌀
                        </button>
                        ` : ''}
                        
                        <!-- Einstellungen Toggle Button -->
                        <button class="new-light-control-btn secondary new-light-color-toggle visible" 
                                id="new-climate-settings-toggle-${item.id}" data-action="toggle-settings">
                            ⚙️
                        </button>
                    </div>
                    
                    <!-- MELCloud Einstellungen-Menu -->
                    <div class="new-light-colors" id="new-climate-settings-${item.id}" data-is-open="false">
                        <div class="climate-settings-grid">
                            
                            <!-- Horizontale Lamellen -->
                            <div class="climate-setting-row">
                                <div class="climate-setting-label">Horizontale Lamellen</div>
                                <div class="climate-setting-options">
                                    ${availableHorizontal.map(mode => `
                                        <div class="climate-setting-option ${currentVaneHorizontal === mode ? 'active' : ''}" 
                                             data-climate-setting="vane_horizontal" data-value="${mode}">
                                            ${this.getMELCloudModeLabel(mode, 'horizontal')}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Vertikale Lamellen -->
                            <div class="climate-setting-row">
                                <div class="climate-setting-label">Vertikale Lamellen</div>
                                <div class="climate-setting-options">
                                    ${availableVertical.map(mode => `
                                        <div class="climate-setting-option ${currentVaneVertical === mode ? 'active' : ''}" 
                                             data-climate-setting="vane_vertical" data-value="${mode}">
                                            ${this.getMELCloudModeLabel(mode, 'vertical')}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Lüftergeschwindigkeit -->
                            <div class="climate-setting-row">
                                <div class="climate-setting-label">Lüftergeschwindigkeit</div>
                                <div class="climate-setting-options">
                                    ${availableFanModes.map(mode => `
                                        <div class="climate-setting-option ${currentFanMode === mode ? 'active' : ''}" 
                                             data-climate-setting="fan_mode" data-value="${mode}">
                                            ${this.getMELCloudModeLabel(mode, 'fan')}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
    }

    // MELCloud Mode Label Helper - Nach getClimateReplaceControls einfügen
    getMELCloudModeLabel(mode, type) {
        switch (type) {
            case 'horizontal':
                switch (mode) {
                    case 'auto': return 'Auto';
                    case '1': return '← Links';
                    case '2': return '←';
                    case '3': return 'Mitte';
                    case '4': return '→';
                    case '5': return 'Rechts →';
                    case 'split': return 'Split';
                    case 'swing': return 'Swing';
                    default: return mode;
                }
                
            case 'vertical':
                switch (mode) {
                    case 'auto': return 'Auto';
                    case '1': return '↑ Oben';
                    case '2': return '↗';
                    case '3': return '→';
                    case '4': return '↘';
                    case '5': return '↓ Unten';
                    case 'swing': return 'Swing';
                    default: return mode;
                }
                
            case 'fan':
                switch (mode) {
                    case 'auto': return 'Auto';
                    case 'quiet': return 'Leise';
                    case '1': return 'Stufe 1';
                    case '2': return 'Stufe 2';
                    case '3': return 'Stufe 3';
                    case '4': return 'Stufe 4';
                    case '5': return 'Stufe 5';
                    default: return mode;
                }
                
            default:
                return mode;
        }
    }
    
    getCoverReplaceControls(item) {
        const position = item.position || 0;
        
        return `
            <div class="control-group-large">
                <div class="new-light-design" id="new-cover-${item.id}">
                    
                    <!-- Header -->
                    <div class="new-light-header">
                        <div class="new-light-name">${item.name}</div>
                        <div class="new-light-state" id="new-cover-state-${item.id}">
                            ${position >= 1 ? `Geöffnet • ${position}% Position` : 'Geschlossen'}
                        </div>
                    </div>
                    
                    <!-- Zentraler Positions-Slider (immer sichtbar) -->
                    <div class="new-light-slider-container visible" id="new-cover-slider-container-${item.id}">
                        <div class="new-light-slider-label">
                            <span>Position</span>
                            <span id="new-cover-position-value-${item.id}">${position}%</span>
                        </div>
                        <div class="new-light-slider-track-container">
                            <div class="new-light-slider-track" style="width: ${position}%" id="new-cover-track-${item.id}"></div>
                            <input type="range" class="new-light-slider-input" data-control="position" 
                                   min="0" max="100" value="${position}" id="new-cover-position-slider-${item.id}">
                        </div>
                    </div>
                    
                    <!-- Control Buttons Row (immer sichtbar) -->
                    <div class="new-light-controls-row visible" id="new-cover-controls-row-${item.id}">
                        <!-- Öffnen Button -->
                        <button class="new-light-control-btn secondary visible" data-action="open">
                            ⬆️
                        </button>
                        
                        <!-- Stopp Button -->
                        <button class="new-light-control-btn secondary visible" data-action="stop">
                            ⏹️
                        </button>
                        
                        <!-- Schließen Button -->
                        <button class="new-light-control-btn secondary visible" data-action="close">
                            ⬇️
                        </button>
                        
                        <!-- Szenen Toggle Button -->
                        <button class="new-light-control-btn secondary new-light-color-toggle visible" 
                                id="new-cover-scenes-toggle-${item.id}" data-action="toggle-scenes">
                            🎭
                        </button>
                    </div>
                    
                    <!-- Szenen-Auswahl (versteckt by default) -->
                    <div class="new-light-colors" id="new-cover-scenes-${item.id}" data-is-open="false">
                        <div class="new-light-colors-grid">
                            <div class="new-light-color-preset" style="background: linear-gradient(45deg, #FF6B35, #F7931E);" data-position="20">20%</div>
                            <div class="new-light-color-preset" style="background: linear-gradient(45deg, #F7931E, #FFD23F);" data-position="40">40%</div>
                            <div class="new-light-color-preset" style="background: linear-gradient(45deg, #FFD23F, #06D6A0);" data-position="60">60%</div>
                            <div class="new-light-color-preset active" style="background: linear-gradient(45deg, #06D6A0, #118AB2);" data-position="80">80%</div>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
    }


     setupHACoverControls(item) {
        if (item.type !== 'cover') return;
        
        console.log('=== SETUP COVER CONTROLS ===');
        
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (!replaceContainer) return;
        
        // DOM Elemente
        const positionSlider = replaceContainer.querySelector(`[id="new-cover-position-slider-${item.id}"]`);
        const positionValue = replaceContainer.querySelector(`[id="new-cover-position-value-${item.id}"]`);
        const entityState = replaceContainer.querySelector(`[id="new-cover-state-${item.id}"]`);
        
        const scenesToggleButton = replaceContainer.querySelector(`[id="new-cover-scenes-toggle-${item.id}"]`);
        const scenesContainer = replaceContainer.querySelector(`[id="new-cover-scenes-${item.id}"]`);
        
        // Position Slider Event Listener
        if (positionSlider) {
            positionSlider.addEventListener('input', (e) => {
                const position = parseInt(e.target.value);
                
                const container = positionSlider.parentElement;
                const track = container.querySelector('.new-light-slider-track');
                
                if (track) {
                    track.style.width = position + '%';
                }
                
                if (positionValue) {
                    positionValue.textContent = position + '%';
                }
                if (entityState) {
                    entityState.textContent = position >= 1 ? `Geöffnet • ${position}% Position` : 'Geschlossen';
                }
                
                this.handleSliderChange(item, 'position', position);
            });
        }
        
        // Szenen Toggle Button
        if (scenesToggleButton) {
            scenesToggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🎭 SCENES TOGGLE CLICKED!');
                
                if (scenesContainer) {
                    const isOpen = scenesContainer.getAttribute('data-is-open') === 'true';
                    
                    if (isOpen) {
                        scenesContainer.classList.remove('visible');
                        scenesContainer.setAttribute('data-is-open', 'false');
                    } else {
                        scenesContainer.classList.add('visible');
                        scenesContainer.setAttribute('data-is-open', 'true');
                    }
                    
                    scenesToggleButton.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        scenesToggleButton.style.transform = '';
                    }, 150);
                }
            }, true);
        }
        
        // Szenen Presets (25%, 50%, 75%)
        const scenePresets = replaceContainer.querySelectorAll(`[id="new-cover-scenes-${item.id}"] .new-light-color-preset`);
        
        scenePresets.forEach(preset => {
            preset.addEventListener('click', () => {
                console.log('🎭 SCENE PRESET CLICKED!');
                scenePresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                
                const targetPosition = parseInt(preset.getAttribute('data-position'));
                
                if (this._hass) {
                    this._hass.callService('cover', 'set_cover_position', {
                        entity_id: item.id,
                        position: targetPosition
                    }).then(() => {
                        setTimeout(() => {
                            const currentState = this._hass.states[item.id];
                            if (currentState) {
                                Object.assign(item, {
                                    state: currentState.state,
                                    attributes: currentState.attributes,
                                    position: currentState.attributes.current_position || targetPosition
                                });
                                this.updateCoverControlUI(item);
                            }
                        }, 500);
                    }).catch(error => {
                        console.error('Cover position service call failed:', error);
                    });
                }
            });
        });
    }       


    setupHAClimateControls(item) {
        if (item.type !== 'climate') return;
        
        console.log('=== SETUP CLIMATE CONTROLS ===');
        
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (!replaceContainer) return;
        
        // DOM Elemente
        const tempSlider = replaceContainer.querySelector(`[id="new-climate-temp-slider-${item.id}"]`);
        const tempValue = replaceContainer.querySelector(`[id="new-climate-temp-value-${item.id}"]`);
        const entityState = replaceContainer.querySelector(`[id="new-climate-state-${item.id}"]`);
        
        // Power Buttons
        const powerButtonCenter = replaceContainer.querySelector(`[id="new-climate-toggle-center-${item.id}"]`);
        const powerButtonRow = replaceContainer.querySelector(`[id="new-climate-toggle-${item.id}"]`);
        
        const settingsToggleButton = replaceContainer.querySelector(`[id="new-climate-settings-toggle-${item.id}"]`);
        const settingsContainer = replaceContainer.querySelector(`[id="new-climate-settings-${item.id}"]`);
        
        // Temperatur Slider Event Listener
        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => {
                const temp = parseFloat(e.target.value);
                
                const container = tempSlider.parentElement;
                const track = container.querySelector('.new-light-slider-track');
                
                if (track) {
                    const percentage = ((temp - 10) / 20) * 100;
                    track.style.width = percentage + '%';
                }
                
                if (tempValue) {
                    tempValue.textContent = temp + '°C';
                }
                if (entityState) {
                    const isOn = ['heat', 'cool', 'auto', 'dry', 'fan_only'].includes(item.state);
                    entityState.textContent = isOn ? `Ein • ${temp}°C Zieltemperatur` : 'Aus';
                }
                
                this.handleSliderChange(item, 'temperature', temp);
            });
        }
        
        // Power Button Event Handler
        const handleClimateAction = (action, button) => {
            console.log('🌡️ CLIMATE ACTION:', action);
            
            this.executeReplaceAction(item, action, button).then(() => {
                setTimeout(() => {
                    this.animateClimateControls(item.id, action);
                }, 300);
            });
        };
        
        // Center Power Button
        if (powerButtonCenter) {
            powerButtonCenter.addEventListener('click', () => {
                handleClimateAction('heat', powerButtonCenter);
            });
        }
        
        // Row Power Button
        if (powerButtonRow) {
            powerButtonRow.addEventListener('click', () => {
                handleClimateAction('off', powerButtonRow);
            });
        }
        
        // Einstellungen Toggle Button
        if (settingsToggleButton) {
            settingsToggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('⚙️ SETTINGS TOGGLE CLICKED!');
                
                if (settingsContainer) {
                    const isOpen = settingsContainer.getAttribute('data-is-open') === 'true';
                    
                    if (isOpen) {
                        settingsContainer.classList.remove('visible');
                        settingsContainer.setAttribute('data-is-open', 'false');
                    } else {
                        settingsContainer.classList.add('visible');
                        settingsContainer.setAttribute('data-is-open', 'true');
                    }
                    
                    settingsToggleButton.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        settingsToggleButton.style.transform = '';
                    }, 150);
                }
            }, true);
        }
        
        // Erweiterte Einstellungs-Optionen - Ersetze den bestehenden settingOptions Code
        const settingOptions = replaceContainer.querySelectorAll(`[id="new-climate-settings-${item.id}"] .climate-setting-option`);
        
        settingOptions.forEach(option => {
            option.addEventListener('click', () => {
                console.log('⚙️ CLIMATE SETTING OPTION CLICKED!');
                
                const settingType = option.getAttribute('data-climate-setting');
                const settingValue = option.getAttribute('data-value');
                
                // Aktive Klasse in derselben Zeile togglen
                const row = option.closest('.climate-setting-row');
                const rowOptions = row.querySelectorAll('.climate-setting-option');
                rowOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Service Call für erweiterte Einstellungen
                if (this._hass) {
                    let serviceCall;
                    
                    console.log(`🌡️ Setting ${settingType} to ${settingValue}`);
                    
                    // Ersetze den switch-Block in setupHAClimateControls mit:
                    switch (settingType) {
                        case 'vane_horizontal':
                            // MELCloud spezifischer Service Call
                            serviceCall = this._hass.callService('melcloud', 'set_vane_horizontal', {
                                entity_id: item.id,
                                position: settingValue
                            });
                            break;
                            
                        case 'vane_vertical':
                            // MELCloud spezifischer Service Call
                            serviceCall = this._hass.callService('melcloud', 'set_vane_vertical', {
                                entity_id: item.id,
                                position: settingValue
                            });
                            break;
                            
                        case 'fan_mode':
                            // Standard Climate Service Call für Fan
                            serviceCall = this._hass.callService('climate', 'set_fan_mode', {
                                entity_id: item.id,
                                fan_mode: settingValue
                            });
                            break;
                    }
                    
                    if (serviceCall) {
                        serviceCall.then(() => {
                            console.log(`✅ ${settingType} successfully set to ${settingValue}`);
                            
                            // UI nach 500ms aktualisieren
                            setTimeout(() => {
                                const currentState = this._hass.states[item.id];
                                if (currentState) {
                                    Object.assign(item, {
                                        state: currentState.state,
                                        attributes: currentState.attributes
                                    });
                                    this.updateClimateControlUI(item);
                                }
                            }, 500);
                        }).catch(error => {
                            console.error(`❌ ${settingType} setting failed:`, error);
                            
                            // Bei Fehler: Option wieder zurücksetzen
                            rowOptions.forEach(opt => opt.classList.remove('active'));
                            // Ursprüngliche aktive Option wieder finden und aktivieren
                            const originalValue = this.getOriginalClimateSettingValue(item, settingType);
                            const originalOption = row.querySelector(`[data-value="${originalValue}"]`);
                            if (originalOption) {
                                originalOption.classList.add('active');
                            }
                        });
                    }
                }
            });
        });
    }

    // Neue Hilfsmethode hinzufügen (nach setupHAClimateControls):
    getOriginalClimateSettingValue(item, settingType) {
        switch (settingType) {
            case 'vane_horizontal':
                return item.attributes.vane_horizontal || 'auto';
            case 'vane_vertical':
                return item.attributes.vane_vertical || 'auto';
            case 'fan_mode':
                return item.attributes.fan_mode || 'auto';
            default:
                return 'auto';
        }
    }

    // Music Assistant Verfügbarkeit prüfen
    checkMusicAssistantAvailability() {
        if (!this._hass) return false;
        
        // Prüfe ob Music Assistant als Integration verfügbar ist
        const maEntities = Object.keys(this._hass.states).filter(entityId => 
            entityId.startsWith('media_player.') && 
            this._hass.states[entityId].attributes.supported_features &&
            // Prüfe auf Music Assistant spezifische Features
            this._hass.states[entityId].attributes.device_class === 'speaker'
        );
        
        return maEntities.length > 0;
    }



    /**
     * Prüft ob Text-to-Speech Services verfügbar sind - POLLY OPTIMIERT
     */
    checkTTSAvailability() {
        if (!this._hass || !this._hass.services) return false;
        
        console.log('=== TTS Availability Check (POLLY) ===');
        console.log('Alle Services:', Object.keys(this._hass.services));
        
        // Prüfe speziell auf Amazon Polly
        if (this._hass.services.tts && this._hass.services.tts.amazon_polly_say) {
            console.log('✅ Amazon Polly gefunden:', this._hass.services.tts.amazon_polly_say);
            return true;
        }
        
        // Fallback: Andere TTS Services
        const ttsServices = [];
        
        if (this._hass.services.tts) {
            const ttsMethods = Object.keys(this._hass.services.tts);
            console.log('TTS Methoden verfügbar:', ttsMethods);
            
            if (ttsMethods.length > 0) {
                ttsServices.push('tts');
            }
        }
        
        if (this._hass.services.chime_tts) {
            ttsServices.push('chime_tts');
        }
        
        console.log('🔍 Verfügbare TTS Services:', ttsServices);
        return ttsServices.length > 0;
    }
    
    /**
     * Ermittelt den besten verfügbaren TTS Service - NUR POLLY
     */
    getBestTTSService() {
        if (!this._hass || !this._hass.services) return null;
        
        console.log('=== TTS Service Detection (NUR POLLY) ===');
        
        // NUR Amazon Polly Services prüfen
        if (this._hass.services.tts) {
            const ttsMethods = Object.keys(this._hass.services.tts);
            console.log('🔍 Verfügbare TTS Methoden:', ttsMethods);
            
            // Amazon Polly bevorzugen
            if (this._hass.services.tts.amazon_polly_say) {
                console.log('✅ Amazon Polly gefunden: tts.amazon_polly_say');
                return { domain: 'tts', service: 'amazon_polly_say' };
            }
            
            // Fallback: Cloud TTS
            if (this._hass.services.tts.cloud_say) {
                console.log('✅ Cloud TTS gefunden: tts.cloud_say');
                return { domain: 'tts', service: 'cloud_say' };
            }
            
            // Fallback: Erster TTS Service
            if (ttsMethods.length > 0) {
                const firstMethod = ttsMethods[0];
                console.log(`✅ Fallback TTS: tts.${firstMethod}`);
                return { domain: 'tts', service: firstMethod };
            }
        }
        
        console.log('❌ Kein TTS Service gefunden');
        return null;
    }
    
    
    
    // Music Assistant Suche implementieren
    async searchMusicAssistant(query, entityId) {
        if (!this._hass || !query) return [];
        
        try {
            // Hole Music Assistant Config Entry
            const configEntries = await this._hass.callApi("GET", "config/config_entries/entry");
            const maEntry = configEntries.filter(entry => 
                entry.domain === "music_assistant" && entry.state === "loaded"
            ).find(entry => entry.state === "loaded");
            
            if (!maEntry) {
                console.warn('Music Assistant nicht gefunden');
                return [];
            }
            
            // Führe Suche aus
            const searchParams = {
                type: "call_service",
                domain: "music_assistant",
                service: "search",
                service_data: {
                    name: query,
                    config_entry_id: maEntry.entry_id,
                    limit: 50
                },
                return_response: true
            };
            
            const response = await this._hass.connection.sendMessagePromise(searchParams);
            return this.processMusicAssistantResults(response.response);
            
        } catch (error) {
            console.error('Music Assistant Suche fehlgeschlagen:', error);
            return [];
        }
    }
    
    // Music Assistant Ergebnisse verarbeiten
    processMusicAssistantResults(results) {
        if (!results) return [];
        
        const processedResults = {};
        
        // Gruppiere Ergebnisse nach Typ
        Object.entries(results).forEach(([type, items]) => {
            if (Array.isArray(items) && items.length > 0) {
                processedResults[type] = items.map(item => ({
                    uri: item.uri,
                    name: item.name,
                    artists: item.artists || [],
                    image: item.image,
                    media_type: item.media_type || type.slice(0, -1), // "tracks" -> "track"
                    album: item.album
                }));
            }
        });
        
        return processedResults;
    }
    
    // Musik über Music Assistant abspielen
    async playMusicAssistantItem(item, entityId, enqueueMode = 'play') {
        if (!this._hass) return;
        
        try {
            await this._hass.callService("music_assistant", "play_media", {
                entity_id: entityId,
                media_type: item.media_type,
                media_id: item.uri,
                enqueue: enqueueMode
            });
            
            console.log(`Spiele ab: ${item.name} auf ${entityId}`);
        } catch (error) {
            console.error('Fehler beim Abspielen:', error);
        }
    }
        
    
    // Kategorie-Namen für Music Assistant
    getMusicAssistantCategoryName(type) {
        const names = {
            'artists': 'Künstler',
            'albums': 'Alben', 
            'tracks': 'Titel',
            'playlists': 'Playlists',
            'radio': 'Radio'
        };
        return names[type] || type;
    }
    
    // ↓ HIER die getTTSHTML() Methode aus Schritt 3 einfügen ↓
    
    /**
     * Generiert TTS HTML für Media Player
     */
    getTTSHTML(item) {
        if (!this.checkTTSAvailability()) {
            return '';
        }
        
        const ttsService = this.getBestTTSService();
        if (!ttsService) {
            return '';
        }
        
        return `
            <div class="tts-section" id="tts-section-${item.id}">
 
                
                <div class="tts-input-container">
                    <textarea 
                        class="tts-textarea" 
                        placeholder="Text eingeben der vorgelesen werden soll..." 
                        maxlength="300"
                        data-tts-input="${item.id}"></textarea>
                    <div class="tts-counter" data-tts-counter="${item.id}">0 / 300 Zeichen</div>
                </div>
                
                <div class="tts-controls">
                    <select class="tts-language-select" data-tts-language="${item.id}">
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="it">🇮🇹 Italiano</option>
                    </select>
                    <button 
                        class="tts-speak-button" 
                        data-tts-speak="${item.id}"
                        disabled>
                        🗣️ Vorlesen
                    </button>
                </div>
                
                <div class="tts-presets">
                    <button class="tts-preset-button" data-tts-preset="🏠 Willkommen zu Hause!">
                        🏠 Willkommen
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🍽️ Das Essen ist fertig!">
                        🍽️ Essen fertig
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🚪 Bitte zur Haustür kommen.">
                        🚪 Zur Haustür
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🌙 Gute Nacht und schöne Träume!">
                        🌙 Gute Nacht
                    </button>
                    <button class="tts-preset-button" data-tts-preset="⚠️ Achtung! Wichtige Durchsage.">
                        ⚠️ Durchsage
                    </button>
                    <button class="tts-preset-button" data-tts-preset="🎵 Die Musik ist zu laut!">
                        🎵 Musik leiser
                    </button>
                </div>
            </div>
        `;
    }    
        
    
    getMediaReplaceControls(item) {
        const volume = item.volume || 0;
        const isPlaying = item.state === 'playing';
        
        // TTS HTML für Pulldown
        const ttsHTML = this.getTTSHTML(item);
        
        // Music Assistant HTML für Pulldown
        const musicAssistantHTML = this.checkMusicAssistantAvailability() ? `
            <div class="ma-search-container">
                <div class="ma-search-bar-container">
                    <input type="text" 
                           class="ma-search-input" 
                           placeholder="Künstler, Album oder Song suchen..." 
                           data-ma-search="${item.id}">
                    <div class="ma-enqueue-mode" data-ma-enqueue="${item.id}">
                        <span class="ma-enqueue-icon">▶️</span>
                        <span class="ma-enqueue-text">Play now</span>
                    </div>
                </div>
                <div class="ma-filter-container" id="ma-filters-${item.id}">
                    <div class="ma-filter-chip ma-filter-active" data-filter="all">
                        <span class="ma-filter-icon">🔗</span>
                        <span>Alle</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="artists">
                        <span class="ma-filter-icon">👤</span>
                        <span>Künstler</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="albums">
                        <span class="ma-filter-icon">💿</span>
                        <span>Alben</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="tracks">
                        <span class="ma-filter-icon">🎵</span>
                        <span>Songs</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="playlists">
                        <span class="ma-filter-icon">📋</span>
                        <span>Playlists</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="radio">
                        <span class="ma-filter-icon">📻</span>
                        <span>Radio</span>
                    </div>
                </div>
                <div class="ma-search-results" id="ma-results-${item.id}">
                    <div class="ma-empty-state">Gebe einen Suchbegriff ein um Musik zu finden...</div>
                </div>
            </div>
        ` : '<div class="ma-empty-state">Music Assistant Integration nicht verfügbar</div>';
        
        return `
            <div class="control-group-large">
                <div class="new-light-design" id="new-media-${item.id}">
                    
                    <!-- Header -->
                    <div class="new-light-header">
                        <div class="new-light-name">${item.name}</div>
                        <div class="new-light-state" id="new-media-state-${item.id}">
                            ${isPlaying ? 'Spielt' : 'Gestoppt'} • ${volume}% Lautstärke
                        </div>
                    </div>
                    
                    <!-- Basis Media Controls -->
                    <div class="main-control-large">
                        <button class="toggle-button-large" data-action="play_pause">
                            ${isPlaying ? '⏸️ Pause' : '▶️ Play'}
                        </button>
                        <button class="toggle-button-large off" data-action="previous">⏮️ Zurück</button>
                        <button class="toggle-button-large off" data-action="next">⏭️ Weiter</button>
                    </div>
                    
                    <!-- Lautstärke Slider -->
                    <div class="new-light-slider-container visible">
                        <div class="new-light-slider-label">
                            <span>Lautstärke</span>
                            <span id="new-media-volume-value-${item.id}">${volume}%</span>
                        </div>
                        <div class="new-light-slider-track-container">
                            <div class="new-light-slider-track" style="width: ${volume}%" id="new-media-track-${item.id}"></div>
                            <input type="range" class="new-light-slider-input" data-control="volume" 
                                   min="0" max="100" value="${volume}" id="new-media-volume-slider-${item.id}">
                        </div>
                    </div>
                    
                    <!-- Control Buttons Row mit TTS und Music -->
                    <div class="new-light-controls-row visible" id="new-media-controls-row-${item.id}">
                        <!-- Power Button (falls benötigt) -->
                        <button class="new-light-control-btn secondary visible" data-action="toggle">
                            🔌
                        </button>
                        
                        <!-- TTS Toggle Button -->
                        <button class="new-light-control-btn secondary new-light-color-toggle visible" 
                                id="new-media-tts-toggle-${item.id}" data-action="toggle-tts">
                            🗣️
                        </button>
                        
                        <!-- Music Toggle Button -->
                        <button class="new-light-control-btn secondary new-light-color-toggle visible" 
                                id="new-media-music-toggle-${item.id}" data-action="toggle-music">
                            🎵
                        </button>
                    </div>
                    
                    <!-- TTS Pulldown (versteckt by default) -->
                    <div class="new-light-colors" id="new-media-tts-${item.id}" data-is-open="false">
                        <div class="section-title" style="margin-bottom: 16px; color: rgba(255,255,255,0.9);">🗣️ Text-to-Speech</div>
                        ${ttsHTML || '<div class="ma-empty-state">TTS nicht verfügbar</div>'}
                    </div>
                    
                    <!-- Music Pulldown (versteckt by default) -->
                    <div class="new-light-colors" id="new-media-music-${item.id}" data-is-open="false">
                        <div class="section-title" style="margin-bottom: 16px; color: rgba(255,255,255,0.9);">🎵 Musik Suche</div>
                        ${musicAssistantHTML}
                    </div>
                    
                    <!-- Now Playing Info -->
                    ${item.media_title ? `
                        <div style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                            <div style="font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 4px;">
                                🎵 ${item.media_title}
                            </div>
                            ${item.attributes.media_artist ? `
                                <div style="font-size: 14px; color: rgba(255,255,255,0.7);">
                                    👤 ${item.attributes.media_artist}
                                </div>
                            ` : ''}
                            ${item.attributes.media_album ? `
                                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                    💿 ${item.attributes.media_album}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                </div>
            </div>
        `;
    }    

    getNonEntityReplaceControls(item) {
        switch (item.itemType) {
            case 'automation':
                return `
                    <div class="control-group-large">
                       
                        <div class="main-control-large">
                            <button class="toggle-button-large" data-action="trigger">🚀 Jetzt ausführen</button>
                        </div>
                        <div class="main-control-large">
                            <button class="toggle-button-large ${item.state === 'on' ? 'off' : ''}" data-action="toggle">
                                ${item.state === 'on' ? '⏸️ Deaktivieren' : '▶️ Aktivieren'}
                            </button>
                        </div>
                    </div>
                `;
            case 'script':
                return `
                    <div class="control-group-large">
                        
                        <div class="main-control-large">
                            <button class="toggle-button-large" data-action="run">▶️ Skript ausführen</button>
                        </div>
                    </div>
                `;
            case 'scene':
                return `
                    <div class="control-group-large">
                        
                        <div class="main-control-large">
                            <button class="toggle-button-large" data-action="activate">🎬 Szene aktivieren</button>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    getReplaceAttributesHTML(item) {
        const importantAttributes = this.getImportantAttributes(item);
        
        if (importantAttributes.length === 0) return '';
        
        const attributeItems = importantAttributes.map(attr => `
            <div class="attribute-item-large">
                <div class="attribute-label-large">${attr.label}</div>
                <div class="attribute-value-large">${attr.value}</div>
            </div>
        `).join('');
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">📊 Details</h3>
                <div class="attribute-grid-large">
                    ${attributeItems}
                </div>
            </div>
        `;
    }

    executeReplaceAction(item, action, button) {
        // Visual Feedback
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Wird ausgeführt...';
        button.disabled = true;
        
        // Action ausführen (nutzt bestehende executeAction Methode)
        this.executeAction(item, action).then(() => {
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                
                // Replace-Content aktualisieren
                this.updateReplaceContent(item);
            }, 1000);
        });
    }

    handleReplaceSliderChange(item, control, value) {
        this.handleSliderChange(item, control, value);
        
        // Label aktualisieren
        const slider = this.shadowRoot.querySelector(`.more-info-replace [data-control="${control}"]`);
        const label = slider.parentNode.querySelector('.slider-label-large .value');
        if (label) {
            const unit = control === 'temperature' ? '°C' : '%';
            label.textContent = value + unit;
        }
    }



    updateReplaceContent(item) {
        // Item-Daten aktualisieren
        const currentState = this._hass.states[item.id];
        if (currentState) {
            Object.assign(item, {
                state: currentState.state,
                attributes: currentState.attributes
            });
            
            const domain = item.id.split('.')[0];
            this.addDomainSpecificAttributes(item, domain, currentState);
        }
        // Replace-Content neu generieren
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        replaceContainer.innerHTML = this.getReplaceContentHTML(item);
        this.setupReplaceEventListeners(item);
        
        // Background Image für Lichter, Rollläden und Klima aktualisieren
        if (item.type === 'light' || item.type === 'cover' || item.type === 'climate') {
            this.updateIconSectionBackground(item);
        }        
        
        // Update HA Light Control UI
        if (item.type === 'light') {
            this.updateHALightControlUI(item);
        }        
        
        // Update Cover Control UI
        if (item.type === 'cover') {
            this.updateCoverControlUI(item);
        }        
        
        // Update Climate Control UI
        if (item.type === 'climate') {
            this.updateClimateControlUI(item);
        }        
        
        // Spezielle Behandlung für Media Player Album Art Update
        if (item.type === 'media_player') {
            this.updateMediaPlayerAlbumArt(item);
        }
        
        // Logbook aktualisieren
        this.updateLogEntries(item);
    }


    updateIconSectionBackground(item) {
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (!replaceContainer) return;
        
        const backgroundElement = replaceContainer.querySelector('.icon-background');
        if (!backgroundElement) return;
        
        const newBackgroundImage = this.getBackgroundImageForItem(item);
        backgroundElement.style.backgroundImage = `url('${newBackgroundImage}')`;
        
        console.log('✅ Background Image aktualisiert für:', item.id, 'Neue URL:', newBackgroundImage);
    }    


    updateHALightControlUI(item) {
        const isOn = item.state === 'on';
        const brightness = item.brightness || 0;
        
        console.log('🔄 Updating dual power light UI:', { isOn, brightness });
        
        // Update beide power buttons
        const powerButtonCenter = this.shadowRoot.getElementById(`new-light-toggle-center-${item.id}`);
        const powerButtonRow = this.shadowRoot.getElementById(`new-light-toggle-${item.id}`);
        
        if (powerButtonCenter) {
            powerButtonCenter.classList.toggle('power-on', isOn);
            powerButtonCenter.classList.toggle('power-off', !isOn);
            powerButtonCenter.innerHTML = isOn ? '💡' : '🔌';
        }
        
        if (powerButtonRow) {
            powerButtonRow.classList.toggle('power-on', isOn);
            powerButtonRow.classList.toggle('power-off', !isOn);
            powerButtonRow.innerHTML = isOn ? '💡' : '🔌';
        }
        
        // Update state text
        const stateText = this.shadowRoot.getElementById(`new-light-state-${item.id}`);
        if (stateText) {
            stateText.textContent = isOn ? `Ein • ${brightness}% Helligkeit` : 'Aus';
        }
        
        // Update brightness slider and track
        const slider = this.shadowRoot.getElementById(`new-light-brightness-slider-${item.id}`);
        const value = this.shadowRoot.getElementById(`new-light-brightness-value-${item.id}`);
        const track = this.shadowRoot.getElementById(`new-light-track-${item.id}`);
        
        if (slider && value && track) {
            slider.value = brightness;
            value.textContent = brightness + '%';
            track.style.width = brightness + '%';
        }
        
        // Animate controls based on state
        this.animateLightControls(item.id, isOn);
        
        // Update slider color
        this.updateNewLightSliderColor(item);
    }




    updateCoverControlUI(item) {
        const position = item.position || 0;
        
        console.log('🔄 Updating cover UI:', { position });
        
        // Update state text
        const stateText = this.shadowRoot.getElementById(`new-cover-state-${item.id}`);
        if (stateText) {
            stateText.textContent = position >= 1 ? `Geöffnet • ${position}% Position` : 'Geschlossen';
        }
        
        // Update position slider and track
        const slider = this.shadowRoot.getElementById(`new-cover-position-slider-${item.id}`);
        const value = this.shadowRoot.getElementById(`new-cover-position-value-${item.id}`);
        const track = this.shadowRoot.getElementById(`new-cover-track-${item.id}`);
        
        if (slider && value && track) {
            slider.value = position;
            value.textContent = position + '%';
            track.style.width = position + '%';
        }
    }    


    animateClimateControls(itemId, action) {
        console.log('🎬 Animating climate controls:', { itemId, action });
        
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (!replaceContainer) return;
        
        const sliderContainer = replaceContainer.querySelector(`[id="new-climate-slider-container-${itemId}"]`);
        const controlsRow = replaceContainer.querySelector(`[id="new-climate-controls-row-${itemId}"]`);
        const powerCenter = replaceContainer.querySelector(`[id="new-climate-power-center-${itemId}"]`);
        const settingsContainer = replaceContainer.querySelector(`[id="new-climate-settings-${itemId}"]`);
        
        const isTurningOn = ['heat', 'cool', 'auto', 'dry', 'fan_only'].includes(action);
        
        if (isTurningOn) {
            // Einschalten: Zeige Row-Controls, verstecke Center Power
            if (powerCenter) {
                powerCenter.classList.remove('visible');
            }
            
            setTimeout(() => {
                if (sliderContainer) {
                    sliderContainer.classList.add('visible');
                }
                if (controlsRow) {
                    controlsRow.classList.add('visible');
                }
            }, 200);
            
        } else {
            // Ausschalten: Zeige Center Power, verstecke Row-Controls
            if (settingsContainer) {
                settingsContainer.classList.remove('visible');
                settingsContainer.setAttribute('data-is-open', 'false');
            }
            
            if (controlsRow) {
                controlsRow.classList.remove('visible');
            }
            if (sliderContainer) {
                sliderContainer.classList.remove('visible');
            }
            
            setTimeout(() => {
                if (powerCenter) {
                    powerCenter.classList.add('visible');
                }
            }, 200);
        }
    }


    updateClimateControlUI(item) {
        const targetTemp = item.target_temperature || 20;
        const isOn = ['heat', 'cool', 'auto', 'dry', 'fan_only'].includes(item.state);
        
        console.log('🔄 Updating climate UI:', { isOn, targetTemp, state: item.state });
        
        // Update both power buttons
        const powerButtonCenter = this.shadowRoot.getElementById(`new-climate-toggle-center-${item.id}`);
        const powerButtonRow = this.shadowRoot.getElementById(`new-climate-toggle-${item.id}`);
        
        if (powerButtonCenter) {
            powerButtonCenter.classList.toggle('power-on', isOn);
            powerButtonCenter.classList.toggle('power-off', !isOn);
        }
        
        if (powerButtonRow) {
            powerButtonRow.classList.toggle('power-on', isOn);
            powerButtonRow.classList.toggle('power-off', !isOn);
        }
        
        // Update state text
        const stateText = this.shadowRoot.getElementById(`new-climate-state-${item.id}`);
        if (stateText) {
            stateText.textContent = isOn ? `Ein • ${targetTemp}°C Zieltemperatur` : 'Aus';
        }
        
        // Update temperature slider and track
        const slider = this.shadowRoot.getElementById(`new-climate-temp-slider-${item.id}`);
        const value = this.shadowRoot.getElementById(`new-climate-temp-value-${item.id}`);
        const track = this.shadowRoot.getElementById(`new-climate-track-${item.id}`);
        
        if (slider && value && track) {
            slider.value = targetTemp;
            value.textContent = targetTemp + '°C';
            const percentage = ((targetTemp - 10) / 20) * 100;
            track.style.width = percentage + '%';
        }
        
        // Update mode buttons active state
        const replaceContainer = this.shadowRoot.getElementById('moreInfoReplace');
        if (replaceContainer) {

            const modeButtons = replaceContainer.querySelectorAll(`[id="new-climate-controls-row-${item.id}"] .new-light-control-btn.secondary`);
            modeButtons.forEach(button => {
                const action = button.getAttribute('data-action');
                const currentMode = item.hvac_mode || item.state;
                button.classList.toggle('active', action === currentMode);
            });            
            
        }
        
        // Animate controls based on state
        this.animateClimateControls(item.id, item.state);
    }    
    
    
    updateMediaPlayerAlbumArt(item) {
        const albumBackground = this.shadowRoot.querySelector('.album-background-blur');
        const albumCover = this.shadowRoot.querySelector('.album-cover-large');
        const songTitle = this.shadowRoot.querySelector('.song-title-large');
        const artistName = this.shadowRoot.querySelector('.artist-name-large');
        const albumName = this.shadowRoot.querySelector('.album-name-large');
        
        if (!albumBackground || !albumCover) return;
        
        const albumArt = this.getAlbumArtUrl(item);
        const isPlaying = item.state === 'playing';
        
        console.log('🎨 Updating Album Art:', {
            albumArt,
            isPlaying,
            mediaTitle: item.attributes.media_title
        });
        
        // Background und Cover aktualisieren
        if (albumArt) {
            albumBackground.style.backgroundImage = `url('${albumArt}')`;
            albumCover.style.backgroundImage = `url('${albumArt}')`;
            albumBackground.style.background = 'none';
            albumCover.style.background = 'none';
        } else {
            const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            albumBackground.style.background = gradient;
            albumCover.style.background = gradient;
            albumBackground.style.backgroundImage = 'none';
            albumCover.style.backgroundImage = 'none';
        }
        
        // Animation State aktualisieren
        albumCover.classList.toggle('playing', isPlaying);
        
        // Text Updates
        if (songTitle) {
            songTitle.textContent = item.attributes.media_title || 'Kein Titel';
        }
        if (artistName) {
            artistName.textContent = item.attributes.media_artist || 'Unbekannter Künstler';
        }
        if (albumName) {
            const albumText = item.attributes.media_album || '';
            albumName.textContent = albumText;
            albumName.style.display = albumText ? 'block' : 'none';
        }
    }

    
    updateLogEntries(item) {
        const logContainer = this.shadowRoot.getElementById('logEntries');
        if (logContainer) {
            logContainer.innerHTML = this.getLogEntriesHTML(item);
        }
    }

    
    
    initializeCard() {
        this.allItems = [];
        this.currentSearchType = 'entities';
        this.selectedRooms = new Set();
        this.selectedType = '';
        this.isInitialized = false; // Flag für Initialisierung
        this.currentView = 'list'; // Neue Property für View-Mode
        
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

        this.filterButton = this.shadowRoot.getElementById('filterButton');
        this.filterOverlay = this.shadowRoot.getElementById('filterOverlay');
        
        this.resultsContainer = this.shadowRoot.getElementById('resultsContainer');
        this.noResults = this.shadowRoot.getElementById('noResults');

        this.typingIndicator = this.shadowRoot.getElementById('typingIndicator');

        this.searchInput.addEventListener('input', () => this.handleSearchInput());

        // Filter Button Event Listener
        this.shadowRoot.getElementById('filterButton').addEventListener('click', () => this.toggleFilterMenu());
        
        // Close Filter Button Event Listener  
        this.shadowRoot.getElementById('closeFilterButton').addEventListener('click', () => this.closeFilterMenu());
        
        // Filter Overlay Click (zum Schließen)
        this.shadowRoot.getElementById('filterOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'filterOverlay') {
                this.closeFilterMenu();
            }
        });
        
        // Filter Action Buttons
        this.shadowRoot.getElementById('resetFiltersButton').addEventListener('click', () => this.resetFilters());
        this.shadowRoot.getElementById('applyFiltersButton').addEventListener('click', () => this.applyFilterMenu());

        
        
        // View Toggle Event Listeners
        this.shadowRoot.getElementById('listViewBtn').addEventListener('click', () => this.setView('list'));
        this.shadowRoot.getElementById('gridViewBtn').addEventListener('click', () => this.setView('grid'));
        
        // Keyboard Event Listener für ESC-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.shadowRoot.querySelector('.more-info-overlay.active')) {
                this.closeMoreInfo();
            }
        });
        
        this.setupChipFilters();
        this.updateSearchUI();
    }


    onSearchTypeChange() {
        // currentSearchType wird jetzt über das Filter-Menu gesetzt
        this.selectedRooms.clear();
        this.selectedType = '';
        this.isInitialized = false; // Reset bei Typ-Änderung
        this.updateSearchUI();
        this.updateItems();
    }    


    toggleFilterMenu() {
        const overlay = this.shadowRoot.getElementById('filterOverlay');
        const button = this.shadowRoot.getElementById('filterButton');
        
        if (overlay.classList.contains('active')) {
            this.closeFilterMenu();
        } else {
            this.openFilterMenu();
            button.classList.add('active');
        }
    }
    
    openFilterMenu() {
        this.updateFilterMenuContent();
        const overlay = this.shadowRoot.getElementById('filterOverlay');
        overlay.classList.add('active');
        
        // ESC Key Listener hinzufügen
        this.escKeyListener = (e) => {
            if (e.key === 'Escape') {
                this.closeFilterMenu();
            }
        };
        document.addEventListener('keydown', this.escKeyListener);
    }
    
    closeFilterMenu() {
        const overlay = this.shadowRoot.getElementById('filterOverlay');
        const button = this.shadowRoot.getElementById('filterButton');
        
        overlay.classList.remove('active');
        button.classList.remove('active');
        
        // ESC Key Listener entfernen
        if (this.escKeyListener) {
            document.removeEventListener('keydown', this.escKeyListener);
            this.escKeyListener = null;
        }
    }
    
    updateFilterMenuContent() {
        // Kategorie-Optionen aktualisieren
        this.updateCategoryOptions();
        
        // Raum-Optionen aktualisieren
        this.updateRoomOptions();
        
        // Event Listeners für Filter-Optionen hinzufügen
        this.setupFilterOptionListeners();
    }
    
    updateCategoryOptions() {
        const categoryOptions = this.shadowRoot.getElementById('categoryOptions');
        const currentType = this.currentSearchType;
        
        // Aktuelle Auswahl markieren
        categoryOptions.querySelectorAll('.filter-option').forEach(option => {
            const type = option.getAttribute('data-type');
            option.classList.toggle('selected', type === currentType);
            
            // Count aktualisieren (vereinfacht - können Sie später erweitern)
            const countElement = option.querySelector('.filter-option-count');
            if (type === currentType) {
                countElement.textContent = `${this.allItems.length} Verfügbar`;
            }
        });
    }
    
    updateRoomOptions() {
        const roomOptions = this.shadowRoot.getElementById('roomOptions');
        const rooms = [...new Set(this.allItems.map(item => item.room))].sort();
        
        // Bestehende Raum-Optionen entfernen (außer "Alle")
        const existingRooms = roomOptions.querySelectorAll('.filter-option:not([data-room=""])');
        existingRooms.forEach(room => room.remove());
        
        // Neue Raum-Optionen hinzufügen
        rooms.forEach(room => {
            const roomOption = document.createElement('div');
            roomOption.className = 'filter-option';
            roomOption.setAttribute('data-room', room);
            
            const roomIcon = this.getRoomIcon(room);
            const roomCount = this.allItems.filter(item => item.room === room).length;
            
            roomOption.innerHTML = `
                <div class="filter-option-icon">${roomIcon}</div>
                <div class="filter-option-info">
                    <div class="filter-option-name">${room}</div>
                    <div class="filter-option-count">${roomCount} Geräte</div>
                </div>
            `;
            
            // Aktuelle Auswahl markieren
            if (this.selectedRooms.has(room)) {
                roomOption.classList.add('selected');
            }
            
            roomOptions.appendChild(roomOption);
        });
        
        // "Alle Räume" aktualisieren
        const alleRooms = roomOptions.querySelector('[data-room=""]');
        if (alleRooms) {
            const countElement = alleRooms.querySelector('.filter-option-count');
            countElement.textContent = `${rooms.length} Räume`;
            
            // "Alle" ist ausgewählt wenn keine spezifischen Räume gewählt sind
            alleRooms.classList.toggle('selected', this.selectedRooms.size === 0);
        }
    }
    
    getRoomIcon(room) {
        const roomIcons = {
            'Wohnzimmer': '🛋️',
            'Schlafzimmer': '🛏️',
            'Küche': '🍳',
            'Bad': '🚿',
            'Badezimmer': '🚿',
            'Flur': '🏃',
            'Kinderzimmer': '👶',
            'Arbeitszimmer': '💻',
            'Büro': '💻',
            'Esszimmer': '🍽️',
            'Keller': '🏠',
            'Garage': '🚗'
        };
        
        return roomIcons[room] || '🏠';
    }
    
    setupFilterOptionListeners() {
        // Kategorie-Optionen
        this.shadowRoot.querySelectorAll('#categoryOptions .filter-option').forEach(option => {
            option.addEventListener('click', () => {
                // Alle anderen deselektieren
                this.shadowRoot.querySelectorAll('#categoryOptions .filter-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // Diese Option selektieren
                option.classList.add('selected');
            });
        });
        
        // Raum-Optionen
        this.shadowRoot.querySelectorAll('#roomOptions .filter-option').forEach(option => {
            option.addEventListener('click', () => {
                const isAlleOption = option.getAttribute('data-room') === '';
                
                if (isAlleOption) {
                    // "Alle" wurde geklickt - alle anderen deselektieren
                    this.shadowRoot.querySelectorAll('#roomOptions .filter-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                } else {
                    // Spezifischer Raum wurde geklickt
                    const alleOption = this.shadowRoot.querySelector('#roomOptions .filter-option[data-room=""]');
                    alleOption.classList.remove('selected');
                    option.classList.toggle('selected');
                    
                    // Wenn keine Räume mehr selektiert sind, "Alle" wieder aktivieren
                    const hasSelected = this.shadowRoot.querySelectorAll('#roomOptions .filter-option.selected').length > 0;
                    if (!hasSelected) {
                        alleOption.classList.add('selected');
                    }
                }
            });
        });
    }
    
    resetFilters() {
        // Alle Filter zurücksetzen
        this.currentSearchType = 'entities';
        this.selectedRooms.clear();
        this.selectedType = '';
        
        // UI aktualisieren
        this.updateFilterMenuContent();
        this.updateSearchUI();
        this.updateItems();

        // Badge und Tags aktualisieren
        this.updateFilterBadge();
        this.updateActiveFilterTags();        
    }
 
    applyFilterMenu() {
        // Gewählte Kategorie anwenden
        const selectedCategory = this.shadowRoot.querySelector('#categoryOptions .filter-option.selected');
        if (selectedCategory) {
            const newType = selectedCategory.getAttribute('data-type');
            if (newType !== this.currentSearchType) {
                this.currentSearchType = newType;
                this.onSearchTypeChange();
            }
        }
        
        // Gewählte Räume anwenden
        const selectedRooms = this.shadowRoot.querySelectorAll('#roomOptions .filter-option.selected:not([data-room=""])');
        this.selectedRooms.clear();
        selectedRooms.forEach(room => {
            const roomName = room.getAttribute('data-room');
            if (roomName) {
                this.selectedRooms.add(roomName);
            }
        });
        
        // Filter anwenden und Menu schließen
        this.applyFilters();
        this.closeFilterMenu();

        // Badge und Tags aktualisieren
        this.updateFilterBadge();
        this.updateActiveFilterTags();
    }
        

    updateFilterBadge() {
        const badge = this.shadowRoot.getElementById('filterBadge');
        const count = this.getActiveFilterCount();
        
        badge.textContent = count;
        badge.classList.toggle('active', count > 0);
    }
    

    getActiveFilterCount() {
        let count = 0;
        
        // Nur ausgewählte Räume zählen
        count += this.selectedRooms.size;
        
        console.log('Filter Count Debug:', {
            rooms: Array.from(this.selectedRooms),
            totalCount: count
        });
        
        return count;
    } 
    
    updateActiveFilterTags() {
        const container = this.shadowRoot.getElementById('activeFilters');
        const tagsContainer = container.querySelector('.active-filters-container');
        
        // Alle Tags entfernen
        tagsContainer.innerHTML = '';
        
        const tags = this.buildActiveFilterTags();
        
        if (tags.length > 0) {
            container.style.display = 'block';
            tags.forEach(tag => tagsContainer.appendChild(tag));
        } else {
            container.style.display = 'none';
        }
    }
    
    buildActiveFilterTags() {
        const tags = [];
        
        // Nur Raum-Tags erstellen
        if (this.selectedRooms.size > 0) {
            Array.from(this.selectedRooms).forEach(room => {
                const roomIcon = this.getRoomIcon(room);
                const tag = this.createTag(
                    `${roomIcon} ${room}`,
                    'room',
                    room
                );
                tags.push(tag);
            });
        }
        
        return tags;
    }
    
    createTag(text, type, value) {
        const tag = document.createElement('div');
        tag.className = 'active-filter-tag';
        tag.innerHTML = `
            <span>${text}</span>
            <button class="tag-remove" data-filter-type="${type}" data-filter-value="${value}">×</button>
        `;
        
        // Remove Button Event
        const removeBtn = tag.querySelector('.tag-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFilter(type, value, tag);
        });
        
        return tag;
    }
    
    removeFilter(type, value, tagElement) {
        // Animation vor dem Entfernen
        tagElement.classList.add('removing');
        
        setTimeout(() => {
            switch (type) {
                case 'searchType':
                    this.currentSearchType = 'entities';
                    this.onSearchTypeChange();
                    break;
                    
                case 'room':
                    this.selectedRooms.delete(value);
                    break;
                    
                case 'category':
                    this.selectedType = '';
                    break;
            }
            
            // UI aktualisieren
            this.updateFilterBadge();
            this.updateActiveFilterTags();
            this.applyFilters();
            
        }, 200); // Warten auf Animation
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

    showLoadingDots(text) {
        return `${text}<span class="loading-dots"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></span>`;
    }


    updateSearchUI() {
        const config = this.searchTypeConfigs[this.currentSearchType];
        this.searchInput.placeholder = config.placeholder;
        
        
        // Filter chips zurücksetzen
        this.setupCategoryChips([]);
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
                device.target_temperature = state.attributes.temperature || state.attributes.target_temp_high || state.attributes.target_temp_low || 20;
                device.hvac_mode = state.state;
                device.hvac_modes = state.attributes.hvac_modes || [];
                device.fan_mode = state.attributes.fan_mode;
                device.fan_modes = state.attributes.fan_modes || [];
                device.swing_mode = state.attributes.swing_mode;
                device.swing_modes = state.attributes.swing_modes || [];
                
                // MELCloud spezifische Attribute
                device.vane_horizontal = state.attributes.vane_horizontal;
                device.vane_vertical = state.attributes.vane_vertical;
                device.vane_horizontal_positions = state.attributes.vane_horizontal_positions || [];
                device.vane_vertical_positions = state.attributes.vane_vertical_positions || [];
                
                console.log('🌡️ MELCloud Climate attributes loaded:', {
                    vane_horizontal: device.vane_horizontal,
                    vane_vertical: device.vane_vertical,
                    fan_mode: device.fan_mode,
                    available_positions: {
                        horizontal: device.vane_horizontal_positions,
                        vertical: device.vane_vertical_positions,
                        fan_modes: device.fan_modes
                    }
                });
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
        
        const categories = [...new Set(this.allItems.map(d => d.category))].sort();
        this.setupCategoryChips(categories);

        this.applyFilters();
    }

    // Neue Methode: Aktualisiert nur die Statistiken ohne Filter-Zustand zu ändern
    updateCategoryStats() {
        const categories = [...new Set(this.allItems.map(d => d.category))].sort();
        const config = this.searchTypeConfigs[this.currentSearchType];
        
        // Nur die Stats der vorhandenen Chips aktualisieren
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

    // Optimierte Grid-Aktualisierung - verhindert unnötige DOM-Manipulationen
    updateGridItemStates() {
        if (this.currentView !== 'grid') return;
        
        // Nur die Zustände der vorhandenen Grid-Items aktualisieren
        const gridItems = this.shadowRoot.querySelectorAll('.grid-item');
        gridItems.forEach(gridElement => {
            const itemId = gridElement.getAttribute('data-item-id');
            const item = this.allItems.find(i => i.id === itemId);
            
            if (item) {
                // Aktiv-Zustand aktualisieren
                const isActive = this.isItemActive(item);
                gridElement.classList.toggle('active', isActive);
                
                // Zustandstext aktualisieren
                const stateElement = gridElement.querySelector('.grid-item-state');
                if (stateElement) {
                    stateElement.textContent = this.getStateText(item);
                }
                
                // Action-Buttons aktualisieren
                const actionsElement = gridElement.querySelector('.grid-item-actions');
                if (actionsElement) {
                    actionsElement.innerHTML = this.getGridActionButtons(item);
                }
            }
        });
    }

    // Neue Methode: Optimierte Listen-Aktualisierung
    updateListItemStates() {
        if (this.currentView !== 'list') return;
        
        // Nur die Zustände der vorhandenen Listen-Items aktualisieren
        const listItems = this.shadowRoot.querySelectorAll('.item');
        listItems.forEach(listElement => {
            const itemId = listElement.getAttribute('data-item-id');
            const item = this.allItems.find(i => i.id === itemId);
            
            if (item) {
                // Zustandstext aktualisieren
                const stateElement = listElement.querySelector('.item-state');
                if (stateElement) {
                    stateElement.textContent = this.getStateText(item);
                }
                
                // Action-Buttons aktualisieren
                const actionsElement = listElement.querySelector('.action-buttons');
                if (actionsElement) {
                    actionsElement.innerHTML = this.getActionButtons(item).replace('<div class="action-buttons">', '').replace('</div>', '');
                }
            }
        });
    }


    
    setupRoomChips(rooms) {
        // Diese Methode wird nicht mehr verwendet, da Room-Chips jetzt im Filter-Overlay sind
        // Leer lassen, damit keine Fehler auftreten
        return;
    }        

    setupCategoryChips(categories) {
        const categoryChips = this.shadowRoot.getElementById('typeFilterChips');
        
        // Bei Typ-Wechsel alle Chips außer "Alle" entfernen
        if (!this.isInitialized) {
            const existingChips = categoryChips.querySelectorAll('.filter-chip:not([data-value=""])');
            existingChips.forEach(chip => chip.remove());
            
            // "Alle" Chip wieder aktivieren
            const alleChip = categoryChips.querySelector('.filter-chip[data-value=""]');
            if (alleChip) {
                alleChip.classList.add('active');
            }
        } else {
            // Bei Updates: Aktuellen Zustand speichern
            const activeChip = categoryChips.querySelector('.filter-chip.active');
            const currentActiveCategory = activeChip ? activeChip.getAttribute('data-value') : '';
        }
        
        // Vorhandene Kategorien ermitteln
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
                    <span class="chip-icon">${icon}</span>
                    <div class="chip-content">
                        <span class="chip-name">${config.categoryNames[category] || category}</span>
                        <span class="chip-count">${stats}</span>
                    </div>
                `;                
                
                // Stagger-Animation für neue Chips
                chip.style.animationDelay = `${categories.indexOf(category) * 0.1}s`;
                
                categoryChips.appendChild(chip);
            }
        });
    }

    setupChipFilters() {


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

        // Badge und Tags aktualisieren
        this.updateFilterBadge();
        this.updateActiveFilterTags();        
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

        // Animation für Container beim Wechsel
        this.resultsContainer.classList.add('loading');
        
        // Animation-Klasse nach kurzer Zeit entfernen
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
            const roomGroup = document.createElement('div');
            roomGroup.className = 'room-group';
            
            const roomHeader = document.createElement('div');
            roomHeader.className = 'room-header';
            roomHeader.textContent = room;
            roomGroup.appendChild(roomHeader);
            
            itemsByRoom[room].forEach(item => {
                const itemElement = this.createListItemElement(item, true); // true = animate
                roomGroup.appendChild(itemElement);
            });
            
            this.resultsContainer.appendChild(roomGroup);
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
            
            const roomHeader = document.createElement('div');
            roomHeader.className = 'grid-room-header';
            roomHeader.textContent = room;
            roomGroup.appendChild(roomHeader);
            
            const gridScroll = document.createElement('div');
            gridScroll.className = 'grid-scroll';
            
            itemsByRoom[room].forEach(item => {
                const itemElement = this.createGridItemElement(item, true); // true = animate
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
        element.setAttribute('data-item-id', item.id); // ID für spätere Updates
        element.innerHTML = this.getItemHTML(item);
        
        element.addEventListener('click', (e) => {
            this.handleItemClick(item, e);
        });
        
        return element;
    }

    createGridItemElement(item, animate = false) {
        const element = document.createElement('div');
        element.className = animate ? 'grid-item fade-in' : 'grid-item';
        element.setAttribute('data-item-id', item.id); // ID für spätere Updates
        
        // Check if item should be highlighted as active
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
        // Logic to determine if item should be highlighted
        switch (item.itemType) {
            case 'entity':
                if (item.type === 'cover') {
                    return (item.position || 0) > 0;
                }


                if (item.type === 'climate') {
                    const mode = item.hvac_mode || item.state;
                    return ['heat', 'cool', 'auto', 'dry', 'fan_only'].includes(mode);
                }                
                return ['light', 'switch', 'fan', 'media_player'].includes(item.type) && item.state === 'on';
            case 'automation':
                return item.state === 'on';
            default:
                return false;
        }
    }  

    getGridItemHTML(item) {
        const stateText = this.getStateText(item);
        const actionButtons = this.getGridActionButtons(item);
        
        return `
            <div class="grid-item-header">
                <div class="grid-item-icon">${item.icon}</div>
                <div class="grid-item-actions">${actionButtons}</div>
            </div>
            <div class="grid-item-info">
                <div class="grid-item-name">${item.name}</div>
                <div class="grid-item-state">${stateText}</div>
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

    // INDIVIDUELLES MORE-INFO DIALOG

    handleItemClick(item, event) {
        event.stopPropagation();
        
        if (event.target.classList.contains('action-button') || event.target.classList.contains('grid-action-button')) {
            const action = event.target.getAttribute('data-action');
            this.executeAction(item, action, event.target);
            return;
        }
        
        // Prüfen welcher More-Info Modus konfiguriert ist
        if (this.moreInfoConfig.displayMode === 'replace') {
            this.switchToReplaceMode(item);
            return;
        }
        
        // Standard: Popup-Dialog öffnen
        this.openCustomMoreInfo(item);
    }    
    openCustomMoreInfo(item) {
        this.createMoreInfoDialog(item);
    }

    createMoreInfoDialog(item) {
        // Vorhandenes Dialog entfernen
        const existingOverlay = this.shadowRoot.querySelector('.more-info-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'more-info-overlay';
        overlay.innerHTML = this.getMoreInfoHTML(item);
        
        // Event Listeners
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeMoreInfo();
            }
        });
        
        const closeBtn = overlay.querySelector('.more-info-close');
        closeBtn.addEventListener('click', () => this.closeMoreInfo());
        
        // Control Buttons
        this.setupMoreInfoControls(overlay, item);
        
        // Dialog anzeigen
        this.shadowRoot.appendChild(overlay);
        
        // Animation starten
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }


    getMoreInfoHTML(item) {
        const stateInfo = this.getStateInfo(item);
        const controls = this.getControlsHTML(item);
        const attributes = this.getAttributesHTML(item);
        const history = this.getHistoryHTML(item);
        const shortcuts = this.getShortcutsHTML(item);
        
        return `
            <div class="more-info-dialog">
                ${this.getDropdownLayoutHTML(item, stateInfo, controls, attributes, history, shortcuts)}
            </div>
        `;
    }


    getDropdownLayoutHTML(item, stateInfo, controls, attributes, history, shortcuts) {
        const typeDisplayName = this.getTypeDisplayName(item);
        
        return `
            <!-- Popover Backdrop -->
            <div class="popover-backdrop" id="popoverBackdrop"></div>
            
            <div class="more-info-header">
                <div class="entity-info-section">
                    <div class="more-info-icon">${item.icon}</div>
                    <div class="entity-details">
                        <h2 class="entity-name">${item.name}</h2>
                        <p class="entity-type-room">${typeDisplayName} • ${item.room} • ${item.id}</p>
                    </div>
                </div>
                
                <div class="dropdown-container">
                    <button class="dropdown-button" id="moreInfoDropdownButton">
                        <span>Steuerung</span>
                        <span class="dropdown-icon">
                            <svg viewBox="-4 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.0020846,16 L12,20.9980217 L6.99551,16 M6.99551,8 L12,3.00077787 L17.0020846,8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                    </button>
                    <div class="dropdown-menu" id="moreInfoDropdownMenu">
                        <div class="dropdown-item active" data-more-info-section="controls">
                            <span class="dropdown-item-icon">${this.getControlIcon(item)}</span>
                            <span>Steuerung</span>
                        </div>
                        ${item.type === 'media_player' ? `
                            <div class="dropdown-item" data-more-info-section="tts">
                                <span class="dropdown-item-icon">🗣️</span>
                                <span>Sprechen</span>
                            </div>
                            <div class="dropdown-item" data-more-info-section="music">
                                <span class="dropdown-item-icon">🎵</span>
                                <span>Musik</span>
                            </div>
                        ` : ''}
                        <div class="dropdown-item" data-more-info-section="details">
                            <span class="dropdown-item-icon">📊</span>
                            <span>Details</span>
                        </div>
                        <div class="dropdown-item" data-more-info-section="history">
                            <span class="dropdown-item-icon">📈</span>
                            <span>Logbuch</span>
                        </div>
                        <div class="dropdown-item" data-more-info-section="shortcuts">
                            <span class="dropdown-item-icon">⚡</span>
                            <span>Aktionen</span>
                        </div>
                    </div>
                </div>
    
                <button class="more-info-close">×</button>
            </div>
            
            <div class="more-info-content">
                <div class="more-info-section active fade-in" data-more-info-content="controls">
                    ${controls}
                </div>
                
                ${item.type === 'media_player' ? `
                    <div class="more-info-section" data-more-info-content="tts" style="display: none;">
                        <div class="more-info-section">
                            <h3 class="section-title">🗣️ Text-to-Speech</h3>
                            ${this.getTTSHTML(item) || '<div class="ma-empty-state">TTS nicht verfügbar</div>'}
                        </div>
                    </div>
                    
                    <div class="more-info-section" data-more-info-content="music" style="display: none;">
                        <div class="more-info-section">
                            <h3 class="section-title">🎵 Musik Suche</h3>
                            ${this.getMusicAssistantHTML(item)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="more-info-section" data-more-info-content="details" style="display: none;">
                    ${attributes}
                </div>
                
                <div class="more-info-section" data-more-info-content="history" style="display: none;">
                    ${history}
                </div>
                
                <div class="more-info-section" data-more-info-content="shortcuts" style="display: none;">
                    ${shortcuts}
                </div>
            </div>
        `;
    }        


    getMusicAssistantHTML(item) {
        return this.checkMusicAssistantAvailability() ? `
            <div class="ma-search-container">
                <div class="ma-search-bar-container">
                    <input type="text" 
                           class="ma-search-input" 
                           placeholder="Künstler, Album oder Song suchen..." 
                           data-ma-search="${item.id}">
                    <div class="ma-enqueue-mode" data-ma-enqueue="${item.id}">
                        <span class="ma-enqueue-icon">▶️</span>
                        <span class="ma-enqueue-text">Play now</span>
                    </div>
                </div>
                <div class="ma-filter-container" id="ma-filters-${item.id}">
                    <div class="ma-filter-chip ma-filter-active" data-filter="all">
                        <span class="ma-filter-icon">🔗</span>
                        <span>Alle</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="artists">
                        <span class="ma-filter-icon">👤</span>
                        <span>Künstler</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="albums">
                        <span class="ma-filter-icon">💿</span>
                        <span>Alben</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="tracks">
                        <span class="ma-filter-icon">🎵</span>
                        <span>Songs</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="playlists">
                        <span class="ma-filter-icon">📋</span>
                        <span>Playlists</span>
                    </div>
                    <div class="ma-filter-chip" data-filter="radio">
                        <span class="ma-filter-icon">📻</span>
                        <span>Radio</span>
                    </div>
                </div>
                <div class="ma-search-results" id="ma-results-${item.id}">
                    <div class="ma-empty-state">Gebe einen Suchbegriff ein um Musik zu finden...</div>
                </div>
            </div>
        ` : '<div class="ma-empty-state">Music Assistant Integration nicht verfügbar</div>';
    }
    

    
    // NEUE Methode für Tab-Layout (Popup-Dialog)
    getTabLayoutHTML(item, stateInfo, controls, attributes) {
        return `
            <div class="more-info-tabs-container">
                <div class="more-info-tabs">
                    <button class="more-info-tab active" data-more-info-tab="status">
                        <span class="more-info-tab-icon">📊</span>
                        <span>Status</span>
                    </button>
                    <button class="more-info-tab" data-more-info-tab="controls">
                        <span class="more-info-tab-icon">${this.getControlIcon(item)}</span>
                        <span>Steuerung</span>
                    </button>
                    <button class="more-info-tab" data-more-info-tab="details">
                        <span class="more-info-tab-icon">🔧</span>
                        <span>Details</span>
                    </button>
                </div>
                
                <div class="more-info-tab-content active" data-more-info-tab-content="status">
                    ${stateInfo}
                </div>
                
                <div class="more-info-tab-content" data-more-info-tab-content="controls">
                    ${controls}
                </div>
                
                <div class="more-info-tab-content" data-more-info-tab-content="details">
                    ${attributes}
                </div>
            </div>
        `;
    }
    

    

    getStateInfo(item) {
        const stateClass = ['on', 'playing', 'open', 'active'].includes(item.state) ? 'on' : 'off';
        const stateText = this.getDetailedStateText(item);
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">🔍 Aktueller Status</h3>
                <div class="state-display">
                    <div class="state-value">
                        ${stateText.value}
                        ${stateText.unit ? `<span class="state-unit">${stateText.unit}</span>` : ''}
                    </div>
                    <div class="state-badge ${stateClass}">${stateText.status}</div>
                </div>
            </div>
        `;
    }

    getControlsHTML(item) {
        if (item.itemType !== 'entity') {
            return this.getNonEntityControls(item);
        }
        
        switch (item.type) {
            case 'light':
                return this.getLightControls(item);
            case 'climate':
                return this.getClimateControls(item);
            case 'cover':
                return this.getCoverControls(item);
            case 'media_player':
                return this.getMediaControls(item);
            case 'switch':
            case 'fan':
                return this.getBasicControls(item);
            default:
                return '';
        }
    }

    getLightControls(item) {
        const brightness = item.brightness || 0;
        const isOn = item.state === 'on';
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">💡 Steuerung</h3>
                <div class="control-section">
                    <button class="control-button" data-action="toggle">
                        ${isOn ? '💡 Ausschalten' : '🔆 Einschalten'}
                    </button>
                </div>
                ${isOn ? `
                    <div class="slider-control">
                        <div class="slider-label">
                            <span>Helligkeit</span>
                            <span>${brightness}%</span>
                        </div>
                        <input type="range" class="slider" data-control="brightness" 
                               min="1" max="100" value="${brightness}">
                    </div>
                ` : ''}
            </div>
        `;
    }

    getClimateControls(item) {
        const currentTemp = item.current_temperature || '--';
        const targetTemp = item.target_temperature || 20;
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">🌡️ Temperaturregelung</h3>
                <div class="slider-control">
                    <div class="slider-label">
                        <span>Zieltemperatur</span>
                        <span>${targetTemp}°C</span>
                    </div>
                    <input type="range" class="slider" data-control="temperature" 
                           min="10" max="30" step="0.5" value="${targetTemp}">
                </div>
                <div class="control-section" style="margin-top: 16px;">
                    <button class="control-button secondary" data-action="heat">🔥 Heizen</button>
                    <button class="control-button secondary" data-action="cool">❄️ Kühlen</button>
                    <button class="control-button secondary" data-action="off">⏹️ Aus</button>
                </div>
            </div>
        `;
    }

    getCoverControls(item) {
        const position = item.position || 0;
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">🪟 Rollladensteuerung</h3>
                <div class="control-section">
                    <button class="control-button" data-action="open">⬆️ Öffnen</button>
                    <button class="control-button secondary" data-action="stop">⏹️ Stopp</button>
                    <button class="control-button" data-action="close">⬇️ Schließen</button>
                </div>
                <div class="slider-control">
                    <div class="slider-label">
                        <span>Position</span>
                        <span>${position}%</span>
                    </div>
                    <input type="range" class="slider" data-control="position" 
                           min="0" max="100" value="${position}">
                </div>
            </div>
        `;
    }



    getMediaControls(item) {
        const volume = item.volume || 0;
        const isPlaying = item.state === 'playing';
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">📺 Media Player Steuerung</h3>
                <div class="control-section">
                    <button class="control-button" data-action="play_pause">
                        ${isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                    <button class="control-button secondary" data-action="previous">⏮️</button>
                    <button class="control-button secondary" data-action="next">⏭️</button>
                </div>
                <div class="slider-control">
                    <div class="slider-label">
                        <span>Lautstärke</span>
                        <span>${volume}%</span>
                    </div>
                    <input type="range" class="slider" data-control="volume" 
                           min="0" max="100" value="${volume}">
                </div>
                ${item.media_title ? `
                    <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <div style="font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">
                            🎵 ${item.media_title}
                        </div>
                        ${item.attributes.media_artist ? `
                            <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;">
                                👤 ${item.attributes.media_artist}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }        

    
        

    getBasicControls(item) {
        const isOn = item.state === 'on';
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">🔌 Steuerung</h3>
                <div class="control-section">
                    <button class="control-button" data-action="toggle">
                        ${isOn ? '⏹️ Ausschalten' : '▶️ Einschalten'}
                    </button>
                </div>
            </div>
        `;
    }

    getNonEntityControls(item) {
        switch (item.itemType) {
            case 'automation':
                return `
                    <div class="more-info-section">
                        <h3 class="section-title">🤖 Automation Steuerung</h3>
                        <div class="control-section">
                            <button class="control-button" data-action="trigger">🚀 Jetzt ausführen</button>
                            <button class="control-button secondary" data-action="toggle">
                                ${item.state === 'on' ? '⏸️ Deaktivieren' : '▶️ Aktivieren'}
                            </button>
                        </div>
                    </div>
                `;
            case 'script':
                return `
                    <div class="more-info-section">
                        <h3 class="section-title">📜 Skript Steuerung</h3>
                        <div class="control-section">
                            <button class="control-button" data-action="run">▶️ Skript ausführen</button>
                        </div>
                    </div>
                `;
            case 'scene':
                return `
                    <div class="more-info-section">
                        <h3 class="section-title">🎭 Szene Steuerung</h3>
                        <div class="control-section">
                            <button class="control-button" data-action="activate">🎬 Szene aktivieren</button>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    getAttributesHTML(item) {
        const importantAttributes = this.getImportantAttributes(item);
        
        if (importantAttributes.length === 0) return '';
        
        const attributeItems = importantAttributes.map(attr => `
            <div class="attribute-item">
                <div class="attribute-label">${attr.label}</div>
                <div class="attribute-value">${attr.value}</div>
            </div>
        `).join('');
        
        return `
            <div class="more-info-section">
                <h3 class="section-title">📊 Details</h3>
                <div class="attribute-grid">
                    ${attributeItems}
                </div>
            </div>
        `;
    }

    getImportantAttributes(item) {
        const attributes = [];
        
        // Allgemeine Attribute
        attributes.push({
            label: 'Entity ID',
            value: item.id
        });
        
        if (item.attributes.last_changed) {
            attributes.push({
                label: 'Zuletzt geändert',
                value: new Date(item.attributes.last_changed).toLocaleString('de-DE')
            });
        }
        
        // Spezifische Attribute je nach Typ
        switch (item.type) {
            case 'light':
                if (item.attributes.color_temp) {
                    attributes.push({
                        label: 'Farbtemperatur',
                        value: `${item.attributes.color_temp} mired`
                    });
                }
                if (item.attributes.rgb_color) {
                    attributes.push({
                        label: 'RGB Farbe',
                        value: `rgb(${item.attributes.rgb_color.join(', ')})`
                    });
                }
                break;
                
            case 'sensor':
                if (item.attributes.device_class) {
                    attributes.push({
                        label: 'Sensor Typ',
                        value: item.attributes.device_class
                    });
                }
                break;
                
            case 'media_player':
                if (item.attributes.media_title) {
                    attributes.push({
                        label: 'Aktueller Titel',
                        value: item.attributes.media_title
                    });
                }
                if (item.attributes.media_artist) {
                    attributes.push({
                        label: 'Künstler',
                        value: item.attributes.media_artist
                    });
                }
                break;
        }
        
        return attributes;
    }

    setupMoreInfoControls(overlay, item) {
        // Dropdown System für alle Popup-Dialoge
        this.setupMoreInfoDropdown(overlay, item);
        
        // Control Buttons
        const controlButtons = overlay.querySelectorAll('[data-action]');
        controlButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.getAttribute('data-action');
                this.executeMoreInfoAction(item, action, button);
            });
        });
        
        // Sliders
        const sliders = overlay.querySelectorAll('[data-control]');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.handleSliderChange(item, slider.getAttribute('data-control'), e.target.value);
            });
        });
    
        // TTS Event Listeners für Popup Dialog
        if (item.type === 'media_player') {
            this.setupTTSEventListeners(item);
        }        
    }

    // NEUE Methode für More-Info Tab-System (Popup)
    setupMoreInfoTabs(overlay, item) {
        const tabs = overlay.querySelectorAll('.more-info-tab');
        const contents = overlay.querySelectorAll('.more-info-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-more-info-tab');
                
                // Alle Tabs deaktivieren
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Aktiven Tab aktivieren
                tab.classList.add('active');
                const targetContent = overlay.querySelector(`[data-more-info-tab-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    


    setupMediaPlayerTabs(overlay, item) {
        const tabs = overlay.querySelectorAll('.media-tab');
        const contents = overlay.querySelectorAll('.media-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Alle Tabs deaktivieren
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Aktiven Tab aktivieren
                tab.classList.add('active');
                const targetContent = overlay.querySelector(`[data-tab-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    
                    // Spezielle Initialisierung für Music Assistant Tab
                    if (targetTab === 'music' && this.checkMusicAssistantAvailability()) {
                        // Music Assistant Event Listeners neu setup
                        setTimeout(() => {
                            this.setupMusicAssistantEventListeners(item);
                        }, 100);
                    }
                    
                    // TTS Event Listeners für TTS Tab
                    if (targetTab === 'tts') {
                        setTimeout(() => {
                            this.setupTTSEventListeners(item);
                        }, 100);
                    }
                }
            });
        });
        
        // Initial Setup für den ersten Tab (Steuerung)
        this.setupTTSEventListeners(item);
        this.setupMusicAssistantEventListeners(item);
    }    

    executeMoreInfoAction(item, action, button) {
        // Visual Feedback
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Wird ausgeführt...';
        button.disabled = true;
        
        // Action ausführen
        this.executeAction(item, action).then(() => {
            // Button zurücksetzen
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                
                // Dialog-Inhalt aktualisieren
                this.updateMoreInfoContent(item);
            }, 1000);
        });
    }

    handleSliderChange(item, control, value) {
        if (!this._hass) return;
        
        let serviceData = { entity_id: item.id };
        
        switch (control) {
            case 'brightness':
                serviceData.brightness_pct = parseInt(value);
                this._hass.callService('light', 'turn_on', serviceData);
                break;
                
            case 'temperature':
                serviceData.temperature = parseFloat(value);
                this._hass.callService('climate', 'set_temperature', serviceData);
                break;
                
            case 'position':
                serviceData.position = parseInt(value);
                this._hass.callService('cover', 'set_cover_position', serviceData);
                break;
                
            case 'volume':
                serviceData.volume_level = parseInt(value) / 100;
                this._hass.callService('media_player', 'volume_set', serviceData);
                break;
        }
        
        // Label aktualisieren
        const slider = this.shadowRoot.querySelector(`[data-control="${control}"]`);
        const label = slider.parentNode.querySelector('.slider-label span:last-child');
        if (label) {
            const unit = control === 'temperature' ? '°C' : control === 'volume' || control === 'brightness' || control === 'position' ? '%' : '';
            label.textContent = value + unit;
        }
    }

    updateMoreInfoContent(item) {
        // Aktuelle Item-Daten aktualisieren
        const currentState = this._hass.states[item.id];
        if (currentState) {
            Object.assign(item, {
                state: currentState.state,
                attributes: currentState.attributes
            });
            
            // Spezifische Attribute neu berechnen
            const domain = item.id.split('.')[0];
            this.addDomainSpecificAttributes(item, domain, currentState);
        }
        
        // Dialog-Inhalt für Dropdown-Layout aktualisieren
        const overlay = this.shadowRoot.querySelector('.more-info-overlay');
        if (overlay) {
            const stateInfo = this.getStateInfo(item);
            const controls = this.getControlsHTML(item);
            const attributes = this.getAttributesHTML(item);
            const history = this.getHistoryHTML(item);
            const shortcuts = this.getShortcutsHTML(item);
            
            // Nur die aktive Sektion aktualisieren
            const activeSection = overlay.querySelector('.more-info-section.active');
            const activeDropdownItem = overlay.querySelector('.dropdown-item.active');
            
            if (activeSection && activeDropdownItem) {
                const sectionType = activeDropdownItem.getAttribute('data-more-info-section');
                
                switch (sectionType) {
                    case 'controls':
                        activeSection.innerHTML = controls;
                        break;
                    case 'tts':
                        if (item.type === 'media_player') {
                            activeSection.innerHTML = `
                                <div class="more-info-section">
                                    <h3 class="section-title">🗣️ Text-to-Speech</h3>
                                    ${this.getTTSHTML(item) || '<div class="ma-empty-state">TTS nicht verfügbar</div>'}
                                </div>
                            `;
                        }
                        break;
                    case 'music':
                        if (item.type === 'media_player') {
                            activeSection.innerHTML = `
                                <div class="more-info-section">
                                    <h3 class="section-title">🎵 Musik Suche</h3>
                                    ${this.getMusicAssistantHTML(item)}
                                </div>
                            `;
                        }
                        break;
                    case 'details':
                        activeSection.innerHTML = attributes;
                        break;
                    case 'history':
                        activeSection.innerHTML = history;
                        break;
                    case 'shortcuts':
                        activeSection.innerHTML = shortcuts;
                        break;
                }
            }
            
            this.setupMoreInfoControls(overlay, item);
        }
    }


    setupMoreInfoDropdown(overlay, item) {
        const dropdownButton = overlay.querySelector('#moreInfoDropdownButton');
        const dropdownMenu = overlay.querySelector('#moreInfoDropdownMenu');
        const dropdownItems = overlay.querySelectorAll('.dropdown-item');
        const sections = overlay.querySelectorAll('[data-more-info-content]');
        const backdrop = overlay.querySelector('#popoverBackdrop');
        
        if (!dropdownButton || !dropdownMenu || !backdrop) return;
        
        let isDropdownOpen = false;
        
        
        // Öffne Popover
        const openPopover = () => {
            if (isDropdownOpen) return;
            
            isDropdownOpen = true;
            
            // Backdrop aktivieren
            backdrop.classList.add('open');
            
            // Button State
            dropdownButton.classList.add('open');
            
            // Position berechnen und setzen
            const { top, left } = calculatePopoverPosition();
            dropdownMenu.style.top = top + 'px';
            dropdownMenu.style.left = left + 'px';
            
            // Menu öffnen
            dropdownMenu.classList.add('open');
            
            // Focus Management
            dropdownMenu.focus();
        };
        
        // Schließe Popover
        const closePopover = () => {
            if (!isDropdownOpen) return;
            
            isDropdownOpen = false;
            
            // Backdrop deaktivieren
            backdrop.classList.remove('open');
            
            // Button State
            dropdownButton.classList.remove('open');
            
            // Menu schließen
            dropdownMenu.classList.remove('open');
        };
        
        // Toggle Dropdown
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (isDropdownOpen) {
                closePopover();
            } else {
                openPopover();
            }
        });
        
        // Backdrop Click - Schließen
        backdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            closePopover();
        });
        
        // Outside Click - Schließen
        document.addEventListener('click', (e) => {
            if (!dropdownButton.contains(e.target) && 
                !dropdownMenu.contains(e.target) && 
                isDropdownOpen) {
                closePopover();
            }
        });
        
        // ESC Key - Schließen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isDropdownOpen) {
                closePopover();
                dropdownButton.focus();
            }
        });
        
        // Dropdown Item Selection
        dropdownItems.forEach(dropdownItem => {
            dropdownItem.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const targetSection = dropdownItem.getAttribute('data-more-info-section');
                const sectionText = dropdownItem.querySelector('span:last-child').textContent;
                
                // Update active state
                dropdownItems.forEach(i => i.classList.remove('active'));
                dropdownItem.classList.add('active');
                
                // Update button text
                dropdownButton.querySelector('span:first-child').textContent = sectionText;
                
                // Hide all sections
                sections.forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active', 'fade-in');
                });
                
                // Show selected section with animation
                const targetSectionElement = overlay.querySelector(`[data-more-info-content="${targetSection}"]`);
                if (targetSectionElement) {
                    targetSectionElement.style.display = 'block';
                    targetSectionElement.classList.add('active');
                    
                    // Trigger reflow for animation
                    targetSectionElement.offsetHeight;
                    targetSectionElement.classList.add('fade-in');

                    // Spezielle Initialisierung für verschiedene Sektionen
                    if (targetSection === 'history') {
                        // Logbook neu laden wenn Sektion aktiviert wird
                        this.loadRealLogEntries(item);
                    } else if (targetSection === 'shortcuts') {
                        // Shortcuts Event Listeners setup
                        setTimeout(() => {
                            this.setupShortcutEventListeners(item);
                        }, 150);
                    }
                }
                
                // Popover schließen
                closePopover();
            });
            
            // Hover Effekte für bessere UX
            dropdownItem.addEventListener('mouseenter', () => {
                dropdownItem.style.transform = 'translateX(2px)';
            });
            
            dropdownItem.addEventListener('mouseleave', () => {
                dropdownItem.style.transform = 'translateX(0)';
            });
        });
        
        // Window Resize - Position neu berechnen
        window.addEventListener('resize', () => {
            if (isDropdownOpen) {
                const { top, left } = calculatePopoverPosition();
                dropdownMenu.style.top = top + 'px';
                dropdownMenu.style.left = left + 'px';
            }
        });
    }        
    

    closeMoreInfo() {
        const overlay = this.shadowRoot.querySelector('.more-info-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    getDetailedStateText(item) {
        switch (item.itemType) {
            case 'entity':
                return this.getEntityDetailedState(item);
            case 'automation':
                return {
                    value: item.state === 'on' ? 'Aktiv' : 'Inaktiv',
                    status: item.state === 'on' ? 'Läuft' : 'Pausiert',
                    unit: ''
                };
            case 'script':
                return {
                    value: item.state === 'on' ? 'Läuft' : 'Bereit',
                    status: item.state === 'on' ? 'Aktiv' : 'Wartend',
                    unit: ''
                };
            case 'scene':
                return {
                    value: 'Verfügbar',
                    status: 'Bereit',
                    unit: ''
                };
            default:
                return {
                    value: item.state,
                    status: 'Unbekannt',
                    unit: ''
                };
        }
    }

    getEntityDetailedState(item) {
        switch (item.type) {
            case 'light':
                if (item.state === 'on') {
                    return {
                        value: item.brightness || 0,
                        unit: '%',
                        status: 'An'
                    };
                }
                return { value: 'Aus', status: 'Aus', unit: '' };
                


            case 'climate':
                const currentTemp = item.current_temperature || '--';
                const targetTemp = item.target_temperature || '--';
                const mode = item.hvac_mode || item.state;
                
                let modeText = 'Aus';
                switch(mode) {
                    case 'heat': modeText = 'Heizbetrieb'; break;
                    case 'cool': modeText = 'Kühlbetrieb'; break;
                    case 'auto': modeText = 'Automatik'; break;
                    case 'dry': modeText = 'Entfeuchtung'; break;
                    case 'fan_only': modeText = 'Nur Lüfter'; break;
                    case 'off': modeText = 'Aus'; break;
                    default: modeText = mode; break;
                }
                
                return {
                    value: `${currentTemp}°C`,
                    status: modeText,
                    unit: ''
                };
                
                
            case 'sensor':
                return {
                    value: item.state,
                    unit: item.attributes.unit_of_measurement || '',
                    status: 'Sensor'
                };

            case 'cover':
                const position = item.position || 0;
                return {
                    value: position === 0 ? 'Geschlossen' : 'Geöffnet',
                    status: position === 0 ? 'Geschlossen' : 'Geöffnet',
                    unit: ''
                };                
                
            case 'media_player':
                if (item.state === 'playing') {
                    return {
                        value: 'Spielt',
                        status: item.media_title || 'Unbekannt',
                        unit: ''
                    };
                }
                return {
                    value: item.state === 'paused' ? 'Pausiert' : 'Aus',
                    status: 'Bereit',
                    unit: ''
                };
                
            default:
                return {
                    value: item.state,
                    status: item.state === 'on' ? 'An' : 'Aus',
                    unit: ''
                };
        }
    }

    getTypeDisplayName(item) {
        const typeMap = {
            'entity': {
                'light': 'Licht',
                'switch': 'Schalter',
                'climate': 'Klimaanlage',
                'cover': 'Rolladen',
                'fan': 'Ventilator',
                'sensor': 'Sensor',
                'media_player': 'Media Player'
            },
            'automation': 'Automation',
            'script': 'Skript',
            'scene': 'Szene'
        };
        
        if (item.itemType === 'entity') {
            return typeMap.entity[item.type] || item.type;
        }
        
        return typeMap[item.itemType] || item.itemType;
    }

    // ENDE MORE-INFO DIALOG

    executeAction(item, action, buttonElement = null) {
        if (!this._hass) return Promise.resolve();
        
        // Loading state für den Button anzeigen (falls Button übergeben wird)
        let originalText = '';
        if (buttonElement) {
            originalText = buttonElement.innerHTML;
            buttonElement.innerHTML = this.showLoadingDots(originalText.length > 2 ? '⏳' : originalText);
            buttonElement.disabled = true;
        }
        
        // Action ausführen
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
                
            // Erweiterte Actions für More-Info Dialog
            case 'open':
                serviceCall = this._hass.callService('cover', 'open_cover', { entity_id: item.id });
                break;
                
            case 'close':
                serviceCall = this._hass.callService('cover', 'close_cover', { entity_id: item.id });
                break;
                
            case 'stop':
                serviceCall = this._hass.callService('cover', 'stop_cover', { entity_id: item.id });
                break;
                
            case 'play_pause':
                serviceCall = this._hass.callService('media_player', 'media_play_pause', { entity_id: item.id });
                break;
                
            case 'previous':
                serviceCall = this._hass.callService('media_player', 'media_previous_track', { entity_id: item.id });
                break;
                
            case 'next':
                serviceCall = this._hass.callService('media_player', 'media_next_track', { entity_id: item.id });
                break;
                
            case 'heat':
                serviceCall = this._hass.callService('climate', 'set_hvac_mode', { 
                    entity_id: item.id, 
                    hvac_mode: 'heat' 
                });
                break;
                
            case 'cool':
                serviceCall = this._hass.callService('climate', 'set_hvac_mode', { 
                    entity_id: item.id, 
                    hvac_mode: 'cool' 
                });
                break;
                
            case 'off':
                serviceCall = this._hass.callService('climate', 'set_hvac_mode', { 
                    entity_id: item.id, 
                    hvac_mode: 'off' 
                });
                break;

            case 'dry':
                serviceCall = this._hass.callService('climate', 'set_hvac_mode', { 
                    entity_id: item.id, 
                    hvac_mode: 'dry' 
                });
                break;
                
            case 'fan_only':
                serviceCall = this._hass.callService('climate', 'set_hvac_mode', { 
                    entity_id: item.id, 
                    hvac_mode: 'fan_only' 
                });
                break;
                
        }
        
        // Promise zurückgeben für More-Info Dialog
        if (serviceCall) {
            return serviceCall.then(() => {
                // Loading state nach kurzer Zeit entfernen
                if (buttonElement) {
                    setTimeout(() => {
                        buttonElement.innerHTML = originalText;
                        buttonElement.disabled = false;
                    }, 1000);
                }
            }).catch((error) => {
                console.error('Service call failed:', error);
                if (buttonElement) {
                    buttonElement.innerHTML = originalText;
                    buttonElement.disabled = false;
                }
            });
        }
        
        // Fallback wenn kein Service Call
        if (buttonElement) {
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
                buttonElement.disabled = false;
            }, 1000);
        }
        
        return Promise.resolve();
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
                const position = device.position || 0;
                return position === 0 ? 'Geschlossen' : `Geöffnet • ${position}%`;                
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
            show_attributes: true,
            show_controls: true,
            show_history: false,
            more_info_mode: 'popup',        // NEU: 'popup' oder 'replace'
            custom_actions: [],
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
    description: 'Eine universelle Suchkarte für Home Assistant - Geräte, Automationen, Skripte und Szenen mit individuellem More-Info Dialog'
});

console.info(
    `%c FAST-SEARCH-CARD %c v3.1.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);
