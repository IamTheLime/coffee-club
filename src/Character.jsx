import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
export default function Character({name}){
 const host=useRef();
 useEffect(()=>{
  const el=host.current;let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  el.appendChild(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(0,2.1,7.8);camera.lookAt(0,1.65,0);
  scene.add(new THREE.HemisphereLight(0xfff3db,0x785a43,2.5));const light=new THREE.DirectionalLight(0xffedd1,3);light.position.set(-3,5,4);scene.add(light);
  const figure=new THREE.Group();scene.add(figure);const sam=name==='Sam',archie=name==='Archie';
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:.65});
  const skin=material(sam?0xefc9a8:archie?0xe8b997:0xc99572),shirt=material(sam?0x473b32:archie?0x83917b:0xa75132),trousers=material(0x413c36),shoe=material(0x704f36),white=material(0xfff6e7),iris=material(archie?0x4f96d0:sam?0x7c8b73:0x382117),black=material(0x28251f),brow=material(sam?0xcaa366:0x71513a);
  function mesh(geo,mat,x,y,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);figure.add(m);return m;}
  function ball(mat,x,y,z,sx,sy=sx,sz=sx){const m=mesh(new THREE.SphereGeometry(1,32,24),mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
  function limb(mat,a,b,r){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va);const m=mesh(new THREE.CapsuleGeometry(r,Math.max(.01,d.length()-2*r),8,16),mat,...va.clone().add(vb).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  const hip=archie?1.65:1.15,shoulder=archie?2.12:2.05,head=archie?2.69:2.67,width=sam?.27:archie?.35:.42;
  if(archie)mesh(new THREE.BoxGeometry(.7,.55,.4),shirt,0,1.94);else ball(shirt,0,1.65,0,width,.62,.26);
  for(const side of [-1,1]){
   limb(trousers,[side*.16,.2,0],[side*.18,hip,0],sam?.085:.11);ball(shoe,side*.17,.13,.08,.14,.12,.25);
   limb(shirt,[side*width,shoulder,0],[side*(width+.17),archie?.95:1.2,.02],sam?.075:.10);
   ball(skin,side*(width+.17),archie?.88:1.1,.02,.105,.14,.10);
   ball(skin,side*.34,head-.03,0,.085,.13,.08);
  }
  limb(skin,[0,2.07,0],[0,head-.25,0],.13);
  if(sam)mesh(new THREE.CylinderGeometry(.19,.20,.27,32),shirt,0,2.2);
  ball(skin,0,head,0,sam?.31:.35,.43,.31);
  ball(skin,0,head-.04,.31,.075,.10,.08);
  for(const side of [-1,1]){
   ball(white,side*.135,head+.055,.276,.094,.065,.041);ball(iris,side*.135,head+.055,.313,.040,.044,.018);ball(black,side*.135,head+.055,.328,.019,.026,.009);
   limb(brow,[side*.135-.07,head+.17,.28],[side*.135+.07,head+.18,.28],.014);
   if(sam){const ring=mesh(new THREE.TorusGeometry(.109,.013,8,40),black,side*.14,head+.055,.335);ring.scale.y=.83;limb(black,[side*.25,head+.06,.33],[side*.31,head+.07,0],.012);}
  }
  if(sam)limb(black,[-.04,head+.06,.34],[.04,head+.06,.34],.012);
  const smile=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.09,head-.18,.285),new THREE.Vector3(0,head-.22,.32),new THREE.Vector3(.09,head-.18,.285));mesh(new THREE.TubeGeometry(smile,20,.012,6,false),brow,0,0);
  const base=mesh(new THREE.CylinderGeometry(.8,.9,.07,64),material(0xd7c3a3),0,.015);base.position.z=0;
  let frame,angle=0,target=0,last=0;const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const move=e=>{if(e.pointerType==='mouse')target=(e.clientX/innerWidth-.5)*.7;};window.addEventListener('pointermove',move,{passive:true});
  const resize=()=>{const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
  const render=t=>{const dt=Math.min((t-last)/1000,.05);last=t;const rect=el.getBoundingClientRect();if(rect.bottom>0&&rect.top<innerHeight&&!document.hidden){if(!motion.matches){angle+=(target-angle)*(1-Math.exp(-dt*4));figure.rotation.y=angle+Math.sin(t*.0005)*.04;}else figure.rotation.y=0;renderer.render(scene,camera);}frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();window.removeEventListener('pointermove',move);const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[name]);
 return <div ref={host} className="character-stage" role="img" aria-label={name==='Tiago'?'Tiago: bald, dark brown eyes':name==='Sam'?'Sam: thin, bald, blond eyebrows, turtleneck and glasses':'Archie: bald, blue eyes, small square torso and exaggerated long arms and legs'}/>;
}
