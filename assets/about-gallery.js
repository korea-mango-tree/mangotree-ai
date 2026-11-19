// 회사소개: 인증서·공간 사진 확대 보기
(function () {
  var dlg = document.getElementById('aboutLightbox');
  if (!dlg) return;
  var img = dlg.querySelector('img'), cap = dlg.querySelector('figcaption');
  var list = [], idx = 0, opener = null;

  function show(i) {
    idx = (i + list.length) % list.length;
    var b = list[idx];
    img.src = b.getAttribute('data-full');
    img.alt = b.getAttribute('data-cap');
    cap.textContent = b.getAttribute('data-cap') + ' (' + (idx + 1) + '/' + list.length + ')';
  }
  function open(btn) {
    var g = btn.getAttribute('data-group');
    list = Array.prototype.slice.call(document.querySelectorAll('[data-group="' + g + '"]'));
    opener = btn;
    show(list.indexOf(btn));
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () {
    document.documentElement.style.overflow = '';
    img.removeAttribute('src');
    if (opener) opener.focus();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-full][data-group]');
    if (b) open(b);
  });
  dlg.querySelector('.lb-close').addEventListener('click', close);
  dlg.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
  dlg.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
  // 이미지 바깥(어두운 배경) 누르면 닫기
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.classList.contains('lb-inner') || e.target.tagName === 'FIGURE') close();
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });

})();
