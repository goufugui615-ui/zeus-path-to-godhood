/* ============================================================
 * 宙斯成神之路 · 实体系统：宙斯、生物AI、求爱、孕育、子嗣
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});

/* ---------- 品质档位 ---------- */
Z.QUALITY = [
  { name:'凡人血统',   rate:0.02, color:'#7a6a45' },
  { name:'半神血统',   rate:0.05, color:'#4a6b3a' },
  { name:'英雄血统',   rate:0.12, color:'#2f5d8a' },
  { name:'神裔',       rate:0.30, color:'#b8860b' },
  { name:'传奇神裔',   rate:0.75, color:'#a63a2b' }
];

/* ---------- 子嗣命名 ---------- */
const NAMES = {
  village:  { pre:['赫拉克','珀尔修','忒修','阿喀琉','伊阿宋','卡德摩','珀罗普','达那厄','阿尔克','赫柏'],
              suf:['斯','忒斯','德斯','俄斯','尼俄','拉娅','斯特拉'] },
  forest:   { pre:['阿塔兰','美狄亚','塞墨勒','俄里翁','许铿','纳西','克吕泰','菲德拉'],
              suf:['忒斯','亚','俄斯','特拉','涅','达'] },
  sea:      { pre:['忒提斯','伽拉忒','安菲特','忒勒斯','涅柔','多里斯','库忒拉'],
              suf:['亚','忒斯','里忒','俄斯'] },
  volcano:  { pre:['柏勒洛','俄托斯','厄庇阿尔','帕尔忒','塔罗斯','布里阿','克萨托'],
              suf:['丰','忒斯','俄斯','里俄'] },
  underworld:{ pre:['梅加埃','提西福','阿勒克','厄里倪','斯堤克斯','勒忒','科库托'],
              suf:['拉','忒斯','俄斯','斯'] }
};
let nameSeq = 0;
Z.genName = function(zoneId){
  const pool = NAMES[zoneId] || NAMES.village;
  const pre = pool.pre[Math.floor(Math.random()*pool.pre.length)];
  const suf = pool.suf[Math.floor(Math.random()*pool.suf.length)];
  nameSeq++;
  return pre + suf + (nameSeq % 7 === 0 ? '·二世' : '');
};

/* ---------- 宙斯 ---------- */
Z.zeus = { x:0, y:0, tx:null, ty:null, moving:false, facing:1, zone:'village', step:170 };
Z.eagle = { ang: 0 };

/* ---------- 生物 AI ---------- */
function wander(c, dt, speed, radius){
  if (c.target){
    const dx = c.target[0]-c.x, dy = c.target[1]-c.y, d = Math.hypot(dx,dy);
    if (d < 4){ c.target = null; c.moving = false; }
    else { c.x += dx/d*speed*dt; c.y += dy/d*speed*dt; c.moving = true; }
  } else {
    c.moving = false;
    if (Math.random() < dt*0.14){
      const a = Math.random()*Math.PI*2, r = Math.random()*radius;
      const nx = c.hx + Math.cos(a)*r, ny = c.hy + Math.sin(a)*r*0.7;
      const zone = Z.zoneById(c.zone);
      if (nx>60 && nx<zone.size[0]-60 && ny>60 && ny<zone.size[1]-60) c.target = [nx, ny];
    }
  }
}
Z.updateCreatures = function(zone, dt){
  for (const c of zone.creatures) wander(c, dt, 26, 70);
  for (const a of zone.ambients) wander(a, dt, a.key==='dolphin'?42:20, 90);
};

/* ---------- 求爱计算 ---------- */
/* 求爱基础成本：随子嗣数缓慢递增（0.06/个，原为 0.10） */
Z.courtCost = function(cr){
  const zone = Z.zoneById(cr.zone);
  const n = Z.state.offspring.length;
  let cost = zone.cost * (1 + 0.06*n);
  cost *= (1 - 0.06*Z.state.upgrades.charm);
  cost *= Z.tempMult('courtCost');
  if (Z.state.flags.aphrodite > 0) cost = 0;
  return Math.max(1, Math.round(cost));
};
/* 神力注入：0.28×基础/档（原为 0.6），起步门槛大幅降低 */
Z.injectCost = function(cr, lv){
  const zone = Z.zoneById(cr.zone);
  let base = zone.cost * 0.28 * lv;
  base *= (1 - 0.06*Z.state.upgrades.charm);
  base *= Z.tempMult('courtCost');
  return Math.max(0, Math.round(base));
};
Z.rollQuality = function(cr, injectLv){
  const spec = Z.SPECIES[cr.key];
  let q = spec.baseQ;
  const might = Z.state.upgrades.might;
  for (let i=0;i<injectLv;i++){ if (Math.random() < 0.55 + might*0.08) q++; }
  q -= Math.floor(cr.courtCount/2); /* 同一母亲重复繁殖惩罚 */
  if (Z.state.flags.athena > 0){ q++; Z.state.flags.athena--; }
  if (Math.random() < 0.10) q++;
  if (Math.random() < 0.12) q--;
  return Math.max(0, Math.min(4, Math.round(q)));
};
Z.qualityExpect = function(cr, injectLv){ /* 面板上的期望展示 */
  const spec = Z.SPECIES[cr.key];
  let q = spec.baseQ + 0.55*injectLv + 0.1 - Math.floor(cr.courtCount/2)*1.0;
  if (Z.state.flags.athena>0) q += 1;
  return Math.max(0, Math.min(4, q));
};
Z.canCourt = function(cr, t){
  t = (t==null? Z.state.t : t);
  if (cr.pregnantUntil > t) return { ok:false, why:'孕育中…' };
  if (cr.restUntil > t) return { ok:false, why:'需要休息（'+Math.ceil(cr.restUntil-t)+'秒）' };
  if (cr.cursedUntil > t) return { ok:false, why:'被赫拉诅咒，拒绝宙斯' };
  if (cr.scaredUntil > t) return { ok:false, why:'被吓跑了，正在缓神' };
  return { ok:true };
};

/* ---------- 求爱 → 播种 ---------- */
Z.conceive = function(cr, injectLv){
  const t = Z.state.t;
  const cost = Z.courtCost(cr) + Z.injectCost(cr, injectLv);
  if (Z.state.power < cost) return false;
  if (Z.state.flags.aphrodite > 0){ Z.state.flags.aphrodite--; }
  Z.state.power -= cost;
  const q = Z.rollQuality(cr, injectLv);
  cr.courtCount++;
  cr.loveUntil = t + 30;
  const pregTime = Math.round(60 * (1 - 0.12*Z.state.upgrades.nursery) * Z.tempMult('grow'));
  cr.pregnantUntil = t + pregTime;
  cr.restUntil = t + pregTime + 90 + cr.courtCount*25;
  cr.target = null;
  Z.state.pregnancies.push({
    motherId: cr.id, zone: cr.zone, key: cr.key, quality: q,
    dueT: t + pregTime, name: Z.genName(cr.zone)
  });
  Z.state.stats.courted++;
  return { q, cost, pregTime };
};

/* ---------- 分娩 ---------- */
Z.updatePregnancies = function(){
  const t = Z.state.t;
  for (let i=Z.state.pregnancies.length-1; i>=0; i--){
    const p = Z.state.pregnancies[i];
    if (t >= p.dueT){
      Z.state.pregnancies.splice(i,1);
      const zone = Z.zoneById(p.zone);
      const mother = zone.creatures.find(c=>c.id===p.motherId);
      const mx = mother? mother.x : zone.size[0]/2, my = mother? mother.y : zone.size[1]/2;
      Z.state.offspring.push({
        id: 'off'+(Z.state._oid++), name: p.name, key: p.key, quality: p.quality,
        birthT: t, zone: p.zone, x: mx+30, y: my+16, hx: mx, hy: my,
        seed: Math.floor(Math.random()*1000), cow:false, curseUntil:0, departed:false, moving:false, target:null
      });
      Z.state.stats.births++;
      /* 赫拉怒气 */
      const mythic = ['muse','siren','gorgo','sphinx','phoenix','fury','nyx','shade'].includes(p.key);
      Z.addAnger(mythic? 6 : 2.5);
      if (Z.ui) Z.ui.onBirth(Z.state.offspring[Z.state.offspring.length-1], p.zone);
    }
  }
};

/* ---------- 子嗣 ---------- */
Z.growTime = function(){ return 150 * (1 - 0.12*Z.state.upgrades.nursery) * Z.tempMult('grow'); };
Z.offspringStage = function(off){
  const age = Z.state.t - off.birthT;
  const g = Z.growTime();
  if (age < g*0.4) return 0;      /* 婴儿 */
  if (age < g) return 1;          /* 幼年 */
  return 2;                       /* 成年 */
};
Z.offspringIncome = function(off){
  if (off.departed) return Z.QUALITY[off.quality].rate * 1.0; /* 游历世界：全额 */
  const stageF = [0.2, 0.5, 1][Z.offspringStage(off)];
  let inc = Z.QUALITY[off.quality].rate * stageF;
  inc *= (1 + 0.06*Z.state.upgrades.siphon);
  inc *= Z.tempMult('income');
  if (off.cow) inc *= 0.4;
  if (off.curseUntil > Z.state.t) inc *= 0.5;
  return inc;
};
Z.totalIncomeRate = function(){
  let s = 0;
  for (const off of Z.state.offspring) s += Z.offspringIncome(off);
  return s;
};
Z.updateOffspring = function(zone, dt){
  const t = Z.state.t;
  for (const off of Z.state.offspring){
    if (off.zone !== zone.id || off.departed) continue;
    wander(off, dt, 22, 60);
    /* 成年一段时间后游历世界（给宙斯传扬威名） */
    if (Z.offspringStage(off)===2 && (t-off.birthT) > 480 && Math.random() < dt*0.01){
      off.departed = true;
      if (Z.ui) Z.ui.toast(off.name + ' 长大成人，出发去世界各地传扬宙斯的威名了', 'good');
    }
  }
};

/* ---------- 赫拉怒气 ---------- */
Z.addAnger = function(v){
  v *= (1 - 0.15*Z.state.upgrades.appease);
  Z.state.anger = Math.min(100, Z.state.anger + v);
};

/* ---------- 最近可互动对象 ---------- */
Z.nearestCourtship = function(){
  const zone = Z.zoneById(Z.zeus.zone);
  let best = null, bd = 56;
  for (const c of zone.creatures){
    const d = Math.hypot(c.x-Z.zeus.x, c.y-Z.zeus.y);
    if (d < bd && Z.canCourt(c).ok){ bd = d; best = c; }
  }
  return best;
};

/* ---------- 移动 ---------- */
Z.moveZeus = function(dt, input){
  const zone = Z.zoneById(Z.zeus.zone);
  const sp = Z.zeus.step;
  let dx = 0, dy = 0;
  if (input.left) dx -= 1; if (input.right) dx += 1;
  if (input.up) dy -= 1; if (input.down) dy += 1;
  if (dx || dy){
    Z.zeus.tx = null;
    const len = Math.hypot(dx,dy);
    Z.zeus.x += dx/len*sp*dt; Z.zeus.y += dy/len*sp*dt;
    Z.zeus.moving = true;
    if (dx) Z.zeus.facing = dx>0?1:-1;
  } else if (Z.zeus.tx!=null){
    const ddx = Z.zeus.tx-Z.zeus.x, ddy = Z.zeus.ty-Z.zeus.y, d = Math.hypot(ddx,ddy);
    if (d < 5){ Z.zeus.tx = null; Z.zeus.moving=false; }
    else {
      Z.zeus.x += ddx/d*sp*dt; Z.zeus.y += ddy/d*sp*dt; Z.zeus.moving = true;
      if (ddx) Z.zeus.facing = ddx>0?1:-1;
    }
  } else Z.zeus.moving = false;
  Z.zeus.x = Math.max(40, Math.min(zone.size[0]-40, Z.zeus.x));
  Z.zeus.y = Math.max(50, Math.min(zone.size[1]-30, Z.zeus.y));
  /* 老鹰绕飞 */
  Z.eagle.ang += dt*1.6;
};

/* ---------- 场上出生的子嗣随存档保存/恢复 ---------- */
Z.serializeCreatures = function(){
  const out = {};
  for (const zone of Z.ZONES){
    if (!zone.creatures) continue;
    out[zone.id] = zone.creatures.map(c=>({
      restUntil:c.restUntil, courtCount:c.courtCount, scaredUntil:c.scaredUntil,
      cursedUntil:c.cursedUntil, loveUntil:c.loveUntil, pregnantUntil:c.pregnantUntil
    }));
  }
  return out;
};
Z.restoreCreatures = function(data){
  for (const zone of Z.ZONES){
    if (!zone.creatures || !data[zone.id]) continue;
    zone.creatures.forEach((c,i)=>{
      const d = data[zone.id][i];
      if (!d) return;
      c.restUntil=d.restUntil; c.courtCount=d.courtCount; c.scaredUntil=d.scaredUntil;
      c.cursedUntil=d.cursedUntil; c.loveUntil=d.loveUntil; c.pregnantUntil=d.pregnantUntil;
    });
  }
};
})();
