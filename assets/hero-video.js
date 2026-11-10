(()=>{
const mount=document.getElementById('heroVideoMount'),button=document.getElementById('heroVideoToggle');if(!mount||!button)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let video=null,playing=false;
function make(){video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.tabIndex=-1;video.preload='auto';video.poster='assets/video/hero-main-poster.jpg';
 const big=Math.max(innerWidth,innerHeight)*(devicePixelRatio||1)>1600;
 const s1=document.createElement('source');s1.src=big?'assets/video/hero-main-1080.mp4':'assets/video/hero-main-720.mp4';s1.type='video/mp4';
 const s2=document.createElement('source');s2.src='assets/video/hero-main-720.webm';s2.type='video/webm';
 video.append(s1,s2);mount.append(video);}
function setPlaying(next){playing=next;if(next){if(!video)make();const p=video.play();if(p&&p.catch)p.catch(()=>{});}else if(video){video.pause();}
 button.textContent=next?'영상 멈추기':'영상 재생';button.setAttribute('aria-pressed',String(next));}
button.addEventListener('click',()=>setPlaying(!playing));reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});setPlaying(!reduced.matches);
})();
