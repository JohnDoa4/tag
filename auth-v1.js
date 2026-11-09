/* Demo accounts: no server. Users live in sessionStorage for the length of the browser session. */
(()=>{
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const S={
    get(k,d){try{const v=sessionStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}},
    set(k,v){try{sessionStorage.setItem(k,JSON.stringify(v));}catch(e){}},
    del(k){try{sessionStorage.removeItem(k);}catch(e){}}
  };
  const say=m=>window.TGA&&window.TGA.say?window.TGA.say(m):0;

  // Demo account for testing the log in form.
  const SEED={'name@example.com':{name:'Name Surname',email:'name@example.com',password:'akademi2026',dob:'1990-05-14',news:true,lang:'English'}};
  const users=()=>Object.assign({},SEED,S.get('tga-users',{}));
  const saveUser=u=>{const all=S.get('tga-users',{});all[u.email]=u;S.set('tga-users',all);};
  const current=()=>{const e=S.get('tga-user',null);return e?users()[e]||null:null;};
  const signIn=u=>{S.set('tga-user',u.email);document.documentElement.classList.add('is-auth');};
  const signOut=()=>{S.del('tga-user');document.documentElement.classList.remove('is-auth');};
  const first=n=>(n||'').trim().split(/\s+/)[0]||'there';

  const user=current();
  if(!user&&document.documentElement.classList.contains('is-auth'))document.documentElement.classList.remove('is-auth');
  // Header: "Log in" becomes "My account" once signed in.
  const headBtn=$('.login-btn');
  if(user&&headBtn){headBtn.textContent='My account';headBtn.setAttribute('href','account.html');}

  // ---------- validation helpers ----------
  const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const boxOf=i=>i.closest('.fld')||i.closest('.check')||i.parentElement;
  function setErr(input,msg){
    const box=boxOf(input);let e=box.querySelector('.fld-error');
    if(!msg){if(e)e.remove();input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');return;}
    if(!e){e=document.createElement('span');e.className='fld-error';e.id='err-'+(input.id||input.name||Math.random().toString(36).slice(2,7));box.appendChild(e);}
    e.textContent=msg;input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',e.id);
  }
  function alertOf(form,msg,kind){
    const a=$('.alert',form);if(!a)return;
    a.classList.toggle('alert--ok',kind==='ok');
    $('p',a).textContent=msg;a.hidden=false;
    a.classList.remove('shake');
    if(kind!=='ok'&&!reduce.matches){void a.offsetWidth;a.classList.add('shake');}
  }
  const hideAlert=form=>{const a=$('.alert',form);if(a)a.hidden=true;};
  const fresh=form=>{hideAlert(form);$$('.fld-error',form).forEach(e=>e.remove());$$('[aria-invalid]',form).forEach(i=>{i.removeAttribute('aria-invalid');i.removeAttribute('aria-describedby');});};
  $$('form[data-auth] input').forEach(i=>i.addEventListener('input',()=>{setErr(i,'');hideAlert(i.closest('form'));}));
  $$('form[data-auth] input[type=checkbox]').forEach(i=>i.addEventListener('change',()=>setErr(i,'')));
  const checkEmail=(input,empty)=>{
    const v=input.value.trim().toLowerCase();
    if(!v){setErr(input,empty||'Please enter your email.');return false;}
    if(!emailOk(v)){setErr(input,'That doesn’t look like an email address. Check it for typos.');return false;}
    return true;
  };
  const focusFirstBad=f=>{const b=$('[aria-invalid=true]',f);if(b)b.focus();return !!b;};

  // ---------- log in ----------
  let fails=0;
  const loginForm=$('form[data-auth=login]');
  if(loginForm){
    if(user)location.replace('account.html');
    loginForm.addEventListener('submit',e=>{
      e.preventDefault();const f=loginForm;fresh(f);
      const okE=checkEmail(f.email),pw=f.password.value;
      if(!pw)setErr(f.password,'Please enter your password.');
      if(!okE||!pw){focusFirstBad(f);return;}
      const u=users()[f.email.value.trim().toLowerCase()];
      if(!u||u.password!==pw){
        fails++;
        alertOf(f,fails>=3?'Still not matching. If you have forgotten your password, you can reset it below.':'That email and password don’t match. Please check them and try again.');
        f.password.value='';f.password.focus();
        return;
      }
      signIn(u);alertOf(f,'Welcome back. Opening your account…','ok');
      setTimeout(()=>{location.href='account.html';},reduce.matches?0:450);
    });
  }

  // ---------- sign up ----------
  const signupForm=$('form[data-auth=signup]');
  if(signupForm){
    signupForm.addEventListener('submit',e=>{
      e.preventDefault();const f=signupForm;fresh(f);
      const name=f.elements.name.value.trim();
      if(!name)setErr(f.elements.name,'Please tell us your name.');
      const okE=checkEmail(f.email);
      if(okE&&users()[f.email.value.trim().toLowerCase()]){setErr(f.email,'An account with this email already exists. Try logging in instead.');}
      if(f.password.value.length<8)setErr(f.password,f.password.value?'Use at least 8 characters.':'Please choose a password.');
      if(!f.consent.checked)setErr(f.consent,'Please accept the Privacy notice to create an account.');
      if(focusFirstBad(f)){alertOf(f,'Please fix the highlighted fields and try again.');return;}
      const u={name,email:f.email.value.trim().toLowerCase(),password:f.password.value,dob:f.dob.value,news:f.news.checked,lang:'English'};
      saveUser(u);signIn(u);
      f.hidden=true;$('#signup-done').hidden=false;$$('[data-fill=email]').forEach(n=>n.textContent=u.email);$$('[data-fill=first]').forEach(n=>n.textContent=first(u.name));
    });
  }

  // ---------- reset password ----------
  const resetForm=$('form[data-auth=reset]');
  if(resetForm){
    resetForm.addEventListener('submit',e=>{
      e.preventDefault();fresh(resetForm);
      if(!checkEmail(resetForm.email)){resetForm.email.focus();return;}
      alertOf(resetForm,'If an account exists for '+resetForm.email.value.trim()+', we have sent a link to reset the password. Please check your inbox.','ok');
      resetForm.email.value='';
    });
  }

  // ---------- account ----------
  const cab=$('#cabinet');
  if(!cab||!user)return;
  const me=user;
  const paintMe=()=>{
    $$('[data-fill=first]').forEach(n=>n.textContent=first(me.name));
    $$('[data-fill=name]').forEach(n=>n.textContent=me.name);
    $$('[data-fill=email]').forEach(n=>n.textContent=me.email);
  };
  paintMe();
  const pf=$('form[data-auth=profile]');
  if(pf){pf.elements.name.value=me.name;pf.email.value=me.email;pf.dob.value=me.dob||'';pf.news.checked=!!me.news;if(pf.lang)pf.lang.value=me.lang||'English';}
  $$('[data-logout]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();signOut();location.href='index.html';}));

  // dialogs
  const closeOnBackdrop=d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
  $$('dialog.mdl').forEach(d=>{closeOnBackdrop(d);$$('[data-close]',d).forEach(b=>b.addEventListener('click',()=>d.close()));});

  // upcoming: cancel a place
  const rows=$$('.up-row');
  let cancelled=S.get('tga-cancelled',[]);
  const refresh=()=>{
    const live=rows.filter(r=>!cancelled.includes(r.dataset.id));
    rows.forEach(r=>{
      const off=cancelled.includes(r.dataset.id);
      r.classList.toggle('is-closed',off);
      const st=$('.status',r);st.textContent=off?'Cancelled':(r.dataset.price==='Free'?'Confirmed':'Paid');st.classList.toggle('status--ok',!off);st.classList.toggle('status--off',off);
      $('.up-actions',r).hidden=off;
    });
    $$('[data-fill=count-up]').forEach(n=>n.textContent=live.length);
    $('#up-empty').hidden=live.length>0;
    const nx=live[0],box=$('#next-up');
    box.hidden=!nx;$('#next-empty').hidden=!!nx;
    if(nx){
      $('#nu-img').src='assets/'+nx.dataset.img;$('#nu-img').alt=nx.dataset.alt;
      $('#nu-type').textContent=nx.dataset.kind+' · '+nx.dataset.price;
      $('#nu-title').textContent=nx.dataset.title;$('#nu-when').textContent=nx.dataset.when;$('#nu-link').href=nx.dataset.href;
    }
  };
  refresh();
  const cdlg=$('#cancel-dialog');let target=null;
  $$('.btn-cancel').forEach(b=>b.addEventListener('click',()=>{
    target=b.closest('.up-row');
    $('#cancel-text').textContent=target.dataset.title+', '+target.dataset.when+'.';
    $('#cancel-policy').textContent=target.dataset.policy;
    cdlg.showModal();
  }));
  $('#cancel-confirm').addEventListener('click',()=>{
    if(!target)return;cancelled=[...cancelled,target.dataset.id];S.set('tga-cancelled',cancelled);
    cdlg.close();refresh();say('Your place is cancelled. We sent a confirmation to your email.');target=null;
  });

  // orders: receipt dialog
  const rdlg=$('#receipt-dialog');
  $$('.btn-receipt').forEach(b=>b.addEventListener('click',()=>{
    $('#receipt-title').textContent='Receipt '+b.dataset.order;
    $('#receipt-lines').innerHTML=b.dataset.lines.split('|').map(l=>{const [t,p]=l.split('::');return `<div class="sum-row"><span>${t}</span><span class="num">${p}</span></div>`;}).join('')+`<div class="sum-row sum-row--total"><span>Total</span><span class="num">${b.dataset.total}</span></div>`;
    $('#receipt-mail').textContent=me.email;
    rdlg.showModal();
  }));

  // profile
  if(pf)pf.addEventListener('submit',e=>{
    e.preventDefault();fresh(pf);
    const name=pf.elements.name.value.trim();
    if(!name)setErr(pf.elements.name,'Please tell us your name.');
    const okE=checkEmail(pf.email);
    const em=pf.email.value.trim().toLowerCase();
    if(okE&&em!==me.email&&users()[em])setErr(pf.email,'Another account already uses this email.');
    if(focusFirstBad(pf))return;
    if(em!==me.email){const all=S.get('tga-users',{});delete all[me.email];S.set('tga-users',all);}
    Object.assign(me,{name,email:em,dob:pf.dob.value,news:pf.news.checked,lang:pf.lang?pf.lang.value:me.lang});
    saveUser(me);S.set('tga-user',me.email);paintMe();say('Your details are saved.');
  });
  const pw=$('form[data-auth=password]');
  if(pw)pw.addEventListener('submit',e=>{
    e.preventDefault();fresh(pw);
    if(!pw.current.value)setErr(pw.current,'Please enter your current password.');
    else if(pw.current.value!==me.password)setErr(pw.current,'That isn’t your current password.');
    if(pw.next.value.length<8)setErr(pw.next,pw.next.value?'Use at least 8 characters.':'Please choose a new password.');
    if(pw.confirm.value!==pw.next.value)setErr(pw.confirm,'The two passwords don’t match.');
    if(focusFirstBad(pw))return;
    me.password=pw.next.value;saveUser(me);pw.reset();say('Your password is updated.');
  });

  // delete account
  const ddlg=$('#delete-dialog');
  $('#btn-delete')?.addEventListener('click',()=>ddlg.showModal());
  $('#delete-confirm')?.addEventListener('click',()=>{
    const all=S.get('tga-users',{});delete all[me.email];S.set('tga-users',all);S.del('tga-cancelled');signOut();location.href='index.html';
  });
})();
