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
  const mobile=matchMedia('(pointer: coarse)');
  let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  const el=holder.current;el.appendChild(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile.matches?1.25:1.6));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=dark?1.4:1.15;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,50);camera.position.set(0,3.6,6);camera.lookAt(0,.55,0);
  const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;
  const group=new THREE.Group();scene.add(group);group.rotation.set(.06,-.35,.13);
  const ceramic=new THREE.MeshPhysicalMaterial({color:rust?0xc68b65:dark?0x35271e:0xf1e4c9,emissive:0xc97739,emissiveIntensity:.08,roughness:.26,metalness:.02,clearcoat:.7,clearcoatRoughness:.2});
  const brass=new THREE.MeshStandardMaterial({color:0xb88b43,metalness:.8,roughness:.23});
  const points=[[0,0],[.38,0],[.53,.06],[.65,.19],[.73,.42],[.775,.76],[.79,1.02],[.775,1.035],[.744,1.02],[.733,.76],[.69,.42],[.59,.21],[.36,.12],[0,.12]].map(([x,y])=>new THREE.Vector2(x,y));
  const cup=new THREE.Mesh(new THREE.LatheGeometry(points,96),ceramic);cup.position.y=.19;group.add(cup);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.774,.009,10,96),brass);rim.rotation.x=Math.PI/2;rim.position.y=1.218;group.add(rim);
  const handleCurve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(.76,1.10,0),new THREE.Vector3(.96,1.17,0),
   new THREE.Vector3(1.15,1.10,0),new THREE.Vector3(1.19,.89,0),
   new THREE.Vector3(1.10,.68,0),new THREE.Vector3(.63,.45,0)
  ],false,'centripetal');
  const handle=new THREE.Mesh(new THREE.TubeGeometry(handleCurve,64,.053,16,false),ceramic);group.add(handle);
  const saucer=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.4,0],[.5,.03],[.9,.06],[1.27,.13],[1.31,.17],[1.29,.20],[.9,.13],[.5,.12],[0,.12]].map(p=>new THREE.Vector2(...p)),96),ceramic);group.add(saucer);
  // Amber light catches changing surface normals and warms the inner glaze.
  const cupLight=new THREE.PointLight(0xffb866,.65,1.8,2);cupLight.position.set(-.36,1.52,.18);group.add(cupLight);
  // Dense polar surface: waves change the actual liquid geometry and reflections.
  const liquidGeometry=new THREE.RingGeometry(.001,.734,mobile.matches?48:96,mobile.matches?12:28);
  liquidGeometry.rotateX(-Math.PI/2);
  const liquidMaterial=new THREE.MeshPhysicalMaterial({color:0x211d19,roughness:.26,metalness:0,clearcoat:.3,clearcoatRoughness:.2,envMapIntensity:.07,specularIntensity:.2});
  const liquidGlow={time:{value:0},energy:{value:0}};
  liquidMaterial.onBeforeCompile=shader=>{
   shader.uniforms.uCoffeeTime=liquidGlow.time;shader.uniforms.uCoffeeEnergy=liquidGlow.energy;
   shader.vertexShader='varying vec3 vCoffeePosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCoffeePosition=position;');
   shader.fragmentShader='varying vec3 vCoffeePosition;\nuniform float uCoffeeTime;\nuniform float uCoffeeEnergy;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    vec2 p=vCoffeePosition.xz;
    float warp=sin(p.x*6.0+p.y*4.0-uCoffeeTime*.8)*2.1+sin(p.y*7.0-p.x*3.0+uCoffeeTime*.5)*1.2;
    float ribbon=pow(max(0.0,1.0-abs(sin(p.x*12.0+p.y*8.0+warp+uCoffeeTime*.65))),12.0);
    float crossWave=pow(max(0.0,1.0-abs(sin(p.y*14.0-p.x*5.0-warp-uCoffeeTime*.4))),16.0);
    float pool=exp(-length(p-vec2(-.2,.12))*2.8);
    totalEmissiveRadiance+=vec3(.15,.065,.018)*(ribbon+crossWave*.18)*pool*(.45+uCoffeeEnergy*.3);
   `);
  };
  const coffee=new THREE.Mesh(liquidGeometry,liquidMaterial);coffee.position.y=1.14;group.add(coffee);
  const liquidPositions=liquidGeometry.attributes.position;
  const baseLiquid=Float32Array.from(liquidPositions.array);
  const liquidNoise=new ImprovedNoise(),noiseOffset=Math.random()*1000;
  let sloshX=0,sloshZ=0,velocityX=0,velocityZ=0;
  const edgePoints=new Float32Array(96*3),edgeGeometry=new THREE.BufferGeometry();edgeGeometry.setAttribute('position',new THREE.BufferAttribute(edgePoints,3));
  const crema=new THREE.LineLoop(edgeGeometry,new THREE.LineBasicMaterial({color:0x9b6a39,transparent:true,opacity:.45}));crema.position.y=1.14;group.add(crema);
  const surface=(x,z,time,energy)=>{
   const r=Math.hypot(x,z)/.734;
   const drift=liquidNoise.noise(x*2.2+noiseOffset,z*2.2,time*.18);
   const swell=Math.sin(x*5+z*2-time*1.7)*.007+Math.sin(z*6-x*2+time*1.3)*.004;
   // The wave reaches the wall, rises nearly to the lip, then settles back.
   return .066*Math.tanh((x*sloshX+z*sloshZ+(swell+drift*.003)*energy*(.45+.55*r))/.066);
  };
  const updateLiquid=(time,energy)=>{
   liquidGlow.time.value=time;liquidGlow.energy.value=energy;
   for(let i=0;i<liquidPositions.count;i++){
    const x=baseLiquid[i*3],z=baseLiquid[i*3+2],height=surface(x,z,time,energy);
    // Follow the tapered inner wall as the contact line rises and falls.
    const radius=(.740+height*.06)/.734;
    liquidPositions.setXYZ(i,x*radius,height,z*radius);
   }
   liquidPositions.needsUpdate=true;liquidGeometry.computeVertexNormals();
   for(let i=0;i<96;i++){const angle=i/96*Math.PI*2,x=Math.cos(angle)*.734,z=Math.sin(angle)*.734,h=surface(x,z,time,energy),r=.740+h*.06;edgePoints[i*3]=Math.cos(angle)*r;edgePoints[i*3+1]=h+.001;edgePoints[i*3+2]=Math.sin(angle)*r;}
   edgeGeometry.attributes.position.needsUpdate=true;
  };
  const resize=()=>{const{width,height}=el.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};resize();const ro=new ResizeObserver(resize);ro.observe(el);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame,pointer=0,pointerTarget=0,lastTime=0,phase=0,scrollEnergy=0,lastScroll=window.scrollY;
  const move=e=>{if(!motion.matches&&e.pointerType==='mouse')pointerTarget=(Math.max(0,Math.min(1,e.clientX/window.innerWidth))-.5)*1.1;};
  const leave=()=>{pointerTarget=0;};
  const scroll=()=>{
   const delta=window.scrollY-lastScroll,distance=Math.abs(delta);lastScroll=window.scrollY;
   const bounds=el.getBoundingClientRect();
   if(!motion.matches&&bounds.bottom>0&&bounds.top<innerHeight){scrollEnergy=Math.min(1,scrollEnergy+distance/180);velocityZ+=Math.max(-.6,Math.min(.6,delta*.006));}
  };
  window.addEventListener('pointermove',move,{passive:true});
  document.documentElement.addEventListener('pointerleave',leave);
  window.addEventListener('blur',leave);
  window.addEventListener('scroll',scroll,{passive:true});
  const render=t=>{
   if(mobile.matches&&t-lastTime<1000/30){frame=requestAnimationFrame(render);return;}
   const modalOpen=document.documentElement.hasAttribute('data-coffee-dialog-open');
   const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;
   const visible=el.getBoundingClientRect().bottom>0&&el.getBoundingClientRect().top<innerHeight;
   if(!motion.matches&&visible&&!document.hidden&&!modalOpen){
    const change=(pointerTarget-pointer)*(1-Math.exp(-dt*4));pointer+=change;
    velocityX-=change*5;
    velocityX+=(-sloshX*22-velocityX*2.8)*dt;velocityZ+=(-sloshZ*19-velocityZ*2.5)*dt;
    sloshX=Math.max(-.22,Math.min(.22,sloshX+velocityX*dt));sloshZ=Math.max(-.22,Math.min(.22,sloshZ+velocityZ*dt));
    scrollEnergy*=Math.exp(-dt*1.4);phase+=dt;
    updateLiquid(phase,1+scrollEnergy*2);
    group.position.y=Math.sin(phase*.4)*.012;group.rotation.set(.06+sloshZ*.24,-.35+pointer,.13-sloshX*.2);
   }
   else if(motion.matches&&!modalOpen){pointer=0;pointerTarget=0;scrollEnergy=0;sloshX=sloshZ=velocityX=velocityZ=0;updateLiquid(0,0);group.position.y=0;group.rotation.set(.06,-.35,.13);}
   if(visible&&!document.hidden&&!modalOpen)renderer.render(scene,camera);
   frame=requestAnimationFrame(render);
  };frame=requestAnimationFrame(render);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);window.removeEventListener('scroll',scroll);const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();};
 },[dark,rust]);
 return <div className="cup-stage" ref={holder} role="img" aria-label="Warm terracotta mug and saucer with amber-lit dark coffee that sloshes toward the rim as the cup moves"><span className="cup-shadow"/></div>;
}
function PourCard({children,enabled,organic=false,restingTilt}){
 const resting=useRef(null);if(resting.current===null)resting.current={angle:restingTilt??(Math.random()-.5)*5,offset:(Math.random()-.5)*12};
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
  card.current.style.setProperty('--glint-x',`${50+x*45}%`);
  card.current.style.setProperty('--glint-y',`${50+y*45}%`);
 };
 const reset=()=>{for(const key of ['--tilt-x','--tilt-y','--pattern-x','--pattern-y','--glint-x','--glint-y'])card.current.style.removeProperty(key);};
 return <div className={enabled?'pour-perspective':undefined} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}><section ref={card} style={organic?{'--rest-tilt':resting.current.angle+'deg','--rest-offset':resting.current.offset+'px'}:undefined} className={'journal'+(enabled?' pour-card':'')+(organic?' organic-card':'')}>
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
