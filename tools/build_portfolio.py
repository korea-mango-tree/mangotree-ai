"""포트폴리오 확장 카드 생성 (assets/portfolio/sources.json 기준, 다시 실행해도 결과가 같음).

- 카드용 썸네일: 400×541(카드 비율 340:460) JPEG.
  세로로 긴 원본은 너비를 맞추고 위쪽부터 잘라 제목·워터마크(좌상단)를 남기고,
  넓은 원본(정사각형 등)은 자르지 않고 아이보리 바탕 안에 전체를 넣는다.
- 카드 링크: 상세·홈페이지·인쇄는 망고트리 원본 작업 페이지, 촬영은 원본 이미지(+갤러리 목록 출처).
"""
import json, pathlib, html, re
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/portfolio'
CAT = {'detail': '상세페이지', 'shoot': '촬영·영상', 'home': '홈페이지', 'print': '인쇄·패키지'}
TW, TH = 400, round(400 * 460 / 340)
BEGIN, END = '<!-- portfolio:sources.json -->', '<!-- /portfolio:sources.json -->'


def thumb(item):
    im = Image.open(SRC / item['filename'])
    if im.mode in ('P', 'LA', 'RGBA'):
        im = im.convert('RGBA'); bg = Image.new('RGB', im.size, '#FFFFFF'); bg.paste(im, mask=im.split()[3]); im = bg
    else:
        im = im.convert('RGB')
    w, h = im.size
    if w / h <= 340 / 460:
        im = im.resize((TW, round(h * TW / w)), Image.LANCZOS).crop((0, 0, TW, TH))
    else:
        r = min(TW / w, TH / h); small = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
        im = Image.new('RGB', (TW, TH), '#F5F0E6'); im.paste(small, ((TW - small.width) // 2, (TH - small.height) // 2))
    out = SRC / 'thumbs' / (pathlib.Path(item['filename']).stem + '.jpg')
    out.parent.mkdir(exist_ok=True)
    im.save(out, quality=78, optimize=True, progressive=True)
    return out.relative_to(ROOT).as_posix()


def card(item, src):
    e = lambda s: html.escape(s, quote=True)
    c, t = item['category'], e(item['title'])
    if c == 'shoot':
        main, what = f'assets/portfolio/{item["filename"]}', '원본 이미지 보기'
        cite = f'<a class="x-wsrc" href="{e(item["listingUrl"])}" target="_blank" rel="noopener noreferrer">출처: 망고트리 갤러리 목록<span class="sr-only"> (새 창)</span> ↗</a>'
    else:
        main, what = item['sourceUrl'], '망고트리 작업 페이지에서 보기'
        cite = '<span class="x-wsrc">출처: mangotree.co.kr</span>'
    return (f'      <li class="x-work pf-card" data-cat="{c}"><figure><a class="x-wlink" href="{e(main)}" target="_blank" rel="noopener noreferrer">'
            f'<img src="{src}" alt="" width="{TW}" height="{TH}" loading="lazy" decoding="async">'
            f'<span class="x-wname">{t}<span class="sr-only"> — {CAT[c]} 작업물, {what} (새 창)</span></span></a>'
            f'<figcaption><span class="x-wcat">{CAT[c]}</span>{cite}</figcaption></figure></li>')


def main():
    items = json.loads((SRC / 'sources.json').read_text())['items']
    by = {k: [i for i in items if i['category'] == k] for k in CAT}
    order = [by[k][n] for n in range(max(map(len, by.values()))) for k in ('detail', 'shoot', 'home', 'print') if n < len(by[k])]
    for f in (SRC / 'thumbs').glob('*.jpg'):
        f.unlink()
    block = '\n'.join([BEGIN] + [card(i, thumb(i)) for i in order] + [END])
    p = ROOT / 'portfolio.html'; s = p.read_text()
    if BEGIN in s:
        s = re.sub(re.escape(BEGIN) + '.*?' + re.escape(END), lambda m: block, s, flags=re.S)
    else:
        s = s.replace('    </ul>\n    <p class="x-empty" data-pf-empty hidden>',
                      block + '\n    </ul>\n    <div class="x-more"><button type="button" class="btn btn-line" data-pf-more hidden>더 보기 <span data-pf-more-n></span></button></div>\n    <p class="x-empty" data-pf-empty hidden>', 1)
    total = s.count('class="x-work pf-card"')
    s = re.sub(r'<p class="x-count" data-pf-count aria-live="polite">\d+개 작업</p>', f'<p class="x-count" data-pf-count aria-live="polite">{total}개 작업</p>', s)
    p.write_text(s)
    print('cards', total, 'new', len(order))


if __name__ == '__main__':
    main()
