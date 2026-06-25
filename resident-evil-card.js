/* ============================================================
   RESIDENT EVIL CARD v232 (version RICHE : widgets)
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
  .re-stale-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#f59e0b;
    margin-right:6px; vertical-align:middle; box-shadow:0 0 5px #f59e0b; animation: batt-flash 1.1s infinite alternate; }

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

  .sensor-card.type-climate, .sensor-card.type-temp-visual { grid-column: span 3; min-height: 150px; background: #09090b; border: 1px solid #1f1f23; }
  .sensor-name-block { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .sensor-room-name { font-size: 15px; font-weight: 800; color: #f1f5f9; text-transform: uppercase;
    letter-spacing: .5px; line-height: 1.15; white-space: normal; overflow-wrap: anywhere; }
  .sensor-sub-label { font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 1px; white-space: nowrap; }
  /* coin coupé plus marqué sur les tuiles temp/climate */
  .sensor-card.type-climate, .sensor-card.type-temp-visual {
    clip-path: polygon(18px 0, 100% 0, 100% 100%, 0 100%, 0 18px) !important; }
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
  .dw-badge-secondary { font-size: 12px; font-weight: 600; opacity: .85; color: #94a3b8; margin-top: 2px; }
  .dw-badge-tertiary { font-size: 11px; font-weight: 600; opacity: .65; color: #64748b; margin-top: 1px; }
  .dw-card.hud-frame {
    clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    box-shadow: inset 0 0 14px rgba(34,211,238,.08);
  }
  .dw-card.hud-frame::before {
    content: ''; position: absolute; top: 0; right: 0; width: 16px; height: 16px;
    border-top: 2px solid var(--ec-hud, #22d3ee); border-right: 2px solid var(--ec-hud, #22d3ee);
    pointer-events: none; z-index: 5; filter: drop-shadow(0 0 4px var(--ec-hud, #22d3ee)); background: none;
  }
  .dw-card.hud-frame::after {
    content: ''; position: absolute; bottom: 0; left: 0; width: 16px; height: 16px;
    border-bottom: 2px solid var(--ec-hud, #22d3ee); border-left: 2px solid var(--ec-hud, #22d3ee);
    pointer-events: none; z-index: 5; filter: drop-shadow(0 0 4px var(--ec-hud, #22d3ee));
  }

  /* ═══ WIDGET MÉTÉO NATIF ═══ */
  .re-wx { font-family: monospace; }
  .re-wx-sky { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; display: block; }
  .re-wx-card { position: absolute; inset: 8px; z-index: 5; background: rgba(0,0,0,.38);
    border: 1.5px solid rgba(0,212,255,.5); border-radius: 15px; box-shadow: 0 0 25px rgba(0,212,255,.2);
    padding: 12px 15px; display: flex; flex-direction: column; gap: 6px; overflow: hidden; color: #fff; }
  .re-wx-hdr { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,.12); padding-bottom: 7px; flex-shrink: 0; gap: 8px; }
  .re-wx-hdr-txt { flex: 1; font-size: 12px; color: rgba(255,255,255,.9); }
  .re-wx-hdr-txt b { color: #7dd3fc; }
  .re-wx-meteo { display: grid; grid-template-columns: 1fr 1fr; font-size: 13px; line-height: 1.78; flex-shrink: 0; }
  .re-wx-meteo b { color: #fff; }
  .re-wx-mc2 { border-left: 1px solid rgba(255,255,255,.1); padding-left: 12px; }
  .re-wx-fc { display: flex; gap: 5px; flex-shrink: 0; overflow-x: auto; scrollbar-width: none; }
  .re-wx-fc::-webkit-scrollbar { display: none; }
  .re-wx-day { flex: 1; min-width: 90px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
    border-radius: 10px; padding: 9px 5px; text-align: center; }
  .re-wx-day.today { background: rgba(125,211,252,.12); border-color: rgba(125,211,252,.3); }
  .re-wx-dd { font-size: 15px; font-weight: 700; color: rgba(255,255,255,.88); margin-bottom: 3px; }
  .re-wx-di { font-size: 28px; display: block; margin: 4px 0; }
  .re-wx-dh { font-size: 16px; font-weight: 700; color: #fff; }
  .re-wx-dl { font-size: 14px; color: rgba(255,255,255,.5); }
  .re-wx-stl { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.55); margin-bottom: 6px; }
  .re-wx-pol { display: grid; grid-template-columns: repeat(6,1fr); gap: 6px; }
  .re-wx-pi { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 9px 6px; text-align: center; }
  .re-wx-pn { font-size: 17px; font-weight: 700; color: rgba(255,255,255,.92); margin-bottom: 5px; line-height: 1.3; }
  .re-wx-pb { font-size: 13px; font-weight: 700; border-radius: 6px; padding: 4px 10px; display: inline-block; }
  .re-wx-pbar { height: 3px; background: rgba(255,255,255,.1); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .re-wx-pbf { height: 100%; border-radius: 2px; transition: width 1.2s ease; }
  .re-wx-pc { font-size: 12px; color: rgba(255,255,255,.5); display: block; margin-top: 4px; }
  .re-wx-alt { display: flex; flex-direction: column; gap: 3px; }
  .re-wx-ai { border-radius: 7px; padding: 5px 9px; display: flex; align-items: center; gap: 6px; border: 1px solid; font-size: 12px; }
  .re-wx-ai.ag { background: rgba(34,197,94,.1); border-color: rgba(34,197,94,.25); }
  .re-wx-ai.ay { background: rgba(234,179,8,.1); border-color: rgba(234,179,8,.3); }
  .re-wx-ai.ao { background: rgba(249,115,22,.1); border-color: rgba(249,115,22,.3); }
  .re-wx-ai.ar { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.3); }
  .re-wx-adot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .re-wx-adot.dg { background: #4ade80; } .re-wx-adot.dy { background: #fbbf24; }
  .re-wx-adot.do { background: #fb923c; } .re-wx-adot.dr { background: #f87171; }
`;


// Contour réel de l'Alsace (fusion Bas-Rhin 67 + Haut-Rhin 68, IGN via france-geojson),
// normalisé en coordonnées 0..1 pour un usage en clipPath SVG (clipPathUnits="objectBoundingBox").
const ALSACE_CLIP_PATH = 'M 0.5445 0.5544 L 0.5232 0.6318 L 0.5596 0.667 L 0.5124 0.7229 L 0.5173 0.7397 L 0.4941 0.7793 L 0.5062 0.8079 L 0.4814 0.8301 L 0.4876 0.8546 L 0.538 0.8952 L 0.5326 0.9061 L 0.4759 0.9261 L 0.4897 0.9409 L 0.462 0.964 L 0.4243 0.9542 L 0.4158 0.9624 L 0.4356 0.9679 L 0.414 0.9859 L 0.2885 1.0 L 0.2788 0.9899 L 0.2341 0.9866 L 0.2455 0.9582 L 0.2049 0.9511 L 0.2089 0.9308 L 0.1875 0.9218 L 0.1731 0.8969 L 0.1293 0.8968 L 0.1145 0.8806 L 0.1443 0.8491 L 0.13 0.8312 L 0.1379 0.8187 L 0.0016 0.7702 L 0.0 0.7574 L 0.0533 0.7409 L 0.039 0.7161 L 0.0589 0.7058 L 0.0538 0.6848 L 0.0701 0.6515 L 0.1123 0.6367 L 0.1716 0.572 L 0.1528 0.5669 L 0.1725 0.5407 L 0.2353 0.4702 L 0.2539 0.4623 L 0.2442 0.4467 L 0.1978 0.4484 L 0.1676 0.4377 L 0.1888 0.422 L 0.1801 0.3917 L 0.1952 0.3567 L 0.1814 0.3551 L 0.1998 0.3393 L 0.1574 0.3334 L 0.1682 0.3255 L 0.232 0.3309 L 0.2684 0.3157 L 0.3304 0.2506 L 0.3017 0.2491 L 0.2856 0.2313 L 0.2986 0.2299 L 0.3319 0.1847 L 0.321 0.1696 L 0.2999 0.1673 L 0.2758 0.149 L 0.2528 0.1488 L 0.2522 0.1415 L 0.2187 0.1389 L 0.2167 0.1531 L 0.1745 0.1705 L 0.1681 0.1575 L 0.1502 0.1577 L 0.1479 0.1379 L 0.1734 0.1371 L 0.1695 0.1272 L 0.1472 0.13 L 0.0854 0.1027 L 0.0789 0.0919 L 0.0957 0.0852 L 0.1032 0.0691 L 0.1342 0.0715 L 0.1505 0.0264 L 0.1677 0.0144 L 0.16 0.0044 L 0.1858 0.0 L 0.205 0.0421 L 0.2366 0.041 L 0.2619 0.0569 L 0.2811 0.0523 L 0.3229 0.0621 L 0.3466 0.0792 L 0.4366 0.0643 L 0.4955 0.0851 L 0.528 0.0707 L 0.5691 0.0121 L 0.639 0.018 L 0.684 0.0051 L 0.7375 0.0242 L 0.7849 0.0099 L 0.8177 0.0291 L 0.8676 0.0363 L 0.898 0.0514 L 1.0 0.0649 L 0.9733 0.0714 L 0.9324 0.1097 L 0.9016 0.1597 L 0.8531 0.1741 L 0.8357 0.1909 L 0.8103 0.1929 L 0.8055 0.2136 L 0.7166 0.262 L 0.688 0.2999 L 0.6929 0.3348 L 0.6649 0.3538 L 0.6417 0.4056 L 0.6482 0.447 L 0.618 0.4633 L 0.5925 0.5147 L 0.5445 0.5544 Z';
const ALSACE_ASPECT = 0.559; // largeur/hauteur réelle (corrigée latitude) — Alsace est ~1.79x plus haute que large

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
    // Restaurer la dernière navigation depuis localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('re2_nav') || 'null');
      this._activeMainMenu = saved?.cat ?? 0;
      this._activeSubMenu  = saved?.sub ?? 0;
    } catch(e) {
      this._activeMainMenu = 0;
      this._activeSubMenu  = 0;
    }
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
    if (this._wxUnsub) { try { this._wxUnsub(); } catch(_e) {} this._wxUnsub = null; }
  }

  setConfig(config) { this.config = config; if (this.requestUpdate) this.requestUpdate(); }
  getCardSize() { return 10; }
  static getStubConfig() { return { title: "UMBRELLA CORP. TERMINAL", categories: [] }; }
  static getConfigElement() { return document.createElement("resident-evil-card-editor"); }

  _collectAlerts() {
    const out = [];
    const states = this.hass?.states || {};
    const cfg = this.config || {};
    const nameOf = (eid) => states[eid]?.attributes?.friendly_name || eid;

    // (A) Règles personnalisées : config.alerts = [{entity, op, value, message, level}]
    (cfg.alerts || []).forEach(r => {
      if (!r || !r.entity) return;
      const s = states[r.entity];
      const state = s ? String(s.state) : 'unavailable';
      const num = parseFloat(state);
      const v = r.value;
      const vn = parseFloat(v);
      let hit = false;
      switch ((r.op || 'off')) {
        case 'on':          hit = state === 'on'; break;
        case 'off':         hit = state === 'off'; break;
        case 'unavailable': hit = ['unavailable','unknown','none',''].includes(state); break;
        case '=':  case '==': hit = state === String(v); break;
        case '!=':          hit = state !== String(v); break;
        case '<':           hit = !isNaN(num) && !isNaN(vn) && num <  vn; break;
        case '<=':          hit = !isNaN(num) && !isNaN(vn) && num <= vn; break;
        case '>':           hit = !isNaN(num) && !isNaN(vn) && num >  vn; break;
        case '>=':          hit = !isNaN(num) && !isNaN(vn) && num >= vn; break;
        case 'contains':    hit = state.toLowerCase().includes(String(v).toLowerCase()); break;
        default:            hit = false;
      }
      if (hit) out.push({ msg: r.message || (nameOf(r.entity) + ' : ' + state), level: r.level || 'warn' });
    });

    // (B) Chimie du spa : on privilégie les seuils de la vue CHIMIE (view:'chem').
    //     S'il n'y en a pas, on retient la plage la plus large parmi les widgets définissant le seuil.
    const numFR = (x) => { if (x == null || x === '') return null; const n = parseFloat(String(x).replace(',', '.')); return isNaN(n) ? null : n; };
    const spaWidgets = [];
    (cfg.categories || []).forEach(cat => (cat.submenus || []).forEach(sub => (sub.widgets || []).forEach(w => {
      if (w && w.type === 'spa_temp') spaWidgets.push(w);
    })));
    const chemViews = spaWidgets.filter(w => w.view === 'chem');
    const sources = chemViews.length ? chemViews : spaWidgets;
    const params = [
      { eKey:'phEntity',   mnKey:'ph_min',   mxKey:'ph_max',   lbl:'pH',  unit:'',    low:true  },
      { eKey:'orpEntity',  mnKey:'orp_min',  mxKey:'orp_max',  lbl:'ORP', unit:'mV',  low:true  },
      { eKey:'tdsEntity',  mnKey:'tds_min',  mxKey:'tds_max',  lbl:'TDS', unit:'ppm', low:false },
      { eKey:'saltEntity', mnKey:'salt_min', mxKey:'salt_max', lbl:'Sel', unit:'ppm', low:true  },
    ];
    params.forEach(p => {
      let eid = null, lo = null, hi = null;
      sources.forEach(w => {
        const mn = numFR(w[p.mnKey]), mx = numFR(w[p.mxKey]);
        if (!w[p.eKey] || mn == null || mx == null) return;
        eid = w[p.eKey];
        lo = (lo == null) ? mn : Math.min(lo, mn);  // plage la plus large
        hi = (hi == null) ? mx : Math.max(hi, mx);
      });
      if (!eid || lo == null || hi == null || !states[eid]) return;
      const val = numFR(states[eid].state);
      if (val == null) return;
      if (p.low && val < lo) out.push({ msg: 'CHIMIE SPA : ' + p.lbl + ' bas (' + val + (p.unit?(' '+p.unit):'') + ')', level: 'warn' });
      else if (val > hi) out.push({ msg: 'CHIMIE SPA : ' + p.lbl + ' haut (' + val + (p.unit?(' '+p.unit):'') + ')', level: 'warn' });
    });

    // (C) Capteurs biohazard actifs
    (cfg.biohazard_entities || []).forEach(eid => {
      if (states[eid]?.state === 'on') out.push({ msg: 'ALERTE : ' + nameOf(eid), level: 'crit' });
    });

    // Dédoublonnage
    const seen = new Set();
    return out.filter(a => { if (seen.has(a.msg)) return false; seen.add(a.msg); return true; });
  }

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
    this._preloadIframes();
  }

  _preloadIframes() {
    if (this._preloaded || !this.shadowRoot) return;
    const urls = [];
    (this._config?.categories || this.config?.categories || []).forEach(c =>
      (c.submenus || []).forEach(s => {
        if (s.iframe && Array.isArray(s.sensors)) s.sensors.forEach(x => { if (x && x.url) urls.push(x.url); });
      }));
    if (!urls.length) return;
    this._preloaded = true;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;left:-99999px;top:-99999px;width:1200px;height:800px;opacity:0;pointer-events:none;overflow:hidden;';
    [...new Set(urls)].forEach(u => {
      const f = document.createElement('iframe');
      f.src = u; f.width = '1200'; f.height = '800';
      f.setAttribute('loading', 'eager');
      host.appendChild(f);
    });
    this.shadowRoot.appendChild(host);
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
    // Ciel animé du widget météo natif
    const wxCanvas = this.shadowRoot ? this.shadowRoot.querySelector('.re-wx-sky') : null;
    if (wxCanvas) {
      const ctrl = this._initWeatherSky(wxCanvas, this._wxAnimated !== false);
      if (ctrl && this._wxScene) ctrl.setScene(this._wxScene);
    }
    // Mise à l'échelle des iframes : plus aucun scroll interne
    const fits = this.shadowRoot ? this.shadowRoot.querySelectorAll('.re-iframe-fit') : [];
    fits.forEach(fit => {
      const ifr  = fit.querySelector('iframe');
      if (!ifr) return;
      const natW = parseFloat(fit.dataset.natw) || 1400;
      let   natH = parseFloat(fit.dataset.nath) || 760;
      // iframe_height du YAML prioritaire ; sinon, mesure du contenu (même origine)
      if (fit.dataset.hfixed !== '1') {
        try {
          const d = ifr.contentDocument;
          if (d && d.body) {
            const realH = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
            if (realH > 100) { natH = realH; }
          }
        } catch (_e) {}
      }
      ifr.style.height = natH + 'px';
      const rect = fit.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const sx = rect.width / natW;
      const sy = rect.height / natH;
      ifr.style.transform = 'scale(' + sx + ', ' + sy + ')';
      ifr.style.marginLeft = '0px';
    });
  }

  // Âge depuis la dernière mise à jour ; renvoie une pastille si > seuil (déf. 30 min)
  _staleDot(stateObj) {
    try {
      const thr = (parseInt(this.config.stale_minutes) || 30) * 60000;
      const last = new Date(stateObj.last_updated || stateObj.last_changed).getTime();
      const age = Date.now() - last;
      if (isNaN(age) || age < thr) return html``;
      const mins = Math.floor(age / 60000);
      const lbl = mins >= 1440 ? Math.floor(mins/1440)+'j'
                : mins >= 60 ? Math.floor(mins/60)+'h' : mins+'min';
      return html`<span class="re-stale-dot" title="Pas de mise à jour depuis ${lbl}"></span>`;
    } catch(_e) { return html``; }
  }

  renderEntity(item) {
    const entityId = typeof item === 'object' ? item.entity : item;
    const customIcon = typeof item === 'object' ? item.icon : null;
    const iframeUrl = typeof item === 'object' ? item.url : null;

    if (iframeUrl) {
      const natW = parseInt(item.iframe_width)  || 1400;
      const natH = parseInt(item.iframe_height) || 760;
      const hFixed = item.iframe_height ? '1' : '';
      return html`
        <div class="re-iframe-wrapper" style="position:relative;">
          <div class="re-iframe-fit" data-natw="${natW}" data-nath="${natH}" data-hfixed="${hFixed}"
               style="position:absolute;inset:0;overflow:hidden;">
            <iframe class="re-iframe" src="${iframeUrl}" scrolling="no" loading="eager"
                    @load="${() => { this.requestUpdate(); setTimeout(() => this.requestUpdate(), 400); }}"
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
      // camera_proxy_stream = flux MJPEG continu (réellement live), contrairement
      // à camera_proxy qui ne renvoie qu'un seul instantané figé pour toujours.
      const cameraUrl = `/api/camera_proxy_stream/${entityId}?token=${stateObj.attributes.access_token}`;
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
            <div class="sensor-name-block">
              <div class="sensor-room-name">${name}</div>
              <div class="sensor-sub-label">☣️ HVAC CONTROL</div>
            </div>
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
            <div class="sensor-name-block">
              <div class="sensor-room-name">${this._staleDot(stateObj)}${name}</div>
              <div class="sensor-sub-label">🌡️ THERMAL MONITOR</div>
            </div>
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
        <div class="sensor-card-header"><div class="sensor-name">${this._staleDot(stateObj)}${name}</div><ha-icon class="sensor-icon" icon="${iconToRender}"></ha-icon></div>
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
    const _wZoom = parseFloat((this._config?.theme||{}).widget_zoom || 1);
    const sizeStyle = fillSingle
      ? `width: 100%; height: 100%;`
      : `width: calc(${widthPct}% - 10px); ${heightPx ? 'height:' + heightPx + 'px;' : ''} zoom: ${_wZoom};`;

    switch (type) {
      case 'shape':    return this._renderShape(w, color, glow, sizeStyle, noBorder);
      case 'gauge':    return this._renderGauge(w, color, glow, sizeStyle, noBorder);
      case 'sparkline':return this._renderSparkline(w, color, glow, sizeStyle, noBorder);
      case 'badge':    return this._renderBadge(w, color, glow, sizeStyle, noBorder);
      case 'spa_temp':  return this._renderSpaTemp(w, color, glow, sizeStyle, noBorder);
      case 'energie':   return this._renderEnergieWidget(w, sizeStyle, noBorder);
      case 'health':    return this._renderHealthWidget(w, sizeStyle, noBorder);
      case 'dossier':   return this._renderDossierWidget(w, sizeStyle, noBorder);
      case 'plant':     return this._renderPlantWidget(w, sizeStyle, noBorder);
      case 'server':    return this._renderServerWidget(w, sizeStyle, noBorder);
      case 'tank':      return this._renderTankWidget(w, sizeStyle, noBorder);
      case 'tracker':   return this._renderTrackerWidget(w, sizeStyle, noBorder);
      case 'map':       return this._renderMapWidget(w, sizeStyle, noBorder);
      case 'appliance': return this._renderApplianceWidget(w, sizeStyle, noBorder);
      case 'progress':   return this._renderProgressWidget(w, sizeStyle, noBorder);
      case 'button':     return this._renderButtonWidget(w, sizeStyle, noBorder);
      case 'foundry':    return this._renderFoundryWidget(w, sizeStyle, noBorder);
      case 'alsace_meteo':    return this._renderAlsaceMeteoWidget(w, sizeStyle, noBorder);
      case 'power_cell':      return this._renderPowerCellWidget(w, sizeStyle, noBorder);
      case 'radar':           return this._renderRadarWidget(w, sizeStyle, noBorder);
      case 'ekg':             return this._renderEkgWidget(w, sizeStyle, noBorder);
      case 'water_wave':      return this._renderWaterWaveWidget(w, sizeStyle, noBorder);
      case 'matrix_rain':     return this._renderMatrixRainWidget(w, sizeStyle, noBorder);
      case 'tvirus':          return this._renderTVirusWidget(w, sizeStyle, noBorder);
      case 'gauge_arc':       return this._renderGaugeArcWidget(w, sizeStyle, noBorder);
      case 'oscilloscope':    return this._renderOscilloscopeWidget(w, sizeStyle, noBorder);
      case 'weather':    return this._renderWeatherWidget(w, sizeStyle, noBorder);
      case 'solar':      return this._renderSolarWidget(w, sizeStyle, noBorder);
      case 'solar_flow':   return this._renderSolarFlowWidget(w, sizeStyle, noBorder);
      case 'consumption':   return this._renderConsumptionWidget(w, sizeStyle, noBorder);
      case 'economies':   return this._renderEconomiesWidget(w, sizeStyle, noBorder);
      case 'previsions':   return this._renderPrevisionsWidget(w, sizeStyle, noBorder);
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
    const minE = w.min_entity && this.hass?.states[w.min_entity] ? parseFloat(this.hass.states[w.min_entity].state) : null;
    const maxE = w.max_entity && this.hass?.states[w.max_entity] ? parseFloat(this.hass.states[w.max_entity].state) : null;
    const min   = minE != null && !isNaN(minE) ? minE : (w.min != null ? parseFloat(w.min) : 0);
    const max   = maxE != null && !isNaN(maxE) ? maxE : (w.max != null ? parseFloat(w.max) : 100);
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

  // ─── Sparkline : buffer circulaire + rendu SVG inline ─────────────
  _trackSpark(eid, val) {
    if (!this._sparks) this._sparks = {};
    if (!this._sparks[eid]) this._sparks[eid] = [];
    if (val !== null && !isNaN(val)) {
      this._sparks[eid].push(val);
      if (this._sparks[eid].length > 40) this._sparks[eid].shift();
    }
  }
  _spark(eid, col) {
    const arr = this._sparks?.[eid];
    if (!arr || arr.length < 3) return html``;
    const W=100, H=22;
    const mn=Math.min(...arr), mx=Math.max(...arr), rng=mx-mn||1;
    const pts=arr.map((v,i)=>`${(i/(arr.length-1))*W},${H-2-((v-mn)/rng)*(H-4)}`).join(' ');
    return html`<svg width="${W}" height="${H}" style="flex:none;opacity:0.55;display:block;margin-top:4px;" preserveAspectRatio="none">
      <polyline fill="none" stroke="${col}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" points="${pts}"/>
    </svg>`;
  }

    _renderBadge(w, color, glow, sizeStyle, noBorder=false) {
    const { value, unit, name } = this._getDesignState(w);
    const label    = w.label || name;
    const icon     = w.icon  || this._getEntityIcon(w.entity);
    const iconPos  = w.iconPos || 'top';
    const iconSize = Math.max(16, parseInt(w.iconSize) || 28);
    const fontSize = Math.max(12, parseInt(w.fontSize) || 22);
    const decimals = w.decimals != null ? parseInt(w.decimals) : 1;
    const hudClass = w.hud ? 'hud-frame' : '';
    const displayVal = value != null
      ? (typeof value === 'number' ? value.toFixed(decimals) : value)
      : '--';

    // ── Ligne secondaire optionnelle (ex: date/heure d'un record) ──
    const secEntity = w.secondary_entity;
    const secState  = secEntity && this.hass?.states[secEntity] ? this.hass.states[secEntity].state : null;
    let secText = null;
    if (secState != null && !['unavailable','unknown',''].includes(String(secState))) {
      const d = new Date(String(secState).replace(' ', 'T'));
      secText = !isNaN(d.getTime())
        ? d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})
        : secState;
      if (w.secondary_label) secText = w.secondary_label + ' ' + secText;
    }

    // ── Ligne tertiaire optionnelle (ex: texte additionnel libre) ──
    const terEntity = w.tertiary_entity;
    const terState  = terEntity && this.hass?.states[terEntity] ? this.hass.states[terEntity].state : null;
    const terText = (terState != null && !['unavailable','unknown',''].includes(String(terState))) ? terState : null;

    const numVal = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(numVal)) this._trackSpark(w.entity, numVal);
    return html`
      <div class="dw-card ${noBorder?'no-border':''} ${hudClass}" style="border-color:${color}33; ${sizeStyle}">
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
            ${secText ? html`<div class="dw-badge-secondary">${secText}</div>` : html``}
            ${terText ? html`<div class="dw-badge-tertiary">${terText}</div>` : html``}
            ${this._spark(w.entity, color)}
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

    const hasBg = !!w.bgImage;
    const bg   = hasBg ? `url('${w.bgImage}')` : '#0a0a0a';
    const blur = hasBg ? (w.bgBlur!=null ? w.bgBlur : 5) : 0;

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

    // ── Calibration manuelle : décalage additif appliqué à la valeur brute du capteur.
    //    Utile si la sonde dérive par rapport à un testeur de référence (bandelette, etc.)
    const calOff = (x) => { const n = parseFloat(String(x ?? '0').replace(',', '.')); return isNaN(n) ? 0 : n; };
    const ph   = ex(w.phEntity)   ? parseFloat(st(w.phEntity))   + calOff(w.ph_offset)   : null;
    const orp  = ex(w.orpEntity)  ? parseFloat(st(w.orpEntity))  + calOff(w.orp_offset)  : null;
    const tds  = ex(w.tdsEntity)  ? parseFloat(st(w.tdsEntity))  + calOff(w.tds_offset)  : null;
    const salt = ex(w.saltEntity) ? parseFloat(st(w.saltEntity)) + calOff(w.salt_offset) : null;
    const numv = (x, def) => { if (x==null || x==='') return def; const n = parseFloat(String(x).replace(',','.')); return isNaN(n) ? def : n; };
    const chemGauge = (val, min, max, lbl, unit, cal) => {
      if (val==null) return html``;
      const pct = Math.min(100, Math.max(0, (val-min)/(max-min)*100));
      const ok  = val>=min && val<=max;
      const c2  = ok ? '#10b981' : '#ef4444';
      return html`
        <div style="display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:rgba(255,255,255,.6);font-weight:600;">${lbl}${cal ? html`<span style="opacity:.6;font-size:10px;margin-left:4px;" title="Calibration manuelle active (${cal>0?'+':''}${cal})">⚙</span>` : html``}</span>
            <span style="color:${c2};font-weight:700;">${val.toFixed(2)} ${unit}</span>
          </div>
          <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct.toFixed(2)}%;background:${c2};border-radius:3px;transition:width .5s;"></div>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,.35);text-align:right;">${min} – ${max} ${unit}</div>
        </div>`;
    };

    const switches = [];
    for (let i=1; i<=15; i++) {
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
    // camera_proxy_stream = flux MJPEG continu (réellement live) — plus besoin
    // de cache-busting "&t=Date.now()" puisque l'image se met à jour en continu.
    const camUrl  = camState ? `/api/camera_proxy_stream/${camId}?token=${camState.attributes.access_token}` : null;

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

    const chemAdvice = () => {
      const phMin=numv(w.ph_min,7), phMax=numv(w.ph_max,7.6);
      const orpMin=numv(w.orp_min,650), orpMax=numv(w.orp_max,800);
      const tdsMin=numv(w.tds_min,500), tdsMax=numv(w.tds_max,2000);
      const saltMin=numv(w.salt_min,300), saltMax=numv(w.salt_max,500);
      const tips = [];
      if (ph!=null && ph<phMin)  tips.push({t:'pH trop bas ('+ph.toFixed(2)+') : ajoutez du pH+ (rehausseur), puis recontrôlez après circulation.'});
      if (ph!=null && ph>phMax)  tips.push({t:'pH trop haut ('+ph.toFixed(2)+') : ajoutez du pH− (réducteur) par petites doses.'});
      if (orp!=null && orp<orpMin) tips.push({t:'Désinfection insuffisante (ORP '+orp.toFixed(0)+' mV) : ajoutez du chlore/brome.'});
      if (orp!=null && orp>orpMax) tips.push({t:'Désinfectant trop élevé (ORP '+orp.toFixed(0)+' mV) : attendez avant la baignade, ne rajoutez rien.'});
      if (tds!=null && tds>tdsMax) tips.push({t:'Trop de matières dissoutes (TDS '+tds.toFixed(0)+' ppm) : renouvelez une partie de l\'eau.'});
      if (salt!=null && salt<saltMin) tips.push({t:'Sel trop bas ('+salt.toFixed(0)+' ppm) : ajoutez du sel selon la notice de l\'électrolyseur.'});
      if (salt!=null && salt>saltMax) tips.push({t:'Sel trop élevé ('+salt.toFixed(0)+' ppm) : diluez avec de l\'eau fraîche.'});
      if (!tips.length) {
        if (ph==null&&orp==null&&tds==null&&salt==null) return html``;
        return html`<div style="display:flex;align-items:center;gap:8px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:10px 12px;font-size:13px;font-weight:600;color:#10b981;">
          <ha-icon icon="mdi:check-circle" style="--mdc-icon-size:18px;"></ha-icon><span>Eau équilibrée — aucun ajustement nécessaire.</span></div>`;
      }
      return html`
        <div style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:7px;">
          <div style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:800;color:#fca5a5;letter-spacing:.3px;">
            <ha-icon icon="mdi:flask-alert" style="--mdc-icon-size:18px;"></ha-icon>ACTIONS RECOMMANDÉES
          </div>
          ${tips.map(x => html`<div style="display:flex;gap:7px;align-items:flex-start;font-size:13px;line-height:1.45;color:#fde68a;">
            <span style="color:#f59e0b;flex-shrink:0;">▶</span><span>${x.t}</span></div>`)}
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;">Valeurs indicatives — suivez la notice de votre analyseur et de vos produits.</div>
        </div>`;
    };

    const renderChem = () => {
      const phMin=numv(w.ph_min,7), phMax=numv(w.ph_max,7.6);
      const orpMin=numv(w.orp_min,650), orpMax=numv(w.orp_max,800);
      const tdsMin=numv(w.tds_min,300), tdsMax=numv(w.tds_max,600);
      const saltMin=numv(w.salt_min,300), saltMax=numv(w.salt_max,500);

      const param = (val, min, max) => {
        if (val == null) return { pct: 0, col: '#334', fill: 20, ok: false, alert: false };
        const inRange = val >= min && val <= max;
        const range = max - min;
        const fill = Math.min(92, Math.max(8, ((val - min) / range) * 70 + 15));
        const overshoot = !inRange ? Math.max(0, (val > max ? (val-max)/range : (min-val)/range)) : 0;
        const alert = overshoot > 0.15;
        const col = inRange ? '#00ff66' : alert ? '#ff3300' : '#ffaa00';
        return { pct: Math.min(100, Math.max(0, ((val-min)/range)*100)), fill, col, ok: inRange, alert };
      };
      const PP = param(ph, phMin, phMax);
      const PO = param(orp, orpMin, orpMax);
      const PT = param(tds, tdsMin, tdsMax);
      const PS = param(salt, saltMin, saltMax);

      const alerts = [
        ph!=null && !PP.ok ? `pH ${ph?.toFixed(2)} hors norme (${phMin}–${phMax}) — ajuster le pH` : null,
        orp!=null && !PO.ok ? `ORP ${Math.round(orp)} mV hors norme (${orpMin}–${orpMax} mV) — vérifier le chlore` : null,
        salt!=null && !PS.ok ? `Sel ${Math.round(salt)} ppm hors norme (${saltMin}–${saltMax} ppm) — ${salt>saltMax?'diluer l\'eau':'ajouter du sel'}` : null,
        tds!=null && !PT.ok ? `TDS ${Math.round(tds)} ppm hors norme (${tdsMin}–${tdsMax} ppm) — renouveler l'eau` : null,
      ].filter(Boolean);
      const allOk = alerts.length === 0;
      const riskPct = Math.min(100, alerts.length * 28 + (PP.alert||PO.alert||PS.alert||PT.alert ? 15 : 0));

      const vial = (label, val, unit, P, min, max) => {
        const hasVal = val != null;
        const dispVal = hasVal ? (Number.isInteger(val) ? val : val.toFixed(unit===''?1:0)) : '--';
        return html`
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;
                      padding:10px 6px;border-right:1px solid #3300ff10;position:relative;overflow:hidden;
                      background:${P.alert?'#0d0100':'#030005'};">
            <div style="position:absolute;top:0;left:0;right:0;height:1px;
                         background:${P.col}18;animation:_re_scan ${P.alert?'2':'3.5'}s linear infinite;
                         animation-delay:${Math.random()*2}s;"></div>
            <div style="font-size:12px;letter-spacing:2px;color:${P.col}88;
                         ${P.alert?'animation:_re_pulse 1.5s ease-in-out infinite;':''}">
              ${label}
            </div>
            <div style="width:30px;height:6px;background:${P.col};border-radius:2px 2px 0 0;opacity:0.8;
                         ${P.alert?'animation:_re_pulse 1.5s ease-in-out infinite;':''}"></div>
            <div style="width:34px;height:108px;border:2px solid ${P.col}44;
                         border-radius:3px 3px 16px 16px;background:#040008;
                         position:relative;overflow:hidden;">
              <div style="position:absolute;bottom:0;left:0;right:0;height:${P.fill}%;
                           background:${P.col}22;border-radius:0 0 14px 14px;"></div>
              <div style="position:absolute;bottom:0;left:2px;right:2px;height:${Math.max(0,P.fill-2)}%;
                           background:${P.col}55;border-radius:0 0 12px 12px;
                           ${P.alert?'animation:_re_pulse 1.5s ease-in-out infinite;':''}">
                ${P.alert ? html`
                  <div style="position:absolute;top:4px;left:5px;width:4px;height:4px;border-radius:50%;background:${P.col};opacity:.5;animation:_re_bubble 1.8s ease-out infinite;"></div>
                  <div style="position:absolute;top:12px;left:14px;width:3px;height:3px;border-radius:50%;background:${P.col};opacity:.4;animation:_re_bubble 2.3s ease-out infinite;animation-delay:.7s;"></div>` : html``}
              </div>
              ${P.fill > 80 && !allOk ? html`
                <div style="position:absolute;bottom:${P.fill-2}%;left:0;right:0;height:1px;
                             border-top:1px dashed ${P.col}55;"></div>
                <div style="position:absolute;bottom:${P.fill}%;right:2px;font-size:12px;color:${P.col}77;">MAX</div>` : html``}
              <div style="position:absolute;top:0;left:3px;width:5px;bottom:0;
                           background:rgba(255,255,255,0.03);border-radius:3px;"></div>
            </div>
            <div style="font-size:20px;font-weight:900;color:${P.col};line-height:1;
                         ${P.alert?'animation:_re_pulse 1.5s ease-in-out infinite;':''}">
              ${dispVal}<span style="font-size:13px;color:#8899aa;margin-left:2px;">${unit}</span>
            </div>
            <div style="font-size:12px;color:${P.col}77;padding:2px 7px;border:1px solid ${P.col}33;border-radius:2px;
                         ${P.alert?'animation:_re_pulse 1.5s ease-in-out infinite;':''}">
              ${!hasVal?'N/D':P.ok?'CONFORME':P.alert?'ALERTE !':'ATTENTION'}
            </div>
            <div style="font-size:12px;color:#8899aa;">${min}–${max}</div>
          </div>`;
      };

      return html`
        <style>
          @keyframes _re_bubble{0%{transform:translateY(0);opacity:.5}100%{transform:translateY(-35px);opacity:0}}
        </style>
        <div style="display:flex;flex-direction:column;gap:0;background:#030005;border:1px solid #3300ff22;border-radius:6px;overflow:hidden;font-family:'Courier New',monospace;position:relative;">
          <div style="position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;">
            <div style="position:absolute;width:40%;height:1px;background:#6644ff44;animation:_re_scanH 4s linear infinite;"></div>
          </div>
          <style>@keyframes _re_scanH{0%{left:-40%}100%{left:100%}}</style>

          <!-- HEADER -->
          <div style="background:#07000f;border-bottom:1px solid #3300ff22;padding:8px 12px;display:flex;align-items:center;gap:10px;">
            <svg width="24" height="24" viewBox="0 0 28 28" style="flex-shrink:0;animation:_re_rotate 8s linear infinite;opacity:0.6">
              <style>@keyframes _re_rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
              <circle cx="14" cy="14" r="12" fill="none" stroke="#6644ff" stroke-width="1.5"/>
              <circle cx="14" cy="14" r="5" fill="none" stroke="#6644ff" stroke-width="1.5"/>
              <line x1="14" y1="9" x2="14" y2="2" stroke="#6644ff" stroke-width="1.5"/>
              <line x1="9" y1="17.2" x2="3.2" y2="20.6" stroke="#6644ff" stroke-width="1.5"/>
              <line x1="19" y1="17.2" x2="24.8" y2="20.6" stroke="#6644ff" stroke-width="1.5"/>
            </svg>
            <div style="flex:1;">
              <div style="font-size:13px;letter-spacing:2px;color:#9977ff;">UMBRELLA CORP. — BIO-ANALYSIS UNIT 7</div>
              <div style="font-size:12px;color:#6644aa;letter-spacing:1px;margin-top:1px;">VECTEUR: H₂O · SPA-01</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px;color:${allOk?'#00ff6699':'#ff330099'};letter-spacing:2px;${!allOk?'animation:_re_pulse 2s infinite;':''}">
                ${allOk?'✓ NOMINAL':'⚠ CONTAMINATION'}
              </div>
              <div style="font-size:12px;color:${allOk?'#00ff6644':'#ff330066'};margin-top:2px;">
                NIVEAU BIOHAZARD: ${allOk?'0':alerts.length}
              </div>
            </div>
          </div>

          <!-- JAUGE GLOBALE + TEMPS -->
          <div style="display:flex;border-bottom:1px solid #3300ff15;">
            <div style="flex:1;padding:10px 12px;border-right:1px solid #3300ff15;">
              <div style="font-size:12px;letter-spacing:2px;color:#9977ff;margin-bottom:6px;">INDICE DE CONTAMINATION GLOBAL</div>
              <div style="height:6px;background:#0a0012;border-radius:3px;overflow:hidden;position:relative;">
                <div style="position:absolute;left:0;top:0;bottom:0;width:33%;background:#00ff66;border-radius:3px 0 0 3px;"></div>
                <div style="position:absolute;left:33%;top:0;bottom:0;width:34%;background:#ffaa00;"></div>
                <div style="position:absolute;left:67%;top:0;bottom:0;width:33%;background:#ff3300;border-radius:0 3px 3px 0;"></div>
                <div style="position:absolute;top:-2px;bottom:-2px;width:3px;background:#fff;border-radius:1px;
                             left:${Math.min(96,riskPct)}%;transition:left .8s;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:12px;color:#7755bb;">
                <span>SAIN</span><span>MODÉRÉ</span><span>DANGER</span>
              </div>
              <div style="margin-top:5px;font-size:14px;color:${allOk?'#00ff66':riskPct>60?'#ff3300':'#ffaa00'};letter-spacing:1px;">
                ${allOk?'TOUS PARAMÈTRES CONFORMES':alerts.length+' PARAMÈTRE(S) HORS NORME'}
              </div>
            </div>
            <div style="display:flex;">
              <div style="padding:10px 12px;border-right:1px solid #3300ff15;text-align:center;min-width:60px;">
                <div style="font-size:12px;letter-spacing:1px;color:#00ccff;margin-bottom:3px;">EAU</div>
                <div style="font-size:24px;font-weight:900;color:#00ccff;">${wTemp!=null?wTemp.toFixed(1)+'°':'--'}</div>
                ${tTemp!=null?html`<div style="font-size:12px;color:#00bbff88;margin-top:2px;">CIBLE ${tTemp}°</div>`:html``}
              </div>
              ${airTemp!=null?html`
              <div style="padding:10px 12px;text-align:center;min-width:60px;">
                <div style="font-size:12px;letter-spacing:1px;color:#ff9944;margin-bottom:3px;">AIR SPA</div>
                <div style="font-size:24px;font-weight:900;color:#ff8844;">${parseFloat(airTemp).toFixed(1)}°</div>
                ${extTemp!=null?html`<div style="font-size:12px;color:#ff884488;margin-top:2px;">EXT. ${parseFloat(extTemp).toFixed(1)}°</div>`:html``}
              </div>`:html``}
            </div>
          </div>

          <!-- FIOLES -->
          <div style="display:flex;border-bottom:1px solid #3300ff15;">
            ${vial('pH', ph, '', PP, phMin, phMax)}
            ${vial('ORP', orp, 'mV', PO, orpMin, orpMax)}
            ${vial('SEL', salt, 'ppm', PS, saltMin, saltMax)}
            ${vial('TDS', tds, 'ppm', PT, tdsMin, tdsMax)}
          </div>

          <!-- RECOMMANDATIONS -->
          ${alerts.length > 0 ? html`
          <div style="padding:8px 12px;border-bottom:1px solid #3300ff10;background:#060008;">
            <div style="font-size:12px;letter-spacing:2px;color:#9977ff;margin-bottom:5px;">&gt; RECOMMANDATIONS AUTOMATIQUES</div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              ${alerts.map(a => html`
                <div style="display:flex;align-items:flex-start;gap:7px;font-size:14px;">
                  <span style="color:#ff3300;flex-shrink:0;">⚠</span>
                  <span style="color:#ff330099;">${a}</span>
                </div>`)}
            </div>
          </div>` : html`
          <div style="padding:8px 12px;background:#000a02;border-bottom:1px solid #3300ff10;">
            <div style="font-size:14px;color:#00ff6666;letter-spacing:1px;">&gt; TOUS PARAMÈTRES DANS LES NORMES — AUCUNE ACTION REQUISE ✓</div>
          </div>`}

          <!-- FOOTER -->
          <div style="padding:5px 12px;display:flex;justify-content:space-between;font-size:12px;color:#8866ff;">
            <span>SPA-01 · LAZYSPA 500L</span>
            <span style="color:#ff330044;animation:_re_pulse 1.5s step-end infinite;">● ENREGISTREMENT EN COURS</span>
            <span>UMBR. CORP. BIO-LAB © 2026</span>
          </div>
        </div>`;
    };

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
        <div style="position:absolute;inset:0;background:${bg};background-size:cover;background-position:center;${blur?`filter:blur(${blur}px);transform:scale(1.05);`:''}"></div>
        ${hasBg ? html`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.38);"></div>` : html``}
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
      <style>@keyframes _re_pulse{0%,100%{opacity:1}50%{opacity:0.25}}</style>
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} background:#050505;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:14px;">
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

  // ═══════════ WIDGET « DOSSIER » — fiche santé d'une seule personne ═══════════
  // Style « Dossier S.T.A.R.S. » : un widget = une personne. Pour séparer Patrick
  // et Sandra, créer deux widgets `dossier` dans deux sous-menus distincts.
  _renderDossierWidget(w, sizeStyle, noBorder=false) {
    const getSt = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const numSt = (eid) => { const v = getSt(eid); const n = v!=null ? parseFloat(v) : null; return (n!=null && !isNaN(n)) ? n : null; };
    const fmtV  = (v, u) => {
      if (v == null || v === '') return '--';
      const n = parseFloat(v);
      const s = isNaN(n) ? String(v) : n.toLocaleString('fr-FR',{maximumFractionDigits:2});
      return s + (u||'');
    };
    // Affiche la valeur numérique formatée + unité, ou — si le capteur renvoie
    // du texte (ex: "Obésité de classe II (sévère)") — l'état brut tel quel.
    const dispVal = (s) => {
      if (s.val != null) return fmtV(s.val, s.unit);
      if (s.raw != null && !['unavailable','unknown',''].includes(String(s.raw))) return s.raw;
      return '--';
    };

    const name = w.name || 'INCONNU';
    const initials = name.trim()[0]?.toUpperCase() || '?';
    const archiveId = w.archiveId || ('#' + String(Math.abs([...name].reduce((h,c)=>h*31+c.charCodeAt(0),7))).slice(0,4).padStart(4,'0'));

    const CAT_CFG = {
      forme:     { label: '⚡ Forme',     color: '#22d3ee' },
      sante:     { label: '🩺 Santé',     color: '#10b981' },
      sommeil:   { label: '🌙 Sommeil',   color: '#818cf8' },
      nutrition: { label: '🥗 Nutrition', color: '#f59e0b' },
    };
    const CAT_ORDER = ['forme','sante','sommeil','nutrition'];

    const sensors = w.sensors || [];
    let anyAlert = false;
    const groups = {};
    sensors.forEach(s => {
      const c = s.cat || 'forme';
      if (!groups[c]) groups[c] = [];
      const val = numSt(s.entity);
      const raw = getSt(s.entity);
      const outOfRange = (s.min != null && val != null && val < parseFloat(s.min))
                       || (s.max != null && val != null && val > parseFloat(s.max));
      if (outOfRange) anyAlert = true;
      groups[c].push({ ...s, val, raw, outOfRange });
    });
    const cats = CAT_ORDER.filter(k => groups[k]?.length > 0);

    // ── Poids ──
    const wCur  = w.weight_entity ? numSt(w.weight_entity) : null;
    const wSt   = parseFloat(w.weight_start) || wCur || null;
    const wId   = parseFloat(w.weight_ideal) || null;
    const wDiff = (wCur != null && wSt != null) ? wCur - wSt : null;
    const wCol  = wDiff != null && wDiff <= 0 ? '#00ff00' : '#ff3b3b';
    const wPct  = (wCur != null && wSt != null && wId != null && Math.abs(wSt - wId) > 0.01)
      ? Math.min(100, Math.max(0, (Math.abs(wSt - wCur) / Math.abs(wSt - wId)) * 100))
      : 0;

    // ── Capteur BPM (heart-pulse) ──
    const heartSensor = sensors.find(s => s.icon === 'mdi:heart-pulse' || (s.unit||'').toLowerCase().includes('bpm'));
    const heartVal = heartSensor ? numSt(heartSensor.entity) : null;

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}
           background:#050505; border:2px solid #8b0000; border-radius:3px;
           box-shadow:0 0 18px rgba(139,0,0,.6), inset 0 0 30px rgba(0,0,0,.7);
           overflow:hidden; position:relative; display:flex; flex-direction:column;
           font-family:'Courier New',monospace;">
        <div style="position:absolute;top:4px;left:4px;width:14px;height:14px;
                    border-top:2px solid #ff0000;border-left:2px solid #ff0000;pointer-events:none;z-index:5;"></div>
        <div style="position:absolute;bottom:4px;right:4px;width:14px;height:14px;
                    border-bottom:2px solid #ff0000;border-right:2px solid #ff0000;pointer-events:none;z-index:5;"></div>

        <div style="flex-shrink:0;background:#8b0000;color:#1a0000;font-size:12px;font-weight:bold;
                    letter-spacing:2px;padding:4px 10px;display:flex;justify-content:space-between;">
          <span>ARCHIVE U.B.C.S.</span><span>DOSSIER ${archiveId}</span>
        </div>

        <div style="flex-shrink:0;display:flex;gap:12px;padding:14px 14px 10px;align-items:center;
                    border-bottom:1px solid #2a2a2a;">
          <div style="width:54px;height:54px;border-radius:4px;background:#161616;border:1px solid #8b0000;
                      display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
            ${w.image
              ? html`<img src="${w.image}" style="width:100%;height:100%;object-fit:cover;" />`
              : html`<span style="font-size:22px;font-weight:bold;color:#ff0000;text-shadow:0 0 6px rgba(139,0,0,.6);">${initials}</span>`}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:18px;font-weight:bold;color:#f1f1f1;letter-spacing:1px;white-space:nowrap;
                        overflow:hidden;text-overflow:ellipsis;">${name.toUpperCase()}</div>
            <div style="font-size:12px;margin-top:3px;color:${anyAlert?'#ff3b3b':'#00ff00'};">
              <span style="opacity:.8;">●</span> STATUT ${anyAlert?'ALERTE':'OPÉRATIONNEL'}
            </div>
          </div>
          ${heartVal != null ? html`
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;
                      background:#0d0505;border:1px solid #8b000044;border-radius:4px;padding:6px 10px;">
            <div style="font-size:9px;letter-spacing:2px;color:#8b0000;margin-bottom:2px;">BPM</div>
            <div style="font-size:22px;font-weight:900;color:var(--re-wr);line-height:1;
                        animation:_re_pulse 1s ease-in-out infinite;">
              ${Math.round(heartVal)}
            </div>
            <div style="font-size:9px;color:#8b000088;margin-top:2px;">♥</div>
          </div>` : html``}
        </div>

        <div style="flex:1;overflow-y:auto;padding:12px 14px;scrollbar-width:none;">
          ${cats.length === 0 ? html`
            <div style="color:#666;font-size:13px;text-align:center;padding:30px 10px;">
              Aucun capteur configuré — renseignez <code>sensors:</code> en YAML
              (cat: forme/sante/sommeil/nutrition, entity, name, unit, min, max).
            </div>` : html``}
          ${cats.map(cat => {
            const cfg = CAT_CFG[cat];
            return html`
              <div style="font-size:12px;letter-spacing:2px;color:${cfg.color};margin:0 0 6px;
                          text-transform:uppercase;${cat!==cats[0]?'margin-top:12px;':''}">${cfg.label}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                ${groups[cat].map(s => html`
                  <div style="display:flex;flex-direction:column;gap:3px;background:#0f0f0f;
                              border:1px solid ${s.outOfRange?'#8b0000':'#2a2a2a'};border-radius:2px;padding:6px 8px;">
                    <span style="font-size:12px;color:#999;display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;">
                      ${s.icon ? html`<ha-icon icon="${s.icon}" style="--mdc-icon-size:14px;color:${s.outOfRange?'#ff3b3b':cfg.color};flex-shrink:0;"></ha-icon>` : html``}
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.name||'—'}</span>
                    </span>
                    <span style="font-size:13px;font-weight:bold;line-height:1.25;color:${s.outOfRange?'#ff3b3b':cfg.color};
                                ${s.outOfRange?'text-shadow:0 0 5px rgba(139,0,0,.6);':''}">
                      ${dispVal(s)}
                    </span>
                  </div>`)}
              </div>`;
          })}

          ${wCur != null ? html`
            <div style="margin-top:14px;background:#0f0f0f;border:1px solid #2a2a2a;border-radius:3px;padding:8px 10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#bbb;margin-bottom:5px;">
                ${wSt!=null ? html`<span>🏁 ${fmtV(wSt,' kg')}</span>` : html`<span></span>`}
                <span style="color:${wCol};font-weight:bold;">
                  ${fmtV(wCur,' kg')}${wDiff!=null?html` (${wDiff>0?'+':''}${wDiff.toFixed(2)} kg)`:html``}
                </span>
                ${wId!=null ? html`<span>🎯 ${fmtV(wId,' kg')}</span>` : html`<span></span>`}
              </div>
              <div style="height:6px;background:#1c1c1c;border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${wPct.toFixed(2)}%;background:linear-gradient(90deg,#00ff00,#0a8a0a);
                            border-radius:3px;transition:width 1.2s;"></div>
              </div>
            </div>` : html``}
        </div>
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
    const scanStyle=`@keyframes _re_scan{0%{top:0}100%{top:100%}}`;
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

    const gSize  = parseFloat(w.gauge_size) || 80;
    const gScale = gSize / 80;
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
          <div style="font-size:${Math.round(12*(size/80))}px;font-weight:700;color:#cbd5e1;letter-spacing:.8px;text-transform:uppercase;">${label}</div>
        </div>`;
    };

    const diskBar = (disk) => {
      const val = parseFloat(getSt(disk.entity));
      if (isNaN(val)) return html``;
      const maxV = (disk.max != null && disk.max !== '') ? parseFloat(disk.max) : 100;
      const pct = maxV ? Math.min(100, Math.max(0, (val/maxV)*100)) : 0;
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
      <style>@keyframes _re_scan{0%{top:0}100%{top:100%}}</style>
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle}; background:#050a14; border-color:#00ff8822;
                  overflow:hidden; position:relative; font-family:'Courier New',monospace;">
        <div style="position:absolute;left:0;right:0;height:1px;background:#00ff8825;z-index:10;pointer-events:none;animation:_re_scan 5s linear infinite;"></div>
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
            ${(() => { this._trackSpark(w.cpu_entity||'_cpu', cpuVal); this._trackSpark(w.ram_entity||'_ram', ramVal); return html``; })()}
            ${radialGauge(cpuVal, cpuColor, 'CPU', fmt(cpuVal,2), '%', gSize)}
            ${radialGauge(ramVal, ramColor, 'RAM', fmt(ramVal,2), '%', gSize)}
            ${hddVal ? radialGauge(hddVal, hddColor, 'HDD', fmt(hddVal,2), '%', gSize) : html``}
            ${procVal != null ? html`
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
                <div style="width:${gSize}px;height:${(gSize*0.875).toFixed(0)}px;display:flex;flex-direction:column;
                            align-items:center;justify-content:center;gap:4px;">
                  <ha-icon icon="mdi:cpu-64-bit" style="--mdc-icon-size:${(22*gScale).toFixed(0)}px;color:#f59e0b;
                    filter:drop-shadow(0 0 4px #f59e0b);"></ha-icon>
                  <div style="font-size:${(18*gScale).toFixed(0)}px;font-weight:900;color:#f59e0b;
                              font-family:'Courier New',monospace;line-height:1;">${procVal}</div>
                  <div style="font-size:${(11*gScale).toFixed(0)}px;color:#64748b;">PROC.</div>
                </div>
                <div style="font-size:${(12*gScale).toFixed(0)}px;font-weight:700;color:#cbd5e1;letter-spacing:.8px;
                            text-transform:uppercase;">PROCESSUS</div>
              </div>` : html``}
          </div>

          ${disks.length > 0 ? html`
            <div style="flex:1;display:flex;flex-direction:column;gap:5px;
                        background:rgba(0,0,0,.3);border:1px solid #0f1f0f;
                        border-radius:8px;padding:8px 10px;overflow:hidden;">
              <div style="flex-shrink:0;font-size:12px;font-weight:700;color:#00ff8866;
                          letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">◈ STOCKAGE / CAPTEURS</div>
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
      const distRaw = parseFloat(getSt(p.distance_entity));
      const distVal = isNaN(distRaw) ? null : distRaw;
      const distNearHome = distVal !== null && distVal < 0.3;
      // Présence : état HA OU distance < 300m
      const homeByHA   = pObj ? pObj.state === 'home' : false;
      const home       = homeByHA || distNearHome;
      const stateLabel = homeByHA       ? 'À DOMICILE' :
                         distNearHome   ? 'À DOMICILE' :
                         pObj?.state === 'not_home' ? 'ABSENT' :
                         pObj ? pObj.state.toUpperCase() : '--';
      const stCol = home ? '#22c55e' : '#f59e0b';
      const bat   = (() => { const v = parseFloat(getSt(p.battery_entity)); return isNaN(v) ? null : v; })();
      const batCol= bat == null ? '#475569' : bat <= 20 ? '#ef4444' : bat <= 50 ? '#f59e0b' : '#22c55e';
      const batState = getSt(p.battery_state_entity);
      const dist  = distVal != null ? distVal.toFixed(2) : getSt(p.distance_entity);
      // Adresse : domicile quand proche, sinon geocodé GPS
      const geoRaw = getSt(p.geocoded_entity);
      const homeZone = this.hass?.states['zone.home'];
      const homeAddr = homeZone?.attributes?.friendly_name || 'Domicile';
      const geo = home ? homeAddr : geoRaw;
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
    if (!this._fbMarkers) this._fbMarkers = {};

    const trySync = (retries = 0) => {
      const haMap = cardEl.shadowRoot?.querySelector('ha-map');
      if (!haMap) { if (retries < 20) setTimeout(() => trySync(retries+1), 400); return; }

      // Méthode 1 : Leaflet pose _leaflet_map sur le conteneur DOM
      const leafletContainer = haMap.shadowRoot?.querySelector('.leaflet-container')
                            || haMap.shadowRoot?.querySelector('#map')
                            || haMap.shadowRoot?.querySelector('div[class*="leaflet"]');
      let lMap = leafletContainer?._leaflet_map;

      // Méthode 2 : propriétés directes de ha-map
      if (!lMap) lMap = haMap._map || haMap._leafletMap || haMap.leafletMap || haMap.map;

      // Méthode 3 : recherche exhaustive sur ha-map
      if (!lMap) {
        for (const k of Object.getOwnPropertyNames(haMap)) {
          try { const v = haMap[k]; if (v && typeof v.setView === 'function' && typeof v.fitBounds === 'function') { lMap = v; break; } } catch(_) {}
        }
      }

      if (!lMap) { if (retries < 20) setTimeout(() => trySync(retries+1), 400); return; }

      // Leaflet global (HA le charge en global dans le browser)
      const L = window.L || haMap.Leaflet;
      if (!L?.divIcon) { if (retries < 20) setTimeout(() => trySync(retries+1), 400); return; }

      let fbIndex = 0;
      const bounds = [];

      persons.forEach(p => {
        if (!p.person) return;
        const st  = this.hass?.states[p.person];
        const key = p.person;
        const distV = parseFloat(this.hass?.states[p.distance_entity]?.state);
        const nearHome = !isNaN(distV) && distV < 0.3;
        const hasCoords = st?.attributes?.latitude != null && st?.attributes?.longitude != null;

        if (!nearHome && (!st || hasCoords)) {
          if (this._fbMarkers[key]) { try { lMap.removeLayer(this._fbMarkers[key]); } catch(_) {} delete this._fbMarkers[key]; }
          return;
        }

        const zone = nearHome
          ? this.hass.states['zone.home']
          : (this.hass.states['zone.' + st?.state] || this.hass.states['zone.home']);
        const lat = zone?.attributes?.latitude;
        const lon = zone?.attributes?.longitude;
        if (lat == null || lon == null) return;

        const offsets = [[-0.00035,0.0005],[0.0004,-0.0004],[0,-0.0006],[0.0005,0.0003]];
        const [oLat, oLon] = offsets[fbIndex % offsets.length];
        fbIndex++;
        const fLat = lat + oLat, fLon = lon + oLon;
        bounds.push([fLat, fLon]);

        const pic = st?.attributes?.entity_picture;
        const init = (p.name||'?')[0].toUpperCase();
        const border = nearHome ? '#22c55e' : '#f59e0b';
        const imgHtml = pic
          ? `<img src="${pic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
          : `<span style="font-size:18px;font-weight:800;color:${border};">${init}</span>`;
        const iconHtml = `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="width:44px;height:44px;border-radius:50%;border:3px solid ${border};overflow:hidden;background:#1e2d3d;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.9);">${imgHtml}</div>
          <div style="margin-top:3px;font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,1);white-space:nowrap;letter-spacing:0.5px;">${p.name||''}</div>
        </div>`;
        const icon = L.divIcon({ html:iconHtml, className:'', iconSize:[60,64], iconAnchor:[30,22] });

        if (this._fbMarkers[key]) {
          this._fbMarkers[key].setLatLng([fLat, fLon]).setIcon(icon);
        } else {
          this._fbMarkers[key] = L.marker([fLat, fLon], { icon, zIndexOffset:1000 }).addTo(lMap);
        }
      });

      // Centrer la carte sur les marqueurs placés
      if (bounds.length > 0) {
        try {
          setTimeout(() => {
            if (bounds.length === 1) lMap.setView(bounds[0], 16);
            else lMap.fitBounds(L.latLngBounds(bounds), { padding:[50,50], maxZoom:15 });
          }, 200);
        } catch(_) {}
      }
    };

    setTimeout(() => trySync(0), 800);
  }

  // ═══════════════════════════════════════════════════════════
  //  RADAR OVERLAY sur carte — vrai GPS bearing/distance
  // ═══════════════════════════════════════════════════════════
  _initMapRadar(canvas, getPersonsFn, getHomeFn, onPing) {
    if (!canvas || canvas.__anim) return;
    const ctx = canvas.getContext('2d');
    let sweep = 0, pings = [], raf;
    const toR = d => d * Math.PI / 180;

    const geoCalc = (hLat, hLon, pLat, pLon) => {
      const φ1=toR(hLat), φ2=toR(pLat), Δλ=toR(pLon-hLon);
      const y=Math.sin(Δλ)*Math.cos(φ2);
      const x=Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
      const bearing=(Math.atan2(y,x)*180/Math.PI+360)%360;
      const dLat=toR(pLat-hLat);
      const a=Math.sin(dLat/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
      const dist=6371*2*Math.asin(Math.sqrt(a));
      return { bearing, dist };
    };

    const draw = () => {
      const W=canvas.width, H=canvas.height, CX=W/2, CY=H/2;
      const R=Math.min(W,H)*0.46;
      ctx.clearRect(0,0,W,H);

      // Fond circulaire semi-transparent
      ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2);
      ctx.fillStyle='rgba(0,8,2,0.52)'; ctx.fill();

      // Anneaux
      [0.25,0.5,0.75,1].forEach((r,i) => {
        ctx.beginPath(); ctx.arc(CX,CY,R*r,0,Math.PI*2);
        ctx.strokeStyle='#00ff00'; ctx.globalAlpha=0.07+i*0.04; ctx.lineWidth=0.8; ctx.stroke();
      });
      ctx.globalAlpha=1;

      // Axes
      ctx.strokeStyle='#00ff0015'; ctx.lineWidth=0.5;
      [[CX,CY-R,CX,CY+R],[CX-R,CY,CX+R,CY]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      // Traînée sweep
      for(let i=0;i<60;i++){
        const a=sweep-(i/60)*Math.PI*0.6;
        ctx.beginPath(); ctx.moveTo(CX,CY);
        ctx.arc(CX,CY,R,a-0.05,a+0.05); ctx.closePath();
        ctx.fillStyle=`rgba(0,255,0,${(1-i/60)*0.2})`; ctx.fill();
      }
      // Ligne sweep
      ctx.beginPath(); ctx.moveTo(CX,CY);
      ctx.lineTo(CX+Math.cos(sweep)*R, CY+Math.sin(sweep)*R);
      ctx.strokeStyle='#00ff00'; ctx.lineWidth=1.2; ctx.globalAlpha=0.9; ctx.stroke();
      ctx.globalAlpha=1;

      // Calcul GPS
      const home=getHomeFn();
      const persons=getPersonsFn();
      if(home?.lat && home?.lon) {
        const dists=persons.filter(p=>p.lat&&p.lon).map(p=>geoCalc(home.lat,home.lon,p.lat,p.lon).dist);
        const maxD=Math.max(0.3,...dists)*1.25;
        persons.forEach(p=>{
          if(!p.lat||!p.lon) return;
          const {bearing,dist}=geoCalc(home.lat,home.lon,p.lat,p.lon);
          const cAngle=(bearing-90)*Math.PI/180;
          const pr=Math.min(0.94,dist/maxD)*R;
          const px=CX+Math.cos(cAngle)*pr, py=CY+Math.sin(cAngle)*pr;
          const diff=((sweep-cAngle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
          if(diff<0.13){ pings.push({x:px,y:py,col:p.color||'#00ff00',life:120,name:p.name||''});
          if(onPing) onPing({name:p.name,lat:p.lat,lon:p.lon,color:p.color||'#00ff00',personEid:p.personEid,distanceEid:p.distanceEid,zoomLat:p.zoomLat,zoomLon:p.zoomLon}); }
          // Point statique très discret
          ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2);
          ctx.fillStyle=p.color||'#00ff00'; ctx.globalAlpha=0.25; ctx.fill();
          ctx.globalAlpha=1;
        });
        // Labels distances anneaux
        ctx.fillStyle='#00ff0045'; ctx.font='9px "Courier New"'; ctx.textAlign='center';
        [0.25,0.5,0.75].forEach(r=>{
          const km=(r*maxD).toFixed(1);
          ctx.fillText(`${km}km`,CX,CY-R*r-3);
        });
      }

      // Pings
      pings=pings.filter(b=>b.life>0);
      pings.forEach(b=>{
        const a=b.life/120;
        const ringR=(1-a)*22;
        ctx.beginPath(); ctx.arc(b.x,b.y,ringR,0,Math.PI*2);
        ctx.strokeStyle=b.col; ctx.globalAlpha=a*0.7; ctx.lineWidth=1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2);
        ctx.fillStyle=b.col; ctx.globalAlpha=a; ctx.fill();
        ctx.fillStyle='#fff'; ctx.font=`bold 12px "Courier New"`;
        ctx.textAlign=b.x>CX?'left':'right';
        ctx.globalAlpha=Math.min(1,a*1.4);
        ctx.fillText(b.name, b.x+(b.x>CX?10:-10), b.y-10);
        b.life--;
      });
      ctx.globalAlpha=1;

      // Centre = domicile
      ctx.beginPath(); ctx.arc(CX,CY,4,0,Math.PI*2);
      ctx.fillStyle='#00ff00'; ctx.globalAlpha=0.85; ctx.fill();
      ctx.globalAlpha=1;

      sweep+=0.020; if(sweep>Math.PI*2) sweep-=Math.PI*2;
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

    _renderMapWidget(w, sizeStyle, noBorder=false) {
    const persons = w.persons || [];
    const wid = w._wid || 0;

    // ── Infos personnes (bandeau haut) ──────────────────────────────
    const getSt = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const getObj= (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid] : null;
    const footRows = persons.map(p => {
      const pObj  = getObj(p.person);
      const homeByHA = pObj ? pObj.state === 'home' : false;
      const distRaw2 = parseFloat(this.hass?.states[p.distance_entity]?.state);
      const distNear2 = !isNaN(distRaw2) && distRaw2 < 0.3;
      const home  = homeByHA || distNear2;
      const stLbl = homeByHA ? 'À DOMICILE' : distNear2 ? 'À DOMICILE' :
                    pObj?.state === 'not_home' ? 'ABSENT' :
                    pObj ? pObj.state.toUpperCase() : '--';
      const stCol = home ? '#22c55e' : '#f59e0b';
      const geoRaw2 = getSt(p.geocoded_entity);
      const homeZone2 = this.hass?.states['zone.home'];
      if (!this._homeAddr && homeZone2?.attributes?.latitude) {
        this._homeAddr = 'Chargement…';
        const hLat = homeZone2.attributes.latitude, hLon = homeZone2.attributes.longitude;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${hLat}&lon=${hLon}&format=json`)
          .then(r=>r.json()).then(d=>{
            const a=d.address||{};
            this._homeAddr=[a.house_number,a.road].filter(Boolean).join(' ')
              +', '+(a.postcode||'')+' '+(a.village||a.town||a.city||'');
            this.requestUpdate();
          }).catch(()=>{ this._homeAddr = homeZone2?.attributes?.friendly_name||'Domicile'; });
      }
      const homeAddrFull = (this._homeAddr && this._homeAddr!=='Chargement…') ? this._homeAddr : (homeZone2?.attributes?.friendly_name||'Domicile');
      const geo   = home ? homeAddrFull : geoRaw2;
      const dist  = (() => { const v = parseFloat(this.hass?.states[p.distance_entity]?.state); return isNaN(v) ? null : v; })();
      const loc1  = getSt(p.location_1_entity);
      const pic   = pObj?.attributes?.entity_picture;
      const init  = (p.name||'?')[0].toUpperCase();
      const batV  = parseFloat(this.hass?.states[p.battery_entity]?.state);
      const bat   = isNaN(batV) ? null : batV;
      const batCol= bat==null?'#475569':bat<=20?'#ef4444':bat<=50?'#f59e0b':'#22c55e';
      const wifi  = getSt(p.wifi_entity);
      return html`
        <div style="flex:1;min-width:260px;background:#060d1a;border:1px solid ${stCol}22;border-radius:8px;padding:8px 10px;display:flex;gap:8px;align-items:flex-start;">
          <div style="width:38px;height:38px;border-radius:50%;border:2px solid ${stCol};overflow:hidden;flex-shrink:0;background:#1e2d3d;display:flex;align-items:center;justify-content:center;">
            ${pic ? html`<img src="${pic}" style="width:100%;height:100%;object-fit:cover;"/>` : html`<span style="font-size:15px;font-weight:800;color:${stCol};">${init}</span>`}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:14px;font-weight:900;color:#e2e8f0;">${p.name||''}</span>
              <span style="font-size:11px;font-weight:700;color:${stCol};letter-spacing:1px;">${stLbl}</span>
              ${dist!=null?html`<span style="font-size:11px;color:#818cf8;">📍 ${dist.toFixed(2)} km</span>`:html``}
              ${bat!=null?html`<span style="font-size:11px;color:${batCol};">🔋 ${bat.toFixed(0)}%</span>`:html``}
              ${wifi?html`<span style="font-size:11px;color:#64748b;">📶 ${wifi}</span>`:html``}
            </div>
            ${geo?html`<div style="font-size:11px;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${geo}</div>`:html``}
            ${loc1&&!home?html`<div style="font-size:10px;color:#475569;margin-top:1px;">⏱ ${loc1}</div>`:html``}
          </div>
        </div>`;
    });

    // ── Init carte Leaflet custom ────────────────────────────────────
    setTimeout(() => {
      const mapDiv = this.shadowRoot?.querySelector(`#re-custom-map-${wid}`);
      if (!mapDiv || mapDiv.__mapInited) return;
      mapDiv.__mapInited = true;

      const initMap = (L) => {
        // Injecter CSS Leaflet dans le shadow root (ne traverse pas la frontière shadow DOM)
        if (!this.shadowRoot.querySelector('#re-leaflet-css')) {
          const st = document.createElement('style');
          st.id = 're-leaflet-css';
          st.textContent = `
            .leaflet-container{position:absolute!important;top:0;left:0;right:0;bottom:0;outline:0;background:#0d1117;overflow:hidden;}
            .leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,
            .leaflet-tile-container,.leaflet-pane>svg,.leaflet-pane>canvas,
            .leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0;}
            .leaflet-container .leaflet-marker-pane img,.leaflet-container .leaflet-shadow-pane img,
            .leaflet-container .leaflet-tile-pane img,.leaflet-container img.leaflet-image-layer,
            .leaflet-container .leaflet-tile{max-width:none!important;max-height:none!important;}
            .leaflet-tile{filter:inherit;visibility:hidden;}
            .leaflet-tile-loaded{visibility:inherit;}
            .leaflet-zoom-animated{will-change:transform;transition:transform .25s cubic-bezier(0,0,.25,1);}
            .leaflet-pane{z-index:400;}
            .leaflet-tile-pane{z-index:200;}
            .leaflet-overlay-pane{z-index:400;}
            .leaflet-shadow-pane{z-index:500;}
            .leaflet-marker-pane{z-index:600;}
            .leaflet-popup-pane{z-index:700;}
            .leaflet-map-pane canvas{z-index:100;}
            .leaflet-map-pane svg{z-index:200;}
            .leaflet-control-container .leaflet-top,.leaflet-control-container .leaflet-bottom{position:absolute;z-index:1000;pointer-events:none;}
            .leaflet-control-container .leaflet-bottom{bottom:0;}
            .leaflet-control-container .leaflet-right{right:0;}
            .leaflet-control{position:relative;float:left;pointer-events:auto;}
            .leaflet-right .leaflet-control{float:right;}
            .leaflet-top .leaflet-control{margin-top:10px;}
            .leaflet-bottom .leaflet-control{margin-bottom:10px;}
            .leaflet-left .leaflet-control{margin-left:10px;}
            .leaflet-right .leaflet-control{margin-right:10px;}
            .leaflet-control-zoom{border:1px solid #333;border-radius:4px;overflow:hidden;}
            .leaflet-control-zoom-in,.leaflet-control-zoom-out{display:block;width:26px;height:26px;line-height:26px;text-align:center;font-size:18px;text-decoration:none;color:#fff;background:#1e293b;cursor:pointer;}
            .leaflet-control-zoom-in:hover,.leaflet-control-zoom-out:hover{background:#334155;}
            .leaflet-div-icon{background:transparent;border:none;}
            .leaflet-fade-anim .leaflet-popup{opacity:0;transition:opacity .2s linear;}
            .leaflet-fade-anim .leaflet-map-pane .leaflet-popup{opacity:1;}
          `;
          this.shadowRoot.appendChild(st);
        }
        // Créer la carte Leaflet sur mon propre div
        const map = L.map(mapDiv, { zoomControl:false, attributionControl:false });
        // Tuiles sombres CartoDB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom:19, subdomains:'abcd'
        }).addTo(map);
        L.control.zoom({ position:'bottomright' }).addTo(map);
        mapDiv._leafletMap = map;
        // Laisser le DOM se stabiliser avant de calculer la taille
        requestAnimationFrame(() => {
          map.invalidateSize();
          this._updateMyMapMarkers(map, L, w);
          // Init radar coin haut-droit
          const radarCv = this.shadowRoot?.querySelector(`#re-map-radar-${wid}`);
          if (radarCv) {
            this._startAnim(`map-radar-${wid}`, radarCv, c => this._initMapRadar(c,
              () => (w.persons||[]).map(p => {
                const st = this.hass?.states[p.person];
                return { name:p.name||'', color:p.color||'#00ff00',
                         lat:st?.attributes?.latitude, lon:st?.attributes?.longitude,
                         personEid:p.person, distanceEid:p.distance_entity };
              }),
              () => { const z=this.hass?.states['zone.home']; return z?{lat:z.attributes?.latitude,lon:z.attributes?.longitude}:null; },
              null  // pas de onPing
            ));
          }
        });
      };

      if (window.L) {
        initMap(window.L);
      } else {
        // Charger Leaflet si pas disponible globalement
        if (!document.getElementById('leaflet-css-re')) {
          const lk = document.createElement('link');
          lk.id='leaflet-css-re'; lk.rel='stylesheet';
          lk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(lk);
        }
        const sc = document.createElement('script');
        sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        sc.onload = () => initMap(window.L);
        document.head.appendChild(sc);
      }
    }, 300);

    // ── Boutons personnes ────────────────────────────────────────────
    const personButtons = persons.map(p => {
      const pSt = this.hass?.states[p.person];
      const dV  = parseFloat(this.hass?.states[p.distance_entity]?.state);
      const near= !isNaN(dV) && dV < 0.3;
      const col = (pSt?.state==='home'||near) ? '#22c55e' : '#f59e0b';
      const pic = pSt?.attributes?.entity_picture;
      const init= (p.name||'?')[0].toUpperCase();
      return html`
        <button style="display:flex;align-items:center;gap:7px;background:rgba(5,8,20,0.88);
                       border:1px solid ${col}55;color:${col};font-family:'Courier New',monospace;
                       font-size:12px;font-weight:700;letter-spacing:1px;padding:5px 10px 5px 6px;
                       border-radius:20px;cursor:pointer;"
          @click="${() => this._zoomMyMap(wid, p, w)}">
          <div style="width:24px;height:24px;border-radius:50%;border:2px solid ${col};overflow:hidden;
                       background:#1e2d3d;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${pic?html`<img src="${pic}" style="width:100%;height:100%;object-fit:cover;"/>`
                 :html`<span style="font-size:11px;font-weight:800;color:${col};">${init}</span>`}
          </div>
          ${p.name||'—'}
        </button>`;
    });

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle}padding:0;overflow:hidden;display:flex;flex-direction:column;">
        <div style="flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;padding:8px;background:#0a0f1a;border-bottom:1px solid #1a2744;">
          ${footRows}
        </div>
        <div style="flex:1;min-height:0;position:relative;">
          <div style="position:absolute;top:10px;left:10px;z-index:1000;display:flex;flex-direction:column;gap:6px;pointer-events:all;">
            ${personButtons}
          </div>
          <canvas id="re-map-radar-${wid}" width="160" height="160"
            style="position:absolute;top:12px;right:12px;width:150px;height:150px;
                   border-radius:50%;z-index:1000;pointer-events:none;
                   box-shadow:0 0 0 1px rgba(0,255,0,0.2);"></canvas>
          <div id="re-custom-map-${wid}" style="position:absolute;inset:0;"></div>
        </div>
      </div>`;
  }

  _updateMyMapMarkers(map, L, w) {
    if (!map || !L) return;
    if (!this._myMarkers) this._myMarkers = {};
    const persons = w.persons || [];
    const bounds = [];

    persons.forEach(p => {
      const st  = this.hass?.states[p.person];
      const dV  = parseFloat(this.hass?.states[p.distance_entity]?.state);
      const near= !isNaN(dV) && dV < 0.3;
      const key = p.person;

      let lat, lon;
      if (near && w.home_lat && w.home_lon) {
        lat = parseFloat(w.home_lat); lon = parseFloat(w.home_lon);
      } else if (st?.attributes?.latitude != null) {
        lat = st.attributes.latitude; lon = st.attributes.longitude;
      } else {
        const zone = this.hass?.states['zone.home'];
        lat = zone?.attributes?.latitude; lon = zone?.attributes?.longitude;
      }
      if (!lat || !lon) return;
      bounds.push([lat, lon]);

      const pic    = st?.attributes?.entity_picture;
      const init   = (p.name||'?')[0].toUpperCase();
      const border = (st?.state==='home'||near) ? '#22c55e' : '#f59e0b';
      const img    = pic ? `<img src="${pic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
                         : `<span style="font-size:18px;font-weight:800;color:${border};">${init}</span>`;
      const html2  = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="width:46px;height:46px;border-radius:50%;border:3px solid ${border};overflow:hidden;
                     background:#1e2d3d;display:flex;align-items:center;justify-content:center;
                     box-shadow:0 2px 12px rgba(0,0,0,.9);">${img}</div>
        <div style="margin-top:4px;padding:2px 6px;background:rgba(0,0,0,0.75);border-radius:4px;
                     font-size:11px;font-weight:800;color:#fff;white-space:nowrap;letter-spacing:0.5px;">
          ${p.name||''}
        </div>
      </div>`;
      const icon = L.divIcon({ html:html2, className:'', iconSize:[60,70], iconAnchor:[30,23] });

      if (this._myMarkers[key]) {
        this._myMarkers[key].setLatLng([lat,lon]).setIcon(icon);
      } else {
        this._myMarkers[key] = L.marker([lat,lon],{icon,zIndexOffset:1000}).addTo(map);
      }
    });

    if (bounds.length===1) map.setView(bounds[0], 16);
    else if (bounds.length>1) map.fitBounds(L.latLngBounds(bounds),{padding:[60,60],maxZoom:15});
  }

  _zoomMyMap(wid, p, w) {
    const mapDiv = this.shadowRoot?.querySelector(`#re-custom-map-${wid}`);
    const map = mapDiv?._leafletMap;
    if (!map) return;
    const st   = this.hass?.states[p.person];
    const dV   = parseFloat(this.hass?.states[p.distance_entity]?.state);
    const near = !isNaN(dV) && dV < 0.3;
    let lat, lon;
    if (near && w.home_lat && w.home_lon) {
      lat = parseFloat(w.home_lat); lon = parseFloat(w.home_lon);
    } else {
      lat = st?.attributes?.latitude; lon = st?.attributes?.longitude;
    }
    if (lat && lon) map.setView([lat,lon], near?18:16, {animate:true,duration:0.7});
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

    const renderAppliance = (item, idx) => {
      const st    = this.hass?.states[item.entity];
      const isOn  = st?.state === 'on';
      const cycSt = item.cycle ? this.hass?.states[item.cycle] : null;
      const cyc   = cycSt && !['unavailable','unknown'].includes(cycSt.state) ? cycSt.state : null;
      const col   = isOn ? 'var(--re-wg)' : '#334155';
      const borderCol = isOn ? 'var(--re-wg)30' : '#0f1a0f';
      const unitId = String(idx+1).padStart(3,'0');
      // Puissance pour la barre
      const pwrSt = (item.sensors||[]).map(e=>this.hass?.states[e]).find(s=>s?.attributes?.unit_of_measurement==='W');
      const pwr = pwrSt ? parseFloat(pwrSt.state) : 0;
      const pwrPct = Math.min(100, (pwr/2500)*100);
      const pwrCol = pwr>2000?'var(--re-wr)':pwr>800?'var(--re-wa)':'var(--re-wg)';
      return html`
        <div style="flex:1 1 300px;min-width:280px;background:${isOn?'#030d03':'#050808'};
                    border:1px solid ${borderCol};border-radius:6px;
                    padding:0;display:flex;flex-direction:column;cursor:pointer;
                    position:relative;overflow:hidden;font-family:'Courier New',monospace;"
             @click="${(e)=>{e.stopPropagation();toggle(item.entity);}}">
          ${isOn?html`<div style="position:absolute;left:0;right:0;height:1px;background:#00ff0018;z-index:1;pointer-events:none;animation:_re_scan 4s linear infinite;top:0;"></div>`:html``}
          <div style="position:absolute;top:6px;right:8px;font-size:9px;color:${col}55;letter-spacing:1px;z-index:2;">UNIT-${unitId}</div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px 8px;">
            ${item.img?html`
              <div style="width:56px;height:56px;flex-shrink:0;background:#080808;border:1px solid #0f1a0f;
                           border-radius:4px;overflow:hidden;position:relative;">
                <img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:4px;
                     ${isOn?'':'filter:grayscale(0.8) brightness(0.5);'}"/>
              </div>`:html``}
            <div style="flex:1;min-width:0;padding-right:24px;">
              <div style="font-size:13px;font-weight:900;color:var(--re-wt);letter-spacing:1px;text-transform:uppercase;">
                ${item.name}
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                <div style="width:7px;height:7px;border-radius:50%;background:${col};
                             ${isOn?'animation:_re_pulse 2s ease-in-out infinite;':'opacity:0.4;'}
                             flex-shrink:0;"></div>
                <span style="font-size:11px;font-weight:700;color:${col};letter-spacing:2px;">
                  ${isOn?'EN LIGNE':'HORS LIGNE'}
                </span>
              </div>
              ${cyc?html`<div style="font-size:10px;color:#334155;margin-top:2px;letter-spacing:1px;">
                &gt; ${cyc.toUpperCase()}
              </div>`:html``}
            </div>
          </div>
          ${pwr>0?html`
            <div style="height:2px;background:#0a100a;margin:0 12px;">
              <div style="height:100%;width:${pwrPct}%;background:${pwrCol};transition:width .5s;"></div>
            </div>`:html``}
          <div style="display:flex;flex-wrap:wrap;gap:5px;padding:8px 12px 10px;">
            ${(item.sensors||[]).map(eid => {
              const sst = this.hass?.states[eid];
              if (!sst) return html``;
              const un  = sst.attributes?.unit_of_measurement || '';
              const lbl = (sst.attributes?.friendly_name||eid.split('.').pop()).split(' ').slice(-2).join(' ');
              const val = fmt(sst.state);
              const vCol = un==='W'?(parseFloat(sst.state)>1000?'var(--re-wr)':parseFloat(sst.state)>100?'var(--re-wa)':'var(--re-wg)')
                          : un==='°C'?(parseFloat(sst.state)<-5?'var(--re-wb)':parseFloat(sst.state)>60?'var(--re-wr)':'var(--re-wt)')
                          : 'var(--re-wt)';
              return html`
                <div style="background:#080e08;border:1px solid #0f1a0f;border-radius:3px;padding:4px 8px;min-width:0;">
                  <div style="font-size:9px;color:#2a4a2a;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">${lbl.toUpperCase()}</div>
                  <div style="font-size:14px;font-weight:900;color:${vCol};letter-spacing:0.5px;">${val}<span style="font-size:9px;color:#334155;"> ${un}</span></div>
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
      const batCol  = bat >= 70 ? 'var(--re-wg)' : bat >= 30 ? 'var(--re-wa)' : 'var(--re-wr)';
      const isOn    = !['docked','idle','paused','error'].includes(state);
      const stLbl   = {docked:'EN VEILLE',cleaning:'NETTOYAGE',paused:'EN PAUSE',returning:'RETOUR BASE',idle:'INACTIF',error:'ERREUR'}[state]||state.toUpperCase();
      const stCol   = isOn ? 'var(--re-wp)' : state==='docked' ? 'var(--re-wg)' : 'var(--re-wtd)';
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
      const cBar=(label,v)=>{const col=v<=20?'var(--re-wr)':v<=50?'var(--re-wa)':'var(--re-wg)';return html`<div style="display:grid;grid-template-columns:100px 1fr 38px;align-items:center;gap:6px;"><span style="font-size:12px;color:var(--re-wtd);font-family:'Courier New',monospace;">${label}</span><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${v}%;background:${col};box-shadow:0 0 4px ${col}66;"></div></div><span style="font-size:13px;font-weight:700;color:${col};text-align:right;">${v}%</span></div>`;};
      return html`
        <div style="flex:1;min-width:0;border:1px solid rgba(129,140,248,.2);border-radius:12px;background:rgba(5,10,20,.85);overflow:hidden;display:flex;flex-direction:column;font-family:'Courier New',monospace;">
          <div style="height:2px;background:linear-gradient(90deg,var(--re-wp),var(--re-wg),transparent);"></div>
          <div style="padding:10px 12px 8px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(129,140,248,.1);">
            ${item.img?html`<div style="width:48px;height:48px;flex-shrink:0;background:rgba(0,0,0,.4);border:1px solid rgba(129,140,248,.2);border-radius:8px;overflow:hidden;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:3px;"/></div>`:html``}
            <div style="flex:1;"><div style="font-size:15px;font-weight:700;color:var(--re-wt);">${item.name}</div>${item.subtitle?html`<div style="font-size:13px;color:var(--re-wtd);">${item.subtitle}</div>`:html``}${fw?html`<div style="font-size:12px;color:var(--re-wtd);">// ${fw}</div>`:html``}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
              ${bat!=null?html`<span style="font-size:14px;font-weight:700;color:${batCol};">⚡ ${bat}%</span>`:html``}
              <span style="font-size:13px;font-weight:700;padding:2px 8px;border:1px solid ${stCol}44;color:${stCol};">${stLbl}</span>
              ${stateExt?html`<span style="font-size:12px;color:var(--re-wtd);">${trOpt(stateExt)}</span>`:html``}
            </div>
          </div>
          <div style="flex:1;min-height:0;display:flex;gap:0;">
            <div class="no-scrollbar" style="flex:1;padding:8px 12px;display:flex;flex-direction:column;gap:6px;border-right:1px solid rgba(129,140,248,.08);overflow-y:auto;">
              ${(curRoom||area||dur||fanSpeed)?html`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                ${curRoom?html`<div style="background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.15);border-radius:4px;padding:3px 8px;"><span style="font-size:12px;color:var(--re-wtd);">PIÈCE </span><span style="font-size:14px;color:var(--re-wp);font-weight:700;">${curRoom}</span></div>`:html``}
                ${area?html`<div><span style="font-size:17px;font-weight:800;color:var(--re-wp);">${area}</span><span style="font-size:12px;color:var(--re-wtd);"> m²</span></div>`:html``}
                ${dur?html`<div><span style="font-size:17px;font-weight:800;color:var(--re-wp);">${dur}</span><span style="font-size:12px;color:var(--re-wtd);"> min</span></div>`:html``}
                ${fanSpeed?html`<span style="font-size:12px;padding:2px 7px;border:1px solid #06b6d422;color:#06b6d4;">⚙ ${trOpt(fanSpeed)}</span>`:html``}
              </div>`:html``}
              ${cons.length>0?html`<div><div style="font-size:12px;color:var(--re-wtd);letter-spacing:.8px;margin-bottom:4px;">// CONSOMMABLES</div><div style="display:flex;flex-direction:column;gap:5px;">${cons.map(c=>cBar(c.l,c.v))}</div></div>`:html``}
              ${(sc1St||sc2St)?html`<div><div style="font-size:12px;color:var(--re-wtd);letter-spacing:.8px;margin-bottom:4px;">// RACCOURCIS</div><div style="display:flex;gap:5px;flex-wrap:wrap;">
                ${sc1St?html`<button style="flex:1;padding:6px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.25);color:var(--re-wp);" @click="${(e)=>{e.stopPropagation();callBtn(sc1Eid);}}">⊞ ${sc1Name}</button>`:html``}
                ${sc2St?html`<button style="flex:1;padding:6px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.25);color:var(--re-wp);" @click="${(e)=>{e.stopPropagation();callBtn(sc2Eid);}}">⊞ ${sc2Name}</button>`:html``}
              </div></div>`:html``}
              ${rooms.length>0?html`<div><div style="font-size:12px;color:var(--re-wtd);letter-spacing:.8px;margin-bottom:4px;">// ZONES</div><div style="display:flex;gap:4px;flex-wrap:wrap;">${rooms.map(r=>html`<button style="padding:4px 9px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);color:#06b6d4;" @click="${(e)=>{e.stopPropagation();callVac('send_command',{command:'segment_clean',params:{segments:[r.id||r]}});}}">⊙ ${r.name||r}</button>`)}</div></div>`:html``}
            </div>
            ${camUrl?html`<div style="width:200px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);overflow:hidden;"><img src="${camUrl}" style="max-width:200px;max-height:230px;object-fit:contain;filter:brightness(.85) contrast(1.1);"/></div>`:html``}
          </div>
          <div style="padding:7px 10px;border-top:1px solid rgba(129,140,248,.1);display:flex;flex-wrap:wrap;gap:5px;">
            ${[{l:'▶ DÉMARRER',fn:()=>callVac('start'),col:'var(--re-wg)'},{l:'⏸ PAUSE',fn:()=>callVac('pause'),col:'var(--re-wp)'},{l:'⌂ BASE',fn:()=>callVac('return_to_base'),col:'#06b6d4'},{l:'⊙ LOCALISER',fn:()=>callVac('locate'),col:'var(--re-wa)'},{l:'▣ VIDER BAC',fn:()=>callVac('send_command',{command:'start_wash'}),col:'var(--re-wtd)'}].map(b=>html`<button style="flex:1;min-width:60px;padding:6px 4px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;font-weight:700;cursor:pointer;background:${b.col}12;border:1px solid ${b.col}44;color:${b.col};" @click="${(e)=>{e.stopPropagation();b.fn();}}">${b.l}</button>`)}
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

    const renderItem = (item, idx) => {
      if (item.type === 'robot_vacuum') return renderVacuum(item);
      if (item.type === 'robot_mower')  return renderMower(item);
      if (item.type === 'tool')         return renderTool(item, idx);
      const domain = (item.entity||'').split('.')[0];
      if (domain === 'vacuum')     return renderVacuum(item);
      if (domain === 'lawn_mower') return renderMower(item);
      return renderAppliance(item, idx);
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
          ${items.map((item, idx) => renderItem(item, idx))}
        </div>
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  //  WIDGET MÉTÉO NATIF (porté depuis meteo_ha_ws.html)
  //  Données en direct via this.hass — pas de WebSocket ni token.
  // ═══════════════════════════════════════════════════════════
  _refreshForecast(entityId) {
    // Interrogation PONCTUELLE des prévisions (pas d'abonnement permanent -> aucune saturation WebSocket).
    if (!entityId || !this.hass) return;
    const now = Date.now();
    // Si l'entité change, on force un rafraîchissement immédiat
    if (this._wxFcEntity !== entityId) { this._wxFcEntity = entityId; this._wxFcAt = 0; }
    // Une requête au plus toutes les 30 min, et pas deux en parallèle
    if (this._wxFcBusy) return;
    if (this._wxFcAt && (now - this._wxFcAt) < 1800000) return;
    this._wxFcBusy = true;
    this._wxFcAt = now;   // posé AVANT tout appel -> verrouille pour 30 min, AUCUNE boucle possible
    const useAttr = () => {
      const st = this.hass.states[entityId];
      const att = st && st.attributes ? st.attributes : {};
      if (Array.isArray(att.forecast) && att.forecast.length) {
        this._wxForecast = att.forecast; this.requestUpdate(); return true;
      }
      return false;
    };
    // 1) Beaucoup d'intégrations exposent déjà les prévisions dans les attributs : on tente d'abord.
    if (useAttr()) { this._wxFcBusy = false; return; }
    // 2) Sinon, appel du service via le bus WebSocket avec retour de réponse —
    //    exactement le mécanisme utilisé par Outils de développement > Actions.
    //    (L'ancienne route REST callApi('POST', '...?return_response', ...) pouvait
    //    renvoyer une erreur 400 selon la version/config de HA ; ce chemin est fiable.)
    this.hass.callService('weather', 'get_forecasts', { type: 'daily' }, { entity_id: entityId }, false, true)
      .then(res => {
        const node = res && res.response ? res.response[entityId] : null;
        const fc = node && Array.isArray(node.forecast) ? node.forecast : [];
        if (fc.length) { this._wxForecast = fc; this.requestUpdate(); }
      })
      .catch(() => { /* on garde le verrou 30 min : surtout pas de boucle */ })
      .finally(() => { this._wxFcBusy = false; });
  }

  // Prévisions HORAIRES (pour le bandeau matin/après-midi/soirée du widget Alsace Météo).
  // Même logique anti-boucle (verrou 30 min, une requête à la fois) que _refreshForecast.
  _refreshHourlyForecast(entityId) {
    if (!entityId || !this.hass) return;
    const now = Date.now();
    if (this._wxHFcEntity !== entityId) { this._wxHFcEntity = entityId; this._wxHFcAt = 0; }
    if (this._wxHFcBusy) return;
    if (this._wxHFcAt && (now - this._wxHFcAt) < 1800000) return;
    this._wxHFcBusy = true;
    this._wxHFcAt = now;
    this.hass.callService('weather', 'get_forecasts', { type: 'hourly' }, { entity_id: entityId }, false, true)
      .then(res => {
        const node = res && res.response ? res.response[entityId] : null;
        const fc = node && Array.isArray(node.forecast) ? node.forecast : [];
        if (fc.length) { this._wxHourlyForecast = fc; this.requestUpdate(); }
      })
      .catch(() => { /* verrou 30 min conservé : pas de boucle */ })
      .finally(() => { this._wxHFcBusy = false; });
  }

  // ════════════════════════════════════════════════════════════════
  //  HELPER — animation canvas tracking (évite redémarrages)
  // ════════════════════════════════════════════════════════════════
  _startAnim(key, canvas, initFn) {
    if (!this._animCanvases) this._animCanvases = {};
    if (this._animCanvases[key] === canvas) return;
    if (this._animCanvases[key]?.__anim) this._animCanvases[key].__anim.stop();
    this._animCanvases[key] = canvas;
    initFn(canvas);
  }

  // ════════════════════════════════════════════════════════════════
  //  WIDGET RADAR — Sonar de présence
  // ════════════════════════════════════════════════════════════════
  _initRadar(canvas, peopleFn) {
    if (!canvas || canvas.__anim) return;
    const W=canvas.width, H=canvas.height, CX=W/2, CY=H/2, R=Math.min(W,H)/2-10;
    const ctx=canvas.getContext('2d');
    let sweep=0, blips=[], raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#000a03'; ctx.beginPath(); ctx.arc(CX,CY,R+8,0,Math.PI*2); ctx.fill();
      [0.25,0.5,0.75,1].forEach((r,i)=>{
        ctx.beginPath(); ctx.arc(CX,CY,R*r,0,Math.PI*2);
        ctx.strokeStyle='#00ff00'; ctx.globalAlpha=0.12+i*0.06; ctx.lineWidth=0.8; ctx.stroke();
      });
      ctx.globalAlpha=1;
      [[CX,CY-R,CX,CY+R],[CX-R,CY,CX+R,CY]].forEach(([x1,y1,x2,y2])=>{
        ctx.strokeStyle='#00ff0020'; ctx.lineWidth=0.6;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });
      const TRAIL=Math.PI*0.55;
      for(let i=0;i<50;i++){
        const a=sweep-(i/50)*TRAIL;
        ctx.beginPath(); ctx.moveTo(CX,CY);
        ctx.arc(CX,CY,R,a-0.04,a+0.04); ctx.closePath();
        ctx.fillStyle=`rgba(0,255,0,${(1-i/50)*0.22})`; ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(CX,CY);
      ctx.lineTo(CX+Math.cos(sweep)*R,CY+Math.sin(sweep)*R);
      ctx.strokeStyle='#00ff00'; ctx.globalAlpha=0.9; ctx.lineWidth=1.5; ctx.stroke();
      ctx.globalAlpha=1;
      const people=peopleFn(); const n=Math.max(1,people.length);
      people.forEach((p,i)=>{
        const pAngle=(i/n)*Math.PI*2;
        const maxD=Math.max(1,...people.map(pp=>pp.distance||0));
        const pr=Math.min(0.92,(p.distance||0)/maxD)*R;
        const px=CX+Math.cos(pAngle)*pr, py=CY+Math.sin(pAngle)*pr;
        const diff=((sweep-pAngle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        if(diff<0.18) blips.push({x:px,y:py,col:p.color||'#00ff00',life:80,name:p.name||''});
      });
      blips=blips.filter(b=>b.life>0);
      blips.forEach(b=>{
        const a=b.life/80;
        ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2);
        ctx.fillStyle=b.col; ctx.globalAlpha=a; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x,b.y,9,0,Math.PI*2);
        ctx.strokeStyle=b.col; ctx.globalAlpha=a*0.4; ctx.lineWidth=1; ctx.stroke();
        ctx.globalAlpha=a*0.9; ctx.fillStyle='#fff';
        ctx.font=`bold ${Math.max(10,W*0.042)}px "Courier New"`;
        ctx.textAlign=b.x>CX?'left':'right';
        ctx.fillText(b.name,b.x+(b.x>CX?11:-11),b.y-9); b.life--;
      });
      ctx.globalAlpha=1;
      ctx.beginPath(); ctx.arc(CX,CY,5,0,Math.PI*2);
      ctx.fillStyle='#00ff00'; ctx.fill();
      sweep+=0.025; if(sweep>Math.PI*2) sweep-=Math.PI*2;
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderRadarWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0;
    const sz=parseInt(w.size)||280;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#radar-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`radar-${wid}`,cv,c=>this._initRadar(c,()=>(w.persons||[]).map(p=>{
        const st=this.hass?.states[p.distance_entity];
        return {name:p.name||'',color:p.color||'#00ff00',
                distance:st?parseFloat(st.state)||0:0};
      })));
    },80);
    return html`
      <div style="${sizeStyle}background:#000a03;display:flex;flex-direction:column;align-items:center;
                  gap:10px;padding:14px;${noBorder?'':'border:1px solid #00ff0022;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:12px;letter-spacing:3px;color:#00ff0066;">${w.title.toUpperCase()}</div>`:html``}
        <canvas id="radar-cv-${wid}" width="${sz}" height="${sz}" style="width:${sz}px;height:${sz}px;border-radius:50%;"></canvas>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  //  WIDGET EKG — Tracé cardiaque
  // ════════════════════════════════════════════════════════════════
  _initEkg(canvas, bpmFn, colorFn) {
    if (!canvas||canvas.__anim) return;
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext('2d');
    const buf=new Float32Array(W).fill(0);
    let head=0, t=0, raf;
    const WAVE=[0,0,0.08,0.08,0,-0.12,-0.12,0,1.0,1.15,-0.32,-0.22,0,0.08,0.08,0,0,0,0,0];
    const draw=()=>{
      const bpm=bpmFn()||72; const col=colorFn()||'#00ff00';
      const speed=Math.max(1,Math.round(W*bpm/600));
      for(let s=0;s<speed;s++){
        const cyc=Math.round(W*60/bpm);
        const pos=t%cyc, ws=Math.round(cyc*0.2), wl=WAVE.length;
        let val=0;
        if(pos>=ws&&pos<ws+wl){
          const fi=(pos-ws)/(cyc/wl);
          const i0=Math.floor(fi), i1=Math.min(wl-1,i0+1);
          val=WAVE[i0]+(WAVE[i1]-WAVE[i0])*(fi-i0);
        }
        buf[head%W]=val; head++; t++;
      }
      ctx.fillStyle='rgba(0,10,2,0.12)'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#00ff0012'; ctx.lineWidth=0.5;
      for(let gx=0;gx<W;gx+=50){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
      for(let gy=0;gy<H;gy+=H/5){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
      ctx.strokeStyle=col+'40'; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
      ctx.beginPath();
      for(let i=0;i<W;i++){
        const bx=(head+i)%W, by=H/2-buf[bx]*H*0.38;
        i===0?ctx.moveTo(i,by):ctx.lineTo(i,by);
      }
      ctx.strokeStyle=col; ctx.lineWidth=2; ctx.globalAlpha=0.95;
      ctx.shadowColor=col; ctx.shadowBlur=8; ctx.stroke();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      ctx.fillStyle=col; ctx.font=`bold ${Math.max(13,H*0.22)}px "Courier New"`;
      ctx.textAlign='right'; ctx.globalAlpha=0.85;
      ctx.fillText(`${Math.round(bpm)} BPM`,W-8,H-8); ctx.globalAlpha=1;
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderEkgWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0; const H=parseInt(w.heightPx)||120;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#ekg-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`ekg-${wid}`,cv,c=>this._initEkg(c,
        ()=>{const s=this.hass?.states[w.entity];return s?parseFloat(s.state)||72:w.default_bpm||72;},
        ()=>w.color||'#00ff00'));
    },80);
    return html`
      <div style="${sizeStyle}background:#000a02;display:flex;flex-direction:column;gap:8px;
                  padding:10px;${noBorder?'':'border:1px solid #00ff0022;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:11px;letter-spacing:3px;color:${w.color||'#00ff00'}88;">${w.title.toUpperCase()}</div>`:html``}
        <canvas id="ekg-cv-${wid}" width="600" height="${H}" style="width:100%;height:${H}px;display:block;border-radius:4px;"></canvas>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  //  WIDGET WATER WAVE — Ondulation eau
  // ════════════════════════════════════════════════════════════════
  _initWaterWave(canvas, levelFn, colorFn) {
    if (!canvas||canvas.__anim) return;
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext('2d');
    let t=0, raf;
    const wave1=(x)=>Math.sin((x/W)*Math.PI*4+t*0.04)*(H*0.015);
    const wave2=(x)=>Math.sin((x/W)*Math.PI*7+t*0.07+1)*(H*0.008);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      const pct=Math.max(0,Math.min(100,levelFn()||0));
      const col=colorFn()||'#00aaff';
      const waterY=H*(1-pct/100);
      // Fond
      ctx.fillStyle='#010810'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=col+'22'; ctx.lineWidth=1.5; ctx.strokeRect(1,1,W-2,H-2);
      // Remplissage eau
      ctx.beginPath(); ctx.moveTo(0,H);
      for(let x=0;x<=W;x++) ctx.lineTo(x,waterY+wave1(x)+wave2(x));
      ctx.lineTo(W,H); ctx.closePath();
      const [r,g,b]=[parseInt(col.slice(1,3)||'00',16),parseInt(col.slice(3,5)||'aa',16),parseInt(col.slice(5,7)||'ff',16)];
      const grad=ctx.createLinearGradient(0,waterY,0,H);
      grad.addColorStop(0,`rgba(${r},${g},${b},0.65)`);
      grad.addColorStop(1,`rgba(${r},${g},${b},0.22)`);
      ctx.fillStyle=grad; ctx.fill();
      // Surface vague
      ctx.beginPath();
      for(let x=0;x<=W;x++){
        const y=waterY+wave1(x)+wave2(x);
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=col; ctx.lineWidth=2; ctx.globalAlpha=0.8; ctx.stroke(); ctx.globalAlpha=1;
      // Bulles
      if(pct>5){
        for(let i=0;i<5;i++){
          const bx=((i*W/5+t*0.5+i*60)%W);
          const by=waterY+4+((t*0.7+i*40)%Math.max(1,H-waterY-8));
          ctx.beginPath(); ctx.arc(bx,by,2+i%2,0,Math.PI*2);
          ctx.strokeStyle=col; ctx.globalAlpha=0.18+Math.sin(t*0.1+i)*0.08; ctx.lineWidth=0.8; ctx.stroke(); ctx.globalAlpha=1;
        }
      }
      // % niveau — grand, centré
      const fs=Math.max(16,H*0.28);
      const ty=pct>25?waterY-fs*0.3:Math.min(waterY+fs,H-6);
      ctx.fillStyle='#fff'; ctx.font=`bold ${fs}px "Courier New"`;
      ctx.textAlign='center'; ctx.globalAlpha=0.92;
      ctx.fillText(`${Math.round(pct)}%`,W/2,ty); ctx.globalAlpha=1;
      t++; raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderWaterWaveWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0;
    const H=parseInt(w.heightPx)||200;
    const hasTitle=!!w.title;
    const canH=Math.max(60, H-(hasTitle?42:20));
    const volSt=this.hass?.states[w.volume_entity];
    const vol=volSt?`${parseFloat(volSt.state).toFixed(0)} ${volSt.attributes?.unit_of_measurement||'L'}`:null;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#wave-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`wave-${wid}`,cv,c=>this._initWaterWave(c,
        ()=>{const s=this.hass?.states[w.level_entity];return s?parseFloat(s.state)||0:0;},
        ()=>w.color||'#00aaff'));
    },80);
    return html`
      <div style="${sizeStyle}background:#010810;display:flex;flex-direction:column;gap:6px;
                  padding:10px;overflow:hidden;${noBorder?'':'border:1px solid #00aaff22;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:11px;letter-spacing:3px;color:${w.color||'#00aaff'}88;">${w.title.toUpperCase()}</div>`:html``}
        <div style="display:flex;gap:12px;align-items:center;">
          <canvas id="wave-cv-${wid}" width="1200" height="${canH}"
                  style="flex:1;height:${canH}px;display:block;border-radius:6px;"></canvas>
          ${vol?html`<div style="font-size:22px;font-weight:900;color:${w.color||'#00aaff'};min-width:80px;text-align:right;">${vol}</div>`:html``}
        </div>
      </div>`;
  }

    // ════════════════════════════════════════════════════════════════
  //  WIDGET MATRIX RAIN — Pluie de caractères
  // ════════════════════════════════════════════════════════════════
  _initMatrixRain(canvas, colorFn) {
    if (!canvas||canvas.__anim) return;
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext('2d');
    const COLS=Math.floor(W/14);
    const drops=Array.from({length:COLS},()=>Math.random()*H/14|0);
    const chars='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    let raf;
    const draw=()=>{
      const col=colorFn()||'#00ff00';
      ctx.fillStyle='rgba(0,0,0,0.05)'; ctx.fillRect(0,0,W,H);
      const [r,g,b]=[parseInt(col.slice(1,3)||'00',16),parseInt(col.slice(3,5)||'ff',16),parseInt(col.slice(5,7)||'00',16)];
      ctx.font='bold 13px "Courier New"';
      drops.forEach((y,i)=>{
        const ch=chars[Math.random()*chars.length|0], x=i*14;
        ctx.fillStyle=`rgb(${Math.min(255,r+120)},${Math.min(255,g+120)},${Math.min(255,b+120)})`;
        ctx.fillText(ch,x,y*14);
        ctx.fillStyle=`rgba(${r},${g},${b},0.8)`;
        if(y>1) ctx.fillText(chars[Math.random()*chars.length|0],x,(y-1)*14);
        if(y*14>H&&Math.random()>0.975) drops[i]=0;
        drops[i]++;
      });
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderMatrixRainWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0; const H=parseInt(w.heightPx)||200;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#matrix-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`matrix-${wid}`,cv,c=>this._initMatrixRain(c,()=>w.color||'#00ff00'));
    },80);
    return html`
      <div style="${sizeStyle}background:#000;display:flex;flex-direction:column;
                  overflow:hidden;padding:0;${noBorder?'':'border:1px solid #00ff0022;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:11px;letter-spacing:3px;color:${w.color||'#00ff00'}88;padding:10px 10px 4px;">${w.title.toUpperCase()}</div>`:html``}
        <canvas id="matrix-cv-${wid}" width="600" height="${H}" style="width:100%;height:${H}px;display:block;"></canvas>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  //  WIDGET T-VIRUS — Cellule animée
  // ════════════════════════════════════════════════════════════════
  _initTVirus(canvas, stateFn) {
    if (!canvas||canvas.__anim) return;
    const W=canvas.width, H=canvas.height, CX=W/2, CY=H/2;
    const R=Math.min(W,H)*0.24;
    const ctx=canvas.getContext('2d');
    let t=0, raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      const {color,level}=stateFn();
      const [r,g,b]=[parseInt(color.slice(1,3)||'00',16),parseInt(color.slice(3,5)||'ff',16),parseInt(color.slice(5,7)||'44',16)];
      // Halo externe pulsant
      const pulse=0.12+Math.sin(t*0.04)*0.06;
      ctx.beginPath(); ctx.arc(CX,CY,R*(1.5+Math.sin(t*0.025)*0.08),0,Math.PI*2);
      ctx.strokeStyle=color; ctx.globalAlpha=pulse; ctx.lineWidth=1; ctx.stroke();
      ctx.globalAlpha=1;
      // Corps principal
      const grad=ctx.createRadialGradient(CX-R*0.2,CY-R*0.2,R*0.05,CX,CY,R);
      grad.addColorStop(0,`rgba(${r},${g},${b},0.85)`);
      grad.addColorStop(0.65,`rgba(${r},${g},${b},0.5)`);
      grad.addColorStop(1,`rgba(${r},${g},${b},0.08)`);
      ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2);
      ctx.fillStyle=grad; ctx.fill();
      ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.globalAlpha=0.55; ctx.stroke();
      ctx.globalAlpha=1;
      // Spikes / flagelles (12)
      for(let i=0;i<12;i++){
        const base=(i/12)*Math.PI*2+t*0.018;
        const wob=Math.sin(t*0.06+i*0.9)*0.12;
        const a=base+wob;
        const sLen=R*(0.55+Math.sin(t*0.04+i*0.7)*0.12);
        const x1=CX+Math.cos(a)*R, y1=CY+Math.sin(a)*R;
        const x2=CX+Math.cos(a)*(R+sLen), y2=CY+Math.sin(a)*(R+sLen);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle=color; ctx.lineWidth=1; ctx.globalAlpha=0.65; ctx.stroke();
        ctx.beginPath(); ctx.arc(x2,y2,3.5,0,Math.PI*2);
        ctx.fillStyle=color; ctx.globalAlpha=0.8; ctx.fill();
        ctx.globalAlpha=1;
      }
      // Noyau
      const iGrad=ctx.createRadialGradient(CX,CY,0,CX,CY,R*0.38);
      iGrad.addColorStop(0,'rgba(255,255,255,0.45)');
      iGrad.addColorStop(1,`rgba(${r},${g},${b},0.25)`);
      ctx.beginPath(); ctx.arc(CX,CY,R*0.32,0,Math.PI*2);
      ctx.fillStyle=iGrad; ctx.fill();
      // Chromatine rotative
      ctx.save(); ctx.translate(CX,CY); ctx.rotate(t*0.025);
      for(let i=0;i<3;i++){
        const a=(i/3)*Math.PI*2;
        ctx.beginPath(); ctx.arc(Math.cos(a)*R*0.13,Math.sin(a)*R*0.13,R*0.075,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},0.55)`; ctx.fill();
      }
      ctx.restore();
      // Texte état
      ctx.fillStyle='#fff'; ctx.font=`bold ${Math.max(11,W*0.065)}px "Courier New"`;
      ctx.textAlign='center'; ctx.globalAlpha=0.88;
      ctx.fillText(level,CX,H-10); ctx.globalAlpha=1;
      t++; raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderTVirusWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0;
    const getState=()=>{
      const fv=(eid)=>{const s=this.hass?.states[eid];return s?parseFloat(s.state)||null:null;};
      const ph=fv(w.ph_entity),orp=fv(w.orp_entity),salt=fv(w.salt_entity);
      const issues=[];
      if(ph!=null&&(ph<7.0||ph>7.6)) issues.push(`pH ${ph.toFixed(1)}`);
      if(orp!=null&&(orp<650||orp>800)) issues.push(`ORP ${Math.round(orp)}`);
      if(salt!=null&&(salt<300||salt>500)) issues.push(`SEL ${Math.round(salt)}`);
      if(issues.length===0) return {color:'#00ff44',level:'STABLE'};
      if(issues.length===1) return {color:'#ffaa00',level:issues[0]};
      return {color:'#ff3300',level:'ALERTE'};
    };
    const sz=parseInt(w.size)||220;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#tvirus-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`tvirus-${wid}`,cv,c=>this._initTVirus(c,getState));
    },80);
    return html`
      <div style="${sizeStyle}background:#03000a;display:flex;flex-direction:column;align-items:center;
                  gap:8px;padding:12px;${noBorder?'':'border:1px solid #ff000022;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:11px;letter-spacing:3px;color:#ff330066;">${w.title.toUpperCase()}</div>`:html``}
        <canvas id="tvirus-cv-${wid}" width="${sz}" height="${sz}" style="width:${sz}px;height:${sz}px;display:block;"></canvas>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  //  WIDGET GAUGE ARC — Jauges semi-circulaires
  // ════════════════════════════════════════════════════════════════
  _initGaugeArc(canvas, gaugesFn) {
    if (!canvas||canvas.__anim) return;
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext('2d');
    let needles={}, t=0, raf;
    const S=Math.PI*0.75, E=Math.PI*2.25, RANGE=E-S;
    const drawOne=(cx,cy,R,g,idx)=>{
      const pct=Math.max(0,Math.min(100,((g.value||0)-g.min)/(g.max-g.min)*100));
      ctx.beginPath(); ctx.arc(cx,cy,R,S,E);
      ctx.strokeStyle='#ffffff18'; ctx.lineWidth=R*0.17; ctx.lineCap='round'; ctx.stroke();
      if(pct>0){
        const endA=S+(pct/100)*RANGE;
        const aGrad=ctx.createLinearGradient(cx-R,cy,cx+R,cy);
        aGrad.addColorStop(0,'#22c55e'); aGrad.addColorStop(0.5,'#eab308'); aGrad.addColorStop(1,'#ef4444');
        ctx.beginPath(); ctx.arc(cx,cy,R,S,endA);
        ctx.strokeStyle=aGrad; ctx.lineWidth=R*0.17; ctx.lineCap='round'; ctx.stroke();
      }
      for(let i=0;i<=10;i++){
        const a=S+(i/10)*RANGE;
        const inner=R*(i%5===0?0.74:0.84);
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);
        ctx.lineTo(cx+Math.cos(a)*(R*0.65),cy+Math.sin(a)*(R*0.65));
        ctx.strokeStyle='#ffffff35'; ctx.lineWidth=i%5===0?1.5:0.7; ctx.lineCap='butt'; ctx.stroke();
      }
      if(!needles[idx]) needles[idx]={cur:S};
      const target=S+(pct/100)*RANGE;
      needles[idx].cur+=(target-needles[idx].cur)*0.07;
      const na=needles[idx].cur;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(na)*R*0.72,cy+Math.sin(na)*R*0.72);
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,R*0.07,0,Math.PI*2);
      ctx.fillStyle='#fff'; ctx.fill();
      ctx.fillStyle='#fff'; ctx.textAlign='center';
      ctx.font=`bold ${Math.max(12,R*0.3)}px "Courier New"`;
      ctx.fillText(`${Math.round(g.value||0)}${g.unit||''}`,cx,cy+R*0.18);
      ctx.font=`${Math.max(9,R*0.17)}px "Courier New"`;
      ctx.fillStyle='#ffffff88';
      ctx.fillText((g.label||'').toUpperCase(),cx,cy+R*0.48);
    };
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#050505'; ctx.fillRect(0,0,W,H);
      const gauges=gaugesFn(); const n=Math.max(1,gauges.length);
      const R=Math.min(W/(n*2.2),H*0.44);
      const topY=H*0.54;
      gauges.forEach((g,i)=>drawOne((i+0.5)*(W/n),topY,R,g,i));
      t++; raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderGaugeArcWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0; const H=parseInt(w.heightPx)||180;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#gauge-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`gauge-${wid}`,cv,c=>this._initGaugeArc(c,()=>(w.gauges||[]).map(g=>{
        const s=this.hass?.states[g.entity];
        return {label:g.label||'',min:parseFloat(g.min)||0,max:parseFloat(g.max)||100,
                unit:g.unit||'%',value:s?parseFloat(s.state)||0:0};
      })));
    },80);
    return html`
      <div style="${sizeStyle}background:#050505;display:flex;flex-direction:column;gap:8px;
                  padding:10px;${noBorder?'':'border:1px solid #ffffff11;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:11px;letter-spacing:3px;color:#ffffff44;">${w.title.toUpperCase()}</div>`:html``}
        <canvas id="gauge-cv-${wid}" width="600" height="${H}" style="width:100%;height:${H}px;display:block;"></canvas>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════
  //  WIDGET OSCILLOSCOPE — Courbe puissance live
  // ════════════════════════════════════════════════════════════════
  _initOscilloscope(canvas, valueFn, opts) {
    if (!canvas||canvas.__anim) return;
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext('2d');
    const buf=new Float32Array(W).fill(0.5);
    let head=0, raf;
    const draw=()=>{
      const val=valueFn()||0;
      const col=opts.color||'#00ff00';
      const minV=opts.min??-3000, maxV=opts.max??3000;
      buf[head%W]=Math.max(0,Math.min(1,(val-minV)/(maxV-minV)));
      head++;
      ctx.fillStyle='rgba(0,6,0,0.12)'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#00ff0012'; ctx.lineWidth=0.5;
      for(let gx=0;gx<W;gx+=50){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
      for(let gy=0;gy<H;gy+=H/6){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
      const zY=H*(1-(0-minV)/(maxV-minV));
      ctx.strokeStyle=col+'30'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,zY); ctx.lineTo(W,zY); ctx.stroke();
      const h=head;
      ctx.beginPath();
      for(let i=0;i<W;i++){
        const bx=(h+i)%W, by=H-buf[bx]*H;
        i===0?ctx.moveTo(i,by):ctx.lineTo(i,by);
      }
      ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.globalAlpha=0.92;
      ctx.shadowColor=col; ctx.shadowBlur=7; ctx.stroke();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      ctx.fillStyle=col; ctx.font=`bold ${Math.max(13,H*0.17)}px "Courier New"`;
      ctx.textAlign='left'; ctx.globalAlpha=0.88;
      ctx.fillText(`${val>=0?'+':''}${Math.round(val)} ${opts.unit||'W'}`,8,H-8);
      ctx.textAlign='right'; ctx.font=`${Math.max(9,H*0.1)}px "Courier New"`;
      ctx.fillStyle=col+'88';
      [[maxV,4],[0,zY+4],[minV,H-2]].forEach(([v,y])=>ctx.fillText(`${v>0?'+':''}${Math.round(v)}`,W-4,y));
      ctx.globalAlpha=1;
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__anim={stop:()=>cancelAnimationFrame(raf)};
  }

  _renderOscilloscopeWidget(w, sizeStyle, noBorder) {
    const wid=w._wid||0; const H=parseInt(w.heightPx)||140;
    setTimeout(()=>{
      const cv=this.shadowRoot?.querySelector(`#oscillo-cv-${wid}`);
      if(!cv) return;
      this._startAnim(`oscillo-${wid}`,cv,c=>this._initOscilloscope(c,
        ()=>{const s=this.hass?.states[w.entity];return s?parseFloat(s.state)||0:0;},
        {color:w.color||'#00ff00',min:parseFloat(w.min??-3000),max:parseFloat(w.max??3000),unit:w.unit||'W'}));
    },80);
    return html`
      <div style="${sizeStyle}background:#000600;display:flex;flex-direction:column;gap:8px;
                  padding:10px;${noBorder?'':'border:1px solid #00ff0022;border-radius:12px;'}">
        ${w.title?html`<div style="font-size:11px;letter-spacing:3px;color:${w.color||'#00ff00'}88;">${w.title.toUpperCase()}</div>`:html``}
        <canvas id="oscillo-cv-${wid}" width="600" height="${H}" style="width:100%;height:${H}px;display:block;border-radius:4px;"></canvas>
      </div>`;
  }

    // ═══════════════════════════════════════════════════════════════════════
  //  WIDGET POWER CELL — tubes ADN style Umbrella Corp (batteries)
  // ═══════════════════════════════════════════════════════════════════════
  _initPcell(canvas, socFn, colorFn) {
    if (!canvas || canvas.__pcell) return;
    const W = canvas.width, H = canvas.height;
    const sX = W/150, sY = H/410;
    const ctx = canvas.getContext('2d');
    let animT = 0, raf;

    // Arrondi compatible tous navigateurs
    const rr = (x,y,w,h,r) => {
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(x,y,w,h,r); return; }
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
      ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
      ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    };

    const TTOP=76, TBOT=344, TH=TBOT-TTOP, CX=75, AMP=28, PER=50, STEPS=200;

    const drawTube = () => {
      // Capuchon haut
      ctx.fillStyle='#1a1a35'; rr(6*sX,36*sY,138*sX,16*sY,4*sX); ctx.fill();
      ctx.fillStyle='#2e2e58'; rr(14*sX,40*sY,122*sX,36*sY,8*sX); ctx.fill();
      ctx.fillStyle='#10102a'; rr(19*sX,44*sY,112*sX,28*sY,6*sX); ctx.fill();
      ctx.fillStyle='#1a1a35'; rr(14*sX,68*sY,122*sX,8*sY,2*sX); ctx.fill();
      // Corps tube
      const gm = ctx.createLinearGradient(14*sX,0,136*sX,0);
      gm.addColorStop(0,'#0d0d1f'); gm.addColorStop(0.2,'#2a2a4a');
      gm.addColorStop(0.4,'#5555a0'); gm.addColorStop(0.5,'#8080c0');
      gm.addColorStop(0.6,'#5555a0'); gm.addColorStop(0.8,'#2a2a4a');
      gm.addColorStop(1,'#0d0d1f');
      ctx.fillStyle=gm; rr(14*sX,72*sY,122*sX,272*sY,10*sX); ctx.fill();
      // Verre intérieur
      ctx.fillStyle='#06060f'; rr(24*sX,76*sY,102*sX,268*sY,4*sX); ctx.fill();
      // Graduation
      ctx.strokeStyle='#00ccff'; ctx.globalAlpha=0.35; ctx.lineWidth=0.8*sX;
      [[90,9],[124,6],[158,9],[192,6],[226,9],[260,6],[294,9],[340,9]].forEach(([y,l])=>{
        ctx.beginPath(); ctx.moveTo(24*sX,y*sY); ctx.lineTo((24+l)*sX,y*sY); ctx.stroke();
      });
      ctx.fillStyle='#00ccff'; ctx.font=`${Math.max(7,7*sY)}px "Courier New"`;
      ctx.textAlign='right';
      [['100',93],['75',161],['50',229],['25',297],['0',343]].forEach(([t,y])=>{
        ctx.fillText(t, 23*sX, y*sY);
      });
      ctx.globalAlpha=1;
      // Socle bas
      ctx.fillStyle='#2e2e58'; rr(14*sX,340*sY,122*sX,30*sY,10*sX); ctx.fill();
      ctx.fillStyle='#10102a'; rr(19*sX,344*sY,112*sX,22*sY,6*sX); ctx.fill();
      ctx.fillStyle='#1a1a35'; rr(8*sX,358*sY,134*sX,14*sY,4*sX); ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      drawTube();
      const pct = Math.max(0, Math.min(100, socFn()));
      const col = colorFn(pct);
      const thY = (TBOT - (pct/100)*TH)*sY;
      const ph  = animT * 0.022;
      // Clip ADN à la zone verre
      ctx.save();
      rr(24*sX,76*sY,102*sX,268*sY,4*sX); ctx.clip();
      for (let s=0; s<2; s++) {
        const off = s===1 ? Math.PI : 0;
        for (let i=0; i<STEPS; i++) {
          const t1=i/STEPS, t2=(i+1)/STEPS;
          const y1=(TTOP+t1*TH)*sY, y2=(TTOP+t2*TH)*sY;
          const a1=(t1*TH/PER)*Math.PI*2+ph+off, a2=(t2*TH/PER)*Math.PI*2+ph+off;
          const x1=(CX+Math.sin(a1)*AMP)*sX, x2=(CX+Math.sin(a2)*AMP)*sX;
          const lit=(y1+y2)/2>=thY;
          if (lit) {
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
            ctx.lineWidth=12*sX; ctx.strokeStyle=col.glo; ctx.globalAlpha=0.1; ctx.lineCap='round'; ctx.stroke();
          }
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
          ctx.lineWidth=(lit?6:3.5)*sX; ctx.strokeStyle=lit?col.lit:col.dim;
          ctx.globalAlpha=lit?0.92:0.2; ctx.lineCap='round'; ctx.stroke();
          if (lit) {
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
            ctx.lineWidth=1.6*sX; ctx.strokeStyle='white'; ctx.globalAlpha=0.45; ctx.stroke();
          }
        }
      }
      ctx.restore();
      // Reflet verre
      ctx.globalAlpha=1;
      const gs=ctx.createLinearGradient(24*sX,0,126*sX,0);
      gs.addColorStop(0,'rgba(255,255,255,0.09)'); gs.addColorStop(0.2,'rgba(255,255,255,0.01)');
      gs.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gs; rr(24*sX,76*sY,102*sX,268*sY,4*sX); ctx.fill();
      animT++; raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.__pcell={ stop:()=>cancelAnimationFrame(raf) };
  }

  _renderPowerCellWidget(w, sizeStyle, noBorder) {
    const cells = w.cells || [];
    const hass = this.hass;
    const st = (eid) => eid ? hass?.states[eid] : null;
    const fv = (eid) => { const s=st(eid); if(!s) return null; const v=parseFloat(s.state); return isNaN(v)?null:v; };
    const pcCol = (pct) => {
      if (pct > 50) return { lit:'#00eeff', glo:'#00aaff', dim:'#003344' };
      if (pct > 20) return { lit:'#ffdd00', glo:'#ff8800', dim:'#332200' };
      return               { lit:'#ff5500', glo:'#cc0000', dim:'#2a0500' };
    };
    const wid = w._wid || 0;
    setTimeout(() => {
      if (!this._pcellCanvases) this._pcellCanvases = {};
      cells.forEach((cell, idx) => {
        const canvas = this.shadowRoot?.querySelector(`#pcell-${idx}-${wid}`);
        if (!canvas) return;
        const key = `${idx}-${wid}`;
        // Même élément DOM → animation déjà active, on ne touche pas
        if (this._pcellCanvases[key] === canvas) return;
        // Nouvel élément → arrêter l'ancien RAF si existant et démarrer un nouveau
        if (this._pcellCanvases[key]?.__pcell) this._pcellCanvases[key].__pcell.stop();
        this._pcellCanvases[key] = canvas;
        const socFn = () => fv(cell.soc_entity) ?? 0;
        this._initPcell(canvas, socFn, pcCol);
      });
    }, 80);
    return html`
      <div style="${sizeStyle}background:#050505;display:flex;flex-direction:column;
                  gap:10px;padding:12px;overflow:hidden;${noBorder?'':'border:1px solid #00ff0022;border-radius:12px;'}">
        ${w.title ? html`<div style="font-size:11px;letter-spacing:3px;color:#00ff0066;
            text-align:center;border-bottom:1px solid #00ff0018;padding-bottom:8px;">
            ${w.title.toUpperCase()}</div>` : html``}
        <div style="display:flex;gap:10px;flex:1;align-items:stretch;">
          ${cells.map((cell, idx) => {
            const soc     = fv(cell.soc_entity);
            const power   = fv(cell.power_entity);
            const temp    = fv(cell.temp_entity);
            const stored  = fv(cell.stored_entity);
            const storedU = (cell.stored_unit||'').toLowerCase()==='kwh' ? 'kWh' : 'Wh';
            const storedV = stored!=null ? (storedU==='kWh' ? stored.toFixed(2)+' kWh' : Math.round(stored)+' Wh') : '--';
            const capWh   = parseFloat(cell.capacity_wh) || null;
            const socPct  = soc ?? 0;
            const col     = pcCol(socPct);
            const userCol = cell.color || col.lit;
            const charging    = power != null && power < 0;
            const discharging = power != null && power > 0;
            const pwrAbs = power != null ? Math.abs(power).toFixed(0) : '--';
            const pwrDir = charging ? '▼ CHARGE' : discharging ? '▲ DÉCHARGE' : '◉ STABLE';
            const pwrCol = charging ? '#22c55e' : discharging ? '#f97316' : '#64748b';
            const statusTxt = soc==null?'HORS LIGNE':soc>50?'NOMINAL':soc>20?'FAIBLE':'CRITIQUE';
            const statusCol = soc==null?'#ef4444':soc>50?'#22c55e':soc>20?'#f59e0b':'#ef4444';
            return html`
              <div style="flex:1;display:flex;gap:10px;background:#080e0e;border:1px solid ${userCol}22;
                          border-radius:10px;padding:12px;min-width:0;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0;">
                  <canvas id="pcell-${idx}-${wid}" width="150" height="410"
                          style="width:100px;height:273px;display:block;"></canvas>
                  <div style="font-size:22px;font-weight:900;color:${col.lit};
                               text-shadow:0 0 12px ${col.glo};letter-spacing:2px;">
                    ${soc!=null ? Math.round(soc)+'%' : '--'}</div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;padding-top:4px;">
                  <div style="font-size:14px;font-weight:900;color:${userCol};letter-spacing:2px;
                               text-shadow:0 0 8px ${userCol}88;white-space:nowrap;overflow:hidden;
                               text-overflow:ellipsis;">${(cell.name||'BATTERIE').toUpperCase()}</div>
                  <div style="font-size:12px;color:${statusCol};letter-spacing:1px;font-weight:700;">${statusTxt}</div>
                  <div style="background:#0d1a0d;border-radius:4px;height:8px;overflow:hidden;">
                    <div style="height:100%;width:${socPct}%;background:linear-gradient(90deg,${col.dim},${col.lit});
                                border-radius:4px;transition:width .8s;"></div>
                  </div>
                  <div style="background:#050d05;border-radius:8px;padding:10px 12px;">
                    <div style="font-size:12px;color:#ffffff;letter-spacing:1px;margin-bottom:4px;">PUISSANCE</div>
                    <div style="font-size:13px;color:${pwrCol};letter-spacing:1px;font-weight:700;">${pwrDir}</div>
                    <div style="font-size:26px;font-weight:900;color:${power!=null?pwrCol:'#64748b'};
                                 line-height:1.1;">${pwrAbs}<span style="font-size:14px;color:#ffffff;"> W</span></div>
                  </div>
                  ${stored!=null ? html`
                  <div style="background:#05090d;border-radius:8px;padding:10px 12px;">
                    <div style="font-size:12px;color:#ffffff;letter-spacing:1px;margin-bottom:3px;">STOCKÉ</div>
                    <div style="font-size:20px;font-weight:900;color:#00ccff;">${storedV}</div>
                    ${capWh ? html`<div style="font-size:12px;color:#e2e8f0;margin-top:2px;">/ ${capWh<2000?capWh+' Wh':(capWh/1000).toFixed(1)+' kWh'} max</div>` : html``}
                  </div>` : html``}
                  ${temp!=null ? html`
                  <div style="display:flex;align-items:center;gap:8px;background:#080808;
                               border-radius:8px;padding:9px 12px;">
                    <span style="font-size:16px;">🌡</span>
                    <span style="font-size:22px;font-weight:900;color:${temp>45?'#ef4444':temp>35?'#f59e0b':'#22d3ee'};">
                      ${temp.toFixed(1)}</span>
                    <span style="font-size:14px;color:#ffffff;">°C</span>
                  </div>` : html``}
                </div>
              </div>`;
          })}
        </div>
      </div>`;
  }

  
  // ── Chargement dynamique du contour d'un département français (code INSEE 01-976).
  //    GeoJSON source : gregoiredavid/france-geojson (MIT license, fichier allégé).
  //    Le résultat (path SVG normalisé 0..1 + bbox + aspect) est mis en cache sur
  //    l'instance. Un seul fetch pour toute la session (fichier partagé 96 depts).
  _refreshDepartmentPath(code) {
    if (!code || code === 'alsace') return;
    if (!this._deptPaths)   this._deptPaths   = {};
    if (!this._deptLoading) this._deptLoading = {};
    if (this._deptPaths[code] || this._deptLoading[code]) return;
    this._deptLoading[code] = true;

    const GEO_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson';

    const processJson = (json) => {
      const feature = json.features.find(f => f.properties.code === String(code).padStart(2,'0') || f.properties.code === String(code));
      if (!feature) { console.warn('RE2: département introuvable:', code); return; }

      const geom = feature.geometry;
      let ring = [];
      if (geom.type === 'Polygon') {
        ring = geom.coordinates[0];
      } else if (geom.type === 'MultiPolygon') {
        // Prendre le plus grand polygone (surface max)
        geom.coordinates.forEach(poly => { if (poly[0].length > ring.length) ring = poly[0]; });
      }
      if (!ring.length) return;

      // Bbox
      let lonMin=Infinity,lonMax=-Infinity,latMin=Infinity,latMax=-Infinity;
      ring.forEach(([lo,la]) => {
        if(lo<lonMin)lonMin=lo; if(lo>lonMax)lonMax=lo;
        if(la<latMin)latMin=la; if(la>latMax)latMax=la;
      });
      const dLon=lonMax-lonMin, dLat=latMax-latMin;
      const latMid=(latMin+latMax)/2;
      const aspect=(dLon*Math.cos(latMid*Math.PI/180))/dLat;

      // Path SVG normalisé 0..1
      const pts = ring.map(([lo,la]) =>
        `${((lo-lonMin)/dLon).toFixed(4)} ${(1-(la-latMin)/dLat).toFixed(4)}`);
      const path = 'M ' + pts.join(' L ') + ' Z';

      this._deptPaths[code] = { path, aspect, lonMin, lonMax, latMin, latMax,
                                 name: feature.properties.nom };
      this._deptLoading[code] = false;
      this.requestUpdate();
    };

    if (this._geoJsonCache) {
      processJson(this._geoJsonCache);
    } else {
      fetch(GEO_URL)
        .then(r => r.json())
        .then(json => { this._geoJsonCache = json; processJson(json); })
        .catch(e => { console.warn('RE2: erreur chargement GeoJSON départements:', e); this._deptLoading[code]=false; });
    }
  }

  _initWeatherSky(canvas, animated) {
    if (!canvas) return null;
    if (canvas.__sky) return canvas.__sky;
    const ctx = canvas.getContext('2d');
    const S = { W: 680, H: 500, scene: 'cloud', tick: 0, drops: [], flakes: [], sparkles: [], clouds: [], stars: [], raf: null, animated: animated !== false, half: 0 };

    function resize() { S.W = canvas.width = canvas.offsetWidth || 680; S.H = canvas.height = canvas.offsetHeight || 500; }

    function drawBg(s) {
      let g = ctx.createLinearGradient(0, 0, 0, S.H);
      const stops = {
        sun:    [[0,'#0a4a9e'],[.35,'#1565c8'],[.65,'#2e86e8'],[.85,'#64b5f6'],[1,'#b3dff5']],
        cloud:  [[0,'#1a3a6e'],[.4,'#2a5298'],[.7,'#4a7cc4'],[1,'#8fa5c8']],
        over:   [[0,'#1a202e'],[.4,'#252e42'],[.7,'#334060'],[1,'#6a7e9e']],
        rain:   [[0,'#080e1a'],[.4,'#0e1830'],[.7,'#1a3050'],[1,'#3a5878']],
        storm:  [[0,'#040208'],[.4,'#0c0820'],[.7,'#160e38'],[1,'#261848']],
        snow:   [[0,'#1a2a48'],[.4,'#2a3e6a'],[.7,'#6688be'],[1,'#c8dcea']],
        fog:    [[0,'#1a2028'],[.4,'#404e62'],[.7,'#7e96a8'],[1,'#bcccd8']],
        night:  [[0,'#000308'],[.4,'#020818'],[.7,'#050f2a'],[1,'#0a1030']],
        sunrise:[[0,'#0d1a3a'],[.3,'#2a3c7a'],[.55,'#9a5a7a'],[.75,'#d4784a'],[.9,'#f0a040'],[1,'#f8d060']],
        sunset: [[0,'#0a0e28'],[.3,'#2a1e5a'],[.55,'#8a3050'],[.75,'#c45030'],[.9,'#e87828'],[1,'#f8d060']],
      };
      (stops[s] || [[0,'#07101e'],[1,'#1a2a4a']]).forEach(st => g.addColorStop(st[0], st[1]));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.H);
    }
    function makeStars() { S.stars = []; for (let i=0;i<120;i++) S.stars.push({x:Math.random()*S.W,y:Math.random()*S.H*.7,r:Math.random()*1.5+.3,ph:Math.random()*Math.PI*2,spd:.02+Math.random()*.04}); }
    function drawStars() { S.stars.forEach(s=>{const o=.2+.6*Math.max(0,Math.sin(S.tick*s.spd+s.ph));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${o.toFixed(2)})`;ctx.fill();}); }
    function drawMoon() {
      const mx=S.W*.15,my=S.H*.18;
      let mg=ctx.createRadialGradient(mx,my,0,mx,my,45);
      mg.addColorStop(0,'rgba(255,248,220,.95)');mg.addColorStop(.6,'rgba(255,240,180,.7)');mg.addColorStop(1,'rgba(255,220,120,0)');
      ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,45,0,Math.PI*2);ctx.fill();
      let halo=ctx.createRadialGradient(mx,my,30,mx,my,90);
      halo.addColorStop(0,'rgba(255,240,150,.12)');halo.addColorStop(1,'transparent');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(mx,my,90,0,Math.PI*2);ctx.fill();
    }
    function drawSun() {
      const cx=S.W*.85,cy=-30;
      let halo=ctx.createRadialGradient(cx,cy,0,cx,cy,320);
      halo.addColorStop(0,'rgba(255,230,80,.45)');halo.addColorStop(.3,'rgba(255,180,50,.2)');halo.addColorStop(.6,'rgba(255,140,0,.08)');halo.addColorStop(1,'transparent');
      ctx.fillStyle=halo;ctx.fillRect(0,0,S.W,S.H);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(S.tick*.003);
      for(let i=0;i<24;i++){const a=(i/24)*Math.PI*2;const gr=ctx.createLinearGradient(0,0,Math.cos(a)*300,Math.sin(a)*300);gr.addColorStop(0,'rgba(255,240,100,.3)');gr.addColorStop(1,'transparent');ctx.strokeStyle=gr;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*300,Math.sin(a)*300);ctx.stroke();}
      ctx.restore();
      let disc=ctx.createRadialGradient(cx,cy,0,cx,cy,90);
      disc.addColorStop(0,'rgba(255,255,210,.95)');disc.addColorStop(.5,'rgba(255,230,80,.8)');disc.addColorStop(1,'transparent');
      ctx.fillStyle=disc;ctx.beginPath();ctx.arc(cx,cy,90,0,Math.PI*2);ctx.fill();
      S.sparkles.forEach(p=>{const sv=Math.sin(S.tick*p.spd+p.ph),o=p.op*(.1+.9*Math.max(0,sv)),r=p.r*(.5+.7*Math.max(0,sv));ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=`rgba(255,240,100,${o.toFixed(2)})`;ctx.fill();});
    }
    function cloudPuff(cx,cy,r,light,alpha){const g=ctx.createRadialGradient(cx,cy-r*.1,r*.05,cx,cy,r);g.addColorStop(0,`rgba(${light},${alpha})`);g.addColorStop(.6,`rgba(${light},${(alpha*.6).toFixed(2)})`);g.addColorStop(1,`rgba(${light},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();}
    function drawOneCloud(x,y,sc,dark){
      const col=dark?'130,145,175':'230,242,255',shad=dark?'70,80,105':'150,175,210';
      cloudPuff(x,y+10*sc,55*sc,shad,.4);cloudPuff(x+70*sc,y+12*sc,42*sc,shad,.3);
      cloudPuff(x+35*sc,y+8*sc,58*sc,col,.92);cloudPuff(x,y,48*sc,col,.88);cloudPuff(x+75*sc,y+2*sc,38*sc,col,.82);
      cloudPuff(x+22*sc,y-25*sc,38*sc,col,.9);cloudPuff(x+55*sc,y-18*sc,32*sc,col,.85);
      cloudPuff(x-15*sc,y-8*sc,28*sc,col,.75);cloudPuff(x+90*sc,y-5*sc,25*sc,col,.7);
      cloudPuff(x+32*sc,y-10*sc,20*sc,'255,255,255',dark?.12:.4);
    }
    function makeClouds(s){S.clouds=[];const n=s==='over'?8:s==='storm'?6:s==='cloud'?5:s==='rain'?6:s==='fog'?4:0,dark=['over','storm','rain','fog'].includes(s);for(let i=0;i<n;i++)S.clouds.push({x:Math.random()*(S.W+600)-600,y:20+Math.random()*(S.H*.38),sc:.5+Math.random()*.8,spd:.18+Math.random()*.28,dark});}
    function drawClouds(){S.clouds.forEach(c=>{c.x+=c.spd;if(c.x>S.W+150){c.x=-600;c.y=20+Math.random()*(S.H*.38);}drawOneCloud(c.x,c.y,c.sc,c.dark);});}
    function makeDrops(n){S.drops=[];for(let i=0;i<n;i++)S.drops.push({x:Math.random()*S.W*1.3,y:Math.random()*S.H,len:8+Math.random()*22,spd:6+Math.random()*10,op:.3+Math.random()*.5,w:.5+Math.random()*1.5});}
    function drawRain(storm){const ang=12*Math.PI/180,sa=Math.sin(ang),ca=Math.cos(ang);if(storm){const t=S.tick%220;if(t<3||(t>7&&t<10)){ctx.fillStyle='rgba(200,220,255,.3)';ctx.fillRect(0,0,S.W,S.H);}}S.drops.forEach(p=>{ctx.strokeStyle=`rgba(180,220,255,${p.op})`;ctx.lineWidth=p.w;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+sa*p.len,p.y+ca*p.len);ctx.stroke();p.y+=p.spd;p.x+=p.spd*.22;if(p.y>S.H+40){p.y=-60;p.x=Math.random()*S.W*1.3;}});}
    function makeFlakes(){S.flakes=[];for(let i=0;i<100;i++)S.flakes.push({x:Math.random()*S.W,y:Math.random()*S.H,r:1+Math.random()*5,spd:.3+Math.random()*1.2,dx:Math.random()*.5-.25,op:.4+Math.random()*.6,ph:Math.random()*Math.PI*2});}
    function drawSnow(){S.flakes.forEach(p=>{p.x+=Math.sin(S.tick*.02+p.ph)*.4+p.dx;p.y+=p.spd;if(p.y>S.H+10){p.y=-10;p.x=Math.random()*S.W;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(240,248,255,${p.op})`;ctx.fill();});}
    function drawFog(){for(let i=0;i<8;i++){const ox=Math.sin(S.tick*.004+i*1.3)*40,y=30+i*65;const g=ctx.createLinearGradient(0,y-60,0,y+60);g.addColorStop(0,'transparent');g.addColorStop(.5,`rgba(200,215,225,${.08+i*.012})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.save();ctx.translate(ox,0);ctx.fillRect(-50,y-60,S.W+100,120);ctx.restore();}}

    function setScene(s){
      if (S.scene === s && S._seeded) return;
      S.scene=s;S._seeded=true;S.drops=[];S.flakes=[];S.sparkles=[];S.clouds=[];
      makeClouds(s);
      if(s==='rain')makeDrops(120);
      if(s==='storm')makeDrops(200);
      if(s==='snow')makeFlakes();
      if(s==='sun')for(let i=0;i<60;i++)S.sparkles.push({x:Math.random()*S.W,y:Math.random()*S.H,r:.5+Math.random()*2.5,op:.3+Math.random()*.6,ph:Math.random()*Math.PI*2,spd:.015+Math.random()*.025});
      if(s==='night')makeStars();
      if(!S.animated) drawFrame();
    }
    function drawFrame(){
      drawBg(S.scene);
      if(S.scene==='night'){drawStars();drawMoon();}
      else if(S.scene==='sun')drawSun();
      if(['cloud','over','rain','storm','fog'].includes(S.scene))drawClouds();
      if(S.scene==='rain')drawRain(false);
      if(S.scene==='storm')drawRain(true);
      if(S.scene==='snow')drawSnow();
      if(S.scene==='fog')drawFog();
    }
    function loop(){ if (!canvas.isConnected) { controller.destroy(); return; } S.tick++; S.half^=1; if(S.half===0) drawFrame(); S.raf=requestAnimationFrame(loop); }

    const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(() => { resize(); drawFrame(); }) : null;
    if (ro) ro.observe(canvas);

    const controller = { setScene, destroy(){ if(S.raf) cancelAnimationFrame(S.raf); if(ro) ro.disconnect(); canvas.__sky=null; } };
    canvas.__sky = controller;
    resize();
    setScene(S.scene);
    if (S.animated) loop(); else drawFrame();
    return controller;
  }

  _renderButtonWidget(w, sizeStyle, noBorder=false) {
    const entity   = w.entity || null;
    const s        = entity && this.hass?.states[entity] ? this.hass.states[entity] : null;
    const domain   = entity ? entity.split('.')[0] : null;
    const isUnavail = !s || ['unavailable','unknown'].includes(s.state);

    // États ON reconnus par domaine
    const ON_STATES = ['on','open','home','active','playing','heat','cool','auto','fan_only','dry','heat_cool','locked','true'];
    const isOn = !isUnavail && ON_STATES.includes(s.state);

    const label     = w.label     || s?.attributes?.friendly_name || entity || 'BOUTON';
    const icon      = w.icon      || this._getEntityIcon(entity || '');
    const color     = w.color     || '#22d3ee';
    const colorOff  = w.color_off || '#475569';
    const action    = w.action    || 'toggle';
    const showState = w.show_state !== false;
    const iconSize  = Math.max(16, parseInt(w.icon_size) || 32);
    const labelOn   = w.label_on  || 'ON';
    const labelOff  = w.label_off || 'OFF';
    const confirm   = w.confirm   || false;

    const curColor = isUnavail ? '#2d3748' : (isOn ? color : colorOff);
    const bgOn     = `${color}16`;
    const bgOff    = 'rgba(255,255,255,.03)';

    const doAction = () => {
      if (!entity || !this.hass || isUnavail) return;
      switch (action) {
        case 'toggle':    this.hass.callService('homeassistant','toggle',{entity_id:entity}); break;
        case 'turn_on':   this.hass.callService(domain,'turn_on',{entity_id:entity}); break;
        case 'turn_off':  this.hass.callService(domain,'turn_off',{entity_id:entity}); break;
        case 'press':     this.hass.callService('button','press',{entity_id:entity}); break;
        case 'activate':  this.hass.callService('scene','turn_on',{entity_id:entity}); break;
        case 'run':       this.hass.callService('script','turn_on',{entity_id:entity}); break;
      }
    };
    const handleClick = (e) => {
      e.stopPropagation();
      if (confirm) { if (!window.confirm('Confirmer : ' + label + ' ?')) return; }
      doAction();
    };

    const stateText = isUnavail ? 'HORS LIGNE' : (isOn ? labelOn : labelOff);

    // Variantes visuelles
    const style = w.style || 'default'; // default | pill | square | minimal

    if (style === 'minimal') {
      return html`
        <div class="dw-card ${noBorder?'no-border':''}"
             style="${sizeStyle} background:transparent; border-color:${curColor}33;
                    display:flex; align-items:center; justify-content:center; gap:8px; padding:10px;
                    cursor:${isUnavail?'default':'pointer'}; transition:.2s; user-select:none;"
             @click="${handleClick}">
          <ha-icon icon="${icon}" style="--mdc-icon-size:${iconSize}px; color:${curColor};
            filter:${isOn?`drop-shadow(0 0 6px ${color})`:'none'}; transition:.2s;"></ha-icon>
          <span style="font-size:14px; font-weight:800; color:${curColor}; letter-spacing:.5px;">${label}</span>
        </div>`;
    }

    if (style === 'pill') {
      return html`
        <div class="dw-card ${noBorder?'no-border':''}"
             style="${sizeStyle} background:${isOn?bgOn:bgOff}; border-color:${curColor}44;
                    display:flex; align-items:center; justify-content:center;
                    border-radius:999px; padding:0 16px; gap:10px;
                    cursor:${isUnavail?'default':'pointer'}; transition:.25s; user-select:none;
                    ${isOn?`box-shadow:0 0 18px ${color}22;`:''}"
             @click="${handleClick}">
          <ha-icon icon="${icon}" style="--mdc-icon-size:${iconSize}px; color:${curColor};
            filter:${isOn?`drop-shadow(0 0 7px ${color})`:'none'}; transition:.2s;"></ha-icon>
          <div style="display:flex;flex-direction:column;gap:2px;">
            <span style="font-size:14px; font-weight:800; color:#f1f5f9; letter-spacing:.5px;">${label}</span>
            ${showState?html`<span style="font-size:11px;font-weight:700;color:${curColor};letter-spacing:.5px;">${stateText}</span>`:html``}
          </div>
          <!-- toggle visuel -->
          <div style="margin-left:auto;width:36px;height:20px;border-radius:10px;flex-shrink:0;
                      background:${isOn?color:'rgba(255,255,255,.12)'};position:relative;transition:.25s;">
            <div style="position:absolute;top:3px;left:${isOn?'17px':'3px'};
                        width:14px;height:14px;border-radius:50%;background:#fff;
                        box-shadow:0 1px 4px rgba(0,0,0,.4);transition:.25s;"></div>
          </div>
        </div>`;
    }

    // ── Style par défaut : grande tuile carrée ──
    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} background:${isOn?bgOn:bgOff}; border-color:${curColor}44;
                  display:flex; flex-direction:column; align-items:center; justify-content:center;
                  gap:8px; padding:12px; cursor:${isUnavail?'default':'pointer'};
                  transition:.25s; user-select:none;
                  ${isOn?`box-shadow:0 0 22px ${color}1a, inset 0 0 18px ${color}08;`:''}"
           @click="${handleClick}">
        <!-- Indicateur état (point) -->
        <div style="position:absolute;top:8px;right:10px;width:7px;height:7px;border-radius:50%;
                    background:${curColor};
                    box-shadow:${isOn?`0 0 7px ${color}`:'none'};
                    transition:.25s;"></div>
        <ha-icon icon="${icon}"
          style="--mdc-icon-size:${iconSize}px; color:${curColor};
                 filter:${isOn?`drop-shadow(0 0 10px ${color})`:'none'};
                 transition:.3s; ${isUnavail?'opacity:.35;':''}"></ha-icon>
        <div style="font-size:13px; font-weight:800; color:${isUnavail?'#475569':'#f1f5f9'};
                    letter-spacing:.8px; text-align:center; line-height:1.3;">${label}</div>
        ${showState ? html`
          <div style="font-size:12px; font-weight:700; padding:2px 9px; border-radius:4px;
                      color:${curColor}; background:${curColor}18;
                      border:1px solid ${curColor}33; letter-spacing:.5px;">${stateText}</div>
        ` : html``}
      </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  //  WIDGET MÉTÉO ALSACE — badges de risques + bandeau matin/après-midi/soirée
  //  dans l'esprit de meteosuivialsace.fr (conception originale, pas de copie
  //  d'assets), avec un fond décoratif en silhouette réelle de l'Alsace.
  // ═══════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  WIDGET MÉTÉO ALSACE — Carte de l'Alsace + créneaux + badges de risques
  //  + section allergènes/pollens. Inspiré de meteosuivialsace.fr, conception
  //  entièrement originale (aucun asset copié), palette RE (dark/green).
  // ═══════════════════════════════════════════════════════════════════════════
  _renderAlsaceMeteoWidget(w, sizeStyle, noBorder=false) {
    const wxId = w.weather_entity;
    if (wxId) { this._refreshForecast(wxId); this._refreshHourlyForecast(wxId); }

    // ── Slot actif (0=Matin 1=Après-midi 2=Soirée 3=Nuit) ──
    if (!this._amSlots) this._amSlots = {};
    const wKey = wxId || 'am_default';
    if (this._amSlots[wKey] == null) {
      // Auto-sélection du créneau selon l'heure courante
      const h = new Date().getHours();
      this._amSlots[wKey] = (h >= 22 || h < 6) ? 3 : h >= 18 ? 2 : h >= 12 ? 1 : 0;
    }
    const slot = this._amSlots[wKey];
    const SLOT_LABELS = ['MATIN', 'APRÈS-MIDI', 'SOIRÉE', 'NUIT'];
    const SLOT_HOURS  = [9, 15, 20, 3];
    const nextSlot = () => { this._amSlots[wKey] = (slot+1)%4; this.requestUpdate(); };
    const prevSlot = () => { this._amSlots[wKey] = (slot+3)%4; this.requestUpdate(); };

    // ── Données météo courantes ──
    const wxSt = wxId && this.hass?.states[wxId] ? this.hass.states[wxId] : null;
    const att = wxSt?.attributes || {};
    const curCond  = wxSt?.state || '';
    const curTemp  = att.temperature != null ? parseFloat(att.temperature) : null;
    const curWind  = att.wind_speed  != null ? parseFloat(att.wind_speed)  : null;
    const curHum   = att.humidity    != null ? parseFloat(att.humidity)    : null;

    // ── Prévisions journalières (min/max) ──
    const daily   = this._wxForecast?.length ? this._wxForecast[0] : null;
    const dayHigh = daily?.temperature != null ? parseFloat(daily.temperature) : curTemp;
    const dayLow  = daily?.templow     != null ? parseFloat(daily.templow)     : curTemp;

    // ── Créneau horaire sélectionné ──
    const hourly = this._wxHourlyForecast || [];
    const now    = new Date();
    const tgt    = SLOT_HOURS[slot];
    let slotFc   = null;
    let bestDiff = Infinity;
    hourly.forEach(h => {
      const d = new Date(h.datetime);
      if (d <= now) return;
      const hh = d.getHours();
      const diff = Math.abs(hh - tgt) + (d.getDate() !== now.getDate() ? 24 : 0);
      if (diff < bestDiff) { bestDiff = diff; slotFc = h; }
    });
    const slotTemp  = slotFc?.temperature != null ? Math.round(parseFloat(slotFc.temperature)) : (curTemp!=null?Math.round(curTemp):null);
    const slotCond  = slotFc?.condition || curCond;
    const slotWind  = slotFc?.wind_speed != null ? parseFloat(slotFc.wind_speed) : curWind;
    const slotPrec  = slotFc?.precipitation ?? daily?.precipitation ?? null;
    const rainRaw   = w.rain_entity ? parseFloat(this.hass?.states[w.rain_entity]?.state) : NaN;
    const precipMm  = !isNaN(rainRaw) ? rainRaw : (slotPrec != null ? parseFloat(slotPrec) : null);

    // ── UV ──
    const uvRaw = w.uv_entity ? parseFloat(this.hass?.states[w.uv_entity]?.state) : NaN;
    const uvNum = !isNaN(uvRaw) ? Math.round(uvRaw) : null;
    const uvColor = uvNum==null?'#22c55e' : uvNum>=8?'#ef4444' : uvNum>=6?'#f97316' : uvNum>=3?'#eab308':'#22c55e';
    // Capteur de température locale (remplace la temp du créneau horaire dans l'affichage)
    const localTempRaw = w.local_temp_entity ? parseFloat(this.hass?.states[w.local_temp_entity]?.state) : NaN;
    const localTempVal = !isNaN(localTempRaw) ? localTempRaw : null;
    const displayTemp  = localTempVal != null ? localTempVal.toFixed(2)+'°C'
                       : slotTemp != null ? parseFloat(slotTemp).toFixed(2)+'°C' : '--';

    // ── Condition → icône mdi ──
    const WX_ICON = {
      'clear-night':'mdi:weather-night','cloudy':'mdi:weather-cloudy','fog':'mdi:weather-fog',
      'hail':'mdi:weather-hail','lightning':'mdi:weather-lightning','lightning-rainy':'mdi:weather-lightning-rainy',
      'partlycloudy':'mdi:weather-partly-cloudy','pouring':'mdi:weather-pouring','rainy':'mdi:weather-rainy',
      'snowy':'mdi:weather-snowy','snowy-rainy':'mdi:weather-snowy-rainy','sunny':'mdi:weather-sunny',
      'windy':'mdi:weather-windy','windy-variant':'mdi:weather-windy-variant','exceptional':'mdi:alert-circle',
    };
    const wxIcon = c => WX_ICON[c] || 'mdi:weather-partly-cloudy';
    const condIcon = wxIcon(slotCond);

    // ── Niveaux de risque (palette vigilance Météo-France) ──
    const LV = {
      none:{ label:'PAS DE RISQUE', col:'#22c55e', bg:'#060f07' },
      low: { label:'RISQUE FAIBLE', col:'#eab308', bg:'#0e0c00' },
      mod: { label:'RISQUE MODÉRÉ', col:'#f97316', bg:'#100700' },
      high:{ label:'RISQUE FORT',   col:'#ef4444', bg:'#0f0000' },
    };
    const upTo   = (v,t1,t2,t3) => v==null||isNaN(v)?LV.none : v>=t3?LV.high:v>=t2?LV.mod:v>=t1?LV.low:LV.none;
    const downTo = (v,t1,t2,t3) => v==null||isNaN(v)?LV.none : v<=t3?LV.high:v<=t2?LV.mod:v<=t1?LV.low:LV.none;

    const risks = [
      { icon:'mdi:thermometer-low',      name:'Grand froid',       lv: downTo(dayLow,   -5, -10, -15) },
      { icon:'mdi:sun-thermometer',      name:'Canicule',          lv: upTo(dayHigh,    28,  33,  38) },
      { icon:'mdi:home-flood',           name:'Pluie-inondation',  lv: upTo(precipMm,   15,  30,  50) },
      { icon:'mdi:snowflake-alert',      name:'Neige/Grêle',       lv: slotCond.includes('snowy')||slotCond.includes('hail') ? LV.low : LV.none },
      { icon:'mdi:car-traction-control', name:'Verglas',           lv: (slotTemp!=null&&slotTemp<=1&&slotTemp>=-8&&(slotCond.includes('rainy')||(curHum!=null&&curHum>=85))) ? LV.low : LV.none },
      { icon:'mdi:pine-tree',            name:'Tempête/arbres',    lv: upTo(slotWind,   70,  90, 110) },
      { icon:'mdi:weather-windy',        name:'Vent violent',      lv: upTo(slotWind,   50,  70,  90) },
      { icon:'mdi:weather-lightning',    name:'Orage',             lv: slotCond.includes('lightning') ? (slotCond==='lightning-rainy'?LV.mod:LV.low) : LV.none },
    ];

    // ── Carte SVG Alsace avec villes ──
    // Positions normalisées calculées depuis lat/lon (bornes IGN Bas+Haut Rhin)
    const CITIES_DEF = [
      { name:'Strasbourg', x:0.653, y:0.303 },
      { name:'Saverne',    x:0.372, y:0.201 },
      { name:'Sélestat',   x:0.437, y:0.493 },
      { name:'Colmar',     x:0.370, y:0.602 },
      { name:'Ste-Croix-en-Plaine', x:0.403, y:0.645 },
      { name:'Mulhouse',   x:0.353, y:0.801 },
    ];
    // ── Département / contour de la carte ──
    const deptCode = (w.map_department || '').trim();
    if (deptCode) this._refreshDepartmentPath(deptCode);
    const deptData       = deptCode ? this._deptPaths?.[deptCode] : null;
    const activeClipPath = deptData ? deptData.path : ALSACE_CLIP_PATH;
    const activeAspect   = deptData ? deptData.aspect : ALSACE_ASPECT;
    // Bbox pour convertir lat/lon → coordonnées SVG normalisées
    const bbox = deptData
      ? { lonMin:deptData.lonMin, dLon:deptData.lonMax-deptData.lonMin,
          latMin:deptData.latMin, dLat:deptData.latMax-deptData.latMin }
      : { lonMin:6.8462, dLon:1.3866, latMin:47.4222, dLat:1.6520 };

    // Villes : config YAML si présente, sinon défauts (Alsace)
    // Nettoie les valeurs (supprime tabulations/espaces parasites avant parseFloat)
    const cleanF = (v) => parseFloat(String(v || '').trim().replace(/[^\d.\-]/g,'') || '0');

    const cities = (w.cities && w.cities.length)
      ? w.cities.map(c => ({
          name:   c.name || c.label || '',
          x:      (cleanF(c.lon) - bbox.lonMin) / bbox.dLon,
          y:      1 - ((cleanF(c.lat) - bbox.latMin) / bbox.dLat),
          entity: c.temp_entity || null,
        }))
      : CITIES_DEF;

    // Température à afficher pour chaque ville (capteur dédié ou fallback créneau)
    const mapTemp = slotTemp != null ? parseFloat(slotTemp).toFixed(2)+'°' : '';
    const cityTempStr = (c) => {
      const eid = (c.entity || '').trim();
      if (eid) {
        const st = this.hass?.states[eid];
        if (st) {
          // weather.* : temp dans attributes.temperature
          // sensor.* : temp dans .state
          const v = parseFloat(st.attributes?.temperature ?? st.state);
          if (!isNaN(v)) return v.toFixed(2)+'°';
        }
      }
      return mapTemp;
    };

    // SVG de la carte
    const VW = 100, VH = Math.round(100 / activeAspect);
    const scaledPath = activeClipPath.replace(/([\d.]+) ([\d.]+)/g,
      (_, x, y) => `${(parseFloat(x)*VW).toFixed(1)} ${(parseFloat(y)*VH).toFixed(1)}`);
    const dotR    = parseFloat(w.city_dot_size)  || 3;
    const txtName = parseFloat(w.city_text_size)  || 6;
    const txtTemp = txtName + 2;
    // Message de chargement si département en cours de fetch
    const deptLoading = deptCode && !deptData && this._deptLoading?.[deptCode];
    //    dans lit-html : les html`<g>...</g>` imbriqués créent des éléments HTML
    //    et non SVG, donc circle/text ne s'affichaient pas).
    const mapSvg = `<svg viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;flex:1;max-height:100%;">
      ${deptLoading
        ? `<rect width="100" height="${VH}" fill="#0a1a0e" rx="4"/>
           <text x="50" y="${VH/2}" text-anchor="middle" style="font-size:8px;fill:#00ff8866;
             font-family:'Courier New',monospace;">Chargement…</text>`
        : `<path d="${scaledPath}" fill="#0c1f0e" stroke="#00cc44" stroke-width="0.8"/>`}
      ${cities.map(c => `
        <circle cx="${(c.x*VW).toFixed(1)}" cy="${(c.y*VH).toFixed(1)}"
                r="${dotR}" fill="#00ff88" opacity="0.95"/>
        <text x="${(c.x*VW + dotR + 1).toFixed(1)}" y="${(c.y*VH - 1).toFixed(1)}"
              text-anchor="start" style="font-size:${txtName}px;fill:#a8e6c0;
              font-family:'Courier New',monospace;font-weight:700;">${c.name}</text>
        <text x="${(c.x*VW + dotR + 1).toFixed(1)}" y="${(c.y*VH + txtTemp - 1).toFixed(1)}"
              text-anchor="start" style="font-size:${txtTemp}px;fill:#f0f8f0;
              font-family:'Courier New',monospace;font-weight:900;">${cityTempStr(c)}</text>
      `).join('')}
      <text x="${(0.38*VW).toFixed(1)}" y="${(0.50*VH).toFixed(1)}"
            text-anchor="middle" style="font-size:8px;fill:#00cc4455;
            font-family:'Courier New',monospace;letter-spacing:1px;">${(deptData?.name || 'ALSACE').toUpperCase()}</text>
    </svg>`;

    // ── Pollens/allergènes ──
    const pollenLvColor = v => {
      if (!v || ['unknown','unavailable',''].includes(String(v))) return '#22c55e';
      const s = String(v).toLowerCase();
      return s.includes('très')||s.includes('tres')||s==='4'||s==='5' ? '#ef4444'
           : s.includes('élevé')||s.includes('eleve')||s==='3'        ? '#f97316'
           : s.includes('modéré')||s.includes('modere')||s==='2'      ? '#eab308'
           : '#22c55e';
    };
    const pollenLvLabel = v => {
      if (!v || ['unknown','unavailable',''].includes(String(v))) return '—';
      const s = String(v).toLowerCase();
      if (s.includes('très')||s.includes('tres')) return 'TRÈS ÉLEVÉ';
      if (s.includes('élevé')||s.includes('eleve')) return 'ÉLEVÉ';
      if (s.includes('modéré')||s.includes('modere')) return 'MODÉRÉ';
      if (s.includes('faible')||s==='1') return 'FAIBLE';
      if (s==='nul'||s==='0') return 'NUL';
      return String(v).toUpperCase();
    };
    const pollenCells = [
      { key: w.pollen_g_entity, name:'Graminées' },
      { key: w.pollen_b_entity, name:'Bouleau' },
      { key: w.pollen_a_entity, name:'Ambroisie' },
      { key: w.pollen_u_entity, name:'Aulne' },
      { key: w.pollen_r_entity, name:'Armoise' },
      { key: w.pollen_o_entity, name:'Olivier' },
    ].filter(p => p.key);

    const gV = w.pollen_global_entity ? this.hass?.states[w.pollen_global_entity]?.state : null;

    // ── Jour de la semaine ──
    const DAYS = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'];
    const dayName = DAYS[new Date().getDay()];

    // ── Rendu ──
    const riskRow = r => html`
      <div style="display:flex;flex-direction:column;gap:2px;padding:7px 8px;
                  background:${r.lv.bg};border-left:3px solid ${r.lv.col};border-radius:0 5px 5px 0;">
        <div style="display:flex;align-items:center;gap:6px;">
          <ha-icon icon="${r.icon}" style="--mdc-icon-size:15px;color:${r.lv.col};flex-shrink:0;"></ha-icon>
          <span style="font-size:11px;color:#7a8a9a;letter-spacing:.2px;white-space:nowrap;">${r.name}</span>
        </div>
        <span style="font-size:12px;font-weight:700;color:${r.lv.col};letter-spacing:.3px;
                     padding-left:21px;white-space:nowrap;">${r.lv.label}</span>
      </div>`;

    const pollenRow = p => {
      const v = p.key && this.hass?.states[p.key]?.state;
      const col = pollenLvColor(v); const lbl = pollenLvLabel(v);
      return html`
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:6px 8px;border-bottom:1px solid #0f200f;">
          <span style="font-size:12px;color:#94a3b8;">${p.name}</span>
          <div style="display:flex;align-items:center;gap:5px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;"></div>
            <span style="font-size:11px;font-weight:700;color:${col};">${lbl}</span>
          </div>
        </div>`;
    };

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}padding:0;overflow:hidden;
                  background:#040f08;display:flex;flex-direction:column;">
        <!-- ── Bandeau créneau ── -->
        <div style="display:flex;align-items:center;background:#0a1a0e;border-bottom:1px solid #1e3d2d;
                    padding:0;flex-shrink:0;">
          <button @click=${prevSlot} style="background:none;border:none;color:#00ff88;font-size:22px;
                      padding:9px 14px;cursor:pointer;line-height:1;">‹</button>
          <div style="flex:1;text-align:center;font-size:15px;font-weight:900;color:#f1f5f9;
                      letter-spacing:2.5px;font-family:'Courier New',monospace;
                      text-shadow:0 0 10px #00ff8833;">${dayName} ${SLOT_LABELS[slot]}</div>
          <button @click=${nextSlot} style="background:none;border:none;color:#00ff88;font-size:22px;
                      padding:9px 14px;cursor:pointer;line-height:1;">›</button>
        </div>
        <!-- ── Corps 3 colonnes ── -->
        <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
          <!-- Colonne Gauche : carte Alsace (innerHTML = namespace SVG correct) -->
          <div style="width:28%;min-width:110px;padding:8px 6px;display:flex;flex-direction:column;
                      align-items:center;border-right:1px solid #1e3d2d;background:#040d06;">
            <div style="width:100%;flex:1;" .innerHTML="${mapSvg}"></div>
          </div>
          <!-- Colonne Centre : UV + risques -->
          <div style="flex:1;padding:8px 10px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;">
            <!-- UV + temp créneau -->
            <div style="display:flex;align-items:stretch;gap:8px;flex-shrink:0;">
              ${uvNum != null ? html`
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                            background:#0a120e;border:1px solid ${uvColor}44;border-radius:8px;
                            padding:8px 12px;min-width:62px;">
                  <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.5px;margin-bottom:2px;">
                    INDICE UV
                  </div>
                  <div style="font-size:26px;font-weight:900;color:${uvColor};
                              font-family:'Courier New',monospace;line-height:1;
                              text-shadow:0 0 8px ${uvColor}77;">${uvNum}</div>
                </div>` : html``}
              <div style="flex:1;display:flex;align-items:center;gap:10px;background:#0a120e;
                          border:1px solid #1e3d2d;border-radius:8px;padding:8px 12px;">
                <ha-icon icon="${condIcon}" style="--mdc-icon-size:34px;color:#00ff88;
                          filter:drop-shadow(0 0 6px #00ff8866);flex-shrink:0;"></ha-icon>
                <div>
                  <div style="font-size:24px;font-weight:900;color:#f1f5f9;
                              font-family:'Courier New',monospace;line-height:1;">
                    ${displayTemp}
                  </div>
                  <div style="font-size:11px;color:#475569;margin-top:2px;">
                    ↓${dayLow!=null?Math.round(dayLow)+'°':'-'} ↑${dayHigh!=null?Math.round(dayHigh)+'°':'-'}
                    ${slotWind!=null?' · '+Math.round(slotWind)+' km/h':''}
                  </div>
                </div>
              </div>
            </div>
            <!-- Risques (2 colonnes) -->
            <div style="font-size:10px;font-weight:700;color:#00ff8866;
                        letter-spacing:1.2px;flex-shrink:0;">◈ RISQUES DU CRÉNEAU</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;flex-shrink:0;">
              ${risks.map(riskRow)}
            </div>
          </div>
          <!-- Colonne Droite : allergènes -->
          <div style="width:27%;min-width:100px;padding:8px 8px;display:flex;flex-direction:column;
                      gap:6px;border-left:1px solid #1e3d2d;background:#040d06;overflow-y:auto;">
            <div style="font-size:10px;font-weight:700;color:#00ff8866;
                        letter-spacing:1.2px;flex-shrink:0;">◈ RISQUE ALLERGIES</div>
            ${gV ? html`
              <div style="background:#0a120e;border:1px solid ${pollenLvColor(gV)}44;border-radius:6px;
                          padding:8px;display:flex;align-items:center;gap:7px;flex-shrink:0;">
                <div style="width:10px;height:10px;border-radius:50%;background:${pollenLvColor(gV)};
                            flex-shrink:0;box-shadow:0 0 5px ${pollenLvColor(gV)};"></div>
                <div>
                  <div style="font-size:10px;color:#64748b;">Indice global pollen</div>
                  <div style="font-size:12px;font-weight:700;color:${pollenLvColor(gV)};">
                    ${pollenLvLabel(gV)}
                  </div>
                </div>
              </div>` : html``}
            <div style="background:#0a120e;border:1px solid #1e3d2d;border-radius:6px;overflow:hidden;flex-shrink:0;">
              ${pollenCells.length ? pollenCells.map(pollenRow) : html`
                <div style="padding:10px;font-size:11px;color:#475569;font-style:italic;">
                  Configure les entités de pollens dans l'éditeur du widget.
                </div>`}
            </div>
          </div>
        </div>
      </div>`;
  }


  _renderFoundryWidget(w, sizeStyle, noBorder=false) {
    // Affiche une carte Foundry (ou toute autre carte HA) à partir d'une config YAML/JSON.
    const raw = (w.foundry_yaml || '').trim();
    if (!raw) {
      return html`<div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px;text-align:center;padding:14px;">Carte Foundry : colle la configuration YAML de la carte dans l'éditeur du widget.</div>`;
    }
    // Parse la config (YAML simple ou JSON). On tente JSON puis un mini-parseur YAML clé:valeur.
    // NE PAS écrire sur `w` : LitElement gèle les objets de config → TypeError.
    // Cache Map sur l'instance : clé = raw YAML, valeur = config parsée.
    if (!this._foundryCfgCache) this._foundryCfgCache = new Map();
    let cfg = this._foundryCfgCache.get(raw);
    if (!cfg) {
      cfg = this._parseCardConfig(raw);
      if (cfg) this._foundryCfgCache.set(raw, cfg);
    }
    if (!cfg || !cfg.type) {
      return html`<div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:13px;text-align:center;padding:14px;">Config Foundry invalide : il faut au minimum une clé « type: ».</div>`;
    }

    if (!this._foundryCards) this._foundryCards = {};
    const key = (w.card_id || 'f') + '#' + raw;
    const slot = this._foundryCards[key];
    if (!slot) {
      this._foundryCards[key] = { state: 'loading' };
      (async () => {
        try {
          const helpers = await window.loadCardHelpers();
          const el = helpers.createCardElement(cfg);
          try { el.hass = this.hass; } catch (_e) {}
          el.style.cssText = 'display:block;width:100%;height:100%;';
          this._foundryCards[key] = { state: 'ok', el, errCount: 0 };
          this.requestUpdate();
          // Patch traduction EN→FR après rendu initial
          setTimeout(() => this._foundryPatchFR(el), 600);
        } catch (e) {
          this._foundryCards[key] = { state: 'error', msg: (e && e.message) ? e.message : String(e) };
          this.requestUpdate();
        }
      })();
    }
    const cur = this._foundryCards[key] || { state: 'loading' };
    if (cur.state === 'ok' && cur.el) {
      try { cur.el.hass = this.hass; }
      catch (e) {
        // La carte imbriquée plante : on la neutralise pour ne PAS boucler.
        this._foundryCards[key] = { state: 'error', msg: (e && e.message) ? e.message : 'Carte interne en erreur' };
      }
    }

    if (!this._alsaceClipIds) this._alsaceClipIds = new Map();
    if (!this._alsaceClipIds.has(key)) this._alsaceClipIds.set(key, this._alsaceClipIds.size);
    const clipId = 'reclip-' + this._alsaceClipIds.get(key);
    const isAlsaceClip = w.clip === 'alsace';

    const cardBody = cur.state === 'error'
      ? html`<div style="display:flex;flex-direction:column;gap:6px;height:100%;align-items:center;justify-content:center;color:#ef4444;font-size:13px;padding:14px;text-align:center;">
               <div style="font-weight:700;">Carte Foundry — erreur</div>
               <div style="color:#fca5a5;font-size:12px;">${cur.msg || 'Vérifie que Foundry est installé et que la config est correcte.'}</div>
             </div>`
      : cur.state !== 'ok' || !cur.el
        ? html`<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#64748b;font-size:13px;">Chargement…</div>`
        : cur.el;

    if (!isAlsaceClip) {
      return html`
        <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}padding:0;overflow:auto;">
          ${cardBody}
        </div>`;
    }

    // ── Mode silhouette Alsace : la carte (ex: Windy) est découpée selon le
    // vrai contour géographique de la région (IGN), avec le bon ratio largeur/hauteur. ──
    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}padding:0;display:flex;
                  align-items:center;justify-content:center;overflow:hidden;background:#020806;">
        <svg width="0" height="0" style="position:absolute;">
          <defs><clipPath id="${clipId}" clipPathUnits="objectBoundingBox">
            <path d="${ALSACE_CLIP_PATH}"/>
          </clipPath></defs>
        </svg>
        <div style="position:relative;width:100%;height:100%;max-width:100%;max-height:100%;
                    aspect-ratio:${ALSACE_ASPECT};clip-path:url(#${clipId});
                    filter:drop-shadow(0 0 12px rgba(0,255,136,.35));">
          ${cardBody}
        </div>
      </div>`;
  }

  // ─── Traduction EN→FR pour les cartes Foundry embarquées ───────────────
  // MutationObserver qui surveille le DOM de la carte (incl. shadow roots)
  // et remplace à la volée les chaînes anglaises par du français.
  _foundryPatchFR(el) {
    if (!el) return;
    // Table de traduction : regex → remplacement
    const TR = [
      // Durées relatives (ex: "1d ago", "3h ago", "5m ago", "30s ago")
      [/\b(\d+)\s*d\s+ago\b/gi,  (_, n) => `il y a ${n}j`],
      [/\b(\d+)\s*h\s+ago\b/gi,  (_, n) => `il y a ${n}h`],
      [/\b(\d+)\s*m\s+ago\b/gi,  (_, n) => `il y a ${n}min`],
      [/\b(\d+)\s*s\s+ago\b/gi,  (_, n) => `il y a ${n}s`],
      // "Now" seul (insensible à la casse)
      [/\bNow\b/g, 'Maintenant'],
      // Unités de temps abrégées seules (sans "ago")
      [/\b(\d+)\s*d\b/g, (_, n) => `${n}j`],
      // États génériques Foundry
      [/\bUnavailable\b/gi, 'Indisponible'],
      [/\bUnknown\b/gi,     'Inconnu'],
      [/\bLoading\b/gi,     'Chargement'],
      [/\bError\b/gi,       'Erreur'],
      [/\bConnected\b/gi,   'Connecté'],
      [/\bDisconnected\b/gi,'Déconnecté'],
      [/\bOn\b/g,           'Activé'],
      [/\bOff\b/g,          'Désactivé'],
      [/\bToday\b/gi,       "Aujourd'hui"],
      [/\bYesterday\b/gi,   'Hier'],
      [/\bLast 24 hours\b/gi, 'Dernières 24h'],
      [/\bLast 7 days\b/gi,   '7 derniers jours'],
      [/\bLast 30 days\b/gi,  '30 derniers jours'],
    ];

    // Parcourt tous les nœuds texte dans un élément (shadow root incl.)
    const patchNode = (root) => {
      if (!root) return;
      // Accès au shadow root si disponible
      const target = root.shadowRoot || root;
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        let txt = node.nodeValue;
        if (!txt || !txt.trim()) continue;
        let changed = false;
        for (const [re, rep] of TR) {
          const next = txt.replace(re, rep);
          if (next !== txt) { txt = next; changed = true; }
        }
        if (changed) node.nodeValue = txt;
      }
      // Récursion sur les enfants qui ont eux-mêmes un shadowRoot
      const all = (root.shadowRoot || root).querySelectorAll('*');
      for (const child of all) {
        if (child.shadowRoot) patchNode(child);
      }
    };

    // Premier passage immédiat
    patchNode(el);

    // MutationObserver pour les mises à jour ultérieures (Foundry re-render)
    if (el.__frObserver) el.__frObserver.disconnect();
    const obs = new MutationObserver(() => patchNode(el));
    const target = el.shadowRoot || el;
    obs.observe(target, { childList: true, subtree: true, characterData: true });
    el.__frObserver = obs;
  }

  _parseCardConfig(text) {
    // 1) Tentative JSON direct
    try { const j = JSON.parse(text); if (j && typeof j === 'object') return j; } catch(_e) {}
    // 2) Mini-parseur YAML basé sur un arbre d'indentation (gère correctement
    //    les listes de mappings comme `segments: [{from,to,color}, ...]`,
    //    contrairement à l'ancienne version qui plaçait le tableau au mauvais
    //    endroit dès qu'une clé contenait une liste → `segments.forEach` cassait).
    try {
      const rawLines = text.replace(/\t/g, '  ').split('\n');
      const coerce = (v) => {
        v = v.trim();
        if (v === '') return undefined;
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
        if (v === 'true') return true;
        if (v === 'false') return false;
        if (v === 'null' || v === '~') return null;
        if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
        return v;
      };

      // Étape A : aplatir en nœuds {indent, content, isItem}
      const nodes = [];
      for (const l of rawLines) {
        if (!l.trim() || l.trim().startsWith('#')) continue;
        const indent = l.search(/\S/);
        let content = l.trim();
        let isItem = false;
        if (content.startsWith('- ')) { isItem = true; content = content.slice(2).trim(); }
        else if (content === '-') { isItem = true; content = ''; }
        nodes.push({ indent, content, isItem, children: [] });
      }
      if (!nodes.length) return null;

      // Étape B : reconstruire l'arbre via la pile d'indentation
      const root = { indent: -1, content: '', isItem: false, children: [] };
      const stk = [root];
      for (const n of nodes) {
        while (stk.length > 1 && n.indent <= stk[stk.length - 1].indent) stk.pop();
        stk[stk.length - 1].children.push(n);
        stk.push(n);
      }

      // Étape C : convertir récursivement un nœud en valeur JS
      const convert = (node) => {
        if (!node.children.length) return coerce(node.content);

        const allItems = node.children.every(c => c.isItem);
        if (allItems) {
          // Liste : chaque enfant est un élément de tableau
          return node.children.map(c => {
            if (c.content.includes(':')) {
              const idx = c.content.indexOf(':');
              const k = c.content.slice(0, idx).trim();
              const v = c.content.slice(idx + 1).trim();
              const obj = {};
              obj[k] = v === '' ? convert(c) : coerce(v);
              // clés additionnelles du même élément (lignes suivantes, même retrait que les champs de cet item)
              for (const cc of c.children) {
                if (cc.isItem || !cc.content.includes(':')) continue;
                const idx2 = cc.content.indexOf(':');
                const k2 = cc.content.slice(0, idx2).trim();
                const v2 = cc.content.slice(idx2 + 1).trim();
                obj[k2] = v2 === '' ? convert(cc) : coerce(v2);
              }
              return obj;
            }
            // item scalaire ou sous-structure sans clé inline (ex: "- \n    foo: 1")
            return c.children.length ? convert(c) : coerce(c.content);
          });
        }

        // Mapping : chaque enfant est une paire clé: valeur
        const obj = {};
        for (const c of node.children) {
          if (c.isItem || !c.content.includes(':')) continue;
          const idx = c.content.indexOf(':');
          const k = c.content.slice(0, idx).trim();
          const v = c.content.slice(idx + 1).trim();
          obj[k] = v === '' ? convert(c) : coerce(v);
        }
        return obj;
      };

      const result = convert(root);
      return (result && typeof result === 'object' && !Array.isArray(result)) ? result : null;
    } catch (_e) { return null; }
  }

  _renderProgressWidget(w, sizeStyle, noBorder=false) {
    const s = w.entity && this.hass?.states[w.entity] ? this.hass.states[w.entity] : null;
    const raw = s ? parseFloat(s.state) : null;
    const val = (raw == null || isNaN(raw)) ? null : raw;
    const min = w.min != null ? parseFloat(w.min) : 0;
    const max = w.max != null ? parseFloat(w.max) : 100;
    const unit = w.unit != null ? w.unit : (s?.attributes?.unit_of_measurement || '%');
    const label = w.label || (s?.attributes?.friendly_name) || w.entity || 'Progression';
    const decimals = w.decimals != null ? parseInt(w.decimals) : 0;
    const col = w.color || '#22c55e';
    const pct = val == null ? 0 : Math.min(100, Math.max(0, (val - min) / (max - min) * 100));
    const disp = val == null ? '--' : val.toLocaleString('fr-FR', {maximumFractionDigits: decimals});

    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} background:#0a0c14;border-color:${col}33;overflow:hidden;
                  display:flex;flex-direction:column;justify-content:center;gap:6px;padding:10px 16px;box-sizing:border-box;"
           @click="${() => w.entity && this._handleAction(w.entity)}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-shrink:0;">
          <span style="font-size:14px;font-weight:700;color:#e2e8f0;letter-spacing:.3px;
                       white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</span>
          <span style="font-size:18px;font-weight:800;color:${col};white-space:nowrap;">
            ${disp}<span style="font-size:13px;color:#94a3b8;font-weight:600;"> ${unit}</span>
          </span>
        </div>
        <div style="width:100%;height:22px;min-height:22px;flex-shrink:0;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);
                    border-radius:11px;overflow:hidden;box-sizing:border-box;position:relative;">
          <div style="position:absolute;top:0;left:0;height:100%;width:${val==null?'0':Math.max(pct,(val>min?5:0)).toFixed(1)}%;
                      border-radius:11px;transition:width .8s cubic-bezier(.2,.8,.3,1);
                      background:${col};box-shadow:0 0 10px ${col};"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9);pointer-events:none;">${val==null?'--':disp+' '+unit}</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;font-weight:600;flex-shrink:0;">
          <span>${min.toLocaleString('fr-FR')} ${unit}</span>
          <span style="color:${col};">${pct.toFixed(0)}%</span>
          <span>${max.toLocaleString('fr-FR')} ${unit}</span>
        </div>
      </div>`;
  }

  _renderWeatherWidget(w, sizeStyle, noBorder=false) {
    const cfg = w.weather_config || {};
    const E = (k, def) => cfg[k] || def;
    const st = (id) => id && this.hass?.states[id] ? this.hass.states[id] : null;
    const stState = (id) => { const s = st(id); return s ? s.state : null; };

    const wxId = E('weather', 'weather.sainte_croix_en_plaine');
    this._refreshForecast(wxId);
    this._wxAnimated = w.animated !== false;

    const wx   = st(wxId);
    const wa   = wx ? wx.attributes : {};
    const pw   = st('weather.pirateweather'); const pwa = pw ? pw.attributes : {};
    const sun  = st('sun.sun'); const sa = sun ? sun.attributes : {};
    const cond = (wx ? wx.state : 'cloudy') || 'cloudy';

    // ── scène (fond) selon condition + soleil ──
    const SMAP = { 'sunny':'sun','clear-day':'sun','clear-night':'night','cloudy':'cloud','partlycloudy':'cloud','partly-cloudy-day':'cloud','partly-cloudy-night':'cloud','overcast':'over','rainy':'rain','pouring':'rain','drizzle':'rain','snowy':'snow','snowy-rainy':'snow','fog':'fog','lightning':'storm','lightning-rainy':'storm','hail':'storm','windy':'cloud','windy-variant':'cloud','exceptional':'cloud','ensoleillé':'sun','ciel clair':'sun','nuageux':'cloud','partiellement nuageux':'cloud','variable':'cloud','couvert':'over','pluie':'rain','averses':'rain','averses faibles':'rain','pluies orageuses':'storm','orage':'storm','brouillard':'fog','brume':'fog','neige':'snow' };
    let scene = SMAP[String(cond).toLowerCase()] || 'cloud';
    const elev = sa.elevation != null ? sa.elevation : 90;
    const rising = sa.rising || false;
    if (elev < -6) scene = 'night';
    else if (elev < 4 && rising) scene = 'sunrise';
    else if (elev < 4 && !rising) scene = 'sunset';
    this._wxScene = scene;

    const WICO = { 'sunny':'☀️','clear-day':'☀️','clear-night':'🌙','cloudy':'⛅','partlycloudy':'🌤️','partly-cloudy-day':'🌤️','partly-cloudy-night':'🌤️','overcast':'☁️','rainy':'🌧️','pouring':'🌧️','drizzle':'🌦️','snowy':'❄️','snowy-rainy':'🌨️','fog':'🌫️','lightning':'⛈️','lightning-rainy':'⛈️','hail':'🌨️','windy':'💨','exceptional':'⚠️','ensoleillé':'☀️','ciel clair':'☀️','nuageux':'⛅','couvert':'☁️','pluie':'🌧️','averses':'🌦️','orage':'⛈️','neige':'❄️' };
    const WLBL = { 'clear-day':'Ensoleillé','clear-night':'Ciel clair','sunny':'Ensoleillé','partlycloudy':'Partiellement nuageux','partly-cloudy-day':'Partiellement nuageux','partly-cloudy-night':'Partiellement nuageux','cloudy':'Nuageux','overcast':'Couvert','rainy':'Pluie','pouring':'Forte pluie','drizzle':'Bruine','snowy':'Neige','snowy-rainy':'Pluie et neige','fog':'Brouillard','lightning':'Orage','lightning-rainy':'Orage','hail':'Grêle','windy':'Venteux','exceptional':'Exceptionnel' };
    const wIco = WICO[String(cond).toLowerCase()] || '🌥️';
    const wLbl = WLBL[String(cond).toLowerCase()] || cond;
    const DAYS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

    // ── header : lever/coucher, durée du jour, variation ──
    let rise='--:--', set='--:--', dh=0, dm=0;
    const nr = new Date(sa.next_rising||0).getTime();
    const ns = new Date(sa.next_setting||0).getTime();
    if (nr && ns) {
      const tr = nr < ns ? nr : nr - 86400000;
      rise = new Date(tr).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      set  = new Date(ns).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      dh = Math.floor((ns-tr)/3600000); dm = Math.floor(((ns-tr)%3600000)/60000);
    }
    const day = Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);
    const vv = day<=80?(1.5+day*.03):day<=172?(4-(day-80)*.043):day<=264?(-(day-172)*.043):(-4+(day-264)*.04);

    const uv   = stState(E('uv','sensor.colmar_uv')) || '–';
    const rain = stState(E('rain','sensor.colmar_daily_precipitation')) || '–';
    const moon = stState(E('moon','sensor.phase_de_la_lune_fr')) || '–';
    const vis  = (pwa.visibility !== undefined) ? pwa.visibility : (wa.visibility != null ? wa.visibility : '–');
    const res  = pwa.apparent_temperature != null ? pwa.apparent_temperature : (pwa.feels_like != null ? pwa.feels_like : (wa.apparent_temperature != null ? wa.apparent_temperature : (wa.feels_like != null ? wa.feels_like : '–')));

    const fc = this._wxForecast || [];

    // ── pollen ──
    const niveauInfo = (id) => {
      const e = st(id);
      if (!e || !['1','2','3','4','5'].includes(String(e.state))) return { l:'N/A', p:0, col:'#555' };
      const n = parseInt(e.state);
      const lbl = e.attributes['Libellé'] || '';
      let col = e.attributes['Couleur'] || '#888';
      if (col === '#ddd') col = '#555';
      return { l: lbl || ['','Très faible','Faible','Modéré','Élevé','Très élevé'][n] || '?', p: Math.round(n/5*100), col };
    };
    const qpE = st(E('qp','sensor.qualite_globale_pollen_sainte_croix_en_plaine'));
    const qaE = st(E('qa','sensor.qualite_globale_sainte_croix_en_plaine'));
    const qpL = qpE ? (qpE.attributes['Libellé']||'–') : '–', qpC = qpE ? (qpE.attributes['Couleur']||'#888') : '#888';
    const qaL = qaE ? (qaE.attributes['Libellé']||'–') : '–', qaC = qaE ? (qaE.attributes['Couleur']||'#888') : '#888';
    const polls = [
      { n:'🌾 Graminées', nk:E('ng','sensor.niveau_gramine_sainte_croix_en_plaine'),   ck:E('cg','sensor.concentration_gramine_sainte_croix_en_plaine') },
      { n:'🌳 Bouleau',   nk:E('nb','sensor.niveau_bouleau_sainte_croix_en_plaine'),   ck:E('cb','sensor.concentration_bouleau_sainte_croix_en_plaine') },
      { n:'🌱 Ambroisie', nk:E('na','sensor.niveau_ambroisie_sainte_croix_en_plaine'), ck:E('ca','sensor.concentration_ambroisie_sainte_croix_en_plaine') },
      { n:'🌲 Aulne',     nk:E('nu','sensor.niveau_aulne_sainte_croix_en_plaine'),     ck:E('cu','sensor.concentration_aulne_sainte_croix_en_plaine') },
      { n:'🌿 Armoise',   nk:E('nr','sensor.niveau_armoise_sainte_croix_en_plaine'),   ck:E('crr','sensor.concentration_armoise_sainte_croix_en_plaine') },
      { n:'🫒 Olivier',   nk:E('no','sensor.niveau_olivier_sainte_croix_en_plaine'),   ck:E('co','sensor.concentration_olivier_sainte_croix_en_plaine') },
    ];

    // ── vigilance ──
    const ws2 = parseFloat(wa.wind_speed) || 0;
    const mx  = parseFloat(wa.temperature) || 0;
    const lc  = String(cond).toLowerCase();
    const al  = [];
    if (lc.includes('lightning')||lc.includes('thunder')||lc.includes('orage')) al.push({v:'o',t:'⛈ Orages — Vigilance orange'});
    else if (lc.includes('rain')||lc.includes('pouring')||lc.includes('drizzle')||lc.includes('pluie')||lc.includes('averse')) al.push({v:'y',t:'🌧 Pluie — Vigilance jaune'});
    if (mx>=35) al.push({v:'r',t:`🌡 Canicule — ${mx}°C`});
    else if (mx>=30) al.push({v:'o',t:`🌡 Chaleur — ${mx}°C`});
    if (ws2>=80) al.push({v:'o',t:`💨 Vent violent — ${Math.round(ws2)} km/h`});
    else if (ws2>=60) al.push({v:'y',t:`💨 Vent fort — ${Math.round(ws2)} km/h`});
    if (lc.includes('snow')||lc.includes('neige')) al.push({v:'y',t:'❄ Épisode neigeux'});
    if (lc.includes('fog')||lc.includes('brouillard')) al.push({v:'y',t:'🌫 Brouillard'});
    if (!al.length) al.push({v:'g',t:'✓ Aucune alerte en cours'});
    const VM = {g:'ag',y:'ay',o:'ao',r:'ar'}, VD = {g:'dg',y:'dy',o:'do',r:'dr'};

    const badge = (l,col) => html`<span style="border-radius:5px;padding:2px 7px;font-size:12px;font-weight:700;background:${col}33;color:${col};border:1px solid ${col}55;">${l}</span>`;

    return html`
      <div class="dw-card re-wx ${noBorder?'no-border':''}" style="${sizeStyle} position:relative; overflow:hidden; padding:0;">
        <canvas class="re-wx-sky"></canvas>
        <div class="re-wx-card">
          <div class="re-wx-hdr">
            <div class="re-wx-hdr-txt">
              <span style="font-size:16px;">${wIco}</span>
              <span style="font-size:14px;font-weight:700;color:#fff;margin-right:10px;">${wLbl}</span>
              <span style="opacity:.6;font-size:12px;">🌅<b>${rise}</b> 🌇<b>${set}</b> ⏱<b>${dh}h${String(dm).padStart(2,'0')}</b> 📈<b>${vv>0?'+':''}${vv.toFixed(1)}m</b></span>
            </div>
          </div>
          <div class="re-wx-meteo">
            <div>🌡️ Temp <b>${wa.temperature != null ? wa.temperature : '–'}°C</b><br>
                 🌬️ Vent <b>${wa.wind_speed != null ? wa.wind_speed : '–'} km/h</b><br>
                 👁️ Visib. <b>${vis} km</b><br>
                 🌡 Press. <b>${wa.pressure != null ? wa.pressure : '–'} hPa</b></div>
            <div class="re-wx-mc2">💧 Humid. <b>${wa.humidity != null ? wa.humidity : '–'}%</b><br>
                 ☀️ UV <b>${uv}</b> | 🌧️ <b>${rain}mm</b><br>
                 🌙 Lune <b>${moon}</b><br>
                 🤗 Ressenti <b>${res}°C</b></div>
          </div>
          <div class="re-wx-fc">
            ${fc.length ? fc.slice(0,7).map((d,i) => {
              const dt = new Date(d.datetime), label = i===0 ? "Aujourd'hui" : DAYS[dt.getDay()];
              return html`<div class="re-wx-day ${i===0?'today':''}">
                <div class="re-wx-dd">${label}</div>
                <span class="re-wx-di">${WICO[String(d.condition).toLowerCase()]||'🌥️'}</span>
                <span class="re-wx-dh">${Math.round(d.temperature!=null?d.temperature:0)}°</span>
                <span class="re-wx-dl">${Math.round(d.templow!=null?d.templow:0)}°</span>
              </div>`;
            }) : html`<div style="font-size:12px;color:rgba(255,255,255,.4);padding:6px;">Prévisions indisponibles</div>`}
          </div>
          <div>
            <div class="re-wx-stl">🌿 Pollen ${badge(qpL,qpC)} &nbsp;🏭 Air ${badge(qaL,qaC)}</div>
            <div class="re-wx-pol">
              ${polls.map(p => {
                const ni = niveauInfo(p.nk);
                const cv = stState(p.ck);
                const conc = (cv && cv!=='unavailable' && cv!=='unknown' && !isNaN(parseFloat(cv))) ? parseFloat(cv).toFixed(1) : null;
                return html`<div class="re-wx-pi">
                  <div class="re-wx-pn">${p.n}</div>
                  <span class="re-wx-pb" style="background:${ni.col}33;color:${ni.col};border:1px solid ${ni.col}55;">${ni.l}</span>
                  ${conc ? html`<span class="re-wx-pc">${conc}µg</span>` : html``}
                  <div class="re-wx-pbar"><div class="re-wx-pbf" style="width:${ni.p}%;background:${ni.col};"></div></div>
                </div>`;
              })}
            </div>
          </div>
          <div>
            <div class="re-wx-stl">⚠ Vigilance</div>
            <div class="re-wx-alt">
              ${al.map(a => html`<div class="re-wx-ai ${VM[a.v]}"><div class="re-wx-adot ${VD[a.v]}"></div><span>${a.t}</span></div>`)}
            </div>
          </div>
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

  // ═══════════════════════════════════════════════════════════
  //  WIDGET SOLAIRE NATIF (4 onglets, sans carte externe)
  //  Onglet figé par w.active_tab : 0 Solaire · 1 Météo · 2 Batteries · 3 Économies
  // ═══════════════════════════════════════════════════════════
  _renderPrevisionsWidget(w, sizeStyle, noBorder=false) {
    const fv  = (eid) => { const s=this.hass?.states[eid]; if(!s) return null; const v=parseFloat(s.state); return isNaN(v)?null:v; };
    const sv  = (eid) => this.hass?.states[eid]?.state || null;
    const attr= (eid,a) => this.hass?.states[eid]?.attributes?.[a] ?? null;

    const az   = fv(w.azimuth_entity);
    const elev = fv(w.elevation_entity);
    const pic  = fv(w.solcast_pic);
    const tot  = fv(w.solcast_total);
    const wind = fv(w.wind_entity);
    const moon = sv(w.moon_entity);
    const wSt  = sv(w.weather_entity);
    const wTemp= attr(w.weather_entity,'temperature');
    const wHum = attr(w.weather_entity,'humidity');

    // Icônes météo
    const weatherIcon = {'clear-night':'🌙','cloudy':'☁️','fog':'🌫️','hail':'🌨️',
      'lightning':'⛈️','lightning-rainy':'⛈️','partlycloudy':'⛅','partly-cloudy':'⛅',
      'pouring':'🌧️','rainy':'🌦️','snowy':'❄️','snowy-rainy':'🌨️','sunny':'☀️',
      'windy':'💨','windy-variant':'💨','exceptional':'⚡'}[wSt] || '🌡️';
    const weatherLabel = {'clear-night':'NUIT CLAIRE','cloudy':'NUAGEUX','fog':'BROUILLARD',
      'partlycloudy':'PARTIELLEMENT NUAGEUX','partly-cloudy':'PARTIELLEMENT NUAGEUX',
      'pouring':'FORTE PLUIE','rainy':'PLUIE','snowy':'NEIGE','sunny':'ENSOLEILLÉ',
      'windy':'VENTEUX','windy-variant':'TRÈS VENTEUX','lightning-rainy':'ORAGE',
      'lightning':'ORAGE','hail':'GRÊLE','exceptional':'EXCEPTIONNEL'}[wSt] || (wSt||'--').toUpperCase();
    const moonIcon = {'new_moon':'🌑','waxing_crescent':'🌒','first_quarter':'🌓',
      'waxing_gibbous':'🌔','full_moon':'🌕','waning_gibbous':'🌖',
      'last_quarter':'🌗','waning_crescent':'🌘'}[moon?.replace(/ /g,'_').toLowerCase()] || '🌙';
    const moonLabel = {'new_moon':'Nouvelle lune','waxing_crescent':'Croissant croissant',
      'first_quarter':'Premier quartier','waxing_gibbous':'Gibbeuse croissante',
      'full_moon':'Pleine lune','waning_gibbous':'Gibbeuse décroissante',
      'last_quarter':'Dernier quartier','waning_crescent':'Croissant décroissant'}[moon?.replace(/ /g,'_').toLowerCase()] || (moon||'--');

    // Position du soleil sur l'arc SVG
    // Azimut : lever ~60° coucher ~300°, arc de 240°
    const AZ_RISE=60, AZ_SET=300;
    const azPct = az!=null ? Math.max(0,Math.min(1,(az-AZ_RISE)/(AZ_SET-AZ_RISE))) : 0.5;
    const MAX_ELEV = 62; // élévation max Alsace été
    const elevPct = elev!=null ? Math.max(0,Math.min(1,elev/MAX_ELEV)) : 0;
    // Coordonnées sur l'arc (parabole)
    const svgX = 10 + azPct * 140;
    const svgY = elev!=null && elev > 0 ? 82 - elevPct * 70 : 88;
    const sunVisible = elev!=null && elev > 0;

    return html`
      <div style="${sizeStyle}background:#050800;border:1px solid var(--re-wa)22;border-radius:6px;
                  overflow:hidden;font-family:'Courier New',monospace;position:relative;">
        <style>
          @keyframes _re_scanH_prev{0%{left:-40%}100%{left:110%}}
          @keyframes _re_blink_prev{0%,100%{opacity:1}50%{opacity:0}}
          @keyframes _re_rotate_prev{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        </style>
        <div style="position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;z-index:1;">
          <div style="position:absolute;width:40%;height:1px;background:var(--re-wa);animation:_re_scanH_prev 5s linear infinite;"></div>
        </div>

        <!-- HEADER -->
        <div style="background:#0a0700;border-bottom:1px solid var(--re-wa)18;padding:9px 14px;
                    display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:15px;letter-spacing:2px;color:var(--re-wa);">PRÉVISIONS SOLAIRES — CENTRE ALSACE</div>
            <div style="font-size:15px;color:var(--re-wa);margin-top:2px;">STE-CROIX-EN-PLAINE · 48.009°N 7.405°E</div>
          </div>
          <div style="font-size:15px;color:var(--re-wg);border:1px solid var(--re-wg);padding:3px 10px;border-radius:2px;">
            ✓ SOLCAST ACTIF
          </div>
        </div>

        <!-- ARC TRAJECTOIRE SOLAIRE — pleine largeur -->
        <div style="padding:8px 16px 4px;border-bottom:1px solid var(--re-wa)12;">
          <div style="font-size:12px;color:var(--re-wa);letter-spacing:2px;margin-bottom:4px;text-align:center;opacity:0.6;">TRAJECTOIRE SOLAIRE — AUJOURD'HUI</div>
          <svg width="100%" height="160" viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg" style="display:block;max-height:160px;">
            <!-- Zone panneaux SUD -->
            <path d="M 150,130 Q 200,60 250,130 Z" fill="rgba(34,197,94,0.07)" stroke="rgba(34,197,94,0.3)" stroke-width="1"/>
            <!-- Arc trajectoire -->
            <path d="M 20,138 Q 200,10 380,138" fill="none" stroke="var(--re-wa)" stroke-width="2" stroke-dasharray="8,6" opacity="0.5"/>
            <!-- Horizon -->
            <line x1="10" y1="140" x2="390" y2="140" stroke="#2a3a1a" stroke-width="1.5"/>
            <!-- Labels horaires -->
            <text x="12" y="155" fill="#4a5568" font-size="12" font-family="Courier New">06h</text>
            <text x="183" y="155" fill="#4a5568" font-size="12" font-family="Courier New">13h</text>
            <text x="362" y="155" fill="#4a5568" font-size="12" font-family="Courier New">21h</text>
            <text x="186" y="125" fill="rgba(34,197,94,0.6)" font-size="11" font-family="Courier New">SUD</text>
            <!-- Soleil visible (affiché si elev > 0) -->
            <g opacity="${sunVisible ? 1 : 0}">
              <circle cx="${10 + azPct*370}" cy="${Math.max(16, 138 - elevPct*128)}" r="20" fill="var(--re-wa)" opacity="0.1"/>
              <circle cx="${10 + azPct*370}" cy="${Math.max(16, 138 - elevPct*128)}" r="11" fill="var(--re-wa)" opacity="0.25"/>
              <circle cx="${10 + azPct*370}" cy="${Math.max(16, 138 - elevPct*128)}" r="6" fill="var(--re-wa)"/>
              <line x1="${10+azPct*370}" y1="${Math.max(16,138-elevPct*128)-14}" x2="${10+azPct*370}" y2="${Math.max(16,138-elevPct*128)-22}" stroke="var(--re-wa)" stroke-width="2" opacity="0.7"/>
              <line x1="${10+azPct*370}" y1="${Math.max(16,138-elevPct*128)+14}" x2="${10+azPct*370}" y2="${Math.max(16,138-elevPct*128)+22}" stroke="var(--re-wa)" stroke-width="2" opacity="0.4"/>
              <line x1="${10+azPct*370-14}" y1="${Math.max(16,138-elevPct*128)}" x2="${10+azPct*370-22}" y2="${Math.max(16,138-elevPct*128)}" stroke="var(--re-wa)" stroke-width="2" opacity="0.5"/>
              <line x1="${10+azPct*370+14}" y1="${Math.max(16,138-elevPct*128)}" x2="${10+azPct*370+22}" y2="${Math.max(16,138-elevPct*128)}" stroke="var(--re-wa)" stroke-width="2" opacity="0.5"/>
              <line x1="${10+azPct*370+10}" y1="${Math.max(16,138-elevPct*128)-10}" x2="${10+azPct*370+16}" y2="${Math.max(16,138-elevPct*128)-16}" stroke="var(--re-wa)" stroke-width="1.5" opacity="0.5"/>
              <line x1="${10+azPct*370-10}" y1="${Math.max(16,138-elevPct*128)-10}" x2="${10+azPct*370-16}" y2="${Math.max(16,138-elevPct*128)-16}" stroke="var(--re-wa)" stroke-width="1.5" opacity="0.5"/>
              <text x="${Math.min(360,10+azPct*370+14)}" y="${Math.max(20,138-elevPct*128-12)}" fill="var(--re-wa)" font-size="13" font-family="Courier New" font-weight="bold">${elev!=null?elev.toFixed(0)+'°':''}</text>
            </g>
            <!-- Soleil sous l'horizon (affiché si nuit) -->
            <g opacity="${sunVisible ? 0 : 1}">
              <circle cx="${10+azPct*370}" cy="142" r="8" fill="var(--re-wa)" opacity="0.15" stroke="var(--re-wa)" stroke-width="1" stroke-dasharray="3,3"/>
              <text x="155" y="90" fill="var(--re-wa)" opacity="0.25" font-size="22" font-family="Courier New">NUIT</text>
            </g>
          </svg>
        </div>

        <!-- MÉTRIQUES 4 cases pleine largeur -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-bottom:1px solid var(--re-wa)12;">
          <div style="background:#050800;padding:14px 16px;border-right:1px solid var(--re-wa)08;">
            <div style="font-size:13px;color:var(--re-wa);letter-spacing:1px;margin-bottom:5px;">AZIMUT</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wa);line-height:1;">${az!=null?az.toFixed(0)+"°":"--"}</div>
            <div style="font-size:12px;color:var(--re-wa);margin-top:4px;opacity:0.6;">${az!=null?(az<90?"EST":az<180?"SUD-EST":az<270?"SUD-OUEST":"OUEST"):"--"}</div>
          </div>
          <div style="background:#050800;padding:14px 16px;border-right:1px solid var(--re-wa)08;">
            <div style="font-size:13px;color:var(--re-wa);letter-spacing:1px;margin-bottom:5px;">ÉLÉVATION</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wa);line-height:1;">${elev!=null?elev.toFixed(0)+"°":"--"}</div>
            <div style="font-size:12px;color:var(--re-wa);margin-top:4px;opacity:0.6;">${elev!=null?(elev<0?"SOUS HORIZON":elev<15?"BAS":elev<35?"MOYEN":"HAUT"):"--"}</div>
          </div>
          <div style="background:#050800;padding:14px 16px;border-right:1px solid var(--re-wg)08;">
            <div style="font-size:13px;color:var(--re-wg);letter-spacing:1px;margin-bottom:5px;">PIC SOLCAST</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wg);line-height:1;">${pic!=null?pic.toFixed(1)+" kWh":"--"}</div>
            <div style="font-size:12px;color:var(--re-wg);margin-top:4px;opacity:0.6;">AUJOURD'HUI</div>
          </div>
          <div style="background:#050800;padding:14px 16px;">
            <div style="font-size:13px;color:var(--re-wg);letter-spacing:1px;margin-bottom:5px;">TOTAL JOUR</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wg);line-height:1;">${tot!=null?tot.toFixed(1)+" kWh":"--"}</div>
            <div style="font-size:12px;color:var(--re-wg);margin-top:4px;opacity:0.6;">SOLCAST PRÉVIS.</div>
          </div>
        </div>

        <!-- BANDE MÉTÉO BAS -->
        <div style="border-top:1px solid var(--re-wa)12;display:grid;grid-template-columns:1fr 1fr 1fr;background:var(--re-wa)06;">
          <div style="padding:10px 14px;border-right:1px solid var(--re-wa)10;">
            <div style="font-size:15px;color:var(--re-wt);letter-spacing:1px;margin-bottom:4px;">CONDITION</div>
            <div style="font-size:15px;font-weight:700;color:var(--re-wt);">
              ${weatherIcon} ${weatherLabel}
            </div>
            ${wTemp!=null?html`<div style="font-size:15px;color:var(--re-wtd);margin-top:3px;">${wTemp}° · ${wHum!=null?wHum+'% HR':''}</div>`:html``}
          </div>
          <div style="padding:10px 14px;border-right:1px solid var(--re-wa)10;">
            <div style="font-size:15px;color:var(--re-wt);letter-spacing:1px;margin-bottom:4px;">VENT</div>
            <div style="font-size:15px;font-weight:700;color:var(--re-wt);">
              ${wind!=null?wind.toFixed(0)+' km/h':'--'}
            </div>
            ${wind!=null?html`<div style="font-size:15px;color:var(--re-wtd);margin-top:3px;">${wind<10?'FAIBLE':wind<25?'MODÉRÉ':wind<50?'FORT':'TRÈS FORT'}</div>`:html``}
          </div>
          <div style="padding:10px 14px;">
            <div style="font-size:15px;color:var(--re-wp);letter-spacing:1px;margin-bottom:4px;">LUNE</div>
            <div style="font-size:15px;font-weight:700;color:var(--re-wp);">${moonIcon} ${moonLabel}</div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:5px 14px;display:flex;justify-content:space-between;font-size:14px;
                    color:var(--re-wa);border-top:1px solid var(--re-wa)08;">
          <span>SOURCE: OPENWEATHERMAP + SOLCAST</span>
          <span style="animation:_re_blink_prev 1.2s step-end infinite;color:var(--re-wg);">● LIVE</span>
        </div>
      </div>`;
  }

    _renderEconomiesWidget(w, sizeStyle, noBorder=false) {
    const fv = (eid) => { const s=this.hass?.states[eid]; if(!s) return null; const v=parseFloat(s.state); return isNaN(v)?null:v; };
    const fmtE = (v, dec=2) => v!=null ? v.toFixed(dec).replace('.',',')+'&nbsp;€' : '--';
    const fmtK = (v) => v!=null ? v.toFixed(3).replace('.',',')+'&nbsp;€' : '--';

    const cumul   = fv(w.eco_money);
    const jour    = fv(w.eco_day);
    const mois    = fv(w.eco_month);
    const annuel  = fv(w.eco_year);
    const tarif   = fv(w.kwh_price);
    const target  = parseFloat(w.eco_target) || 300;
    const pctEnt  = fv(w.eco_pct);
    const pct     = pctEnt!=null ? Math.min(100,pctEnt) : (cumul!=null ? Math.min(100,(cumul/target)*100) : 0);
    const pctDisp = pct.toFixed(0);
    const allOk   = cumul != null;

    return html`
      <div style="${sizeStyle}background:#020a02;border:1px solid var(--re-wg)22;border-radius:6px;
                  overflow:hidden;font-family:'Courier New',monospace;position:relative;">

        <!-- Scan line -->
        <div style="position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;z-index:1;">
          <div style="position:absolute;width:40%;height:1px;background:var(--re-wg);
                       animation:_re_scan_eco 5s linear infinite;"></div>
        </div>
        <style>
          @keyframes _re_scan_eco{0%{left:-40%}100%{left:110%}}
          @keyframes _re_blink_eco{0%,100%{opacity:1}50%{opacity:0}}
        </style>

        <!-- HEADER -->
        <div style="background:#021002;border-bottom:1px solid var(--re-wg)18;
                    padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:12px;letter-spacing:3px;color:var(--re-wg);">
              UMBRELLA CORP. — DIVISION ÉNERGIE
            </div>
            <div style="font-size:11px;color:var(--re-wg);margin-top:2px;letter-spacing:1px;">
              COMPTE ÉPARGNE PHOTOVOLTAÏQUE · REF: PV-7742
            </div>
          </div>
          <div style="font-size:11px;color:var(--re-wg);border:1px solid var(--re-wg)22;padding:3px 10px;border-radius:2px;">
            CONFIDENTIEL
          </div>
        </div>

        <!-- SOLDE PRINCIPAL -->
        <div style="padding:20px 16px 14px;border-bottom:1px solid var(--re-wg)12;text-align:center;">
          <div style="font-size:14px;letter-spacing:2px;color:var(--re-wt);margin-bottom:10px;">
            ÉCONOMIES RÉALISÉES — CUMUL ANNUEL
          </div>
          <div style="font-size:48px;font-weight:900;color:var(--re-wg);letter-spacing:2px;line-height:1;">
            ${cumul!=null ? html`${cumul.toFixed(2).replace('.',',')} <span style="font-size:24px;color:var(--re-wg);">€</span>` : html`<span style="font-size:32px;color:#334;">--</span>`}
          </div>
          ${mois!=null?html`<div style="font-size:13px;color:var(--re-wg);margin-top:8px;letter-spacing:1px;">
            ↑ +${mois.toFixed(2).replace('.',',')} € CE MOIS · OBJECTIF: ${target.toFixed(0)} €/AN
          </div>`:html``}
          <!-- Barre progression -->
          <div style="margin-top:12px;height:6px;background:#0a1a0a;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pctDisp}%;background:var(--re-wg);border-radius:3px;transition:width 1s;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--re-wg);margin-top:5px;">
            <span>0 €</span>
            <span style="color:var(--re-wg);font-weight:700;">${pctDisp}% DE L'OBJECTIF ATTEINT</span>
            <span>${target.toFixed(0)} €</span>
          </div>
        </div>

        <!-- 3 MÉTRIQUES -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:var(--re-wg)08;">
          <div style="background:#020a02;padding:14px 16px;border-right:1px solid var(--re-wg)12;">
            <div style="font-size:12px;letter-spacing:2px;color:var(--re-wg);margin-bottom:6px;">GAIN / JOUR</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wg);line-height:1;">
              ${jour!=null ? jour.toFixed(2).replace('.',',') : '--'}
              <span style="font-size:14px;color:var(--re-wg);"> €</span>
            </div>
          </div>
          <div style="background:#020a02;padding:14px 16px;border-right:1px solid var(--re-wg)12;">
            <div style="font-size:12px;letter-spacing:2px;color:var(--re-wg);margin-bottom:6px;">GAIN / MOIS</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wg);line-height:1;">
              ${mois!=null ? mois.toFixed(2).replace('.',',') : '--'}
              <span style="font-size:14px;color:var(--re-wg);"> €</span>
            </div>
          </div>
          <div style="background:#020a02;padding:14px 16px;">
            <div style="font-size:12px;letter-spacing:2px;color:var(--re-wp);margin-bottom:6px;">TARIF EDF</div>
            <div style="font-size:26px;font-weight:900;color:var(--re-wp);line-height:1;">
              ${tarif!=null ? tarif.toFixed(3).replace('.',',') : '--'}
              <span style="font-size:14px;color:var(--re-wp);"> €/kWh</span>
            </div>
          </div>
        </div>

        ${annuel!=null?html`
        <!-- GAIN NET ANNUEL -->
        <div style="padding:12px 16px;border-top:1px solid var(--re-wg)12;background:#021002;
                    display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:12px;letter-spacing:2px;color:var(--re-wg);">GAIN NET ANNUEL</div>
          <div style="font-size:22px;font-weight:900;color:var(--re-wg);">
            ${annuel.toFixed(2).replace('.',',')} <span style="font-size:13px;color:var(--re-wg);">€</span>
          </div>
        </div>`:html``}

        <!-- FOOTER -->
        <div style="padding:7px 16px;border-top:1px solid var(--re-wg)0a;
                    display:flex;justify-content:space-between;font-size:11px;color:var(--re-wg);">
          <span>DIVISION ÉNERGIE RENOUVELABLE</span>
          <span style="animation:_re_blink_eco 1.2s step-end infinite;color:var(--re-wg);">● TEMPS RÉEL</span>
          <span>UMBR. CORP. © 2026</span>
        </div>
      </div>`;
  }

    _renderConsumptionWidget(w, sizeStyle, noBorder=false) {
    const fv  = (eid) => { const s=this.hass?.states[eid]; if(!s) return null; const v=parseFloat(s.state); return isNaN(v)?null:v; };
    const fmt = (v,d=0,suf='') => v!=null ? v.toFixed(d).replace('.',',')+suf : '--';

    const totalW  = fv(w.total_entity);
    const solarW  = fv(w.solar_entity);
    const nightKwh= fv(w.night_entity);
    const tarif   = fv(w.kwh_price) || parseFloat(w.kwh_price_val) || 0.194;
    const maxW    = parseFloat(w.max_power) || 5000;
    const thresh  = parseFloat(w.threshold) || 5;
    const topN    = parseInt(w.top_count) || 6;

    const cT = w.col_total  || '#ef4444';
    const cS = w.col_solar  || '#22c55e';
    const cN = w.col_night  || '#f59e0b';

    const lTotal = w.lbl_total  || 'CONSOMMATION INSTANTANÉE';
    const lCost  = w.lbl_cost   || 'COÛT / HEURE';
    const lSolar = w.lbl_solar  || 'SOLAIRE ACTUEL';
    const lNight = w.lbl_night  || 'CONSO NUIT';
    const lTarif = w.tarif_label || 'TARIF EDF';

    const costPerH = totalW!=null && tarif ? totalW/1000*tarif : null;
    const capPct   = totalW!=null ? Math.min(100,(totalW/maxW)*100) : 0;
    const capCol   = capPct>80?'#ff3300':capPct>50?'#f59e0b':'#22c55e';

    // Devices triés par puissance décroissante
    const devices = (w.devices||[]).map(d => ({
      ...d,
      val: fv(d.entity),
    })).filter(d => d.val!=null && d.val>=thresh)
      .sort((a,b)=>(b.val||0)-(a.val||0))
      .slice(0, topN);

    const maxDev = devices.length ? Math.max(...devices.map(d=>d.val||0)) : 1;

    return html`
      <div style="${sizeStyle}background:#080005;border:1px solid ${cT}22;border-radius:6px;
                  overflow:hidden;font-family:'Courier New',monospace;position:relative;">
        <style>
          @keyframes _co_scan{0%{left:-40%}100%{left:110%}}
          @keyframes _co_pulse{0%,100%{opacity:1}50%{opacity:0.25}}
          @keyframes _co_blink{0%,100%{opacity:1}50%{opacity:0}}
        </style>
        <div style="position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;z-index:1;">
          <div style="position:absolute;width:40%;height:1px;background:${cT}55;animation:_co_scan 4s linear infinite;"></div>
        </div>

        <!-- HEADER -->
        <div style="background:#0d0008;border-bottom:1px solid ${cT}18;padding:9px 14px;
                    display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:14px;letter-spacing:2px;color:${cT};">${w.header_title||'SURVEILLANCE ÉNERGÉTIQUE — RÉSIDENCE'}</div>
            <div style="font-size:14px;color:var(--re-wtd);margin-top:2px;">${w.header_sub||'LINKY + ECOJOKO · CAPTEURS ACTIFS'}</div>
          </div>
          <div style="font-size:13px;color:${cN};border:1px solid ${cN}33;padding:3px 10px;border-radius:2px;">
            ${lTarif} · ${fmt(tarif,3)} €/kWh
          </div>
        </div>

        <!-- CONSO TOTALE + 3 MÉTRIQUES -->
        <div style="padding:14px;border-bottom:1px solid ${cT}12;display:flex;gap:16px;align-items:center;">
          <!-- Grande valeur -->
          <div style="flex:1;">
            <div style="font-size:14px;color:${cT};letter-spacing:2px;margin-bottom:6px;opacity:1;">${lTotal}</div>
            <div style="font-size:44px;font-weight:900;color:${cT};line-height:1;">
              ${totalW!=null?Math.round(totalW).toLocaleString('fr-FR'):'--'}
              <span style="font-size:18px;opacity:0.85;"> W</span>
            </div>
            <div style="margin-top:10px;height:5px;background:#1a0005;border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${capPct}%;background:linear-gradient(90deg,#22c55e,${cN},${capCol});border-radius:3px;transition:width .8s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:${cT};opacity:0.8;margin-top:4px;">
              <span>0 W</span>
              <span>${capPct.toFixed(0)}% DE LA CAPACITÉ</span>
              <span>${(maxW/1000).toFixed(0)} kW</span>
            </div>
          </div>
          <!-- 3 métriques côté droit -->
          <div style="display:flex;flex-direction:column;gap:7px;flex-shrink:0;min-width:140px;">
            <div style="padding:9px 12px;background:#0a0002;border:1px solid ${cT}22;border-radius:4px;">
              <div style="font-size:13px;color:${cT};opacity:0.9;margin-bottom:3px;">${lCost}</div>
              <div style="font-size:20px;font-weight:900;color:${cT};">${fmt(costPerH,2)} €</div>
            </div>
            <div style="padding:9px 12px;background:#020a02;border:1px solid ${cS}22;border-radius:4px;">
              <div style="font-size:13px;color:${cS};opacity:0.9;margin-bottom:3px;">${lSolar}</div>
              <div style="font-size:20px;font-weight:900;color:${cS};">${fmt(solarW,0)} W</div>
            </div>
            <div style="padding:9px 12px;background:#0a0500;border:1px solid ${cN}22;border-radius:4px;">
              <div style="font-size:13px;color:${cN};opacity:0.9;margin-bottom:3px;">${lNight}</div>
              <div style="font-size:20px;font-weight:900;color:${cN};">${fmt(nightKwh,1)} kWh</div>
            </div>
          </div>
        </div>

        <!-- TOP APPAREILS ACTIFS -->
        <div style="padding:10px 14px;">
          <div style="font-size:13px;color:${cT};letter-spacing:2px;margin-bottom:8px;opacity:0.85;">
            TOP CONSOMMATEURS ACTIFS — ${devices.length} / ${(w.devices||[]).length} UNITÉS
          </div>
          ${devices.length ? devices.map(d => {
            const barW = maxDev>0 ? Math.min(100,(d.val/maxDev)*100) : 0;
            const dc = d.color || cT;
            return html`
              <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid ${cT}25;">
                <div style="width:9px;height:9px;border-radius:50%;background:${dc};flex-shrink:0;animation:_co_pulse 2s ease-in-out infinite;"></div>
                <div style="flex:1;font-size:13px;color:var(--re-wt);">${d.name||d.entity.split('.').pop()}</div>
                <div style="width:80px;height:3px;background:#1a0005;border-radius:2px;overflow:hidden;">
                  <div style="height:100%;width:${barW}%;background:${dc};transition:width .5s;"></div>
                </div>
                <div style="font-size:14px;font-weight:700;color:${dc};min-width:65px;text-align:right;">${fmt(d.val,0)} W</div>
              </div>`;
          }) : html`
            <div style="font-size:14px;color:var(--re-wtd);padding:10px 0;text-align:center;opacity:0.85;">
              Aucun appareil actif · configurez les appareils dans l'éditeur
            </div>`}
        </div>

        <!-- FOOTER -->
        <div style="padding:5px 14px;display:flex;justify-content:space-between;font-size:13px;color:${cT}77;border-top:1px solid ${cT}08;">
          <span>SURVEILLANCE MULTI-CAPTEURS</span>
          <span style="animation:_co_blink 1.2s step-end infinite;color:${cS}88;">● TEMPS RÉEL</span>
        </div>
      </div>`;
  }

  _renderSolarFlowWidget(w, sizeStyle, noBorder=false) {
    const fv = (eid) => { const s=this.hass?.states[eid]; if(!s) return null; const v=parseFloat(s.state); return isNaN(v)?null:v; };
    const fmt = (v,d=0) => v!=null ? v.toFixed(d).replace('.',',') : '--';
    const th = this._config?.theme || {};

    // Valeurs
    const p1w=fv(w.p1_w_entity), p2w=fv(w.p2_w_entity), p3w=fv(w.p3_w_entity);
    const p1d=fv(w.p1_d_entity), p2d=fv(w.p2_d_entity), p3d=fv(w.p3_d_entity);
    const p1m=fv(w.p1_m_entity), p2m=fv(w.p2_m_entity), p3m=fv(w.p3_m_entity);
    // Prod mois totale = entité dédiée OU somme des 3 installations
    const monthFromInst = (p1m!=null||p2m!=null||p3m!=null) ? (p1m||0)+(p2m||0)+(p3m||0) : null;
    const monthKwh = (()=>{
      const v = fv(w.month_entity);
      // Si l'entité mois retourne 0 ou null, utiliser la somme des installations
      return (v!=null && v>0) ? v : monthFromInst;
    })();
    const totalW   = fv(w.total_entity) || ((p1w||0)+(p2w||0)+(p3w||0));
    const consW    = fv(w.cons_entity);
    const gridRaw  = fv(w.grid_entity);
    const autoP    = fv(w.autoconso_entity);
    const dayKwh   = fv(w.day_entity);
    const nightKwh = fv(w.night_entity);
    const objPct   = fv(w.obj_pct_entity);
    const objKwh   = fv(w.obj_kwh_entity);

    // Flux calculés
    const injection = gridRaw!=null ? Math.max(0,-gridRaw) : Math.max(0,totalW-(consW||0));
    const fromGrid  = gridRaw!=null ? Math.max(0,gridRaw)  : Math.max(0,(consW||0)-totalW);
    const hasInj    = injection > 5;
    const hasImp    = fromGrid > 5;

    // Noms/couleurs installations
    const p1n=w.p1_name||'Install. 1', p2n=w.p2_name||'Install. 2', p3n=w.p3_name||'Install. 3';
    const p1c=w.p1_color||'var(--re-wa)', p2c=w.p2_color||'var(--re-wg)', p3c=w.p3_color||'var(--re-wb)';

    // Labels
    const lProd  = w.lbl_prod     || 'PRODUCTION';
    const lCons  = w.lbl_cons     || 'CONSOMMATION';
    const lGIn   = w.lbl_grid_in  || 'IMPORT RÉSEAU';
    const lGOut  = w.lbl_grid_out || 'INJECTION';
    const lAuto  = w.lbl_autoconso|| 'AUTOCONSO';
    const lDay   = w.lbl_day      || 'PRODUCTION JOUR';
    const lMonth = w.lbl_month    || 'PRODUCTION MOIS';
    const lNight = w.lbl_night    || 'CONSO NUIT';

    // Couleurs thème
    const cT=`var(--re-wt)`, cD=`var(--re-wtd)`, cG=`var(--re-wg)`, cA=`var(--re-wa)`, cB=`var(--re-wb)`, cP=`var(--re-wp)`;

    // Fonction ligne de flux animée
    const flowLine = (from_right=false, color='#f59e0b', speed=1.5, active=true) => html`
      <div style="flex:1;height:3px;background:${color}22;border-radius:2px;position:relative;overflow:hidden;">
        ${active ? html`<div style="position:absolute;top:0;height:100%;width:30%;background:${color};border-radius:2px;
          animation:_sf_flow_${from_right?'r':'l'} ${speed}s linear infinite;opacity:0.9;"></div>` : html``}
      </div>`;

    return html`
      <style>
        @keyframes _sf_scan{0%{left:-40%}100%{left:110%}}
        @keyframes _sf_flow_l{0%{left:-30%}100%{left:100%}}
        @keyframes _sf_flow_r{0%{right:-30%}100%{right:100%}}
        @keyframes _sf_pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes _sf_blink{0%,100%{opacity:1}50%{opacity:0}}
      </style>
      <div style="${sizeStyle}background:#050800;border:1px solid ${cA}22;border-radius:6px;
                  overflow:hidden;font-family:'Courier New',monospace;position:relative;">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;z-index:1;">
          <div style="position:absolute;width:40%;height:1px;background:${cA}55;animation:_sf_scan 5s linear infinite;"></div>
        </div>

        <!-- HEADER -->
        <div style="background:#0a0700;border-bottom:1px solid ${cA}15;padding:9px 14px;
                    display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:14px;letter-spacing:2px;color:${cA};">${w.header_title||'CENTRALE SOLAIRE — COMPLEXE SAINTE-CROIX'}</div>
            <div style="font-size:12px;color:${cD};margin-top:2px;">${w.header_sub||'3 INSTALLATIONS · SURVEILLANCE TEMPS RÉEL'}</div>
          </div>
          <div style="font-size:12px;color:${cG};border:1px solid ${cG}33;padding:3px 10px;border-radius:2px;">
            ⚡ ${totalW>10?'EN LIGNE':'VEILLE'}
          </div>
        </div>

        <!-- TOP : 3 INSTALLATIONS -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid ${cA}12;">
          ${[[p1n,p1c,p1w,p1d,p1m],[p2n,p2c,p2w,p2d,p2m],[p3n,p3c,p3w,p3d,p3m]].map((ins,i)=> html`
            <div style="padding:10px 12px;${i<2?`border-right:1px solid ${cA}10`:''};
                         background:${ins[2]>10?'#060900':'#050505'};">
              <div style="font-size:11px;color:${ins[1]};letter-spacing:1px;margin-bottom:4px;opacity:0.8;">${ins[0]}</div>
              <div style="font-size:22px;font-weight:900;color:${ins[1]};line-height:1;">
                ${fmt(ins[2])} <span style="font-size:11px;opacity:0.5;">W</span>
              </div>
              <div style="margin-top:5px;height:2px;background:#0a0800;border-radius:1px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100,((ins[2]||0)/800)*100)}%;background:${ins[1]};"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:${cD};">
                <span>${fmt(ins[3],1)} kWh/j</span>
                ${ins[4]!=null?html`<span style="color:${ins[1]};opacity:0.7;">${fmt(ins[4],0)} kWh/m</span>`:html``}
              </div>
            </div>`)}
        </div>

        <!-- CENTRE : FLUX D'ÉNERGIE -->
        <div style="display:flex;gap:0;border-bottom:1px solid ${cA}12;">
          <!-- Nœud production -->
          <div style="flex-shrink:0;padding:14px 12px;display:flex;flex-direction:column;
                      align-items:center;justify-content:center;min-width:130px;border-right:1px solid ${cA}10;">
            <div style="font-size:11px;color:${cA};letter-spacing:1px;margin-bottom:5px;">${lProd}</div>
            <div style="font-size:32px;font-weight:900;color:${cA};line-height:1;">${fmt(totalW)} <span style="font-size:13px;opacity:0.5;">W</span></div>
            <div style="margin-top:6px;height:3px;width:100%;background:#0a0800;border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(100,((totalW||0)/3000)*100)}%;background:${cA};"></div>
            </div>
            <div style="font-size:11px;color:${cD};margin-top:4px;">${fmt(dayKwh,1)} kWh auj.</div>
          </div>

          <!-- Zone flux central -->
          <div style="flex:1;padding:10px 8px;display:flex;flex-direction:column;justify-content:space-around;gap:6px;">
            <!-- Flux autoconsommation (prod → conso) -->
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="font-size:9px;color:${cG};letter-spacing:1px;width:55px;text-align:right;">${lAuto}</div>
              ${flowLine(false, 'var(--re-wg)', 1.5, totalW>10)}
              <div style="font-size:11px;font-weight:700;color:${cG};width:55px;">
                ${autoP!=null?autoP.toFixed(0)+'%':fmt(Math.max(0,Math.min(totalW,consW||0)))+'W'}
              </div>
            </div>
            <!-- Flux injection réseau -->
            ${hasInj ? html`
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="font-size:9px;color:${cP};letter-spacing:1px;width:55px;text-align:right;">${lGOut}</div>
              ${flowLine(false, 'var(--re-wp)', 2.5, true)}
              <div style="font-size:11px;font-weight:700;color:${cP};width:55px;">${fmt(injection)} W</div>
            </div>` : html``}
            <!-- Flux import réseau -->
            ${hasImp ? html`
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="font-size:9px;color:${cB};letter-spacing:1px;width:55px;text-align:right;">${lGIn}</div>
              ${flowLine(true, 'var(--re-wb)', 2, true)}
              <div style="font-size:11px;font-weight:700;color:${cB};width:55px;">${fmt(fromGrid)} W</div>
            </div>` : html``}
            ${!hasInj&&!hasImp ? html`
            <div style="font-size:11px;color:${cD};text-align:center;opacity:0.5;">Flux réseau nul</div>` : html``}
          </div>

          <!-- Nœud consommation -->
          <div style="flex-shrink:0;padding:14px 12px;display:flex;flex-direction:column;
                      align-items:center;justify-content:center;min-width:130px;border-left:1px solid ${cA}10;">
            <div style="font-size:11px;color:${cT};letter-spacing:1px;margin-bottom:5px;">${lCons}</div>
            <div style="font-size:32px;font-weight:900;color:${cT};line-height:1;">${fmt(consW)} <span style="font-size:13px;opacity:0.5;">W</span></div>
            <div style="margin-top:6px;height:3px;width:100%;background:#0a0800;border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(100,((consW||0)/5000)*100)}%;background:${cT};opacity:0.4;"></div>
            </div>
            <div style="font-size:11px;color:${cD};margin-top:4px;">${autoP!=null?fmt(autoP,0)+'% solaire':'--'}</div>
          </div>
        </div>

        <!-- OBJECTIF (si configuré) -->
        ${objPct!=null ? html`
        <div style="padding:8px 14px;border-bottom:1px solid ${cA}10;background:${cA}04;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:12px;color:${cD};">OBJECTIF MENSUEL</span>
            <span style="font-size:12px;font-weight:700;color:${cG};">
              ${fmt(objPct,0)}% ${objKwh!=null?`— ${fmt(monthKwh,1)}/${fmt(objKwh,0)} kWh`:''}
            </span>
          </div>
          <div style="height:4px;background:#0a0800;border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(100,objPct)}%;background:linear-gradient(90deg,${cG},${cA});border-radius:2px;"></div>
          </div>
        </div>` : html``}

        <!-- MÉTRIQUES BAS -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);">
          ${[
            [lDay,   dayKwh,   'kWh', 1, cA],
            [lMonth, monthKwh, 'kWh', 0, cG],
            [hasInj?lGOut:lGIn, hasInj?injection:fromGrid, 'W', 0, hasInj?cP:cB],
            [lNight, nightKwh, 'kWh', 1, cD],
          ].map((m,i) => html`
            <div style="padding:10px 12px;${i<3?`border-right:1px solid ${cA}08`:''};background:${cA}03;">
              <div style="font-size:10px;color:${m[4]};opacity:0.7;letter-spacing:1px;margin-bottom:3px;">${m[0]}</div>
              <div style="font-size:18px;font-weight:900;color:${m[4]};">
                ${m[1]!=null?m[1].toFixed(m[3]).replace('.',','):'--'}
                <span style="font-size:10px;opacity:0.5;"> ${m[2]}</span>
              </div>
            </div>`)}
        </div>

        <!-- FOOTER -->
        <div style="padding:5px 14px;display:flex;justify-content:space-between;font-size:10px;color:${cA}22;border-top:1px solid ${cA}08;">
          <span>SURVEILLANCE CENTRALISÉE</span>
          <span style="animation:_sf_blink 1.2s step-end infinite;color:${cG}44;">● TEMPS RÉEL</span>
        </div>
      </div>`;
  }

    _renderSolarWidget(w, sizeStyle, noBorder=false) {
    const fixedTab = w.active_tab != null ? parseInt(w.active_tab) : 0;
    const c = w.solar_config || {};
    const Sx = (id) => id && this.hass?.states[id] ? this.hass.states[id] : null;
    const stt = (id) => { const s = Sx(id); return s ? s.state : null; };
    const num = (id) => { const s = Sx(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; };
    const uni = (id) => Sx(id)?.attributes?.unit_of_measurement || '';
    const att = (id, a) => Sx(id)?.attributes?.[a];
    const toKwh = (id) => { const s = Sx(id); if (!s || ['unavailable','unknown'].includes(s.state)) return null; const v = parseFloat(s.state); if (isNaN(v)) return null; return /^wh$/i.test(s.attributes.unit_of_measurement||'kWh') ? v/1000 : v; };
    const fmt = (v, d=1) => v == null ? '--' : v.toLocaleString('fr-FR', {maximumFractionDigits: d});
    const FR = {
      // Phases de lune
      'new_moon':'Nouvelle lune','waxing_crescent':'Premier croissant','first_quarter':'Premier quartier',
      'waxing_gibbous':'Gibbeuse croissante','full_moon':'Pleine lune','waning_gibbous':'Gibbeuse décroissante',
      'last_quarter':'Dernier quartier','waning_crescent':'Dernier croissant',
      // Conditions météo
      'sunny':'Ensoleillé','clear':'Dégagé','clear-night':'Ciel clair','cloudy':'Nuageux','partlycloudy':'Partiellement nuageux',
      'partly-cloudy-day':'Partiellement nuageux','partly-cloudy-night':'Partiellement nuageux','overcast':'Couvert',
      'rainy':'Pluvieux','pouring':'Forte pluie','drizzle':'Bruine','snowy':'Neigeux','snowy-rainy':'Pluie et neige',
      'fog':'Brouillard','hail':'Grêle','lightning':'Orage','lightning-rainy':'Orage','windy':'Venteux',
      'windy-variant':'Venteux','exceptional':'Exceptionnel',
      // États génériques
      'on':'Activé','off':'Désactivé','home':'Présent','not_home':'Absent','away':'Absent',
      'open':'Ouvert','closed':'Fermé','locked':'Verrouillé','unlocked':'Déverrouillé',
      'unavailable':'Indisponible','unknown':'Inconnu','idle':'En veille','active':'Actif',
      'heat':'Chauffage','cool':'Refroidissement','dry':'Déshumidification','auto':'Auto','heat_cool':'Auto',
      'rising':'Montant','setting':'Descendant','above_horizon':'Au-dessus de l\'horizon','below_horizon':'Sous l\'horizon',
    };
    const frState = (val) => {
      if (val == null) return val;
      const k = String(val).toLowerCase().trim().replace(/\s+/g,'_');
      return FR[k] || val;
    };

    // ── Tuile générique HUD ──
    const tile = (label, value, unit, col, icon) => html`
      <div style="flex:1;min-width:0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);
                  border-radius:12px;padding:8px 11px;display:flex;flex-direction:column;gap:2px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#94a3b8;font-weight:600;">
          ${icon ? html`<ha-icon icon="${icon}" style="--mdc-icon-size:15px;color:${col};"></ha-icon>` : html``}
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</span>
        </div>
        <div style="font-size:18px;font-weight:800;color:#f1f5f9;line-height:1.1;">
          ${value}<span style="font-size:13px;font-weight:600;color:${col};"> ${unit||''}</span>
        </div>
      </div>`;

    // ── Palette de couleurs pour les panneaux sans couleur explicite ──
    const PANEL_PALETTE = ['#f59e0b','#38bdf8','#22c55e','#ec4899','#a78bfa','#fb923c','#06b6d4','#84cc16'];

    // ── Liste des installations solaires : tableau dynamique `c.panels`
    //    (modifiable dans l'éditeur — ajouter/retirer une installation,
    //    ex. une future installation côté Ouest) avec repli sur l'ancien
    //    format figé p1/p2/p3 pour ne rien casser sur les configs existantes.
    const panelList = (c.panels && c.panels.length)
      ? c.panels.map((p, i) => ({
          n: p.name || ('Panneau ' + (i + 1)),
          w: p.power_entity,
          d: p.daily_entity,
          m: p.monthly_entity,
          col: p.color || PANEL_PALETTE[i % PANEL_PALETTE.length],
        }))
      : [
          { n: c.p1_name || 'Maison', w: c.p1_w || c.beem_m_w, d: c.p1_d || c.beem_m_d, m: c.beem_m_m, col: '#f59e0b' },
          { n: c.p2_name || 'Spa',    w: c.p2_w || c.beem_s_w, d: c.p2_d || c.beem_s_d, m: c.beem_s_m, col: '#38bdf8' },
          { n: c.p3_name || 'IBC',    w: c.p3_w || c.beem_i_w, d: c.p3_d || c.beem_i_d, m: c.beem_i_m, col: '#22c55e' },
        ];

    // ── Bandeaux jour / mois (onglet Solaire) — dérivés de panelList ──
    const dayDefs = panelList
      .filter(p => p.d)
      .map(p => ({ l: 'Jour - ' + p.n, e: p.d, col: p.col }));
    const monthDefs = panelList
      .filter(p => p.m)
      .map(p => ({ l: 'Mois - ' + p.n, e: p.m, col: p.col }));
    const dayTotalEntity = w.dt_entity || c.solar_daily_kwh;
    const dayTotal = dayTotalEntity != null
      ? toKwh(dayTotalEntity)
      : dayDefs.reduce((a, d) => { const v = toKwh(d.e); return v == null ? a : (a == null ? v : a + v); }, null);
    const monthTotal = monthDefs.reduce((a, d) => { const v = toKwh(d.e); return v == null ? a : (a == null ? v : a + v); }, null);
    const stripTile = (label, val, col, forceKwh) => html`
      <div style="flex:1;min-width:0;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);
                  border-radius:10px;padding:9px 11px;text-align:center;">
        <div style="font-size:12px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
        <div style="font-size:17px;font-weight:800;color:#f1f5f9;margin-top:1px;line-height:1.1;">
          ${val==null?'--':fmt(val,3)}<span style="font-size:12px;font-weight:600;color:${col};"> kWh</span>
        </div>
      </div>`;

    // ════ ONGLET 0 — SOLAIRE ════
    const renderSolar = () => {
      const totalNow = num(c.total_now) != null ? num(c.total_now)
        : panelList.reduce((a, p) => { const v = num(p.w); return v == null ? a : a + v; }, 0);
      const auto = num(c.autoconso_pct);
      return html`
        <div style="display:flex;flex-direction:column;gap:7px;height:100%;overflow:hidden;">
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:14px;
                      background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:14px;padding:9px 14px;">
            <div>
              <div style="font-size:13px;color:#94a3b8;font-weight:600;letter-spacing:1px;">PRODUCTION INSTANTANÉE</div>
              <div style="font-size:27px;font-weight:900;color:#f59e0b;line-height:1.05;text-shadow:0 0 14px rgba(245,158,11,.4);">
                ${fmt(totalNow,0)}<span style="font-size:14px;color:#94a3b8;font-weight:700;"> W</span>
              </div>
            </div>
            ${auto!=null ? html`
              <div style="text-align:center;">
                <div style="font-size:23px;font-weight:900;color:#22c55e;line-height:1;">${fmt(auto,0)}%</div>
                <div style="font-size:12px;color:#94a3b8;font-weight:600;">AUTOCONSO</div>
              </div>` : html``}
          </div>
          <div style="flex-shrink:0;display:flex;gap:7px;flex-wrap:wrap;">
            ${panelList.map(p => html`
              <div style="flex:1;min-width:90px;background:rgba(255,255,255,.04);border:1px solid ${p.col}33;border-radius:12px;padding:8px;text-align:center;">
                <div style="font-size:13px;color:#94a3b8;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.n}</div>
                <div style="font-size:19px;font-weight:800;color:${p.col};line-height:1.1;margin-top:1px;">${fmt(num(p.w),0)}<span style="font-size:12px;"> W</span></div>
                ${num(p.d)!=null ? html`<div style="font-size:12px;color:#64748b;margin-top:2px;">${fmt(toKwh(p.d),2)} kWh aujourd'hui</div>` : html``}
              </div>`)}
          </div>
          <div style="flex-shrink:0;display:flex;gap:7px;">
            ${num(c.grid_flow)!=null ? tile('Réseau', fmt(num(c.grid_flow),0), uni(c.grid_flow)||'W', '#ef4444', 'mdi:transmission-tower') : html``}
            ${num(c.main_cons)!=null ? tile('Consommation', fmt(num(c.main_cons),0), uni(c.main_cons)||'W', '#f97316', 'mdi:home-lightning-bolt') : html``}
            ${num(c.autoconso_nuit)!=null ? tile('Autoconso nuit', fmt(toKwh(c.autoconso_nuit),2), 'kWh', '#818cf8', 'mdi:weather-night') : html``}
          </div>
          ${monthDefs.length ? html`<div style="flex-shrink:0;display:flex;gap:6px;flex-wrap:wrap;">${monthDefs.map(d=>stripTile(d.l, toKwh(d.e), d.col))}${stripTile(w.mt_label||'Mois - Total', monthTotal, '#a78bfa')}</div>` : html``}
          ${dayDefs.length ? html`<div style="flex-shrink:0;display:flex;gap:6px;flex-wrap:wrap;">${dayDefs.map(d=>stripTile(d.l, toKwh(d.e), d.col))}${stripTile(w.dt_label||'Jour - Total', dayTotal, '#a78bfa')}</div>` : html``}</div>`;
    };

    // ════ ONGLET 1 — MÉTÉO ════
    const renderMeteo = () => {
      const wxId = c.weather_entity || c.entity_weather;
      const wx = Sx(wxId), wa = wx ? wx.attributes : {};
      const wItems = [
        { e:c.w1_e, l:c.w1_l||'Condition',  i:c.w1_i||'mdi:weather-partly-cloudy' },
        { e:c.w2_e, l:c.w2_l||'Vent',       i:c.w2_i||'mdi:weather-windy' },
        { e:c.w3_e, l:c.w3_l||'Azimut',     i:c.w3_i||'mdi:sun-angle' },
        { e:c.w4_e, l:c.w4_l||'Élévation',  i:c.w4_i||'mdi:compass-outline' },
        { e:c.w5_e, l:c.w5_l||'Pic du jour',i:c.w5_i||'mdi:solar-power-variant' },
        { e:c.w6_e, l:c.w6_l||'Prévision',  i:c.w6_i||'mdi:chart-line' },
      ].filter(x => x.e && Sx(x.e));
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;height:100%;overflow-y:auto;">
          <div style="flex-shrink:0;display:flex;gap:10px;">
            ${num(c.temp_ext)!=null ? tile('Température', fmt(num(c.temp_ext),1), '°C', '#f97316', 'mdi:thermometer') : html``}
            ${num(c.hum_ext)!=null ? tile('Humidité', fmt(num(c.hum_ext),0), '%', '#38bdf8', 'mdi:water-percent') : html``}
            ${stt(c.moon_entity) ? tile('Lune', frState(stt(c.moon_entity)), '', '#a78bfa', 'mdi:moon-waning-crescent') : html``}
          </div>
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:start;">
            ${wItems.map(x => {
              const s = Sx(x.e);
              const v = parseFloat(s.state);
              return tile(x.l, isNaN(v)?frState(s.state):fmt(v,1), s.attributes.unit_of_measurement||'', '#22d3ee', x.i);
            })}
            ${wItems.length===0 ? html`<div style="grid-column:span 2;text-align:center;color:#64748b;font-size:13px;padding:20px;">Aucune entité météo configurée</div>` : html``}
          </div>
        </div>`;
    };

    // ════ ONGLET 2 — BATTERIES ════
    const renderBatt = () => {
      const batts = [
        { n:c.b1_n||'Batterie 1', s:c.b1_s||c.bat1_soc, t:c.b1_t||c.b1_temp, cap:c.b1_cap, out:c.b1_out||c.b1_v, conn:c.b1_conn },
        { n:c.b2_n||'Batterie 2', s:c.b2_s||c.bat2_soc, t:c.b2_t||c.b2_temp, cap:c.b2_cap, out:c.b2_out||c.b2_v, conn:c.b2_conn },
        { n:c.b3_n||'Batterie 3', s:c.b3_s||c.bat3_soc, t:c.b3_t||c.b3_temp, cap:c.b3_cap, out:c.b3_out||c.b3_v, conn:c.b3_conn },
      ].filter(b => b.s && Sx(b.s));
      const battCard = (b) => {
        const soc = num(b.s);
        const socCol = soc==null?'#475569':soc<=20?'#ef4444':soc<=50?'#f59e0b':'#22c55e';
        const connState = stt(b.conn);
        const online = connState ? ['on','connected','online','true','connecté'].includes(String(connState).toLowerCase()) : null;
        return html`
          <div style="flex:1;min-width:200px;background:rgba(255,255,255,.04);border:1px solid ${socCol}33;border-radius:14px;padding:13px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:15px;font-weight:700;color:#f1f5f9;">${b.n}</span>
              ${online!=null ? html`<span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;background:${online?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)'};color:${online?'#22c55e':'#ef4444'};">${online?'EN LIGNE':'HORS LIGNE'}</span>` : html``}
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="font-size:34px;font-weight:900;color:${socCol};line-height:1;">${fmt(soc,0)}<span style="font-size:15px;"> %</span></div>
              <div style="flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100,Math.max(0,soc||0))}%;background:${socCol};box-shadow:0 0 8px ${socCol}88;border-radius:5px;transition:width .6s;"></div>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px;color:#94a3b8;">
              ${num(b.t)!=null ? html`<span style="background:rgba(255,255,255,.05);border-radius:6px;padding:3px 8px;">🌡 ${fmt(num(b.t),1)}°C</span>` : html``}
              ${num(b.cap)!=null ? html`<span style="background:rgba(255,255,255,.05);border-radius:6px;padding:3px 8px;">⚡ ${fmt(num(b.cap),2)} ${uni(b.cap)}</span>` : html``}
              ${num(b.out)!=null ? html`<span style="background:rgba(255,255,255,.05);border-radius:6px;padding:3px 8px;">↔ ${fmt(num(b.out),0)} ${uni(b.out)||'W'}</span>` : html``}
            </div>
          </div>`;
      };
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;height:100%;overflow-y:auto;">
          ${num(c.batt_total_power)!=null ? html`
            <div style="flex-shrink:0;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.2);border-radius:14px;padding:12px 16px;text-align:center;">
              <div style="font-size:13px;color:#94a3b8;font-weight:600;letter-spacing:1px;">PUISSANCE BATTERIE TOTALE</div>
              <div style="font-size:30px;font-weight:900;color:#818cf8;line-height:1.1;">${fmt(num(c.batt_total_power),0)}<span style="font-size:14px;color:#94a3b8;"> ${uni(c.batt_total_power)||'W'}</span></div>
            </div>` : html``}
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:10px;align-content:start;">
            ${c.hide_battery_cards ? html`` : batts.map(b => battCard(b))}
            ${(!c.hide_battery_cards && batts.length===0) ? html`<div style="width:100%;text-align:center;color:#64748b;font-size:13px;padding:20px;">Aucune batterie configurée</div>` : html``}
          </div>
        </div>`;
    };

    // ════ ONGLET 3 — ÉCONOMIES ════
    const renderEco = () => {
      const objPct = num(c.total_obj_pct || c.prod_obj_pct || c.solar_pct_entity);
      const objKwh = num(c.total_obj_kwh || c.obj_kwh_target || c.solar_target);
      const euro = (v) => v==null?'--':v.toLocaleString('fr-FR',{maximumFractionDigits:2})+' €';
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;height:100%;overflow-y:auto;">
          ${num(c.eco_money)!=null ? html`
            <div style="flex-shrink:0;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:14px;padding:14px 18px;text-align:center;">
              <div style="font-size:13px;color:#94a3b8;font-weight:600;letter-spacing:1px;">${(c.eco_money_label||'ÉCONOMIES RÉALISÉES')}</div>
              <div style="font-size:38px;font-weight:900;color:#22c55e;line-height:1.05;text-shadow:0 0 18px rgba(34,197,94,.4);">${euro(num(c.eco_money))}</div>
            </div>` : html``}
          <div style="flex-shrink:0;display:flex;gap:10px;">
            ${num(c.eco_day_euro)!=null ? tile(c.eco_day_label||'Gain / jour', euro(num(c.eco_day_euro)), '', '#22c55e', 'mdi:cash') : html``}
            ${num(c.e2_e)!=null ? tile(c.e2_l||'Gain / mois', euro(num(c.e2_e)), '', '#22c55e', 'mdi:calendar-month') : html``}
            ${num(c.eco_year_euro||c.e3_e)!=null ? tile(c.eco_year_label||c.e3_l||'Gain / an', euro(num(c.eco_year_euro||c.e3_e)), '', '#22c55e', 'mdi:calendar') : html``}
          </div>
          <div style="flex-shrink:0;display:flex;gap:10px;">
            ${num(c.kwh_price)!=null ? tile(c.e1_l||'Tarif kWh', fmt(num(c.kwh_price),3), uni(c.kwh_price)||'€', '#f59e0b', 'mdi:currency-eur') : html``}
            ${num(c.e1_e)!=null && c.e1_e!==c.kwh_price ? tile(c.e1_l||'Tarif EDF', fmt(num(c.e1_e),3), uni(c.e1_e)||'€', '#f59e0b', 'mdi:flash') : html``}
          </div>
          ${objPct!=null ? html`
            <div style="flex-shrink:0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:13px 16px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:7px;">
                <span style="color:#94a3b8;">Objectif mensuel</span>
                <span style="color:#22c55e;">${fmt(objPct,0)}%${objKwh!=null?` · ${fmt(objKwh,0)} kWh`:''}</span>
              </div>
              <div style="height:10px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100,Math.max(0,objPct))}%;background:linear-gradient(90deg,#22c55e,#86efac);box-shadow:0 0 8px rgba(34,197,94,.5);border-radius:5px;transition:width .8s;"></div>
              </div>
            </div>` : html``}
        </div>`;
    };

    const body = fixedTab===1 ? renderMeteo() : fixedTab===2 ? renderBatt() : fixedTab===3 ? renderEco() : renderSolar();

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} background:#0a0c14;border-color:rgba(245,158,11,.2);overflow:hidden;display:flex;flex-direction:column;padding:10px;">
        ${body}
      </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const th = this.config.theme || {};
    // Injecter CSS variables couleurs widgets dans le shadow root
    if (!this.__thStyleEl) {
      this.__thStyleEl = document.createElement('style');
      this.__thStyleEl.id = 're2-theme-vars';
      this.shadowRoot?.appendChild(this.__thStyleEl);
    }
    this.__thStyleEl.textContent = `:host {
      --re-wt:  ${th.widget_text     || '#e2e8f0'};
      --re-wtd: ${th.widget_text_dim || '#94a3b8'};
      --re-wg:  ${th.widget_green    || '#22c55e'};
      --re-wr:  ${th.widget_red      || '#ef4444'};
      --re-wb:  ${th.widget_blue     || '#38bdf8'};
      --re-wa:  ${th.widget_amber    || '#f59e0b'};
      --re-wp:  ${th.widget_purple   || '#a78bfa'};
    }`;
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
    // Niveau de menace : DANGER si biohazard actif, sinon CAUTION si statut KO, sinon FINE
    const bioActive      = (this.config.biohazard_entities||[]).filter(e => this.hass?.states[e]?.state === 'on');
    let statusText, statusColor, threatLevel;
    if (bioActive.length)      { statusText = 'DANGER';  statusColor = '#ef4444'; threatLevel = 3; }
    else if (!statusOk)        { statusText = 'CAUTION'; statusColor = '#f59e0b'; threatLevel = 2; }
    else                       { statusText = 'FINE';    statusColor = '#22c55e'; threatLevel = 1; }
    // ECG : plus le niveau est haut, plus le tracé s'emballe
    const ecgClass = threatLevel === 3 ? 're-ecg-danger' : (threatLevel === 2 ? 're-ecg-caution' : '');

    return html`
      <div class="re-container ${(this.config.biohazard_entities||[]).some(e=>this.hass?.states[e]?.state==='on') ? 're-biohazard' : ''} ${(this.config.theme||{}).high_contrast ? 're-hc' : ''}" style="height:${parseInt(this.config.card_height) || 550}px;${(() => {
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
        ${this._searchOpen ? (() => {
          const q = (this._searchQuery || '').toLowerCase().trim();
          const results = [];
          (categories||[]).forEach((cat, ci) => (cat.submenus||[]).forEach((sub, si) => {
            (sub.sensors||[]).forEach(s => {
              const eid = typeof s === 'object' ? s.entity : s;
              if (!eid) return;
              const st = this.hass?.states[eid];
              const fn = (st?.attributes?.friendly_name || (typeof s==='object'?s.name:'') || eid);
              const hay = (eid + ' ' + fn + ' ' + cat.name + ' ' + sub.name).toLowerCase();
              if (q && hay.includes(q)) results.push({ eid, fn, cat:cat.name, sub:sub.name, ci, si });
            });
          }));
          return html`
            <div class="re-search-overlay">
              <div class="re-search-head">
                <ha-icon icon="mdi:magnify" style="--mdc-icon-size:22px;color:var(--ec-hud,#22d3ee);"></ha-icon>
                <input id="re-search-input" class="re-search-input" placeholder="Rechercher une entité, une zone…"
                       .value="${this._searchQuery||''}"
                       @input="${e=>{ this._searchQuery=e.target.value; this.requestUpdate(); }}" />
                <button class="re-search-close" @click="${()=>{ this._searchOpen=false; this._searchQuery=''; this.requestUpdate(); }}">✕</button>
              </div>
              <div class="re-search-results">
                ${!q ? html`<div class="re-search-hint">Tape au moins un mot — recherche dans toutes les zones du complexe.</div>`
                  : results.length===0 ? html`<div class="re-search-hint">Aucun résultat pour « ${this._searchQuery} ».</div>`
                  : results.slice(0,60).map(r => {
                    const st = this.hass?.states[r.eid];
                    const val = st ? (st.state + (st.attributes.unit_of_measurement||'')) : 'N/A';
                    return html`
                      <div class="re-search-row" @click="${()=>{ this._activeMainMenu=r.ci; this._activeSubMenu=r.si; this._activeFilter=null; this._searchOpen=false; this._searchQuery=''; this._handleAction(r.eid); this.requestUpdate(); }}">
                        <div style="flex:1;min-width:0;">
                          <div class="re-search-name">${r.fn}</div>
                          <div class="re-search-path">${r.cat} › ${r.sub}</div>
                        </div>
                        <div class="re-search-val">${val}</div>
                      </div>`;
                  })}
                ${results.length>60 ? html`<div class="re-search-hint">… et ${results.length-60} autres. Affine ta recherche.</div>` : html``}
              </div>
            </div>`;
        })() : html``}
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
            <button class="re-search-btn" title="Recherche globale"
                    @click="${()=>{ this._searchOpen=!this._searchOpen; this.requestUpdate();
                      if(this._searchOpen) setTimeout(()=>this.shadowRoot.querySelector('#re-search-input')?.focus(),60); }}">
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>
            <span class="re-status-text" style="color:${statusColor};">STATUS: ${statusText}</span>
            <svg class="re-ecg ${ecgClass}" viewBox="0 0 80 24" preserveAspectRatio="none">
              <polyline points="0,12 20,12 25,2 30,22 35,12 55,12 60,6 65,18 70,12 80,12" stroke="${statusColor}" fill="none" stroke-width="1.5"/>
            </svg>
          </div>
        </div>

        ${(() => {
          const alerts = this._collectAlerts();
          if (!alerts.length) return html``;
          const worst = alerts.some(a=>a.level==='crit') ? '#ef4444' : '#f59e0b';
          const sep = html`<span style="color:rgba(255,255,255,.3);margin:0 18px;">●</span>`;
          const line = alerts.map((a,i) => html`${i>0?sep:html``}<span style="color:${a.level==='crit'?'#fca5a5':'#fde68a'};">${a.level==='crit'?'⛔':'⚠'} ${a.msg}</span>`);
          // durée proportionnelle au nombre d'alertes (lisible)
          const dur = Math.max(14, alerts.length * 7);
          return html`
            <div class="re-ticker" style="border-color:${worst}55;">
              <div class="re-ticker-tag" style="background:${worst};">${alerts.length} ALERTE${alerts.length>1?'S':''}</div>
              <div class="re-ticker-viewport">
                <div class="re-ticker-track" style="animation-duration:${dur}s;">
                  <span class="re-ticker-seg">${line}</span>
                  <span class="re-ticker-seg" aria-hidden="true">${line}</span>
                </div>
              </div>
            </div>`;
        })()}

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
                   @click="${() => { this._activeMainMenu = index; this._activeSubMenu = 0; this._activeFilter = null; try{localStorage.setItem('re2_nav',JSON.stringify({cat:index,sub:0}));}catch(e){} this._beep(880); this._triggerGlitch(); this.requestUpdate(); }}">
                <span style="margin-right:4px;font-size:12px;">${emoji}</span>${cat.name}
              </div>`;
          })}
        </div>

        <div class="re-body">
          <div class="re-sidebar"><span class="re-hud-cut-tl"></span><span class="re-hud-cut-br"></span>
            ${activeCategory.submenus ? activeCategory.submenus.map((sub, index) => html`
              <button class="submenu-btn ${this._activeSubMenu === index ? 'active' : ''}"
                      @click="${() => { this._activeSubMenu = index; this._activeFilter = null; try{localStorage.setItem('re2_nav',JSON.stringify({cat:this._activeMainMenu,sub:index}));}catch(e){} this._beep(660); this.requestUpdate(); }}">
                <ha-icon icon="${sub.icon || 'mdi:chevron-right'}"></ha-icon>
                <span>${sub.name}</span>
              </button>
            `) : html``}
          </div>
          <div class="re-content-container ${this._glitch ? 're-glitch' : ''}"><span class="re-hud-cut-tl"></span><span class="re-hud-cut-br"></span><div class="re-hexbg"></div><div class="re-watermark" style="background-image:url('${this.config.logo || '/local/Umbrella.png'}');"></div><div class="re-scanlines"></div>
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
                  ? html`<div class="design-grid" style="${(activeSubMenu.widgets || []).length === 1 ? 'height:100%;' : ''}">${(activeSubMenu.widgets || []).map(w => this._renderDesignWidget(w, (activeSubMenu.widgets || []).length === 1))}</div>`
                  : html`
                      <div class="re-section-head">
                        <span class="re-section-bar"></span>
                        <span class="re-section-label">SECTEUR : ${activeSubMenu.name || ''}</span>
                        <span class="re-section-id">REF#${String((this._activeMainMenu*10)+this._activeSubMenu).padStart(4,'0')} // SEC-LVL-4</span>
                      </div>
                      <div class="re-sensor-grid re-cascade" data-cascade="${this._activeMainMenu}-${this._activeSubMenu}-${effectiveFilter}">
                        ${(effectiveFilter === 'all'
                          ? sensorsRaw
                          : sensorsRaw.filter(id => {
                              const s = (activeSubMenu.sensors || []).find(s => (s.entity||s) === id);
                              return s && s.type === effectiveFilter;
                            })
                        ).map((id, idx) => html`<div class="re-cascade-item" style="animation-delay:${Math.min(idx*35, 700)}ms;">${this.renderEntity(id)}</div>`)}
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
      .re-search-btn { background: transparent; border: 1px solid var(--ec-hud,#22d3ee); border-radius: 6px;
        color: var(--ec-hud,#22d3ee); cursor: pointer; padding: 3px 7px; display: flex; align-items: center; }
      .re-search-btn:hover { background: rgba(34,211,238,.12); }
      .re-search-btn ha-icon { --mdc-icon-size: 18px; }
      .re-search-overlay { position: absolute; inset: 0; z-index: 70; background: rgba(5,8,15,.97);
        display: flex; flex-direction: column; padding: 16px; backdrop-filter: blur(3px); }
      .re-search-head { display: flex; align-items: center; gap: 10px; border: 1px solid var(--ec-hud,#22d3ee);
        border-radius: 10px; padding: 10px 14px; background: #0b121d; }
      .re-search-input { flex: 1; background: transparent; border: none; outline: none; color: #f1f5f9;
        font-size: 18px; font-family: inherit; }
      .re-search-close { background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }
      .re-search-close:hover { color: #ef4444; }
      .re-search-results { flex: 1; overflow-y: auto; margin-top: 12px; display: flex; flex-direction: column; gap: 6px;
        scrollbar-width: none; }
      .re-search-results::-webkit-scrollbar { display: none; }
      .re-search-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px;
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); cursor: pointer; transition: .15s; }
      .re-search-row:hover { background: rgba(34,211,238,.1); border-color: var(--ec-hud,#22d3ee); transform: translateX(3px); }
      .re-search-name { font-size: 15px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .re-search-path { font-size: 12px; color: #64748b; margin-top: 2px; }
      .re-search-val { font-size: 15px; font-weight: 800; color: var(--ec-hud,#22d3ee); white-space: nowrap; }
      .re-search-hint { font-size: 14px; color: #64748b; text-align: center; padding: 24px; }
      .re-status-text { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
      .re-ecg-caution { animation: re-ecg-pulse 1.2s ease-in-out infinite; }
      .re-ecg-danger  { animation: re-ecg-pulse 0.45s ease-in-out infinite; }
      @keyframes re-ecg-pulse { 0%,100% { opacity:1; transform:scaleY(1); } 50% { opacity:.55; transform:scaleY(1.4); } }
      .re-status-text { animation: none; }
      .re-biohazard .re-status-text { animation: batt-flash 0.7s infinite alternate; }
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
      .re-content-scroll { flex: 1; overflow-y: auto; padding: 12px; min-height: 0; display: flex; flex-direction: column; }
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
      /* ── Bandeau d'alertes défilant ── */
      .re-ticker { display: flex; align-items: stretch; gap: 0; margin-top: 8px; flex-shrink: 0;
        background: rgba(10,12,20,.85); border: 1px solid; border-radius: 8px; overflow: hidden; height: 30px; }
      .re-ticker-tag { display: flex; align-items: center; padding: 0 12px; font-size: 12px; font-weight: 800;
        color: #0a0c14; letter-spacing: .5px; white-space: nowrap; flex-shrink: 0; }
      .re-ticker-viewport { flex: 1; overflow: hidden; position: relative; display: flex; align-items: center; }
      .re-ticker-track { display: inline-flex; white-space: nowrap; will-change: transform;
        animation-name: re-ticker-scroll; animation-timing-function: linear; animation-iteration-count: infinite; }
      .re-ticker-seg { display: inline-block; padding: 0 24px; font-size: 13px; font-weight: 700; line-height: 30px; }
      @keyframes re-ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .re-ticker:hover .re-ticker-track { animation-play-state: paused; }
      .re-biohazard { --ec-hud: #ef4444; --ec-hud-border: rgba(239,68,68,.45); }
      .re-biohazard .re-umbrella-icon { animation-duration: 1.4s; }
      .re-boot { position: absolute; inset: 0; z-index: 60; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 14px; background: #05080f;
        animation: re-boot-out .4s ease 1.25s forwards; }
      .re-boot-bar { width: 260px; height: 8px; border: 1px solid #22d3ee55; border-radius: 4px; overflow: hidden; }
      .re-boot-bar div { height: 100%; width: 0; background: linear-gradient(90deg,#22d3ee,#ef4444);
        animation: re-boot-fill 1.3s ease forwards; box-shadow: 0 0 10px #22d3ee; }
      .re-boot-dots { animation: batt-flash 0.6s infinite alternate; }

      /* ═══ #1 FOND HEXAGONAL (NEST) ═══ */
      .re-content-container { position: relative; }
      .re-hexbg { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: .05;
        background-image:
          radial-gradient(circle at 50% 50%, var(--ec-hud,#22d3ee) 0, transparent 60%),
          repeating-linear-gradient(60deg,  rgba(255,255,255,.6) 0 1px, transparent 1px 26px),
          repeating-linear-gradient(-60deg, rgba(255,255,255,.6) 0 1px, transparent 1px 26px),
          repeating-linear-gradient(0deg,   rgba(255,255,255,.6) 0 1px, transparent 1px 45px);
        background-size: 100% 100%, 30px 52px, 30px 52px, 52px 45px;
        animation: re-hex-drift 40s linear infinite; }
      @keyframes re-hex-drift { from { background-position: 0 0,0 0,0 0,0 0; } to { background-position: 0 0,60px 104px,-60px 104px,104px 0; } }

      /* ═══ #7 FILIGRANE LOGO ═══ */
      .re-watermark { position: absolute; top: 50%; left: 50%; width: 60%; height: 60%;
        transform: translate(-50%,-50%); z-index: 0; pointer-events: none; opacity: .035;
        background-repeat: no-repeat; background-position: center; background-size: contain;
        filter: grayscale(1) brightness(2); }
      .re-biohazard .re-watermark { opacity: .06; filter: none; }
      /* le contenu repasse au-dessus de la texture */
      .re-filter-bar, .re-content-scroll { position: relative; z-index: 1; }

      /* ═══ #4 EN-TÊTE DE SECTION ═══ */
      .re-section-head { display: flex; align-items: center; gap: 10px; padding: 4px 2px 12px;
        flex-shrink: 0; }
      .re-section-bar { width: 5px; height: 18px; background: var(--ec-hud,#22d3ee);
        box-shadow: 0 0 8px var(--ec-hud,#22d3ee); border-radius: 1px; flex-shrink: 0; }
      .re-section-label { font-size: 14px; font-weight: 800; letter-spacing: 2px; color: #e2e8f0; }
      .re-section-id { margin-left: auto; font-size: 12px; letter-spacing: 1px; color: #475569;
        font-family: 'Courier New', monospace; }

      /* ═══ #10 CASCADE D'ARRIVÉE ═══ */
      .re-cascade-item { animation: re-cascade-in .42s cubic-bezier(.2,.8,.3,1) both; }
      @keyframes re-cascade-in { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }

      /* ═══ #5 TUILES À COINS COUPÉS (HUD) ═══ */
      .re-sensor-grid .sensor-card {
        clip-path: polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px);
        border-radius: 2px; }
      /* ═══ MODE CONTRASTE RENFORCÉ (accessibilité) ═══ */
      .re-hc .re-header, .re-hc .re-nav, .re-hc .re-sidebar, .re-hc .re-content-container { background: #000 !important; border-width: 2px !important; border-color: #38e0ff !important; }
      .re-hc .re-title { color: #ffffff !important; font-size: calc(var(--ec-fs-title, 18px) + 2px) !important; }
      .re-hc .main-nav-item { color: #cbd5e1 !important; font-size: calc(var(--ec-fs-nav, 12px) + 2px) !important; }
      .re-hc .main-nav-item.active { color: #ffffff !important; background: rgba(56,224,255,.12) !important; }
      .re-hc .submenu-btn { color: #e2e8f0 !important; font-size: calc(var(--ec-fs-side, 12px) + 2px) !important; }
      .re-hc .sensor-name, .re-hc .filter-tab { color: #e2e8f0 !important; }
      .re-hc .sensor-value { color: #ffffff !important; font-size: calc(var(--ec-fs-value, 18px) + 2px) !important; }
      .re-hc .sensor-card { border-width: 2px !important; }
      .re-nav, .re-sidebar, .re-content-scroll, .re-sensor-grid, .design-grid {
        scrollbar-width: none; -ms-overflow-style: none; }
      .re-nav::-webkit-scrollbar, .re-sidebar::-webkit-scrollbar,
      .re-content-scroll::-webkit-scrollbar, .re-sensor-grid::-webkit-scrollbar,
      .design-grid::-webkit-scrollbar { display: none; width: 0; height: 0; }
      @keyframes re-boot-fill { to { width: 100%; } }
      @keyframes re-boot-out  { to { opacity: 0; visibility: hidden; } }
      .re-sensor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
      .design-grid { display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; width: 100%; flex: 0 0 auto; }
      .dw-card { background: #0a0a0a; cursor: pointer; position: relative; transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden; box-sizing: border-box; flex-shrink: 0; min-height: 60px; border: 1px solid #1e1e1e; }
      .dw-card.no-border { border-color: transparent !important; background: transparent; }
      .dw-card.no-border:hover { border-color: #222 !important; }
      .dw-card::before { content:''; position:absolute; top:0; left:0; width:2px; height:100%; transition: background 0.2s; }
      .dw-card.no-border::before { display: none; }
      .dw-card:hover { border-color: #333; }

      /* ═══════════════════════════════════════════════════════════
         RESPONSIVE SMARTPHONE (≤ 480px)
         Layout : sidebar fixe → barre horizontale défilante
         Hauteur fixe → auto (override l'inline style via !important)
      ═══════════════════════════════════════════════════════════ */
      @media (max-width: 480px) {

        /* ─── Conteneur principal ─── */
        .re-container {
          height: auto !important;
          min-height: 0;
          gap: 6px;
        }

        /* ─── En-tête ─── */
        .re-header {
          padding: 7px 10px;
          flex-wrap: wrap;
          gap: 4px;
        }
        .re-logo { gap: 7px; }
        .re-umbrella { width: 30px; height: 30px; }
        .re-title {
          font-size: max(13px, var(--ec-fs-title, 13px)) !important;
          letter-spacing: 1px;
        }
        .re-subtitle { display: none; }
        .re-status { gap: 4px; flex-shrink: 0; }
        .re-status-text { font-size: 11px; letter-spacing: 0; }
        .re-ecg { width: 40px; }
        .re-search-btn ha-icon { --mdc-icon-size: 15px; }
        .re-bio-banner { font-size: 11px; padding: 4px 8px; max-width: 100%; }

        /* ─── Ticker alertes ─── */
        .re-ticker { height: 26px; }
        .re-ticker-seg { font-size: 11px; line-height: 26px; padding: 0 14px; }
        .re-ticker-tag { font-size: 11px; padding: 0 8px; }

        /* ─── Nav catégories : scroll horizontal ─── */
        .re-nav {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #1e2d3d transparent;
          flex-wrap: nowrap;
          border-radius: 6px;
        }
        .re-nav::-webkit-scrollbar { display: block; height: 3px; }
        .re-nav::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 3px; }
        .main-nav-item {
          font-size: 11px !important;
          padding: 8px 9px;
          white-space: nowrap;
        }

        /* ─── Corps : vertical au lieu d'horizontal ─── */
        .re-body {
          flex-direction: column;
          gap: 6px;
        }

        /* ─── Sidebar → barre horizontale défilante ─── */
        .re-sidebar {
          width: 100% !important;
          flex-direction: row;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          height: auto;
          min-height: 0;
          padding: 5px 6px;
          gap: 4px;
          scrollbar-width: thin;
          scrollbar-color: #1e2d3d transparent;
        }
        .re-sidebar::-webkit-scrollbar { display: block; height: 3px; }
        .re-sidebar::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 3px; }
        .submenu-btn {
          flex-shrink: 0;
          white-space: nowrap;
          padding: 6px 10px;
          font-size: 12px !important;
          flex-direction: row;
          gap: 5px;
        }
        .submenu-btn ha-icon { --mdc-icon-size: 14px; }

        /* ─── Zone de contenu ─── */
        .re-content-container { min-height: 300px; }
        .re-section-head { padding: 3px 2px 8px; gap: 7px; }
        .re-section-label { font-size: 12px; }
        .re-section-id { display: none; }

        /* ─── Grille de capteurs : 2 colonnes minimum ─── */
        .re-sensor-grid {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 7px;
        }
        .sensors-grid {
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 6px;
        }

        /* ─── Coins HUD : réduits ─── */
        .re-header::before, .re-nav::before,
        .re-sidebar::before, .re-content-container::before { width: 18px; height: 18px; }
        .re-header::after, .re-nav::after,
        .re-sidebar::after, .re-content-container::after  { width: 18px; height: 18px; }

        /* ─── Filtres ─── */
        .re-filter-bar { padding: 6px 8px; gap: 3px; }
        .filter-item { padding: 3px 9px; font-size: 11px !important; }
      }

      /* ═══ RESPONSIVE TABLETTE ÉTROITE (481–700px) ═══ */
      @media (min-width: 481px) and (max-width: 700px) {
        .re-sidebar { width: 150px !important; }
        .submenu-btn { font-size: 11px !important; padding: 7px 8px; }
        .re-title { font-size: max(14px, var(--ec-fs-title, 14px)) !important; }
      }
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
  _mutate(fn) { const c = JSON.parse(JSON.stringify(this._config)); fn(c); this._config = c; this._fire(); }

  // ─── petits helpers UI ───
  _lbl(t) { return html`<div style="font-size:13px;color:#7dd3fc;font-weight:700;letter-spacing:.5px;margin:2px 0 4px;">${t}</div>`; }
  _txt(val, cb, ph='', list='') {
    return html`<input type="text" list="${list}" placeholder="${ph}" .value="${val ?? ''}"
      style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;
             padding:9px 10px;font-size:14px;border-radius:6px;font-family:inherit;"
      @input="${(e)=>cb(e.target.value)}"
      @change="${(e)=>cb(e.target.value)}" />`;
  }
  _num(val, cb, min=8, max=60, step) {
    const conv = (raw) => {
      if (raw === '' || raw == null) return undefined;
      const n = parseFloat(String(raw).replace(',', '.'));
      return isNaN(n) ? undefined : n;
    };
    return html`<input type="number" min="${min}" max="${max}" ${step!=null?`step="${step}"`:''} .value="${val ?? ''}"
      style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;
             padding:9px 10px;font-size:14px;border-radius:6px;font-family:inherit;"
      @input="${(e)=>cb(conv(e.target.value))}"
      @change="${(e)=>cb(conv(e.target.value))}" />`;
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

  // Éditeur des entités du widget solaire, groupées par onglet
  _renderSolarConfigEditor(ci, si, wi, wg) {
    const groups = [
      ['☀️ Production (onglet Solaire)', [
        ['total_now','Prod. instantanée totale'],['autoconso_pct','Autoconsommation %'],['autoconso_nuit','Autoconso nuit'],
        ['grid_flow','Flux réseau'],['main_cons','Consommation maison'],
        ['p1_name','Panneau 1 — nom'],['p1_w','Panneau 1 — puissance'],['p1_d','Panneau 1 — jour'],
        ['p2_name','Panneau 2 — nom'],['p2_w','Panneau 2 — puissance'],['p2_d','Panneau 2 — jour'],
        ['p3_name','Panneau 3 — nom'],['p3_w','Panneau 3 — puissance'],['p3_d','Panneau 3 — jour'],
        ['beem_m_m','Maison — mois'],['beem_s_m','Spa — mois'],['beem_i_m','IBC — mois'],
      ]],
      ['🌤 Météo (onglet Météo)', [
        ['weather_entity','Entité weather'],['temp_ext','Température ext.'],['hum_ext','Humidité ext.'],['moon_entity','Lune'],
        ['w1_e','Météo 1 — entité'],['w1_l','Météo 1 — libellé'],
        ['w2_e','Météo 2 — entité'],['w2_l','Météo 2 — libellé'],
        ['w3_e','Météo 3 — entité'],['w3_l','Météo 3 — libellé'],
        ['w4_e','Météo 4 — entité'],['w4_l','Météo 4 — libellé'],
        ['w5_e','Météo 5 — entité'],['w5_l','Météo 5 — libellé'],
        ['w6_e','Météo 6 — entité'],['w6_l','Météo 6 — libellé'],
      ]],
      ['🔋 Batteries (onglet Batteries)', [
        ['batt_total_power','Puissance batterie totale'],
        ['b1_n','Bat 1 — nom'],['b1_s','Bat 1 — SOC'],['b1_t','Bat 1 — température'],['b1_cap','Bat 1 — capacité'],['b1_out','Bat 1 — puissance'],['b1_conn','Bat 1 — connexion'],
        ['b2_n','Bat 2 — nom'],['b2_s','Bat 2 — SOC'],['b2_t','Bat 2 — température'],['b2_cap','Bat 2 — capacité'],['b2_out','Bat 2 — puissance'],['b2_conn','Bat 2 — connexion'],
        ['b3_n','Bat 3 — nom'],['b3_s','Bat 3 — SOC'],['b3_t','Bat 3 — température'],['b3_cap','Bat 3 — capacité'],['b3_out','Bat 3 — puissance'],['b3_conn','Bat 3 — connexion'],
      ]],
      ['💰 Économies (onglet Économies)', [
        ['eco_money','Économies réalisées'],['eco_day_euro','Gain / jour'],['e2_e','Gain / mois'],['eco_year_euro','Gain / an'],
        ['kwh_price','Tarif kWh'],['e1_e','Tarif EDF'],
        ['total_obj_pct','Objectif — %'],['total_obj_kwh','Objectif — kWh'],
      ]],
      ['🗓 Bandeaux jour / mois', [
        ['__d1_entity','Jour 1 — entité'],['__d2_entity','Jour 2 — entité'],['__d3_entity','Jour 3 — entité'],['__dt_entity','Jour total — entité'],
        ['__m1_entity','Mois 1 — entité'],['__m2_entity','Mois 2 — entité'],['__m3_entity','Mois 3 — entité'],
      ]],
    ];
    const isLabel = (k) => /_(l|name|label)$/.test(k) || k.endsWith('_n');

    // ── Éditeur de la liste dynamique des installations solaires ──
    const panels = (wg.solar_config && wg.solar_config.panels) || [];
    const editPanels = (fn) => this._mutate(c => {
      const w2 = c.categories[ci].submenus[si].widgets[wi];
      w2.solar_config = w2.solar_config || {};
      w2.solar_config.panels = w2.solar_config.panels || [];
      fn(w2.solar_config.panels);
    });
    const panelsEditor = html`
      <div style="background:#101826;border:1px solid #fbbf2444;border-radius:10px;padding:12px;">
        ${this._lbl('🌞 INSTALLATIONS SOLAIRES (panneaux) — ' + panels.length)}
        <div style="font-size:12px;color:#64748b;margin-bottom:10px;line-height:1.5;">
          Une ligne par installation (ex. Maison, Spa, IBC). Dès qu'une ligne est ajoutée ici,
          elle remplace les champs figés « Panneau 1/2/3 » ci-dessous. Pratique pour ajouter
          plus tard une nouvelle installation (ex. côté Ouest) sans toucher au code.
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto;padding-right:4px;">
          ${panels.map((p, pi) => html`
            <div style="background:#0b121d;border:1px solid #1e2d3d;border-radius:8px;padding:9px;display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;gap:6px;align-items:center;">
                <div style="flex:1;">${this._txt(p.name, v => editPanels(arr => { arr[pi].name = v; }), 'Nom (ex: Ouest)')}</div>
                ${this._color(p.color, '#f59e0b', v => editPanels(arr => { if (v) arr[pi].color = v; else delete arr[pi].color; }))}
                ${this._btn('▲', () => editPanels(arr => { if (pi < 1) return; [arr[pi-1], arr[pi]] = [arr[pi], arr[pi-1]]; }), '#334155')}
                ${this._btn('▼', () => editPanels(arr => { if (pi >= arr.length - 1) return; [arr[pi+1], arr[pi]] = [arr[pi], arr[pi+1]]; }), '#334155')}
                ${this._btn('🗑', () => { if (confirm('Supprimer l\'installation « ' + (p.name || pi) + ' » ?')) editPanels(arr => arr.splice(pi, 1)); }, '#ef4444')}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                <div>
                  <div style="font-size:12px;color:#94a3b8;margin-bottom:2px;">Puissance (W)</div>
                  ${this._txt(p.power_entity, v => editPanels(arr => { arr[pi].power_entity = v; }), 'sensor.…_power', 're2ents')}
                </div>
                <div>
                  <div style="font-size:12px;color:#94a3b8;margin-bottom:2px;">Production jour</div>
                  ${this._txt(p.daily_entity, v => editPanels(arr => { arr[pi].daily_entity = v; }), 'sensor.…_jour', 're2ents')}
                </div>
                <div>
                  <div style="font-size:12px;color:#94a3b8;margin-bottom:2px;">Production mois</div>
                  ${this._txt(p.monthly_entity, v => editPanels(arr => { arr[pi].monthly_entity = v; }), 'sensor.…_mois', 're2ents')}
                </div>
              </div>
            </div>`)}
        </div>
        <div style="margin-top:8px;">
          ${this._btn('＋ Ajouter une installation solaire', () => editPanels(arr => arr.push({ name: '', power_entity: '', daily_entity: '', monthly_entity: '' })), '#22c55e')}
        </div>
      </div>`;

    return html`
      <div style="margin-top:10px;background:#101826;border:1px solid #f59e0b33;border-radius:10px;padding:12px;">
        ${this._lbl('☀️ ENTITÉS DU WIDGET SOLAIRE')}
        ${panelsEditor}
        <div style="margin-top:12px;font-size:12px;color:#64748b;">Champs figés ci-dessous (repli si aucune installation n'est ajoutée au-dessus) :</div>
        <div style="display:flex;flex-direction:column;gap:12px;max-height:460px;overflow-y:auto;padding-right:4px;">
          ${groups.map(([title, rows]) => html`
            <div>
              <div style="font-size:12px;font-weight:800;color:#fbbf24;letter-spacing:.5px;margin-bottom:6px;">${title}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                ${rows.map(([key, label]) => {
                  // Les bandeaux jour/mois sont des clés directes du widget (préfixe __), pas dans solar_config
                  const onWidget = key.startsWith('__');
                  const realKey = onWidget ? key.slice(2) : ('solar_config.' + key);
                  const cur = onWidget ? wg[key.slice(2)] : (wg.solar_config||{})[key];
                  return html`<div>
                    <div style="font-size:12px;color:#94a3b8;margin-bottom:2px;">${label}</div>
                    ${this._txt(cur, v=>this._wgSet(ci,si,wi,realKey,v), '', isLabel(key)?'':'re2ents')}
                  </div>`;
                })}
              </div>
            </div>`)}
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
        // ── Chimie de l'eau (vue CHIMIE) ──
        {k:'phEntity',l:'pH — entité',t:E},{k:'ph_min',l:'pH min',t:N},{k:'ph_max',l:'pH max',t:N},
        {k:'ph_offset',l:'pH — calibration (décalage)',t:N},
        {k:'orpEntity',l:'ORP — entité',t:E},{k:'orp_min',l:'ORP min',t:N},{k:'orp_max',l:'ORP max',t:N},
        {k:'orp_offset',l:'ORP — calibration (décalage)',t:N},
        {k:'tdsEntity',l:'TDS — entité',t:E},{k:'tds_min',l:'TDS min',t:N},{k:'tds_max',l:'TDS max',t:N},
        {k:'tds_offset',l:'TDS — calibration (décalage)',t:N},
        {k:'saltEntity',l:'Sel — entité',t:E},{k:'salt_min',l:'Sel min',t:N},{k:'salt_max',l:'Sel max',t:N},
        {k:'salt_offset',l:'Sel — calibration (décalage)',t:N},
        // ── Interrupteurs (vue INTERRUPTEURS) ──
        {k:'switch_1',l:'Interrupteur 1 — entité',t:E},{k:'name_switch_1',l:'Interrupteur 1 — nom',t:T},
        {k:'switch_2',l:'Interrupteur 2 — entité',t:E},{k:'name_switch_2',l:'Interrupteur 2 — nom',t:T},
        {k:'switch_3',l:'Interrupteur 3 — entité',t:E},{k:'name_switch_3',l:'Interrupteur 3 — nom',t:T},
        {k:'switch_4',l:'Interrupteur 4 — entité',t:E},{k:'name_switch_4',l:'Interrupteur 4 — nom',t:T},
        {k:'switch_5',l:'Interrupteur 5 — entité',t:E},{k:'name_switch_5',l:'Interrupteur 5 — nom',t:T},
        {k:'switch_6',l:'Interrupteur 6 — entité',t:E},{k:'name_switch_6',l:'Interrupteur 6 — nom',t:T},
        {k:'switch_7',l:'Interrupteur 7 — entité',t:E},{k:'name_switch_7',l:'Interrupteur 7 — nom',t:T},
        {k:'switch_8',l:'Interrupteur 8 — entité',t:E},{k:'name_switch_8',l:'Interrupteur 8 — nom',t:T},
        {k:'switch_9',l:'Interrupteur 9 — entité',t:E},{k:'name_switch_9',l:'Interrupteur 9 — nom',t:T},
        {k:'switch_10',l:'Interrupteur 10 — entité',t:E},{k:'name_switch_10',l:'Interrupteur 10 — nom',t:T},
        {k:'switch_11',l:'Interrupteur 11 — entité',t:E},{k:'name_switch_11',l:'Interrupteur 11 — nom',t:T},
        {k:'switch_12',l:'Interrupteur 12 — entité',t:E},{k:'name_switch_12',l:'Interrupteur 12 — nom',t:T},
        {k:'switch_13',l:'Interrupteur 13 — entité',t:E},{k:'name_switch_13',l:'Interrupteur 13 — nom',t:T},
        {k:'switch_14',l:'Interrupteur 14 — entité',t:E},{k:'name_switch_14',l:'Interrupteur 14 — nom',t:T},
        {k:'switch_15',l:'Interrupteur 15 — entité',t:E},{k:'name_switch_15',l:'Interrupteur 15 — nom',t:T},
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
        {k:'gauge_size',l:'Taille des jauges CPU/RAM/HDD (défaut 80)',t:'number'},
      ],
      plant: [
        {k:'plant_name',l:'Nom',t:T},{k:'latin_name',l:'Nom latin',t:T},
        {k:'plant_image',l:'Image',t:T},{k:'battery_sensor',l:'Batterie',t:E},
      ],
      solar:   [ {k:'active_tab',l:'Onglet (0=Sol 1=Météo 2=Batt 3=Éco)',t:S,o:['0','1','2','3']} ],
      consumption: [
        {k:'header_title',l:'Titre header',t:T},{k:'header_sub',l:'Sous-titre header',t:T},
        {k:'total_entity',l:'Conso totale (W)',t:E},{k:'solar_entity',l:'Production solaire (W)',t:E},
        {k:'night_entity',l:'Conso nuit (kWh)',t:E},{k:'kwh_price',l:'Tarif €/kWh (entité)',t:E},
        {k:'kwh_price_val',l:'Tarif €/kWh (valeur fixe)',t:N},{k:'max_power',l:'Capacité max (W)',t:N},
        {k:'threshold',l:'Seuil actif (W)',t:N},{k:'top_count',l:'Nb appareils affichés',t:N},
        {k:'col_total',l:'Couleur conso totale',t:'color',d:'#ef4444'},
        {k:'col_solar',l:'Couleur solaire',t:'color',d:'#22c55e'},
        {k:'col_night',l:'Couleur nuit',t:'color',d:'#f59e0b'},
        {k:'lbl_total',l:'Label conso totale',t:T},{k:'lbl_cost',l:'Label coût/heure',t:T},
        {k:'lbl_solar',l:'Label solaire',t:T},{k:'lbl_night',l:'Label conso nuit',t:T},
        {k:'tarif_label',l:'Label tarif EDF',t:T},
      ],
      solar_flow: [
        {k:'header_title',l:'Titre header',t:T},{k:'header_sub',l:'Sous-titre header',t:T},
        {k:'p1_name',l:'Install. 1 — Nom',t:T},{k:'p1_color',l:'Install. 1 — Couleur',t:'color',d:'#f59e0b'},
        {k:'p1_w_entity',l:'Install. 1 — Puissance (W)',t:E},{k:'p1_d_entity',l:'Install. 1 — Prod. jour (kWh)',t:E},{k:'p1_m_entity',l:'Install. 1 — Prod. mois (kWh)',t:E},
        {k:'p2_name',l:'Install. 2 — Nom',t:T},{k:'p2_color',l:'Install. 2 — Couleur',t:'color',d:'#22c55e'},
        {k:'p2_w_entity',l:'Install. 2 — Puissance (W)',t:E},{k:'p2_d_entity',l:'Install. 2 — Prod. jour (kWh)',t:E},{k:'p2_m_entity',l:'Install. 2 — Prod. mois (kWh)',t:E},
        {k:'p3_name',l:'Install. 3 — Nom',t:T},{k:'p3_color',l:'Install. 3 — Couleur',t:'color',d:'#38bdf8'},
        {k:'p3_w_entity',l:'Install. 3 — Puissance (W)',t:E},{k:'p3_d_entity',l:'Install. 3 — Prod. jour (kWh)',t:E},{k:'p3_m_entity',l:'Install. 3 — Prod. mois (kWh)',t:E},
        {k:'total_entity',l:'Production totale (W)',t:E},{k:'cons_entity',l:'Consommation maison (W)',t:E},
        {k:'grid_entity',l:'Flux réseau (+ import / - export)',t:E},{k:'autoconso_entity',l:'Autoconsommation (%)',t:E},
        {k:'day_entity',l:'Production du jour (kWh)',t:E},{k:'month_entity',l:'Production du mois (kWh)',t:E},
        {k:'night_entity',l:'Conso nuit (kWh)',t:E},{k:'obj_pct_entity',l:'Progression objectif (%)',t:E},{k:'obj_kwh_entity',l:'Objectif mensuel (kWh)',t:E},
        {k:'lbl_prod',l:'Texte — Production',t:T},{k:'lbl_cons',l:'Texte — Consommation',t:T},
        {k:'lbl_grid_in',l:'Texte — Import réseau',t:T},{k:'lbl_grid_out',l:'Texte — Injection',t:T},
        {k:'lbl_autoconso',l:'Texte — Autoconsommation',t:T},{k:'lbl_day',l:'Texte — Prod. jour',t:T},
        {k:'lbl_month',l:'Texte — Prod. mois',t:T},{k:'lbl_night',l:'Texte — Conso nuit',t:T},
      ],
      economies: [
        {k:'header_title',l:'Titre header',t:T},{k:'header_sub',l:'Sous-titre header',t:T},{k:'main_label',l:'Label cumul',t:T},
        {k:'eco_money',l:'Économies cumulées (€)',t:E},{k:'eco_day',l:'Gain du jour (€)',t:E},
        {k:'eco_month',l:'Gain du mois (€)',t:E},{k:'eco_year',l:'Gain net annuel (€)',t:E},
        {k:'kwh_price',l:'Tarif EDF (€/kWh)',t:E},{k:'eco_pct',l:'Progression objectif (%)',t:E},
        {k:'eco_target',l:'Objectif annuel (€)',t:N},
      ],
      previsions: [
        {k:'weather_entity',l:'Météo (weather.*)',t:E},{k:'azimuth_entity',l:'Azimut soleil',t:E},
        {k:'elevation_entity',l:'Élévation soleil',t:E},{k:'solcast_pic',l:'Solcast — pic du jour',t:E},
        {k:'solcast_total',l:'Solcast — total du jour',t:E},{k:'wind_entity',l:'Vitesse du vent',t:E},
        {k:'moon_entity',l:'Phase de la lune',t:E},
      ],
      appliance: [ {k:'view',l:'Catégorie figée (0/1/2)',t:S,o:['0','1','2']} ],
      gauge: [
        {k:'entity',l:'Entité',t:E},{k:'label',l:'Libellé',t:T},
        {k:'min',l:'Min',t:N},{k:'max',l:'Max',t:N},
        {k:'min_entity',l:'Min (entité, prioritaire)',t:E},
        {k:'max_entity',l:'Max (entité, prioritaire)',t:E},
      ],
      sparkline: [
        {k:'entity',l:'Entité',t:E},{k:'label',l:'Libellé',t:T},
      ],
      badge: [
        {k:'entity',l:'Entité',t:E},{k:'label',l:'Libellé',t:T},{k:'icon',l:'Icône (mdi:…)',t:T},
        {k:'decimals',l:'Décimales',t:N},{k:'fontSize',l:'Taille valeur (px)',t:N},
        {k:'iconSize',l:'Taille icône (px)',t:N},{k:'iconPos',l:'Position icône',t:S,o:['left','top','right']},
        {k:'secondary_entity',l:'Date/heure (entité)',t:E},
        {k:'secondary_label',l:'Préfixe (ex: "le")',t:T},
        {k:'hud',l:'Cadre HUD (coins coupés)',t:'bool'},
        {k:'tertiary_entity',l:'Texte additionnel (entité)',t:E},
      ],
      shape: [
        {k:'label',l:'Libellé',t:T},{k:'shape',l:'Forme',t:S,o:['circle','square','triangle','hexagon']},
        {k:'size',l:'Taille (px)',t:N},{k:'filled',l:'Remplie',t:'bool'},
      ],
      weather: [
        {k:'animated',l:'Ciel animé',t:'bool'},
        {k:'weather_config.weather',l:'Météo (weather.*)',t:E},
        {k:'weather_config.uv',l:'UV',t:E},{k:'weather_config.rain',l:'Pluie/jour',t:E},
        {k:'weather_config.moon',l:'Lune',t:E},
        {k:'weather_config.ng',l:'Niveau graminées',t:E},{k:'weather_config.cg',l:'Conc. graminées',t:E},
        {k:'weather_config.nb',l:'Niveau bouleau',t:E},{k:'weather_config.cb',l:'Conc. bouleau',t:E},
        {k:'weather_config.na',l:'Niveau ambroisie',t:E},{k:'weather_config.ca',l:'Conc. ambroisie',t:E},
        {k:'weather_config.nu',l:'Niveau aulne',t:E},{k:'weather_config.cu',l:'Conc. aulne',t:E},
        {k:'weather_config.nr',l:'Niveau armoise',t:E},{k:'weather_config.crr',l:'Conc. armoise',t:E},
        {k:'weather_config.no',l:'Niveau olivier',t:E},{k:'weather_config.co',l:'Conc. olivier',t:E},
        {k:'weather_config.qp',l:'Qualité pollen',t:E},{k:'weather_config.qa',l:'Qualité air',t:E},
      ],
      progress: [
        {k:'entity',l:'Entité',t:E},{k:'label',l:'Libellé',t:T},
        {k:'min',l:'Min',t:N},{k:'max',l:'Max',t:N},
        {k:'unit',l:'Unité',t:T},{k:'decimals',l:'Décimales',t:N},
      ],
      foundry: [
        {k:'foundry_yaml',l:'Configuration de la carte (YAML)',t:'textarea'},
        {k:'clip',l:'Découpe en silhouette',t:'select',o:['','alsace']},
      ],
      alsace_meteo: [
        {k:'map_department', l:'Code département (ex: 67, 13, 75, 33 — vide = Alsace par défaut)', t:'T'},
        {k:'weather_entity',       l:'Entité météo (weather.*) — pour prévisions + risques',     t:E},
        {k:'local_temp_entity',    l:'Capteur temp. locale (sensor.*) — remplace la temp affichée', t:E},
        {k:'uv_entity',            l:'UV (ex: sensor.colmar_uv)',        t:E},
        {k:'rain_entity',          l:'Pluie cumulée jour',               t:E},
        {k:'pollen_global_entity', l:'Indice global pollen',             t:E},
        {k:'pollen_g_entity',      l:'Pollens — Graminées',              t:E},
        {k:'pollen_b_entity',      l:'Pollens — Bouleau',                t:E},
        {k:'pollen_a_entity',      l:'Pollens — Ambroisie',              t:E},
        {k:'pollen_u_entity',      l:'Pollens — Aulne',                  t:E},
        {k:'pollen_r_entity',      l:'Pollens — Armoise',                t:E},
        {k:'pollen_o_entity',      l:'Pollens — Olivier',                t:E},
        {k:'city_dot_size',        l:'Carte — taille des points (défaut 3)',    t:'number'},
        {k:'city_text_size',       l:'Carte — taille du texte ville (défaut 6)',t:'number'},
      ],
      power_cell:    [ {k:'title',l:'Titre',t:T} ],
      radar:         [ {k:'title',l:'Titre',t:T}, {k:'range_km',l:'Portée km',t:N} ],
      ekg:           [ {k:'title',l:'Titre',t:T}, {k:'entity',l:'Capteur BPM',t:E}, {k:'color',l:'Couleur',t:T}, {k:'default_bpm',l:'BPM défaut',t:N} ],
      water_wave:    [ {k:'title',l:'Titre',t:T}, {k:'level_entity',l:'Niveau %',t:E}, {k:'volume_entity',l:'Volume (optionnel)',t:E}, {k:'color',l:'Couleur',t:T} ],
      matrix_rain:   [ {k:'title',l:'Titre',t:T}, {k:'color',l:'Couleur',t:T} ],
      tvirus:        [ {k:'title',l:'Titre',t:T}, {k:'ph_entity',l:'pH',t:E}, {k:'orp_entity',l:'ORP',t:E}, {k:'salt_entity',l:'Sel',t:E}, {k:'size',l:'Taille px',t:N} ],
      gauge_arc:     [ {k:'title',l:'Titre',t:T} ],
      oscilloscope:  [ {k:'title',l:'Titre',t:T}, {k:'entity',l:'Entité',t:E}, {k:'color',l:'Couleur',t:T}, {k:'min',l:'Min',t:N}, {k:'max',l:'Max',t:N}, {k:'unit',l:'Unité',t:T} ],
      health: [],
      dossier: [
        {k:'name',l:'Nom',t:T},{k:'image',l:'Photo (URL)',t:T},{k:'archiveId',l:'N° de dossier (ex: #0734)',t:T},
        {k:'weight_entity',l:'Poids — entité',t:E},
        {k:'weight_start',l:'Poids départ (kg)',t:N},{k:'weight_ideal',l:'Poids cible (kg)',t:N},
      ],
      button: [
        {k:'entity',    l:'Entité',            t:'entity'},
        {k:'label',     l:'Libellé',           t:'text'},
        {k:'icon',      l:'Icône (mdi:…)',     t:'text'},
        {k:'action',    l:'Action',            t:'select', o:['toggle','turn_on','turn_off','press','activate','run']},
        {k:'style',     l:'Style',             t:'select', o:['default','pill','minimal']},
        {k:'color',     l:'Couleur ON',        t:'color',  d:'#22d3ee'},
        {k:'color_off', l:'Couleur OFF (hex)', t:'text'},
        {k:'label_on',  l:'Texte état ON',     t:'text'},
        {k:'label_off', l:'Texte état OFF',    t:'text'},
        {k:'icon_size', l:'Taille icône (px)', t:'number'},
        {k:'show_state',l:'Afficher état',     t:'bool'},
        {k:'confirm',   l:'Confirmation',      t:'bool'},
      ],
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
      if (val === undefined || val === null || val === '') delete o[last]; else o[last] = val;
    });
  }

  // ── Éditeur de la liste dynamique des capteurs du widget « dossier » ──
  _renderDossierSensorsEditor(ci, si, wi, wg) {
    const sensors = wg.sensors || [];
    const editSensors = (fn) => this._mutate(c => {
      const w2 = c.categories[ci].submenus[si].widgets[wi];
      w2.sensors = w2.sensors || [];
      fn(w2.sensors);
    });
    const CAT_OPTS = [
      { v: 'forme',     l: '⚡ Forme' },
      { v: 'sante',     l: '🩺 Santé' },
      { v: 'sommeil',   l: '🌙 Sommeil' },
      { v: 'nutrition', l: '🥗 Nutrition' },
    ];
    return html`
      <div style="margin-top:10px;background:#101826;border:1px solid #ef444433;border-radius:10px;padding:12px;">
        ${this._lbl('🩻 CAPTEURS DU DOSSIER — ' + sensors.length)}
        <div style="font-size:12px;color:#64748b;margin-bottom:10px;">
          Une ligne par capteur affiché. La catégorie détermine la section (Forme/Santé/Sommeil/Nutrition).
          Min/Max sont optionnels — hors plage, le STATUT du dossier passe en ALERTE.
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto;padding-right:4px;">
          ${sensors.map((s, si2) => html`
            <div style="background:#0b121d;border:1px solid #1e2d3d;border-radius:8px;padding:9px;display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;gap:6px;align-items:center;">
                <select .value="${s.cat||'forme'}" @change="${e=>editSensors(arr=>{ arr[si2].cat = e.target.value; })}"
                        style="flex:0 0 120px;background:#1a2332;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:6px 4px;font-size:12px;">
                  ${CAT_OPTS.map(o=>html`<option value="${o.v}" ?selected="${(s.cat||'forme')===o.v}">${o.l}</option>`)}
                </select>
                <div style="flex:1;">${this._txt(s.name, v => editSensors(arr => { arr[si2].name = v; }), 'Nom affiché (ex: Pas)')}</div>
                ${this._btn('▲', () => editSensors(arr => { if (si2<1) return; [arr[si2-1],arr[si2]]=[arr[si2],arr[si2-1]]; }), '#334155')}
                ${this._btn('▼', () => editSensors(arr => { if (si2>=arr.length-1) return; [arr[si2+1],arr[si2]]=[arr[si2],arr[si2+1]]; }), '#334155')}
                ${this._btn('🗑', () => { if (confirm('Supprimer ce capteur ?')) editSensors(arr => arr.splice(si2,1)); }, '#ef4444')}
              </div>
              <div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 0.7fr 0.7fr;gap:6px;">
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Entité</div>
                  ${this._txt(s.entity, v => editSensors(arr => { arr[si2].entity = v; }), 'sensor.…', 're2ents')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Icône (mdi:…)</div>
                  ${this._txt(s.icon, v => editSensors(arr => { arr[si2].icon = v; }), 'mdi:walk')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Unité</div>
                  ${this._txt(s.unit, v => editSensors(arr => { arr[si2].unit = v; }), 'ex: " bpm"')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Min</div>
                  ${this._txt(s.min, v => editSensors(arr => { arr[si2].min = v===''?undefined:v; }), '')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Max</div>
                  ${this._txt(s.max, v => editSensors(arr => { arr[si2].max = v===''?undefined:v; }), '')}
                </div>
              </div>
            </div>`)}
        </div>
        <div style="margin-top:8px;">
          ${this._btn('＋ Ajouter un capteur', () => editSensors(arr => arr.push({ cat:'forme', entity:'', name:'', icon:'', unit:'' })), '#22c55e')}
        </div>
      </div>`;
  }

  _renderServerDisksEditor(ci, si, wi, wg) {
    const disks = wg.disks || [];
    const editDisks = (fn) => this._mutate(c => {
      const w2 = c.categories[ci].submenus[si].widgets[wi];
      w2.disks = w2.disks || [];
      fn(w2.disks);
    });
    return html`
      <div style="margin-top:10px;background:#0a1410;border:1px solid #00ff8833;border-radius:10px;padding:12px;">
        ${this._lbl('💾 DISQUES / CAPTEURS DU SERVEUR — ' + disks.length)}
        <div style="font-size:12px;color:#64748b;margin-bottom:10px;">
          Une barre par ligne (disque, mais aussi tout capteur en %). Si "Max" est vide, la valeur du
          capteur est traitée comme un pourcentage direct (0-100). Renseigne "Max" pour une autre échelle
          (ex: 0-90°C pour une température).
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto;padding-right:4px;">
          ${disks.map((d, di) => html`
            <div style="background:#0b1a14;border:1px solid #1e3d2d;border-radius:8px;padding:9px;display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;gap:6px;align-items:center;">
                <div style="flex:1;">${this._txt(d.label, v => editDisks(arr => { arr[di].label = v; }), 'Nom affiché (ex: C: Système)')}</div>
                ${this._btn('▲', () => editDisks(arr => { if (di<1) return; [arr[di-1],arr[di]]=[arr[di],arr[di-1]]; }), '#334155')}
                ${this._btn('▼', () => editDisks(arr => { if (di>=arr.length-1) return; [arr[di+1],arr[di]]=[arr[di],arr[di+1]]; }), '#334155')}
                ${this._btn('🗑', () => { if (confirm('Supprimer ce capteur ?')) editDisks(arr => arr.splice(di,1)); }, '#ef4444')}
              </div>
              <div style="display:grid;grid-template-columns:1.6fr 1fr 0.8fr 0.7fr;gap:6px;">
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Entité</div>
                  ${this._txt(d.entity, v => editDisks(arr => { arr[di].entity = v; }), 'sensor.…', 're2ents')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Icône (mdi:…)</div>
                  ${this._txt(d.icon, v => editDisks(arr => { arr[di].icon = v; }), 'mdi:harddisk')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Unité</div>
                  ${this._txt(d.unit, v => editDisks(arr => { arr[di].unit = v; }), 'ex: " %"')}
                </div>
                <div>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Max</div>
                  ${this._txt(d.max, v => editDisks(arr => { arr[di].max = v===''?undefined:v; }), '100')}
                </div>
              </div>
            </div>`)}
        </div>
        <div style="margin-top:8px;">
          ${this._btn('＋ Ajouter un disque/capteur', () => editDisks(arr => arr.push({ label:'', entity:'', icon:'mdi:harddisk', unit:' %' })), '#22c55e')}
        </div>
      </div>`;
  }

  _renderAlsaceCitiesEditor(ci, si, wi, wg) {
    // Villes par défaut (mêmes que CITIES_DEF dans le rendu)
    const DEFAULT_CITIES = [
      { name:'Strasbourg',          lat:'48.574', lon:'7.752',  temp_entity:'' },
      { name:'Saverne',             lat:'48.741', lon:'7.362',  temp_entity:'' },
      { name:'Sélestat',            lat:'48.259', lon:'7.453',  temp_entity:'' },
      { name:'Colmar',              lat:'48.079', lon:'7.359',  temp_entity:'' },
      { name:'Ste-Croix-en-Plaine', lat:'48.009', lon:'7.405',  temp_entity:'' },
      { name:'Mulhouse',            lat:'47.750', lon:'7.336',  temp_entity:'' },
    ];
    const cities = wg.cities && wg.cities.length ? wg.cities : [];
    const editCities = (fn) => this._mutate(c => {
      const w2 = c.categories[ci].submenus[si].widgets[wi];
      if (!w2.cities || !w2.cities.length) w2.cities = DEFAULT_CITIES.map(d => ({...d}));
      fn(w2.cities);
    });
    return html`
      <div style="margin-top:10px;background:#0a140f;border:1px solid #00ff8833;border-radius:10px;padding:12px;">
        ${this._lbl('🗺 VILLES SUR LA CARTE')}
        <div style="font-size:12px;color:#64748b;margin-bottom:10px;">
          Chaque ville peut avoir un capteur de température dédié. Sans capteur, la ville affiche
          la temp du créneau horaire sélectionné. Lat/Lon en degrés décimaux.
        </div>
        ${cities.length === 0 ? html`
          <div style="font-size:12px;color:#64748b;font-style:italic;margin-bottom:8px;">
            Villes par défaut actives (Strasbourg, Saverne, Sélestat, Colmar,
            Ste-Croix-en-Plaine, Mulhouse). Clique "Modifier les villes" pour personnaliser.
          </div>
          ${this._btn('✏ Modifier les villes', () => editCities(() => {}), '#334155')}` : html`
          <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;padding-right:4px;">
            ${cities.map((c, idx) => html`
              <div style="background:#0b1a14;border:1px solid #1e3d2d;border-radius:8px;padding:9px;
                          display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;gap:6px;align-items:center;">
                  <div style="flex:1;">${this._txt(c.name, v => editCities(arr => { arr[idx].name = v; }), 'Nom de la ville')}</div>
                  ${this._btn('▲', () => editCities(arr => { if(idx<1)return; [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; }), '#334155')}
                  ${this._btn('▼', () => editCities(arr => { if(idx>=arr.length-1)return; [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; }), '#334155')}
                  ${this._btn('🗑', () => { if(confirm('Supprimer cette ville ?')) editCities(arr => arr.splice(idx,1)); }, '#ef4444')}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:6px;">
                  <div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Latitude</div>
                    ${this._txt(c.lat, v => editCities(arr => { arr[idx].lat = v; }), 'ex: 48.009')}
                  </div>
                  <div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Longitude</div>
                    ${this._txt(c.lon, v => editCities(arr => { arr[idx].lon = v; }), 'ex: 7.405')}
                  </div>
                  <div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Capteur température (optionnel)</div>
                    ${this._txt(c.temp_entity, v => editCities(arr => { arr[idx].temp_entity = v; }), 'sensor.…', 're2ents')}
                  </div>
                </div>
              </div>`)}
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;">
            ${this._btn('＋ Ajouter une ville', () => editCities(arr => arr.push({ name:'', lat:'', lon:'', temp_entity:'' })), '#22c55e')}
            ${this._btn('↺ Remettre les défauts', () => this._mutate(cat => {
              cat.categories[ci].submenus[si].widgets[wi].cities = DEFAULT_CITIES.map(d=>({...d}));
            }), '#334155')}
          </div>`}
      </div>`;
  }

  // Éditeur générique d'un widget : champs du schéma + listes spécifiques
  _safeWidgetEditor(ci, si, wi, wg) {
    try { return this._renderWidgetEditor(ci, si, wi, wg); }
    catch (e) { return html`<div style="color:#ef4444;font-size:12px;padding:8px;">Éditeur indisponible pour ce widget : ${e.message}</div>`; }
  }

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
      if (f.t === 'number') return html`<div>${this._lbl(f.l)}${this._num(cur, v=>this._wgSet(ci,si,wi,f.k,v), -100000, 100000, f.step != null ? f.step : 'any')}</div>`;
      if (f.t === 'color')  return html`<div>${this._lbl(f.l)}${this._color(cur, f.d || '#00ff00', v=>this._wgSet(ci,si,wi,f.k,v))}</div>`;
      if (f.t === 'bool')   return html`<div>${this._lbl(f.l)}
        <select style="${selStyle}" @change="${e=>this._wgSet(ci,si,wi,f.k, e.target.value==='oui')}">
          <option value="non" ?selected="${!cur}">non</option><option value="oui" ?selected="${!!cur}">oui</option>
        </select></div>`;
      if (f.t === 'textarea') return html`<div>${this._lbl(f.l)}
        <textarea style="${selStyle}min-height:150px;resize:vertical;font-family:monospace;font-size:13px;line-height:1.4;white-space:pre;"
          @input="${e=>this._wgSet(ci,si,wi,f.k,e.target.value)}"
          @change="${e=>this._wgSet(ci,si,wi,f.k,e.target.value)}"
          placeholder="type: foundry-gauge-card&#10;entity: sensor.xxx&#10;...">${cur || ''}</textarea></div>`;
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
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:${schema.length?'8px':'0'};">
          ${field({k:'widthPct',l:'Largeur (%)',t:'number'})}
          ${field({k:'heightPx',l:'Hauteur (px)',t:'number'})}
          ${field({k:'color',l:'Couleur',t:'color',d:'#00ff00'})}
          ${field({k:'noBorder',l:'Sans bordure',t:'bool'})}
        </div>
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
        ${wg.type==='consumption' ? html`
          <div style="margin-top:10px;">
            ${this._lbl('⚡ APPAREILS SURVEILLÉS')}
            <div style="font-size:12px;color:#64748b;margin-bottom:8px;">Un appareil par ligne. LED pulsante quand actif (au-dessus du seuil).</div>
            ${(wg.devices||[]).map((d, di) => html`
              <div style="margin-bottom:6px;background:#080e18;border:1px solid #1a2744;border-radius:6px;padding:8px;">
                <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                  <div style="flex:2;min-width:120px;">
                    <div style="font-size:10px;color:#475569;margin-bottom:2px;">Entité</div>
                    ${this._txt(d.entity, v => this._mutate(cfg => { cfg.categories[ci].submenus[si].widgets[wi].devices[di].entity = v; }), 'sensor.…', 're2ents')}
                  </div>
                  <div style="flex:1;min-width:80px;">
                    <div style="font-size:10px;color:#475569;margin-bottom:2px;">Nom affiché</div>
                    ${this._txt(d.name, v => this._mutate(cfg => { cfg.categories[ci].submenus[si].widgets[wi].devices[di].name = v; }), 'ex: Lave-linge')}
                  </div>
                  <div style="flex-shrink:0;">
                    <div style="font-size:10px;color:#475569;margin-bottom:2px;">Couleur</div>
                    ${this._color(d.color||'#ef4444', '#ef4444', v => this._mutate(cfg => { cfg.categories[ci].submenus[si].widgets[wi].devices[di].color = v; }))}
                  </div>
                  ${this._btn('🗑', () => this._mutate(cfg => { cfg.categories[ci].submenus[si].widgets[wi].devices.splice(di,1); }), '#ef4444')}
                </div>
              </div>`)}
            ${this._btn('＋ Appareil', () => this._mutate(cfg => {
              const ww = cfg.categories[ci].submenus[si].widgets[wi];
              if (!ww.devices) ww.devices = [];
              ww.devices.push({entity:'', name:'', color:'#ef4444'});
            }), '#22c55e')}
          </div>` : html``}
        ${wg.type==='appliance' ? html`
          <div style="margin-top:10px;">
            ${this._lbl('Capteurs par équipement')}
            ${(wg.categories||[]).map((cat, catIdx) => html`
              <div style="margin-top:8px;">
                <div style="font-size:11px;letter-spacing:2px;color:#818cf888;margin-bottom:6px;padding:3px 0;border-bottom:1px solid #1a2744;">
                  ${(cat.label||'CATÉGORIE '+catIdx).toUpperCase()}
                </div>
                ${(cat.items||[]).map((item, itemIdx) => html`
                  <div style="margin-bottom:8px;background:#080e18;border:1px solid #1a2744;border-radius:6px;padding:8px;">
                    <div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
                      ${item.img?html`<img src="${item.img}" style="width:22px;height:22px;object-fit:contain;opacity:0.7;">`:html``}
                      ${item.name||'Item '+itemIdx}
                      <span style="font-size:10px;color:#475569;">${(item.sensors||[]).length} capteur(s)</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                      ${(item.sensors||[]).map((eid, sIdx) => {
                        return html`
                          <div style="display:flex;gap:5px;align-items:center;">
                            ${this._txt(eid, v => this._mutate(cfg => {
                              cfg.categories[ci].submenus[si].widgets[wi].categories[catIdx].items[itemIdx].sensors[sIdx] = v;
                            }), 'sensor.…', 're2ents')}
                            ${this._btn('🗑', () => this._mutate(cfg => {
                              cfg.categories[ci].submenus[si].widgets[wi].categories[catIdx].items[itemIdx].sensors.splice(sIdx,1);
                            }), '#ef4444')}
                          </div>`;
                      })}
                      ${this._btn('＋ Capteur', () => this._mutate(cfg => {
                        const itm = cfg.categories[ci].submenus[si].widgets[wi].categories[catIdx].items[itemIdx];
                        if (!itm.sensors) itm.sensors=[];
                        itm.sensors.push('');
                      }), '#22c55e')}
                    </div>
                  </div>`)}
              </div>`)}
          </div>
        ` : html``}
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

        <div style="border-top:1px solid #1e2d3d;padding-top:12px;">
          ${this._lbl('🚨 ALERTES DÉFILANTES (bandeau d\'en-tête)')}
          <div style="font-size:12px;color:#64748b;margin-bottom:8px;line-height:1.5;">
            La chimie du spa hors plage et les capteurs « biohazard » sont détectés automatiquement.
            Ajoute ici des règles : spa éteint, lave-linge en panne, production faible…
          </div>
          ${(this._config.alerts || []).map((r, i) => html`
            <div style="background:#101826;border:1px solid #1e2d3d;border-radius:8px;padding:8px;margin-bottom:6px;display:flex;flex-direction:column;gap:5px;">
              <div style="display:flex;gap:5px;align-items:center;">
                <span style="font-size:12px;color:#94a3b8;flex:1;">Règle ${i+1}</span>
                ${this._btn('🗑', ()=>this._mutate(c=>{ c.alerts.splice(i,1); if(!c.alerts.length) delete c.alerts; }), '#ef4444', 'Supprimer')}
              </div>
              ${this._txt(r.entity, v=>this._mutate(c=>c.alerts[i].entity=v), 'entité (sensor./switch./binary_sensor.…)', 're2ents')}
              <div style="display:flex;gap:5px;">
                <select style="flex:0 0 130px;background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;padding:8px;font-size:13px;border-radius:6px;font-family:inherit;"
                        .value="${r.op||'off'}" @change="${e=>this._mutate(c=>c.alerts[i].op=e.target.value)}">
                  ${[['off','est éteint (off)'],['on','est allumé (on)'],['unavailable','indisponible'],['<','< valeur'],['<=','≤ valeur'],['>','> valeur'],['>=','≥ valeur'],['=','= valeur'],['!=','≠ valeur'],['contains','contient']].map(o=>html`<option value="${o[0]}" ?selected="${(r.op||'off')===o[0]}">${o[1]}</option>`)}
                </select>
                ${this._txt(r.value, v=>this._mutate(c=>c.alerts[i].value=v), 'valeur (si applicable)')}
              </div>
              ${this._txt(r.message, v=>this._mutate(c=>c.alerts[i].message=v), 'message affiché (ex: SPA ÉTEINT)')}
              <select style="background:#0d1117;border:1px solid #2a3a52;color:#e2e8f0;padding:8px;font-size:13px;border-radius:6px;font-family:inherit;"
                      .value="${r.level||'warn'}" @change="${e=>this._mutate(c=>c.alerts[i].level=e.target.value)}">
                ${[['warn','⚠ Avertissement (orange)'],['crit','⛔ Critique (rouge)']].map(o=>html`<option value="${o[0]}" ?selected="${(r.level||'warn')===o[0]}">${o[1]}</option>`)}
              </select>
            </div>`)}
          ${this._btn('＋ Ajouter une règle d\'alerte', ()=>this._mutate(c=>{ c.alerts=c.alerts||[]; c.alerts.push({entity:'',op:'off',message:'',level:'warn'}); }), '#22c55e')}
        </div>
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
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#101826;
                        border:1px solid #1e2d3d;border-radius:8px;padding:8px 12px;">
              <span style="font-size:14px;color:#cbd5e1;font-weight:600;">Contraste renforcé (accessibilité)</span>
              <div style="display:flex;gap:6px;">
                ${this._btn(th.high_contrast ? '◑ Activé' : 'Activer', ()=>this._setTheme('high_contrast', th.high_contrast ? undefined : true), th.high_contrast ? '#38e0ff' : '#334155')}
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
        <div>
          ${this._lbl('🔍 ZOOM CONTENU WIDGETS')}
          <div style="background:#0a1020;border:1px solid #1e2d3d;border-radius:8px;padding:12px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <span style="font-size:14px;color:#cbd5e1;flex:1;">Taille globale des textes</span>
              <span style="font-size:16px;font-weight:700;color:#22c55e;min-width:40px;text-align:right;">
                ${Math.round((parseFloat(th.widget_zoom)||1)*100)}%
              </span>
            </div>
            <input type="range" min="70" max="150" step="5"
              .value="${Math.round((parseFloat(th.widget_zoom)||1)*100)}"
              @input="${e => this._setTheme('widget_zoom', (parseInt(e.target.value)/100).toFixed(2))}"
              style="width:100%;accent-color:#22c55e;cursor:pointer;"/>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-top:3px;">
              <span>70% — Compact</span><span>100% — Normal</span><span>150% — Grand</span>
            </div>
          </div>
        </div>
        <div>
          ${this._lbl('🎨 COULEURS DES WIDGETS')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${colorRow('Texte principal widgets', 'widget_text', '#e2e8f0')}
            ${colorRow('Texte secondaire widgets', 'widget_text_dim', '#94a3b8')}
            ${colorRow('Accent vert (SPA, présence…)', 'widget_green', '#22c55e')}
            ${colorRow('Accent rouge (alertes RE…)', 'widget_red', '#ef4444')}
            ${colorRow('Accent bleu (température…)', 'widget_blue', '#38bdf8')}
            ${colorRow('Accent ambre (soleil, économies…)', 'widget_amber', '#f59e0b')}
            ${colorRow('Accent violet (santé, lune…)', 'widget_purple', '#a78bfa')}
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
            <select style="${selStyle}" .value="${String(ci)}" @change="${e=>{ this._ci = parseInt(e.target.value); this._si = 0; this._expOpen=false; this._impOpen=false; this._bulkOpen=false; this.requestUpdate(); }}">
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
            ${this._btn(this._expOpen ? '✕ Fermer export' : '⭳ Exporter la catégorie', ()=>{ if(!cat) return;
              if (this._expOpen) { this._expOpen=false; this._expJson=''; this.requestUpdate(); return; }
              this._expJson = JSON.stringify(cat, null, 2);
              this._expOpen = true; this.requestUpdate();
              setTimeout(()=>{ const ta=this.shadowRoot.querySelector('#re2-exp'); if(ta){ ta.focus(); ta.select();
                try { document.execCommand('copy'); } catch(_e) {}
                try { if (navigator.clipboard) navigator.clipboard.writeText(this._expJson).catch(()=>{}); } catch(_e) {} } }, 80);
            }, '#06b6d4')}
            ${this._btn(this._impOpen ? '✕ Fermer import' : '⭱ Importer une catégorie', ()=>{ this._impOpen=!this._impOpen; this.requestUpdate(); }, '#f59e0b')}
          </div>
          ${this._expOpen ? html`
            <div style="margin-top:8px;">
              ${this._lbl('JSON de la catégorie ('+(this._expJson||'').length+' caractères) — sélectionné et copié ; sinon Ctrl+C')}
              <textarea id="re2-exp" rows="12" readonly .value="${this._expJson||''}"
                @focus="${e=>e.target.select()}"
                style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #06b6d4;color:#7dd3fc;
                       padding:9px 10px;font-size:12px;border-radius:6px;font-family:'Courier New',monospace;white-space:pre;overflow:auto;"></textarea>
              <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                ${this._btn('📋 Re-sélectionner', ()=>{ const ta=this.shadowRoot.querySelector('#re2-exp'); if(ta){ ta.focus(); ta.select(); try{document.execCommand('copy');}catch(_e){} } }, '#06b6d4')}
                ${this._btn('⭳ Télécharger .json', ()=>{
                  try {
                    const blob = new Blob([this._expJson||''], {type:'application/json'});
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = ((cat&&cat.name)||'categorie').replace(/[^\w-]+/g,'_') + '.json';
                    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
                  } catch(e) { alert('Téléchargement impossible : '+e.message); }
                }, '#22c55e')}
              </div>
            </div>` : html``}
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
            <select style="${selStyle}" .value="${String(si)}" @change="${e=>{ this._si = parseInt(e.target.value); this.requestUpdate(); }}">
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
                  ${this._safeWidgetEditor(ci,si,wi,wg)}
                  ${wg.type==='energie' ? this._renderEnergieDevicesEditor(ci,si,wi,wg) : html``}
                  ${wg.type==='solar' ? this._renderSolarConfigEditor(ci,si,wi,wg) : html``}
                  ${wg.type==='dossier' ? this._renderDossierSensorsEditor(ci,si,wi,wg) : html``}
                  ${wg.type==='server' ? this._renderServerDisksEditor(ci,si,wi,wg) : html``}
                  ${wg.type==='alsace_meteo' ? this._renderAlsaceCitiesEditor(ci,si,wi,wg) : html``}
                </div>`)}
              <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
                <select id="re2-add-wtype" style="${selStyle}">
                  ${[
                    {v:'gauge',l:'Jauge circulaire'},{v:'sparkline',l:'Graphique sparkline'},
                    {v:'badge',l:'Badge valeur'},{v:'progress',l:'Barre de progression'},{v:'shape',l:'Forme / cadre coloré'},
                    {v:'button',l:'Bouton ON/OFF'},
                    {v:'foundry',l:'Carte Foundry'},
                    {v:'alsace_meteo',l:'Météo Alsace (risques + tendance)'},
                    {v:'spa_temp',l:'Spa'},{v:'tank',l:'Cuve / jardin'},{v:'server',l:'Serveur'},
                    {v:'plant',l:'Plante'},{v:'health',l:'Santé (multi-personnes)'},{v:'dossier',l:'Dossier santé (1 personne)'},{v:'solar',l:'Solaire'},{v:'weather',l:'Météo'},
                    {v:'energie',l:'Consommation'},{v:'appliance',l:'Équipements'},
                    {v:'tracker',l:'Radar présence'},{v:'map',l:'Carte présence'},
                  ].map(t=>html`<option value="${t.v}">${t.l}</option>`)}
                </select>
                ${this._btn('＋ Ajouter un widget', ()=>{ const sel=this.shadowRoot.querySelector('#re2-add-wtype'); const t=sel?sel.value:'badge';
                  const defs = {
                    gauge:{type:'gauge',widthPct:24,heightPx:140,min:0,max:100,color:'#00ff88',label:'Jauge'},
                    sparkline:{type:'sparkline',widthPct:32,heightPx:140,color:'#22d3ee',label:'Tendance'},
                    badge:{type:'badge',widthPct:24,heightPx:110,icon:'mdi:flash',color:'#f59e0b',label:'Valeur'},
                    progress:{type:'progress',widthPct:100,heightPx:90,min:0,max:100,unit:'%',decimals:0,color:'#22c55e',label:'Progression'},
                    button:{type:'button',widthPct:24,heightPx:110,color:'#22d3ee',action:'toggle',show_state:true,style:'default'},
                    foundry:{type:'foundry',widthPct:100,heightPx:260,noBorder:true,foundry_yaml:''},
                    alsace_meteo:{type:'alsace_meteo',widthPct:100,heightPx:420,noBorder:true,
                      weather_entity:'weather.sainte_croix_en_plaine',
                      uv_entity:'sensor.colmar_uv',
                      rain_entity:'sensor.colmar_daily_precipitation',
                      pollen_global_entity:'sensor.qualite_globale_pollen_sainte_croix_en_plaine',
                      pollen_g_entity:'sensor.niveau_gramine_sainte_croix_en_plaine',
                      pollen_b_entity:'sensor.niveau_bouleau_sainte_croix_en_plaine',
                      pollen_a_entity:'sensor.niveau_ambroisie_sainte_croix_en_plaine',
                      pollen_u_entity:'sensor.niveau_aulne_sainte_croix_en_plaine',
                      pollen_r_entity:'sensor.niveau_armoise_sainte_croix_en_plaine',
                      pollen_o_entity:'sensor.niveau_olivier_sainte_croix_en_plaine'},
                    shape:{type:'shape',widthPct:15,heightPx:120,shape:'hexagon',size:64,filled:true,color:'#ef4444',label:'Statut'},
                    weather:{type:'weather',widthPct:100,heightPx:530,noBorder:true,animated:true,weather_config:{weather:'weather.sainte_croix_en_plaine'}},
                    dossier:{type:'dossier',widthPct:48,heightPx:470,name:'Nouvelle personne',weight_entity:'',weight_start:'',weight_ideal:'',
                      sensors:[
                        {cat:'forme',entity:'sensor.exemple_pas',name:'Pas',unit:''},
                        {cat:'forme',entity:'sensor.exemple_fc',name:'FC moy.',unit:' bpm'},
                        {cat:'sante',entity:'sensor.exemple_spo2',name:'SpO2',unit:' %',min:90},
                        {cat:'sommeil',entity:'sensor.exemple_sommeil',name:'Durée',unit:''},
                      ]},
                  };
                  this._mutate(c=>{ const s=c.categories[ci].submenus[si]; s.widgets=s.widgets||[];
                    s.widgets.push(defs[t] ? JSON.parse(JSON.stringify(defs[t])) : {type:t,widthPct:100,noBorder:true}); }); }, '#22c55e')}
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
