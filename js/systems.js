/* ============================================================
 * 宙斯成神之路 · 系统层：经济tick / 临时增益 / 赫拉 / 随机事件 / 升级 / 存档
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});
const rnd = (a,b)=> a + Math.random()*(b-a);
const ri  = (a,b)=> Math.floor(rnd(a,b+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------- 临时增益 ---------- */
Z.tempMult = function(type){
  let m = 1;
  for (const mod of Z.state.tempMods){
    if (mod.mults[type] && mod.until > Z.state.t) m *= mod.mults[type];
  }
  return m;
};
Z.addTemp = function(id, label, mults, dur){
  const t = Z.state.t;
  for (const mod of Z.state.tempMods){ if (mod.id===id){ mod.until = t+dur; mod.label=label; return; } }
  Z.state.tempMods.push({ id, label, mults, until: t+dur });
};
Z.activeTemps = function(){
  return Z.state.tempMods.filter(m=>m.until > Z.state.t);
};

/* ---------- 日志 ---------- */
Z.log = function(text, cls){
  const m = Math.floor(Z.state.t/60), s = Math.floor(Z.state.t%60);
  Z.state.log.push({ text, cls: cls||'', time: (m<10?'0':'')+m+':'+(s<10?'0':'')+s });
  if (Z.state.log.length > 90) Z.state.log.shift();
};

/* ---------- 神力变动 ---------- */
Z.addPower = function(v, silent){
  Z.state.power = Math.max(0, Z.state.power + v);
  if (!silent && Z.ui){
    if (v > 0) Z.ui.floatText('+'+Math.round(v)+' 神力', '#4a6b3a');
  }
};

/* ---------- 升级定义 ---------- */
Z.UPGRADES = {
  charm:    { name:'魅力光环', max:5, base:120,  mult:2.2, desc:'求爱成本 -6%/级。宙斯每天用霹雳蜡打理胡子。' },
  might:    { name:'神威',     max:5, base:150,  mult:2.3, desc:'神力注入升档成功率 +8%/级。闪电越亮，基因越强。' },
  nursery:  { name:'云端保育室', max:4, base:200, mult:2.4, desc:'孕育与成长时间 -12%/级。奥林匹斯最高端的月子中心。' },
  siphon:   { name:'神力虹吸', max:5, base:260,  mult:2.5, desc:'全体子嗣收益 +6%/级。血脉就是自来水管。' },
  appease:  { name:'赫拉安抚基金', max:3, base:300, mult:2.6, desc:'赫拉怒气增速 -15%/级。礼物、鲜花、还有免责声明。' },
  deter:    { name:'雷霆威慑', max:3, base:180,  mult:2.2, desc:'负面事件效果 -20%/级。泰坦看到宙斯就装睡。' }
};
Z.upgradeCost = function(key){
  const u = Z.UPGRADES[key];
  return Math.round(u.base * Math.pow(u.mult, Z.state.upgrades[key]));
};

/* ---------- 赫拉系统 ---------- */
Z.heraInterval = function(){
  const anger = Z.state.anger;
  return Math.max(100, 300 - anger*1.8) + rnd(0,60);
};
Z.scheduleHera = function(firstDelay){
  const t = Z.state.t;
  Z.state.hera.warnAt = t + (firstDelay||Z.heraInterval()) - 15;
  Z.state.hera.nextT  = t + (firstDelay||Z.heraInterval());
};
Z.updateHera = function(dt){
  const t = Z.state.t, h = Z.state.hera;
  if (Z.state.offspring.length < 5) return; /* 子嗣太少，赫拉懒得下来 */
  if (!h.nextT) Z.scheduleHera(420);
  /* 孔雀先兆 */
  if (t >= h.warnAt && t < h.nextT && !Z.state.peacock){
    const zone = Z.zoneById(Z.zeus.zone);
    Z.state.peacock = { x: zone.size[0]/2 + (Math.random()>0.5?380:-380), y: zone.size[1]*rnd(0.25,0.75), alert:true };
    Z.audio.peacock();
    if (Z.ui){ Z.ui.toast('一只孔雀出现在附近，冷冷地盯着宙斯……', 'bad'); Z.log('赫拉的孔雀出现在地图上窥视。','bad'); }
  }
  if (t >= h.nextT && Z.ui && !Z.ui.modalOpen()){
    h.visits++;
    Z.state.peacock = null;
    Z.ui.heraVisit();
    Z.scheduleHera();
  }
};
Z.heraPickTarget = function(){
  if (!Z.state.offspring.length) return null;
  const weights = Z.state.offspring.map(o=> Math.pow(o.quality+1, 2) * (o.cow?0.2:1));
  let sum = weights.reduce((a,b)=>a+b, 0);
  let r = Math.random()*sum;
  for (let i=0;i<Z.state.offspring.length;i++){ r -= weights[i]; if (r<=0) return Z.state.offspring[i]; }
  return Z.state.offspring[0];
};
Z.heraProtectCost = function(){
  return Math.round(Math.max(50, Z.state.power*0.08));
};
Z.heraPunish = function(off){
  const t = Z.state.t;
  const roll = Math.random();
  if (roll < 0.5 && !off.cow){
    off.cow = true;
    Z.state.stats.cows++;
    if (Z.stats) Z.stats.cow();   /* ← 统计：赫拉又得手一次 */
    Z.audio.moo();
    return { type:'cow', text: off.name+' 被赫拉变成了一头牛。收益大幅下降，哞。' };
  } else if (roll < 0.8 && off.quality > 0){
    off.quality -= 1;
    Z.audio.angry();
    return { type:'downgrade', text: off.name+' 的血统被赫拉的诅咒削弱，品质下降一档。' };
  } else {
    const zone = Z.zoneById(off.zone);
    const mother = zone.creatures.find(c=>c.id && c.key===off.key) || zone.creatures[0];
    if (mother) mother.cursedUntil = t + 240;
    Z.audio.angry();
    return { type:'curse', text: '赫拉诅咒了'+Z.SPECIES[off.key].name+'们，她们四分钟内拒绝宙斯的任何求爱。' };
  }
};
Z.giveGift = function(){
  const cost = Math.round(Math.max(30, Z.state.power*0.05));
  if (Z.state.power < cost) return false;
  Z.state.power -= cost;
  Z.state.anger = Math.max(0, Z.state.anger - 22);
  Z.state.stats.gifts++;
  Z.log('宙斯给赫拉送了一份价值 '+cost+' 神力的礼物。赫拉哼了一声，收下了。','good');
  return true;
};

/* ---------- 随机事件 ---------- */
Z.EVENTS = [
  { id:'sacrifice', good:true, name:'凡人献祭', w:10,
    text:'村民们抬着烤全羊祭拜宙斯神像，香火缭绕。',
    apply(){ Z.addPower(20 + Z.state.power*0.012); } },
  { id:'hermes', good:true, name:'赫尔墨斯快递', w:9,
    text:'赫尔墨斯送来一封粉丝来信，信封里夹着神力。',
    apply(){ Z.addPower(ri(15,40)); } },
  { id:'museBless', good:true, name:'缪斯加护', w:7,
    text:'九位缪斯为宙斯谱了一首颂歌，子嗣们干劲十足。',
    apply(){ Z.addTemp('muse','缪斯加护：收益+50%',{income:1.5},90); } },
  { id:'goldenapple', good:true, name:'金苹果', w:6,
    text:'一颗金苹果滚到了地图上！传说点它的人有好运。',
    apply(){ const zone=Z.zoneById(Z.zeus.zone);
      Z.state.goldApple = { zone:zone.id, x: Z.zeus.x + rnd(-260,260), y: Z.zeus.y + rnd(-160,160), born:Z.state.t }; } },
  { id:'athena', good:true, name:'雅典娜的忠告', w:6,
    text:'雅典娜：“父亲，下次播种前记得加BUFF。”（下一位置嗣品质+1）',
    apply(){ Z.state.flags.athena++; } },
  { id:'aphrodite', good:true, name:'阿佛洛狄忒的祝福', w:5,
    text:'爱与美之神路过，对宙斯眨了眨眼。（下次求爱免费）',
    apply(){ Z.state.flags.aphrodite++; } },
  { id:'dionysus', good:true, name:'酒神狂欢', w:6,
    text:'狄俄尼索斯开了一场轰趴，气氛到位。（求爱成本-50%，60秒）',
    apply(){ Z.addTemp('wine','酒神狂欢：求爱5折',{courtCost:0.5},60); } },
  { id:'weaving', good:true, name:'纺织女神的线', w:6,
    text:'命运三女神加快了纺线。（孕育与成长速度翻倍，60秒）',
    apply(){ Z.addTemp('weave','命运加速：成长2倍',{grow:0.5},60); } },
  { id:'harvest', good:true, name:'丰收祭典', w:6, minOff:3,
    text:'人间丰收，村庄与森林的母亲们心情大好，全员就绪。',
    apply(){ for (const z of Z.ZONES){ if (!z.creatures) continue;
      if (z.id==='village'||z.id==='forest') z.creatures.forEach(c=>{ c.restUntil=Math.min(c.restUntil,Z.state.t); }); } } },
  { id:'heracles', good:true, name:'赫拉克勒斯认爹', w:4, minQ:2,
    text:'一位英雄级子嗣完成十二伟业，全希腊都在传颂宙斯之名。',
    apply(){ Z.addPower(60 + Z.state.power*0.02); } },
  { id:'olympics', good:true, name:'半神运动会', w:5, minOff:8,
    text:'子嗣们在奥林匹亚举办运动会，观众献上大量祭品。',
    apply(){ Z.addPower(Z.state.offspring.length*8); } },
  { id:'templeBuilt', good:true, name:'凡人建庙', w:5, minOff:6,
    text:'凡人为宙斯修建了一座新神庙，香火旺盛。',
    apply(){ Z.addPower(40 + Z.state.power*0.015); } },
  { id:'ganymede', good:true, name:'伽倪墨得斯上岗', w:4,
    text:'新的斟酒官上岗了，奥林匹斯宴会排面拉满。',
    apply(){ Z.addPower(25); } },
  /* —— 负面 —— */
  { id:'typhon', good:false, name:'堤丰苏醒', w:8,
    text:'万魔之王堤丰翻了个身，子嗣们吓得停止了供能。（30秒）',
    apply(){ const d=1-0.2*Z.state.upgrades.deter;
      if (d<1){ Z.addTemp('typhon','堤丰恐惧：收益暂停',{income:0.02},30*d); }
      else Z.log('雷霆威慑生效，堤丰看了宙斯一眼又睡了回去。','good'); } },
  { id:'titan', good:false, name:'泰坦袭来', w:7, minOff:4,
    text:'一个泰坦挣脱了锁链，向宙斯索要保护费。',
    apply(){ const loss = Z.state.power * (0.05*(1-0.2*Z.state.upgrades.deter));
      Z.addPower(-loss); Z.log('宙斯损失了 '+Math.round(loss)+' 神力击退泰坦。','bad'); } },
  { id:'demeter', good:false, name:'得墨忒耳的怒火', w:5, minOff:5,
    text:'得墨忒耳发现宙斯又惹事了，大地歉收。（收益-40%，45秒）',
    apply(){ Z.addTemp('demeter','大地歉收：收益-40%',{income:0.6},45); } },
  { id:'hades', good:false, name:'哈迪斯的账单', w:5, minPower:800,
    text:'冥王寄来一张账单：“边境地产税，请尽快结清。”',
    apply(){ const bill = Z.state.power*0.03*(1-0.2*Z.state.upgrades.deter);
      Z.addPower(-bill); Z.log('宙斯支付了 '+Math.round(bill)+' 神力的冥界账单。','bad'); } },
  { id:'cyclops', good:false, name:'独眼巨人砸场', w:5, minOff:3,
    text:'一个独眼巨人路过，吓跑了一位母亲。',
    apply(){ const zone = Z.zoneById(Z.zeus.zone);
      const c = pick(zone.creatures); if (c) c.scaredUntil = Z.state.t + 60; } },
  { id:'fire', good:false, name:'森林小火', w:5, minPower:300,
    text:'精灵森林起了小火，扑救花费了一些神力。',
    apply(){ Z.addPower(-(20+Z.state.power*0.01*(1-0.2*Z.state.upgrades.deter))); } },
  { id:'echo', good:false, name:'回声的抱怨', w:4, minOff:4,
    text:'宁芙厄科还在为当年的事生气，到处说宙斯坏话。（求爱成本+30%，60秒）',
    apply(){ Z.addTemp('echo','流言四起：求爱成本+30%',{courtCost:1.3},60); } },
  { id:'sisyphus', good:false, name:'西西福斯的忠告', w:4, minOff:6,
    text:'西西福斯推着石头路过：“坚持下去，就像我一样。”（收益-15%，30秒）',
    apply(){ Z.addTemp('sisy','存在主义疲惫：收益-15%',{income:0.85},30); } },
  /* —— 纯搞笑 —— */
  { id:'photo', good:null, name:'宙斯的老照片', w:5,
    text:'宙斯翻出一张老照片：年轻时没有胡子，谁都没认出来。',
    apply(){} },
  { id:'cowjoke', good:null, name:'牛的目光', w:4, minOff:3,
    text:'地图上的牛看了宙斯一眼。宙斯移开了视线。',
    apply(){} },
  { id:'poseidonFish', good:null, name:'波塞冬的鱼', w:4,
    text:'波塞冬送来一条鱼，附言：“别来海里。”宙斯收下了鱼。',
    apply(){ Z.addPower(10, true); } }
];
Z.fireEvent = function(){
  const st = Z.state;
  const pool = Z.EVENTS.filter(e=>{
    if (e.minOff && st.offspring.length < e.minOff) return false;
    if (e.minPower && st.power < e.minPower) return false;
    if (e.minQ && !st.offspring.some(o=>o.quality>=e.minQ)) return false;
    return true;
  });
  if (!pool.length) return;
  let sum = pool.reduce((a,b)=>a+b.w,0), r = Math.random()*sum, ev = pool[0];
  for (const e of pool){ r -= e.w; if (r<=0){ ev = e; break; } }
  ev.apply();
  if (Z.ui){
    Z.ui.eventBanner(ev.name, ev.text, ev.good);
    if (ev.good===true){ st.stats.eventsGood++; Z.audio.ding(); }
    else if (ev.good===false){ st.stats.eventsBad++; Z.audio.badDing(); }
    else Z.audio.ding();
  }
  Z.log('【'+ev.name+'】'+ev.text, ev.good===true?'good':(ev.good===false?'bad':''));
};

/* ---------- 里程碑 ---------- */
Z.updateMilestones = function(){
  for (const zone of Z.ZONES){
    if (Z.state.power >= zone.unlock && !Z.state.unlocked.includes(zone.id)){
      Z.state.unlocked.push(zone.id);
      if (Z.ui){
        Z.audio.fanfare();
        Z.ui.toast('⚡ 新大陆解锁：'+zone.name+'！（神界地图 Q 键前往）','good');
        Z.ui.eventBanner('新大陆：'+zone.name, '奥林匹斯议会批准宙斯前往「'+zone.name+'」活动。', true);
      }
      Z.log('新大陆解锁：'+zone.name,'good');
    }
  }
};

/* ---------- 主tick ---------- */
Z.tick = function(dt){
  const st = Z.state;
  st.t += dt;
  const rate = Z.totalIncomeRate();
  st.power += rate*dt;
  st.rate = rate;
  /* 清理过期 */
  st.tempMods = st.tempMods.filter(m=>m.until > st.t);
  if (st.goldApple && st.t - st.goldApple.born > 45) st.goldApple = null;
  if (st.peacock) st.anger = Math.min(100, st.anger + dt*0.05); /* 孔雀在场怒气微涨 */
  /* 怒气自然衰减 */
  st.anger = Math.max(0, st.anger - dt*0.12);
  Z.updatePregnancies();
  /* 随机事件 */
  if (!st.nextEventT) st.nextEventT = st.t + 75;
  if (st.t >= st.nextEventT && Z.ui && !Z.ui.modalOpen()){
    Z.fireEvent();
    st.nextEventT = st.t + rnd(45, 105);
  }
  Z.updateHera(dt);
  Z.updateMilestones();
  /* 登神 */
  if (st.power >= 10000 && !st.won){
    st.won = true;
    if (Z.stats) Z.stats.win();   /* ← 统计：又有人登神了 */
    if (Z.ui) Z.ui.win();
  }
};

/* ---------- 存档 ---------- */
const SAVE_KEY = 'zeus_save_v1';
Z.serialize = function(){
  const st = Z.state;
  return {
    v:1, t:st.t, power:st.power, anger:st.anger, won:st.won,
    zeus:{ x:Z.zeus.x, y:Z.zeus.y, zone:Z.zeus.zone },
    offspring: st.offspring.map(o=>({ id:o.id, name:o.name, key:o.key, quality:o.quality,
      birthT:o.birthT, zone:o.zone, cow:o.cow, curseUntil:o.curseUntil, departed:o.departed, seed:o.seed })),
    pregnancies: st.pregnancies, upgrades: st.upgrades, stats: st.stats, flags: st.flags,
    unlocked: st.unlocked, log: st.log.slice(-60), hera: st.hera, _oid: st._oid,
    creatures: Z.serializeCreatures(), realTime: Date.now()
  };
};
Z.save = function(silent){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(Z.serialize()));
    if (!silent && Z.ui) Z.ui.toast('已存档 ⚡','good');
    return true;
  }catch(e){ return false; }
};
Z.hasSave = function(){ try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; } };
Z.load = function(){
  let data;
  try{ data = JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){ return false; }
  if (!data || !data.v) return false;
  const st = Z.state;
  st.t = data.t||0; st.power = data.power||100; st.anger = data.anger||0; st.won = !!data.won;
  st.offspring = data.offspring||[]; st.pregnancies = data.pregnancies||[];
  st.upgrades = data.upgrades||st.upgrades; st.stats = data.stats||st.stats;
  st.flags = data.flags||st.flags; st.unlocked = data.unlocked||['village'];
  st.log = data.log||[]; st.hera = data.hera||st.hera; st._oid = data._oid||st.offspring.length;
  Z.zeus.x = data.zeus? data.zeus.x : 1100; Z.zeus.y = data.zeus? data.zeus.y : 750;
  Z.zeus.zone = (data.zeus && Z.state.unlocked.includes(data.zeus.zone)) ? data.zeus.zone : 'village';
  /* 恢复子嗣位置（母亲附近） */
  for (const off of st.offspring){
    if (off.departed) continue;
    const zone = Z.zoneById(off.zone);
    const mother = zone.creatures ? zone.creatures.find(c=>c.key===off.key) : null;
    if (mother){ off.x = mother.x+30; off.y = mother.y+16; off.hx = mother.x; off.hy = mother.y; }
    else { off.x = zone.size[0]/2+30; off.y = zone.size[1]/2+16; }
    off.target = null; off.moving = false;
  }
  Z.restoreCreatures(data.creatures||{});
  /* 离线收益（最多2小时，50%效率） */
  if (data.realTime){
    const away = Math.min(7200, (Date.now()-data.realTime)/1000);
    if (away > 60){
      const gain = Z.totalIncomeRate() * away * 0.5;
      st.power += gain;
      if (Z.ui) setTimeout(()=>{ Z.ui.toast('离开期间，子嗣们为宙斯积攒了 '+Math.round(gain)+' 神力','good'); }, 800);
      Z.log('离线收益：+'+Math.round(gain)+' 神力','good');
    }
  }
  return true;
};
Z.exportSave = function(){
  return btoa(unescape(encodeURIComponent(JSON.stringify(Z.serialize()))));
};
Z.importSave = function(code){
  try{
    const json = decodeURIComponent(escape(atob(code.trim())));
    localStorage.setItem(SAVE_KEY, json);
    return true;
  }catch(e){ return false; }
};
})();
