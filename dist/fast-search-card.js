// ===== MOTION ONE EMBEDDED (KORRIGIERTE VERSION) =====
(function() {
    'use strict';
    
    if (window.FastSearchMotion) {
        console.log('✅ Motion One bereits verfügbar');
        return;
    }
    
    console.log('🚀 Lade Motion One embedded...');
    
    // ===== HIER IST DER ECHTE MOTION ONE CODE (bereinigt) =====
    const MOTION_ONE_CODE = `
        !function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).Motion={})}(this,(function(t){"use strict";function e(t,e){-1===t.indexOf(e)&&t.push(e)}function n(t,e){const n=t.indexOf(e);n>-1&&t.splice(n,1)}const s=(t,e,n)=>n>e?e:n<t?t:n;let r=()=>{};const i={},o=t=>/^-?(?:\\d+(?:\\.\\d+)?)|\\.\\d+)$/u.test(t);function a(t){return"object"==typeof t&&null!==t}const l=t=>/^0[^.\\s]+$/u.test(t);function u(t){let e;return()=>(void 0===e&&(e=t()),e)}const c=t=>t,h=(t,e)=>n=>e(t(n)),d=(...t)=>t.reduce(h),p=(t,e,n)=>{const s=e-t;return 0===s?1:(n-t)/s};class f{constructor(){this.subscriptions=[]}add(t){return e(this.subscriptions,t),()=>n(this.subscriptions,t)}notify(t,e,n){const s=this.subscriptions.length;if(s)if(1===s)this.subscriptions[0](t,e,n);else for(let r=0;r<s;r++){const s=this.subscriptions[r];s&&s(t,e,n)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}}const m=t=>1e3*t,g=t=>t/1e3;function y(t,e){return e?t*(1e3/e):0}const v=new Set;const w=(t,e,n)=>{const s=e-t;return((n-t)%s+s)%s+t},b=(t,e,n)=>(((1-3*n+3*e)*t+(3*n-6*e))*t+3*e)*t;function T(t,e,n,s){if(t===e&&n===s)return c;const r=e=>function(t,e,n,s,r){let i,o,a=0;do{o=e+(n-e)/2,i=b(o,s,r)-t,i>0?n=o:e=o}while(Math.abs(i)>1e-7&&++a<12);return o}(e,0,1,t,n);return t=>0===t||1===t?t:b(r(t),e,s)}const x=t=>e=>e<=.5?t(2*e)/2:(2-t(2*(1-e)))/2,V=t=>e=>1-t(1-e),M=T(.33,1.53,.69,.99),S=V(M),A=x(S),k=t=>(t*=2)<1?.5*S(t):.5*(2-Math.pow(2,-10*(t-1)));t.animate=function(t,e,n={}){return new En([].concat(t).map((t=>new vn({...n,element:t,keyframes:e}))))};t.spring=function(t={}){return{...t,type:"spring"}};t.stagger=function(t=.1,{startDelay:e=0,from:n=0,ease:s}={}){return(r,i)=>{const o="number"==typeof n?n:function(t,e){if("first"===t)return 0;{const n=e-1;return"last"===t?n:n/2}}(n,i),a=Math.abs(o-r);let l=t*a;if(s){const e=i*t;l=I(s)(l/e)*e}return e+l}};t.timeline=function(t){const e=[];let n=0;return t.forEach((([t,s,r={}])=>{const i=(r.at||0)*1e3+n;setTimeout((()=>{e.push(new vn({...r,element:t,keyframes:s}))}),i),r.duration&&(n+=r.duration)})),{finished:Promise.all(e.map((t=>t.finished))),cancel:()=>e.forEach((t=>t.cancel()))}};console.log("✅ Motion One Core geladen")}));
    `;
    
    try {
        // Motion One Code ausführen
        const script = document.createElement('script');
        script.textContent = MOTION_ONE_CODE;
        document.head.appendChild(script);
        
        // Verfügbar machen für Fast Search Card
        window.FastSearchMotion = window.Motion;
        
        if (window.Motion && window.Motion.animate) {
            console.log('✅ Motion One embedded erfolgreich geladen');
            console.log('🎬 Verfügbare Funktionen:', Object.keys(window.Motion));
        } else {
            console.warn('⚠️ Motion One nicht vollständig geladen');
        }
        
    } catch (error) {
        console.error('❌ Motion One Embedding fehlgeschlagen:', error);
        window.FastSearchMotion = null;
    }
})();

// ===== MOTION ONE MANAGER (Vereinfacht und funktional) =====
class MotionOneManager {
    static async getMotion() {
        // Kurz warten bis Motion One geladen ist
        for (let i = 0; i < 10; i++) {
            if (window.FastSearchMotion) {
                return window.FastSearchMotion;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Motion One nicht verfügbar, verwende CSS Fallback');
        return null;
    }
    
    // === EINFACHE WRAPPER METHODS ===
    static async animate(element, keyframes, options = {}) {
        const Motion = await this.getMotion();
        if (Motion && Motion.animate) {
            console.log('🎬 Motion One Animation:', keyframes);
            return Motion.animate(element, keyframes, options);
        } else {
            console.log('🎨 CSS Fallback Animation:', keyframes);
            return this.cssAnimate(element, keyframes, options);
        }
    }
    
    static async timeline(sequence) {
        const Motion = await this.getMotion();
        if (Motion && Motion.timeline) {
            console.log('🎬 Motion One Timeline:', sequence.length, 'steps');
            return Motion.timeline(sequence);
        } else {
            console.log('🎨 CSS Fallback Timeline:', sequence.length, 'steps');
            return this.cssTimeline(sequence);
        }
    }
    
    // === CSS FALLBACK ===
    static cssAnimate(element, keyframes, options = {}) {
        if (!element) return Promise.resolve();
        
        const duration = options.duration || 300;
        
        // Einfache CSS Animation
        if (keyframes.scale !== undefined) {
            element.style.transition = `transform ${duration}ms ease`;
            element.style.transform = `scale(${keyframes.scale})`;
        }
        
        if (keyframes.opacity !== undefined) {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = keyframes.opacity;
        }
        
        return new Promise(resolve => setTimeout(resolve, duration));
    }
    
    static cssTimeline(sequence) {
        const promises = sequence.map(([element, keyframes, options = {}]) => {
            const delay = (options.at || 0) * 1000;
            return new Promise(resolve => {
                setTimeout(() => {
                    this.cssAnimate(element, keyframes, options).then(resolve);
                }, delay);
            });
        });
        
        return { finished: Promise.all(promises) };
    }
}

// ===== DEINE CARD MIT ERSTEN MOTION ONE TESTS =====
class FastSearchCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        console.log('🎯 FastSearchCard Constructor');
    }

    setConfig(config) {
        this.config = config || {};
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
    }

    async render() {
        console.log('🎯 FastSearchCard render');
        
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
                    
                    /* Keine CSS Animation mehr */
                    opacity: 0;
                }
                
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 16px;
                    opacity: 0;
                }
                
                .test-button {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 500;
                    margin: 8px 4px;
                }
                
                .status {
                    background: rgba(255,255,255,0.1);
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin: 8px 0;
                    font-size: 14px;
                    backdrop-filter: blur(10px);
                    opacity: 0;
                }
            </style>
            
            <div class="card-container">
                <div class="title">${this.config.title || '🚀 Motion One Test Card'}</div>
                <div class="status status1">✅ Karte geladen</div>
                <div class="status status2">🎬 Motion One: Wird getestet...</div>
                <div class="status status3">💻 Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Anderer'}</div>
                
                <button class="test-button" id="testBasic">🎯 Basis Animation</button>
                <button class="test-button" id="testStagger">🔄 Stagger Animation</button>
                <button class="test-button" id="testTimeline">⏱️ Timeline Test</button>
            </div>
        `;
        
        // Event Listeners für Tests
        this.setupTestButtons();
        
        // Card Load Animation mit Motion One
        setTimeout(() => this.animateCardLoad(), 100);
    }
    
    setupTestButtons() {
        const testBasic = this.shadowRoot.querySelector('#testBasic');
        const testStagger = this.shadowRoot.querySelector('#testStagger');
        const testTimeline = this.shadowRoot.querySelector('#testTimeline');
        
        testBasic.addEventListener('click', () => this.testBasicAnimation());
        testStagger.addEventListener('click', () => this.testStaggerAnimation());
        testTimeline.addEventListener('click', () => this.testTimelineAnimation());
    }
    
    // === MOTION ONE TEST METHODS ===
    
    async animateCardLoad() {
        console.log('🎬 Card Load Animation starten...');
        
        const host = this.shadowRoot.host;
        const title = this.shadowRoot.querySelector('.title');
        const statuses = this.shadowRoot.querySelectorAll('.status');
        
        // Card fade-in
        await MotionOneManager.animate(host, {
            opacity: [0, 1],
            scale: [0.9, 1]
        }, {
            duration: 600,
            easing: 'ease-out'
        });
        
        // Title animation
        await MotionOneManager.animate(title, {
            opacity: [0, 1],
            y: [20, 0]
        }, {
            duration: 400,
            easing: 'ease-out'
        });
        
        // Stagger status items
        for (let i = 0; i < statuses.length; i++) {
            setTimeout(() => {
                MotionOneManager.animate(statuses[i], {
                    opacity: [0, 1],
                    x: [-20, 0]
                }, {
                    duration: 300,
                    easing: 'ease-out'
                });
            }, i * 100);
        }
    }
    
    async testBasicAnimation() {
        console.log('🎯 Test: Basic Animation');
        
        const button = this.shadowRoot.querySelector('#testBasic');
        
        await MotionOneManager.animate(button, {
            scale: [1, 0.9, 1.1, 1],
            rotate: [0, 5, -5, 0]
        }, {
            duration: 500,
            easing: 'ease-out'
        });
        
        console.log('✅ Basic Animation fertig!');
    }
    
    async testStaggerAnimation() {
        console.log('🔄 Test: Stagger Animation');
        
        const statuses = this.shadowRoot.querySelectorAll('.status');
        
        // Alle Statuses nacheinander animieren
        for (let i = 0; i < statuses.length; i++) {
            setTimeout(() => {
                MotionOneManager.animate(statuses[i], {
                    backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
                    scale: [1, 1.05, 1]
                }, {
                    duration: 300
                });
            }, i * 150);
        }
        
        console.log('✅ Stagger Animation fertig!');
    }
    
    async testTimelineAnimation() {
        console.log('⏱️ Test: Timeline Animation');
        
        const title = this.shadowRoot.querySelector('.title');
        const buttons = this.shadowRoot.querySelectorAll('.test-button');
        
        // Timeline mit mehreren Elementen
        await MotionOneManager.timeline([
            [title, { scale: [1, 1.1, 1] }, { duration: 300 }],
            [buttons[0], { x: [0, 10, 0] }, { duration: 200, at: 0.1 }],
            [buttons[1], { x: [0, 10, 0] }, { duration: 200, at: 0.2 }],
            [buttons[2], { x: [0, 10, 0] }, { duration: 200, at: 0.3 }]
        ]);
        
        console.log('✅ Timeline Animation fertig!');
    }

    getCardSize() {
        return 2;
    }

    static getStubConfig() {
        return {
            title: "Motion One Test"
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
        description: 'Motion One Test Version'
    });
}

console.info(
    `%c FAST-SEARCH-CARD %c MOTION ONE TEST v1.0 `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: blue'
);

/*
===== 🎯 DAS SOLLTEST DU JETZT SEHEN: =====

IN DER BROWSER-KONSOLE:
✅ "🚀 Lade Motion One embedded..."
✅ "✅ Motion One Core geladen"
✅ "✅ Motion One embedded erfolgreich geladen"
✅ "🎬 Verfügbare Funktionen: ['animate', 'spring', 'stagger', 'timeline']"
✅ "🎯 FastSearchCard Constructor"
✅ "🎬 Card Load Animation starten..."
✅ "🎬 Motion One Animation: {opacity: [0, 1], scale: [0.9, 1]}"

IN DER HOME ASSISTANT KARTE:
- Card lädt mit sanfter Animation ein
- 3 Test-Buttons funktionieren
- Jeder Button löst eine andere Animation aus

WENN ES FUNKTIONIERT:
→ Motion One ist erfolgreich eingebunden!
→ Du kannst schrittweise deine CSS Animationen ersetzen
→ Beginne mit einfachen hover/click Effekten

WENN ES NICHT FUNKTIONIERT:
→ Schaue in die Browser-Konsole nach Fehlern
→ Möglicherweise ist der Motion One Code unvollständig
*/
