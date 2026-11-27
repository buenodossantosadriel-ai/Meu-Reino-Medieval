const CACHE='meu-reino-v2';
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/manifest.json').catch(()=>{})));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok&&event.request.url.endsWith('/manifest.json')){
        const cache=await caches.open(CACHE); await cache.put(event.request,response.clone());
      }
      return response;
    }catch(error){
      const cached=await caches.match(event.request);
      if(cached)return cached;
      if(event.request.mode==='navigate')return new Response('Sem conexão. Verifique a internet e atualize a página.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      throw error;
    }
  })());
});