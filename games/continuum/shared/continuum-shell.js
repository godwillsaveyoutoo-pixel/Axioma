(()=>{
'use strict';
const STORE='continuum.audio.enabled';
const q=s=>document.querySelector(s);
const getStore=()=>{try{return localStorage.getItem(STORE)}catch{return null}};
const setStore=v=>{try{localStorage.setItem(STORE,v)}catch{}};
function mount(opts={}){
  if(document.querySelector('.continuum-shell')) return;
  const shell=document.createElement('nav');
  shell.className='continuum-shell';
  shell.setAttribute('aria-label','CONTINUUM spelmenu');
  const kicker=opts.kicker||`CONTINUUM · WORLD 1 · LEVEL ${opts.level||''}`;
  shell.innerHTML=`
    <div class="continuum-shell__panel">
      <div class="continuum-shell__context">
        <a class="cs-home" href="${opts.menuHref||'../../index.html'}" aria-label="Terug naar World 1" title="Terug naar World 1">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.8 12 4l8 6.8v8.7a.5.5 0 0 1-.5.5h-5.2v-5.4H9.7V20H4.5a.5.5 0 0 1-.5-.5z"/></svg>
        </a>
        <div class="cs-copy"><div class="cs-kicker">${kicker}</div><div class="cs-title">${opts.title||''}</div></div>
      </div>
      <div class="continuum-shell__objective">${opts.objective||''}</div>
      <div class="continuum-shell__actions">
        <button class="cs-icon cs-audio" type="button" aria-label="Geluid aan of uit" title="Geluid aan of uit">♪</button>
        <button class="cs-icon cs-reset" type="button" aria-label="Opnieuw" title="Opnieuw">↻</button>
        <button class="cs-icon cs-collapse" type="button" aria-label="Menubalk inklappen" title="Menubalk inklappen">⌃</button>
      </div>
    </div>
    <button class="continuum-shell__reveal" type="button" aria-label="Menubalk openen" title="Menubalk openen">⌄</button>`;
  document.body.appendChild(shell);
  document.documentElement.classList.add('continuum-shell-active');
  (opts.hide||[]).forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.classList.add('continuum-shell-hidden')));
  const reveal=shell.querySelector('.continuum-shell__reveal'), collapseBtn=shell.querySelector('.cs-collapse'), resetBtn=shell.querySelector('.cs-reset'), audioBtn=shell.querySelector('.cs-audio');
  let collapsed=false,timer=0,manualOpen=false;
  const setCollapsed=(v,{manual=false}={})=>{
    collapsed=!!v; shell.classList.toggle('is-collapsed',collapsed); manualOpen=!collapsed&&manual;
    clearTimeout(timer);
    if(!collapsed&&!manualOpen) timer=setTimeout(()=>setCollapsed(true),opts.autoCollapseMs||4300);
    if(!collapsed&&manualOpen) timer=setTimeout(()=>{manualOpen=false;setCollapsed(true)},7200);
  };
  reveal.addEventListener('click',e=>{e.stopPropagation();setCollapsed(false,{manual:true})});
  collapseBtn.addEventListener('click',e=>{e.stopPropagation();setCollapsed(true)});
  resetBtn.addEventListener('click',e=>{e.stopPropagation();const el=opts.resetSelector?q(opts.resetSelector):null;if(el)el.click();setCollapsed(true)});
  const syncAudio=()=>{const on=getStore()!=='0';audioBtn.textContent=on?'♪':'×';audioBtn.setAttribute('aria-pressed',on?'true':'false')};
  syncAudio();
  audioBtn.addEventListener('click',async e=>{
    e.stopPropagation();
    if(opts.audioTarget){const el=q(opts.audioTarget);if(el)el.click();setTimeout(syncAudio,30);return;}
    const eng=window.CONTINUUM_AUDIO;
    if(eng){try{await eng.start?.()}catch{} eng.setEnabled?.(!eng.enabled);syncAudio();}
    else{setStore(getStore()==='0'?'1':'0');syncAudio();}
  });
  document.addEventListener('pointerdown',e=>{
    if(shell.contains(e.target))return;
    if(!collapsed){clearTimeout(timer);timer=setTimeout(()=>setCollapsed(true),120)}
  },{capture:true,passive:true});
  document.addEventListener('mousemove',e=>{if(collapsed&&e.clientY<=5)setCollapsed(false,{manual:true})},{passive:true});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!collapsed)setCollapsed(true)});
  window.ContinuumShell={...(window.ContinuumShell||{}),collapse:()=>setCollapsed(true),open:()=>setCollapsed(false,{manual:true})};
  setCollapsed(false);
}
window.ContinuumShell={mount};
})();
