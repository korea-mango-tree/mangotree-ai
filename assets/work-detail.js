/* 작업물 상세 페이지(work.html)
   - 주소: work.html?it_id=<상품 번호> 또는 work.html?bo=<게시판>&wr=<글 번호> (window.mtDetailUrl 이 만든다)
   - 제목·분야·고객사 사이트 주소는 포트폴리오 API(분야별 최대 100개)에서 같은 글을 찾아 쓴다.
     못 찾으면 기본 제목으로 두고 이미지는 그대로 보여 준다.
   - 본문 이미지는 window.mtPostImages(실제 사이트에서는 망고트리 게시물 직접 읽기, 그 밖에서는 /api/post-images)로 불러온다.
     실패하면 썸네일(긴 썸네일 우선)을 보여 준다.
   - 아래에 같은 분야의 다른 작업물 4개를 상세 페이지 링크로 보여 준다.
   - API 값은 textContent·속성으로만 넣는다(innerHTML 금지). */
(function () {
  var API = 'https://mangotree.co.kr/api/portfolio.php?cat=all&limit=100';
  var q = new URLSearchParams(location.search);
  var itId = /^\d+$/.test(q.get('it_id') || '') ? q.get('it_id') : '';
  var bo = /^[\w-]+$/.test(q.get('bo') || '') ? q.get('bo') : '', wr = /^\d+$/.test(q.get('wr') || '') ? q.get('wr') : '';
  var $ = function (id) { return document.getElementById(id); };
  var title = $('wdTitle'), cat = $('wdCat'), catLink = $('wdCatLink'), site = $('wdSite'), status = $('wdStatus'), box = $('wdImages');
  if (!title || !box) return;

  var link = itId ? 'https://mangotree.co.kr/shop/item.php?it_id=' + itId : (bo && wr ? 'https://mangotree.co.kr/bbs/board.php?bo_table=' + bo + '&wr_id=' + wr : '');
  if (!link) {
    title.textContent = '작업물을 찾을 수 없습니다';
    status.textContent = '';
    box.appendChild(Object.assign(document.createElement('p'), { className: 'wd-empty', textContent: '주소가 올바르지 않습니다. 포트폴리오 목록에서 다시 골라 주세요.' }));
    return;
  }

  function safe(v) { try { var u = new URL(String(v), location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (e) { return ''; } }
  function siteUrl(v) { var s = String(v || '').trim(); if (!s) return ''; if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(s) ? 'http://' + s : ''; return safe(s); }
  function clean(t) { return String(t || '').replace(/^\s*\[[A-Za-z]*\d+\]\s*/, '').replace(/\s*(상세페이지|홈페이지)\s*제작\s*$/, '').trim(); }
  function key(l) { try { var u = new URL(l); return u.searchParams.get('it_id') || (u.searchParams.get('bo_table') + ':' + u.searchParams.get('wr_id')); } catch (e) { return ''; } }
  function tallOf(l) { var id = (/[?&]it_id=(\d+)/.exec(l || '') || [])[1]; return id && window.MT_TALL && window.MT_TALL[id] ? 'assets/portfolio/tall/' + id + '.webp' : ''; }
  var me = itId || (bo + ':' + wr), thumb = '';

  function addImg(src, alt, alt2) {
    var i = document.createElement('img'); i.alt = alt || ''; i.decoding = 'async'; i.src = src;
    if (alt2 && alt2 !== src) i.addEventListener('error', function () { i.src = alt2; }, { once: true });
    box.appendChild(i); return i;
  }
  function showFallback() { box.textContent = ''; var s = tallOf(link) || thumb; if (s) addImg(s, title.textContent); status.textContent = ''; }

  // 1) 본문 이미지
  (window.mtPostImages ? window.mtPostImages(link) : Promise.reject(new Error('no loader'))).then(function (res) {
    box.textContent = '';
    var first = null;
    res.images.forEach(function (src, k) { if (!src) return; var i = addImg(src, k ? '' : title.textContent, res.fallbacks[k]); if (!first) first = i; });
    if (first && !(first.complete && first.naturalWidth)) {
      first.addEventListener('load', function () { status.textContent = ''; }, { once: true });
      first.addEventListener('error', function () { setTimeout(function () { status.textContent = ''; }, 1500); }, { once: true });
    } else status.textContent = '';
  }, function () { if (thumb || tallOf(link)) showFallback(); else waitMeta = true; });
  var waitMeta = false;

  // 2) 제목·분야·사이트, 다른 작업물
  // 포트폴리오·검색에서 이미 받은 목록(sessionStorage 'mt_pf_api')이 있으면 그것을 쓰고, 없으면 받는다(느리면 한 번 더 시도).
  function getList() {
    try { var c = sessionStorage.getItem('mt_pf_api'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) {}
    function once(ms) {
      var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, ms);
      return fetch(API, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
        .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }, function (e) { clearTimeout(t); throw e; });
    }
    return once(15000).catch(function () { return once(15000); }).then(function (j) { try { sessionStorage.setItem('mt_pf_api', JSON.stringify(j)); } catch (e) {} return j; });
  }
  getList()
    .then(function (j) {
      var items = j && j.status === 'success' && j.data && Array.isArray(j.data.items) ? j.data.items : [];
      var it = items.filter(function (x) { return key(x.link) === me; })[0];
      if (!it) return;
      var name = clean(it.title) || '작업물', catName = String(it.catName || ''), c = String(it.cat || '');
      title.textContent = name;
      cat.textContent = catName || 'WORK';
      document.title = name + (catName ? ' · ' + catName : '') + ' | MANGOTREE AI+';
      if (c) { catLink.textContent = catName; catLink.href = 'portfolio.html#' + c; $('wdMoreLink').href = 'portfolio.html#' + c; }
      thumb = safe(it.thumb);
      if (waitMeta) showFallback();
      var s = siteUrl(it.homepage_link);
      if (s) { site.href = s; site.hidden = false; site.setAttribute('aria-label', name + ' 사이트 방문하기 (새 창)'); }
      // 같은 분야 다른 작업물 4개
      var more = items.filter(function (x) { return x.cat === c && key(x.link) !== me && window.mtDetailUrl && window.mtDetailUrl(x.link); }).slice(0, 4);
      var ul = $('wdMore');
      more.forEach(function (x) {
        var li = document.createElement('li'), a = document.createElement('a'), img = document.createElement('img'), n = document.createElement('span');
        a.href = window.mtDetailUrl(x.link);
        var tall = tallOf(x.link); img.src = tall || safe(x.thumb); img.alt = ''; img.width = 400; img.height = tall ? 800 : 541; img.loading = 'lazy'; img.decoding = 'async';
        if (tall) img.addEventListener('error', function () { img.height = 541; img.src = safe(x.thumb); }, { once: true });
        n.textContent = clean(x.title);
        a.appendChild(img); a.appendChild(n); li.appendChild(a); ul.appendChild(li);
      });
      if (more.length) ul.closest('section').hidden = false;
    })
    .catch(function () { if (waitMeta) { status.textContent = ''; box.appendChild(Object.assign(document.createElement('p'), { className: 'wd-empty', textContent: '이미지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' })); } })
})();
