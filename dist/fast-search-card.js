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

                .search-header {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 12px;
                    justify-content: space-between;
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
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
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
                }

                .item:hover {
                    background-color: #fafafa;
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

                /* Transition Animations für Replace Mode */
                .search-container.slide-out-left {
                    animation: slideOutLeft 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
                }

                .search-container.slide-in-left {
                    animation: slideInLeft 0.25s cubic-bezier(0.0, 0.0, 0.2, 1) 0.1s forwards;
                }

                .more-info-replace.slide-in-right {
                    animation: slideInRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) 0.15s forwards;
                }

                .more-info-replace.slide-out-right {
                    animation: slideOutRight 0.25s cubic-bezier(0.0, 0.0, 0.2, 1) forwards;
                }

                /* Push Transition */
                .search-container.push-left {
                    animation: pushLeft 0.35s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
                }

                .search-container.push-in-right {
                    animation: pushInRight 0.35s cubic-bezier(0.0, 0.0, 0.2, 1) forwards;
                }

                .more-info-replace.push-in-left {
                    animation: pushInLeft 0.35s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
                }

                .more-info-replace.push-out-right {
                    animation: pushOutRight 0.35s cubic-bezier(0.0, 0.0, 0.2, 1) forwards;
                }

                /* Keyframes für Slide Transition */
                @keyframes slideOutLeft {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                }

                @keyframes slideInLeft {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }

                /* Keyframes für Push Transition */
                @keyframes pushLeft {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-100%);
                    }
                }

                @keyframes pushInRight {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes pushInLeft {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes pushOutRight {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(100%);
                    }
                }
                
            </style>
            
            <div class="search-container">
                <div class="search-section">
                    <div class="search-header">
                        <select class="search-type-dropdown" id="searchTypeDropdown">
                            <option value="entities">🏠 Geräte</option>
                            <option value="automations">🤖 Automationen</option>
                            <option value="scripts">📜 Skripte</option>
                            <option value="scenes">🎭 Szenen</option>
                        </select>
                        
                        <div class="view-toggle">
                            <button class="view-toggle-btn active" id="listViewBtn" data-view="list">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                                </svg>
                            </button>
                            <button class="view-toggle-btn" id="gridViewBtn" data-view="grid">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
                                </svg>
                            </button>
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
        const detailsSection = this.getDetailsSectionHTML(item);
        
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

    setupReplaceEventListeners(item) {
        // Back Button
        const backButton = this.shadowRoot.getElementById('backToSearch');
        backButton.addEventListener('click', () => this.switchBackToSearch());
        
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

    getMediaReplaceControls(item) {
        const volume = item.volume || 0;
        const isPlaying = item.state === 'playing';
        
        return `
            <div class="control-group-large">
                <h3 class="control-title-large">📺 Mediensteuerung</h3>
                <div class="main-control-large">
                    <button class="toggle-button-large" data-action="play_pause">
                        ${isPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                    <button class="toggle-button-large off" data-action="previous">⏮️</button>
                    <button class="toggle-button-large off" data-action="next">⏭️</button>
                </div>
                <div class="slider-control-large">
                    <div class="slider-label-large">
                        <span>Lautstärke</span>
                        <span class="value">${volume}%</span>
                    </div>
                    <input type="range" class="slider-large" data-control="volume" 
                           min="0" max="100" value="${volume}">
                </div>
            </div>
        `;
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
        this.searchTypeDropdown = this.shadowRoot.getElementById('searchTypeDropdown');
        this.resultsContainer = this.shadowRoot.getElementById('resultsContainer');
        this.noResults = this.shadowRoot.getElementById('noResults');
        this.filterLabel = this.shadowRoot.getElementById('filterLabel');
        this.typingIndicator = this.shadowRoot.getElementById('typingIndicator');

        this.searchInput.addEventListener('input', () => this.handleSearchInput());
        this.searchTypeDropdown.addEventListener('change', () => this.onSearchTypeChange());
        
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
        this.currentSearchType = this.searchTypeDropdown.value;
        this.selectedRooms.clear();
        this.selectedType = '';
        this.isInitialized = false; // Reset bei Typ-Änderung
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

    showLoadingDots(text) {
        return `${text}<span class="loading-dots"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></span>`;
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
        const rooms = [...new Set(this.allItems.map(d => d.room))].sort();
        this.setupRoomChips(rooms);
        
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
        const roomChips = this.shadowRoot.getElementById('roomChipsInSearch');
        
        // Aktuellen Zustand speichern
        const currentActiveRooms = Array.from(roomChips.querySelectorAll('.room-chip-small.active'))
            .map(chip => chip.getAttribute('data-value'));
        
        // Nur neue Chips hinzufügen, vorhandene nicht entfernen
        const existingRoomValues = Array.from(roomChips.querySelectorAll('.room-chip-small'))
            .map(chip => chip.getAttribute('data-value'));
        
        rooms.forEach((room, index) => {
            if (!existingRoomValues.includes(room)) {
                const chip = document.createElement('div');
                chip.className = 'room-chip-small';
                chip.setAttribute('data-value', room);
                chip.textContent = room;
                
                // Zustand wiederherstellen
                if (currentActiveRooms.includes(room)) {
                    chip.classList.add('active');
                }
                
                // Stagger-Animation für neue Room-Chips
                chip.style.animationDelay = `${index * 0.05}s`;
                
                roomChips.appendChild(chip);
            }
        });
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
                    <div class="chip-icon">${icon}</div>
                    <div class="chip-content">
                        <div class="chip-type-name">${config.categoryNames[category] || category}</div>
                        <div class="chip-count">${stats}</div>
                    </div>
                `;
                
                // Stagger-Animation für neue Chips
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
