import React, {useEffect,useRef} from 'react';
import maps from './cafe-maps.json';
const palettes=[['#efe6d5','#dfceb0','#bdc5ad','#a8bdb7','#faf6ec','#c5a882'],['#dfc8a6','#c6ac87','#a9ad86','#8fa9a1','#eddbbd','#ae845b'],['#49372c','#5d4938','#596044','#465f5b','#a28b6b','#795e43'],['#211d19','#382e25','#3b4432','#304945','#806e56','#514333']];
export default function PixelMap({cafe,roast}){
 const canvas=useRef(null),map=maps[cafe.id];
 useEffect(()=>{if(!map||!canvas.current)return;const ctx=canvas.current.getContext('2d');if(!ctx)return;const [paper,building,park,water,road,line]=palettes[roast]||palettes[0];ctx.clearRect(0,0,320,196);ctx.fillStyle=paper;ctx.fillRect(0,0,320,196);
 // Zoom around the café while keeping the pin fixed at the canvas centre.
 ctx.save();ctx.translate(160,98);ctx.scale(1.6,1.6);ctx.translate(-160,-98);
 for(const layer of ['landcover','landuse','water','waterway','building','transportation'])for(const f of map.features){if(f.layer!==layer)continue;ctx.beginPath();for(const ring of f.paths){ring.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(f.type===3)ctx.closePath();}ctx.fillStyle=layer==='water'?water:layer==='building'?building:park;ctx.strokeStyle=layer==='waterway'?water:road;ctx.lineWidth=f.kind==='motorway'||f.kind==='primary'?4:2;if(f.type===3)ctx.fill('evenodd');else ctx.stroke();}ctx.strokeStyle=line;ctx.restore();
 },[map,roast]);
 if(!map)return null;
 return <figure className="pixel-map"><a className="pixel-map-view" href={cafe.maps_url} target="_blank" rel="noreferrer" aria-label={`Open ${cafe.name} in Google Maps`}><canvas ref={canvas} width="320" height="196" aria-hidden="true"/><span className="pixel-map-pin" aria-hidden="true">☕</span><span className="pixel-map-caption">{cafe.name}<span>Find our table ↗</span></span></a><figcaption>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a></figcaption></figure>;
}
