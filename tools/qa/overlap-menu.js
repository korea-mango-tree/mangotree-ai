const { chromium } = require('playwright');
const port=process.argv[2]||8765;
const rect=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),vis:cs.visibility,op:cs.opacity,disp:cs.display};},s);
const hit=(a,b)=>a&&b&&a.disp!=='none'&&b.disp!=='none'&&a.vis!=='hidden'&&b.vis!=='hidden'&&a.op!=='0'&&b.op!=='0'&&!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
(async()=>{const b=await chromium.launch();const R={};
for (const vp of [{w:390,h:844},{w:320,h:640},{w:667,h:375}]) {
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});
  await p.goto(`http://localhost:${port}/diagnosis.html`);await p.waitForTimeout(300);
  await p.evaluate(()=>scrollTo(0,1400));await p.waitForTimeout(600);
  const st=await rect(p,'.dx-sticky .btn'),fab=await rect(p,'.contact-fab'),top=await rect(p,'.totop');
  R[`dx_${vp.w}x${vp.h}`]={sticky:st,fab,top,fabOverSticky:hit(fab,st),topOverSticky:hit(top,st),topOverFab:hit(top,fab)};
  await p.close();
}
// 가로 화면 메뉴
{const p=await b.newPage({viewport:{width:667,height:375}});await p.goto(`http://localhost:${port}/index.html`);await p.click('#burger');await p.waitForTimeout(200);
 const info=await p.evaluate(()=>{const n=document.getElementById('navLinks');return {h:n.clientHeight,sh:n.scrollHeight,ov:getComputedStyle(n).overflowY,bottom:Math.round(n.getBoundingClientRect().bottom)};});
 const last=p.locator('#navLinks .nav-cta-m a');const lr=await last.boundingBox();
 // 순수 키보드 검증: 스크롤 보조 호출 없이 Tab으로만 마지막 CTA까지 이동해 화면 안에 보이는지 확인
 let n=0;for(;n<10;n++){const t=await p.evaluate(()=>document.activeElement.textContent.trim());if(t==='무료 AI 진단 시작')break;await p.keyboard.press('Tab');}
 const lr2=await last.boundingBox();
 R.landscapeMenu={...info,vh:375,ctaBoxBeforeTab:lr&&{top:Math.round(lr.y),bottom:Math.round(lr.y+lr.height)},ctaInViewAfterTab:lr2&&lr2.y>=0&&lr2.y+lr2.height<=375,tabsToCta:n};
 await p.close();}
// 홈: 히어로 보일 때 FAB 숨김, 스크롤 뒤 표시
for (const w of [1440,390]) {const p=await b.newPage({viewport:{width:w,height:w>800?900:844}});await p.goto(`http://localhost:${port}/index.html`);await p.waitForTimeout(500);
 const a=await rect(p,'.contact-fab');await p.evaluate(()=>scrollTo(0,1600));await p.waitForTimeout(600);const c=await rect(p,'.contact-fab');
 R['homeFab_'+w]={atTop:a.vis,afterScroll:c.vis};await p.close();}
console.log(JSON.stringify(R,null,1));await b.close();})();
