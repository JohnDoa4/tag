/*
  Language engine for home-v3.html (reads locales-v3.js).
  English text in the HTML is the source; other languages replace text nodes and the attributes
  alt, aria-label, placeholder and title, plus the page title and description.
  Language is chosen from ?lang=tr, then localStorage 'tga-lang', then English.
  Other scripts call window.TGA_t('English string') for texts they create themselves.
*/
(()=>{
  const LANGS=window.TGA_LANGUAGES||{en:{label:'EN',name:'English',htmlLang:'en'}};
  const DICT=window.TGA_LOCALES||{};
  const ATTRS=['alt','aria-label','placeholder','title'];
  const norm=s=>s.replace(/\s+/g,' ').trim();
  let lang='en';
  const texts=[],attrs=[];
  let metaDesc=null,metaDescEn='',titleEn='';

  function lookup(en){
    if(lang==='en')return en;
    const d=DICT[lang];
    return (d&&d[norm(en)])||en;
  }
  window.TGA_t=lookup;
  window.TGA_lang=()=>lang;

  function collect(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
      const p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)||p.closest('[data-no-i18n]'))return NodeFilter.FILTER_REJECT;
      return n.textContent.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    while(walker.nextNode())texts.push({node:walker.currentNode,en:walker.currentNode.textContent});
    document.body.querySelectorAll('*').forEach(el=>{
      if(el.closest('[data-no-i18n]'))return;
      ATTRS.forEach(a=>{const v=el.getAttribute(a);if(v&&v.trim())attrs.push({el,a,en:v});});
    });
    metaDesc=document.querySelector('meta[name="description"]');
    metaDescEn=metaDesc?metaDesc.content:'';
    titleEn=document.title;
  }

  function translateNode(en){
    if(lang==='en')return en;
    const d=DICT[lang];
    const v=d&&d[norm(en)];
    if(!v)return en;
    const lead=en.match(/^\s*/)[0],trail=en.match(/\s*$/)[0];
    return lead+v+trail;
  }

  function mark(){
    document.querySelectorAll('[data-lang]').forEach(a=>{
      const current=a.dataset.lang===lang;
      if(current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
    });
  }

  function apply(next,persist){
    if(!LANGS[next])next='en';
    lang=next;
    texts.forEach(t=>{const v=translateNode(t.en);if(t.node.textContent!==v)t.node.textContent=v;});
    attrs.forEach(t=>{const v=lang==='en'?t.en:lookup(t.en);if(t.el.getAttribute(t.a)!==v)t.el.setAttribute(t.a,v);});
    document.title=lookup(titleEn);
    if(metaDesc)metaDesc.content=lookup(metaDescEn);
    document.documentElement.lang=LANGS[lang].htmlLang;
    mark();
    if(persist){try{localStorage.setItem('tga-lang',lang);}catch(e){}}
    document.dispatchEvent(new CustomEvent('tga:lang',{detail:{lang}}));
  }
  window.TGA_setLang=l=>apply(l,true);

  function initial(){
    const q=(location.search.match(/[?&]lang=([a-z]{2})/)||[])[1];
    if(q&&LANGS[q])return q;
    try{const s=localStorage.getItem('tga-lang');if(s&&LANGS[s])return s;}catch(e){}
    return 'en';
  }

  function start(){
    collect();
    document.querySelectorAll('[data-lang]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();apply(a.dataset.lang,true);}));
    apply(initial(),false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
