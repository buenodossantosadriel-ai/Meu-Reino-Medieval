const CACHE='meu-reino-v12';
const CDN_ORIGINS=new Set(['https://cdn.jsdelivr.net','https://vibeassets.io']);
const APP_SHELL=['/','/index.html','/immersive4d.js','/manifest.json','/icons/icon-192.svg','/icons/icon-512.svg','https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js','https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js','https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/SkeletonUtils.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'];
const STATIC_EXT=/\.(?:js|mjs|css|png|jpe?g|webp|avif|svg|glb|gltf|bin|ktx2|woff2?)$/i;
function isCacheableAsset(url,request){
  if(CDN_ORIGINS.has(url.origin))return request.destination==='script'||STATIC_EXT.test(url.pathname)||url.pathname.startsWith('/download/');
  if(url.origin!==self.location.origin)return false;
  if(url.pathname.startsWith('/api/'))return url.pathname==='/api/farm-model';
  return request.destination==='script'||request.destination==='style'||request.destination==='image'||request.destination==='font'||STATIC_EXT.test(url.pathname);
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(path=>cache.add(path).catch(error=>console.warn('Pré-cache pendente:',path,error))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('meu-reino-')&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin&&!CDN_ORIGINS.has(url.origin))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(request);
        if(response.ok){try{await cache.put('/',response.clone());}catch(cacheError){console.warn('Cache da página indisponível:',cacheError);}}
        return response;
      }catch(error){
        const cached=await cache.match(request)||await cache.match('/');
        if(cached)return cached;
        return new Response('Sem conexão. Conecte-se à internet para abrir o reino pela primeira vez.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }
  if(!isCacheableAsset(url,request))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){try{await cache.put(request,response.clone());}catch(cacheError){console.warn('Cache do recurso indisponível:',cacheError);}}
      return response;
    }catch(error){
      const fallback=await cache.match(request);
      if(fallback)return fallback;
      throw error;
    }
  })());
});
