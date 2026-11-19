import React from 'react';
export default function MemberName({name}){
 return <span className="member-name"><img src={'/assets/avatars/'+name.toLowerCase()+'.png'} width="16" height="16" alt="" aria-hidden="true"/>{name}</span>;
}
