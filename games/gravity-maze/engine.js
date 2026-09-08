(function(root){
'use strict';
// The benchmark delegates to the literal original implementation.
const Legacy=typeof module!=='undefined'&&module.exports?require('./legacy-engine.js'):root.Gravity;
const V=Legacy.V,overlap=Legacy.overlap;
const bodies=s=>s.masses||[{x:s.mx,y:s.my}];
const clone=s=>s.masses?{...s,masses:s.masses.map(b=>({...b}))}:Legacy.clone(s);
const worldKey=s=>bodies(s).map(b=>`${b.x},${b.y}`).sort().join(';');
const key=s=>s.masses?`${s.x},${s.y}|${worldKey(s)}|${s.g},${s.m},${s.status}`:Legacy.key(s);
function compile(data){
 if(data.id==='mass-6')return{...Legacy.compile(data),legacy:true};
 const grid=data.grid,h=grid.length,w=grid[0].length,walls=new Set(),triggers=[],mouths={},massMarkers={};let start,exit;
 grid.forEach((row,y)=>{if(row.length!==w)throw Error('Ragged grid');[...row].forEach((c,x)=>{
  if(c==='#')walls.add(`${x},${y}`);else if(c==='S'){if(start)throw Error('Duplicate player');start={x,y};}else if(c==='E'){if(exit)throw Error('Duplicate exit');exit={x,y};}
  else if('MN'.includes(c)){if(massMarkers[c])throw Error('Duplicate mass marker');massMarkers[c]={x,y};}
  else if('^v<>'.includes(c))triggers.push({x,y,g:{'^':'U',v:'D','<':'L','>':'R'}[c],id:triggers.length});
  else if('PQ'.includes(c))(mouths[c]??=[]).push({x,y});else if(c!=='.')throw Error('Unknown tile '+c);
 });});
 if(!start||!exit||!massMarkers.M)throw Error('Need player, exit and mass');if(triggers.length>4)throw Error('Four trigger limit');
 if(!!mouths.P!==!!mouths.Q)throw Error('Unpaired portal');
 const portals={};for(const[id,cells]of Object.entries(mouths)){cells.sort((a,b)=>a.y-b.y);if(cells.length!==2||cells[1].y!==cells[0].y+1||cells.some(c=>c.x!==cells[0].x)||![0,w-1].includes(cells[0].x))throw Error('Portal needs two boundary cells');portals[id]={...cells[0],height:2,id};}
 if(portals.P&&portals.P.x===portals.Q.x)throw Error('Portals need opposite edges');
 const solid=(x,y)=>x<0||y<0||x>=w||y>=h||walls.has(`${x},${y}`);
 const clear=r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(solid(x,y))return false;return true;};
 const masses=[massMarkers.M,...(massMarkers.N?[massMarkers.N]:[])],l={...data,w,h,walls,triggers,portals,start,masses,exit,solid,clear,orb:new Map(triggers.map(t=>[`${t.x},${t.y}`,t]))};
 const initial={...start,masses:masses.map(b=>({...b})),g:data.gravity||'D',m:0,status:'rest'};
 if(!valid(l,initial))throw Error('Invalid initial footprints');l.initial=resolve(l,initial).state;
 if(l.initial.status!=='rest'||l.initial.m)throw Error('Start consumes trigger, loops or wins');return l;
}
function rects(l,s){return[{x:s.x,y:s.y,w:1,h:1,id:-1},...s.masses.flatMap((b,i)=>l.removedMasses?.includes(i)?[]:[{...b,w:2,h:2,id:i}])];}
const interacts=(l,a,b)=>!(l.ignoreMassMass&&a.id>=0&&b.id>=0);
function valid(l,s){if(l.legacy)return Legacy.valid(l,s);const rs=rects(l,s);return rs.every(r=>l.clear(r))&&rs.every((r,i)=>rs.slice(i+1).every(q=>!interacts(l,r,q)||!overlap(r,q)));}
// All proposals are formed from ONE snapshot. Conflicting destinations cancel
// simultaneously. Then eliminate movers depending on a now-stationary body.
// This descending fixed point is independent of the enumeration of bodies.
function settleMoves(l,s,portal=false,order=null){
 const rs=rects(l,s),[dx,dy]=V[s.g];
 const proposals=rs.map(r=>portal?Legacy.portalTarget(l,r):{...r,x:r.x+dx,y:r.y+dy});
 let moving=rs.map((r,i)=>!!proposals[i]&&l.clear(proposals[i])&&!(r.id>=0&&(l.freezeMass||l.frozenMasses?.includes(r.id))));
 const conflict=new Set();for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(moving[i]&&moving[j]&&interacts(l,rs[i],rs[j])&&overlap(proposals[i],proposals[j])){conflict.add(i);conflict.add(j);}
 moving=moving.map((v,i)=>v&&!conflict.has(i));
 const indices=order||rs.map((_,i)=>i);
 for(;;){const reject=[];for(const i of indices)if(moving[i])for(const j of indices)if(i!==j&&!moving[j]&&interacts(l,rs[i],rs[j])&&overlap(proposals[i],rs[j])){reject.push(i);break;}
  if(!reject.length)break;for(const i of reject)moving[i]=false;
 }
 return{rs,proposals,moving,next:rs.map((r,i)=>moving[i]?proposals[i]:r)};
}
function commit(s,m){for(let i=0;i<m.rs.length;i++)if(m.moving[i]){const r=m.next[i];if(m.rs[i].id===-1){s.x=r.x;s.y=r.y;}else s.masses[m.rs[i].id]={x:r.x,y:r.y};}}
function resolve(l,input,trace=[],events=[]){
 if(l.legacy)return Legacy.resolve(l,input,trace,events);
 const s=clone(input),seen=new Set();for(let tick=0;tick<6000;tick++){
  const k=key(s);if(seen.has(k)){s.status='loop';events.push({type:'loop'});return{state:s,trace,events};}seen.add(k);
  const t=l.orb.get(`${s.x},${s.y}`);if(t&&!(s.m&(1<<t.id))){const from=s.g;s.m|=1<<t.id;s.g=t.g;events.push({type:'trigger',id:t.id,from,to:s.g});trace.push({...clone(s),event:'trigger'});}
  if(s.x===l.exit.x&&s.y===l.exit.y){s.status='won';events.push({type:'exit'});trace.push({...clone(s),event:'exit'});return{state:s,trace,events};}
  const transfer=settleMoves(l,s,true);if(transfer.moving.some(Boolean)){
   const massPortal=s.masses.map(()=>false);let playerPortal=false;
   transfer.rs.forEach((r,i)=>{if(transfer.moving[i]){events.push({type:'portal',body:r.id===-1?'player':'mass',mass:r.id===-1?undefined:r.id,id:transfer.next[i].portal,g:s.g});if(r.id===-1)playerPortal=true;else massPortal[r.id]=true;}});
   commit(s,transfer);trace.push({...clone(s),event:'portal',playerPortal,massPortal});continue;
  }
  const move=settleMoves(l,s);if(!move.moving.some(Boolean))return{state:s,trace,events};
  commit(s,move);trace.push({...clone(s),event:'fall',playerMoved:move.moving[0],massMoved:move.rs.some((r,i)=>r.id>=0&&move.moving[i])});
 }throw Error('Transition bound exceeded');
}
function step(l,input,sign){
 if(l.legacy)return Legacy.step(l,input,sign);
 if(![-1,1].includes(sign))throw Error('Direction must be -1 or 1');if(input.status!=='rest')return{state:clone(input),trace:[],events:[],changed:false};
 let s=clone(input);const trace=[],events=[],horizontal=s.g==='D'||s.g==='U',dx=horizontal?sign:0,dy=horizontal?0:sign;
 for(let n=0;n<Math.max(l.w,l.h);n++){
  const next={x:s.x+dx,y:s.y+dy,w:1,h:1};if(!l.clear(next)||rects(l,s).slice(1).some(b=>overlap(next,b)))break;
  s.x=next.x;s.y=next.y;trace.push({...clone(s),event:'walk'});const before=trace.length,r=resolve(l,s,trace,events);s=r.state;
  if(events.length||trace.length>before||s.status!=='rest')break;
 }
 return{state:s,trace,events,changed:key(s)!==key(input)};
}
function analyze(l,{limit=80000}={}){
 const states=[l.initial],index=new Map([[key(l.initial),0]]),edges=[],parents=[null];
 for(let i=0;i<states.length;i++){if(states.length>limit)throw Error('Graph too large');edges[i]=[];
  for(const sign of[-1,1]){const r=step(l,states[i],sign);if(!r.changed)continue;const k=key(r.state);if(!index.has(k)){index.set(k,states.length);states.push(r.state);parents.push({from:i,sign});}edges[i].push({to:index.get(k),sign,events:r.events});}}
 const wins=states.flatMap((s,i)=>s.status==='won'?[i]:[]),reverse=states.map(()=>[]);edges.forEach((es,i)=>es.forEach(e=>reverse[e.to].push(i)));
 const canWin=new Set(wins),q=[...wins];for(let n=0;n<q.length;n++)for(const p of reverse[q[n]])if(!canWin.has(p)){canWin.add(p);q.push(p);}
 let at=wins[0],path=[];while(at!=null&&parents[at]){path.unshift(parents[at].sign);at=parents[at].from;}
 let s=l.initial;const replay=[];for(const sign of path){const r=step(l,s,sign);replay.push({before:s,sign,...r});s=r.state;}
 const rest=states.filter(s=>s.status==='rest').length,dead=states.filter((s,i)=>s.status==='rest'&&!canWin.has(i)).length;
 return{states,index,edges,parents,canWin,path,replay,stats:{reachable:states.length,rest,dead,deadRatio:rest?dead/rest:0,winning:wins.length,shortest:wins.length?path.length:null,loops:states.filter(s=>s.status==='loop').length,triggers:l.triggers.length,masses:bodies(l.initial).length,portalPairs:Object.keys(l.portals).length/2}};
}
const api={V,Legacy,bodies,worldKey,clone,key,overlap,compile,rects,valid,settleMoves,resolve,step,analyze};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Gravity=api;
})(typeof globalThis!=='undefined'?globalThis:this);
