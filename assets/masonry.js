/* 공통 masonry(지그재그) 배치: 카드를 DOM 순서대로 「지금 가장 짧은 열」에 놓는다.
   - CSS grid 위에서 각 카드에 grid-column·grid-row(시작/칸 수)를 직접 지정한다(행 단위 UNIT px).
     그래서 키 큰 카드(상세페이지)가 열마다 엇갈려 놓이고, 열 사이 빈칸이 생기지 않는다.
   - 카드 사이 세로 간격은 카드의 margin-bottom 으로 준다(높이 계산에 포함).
   - 숨김(hidden) 카드는 건너뛰므로 탭·페이지·더보기 뒤에 relayout()만 다시 부르면 된다.
   - CSS 변수 --masonry-full:1 인 카드는 한 줄 전체를 차지한다(활용사례 대표 카드, 화면 폭별로 CSS에서 켜고 끔).
   - 열 수는 grid-template-columns 계산값에서 읽는다. 이미지 로드·창 크기 변경은 ResizeObserver로 다시 맞춘다.
   - JS가 없으면 클래스(is-masonry)가 붙지 않아 기존 그리드 그대로 보인다.
   사용: var m = window.mtMasonry(listEl, '.item'); m.relayout(); */
(function () {
  var UNIT = 2;
  window.mtMasonry = function (list, itemSel) {
    if (!list || !window.ResizeObserver) return { relayout: function () {} };
    list.classList.add('is-masonry');
    var raf = 0;
    function cols() { var t = getComputedStyle(list).gridTemplateColumns; return t && t !== 'none' ? t.split(' ').filter(Boolean).length : 1; }
    function layout() {
      raf = 0;
      var n = cols(), heights = [], i;
      for (i = 0; i < n; i++) heights.push(0);
      [].forEach.call(list.querySelectorAll(itemSel), function (c) {
        if (c.hidden) return;
        var h = Math.max(1, Math.ceil((c.getBoundingClientRect().height + (parseFloat(getComputedStyle(c).marginBottom) || 0)) / UNIT));
        if (n === 1 || getComputedStyle(c).getPropertyValue('--masonry-full').trim() === '1') {
          var top = Math.max.apply(null, heights);
          c.style.gridColumn = '1 / -1';
          c.style.gridRow = (top + 1) + ' / span ' + h;
          for (i = 0; i < n; i++) heights[i] = top + h;
          return;
        }
        var col = 0;
        for (i = 1; i < n; i++) if (heights[i] < heights[col]) col = i;
        c.style.gridColumn = (col + 1) + ' / span 1';
        c.style.gridRow = (heights[col] + 1) + ' / span ' + h;
        heights[col] += h;
      });
    }
    function relayout() { if (!raf) raf = requestAnimationFrame(layout); }
    var ro = new ResizeObserver(relayout);
    function observe() { ro.disconnect(); ro.observe(list); [].forEach.call(list.querySelectorAll(itemSel), function (c) { ro.observe(c); }); relayout(); }
    observe();
    return { relayout: observe };
  };
})();
