import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {createApp,hashPassword} from '../server/app.mjs';
const seed=JSON.parse(readFileSync(new URL('../server/imported-reviews.json',import.meta.url)));
const password='test-fixture-only-not-a-real-secret',passwordHash=hashPassword(password),origin='http://localhost:5177';
async function fixture(t){
 const dir=mkdtempSync(join(tmpdir(),'sd-test-'));let app;
 const start=async()=>{app=createApp({databasePath:join(dir,'test.sqlite'),passwordHash,origin,secureCookies:true,seed});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));};
 await start();t.after(async()=>{await app.close();rmSync(dir,{recursive:true,force:true});});
 const call=(path,{method='GET',cookie='',data,requestOrigin=origin}={})=>fetch(`http://127.0.0.1:${app.server.address().port}${path}`,{method,headers:{origin:requestOrigin,cookie,'content-type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async(name='Tiago')=>{const r=await call('/api/login',{method:'POST',data:{name,password}});assert.equal(r.status,200);const set=r.headers.get('set-cookie');assert.match(set,/HttpOnly/);assert.match(set,/SameSite=Strict/);assert.match(set,/Secure/);return set.split(';')[0];};
 return {call,login,restart:async()=>{await app.close();await start();}};
}
test('should require authentication for reviews and photos and block cross-origin writes',async t=>{
 const{call}=await fixture(t);
 assert.equal((await call('/api/journal')).status,401);
 assert.equal((await call('/api/photos/import-rosslyn-Tiago')).status,401);
 assert.equal((await call('/api/login',{method:'POST',requestOrigin:'https://evil.example',data:{name:'Tiago',password}})).status,403);
 const robots=await call('/robots.txt');assert.match(await robots.text(),/Disallow: \//);assert.match(robots.headers.get('x-robots-tag'),/noindex/);
});
test('should preserve original imported scores and missing facts without duplicating on restart',async t=>{
 const{call,login,restart}=await fixture(t);const cookie=await login();
 let data=await(await call('/api/journal',{cookie})).json();assert.equal(data.cafes.length,4);assert.equal(data.reviews.length,2);
 assert.equal(data.reviews.find(r=>r.cafe_id==='rosslyn').score,8);assert.equal(data.reviews.find(r=>r.cafe_id==='arome').score,7);
 assert.ok(data.reviews.every(r=>r.author==='Tiago'&&r.coffee===null&&r.visited_on===null));
 await restart();data=await(await call('/api/journal',{cookie})).json();assert.equal(data.reviews.length,2);
});
test('should persist a coffee with a re-encoded protected photo and restrict edits to its persona',async t=>{
 const{call,login,restart}=await fixture(t);const cookie=await login();
 const png=await sharp({create:{width:20,height:20,channels:3,background:'#ac754b'}}).png().toBuffer();
 const review={cafeId:'rosslyn',coffee:"Sam's espresso",score:9,notes:'Chocolate, lovely finish.',milk:'None',visitedOn:'2026-11-19',photo:`data:image/png;base64,${png.toString('base64')}`};
 const created=await call('/api/reviews',{method:'POST',cookie,data:review});assert.equal(created.status,201);const{id}=await created.json();
 const image=await call(`/api/photos/${id}`,{cookie});assert.equal(image.status,200);assert.equal(image.headers.get('cache-control'),'no-store');
 const metadata=await sharp(Buffer.from(await image.arrayBuffer())).metadata();assert.equal(metadata.format,'jpeg');assert.equal(metadata.exif,undefined);
 const sam=await login('Sam');assert.equal((await call(`/api/reviews/${id}`,{method:'PUT',cookie:sam,data:review})).status,403);
 await restart();const entries=await(await call('/api/journal',{cookie})).json();assert.ok(entries.reviews.some(r=>r.id===id&&r.coffee===review.coffee));
 assert.equal((await call(`/api/reviews/${id}`,{method:'DELETE',cookie})).status,200);
 assert.equal((await call(`/api/photos/${id}`,{cookie})).status,404);
});
test('should reject invalid scores, unsafe map links and invalid images without partial records',async t=>{
 const{call,login}=await fixture(t);const cookie=await login();
 const review={cafeName:'New café',coffee:'Flat white',score:8,notes:'Nice',visitedOn:'2026-11-19'};
 for(const patch of [{score:11},{mapsUrl:'javascript:alert(1)'},{photo:'data:image/png;base64,bm90LWFuLWltYWdl'},{visitedOn:'2026-02-31'}])assert.equal((await call('/api/reviews',{method:'POST',cookie,data:{...review,...patch}})).status,400);
 const data=await(await call('/api/journal',{cookie})).json();assert.equal(data.cafes.length,4);assert.equal(data.reviews.length,2);
});
test('should revoke access on logout and throttle failed password guesses',async t=>{
 const{call,login}=await fixture(t);const cookie=await login();assert.equal((await call('/api/logout',{method:'POST',cookie,data:{}})).status,200);assert.equal((await call('/api/journal',{cookie})).status,401);
 for(let i=0;i<10;i++)assert.equal((await call('/api/login',{method:'POST',data:{name:'Tiago',password:'wrong'}})).status,401);
 assert.equal((await call('/api/login',{method:'POST',data:{name:'Tiago',password}})).status,429);
});
