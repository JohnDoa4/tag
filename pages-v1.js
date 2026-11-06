(()=>{
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const store={get(k,d){try{const v=sessionStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

  // Header: same behaviour as the home page (menu button, More, hide on scroll down).
  const toggle=$('.menu-button'),nav=$('#navigation'),more=$('.header-more'),header=$('.header');
  if(toggle&&nav){
    toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(more)more.open=false;nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}});
    document.addEventListener('click',e=>{if(more&&!more.contains(e.target))more.open=false;});
    let last=scrollY;
    const hold=()=>nav.classList.contains('open')||(more&&more.open)||!!header.querySelector(':focus-visible');
    addEventListener('scroll',()=>{const y=Math.max(0,scrollY),dy=y-last;if(y<=header.offsetHeight||hold()){header.classList.remove('is-hidden');last=y;return;}if(Math.abs(dy)<5)return;header.classList.toggle('is-hidden',dy>0);last=y;},{passive:true});
    header.addEventListener('focusin',()=>header.classList.remove('is-hidden'));
  }

  // Reveal on scroll.
  const rv=$$('.rv');
  if(rv.length){
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -6% 0px',threshold:.06});
      rv.forEach(el=>io.observe(el));
    }else rv.forEach(el=>el.classList.add('in'));
  }

  // Toast + basket.
  const toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');document.body.appendChild(toast);
  let tt;const say=m=>{toast.textContent=m;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('show'),2600);};
  window.TGA={say};
  const pill=$('.basket-pill b');
  const basket=()=>store.get('tga-basket',1);
  const paint=()=>{if(pill)pill.textContent=basket();};paint();
  $$('[data-add]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const n=basket()+ +(b.dataset.add||1);store.set('tga-basket',n);paint();say((b.dataset.name||'Item')+' added to your basket');}));

  // Quantity steppers.
  $$('.qty').forEach(q=>{const out=$('output',q),[minus,plus]=$$('button',q);let v=+out.textContent||1;
    const set=n=>{v=Math.min(20,Math.max(1,n));out.textContent=v;const add=q.closest('form,section,div')&&$('[data-add]',q.closest('.buy')||document);if(add)add.dataset.add=v;q.dispatchEvent(new CustomEvent('qty',{bubbles:true,detail:v}));};
    minus.addEventListener('click',()=>set(v-1));plus.addEventListener('click',()=>set(v+1));});

  // Generic filters: .chips[data-filter-for="#list"] with buttons [data-f="type:workshop"].
  $$('[data-filter-for]').forEach(group=>{
    const list=$(group.dataset.filterFor);if(!list)return;
    const items=$$('[data-type],[data-cat]',list).filter(el=>el.closest(group.dataset.filterFor)===list);
    const note=$(group.dataset.note||'');
    const state={};
    const apply=()=>{
      let n=0;
      items.forEach(el=>{
        const ok=Object.entries(state).every(([k,v])=>v==='all'||(el.dataset[k]||'').split(' ').includes(v));
        el.hidden=!ok;if(ok)n++;
        if(el.closest('li'))el.closest('li').hidden=!ok;
      });
      if(note)note.textContent=n?`Showing ${n} ${n===1?group.dataset.noun||'item':(group.dataset.nouns||'items')}`:'Nothing here for these filters yet. Try another one.';
      $$('.mgrid .ev').forEach(ev=>{const ok=['type','price'].every(k=>!state[k]||state[k]==='all'||ev.dataset[k]===state[k]);ev.classList.toggle('is-dim',!ok);});
    };
    group.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;
      $$(`button[data-k="${b.dataset.k}"]`,group).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
      state[b.dataset.k]=b.dataset.v;apply();});
    group.addEventListener('change',e=>{const s=e.target.closest('select[data-k]');if(!s)return;state[s.dataset.k]=s.value;apply();});
    group.querySelectorAll('select[data-k]').forEach(s=>state[s.dataset.k]=s.value);
    group.querySelectorAll('button[data-k][aria-pressed=true]').forEach(b=>state[b.dataset.k]=b.dataset.v);
    apply();
  });

  // Calendar: list / month and month switch.
  const views=$('[data-views]');
  if(views){
    const listV=$('#cal-list'),monthV=$('#cal-month');
    $$('button',views).forEach(b=>b.addEventListener('click',()=>{
      $$('button',views).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
      const m=b.dataset.view==='month';listV.hidden=m;monthV.hidden=!m;
    }));
    const grids=$$('.mgrid'),title=$('#month-title');let mi=0;
    const show=i=>{mi=(i+grids.length)%grids.length;grids.forEach((g,k)=>g.hidden=k!==mi);title.textContent=grids[mi].dataset.title;};
    $('#month-prev')?.addEventListener('click',()=>show(mi-1));$('#month-next')?.addEventListener('click',()=>show(mi+1));
    if(grids.length)show(0);
  }

  // Tabs (auth, account): hash driven.
  $$('[data-tabs]').forEach(set=>{
    const tabs=$$('[role=tab]',set),panels=tabs.map(t=>$('#'+t.getAttribute('aria-controls')));
    const open=id=>{tabs.forEach((t,i)=>{const on=t.getAttribute('aria-controls')===id;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;panels[i].hidden=!on;});};
    tabs.forEach(t=>t.addEventListener('click',()=>{open(t.getAttribute('aria-controls'));history.replaceState(null,'','#'+t.getAttribute('aria-controls'));}));
    set.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const vis=tabs.filter(t=>!t.hidden);const i=vis.indexOf(document.activeElement);if(i<0)return;const n=vis[(i+(e.key==='ArrowRight'?1:-1)+vis.length)%vis.length];n.focus();n.click();});
    const h=location.hash.slice(1);open(panels.some(p=>p.id===h)?h:panels[0].id);
    addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(panels.some(p=>p.id===h))open(h);});
  });
  $$('[data-go]').forEach(a=>a.addEventListener('click',e=>{const id=a.dataset.go;const t=$(`[role=tab][aria-controls="${id}"]`);if(t){e.preventDefault();t.click();scrollTo({top:0,behavior:reduce.matches?'auto':'smooth'});}}));

  // Password show/hide.
  $$('.pw button').forEach(b=>b.addEventListener('click',()=>{const i=b.parentElement.querySelector('input');const s=i.type==='password';i.type=s?'text':'password';b.textContent=s?'Hide':'Show';b.setAttribute('aria-pressed',String(s));}));

  // Demo forms: no backend, so show a status line.
  $$('form[data-demo]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();if(f.dataset.next){location.href=f.dataset.next;return;}const s=$('.form-status',f);if(s)s.textContent=f.dataset.demo;else say(f.dataset.demo);f.reset?.();}));

  // Product gallery.
  const gal=$('.gallery');
  if(gal){const main=$('.frame img',gal);$$('.gallery-thumbs button',gal).forEach(b=>b.addEventListener('click',()=>{$$('.gallery-thumbs button',gal).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));main.style.opacity=0;setTimeout(()=>{main.src=b.dataset.src;main.alt=b.dataset.alt||'';main.style.opacity=1;},reduce.matches?0:180);}));}
  $$('[data-swatch]').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',g).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const l=$(g.dataset.swatch);if(l)l.textContent=b.dataset.name;}));

  // Legal table of contents: highlight the section in view.
  const toc=$$('.toc a');
  if(toc.length&&'IntersectionObserver' in window){
    const map=new Map(toc.map(a=>[a.getAttribute('href').slice(1),a]));
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){toc.forEach(a=>a.classList.remove('is-active'));map.get(e.target.id)?.classList.add('is-active');}}),{rootMargin:'-20% 0px -70% 0px'});
    map.forEach((a,id)=>{const s=document.getElementById(id);if(s)io.observe(s);});
  }
})();
