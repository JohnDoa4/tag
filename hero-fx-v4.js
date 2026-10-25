/*
  Hero effects for home-v4.html: drifting, falling leaves on two canvases
  (one behind the tree, one in front of the seats).
  Everything scales with the width of the scene so it stays proportional on any screen.
  Motion is on by default; add ?motion=system to honour the OS "reduce motion" setting.
*/
(()=>{
  const scene=document.querySelector('.scene');
  const back=document.querySelector('.fx-back'),front=document.querySelector('.fx-front');
  if(!scene||!back||!front)return;
  const forced=!/[?&]motion=system/.test(location.search);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const still=()=>reduce.matches&&!forced;
  const mark=()=>document.documentElement.classList.toggle('motion-still',still());
  mark();

  const rand=(a,b)=>a+Math.random()*(b-a);
  const SPEED=1.1;      // flight speed multiplier
  const BAND=2/3;       // leaves live only in the top two thirds of the tree height
  const LEAVES=[[112,162,64],[148,190,76],[92,144,72],[178,206,102],[126,170,88]];

  function makeLayer(canvas,isFront){
    const ctx=canvas.getContext('2d');
    const layer={canvas,ctx,w:0,h:0,s:1,items:[],isFront};
    const count=isFront?{leaf:7}:{leaf:15};
    layer.spawn=(it,anywhere)=>{
      it.x=anywhere?rand(0,layer.w):rand(-.08,-.01)*layer.w;
      it.y=rand(0,1)*layer.h*BAND;
    };
    for(let i=0;i<count.leaf;i++){
      const it={kind:'leaf',color:LEAVES[i%LEAVES.length],
        r:rand(8,13)*0.75*(isFront?1.35:1),vx:rand(9,22),vy:rand(9,20),phase:rand(0,6.28),sway:rand(12,28),
        rot:rand(0,6.28),spin:rand(-.9,.9),flip:rand(.8,1.6),alpha:rand(.55,.9)};
      layer.items.push(it);
    }
    return layer;
  }
  const layers=[makeLayer(back,false),makeLayer(front,true)];

  function resize(){
    const dpr=Math.min(2,window.devicePixelRatio||1);
    layers.forEach(l=>{
      const r=l.canvas.getBoundingClientRect();
      if(!r.width||!r.height)return;
      l.w=r.width;l.h=r.height;l.s=Math.max(.5,l.w/1440);
      l.canvas.width=Math.round(l.w*dpr);l.canvas.height=Math.round(l.h*dpr);
      l.ctx.setTransform(dpr,0,0,dpr,0,0);
      if(!l.ready){l.items.forEach(it=>l.spawn(it,true));l.ready=true;}
    });
  }

  function drawLeaf(ctx,it,t,s,fade){
    const len=it.r*s*1.5,wid=len*.5*Math.abs(Math.cos(t*it.flip+it.phase))+len*.08;
    ctx.save();
    ctx.translate(it.x,it.y);ctx.rotate(it.rot);
    ctx.globalAlpha=it.alpha*fade;
    ctx.fillStyle=`rgb(${it.color})`;
    ctx.beginPath();
    ctx.moveTo(-len,0);
    ctx.quadraticCurveTo(0,-wid,len,0);
    ctx.quadraticCurveTo(0,wid,-len,0);
    ctx.fill();
    ctx.strokeStyle='rgba(44,84,36,.45)';ctx.lineWidth=Math.max(.6,s*.7);
    ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(len,0);ctx.stroke();
    ctx.restore();
  }

  let last=0,raf=0,running=false;
  function frame(now){
    raf=0;
    if(!running)return;
    const dt=Math.min(.05,(now-last)/1000||0);last=now;
    const t=now/1000;
    layers.forEach(l=>{
      if(!l.w)return;
      const {ctx,s}=l;
      ctx.clearRect(0,0,l.w,l.h);
      l.items.forEach(it=>{
        it.x+=(it.vx+Math.sin(t*.6+it.phase)*it.sway*.35)*s*dt*SPEED;
        it.y+=(it.vy+Math.cos(t*.5+it.phase)*it.sway*.4)*s*dt*SPEED;
        it.rot+=it.spin*dt;
        const m=30*s,yMax=l.h*BAND;
        if(it.x>l.w+m){it.x=-m;it.y=rand(0,1)*yMax;}
        if(it.y>yMax){it.y=0;it.x=rand(0,l.w);}
        if(it.y<0)it.y=0;
        const edge=Math.max(0,Math.min(1,it.y/(yMax*.14),(yMax-it.y)/(yMax*.14)));
        drawLeaf(ctx,it,t,s,edge);
      });
      ctx.globalAlpha=1;
    });
    raf=requestAnimationFrame(frame);
  }
  function start(){
    if(running||still()||document.hidden)return;
    running=true;last=performance.now();raf=requestAnimationFrame(frame);
  }
  function stop(){running=false;if(raf)cancelAnimationFrame(raf);raf=0;}
  function clearAll(){layers.forEach(l=>l.ctx.clearRect(0,0,l.w,l.h));}

  if('ResizeObserver' in window)new ResizeObserver(resize).observe(scene);
  window.addEventListener('resize',resize);
  resize();
  let visible=true;
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{
    visible=es.some(e=>e.isIntersecting);
    if(visible)start();else stop();
  },{rootMargin:'100px'}).observe(scene);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(visible)start();});
  reduce.addEventListener('change',()=>{mark();if(still()){stop();clearAll();}else if(visible)start();});
  if(!still())start();
})();
