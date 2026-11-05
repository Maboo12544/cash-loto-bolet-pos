const CACHE='cash-loto-pos-v4-virtual';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './virtual/index.html',
  './virtual/css/games.css',
  './virtual/js/core.js',
  './virtual/js/art.js',
  './virtual/js/app.js',
  './virtual/js/lucky-six.js',
  './virtual/js/roulette.js',
  './virtual/js/keno.js',
  './virtual/js/dog-race.js',
  './virtual/js/horse-race.js'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
