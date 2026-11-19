import React from 'react';
export default function Character({name}){
 const descriptions={Tiago:'Bald pixel-art Tiago with dark brown eyes and a terracotta shirt',Sam:'Thin bald pixel-art Sam with blond eyebrows, glasses and a turtleneck',Archie:'Bald blue-eyed pixel-art Archie with a small central moustache, a tiny square torso and very long limbs'};
 return <div className="character-stage pixel-character"><img src={'/assets/characters/'+name.toLowerCase()+'.png'} alt={descriptions[name]} width="256" height="320"/></div>;
}
