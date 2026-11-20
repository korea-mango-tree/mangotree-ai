/* 하단 「제작문의」 간단 접수 폼
   - [data-contact-open] 링크를 누르면 업체명·연락처·이메일·메모 입력 창(dialog)을 연다.
   - 접수하면 FormSubmit(https://formsubmit.co) AJAX 주소로 보내고, FormSubmit이 수신 주소로 메일을 보낸다.
     정적 사이트(Apache·Vercel 공통)라 서버 코드 없이 동작한다.
   - 처음 한 번은 FormSubmit이 수신 주소로 「활성화 확인」 메일을 보내며, 그 메일의 버튼을 눌러야 이후 접수가 전달된다.
   - 스크립트가 없거나 실패하면 링크 원래 주소(공식 제작문의 게시판)로 이동한다. */
(function () {
  var TO = 'mtree712@naver.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + TO;
  var TEL = '1588-6386';
  var links = document.querySelectorAll('[data-contact-open]');
  if (!links.length || typeof HTMLDialogElement !== 'function') return;

  var dlg = document.createElement('dialog');
  dlg.className = 'cf-dialog';
  dlg.setAttribute('aria-labelledby', 'cfTitle');
  dlg.innerHTML =
    '<form class="cf-form" novalidate>' +
      '<div class="cf-head"><h2 id="cfTitle">제작문의</h2><button type="button" class="cf-x" data-cf-close aria-label="닫기">×</button></div>' +
      '<p class="cf-lead">남겨 주시면 담당자가 확인 후 연락드립니다.</p>' +
      '<label class="cf-field"><span>업체명 <b aria-hidden="true">*</b></span><input name="업체명" type="text" autocomplete="organization" maxlength="60" required></label>' +
      '<label class="cf-field"><span>연락처 <b aria-hidden="true">*</b></span><input name="연락처" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" placeholder="010-0000-0000" required></label>' +
      '<label class="cf-field"><span>이메일 <small>(선택)</small></span><input name="이메일" type="email" autocomplete="email" maxlength="100" placeholder="name@example.com"></label>' +
      '<label class="cf-field"><span>메모</span><textarea name="메모" rows="4" maxlength="1000" placeholder="만들고 싶은 것, 일정 등 자유롭게 적어 주세요."></textarea></label>' +
      '<input type="text" name="_honey" class="cf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="cf-agree"><input type="checkbox" name="개인정보 수집·이용 동의" value="동의" required><span>개인정보 수집·이용에 동의합니다. <b aria-hidden="true">*</b></span></label>' +
      '<p class="cf-note">수집 항목: 업체명, 연락처, 이메일(선택), 메모<br>이용 목적: 제작문의 회신과 상담<br>보유 기간: 상담 종료 후 내부 기준에 따라 파기<br>동의하지 않으실 수 있으며, 이 경우 접수가 제한됩니다.</p>' +
      '<p class="cf-msg" role="status" aria-live="polite"></p>' +
      '<div class="cf-actions"><button type="submit" class="btn btn-dark cf-submit">접수하기</button></div>' +
    '</form>';
  document.body.appendChild(dlg);

  var form = dlg.querySelector('form');
  var msg = dlg.querySelector('.cf-msg');
  var submit = dlg.querySelector('.cf-submit');
  var opener = null;

  function setMsg(text, kind) { msg.textContent = text; msg.className = 'cf-msg' + (kind ? ' is-' + kind : ''); }
  function open(e) {
    e.preventDefault();
    opener = e.currentTarget;
    setMsg('');
    form.hidden = false;
    dlg.showModal();
    var first = form.querySelector('input[name="업체명"]');
    if (first) first.focus();
  }
  function close() { dlg.close(); }
  dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-cf-close]')) close(); });
  for (var i = 0; i < links.length; i++) links[i].addEventListener('click', open);
  form.addEventListener('input', function () { if (msg.className.indexOf('is-err') > -1) setMsg(''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements['업체명'], tel = form.elements['연락처'], email = form.elements['이메일'], agree = form.elements['개인정보 수집·이용 동의'];
    if (!name.value.trim()) { setMsg('업체명을 입력해 주세요.', 'err'); name.focus(); return; }
    if (!tel.value.trim()) { setMsg('연락처를 입력해 주세요.', 'err'); tel.focus(); return; }
    if (email.value.trim() && !email.checkValidity()) { setMsg('이메일 주소 형식을 확인해 주세요.', 'err'); email.focus(); return; }
    if (!agree.checked) { setMsg('개인정보 수집·이용에 동의해 주세요.', 'err'); agree.focus(); return; }
    if (form.elements._honey.value) { setMsg('접수되었습니다.', 'ok'); return; }

    var data = {
      '업체명': name.value.trim(),
      '연락처': tel.value.trim(),
      '이메일': email.value.trim() || '(없음)',
      '메모': form.elements['메모'].value.trim() || '(없음)',
      '보낸 페이지': location.href,
      '_subject': '[망고트리 AI+ 제작문의] ' + name.value.trim(),
      '_template': 'table',
      '_captcha': 'false'
    };
    if (email.value.trim()) data._replyto = email.value.trim();
    submit.disabled = true;
    setMsg('보내는 중입니다…');
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.j.success) === 'false') throw new Error(res.j.message || 'send failed');
        form.reset();
        setMsg('접수되었습니다. 담당자가 확인 후 연락드리겠습니다.', 'ok');
      })
      .catch(function () {
        setMsg('지금은 전송하지 못했습니다. 잠시 후 다시 시도하시거나 대표전화 ' + TEL + ' 또는 ' + TO + '로 연락해 주세요.', 'err');
      })
      .then(function () { submit.disabled = false; });
  });
})();
