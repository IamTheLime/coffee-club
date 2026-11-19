import FullApp from './App.jsx';
import React,{useEffect,useRef} from 'react';
import{createRoot}from'react-dom/client';
import * as THREE from 'three';
import{ImprovedNoise}from'three/addons/math/ImprovedNoise.js';
import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';
import{Plus,MapPin,ArrowUpRight,Coffee,BookOpen,Camera}from'lucide-react';
import './style.css';

function Cup({dark=false,rust=false}){
 const holder=useRef();
 useEffect(()=>{
  let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  const el=holder.current;el.appendChild(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=dark?1.4:1.15;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,50);camera.position.set(0,3.6,6);camera.lookAt(0,.55,0);
  const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;
  const group=new THREE.Group();scene.add(group);group.rotation.set(.06,-.35,.13);
  const ceramic=new THREE.MeshPhysicalMaterial({color:rust?0xc68b65:dark?0x35271e:0xf1e4c9,emissive:0xc97739,emissiveIntensity:.10,roughness:.22,metalness:.02,clearcoat:.9,clearcoatRoughness:.16});
  const brass=new THREE.MeshStandardMaterial({color:0xb88b43,metalness:.8,roughness:.23});
  const points=[[.39,0],[.43,.04],[.53,.14],[.66,.38],[.78,.76],[.81,.98],[.80,1.02],[.75,1.02],[.74,.96],[.69,.76],[.58,.42],[.46,.16],[.39,.13]].map(([x,y])=>new THREE.Vector2(x,y));
  const cup=new THREE.Mesh(new THREE.LatheGeometry(points,96),ceramic);cup.position.y=.19;group.add(cup);
  const saucer=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.4,0],[.5,.03],[.9,.06],[1.27,.13],[1.31,.17],[1.29,.20],[.9,.13],[.5,.12],[0,.12]].map(p=>new THREE.Vector2(...p)),96),ceramic);group.add(saucer);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.783,.014,12,96),brass);rim.rotation.x=Math.PI/2;rim.position.y=1.21;group.add(rim);
  // Open handle ends terminate inside the ceramic wall, below the coffee surface.
  const handleCurve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(.75,1.00,0),new THREE.Vector3(1.12,1.03,0),
   new THREE.Vector3(1.29,.80,0),new THREE.Vector3(1.10,.49,0),new THREE.Vector3(.57,.45,0)
  ]);
  const handle=new THREE.Mesh(new THREE.TubeGeometry(handleCurve,48,.073,16,false),ceramic);group.add(handle);
  // Dense polar surface: waves change the actual liquid geometry and reflections.
  const liquidGeometry=new THREE.RingGeometry(.001,.734,96,28);
  liquidGeometry.rotateX(-Math.PI/2);
  const liquidMaterial=new THREE.MeshPhysicalMaterial({color:0x492714,roughness:.24,metalness:0,clearcoat:1,clearcoatRoughness:.12});
  const coffee=new THREE.Mesh(liquidGeometry,liquidMaterial);coffee.position.y=1.16;group.add(coffee);
  const liquidPositions=liquidGeometry.attributes.position;
  const liquidNoise=new ImprovedNoise(),noiseOffset=Math.random()*1000;
  const updateLiquid=(time,energy)=>{
   for(let i=0;i<liquidPositions.count;i++){
    const x=liquidPositions.getX(i),z=liquidPositions.getZ(i),r=Math.hypot(x,z);
    const edge=Math.pow(Math.max(0,1-(r/.734)**2),1.2);
    // Coherent noise drifts continuously: no frame-to-frame random jitter.
    const drift=liquidNoise.noise(x*2.2+noiseOffset,z*2.2,time*.13);
    const detail=liquidNoise.noise(x*6.5+noiseOffset,z*6.5,time*.19);
    const swell=Math.sin(x*4.2+z*2.1-time*.65+drift*.65)*.004;
    const cross=Math.sin(z*5-x*1.7+time*.43)*.002;
    liquidPositions.setY(i,(swell+cross+drift*.004+detail*.0012)*edge*energy);
   }
   liquidPositions.needsUpdate=true;liquidGeometry.computeVertexNormals();
  };
  const crema=new THREE.Mesh(new THREE.TorusGeometry(.719,.009,10,96),new THREE.MeshStandardMaterial({color:0x997044,roughness:.65,transparent:true,opacity:.6}));crema.rotation.x=Math.PI/2;crema.position.y=1.163;group.add(crema);
  const spoon=new THREE.Group();const stick=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.78,6,16),brass);stick.rotation.z=Math.PI/2;spoon.add(stick);const bowl=new THREE.Mesh(new THREE.SphereGeometry(.13,24,16),brass);bowl.scale.set(1.5,.18,1);bowl.position.x=-.49;spoon.add(bowl);spoon.position.set(.5,.2,.68);spoon.rotation.y=-.4;group.add(spoon);
  const resize=()=>{const{width,height}=el.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};resize();const ro=new ResizeObserver(resize);ro.observe(el);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame,pointer=0,pointerTarget=0,lastTime=0,phase=0,scrollEnergy=0,lastScroll=window.scrollY;
  const move=e=>{if(!motion.matches&&e.pointerType==='mouse')pointerTarget=(Math.max(0,Math.min(1,e.clientX/window.innerWidth))-.5)*1.1;};
  const leave=()=>{pointerTarget=0;};
  const scroll=()=>{
   const distance=Math.abs(window.scrollY-lastScroll);lastScroll=window.scrollY;
   const bounds=el.getBoundingClientRect();
   if(!motion.matches&&bounds.bottom>0&&bounds.top<innerHeight)scrollEnergy=Math.min(1,scrollEnergy+distance/180);
  };
  window.addEventListener('pointermove',move,{passive:true});
  document.documentElement.addEventListener('pointerleave',leave);
  window.addEventListener('blur',leave);
  window.addEventListener('scroll',scroll,{passive:true});
  const render=t=>{
   const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;
   const visible=el.getBoundingClientRect().bottom>0&&el.getBoundingClientRect().top<innerHeight;
   if(!motion.matches&&visible&&!document.hidden){pointer+=(pointerTarget-pointer)*(1-Math.exp(-dt*4));scrollEnergy*=Math.exp(-dt*1.15);phase+=dt*(1+scrollEnergy*1.8);updateLiquid(phase,1+scrollEnergy*3.5);group.position.y=Math.sin(phase*.4)*.012;group.rotation.y=-.35+pointer;}
   else if(motion.matches){pointer=0;pointerTarget=0;scrollEnergy=0;updateLiquid(0,0);group.position.y=0;group.rotation.y=-.35;}
   if(visible&&!document.hidden)renderer.render(scene,camera);
   frame=requestAnimationFrame(render);
  };frame=requestAnimationFrame(render);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);window.removeEventListener('scroll',scroll);const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();};
 },[dark,rust]);
 return <div className="cup-stage" ref={holder} role="img" aria-label="Glazed espresso cup with gentle, irregular ocean-like movement on the coffee surface"><span className="cup-shadow"/></div>;
}
function PourCard({children,enabled}){
 const card=useRef();
 const move=e=>{
  if(!enabled||e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const box=e.currentTarget.getBoundingClientRect();
  const x=Math.max(-1,Math.min(1,(e.clientX-box.left)/box.width*2-1));
  const y=Math.max(-1,Math.min(1,(e.clientY-box.top)/box.height*2-1));
  card.current.style.setProperty('--tilt-x',`${-y*2}deg`);
  card.current.style.setProperty('--tilt-y',`${x*3}deg`);
  card.current.style.setProperty('--pattern-x',`${x*7}px`);
  card.current.style.setProperty('--pattern-y',`${y*5}px`);
  card.current.style.setProperty('--glint-x',`${50+x*30}%`);
 };
 const reset=()=>{for(const key of ['--tilt-x','--tilt-y','--pattern-x','--pattern-y','--glint-x'])card.current.style.removeProperty(key);};
 return <div className={enabled?'pour-perspective':undefined} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}><section ref={card} className={'journal'+(enabled?' pour-card':'')}>
 {enabled&&<><div className="coffee-pattern" aria-hidden="true"><span className="coffee-ring"/><span className="coffee-bean bean-one"/><span className="coffee-bean bean-two"/><span className="coffee-bean bean-three"/></div><div className="card-foil" aria-hidden="true"/></>}
 <div className="pour-content">{children}</div></section></div>;
}
const names=['The Listening Room','After Hours','Field Notes'];
function Study({index}){return <article className={'study study-'+index}>
 <header><span className="wordmark">sippin’<br/><i>diesel.</i><span className="mark-dot" aria-hidden="true">✦</span></span><span className="club">A PRIVATE<br/>COFFEE CLUB</span></header>
 <nav><span className="active">The journal</span><span>The cafés</span><span className="avatar">T</span></nav>
 <section className="hero"><div className="eyebrow"><span/> TIAGO, SAM & ARCHIE</div><h1>{index===1?<>Good coffee.<br/><em>Better company.</em></>:index===2?<>For the love<br/>of <em>the next cup.</em></>:<>“Meet you by<br/><em>the piss door”</em></>}</h1><p>Three friends. Every cup. From Piss<br className="desktop-br"/> to Coffee Excelence.</p><Cup dark={index===2} rust={index===3}/><span className="hero-caption">TAKE YOUR TIME. HAVE ANOTHER SIP.</span><button className="primary"><Plus size={17}/> Log a coffee</button></section>
 <PourCard enabled={index===3}><div className="section-title"><h2>The latest pours</h2><span>ALL ENTRIES <ArrowUpRight size={13}/></span></div><div className="sample-label">FROM YOUR COFFEE LIST · 4/7</div><div className="review"><div className="mini-cup"><Coffee size={28} strokeWidth={1}/></div><div><div className="cafe">Rosslyn</div><h3>Deep, chocolate notes.</h3><p>Nice deep coffee, without too much acidity. chocolate notes not fruity.</p><div className="review-meta"><span>TIAGO</span><span>COFFEE TYPE NOT RECORDED</span></div></div><div className="grade"><strong>8</strong><i> / 10</i><span>TIAGO’S SCORE</span></div></div><div className="journal-footer"><span><MapPin size={13}/> Find the café</span><span>Sam & Archie haven’t rated this yet</span></div></PourCard>
 <footer><span>A shared taste. A running conversation.</span><span>SD / COFFEE CLUB</span></footer>
 </article>}
function App(){let selected=Number(new URLSearchParams(location.search).get('concept'));return <><div className="preview-bar"><span>SIPPIN’ DIESEL / DESIGN STUDIES</span><span>Same app. Three different moods.</span></div><main className={selected?'single':'comparison'}>{(selected?[selected]:[1,2,3]).map(i=><div className="concept" key={i}><div className="concept-title"><span>0{i}</span><h2>{names[i-1]}</h2><a href={'?concept='+i}>Open study</a></div><Study index={i}/><p className="direction-note">{i===1?'Cream paper, glazed porcelain, quiet brass. An airy, editorial coffee journal.':i===2?'Deep espresso, amber light, deliberate pauses. A little after-hours ceremony.':'Roasted terracotta, tasting slips, expressive type. A notebook for the next good find.'}</p></div>)}</main></>}
createRoot(document.getElementById('root')).render(new URLSearchParams(location.search).has('concept')?<App/>:<FullApp Cup={Cup} PourCard={PourCard}/>);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
