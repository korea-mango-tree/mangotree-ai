(()=>{
const mount=document.getElementById('heroVideoMount'),button=document.getElementById('heroVideoToggle');if(!mount||!button)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let playing=false;
function setPlaying(next){mount.replaceChildren();playing=next;if(next){const iframe=document.createElement('iframe');iframe.title='Big Buck Bunny 유튜브 샘플 영상';iframe.src='https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&mute=1&loop=1&playlist=aqz-KE-bpKQ&controls=0&playsinline=1&rel=0&start=35';iframe.allow='autoplay; encrypted-media';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.tabIndex=-1;mount.append(iframe);}button.textContent=next?'영상 멈추기':'영상 재생';button.setAttribute('aria-pressed',String(next));}
button.addEventListener('click',()=>setPlaying(!playing));reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});setPlaying(!reduced.matches);
})();
