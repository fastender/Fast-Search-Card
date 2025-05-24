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

                /* More-Info Modal */
                .more-info-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .more-info-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                .more-info-modal {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 450px;
                    width: 90vw;
                    max-height: 80vh;
                    overflow-y: auto;
                    transform: scale(0.8) translateY(20px);
                    transition: transform 0.3s ease;
                    position: relative;
                }

                .more-info-overlay.active .more-info-modal {
                    transform: scale(1) translateY(0);
                }

                .more-info-header {
                    padding: 24px 24px 16px 24px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .more-info-icon {
                    font-size: 32px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border-radius: 12px;
                    flex-shrink: 0;
                }

                .more-info-title {
                    flex: 1;
                }

                .more-info-name {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    margin: 0 0 4px 0;
                }

                .more-info-entity-id {
                    font-size: 14px;
                    color: #666;
                    font-family: 'Monaco', 'Consolas', monospace;
                }

                .more-info-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    color: #666;
                    transition: all 0.2s;
                }

                .more-info-close:hover {
                    background: #f5f5f5;
                    color: #333;
                }

                .more-info-content {
                    padding: 20px 24px 24px 24px;
                }

                .more-info-section {
                    margin-bottom: 24px;
                }

                .more-info-section:last-child {
                    margin-bottom: 0;
                }

                .more-info-section-title {
                    font-weight: 600;
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .more-info-state-card {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }

                .more-info-state-info {
                    flex: 1;
                }

                .more-info-state-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 4px;
                }

                .more-info-state-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                }

                .more-info-controls {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .more-info-control-btn {
                    padding: 12px 20px;
                    background: #007aff;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex: 1;
                    min-width: 100px;
                }

                .more-info-control-btn:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                }

                .more-info-control-btn.secondary {
                    background: #f8f9fa;
                    color: #666;
                    border: 1px solid #e9ecef;
                }

                .more-info-control-btn.secondary:hover {
                    background: #e9ecef;
                    color: #333;
                }

                .more-info-attributes {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 16px;
                }

                .more-info-attribute {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e9ecef;
                }

                .more-info-attribute:last-child {
                    border-bottom: none;
                }

                .more-info-attr-key {
                    font-size: 14px;
                    color: #666;
                    font-weight: 500;
                }

                .more-info-attr-value {
                    font-size: 14px;
                    color: #333;
                    text-align: right;
                    max-width: 60%;
                    word-break: break-word;
                }

                .more-info-history {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }

                /* Slider Controls */
                .more-info-slider {
                    width: 100%;
                    margin: 12px 0;
                }

                .more-info-slider input[type="range"] {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #e9ecef;
                    outline: none;
                    appearance: none;
                }

                .more-info-slider input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007aff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                }

                .more-info-slider input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #007aff;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                }

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
                
                <!-- More Info Modal -->
                <div class="more-info-overlay" id="moreInfoOverlay">
                    <div class="more-info-modal" id="moreInfoModal">
                        <div class="more-info-header">
                            <div class="more-info-icon" id="moreInfoIcon">💡</div>
                            <div class="more-info-title">
                                <h3 class="more-info-name" id="moreInfoName">Gerätename</h3>
                                <div class="more-info-entity-id" id="moreInfoEntityId">entity.id</div>
                            </div>
                            <button class="more-info-close" id="moreInfoClose">✕</button>
                        </div>
                        <div class="more-info-content" id="moreInfoContent">
                            <!-- Content wird dynamisch geladen -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeCard();
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
        
        // More Info Modal Event Listeners
        this.shadowRoot.getElementById('moreInfoClose').addEventListener('click', () => this.closeMoreInfo());
        this.shadowRoot.getElementById('moreInfoOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'moreInfoOverlay') {
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

    handleItemClick(item, event) {
        // Event delegation für Action Buttons
        event.stopPropagation();
        
        if (event.target.classList.contains('action-button') || event.target.classList.contains('grid-action-button')) {
            const action = event.target.getAttribute('data-action');
            this.executeAction(item, action);
            return;
        }
        
        // More Info Modal öffnen beim Klick auf das Item selbst
        this.openMoreInfo(item);
    }

    openMoreInfo(item) {
        const overlay = this.shadowRoot.getElementById('moreInfoOverlay');
        const modal = this.shadowRoot.getElementById('moreInfoModal');
        const icon = this.shadowRoot.getElementById('moreInfoIcon');
        const name = this.shadowRoot.getElementById('moreInfoName');
        const entityId = this.shadowRoot.getElementById('moreInfoEntityId');
        const content = this.shadowRoot.getElementById('moreInfoContent');

        // Header setzen
        icon.textContent = item.icon;
        name.textContent = item.name;
        entityId.textContent = item.id;

        // Content generieren
        content.innerHTML = this.generateMoreInfoContent(item);

        // Modal anzeigen
        overlay.classList.add('active');
        
        // Event Listeners für dynamische Controls
        this.setupMoreInfoControls(item);
    }

    closeMoreInfo() {
        const overlay = this.shadowRoot.getElementById('moreInfoOverlay');
        overlay.classList.remove('active');
    }

    generateMoreInfoContent(item) {
        let content = '';

        // Status Sektion
        content += `
            <div class="more-info-section">
                <div class="more-info-section-title">
                    <span>📊</span> Aktueller Status
                </div>
                <div class="more-info-state-card">
                    <div class="more-info-state-info">
                        <div class="more-info-state-label">Zustand</div>
                        <div class="more-info-state-value">${this.getStateText(item)}</div>
                    </div>
                </div>
            </div>
        `;

        // Steuerung Sektion (je nach Gerätetyp)
        const controls = this.generateDeviceControls(item);
        if (controls) {
            content += `
                <div class="more-info-section">
                    <div class="more-info-section-title">
                        <span>🎛️</span> Steuerung
                    </div>
                    ${controls}
                </div>
            `;
        }

        // Attribute Sektion
        const attributes = this.generateAttributesSection(item);
        if (attributes) {
            content += `
                <div class="more-info-section">
                    <div class="more-info-section-title">
                        <span>ℹ️</span> Eigenschaften
                    </div>
                    ${attributes}
                </div>
            `;
        }

        // Historie Placeholder
        content += `
            <div class="more-info-section">
                <div class="more-info-section-title">
                    <span>📈</span> Historie
                </div>
                <div class="more-info-history">
                    Verlaufsdaten werden hier angezeigt<br>
                    <small>Letzte Änderung: ${item.attributes.last_changed ? new Date(item.attributes.last_changed).toLocaleString('de-DE') : 'Unbekannt'}</small>
                </div>
            </div>
        `;

        return content;
    }

    generateDeviceControls(item) {
        let controls = '';

        switch (item.type) {
            case 'light':
                controls = `
                    <div class="more-info-controls">
                        <button class="more-info-control-btn" data-action="toggle" data-item-id="${item.id}">
                            ${item.state === 'on' ? '💡 Ausschalten' : '💡 Einschalten'}
                        </button>
                    </div>
                `;
                
                if (item.state === 'on' && item.attributes.brightness !== undefined) {
                    const brightness = Math.round((item.attributes.brightness || 0) / 255 * 100);
                    controls += `
                        <div class="more-info-slider">
                            <label class="more-info-state-label">Helligkeit: <span id="brightnessValue">${brightness}%</span></label>
                            <input type="range" min="0" max="100" value="${brightness}" 
                                   data-action="brightness" data-item-id="${item.id}" id="brightnessSlider">
                        </div>
                    `;
                }
                break;

            case 'switch':
                controls = `
                    <div class="more-info-controls">
                        <button class="more-info-control-btn" data-action="toggle" data-item-id="${item.id}">
                            ${item.state === 'on' ? '🔌 Ausschalten' : '🔌 Einschalten'}
                        </button>
                    </div>
                `;
                break;

            case 'climate':
                const currentTemp = item.attributes.current_temperature || '--';
                const targetTemp = item.attributes.temperature || 20;
                controls = `
                    <div class="more-info-state-card">
                        <div class="more-info-state-info">
                            <div class="more-info-state-label">Zieltemperatur</div>
                            <div class="more-info-state-value">${targetTemp}°C</div>
                        </div>
                    </div>
                    <div class="more-info-slider">
                        <label class="more-info-state-label">Temperatur: <span id="tempValue">${targetTemp}°C</span></label>
                        <input type="range" min="10" max="30" value="${targetTemp}" 
                               data-action="temperature" data-item-id="${item.id}" id="temperatureSlider">
                    </div>
                    <div class="more-info-controls">
                        <button class="more-info-control-btn secondary" data-action="hvac_mode" data-mode="off" data-item-id="${item.id}">Aus</button>
                        <button class="more-info-control-btn" data-action="hvac_mode" data-mode="heat" data-item-id="${item.id}">Heizen</button>
                        <button class="more-info-control-btn" data-action="hvac_mode" data-mode="cool" data-item-id="${item.id}">Kühlen</button>
                    </div>
                `;
                break;

            case 'cover':
                const position = item.attributes.current_position || 0;
                controls = `
                    <div class="more-info-slider">
                        <label class="more-info-state-label">Position: <span id="positionValue">${position}%</span></label>
                        <input type="range" min="0" max="100" value="${position}" 
                               data-action="position" data-item-id="${item.id}" id="positionSlider">
                    </div>
                    <div class="more-info-controls">
                        <button class="more-info-control-btn" data-action="open_cover" data-item-id="${item.id}">🔼 Öffnen</button>
                        <button class="more-info-control-btn secondary" data-action="stop_cover" data-item-id="${item.id}">⏸️ Stopp</button>
                        <button class="more-info-control-btn" data-action="close_cover" data-item-id="${item.id}">🔽 Schließen</button>
                    </div>
                `;
                break;

            case 'fan':
                controls = `
                    <div class="more-info-controls">
                        <button class="more-info-control-btn" data-action="toggle" data-item-id="${item.id}">
                            ${item.state === 'on' ? '🌀 Ausschalten' : '🌀 Einschalten'}
                        </button>
                    </div>
                `;
                break;

            case 'media_player':
                controls = `
                    <div class="more-info-controls">
                        <button class="more-info-control-btn" data-action="media_play_pause" data-item-id="${item.id}">
                            ${item.state === 'playing' ? '⏸️ Pause' : '▶️ Play'}
                        </button>
                        <button class="more-info-control-btn secondary" data-action="media_stop" data-item-id="${item.id}">⏹️ Stop</button>
                    </div>
                `;
                break;

            default:
                if (item.itemType === 'automation') {
                    controls = `
                        <div class="more-info-controls">
                            <button class="more-info-control-btn" data-action="trigger" data-item-id="${item.id}">🚀 Ausführen</button>
                            <button class="more-info-control-btn secondary" data-action="toggle" data-item-id="${item.id}">
                                ${item.state === 'on' ? '⏸️ Deaktivieren' : '▶️ Aktivieren'}
                            </button>
                        </div>
                    `;
                } else if (item.itemType === 'script') {
                    controls = `
                        <div class="more-info-controls">
                            <button class="more-info-control-btn" data-action="run" data-item-id="${item.id}">▶️ Ausführen</button>
                        </div>
                    `;
                } else if (item.itemType === 'scene') {
                    controls = `
                        <div class="more-info-controls">
                            <button class="more-info-control-btn" data-action="activate" data-item-id="${item.id}">🎬 Aktivieren</button>
                        </div>
                    `;
                }
                break;
        }

        return controls;
    }

    generateAttributesSection(item) {
        const importantAttributes = [
            'friendly_name', 'device_class', 'unit_of_measurement', 
            'battery_level', 'temperature', 'humidity', 'brightness',
            'rgb_color', 'hvac_mode', 'fan_mode', 'room', 'area_id'
        ];

        let attributesHtml = '<div class="more-info-attributes">';
        let hasAttributes = false;

        // Wichtige Attribute zuerst
        importantAttributes.forEach(key => {
            if (item.attributes[key] !== undefined && key !== 'friendly_name') {
                attributesHtml += `
                    <div class="more-info-attribute">
                        <div class="more-info-attr-key">${this.formatAttributeName(key)}</div>
                        <div class="more-info-attr-value">${this.formatAttributeValue(item.attributes[key])}</div>
                    </div>
                `;
                hasAttributes = true;
            }
        });

        // Weitere Attribute (maximal 5 zusätzliche)
        let additionalCount = 0;
        Object.keys(item.attributes).forEach(key => {
            if (!importantAttributes.includes(key) && additionalCount < 5 && 
                !key.startsWith('_') && typeof item.attributes[key] !== 'object') {
                attributesHtml += `
                    <div class="more-info-attribute">
                        <div class="more-info-attr-key">${this.formatAttributeName(key)}</div>
                        <div class="more-info-attr-value">${this.formatAttributeValue(item.attributes[key])}</div>
                    </div>
                `;
                hasAttributes = true;
                additionalCount++;
            }
        });

        attributesHtml += '</div>';

        return hasAttributes ? attributesHtml : null;
    }

    formatAttributeName(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatAttributeValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'Ja' : 'Nein';
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(1);
        }
        return String(value);
    }

    setupMoreInfoControls(item) {
        const modal = this.shadowRoot.getElementById('moreInfoModal');
        
        // Button Controls
        modal.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const itemId = e.target.getAttribute('data-item-id');
                const mode = e.target.getAttribute('data-mode');
                
                this.executeMoreInfoAction(item, action, e.target, { mode });
            });
        });

        // Slider Controls
        const brightnessSlider = modal.querySelector('#brightnessSlider');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                modal.querySelector('#brightnessValue').textContent = value + '%';
            });
            
            brightnessSlider.addEventListener('change', (e) => {
                const brightness = Math.round(e.target.value * 255 / 100);
                this._hass.callService('light', 'turn_on', {
                    entity_id: item.id,
                    brightness: brightness
                });
            });
        }

        const temperatureSlider = modal.querySelector('#temperatureSlider');
        if (temperatureSlider) {
            temperatureSlider.addEventListener('input', (e) => {
                modal.querySelector('#tempValue').textContent = e.target.value + '°C';
            });
            
            temperatureSlider.addEventListener('change', (e) => {
                this._hass.callService('climate', 'set_temperature', {
                    entity_id: item.id,
                    temperature: parseFloat(e.target.value)
                });
            });
        }

        const positionSlider = modal.querySelector('#positionSlider');
        if (positionSlider) {
            positionSlider.addEventListener('input', (e) => {
                modal.querySelector('#positionValue').textContent = e.target.value + '%';
            });
            
            positionSlider.addEventListener('change', (e) => {
                this._hass.callService('cover', 'set_cover_position', {
                    entity_id: item.id,
                    position: parseInt(e.target.value)
                });
            });
        }
    }

    executeMoreInfoAction(item, action, button, options = {}) {
        if (!this._hass) return;

        // Loading state für den Button
        const originalText = button.innerHTML;
        button.innerHTML = this.showLoadingDots('⏳');
        button.disabled = true;

        // Action ausführen
        switch (action) {
            case 'toggle':
                if (item.itemType === 'automation') {
                    this._hass.callService('automation', 'toggle', { entity_id: item.id });
                } else {
                    const domain = item.type;
                    this._hass.callService(domain, 'toggle', { entity_id: item.id });
                }
                break;

            case 'trigger':
                this._hass.callService('automation', 'trigger', { entity_id: item.id });
                break;

            case 'run':
                this._hass.callService('script', 'turn_on', { entity_id: item.id });
                break;

            case 'activate':
                this._hass.callService('scene', 'turn_on', { entity_id: item.id });
                break;

            case 'hvac_mode':
                this._hass.callService('climate', 'set_hvac_mode', {
                    entity_id: item.id,
                    hvac_mode: options.mode
                });
                break;

            case 'open_cover':
                this._hass.callService('cover', 'open_cover', { entity_id: item.id });
                break;

            case 'close_cover':
                this._hass.callService('cover', 'close_cover', { entity_id: item.id });
                break;

            case 'stop_cover':
                this._hass.callService('cover', 'stop_cover', { entity_id: item.id });
                break;

            case 'media_play_pause':
                this._hass.callService('media_player', 'media_play_pause', { entity_id: item.id });
                break;

            case 'media_stop':
                this._hass.callService('media_player', 'media_stop', { entity_id: item.id });
                break;
        }

        // Loading state nach kurzer Zeit entfernen
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 1000);
    }.classList.contains('action-button') || event.target.classList.contains('grid-action-button')) {
            const action = event.target.getAttribute('data-action');
            this.executeAction(item, action);
            return;
        }
        
        // Standard-Aktion beim Klick auf das Item
        this.executeDefaultAction(item);
    }

    executeAction(item, action) {
        if (!this._hass) return;
        
        // Loading state für den Button anzeigen
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = this.showLoadingDots(originalText.length > 2 ? '⏳' : originalText);
        button.disabled = true;
        
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
        }
        
        // Loading state nach kurzer Zeit entfernen
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 1000);
    }

    executeDefaultAction(item) {
        switch (item.itemType) {
            case 'automation':
                this.executeAction(item, 'trigger');
                break;
            case 'script':
                this.executeAction(item, 'run');
                break;
            case 'scene':
                this.executeAction(item, 'activate');
                break;
            case 'entity':
                if (['light', 'switch', 'fan', 'media_player'].includes(item.type)) {
                    this.executeAction(item, 'toggle');
                }
                break;
        }
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
    description: 'Eine universelle Suchkarte für Home Assistant - Geräte, Automationen, Skripte und Szenen'
});

console.info(
    `%c FAST-SEARCH-CARD %c v3.0.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
);
