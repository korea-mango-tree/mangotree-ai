const { chromium } = require('playwright');
const port=process.argv[2];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});
const posts=[];await ctx.route(u=>!u.hostname.startsWith('localhost'),r=>{if(r.request().method()==='POST'){posts.push(1);return r.fulfill({status:200,body:'{}'});}return r.abort();});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${port}/diagnosis.html#start`);await p.waitForTimeout(500);
for (const sel of ['input[name=purpose][value=sale]','input[name=industry][value="식품"]','input[name=detailNeed][value=yes]','input[name=photoNeed][value=yes]']) await p.evaluate(s=>document.querySelector('#dxPanel '+s).click(),sel);
await p.click('#dxNext');
for(let i=0;i<20;i++){await p.waitForTimeout(100);if(!await p.$('#dxBody input[name=ans]'))break;await p.evaluate(()=>{const r=document.querySelectorAll('#dxBody input[name=ans]')[1];r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});await p.click('#dxNext');}
await p.waitForTimeout(3500);
await p.click('#dxGoConsult');await p.waitForTimeout(300);
await p.evaluate(()=>{const f=document.querySelector('#dxBody form')||document.querySelector('#dxPanel form');f.company.value='테스트기업';f.name.value='홍길동';f.email.value='test@example.com';const i=f.querySelector('input[name=interests]');if(!i.checked)i.click();f.consent.click();});
await p.click('#dxSubmit');await p.waitForTimeout(800);
console.log(JSON.stringify({done:(await p.evaluate(()=>document.getElementById('dxBody').innerText)).replace(/\s+/g,' ').replace(/MT-\d+-\w+/,'MT-…').slice(0,420),posts:posts.length,errs}));
await b.close();})();
