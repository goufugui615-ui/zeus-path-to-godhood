/* ============================================================
 * 宙斯成神之路 · 音效引擎（Web Audio 全合成，零素材）
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});

const A = {
  ctx: null,
  muted: false,
  _ensure(){
    if (this.muted) return null;
    if (!this.ctx){
      try{
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }catch(e){ return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(function(){});
    return this.ctx;
  },
  /* 基础音符 */
  tone(freq, dur, type, vol, delay, slideTo){
    const ctx = this._ensure(); if(!ctx) return;
    const t0 = ctx.currentTime + (delay||0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1,slideTo), t0+dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol||0.18, t0+0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0+dur+0.05);
  },
  /* 白噪声（雷声/掌声） */
  noise(dur, vol, filterFreq, delay, sweepTo){
    const ctx = this._ensure(); if(!ctx) return;
    const t0 = ctx.currentTime + (delay||0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type='lowpass';
    flt.frequency.setValueAtTime(filterFreq||900, t0);
    if (sweepTo) flt.frequency.exponentialRampToValueAtTime(Math.max(20,sweepTo), t0+dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol||0.25, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    src.connect(flt); flt.connect(g); g.connect(ctx.destination);
    src.start(t0); src.stop(t0+dur+0.05);
  },

  /* ============ 场景音效 ============ */
  thunder(){ // 宙斯招牌：轰隆——咔嚓！
    this.noise(0.9, 0.30, 1400, 0, 60);
    this.noise(1.4, 0.22, 500, 0.12, 40);
    this.tone(70, 0.5, 'sawtooth', 0.10, 0.02, 38);
  },
  zap(){ // 闪电传送
    this.noise(0.35, 0.20, 3200, 0, 300);
    this.tone(880, 0.18, 'square', 0.06, 0, 220);
  },
  coin(){ // 神力入账
    this.tone(988, 0.09, 'triangle', 0.14);
    this.tone(1319, 0.22, 'triangle', 0.14, 0.08);
  },
  bigCoin(){
    this.tone(784, 0.1, 'triangle', 0.15);
    this.tone(988, 0.1, 'triangle', 0.15, 0.09);
    this.tone(1319, 0.3, 'triangle', 0.16, 0.18);
  },
  heart(){ // 求爱心动
    this.tone(523, 0.1, 'sine', 0.16);
    this.tone(659, 0.12, 'sine', 0.16, 0.09);
    this.tone(784, 0.2, 'sine', 0.15, 0.19);
  },
  pop(){ // 气泡/出生
    this.tone(300, 0.07, 'sine', 0.18, 0, 720);
  },
  babyFanfare(){ // 子嗣诞生
    const notes=[523,659,784,1047];
    notes.forEach((f,i)=>this.tone(f,0.16,'triangle',0.15,i*0.11));
  },
  ominous(){ // 赫拉降临：小三和弦下行
    this.tone(311, 0.7, 'sawtooth', 0.07, 0, 300);
    this.tone(261, 0.7, 'sawtooth', 0.07, 0.3, 250);
    this.tone(207, 1.1, 'sawtooth', 0.08, 0.6, 190);
    this.noise(1.6, 0.06, 300, 0, 80);
  },
  angry(){ // 赫拉施罚
    this.tone(180, 0.3, 'square', 0.10, 0, 90);
    this.noise(0.5, 0.18, 700, 0.05, 100);
  },
  shield(){ // 护佑成功
    this.tone(440, 0.15, 'sine', 0.15, 0, 660);
    this.tone(660, 0.25, 'sine', 0.13, 0.12, 880);
  },
  ding(){ // 事件提示
    this.tone(1175, 0.3, 'sine', 0.12);
  },
  badDing(){
    this.tone(311, 0.25, 'sine', 0.13);
    this.tone(233, 0.35, 'sine', 0.12, 0.12);
  },
  click(){ // 按钮
    this.tone(600, 0.04, 'square', 0.05);
  },
  upgrade(){ // 升级
    [392,494,587,784].forEach((f,i)=>this.tone(f,0.14,'triangle',0.14,i*0.08));
  },
  moo(){ // 牛：哞——（赫拉受害者专用）
    this.tone(160, 0.55, 'sawtooth', 0.12, 0, 120);
    this.tone(82, 0.6, 'sine', 0.10, 0.05, 70);
  },
  fanfare(){ // 登神！
    const seq=[[523,0],[523,0.13],[523,0.26],[659,0.42],[784,0.62],[659,0.82],[784,0.95],[1047,1.15]];
    seq.forEach(p=>{this.tone(p[0],0.3,'triangle',0.16,p[1]); this.tone(p[0]*2,0.3,'sine',0.05,p[1]);});
    this.thunder();
  },
  peacock(){ // 孔雀先兆
    this.tone(1200, 0.12, 'sine', 0.08, 0, 900);
    this.tone(1000, 0.14, 'sine', 0.07, 0.15, 700);
  }
};

A.setMuted = function(m){
  this.muted = m;
  const btn = document.getElementById('btn-sound');
  if (btn) btn.textContent = m ? '♪ 关' : '♪ 开';
};
A.toggle = function(){ this.setMuted(!this.muted); };

Z.audio = A;
})();
