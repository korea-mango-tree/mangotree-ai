/* 활용사례 01 After: 긴 상세페이지 이미지를 프레임 안에서 자동으로 위로 이동(맨 위·맨 아래에서 잠시 멈춤, 반복) */
(()=>{
const img=document.querySelector('#scen-1 .ba-shot img');if(!img)return;
const frame=img.parentElement;img.classList.add('ba-scroll');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function measure(){
  if(reduce.matches){img.classList.remove('is-run');return;}
  const dist=Math.max(0,img.offsetHeight-frame.clientHeight);
  if(!dist||!img.naturalHeight){img.classList.remove('is-run');return;}
  img.style.setProperty('--dist',-dist+'px');
  // 이동 구간(전체의 76%)이 초당 약 70px가 되도록, 최소 8초
  img.style.setProperty('--dur',Math.max(8,dist/70/0.76).toFixed(1)+'s');
  img.classList.add('is-run');
}
if(img.complete)measure();else img.addEventListener('load',measure,{once:true});
addEventListener('resize',()=>{clearTimeout(measure._t);measure._t=setTimeout(measure,150);});
reduce.addEventListener('change',measure);
new IntersectionObserver(es=>es.forEach(e=>img.classList.toggle('is-paused',!e.isIntersecting)),{threshold:.2}).observe(frame);
})();
