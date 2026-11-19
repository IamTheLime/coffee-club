import {readFileSync} from 'node:fs';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
const UA='SippinDiesel/1.0 (+https://sippindiesel.tiagolima.io/)';
const layers=['landcover','landuse','water','waterway','building','transportation'];
const normal=s=>s.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Fetch only configured providers, never URLs supplied in café records.
async function bytes(url,max){
 const response=await fetch(url,{headers:{'User-Agent':UA},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error(`Map provider HTTP ${response.status}`);
 let size=0;const chunks=[];for await(const chunk of response.body){size+=chunk.length;if(size>max)throw new Error('Map response too large');chunks.push(chunk);}return Buffer.concat(chunks);
}
const json=async url=>JSON.parse((await bytes(url,1000000)).toString());
function clip(r){
 for(const [axis,bound,sign] of [[0,-4,1],[0,324,-1],[1,-4,1],[1,200,-1]]){
  const out=[];if(!r.length)return out;let a=r.at(-1);
  for(const b of r){const ai=(a[axis]-bound)*sign>=0,bi=(b[axis]-bound)*sign>=0;if(ai!==bi){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push([Math.round(a[0]+t*(b[0]-a[0])),Math.round(a[1]+t*(b[1]-a[1]))]);}if(bi)out.push(b);a=b;}r=out;
 }return r.filter((v,i)=>!i||v[0]!==r[i-1][0]||v[1]!==r[i-1][1]);
}
export function createProviders({geocoder=process.env.MAP_GEOCODER_URL||'https://nominatim.openstreetmap.org/search',tileSource=process.env.MAP_TILE_SOURCE_URL||'https://tiles.openfreemap.org/planet'}={}){
 let lastLookup=0;
 return {
  async locate(cafe){
   await sleep(Math.max(0,1100-(Date.now()-lastLookup)));lastLookup=Date.now();
   const url=new URL(geocoder);url.search=new URLSearchParams({q:`${cafe.name} ${cafe.address}`.trim(),format:'jsonv2',limit:'5',addressdetails:'1'});
   const results=await json(url);
   return results.slice(0,5).filter(x=>['cafe','coffee_shop','bakery','restaurant'].includes(x.type)&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lon)&&Math.abs(+x.lat)<85&&Math.abs(+x.lon)<=180).map(x=>({id:`${x.osm_type}-${x.osm_id}`,name:x.name||x.display_name,label:x.display_name,lat:+x.lat,lon:+x.lon}));
  },
  async geometry({lat,lon}){
   const source=await json(tileSource),template=source.tiles?.[0];
   if(typeof template!=='string'||new URL(template).origin!==new URL(tileSource).origin)throw new Error('Invalid map tile source');
   const z=14,n=2**z,cx=(lon+180)/360*n,cy=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n,features=[];
   let total=0;
   // At most six tiles, sequential requests, capped below the provider's 50 MB allowance.
   for(let x=Math.floor(cx-.65);x<=Math.floor(cx+.65);x++)for(let y=Math.floor(cy-.4);y<=Math.floor(cy+.4);y++){
    const data=await bytes(template.replace('{z}',z).replace('{x}',(x+n)%n).replace('{y}',y),4000000);total+=data.length;if(total>24000000)throw new Error('Map area too large');
    const tile=new VectorTile(new PbfReader(data));
    for(const name of layers){const layer=tile.layers[name];if(!layer)continue;
     for(let i=0;i<layer.length;i++){const f=layer.feature(i);let paths=f.loadGeometry().map(r=>r.map(p=>[Math.round(((x+p.x/layer.extent-cx)/1.3+.5)*320),Math.round(((y+p.y/layer.extent-cy)/.8+.5)*196)]));
      if(f.type===3)paths=paths.map(clip).filter(r=>r.length>=3);else paths=paths.filter(r=>r.some(([x,y])=>x>=-8&&x<=328&&y>=-8&&y<=204));
      if(paths.length)features.push({layer:name,type:f.type,kind:f.properties.class,paths});
     }
    }
   }
   if(!features.length)throw new Error('No map geometry');return {features};
  }
 };
}
export function createMapCache(db,{providers=createProviders(),now=Date.now}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS cafe_maps(cafe_id TEXT PRIMARY KEY REFERENCES cafes(id),value TEXT NOT NULL,retry_after INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS map_locations(query TEXT PRIMARY KEY,value TEXT NOT NULL,retry_after INTEGER NOT NULL);`);
 const read=id=>{const r=db.prepare('SELECT * FROM cafe_maps WHERE cafe_id=?').get(id);return r&&{...r,value:JSON.parse(r.value)};};
 const save=(id,value,retry=0)=>{db.prepare('INSERT INTO cafe_maps VALUES(?,?,?) ON CONFLICT(cafe_id) DO UPDATE SET value=excluded.value,retry_after=excluded.retry_after').run(id,JSON.stringify(value),retry);return value;};
 const seeds=JSON.parse(readFileSync(new URL('./cafe-maps.json',import.meta.url)));
 for(const[id,map]of Object.entries(seeds))if(db.prepare('SELECT id FROM cafes WHERE id=?').get(id)&&!read(id))save(id,{status:'ready',map});
 const inFlight=new Map();let queue=Promise.resolve();
 function job(cafe,fn){
  if(inFlight.has(cafe.id))return inFlight.get(cafe.id);
  if(inFlight.size>=20)return Promise.resolve({status:'unavailable'});
  const task=queue.then(fn).catch(e=>{console.warn('Map generation failed:',e.message);const old=read(cafe.id)?.value;return save(cafe.id,{status:'unavailable',location:old?.location},now()+3600000);}).finally(()=>inFlight.delete(cafe.id));
  inFlight.set(cafe.id,task);queue=task.then(()=>{});return task;
 }
 async function generate(cafe,location){save(cafe.id,{status:'located',location});return save(cafe.id,{status:'ready',map:await providers.geometry(location)});}
 return {
  get(cafe){
   const cached=read(cafe.id);if(cached&&cached.value.status!=='located'&&(!cached.retry_after||cached.retry_after>now()))return Promise.resolve(cached.value);
   return job(cafe,async()=>{
    if(cached?.value.location)return generate(cafe,cached.value.location);
    const query=`${cafe.name} ${cafe.address}`.trim().toLowerCase();
    const hit=db.prepare('SELECT * FROM map_locations WHERE query=?').get(query);
    let choices;
    if(hit&&hit.retry_after>now())choices=JSON.parse(hit.value);
    else {choices=await providers.locate(cafe);db.prepare('INSERT INTO map_locations VALUES(?,?,?) ON CONFLICT(query) DO UPDATE SET value=excluded.value,retry_after=excluded.retry_after').run(query,JSON.stringify(choices),now()+30*86400000);}

    if(choices.length===1&&cafe.address&&normal(choices[0].name)===normal(cafe.name))return generate(cafe,choices[0]);
    return save(cafe.id,{status:choices.length?'choose':'missing',choices},choices.length?0:now()+86400000);
   });
  },
  choose(cafe,id){const choice=read(cafe.id)?.value.choices?.find(c=>c.id===id);if(!choice)throw Object.assign(new Error('Choose one of the suggested locations.'),{status:400});return job(cafe,()=>generate(cafe,choice));},
  idle:()=>queue
 };
}
