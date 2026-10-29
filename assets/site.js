/* 모든 페이지 공통 동작: 헤더 그림자, 모바일 메뉴, 등장 효과, 맨 위로, 포트폴리오 필터 */
(function(){
  var doc=document.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* 헤더 그림자 · 맨 위로 버튼 */
  var header=document.getElementById('header');
  var toTop=document.getElementById('toTop');
  function onScroll(){
    var y=window.scrollY;
    if(header)header.classList.toggle('scrolled',y>16);
    if(toTop)toTop.classList.toggle('show',y>420);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
  if(toTop)toTop.addEventListener('click',function(){
    window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
  });

  /* 모바일 메뉴: aria-expanded, Escape 닫기, 포커스 반환 */
  var burger=document.getElementById('burger');
  var nav=document.getElementById('navLinks');
  if(burger&&nav){
    function setOpen(open,returnFocus){
      nav.classList.toggle('open',open);
      burger.setAttribute('aria-expanded',open?'true':'false');
      burger.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');
      if(open){var first=nav.querySelector('a');if(first)first.focus();}
      else if(returnFocus)burger.focus();
    }
    burger.addEventListener('click',function(){setOpen(!nav.classList.contains('open'),false);});
    nav.addEventListener('click',function(e){if(e.target.closest('a'))setOpen(false,false);});
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&nav.classList.contains('open'))setOpen(false,true);
    });
    document.addEventListener('click',function(e){
      if(nav.classList.contains('open')&&!nav.contains(e.target)&&!burger.contains(e.target))setOpen(false,false);
    });
    window.addEventListener('resize',function(){
      if(window.innerWidth>960&&nav.classList.contains('open'))setOpen(false,false);
    });
  }


  /* 첫 화면(히어로)에 주요 행동 버튼이 보이는 동안 떠 있는 문의 버튼을 감춤 */
  var hero=document.querySelector('.hero, .dx-hero');
  if(hero&&document.querySelector('.contact-fab')&&'IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      document.body.classList.toggle('fab-off',es[0].isIntersecting);
    },{rootMargin:'0px 0px -35% 0px'}).observe(hero);
  }

  /* 등장 효과: 지원·허용될 때만 숨김을 켜고, 이미 화면에 있는 요소는 바로 표시 */
  var items=[].slice.call(document.querySelectorAll('.reveal'));
  if(items.length&&!reduce&&'IntersectionObserver' in window){
    var vh=window.innerHeight;
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
    items.forEach(function(el,i){
      if(el.getBoundingClientRect().top<vh){el.classList.add('in');return;}
      el.style.transitionDelay=(i%4*55)+'ms';
      io.observe(el);
    });
    doc.classList.add('reveal-on');
  }

  /* 포트폴리오 분류 필터 */
  var tabs=[].slice.call(document.querySelectorAll('.pf-tab'));
  if(tabs.length){
    var cards=[].slice.call(document.querySelectorAll('.pf-card'));
    tabs.forEach(function(t){
      t.setAttribute('aria-pressed',t.classList.contains('on')?'true':'false');
      t.addEventListener('click',function(){
        tabs.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false');});
        t.classList.add('on');t.setAttribute('aria-pressed','true');
        var f=t.dataset.f;
        cards.forEach(function(c){c.style.display=(f==='all'||c.dataset.cat===f)?'':'none';});
      });
    });
  }
})();
