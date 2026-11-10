(()=>{
const mount=document.getElementById('heroVideoMount'),button=document.getElementById('heroVideoToggle');if(!mount||!button)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let video=null,playing=false;
function make(){video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.preload='auto';video.poster='assets/video/hero-main-poster.jpg';
 const big=Math.max(innerWidth,innerHeight)*(devicePixelRatio||1)>1600;
 const s1=document.createElement('source');s1.src=big?'assets/video/hero-main-1080.mp4':'assets/video/hero-main-720.mp4';s1.type='video/mp4';
 const s2=document.createElement('source');s2.src='assets/video/hero-main-720.webm';s2.type='video/webm';
 video.append(s1,s2);mount.append(video);video.addEventListener('timeupdate',sync);video.addEventListener('seeked',sync);}
const SCENES=[[0,'네이버 블로그 글 작성·발행'],[2.75,'인스타그램 피드 업로드·좋아요·댓글'],[5.29,'AI 아바타 라이브커머스 진행'],[6.92,'네이버 검색광고 캠페인 설정·OFF'],[9.35,'스마트스토어 리뷰 답글 등록'],[11.15,'스마트스토어 상품정보 입력'],[14.58,'랜딩페이지 제작·배포(가상 브랜드 시연)']];
const now=document.getElementById('heroAiNow'),task=document.getElementById('heroAiTask');let last='';
function sync(){if(!video||!task)return;const t=video.currentTime;let label=SCENES[0][1];for(const s of SCENES){if(t>=s[0])label=s[1];}if(label!==last){task.textContent=label;last=label;}}
function setPlaying(next){playing=next;if(next){if(!video)make();const p=video.play();if(p&&p.catch)p.catch(()=>{});}else if(video){video.pause();}
 button.textContent=next?'영상 멈추기':'영상 재생';if(now)now.classList.toggle('is-paused',!next);button.setAttribute('aria-pressed',String(next));}
button.addEventListener('click',()=>setPlaying(!playing));reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});setPlaying(!reduced.matches);
})();
