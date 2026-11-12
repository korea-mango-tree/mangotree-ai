// AI 컨설팅 교육 사진: 아래 작은 사진을 누르면 큰 사진(edu-main)과 자리를 바꾼다
(()=>{
  const box=document.querySelector('.edu-photos');if(!box)return;
  const main=box.querySelector('.edu-main');if(!main)return;
  const thumbs=[...box.querySelectorAll('figure:not(.edu-main)')];
  // 캡션의 부제(굵은 제목 뒤 글자)를 span으로 감싸, 큰 사진에서만 보이게 한다
  box.querySelectorAll('figcaption').forEach(c=>[...c.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim()){const s=document.createElement('span');s.textContent=n.textContent.trim();n.replaceWith(s)}}));
  const swap=t=>{
    const mi=main.querySelector('img'),ti=t.querySelector('img'),mc=main.querySelector('figcaption'),tc=t.querySelector('figcaption');
    ['src','alt','width','height'].forEach(k=>{const v=mi.getAttribute(k);mi.setAttribute(k,ti.getAttribute(k));ti.setAttribute(k,v)});
    const h=mc.innerHTML;mc.innerHTML=tc.innerHTML;tc.innerHTML=h;
    t.setAttribute('aria-label',(tc.querySelector('b')||tc).textContent.trim()+' 사진 크게 보기');
  };
  thumbs.forEach(t=>{
    t.tabIndex=0;t.setAttribute('role','button');
    t.setAttribute('aria-label',(t.querySelector('figcaption b')||t).textContent.trim()+' 사진 크게 보기');
    t.addEventListener('click',()=>swap(t));
    t.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();swap(t)}});
  });
})();
