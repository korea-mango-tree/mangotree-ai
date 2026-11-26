(()=>{
// 링크 기준 주소: 이 스크립트가 있는 사이트 폴더(…/assets/site-search.js 의 한 단계 위). 실제 사이트 메인(mangotree.co.kr/)처럼
// 페이지 주소와 사이트 폴더(/ai/)가 다를 때도 검색 결과가 항상 올바른 페이지로 가도록 전체 주소로 만든다.
const SITE_BASE=(()=>{try{return new URL('../',document.currentScript&&document.currentScript.src||location.href).href;}catch(e){return location.href;}})();
const abs=h=>{try{return new URL(h,SITE_BASE).href;}catch(e){return h;}};
const nav=document.querySelector('.nav-act');if(!nav)return;
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
const top=document.createElement('button');top.type='button';top.className='site-search-toggle';top.setAttribute('aria-label','사이트 검색 열기');top.innerHTML=icon;nav.insertBefore(top,nav.querySelector('.burger'));
const dock=document.createElement('div');dock.className='search-dock';dock.innerHTML='<button type="button" class="search-dock-open" aria-label="서비스 검색 또는 AI 기획 시작">'+icon+'<span>어떤 도움이 필요하세요?</span><b>검색 · AI 기획</b></button><button type="button" class="search-dock-close" aria-label="하단 검색 말풍선 닫기">×</button>';dock.hidden=true;/* 하단 가운데 검색 말풍선은 사용자 지시로 띄우지 않는다. 검색은 상단 돋보기 버튼으로 연다 */
dock.querySelector('.search-dock-close').onclick=()=>{dock.hidden=true;document.body.classList.remove('has-search-dock');};
let scrollAnchor=Math.max(0,window.scrollY),scrollPending=false;
function followScroll(){scrollPending=false;const y=Math.max(0,window.scrollY),delta=y-scrollAnchor;if(dock.hidden){scrollAnchor=y;return;}if(y<=24||Math.abs(delta)>=12){const hide=y>24&&delta>0&&!dock.contains(document.activeElement);dock.classList.toggle('is-scroll-hidden',hide);dock.inert=hide;dock.setAttribute('aria-hidden',String(hide));scrollAnchor=y;}}
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(followScroll);}},{passive:true});
const data=[
['ChatGPT·Claude 원격 활용 지원','챗GPT 클로드 설정 교육 관리 원격 문제 해결','products.html#ai-assistant'],
['AI 컨설팅','AI 제품 상세페이지 콘텐츠 제작 상담 데이터 업무 자동화','products.html'],
['AI CREATIVE · 콘텐츠 제작','촬영 합성 이미지 영상 상세페이지','products.html#creative'],
['AI COMMERCE · 커머스','상품 추천 매출 쇼핑몰','products.html#commerce'],

['AI INSIGHT · 데이터 분석','통계 리포트 매출 분석','products.html#insight'],
['AI FLOW · 업무 자동화·에이전트','반복 업무 프로세스 상담 영업 에이전트 챗봇 문의 고객 응대','products.html#flow'],
['AI GROWTH · 마케팅','광고 성장 마케팅','products.html#growth'],
['AI 모듈','기능 검색 인공지능 모듈','modules.html'],
['페이지메이커','상세페이지 자동 제작 pagemaker','platforms.html#pagemaker'],
['페이지커넥트','인플루언서 마케팅 공동구매 배체사','platforms.html#pageconnect'],
['티글','신선식품 커머스 tigl','platforms.html#tigl'],
['캐릭터AI','라이브커머스 관광가이드 캐릭터 아바타 호스트','platforms.html#avatar-live'],
['바이브웍스','AI 녹음기 스마트융복합 VIBEWORX 전사 요약 번역','platforms.html#vibeworx'],
['활용사례 · Before / After','비포 애프터 도입 전후','usecase.html'],
['포트폴리오 · 제작 작업물','갤러리 촬영 디자인 홈페이지 영상','portfolio.html#works'],
['앱·플랫폼 개발 사례','개발 앱 플랫폼','portfolio.html#cases'],
['요금제 · AI 고용 비용 비교','가격 플랜 월금액 절감 비용','pricing.html'],
['무료 AI 진단','추천 업무 진단 테스트','diagnosis.html'],
['회사소개','망고트리 연혁 조직 위치 주소 연락처','about.html']];
const dialog=document.createElement('dialog');dialog.className='site-search-dialog';dialog.setAttribute('aria-labelledby','searchTitle');dialog.innerHTML='<div class="search-heading"><h2 id="searchTitle">무엇을 찾으시나요?</h2><button type="button" aria-label="검색 닫기">×</button></div><label class="search-field">'+icon+'<input type="search" aria-label="검색어" placeholder="제품, 요금제, 작업물(예: 김치, 홈페이지) 검색" autocomplete="off"></label><p class="search-status" role="status" aria-live="polite"></p><ul class="search-results"></ul><button class="search-ai" type="button">찾기 어렵다면, AI와 함께 기획하기 ↗</button>';document.body.append(dialog);
const input=dialog.querySelector('input'),list=dialog.querySelector('ul'),status=dialog.querySelector('.search-status');let opener;
// 포트폴리오 게시물(망고트리 API, 분야별 최대 100개)도 검색한다. 검색창을 처음 열 때 한 번 불러와 둔다.
const POSTS_API='https://mangotree.co.kr/api/portfolio.php?cat=all&limit=100';let posts=null,postsState='idle';
function cleanTitle(t){return String(t||'').replace(/^\s*\[[A-Za-z]*\d+\]\s*/,'').replace(/\s*(상세페이지|홈페이지)\s*제작\s*$/,'').trim();}
function safeUrl(v){try{const u=new URL(String(v),location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch(e){return '';}}
function loadPosts(){if(postsState!=='idle'||!window.fetch)return;postsState='loading';const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),8000);
  let cached=null;try{cached=JSON.parse(sessionStorage.getItem('mt_pf_api')||'null');}catch(e){}
  (cached?Promise.resolve(cached):fetch(POSTS_API,{signal:ctrl.signal,headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(j=>{try{sessionStorage.setItem('mt_pf_api',JSON.stringify(j));}catch(e){}return j;})).then(j=>{
    const items=j&&j.status==='success'&&j.data&&Array.isArray(j.data.items)?j.data.items:[];
    posts=items.map(it=>({title:cleanTitle(it.title),raw:String(it.title||''),cat:String(it.catName||''),link:safeUrl(it.link),thumb:safeUrl(it.thumb),site:String(it.homepage_link||'').trim()})).filter(p=>p.title&&p.link);
    postsState='done';}).catch(()=>{postsState='error';}).then(()=>{clearTimeout(t);if(dialog.open)render();});}
function detailUrl(link){try{const u=new URL(link),q=u.searchParams;if(!/(^|\.)mangotree\.co\.kr$/.test(u.hostname))return '';
  if(/\/shop\/item\.php$/.test(u.pathname)&&/^\d+$/.test(q.get('it_id')||''))return 'work.html?it_id='+q.get('it_id');
  if(/\/bbs\/board\.php$/.test(u.pathname)&&/^[\w-]+$/.test(q.get('bo_table')||'')&&/^\d+$/.test(q.get('wr_id')||''))return 'work.html?bo='+q.get('bo_table')+'&wr='+q.get('wr_id');}catch(e){}return '';}
function item(title,desc,href,onClick,tag){const li=document.createElement('li'),a=document.createElement('a'),t=document.createElement('strong'),d=document.createElement('span');a.href=abs(href);t.textContent=title;d.textContent=desc;
  if(tag){const b=document.createElement('em');b.className='search-tag';b.textContent=tag;t.prepend(b);}
  a.append(t,d);if(onClick){a.target='_blank';a.rel='noopener noreferrer';a.addEventListener('click',onClick);}li.append(a);return li;}
function render(){const words=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);const found=data.filter(d=>words.every(w=>(d[0]+' '+d[1]).toLowerCase().includes(w)));
  const foundPosts=words.length&&posts?posts.filter(p=>words.every(w=>(p.raw+' '+p.cat).toLowerCase().includes(w))).slice(0,30):[];
  list.replaceChildren();
  (words.length?found:data.filter((_,i)=>[0,9,10,15,16,17].includes(i))).forEach(d=>list.append(item(d[0],d[1],d[2])));
  // 게시물은 작업물 상세 페이지(work.html)로 연결한다(망고트리 글이 아니면 원본을 새 창으로)
  foundPosts.forEach(p=>{const d=detailUrl(p.link);list.append(item(p.title,p.cat+' 작업물 · '+(d?'상세 보기':'망고트리 원본 게시물 (새 창)'),d||p.link,d?null:()=>{},'포트폴리오'));});
  const n=found.length+foundPosts.length;
  status.textContent=!words.length?'자주 찾는 서비스':n?n+'개의 검색 결과'+(postsState==='loading'?' · 포트폴리오 게시물 불러오는 중…':''):(postsState==='loading'?'포트폴리오 게시물을 불러오는 중입니다…':'검색 결과가 없습니다. 다른 키워드로 검색하거나 AI 기획을 이용해 주세요.');}
function open(e){opener=e.currentTarget;loadPosts();render();dialog.showModal();input.focus();}
top.onclick=open;dock.querySelector('.search-dock-open').onclick=open;input.oninput=render;
dialog.querySelector('.search-heading button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>opener?.focus());
dialog.querySelector('.search-ai').onclick=()=>{dialog.close();document.querySelector('.nav-ai')?.click();};
})();
