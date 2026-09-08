/* AXIOMA Speel — data-driven library shell.
   Nieuwe games horen vooral metadata toe te voegen; de homepage hoeft niet opnieuw ontworpen te worden. */
const TOPICS=[
  {id:'getallen',title:'Getallen & verhoudingen',kicker:'Getallen',mark:'½',desc:'Breuken, verhoudingen, procenten, hoeveelheden en schaal.'},
  {id:'algebra',title:'Algebra',kicker:'Algebra',mark:'x',desc:'Vergelijkingen, formules, onbekenden en geldige herschrijvingen.'},
  {id:'functies',title:'Functies & verbanden',kicker:'Verbanden',mark:'↗',desc:'Regels, tabellen, grafieken, formules en verandering.'},
  {id:'meetkunde',title:'Meetkunde & ruimte',kicker:'Meetkunde',mark:'◇',desc:'Eigenschappen, constructies, aanzichten en 2D ↔ 3D.'},
  {id:'data',title:'Data & statistiek',kicker:'Data',mark:'▥',desc:'Gegevens onderzoeken, samenvatten, voorstellen en beoordelen.'},
  {id:'logica',title:'Logica & redeneren',kicker:'Redeneren',mark:'∴',desc:'Claims, verzamelingen, tegenvoorbeelden en logisch redeneren.'},
  {id:'games',title:'Games & spelwerelden',kicker:'Games',mark:'✦',desc:'Grotere Axioma-spelwerelden om te ontdekken, puzzelen en experimenteren.'}
];

const GAMES=[
  {id:'algebra',title:'Algebrasmederij',domain:'algebra',math:'Vergelijkingen & formules',desc:'Herschrijf vergelijkingen en formules zonder de gelijkwaardigheid te verliezen.',file:'games/algebra-smederij.html',accent:'#e9c56d',total:116,featured:false,
    progress(){for(const k of ['rf21_done','rf20_done','rf19_done']){const v=readJSON(k,null);if(Array.isArray(v))return v.length}return 0}},
  {id:'data',title:'Data Check',domain:'data',math:'Statistiek & grafieken',desc:'Onderzoek gegevens, centrum- en spreidingsmaten en misleidende voorstellingen.',file:'games/data-check.html',accent:'#efbd42',total:22,featured:false,
    progress(){const v=readJSON('evidenceDeskCompletedV06',[]);return Array.isArray(v)?v.filter(Boolean).length:0}},
  {id:'kubus',title:'Kubusbouw',domain:'meetkunde',math:'2D ↔ 3D & aanzichten',desc:'Bouw en lees ruimtelijke structuren vanuit verschillende aanzichten.',file:'games/kubusbouw.html',accent:'#55dfd3',total:22,featured:false,
    progress(){const v=readJSON('axioma.scaleAssembly.v0.5.progress',{});return Array.isArray(v?.completed)?new Set(v.completed).size:0}},
  {id:'signal',title:'Signal Lab',domain:'functies',math:'Functies, regels & representaties',desc:'Ontdek verborgen regels en koppel invoer, uitvoer, tabel, grafiek en formule.',file:'games/signal-lab.html',accent:'#6aa9ff',total:12,featured:false,
    progress(){const v=readJSON('signalLab.v0.4.1.progress',{});return Array.isArray(v?.completed)?new Set(v.completed).size:0}},
  {id:'taart',title:'Taartenwinkel',domain:'getallen',math:'Breuken & delen van een geheel',desc:'Snijd en verdeel taarten in betekenisvolle breukdelen.',file:'games/taartenwinkel.html',accent:'#efca71',total:7,featured:true,
    progress(){const v=readJSON('axioma.taartenwinkel.v05.progress',{});return Array.isArray(v?.completed)?new Set(v.completed).size:0}},
  {id:'verf',title:'Verfwinkel',domain:'getallen',math:'Verhoudingen & mengsels',desc:'Meng hoeveelheden volgens de juiste verhouding en redeneer over het mengsel.',file:'games/verfwinkel.html',accent:'#4b9c55',total:16,featured:false,
    progress(){const v=readJSON('axioma.verfwinkel.v019.progress',{});return Array.isArray(v?.completed)?new Set(v.completed).size:0}},
  {id:'continuum',title:'CONTINUUM · World 1',domain:'games',math:'Puzzels & systeemdenken',desc:'Zes compacte werelden waarin je door observeren, manipuleren en testen ontdekt hoe elk systeem werkt.',file:'games/continuum/index.html',accent:'#8ca6c7',total:6,featured:false,orientation:'landscape'},
  {id:'gravity',title:'Gravity Maze',domain:'games',math:'Zwaartekracht, richting & planning',desc:'Plan bewegingen door negen zwaartekrachtkamers waarin richting en ruimtelijke gevolgen centraal staan.',file:'games/gravity-maze/index.html',accent:'#d29b62',total:9,featured:false,orientation:'landscape',
    progress(){const v=readJSON('gravity-maze-human-v1-blind',{});return Array.isArray(v?.completed)?new Set(v.completed).size:0}},
  {id:'cellquation',title:'Cellquation',domain:'games',domains:['games','getallen'],math:'Verhoudingen in levende cellen',desc:'Bouw doelverhoudingen met levende celacties in Foundations en Living Networks, met twee of drie kleuren.',file:'games/cellquation/index.html',accent:'#65d8c7',total:156,featured:false,orientation:'any',
    progress(){const keys=['cellquation.core.v060.foundations.progress','cellquation.core.v060.network.progress','cellquation.core.v070.threefoundations.progress','cellquation.core.v070.threenetwork.progress'];return keys.reduce((n,k)=>{const v=readJSON(k,{});return n+(v?.best&&typeof v.best==='object'?Object.keys(v.best).length:0)},0)}},
  {id:'insleg',title:'INSLEG',domain:'games',math:'Patronen, routes & weeflogica',desc:'Verander het weefpatroon zodat de shuttle zijn route vindt door Plain Weave, Kagome en Folded Edge.',file:'games/insleg/index.html',accent:'#c58a43',total:60,featured:false,orientation:'landscape',
    progress(){return ['insleg_v140_world1_progress','insleg_v160_world2_kagome_progress','insleg_v170_world3_folded_edge_progress'].reduce((n,k)=>{const v=readJSON(k,[]);return n+(Array.isArray(v)?new Set(v).size:0)},0)}}
];

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const topicOf=id=>TOPICS.find(t=>t.id===id);
const gamesForTopic=id=>GAMES.filter(g=>g.domain===id||g.domains?.includes(id));
function readJSON(key,fallback){try{const raw=localStorage.getItem(key);return raw==null?fallback:JSON.parse(raw)}catch(_){return fallback}}
function readPortal(){return readJSON('axioma.portal.v1',{played:{},lastPlayed:null})||{played:{},lastPlayed:null}}
function savePortal(data){try{localStorage.setItem('axioma.portal.v1',JSON.stringify(data))}catch(_){}}
function progressOf(game){return Math.max(0,Math.min(game.total,Number(game.progress?.()||0)))}
function playedGame(game,portal=readPortal()){return Boolean(portal.played?.[game.id])||progressOf(game)>0}
function progressText(game,n=progressOf(game)){if(n>=game.total)return 'Voltooid';if(n>0)return `${n} / ${game.total} klaar`;return readPortal().played?.[game.id]?'Gestart':'Nog niet gestart'}
function pctOf(game){return game.total?Math.round(progressOf(game)/game.total*100):0}
function gameTheme(game){const t=topicOf(game.domain);return `${t?.title||'Wiskunde'} · ${game.math}`}
function startedGames(){const p=readPortal();return GAMES.filter(g=>playedGame(g,p)).sort((a,b)=>(p.played?.[b.id]||0)-(p.played?.[a.id]||0))}

function previewMarkup(game){
  return `<div class="game-preview" data-preview="${game.id}" data-preview-src="${game.file}?preview=1">
    <iframe title="${game.title} – startscherm" src="about:blank" tabindex="-1" aria-hidden="true"></iframe>
    <div class="preview-loading" aria-hidden="true"><i></i></div>
  </div>`;
}
const PREVIEW_W=960;
let previewObserver=null,previewResizeObserver=null;
function sizePreview(el){const iframe=el.querySelector('iframe');if(!iframe)return;const scale=Math.max(.05,el.clientWidth/PREVIEW_W);iframe.style.transform=`scale(${scale})`}
function mountPreview(el){clearTimeout(el._previewUnload);const iframe=el.querySelector('iframe');if(!iframe)return;if(new URLSearchParams(location.search).has('nopreview')){el.classList.add('loaded');return;}sizePreview(el);if(iframe.dataset.active==='1')return;iframe.dataset.active='1';el.classList.remove('loaded');iframe.onload=()=>{if(iframe.dataset.active==='1'&&iframe.src!=='about:blank')el.classList.add('loaded')};iframe.src=el.dataset.previewSrc}
function unmountPreview(el){clearTimeout(el._previewUnload);el._previewUnload=setTimeout(()=>{const iframe=el.querySelector('iframe');if(!iframe||!document.body.contains(el))return;iframe.dataset.active='0';el.classList.remove('loaded');iframe.src='about:blank'},800)}
function refreshPreviews(){previewObserver?.disconnect();previewResizeObserver?.disconnect();const els=$$('.game-preview');if(!els.length)return;previewResizeObserver=new ResizeObserver(entries=>entries.forEach(e=>sizePreview(e.target)));previewObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?mountPreview(e.target):unmountPreview(e.target)),{rootMargin:'260px 0px 260px 0px',threshold:.01});els.forEach(el=>{sizePreview(el);previewResizeObserver.observe(el);previewObserver.observe(el)})}

function topicRowMarkup(topic){
  const games=gamesForTopic(topic.id);if(!games.length)return '';
  const examples=games.slice(0,3).map(g=>g.title).join(' · ');
  return `<button class="topic-row" type="button" data-topic="${topic.id}">
    <span class="topic-mark" aria-hidden="true">${topic.mark}</span>
    <span class="topic-copy"><small>${topic.kicker}</small><strong>${topic.title}</strong><span>${topic.desc}</span><em>${examples}</em></span>
    <span class="topic-meta"><b>${games.length}</b><span>${games.length===1?'spel':'spellen'}</span></span>
    <span class="row-arrow" aria-hidden="true">›</span>
  </button>`;
}

function renderHero(){
  const game=GAMES.find(g=>g.featured)||GAMES[0];
  $('#featureFrame').innerHTML=previewMarkup(game);
  $('#featureTheme').textContent=gameTheme(game);
  $('#featureTitle').textContent=game.title;
  $('#heroPlay').dataset.game=game.id;
  $('#featureLaunch').dataset.game=game.id;
  $('#featureLaunch').setAttribute('aria-label',`Speel ${game.title}`);
}

function renderContinue(){
  const portal=readPortal();
  const started=startedGames();
  const game=GAMES.find(g=>g.id===portal.lastPlayed&&playedGame(g,portal))||started[0];
  const section=$('#continueSection');
  if(!game){section.hidden=true;return}
  section.hidden=false;
  $('#continuePreview').innerHTML=previewMarkup(game);
  $('#continueTheme').textContent=gameTheme(game);
  $('#continueGame').textContent=game.title;
  $('#continueStatus').textContent=progressText(game);
  $('#continueBar').style.width=`${pctOf(game)}%`;
  $('#continueLaunch').dataset.game=game.id;
}

function bindTopicRows(root=document){$$('[data-topic]',root).forEach(b=>b.addEventListener('click',()=>openTopic(b.dataset.topic)))}
function renderTopicLists(){
  const active=TOPICS.filter(t=>gamesForTopic(t.id).length);
  $('#homeTopicList').innerHTML=active.map(topicRowMarkup).join('');
  $('#topicDirectory').innerHTML=active.map(topicRowMarkup).join('');
  bindTopicRows($('#homeTopicList'));bindTopicRows($('#topicDirectory'));
}

function gameCardMarkup(game){
  const n=progressOf(game),played=playedGame(game),pct=pctOf(game);
  return `<article class="topic-game" style="--accent:${game.accent}">
    <button class="topic-game-launch" type="button" data-game="${game.id}" aria-label="Speel ${game.title}">
      <div class="topic-game-preview">${previewMarkup(game)}</div>
      <div class="topic-game-copy">
        <small>${game.math}</small>
        <h2>${game.title}</h2>
        <p>${game.desc}</p>
        <div class="topic-game-foot"><span>${played?progressText(game,n):'Open spel'}</span>${played?`<i class="mini-progress"><b style="width:${pct}%"></b></i>`:''}</div>
      </div>
      <span class="row-arrow" aria-hidden="true">›</span>
    </button>
  </article>`;
}

let currentTopic=null;
function renderTopic(topicId){
  const topic=topicOf(topicId);if(!topic)return;
  currentTopic=topicId;
  const games=gamesForTopic(topicId);
  $('#topicKicker').textContent=topic.kicker;
  $('#topicTitle').textContent=topic.title;
  $('#topicDescription').textContent=topic.desc;
  $('#topicCount').textContent=`${games.length} ${games.length===1?'spel':'spellen'} in dit thema`;
  $('#topicGames').innerHTML=games.map(gameCardMarkup).join('');
  $$('.topic-game-launch',$('#topicGames')).forEach(b=>b.addEventListener('click',()=>launchGame(b.dataset.game)));
}

function renderMine(){
  const portal=readPortal(),started=startedGames();
  const finished=started.filter(g=>progressOf(g)>=g.total).length;
  $('#mineSummary').textContent=started.length?`${started.length} ${started.length===1?'spel gestart':'spellen gestart'}${finished?` · ${finished} voltooid`:''}.`:'Je voortgang verschijnt hier zodra je een spel start.';
  if(!started.length){
    $('#mineContent').innerHTML=`<div class="empty-state"><strong>Nog geen spel gestart</strong><p>Kies een wiskundethema in Ontdek. Zodra je begint, vind je het spel hier terug.</p><button type="button" data-view-target="discover">Ontdek spellen</button></div>`;
    bindViewTargets($('#mineContent'));return;
  }
  const last=GAMES.find(g=>g.id===portal.lastPlayed&&playedGame(g,portal))||started[0];
  const rest=started.filter(g=>g.id!==last.id);
  $('#mineContent').innerHTML=`
    <section class="mine-resume"><button class="mine-feature" type="button" data-game="${last.id}"><div class="mine-feature-preview">${previewMarkup(last)}</div><div class="mine-feature-copy"><small>Ga verder · ${gameTheme(last)}</small><strong>${last.title}</strong><span>${progressText(last)}</span><i class="wide-progress"><b style="width:${pctOf(last)}%"></b></i></div><span class="row-arrow" aria-hidden="true">›</span></button></section>
    ${rest.length?`<section class="mine-list-section"><div class="section-title-row"><div><span class="section-kicker">Eerder gespeeld</span><h2>Jouw spellen</h2></div></div><div class="mine-list">${rest.map(g=>`<button class="mine-row" type="button" data-game="${g.id}"><span><small>${gameTheme(g)}</small><strong>${g.title}</strong></span><span class="mine-progress-copy">${progressText(g)}<i><b style="width:${pctOf(g)}%"></b></i></span><span class="row-arrow" aria-hidden="true">›</span></button>`).join('')}</div></section>`:''}`;
  $$('[data-game]',$('#mineContent')).forEach(b=>b.addEventListener('click',()=>launchGame(b.dataset.game)));
}

function setActiveNav(view){
  const navView=view==='topic'?'themes':view;
  $$('.nav-link,.mobile-nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===navView));
}
function showView(view,{scroll=true}={}){
  if(!['discover','themes','mine','topic'].includes(view))view='discover';
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.viewPanel===view));
  setActiveNav(view);
  if(view==='discover'){renderHero();renderContinue();renderTopicLists()}
  if(view==='themes')renderTopicLists();
  if(view==='mine')renderMine();
  if(scroll)window.scrollTo({top:0,behavior:'auto'});
  requestAnimationFrame(refreshPreviews);
}
function openTopic(id){renderTopic(id);showView('topic')}
function bindViewTargets(root=document){$$('[data-view-target]',root).forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewTarget)))}

const player=$('#player'),frame=$('#gameFrame'),loading=$('#playerLoading'),exitBtn=$('#playerExit');
let activeGame=null,historyArmed=false;
async function requestImmersive(game){try{if(!document.fullscreenElement&&player.requestFullscreen)await player.requestFullscreen()}catch(_){}if((game?.orientation||'landscape')!=='landscape')return;try{if(screen.orientation?.lock)await screen.orientation.lock('landscape')}catch(_){}}
function markPlayed(game){const p=readPortal();p.played=p.played||{};p.played[game.id]=Date.now();p.lastPlayed=game.id;savePortal(p)}
async function launchGame(id,{fromPop=false}={}){
  const game=GAMES.find(g=>g.id===id);if(!game)return;
  activeGame=game;markPlayed(game);player.dataset.orientation=game.orientation||'landscape';player.hidden=false;loading.classList.remove('done');$('#playerName').textContent=game.title;frame.src=`${game.file}?portal=1`;document.body.classList.add('playing');
  if(!fromPop){history.pushState({axiomaGame:id},'',`#spel=${id}`);historyArmed=true}
  await requestImmersive(game);
}
async function closePlayer({useHistory=true}={}){
  if(player.hidden)return;
  try{if(document.fullscreenElement)await document.exitFullscreen()}catch(_){}try{screen.orientation?.unlock?.()}catch(_){}
  player.hidden=true;frame.src='about:blank';activeGame=null;document.body.classList.remove('playing');loading.classList.remove('done');
  renderContinue();renderMine();requestAnimationFrame(refreshPreviews);
  if(useHistory&&historyArmed){historyArmed=false;history.back()}
}

exitBtn.addEventListener('click',()=>closePlayer());
frame.addEventListener('load',()=>setTimeout(()=>loading.classList.add('done'),220));
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='axioma:game-ready')loading.classList.add('done');if(e.data?.type==='axioma:exit')closePlayer()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!player.hidden){e.preventDefault();closePlayer()}});
window.addEventListener('storage',()=>{renderContinue();renderMine();refreshPreviews()});
window.addEventListener('popstate',e=>{if(!player.hidden){historyArmed=false;closePlayer({useHistory:false});return}if(e.state?.axiomaGame)launchGame(e.state.axiomaGame,{fromPop:true})});

$('#heroPlay').addEventListener('click',()=>launchGame($('#heroPlay').dataset.game));
$('#featureLaunch').addEventListener('click',()=>launchGame($('#featureLaunch').dataset.game));
$('#continueLaunch').addEventListener('click',()=>launchGame($('#continueLaunch').dataset.game));
$('#brandHome').addEventListener('click',()=>showView('discover'));
$('#topicBack').addEventListener('click',()=>showView('themes'));
$$('.nav-link,.mobile-nav-link').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
bindViewTargets();

let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').hidden=false});
$('#installBtn').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();try{await deferredInstall.userChoice}catch(_){}deferredInstall=null;$('#installBtn').hidden=true});
window.addEventListener('appinstalled',()=>{$('#installBtn').hidden=true});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});

renderHero();renderContinue();renderTopicLists();renderMine();showView('discover',{scroll:false});
