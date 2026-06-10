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

  /* DESIGN WIDGETS */
  .design-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
    align-items: flex-start;
    box-sizing: border-box;
  }
  .dw-shape-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-circle  { border-radius: 50%; flex-shrink: 0; }
  .dw-square  { border-radius: 0; flex-shrink: 0; }
  .dw-rect    { border-radius: 3px; flex-shrink: 0; }
  .dw-line-h  { height: 3px !important; width: 100%; border-radius: 2px; }
  .dw-line-v  { width: 3px !important; height: 100%; border-radius: 2px; }
  .dw-shape-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center; }
  .dw-gauge-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 10px 8px; gap: 4px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-gauge-svg { overflow: visible; flex-shrink: 0; }
  .dw-gauge-track { fill: none; stroke: #2a2a2a; }
  .dw-gauge-fill  { fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1); }
  .dw-gauge-center { font-family: 'Courier New', monospace; font-weight: bold; }
  .dw-gauge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-align: center; }
  .dw-spark-wrap { display: flex; flex-direction: column; padding: 12px 10px 8px; gap: 6px; width: 100%; height: 100%; box-sizing: border-box; justify-content: space-between; }
  .dw-spark-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-spark-name { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-spark-val  { font-size: 20px; font-weight: bold; }
  .dw-spark-unit { font-size: 11px; opacity: 0.7; }
  .dw-spark-svg  { width: 100%; overflow: visible; flex: 1; }
  .dw-spark-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .dw-spark-area { opacity: 0.12; }
  .dw-badge-wrap { display: flex; align-items: center; justify-content: center; padding: 12px 10px; gap: 8px; width: 100%; height: 100%; box-sizing: border-box; }
  .dw-badge-wrap.icon-top    { flex-direction: column; }
  .dw-badge-wrap.icon-bottom { flex-direction: column-reverse; }
  .dw-badge-wrap.icon-left   { flex-direction: row; }
  .dw-badge-wrap.icon-right  { flex-direction: row-reverse; }
  .dw-badge-icon  { flex-shrink: 0; }
  .dw-badge-texts { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .dw-badge-wrap.icon-left  .dw-badge-texts, .dw-badge-wrap.icon-right .dw-badge-texts { align-items: flex-start; }
  .dw-badge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-badge-value { font-size: 22px; font-weight: bold; line-height: 1; }
  .dw-badge-unit  { font-size: 12px; opacity: 0.7; font-weight: normal; }
  .dw-progress-wrap { display: flex; flex-direction: column; padding: 12px 12px 10px; gap: 8px; width: 100%; height: 100%; box-sizing: border-box; justify-content: center; }
  .dw-progress-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-progress-name  { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .dw-progress-valstr { font-size: 16px; font-weight: bold; }
  .dw-progress-track { width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; position: relative; overflow: hidden; flex-shrink: 0; }
  .dw-progress-fill  { height: 100%; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); position: relative; }
  .dw-progress-fill::after { content: ''; position: absolute; top: 0; right: 0; width: 3px; height: 100%; background: rgba(255,255,255,0.35); }
  .dw-spa-wrap { display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 12px 14px; width: 100%; height: 100%; box-sizing: border-box; position: relative; }
  .dw-spa-adj-btn { background: none; border: 1px solid #333; color: #888; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; width: 36px; height: 36px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dw-spa-adj-btn:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.05); }
  .dw-spa-center { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; justify-content: center; }
  .dw-spa-label  { font-size: 11px; font-weight: bold; letter-spacing: 2px; }
  .dw-spa-temp   { font-size: 52px; font-weight: bold; line-height: 1; font-family: 'Courier New', monospace; }
  .dw-spa-unit   { font-size: 14px; opacity: 0.6; }
  .dw-spa-target { font-size: 13px; font-weight: bold; letter-spacing: 1px; margin-top: 2px; }
  .dw-spa-row    { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
  .dw-spa-heating { font-size: 10px; font-weight: bold; letter-spacing: 2px; padding: 3px 10px; border: 1px solid; }
  .dw-card { background: #0a0a0a; cursor: pointer; position: relative; transition: border-color 0.2s, box-shadow 0.2s; overflow: hidden; box-sizing: border-box; flex-shrink: 0; min-height: 60px; border: 1px solid #1e1e1e; }
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
        <circle cx="50" cy="50" r="8" fill="#050505"/>
      </svg>
    `;
  }

  static get styles() {
    return cardStyles;
  }

  setConfig(config) {
    if (!config.categories) {
      throw new Error("Veuillez configurer au moins une catégorie.");
    }
    this.config = config;
  }

  getCardSize() {
    return 6;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const categories = this.config.categories || [];
    const activeCat = categories[this._activeMainMenu];
    const submenus = activeCat ? (activeCat.submenus || []) : [];
    const activeSub = submenus[this._activeSubMenu];

    return html`
      <ha-card>
        <div class="crt-overlay"></div>
        
        <div class="re-header">
          <div style="display:flex; align-items:center; gap:10px;">
            ${this._umbrellaLogoSvg(26, 'umbrella-spin')}
            <span class="re-title">UMBRELLA CORP.</span>
          </div>
          <div class="ecg-container">
            <span class="status-text">${this._timeString}</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L53,10 L56,20 L59,15 L100,15"/>
            </svg>
          </div>
        </div>

        <div class="re-main-menu">
          ${categories.map((cat, idx) => html`
            <div class="main-nav-item ${this._activeMainMenu === idx ? 'active' : ''}"
                 @click="${() => { this._activeMainMenu = idx; this._activeSubMenu = 0; this._activeFilter = "all"; }}">
              ${cat.name}
            </div>
          `)}
        </div>

        <div class="re-body">
          ${submenus.length > 0 ? html`
            <div class="re-sidebar">
              ${submenus.map((sub, idx) => html`
                <button class="submenu-btn ${this._activeSubMenu === idx ? 'active' : ''}"
                        @click="${() => { this._activeSubMenu = idx; this._activeFilter = "all"; }}">
                  <ha-icon icon="${sub.icon || 'mdi:view-dashboard'}"></ha-icon>
                  <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${sub.name}</span>
                </button>
              `)}
            </div>
          ` : html``}

          <div class="re-content-container">
            ${activeSub && activeSub.mode === "design" ? html`
              <div class="re-content-scroll">
                <div class="design-grid">
                  ${(activeSub.widgets || []).map(w => this._renderDesignWidget(w))}
                </div>
              </div>
            ` : this._renderStandardContent(activeSub)}
          </div>
        </div>
      </ha-card>
    `;
  }

  _renderStandardContent(activeSub) {
    if (!activeSub) return html`<div class="re-content-scroll"><div class="empty-tab">AUCUNE DONNÉE</div></div>`;
    
    if (activeSub.mode === "iframe" && activeSub.iframe_url) {
      return html`
        <div class="re-iframe-wrapper">
          <iframe class="re-iframe" src="${activeSub.iframe_url}"></iframe>
        </div>
      `;
    }

    const sensors = activeSub.sensors || [];
    const activeFilters = new Set();
    sensors.forEach(s => {
      const parts = (s.entity || "").split(".");
      if (parts[0] === "light") activeFilters.add("light");
      if (parts[0] === "switch") activeFilters.add("switch");
      if (parts[0] === "binary_sensor") activeFilters.add("binary_sensor");
    });

    const showFilterBar = activeFilters.size > 1;
    const filteredSensors = sensors.filter(s => {
      if (this._activeFilter === "all") return true;
      return (s.entity || "").startsWith(this._activeFilter + ".");
    });

    return html`
      ${showFilterBar ? html`
        <div class="re-filter-bar">
          <button class="filter-item ${this._activeFilter === 'all' ? 'active' : ''}" @click="${() => this._activeFilter = "all"}">TOUT</button>
          ${Array.from(activeFilters).map(f => html`
            <button class="filter-item ${this._activeFilter === f ? 'active' : ''}" @click="${() => this._activeFilter = f}">
              ${f === 'light' ? 'LUMIÈRES' : f === 'switch' ? 'INTERRUPTEURS' : 'ALERTES'}
            </button>
          `)}
        </div>
      ` : html``}
      <div class="re-content-scroll">
        <div class="sensors-grid">
          ${filteredSensors.map(s => this._renderSensor(s))}
        </div>
      </div>
    `;
  }

  _renderSensor(s) {
    const entityId = s.entity;
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return html`<div class="sensor-card error"><div class="sensor-name">${s.name || entityId}</div><div class="sensor-value">NOT FOUND</div></div>`;

    const domain = entityId.split(".")[0];
    const value = stateObj.state;
    const friendlyName = s.name || stateObj.attributes.friendly_name || entityId;
    const icon = s.icon || stateObj.attributes.icon || "mdi:eye-outline";
    const unit = stateObj.attributes.unit_of_measurement || "";

    let effectClass = "";
    let stateLabel = value + (unit ? ` ${unit}` : "");
    let isActive = false;

    if (domain === "light") {
      effectClass = "effect-light";
      isActive = value === "on";
      stateLabel = isActive ? (stateObj.attributes.brightness ? `${Math.round(stateObj.attributes.brightness / 2.55)}%` : "ALLUMÉ") : "ÉTEINT";
    } else if (domain === "switch") {
      effectClass = "effect-switch";
      isActive = value === "on";
      stateLabel = isActive ? "ACTIF" : "INACTIF";
    } else if (domain === "binary_sensor") {
      effectClass = "effect-binary";
      isActive = value === "on";
      stateLabel = isActive ? "ALERTE" : "SÉCURISÉ";
    }

    const battery = stateObj.attributes.battery_level || stateObj.attributes.battery;
    let batteryHtml = html``;
    if (battery !== undefined) {
      let bClass = "batt-high";
      let bIcon = "mdi:battery";
      if (battery < 20) { bClass = "batt-low"; bIcon = "mdi:battery-alert"; }
      else if (battery < 50) { bClass = "batt-medium"; bIcon = "mdi:battery-medium"; }
      batteryHtml = html`<div class="card-battery-indicator ${bClass}"><ha-icon icon="${bIcon}"></ha-icon><span>${battery}%</span></div>`;
    }

    return html`
      <div class="sensor-card ${effectClass} ${isActive ? 'state-active' : ''}" @click="${() => this._handleEntityClick(entityId)}">
        <div class="sensor-card-header">
          <div class="sensor-name">${friendlyName}</div>
          <ha-icon class="sensor-icon" icon="${icon}"></ha-icon>
        </div>
        <div class="sensor-value">${stateLabel}</div>
        ${batteryHtml}
      </div>
    `;
  }

  _renderDesignWidget(w) {
    const wWidth = w.widthPct || 100;
    const wHeight = w.heightPx || 80;
    const wNoBorder = w.noBorder === true;
    
    let inlineStyle = `width: calc(${wWidth}% - 0px); height: ${wHeight}px;`;
    if (w.bgImage) {
      inlineStyle += ` background-image: url('${w.bgImage}'); background-size: cover; background-position: center;`;
    }

    return html`
      <div class="dw-card ${wNoBorder ? 'no-border' : ''}" style="${inlineStyle}">
        ${w.bgBlur ? html`<div style="position:absolute; top:0; left:0; width:100%; height:100%; backdrop-filter: blur(${w.bgBlur}px); pointer-events:none; z-index:1;"></div>` : html``}
        <div style="position:relative; width:100%; height:100%; z-index:2;">
          ${this._dispatchDesignWidget(w)}
        </div>
      </div>
    `;
  }

  _dispatchDesignWidget(w) {
    switch (w.type) {
      case "shape": return this._renderWidgetShape(w);
      case "gauge": return this._renderWidgetGauge(w);
      case "sparkline": return this._renderWidgetSparkline(w);
      case "badge": return this._renderWidgetBadge(w);
      case "progress": return this._renderWidgetProgress(w);
      case "spa_temp": return this._renderWidgetSpa(w);
      default: return html`<div style="padding:10px; color:#ff3333; font-size:10px;">WIDGET INCONNU : ${w.type}</div>`;
    }
  }

  _renderWidgetShape(w) {
    const mode = w.shape || "rect";
    const color = w.color || "#333333";
    const label = w.name || "";
    let shapeClass = "dw-rect";
    let sizeStyle = "width:40px; height:40px;";

    if (mode === "circle") shapeClass = "dw-circle";
    else if (mode === "square") shapeClass = "dw-square";
    else if (mode === "line-h") { shapeClass = "dw-line-h"; sizeStyle = "width:100%;"; }
    else if (mode === "line-v") { shapeClass = "dw-line-v"; sizeStyle = "height:100%;"; }

    return html`
      <div class="dw-shape-wrap">
        <div class="${shapeClass}" style="${sizeStyle} background-color:${color}; box-shadow: 0 0 8px ${color}88;"></div>
        ${label && mode !== "line-h" && mode !== "line-v" ? html`<div class="dw-shape-label" style="color:${color}">${label}</div>` : html``}
      </div>
    `;
  }

  _renderWidgetGauge(w) {
    const entityId = w.entity;
    const stateObj = entityId ? this.hass.states[entityId] : null;
    const val = stateObj ? parseFloat(stateObj.state) : (w.fallbackVal || 0);
    const min = w.min !== undefined ? w.min : 0;
    const max = w.max !== undefined ? w.max : 100;
    const color = w.color || "var(--re-green)";
    const label = w.name || (stateObj ? stateObj.attributes.friendly_name : "Gauge");

    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    const r = 24;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ - (pct / 100) * circ;

    return html`
      <div class="dw-gauge-wrap" @click="${() => entityId && this._handleEntityClick(entityId)}">
        <svg class="dw-gauge-svg" width="56" height="56" viewBox="0 0 58 58">
          <circle class="dw-gauge-track" cx="29" cy="29" r="${r}" stroke-width="3"/>
          <circle class="dw-gauge-fill" cx="29" cy="29" r="${r}" stroke-width="4" stroke="${color}"
                  stroke-dasharray="${circ}" stroke-dashoffset="${strokeDashoffset}" transform="rotate(-90 29 29)" style="filter: drop-shadow(0 0 3px ${color});"/>
          <text class="dw-gauge-center" cx="29" cy="33" font-size="11" fill="#ffffff" text-anchor="middle">${Math.round(w.showFloat ? val : val)}</text>
        </svg>
        <div class="dw-gauge-label" style="color:${color}; font-size:9px;">${label}</div>
      </div>
    `;
  }

  _renderWidgetSparkline(w) {
    const entityId = w.entity;
    const stateObj = entityId ? this.hass.states[entityId] : null;
    const val = stateObj ? parseFloat(stateObj.state) : (w.fallbackVal || 0);
    const color = w.color || "var(--re-green)";
    const label = w.name || (stateObj ? stateObj.attributes.friendly_name : "Sparkline");
    const unit = stateObj ? stateObj.attributes.unit_of_measurement || "" : "";

    if (entityId) {
      if (!this._sparkHistory[entityId]) this._sparkHistory[entityId] = [];
      const history = this._sparkHistory[entityId];
      if (history.length === 0 || history[history.length - 1] !== val) {
        history.push(val);
        if (history.length > 20) history.shift();
      }
    }

    const pts = this._sparkHistory[entityId] || [val, val];
    const width = 140;
    const height = 30;
    const hMin = Math.min(...pts);
    const hMax = Math.max(...pts);
    const span = hMax - hMin === 0 ? 1 : hMax - hMin;

    const coords = pts.map((p, idx) => {
      const x = (idx / Math.max(1, pts.length - 1)) * width;
      const y = height - ((p - hMin) / span) * height;
      return `${x},${y}`;
    });

    const linePath = coords.length > 0 ? "M " + coords.join(" L ") : "";
    const areaPath = coords.length > 0 ? `${linePath} L ${width},${height} L 0,${height} Z` : "";

    return html`
      <div class="dw-spark-wrap" @click="${() => entityId && this._handleEntityClick(entityId)}">
        <div class="dw-spark-header">
          <span class="dw-spark-name" style="color:${color}">${label}</span>
          <span class="dw-spark-val" style="color:#ffffff">${val}<span class="dw-spark-unit">${unit}</span></span>
        </div>
        <svg class="dw-spark-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" height="30">
          ${linePath ? html`
            <path class="dw-spark-area" d="${areaPath}" fill="${color}"/>
            <path class="dw-spark-line" d="${linePath}" stroke="${color}" style="filter:drop-shadow(0 0 2px ${color});"/>
          ` : html``}
        </svg>
      </div>
    `;
  }

  _renderWidgetBadge(w) {
    const entityId = w.entity;
    const stateObj = entityId ? this.hass.states[entityId] : null;
    const val = stateObj ? stateObj.state : (w.fallbackVal || "N/A");
    const label = w.name || (stateObj ? stateObj.attributes.friendly_name : "Badge");
    const icon = w.icon || (stateObj ? stateObj.attributes.icon : "mdi:label");
    const color = w.color || "#ffffff";
    const mode = w.iconPosition || "left";
    const unit = stateObj ? stateObj.attributes.unit_of_measurement || "" : "";

    return html`
      <div class="dw-badge-wrap icon-${mode}" @click="${() => entityId && this._handleEntityClick(entityId)}">
        <ha-icon class="dw-badge-icon" icon="${icon}" style="color:${color}; --mdc-icon-size:26px; filter:drop-shadow(0 0 3px ${color}88);"></ha-icon>
        <div class="dw-badge-texts">
          <div class="dw-badge-label" style="color:var(--re-text-gray); font-size:9px; text-transform:uppercase;">${label}</div>
          <div class="dw-badge-value" style="color:${color}">${val}<span class="dw-badge-unit">${unit}</span></div>
        </div>
      </div>
    `;
  }

  _renderWidgetProgress(w) {
    const entityId = w.entity;
    const stateObj = entityId ? this.hass.states[entityId] : null;
    const val = stateObj ? parseFloat(stateObj.state) : (w.fallbackVal || 0);
    const min = w.min !== undefined ? w.min : 0;
    const max = w.max !== undefined ? w.max : 100;
    const color = w.color || "var(--re-green)";
    const label = w.name || (stateObj ? stateObj.attributes.friendly_name : "Progress");
    const unit = stateObj ? stateObj.attributes.unit_of_measurement || "" : "";

    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

    return html`
      <div class="dw-progress-wrap" @click="${() => entityId && this._handleEntityClick(entityId)}">
        <div class="dw-progress-header">
          <span class="dw-progress-name" style="color:${color}">${label}</span>
          <span class="dw-progress-valstr" style="color:#fff">${val} <span style="font-size:10px; opacity:0.6;">${unit}</span></span>
        </div>
        <div class="dw-progress-track" style="height:10px;">
          <div class="dw-progress-fill" style="width:${pct}%; background-color:${color}; box-shadow:0 0 6px ${color};"></div>
        </div>
      </div>
    `;
  }

  _renderWidgetSpa(w) {
    const entityId = w.entity;
    const targetEntityId = w.targetEntity;
    const view = w.view || "home";

    const stateObj = entityId ? this.hass.states[entityId] : null;
    const targetObj = targetEntityId ? this.hass.states[targetEntityId] : null;

    const val = stateObj ? parseFloat(stateObj.state) : 34.5;
    const targetVal = targetObj ? parseFloat(targetObj.attributes.temperature) : 35.0;
    const isHeating = targetObj ? (targetObj.attributes.hvac_action === "heating" || targetObj.state === "heat") : false;

    if (view === "home") {
      return html`
        <div class="dw-spa-wrap">
          <div class="dw-spa-label" style="color:var(--re-text-gray); font-size:9px;">TEMPÉRATURE DU SPA</div>
          <div class="dw-spa-row">
            <button class="dw-spa-adj-btn" @click="${(e) => { e.stopPropagation(); this._adjustSpaTemp(targetEntityId, -0.5); }}">-</button>
            <div class="dw-spa-center">
              <div class="dw-spa-temp" style="color:${w.color || 'var(--re-green-bright)'}; text-shadow:0 0 10px rgba(0,255,0,0.3);">${val.toFixed(1)}<span class="dw-spa-unit">°C</span></div>
              <div class="dw-spa-target" style="color:#ffaa00;">CIBLE: ${targetVal.toFixed(1)}°C</div>
            </div>
            <button class="dw-spa-adj-btn" @click="${(e) => { e.stopPropagation(); this._adjustSpaTemp(targetEntityId, 0.5); }}">+</button>
          </div>
          <div class="dw-spa-heating" style="color:${isHeating ? '#ff3333' : '#444'}; border-color:${isHeating ? '#ff3333' : '#222'}; background:${isHeating ? 'rgba(255,0,0,0.05)' : 'none'};">
            ${isHeating ? '☣ CHAUFFAGE ACTIF' : 'STANDBY'}
          </div>
        </div>
      `;
    }

    if (view === "cam") {
      const liveCamHtml = targetObj ? html`<div class="camera-stream-container"><div style="color:#555;font-size:11px;">FLUX SYSTÈME SECURISE</div></div>` : html``;
      return html`
        <div class="sensor-card type-camera-feed" style="width:100%; height:100%; border:none;">
          <div class="camera-scanlines"></div>
          <div class="camera-corners"></div>
          <div class="camera-stream-container">
            ${w.bgImage ? html`<img class="camera-img" src="${w.bgImage}"/>` : html`<div style="color:#444; font-size:12px; font-weight:bold;">CAMÉRA INDISPONIBLE</div>`}
            <div class="camera-hud-overlay">
              <div class="hud-top-row">
                <span class="hud-rec-indicator"><span class="spa-dot" style="background:#ff0000; box-shadow:0 0 4px #ff0000;"></span>REC</span>
                <span class="hud-cam-name">ZONE SPA - ZONE_0${w.view === 'cam' ? '1' : '2'}</span>
              </div>
              <div class="hud-bottom-row">
                <span class="hud-timestamp">${this._timeString.split(" ")[1] || ""}</span>
                <span class="hud-status-ok" style="color:${val > 38 ? '#ff3333' : '#00ff00'}; border-color:${val > 38 ? '#ff3333' : '#00ff00'};">${val > 38 ? 'CRITICAL TEMP' : 'SYS_OK'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (view === "maintenance") {
      const ph = w.phEntity ? parseFloat(this.hass.states[w.phEntity]?.state || 7.2) : 7.2;
      const orp = w.orpEntity ? parseFloat(this.hass.states[w.orpEntity]?.state || 650) : 650;
      return html`
        <div class="spa-hud-container" style="padding:14px; box-sizing:border-box; height:100%; justify-content:center;">
          <div class="spa-maintenance-grid" style="margin:0; gap:10px;">
            <div class="spa-maint-strip">
              <div class="spa-strip-header"><span>POTENTIEL HYDROGÈNE</span><span style="color:#00ff00;">${ph.toFixed(1)} pH</span></div>
              <div class="spa-strip-track"><div class="spa-strip-fill" style="width:${(ph/14)*100}%; background:#00ff00;"></div></div>
            </div>
            <div class="spa-maint-strip">
              <div class="spa-strip-header"><span>RÉDOX (DÉSINFECTION)</span><span style="color:#00ffff;">${orp} mV</span></div>
              <div class="spa-strip-track"><div class="spa-strip-fill" style="width:${(orp/1000)*100}%; background:#00ffff;"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    return html``;
  }

  _adjustSpaTemp(entityId, amount) {
    if (!entityId || !this.hass.states[entityId]) return;
    const stateObj = this.hass.states[entityId];
    const currentTarget = parseFloat(stateObj.attributes.temperature) || 35.0;
    const newTemp = currentTarget + amount;
    
    this.hass.callService("climate", "set_temperature", {
      entity_id: entityId,
      temperature: newTemp
    });
  }

  _handleEntityClick(entityId) {
    const event = new CustomEvent("hass-more-info", {
      detail: { entityId: entityId },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

// Enregistrement de la classe principale
if (!customElements.get("resident-evil-card")) {
  customElements.define("resident-evil-card", ResidentEvilCard);
}


// ==========================================
// 2. ÉDITEUR VISUEL DE LA CARTE (RESIDENT EVIL)
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

  render() {
    if (!this.hass || !this._config) return html``;

    const self = this;
    const tabs = ["GÉNÉRAL", "MÉTÉO", "ZONES", "VIDÉO", "SERVEURS", "SPA", "ÉNERGIE", "SANTÉ", "TRACKER"];
    
    const tabStyle = (idx) => `
      padding: 6px 10px;
      font-size: 10px;
      font-weight: bold;
      font-family: inherit;
      background: ${self._activeTab === idx ? '#ef4444' : '#111827'};
      color: ${self._activeTab === idx ? '#ffffff' : '#9ca3af'};
      border: 1px solid ${self._activeTab === idx ? '#ef4444' : '#1f2937'};
      cursor: pointer;
      flex: 1;
      text-align: center;
      white-space: nowrap;
    `;

    // Helpers d'édition
    self._inp = (label, path, currentVal) => html`
      <div style="margin-bottom:10px; display:flex; flex-direction:column; gap:4px;">
        <label style="font-size:10px; color:#9ca3af; font-weight:bold; text-transform:uppercase;">${label}</label>
        <input style="background:#1f2937; border:1px solid #374151; color:#fff; padding:6px 8px; font-family:inherit; font-size:12px; border-radius:4px;"
               type="text" .value="${currentVal || ''}" @change="${(e) => self._updatePath(path, e.target.value)}"/>
      </div>
    `;

    // Panels de rendu
    const renderGeneral = () => html`
      <div>
        <div style="font-size:11px; color:#9ca3af; margin-bottom:12px; line-height:1.4;">
          Configurez l'arborescence globale de votre Terminal Umbrella. Chaque bloc correspond à un onglet principal ou à un sous-menu Lovelace.
        </div>
        ${self._inp('Titre Terminal', 'title', self._config.title || 'UMBRELLA CORP.')}
      </div>
    `;

    const renderMeteo = () => html`<div>${self._inp('Entité Météo Principale', 'categories.0.submenus.0.sensors.0.entity', (((self._config.categories||[])[0]||{}).submenus||[])[0]?.sensors?.[0]?.entity)}</div>`;
    const renderZones = () => html`<div style="color:#9ca3af; font-size:11px;">Configuration des capteurs d'ouverture et lumières par pièce via YAML.</div>`;
    const renderVideo = () => html`<div>${self._inp('URL Caméra Garage (MJPEG)', 'categories.0.submenus.2.iframe_url', (((self._config.categories||[])[0]||{}).submenus||[])[2]?.iframe_url)}</div>`;
    const renderServeurs = () => html`<div style="color:#9ca3af; font-size:11px;">Moniteurs Proxmox, TrueNAS et Docker.</div>`;
    
    const renderSpa = () => {
      const c = self._config.categories || [];
      return html`
        <div>
          ${self._inp('Capteur Température Eau', 'categories.0.submenus.0.widgets.0.entity', c[0]?.submenus?.[0]?.widgets?.[0]?.entity)}
          ${self._inp('Contrôle Thermostat (Climate)', 'categories.0.submenus.0.widgets.0.targetEntity', c[0]?.submenus?.[0]?.widgets?.[0]?.targetEntity)}
        </div>
      `;
    };

    const renderEnergie = () => html`<div style="color:#9ca3af; font-size:11px;">Suivi de production Beem/IBC et stockage Marstek/Storcube.</div>`;
    const renderSante = () => html`<div style="color:#9ca3af; font-size:11px;">Seuils d'alertes ECG et constantes vitales de la cellule familiale.</div>`;
    
    const renderTracker = () => {
      const p = (((self._config.categories||[])[0]||{}).submenus||[])[0]?.widgets?.[0]?.persons?.[0] || {};
      const ci = 0; const pi = 0;
      return html`
        <div>
          <div style="font-size:12px; font-weight:bold; color:#ef4444; margin-bottom:8px;">👤 CONFIGURATION DES PERSONNES</div>
          ${self._inp('Nom de la personne', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.name`, p.name)}
          ${self._inp('Tracker RFS (Zone/Présence)', `categories.${ci}.submenus.0.widgets.0.persons.${pi}.tracker_entity`, p.tracker_entity)}
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
        <div style="padding:8px 14px; background:#0b131f; border-top:1px solid #1a2744; text-align:right; font-size:9px; color:#4b5563;">
          UMBRELLA CORP GUI v2.4.0
        </div>
      </div>
    `;
  }

  _updatePath(path, value) {
    if (!this._config) return;
    const config = JSON.parse(JSON.stringify(this._config));
    const parts = path.split('.');
    let current = config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    this._config = config;
    
    const event = new CustomEvent("config-changed", {
      detail: { config: config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

// Enregistrement de l'éditeur visuel de carte
if (!customElements.get("resident-evil-card-editor")) {
  customElements.define("resident-evil-card-editor", ResidentEvilCardEditor);
}

// Déclaration pour l'interface de sélection Lovelace
window.customCards = window.customCards || [];
const isAlreadyDeclared = window.customCards.some(c => c.type === "resident-evil-card");
if (!isAlreadyDeclared) {
  window.customCards.push({
    type: "resident-evil-card",
    name: "Resident Evil Terminal Card",
    description: "Un terminal rétro style Umbrella Corporation complet avec ECG et onglets tactiques.",
    preview: true
  });
}
