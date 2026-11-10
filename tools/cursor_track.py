#!/usr/bin/env python3
"""장면 위에 올릴 마우스 커서 영상(투명 배경 MOV)을 만든다.

사용: cursor_track.py 출력.mov 길이초 W H 배율 ox oy 시작초 배속 "이벤트"
  이벤트: 원본 영상 기준 "초,x,y,종류" 를 ; 로 이어 쓴다. 종류 c=클릭, m=이동만
          예) "0.3,630,250,c;3.8,878,88,c"
  배율·ox·oy: 원본 좌표를 1920x1080 화면 좌표로 옮기는 값(원본*배율+ox).
커서는 각 이벤트 시각에 그 위치에 도착하고, 클릭이면 파란 원이 퍼진다. 커서 뒤에는 파란 그림자를 깐다.
"""
import sys, subprocess
from PIL import Image, ImageDraw, ImageFilter

out, dur, W, H, sc, ox, oy, ss, sp, ev = sys.argv[1:11]
dur = float(dur); W = int(W); H = int(H); sc = float(sc); ox = float(ox); oy = float(oy); ss = float(ss); sp = float(sp)
FPS = 30
pts = []
for e in ev.split(';'):
    if not e.strip():
        continue
    t, x, y, k = e.split(',')
    pts.append(((float(t) - ss) / sp, float(x) * sc + ox, float(y) * sc + oy, k.strip()))
pts.sort()

# 커서 모양(화살표): 4배로 그린 뒤 줄여 가장자리를 부드럽게
CS = 66
def make_cursor(scale=1.0):
    s = 4
    size = int(CS * scale)
    big = Image.new('RGBA', (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    poly = [(0, 0), (0, 34), (9, 26), (15, 40), (21, 37), (15, 24), (27, 24)]
    k = size * s / 42
    p = [(x * k + 2 * s, y * k + 2 * s) for x, y in poly]
    d.polygon(p, fill=(255, 255, 255, 255), outline=(20, 20, 20, 255))
    d.line(p + [p[0]], fill=(20, 20, 20, 255), width=int(2.2 * s))
    return big.resize((size, size), Image.LANCZOS)
CUR = make_cursor(); CUR_DOWN = make_cursor(0.86)
# 커서 뒤 파란 그림자(빛 번짐): 커서 모양을 파랗게 칠해 흐리게 퍼뜨린다
BLUE = (37, 120, 255)
def make_glow(c):
    pad = 36
    a = c.split()[3]
    g = Image.new('RGBA', (c.width + pad * 2, c.height + pad * 2), (0, 0, 0, 0))
    m = Image.new('L', g.size, 0); m.paste(a, (pad, pad))
    m = m.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(14))
    m = m.point(lambda v: min(255, int(v * 1.25)))
    g.putalpha(m); g = Image.composite(Image.new('RGBA', g.size, BLUE + (255,)), g, m)
    g.putalpha(m)
    return g, pad
GLOW, GPAD = make_glow(CUR); GLOW_DOWN, _ = make_glow(CUR_DOWN)

def ease(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)

def pos(T):
    if not pts:
        return None
    # 첫 이벤트 전: 오른쪽 아래에서 들어온다
    sx, sy = pts[0][1] + 260, pts[0][2] + 200
    prev = (0.0, sx, sy)
    for t, x, y, k in pts:
        move = min(0.7, max(0.25, t - prev[0]))
        if T <= t:
            u = ease((T - (t - move)) / move) if T > t - move else 0.0
            return prev[1] + (x - prev[1]) * u, prev[2] + (y - prev[2]) * u
        prev = (t, x, y)
    return prev[1], prev[2]

n = int(round(dur * FPS))
proc = subprocess.Popen(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba',
                         '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'png', out], stdin=subprocess.PIPE)
for i in range(n):
    T = i / FPS
    fr = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    p = pos(T)
    if p:
        down = False
        d = ImageDraw.Draw(fr)
        for t, x, y, k in pts:
            if k == 'c' and t <= T < t + 0.45:
                a = (T - t) / 0.45
                r = 14 + 54 * a
                d.ellipse([x - r, y - r, x + r, y + r], outline=BLUE + (int(255 * (1 - a)),), width=9)
                d.ellipse([x - 13, y - 13, x + 13, y + 13], fill=BLUE + (int(170 * (1 - a)),))
                down = down or (T - t) < 0.15
        c = CUR_DOWN if down else CUR
        g = GLOW_DOWN if down else GLOW
        fr.alpha_composite(g, (int(p[0]) - 2 - GPAD + 4, int(p[1]) - 2 - GPAD + 6))
        fr.alpha_composite(c, (int(p[0]) - 2, int(p[1]) - 2))
    proc.stdin.write(fr.tobytes())
proc.stdin.close(); proc.wait()
