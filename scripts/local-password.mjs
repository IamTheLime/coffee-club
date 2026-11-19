import{hashPassword}from'../server/app.mjs';
import{randomBytes}from'node:crypto';
import{writeFileSync,existsSync}from'node:fs';
if(existsSync('.env.local'))throw new Error('.env.local exists; refusing to overwrite.');
const password=randomBytes(15).toString('base64url');
writeFileSync('.env.local',`PASSWORD_HASH=${hashPassword(password)}\nAPP_ORIGIN=http://127.0.0.1:5177\n`,{mode:0o600,flag:'wx'});
console.log(`Local-only club password: ${password}\nKeep this out of Git. This does not configure the VPS.`);
