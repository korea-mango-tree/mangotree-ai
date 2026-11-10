(()=>{
const mount=document.getElementById('heroVideoMount'),slot=document.getElementById('heroAiSlot');if(!mount)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let video=null;
function make(){video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.preload='auto';video.poster='assets/video/hero-main-poster.jpg';
 const big=Math.max(innerWidth,innerHeight)*(devicePixelRatio||1)>1600;
 const s1=document.createElement('source');s1.src=big?'assets/video/hero-main-1080.mp4':'assets/video/hero-main-720.mp4';s1.type='video/mp4';
 const s2=document.createElement('source');s2.src='assets/video/hero-main-720.webm';s2.type='video/webm';
 video.append(s1,s2);mount.append(video);video.addEventListener('timeupdate',sync);video.addEventListener('seeked',sync);}
const SCENES=[[0,'블로그 발행'],[2.19,'인스타그램 게시'],[4.15,'라이브커머스'],[5.38,'검색광고 설정'],[7.25,'리뷰 답글'],[8.62,'상품정보 입력'],[11.22,'랜딩 제작(가상)']];
const now=document.getElementById('heroAiNow'),task=document.getElementById('heroAiTask');let last='';
function sync(){if(!video||!task)return;const t=video.currentTime;let label=SCENES[0][1];for(const s of SCENES){if(t>=s[0])label=s[1];}if(label!==last){task.textContent=label;last=label;place();}}
// 모니터 화면 왼쪽 위(영상 1920x1080 기준 좌표)에 표시를 붙인다. 영상은 cover로 채워지므로 같은 계산으로 위치를 구한다.
const SCREEN_TL=[1124,279];
function place(){if(!now)return;const stage=now.parentElement,bg=stage.querySelector('.hero-video-bg');if(!bg)return;const W=bg.clientWidth,H=bg.clientHeight,k=Math.max(W/1920,H/1080),w=1920*k,h=1080*k;
 const pos=getComputedStyle(bg.querySelector('img')||bg).objectPosition.split(' ').map(v=>parseFloat(v)/100);const ox=(W-w)*(pos[0]||1),oy=(H-h)*(isNaN(pos[1])?.5:pos[1]);
 let L=ox+SCREEN_TL[0]*k+10,T=oy+SCREEN_TL[1]*k+10;
 const maxL=W-now.offsetWidth-12;L=Math.max(12,Math.min(L,maxL));T=Math.max(12,T);
 // 모니터가 화면 밖이거나 제목·문구·버튼과 겹치면(주로 모바일·태블릿) 히어로 아래 줄(slot)로 옮긴다
 const sr=stage.getBoundingClientRect(),nw=now.offsetWidth,nh=now.offsetHeight;
 const hit=(l,t)=>[...stage.querySelectorAll('.h-label,.h-hero-title,.h-hero-sub,.h-hero-cta>*')].some(e=>{const r=e.getBoundingClientRect(),x=r.left-sr.left,y=r.top-sr.top;return l<x+r.width+6&&l+nw>x-6&&t<y+r.height+6&&t+nh>y-6;});
 if(slot&&(ox+SCREEN_TL[0]*k+10<12||hit(L,T))){const b=slot.getBoundingClientRect(),bx=b.left-sr.left;
  L=bx<W/2?bx:bx-nw;T=b.top-sr.top+(b.height-nh)/2;L=Math.max(12,Math.min(L,maxL));}
 now.style.transform='translate('+Math.round(L)+'px,'+Math.round(T)+'px)';now.classList.add('is-placed');}
addEventListener('resize',place);addEventListener('load',place);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);if('ResizeObserver' in window&&now)new ResizeObserver(()=>place()).observe(now.parentElement);
function setPlaying(next){if(next){if(!video)make();const p=video.play();if(p&&p.catch)p.catch(()=>{});}else if(video){video.pause();}
 if(now)now.classList.toggle('is-paused',!next);}
place();reduced.addEventListener('change',()=>setPlaying(!reduced.matches));setPlaying(!reduced.matches);
})();
