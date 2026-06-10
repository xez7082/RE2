import { LitElement, html, css } from 'https://unpkg.com/lit@3/index.js?module';

// ==========================================
// 1. STYLES DE LA CARTE PRINCIPALE
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
    border-bottom: 1px solid #1a1a1a;
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
    overflow-hidden: hidden;
  }
  .main-nav-item { padding: 12px 20px; font-weight: bold; font-size: 12px; cursor: pointer; color: var(--re-text-gray); border-right: 1px solid #222; white-space: nowrap; transition: all 0.2s ease; }
  .main-nav-item:hover { color: #ffffff; background: #1c0202; }
  .main-nav-item.active { color: #ffffff; background: var(--re-red); text-shadow: 0 0 5px #ffaaaa; }
  
  .re-body { display: flex; flex: 1; height: calc(100% - 93px); overflow: hidden; background: var(--re-bg); }
  .re-sidebar { width: 180px; background: #090909; border-right: 1px dashed var(--re-border-color); display: flex; flex-direction: column; gap: 8px; padding: 15px 0px 15px 10px; overflow: hidden; }
  
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
  
  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; min-height: 400px; display: block; border: none; margin: 0; padding: 0; }
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
        
        <!-- HEADER TERMINAL -->
        <div class="re-header">
          <div class="re-title">☣ UMBRELLA CORP. INTERNET BROWSER</div>
          <div class="ecg-container">
            <span class="status-text">SYSTEM STATUS: ALTERNATIVE</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L53,10 L56,20 L60,15 L100,15"></path>
            </svg>
            <img src="/local/Umbrella_Corporation_logo.svg.png" class="umbrella-img-logo" />
          </div>
        </div>

        <!-- MAIN NAVIGATION MAP -->
        <div class="re-main-menu">
          ${this.config.categories.map((c, idx) => html`
            <div class="main-nav-item ${this._activeMenuIdx === idx ? 'active' : ''}"
                 @click="${() => { this._activeMenuIdx = idx; this._activeSubmenuIdx = 0; this._activeFilter = 'all'; }}">
              ${c.name.toUpperCase()}
            </div>
          `)}
        </div>

        <!-- CONTENT BODY -->
        <div class="re-body">
          
          <!-- SIDEBAR -->
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

          <!-- MAIN CONTAINER -->
          <div class="re-content-container">
            
            <!-- FILTRES HORIZONTAUX -->
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

            <!-- SCROLLABLE INNER CONTENT -->
            <div class="re-content-scroll">
              <img src="/local/Umbrella_Corporation_logo.svg.png" class="umbrella-bg-watermark" />

              <!-- RENDER IFRAME MODE DIRECT -->
              ${currentSubmenu && currentSubmenu.mode === 'iframe' ? html`
                <div class="re-iframe-wrapper">
                  <iframe class="re-iframe" src="${currentSubmenu.iframe_url}"></iframe>
                </div>
              ` : ''}

              <!-- RENDER GRID SENSORS MODE -->
              ${currentSubmenu && (!currentSubmenu.mode || currentSubmenu.mode === 'grid') ? html`
                <div class="sensors-grid">
                  ${(() => {
                    let sensorsToRender = currentSubmenu.sensors || [];
                    if (this._activeFilter !== 'all') {
                      sensorsToRender = sensorsToRender.filter(s => s.subcat === this._activeFilter);
                    }
                    
                    if (sensorsToRender.length === 0) {
                      return html`<div style="text-align:center; color:#555; padding-top:40px;">AUCUNE DONNÉE DANS CETTE ZONE</div>`;
                    }

                    return sensorsToRender.map(s => {
                      const stateObj = this.hass.states[s.entity];
                      if (!stateObj) {
                        return html`
                          <div class="sensor-card error">
                            <div class="sensor-card-header"><div class="sensor-name">${s.name || s.entity}</div></div>
                            <div class="sensor-value" style="font-size:11px;">ERR: ABSENT</div>
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
// 3. CLASSE DE L'ÉDITEUR VISUEL (FORMULAIRE TABS)
// ==========================================
class ResidentEvilCardEditor extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { type: Object }
  };

  setConfig(config) {
    this._config = config;
  }

  // Petit formulaire de repli si le YAML est modifié manuellement
  render() {
    if (!this.hass || !this._config) return html``;
    return html`
      <div style="padding: 20px; font-family: sans-serif; color: #fff; background: #222; border-radius: 4px;">
        <h3 style="color: #ff3333; margin-top: 0;">☣️ UMBRELLA ENGINE CONFIGURATOR</h3>
        <p style="font-size: 12px; color: #aaa; line-height: 1.5;">
          L'architecture modulaire de votre interface utilise des structures imbriquées complexes (Catégories ➔ Sous-menus ➔ Widgets). 
          Pour conserver un contrôle total sur vos cartes réseaux, caméras, et iFrames :
        </p>
        <div style="background: #111; padding: 12px; border-left: 3px solid #ff3333; font-size: 11px; margin: 15px 0; font-family: monospace;">
          ⚙️ Cliquez sur <strong>"Afficher l'éditeur de code"</strong> (en bas à gauche) pour ajuster finement vos entités au format YAML.
        </div>
      </div>
    `;
  }
}
customElements.define('resident-evil-card-editor', ResidentEvilCardEditor);
