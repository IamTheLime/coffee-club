// Network-only: private reviews and photos are never stored in browser caches.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><meta name="viewport" content="width=device-width"><title>Sippin’ Diesel · Offline</title><body style="background:#efe6d5;color:#552b20;font:20px Georgia;padding:40px"><h1>The kettle’s offline.</h1><p>Reconnect to open your private coffee journal.</p><a href="/">Try again</a>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));});
