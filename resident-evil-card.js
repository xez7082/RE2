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
    border-bottom: 1px solid #1a1a1a;
  }
  .re-title { font-size: 16px; font-weight: bold; letter-spacing: 2px; color: #ffffff; }
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
    overflow: hidden;
  }
  .main-nav-item { padding: 12px 20px; font-weight: bold; font-size: 12px; cursor: pointer; color: var(--re-text-gray); border-right: 1px solid #222; white-space: nowrap; transition: all 0.2s ease; }
  .main-nav-item:hover { color: #ffffff; background: #1c0202; }
  .main-nav-item.active { color: #ffffff; background: var(--re-red); text-shadow: 0 0 5px #ffaaaa; }
  
  .re-body { display: flex; flex: 1; height: calc(100% - 95px); overflow: hidden; background: var(--re-bg); }
  .re-sidebar { width: 180px; background: #090909; border-right: 1px dashed var(--re-border-color); display: flex; flex-direction: column; gap: 8px; padding: 15px 0px 15px 10px; overflow: hidden; }
  
  .submenu-btn { background: #121212; border: 1px solid #222; border-right: none; color: var(--re-text-gray); padding: 12px 10px; text-align: left; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s ease; transform: translateX(0px); }
  .submenu-btn:hover { color: var(--re-green); background: #151515; transform: translateX(5px); }
  .submenu-btn.active { background: #1a1a1a; color: var(--re-green); font-weight: bold; border: 1px solid var(--re-green); border-right: 3px solid var(--re-bg); transform: translateX(8px); box-shadow: -4px 4px 10px rgba(0, 0, 0, 0.5); z-index: 2; }
  .submenu-btn ha-icon { --mdc-icon-size: 18px; min-width: 18px; }
  
  .re-content-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  
  .re-filter-bar { display: flex; background: #080808; border-bottom: 1px solid #1a1a1a; padding: 5px 10px; gap: 8px; overflow-x: auto; }
  .filter-item { padding: 6px 12px; font-size: 10px; font-weight: bold; font-family: inherit; cursor: pointer; background: #111; color: var(--re-text-gray); border: 1px solid #222; white-space: nowrap; transition: all 0.15s ease; }
  .filter-item:hover { color: #fff; border-color: #555; }
  .filter-item.active { background: #1f1402; color: #ff9900; border-color: #ff9900; text-shadow: 0 0 4px rgba(255,153,0,0.4); }

  .re-content-scroll { flex: 1; padding: 20px; overflow-y: auto; background: #030303; border-left: 1px solid #1c1c1c; display: flex; flex-direction: column; box-sizing: border-box; position: relative; }
  .re-content-scroll::-webkit-scrollbar { width: 6px; }
  .re-content-scroll::-webkit-scrollbar-thumb { background: var(--re-red); }

  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; width: 100%; z-index: 2; }
  
  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; display: flex; margin: 0; padding: 0; overflow: hidden; min-height: 0; z-index: 2; }
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
    font-size: 9px;
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
  .sensor-name { font-size: 10px; color: var(--re-text-gray); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .sensor-icon { --mdc-icon-size: 20px; color: var(--re-text-gray); transition: all 0.25s ease; }
  .sensor-value { font-size: 18px; color: #aaaaaa; font-weight: bold; margin-top: 8px; }
  .sensor-value .unit { font-size: 11px; color: #666; font-weight: normal; }

  .umbrella-bg-watermark {
    position: absolute;
    bottom: 15px;
    right: 15px;
    width: 140px;
    height: 140px;
    object-fit: contain;
    opacity: 0.05;
    pointer-events: none;
    z-index: 1;
  }
`;

class ResidentEvilCard extends LitElement {
  static styles = cardStyles;

  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _activeCategoryIndex: { type: Number },
      _activeSubmenuIndex: { type: Number },
      _activeFilter: { type: String }
    };
  }

  constructor() {
    super();
    this._activeCategoryIndex = 0;
    this._activeSubmenuIndex = 0;
    this._activeFilter = 'all';
  }

  setConfig(config) {
    if (!config.categories || !Array.isArray(config.categories)) {
      throw new Error("Veuillez configurer une liste de 'categories' valide.");
    }
    this.config = config;
  }

  getCardSize() {
    return 6;
  }

  _handleAction(entityId, isLong) {
    if (!entityId) return;
    const domain = entityId.split('.')[0];
    
    if (domain === 'light' || domain === 'switch' || domain === 'input_boolean') {
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

    const categories = this.config.categories || [];
    const currentCategory = categories[this._activeCategoryIndex] || null;
    const submenus = currentCategory ? (currentCategory.submenus || []) : [];
    const currentSubmenu = submenus[this._activeSubmenuIndex] || null;

    // Détermination automatique des filtres (subcat uniques)
    let availableFilters = ['all'];
    if (currentSubmenu && currentSubmenu.sensors) {
      currentSubmenu.sensors.forEach(s => {
        if (s.subcat && !availableFilters.includes(s.subcat)) {
          availableFilters.push(s.subcat);
        }
      });
    }

    return html`
      <ha-card>
        <div class="crt-overlay"></div>
        
        <div class="re-header">
          <div class="re-title">${(this.config.title || 'UMBRELLA SYSTEM').toUpperCase()}</div>
          <div class="ecg-container">
            <span class="status-text">SYSTEM ONLINE</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,12 L48,18 L52,15 L100,15" />
            </svg>
          </div>
        </div>

        <div class="re-main-menu">
          ${categories.map((cat, idx) => html`
            <div class="main-nav-item ${this._activeCategoryIndex === idx ? 'active' : ''}"
                 @click="${() => { this._activeCategoryIndex = idx; this._activeSubmenuIndex = 0; this._activeFilter = 'all'; }}">
              ${(cat.name || `SECTEUR ${idx}`).toUpperCase()}
            </div>
          `)}
        </div>

        <div class="re-body">
          
          ${submenus.length > 0 ? html`
            <div class="re-sidebar">
              ${submenus.map((sub, idx) => html`
                <button class="submenu-btn ${this._activeSubmenuIndex === idx ? 'active' : ''}"
                        @click="${() => { this._activeSubmenuIndex = idx; this._activeFilter = 'all'; }}">
                  <ha-icon icon="${sub.icon || 'mdi:shield-alert'}"></ha-icon>
                  <span>${(sub.name || 'SOUS-MODULE').toUpperCase()}</span>
                </button>
              `)}
            </div>
          ` : html``}

          <div class="re-content-container">
            
            ${availableFilters.length > 1 ? html`
              <div class="re-filter-bar">
                ${availableFilters.map(filter => html`
                  <button class="filter-item ${this._activeFilter === filter ? 'active' : ''}"
                          @click="${() => this._activeFilter = filter}">
                    ${filter.toUpperCase()}
                  </button>
                `)}
              </div>
            ` : html``}

            <div class="re-content-scroll">
              <img src="/local/Umbrella.png" class="umbrella-bg-watermark" />

              ${(() => {
                if (!currentSubmenu) {
                  return html`<div class="empty-tab">SÉLECTIONNEZ UN SOU-MODULE DANS LA SIDEBAR</div>`;
                }

                // FORCE LE RENDU IFRAME EN PRIORITÉ SI URL PRÉSENTE OU MODE IFRAME ACTIVÉ
                if (currentSubmenu.mode === 'iframe' || currentSubmenu.iframe_url) {
                  return html`
                    <div class="re-iframe-wrapper">
                      <iframe class="re-iframe" src="${currentSubmenu.iframe_url}"></iframe>
                    </div>
                  `;
                }

                // RENDU DU MODE DESIGN PERSONNALISÉ (WIDGETS COMPOSITES)
                if (currentSubmenu.mode === 'design') {
                  return html`
                    <div class="design-grid">
                      ${currentSubmenu.widgets ? currentSubmenu.widgets.map(w => html`
                        <div style="border: 1px dashed var(--re-border-color); padding: 12px; margin-bottom: 5px; background: #080808; width: 100%; box-sizing: border-box;">
                          <span style="color: var(--re-green); font-size: 11px;">[MODULE CONFIGURÉ: ${String(w.type).toUpperCase()}]</span>
                          <div style="color: #fff; font-size: 12px; margin-top:4px;">Entité cible détectée : ${w.entity || 'Aucune'}</div>
                        </div>
                      `) : html`<div style="color:var(--re-text-gray); font-size:11px;">Aucun widget configuré dans ce design.</div>`}
                    </div>
                  `;
                }

                // PAR DÉFAUT : RENDU EN MODE GRILLE DE CAPTEURS CLASSIQUE (GRID)
                let sensorsToRender = currentSubmenu.sensors || [];
                if (this._activeFilter !== 'all') {
                  sensorsToRender = sensorsToRender.filter(s => s.subcat === this._activeFilter);
                }
                
                if (sensorsToRender.length === 0) {
                  return html`<div class="empty-tab">AUCUNE DONNÉE ACCESSIBLE DANS CE SECTEUR</div>`;
                }

                return html`
                  <div class="sensors-grid">
                    ${sensorsToRender.map(s => {
                      const stateObj = this.hass.states[s.entity];
                      if (!stateObj) {
                        return html`
                          <div class="sensor-card error">
                            <div class="sensor-card-header">
                              <div class="sensor-name">${s.name || s.entity}</div>
                            </div>
                            <div class="sensor-value" style="font-size:11px; color:#ff3333; margin-top:8px;">OFFLINE</div>
                          </div>
                        `;
                      }

                      // Classe dynamique selon le domaine pour appliquer les effets CSS retro
                      const domain = s.entity.split('.')[0];
                      let effectClass = 'type-generic';
                      if (domain === 'light') effectClass = 'effect-light';
                      if (domain === 'switch') effectClass = 'effect-switch';
                      if (domain === 'binary_sensor') effectClass = 'effect-binary';
                      
                      const isActive = stateObj.state === 'on' || stateObj.state === 'home' || stateObj.state === 'open';

                      return html`
                        <div class="sensor-card ${effectClass} ${isActive ? 'state-active' : ''}" @click="${() => this._handleAction(s.entity, false)}">
                          <div class="sensor-card-header">
                            <div class="sensor-name">${(s.name || stateObj.attributes.friendly_name || s.entity).toUpperCase()}</div>
                            <ha-icon icon="${s.icon || 'mdi:eye'}" class="sensor-icon"></ha-icon>
                          </div>
                          <div class="sensor-value">
                            ${stateObj.state} <span class="unit">${stateObj.attributes.unit_of_measurement || ''}</span>
                          </div>
                        </div>
                      `;
                    })}
                  </div>
                `;
              })()}
            </div>

          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('resident-evil-card', ResidentEvilCard);
