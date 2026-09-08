/* Cellquation v0.7.8i — canonical gameplay resume state. */
const KEY='cellquation.menu.resume.v1';
function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}}
function write(all){
  try{
    if(all&&Object.keys(all).length)localStorage.setItem(KEY,JSON.stringify(all));
    else localStorage.removeItem(KEY);
  }catch(_){ }
}
function text(v){return v?.en||v?.nl||String(v||'')}
export function saveGameplayResume({colour,campaign,campaignLabel,level,index}){
  if(!level||!colour||!campaign||!Number.isInteger(index)||index<0)return;
  const all=read();
  all[colour]={campaign,campaignLabel,level:index+1,world:(Number(level.world)||0)+1,local:(Number(level.local)||0)+1,title:text(level.title),levelId:String(level.id||''),time:Date.now(),source:'gameplay'};
  write(all);
}
export function clearGameplayResume({colour,campaign,levelNumber}={}){
  if(!colour)return;
  const all=read(),current=all[colour];if(!current)return;
  if(campaign&&current.campaign!==campaign)return;
  if(levelNumber&&Number(current.level)!==Number(levelNumber))return;
  delete all[colour];write(all);
}
