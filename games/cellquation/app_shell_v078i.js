/* Cellquation v0.7.8i — persistent app shell with validated navigation state. */
(()=>{
  'use strict';
  const frame=document.getElementById('cqAppFrame');if(!frame)return;
  const allowed=new Set(['home.html','foundations.html','foundation_levels.html','living.html','living_levels.html','play.html','living_play.html','threecolor.html','twocolor.html','threecolor_foundations.html','threecolor_foundation_levels.html','threecolor_living.html','threecolor_living_levels.html','threecolor_play.html','threecolor_living_play.html','tutorial.html']);
  const home='home.html';
  let syncing=false;
  const fileOf=url=>url.pathname.split('/').pop()||home;
  const validScreen=value=>allowed.has(value)?value:home;
  function shellTargetFromLocation(){
    const top=new URL(location.href),raw=top.searchParams.get('screen')||home,screen=validScreen(raw);
    if(raw!==screen){top.searchParams.delete('screen');history.replaceState({screen:home},'',top)}
    const child=new URL(screen,location.href);
    top.searchParams.forEach((v,k)=>{if(k!=='screen')child.searchParams.append(k,v)});
    child.hash=top.hash;
    return child.pathname.split('/').pop()+child.search+child.hash;
  }
  function syncFrameFromTop(){
    const target=shellTargetFromLocation();
    let current='';
    try{const u=frame.contentWindow?.location;if(u&&u.href!=='about:blank')current=fileOf(u)+u.search+u.hash}catch(_){ }
    if(current!==target){syncing=true;frame.src=target}
  }
  function syncTopFromFrame(){
    try{
      const u=frame.contentWindow.location;
      if(u.origin!==location.origin){syncing=true;frame.src=home;return}
      const file=fileOf(u);
      if(!allowed.has(file)){syncing=true;frame.src=home;return}
      const topUrl=new URL(location.href);topUrl.search='';topUrl.hash='';
      if(file!==home)topUrl.searchParams.set('screen',file);
      new URLSearchParams(u.search).forEach((v,k)=>{if(k!=='screen')topUrl.searchParams.append(k,v)});
      topUrl.hash=u.hash;
      history.replaceState({screen:file},'',topUrl);
    }catch(_){
      syncing=true;frame.src=home;
    }
  }
  frame.addEventListener('load',()=>{syncTopFromFrame();syncing=false});
  addEventListener('popstate',()=>{if(!syncing)syncFrameFromTop()});
  syncFrameFromTop();
})();
