(()=>{
const API='https://mangotree.co.kr/api/portfolio.php?cat=all&limit=30',TIMEOUT=6000;
const list=document.querySelector('ul.x-works');

// DB 값은 textContent·속성으로만 넣는다(innerHTML 금지). URL 은 http(s)만 허용.
function safeUrl(v){try{const u=new URL(String(v),location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch(e){return '';}}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function buildCard(it){
  const cat=String(it.cat||''),catName=String(it.catName||''),title=String(it.title||''),link=safeUrl(it.link),thumb=safeUrl(it.thumb),video=!!it.youtubeId;
  if(!cat||!title||!thumb)return null;
  const li=el('li','x-work pf-card'+(video?' pf-video':''));li.dataset.cat=cat;
  const fig=el('figure'),a=el(link?'a':'span','x-wlink');
  if(link){a.href=link;a.target='_blank';a.rel='noopener noreferrer';}
  const img=el('img');img.src=thumb;img.alt='';img.width=400;img.height=541;img.loading='lazy';img.decoding='async';a.append(img);
  if(video){const p=el('span','video-play','▶');p.setAttribute('aria-hidden','true');a.append(p);}
  const name=el('span','x-wname',title);
  const sr=' — '+catName+' 작업물'+(link?(video?', 유튜브에서 재생 (새 창)':', 망고트리 작업 페이지에서 보기 (새 창)'):'');
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
    const json=await res.json(),items=json&&json.status==='success'&&json.data&&Array.isArray(json.data.items)?json.data.items:[];
    const cards=items.map(buildCard).filter(Boolean);
    if(!cards.length)throw new Error('빈 응답');
    list.replaceChildren(...cards);
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
add('이전',page-1,page===1,false);for(let i=1;i<=pages;i++)add(String(i),i,false,i===page);add('다음',page+1,page===pages,false);
if(focus){works.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});const heading=document.getElementById('xGal');heading.tabIndex=-1;heading.focus({preventScroll:true});}}
tabs.forEach(t=>t.addEventListener('click',()=>{category=t.dataset.f;page=1;history.replaceState(null,'',category==='all'?location.pathname:('#'+category));render(false);}));nav.addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b){page=Number(b.dataset.page);render(true);}});document.querySelectorAll('[data-f-reset]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();category='all';page=1;render(true);}));render(false);if(category!=='all')works.scrollIntoView();
return ()=>{cards=[...document.querySelectorAll('.pf-card')];page=1;render(false);};
}

// 퍼즐(masonry) 배치: 카드마다 실제 높이에 맞춰 grid-row-end:span N 을 준다(행 단위 2px, CSS .is-masonry).
// ResizeObserver 로 이미지 로드·창 크기·탭 전환(숨김 해제) 때마다 다시 계산. 가로 순서는 그대로라 페이지 순서 유지.
const masonry=(()=>{
  if(!list||!window.ResizeObserver)return ()=>{};
  const UNIT=2;
  const fit=c=>{if(c.hidden)return;const h=c.getBoundingClientRect().height+parseFloat(getComputedStyle(c).marginBottom||0);c.style.gridRowEnd='span '+Math.max(1,Math.ceil(h/UNIT));};
  const ro=new ResizeObserver(es=>es.forEach(e=>fit(e.target)));
  list.classList.add('is-masonry');
  return ()=>{ro.disconnect();list.querySelectorAll('.x-work').forEach(c=>{fit(c);ro.observe(c);});};
})();
masonry();

// 정적 카드로 먼저 탭·페이지를 띄워 두고(로딩 중 61개 전부 노출 방지),
// API 카드로 교체되면 같은 상태(탭·해시)로 다시 렌더한다. 실패 시 정적 카드 유지.
const refresh=initGallery();
loadFromApi().then(replaced=>{if(replaced){refresh();masonry();}});
})();
