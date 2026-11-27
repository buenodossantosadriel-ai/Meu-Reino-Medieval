const CACHE='meu-reino-v4';
const APP_SHELL=['/','/manifest.json','/icons/icon-192.svg','/icons/icon-512.svg'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(url=>cache.add(url).catch(error=>console.warn('Não foi possível armazenar:',url,error))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok){
        const cache=await caches.open(CACHE);
        if(request.mode==='navigate'||APP_SHELL.includes(new URL(request.url).pathname))await cache.put(request,response.clone());
      }
      return response;
    }catch(error){
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==='navigate')return new Response('Sem conexão. Conecte-se à internet para carregar o reino e seus recursos online.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      throw error;
    }
  })());
});
