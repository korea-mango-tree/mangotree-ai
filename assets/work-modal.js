/* 작업물 「크게 보기」 공통: 게시물 이미지 불러오기 + 모달
   - window.mtPostImages(link) : 망고트리 게시판 읽기(bbs/board.php)·상품(shop/item.php) 페이지의 내용 영역 이미지 주소를 돌려준다.
       · 실제 사이트(mangotree.co.kr/ai, 같은 도메인)에서는 그 페이지를 직접 읽어(DOMParser) 찾는다.
       · 그 밖(Vercel 미리보기 등)에서는 같은 출처 /api/post-images(api/post-images.js)가 대신 읽는다.
       · 그누보드 썸네일(thumb-이름_가로x세로.ext)은 원본 주소로 바꾸고, 원본이 없을 때 쓸 썸네일 주소를 fallbacks 로 함께 준다.
   - window.mtWorkModal.open({link, fallback, alt, opener, site}) : 포트폴리오와 같은 .pf-modal 모달을 연다(활용사례 작업물에서 사용).
       불러오기에 실패하면 카드 이미지(fallback)를 크게 보여 준다. 닫기 버튼·Esc·바깥 클릭으로 닫고, 닫으면 누른 카드로 포커스 복귀. */
(function () {
  var AREAS = ['.board-view-con', '.board-view-file-conts', '#bo_v_con', '#bo_v_img', '#sit_inf_explan', '#sit_inf'];
  var MAX = 60;

  function isPost(u) {
    try { var x = new URL(u, location.href); return /(^|\.)mangotree\.co\.kr$/.test(x.hostname) && /^\/(bbs\/board|shop\/item)\.php$/.test(x.pathname); } catch (e) { return false; }
  }
  function safe(v) { try { var u = new URL(String(v), location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (e) { return ''; } }
  var sameSite = /(^|\.)mangotree\.co\.kr$/.test(location.hostname);

  function fromHtml(html, base) {
    var doc = new DOMParser().parseFromString(html, 'text/html'), seen = {}, images = [], fallbacks = [];
    AREAS.forEach(function (sel) {
      var box = doc.querySelector(sel);
      if (!box) return;
      [].forEach.call(box.querySelectorAll('img'), function (im) {
        if (images.length >= MAX) return;
        var src = im.getAttribute('data-src') || im.getAttribute('src');
        if (!src) return;
        var abs;
        try { abs = new URL(src.trim(), base); } catch (e) { return; }
        if (!/^https?:$/.test(abs.protocol) || !/\/data\//.test(abs.pathname)) return;
        var orig = abs.href.replace(/\/thumb-([^/]+?)_\d+x\d+(\.\w+)$/, '/$1$2');
        if (seen[orig]) return;
        seen[orig] = 1; images.push(orig); fallbacks.push(abs.href);
      });
    });
    return { images: images, fallbacks: fallbacks };
  }

  // 작업물 상세 페이지(work.html) 주소: 상품 글은 ?it_id=, 게시판 글은 ?bo=&wr= . 망고트리 글이 아니면 '' .
  window.mtDetailUrl = function (link) {
    if (!isPost(link)) return '';
    var u = new URL(link, location.href), q = u.searchParams;
    if (/shop\/item\.php$/.test(u.pathname) && /^\d+$/.test(q.get('it_id') || '')) return 'work.html?it_id=' + q.get('it_id');
    if (/bbs\/board\.php$/.test(u.pathname) && /^[\w-]+$/.test(q.get('bo_table') || '') && /^\d+$/.test(q.get('wr_id') || '')) return 'work.html?bo=' + q.get('bo_table') + '&wr=' + q.get('wr_id');
    return '';
  };
  window.mtPostImages = function (link) {
    if (!isPost(link)) return Promise.reject(new Error('not a post'));
    var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, 9000);
    var req;
    if (sameSite) {
      var u = new URL(link, location.href); u.protocol = location.protocol; u.host = location.host; // www 유무까지 같은 출처로 맞춤
      req = fetch(u.href, { signal: ctrl.signal, credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (html) { return fromHtml(html, u.href); });
    } else {
      req = fetch('/api/post-images?url=' + encodeURIComponent(link), { signal: ctrl.signal, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { return { images: (j.images || []).map(safe), fallbacks: (j.fallbacks || []).map(safe) }; });
    }
    return req.then(function (res) { clearTimeout(t); if (!res.images.filter(Boolean).length) throw new Error('no images'); return res; },
      function (e) { clearTimeout(t); throw e; });
  };

  var dlg, stack, status, body, closeBtn, siteBtn, opener = null, seq = 0;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function build() {
    if (dlg) return;
    dlg = el('dialog', 'pf-modal'); dlg.setAttribute('aria-label', '작업물 이미지 크게 보기');
    closeBtn = el('button', 'pf-modal-close', '×'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', '닫기');
    body = el('div', 'pf-modal-body'); body.tabIndex = 0; body.setAttribute('aria-label', '작업물 이미지'); stack = el('div', 'pf-modal-stack'); status = el('p', 'pf-modal-status'); status.setAttribute('role', 'status');
    // 홈페이지·쇼핑몰 작업물: 실제 사이트로 가는 버튼(새 창). 주소가 없으면 숨김.
    siteBtn = el('a', 'pf-modal-site btn btn-mango'); siteBtn.target = '_blank'; siteBtn.rel = 'noopener noreferrer'; siteBtn.hidden = true;
    body.appendChild(stack); body.appendChild(status); dlg.appendChild(closeBtn); dlg.appendChild(siteBtn); dlg.appendChild(body); document.body.appendChild(dlg);
    closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === body || e.target === stack) dlg.close(); });
    dlg.addEventListener('close', function () { seq++; document.documentElement.style.overflow = ''; stack.textContent = ''; status.textContent = ''; if (opener) opener.focus(); });
  }
  function addImg(src, alt, alt2) {
    var i = el('img'); i.alt = alt || ''; i.decoding = 'async'; i.src = src;
    if (alt2 && alt2 !== src) i.addEventListener('error', function () { i.src = alt2; }, { once: true });
    // 작은 원본은 1.5배까지만 키워 흐려지지 않게, 최대 560px
    i.addEventListener('load', function () { i.style.width = Math.min(560, Math.round(i.naturalWidth * 1.5)) + 'px'; });
    stack.appendChild(i);
  }
  // 첫 이미지가 화면에 뜰 때까지 로딩 원을 유지한다(홈페이지 원본은 수 MB라 받는 데 시간이 걸림).
  function waitFirst(my) {
    var first = stack.querySelector('img');
    if (!first) { status.textContent = ''; return; }
    if (!status.textContent) status.textContent = '이미지를 불러오는 중…';
    function done() { if (my === seq) status.textContent = ''; }
    if (first.complete && first.naturalWidth) done();
    else { first.addEventListener('load', done, { once: true }); first.addEventListener('error', function () { setTimeout(function () { if (first.complete) done(); }, 1500); }, { once: true }); }
  }
  window.mtWorkModal = {
    open: function (o) {
      build();
      var my = ++seq; opener = o.opener || null;
      stack.textContent = ''; status.textContent = '';
      var site = o.site ? safe(o.site) : '';
      siteBtn.hidden = !site;
      if (site) { siteBtn.href = site; siteBtn.textContent = (o.siteLabel || '사이트 방문하기') + ' ↗'; siteBtn.setAttribute('aria-label', (o.alt ? o.alt + ' ' : '') + '사이트 방문하기 (새 창)'); }
      if (o.link && isPost(o.link)) {
        status.textContent = '게시물 이미지를 불러오는 중…';
        window.mtPostImages(o.link).then(function (res) {
          if (my !== seq) return;
          stack.textContent = '';
          res.images.forEach(function (src, k) { if (src) addImg(src, k ? '' : o.alt, res.fallbacks[k]); });
          waitFirst(my);
        }, function () {
          if (my !== seq) return;
          stack.textContent = ''; addImg(o.fallback, o.alt); waitFirst(my);
        });
      } else { addImg(o.fallback, o.alt); waitFirst(my); }
      body.scrollTop = 0;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      closeBtn.focus();
    }
  };
})();
