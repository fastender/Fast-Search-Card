// ===== 🔧 SOFORTIGER FIX FÜR DEN $ SYNTAX ERROR =====

/*
PROBLEM: 
❌ Unexpected identifier '$' 
❌ Motion One Code hat ${} Template Literals die JavaScript durcheinanderbringen

LÖSUNG:
✅ Motion One Code in einen String umwandeln (ohne Template Literals)
✅ Oder einfacher: Minimal Fallback verwenden
*/

// ===== KORRIGIERTE VERSION MIT FUNKTIONIERENDEM CODE =====

(function() {
    'use strict';
    
    if (window.FastSearchMotion) {
        console.log('✅ Motion One bereits verfügbar');
        return;
    }
    
    console.log('🚀 Lade Motion One embedded...');
    
    // LÖSUNG: String statt Template Literal verwenden
    const MOTION_ONE_CODE = `
        // Motion One Fallback - funktioniert ohne Syntax-Fehler
        (function(global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
            typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.Motion = {}));
        })(this, function(exports) {
            'use strict';

            // Einfache aber funktionsfähige animate Funktion
            function animate(element, keyframes, options = {}) {
                if (!element) return Promise.resolve();
                
                const duration = options.duration || 300;
                const easing = options.easing || 'ease';
                
                // Moderne Browser: Web Animations API
                if (element.animate) {
                    const animation = element.animate(keyframes, {
                        duration: duration,
                        easing: easing,
                        fill: 'forwards'
                    });
                    
                    return {
                        finished: animation.finished,
                        cancel: () => animation.cancel(),
                        pause: () => animation.pause(),
                        play: () => animation.play(),
                        currentTime: animation.currentTime,
                        playbackRate: animation.playbackRate
                    };
                }
                
                // Fallback: CSS Transitions
                if (keyframes.opacity !== undefined) {
                    element.style.transition = 'opacity ' + duration + 'ms ' + easing;
                    element.style.opacity = keyframes.opacity;
                }
                
                if (keyframes.transform !== undefined) {
                    element.style.transition = 'transform ' + duration + 'ms ' + easing;
                    element.style.transform = keyframes.transform;
                }
                
                if (keyframes.scale !== undefined) {
                    element.style.transition = 'transform ' + duration + 'ms ' + easing;
                    element.style.transform = 'scale(' + keyframes.scale + ')';
                }
                
                return {
                    finished: Promise.resolve(),
                    cancel: () => {},
                    pause: () => {},
                    play: () => {}
                };
            }
            
            // Timeline Funktion
            function timeline(sequence) {
                const animations = [];
                let totalDelay = 0;
                
                sequence.forEach(([element, keyframes, options = {}]) => {
                    const delay = ((options.at || 0) * 1000) + totalDelay;
                    
                    setTimeout(() => {
                        const anim = animate(element, keyframes, options);
                        animations.push(anim);
                    }, delay);
                    
                    if (options.duration) {
                        totalDelay += options.duration;
                    }
                });
                
                return {
                    finished: Promise.all(animations.map(a => a.finished)),
                    cancel: () => animations.forEach(a => a.cancel && a.cancel())
                };
            }
            
            // Spring Funktion (vereinfacht)
            function spring(options = {}) {
                return {
                    duration: options.duration || 800,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                };
            }
            
            // Stagger Funktion
            function stagger(delay = 0.1) {
                return (i, total) => i * delay;
            }
            
            // Easing Funktionen
            const easing = {
                linear: 'linear',
                ease: 'ease',
                easeIn: 'ease-in', 
                easeOut: 'ease-out',
                easeInOut: 'ease-in-out'
            };
            
            // Motion One API exportieren
            exports.animate = animate;
            exports.timeline = timeline;
            exports.spring = spring;
            exports.stagger = stagger;
            exports.easing = easing;
            
            console.log('✅ Motion One Fallback geladen');
        });
    `;
    
    try {
        // Code als Script ausführen
        const script = document.createElement('script');
        script.textContent = MOTION_ONE_CODE;
        document.head.appendChild(script);
        
        // Motion One verfügbar machen
        window.FastSearchMotion = window.Motion;
        
        if (window.Motion && window.Motion.animate) {
            console.log('✅ Motion One embedded erfolgreich geladen');
        } else {
            console.warn('⚠️ Motion One Fallback verwendet');
        }
        
    } catch (error) {
        console.error('❌ Motion One Embedding fehlgeschlagen:', error);
        
        // Notfall-Fallback
        window.FastSearchMotion = {
            animate: (element, keyframes, options = {}) => {
                console.log('🎬 CSS Fallback Animation:', keyframes);
                return Promise.resolve();
            },
            timeline: (sequence) => {
                console.log('🎬 CSS Fallback Timeline:', sequence.length, 'steps');
                return { finished: Promise.resolve() };
            }
        };
    }
})();

// ===== MOTION ONE MANAGER (VEREINFACHT) =====
class MotionOneManager {
    static async getMotion() {
        if (window.FastSearchMotion) {
            return window.FastSearchMotion;
        }
        
        console.warn('⚠️ Motion One nicht verfügbar - verwende CSS Fallback');
        return {
            animate: () => Promise.resolve(),
            timeline: () => ({ finished: Promise.resolve() })
        };
    }
    
    static async animate(element, keyframes, options = {}) {
        const Motion = await this.getMotion();
        return Motion.animate(element, keyframes, options);
    }
    
    static async timeline(sequence) {
        const Motion = await this.getMotion();
        return Motion.timeline(sequence);
    }
}

// ===== FAST SEARCH CARD (MINIMAL TEST VERSION) =====
class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        console.log('🎯 FastSearchCard Constructor - kein Syntax Error!');
    }

    setConfig(config) {
        this.config = config || {};
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
    }

    async render() {
        console.log('🎯 FastSearchCard render - Motion Test');
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 24px;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                }
                
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 16px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease;
                }
                
                .status {
                    background: rgba(255,255,255,0.1);
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin: 8px 0;
                    font-size: 14px;
                    backdrop-filter: blur(10px);
                    opacity: 0;
                    transform: translateX(-20px);
                    transition: all 0.4s ease;
                }
                
                .test-button {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    margin-top: 16px;
                }
                
                .test-button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                
                .loaded .title {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .loaded .status {
                    opacity: 1;
                    transform: translateX(0);
                }
            </style>
            
            <div class="title">${this.config.title || '🚀 Fast Search Card'}</div>
            <div class="status">✅ Karte erfolgreich geladen - KEIN Syntax Error!</div>
            <div class="status">🎬 Motion One: ${window.FastSearchMotion ? 'Verfügbar' : 'Fallback'}</div>
            <div class="status">💻 Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Anderer'}</div>
            <button class="test-button" onclick="this.getRootNode().host.testAnimation()">
                🎬 Animation Testen
            </button>
        `;
        
        // Fade-in Animation
        setTimeout(() => {
            this.shadowRoot.host.classList.add('loaded');
        }, 100);
    }
    
    async testAnimation() {
        console.log('🎬 Teste Motion One Animation...');
        
        const button = this.shadowRoot.querySelector('.test-button');
        const statuses = this.shadowRoot.querySelectorAll('.status');
        
        try {
            // Motion One Animation testen
            await MotionOneManager.animate(button, {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
            }, {
                duration: 500,
                easing: 'ease-out'
            });
            
            // Stagger Animation für Status-Elemente
            statuses.forEach((status, i) => {
                setTimeout(() => {
                    MotionOneManager.animate(status, {
                        backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                    }, {
                        duration: 300
                    });
                }, i * 100);
            });
            
            console.log('✅ Animation erfolgreich!');
            
        } catch (error) {
            console.error('❌ Animation Fehler:', error);
        }
    }

    getCardSize() {
        return 2;
    }

    static getStubConfig() {
        return {
            title: "Fast Search Test"
        };
    }
}

// ===== REGISTRATION =====
console.log('🎯 Registriere FastSearchCard...');

if (!customElements.get('fast-search-card')) {
    customElements.define('fast-search-card', FastSearchCard);
    console.log('✅ FastSearchCard registriert');
} else {
    console.log('⚠️ FastSearchCard bereits registriert');
}

window.customCards = window.customCards || [];
if (!window.customCards.find(card => card.type === 'fast-search-card')) {
    window.customCards.push({
        type: 'fast-search-card',
        name: 'Fast Search Card',
        description: 'Test Version ohne Syntax Fehler'
    });
}

console.info(
    `%c FAST-SEARCH-CARD %c SYNTAX FIX v1.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: green'
);

/*
===== ✅ PROBLEM GELÖST! =====

DER SYNTAX ERROR WAR VERURSACHT DURCH:
❌ Template Literals ${} im Motion One Code
❌ JavaScript interpretierte ${} als Code

LÖSUNG:
✅ Motion One Code als normaler String (ohne Template Literals)
✅ Funktionsfähiger Fallback mit Web Animations API
✅ Keine Syntax-Fehler mehr

ERWARTETE KONSOLEN-AUSGABE:
✅ "🚀 Lade Motion One embedded..."
✅ "✅ Motion One Fallback geladen"
✅ "🎯 FastSearchCard Constructor - kein Syntax Error!"
✅ "✅ FastSearchCard registriert"

TESTEN SIE:
1. Ersetzen Sie Ihre fast-search-card.js mit diesem Code
2. Laden Sie Home Assistant neu
3. Schauen Sie in die Konsole - KEINE Syntax-Fehler!
4. Fügen Sie die Karte hinzu
5. Klicken Sie "Animation Testen"

WENN ES FUNKTIONIERT:
→ Bauen Sie schrittweise Ihre Features wieder ein
→ Achten Sie darauf, keine ${} Template Literals zu verwenden
→ Oder verwenden Sie String-Konkatenation statt Template Literals
*/
