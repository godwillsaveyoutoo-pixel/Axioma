(function(root){
'use strict';
const V={D:[0,1],U:[0,-1],L:[-1,0],R:[1,0]}, clone=s=>({...s});
const key=s=>`${s.x},${s.y},${s.mx},${s.my},${s.g},${s.m},${s.status}`;
function rect(s,mass=false){return mass?{x:s.mx,y:s.my,w:2,h:2}:{x:s.x,y:s.y,w:1,h:1};}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function compile(data){
 const grid=data.grid,h=grid.length,w=grid[0].length,walls=new Set(),triggers=[],mouths={};let start,mass,exit;
 grid.forEach((r,y)=>{if(r.length!==w)throw Error('Ragged grid');[...r].forEach((c,x)=>{
  if(c==='#')walls.add(`${x},${y}`);else if(c==='S'){if(start)throw Error('Duplicate player');start={x,y};}else if(c==='M'){if(mass)throw Error('Duplicate mass');mass={x,y};}else if(c==='E'){if(exit)throw Error('Duplicate exit');exit={x,y};}
  else if('^v<>'.includes(c))triggers.push({x,y,g:{'^':'U',v:'D','<':'L','>':'R'}[c],id:triggers.length});
  else if('PQ'.includes(c)){(mouths[c]??=[]).push({x,y});}else if(c!=='.')throw Error('Unknown tile '+c);
 });});
 if(!start||!mass||!exit)throw Error('Need one player, one mass and exit');if(triggers.length>4)throw Error('Four-trigger limit');
 if(!!mouths.P!==!!mouths.Q)throw Error('Unpaired portal');
 const portals={};for(const[id,cells]of Object.entries(mouths)){cells.sort((a,b)=>a.y-b.y);if(cells.length!==2||cells[1].y!==cells[0].y+1||cells.some(c=>c.x!==cells[0].x)||![0,w-1].includes(cells[0].x))throw Error('Portal needs two consecutive boundary cells');portals[id]={...cells[0],height:2,id};}
 if(portals.P&&portals.P.x===portals.Q.x)throw Error('Portals need opposite edges');
 const solid=(x,y)=>x<0||y<0||x>=w||y>=h||walls.has(`${x},${y}`);
 const clear=r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(solid(x,y))return false;return true;};
 const l={...data,w,h,walls,triggers,portals,start,mass,exit,solid,clear,orb:new Map(triggers.map(t=>[`${t.x},${t.y}`,t]))};
 const initial={...start,mx:mass.x,my:mass.y,g:data.gravity||'D',m:0,status:'rest'};
 if(!clear(rect(initial))||!clear(rect(initial,true))||overlap(rect(initial),rect(initial,true)))throw Error('Invalid initial footprints');
 l.initial=resolve(l,initial).state;if(l.initial.status!=='rest'||l.initial.m)throw Error('Start must settle without consuming arrows or winning');return l;
}
function portalTarget(l,r){
 for(const p of Object.values(l.portals)){
  if(r.y<p.y||r.y+r.h>p.y+2)continue;
  if(p.x===0?r.x!==0:r.x+r.w!==l.w)continue;
  const q=l.portals[p.id==='P'?'Q':'P'];return{...r,x:q.x===0?1:l.w-1-r.w,y:q.y+(r.y-p.y),portal:p.id};
 }return null;
}
function valid(l,s){return l.clear(rect(s))&&l.clear(rect(s,true))&&!overlap(rect(s),rect(s,true));}
// Snapshot movement: both proposals use the same world state. A follower can
// occupy cells vacated by the leader in this tick. If the leader cannot move,
// the follower also stops. Nobody pushes, overlaps or crushes the other.
function settleMoves(l,s,portal=false){
 const p=rect(s),b=rect(s,true),[dx,dy]=V[s.g];
 const pp=portal?portalTarget(l,p):{...p,x:p.x+dx,y:p.y+dy};
 const bb=portal?portalTarget(l,b):{...b,x:b.x+dx,y:b.y+dy};
 let pm=!!pp&&l.clear(pp),bm=!l.ignoreMass&&!l.freezeMass&&!!bb&&l.clear(bb);
 if(l.ignoreMass)return{p:pm?pp:p,b,pm,bm:false};
 if(pm&&bm&&overlap(pp,bb)){pm=false;bm=false;}
 for(let n=0;n<2;n++){if(pm&&overlap(pp,bm?bb:b))pm=false;if(bm&&overlap(bb,pm?pp:p))bm=false;}
 return{p:pm?pp:p,b:bm?bb:b,pm,bm};
}
function resolve(l,input,trace=[],events=[]){
 const s=clone(input),seen=new Set();
 for(let tick=0;tick<5000;tick++){
  const k=key(s);if(seen.has(k)){s.status='loop';events.push({type:'loop'});return{state:s,trace,events};}seen.add(k);
  const t=l.orb.get(`${s.x},${s.y}`);
  if(t&&!(s.m&(1<<t.id))){const from=s.g;s.m|=1<<t.id;s.g=t.g;events.push({type:'trigger',id:t.id,from,to:s.g});trace.push({...s,event:'trigger'});}
  if(s.x===l.exit.x&&s.y===l.exit.y){s.status='won';events.push({type:'exit'});trace.push({...s,event:'exit'});return{state:s,trace,events};}
  const transfer=settleMoves(l,s,true);
  if(transfer.pm||transfer.bm){
   if(transfer.pm)events.push({type:'portal',body:'player',id:transfer.p.portal,g:s.g});if(transfer.bm)events.push({type:'portal',body:'mass',id:transfer.b.portal,g:s.g});
   s.x=transfer.p.x;s.y=transfer.p.y;s.mx=transfer.b.x;s.my=transfer.b.y;trace.push({...s,event:'portal',playerPortal:transfer.pm,massPortal:transfer.bm});continue;
  }
  const move=settleMoves(l,s);
  if(!move.pm&&!move.bm)return{state:s,trace,events};
  s.x=move.p.x;s.y=move.p.y;s.mx=move.b.x;s.my=move.b.y;
  trace.push({...s,event:'fall',massMoved:move.bm,playerMoved:move.pm});
 }
 throw Error('Transition bound exceeded');
}
function step(l,input,sign){
 if(![-1,1].includes(sign))throw Error('Direction must be -1 or 1');
 if(input.status!=='rest')return{state:clone(input),trace:[],events:[],changed:false};
 let s=clone(input);const trace=[],events=[],horizontal=s.g==='D'||s.g==='U',dx=horizontal?sign:0,dy=horizontal?0:sign;
 for(let n=0;n<Math.max(l.w,l.h);n++){
  const next={...rect(s),x:s.x+dx,y:s.y+dy};if(!l.clear(next)||(!l.ignoreMass&&overlap(next,rect(s,true))))break;
  s.x=next.x;s.y=next.y;trace.push({...s,event:'walk'});
  const before=trace.length,r=resolve(l,s,trace,events);s=r.state;
  if(events.length||trace.length>before||s.status!=='rest')break;
 }
 return{state:s,trace,events,changed:key(s)!==key(input)};
}
function analyze(l){
 const states=[l.initial],index=new Map([[key(l.initial),0]]),edges=[],parents=[null];
 for(let i=0;i<states.length;i++){
  if(states.length>18000)throw Error('Graph too large');edges[i]=[];
  for(const sign of[-1,1]){const r=step(l,states[i],sign);if(!r.changed)continue;const k=key(r.state);if(!index.has(k)){index.set(k,states.length);states.push(r.state);parents.push({from:i,sign});}edges[i].push({to:index.get(k),sign,events:r.events});}
 }
 const wins=states.flatMap((s,i)=>s.status==='won'?[i]:[]),reverse=states.map(()=>[]);edges.forEach((es,i)=>es.forEach(e=>reverse[e.to].push(i)));
 const canWin=new Set(wins),q=[...wins];for(let n=0;n<q.length;n++)for(const p of reverse[q[n]])if(!canWin.has(p)){canWin.add(p);q.push(p);}
 let at=wins[0],path=[];while(at!=null&&parents[at]){path.unshift(parents[at].sign);at=parents[at].from;}
 let s=l.initial;const replay=[];for(const sign of path){const r=step(l,s,sign);replay.push({before:s,sign,...r});s=r.state;}
 const groups=new Map();states.forEach((s,i)=>{if(s.status==='rest'){const k=`${s.x},${s.y},${s.g},${s.m}`;(groups.get(k)||groups.set(k,[]).get(k)).push(i);}});
 const visibleWitnesses=[];for(const ids of groups.values()){const good=ids.find(i=>canWin.has(i)),bad=ids.find(i=>!canWin.has(i));if(good!=null&&bad!=null)visibleWitnesses.push({winning:states[good],losing:states[bad]});}
 const rest=states.filter(s=>s.status==='rest').length,dead=states.filter((s,i)=>s.status==='rest'&&!canWin.has(i)).length;
 return{states,index,edges,parents,canWin,path,replay,visibleWitnesses,stats:{reachable:states.length,rest,dead,deadRatio:rest?dead/rest:0,winning:wins.length,shortest:wins.length?path.length:null,loops:states.filter(s=>s.status==='loop').length,triggers:l.triggers.length,masses:1,portalPairs:Object.keys(l.portals).length/2,visibleWitnesses:visibleWitnesses.length}};
}
const api={V,clone,key,rect,overlap,compile,valid,portalTarget,settleMoves,resolve,step,analyze};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Gravity=api;
})(typeof globalThis!=='undefined'?globalThis:this);
