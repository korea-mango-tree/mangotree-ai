/* 활용사례 「실제 제작 작업물」: 포트폴리오 최근 게시물 불러오기
   - mangotree.co.kr 포트폴리오 API(포트폴리오 페이지와 같은 주소)에서 작업물을 받아 날짜 최신순으로 6개를 보여 준다.
     분야(상세페이지·촬영·홈페이지·인쇄)를 번갈아 섞어(각 분야 안에서는 최신순) 키 큰 상세페이지 카드가 한쪽에 몰리지 않게 한다.
   - 맨 위 넓은 대표 카드(.x-hw.wide)는 그대로 두고, 그 아래 정적 카드(더보기용 숨김 카드 포함)를 교체한다.
   - 나머지 최근 게시물(최대 MAX개)은 숨겨 두고 「작업물 더보기」로 COUNT개씩 연다. 기존 정적 더보기(site.js) 대신 이 스크립트가 버튼을 맡는다.
   - API가 실패하거나 응답이 비면 HTML에 있는 정적 카드를 그대로 둔다.
   - DB 값은 textContent·속성으로만 넣는다(innerHTML 금지). URL은 http(s)만 허용. */
(function () {
  var API = 'https://mangotree.co.kr/api/portfolio.php?cat=all&limit=30';
  var TIMEOUT = 6000, COUNT = 6, MAX = 30;
  var list = document.querySelector('#works .x-hworks');
  if (!list) return;
  // 지그재그(masonry) 배치: 가장 짧은 열에 차례로 놓는다(assets/masonry.js). 정적 카드에도 먼저 적용.
  var masonry = window.mtMasonry ? window.mtMasonry(list, ':scope > li') : { relayout: function () {} };
  if (!window.fetch || !window.AbortController) return;

  function safeUrl(v) { try { var u = new URL(String(v), location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (e) { return ''; } }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  // "[D392]스마트카드태그 상세페이지 제작" → "스마트카드태그"
  function cleanTitle(t) { return String(t || '').replace(/^\s*\[[A-Za-z]*\d+\]\s*/, '').replace(/\s*(상세페이지|홈페이지)\s*제작\s*$/, '').trim(); }
  function fmtDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? m[1] + '.' + m[2] + '.' + m[3] : ''; }

  function card(it) {
    var title = cleanTitle(it.title), catName = String(it.catName || ''), link = safeUrl(it.link), thumb = safeUrl(it.thumb), date = fmtDate(it.date);
    if (!title || !thumb) return null;
    var li = el('li', 'x-hw'); li.dataset.cat = String(it.cat || ''); var fig = el('figure'), a = el(link ? 'a' : 'span', 'x-hw-frame');
    if (link) { a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    var img = el('img'); img.src = thumb; img.alt = ''; img.width = 400; img.height = 541; img.loading = 'lazy'; img.decoding = 'async';
    a.appendChild(img);
    a.appendChild(el('span', 'sr-only', title + ' ' + catName + ' 작업물' + (link ? ' — 망고트리 원본 작업 페이지 (새 창)' : '')));
    var cap = el('figcaption');
    cap.appendChild(el('span', 'x-wcat', catName));
    cap.appendChild(el('span', 'x-wname', title));
    if (date) { var t = el('time', 'x-wsrc', date); t.dateTime = String(it.date).slice(0, 10); cap.appendChild(t); }
    fig.appendChild(a); fig.appendChild(cap); li.appendChild(fig);
    return li;
  }

  // 기존 더보기 버튼을 새 버튼으로 바꿔(site.js의 정적 카드용 동작 제거) 불러온 카드 기준으로 연다.
  function setupMore(shownBase, rest) {
    var old = document.querySelector('[data-usecase-more]');
    if (!old) return;
    var btn = old.cloneNode(true);
    old.parentNode.replaceChild(btn, old);
    var count = btn.querySelector('[data-usecase-more-count]'), shown = 0, total = 1 + shownBase + rest.length;
    function update() { if (count) count.textContent = '(' + (1 + shownBase + shown) + ' / ' + total + ')'; btn.hidden = shown >= rest.length; }
    btn.addEventListener('click', function () {
      var next = rest.slice(shown, shown + COUNT);
      next.forEach(function (li) { li.hidden = false; });
      shown += next.length; update(); masonry.relayout();
      if (next[0]) { next[0].tabIndex = -1; next[0].focus({ preventScroll: true }); next[0].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }); }
    });
    update();
  }

  var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
  list.setAttribute('aria-busy', 'true');
  fetch(API, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      var items = json && json.status === 'success' && json.data && Array.isArray(json.data.items) ? json.data.items.slice() : [];
      items.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
      // 분야별로 나눈 뒤 최신순을 유지하며 분야를 번갈아 꺼낸다(상세·홈·촬영·인쇄가 섞여 키 큰 카드가 한쪽에 몰리지 않게).
      var byCat = {}, order = [], all = [], i;
      items.slice(0, MAX * 2).forEach(function (it) { var c = String(it.cat || ''); if (!byCat[c]) { byCat[c] = []; order.push(c); } byCat[c].push(it); });
      for (var round = 0; all.length < items.length; round++) {
        var took = false;
        order.forEach(function (c) { if (byCat[c][round]) { all.push(byCat[c][round]); took = true; } });
        if (!took) break;
      }
      var first = [], rest = [];
      for (i = 0; i < all.length && first.length + rest.length < MAX; i++) {
        var li = card(all[i]);
        if (!li) continue;
        (first.length < COUNT ? first : rest).push(li);
      }
      if (!first.length) throw new Error('빈 응답');
      [].slice.call(list.children).forEach(function (n) { if (!n.classList.contains('wide')) n.remove(); });
      first.forEach(function (li) { list.appendChild(li); });
      rest.forEach(function (li) { li.hidden = true; list.appendChild(li); });
      setupMore(first.length, rest);
      masonry.relayout();
    })
    .catch(function (e) { console.warn('[usecase] 최근 작업물 로드 실패, 정적 카드 사용:', e && e.name === 'AbortError' ? '타임아웃' : e); })
    .then(function () { clearTimeout(timer); list.removeAttribute('aria-busy'); });
})();
