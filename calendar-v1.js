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
  const edge=sec.querySelector('.cal-steps-edge'),narrow=matchMedia('(max-width:900px)');
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
      if(narrow.matches){ // single column: the pictures sit under the text, so keep them close to their own frame (20px of play)
        const wr=a.parentElement.getBoundingClientRect(),aTop=ar.top-cur,aBottom=ar.bottom-cur;
        y=Math.max(wr.top-20-aTop,Math.min(y*.5,wr.bottom+20-aBottom));
      }
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

/* Mobile filters window: radio options mirror the (hidden) selects, so the list and month filters stay in one place. */
(()=>{
  const panel=document.getElementById('cal-filters'),open=document.querySelector('.filters-open'),tb=document.querySelector('.toolbar');
  if(!panel||!open||!tb)return;
  const T=s=>window.TGA_t?window.TGA_t(s):s;
  const sels=[...tb.querySelectorAll('select[data-k]')],radios=[...panel.querySelectorAll('input[type=radio]')];
  const label=()=>{
    const n=sels.filter(s=>s.value!=='all').length;
    open.querySelector('.fl-text').textContent=T('Filters')+(n?' ('+n+')':'');
    open.classList.toggle('has-active',n>0);
  };
  const sync=()=>{radios.forEach(r=>{const s=sels.find(x=>x.dataset.k===r.dataset.k);r.checked=!!s&&s.value===r.value;});label();};
  const setSel=(s,v)=>{s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));};
  radios.forEach(r=>r.addEventListener('change',()=>{const s=sels.find(x=>x.dataset.k===r.dataset.k);if(s)setSel(s,r.value);label();}));
  panel.querySelector('.fp-clear').addEventListener('click',()=>{sels.forEach(s=>setSel(s,'all'));sync();});
  const show=()=>{sync();panel.hidden=false;document.documentElement.classList.add('fp-lock');panel.querySelector('.fp-back').focus();};
  const hide=()=>{if(panel.hidden)return;panel.hidden=true;document.documentElement.classList.remove('fp-lock');open.focus({preventScroll:true});};
  open.addEventListener('click',show);
  panel.querySelector('.fp-back').addEventListener('click',hide);
  panel.querySelector('.fp-apply').addEventListener('click',hide);
  addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
  matchMedia('(min-width:701px)').addEventListener('change',e=>{if(e.matches){panel.hidden=true;document.documentElement.classList.remove('fp-lock');}});
  document.addEventListener('tga:lang',label);
  label();
})();

/* Mobile month view: tap a day with events -> bottom sheet with that day's events; tapping one opens its page. */
(()=>{
  const month=document.getElementById('cal-month');if(!month)return;
  const T=s=>window.TGA_t?window.TGA_t(s):s;
  const narrow=matchMedia('(max-width:700px)');
  const LABEL={reading:'Reading group',workshop:'Workshop',training:'Training',course:'Course'};
  const cells=()=>[...month.querySelectorAll('.mgrid>div:not(.dow):not(.off)')].filter(c=>c.querySelector('.ev'));
  const mark=()=>cells().forEach(c=>{
    c.classList.add('has-ev');
    if(narrow.matches){c.setAttribute('role','button');c.tabIndex=0;}else{c.removeAttribute('role');c.removeAttribute('tabindex');}
  });
  narrow.addEventListener('change',mark);mark();

  let sheet=null,last=null;
  const unlock=()=>document.documentElement.classList.remove('fp-lock');
  const close=()=>{if(!sheet||sheet.hidden)return;sheet.hidden=true;unlock();if(last)last.focus({preventScroll:true});};
  const build=()=>{
    sheet=document.createElement('div');sheet.className='dsheet';sheet.hidden=true;
    sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','ds-title');
    sheet.innerHTML='<div class="dsheet-back"></div><div class="dsheet-panel"><span class="dsheet-grab" aria-hidden="true"></span><div class="dsheet-head"><p class="dsheet-title" id="ds-title"></p><button type="button" class="dsheet-close">×</button></div><ul class="dsheet-list"></ul></div>';
    document.body.appendChild(sheet);
    sheet.querySelector('.dsheet-back').addEventListener('click',close);
    sheet.querySelector('.dsheet-close').addEventListener('click',close);
  };
  const open=cell=>{
    const evs=[...cell.querySelectorAll('.ev:not(.is-dim)')];if(!evs.length)return;
    if(!sheet)build();
    const grid=cell.closest('.mgrid'),col=[...grid.children].indexOf(cell)%7,dow=grid.querySelectorAll('.dow')[col];
    sheet.querySelector('.dsheet-title').textContent=(dow?dow.textContent.trim()+', ':'')+cell.querySelector('.d').textContent.trim()+' '+T(grid.dataset.title);
    sheet.querySelector('.dsheet-close').setAttribute('aria-label',T('Close'));
    const ul=sheet.querySelector('.dsheet-list');ul.textContent='';
    evs.forEach(ev=>{
      const type=ev.dataset.type,time=ev.querySelector('b');
      const name=[...ev.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
      const li=document.createElement('li'),a=document.createElement('a');a.href=ev.getAttribute('href');
      const cat=document.createElement('span');cat.className='dsheet-cat';
      const dot=document.createElement('i');dot.className='dsheet-dot';dot.dataset.type=type;
      cat.append(dot,document.createTextNode(T(LABEL[type]||'')));
      const nm=document.createElement('span');nm.className='dsheet-name';nm.textContent=name;
      const tm=document.createElement('span');tm.className='dsheet-time';tm.textContent=time?time.textContent.trim():'';
      const go=document.createElement('span');go.className='dsheet-go';go.setAttribute('aria-hidden','true');
      const im=document.createElement('img');im.src='assets/arrow.png';im.alt='';im.width=16;im.height=16;go.appendChild(im);
      a.append(cat,nm,tm,go);li.appendChild(a);ul.appendChild(li);
    });
    last=cell;sheet.hidden=false;document.documentElement.classList.add('fp-lock');sheet.querySelector('.dsheet-close').focus();
  };
  month.addEventListener('click',e=>{
    if(!narrow.matches)return;
    const cell=e.target.closest('.mgrid>div.has-ev');if(!cell)return;
    e.preventDefault();open(cell);
  });
  month.addEventListener('keydown',e=>{
    if(!narrow.matches||(e.key!=='Enter'&&e.key!==' '))return;
    const cell=e.target.closest('.mgrid>div.has-ev');if(!cell||e.target!==cell)return;
    e.preventDefault();open(cell);
  });
  addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  narrow.addEventListener('change',e=>{if(!e.matches&&sheet&&!sheet.hidden){sheet.hidden=true;unlock();}});
})();
