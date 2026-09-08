(function(root){
'use strict';
function create({storage,signature,now=()=>Date.now(),acceptHistorical=()=>false}){
 const key='gravity-human-telemetry-v2';let archive={schemaVersion:2,signature,createdAt:new Date(now()).toISOString(),runs:[]},current=null,since=null,busyAt=null,available=true;
 try{const old=JSON.parse(storage.getItem(key));if(old?.schemaVersion===2&&Array.isArray(old.runs)){
   if(old.signature===signature)archive=old;
   else {let compatible=false;try{const a=JSON.parse(old.signature),b=JSON.parse(signature);compatible=Array.isArray(a)&&a.length>0&&Array.isArray(b)&&a.every(row=>b.some(next=>JSON.stringify(row)===JSON.stringify(next)));}catch{}
    if(compatible)archive={...old,signature,previousSignatures:[...(old.previousSignatures||[]),old.signature]};
    else if(acceptHistorical(old.signature))archive={...old,signature,previousSignatures:[...(old.previousSignatures||[]),old.signature],runs:old.runs.map(r=>({...r,layoutSignature:r.layoutSignature||old.signature}))};
   }
  }}catch{available=false;}
 function sameRoom(prior,level){try{const a=JSON.parse(prior).find(r=>r[0]===level),b=JSON.parse(signature).find(r=>r[0]===level);return !!a&&!!b&&JSON.stringify(a)===JSON.stringify(b);}catch{return false;}}
 function accrue(){if(current&&since!==null){current.activeMs+=Math.max(0,now()-since);since=now();}}
 function busy(value){accrue();if(!current||current.completedAt)return;if(busyAt!==null){current.animationMs+=Math.max(0,current.activeMs-busyAt);busyAt=null;}if(value)busyAt=current.activeMs;}
 function animationTotal(){return current.animationMs+(busyAt===null?0:Math.max(0,current.activeMs-busyAt));}
 function save(){accrue();if(current&&busyAt!==null){current.animationMs+=Math.max(0,current.activeMs-busyAt);busyAt=current.activeMs;}try{storage.setItem(key,JSON.stringify(archive));}catch{available=false;}}
 function visit(state){current.visitedStates[state]=(current.visitedStates[state]||0)+1;current.uniqueStates=Object.keys(current.visitedStates).length;current.visits++;current.repeatedStates=current.visits-current.uniqueStates;current.lastState=state;}
 function enter(level,state,mode){pause();busy(false);current=[...archive.runs].reverse().find(r=>r.level===level&&!r.completedAt&&r.mode===mode&&(!r.layoutSignature||r.layoutSignature===signature||sameRoom(r.layoutSignature,level)))||null;
  if(!current){current={id:`${level}-${now()}-${archive.runs.length}`,level,mode,layoutSignature:signature,startedAt:new Date(now()).toISOString(),activeMs:0,animationMs:0,lastInputActiveMs:0,lastInputAnimationMs:0,timeToSolutionMs:null,moves:0,blockedInputs:0,undos:0,resets:0,visitedStates:{},uniqueStates:0,visits:0,repeatedStates:0,errorBranches:[],uniqueErrorBranches:0,completedAt:null,hintUsed:false,events:[],inputIntervals:[]};archive.runs.push(current);}
  if(current.lastState!==state)visit(state);since=now();save();
 }
 function event(type,{before,after,sign,changed=true,errorBranch=false}={}){if(!current||current.completedAt)return;accrue();
  if(['move','undo','reset','hint'].includes(type)){const elapsed=Math.max(0,current.activeMs-current.lastInputActiveMs),animationMs=Math.max(0,animationTotal()-current.lastInputAnimationMs);current.inputIntervals.push({endingWith:type,at:new Date(now()).toISOString(),fromActiveMs:current.lastInputActiveMs,toActiveMs:current.activeMs,noInputMs:elapsed,animationMs,availableMs:Math.max(0,elapsed-animationMs)});current.lastInputActiveMs=current.activeMs;current.lastInputAnimationMs=animationTotal();}
  if(type==='move'){if(changed)current.moves++;else current.blockedInputs++;}if(type==='undo')current.undos++;if(type==='reset')current.resets++;if(type==='hint')current.hintUsed=true;
  if(after&&changed)visit(after);if(errorBranch){const id=`${before}|${sign}|${after}`;if(!current.errorBranches.includes(id))current.errorBranches.push(id);current.uniqueErrorBranches=current.errorBranches.length;}
  current.events.push({type,at:new Date(now()).toISOString(),activeMs:current.activeMs,before,after,sign,changed,errorBranch});save();
 }
 function complete(){if(!current||current.completedAt)return;busy(false);accrue();current.completedAt=new Date(now()).toISOString();current.timeToSolutionMs=current.activeMs;current.events.push({type:'complete',at:current.completedAt,activeMs:current.activeMs});since=null;save();}
 function pause(){accrue();busy(false);since=null;save();}
 function resume(){if(current&&!current.completedAt&&since===null)since=now();}
 function exportData(){save();const out=JSON.parse(JSON.stringify({...archive,exportedAt:new Date(now()).toISOString(),localStorageAvailable:available,definitions:{activeMs:'Focused visible play, excluding menus/background/closed browser; includes animation.',availableMs:'Active input-free interval minus the time controls were locked by animation. No inference about thinking.',repeatedStates:'Visits minus distinct full states; reload into the same state is not another visit.',moves:'Cumulative committed state changes; undo does not subtract.',uniqueErrorBranches:'Distinct solvable-to-unsolvable source/input/destination triples.',completedAt:'Winning model transition commit time, before the last visual playback.',hintUsed:'Explicit hint or preview requested in assisted mode.'}}));
  if(current&&!current.completedAt){const r=out.runs.find(r=>r.id===current.id);r.animationMs=animationTotal();r.openInputInterval={noInputMs:current.activeMs-current.lastInputActiveMs,availableMs:Math.max(0,current.activeMs-current.lastInputActiveMs-(animationTotal()-current.lastInputAnimationMs))};}return out;
 }
 return{enter,event,complete,pause,resume,busy,save,exportData};
}
const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PlaytestTelemetry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
