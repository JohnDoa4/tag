/* Calendar hero: full-screen first, then it folds to its working height after 3 s so the content below shows. */
(()=>{
  const hero=document.querySelector('.cal-hero');if(!hero)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fold=()=>hero.classList.add('is-compact');
  if(reduce){fold();return;}
  let done=false;
  const once=()=>{if(!done){done=true;fold();}};
  // the fold starts when the lead text has finished appearing (no fixed 3 s wait); the timer is only a safety net
  const lede=hero.querySelector('h1');
  if(lede)lede.addEventListener('animationend',()=>setTimeout(once,150),{once:true});
  setTimeout(once,4500);
  // if the visitor scrolls away before the fold, fold at once so the page does not jump later
  addEventListener('scroll',()=>{if(scrollY>40)once();},{passive:true});
})();

/* Filter bar: sit under the header while it is visible, at the top edge while the header is hidden. */
(()=>{
  const header=document.querySelector('.header');if(!header)return;
  const set=()=>document.documentElement.style.setProperty('--stick',header.classList.contains('is-hidden')?'0px':header.offsetHeight+'px');
  new MutationObserver(set).observe(header,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',set);set();
})();

/* Parallax: once the intro is done the picture scrolls a bit slower than the page (15% of the scroll). */
(()=>{
  const hero=document.querySelector('.cal-hero'),bg=hero&&hero.querySelector('.cal-hero-bg');if(!bg)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const RATE=.15;
  const paint=()=>{
    if(!hero.classList.contains('is-compact')){bg.style.transform='';return;}
    const y=Math.max(0,Math.min(scrollY,hero.offsetHeight))*RATE;
    bg.style.transform='translate3d(0,'+y.toFixed(1)+'px,0)';
  };
  const ask=paint; // a transform write per scroll event is cheap and compositor-only
  addEventListener('scroll',ask,{passive:true});addEventListener('resize',ask);
  new MutationObserver(ask).observe(hero,{attributes:true,attributeFilter:['class']});
})();

/* Three arches in "Three small steps": each drifts vertically at its own speed while the section scrolls past.
   The drift is clamped so an arch never slides under the torn paper edges at the top and bottom of the section. */
(()=>{
  const sec=document.querySelector('.cal-steps'),arches=[...document.querySelectorAll('.cal-arch')];
  if(!sec||!arches.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const edge=sec.querySelector('.cal-steps-edge');
  const paint=()=>{
    const r=sec.getBoundingClientRect(),vh=innerHeight;
    if(r.bottom<-200||r.top>vh+200)return;
    const p=(r.top+r.height/2)-vh/2; // px the section centre is below the screen centre
    const eh=(edge?edge.getBoundingClientRect().height:0)+8;
    arches.forEach(a=>{
      const cur=parseFloat(a.style.getPropertyValue('--py'))||0;
      const ar=a.getBoundingClientRect();
      const top=ar.top-cur-r.top,bottom=r.bottom-(ar.bottom-cur); // arch position without its own drift
      let y=p*parseFloat(a.dataset.speed||0);
      y=Math.max(eh-top,Math.min(y,bottom-eh));
      a.style.setProperty('--py',y.toFixed(1)+'px');
    });
  };
  addEventListener('scroll',paint,{passive:true});addEventListener('resize',paint);paint();
})();

/* List / Month switch (and month -> month): whatever becomes visible fades in with a small lift. */
(()=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const targets=[...document.querySelectorAll('#cal-list,#cal-month,#cal-month .mgrid')];
  if(!targets.length)return;
  const mo=new MutationObserver(list=>list.forEach(m=>{
    const el=m.target;
    if(m.oldValue!==null&&!el.hidden){ // hidden attribute was removed: it just became visible
      el.classList.remove('view-in');void el.offsetWidth;el.classList.add('view-in');
      el.addEventListener('animationend',()=>el.classList.remove('view-in'),{once:true});
    }
  }));
  targets.forEach(t=>mo.observe(t,{attributes:true,attributeFilter:['hidden'],attributeOldValue:true}));
})();
