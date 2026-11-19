import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {palette,sprites}=JSON.parse(readFileSync(new URL('./member-portraits.json',import.meta.url)));
for(const[name,rows]of Object.entries(sprites)){
 if(rows.length!==16||rows.some(r=>r.length!==16))throw Error('Invalid 16px grid: '+name);
 const data=Buffer.from(rows.flatMap(r=>[...r].flatMap(c=>{if(!palette[c])throw Error('Unknown pixel colour');return palette[c];})));
 await sharp(data,{raw:{width:16,height:16,channels:4}}).png().toFile(fileURLToPath(new URL('../public/assets/avatars/'+name+'.png',import.meta.url)));
}
