/* 페이지메이커 「AI와 대화하며 완성하는 상세페이지 에디터」 데모 — 참고 아티팩트 원본 스크립트를 .pme 범위로 옮김 */
(()=>{
const root=document.querySelector('.pme'); if(!root) return;
const $=s=>root.querySelector(s), $$=s=>[...root.querySelectorAll(s)];
const FEAT={"cut": "assets/pm-editor/img/feat-cut.webp", "src": "assets/pm-editor/img/feat-src.webp"};
const WORKS={0:{"t": "우리농원 10년 숙성 된장", "c": "식품", "src": "assets/pm-editor/img/w00.jpg"},2:{"t": "다래원 토종다래에이드", "c": "음료·주류", "src": "assets/pm-editor/img/w02.jpg"},3:{"t": "강릉솔밭한과 유과 3종 세트", "c": "식품", "src": "assets/pm-editor/img/w03.jpg"},5:{"t": "뷰린 더마케어 마스크팩", "c": "뷰티·생활", "src": "assets/pm-editor/img/w05.jpg"},6:{"t": "원주 박가네 추어탕", "c": "식품", "src": "assets/pm-editor/img/w06.jpg"},7:{"t": "콩심쉐이크 4종 세트", "c": "음료·주류", "src": "assets/pm-editor/img/w07.jpg"},8:{"t": "콩심쉐이크 오리지널", "c": "음료·주류", "src": "assets/pm-editor/img/w08.jpg"},9:{"t": "양양꿀단지농원 한벌꿀", "c": "식품", "src": "assets/pm-editor/img/w09.jpg"},10:{"t": "호수양조 호수탁주", "c": "음료·주류", "src": "assets/pm-editor/img/w10.jpg"},13:{"t": "천지애힐링팜크닉 체험", "c": "체험·관광", "src": "assets/pm-editor/img/w13.jpg"},16:{"t": "신비얄기름집 참기름·들기름", "c": "식품", "src": "assets/pm-editor/img/w16.jpg"}};
/* ===== Editor demo: 도구별 인터랙티브 데모 ===== */
(() => {
  $('#cutAfter').src=FEAT.cut; $('#cutBefore').src=FEAT.src;
  const app=$('.app'), pgIn=$('#pgIn'), base=$('#pgBase'), lays=$('#pgLays'), page=$('#cvPage');
  const TALL=base.src, H0=925; /* 340px 기준 원본 이미지 높이 */
  const P=(x,y,w,h)=>`left:${x/340*100}%;top:${y/H0*100}%;width:${w/340*100}%;height:${h/H0*100}%`;
  const toast=t=>{const el=$('#cvToast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1600)};
  const pick=(sel,btn)=>{ $$(sel).forEach(b=>b.classList.remove('on')); btn.classList.add('on'); };
  function scrollTo340(y){ pgIn.classList.remove('auto'); pgIn.classList.add('glide');
    const scale=page.clientWidth/340, max=Math.max(0,pgIn.offsetHeight-page.clientHeight);
    pgIn.style.transform=`translateY(${-Math.min(max,y*scale)}px)`; }
  function autoScroll(){ pgIn.classList.remove('glide'); pgIn.style.transform=''; void pgIn.offsetWidth; pgIn.classList.add('auto'); }
  function resetPage(){ if(base.src!==TALL){base.src=TALL;} $('#tplBadge').classList.remove('on'); lays.innerHTML=''; }
  const view=v=>{ $$('.canvas .view').forEach(x=>x.classList.toggle('on',x.dataset.v===v)); page.style.visibility=v?'hidden':'visible'; };

  /* ---------- 섹션 ---------- */
  const SECS=[['히어로 메인 비주얼',0,430],['수상 이력 신뢰 섹션',430,195],['브랜드 스토리',640,145],['농장 이야기 갤러리',785,140],['4종 맛 구성 비교'],['영양 성분 정보'],['이런 분께 추천'],['섭취 방법 가이드'],['배송 · 교환 안내']];
  $('#secList').innerHTML=SECS.map((s,i)=>`<div class="sec-item${i===1?' new':''}" data-i="${i}"><span class="grip">⋮⋮</span><i>${String(i+1).padStart(2,'0')}</i>${s[0]}<span class="del">✕</span></div>`).join('');
  $$('#secList .sec-item').forEach(it=>it.onclick=()=>{ const s=SECS[+it.dataset.i]; pick('#secList .sec-item',it); $$('#secList .sec-item').forEach(x=>x.classList.toggle('cur',x===it));
    if(s[1]!==undefined){ scrollTo340(Math.max(0,s[1]-20)); lays.innerHTML=`<div class="lay frame" style="${P(2,s[1]+2,336,s[2]-4)}"><i></i><b>${String(+it.dataset.i+1).padStart(2,'0')} ${s[0]}</b></div>`; }
    else { scrollTo340(9999); lays.innerHTML=''; toast('데모에서는 01~04 섹션만 미리볼 수 있어요'); } });

  /* ---------- 텍스트 ---------- */
  let tl=null;
  $$('#tpText [data-add]').forEach(b=>b.onclick=()=>{ const k=b.dataset.add; scrollTo340(380);
    const cfg={h:[30,'새 제목을 입력하세요',26],s:[44,'부제목으로 핵심을 한 줄 요약',17],b:[54,'본문 텍스트는 이렇게 들어가요. 클릭해서 바로 수정할 수 있습니다.',13]}[k];
    lays.innerHTML=`<div class="lay frame" style="${P(30,452,280,cfg[0]+30)}"><i></i><b>텍스트</b></div><div class="lay tlay" id="tl" style="${P(30,452,280,cfg[0]+30)};font-size:${cfg[2]*page.clientWidth/340}px"><span class="tt"></span><span class="car2"></span></div>
      <div class="ftool" style="left:${30/340*100}%;top:calc(${414/H0*100}% )"><span class="on">B</span><span>가</span><span>${cfg[2]}</span><span>정렬</span></div>`;
    tl=$('#tl'); const tt=tl.querySelector('.tt'); let n=0; const typ=()=>{ tt.textContent=cfg[1].slice(0,++n); if(n<cfg[1].length) setTimeout(typ,35); }; typ(); applyStyle(); });
  function applyStyle(){ if(!tl) return; const f=$('#tpText .fonts .on')?.dataset.f, c=$('#tpText .sw .on')?.dataset.c; if(f) tl.style.fontFamily=f; if(c) tl.style.color=c; }
  $$('#tpText .fonts button').forEach(b=>b.onclick=()=>{pick('#tpText .fonts button',b);applyStyle()});
  $$('#tpText .sw button').forEach(b=>b.onclick=()=>{pick('#tpText .sw button',b);applyStyle()});
  function enterText(){ resetPage(); tl=null; scrollTo340(60);
    lays.innerHTML=`<div class="lay frame" style="${P(34,92,272,58)}"><i></i><b>텍스트 · KONGSIM</b></div><div class="ftool" style="left:${34/340*100}%;top:${160/H0*100}%"><span class="on">B</span><span>가</span><span>48</span><span>정렬</span><span>색상</span></div>`; }

  /* ---------- 이미지 ---------- */
  const IMGS=[FEAT.src,WORKS[8].src,WORKS[7].src,WORKS[2].src,WORKS[9].src,WORKS[0].src];
  $('#imgGrid').innerHTML=IMGS.map((s,i)=>`<button data-i="${i}"><img src="${s}" alt=""></button>`).join('');
  $$('#imgGrid button').forEach(b=>b.onclick=()=>{ pick('#imgGrid button',b); scrollTo340(150);
    lays.innerHTML=`<div class="lay ilay" style="${P(0,196,340,234)}"><img src="${IMGS[+b.dataset.i]}" alt=""></div><div class="lay frame" style="${P(1,196,338,234)}"><i></i><b>이미지 교체됨</b></div>`; toast('선택한 이미지로 교체했어요'); });
  function enterImg(){ resetPage(); scrollTo340(150); $$('#imgGrid button').forEach(x=>x.classList.remove('on'));
    lays.innerHTML=`<div class="lay frame" style="${P(1,196,338,234)}"><i></i><b>이미지 · 클릭해서 교체</b></div>`; }

  /* ---------- 누끼 ---------- */
  const cmp=$('#cutCmp');
  (()=>{ let down=false; const set=e=>{const r=cmp.getBoundingClientRect();cmp.style.setProperty('--x',Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))+'%')};
    cmp.addEventListener('pointerdown',e=>{down=true;cmp.setPointerCapture(e.pointerId);set(e);stopTour()}); cmp.addEventListener('pointermove',e=>down&&set(e)); cmp.addEventListener('pointerup',()=>down=false); })();
  function runCut(){ const b=$('#cutRun'), bar=$('#cutBar'), st=$('#cutStat'); b.disabled=true; st.className='stat'; st.textContent='배경을 분석하고 있어요…'; bar.style.transition='none'; bar.style.width='0'; void bar.offsetWidth; bar.style.transition='width 1.2s ease'; bar.style.width='100%';
    cmp.style.setProperty('--x','100%');
    setTimeout(()=>{ st.className='stat ok'; st.textContent='✓ 배경제거 완료 · 좌우로 끌어 비교해보세요'; b.disabled=false; let x=100; const sw=()=>{x-=2;cmp.style.setProperty('--x',x+'%'); if(x>45) requestAnimationFrame(sw)}; sw(); },1300); }
  $('#cutRun').onclick=runCut;
  $$('#tpCut .sw button').forEach(b=>b.onclick=()=>{pick('#tpCut .sw button',b); cmp.style.background=b.dataset.bg;});
  $('#cutShadow').onclick=e=>{e.target.classList.toggle('on');cmp.classList.toggle('shadow')};
  function enterCut(){ view('cut'); runCut(); }

  /* ---------- AI 생성 ---------- */
  const BGS=['linear-gradient(160deg,#fef3c7,#fde68a)','linear-gradient(160deg,#dcfce7,#86efac)','linear-gradient(160deg,#e0f2fe,#93c5fd)','linear-gradient(160deg,#fce7f3,#f9a8d4)'];
  const LBL=['아침 식탁','콩밭 자연광','미니멀 스튜디오','파스텔 무드'];
  $('#genGrid').innerHTML=BGS.map((g,i)=>`<div class="gcell" style="background:${g}" data-i="${i}"><img src="${FEAT.cut}" alt=""><span>${LBL[i]}</span></div>`).join('');
  $$('#genGrid .gcell').forEach(c=>c.onclick=()=>{ pick('#genGrid .gcell',c); toast(`'${LBL[+c.dataset.i]}' 이미지를 페이지에 적용했어요`); });
  function runGen(){ const b=$('#genRun'); b.disabled=true; b.lastChild.textContent=' 생성 중…'; $$('#genGrid .gcell').forEach(c=>{c.classList.add('ld');c.classList.remove('on')});
    $$('#genGrid .gcell').forEach((c,i)=>setTimeout(()=>c.classList.remove('ld'),900+i*300)); setTimeout(()=>{b.disabled=false;b.lastChild.textContent=' 다시 생성'},2200); }
  $('#genRun').onclick=runGen;
  $$('#tpGen .chips2 button').forEach(b=>b.onclick=()=>pick(`#tpGen .chips2[data-g="${b.parentElement.dataset.g}"] button`,b));
  function enterGen(){ view('gen'); runGen(); }

  /* ---------- 이미지 검색 ---------- */
  const SR=[[WORKS[3].src,'50% 70%'],[WORKS[0].src,'50% 85%'],[WORKS[8].src,'50% 40%'],[WORKS[16].src,'50% 75%'],[WORKS[9].src,'50% 60%'],[WORKS[6].src,'50% 40%']];
  $('#srGrid').innerHTML=SR.map((s,i)=>`<button data-i="${i}"><img src="${s[0]}" style="object-position:${s[1]}" alt=""></button>`).join('');
  $$('#srGrid button').forEach(b=>b.onclick=()=>{ pick('#srGrid button',b); const s=SR[+b.dataset.i];
    lays.innerHTML=`<div class="lay ilay" style="${P(15,792,148,133)}"><img src="${s[0]}" style="object-position:${s[1]}" alt=""></div><div class="lay frame" style="${P(15,792,148,133)}"><i></i><b>검색 이미지 추가</b></div>`; toast('검색한 이미지를 갤러리에 넣었어요'); });
  $$('#tpSearch .chips2 button').forEach(b=>b.onclick=()=>pick('#tpSearch .chips2 button',b));
  function enterSearch(){ resetPage(); scrollTo340(560); $$('#srGrid button').forEach(x=>x.classList.remove('on'));
    const q=$('#srQ'), s='국산 콩 자연광'; q.textContent=''; let n=0; const t=()=>{q.textContent=s.slice(0,++n); if(n<s.length) setTimeout(t,60)}; t();
    lays.innerHTML=`<div class="lay frame" style="${P(15,792,148,133)}"><i></i><b>이미지 자리 · 검색 결과를 눌러보세요</b></div>`; }

  /* ---------- 템플릿 ---------- */
  const TP=[7,0,2,10,5,13,9,16];
  $('#tplGrid').innerHTML=TP.map(k=>`<button data-k="${k}" data-c="${WORKS[k].c}"><img src="${WORKS[k].src}" style="object-position:top" alt="${WORKS[k].t}"></button>`).join('');
  $$('#tplGrid button').forEach(b=>b.onclick=()=>{ pick('#tplGrid button',b); const w=WORKS[+b.dataset.k];
    lays.innerHTML=''; base.src=w.src; autoScroll(); pgIn.classList.remove('auto'); pgIn.style.transform='translateY(0)';
    $('#tplBadge').textContent='템플릿 적용 · '+w.t; $('#tplBadge').classList.add('on'); toast('템플릿을 적용했어요'); });
  $$('#tpTpl .chips2 button').forEach(b=>b.onclick=()=>{ pick('#tpTpl .chips2 button',b); const f=b.textContent;
    $$('#tplGrid button').forEach(x=>x.style.display=(f==='전체'||x.dataset.c===f)?'':'none'); });

  /* ---------- 도구 전환 ---------- */
  const TOOLS={
    sec:{ph:'어떤 섹션을 추가하거나 수정할까요?',enter:()=>{resetPage();autoScroll();$$('#secList .sec-item').forEach(x=>x.classList.remove('cur','on'))}},
    text:{ph:'예) 제목을 더 크게, 부제목은 한 줄로 줄여줘',enter:enterText},
    img:{ph:'예) 제품 사진을 더 밝은 컷으로 바꿔줘',enter:enterImg},
    cut:{ph:'예) 배경 지우고 흰 배경에 그림자 넣어줘',enter:enterCut},
    gen:{ph:'예) 아침 식탁 위 제품 연출컷 만들어줘',enter:enterGen},
    search:{ph:'예) 콩밭 자연광 사진 찾아서 넣어줘',enter:enterSearch},
    tpl:{ph:'예) 더 고급스러운 템플릿으로 바꿔줘',enter:()=>{resetPage();scrollTo340(0)}}
  };
  function setTool(t){ $$('.rail button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
    const rb=$(`.rail button[data-t="${t}"]`), rl=$('.rail'); if(rl.scrollWidth>rl.clientWidth) rl.scrollTo({left:rb.offsetLeft-rl.clientWidth/2+rb.offsetWidth/2,behavior:'smooth'}); $('.secs').scrollTop=0; $$('.tp').forEach(p=>p.classList.toggle('on',p.dataset.t===t));
    view(''); $('#chatPh').textContent=TOOLS[t].ph; TOOLS[t].enter(); cur=t; }
  let cur='sec';
  $$('.rail button').forEach(b=>b.addEventListener('click',()=>{ stopTour(); setTool(b.dataset.t); }));

  /* ---------- 자동 둘러보기 (첫 클릭 전까지) ---------- */
  const ORDER=['sec','text','img','cut','gen','search','tpl']; let tour=null, ti=0, seen=false;
  function stopTour(){ clearInterval(tour); tour=null; $('#railHint')?.remove(); }
  const demo=()=>{ ti=(ti+1)%ORDER.length; const t=ORDER[ti]; setTool(t);
    setTimeout(()=>{ if(!tour) return; if(t==='text') $('#tpText [data-add="h"]').click(); if(t==='img') $$('#imgGrid button')[1].click(); if(t==='search') $$('#srGrid button')[0].click(); if(t==='tpl') $$('#tplGrid button')[1].click(); if(t==='sec') $$('#secList .sec-item')[1].click(); },1800); };
  $$('.secs, .canvas').forEach(el=>el.addEventListener('pointerdown',stopTour));
  new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting&&!seen){ seen=true; tour=setInterval(demo,5200); setTimeout(()=>{const r=$('#railHint'); if(r){r.style.transition='opacity .4s';r.style.opacity=0;setTimeout(()=>r.remove(),400)}},6000); } }),{threshold:.4}).observe(app);
  setTool('sec');
})();

/* Editor demo: 섹션 리스트 + 채팅 순차 등장 */
(() => {
  const msgs=$$('.chat-msgs .msg'); let k=0;
  const step=()=>{ if(k<msgs.length){msgs[k++].classList.add('show');setTimeout(step,1300)} else {setTimeout(()=>{msgs.forEach(m=>m.classList.remove('show'));k=0;setTimeout(step,600)},5000)} };
  step();
})();

/* 모바일에서도 데스크탑과 같은 화면: 1240px 레이아웃 그대로 두고 폭에 맞춰 축소 */
(() => {
  const app=$('.app'); if(!app) return;
  const W=1240, fit=document.createElement('div'); fit.className='app-fit';
  app.parentNode.insertBefore(fit,app); fit.appendChild(app);
  // 좌우 여백 없이 화면 가로 폭을 꽉 채움: 감싼 상자를 문서 폭(스크롤바 제외)으로 펴고 그 폭에 맞춰 확대·축소
  const host=fit.parentElement;
  const apply=()=>{ const vw=document.documentElement.clientWidth, left=host.getBoundingClientRect().left;
    fit.style.width=vw+'px'; fit.style.marginLeft=(-left)+'px';
    const k=vw/W; app.style.transform=`scale(${k})`; fit.style.height=(app.offsetHeight*k)+'px'; };
  apply();
  addEventListener('resize',apply);
  if('ResizeObserver' in window) new ResizeObserver(apply).observe(host);
})();
})();
