import {createApp} from './app.mjs';
import {readFileSync} from 'node:fs';
const app=createApp({databasePath:process.env.DATABASE_PATH||'.data/coffee.sqlite',passwordHash:process.env.PASSWORD_HASH,origin:process.env.APP_ORIGIN||'http://127.0.0.1:5177',secureCookies:process.env.NODE_ENV==='production',staticDirectory:'dist',seed:JSON.parse(readFileSync(new URL('./imported-reviews.json',import.meta.url)))});
app.server.listen(Number(process.env.PORT||3001),process.env.HOST||'127.0.0.1',()=>console.log('Sippin’ Diesel API ready.'));
process.on('SIGTERM',async()=>{await app.close();process.exit(0);});
