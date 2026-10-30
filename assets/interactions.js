/* Progressive visual feedback; navigation works without jQuery. */
(function($){if(!$)return;$(function(){
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const $progress=$('<div class="reading-progress" aria-hidden="true"></div>').appendTo('body');let scheduled=false;
function update(){const span=document.documentElement.scrollHeight-innerHeight;$progress.css('transform','scaleX('+(span>0?Math.min(1,Math.max(0,scrollY/span)):0)+')');scheduled=false;}
$(window).on('scroll.mango resize.mango',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}});update();
const cards='.x-work,.mod,.wf-step,.dx-pain,.dx-module-connect a';
$(document).on('mouseenter.mango',cards,function(){if(!motion.matches&&matchMedia('(hover: hover)').matches)$(this).addClass('is-hovered');}).on('mouseleave.mango',cards,function(){$(this).removeClass('is-hovered');});
$(document).on('pointerdown.mango','button,.btn,.nav-ai,.nav-cta',function(){if(!motion.matches)$(this).addClass('is-pressed');});
$(document).on('pointerup.mango pointercancel.mango',()=>$('.is-pressed').removeClass('is-pressed'));
$(window).on('blur.mango',()=>$('.is-pressed').removeClass('is-pressed'));
$(document).on('click.mango','.pf-tab',function(){if(motion.matches)return;$('.pf-card:visible').each(function(i){$(this).removeClass('filter-pop');void this.offsetWidth;$(this).css('--pop-delay',Math.min(i,5)*30+'ms').addClass('filter-pop');});});
motion.addEventListener('change',()=>$('.is-hovered,.is-pressed,.filter-pop').removeClass('is-hovered is-pressed filter-pop'));
});})(window.jQuery);
