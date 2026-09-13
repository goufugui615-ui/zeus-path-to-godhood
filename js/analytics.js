/* ============================================================
 * 宙斯成神之路 · 访问统计（51.LA，默认关闭）
 *
 * 【怎么用】
 *   1. 去 https://v6.51.la/ 注册并添加站点（填你的 GitHub Pages 域名）
 *   2. 在「统计代码」里拿到 id 和 ck（形如 L4NNnKpJZ0RcW8GY）
 *   3. 把下面 LA_ID / LA_CK 填上，保存即可
 *
 * 【为什么默认关闭】
 *   这是开源项目：留空时不会加载任何第三方脚本、不会往外发任何数据，
 *   别人 Fork 之后也不会把数据算到你的账号上。
 *
 * 【注意】
 *   只有通过网页访问（GitHub Pages 等）才会被统计到；
 *   本地双击 index.html（file:// 协议）基本统计不到。
 * ============================================================ */
(function(){
'use strict';

var LA_ID = '';   // ← 填你的站点 ID，例如 'L4NNnKpJZ0RcW8GY'
var LA_CK = '';   // ← 填你的 ck（通常与 ID 相同）；留空则自动取 LA_ID

/* 未配置 → 直接跳过，不加载任何外部脚本 */
if (!LA_ID) return;

try{
  var s = document.createElement('script');
  s.charset = 'UTF-8';
  s.id = 'LA_COLLECT';
  s.async = true;
  /* 用 https（而非官方的 // 协议相对地址），这样本地 file:// 打开也不会报错 */
  s.src = 'https://sdk.51.la/js-sdk-pro.min.js';
  s.onerror = function(){ /* 统计脚本加载失败不影响游戏 */ };
  s.onload = function(){
    try{
      if (window.LA){
        window.LA.init({ id: LA_ID, ck: LA_CK || LA_ID, autoTrack: true });
      }
    }catch(e){}
  };
  document.head.appendChild(s);
}catch(e){}
})();
