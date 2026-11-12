/* AI 모듈 참고 화면: 이미지가 칸보다 길면 칸 안에서 위→아래로 천천히 움직여 끝까지 보여 줌(맨 위·맨 아래에서 잠시 멈춤, 반복) */
(()=>{
const mq=matchMedia('(min-width:961px)'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
// #mod-1(AI CREATIVE)은 움직이지 않고 세로 가운데 정렬로 고정(사용자 요청)
const imgs=[...document.querySelectorAll('.mod-cat:not(#mod-1)>.mod-ref .mod-ref-frame img')];if(!imgs.length)return;
function measure(img){
  const frame=img.parentElement;img.classList.remove('is-run','is-tall');img.style.removeProperty('--dist');
  if(!mq.matches||!img.naturalWidth)return;
  const h=img.naturalHeight*frame.clientWidth/img.naturalWidth,dist=h-frame.clientHeight;
  if(dist<=8)return;                       // 칸에 다 들어가면 그대로(contain)
  img.classList.add('is-tall');
  if(reduce.matches)return;                // 동작 줄이기: 칸 안에서 직접 스크롤
  img.style.setProperty('--dist',-dist+'px');
  img.style.setProperty('--dur',Math.max(8,dist/60/0.76).toFixed(1)+'s');  // 이동 구간이 초당 약 60px
  img.classList.add('is-run');
}
const all=()=>imgs.forEach(measure);
imgs.forEach(img=>{if(img.complete)measure(img);else img.addEventListener('load',()=>measure(img),{once:true})});
let t;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(all,150)});
mq.addEventListener('change',all);reduce.addEventListener('change',all);
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>e.target.querySelector('img').classList.toggle('is-paused',!e.isIntersecting)),{threshold:.1});imgs.forEach(i=>io.observe(i.parentElement));}
})();
