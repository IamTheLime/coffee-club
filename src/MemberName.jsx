import React from 'react';
export default function MemberName({name}){
 return <span className="member-name"><img src={'/assets/avatars/'+name.toLowerCase()+'.png'} width="24" height="24" alt="" aria-hidden="true"/>{name}</span>;
}
