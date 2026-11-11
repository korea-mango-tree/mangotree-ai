#!/usr/bin/env python3
# 메인 페이지커넥트 카드용 가로 스크린샷 띠(assets/work/pageconnect-wide.webp) 만들기
# 사용: python3 tools/pageconnect_strip.py assets/work/pageconnect-wide.webp 미리보기.png
import sys
from PIL import Image
out,prev=sys.argv[1:3]
# (파일, 자를 영역 x0,y0,x1,y1) — 실제 화면 캡처에서 세로 영역을 잘라 가로로 이어 붙임
P=[('assets/work/pageconnect.jpg',(400,0,1200,900)),
   ('assets/workflows/pageconnect-link.jpg',(170,0,890,900)),
   ('assets/workflows/connect-guide5.jpg',(260,560,1600,1960))]
H=900;G=24;tiles=[]
for f,box in P:
    im=Image.open(f).convert('RGB');x0,y0,x1,y1=box;y1=min(y1,im.height);t=im.crop((x0,y0,x1,y1))
    t=t.resize((round(t.width*H/t.height),H),Image.LANCZOS);tiles.append(t)
W=sum(t.width for t in tiles)+G*(len(tiles)+1)
c=Image.new('RGB',(W,H+G*2),(232,241,236));x=G
for t in tiles:c.paste(t,(x,G));x+=t.width+G
c.save(out,'WEBP',quality=88,method=6);print(c.size)
c.resize((c.width//2,c.height//2)).save(prev)
