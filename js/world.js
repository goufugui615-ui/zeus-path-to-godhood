/* ============================================================
 * 宙斯成神之路 · 世界系统：五片大陆、羊皮纸地图、可结缘物种图鉴
 * v2：羊皮纸做旧质感（纸纹/水渍/折痕/经纬网/罗盘/卷轴地名）
 *     可结缘物种大扩容——凡有气息者，皆可结缘（含农庄牲畜）
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});

/* ---------- 可结缘物种图鉴（plan 决定绘制方式） ---------- */
Z.SPECIES = {
  /* ===== 人类村庄 / 农家庄园 ===== */
  villager:  { name:'农家姑娘',   baseQ:1, desc:'勤劳朴实，对持闪电的男人毫无防备' },
  farmwoman: { name:'农妇',       baseQ:1, desc:'力气大，一篮子鸡蛋能单手提起' },
  priestess: { name:'女祭司',     baseQ:2, desc:'侍奉神明的人，近水楼台' },
  princess:  { name:'流亡的公主', baseQ:3, rare:true, desc:'微服私访中，王冠藏在行李箱夹层' },
  /* —— 庄园牲畜（宙斯：物种从来不是限制） —— */
  cow:    { name:'母牛', baseQ:0, plan:'quadruped', cfg:{ scale:1.25, coat:'#e8dcc8', accent:'#4a3a2b', spots:true, horn:'curved', tail:'tuft', udder:true, ear:'round' },
            desc:'伊俄的远房表妹，低头吃草时悄悄瞄了一眼雷霆' },
  sheep:  { name:'母羊', baseQ:0, plan:'quadruped', cfg:{ scale:0.95, coat:'#e8e8e8', accent:'#8a8a8a', spots:true, horn:'spiral', tail:'short', udder:true, ear:'small' },
            desc:'金羊毛的远亲，毛很蓬松，脾气很好' },
  goat:   { name:'母山羊', baseQ:0, plan:'quadruped', cfg:{ scale:0.9, coat:'#d8c8a8', accent:'#6b4a2b', horn:'straight', tail:'short', udder:true, ear:'point' },
            desc:'阿玛尔忒亚的后代——论辈分，她奶过幼年的宙斯' },
  sow:    { name:'母猪', baseQ:0, plan:'quadruped', cfg:{ scale:1.05, coat:'#e8c0b8', accent:'#a86a6a', tail:'curl', udder:true, ear:'point', snout:'long' },
            desc:'吃饱就睡，睡醒就吃，一个朴素的生活哲学家' },
  hen:    { name:'母鸡', baseQ:0, plan:'bird', cfg:{ scale:0.85, coat:'#e8dcc8', accent:'#c8863a', comb:true, wattle:true, tail:'fan' },
            desc:'每天下一个蛋，偶尔下一个神谕' },
  goose:  { name:'母鹅', baseQ:0, plan:'bird', cfg:{ scale:1.0, coat:'#f0eee6', accent:'#c8863a', crest:true, tail:'short', beakColor:'#c8863a' },
            desc:'看家护院，嗓门比看门狗还大，鹅生偶像' },
  mare:   { name:'母马', baseQ:1, plan:'quadruped', cfg:{ scale:1.25, coat:'#8a5a3a', accent:'#3a2a1a', tail:'plume', mane:true, ear:'point', snout:'long' },
            desc:'跑起来像风，停下来像诗' },
  donkey: { name:'母驴', baseQ:0, plan:'quadruped', cfg:{ scale:1.0, coat:'#b8b0a0', accent:'#4a4a4a', tail:'tuft', ear:'long', mane:true },
            desc:'固执，但认准了就不松口——宙斯很欣赏这种品质' },
  dog:    { name:'母犬', baseQ:0, plan:'quadruped', cfg:{ scale:0.85, coat:'#c8a86a', accent:'#6b4a2b', tail:'curl', ear:'point', snout:'long' },
            desc:'忠诚，会跟着宙斯走三条街还摇尾巴' },
  cat:    { name:'母猫', baseQ:1, plan:'quadruped', cfg:{ scale:0.72, coat:'#d8c8b0', accent:'#4a3a2a', stripes:true, tail:'plume', ear:'point' },
            desc:'巴斯特座下的圣猫，高冷，但会蹭雷霆' },
  rabbit: { name:'母兔', baseQ:0, plan:'quadruped', cfg:{ scale:0.62, coat:'#e8e0d8', accent:'#c8a8a8', tail:'short', ear:'long' },
            desc:'繁殖界的传说。宙斯肃然起敬，并递上了名片' },
  bee:    { name:'蜂后', baseQ:2, plan:'bug', cfg:{ scale:1.15, kind:'bee', coat:'#e8c05a', accent:'#3a3a3a', stripes:true },
            desc:'蜂蜜与秩序的女王——宙斯小时候还喝过她的蜜' },

  /* ===== 精灵森林 ===== */
  dryad:      { name:'树精灵',     baseQ:2, desc:'和橡树共用一条根，心情随季节变化' },
  nymph:      { name:'森林仙女',   baseQ:2, desc:'在溪边梳头，被撞见也不生气' },
  centauress: { name:'半人马姑娘', baseQ:3, desc:'马拉松式恋爱观，先跑赢她再说' },
  muse:       { name:'缪斯女神',   baseQ:4, rare:true, desc:'九位缪斯路过了一位，随身携带里拉琴' },
  doe:      { name:'母鹿', baseQ:1, plan:'quadruped', cfg:{ scale:1.0, coat:'#c89868', accent:'#f0e0d0', spots:true, horn:'antler', tail:'short', ear:'point' },
              desc:'阿尔忒弥斯的圣兽，跑起来像林间的一道光' },
  vixen:    { name:'母狐', baseQ:1, plan:'quadruped', cfg:{ scale:0.78, coat:'#d87a3a', accent:'#f0e8e0', tail:'plume', ear:'point', snout:'long' },
              desc:'狡黠，据说骗过三个英雄和两个半神' },
  shewolf:  { name:'母狼', baseQ:1, plan:'quadruped', cfg:{ scale:1.0, coat:'#8a8a92', accent:'#4a4a52', tail:'plume', ear:'point', snout:'long', mane:true },
              desc:'罗马城的乳母，护崽，眼神很有压迫感' },
  shebear:  { name:'母熊', baseQ:2, plan:'quadruped', cfg:{ scale:1.35, coat:'#7a5a3a', accent:'#3a2a1a', tail:'short', ear:'round', snout:'long' },
              desc:'卡利斯托的化身……宙斯这次是带着礼物来的' },
  owl:      { name:'猫头鹰', baseQ:2, plan:'bird', cfg:{ scale:0.95, coat:'#a89878', accent:'#5a4a3a', crest:true, tail:'short', beakColor:'#c8863a' },
              desc:'雅典娜的圣鸟，看得懂宙斯的心思（并感到无语）' },
  butterfly:{ name:'蝶精', baseQ:2, plan:'bug', cfg:{ scale:1.05, kind:'butterfly', coat:'#c86aa8', accent:'#ffd94a' },
              desc:'普绪刻，灵魂化蝶，每一次振翅都是一句情话' },
  spider:   { name:'纺织娘', baseQ:1, plan:'bug', cfg:{ scale:1.0, kind:'spider', coat:'#5a4a3a', accent:'#c8b8a8' },
              desc:'阿拉克涅的传人，织工一等一，嘴上不饶人' },
  serpent:  { name:'灵蛇', baseQ:2, plan:'serpent', cfg:{ scale:1.05, coat:'#7a9a4a', inkColor:'#4a6b3a' },
              desc:'医神杖上的蛇，懂点药理，也懂人心' },
  swan:     { name:'天鹅姑娘', baseQ:2, plan:'bird', cfg:{ scale:1.25, coat:'#f6f2e8', accent:'#e8a04a', crest:true, tail:'short', beakColor:'#e8a04a' },
              desc:'勒达同款——这是宙斯的老本行，驾轻就熟' },
  naiad:    { name:'河仙女', baseQ:2, desc:'泉水与溪流的宁芙，捧起来能喝的那种清甜' },

  /* ===== 碧海深渊 ===== */
  mermaid: { name:'美人鱼',     baseQ:3, desc:'歌声与尾巴同样迷人' },
  nereid:  { name:'海仙女',     baseQ:3, desc:'波塞冬的五十个女儿之一（别告诉他爹）' },
  siren:   { name:'塞壬',       baseQ:4, desc:'歌声让水手跳海，让宙斯停下脚步' },
  dolphin: { name:'海豚', baseQ:2, plan:'fish', cfg:{ scale:1.0, coat:'#8ab8d8', inkColor:'#2f5d8a' },
             desc:'波塞冬的信使，但愿意为宙斯跑腿' },
  whale:   { name:'母鲸', baseQ:3, plan:'fish', cfg:{ scale:1.6, coat:'#7a9ab8', inkColor:'#2f5d8a', blow:true },
             desc:'深海的歌者，一开口整片海都安静了' },
  shark:   { name:'母鲨', baseQ:2, plan:'fish', cfg:{ scale:1.2, coat:'#9aa8b0', inkColor:'#4a5a6a', shark:true },
             desc:'牙口好，性格直，喜欢直接表达好感' },
  octopus: { name:'章鱼女', baseQ:3, desc:'八只手，抱起来很稳，也很会沏茶' },
  turtle:  { name:'海龟', baseQ:2, plan:'quadruped', cfg:{ scale:0.85, coat:'#7a9a6a', accent:'#4a6b3a', tail:'short', ear:'none' },
             desc:'背着房子旅行，慢，但从来不缺席' },
  seaserpent:{ name:'海蛇', baseQ:3, plan:'serpent', cfg:{ scale:1.3, coat:'#5a9ad0', inkColor:'#2f5d8a', hood:true },
             desc:'深海里的长影，缠绕着比奥林匹斯更古老的秘密' },

  /* ===== 神话火山 ===== */
  harpy:   { name:'哈比',       baseQ:3, desc:'飞行速度即逃跑速度，也是心动速度' },
  gorgo:   { name:'蛇发女妖',   baseQ:4, desc:'别看她的眼睛——看心就好' },
  sphinx:  { name:'斯芬克斯',   baseQ:4, desc:'会先出一道谜语，答错也没关系' },
  phoenix: { name:'凤凰',       baseQ:4, rare:true, desc:'五百年一遇的火鸟，正好今天路过' },
  bat:     { name:'母蝠', baseQ:1, plan:'bird', cfg:{ scale:0.8, coat:'#5a4a5a', accent:'#3a2a3a', crest:true, tail:'short', legColor:'#3a2a3a' },
             desc:'倒挂着看世界，觉得宙斯今天格外端正' },
  scorpion:{ name:'母蝎', baseQ:2, plan:'bug', cfg:{ scale:1.0, kind:'scorpion', coat:'#8a5a2a', accent:'#c8562a' },
             desc:'尾巴有毒，心是软的，扎人之前会先警告三次' },
  gargoyle:{ name:'石像鬼', baseQ:3, desc:'在教堂屋檐上蹲了三百年，终于有人问她的名字' },

  /* ===== 冥界边境 ===== */
  shade:    { name:'幽冥女妖',   baseQ:4, desc:'半透明的身影，触碰需要一点神力' },
  fury:     { name:'复仇女神',   baseQ:4, desc:'追仇人是职业，恋爱是副业' },
  nyx:      { name:'夜之女神',   baseQ:4, rare:true, desc:'连宙斯都敬畏三分的远古女神（这次豁出去了）' },
  hellhound:{ name:'冥界犬女', baseQ:3, plan:'quadruped', cfg:{ scale:1.05, coat:'#3a3a44', accent:'#c8562a', tail:'plume', ear:'point', snout:'long', mane:true, eye:'#c8562a' },
              desc:'三头犬的妹妹，只咬坏人，对宙斯摇尾巴' },
  frost:    { name:'霜女', baseQ:3, desc:'冥河的寒气凝成的少女，靠近时雷都会打颤' },
  astral:   { name:'星灵', baseQ:4, desc:'诞生于群星之间的意识，说话像星尘洒落' },
  lamia:    { name:'拉弥亚', baseQ:3, desc:'被赫拉诅咒过的旧情人……气氛有点尴尬，但都过去了' }
};

/* ---------- 环境生物（装饰用，不可结缘） ---------- */
Z.AMBIENT = { villager_m:'男村民', dog:'狗', sheep:'羊', cow:'牛', dolphin:'海豚', turtle:'海龟' };

/* ---------- 大陆定义 ---------- */
Z.ZONES = [
  { id:'village', name:'人类村庄 · 农家庄园', short:'人类村庄', unlock:0, cost:18, size:[2200,1500],
    bg:'#f4ecd8', ink:'#2b2b33', accent:'#a8863a', ground:'grass',
    decors:{ house:4, tree:6, fence:6, wheat:7, well:1, flower:9, statue:1, rock:2, haystack:3, trough:2, cart:1 },
    spawns:[['villager',3],['farmwoman',2],['priestess',2],['princess',1],
            ['cow',2],['sheep',2],['goat',2],['sow',1],['hen',2],['goose',1],
            ['mare',2],['donkey',1],['dog',2],['cat',1],['rabbit',2],['bee',1]],
    ambient:[['villager_m',3],['dog',1]] },
  { id:'forest', name:'精灵森林', short:'精灵森林', unlock:300, cost:110, size:[2200,1500],
    bg:'#eceeda', ink:'#2b2b33', accent:'#4a6b3a', ground:'forest',
    decors:{ bigtree:9, tree:10, flower:12, rock:4, mushroom:0, statue:1 },
    spawns:[['dryad',3],['nymph',3],['centauress',2],['muse',1],
            ['doe',2],['vixen',2],['shewolf',1],['shebear',1],['owl',2],
            ['butterfly',2],['spider',1],['serpent',1],['swan',2],['naiad',2]],
    ambient:[['dog',1],['sheep',2]] },
  { id:'sea', name:'碧海深渊', short:'碧海深渊', unlock:1000, cost:450, size:[2200,1500],
    bg:'#e2ebee', ink:'#2b2b33', accent:'#2f5d8a', ground:'water',
    decors:{ seaweed:9, coral:6, shell:6, rock:3 },
    spawns:[['mermaid',3],['nereid',3],['siren',2],
            ['dolphin',3],['whale',1],['shark',2],['octopus',2],['turtle',2],['seaserpent',1]],
    ambient:[['dolphin',3],['turtle',2]] },
  { id:'volcano', name:'神话火山', short:'神话火山', unlock:3000, cost:1400, size:[2200,1500],
    bg:'#f2e4d4', ink:'#2b2b33', accent:'#c8562a', ground:'volcanic',
    decors:{ lavarock:8, vent:4, rock:5, pillar:3 },
    spawns:[['harpy',3],['gorgo',3],['sphinx',2],['phoenix',1],['bat',2],['scorpion',2],['gargoyle',2]],
    ambient:[] },
  { id:'underworld', name:'冥界边境', short:'冥界边境', unlock:6500, cost:3400, size:[2200,1500],
    bg:'#e4e0ec', ink:'#2b2b33', accent:'#5a5a8a', ground:'night',
    decors:{ cypress:8, tomb:7, pillar:4, brazier:5, rock:3 },
    spawns:[['shade',3],['fury',3],['nyx',1],['hellhound',2],['frost',2],['astral',2],['lamia',2]],
    ambient:[] }
];
Z.zoneById = function(id){ for (const z of Z.ZONES) if (z.id===id) return z; return Z.ZONES[0]; };

/* ---------- 种子随机 ---------- */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
Z.mulberry32 = mulberry32;

/* ============================================================
 *  羊皮纸地图：底色 / 纸纹 / 水渍 / 折痕 / 经纬网 / 罗盘 / 卷轴
 * ============================================================ */
const SEPIA = '#7a5a32';
function paperBase(c, w, h, rng){
  /* 底色渐变 */
  const g = c.createLinearGradient(0,0,w*0.4,h);
  g.addColorStop(0,'#f7eed6'); g.addColorStop(0.45,'#f0e2c2'); g.addColorStop(1,'#e6d2ac');
  c.fillStyle = g; c.fillRect(0,0,w,h);
  /* 大块色斑（不均匀做旧） */
  for (let i=0;i<30;i++){
    const x=rng()*w, y=rng()*h, r=90+rng()*240;
    const rg = c.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,'rgba(150,110,60,0.055)'); rg.addColorStop(1,'rgba(150,110,60,0)');
    c.fillStyle = rg; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
  }
  /* 水渍（边缘更深，淡淡一圈） */
  for (let i=0;i<12;i++){
    const x=rng()*w, y=rng()*h, r=40+rng()*110;
    c.save(); c.globalAlpha=0.022+rng()*0.028; c.strokeStyle='#8a5a2a'; c.lineWidth=2+rng()*3;
    c.beginPath(); c.ellipse(x,y,r,r*(0.6+rng()*0.5),rng()*3,0,Math.PI*2); c.stroke(); c.restore();
  }
  /* 纸纤维（细点 + 短线） */
  c.save();
  for (let i=0;i<2400;i++){
    const x=rng()*w, y=rng()*h;
    c.globalAlpha = 0.02+rng()*0.05;
    c.fillStyle = rng()>0.45? '#8a6a3a' : '#fffaf0';
    const s = 0.6+rng()*1.4;
    c.fillRect(x, y, s, s);
  }
  for (let i=0;i<420;i++){
    const x=rng()*w, y=rng()*h, len=3+rng()*11, a=rng()*Math.PI;
    c.globalAlpha=0.03+rng()*0.045; c.strokeStyle='#8a6a3a'; c.lineWidth=0.8;
    c.beginPath(); c.moveTo(x,y); c.lineTo(x+Math.cos(a)*len, y+Math.sin(a)*len); c.stroke();
  }
  c.restore();
  /* 折痕 */
  c.save(); c.strokeStyle='#9a7340'; c.lineWidth=2.4;
  for (let i=0;i<5;i++){ const x = w*(0.16+i*0.18)+rng()*40;
    c.globalAlpha=0.05+rng()*0.05;
    c.beginPath(); c.moveTo(x,0); c.lineTo(x+(rng()-0.5)*60,h); c.stroke(); }
  for (let i=0;i<4;i++){ const y = h*(0.2+i*0.22)+rng()*40;
    c.globalAlpha=0.045+rng()*0.045;
    c.beginPath(); c.moveTo(0,y); c.lineTo(w,y+(rng()-0.5)*50); c.stroke(); }
  c.restore();
}
function paperGrid(c, w, h){
  c.save(); c.strokeStyle=SEPIA; c.globalAlpha=0.09; c.lineWidth=1;
  c.setLineDash([7,9]);
  for (let x=150;x<w;x+=150){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); }
  for (let y=150;y<h;y+=150){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
  c.setLineDash([]); c.restore();
}
function paperFrame(c, w, h){
  c.save();
  c.strokeStyle = SEPIA; c.globalAlpha=0.55; c.lineWidth=5;
  c.strokeRect(16,16,w-32,h-32);
  c.globalAlpha=0.35; c.lineWidth=1.6;
  c.strokeRect(30,30,w-60,h-60);
  /* 四角小装饰 */
  c.globalAlpha=0.5; c.lineWidth=2.4;
  const m=24, s=26;
  const corners=[[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]];
  for (const [x,y,sx,sy] of corners){
    c.beginPath(); c.moveTo(x+sx*s,y); c.lineTo(x,y); c.lineTo(x,y+sy*s); c.stroke();
    c.beginPath(); c.moveTo(x+sx*s*0.55,y+sy*4); c.lineTo(x+sx*4,y+sy*4); c.lineTo(x+sx*4,y+sy*s*0.55); c.stroke();
  }
  c.restore();
}
function compassRose(c, x, y, r){
  c.save(); c.translate(x,y);
  c.strokeStyle=SEPIA; c.globalAlpha=0.5; c.lineWidth=1.8;
  c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.stroke();
  c.globalAlpha=0.35; c.beginPath(); c.arc(0,0,r*0.72,0,Math.PI*2); c.stroke();
  /* 八芒星 */
  for (let i=0;i<8;i++){
    const a = i*Math.PI/4, long = (i%2===0)? r : r*0.62;
    const wdt = (i%2===0)? 0.16 : 0.1;
    c.globalAlpha = (i%2===0)?0.62:0.4;
    c.beginPath();
    c.moveTo(Math.cos(a)*long, Math.sin(a)*long);
    c.lineTo(Math.cos(a+Math.PI/2)*long*wdt, Math.sin(a+Math.PI/2)*long*wdt);
    c.lineTo(0,0);
    c.lineTo(Math.cos(a-Math.PI/2)*long*wdt, Math.sin(a-Math.PI/2)*long*wdt);
    c.closePath(); c.stroke();
    if (i%2===0){ c.globalAlpha=0.22; c.fillStyle=SEPIA; c.fill(); }
  }
  /* N 字 */
  c.globalAlpha=0.7; c.fillStyle=SEPIA;
  c.font='bold 18px KaiTi, serif'; c.textAlign='center'; c.textBaseline='middle';
  c.fillText('N', 0, -r-14);
  c.restore();
}
function cartouche(c, x, y, text, sub){
  c.save();
  c.font='bold 40px KaiTi, STKaiti, serif';
  const wTxt = c.measureText(text).width;
  const w = Math.max(300, wTxt+120), h = 86;
  c.translate(x,y);
  /* 卷轴 */
  c.globalAlpha=0.30; c.fillStyle='#f7eed6'; c.strokeStyle=SEPIA; c.lineWidth=2.6;
  c.beginPath(); c.rect(-w/2,-h/2,w,h); c.fill(); c.stroke();
  c.globalAlpha=0.2; c.beginPath(); c.rect(-w/2+7,-h/2+7,w-14,h-14); c.stroke();
  /* 两端卷轴头 */
  c.globalAlpha=0.35; c.lineWidth=3;
  for (const s of [-1,1]){
    c.beginPath(); c.ellipse(s*w/2, 0, 13, h/2+6, 0, 0, Math.PI*2); c.stroke();
  }
  /* 文字 */
  c.globalAlpha=0.85; c.fillStyle=SEPIA; c.textAlign='center'; c.textBaseline='middle';
  c.fillText(text, 0, sub? -12 : 0);
  if (sub){ c.font='17px KaiTi, serif'; c.globalAlpha=0.6; c.fillText(sub, 0, 22); }
  c.restore();
}
function agedEdges(c, w, h, rng){
  /* 四边压暗 + 虫蛀小缺口 */
  c.save();
  const edges = [[0,0,w,70,'v'],[0,h-70,w,70,'v'],[0,0,70,h,'h'],[w-70,0,70,h,'h']];
  for (const [x,y,ww,hh] of edges){
    const g = c.createLinearGradient(x,y, x+(ww>hh?0:ww), y+(hh>ww?0:hh));
    g.addColorStop(0,'rgba(90,60,25,0.22)');
    g.addColorStop(0.5,'rgba(90,60,25,0.05)');
    g.addColorStop(1,'rgba(90,60,25,0)');
    c.fillStyle=g; c.fillRect(x,y,ww,hh);
  }
  /* 焦斑 */
  for (let i=0;i<10;i++){
    const side = Math.floor(rng()*4);
    let x,y;
    if (side===0){ x=rng()*w; y=rng()*24; }
    else if (side===1){ x=rng()*w; y=h-rng()*24; }
    else if (side===2){ x=rng()*24; y=rng()*h; }
    else { x=w-rng()*24; y=rng()*h; }
    const r=10+rng()*26;
    const rg=c.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,'rgba(70,45,18,0.28)'); rg.addColorStop(1,'rgba(70,45,18,0)');
    c.fillStyle=rg; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
  }
  c.restore();
}

/* ---------- 地面预渲染（羊皮纸） ---------- */
const groundCache = {};
Z.getGround = function(zone){
  if (groundCache[zone.id]) return groundCache[zone.id];
  const cv = document.createElement('canvas');
  cv.width = zone.size[0]; cv.height = zone.size[1];
  const c = cv.getContext('2d');
  const rng = mulberry32(991 + Z.ZONES.indexOf(zone)*77);
  const P = Z.draw.primitives;
  const W = cv.width, H = cv.height;

  paperBase(c, W, H, rng);
  paperGrid(c, W, H);

  /* ---- 各区域手绘母题（棕褐墨） ---- */
  c.lineCap='round'; c.lineJoin='round';
  const g = zone.ground;
  if (g==='grass' || g==='forest'){
    const n = g==='forest'? 360:250;
    c.strokeStyle = SEPIA;
    for (let i=0;i<n;i++){ const x=rng()*W, y=rng()*H, hh=4+rng()*6;
      c.globalAlpha=0.12+rng()*0.14; c.lineWidth=1;
      c.beginPath(); c.moveTo(x,y); c.lineTo(x+(rng()-0.5)*5, y-hh); c.stroke();
      c.beginPath(); c.moveTo(x-2.5,y); c.lineTo(x-4, y-hh*0.7); c.stroke();
      c.beginPath(); c.moveTo(x+2.5,y); c.lineTo(x+4, y-hh*0.7); c.stroke(); }
    /* 山丘符号 */
    for (let i=0;i<7;i++){
      const x=rng()*W, y=rng()*H, s=18+rng()*22;
      c.globalAlpha=0.16; c.lineWidth=2;
      for (let k=0;k<3;k++){
        c.beginPath(); c.moveTo(x-s+k*s*0.7, y);
        c.quadraticCurveTo(x-s*0.5+k*s*0.7, y-s*0.9, x+k*s*0.7, y);
        c.stroke(); }
    }
    if (g==='grass'){
      /* 泥路 */
      c.globalAlpha=0.32; c.strokeStyle='#a8863a'; c.lineWidth=2.4;
      c.beginPath(); c.moveTo(0, H*0.72);
      c.bezierCurveTo(W*0.3, H*0.6, W*0.5, H*0.9, W, H*0.7); c.stroke();
      c.globalAlpha=0.14; c.lineWidth=8; c.stroke();
    }
  } else if (g==='water'){
    c.strokeStyle='#2f5d8a';
    for (let i=0;i<170;i++){ const x=rng()*W, y=rng()*H, w2=12+rng()*30;
      c.globalAlpha=0.10+rng()*0.12; c.lineWidth=1.2;
      c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+w2/2, y-4-rng()*4, x+w2, y); c.stroke();
      c.globalAlpha=0.06; c.beginPath(); c.moveTo(x+4,y+7); c.quadraticCurveTo(x+w2/2, y+4, x+w2-4, y+7); c.stroke(); }
    for (let i=0;i<9;i++){ const y=rng()*H; c.globalAlpha=0.07; c.lineWidth=1;
      c.beginPath(); c.moveTo(0,y); c.quadraticCurveTo(W/2, y+(rng()-0.5)*140, W, y+(rng()-0.5)*70); c.stroke(); }
  } else if (g==='volcanic'){
    c.strokeStyle='#8a3a1a';
    for (let i=0;i<46;i++){ const x=rng()*W, y=rng()*H;
      c.globalAlpha=0.14+rng()*0.14; c.lineWidth=1.6;
      c.beginPath(); c.moveTo(x,y);
      let px=x, py=y;
      for (let j=0;j<4;j++){ px += (rng()-0.5)*62; py += (rng()-0.3)*42; c.lineTo(px,py); }
      c.stroke(); }
    /* 火山符号 */
    c.strokeStyle=SEPIA;
    for (let i=0;i<6;i++){ const x=rng()*W, y=rng()*H, s=20+rng()*16;
      c.globalAlpha=0.2; c.lineWidth=2;
      c.beginPath(); c.moveTo(x-s,y); c.lineTo(x-s*0.3,y-s); c.lineTo(x+s*0.3,y-s); c.lineTo(x+s,y); c.stroke();
      c.beginPath(); c.moveTo(x-s*0.28,y-s); c.lineTo(x,y-s*1.5); c.lineTo(x+s*0.28,y-s); c.stroke(); }
    c.strokeStyle='#5a4a3a';
    for (let i=0;i<120;i++){ const x=rng()*W, y=rng()*H;
      c.globalAlpha=0.1; c.lineWidth=1.1;
      c.beginPath(); c.arc(x,y,1+rng()*2.6,0,Math.PI*2); c.stroke(); }
  } else if (g==='night'){
    c.strokeStyle='#4a4a72';
    for (let i=0;i<190;i++){ const x=rng()*W, y=rng()*H;
      c.globalAlpha=0.2+rng()*0.4; c.lineWidth=1;
      if (rng()>0.82){ P.drawSpark(c,x,y,rng()*5); }
      else { c.beginPath(); c.arc(x,y,0.8+rng()*1.3,0,Math.PI*2); c.stroke(); } }
    for (let i=0;i<11;i++){ const y=rng()*H; c.globalAlpha=0.05; c.fillStyle='#5a5a8a';
      c.fillRect(0,y,W,20+rng()*46); }
  }
  c.globalAlpha=1;

  /* ---- 地图装饰：罗盘 / 卷轴地名 / 边框 / 做旧 ---- */
  compassRose(c, W-150, H-160, 46);
  cartouche(c, W/2, 96, zone.short||zone.name, 'ZEUS · PATH TO GODHOOD');
  paperFrame(c, W, H);
  agedEdges(c, W, H, rng);

  groundCache[zone.id] = cv;
  return cv;
};

/* ---------- 装饰生成（确定性） ---------- */
Z.getDecors = function(zone){
  if (zone._decors) return zone._decors;
  const rng = mulberry32(4177 + Z.ZONES.indexOf(zone)*131);
  const W = zone.size[0], H = zone.size[1];
  const list = [];
  const margin = 120;
  for (const key in zone.decors){
    const n = zone.decors[key];
    if (!Z.draw.hasDecor(key)) continue;
    for (let i=0;i<n;i++){
      let ok=false, x, y, tries=0;
      while(!ok && tries++<40){
        x = margin + rng()*(W-margin*2); y = margin + rng()*(H-margin*2);
        ok = true;
        for (const d of list){ if (Math.hypot(d.x-x, d.y-y) < 95){ ok=false; break; } }
        if (Math.hypot(x-W/2, y-H/2) < 170) ok=false; /* 中心出生点留空 */
      }
      if (ok) list.push({ key, x, y, seed: Math.floor(rng()*1000), w0:-4 });
    }
  }
  list.push({ key:'gate', x:W/2, y:H/2, seed:7, w0:-4 });
  zone._decors = list;
  return list;
};

/* ---------- 生物生成（确定性骨架 + 可变状态分离） ---------- */
Z.spawnCreatures = function(zone){
  if (zone._spawned) return;
  const rng = mulberry32(8008 + Z.ZONES.indexOf(zone)*333);
  const W = zone.size[0], H = zone.size[1];
  const decors = Z.getDecors(zone);
  zone.creatures = [];
  zone.ambients = [];
  let id = 0;
  for (const [key, n] of zone.spawns){
    for (let i=0;i<n;i++){
      let x, y, tries=0;
      do { x = 140+rng()*(W-280); y = 140+rng()*(H-280); }
      while (tries++<30 && decors.some(d=>Math.hypot(d.x-x,d.y-y)<60));
      zone.creatures.push({
        id: zone.id+'#'+(id++), zone: zone.id, key,
        x, y, hx:x, hy:y, seed: Math.floor(rng()*1000),
        restUntil:0, courtCount:0, scaredUntil:0, cursedUntil:0, loveUntil:0,
        pregnantUntil:0, moving:false, target:null
      });
    }
  }
  for (const [key, n] of zone.ambient){
    for (let i=0;i<n;i++){
      const x = 140+rng()*(W-280), y = 140+rng()*(H-280);
      zone.ambients.push({ id: zone.id+'#a'+(id++), key, x, y, hx:x, hy:y, seed: Math.floor(rng()*1000), moving:false });
    }
  }
  zone._spawned = true;
};
})();
