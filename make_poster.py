# -*- coding: utf-8 -*-
"""《宙斯成神之路》16:9 宣传图生成器
程序化绘制羊皮纸底 + 游戏真实截图 + 楷体排版，输出 1920x1080。
用法：python make_poster.py
"""
import os, random, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

W, H = 1920, 1080
ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, "docs")
OUT = os.path.join(DOCS, "宣传图-16x9.png")

SEPIA = (122, 90, 50)
INK = (43, 43, 51)
GOLD = (184, 134, 11)
DARKGOLD = (122, 90, 16)
RED = (166, 58, 43)

random.seed(20260913)

# ---------- 字体 ----------
def font(cands, size):
    for c in cands:
        p = os.path.join("C:/Windows/Fonts", c)
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

F_TITLE  = font(["STXINGKA.TTF", "STKAITI.TTF", "simkai.ttf"], 132)
F_SUB    = font(["msyhbd.ttc", "msyh.ttc"], 34)
F_LEAD   = font(["STKAITI.TTF", "simkai.ttf", "msyh.ttc"], 40)
F_POINT  = font(["msyh.ttc", "simhei.ttf"], 33)
F_POINTB = font(["msyhbd.ttc", "msyh.ttc"], 33)
F_LINK   = font(["msyh.ttc", "simhei.ttf"], 27)
F_TAG    = font(["msyhbd.ttc", "msyh.ttc"], 26)

# ---------- 羊皮纸底 ----------
def parchment(w, h):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    # 渐变底
    for y in range(h):
        t = y / h
        r = int(247 - 17 * t); g = int(238 - 28 * t); b = int(214 - 42 * t)
        d.line([(0, y), (w, y)], fill=(r, g, b))
    # 云雾色斑
    for _ in range(46):
        x, y, r = random.uniform(0, w), random.uniform(0, h), random.uniform(120, 420)
        blob = Image.new("RGB", (int(r * 2), int(r * 2)), (0, 0, 0))
        bd = ImageDraw.Draw(blob)
        bd.ellipse([0, 0, r * 2, r * 2], fill=(150, 110, 60))
        blob = blob.filter(ImageFilter.GaussianBlur(r / 3))
        mask = Image.new("L", blob.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, r * 2, r * 2], fill=26)
        img.paste(ImageChops.add(img.crop((int(x - r), int(y - r), int(x + r), int(y + r))),
                                 ImageChops.multiply(blob, Image.new("RGB", blob.size, (1, 1, 1)))),
                  (int(x - r), int(y - r))) if False else None
    # 水渍（淡）
    for _ in range(16):
        x, y = random.uniform(0, w), random.uniform(0, h)
        rr = random.uniform(60, 220)
        bd = ImageDraw.Draw(img)
        bd.ellipse([x - rr, y - rr * 0.7, x + rr, y + rr * 0.7], outline=(138, 90, 42))
    img = Image.blend(img, img.filter(ImageFilter.GaussianBlur(6)), 0.5)
    # 纸纤维噪点
    noise = Image.effect_noise((w, h), 26).convert("L")
    img = ImageChops.overlay(img, Image.merge("RGB", (noise, noise, noise)))
    img = Image.blend(img, img, 0.06) if False else img
    # 纤维短线
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(900):
        x, y = random.uniform(0, w), random.uniform(0, h)
        a = random.uniform(0, math.pi); ln = random.uniform(3, 14)
        col = (138, 106, 58, random.randint(6, 16))
        d.line([(x, y), (x + math.cos(a) * ln, y + math.sin(a) * ln)], fill=col, width=1)
    # 折痕
    for _ in range(5):
        x = random.uniform(w * 0.1, w * 0.9)
        d.line([(x, 0), (x + random.uniform(-60, 60), h)], fill=(154, 115, 64, 16), width=3)
    return img

# ---------- 做旧边缘 ----------
def aged_edges(img):
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    bands = [(0, 0, w, 0, 150), (0, h, w, h, 150), (0, 0, 0, h, 110), (w, 0, w, h, 110)]
    for x0, y0, x1, y1, thick in bands:
        for i in range(thick):
            a = int(46 * (1 - i / thick) ** 1.6)
            if y0 == y1:
                d.line([(0, y0 + (i if y0 == 0 else -i)), (w, y0 + (i if y0 == 0 else -i))],
                       fill=(70, 45, 18, a))
            else:
                d.line([(x0 + (i if x0 == 0 else -i), 0), (x0 + (i if x0 == 0 else -i), h)],
                       fill=(70, 45, 18, a))
    # 焦斑
    for _ in range(14):
        side = random.randint(0, 3)
        if side == 0: x, y = random.uniform(0, w), random.uniform(0, 30)
        elif side == 1: x, y = random.uniform(0, w), random.uniform(h - 30, h)
        elif side == 2: x, y = random.uniform(0, 30), random.uniform(0, h)
        else: x, y = random.uniform(w - 30, w), random.uniform(0, h)
        r = random.uniform(20, 60)
        spot = Image.new("RGBA", (int(r * 2), int(r * 2)), (70, 45, 18, 0))
        ImageDraw.Draw(spot).ellipse([0, 0, r * 2, r * 2], fill=(70, 45, 18, 70))
        spot = spot.filter(ImageFilter.GaussianBlur(r / 3))
        overlay.alpha_composite(spot, (int(x - r), int(y - r)))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

# ---------- 装饰 ----------
def bolt(d, x, y, s, color=GOLD, width=4):
    pts = [(x, y - s), (x - s * 0.45, y - s * 0.1), (x + s * 0.1, y - s * 0.05),
           (x - s * 0.15, y + s), (x + s * 0.5, y - s * 0.05), (x - s * 0.05, y)]
    d.polygon(pts, fill=color)

def laurel(d, cx, cy, r, color):
    for sgn in (-1, 1):
        d.arc([cx - r, cy - r * 0.55, cx + r, cy + r * 0.55], start=200 if sgn < 0 else 300,
              end=340 if sgn < 0 else 80, fill=color, width=4)
        for i in range(6):
            a = math.radians(160 + i * 16) if sgn < 0 else math.radians(20 + i * 16)
            lx = cx + sgn * math.cos(a) * r * 0.9
            ly = cy + math.sin(a) * r * 0.5
            d.ellipse([lx - 7, ly - 4, lx + 7, ly + 4], outline=color, width=3)

def compass(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=SEPIA, width=3)
    d.ellipse([cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7], outline=SEPIA, width=2)
    for i in range(8):
        a = i * math.pi / 4
        long_ = r if i % 2 == 0 else r * 0.6
        wdt = 0.16 if i % 2 == 0 else 0.1
        pts = [(cx + math.cos(a) * long_, cy + math.sin(a) * long_),
               (cx + math.cos(a + math.pi / 2) * long_ * wdt, cy + math.sin(a + math.pi / 2) * long_ * wdt),
               (cx, cy),
               (cx + math.cos(a - math.pi / 2) * long_ * wdt, cy + math.sin(a - math.pi / 2) * long_ * wdt)]
        d.polygon(pts, outline=SEPIA)
    d.text((cx - 6, cy - r - 26), "N", font=F_TAG, fill=SEPIA)

def text_bold(d, xy, txt, fnt, fill, bold_px=2):
    x, y = xy
    for dx in range(-bold_px, bold_px + 1):
        for dy in range(-bold_px, bold_px + 1):
            d.text((x + dx, y + dy), txt, font=fnt, fill=fill)
    d.text((x, y), txt, font=fnt, fill=fill)

# ================= 合成 =================
img = parchment(W, H)
img = aged_edges(img)
d = ImageDraw.Draw(img, "RGBA")

# 外框（双线 + 四角）
d.rectangle([34, 34, W - 34, H - 34], outline=SEPIA, width=5)
d.rectangle([50, 50, W - 50, H - 50], outline=(SEPIA[0], SEPIA[1], SEPIA[2], 150), width=2)
M = 50
for (cx, cy, sx, sy) in [(M, M, 1, 1), (W - M, M, -1, 1), (M, H - M, 1, -1), (W - M, H - M, -1, -1)]:
    s = 30
    d.line([(cx + sx * s, cy), (cx, cy), (cx, cy + sy * s)], fill=SEPIA, width=4)
    d.line([(cx + sx * s * 0.5, cy + sy * 5), (cx + sx * 5, cy + sy * 5),
            (cx + sx * 5, cy + sy * s * 0.5)], fill=SEPIA, width=3)

# ---------------- 右侧：游戏截图 ----------------
from PIL import ImageEnhance

def autocrop_dark(im, thresh=95):
    """裁掉四周的深色留白（游戏页面黑边），只留亮色画布区域"""
    g = im.convert("L")
    w, h = g.size
    px = g.load()
    def col_bright(x): return sum(px[x, y] for y in range(0, h, max(1, h // 60))) / len(range(0, h, max(1, h // 60)))
    def row_bright(y): return sum(px[x, y] for x in range(0, w, max(1, w // 60))) / len(range(0, w, max(1, w // 60)))
    L = 0
    while L < w - 1 and col_bright(L) < thresh: L += 1
    R = w - 1
    while R > L and col_bright(R) < thresh: R -= 1
    T = 0
    while T < h - 1 and row_bright(T) < thresh: T += 1
    B = h - 1
    while B > T and row_bright(B) < thresh: B -= 1
    if R - L < w * 0.4 or B - T < h * 0.4:
        return im
    pad = 4
    return im.crop((max(0, L + pad), max(0, T + pad), min(w, R - pad), min(h, B - pad)))

def polish(im, bright=1.07, contrast=1.06):
    im = ImageEnhance.Brightness(im).enhance(bright)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    return im

shot_paths = [os.path.join(DOCS, "v2-village.png"), os.path.join(DOCS, "v2-courtship.png")]
main_shot = polish(autocrop_dark(Image.open(shot_paths[0]).convert("RGB")))
sub_shot = None
if os.path.exists(shot_paths[1]):
    sub_shot = polish(autocrop_dark(Image.open(shot_paths[1]).convert("RGB")), 1.05, 1.05)

frame_x, frame_y = 930, 168

def paste_card(im, src, x, y, w):
    """把截图做成羊皮纸卡片贴上，返回 (新图, 卡片宽, 卡片高)"""
    s = src.copy()
    sw, sh = s.size
    s = s.resize((w, int(sh * w / sw)), Image.LANCZOS)
    cw, ch = s.size
    sh_layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh_layer).rounded_rectangle([x - 12, y - 8, x + cw + 12, y + ch + 20],
                                              radius=9, fill=(60, 40, 16, 135))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(15))
    im = Image.alpha_composite(im.convert("RGBA"), sh_layer).convert("RGB")
    dd = ImageDraw.Draw(im, "RGBA")
    dd.rounded_rectangle([x - 16, y - 14, x + cw + 16, y + ch + 14], radius=8,
                         fill=(250, 243, 225, 255), outline=SEPIA, width=4)
    im.paste(s, (x, y))
    dd.rounded_rectangle([x - 16, y - 14, x + cw + 16, y + ch + 14], radius=8, outline=SEPIA, width=4)
    return im, cw, ch

img, pw, ph = paste_card(img, main_shot, frame_x, frame_y, 856)
d = ImageDraw.Draw(img, "RGBA")
if sub_shot is not None:
    img, sw2, sh2 = paste_card(img, sub_shot, frame_x + 856 - 556, frame_y + ph + 72, 556)
    d = ImageDraw.Draw(img, "RGBA")

# ---------------- 左侧：文案 ----------------
LX = 120
d = ImageDraw.Draw(img, "RGBA")

# 顶部小标
bolt(d, LX + 16, 188, 20, GOLD)
d.text((LX + 46, 166), "开源网页游戏 · 零依赖 · 双击即玩", font=F_TAG, fill=(122, 90, 16))
d.line([(LX, 226), (LX + 250, 226)], fill=(SEPIA[0], SEPIA[1], SEPIA[2], 120), width=2)

# 主标题
text_bold(d, (LX, 258), "宙斯成神之路", F_TITLE, INK, bold_px=3)
d.text((LX + 6, 424), "ZEUS · PATH TO GODHOOD", font=F_SUB, fill=DARKGOLD)

# 一句话
d.text((LX + 4, 480), "神力 100 → 10000，登神成为众神之父", font=F_LEAD, fill=(70, 55, 40))

# 卖点
points = [
    ("52", "种可结缘对象 —— 从农家姑娘到母牛、美人鱼、凤凰"),
    ("赫拉", "会下界查岗，把你的孩子变成牛（哞）"),
    ("0", "依赖 · 单文件 · Canvas 程序化手绘 + 羊皮纸地图"),
]
yy = 566
for k, v in points:
    d.ellipse([LX, yy + 8, LX + 16, yy + 24], fill=GOLD)
    kw = d.textlength(k, font=F_POINTB)
    d.text((LX + 30, yy), k, font=F_POINTB, fill=RED)
    d.text((LX + 30 + kw + 8, yy), v, font=F_POINT, fill=(60, 50, 42))
    yy += 58

# 底部链接
d.line([(LX, 760), (LX + 620, 760)], fill=(SEPIA[0], SEPIA[1], SEPIA[2], 120), width=2)
d.text((LX, 790), "github.com/goufugui615-ui/zeus-path-to-godhood", font=F_LINK, fill=(90, 70, 30))
d.text((LX, 830), "在线试玩：goufugui615-ui.github.io/zeus-path-to-godhood", font=F_LINK, fill=(90, 70, 30))

# 桂冠 + 罗盘装饰
compass(d, W - 120, H - 130, 46)

img.save(OUT, quality=95)
print("saved:", OUT, img.size)
