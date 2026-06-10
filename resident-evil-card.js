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

  .re-content-scroll { flex: 1; padding: 20px; overflow-y: auto; background: #030303; border-left: 1px solid #1c1c1c; display: flex; flex-direction: column; box-sizing: border-box; }
  .re-content-scroll::-webkit-scrollbar { width: 6px; }
  .re-content-scroll::-webkit-scrollbar-thumb { background: var(--re-red); }

  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; width: 100%; }
  
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

  .sensor-card.type-server {
    grid-column: span 1;
    background: #08080c;
    border: 1px solid #1e1e24;
  }
  .server-label { font-size: 8px; color: #666; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }

  .sensor-card.effect-light.state-active { border-color: var(--re-green); background: #041404; box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.15); }
  .sensor-card.effect-light.state-active::before { background: var(--re-green-bright); }
  .sensor-card.effect-light.state-active .sensor-icon { color: var(--re-green-bright); filter: drop-shadow(0 0 5px var(--re-green-bright)); animation: light-glow 2s infinite alternate; }
  .sensor-card.effect-light.state-active .sensor-value { color: #fff; text-shadow: 0 0 4px var(--re-green-glow); }

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
  .temp-status-tag { font-size: 9px; padding: 2px 6px; font-weight: bold; border: 1px solid #333; text-transform: uppercase; background: #000; letter-spacing: 1px; }
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

  .spa-hud-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 15px;
  }
  .spa-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #1c1c1c;
    padding-bottom: 8px;
  }
  .spa-badge-heater {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #222;
    padding: 6px 12px;
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 1px;
  }
  .spa-badge-heater.heating {
    border-color: #5c1d1d;
    color: #ff3333;
    background: rgba(255, 51, 51, 0.03);
    text-shadow: 0 0 4px var(--re-red-glow);
  }
  .spa-dot { width: 6px; height: 6px; border-radius: 50%; background: #444; }
  .spa-badge-heater.heating .spa-dot { background: #ff3333; box-shadow: 0 0 6px #ff3333; animation: batt-flash 1s infinite alternate; }

  .spa-trident-layout {
    display: grid;
    grid-template-columns: 1fr 140px 1fr;
    align-items: center;
    width: 100%;
    margin: 5px 0;
  }
  .spa-side-metric { display: flex; flex-direction: column; }
  .spa-side-metric.left { align-items: flex-start; }
  .spa-side-metric.right { align-items: flex-end; }
  .spa-huge-val { font-size: 26px; font-weight: bold; color: #fff; }
  .spa-metric-lbl { font-size: 9px; color: var(--re-text-gray); font-weight: bold; margin: 2px 0; letter-spacing: 1px; }
  .spa-sub-badge { background: #0a0a0a; border: 1px solid #161616; padding: 2px 8px; border-radius: 12px; font-size: 10px; color: var(--re-green); }

  .spa-center-dial {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  .spa-circular-monitor {
    width: 110px; height: 110px; border-radius: 50%;
    border: 1px dashed #252525;
    background: radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(10,10,10,0.2) 100%);
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    box-shadow: 0 0 15px rgba(0,0,0,0.8);
  }
  .spa-dial-lbl { font-size: 8px; color: #444; letter-spacing: 2px; }
  .spa-dial-temp { font-size: 34px; font-weight: bold; color: var(--re-green-bright); text-shadow: 0 0 8px var(--re-green-glow); }
  .spa-dial-target { font-size: 9px; color: #ffaa00; background: rgba(255,170,0,0.05); border: 1px solid rgba(255,170,0,0.1); padding: 1px 5px; margin-top: 2px; }

  .spa-dial-arrow { background: none; border: none; color: #333; cursor: pointer; font-size: 11px; padding: 4px; font-family: inherit; }
  .spa-dial-arrow:hover { color: var(--re-green); }

  .spa-energy-row { display: flex; justify-content: center; gap: 10px; margin: 5px 0; }
  .spa-chip { background: #080808; border: 1px solid #161616; padding: 4px 10px; font-size: 10px; color: #bcbcbc; }

  .spa-maintenance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; margin-top: 5px; }
  .spa-maint-strip { background: rgba(255,255,255,0.01); border: 1px solid #121212; padding: 8px 12px; }
  .spa-strip-header { display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; color: #555; }
  .spa-strip-track { width: 100%; height: 3px; background: #111; margin: 6px 0; overflow: hidden; }
  .spa-strip-fill { height: 100%; background: var(--re-green); box-shadow: 0 0 4px var(--re-green-glow); }
  .spa-strip-footer { font-size: 9px; color: #333; text-align: right; }

  .spa-footer-status { display: flex; justify-content: space-between; font-size: 9px; color: #444; border-top: 1px solid #121212; padding-top: 8px; margin-top: 5px; }
  .spa-status-ok { color: var(--re-green); font-weight: bold; }

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
  .hud-top-row, .hud-bottom-row { display: flex; justify-content: space-between; width: 100%; font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px #000, 0 0 4px rgba(0,0,0,0.8); }
  
  .hud-rec-indicator { color: #ff0000; display: flex; align-items: center; gap: 4px; animation: batt-flash 1s infinite alternate; }
  .hud-cam-name { color: #ffffff; text-transform: uppercase; letter-spacing: 1px; }
  .hud-timestamp { color: #ff9900; }
  .hud-status-ok { color: #00ff00; background: rgba(0,255,0,0.15); padding: 1px 4px; border: 1px solid #00ff00; font-size: 8px; }
  
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
  .cover-btn { flex: 1; background: #151515; border: 1px solid var(--re-border-color); color: #fff; font-family: inherit; font-size: 10px; padding: 6px 4px; cursor: pointer; }
  .cover-btn:hover { background: var(--re-red); border-color: #fff; }

  .re-progress-bar { width: 100%; height: 6px; background: #111; border: 1px solid #333; margin-top: 8px; position: relative; overflow: hidden; }
  .re-progress-fill { height: 100%; transition: width 0.5s ease-in-out; }
  .bg-green { background: var(--re-green); box-shadow: 0 0 4px var(--re-green-glow); }
  .bg-red { background: var(--re-red-bright); box-shadow: 0 0 4px var(--re-red-glow); }
  .text-red { color: var(--re-red-bright) !important; text-shadow: 0 0 4px var(--re-red-glow) !important; }
  .error { border-color: var(--re-red-bright); color: var(--re-red-bright); }
  .empty-tab { grid-column: 1 / -1; text-align: center; color: #555; font-size: 12px; margin-top: 50px; }
  .umbrella-spin { animation: umbrella-rotate 8s linear infinite; transform-origin: center;
    filter: drop-shadow(0 0 6px rgba(139,0,0,0.8)); }
  .umbrella-spin:hover { animation-duration: 2s; filter: drop-shadow(0 0 12px rgba(255,0,0,0.9)); }
  @keyframes umbrella-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .umbrella-pulse { animation: umbrella-pulse-anim 3s ease-in-out infinite; }
  @keyframes umbrella-pulse-anim {
    0%,100% { opacity: 0.04; transform: scale(1); }
    50%      { opacity: 0.08; transform: scale(1.02); }
  }
  /* ==========================================
     DESIGN WIDGETS
     ========================================== */
  .design-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
    align-items: flex-start;
    box-sizing: border-box;
  }

  /* SHAPE widget */
  .dw-shape-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-circle  { border-radius: 50%; flex-shrink: 0; }
  .dw-square  { border-radius: 0; flex-shrink: 0; }
  .dw-rect    { border-radius: 3px; flex-shrink: 0; }
  .dw-line-h  { height: 3px !important; width: 100%; border-radius: 2px; }
  .dw-line-v  { width: 3px !important; height: 100%; border-radius: 2px; }
  .dw-shape-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center; }

  /* GAUGE widget */
  .dw-gauge-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 10px 8px; gap: 4px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-gauge-svg { overflow: visible; flex-shrink: 0; }
  .dw-gauge-track { fill: none; stroke: #2a2a2a; }
  .dw-gauge-fill  { fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1); }
  .dw-gauge-center { font-family: 'Courier New', monospace; font-weight: bold; }
  .dw-gauge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center; }

  /* SPARKLINE widget */
  .dw-spark-wrap { display: flex; flex-direction: column; padding: 12px 10px 8px; gap: 6px; width: 100%; height: 100%; box-sizing: border-box; justify-content: space-between; }
  .dw-spark-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-spark-name { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-spark-val  { font-size: 20px; font-weight: bold; }
  .dw-spark-unit { font-size: 11px; opacity: 0.7; }
  .dw-spark-svg  { width: 100%; overflow: visible; flex: 1; }
  .dw-spark-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .dw-spark-area { opacity: 0.12; }

  /* BADGE widget */
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
  .dw-badge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-badge-value { font-size: 22px; font-weight: bold; line-height: 1; }
  .dw-badge-unit  { font-size: 12px; opacity: 0.7; font-weight: normal; }

  /* PROGRESS widget */
  .dw-progress-wrap { display: flex; flex-direction: column; padding: 12px 12px 10px; gap: 8px; width: 100%; height: 100%; box-sizing: border-box; justify-content: center; }
  .dw-progress-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-progress-name  { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .dw-progress-valstr { font-size: 16px; font-weight: bold; }
  .dw-progress-track { width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; position: relative; overflow: hidden; flex-shrink: 0; }
  .dw-progress-fill  { height: 100%; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); position: relative; }
  .dw-progress-fill::after { content: ''; position: absolute; top: 0; right: 0; width: 3px; height: 100%; background: rgba(255,255,255,0.35); }

  /* SPA TEMP widget */
  .dw-spa-wrap {
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 12px 14px; width: 100%; height: 100%; box-sizing: border-box;
    position: relative;
  }
  .dw-spa-adj-btn {
    background: none; border: 1px solid #333; color: #888;
    font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold;
    width: 36px; height: 36px; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .dw-spa-adj-btn:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.05); }
  .dw-spa-center { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; justify-content: center; }
  .dw-spa-label  { font-size: 11px; font-weight: bold; letter-spacing: 2px; }
  .dw-spa-temp   { font-size: 52px; font-weight: bold; line-height: 1; font-family: 'Courier New', monospace; }
  .dw-spa-unit   { font-size: 14px; opacity: 0.6; }
  .dw-spa-target { font-size: 13px; font-weight: bold; letter-spacing: 1px; margin-top: 2px; }
  .dw-spa-row    { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
  .dw-spa-heating { font-size: 10px; font-weight: bold; letter-spacing: 2px; padding: 3px 10px; border: 1px solid; }

  /* generic design card wrapper */
  .dw-card {
    background: #0a0a0a; cursor: pointer;
    position: relative; transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden;
    box-sizing: border-box; flex-shrink: 0;
    min-height: 60px;
    border: 1px solid #1e1e1e;
  }
  .dw-card.no-border { border-color: transparent !important; background: transparent; }
  .dw-card.no-border:hover { border-color: #222 !important; }
  .dw-card::before { content:''; position:absolute; top:0; left:0; width:2px; height:100%; transition: background 0.2s; }
  .dw-card.no-border::before { display: none; }
  .dw-card:hover { border-color: #333; }

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
    this._activeFilter = "all";
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



  _umbrellaLogoSvg(size=28, cssClass='umbrella-spin') {
    return html`
      <svg class="${cssClass}" width="${size}" height="${size}" viewBox="0 0 100 100"
           xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <circle cx="50" cy="50" r="48" fill="#111" stroke="#8b0000" stroke-width="2"/>
        <path d="M50,50 L50,4 A46,46 0 0,1 96,50 Z" fill="#8b0000"/>
        <path d="M50,50 L96,50 A46,46 0 0,1 50,96 Z" fill="#8b0000"/>
        <path d="M50,50 L50,96 A46,46 0 0,1 4,50 Z" fill="#8b0000"/>
        <path d="M50,50 L4,50 A46,46 0 0,1 50,4 Z" fill="#8b0000"/>
        <path d="M50,50 L82,18 A46,46 0 0,1 96,50 Z" fill="#ddd"/>
        <path d="M50,50 L82,82 A46,46 0 0,1 50,96 Z" fill="#ddd"/>
        <path d="M50,50 L18,82 A46,46 0 0,1 4,50 Z" fill="#ddd"/>
        <path d="M50,50 L18,18 A46,46 0 0,1 50,4 Z" fill="#ddd"/>
        <circle cx="50" cy="50" r="10" fill="#111" stroke="#8b0000" stroke-width="1.5"/>
        <line x1="50" y1="4" x2="50" y2="96" stroke="#111" stroke-width="2.5"/>
        <line x1="4" y1="50" x2="96" y2="50" stroke="#111" stroke-width="2.5"/>
        <line x1="18" y1="18" x2="82" y2="82" stroke="#111" stroke-width="2.5"/>
        <line x1="82" y1="18" x2="18" y2="82" stroke="#111" stroke-width="2.5"/>
      </svg>`;
  }

  _umbrellaWatermark() {
    return html`
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  pointer-events:none;z-index:0;">
        <svg class="umbrella-pulse" width="280" height="280" viewBox="0 0 100 100"
             xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#8b0000" stroke-width="1.5"/>
          <path d="M50,50 L50,4 A46,46 0 0,1 96,50 Z" fill="#8b0000"/>
          <path d="M50,50 L96,50 A46,46 0 0,1 50,96 Z" fill="#8b0000"/>
          <path d="M50,50 L50,96 A46,46 0 0,1 4,50 Z" fill="#8b0000"/>
          <path d="M50,50 L4,50 A46,46 0 0,1 50,4 Z" fill="#8b0000"/>
          <path d="M50,50 L82,18 A46,46 0 0,1 96,50 Z" fill="#cccccc"/>
          <path d="M50,50 L82,82 A46,46 0 0,1 50,96 Z" fill="#cccccc"/>
          <path d="M50,50 L18,82 A46,46 0 0,1 4,50 Z" fill="#cccccc"/>
          <path d="M50,50 L18,18 A46,46 0 0,1 50,4 Z" fill="#cccccc"/>
          <circle cx="50" cy="50" r="10" fill="#050505"/>
          <line x1="50" y1="4" x2="50" y2="96" stroke="#050505" stroke-width="2.5"/>
          <line x1="4" y1="50" x2="96" y2="50" stroke="#050505" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="82" y2="82" stroke="#050505" stroke-width="2.5"/>
          <line x1="82" y1="18" x2="18" y2="82" stroke="#050505" stroke-width="2.5"/>
        </svg>
      </div>`;
  }

  setConfig(config) { this.config = config; }
  static async getConfigElement() { return document.createElement("resident-evil-card-editor"); }

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

  _renderSpaHud(sensors) {
    const findEnt = (type) => sensors.find(s => typeof s === 'object' && s.type === type)?.entity || null;
    
    const statusId = findEnt("spa_status");
    const waterTempId = findEnt("spa_water");
    const targetTempId = findEnt("spa_target");
    const extTempId = findEnt("ext_temp");
    const extHumId = findEnt("ext_hum");
    const airTempId = findEnt("air_temp");
    const airHumId = findEnt("air_hum");
    const powerId = findEnt("power");
    const energyId = findEnt("energy");
    const filterId = findEnt("filter_days");
    const chlorineId = findEnt("chlorine_days");

    const waterTemp = parseFloat(this.hass.states[waterTempId]?.state || 0).toFixed(2);
    const targetTemp = parseFloat(this.hass.states[targetTempId]?.state || this.hass.states[statusId]?.attributes?.temperature || 34).toFixed(2);
    const isHeating = this.hass.states[statusId]?.attributes?.hvac_action === 'heating' || this.hass.states[statusId]?.state === 'heat' || this.hass.states[statusId]?.state === 'on';

    const extTemp = parseFloat(this.hass.states[extTempId]?.state || 0).toFixed(2);
    const extHum = parseFloat(this.hass.states[extHumId]?.state || 0).toFixed(2);
    const airTemp = parseFloat(this.hass.states[airTempId]?.state || 0).toFixed(2);
    const airHum = parseFloat(this.hass.states[airHumId]?.state || 0).toFixed(2);

    const power = this.hass.states[powerId]?.state || '0';
    const energy = parseFloat(this.hass.states[energyId]?.state || 0).toFixed(2);
    const filterDays = parseFloat(this.hass.states[filterId]?.state || 0).toFixed(2);
    const chlorineDays = parseFloat(this.hass.states[chlorineId]?.state || 0).toFixed(2);

    return html`
      <div class="spa-hud-container">
        <div class="spa-top-bar">
          <div class="spa-badge-heater ${isHeating ? 'heating' : ''}">
            <span class="spa-dot"></span>
            <span>SYSTEM CHAUFFE // ${isHeating ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <button class="spa-dial-arrow" style="color:var(--re-text-gray)" @click="${() => this._handleAction(statusId || waterTempId)}">> OPTIONS DETRAILLEES</button>
        </div>

        <div class="spa-trident-layout">
          <div class="spa-side-metric left">
            <div class="spa-huge-val">${extTemp}°</div>
            <div class="spa-metric-lbl">EXTÉRIEUR</div>
            <div class="spa-sub-badge">${extHum}% HR</div>
          </div>

          <div class="spa-center-dial">
            <button class="spa-dial-arrow" @click="${() => this._adjustTemperature(targetTempId || statusId, 1)}">▲</button>
            <div class="spa-circular-monitor">
              <div class="spa-dial-lbl">EAU</div>
              <div class="spa-dial-temp">${waterTemp}°</div>
              <div class="spa-dial-target">CIBLE ${targetTemp}°</div>
            </div>
            <button class="spa-dial-arrow" @click="${() => this._adjustTemperature(targetTempId || statusId, -1)}">▼</button>
          </div>

          <div class="spa-side-metric right">
            <div class="spa-huge-val">${airTemp}°</div>
            <div class="spa-metric-lbl">AIR SPA</div>
            <div class="spa-sub-badge">${airHum}% HR</div>
          </div>
        </div>

        <div class="spa-energy-row">
          <div class="spa-chip">⚡ Consommation: ${power} W</div>
          <div class="spa-chip">📊 Index Total: ${energy} kWh</div>
        </div>

        <div class="spa-maintenance-grid">
          <div class="spa-maint-strip">
            <div class="spa-strip-header"><span>🗘 CARTOUCHE FILTRE</span><span>OK</span></div>
            <div class="spa-strip-track"><div class="spa-strip-fill" style="width: 35%;"></div></div>
            <div class="spa-strip-footer">${filterDays} j restants / 3 j</div>
          </div>
          <div class="spa-maint-strip">
            <div class="spa-strip-header"><span>🧪 RECHARGE CHLORE</span><span>OK</span></div>
            <div class="spa-strip-track"><div class="spa-strip-fill" style="width: 55%;"></div></div>
            <div class="spa-strip-footer">${chlorineDays} j restants / 13 j</div>
          </div>
        </div>

        <div class="spa-footer-status">
          <div><span class="spa-status-ok">✓</span> SECURITY DIRECTIVE OVERVIEW [OK]</div>
          <div>BATTERY ALIVE</div>
        </div>
      </div>
    `;
  }

  renderEntity(item) {
    const entityId = typeof item === 'object' ? item.entity : item;
    const customIcon = typeof item === 'object' ? item.icon : null;
    const iframeUrl = typeof item === 'object' ? item.url : null;
    
    if (iframeUrl) {
      return html`<div class="re-iframe-wrapper"><iframe class="re-iframe" src="${iframeUrl}" style="width:100%;height:100%;border:none;display:block;"></iframe></div>`;
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
            <span style="font-weight:bold; font-size:11px; color:#aaa;">CIBLE: <span style="color:#fff;">${targetTemp}°C</span></span>
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
          <div class="sensor-value" style="font-size:13px; color:var(--re-text-gray);">STATUT: ${state.toUpperCase()}</div>
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

  _renderDesignWidget(w) {
    const type     = w.type    || 'badge';
    const color    = w.color   || '#00ff00';
    const glow     = color + '66';
    const noBorder = w.noBorder === true;
    const widthPct = Math.min(100, Math.max(5, parseInt(w.widthPct) || 30));
    const heightPx = parseInt(w.heightPx) || 0;
    const sizeStyle = `width: calc(${widthPct}% - 10px); ${heightPx ? 'height:' + heightPx + 'px;' : ''}`;

    switch (type) {
      case 'shape':    return this._renderShape(w, color, glow, sizeStyle, noBorder);
      case 'gauge':    return this._renderGauge(w, color, glow, sizeStyle, noBorder);
      case 'sparkline':return this._renderSparkline(w, color, glow, sizeStyle, noBorder);
      case 'badge':    return this._renderBadge(w, color, glow, sizeStyle, noBorder);
      case 'progress': return this._renderProgress(w, color, glow, sizeStyle, noBorder);
      case 'spa_temp':  return this._renderSpaTemp(w, color, glow, sizeStyle, noBorder);
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

    const shapeEl = (shape === 'line-h' || shape === 'line-v')
      ? html`<div class="dw-${shape}" style="${style}"></div>`
      : html`<div class="dw-${shape}" style="${style}"></div>`;

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="border-color:${color}22; ${sizeStyle}">
        <div class="dw-shape-wrap">
          ${shapeEl}
          ${label ? html`<div class="dw-shape-label" style="color:${color};">${label}</div>` : html``}
        </div>
      </div>`;
  }

  _renderGauge(w, color, glow, sizeStyle, noBorder=false) {
    const { value, unit, name } = this._getDesignState(w);
    const min   = w.min != null ? parseFloat(w.min) : 0;
    const max   = w.max != null ? parseFloat(w.max) : 100;
    const label = w.label || name;
    // gauge radius scales with heightPx if set
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
              <span style="font-size:9px;opacity:0.6;">${unit}</span>
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
    const iconPos  = w.iconPos || 'top';   // top | bottom | left | right | none
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



  // ─── helpers shared with spa widget ────────────────────────────────────────
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
    // ── view driven by w.view (set via YAML / submenu) ──────────────────────
    const tab = w.view || 'home';

    // ── state helpers ─────────────────────────────────────────────────────────
    const ex  = (id) => this._spaEx(id);
    const st  = (id) => this._spaSt(id);
    const at  = (id,a) => this._spaAt(id,a);

    // ── temps ─────────────────────────────────────────────────────────────────
    const tid    = w.targetEntity;
    const wRaw   = this._spaWater(w);
    const wTemp  = wRaw != null ? parseFloat(wRaw) : null;
    const tTemp  = this._spaTarget(w) != null ? parseFloat(this._spaTarget(w)) : null;
    const hvac   = this.hass?.states[tid]?.state;
    const isOn   = hvac === 'heat';
    const atTemp = wTemp!=null && tTemp!=null && wTemp >= tTemp-0.5;
    const tc     = wTemp==null ? '#888' : wTemp<30 ? '#00ccff' : wTemp<36 ? '#00ff88' : wTemp<40 ? '#ff9900' : '#ff3333';

    // ── background ────────────────────────────────────────────────────────────
    const bg   = w.bgImage ? `url('${w.bgImage}')` : 'linear-gradient(135deg,#1a1a2e,#0f3460)';
    const blur = w.bgBlur!=null ? w.bgBlur : 5;

    // ── maintenance ───────────────────────────────────────────────────────────
    const filterAge  = ex(w.filterEntity)   ? parseFloat(st(w.filterEntity))   : null;
    const chloreAge  = ex(w.chlorineEntity) ? parseFloat(st(w.chlorineEntity)) : null;
    const filterMax  = Number(w.filterMax   || 3);
    const chloreMax  = Number(w.chlorineMax || 13);
    const filterWarn = filterAge!=null && filterAge >= filterMax;
    const chloreWarn = chloreAge!=null && chloreAge >= chloreMax;
    const filterPct  = filterAge!=null ? Math.min(100, filterAge/filterMax*100) : 0;
    const chlorePct  = chloreAge!=null ? Math.min(100, chloreAge/chloreMax*100) : 0;
    const pressReset = (eid) => { if (eid && this.hass) this.hass.callService('button','press',{entity_id:eid}); };

    // ── flood ─────────────────────────────────────────────────────────────────
    const leak    = st(w.leakEntity)   === 'on';
    const tamper  = st(w.tamperEntity) === 'on';
    const bat     = ex(w.floodBatEntity) ? parseFloat(st(w.floodBatEntity)) : null;
    const alerting = leak||tamper;
    const batLow   = bat!=null && bat<=15;

    // ── energy ────────────────────────────────────────────────────────────────
    const cons   = ex(w.powerEntity)  ? st(w.powerEntity)  : null;
    const energy = ex(w.energyEntity) ? parseFloat(st(w.energyEntity)) : null;

    // ── ext temps ─────────────────────────────────────────────────────────────
    const extTemp = ex(w.extTempEntity) ? st(w.extTempEntity) : null;
    const extHum  = ex(w.extHumEntity)  ? st(w.extHumEntity)  : null;
    const airTemp = ex(w.airTempEntity) ? st(w.airTempEntity) : null;
    const airHum  = ex(w.airHumEntity)  ? st(w.airHumEntity)  : null;

    // ── chemistry ─────────────────────────────────────────────────────────────
    const ph   = ex(w.phEntity)   ? parseFloat(st(w.phEntity))   : null;
    const orp  = ex(w.orpEntity)  ? parseFloat(st(w.orpEntity))  : null;
    const tds  = ex(w.tdsEntity)  ? parseFloat(st(w.tdsEntity))  : null;
    const salt = ex(w.saltEntity) ? parseFloat(st(w.saltEntity)) : null;
    const chemGauge = (val, min, max, lbl, unit, col) => {
      if (val==null) return html``;
      const pct = Math.min(100, Math.max(0, (val-min)/(max-min)*100));
      const ok  = val>=min && val<=max;
      const c2  = ok ? '#10b981' : '#ef4444';
      return html`
        <div style="display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 10px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;">
            <span style="color:rgba(255,255,255,.6);font-weight:600;">${lbl}</span>
            <span style="color:${c2};font-weight:700;">${val.toFixed(2)} ${unit}</span>
          </div>
          <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct.toFixed(2)}%;background:${c2};border-radius:3px;transition:width .5s;"></div>
          </div>
          <div style="font-size:9px;color:rgba(255,255,255,.35);text-align:right;">${min} – ${max} ${unit}</div>
        </div>`;
    };

    // ── switches ──────────────────────────────────────────────────────────────
    const switches = [];
    for (let i=1; i<=10; i++) {
      const eid  = w['switch_'+i];
      const name = w['name_switch_'+i] || 'Switch '+i;
      if (eid) switches.push({ eid, name });
    }
    const toggleSw = (eid) => {
      const domain = eid.split('.')[0];
      const svc    = (domain==='light') ? 'light' : 'switch';
      this.hass.callService(svc,'toggle',{entity_id:eid});
    };

    // ── camera ────────────────────────────────────────────────────────────────
    const camId   = w.cameraEntity;
    const camState = camId ? this.hass?.states[camId] : null;
    const camUrl  = camState ? `/api/camera_proxy/${camId}?token=${camState.attributes.access_token}&t=${Date.now()}` : null;

    // ── scheduling ────────────────────────────────────────────────────────────
    const schedId = w.scheduleEntity;
    const schedState = schedId ? this.hass?.states[schedId] : null;
    let schedH=0, schedM=0;
    if (schedState) { const p=schedState.state.split(':'); schedH=parseInt(p[0]||0); schedM=parseInt(p[1]||0); }
    const changeSchedTime = (dh,dm) => {
      let nh=schedH+dh, nm=schedM+dm;
      if (nm>=60){nm-=60;nh++;}; if (nm<0){nm+=60;nh--;}
      nh=((nh%24)+24)%24;
      this.hass.callService('input_datetime','set_datetime',{entity_id:schedId,time:`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}:00`});
    };

    // ── no internal TABS — navigation via sidebar submenus ─────────────────

    // ── RENDER HOME ───────────────────────────────────────────────────────────
    // Layout compact 500px: tout tient sans scroll
    // Hauteurs : tabs≈46 + padding≈16 = 462px de contenu
    // Répartition : chauffe=44 + centrale=196 + énergie=30 + maint=66 + flood=34 + gaps(5×6)=30 → 400px ✓
    const renderHome = () => html`
      <div style="display:flex;flex-direction:column;gap:6px;height:100%;">

        <!-- CHAUFFE : 44px -->
        ${tid?.startsWith('climate.') && this.hass?.states[tid] ? html`
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:4px 10px;">
            <button style="border:none;border-radius:8px;padding:5px 12px;display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;font-size:11px;font-family:inherit;
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

        <!-- CENTRALE ext | jauge | air : 196px -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:4px;">
          <!-- EXT -->
          <div style="width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;">
            ${extTemp!=null ? html`
              <div style="font-size:19px;font-weight:700;color:#fff;">${parseFloat(extTemp).toFixed(2)}°</div>
              <div style="font-size:8px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:.5px;">EXTÉRIEUR</div>` : html``}
            ${extHum!=null ? html`
              <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:2px 7px;font-size:10px;color:#fff;">${extHum}% HR</div>` : html``}
          </div>

          <!-- JAUGE -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;"
                 @click="${(e)=>{e.stopPropagation();this._spaChangeTemp(w,0.5);}}">
              <ha-icon icon="mdi:chevron-up" style="--mdc-icon-size:14px;"></ha-icon>
            </div>
            <div style="width:120px;height:120px;position:relative;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;border-radius:50%;border:2px dashed rgba(255,255,255,.15);box-sizing:border-box;"></div>
              <div style="width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <span style="font-size:8px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:1px;">EAU</span>
                <span style="font-size:28px;font-weight:800;color:${tc};line-height:32px;text-shadow:0 0 16px ${tc}66;">
                  ${wTemp!=null ? wTemp.toFixed(2)+'°' : '--'}
                </span>
                ${tTemp!=null ? html`
                  <div style="font-size:8px;font-weight:600;color:#10b981;background:rgba(16,185,129,.12);padding:1px 6px;border-radius:16px;margin-top:1px;border:1px solid rgba(16,185,129,.2);">
                    CIBLE ${tTemp}°
                  </div>` : html``}
              </div>
            </div>
            <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;"
                 @click="${(e)=>{e.stopPropagation();this._spaChangeTemp(w,-0.5);}}">
              <ha-icon icon="mdi:chevron-down" style="--mdc-icon-size:14px;"></ha-icon>
            </div>
          </div>

          <!-- AIR SPA -->
          <div style="width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;">
            ${airTemp!=null ? html`
              <div style="font-size:19px;font-weight:700;color:#fff;">${parseFloat(airTemp).toFixed(2)}°</div>
              <div style="font-size:8px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:.5px;">AIR SPA</div>` : html``}
            ${airHum!=null ? html`
              <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:2px 7px;font-size:10px;color:#fff;">${airHum}% HR</div>` : html``}
          </div>
        </div>

        <!-- ÉNERGIE : 28px -->
        ${(cons!=null||energy!=null) ? html`
          <div style="flex-shrink:0;display:flex;gap:6px;justify-content:center;">
            ${cons!=null ? html`<div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 10px;font-size:11px;color:#fff;font-weight:500;"><ha-icon icon="mdi:lightning-bolt" style="--mdc-icon-size:12px;color:#ffeb3b;"></ha-icon>${cons} W</div>` : html``}
            ${energy!=null ? html`<div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 10px;font-size:11px;color:#fff;font-weight:500;"><ha-icon icon="mdi:flash" style="--mdc-icon-size:12px;"></ha-icon>${energy.toFixed(2)} kWh</div>` : html``}
          </div>` : html``}

        <!-- MAINTENANCE filtre + chlore : 66px -->
        ${(filterAge!=null||chloreAge!=null) ? html`
          <div style="flex-shrink:0;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            ${filterAge!=null ? html`
              <div style="background:rgba(255,255,255,.03);border:1px solid ${filterWarn?'rgba(239,68,68,.3)':'rgba(255,255,255,.1)'};border-radius:10px;padding:7px;position:relative;">
                <div style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:rgba(255,255,255,.6);">
                  <ha-icon icon="mdi:air-filter" style="--mdc-icon-size:12px;"></ha-icon>Filtre
                  ${filterWarn ? html`<span style="font-size:8px;padding:1px 3px;border-radius:3px;background:rgba(239,68,68,.15);color:#ef4444;">!</span>` : html``}
                  ${w.resetFilterEntity ? html`<button style="position:absolute;top:5px;right:5px;width:14px;height:14px;border-radius:3px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;" @click="${(e)=>{e.stopPropagation();pressReset(w.resetFilterEntity);}}">✓</button>` : html``}
                </div>
                <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin:4px 0;"><div style="height:100%;width:${filterPct.toFixed(2)}%;background:${filterWarn?'#ef4444':'#10b981'};border-radius:2px;"></div></div>
                <div style="font-size:9px;color:#fff;font-weight:500;text-align:right;">${Math.round(filterAge)} j / ${filterMax} j</div>
              </div>` : html``}
            ${chloreAge!=null ? html`
              <div style="background:rgba(255,255,255,.03);border:1px solid ${chloreWarn?'rgba(239,68,68,.3)':'rgba(255,255,255,.1)'};border-radius:10px;padding:7px;position:relative;">
                <div style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:rgba(255,255,255,.6);">
                  <ha-icon icon="mdi:flask-outline" style="--mdc-icon-size:12px;"></ha-icon>Chlore
                  ${chloreWarn ? html`<span style="font-size:8px;padding:1px 3px;border-radius:3px;background:rgba(239,68,68,.15);color:#ef4444;">!</span>` : html``}
                  ${w.resetChlorineEntity ? html`<button style="position:absolute;top:5px;right:5px;width:14px;height:14px;border-radius:3px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;" @click="${(e)=>{e.stopPropagation();pressReset(w.resetChlorineEntity);}}">✓</button>` : html``}
                </div>
                <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin:4px 0;"><div style="height:100%;width:${chlorePct.toFixed(2)}%;background:${chloreWarn?'#ef4444':'#10b981'};border-radius:2px;"></div></div>
                <div style="font-size:9px;color:#fff;font-weight:500;text-align:right;">${Math.round(chloreAge)} j / ${chloreMax} j</div>
              </div>` : html``}
          </div>` : html``}

        <!-- INONDATION : 32px -->
        ${(w.leakEntity||w.tamperEntity||w.floodBatEntity) ? html`
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:10px;font-size:10px;font-weight:600;
            ${alerting?'background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);color:#ef4444;':'background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.15);color:#10b981;'}">
            <div style="display:flex;align-items:center;gap:6px;">
              <ha-icon icon="${leak?'mdi:water-alert':tamper?'mdi:shield-alert':'mdi:shield-check'}" style="--mdc-icon-size:14px;"></ha-icon>
              <span>${leak?'FUITE DÉTECTÉE !':tamper?'SABOTAGE !':'Sécurité OK'}</span>
            </div>
            ${bat!=null ? html`<div style="display:flex;align-items:center;gap:3px;padding:1px 5px;border-radius:5px;font-size:9px;background:${batLow?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)'};color:${batLow?'#ef4444':'#fff'};"><ha-icon icon="${batLow?'mdi:battery-alert':'mdi:battery'}" style="--mdc-icon-size:11px;"></ha-icon>${Math.round(bat)}%</div>` : html``}
          </div>` : html``}

      </div>`;

    // ── RENDER CHEM ───────────────────────────────────────────────────────────
    const renderChem = () => html`
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${chemGauge(ph,   Number(w.ph_min||7),   Number(w.ph_max||7.6),  'pH',  '',    '#6b8eff')}
        ${chemGauge(orp,  Number(w.orp_min||650), Number(w.orp_max||800), 'ORP', 'mV',  '#10b981')}
        ${chemGauge(tds,  Number(w.tds_min||500), Number(w.tds_max||2000),'TDS', 'ppm', '#f59e0b')}
        ${chemGauge(salt, Number(w.salt_min||300), Number(w.salt_max||500),'Sel', 'ppm', '#0ea5e9')}
        ${ph==null&&orp==null&&tds==null&&salt==null ? html`<div style="color:rgba(255,255,255,.4);font-size:12px;text-align:center;padding:20px;">Aucune entité chimie configurée</div>` : html``}
      </div>`;

    // ── RENDER SWITCHES — grille compacte 2 colonnes ────────────────────────
    const renderSw = () => html`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-content:start;">
        ${switches.map(({eid,name}) => {
          const s     = this.hass?.states[eid];
          const isOn  = s?.state === 'on';
          const dom   = eid.split('.')[0];
          const icons = {light:'mdi:lightbulb',switch:'mdi:power-plug',input_boolean:'mdi:toggle-switch'};
          const icon  = s?.attributes?.icon || icons[dom] || 'mdi:power';
          return html`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;
                        background:${isOn?'rgba(16,185,129,.1)':'rgba(255,255,255,.04)'};
                        border:1px solid ${isOn?'rgba(16,185,129,.3)':'rgba(255,255,255,.08)'};
                        border-radius:10px;padding:7px 10px;cursor:pointer;transition:.2s;"
                 @click="${(e)=>{e.stopPropagation();toggleSw(eid);}}">
              <div style="display:flex;align-items:center;gap:6px;min-width:0;">
                <ha-icon icon="${icon}"
                  style="--mdc-icon-size:16px;flex-shrink:0;color:${isOn?'#10b981':'rgba(255,255,255,.5)'};">
                </ha-icon>
                <span style="font-size:11px;font-weight:600;color:${isOn?'#fff':'rgba(255,255,255,.6)'};
                             white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</span>
              </div>
              <div style="flex-shrink:0;width:32px;height:18px;border-radius:9px;
                          background:${isOn?'#10b981':'rgba(255,255,255,.15)'};
                          position:relative;transition:.25s;">
                <div style="position:absolute;top:2px;left:${isOn?'14px':'2px'};
                            width:14px;height:14px;border-radius:50%;background:#fff;
                            box-shadow:0 1px 3px rgba(0,0,0,.3);transition:.25s;"></div>
              </div>
            </div>`;
        })}
        ${switches.length===0 ? html`
          <div style="grid-column:span 2;text-align:center;color:rgba(255,255,255,.3);font-size:11px;padding:20px;">
            Aucun interrupteur configuré
          </div>` : html``}
      </div>`;

    // ── RENDER PROG — programmation + TTR ───────────────────────────────────
    const renderProg = () => {
      // TTR : volume L, puissance W, perte %, delta T
      const vol    = Number(w.lz_volume   || 500);
      const power  = Number(w.lz_power_w  || 2000);
      const loss   = Number(w.lz_heat_loss || 25) / 100;
      const effP   = power * (1 - loss);                        // W effectifs
      const deltaT = (tTemp || 34) - (wTemp || 20);
      const ttrMin = deltaT > 0 ? Math.round((vol * 4186 * deltaT) / (effP * 60)) : 0;
      const ttrH   = Math.floor(ttrMin / 60);
      const ttrM   = ttrMin % 60;

      // heure prête = heure prog choisie
      const readyStr = schedState
        ? `${String(schedH).padStart(2,'0')}:${String(schedM).padStart(2,'0')}`
        : '--:--';

      // heure de début idéale = heure prête - TTR
      let startH = schedH - ttrH, startM = schedM - ttrM;
      if (startM < 0) { startM += 60; startH--; }
      startH = ((startH % 24) + 24) % 24;
      const startStr = schedState
        ? `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`
        : '--:--';

      // entité TTR externe si dispo
      const ttrEntity = w.ttrEntity ? this.hass?.states[w.ttrEntity] : null;
      const ttrDisplay = ttrEntity
        ? ttrEntity.state + ' ' + (ttrEntity.attributes.unit_of_measurement || '')
        : `${ttrH}h ${String(ttrM).padStart(2,'0')}m`;

      return html`
        <div style="display:flex;flex-direction:column;gap:8px;height:100%;">

          <!-- HEURE CIBLE -->
          ${schedId && schedState ? html`
            <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px;flex-shrink:0;">
              <div style="display:flex;align-items:center;gap:8px;font-size:10px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:1px;margin-bottom:8px;">
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
            <div style="color:rgba(255,255,255,.3);font-size:11px;text-align:center;padding:10px;">
              Configurez scheduleEntity pour activer la programmation
            </div>`}

          <!-- TTR + HEURE DE DÉPART -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-shrink:0;">
            <div style="background:rgba(107,142,255,.06);border:1px solid rgba(107,142,255,.2);border-radius:12px;padding:10px;text-align:center;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">
                TEMPS DE CHAUFFE
              </div>
              <div style="font-size:22px;font-weight:800;color:#6b8eff;line-height:1;">
                ${ttrDisplay}
              </div>
              <div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:3px;">
                ${vol}L · ${power}W · -${Math.round(loss*100)}% pertes
              </div>
            </div>
            <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:10px;text-align:center;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:4px;">
                LANCER LA CHAUFFE À
              </div>
              <div style="font-size:22px;font-weight:800;color:#10b981;line-height:1;">
                ${startStr}
              </div>
              <div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:3px;">
                ${wTemp!=null?wTemp.toFixed(2)+'°':'--°'} → ${tTemp!=null?tTemp+'°':'--°'} eau
              </div>
            </div>
          </div>

          <!-- BARRE PROGRESSION TEMPÉRATURE -->
          ${wTemp!=null && tTemp!=null ? html`
            <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;flex-shrink:0;">
              <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:600;margin-bottom:6px;">
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

        </div>`;
    };

        // ── RENDER CAM ────────────────────────────────────────────────────────────
    const renderCam = () => html`
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${camUrl ? html`
          <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1);">
            <img src="${camUrl}" style="width:100%;display:block;object-fit:cover;" alt="Caméra Spa" />
          </div>` : html`<div style="color:rgba(255,255,255,.4);font-size:12px;text-align:center;padding:20px;">Aucune caméra configurée</div>`}
        ${schedId && schedState ? html`
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:rgba(255,255,255,.6);letter-spacing:.5px;">
              <ha-icon icon="mdi:clock-digital" style="--mdc-icon-size:15px;color:#6b8eff;"></ha-icon>
              PLANIFICATION CHAUFFE
            </div>
            <div style="text-align:center;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px;">
              ${String(schedH).padStart(2,'0')}:${String(schedM).padStart(2,'0')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
              ${[[-1,0,'-1h'],[0,-15,'-15m'],[0,15,'+15m'],[1,0,'+1h']].map(([dh,dm,lbl]) => html`
                <button style="border:none;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:7px 0;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;"
                  @click="${(e)=>{e.stopPropagation();changeSchedTime(dh,dm);}}">${lbl}</button>`)}
            </div>
          </div>` : html``}
      </div>`;

    // ── FULL WIDGET ────────────────────────────────────────────────────────────
    return html`
      <div class="dw-card ${noBorder?'no-border':''}"
           style="${sizeStyle} border-color:${color}22; overflow:hidden; position:relative;">

        <!-- BG flouté -->
        <div style="position:absolute;inset:0;background:${bg};background-size:cover;background-position:center;filter:blur(${blur}px);transform:scale(1.05);"></div>
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.38);"></div>

        <!-- Contenu -->
        <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;overflow:hidden;">

          <!-- CONTENU FIXE SANS SCROLL (vue contrôlée par w.view) -->
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
        if (!groups[c]) groups[c]=[];
        groups[c].push(s);
      });
      const cats = CAT_ORDER.filter(k => groups[k]?.length > 0);

      // ── Budget calcul hauteurs ────────────────────────────────────────────
      // totalH - barre ECG globale(22) - padding body(4+4) - header(52) - barre poids(42) - gaps
      const headerH  = 58;   // avatar + nom + poids
      const weightH  = wCur != null ? 42 : 0;
      const ecgH     = 22;
      const bodyPad  = 8;    // top+bot
      const gapInner = 5;    // gaps dans la colonne
      const nGaps    = cats.length + (wCur!=null?1:0);  // gaps entre blocs

      const availH = totalH - ecgH - bodyPad - headerH - weightH - (nGaps * gapInner);

      // Chaque section : cols = min(n, 3), rows = ceil(n/cols)
      const CELL_H    = 64;   // hauteur fixe d'une rangée de capteurs (icône+nom+valeur)
      const SEC_HDR_H = 18;   // hauteur du label de section

      // Calcule la hauteur naturelle de chaque section
      const secHeights = cats.map(cat => {
        const n    = groups[cat].length;
        const cols = n <= 3 ? n : Math.ceil(n/2);
        const rows = Math.ceil(n/cols);
        return { cat, n, cols, rows, h: SEC_HDR_H + rows * CELL_H + (rows-1)*2 + 6 };
      });

      // Si la somme dépasse availH, on réduit CELL_H proportionnellement
      const totalNatural = secHeights.reduce((s,m) => s+m.h, 0);
      const scale = totalNatural > availH && availH > 0
        ? availH / totalNatural
        : 1;

      const scaledCellH = Math.floor(CELL_H * scale);
      const scaledHdrH  = Math.floor(SEC_HDR_H * scale);

      // Recalcule les hauteurs finales
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

          <!-- HEADER PERSONNE -->
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

          <!-- BARRE POIDS -->
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

          <!-- SECTIONS CAPTEURS à hauteur fixe calculée -->
          ${finalSecs.map(({cat, cols, rows, h}) => {
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

        <!-- Barre top -->
        <div style="position:absolute;top:0;left:0;right:0;height:3px;
                    background:linear-gradient(90deg,#06b6d4,#818cf8,#10b981);z-index:5;"></div>

        <!-- ECG header global -->
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

        <!-- COLONNES PERSONNES -->
        <div style="flex:1;display:flex;gap:4px;padding:0 4px 4px;overflow:hidden;">
          ${people.map(p => renderPerson(p))}
        </div>

        <!-- SÉPARATEUR vertical entre personnes -->
        <style>
          @keyframes ecg-health { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        </style>
      </div>`;
  }

  _renderServerWidget(w, sizeStyle, noBorder=false) {
    const getSt  = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid].state : null;
    const getObj = (eid) => eid && this.hass?.states[eid] ? this.hass.states[eid] : null;
    const fmt    = (v, dec=2) => { const n=parseFloat(v); return isNaN(n)?String(v||'--'):n.toFixed(dec); };

    // ── Données ─────────────────────────────────────────────────────────────
    const cpuVal   = parseFloat(getSt(w.cpu_entity))    || 0;
    const ramVal   = parseFloat(getSt(w.ram_entity))    || 0;
    const hddVal   = parseFloat(getSt(w.hdd_entity))    || 0;
    const uptimeSt = getObj(w.uptime_entity);
    const statusSt = getObj(w.status_entity);
    const statusOk = statusSt ? ['on','ok','running','online','true'].includes(String(statusSt.state).toLowerCase()) : null;
    const uptimeVal= uptimeSt ? uptimeSt.state : '--';
    const uptimeUnit= uptimeSt?.attributes?.unit_of_measurement || '';

    // Disques additionnels
    const disks = w.disks || [];

    // Processus
    const procVal  = getSt(w.process_entity);

    // Couleur dynamique selon charge
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
              style="fill:${col};font-size:13px;font-weight:900;font-family:'Courier New',monospace;">
              ${val}
            </text>
            <text x="${cx}" y="${cy+11}" text-anchor="middle"
              style="fill:#555;font-size:10px;font-family:'Courier New',monospace;">${unit}</text>
          </svg>
          <div style="font-size:11px;font-weight:700;color:#cbd5e1;letter-spacing:.8px;
                      text-transform:uppercase;">${label}</div>
        </div>`;
    };

    const diskBar = (disk) => {
      const val = parseFloat(getSt(disk.entity));
      if (isNaN(val)) return html``;
      const pct = Math.min(val, 100);
      const col = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#818cf8';
      return html`
        <div style="display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;justify-content:space-between;align-items:center;
                      font-size:12px;font-family:'Courier New',monospace;">
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

        <!-- Grille de fond -->
        <div style="position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:linear-gradient(rgba(0,255,136,.03) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(0,255,136,.03) 1px,transparent 1px);
          background-size:24px 24px;"></div>

        <div style="position:relative;z-index:1;padding:10px;display:flex;
                    flex-direction:column;gap:8px;height:100%;box-sizing:border-box;">

          <!-- HEADER -->
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;
                      border-bottom:1px solid #00ff8820;padding-bottom:7px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <ha-icon icon="${w.server_icon||'mdi:server'}"
                style="--mdc-icon-size:18px;color:#00ff88;filter:drop-shadow(0 0 4px #00ff88);"></ha-icon>
              <div>
                <div style="font-size:13px;font-weight:bold;color:#fff;text-transform:uppercase;
                            letter-spacing:1px;text-shadow:0 0 8px #00ff8866;">
                  ${w.server_name||'SERVEUR'}
                </div>
                <div style="font-size:11px;color:#cbd5e1;letter-spacing:.8px;">${w.server_os||'SYSTEM ONLINE'}</div>
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

          <!-- JAUGES PRINCIPALES : CPU / RAM / HDD -->
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
                  <div style="font-size:10px;color:#64748b;">PROC.</div>
                </div>
                <div style="font-size:11px;font-weight:700;color:#cbd5e1;letter-spacing:.8px;
                            text-transform:uppercase;">PROCESSUS</div>
              </div>` : html``}
          </div>

          <!-- DISQUES ──────────────────────────────────────────────── -->
          ${disks.length > 0 ? html`
            <div style="flex:1;display:flex;flex-direction:column;gap:5px;
                        background:rgba(0,0,0,.3);border:1px solid #0f1f0f;
                        border-radius:8px;padding:8px 10px;overflow:hidden;">
              <div style="flex-shrink:0;font-size:11px;font-weight:700;color:#00ff8866;
                          letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">
                ◈ STOCKAGE
              </div>
              ${disks.map(d => diskBar(d))}
            </div>` : html``}

        </div>
      </div>`;
  }





  _renderSolarWidget(w, sizeStyle, noBorder=false) {
    const fixedTab  = w.active_tab != null ? parseInt(w.active_tab) : 0;
    const tabNames  = ['solar','meteo','batt','eco'];
    const cfg       = w.solar_config || {};

    // Après rendu : cliquer sur l'onglet interne de solar-master-card
    const clickTab = () => {
      setTimeout(() => {
        const cards = this.shadowRoot
          ? this.shadowRoot.querySelectorAll('solar-master-card')
          : [];
        cards.forEach(el => {
          const sr = el.shadowRoot;
          if (!sr) return;

          // Cacher tous les onglets visuellement
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

          // Trouver et cliquer le bon onglet (index fixedTab)
          const tabBtns = sr.querySelectorAll(
            '.tab-btn, .nav-btn, [class*="tab-item"], [class*="nav-item"], ' +
            '.tab-button, button[data-tab], [role="tab"]'
          );
          if (tabBtns.length > fixedTab) {
            tabBtns[fixedTab].click();
          } else {
            // Fallback: chercher par data-tab ou data-index
            const byData = sr.querySelector(
              '[data-tab="'+tabNames[fixedTab]+'"], ' +
              '[data-index="'+fixedTab+'"], ' +
              '[data-id="'+tabNames[fixedTab]+'"]'
            );
            if (byData) byData.click();
          }
        });
      }, 300);
    };

    // Lancer le clic à chaque rendu
    clickTab();

    return html`
      <div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;${sizeStyle}">
        <div style="flex:1;min-height:0;overflow:hidden;">
          <solar-master-card
            style="display:block;width:100%;height:100%;"
            .hass="${this.hass}"
            .config="${{...cfg, _active_tab: tabNames[fixedTab], _hide_tabs: true}}">
          </solar-master-card>
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
        <div style="background:${isOn?'rgba(6,182,212,.08)':'rgba(255,255,255,.03)'};border:1px solid ${isOn?'rgba(6,182,212,.3)':'#1e2d3d'};border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;cursor:pointer;"
             @click="${(e)=>{e.stopPropagation();toggle(item.entity);}}">
          <div style="display:flex;align-items:center;gap:12px;">
            ${item.img?html`<div style="width:60px;height:60px;flex-shrink:0;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1e2d3d;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:4px;${isOn?'':'filter:grayscale(.7) opacity(.6);'}"/></div>`:html``}
            <div style="flex:1;">
              <div style="font-size:15px;font-weight:700;color:#f1f5f9;">${item.name}</div>
              <div style="font-size:13px;font-weight:800;color:${col};margin-top:2px;">${isOn?'EN MARCHE':'ARRÊTÉ'}</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${(item.sensors||[]).map(eid => {
              const sv  = getSt(eid);
              const sst = this.hass?.states[eid];
              const un  = sst?.attributes?.unit_of_measurement || '';
              const icons = {'V':'mdi:sine-wave','A':'mdi:current-ac','W':'mdi:lightning-bolt','kWh':'mdi:lightning-bolt-outline','%':'mdi:percent'};
              return html`<div style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.05);border:1px solid #1e2d3d;border-radius:20px;padding:3px 10px;font-size:12px;color:#94a3b8;">
                <ha-icon icon="${icons[un]||'mdi:eye'}" style="--mdc-icon-size:12px;color:#f59e0b;"></ha-icon>${fmt(sv)} ${un}</div>`;
            })}
          </div>
        </div>`;
    };

    const renderAppliance = (item) => {
      const st   = this.hass?.states[item.entity];
      const isOn = st?.state === 'on';
      const col  = isOn ? '#f59e0b' : '#475569';
      return html`
        <div style="background:${isOn?'rgba(245,158,11,.08)':'rgba(255,255,255,.03)'};border:1px solid ${isOn?'rgba(245,158,11,.3)':'#1e2d3d'};border-radius:14px;padding:14px;cursor:pointer;"
             @click="${(e)=>{e.stopPropagation();toggle(item.entity);}}">
          <div style="display:flex;align-items:center;gap:12px;">
            ${item.img?html`<div style="width:60px;height:60px;flex-shrink:0;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1e2d3d;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:4px;${isOn?'':'filter:grayscale(.7) opacity(.6);'}"/></div>`:html``}
            <div style="flex:1;">
              <div style="font-size:15px;font-weight:700;color:#f1f5f9;">${item.name}</div>
              <div style="font-size:13px;font-weight:800;color:${col};margin-top:2px;">${isOn?'EN MARCHE':'ARRÊTÉ'}</div>
            </div>
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
      const cBar=(label,v)=>{const col=v<=20?'#ef4444':v<=50?'#f59e0b':'#00ff88';return html`<div style="display:grid;grid-template-columns:90px 1fr 34px;align-items:center;gap:6px;"><span style="font-size:12px;color:#64748b;font-family:'Courier New',monospace;">${label}</span><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${v}%;background:${col};box-shadow:0 0 4px ${col}66;"></div></div><span style="font-size:12px;font-weight:700;color:${col};text-align:right;">${v}%</span></div>`;};
      return html`
        <div style="flex:1;min-width:0;border:1px solid rgba(129,140,248,.2);border-radius:12px;background:rgba(5,10,20,.85);overflow:hidden;display:flex;flex-direction:column;font-family:'Courier New',monospace;">
          <div style="height:2px;background:linear-gradient(90deg,#818cf8,#22c55e,transparent);"></div>
          <div style="padding:10px 12px 8px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(129,140,248,.1);">
            ${item.img?html`<div style="width:44px;height:44px;flex-shrink:0;background:rgba(0,0,0,.4);border:1px solid rgba(129,140,248,.2);border-radius:8px;overflow:hidden;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:3px;"/></div>`:html``}
            <div style="flex:1;"><div style="font-size:14px;font-weight:700;color:#e2e8f0;">${item.name}</div>${item.subtitle?html`<div style="font-size:12px;color:#475569;">${item.subtitle}</div>`:html``}${fw?html`<div style="font-size:11px;color:#334155;">// ${fw}</div>`:html``}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
              ${bat!=null?html`<span style="font-size:13px;font-weight:700;color:${batCol};">⚡ ${bat}%</span>`:html``}
              <span style="font-size:12px;font-weight:700;padding:2px 7px;border:1px solid ${stCol}44;color:${stCol};">${stLbl}</span>
              ${stateExt?html`<span style="font-size:11px;color:#475569;">${trOpt(stateExt)}</span>`:html``}
            </div>
          </div>
          <div style="flex:1;min-height:0;display:flex;gap:0;">
            <div style="flex:1;padding:8px 12px;display:flex;flex-direction:column;gap:6px;border-right:1px solid rgba(129,140,248,.08);overflow-y:auto;">
              ${(curRoom||area||dur||fanSpeed)?html`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                ${curRoom?html`<div style="background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.15);border-radius:4px;padding:3px 8px;"><span style="font-size:11px;color:#475569;">PIÈCE </span><span style="font-size:13px;color:#818cf8;font-weight:700;">${curRoom}</span></div>`:html``}
                ${area?html`<div><span style="font-size:16px;font-weight:800;color:#818cf8;">${area}</span><span style="font-size:11px;color:#475569;"> m²</span></div>`:html``}
                ${dur?html`<div><span style="font-size:16px;font-weight:800;color:#818cf8;">${dur}</span><span style="font-size:11px;color:#475569;"> min</span></div>`:html``}
                ${fanSpeed?html`<span style="font-size:11px;padding:2px 6px;border:1px solid #06b6d422;color:#06b6d4;">⚙ ${trOpt(fanSpeed)}</span>`:html``}
              </div>`:html``}
              ${cons.length>0?html`<div><div style="font-size:12px;color:#475569;letter-spacing:.8px;margin-bottom:4px;">// CONSOMMABLES</div><div style="display:flex;flex-direction:column;gap:5px;">${cons.map(c=>cBar(c.l,c.v))}</div></div>`:html``}
              ${(sc1St||sc2St)?html`<div><div style="font-size:12px;color:#475569;letter-spacing:.8px;margin-bottom:4px;">// RACCOURCIS</div><div style="display:flex;gap:5px;flex-wrap:wrap;">
                ${sc1St?html`<button style="flex:1;padding:5px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.25);color:#818cf8;" @click="${(e)=>{e.stopPropagation();callBtn(sc1Eid);}}" >⊞ ${sc1Name}</button>`:html``}
                ${sc2St?html`<button style="flex:1;padding:5px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.25);color:#818cf8;" @click="${(e)=>{e.stopPropagation();callBtn(sc2Eid);}}" >⊞ ${sc2Name}</button>`:html``}
              </div></div>`:html``}
              ${rooms.length>0?html`<div><div style="font-size:12px;color:#475569;letter-spacing:.8px;margin-bottom:4px;">// ZONES</div><div style="display:flex;gap:4px;flex-wrap:wrap;">${rooms.map(r=>html`<button style="padding:4px 8px;border-radius:4px;font-family:'Courier New',monospace;font-size:11px;cursor:pointer;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);color:#06b6d4;" @click="${(e)=>{e.stopPropagation();callVac('send_command',{command:'segment_clean',params:{segments:[r.id||r]}});}}">⊙ ${r.name||r}</button>`)}</div></div>`:html``}
            </div>
            ${camUrl?html`<div style="width:190px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);overflow:hidden;"><img src="${camUrl}" style="max-width:190px;max-height:210px;object-fit:contain;filter:brightness(.85) contrast(1.1);"/></div>`:html``}
          </div>
          <div style="padding:7px 10px;border-top:1px solid rgba(129,140,248,.1);display:flex;flex-wrap:wrap;gap:5px;">
            ${[{l:'▶ DÉMARRER',fn:()=>callVac('start'),col:'#22c55e'},{l:'⏸ PAUSE',fn:()=>callVac('pause'),col:'#818cf8'},{l:'⌂ BASE',fn:()=>callVac('return_to_base'),col:'#06b6d4'},{l:'⊙ LOCALISER',fn:()=>callVac('locate'),col:'#f59e0b'},{l:'▣ VIDER BAC',fn:()=>callVac('send_command',{command:'start_wash'}),col:'#64748b'}].map(b=>html`<button style="flex:1;min-width:55px;padding:5px 3px;border-radius:4px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;cursor:pointer;background:${b.col}12;border:1px solid ${b.col}44;color:${b.col};" @click="${(e)=>{e.stopPropagation();b.fn();}}">${b.l}</button>`)}
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
      const cBar=(label,v,col2)=>{const n=parseFloat(v);const col=n<=20?'#ef4444':n<=50?'#f59e0b':(col2||'#22c55e');return html`<div style="display:grid;grid-template-columns:80px 1fr 40px;align-items:center;gap:6px;"><span style="font-size:12px;color:#64748b;font-family:'Courier New',monospace;">${label}</span><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${Math.min(n,100)}%;background:${col};box-shadow:0 0 4px ${col}66;"></div></div><span style="font-size:12px;font-weight:700;color:${col};text-align:right;">${v}%</span></div>`;};
      const consRow=(label,val,col,btnEid)=>val==null?html``:html`<div style="margin-bottom:7px;">${cBar(label,val,col)}<button style="width:100%;margin-top:3px;padding:5px 8px;border-radius:3px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;background:${col}10;border:1px solid ${col}33;color:${col};" @click="${(e)=>{e.stopPropagation();callBtn(btnEid);}}">↺ RÉINITIALISER</button></div>`;
      const selStyle=`width:100%;padding:5px 26px 5px 8px;background:rgba(0,0,0,.6);color:#e2e8f0;border:1px solid rgba(34,197,94,.3);border-radius:4px;font-family:'Courier New',monospace;font-size:12px;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;`;
      const selRow=(label,eid,opts,cur)=>opts.length===0?html``:html`<div><div style="font-size:12px;color:#475569;letter-spacing:.8px;margin-bottom:3px;">${label}</div><div style="position:relative;"><select style="${selStyle}" .value="${cur||''}" @change="${(e)=>{e.stopPropagation();callSel(eid,e.target.value);}}">${opts.map(o=>html`<option value="${o}" .selected="${o===cur}">${trOpt(o)}</option>`)}</select><span style="position:absolute;right:7px;top:50%;transform:translateY(-50%);color:#22c55e;font-size:11px;pointer-events:none;">▼</span></div><div style="font-size:12px;color:#22c55e;margin-top:2px;padding-left:2px;">▸ ${trOpt(cur)||'—'}</div></div>`;
      return html`
        <div style="flex:1;min-width:0;border:1px solid rgba(34,197,94,.2);border-radius:12px;background:rgba(5,10,20,.85);overflow:hidden;display:flex;flex-direction:column;font-family:'Courier New',monospace;">
          <div style="height:2px;background:linear-gradient(90deg,#22c55e,#06b6d4,transparent);"></div>
          <div style="padding:10px 12px 8px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(34,197,94,.1);">
            ${item.img?html`<div style="width:44px;height:44px;flex-shrink:0;background:rgba(0,0,0,.4);border:1px solid rgba(34,197,94,.2);border-radius:8px;overflow:hidden;"><img src="${item.img}" style="width:100%;height:100%;object-fit:contain;padding:3px;"/></div>`:html``}
            <div style="flex:1;"><div style="font-size:14px;font-weight:700;color:#e2e8f0;">${item.name}</div>${item.subtitle?html`<div style="font-size:12px;color:#475569;">${item.subtitle}</div>`:html``}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
              ${bat!=null?html`<span style="font-size:13px;font-weight:700;color:${batCol};">⚡ ${bat}%</span>`:html``}
              <span style="font-size:12px;font-weight:700;padding:2px 7px;border:1px solid ${stCol}44;color:${stCol};">${stLbl}</span>
            </div>
          </div>
          <div style="flex:1;min-height:0;display:flex;gap:0;">
            <div style="flex:0 0 235px;padding:8px 12px;display:flex;flex-direction:column;gap:4px;border-right:1px solid rgba(34,197,94,.08);overflow-y:auto;">
              <div style="font-size:12px;color:#475569;letter-spacing:.8px;margin-bottom:2px;">// CONSOMMABLES</div>
              ${consRow('LAMES',lames,'#22c55e',btnLames)}
              ${consRow('MAINT.',maint,'#06b6d4',btnMaint)}
              ${consRow('BROSSE',brosse,'#818cf8',btnBrosse)}
              <div style="font-size:12px;color:#475569;letter-spacing:.8px;margin:4px 0 2px;">// MISSION</div>
              <div style="display:flex;flex-direction:column;gap:7px;">
                ${selRow('CARTE',mapEid,mapOpts,mapCur)}
                ${selRow('ZONE',zoneEid,zoneOpts,zoneCur)}
                ${selRow('ACTION',actEid,actOpts,actCur)}
              </div>
              ${progNum!=null&&!isNaN(progNum)?html`<div style="margin-top:6px;"><div style="font-size:12px;color:#475569;letter-spacing:.8px;margin-bottom:4px;">// PROGRESSION</div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;"><span style="color:#64748b;">Tonte</span><span style="font-weight:800;color:#22c55e;">${progNum.toFixed(0)}%</span></div><div style="height:5px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="height:100%;width:${progNum.toFixed(0)}%;background:linear-gradient(90deg,#22c55e,#86efac);box-shadow:0 0 6px #22c55e88;"></div></div></div>`:html``}
            </div>
            ${camUrl?html`<div style="flex:1;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.2);overflow:hidden;position:relative;"><img src="${camUrl+'&_t='+(Math.floor(Date.now()/5000)*5000)}" style="max-width:100%;max-height:220px;object-fit:contain;"/>${isOn?html`<div style="position:absolute;top:6px;right:6px;font-size:12px;color:#22c55e;font-family:'Courier New',monospace;background:rgba(0,0,0,.6);padding:2px 5px;border:1px solid #22c55e44;">● LIVE</div>`:html``}</div>`:html``}
          </div>
          <div style="padding:7px 10px;border-top:1px solid rgba(34,197,94,.1);display:flex;flex-wrap:wrap;gap:5px;">
            ${[{l:'▶ TONDRE',fn:()=>callMow('start_mowing'),col:'#22c55e',flex:2},{l:'⏸ PAUSE',fn:()=>callMow('pause'),col:'#818cf8',flex:1},{l:'⌂ BASE',fn:()=>callMow('dock'),col:'#06b6d4',flex:1},{l:'⌂ BASE DOUX',fn:()=>callBtn('button.'+p+'_revenir_a_la_base_sans_arreter_la_tache'),col:'#475569',flex:1}].map(b=>html`<button style="flex:${b.flex};min-width:55px;padding:6px 4px;border-radius:4px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;cursor:pointer;background:${b.col}12;border:1px solid ${b.col}44;color:${b.col};" @click="${(e)=>{e.stopPropagation();b.fn();}}">${b.l}</button>`)}
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

    // Si w.item_view est défini, afficher un seul item pleine page
    if (w.item_view != null) {
      const catIdx2 = parseInt(w.category_view) || 0;
      const itemIdx = parseInt(w.item_view) || 0;
      const cat2    = categories[catIdx2] || {};
      const item2   = (cat2.items || [])[itemIdx];
      if (item2) {
        return html`
          <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} background:#0d1321;border-color:#06b6d422;overflow:hidden;position:relative;font-family:'Roboto','Segoe UI',sans-serif;display:flex;flex-direction:column;padding:12px;gap:10px;">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#818cf8,#22c55e,#06b6d4);z-index:5;"></div>
            ${renderItem(item2)}
          </div>`;
      }
    }

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle} background:#0d1321;border-color:#06b6d422;overflow:hidden;position:relative;font-family:'Roboto','Segoe UI',sans-serif;display:flex;flex-direction:column;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#06b6d4,#818cf8,#22c55e);z-index:5;"></div>
        <div style="flex-shrink:0;padding:12px 14px 0;display:flex;gap:8px;flex-wrap:wrap;${w.view!=null?'display:none;':''}">
          ${categories.map((c,i) => html`
            <button style="display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:20px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:.2s;border:1px solid;background:${activeTab===i?'#06b6d4':'rgba(255,255,255,.05)'};border-color:${activeTab===i?'#06b6d4':'#1e2d3d'};color:${activeTab===i?'#0d1321':'#94a3b8'};"
              @click="${(e)=>{e.stopPropagation();setTab(i);}}">
              <ha-icon icon="${c.icon||'mdi:apps'}" style="--mdc-icon-size:15px;color:${activeTab===i?'#0d1321':'#64748b'};"></ha-icon>
              ${c.label||'Tab '+(i+1)}
            </button>`)}
        </div>
        <div style="flex:1;min-height:0;padding:12px 14px 14px;display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;overflow-y:auto;align-content:start;">
          ${items.map(item => renderItem(item))}
        </div>
      </div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const title          = this.config.title || 'UMBRELLA CORP. TERMINAL';
    const activeCategory = this.config.categories[this._activeMainMenu] || { name: '', submenus: [] };
    const activeSubMenu  = activeCategory.submenus && activeCategory.submenus[this._activeSubMenu]
                           ? activeCategory.submenus[this._activeSubMenu] : { name: '', sensors: [] };
    const subsubmenus    = activeSubMenu.subsubmenus || [];
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
      <div class="re-container">
        <div class="re-header">
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

        <div class="re-nav">
          ${(this.config.categories || []).map((cat, index) => {
            const catIcons = {
              'MÉTÉO':'🌤','ZONES DU COMPLEXE':'🏠','VIDÉO-SURVEILLANCE':'📷',
              'SERVEURS':'🖥','SPA':'♨','ÉNERGIE & SOLAR':'⚡',
              'BIOMÉTRIE & PHYTOLOGIE':'🧬','TRACKERS & MATÉRIELS':'📡',
            };
            const emoji = catIcons[cat.name] || '▸';
            return html`
              <div class="main-nav-item ${this._activeMainMenu === index ? 'active' : ''}"
                   @click="${() => { this._activeMainMenu = index; this._activeSubMenu = 0; this._activeFilter = 'all'; this.requestUpdate(); }}">
                <span style="margin-right:4px;font-size:12px;">${emoji}</span>${cat.name}
              </div>`;
          })}
        </div>

        <div class="re-body">
          <div class="re-sidebar">
            ${activeCategory.submenus ? activeCategory.submenus.map((sub, index) => html`
              <button class="submenu-btn ${this._activeSubMenu === index ? 'active' : ''}"
                      @click="${() => { this._activeSubMenu = index; this._activeFilter = 'all'; this.requestUpdate(); }}">
                <ha-icon icon="${sub.icon || 'mdi:chevron-right'}"></ha-icon>
                <span>${sub.name}</span>
              </button>
            `) : html``}
          </div>
          <div class="re-content-container">
            ${!hasIframe && !isSpaMode && sensorsRaw.length > 0 && subsubmenus.length > 0 ? html`
              <div class="re-filter-bar">
                ${subsubmenus.map(subsub => html`
                  <button class="filter-item ${this._activeFilter === subsub.id ? 'active' : ''}"
                          @click="${() => { this._activeFilter = subsub.id; this.requestUpdate(); }}">
                    ${subsub.name}
                  </button>`)}
              </div>` : html``}
            <div class="re-content-scroll" style="${hasIframe ? 'padding: 0; overflow: hidden; display: flex; flex-direction: column;' : 'overflow-y: auto; overflow-x: hidden;'}">
              ${hasIframe
                ? sensorsRaw.map(id => this.renderEntity(id))
                : isSpaMode
                  ? this._renderSpaHud(sensorsRaw)
                  : isDesignMode
                    ? html`<div class="design-grid">${(activeSubMenu.widgets || []).map(w => this._renderDesignWidget(w))}</div>`
                    : html`
                        <div class="re-sensor-grid">
                          ${(this._activeFilter === 'all' || !this._activeFilter
                            ? sensorsRaw
                            : sensorsRaw.filter(id => {
                                const s = (activeSubMenu.sensors || []).find(s => (s.entity||s) === id);
                                return s && s.type === this._activeFilter;
                              })
                          ).map(id => this.renderEntity(id))}
                        </div>`}
            </div>
          </div>
        </div>
      </div>`;
  }

  static get styles() {
    return css`
      :host { display: block; font-family: 'Courier New', Courier, monospace; background: transparent; }
      * { box-sizing: border-box; }
      .re-container { display: flex; flex-direction: column; height: 100%; min-height: 400px; background: #080d14; border: 1px solid #1a2744; border-radius: 12px; overflow: hidden; }
      .re-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: linear-gradient(135deg,#0d1b2e,#111827); border-bottom: 1px solid #1a2744; flex-shrink: 0; }
      .re-logo { display: flex; align-items: center; gap: 12px; }
      .re-umbrella { width: 44px; height: 44px; flex-shrink: 0; }
      .re-umbrella-icon { width: 100%; height: 100%; object-fit: contain; }
      .re-title-block { display: flex; flex-direction: column; }
      .re-title { font-size: 18px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; line-height: 1.2; }
      .re-subtitle { font-size: 12px; color: #475569; letter-spacing: 3px; }
      .re-status { display: flex; align-items: center; gap: 8px; }
      .re-status-text { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
      .re-ecg { width: 80px; height: 24px; flex-shrink: 0; }
      .re-nav { display: flex; gap: 0; border-bottom: 1px solid #1a2744; background: #060b12; flex-shrink: 0; overflow-x: auto; }
      .main-nav-item { padding: 10px 14px; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; letter-spacing: 1px; white-space: nowrap; border-bottom: 2px solid transparent; transition: all .2s; }
      .main-nav-item:hover { color: #94a3b8; background: rgba(255,255,255,.03); }
      .main-nav-item.active { color: #ef4444; border-bottom-color: #ef4444; background: rgba(239,68,68,.05); }
      .re-body { display: flex; flex: 1; min-height: 0; }
      .re-sidebar { width: 200px; flex-shrink: 0; background: #060b12; border-right: 1px solid #1a2744; display: flex; flex-direction: column; gap: 2px; padding: 8px 6px; overflow-y: auto; }
      .submenu-btn { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: #475569; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: .5px; text-align: left; width: 100%; transition: all .15s; }
      .submenu-btn:hover { color: #94a3b8; background: rgba(255,255,255,.04); }
      .submenu-btn.active { color: #22c55e; background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.25); }
      .submenu-btn ha-icon { --mdc-icon-size: 16px; flex-shrink: 0; }
      .re-content-container { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .re-filter-bar { display: flex; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #1a2744; flex-shrink: 0; flex-wrap: wrap; }
      .filter-item { padding: 4px 12px; border-radius: 20px; border: 1px solid #1e2d3d; background: transparent; color: #475569; font-family: inherit; font-size: 11px; font-weight: 600; cursor: pointer; letter-spacing: .5px; transition: all .15s; }
      .filter-item:hover { color: #94a3b8; }
      .filter-item.active { color: #06b6d4; border-color: rgba(6,182,212,.4); background: rgba(6,182,212,.08); }
      .re-content-scroll { flex: 1; overflow-y: auto; padding: 12px; }
      .re-sensor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
      .design-grid { display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; width: 100%; }
      .dw-card { background: #0a0a0a; cursor: pointer; position: relative; transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden; box-sizing: border-box; flex-shrink: 0; min-height: 60px; border: 1px solid #1e1e1e; }
      .dw-card.no-border { border-color: transparent !important; background: transparent; }
      .dw-card.no-border:hover { border-color: #222 !important; }
      .dw-card::before { content:''; position:absolute; top:0; left:0; width:2px; height:100%; transition: background 0.2s; }
      .dw-card.no-border::before { display: none; }
      .dw-card:hover { border-color: #333; }
    `;
  }
}



class ResidentEvilCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: {}, _activeTab: { type: Number } };
  }

  constructor() {
    super();
    this._activeTab = 0;
  }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); }

  _fire(config) {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }

  _set(path, value) {
    const cfg = JSON.parse(JSON.stringify(this._config));
    const parts = path.split('.');
    let obj = cfg;
    for (let i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] === undefined) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    this._config = cfg;
    this._fire(cfg);
    this.requestUpdate();
  }

  _getPath(path, def) {
    const parts = path.split('.');
    let v = this._config;
    for (const p of parts) {
      if (v == null) return def !== undefined ? def : '';
      v = v[p];
    }
    return v !== undefined && v !== null ? v : (def !== undefined ? def : '');
  }

  _inp(label, path, val) {
    const self = this;
    return html`
      <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;">
        <label style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:.5px;">${label}</label>
        <input style="background:#0d1117;border:1px solid #1e2d3d;color:#e2e8f0;padding:6px 8px;font-family:'Courier New',monospace;font-size:12px;border-radius:4px;width:100%;box-sizing:border-box;"
          .value="${val || ''}"
          @change="${(e) => self._set(path, e.target.value)}" />
      </div>`;
  }

  render() {
    if (!this._config) return html``;
    const self = this;
    const cats = this._config.categories || [];
    const tabs = ['GÉNÉRAL','MÉTÉO','ZONES','VIDÉO','SERVEURS','SPA','ÉNERGIE','SANTÉ','TRACKER'];

    const tabStyle = (i) => {
      const active = self._activeTab === i;
      return `padding:6px 10px;border:none;border-radius:6px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.5px;background:${active?'#ef4444':'rgba(255,255,255,.05)'};color:${active?'#fff':'#475569'};`;
    };

    const findCat = (name) => cats.find(c => c.name === name);
    const catIdx = (name) => cats.indexOf(findCat(name));

    const renderGeneral = () => html`
      <div>
        ${self._inp('Titre', 'title', self._config.title)}
        ${self._inp('Logo (URL)', 'logo', self._config.logo)}
        ${self._inp('Entité status', 'status_entity', self._config.status_entity)}
      </div>`;

    const renderMeteo = () => html`
      <div>
        <div style="font-size:11px;color:#64748b;margin-bottom:8px;">URL de la page météo iframe :</div>
        ${self._inp('URL iframe météo', 'categories.0.submenus.0.sensors.0.url',
          self._getPath('categories.0.submenus.0.sensors.0.url', '/local/meteo_ha_ws.html'))}
      </div>`;

    const renderZones = () => {
      const cat = findCat('ZONES DU COMPLEXE');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Catégorie ZONES non trouvée</div>`;
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${(cat.submenus || []).map((sub) => html`
            <div style="background:rgba(255,255,255,.03);border:1px solid #1e2d3d;border-radius:8px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#22c55e;margin-bottom:6px;">${sub.name}</div>
              <div style="font-size:11px;color:#475569;">${(sub.sensors||[]).length} capteurs</div>
              <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;max-height:60px;overflow-y:auto;">
                ${(sub.sensors||[]).map(s => html`
                  <span style="background:#0d1117;border:1px solid #1e2d3d;border-radius:3px;padding:1px 5px;font-size:9px;color:#64748b;">${((s.entity||s)+'').split('.')[1]||s}</span>
                `)}
              </div>
            </div>
          `)}
        </div>`;
    };

    const renderVideo = () => {
      const cat = findCat('VIDÉO-SURVEILLANCE');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Non trouvé</div>`;
      return html`
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${(cat.submenus||[]).map(sub => html`
            <div style="background:rgba(255,255,255,.03);border:1px solid #1e2d3d;border-radius:8px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#06b6d4;margin-bottom:6px;">${sub.name}</div>
              ${(sub.sensors||[]).map(s => html`
                <div style="font-size:11px;color:#475569;padding:1px 0;">${s.entity||s}</div>
              `)}
            </div>
          `)}
        </div>`;
    };

    const renderServeurs = () => {
      const cat = findCat('SERVEURS');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Non trouvé</div>`;
      const ci = catIdx('SERVEURS');
      const widgets = cat.submenus?.[0]?.widgets || [];
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${widgets.map((w, wi) => html`
            <div style="background:rgba(0,255,136,.03);border:1px solid #00ff8822;border-radius:8px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#00ff88;margin-bottom:8px;">${w.server_name||'Serveur '+wi}</div>
              ${self._inp('Nom', `categories.${ci}.submenus.0.widgets.${wi}.server_name`, w.server_name)}
              ${self._inp('CPU', `categories.${ci}.submenus.0.widgets.${wi}.cpu_entity`, w.cpu_entity)}
              ${self._inp('RAM', `categories.${ci}.submenus.0.widgets.${wi}.ram_entity`, w.ram_entity)}
              ${self._inp('HDD', `categories.${ci}.submenus.0.widgets.${wi}.hdd_entity`, w.hdd_entity)}
            </div>
          `)}
        </div>`;
    };

    const renderSpa = () => {
      const cat = findCat('SPA');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Non trouvé</div>`;
      const ci = catIdx('SPA');
      const w = cat.submenus?.[0]?.widgets?.[0] || {};
      return html`
        <div>
          ${self._inp('Température eau', `categories.${ci}.submenus.0.widgets.0.entity`, w.entity)}
          ${self._inp('Thermostat', `categories.${ci}.submenus.0.widgets.0.targetEntity`, w.targetEntity)}
          ${self._inp('Temp. extérieure', `categories.${ci}.submenus.0.widgets.0.extTempEntity`, w.extTempEntity)}
          ${self._inp('Temp. air spa', `categories.${ci}.submenus.0.widgets.0.airTempEntity`, w.airTempEntity)}
          ${self._inp('Puissance (W)', `categories.${ci}.submenus.0.widgets.0.powerEntity`, w.powerEntity)}
          ${self._inp('Énergie (kWh)', `categories.${ci}.submenus.0.widgets.0.energyEntity`, w.energyEntity)}
          ${self._inp('Filtre (jours)', `categories.${ci}.submenus.0.widgets.0.filterEntity`, w.filterEntity)}
          ${self._inp('Chlore (jours)', `categories.${ci}.submenus.0.widgets.0.chlorineEntity`, w.chlorineEntity)}
          ${self._inp('Fuite', `categories.${ci}.submenus.0.widgets.0.leakEntity`, w.leakEntity)}
          ${self._inp('Image fond', `categories.${ci}.submenus.0.widgets.0.bgImage`, w.bgImage)}
        </div>`;
    };

    const renderEnergie = () => {
      const cat = findCat('ÉNERGIE & SOLAR');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Non trouvé</div>`;
      const ci = catIdx('ÉNERGIE & SOLAR');
      const cfg = cat.submenus?.[0]?.widgets?.[0]?.solar_config || {};
      return html`
        <div>
          ${self._inp('Production totale (W)', `categories.${ci}.submenus.0.widgets.0.solar_config.total_now`, cfg.total_now)}
          ${self._inp('Consommation temps réel', `categories.${ci}.submenus.0.widgets.0.solar_config.main_cons`, cfg.main_cons)}
          ${self._inp('Flux réseau', `categories.${ci}.submenus.0.widgets.0.solar_config.grid_flow`, cfg.grid_flow)}
          ${self._inp('Beem Maison (W)', `categories.${ci}.submenus.0.widgets.0.solar_config.beem_m_w`, cfg.beem_m_w)}
          ${self._inp('Beem Spa (W)', `categories.${ci}.submenus.0.widgets.0.solar_config.beem_s_w`, cfg.beem_s_w)}
          ${self._inp('IBC (W)', `categories.${ci}.submenus.0.widgets.0.solar_config.beem_i_w`, cfg.beem_i_w)}
          ${self._inp('Batterie SOC', `categories.${ci}.submenus.0.widgets.0.solar_config.bat1_soc`, cfg.bat1_soc)}
          ${self._inp('Weather entity', `categories.${ci}.submenus.0.widgets.0.solar_config.weather_entity`, cfg.weather_entity)}
        </div>`;
    };

    const renderSante = () => {
      const cat = findCat('SANTE & PLANTES');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Non trouvé</div>`;
      const ci = catIdx('SANTE & PLANTES');
      const people = cat.submenus?.[0]?.widgets?.[0]?.people || [];
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${people.map((p, pi) => html`
            <div style="background:rgba(6,182,212,.03);border:1px solid #06b6d422;border-radius:8px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#06b6d4;margin-bottom:8px;">${p.name}</div>
              ${self._inp('Entité poids', `categories.${ci}.submenus.0.widgets.0.people.${pi}.weight_entity`, p.weight_entity)}
              ${self._inp('Poids départ (kg)', `categories.${ci}.submenus.0.widgets.0.people.${pi}.start`, p.start)}
              ${self._inp('Poids idéal (kg)', `categories.${ci}.submenus.0.widgets.0.people.${pi}.ideal`, p.ideal)}
              ${self._inp('Image', `categories.${ci}.submenus.0.widgets.0.people.${pi}.image`, p.image)}
            </div>
          `)}
        </div>`;
    };

    const renderTracker = () => {
      const cat = findCat('TRACKER DE PRÉSENCE');
      if (!cat) return html`<div style="color:#475569;font-size:12px;">Non trouvé</div>`;
      const ci = catIdx('TRACKER DE PRÉSENCE');
      const persons = cat.submenus?.[0]?.widgets?.[0]?.persons || [];
      return html`
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${persons.map((p, pi) => html`
            <div style="background:rgba(129,140,248,.03);border:1px solid #818cf822;border-radius:8px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#818cf8;margin-bottom:8px;">${p.name}</div>
              ${self._inp('Person entity', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.person`, p.person)}
              ${self._inp('Batterie', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.battery_entity`, p.battery_entity)}
              ${self._inp('Distance', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.distance_entity`, p.distance_entity)}
              ${self._inp('Geocodage', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.geocoded_entity`, p.geocoded_entity)}
            </div>
          `)}
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
        <div style="padding:8px 14px;border-top:1px solid #1a2744;font-size:10px;color:#1e3a5f;">
          Pour les configurations avancées, utilisez l'éditeur YAML
        </div>
      </div>`;
  }
}

// Enregistrement de la carte principale
customElements.define("resident-evil-card", ResidentEvilCard);

// Enregistrement de l'éditeur visuel pour qu'il apparaisse dans l'interface
customElements.define("resident-evil-card-editor", ResidentEvilCardEditor);

// Déclaration de la carte dans le sélecteur de cartes Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: "resident-evil-card",
  name: "Resident Evil Terminal Card",
  description: "Un terminal rétro-éclairé style Umbrella Corporation avec ECG et onglets tactiques.",
  preview: true // Permet d'afficher un aperçu visuel dans le menu
});
