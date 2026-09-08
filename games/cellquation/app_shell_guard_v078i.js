/* Cellquation v0.7.8i — redirect direct child-page visits into the validated shell. */
(()=>{
  'use strict';
  if(window.top!==window.self)return;
  const file=(location.pathname.split('/').pop()||'home.html');
  if(file==='index.html'||file==='')return;
  const shell=new URL('index.html',location.href);shell.search='';
  shell.searchParams.set('screen',file);
  const q=new URLSearchParams(location.search);q.forEach((v,k)=>{if(k!=='screen')shell.searchParams.append(k,v)});
  shell.hash=location.hash;location.replace(shell.href);
})();
