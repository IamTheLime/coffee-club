import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createMapCache} from '../server/map-cache.mjs';
const cafe={id:'test',name:'Coffee Place',address:'1 Test Street'};
const location={id:'node-1',name:'Coffee Place',label:'Coffee Place, 1 Test Street',lat:51.5,lon:-.1};
const map={features:[{layer:'building',type:3,paths:[[[0,0],[1,1],[1,0]]]}]};
function database(t){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE cafes(id TEXT PRIMARY KEY)');db.prepare('INSERT INTO cafes VALUES(?)').run(cafe.id);t.after(()=>db.close());return db;}
test('should coalesce concurrent requests and reuse persistent maps after cache recreation',async t=>{
 const db=database(t);let lookups=0,tiles=0;const providers={locate:async()=>{lookups++;return [location];},geometry:async()=>{tiles++;return map;}};
 let cache=createMapCache(db,{providers});const values=await Promise.all([cache.get(cafe),cache.get(cafe)]);assert.ok(values.every(v=>v.status==='ready'));assert.equal(lookups,1);assert.equal(tiles,1);
 cache=createMapCache(db,{providers});assert.deepEqual((await cache.get(cafe)).map,map);assert.equal(lookups,1);assert.equal(tiles,1);
});
test('should require selection for ambiguous locations and reject arbitrary coordinates',async t=>{
 let tiles=0;const cache=createMapCache(database(t),{providers:{locate:async()=>[location,{...location,id:'node-2'}],geometry:async()=>{tiles++;return map;}}});
 assert.equal((await cache.get(cafe)).status,'choose');assert.equal(tiles,0);assert.throws(()=>cache.choose(cafe,'invented'),{status:400});
 assert.equal((await cache.choose(cafe,'node-2')).status,'ready');assert.equal(tiles,1);
});
test('should back off provider failures and retain coordinates for retry without geocoding again',async t=>{
 let clock=0,lookups=0,tiles=0;const cache=createMapCache(database(t),{now:()=>clock,providers:{locate:async()=>{lookups++;return [location];},geometry:async()=>{if(++tiles===1)throw Error('offline');return map;}}});
 assert.equal((await cache.get(cafe)).status,'unavailable');assert.equal((await cache.get(cafe)).status,'unavailable');assert.equal(tiles,1);clock=3600001;
 assert.equal((await cache.get(cafe)).status,'ready');assert.equal(lookups,1);assert.equal(tiles,2);
});
test('should cache missing locations rather than geocode on each visit',async t=>{
 let lookups=0;const cache=createMapCache(database(t),{providers:{locate:async()=>{lookups++;return [];}}});assert.equal((await cache.get(cafe)).status,'missing');await cache.get(cafe);assert.equal(lookups,1);
});

test('should prefer link coordinates over geocoding, including previously missing maps',async t=>{
 const db=database(t);let lookup=0;const c={...cafe,maps_url:'https://www.google.com/maps/place/Cafe/data=!3d51.5!4d-0.1'};
 let cache=createMapCache(db,{providers:{locate:async()=>[],geometry:async()=>map}});await cache.get(cafe);
 cache=createMapCache(db,{providers:{resolveLink:async()=>location,locate:async()=>{lookup++;return [];},geometry:async p=>{assert.equal(p.lat,location.lat);return map;}}});
 assert.equal((await cache.get(c)).status,'ready');assert.equal(lookup,0);
});
