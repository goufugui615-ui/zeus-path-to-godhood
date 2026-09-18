/* ============================================================
 * 宙斯成神之路 · 统计后端（Cloudflare Worker + KV）
 *
 * 部署三步：
 *   1. Cloudflare 控制台 → Workers 和 Pages → 创建 Worker → 粘贴本文件 → 部署
 *   2. Worker 设置 → 变量 → KV 命名空间绑定：变量名 ZEUS，值选一个 KV 空间
 *   3. （可选）再加一个机密变量 ADMIN_KEY，作为后台查看口令
 *   然后把 Worker 的域名填进 js/stats.js 的 endpoint
 *
 * 接口：
 *   POST /hit        body: {type:'visit|start|court|birth|win|cow', q:0-4, vid:'...'}
 *   GET  /stats?k=ADMIN_KEY    返回聚合 JSON
 * ============================================================ */
export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const kv = env.ZEUS;
    if (!kv) return json({ error: 'KV 未绑定（变量名应为 ZEUS）' }, cors, 500);

    /* ---------- 上报 ---------- */
    if (url.pathname === '/hit' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch (e) { body = {}; }
      const type = String(body.type || 'visit').slice(0, 16);
      const allowed = ['visit', 'start', 'court', 'birth', 'win', 'cow'];
      if (allowed.indexOf(type) < 0) return json({ ok: false, err: 'bad type' }, cors, 400);

      const date = new Date().toISOString().slice(0, 10);
      ctx.waitUntil((async () => {
        /* UV：按 IP + 日期去重（48 小时过期） */
        if (type === 'visit' || type === 'start') {
          const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
          const iph = await hash(ip + '|' + date);
          const uvKey = `uv:${date}:${iph}`;
          const seen = await kv.get(uvKey);
          if (!seen) {
            await kv.put(uvKey, '1', { expirationTtl: 60 * 60 * 48 });
            await incr(kv, `uv:${date}`);
            await incr(kv, 'uv_total');
          }
          await incr(kv, `pv:${date}`);
          await incr(kv, 'pv_total');
        }
        /* 各类事件 */
        await incr(kv, `${type}_total`);
        await incr(kv, `${type}:${date}`);
        /* 后代品质分布 */
        if (type === 'birth' && typeof body.q === 'number' && body.q >= 0 && body.q <= 4) {
          await incr(kv, `q${body.q}`);
        }
      })());
      return json({ ok: true }, cors);
    }

    /* ---------- 后台数据 ---------- */
    if (url.pathname === '/stats') {
      if (env.ADMIN_KEY && url.searchParams.get('k') !== env.ADMIN_KEY) {
        return json({ error: 'forbidden：口令不对' }, cors, 403);
      }
      const data = await buildStats(kv);
      return json(data, cors);
    }

    return json({ service: 'zeus-stats', usage: 'POST /hit · GET /stats?k=...' }, cors);
  }
};

/* ---------- 工具 ---------- */
function json(obj, headers, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}
async function incr(kv, key, n) {
  n = n || 1;
  const v = parseInt((await kv.get(key)) || '0', 10);
  const next = v + n;
  await kv.put(key, String(next));
  return next;
}
async function num(kv, key) {
  return parseInt((await kv.get(key)) || '0', 10);
}
async function hash(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
async function listAll(kv, prefix) {
  let out = [], cursor = null;
  do {
    const res = await kv.list({ prefix, cursor: cursor || undefined, limit: 1000 });
    out = out.concat(res.keys.map(k => k.name));
    cursor = res.cursor || null;
  } while (cursor);
  return out;
}
async function buildStats(kv) {
  const pvKeys = await listAll(kv, 'pv:');          // pv:2026-09-19
  const uvKeys = await listAll(kv, 'uv:');          // uv:2026-09-19 与 uv:2026-09-19:<hash>
  const birthKeys = await listAll(kv, 'birth:');
  const winKeys = await listAll(kv, 'win:');
  const startKeys = await listAll(kv, 'start:');

  const isDateKey = k => /^\d{4}-\d{2}-\d{2}$/.test(k.split(':')[1] || '');
  const dailyMap = {};
  const put = (date, field, val) => {
    dailyMap[date] = dailyMap[date] || { date, pv: 0, uv: 0, birth: 0, win: 0, start: 0 };
    dailyMap[date][field] = val;
  };
  for (const k of pvKeys) if (isDateKey(k)) put(k.split(':')[1], 'pv', parseInt((await kv.get(k)) || '0', 10));
  for (const k of uvKeys) if (isDateKey(k)) put(k.split(':')[1], 'uv', parseInt((await kv.get(k)) || '0', 10));
  for (const k of birthKeys) if (isDateKey(k)) put(k.split(':')[1], 'birth', parseInt((await kv.get(k)) || '0', 10));
  for (const k of winKeys) if (isDateKey(k)) put(k.split(':')[1], 'win', parseInt((await kv.get(k)) || '0', 10));
  for (const k of startKeys) if (isDateKey(k)) put(k.split(':')[1], 'start', parseInt((await kv.get(k)) || '0', 10));

  const daily = Object.values(dailyMap).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 30);

  const quality = {};
  for (let i = 0; i < 5; i++) quality[i] = await num(kv, 'q' + i);

  return {
    updated: new Date().toISOString(),
    totals: {
      pv: await num(kv, 'pv_total'),
      uv: await num(kv, 'uv_total'),
      start: await num(kv, 'start_total'),
      court: await num(kv, 'court_total'),
      birth: await num(kv, 'birth_total'),
      win: await num(kv, 'win_total'),
      cow: await num(kv, 'cow_total')
    },
    quality,
    daily
  };
}
