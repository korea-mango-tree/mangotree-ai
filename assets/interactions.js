/* Progressive visual feedback; navigation works without jQuery. */
(function($){if(!$)return;$(function(){
const motion=matchMedia('(prefers-reduced-motion: reduce)');
// Preserve emphasis and explicit line breaks while revealing each grapheme.
$('main h1,.h-hero-title,.dx-hero h1').each(function(){
const title=this;if(title.dataset.maskTitle)return;title.dataset.maskTitle='true';
title.setAttribute('aria-label',title.innerText.replace(/\s+/g,' ').trim());
const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT),nodes=[];let node,index=0;
while((node=walker.nextNode()))nodes.push(node);
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ko',{granularity:'grapheme'}):null;
nodes.forEach(text=>{const fragment=document.createDocumentFragment();const chars=segmenter?Array.from(segmenter.segment(text.textContent),s=>s.segment):Array.from(text.textContent);
chars.forEach(char=>{if(/\s/.test(char)){fragment.append(document.createTextNode(char));return;}const mask=document.createElement('span'),letter=document.createElement('span');mask.className='title-mask';mask.setAttribute('aria-hidden','true');letter.className='title-letter';letter.textContent=char;letter.style.setProperty('--letter-delay',Math.min(index++,45)*27+'ms');mask.append(letter);fragment.append(mask);});text.replaceWith(fragment);});
if(!motion.matches)title.classList.add('title-mask-play');
});
const $progress=$('<div class="reading-progress" aria-hidden="true"></div>').appendTo('body');let scheduled=false;
function update(){const span=document.documentElement.scrollHeight-innerHeight;$progress.css('transform','scaleX('+(span>0?Math.min(1,Math.max(0,scrollY/span)):0)+')');scheduled=false;}
$(window).on('scroll.mango resize.mango',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}});update();
const cards='.x-work,.pf-card,.mod,.wf-step,.dx-pain,.dx-module-connect a,.h-case,.h-plat-list a,.ba-card';
// Animate on entry without hiding content while waiting for JavaScript.
if('IntersectionObserver' in window){
const targets='main h2,.h-row-title,.h-case,.x-work,.pf-card,.mod,.wf-step,.ba-card,.x-hw,.h-collage > *, .dx-hero-visual';
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
