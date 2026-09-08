/* Cellquation v0.7.9e — overlay interaction hardening. */
(function(){
  'use strict';
  const doc=document;

  function visible(el){return !!el && !el.hidden && getComputedStyle(el).display!=='none' && el.getAttribute('aria-hidden')!=='true'}
  function focusables(root){
    return [...root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter(el=>!el.hidden && el.getAttribute('aria-hidden')!=='true' && getComputedStyle(el).display!=='none');
  }
  function closeOverlay(overlay){
    if(!overlay)return;
    if(overlay.id==='pauseOverlay'){
      const resume=doc.getElementById('resumeOverlay');
      if(resume){resume.click();return}
      doc.getElementById('pause')?.click();
      return;
    }
    if(overlay.id==='settingsOverlay'){
      const done=doc.getElementById('settingsDone');
      if(done){done.click();return}
    }
  }
  function ensureClose(card){
    if(!card||card.querySelector('.cq-overlay-close'))return;
    const button=doc.createElement('button');
    button.type='button';button.className='cq-overlay-close';button.setAttribute('aria-label','Close settings');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>'; 
    button.addEventListener('click',()=>closeOverlay(card.closest('.pause-overlay,.cq-menu-settings-overlay')));
    card.prepend(button);
  }
  function enhanceSettings(){
    doc.querySelectorAll('.pause-card[data-cq-unified-settings="1"]').forEach(card=>{
      card.dataset.cqOverlaySystem='v079e';ensureClose(card);
      const tabs=[...card.querySelectorAll('[data-cq-settings-tab]')];
      tabs.forEach((tab,index)=>{
        if(tab.dataset.cq79eKeys==='1')return;tab.dataset.cq79eKeys='1';
        tab.addEventListener('keydown',e=>{
          let next=null;
          if(e.key==='ArrowRight')next=tabs[(index+1)%tabs.length];
          if(e.key==='ArrowLeft')next=tabs[(index-1+tabs.length)%tabs.length];
          if(e.key==='Home')next=tabs[0];
          if(e.key==='End')next=tabs[tabs.length-1];
          if(!next)return;e.preventDefault();next.focus();next.click();
        });
      });
    });
  }
  function syncOpenFocus(){
    for(const overlay of [doc.getElementById('settingsOverlay'),doc.getElementById('pauseOverlay')]){
      if(!overlay)continue;
      if(visible(overlay)){
        if(overlay.dataset.cq79eOpenFocus==='1')continue;
        overlay.dataset.cq79eOpenFocus='1';
        requestAnimationFrame(()=>overlay.querySelector('[data-cq-settings-tab].is-active,[data-cq-settings-tab]')?.focus());
      }else delete overlay.dataset.cq79eOpenFocus;
    }
  }
  function currentBlockingOverlay(){
    const menu=doc.getElementById('settingsOverlay');if(visible(menu))return menu;
    const pause=doc.getElementById('pauseOverlay');if(visible(pause))return pause;
    const result=doc.getElementById('resultBackdrop');if(result?.classList.contains('show')&&result.getAttribute('aria-hidden')!=='true')return result;
    const failure=doc.getElementById('cqDataLoadFailure');if(failure)return failure;
    return null;
  }
  function trapTab(e,overlay){
    if(e.key!=='Tab'||!overlay)return;
    const items=focusables(overlay);if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus()}
  }
  function handleKey(e){
    const overlay=currentBlockingOverlay();if(!overlay)return;
    trapTab(e,overlay);
    if(e.key==='Escape'&&(overlay.id==='pauseOverlay'||overlay.id==='settingsOverlay')){
      e.preventDefault();e.stopPropagation();closeOverlay(overlay);
    }
  }
  function syncColour(){
    const shell=doc.querySelector('.cq-shell[data-colour]');
    let colour=shell?.dataset.colour||doc.body.dataset.colour;
    if(doc.body.dataset.screen==='tutorial'&&new URLSearchParams(location.search).get('mode')?.startsWith('3'))colour='three';
    if(colour&&doc.body.dataset.colour!==colour)doc.body.dataset.colour=colour;
  }
  function observe(){
    const mo=new MutationObserver(()=>{enhanceSettings();syncColour();syncOpenFocus()});
    mo.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-cq-unified-settings','data-colour','hidden','aria-hidden']});
  }
  function init(){
    doc.documentElement.dataset.cqOverlaySystem='v079e';
    doc.body?.setAttribute('data-overlay-ui','v079e');
    syncColour();enhanceSettings();syncOpenFocus();observe();doc.addEventListener('keydown',handleKey,true);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
