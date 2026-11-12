// story.html 을 프레임별로 찍어 animated WebP 로 만든다. 사용: node tools/pageconnect-anim/render.js 출력.webp [미리보기폴더]
// (로컬 서버 http://localhost:8765 에서 저장소 루트를 서비스하는 상태에서 실행)
const {chromium}=require('playwright');const {execFileSync}=require('child_process');const fs=require('fs'),path=require('path'),os=require('os');
(async()=>{const out=process.argv[2];const prev=process.argv[3];const FPS=10,DUR=10;const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pcan-'));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});
await p.goto('http://localhost:8765/tools/pageconnect-anim/story.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.evaluate(()=>document.getAnimations().forEach(a=>a.pause()));
for(let i=0;i<FPS*DUR;i++){const t=i*1000/FPS;await p.evaluate(t=>document.getAnimations().forEach(a=>a.currentTime=t),t);
 await p.screenshot({path:path.join(tmp,String(i).padStart(4,'0')+'.png')});}
await b.close();
execFileSync('ffmpeg',['-loglevel','error','-y','-framerate',String(FPS),'-i',path.join(tmp,'%04d.png'),'-c:v','libwebp_anim','-loop','0','-quality','60','-compression_level','6',out]);
const poster=out.replace(/\.webp$/,'-poster.jpg');execFileSync('ffmpeg',['-loglevel','error','-y','-i',path.join(tmp,'0015.png'),'-q:v','3',poster]);
if(prev){for(const k of [15,38,63,88])fs.copyFileSync(path.join(tmp,String(k).padStart(4,'0')+'.png'),path.join(prev,'pc-'+k+'.png'));}
console.log(out,fs.statSync(out).size,poster);})();
