import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';

// A tiny procedural bean: two rounded lobes leave the characteristic central seam.
function BeanModel({progress}){
 const host=useRef(),draw=useRef();
 useEffect(()=>{
  let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  renderer.setSize(44,54);renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.current.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,44/54,.1,20);camera.position.z=5;
  scene.add(new THREE.HemisphereLight(0xfff4de,0x33241b,3));const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(-3,4,5);scene.add(light);
  const bean=new THREE.Group(),geometry=new THREE.SphereGeometry(1,24,18),material=new THREE.MeshStandardMaterial({roughness:.72,color:0xa6ad71});
  for(const side of [-1,1]){const lobe=new THREE.Mesh(geometry,material);lobe.scale.set(.34,.83,.42);lobe.position.x=side*.25;lobe.rotation.z=side*-.11;bean.add(lobe);}scene.add(bean);
  const green=new THREE.Color('#a6ad71'),brown=new THREE.Color('#422319');
  draw.current=p=>{material.color.copy(green).lerp(brown,p);bean.rotation.set(.22,matchMedia('(prefers-reduced-motion: reduce)').matches?0:p*Math.PI*2,-.35);renderer.render(scene,camera);};draw.current(0);
  return()=>{draw.current=null;geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 useEffect(()=>{draw.current?.(progress);},[progress]);
 return <span className="scroll-bean-model" ref={host} aria-hidden="true"/>;
}
export default function BeanScrollbar({dialog=false}){
 const rail=useRef(),target=useRef();const[state,setState]=useState({progress:0,visible:false,interactive:false,style:{}});
 useEffect(()=>{
  const media=matchMedia('(hover: hover) and (pointer: fine)');
  const el=dialog?(rail.current.closest('dialog').querySelector('.editor-fields')||rail.current.closest('dialog')):document.documentElement;target.current=el;
  const source=dialog?el:window;let max=0,frame=0,style={};
  const paint=()=>{frame=0;const progress=max>0?Math.max(0,Math.min(1,el.scrollTop/max)):0;setState(previous=>Math.abs(previous.progress-progress)<.002?previous:{...previous,progress});};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const measure=()=>{max=el.scrollHeight-el.clientHeight;if(dialog){const rect=el.getBoundingClientRect();style={top:rect.top+18,right:innerWidth-rect.right+1,height:Math.max(0,rect.height-36)};}setState({progress:max>0?Math.max(0,Math.min(1,el.scrollTop/max)):0,visible:max>1,interactive:media.matches,style});el.classList.toggle('bean-scroll-ready',media.matches&&max>1);};
  const observer=new ResizeObserver(measure);observer.observe(el);if(dialog&&el.firstElementChild)observer.observe(el.firstElementChild);if(!dialog&&document.querySelector('#root'))observer.observe(document.querySelector('#root'));
  source.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure);media.addEventListener('change',measure);measure();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();source.removeEventListener('scroll',schedule);window.removeEventListener('resize',measure);media.removeEventListener('change',measure);el.classList.remove('bean-scroll-ready');};
 },[dialog]);
 const scroll=e=>{const el=target.current;el.scrollTo({top:Number(e.target.value)*(el.scrollHeight-el.clientHeight)/1000,behavior:'instant'});};
 return <div ref={rail} className={'bean-scrollbar '+(dialog?'dialog-scrollbar':'page-scrollbar')+(state.interactive?'':' mobile-bean-indicator')} style={{...state.style,display:state.visible?undefined:'none'}} aria-hidden={state.interactive?undefined:true}><span className="bean-scroll-line"/><span className="bean-scroll-thumb" style={{top:`calc(${state.progress*100}% - ${state.progress*54}px)`}}>{state.visible&&<BeanModel progress={state.progress}/>}</span>{state.interactive&&<input aria-label={dialog?'Scroll coffee form':'Scroll page'} type="range" min="0" max="1000" step="1" value={Math.round(state.progress*1000)} onChange={scroll} aria-valuetext={`${Math.round(state.progress*100)}% scrolled`} aria-orientation="vertical"/>}</div>;
}
