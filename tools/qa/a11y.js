const { chromium } = require('playwright');
const fs=require('fs');const AXE=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const port=process.argv[2];
const pages=['index','products','modules','platforms','usecase','portfolio','pricing','diagnosis'];
(async()=>{const b=await chromium.launch();const R={};
// 1) 모바일 메뉴 키보드
{const p=await b.newPage({viewport:{width:390,height:844}});await p.goto(`http://localhost:${port}/index.html`);await p.waitForTimeout(300);
 const st=()=>p.evaluate(()=>({exp:document.getElementById('burger').getAttribute('aria-expanded'),ctl:document.getElementById('burger').getAttribute('aria-controls'),label:document.getElementById('burger').getAttribute('aria-label'),open:document.getElementById('navLinks').classList.contains('open'),focus:document.activeElement.id||document.activeElement.textContent.trim().slice(0,12)}));
 await p.focus('#burger');R.menu0=await st();await p.keyboard.press('Enter');await p.waitForTimeout(100);R.menuOpen=await st();
 await p.keyboard.press('Escape');await p.waitForTimeout(100);R.menuEsc=await st();
 R.menuItemH=await p.evaluate(()=>{document.getElementById('burger').click();return [...document.querySelectorAll('#navLinks a')].map(a=>Math.round(a.getBoundingClientRect().height));});
 // 건너뛰기 링크
 await p.goto(`http://localhost:${port}/index.html`);await p.keyboard.press('Tab');R.firstTab=await p.evaluate(()=>document.activeElement.className+' '+document.activeElement.getAttribute('href'));
 await p.keyboard.press('Enter');await p.waitForTimeout(200);R.afterSkip=await p.evaluate(()=>document.activeElement.id);await p.close();}
// 2) 모션 감소: 히어로 자동 전환 멈춤, 등장효과 숨김 없음
{const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();await p.goto(`http://localhost:${port}/index.html`);await p.waitForTimeout(6500);
 R.reduced=await p.evaluate(()=>({active:[...document.querySelectorAll('.pslide')].findIndex(s=>s.classList.contains('is-active')),stopped:!!document.querySelector('.is-stopped'),hiddenReveal:[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity==='0').length,revealOn:document.documentElement.classList.contains('reveal-on')}));await ctx.close();}
// 3) JS 끔: 콘텐츠 보임
{const ctx=await b.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false});const p=await ctx.newPage();
 for(const pg of ['index','portfolio']){await p.goto(`http://localhost:${port}/${pg}.html`);R['noJS_'+pg]=await p.evaluate(()=>({reveal:document.querySelectorAll('.reveal').length,hidden:[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity==='0').length}));}
 await ctx.close();}
// 4) 히어로 자동 전환 멈춤 버튼
{const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto(`http://localhost:${port}/index.html`);await p.waitForTimeout(300);
 if(await p.$('#heroPlay')) await p.click('#heroPlay');await p.mouse.move(0,0);await p.waitForTimeout(6000);R.pauseBtn=await p.evaluate(()=>({label:(document.getElementById('heroPlay')||{getAttribute:()=>'(없음)'}).getAttribute('aria-label'),active:[...document.querySelectorAll('.pslide')].findIndex(s=>s.classList.contains('is-active'))}));await p.close();}
// 5) axe (WCAG 2 A/AA)
for(const vp of [1440,390]){const p=await b.newPage({viewport:{width:vp,height:900}});
 for(const pg of pages){await p.goto(`http://localhost:${port}/${pg}.html`,{waitUntil:'load'});await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));await p.waitForTimeout(800);
  await p.addScriptTag({content:AXE});
  const r=await p.evaluate(async()=>{const x=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return x.violations.map(v=>v.id+'('+v.impact+')x'+v.nodes.length+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' , '));});
  R['axe_'+vp+'_'+pg]=r;}
 await p.close();}
console.log(JSON.stringify(R,null,1));await b.close();})();
