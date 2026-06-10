import { LitElement, html, css } from 'https://unpkg.com/lit@3/index.js?module';

// ==========================================
// 1. STYLE UNIQUE RETRO-TERMINAL (HUD)
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

  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; width: 100%; z-index: 2; }
  
  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; display: flex; margin: 0; padding: 0; overflow: hidden; min-height: 0; z-index: 2; }
  .re-iframe { width: 100%; height: 100%; border: none; background: transparent; display: block; min-height: 0; }

  .sensor-card { 
    background: #0d0d0d; 
    border: 1px solid #222; 
    padding: 12px; 
    cursor: pointer; 
    position: relative; 
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 80px;
  }
  .sensor-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #333; }
  .sensor-card:hover { border-color: var(--re-green); background: #111; }
  .sensor-card:hover::before { background: var(--re-green); }
  
  .sensor-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%; }
  .sensor-name { font-size: 10px; color: var(--re-text-gray); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .sensor-icon { --mdc-icon-size: 20px; color: var(--re-text-gray); }
  .sensor-value { font-size: 18px; color: #aaaaaa; font-weight: bold; margin-top: 8px; }
  .sensor-value .unit { font-size: 11px; color: #666; }

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
  .empty-tab { text-align: center; color: #555; padding-top: 40px; font-size: 12px; }
`;

// ==========================================
// 2. COMPOSANT VISUEL PRINCIPAL
// ==========================================
class ResidentEvilCard extends LitElement {
  static styles = cardStyles;

  static getConfigElement() {
    return document.createElement("resident-evil-card-editor");
  }

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

  _handleAction(entityId) {
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

    // Détermination automatique des sous-sous-menus (subcat uniques des capteurs)
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
          <div class="re-title">${(this.config.title || 'UMBRELLA SYSTEM CONTROL').toUpperCase()}</div>
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
                  <ha-icon icon="${sub.icon || 'mdi:shield-darkness'}"></ha-icon>
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
                    // ${filter.toUpperCase()}
                  </button>
                `)}
              </div>
            ` : html``}

            <div class="re-content-scroll">
              <img src="/local/Umbrella.png" class="umbrella-bg-watermark" />

              ${(() => {
                if (!currentSubmenu) {
                  return html`<div class="empty-tab">SÉLECTIONNEZ UN SOUS-MODULE DANS LA SIDEBAR</div>`;
                }

                // RENDU PRIORITAIRE SI LE MODE EST IFRAME OU LIEN EXISTANT (Météo...)
                if (currentSubmenu.mode === 'iframe' || currentSubmenu.iframe_url) {
                  return html`
                    <div class="re-iframe-wrapper">
                      <iframe class="re-iframe" src="${currentSubmenu.iframe_url}"></iframe>
                    </div>
                  `;
                }

                // RENDU SI LE MODE EST DESIGN (Composants personnalisés)
                if (currentSubmenu.mode === 'design') {
                  return html`
                    <div class="design-grid">
                      ${currentSubmenu.widgets ? currentSubmenu.widgets.map(w => html`
                        <div style="border: 1px dashed var(--re-border-color); padding: 12px; margin-bottom: 6px; background: #080808; box-sizing: border-box;">
                          <span style="color: var(--re-green); font-size: 11px;">[WIDGET INTERNE: ${String(w.type).toUpperCase()}]</span>
                          <div style="color: #fff; font-size: 12px; margin-top:4px;">Entité cible : ${w.entity || 'Aucune'}</div>
                        </div>
                      `) : html`<div style="color:var(--re-text-gray); font-size:11px;">Aucun widget configuré dans ce module.</div>`}
                    </div>
                  `;
                }

                // RENDU PAR DÉFAUT : GRILLE DE CAPTEURS CLASSIQUE (GRID)
                let sensorsToRender = currentSubmenu.sensors || [];
                if (this._activeFilter !== 'all') {
                  sensorsToRender = sensorsToRender.filter(s => s.subcat === this._activeFilter);
                }
                
                if (sensorsToRender.length === 0) {
                  return html`<div class="empty-tab">AUCUNE ENTITÉ DISPONIBLE SUR CE FILTRE</div>`;
                }

                return html`
                  <div class="sensors-grid">
                    ${sensorsToRender.map(s => {
                      const stateObj = this.hass.states[s.entity];
                      if (!stateObj) {
                        return html`
                          <div class="sensor-card" style="border-color: var(--re-red);">
                            <div class="sensor-card-header">
                              <div class="sensor-name" style="color: var(--re-red);">${s.name || s.entity}</div>
                            </div>
                            <div class="sensor-value" style="font-size:11px; color:#ff3333;">ABSENT / OFFLINE</div>
                          </div>
                        `;
                      }

                      return html`
                        <div class="sensor-card" @click="${() => this._handleAction(s.entity)}">
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


// ==========================================
// 3. ÉDITEUR VISUEL DE STRUCTURE DYNAMIQUE
// ==========================================
class ResidentEvilCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
      _selectedCategoryIdx: { type: Number },
      _selectedSubmenuIdx: { type: Number }
    };
  }

  constructor() {
    super();
    this._selectedCategoryIdx = 0;
    this._selectedSubmenuIdx = 0;
  }

  setConfig(config) {
    this._config = config;
  }

  _updateConfig(newConfig) {
    this._config = newConfig;
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
    this.requestUpdate();
  }

  _editValue(path, value) {
    const newConfig = JSON.parse(JSON.stringify(this._config));
    const parts = path.split('.');
    let current = newConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    this._updateConfig(newConfig);
  }

  render() {
    if (!this.hass || !this._config) return html``;

    const categories = this._config.categories || [];
    const currentCat = categories[this._selectedCategoryIdx] || null;
    const submenus = currentCat ? (currentCat.submenus || []) : [];
    const currentSub = submenus[this._selectedSubmenuIdx] || null;
    const sensors = currentSub ? (currentSub.sensors || []) : [];

    return html`
      <div style="font-family: monospace; background: #0c0c0c; color: #fff; padding: 14px; border: 1px solid #333;">
        <h3 style="color: #ff3333; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 6px; letter-spacing: 1px;">☣️ CONSOLE CONFIGURATEUR UMBRELLA</h3>
        
        <div style="margin-bottom: 14px;">
          <label style="color: #8a8a8a; font-size: 11px; display: block; margin-bottom: 4px;">1. SÉLECTIONNER UN MENU (CATÉGORIE)</label>
          <select style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #444; padding:6px;"
                  @change="${e => { this._selectedCategoryIdx = parseInt(e.target.value); this._selectedSubmenuIdx = 0; }}">
            ${categories.map((c, i) => html`<option value="${i}" ?selected="${this._selectedCategoryIdx === i}">${(c.name || `Cat ${i}`).toUpperCase()}</option>`)}
          </select>
          <input type="text" style="width:100%; margin-top:5px; background:#111; color:#00ff00; border:1px solid #333; padding:5px; font-size:11px;"
                 .value="${currentCat ? currentCat.name : ''}" placeholder="Modifier le nom du menu"
                 @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.name`, e.target.value)}" />
        </div>

        ${currentCat ? html`
          <div style="margin-bottom: 14px; border-top: 1px dashed #222; padding-top: 10px;">
            <label style="color: #8a8a8a; font-size: 11px; display: block; margin-bottom: 4px;">2. SÉLECTIONNER UN SOUS-MENU (SIDEBAR)</label>
            ${submenus.length > 0 ? html`
              <select style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #444; padding:6px;"
                      @change="${e => this._selectedSubmenuIdx = parseInt(e.target.value)}">
                ${submenus.map((s, i) => html`<option value="${i}" ?selected="${this._selectedSubmenuIdx === i}">${(s.name || `Sub ${i}`).toUpperCase()}</option>`)}
              </select>
              <div style="display: flex; gap: 4px; margin-top: 5px;">
                <input type="text" style="flex:1; background:#111; color:#fff; border:1px solid #333; padding:5px; font-size:11px;"
                       .value="${currentSub ? currentSub.name : ''}" placeholder="Nom du sous-menu"
                       @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.name`, e.target.value)}" />
                <input type="text" style="width:100px; background:#111; color:#fff; border:1px solid #333; padding:5px; font-size:11px;"
                       .value="${currentSub ? currentSub.icon : ''}" placeholder="icon (mdi:...)"
                       @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.icon`, e.target.value)}" />
              </div>
              <div style="margin-top:5px;">
                <label style="font-size:10px; color:#8a8a8a;">Lien URL iFrame (Optionnel pour Météo / Liens extérieurs) :</label>
                <input type="text" style="width:100%; background:#111; color:#ff9900; border:1px solid #333; padding:5px; font-size:11px;"
                       .value="${currentSub && currentSub.iframe_url ? currentSub.iframe_url : ''}" placeholder="https://..."
                       @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.iframe_url`, e.target.value)}" />
              </div>
            ` : html`<div style="font-size:11px; color:#c00;">Aucun sous-menu configuré pour cette catégorie.</div>`}
          </div>
        ` : html``}

        ${currentSub ? html`
          <div style="margin-bottom: 10px; border-top: 1px solid #333; padding-top: 10px;">
            <label style="color: #8a8a8a; font-size: 11px; display: block; margin-bottom: 6px;">3. LISTE DES SENSORS ET SOUS-SOUS-MENUS (FILTRES)</label>
            <div style="max-height: 180px; overflow-y: auto; background: #111; padding: 6px; border: 1px solid #222;">
              ${sensors.map((s, idx) => html`
                <div style="border-bottom: 1px solid #222; padding-bottom: 6px; margin-bottom: 6px; font-size:11px;">
                  <div style="color: #00ff00; font-weight: bold; margin-bottom: 2px;">Composant #${idx + 1}</div>
                  <input type="text" style="width:100%; background:#222; color:#fff; border:1px solid #444; padding:3px; margin-bottom:2px;"
                         .value="${s.entity || ''}" placeholder="entity_id (sensor.xxxx)"
                         @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.sensors.${idx}.entity`, e.target.value)}" />
                  <div style="display:flex; gap:2px;">
                    <input type="text" style="flex:1; background:#222; color:#aaa; border:1px solid #444; padding:3px;"
                           .value="${s.name || ''}" placeholder="Nom personnalisé"
                           @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.sensors.${idx}.name`, e.target.value)}" />
                    <input type="text" style="width:90px; background:#222; color:#ff9900; border:1px solid #444; padding:3px;"
                           .value="${s.subcat || ''}" placeholder="Sous-Sous-Menu (Filtre)"
                           @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.sensors.${idx}.subcat`, e.target.value)}" />
                  </div>
                </div>
              `)}
            </div>
            <button style="width:100%; margin-top:8px; background:#222; color:#fff; border:1px solid #444; padding:6px; cursor:pointer;"
                    @click="${() => {
                      const newSensors = [...sensors, { entity: '', name: '', subcat: 'Général', icon: 'mdi:eye' }];
                      this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.sensors`, newSensors);
                    }}">
              + Ajouter un capteur / Filtre horizontal
            </button>
          </div>
        ` : html``}
        
        <div style="font-size: 9px; color: #555; text-align: right; margin-top: 15px; border-top: 1px solid #222; padding-top: 4px;">
          CONSTRUCTEUR COMPOSANTS CORE v4.4 // STABLE
        </div>
      </div>
    `;
  }
}
customElements.define('resident-evil-card-editor', ResidentEvilCardEditor);
