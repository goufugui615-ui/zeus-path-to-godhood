# -*- coding: utf-8 -*-
"""生成「一键部署统计后端」页面 deploy.html
把 tools/cloudflare-worker.js 的源码内联进页面，用户双击 deploy.html 后：
填 API Token → 点一下 → 自动创建 KV 命名空间 + 上传 Worker → 拿到域名 → 下载配好的 stats.js

用法：python tools/build_deploy_page.py
"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKER = os.path.join(ROOT, "tools", "cloudflare-worker.js")
OUT = os.path.join(ROOT, "deploy.html")

src = io.open(WORKER, encoding="utf-8").read()
# 防止源码里出现 </script> 破坏 HTML
src = src.replace("</script>", "<\\/script>")

HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>宙斯成神之路 · 一键部署统计后端</title>
<style>
  :root{ --ink:#2b2b33; --paper:#f4ecd8; --gold:#b8860b; --green:#4a6b3a; --red:#a63a2b; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  body{ background:#e8d9b8; color:var(--ink);
    font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif; padding:24px; line-height:1.7; }
  .wrap{ max-width:820px; margin:0 auto; }
  h1{ font-size:23px; letter-spacing:1px; margin-bottom:4px; }
  .sub{ color:#7a6a45; font-size:13px; margin-bottom:18px; }
  .card{ background:var(--paper); border:2px solid var(--ink); border-radius:14px;
    padding:16px 18px; margin-bottom:14px; box-shadow:3px 3px 0 rgba(43,43,51,.13); }
  label{ font-size:13.5px; display:block; margin:8px 0 4px; }
  input{ width:100%; padding:9px 12px; border:2px solid var(--ink); border-radius:8px;
    background:#fffaf0; font-family:inherit; font-size:14px; color:var(--ink); }
  button{ padding:9px 18px; border:2px solid var(--ink); border-radius:8px; background:var(--gold);
    color:#fff; font-family:inherit; font-size:14px; cursor:pointer; font-weight:bold; margin-top:10px; }
  button.ghost{ background:#f8f0dc; color:var(--ink); }
  button:disabled{ opacity:.45; cursor:not-allowed; }
  button:hover:not(:disabled){ filter:brightness(1.08); }
  .row{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  code{ background:#efe3c5; padding:1px 6px; border-radius:4px; font-size:12.5px; word-break:break-all; }
  a{ color:#8a5a1a; }
  #log{ background:#fffaf0; border:2px dashed #b8a57a; border-radius:10px; padding:12px;
    font-size:13px; white-space:pre-wrap; max-height:320px; overflow:auto; min-height:80px; }
  .ok{ color:var(--green); font-weight:bold; }
  .err{ color:var(--red); font-weight:bold; }
  .step{ color:#7a6a45; }
  .hint{ font-size:12.8px; color:#7a6a45; }
  .result{ background:#eef6e8; border:2px solid var(--green); border-radius:10px; padding:14px; margin-top:12px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>⚡ 一键部署统计后端</h1>
  <div class="sub">给你的游戏接上「有多少人玩 + 生了多少后代」的数据后台。Token 只存在你本机浏览器，不会上传到任何第三方。</div>

  <div class="card">
    <h3 style="font-size:15px">第 1 步：拿一个 Cloudflare API Token（免费账号即可）</h3>
    <div class="hint">
      1. 打开 <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">dash.cloudflare.com/profile/api-tokens</a><br>
      2. 点「创建令牌」→ 用模板 <b>编辑 Cloudflare Workers（Edit Cloudflare Workers）</b> → 继续 → 创建令牌<br>
      3. 复制那串令牌，粘到下面。（看不到模板就选「创建自定义令牌」，权限加：<code>账户 - Workers 脚本 - 编辑</code>）
    </div>
    <label>API Token</label>
    <input id="token" type="password" placeholder="粘贴你的 Cloudflare API Token">
    <div class="row">
      <button onclick="saveToken()">保存令牌</button>
      <button class="ghost" onclick="loadAccounts()">① 读取账号</button>
      <button onclick="deploy()" id="btnDeploy" disabled>② 一键部署</button>
    </div>
    <div class="hint" id="acct"></div>
  </div>

  <div class="card">
    <h3 style="font-size:15px">部署日志</h3>
    <div id="log">等待操作…</div>
    <div id="result"></div>
  </div>

  <div class="card">
    <h3 style="font-size:15px">不想用一键部署？</h3>
    <div class="hint">
      也可以手动：Cloudflare 控制台 → Workers 和 Pages → 创建 Worker → 把
      <code>tools/cloudflare-worker.js</code> 粘贴进去 → 设置里绑 KV（变量名 <code>ZEUS</code>）。
      <button class="ghost" onclick="downloadWorker()">下载 worker.js</button>
    </div>
  </div>
</div>

<script id="worker-src" type="text/plain">
__WORKER_SRC__
</script>
<script>
const $ = id => document.getElementById(id);
let ACCOUNT = null, TOKEN = '';
const API = 'https://api.cloudflare.com/client/v4';
const SCRIPT = 'zeus-stats';

function log(msg, cls){
  const el = $('log');
  el.innerHTML += '\\n' + (cls ? '<span class="'+cls+'">'+msg+'</span>' : '<span class="step">'+msg+'</span>');
  el.scrollTop = el.scrollHeight;
}
function saveToken(){
  TOKEN = $('token').value.trim();
  if (!TOKEN){ log('令牌不能为空', 'err'); return; }
  localStorage.setItem('cf_token', TOKEN);
  log('令牌已保存到本机浏览器 ✓', 'ok');
  $('btnDeploy').disabled = false;
}
function restore(){
  const t = localStorage.getItem('cf_token');
  if (t){ $('token').value = t; TOKEN = t; $('btnDeploy').disabled = false; }
}
async function api(method, path, body, isForm){
  const headers = { 'Authorization': 'Bearer ' + TOKEN };
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const r = await fetch(API + path, {
    method, headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });
  const j = await r.json();
  if (!j.success) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || 'API 调用失败');
  return j.result;
}

async function loadAccounts(){
  TOKEN = $('token').value.trim();
  if (!TOKEN){ log('先填令牌', 'err'); return; }
  try{
    const list = await api('GET', '/accounts?per_page=50');
    if (!list.length){ log('没找到账号', 'err'); return; }
    ACCOUNT = list[0];
    $('acct').innerHTML = '账号：<b>' + ACCOUNT.name + '</b>（ID ' + ACCOUNT.id + '）' + (list.length>1 ? '　共 '+list.length+' 个账号，默认用第一个' : '');
    log('读取账号成功：' + ACCOUNT.name, 'ok');
    $('btnDeploy').disabled = false;
  }catch(e){ log('读取失败：' + e.message, 'err'); }
}

async function deploy(){
  if (!TOKEN) TOKEN = $('token').value.trim();
  if (!ACCOUNT){ await loadAccounts(); if (!ACCOUNT) return; }
  const acc = ACCOUNT.id;
  try{
    log('① 创建 KV 命名空间…');
    let ns;
    try{
      ns = await api('POST', '/accounts/' + acc + '/storage/kv/namespaces', { name: 'zeus-stats-kv' });
      log('   KV 已创建：' + ns.id, 'ok');
    }catch(e){
      log('   创建失败（可能已存在），改用已有的…');
      const all = await api('GET', '/accounts/' + acc + '/storage/kv/namespaces?per_page=100');
      ns = all.find(x => x.title === 'zeus-stats-kv') || all[0];
      if (!ns) throw new Error('没有可用的 KV 命名空间');
      log('   使用已有 KV：' + ns.id + '（' + ns.title + '）', 'ok');
    }

    log('② 上传 Worker 代码…');
    const src = document.getElementById('worker-src').textContent;
    const meta = {
      main_module: 'worker.js',
      bindings: [{ type: 'kv_namespace', name: 'ZEUS', namespace_id: ns.id }],
      compatibility_date: '2024-01-01'
    };
    const fd = new FormData();
    fd.append('metadata', new Blob([JSON.stringify(meta)], {type:'application/json'}));
    fd.append('worker.js', new Blob([src], {type:'application/javascript'}));
    await api('PUT', '/accounts/' + acc + '/workers/scripts/' + SCRIPT, fd, true);
    log('   Worker 已上传 ✓', 'ok');

    log('③ 开启 workers.dev 访问…');
    let sub = null;
    try{
      const s = await api('GET', '/accounts/' + acc + '/workers/subdomain');
      sub = s.subdomain;
      log('   子域：' + sub, 'ok');
    }catch(e){
      try{
        const s = await api('POST', '/accounts/' + acc + '/workers/subdomain', { name: 'zeus' + Math.random().toString(36).slice(2,6) });
        sub = s.subdomain;
        log('   子域已创建：' + sub, 'ok');
      }catch(e2){ log('   读取子域失败：' + e2.message, 'err'); }
    }

    const url = sub ? ('https://' + SCRIPT + '.' + sub + '.workers.dev') : null;
    if (url){
      $('result').innerHTML = '<div class="result"><b>🎉 部署完成！</b><br><br>' +
        '后端地址：<code id="epurl">' + url + '</code> ' +
        '<button class="ghost" onclick="copyUrl()">复制</button><br><br>' +
        '<button onclick="downloadStats()">下载配好的 stats.js</button>' +
        '<div class="hint" style="margin-top:10px">把下载的 <code>stats.js</code> 覆盖 <code>js/stats.js</code>，' +
        '再推到 GitHub；然后双击 <code>stats.html</code>，地址填上面这个，就能看数据了。</div></div>';
      log('④ 完成：' + url, 'ok');
    }else{
      log('④ 部署完成，但没拿到 workers.dev 域名，去控制台看 Worker 的访问地址', 'err');
    }
  }catch(e){
    log('部署失败：' + e.message, 'err');
  }
}

function copyUrl(){
  const t = $('epurl').textContent;
  navigator.clipboard.writeText(t);
  log('已复制：' + t, 'ok');
}
function downloadStats(){
  const url = $('epurl').textContent;
  const src = document.getElementById('worker-src').textContent;
  const content = STATS_TEMPLATE.replace('__ENDPOINT__', url);
  dl('stats.js', content);
  log('stats.js 已下载（endpoint 已填好）', 'ok');
}
function downloadWorker(){
  const src = document.getElementById('worker-src').textContent;
  dl('cloudflare-worker.js', src);
}
function dl(name, text){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type:'text/javascript'}));
  a.download = name; a.click();
}

/* 生成的 stats.js 模板（endpoint 已替换） */
const STATS_TEMPLATE = `/* ============================================================
 * 宙斯成神之路 · 数据统计埋点
 * 本文件由 deploy.html 自动生成，endpoint 已填好
 * ============================================================ */
(function(){
'use strict';
var Z = (window.Z = window.Z || {});

var CFG = {
  mode: 'api',
  endpoint: '__ENDPOINT__',
};

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
    try{ if (window.LA && window.LA.track) window.LA.track(type, extra || {}); }catch(e){}
    return;
  }
  if (CFG.mode === 'api' && CFG.endpoint){
    try{
      fetch(CFG.endpoint.replace(/\\/$/, '') + '/hit', {
        method: 'POST', mode: 'cors', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(){}, function(){});
    }catch(e){}
  }
}

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
  visit: function(){ post('visit', { uv: oncePerDay('visit') ? 1 : 0 }); },
  start: function(){ post('start', { uv: oncePerDay('start') ? 1 : 0 }); },
  court: function(quality){ post('court', { q: quality == null ? -1 : quality }); },
  birth: function(quality){ post('birth', { q: quality == null ? -1 : quality }); },
  win: function(){ post('win', {}); },
  cow: function(){ post('cow', {}); }
};
})();
`;

restore();
</script>
</body>
</html>
"""

HTML = HTML.replace("__WORKER_SRC__", src)
io.open(OUT, "w", encoding="utf-8").write(HTML)
print("生成:", OUT, "大小", len(HTML), "字节")
