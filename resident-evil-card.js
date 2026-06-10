import { LitElement, html, css } from 'https://unpkg.com/lit@3/index.js?module';

// ==========================================
// 1. DESIGN RETRO-TERMINAL AVEC ANIMATIONS
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
    display: block;
    width: 100%;
  }
  ha-card {
    background: var(--re-card-bg);
    border: 2px solid var(--re-border-color);
    border-radius: 0px; 
    color: #ffffff;
    font-family: 'Courier New', Courier, monospace;
    height: 600px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .crt-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%);
    background-size: 100% 4px;
    z-index: 10;
    pointer-events: none;
  }
  .re-header {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    background: #000000;
    border-bottom: 1px solid #1a2744;
  }
  .re-title { font-size: 14px; font-weight: bold; letter-spacing: 2px; color: #ffffff; }
  .ecg-container { display: flex; align-items: center; gap: 10px; }
  .status-text { color: var(--re-green); font-size: 11px; text-shadow: 0 0 4px var(--re-green-glow); }
  .ecg-svg { width: 90px; height: 25px; }
  .ecg-line { fill: none; stroke: var(--re-green); stroke-width: 2; stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: dash 4s linear infinite; }
  @keyframes dash { to { stroke-dashoffset: 0; } }
  
  .re-main-menu { 
    height: 43px;
    display: flex; 
    background: #111111; 
    border-bottom: 2px solid var(--re-red); 
    box-shadow: 0 4px 8px var(--re-red-glow);
  }
  .main-nav-item { padding: 12px 20px; font-weight: bold; font-size: 12px; cursor: pointer; color: var(--re-text-gray); border-right: 1px solid #222; white-space: nowrap; transition: all 0.2s ease; }
  .main-nav-item:hover { color: #ffffff; background: #1c0202; }
  .main-nav-item.active { color: #ffffff; background: var(--re-red); text-shadow: 0 0 5px #ffaaaa; }
  
  .re-body { display: flex; flex: 1; height: calc(100% - 93px); overflow: hidden; background: var(--re-bg); }
  .re-sidebar { width: 180px; background: #090909; border-right: 1px dashed var(--re-border-color); display: flex; flex-direction: column; gap: 8px; padding: 15px 0px 15px 10px; overflow-y: auto; }
  
  .submenu-btn { background: #121212; border: 1px solid #222; border-right: none; color: var(--re-text-gray); padding: 12px 10px; text-align: left; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s ease; }
  .submenu-btn:hover { color: var(--re-green); background: #151515; transform: translateX(5px); }
  .submenu-btn.active { background: #1a1a1a; color: var(--re-green); font-weight: bold; border: 1px solid var(--re-green); border-right: 3px solid var(--re-bg); transform: translateX(8px); box-shadow: -4px 4px 10px rgba(0, 0, 0, 0.5); z-index: 2; }
  .submenu-btn ha-icon { --mdc-icon-size: 18px; min-width: 18px; }
  
  .re-content-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  
  .re-filter-bar { display: flex; background: #080808; border-bottom: 1px solid #1a1a1a; padding: 5px 10px; gap: 8px; overflow-x: auto; }
  .filter-item { padding: 6px 12px; font-size: 10px; font-weight: bold; font-family: inherit; cursor: pointer; background: #111; color: var(--re-text-gray); border: 1px solid #222; white-space: nowrap; transition: all 0.15s ease; }
  .filter-item:hover { color: #fff; border-color: #555; }
  .filter-item.active { background: #1f1402; color: #ff9900; border-color: #ff9900; text-shadow: 0 0 4px rgba(255,153,0,0.4); }

  .re-content-scroll { flex: 1; padding: 20px; overflow-y: auto; background: #030303; border-left: 1px solid #1c1c1c; display: flex; flex-direction: column; box-sizing: border-box; position: relative; }
  
  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; min-height: 400px; display: block; border: none; }
  .re-iframe { width: 100%; height: 100%; border: none; background: #000; }

  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; width: 100%; z-index: 1; }
  .sensor-card { background: #0d0d0d; border: 1px solid #222; padding: 12px; cursor: pointer; position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; }
  .sensor-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #333; }
  .sensor-card:hover { border-color: var(--re-green); background: #111; }
  .sensor-card:hover::before { background: var(--re-green); }
  .sensor-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .sensor-name { font-size: 10px; color: var(--re-text-gray); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .sensor-icon { --mdc-icon-size: 20px; color: var(--re-text-gray); }
  .sensor-value { font-size: 17px; color: #aaaaaa; font-weight: bold; margin-top: 8px; }
  .sensor-value .unit { font-size: 11px; color: #666; }
  
  .error { border-color: var(--re-red-bright); color: var(--re-red-bright); }
  .umbrella-img-logo { width: 24px; height: 24px; animation: umbrella-rotate 8s linear infinite; }
  @keyframes umbrella-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .umbrella-bg-watermark { position: absolute; top: 50%; left: 50%; width: 320px; height: 320px; transform: translate(-50%, -50%); pointer-events: none; z-index: 0; opacity: 0.03; }
`;

// ==========================================
// 2. COMPOSANT DE LA CARTE PRINCIPALE
// ==========================================
class ResidentEvilCard extends LitElement {
  static styles = cardStyles;

  static getConfigElement() {
    return document.createElement("resident-evil-card-editor");
  }

  static properties = {
    hass: { type: Object },
    config: { type: Object },
    _activeMenuIdx: { type: Number, state: true },
    _activeSubmenuIdx: { type: Number, state: true },
    _activeFilter: { type: String, state: true }
  };

  constructor() {
    super();
    this._activeMenuIdx = 0;
    this._activeSubmenuIdx = 0;
    this._activeFilter = 'all';
  }

  setConfig(config) {
    if (!config.categories || !Array.isArray(config.categories)) {
      throw new Error('Veuillez spécifier des catégories valides.');
    }
    this.config = config;
  }

  _handleAction(entityId, isSwitch) {
    if (!entityId) return;
    if (isSwitch) {
      this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
    } else {
      const event = new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    }
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const cat = this.config.categories[this._activeMenuIdx];
    const sidebarItems = cat && cat.submenus ? cat.submenus : [];
    const currentSubmenu = sidebarItems[this._activeSubmenuIdx];
    const filters = currentSubmenu && currentSubmenu.subsubmenus ? currentSubmenu.subsubmenus : [];

    return html`
      <ha-card>
        <div class="crt-overlay"></div>
        
        <div class="re-header">
          <div class="re-title">☣ UMBRELLA CORP. MAINFRAME SYSTEMS</div>
          <div class="ecg-container">
            <span class="status-text">SYSTEM STATUS: ONLINE</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L53,10 L56,20 L60,15 L100,15"></path>
            </svg>
            <img src="/local/Umbrella_Corporation_logo.svg.png" class="umbrella-img-logo" />
          </div>
        </div>

        <div class="re-main-menu">
          ${this.config.categories.map((c, idx) => html`
            <div class="main-nav-item ${this._activeMenuIdx === idx ? 'active' : ''}"
                 @click="${() => { this._activeMenuIdx = idx; this._activeSubmenuIdx = 0; this._activeFilter = 'all'; }}">
              ${c.name.toUpperCase()}
            </div>
          `)}
        </div>

        <div class="re-body">
          
          ${sidebarItems.length > 0 ? html`
            <div class="re-sidebar">
              ${sidebarItems.map((sub, idx) => html`
                <button class="submenu-btn ${this._activeSubmenuIdx === idx ? 'active' : ''}"
                        @click="${() => { this._activeSubmenuIdx = idx; this._activeFilter = 'all'; }}">
                  <ha-icon icon="${sub.icon || 'mdi:folder-outline'}"></ha-icon>
                  <span>${sub.name.toUpperCase()}</span>
                </button>
              `)}
            </div>
          ` : ''}

          <div class="re-content-container">
            
            ${filters.length > 1 ? html`
              <div class="re-filter-bar">
                ${filters.map(f => html`
                  <button class="filter-item ${this._activeFilter === f.id ? 'active' : ''}"
                          @click="${() => this._activeFilter = f.id}">
                    // ${f.name.toUpperCase()}
                  </button>
                `)}
              </div>
            ` : ''}

            <div class="re-content-scroll">
              <img src="/local/Umbrella_Corporation_logo.svg.png" class="umbrella-bg-watermark" />

              ${currentSubmenu && currentSubmenu.mode === 'iframe' ? html`
                <div class="re-iframe-wrapper">
                  <iframe class="re-iframe" src="${currentSubmenu.iframe_url || ''}"></iframe>
                </div>
              ` : ''}

              ${currentSubmenu && currentSubmenu.mode === 'design' ? html`
                <div class="design-view">
                  ${currentSubmenu.widgets ? currentSubmenu.widgets.map(w => html`
                    <div style="border: 1px dashed var(--re-border-color); padding: 10px; margin-bottom: 10px; background: #080808;">
                      <span style="color: var(--re-green); font-size: 11px;">[WIDGET MODULE: ${w.type.toUpperCase()}]</span>
                      <div style="color: #fff; font-size: 12px; margin-top:5px;">Entité cible : ${w.entity || 'Aucune'}</div>
                    </div>
                  `) : html`<div style="color:var(--re-text-gray);">Aucun widget configuré pour ce module.</div>`}
                </div>
              ` : ''}

              ${currentSubmenu && (!currentSubmenu.mode || currentSubmenu.mode === 'grid') ? html`
                <div class="sensors-grid">
                  ${(() => {
                    let sensorsToRender = currentSubmenu.sensors || [];
                    if (this._activeFilter !== 'all') {
                      sensorsToRender = sensorsToRender.filter(s => s.subcat === this._activeFilter);
                    }
                    
                    if (sensorsToRender.length === 0) {
                      return html`<div style="text-align:center; color:#555; padding-top:40px;">AUCUNE DONNÉE ACCESSIBLE</div>`;
                    }

                    return sensorsToRender.map(s => {
                      const stateObj = this.hass.states[s.entity];
                      if (!stateObj) {
                        return html`
                          <div class="sensor-card error">
                            <div class="sensor-card-header"><div class="sensor-name">${s.name || s.entity}</div></div>
                            <div class="sensor-value" style="font-size:11px;">ABSENT / OFFLINE</div>
                          </div>
                        `;
                      }
                      return html`
                        <div class="sensor-card" @click="${() => this._handleAction(s.entity, false)}">
                          <div class="sensor-card-header">
                            <div class="sensor-name">${(s.name || stateObj.attributes.friendly_name || s.entity).toUpperCase()}</div>
                            <ha-icon icon="${s.icon || 'mdi:eye'}" class="sensor-icon"></ha-icon>
                          </div>
                          <div class="sensor-value">
                            ${stateObj.state} <span class="unit">${stateObj.attributes.unit_of_measurement || ''}</span>
                          </div>
                        </div>
                      `;
                    });
                  })()}
                </div>
              ` : ''}

            </div>
          </div>

        </div>
      </ha-card>
    `;
  }
}
customElements.define('resident-evil-card', ResidentEvilCard);


// ==========================================
// 3. CODE DE L'ÉDITEUR VISUEL COMPLET
// ==========================================
class ResidentEvilCardEditor extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { type: Object },
    _activeTab: { type: Number, state: true }
  };

  constructor() {
    super();
    this._activeTab = 0;
  }

  setConfig(config) {
    this._config = config;
  }

  _inp(label, path, value) {
    return html`
      <div style="margin-bottom:10px;">
        <label style="display:block;font-size:11px;color:#8a8a8a;margin-bottom:4px;text-transform:uppercase;">${label}</label>
        <input type="text" .value="${value || ''}" @change="${e => this._updateConfig(path, e.target.value)}"
               style="width:100%;background:#111;border:1px solid #2a2a2a;color:#fff;padding:6px;font-family:inherit;box-sizing:border-box;"/>
      </div>
    `;
  }

  _toggle(label, path, value) {
    return html`
      <label style="display:flex;align-items:center;gap:8px;font-size:11px;color:#8a8a8a;margin-bottom:10px;cursor:pointer;text-transform:uppercase;">
        <input type="checkbox" ?checked="${!!value}" @change="${e => this._updateConfig(path, e.target.checked)}" style="accent-color:#8b0000;"/>
        ${label}
      </label>
    `;
  }

  _updateConfig(path, value) {
    if (!this._config) return;
    const newConfig = JSON.parse(JSON.stringify(this._config));
    const parts = path.split('.');
    let current = newConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    this._config = newConfig;
    
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const self = this;

    const tabs = ["Général", "Météo", "Zones", "Vidéo", "Serveurs", "Spa", "Énergie", "Santé", "Tracker"];
    const tabStyle = (idx) => `
      padding:6px 10px;font-family:inherit;font-size:10px;font-weight:bold;cursor:pointer;
      background:${self._activeTab === idx ? '#8b0000' : '#111'};
      color:${self._activeTab === idx ? '#fff' : '#8a8a8a'};
      border:1px solid #2a2a2a;border-bottom:none;text-transform:uppercase;margin-right:2px;
    `;

    // ─────────────────────────────────────────────────────────
    // PANELS DE CONFIGURATION DE L'EDITEUR VISUEL
    // ─────────────────────────────────────────────────────────
    const renderGeneral = () => html`<div><h4>PARAMÈTRES GÉNÉRAUX</h4><p style="color:#666;font-size:11px;">Console Centrale de Supervision Générale.</p></div>`;
    
    const renderMeteo = () => {
      const ci = self._config.categories?.findIndex(c => c.name.toLowerCase() === 'meteo') !== -1 ? self._config.categories.findIndex(c => c.name.toLowerCase() === 'meteo') : 0;
      const sub = self._config.categories?.[ci]?.submenus?.[0] || {};
      return html`
        <div>
          <h4>CONFIGURATION CONFIGURATION MÉTÉO</h4>
          ${self._inp('Lien iFrame Météo (URL)', `categories.${ci}.submenus.0.iframe_url`, sub.iframe_url)}
        </div>`;
    };

    const renderZones = () => html`<div><h4>SECTEURS & ZONES</h4></div>`;
    const renderVideo = () => html`<div><h4>SYSTÈMES VIDÉO</h4></div>`;
    const renderServeurs = () => html`<div><h4>INFRASTRUCTURE SERVEURS</h4></div>`;
    
    const renderSpa = () => {
      const ci = self._config.categories?.findIndex(c => c.name.toLowerCase() === 'spa') !== -1 ? self._config.categories.findIndex(c => c.name.toLowerCase() === 'spa') : 0;
      const w = self._config.categories?.[ci]?.submenus?.[0]?.widgets?.[0] || {};
      return html`
        <div>
          <h4>MODULE LAY-Z-SPA</h4>
          ${self._inp('Capteur Température Eau', `categories.${ci}.submenus.0.widgets.0.entity`, w.entity)}
          ${self._inp('Contrôle Climate', `categories.${ci}.submenus.0.widgets.0.targetEntity`, w.targetEntity)}
          ${self._inp('Image d\'arrière plan', `categories.${ci}.submenus.0.widgets.0.bgImage`, w.bgImage)}
        </div>`;
    };

    const renderEnergie = () => html`<div><h4>FLUX ÉNERGÉTIQUES</h4></div>`;
    const renderSante = () => html`<div><h4>BIOMÉTRIE / PHYTOLOGIE</h4></div>`;
    
    const renderTracker = () => {
      const ci = self._config.categories?.findIndex(c => c.name.toLowerCase().includes('biom')) !== -1 ? self._config.categories.findIndex(c => c.name.toLowerCase().includes('biom')) : 0;
      const p = self._config.categories?.[ci]?.submenus?.[0]?.widgets?.[0]?.people?.[0] || {};
      const pi = 0;
      return html`
        <div>
          <h4>LOCALISATION TRACKERS</h4>
          ${self._inp('Geocodage', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.geocoded_entity`, p.geocoded_entity)}
        </div>`;
    };

    const panels = [renderGeneral, renderMeteo, renderZones, renderVideo, renderServeurs, renderSpa, renderEnergie, renderSante, renderTracker];

    return html`
      <div style="font-family:'Courier New',monospace;background:#080d14;border-radius:8px;overflow:hidden;">
        <div style="background:#0d1b2e;border-bottom:1px solid #1a2744;padding:10px 12px;">
          <div style="font-size:14px;font-weight:800;color:#ef4444;letter-spacing:2px;margin-bottom:8px;">
            ☣ RESIDENT EVIL CARD — ÉDITEUR
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${tabs.map((t, i) => html`
              <button style="${tabStyle(i)}" @click="${() => { self._activeTab = i; self.requestUpdate(); }}">${t}</button>
            `)}
          </div>
        </div>
        <div style="padding:14px;max-height:500px;overflow-y:auto;">
          ${panels[self._activeTab] ? panels[self._activeTab]() : html``}
        </div>
        <div style="padding:8px 14px;background:#0b1321;font-size:10px;color:#4f5e7d;text-align:right;border-top:1px solid #142238;">
          UMBRELLA OS v4.2 // ENGINE CONNECTED
        </div>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────────────────
// LA LIGNE CRUCIALE QUI MANQUAIT : ENREGISTREMENT DE L'ÉDITEUR
// ─────────────────────────────────────────────────────────
customElements.define('resident-evil-card-editor', ResidentEvilCardEditor);
