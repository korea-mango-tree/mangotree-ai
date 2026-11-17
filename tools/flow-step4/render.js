// dashboard.html 을 프레임별로 찍어 메인 흐름 04 이미지(assets/screens/flow-step4.webp, -poster.jpg)를 만든다.
// 사용: node tools/flow-step4/render.js  (저장소 루트를 http://localhost:8765 로 서비스하는 상태에서)
const {chromium}=require('playwright');const {execFileSync}=require('child_process');const fs=require('fs'),path=require('path'),os=require('os');
(async()=>{const FPS=12,DUR=6;const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fs4-'));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:600}});
await p.goto('http://localhost:8765/tools/flow-step4/dashboard.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
for(let i=0;i<FPS*DUR;i++){await p.evaluate(t=>window.render(t),i*1000/FPS);await p.screenshot({path:path.join(tmp,String(i).padStart(4,'0')+'.png')});}
await p.evaluate(()=>window.render(2500));await p.screenshot({path:path.join(tmp,'poster.png')});await b.close();
execFileSync('ffmpeg',['-loglevel','error','-y','-framerate',String(FPS),'-i',path.join(tmp,'%04d.png'),'-c:v','libwebp_anim','-loop','0','-lossless','1','-compression_level','6','assets/screens/flow-step4.webp']);
execFileSync('ffmpeg',['-loglevel','error','-y','-i',path.join(tmp,'poster.png'),'-q:v','3','assets/screens/flow-step4-poster.jpg']);
if(process.argv[2])fs.copyFileSync(path.join(tmp,'0030.png'),process.argv[2]);
console.log('flow-step4.webp',fs.statSync('assets/screens/flow-step4.webp').size);})();
