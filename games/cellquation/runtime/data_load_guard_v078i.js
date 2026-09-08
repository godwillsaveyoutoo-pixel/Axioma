/* Cellquation v0.7.8i — release data loading guard. */
export async function fetchJsonRelease(path,{timeoutMs=12000}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(path,{signal:controller.signal,cache:'no-cache'});
    if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
    try{return await response.json()}catch(err){throw new Error(`Invalid JSON in ${path}: ${err?.message||err}`)}
  }finally{clearTimeout(timer)}
}

export function showDataLoadFailure(error,{title='The game data could not be loaded',detail='Check your connection, then reload the data.'}={}){
  console.error(error);
  let overlay=document.getElementById('cqDataLoadFailure');
  if(!overlay){
    overlay=document.createElement('section');
    overlay.id='cqDataLoadFailure';
    overlay.setAttribute('role','alert');
    overlay.setAttribute('aria-live','assertive');
    Object.assign(overlay.style,{
      position:'fixed',inset:'0',zIndex:'2147483646',display:'grid',placeItems:'center',
      padding:'24px',background:'rgba(1,7,11,.96)',color:'#eefcff',fontFamily:'system-ui,-apple-system,Segoe UI,sans-serif'
    });
    const card=document.createElement('div');
    Object.assign(card.style,{width:'min(460px,100%)',textAlign:'center'});
    const eyebrow=document.createElement('div');eyebrow.textContent='CELLQUATION';
    Object.assign(eyebrow.style,{fontSize:'12px',letterSpacing:'.18em',opacity:'.62',marginBottom:'12px'});
    const heading=document.createElement('h1');heading.dataset.role='title';
    Object.assign(heading.style,{fontSize:'clamp(22px,5vw,30px)',lineHeight:'1.12',margin:'0 0 12px'});
    const copy=document.createElement('p');copy.dataset.role='detail';
    Object.assign(copy.style,{fontSize:'15px',lineHeight:'1.5',opacity:'.78',margin:'0 auto 20px',maxWidth:'38ch'});
    const button=document.createElement('button');button.type='button';button.textContent='RELOAD DATA';
    Object.assign(button.style,{minHeight:'48px',padding:'0 22px',border:'1px solid rgba(190,242,255,.38)',borderRadius:'999px',background:'rgba(44,145,170,.18)',color:'inherit',font:'inherit',fontWeight:'700',letterSpacing:'.08em',cursor:'pointer'});
    button.addEventListener('click',async()=>{
      button.disabled=true;button.textContent='RELOADING…';
      try{const registration=await navigator.serviceWorker?.getRegistration?.();await registration?.update?.()}catch(_){ }
      location.reload();
    });
    card.append(eyebrow,heading,copy,button);overlay.append(card);document.body.append(overlay);
  }
  overlay.querySelector('[data-role="title"]').textContent=title;
  overlay.querySelector('[data-role="detail"]').textContent=detail;
  return overlay;
}
