#!/usr/bin/env python3
"""실사 배경 사진(모니터가 있는 장면) 안의 모니터 화면에 녹화 영상을 끼워 넣는다.

사용: plate_composite.py 배경.jpg 화면영상.mp4 출력.mp4 "x0,y0 x1,y1 x2,y2 x3,y3" [확대비율]
  네 점: 배경 사진 위 모니터 화면의 왼쪽위, 오른쪽위, 오른쪽아래, 왼쪽아래 꼭짓점(배경 원본 픽셀 기준).
  확대비율: 영상 처음→끝 동안 천천히 다가가는 정도(기본 1.06). 1이면 고정.
출력: 1920x1080·30fps, 화면영상과 같은 길이, 소리 없음.
"""
import sys, subprocess, tempfile, os
from PIL import Image, ImageDraw, ImageFilter

plate, screen, out, quad = sys.argv[1:5]
zoom = float(sys.argv[5]) if len(sys.argv) > 5 else 1.06
W, H = 1920, 1080
pts = [tuple(map(float, p.split(','))) for p in quad.split()]
im = Image.open(plate).convert('RGB')
# 배경을 1920x1080으로 꽉 채우도록 잘라 맞춘다(가운데 기준)
s = max(W / im.width, H / im.height)
nw, nh = round(im.width * s), round(im.height * s)
ox, oy = (nw - W) // 2, (nh - H) // 2
im = im.resize((nw, nh), Image.LANCZOS).crop((ox, oy, ox + W, oy + H))
pts = [(x * s - ox, y * s - oy) for x, y in pts]

tmp = tempfile.mkdtemp()
bg = os.path.join(tmp, 'bg.png'); im.save(bg)
# 화면 영역 마스크(가장자리 1px 부드럽게)
m = Image.new('L', (W, H), 0)
ImageDraw.Draw(m).polygon(pts, fill=255)
m = m.filter(ImageFilter.GaussianBlur(0.8))
mask = os.path.join(tmp, 'mask.png'); m.save(mask)

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', screen],
                           capture_output=True, text=True).stdout.strip())
n = int(round(dur * 30))
(x0, y0), (x1, y1), (x2, y2), (x3, y3) = pts
fc = (
    f"[1:v]fps=30,scale={W}:{H},format=rgba,"
    f"perspective=x0={x0}:y0={y0}:x1={x1}:y1={y1}:x2={x3}:y2={y3}:x3={x2}:y3={y2}:sense=destination:interpolation=cubic[scr];"
    f"[2:v]format=gray[msk];[scr][msk]alphamerge[scrm];"
    f"[0:v][scrm]overlay=0:0:format=auto,"
    # 화면 유리 느낌: 아주 옅은 반사광은 생략, 밝기만 살짝 낮춰 배경과 어울리게
    f"zoompan=z='1+({zoom}-1)*on/{max(n-1,1)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps=30,"
    f"format=yuv420p[v]"
)
subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-loop', '1', '-t', str(dur), '-i', bg, '-i', screen,
                '-loop', '1', '-t', str(dur), '-i', mask, '-filter_complex', fc, '-map', '[v]', '-t', str(dur),
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', out], check=True)
print(out, dur)
