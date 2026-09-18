/* ============================================================
 * 宙斯成神之路 · 主循环：输入 / 相机 / 渲染 / 调试 / 自测
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});
const $ = id => document.getElementById(id);
const cvs = $('game'), ctx = cvs.getContext('2d');
const W = 960, H = 600;

/* ---------- 游戏状态 ---------- */
Z.newState = function(){
  Z.state = {
    t:0, power:100, anger:0, rate:0, won:false, _oid:1,
    offspring:[], pregnancies:[],
    upgrades:{ charm:0, might:0, nursery:0, siphon:0, appease:0, deter:0 },
    stats:{ births:0, cows:0, eventsGood:0, eventsBad:0, courted:0, gifts:0 },
    flags:{ athena:0, aphrodite:0 },
    tempMods:[], unlocked:['village'], log:[],
    hera:{ visits:0, tolerated:0, warnAt:0, nextT:0 },
    peacock:null, goldApple:null, nextEventT:0
  };
};

/* ---------- URL 参数 ---------- */
const params = new URLSearchParams(location.search);
const SPEED = Math.max(1, parseFloat(params.get('speed'))||1);
const SELFTEST = params.has('selftest');
const DEBUG = params.get('debug');
window.addEventListener('error', e=>{
  try{ document.title = 'ERR: ' + (e.message||'unknown') + ' @' + (e.lineno||'?'); }catch(_){}
  console.error(e);
});

/* ---------- 世界初始化 ---------- */
for (const zone of Z.ZONES){
  Z.spawnCreatures(zone);
  Z.getDecors(zone);
}
Z.newState();

/* ---------- 输入 ---------- */
const input = { left:false, right:false, up:false, down:false };
Z.input = input;
const KEYMAP = { ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right',
  ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down' };
window.addEventListener('keydown', e=>{
  if (e.key==='Escape'){
    const m = document.querySelector('.modal-mask');
    if (m) m.remove();
    $('hera-overlay').classList.remove('on');
    return;
  }
  if (!Z.running) return;
  const k = KEYMAP[e.key];
  if (k){ input[k]=true; e.preventDefault(); return; }
  if (e.key==='e'||e.key==='E'){
    const zone = Z.zoneById(Z.zeus.zone);
    let best=null, bd=56;
    for (const c of zone.creatures){
      const d = Math.hypot(c.x-Z.zeus.x, c.y-Z.zeus.y);
      if (d<bd && Z.canCourt(c).ok){ bd=d; best=c; }
    }
    if (best){ if (!Z.ui.modalOpen()) Z.ui.courtship(best); }
  }
  else if (e.key==='q'||e.key==='Q'){ if (!Z.ui.modalOpen()) Z.ui.showMap(); }
  else if (e.key==='h'||e.key==='H'){ if (!Z.ui.modalOpen()) Z.ui.showHelp(); }
  else if (e.key==='m'||e.key==='M'){ Z.audio.toggle(); }
});
window.addEventListener('keyup', e=>{ const k=KEYMAP[e.key]; if (k) input[k]=false; });

cvs.addEventListener('click', e=>{
  if (!Z.running) return;
  const rect = cvs.getBoundingClientRect();
  const sx = (e.clientX-rect.left)/rect.width*W, sy = (e.clientY-rect.top)/rect.height*H;
  const wx = cam.x + sx, wy = cam.y + sy;
  /* 金苹果 */
  const ga = Z.state.goldApple;
  if (ga && ga.zone===Z.zeus.zone && Math.hypot(ga.x-wx, ga.y-wy) < 34){
    const gain = Math.round(Math.max(30, Z.state.power*0.08));
    Z.addPower(gain);
    Z.state.goldApple = null;
    Z.audio.bigCoin();
    Z.ui.toast('🍎 拾取金苹果！+'+gain+' 神力','good');
    Z.log('宙斯拾取金苹果，+'+gain+' 神力。','good');
    return;
  }
  Z.zeus.tx = wx; Z.zeus.ty = wy;
  Z.audio.click();
});

/* ---------- 按钮 ---------- */
$('btn-roster').onclick = ()=>{ Z.audio.click(); Z.ui.showRoster(); };
$('btn-temple').onclick = ()=>{ Z.audio.click(); Z.ui.showTemple(); };
$('btn-map').onclick = ()=>{ Z.audio.click(); Z.ui.showMap(); };
$('btn-log').onclick = ()=>{ Z.audio.click(); Z.ui.showLog(); };
$('btn-help').onclick = ()=>{ Z.audio.click(); Z.ui.showHelp(); };
$('btn-save').onclick = ()=>{ Z.audio.click(); Z.ui.showSave(); };
$('btn-sound').onclick = ()=>{ Z.audio.toggle(); };
$('hera-panel').onclick = ()=>{ if (Z.running && !Z.ui.modalOpen()) Z.ui.giftDialog(); };
$('win-continue').onclick = ()=>{ Z.audio.click(); $('win-overlay').classList.remove('on'); };

/* ---------- 相机 ---------- */
const cam = { x:0, y:0 };
function updateCam(){
  const zone = Z.zoneById(Z.zeus.zone);
  cam.x = Z.zeus.x - W/2; cam.y = Z.zeus.y - H/2;
  cam.x = Math.max(0, Math.min(zone.size[0]-W, cam.x));
  cam.y = Math.max(0, Math.min(zone.size[1]-H, cam.y));
}

/* ---------- 渲染 ---------- */
function drawDecorItem(d, t){
  ctx.save();
  ctx.translate(d.x-cam.x, d.y-cam.y);
  const sc = depthScale(d.y);
  ctx.scale(sc, sc);
  Z.draw.decor(ctx, d.key, t, d);
  ctx.restore();
}
function depthScale(y){
  const zone = Z.zoneById(Z.zeus.zone);
  return 0.92 + 0.26 * (y / zone.size[1]);
}
function drawEntity(x, y, fn){
  ctx.save();
  ctx.translate(x-cam.x, y-cam.y);
  const sc = depthScale(y);
  ctx.scale(sc, sc);
  fn();
  ctx.restore();
}
let hudTimer = 0, renderT = 0;
function render(dt){
  const st = Z.state;
  renderT += dt;
  const t = renderT;
  const zone = Z.zoneById(Z.zeus.zone);
  const P = Z.draw.primitives;
  ctx.clearRect(0,0,W,H);
  /* 地面 */
  const g = Z.getGround(zone);
  ctx.drawImage(g, cam.x, cam.y, W, H, 0, 0, W, H);
  /* 云影（2.5D 氛围层） */
  ctx.save();
  for (let i=0;i<3;i++){
    const cx = ((t*8 + i*430) % (zone.size[0]+400)) - 200 - cam.x*0.7;
    const cy = (140 + i*190) - cam.y*0.7;
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = zone.ink;
    ctx.beginPath(); ctx.ellipse(cx, cy, 130, 42, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+80, cy+16, 90, 30, 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
  /* 收集渲染队列（按 y 排序） */
  const queue = [];
  for (const d of Z.getDecors(zone)) queue.push({ y:d.y, fn:()=>drawDecorItem(d,t) });
  for (const a of zone.ambients) queue.push({ y:a.y, fn:()=>drawEntity(a.x, a.y, ()=>Z.draw.species(ctx, a.key, t, a)) });
  const nearest = Z.nearestCourtship();
  for (const c of zone.creatures){
    const isNear = nearest && nearest.id===c.id;
    queue.push({ y:c.y, fn:()=>drawEntity(c.x, c.y, ()=>{
      if (isNear){
        ctx.save(); P.S(ctx, '#b8860b', 2, 0.8);
        ctx.setLineDash([5,5]); ctx.beginPath(); ctx.ellipse(0, 4, 26, 10, 0, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
      Z.draw.species(ctx, c.key, t, {
        seed:c.seed, moving:c.moving, love: c.loveUntil>st.t,
        rest: c.restUntil>st.t && c.pregnantUntil<=st.t, pregnant: c.pregnantUntil>st.t
      });
    })});
  }
  for (const off of st.offspring){
    if (off.zone!==zone.id || off.departed) continue;
    queue.push({ y:off.y, fn:()=>drawEntity(off.x, off.y, ()=>{
      Z.draw.offspring(ctx, t, { stage:Z.offspringStage(off), quality:off.quality, trait:off.key, seed:off.seed, moving:off.moving, cow:off.cow });
    })});
  }
  /* 金苹果 */
  if (st.goldApple && st.goldApple.zone===zone.id){
    const ga = st.goldApple;
    queue.push({ y:ga.y, fn:()=>drawEntity(ga.x, ga.y, ()=>{
      const bob = Math.sin(t*3)*4;
      ctx.save(); ctx.translate(0,bob);
      P.S(ctx, '#b8860b', 2.2); P.C(ctx, 0, -14, 10, '#ffd94a', 0.4);
      P.S(ctx, '#4a6b3a', 1.8); P.leaf(ctx, 3, -26, 4);
      P.S(ctx, '#ffd94a', 1.4); P.drawSpark(ctx, -12, -22, t); P.drawSpark(ctx, 12, -20, t+1);
      ctx.restore();
    })});
  }
  /* 孔雀先兆 */
  if (st.peacock){
    queue.push({ y:st.peacock.y, fn:()=>drawEntity(st.peacock.x, st.peacock.y, ()=>{
      Z.draw.species(ctx, 'peacock', t, { alert:true });
      ctx.save(); P.S(ctx, '#a63a2b', 2.4, 0.7+Math.sin(t*6)*0.3);
      ctx.font = 'bold 22px KaiTi'; ctx.fillStyle = '#a63a2b';
      ctx.fillText('!', 26, -60); ctx.restore();
    })});
  }
  /* 宙斯（总是最后但参与排序） */
  queue.push({ y:Z.zeus.y, fn:()=>drawEntity(Z.zeus.x, Z.zeus.y, ()=>{
    Z.draw.zeus(ctx, t, { power:st.power, moving:Z.zeus.moving, happy:!!nearest });
  })});
  /* 老鹰绕飞（屏幕层） */
  queue.sort((a,b)=>a.y-b.y);
  for (const item of queue) item.fn();
  /* 老鹰 */
  const ea = Z.eagle.ang;
  drawEntity(Z.zeus.x + Math.cos(ea)*55, Z.zeus.y - 40 + Math.sin(ea)*22 + Math.sin(t*3)*4,
    ()=>{ ctx.save(); ctx.globalAlpha=0.9; Z.draw.species(ctx, 'eagle', t, {}); ctx.restore(); });
  /* 顶层白云 */
  ctx.save();
  for (let i=0;i<2;i++){
    const cx = ((t*20 + i*560) % (W+300)) - 150;
    const cy = 60 + i*70;
    ctx.globalAlpha = 0.5;
    P.S(ctx, '#ffffff', 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 16, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx+34, cy+8, 38, 12, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  /* 小地图 */
  drawMinimap(zone);
}
function drawMinimap(zone){
  const P = Z.draw.primitives;
  const mw = 130, mh = Math.round(mw*zone.size[1]/zone.size[0]);
  const mx = W-mw-12, my = H-mh-12;
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = zone.bg;
  ctx.fillRect(mx,my,mw,mh);
  P.S(ctx, Z.draw.INK, 1.6);
  ctx.strokeRect(mx,my,mw,mh);
  const kx = mw/zone.size[0], ky = mh/zone.size[1];
  ctx.fillStyle = '#a8863a';
  for (const c of zone.creatures){ ctx.beginPath(); ctx.arc(mx+c.x*kx, my+c.y*ky, 1.6, 0, Math.PI*2); ctx.fill(); }
  ctx.fillStyle = '#b8860b';
  P.S(ctx, '#b8860b', 1.6);
  P.drawBolt(ctx, mx+Z.zeus.x*kx, my+Z.zeus.y*ky-4, 4);
  /* 视野框 */
  P.S(ctx, Z.draw.INK, 1, 0.5);
  ctx.strokeRect(mx+cam.x*kx, my+cam.y*ky, W*kx, H*ky);
  ctx.restore();
}

/* ---------- 主循环 ---------- */
let last = 0, autoSaveT = 0;
Z.running = false;
function loop(now){
  requestAnimationFrame(loop);
  if (!Z.running) return;
  if (!last) last = now;
  let dt = Math.min(0.1, (now-last)/1000);
  last = now;
  const gdt = dt * SPEED;
  const zone = Z.zoneById(Z.zeus.zone);
  Z.moveZeus(gdt, input);
  Z.updateCreatures(zone, gdt);
  Z.updateOffspring(zone, gdt);
  Z.tick(gdt);
  updateCam();
  render(dt);
  /* HUD 节流 */
  hudTimer += dt;
  if (hudTimer > 0.25){ hudTimer = 0; Z.ui.updateHUD(); Z.ui.updateTip(); }
  /* 自动存档 */
  autoSaveT += dt;
  if (autoSaveT > 10){ autoSaveT = 0; Z.save(true); }
}

/* ---------- 开始游戏 ---------- */
function startGame(fresh){
  Z.audio.click();
  if (fresh){
    try{ localStorage.removeItem('zeus_save_v1'); }catch(e){}
    Z.newState();
  } else {
    Z.newState();
    Z.load();
  }
  const zone = Z.zoneById(Z.zeus.zone);
  if (!Z.zeus.x){ Z.zeus.x = zone.size[0]/2; Z.zeus.y = zone.size[1]/2 + 60; }
  $('menu').classList.add('hide');
  Z.ui.menuAnim(false);
  Z.running = true;
  last = 0;
  if (Z.stats){ Z.stats.visit(); Z.stats.start(); }   /* ← 统计：有人点进来并开局了 */
  Z.log('宙斯降临'+zone.name+'。神力 100，目标 10000，众神之父之路开始了。','good');
  Z.ui.eventBanner('宙斯降临', '神力 100 / 10000 —— 走近心仪的生命，按 E 开始求爱。', true);
  if (DEBUG==='hera'){ Z.state.hera.nextT = Z.state.t+3; Z.state.hera.warnAt = 0;
    for (let i=0;i<5;i++) Z.state.offspring.push({id:'x'+i,name:['阿尔克斯','珀耳拉娅','忒修德斯','达那厄俄','赫柏斯特拉'][i],key:'villager',quality:3,birthT:-1000,zone:'village',x:1100+i*40,y:800+i*20,hx:1100,hy:800,seed:5+i,cow:i===3,curseUntil:0,departed:false,moving:false,target:null}); }
  if (DEBUG==='demo'){
    Z.state.power = 862; Z.state.unlocked.push('forest');
    Z.state.anger = 46;
    const names=['阿尔克斯','珀耳拉娅','忒修德斯','达那厄俄','赫柏斯特拉','克吕泰亚'];
    for (let i=0;i<6;i++) Z.state.offspring.push({id:'d'+i,name:names[i],key:['villager','farmwoman','priestess','villager','nymph','villager'][i],quality:[0,1,2,1,2,3][i],birthT:-400-i*100,zone:'village',x:1080+i*46,y:790+i*24,hx:1080,hy:790,seed:11+i,cow:i===4,curseUntil:0,departed:false,moving:false,target:null});
    Z.state.pregnancies.push({motherId:zone.creatures[1].id,zone:'village',key:'priestess',quality:2,dueT:Z.state.t+38,name:'伊阿宋俄'});
    zone.creatures[1].pregnantUntil = Z.state.t+38;
    zone.creatures[0].loveUntil = Z.state.t+30;
    Z.zeus.x = zone.creatures[0].x+50; Z.zeus.y = zone.creatures[0].y+10;
    Z.state.goldApple = { zone:'village', x: zone.creatures[2].x+70, y: zone.creatures[2].y+40, born:Z.state.t };
  }
  if (DEBUG==='breed'){ const c = zone.creatures[0]; setTimeout(()=>Z.ui.courtship(c), 600); }
  if (DEBUG==='roster') setTimeout(()=>Z.ui.showRoster(), 600);
  if (DEBUG==='temple') setTimeout(()=>Z.ui.showTemple(), 600);
  if (DEBUG==='map') setTimeout(()=>Z.ui.showMap(), 600);
  if (DEBUG==='win'){ Z.state.power = 10001; }
  if (DEBUG==='breedanim'){ const c = zone.creatures[1]; setTimeout(()=>Z.ui.breedAnimation(c, 2), 800); }
}
$('btn-new').onclick = ()=>startGame(true);
$('btn-continue').onclick = ()=>startGame(false);
if (params.get('autostart')==='1') setTimeout(()=>startGame(true), 100);
window.addEventListener('beforeunload', ()=>{ if (Z.running) Z.save(true); });

/* ---------- 缩放适配 ---------- */
function fitViewport(){
  const s = Math.min(window.innerWidth/W, window.innerHeight/H);
  $('viewport').style.transform = 'scale('+s+')';
}
window.addEventListener('resize', fitViewport);
fitViewport();

/* ---------- 静音记忆 ---------- */
try{ if (localStorage.getItem('zeus_muted')==='1') Z.audio.setMuted(true); }catch(e){}
const _origToggle = Z.audio.toggle.bind(Z.audio);
Z.audio.toggle = function(){ _origToggle(); try{ localStorage.setItem('zeus_muted', Z.audio.muted?'1':'0'); }catch(e){} };

/* ---------- 菜单 ---------- */
if (Z.hasSave()) $('btn-continue').style.display = '';
Z.ui.menuAnim(true);
requestAnimationFrame(loop);

/* ============================================================
 * 自测模式：?selftest=1
 * ============================================================ */
if (SELFTEST){
  (function(){
    const out = [];
    let pass = 0, fail = 0;
    function T(name, fn){
      try{
        const r = fn();
        if (r === false) throw new Error('返回 false');
        out.push('✓ ' + name); pass++;
      }catch(e){
        out.push('✗ ' + name + ' —— ' + (e && e.message ? e.message : e)); fail++;
      }
    }
    /* UI 桩，避免弹窗 */
    Z.ui = { toast(){}, eventBanner(){}, onBirth(){}, modalOpen(){ return false; }, win(){},
      heraVisit(){}, updateHUD(){}, updateTip(){}, menuAnim(){}, floatText(){} };

    Z.newState();
    const zone = Z.zoneById('village');

    T('五张地图生物生成', ()=>{
      return Z.ZONES.every(z=>z.creatures.length>0 && z.creatures[0].x>0);
    });
    T('地面预渲染', ()=>{
      const g = Z.getGround(zone);
      return g.width===2200 && g.height===1500;
    });
    T('装饰生成且含传送门', ()=>{
      const d = Z.getDecors(zone);
      return d.length>10 && d.some(x=>x.key==='gate');
    });
    T('求爱成本计算', ()=>{
      Z.state.power = 100000;
      const c = zone.creatures[0];
      const c1 = Z.courtCost(c);
      Z.state.offspring.push({id:'t',name:'t',key:'villager',quality:0,birthT:0,zone:'village',cow:false,curseUntil:0,departed:true});
      const c2 = Z.courtCost(c);
      Z.state.offspring.pop();
      return c1>0 && c2>c1;
    });
    T('求爱→怀孕→分娩→收益 全链路', ()=>{
      Z.newState();
      const zone2 = Z.zoneById('village');
      const c = zone2.creatures[0];
      Z.state.power = 100000;
      const r = Z.conceive(c, 2);
      if (!r || Z.state.pregnancies.length!==1) return false;
      for (let i=0;i<120;i++) Z.tick(1);
      if (Z.state.offspring.length<1) throw new Error('没有分娩');
      const inc = Z.offspringIncome(Z.state.offspring[0]);
      return inc > 0;
    });
    T('品质区间 0-4', ()=>{
      for (let i=0;i<50;i++){
        const q = Z.rollQuality(zone.creatures[1], 3);
        if (q<0 || q>4) return false;
      }
      return true;
    });
    T('临时增益 添加/过期', ()=>{
      Z.addTemp('test','测试',{income:2}, 10);
      if (Math.abs(Z.tempMult('income')-2) > 0.001) return false;
      Z.state.t += 11;
      return Math.abs(Z.tempMult('income')-1) < 0.001;
    });
    T('赫拉惩罚·变牛', ()=>{
      Z.newState();
      Z.state.offspring.push({id:'o1',name:'牛牛预备役',key:'villager',quality:3,birthT:-1000,zone:'village',cow:false,curseUntil:0,departed:false});
      let sawCow=false;
      for (let i=0;i<60;i++){
        const off = Z.state.offspring[0]; off.cow=false; off.quality=3;
        const r = Z.heraPunish(off);
        if (r.type==='cow'){ sawCow = true; if (!off.cow) return false; }
        if (r.type==='downgrade' && off.quality!==2) return false;
      }
      return sawCow;
    });
    T('随机事件池 连发无异常', ()=>{
      Z.newState(); Z.state.power = 5000;
      for (let i=0;i<40;i++) Z.fireEvent();
      return true;
    });
    T('升级成本与上限', ()=>{
      Z.newState();
      const c1 = Z.upgradeCost('charm');
      Z.state.upgrades.charm = 1;
      const c2 = Z.upgradeCost('charm');
      Z.state.upgrades.charm = 5;
      return c2>c1 && Z.state.upgrades.charm >= Z.UPGRADES.charm.max;
    });
    T('里程碑解锁', ()=>{
      Z.newState(); Z.state.power = 500;
      Z.updateMilestones();
      return Z.state.unlocked.includes('forest') && !Z.state.unlocked.includes('volcano');
    });
    T('存档 导出/导入 回环', ()=>{
      Z.newState();
      Z.state.offspring.push({id:'o9',name:'回环测试',key:'mermaid',quality:2,birthT:5,zone:'sea',cow:true,curseUntil:0,departed:false});
      const code = Z.exportSave();
      if (!Z.importSave(code)) return false;
      Z.newState();
      Z.load();
      return Z.state.offspring.length===1 && Z.state.offspring[0].cow===true;
    });
    T('登神判定', ()=>{
      Z.newState(); Z.state.power = 10001;
      Z.tick(0.1);
      return Z.state.won === true;
    });
    T('总收益率计算', ()=>{
      Z.newState();
      Z.state.offspring.push({id:'a',name:'a',key:'villager',quality:4,birthT:-9999,zone:'village',cow:false,curseUntil:0,departed:false});
      const r = Z.totalIncomeRate();
      return r > 0.7 && r < 1.0;
    });

    out.push('');
    out.push('结果：' + pass + ' 通过 / ' + fail + ' 失败');
    const fails = out.filter(l=>l.indexOf('✗')===0);
    const pre = $('selftest-pre');
    pre.textContent = out.join('\n');
    $('selftest').style.display = 'block';
    document.title = (fail===0 ? 'SELFTEST_ALL_PASS' : 'SELFTEST_FAIL: '+fails.join(' ;; ')) + ' · 宙斯成神之路';
    window.__selftestResult = { pass, fail };
  })();
}
})();
