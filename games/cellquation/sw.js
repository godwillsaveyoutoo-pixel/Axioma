/* Cellquation v0.7.9f.2.1 — Background Orientation Assets service worker.
 * Cache-bump policy: RELEASE_VERSION is the single source of truth.
 * Change RELEASE_VERSION for every shipped release that changes runtime assets or campaign data.
 * Never bump CACHE independently from the public release version.
 */
const RELEASE_VERSION='v0.7.9f.2.1';
const CACHE_PREFIX='cellquation-';
const CACHE=`${CACHE_PREFIX}${RELEASE_VERSION}`;
const CORE=[
  './',
  './ambient_audio_host_v078e.js', // N-1 compatibility for stale v0.7.9f shell
  './ambient_audio_host_v079f1.js',
  './ambient_audio_v078e.js',
  './app_shell_guard_v078e.js', // N-1 compatibility for stale child documents
  './app_shell_guard_v078i.js',
  './app_shell_v078i.js',
  './assets/app/icon-192.png',
  './assets/app/icon-512.png',
  './assets/menu/menu_foundations_2c.webp',
  './assets/menu/menu_foundations_3c.webp',
  './assets/menu/menu_living_2c.webp',
  './assets/menu/menu_living_3c.webp',
  './assets/backgrounds/options/abyss_void_portrait.webp',
  './assets/backgrounds/options/abyss_void_landscape.webp',
  './assets/backgrounds/thumbs/abyss_void.jpg',
  './assets/backgrounds/thumbs/bioluminescent_reef.jpg',
  './assets/backgrounds/thumbs/emerald_depths.jpg',
  './assets/backgrounds/thumbs/midnight_trench.jpg',
  './assets/backgrounds/thumbs/quiet_ocean.jpg',
  './assets/ui/hud_goal_blue.png',
  './assets/ui/hud_goal_green.png',
  './assets/ui/hud_goal_violet.png',
  './audio_settings_v077a14.css',
  './canonical/CellKit_Synapse_Animation_2026-08-17T00-32-48-952Z.json',
  './canonical/synapse/animation_keyframes.js',
  './canonical/synapse/math2d.js',
  './canonical/synapse/settings.js',
  './canonical/synapse/transport_choreography.js',
  './canonical/synapse/transport_deformation.js',
  './canonical/synapse/transport_geometry.js',
  './canonical/synapse/transport_visibility.js',
  './cellkit_latest/brood.js',
  './cellkit_latest/cell.js',
  './cellkit_latest/profiles.js',
  './cellkit_latest/renderer.js',
  './cellkit_latest/transition.js',
  './content/LIVING_NETWORKS_VISUAL_CONFIG_V053.json',
  './content/full/LIVING_NETWORKS_LAYOUT_48_V060.json',
  './content/runtime/FOUNDATIONS_30_RUNTIME.json',
  './content/runtime/LIVING_NETWORKS_48_V28_RUNTIME.json',
  './content/threecolor/FOUNDATIONS_FULL_30_V071.json',
  './content/threecolor/LIVING_NETWORKS_FULL_48_V071.json',
  './content/threecolor/LIVING_NETWORKS_LAYOUT_FULL_48_V071.json',
  './developer_quality_v07642.js',
  './foundation_game_v0611.js',
  './favicon.ico',
  './foundation_levels.html',
  './foundations.html',
  './game_preload_v0724.js',
  './home.html',
  './index.html',
  './living.html',
  './living_levels.html',
  './living_play.html',
  './manifest.webmanifest',
  './menu_architecture_v078h.js', // N-1 compatibility for stale menu documents
  './menu_architecture_v078i.js',
  './menu_architecture_v079b.js', // N-1 compatibility for v0.7.9b documents
  './menu_architecture_v079c.js',
  './menu_architecture_v079f.js',
  './menu_live_minis_v078h.js', // N-1 compatibility for stale home documents
  './menu_live_minis_v078i.js',
  './menu_luminance_v077a7.css',
  './menu_scaling_v078h.css', // N-1 compatibility for stale menu documents
  './menu_scaling_v078i.css',
  './cq_ui_v079a.css',
  './cq_navigation_v079b.css', // N-1 compatibility for v0.7.9b documents
  './cq_navigation_v079c.css',
  './cq_navigation_v079f.css',
  './cq_gameplay_chrome_v079d.css',
  './cq_gameplay_chrome_v079f.css',
  './cq_overlays_v079e.css',
  './cq_overlays_v079f.css',
  './cq_overlays_v079e.js',
  './cq_overlays_v079f.js',
  './network_game_v0611.js',
  './play.html',
  './progress_v060.js',
  './ratio_clarity_v078i.css',
  './reference/USER_AESTHETIC_PRESET_2026-08-22.json',
  './resume_state_v078i.js',
  './runtime/data_load_guard_v078i.js',
  './runtime/mobile_performance_v0764.js',
  './runtime/network_orientation_layout_v078b.js',
  './runtime/synapse_renderer_v053.js',
  './runtime/world_v0611.js',
  './settings_v077a12.css',
  './settings_v077a12.js',
  './success_sfx_v077a14.js', // N-1 compatibility for stale gameplay documents
  './success_sfx_v079f1.js',
  './threecolor.html',
  './threecolor_foundation_game_v071.js',
  './threecolor_foundation_levels.html',
  './threecolor_foundations.html',
  './threecolor_living.html',
  './threecolor_living_levels.html',
  './threecolor_living_play.html',
  './threecolor_network_game_v071.js',
  './threecolor_play.html',
  './tutorial.html',
  './tutorial_v078i.js',
  './twocolor.html',
  './ui_production_v076412.css',
  './ui_runtime_v076412.js',
  './user_aesthetic_preset_v073.js',
  './visual_environment_v076412.css',
  './visual_identity_v062.js',
  './visual_identity_v072.js',
  './visual_profiles_v062.js',
];

async function precache(){
  const cache=await caches.open(CACHE);
  await cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'})));
}
async function cached(request){return caches.match(request,{ignoreSearch:true})}
async function cacheResponse(request,response){
  if(response&&response.ok&&new URL(request.url).origin===self.location.origin){
    const cache=await caches.open(CACHE);await cache.put(request,response.clone());
  }
  return response;
}
async function networkFirst(request,fallbackPath=null){
  try{return await cacheResponse(request,await fetch(request))}catch(_){
    const hit=await cached(request);if(hit)return hit;
    if(fallbackPath){const fallback=await caches.match(fallbackPath,{ignoreSearch:true});if(fallback)return fallback}
    return new Response('Offline',{status:503,statusText:'Offline'});
  }
}

self.addEventListener('install',event=>{
  event.waitUntil(precache().then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='CELLQUATION_REFRESH_CACHE')event.waitUntil(precache());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request,url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.destination==='audio'||url.pathname.includes('/assets/audio/'))return;

  if(request.mode==='navigate'){
    // Navigation is network-first. Offline fallback prefers the exact requested page;
    // index.html is only the final shell fallback, not the default response.
    const localPath='.'+url.pathname.slice(url.pathname.lastIndexOf('/'));
    event.respondWith(networkFirst(request,localPath==='.'?'./index.html':localPath).then(async response=>{
      if(response.status!==503)return response;
      return (await caches.match('./index.html',{ignoreSearch:true}))||response;
    }));
    return;
  }

  if(url.pathname.endsWith('.json')){event.respondWith(networkFirst(request));return}

  event.respondWith((async()=>{
    const hit=await cached(request);if(hit)return hit;
    try{return await cacheResponse(request,await fetch(request))}catch(_){return new Response('Offline',{status:503,statusText:'Offline'})}
  })());
});
