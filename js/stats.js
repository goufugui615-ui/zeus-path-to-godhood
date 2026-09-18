/* ============================================================
 * 宙斯成神之路 · 数据统计埋点（默认关闭）
 *
 * 【要统计什么】
 *   1. 多少人点进链接   → visit（PV 每次打开 / UV 每日去重）
 *   2. 繁衍了多少后代   → birth（携带子嗣品质 q0~q4）
 *   3. 开局次数 / 求爱次数 / 登神人数 / 被赫拉变成牛的次数
 *
 * 【两种模式】
 *   mode = 'api'  → 上报到自建后端（Cloudflare Worker，见 tools/cloudflare-worker.js）
 *                   配好后端后，双击 stats.html 就能看仪表盘
 *   mode = 'la'   → 上报到 51.LA 自定义事件（零部署，去 51.LA 后台看）
 *   mode = 'off'  → 什么都不做（默认）
 *
 * 【注意】
 *   本地 file:// 打开也会尝试上报；不想统计就保持 mode = 'off'。
 *   所有上报失败都静默处理，绝不影响游戏运行。
 * ============================================================ */
(function(){
'use strict';
var Z = (window.Z = window.Z || {});

/* ======================= 配置区：改这里 ======================= */
var CFG = {
  mode: 'off',        // 'off' | 'api' | 'la'
  endpoint: '',       // 例：'https://zeus-stats.yourname.workers.dev'（mode='api' 时必填）
};
/* ============================================================ */

var vid = null;
try{
  vid = localStorage.getItem('zeus_vid');
  if (!vid){ vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('zeus_vid', vid); }
}catch(e){ vid = 'v' + Math.random().toString(36).slice(2); }

function post(type, extra){
  if (CFG.mode === 'off') return;
  var payload = { type: type, vid: vid, t: Date.now() };
  if (extra) for (var k in extra) payload[k] = extra[k];

  if (CFG.mode === 'la'){
    /* 51.LA 自定义事件 */
    try{ if (window.LA && window.LA.track) window.LA.track(type, extra || {}); }catch(e){}
    return;
  }
  if (CFG.mode === 'api' && CFG.endpoint){
    try{
      fetch(CFG.endpoint.replace(/\/$/, '') + '/hit', {
        method: 'POST',
        mode: 'cors',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(){}, function(){});
    }catch(e){}
  }
}

/* 每日 UV 去重（前端层面，后端还会按 IP 再判一次） */
function oncePerDay(key){
  var dayKey = 'zeus_day_' + new Date().toISOString().slice(0, 10) + '_' + key;
  try{
    if (localStorage.getItem(dayKey)) return false;
    localStorage.setItem(dayKey, '1');
    return true;
  }catch(e){ return true; }
}

Z.stats = {
  cfg: CFG,
  /** 页面打开：记一次访问（PV 每次 +1；UV 每天每人只算 1 次） */
  visit: function(){
    post('visit', { uv: oncePerDay('visit') ? 1 : 0 });
  },
  /** 点「开始成神之路」：记一次开局 */
  start: function(){
    post('start', { uv: oncePerDay('start') ? 1 : 0 });
  },
  /** 求爱成功 */
  court: function(quality){
    post('court', { q: quality == null ? -1 : quality });
  },
  /** 子嗣诞生：核心指标——后代数量 */
  birth: function(quality){
    post('birth', { q: quality == null ? -1 : quality });
  },
  /** 登神（10000 神力） */
  win: function(){
    post('win', {});
  },
  /** 被赫拉变成牛 */
  cow: function(){
    post('cow', {});
  }
};
})();
