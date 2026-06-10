import { LitElement, html, css } from 'https://unpkg.com/lit@3/index.js?module';

// ==========================================
// 1. STYLE GLOBAL UNIFIÉ (CHARTE UMBRELLA)
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

  /* COMPOSANTS GRILLE STANDARD */
  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; width: 100%; z-index: 2; }
  .sensor-card { background: #0d0d0d; border: 1px solid #222; padding: 12px; cursor: pointer; position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; border-radius: 0px; }
  .sensor-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #333; }
  .sensor-card:hover { border-color: var(--re-green); background: #111; }
  .sensor-card:hover::before { background: var(--re-green); }
  .sensor-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%; }
  .sensor-name { font-size: 10px; color: var(--re-text-gray); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .sensor-icon { --mdc-icon-size: 20px; color: var(--re-text-gray); }
  .sensor-value { font-size: 18px; color: #aaaaaa; font-weight: bold; margin-top: 8px; }
  .sensor-value .unit { font-size: 11px; color: #666; }

  /* MODULE BIOMÉTRIQUE / HEALTH */
  .health-wrapper { background: #0d0d0d; border: 1px solid #222; padding: 15px; margin-bottom: 20px; width: 100%; box-sizing: border-box; z-index: 2; }
  .health-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--re-red); padding-bottom: 8px; margin-bottom: 12px; }
  .health-title { font-size: 12px; font-weight: bold; color: #ffffff; letter-spacing: 1px; }
  .health-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
  .health-metric-box { background: #050505; border: 1px solid #222; padding: 10px; position: relative; }
  .health-metric-box .label { font-size: 9px; color: var(--re-text-gray); text-transform: uppercase; }
  .health-metric-box .value { font-size: 16px; color: var(--re-green); font-weight: bold; margin-top: 4px; }

  /* PLANTES / PHYTOLOGIE */
  .plants-section-title { font-size: 12px; font-weight: bold; color: #ff9900; margin: 15px 0 10px 0; border-bottom: 1px dashed #333; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; z-index: 2; }
  .plants-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; width: 100%; z-index: 2; }
  .plant-custom-card { background: #0d0d0d; border: 1px solid #222; padding: 12px; display: flex; gap: 12px; border-radius: 0px; position: relative; }
  .plant-img-container { width: 70px; height: 90px; border: 1px solid #222; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .plant-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
  .plant-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .plant-name-main { font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; }
  .plant-name-latin { font-size: 9px; color: #555; font-style: italic; margin-bottom: 4px; }
  .plant-attr-row { display: flex; justify-content: space-between; font-size: 10px; background: #050505; padding: 3px 6px; border: 1px solid #151515; }
  .plant-attr-label { color: var(--re-text-gray); }
  .plant-attr-value { font-weight: bold; }

  /* ==========================================
     NOUVEAU DESIGN COMPOSITE : JARDIN / IBC (Capture d'écran 2026-06-10 143202.jpg)
     ========================================== */
  .ibc-layout { display: flex; gap: 20px; width: 100%; z-index: 2; box-sizing: border-box; }
  .ibc-left-panel { width: 220px; display: flex; flex-direction: column; align-items: center; background: #080808; border: 1px solid #222; padding: 15px; position: relative; }
  .ibc-right-panel { flex: 1; display: flex; flex-direction: column; gap: 15px; }
  
  /* Jauge Cuve Linéaire/Militaire */
  .tank-container { width: 110px; height: 260px; border: 2px solid #333; position: relative; background: #020202; margin: 10px 0; display: flex; align-items: flex-end; }
  .tank-fill { width: 100%; background: linear-gradient(to top, rgba(0, 255, 0, 0.4), rgba(0, 255, 0, 0.1)); border-top: 2px solid var(--re-green); transition: height 0.5s ease; position: relative; }
  .tank-fill.alert { background: linear-gradient(to top, rgba(139, 0, 0, 0.5), rgba(255, 0, 0, 0.2)); border-top: 2px solid var(--re-red-bright); }
  .tank-text-overlay { position: absolute; width: 100%; top: 40%; left: 0; text-align: center; z-index: 3; pointer-events: none; }
  .tank-percentage { font-size: 24px; font-weight: bold; color: #fff; text-shadow: 0 0 6px #000; }
  .tank-liters { font-size: 11px; color: var(--re-text-gray); margin-top: 4px; }
  .tank-scale { position: absolute; left: -25px; top: 0; height: 100%; display: flex; flex-direction: column; justify-content: space-between; font-size: 9px; color: #444; text-align: right; width: 20px; }
  
  /* Grille des indicateurs météo hauts */
  .ibc-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .ibc-stat-box { background: #0d0d0d; border: 1px solid #1c1c1c; padding: 12px; display: flex; align-items: center; gap: 12px; }
  .ibc-stat-box ha-icon { color: var(--re-text-gray); --mdc-icon-size: 24px; }
  .ibc-stat-data { display: flex; flex-direction: column; }
  .ibc-stat-label { font-size: 9px; color: #555; text-transform: uppercase; }
  .ibc-stat-val { font-size: 15px; font-weight: bold; color: #ccc; margin-top: 2px; }

  /* Blocs horizontaux de sous-titre / Suivi températures */
  .ibc-section-sub { font-size: 10px; font-weight: bold; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: -5px; }
  .ibc-row-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ibc-mini-card { background: #0a0a0a; border: 1px solid #222; padding: 8px; text-align: center; }
  .ibc-mini-label { font-size: 8px; color: var(--re-text-gray); text-transform: uppercase; margin-bottom: 2px; }
  .ibc-mini-val { font-size: 12px; font-weight: bold; color: #ff9900; }

  /* Commandes & Équipements */
  .ibc-action-row { display: flex; align-items: center; justify-content: space-between; background: #0d0d0d; border: 1px solid #1c1c1c; padding: 8px 12px; }
  .ibc-action-left { display: flex; align-items: center; gap: 8px; font-size: 11px; }
  .ibc-btn-terminal { background: #1a1a1a; border: 1px solid #333; color: var(--re-green); font-family: inherit; font-size: 10px; padding: 4px 10px; cursor: pointer; }
  .ibc-btn-terminal:hover { background: var(--re-green); color: #000; }

  /* CAMÉRAS LIVE & IFRAME */
  .camera-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; width: 100%; z-index: 2; }
  .camera-card { border: 1px solid var(--re-border-color); background: #000; overflow: hidden; position: relative; cursor: pointer; }
  .camera-title { background: rgba(0,0,0,0.8); color: var(--re-green); padding: 6px; font-size: 10px; position: absolute; top: 0; left: 0; width: 100%; z-index: 3; border-bottom: 1px solid #111; font-weight: bold; }
  .camera-view { width: 100%; height: auto; display: block; }
  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; display: flex; overflow: hidden; }
  .re-iframe { width: 100%; height: 100%; border: none; background: transparent; }

  .umbrella-bg-watermark { position: absolute; bottom: 15px; right: 15px; width: 140px; height: 140px; object-fit: contain; opacity: 0.04; pointer-events: none; z-index: 1; }
  .empty-tab { text-align: center; color: #555; padding-top: 40px; font-size: 12px; }
`;

// ==========================================
// 2. COMPOSANT DE RENDU HUD CENTRALISÉ
// ==========================================
class ResidentEvilCard extends LitElement {
  static styles = cardStyles;

  static getConfigElement() { return document.createElement("resident-evil-card-editor"); }

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
      throw new Error("Configuration de catégories invalide.");
    }
    this.config = config;
  }

  _handleAction(entityId) {
    if (!entityId) return;
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _toggleEntity(entityId) {
    if (!entityId) return;
    this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const categories = this.config.categories || [];
    const currentCategory = categories[this._activeCategoryIndex] || null;
    const submenus = currentCategory ? (currentCategory.submenus || []) : [];
    const currentSubmenu = submenus[this._activeSubmenuIndex] || null;

    let availableFilters = ['all'];
    if (currentSubmenu && currentSubmenu.sensors) {
      currentSubmenu.sensors.forEach(s => {
        if (s.subcat && s.subcat.trim() !== '') {
          const f = s.subcat.trim();
          if (!availableFilters.includes(f)) availableFilters.push(f);
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
                  return html`<div class="empty-tab">SÉLECTIONNEZ UN SOUS-MODULE</div>`;
                }

                // ==========================================
                // REPRODUCTION DESIGN CUSTOM : GESTION CUVES & JARDIN 
                // ==========================================
                if (currentSubmenu.name === 'EXTÉRIEUR & JARDIN' || currentSubmenu.mode === 'jardin_custom') {
                  // Extraction des entités pour le rendu dynamique
                  const volumeIbc = parseInt(this.hass.states['sensor.volume_mesure']?.state || '128');
                  const niveauIbc = parseInt(this.hass.states['sensor.niveau_cuve']?.state || '6');
                  const profCuve = this.hass.states['sensor.profondeur_cuve']?.state || '6 cm';
                  const precip = this.hass.states['sensor.precipitations']?.state || '6.4';
                  const pluieDirecte = this.hass.states['sensor.pluie_directe']?.state || '0';
                  const tempExt = this.hass.states['sensor.temp_exterieure']?.state || '14.9';
                  
                  const tempCabane = this.hass.states['sensor.temperature_cabane']?.state || '17.8°C';
                  const tempMinAnnuel = this.hass.states['sensor.temp_min_annuel']?.state || '13.2°C';
                  const tempMaxAnnuel = this.hass.states['sensor.temp_max_annuel']?.state || '33.3°C';
                  
                  const statusBeem = this.hass.states['switch.beem_maison']?.state || 'off';
                  const statusStore = this.hass.states['cover.store_terrasse']?.attributes?.current_position || '0';

                  return html`
                    <div class="ibc-layout">
                      <!-- PANNEAU JAUGE GAUCHE -->
                      <div class="ibc-left-panel">
                        <div style="font-size: 10px; font-weight: bold; color: #fff; margin-bottom: 5px;">HYDRO-RESERVOIR</div>
                        
                        <div class="tank-container">
                          <div class="tank-scale">
                            <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                          </div>
                          <div class="tank-fill ${niveauIbc <= 10 ? 'alert' : ''}" style="height: ${niveauIbc}%;"></div>
                          <div class="tank-text-overlay">
                            <div class="tank-percentage">${niveauIbc}%</div>
                            <div class="tank-liters">${volumeIbc} L</div>
                          </div>
                        </div>

                        <div style="font-size: 9px; color: ${niveauIbc <= 10 ? 'var(--re-red-bright)' : 'var(--re-green)'}; font-weight: bold; margin-top: 5px;">
                          ${niveauIbc <= 10 ? '⚠️ ALERTE CUVE SEUIL' : 'RÉSERVOIR OPTIMAL'}
                        </div>
                        <div style="font-size: 8px; color: #555; margin-top: 4px;">Capacité: 2000L | Prof: ${profCuve}</div>
                      </div>

                      <!-- CONTENU ET INDICATEURS DROITE -->
                      <div class="ibc-right-panel">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--re-red); padding-bottom:5px;">
                          <div style="font-size:12px; font-weight:bold; color:#fff;">💧 STATION HYDROLOGIQUE : CUVES IBC</div>
                          <span style="font-size:9px; color:#555;">SAINTE-CROIX-EN-PLAINE</span>
                        </div>

                        <!-- 4 METRICS DU HAUT -->
                        <div class="ibc-stats-grid">
                          <div class="ibc-stat-box" @click="${() => this._handleAction('sensor.volume_mesure')}">
                            <ha-icon icon="mdi:water-gauge"></ha-icon>
                            <div class="ibc-stat-data">
                              <span class="ibc-stat-label">Volume mesuré</span>
                              <span class="ibc-stat-val">${volumeIbc} L <span style="font-size:10px;color:#555;">(Niv: ${niveauIbc}%)</span></span>
                            </div>
                          </div>
                          <div class="ibc-stat-box" @click="${() => this._handleAction('sensor.pluie_directe')}">
                            <ha-icon icon="mdi:water-plus"></ha-icon>
                            <div class="ibc-stat-data">
                              <span class="ibc-stat-label">Pluie Directe</span>
                              <span class="ibc-stat-val">${pluieDirecte} L</span>
                            </div>
                          </div>
                          <div class="ibc-stat-box" @click="${() => this._handleAction('sensor.precipitations')}">
                            <ha-icon icon="mdi:weather-rainy"></ha-icon>
                            <div class="ibc-stat-data">
                              <span class="ibc-stat-label">Précipitations</span>
                              <span class="ibc-stat-val">${precip} mm</span>
                            </div>
                          </div>
                          <div class="ibc-stat-box" @click="${() => this._handleAction('sensor.temp_exterieure')}">
                            <ha-icon icon="mdi:thermometer"></ha-icon>
                            <div class="ibc-stat-data">
                              <span class="ibc-stat-label">Temp. Extérieure</span>
                              <span class="ibc-stat-val" style="color:#ff9900;">${tempExt} °C</span>
                            </div>
                          </div>
                        </div>

                        <!-- SECTION TEMPERATURES -->
                        <div class="ibc-section-sub">// Suivi des températures thermiques</div>
                        <div class="ibc-row-grid">
                          <div class="ibc-mini-card" @click="${() => this._handleAction('sensor.temperature_cabane')}">
                            <div class="ibc-mini-label">Cabane</div>
                            <div class="ibc-mini-val">${tempCabane}</div>
                          </div>
                          <div class="ibc-mini-card" @click="${() => this._handleAction('sensor.temp_min_annuel')}">
                            <div class="ibc-mini-label">Min Annuel</div>
                            <div class="ibc-mini-val" style="color:#38bdf8;">${tempMinAnnuel}</div>
                          </div>
                          <div class="ibc-mini-card" @click="${() => this._handleAction('sensor.temp_max_annuel')}">
                            <div class="ibc-mini-label">Max Annuel</div>
                            <div class="ibc-mini-val" style="color:#ef4444;">${tempMaxAnnuel}</div>
                          </div>
                        </div>

                        <!-- SECTION COMMANDES -->
                        <div class="ibc-section-sub">// Commandes & Servomoteurs du complexe</div>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                          <div class="ibc-action-row">
                            <div class="ibc-action-left">
                              <ha-icon icon="mdi:solar-panel-large" style="color:var(--re-green);"></ha-icon>
                              <span>Beem Maison</span>
                            </div>
                            <button class="ibc-btn-terminal" @click="${() => this._toggleEntity('switch.beem_maison')}">
                              ${statusBeem.toUpperCase() === 'ON' ? 'ALLUMÉ / DISMISS' : 'ÉTEINT / REBOOT'}
                            </button>
                          </div>

                          <div class="ibc-action-row">
                            <div class="ibc-action-left">
                              <ha-icon icon="mdi:storefront-outline" style="color:#ff9900;"></ha-icon>
                              <span>Store Terrasse [Ouv: ${statusStore}%]</span>
                            </div>
                            <div style="display:flex; gap:4px;">
                              <button class="ibc-btn-terminal" @click="${() => this.hass.callService('cover', 'open_cover', {entity_id: 'cover.store_terrasse'})}">▲</button>
                              <button class="ibc-btn-terminal" @click="${() => this.hass.callService('cover', 'stop_cover', {entity_id: 'cover.store_terrasse'})}">■</button>
                              <button class="ibc-btn-terminal" @click="${() => this.hass.callService('cover', 'close_cover', {entity_id: 'cover.store_terrasse'})}">▼</button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  `;
                }

                // RENDU DES AUTRES MODES DU SCRIPT PRECEDENT
                if (currentSubmenu.name === 'SANTÉ DU PERSONNEL' || currentSubmenu.mode === 'health_custom') {
                  return html`
                    <div class="health-wrapper">
                      <div class="health-header">
                        <div class="health-title">☣️ PARAMÈTRES BIOMÉTRIQUES : PERSONNEL_01 (PATRICK)</div>
                        <ha-icon icon="mdi:heart-pulse" style="color:var(--re-red-bright);"></ha-icon>
                      </div>
                      <div class="health-metrics-grid">
                        <div class="health-metric-box" @click="${() => this._handleAction('sensor.withings_poids_patrick')}">
                          <div class="label">Masse Corporelle</div>
                          <div class="value">${this.hass.states['sensor.withings_poids_patrick']?.state || '--'} kg</div>
                        </div>
                        <div class="health-metric-box" @click="${() => this._handleAction('sensor.withings_steps_today')}">
                          <div class="label">Analyse Pas Daily</div>
                          <div class="value">${this.hass.states['sensor.withings_steps_today']?.state || '--'} pas</div>
                        </div>
                        <div class="health-metric-box" @click="${() => this._handleAction('sensor.withings_distance_travelled_today')}">
                          <div class="label">Distance Couverte</div>
                          <div class="value">${this.hass.states['sensor.withings_distance_travelled_today']?.state || '--'} km</div>
                        </div>
                        <div class="health-metric-box" @click="${() => this._handleAction('sensor.withings_total_calories_burnt_today')}">
                          <div class="label">Énergie Dépensée</div>
                          <div class="value">${this.hass.states['sensor.withings_total_calories_burnt_today']?.state || '--'} kcal</div>
                        </div>
                      </div>
                    </div>
                    <div class="plants-section-title">🔬 ANALYSE PHYTOLOGIQUE — SERRE ET VÉGÉTATION</div>
                    <div class="plants-grid">
                      <div class="plant-custom-card">
                        <div class="plant-img-container"><img src="/local/fleurdelune.png" class="plant-img"/></div>
                        <div class="plant-info">
                          <div class="plant-name-main">Fleurs de lune</div>
                          <div class="plant-name-latin">Spathiphyllum Wallisii</div>
                          <div class="plant-attr-row"><span class="plant-attr-label">Humidité</span><span class="plant-attr-value" style="color:#38bdf8;">${this.hass.states['sensor.plant_sensor_5f6d_humidite']?.state || '--'}%</span></div>
                          <div class="plant-attr-row"><span class="plant-attr-label">Lumière</span><span class="plant-attr-value" style="color:#fbbf24;">${this.hass.states['sensor.plant_sensor_5f6d_eclairement']?.state || '--'} lx</span></div>
                          <div class="plant-attr-row"><span class="plant-attr-label">Temp.</span><span class="plant-attr-value" style="color:#f97316;">${this.hass.states['sensor.plant_sensor_5f6d_temperature']?.state || '--'}°C</span></div>
                        </div>
                      </div>
                    </div>
                  `;
                }

                if (currentSubmenu.mode === 'iframe' || currentSubmenu.iframe_url) {
                  return html`<div class="re-iframe-wrapper"><iframe class="re-iframe" src="${currentSubmenu.iframe_url}"></iframe></div>`;
                }

                if (currentSubmenu.mode === 'design' || currentSubmenu.cameras) {
                  const cams = currentSubmenu.cameras || [];
                  if (cams.length === 0) return html`<div class="empty-tab">AUCUN FLUX ENREGISTRÉ</div>`;
                  return html`
                    <div class="camera-container">
                      ${cams.map(c => {
                        const entity = c.entity || c.camera_entity;
                        if (!entity) return html``;
                        return html`
                          <div class="camera-card" @click="${() => this._handleAction(entity)}">
                            <div class="camera-title">[CAM.LIVE] ${(c.name || entity).toUpperCase()}</div>
                            <hui-image class="camera-view" .hass="${this.hass}" .cameraImage="${entity}" .cameraView="live"></hui-image>
                          </div>
                        `;
                      })}
                    </div>
                  `;
                }

                let sensorsToRender = currentSubmenu.sensors || [];
                if (this._activeFilter !== 'all') {
                  sensorsToRender = sensorsToRender.filter(s => s.subcat === this._activeFilter);
                }
                if (sensorsToRender.length === 0) return html`<div class="empty-tab">AUCUN COMPOSANT APPARTENANT À CE FILTRE</div>`;

                return html`
                  <div class="sensors-grid">
                    ${sensorsToRender.map(s => {
                      const stateObj = this.hass.states[s.entity];
                      if (!stateObj) {
                        return html`
                          <div class="sensor-card" style="border-color: var(--re-red);">
                            <div class="sensor-card-header"><div class="sensor-name" style="color:var(--re-red);">${s.name || s.entity}</div></div>
                            <div class="sensor-value" style="font-size:11px; color:#ff3333;">OFFLINE</div>
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
// 3. ÉDITEUR VISUEL SÉCURISÉ
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
  constructor() { super(); this._selectedCategoryIdx = 0; this._selectedSubmenuIdx = 0; }
  setConfig(config) { this._config = config; }
  _updateConfig(newConfig) {
    this._config = newConfig;
    const event = new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true });
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
    const currentMode = currentSub ? (currentSub.mode || 'grid') : 'grid';

    return html`
      <div style="font-family: monospace; background: #0c0c0c; color: #fff; padding: 14px; border: 1px solid #333;">
        <h3 style="color: #ff3333; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 6px;">☣️ DESIGNER DES SECTEURS</h3>
        <div style="margin-bottom: 14px;">
          <label style="color: #8a8a8a; font-size: 11px; display: block; margin-bottom: 4px;">1. MENU PRINCIPAL</label>
          <select style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #444; padding:6px;"
                  @change="${e => { this._selectedCategoryIdx = parseInt(e.target.value); this._selectedSubmenuIdx = 0; }}">
            ${categories.map((c, i) => html`<option value="${i}" ?selected="${this._selectedCategoryIdx === i}">${(c.name || `Secteur ${i}`).toUpperCase()}</option>`)}
          </select>
        </div>
        ${currentCat ? html`
          <div style="margin-bottom: 14px; border-top: 1px dashed #222; padding-top: 10px;">
            <label style="color: #8a8a8a; font-size: 11px; display: block; margin-bottom: 4px;">2. SOUS-MENU</label>
            <select style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #444; padding:6px;"
                    @change="${e => this._selectedSubmenuIdx = parseInt(e.target.value)}">
              ${submenus.map((s, i) => html`<option value="${i}" ?selected="${this._selectedSubmenuIdx === i}">${(s.name || `Zone ${i}`).toUpperCase()}</option>`)}
            </select>
            <div style="margin-top: 5px;">
              <select style="width:100%; background:#111; color:#fff; border:1px solid #333; padding:4px;"
                      @change="${e => this._editValue(`categories.${this._selectedCategoryIdx}.submenus.${this._selectedSubmenuIdx}.mode`, e.target.value)}">
                <option value="grid" ?selected="${currentMode === 'grid'}">Grille Standard</option>
                <option value="jardin_custom" ?selected="${currentMode === 'jardin_custom'}">Hydro-Cuves & Jardin Custom</option>
                <option value="health_custom" ?selected="${currentMode === 'health_custom'}">Biométrie & Phytologie</option>
                <option value="iframe" ?selected="${currentMode === 'iframe'}">iFrame Web</option>
                <option value="design" ?selected="${currentMode === 'design'}">Caméras</option>
              </select>
            </div>
          </div>
        ` : html``}
      </div>
    `;
  }
}
customElements.define('resident-evil-card-editor', ResidentEvilCardEditor);
