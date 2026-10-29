"""사용자 페이지 공통 마크업 정리 (한 번 실행용, 다시 실행해도 결과가 같도록 작성).

- 공통 헤더 메뉴: '기능'(진단 복사본) 대신 'AI 모듈'(modules.html), 현재 위치 aria-current
- 모바일 메뉴 버튼 접근성 속성, 본문 바로가기, <main> 랜드마크
- 우측 하단 카카오 일반 주소 버튼 -> 도입 문의 메일
- 페이지마다 복사돼 있던 공통 스크립트 -> assets/site.js, 공통 스타일 -> assets/site.css
- 검색·공유 메타(canonical, Open Graph)
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://korea-mango-tree.github.io/mangotree-ai/'
MAIL = 'mailto:mtree712@gmail.com?subject=%5B%EB%A7%9D%EA%B3%A0%ED%8A%B8%EB%A6%AC%20AI%2B%5D%20%EB%8F%84%EC%9E%85%20%EB%AC%B8%EC%9D%98'  # [망고트리 AI+] 도입 문의

PAGES = ['index', 'products', 'modules', 'platforms', 'usecase', 'portfolio', 'pricing', 'diagnosis']
NAV = [('products', '제품'), ('modules', 'AI 모듈'), ('platforms', '플랫폼'),
       ('usecase', '활용사례'), ('portfolio', '포트폴리오'), ('pricing', '요금제')]
DESC = {
    'index': '상세페이지·콘텐츠 제작부터 검색·추천·상담, 매출 분석까지. 커머스의 제작·판매·운영을 하나로 연결하는 망고트리 AI+. 무료 진단으로 먼저 필요한 AI를 확인하세요.',
    'usecase': '상품이 안 팔릴 때, 콘텐츠 만들 시간이 없을 때, 문의가 많을 때. 커머스 고민별 AI 활용 방법을 소개합니다.',
}
MAIL_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/>'
             '<path d="M3 7l9 6 9-6"/></svg>')


def nav_html(page):
    items = []
    for href, label in NAV:
        cur = ' class="active" aria-current="page"' if href == page else ''
        items.append(f'<li><a href="{href}.html"{cur}>{label}</a></li>')
    items.append('<li class="nav-cta-m"><a href="diagnosis.html">무료 AI 진단 시작</a></li>')
    return '<ul class="nav-links" id="navLinks">' + ''.join(items) + '</ul>'


def sub(pattern, repl, s, count=1, flags=0, required=True, name=''):
    new, n = re.subn(pattern, repl, s, count=count, flags=flags)
    if required and n == 0:
        sys.exit(f'패턴을 찾지 못함: {name or pattern}')
    return new


def process(page):
    path = ROOT / f'{page}.html'
    s = path.read_text(encoding='utf-8')

    # 파비콘: base64 인라인 -> 같은 내용의 파일
    s = re.sub(r'<link rel="icon" href="data:image/x-icon;base64,[^"]*">', '<link rel="icon" href="assets/favicon.ico">', s)

    # 설명·검색·공유 메타
    if page in DESC:
        s = sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESC[page]}">', s, name='description')
    if 'rel="canonical"' not in s:
        title = re.search(r'<title>([^<]*)</title>', s).group(1)
        desc = re.search(r'<meta name="description" content="([^"]*)">', s).group(1)
        url = BASE if page == 'index' else f'{BASE}{page}.html'
        meta = (f'\n<link rel="canonical" href="{url}">'
                f'\n<meta property="og:type" content="website">'
                f'\n<meta property="og:site_name" content="MANGOTREE AI+">'
                f'\n<meta property="og:locale" content="ko_KR">'
                f'\n<meta property="og:title" content="{title}">'
                f'\n<meta property="og:description" content="{desc}">'
                f'\n<meta property="og:url" content="{url}">'
                f'\n<meta property="og:image" content="{BASE}assets/og-image.png">'
                f'\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
                f'\n<meta name="twitter:card" content="summary_large_image">'
                f'\n<meta name="theme-color" content="#FFFFFF">')
        s = sub(r'(<meta name="description" content="[^"]*">)', lambda m: m.group(1) + meta, s, name='meta insert')

    # 공통 스타일: 인라인 스타일 다음에 불러와 덮어쓰기
    if 'assets/site.css' not in s:
        s = sub(r'</head>', '<link rel="stylesheet" href="assets/site.css">\n</head>', s, name='head')

    # 헤더 메뉴
    s = sub(r'<ul class="nav-links" id="navLinks">.*?</ul>', nav_html(page), s, flags=re.S, name='nav')
    cta_cur = ' aria-current="page"' if page == 'diagnosis' else ''
    s = sub(r'<a href="diagnosis.html" class="nav-cta"[^>]*>', f'<a href="diagnosis.html" class="nav-cta"{cta_cur}>', s, name='nav-cta')
    s = sub(r'<button class="burger"[^>]*>',
            '<button class="burger" id="burger" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="navLinks">',
            s, name='burger')

    # 본문 바로가기 + main 랜드마크
    if 'class="skip-link"' not in s:
        s = sub(r'<body>\n?', '<body>\n<a class="skip-link" href="#main">본문 바로가기</a>\n', s, name='body')
    if '<main id="main"' not in s:
        s = sub(r'</header>', '</header>\n<main id="main" tabindex="-1">\n', s, name='header end')
        s = sub(r'<footer>', '</main>\n<footer>', s, name='footer start')

    # 푸터: 진단 복사본 링크 -> AI 모듈
    s = s.replace('<a href="features.html">핵심 기능</a>', '<a href="modules.html">AI 모듈</a>')

    # 카카오 일반 주소 버튼 -> 도입 문의 메일
    s = re.sub(r'<a class="kakao"[^>]*>.*?</a>',
               f'<a class="contact-fab" href="{MAIL}"><span class="klabel">도입 문의</span>{MAIL_ICON}</a>',
               s, flags=re.S)

    # 마지막 행동 유도: 서브페이지에는 없는 #workspace 대신 도입 문의, 진단 버튼 문구 통일
    s = s.replace('<a href="#workspace" class="btn btn-line">대표 데모 보기</a>',
                  f'<a href="{MAIL}" class="btn btn-line">도입 문의 메일 보내기</a>')
    s = s.replace('무료 AI 진단 신청 →', '무료 AI 진단 시작 →')

    # 채널 로고: 의미 없는 alt="channel" 대신 장식 처리(채널 이름은 바로 위 문장에 있음)
    s = s.replace('<div class="clogos reveal">', '<div class="clogos reveal" aria-hidden="true">')
    s = s.replace('alt="channel">', 'alt="" loading="lazy">')

    # 근거 없는 성장 수치 배지 제거
    s = s.replace('<span class="vz-up">▲ 32%</span>', '')

    # 근거 없는 '인기' 배지 -> '추천'
    s = s.replace('<span class="badge">인기</span>', '<span class="badge">추천</span>')

    # 플랫폼 페이지: 바로 위 카드와 같은 화면 4장을 반복하던 'Service UI' 갤러리 제거
    if page == 'platforms':
        a = s.find('<section class="example"><div class="wrap"><div class="sec-head reveal"><span class="eyebrow">Service UI')
        if a != -1:
            b = s.index('</section>', a) + len('</section>')
            s = s[:a] + s[b:]

    # 첫 화면(첫 섹션) 아래 이미지는 지연 로딩
    m = s.find('<main id="main"')
    if m != -1:
        first_end = s.index('</section>', m)
        main_end = s.index('</main>', first_end)
        body = re.sub(r'<img (?![^>]*loading=)', '<img loading="lazy" ', s[first_end:main_end])
        s = s[:first_end] + body + s[main_end:]

    # 페이지마다 복사된 공통 스크립트 제거(헤더·메뉴·등장효과·맨위로·포트폴리오 필터 + 쓰이지 않는 acBtn 즉시진단)
    start = s.find("const header=document.getElementById('header');")
    if start != -1:
        end_marker = "acName.addEventListener('keydown',function(e){if(e.key==='Enter')run();});}"
        end = s.find(end_marker, start)
        if end == -1:
            # acBtn 블록이 없는 페이지: 포트폴리오 필터 블록 끝까지
            end_marker = "c.style.display=(f==='all'||c.dataset.cat===f)?'':'none';});}));}"
            end = s.find(end_marker, start)
        if end == -1:
            sys.exit(f'{page}: 공통 스크립트 끝을 찾지 못함')
        end += len(end_marker)
        if s[end:end + 1] == '\n':
            end += 1
        s = s[:start] + s[end:]
        s = re.sub(r'<script>\s*</script>\n?', '', s)
    if 'assets/site.js' not in s:
        s = sub(r'</body>', '<script src="assets/site.js" defer></script>\n</body>', s, name='body end')

    path.write_text(s, encoding='utf-8')


for p in PAGES:
    process(p)
print('ok')
