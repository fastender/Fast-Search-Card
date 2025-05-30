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
            displayMode: config.more_info_mode || 'popup' // Neue Option: 'popup' oder 'replace'  
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
                }

                .filter-button:hover:not(.active) {
                    background: rgba(0, 0, 0, 0.25);
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
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    width: 100%;
                    max-height: 80vh;
                    overflow: hidden;
                    transform: scale(0.9) translateY(20px);
                    transition: all 0.3s ease;
                    position: relative;
                }

                .more-info-overlay.active .more-info-dialog {
                    transform: scale(1) translateY(0);
                }

                .more-info-header {
                    background: linear-gradient(135deg, #007aff, #0056b3);
                    color: white;
                    padding: 24px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .more-info-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 18px;
                }

                .more-info-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                .more-info-icon {
                    font-size: 32px;
                    background: rgba(255, 255, 255, 0.2);
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
                }

                .more-info-type {
                    font-size: 14px;
                    opacity: 0.8;
                    margin: 4px 0 0 0;
                }

                .more-info-content {
                    padding: 0;
                    max-height: calc(80vh - 120px);
                    overflow-y: auto;
                }

                .more-info-section {
                    padding: 24px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .more-info-section:last-child {
                    border-bottom: none;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
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
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    border-left: 4px solid #007aff;
                }

                .attribute-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .attribute-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
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
                    background: #007aff;
                    color: white;
                    border: none;
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
                    background: #0056b3;
                    transform: translateY(-1px);
                }

                .control-button.secondary {
                    background: #f8f9fa;
                    color: #666;
                    border: 1px solid #ddd;
                }

                .control-button.secondary:hover {
                    background: #e9ecef;
                    color: #333;
                }

                .slider-control {
                    margin-top: 16px;
                }

                .slider-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                    color: #666;
                }

                .slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #ddd;
                    outline: none;
                    appearance: none;
                    cursor: pointer;
                }

                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007aff;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                }

                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007aff;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
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
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .more-info-replace.active {
                    display: block;
                }

                .more-info-replace.active {
                    display: block;
                }
                
                .replace-header {
                    background: linear-gradient(135deg, #007aff, #0056b3);
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .back-button {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 8px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 18px;
                }
                
                .back-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }
                
                .breadcrumb {
                    flex: 1;
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .breadcrumb-path {
                    font-size: 12px;
                    opacity: 0.7;
                    margin-bottom: 2px;
                }
                
                .breadcrumb-current {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .replace-content {
                    display: flex;
                    min-height: 400px;
                }
                
                .icon-section {
                    flex: 1;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    position: relative;
                }
                
                .device-icon-large {
                    font-size: 80px;
                    margin-bottom: 20px;
                    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
                    animation: iconPulse 2s ease-in-out infinite;
                }
                
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .status-indicator-large {
                    background: #28a745;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                }
                
                .status-indicator-large.off {
                    background: #6c757d;
                    box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
                }
                
                .quick-stats {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    text-align: center;
                }
                
                .stat-item {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                    padding: 8px;
                    margin: 4px 0;
                    font-size: 12px;
                    color: #666;
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
                    color: #333;
                    line-height: 1.2;
                }
                
                .entity-subtitle-large {
                    font-size: 14px;
                    color: #666;
                    margin: 4px 0 0 0;
                }
                
                .control-group-large {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 20px;
                    border-left: 4px solid #007aff;
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
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 12px;
                }
                
                .attribute-label-large {
                    font-size: 12px;
                    font-weight: 500;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                
                .attribute-value-large {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                }
                
                /* Responsive für Replace Mode */
                @media (max-width: 768px) {
                    .replace-content {
                        flex-direction: column;
                        min-height: auto;
                    }
                    
                    .icon-section {
                        min-height: 200px;
                        padding: 30px 20px;
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
                    margin-top: 24px;
                }
                
                .accordion-item {
                    border: 2px solid #e9ecef;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .accordion-item.active {
                    border-color: #007aff;
                    box-shadow: 0 4px 20px rgba(0, 122, 255, 0.1);
                }
                
                .accordion-header {
                    background: #f8f9fa;
                    padding: 20px 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s;
                    user-select: none;
                }
                
                .accordion-item.active .accordion-header {
                    background: rgba(0, 122, 255, 0.1);
                }
                
                .accordion-header:hover {
                    background: #e9ecef;
                }
                
                .accordion-item.active .accordion-header:hover {
                    background: rgba(0, 122, 255, 0.15);
                }
                
                .accordion-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
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
                    background: white;
                }
                
                .accordion-item.active .accordion-content {
                    max-height: 800px;
                    padding: 24px;
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
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    background: white;
                }
                
                .log-entry {
                    padding: 12px 16px;
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
                    color: #333;
                    font-weight: 500;
                }
                
                .log-time {
                    color: #666;
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
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    background: white;
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
 
                
                .ma-empty-state {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 40px 20px;
                    font-size: 14px;
                }
                
                /* Service Selector Styles */
                .media-service-selector {
                    margin-bottom: 24px;
                }
                
                .service-tabs {
                    display: flex;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 4px;
                    backdrop-filter: blur(10px);
                }
                
                .service-tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .service-tab.active {
                    background: rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .service-tab:hover:not(.active) {
                    color: rgba(255, 255, 255, 0.8);
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .service-icon {
                    font-size: 16px;
                }
                
                .service-content {
                    display: none;
                }
                
                .service-content.active {
                    display: block;
                }

                
                
                /* Apple Music Style List */
                .apple-music-style {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .music-section {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .music-section:last-child {
                    border-bottom: none;
                }
                
                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px 8px;
                    background: rgba(255, 255, 255, 0.02);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.95);
                    margin: 0;
                }
                
                .section-count {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 500;
                }
                
                .music-list {
                    padding: 0 20px 16px;
                }
                
                .music-item {
                    display: grid;
                    align-items: center;
                    padding: 8px 0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-radius: 8px;
                    margin: 0 -12px;
                    padding-left: 12px;
                    padding-right: 12px;
                }
                
                .music-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                /* Artist and Album Items */
                .artist-item, .album-item {
                    grid-template-columns: 50px 1fr auto;
                    gap: 12px;
                }
                
                /* Song Items */
                .song-item {
                    grid-template-columns: 24px 40px 1fr auto auto;
                    gap: 12px;
                }
                
                .song-number {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                    text-align: center;
                    font-weight: 500;
                }
                
                .song-item.playing .song-number {
                    color: #ff6b6b;
                }
                
                .playing-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    height: 14px;
                }
                
                .playing-indicator span {
                    width: 2px;
                    background: #ff6b6b;
                    border-radius: 1px;
                    animation: musicBars 1.5s ease-in-out infinite;
                }
                
                .playing-indicator span:nth-child(1) {
                    height: 6px;
                    animation-delay: 0s;
                }
                
                .playing-indicator span:nth-child(2) {
                    height: 10px;
                    animation-delay: 0.2s;
                }
                
                .playing-indicator span:nth-child(3) {
                    height: 4px;
                    animation-delay: 0.4s;
                }
                
                @keyframes musicBars {
                    0%, 100% {
                        transform: scaleY(1);
                    }
                    50% {
                        transform: scaleY(0.3);
                    }
                }
                
                .music-artwork {
                    width: 50px;
                    height: 50px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    backdrop-filter: blur(10px);
                }
                
                .music-artwork.small {
                    width: 40px;
                    height: 40px;
                    border-radius: 6px;
                    font-size: 16px;
                }
                
                .music-artwork img {
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    object-fit: cover;
                }
                
                .artwork-placeholder {
                    filter: grayscale(0.2);
                }
                
                .music-info {
                    overflow: hidden;
                }
                
                .music-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.95);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    margin-bottom: 2px;
                }
                
                .song-item.playing .music-title {
                    color: #ff6b6b;
                }
                
                .music-subtitle {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .song-duration {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 500;
                    min-width: 40px;
                    text-align: right;
                }
                
                .music-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .music-item:hover .music-actions {
                    opacity: 1;
                }
                
                .action-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 6px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 12px;
                    backdrop-filter: blur(10px);
                }
                
                .action-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }
                
                .play-btn {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                    color: white;
                }
                
                .play-btn:hover {
                    background: linear-gradient(135deg, #ff5252, #d84315);
                }
                
                /* Text-to-Speech Styles */
                .tts-container {
                    padding: 24px;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                }
                
                .tts-text-input {
                    margin-bottom: 24px;
                }
                
                .tts-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 8px;
                }
                
                .tts-textarea {
                    width: 100%;
                    padding: 16px;
                    border: none;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 15px;
                    line-height: 1.5;
                    resize: vertical;
                    min-height: 100px;
                    box-sizing: border-box;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }
                
                .tts-textarea::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .tts-textarea:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
                }
                
                .tts-settings {
                    margin-bottom: 24px;
                }
                
                .tts-setting-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                
                .tts-setting-row:last-child {
                    margin-bottom: 0;
                }
                
                .tts-setting-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.8);
                    min-width: 120px;
                }
                
                .tts-select {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 8px;
                    padding: 10px 12px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    min-width: 200px;
                    backdrop-filter: blur(10px);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .tts-select:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
                }
                
                .tts-select option {
                    background: #333;
                    color: white;
                }
                
                .tts-slider-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 200px;
                }
                
                .tts-slider {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(255, 255, 255, 0.2);
                    outline: none;
                    appearance: none;
                    cursor: pointer;
                }
                
                .tts-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ff6b6b;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
                }
                
                .tts-slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ff6b6b;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
                }
                
                .tts-slider-value {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    min-width: 40px;
                    text-align: right;
                }
                
                .tts-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .tts-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                }
                
                .preview-btn {
                    background: rgba(255, 255, 255, 0.15);
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .preview-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-1px);
                }
                
                .speak-btn.primary {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
                }
                
                .speak-btn.primary:hover {
                    background: linear-gradient(135deg, #ff5252, #d84315);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
                }
                
                .btn-icon {
                    font-size: 16px;
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .service-tab {
                        flex-direction: column;
                        gap: 4px;
                        padding: 8px 12px;
                    }
                    
                    .service-label {
                        font-size: 12px;
                    }
                    
                    .tts-setting-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }
                    
                    .tts-select,
                    .tts-slider-container {
                        width: 100%;
                        min-width: auto;
                    }
                    
                    .tts-actions {
                        flex-direction: column;
                    }
                    
                    .song-item {
                        grid-template-columns: 24px 1fr auto;
                        gap: 8px;
                    }
                    
                    .music-artwork.small {
                        display: none;
                    }
                    
                    .song-duration {
                        font-size: 12px;
                    }
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
        const iconSection = this.getIconSectionHTML(item);
        const detailsSection = this.getAccordionDetailsSectionHTML(item);  // ← HIER GEÄNDERT!
        
        return `
            <div class="replace-header">
                <button class="back-button" id="backToSearch">←</button>
                <div class="breadcrumb">
                    ${breadcrumb}
                </div>
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
        
        return `
            <div class="device-icon-large">${item.icon}</div>
            <div class="status-indicator-large ${isActive ? '' : 'off'}">${stateInfo.status}</div>
            <div class="quick-stats">
                ${quickStats.map(stat => `<div class="stat-item">${stat}</div>`).join('')}
            </div>
        `;
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
                // Back Button
                const backButton = this.shadowRoot.getElementById('backToSearch');
                backButton.addEventListener('click', () => this.switchBackToSearch());
                
                // Accordion Headers
                const accordionHeaders = this.shadowRoot.querySelectorAll('.more-info-replace .accordion-header');
                accordionHeaders.forEach(header => {
                    header.addEventListener('click', (e) => {
                        this.toggleAccordion(header);
                    });
                });
                
                // Service Tab Event Listeners - DIESE ZEILE MUSS VORHANDEN SEIN!
                this.setupServiceTabEventListeners(item);  // ← WICHTIG!
                
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
            
                // Text-to-Speech Event Listeners  
                this.setupTextToSpeechEventListeners(item);
            }                


            
            setupMusicAssistantEventListeners(item) {
                const searchInput = this.shadowRoot.querySelector(`[data-ma-search="${item.id}"]`);
                const resultsContainer = this.shadowRoot.getElementById(`ma-results-${item.id}`);
                const enqueueMode = this.shadowRoot.querySelector(`[data-ma-enqueue="${item.id}"]`);
                const filterContainer = this.shadowRoot.getElementById(`ma-filters-${item.id}`);
                
                if (!searchInput || !resultsContainer) return;
                
                let searchTimeout;
                let currentFilter = 'all';
                let currentEnqueueMode = 'replace';
                let lastResults = null;
                
                // Enqueue Mode Toggle
                if (enqueueMode) {
                    const enqueueModes = this.getMusicAssistantEnqueueModes();

                    
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
                            resultsContainer.innerHTML = '<div class="ma-empty-state">Suche läuft...</div>';
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



                setupServiceTabEventListeners(item) {
                    const serviceTabs = this.shadowRoot.querySelectorAll('.more-info-replace .service-tab');
                    const serviceContents = this.shadowRoot.querySelectorAll('.more-info-replace .service-content');
                    
                    serviceTabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            const service = tab.getAttribute('data-service');
                            const cleanId = item.id.replace(/\./g, '_'); // WICHTIG: Punkt ersetzen
                            
                            // Skip if disabled
                            if (tab.disabled) return;
                            
                            // Update tabs
                            serviceTabs.forEach(t => t.classList.remove('active'));
                            tab.classList.add('active');
                            
                            // Update content
                            serviceContents.forEach(content => {
                                content.classList.remove('active');
                            });
                            
                            const targetContent = this.shadowRoot.querySelector(`#${service}-service-${cleanId}`);
                            if (targetContent) {
                                targetContent.classList.add('active');
                            }
                        });
                    });
                }
                    
                    
                setupTextToSpeechEventListeners(item) {
                    const ttsContainer = this.shadowRoot.querySelector(`#tts-service-${item.id}`);
                    if (!ttsContainer) return;
                    
                    // TTS Slider interactions
                    const ttsSliders = ttsContainer.querySelectorAll('.tts-slider');
                    ttsSliders.forEach(slider => {
                        slider.addEventListener('input', function() {
                            const value = this.value;
                            const valueSpan = this.parentNode.querySelector('.tts-slider-value');
                            const setting = this.getAttribute('data-tts-setting');
                            
                            if (setting === 'speed') {
                                valueSpan.textContent = value + 'x';
                            } else if (setting === 'volume') {
                                valueSpan.textContent = value + '%';
                            }
                        });
                    });
                    
                    // TTS Action buttons
                    const ttsActionBtns = ttsContainer.querySelectorAll('.tts-action-btn');
                    ttsActionBtns.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const action = btn.getAttribute('data-tts-action');
                            const originalText = btn.querySelector('.btn-text').textContent;
                            const btnText = btn.querySelector('.btn-text');
                            
                            if (action === 'preview') {
                                btnText.textContent = 'Lädt...';
                                btn.disabled = true;
                                
                                this.previewTextToSpeech(item.id).then(() => {
                                    btnText.textContent = originalText;
                                    btn.disabled = false;
                                }).catch(() => {
                                    btnText.textContent = 'Fehler';
                                    setTimeout(() => {
                                        btnText.textContent = originalText;
                                        btn.disabled = false;
                                    }, 2000);
                                });
                                
                            } else if (action === 'speak') {
                                btnText.textContent = 'Wird gesprochen...';
                                btn.disabled = true;
                                
                                this.executeTextToSpeech(item.id).then(() => {
                                    btnText.textContent = originalText;
                                    btn.disabled = false;
                                }).catch(() => {
                                    btnText.textContent = 'Fehler';
                                    setTimeout(() => {
                                        btnText.textContent = originalText;
                                        btn.disabled = false;
                                    }, 2000);
                                });
                            }
                        });
                    });
                }
                
                async previewTextToSpeech(entityId) {
                    if (!this._hass) return;
                    
                    try {
                        const ttsSettings = this.getTTSSettings(entityId);
                        
                        if (!ttsSettings.text.trim()) {
                            throw new Error('Kein Text eingegeben');
                        }
                        
                        // Preview nur ersten Teil des Textes (max 50 Zeichen)
                        const previewText = ttsSettings.text.substring(0, 50) + (ttsSettings.text.length > 50 ? '...' : '');
                        
                        if (ttsSettings.engine === 'amazon_polly') {
                            await this._hass.callService('tts', 'amazon_polly_say', {
                                entity_id: entityId,
                                message: previewText,
                                options: {
                                    voice: ttsSettings.voice
                                }
                            });
                        } else if (ttsSettings.engine === 'google_translate') {
                            await this._hass.callService('tts', 'google_translate_say', {
                                entity_id: entityId,
                                message: previewText,
                                language: 'de'
                            });
                        }
                        
                        console.log('TTS Preview ausgeführt');
                    } catch (error) {
                        console.error('TTS Preview Fehler:', error);
                        throw error;
                    }
                }
                
                async executeTextToSpeech(entityId) {
                    if (!this._hass) return;
                    
                    try {
                        const ttsSettings = this.getTTSSettings(entityId);
                        
                        if (!ttsSettings.text.trim()) {
                            throw new Error('Kein Text eingegeben');
                        }
                        
                        // Vollständigen Text sprechen
                        if (ttsSettings.engine === 'amazon_polly') {
                            await this._hass.callService('tts', 'amazon_polly_say', {
                                entity_id: entityId,
                                message: ttsSettings.text,
                                options: {
                                    voice: ttsSettings.voice
                                }
                            });
                        } else if (ttsSettings.engine === 'google_translate') {
                            await this._hass.callService('tts', 'google_translate_say', {
                                entity_id: entityId,
                                message: ttsSettings.text,
                                language: 'de'
                            });
                        }
                        
                        console.log('TTS ausgeführt:', ttsSettings);
                    } catch (error) {
                        console.error('TTS Fehler:', error);
                        throw error;
                    }
                }
                
                getTTSSettings(entityId) {
                    const ttsContainer = this.shadowRoot.querySelector(`#tts-service-${entityId}`);
                    if (!ttsContainer) return {};
                    
                    return {
                        text: ttsContainer.querySelector('.tts-textarea').value,
                        engine: ttsContainer.querySelector('[data-tts-setting="engine"]').value,
                        voice: ttsContainer.querySelector('[data-tts-setting="voice"]').value,
                        speed: parseFloat(ttsContainer.querySelector('[data-tts-setting="speed"]').value),
                        volume: parseInt(ttsContainer.querySelector('[data-tts-setting="volume"]').value)
                    };
                }


    
                // Komplett neue displayMusicAssistantResults Funktion:
                                
                displayMusicAssistantResults(results, container, entityId, activeFilter = 'all', enqueueMode = 'replace') {
                    if (!results || Object.keys(results).length === 0) {
                        container.innerHTML = '<div class="ma-empty-state">Keine Ergebnisse gefunden</div>';
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
                        container.innerHTML = '<div class="ma-empty-state">Keine Ergebnisse in dieser Kategorie</div>';
                        return;
                    }
                    
                    // Display results in Apple Music style
                    categoryOrder.forEach(type => {
                        const items = filteredResults[type];
                        if (!items || items.length === 0) return;
                        
                        const categoryName = this.getMusicAssistantCategoryName(type);
                        const isTrackType = type === 'tracks';
                        
                        html += `
                            <div class="music-section">
                                <div class="section-header" data-category="${type}">
                                    <h3 class="section-title">${categoryName}</h3>
                                    <span class="section-count">${items.length} Ergebnisse</span>
                                </div>
                                
                                <div class="music-list">
                        `;
                        
                        const displayItems = activeFilter === 'all' ? items.slice(0, 5) : items;
                        
                        if (isTrackType) {
                            // Song list style for tracks
                            displayItems.forEach((item, index) => {
                                const artistText = item.artists ? item.artists.map(a => a.name).join(', ') : '';
                                const imageUrl = item.image || (item.album ? item.album.image : '');
                                const duration = this.formatDuration(item.duration || 0);
                                
                                html += `
                                    <div class="music-item song-item" data-uri="${item.uri}" data-type="${item.media_type}" data-name="${item.name}">
                                        <div class="song-number">${index + 1}</div>
                                        <div class="music-artwork small">
                                            ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" />` : '<div class="artwork-placeholder">🎵</div>'}
                                        </div>
                                        <div class="music-info">
                                            <div class="music-title">${item.name}</div>
                                            <div class="music-subtitle">${artistText}${item.album ? ' • ' + item.album.name : ''}</div>
                                        </div>
                                        <div class="song-duration">${duration}</div>
                                        <div class="music-actions">
                                            <button class="action-btn play-btn">▶️</button>
                                            <button class="action-btn more-btn">⋯</button>
                                        </div>
                                    </div>
                                `;
                            });
                        } else {
                            // Artist/Album/Playlist style
                            displayItems.forEach(item => {
                                const artistText = item.artists ? item.artists.map(a => a.name).join(', ') : '';
                                const imageUrl = item.image;
                                const defaultIcon = this.getDefaultIcon(type);
                                const subtitle = this.getItemSubtitle(item, type);
                                
                                html += `
                                    <div class="music-item ${type.slice(0, -1)}-item" data-uri="${item.uri}" data-type="${item.media_type}" data-name="${item.name}">
                                        <div class="music-artwork">
                                            ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" />` : `<div class="artwork-placeholder">${defaultIcon}</div>`}
                                        </div>
                                        <div class="music-info">
                                            <div class="music-title">${item.name}</div>
                                            <div class="music-subtitle">${subtitle}</div>
                                        </div>
                                        <div class="music-actions">
                                            <button class="action-btn play-btn">▶️</button>
                                            <button class="action-btn more-btn">⋯</button>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        
                        html += `
                                </div>
                            </div>
                        `;
                    });
                    
                    container.innerHTML = html;
                    
                    // Event Listeners für Items
                    container.querySelectorAll('.music-item').forEach(itemElement => {
                        itemElement.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            
                            // Don't trigger if clicking on action buttons
                            if (e.target.closest('.action-btn')) return;
                            
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
                    
                    // Action button event listeners
                    container.querySelectorAll('.action-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            
                            const musicItem = btn.closest('.music-item');
                            const uri = musicItem.getAttribute('data-uri');
                            const mediaType = musicItem.getAttribute('data-type');
                            const name = musicItem.getAttribute('data-name');
                            
                            if (btn.classList.contains('play-btn')) {
                                // Handle play button click
                                if (musicItem.classList.contains('song-item')) {
                                    // Toggle play/pause for songs
                                    if (musicItem.classList.contains('playing')) {
                                        musicItem.classList.remove('playing');
                                        btn.textContent = '▶️';
                                        // Stop playback
                                    } else {
                                        // Remove playing from other songs
                                        container.querySelectorAll('.song-item.playing').forEach(item => {
                                            item.classList.remove('playing');
                                            item.querySelector('.play-btn').textContent = '▶️';
                                        });
                                        
                                        musicItem.classList.add('playing');
                                        btn.textContent = '⏸️';
                                        
                                        // Start playback
                                        await this.playMusicAssistantItem({
                                            uri: uri,
                                            media_type: mediaType,
                                            name: name
                                        }, entityId, enqueueMode);
                                    }
                                } else {
                                    // For artists, albums, playlists - just play
                                    await this.playMusicAssistantItem({
                                        uri: uri,
                                        media_type: mediaType,
                                        name: name
                                    }, entityId, enqueueMode);
                                }
                            } else if (btn.classList.contains('more-btn')) {
                                // Handle more button click - could show context menu
                                console.log('More options for:', name);
                            }
                            
                            // Visual feedback
                            btn.style.transform = 'scale(0.95)';
                            setTimeout(() => {
                                btn.style.transform = 'scale(1.05)';
                                setTimeout(() => {
                                    btn.style.transform = '';
                                }, 100);
                            }, 100);
                        });
                    });
                }
                
                // Hilfsfunktionen hinzufügen:
                
                formatDuration(seconds) {
                    if (!seconds || seconds === 0) return '--:--';
                    
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = seconds % 60;
                    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                }
                
                getDefaultIcon(type) {
                    const icons = {
                        'artists': '👤',
                        'albums': '💿',
                        'playlists': '📋',
                        'radio': '📻',
                        'tracks': '🎵'
                    };
                    return icons[type] || '🎵';
                }
                
                getItemSubtitle(item, type) {
                    switch (type) {
                        case 'artists':
                            const genres = item.genres ? item.genres.join(', ') : '';
                            return `Künstler${genres ? ' • ' + genres : ''}`;
                            
                        case 'albums':
                            const artist = item.artists ? item.artists.map(a => a.name).join(', ') : '';
                            const year = item.year ? ` • ${item.year}` : '';
                            return `Album${artist ? ' • ' + artist : ''}${year}`;
                            
                        case 'playlists':
                            const trackCount = item.track_count ? ` • ${item.track_count} Titel` : '';
                            return `Playlist${trackCount}`;
                            
                        case 'radio':
                            return 'Radio Station';
                            
                        default:
                            return '';
                    }
                }
                
                // Enqueue Mode Text anpassen (da "Play now" entfernt wurde):
                getMusicAssistantEnqueueModes() {
                    return [
                        { key: 'replace', icon: '🔄', text: 'Replace queue' },
                        { key: 'next', icon: '⏭️', text: 'Add next' },
                        { key: 'add', icon: '➕', text: 'Add to queue' }
                    ];
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
                    stats.push(`${item.position || 0}% Position`);
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
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">💡 Steuerung</h3>
                <div class="main-control-large">
                    <button class="toggle-button-large ${isOn ? '' : 'off'}" data-action="toggle">
                        ${isOn ? '🔆 Ausschalten' : '💡 Einschalten'}
                    </button>
                </div>
                ${isOn ? `
                    <div class="brightness-control-large">
                        <div class="slider-label-large">
                            <span>Helligkeit</span>
                            <span class="value">${brightness}%</span>
                        </div>
                        <input type="range" class="slider-large" data-control="brightness" 
                               min="1" max="100" value="${brightness}">
                    </div>
                ` : ''}
            </div>
        `;
    }

    getBasicReplaceControls(item) {
        const isOn = item.state === 'on';
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">🔌 Steuerung</h3>
                <div class="main-control-large">
                    <button class="toggle-button-large ${isOn ? '' : 'off'}" data-action="toggle">
                        ${isOn ? '⏹️ Ausschalten' : '▶️ Einschalten'}
                    </button>
                </div>
            </div>
        `;
    }

    getClimateReplaceControls(item) {
        const currentTemp = item.current_temperature || '--';
        const targetTemp = item.target_temperature || 20;
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">🌡️ Temperaturregelung</h3>
                <div class="slider-control-large">
                    <div class="slider-label-large">
                        <span>Zieltemperatur</span>
                        <span class="value">${targetTemp}°C</span>
                    </div>
                    <input type="range" class="slider-large" data-control="temperature" 
                           min="10" max="30" step="0.5" value="${targetTemp}">
                </div>
                <div class="main-control-large" style="margin-top: 16px;">
                    <button class="toggle-button-large" data-action="heat">🔥 Heizen</button>
                    <button class="toggle-button-large" data-action="cool">❄️ Kühlen</button>
                    <button class="toggle-button-large off" data-action="off">⏹️ Aus</button>
                </div>
            </div>
        `;
    }

    getCoverReplaceControls(item) {
        const position = item.position || 0;
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">🪟 Rollladensteuerung</h3>
                <div class="main-control-large">
                    <button class="toggle-button-large" data-action="open">⬆️ Öffnen</button>
                    <button class="toggle-button-large off" data-action="stop">⏹️ Stopp</button>
                    <button class="toggle-button-large" data-action="close">⬇️ Schließen</button>
                </div>
                <div class="slider-control-large">
                    <div class="slider-label-large">
                        <span>Position</span>
                        <span class="value">${position}%</span>
                    </div>
                    <input type="range" class="slider-large" data-control="position" 
                           min="0" max="100" value="${position}">
                </div>
            </div>
        `;
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

        
    
        
    getMediaReplaceControls(item) {
        const volume = item.volume || 0;
        const isPlaying = item.state === 'playing';
        
        // Prüfe ob Music Assistant verfügbar ist
        const hasMusicAssistant = this.checkMusicAssistantAvailability();
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">📺 Mediensteuerung</h3>
                <div class="main-control-large">
                    <button class="toggle-button-large" data-action="play_pause">
                        ${isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                    <button class="toggle-button-large secondary" data-action="previous">⏮️</button>
                    <button class="toggle-button-large secondary" data-action="next">⏭️</button>
                </div>
                <div class="slider-control-large">
                    <div class="slider-label-large">
                        <span>Lautstärke</span>
                        <span class="value">${volume}%</span>
                    </div>
                    <input type="range" class="slider-large" data-control="volume" 
                           min="0" max="100" value="${volume}">
                </div>
                
                <!-- Media Service Selector -->
                <div class="media-service-selector">
                    <div class="service-tabs">
                        <button class="service-tab ${hasMusicAssistant ? 'active' : ''}" data-service="music" ${!hasMusicAssistant ? 'disabled' : ''}>
                            <span class="service-icon">🎵</span>
                            <span class="service-label">Music Assistant</span>
                        </button>
                        <button class="service-tab ${!hasMusicAssistant ? 'active' : ''}" data-service="tts">
                            <span class="service-icon">🗣️</span>
                            <span class="service-label">Text-to-Speech</span>
                        </button>
                    </div>
                </div>
                
                <!-- Music Assistant Service -->
                <div class="service-content ${hasMusicAssistant ? 'active' : ''}" id="music-service-${item.id}">
                    ${hasMusicAssistant ? this.getMusicAssistantHTML(item) : '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.6);">Music Assistant nicht verfügbar</div>'}
                </div>
                
                <!-- Text-to-Speech Service -->
                <div class="service-content ${!hasMusicAssistant ? 'active' : ''}" id="tts-service-${item.id}">
                    ${this.getTextToSpeechHTML(item)}
                </div>
            </div>
        `;
    }

    getMusicAssistantHTML(item) {
        const cleanId = item.id.replace(/\./g, '_'); // Punkt durch Unterstrich ersetzen
        const filterOptions = [
            { key: 'all', icon: '🎵', text: 'Alle' },
            { key: 'artists', icon: '👤', text: 'Künstler' },
            { key: 'albums', icon: '💿', text: 'Alben' },
            { key: 'tracks', icon: '🎵', text: 'Titel' },
            { key: 'playlists', icon: '📋', text: 'Playlists' },
            { key: 'radio', icon: '📻', text: 'Radio' }
        ];
    
        return `
            <div class="music-assistant-search">
                <div class="ma-search-container">
                    <div class="ma-search-bar-container">
                        <input type="text" class="ma-search-input" placeholder="Musik suchen..." data-ma-search="${cleanId}">
                        
                        <div class="ma-enqueue-mode" data-ma-enqueue="${cleanId}">
                            <span class="ma-enqueue-icon">🔄</span>
                            <span class="ma-enqueue-text">Replace queue</span>
                        </div>
                    </div>
                    
                    <div class="ma-filter-container" id="ma-filters-${cleanId}">
                        ${filterOptions.map(filter => `
                            <div class="ma-filter-chip ${filter.key === 'all' ? 'ma-filter-active' : ''}" data-filter="${filter.key}">
                                <span class="ma-filter-icon">${filter.icon}</span>
                                <span>${filter.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="apple-music-style">
                    <div class="ma-search-results" id="ma-results-${cleanId}">
                        <div class="ma-empty-state">Geben Sie einen Suchbegriff ein...</div>
                    </div>
                </div>
            </div>
        `;
    }
        

    getTextToSpeechHTML(item) {
        const cleanId = item.id.replace(/\./g, '_'); // Punkt durch Unterstrich ersetzen
        const availableVoices = this.getAvailableTTSVoices();
        const availableEngines = this.getAvailableTTSEngines();
    
        return `
            <div class="tts-container">
                <div class="tts-text-input">
                    <label class="tts-label" for="tts-text-${cleanId}">Text zum Sprechen:</label>
                    <textarea class="tts-textarea" id="tts-text-${cleanId}" 
                              placeholder="Geben Sie den Text ein, der gesprochen werden soll..."></textarea>
                </div>
                
                <div class="tts-settings">
                    <div class="tts-setting-row">
                        <label class="tts-setting-label">Engine:</label>
                        <select class="tts-select" data-tts-setting="engine">
                            ${availableEngines.map(engine => `
                                <option value="${engine.key}" ${engine.default ? 'selected' : ''}>${engine.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="tts-setting-row">
                        <label class="tts-setting-label">Stimme:</label>
                        <select class="tts-select" data-tts-setting="voice">
                            ${availableVoices.map(voice => `
                                <option value="${voice.key}" ${voice.default ? 'selected' : ''}>${voice.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="tts-setting-row">
                        <label class="tts-setting-label">Geschwindigkeit:</label>
                        <div class="tts-slider-container">
                            <input type="range" class="tts-slider" data-tts-setting="speed" 
                                   min="0.5" max="2.0" step="0.1" value="1.0">
                            <span class="tts-slider-value">1.0x</span>
                        </div>
                    </div>
                    
                    <div class="tts-setting-row">
                        <label class="tts-setting-label">Lautstärke:</label>
                        <div class="tts-slider-container">
                            <input type="range" class="tts-slider" data-tts-setting="volume" 
                                   min="0" max="100" step="5" value="80">
                            <span class="tts-slider-value">80%</span>
                        </div>
                    </div>
                </div>
                
                <div class="tts-actions">
                    <button class="tts-action-btn preview-btn" data-tts-action="preview">
                        <span class="btn-icon">👂</span>
                        <span class="btn-text">Vorschau</span>
                    </button>
                    <button class="tts-action-btn speak-btn primary" data-tts-action="speak">
                        <span class="btn-icon">🗣️</span>
                        <span class="btn-text">Sprechen</span>
                    </button>
                </div>
            </div>
        `;
    }        
    
    getAvailableTTSEngines() {
        // Standard TTS Engines - könnten später dynamisch ermittelt werden
        return [
            { key: 'google_translate', name: 'Google Translate', default: true },
            { key: 'amazon_polly', name: 'Amazon Polly', default: false },
            { key: 'microsoft', name: 'Microsoft', default: false }
        ];
    }
    
    getAvailableTTSVoices() {
        // Standard deutsche Stimmen - könnten später dynamisch ermittelt werden
        return [
            { key: 'de-DE-Standard-A', name: 'Deutsch (Standard A)', default: true },
            { key: 'de-DE-Standard-B', name: 'Deutsch (Standard B)', default: false },
            { key: 'de-DE-Wavenet-A', name: 'Deutsch (Wavenet A)', default: false },
            { key: 'de-DE-Wavenet-B', name: 'Deutsch (Wavenet B)', default: false }
        ];
    }

    

    getNonEntityReplaceControls(item) {
        switch (item.itemType) {
            case 'automation':
                return `
                    <div class="control-group-large">
                        <h3 class="control-title-large">🤖 Automation Steuerung</h3>
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
                        <h3 class="control-title-large">📜 Skript Steuerung</h3>
                        <div class="main-control-large">
                            <button class="toggle-button-large" data-action="run">▶️ Skript ausführen</button>
                        </div>
                    </div>
                `;
            case 'scene':
                return `
                    <div class="control-group-large">
                        <h3 class="control-title-large">🎭 Szene Steuerung</h3>
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
        
        // Logbook aktualisieren - NEU!
        this.updateLogEntries(item);
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
                return ['light', 'switch', 'fan'].includes(item.type) && item.state === 'on' ||
                       item.type === 'media_player' && item.state === 'playing' ||
                       item.type === 'cover' && item.state === 'open';
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
                } else if (item.type === 'media_player') {
                    const playPauseSymbol = item.state === 'playing' ? '⏸' : '▶';
                    return `<div class="grid-action-button primary" data-action="play_pause">${playPauseSymbol}</div>`;
                } else if (item.type === 'cover') {
                    const isOpen = item.state === 'open';
                    const toggleSymbol = isOpen ? '⬇' : '⬆';
                    return `<div class="grid-action-button primary" data-action="${isOpen ? 'close' : 'open'}">${toggleSymbol}</div>`;
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
                } else if (item.type === 'media_player') {
                    const playPauseText = item.state === 'playing' ? 'Pause' : 'Play';
                    return `<div class="action-buttons"><div class="action-button primary" data-action="play_pause">${playPauseText}</div></div>`;
                } else if (item.type === 'cover') {
                    const isOpen = item.state === 'open';
                    const toggleText = isOpen ? 'Schließen' : 'Öffnen';
                    return `<div class="action-buttons"><div class="action-button primary" data-action="${isOpen ? 'close' : 'open'}">${toggleText}</div></div>`;
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
        
        return `
            <div class="more-info-dialog">
                <div class="more-info-header">
                    <div class="more-info-icon">${item.icon}</div>
                    <div class="more-info-title">
                        <h2 class="more-info-name">${item.name}</h2>
                        <p class="more-info-type">${this.getTypeDisplayName(item)} • ${item.room}</p>
                    </div>
                    <button class="more-info-close">×</button>
                </div>
                
                <div class="more-info-content">
                    ${stateInfo}
                    ${controls}
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
                <h3 class="section-title">📺 Mediensteuerung</h3>
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
        
        // Dialog-Inhalt neu erstellen
        const dialog = this.shadowRoot.querySelector('.more-info-dialog .more-info-content');
        if (dialog) {
            const stateInfo = this.getStateInfo(item);
            const controls = this.getControlsHTML(item);
            const attributes = this.getAttributesHTML(item);
            
            dialog.innerHTML = stateInfo + controls + attributes;
            this.setupMoreInfoControls(this.shadowRoot.querySelector('.more-info-overlay'), item);
        }
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
                return {
                    value: item.current_temperature || '--',
                    unit: '°C',
                    status: `Ziel: ${item.target_temperature || '--'}°C`
                };
                
            case 'sensor':
                return {
                    value: item.state,
                    unit: item.attributes.unit_of_measurement || '',
                    status: 'Sensor'
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
            show_attributes: true,
            show_controls: true,
            show_history: false,
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
