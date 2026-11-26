(()=>{
// 분야별 최대 100개(서버 상한). 카드는 12개씩 페이지로 나눠 보여 주고 이미지는 지연 로딩한다.
const API='https://mangotree.co.kr/api/portfolio.php?cat=all&limit=100',TIMEOUT=8000;
const list=document.querySelector('ul.x-works');

// DB 값은 textContent·속성으로만 넣는다(innerHTML 금지). URL 은 http(s)만 허용.
function safeUrl(v){try{const u=new URL(String(v),location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch(e){return '';}}
// 고객사 홈페이지 주소: 관리자 입력값이라 공백·http:// 누락("malin.mangotree.co.kr")이 섞여 온다.
// 앞뒤 공백 제거, 스킴 없는 도메인은 http:// 를 붙이고, 상대경로로는 해석하지 않는다(절대 http(s) 주소만).
function siteUrl(v){const s=String(v||'').trim();if(!s)return '';const w=/^[a-z][a-z0-9+.-]*:/i.test(s)?s:(/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]|$)/i.test(s)?'http://'+s:'');
  try{const u=new URL(w);return /^https?:$/.test(u.protocol)&&u.hostname?u.href:'';}catch(e){return '';}}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function buildCard(it){
  // homepage_link(실제 고객사 홈페이지·쇼핑몰 주소)는 카드에 data-site-url 로 두고, 크게 보기 모달 안의 「사이트 방문」 버튼으로 연다.
  const cat=String(it.cat||''),catName=String(it.catName||''),title=String(it.title||''),site=siteUrl(it.homepage_link),link=safeUrl(it.link)||site,thumb=safeUrl(it.thumb),video=!!it.youtubeId;
  if(!cat||!title||!thumb)return null;
  const li=el('li','x-work pf-card'+(video?' pf-video':''));li.dataset.cat=cat;if(site)li.dataset.siteUrl=site;
  const fig=el('figure'),a=el(link?'a':'span','x-wlink');
  // 망고트리 게시물은 작업물 상세 페이지(work.html)로, 영상·외부 주소는 새 창으로
  const detail=window.mtDetailUrl?window.mtDetailUrl(link):'';
  if(detail)a.href=detail;else if(link){a.href=link;a.target='_blank';a.rel='noopener noreferrer';}
  // 상세페이지는 긴 썸네일(400×800, tools/make_tall_thumbs.py)이 있으면 그것을 쓴다. 없거나 못 불러오면 API 썸네일.
  const iid=(/[?&]it_id=(\d+)/.exec(String(it.link||''))||[])[1],tall=cat==='detail'&&iid&&window.MT_TALL&&window.MT_TALL[iid];
  const img=el('img');img.alt='';img.width=400;img.height=tall?800:541;img.loading='lazy';img.decoding='async';
  if(tall){img.src='assets/portfolio/tall/'+iid+'.webp';img.addEventListener('error',()=>{img.height=541;img.src=thumb;},{once:true});}else img.src=thumb;
  a.append(img);
  if(video){const p=el('span','video-play');p.setAttribute('aria-hidden','true');a.append(p);}
  const name=el('span','x-wname',title);
  const sr=' — '+catName+' 작업물'+(video?(link?', 유튜브에서 재생 (새 창)':''):', 상세 보기');
  name.append(el('span','sr-only',sr));a.append(name);
  const cap=el('figcaption');cap.append(el('span','x-wcat',catName));
  fig.append(a,cap);li.append(fig);return li;
}

async function loadFromApi(){
  if(!list||!window.fetch||!window.AbortController)return false;
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),TIMEOUT);
  list.setAttribute('aria-busy','true');
  try{
    const res=await fetch(API,{signal:ctrl.signal,headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const json=await res.json();try{sessionStorage.setItem('mt_pf_api',JSON.stringify(json));}catch(e){}
    const items=json&&json.status==='success'&&json.data&&Array.isArray(json.data.items)?json.data.items:[];
    const cards=items.map(buildCard).filter(Boolean);
    if(!cards.length)throw new Error('빈 응답');
    // API에는 AI 영상(유튜브)이 없으므로 HTML의 영상 카드를 남겨, API 카드 4개마다 1개씩 섞어 넣는다(AI 영상 탭이 비지 않게).
    const videos=[...list.querySelectorAll('.pf-video')],mixed=[];
    cards.forEach((c,i)=>{mixed.push(c);if(i%4===3&&videos.length)mixed.push(videos.shift());});
    mixed.push(...videos);
    list.replaceChildren(...mixed);
    return true;
  }catch(e){
    console.warn('[portfolio] API 로드 실패, 정적 카드 사용:',e&&e.name==='AbortError'?'타임아웃':e);
    return false;
  }finally{clearTimeout(timer);list.removeAttribute('aria-busy');}
}

// 반환값: 카드 목록을 다시 읽어 렌더하는 refresh 함수(API 카드로 교체된 뒤 호출).
function initGallery(){
let cards=[...document.querySelectorAll('.pf-card')];
const tabs=[...document.querySelectorAll('.pf-tab')],nav=document.querySelector('[data-pf-pages]');if(!tabs.length||!nav)return ()=>{};
const count=document.querySelector('[data-pf-count]'),empty=document.querySelector('[data-pf-empty]'),works=document.getElementById('works');let category=tabs.some(t=>t.dataset.f===location.hash.slice(1))?location.hash.slice(1):'all',page=1;const size=12;
function render(focus){const filtered=cards.filter(c=>category==='all'||c.dataset.cat===category),pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.max(1,Math.min(page,pages));cards.forEach(c=>c.hidden=true);filtered.slice((page-1)*size,page*size).forEach(c=>c.hidden=false);tabs.forEach(t=>{const on=t.dataset.f===category;t.classList.toggle('on',on);t.setAttribute('aria-pressed',String(on));});count.textContent=filtered.length+'개 작업 · '+page+' / '+pages+' 페이지';empty.hidden=filtered.length>0;nav.replaceChildren();
function add(label,n,disabled,current){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.dataset.page=n;b.setAttribute('aria-label',/^\d+$/.test(label)?label+'페이지':label+' 페이지');if(current)b.setAttribute('aria-current','page');nav.append(b);}
add('이전',page-1,page===1,false);/* 페이지가 많으면 1·마지막과 현재 앞뒤 2쪽만 보이고 사이는 … 로 줄인다 */const show=new Set([1,pages]);for(let i=page-2;i<=page+2;i++)if(i>=1&&i<=pages)show.add(i);let prev=0;[...show].sort((x,y)=>x-y).forEach(i=>{if(i-prev>1){const g=document.createElement('span');g.className='pf-gap';g.textContent='…';g.setAttribute('aria-hidden','true');nav.append(g);}add(String(i),i,false,i===page);prev=i;});add('다음',page+1,page===pages,false);
if(focus){works.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});const heading=document.getElementById('xGal');heading.tabIndex=-1;heading.focus({preventScroll:true});}}
tabs.forEach(t=>t.addEventListener('click',()=>{category=t.dataset.f;page=1;history.replaceState(null,'',category==='all'?location.pathname:('#'+category));render(false);}));nav.addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b){page=Number(b.dataset.page);render(true);}});document.querySelectorAll('[data-f-reset]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();category='all';page=1;render(true);}));render(false);if(category!=='all')works.scrollIntoView();
return ()=>{cards=[...document.querySelectorAll('.pf-card')];page=1;render(false);};
}

// 퍼즐(masonry) 배치: 카드마다 실제 높이에 맞춰 grid-row-end:span N 을 준다(행 단위 2px, CSS .is-masonry).
// ResizeObserver 로 이미지 로드·창 크기·탭 전환(숨김 해제) 때마다 다시 계산. 가로 순서는 그대로라 페이지 순서 유지.
const masonryApi=window.mtMasonry?window.mtMasonry(list,'.x-work'):{relayout(){}};
const masonry=()=>masonryApi.relayout();

// 정적 카드로 먼저 탭·페이지를 띄워 두고(로딩 중 61개 전부 노출 방지),
// API 카드로 교체되면 같은 상태(탭·해시)로 다시 렌더한다. 실패 시 정적 카드 유지.
const refresh=initGallery();
loadFromApi().then(replaced=>{if(replaced){refresh();masonry();}});

// 작업물 상세 페이지 연결: 정적 카드(HTML)의 망고트리 게시물 링크도 work.html 로 바꾼다(API 카드는 buildCard 에서 처리).
(()=>{if(!list||!window.mtDetailUrl)return;const fix=()=>list.querySelectorAll('.pf-card:not(.pf-video) a.x-wlink[target]').forEach(a=>{const d=window.mtDetailUrl(a.href);if(!d)return;a.href=d;a.removeAttribute('target');a.removeAttribute('rel');const sr=a.querySelector('.sr-only');if(sr)sr.textContent=sr.textContent.replace(/,? ?망고트리 작업 페이지에서 보기 \(새 창\)/,', 상세 보기');});
fix();new MutationObserver(fix).observe(list,{childList:true});})();
})();
