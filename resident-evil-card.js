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

  .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; width: 100%; z-index: 1; }
  
  .re-iframe-wrapper { flex: 1; width: 100%; height: 100%; display: flex; margin: 0; padding: 0; overflow: hidden; min-height: 0; z-index: 1; }
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
  
  /* LOGO UMBRELLA CORPORATION */
  .umbrella-img-logo { 
    width: 24px; 
    height: 24px; 
    animation: umbrella-rotate 8s linear infinite; 
    transform-origin: center;
    filter: drop-shadow(0 0 4px rgba(255,0,0,0.6));
  }
  .umbrella-img-logo:hover { 
    animation-duration: 2s; 
    filter: drop-shadow(0 0 10px rgba(255,0,0,0.9)); 
  }
  @keyframes umbrella-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  
  .umbrella-bg-watermark { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    width: 320px; 
    height: 320px; 
    transform: translate(-50%, -50%); 
    pointer-events: none; 
    z-index: 0; 
    animation: umbrella-pulse-anim 4s ease-in-out infinite;
  }
  @keyframes umbrella-pulse-anim {
    0%, 100% { opacity: 0.03; transform: translate(-50%, -50%) scale(1); }
    50%      { opacity: 0.06; transform: translate(-50%, -50%) scale(1.05); }
  }

  /* ==========================================
     DESIGN WIDGETS STYLE
     ========================================== */
  .design-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
    align-items: flex-start;
    box-sizing: border-box;
    z-index: 1;
  }

  .dw-card {
    background: #0d0d0d;
    border: 1px solid #222;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .dw-card.no-border { border: none !important; background: transparent !important; }

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
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 10px;
    gap: 8px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
  .dw-badge-wrap.icon-top    { flex-direction: column; }
  .dw-badge-wrap.icon-bottom { flex-direction: column-reverse; }
  .dw-badge-wrap.icon-left   { flex-direction: row; }
  .dw-badge-wrap.icon-right  { flex-direction: row-reverse; }
  .dw-badge-icon  { flex-shrink: 0; }
  .dw-badge-texts { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .dw-badge-wrap.icon-left .dw-badge-texts,
  .dw-badge-wrap.icon-right .dw-badge-texts { align-items: flex-start; }
  .dw-badge-label { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
  .dw-badge-value { font-size: 22px; font-weight: bold; line-height: 1; }
  .dw-badge-unit  { font-size: 12px; opacity: 0.7; font-weight: normal; }

  /* PROGRESS widget */
  .dw-progress-wrap { display: flex; flex-direction: column; padding: 12px 12px 10px; gap: 8px; width: 100%; height: 100%; box-sizing: border-box; justify-content: center; }
  .dw-progress-header { display: flex; justify-content: space-between; align-items: baseline; }
  .dw-progress-name { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
  .dw-progress-valstr { font-size: 16px; font-weight: bold; }
  .dw-progress-track { width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; position: relative; overflow: hidden; flex-shrink: 0; }
  .dw-progress-fill { height: 100%; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); position: relative; }
  .dw-progress-fill::after { content: ''; position: absolute; top:0; right:0; width: 3px; height: 100%; background: rgba(255,255,255,0.35); }

  /* SPA TEMP widget */
  .dw-spa-wrap { display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 12px 14px; width: 100%; height: 100%; box-sizing: border-box; position: relative; }
  .dw-spa-adj-btn { background: none; border: 1px solid #333; color: #fff; cursor: pointer; padding: 2px 10px; font-family: inherit; font-size: 14px; transition: all 0.15s; }
  .dw-spa-adj-btn:hover { background: #fff; color: #000; }
`;

// ==========================================
// 2. LOGIQUE PRINCIPALE DU COMPOSANT LIT
// ==========================================
class ResidentEvilCard extends LitElement {
  static styles = cardStyles;

  // LIAISON INDISPENSABLE POUR L'ÉDITEUR VISUEL
  static getConfigElement() {
    return document.createElement("resident-evil-card-editor");
  }

  static properties = {
    hass: { type: Object },
    config: { type: Object },
    _activeMenuIdx: { type: Number, state: true },
    _activeSubmenuIdx: { type: Number, state: true },
    _activeFilter: { type: String, state: true },
    _lastCardUpdate: { type: String, state: true }
  };

  constructor() {
    super();
    this._activeMenuIdx = 0;
    this._activeSubmenuIdx = 0;
    this._activeFilter = 'all';
    this._lastCardUpdate = new Date().toLocaleTimeString();

    setInterval(() => {
      this._lastCardUpdate = new Date().toLocaleTimeString();
    }, 1000);
  }

  setConfig(config) {
    if (!config.categories || !Array.isArray(config.categories)) {
      throw new Error('Veuillez définir une liste de "categories" valide.');
    }
    this.config = config;
  }

  _getGridIcon(entityId) {
    const stateObj = this.hass.states[entityId];
    if (stateObj && stateObj.attributes.icon) return stateObj.attributes.icon;
    const domain = entityId.split('.')[0];
    switch (domain) {
      case 'light': return 'mdi:lightbulb';
      case 'switch': return 'mdi:toggle-switch';
      case 'binary_sensor': return 'mdi:shield-alert';
      case 'sensor': return 'mdi:eye';
      case 'sun': return 'mdi:white-balance-sunny';
      default: return 'mdi:view-grid';
    }
  }

  _handleAction(entityId, isSwitch, currentActive) {
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

  _callSpaTargetTemp(entityId, step) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return;
    const current = parseFloat(stateObj.attributes.temperature || stateObj.state);
    if (isNaN(current)) return;
    this.hass.callService('climate', 'set_temperature', {
      entity_id: entityId,
      temperature: current + step
    });
  }

  _callButton(entityId) {
    if (!entityId) return;
    this.hass.callService('button', 'press', { entity_id: entityId });
  }

  _renderDesignWidget(w) {
    const sizeStyle = `width: ${w.widthPct || 100}%; height: ${w.heightPx || 200}px;`;
    const noBorder = w.noBorder || false;
    const bgBlur = w.bgBlur ? `filter: blur(${w.bgBlur}px);` : '';
    const bgStyle = w.bgImage ? `background-image: url('${w.bgImage}'); background-size: cover; background-position: center;` : '';

    switch (w.type) {
      case 'health':
        return this._renderHealthWidget(w, sizeStyle, noBorder);
      case 'plant':
        return this._renderPlantWidget(w, sizeStyle, noBorder);
      case 'shape':
        return this._renderShapeWidget(w, sizeStyle, noBorder);
      case 'gauge':
        return this._renderGaugeWidget(w, sizeStyle, noBorder);
      case 'sparkline':
        return this._renderSparklineWidget(w, sizeStyle, noBorder);
      case 'badge':
        return this._renderBadgeWidget(w, sizeStyle, noBorder);
      case 'progress':
        return this._renderProgressWidget(w, sizeStyle, noBorder);
      case 'spa_temp':
        return this._renderSpaTempWidget(w, sizeStyle, noBorder, bgStyle, bgBlur);
      default:
        return html`<div class="dw-card" style="${sizeStyle} padding:10px; color:red;">Widget type absent/inconnu : ${w.type}</div>`;
    }
  }

  _renderHealthWidget(w, sizeStyle, noBorder) {
    return html`
      <div class="dw-card ${noBorder ? 'no-border' : ''}" style="border-color: var(--re-border-color, #ff0000); ${sizeStyle}; overflow-y: auto; background: #000;">
        <div style="padding: 15px; font-family: 'Courier New', monospace;">
          <div style="color: #ff3333; font-size: 13px; font-weight: bold; letter-spacing: 2px; margin-bottom: 15px; text-shadow: 0 0 4px rgba(255,51,51,0.6);">
            ☣️ UMBRELLA CORP. // SUIVI BIOMÉTRIQUE DU PERSONNEL
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
            ${w.people.map(person => {
              const weightState = this.hass.states[person.weight_entity];
              const weight = weightState ? parseFloat(weightState.state).toFixed(1) : '--';
              
              return html`
                <div style="background: #080808; border: 1px solid #222; padding: 10px; position: relative;">
                  <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 10px;">
                    <img src="${person.image}" style="width: 42px; height: 42px; border: 1px solid #444; filter: grayscale(100%) contrast(1.2);" />
                    <div>
                      <div style="font-size: 12px; font-weight: bold; color: #fff; letter-spacing: 1px;">SUJET: ${person.name.toUpperCase()}</div>
                      <div style="font-size: 10px; color: #00ff00; text-shadow: 0 0 3px rgba(0,255,0,0.4);">STATUT VITAL: ACTIF</div>
                    </div>
                  </div>
                  
                  <div style="font-size: 14px; font-weight: bold; color: #ff9900; margin-bottom: 8px; font-family: monospace;">
                    MASSE GLOBALE: ${weight} kg <span style="font-size: 10px; color: #555;">(Seuil ciblé: ${person.ideal}kg)</span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
                    ${person.sensors.map(s => {
                      const sState = this.hass.states[s.entity];
                      const val = sState ? sState.state : '--';
                      return html`
                        <div style="background: #030303; border: 1px solid #111; padding: 3px 5px; display: flex; align-items: center; justify-content: space-between;">
                          <div style="display: flex; align-items: center; gap: 4px; color: #888;">
                            <ha-icon icon="${s.icon}" style="--mdc-icon-size: 12px; color: ${s.col || '#aaa'};"></ha-icon>
                            <span>${s.name}</span>
                          </div>
                          <span style="color: #fff; font-weight: bold;">${val}${s.unit}</span>
                        </div>
                      `;
                    })}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }

  _renderPlantWidget(w, sizeStyle, noBorder) {
    const battState = this.hass.states[w.battery_sensor];
    const battery = battState ? parseInt(battState.state) : null;

    return html`
      <div class="dw-card ${noBorder ? 'no-border' : ''}" style="border-color: #222; ${sizeStyle}; background: #050505; box-sizing: border-box; display: inline-block; vertical-align: top;">
        <div style="padding: 10px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Courier New', monospace;">
          
          <div style="display: flex; gap: 8px; border-bottom: 1px solid #1a1a1a; padding-bottom: 6px;">
            <img src="${w.plant_image}" style="width: 40px; height: 40px; border: 1px solid #333; object-fit: cover; filter: grayscale(30%) brightness(0.9);" />
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; font-weight: bold; color: #00ff00; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${w.plant_name}
              </div>
              <div style="font-size: 8px; color: #444; font-style: italic;">${w.latin_name}</div>
            </div>
            ${battery !== null ? html`
              <div style="font-size: 9px; color: ${battery < 20 ? '#ff3333' : '#666'};">
                <ha-icon icon="mdi:battery" style="--mdc-icon-size: 11px;"></ha-icon>${battery}%
              </div>
            ` : html``}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; flex: 1;">
            ${w.sensors.map(s => {
              const sState = this.hass.states[s.entity];
              const val = sState ? parseFloat(sState.state).toFixed(0) : '--';
              return html`
                <div style="background: #090909; border: 1px solid #111; padding: 4px; display: flex; flex-direction: column; justify-content: center;">
                  <div style="display: flex; align-items: center; gap: 3px; font-size: 8px; color: #555; text-transform: uppercase;">
                    <ha-icon icon="${s.icon}" style="--mdc-icon-size: 10px; color: ${s.color || '#fff'};"></ha-icon>
                    ${s.name}
                  </div>
                  <div style="font-size: 11px; font-weight: bold; color: #eee; margin-top: 1px;">
                    ${val}<span style="font-size: 8px; color: #444; font-weight: normal;">${s.unit}</span>
                  </div>
                </div>
              `;
            })}
          </div>

        </div>
      </div>
    `;
  }

  _renderShapeWidget(w, sizeStyle, noBorder) {
    const sh = w.shape || 'circle';
    const radius = w.radiusPx || 40;
    const thick  = w.thicknessPx || 4;
    const bgCol  = w.backgroundColor || '#222';
    const borderCol = w.borderColor || '#444';
    const labelCol  = w.labelColor || '#aaa';
    
    let geomStyle = `width:${radius*2}px; height:${radius*2}px; background:${bgCol}; border:${thick}px solid ${borderCol};`;
    if (sh === 'circle') geomStyle += 'border-radius:50%;';
    if (sh === 'rect')   geomStyle += 'border-radius:4px;';
    if (sh === 'line-h') geomStyle = `width:100%; height:${thick}px; background:${bgCol};`;
    if (sh === 'line-v') geomStyle = `width:${thick}px; height:100%; background:${bgCol};`;

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}">
        <div class="dw-shape-wrap">
          <div class="dw-${sh}" style="${geomStyle}"></div>
          ${w.label ? html`<div class="dw-shape-label" style="color:${labelCol};">${w.label}</div>` : ''}
        </div>
      </div>
    `;
  }

  _renderGaugeWidget(w, sizeStyle, noBorder) {
    const sObj = this.hass.states[w.entity];
    const val  = sObj ? parseFloat(sObj.state) : 0;
    const min  = w.min !== undefined ? w.min : 0;
    const max  = w.max !== undefined ? w.max : 100;
    const col  = w.color || 'var(--re-green)';
    const name = w.name || (sObj ? sObj.attributes.friendly_name : 'Gauge');
    const unit = w.unit || (sObj ? sObj.attributes.unit_of_measurement : '');

    const pct   = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    const rad   = 34;
    const circ  = 2 * Math.PI * rad;
    const off   = circ - (pct / 100) * circ;

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}">
        <div class="dw-gauge-wrap">
          <svg class="dw-gauge-svg" width="80" height="80" viewBox="0 0 80 80">
            <circle class="dw-gauge-track" cx="40" cy="40" r="${rad}" stroke-width="6" />
            <circle class="dw-gauge-fill" cx="40" cy="40" r="${rad}" stroke-width="6"
                    stroke="${col}" stroke-dasharray="${circ}" stroke-dashoffset="${off}" transform="rotate(-90 40 40)" />
            <text class="dw-gauge-center" cx="40" cy="45" text-anchor="middle" font-size="14" fill="#fff">
              ${sObj ? Math.round(val) : '--'}
            </text>
          </svg>
          <div class="dw-gauge-label" style="color:var(--re-text-gray); font-size:10px;">${name.toUpperCase()} ${unit}</div>
        </div>
      </div>
    `;
  }

  _renderSparklineWidget(w, sizeStyle, noBorder) {
    const sObj = this.hass.states[w.entity];
    const valStr = sObj ? sObj.state : '--';
    const unit = w.unit || (sObj ? sObj.attributes.unit_of_measurement : '');
    const name = w.name || (sObj ? sObj.attributes.friendly_name : 'Sparkline');
    const col  = w.color || 'var(--re-green)';

    let points = [40, 35, 45, 20, 55, 30, 42, 50, 25, 38, 48];
    if (sObj && sObj.attributes.history) {
      const h = sObj.attributes.history;
      if (Array.isArray(h) && h.length > 1) points = h.map(v => parseFloat(v));
    }

    const minP = Math.min(...points);
    const maxP = Math.max(...points) || 1;
    const range = maxP - minP || 1;
    
    const wSvg = 140;
    const hSvg = 40;
    const mapped = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * wSvg;
      const y = hSvg - ((p - minP) / range) * hSvg;
      return [x, y];
    });

    const pathD = mapped.map((pt, i) => `${i===0?'M':'L'} ${pt[0]} ${pt[1]}`).join(' ');
    const areaD = mapped.length ? `${pathD} L ${mapped[mapped.length-1][0]} ${hSvg} L ${mapped[0][0]} ${hSvg} Z` : '';

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}">
        <div class="dw-spark-wrap">
          <div class="dw-spark-header">
            <div class="dw-spark-name" style="color:var(--re-text-gray); font-size:10px;">${name.toUpperCase()}</div>
            <div class="dw-spark-val" style="color:#fff;">${valStr}<span class="dw-spark-unit">${unit}</span></div>
          </div>
          <svg class="dw-spark-svg" viewBox="0 0 ${wSvg} ${hSvg}" preserveAspectRatio="none">
            <path class="dw-spark-area" d="${areaD}" fill="${col}"></path>
            <path class="dw-spark-line" d="${pathD}" stroke="${col}"></path>
          </svg>
        </div>
      </div>
    `;
  }

  _renderBadgeWidget(w, sizeStyle, noBorder) {
    const sObj = this.hass.states[w.entity];
    const val  = sObj ? sObj.state : '--';
    const unit = w.unit || (sObj ? sObj.attributes.unit_of_measurement : '');
    const name = w.name || (sObj ? sObj.attributes.friendly_name : 'Badge');
    const icon = w.icon || (sObj ? sObj.attributes.icon : 'mdi:numeric');
    const pos  = w.iconPosition || 'left';
    const col  = w.color || '#fff';

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}" @click="${()=>this._handleAction(w.entity, false)}">
        <div class="dw-badge-wrap icon-${pos}">
          <ha-icon class="dw-badge-icon" icon="${icon}" style="color:${col}; --mdc-icon-size: 26px;"></ha-icon>
          <div class="dw-badge-texts">
            <div class="dw-badge-label" style="color:var(--re-text-gray); font-size:9px;">${name.toUpperCase()}</div>
            <div class="dw-badge-value" style="color:#fff;">${val}<span class="dw-badge-unit">${unit}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  _renderProgressWidget(w, sizeStyle, noBorder) {
    const sObj = this.hass.states[w.entity];
    const val  = sObj ? parseFloat(sObj.state) : 0;
    const min  = w.min !== undefined ? w.min : 0;
    const max  = w.max !== undefined ? w.max : 100;
    const name = w.name || (sObj ? sObj.attributes.friendly_name : 'Progress');
    const unit = w.unit || (sObj ? sObj.attributes.unit_of_measurement : '');
    const col  = w.color || 'var(--re-green)';
    const trackH = w.trackHeightPx || 8;

    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

    return html`
      <div class="dw-card ${noBorder?'no-border':''}" style="${sizeStyle}">
        <div class="dw-progress-wrap">
          <div class="dw-progress-header">
            <div class="dw-progress-name" style="color:var(--re-text-gray); font-size:10px;">${name.toUpperCase()}</div>
            <div class="dw-progress-valstr" style="color:#fff; font-size:13px;">${sObj ? val : '--'} <span style="font-size:9px; opacity:0.5;">${unit}</span></div>
          </div>
          <div class="dw-progress-track" style="height:${trackH}px;">
            <div class="dw-progress-fill" style="width:${pct}%; background:${col};"></div>
          </div>
        </div>
      </div>
    `;
  }

  _renderSpaTempWidget(w, sizeStyle, noBorder, bgStyle, bgBlur) {
    const currentTempState = this.hass.states[w.entity];
    const targetClimateState = this.hass.states[w.targetEntity];

    const currentTemp = currentTempState ? parseFloat(currentTempState.state) : null;
    let targetTemp = null;
    let hvacAction = 'idle';

    if (targetClimateState) {
      targetTemp = parseFloat(targetClimateState.attributes.temperature || targetClimateState.state);
      hvacAction = targetClimateState.attributes.hvac_action || 'idle';
    }

    const extTemp = w.extTempEntity && this.hass.states[w.extTempEntity] ? parseFloat(this.hass.states[w.extTempEntity].state).toFixed(1) : '--';
    const extHum  = w.extHumEntity && this.hass.states[w.extHumEntity] ? parseFloat(this.hass.states[w.extHumEntity].state).toFixed(0) : '--';
    const airTemp = w.airTempEntity && this.hass.states[w.airTempEntity] ? parseFloat(this.hass.states[w.airTempEntity].state).toFixed(1) : '--';
    const airHum  = w.airHumEntity && this.hass.states[w.airHumEntity] ? parseFloat(this.hass.states[w.airHumEntity].state).toFixed(0) : '--';

    const power = w.powerEntity && this.hass.states[w.powerEntity] ? parseFloat(this.hass.states[w.powerEntity].state).toFixed(0) : '--';
    const energy = w.energyEntity && this.hass.states[w.energyEntity] ? parseFloat(this.hass.states[w.energyEntity].state).toFixed(1) : '--';

    const filterAge = w.filterEntity && this.hass.states[w.filterEntity] ? parseFloat(this.hass.states[w.filterEntity].state) : 0;
    const filterMax = w.filterMax || 3;
    const filterPct = Math.max(0, Math.min(100, 100 - (filterAge / filterMax) * 100));

    const chlorineAge = w.chlorineEntity && this.hass.states[w.chlorineEntity] ? parseFloat(this.hass.states[w.chlorineEntity].state) : 0;
    const chlorineMax = w.chlorineMax || 13;
    const chlorinePct = Math.max(0, Math.min(100, 100 - (chlorineAge / chlorineMax) * 100));

    const phVal  = w.phEntity && this.hass.states[w.phEntity] ? parseFloat(this.hass.states[w.phEntity].state).toFixed(1) : '--';
    const orpVal = w.orpEntity && this.hass.states[w.orpEntity] ? parseFloat(this.hass.states[w.orpEntity].state).toFixed(0) : '--';
    const tdsVal = w.tdsEntity && this.hass.states[w.tdsEntity] ? parseFloat(this.hass.states[w.tdsEntity].state).toFixed(0) : '--';

    const leakObj = w.leakEntity ? this.hass.states[w.leakEntity] : null;
    const leakActive = leakObj && (leakObj.state === 'on' || leakObj.state === 'true');

    if (w.view === 'cam') {
      return html`
        <div class="dw-card ${noBorder ? 'no-border' : ''}" style="${sizeStyle}">
          <div class="sensor-card type-camera-feed" style="width:100%; height:100%; border:none;">
            <div class="camera-stream-container">
              <img class="camera-img" src="/api/camera_proxy/camera.spa" />
              <div class="camera-scanlines"></div>
              <div class="camera-corners"></div>
              <div class="camera-hud-overlay">
                <div class="hud-top-row">
                  <div class="hud-rec-indicator"><span style="display:inline-block; width:6px; height:6px; background:red; border-radius:50%;"></span>LIVE</div>
                  <div class="hud-cam-name">CAMÉRA SPA</div>
                </div>
                <div class="hud-bottom-row">
                  <div class="hud-timestamp">${this._lastCardUpdate}</div>
                  <div class="hud-status-ok">SYS.OK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="dw-card ${noBorder ? 'no-border' : ''}" style="${sizeStyle}">
        <div style="position: absolute; top:0; left:0; width:100%; height:100%; ${bgStyle} ${bgBlur} opacity: 0.15; z-index:0; pointer-events:none;"></div>
        
        <div class="dw-spa-wrap" style="z-index:1; height:100%;">
          <div class="spa-hud-container">
            
            <div class="spa-top-bar">
              <div style="font-size:12px; font-weight:bold; color:#fff; letter-spacing:1px;">H2O CRITICAL MONITOR</div>
              <div class="spa-badge-heater ${hvacAction === 'heating' ? 'heating' : ''}">
                <span class="spa-dot"></span>
                <span>${hvacAction === 'heating' ? 'CHAUFFAGE ACTIF' : 'STABLE / VEILLE'}</span>
              </div>
            </div>

            <div class="spa-trident-layout">
              <div class="spa-side-metric left">
                <div class="spa-huge-val">${airTemp}°C</div>
                <div class="spa-metric-lbl">AIR INTÉRIEUR</div>
                <div class="spa-sub-badge">${airHum}% RH</div>
              </div>

              <div class="spa-center-dial">
                <div class="spa-circular-monitor">
                  <div class="spa-dial-lbl">ACTUEL</div>
                  <div class="spa-dial-temp">${currentTemp !== null ? currentTemp.toFixed(1) : '--'}°C</div>
                  ${targetTemp !== null ? html`<div class="spa-dial-target">CIBLE: ${targetTemp.toFixed(1)}°</div>` : ''}
                </div>
                <div style="display:flex; gap:15px; margin-top:5px; z-index:10;">
                  <button class="spa-dial-arrow" @click="${() => this._callSpaTargetTemp(w.targetEntity, -0.5)}">▼ DOWN</button>
                  <button class="spa-dial-arrow" @click="${() => this._callSpaTargetTemp(w.targetEntity, 0.5)}">▲ UP</button>
                </div>
              </div>

              <div class="spa-side-metric right">
                <div class="spa-huge-val">${extTemp}°C</div>
                <div class="spa-metric-lbl">EXTÉRIEUR CABANE</div>
                <div class="spa-sub-badge">${extHum}% RH</div>
              </div>
            </div>

            <div class="spa-energy-row">
              <div class="spa-chip">PUISSANCE: <span style="color:#ff9900;font-weight:bold;">${power} W</span></div>
              <div class="spa-chip">CONSO: <span style="color:#00ffff;font-weight:bold;">${energy} kWh</span></div>
              <div class="spa-chip ${leakActive ? 'text-red error' : ''}">FUITE: <span style="font-weight:bold;">${leakActive ? 'ALERTE' : 'SÉCURISÉ'}</span></div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; background:#080808; border:1px solid #151515; padding:6px; text-align:center;">
              <div><div style="font-size:8px; color:#555;">POTENTIEL HYDROGÈNE</div><div style="font-size:14px; font-weight:bold; color:#00ff88;">pH ${phVal}</div></div>
              <div><div style="font-size:8px; color:#555;">OXYDO-RÉDUCTION</div><div style="font-size:14px; font-weight:bold; color:#00ffff;">${orpVal} mV</div></div>
              <div><div style="font-size:8px; color:#555;">SOLUTES TOTAUX (TDS)</div><div style="font-size:14px; font-weight:bold; color:#ff9900;">${tdsVal} ppm</div></div>
            </div>

            <div class="spa-maintenance-grid">
              <div class="spa-maint-strip">
                <div class="spa-strip-header"><span>MODULE DE FILTRATION</span><span>${filterPct.toFixed(0)}%</span></div>
                <div class="spa-strip-track"><div class="spa-strip-fill" style="width:${filterPct}%; background:${filterPct < 20 ? 'red' : 'var(--re-green)'};"></div></div>
                <div class="spa-strip-footer" style="cursor:pointer;" @click="${() => this._callButton(w.resetFilterEntity)}">➔ RÉINITIALISER CYCLES</div>
              </div>
              <div class="spa-maint-strip">
                <div class="spa-strip-header"><span>AUTONOMIE CHLORE (GALET)</span><span>${chlorinePct.toFixed(0)}%</span></div>
                <div class="spa-strip-track"><div class="spa-strip-fill" style="width:${chlorinePct}%; background:${chlorinePct < 20 ? 'red' : 'var(--re-green)'};"></div></div>
                <div class="spa-strip-footer" style="cursor:pointer;" @click="${() => this._callButton(w.resetChlorineEntity)}">➔ ENREGISTRER RECHARGE</div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:4px; margin-top:2px;">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(idx => {
                const swEntity = w[`switch_${idx}`];
                const swName = w[`name_switch_10`] && idx === 10 ? 'Bulles' : w[`name_switch_${idx}`] || `SW ${idx}`;
                if (!swEntity) return html``;
                const swStateObj = this.hass.states[swEntity];
                const isActive = swStateObj && (swStateObj.state === 'on' || swStateObj.state === 'true');
                return html`
                  <button @click="${() => this._handleAction(swEntity, true)}"
                          style="background:${isActive ? '#181c24' : '#0a0a0a'}; border:1px solid ${isActive ? '#00ff88' : '#222'}; color:${isActive ? '#00ff88' : '#666'}; font-family:inherit; font-size:9px; padding:4px 2px; cursor:pointer; text-transform:uppercase; font-weight:bold;">
                    ${swName}
                  </button>
                `;
              })}
            </div>

          </div>
          
          <div class="spa-footer-status">
            <div>SATELLITE SYNC: OK</div>
            <div class="spa-status-ok">BIO-SÉCURITÉ CONFIRMÉE</div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const cat = this.config.categories[this._activeMenuIdx];
    let sidebarItems = [];
    let currentSubmenu = null;

    if (cat && cat.submenus) {
      sidebarItems = cat.submenus;
      currentSubmenu = sidebarItems[this._activeSubmenuIdx];
    }

    let filters = [];
    if (currentSubmenu && currentSubmenu.subsubmenus) {
      filters = currentSubmenu.subsubmenus;
    }

    return html`
      <ha-card>
        <div class="crt-overlay"></div>
        
        <div class="re-header">
          <div class="re-title">☣ UMBRELLA CORP. INTERNET BROWSER</div>
          <div class="ecg-container">
            <span class="status-text">SYSTEM STATUS: ALTERNATIVE</span>
            <svg class="ecg-svg" viewBox="0 0 100 30">
              <path class="ecg-line" d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L53,10 L56,20 L60,15 L100,15"></path>
            </svg>
            <img src="/local/Umbrella_Corporation_logo.svg.png" class="umbrella-img-logo" alt="Umbrella Corp" />
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
                  <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${sub.name.toUpperCase()}</span>
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
              <img src="/local/Umbrella_Corporation_logo.svg.png" class="umbrella-bg-watermark" alt="" />

              <div style="z-index:1; display:contents;">
                ${currentSubmenu && currentSubmenu.mode === 'iframe' ? html`
                  <div class="re-iframe-wrapper">
                    <iframe class="re-iframe" src="${currentSubmenu.iframe_url}"></iframe>
                  </div>
                ` : ''}

                ${currentSubmenu && currentSubmenu.mode === 'design' && currentSubmenu.widgets ? html`
                  <div class="design-grid">
                    ${currentSubmenu.widgets.map(w => this._renderDesignWidget(w))}
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
                        return html`<div class="empty-tab">AUCUNE DONNÉE ENREGISTRÉE POUR CE SECTEUR</div>`;
                      }

                      return sensorsToRender.map(s => {
                        const stateObj = this.hass.states[s.entity];
                        if (!stateObj) {
                          return html`
                            <div class="sensor-card error">
                              <div class="sensor-card-header">
                                <div class="sensor-name">${s.name || s.entity}</div>
                                <ha-icon icon="mdi:alert-circle" class="sensor-icon"></ha-icon>
                              </div>
                              <div class="sensor-value" style="font-size:11px;">ABSENT / HORS LIGNE</div>
                            </div>
                          `;
                        }

                        const valStr = stateObj.state;
                        const unit = s.unit !== undefined ? s.unit : (stateObj.attributes.unit_of_measurement || '');
                        const icon = s.icon || this._getGridIcon(s.entity);
                        const isSwitch = s.entity.split('_')[0] === 'switch' || s.entity.split('.')[0] === 'light' || s.is_switch;
                        
                        let effectClass = 'effect-neutral';
                        let stateActive = false;

                        if (s.entity.split('.')[0] === 'light') {
                          effectClass = 'effect-light';
                          stateActive = (valStr === 'on');
                        } else if (isSwitch) {
                          effectClass = 'effect-switch';
                          stateActive = (valStr === 'on' || valStr === 'true');
                        } else if (s.entity.split('.')[0] === 'binary_sensor') {
                          effectClass = 'effect-binary';
                          stateActive = (valStr === 'on' || valStr === 'true');
                        }

                        let battVal = null;
                        if (s.battery_entity && this.hass.states[s.battery_entity]) {
                          battVal = parseInt(this.hass.states[s.battery_entity].state);
                        } else if (stateObj.attributes.battery_level) {
                          battVal = parseInt(stateObj.attributes.battery_level);
                        }

                        let typeClass = s.type === 'server' ? 'type-server' : '';

                        return html`
                          <div class="sensor-card ${effectClass} ${stateActive ? 'state-active' : ''} ${typeClass}"
                               @click="${() => this._handleAction(s.entity, isSwitch, stateActive)}">
                            <div class="sensor-card-header">
                              <div class="sensor-name">${(s.name || stateObj.attributes.friendly_name || s.entity).toUpperCase()}</div>
                              <ha-icon icon="${icon}" class="sensor-icon"></ha-icon>
                            </div>
                            <div class="sensor-value">
                              ${s.type === 'server' ? (valStr === 'on' || valStr === 'up' ? 'RUNNING' : 'STOPPED') : valStr}
                              ${unit ? html`<span class="unit">${unit}</span>` : ''}
                            </div>
                            ${s.type === 'server' && s.label ? html`<div class="server-label">${s.label}</div>` : ''}
                            ${battVal !== null ? html`
                              <div class="card-battery-indicator">
                                <ha-icon icon="mdi:battery"></ha-icon>
                                <span class="${battVal > 50 ? 'batt-high' : (battVal > 20 ? 'batt-medium' : 'batt-low')}">${battVal}%</span>
                              </div>
                            ` : ''}
                          </div>
                        `;
                      });
                    })()}
                  </div>
                ` : ''}
              </div>
            </div>

          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('resident-evil-card', ResidentEvilCard);
