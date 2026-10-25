(()=>{
  const toggle=document.querySelector('.menu-button'),nav=document.querySelector('#navigation');
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
  const more=document.querySelector('.header-more');
  // Smart header: hides while scrolling down, comes back on any upward scroll, stays while a menu is open or focused.
  const siteHeader=document.querySelector('.header');
  let lastScroll=window.scrollY;
  const holdHeader=()=>nav.classList.contains('open')||(more&&more.open)||!!siteHeader.querySelector(':focus-visible');
  function updateHeader(){
    const y=Math.max(0,window.scrollY),dy=y-lastScroll;
    if(y<=siteHeader.offsetHeight||holdHeader()){siteHeader.classList.remove('is-hidden');lastScroll=y;return;}
    if(Math.abs(dy)<5)return;
    siteHeader.classList.toggle('is-hidden',dy>0);
    lastScroll=y;
  }
  window.addEventListener('scroll',updateHeader,{passive:true});
  siteHeader.addEventListener('focusin',()=>siteHeader.classList.remove('is-hidden'));

  document.addEventListener('keydown',e=>{if(e.key==='Escape'){more.open=false;nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}});
  document.addEventListener('click',e=>{if(!more.contains(e.target))more.open=false;});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');more.open=false;toggle.setAttribute('aria-expanded','false');}));
  const scene=document.querySelector('.scene'),tree=document.querySelector('.tree'),seats=document.querySelector('.seats');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  // Design preview: motion is ON by default, even if the OS asks for reduced motion. Add ?motion=system to honour the OS setting.
  const forced=!/[?&]motion=system/.test(location.search);
  const still=()=>reduce.matches&&!forced;
  const put=(el,prop,value)=>el.style.setProperty(prop,value,'important');
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
  let queued=false;
  // Everything scrolls normally. The tree gets a little extra upward travel (it tucks under the hero copy);
  // the seats slide up from below (clipped by the hero bottom edge, no fading) and settle at the foot of the tree. Both finish within the first ~55% of a screen.
  // Seminar photos fly in from the left, right or below as they scroll into view, settle, then scroll with the page.
  const flies=[...document.querySelectorAll('.moments figure')].map((el,i)=>({el,dir:['left','bottom','right','left','right'][i%5],ty:0}));
  const dirs={left:-1,right:1,bottom:0};
  function flyIn(){
    const vh=window.innerHeight;
    flies.forEach(f=>{
      if(still()){f.el.style.removeProperty('transform');f.ty=0;return;}
      const top=f.el.getBoundingClientRect().top-f.ty;
      const e=ease((vh*.98-top)/(vh*.5));
      const tx=dirs[f.dir]*(1-e)*window.innerWidth*.2;
      const ty=(1-e)*vh*(f.dir==='bottom'?.32:.22);
      f.ty=ty;
      f.el.style.transform=e>=1?'':`translate3d(${tx}px,${ty}px,0)`;
      if(e>=1)f.ty=0;
    });
  }
  // Mobile hero: the text block is 50% of the (small) viewport height and the crown first shows from 75% of it.
  // The tree starts lower by `treeExtra` and ends in the same composition; `treeSpare` adds the extra air that the taller
  // text block gets below its buttons, so the crown still tucks under them. Recomputed on width change, load and font load.
  const heroMobile=matchMedia('(max-width:700px)');
  let treeExtra=0,treeSpare=0,sceneTopDoc=0,extraWidth=-1;
  function smallViewportHeight(){
    const p=document.createElement('div');
    p.style.cssText='position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
    document.body.appendChild(p);const h=p.offsetHeight;p.remove();
    return h||window.innerHeight;
  }
  function measureExtra(force){
    if(!force&&window.innerWidth===extraWidth)return;
    extraWidth=window.innerWidth;
    treeExtra=0;treeSpare=0;
    if(heroMobile.matches){
      const copy=document.querySelector('.hero-copy'),kids=[...copy.children];
      const contentH=kids[kids.length-1].getBoundingClientRect().bottom-kids[0].getBoundingClientRect().top;
      treeSpare=Math.max(0,(copy.offsetHeight-contentH)/2-60);
      sceneTopDoc=scene.getBoundingClientRect().top+window.scrollY;
      const copyBottom=copy.getBoundingClientRect().bottom+window.scrollY;
      // crown first shows from 70% of the screen height, but never starts above the text block
      treeExtra=Math.max(copyBottom+10-sceneTopDoc,.70*smallViewportHeight()-sceneTopDoc);
    }
    const wrap=scene.closest('.scene-scroll');if(wrap)wrap.style.setProperty('--tree-extra',Math.max(0,treeExtra)+'px');
  }
  window.addEventListener('load',()=>{measureExtra(true);requestDraw();});
  if(document.fonts)document.fonts.ready.then(()=>{measureExtra(true);requestDraw();});
  function draw(){
    queued=false;
    flyIn();
    if(still()){['transform'].forEach(k=>{tree.style.removeProperty(k);seats.style.removeProperty(k);});return;}
    const range=Math.max(260,window.innerHeight*.7);
    const p=clamp(window.scrollY/range);
    const ratio=parseFloat(getComputedStyle(scene).getPropertyValue('--shift-ratio'));const shift=ratio?tree.offsetHeight*ratio:Math.max(0,tree.offsetHeight-scene.offsetHeight);
    measureExtra();
    const e=ease(p);
    const treeY=treeExtra*(1-e)-(shift+treeSpare)*e;
    put(tree,'transform',`translate3d(0,${treeY}px,0)`);
    // Seats slide up from below and settle. Desktop: at the end of the scroll range. Mobile: exactly when the centre of the tree
    // reaches the centre of the screen (progress follows the tree's own position, so it holds on every phone height).
    const seatH=seats.offsetHeight;
    let sp;
    if(heroMobile.matches){
      const half=tree.offsetHeight/2,c0=sceneTopDoc+treeExtra+half,c=sceneTopDoc-window.scrollY+treeY+half;
      sp=ease((c0-c)/Math.max(1,c0-window.innerHeight/2));
    }else sp=ease((p-.22)/.78);
    // Mobile: once settled the seats stay glued to the tree (they follow its remaining travel); desktop keeps the fixed end position.
    const seatsY=heroMobile.matches?(1-sp)*seatH*1.2+sp*(treeY+shift):(1-sp)*seatH*1.2-treeSpare*sp;
    put(seats,'transform',`translate3d(0,${seatsY}px,0)`);
  }
  function requestDraw(){if(!queued){queued=true;requestAnimationFrame(draw);}}
  window.addEventListener('scroll',requestDraw,{passive:true});
  window.addEventListener('resize',requestDraw);
  window.addEventListener('load',requestDraw,{once:true});
  reduce.addEventListener('change',requestDraw);
  if(document.fonts)document.fonts.ready.then(requestDraw);
  draw();
  // Seminar photo viewer: quick soft zoom from the thumbnail to full screen.
  const lb=document.querySelector('#lightbox'),lbImg=lb.querySelector('img'),lbCap=lb.querySelector('figcaption');
  let lbSource=null,lbClosing=false;
  const fitDelta=(from,to)=>({x:from.left+from.width/2-(to.left+to.width/2),y:from.top+from.height/2-(to.top+to.height/2),s:from.width/to.width});
  document.querySelectorAll('.moment-open').forEach(btn=>btn.addEventListener('click',()=>{
    const src=btn.querySelector('img');lbSource=src;lbImg.src=src.currentSrc||src.src;lbImg.alt=src.alt;
    lbCap.textContent=btn.parentElement.querySelector('figcaption').textContent;
    lb.showModal();lbClosing=false;
    if(still())return;
    const to=lbImg.getBoundingClientRect(),d=fitDelta(src.getBoundingClientRect(),to);
    lb.animate([{opacity:0},{opacity:1}],{duration:240,easing:'ease-out'});
    lbImg.animate([{transform:`translate(${d.x}px,${d.y}px) scale(${d.s})`},{transform:'none'}],{duration:340,easing:'cubic-bezier(.2,.75,.2,1)'});
  }));
  function closeViewer(){
    if(lbClosing||!lb.open)return;lbClosing=true;
    if(still()||!lbSource){lb.close();return;}
    const d=fitDelta(lbSource.getBoundingClientRect(),lbImg.getBoundingClientRect());
    lb.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease-in',fill:'forwards'});
    lbImg.animate([{transform:'none'},{transform:`translate(${d.x}px,${d.y}px) scale(${d.s})`}],{duration:260,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'}).finished.then(()=>{lb.close();lb.getAnimations().forEach(a=>a.cancel());lbImg.getAnimations().forEach(a=>a.cancel());}).catch(()=>lb.close());
  }
  lb.querySelector('.lightbox-close').addEventListener('click',closeViewer);
  lb.addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
  lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lightbox-figure'))closeViewer();});
  // About: the photo changes every 3 seconds with a quick cross-fade (loops through the set).
  document.querySelectorAll('[data-slideshow]').forEach(box=>{
    const slides=[...box.querySelectorAll('img')];let index=0,timer=null;
    const show=next=>{
      slides[index].classList.remove('is-active');slides[index].setAttribute('aria-hidden','true');
      index=next;slides[index].classList.add('is-active');slides[index].removeAttribute('aria-hidden');
    };
    const step=()=>{
      const next=(index+1)%slides.length,img=slides[next];
      img.loading='eager';
      if(img.complete)show(next);else img.addEventListener('load',()=>show(next),{once:true});
    };
    const start=()=>{if(!timer&&!still())timer=setInterval(step,3000);};
    const stop=()=>{clearInterval(timer);timer=null;};
    if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?start():stop())).observe(box);else start();
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  });
  const details={
    'login-preview':['Log in','Sign in to see your bookings, upcoming gatherings and recommendations.'],
    'product-mug':['Akademi mug','An ivory ceramic mug with the Akademi mark.'],
    'product-tshirt':['Akademi T-shirt','An ivory cotton T-shirt with the Akademi mark.'],
    'product-calendar':['The Akademi calendar','An illustrated calendar created for the Akademi.'],
    'product-notebook':['Akademi notebook','A sage notebook for thoughts, sketches and reading notes.'],
    'product-tote':['Akademi tote bag','A natural cotton tote with the Akademi mark.'],
    lamp:['An evening in colour','Paint a fabric lampshade together. 7 November at 15:00, approximately three hours.'],
    reading:['One book, many stories','Read at home and meet to talk about the things a book leaves with us.'],
    training:['A closer look at human experience','An introduction to the traces of trauma.'],
    'book-course':['Reading slowly','Six evenings with short novels, joining the same group throughout.'],
    'clay-course':['Thinking with our hands','A four-meeting ceramics course: getting to know the material, shaping it and making together.'],
    therapy:['About psychotherapy','An informational introduction to psychotherapy. This page does not accept appointments or payments.'],
    recommendation:['The Stranger · Albert Camus','A book recommendation, opening up questions about belonging, alienation and the search for meaning.'],
    film:['Eternal Sunshine of the Spotless Mind · Michel Gondry','A film recommendation: a conversation about memory, relationships and the things we choose to keep.'],
    slow:['Making room for slow reading','Take time to reread a sentence, make a note and talk about what stayed with you, without needing to finish every book.']
  };
  const dialog=document.querySelector('#detail-dialog');document.querySelectorAll('[data-detail]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();const item=details[button.dataset.detail];const tt=window.TGA_t||(s=>s);document.querySelector('#dialog-title').textContent=tt(item[0]);document.querySelector('#dialog-description').textContent=tt(item[1]);dialog.showModal();}));
  dialog.querySelectorAll('.dialog-close,.dialog-done').forEach(b=>b.addEventListener('click',()=>dialog.close()));dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.querySelector('#newsletter-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#form-status').textContent=(window.TGA_t||(s=>s))('Thank you!');e.target.reset();});
})();
