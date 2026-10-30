(()=>{
const nav=document.querySelector('.nav-act');if(!nav)return;
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
const top=document.createElement('button');top.type='button';top.className='site-search-toggle';top.setAttribute('aria-label','사이트 검색 열기');top.innerHTML=icon;nav.insertBefore(top,nav.querySelector('.burger'));
const dock=document.createElement('div');dock.className='search-dock';dock.innerHTML='<button type="button" class="search-dock-open" aria-label="서비스 검색 또는 AI 기획 시작">'+icon+'<span>어떤 도움이 필요하세요?</span><b>검색 · AI 기획</b></button><button type="button" class="search-dock-close" aria-label="하단 검색 말풍선 닫기">×</button>';document.body.append(dock);document.body.classList.add('has-search-dock');
dock.querySelector('.search-dock-close').onclick=()=>{dock.hidden=true;document.body.classList.remove('has-search-dock');};
let scrollAnchor=Math.max(0,window.scrollY),scrollPending=false;
function followScroll(){scrollPending=false;const y=Math.max(0,window.scrollY),delta=y-scrollAnchor;if(dock.hidden){scrollAnchor=y;return;}if(y<=24||Math.abs(delta)>=12){const hide=y>24&&delta>0&&!dock.contains(document.activeElement);dock.classList.toggle('is-scroll-hidden',hide);dock.inert=hide;dock.setAttribute('aria-hidden',String(hide));scrollAnchor=y;}}
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(followScroll);}},{passive:true});
const data=[
['AI 제품','상세페이지 콘텐츠 제작 상담 데이터 업무 자동화','products.html'],
['AI CREATIVE · 콘텐츠 제작','촬영 합성 이미지 영상 상세페이지','products.html#creative'],
['AI COMMERCE · 커머스','상품 추천 매출 쇼핑몰','products.html#commerce'],
['AI AGENT · 고객 상담','챗봇 문의 고객 응대','products.html#agent-ai'],
['AI INSIGHT · 데이터 분석','통계 리포트 매출 분석','products.html#insight'],
['AI FLOW · 업무 자동화','반복 업무 프로세스','products.html#flow'],
['AI GROWTH · 마케팅','광고 성장 마케팅','products.html#growth'],
['AI 모듈','기능 검색 인공지능 모듈','modules.html'],
['페이지메이커','상세페이지 자동 제작 pagemaker','platforms.html#pagemaker'],
['페이지커넥트','인플루언서 마케팅 공동구매 배체사','platforms.html#pageconnect'],
['티글','신선식품 커머스 tigl','platforms.html#tigl'],
['활용사례 · Before / After','비포 애프터 도입 전후','usecase.html'],
['포트폴리오 · 제작 작업물','갤러리 촬영 디자인 홈페이지 영상','portfolio.html#works'],
['앱·플랫폼 개발 사례','개발 앱 플랫폼','portfolio.html#cases'],
['요금제 · AI 고용 비용 비교','가격 플랜 월금액 절감 비용','pricing.html'],
['무료 AI 진단','추천 업무 진단 테스트','diagnosis.html'],
['회사소개','망고트리 연혁 조직 위치 주소 연락처','about.html']];
const dialog=document.createElement('dialog');dialog.className='site-search-dialog';dialog.setAttribute('aria-labelledby','searchTitle');dialog.innerHTML='<div class="search-heading"><h2 id="searchTitle">무엇을 찾으시나요?</h2><button type="button" aria-label="검색 닫기">×</button></div><label class="search-field">'+icon+'<input type="search" aria-label="검색어" placeholder="제품, 페이지메이커, 요금제 검색" autocomplete="off"></label><p class="search-status" role="status" aria-live="polite"></p><ul class="search-results"></ul><button class="search-ai" type="button">찾기 어렵다면, AI와 함께 기획하기 ↗</button>';document.body.append(dialog);
const input=dialog.querySelector('input'),list=dialog.querySelector('ul'),status=dialog.querySelector('.search-status');let opener;
function render(){const words=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);const found=data.filter(d=>words.every(w=>(d[0]+' '+d[1]).toLowerCase().includes(w)));list.replaceChildren();status.textContent=words.length?found.length+'개의 검색 결과':'자주 찾는 서비스';(words.length?found:data.filter((_,i)=>[8,9,11,14,15,16].includes(i))).forEach(d=>{const li=document.createElement('li'),a=document.createElement('a'),title=document.createElement('strong'),desc=document.createElement('span');a.href=d[2];title.textContent=d[0];desc.textContent=d[1];a.append(title,desc);li.append(a);list.append(li);});if(!found.length)status.textContent='검색 결과가 없습니다. 다른 키워드로 검색하거나 AI 기획을 이용해 주세요.';}
function open(e){opener=e.currentTarget;render();dialog.showModal();input.focus();}
top.onclick=open;dock.querySelector('.search-dock-open').onclick=open;input.oninput=render;
dialog.querySelector('.search-heading button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>opener?.focus());
dialog.querySelector('.search-ai').onclick=()=>{dialog.close();document.querySelector('.nav-ai')?.click();};
})();
