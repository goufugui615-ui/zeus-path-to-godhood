/* ============================================================
 * 宙斯成神之路 · UI 层
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});
const $ = id => document.getElementById(id);

const UI = {
  _raf: null,

  /* ---------- 基础 ---------- */
  modalOpen(){
    return !!(document.querySelector('.modal-mask') ||
      $('hera-overlay').classList.contains('on') ||
      $('breed-overlay').classList.contains('on') ||
      $('win-overlay').classList.contains('on'));
  },
  toast(text, cls){
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast sketch';
    el.style.borderColor = cls==='good' ? 'var(--green)' : (cls==='bad' ? 'var(--red)' : 'var(--ink)');
    el.textContent = text;
    box.appendChild(el);
    setTimeout(()=>{ el.remove(); }, 3900);
    while (box.children.length > 5) box.firstChild.remove();
  },
  floatText(text, color){ this.toast(text, color==='#4a6b3a'?'good':''); },
  eventBanner(name, text, good){
    const b = $('event-banner');
    b.className = 'sketch ' + (good===true?'good':good===false?'bad':'');
    $('event-banner-main').textContent = '『 ' + name + ' 』';
    $('event-banner-sub').textContent = text;
    b.style.display = 'block';
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(()=>{ b.style.display='none'; }, 5200);
  },

  /* ---------- 弹窗框架 ---------- */
  openModal(title, bodyHTML){
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = '<div class="modal sketch"><h2><span>'+title+'</span><span class="close-x">×</span></h2>'+
      '<div class="body">'+bodyHTML+'</div></div>';
    $('viewport').appendChild(mask);
    mask.querySelector('.close-x').onclick = ()=>{ Z.audio.click(); mask.remove(); };
    return mask;
  },

  /* ---------- HUD ---------- */
  updateHUD(){
    const st = Z.state;
    $('power-value').textContent = Math.floor(st.power).toLocaleString();
    $('power-rate').textContent = '+' + st.rate.toFixed(2) + ' /秒 · 子嗣 ' + st.offspring.length +
      (st.pregnancies.length ? ' · 孕育中 ' + st.pregnancies.length : '');
    const anger = st.anger;
    $('hera-bar').style.width = Math.min(100, anger) + '%';
    $('hera-count').textContent = st.hera.visits ? '降临 '+st.hera.visits+' 次' : '';
    const hint = $('hera-hint');
    if (st.offspring.length >= 5){
      const wait = Math.max(0, Math.round((st.hera.nextT||0) - st.t));
      hint.textContent = anger > 55 ? '赫拉怒火中烧…' : (wait < 120 ? '远处似乎有孔雀的叫声…' : '暂时风平浪静');
    } else hint.textContent = '子嗣达到 5 个后，赫拉会开始巡访';
    $('zone-label').textContent = Z.zoneById(Z.zeus.zone).name +
      (st.won ? ' · 众神之父' : '');
  },
  updateTip(){
    const zone = Z.zoneById(Z.zeus.zone);
    let best=null, bd=56, why='';
    for (const c of zone.creatures){
      const d = Math.hypot(c.x-Z.zeus.x, c.y-Z.zeus.y);
      if (d < bd){ bd=d; best=c; why = Z.canCourt(c); }
    }
    const tip = $('interact-tip');
    if (!best){ tip.style.display='none'; return; }
    const name = Z.SPECIES[best.key].name;
    if (why.ok){ tip.style.display='block'; tip.innerHTML = '按 <kbd>E</kbd> 向 <b>'+name+'</b> 求爱'; }
    else { tip.style.display='block'; tip.innerHTML = name+'：'+why.why; }
  },

  /* ---------- 求爱面板 ---------- */
  courtship(cr){
    const spec = Z.SPECIES[cr.key];
    const stars = q => '★'.repeat(q+1) + '☆'.repeat(4-q);
    let injectLv = 1;
    const cost = ()=> Z.courtCost(cr) + Z.injectCost(cr, injectLv);
    const mask = this.openModal('求爱 · ' + spec.name, `
      <div class="mother-card">
        <canvas id="court-portrait" width="110" height="130"></canvas>
        <div style="flex:1">
          <div style="font-size:17px"><b>${spec.name}</b> <span class="q-stars" id="court-stars"></span></div>
          <div style="font-size:13px;color:#7a6a45">${spec.desc||''}</div>
          <div id="court-info" style="margin-top:6px;font-size:14px"></div>
        </div>
      </div>
      <hr class="divider">
      <div class="row" style="justify-content:space-between">
        <b>神力注入</b><span style="font-size:12.5px;color:#7a6a45">注入越多，子嗣品质越高（消耗也越大）</span>
      </div>
      <input type="range" id="court-slider" min="0" max="3" step="1" value="1">
      <div class="row" style="justify-content:space-between;font-size:13.5px">
        <span id="court-lv"></span><span id="court-cost"></span>
      </div>
      <hr class="divider">
      <div class="row" style="justify-content:flex-end">
        <span id="court-total" style="margin-right:auto;font-size:16px"></span>
        <button class="sketch-btn" id="court-cancel">再考虑一下</button>
        <button class="sketch-btn gold" id="court-ok">开始求爱 ⚡</button>
      </div>`);
    /* 头像 */
    const pc = mask.querySelector('#court-portrait').getContext('2d');
    const P = Z.draw.primitives;
    P.S(pc, Z.draw.INK, 2);
    pc.save(); pc.translate(55, 118); pc.scale(1.15,1.15);
    Z.draw.species(pc, cr.key, 1.2, { seed: cr.seed });
    pc.restore();
    const refresh = ()=>{
      const base = Z.SPECIES[cr.key].baseQ - Math.floor(cr.courtCount/2);
      mask.querySelector('#court-stars').textContent = stars(Math.max(0,Math.min(4,base)));
      const lvTxt = ['不注入（赌运气）','轻度注入','中度注入','全力注入'][injectLv];
      const exp = Z.qualityExpect(cr, injectLv);
      mask.querySelector('#court-lv').textContent = lvTxt + ' · 预期品质 ≈ ' +
        QUALITY_NAME(Math.round(exp)) + '（' + stars(Math.round(exp)) + '）';
      const c1 = Z.courtCost(cr), c2 = Z.injectCost(cr, injectLv);
      mask.querySelector('#court-cost').textContent = '基础 ' + c1 + (c2>0 ? ' + 注入 ' + c2 : '');
      const total = c1 + c2;
      const ok = Z.state.power >= total;
      const tot = mask.querySelector('#court-total');
      tot.innerHTML = '合计：<b style="color:'+(ok?'var(--gold)':'var(--red)')+'">'+total+'</b> 神力' +
        (ok ? '' : '（不够！）');
      tot.style.color = ok ? '' : 'var(--red)';
      mask.querySelector('#court-ok').disabled = !ok;
      const rep = cr.courtCount ? '<br><span style="color:#9a5a4a;font-size:12.5px">与她的第 '+(cr.courtCount+1)+' 次结晶：品质潜力 -'+Math.floor(cr.courtCount/2)+'</span>' : '';
      mask.querySelector('#court-info').innerHTML =
        '当前神力：<b>'+Math.floor(Z.state.power)+'</b> · 母亲品质基础：'+stars(Math.max(0,Math.min(4,base)))+rep;
    };
    function QUALITY_NAME(q){ return Z.QUALITY[Math.max(0,Math.min(4,q))].name; }
    mask.querySelector('#court-slider').oninput = e=>{ injectLv = +e.target.value; refresh(); };
    mask.querySelector('#court-cancel').onclick = ()=>{ Z.audio.click(); mask.remove(); };
    mask.querySelector('#court-ok').onclick = ()=>{
      Z.audio.heart();
      mask.remove();
      UI.breedAnimation(cr, injectLv);
    };
    refresh();
  },

  /* ---------- 繁殖动画（含蓄搞笑版） ---------- */
  breedAnimation(cr, injectLv){
    const ov = $('breed-overlay');
    const stage = $('breed-stage');
    ov.style.display = 'flex';
    /* 左：宙斯，右：母亲 */
    const cl = $('breed-fig-l').querySelector('canvas').getContext('2d');
    const cr2 = $('breed-fig-r').querySelector('canvas').getContext('2d');
    cl.clearRect(0,0,130,170); cr2.clearRect(0,0,130,170);
    const P = Z.draw.primitives;
    P.S(cl, Z.draw.INK, 2); cl.save(); cl.translate(65,150); cl.scale(1.35,1.35);
    Z.draw.zeus(cl, 0.3, { power: Z.state.power }); cl.restore();
    P.S(cr2, Z.draw.INK, 2); cr2.save(); cr2.translate(65,150); cr2.scale(1.35,1.35);
    Z.draw.species(cr2, cr.key, 0.6, { seed: cr.seed, love:true }); cr2.restore();
    /* 云朵 */
    $('breed-cloud').innerHTML = `
      <svg viewBox="0 0 260 170" style="width:100%;height:100%">
        <path d="M40,120 Q20,120 25,100 Q10,95 20,80 Q15,55 45,55 Q50,25 85,30 Q105,10 130,25 Q160,10 175,35 Q210,25 215,55 Q245,55 240,85 Q255,95 240,110 Q250,125 230,125 Z"
          fill="#f4ecd8" stroke="#2b2b33" stroke-width="4" stroke-linejoin="round"/>
        <text x="130" y="95" text-anchor="middle" font-size="30" fill="#d0506a">❤</text>
        <text x="95" y="70" font-size="16" fill="#d0506a">❤</text>
        <text x="165" y="78" font-size="20" fill="#d0506a">❤</text>
      </svg>`;
    const textEl = $('breed-text');
    const seq = [
      '宙斯甩了甩胡子上的闪电碎屑……',
      '「姑娘，我给你看个宝贝——我的权杖。」',
      '⚡ 一段不可描述但气氛到位的神话故事 ⚡',
      '雷声大作，大地回春，羊群咩咩叫好……',
      '十个月后——（神话时间，很快）'
    ];
    let step = 0;
    textEl.textContent = seq[0];
    ov.classList.add('on');
    const heartTimer = setInterval(()=>{
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '❤';
      h.style.left = (180 + Math.random()*180) + 'px';
      h.style.top = (170 + Math.random()*120) + 'px';
      stage.appendChild(h);
      setTimeout(()=>h.remove(), 1700);
    }, 320);
    setTimeout(()=>{ ov.classList.add('flirting'); Z.audio.heart(); }, 500);
    setTimeout(()=>{ ov.classList.add('cloud'); }, 1700);
    setTimeout(()=>{ ov.classList.add('zap'); Z.audio.thunder(); stage.style.animation='none'; }, 2700);
    const textTimer = setInterval(()=>{ step++; if (step < seq.length) textEl.textContent = seq[step]; }, 800);
    setTimeout(()=>{
      clearInterval(heartTimer); clearInterval(textTimer);
      const res = Z.conceive(cr, injectLv);
      ov.classList.remove('on','flirting','cloud','zap');
      ov.style.display = 'none';
      if (res){
        Z.audio.coin();
        UI.toast('⚡ 求爱成功！'+Z.SPECIES[cr.key].name+' 正在孕育宙斯的后代（约 '+res.pregTime+' 秒后出生）','good');
        Z.log('与'+Z.SPECIES[cr.key].name+'结缘，神力注入 '+injectLv+' 档，消耗 '+res.cost+'。','good');
      } else {
        UI.toast('神力不足……宙斯尴尬地收起了权杖','bad');
      }
    }, 4200);
  },

  /* ---------- 出生通知 ---------- */
  onBirth(off, zoneId){
    Z.audio.babyFanfare();
    const q = Z.QUALITY[off.quality];
    const inZone = zoneId === Z.zeus.zone;
    UI.toast('👶 '+off.name+' 出生了！（'+q.name+' · '+(q.rate*Z.tempMult('income')*(1+0.06*Z.state.upgrades.siphon)).toFixed(2)+'/秒）' +
      (inZone ? '' : ' 出生于'+Z.zoneById(zoneId).name), 'good');
    Z.log(off.name+' 降临人世，血统：'+q.name+'。','good');
  },

  /* ---------- 赫拉降临 ---------- */
  heraVisit(){
    Z.audio.ominous();
    const ov = $('hera-overlay');
    const target = Z.heraPickTarget();
    ov.classList.add('on');
    const quotes = [
      '「宙斯。我数过了。一个不差。」',
      '「我在奥林匹斯补个觉的工夫，你又干了什么？」',
      '「你的子嗣？哦，你是说我的新牛群。」',
      '「别躲了，孔雀都告诉我了。它什么都看到了。」',
      '「我这次下来，是带着刑具和原谅二选一的套餐。」'
    ];
    $('hera-quote').innerHTML = pick2(quotes) + '<br><span style="font-size:13.5px;color:#9a5a4a">—— 赫拉的目标：<b>' +
      (target ? target.name + '（' + Z.QUALITY[target.quality].name + '，' + Z.offspringIncome(target).toFixed(2) + '/秒）' : '无') +
      '</b></span>';
    const choices = $('hera-choices');
    choices.innerHTML = '';
    const protectCost = Z.heraProtectCost();
    const btnP = document.createElement('button');
    btnP.className = 'sketch-btn choice-btn';
    btnP.innerHTML = '⚡ 神力护佑（花费 ' + protectCost + ' 神力保住这个孩子）<small>宙斯撑起雷霆结界，赫拉冷笑但暂时退让。怒气略微下降。</small>';
    btnP.disabled = Z.state.power < protectCost;
    btnP.onclick = ()=>{
      Z.state.power -= protectCost;
      Z.state.anger = Math.max(0, Z.state.anger - 6);
      Z.audio.shield();
      Z.log('宙斯花费 '+protectCost+' 神力护佑了 '+target.name+'。','good');
      UI.toast('雷霆结界！'+target.name+' 保住了。','good');
      ov.classList.remove('on');
    };
    const btnT = document.createElement('button');
    btnT.className = 'sketch-btn danger choice-btn';
    btnT.innerHTML = '😐 忍受惩罚<small>省下神力，看着赫拉出手。忍受次数过多会引发狂怒。</small>';
    btnT.onclick = ()=>{
      const r = Z.heraPunish(target);
      Z.state.hera.tolerated++;
      UI.toast(r.text, 'bad');
      Z.log('赫拉降罚：'+r.text, 'bad');
      if (Z.state.hera.tolerated >= 3){
        Z.state.hera.tolerated = 0;
        const loss = Math.round(Z.state.power*0.1);
        Z.state.power -= loss;
        Z.audio.angry();
        Z.log('赫拉狂怒！宙斯损失 '+loss+' 神力。','bad');
        setTimeout(()=>UI.toast('💥 赫拉狂怒！雷霆风暴席卷大地，宙斯损失 '+loss+' 神力！','bad'), 600);
      }
      ov.classList.remove('on');
    };
    choices.appendChild(btnP);
    choices.appendChild(btnT);
  },
  giftDialog(){
    const cost = Math.round(Math.max(30, Z.state.power*0.05));
    const mask = this.openModal('安抚赫拉', `
      <p style="font-size:14.5px;line-height:1.9">送一份礼物（鲜花、珠宝、以及一份措辞诚恳的道歉声明），
      可以让赫拉的怒气 <b>-22</b>。<br>当前怒气：<b>${Math.round(Z.state.anger)}</b> / 100</p>
      <div class="row" style="justify-content:flex-end">
        <button class="sketch-btn gold" id="gift-ok" ${Z.state.power<cost?'disabled':''}>送出礼物（${cost} 神力）</button>
      </div>`);
    mask.querySelector('#gift-ok').onclick = ()=>{
      if (Z.giveGift()){ Z.audio.heart(); UI.toast('赫拉收下了礼物，哼了一声。怒气 -22','good'); }
      mask.remove();
    };
  },

  /* ---------- 子嗣名录 ---------- */
  showRoster(){
    const st = Z.state;
    let rows = '';
    const sorted = st.offspring.slice().sort((a,b)=> (Z.offspringIncome(b)-Z.offspringIncome(a)) || (b.birthT-a.birthT));
    for (const o of sorted){
      const q = Z.QUALITY[o.quality];
      const stage = ['婴儿','幼年','成年'][Z.offspringStage(o)];
      const age = Math.floor(st.t - o.birthT);
      let tags = '';
      if (o.cow) tags += '<span class="tag cow">哞</span>';
      if (o.curseUntil > st.t) tags += '<span class="tag curse">受诅</span>';
      if (o.departed) tags += '<span class="tag hero">游历世界</span>';
      if (o.quality >= 4) tags += '<span class="tag legend">传奇</span>';
      rows += '<tr><td>'+o.name+'</td><td style="color:'+q.color+'">'+q.name+'</td><td>'+stage+
        ' <span style="color:#a0946e;font-size:12px">('+fmtAge(age)+')</span></td><td>'+Z.offspringIncome(o).toFixed(2)+'/s</td><td>'+tags+'</td></tr>';
    }
    const pregRows = st.pregnancies.map(p=>
      '<tr><td>'+p.name+'（待产）</td><td colspan="2">'+Z.SPECIES[p.key].name+' · '+Z.QUALITY[p.quality].name+'</td><td>还有 '+Math.max(0,Math.ceil(p.dueT-st.t))+' 秒</td><td></td></tr>').join('');
    const html = `
      <div style="font-size:14px;margin-bottom:8px">子嗣总数 <b>${st.offspring.length}</b> · 孕育中 <b>${st.pregnancies.length}</b> ·
        总收益 <b style="color:var(--green)">${Z.totalIncomeRate().toFixed(2)}/秒</b></div>
      <table class="roster"><tr><th>名字</th><th>血统</th><th>阶段</th><th>收益</th><th>状态</th></tr>
      ${pregRows}${rows || '<tr><td colspan="5" style="text-align:center;color:#a0946e;padding:20px">还没有子嗣。宙斯，出发吧。（走近生命按 E）</td></tr>'}</table>`;
    this.openModal('子嗣名录 · 宙斯的家谱', html);
  },

  /* ---------- 奥林匹斯神殿 ---------- */
  showTemple(){
    let html = '<div style="font-size:13.5px;color:#7a6a45;margin-bottom:6px">神力投资于自身，是最稳妥的多子多福。</div>';
    for (const key in Z.UPGRADES){
      const u = Z.UPGRADES[key];
      const lv = Z.state.upgrades[key];
      const maxed = lv >= u.max;
      const cost = Z.upgradeCost(key);
      const dots = '●'.repeat(lv) + '○'.repeat(u.max-lv);
      html += `<div class="upg-card ${maxed?'maxed':''}">
        <div><b style="font-size:15px">${u.name}</b> <span style="color:var(--gold)">${dots}</span>
          <div style="font-size:12.5px;color:#7a6a45">${u.desc}</div></div>
        <button class="sketch-btn ${maxed?'':'gold'}" data-upg="${key}" ${maxed||Z.state.power<cost?'disabled':''}>
          ${maxed?'已满级':'升级 '+cost}</button></div>`;
    }
    const mask = this.openModal('奥林匹斯神殿', html);
    mask.querySelectorAll('[data-upg]').forEach(btn=>{
      btn.onclick = ()=>{
        const key = btn.dataset.upg;
        const cost = Z.upgradeCost(key);
        if (Z.state.power < cost || Z.state.upgrades[key] >= Z.UPGRADES[key].max) return;
        Z.state.power -= cost;
        Z.state.upgrades[key]++;
        Z.audio.upgrade();
        Z.log('奥林匹斯神殿：「'+Z.UPGRADES[key].name+'」升至 '+Z.state.upgrades[key]+' 级。','good');
        UI.toast('⚡ '+Z.UPGRADES[key].name+' 升级！','good');
        mask.remove();
        UI.showTemple();
      };
    });
  },

  /* ---------- 神界地图 ---------- */
  showMap(){
    let html = '';
    for (const zone of Z.ZONES){
      const unlocked = Z.state.unlocked.includes(zone.id);
      const here = zone.id === Z.zeus.zone;
      const species = zone.spawns.map(s=>Z.SPECIES[s[0]].name).join('、');
      html += `<div class="upg-card" style="${unlocked?'':'opacity:.55'}">
        <div><b style="font-size:15.5px">${zone.name}</b> ${here?'<span class="tag hero">当前</span>':''}
          <div style="font-size:12.5px;color:#7a6a45">${unlocked? '可结缘：'+species : '解锁条件：神力 '+zone.unlock.toLocaleString()+'（当前 '+Math.floor(Z.state.power).toLocaleString()+'）'}</div></div>
        <button class="sketch-btn ${here?'':'gold'}" data-zone="${zone.id}" ${unlocked&&!here?'':'disabled'}>${here?'就在这里':'雷霆传送'}</button>
      </div>`;
    }
    const mask = this.openModal('神界地图', html);
    mask.querySelectorAll('[data-zone]').forEach(btn=>{
      btn.onclick = ()=>{ mask.remove(); UI.travel(btn.dataset.zone); };
    });
  },
  travel(zoneId){
    if (!Z.state.unlocked.includes(zoneId) || zoneId === Z.zeus.zone) return;
    Z.audio.zap();
    const zone = Z.zoneById(zoneId);
    Z.zeus.zone = zoneId;
    Z.zeus.x = zone.size[0]/2; Z.zeus.y = zone.size[1]/2 + 60;
    Z.zeus.tx = null;
    Z.state.peacock = null;
    UI.eventBanner('雷霆传送', '宙斯化作一道闪电，降临「'+zone.name+'」。', true);
    Z.log('宙斯传送到'+zone.name+'。');
  },

  /* ---------- 日志 / 帮助 / 存档 ---------- */
  showLog(){
    const html = '<div id="log-list">' + (Z.state.log.slice().reverse().map(l=>
      '<div><span class="t">'+l.time+'</span><span class="'+l.cls+'">'+l.text+'</span></div>').join('') ||
      '<div style="color:#a0946e;text-align:center;padding:16px">这里将记录宙斯的每一步成神之路</div>') + '</div>';
    this.openModal('编年史 · 事件日志', html);
  },
  showHelp(){
    this.openModal('帮助 · 成神指南', `
      <div class="help-sec"><h3>目标</h3><p>把神力从 <b>100</b> 攒到 <b>10000</b>，登神成为众神之父。全程约 2.5~3.5 小时，勿急。</p></div>
      <div class="help-sec"><h3>操作</h3>
        <p><kbd>W A S D</kbd> / 方向键移动 · 鼠标点击地面寻路 · <kbd>E</kbd> 与身边的生命求爱 ·
        <kbd>Q</kbd> 神界地图传送 · <kbd>H</kbd> 帮助 · <kbd>M</kbd> 静音 · <kbd>Esc</kbd> 关闭窗口</p></div>
      <div class="help-sec"><h3>多子多福</h3>
        <p>走近任意生命按 <kbd>E</kbd>，选择神力注入档位后求爱。注入越多，子嗣品质越高（凡人→半神→英雄→神裔→传奇神裔），
        品质决定每秒供给的神力。孕育 60 秒出生，成长 150 秒后达到全额收益。</p>
        <p>同一母亲反复繁殖会降低品质潜力，且她需要休息——广撒网才是王道（这很宙斯）。</p></div>
      <div class="help-sec"><h3>五片大陆</h3>
        <p>人类村庄（0）→ 精灵森林（300）→ 碧海深渊（1000）→ 神话火山（3000）→ 冥界边境（6500）。
        越往后品质上限越高、成本也越高。</p></div>
      <div class="help-sec"><h3>赫拉</h3>
        <p>子嗣越多，赫拉怒气越高，降临越频繁。孔雀出现是预警。降临时可选「神力护佑」或「忍受惩罚」
        （子嗣可能被变成牛，哞）。点击顶栏「赫拉的怒气」面板可以送礼物安抚。</p></div>
      <div class="help-sec"><h3>其他</h3>
        <p>随机事件好坏掺半；地图上的金苹果记得捡；奥林匹斯神殿的升级很值；存档每 10 秒自动进行，也可导出存档码分享。</p></div>`);
  },
  showSave(){
    const mask = this.openModal('存档', `
      <p style="font-size:14px">游戏每 10 秒自动存档（浏览器本地）。换电脑或分享进度可用存档码：</p>
      <div class="row"><button class="sketch-btn gold" id="save-now">立即存档</button></div>
      <p style="font-size:14px;margin-top:6px">导出（复制下面这串）：</p>
      <textarea id="save-export" readonly style="width:100%;height:64px;font-size:11px;font-family:monospace;border:2px solid var(--ink);border-radius:8px;padding:4px;background:#fff9ea"></textarea>
      <p style="font-size:14px">导入（粘贴后点导入，会覆盖当前进度）：</p>
      <textarea id="save-import" style="width:100%;height:64px;font-size:11px;font-family:monospace;border:2px solid var(--ink);border-radius:8px;padding:4px;background:#fff9ea"></textarea>
      <div class="row" style="justify-content:flex-end"><button class="sketch-btn" id="save-import-btn">导入存档</button></div>`);
    mask.querySelector('#save-now').onclick = ()=>{ Z.save(); };
    try{ mask.querySelector('#save-export').value = Z.exportSave(); }catch(e){}
    mask.querySelector('#save-import-btn').onclick = ()=>{
      const code = mask.querySelector('#save-import').value;
      if (Z.importSave(code)){
        Z.audio.coin();
        mask.remove();
        location.reload();
      } else UI.toast('存档码无效','bad');
    };
  },

  /* ---------- 登神结局 ---------- */
  win(){
    const st = Z.state;
    Z.audio.fanfare();
    $('win-stats').innerHTML =
      '成神用时：<b>'+fmtAge(st.t)+'</b><br>' +
      '子嗣总数：<b>'+st.offspring.length+'</b> 位（现存收益 '+Z.totalIncomeRate().toFixed(2)+'/秒）<br>' +
      '被赫拉变成牛：<b>'+st.stats.cows+'</b> 头（哞）<br>' +
      '赫拉降临：<b>'+st.hera.visits+'</b> 次 · 送出礼物：<b>'+st.stats.gifts+'</b> 份<br>' +
      '经历事件：好事 <b>'+st.stats.eventsGood+'</b> 次 · 坏事 <b>'+st.stats.eventsBad+'</b> 次<br>' +
      '求爱次数：<b>'+st.stats.courted+'</b> 次（宙斯表示毫无倦意）';
    $('win-overlay').classList.add('on');
  },

  /* ---------- 菜单动画 ---------- */
  menuAnim(on){
    if (this._menuRaf){ cancelAnimationFrame(this._menuRaf); this._menuRaf = null; }
    if (!on) return;
    const cv = $('menu-canvas'), c = cv.getContext('2d');
    const t0 = performance.now();
    const loop = ()=>{
      if ($('menu').classList.contains('hide')) return;
      const t = (performance.now()-t0)/1000;
      c.clearRect(0,0,cv.width,cv.height);
      const P = Z.draw.primitives;
      P.S(c, Z.draw.INK, 2);
      c.save(); c.translate(120, 122); c.scale(1.5,1.5); Z.draw.zeus(c, t, { power:6000 }); c.restore();
      c.save(); c.translate(250, 110+Math.sin(t*2)*8); Z.draw.species(c, 'villager', t, { love:true, seed:3 }); c.restore();
      c.save(); c.translate(340, 70+Math.sin(t*2.4)*14); Z.draw.species(c, 'eagle', t, {}); c.restore();
      c.save(); c.translate(375, 115+Math.sin(t*1.7)*10); Z.draw.species(c, 'peacock', t, { alert:false }); c.restore();
      this._menuRaf = requestAnimationFrame(loop);
    };
    loop();
  }
};

function fmtAge(sec){
  const m = Math.floor(sec/60), s = Math.floor(sec%60);
  if (m < 60) return m+' 分 '+s+' 秒';
  return Math.floor(m/60)+' 时 '+(m%60)+' 分';
}
function pick2(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

Z.ui = UI;
})();
