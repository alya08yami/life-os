import {useEffect,useState} from 'react';
import {Platform} from 'react-native';
/**
 * Height of the on-screen keyboard over the page (web / installed app). iOS does not resize the page for the keyboard,
 * it only shrinks the visual viewport, so bottom sheets lift themselves by this amount to keep their buttons visible.
 * Native returns 0: the native Modal is handled by the system.
 */
export function useKeyboardInset():number{
 const [inset,setInset]=useState(0);
 useEffect(()=>{
  if(Platform.OS!=='web')return;
  const vv=(globalThis as any).visualViewport as VisualViewport|undefined;if(!vv)return;
  const update=()=>{const h=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));setInset(h>80?h:0);};
  vv.addEventListener('resize',update);vv.addEventListener('scroll',update);update();
  return ()=>{vv.removeEventListener('resize',update);vv.removeEventListener('scroll',update);};
 },[]);
 return inset;
}
