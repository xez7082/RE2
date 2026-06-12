/* ============================================================
   RESIDENT EVIL CARD v110 (version RICHE : widgets)
   CORRECTIFS vs fichier d'origine :
   1. import unpkg lit (asynchrone → carte "introuvable") REMPLACÉ par
      extraction synchrone de Lit depuis Home Assistant.
   2. customElements.define('custom:resident-evil-card-editor', ...) → nom
      INVALIDE (deux-points interdits) → 'resident-evil-card-editor'.
   3. La classe avait DEUX `static get styles` : le grand bloc `cardStyles`
      (styles des cartes-capteurs, caméras, climate…) n'était JAMAIS appliqué.
      Désormais fusionné via un tableau [cardStyles, layoutStyles].
   4. Guards anti-double-define + enregistrement window.customCards.
   5. getConfigElement non-async + getCardSize + getStubConfig.
   ============================================================ */

const _haBase =
  customElements.get("ha-panel-lovelace") ||
  customElements.get("hui-masonry-view") ||
  customElements.get("home-assistant");

if (!_haBase) {
  throw new Error("resident-evil-card: impossible de localiser LitElement dans HA");
}

const LitElement = Object.getPrototypeOf(_haBase);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// ==========================================
// 1. STYLES CARTES-CAPTEURS / CAMÉRAS / WIDGETS
//    (appliqués via le tableau de styles ci-dessous)
// ==========================================
const cardStyles = css`
  :host {
    --re-bg: #050505;
    --re-card-bg: #0a0a0a;
    --re-border-color: #2a2a2a;
    --re-red: #8b0000;
    --re-red-bright: #ff0000;
    --re-red-glow: rgba(139, 0, 0, 0.6);
    --re-green: #00ff00;
    --re-green-bright: #00ff00;
    --re-green-glow: rgba(0, 255, 0, 0.4);
    --re-text-gray: #8a8a8a;
  }

  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; width: 100%; flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; align-content: start; }
  .sensors-grid::-webkit-scrollbar { display: none; }

  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; display: flex; margin: 0; padding: 0; overflow: hidden; min-height: 0; }
  .re-iframe { width: 100%; height: 100%; border: none; background: transparent; display: block; min-height: 0; }

  .sensor-card {
    background: #0d0d0d;
    border: 1px solid #222;
    padding: 12px;
    cursor: pointer;
    position: relative;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 80px;
  }
  .sensor-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #333; transition: background 0.25s; }
  .sensor-card:hover { border-color: var(--re-green); background: #111; }
  .sensor-card:hover::before { background: var(--re-green); }

  .card-battery-indicator {
    position: absolute;
    bottom: 6px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: bold;
    color: #8a8a8a;
    z-index: 2;
  }
  .card-battery-indicator ha-icon { --mdc-icon-size: 12px; }
  .batt-high { color: #00ff00; }
  .batt-medium { color: #ff9900; }
  .batt-low { color: #ff3333; animation: batt-flash 1s infinite alternate; }
  @keyframes batt-flash { 0% { opacity: 0.2; } 100% { opacity: 1; } }

  .sensor-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%; }
  .sensor-name { font-size: var(--ec-fs-name, 12px); color: var(--re-text-gray); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .sensor-icon { --mdc-icon-size: 20px; color: var(--re-text-gray); transition: all 0.25s ease; }
  .sensor-value { font-size: var(--ec-fs-value, 18px); color: #cccccc; font-weight: bold; margin-top: 8px; }
  .sensor-value .unit { font-size: 12px; color: #888; font-weight: normal; }

  .sensor-card.type-server {
    grid-column: span 1;
    background: #08080c;
    border: 1px solid #1e1e24;
  }
  .server-label { font-size: 11px; color: #777; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }

  .sensor-card.effect-light.state-active { border-color: var(--re-green); background: #041404; box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.15); }
  .sensor-card.effect-light.state-active::before { background: var(--re-green-bright); }
  .sensor-card.effect-light.state-active .sensor-icon { color: var(--re-green-bright); filter: drop-shadow(0 0 5px var(--re-green-bright)); animation: light-glow 2s infinite alternate; }
  .sensor-card.effect-light.state-active .sensor-value { color: #fff; text-shadow: 0 0 4px var(--re-green-glow); }
  @keyframes light-glow { 0% { filter: drop-shadow(0 0 3px var(--re-green-bright)); } 100% { filter: drop-shadow(0 0 8px var(--re-green-bright)); } }

  .sensor-card.effect-switch.state-active { border-color: #ff9900; background: #140b00; }
  .sensor-card.effect-switch.state-active::before { background: #ff9900; }
  .sensor-card.effect-switch.state-active .sensor-icon { color: #ff9900; filter: drop-shadow(0 0 4px #ff9900); }
  .sensor-card.effect-switch.state-active .sensor-value { color: #ff9900; }

  .sensor-card.effect-binary.state-active { border-color: var(--re-red-bright); animation: alert-card-pulse 1.5s infinite alternate; }
  .sensor-card.effect-binary.state-active::before { background: var(--re-red-bright); }
  .sensor-card.effect-binary.state-active .sensor-icon { color: var(--re-red-bright); animation: alert-icon-shake 0.4s infinite; }
  .sensor-card.effect-binary.state-active .sensor-value { color: var(--re-red-bright); text-shadow: 0 0 6px var(--re-red-glow); }
  @keyframes alert-card-pulse { 0% { background: #0d0d0d; box-shadow: none; } 100% { background: #210505; box-shadow: 0 0 12px var(--re-red-glow); } }
  @keyframes alert-icon-shake { 0% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } 100% { transform: rotate(0deg); } }

  .sensor-card.type-climate, .sensor-card.type-temp-visual { grid-column: span 2; min-height: 125px; background: #09090b; border: 1px solid #1f1f23; }
  .temp-display-container { display: flex; align-items: baseline; gap: 8px; margin-top: 5px; }
  .temp-huge-value { font-size: 28px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: -1px; }
  .temp-status-tag { font-size: 11px; padding: 2px 6px; font-weight: bold; border: 1px solid #333; text-transform: uppercase; background: #000; letter-spacing: 1px; }
  .thermal-gauge-axis { width: 100%; height: 12px; background: #050505; border: 1px solid #222; margin-top: 10px; position: relative; display: flex; align-items: center; padding: 0 2px; box-sizing: border-box; }
  .thermal-gauge-bar { height: 6px; transition: width 0.6s cubic-bezier(0.1, 0.8, 0.2, 1), background-color 0.4s; position: relative; }
  .tg-cold { background: #00ffff; box-shadow: 0 0 8px rgba(0,255,255,0.6); }
  .tg-ideal { background: #00ff00; box-shadow: 0 0 8px rgba(0,255,0,0.6); }
  .tg-warm { background: #ff9900; box-shadow: 0 0 8px rgba(255,153,0,0.6); }
  .tg-hot { background: #ff0000; box-shadow: 0 0 8px rgba(255,0,0,0.6); animation: batt-flash 0.8s infinite alternate; }
  .thermal-ticks { position: absolute; width: 100%; height: 100%; top: 0; left: 0; background: linear-gradient(to right, transparent 94%, #111 94%); background-size: 5% 100%; pointer-events: none; }
  .climate-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; background: #000; padding: 3px; border: 1px solid #1a1a1a; }
  .climate-btn { background: #111; border: 1px solid #333; color: #fff; font-family: inherit; font-weight: bold; font-size: 14px; padding: 4px 18px; cursor: pointer; transition: all 0.2s; }
  .climate-btn:hover { background: #fff; color: #000; border-color: #fff; }

  .sensor-card.type-camera-feed {
    grid-column: span 2;
    min-height: 180px;
    padding: 0px;
    background: #000000;
    border: 2px solid #222;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .sensor-card.type-camera-feed::before { display: none; }

  .camera-stream-container {
    width: 100%;
    flex: 1;
    position: relative;
    background: #050505;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .camera-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: sepia(20%) contrast(115%) brightness(95%);
    opacity: 0.85;
    transition: all 0.3s;
  }
  .sensor-card.type-camera-feed:hover .camera-img {
    opacity: 1;
    filter: sepia(0%) contrast(125%) brightness(100%);
  }

  .camera-hud-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    box-sizing: border-box;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 3;
  }
  .hud-top-row, .hud-bottom-row { display: flex; justify-content: space-between; width: 100%; font-family: 'Courier New', monospace; font-size: 11px; font-weight: bold; text-shadow: 1px 1px 2px #000, 0 0 4px rgba(0,0,0,0.8); }

  .hud-rec-indicator { color: #ff0000; display: flex; align-items: center; gap: 4px; animation: batt-flash 1s infinite alternate; }
  .hud-cam-name { color: #ffffff; text-transform: uppercase; letter-spacing: 1px; }
  .hud-timestamp { color: #ff9900; }
  .hud-status-ok { color: #00ff00; background: rgba(0,255,0,0.15); padding: 1px 4px; border: 1px solid #00ff00; font-size: 11px; }

  .camera-corners { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; box-sizing: border-box; }
  .camera-corners::before, .camera-corners::after { content: ''; position: absolute; width: 10px; height: 10px; border-color: rgba(255,255,255,0.25); border-style: solid; }
  .camera-corners::before { top: 8px; left: 8px; border-width: 2px 0 0 2px; }
  .camera-corners::after { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; }

  .camera-scanlines {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 50%);
    background-size: 100% 6px;
    z-index: 2;
    pointer-events: none;
  }

  .cover-controls { display: flex; gap: 5px; margin-top: 8px; width: 100%; }
  .cover-btn { flex: 1; background: #151515; border: 1px solid var(--re-border-color); color: #fff; font-family: inherit; font-size: 12px; padding: 6px 4px; cursor: pointer; }
  .cover-btn:hover { background: var(--re-red); border-color: #fff; }

  .re-progress-bar { width: 100%; height: 6px; background: #111; border: 1px solid #333; margin-top: 8px; position: relative; overflow: hidden; }
  .re-progress-fill { height: 100%; transition: width 0.5s ease-in-out; }
  .bg-green { background: var(--re-green); box-shadow: 0 0 4px var(--re-green-glow); }
  .bg-red { background: var(--re-red-bright); box-shadow: 0 0 4px var(--re-red-glow); }
  .text-red { color: var(--re-red-bright) !important; text-shadow: 0 0 4px var(--re-red-glow) !important; }
  .error { border-color: var(--re-red-bright); color: var(--re-red-bright); }
  .empty-tab { grid-column: 1 / -1; text-align: center; color: #777; font-size: 13px; margin-top: 50px; }

  /* ─── widgets design génériques ─── */
  .dw-shape-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-circle  { border-radius: 50%; flex-shrink: 0; }
  .dw-square  { border-radius: 0; flex-shrink: 0; }
  .dw-rect    { border-radius: 3px; flex-shrink: 0; }
  .dw-shape-label { font-size: 12px; font-weight: bold; letter-spacing: 1px; text-align: center; }

  .dw-gauge-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 10px 8px; gap: 4px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-gauge-svg { overflow: visible; flex-shrink: 0; }
  .dw-gauge-track { fill: none; stroke: #2a2a2a; }
  .dw-gauge-fill  { fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1); }
  .dw-gauge-center { font-family: 'Courier New', monospace; font-weight: bold; }
  .dw-gauge-label { font-size: 12px; font-weight: bold; letter-spacing: 1px; text-align: center; }

  .dw-spark-wrap { display: flex; flex-direction: column; padding: 12px 10px 8px; gap: 6px; width: 100%; height: 100%; box-sizing: border-box; justify-content: space-between; }
  .dw-spark-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-spark-name { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .dw-spark-val  { font-size: 20px; font-weight: bold; }
  .dw-spark-unit { font-size: 12px; opacity: 0.7; }
  .dw-spark-svg  { width: 100%; overflow: visible; flex: 1; }
  .dw-spark-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .dw-spark-area { opacity: 0.12; }

  .dw-badge-wrap {
    display: flex; align-items: center; justify-content: center;
    padding: 12px 10px; gap: 8px;
    width: 100%; height: 100%; box-sizing: border-box;
  }
  .dw-badge-wrap.icon-top    { flex-direction: column; }
  .dw-badge-wrap.icon-bottom { flex-direction: column-reverse; }
  .dw-badge-wrap.icon-left   { flex-direction: row; }
  .dw-badge-wrap.icon-right  { flex-direction: row-reverse; }
  .dw-badge-icon  { flex-shrink: 0; }
  .dw-badge-texts { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .dw-badge-wrap.icon-left  .dw-badge-texts,
  .dw-badge-wrap.icon-right .dw-badge-texts { align-items: flex-start; }
  .dw-badge-label { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .dw-badge-value { font-size: 22px; font-weight: bold; line-height: 1; }
  .dw-badge-unit  { font-size: 12px; opacity: 0.7; font-weight: normal; }
`;

class ResidentEvilCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _activeMainMenu: { type: Number },
      _activeSubMenu: { type: Number },
      _activeFilter: { type: String },
      _timeString: { type: String }
    };
  }

  constructor() {
    super();
    this._activeMainMenu = 0;
    this._activeSubMenu = 0;
    this._activeFilter = null;
    this._booted = false;
    setTimeout(() => { this._booted = true; this.requestUpdate(); }, 1600);
    this._timeString = "";
    this._timeUpdater = null;
    this._sparkHistory = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this._timeUpdater = setInterval(() => {
      const now = new Date();
      this._timeString = now.toLocaleDateString('fr-FR') + " " + now.toLocaleTimeString('fr-FR');
    }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeUpdater) clearInterval(this._timeUpdater);
  }

  setConfig(config) { this.config = config; }
  getCardSize() { return 10; }
  static getStubConfig() { return { title: "UMBRELLA CORP. TERMINAL", categories: [] }; }
  static getConfigElement() { return document.createElement("resident-evil-card-editor"); }

  _handleAction(entityId) {
    const domain = entityId.split('.')[0];
    if (domain === 'switch' || domain === 'light' || domain === 'input_boolean') {
      this.hass.callService(domain, 'toggle', { entity_id: entityId });
    } else {
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
    }
  }

  _callCoverService(entityId, service) { this.hass.callService('cover', service, { entity_id: entityId }); }

  _adjustTemperature(entityId, amount) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return;

    if (entityId.startsWith('climate.')) {
      const currentTemp = stateObj.attributes.temperature || 20;
      this.hass.callService('climate', 'set_temperature', { entity_id: entityId, temperature: currentTemp + amount });
    } else if (entityId.startsWith('number.')) {
      const currentVal = parseFloat(stateObj.state) || 20;
      this.hass.callService('number', 'set_value', { entity_id: entityId, value: currentVal + amount });
    }
  }

  _getBatteryLevel(entityId, stateObj) {
    if (!stateObj) return null;
    if (entityId.includes('battery') && stateObj.attributes.unit_of_measurement === '%') return parseInt(stateObj.state);
    if (stateObj.attributes.battery !== undefined) return parseInt(stateObj.attributes.battery);
    if (stateObj.attributes.battery_level !== undefined) return parseInt(stateObj.attributes.battery_level);

    const baseName = entityId.split('.')[1];
    const exactBatterySearch = `sensor.${baseName}_battery`;
    if (this.hass.states[exactBatterySearch]) return parseInt(this.hass.states[exactBatterySearch].state);
    return null;
  }

  _renderBatteryIndicator(level) {
    if (level === null || isNaN(level) || level > 100 || level < 0) return html``;
    let icon = "mdi:battery";
    let cssClass = "batt-high";
    if (level <= 20) { icon = "mdi:battery-alert"; cssClass = "batt-low"; }
    else if (level <= 50) { icon = "mdi:battery-50"; cssClass = "batt-medium"; }
    return html`<div class="card-battery-indicator ${cssClass}"><ha-icon icon="${icon}"></ha-icon><span>${level}%</span></div>`;
  }

  _renderThermalGauge(temp) {
    const t = parseFloat(temp);
    if (isNaN(t)) return html``;
    let pct = ((t - 10) / (35 - 10)) * 100;
    if (pct < 0) pct = 0; if (pct > 100) pct = 100;

    let zoneClass = "tg-ideal";
    let statusText = "STABLE";
    let colorStyle = "color: #00ff00; text-shadow: 0 0 5px rgba(0,255,0,0.4);";

    if (t < 17) {
      zoneClass = "tg-cold"; statusText = "CRITICAL COLD";
      colorStyle = "color: #00ffff; text-shadow: 0 0 5px rgba(0,255,255,0.4);";
    } else if (t >= 17 && t <= 23) {
      zoneClass = "tg-ideal"; statusText = "STABLE ENVIRONMENT";
      colorStyle = "color: #00ff00; text-shadow: 0 0 5px rgba(0,255,0,0.4);";
    } else if (t > 23 && t <= 28) {
      zoneClass = "tg-warm"; statusText = "ELEVATED TEMP";
      colorStyle = "color: #ff9900; text-shadow: 0 0 5px rgba(255,153,0,0.4);";
    } else if (t > 28) {
      zoneClass = "tg-hot"; statusText = "OVERHEAT WARNING";
      colorStyle = "color: #ff0000; text-shadow: 0 0 5px rgba(255,0,0,0.4);";
    }

    return html`
      <div class="temp-display-container">
        <span class="temp-huge-value" style="${colorStyle}">${t.toFixed(2)}°C</span>
        <span class="temp-status-tag" style="${colorStyle}">${statusText}</span>
      </div>
      <div class="thermal-gauge-axis">
        <div class="thermal-gauge-bar ${zoneClass}" style="width: ${pct}%;"></div>
        <div class="thermal-ticks"></div>
      </div>
    `;
  }

  firstUpdated() {
    this._decryptTitle();
  }

  _beep(freq = 880) {
    const th = this.config?.theme || {};
    if (th.sounds === false) return;
    try {
      if (!window.__reAudio) window.__reAudio = new (window.AudioContext || window.webkitAudioContext)();
      const a = window.__reAudio;
      if (a.state === 'suspended') a.resume();
      const o = a.createOscillator(); const g = a.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.value = 0.02; o.connect(g); g.connect(a.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.06);
      o.stop(a.currentTime + 0.07);
    } catch (_e) {}
  }

  _triggerGlitch() {
    this._glitch = true; this.requestUpdate();
    clearTimeout(this._glitchT);
    this._glitchT = setTimeout(() => { this._glitch = false; this.requestUpdate(); }, 280);
    this._decryptTitle();
  }

  _decryptTitle() {
    const el = this.shadowRoot?.querySelector('.re-title');
    if (!el) return;
    const finalTxt = this.config?.title || el.textContent || '';
    const chars = '!<>-_\\/[]{}=+*^?#@%&';
    let frame = 0;
    clearInterval(this._decT);
    this._decT = setInterval(() => {
      frame++;
      const reveal = Math.floor(finalTxt.length * frame / 9);
      el.textContent = finalTxt.slice(0, reveal) +
        finalTxt.slice(reveal).split('').map(c => c === ' ' ? ' ' : chars[Math.floor(Math.random()*chars.length)]).join('');
      if (frame >= 9) { clearInterval(this._decT); el.textContent = finalTxt; }
    }, 35);
  }

  updated(changedProps) {
    if (super.updated) super.updated(changedProps);
    // Mise à l'échelle des iframes : plus aucun scroll interne
    const fits = this.shadowRoot ? this.shadowRoot.querySelectorAll('.re-iframe-fit') : [];
    fits.forEach(fit => {
      const ifr  = fit.querySelector('iframe');
      if (!ifr) return;
      const natW = parseFloat(fit.dataset.natw) || 1400;
      const natH = parseFloat(fit.dataset.nath) || 760;
      const rect = fit.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const scale = Math.min(rect.width / natW, rect.height / natH);
      ifr.style.transform = 'scale(' + scale + ')';
      ifr.style.marginLeft = Math.max(0, (rect.width - natW * scale) / 2) + 'px';
    });
  }

  renderEntity(item) {
    const entityId = typeof item === 'object' ? item.entity : item;
    const customIcon = typeof item === 'object' ? item.icon : null;
    const iframeUrl = typeof item === 'object' ? item.url : null;

    if (iframeUrl) {
      const natW = parseInt(item.iframe_width)  || 1400;
      const natH = parseInt(item.iframe_height) || 760;
      return html`
        <div class="re-iframe-wrapper" style="position:relative;">
          <div class="re-iframe-fit" data-natw="${natW}" data-nath="${natH}"
               style="position:absolute;inset:0;overflow:hidden;">
            <iframe class="re-iframe" src="${iframeUrl}" scrolling="no"
                    style="width:${natW}px;height:${natH}px;border:none;display:block;
                           transform-origin:top left;"></iframe>
          </div>
        </div>`;
    }
    if (!entityId) return html``;
    if (entityId.startsWith('iframe:')) {
      const url = entityId.replace('iframe:', '');
      return html`<div class="re-iframe-wrapper"><iframe class="re-iframe" src="${url}"></iframe></div>`;
    }

    const stateObj = this.hass.states[entityId];
    if (!stateObj) {
      return html`<div class="sensor-card error"><div class="sensor-card-header"><div class="sensor-name">${entityId}</div><ha-icon class="sensor-icon" icon="mdi:alert-octagon"></ha-icon></div><div class="sensor-value">HORS LIGNE</div></div>`;
    }

    const domain = entityId.split('.')[0];
    const name = stateObj.attributes.friendly_name || entityId;
    const state = stateObj.state;
    const isActive = state === 'on' || state === 'home' || state === 'open' || state === 'unlocked';
    const batteryLevel = this._getBatteryLevel(entityId, stateObj);

    const isServerMetric = entityId.includes('processor') || entityId.includes('memory') || entityId.includes('docker') || entityId.includes('proxmox') || entityId.includes('fs_used') || entityId.includes('disk_use') || entityId.includes('load_power');
    const isTemperatureSensor = domain === 'sensor' && (stateObj.attributes.unit_of_measurement === '°C' || entityId.includes('temperature'));

    if (domain === 'camera') {
      const cameraUrl = `/api/camera_proxy/${entityId}?token=${stateObj.attributes.access_token}`;
      return html`
        <div class="sensor-card type-camera-feed" @click="${() => this._handleAction(entityId)}">
          <div class="camera-stream-container">
            <img class="camera-img" src="${cameraUrl}" alt="${name}" />
            <div class="camera-scanlines"></div>
            <div class="camera-corners"></div>
            <div class="camera-hud-overlay">
              <div class="hud-top-row">
                <div class="hud-rec-indicator"><span>•</span> REC</div>
                <div class="hud-cam-name">${name}</div>
              </div>
              <div class="hud-bottom-row">
                <div class="hud-status-ok">LIVE // FEED_OK</div>
                <div class="hud-timestamp">${this._timeString}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    let effectClass = '';
    let defaultIcon = 'mdi:eye';

    if (domain === 'light') { effectClass = 'effect-light'; defaultIcon = isActive ? 'mdi:lightbulb-on' : 'mdi:lightbulb-off'; }
    else if (domain === 'switch' || domain === 'input_boolean') { effectClass = 'effect-switch'; defaultIcon = 'mdi:power'; }
    else if (domain === 'binary_sensor' || state === 'open' || state === 'closed') { effectClass = 'effect-binary'; defaultIcon = isActive ? 'mdi:door-open' : 'mdi:door-closed'; }
    else if (domain === 'climate' || isTemperatureSensor) { defaultIcon = 'mdi:thermometer-alert'; }
    else if (domain === 'cover') { defaultIcon = 'mdi:window-shutter'; }
    else if (isServerMetric) { defaultIcon = 'mdi:server-network'; }

    const iconToRender = customIcon || defaultIcon;

    if (domain === 'climate') {
      const targetTemp = stateObj.attributes.temperature ? parseFloat(stateObj.attributes.temperature).toFixed(2) : '--';
      const currentTemp = stateObj.attributes.current_temperature || 0;
      return html`
        <div class="sensor-card type-climate" @click="${() => this._handleAction(entityId)}">
          <div class="sensor-card-header">
            <div class="sensor-name">☣️ HVAC // ${name}</div>
            <ha-icon class="sensor-icon" icon="${iconToRender}" style="color:#ff9900;"></ha-icon>
          </div>
          ${this._renderThermalGauge(currentTemp)}
          <div class="climate-controls" @click="${(e) => e.stopPropagation()}">
            <button class="climate-btn" @click="${() => this._adjustTemperature(entityId, -0.5)}">-</button>
            <span style="font-weight:bold; font-size:12px; color:#aaa;">CIBLE: <span style="color:#fff;">${targetTemp}°C</span></span>
            <button class="climate-btn" @click="${() => this._adjustTemperature(entityId, 0.5)}">+</button>
          </div>
        </div>
      `;
    }

    if (isTemperatureSensor) {
      return html`
        <div class="sensor-card type-temp-visual" @click="${() => this._handleAction(entityId)}">
          <div class="sensor-card-header">
            <div class="sensor-name">🌡️ THERMAL MONITOR // ${name}</div>
            <ha-icon class="sensor-icon" icon="${iconToRender}"></ha-icon>
          </div>
          ${this._renderThermalGauge(state)}
          ${this._renderBatteryIndicator(batteryLevel)}
        </div>
      `;
    }

    if (isServerMetric && stateObj.attributes.unit_of_measurement === '%') {
      const valNum = parseFloat(state);
      const formattedVal = !isNaN(valNum) ? valNum.toFixed(2) : state;
      const isCritical = !isNaN(valNum) && valNum >= 85;
      return html`
        <div class="sensor-card type-server" @click="${() => this._handleAction(entityId)}">
          <div class="sensor-card-header">
            <div class="sensor-name" style="color: #a0a0aa;">[SYS] ${name}</div>
            <ha-icon class="sensor-icon" icon="${iconToRender}" style="color: ${isCritical ? 'var(--re-red-bright)' : 'var(--re-green)'};"></ha-icon>
          </div>
          <div class="server-label">sys_load_factor</div>
          <div class="sensor-value ${isCritical ? 'text-red' : ''}" style="font-family: monospace; font-size: 20px; color: #fff;">
            ${formattedVal}<span class="unit">%</span>
          </div>
          <div class="re-progress-bar" style="border-color: #222; height: 4px; margin-top: 4px;">
            <div class="re-progress-fill ${isCritical ? 'bg-red' : 'bg-green'}" style="width: ${valNum}%"></div>
          </div>
        </div>
      `;
    }

    if (domain === 'cover') {
      return html`
        <div class="sensor-card">
          <div class="sensor-card-header"><div class="sensor-name">${name}</div><ha-icon class="sensor-icon" icon="${iconToRender}"></ha-icon></div>
          <div class="sensor-value" style="font-size:12px; color:var(--re-text-gray);">STATUT: ${state.toUpperCase()}</div>
          <div class="cover-controls">
            <button class="cover-btn" @click="${() => this._callCoverService(entityId, 'open_cover')}">▲</button>
            <button class="cover-btn" @click="${() => this._callCoverService(entityId, 'stop_cover')}">■</button>
            <button class="cover-btn" @click="${() => this._callCoverService(entityId, 'close_cover')}">▼</button>
          </div>
        </div>
      `;
    }

    let displayState = state.toUpperCase();
    const parsedState = parseFloat(state);
    if (!isNaN(parsedState) && stateObj.attributes.unit_of_measurement) {
      displayState = parsedState.toFixed(2);
    }

    if (stateObj.attributes.unit_of_measurement === '%') {
      const valueNum = parseFloat(state);
      const isCritical = !isNaN(valueNum) && valueNum <= 20;
      return html`
        <div class="sensor-card">
          <div class="sensor-card-header"><div class="sensor-name">${name}</div><ha-icon class="sensor-icon" icon="${iconToRender}"></ha-icon></div>
          <div class="sensor-value ${isCritical ? 'text-red' : ''}">${displayState}%</div>
          <div class="re-progress-bar"><div class="re-progress-fill ${isCritical ? 'bg-red' : 'bg-green'}" style="width: ${valueNum}%"></div></div>
        </div>
      `;
    }

    return html`
      <div class="sensor-card ${effectClass} ${isActive ? 'state-active' : ''}" @click="${() => this._handleAction(entityId)}">
        <div class="sensor-card-header"><div class="sensor-name">${name}</div><ha-icon class="sensor-icon" icon="${iconToRender}"></ha-icon></div>
        <div class="sensor-value">
          ${domain === 'light' || domain === 'switch' || domain === 'binary_sensor' ? (isActive ? 'ACTIF' : 'INACTIF') : displayState}
          <span class="unit">${stateObj.attributes.unit_of_measurement || ""}</span>
        </div>
        ${this._renderBatteryIndicator(batteryLevel)}
      </div>
    `;
  }

  // ==========================================
  // DESIGN WIDGETS RENDERING
  // ==========================================

  _getDesignState(widget) {
    if (!widget.entity || !this.hass) return { value: null, unit: '', name: '' };
    const s = this.hass.states[widget.entity];
    if (!s) return { value: null, unit: '', name: widget.entity };
    const raw = parseFloat(s.state);
    return {
      value: isNaN(raw) ? s.state : raw,
      unit: s.attributes.unit_of_measurement || '',
      name: s.attributes.friendly_name || widget.entity,
      state: s.state,
    };
  }

  _renderDesignWidget(w, fillSingle = false) {
    const type     = w.type    || 'badge';
    const color    = w.color   || '#00ff00';
    const glow     = color + '66';
    const noBorder = w.noBorder === true;
    const widthPct = Math.min(100, Math.max(5, parseInt(w.widthPct) || 30));
    const heightPx = parseInt(w.heightPx) || 0;
    const sizeStyle = fillSingle
      ? `width: 100%; height: 100%;`
      : `width: calc(${widthPct}% - 10px); ${heightPx ? 'height:' + heightPx + 'px;' : ''}`;

    switch (type) {
      case 'shape':    return this._renderShape(w, color, glow, sizeStyle, noBorder);
      case 'gauge':    return this._renderGauge(w, color, glow, sizeStyle, noBorder);
      case 'sparkline':return this._renderSparkline(w, color, glow, sizeStyle, noBorder);
      case 'badge':    return this._renderBadge(w, color, glow, sizeStyle, noBorder);
      case 'spa_temp':  return this._renderSpaTemp(w, color, glow, sizeStyle, noBorder);
      case 'energie':   return this._renderEnergieWidget(w, sizeStyle, noBorder);
      case 'health':    return this._renderHealthWidget(w, sizeStyle, noBorder);
      case 'plant':     return this._renderPlantWidget(w, sizeStyle, noBorder);
      case 'server':    return this._renderServerWidget(w, sizeStyle, noBorder);
      case 'tank':      return this._renderTankWidget(w, sizeStyle, noBorder);
      case 'tracker':   return this._renderTrackerWidget(w, sizeStyle, noBorder);
      case 'map':       return this._renderMapWidget(w, sizeStyle, noBorder);
      case 'appliance': return this._renderApplianceWidget(w, sizeStyle, noBorder);
      case 'solar':      return this._renderSolarWidget(w, sizeStyle, noBorder);
      default:          return html``;
    }
  }

  _renderShape(w, color, glow, sizeStyle, noBorder=false) {
    const shape  = w.shape || 'circle';
    const size   = parseInt(w.size) || 60;
    const filled = w.filled !== false;
    const label  = w.label || '';

    let style = `width:${size}px; height:${size}px; background:${filled ? color : 'transparent'}; border:2px solid ${color}; box-shadow: 0 0 10px ${glow};`;
    if (shape === 'line-h') style = `width:100%; height:${Math.max(2,Math.round(size/20))}px; background:${color}; box-shadow:0 0 8px ${glow};`;
    if (shape === 'line-v') style = `width:${Math.max(2,Math.round(size/20))}px; height:${size}px; background:${color}; box-shadow:0 0 8px ${glow};`;

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="border-color:${color}22; ${sizeStyle}">
        <div class="dw-shape-wrap">
          <div class="dw-${shape}" style="${style}"></div>
          ${label ? html`<div class="dw-shape-label" style="color:${color};">${label}</div>` : html``}
        </div>
      </div>`;
  }

  _renderGauge(w, color, glow, sizeStyle, noBorder=false) {
    const { value, unit, name } = this._getDesignState(w);
    const min   = w.min != null ? parseFloat(w.min) : 0;
    const max   = w.max != null ? parseFloat(w.max) : 100;
    const label = w.label || name;
    const gaugeSize = Math.max(60, Math.min(200, parseInt(w.heightPx) || 110));
    const r = gaugeSize * 0.36; const cx = gaugeSize * 0.5; const cy = gaugeSize * 0.5;
    const svgW = gaugeSize; const svgH = gaugeSize * 0.78;
    const startAngle = -210; const sweepAngle = 240;
    const pct = value != null ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
    const circ = 2 * Math.PI * r;
    const dash  = circ * (sweepAngle / 360);
    const offset = dash * (1 - pct);
    const strokeW = Math.max(4, gaugeSize * 0.055);
    const fontSize = gaugeSize * 0.14;
    const toRad = a => a * Math.PI / 180;
    const sx = cx + r * Math.cos(toRad(startAngle));
    const sy = cy + r * Math.sin(toRad(startAngle));
    const ex = cx + r * Math.cos(toRad(startAngle + sweepAngle));
    const ey = cy + r * Math.sin(toRad(startAngle + sweepAngle));

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="border-color:${color}33; ${sizeStyle}">
        <div class="dw-gauge-wrap" @click="${() => w.entity && this._handleAction(w.entity)}">
          <svg class="dw-gauge-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH + 10}">
            <path class="dw-gauge-track" stroke-width="${strokeW}"
              d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" />
            <path class="dw-gauge-fill" stroke="${color}" stroke-width="${strokeW}"
              stroke-dasharray="${dash.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
              d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}"
              style="filter: drop-shadow(0 0 4px ${color});" />
            <text x="${cx}" y="${(cy + fontSize * 0.4).toFixed(2)}" text-anchor="middle" class="dw-gauge-center"
              style="fill:${color}; font-size:${fontSize.toFixed(2)}px;">
              ${value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : '--'}
            </text>
            <text x="${cx}" y="${(cy + fontSize * 1.2).toFixed(2)}" text-anchor="middle" style="fill:#555; font-size:${(fontSize*0.6).toFixed(2)}px; font-family:monospace;">
              ${unit}
            </text>
          </svg>
          <div class="dw-gauge-label" style="color:${color}88; font-size:${Math.max(8,gaugeSize*0.08).toFixed(2)}px;">${label}</div>
        </div>
      </div>`;
  }

  _renderSparkline(w, color, glow, sizeStyle, noBorder=false) {
    const { value, unit, name } = this._getDesignState(w);
    const label   = w.label || name;
    const history = this._sparkHistory[w.entity] || [];
    const points  = history.length >= 2 ? history : Array.from({length: 12}, () => value || 0);
    const W = 120; const H = Math.max(24, Math.min(120, parseInt(w.heightPx) || 36) - 30);
    const minV = Math.min(...points);
    const maxV = Math.max(...points);
    const range = maxV - minV || 1;
    const xs = points.map((_, i) => (i / (points.length - 1)) * W);
    const ys = points.map(v => H - ((v - minV) / range) * (H - 4) - 2);
    const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${ys[i].toFixed(2)}`).join(' ');
    const areaPath = linePath + ` L ${W} ${H} L 0 ${H} Z`;
    const lastX = xs[xs.length - 1];
    const lastY = ys[ys.length - 1];

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="border-color:${color}33; ${sizeStyle}">
        <div class="dw-spark-wrap" @click="${() => w.entity && this._handleAction(w.entity)}">
          <div class="dw-spark-header">
            <span class="dw-spark-name" style="color:${color}88;">${label}</span>
            <span class="dw-spark-val" style="color:${color};">
              ${value != null ? (typeof value === 'number' ? value.toFixed(2) : value) : '--'}
              <span style="font-size:11px;opacity:0.6;">${unit}</span>
            </span>
          </div>
          <svg class="dw-spark-svg" height="${H + 4}" viewBox="0 0 ${W} ${H + 4}">
            <path class="dw-spark-area" d="${areaPath}" fill="${color}" />
            <path class="dw-spark-line" d="${linePath}" stroke="${color}" style="filter:drop-shadow(0 0 3px ${color});" />
            <circle class="dw-spark-dot" cx="${lastX.toFixed(2)}" cy="${lastY.toFixed(2)}" r="3"
              fill="${color}" style="filter:drop-shadow(0 0 4px ${color});" />
          </svg>
        </div>
      </div>`;
  }

  _getEntityIcon(entityId) {
    if (!entityId) return 'mdi:eye';
    const domain = entityId.split('.')[0];
    const icons = {
      sensor: 'mdi:gauge', binary_sensor: 'mdi:radiobox-marked',
      switch: 'mdi:power', light: 'mdi:lightbulb',
      climate: 'mdi:thermometer', cover: 'mdi:window-shutter',
      input_boolean: 'mdi:toggle-switch', number: 'mdi:numeric',
      select: 'mdi:format-list-bulleted', input_number: 'mdi:numeric',
      vacuum: 'mdi:robot-vacuum', lawn_mower: 'mdi:robot-mower',
      weather: 'mdi:weather-partly-cloudy', camera: 'mdi:cctv',
      person: 'mdi:account', device_tracker: 'mdi:map-marker',
    };
    return icons[domain] || 'mdi:eye';
  }

  _renderBadge(w, color, glow, sizeStyle, noBorder=false) {
    const { value, unit, name } = this._getDesignState(w);
    const label    = w.label || name;
    const icon     = w.icon  || this._getEntityIcon(w.entity);
    const iconPos  = w.iconPos || 'top';
    const iconSize = Math.max(16, parseInt(w.iconSize) || 28);
    const fontSize = Math.max(12, parseInt(w.fontSize) || 22);
    const decimals = w.decimals != null ? parseInt(w.decimals) : 1;
    const displayVal = value != null
      ? (typeof value === 'number' ? value.toFixed(decimals) : value)
      : '--';

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="border-color:${color}33; ${sizeStyle}">
        <div class="dw-badge-wrap icon-${iconPos}" @click="${() => w.entity && this._handleAction(w.entity)}">
          ${iconPos !== 'none' ? html`
            <ha-icon class="dw-badge-icon"
              icon="${icon}"
              style="color:${color}; --mdc-icon-size:${iconSize}px; filter:drop-shadow(0 0 4px ${color});"></ha-icon>
          ` : html``}
          <div class="dw-badge-texts">
            ${label ? html`<div class="dw-badge-label" style="color:${color}cc;">${label}</div>` : html``}
            <div class="dw-badge-value" style="color:${color}; font-size:${fontSize}px; text-shadow:0 0 8px ${glow};">
              ${displayVal}<span class="dw-badge-unit">${unit}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ─── helpers spa ────────────────────────────────────────
  _spaEx(id)      { if (!id || !this.hass?.states[id]) return false; return !['unavailable','unknown','none','--',''].includes(String(this.hass.states[id].state).toLowerCase()); }
  _spaSt(id)      { return this._spaEx(id) ? this.hass.states[id].state : null; }
  _spaAt(id, a)   { return this.hass?.states[id]?.attributes?.[a] || null; }
  _spaWater(c)    { const wid=c.entity, tid=c.targetEntity; if (this._spaEx(wid)) return this._spaSt(wid); const cur=this._spaAt(tid,'current_temperature'); return cur!=null ? String(cur) : null; }
  _spaTarget(c)   { const id=c.targetEntity; if (!id||!this.hass?.states[id]) return null; return id.startsWith('climate.') ? String(this._spaAt(id,'temperature')!=null?this._spaAt(id,'temperature'):this._spaSt(id)) : this._spaSt(id); }
  _spaChangeTemp(c, offset) {
    const id=c.targetEntity; if (!id) return;
    const cur = parseFloat(this._spaTarget(c) || 34);
    const mn  = Number(c.target_temp_min || this._spaAt(id,'min_temp') || 10);
    const mx  = Number(c.target_temp_max || this._spaAt(id,'max_temp') || 45);
    const val = Math.min(mx, Math.max(mn, Math.round((cur+offset)*2)/2));
    if (id.startsWith('climate.')) this.hass.callService('climate','set_temperature',{entity_id:id,temperature:val});
    else this.hass.callService('input_number','set_value',{entity_id:id,value:val});
  }

  _renderSpaTemp(w, color, glow, sizeStyle, noBorder=false) {
    const tab = w.view || 'home';
    const ex  = (id) => this._spaEx(id);
    const st  = (id) => this._spaSt(id);

    const tid    = w.targetEntity;
    const wRaw   = this._spaWater(w);
    const wTemp  = wRaw != null ? parseFloat(wRaw) : null;
    const tTemp  = this._spaTarget(w) != null ? parseFloat(this._spaTarget(w)) : null;
    const hvac   = this.hass?.states[tid]?.state;
    const isOn   = hvac === 'heat';
    const atTemp = wTemp!=null && tTemp!=null && wTemp >= tTemp-0.5;
    const tc     = wTemp==null ? '#888' : wTemp<30 ? '#00ccff' : wTemp<36 ? '#00ff88' : wTemp<40 ? '#ff9900' : '#ff3333';

    const bg   = w.bgImage ? `url('${w.bgImage}')` : 'linear-gradient(135deg,#1a1a2e,#0f3460)';
    const blur = w.bgBlur!=null ? w.bgBlur : 5;

    const filterAge  = ex(w.filterEntity)   ? parseFloat(st(w.filterEntity))   : null;
    const chloreAge  = ex(w.chlorineEntity) ? parseFloat(st(w.chlorineEntity)) : null;
    const filterMax  = Number(w.filterMax   || 3);
    const chloreMax  = Number(w.chlorineMax || 13);
    const filterWarn = filterAge!=null && filterAge >= filterMax;
    const chloreWarn = chloreAge!=null && chloreAge >= chloreMax;
    const filterPct  = filterAge!=null ? Math.min(100, filterAge/filterMax*100) : 0;
    const chlorePct  = chloreAge!=null ? Math.min(100, chloreAge/chloreMax*100) : 0;
    const pressReset = (eid) => { if (eid && this.hass) this.hass.callService('button','press',{entity_id:eid}); };

    const leak    = st(w.leakEntity)   === 'on';
    const tamper  = st(w.tamperEntity) === 'on';
    const bat     = ex(w.floodBatEntity) ? parseFloat(st(w.floodBatEntity)) : null;
    const alerting = leak||tamper;
    const batLow   = bat!=null && bat<=15;

    const cons   = ex(w.powerEntity)  ? st(w.powerEntity)  : null;
    const energy = ex(w.energyEntity) ? parseFloat(st(w.energyEntity)) : null;

    const extTemp = ex(w.extTempEntity) ? st(w.extTempEntity) : null;
    const extHum  = ex(w.extHumEntity)  ? st(w.extHumEntity)  : null;
    const airTemp = ex(w.airTempEntity) ? st(w.airTempEntity) : null;
    const airHum  = ex(w.airHumEntity)  ? st(w.airHumEntity)  : null;

    const ph   = ex(w.phEntity)   ? parseFloat(st(w.phEntity))   : null;
    const orp  = ex(w.orpEntity)  ? parseFloat(st(w.orpEntity))  : null;
    const tds  = ex(w.tdsEntity)  ? parseFloat(st(w.tdsEntity))  : null;
    const salt = ex(w.saltEntity) ? parseFloat(st(w.saltEntity)) : null;
    const chemGauge = (val, min, max, lbl, unit) => {
      if (val==null) return html``;
      const pct = Math.min(100, Math.max(0, (val-min)/(max-min)*100));
      const ok  = val>=min && val<=max;
      const c2  = ok ? '#10b981' : '#ef4444';
      return html`
        <div style="display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:rgba(255,255,255,.6);font-weight:600;">${lbl}</span>
            <span style="color:${c2};font-weight:700;">${val.toFixed(2)} ${unit}</span>
          </div>
          <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct.toFixed(2)}%;background:${c2};border-radius:3px;transition:width .5s;"></div>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,.35);text-align:right;">${min} – ${max} ${unit}</div>
        </div>`;
    };

    const switches = [];
    for (let i=1; i<=10; i++) {
      const eid  = w['switch_'+i];
      const name = w['name_switch_'+i] || 'Switch '+i;
      if (eid) switches.push({ eid, name });
    }
    const toggleSw = (eid) => {
      if (!this.hass) return;
      if (!this.hass.states[eid]) { console.warn('[RE-card] entité introuvable :', eid); return; }
      // Service universel : couvre switch, light, input_boolean, fan…
      this.hass.callService('homeassistant','toggle',{entity_id:eid});
    };

    const camId   = w.cameraEntity;
    const camState = camId ? this.hass?.states[camId] : null;
    const camUrl  = camState ? `/api/camera_proxy/${camId}?token=${camState.attributes.access_token}&t=${Date.now()}` : null;

    const schedId = w.scheduleEntity;
    const schedState = schedId ? this.hass?.states[schedId] : null;
    let schedH=0, schedM=0;
    if (schedState) { const p=schedState.state.split(':'); schedH=parseInt(p[0]||0); schedM=parseInt(p[1]||0); }
    const changeSchedTime = (dh,dm) => {
      let nh=schedH+dh, nm=schedM+dm;
      if (nm>=60){nm-=60;nh++;} if (nm<0){nm+=60;nh--;}
      nh=((nh%24)+24)%24;
      this.hass.callService('input_datetime','set_datetime',{entity_id:schedId,time:`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}:00`});
    };

    const renderHome = () => html`
      <div style="display:flex;flex-direction:column;gap:6px;height:100%;">
        ${tid?.startsWith('climate.') && this.hass?.states[tid] ? html`
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:4px 10px;">
            <button style="border:none;border-radius:8px;padding:5px 12px;display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;font-size:12px;font-family:inherit;
              ${isOn ? 'background:linear-gradient(135deg,#ff9800,#f44336);color:#fff;box-shadow:0 2px 8px rgba(244,67,54,.3);' : 'background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);'}"
              @click="${(e) => { e.stopPropagation(); if(this.hass) this.hass.callService('climate','set_hvac_mode',{entity_id:tid,hvac_mode:isOn?'off':'heat'}); }}">
              <ha-icon icon="${isOn?'mdi:radiator':'mdi:radiator-off'}" style="--mdc-icon-size:14px;"></ha-icon>
              ${isOn ? (atTemp ? 'Maintien' : 'Chauffe ON') : 'Chauffe OFF'}
            </button>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="color:rgba(255,255,255,.7);cursor:pointer;display:flex;" @click="${(e)=>{e.stopPropagation();this._spaChangeTemp(w,-1);}}">
                <ha-icon icon="mdi:minus" style="--mdc-icon-size:18px;"></ha-icon>
              </div>
              <div style="font-size:16px;font-weight:700;color:#fff;min-width:38px;text-align:center;">${tTemp!=null?tTemp+'°':'--'}</div>
              <div style="color:rgba(255,255,255,.7);cursor:pointer;display:flex;" @click="${(e)=>{e.stopPropagation();this._spaChangeTemp(w,1);}}">
                <ha-icon icon="mdi:plus" style="--mdc-icon-size:18px;"></ha-icon>
              </div>
            </div>
          </div>
        ` : html``}

        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:4px;">
          <div style="width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;">
            ${extTemp!=null ? html`
              <div style="font-size:19px;font-weight:700;color:#fff;">${parseFloat(extTemp).toFixed(2)}°</div>
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:.5px;">EXTÉRIEUR</div>` : html``}
            ${extHum!=null ? html`
              <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:2px 7px;font-size:11px;color:#fff;">${extHum}% HR</div>` : html``}
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;"
                 @click="${(e)=>{e.stopPropagation();this._spaChangeTemp(w,0.5);}}">
              <ha-icon icon="mdi:chevron-up" style="--mdc-icon-size:14px;"></ha-icon>
            </div>
            <div style="width:120px;height:120px;position:relative;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;border-radius:50%;border:2px dashed rgba(255,255,255,.15);box-sizing:border-box;"></div>
              <div style="width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:1px;">EAU</span>
                <span style="font-size:28px;font-weight:800;color:${tc};line-height:32px;text-shadow:0 0 16px ${tc}66;">
                  ${wTemp!=null ? wTemp.toFixed(2)+'°' : '--'}
                </span>
                ${tTemp!=null ? html`
                  <div style="font-size:11px;font-weight:600;color:#10b981;background:rgba(16,185,129,.12);padding:1px 6px;border-radius:16px;margin-top:1px;border:1px solid rgba(16,185,129,.2);">
                    CIBLE ${tTemp}°
                  </div>` : html``}
              </div>
            </div>
            <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;"
                 @click="${(e)=>{e.stopPropagation();this._spaChangeTemp(w,-0.5);}}">
              <ha-icon icon="mdi:chevron-down" style="--mdc-icon-size:14px;"></ha-icon>
            </div>
          </div>

          <div style="width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;">
            ${airTemp!=null ? html`
              <div style="font-size:19px;font-weight:700;color:#fff;">${parseFloat(airTemp).toFixed(2)}°</div>
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:.5px;">AIR SPA</div>` : html``}
            ${airHum!=null ? html`
              <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:2px 7px;font-size:11px;color:#fff;">${airHum}% HR</div>` : html``}
          </div>
        </div>

        ${(cons!=null||energy!=null) ? html`
          <div style="flex-shrink:0;display:flex;gap:6px;justify-content:center;">
            ${cons!=null ? html`<div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 10px;font-size:12px;color:#fff;font-weight:500;"><ha-icon icon="mdi:lightning-bolt" style="--mdc-icon-size:12px;color:#ffeb3b;"></ha-icon>${cons} W</div>` : html``}
            ${energy!=null ? html`<div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 10px;font-size:12px;color:#fff;font-weight:500;"><ha-icon icon="mdi:flash" style="--mdc-icon-size:12px;"></ha-icon>${energy.toFixed(2)} kWh</div>` : html``}
          </div>` : html``}

        ${(filterAge!=null||chloreAge!=null) ? html`
          <div style="flex-shrink:0;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            ${filterAge!=null ? html`
              <div style="background:rgba(255,255,255,.03);border:1px solid ${filterWarn?'rgba(239,68,68,.3)':'rgba(255,255,255,.1)'};border-radius:10px;padding:7px;position:relative;">
                <div style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:rgba(255,255,255,.6);">
                  <ha-icon icon="mdi:air-filter" style="--mdc-icon-size:12px;"></ha-icon>Filtre
                  ${filterWarn ? html`<span style="font-size:11px;padding:1px 3px;border-radius:3px;background:rgba(239,68,68,.15);color:#ef4444;">!</span>` : html``}
                  ${w.resetFilterEntity ? html`<button style="position:absolute;top:5px;right:5px;width:16px;height:16px;border-radius:3px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;" @click="${(e)=>{e.stopPropagation();pressReset(w.resetFilterEntity);}}">✓</button>` : html``}
                </div>
                <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin:4px 0;"><div style="height:100%;width:${filterPct.toFixed(2)}%;background:${filterWarn?'#ef4444':'#10b981'};border-radius:2px;"></div></div>
                <div style="font-size:12px;color:#fff;font-weight:500;text-align:right;">${Math.round(filterAge)} j / ${filterMax} j</div>
              </div>` : html``}
            ${chloreAge!=null ? html`
              <div style="background:rgba(255,255,255,.03);border:1px solid ${chloreWarn?'rgba(239,68,68,.3)':'rgba(255,255,255,.1)'};border-radius:10px;padding:7px;position:relative;">
                <div style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:rgba(255,255,255,.6);">
                  <ha-icon icon="mdi:flask-outline" style="--mdc-icon-size:12px;"></ha-icon>Chlore
                  ${chloreWarn ? html`<span style="font-size:11px;padding:1px 3px;border-radius:3px;background:rgba(239,68,68,.15);color:#ef4444;">!</span>` : html``}
                  ${w.resetChlorineEntity ? html`<button style="position:absolute;top:5px;right:5px;width:16px;height:16px;border-radius:3px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;" @click="${(e)=>{e.stopPropagation();pressReset(w.resetChlorineEntity);}}">✓</button>` : html``}
                </div>
                <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin:4px 0;"><div style="height:100%;width:${chlorePct.toFixed(2)}%;background:${chloreWarn?'#ef4444':'#10b981'};border-radius:2px;"></div></div>
                <div style="font-size:12px;color:#fff;font-weight:500;text-align:right;">${Math.round(chloreAge)} j / ${chloreMax} j</div>
              </div>` : html``}
          </div>` : html``}

        ${(w.leakEntity||w.tamperEntity||w.floodBatEntity) ? html`
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:10px;font-size:12px;font-weight:600;
            ${alerting?'background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:#ef4444;':'background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.15);color:#10b981;'}">
            <div style="display:flex;align-items:center;gap:6px;">
              <ha-icon icon="${leak?'mdi:water-alert':tamper?'mdi:shield-alert':'mdi:shield-check'}" style="--mdc-icon-size:14px;"></ha-icon>
              <span>${leak?'FUITE DÉTECTÉE !':tamper?'SABOTAGE !':'Sécurité OK'}</span>
            </div>
            ${bat!=null ? html`<div style="display:flex;align-items:center;gap:3px;padding:1px 5px;border-radius:5px;font-size:12px;background:${batLow?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)'};color:${batLow?'#ef4444':'#fff'};"><ha-icon icon="${batLow?'mdi:battery-alert':'mdi:battery'}" style="--mdc-icon-size:11px;"></ha-icon>${Math.round(bat)}%</div>` : html``}
          </div>` : html``}
      </div>`;

    const renderChem = () => html`
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${chemGauge(ph,   Number(w.ph_min||7),   Number(w.ph_max||7.6),  'pH',  '')}
        ${chemGauge(orp,  Number(w.orp_min||650), Number(w.orp_max||800), 'ORP', 'mV')}
        ${chemGauge(tds,  Number(w.tds_min||500), Number(w.tds_max||2000),'TDS', 'ppm')}
        ${chemGauge(salt, Number(w.salt_min||300), Number(w.salt_max||500),'Sel', 'ppm')}
        ${ph==null&&orp==null&&tds==null&&salt==null ? html`<div style="color:rgba(255,255,255,.4);font-size:13px;text-align:center;padding:20px;">Aucune entité chimie configurée</div>` : html``}
      </div>`;

    const renderSw = () => html`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-content:start;">
        ${switches.map(({eid,name}) => {
          const s     = this.hass?.states[eid];
          const swOn  = s?.state === 'on';
          const dom   = eid.split('.')[0];
          const icons = {light:'mdi:lightbulb',switch:'mdi:power-plug',input_boolean:'mdi:toggle-switch'};
          const icon  = s?.attributes?.icon || icons[dom] || 'mdi:power';
          return html`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;
                        background:${swOn?'rgba(16,185,129,.1)':'rgba(255,255,255,.04)'};
                        border:1px solid ${swOn?'rgba(16,185,129,.3)':'rgba(255,255,255,.08)'};
                        border-radius:10px;padding:7px 10px;cursor:pointer;transition:.2s;"
                 @click="${(e)=>{e.stopPropagation();const t=e.currentTarget;t.style.transform='scale(.96)';setTimeout(()=>{t.style.transform='';},150);toggleSw(eid);}}">
              <div style="display:flex;align-items:center;gap:6px;min-width:0;pointer-events:none;">
                <ha-icon icon="${icon}"
                  style="--mdc-icon-size:16px;flex-shrink:0;color:${swOn?'#10b981':'rgba(255,255,255,.5)'};">
                </ha-icon>
                <span style="font-size:12px;font-weight:600;color:${swOn?'#fff':'rgba(255,255,255,.6)'};
                             white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</span>
              </div>
              <div style="flex-shrink:0;width:32px;height:18px;border-radius:9px;
                          background:${swOn?'#10b981':'rgba(255,255,255,.15)'};
                          position:relative;transition:.25s;pointer-events:none;">
                <div style="position:absolute;top:2px;left:${swOn?'14px':'2px'};
                            width:14px;height:14px;border-radius:50%;background:#fff;
                            box-shadow:0 1px 3px rgba(0,0,0,.3);transition:.25s;"></div>
              </div>
            </div>`;
        })}
        ${switches.length===0 ? html`
          <div style="grid-column:span 2;text-align:center;color:rgba(255,255,255,.3);font-size:12px;padding:20px;">
            Aucun interrupteur configuré
          </div>` : html``}
      </div>`;

    const renderProg = () => {
      const vol    = Number(w.lz_volume   || 500);
      const power  = Number(w.lz_power_w  || 2000);
      const loss   = Number(w.lz_heat_loss || 25) / 100;
      const effP   = power * (1 - loss);
      const deltaT = (tTemp || 34) - (wTemp || 20);
      const ttrMin = deltaT > 0 ? Math.round((vol * 4186 * deltaT) / (effP * 60)) : 0;
      const ttrH   = Math.floor(ttrMin / 60);
      const ttrM   = ttrMin % 60;

      const readyStr = schedState
        ? `${String(schedH).padStart(2,'0')}:${String(schedM).padStart(2,'0')}`
        : '--:--';

      let startH = schedH - ttrH, startM = schedM - ttrM;
      if (startM < 0) { startM += 60; startH--; }
      startH = ((startH % 24) + 24) % 24;
      const startStr = schedState
        ? `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`
        : '--:--';

      const ttrEntity = w.ttrEntity ? this.hass?.states[w.ttrEntity] : null;
      const ttrDisplay = ttrEntity
        ? ttrEntity.state + ' ' + (ttrEntity.attributes.unit_of_measurement || '')
        : `${ttrH}h ${String(ttrM).padStart(2,'0')}m`;

      return html`
        <div style="display:flex;flex-direction:column;gap:8px;height:100%;">
          ${schedId && schedState ? html`
            <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px;flex-shrink:0;">
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:1px;margin-bottom:8px;">
                <ha-icon icon="mdi:clock-time-four-outline" style="--mdc-icon-size:14px;color:#6b8eff;"></ha-icon>
                HEURE SOUHAITÉE PRÊT
              </div>
              <div style="text-align:center;font-size:42px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1;">
                ${readyStr}
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;">
                ${[[-1,0,'-1h'],[0,-15,'-15m'],[0,15,'+15m'],[1,0,'+1h']].map(([dh,dm,lbl]) => html`
                  <button style="border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);
                                 border-radius:8px;padding:7px 0;color:#fff;font-size:12px;
                                 font-weight:700;cursor:pointer;font-family:inherit;transition:.15s;"
                    @click="${(e)=>{e.stopPropagation();changeSchedTime(dh,dm);}}">${lbl}</button>`)}
              </div>
            </div>
          ` : html`
            <div style="color:rgba(255,255,255,.3);font-size:12px;text-align:center;padding:10px;">
              Configurez scheduleEntity pour activer la programmation
            </div>`}

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-shrink:0;">
            <div style="background:rgba(107,142,255,.06);border:1px solid rgba(107,142,255,.2);border-radius:12px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">TEMPS DE CHAUFFE</div>
              <div style="font-size:22px;font-weight:800;color:#6b8eff;line-height:1;">${ttrDisplay}</div>
              <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:3px;">${vol}L · ${power}W · -${Math.round(loss*100)}% pertes</div>
            </div>
            <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">LANCER LA CHAUFFE À</div>
              <div style="font-size:22px;font-weight:800;color:#10b981;line-height:1;">${startStr}</div>
              <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:3px;">${wTemp!=null?wTemp.toFixed(2)+'°':'--°'} → ${tTemp!=null?tTemp+'°':'--°'} eau</div>
            </div>
          </div>

          ${wTemp!=null && tTemp!=null ? html`
            <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;flex-shrink:0;">
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">
                <span style="color:rgba(255,255,255,.5);">Température actuelle</span>
                <span style="color:${tc};">${wTemp.toFixed(2)}° / ${tTemp}°</span>
              </div>
              <div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100,(wTemp/tTemp)*100).toFixed(2)}%;
                            background:linear-gradient(90deg,#6b8eff,${tc});
                            border-radius:4px;transition:width .6s ease;"></div>
              </div>
            </div>
          ` : html``}

          <!-- ACTIONS : programmation auto + chauffe immédiate -->
          <div style="display:grid;grid-template-columns:${w.progEnableEntity ? '1fr 1fr' : '1fr'};gap:8px;flex-shrink:0;">
            ${w.progEnableEntity ? (() => {
              const pe  = this.hass?.states[w.progEnableEntity];
              const pOn = pe?.state === 'on';
              return html`
                <button style="border:2px solid ${pOn?'#10b981':'rgba(255,255,255,.18)'};
                               background:${pOn?'rgba(16,185,129,.15)':'rgba(255,255,255,.05)'};
                               border-radius:12px;padding:12px 8px;cursor:pointer;font-family:inherit;
                               display:flex;flex-direction:column;align-items:center;gap:4px;transition:.2s;"
                  @click="${(e)=>{e.stopPropagation();this.hass.callService('input_boolean','toggle',{entity_id:w.progEnableEntity});}}">
                  <span style="font-size:13px;font-weight:800;letter-spacing:1px;color:${pOn?'#10b981':'rgba(255,255,255,.5)'};">
                    ⏰ PROGRAMMATION ${pOn?'ACTIVE':'INACTIVE'}
                  </span>
                  <span style="font-size:12px;color:rgba(255,255,255,.45);">
                    ${pOn ? 'chauffe auto à ' + startStr : 'toucher pour activer'}
                  </span>
                </button>`;
            })() : html``}
            <button style="border:2px solid ${isOn?'#ff9900':'#ef4444'};
                           background:${isOn?'rgba(255,153,0,.15)':'rgba(239,68,68,.12)'};
                           border-radius:12px;padding:12px 8px;cursor:pointer;font-family:inherit;
                           display:flex;flex-direction:column;align-items:center;gap:4px;transition:.2s;"
              @click="${(e)=>{e.stopPropagation();if(tid)this.hass.callService('climate','set_hvac_mode',{entity_id:tid,hvac_mode:isOn?'off':'heat'});}}">
              <span style="font-size:13px;font-weight:800;letter-spacing:1px;color:${isOn?'#ff9900':'#ef4444'};">
                ${isOn ? '■ ARRÊTER LA CHAUFFE' : '🔥 CHAUFFER MAINTENANT'}
              </span>
              <span style="font-size:12px;color:rgba(255,255,255,.45);">${isOn ? 'chauffe en cours' : 'démarrage immédiat'}</span>
            </button>
          </div>
        </div>`;
    };

    const renderCam = () => html`
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${camUrl ? html`
          <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1);">
            <img src="${camUrl}" style="width:100%;display:block;object-fit:cover;" alt="Caméra Spa" />
          </div>` : html`<div style="color:rgba(255,255,255,.4);font-size:13px;text-align:center;padding:20px;">Aucune caméra configurée</div>`}
        ${schedId && schedState ? html`
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:rgba(255,255,255,.6);letter-spacing:.5px;">
              <ha-icon icon="mdi:clock-digital" style="--mdc-icon-size:15px;color:#6b8eff;"></ha-icon>
              PLANIFICATION CHAUFFE
            </div>
            <div style="text-align:center;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px;">
              ${String(schedH).padStart(2,'0')}:${String(schedM).padStart(2,'0')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
              ${[[-1,0,'-1h'],[0,-15,'-15m'],[0,15,'+15m'],[1,0,'+1h']].map(([dh,dm,lbl]) => html`
                <button style="border:none;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:7px 0;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;"
                  @click="${(e)=>{e.stopPropagation();changeSchedTime(dh,dm);}}">${lbl}</button>`)}
            </div>
          </div>` : html``}
      </div>`;

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} border-color:${color}22; overflow:hidden; position:relative;">
        <div style="position:absolute;inset:0;background:${bg};background-size:cover;background-position:center;filter:blur(${blur}px);transform:scale(1.05);"></div>
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.38);"></div>
        <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;overflow:hidden;">
          <div style="flex:1;overflow:hidden;padding:8px 10px;display:flex;flex-direction:column;">
            ${tab==='home' ? renderHome() : html``}
            ${tab==='chem' ? renderChem() : html``}
            ${tab==='sw'   ? renderSw()   : html``}
            ${tab==='prog' ? renderProg() : html``}
            ${tab==='cam'  ? renderCam()  : html``}
          </div>
        </div>
      </div>`;
  }

  _renderHealthWidget(w, sizeStyle, noBorder=false) {
    const people = w.people || [];
    if (people.length === 0) return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} background:#0d1321;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:14px;">
        Aucune personne configurée ✏️
      </div>`;

    const CAT_CFG = {
      forme:     { label: '⚡ Forme',     color: '#06b6d4' },
      sante:     { label: '🩺 Santé',     color: '#10b981' },
      sommeil:   { label: '🌙 Sommeil',   color: '#818cf8' },
      nutrition: { label: '🥗 Nutrition', color: '#f59e0b' },
    };
    const CAT_ORDER = ['forme','sante','sommeil','nutrition'];

    const getSt  = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const fmt    = (v, u) => {
      const n = parseFloat(v);
      const s = isNaN(n) ? (v||'--') : n.toLocaleString('fr-FR',{maximumFractionDigits:2});
      return s + (u||'');
    };

    const totalH = parseInt(w.heightPx) || 570;

    const renderPerson = (p) => {
      const wRaw = getSt(p.weight_entity);
      const wCur = wRaw != null ? parseFloat(wRaw) : null;
      const wSt  = parseFloat(p.start)  || wCur || 80;
      const wId  = parseFloat(p.ideal)  || 75;
      const wDiff = wCur != null ? wCur - wSt : null;
      const wPct  = wCur != null ? Math.min(100,Math.max(0,(Math.abs(wSt-wCur)/Math.max(.01,Math.abs(wSt-wId)))*100)) : 0;
      const wCol  = wDiff != null && wDiff <= 0 ? '#10b981' : '#ef4444';
      const initials = (p.name||'?')[0].toUpperCase();

      const groups = {};
      (p.sensors||[]).forEach(s => {
        const c = s.cat||'forme';
        if (c === 'sommeil') return; // catégorie sommeil masquée
        if (!groups[c]) groups[c]=[];
        groups[c].push(s);
      });
      const cats = CAT_ORDER.filter(k => groups[k]?.length > 0);

      const headerH  = 58;
      const weightH  = wCur != null ? 42 : 0;
      const ecgH     = 22;
      const bodyPad  = 8;
      const gapInner = 5;
      const nGaps    = cats.length + (wCur!=null?1:0);

      const availH = totalH - ecgH - bodyPad - headerH - weightH - (nGaps * gapInner);

      const CELL_H    = 64;
      const SEC_HDR_H = 18;

      const secHeights = cats.map(cat => {
        const n    = groups[cat].length;
        const cols = n <= 3 ? n : Math.ceil(n/2);
        const rows = Math.ceil(n/cols);
        return { cat, n, cols, rows, h: SEC_HDR_H + rows * CELL_H + (rows-1)*2 + 6 };
      });

      const totalNatural = secHeights.reduce((s,m) => s+m.h, 0);
      const scale = totalNatural > availH && availH > 0 ? availH / totalNatural : 1;

      const scaledCellH = Math.floor(CELL_H * scale);
      const scaledHdrH  = Math.floor(SEC_HDR_H * scale);

      const finalSecs = cats.map(cat => {
        const n    = groups[cat].length;
        const cols = n <= 3 ? n : Math.ceil(n/2);
        const rows = Math.ceil(n/cols);
        const h    = scaledHdrH + rows * scaledCellH + (rows-1)*2 + 4;
        return { cat, n, cols, rows, h };
      });

      const iconSize = Math.max(14, Math.round(16 * scale));
      const nameFontSize = Math.max(9, Math.round(10 * scale));
      const valFontSize  = Math.max(12, Math.round(13 * scale));

      return html`
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:${gapInner}px;
                    overflow:hidden;box-sizing:border-box;padding:4px;">
          <div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:5px 8px;
                      background:#111827;border-radius:10px;border:1px solid #1e2d3d;height:${headerH}px;
                      box-sizing:border-box;">
            <div style="width:34px;height:34px;border-radius:50%;background:#1e2d3d;
                        border:2px solid #06b6d4;overflow:hidden;display:flex;
                        align-items:center;justify-content:center;flex-shrink:0;">
              ${p.image
                ? html`<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;" />`
                : html`<span style="font-size:15px;font-weight:800;color:#06b6d4;">${initials}</span>`}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:700;color:#f1f5f9;white-space:nowrap;
                          overflow:hidden;text-overflow:ellipsis;">${p.name||'—'}</div>
              ${wCur!=null ? html`
                <div style="display:flex;align-items:center;gap:4px;">
                  <span style="font-size:14px;font-weight:800;color:#06b6d4;
                               font-family:'Courier New',monospace;">${wCur.toFixed(2)} kg</span>
                  <span style="font-size:14px;font-weight:700;color:${wCol};">
                    ${wDiff!=null?(wDiff>0?'+':'')+wDiff.toFixed(2)+'kg':''}
                  </span>
                </div>` : html``}
            </div>
          </div>

          ${wCur!=null ? html`
            <div style="flex-shrink:0;height:${weightH}px;padding:5px 8px;background:#0d1b2e;
                        border-radius:8px;border:1px solid #1e3a5f;box-sizing:border-box;
                        display:flex;flex-direction:column;justify-content:space-between;">
              <div style="display:flex;justify-content:space-between;font-size:14px;
                          color:#cbd5e1;font-weight:700;">
                <span>🏁 ${wSt} kg</span>
                <span style="color:#06b6d4;">${Math.round(wPct)}% — ${Math.abs(wCur-wId).toFixed(2)} kg restants</span>
                <span>🎯 ${wId} kg</span>
              </div>
              <div style="height:4px;background:#1e2d3d;border-radius:2px;overflow:hidden;">
                <div style="height:100%;width:${wPct.toFixed(2)}%;
                            background:linear-gradient(90deg,#06b6d4,#10b981);
                            border-radius:2px;transition:width 1.2s;"></div>
              </div>
            </div>` : html``}

          ${finalSecs.map(({cat, cols, h}) => {
            const cfg  = CAT_CFG[cat];
            const sens = groups[cat];
            return html`
              <div style="flex-shrink:0;height:${h}px;border-radius:8px;
                          border:1px solid ${cfg.color}25;background:${cfg.color}08;
                          display:flex;flex-direction:column;overflow:hidden;">
                <div style="flex-shrink:0;height:${scaledHdrH}px;padding:0 7px;
                            font-size:${Math.max(7,scaledHdrH-6)}px;font-weight:800;
                            letter-spacing:.8px;text-transform:uppercase;color:${cfg.color};
                            background:${cfg.color}14;display:flex;align-items:center;gap:4px;">
                  <span style="width:4px;height:4px;border-radius:50%;
                               background:${cfg.color};flex-shrink:0;"></span>
                  ${cfg.label}
                </div>
                <div style="flex:1;display:grid;grid-template-columns:repeat(${cols},1fr);
                            gap:2px;padding:2px 3px 3px;overflow:hidden;">
                  ${sens.map(s => {
                    const val = getSt(s.entity);
                    const col = s.col || cfg.color;
                    return html`
                      <div style="display:flex;flex-direction:column;align-items:center;
                                  justify-content:center;gap:1px;background:rgba(255,255,255,.03);
                                  border:1px solid ${col}20;border-radius:5px;overflow:hidden;
                                  padding:1px;">
                        <ha-icon icon="${s.icon||'mdi:circle'}"
                          style="--mdc-icon-size:${iconSize}px;color:${col};flex-shrink:0;">
                        </ha-icon>
                        <div style="font-size:${nameFontSize}px;color:#cbd5e1;text-transform:uppercase;
                                    letter-spacing:.2px;font-weight:700;line-height:1;text-align:center;
                                    width:100%;overflow:hidden;text-overflow:ellipsis;
                                    white-space:nowrap;padding:0 1px;">
                          ${s.name||'—'}
                        </div>
                        <div style="font-size:${valFontSize}px;font-weight:800;color:${col};
                                    font-family:'Courier New',monospace;line-height:1;
                                    text-align:center;overflow:hidden;text-overflow:ellipsis;
                                    white-space:nowrap;width:100%;padding:0 2px;">
                          ${val!=null?fmt(val,s.unit):'--'}
                        </div>
                      </div>`;
                  })}
                </div>
              </div>`;
          })}
        </div>`;
    };

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} background:#0d1321; border-color:#06b6d433;
                  font-family:'Roboto','Segoe UI',sans-serif; overflow:hidden;
                  position:relative; display:flex; flex-direction:column;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;
                    background:linear-gradient(90deg,#06b6d4,#818cf8,#10b981);z-index:5;"></div>
        <div style="flex-shrink:0;height:22px;background:#111827;border-bottom:1px solid #1e2d3d;
                    display:flex;align-items:center;padding:0 10px;gap:8px;">
          <span style="font-size:15px;font-weight:800;color:#06b6d4;letter-spacing:1px;">BIOMÉTRIE & SANTÉ</span>
          <div style="flex:1;height:14px;overflow:hidden;opacity:.4;position:relative;">
            <svg viewBox="0 0 200 30" fill="none" preserveAspectRatio="none"
                 style="position:absolute;left:0;top:0;width:200%;height:100%;animation:ecg-health 2s linear infinite;">
              <path d="M0,15 L25,15 L32,4 L39,26 L46,2 L53,28 L60,15 L100,15 L107,4 L114,26 L121,2 L128,28 L135,15 L200,15"
                    stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <div style="flex:1;display:flex;gap:4px;padding:0 4px 4px;overflow:hidden;">
          ${people.map(p => renderPerson(p))}
        </div>
        <style>
          @keyframes ecg-health { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        </style>
      </div>`;
  }

  _renderPlantWidget(w, sizeStyle, noBorder=false) {
    const getSt  = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const batRaw = getSt(w.battery_sensor);
    const bat    = batRaw != null ? parseFloat(batRaw) : null;
    const batCol = bat == null ? '#475569' : bat <= 20 ? '#ef4444' : bat <= 50 ? '#f59e0b' : '#22c55e';
    const sensors = w.sensors || [];

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} background:#0d1321;border-color:#22c55e22;overflow:hidden;
                  position:relative;display:flex;flex-direction:column;font-family:'Roboto','Segoe UI',sans-serif;padding:10px;gap:8px;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#22c55e,#86efac);z-index:5;"></div>
        <div style="flex-shrink:0;display:flex;align-items:center;gap:10px;">
          ${w.plant_image ? html`
            <div style="width:56px;height:72px;flex-shrink:0;border:1px solid #1e2d3d;border-radius:8px;overflow:hidden;background:#000;">
              <img src="${w.plant_image}" style="width:100%;height:100%;object-fit:cover;opacity:.85;" />
            </div>` : html``}
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:#f1f5f9;text-transform:uppercase;">${w.plant_name||'Plante'}</div>
            <div style="font-size:12px;color:#64748b;font-style:italic;">${w.latin_name||''}</div>
            ${bat!=null ? html`
              <div style="display:inline-flex;align-items:center;gap:3px;margin-top:4px;padding:1px 6px;border-radius:6px;
                          background:${batCol}18;color:${batCol};font-size:12px;font-weight:700;">
                <ha-icon icon="mdi:battery" style="--mdc-icon-size:12px;"></ha-icon>${Math.round(bat)}%
              </div>` : html``}
          </div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px;overflow:hidden;">
          ${sensors.map(s => {
            const raw = getSt(s.entity);
            const val = raw != null ? parseFloat(raw) : null;
            const max = Number(s.max || 100);
            const pct = val != null ? Math.min(100, Math.max(0, val/max*100)) : 0;
            const col = s.color || '#22c55e';
            return html`
              <div style="display:flex;flex-direction:column;gap:3px;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                  <div style="display:flex;align-items:center;gap:5px;color:#94a3b8;">
                    <ha-icon icon="${s.icon||'mdi:circle'}" style="--mdc-icon-size:13px;color:${col};"></ha-icon>${s.name||'—'}
                  </div>
                  <span style="color:${col};font-weight:700;">${val!=null?val.toLocaleString('fr-FR',{maximumFractionDigits:2}):'--'}${s.unit||''}</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;">
                  <div style="height:100%;width:${pct.toFixed(2)}%;background:${col};box-shadow:0 0 5px ${col}88;border-radius:2px;transition:width .6s;"></div>
                </div>
              </div>`;
          })}
        </div>
      </div>`;
  }

  _renderServerWidget(w, sizeStyle, noBorder=false) {
    const getSt  = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const getObj = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid] : null;
    const fmt    = (v, dec=2) => { const n=parseFloat(v); return isNaN(n)?String(v||'--'):n.toFixed(dec); };

    const cpuVal   = parseFloat(getSt(w.cpu_entity))    || 0;
    const ramVal   = parseFloat(getSt(w.ram_entity))    || 0;
    const hddVal   = parseFloat(getSt(w.hdd_entity))    || 0;
    const uptimeSt = getObj(w.uptime_entity);
    const statusSt = getObj(w.status_entity);
    const statusOk = statusSt ? ['on','ok','running','online','true'].includes(String(statusSt.state).toLowerCase()) : null;
    const uptimeVal= uptimeSt ? uptimeSt.state : '--';
    const uptimeUnit= uptimeSt?.attributes?.unit_of_measurement || '';

    const disks = w.disks || [];
    const procVal  = getSt(w.process_entity);

    const cpuColor = cpuVal >= 85 ? '#ef4444' : cpuVal >= 60 ? '#f59e0b' : '#00ff88';
    const ramColor = ramVal >= 85 ? '#ef4444' : ramVal >= 60 ? '#f59e0b' : '#06b6d4';
    const hddColor = hddVal >= 90 ? '#ef4444' : hddVal >= 70 ? '#f59e0b' : '#818cf8';

    const radialGauge = (pct, col, label, val, unit='%', size=80) => {
      const r = 28; const cx = 40; const cy = 38;
      const circ = 2*Math.PI*r;
      const dash = circ * 0.75;
      const offset = dash * (1 - Math.min(pct,100)/100);
      const startAngle = -210; const sweepAngle = 270;
      const toR = a => a*Math.PI/180;
      const sx = cx + r*Math.cos(toR(startAngle));
      const sy = cy + r*Math.sin(toR(startAngle));
      const ex = cx + r*Math.cos(toR(startAngle+sweepAngle));
      const ey = cy + r*Math.sin(toR(startAngle+sweepAngle));
      return html`
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
          <svg width="${size}" height="${Math.round(size*0.88)}" viewBox="0 0 80 70" style="overflow:visible;">
            <path fill="none" stroke="#1e1e2e" stroke-width="7" stroke-linecap="round"
              d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}"/>
            <path fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round"
              stroke-dasharray="${dash.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
              d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}"
              style="filter:drop-shadow(0 0 4px ${col});transition:stroke-dashoffset .8s;"/>
            <text x="${cx}" y="${cy-2}" text-anchor="middle"
              style="fill:${col};font-size:13px;font-weight:900;font-family:'Courier New',monospace;">${val}</text>
            <text x="${cx}" y="${cy+11}" text-anchor="middle"
              style="fill:#555;font-size:10px;font-family:'Courier New',monospace;">${unit}</text>
          </svg>
          <div style="font-size:12px;font-weight:700;color:#cbd5e1;letter-spacing:.8px;text-transform:uppercase;">${label}</div>
        </div>`;
    };

    const diskBar = (disk) => {
      const val = parseFloat(getSt(disk.entity));
      if (isNaN(val)) return html``;
      const pct = Math.min(val, 100);
      const col = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#818cf8';
      return html`
        <div style="display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-family:'Courier New',monospace;">
            <div style="display:flex;align-items:center;gap:5px;">
              <ha-icon icon="${disk.icon||'mdi:harddisk'}" style="--mdc-icon-size:12px;color:${col};"></ha-icon>
              <span style="color:#cbd5e1;text-transform:uppercase;letter-spacing:.5px;">${disk.label||disk.entity}</span>
            </div>
            <span style="color:${col};font-weight:700;">${val.toFixed(2)}${disk.unit||' %'}</span>
          </div>
          <div style="height:5px;background:#111;border:1px solid ${col}22;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${col};border-radius:3px;
                        box-shadow:0 0 6px ${col}66;transition:width .6s;
                        background-image:linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);
                        background-size:8px 100%;"></div>
          </div>
        </div>`;
    };

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle}; background:#050a14; border-color:#00ff8822;
                  overflow:hidden; position:relative; font-family:'Courier New',monospace;">
        <div style="position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:linear-gradient(rgba(0,255,136,.03) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(0,255,136,.03) 1px,transparent 1px);
          background-size:24px 24px;"></div>
        <div style="position:relative;z-index:1;padding:10px;display:flex;
                    flex-direction:column;gap:8px;height:100%;box-sizing:border-box;">
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;
                      border-bottom:1px solid #00ff8820;padding-bottom:7px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <ha-icon icon="${w.server_icon||'mdi:server'}"
                style="--mdc-icon-size:18px;color:#00ff88;filter:drop-shadow(0 0 4px #00ff88);"></ha-icon>
              <div>
                <div style="font-size:13px;font-weight:bold;color:#fff;text-transform:uppercase;
                            letter-spacing:1px;text-shadow:0 0 8px #00ff8866;">${w.server_name||'SERVEUR'}</div>
                <div style="font-size:12px;color:#cbd5e1;letter-spacing:.8px;">${w.server_os||'SYSTEM ONLINE'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              ${statusSt != null ? html`
                <div style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;
                            padding:3px 8px;border-radius:4px;
                            background:${statusOk?'rgba(0,255,136,.08)':'rgba(239,68,68,.08)'};
                            border:1px solid ${statusOk?'#00ff8844':'#ef444444'};
                            color:${statusOk?'#00ff88':'#ef4444'};">
                  <span style="width:5px;height:5px;border-radius:50%;
                               background:${statusOk?'#00ff88':'#ef4444'};
                               box-shadow:0 0 5px ${statusOk?'#00ff88':'#ef4444'};
                               ${statusOk?'':'animation:batt-flash 1s infinite alternate;'}"></span>
                  ${statusOk?'ONLINE':'OFFLINE'}
                </div>` : html``}
              ${uptimeSt ? html`
                <div style="font-size:12px;color:#cbd5e1;font-weight:700;">
                  ⏱ ${(() => {
                    const h = parseFloat(uptimeVal);
                    if (isNaN(h)) return uptimeVal + ' ' + uptimeUnit;
                    if (h >= 48) { const d=Math.floor(h/24); const hh=Math.floor(h%24); return d+'j '+hh+'h'; }
                    if (h >= 1)  return h.toFixed(1) + ' h';
                    return Math.round(h*60) + ' min';
                  })()}
                </div>` : html``}
              ${w.restart_entity ? html`
                <button style="background:rgba(239,68,68,.08);border:1px solid #ef444433;
                               color:#ef4444;font-family:inherit;font-size:12px;font-weight:700;
                               padding:3px 8px;cursor:pointer;letter-spacing:.5px;"
                  @click="${(e)=>{e.stopPropagation();
                    this.hass.callService('button','press',{entity_id:w.restart_entity});}}">
                  ⟳ RESTART
                </button>` : html``}
            </div>
          </div>

          <div style="flex-shrink:0;display:flex;justify-content:space-around;
                      background:rgba(0,0,0,.4);border:1px solid #0f1f0f;
                      border-radius:8px;padding:6px 0;">
            ${radialGauge(cpuVal, cpuColor, 'CPU', fmt(cpuVal,0), '%', 80)}
            ${radialGauge(ramVal, ramColor, 'RAM', fmt(ramVal,0), '%', 80)}
            ${hddVal ? radialGauge(hddVal, hddColor, 'HDD', fmt(hddVal,0), '%', 80) : html``}
            ${procVal != null ? html`
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
                <div style="width:80px;height:70px;display:flex;flex-direction:column;
                            align-items:center;justify-content:center;gap:4px;">
                  <ha-icon icon="mdi:cpu-64-bit" style="--mdc-icon-size:22px;color:#f59e0b;
                    filter:drop-shadow(0 0 4px #f59e0b);"></ha-icon>
                  <div style="font-size:18px;font-weight:900;color:#f59e0b;
                              font-family:'Courier New',monospace;line-height:1;">${procVal}</div>
                  <div style="font-size:11px;color:#64748b;">PROC.</div>
                </div>
                <div style="font-size:12px;font-weight:700;color:#cbd5e1;letter-spacing:.8px;
                            text-transform:uppercase;">PROCESSUS</div>
              </div>` : html``}
          </div>

          ${disks.length > 0 ? html`
            <div style="flex:1;display:flex;flex-direction:column;gap:5px;
                        background:rgba(0,0,0,.3);border:1px solid #0f1f0f;
                        border-radius:8px;padding:8px 10px;overflow:hidden;">
              <div style="flex-shrink:0;font-size:12px;font-weight:700;color:#00ff8866;
                          letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">◈ STOCKAGE</div>
              ${disks.map(d => diskBar(d))}
            </div>` : html``}
        </div>
      </div>`;
  }

  _renderTankWidget(w, sizeStyle, noBorder=false) {
    const getSt = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const num   = (eid) => { const v = parseFloat(getSt(eid)); return isNaN(v) ? null : v; };
    const unit  = (eid) => this.hass?.states[eid]?.attributes?.unit_of_measurement || '';
    const cap   = Number(w.capacity || 1000);
    const level = num(w.tank_level_entity);
    const vol   = num(w.tank_volume_entity);
    const lvlPct = level != null ? Math.min(100, Math.max(0, level)) : (vol != null ? Math.min(100, vol/cap*100) : 0);
    const waterCol = '#5ec8ff';
    const alert  = getSt(w.alert_entity) === 'on';
    const fmtNum = (v) => v != null ? v.toLocaleString('fr-FR', {maximumFractionDigits: 1}) : '--';

    // ── Tuile statistique (icône colorée + libellé + grosse valeur + unité à droite) ──
    const statTile = (iconBg, iconCol, icon, label, value, un, sub) => html`
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;
                  padding:8px 16px;display:flex;align-items:center;gap:12px;min-width:0;min-height:0;overflow:hidden;position:relative;">
        <div style="width:46px;height:46px;border-radius:13px;background:${iconBg};display:flex;align-items:center;
                    justify-content:center;flex-shrink:0;box-shadow:0 0 14px ${iconBg};">
          <ha-icon icon="${icon}" style="--mdc-icon-size:25px;color:${iconCol};"></ha-icon>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;color:#94a3b8;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
          <div style="font-size:26px;font-weight:800;color:#f1f5f9;line-height:1.15;">${value}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
          ${sub ? html`<span style="font-size:14px;color:#94a3b8;">${sub}</span>` : html``}
          ${un  ? html`<span style="font-size:14px;color:#64748b;font-weight:600;">${un}</span>` : html``}
        </div>
      </div>`;

    // ── Tuile température (libellé + valeur colorée) ──
    const tempTile = (label, eid, col) => {
      const v = num(eid);
      return html`
        <div style="flex:1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;
                    padding:10px 14px;display:flex;flex-direction:column;align-items:flex-end;gap:3px;min-width:0;">
          <div style="font-size:14px;color:#94a3b8;font-weight:600;">${label}</div>
          <div style="font-size:22px;font-weight:800;color:${col};">${v!=null?v.toFixed(1):'--'}°C</div>
        </div>`;
    };

    // ── Commandes : interrupteurs + volets ──
    const switches = w.switches || [];
    const covers   = w.covers || [];
    const swRow = (s) => {
      const st  = this.hass?.states[s.entity];
      const on  = st?.state === 'on';
      return html`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,.02);
                    border:1px solid rgba(255,255,255,.05);border-radius:12px;">
          <ha-icon icon="${s.icon || 'mdi:power-plug'}" style="--mdc-icon-size:24px;color:#818cf8;flex-shrink:0;"></ha-icon>
          <span style="flex:1;font-size:16px;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name || s.entity}</span>
          <button style="border:none;border-radius:10px;padding:8px 18px;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;
                         background:${on?'#4f46e5':'rgba(255,255,255,.08)'};color:${on?'#fff':'#94a3b8'};transition:.2s;"
            @click="${(e)=>{e.stopPropagation();const d=s.entity.split('.')[0];this.hass.callService(d==='light'?'light':'switch','toggle',{entity_id:s.entity});}}">
            ${on?'Allumé':'Éteint'}
          </button>
        </div>`;
    };
    const coverRow = (c) => {
      const st  = this.hass?.states[c.entity];
      const pos = st?.attributes?.current_position;
      const btn = (icon, svc) => html`
        <button style="width:42px;height:38px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.05);
                       color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;"
          @click="${(e)=>{e.stopPropagation();this.hass.callService('cover',svc,{entity_id:c.entity});}}">
          <ha-icon icon="${icon}" style="--mdc-icon-size:20px;"></ha-icon>
        </button>`;
      return html`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,.02);
                    border:1px solid rgba(255,255,255,.05);border-radius:12px;">
          <ha-icon icon="${c.icon || 'mdi:window-shutter'}" style="--mdc-icon-size:24px;color:#22c55e;flex-shrink:0;"></ha-icon>
          <span style="flex:1;font-size:16px;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${c.name || c.entity} ${pos!=null?html`<span style="font-size:14px;color:#64748b;font-weight:600;">(${pos}%)</span>`:html``}
          </span>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            ${btn('mdi:arrow-up','open_cover')}
            ${btn('mdi:stop','stop_cover')}
            ${btn('mdi:arrow-down','close_cover')}
          </div>
        </div>`;
    };

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} background:#0a0c14;border-color:${alert?'#ef444455':'rgba(255,255,255,.06)'};overflow:hidden;
                  position:relative;display:flex;flex-direction:column;font-family:'Roboto','Segoe UI',sans-serif;border-radius:18px;">

        <div style="flex:1;min-height:0;display:flex;gap:20px;padding:18px 22px 10px;">

          <!-- ════ GAUCHE : ÉCHELLE + CUVE EN VERRE ════ -->
          <div style="flex:0 0 44%;display:flex;gap:14px;min-width:0;">

            <!-- Échelle verticale -->
            <div style="width:46px;flex-shrink:0;position:relative;margin:6px 0 34px;">
              <div style="position:absolute;right:6px;top:0;bottom:0;width:2px;background:rgba(255,255,255,.12);border-radius:1px;"></div>
              ${[100,75,50,25,0].map(g => html`
                <div style="position:absolute;right:0;bottom:calc(${g}% - 9px);display:flex;align-items:center;gap:6px;">
                  <span style="font-size:14px;color:#94a3b8;font-weight:600;">${g}%</span>
                  <span style="width:10px;height:2px;background:rgba(255,255,255,.25);"></span>
                </div>`)}
              <div style="position:absolute;right:-3px;bottom:calc(${lvlPct.toFixed(1)}% - 5px);width:16px;height:10px;border-radius:6px;
                          background:${waterCol};box-shadow:0 0 12px ${waterCol};transition:bottom 1s ease;"></div>
            </div>

            <!-- Cuve en verre -->
            <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
              <div style="flex:1;position:relative;border-radius:26px;overflow:hidden;min-height:0;
                          background:linear-gradient(160deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,.015) 35%,rgba(0,0,0,.25) 100%);
                          border:2px solid rgba(255,255,255,.12);
                          box-shadow:inset 0 2px 18px rgba(255,255,255,.05), inset 0 -10px 30px rgba(0,0,0,.5), 0 8px 30px rgba(0,0,0,.45);">
                <!-- Reflet vitre -->
                <div style="position:absolute;top:3%;left:5%;width:9%;height:80%;border-radius:20px;
                            background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0));pointer-events:none;"></div>
                <!-- Eau -->
                <div style="position:absolute;bottom:0;left:0;right:0;height:${lvlPct.toFixed(1)}%;transition:height 1.2s ease;
                            background:linear-gradient(180deg,${waterCol} 0%,#2f9be0 60%,#1c6fb0 100%);
                            box-shadow:0 -2px 18px ${waterCol}cc;">
                  <div style="position:absolute;top:-2px;left:0;right:0;height:4px;background:#dff3ff;opacity:.9;
                              border-radius:2px;filter:blur(1px);"></div>
                </div>
                <!-- % + volume centrés -->
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
                  <span style="font-size:72px;font-weight:900;color:#fff;line-height:1;
                               text-shadow:0 0 26px rgba(160,220,255,.85),0 2px 8px rgba(0,0,0,.7);">${lvlPct.toFixed(0)}%</span>
                  <span style="font-size:26px;font-weight:700;color:#e2e8f0;text-shadow:0 1px 6px rgba(0,0,0,.7);">${fmtNum(vol)} L</span>
                </div>
              </div>
              <!-- Sous la cuve -->
              <div style="flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:10px 6px 0;">
                ${alert
                  ? html`<span style="font-size:17px;font-weight:800;color:#ef4444;letter-spacing:1px;animation:batt-flash 1s infinite alternate;">ALERTE CUVE</span>`
                  : html`<span style="font-size:16px;font-weight:800;color:#22c55e;letter-spacing:1px;">NIVEAU SURVEILLÉ</span>`}
                <span style="font-size:16px;color:#94a3b8;font-weight:600;">Capacité: ${cap.toLocaleString('fr-FR')}L</span>
              </div>
            </div>
          </div>

          <!-- ════ DROITE : INFOS ════ -->
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;overflow:hidden;">

            <!-- Tuiles 2×2 (élastiques : remplissent l'espace restant) -->
            <div style="flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:10px;">
              ${statTile('rgba(79,70,229,.25)','#a5b4fc','mdi:gauge','Volume mesuré', fmtNum(vol)+' L','', 'Niveau: '+lvlPct.toFixed(0)+'%')}
              ${statTile('rgba(34,197,94,.2)','#4ade80','mdi:water-plus','Pluie Directe', fmtNum(num(w.inflow_entity)), unit(w.inflow_entity)||'L','')}
              ${statTile('rgba(56,189,248,.18)','#7dd3fc','mdi:weather-pouring','Précipitations', fmtNum(num(w.rain_entity)), unit(w.rain_entity)||'mm','')}
              ${statTile('rgba(249,115,22,.2)','#fdba74','mdi:thermometer','Temp. Extérieure', fmtNum(num(w.temp_entity)), '°C','')}
            </div>

            <!-- Suivi températures -->
            <div style="flex-shrink:0;">
              <div style="font-size:14px;font-weight:800;color:#94a3b8;letter-spacing:1.5px;margin-bottom:8px;">SUIVI TEMPÉRATURES</div>
              <div style="display:flex;gap:12px;">
                ${tempTile('Cabane', w.temp_cabane_entity, '#f59e0b')}
                ${tempTile('Min Annuel', w.temp_min_entity, '#60a5fa')}
                ${tempTile('Max Annuel', w.temp_max_entity, '#f87171')}
              </div>
            </div>

            <!-- Commandes & équipements -->
            ${(switches.length || covers.length) ? html`
              <div style="flex-shrink:0;">
                <div style="font-size:14px;font-weight:800;color:#94a3b8;letter-spacing:1.5px;margin-bottom:8px;">COMMANDES & ÉQUIPEMENTS</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${switches.map(s => swRow(s))}
                  ${covers.map(c => coverRow(c))}
                </div>
              </div>` : html``}
          </div>
        </div>

        <!-- ════ PIED : PROFONDEUR + CAPTEUR ════ -->
        <div style="flex-shrink:0;display:flex;justify-content:space-between;align-items:center;
                    padding:10px 22px;border-top:1px solid rgba(255,255,255,.07);">
          <div style="display:flex;align-items:center;gap:10px;font-size:16px;color:#94a3b8;">
            <ha-icon icon="mdi:ruler" style="--mdc-icon-size:20px;color:#64748b;"></ha-icon>
            Profondeur: <span style="font-weight:800;color:#f1f5f9;">${fmtNum(num(w.depth_entity))} ${unit(w.depth_entity)||'cm'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:16px;color:#94a3b8;">
            <ha-icon icon="mdi:access-point" style="--mdc-icon-size:20px;color:#64748b;"></ha-icon>
            Capteur: <span style="font-weight:800;color:${(getSt(w.sensor_state_entity)||'')==='normal'?'#f1f5f9':'#f59e0b'};">${getSt(w.sensor_state_entity)||'--'}</span>
          </div>
        </div>
      </div>`;
  }
  _renderTrackerWidget(w, sizeStyle, noBorder=false) {
    const persons = w.persons || [];
    const getSt  = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const getObj = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid] : null;

    const renderPerson = (p) => {
      const pObj  = getObj(p.person);
      const home  = pObj ? pObj.state === 'home' : false;
      const stateLabel = pObj ? (home ? 'À DOMICILE' : (pObj.state === 'not_home' ? 'ABSENT' : pObj.state)) : '--';
      const stCol = home ? '#22c55e' : '#f59e0b';
      const bat   = (() => { const v = parseFloat(getSt(p.battery_entity)); return isNaN(v) ? null : v; })();
      const batCol= bat == null ? '#475569' : bat <= 20 ? '#ef4444' : bat <= 50 ? '#f59e0b' : '#22c55e';
      const batState = getSt(p.battery_state_entity);
      const dist  = getSt(p.distance_entity);
      const geo   = getSt(p.geocoded_entity);
      const wifi  = getSt(p.wifi_entity);
      const wifiSig = getSt(p.wifi_signal_entity);
      const bt    = getSt(p.bluetooth_entity);
      const net   = getSt(p.network_type_entity);
      const loc1  = getSt(p.location_1_entity);
      const loc2  = getSt(p.location_2_entity);
      const pic   = pObj?.attributes?.entity_picture;
      const initials = (p.name||'?')[0].toUpperCase();

      return html`
        <div style="flex:1;min-width:240px;background:rgba(129,140,248,.04);border:1px solid #1e2d3d;
                    border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:42px;height:42px;border-radius:50%;border:2px solid ${stCol};overflow:hidden;flex-shrink:0;
                        background:#1e2d3d;display:flex;align-items:center;justify-content:center;">
              ${pic ? html`<img src="${pic}" style="width:100%;height:100%;object-fit:cover;" />`
                    : html`<span style="font-size:18px;font-weight:800;color:${stCol};">${initials}</span>`}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:700;color:#f1f5f9;">${p.name||'—'}</div>
              <div style="font-size:12px;font-weight:700;color:${stCol};">${stateLabel}</div>
            </div>
            ${bat != null ? html`
              <div style="display:flex;flex-direction:column;align-items:flex-end;">
                <span style="font-size:14px;font-weight:800;color:${batCol};">${Math.round(bat)}%</span>
                ${batState ? html`<span style="font-size:11px;color:#475569;">${batState}</span>` : html``}
              </div>` : html``}
          </div>

          ${geo ? html`<div style="font-size:12px;color:#94a3b8;display:flex;align-items:center;gap:5px;">
            <ha-icon icon="mdi:map-marker" style="--mdc-icon-size:13px;color:#818cf8;"></ha-icon>
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${geo}</span></div>` : html``}

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            ${dist != null ? html`<div style="background:rgba(255,255,255,.03);border:1px solid #1e2d3d;border-radius:6px;padding:5px 8px;">
              <div style="font-size:11px;color:#64748b;">Distance</div>
              <div style="font-size:14px;font-weight:700;color:#818cf8;">${parseFloat(dist).toFixed(2)} km</div></div>` : html``}
            ${wifi ? html`<div style="background:rgba(255,255,255,.03);border:1px solid #1e2d3d;border-radius:6px;padding:5px 8px;">
              <div style="font-size:11px;color:#64748b;display:flex;align-items:center;gap:3px;"><ha-icon icon="mdi:wifi" style="--mdc-icon-size:11px;"></ha-icon>WiFi${wifiSig?' ('+wifiSig+')':''}</div>
              <div style="font-size:13px;font-weight:700;color:#06b6d4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${wifi}</div></div>` : html``}
            ${bt ? html`<div style="background:rgba(255,255,255,.03);border:1px solid #1e2d3d;border-radius:6px;padding:5px 8px;">
              <div style="font-size:11px;color:#64748b;">Bluetooth</div>
              <div style="font-size:13px;font-weight:700;color:${bt==='on'?'#06b6d4':'#475569'};">${bt==='on'?'Activé':'Désactivé'}</div></div>` : html``}
            ${net ? html`<div style="background:rgba(255,255,255,.03);border:1px solid #1e2d3d;border-radius:6px;padding:5px 8px;">
              <div style="font-size:11px;color:#64748b;">Réseau</div>
              <div style="font-size:13px;font-weight:700;color:#94a3b8;">${net}</div></div>` : html``}
          </div>

          ${(loc1||loc2) ? html`<div style="font-size:11px;color:#475569;border-top:1px solid #1e2d3d;padding-top:6px;">
            ${loc1?html`<div style="display:flex;align-items:center;gap:4px;"><ha-icon icon="mdi:history" style="--mdc-icon-size:11px;"></ha-icon>${loc1}</div>`:html``}
            ${loc2?html`<div style="display:flex;align-items:center;gap:4px;margin-top:2px;"><ha-icon icon="mdi:history" style="--mdc-icon-size:11px;"></ha-icon>${loc2}</div>`:html``}
          </div>` : html``}
        </div>`;
    };

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} background:#0d1321;border-color:#818cf822;overflow:hidden;
                  position:relative;display:flex;flex-direction:column;font-family:'Roboto','Segoe UI',sans-serif;padding:12px;gap:10px;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#818cf8,#06b6d4);z-index:5;"></div>
        <div style="flex-shrink:0;font-size:15px;font-weight:800;color:#818cf8;letter-spacing:1px;display:flex;align-items:center;gap:6px;">
          <ha-icon icon="mdi:radar" style="--mdc-icon-size:18px;"></ha-icon>${w.title||'Présence'}
        </div>
        <div style="flex:1;display:flex;flex-wrap:wrap;gap:10px;align-content:start;overflow-y:auto;">
          ${persons.map(p => renderPerson(p))}
        </div>
      </div>`;
  }

  // Dessine un avatar sur la carte pour les personnes SANS coordonnées GPS
  // (ex: présence détectée par le routeur WiFi → person sans latitude/longitude).
  // Position de repli : la zone correspondant à l'état (zone.home si "home").
  _syncFallbackMarkers(cardEl, persons) {
    const haMap = cardEl.shadowRoot && cardEl.shadowRoot.querySelector('ha-map');
    const L   = haMap && haMap.Leaflet;
    const map = haMap && haMap.leafletMap;
    if (!L || !map) return;
    if (!this._fbMarkers) this._fbMarkers = {};

    let fbIndex = 0;
    persons.forEach(p => {
      if (!p.person) return;
      const st = this.hass?.states[p.person];
      const key = p.person;
      const hasCoords = st && st.attributes.latitude != null && st.attributes.longitude != null;

      // La personne a des coords → la carte HA gère son marqueur, on retire le fallback
      if (!st || hasCoords) {
        if (this._fbMarkers[key]) { try { map.removeLayer(this._fbMarkers[key]); } catch(_e) {} delete this._fbMarkers[key]; }
        return;
      }

      // Coords de repli : zone correspondant à l'état, sinon zone.home
      const zone = this.hass.states['zone.' + st.state] || this.hass.states['zone.home'];
      const lat = zone?.attributes?.latitude;
      const lon = zone?.attributes?.longitude;
      if (lat == null || lon == null) return;

      // Léger décalage si plusieurs fallbacks au même endroit
      const offset = fbIndex * 0.0006;
      fbIndex++;

      const pic = st.attributes.entity_picture;
      const initial = (p.name || st.attributes.friendly_name || '?')[0].toUpperCase();
      const iconHtml = pic
        ? `<div style="width:40px;height:40px;border-radius:50%;border:2px solid #22c55e;overflow:hidden;background:#000;box-shadow:0 2px 8px rgba(0,0,0,.6);"><img src="${pic}" style="width:100%;height:100%;object-fit:cover;"/></div>`
        : `<div style="width:40px;height:40px;border-radius:50%;border:2px solid #22c55e;background:#1e2d3d;color:#22c55e;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.6);">${initial}</div>`;
      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });

      if (this._fbMarkers[key]) {
        this._fbMarkers[key].setLatLng([lat + offset, lon + offset]);
        this._fbMarkers[key].setIcon(icon);
      } else {
        this._fbMarkers[key] = L.marker([lat + offset, lon + offset], { icon, zIndexOffset: 1000 }).addTo(map);
      }
    });
  }

  _renderMapWidget(w, sizeStyle, noBorder=false) {
    // Carte Lovelace "map" via card helpers + auto_fit (recadre sur les marqueurs)
    // + bandeau d'infos par personne sous la carte.
    const persons = w.persons || [];
    const entities = persons.map(p => p.person).filter(Boolean);
    if (entities.length === 0) {
      return html`
        <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} padding:0;">
          <div class="empty-tab" style="margin-top:0;display:flex;height:100%;align-items:center;justify-content:center;">AUCUNE PERSONNE</div>
        </div>`;
    }

    if (!this._mapCards) this._mapCards = {};
    const key = entities.join('|') + '#' + (w.zoom || 12) + '#' + (w.hours_to_show || 0);

    if (!this._mapCards[key]) {
      this._mapCards[key] = 'loading';
      (async () => {
        try {
          const helpers = await window.loadCardHelpers();
          const el = helpers.createCardElement({
            type: 'map',
            entities: entities,
            default_zoom: Number(w.zoom || 12),
            theme_mode: 'dark',
            auto_fit: true,
            hours_to_show: Number(w.hours_to_show || 0),
          });
          el.hass = this.hass;
          el.style.cssText = 'display:block;width:100%;height:100%;';
          this._mapCards[key] = el;
          this.requestUpdate();
          // Recadrage forcé après init (le premier fit peut partir avant les coords)
          [800, 2000].forEach(t => setTimeout(() => {
            const m = el.shadowRoot && el.shadowRoot.querySelector('ha-map');
            if (m && typeof m.fitMap === 'function') { try { m.fitMap(); } catch(_e) {} }
            this._syncFallbackMarkers(el, persons);
          }, t));
        } catch (e) {
          this._mapCards[key] = 'error';
          this.requestUpdate();
        }
      })();
    }

    const card = this._mapCards[key];
    if (card && card !== 'loading' && card !== 'error') {
      card.hass = this.hass;
      this._syncFallbackMarkers(card, persons);
    }

    // ── Bandeau d'infos par personne ─────────────────────────────
    const getSt = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const footRows = persons.map(p => {
      const pObj  = p.person && this.hass?.states[p.person] ? this.hass.states[p.person] : null;
      const home  = pObj ? pObj.state === 'home' : false;
      const stLbl = pObj ? (home ? 'À DOMICILE' : (pObj.state === 'not_home' ? 'ABSENT' : pObj.state.toUpperCase())) : '--';
      const stCol = home ? '#22c55e' : '#f59e0b';
      const geo   = getSt(p.geocoded_entity);
      const dist  = (() => { const v = parseFloat(getSt(p.distance_entity)); return isNaN(v) ? null : v; })();
      const loc1  = getSt(p.location_1_entity);
      const pic   = pObj?.attributes?.entity_picture;
      const initials = (p.name||'?')[0].toUpperCase();
      return html`
        <div style="flex:1;min-width:260px;display:flex;align-items:center;gap:10px;
                    background:rgba(129,140,248,.05);border:1px solid #1e2d3d;border-radius:10px;padding:8px 12px;">
          <div style="width:36px;height:36px;border-radius:50%;border:2px solid ${stCol};overflow:hidden;flex-shrink:0;
                      background:#1e2d3d;display:flex;align-items:center;justify-content:center;">
            ${pic ? html`<img src="${pic}" style="width:100%;height:100%;object-fit:cover;" />`
                  : html`<span style="font-size:16px;font-weight:800;color:${stCol};">${initials}</span>`}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:15px;font-weight:700;color:#f1f5f9;">${p.name||'—'}</span>
              <span style="font-size:12px;font-weight:700;color:${stCol};border:1px solid ${stCol}44;border-radius:5px;padding:1px 7px;">${stLbl}</span>
              ${dist != null ? html`<span style="font-size:13px;font-weight:700;color:#818cf8;">📍 ${dist.toFixed(2)} km</span>` : html``}
            </div>
            ${geo ? html`
              <div style="font-size:13px;color:#cbd5e1;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${geo}
              </div>` : html``}
            ${loc1 ? html`
              <div style="font-size:12px;color:#64748b;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ⏱ ${loc1}
              </div>` : html``}
          </div>
        </div>`;
    });

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} padding:0;overflow:hidden;position:relative;display:flex;flex-direction:column;">
        <div style="flex:1;min-height:0;position:relative;">
          ${card === 'loading' ? html`
            <div class="empty-tab" style="margin-top:0;display:flex;height:100%;align-items:center;justify-content:center;">CHARGEMENT DE LA CARTE…</div>
          ` : card === 'error' ? html`
            <div class="empty-tab" style="margin-top:0;display:flex;height:100%;align-items:center;justify-content:center;color:#ef4444;">ERREUR CHARGEMENT CARTE</div>
          ` : card}
        </div>
        <div style="flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;padding:8px;background:#0a0f1a;border-top:1px solid #1a2744;">
          ${footRows}
        </div>
      </div>`;
  }

  _renderApplianceWidget(w, sizeStyle, noBorder=false) {
    const categories = w.categories || [];
    const tabKey     = '_appTab_' + (w.widget_id || 'def');
    const activeTab  = this[tabKey] || 0;
    const setTab     = (i) => { this[tabKey] = i; this.requestUpdate(); };

    const getSt  = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const fmt    = (v) => { const n = parseFloat(v); return isNaN(n) ? (v||'--') : n.toFixed(1); };
    const toggle = (eid) => { if(!eid||!this.hass) return; const d=eid.split('.')[0]; this.hass.callService(d,'toggle',{entity_id:eid}); };

    if (w.view != null) {
      const viewIdx = parseInt(w.view);
      if (!isNaN(viewIdx)) this[tabKey] = viewIdx;
    }
    const cat   = categories[w.view != null ? (parseInt(w.view)||0) : activeTab] || categories[0] || {};
    const items = cat.items || [];

    const renderTool = (item) => {
      const st   = this.hass?.states[item.entity];
      const isOn = st?.state === 'on';
      const col  = isOn ? '#06b6d4' : '#475569';
      return html`
        <div style="flex:1 1 320px;min-width:300px;background:${isOn?'rgba(6,182,212,.08)':'rgba(255,255,255,.03)'};border:1px solid ${isOn?'rgba(6,182,212,.3)':'#1e2d3d'};border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;cursor:pointer;"
             @click="${(e)=>{e.stopPropagation();toggle(item.entity);}}">
          <div style="display:flex;align-items:center;gap:12px;">
            ${item.img?html`<div style="width:64px;height:64px;flex-shrink:0;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1e2d3d;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:4px;${isOn?'':'filter:grayscale(.7) opacity(.6);'}"/></div>`:html``}
            <div style="flex:1;">
              <div style="font-size:16px;font-weight:700;color:#f1f5f9;">${item.name}</div>
              <div style="font-size:14px;font-weight:800;color:${col};margin-top:2px;">${isOn?'EN MARCHE':'ARRÊTÉ'}</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${(item.sensors||[]).map(eid => {
              const sv  = getSt(eid);
              const sst = this.hass?.states[eid];
              const un  = sst?.attributes?.unit_of_measurement || '';
              const icons = {'V':'mdi:sine-wave','A':'mdi:current-ac','W':'mdi:lightning-bolt','kWh':'mdi:lightning-bolt-outline','%':'mdi:percent'};
              return html`<div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.05);border:1px solid #1e2d3d;border-radius:20px;padding:4px 11px;font-size:13px;color:#cbd5e1;">
                <ha-icon icon="${icons[un]||'mdi:eye'}" style="--mdc-icon-size:13px;color:#f59e0b;"></ha-icon>${fmt(sv)} ${un}</div>`;
            })}
          </div>
        </div>`;
    };

    const renderAppliance = (item) => {
      const st    = this.hass?.states[item.entity];
      const isOn  = st?.state === 'on';
      const col   = isOn ? '#f59e0b' : '#475569';
      const cycSt = item.cycle ? this.hass?.states[item.cycle] : null;
      const cyc   = cycSt && !['unavailable','unknown'].includes(cycSt.state) ? cycSt.state : null;
      return html`
        <div style="flex:1 1 320px;min-width:300px;background:${isOn?'rgba(245,158,11,.08)':'rgba(255,255,255,.03)'};border:1px solid ${isOn?'rgba(245,158,11,.3)':'#1e2d3d'};border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;cursor:pointer;"
             @click="${(e)=>{e.stopPropagation();toggle(item.entity);}}">
          <div style="display:flex;align-items:center;gap:12px;">
            ${item.img?html`<div style="width:64px;height:64px;flex-shrink:0;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1e2d3d;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:4px;${isOn?'':'filter:grayscale(.7) opacity(.6);'}"/></div>`:html``}
            <div style="flex:1;min-width:0;">
              <div style="font-size:16px;font-weight:700;color:#f1f5f9;">${item.name}</div>
              <div style="font-size:14px;font-weight:800;color:${col};margin-top:2px;">${isOn?'EN MARCHE':'ARRÊTÉ'}</div>
              ${cyc?html`<div style="font-size:13px;color:#94a3b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">⟳ ${cyc}</div>`:html``}
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${(item.sensors||[]).map(eid => {
              const sst = this.hass?.states[eid];
              if (!sst) return html``;
              const un  = sst.attributes.unit_of_measurement || '';
              const lbl = (sst.attributes.friendly_name||eid.split('.').pop()).split(' ').slice(-2).join(' ');
              return html`<div style="display:flex;flex-direction:column;gap:1px;background:rgba(255,255,255,.05);border:1px solid #1e2d3d;border-radius:9px;padding:5px 11px;min-width:0;">
                <span style="font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${lbl}</span>
                <span style="font-size:14px;font-weight:700;color:#e2e8f0;">${fmt(sst.state)} ${un}</span>
              </div>`;
            })}
          </div>
        </div>`;
    };

    const renderVacuum = (item) => {
      const p       = (item.entity||'').replace('vacuum.','');
      const st      = this.hass?.states[item.entity];
      const state   = st?.state || '--';
      const attr    = st?.attributes || {};
      const batSt   = this.hass?.states['sensor.'+p+'_battery_level'];
      const roomSt  = this.hass?.states['sensor.'+p+'_current_room'];
      const stateSt = this.hass?.states['sensor.'+p+'_state'];
      const bat     = batSt ? parseFloat(batSt.state) : (attr.battery_level||null);
      const curRoom = roomSt  && roomSt.state  !== 'unavailable' ? roomSt.state  : null;
      const stateExt= stateSt && stateSt.state !== 'unavailable' ? stateSt.state : null;
      const sc1Eid  = 'button.'+p+'_shortcut_1';
      const sc2Eid  = 'button.'+p+'_shortcut_2';
      const sc1St   = this.hass?.states[sc1Eid];
      const sc2St   = this.hass?.states[sc2Eid];
      const sc1Name = sc1St?.attributes?.friendly_name || 'Raccourci 1';
      const sc2Name = sc2St?.attributes?.friendly_name || 'Raccourci 2';
      const batCol  = bat >= 70 ? '#22c55e' : bat >= 30 ? '#f59e0b' : '#ef4444';
      const isOn    = !['docked','idle','paused','error'].includes(state);
      const stLbl   = {docked:'EN VEILLE',cleaning:'NETTOYAGE',paused:'EN PAUSE',returning:'RETOUR BASE',idle:'INACTIF',error:'ERREUR'}[state]||state.toUpperCase();
      const stCol   = isOn ? '#818cf8' : state==='docked' ? '#22c55e' : '#475569';
      const camUrl  = item.map_camera && this.hass?.states[item.map_camera]?.attributes?.entity_picture;
      const callVac = (svc,data={}) => this.hass.callService('vacuum',svc,{entity_id:item.entity,...data});
      const callBtn = (eid) => this.hass.callService('button','press',{entity_id:eid});
      const trOpt   = (s) => ({'Charging':'En charge','Idle':'Inactif','Sleeping':'En veille','Sweeping':'Aspiration','Mopping':'Lavage','Returning':'Retour base','Docked':'En veille','Paused':'En pause','Error':'Erreur','Turbo':'Turbo','Quiet':'Silencieux','Balanced':'Équilibré','Standard':'Standard','Low':'Faible','Medium':'Moyen','High':'Élevé'}[s]||s);
      const fw      = attr.firmware_version || null;
      const area    = attr.cleaned_area || null;
      const dur     = attr.cleaning_duration || null;
      const fanSpeed= attr.fan_speed || null;
      const rooms   = attr.room_list || attr.rooms || [];
      const cons    = [{l:'BROSSE PRINC.',v:attr.main_brush_left},{l:'BROSSE LAT.',v:attr.side_brush_left},{l:'FILTRE',v:attr.filter_left},{l:'SERPILLIÈRE',v:attr.mop_left},{l:'DÉTERGENT',v:attr.detergent_left},{l:'CAPTEURS',v:attr.sensor_dirty_left}].filter(c=>c.v!=null).map(c=>({...c,v:Math.round(c.v)}));
      const cBar=(label,v)=>{const col=v<=20?'#ef4444':v<=50?'#f59e0b':'#00ff88';return html`<div style="display:grid;grid-template-columns:100px 1fr 38px;align-items:center;gap:6px;"><span style="font-size:12px;color:#94a3b8;font-family:'Courier New',monospace;">${label}</span><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${v}%;background:${col};box-shadow:0 0 4px ${col}66;"></div></div><span style="font-size:13px;font-weight:700;color:${col};text-align:right;">${v}%</span></div>`;};
      return html`
        <div style="flex:1;min-width:0;border:1px solid rgba(129,140,248,.2);border-radius:12px;background:rgba(5,10,20,.85);overflow:hidden;display:flex;flex-direction:column;font-family:'Courier New',monospace;">
          <div style="height:2px;background:linear-gradient(90deg,#818cf8,#22c55e,transparent);"></div>
          <div style="padding:10px 12px 8px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(129,140,248,.1);">
            ${item.img?html`<div style="width:48px;height:48px;flex-shrink:0;background:rgba(0,0,0,.4);border:1px solid rgba(129,140,248,.2);border-radius:8px;overflow:hidden;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:3px;"/></div>`:html``}
            <div style="flex:1;"><div style="font-size:15px;font-weight:700;color:#e2e8f0;">${item.name}</div>${item.subtitle?html`<div style="font-size:13px;color:#64748b;">${item.subtitle}</div>`:html``}${fw?html`<div style="font-size:12px;color:#475569;">// ${fw}</div>`:html``}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
              ${bat!=null?html`<span style="font-size:14px;font-weight:700;color:${batCol};">⚡ ${bat}%</span>`:html``}
              <span style="font-size:13px;font-weight:700;padding:2px 8px;border:1px solid ${stCol}44;color:${stCol};">${stLbl}</span>
              ${stateExt?html`<span style="font-size:12px;color:#64748b;">${trOpt(stateExt)}</span>`:html``}
            </div>
          </div>
          <div style="flex:1;min-height:0;display:flex;gap:0;">
            <div class="no-scrollbar" style="flex:1;padding:8px 12px;display:flex;flex-direction:column;gap:6px;border-right:1px solid rgba(129,140,248,.08);overflow-y:auto;">
              ${(curRoom||area||dur||fanSpeed)?html`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                ${curRoom?html`<div style="background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.15);border-radius:4px;padding:3px 8px;"><span style="font-size:12px;color:#64748b;">PIÈCE </span><span style="font-size:14px;color:#818cf8;font-weight:700;">${curRoom}</span></div>`:html``}
                ${area?html`<div><span style="font-size:17px;font-weight:800;color:#818cf8;">${area}</span><span style="font-size:12px;color:#64748b;"> m²</span></div>`:html``}
                ${dur?html`<div><span style="font-size:17px;font-weight:800;color:#818cf8;">${dur}</span><span style="font-size:12px;color:#64748b;"> min</span></div>`:html``}
                ${fanSpeed?html`<span style="font-size:12px;padding:2px 7px;border:1px solid #06b6d422;color:#06b6d4;">⚙ ${trOpt(fanSpeed)}</span>`:html``}
              </div>`:html``}
              ${cons.length>0?html`<div><div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin-bottom:4px;">// CONSOMMABLES</div><div style="display:flex;flex-direction:column;gap:5px;">${cons.map(c=>cBar(c.l,c.v))}</div></div>`:html``}
              ${(sc1St||sc2St)?html`<div><div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin-bottom:4px;">// RACCOURCIS</div><div style="display:flex;gap:5px;flex-wrap:wrap;">
                ${sc1St?html`<button style="flex:1;padding:6px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.25);color:#818cf8;" @click="${(e)=>{e.stopPropagation();callBtn(sc1Eid);}}">⊞ ${sc1Name}</button>`:html``}
                ${sc2St?html`<button style="flex:1;padding:6px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.25);color:#818cf8;" @click="${(e)=>{e.stopPropagation();callBtn(sc2Eid);}}">⊞ ${sc2Name}</button>`:html``}
              </div></div>`:html``}
              ${rooms.length>0?html`<div><div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin-bottom:4px;">// ZONES</div><div style="display:flex;gap:4px;flex-wrap:wrap;">${rooms.map(r=>html`<button style="padding:4px 9px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);color:#06b6d4;" @click="${(e)=>{e.stopPropagation();callVac('send_command',{command:'segment_clean',params:{segments:[r.id||r]}});}}">⊙ ${r.name||r}</button>`)}</div></div>`:html``}
            </div>
            ${camUrl?html`<div style="width:200px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);overflow:hidden;"><img src="${camUrl}" style="max-width:200px;max-height:230px;object-fit:contain;filter:brightness(.85) contrast(1.1);"/></div>`:html``}
          </div>
          <div style="padding:7px 10px;border-top:1px solid rgba(129,140,248,.1);display:flex;flex-wrap:wrap;gap:5px;">
            ${[{l:'▶ DÉMARRER',fn:()=>callVac('start'),col:'#22c55e'},{l:'⏸ PAUSE',fn:()=>callVac('pause'),col:'#818cf8'},{l:'⌂ BASE',fn:()=>callVac('return_to_base'),col:'#06b6d4'},{l:'⊙ LOCALISER',fn:()=>callVac('locate'),col:'#f59e0b'},{l:'▣ VIDER BAC',fn:()=>callVac('send_command',{command:'start_wash'}),col:'#64748b'}].map(b=>html`<button style="flex:1;min-width:60px;padding:6px 4px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;font-weight:700;cursor:pointer;background:${b.col}12;border:1px solid ${b.col}44;color:${b.col};" @click="${(e)=>{e.stopPropagation();b.fn();}}">${b.l}</button>`)}
          </div>
        </div>`;
    };

    const renderMower = (item) => {
      const p       = item.mower_prefix || 'eve';
      const st      = this.hass?.states['lawn_mower.'+p];
      const state   = st?.state || '--';
      const attr    = st?.attributes || {};
      const batSt   = this.hass?.states['sensor.'+p+'_batterie'];
      const bat     = batSt ? parseFloat(batSt.state) : (attr.battery_level||null);
      const batCol  = bat >= 70 ? '#22c55e' : bat >= 30 ? '#f59e0b' : '#ef4444';
      const isOn    = ['mowing'].includes(state);
      const stLbl   = {docked:'CHARGE COMPLÈTE',mowing:'TONTE EN COURS',paused:'EN PAUSE',returning:'RETOUR BASE',error:'ERREUR',edgedocking:'RETOUR',docking:'RETOUR'}[state]||state.toUpperCase();
      const stCol   = isOn ? '#22c55e' : state==='docked' ? '#06b6d4' : '#475569';
      const camUrl  = item.map_camera && this.hass?.states[item.map_camera]?.attributes?.entity_picture;
      const progSt  = this.hass?.states['sensor.'+p+'_progression_de_la_tonte'];
      const progRaw = progSt ? progSt.state : null;
      const progNum = progRaw && progRaw!=='unavailable' && progRaw!=='unknown' ? parseFloat(progRaw) : null;
      const callMow = (svc,data={}) => this.hass.callService('lawn_mower',svc,{entity_id:'lawn_mower.'+p,...data});
      const callSel = (eid,opt) => this.hass.callService('select','select_option',{entity_id:eid,option:opt});
      const callBtn = (eid) => this.hass.callService('button','press',{entity_id:eid});
      const lameSt  = this.hass?.states['sensor.'+p+'_etat_des_lames'];
      const maintSt = this.hass?.states['sensor.'+p+'_etat_de_maintenance'];
      const brushSt = this.hass?.states['sensor.'+p+'_etat_de_la_brosse'];
      const lames   = lameSt  && lameSt.state  !== 'unavailable' ? parseFloat(lameSt.state).toFixed(1)  : null;
      const maint   = maintSt && maintSt.state !== 'unavailable' ? parseFloat(maintSt.state).toFixed(1) : null;
      const brosse  = brushSt && brushSt.state !== 'unavailable' ? parseFloat(brushSt.state).toFixed(1) : null;
      const btnLames  = 'button.'+p+'_reinitialiser_le_compteur_des_lames';
      const btnMaint  = 'button.'+p+'_reinitialiser_le_compteur_de_maintenance';
      const btnBrosse = 'button.'+p+'_reinitialiser_le_compteur_de_brosse';
      const mapEid  = 'select.'+p+'_map';
      const zoneEid = 'select.'+p+'_zone';
      const actEid  = 'select.'+p+'_mowing_action';
      const mapSt   = this.hass?.states[mapEid];
      const zoneSt  = this.hass?.states[zoneEid];
      const actSt   = this.hass?.states[actEid];
      const mapOpts = mapSt  ? (mapSt.attributes.options  || []) : [];
      const zoneOpts= zoneSt ? (zoneSt.attributes.options || []) : [];
      const actOpts = actSt  ? (actSt.attributes.options  || []) : [];
      const mapCur  = mapSt  ? mapSt.state  : null;
      const zoneCur = zoneSt ? zoneSt.state : null;
      const actCur  = actSt  ? actSt.state  : null;
      const trOpt   = (s) => ({'All area':'Toute la surface','all_area':'Toute la surface','Select zone':'Tonte par zones','select_zone':'Tonte par zones','Edge':'Bordure','edge':'Bordure','Spot':'Zone ponctuelle'}[s]||s);
      const cBar=(label,v,col2)=>{const n=parseFloat(v);const col=n<=20?'#ef4444':n<=50?'#f59e0b':(col2||'#22c55e');return html`<div style="display:grid;grid-template-columns:90px 1fr 44px;align-items:center;gap:6px;"><span style="font-size:12px;color:#94a3b8;font-family:'Courier New',monospace;">${label}</span><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${Math.min(n,100)}%;background:${col};box-shadow:0 0 4px ${col}66;"></div></div><span style="font-size:13px;font-weight:700;color:${col};text-align:right;">${v}%</span></div>`;};
      const consRow=(label,val,col,btnEid)=>val==null?html``:html`<div style="margin-bottom:7px;">${cBar(label,val,col)}<button style="width:100%;margin-top:3px;padding:5px 8px;border-radius:3px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;background:${col}10;border:1px solid ${col}33;color:${col};" @click="${(e)=>{e.stopPropagation();callBtn(btnEid);}}">↺ RÉINITIALISER</button></div>`;
      const selStyle=`width:100%;padding:6px 26px 6px 9px;background:rgba(0,0,0,.6);color:#e2e8f0;border:1px solid rgba(34,197,94,.3);border-radius:4px;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;`;
      const selRow=(label,eid,opts,cur)=>opts.length===0?html``:html`<div><div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin-bottom:3px;">${label}</div><div style="position:relative;"><select style="${selStyle}" .value="${cur||''}" @change="${(e)=>{e.stopPropagation();callSel(eid,e.target.value);}}">${opts.map(o=>html`<option value="${o}" .selected="${o===cur}">${trOpt(o)}</option>`)}</select><span style="position:absolute;right:7px;top:50%;transform:translateY(-50%);color:#22c55e;font-size:12px;pointer-events:none;">▼</span></div><div style="font-size:12px;color:#22c55e;margin-top:2px;padding-left:2px;">▸ ${trOpt(cur)||'—'}</div></div>`;
      return html`
        <div style="flex:1;min-width:0;border:1px solid rgba(34,197,94,.2);border-radius:12px;background:rgba(5,10,20,.85);overflow:hidden;display:flex;flex-direction:column;font-family:'Courier New',monospace;">
          <div style="height:2px;background:linear-gradient(90deg,#22c55e,#06b6d4,transparent);"></div>
          <div style="padding:10px 12px 8px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(34,197,94,.1);">
            ${item.img?html`<div style="width:48px;height:48px;flex-shrink:0;background:rgba(0,0,0,.4);border:1px solid rgba(34,197,94,.2);border-radius:8px;overflow:hidden;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:3px;"/></div>`:html``}
            <div style="flex:1;"><div style="font-size:15px;font-weight:700;color:#e2e8f0;">${item.name}</div>${item.subtitle?html`<div style="font-size:13px;color:#64748b;">${item.subtitle}</div>`:html``}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
              ${bat!=null?html`<span style="font-size:14px;font-weight:700;color:${batCol};">⚡ ${bat}%</span>`:html``}
              <span style="font-size:13px;font-weight:700;padding:2px 8px;border:1px solid ${stCol}44;color:${stCol};">${stLbl}</span>
            </div>
          </div>
          <div style="flex:1;min-height:0;display:flex;gap:0;">
            <div class="no-scrollbar" style="flex:0 0 245px;padding:8px 12px;display:flex;flex-direction:column;gap:4px;border-right:1px solid rgba(34,197,94,.08);overflow-y:auto;">
              <div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin-bottom:2px;">// CONSOMMABLES</div>
              ${consRow('LAMES',lames,'#22c55e',btnLames)}
              ${consRow('MAINT.',maint,'#06b6d4',btnMaint)}
              ${consRow('BROSSE',brosse,'#818cf8',btnBrosse)}
              <div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin:4px 0 2px;">// MISSION</div>
              <div style="display:flex;flex-direction:column;gap:7px;">
                ${selRow('CARTE',mapEid,mapOpts,mapCur)}
                ${selRow('ZONE',zoneEid,zoneOpts,zoneCur)}
                ${selRow('ACTION',actEid,actOpts,actCur)}
              </div>
              ${progNum!=null&&!isNaN(progNum)?html`<div style="margin-top:6px;"><div style="font-size:12px;color:#64748b;letter-spacing:.8px;margin-bottom:4px;">// PROGRESSION</div><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:3px;"><span style="color:#94a3b8;">Tonte</span><span style="font-weight:800;color:#22c55e;">${progNum.toFixed(0)}%</span></div><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${progNum.toFixed(0)}%;background:linear-gradient(90deg,#22c55e,#86efac);box-shadow:0 0 6px #22c55e88;"></div></div></div>`:html``}
            </div>
            ${camUrl?html`<div style="flex:1;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.2);overflow:hidden;position:relative;"><img src="${camUrl+'&_t='+(Math.floor(Date.now()/5000)*5000)}" style="max-width:100%;max-height:240px;object-fit:contain;"/>${isOn?html`<div style="position:absolute;top:6px;right:6px;font-size:12px;color:#22c55e;font-family:'Courier New',monospace;background:rgba(0,0,0,.6);padding:2px 5px;border:1px solid #22c55e44;">● LIVE</div>`:html``}</div>`:html``}
          </div>
          <div style="padding:7px 10px;border-top:1px solid rgba(34,197,94,.1);display:flex;flex-wrap:wrap;gap:5px;">
            ${[{l:'▶ TONDRE',fn:()=>callMow('start_mowing'),col:'#22c55e',flex:2},{l:'⏸ PAUSE',fn:()=>callMow('pause'),col:'#818cf8',flex:1},{l:'⌂ BASE',fn:()=>callMow('dock'),col:'#06b6d4',flex:1},{l:'⌂ BASE DOUX',fn:()=>callBtn('button.'+p+'_revenir_a_la_base_sans_arreter_la_tache'),col:'#475569',flex:1}].map(b=>html`<button style="flex:${b.flex};min-width:60px;padding:7px 4px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;font-weight:700;cursor:pointer;background:${b.col}12;border:1px solid ${b.col}44;color:${b.col};" @click="${(e)=>{e.stopPropagation();b.fn();}}">${b.l}</button>`)}
          </div>
        </div>`;
    };

    const renderItem = (item) => {
      if (item.type === 'robot_vacuum') return renderVacuum(item);
      if (item.type === 'robot_mower')  return renderMower(item);
      if (item.type === 'tool')         return renderTool(item);
      const domain = (item.entity||'').split('.')[0];
      if (domain === 'vacuum')     return renderVacuum(item);
      if (domain === 'lawn_mower') return renderMower(item);
      return renderAppliance(item);
    };

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} background:#0d1321;border-color:#06b6d422;overflow:hidden;position:relative;font-family:'Roboto','Segoe UI',sans-serif;display:flex;flex-direction:column;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#06b6d4,#818cf8,#22c55e);z-index:5;"></div>
        <div style="flex-shrink:0;padding:12px 14px 0;display:flex;gap:8px;flex-wrap:wrap;${w.view!=null?'display:none;':''}">
          ${categories.map((c,i) => html`
            <button style="display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:20px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:.2s;border:1px solid;background:${activeTab===i?'#06b6d4':'rgba(255,255,255,.05)'};border-color:${activeTab===i?'#06b6d4':'#1e2d3d'};color:${activeTab===i?'#0d1321':'#94a3b8'};"
              @click="${(e)=>{e.stopPropagation();setTab(i);}}">
              <ha-icon icon="${c.icon||'mdi:apps'}" style="--mdc-icon-size:15px;color:${activeTab===i?'#0d1321':'#64748b'};"></ha-icon>
              ${c.label||'Tab '+(i+1)}
            </button>`)}
        </div>
        <div class="no-scrollbar" style="flex:1;min-height:0;padding:12px 14px 14px;display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;overflow-y:auto;align-content:start;">
          ${items.map(item => renderItem(item))}
        </div>
      </div>`;
  }

  _renderEnergieWidget(w, sizeStyle, noBorder=false) {
    // Intègre la carte "energie-card" (HACS) en pleine page.
    const cfg = w.energie_config || {};
    if (!customElements.get('energie-card')) {
      return html`
        <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;color:#f59e0b;font-size:14px;line-height:1.6;padding:20px;">
            ⚠ Carte « energie-card » non installée.<br>
            Ajoute la ressource <code style="color:#e2e8f0;">/hacsfiles/energie-card/energie-card.js</code> au tableau de bord.
          </div>
        </div>`;
    }
    return html`
      <div class="dw-card ${noBorder?'no-border':''} no-scrollbar"
           style="${sizeStyle} padding:0;overflow-y:auto;overflow-x:hidden;">
        <energie-card style="display:block;width:100%;" .hass="${this.hass}" .config="${cfg}"></energie-card>
      </div>`;
  }

  _renderSolarWidget(w, sizeStyle, noBorder=false) {
    const fixedTab  = w.active_tab != null ? parseInt(w.active_tab) : 0;
    const tabNames  = ['solar','meteo','batt','eco'];
    const cfg       = w.solar_config || {};

    if (!customElements.get('solar-master-card')) {
      return html`
        <div class="dw-card ${noBorder?'no-border':''}"
             style="${sizeStyle} display:flex;align-items:center;justify-content:center;text-align:center;color:#f59e0b;font-size:13px;padding:20px;">
          ⚠ Carte « solar-master-card » non installée.<br>Ajoute sa ressource pour afficher l'onglet « ${tabNames[fixedTab]} ».
        </div>`;
    }

    const clickTab = () => {
      setTimeout(() => {
        const cards = this.shadowRoot ? this.shadowRoot.querySelectorAll('solar-master-card') : [];
        cards.forEach(el => {
          const sr = el.shadowRoot;
          if (!sr) return;
          if (!sr.querySelector('#re2-hide-tabs')) {
            const st = document.createElement('style');
            st.id = 're2-hide-tabs';
            st.textContent = [
              '.tab-bar','.tabs','.nav-tabs','.bottom-nav',
              '[class*="tab-nav"]','[class*="bottom-tab"]',
              '[class*="footer"]','[class*="tab-strip"]',
            ].join(',') + '{display:none!important}';
            sr.appendChild(st);
          }
          const tabBtns = sr.querySelectorAll(
            '.tab-btn, .nav-btn, [class*="tab-item"], [class*="nav-item"], ' +
            '.tab-button, button[data-tab], [role="tab"]'
          );
          if (tabBtns.length > fixedTab) {
            tabBtns[fixedTab].click();
          } else {
            const byData = sr.querySelector(
              '[data-tab="'+tabNames[fixedTab]+'"], [data-index="'+fixedTab+'"], [data-id="'+tabNames[fixedTab]+'"]'
            );
            if (byData) byData.click();
          }
        });
      }, 300);
    };
    clickTab();

    const dayDefs = [
      { l: w.d1_label || 'Production du jour - Maison', e: w.d1_entity || 'sensor.beem_maison_production_aujourd_hui', c: '#f59e0b' },
      { l: w.d2_label || 'Production du jour - Spa',    e: w.d2_entity || 'sensor.beem_spa_production_aujourd_hui',    c: '#38bdf8' },
      { l: w.d3_label || 'Production du jour - IBC',    e: w.d3_entity || 'sensor.ibc_production_aujourd_hui',         c: '#22c55e' },
      { l: w.dt_label || 'Production du jour - Total',  e: w.dt_entity || 'sensor.production_totale_beem_jour',        c: '#a78bfa' },
    ];
    const monthDefs = [
      { l: w.m1_label || 'Production du mois - Maison', e: w.m1_entity || 'sensor.beem_maison_production_du_mois', c: '#f59e0b' },
      { l: w.m2_label || 'Production du mois - Spa',    e: w.m2_entity || 'sensor.beem_spa_production_du_mois',    c: '#38bdf8' },
      { l: w.m3_label || 'Production du mois - IBC',    e: w.m3_entity || 'sensor.ibc_production_du_mois',         c: '#22c55e' },
    ];
    const toKwh = (eid) => {
      const st = this.hass?.states[eid];
      if (!st || ['unavailable','unknown'].includes(st.state)) return null;
      const v = parseFloat(st.state);
      if (isNaN(v)) return null;
      const un = st.attributes.unit_of_measurement || 'kWh';
      return /^wh$/i.test(un) ? v / 1000 : v;
    };
    const monthTotal = monthDefs.reduce((acc, d) => {
      const v = toKwh(d.e);
      return v == null ? acc : (acc == null ? v : acc + v);
    }, null);
    const stripTile = (label, val, colr) => html`
      <div style="background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);
                  border-radius:10px;padding:10px 12px;text-align:center;min-width:0;">
        <div style="font-size:13px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
        <div style="font-size:22px;font-weight:800;color:#f1f5f9;margin-top:3px;line-height:1.1;">
          ${val == null ? '--' : val.toLocaleString('fr-FR',{maximumFractionDigits:3})}<span style="font-size:13px;font-weight:600;color:${colr};"> kWh</span>
        </div>
      </div>`;
    const monthStrip = fixedTab === 0 ? html`
      <div style="flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px 4px 0;">
        ${monthDefs.map(d => stripTile(d.l, toKwh(d.e), d.c))}
        ${stripTile(w.mt_label || 'Production du mois - Total', monthTotal, '#a78bfa')}
      </div>` : html``;

    const dayStrip = fixedTab === 0 ? html`
      <div style="flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px 4px 2px;">
        ${dayDefs.map(d => {
          const dst = this.hass?.states[d.e];
          if (!dst || ['unavailable','unknown'].includes(dst.state)) return html``;
          let v  = parseFloat(dst.state);
          let un = dst.attributes.unit_of_measurement || 'kWh';
          if (!isNaN(v) && /^wh$/i.test(un) && Math.abs(v) >= 1000) { v = v / 1000; un = 'kWh'; }
          return html`
            <div style="background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);
                        border-radius:10px;padding:10px 12px;text-align:center;min-width:0;">
              <div style="font-size:13px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.l}</div>
              <div style="font-size:22px;font-weight:800;color:#f1f5f9;margin-top:3px;line-height:1.1;">
                ${isNaN(v) ? dst.state : v.toLocaleString('fr-FR',{maximumFractionDigits:3})}<span style="font-size:13px;font-weight:600;color:${d.c};"> ${un}</span>
              </div>
            </div>`;
        })}
      </div>` : html``;

    return html`
      <div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;${sizeStyle}">
        <div style="flex:1;min-height:0;overflow:hidden;">
          <solar-master-card
            style="display:block;width:100%;height:100%;"
            .hass="${this.hass}"
            .config="${{...cfg, _active_tab: tabNames[fixedTab], _hide_tabs: true}}">
          </solar-master-card>
        </div>
        ${monthStrip}
        ${dayStrip}
      </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const title          = this.config.title || 'UMBRELLA CORP. TERMINAL';
    const categories     = this.config.categories || [];
    const activeCategory = categories[this._activeMainMenu] || { name: '', submenus: [] };
    const activeSubMenu  = activeCategory.submenus && activeCategory.submenus[this._activeSubMenu]
                           ? activeCategory.submenus[this._activeSubMenu] : { name: '', sensors: [] };
    let subsubmenus      = activeSubMenu.subsubmenus || [];
    // Ordre d'affichage : TEMPÉRATURES en premier, TOUT en dernier
    if (subsubmenus.length) {
      const temps = subsubmenus.filter(s => s.id === 'climates');
      const alls  = subsubmenus.filter(s => s.id === 'all');
      const rest  = subsubmenus.filter(s => s.id !== 'all' && s.id !== 'climates');
      subsubmenus = [...temps, ...rest, ...alls];
    }
    // Filtre actif par défaut = premier filtre de la liste (les températures)
    const effectiveFilter = this._activeFilter != null
      ? this._activeFilter
      : (subsubmenus[0]?.id || 'all');
    const sensorsRaw     = activeSubMenu.iframe ? (activeSubMenu.sensors || []) : (activeSubMenu.sensors || []).map(s => s.entity || s).filter(Boolean);
    const hasIframe      = activeSubMenu.iframe;
    const isSpaMode      = activeSubMenu.mode === 'spa';
    const isDesignMode   = activeSubMenu.mode === 'design';
    const statusEntity   = this.config.status_entity;
    const statusState    = statusEntity && this.hass.states[statusEntity] ? this.hass.states[statusEntity].state : null;
    const statusOk       = !statusState || statusState === 'on' || statusState === 'home' || statusState === 'active';
    const statusText     = statusState ? (statusOk ? 'FINE' : 'ALERTE') : 'FINE';
    const statusColor    = statusOk ? '#22c55e' : '#ef4444';

    return html`
      <div class="re-container ${(this.config.biohazard_entities||[]).some(e=>this.hass?.states[e]?.state==='on') ? 're-biohazard' : ''}" style="height:${parseInt(this.config.card_height) || 550}px;${(() => {
        const t = this.config.theme || {};
        return [
          t.accent      ? '--ec-accent:'+t.accent+';' : '',
          t.active      ? '--ec-active:'+t.active+';' : '',
          t.bg          ? '--ec-bg:'+t.bg+';' : '',
          t.side_bg     ? '--ec-side-bg:'+t.side_bg+';' : '',
          t.text        ? '--ec-text:'+t.text+';' : '',
          t.text_dim    ? '--ec-text-dim:'+t.text_dim+';' : '',
          t.fs_title    ? '--ec-fs-title:'+parseInt(t.fs_title)+'px;' : '',
          t.fs_nav      ? '--ec-fs-nav:'+parseInt(t.fs_nav)+'px;' : '',
          t.fs_side     ? '--ec-fs-side:'+parseInt(t.fs_side)+'px;' : '',
          t.fs_filter   ? '--ec-fs-filter:'+parseInt(t.fs_filter)+'px;' : '',
          t.fs_name     ? '--ec-fs-name:'+parseInt(t.fs_name)+'px;' : '',
          t.fs_value    ? '--ec-fs-value:'+parseInt(t.fs_value)+'px;' : '',
          t.sidebar_width ? '--ec-sidebar-w:'+parseInt(t.sidebar_width)+'px;' : '',
          t.hud         ? '--ec-hud:'+t.hud+';--ec-hud-border:'+t.hud+'4d;' : '',
        ].join('');
      })()}">
        ${!this._booted ? html`
          <div class="re-boot">
            <img src="${this.config.logo || '/local/Umbrella.png'}" class="re-umbrella-icon" style="width:64px;height:64px;" />
            <div style="font-size:18px;font-weight:800;letter-spacing:3px;color:#e2e8f0;">UMBRELLA CORP. SECURE TERMINAL</div>
            <div style="font-size:13px;color:#22d3ee;letter-spacing:2px;">AUTHENTICATING<span class="re-boot-dots">...</span></div>
            <div class="re-boot-bar"><div></div></div>
          </div>` : html``}
        <div class="re-header">
          <span class="re-hud-cut-tl"></span><span class="re-hud-cut-br"></span>
          ${(() => {
            const bios = (this.config.biohazard_entities||[]).filter(e => this.hass?.states[e]?.state === 'on');
            if (!bios.length) return html``;
            const names = bios.map(e => this.hass.states[e].attributes.friendly_name || e).join(' · ');
            return html`
              <div class="re-bio-banner" title="${names}">
                <ha-icon icon="mdi:biohazard" style="--mdc-icon-size:18px;"></ha-icon>
                CONTAINMENT BREACH — ${names}
              </div>`;
          })()}
          <div class="re-logo">
            <div class="re-umbrella">
              <img src="${this.config.logo || '/local/images/umbrella.png'}" class="re-umbrella-icon" onerror="this.style.display='none'"/>
            </div>
            <div class="re-title-block">
              <div class="re-title">${title.split('\n')[0]||title}</div>
              ${title.split('\n')[1]?html`<div class="re-subtitle">${title.split('\n')[1]}</div>`:html``}
            </div>
          </div>
          <div class="re-status">
            <span class="re-status-text" style="color:${statusColor};">STATUS: ${statusText}</span>
            <svg class="re-ecg" viewBox="0 0 80 24" preserveAspectRatio="none">
              <polyline points="0,12 20,12 25,2 30,22 35,12 55,12 60,6 65,18 70,12 80,12" stroke="${statusColor}" fill="none" stroke-width="1.5"/>
            </svg>
          </div>
        </div>

        <div class="re-nav"><span class="re-hud-cut-tl"></span><span class="re-hud-cut-br"></span>
          ${categories.map((cat, index) => {
            const catIcons = {
              'MÉTÉO':'🌤','ZONES DU COMPLEXE':'🏠','VIDÉO-SURVEILLANCE':'📷',
              'SERVEURS':'🖥','SPA':'♨','ÉNERGIE & SOLAR':'⚡',
              'SANTE & PLANTES':'🧬','SANTÉ & PLANTES':'🧬','TRACKER DE PRÉSENCE':'📡',
            };
            const emoji = catIcons[cat.name] || '▸';
            return html`
              <div class="main-nav-item ${this._activeMainMenu === index ? 'active' : ''}"
                   @click="${() => { this._activeMainMenu = index; this._activeSubMenu = 0; this._activeFilter = null; this._beep(880); this._triggerGlitch(); this.requestUpdate(); }}">
                <span style="margin-right:4px;font-size:12px;">${emoji}</span>${cat.name}
              </div>`;
          })}
        </div>

        <div class="re-body">
          <div class="re-sidebar"><span class="re-hud-cut-tl"></span><span class="re-hud-cut-br"></span>
            ${activeCategory.submenus ? activeCategory.submenus.map((sub, index) => html`
              <button class="submenu-btn ${this._activeSubMenu === index ? 'active' : ''}"
                      @click="${() => { this._activeSubMenu = index; this._activeFilter = null; this._beep(660); this.requestUpdate(); }}">
                <ha-icon icon="${sub.icon || 'mdi:chevron-right'}"></ha-icon>
                <span>${sub.name}</span>
              </button>
            `) : html``}
          </div>
          <div class="re-content-container ${this._glitch ? 're-glitch' : ''}"><span class="re-hud-cut-tl"></span><span class="re-hud-cut-br"></span><div class="re-scanlines"></div>
            ${!hasIframe && !isSpaMode && !isDesignMode && sensorsRaw.length > 0 && subsubmenus.length > 0 ? html`
              <div class="re-filter-bar">
                ${subsubmenus.map(subsub => html`
                  <button class="filter-item ${effectiveFilter === subsub.id ? 'active' : ''}"
                          @click="${() => { this._activeFilter = subsub.id; this.requestUpdate(); }}">
                    ${subsub.name}
                  </button>`)}
              </div>` : html``}
            <div class="re-content-scroll" style="${hasIframe ? 'padding: 0; overflow: hidden; display: flex; flex-direction: column;' : 'overflow-y: auto; overflow-x: hidden;'}">
              ${hasIframe
                ? sensorsRaw.map(id => this.renderEntity(id))
                : isDesignMode
                  ? html`<div class="design-grid" style="height:100%;">${(activeSubMenu.widgets || []).map(w => this._renderDesignWidget(w, (activeSubMenu.widgets || []).length === 1))}</div>`
                  : html`
                      <div class="re-sensor-grid">
                        ${(effectiveFilter === 'all'
                          ? sensorsRaw
                          : sensorsRaw.filter(id => {
                              const s = (activeSubMenu.sensors || []).find(s => (s.entity||s) === id);
                              return s && s.type === effectiveFilter;
                            })
                        ).map(id => this.renderEntity(id))}
                      </div>`}
            </div>
          </div>
        </div>
      </div>`;
  }

  static get styles() {
    // FUSION des deux blocs : cartes-capteurs (cardStyles) + layout container
    return [cardStyles, css`
      :host { display: block; font-family: 'Courier New', Courier, monospace; background: transparent; }
      * { box-sizing: border-box; }
      .re-container { display: flex; flex-direction: column; height: 550px; background: transparent; border: none; border-radius: 0; overflow: hidden; padding: 0; gap: 10px; box-sizing: border-box; }
      .re-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: linear-gradient(135deg,#0d1b2e,#111827); border: 1px solid #1a2744; border-radius: 10px; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,.45); }
      .re-logo { display: flex; align-items: center; gap: 12px; }
      .re-umbrella { width: 44px; height: 44px; flex-shrink: 0; }
      .re-umbrella-icon { width: 100%; height: 100%; object-fit: contain; }
      .re-title-block { display: flex; flex-direction: column; }
      .re-title { font-size: var(--ec-fs-title, 18px); font-weight: 800; color: var(--ec-text, #e2e8f0); letter-spacing: 2px; line-height: 1.2; }
      .re-subtitle { font-size: 12px; color: #475569; letter-spacing: 3px; }
      .re-status { display: flex; align-items: center; gap: 8px; }
      .re-status-text { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
      .re-ecg { width: 80px; height: 24px; flex-shrink: 0; }
      .re-nav { display: flex; gap: 0; border: 1px solid #1a2744; border-radius: 10px; background: var(--ec-side-bg, #060b12); flex-shrink: 0; overflow-x: auto; box-shadow: 0 4px 16px rgba(0,0,0,.45); }
      .main-nav-item { padding: 10px 14px; font-size: var(--ec-fs-nav, 12px); font-weight: 700; color: var(--ec-text-dim, #475569); cursor: pointer; letter-spacing: 1px; white-space: nowrap; border-bottom: 2px solid transparent; border-radius: 8px 8px 0 0; transition: all .2s; }
      .main-nav-item:hover { color: #94a3b8; background: rgba(255,255,255,.03); }
      .main-nav-item.active { color: var(--ec-accent, #ef4444); border-bottom-color: var(--ec-accent, #ef4444); background: rgba(239,68,68,.05); }
      .re-body { display: flex; flex: 1; min-height: 0; gap: 10px; }
      .re-sidebar { width: var(--ec-sidebar-w, 200px); flex-shrink: 0; background: var(--ec-side-bg, #060b12); border: 1px solid #1a2744; border-radius: 10px; display: flex; flex-direction: column; gap: 2px; padding: 8px 6px; overflow-y: auto; box-shadow: 0 4px 16px rgba(0,0,0,.45); }
      .submenu-btn { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--ec-text-dim, #475569); font-family: inherit; font-size: var(--ec-fs-side, 12px); font-weight: 600; cursor: pointer; letter-spacing: .5px; text-align: left; width: 100%; transition: all .15s; }
      .submenu-btn:hover { color: #94a3b8; background: rgba(255,255,255,.04); }
      .submenu-btn.active { color: var(--ec-active, #22c55e); background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.25); }
      .submenu-btn ha-icon { --mdc-icon-size: 16px; flex-shrink: 0; }
      .re-content-container { flex: 1; min-width: 0; display: flex; flex-direction: column; border: 1px solid #1a2744; border-radius: 10px; background: var(--ec-bg, #080d14); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,.45); }
      .re-filter-bar { display: flex; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #1a2744; flex-shrink: 0; flex-wrap: wrap; }
      .filter-item { padding: 4px 12px; border-radius: 20px; border: 1px solid #1e2d3d; background: transparent; color: var(--ec-text-dim, #475569); font-family: inherit; font-size: var(--ec-fs-filter, 12px); font-weight: 600; cursor: pointer; letter-spacing: .5px; transition: all .15s; }
      .filter-item:hover { color: #94a3b8; }
      .filter-item.active { color: #06b6d4; border-color: rgba(6,182,212,.4); background: rgba(6,182,212,.08); }
      .re-content-scroll { flex: 1; overflow-y: hidden; padding: 12px; min-height: 0; display: flex; flex-direction: column; }
      .re-content-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      .re-content-scroll::-webkit-scrollbar { display: none; }
      .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      .no-scrollbar::-webkit-scrollbar { display: none; }

      /* ═══ LOGO UMBRELLA EN ROTATION ═══ */
      .re-umbrella-icon { animation: re-logo-spin 12s linear infinite; transform-origin: 50% 50%; }
      .re-umbrella:hover .re-umbrella-icon { animation-duration: 2s; }
      @keyframes re-logo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

      /* ═══ CADRES HUD SCI-FI (coins coupés + équerres) ═══ */
      .re-header, .re-nav, .re-sidebar, .re-content-container {
        position: relative;
        border-radius: 2px;
        border: 1px solid var(--ec-hud-border, rgba(34,211,238,.30));
        clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
        box-shadow: inset 0 0 26px rgba(34,211,238,.05);
      }
      /* Équerres lumineuses sur les coins droits */
      .re-header::before, .re-nav::before, .re-sidebar::before, .re-content-container::before {
        content: ''; position: absolute; top: 0; right: 0; width: 26px; height: 26px;
        border-top: 2px solid var(--ec-hud, #22d3ee); border-right: 2px solid var(--ec-hud, #22d3ee);
        pointer-events: none; z-index: 10; filter: drop-shadow(0 0 4px var(--ec-hud, #22d3ee));
      }
      .re-header::after, .re-nav::after, .re-sidebar::after, .re-content-container::after {
        content: ''; position: absolute; bottom: 0; left: 0; width: 26px; height: 26px;
        border-bottom: 2px solid var(--ec-hud, #22d3ee); border-left: 2px solid var(--ec-hud, #22d3ee);
        pointer-events: none; z-index: 10; filter: drop-shadow(0 0 4px var(--ec-hud, #22d3ee));
      }
      /* Traits d'angle sur les coins coupés */
      .re-hud-cut-tl, .re-hud-cut-br { position: absolute; width: 24px; height: 2px;
        background: var(--ec-hud, #22d3ee); pointer-events: none; z-index: 10;
        filter: drop-shadow(0 0 4px var(--ec-hud, #22d3ee)); }
      .re-hud-cut-tl { top: 7px; left: -4px; transform: rotate(-45deg); }
      .re-hud-cut-br { bottom: 7px; right: -4px; transform: rotate(-45deg); }

      /* ═══ AMBIANCE RESIDENT EVIL ═══ */
      .re-container { cursor: crosshair; position: relative; }
      .re-scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 9;
        background:
          repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 3px),
          radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.38) 100%); }
      .re-glitch { animation: re-glitch-fx .28s steps(2, end) 1; }
      @keyframes re-glitch-fx {
        0%   { filter: hue-rotate(70deg) saturate(3); transform: translateX(2px) skewX(.4deg); }
        25%  { transform: translateX(-3px); clip-path: inset(8% 0 55% 0); }
        50%  { clip-path: inset(55% 0 6% 0); transform: translateX(3px); filter: hue-rotate(-50deg); }
        75%  { clip-path: none; transform: translateX(-1px); }
        100% { filter: none; transform: none; clip-path: none; }
      }
      .re-bio-banner { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 6px;
        border: 2px solid #ef4444; background: rgba(239,68,68,.12); color: #ef4444;
        font-size: 13px; font-weight: 800; letter-spacing: 1.5px; max-width: 46%;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        animation: batt-flash 0.9s infinite alternate; }
      .re-biohazard { --ec-hud: #ef4444; --ec-hud-border: rgba(239,68,68,.45); }
      .re-biohazard .re-umbrella-icon { animation-duration: 1.4s; }
      .re-boot { position: absolute; inset: 0; z-index: 60; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 14px; background: #05080f;
        animation: re-boot-out .4s ease 1.25s forwards; }
      .re-boot-bar { width: 260px; height: 8px; border: 1px solid #22d3ee55; border-radius: 4px; overflow: hidden; }
      .re-boot-bar div { height: 100%; width: 0; background: linear-gradient(90deg,#22d3ee,#ef4444);
        animation: re-boot-fill 1.3s ease forwards; box-shadow: 0 0 10px #22d3ee; }
      .re-boot-dots { animation: batt-flash 0.6s infinite alternate; }
      @keyframes re-boot-fill { to { width: 100%; } }
      @keyframes re-boot-out  { to { opacity: 0; visibility: hidden; } }
      .re-sensor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
      .design-grid { display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; width: 100%; }
      .dw-card { background: #0a0a0a; cursor: pointer; position: relative; transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden; box-sizing: border-box; flex-shrink: 0; min-height: 60px; border: 1px solid #1e1e1e; }
      .dw-card.no-border { border-color: transparent !important; background: transparent; }
      .dw-card.no-border:hover { border-color: #222 !important; }
      .dw-card::before { content:''; position:absolute; top:0; left:0; width:2px; height:100%; transition: background 0.2s; }
      .dw-card.no-border::before { display: none; }
      .dw-card:hover { border-color: #333; }
    `];
  }
}

// ==========================================
// ÉDITEUR
// ==========================================
class ResidentEvilCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: {}, _tab: { type: Number }, _ci: { type: Number }, _si: { type: Number } };
  }

  constructor() { super(); this._tab = 0; this._ci = 0; this._si = 0; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); }
  _fire() { this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true })); }
  _mutate(fn) { const c = JSON.parse(JSON.stringify(this._config)); fn(c); this._config = c; this._fire(); this.requestUpdate(); }

  // ─── petits helpers UI ───
  _lbl(t) { return html`<div style="font-size:13px;color:#7dd3fc;font-weight:700;letter-spacing:.5px;margin:2px 0 4px;">${t}</div>`; }
  _txt(val, cb, ph='', list='') {
    return html`<input type="text" list="${list}" placeholder="${ph}" .value="${val ?? ''}"
      style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;
             padding:9px 10px;font-size:14px;border-radius:6px;font-family:inherit;"
      @change="${(e)=>cb(e.target.value)}" />`;
  }
  _num(val, cb, min=8, max=60) {
    return html`<input type="number" min="${min}" max="${max}" .value="${val ?? ''}"
      style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;
             padding:9px 10px;font-size:14px;border-radius:6px;font-family:inherit;"
      @change="${(e)=>cb(e.target.value === '' ? undefined : parseInt(e.target.value))}" />`;
  }
  _color(val, def, cb) {
    return html`
      <div style="display:flex;gap:6px;align-items:center;">
        <input type="color" .value="${val || def}"
          style="width:48px;height:38px;border:1px solid #2a3a52;border-radius:6px;background:#0d1117;padding:2px;cursor:pointer;"
          @change="${(e)=>cb(e.target.value)}" />
        <button title="Réinitialiser" style="background:#1a2433;border:1px solid #2a3a52;color:#94a3b8;border-radius:6px;
                width:34px;height:38px;cursor:pointer;font-size:15px;" @click="${()=>cb(undefined)}">↺</button>
      </div>`;
  }
  _btn(label, cb, color='#334155', title='') {
    return html`<button title="${title}" style="background:${color}22;border:1px solid ${color}66;color:#e2e8f0;
      border-radius:6px;padding:8px 11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;"
      @click="${cb}">${label}</button>`;
  }

  // Édition des capteurs du widget "energie" : devices[] et custom_names
  // (une ligne par appareil) sont modifiés ensemble pour rester alignés.
  _renderEnergieDevicesEditor(ci, si, wi, wg) {
    const ec    = wg.energie_config || {};
    const devs  = ec.devices || [];
    const names = (ec.custom_names || '').split('\n');
    const edit  = (fn) => this._mutate(c => {
      const w = c.categories[ci].submenus[si].widgets[wi];
      w.energie_config = w.energie_config || {};
      const e = w.energie_config;
      e.devices = e.devices || [];
      const n = (e.custom_names || '').split('\n');
      while (n.length < e.devices.length) n.push('');
      fn(e, n);
      e.custom_names = n.join('\n');
    });
    return html`
      <div style="margin-top:10px;background:#101826;border:1px solid #00f9f933;border-radius:10px;padding:12px;">
        ${this._lbl('⚡ CAPTEURS DE CONSOMMATION (' + devs.length + ')')}
        <div style="display:flex;flex-direction:column;gap:6px;max-height:380px;overflow-y:auto;padding-right:4px;">
          ${devs.map((d, di) => html`
            <div style="display:flex;gap:6px;align-items:center;">
              <div style="flex:1.4;min-width:0;">${this._txt(d, v => edit((e,n)=>{ e.devices[di]=v; }), 'sensor.…_power', 're2ents')}</div>
              <div style="flex:1;min-width:0;">${this._txt(names[di], v => edit((e,n)=>{ n[di]=v; }), 'Nom affiché')}</div>
              ${this._btn('▲', () => edit((e,n)=>{ if(di<1)return; [e.devices[di-1],e.devices[di]]=[e.devices[di],e.devices[di-1]]; [n[di-1],n[di]]=[n[di],n[di-1]]; }), '#334155')}
              ${this._btn('▼', () => edit((e,n)=>{ if(di>=e.devices.length-1)return; [e.devices[di+1],e.devices[di]]=[e.devices[di],e.devices[di+1]]; [n[di+1],n[di]]=[n[di],n[di+1]]; }), '#334155')}
              ${this._btn('🗑', () => edit((e,n)=>{ e.devices.splice(di,1); n.splice(di,1); }), '#ef4444')}
            </div>`)}
        </div>
        <div style="margin-top:8px;">
          ${this._btn('＋ Ajouter un capteur', () => edit((e,n)=>{ e.devices.push(''); n.push(''); }), '#22c55e')}
        </div>
      </div>`;
  }

  static get WIDGET_SCHEMAS() {
    const E='entity', T='text', N='number', S='select';
    return {
      spa_temp: [
        {k:'view',l:'Vue',t:S,o:['home','chem','sw','prog','cam']},
        {k:'entity',l:'Température eau',t:E},{k:'targetEntity',l:'Thermostat (climate)',t:E},
        {k:'bgImage',l:'Image de fond',t:T},{k:'color',l:'Couleur',t:T},
        {k:'cameraEntity',l:'Caméra',t:E},{k:'scheduleEntity',l:'Heure cible',t:E},
        {k:'progEnableEntity',l:'Bool. programmation',t:E},
      ],
      tank: [
        {k:'tank_title',l:'Titre',t:T},{k:'subtitle',l:'Sous-titre',t:T},{k:'capacity',l:'Capacité (L)',t:N},
        {k:'tank_level_entity',l:'Niveau (%)',t:E},{k:'tank_volume_entity',l:'Volume (L)',t:E},
        {k:'alert_entity',l:'Alerte',t:E},{k:'depth_entity',l:'Profondeur',t:E},
        {k:'sensor_state_entity',l:'État capteur',t:E},{k:'inflow_entity',l:'Pluie directe',t:E},
        {k:'rain_entity',l:'Précipitations',t:E},{k:'temp_entity',l:'Temp. ext.',t:E},
        {k:'temp_cabane_entity',l:'Temp. cabane',t:E},{k:'temp_min_entity',l:'Min annuel',t:E},{k:'temp_max_entity',l:'Max annuel',t:E},
      ],
      server: [
        {k:'server_name',l:'Nom',t:T},{k:'server_os',l:'OS',t:T},{k:'server_icon',l:'Icône',t:T},
        {k:'cpu_entity',l:'CPU',t:E},{k:'ram_entity',l:'RAM',t:E},{k:'hdd_entity',l:'Disque',t:E},
        {k:'status_entity',l:'Statut',t:E},{k:'uptime_entity',l:'Uptime',t:E},
        {k:'restart_entity',l:'Bouton redémarrer',t:E},{k:'process_entity',l:'Processus',t:E},
      ],
      plant: [
        {k:'plant_name',l:'Nom',t:T},{k:'latin_name',l:'Nom latin',t:T},
        {k:'plant_image',l:'Image',t:T},{k:'battery_sensor',l:'Batterie',t:E},
      ],
      solar:   [ {k:'active_tab',l:'Onglet (0=Sol 1=Météo 2=Batt 3=Éco)',t:S,o:['0','1','2','3']} ],
      appliance: [ {k:'view',l:'Catégorie figée (0/1/2)',t:S,o:['0','1','2']} ],
      energie: [
        {k:'energie_config.title',l:'Titre',t:T},{k:'energie_config.solar',l:'Production solaire',t:E},
        {k:'energie_config.linky',l:'Réseau (Linky)',t:E},{k:'energie_config.talon',l:'Talon (W)',t:N},
        {k:'energie_config.kwh_price',l:'Prix kWh (€)',t:N},
      ],
    };
  }

  _wgGet(wg, key) {
    return key.split('.').reduce((o,k)=>o?.[k], wg);
  }
  _wgSet(ci, si, wi, key, val) {
    this._mutate(c => {
      let o = c.categories[ci].submenus[si].widgets[wi];
      const parts = key.split('.');
      for (let i=0;i<parts.length-1;i++) { if(!o[parts[i]]) o[parts[i]]={}; o=o[parts[i]]; }
      const last = parts[parts.length-1];
      if (val === undefined || val === '') delete o[last]; else o[last] = val;
    });
  }

  // Éditeur générique d'un widget : champs du schéma + listes spécifiques
  _renderWidgetEditor(ci, si, wi, wg) {
    const schema = (this.constructor.WIDGET_SCHEMAS[wg.type] || []);
    const selStyle = 'width:100%;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;padding:9px 10px;font-size:14px;border-radius:6px;font-family:inherit;';
    const field = (f) => {
      const cur = this._wgGet(wg, f.k);
      if (f.t === 'select') return html`
        <div>${this._lbl(f.l)}
          <select style="${selStyle}" @change="${e=>this._wgSet(ci,si,wi,f.k, isNaN(parseInt(e.target.value)) ? e.target.value : (f.k==='view'||f.k==='active_tab'?parseInt(e.target.value):e.target.value))}">
            ${f.o.map(o=>html`<option value="${o}" ?selected="${String(cur)===String(o)}">${o}</option>`)}
          </select>
        </div>`;
      if (f.t === 'number') return html`<div>${this._lbl(f.l)}${this._num(cur, v=>this._wgSet(ci,si,wi,f.k,v), 0, 100000)}</div>`;
      return html`<div>${this._lbl(f.l)}${this._txt(cur, v=>this._wgSet(ci,si,wi,f.k,v), '', f.t==='entity'?'re2ents':'')}</div>`;
    };

    // Listes spécifiques : capteurs de plante / personnes de tracker-map / capteurs santé
    const listRows = (path, cols, mk) => {
      const arr = this._wgGet(wg, path) || [];
      return html`
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">
          ${arr.map((row, ri) => html`
            <div style="display:flex;gap:6px;align-items:center;">
              ${cols.map(cdef => html`
                <div style="flex:${cdef.flex||1};min-width:0;">
                  ${this._txt(row[cdef.k], v=>this._mutate(c=>{ this._wgGet(c.categories[ci].submenus[si].widgets[wi], path)[ri][cdef.k]=v; }), cdef.l, cdef.e?'re2ents':'')}
                </div>`)}
              ${this._btn('🗑', ()=>this._mutate(c=>{ this._wgGet(c.categories[ci].submenus[si].widgets[wi], path).splice(ri,1); }), '#ef4444')}
            </div>`)}
          ${this._btn('＋ Ajouter', ()=>this._mutate(c=>{
            let o = c.categories[ci].submenus[si].widgets[wi];
            const parts = path.split('.');
            for (let i=0;i<parts.length-1;i++){ if(!o[parts[i]]) o[parts[i]]={}; o=o[parts[i]]; }
            if (!o[parts[parts.length-1]]) o[parts[parts.length-1]] = [];
            o[parts[parts.length-1]].push(mk());
          }), '#22c55e')}
        </div>`;
    };

    return html`
      <div style="margin-top:8px;background:#0b121d;border:1px solid #2a3a52;border-radius:8px;padding:10px;">
        ${schema.length ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${schema.map(f=>field(f))}</div>` : html``}
        ${wg.type==='plant' ? html`
          <div style="margin-top:8px;">${this._lbl('Capteurs de la plante')}
            ${listRows('sensors', [{k:'name',l:'Nom'},{k:'entity',l:'Entité',e:true,flex:1.4}], ()=>({name:'',entity:''}))}
          </div>` : html``}
        ${(wg.type==='tracker'||wg.type==='map') ? html`
          <div style="margin-top:8px;">${this._lbl('Personnes')}
            ${listRows('persons', [
              {k:'name',l:'Nom'},{k:'person',l:'person.…',e:true,flex:1.3},
              {k:'geocoded_entity',l:'Lieu géocodé',e:true,flex:1.3},{k:'distance_entity',l:'Distance',e:true,flex:1.3},
            ], ()=>({name:'',person:''}))}
          </div>` : html``}
      </div>`;
  }

  _setTheme(key, val) {
    this._mutate(c => { if (!c.theme) c.theme = {}; if (val === undefined || val === '') delete c.theme[key]; else c.theme[key] = val; if (Object.keys(c.theme).length === 0) delete c.theme; });
  }

  render() {
    if (!this._config) return html``;
    const cats = this._config.categories || [];
    if (this._ci >= cats.length) this._ci = Math.max(0, cats.length - 1);
    const cat  = cats[this._ci] || null;
    const subs = cat ? (cat.submenus || []) : [];
    if (this._si >= subs.length) this._si = Math.max(0, subs.length - 1);
    const sub  = subs[this._si] || null;
    const ci = this._ci, si = this._si;

    const entOptions = this.hass ? Object.keys(this.hass.states).sort() : [];

    const tabBtn = (i, label) => html`
      <button style="flex:1;padding:10px 6px;border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:800;
                     letter-spacing:.5px;cursor:pointer;background:${this._tab===i?'#ef4444':'#1a2433'};
                     color:${this._tab===i?'#fff':'#94a3b8'};"
        @click="${()=>{ this._tab = i; this.requestUpdate(); }}">${label}</button>`;

    // ═════════ ONGLET GÉNÉRAL ═════════
    const renderGeneral = () => html`
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>${this._lbl('Titre de la carte')}${this._txt(this._config.title, v=>this._mutate(c=>c.title=v))}</div>
        <div>${this._lbl('Logo (URL)')}${this._txt(this._config.logo, v=>this._mutate(c=>{ if(v) c.logo=v; else delete c.logo; }), '/local/Umbrella.png')}</div>
        <div>${this._lbl('Entité de statut (en-tête)')}${this._txt(this._config.status_entity, v=>this._mutate(c=>{ if(v) c.status_entity=v; else delete c.status_entity; }), 'binary_sensor.…', 're2ents')}</div>
        <div>${this._lbl('Hauteur de la carte (px)')}${this._num(this._config.card_height ?? 550, v=>this._mutate(c=>{ if(v) c.card_height=v; else delete c.card_height; }), 300, 1600)}</div>
      </div>`;

    // ═════════ ONGLET THÈME ═════════
    const th = this._config.theme || {};
    const colorRow = (label, key, def) => html`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#101826;
                  border:1px solid #1e2d3d;border-radius:8px;padding:8px 12px;">
        <span style="font-size:14px;color:#cbd5e1;font-weight:600;">${label}</span>
        ${this._color(th[key], def, v=>this._setTheme(key, v))}
      </div>`;
    const sizeRow = (label, key, def, min=8, max=40) => html`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#101826;
                  border:1px solid #1e2d3d;border-radius:8px;padding:8px 12px;">
        <span style="font-size:14px;color:#cbd5e1;font-weight:600;">${label} <span style="color:#475569;">(${def})</span></span>
        <div style="width:90px;">${this._num(th[key], v=>this._setTheme(key, v), min, max)}</div>
      </div>`;
    const renderTheme = () => html`
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="border:1px solid #1e2d3d;border-radius:10px;padding:10px;background:${th.bg||'#080d14'};display:flex;flex-direction:column;gap:6px;">
          <div style="font-size:${parseInt(th.fs_title)||18}px;font-weight:800;color:${th.text||'#e2e8f0'};">APERÇU — ${this._config.title||'TITRE'}</div>
          <div style="display:flex;gap:6px;">
            <span style="font-size:${parseInt(th.fs_nav)||12}px;font-weight:700;color:${th.accent||'#ef4444'};border-bottom:2px solid ${th.accent||'#ef4444'};padding:4px 8px;">MENU ACTIF</span>
            <span style="font-size:${parseInt(th.fs_nav)||12}px;font-weight:700;color:${th.text_dim||'#475569'};padding:4px 8px;">MENU</span>
          </div>
          <div style="display:flex;gap:8px;">
            <div style="width:${parseInt(th.sidebar_width)||200}px;max-width:40%;background:${th.side_bg||'#060b12'};border:1px solid ${ (th.hud||'#22d3ee')}55;border-radius:6px;padding:6px;">
              <div style="font-size:${parseInt(th.fs_side)||12}px;font-weight:700;color:${th.active||'#22c55e'};">▸ SOUS-MENU ACTIF</div>
              <div style="font-size:${parseInt(th.fs_side)||12}px;color:${th.text_dim||'#475569'};">▸ Sous-menu</div>
            </div>
            <div style="flex:1;border:1px solid ${(th.hud||'#22d3ee')}55;border-radius:6px;padding:6px;background:rgba(255,255,255,.02);">
              <div style="font-size:${parseInt(th.fs_name)||12}px;color:${th.text_dim||'#475569'};">Capteur</div>
              <div style="font-size:${parseInt(th.fs_value)||18}px;font-weight:800;color:${th.text||'#e2e8f0'};">21.5 °C</div>
            </div>
          </div>
        </div>
        <div>
          ${this._lbl('🎨 COULEURS')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${colorRow('Menu actif (accent)', 'accent', '#ef4444')}
            ${colorRow('Sous-menu actif', 'active', '#22c55e')}
            ${colorRow('Fond de la carte', 'bg', '#080d14')}
            ${colorRow('Barre latérale', 'side_bg', '#060b12')}
            ${colorRow('Texte principal', 'text', '#e2e8f0')}
            ${colorRow('Texte secondaire', 'text_dim', '#475569')}
            ${colorRow('Cadres HUD (équerres)', 'hud', '#22d3ee')}
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#101826;
                        border:1px solid #1e2d3d;border-radius:8px;padding:8px 12px;">
              <span style="font-size:14px;color:#cbd5e1;font-weight:600;">Sons d'interface</span>
              <div style="display:flex;gap:6px;">
                ${this._btn(th.sounds === false ? 'Activer' : '🔊 Actifs', ()=>this._setTheme('sounds', th.sounds === false ? undefined : false), th.sounds === false ? '#334155' : '#22c55e')}
              </div>
            </div>
          </div>
        </div>
        <div>
          ${this._lbl('🔠 TAILLES (px)')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${sizeRow('Titre', 'fs_title', 18)}
            ${sizeRow('Menus du haut', 'fs_nav', 12)}
            ${sizeRow('Sous-menus', 'fs_side', 12)}
            ${sizeRow('Filtres', 'fs_filter', 12)}
            ${sizeRow('Nom des capteurs', 'fs_name', 12)}
            ${sizeRow('Valeur des capteurs', 'fs_value', 18)}
            ${sizeRow('Largeur barre latérale', 'sidebar_width', 200, 120, 360)}
          </div>
        </div>
        <button style="background:#7f1d1d33;border:1px solid #7f1d1d;color:#fca5a5;border-radius:8px;
                       padding:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;"
          @click="${()=>this._mutate(c=>delete c.theme)}">↺ Réinitialiser tout le thème</button>
      </div>`;

    // ═════════ ONGLET STRUCTURE ═════════
    const selStyle = 'flex:1;min-width:0;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;padding:9px 10px;font-size:14px;border-radius:6px;font-family:inherit;';
    const mode = sub ? (sub.iframe ? 'iframe' : (sub.mode === 'design' ? 'design' : 'grid')) : 'grid';
    const ssubs = sub ? (sub.subsubmenus || []) : [];
    const sensors = (sub && mode === 'grid') ? (sub.sensors || []) : [];

    const moveItem = (arrPath, idx, dir, fix) => this._mutate(c => {
      const arr = arrPath(c);
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      if (fix) fix(j);
    });

    const renderStructure = () => html`
      <div style="display:flex;flex-direction:column;gap:16px;">

        <!-- ── CATÉGORIE (menu du haut) ── -->
        <div style="background:#101826;border:1px solid #ef444433;border-radius:10px;padding:12px;">
          ${this._lbl('1️⃣ MENU PRINCIPAL (titres)')}
          <div style="display:flex;gap:6px;margin-bottom:8px;">
            <select style="${selStyle}" @change="${e=>{ this._ci = parseInt(e.target.value); this._si = 0; this.requestUpdate(); }}">
              ${cats.map((c,i)=>html`<option value="${i}" ?selected="${ci===i}">${c.name||('Catégorie '+i)}</option>`)}
            </select>
            ${this._btn('＋', ()=>this._mutate(c=>{ c.categories = c.categories||[]; c.categories.push({name:'NOUVELLE CATÉGORIE',submenus:[]}); this._ci = c.categories.length-1; this._si = 0; }), '#22c55e', 'Ajouter une catégorie')}
            ${this._btn('◀', ()=>moveItem(c=>c.categories, ci, -1, j=>this._ci=j), '#334155', 'Déplacer à gauche')}
            ${this._btn('▶', ()=>moveItem(c=>c.categories, ci, +1, j=>this._ci=j), '#334155', 'Déplacer à droite')}
            ${this._btn('⧉', ()=>this._mutate(c=>{ c.categories.splice(ci+1,0,JSON.parse(JSON.stringify(c.categories[ci]))); c.categories[ci+1].name += ' (copie)'; this._ci=ci+1; }), '#06b6d4', 'Dupliquer la catégorie')}
            ${this._btn('🗑', ()=>{ if(!cat) return; if(!confirm('Supprimer la catégorie « '+(cat.name||'')+' » et tout son contenu ?')) return; this._mutate(c=>{ c.categories.splice(ci,1); this._ci = 0; this._si = 0; }); }, '#ef4444', 'Supprimer la catégorie')}
          </div>
          ${cat ? this._txt(cat.name, v=>this._mutate(c=>c.categories[ci].name=v), 'Nom de la catégorie') : html``}
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
            ${this._btn('⭳ Exporter la catégorie', ()=>{ if(!cat) return;
              const json = JSON.stringify(cat, null, 2);
              if (navigator.clipboard) navigator.clipboard.writeText(json).then(()=>alert('Catégorie copiée dans le presse-papier (JSON).'));
              else prompt('Copie ce JSON :', json); }, '#06b6d4')}
            ${this._btn(this._impOpen ? '✕ Fermer' : '⭱ Importer une catégorie', ()=>{ this._impOpen=!this._impOpen; this.requestUpdate(); }, '#f59e0b')}
          </div>
          ${this._impOpen ? html`
            <div style="margin-top:8px;">
              <textarea id="re2-imp" rows="5" placeholder='Colle ici le JSON d&apos;une catégorie exportée'
                style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;
                       padding:9px 10px;font-size:13px;border-radius:6px;font-family:'Courier New',monospace;"></textarea>
              <div style="margin-top:6px;">
                ${this._btn('Importer', ()=>{
                  const ta = this.shadowRoot.querySelector('#re2-imp');
                  try {
                    const obj = JSON.parse(ta.value);
                    if (!obj || !obj.name) { alert('JSON invalide : il faut un objet catégorie avec "name".'); return; }
                    this._mutate(c=>{ c.categories.push(obj); this._ci=c.categories.length-1; this._si=0; });
                    ta.value=''; this._impOpen=false; this.requestUpdate();
                  } catch(e) { alert('JSON invalide : ' + e.message); }
                }, '#22c55e')}
              </div>
            </div>` : html``}
        </div>

        ${cat ? html`
        <!-- ── SOUS-MENU ── -->
        <div style="background:#101826;border:1px solid #22c55e33;border-radius:10px;padding:12px;">
          ${this._lbl('2️⃣ SOUS-MENUS (sous-titres, barre latérale)')}
          <div style="display:flex;gap:6px;margin-bottom:8px;">
            <select style="${selStyle}" @change="${e=>{ this._si = parseInt(e.target.value); this.requestUpdate(); }}">
              ${subs.map((s,i)=>html`<option value="${i}" ?selected="${si===i}">${s.name||('Sous-menu '+i)}</option>`)}
            </select>
            ${this._btn('＋', ()=>this._mutate(c=>{ const cc=c.categories[ci]; cc.submenus=cc.submenus||[]; cc.submenus.push({name:'NOUVEAU SOUS-MENU',icon:'mdi:folder',mode:'grid',subsubmenus:[{id:'all',name:'TOUT'}],sensors:[]}); this._si=cc.submenus.length-1; }), '#22c55e', 'Ajouter un sous-menu')}
            ${this._btn('▲', ()=>moveItem(c=>c.categories[ci].submenus, si, -1, j=>this._si=j), '#334155', 'Monter')}
            ${this._btn('▼', ()=>moveItem(c=>c.categories[ci].submenus, si, +1, j=>this._si=j), '#334155', 'Descendre')}
            ${this._btn('⧉', ()=>this._mutate(c=>{ const a=c.categories[ci].submenus; a.splice(si+1,0,JSON.parse(JSON.stringify(a[si]))); a[si+1].name += ' (copie)'; this._si=si+1; }), '#06b6d4', 'Dupliquer le sous-menu')}
            ${this._btn('🗑', ()=>{ if(!sub) return; if(!confirm('Supprimer le sous-menu « '+(sub.name||'')+' » ?')) return; this._mutate(c=>{ c.categories[ci].submenus.splice(si,1); this._si=0; }); }, '#ef4444', 'Supprimer le sous-menu')}
          </div>
          ${sub ? html`
            <div style="display:grid;grid-template-columns:1fr 180px;gap:8px;margin-bottom:8px;">
              <div>${this._lbl('Nom')}${this._txt(sub.name, v=>this._mutate(c=>c.categories[ci].submenus[si].name=v))}</div>
              <div>${this._lbl('Icône')}${this._txt(sub.icon, v=>this._mutate(c=>c.categories[ci].submenus[si].icon=v), 'mdi:…')}</div>
            </div>
            <div>${this._lbl("Mode d'affichage")}
              <select style="${selStyle};width:100%;" @change="${e=>{
                const val = e.target.value;
                this._mutate(c=>{ const s=c.categories[ci].submenus[si];
                  delete s.iframe;
                  if (val==='iframe') { s.iframe=true; delete s.mode; const u=(s.sensors&&s.sensors[0]&&s.sensors[0].url)||''; s.sensors=[{url:u}]; }
                  else if (val==='design') { s.mode='design'; if(!s.widgets) s.widgets=[]; if(s.sensors&&s.sensors[0]&&s.sensors[0].url) s.sensors=[]; }
                  else { s.mode='grid'; if(!Array.isArray(s.sensors)||(s.sensors[0]&&s.sensors[0].url)) s.sensors=[]; if(!s.subsubmenus) s.subsubmenus=[{id:'all',name:'TOUT'}]; }
                });
              }}">
                <option value="grid" ?selected="${mode==='grid'}">Grille de capteurs</option>
                <option value="design" ?selected="${mode==='design'}">Widgets (design)</option>
                <option value="iframe" ?selected="${mode==='iframe'}">Page iFrame</option>
              </select>
            </div>
            ${mode==='iframe' ? html`
              <div style="margin-top:8px;">${this._lbl('URL de la page')}
                ${this._txt(sub.sensors?.[0]?.url, v=>this._mutate(c=>{ c.categories[ci].submenus[si].sensors=[{url:v}]; }), '/local/page.html')}
              </div>` : html``}
            ${mode==='design' ? html`
              <div style="margin-top:10px;">${this._lbl('WIDGETS ('+(sub.widgets||[]).length+')')}</div>
              ${(sub.widgets||[]).map((wg,wi)=> html`
                <div style="margin-top:6px;background:#101826;border:1px solid #818cf833;border-radius:10px;padding:10px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="flex:1;font-size:14px;font-weight:800;color:#a5b4fc;letter-spacing:1px;">▣ ${(wg.type||'?').toUpperCase()}</span>
                    ${this._btn('▲', ()=>this._mutate(c=>{ const a=c.categories[ci].submenus[si].widgets; if(wi<1)return; [a[wi-1],a[wi]]=[a[wi],a[wi-1]]; }), '#334155')}
                    ${this._btn('▼', ()=>this._mutate(c=>{ const a=c.categories[ci].submenus[si].widgets; if(wi>=a.length-1)return; [a[wi+1],a[wi]]=[a[wi],a[wi+1]]; }), '#334155')}
                    ${this._btn('⧉', ()=>this._mutate(c=>{ const a=c.categories[ci].submenus[si].widgets; a.splice(wi+1,0,JSON.parse(JSON.stringify(a[wi]))); }), '#06b6d4', 'Dupliquer')}
                    ${this._btn('🗑', ()=>{ if(confirm('Supprimer ce widget ?')) this._mutate(c=>c.categories[ci].submenus[si].widgets.splice(wi,1)); }, '#ef4444')}
                  </div>
                  ${this._renderWidgetEditor(ci,si,wi,wg)}
                  ${wg.type==='energie' ? this._renderEnergieDevicesEditor(ci,si,wi,wg) : html``}
                </div>`)}
              <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
                <select id="re2-add-wtype" style="${selStyle}">
                  ${['spa_temp','tank','server','plant','health','solar','energie','appliance','tracker','map','gauge','badge'].map(t=>html`<option value="${t}">${t}</option>`)}
                </select>
                ${this._btn('＋ Ajouter un widget', ()=>{ const sel=this.shadowRoot.querySelector('#re2-add-wtype'); const t=sel?sel.value:'badge';
                  this._mutate(c=>{ const s=c.categories[ci].submenus[si]; s.widgets=s.widgets||[]; s.widgets.push({type:t,widthPct:100,noBorder:true}); }); }, '#22c55e')}
              </div>` : html``}
          ` : html``}
        </div>` : html``}

        ${sub && mode==='grid' ? html`
        <!-- ── SOUS-SOUS-MENUS (filtres) ── -->
        <div style="background:#101826;border:1px solid #f59e0b33;border-radius:10px;padding:12px;">
          ${this._lbl('3️⃣ FILTRES (sous-sous-titres)')}
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${ssubs.map((f,fi)=>html`
              <div style="display:flex;gap:6px;align-items:center;">
                <div style="width:120px;">${this._txt(f.id, v=>this._mutate(c=>{ const old=c.categories[ci].submenus[si].subsubmenus[fi].id; c.categories[ci].submenus[si].subsubmenus[fi].id=v; (c.categories[ci].submenus[si].sensors||[]).forEach(s=>{ if(s.type===old) s.type=v; }); }), 'id')}</div>
                <div style="flex:1;">${this._txt(f.name, v=>this._mutate(c=>c.categories[ci].submenus[si].subsubmenus[fi].name=v), 'Libellé affiché')}</div>
                ${this._btn('▲', ()=>moveItem(c=>c.categories[ci].submenus[si].subsubmenus, fi, -1), '#334155')}
                ${this._btn('▼', ()=>moveItem(c=>c.categories[ci].submenus[si].subsubmenus, fi, +1), '#334155')}
                ${this._btn('🗑', ()=>this._mutate(c=>c.categories[ci].submenus[si].subsubmenus.splice(fi,1)), '#ef4444')}
              </div>`)}
            ${this._btn('＋ Ajouter un filtre', ()=>this._mutate(c=>{ const s=c.categories[ci].submenus[si]; s.subsubmenus=s.subsubmenus||[]; s.subsubmenus.push({id:'nouveau',name:'NOUVEAU'}); }), '#22c55e')}
          </div>
        </div>

        <!-- ── CAPTEURS ── -->
        <div style="background:#101826;border:1px solid #06b6d433;border-radius:10px;padding:12px;">
          ${this._lbl('4️⃣ CAPTEURS ('+sensors.length+')')}
          <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto;padding-right:4px;">
            ${sensors.map((s,xi)=>html`
              <div style="background:#0b121d;border:1px solid #1e2d3d;border-radius:8px;padding:9px;display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;gap:6px;align-items:center;">
                  <div style="flex:1;">${this._txt(s.entity, v=>this._mutate(c=>c.categories[ci].submenus[si].sensors[xi].entity=v), 'entité',
                    ({lights:'re2sw',switches:'re2sw',binarys:'re2bin',security:'re2bin',climates:'re2sensor'})[s.type] || 're2ents')}</div>
                  ${this._btn('▲', ()=>moveItem(c=>c.categories[ci].submenus[si].sensors, xi, -1), '#334155')}
                  ${this._btn('▼', ()=>moveItem(c=>c.categories[ci].submenus[si].sensors, xi, +1), '#334155')}
                  ${this._btn('⧉', ()=>this._mutate(c=>{ const a=c.categories[ci].submenus[si].sensors; a.splice(xi+1,0,JSON.parse(JSON.stringify(a[xi]))); }), '#06b6d4')}
                  ${this._btn('🗑', ()=>this._mutate(c=>c.categories[ci].submenus[si].sensors.splice(xi,1)), '#ef4444')}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                  ${this._txt(s.name, v=>this._mutate(c=>{ if(v) c.categories[ci].submenus[si].sensors[xi].name=v; else delete c.categories[ci].submenus[si].sensors[xi].name; }), 'Nom affiché')}
                  ${this._txt(s.icon, v=>this._mutate(c=>{ if(v) c.categories[ci].submenus[si].sensors[xi].icon=v; else delete c.categories[ci].submenus[si].sensors[xi].icon; }), 'mdi:…')}
                  <select style="${selStyle};width:100%;" @change="${e=>this._mutate(c=>{ const v=e.target.value; if(v) c.categories[ci].submenus[si].sensors[xi].type=v; else delete c.categories[ci].submenus[si].sensors[xi].type; })}">
                    <option value="" ?selected="${!s.type}">— filtre —</option>
                    ${ssubs.filter(f=>f.id!=='all').map(f=>html`<option value="${f.id}" ?selected="${s.type===f.id}">${f.name||f.id}</option>`)}
                  </select>
                </div>
              </div>`)}
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
            ${this._btn('＋ Ajouter un capteur', ()=>this._mutate(c=>{ const s=c.categories[ci].submenus[si]; s.sensors=s.sensors||[]; s.sensors.push({entity:''}); }), '#22c55e')}
            ${this._btn(this._bulkOpen ? '✕ Fermer' : '⇪ Ajout en masse', ()=>{ this._bulkOpen=!this._bulkOpen; this.requestUpdate(); }, '#06b6d4')}
          </div>
          ${this._bulkOpen ? html`
            <div style="margin-top:8px;background:#0b121d;border:1px solid #06b6d433;border-radius:8px;padding:10px;">
              ${this._lbl('Une entité par ligne — les noms HA sont repris automatiquement')}
              <textarea id="re2-bulk" rows="5" placeholder="sensor.exemple_1&#10;switch.exemple_2"
                style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;
                       padding:9px 10px;font-size:13px;border-radius:6px;font-family:'Courier New',monospace;"></textarea>
              <div style="margin-top:6px;">
                ${this._btn('Importer ces entités', ()=>{
                  const ta = this.shadowRoot.querySelector('#re2-bulk');
                  if (!ta) return;
                  const ids = ta.value.split('\n').map(x=>x.trim()).filter(x=>x.includes('.'));
                  if (!ids.length) return;
                  this._mutate(c=>{ const s=c.categories[ci].submenus[si]; s.sensors=s.sensors||[];
                    ids.forEach(id=>{ const st=this.hass?.states[id];
                      s.sensors.push({entity:id, ...(st?.attributes?.friendly_name?{name:st.attributes.friendly_name}:{})}); }); });
                  ta.value=''; this._bulkOpen=false; this.requestUpdate();
                }, '#22c55e')}
              </div>
            </div>` : html``}
        </div>` : html``}
      </div>`;

    return html`
      <div style="font-family:'Roboto','Segoe UI',sans-serif;background:#080d14;border-radius:10px;overflow:hidden;border:1px solid #1a2744;">
        <datalist id="re2ents">${entOptions.map(e=>html`<option value="${e}"></option>`)}</datalist>
        <datalist id="re2sw">${entOptions.filter(e=>/^(switch|light|input_boolean)\./.test(e)).map(e=>html`<option value="${e}"></option>`)}</datalist>
        <datalist id="re2bin">${entOptions.filter(e=>e.startsWith('binary_sensor.')).map(e=>html`<option value="${e}"></option>`)}</datalist>
        <datalist id="re2sensor">${entOptions.filter(e=>e.startsWith('sensor.')).map(e=>html`<option value="${e}"></option>`)}</datalist>
        <datalist id="re2cam">${entOptions.filter(e=>e.startsWith('camera.')).map(e=>html`<option value="${e}"></option>`)}</datalist>
        <div style="background:#0d1b2e;border-bottom:1px solid #1a2744;padding:12px;">
          <div style="font-size:16px;font-weight:800;color:#ef4444;letter-spacing:2px;margin-bottom:10px;">
            ☣ RESIDENT EVIL CARD — ÉDITEUR
          </div>
          <div style="display:flex;gap:6px;">
            ${tabBtn(0,'GÉNÉRAL')}
            ${tabBtn(1,'THÈME')}
            ${tabBtn(2,'STRUCTURE')}
          </div>
        </div>
        <div style="padding:14px;max-height:600px;overflow-y:auto;">
          ${this._tab===0 ? renderGeneral() : this._tab===1 ? renderTheme() : renderStructure()}
        </div>
      </div>`;
  }
}

// ==========================================
// ENREGISTREMENT (guards + customCards)
// ==========================================
if (!customElements.get('resident-evil-card-editor')) {
  customElements.define('resident-evil-card-editor', ResidentEvilCardEditor);
}
if (!customElements.get('resident-evil-card')) {
  customElements.define('resident-evil-card', ResidentEvilCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'resident-evil-card')) {
  window.customCards.push({
    type: 'resident-evil-card',
    name: 'Resident Evil Card',
    description: 'HUD Umbrella — zones, caméras, serveurs, spa, solaire, santé, tracker',
    preview: false,
  });
}
