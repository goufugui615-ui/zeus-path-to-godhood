/* ============================================================
 * 宙斯成神之路 · 手绘线条渲染器（精绘版 v2）
 * 所有角色/装饰均为 Canvas 程序化钢笔线条画，零图片素材。
 * 约定：角色坐标系以脚底为原点 (0,0)，向上为负 y。
 * v2 升级：五官细化（眉/瞳/睫/鼻/唇/腮红）、身形比例、发丝与衣褶、
 *          按缩放自动 LOD，新增参数化四足/鸟类/游鱼/虫豸/蛇形绘制器。
 * ============================================================ */
(function(){
'use strict';
const Z = (window.Z = window.Z || {});
const INK = '#2b2b33';

/* ---------- 基础笔触 ---------- */
function S(ctx, color, w, alpha){
  ctx.strokeStyle = color || INK;
  ctx.lineWidth = w || 2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = (alpha==null?1:alpha);
}
function L(ctx, pts, close){
  ctx.beginPath();
  for (let i=0;i<pts.length;i++){ i?ctx.lineTo(pts[i][0],pts[i][1]):ctx.moveTo(pts[i][0],pts[i][1]); }
  if (close) ctx.closePath();
  ctx.stroke();
}
function C(ctx, cx, cy, r, fill, fillAlpha){
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  if (fill){ ctx.save(); ctx.globalAlpha = fillAlpha==null?0.18:fillAlpha; ctx.fillStyle=fill; ctx.fill(); ctx.restore(); }
}
function E(ctx, cx, cy, rx, ry, fill, fillAlpha){
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.stroke();
  if (fill){ ctx.save(); ctx.globalAlpha = fillAlpha==null?0.18:fillAlpha; ctx.fillStyle=fill; ctx.fill(); ctx.restore(); }
}
/* 路径 + 填充（衣物、身躯） */
function FP(ctx, pts, fill, alpha, close){
  ctx.beginPath();
  for (let i=0;i<pts.length;i++){ i?ctx.lineTo(pts[i][0],pts[i][1]):ctx.moveTo(pts[i][0],pts[i][1]); }
  if (close!==false) ctx.closePath();
  if (fill){ ctx.save(); ctx.globalAlpha = alpha==null?0.18:alpha; ctx.fillStyle=fill; ctx.fill(); ctx.restore(); }
  ctx.stroke();
}
/* 排线阴影 */
function hatch(ctx, x, y, w, h, n, alpha, color){
  if (n<=0) return;
  ctx.save(); S(ctx, color||INK, 1, alpha==null?0.22:alpha);
  for (let i=0;i<n;i++){ const px = x + w*i/Math.max(1,n-1); L(ctx,[[px,y],[px+w*0.35,y+h]]); }
  ctx.restore();
}
function shadow(ctx, w){
  ctx.save(); S(ctx, 'rgba(43,43,51,1)', 1.4, 0.18);
  ctx.beginPath(); ctx.ellipse(0, 2, w, w*0.32, 0, 0, Math.PI*2); ctx.stroke(); ctx.restore();
}
/* 当前缩放（LOD 依据） */
function lod(ctx){
  try{ const m = ctx.getTransform ? ctx.getTransform() : null;
    const a = m ? Math.max(Math.abs(m.a), Math.abs(m.d)) : 1;
    return Math.max(0.6, Math.min(3, a||1)); }catch(e){ return 1; }
}

/* ---------- 精绘五官 ---------- */
function face(ctx, x, y, mood, blink, o){
  o = o||{};
  const D = o.lod || 1;
  const ex0 = o.eyeDx || 2.7;
  const happy = (mood===true || mood==='happy');
  const angry = (mood==='angry');
  /* —— 远景（地图上的小人）：简笔两点眼，保证清晰不糊 —— */
  if (D < 1.0){
    S(ctx, INK, 1.5);
    if (blink){ L(ctx,[[x-ex0-1.1,y-0.2],[x-ex0+1.1,y-0.5]]); L(ctx,[[x+ex0-1.1,y-0.5],[x+ex0+1.1,y-0.2]]); }
    else { ctx.save(); ctx.fillStyle = INK; ctx.globalAlpha = 0.88;
      ctx.beginPath(); ctx.arc(x-ex0, y, 1.05, 0, Math.PI*2); ctx.stroke(); ctx.fill();
      ctx.beginPath(); ctx.arc(x+ex0, y, 1.05, 0, Math.PI*2); ctx.stroke(); ctx.fill(); ctx.restore(); }
    S(ctx, INK, 1.25);
    ctx.beginPath();
    if (happy){ ctx.moveTo(x-1.9,y+4.6); ctx.quadraticCurveTo(x,y+6.2,x+1.9,y+4.6); }
    else if (angry){ ctx.moveTo(x-1.8,y+5.4); ctx.lineTo(x+1.8,y+5.4); }
    else { ctx.moveTo(x-1.6,y+5.2); ctx.lineTo(x+1.6,y+5.2); }
    ctx.stroke();
    return;
  }
  /* —— 近景（立绘/求爱）：精修五官 —— */
  /* 眉 */
  S(ctx, o.browColor||INK, 1.5, 0.9);
  if (angry){ L(ctx,[[x-ex0-2.4,y-3.4],[x-ex0+1.3,y-2.4]]); L(ctx,[[x+ex0+2.4,y-3.4],[x+ex0-1.3,y-2.4]]); }
  else { L(ctx,[[x-ex0-2.5,y-4.1],[x-ex0+1.6,y-4.7]]); L(ctx,[[x+ex0+2.5,y-4.1],[x+ex0-1.6,y-4.7]]); }
  /* 眼（杏仁形 + 瞳孔 + 高光 + 睫毛） */
  const er = 1.55;
  for (let s=-1; s<=1; s+=2){
    const ex = x + s*ex0;
    if (blink){ S(ctx, INK, 1.4); L(ctx,[[ex-er,y-0.2],[ex+er,y-0.5]]); continue; }
    S(ctx, INK, 1.3);
    ctx.beginPath();
    ctx.moveTo(ex-er, y);
    ctx.quadraticCurveTo(ex, y-2.2, ex+er, y);
    ctx.quadraticCurveTo(ex, y+1.6, ex-er, y);
    ctx.stroke();
    if (!happy){
      ctx.save(); ctx.fillStyle = o.iris||INK; ctx.globalAlpha = 0.92;
      ctx.beginPath(); ctx.arc(ex, y-0.1, er*0.6, 0, Math.PI*2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.fillStyle='#fff'; ctx.globalAlpha=0.85;
      ctx.beginPath(); ctx.arc(ex+0.6, y-0.7, 0.42, 0, Math.PI*2); ctx.fill(); ctx.restore();
      S(ctx, INK, 0.9); L(ctx,[[ex+er*0.85,y-1.0],[ex+er*1.75,y-2.0]]);
    }
  }
  /* 鼻 */
  S(ctx, INK, 1.15, 0.8);
  ctx.beginPath(); ctx.moveTo(x+0.5, y+1.5);
  ctx.quadraticCurveTo(x+1.8, y+3.0, x+0.1, y+3.2); ctx.stroke();
  /* 嘴 */
  S(ctx, INK, 1.4);
  ctx.beginPath();
  if (happy){ ctx.moveTo(x-2.5,y+5.0); ctx.quadraticCurveTo(x, y+7.4, x+2.5, y+5.0); }
  else if (mood==='sad'){ ctx.moveTo(x-2.2,y+6.6); ctx.quadraticCurveTo(x, y+4.6, x+2.2,y+6.6); }
  else { ctx.moveTo(x-1.9,y+5.8); ctx.lineTo(x+1.9,y+5.8); }
  ctx.stroke();
  S(ctx, INK, 1, 0.3); L(ctx,[[x-1.1,y+6.9],[x+1.1,y+6.9]]);
  /* 腮红 */
  if (o.blush!==false){
    ctx.save(); S(ctx,'#d98a8a',1.1,0.32);
    for (let s=-1;s<=1;s+=2) for (let i=0;i<2;i++)
      L(ctx,[[x+s*(4.4+i*0.9), y+3.0],[x+s*(5.2+i*0.9), y+3.7]]);
    ctx.restore();
  }
}

/* ---------- 头发（含发丝） ---------- */
function hair(ctx, hy, cfg){
  const D = cfg.lod||1;
  const col = cfg.color||INK;
  S(ctx, col, 2);
  ctx.beginPath(); ctx.arc(0, hy-1, cfg.r||8.8, Math.PI*0.95, Math.PI*2.05); ctx.stroke();
  /* 刘海 */
  S(ctx, col, 1.7);
  L(ctx,[[-8,hy-3],[-4.5,hy-6.5],[-1,hy-3.5]]);
  L(ctx,[[1,hy-3.5],[4.5,hy-6.5],[8,hy-3]]);
  if (D>1.02){ /* 发丝 */
    S(ctx, col, 1, 0.75);
    L(ctx,[[-7,hy-5],[-3,hy-8.5],[0.5,hy-6]]);
    L(ctx,[[2,hy-7],[5.5,hy-9],[7.5,hy-5.5]]);
  }
  if (cfg.long){
    S(ctx, col, 2);
    L(ctx,[[-8,hy-2],[-9.5,hy+12],[-6.5,hy+15]]);
    L(ctx,[[8,hy-2],[9.5,hy+12],[6.5,hy+15]]);
    if (D>1.02){ S(ctx, col, 1.1, 0.7);
      L(ctx,[[-8.6,hy+4],[-6,hy+10]]); L(ctx,[[8.6,hy+4],[6,hy+10]]); }
  }
  if (cfg.bun){ C(ctx, 0, hy-11, 3.6, col, 0.25); }
  if (cfg.braid){ S(ctx, col, 1.8); L(ctx,[[8,hy+2],[11,hy+9],[8.5,hy+15]]); C(ctx,8.5,hy+16,1.6); }
}
function hearts(ctx, x, y, t, seed){
  const ph = (t*1.4 + (seed||0)*2.1) % (Math.PI*2);
  const a = Math.sin(ph)*0.5+0.5;
  const yy = y - 8 - a*7;
  ctx.save(); S(ctx, '#d0506a', 1.6, 0.35+a*0.5);
  const s = 2.2+a*1.2, dx = Math.sin(ph*0.7)*3;
  drawHeart(ctx, x+dx, yy, s); ctx.restore();
}
function drawHeart(ctx, x, y, s){
  ctx.beginPath();
  ctx.moveTo(x, y+s*0.9);
  ctx.bezierCurveTo(x-s*1.3, y-s*0.4, x-s*0.5, y-s*1.1, x, y-s*0.35);
  ctx.bezierCurveTo(x+s*0.5, y-s*1.1, x+s*1.3, y-s*0.4, x, y+s*0.9);
  ctx.stroke();
}
function zzz(ctx, x, y, t){
  const a = (Math.sin(t*2)+1)/2;
  ctx.save(); S(ctx, '#7a6a45', 1.5, 0.5);
  ctx.font = '11px KaiTi, serif'; ctx.fillStyle = '#7a6a45';
  ctx.fillText('z', x, y-46-a*6); ctx.fillText('Z', x+7, y-54-a*9);
  ctx.restore();
}
function leaf(ctx,x,y,s){
  ctx.beginPath(); ctx.moveTo(x,y-s); ctx.quadraticCurveTo(x+s,y,x,y+s); ctx.quadraticCurveTo(x-s,y,x,y-s); ctx.closePath(); ctx.stroke();
}
function drawSpark(ctx,x,y,t){
  const r=2.5+Math.sin(t*4)*1;
  ctx.beginPath();
  for(let i=0;i<4;i++){ const a=i*Math.PI/2+t; ctx.moveTo(x+Math.cos(a)*r*0.4,y+Math.sin(a)*r*0.4); ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); }
  ctx.stroke();
}
function drawBolt(ctx, x, y, s){
  ctx.beginPath();
  ctx.moveTo(x, y-s); ctx.lineTo(x-s*0.45, y-s*0.1); ctx.lineTo(x+s*0.1, y-s*0.05);
  ctx.lineTo(x-s*0.15, y+s); ctx.lineTo(x+s*0.5, y-s*0.05); ctx.lineTo(x-s*0.05, y);
  ctx.closePath(); ctx.stroke();
}

/* ============ 通用人形（精绘） ============ */
function human(ctx, t, o, cfg){
  cfg = cfg||{};
  const D = cfg.lod || lod(ctx);
  const bob = Math.sin(t*2 + (o.seed||0))*1.2;
  const walk = o.moving? Math.sin(t*8+(o.seed||0))*3 : 0;
  shadow(ctx, cfg.shadowW||11);
  ctx.save(); ctx.translate(0, bob*0.35);
  S(ctx, INK, 2);
  /* 腿（大腿-膝-小腿-脚） */
  if (!cfg.noLegs && !cfg.tail){
    for (let s=-1;s<=1;s+=2){
      const kx = s*3.2, fx = s*(4+walk*0.5*(s>0?1:-1));
      L(ctx,[[s*3.4,-20],[kx,-11],[fx,-1]]);
      L(ctx,[[fx,-1],[fx+s*2.6,-0.4]]);            /* 脚 */
      if (D>1.02){ S(ctx,INK,1,0.6); L(ctx,[[fx-1.2,-3.2],[fx+1.6,-3.2]]); S(ctx,INK,2); } /* 凉鞋带 */
    }
  }
  /* 裙 / 长袍（A 字 + 弧形下摆） */
  const skirt = !!cfg.skirt;
  const hemY = skirt? -20 : -19;
  const hemW = skirt? 10.5 : 8;
  ctx.beginPath();
  ctx.moveTo(-6.2,-41);
  ctx.quadraticCurveTo(skirt?-11:-9, -30, -hemW, hemY-1.5);
  ctx.quadraticCurveTo(-hemW*0.4, hemY+1.6, 0, hemY+1.6);
  ctx.quadraticCurveTo(hemW*0.4, hemY+1.6, hemW, hemY-1.5);
  ctx.quadraticCurveTo(skirt?11:9, -30, 6.2,-41);
  ctx.closePath();
  if (cfg.dressColor){ ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle=cfg.dressColor; ctx.fill(); ctx.restore(); }
  ctx.stroke();
  /* 衣褶 + 腰带（远景不画，避免糊成一团） */
  if (D >= 1.0){
    S(ctx, INK, 1, 0.38);
    L(ctx,[[-3.6,-38],[-4.4,-25]]); L(ctx,[[4.4,-38],[5,-26]]);
  }
  if (cfg.belt!==false){
    S(ctx, cfg.beltColor||'#a8863a', 1.5, 0.85);
    L(ctx,[[-6.4,-34],[6.4,-34]]);
    if (D >= 1.0){ S(ctx, INK, 1, 0.3); L(ctx,[[-6.4,-32.4],[6.4,-32.4]]); }
  }
  S(ctx, INK, 2);
  /* 腰身收束 */
  L(ctx,[[-6.2,-41],[-5.6,-34]]); L(ctx,[[6.2,-41],[5.6,-34]]);
  /* 手臂（肩-肘-腕 + 手） */
  for (let s=-1;s<=1;s+=2){
    const ax = s*6.4, ay=-38.5;
    const ex_ = s*(cfg.armOut||11), ey_ = (s<0? -32 : -33);
    const wx = s*(cfg.handOut||8.5), wy = (s<0? -27 : -28);
    L(ctx,[[ax,ay],[ex_,ey_],[wx,wy]]);
    if (D>0.95){ /* 手：掌 + 三指 */
      S(ctx, INK, 1.2);
      L(ctx,[[wx,wy],[wx+s*1.6,wy+2.6]]);
      L(ctx,[[wx+s*0.6,wy+2.4],[wx+s*2.6,wy+2.0]]);
      S(ctx, INK, 2);
    }
  }
  /* 颈 */
  S(ctx, INK, 1.6); L(ctx,[[-1.6,-43],[-1.6,-45.5]]); L(ctx,[[1.6,-43],[1.6,-45.5]]);
  /* 头（带下颌的椭圆） */
  const hy = -49.5;
  ctx.beginPath();
  ctx.moveTo(-6.6, hy-2.2);
  ctx.quadraticCurveTo(-6.8, hy-8.6, 0, hy-8.6);
  ctx.quadraticCurveTo(6.8, hy-8.6, 6.6, hy-2.2);
  ctx.quadraticCurveTo(3.4, hy+6.2, 0, hy+6.2);
  ctx.quadraticCurveTo(-3.4, hy+6.2, -6.6, hy-2.2);
  ctx.closePath();
  if (cfg.skin){ ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle=cfg.skin; ctx.fill(); ctx.restore(); }
  ctx.stroke();
  /* 耳 */
  if (cfg.ear!==false){ S(ctx, INK, 1.2);
    C(ctx,-6.7,hy-1,1.3); C(ctx,6.7,hy-1,1.3); }
  if (cfg.hair) hair(ctx, hy, { color:cfg.hairColor||INK, long:cfg.longHair, r:8.9, lod:D, bun:cfg.bun, braid:cfg.braid });
  face(ctx, 0, hy+1, o.love?true:(cfg.mood||null), Math.sin(t*0.9+(o.seed||0))>0.97, { lod:D, blush:cfg.blush });
  if (cfg.extra) cfg.extra(ctx, t, o, hy, D);
  if (o.love) hearts(ctx, 0, hy-15, t, o.seed||0);
  if (o.rest) zzz(ctx, 6, 0, t);
  if (o.pregnant){ ctx.save(); S(ctx,'#b8860b',1.6,0.85); C(ctx,0,-27,4.5,'#ffd94a',0.3); ctx.restore(); }
  ctx.restore();
}
/* 兼容旧名 */
const girl = human;

/* ============ 宙斯（精绘） ============ */
function drawZeus(ctx, t, o){
  o = o||{};
  const D = lod(ctx);
  const bob = Math.sin(t*2.2)*2;
  const walk = o.moving ? Math.sin(t*10)*4 : 0;
  shadow(ctx, 15);
  ctx.save(); ctx.translate(0, bob-2);
  S(ctx, INK, 2.2);
  /* 神力光环 */
  const glow = Math.min(1, (o.power||100)/10000);
  ctx.save(); S(ctx, '#d4a017', 1.6, 0.25+glow*0.5);
  E(ctx, 0, -66, 13+glow*3, 4.5, '#ffd94a', 0.08+glow*0.15); ctx.restore();
  S(ctx, INK, 2.2);
  /* 腿 + 凉鞋 */
  for (let s=-1;s<=1;s+=2){
    const fx = s*5 + walk*0.6*s;
    L(ctx,[[s*4,-24],[s*4.6,-12],[fx,-2]]);
    L(ctx,[[fx,-2],[fx+s*3,-0.6]]);
    if (D>1.0){ S(ctx,'#a8863a',1.2,0.85);
      L(ctx,[[fx-2,-6],[fx+2,-6]]); L(ctx,[[fx-2,-6],[fx,-9]]); L(ctx,[[fx+2,-6],[fx,-9]]); S(ctx,INK,2.2); }
  }
  /* 托加长袍（斜襟 + 褶皱） */
  FP(ctx, [[-9.5,-48],[-13,-30],[-10,-20],[10,-20],[13,-30],[9.5,-48]], '#d4a017', 0.14);
  S(ctx, INK, 1.1, 0.55);
  L(ctx,[[-6,-46],[-8,-24]]); L(ctx,[[-1,-46],[-2.5,-24]]); L(ctx,[[4,-46],[5.5,-25]]);
  /* 斜披的希玛申 */
  S(ctx, INK, 1.8);
  L(ctx,[[-9,-46],[-12,-34],[-6,-30]]);
  if (D>1.0){ S(ctx,INK,1,0.4); L(ctx,[[-10.5,-40],[-7.5,-36]]); }
  S(ctx, INK, 2.1);
  /* 腰带 */
  S(ctx,'#a8863a',1.7,0.9); L(ctx,[[-9.6,-33],[9.6,-33]]); S(ctx,INK,2.1);
  /* 手臂：左叉腰，右举闪电 */
  L(ctx,[[-9,-44],[-15,-36],[-9,-31]]);
  L(ctx,[[9,-44],[16,-52],[15,-58]]);
  /* 手（右） */
  if (D>0.95){ S(ctx,INK,1.3); L(ctx,[[15,-58],[13.2,-56.2]]); L(ctx,[[15,-58],[17,-56]]); S(ctx,INK,2.1); }
  /* 闪电（带辉光） */
  ctx.save(); S(ctx, '#b8860b', 2.2); L(ctx,[[15,-58],[11,-52],[17,-50],[12,-42]]);
  if (D>0.95){ S(ctx,'#ffd94a',1,0.55); L(ctx,[[13.4,-56],[12,-50],[15,-49],[12.4,-44]]); }
  ctx.restore();
  if (o.moving){ ctx.save(); S(ctx,'#ffd94a',1.4,0.7); drawBolt(ctx, 15+Math.sin(t*22)*2, -64, 7); ctx.restore(); }
  /* 头 */
  const hy = -55;
  ctx.beginPath();
  ctx.moveTo(-7.4, hy-2.2);
  ctx.quadraticCurveTo(-7.6, hy-9.4, 0, hy-9.4);
  ctx.quadraticCurveTo(7.6, hy-9.4, 7.4, hy-2.2);
  ctx.quadraticCurveTo(3.8, hy+6.6, 0, hy+6.6);
  ctx.quadraticCurveTo(-3.8, hy+6.6, -7.4, hy-2.2);
  ctx.closePath();
  ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='#f4ecd8'; ctx.fill(); ctx.restore(); ctx.stroke();
  /* 大胡子（多缕卷须） */
  ctx.beginPath();
  ctx.moveTo(-6.4, hy+1);
  ctx.quadraticCurveTo(-8, hy+9, 0, hy+11.5);
  ctx.quadraticCurveTo(8, hy+9, 6.4, hy+1);
  ctx.stroke();
  ctx.save(); ctx.globalAlpha=0.18; ctx.fillStyle='#cfcfcf'; ctx.fill(); ctx.restore();
  if (D >= 1.0){ S(ctx, INK, 1, 0.5);
    L(ctx,[[-3.4,hy+2],[-4,hy+8]]); L(ctx,[[0,hy+3],[0,hy+10]]); L(ctx,[[3.4,hy+2],[4,hy+8]]); }
  /* 八字胡 */
  S(ctx, INK, 1.5);
  L(ctx,[[-4,hy+2.2],[-1,hy+3.6]]); L(ctx,[[4,hy+2.2],[1,hy+3.6]]);
  face(ctx, 0, hy, o.happy?true:null, Math.sin(t*0.7)>0.97, { lod:D, eyeDx:2.9 });
  /* 卷发 */
  S(ctx, INK, 2);
  ctx.beginPath(); ctx.arc(0, hy-2, 9.4, Math.PI*0.98, Math.PI*2.02); ctx.stroke();
  if (D >= 1.0){ S(ctx, INK, 1.4, 0.8);
    for (let i=0;i<4;i++){ const a=Math.PI*1.05+i*0.32; const x0=Math.cos(a)*9, y0=hy-2+Math.sin(a)*9;
      C(ctx, x0, y0-1.4, 1.7); } }
  /* 桂冠（叶片） */
  S(ctx, '#4a6b3a', 1.8);
  ctx.beginPath(); ctx.arc(0, hy-1.5, 10.2, Math.PI*1.05, Math.PI*1.95); ctx.stroke();
  for (let i=0;i<5;i++){ const a = Math.PI*1.1 + i*0.2;
    const lx = Math.cos(a)*11.2, ly = hy-1.5+Math.sin(a)*11.2;
    leaf(ctx, lx, ly, 2.6); }
  ctx.restore();
}

/* ============ 参数化动物绘制器 ============ */
/* 四足：cfg {scale, coat, accent, spots, horn, tail, ear, udder, mane, snout, eye} */
function beast4(ctx, t, o, cfg){
  cfg = cfg||{};
  const D = lod(ctx), s = cfg.scale||1;
  const walk = o.moving? Math.sin(t*7+(o.seed||0))*3 : 0;
  const bw = 11*s, bh = 8*s, by = -18*s, hx = 13*s, hy = -27*s;
  shadow(ctx, 12*s);
  S(ctx, INK, 2);
  /* 远侧腿 */
  S(ctx, INK, 1.7, 0.75);
  L(ctx,[[-bw*0.7, by+bh*0.6],[-bw*0.7-walk*0.3, 0]]);
  L(ctx,[[bw*0.55, by+bh*0.6],[bw*0.55+walk*0.3, 0]]);
  S(ctx, INK, 2);
  /* 身躯 */
  ctx.beginPath();
  ctx.moveTo(-bw, by-bh*0.3);
  ctx.quadraticCurveTo(-bw*1.05, by-bh, -bw*0.2, by-bh*1.15);
  ctx.quadraticCurveTo(bw*0.7, by-bh*1.25, bw*0.95, by-bh*0.45);
  ctx.quadraticCurveTo(bw*1.05, by+bh*0.5, bw*0.5, by+bh*0.75);
  ctx.lineTo(-bw*0.7, by+bh*0.75);
  ctx.quadraticCurveTo(-bw*1.05, by+bh*0.5, -bw, by-bh*0.3);
  ctx.closePath();
  if (cfg.coat){ ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle=cfg.coat; ctx.fill(); ctx.restore(); }
  ctx.stroke();
  /* 花纹 */
  if (cfg.spots){ ctx.save(); S(ctx, cfg.accent||'#4a3a2b', 1.4, 0.55);
    C(ctx,-bw*0.35, by-bh*0.35, 2.4*s, cfg.accent, 0.35);
    C(ctx, bw*0.28, by+bh*0.1, 1.9*s, cfg.accent, 0.35);
    if (D>1.0) C(ctx,-bw*0.05, by+bh*0.45, 1.6*s, cfg.accent, 0.3);
    ctx.restore(); S(ctx, INK, 2); }
  if (cfg.stripes){ ctx.save(); S(ctx, cfg.accent||'#3a3a3a', 1.5, 0.5);
    for (let i=0;i<3;i++){ const x=-bw*0.5+i*4.4*s; L(ctx,[[x,by-bh*1.05],[x+1.2*s,by+bh*0.5]]); }
    ctx.restore(); S(ctx, INK, 2); }
  /* 乳房（母畜） */
  if (cfg.udder){ S(ctx, INK, 1.2, 0.7); E(ctx,-bw*0.15, by+bh*0.78, 2.2*s, 1.5*s, '#e8c8c8', 0.35); S(ctx, INK, 2); }
  /* 尾巴 */
  if (cfg.tail!==false){
    S(ctx, INK, 1.8);
    const tw = Math.sin(t*2.4+(o.seed||0))*2.5;
    if (cfg.tail==='tuft'){ L(ctx,[[-bw,by-bh*0.5],[-bw-5*s,by-bh*0.2+tw],[-bw-6*s,by+bh*0.6+tw]]);
      S(ctx, INK, 1.4); L(ctx,[[-bw-6*s,by+bh*0.6+tw],[-bw-7.5*s,by+bh*1.1+tw]]); }
    else if (cfg.tail==='curl'){ ctx.beginPath(); ctx.moveTo(-bw,by-bh*0.4);
      ctx.quadraticCurveTo(-bw-7*s,by-bh*0.9+tw,-bw-4*s,by+bh*0.2+tw); ctx.stroke(); }
    else if (cfg.tail==='plume'){ L(ctx,[[-bw,by-bh*0.6],[-bw-6*s,by-bh*1.1+tw],[-bw-8*s,by+bh*0.4+tw]]); }
    else { L(ctx,[[-bw,by-bh*0.4],[-bw-6*s,by-bh*0.1+tw],[-bw-5*s,by+bh*0.7+tw]]); }
  }
  /* 近侧腿 */
  S(ctx, INK, 2);
  L(ctx,[[-bw*0.35, by+bh*0.6],[-bw*0.35+walk*0.5, 0]]);
  L(ctx,[[bw*0.85, by+bh*0.6],[bw*0.85-walk*0.5, 0]]);
  if (D>0.95){ /* 蹄 */
    S(ctx, INK, 1.6, 0.8);
    L(ctx,[[-bw*0.35+walk*0.5-1.6,0],[-bw*0.35+walk*0.5+1.6,0]]);
    L(ctx,[[bw*0.85-walk*0.5-1.6,0],[bw*0.85-walk*0.5+1.6,0]]);
  }
  /* 颈 + 头（椭圆头 + 吻部，避免出现"甜甜圈"轮廓） */
  S(ctx, INK, 2);
  L(ctx,[[bw*0.8, by-bh*0.9],[hx-2.4*s, hy+2.6*s]]);
  E(ctx, hx, hy, 4.8*s, 4.0*s, cfg.coat, 0.3);
  S(ctx, INK, 1.8);
  ctx.beginPath();
  if (cfg.snout==='long'){ ctx.moveTo(hx+2.6*s,hy-1.4*s); ctx.quadraticCurveTo(hx+9.6*s,hy-0.8*s,hx+9.2*s,hy+1.8*s);
    ctx.quadraticCurveTo(hx+8.6*s,hy+4.2*s,hx+2.4*s,hy+3.6*s); }
  else { ctx.moveTo(hx+2.6*s,hy-1.6*s); ctx.quadraticCurveTo(hx+6.8*s,hy-1.0*s,hx+6.4*s,hy+1.8*s);
    ctx.quadraticCurveTo(hx+5.8*s,hy+4.0*s,hx+2.4*s,hy+3.6*s); }
  ctx.closePath();
  ctx.save(); ctx.globalAlpha=0.32; ctx.fillStyle=cfg.coat; ctx.fill(); ctx.restore(); ctx.stroke();
  /* 鼻孔 + 嘴 */
  S(ctx, INK, 1, 0.7);
  const snx = hx + (cfg.snout==='long'?7.4:5.2)*s;
  C(ctx, snx, hy+0.6*s, 0.7);
  L(ctx,[[snx-1.6*s, hy+3.0*s],[snx+1.4*s, hy+3.0*s]]);
  /* 耳 */
  S(ctx, INK, 1.8);
  if (cfg.ear==='long'){ E(ctx, hx-3.4*s, hy-3.6*s, 1.8*s, 4.4*s, cfg.coat, 0.22); }
  else if (cfg.ear==='point'){ L(ctx,[[hx-3.2*s,hy-3.4*s],[hx-5.4*s,hy-8.6*s],[hx-0.4*s,hy-5.4*s]]); }
  else if (cfg.ear==='round'){ C(ctx, hx-4.2*s, hy-4.6*s, 2.2*s, cfg.coat, 0.22); }
  else { C(ctx, hx-3.2*s, hy-4.2*s, 1.7*s, cfg.coat, 0.22); }
  /* 角 */
  if (cfg.horn){
    S(ctx, cfg.hornColor||'#c8b89a', 2);
    if (cfg.horn==='curved'){ ctx.beginPath(); ctx.moveTo(hx-0.6*s,hy-3.6*s); ctx.quadraticCurveTo(hx-3*s,hy-9.5*s,hx+2*s,hy-10.5*s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx+3.6*s,hy-3.6*s); ctx.quadraticCurveTo(hx+6*s,hy-9.5*s,hx+11*s,hy-9.5*s); ctx.stroke(); }
    else if (cfg.horn==='straight'){ L(ctx,[[hx-1.4*s,hy-3.8*s],[hx-3.4*s,hy-10*s]]); L(ctx,[[hx+3.2*s,hy-3.8*s],[hx+5*s,hy-10*s]]); }
    else if (cfg.horn==='antler'){ L(ctx,[[hx-1*s,hy-3.8*s],[hx-3*s,hy-11*s]]); L(ctx,[[hx-2.4*s,hy-8*s],[hx-6.4*s,hy-9.6*s]]);
      L(ctx,[[hx+3*s,hy-3.8*s],[hx+5*s,hy-11*s]]); L(ctx,[[hx+4.4*s,hy-8*s],[hx+8.4*s,hy-9.6*s]]); }
    else if (cfg.horn==='spiral'){ ctx.beginPath(); ctx.moveTo(hx-1*s,hy-3.8*s);
      ctx.quadraticCurveTo(hx-5.4*s,hy-9*s,hx-2*s,hy-11*s); ctx.stroke(); }
  }
  /* 鬃毛 */
  if (cfg.mane){ S(ctx, cfg.maneColor||INK, 1.6, 0.85);
    for (let i=0;i<4;i++){ const px = bw*0.55 - i*1.6*s, py = by-bh*1.05 - i*1.2*s;
      L(ctx,[[px,py],[px-2.4*s,py-3.4*s]]); } S(ctx, INK, 2); }
  /* 眼 */
  S(ctx, INK, 1.5);
  C(ctx, hx+1.4*s, hy+0.4*s, 1.5, cfg.eye||INK, 0.85);
  if (D>1.0){ ctx.save(); ctx.fillStyle='#fff'; ctx.globalAlpha=0.8;
    ctx.beginPath(); ctx.arc(hx+1.9*s, hy-0.1*s, 0.45, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
  if (o.love) hearts(ctx, hx, hy-14*s, t, o.seed||0);
  if (o.rest) zzz(ctx, hx, 0, t);
  if (o.pregnant){ ctx.save(); S(ctx,'#b8860b',1.6,0.85); C(ctx,-bw*0.2, by+bh*0.3, 4*s,'#ffd94a',0.3); ctx.restore(); }
}
/* 鸟类：cfg {scale, coat, accent, comb, wattle, beak, crest, tail, plume} */
function beastBird(ctx, t, o, cfg){
  cfg = cfg||{};
  const D = lod(ctx), s = cfg.scale||1;
  const walk = o.moving? Math.sin(t*9+(o.seed||0))*2.5 : 0;
  const bob = Math.sin(t*3+(o.seed||0))*1.2;
  shadow(ctx, 9*s);
  S(ctx, INK, 2);
  /* 腿 */
  S(ctx, cfg.legColor||'#c8863a', 1.8);
  L(ctx,[[-1.5*s,-8*s],[-1.5*s+walk*0.4,-1]]); L(ctx,[[2.5*s,-8*s],[2.5*s-walk*0.4,-1]]);
  L(ctx,[[-1.5*s+walk*0.4,-1],[-4*s,-1]]); L(ctx,[[2.5*s-walk*0.4,-1],[5*s,-1]]);
  /* 身体 */
  S(ctx, INK, 2);
  ctx.beginPath();
  ctx.moveTo(-8*s,-12*s+bob);
  ctx.quadraticCurveTo(-9*s,-22*s+bob, 0, -24*s+bob);
  ctx.quadraticCurveTo(8*s,-25*s+bob, 8*s,-16*s+bob);
  ctx.quadraticCurveTo(7*s,-8*s+bob, 0,-8*s+bob);
  ctx.quadraticCurveTo(-7*s,-8*s+bob, -8*s,-12*s+bob);
  ctx.closePath();
  if (cfg.coat){ ctx.save(); ctx.globalAlpha=0.22; ctx.fillStyle=cfg.coat; ctx.fill(); ctx.restore(); }
  ctx.stroke();
  /* 翅（羽毛线） */
  S(ctx, INK, 1.8);
  ctx.beginPath(); ctx.moveTo(-3*s,-20*s+bob);
  ctx.quadraticCurveTo(-8*s,-16*s+bob,-7*s,-10*s+bob);
  ctx.quadraticCurveTo(-1*s,-9*s+bob,-2*s,-17*s+bob); ctx.stroke();
  if (D>0.95){ S(ctx, INK, 1, 0.5);
    L(ctx,[[-5*s,-18*s+bob],[-5.6*s,-12.5*s+bob]]); L(ctx,[[-3.6*s,-18.4*s+bob],[-4.2*s,-13*s+bob]]); }
  /* 尾羽 */
  S(ctx, INK, 1.9);
  if (cfg.tail==='fan'){ for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(-7*s,-18*s+bob);
      ctx.quadraticCurveTo(-15*s,-24*s+bob+i*4*s,-17*s,-19*s+bob+i*5*s); ctx.stroke(); } }
  else { ctx.beginPath(); ctx.moveTo(-7*s,-19*s+bob);
    ctx.quadraticCurveTo(-14*s,-26*s+bob,-16*s,-20*s+bob);
    ctx.quadraticCurveTo(-12*s,-21*s+bob,-7*s,-15*s+bob); ctx.stroke(); }
  /* 颈 + 头 */
  S(ctx, INK, 2);
  L(ctx,[[5*s,-22*s+bob],[8*s,-28*s+bob]]);
  C(ctx, 9.5*s, -31*s+bob, 4.2*s, cfg.coat, 0.28);
  /* 喙 */
  S(ctx, cfg.beakColor||'#c8863a', 1.8);
  L(ctx,[[12.6*s,-32*s+bob],[17*s,-30.6*s+bob],[12.6*s,-29.4*s+bob]]);
  /* 冠 / 肉垂 */
  if (cfg.comb){ S(ctx, '#c8562a', 1.8);
    L(ctx,[[8*s,-35*s+bob],[8.6*s,-38*s+bob],[10*s,-35*s+bob],[11*s,-38.6*s+bob],[12*s,-34.6*s+bob]]); }
  if (cfg.wattle){ S(ctx, '#c8562a', 1.4); C(ctx, 12.4*s, -28.4*s+bob, 1.6*s, '#c8562a', 0.5); }
  if (cfg.crest){ S(ctx, cfg.accent||'#c8562a', 1.6);
    L(ctx,[[7*s,-34.6*s+bob],[4*s,-39*s+bob]]); L(ctx,[[9*s,-34.8*s+bob],[9*s,-40*s+bob]]); L(ctx,[[11*s,-34*s+bob],[13*s,-38*s+bob]]); }
  /* 眼 */
  S(ctx, INK, 1.5); C(ctx, 10.6*s, -32.2*s+bob, 1.35, INK, 0.85);
  if (D>1.0){ ctx.save(); ctx.fillStyle='#fff'; ctx.globalAlpha=0.85;
    ctx.beginPath(); ctx.arc(11*s,-32.6*s+bob,0.42,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  if (o.love) hearts(ctx, 9*s, -40*s, t, o.seed||0);
  if (o.rest) zzz(ctx, 6*s, 0, t);
}
/* 游鱼 / 鲸豚：cfg {scale, coat, dorsal, fluke, blow, shark} */
function beastFish(ctx, t, o, cfg){
  cfg = cfg||{};
  const D = lod(ctx), s = cfg.scale||1;
  const yy = Math.sin(t*2+(o.seed||0))*3;
  shadow(ctx, 11*s);
  S(ctx, cfg.inkColor||'#2f5d8a', 2);
  ctx.save(); ctx.translate(0, yy);
  /* 身 */
  ctx.beginPath();
  ctx.moveTo(-13*s,-8*s);
  ctx.quadraticCurveTo(0,-20*s, 12*s,-9*s);
  ctx.quadraticCurveTo(14*s,-6*s, 11*s,-3*s);
  ctx.quadraticCurveTo(0,4*s, -13*s,-3*s);
  ctx.closePath();
  if (cfg.coat){ ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle=cfg.coat; ctx.fill(); ctx.restore(); }
  ctx.stroke();
  /* 背鳍 */
  if (cfg.dorsal!==false){ S(ctx, cfg.inkColor||'#2f5d8a', 1.9);
    ctx.beginPath(); ctx.moveTo(-1*s,-17*s); ctx.quadraticCurveTo(2*s,(-24)*s, 6*s,-15*s); ctx.stroke(); }
  /* 尾鳍 */
  S(ctx, cfg.inkColor||'#2f5d8a', 2);
  ctx.beginPath(); ctx.moveTo(-13*s,-6*s);
  ctx.quadraticCurveTo(-19*s,-12*s,-21*s,-4*s);
  ctx.quadraticCurveTo(-18*s,-6*s,-19*s,-1*s);
  ctx.quadraticCurveTo(-16*s,-4*s,-13*s,-3*s); ctx.stroke();
  /* 胸鳍 */
  S(ctx, cfg.inkColor||'#2f5d8a', 1.5);
  ctx.beginPath(); ctx.moveTo(2*s,-5*s); ctx.quadraticCurveTo(0,1*s,-4*s,2*s); ctx.stroke();
  if (cfg.shark){ /* 牙 + 鳃 */
    S(ctx, INK, 1.2);
    L(ctx,[[7*s,-4*s],[9*s,-4*s]]);
    for (let i=0;i<3;i++){ L(ctx,[[(-6+i*1.8)*s,(-8-i*0.3)*s],[(-6+i*1.8)*s,(-4+i*0.3)*s]]); }
  }
  if (cfg.blow){ /* 鲸喷 */
    S(ctx, '#5a9ad0', 1.4, 0.6);
    ctx.beginPath(); ctx.moveTo(-6*s,-18*s); ctx.quadraticCurveTo(-7*s,-26*s,-4*s,-24*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7*s,-18*s); ctx.quadraticCurveTo(-10*s,-26*s,-8*s,-27*s); ctx.stroke();
  }
  /* 眼 */
  S(ctx, INK, 1.5); C(ctx, 8.5*s, -9.5*s, 1.3, INK, 0.85);
  if (D>1.0){ ctx.save(); ctx.fillStyle='#fff'; ctx.globalAlpha=0.85;
    ctx.beginPath(); ctx.arc(8.9*s,-9.9*s,0.4,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  /* 嘴 */
  if (!cfg.shark){ S(ctx, INK, 1.2, 0.7); L(ctx,[[9*s,-5.4*s],[12*s,-4.6*s]]); }
  ctx.restore();
  if (o.love) hearts(ctx, 0, -30*s, t, o.seed||0);
}
/* 虫豸：cfg {scale, kind:'bee|butterfly|spider|scorpion', coat, accent} */
function beastBug(ctx, t, o, cfg){
  cfg = cfg||{};
  const D = lod(ctx), s = cfg.scale||1;
  const kind = cfg.kind||'bee';
  const flut = Math.sin(t*8+(o.seed||0));
  shadow(ctx, 7*s);
  S(ctx, INK, 1.8);
  if (kind==='spider'){
    /* 腿 */
    S(ctx, INK, 1.4);
    for (let i=0;i<4;i++) for (let sgn=-1;sgn<=1;sgn+=2){
      const a = -0.5 + i*0.45;
      L(ctx,[[0,-8*s],[sgn*(7+i*2.4)*s, -8*s + Math.sin(a)*9*s],[sgn*(9+i*3)*s, -1*s]]);
    }
    S(ctx, INK, 2);
    E(ctx, 0, -8*s, 5.4*s, 4.6*s, cfg.coat, 0.25);          /* 腹 */
    C(ctx, -6*s, -9*s, 3.4*s, cfg.coat, 0.25);              /* 头胸 */
    S(ctx, INK, 1.2); C(ctx,-7.4*s,-10.4*s,0.9); C(ctx,-5.2*s,-10.4*s,0.9);
  } else if (kind==='scorpion'){
    S(ctx, INK, 1.4);
    for (let i=0;i<3;i++) for (let sgn=-1;sgn<=1;sgn+=2)
      L(ctx,[[0,-6*s],[sgn*(6+i*2.2)*s,-6*s],[sgn*(8+i*2.6)*s,-0.6*s]]);
    S(ctx, INK, 2);
    E(ctx, 2*s, -7*s, 6.4*s, 4*s, cfg.coat, 0.25);
    /* 尾钩 */
    S(ctx, cfg.accent||'#8a5a2a', 2);
    ctx.beginPath(); ctx.moveTo(7*s,-8*s);
    ctx.quadraticCurveTo(14*s,-9*s,13*s,-16*s);
    ctx.quadraticCurveTo(12*s,-20*s,9*s,-18*s); ctx.stroke();
    /* 螯 */
    S(ctx, INK, 1.8);
    L(ctx,[[-5*s,-7*s],[-10*s,-9*s]]); L(ctx,[[-10*s,-9*s],[-13*s,-7*s]]); L(ctx,[[-10*s,-9*s],[-13*s,-11*s]]);
    L(ctx,[[-5*s,-5*s],[-10*s,-3.6*s]]); L(ctx,[[-10*s,-3.6*s],[-13*s,-5*s]]); L(ctx,[[-10*s,-3.6*s],[-13*s,-2*s]]);
    S(ctx, INK, 1.2); C(ctx,-4*s,-8.4*s,0.9); C(ctx,-2.4*s,-7.6*s,0.9);
  } else {
    /* 蜂 / 蝶：胸腹 + 翅 */
    const wing = kind==='butterfly'? 11*s : 8*s;
    ctx.save(); S(ctx, INK, 1.3, 0.55);
    for (let sgn=-1;sgn<=1;sgn+=2){
      ctx.beginPath(); ctx.moveTo(0,-13*s);
      ctx.quadraticCurveTo(sgn*wing, -22*s + flut*1.6, sgn*wing*0.9, -9*s + flut);
      ctx.quadraticCurveTo(sgn*wing*0.5, -11*s, 0, -11*s);
      ctx.stroke();
    }
    if (kind==='butterfly'){ for (let sgn=-1;sgn<=1;sgn+=2){
      ctx.beginPath(); ctx.moveTo(0,-11*s);
      ctx.quadraticCurveTo(sgn*wing*0.85, -6*s - flut, sgn*wing*0.6, -2*s - flut);
      ctx.quadraticCurveTo(sgn*wing*0.3,-5*s,0,-8*s); ctx.stroke(); } }
    ctx.restore();
    S(ctx, INK, 2);
    E(ctx, 0, -9*s, 3.4*s, 6.4*s, cfg.coat, 0.25);           /* 腹 */
    if (cfg.stripes){ S(ctx, INK, 1.4, 0.7);
      for (let i=0;i<3;i++) L(ctx,[[-2.6*s,(-12+i*2.6)*s],[2.6*s,(-12+i*2.6)*s]]); }
    C(ctx, 0, -16.4*s, 2.8*s, cfg.coat, 0.3);                /* 胸 */
    C(ctx, 0, -19.6*s, 2.2*s, cfg.accent||'#c8a86a', 0.3);   /* 头 */
    S(ctx, INK, 1.1); /* 触角 */
    L(ctx,[[-1.2*s,-21.4*s],[-4*s,-25*s]]); L(ctx,[[1.2*s,-21.4*s],[4*s,-25*s]]);
    S(ctx, INK, 1.2); C(ctx,-0.9*s,-19.8*s,0.8); C(ctx,0.9*s,-19.8*s,0.8);
  }
  if (o.love) hearts(ctx, 0, -30*s, t, o.seed||0);
}
/* 蛇形：cfg {scale, coat, accent, hood} */
function beastSerpent(ctx, t, o, cfg){
  cfg = cfg||{};
  const D = lod(ctx), s = cfg.scale||1;
  const w = Math.sin(t*2.2+(o.seed||0));
  shadow(ctx, 9*s);
  S(ctx, cfg.inkColor||'#4a6b3a', 2);
  ctx.beginPath();
  ctx.moveTo(-16*s,-1*s);
  ctx.quadraticCurveTo(-8*s,-8*s+w*2, 0,-2*s);
  ctx.quadraticCurveTo(8*s,4*s-w*2, 13*s,-6*s);
  ctx.quadraticCurveTo(15*s,-14*s, 8*s,-17*s);
  ctx.stroke();
  /* 头 */
  E(ctx, 6*s, -20*s, 4.2*s, 3.2*s, cfg.coat, 0.25);
  if (cfg.hood){ /* 眼镜蛇颈盾 */
    S(ctx, cfg.inkColor||'#4a6b3a', 1.8);
    ctx.beginPath(); ctx.moveTo(6*s,-24*s);
    ctx.quadraticCurveTo(-2*s,-28*s, 0*s,-18*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6*s,-24*s);
    ctx.quadraticCurveTo(14*s,-28*s, 12*s,-18*s); ctx.stroke();
  }
  S(ctx, INK, 1.4); C(ctx, 7.4*s, -21*s, 1.1, INK, 0.85);
  /* 信子 */
  S(ctx, '#c8562a', 1.2, 0.85);
  const tg = Math.sin(t*6)*1.4;
  L(ctx,[[10*s,-19.4*s],[13*s,-18.6*s+tg]]); L(ctx,[[13*s,-18.6*s+tg],[14.4*s,-19.6*s+tg]]); L(ctx,[[13*s,-18.6*s+tg],[14.4*s,-17.6*s+tg]]);
  if (o.love) hearts(ctx, 6*s, -30*s, t, o.seed||0);
}

/* ============ 各物种（人形/神话） ============ */
var ctx_ = null;
const SPECIES_DRAW = {
  /* —— 人类村庄 —— */
  villager(t,o){ girl(ctx_,t,o,{ shadowW:10, dressColor:'#d8a862', hair:true, hairColor:'#6b4a2b', longHair:true, braid:true,
    extra(c,tt,oo,hy,D){ /* 草帽 */
      S(c,INK,1.8); c.beginPath(); c.arc(0,hy-8,11.5,Math.PI*1.02,Math.PI*1.98); c.stroke();
      L(c,[[-11.5,hy-8.6],[-15,hy-14]]); L(c,[[11.5,hy-8.6],[15,hy-14]]);
      if (D>1.0){ S(c,'#c8863a',1,0.6); L(c,[[-8,hy-9],[8,hy-9]]); }
      /* 麦穗 */
      S(c,'#a8863a',1.5); L(c,[[10,-36],[16,-42]]); C(c,16,-44,1.6); } }); },
  farmwoman(t,o){ girl(ctx_,t,o,{ shadowW:10.5, dressColor:'#8a9a5b', hair:true, hairColor:'#4a3a2b', bun:true,
    extra(c){ /* 头巾 */
      S(c,'#a63a2b',1.8); c.beginPath(); c.arc(0,-50,9.6,Math.PI*0.88,Math.PI*2.12); c.stroke();
      L(c,[[-9.4,-51],[-11,-46]]); L(c,[[9.4,-51],[11,-46]]);
      /* 提篮 + 鸡蛋 */
      S(c,INK,1.8); C(c,12,-33,4.6); L(c,[[8,-30],[12,-33],[16,-30]]);
      S(c,'#e8dcc8',1.4); C(c,11,-35.6,1.5,'#fff',0.6); C(c,13.6,-34.6,1.4,'#fff',0.6); } }); },
  priestess(t,o){ girl(ctx_,t,o,{ skirt:true, dressColor:'#f0e6d0', hair:true, hairColor:'#8a8a8a', longHair:true,
    extra(c,tt){ /* 神杖 */
      S(c,INK,1.8); L(c,[[10,-30],[10,-58]]); C(c,10,-62,4,'#ffd94a',0.35);
      S(c,'#ffd94a',1.2,0.8); drawSpark(c,10,-62,tt);
      /* 面纱 */
      S(c,'#f0e6d0',1.6); c.beginPath(); c.arc(0,-50,11,Math.PI*0.82,Math.PI*2.18); c.stroke();
      /* 额带 */
      S(c,'#b8860b',1.4); L(c,[[-8,-55],[8,-55]]); } }); },
  princess(t,o){ girl(ctx_,t,o,{ skirt:true, dressColor:'#c76b9a', hair:true, hairColor:'#d4a017', longHair:true,
    extra(c,tt){ /* 王冠 */
      S(c,'#b8860b',2); L(c,[[-6.5,-56],[-5,-63],[-2,-57.5],[1,-64],[4,-57.5],[6.5,-63],[6.5,-56]]);
      S(c,'#ffd94a',1.2,0.85); C(c,-5,-63.5,1.1,'#ffd94a',0.8); C(c,1,-64.5,1.2,'#ffd94a',0.8); C(c,6.5,-63.5,1.1,'#ffd94a',0.8);
      /* 宝石项链 */
      S(c,'#c76b9a',1.4); L(c,[[-4,-42],[0,-38.5],[4,-42]]); C(c,0,-38,1.4,'#ffd94a',0.8); } }); },

  /* —— 精灵森林 —— */
  dryad(t,o){ girl(ctx_,t,o,{ shadowW:11, dressColor:'#7a9a4a', noLegs:true, skin:'#e8f0d8',
    extra(c,tt,oo,hy,D){ /* 枝角 */
      S(c,'#4a6b3a',1.9); L(c,[[-3,hy-6],[-7,hy-14],[-4,hy-12],[-6,hy-20]]);
      L(c,[[3,hy-6],[7,hy-13],[4,hy-11],[6,hy-19]]);
      S(c,'#4a6b3a',1.7); for(let i=0;i<3;i++) leaf(c,-9+i*9,-22-((i%2)*4),3.5);
      if (D>1.0){ S(c,'#7a9a4a',1,0.6); L(c,[[-6,-30],[-6.6,-22]]); } },
    hairColor:'#4a6b3a', hair:true }); },
  nymph(t,o){ girl(ctx_,t,o,{ shadowW:10, dressColor:'#a8d8a8', hair:true, hairColor:'#7ab87a', longHair:true,
    extra(c,tt){ /* 花饰 + 飘带 */
      S(c,'#d0506a',1.6); C(c,-7.4,-50.5,2.4,'#e88aa0',0.55); C(c,7,-52,2,'#e88aa0',0.55);
      const a=Math.sin(tt*3)*4; S(c,'#7ab87a',1.4);
      c.beginPath(); c.moveTo(-10,-36); c.quadraticCurveTo(-16,-32+a,-20,-36); c.stroke(); } }); },
  centauress(t,o){ const walk=o.moving?Math.sin(t*8+(o.seed||0))*3:0; const D=lod(ctx_);
    shadow(ctx_,15); S(ctx_,INK,2);
    /* 马腿 */
    L(ctx_,[[-5,-20],[-9-walk*0.5,0]]); L(ctx_,[[-1,-20],[1-walk*0.4,-2]]);
    L(ctx_,[[5,-20],[9+walk*0.5,0]]); L(ctx_,[[9,-20],[11+walk*0.6,-1]]);
    if (D>0.95){ S(ctx_,INK,1.5,0.7); L(ctx_,[[-10.6,0],[-7.4,0]]); L(ctx_,[[10.4,0],[13.6,0]]); S(ctx_,INK,2); }
    /* 马身 */
    ctx_.beginPath(); ctx_.moveTo(-7,-22); ctx_.quadraticCurveTo(-12,-30,-6,-38);
    ctx_.lineTo(6,-38); ctx_.quadraticCurveTo(11,-28,9,-22); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.18; ctx_.fillStyle='#b8865a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    /* 马尾 */
    S(ctx_,'#6b4a2b',2); ctx_.beginPath(); ctx_.moveTo(-7,-34);
    ctx_.quadraticCurveTo(-16,-32+Math.sin(t*2)*2,-20,-20); ctx_.stroke();
    L(ctx_,[[-3,-38],[-4,-46]]); L(ctx_,[[3,-38],[4,-46]]);
    /* 人上身 */
    const hy=-51;
    ctx_.beginPath(); ctx_.moveTo(-6.4,hy-2.4);
    ctx_.quadraticCurveTo(-6.6,hy-8.8,0,hy-8.8); ctx_.quadraticCurveTo(6.6,hy-8.8,6.4,hy-2.4);
    ctx_.quadraticCurveTo(3.2,hy+6,0,hy+6); ctx_.quadraticCurveTo(-3.2,hy+6,-6.4,hy-2.4);
    ctx_.closePath(); ctx_.save(); ctx_.globalAlpha=0.35; ctx_.fillStyle='#f4ecd8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,INK,1.9); ctx_.beginPath(); ctx_.arc(0,hy-1,8.6,Math.PI*0.95,Math.PI*2.05); ctx_.stroke();
    /* 弓 */
    S(ctx_,'#6b4a2b',1.7); ctx_.beginPath(); ctx_.moveTo(11,-34); ctx_.quadraticCurveTo(17,-40,13,-48); ctx_.stroke();
    S(ctx_,INK,1,0.6); L(ctx_,[[11,-34],[13,-48]]);
    face(ctx_,0,hy+1,o.love,false,{lod:D});
    L(ctx_,[[-8,hy],[-11,-38]]); L(ctx_,[[8,hy],[11,-38]]);
    if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  muse(t,o){ girl(ctx_,t,o,{ skirt:true, dressColor:'#b8c8e8', hair:true, hairColor:'#8a6ab8', longHair:true,
    extra(c){ /* 里拉琴 */
      S(c,INK,1.7); C(c,12,-34,6.2);
      for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; L(c,[[12+Math.cos(a)*6.2,-34+Math.sin(a)*6.2],[12+Math.cos(a)*3.2,-34+Math.sin(a)*3.2]]); }
      /* 桂冠 */
      S(c,'#4a6b3a',1.7); L(c,[[-6,-56],[-8,-59]]); L(c,[[0,-57.5],[0,-60.5]]); L(c,[[6,-56],[8,-59]]); } }); },

  /* —— 碧海深渊 —— */
  mermaid(t,o){ const D=lod(ctx_); shadow(ctx_,12); S(ctx_,INK,2);
    const sway=Math.sin(t*2.5+(o.seed||0))*3;
    /* 鱼尾 */
    ctx_.beginPath(); ctx_.moveTo(-6,-42); ctx_.quadraticCurveTo(-9,-28,-4,-16);
    ctx_.quadraticCurveTo(-2+sway,-6,-10+sway,-1); ctx_.quadraticCurveTo(0+sway,4,8+sway,-2);
    ctx_.quadraticCurveTo(4,-10,5,-16); ctx_.quadraticCurveTo(9,-28,6,-42); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.2; ctx_.fillStyle='#5a9ad0'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    /* 鳞片 */
    S(ctx_,'#2f5d8a',1,0.45);
    for(let i=0;i<4;i++){ const yy=-14-i*5; ctx_.beginPath(); ctx_.arc(0,yy,3.4,0.15*Math.PI,0.85*Math.PI); ctx_.stroke(); }
    S(ctx_,INK,2); L(ctx_,[[12+sway,-3],[8+sway,2],[13+sway,3]]);
    /* 贝壳衣 */
    ctx_.beginPath(); ctx_.moveTo(-6.5,-42); ctx_.quadraticCurveTo(-9,-32,-5,-22); ctx_.lineTo(5,-22);
    ctx_.quadraticCurveTo(9,-32,6.5,-42); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.22; ctx_.fillStyle='#8ac8d8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,INK,1.2,0.5); for(let i=0;i<3;i++){ L(ctx_,[[-5+i*3.4,-40],[-4.4+i*3.4,-24]]); } S(ctx_,INK,2);
    L(ctx_,[[-6.5,-39],[-12,-33]]); L(ctx_,[[6.5,-39],[12,-34]]);
    /* 头 */
    const hy=-50;
    ctx_.beginPath(); ctx_.moveTo(-6.6,hy-2.2); ctx_.quadraticCurveTo(-6.8,hy-8.6,0,hy-8.6);
    ctx_.quadraticCurveTo(6.8,hy-8.6,6.6,hy-2.2); ctx_.quadraticCurveTo(3.4,hy+6.2,0,hy+6.2);
    ctx_.quadraticCurveTo(-3.4,hy+6.2,-6.6,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.4; ctx_.fillStyle='#f4ecd8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#5a7ab8',2); ctx_.beginPath(); ctx_.arc(0,hy-1,8.5,Math.PI*0.9,Math.PI*2.1); ctx_.stroke();
    S(ctx_,'#5a9ad0',1.4,0.8); L(ctx_,[[-8,hy],[-10,-38],[-7,-34]]); L(ctx_,[[8,hy],[10,-38],[7,-34]]);
    /* 珍珠发饰 */
    C(ctx_,-7,hy-6,1.4,'#fff',0.85); C(ctx_,6,hy-7,1.2,'#fff',0.85);
    face(ctx_,0,hy+1,o.love,false,{lod:D});
    if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  nereid(t,o){ girl(ctx_,t,o,{ shadowW:10, dressColor:'#8ac8d8', hair:true, hairColor:'#4a8ab8', longHair:true,
    extra(c){ /* 海星发饰 */
      S(c,'#e89a5a',1.7); c.save(); c.translate(-7.4,-56);
      for(let i=0;i<5;i++){ c.rotate(Math.PI*2/5); L(c,[[0,0],[0,-4.6]]); } c.restore();
      /* 波浪裙摆 */
      S(c,'#5a9ad0',1.5); for(let i=0;i<3;i++){ const yy=-20-i*6;
        c.beginPath(); c.moveTo(-8-i,yy); c.quadraticCurveTo(0,yy-4,8+i,yy); c.stroke(); } } }); },
  siren(t,o){ girl(ctx_,t,o,{ shadowW:11, dressColor:'#c8b89a', noLegs:true,
    extra(c,tt,oo,hy,D){ /* 鸟翼 + 尾羽 */
      S(c,'#a88a5a',1.9);
      const flap=Math.sin(tt*4+(oo.seed||0))*6;
      c.beginPath(); c.moveTo(-6,-40); c.quadraticCurveTo(-20,-46+flap,-24,-34+flap);
      c.quadraticCurveTo(-14,-33,-6,-32); c.stroke();
      c.beginPath(); c.moveTo(6,-40); c.quadraticCurveTo(20,-46-flap,24,-34-flap);
      c.quadraticCurveTo(14,-33,6,-32); c.stroke();
      if (D>0.95){ S(c,'#a88a5a',1,0.55);
        L(c,[[-12,-40],[-14,-35]]); L(c,[[-17,-39],[-19,-35]]); L(c,[[12,-40],[14,-35]]); L(c,[[17,-39],[19,-35]]); }
      /* 音符 */
      c.save(); S(c,'#8a6a9a',1.4,0.8); c.font='13px serif'; c.fillStyle='#8a6a9a';
      c.fillText('♪',14,-58+Math.sin(tt*3)*3); c.restore(); },
    hair:true, hairColor:'#8a5a3a', longHair:true }); },

  /* —— 神话火山 —— */
  harpy(t,o){ const D=lod(ctx_); shadow(ctx_,11); S(ctx_,INK,2);
    const flap=Math.sin(t*5+(o.seed||0))*7;
    /* 爪 */
    L(ctx_,[[-3,-18],[-6,0]]); L(ctx_,[[3,-18],[6,0]]); L(ctx_,[[-3,0],[-7,2]]); L(ctx_,[[3,0],[7,2]]);
    ctx_.beginPath(); ctx_.moveTo(-6,-42); ctx_.quadraticCurveTo(-9,-30,-7,-18);
    ctx_.lineTo(7,-18); ctx_.quadraticCurveTo(9,-30,6,-42); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.14; ctx_.fillStyle='#a86a3a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    /* 大翅膀（羽毛） */
    S(ctx_,'#a86a3a',1.9);
    for (let sgn=-1;sgn<=1;sgn+=2){
      ctx_.beginPath(); ctx_.moveTo(sgn*6,-41);
      ctx_.quadraticCurveTo(sgn*24,-52+sgn*flap*0.6, sgn*30,-36+flap*sgn*0.4);
      ctx_.quadraticCurveTo(sgn*16,-32, sgn*6,-30); ctx_.stroke();
      if (D>0.95){ S(ctx_,'#8a5a2a',1,0.55);
        L(ctx_,[[sgn*11,-43],[sgn*13,-36]]); L(ctx_,[[sgn*17,-43],[sgn*19,-36]]); L(ctx_,[[sgn*23,-41],[sgn*24,-35]]); }
      S(ctx_,'#a86a3a',1.9);
    }
    L(ctx_,[[-6,-39],[-13,-35]]); L(ctx_,[[6,-39],[13,-35]]);
    const hy=-49.5;
    ctx_.beginPath(); ctx_.moveTo(-6.6,hy-2.2); ctx_.quadraticCurveTo(-6.8,hy-8.6,0,hy-8.6);
    ctx_.quadraticCurveTo(6.8,hy-8.6,6.6,hy-2.2); ctx_.quadraticCurveTo(3.4,hy+6.2,0,hy+6.2);
    ctx_.quadraticCurveTo(-3.4,hy+6.2,-6.6,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.38; ctx_.fillStyle='#f4ecd8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#6b4a2b',2); ctx_.beginPath(); ctx_.arc(0,hy-1,8.6,Math.PI*0.92,Math.PI*2.08); ctx_.stroke();
    /* 羽冠 */
    S(ctx_,'#8a5a2a',1.5); L(ctx_,[[-4,hy-8],[-6,hy-14]]); L(ctx_,[[0,hy-8.6],[0,hy-15]]); L(ctx_,[[4,hy-8],[6,hy-14]]);
    face(ctx_,0,hy+1,o.love,false,{lod:D}); if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  gorgo(t,o){ girl(ctx_,t,o,{ shadowW:10, dressColor:'#7a8a6a', hair:true, hairColor:'#4a6b3a',
    extra(c,tt,oo,hy,D){ /* 蛇发 */
      S(c,'#4a6b3a',1.8);
      for(let i=0;i<6;i++){ const a=Math.PI*1.02+i*(Math.PI*0.96/5); const wob=Math.sin(tt*3+i)*2.5;
        const x0=Math.cos(a)*8.6, y0=hy-1+Math.sin(a)*8.6;
        const x1=Math.cos(a)*16+wob, y1=hy-4+Math.sin(a)*16-3;
        c.beginPath(); c.moveTo(x0,y0); c.quadraticCurveTo((x0+x1)/2+wob,y0-7,x1,y1); c.stroke();
        /* 蛇头 */
        E(c,x1,y1,1.9,1.4,'#4a6b3a',0.4);
        if (D>1.0){ S(c,'#c8562a',0.9,0.8);
          c.beginPath(); c.moveTo(x1+1.4,y1); c.lineTo(x1+3.4,y1+0.4); c.stroke(); S(c,'#4a6b3a',1.8); }
      } } }); },
  sphinx(t,o){ const walk=o.moving?Math.sin(t*7)*3:0; const D=lod(ctx_); shadow(ctx_,16); S(ctx_,INK,2.1);
    L(ctx_,[[-8,-16],[-10-walk,0]]); L(ctx_,[[-4,-16],[-3+walk,-1]]);
    L(ctx_,[[8,-16],[10+walk,0]]); L(ctx_,[[12,-16],[13-walk,-1]]);
    ctx_.beginPath(); ctx_.moveTo(-10,-18); ctx_.quadraticCurveTo(-14,-26,-7,-32);
    ctx_.lineTo(11,-32); ctx_.quadraticCurveTo(14,-24,13,-18); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.18; ctx_.fillStyle='#d8b86a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    const flap=Math.sin(t*3)*4; S(ctx_,'#b8860b',1.8);
    ctx_.beginPath(); ctx_.moveTo(0,-31); ctx_.quadraticCurveTo(14,-44+flap,20,-32+flap);
    ctx_.quadraticCurveTo(10,-28,2,-27); ctx_.stroke();
    L(ctx_,[[-4,-32],[-5,-40]]);
    const hy=-45;
    ctx_.beginPath(); ctx_.moveTo(-6.8,hy-2.2); ctx_.quadraticCurveTo(-7,hy-8.8,0,hy-8.8);
    ctx_.quadraticCurveTo(7,hy-8.8,6.8,hy-2.2); ctx_.quadraticCurveTo(3.6,hy+6.4,0,hy+6.4);
    ctx_.quadraticCurveTo(-3.6,hy+6.4,-6.8,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.38; ctx_.fillStyle='#f4ecd8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,INK,1.9); ctx_.beginPath(); ctx_.arc(0,hy-1,8.8,Math.PI*0.95,Math.PI*2.05); ctx_.stroke();
    /* 埃及头巾 */
    S(ctx_,'#4a6b8a',1.8); L(ctx_,[[-8.6,hy-1],[-11,-36],[-4,-34]]); L(ctx_,[[8.6,hy-1],[11,-36],[4,-34]]);
    S(ctx_,'#b8860b',1.4); L(ctx_,[[-8.4,hy-4],[8.4,hy-4]]);
    face(ctx_,0,hy+1,o.love,false,{lod:D}); if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  phoenix(t,o){ const D=lod(ctx_); shadow(ctx_,13); S(ctx_,INK,2);
    const flap=Math.sin(t*4+(o.seed||0))*8;
    /* 火尾 */
    S(ctx_,'#c8562a',1.9);
    ctx_.beginPath(); ctx_.moveTo(-4,-24); ctx_.quadraticCurveTo(-16,-14+flap*0.5,-22,-2+flap*0.7);
    ctx_.quadraticCurveTo(-10,-6,-4,-14); ctx_.stroke();
    S(ctx_,'#e8a04a',1.4,0.8);
    ctx_.beginPath(); ctx_.moveTo(-4,-22); ctx_.quadraticCurveTo(-13,-13+flap*0.4,-18,-5+flap*0.5); ctx_.stroke();
    /* 双翼 */
    S(ctx_,'#c8562a',2);
    for (let sgn=-1;sgn<=1;sgn+=2){
      ctx_.beginPath(); ctx_.moveTo(sgn*5,-40);
      ctx_.quadraticCurveTo(sgn*18,-50+flap*sgn*0.6, sgn*24,-38+flap*sgn*0.6);
      ctx_.quadraticCurveTo(sgn*12,-34, sgn*5,-32); ctx_.stroke();
      if (D>0.95){ S(ctx_,'#e8a04a',1,0.6); L(ctx_,[[sgn*10,-42],[sgn*12,-36]]); L(ctx_,[[sgn*15,-42],[sgn*17,-36]]); S(ctx_,'#c8562a',2); }
    }
    S(ctx_,INK,2);
    ctx_.beginPath(); ctx_.moveTo(-5,-40); ctx_.quadraticCurveTo(-7,-30,-3,-22);
    ctx_.lineTo(3,-22); ctx_.quadraticCurveTo(7,-30,5,-40); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.2; ctx_.fillStyle='#e8a04a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    C(ctx_,0,-45,6.8,'#e8a04a',0.35);
    S(ctx_,'#c8562a',1.8); L(ctx_,[[2,-51],[5,-56]]); L(ctx_,[[-2,-51],[-4,-57]]); L(ctx_,[[0,-51.6],[0.6,-58]]);
    face(ctx_,0,-45,o.love,false,{lod:D, iris:'#7a3a1a'});
    ctx_.save(); S(ctx_,'#ffd94a',1.2,0.6+Math.sin(t*6)*0.25);
    drawSpark(ctx_,0,-30,t); drawSpark(ctx_,12,-20,t+1); drawSpark(ctx_,-13,-24,t+2); ctx_.restore(); },

  /* —— 冥界边境 —— */
  shade(t,o){ const D=lod(ctx_); shadow(ctx_,10); ctx_.save();
    const fl=Math.sin(t*2.6+(o.seed||0))*2;
    S(ctx_,'#5a5a8a',2,0.85);
    ctx_.beginPath(); ctx_.moveTo(-6,-44); ctx_.quadraticCurveTo(-9,-28,-6,-16);
    for(let i=0;i<4;i++){ const x=-6+i*4; ctx_.quadraticCurveTo(x+2,-10+fl*(i%2?1:-1),x+4,-14+fl*(i%2?-1:1)); }
    ctx_.quadraticCurveTo(9,-28,6,-44); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.12; ctx_.fillStyle='#5a5a8a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    L(ctx_,[[-6,-40],[-11,-33]]); L(ctx_,[[6,-40],[11,-34]]);
    const hy=-49.5;
    ctx_.beginPath(); ctx_.moveTo(-6.6,hy-2.2); ctx_.quadraticCurveTo(-6.8,hy-8.6,0,hy-8.6);
    ctx_.quadraticCurveTo(6.8,hy-8.6,6.6,hy-2.2); ctx_.quadraticCurveTo(3.4,hy+6.2,0,hy+6.2);
    ctx_.quadraticCurveTo(-3.4,hy+6.2,-6.6,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.3; ctx_.fillStyle='#cfcfe8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#8a8ab8',1.8); ctx_.beginPath(); ctx_.arc(0,hy-1,8.6,Math.PI*0.95,Math.PI*2.05); ctx_.stroke();
    face(ctx_,0,hy+1,o.love,false,{lod:D, browColor:'#5a5a8a', blush:false});
    ctx_.restore();
    ctx_.save(); S(ctx_,'#8a8ab8',1.1,0.4+Math.sin(t*3)*0.2);
    drawSpark(ctx_,-9,-20,t); drawSpark(ctx_,10,-26,t+2); ctx_.restore(); },
  fury(t,o){ const D=lod(ctx_); shadow(ctx_,11); S(ctx_,INK,2);
    const flap=Math.sin(t*4.5+(o.seed||0))*7;
    L(ctx_,[[-3,-18],[-5,0]]); L(ctx_,[[3,-18],[5,0]]);
    ctx_.beginPath(); ctx_.moveTo(-6,-42); ctx_.quadraticCurveTo(-8,-30,-6,-18);
    ctx_.lineTo(6,-18); ctx_.quadraticCurveTo(8,-30,6,-42); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.15; ctx_.fillStyle='#3a3a4a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#3a3a4a',2);
    for (let sgn=-1;sgn<=1;sgn+=2){
      ctx_.beginPath(); ctx_.moveTo(sgn*5,-41);
      ctx_.quadraticCurveTo(sgn*22,-54+flap*sgn*0.6, sgn*27,-36+flap*sgn*0.5);
      ctx_.quadraticCurveTo(sgn*14,-34, sgn*5,-31); ctx_.stroke(); }
    L(ctx_,[[-6,-39],[-13,-32]]); L(ctx_,[[6,-39],[13,-32]]);
    /* 鞭子 */
    S(ctx_,'#7a3a2b',1.7); ctx_.beginPath(); ctx_.moveTo(13,-32);
    ctx_.quadraticCurveTo(18,-24,15,-16+Math.sin(t*3)*3); ctx_.stroke();
    const hy=-49.5;
    ctx_.beginPath(); ctx_.moveTo(-6.6,hy-2.2); ctx_.quadraticCurveTo(-6.8,hy-8.6,0,hy-8.6);
    ctx_.quadraticCurveTo(6.8,hy-8.6,6.6,hy-2.2); ctx_.quadraticCurveTo(3.4,hy+6.2,0,hy+6.2);
    ctx_.quadraticCurveTo(-3.4,hy+6.2,-6.6,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.3; ctx_.fillStyle='#e8d8d8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#3a3a4a',2); ctx_.beginPath(); ctx_.arc(0,hy-1,8.6,Math.PI*0.92,Math.PI*2.08); ctx_.stroke();
    face(ctx_,0,hy+1,o.love?true:'angry',false,{lod:D, blush:false});
    if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  nyx(t,o){ girl(ctx_,t,o,{ shadowW:11, skirt:true, dressColor:'#3a3a5a', hair:true, hairColor:'#1a1a3a', longHair:true, skin:'#e8e8f8',
    extra(c,tt,oo,hy,D){ /* 星纱 + 月冠 */
      c.save(); S(c,'#e8e8ff',1.2,0.9);
      for(let i=0;i<6;i++){ const a=tt*0.4+i; drawSpark(c, Math.sin(a*2.3)*13, -34+Math.cos(a*1.7)*8, tt+i); }
      c.restore();
      S(c,'#e8e8ff',1.4); C(c,-6,hy-7,1.2,'#fff',0.9); C(c,5,hy-9,1.4,'#fff',0.9);
      S(c,'#c8c8ea',1.6); ctx_.beginPath(); ctx_.arc(0,hy-12,4,Math.PI*1.15,Math.PI*1.85); ctx_.stroke(); } }); },

  /* —— 新增人形/半兽神话物种 —— */
  naiad(t,o){ girl(ctx_,t,o,{ shadowW:10, dressColor:'#a8d8e8', hair:true, hairColor:'#5a9ab8', longHair:true, skin:'#eaf4f8',
    extra(c,tt){ /* 水罐 + 水波 */
      S(c,INK,1.7); C(c,12,-32,5); L(c,[[8,-29],[12,-33],[16,-29]]);
      S(c,'#5a9ad0',1.3,0.8); L(c,[[12,-37],[12,-41]]);
      S(c,'#5a9ad0',1.5); for(let i=0;i<2;i++){ const yy=-19-i*6;
        c.beginPath(); c.moveTo(-8-i*1.5,yy); c.quadraticCurveTo(0,yy-4,8+i*1.5,yy); c.stroke(); }
      /* 睡莲发饰 */
      S(c,'#e8a0b8',1.4); C(c,-7,-55,2.2,'#f0c0d0',0.5); } }); },
  octopus(t,o){ const D=lod(ctx_); shadow(ctx_,12); S(ctx_,INK,2);
    const sway=Math.sin(t*2+(o.seed||0))*2.6;
    /* 八条触手裙 */
    S(ctx_,'#8a5aa8',1.9);
    for (let i=0;i<6;i++){
      const x0 = -7.5 + i*3;
      const dir = (i%2?1:-1);
      ctx_.beginPath();
      ctx_.moveTo(x0,-20);
      ctx_.quadraticCurveTo(x0-1.5+sway*dir*0.5, -12, x0-3.5+sway*dir, -1.5);
      ctx_.stroke();
      if (D>1.0){ S(ctx_,'#8a5aa8',1.1,0.7);
        ctx_.beginPath(); ctx_.moveTo(x0-3.5+sway*dir,-1.5);
        ctx_.quadraticCurveTo(x0-5.5+sway*dir, 1, x0-7+sway*dir*1.3, -0.5); ctx_.stroke();
        S(ctx_,'#8a5aa8',1.9); }
    }
    S(ctx_,INK,2);
    /* 上身 */
    FP(ctx_,[[-6.4,-41],[-8.6,-30],[-6.6,-20],[6.6,-20],[8.6,-30],[6.4,-41]], '#c88ad0', 0.2);
    L(ctx_,[[-6.4,-38],[-11,-31]]); L(ctx_,[[6.4,-38],[11,-32]]);
    const hy=-49.5;
    ctx_.beginPath(); ctx_.moveTo(-6.6,hy-2.2); ctx_.quadraticCurveTo(-6.8,hy-8.6,0,hy-8.6);
    ctx_.quadraticCurveTo(6.8,hy-8.6,6.6,hy-2.2); ctx_.quadraticCurveTo(3.4,hy+6.2,0,hy+6.2);
    ctx_.quadraticCurveTo(-3.4,hy+6.2,-6.6,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.4; ctx_.fillStyle='#e8d8e8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#6a3a8a',2); ctx_.beginPath(); ctx_.arc(0,hy-1,8.8,Math.PI*0.92,Math.PI*2.08); ctx_.stroke();
    /* 触角状发梢 */
    S(ctx_,'#6a3a8a',1.5); L(ctx_,[[-7,hy+1],[-10,-38],[-7,-34]]); L(ctx_,[[7,hy+1],[10,-38],[7,-34]]);
    if (D>1.0){ S(ctx_,'#6a3a8a',1,0.7); C(ctx_,-10,-37,1.6); C(ctx_,10,-37,1.6); }
    face(ctx_,0,hy+1,o.love,false,{lod:D, iris:'#6a3a8a'});
    if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  gargoyle(t,o){ const D=lod(ctx_); shadow(ctx_,12); S(ctx_,INK,2);
    const flap=Math.sin(t*3+(o.seed||0))*4;
    L(ctx_,[[-3.4,-19],[-4.6,0]]); L(ctx_,[[3.4,-19],[4.6,0]]);
    /* 石翼（收拢） */
    S(ctx_,'#8a8a92',1.9);
    for (let sgn=-1;sgn<=1;sgn+=2){
      ctx_.beginPath(); ctx_.moveTo(sgn*5.6,-40);
      ctx_.quadraticCurveTo(sgn*17,-46+flap*sgn*0.5, sgn*20,-30+flap*sgn*0.5);
      ctx_.quadraticCurveTo(sgn*11,-28, sgn*5.6,-30); ctx_.stroke();
      if (D>0.95){ S(ctx_,'#6a6a72',1,0.5); L(ctx_,[[sgn*10,-40],[sgn*12,-32]]); S(ctx_,'#8a8a92',1.9); } }
    FP(ctx_,[[-6.4,-41],[-9,-30],[-7,-19],[7,-19],[9,-30],[6.4,-41]], '#9a9aa2', 0.22);
    L(ctx_,[[-6.4,-38],[-11.5,-31]]); L(ctx_,[[6.4,-38],[11.5,-31]]);
    const hy=-49.5;
    ctx_.beginPath(); ctx_.moveTo(-6.8,hy-2.2); ctx_.quadraticCurveTo(-7,hy-8.8,0,hy-8.8);
    ctx_.quadraticCurveTo(7,hy-8.8,6.8,hy-2.2); ctx_.quadraticCurveTo(3.6,hy+6.4,0,hy+6.4);
    ctx_.quadraticCurveTo(-3.6,hy+6.4,-6.8,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.4; ctx_.fillStyle='#c8c8d0'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    /* 角 */
    S(ctx_,'#7a7a82',1.8); L(ctx_,[[-5,hy-7],[-7.5,hy-14]]); L(ctx_,[[5,hy-7],[7.5,hy-14]]);
    /* 尖耳 */
    S(ctx_,INK,1.4); L(ctx_,[[-6.6,hy-1],[-9.6,hy-5],[-6.4,hy-4]]); L(ctx_,[[6.6,hy-1],[9.6,hy-5],[6.4,hy-4]]);
    S(ctx_,INK,1.8); ctx_.beginPath(); ctx_.arc(0,hy-1,8.8,Math.PI*0.95,Math.PI*2.05); ctx_.stroke();
    face(ctx_,0,hy+1,o.love,false,{lod:D, blush:false});
    if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },
  frost(t,o){ girl(ctx_,t,o,{ shadowW:11, skirt:true, dressColor:'#bfe4f0', hair:true, hairColor:'#cfeef8', longHair:true, skin:'#eef8fc',
    extra(c,tt,oo,hy,D){ /* 雪花 + 冰晶 */
      c.save(); S(c,'#7ac0e0',1.2,0.9);
      for(let i=0;i<5;i++){ const a=tt*0.5+i*1.3;
        drawSpark(c, Math.sin(a*1.7)*12, -28+Math.cos(a*2.1)*9, tt+i); }
      c.restore();
      S(c,'#7ac0e0',1.5); C(c,-7,hy-7,1.4,'#fff',0.8);
      /* 冰棱裙边 */
      S(c,'#7ac0e0',1.3,0.7);
      for (let i=-2;i<=2;i++) L(c,[[i*4.6,-19],[i*4.2,-15]]); } }); },
  astral(t,o){ girl(ctx_,t,o,{ shadowW:11, skirt:true, dressColor:'#3a3a6a', hair:true, hairColor:'#1a1a3a', longHair:true, skin:'#e8e8f8',
    extra(c,tt,oo,hy,D){ /* 星尘与星冠 */
      c.save(); S(c,'#e8e8ff',1.2,0.9);
      for(let i=0;i<7;i++){ const a=tt*0.4+i;
        drawSpark(c, Math.sin(a*2.1)*14, -30+Math.cos(a*1.6)*10, tt+i*1.3); }
      c.restore();
      S(c,'#e8e8ff',1.5); C(c,-6,hy-7,1.3,'#fff',0.9); C(c,6,hy-9,1.1,'#fff',0.9);
      /* 星冠 */
      S(c,'#c8c8ff',1.6);
      for (let i=-2;i<=2;i++){ const x=i*3.4; L(c,[[x,hy-9],[x,hy-13]]); C(c,x,hy-14.4,1.1,'#fff',0.8); } } }); },
  lamia(t,o){ const D=lod(ctx_); shadow(ctx_,13); S(ctx_,INK,2);
    const sway=Math.sin(t*2.2+(o.seed||0))*3;
    /* 蛇尾 */
    ctx_.beginPath(); ctx_.moveTo(-7,-20);
    ctx_.quadraticCurveTo(-10,-10,-6+sway,-2);
    ctx_.quadraticCurveTo(0,3,10+sway,-1);
    ctx_.quadraticCurveTo(6,-8,6,-20); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.2; ctx_.fillStyle='#7a9a4a'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#4a6b3a',1.2,0.6);
    for(let i=0;i<4;i++){ const yy=-15+i*4; ctx_.beginPath(); ctx_.arc(0,yy,3.2+ i*0.5,0.1*Math.PI,0.9*Math.PI); ctx_.stroke(); }
    S(ctx_,INK,2);
    FP(ctx_,[[-6.2,-40],[-8.4,-29],[-6.4,-20],[6.4,-20],[8.4,-29],[6.2,-40]], '#8a8a5a', 0.2);
    L(ctx_,[[-6.2,-37],[-11,-30]]); L(ctx_,[[6.2,-37],[11,-31]]);
    const hy=-48.5;
    ctx_.beginPath(); ctx_.moveTo(-6.6,hy-2.2); ctx_.quadraticCurveTo(-6.8,hy-8.6,0,hy-8.6);
    ctx_.quadraticCurveTo(6.8,hy-8.6,6.6,hy-2.2); ctx_.quadraticCurveTo(3.4,hy+6.2,0,hy+6.2);
    ctx_.quadraticCurveTo(-3.4,hy+6.2,-6.6,hy-2.2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.4; ctx_.fillStyle='#f4ecd8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,'#3a3a2a',2); ctx_.beginPath(); ctx_.arc(0,hy-1,8.7,Math.PI*0.93,Math.PI*2.07); ctx_.stroke();
    hair(ctx_, hy, { color:'#3a3a2a', long:true, r:8.8, lod:D });
    face(ctx_,0,hy+1,o.love,false,{lod:D, iris:'#6a4a2a'});
    if(o.love) hearts(ctx_,0,hy-15,t,o.seed||0); },

  /* —— 环境生物（装饰用） —— */
  villager_m(t,o){ const D=lod(ctx_); shadow(ctx_,11); S(ctx_,INK,2); const walk=o.moving?Math.sin(t*8)*3:0;
    L(ctx_,[[-3.5,-22],[-4-walk,0]]); L(ctx_,[[3.5,-22],[4+walk,0]]);
    FP(ctx_,[[-7,-44],[-9,-30],[-7,-21],[7,-21],[9,-30],[7,-44]], '#8a9a5b', 0.16);
    L(ctx_,[[-7,-40],[-12,-30]]); L(ctx_,[[7,-40],[11,-31]]);
    const hy=-49;
    ctx_.beginPath(); ctx_.moveTo(-6.4,hy-2); ctx_.quadraticCurveTo(-6.6,hy-8.4,0,hy-8.4);
    ctx_.quadraticCurveTo(6.6,hy-8.4,6.4,hy-2); ctx_.quadraticCurveTo(3.2,hy+6,0,hy+6);
    ctx_.quadraticCurveTo(-3.2,hy+6,-6.4,hy-2); ctx_.closePath();
    ctx_.save(); ctx_.globalAlpha=0.38; ctx_.fillStyle='#f4ecd8'; ctx_.fill(); ctx_.restore(); ctx_.stroke();
    S(ctx_,INK,1.8); ctx_.beginPath(); ctx_.arc(0,hy-1,8.2,Math.PI*0.95,Math.PI*2.05); ctx_.stroke();
    face(ctx_,0,hy+1,null,false,{lod:D, blush:false}); },
  peacock(t,o){ const D=lod(ctx_); shadow(ctx_,10); S(ctx_,'#2f5d8a',2);
    const spread = o.alert ? 1 : 0.25+Math.sin(t*1.2)*0.15;
    ctx_.save(); ctx_.translate(0,-16);
    for(let i=0;i<7;i++){ const a=Math.PI*(0.15+0.7*i/6);
      const len=16*spread+6;
      const x1=Math.cos(a)*len, y1=-Math.sin(a)*len;
      S(ctx_,'#2f5d8a',1.5); ctx_.beginPath(); ctx_.moveTo(0,0); ctx_.quadraticCurveTo(x1*0.6,y1*0.6-3,x1,y1); ctx_.stroke();
      C(ctx_,x1,y1,2.6,'#2f5d8a',0.2); S(ctx_,'#d4a017',1.2); C(ctx_,x1,y1,1.1,'#d4a017',0.6); }
    ctx_.restore();
    E(ctx_,3,-18,5,7,'#4a8ab8',0.2);
    C(ctx_,4,-27,2.6); L(ctx_,[[3,-29],[2.5,-32]]); L(ctx_,[[5,-29],[6,-31]]);
    S(ctx_,INK,1.3); C(ctx_,4.6,-27.6,0.9,INK,0.85);
    L(ctx_,[[0,-13],[0,-2]]); L(ctx_,[[6,-13],[7,-2]]); },
  eagle(t,o){ S(ctx_,INK,1.8);
    const flap=Math.sin(t*8)*6;
    ctx_.beginPath(); ctx_.moveTo(-4,-14); ctx_.quadraticCurveTo(0,-18,4,-14);
    ctx_.quadraticCurveTo(2,-10,0,-9); ctx_.quadraticCurveTo(-2,-10,-4,-14); ctx_.closePath(); ctx_.stroke();
    ctx_.beginPath(); ctx_.moveTo(-3,-14); ctx_.quadraticCurveTo(-12,-20-flap,-16,-13-flap);
    ctx_.quadraticCurveTo(-8,-10,-3,-11); ctx_.stroke();
    ctx_.beginPath(); ctx_.moveTo(3,-14); ctx_.quadraticCurveTo(12,-20+flap,16,-13+flap);
    ctx_.quadraticCurveTo(8,-10,3,-11); ctx_.stroke();
    C(ctx_,0,-17,1.6); S(ctx_,INK,1.1); C(ctx_,0.6,-17.4,0.7,INK,0.85); }
};

/* ============ 参数化物种：由 world.js 的 spec.plan/cfg 驱动 ============ */
const PLAN = {
  quadruped: beast4,
  bird: beastBird,
  fish: beastFish,
  bug: beastBug,
  serpent: beastSerpent
};

/* ============ 子嗣（宙斯特征 + 母亲血统混血） ============ */
function drawOffspring(ctx, t, o){
  const sc = [0.45, 0.65, 0.82][o.stage==null?2:o.stage];
  shadow(ctx, 9*sc);
  ctx.save(); ctx.scale(sc,sc);
  if (o.cow){ ctx.save(); ctx.scale(1.15,1.15); beast4(ctx, t, o, { scale:1, coat:'#e8dcc8', accent:'#4a3a2b', spots:true, horn:'curved', tail:'tuft', udder:true }); ctx.restore(); ctx.restore(); return; }
  const spec = (Z.SPECIES && Z.SPECIES[o.trait]) || null;
  const plan = spec && spec.plan;
  if (plan && plan!=='humanoid'){ /* 兽形子嗣：小型化的母亲形态 */
    ctx.save(); ctx.scale(0.78,0.78);
    (PLAN[plan]||beast4)(ctx, t, o, (spec&&spec.cfg)||{});
    ctx.restore();
    /* 宙斯特征：金色小闪电角 / 光点 */
    S(ctx,'#ffd94a',1.3);
    for(let i=0;i<o.quality;i++) drawSpark(ctx, -8+i*5, -46-i*2, t+i*0.8);
    ctx.restore(); return;
  }
  S(ctx, INK, 1.9);
  const walk = o.moving? Math.sin(t*9+o.seed)*3:0;
  L(ctx,[[-3,-18],[-4-walk,0]]); L(ctx,[[3,-18],[4+walk,0]]);
  FP(ctx,[[-6,-38],[-8,-26],[-6,-17],[6,-17],[8,-26],[6,-38]], '#d4a017', 0.15);
  L(ctx,[[-6,-35],[-10,-27]]); L(ctx,[[6,-35],[10,-28]]);
  const hy=-43.5;
  ctx.beginPath(); ctx.moveTo(-6,hy-2); ctx.quadraticCurveTo(-6.2,hy-8,0,hy-8);
  ctx.quadraticCurveTo(6.2,hy-8,6,hy-2); ctx.quadraticCurveTo(3,hy+5.8,0,hy+5.8);
  ctx.quadraticCurveTo(-3,hy+5.8,-6,hy-2); ctx.closePath();
  ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle='#f4ecd8'; ctx.fill(); ctx.restore(); ctx.stroke();
  /* 卷发（宙斯遗传） */
  S(ctx,INK,1.6); ctx.beginPath(); ctx.arc(0,hy-1,7,Math.PI*0.95,Math.PI*2.05); ctx.stroke();
  S(ctx,INK,1,0.7); for(let i=0;i<3;i++){ C(ctx,-4+i*4,hy-7.4,1.4); }
  if (o.stage>=1){ /* 小胡子 */
    S(ctx,INK,1.4); ctx.beginPath(); ctx.moveTo(-3.4,hy+3); ctx.quadraticCurveTo(-4.2,hy+6,0,hy+6.4);
    ctx.quadraticCurveTo(4.2,hy+6,3.4,hy+3); ctx.stroke(); }
  S(ctx,'#ffd94a',1.3);
  for(let i=0;i<o.quality;i++) drawSpark(ctx, -6+i*4, hy-11-i*2, t+i*0.8);
  face(ctx,0,hy+1,true, Math.sin(t*0.8+o.seed)>0.97,{lod:1.1});
  /* 母亲血统的混血特征 */
  const tr = o.trait||'villager';
  const cfgs = (spec&&spec.cfg)||{};
  S(ctx,INK,1.5);
  if (tr==='mermaid'||tr==='nereid'||tr==='siren'){ ctx.beginPath(); ctx.moveTo(6,-17); ctx.quadraticCurveTo(11,-13,9,-8); ctx.stroke(); }
  else if (tr==='harpy'||tr==='fury'||tr==='siren'||tr==='phoenix'||plan==='bird'){
    const fl=Math.sin(t*6+o.seed)*3;
    ctx.beginPath(); ctx.moveTo(-5,-33); ctx.quadraticCurveTo(-13,-38+fl,-15,-30+fl); ctx.stroke(); }
  else if (tr==='dryad'){ leaf(ctx,-8,-30,3); leaf(ctx,8,-33,3); }
  else if (tr==='gorgo'){ for(let i=0;i<3;i++){ const w2=Math.sin(t*3+i)*1.5;
    ctx.beginPath(); ctx.moveTo(-5+i*5,hy-5); ctx.quadraticCurveTo(-6+i*5+w2,hy-11,-7+i*5,hy-13); ctx.stroke(); } }
  else if (tr==='centauress'||tr==='sphinx'){ ctx.beginPath(); ctx.moveTo(-5,-18); ctx.quadraticCurveTo(-11,-14,-13,-8); ctx.stroke(); }
  else if (tr==='shade'||tr==='nyx'){ ctx.save(); S(ctx,'#8a8ab8',1,0.5); drawSpark(ctx,-8,-25,t); ctx.restore(); }
  else if (tr==='muse'){ ctx.save(); S(ctx,'#8a6ab8',1.2); ctx.font='9px serif'; ctx.fillStyle='#8a6ab8';
    ctx.fillText('♪',8,-40+Math.sin(t*3)*2); ctx.restore(); }
  else if (tr==='princess'){ S(ctx,'#b8860b',1.4); L(ctx,[[-4,hy-6],[-3,hy-10],[0,hy-7],[3,hy-11],[4,hy-6]]); }
  else if (plan==='quadruped'){ /* 小角/小耳 */
    if (cfgs.horn){ S(ctx,cfgs.hornColor||'#c8b89a',1.4); L(ctx,[[-4,hy-6],[-5,hy-11]]); L(ctx,[[4,hy-6],[5,hy-11]]); }
    else { S(ctx,INK,1.3); C(ctx,-5,hy-6,1.6); C(ctx,5,hy-6,1.6); }
    ctx.beginPath(); ctx.moveTo(-5,-18); ctx.quadraticCurveTo(-9,-15,-10,-11); ctx.stroke();
  } else if (plan==='serpent'||plan==='fish'){
    ctx.beginPath(); ctx.moveTo(-5,-17); ctx.quadraticCurveTo(-10,-14,-11,-9); ctx.stroke();
  } else if (plan==='bug'){
    S(ctx,INK,1.1); L(ctx,[[-4,hy-6],[-7,hy-10]]); L(ctx,[[4,hy-6],[7,hy-10]]);
  }
  ctx.restore();
}

/* ============ 赫拉肖像 ============ */
function drawHeraPortrait(ctx, t){
  const D = lod(ctx);
  S(ctx, INK, 2.3);
  const bob=Math.sin(t*2)*2;
  ctx.save(); ctx.translate(0,bob*0.3);
  /* 孔雀羽扇 */
  for(let i=0;i<9;i++){ const a=Math.PI*(0.1+0.8*i/8);
    const x=Math.cos(a)*34, y=-46+Math.sin(a)*30;
    S(ctx,'#2f5d8a',1.6); ctx.beginPath(); ctx.moveTo(0,-44); ctx.quadraticCurveTo(x*0.7,y*0.7-8,x,y); ctx.stroke();
    C(ctx,x,y,4,'#2f5d8a',0.25); S(ctx,'#d4a017',1.3); C(ctx,x,y,1.8,'#d4a017',0.7); }
  /* 长袍 + 褶皱 */
  FP(ctx,[[-12,-42],[-17,-22],[-13,-8],[13,-8],[17,-22],[12,-42]], '#c76b9a', 0.15);
  S(ctx, INK, 1.1, 0.5);
  L(ctx,[[-7,-40],[-9,-14]]); L(ctx,[[0,-40],[0,-14]]); L(ctx,[[7,-40],[9,-14]]);
  S(ctx, INK, 2);
  L(ctx,[[-12,-38],[-19,-28],[-14,-22]]); L(ctx,[[12,-38],[19,-29]]);
  /* 权杖 */
  S(ctx,INK,1.9); L(ctx,[[19,-29],[19,-62]]); C(ctx,19,-66,5,'#d4a017',0.4); drawSpark(ctx,19,-66,t);
  /* 头 */
  const hy=-51;
  ctx.beginPath(); ctx.moveTo(-7.6,hy-2.4); ctx.quadraticCurveTo(-7.8,hy-9.6,0,hy-9.6);
  ctx.quadraticCurveTo(7.8,hy-9.6,7.6,hy-2.4); ctx.quadraticCurveTo(4,hy+6.8,0,hy+6.8);
  ctx.quadraticCurveTo(-4,hy+6.8,-7.6,hy-2.4); ctx.closePath();
  ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle='#f4ecd8'; ctx.fill(); ctx.restore(); ctx.stroke();
  /* 王冠 */
  S(ctx,'#b8860b',2.2); L(ctx,[[-8,hy-7],[-7,hy-15],[-3,hy-9],[0,hy-17],[3,hy-9],[7,hy-15],[8,hy-7]]);
  /* 怒目 */
  S(ctx,INK,1.8);
  L(ctx,[[-5,hy-2],[-2,hy-1]]); L(ctx,[[2,hy-1],[5,hy-2]]);
  S(ctx,INK,1.5); C(ctx,-3.5,hy-0.5,1.2,INK,0.85); C(ctx,3.5,hy-0.5,1.2,INK,0.85);
  S(ctx,INK,1.6); ctx.beginPath(); ctx.arc(0,hy+4.5,3,1.15*Math.PI,1.85*Math.PI); ctx.stroke();
  /* 鼻 */
  S(ctx,INK,1.1,0.7); ctx.beginPath(); ctx.moveTo(0.5,hy+1.5); ctx.quadraticCurveTo(1.8,hy+3,0.1,hy+3.2); ctx.stroke();
  /* 长发 */
  S(ctx,INK,2); ctx.beginPath(); ctx.arc(0,hy-1,11,Math.PI*0.92,Math.PI*2.08); ctx.stroke();
  L(ctx,[[-10.5,hy],[-12,-36],[-9,-33]]); L(ctx,[[10.5,hy],[12,-36],[9,-33]]);
  if (D>1.0){ S(ctx,INK,1,0.6); L(ctx,[[-11,hy+2],[-9,hy+8]]); L(ctx,[[11,hy+2],[9,hy+8]]); }
  ctx.restore();
}

/* ============ 场景装饰（保留 + 农庄新增） ============ */
const DECOR_DRAW = {
  house(ctx,t,o){ S(ctx,INK,2.2);
    ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(-26,-30); ctx.lineTo(26,-30); ctx.lineTo(26,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-32,-30); ctx.lineTo(0,-52); ctx.lineTo(32,-30); ctx.closePath(); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.1; ctx.fillStyle='#c8a86a'; ctx.fill(); ctx.restore();
    S(ctx,INK,1.8); ctx.strokeRect(-8,-18,16,18); C(ctx,5,-9,1.4);
    ctx.strokeRect(-24,-24,10,10); ctx.strokeRect(14,-24,10,10);
    S(ctx,INK,1,0.4); L(ctx,[[-20,-14],[-20,0]]); L(ctx,[[-12,-14],[-12,0]]); },
  fence(ctx,t,o){ S(ctx,INK,1.8);
    for(let i=0;i<4;i++){ L(ctx,[[o.w0+i*14,0],[o.w0+i*14,-14]]); }
    L(ctx,[[o.w0-4,-5],[o.w0+44,-5]]); L(ctx,[[o.w0-4,-11],[o.w0+44,-11]]); },
  tree(ctx,t,o){ const sw=Math.sin(t*0.9+o.seed)*2;
    S(ctx,'#6b4a2b',2.2); L(ctx,[[-3,0],[-2,-24]]); L(ctx,[[3,0],[2,-24]]);
    S(ctx,'#4a6b3a',2.2);
    E(ctx,sw*0.4,-38,17,15,'#7a9a4a',0.18);
    E(ctx,-10+sw*0.3,-27,9,7,'#7a9a4a',0.15); E(ctx,10+sw*0.5,-27,9,7,'#7a9a4a',0.15);
    S(ctx,'#4a6b3a',1,0.4); L(ctx,[[-8,-44],[-4,-38]]); L(ctx,[[6,-46],[9,-40]]); },
  bigtree(ctx,t,o){ const sw=Math.sin(t*0.7+o.seed)*3;
    S(ctx,'#6b4a2b',3); L(ctx,[[-6,0],[-4,-42]]); L(ctx,[[6,0],[4,-42]]);
    L(ctx,[[-4,-30],[-14,-38]]); L(ctx,[[4,-24],[13,-32]]);
    S(ctx,'#4a6b3a',2.6); E(ctx,sw*0.4,-64,26,21,'#7a9a4a',0.18);
    E(ctx,-17+sw*0.3,-48,13,10,'#7a9a4a',0.14); E(ctx,17+sw*0.5,-48,13,10,'#7a9a4a',0.14); },
  wheat(ctx,t,o){ const sw=Math.sin(t*1.3+o.seed)*1.5;
    S(ctx,'#a8863a',1.6);
    for(let i=0;i<5;i++){ const x=-8+i*4; L(ctx,[[x,0],[x+sw,-12]]);
      C(ctx,x+sw,-14,1.6); C(ctx,x+sw-2,-17,1.4); C(ctx,x+sw+2,-17,1.4); } },
  rock(ctx,t,o){ S(ctx,INK,2);
    ctx.beginPath(); ctx.moveTo(-12,0); ctx.quadraticCurveTo(-10,-9,0,-11); ctx.quadraticCurveTo(11,-9,13,0); ctx.closePath(); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.1; ctx.fillStyle='#8a8a8a'; ctx.fill(); ctx.restore();
    S(ctx,INK,1,0.45); L(ctx,[[-5,-3],[-2,-8]]); },
  well(ctx,t,o){ S(ctx,INK,2);
    ctx.beginPath(); ctx.moveTo(-11,0); ctx.lineTo(-11,-14); ctx.lineTo(11,-14); ctx.lineTo(11,0); ctx.stroke();
    L(ctx,[[-14,-14],[0,-30],[14,-14]]); L(ctx,[[-3,-24],[-3,-32]]); L(ctx,[[3,-24],[3,-32]]); L(ctx,[[-5,-32],[5,-32]]);
    C(ctx,0,-27,2.5); },
  statue(ctx,t,o){ S(ctx,INK,1.9);
    ctx.strokeRect(-10,-4,20,4); ctx.strokeRect(-7,-24,14,20);
    L(ctx,[[-7,-20],[-12,-12]]); L(ctx,[[7,-20],[10,-28]]);
    C(ctx,0,-28,4.5); S(ctx,'#b8860b',1.5); drawBolt(ctx,10,-32,5);
    S(ctx,'#4a6b3a',1.4); ctx.beginPath(); ctx.arc(0,-29,5.5,Math.PI,Math.PI*2); ctx.stroke(); },
  seaweed(ctx,t,o){ const sw=Math.sin(t*1.6+o.seed)*4;
    S(ctx,'#3a7a5a',2);
    ctx.beginPath(); ctx.moveTo(-4,0); ctx.quadraticCurveTo(-6+sw,-14,-3+sw,-26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3,0); ctx.quadraticCurveTo(6-sw,-12,3-sw,-22); ctx.stroke(); },
  coral(ctx,t,o){ S(ctx,'#c86a7a',2);
    L(ctx,[[0,0],[0,-14]]); L(ctx,[[0,-9],[-6,-16]]); L(ctx,[[0,-6],[7,-15]]);
    L(ctx,[[0,-12],[-4,-20]]); L(ctx,[[0,-11],[4,-19]]); },
  shell(ctx,t,o){ S(ctx,'#c8a86a',1.8);
    ctx.beginPath(); ctx.arc(0,-2,8,Math.PI,Math.PI*2); ctx.stroke();
    for(let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(0,-2); const a=Math.PI+i*Math.PI/4; ctx.lineTo(Math.cos(a)*8,-2+Math.sin(a)*8); ctx.stroke(); } },
  lavarock(ctx,t,o){ S(ctx,INK,2.2);
    ctx.beginPath(); ctx.moveTo(-14,0); ctx.quadraticCurveTo(-12,-12,0,-14); ctx.quadraticCurveTo(13,-12,15,0); ctx.closePath(); ctx.stroke();
    S(ctx,'#c8562a',1.8); L(ctx,[[-7,-4],[-3,-8]]); L(ctx,[[2,-3],[7,-9]]);
    ctx.save(); S(ctx,'#ffd94a',1.2,0.5+Math.sin(t*4+o.seed)*0.3); drawSpark(ctx,0,-8,t); ctx.restore(); },
  vent(ctx,t,o){ S(ctx,INK,2.2);
    ctx.beginPath(); ctx.moveTo(-16,0); ctx.quadraticCurveTo(-8,-8,-5,-16); ctx.lineTo(5,-16);
    ctx.quadraticCurveTo(8,-8,16,0); ctx.closePath(); ctx.stroke();
    S(ctx,'#8a5a3a',1.6,0.5);
    for(let i=0;i<3;i++){ const p=((t*0.5+i*0.33)%1); const y=-16-p*22; ctx.globalAlpha=0.5*(1-p);
      C(ctx,Math.sin(t+i*2)*4,y,2+p*4); } ctx.globalAlpha=1; },
  pillar(ctx,t,o){ S(ctx,INK,2.2);
    ctx.strokeRect(-9,-3,18,3); ctx.strokeRect(-6,-38,12,35); ctx.strokeRect(-9,-42,18,4); },
  cypress(ctx,t,o){ const sw=Math.sin(t*0.8+o.seed)*2;
    S(ctx,INK,2);
    ctx.beginPath(); ctx.moveTo(-3,0); ctx.quadraticCurveTo(sw*0.5,-20,sw,-34);
    ctx.quadraticCurveTo(3+sw,-40,2+sw,-46); ctx.quadraticCurveTo(1+sw,-48,0+sw,-48);
    ctx.quadraticCurveTo(-2+sw,-46,-3+sw,-40); ctx.quadraticCurveTo(-6+sw,-20,-3,0); ctx.stroke(); },
  tomb(ctx,t,o){ S(ctx,INK,2);
    ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-8,-12); ctx.quadraticCurveTo(-8,-20,0,-20);
    ctx.quadraticCurveTo(8,-20,8,-12); ctx.lineTo(8,0); ctx.stroke();
    S(ctx,INK,1.5,0.6); L(ctx,[[-3,-14],[3,-9]]); L(ctx,[[-3,-9],[3,-14]]); },
  brazier(ctx,t,o){ S(ctx,INK,2);
    L(ctx,[[-5,0],[-3,-12]]); L(ctx,[[5,0],[3,-12]]); L(ctx,[[-7,-12],[7,-12]]);
    const f=Math.sin(t*6+o.seed)*2;
    S(ctx,'#c8562a',1.9); ctx.beginPath(); ctx.moveTo(-4,-12);
    ctx.quadraticCurveTo(-2,-20+f,0,-22); ctx.quadraticCurveTo(2,-18-f,4,-12); ctx.stroke();
    ctx.save(); S(ctx,'#ffd94a',1.2,0.7); drawSpark(ctx,0,-24,t); ctx.restore(); },
  flower(ctx,t,o){ const sw=Math.sin(t*1.5+o.seed)*1.5;
    S(ctx,'#4a6b3a',1.5); L(ctx,[[0,0],[sw,-8]]);
    S(ctx,'#d0506a',1.5); for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+t*0.2; C(ctx,sw+Math.cos(a)*2.6,-8+Math.sin(a)*2.6,1.5); } },
  /* —— 农庄新增 —— */
  haystack(ctx,t,o){ S(ctx,'#a8863a',2);
    ctx.beginPath(); ctx.moveTo(-18,0); ctx.quadraticCurveTo(-14,-22,0,-24);
    ctx.quadraticCurveTo(14,-22,18,0); ctx.closePath();
    ctx.save(); ctx.globalAlpha=0.18; ctx.fillStyle='#d8b86a'; ctx.fill(); ctx.restore(); ctx.stroke();
    S(ctx,'#a8863a',1,0.6);
    L(ctx,[[-10,-2],[-8,-18]]); L(ctx,[[0,-2],[0,-21]]); L(ctx,[[10,-2],[8,-18]]);
    L(ctx,[[-16,0],[18,0]]); },
  trough(ctx,t,o){ S(ctx,INK,2);
    ctx.beginPath(); ctx.moveTo(-16,-10); ctx.lineTo(-13,0); ctx.lineTo(13,0); ctx.lineTo(16,-10); ctx.closePath(); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.15; ctx.fillStyle='#8a9a5b'; ctx.fill(); ctx.restore();
    S(ctx,INK,1.2,0.5); L(ctx,[[-10,-3],[10,-3]]); },
  cart(ctx,t,o){ S(ctx,INK,2);
    ctx.beginPath(); ctx.moveTo(-20,-8); ctx.lineTo(-20,-24); ctx.lineTo(14,-24); ctx.lineTo(14,-8); ctx.closePath(); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle='#c8a86a'; ctx.fill(); ctx.restore();
    C(ctx,-12,-2,7); C(ctx,8,-2,7);
    S(ctx,INK,1.6); L(ctx,[[14,-16],[26,-12]]); },
  gate(ctx,t,o){ S(ctx,'#b8860b',2.4);
    ctx.beginPath(); ctx.arc(0,-26,22,Math.PI*0.95,Math.PI*2.05); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.12+Math.sin(t*2)*0.05; ctx.fillStyle='#d4a017';
    ctx.beginPath(); ctx.arc(0,-26,20,Math.PI,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); S(ctx,'#ffd94a',1.3,0.6); drawSpark(ctx,-8,-38,t); drawSpark(ctx,8,-36,t+1); drawSpark(ctx,0,-44,t+2); ctx.restore(); }
};

Z.draw = {
  INK: INK,
  primitives: { S:S, L:L, C:C, E:E, FP:FP, face:face, shadow:shadow, drawHeart:drawHeart, drawBolt:drawBolt,
                drawSpark:drawSpark, leaf:leaf, hearts:hearts, zzz:zzz, hair:hair, hatch:hatch, lod:lod },
  builders: { quadruped:beast4, bird:beastBird, fish:beastFish, bug:beastBug, serpent:beastSerpent },
  zeus: drawZeus,
  hera: drawHeraPortrait,
  offspring: drawOffspring,
  species: function(ctx, key, t, o){
    ctx_ = ctx;
    const spec = (Z.SPECIES && Z.SPECIES[key]) || null;
    if (spec && spec.plan && PLAN[spec.plan]){ PLAN[spec.plan](ctx, t, o||{}, spec.cfg||{}); return; }
    const fn = SPECIES_DRAW[key];
    if (fn) fn(t, o||{});
  },
  hasSpecies: function(key){
    const spec = (Z.SPECIES && Z.SPECIES[key]) || null;
    return !!(SPECIES_DRAW[key] || (spec && spec.plan && PLAN[spec.plan]));
  },
  decor: function(ctx, key, t, o){ const fn = DECOR_DRAW[key]; if (fn) fn(ctx, t, o||{}); },
  hasDecor: function(key){ return !!DECOR_DRAW[key]; }
};
})();
