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

        // WebGL Properties
        this.gl = null;
        this.program = null;
        this.backgroundTexture = null;
        this.currentMouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.currentSize = { x: 280, y: 72 };
        this.targetSize = { x: 280, y: 72 };
        this.expandedSize = { x: 350, y: 400 };
        this.lastTime = 0;
        this.isWebGLEnabled = false;
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
        this._hass = hass;
        this.updateItems();
        this.updateStates();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <canvas id="glass-canvas"></canvas>
            
            <script id="vertexShader" type="x-shader/x-vertex">
                attribute vec2 a_position;
                varying vec2 v_uv;
                void main() {
                    v_uv = vec2(a_position.x, -a_position.y) * 0.5 + 0.5;
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            </script>
            
            <script id="fragmentShader" type="x-shader/x-fragment">
                precision mediump float;
                uniform vec2 u_resolution;
                uniform vec2 u_mouse;
                uniform vec2 u_size;
                uniform float u_dpr;
                uniform sampler2D u_background;
                varying vec2 v_uv;

                float roundedBox(vec2 p, vec2 size, float radius) {
                    vec2 d = abs(p) - size + radius;
                    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
                }

                vec3 getNormal(vec2 p, vec2 size, float radius) {
                    float eps = 1.0 / u_resolution.x;
                    float d = roundedBox(p, size, radius);
                    vec2 grad = vec2(
                        roundedBox(p + vec2(eps, 0.0), size, radius) - d,
                        roundedBox(p + vec2(0.0, eps), size, radius) - d
                    ) / eps;
                    return normalize(vec3(grad, sqrt(1.0 - clamp(dot(grad, grad), 0.0, 1.0))));
                }

                vec3 blurBackground(vec2 uv, float radius) {
                    vec3 color = vec3(0.0);
                    float totalWeight = 0.0;
                    
                    for(int x = -3; x <= 3; x++) {
                        for(int y = -3; y <= 3; y++) {
                            vec2 offset = vec2(float(x), float(y)) * radius / u_resolution.xy;
                            float weight = exp(-0.5 * (float(x*x + y*y)) / 4.0);
                            color += texture2D(u_background, uv + offset).rgb * weight;
                            totalWeight += weight;
                        }
                    }
                    
                    return color / totalWeight;
                }

                void main() {
                    vec2 uv = v_uv;
                    vec2 pixel = gl_FragCoord.xy;
                    vec2 mouse = u_mouse * u_dpr;
                    vec2 size = u_size * u_dpr * 0.5;
                    
                    // Local coordinates relative to mouse
                    vec2 local = pixel - mouse;
                    
                    // SDF for rounded rectangle
                    float dist = roundedBox(local, size, 24.0 * u_dpr);
                    
                    // Early exit if outside glass area
                    if (dist > 1.0) {
                        gl_FragColor = texture2D(u_background, uv);
                        return;
                    }
                    
                    // Normalized distance for effects
                    float r = length(local) / length(size);
                    
                    // Dome-like refraction normal
                    vec3 domeNormal = normalize(vec3(local * 0.3, length(size) * 0.4));
                    vec2 domeRefractUV = uv + domeNormal.xy * 0.02;
                    
                    // Edge-based refraction
                    vec3 edgeNormal = getNormal(local, size, 24.0 * u_dpr);
                    vec2 edgeRefractUV = uv + edgeNormal.xy * 0.015;
                    
                    // Combine refractions based on distance from center
                    float centerWeight = smoothstep(0.7, 0.3, r);
                    vec2 refractUV = mix(edgeRefractUV, domeRefractUV, centerWeight);
                    
                    // Get refracted and blurred background
                    vec3 refracted = texture2D(u_background, refractUV).rgb;
                    vec3 blurred = blurBackground(uv, 2.0 * u_dpr);
                    
                    // Mix refracted and blurred based on distance
                    vec3 glassBg = mix(refracted, blurred, 0.3);
                    
                    // Edge glow effect
                    float edge = 1.0 - smoothstep(-2.0, 2.0, dist);
                    vec3 glowColor = vec3(1.0, 1.0, 1.0) * edge * 0.3;
                    
                    // Top highlight (simulating light)
                    float topHighlight = smoothstep(0.0, -size.y * 0.3, local.y) * 
                                       smoothstep(size.x * 0.8, size.x * 0.2, abs(local.x)) * 0.2;
                    
                    // Combine all effects
                    vec3 finalColor = glassBg + glowColor + vec3(topHighlight);
                    
                    // Smooth alpha based on SDF
                    float alpha = 1.0 - smoothstep(-1.0, 1.0, dist);
                    alpha *= 0.85; // Overall transparency
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            </script>

            <style>
            :host {
                display: block;
                --glass-primary: rgba(255, 255, 255, 0.15);
                --glass-secondary: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                --glass-blur: blur(20px);
                --accent: #007AFF;
                --accent-light: rgba(0, 122, 255, 0.15);
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.7);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                position: relative;
            }

            #glass-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 0;
                pointer-events: none;
                border-radius: 24px;
            }

            .main-container {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 0;
                position: relative;
                z-index: 1;
            }

            .search-row {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                width: 100%;
            }

            .search-panel {
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
                transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                max-height: 72px;
            }

            .search-panel.webgl-enabled {
                background: transparent;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .search-panel.expanded {
                max-height: 400px;
            }

            .search-panel::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                opacity: 0.6;
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                min-height: 40px;
            }

            .category-icon {
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

            .category-icon:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }

            .category-icon svg {
                width: 18px;
                height: 18px;
                stroke: var(--text-secondary);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            .search-input {
                flex: 1;
                border: none;
                background: transparent;
                outline: none;
                font-size: 17px;
                color: var(--text-primary);
                font-family: inherit;
                min-width: 0;
            }

            .search-input::placeholder {
                color: var(--text-secondary);
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

            .subcategories {
                display: flex;
                gap: 8px;
                padding: 0 20px 16px 20px;
                overflow-x: auto;
                scrollbar-width: none;
                -ms-overflow-style: none;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }

            .search-panel.expanded .subcategories {
                opacity: 1;
                transform: translateY(0);
            }

            .subcategories::-webkit-scrollbar {
                display: none;
            }

            .subcategory-chip {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
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
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }

            .search-panel.expanded .results-container {
                opacity: 1;
                transform: translateY(0);
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
                min-height: 200px;
            }

            .device-card {
                background: rgba(255, 255, 255, 0.08);
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
            }

            .device-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .device-card:hover::before {
                opacity: 1;
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

            /* Category Buttons */
            .category-buttons {
                display: none;
                flex-direction: column;
                gap: 12px;
                opacity: 0;
                transform: translateX(20px);
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
            }

            .category-button:hover {
                transform: scale(1.05);
                border-color: var(--accent);
                box-shadow: 0 8px 25px rgba(0, 122, 255, 0.2);
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
            @container (max-width: 480px) {
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

                        <div class="subcategories">
                            <div class="subcategory-chip active" data-subcategory="all">Alle</div>
                            <div class="subcategory-chip" data-subcategory="lights">Lichter</div>
                            <div class="subcategory-chip" data-subcategory="climate">Klima</div>
                            <div class="subcategory-chip" data-subcategory="covers">Rollos</div>
                            <div class="subcategory-chip" data-subcategory="media">Medien</div>
                        </div>

                        <div class="results-container">
                            <div class="results-grid">
                                <!-- Results werden hier eingefügt -->
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
        
        // WebGL initialization with delay
        setTimeout(() => {
            if (!this.initWebGL()) {
                console.warn('WebGL not supported, falling back to CSS glass effect');
            }
        }, 100);
    }

    initWebGL() {
        const canvas = this.shadowRoot.getElementById('glass-canvas');
        if (!canvas) return false;

        this.gl = canvas.getContext('webgl', { 
            antialias: true, 
            alpha: true, 
            premultipliedAlpha: false 
        });
        
        if (!this.gl) {
            return false;
        }

        // Setup canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Compile shaders
        const vertexShader = this.compileShader(
            this.shadowRoot.getElementById('vertexShader').textContent,
            this.gl.VERTEX_SHADER
        );
        
        const fragmentShader = this.compileShader(
            this.shadowRoot.getElementById('fragmentShader').textContent,
            this.gl.FRAGMENT_SHADER
        );

        if (!vertexShader || !fragmentShader) {
            return false;
        }

        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
            return false;
        }

        this.gl.useProgram(this.program);

        // Setup geometry (fullscreen quad)
        const positions = new Float32Array([
            -1, -1,  1, -1, -1,  1,
            -1,  1,  1, -1,  1,  1
        ]);

        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Create background texture
        this.createBackgroundTexture();

        // Enable WebGL mode
        this.isWebGLEnabled = true;
        const searchPanel = this.shadowRoot.querySelector('.search-panel');
        searchPanel.classList.add('webgl-enabled');

        // Start render loop
        this.startRenderLoop();
        
        return true;
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    resizeCanvas() {
        const canvas = this.shadowRoot.getElementById('glass-canvas');
        const rect = this.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        if (this.gl) {
            this.gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }

    createBackgroundTexture() {
        // Create a simple gradient background texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f1e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Add some noise/texture
        const imageData = ctx.getImageData(0, 0, 256, 256);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 20;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create WebGL texture
        this.backgroundTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    startRenderLoop() {
        const draw = (currentTime) => {
            if (!this.isWebGLEnabled || !this.gl || !this.program) {
                requestAnimationFrame(draw);
                return;
            }

            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Smooth mouse position tweening
            const lerpSpeed = 8;
            this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * lerpSpeed * deltaTime;
            this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * lerpSpeed * deltaTime;
            
            // Smooth size tweening
            const sizeLerpSpeed = 6;
            this.currentSize.x += (this.targetSize.x - this.currentSize.x) * sizeLerpSpeed * deltaTime;
            this.currentSize.y += (this.targetSize.y - this.currentSize.y) * sizeLerpSpeed * deltaTime;
            
            this.drawGlassEffect();
            requestAnimationFrame(draw);
        };
        
        requestAnimationFrame(draw);
    }

    drawGlassEffect() {
        if (!this.gl || !this.program || !this.backgroundTexture) return;

        const canvas = this.shadowRoot.getElementById('glass-canvas');
        const rect = this.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Clear and setup
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Set uniforms
        const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        const mouseLocation = this.gl.getUniformLocation(this.program, 'u_mouse');
        const sizeLocation = this.gl.getUniformLocation(this.program, 'u_size');
        const dprLocation = this.gl.getUniformLocation(this.program, 'u_dpr');
        const backgroundLocation = this.gl.getUniformLocation(this.program, 'u_background');

        this.gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        this.gl.uniform2f(mouseLocation, this.currentMouse.x, this.currentMouse.y);
        this.gl.uniform2f(sizeLocation, this.currentSize.x, this.currentSize.y);
        this.gl.uniform1f(dprLocation, dpr);

        // Bind background texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);
        this.gl.uniform1i(backgroundLocation, 0);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const categoryIcon = this.shadowRoot.querySelector('.category-icon');
        const filterIcon = this.shadowRoot.querySelector('.filter-icon');
        const categoryButtons = this.shadowRoot.querySelectorAll('.category-button');
        const searchPanel = this.shadowRoot.querySelector('.search-panel');

        // Search Events
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        
        // Clear Button
        clearButton.addEventListener('click', () => this.clearSearch());
        
        // Category Icon - Toggle Category Buttons
        categoryIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCategoryButtons();
        });

        // Filter Icon
        filterIcon.addEventListener('click', () => this.handleFilterClick());

        // Category Buttons
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => this.handleCategorySelect(button));
        });

        // Subcategory Chips - Event Delegation
        this.shadowRoot.querySelector('.subcategories').addEventListener('click', (e) => {
            const chip = e.target.closest('.subcategory-chip');
            if (chip) {
                e.stopPropagation();
                this.handleSubcategorySelect(chip);
            }
        });

        // WebGL Mouse tracking
        this.shadowRoot.addEventListener('mousemove', (e) => {
            const rect = this.getBoundingClientRect();
            this.targetMouse.x = e.clientX - rect.left;
            this.targetMouse.y = e.clientY - rect.top;
        });

        // Panel hover for glass effect size
        searchPanel.addEventListener('mouseenter', () => {
            if (this.isPanelExpanded) {
                this.targetSize = { 
                    x: this.expandedSize.x, 
                    y: this.expandedSize.y 
                };
            } else {
                this.targetSize = { x: 320, y: 80 };
            }
        });

        searchPanel.addEventListener('mouseleave', () => {
            if (this.isPanelExpanded) {
                this.targetSize = { 
                    x: this.expandedSize.x * 0.95, 
                    y: this.expandedSize.y * 0.95 
                };
            } else {
                this.targetSize = { x: 280, y: 72 };
            }
        });

        // Global click handler
        document.addEventListener('click', (e) => {
            if (!e.target.closest('fast-search-card')) {
                this.hideCategoryButtons();
            }
        });
    }

    handleSearch(query) {
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        const searchInput = this.shadowRoot.querySelector('.search-input');
        
        // Show/Hide Clear Button
        if (query.length > 0) {
            clearButton.classList.add('visible');
            this.animateElementIn(clearButton, { scale: [0, 1], opacity: [0, 1] });
        } else {
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
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const clearButton = this.shadowRoot.querySelector('.clear-button');
        
        searchInput.value = '';
        const animation = this.animateElementOut(clearButton);
        animation.finished.then(() => {
            clearButton.classList.remove('visible');
        });
        
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
        setTimeout(() => {
            this.expandPanel();
            this.showCurrentCategoryItems();
        }, 300);
    }

    handleSubcategorySelect(selectedChip) {
        const subcategory = selectedChip.dataset.subcategory;
        if (subcategory === this.activeSubcategory) return;

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
        
        // Update glass effect size for expanded state
        this.targetSize = { 
            x: this.expandedSize.x, 
            y: this.expandedSize.y 
        };
        
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
        
        // Update glass effect size for collapsed state
        this.targetSize = { x: 280, y: 72 };
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
            return {
                id: entityId,
                name: entityConfig.title || state.attributes.friendly_name || entityId,
                domain: domain,
                category: this.categorizeEntity(domain),
                state: state.state,
                attributes: state.attributes,
                icon: this.getEntityIcon(domain),
                isActive: this.isEntityActive(state)
            };
        }).filter(Boolean);

        // Show items based on current active category
        this.showCurrentCategoryItems();
    }

    updateStates() {
        if (!this._hass) return;

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
            
            // Then filter by search term
            return item.name.toLowerCase().includes(searchTerm) ||
                   item.id.toLowerCase().includes(searchTerm);
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
        
        this.filteredItems.forEach((item, index) => {
            const card = this.createDeviceCard(item);
            resultsGrid.appendChild(card);
            
            // Only animate on first render or when category changes
            if (!this.hasAnimated) {
                const timeout = setTimeout(() => {
                    this.animateElementIn(card, {
                        opacity: [0, 1],
                        transform: ['translateY(20px) scale(0.9)', 'translateY(0) scale(1)']
                    });
                }, index * 50);
                this.animationTimeouts.push(timeout);
            }
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
        // Optimistic UI update
        const wasActive = card.classList.contains('active');
        card.classList.toggle('active', !wasActive);
        this.animateStateChange(card, !wasActive);
        
        // Call appropriate Home Assistant service
        const domain = item.domain;
        let service = 'toggle';
        
        if (domain === 'script') {
            service = 'turn_on';
        } else if (domain === 'scene') {
            service = 'turn_on';
        } else if (domain === 'automation') {
            service = 'toggle';
        }
        
        this._hass.callService(domain === 'script' || domain === 'scene' ? domain : 'homeassistant', service, {
            entity_id: item.id
        });
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
    description: 'Modern Apple Vision OS inspired search card with Liquid Glass effect'
});

console.info(
    `%c FAST-SEARCH-CARD %c Vision OS Liquid Glass Design `,
    'color: #007AFF; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: #007AFF'
);
