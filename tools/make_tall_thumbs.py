#!/usr/bin/env python3
"""포트폴리오 상세페이지·홈페이지 글의 '긴 썸네일'(400×800, 1:2) 만들기.

망고트리 API(portfolio.php)의 썸네일은 400×541 고정이라, 활용사례 작업물 카드를 좌우 잘림 없이
세로로 길게 보여 주려면 더 긴 이미지가 필요하다. 원본(상품 이미지, 860×13,000px 이상·수 MB)의
윗부분만 HTTP Range 로 받아(기본 JPEG는 위에서부터 저장되므로 앞부분 바이트 = 윗부분) 가로폭에
맞춰 줄이고 1:2로 잘라 assets/portfolio/tall/<it_id>.webp 로 저장한다.

- 원본 주소: 썸네일 thumb-<이름>_400x541.jpg → 같은 폴더의 <이름>.jpg / .png / .jpeg
- 만든 목록은 assets/portfolio/tall/manifest.js (window.MT_TALL)에 적는다. assets/usecase-works.js 가
  이 목록에 있는 글만 긴 썸네일을 쓰고, 없으면 API 썸네일을 그대로 쓴다.
- 새 글이 올라오면 이 스크립트를 다시 돌리면 된다(이미 만든 파일은 건너뜀).

사용: python3 tools/make_tall_thumbs.py
"""
import io
import json
import os
import re
import sys
import time
import urllib.request
from urllib.parse import urlparse, parse_qs

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'portfolio', 'tall')
API = 'https://mangotree.co.kr/api/portfolio.php?cat=all&limit=100'
# 분야별 만들 개수(최신순): 상세페이지는 포트폴리오 갤러리 전체(서버 상한 100), 홈페이지는 활용사례에 쓰는 최근 30개
CATS = {'detail': 100, 'home': 30}
W, H = 400, 800
RANGES = (2_500_000, 10_000_000, None)  # 앞부분만 받아 보고, 아래가 비면(잘린 파일) 더 받는다


def get(url, rng=None, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'mangotree-site-tools'})
            if rng:
                req.add_header('Range', 'bytes=0-%d' % rng)
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except Exception as e:  # 망고트리 서버 연결이 가끔 끊겨 몇 번 다시 시도
            last = e
            time.sleep(2 + i * 2)
    raise last


def originals(thumb):
    m = re.match(r'(.*/)thumb-(.+)_400x541\.(?:jpg|jpeg|png)$', thumb)
    if not m:
        return []
    base = m.group(1) + m.group(2)
    return [base + ext for ext in ('.jpg', '.png', '.jpeg', '.JPG', '.PNG')]


def truncated(img):
    # 앞부분만 받은 파일은 아래가 단색(검정·회색)으로 채워진다. 맨 아래 40px이 완전히 단색이면 잘린 것으로 본다.
    b = img.crop((0, img.height - 40, img.width, img.height)).convert('L').getextrema()
    return b[1] - b[0] < 2


def make(img):
    img = img.convert('RGB')
    w, h = img.size
    need = round(w * H / W)  # 가로폭에 맞췄을 때 1:2가 되는 원본 높이
    img = img.crop((0, 0, w, min(h, need)))
    img = img.resize((W, round(img.height * W / w)), Image.LANCZOS)
    if img.height < H * 0.9:  # 원본이 1:2보다 짧으면 만들지 않음(기존 썸네일이 더 낫다)
        return None
    return img.crop((0, 0, W, min(img.height, H)))


def main():
    os.makedirs(OUT, exist_ok=True)
    items = json.loads(get(API))['data']['items']
    done = {}
    count = {}
    for it in items:
        c = it.get('cat')
        if c not in CATS or count.get(c, 0) >= CATS[c]:
            continue
        count[c] = count.get(c, 0) + 1
        q = parse_qs(urlparse(it.get('link') or '').query)
        iid = (q.get('it_id') or [''])[0]
        if not iid.isdigit():
            continue
        path = os.path.join(OUT, iid + '.webp')
        if os.path.exists(path):
            done[iid] = 1
            continue
        for src in originals(it.get('thumb') or ''):
            out = None
            for rng in RANGES:
                try:
                    data = get(src, rng)
                    img = Image.open(io.BytesIO(data))
                    img.load()
                except Exception:
                    out = 'missing'
                    break
                out = make(img)
                if out is None or not truncated(out):
                    break
            if out == 'missing':
                continue
            if out is None:
                print('skip(short)', iid, src)
                break
            out.save(path, 'WEBP', quality=80, method=6)
            done[iid] = 1
            print('ok', iid, os.path.getsize(path) // 1024, 'KB', it.get('title'))
            break
        else:
            print('fail', iid, it.get('title'), file=sys.stderr)
    with open(os.path.join(OUT, 'manifest.js'), 'w', encoding='utf-8') as f:
        f.write('/* tools/make_tall_thumbs.py 가 만든 긴 썸네일 목록(it_id). 직접 고치지 않는다. */\n')
        f.write('window.MT_TALL=' + json.dumps(dict(sorted(done.items()))) + ';\n')
    print('total', len(done))


if __name__ == '__main__':
    main()
