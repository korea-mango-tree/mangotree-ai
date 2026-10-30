/* Progressive visual feedback; navigation works without jQuery. */
(function($){if(!$)return;$(function(){
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const $progress=$('<div class="reading-progress" aria-hidden="true"></div>').appendTo('body');let scheduled=false;
function update(){const span=document.documentElement.scrollHeight-innerHeight;$progress.css('transform','scaleX('+(span>0?Math.min(1,Math.max(0,scrollY/span)):0)+')');scheduled=false;}
$(window).on('scroll.mango resize.mango',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}});update();
const cards='.x-work,.pf-card,.mod,.wf-step,.dx-pain,.dx-module-connect a,.h-case,.h-plat-list a,.ba-card';
// Animate on entry without hiding content while waiting for JavaScript.
if('IntersectionObserver' in window){
const targets='main h1,main h2,.h-row-title,.x-hero h1,.h-hero-title,.dx-hero h1,.h-case,.x-work,.pf-card,.mod,.wf-step,.ba-card,.x-hw,.h-collage > *, .dx-hero-visual';
const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;if(!motion.matches){$(el).css('--enter-delay',Math.min($(el).index()%4,3)*70+'ms').addClass('mango-enter');}io.unobserve(el);});},{threshold:.08});
$(targets).filter(function(){return !$(this).parents('.pf-card,.h-case,.ba-card,.x-work,.mod').length;}).each(function(){io.observe(this);});
$(document).on('animationend.mango','.mango-enter',function(){$(this).removeClass('mango-enter');});
}
$(document).on('mouseenter.mango',cards,function(){if(!motion.matches&&matchMedia('(hover: hover)').matches)$(this).addClass('is-hovered');}).on('mouseleave.mango',cards,function(){$(this).removeClass('is-hovered');});
$(document).on('pointerdown.mango','button,.btn,.nav-ai,.nav-cta',function(){if(!motion.matches)$(this).addClass('is-pressed');});
$(document).on('pointerup.mango pointercancel.mango',()=>$('.is-pressed').removeClass('is-pressed'));
$(window).on('blur.mango',()=>$('.is-pressed').removeClass('is-pressed'));
$(document).on('click.mango','.pf-tab',function(){if(motion.matches)return;$('.pf-card:visible').each(function(i){$(this).removeClass('filter-pop');void this.offsetWidth;$(this).css('--pop-delay',Math.min(i,5)*30+'ms').addClass('filter-pop');});});
motion.addEventListener('change',()=>$('.is-hovered,.is-pressed,.filter-pop,.mango-enter').removeClass('is-hovered is-pressed filter-pop mango-enter'));
});})(window.jQuery);
