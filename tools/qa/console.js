const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for (const pg of ['index','products','modules','platforms','usecase','portfolio','pricing','diagnosis','features']) {
  const p=await b.newPage(); const e=[];
  p.on('pageerror',x=>e.push(x.message)); p.on('console',m=>m.type()==='error'&&!/net::ERR/.test(m.text())&&e.push(m.text()));
  p.on('response',r=>r.status()>=400&&e.push(r.status()+' '+r.url()));
  await p.goto('http://localhost:'+(process.argv[2]||8765)+'/'+pg+'.html',{waitUntil:'networkidle'}).catch(x=>e.push(x.message));
  console.log(pg, p.url().split('/').pop(), e.length?e.join(' | '):'OK'); await p.close(); }
await b.close();})();
