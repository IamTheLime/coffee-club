import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import sharp from 'sharp';

export const PEOPLE = ['Tiago','Sam','Archie'];
export function hashPassword(password) {
  const salt=randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
function matches(password,hash){
  if(typeof password!=='string'||password.length>512)return false;
  const[salt,digest]=hash.split(':');
  const actual=scryptSync(password,salt,64), expected=Buffer.from(digest,'hex');
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
const tokenHash=x=>createHash('sha256').update(x).digest('hex');
const error=(status,message)=>Object.assign(new Error(message),{status});
function text(value,max,required=false){
 if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw error(400,'Please check the form fields.');
 return value.trim();
}
function mapsLink(value,name,address){
 if(!value)return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`.trim())}`;
 let url;try{url=new URL(value);}catch{throw error(400,'Use a Google Maps link.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['maps.app.goo.gl','maps.google.com','www.google.com'].includes(url.hostname)||(url.hostname==='www.google.com'&&!url.pathname.startsWith('/maps')))throw error(400,'Use a Google Maps link.');
 return url.href;
}
async function body(req){
 if(!req.headers['content-type']?.startsWith('application/json'))throw error(415,'JSON required.');
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>9_000_000)throw error(413,'Photo is too large. Choose a smaller image.');chunks.push(chunk);}
 try{const value=JSON.parse(Buffer.concat(chunks).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value;}catch{throw error(400,'Invalid request.');}
}
async function photo(data){
 if(data==null||data==='')return null;
 if(typeof data!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(data))throw error(400,'Use a JPEG, PNG or WebP photo.');
 const bytes=Buffer.from(data.slice(data.indexOf(',')+1),'base64');
 if(bytes.length>6_000_000)throw error(413,'Photo must be under 6 MB.');
 try{return await sharp(bytes,{limitInputPixels:24_000_000,animated:false}).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();}catch{throw error(400,'That photo could not be read.');}
}
export function createApp({databasePath,passwordHash,origin,secureCookies=true,staticDirectory=null,seed=null}){
 if(!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash||''))throw new Error('A valid PASSWORD_HASH must be configured.');
 const appOrigin=new URL(origin).origin;
 mkdirSync(dirname(resolve(databasePath)),{recursive:true,mode:0o700});
 const db=new DatabaseSync(databasePath);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS cafes(id TEXT PRIMARY KEY,name TEXT NOT NULL,address TEXT NOT NULL DEFAULT '',maps_url TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',date_added_text TEXT);
 CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,cafe_id TEXT NOT NULL REFERENCES cafes(id),author TEXT NOT NULL CHECK(author IN ('Tiago','Sam','Archie')),coffee TEXT,score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 10),notes TEXT NOT NULL,milk TEXT NOT NULL DEFAULT '',visited_on TEXT,date_text TEXT,photo BLOB,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,author TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS imports(id TEXT PRIMARY KEY);
 CREATE INDEX IF NOT EXISTS review_cafe ON reviews(cafe_id);`);
 if(seed&&!db.prepare('SELECT id FROM imports WHERE id=?').get('coffee-list-v1')){
  db.exec('BEGIN IMMEDIATE');try{
   for(const cafe of seed.cafes){
    db.prepare('INSERT INTO cafes(id,name,maps_url,description,date_added_text) VALUES(?,?,?,?,?)').run(cafe.id,cafe.name,cafe.mapsUrl,cafe.description,cafe.dateAddedText);
    for(const r of cafe.reviews)db.prepare('INSERT INTO reviews(id,cafe_id,author,coffee,score,notes,date_text) VALUES(?,?,?,?,?,?,?)').run(`import-${cafe.id}-${r.author}`,cafe.id,r.author,null,r.score,r.notes,cafe.dateAddedText);
   }db.prepare('INSERT INTO imports VALUES(?)').run('coffee-list-v1');db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 const attempts=new Map();let loginBusy=false;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  const cookie=value=>res.setHeader('Set-Cookie',`sd_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${value?2592000:0}${secureCookies?'; Secure':''}`);
  try{
   const url=new URL(req.url,appOrigin),path=url.pathname;
   if(!['GET','HEAD','POST','PUT','DELETE'].includes(req.method))throw error(405,'Method not allowed.');
   if(['POST','PUT','DELETE'].includes(req.method)&&req.headers.origin!==appOrigin)throw error(403,'Please refresh and try again.');
   if(path==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('User-agent: *\nDisallow: /\n');}
   if(path==='/api/login'&&req.method==='POST'){
    // Do not trust arbitrary forwarded IP headers. Caddy is the only peer in production;
    // limiting that peer also imposes a global ceiling against distributed guessing.
    const ip=req.socket.remoteAddress,now=Date.now();for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);
    let state=attempts.get(ip)||{count:0,until:now+600_000};
    if(state.count>=10||loginBusy)throw error(429,'Too many attempts. Please try again in ten minutes.');
    state.count++;attempts.set(ip,state);const data=await body(req);
    let valid=false;loginBusy=true;try{valid=matches(data.password,passwordHash);}finally{loginBusy=false;}
    if(!valid||!PEOPLE.includes(data.name))throw error(401,'The name or club password is incorrect.');
    attempts.delete(ip);const token=randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM sessions WHERE expires < ?').run(now);
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(tokenHash(token),data.name,now+2592000000);cookie(token);return send(200,{name:data.name});
   }
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sd_session='))?.slice(11);
   const session=token?db.prepare('SELECT author FROM sessions WHERE hash=? AND expires>?').get(tokenHash(token),Date.now()):null;
   if(path.startsWith('/api/')){
    if(!session)throw error(401,'Please enter the club password.');
    if(path==='/api/session'&&req.method==='GET')return send(200,{name:session.author,people:PEOPLE});
    if(path==='/api/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE hash=?').run(tokenHash(token));cookie('');return send(200,{ok:true});}
    if(path==='/api/journal'&&req.method==='GET'){
     const cafes=db.prepare('SELECT * FROM cafes ORDER BY name COLLATE NOCASE').all();
     const reviews=db.prepare('SELECT id,cafe_id,author,coffee,score,notes,milk,visited_on,date_text,created_at,updated_at,photo IS NOT NULL AS has_photo FROM reviews ORDER BY created_at DESC,id DESC').all();
     return send(200,{cafes,reviews});
    }
    const photoMatch=path.match(/^\/api\/photos\/([a-zA-Z0-9_-]+)$/);
    if(photoMatch&&req.method==='GET'){
     const row=db.prepare('SELECT photo FROM reviews WHERE id=?').get(photoMatch[1]);if(!row?.photo)throw error(404,'Photo not found.');
     res.writeHead(200,{'Content-Type':'image/jpeg','Content-Disposition':'inline'});return res.end(Buffer.from(row.photo));
    }
    const reviewMatch=path.match(/^\/api\/reviews\/([a-zA-Z0-9_-]+)$/);
    if((path==='/api/reviews'&&req.method==='POST')||(reviewMatch&&req.method==='PUT')){
     const data=await body(req),id=reviewMatch?.[1]||randomBytes(12).toString('hex');
     const existing=reviewMatch?db.prepare('SELECT * FROM reviews WHERE id=?').get(id):null;
     if(reviewMatch&&(!existing||existing.author!==session.author))throw error(403,'Only the named author can edit this entry.');
     const coffee=text(data.coffee,100,true),notes=text(data.notes||'',4000),milk=text(data.milk||'',50);
     if(typeof data.score!=='number'||!Number.isFinite(data.score)||!Number.isInteger(data.score*2)||data.score<1||data.score>10)throw error(400,'Choose a score from 1 to 10 in half-point steps.');
     const visited=text(data.visitedOn,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(visited)||!Number.isFinite(Date.parse(visited))||new Date(visited).toISOString().slice(0,10)!==visited)throw error(400,'Choose a valid visit date.');
     const image=data.photo===undefined?(existing?.photo||null):await photo(data.photo);
     let cafeId=data.cafeId;let cafe=cafeId?db.prepare('SELECT id FROM cafes WHERE id=?').get(cafeId):null;
     if(cafeId&&!cafe)throw error(400,'Choose an existing café.');
     let newCafe;if(!cafe){const name=text(data.cafeName,150,true),address=text(data.address||'',250);newCafe={name,address,maps:mapsLink(text(data.mapsUrl||'',2048),name,address)};cafeId=randomBytes(12).toString('hex');}
     db.exec('BEGIN IMMEDIATE');try{
      if(newCafe)db.prepare('INSERT INTO cafes(id,name,address,maps_url) VALUES(?,?,?,?)').run(cafeId,newCafe.name,newCafe.address,newCafe.maps);
      if(existing)db.prepare('UPDATE reviews SET cafe_id=?,coffee=?,score=?,notes=?,milk=?,visited_on=?,photo=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(cafeId,coffee,data.score,notes,milk,visited,image,id);
      else db.prepare('INSERT INTO reviews(id,cafe_id,author,coffee,score,notes,milk,visited_on,photo) VALUES(?,?,?,?,?,?,?,?,?)').run(id,cafeId,session.author,coffee,data.score,notes,milk,visited,image);
      db.exec('COMMIT');
     }catch(e){db.exec('ROLLBACK');throw e;}
     return send(existing?200:201,{id});
    }
    if(reviewMatch&&req.method==='DELETE'){
     const row=db.prepare('SELECT author FROM reviews WHERE id=?').get(reviewMatch[1]);if(!row||row.author!==session.author)throw error(403,'Only the named author can delete this entry.');
     db.prepare('DELETE FROM reviews WHERE id=?').run(reviewMatch[1]);return send(200,{ok:true});
    }
    throw error(404,'Not found.');
   }
   if(!['GET','HEAD'].includes(req.method))throw error(405,'Method not allowed.');
   if(staticDirectory){
    const base=resolve(staticDirectory);let file=resolve(base,'.'+decodeURIComponent(path));
    if(file!==base&&!file.startsWith(base+sep))throw error(404,'Not found.');
    if(path==='/'||(!extname(path)&&!existsSync(file)))file=resolve(base,'index.html');
    if(existsSync(file)&&statSync(file).isFile()){
     const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.ttf':'font/ttf','.glb':'model/gltf-binary'}[extname(file)]||'application/octet-stream';
     res.writeHead(200,{'Content-Type':mime});return res.end(req.method==='HEAD'?null:readFileSync(file));
    }
   }throw error(404,'Not found.');
  }catch(e){send(e.status||500,{error:e.status?e.message:'Something went wrong. Please try again.'});}
 });
 server.requestTimeout=30_000;server.headersTimeout=15_000;
 return {server,db,close:()=>new Promise(resolveClose=>server.close(()=>{db.close();resolveClose();}))};
}
