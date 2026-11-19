// 진단 E2E 회귀: 같은 시나리오를 변경 전(8766)/후(8765)에 돌려 문항 수·결과·공유 링크를 비교
const { chromium } = require('playwright');
const port = process.argv[2];
const SC = {
  sale14: {purpose:['sale'], industry:['식품'], detailNeed:'yes', photoNeed:'yes'},
  b2b8:   {purpose:['b2b'], industry:['제조'], detailNeed:'no', photoNeed:'no'},
};
(async()=>{
  const b = await chromium.launch();
  const out = {};
  for (const [name, sc] of Object.entries(SC)) {
    const ctx = await b.newContext({viewport:{width:1280,height:900}, permissions:['clipboard-read','clipboard-write']});
    const posts = [];
    // 실제 리드 전송 차단(mock): 외부로 나가는 POST는 모두 가짜 200 응답
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => {
      if (r.request().method() === 'POST') { posts.push(r.request().url().replace(/\?.*/,'')); return r.fulfill({status:200, contentType:'application/json', body:'{"ok":true}'}); }
      return r.abort();
    });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/diagnosis.html#start`, {waitUntil:'load'}); await p.waitForTimeout(600);
    for (const v of sc.purpose) await p.evaluate(sel => document.querySelector(sel).click(), `#dxPanel input[name=purpose][value="${v}"]`);
    for (const v of sc.industry) await p.evaluate(sel => document.querySelector(sel).click(), `#dxPanel input[name=industry][value="${v}"]`);
    await p.evaluate(sel => document.querySelector(sel).click(), `#dxPanel input[name=detailNeed][value=${sc.detailNeed}]`);
    await p.evaluate(sel => document.querySelector(sel).click(), `#dxPanel input[name=photoNeed][value=${sc.photoNeed}]`);
    await p.click('#dxNext');
    let n = 0;
    for (; n < 30; n++) {
      await p.waitForTimeout(120);
      const has = await p.$('#dxBody input[name=ans]');
      if (!has) break;
      if (n === 0) out[name+'_firstMeta'] = await p.evaluate(() => document.querySelector('.dx-qmeta').innerText);
      await p.evaluate(() => { const r = document.querySelectorAll('#dxBody input[name=ans]')[1]; r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); });
      await p.click('#dxNext');
    }
    out[name+'_questions'] = n;
    await p.waitForTimeout(3500);
    const res = await p.evaluate(() => { const el = document.getElementById('dxBody') || document.getElementById('dxPanel'); return el ? el.innerText : ''; });
    out[name+'_result'] = res.replace(/\s+/g,' ').slice(0, 400);
    // 공유 링크 생성·복원
    await p.click('#dxCopy'); await p.waitForTimeout(400);
    const share = await p.evaluate(() => navigator.clipboard.readText()).catch(()=> '');
    out[name+'_shareLinkPath'] = share.replace(/#r=.*/,'#r=…');
    out[name+'_shareOk'] = !!share;
    for (const via of ['diagnosis.html','features.html']) {
      const p2 = await ctx.newPage();
      await p2.goto(`http://localhost:${port}/${via}` + share.slice(share.indexOf('#')), {waitUntil:'load'}); await p2.waitForTimeout(3500);
      const t = await p2.evaluate(() => { const el = document.getElementById('dxBody') || document.getElementById('dxPanel'); return [location.pathname.split('/').pop(), el ? el.innerText.replace(/\s+/g,' ').slice(0, 400) : '']; });
      out[name+'_sharedVia_'+via] = t[0] + ' :: ' + (t[1] === out[name+'_result'] ? 'SAME AS RESULT' : t[1].slice(0,120));
      await p2.close();
    }
    out[name+'_errors'] = errs; out[name+'_posts'] = posts;
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
