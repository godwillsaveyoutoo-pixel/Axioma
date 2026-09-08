const CACHE='axioma-speel-v4-game-worlds';
const CORE=[
  './','./index.html','./assets/app.css','./assets/app.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-180.png','./manifest.webmanifest',
  './games/algebra-smederij.html','./games/data-check.html','./games/kubusbouw.html','./games/signal-lab.html','./games/taartenwinkel.html','./games/verfwinkel.html',
  './games/continuum/index.html','./games/gravity-maze/index.html','./games/cellquation/index.html','./games/insleg/index.html'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('axioma-speel-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):undefined)))});
