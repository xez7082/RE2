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

  .spa-hud-container { display: flex; flex-direction: column; width: 100%; gap: 15px; }
  .spa-top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1c1c1c; padding-bottom: 8px; }
  .spa-badge-heater { background: rgba(255, 255, 255, 0.02); border: 1px solid #222; padding: 6px 12px; font-size: 10px; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
  .spa-badge-heater.heating { border-color: #5c1d1d; color: #ff3333; background: rgba(255, 51, 51, 0.03); text-shadow: 0 0 4px var(--re-red-glow); }
  .spa-dot { width: 6px; height: 6px; border-radius: 50%; background: #444; }
  .spa-badge-heater.heating .spa-dot { background: #ff3333; box-shadow: 0 0 6px #ff3333; animation: batt-flash 1s infinite alternate; }

  .spa-trident-layout { display: grid; grid-template-columns: 1fr 140px 1fr; align-items: center; width: 100%; margin: 5px 0; }
  .spa-side-metric { display: flex; flex-direction: column; }
  .spa-side-metric.left { align-items: flex-start; }
  .spa-side-metric.right { align-items: flex-end; }
  .spa-huge-val { font-size: 26px; font-weight: bold; color: #fff; }
  .spa-metric-lbl { font-size: 9px; color: var(--re-text-gray); font-weight: bold; margin: 2px 0; letter-spacing: 1px; }
  .spa-sub-badge { background: #0a0a0a; border: 1px solid #161616; padding: 2px 8px; border-radius: 12px; font-size: 10px; color: var(--re-green); }

  .spa-center-dial { display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
  .spa-circular-monitor { width: 110px; height: 110px; border-radius: 50%; border: 1px dashed #252525; background: radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(10,10,10,0.2) 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 0 15px rgba(0,0,0,0.8); }
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

  .sensor-card.type-camera-feed { grid-column: span 2; min-height: 180px; padding: 0px; background: #000000; border: 2px solid #222; overflow: hidden; position: relative; display: flex; flex-direction: column; }
  .sensor-card.type-camera-feed::before { display: none; }
  
  .camera-stream-container { width: 100%; flex: 1; position: relative; background: #050505; display: flex; align-items: center; justify-content: center; }
  .camera-img { width: 100%; height: 100%; object-fit: cover; filter: sepia(20%) contrast(115%) brightness(95%); opacity: 0.85; transition: all 0.3s; }
  .sensor-card.type-camera-feed:hover .camera-img { opacity: 1; filter: sepia(0%) contrast(125%) brightness(100%); }

  .camera-hud-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; box-sizing: border-box; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; z-index: 3; }
  .hud-top-row, .hud-bottom-row { display: flex; justify-content: space-between; width: 100%; font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px #000, 0 0 4px rgba(0,0,0,0.8); }
  
  .hud-rec-indicator { color: #ff0000; display: flex; align-items: center; gap: 4px; animation: batt-flash 1s infinite alternate; }
  .hud-cam-name { color: #ffffff; text-transform: uppercase; letter-spacing: 1px; }
  .hud-timestamp { color: #ff9900; }
  .hud-status-ok { color: #00ff00; background: rgba(0,255,0,0.15); padding: 1px 4px; border: 1px solid #00ff00; font-size: 8px; }
  
  .camera-corners { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; box-sizing: border-box; }
  .camera-corners::before, .camera-corners::after { content: ''; position: absolute; width: 10px; height: 10px; border-color: rgba(255,255,255,0.25); border-style: solid; }
  .camera-corners::before { top: 8px; left: 8px; border-width: 2px 0 0 2px; }
  .camera-corners::after { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; }

  .camera-scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 50%); background-size: 100% 6px; z-index: 2; pointer-events: none; }

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
  .umbrella-spin { animation: umbrella-rotate 8s linear infinite; transform-origin: center; filter: drop-shadow(0 0 6px rgba(139,0,0,0.8)); }
  .umbrella-spin:hover { animation-duration: 2s; filter: drop-shadow(0 0 12px rgba(255,0,0,0.9)); }
  @keyframes umbrella-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .umbrella-pulse { animation: umbrella-pulse-anim 3s ease-in-out infinite; }
  @keyframes umbrella-pulse-anim { 0%,100% { opacity: 0.04; transform: scale(1); } 50% { opacity: 0.08; transform: scale(1.02); } }

  /* WIDGETS DESIGN AVANCÉ */
  .design-grid { display: flex; flex-wrap: wrap; gap: 10px; width: 100%; align-items: flex-start; box-sizing: border-box; }
  .dw-shape-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-circle { border-radius: 50%; flex-shrink: 0; }
  .dw-square { border-radius: 0; flex-shrink: 0; }
  .dw-rect { border-radius: 3px; flex-shrink: 0; }
  .dw-line-h { height: 3px !important; width: 100%; border-radius: 2px; }
  .dw-line-v { width: 3px !important; height: 100%; border-radius: 2px; }
  .dw-shape-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center; }

  .dw-gauge-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 10px 8px; gap: 4px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-gauge-svg { overflow: visible; flex-shrink: 0; }
  .dw-gauge-track { fill: none; stroke: #2a2a2a; }
  .dw-gauge-fill { fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1); }
  .dw-gauge-center { font-family: 'Courier New', monospace; font-weight: bold; }
  .dw-gauge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center; }

  .dw-spark-wrap { display: flex; flex-direction: column; padding: 12px 10px 8px; gap: 6px; width: 100%; height: 100%; box-sizing: border-box; justify-content: space-between; }
  .dw-spark-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-spark-name { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-spark-val { font-size: 20px; font-weight: bold; }
  .dw-spark-unit { font-size: 11px; opacity: 0.7; }
  .dw-spark-svg { width: 100%; overflow: visible; flex: 1; }
  .dw-spark-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .dw-spark-area { opacity: 0.12; }

  .dw-badge-wrap { display: flex; align-items: center; justify-content: center; padding: 12px 10px; gap: 8px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-badge-wrap.icon-top { flex-direction: column; }
  .dw-badge-wrap.icon-bottom { flex-direction: column-reverse; }
  .dw-badge-wrap.icon-left { flex-direction: row; }
  .dw-badge-wrap.icon-right { flex-direction: row-reverse; }
  .dw-badge-icon { flex-shrink: 0; }
  .dw-badge-texts { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .dw-badge-wrap.icon-left .dw-badge-texts, .dw-badge-wrap.icon-right .dw-badge-texts { align-items: flex-start; }
  .dw-badge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-badge-value { font-size: 22px; font-weight: bold; line-height: 1; }
  .dw-badge-unit { font-size: 12px; opacity: 0.7; font-weight: normal; }

  .dw-progress-wrap { display: flex; flex-direction: column; padding: 12px 12px 10px; gap: 8px; width: 100%; height: 100%; box-sizing: border-box; justify-content: center; }
  .dw-progress-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-progress-name { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .dw-progress-valstr { font-size: 16px; font-weight: bold; }
  .dw-progress-track { width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; position: relative; overflow: hidden; flex-shrink: 0; }
  .dw-progress-fill { height: 100%; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); position: relative; }
  .dw-progress-fill::after { content: ''; position: absolute; top: 0; right: 0; width: 3px; height: 100%; background: rgba(255,255,255,0.35); }

  .dw-spa-wrap { display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 12px 14px; width: 100%; height: 100%; box-sizing: border-box; position: relative; }
  .dw-spa-adj-btn { background: none; border: 1px solid #333; color: #888; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; width: 36px; height: 36px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dw-spa-adj-btn:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.05); }
  .dw-spa-center { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; justify-content: center; }
  .dw-spa-label { font-size: 11px; font-weight: bold; letter-spacing: 2px; }
  .dw-spa-temp { font-size: 52px; font-weight: bold; line-height: 1; font-family: 'Courier New', monospace; }
  .dw-spa-unit { font-size: 14px; opacity: 0.6; }
  .dw-spa-target { font-size: 13px; font-weight: bold; letter-spacing: 1px; margin-top: 2px; }
  .dw-spa-row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
  .dw-spa-heating { font-size: 10px; font-weight: bold; letter-spacing: 2px; padding: 3px 10px; border: 1px solid; }

  .dw-card { background: #0a0a0a; cursor: pointer; position: relative; transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden; box-sizing: border-box; flex-shrink: 0; min-height: 60px; border: 1px solid #1e1e1e; }
  .dw-card.no-border { border-color: transparent !important; background: transparent; }
  .dw-card.no-border:hover { border-color: #222 !important; }
  .dw-card::before { content:''; position:absolute; top:0; left:0; width:2px; height:100%; transition: background 0.2s; }
  .dw-card.no-border::before { display: none; }
  .dw-card:hover { border-color: #333; }
`;

class ResidentEvilCard extends LitElement {
  static get styles() {
    return cardStyles;
  }

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

  _umbrellaLogoSvg(size = 28, cssClass = 'umbrella-spin') {
    return html`
      <svg class="${cssClass}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
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
      </svg>
    `;
  }

  _umbrellaWatermark() {
    return html`
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%); pointer-events:none;z-index:0;">
        <svg class="umbrella-pulse" width="280" height="280" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
          <line x1="50" y1="4" x2="50" y2="96" stroke="#050505" stroke-width="2.5"/> <line x1="4" y1="50" x2="96" y2="50" stroke="#050505" stroke-width="2.5"/>
          <line x1="18" y1="18" x2="82" y2="82" stroke="#050505" stroke-width="2.5"/> <line x1="82" y1="18" x2="18" y2="82" stroke="#050505" stroke-width="2.5"/>
        </svg>
      </div>
    `;
  }

  setConfig(config) {
    this.config = config;
  }

  static async getConfigElement() {
    return document.createElement("resident-evil-card-editor");
  }

  static getStubConfig() {
    return {
      title: "UMBRELLA CORP MAIN TERMINAL",
      categories: [
        { name: "GÉNÉRAL", icon: "mdi:security", submenus: [{ name: "Système", icon: "mdi:dns", widgets: [] }] }
      ]
    };
  }

  _handleAction(entityId) {
    const domain = entityId.split('.')[0];
    if (domain === 'switch' || domain === 'light' || domain === 'input_boolean' || domain === 'automation') {
      this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
    } else {
      const event = new CustomEvent("hass-more-info", {
        detail: { entityId: entityId },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  render() {
    if (!this.config || !this.hass) return html``;
    
    const title = this.config.title || "UMBRELLA CORP MAIN TERMINAL";
    const categories = this.config.categories || [];
    const currentCat = categories[this._activeMainMenu];
    const submenus = currentCat ? (currentCat.submenus || []) : [];
    const currentSub = submenus[this._activeSubMenu];
    const widgets = currentSub ? (currentSub.widgets || []) : [];

    return html`
      <ha-card>
        <div class="crt-overlay"></div>
        
        <div class="re-header">
          <div style="display:flex;align-items:center;gap:12px;">
            ${this._umbrellaLogoSvg(26)}
            <div class="re-title">${title}</div>
          </div>
          <div class="ecg-container">
            <span class="status-text">${this._timeString} | SYSTEM OK</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,12 L48,17 L52,15 L100,15"/>
            </svg>
          </div>
        </div>

        <div class="re-main-menu">
          ${categories.map((cat, idx) => html`
            <div class="main-nav-item ${this._activeMainMenu === idx ? 'active' : ''}"
                 @click="${() => { this._activeMainMenu = idx; this._activeSubMenu = 0; }}">
              ${cat.name}
            </div>
          `)}
        </div>

        <div class="re-body">
          ${this._umbrellaWatermark()}
          
          ${submenus.length > 0 ? html`
            <div class="re-sidebar">
              ${submenus.map((sub, idx) => html`
                <button class="submenu-btn ${this._activeSubMenu === idx ? 'active' : ''}"
                        @click="${() => { this._activeSubMenu = idx; }}">
                  <ha-icon icon="${sub.icon || 'mdi:cube-outline'}"></ha-icon>
                  <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${sub.name}</span>
                </button>
              `)}
            </div>
          ` : html``}

          <div class="re-content-container">
            <div class="re-content-scroll">
              <div class="sensors-grid">
                ${widgets.length === 0 ? html`<div class="empty-tab">AUCUN COMPOSANT CONFIGURÉ</div>` : ''}
                ${widgets.map(w => this._renderWidget(w))}
              </div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  _renderWidget(w) {
    // Rendu dynamique de vos différents widgets (Jauges, Sparklines, Badges, Caméras, etc.)
    // Selon la structure définie dans votre configuration principale.
    return html`
      <div class="sensor-card" @click="${() => this._handleAction(w.entity_id)}">
        <div class="sensor-card-header">
          <div class="sensor-name">${w.name || 'Inconnu'}</div>
          <ha-icon class="sensor-icon" icon="${w.icon || 'mdi:eye'}"></ha-icon>
        </div>
        <div class="sensor-value">
          ${this.hass.states[w.entity_id] ? this.hass.states[w.entity_id].state : '---'}
        </div>
      </div>
    `;
  }
}

// ==========================================
// 2. ÉDITEUR VISUEL DE LA CARTE (ONGLETS TACTIQUES)
// ==========================================
class ResidentEvilCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _activeTab: { type: Number }
    };
  }

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
        <input style="width:100%;background:#030712;border:1px solid #1e293b;color:#fff;padding:8px;font-family:inherit;box-sizing:border-box;"
               .value="${value || ''}" @change="${(e) => this._updatePath(path, e.target.value)}"/>
      </div>
    `;
  }

  _updatePath(path, val) {
    if (!this._config) return;
    const newConfig = JSON.parse(JSON.stringify(this._config));
    const parts = path.split('.');
    let current = newConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = val;
    
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this._config || !this.hass) return html``;

    const self = this;
    const tabs = ["Général", "Météo", "Zones", "Vidéo", "Serveurs", "Spa", "Énergie", "Santé", "Tracker"];
    
    const tabStyle = (idx) => `
      flex:1; padding:8px 4px; font-size:10px; font-weight:bold; font-family:inherit; border:1px solid #1a2744;
      background:${self._activeTab === idx ? '#ef4444' : '#09111e'};
      color:${self._activeTab === idx ? '#fff' : '#94a3b8'}; cursor:pointer; text-transform:uppercase; transition:all 0.15s;
    `;

    // Panel de rendu d'onglets de configuration
    const renderGeneral = () => html`
      <div>
        ${self._inp('Titre Terminal Principal', 'title', self._config.title)}
      </div>
    `;
    const renderMeteo = () => html`<div>${self._inp('Entité Météo Principale', 'weather_entity', self._config.weather_entity)}</div>`;
    const renderZones = () => html`<div style="color:#8a8a8a;font-size:11px;">Configuration des périmètres de sécurité domestiques.</div>`;
    const renderVideo = () => html`<div>${self._inp('Flux Caméra Alerte', 'camera_entity', self._config.camera_entity)}</div>`;
    const renderServeurs = () => html`<div style="color:#8a8a8a;font-size:11px;">Surveillance des nœuds Proxmox, TrueNAS et serveurs locaux.</div>`;
    const renderSpa = () => html`
      <div>
        ${self._inp('Température Actuelle Spa', 'spa_temp_entity', self._config.spa_temp_entity)}
        ${self._inp('Consigne Cible Spa', 'spa_target_entity', self._config.spa_target_entity)}
        ${self._inp('Entité Chauffage (Heater)', 'spa_heater_entity', self._config.spa_heater_entity)}
      </div>
    `;
    const renderEnergie = () => html`<div style="color:#8a8a8a;font-size:11px;">Suivi de la production des panneaux Beem/IBC et batteries Marstek/Storcube.</div>`;
    const renderSante = () => html`<div style="color:#8a8a8a;font-size:11px;">Données biométriques et suivi des membres de la cellule.</div>`;
    const renderTracker = () => html`<div style="color:#8a8a8a;font-size:11px;">Géolocalisation d'équipe Umbrella Corp (Sandra, Franck, Frédérick).</div>`;

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
        <div style="padding:8px 14px;background:#050910;font-size:10px;color:#475569;text-align:right;border-top:1px solid #111c30;">
          UMBRELLA CORP UI CUSTOM EDITOR
        </div>
      </div>
    `;
  }
}

import { LitElement, html, css } from 'https://unpkg.com/lit@3/index.js?module';

// ==========================================
// DESIGN RETRO-TERMINAL AMÉLIORÉ / SPA INTEGRATION
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
  
  .re-body { display: flex; flex: 1; height: calc(100% - 50px); overflow: hidden; background: var(--re-bg); }
  .re-sidebar { width: 180px; background: #090909; border-right: 1px dashed var(--re-border-color); display: flex; flex-direction: column; gap: 8px; padding: 15px 0px 15px 10px; overflow: hidden; }
  
  .submenu-btn { background: #121212; border: 1px solid #222; border-right: none; color: var(--re-text-gray); padding: 12px 10px; text-align: left; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s ease; transform: translateX(0px); }
  .submenu-btn:hover { color: var(--re-green); background: #151515; transform: translateX(5px); }
  .submenu-btn.active { background: #1a1a1a; color: var(--re-green); font-weight: bold; border: 1px solid var(--re-green); border-right: 3px solid var(--re-bg); transform: translateX(8px); box-shadow: -4px 4px 10px rgba(0, 0, 0, 0.5); z-index: 2; }
  .submenu-btn ha-icon { --mdc-icon-size: 18px; min-width: 18px; }
  
  .re-content-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
  .re-content-scroll { flex: 1; padding: 20px; overflow-y: auto; background: #030303; border-left: 1px solid #1c1c1c; display: flex; flex-direction: column; box-sizing: border-box; z-index: 1; }
  .re-content-scroll::-webkit-scrollbar { width: 6px; }
  .re-content-scroll::-webkit-scrollbar-thumb { background: var(--re-red); }

  .umbrella-pulse { animation: umbrella-pulse-anim 3s ease-in-out infinite; }
  @keyframes umbrella-pulse-anim {
    0%,100% { opacity: 0.02; transform: scale(1); }
    50%      { opacity: 0.05; transform: scale(1.02); }
  }

  /* SPA GRID & HUD DESIGN */
  .spa-hud-container { display: flex; flex-direction: column; width: 100%; gap: 15px; }
  .spa-top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1c1c1c; padding-bottom: 8px; }
  .spa-badge-heater { background: rgba(255, 255, 255, 0.02); border: 1px solid #222; padding: 6px 12px; font-size: 10px; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
  .spa-badge-heater.heating { border-color: #5c1d1d; color: #ff3333; background: rgba(255, 51, 51, 0.03); text-shadow: 0 0 4px var(--re-red-glow); }
  .spa-dot { width: 6px; height: 6px; border-radius: 50%; background: #444; }
  .spa-badge-heater.heating .spa-dot { background: #ff3333; box-shadow: 0 0 6px #ff3333; animation: alert-flash 1s infinite alternate; }

  .spa-trident-layout { display: grid; grid-template-columns: 1fr 140px 1fr; align-items: center; width: 100%; margin: 5px 0; }
  .spa-side-metric { display: flex; flex-direction: column; }
  .spa-side-metric.left { align-items: flex-start; }
  .spa-side-metric.right { align-items: flex-end; }
  .spa-huge-val { font-size: 26px; font-weight: bold; color: #fff; }
  .spa-metric-lbl { font-size: 9px; color: var(--re-text-gray); font-weight: bold; margin: 2px 0; letter-spacing: 1px; }
  .spa-sub-badge { background: #0a0a0a; border: 1px solid #161616; padding: 2px 8px; border-radius: 12px; font-size: 10px; color: var(--re-green); }

  .spa-center-dial { display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
  .spa-circular-monitor { width: 110px; height: 110px; border-radius: 50%; border: 1px dashed #252525; background: radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(10,10,10,0.2) 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 0 15px rgba(0,0,0,0.8); }
  .spa-dial-lbl { font-size: 8px; color: #444; letter-spacing: 2px; }
  .spa-dial-temp { font-size: 30px; font-weight: bold; color: var(--re-green-bright); text-shadow: 0 0 8px var(--re-green-glow); }
  .spa-dial-target { font-size: 9px; color: #ffaa00; background: rgba(255,170,0,0.05); border: 1px solid rgba(255,170,0,0.1); padding: 1px 5px; margin-top: 2px; }
  .spa-dial-arrow { background: none; border: none; color: #555; cursor: pointer; font-size: 14px; padding: 2px; font-family: inherit; transition: color 0.2s; }
  .spa-dial-arrow:hover { color: var(--re-green); }

  .spa-energy-row { display: flex; justify-content: center; gap: 10px; margin: 5px 0; }
  .spa-chip { background: #080808; border: 1px solid #161616; padding: 4px 10px; font-size: 10px; color: #bcbcbc; font-family: monospace; }

  .spa-maintenance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; margin-top: 5px; }
  .spa-maint-strip { background: rgba(255,255,255,0.01); border: 1px solid #121212; padding: 8px 12px; position: relative; }
  .spa-strip-header { display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; color: #666; }
  .spa-strip-track { width: 100%; height: 4px; background: #111; margin: 6px 0; overflow: hidden; border: 1px solid #222; }
  .spa-strip-fill { height: 100%; background: var(--re-green); box-shadow: 0 0 4px var(--re-green-glow); transition: width 0.5s ease; }
  .spa-strip-fill.warning { background: var(--re-red-bright); box-shadow: 0 0 4px var(--re-red-glow); }
  .spa-strip-footer { font-size: 9px; color: #444; display: flex; justify-content: space-between; align-items: center; }
  .re-reset-btn { background: #1a1a1a; border: 1px solid #333; color: var(--re-text-gray); font-size: 8px; padding: 1px 4px; cursor: pointer; font-family: inherit; }
  .re-reset-btn:hover { color: #fff; border-color: #555; }

  .chem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
  .chem-card { background: #0d0d0d; border: 1px solid #222; padding: 12px; position: relative; display: flex; flex-direction: column; gap: 4px; }
  .chem-card.alert { border-color: var(--re-red); background: #140505; }
  .chem-header { display: flex; justify-content: space-between; font-size: 10px; color: var(--re-text-gray); }
  .chem-value { font-size: 20px; font-weight: bold; color: #fff; }
  .chem-card.alert .chem-value { color: var(--re-red-bright); text-shadow: 0 0 4px var(--re-red-glow); }
  .chem-limits { font-size: 8px; color: #444; text-align: right; }

  .switches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; width: 100%; }
  .sw-card { background: #0d0d0d; border: 1px solid #222; padding: 10px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease; }
  .sw-card:hover { border-color: #444; background: #111; }
  .sw-card.active { border-color: var(--re-green); background: #041404; }
  .sw-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .sw-name { font-size: 11px; font-weight: bold; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sw-card.active .sw-name { color: #fff; }
  .sw-entity { font-size: 8px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sw-icon { --mdc-icon-size: 18px; color: #444; }
  .sw-card.active .sw-icon { color: var(--re-green-bright); filter: drop-shadow(0 0 3px var(--re-green-glow)); }

  /* CAMERA HUD VISUALS */
  .camera-container { width: 100%; border: 1px solid #222; background: #000; position: relative; overflow: hidden; display: flex; aspect-ratio: 16/9; }
  .camera-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; filter: sepia(15%) contrast(110%); }
  .camera-scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%); background-size: 100% 4px; pointer-events: none; }
  .camera-hud { position: absolute; top: 0; left: 0; width: 100%; height: 100%; box-sizing: border-box; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px #000; }
  .hud-rec { color: #ff0000; display: flex; align-items: center; gap: 4px; animation: alert-flash 1s infinite alternate; }
  .hud-timestamp { color: #ff9900; }
  
  .leak-banner { background: #210505; border: 1px solid var(--re-red-bright); padding: 8px; font-size: 11px; font-weight: bold; color: var(--re-red-bright); text-shadow: 0 0 4px var(--re-red-glow); display: flex; align-items: center; gap: 8px; animation: alert-pulse 1.5s infinite alternate; }
  
  @keyframes alert-flash { 0% { opacity: 0.2; } 100% { opacity: 1; } }
  @keyframes alert-pulse { 0% { box-shadow: none; } 100% { box-shadow: inset 0 0 10px var(--re-red-glow); } }
`;

class ResidentEvilSpaCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _activeSubMenu: { type: Number },
      _timeString: { type: String }
    };
  }

  constructor() {
    super();
    this._activeSubMenu = 0;
    this._timeString = "";
    this._timeUpdater = null;
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

  setConfig(config) {
    this.config = config;
  }

  _handleAction(entityId) {
    if (!entityId || !this.hass.states[entityId]) return;
    const domain = entityId.split('.')[0];
    if (['switch', 'light', 'button'].includes(domain)) {
      this.hass.callService(domain, domain === 'button' ? 'press' : 'toggle', { entity_id: entityId });
    } else {
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
    }
  }

  _adjustTemperature(entityId, amount) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return;
    if (entityId.startsWith('climate.')) {
      const currentTemp = stateObj.attributes.temperature || 35;
      this.hass.callService('climate', 'set_temperature', { entity_id: entityId, temperature: currentTemp + amount });
    }
  }

  _umbrellaWatermark() {
    return html`
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%); pointer-events:none;z-index:0;">
        <svg class="umbrella-pulse" width="250" height="250" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
        </svg>
      </div>`;
  }

  render() {
    if (!this.config || !this.hass) return html``;
    const submenus = this.config.submenus || [];
    const currentSubmenu = submenus[this._activeSubMenu];
    const w = currentSubmenu && currentSubmenu.widgets ? currentSubmenu.widgets[0] : {};

    return html`
      <ha-card>
        <div class="crt-overlay"></div>
        
        <!-- HEADER -->
        <div class="re-header">
          <div class="re-title">UMBRELLA CORP // SPA MONITOR</div>
          <div class="ecg-container">
            <span class="status-text">SYSTEM ONLINE</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L53,10 L56,20 L60,15 L100,15" />
            </svg>
          </div>
        </div>

        <!-- MAIN INTERFACE -->
        <div class="re-body">
          
          <!-- SIDEBAR SUBMENUS -->
          <div class="re-sidebar">
            ${submenus.map((sub, idx) => html`
              <button class="submenu-btn ${this._activeSubMenu === idx ? 'active' : ''}" @click="${() => this._activeSubMenu = idx}">
                <ha-icon icon="${sub.icon || 'mdi:adjust'}"></ha-icon>
                <span>${sub.name}</span>
              </button>
            `)}
          </div>

          <!-- CONTENT WINDOW -->
          <div class="re-content-container">
            ${this._umbrellaWatermark()}
            <div class="re-content-scroll">
              ${this._renderContent(w)}
            </div>
          </div>

        </div>
      </ha-card>
    `;
  }

  _renderContent(w) {
    if (!w || !w.view) return html`<div>Aucun widget configuré.</div>`;

    // Bannière d'alerte fuite d'eau globale si applicable
    const isLeak = w.leakEntity && this.hass.states[w.leakEntity]?.state === 'on';
    const isTamper = w.tamperEntity && this.hass.states[w.tamperEntity]?.state === 'on';

    return html`
      ${isLeak ? html`<div class="leak-banner"><ha-icon icon="mdi:water-alert"></ha-icon> CRITICAL ERROR: SPA WATER LEAK DETECTED !</div>` : html``}
      ${isTamper ? html`<div class="leak-banner" style="background:#2b1605; border-color:#ff9900; color:#ff9900;"><ha-icon icon="mdi:shield-alert"></ha-icon> SECURITY: SENSOR TAMPER DETECTED</div>` : html``}
      <div style="margin-top: ${isLeak || isTamper ? '10px' : '0px'};"></div>
      
      ${w.view === 'home' ? this._renderHomeView(w) : html``}
      ${w.view === 'chem' ? this._renderChemView(w) : html``}
      ${w.view === 'sw' ? this._renderSwitchesView(w) : html``}
      ${w.view === 'cam' ? this._renderCameraView(w) : html``}
    `;
  }

  // 1. VUE GÉNÉRALE (HOME)
  _renderHomeView(w) {
    const waterTemp = this.hass.states[w.entity]?.state || '--';
    const targetState = this.hass.states[w.targetEntity];
    const targetTemp = targetState?.attributes?.temperature || '--';
    const isHeating = targetState?.attributes?.hvac_action === 'heating' || targetState?.state === 'heat';

    const extTemp = w.extTempEntity ? this.hass.states[w.extTempEntity]?.state : null;
    const extHum = w.extHumEntity ? this.hass.states[w.extHumEntity]?.state : null;
    const airTemp = w.airTempEntity ? this.hass.states[w.airTempEntity]?.state : null;
    const airHum = w.airHumEntity ? this.hass.states[w.airHumEntity]?.state : null;

    const power = w.powerEntity ? this.hass.states[w.powerEntity]?.state : null;
    const energy = w.energyEntity ? this.hass.states[w.energyEntity]?.state : null;

    const filterAge = w.filterEntity ? parseFloat(this.hass.states[w.filterEntity]?.state || 0) : null;
    const chlorineAge = w.chlorineEntity ? parseFloat(this.hass.states[w.chlorineEntity]?.state || 0) : null;

    return html`
      <div class="spa-hud-container">
        <div class="spa-top-bar">
          <div class="spa-badge-heater ${isHeating ? 'heating' : ''}">
            <span class="spa-dot"></span>
            <span>DIAGNOSTIQUE CHAUFFE: ${isHeating ? 'ACTIVE / HEATING' : 'STANDBY'}</span>
          </div>
        </div>

        <div class="spa-trident-layout">
          <!-- GAUCHE: EXTÉRIEUR -->
          <div class="spa-side-metric left">
            <div class="spa-huge-val">${extTemp || '--'}°C</div>
            <div class="spa-metric-lbl">EXTÉRIEUR</div>
            <div class="spa-sub-badge">${extHum || '--'}% HR</div>
          </div>

          <!-- CENTRE: MONITOR CIBLE -->
          <div class="spa-center-dial">
            <button class="spa-dial-arrow" @click="${() => this._adjustTemperature(w.targetEntity, 0.5)}">▲</button>
            <div class="spa-circular-monitor">
              <div class="spa-dial-lbl">WATER TEMP</div>
              <div class="spa-dial-temp">${waterTemp}°</div>
              <div class="spa-dial-target">CIBLE ${targetTemp}°C</div>
            </div>
            <button class="spa-dial-arrow" @click="${() => this._adjustTemperature(w.targetEntity, -0.5)}">▼</button>
          </div>

          <!-- DROITE: AIR INTERNE -->
          <div class="spa-side-metric right">
            <div class="spa-huge-val">${airTemp || '--'}°C</div>
            <div class="spa-metric-lbl">AIR ABRI SPA</div>
            <div class="spa-sub-badge">${airHum || '--'}% HR</div>
          </div>
        </div>

        <!-- ENERGY CHIPS -->
        <div class="spa-energy-row">
          ${power ? html`<div class="spa-chip">⚡ CHARGE: ${power} W</div>` : html``}
          ${energy ? html`<div class="spa-chip">📊 INDEX: ${energy} kWh</div>` : html``}
          ${w.floodBatEntity ? html`<div class="spa-chip">🔋 SENSORS BATTERY: ${this.hass.states[w.floodBatEntity]?.state}%</div>` : html``}
        </div>

        <!-- MAINTENANCE FILTRES / CHLORE -->
        <div class="spa-maintenance-grid">
          ${filterAge !== null ? html`
            <div class="spa-maint-strip">
              <div class="spa-strip-header"><span>🗘 USAGE FILTRE</span><span>${filterAge >= (w.filterMax || 3) ? 'REPLACE' : 'OK'}</span></div>
              <div class="spa-strip-track">
                <div class="spa-strip-fill ${filterAge >= (w.filterMax || 3) ? 'warning' : ''}" style="width: ${Math.min(100, (filterAge / (w.filterMax || 3)) * 100)}%;"></div>
              </div>
              <div class="spa-strip-footer">
                <span>${filterAge} / ${w.filterMax || 3} Jours</span>
                ${w.resetFilterEntity ? html`<button class="re-reset-btn" @click="${() => this._handleAction(w.resetFilterEntity)}">RESET</button>` : html``}
              </div>
            </div>
          ` : html``}

          ${chlorineAge !== null ? html`
            <div class="spa-maint-strip">
              <div class="spa-strip-header"><span>🧪 CYSTAL CHLORE</span><span>${chlorineAge >= (w.chlorineMax || 13) ? 'RELOAD' : 'OK'}</span></div>
              <div class="spa-strip-track">
                <div class="spa-strip-fill ${chlorineAge >= (w.chlorineMax || 13) ? 'warning' : ''}" style="width: ${Math.min(100, (chlorineAge / (w.chlorineMax || 13)) * 100)}%;"></div>
              </div>
              <div class="spa-strip-footer">
                <span>${chlorineAge} / ${w.chlorineMax || 13} Jours</span>
                ${w.resetChlorineEntity ? html`<button class="re-reset-btn" @click="${() => this._handleAction(w.resetChlorineEntity)}">RESET</button>` : html``}
              </div>
            </div>
          ` : html``}
        </div>
      </div>
    `;
  }

  // 2. VUE CHIMIE
  _renderChemView(w) {
    const renderChemCard = (entity, min, max, name) => {
      if (!entity || !this.hass.states[entity]) return html``;
      const state = parseFloat(this.hass.states[entity].state || 0);
      const isAlert = state < min || state > max;
      const unit = this.hass.states[entity].attributes.unit_of_measurement || '';
      return html`
        <div class="chem-card ${isAlert ? 'alert' : ''}" @click="${() => this._handleAction(entity)}">
          <div class="chem-header">
            <span>${name}</span>
            <span>${isAlert ? '▲ ABNORMAL' : '✓ STABLE'}</span>
          </div>
          <div class="chem-value">${state} ${unit}</div>
          <div class="chem-limits">LIMITES IDÉALES: ${min} - ${max}</div>
        </div>
      `;
    };

    return html`
      <div class="chem-grid">
        ${renderChemCard(w.phEntity, w.ph_min || 7, w.ph_max || 7.6, "POTENTIEL HYDROGÈNE (pH)")}
        ${renderChemCard(w.orpEntity, w.orp_min || 650, w.orp_max || 800, "REDOX / ORP")}
        ${renderChemCard(w.tdsEntity, w.tds_min || 500, w.tds_max || 2000, "SOLID DISSOLVED (TDS)")}
        ${renderChemCard(w.saltEntity, w.salt_min || 300, w.salt_max || 500, "SALINITÉ DE L'EAU")}
      </div>
    `;
  }

  // 3. VUE INTERRUPTEURS
  _renderSwitchesView(w) {
    const switches = [];
    for (let i = 1; i <= 10; i++) {
      if (w[`switch_${i}`]) {
        switches.push({
          entity: w[`switch_${i}`],
          name: w[`name_switch_${i}`] || `Interrupteur ${i}`
        });
      }
    }

    return html`
      <div class="switches-grid">
        ${switches.map(sw => {
          const stateObj = this.hass.states[sw.entity];
          const isActive = stateObj && (stateObj.state === 'on' || stateObj.state === 'open');
          let icon = sw.entity.startsWith('light.') ? 'mdi:lightbulb' : 'mdi:power';
          if (stateObj?.attributes?.icon) icon = stateObj.attributes.icon;

          return html`
            <div class="sw-card ${isActive ? 'active' : ''}" @click="${() => this._handleAction(sw.entity)}">
              <div class="sw-info">
                <span class="sw-name">${sw.name}</span>
                <span class="sw-entity">${sw.entity.split('.')[1]}</span>
              </div>
              <ha-icon class="sw-icon" icon="${icon}"></ha-icon>
            </div>
          `;
        })}
      </div>
    `;
  }

  // 4. VUE CAMÉRA
  _renderCameraView(w) {
    const camId = w.cameraEntity;
    const camState = camId ? this.hass.states[camId] : null;
    const cameraUrl = camState ? `/api/camera_proxy/${camId}?token=${camState.attributes.access_token}` : null;
    const targetState = w.scheduleEntity ? this.hass.states[w.scheduleEntity] : null;

    return html`
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${cameraUrl ? html`
          <div class="camera-container" @click="${() => this._handleAction(camId)}">
            <img class="camera-img" src="${cameraUrl}" alt="Spa Feed" />
            <div class="camera-scanlines"></div>
            <div class="camera-hud">
              <div class="hud-rec">● LIVE STREAMING</div>
              <div class="hud-timestamp">${this._timeString}</div>
            </div>
          </div>
        ` : html`<div style="color:var(--re-text-gray); font-size:11px;">AUCUN FLUX CAMÉRA DÉTECTÉ</div>`}

        <!-- SÉCURITÉ DE PLANIFICATION / ÉTAT PRÊT -->
        ${targetState ? html`
          <div style="background: rgba(255,255,255,0.02); border: 1px solid #222; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 10px; color: var(--re-text-gray);">PROGRAMMATION DE CHAUFFE CYBERNETIQUE</div>
              <div style="font-size: 16px; font-weight: bold; color: #fff; font-family: monospace; margin-top: 2px;">PRÊT À : ${targetState.state}</div>
            </div>
            <ha-icon icon="mdi:clock-check" style="color: var(--re-green); --mdc-icon-size: 24px; filter: drop-shadow(0 0 4px var(--re-green-glow));" @click="${() => this._handleAction(w.scheduleEntity)}"></ha-icon>
          </div>
        ` : html``}
      </div>
    `;
  }

  static get styles() {
    return cardStyles;
  }
}

customElements.define('resident-evil-card', ResidentEvilSpaCard);
