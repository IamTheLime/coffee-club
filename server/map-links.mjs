// Coordinates explicitly encoded in a Google Maps place/search link, never its @ camera centre.
export function coordinatesFromMapLink(value){
 let url;try{url=new URL(value);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['www.google.com','maps.google.com','maps.app.goo.gl'].includes(url.hostname))return null;
 const match=url.pathname.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)||[url.searchParams.get('query'),url.searchParams.get('q')].filter(Boolean).map(v=>v.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)).find(Boolean);
 if(!match)return null;const lat=Number(match[1]),lon=Number(match[2]);return Math.abs(lat)<85&&Math.abs(lon)<=180?{lat,lon}:null;
}
// User-confirmed full place link; the older short link only redirects to a place ID.
const confirmedPins={'https://maps.app.goo.gl/ewBfoKm9oZRWg8s57':{lat:51.5327752,lon:-0.0985187}};
export async function locationFromMapLink(value){
 if(confirmedPins[value])return confirmedPins[value];
 let url;try{url=new URL(value);}catch{return null;}
 for(let hop=0;hop<3;hop++){
  const location=coordinatesFromMapLink(url.href);if(location)return location;
  // Expand only Google's short-link host; don't scrape place pages or follow arbitrary redirects.
  if(url.protocol!=='https:'||url.hostname!=='maps.app.goo.gl'||url.username||url.password||url.port)return null;
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{'User-Agent':'SippinDiesel/1.0 (+https://sippindiesel.tiagolima.io/)'}});await r.body?.cancel();
  if(r.status<300||r.status>=400||!r.headers.get('location'))return null;
  url=new URL(r.headers.get('location'),url);
 }return null;
}
