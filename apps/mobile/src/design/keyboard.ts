import {useSyncExternalStore} from 'react';
import {Platform} from 'react-native';

/**
 * On-screen keyboard in the browser / installed web app (iPhone).
 *
 * iOS does not resize the page for the keyboard: it shrinks the *visual* viewport and may pan it (offsetTop > 0) to
 * reveal the focused field. Layouts that keep using the full window height then end up partly under the keyboard, or
 * shifted twice (our offset + the system pan) so the field leaves the screen.
 *
 * One shared listener tracks the visible area. While the keyboard is open, the app root and bottom sheets are placed
 * exactly over that area (top = offsetTop, height = visible height), so whatever iOS pans, the content sits above the
 * keyboard and scrolls inside its own ScrollView. Native returns "no keyboard": the system handles it.
 */
export type VisualViewportState={keyboard:boolean;top:number;height:number;inset:number};
const CLOSED:VisualViewportState={keyboard:false,top:0,height:0,inset:0};
let current=CLOSED;
const listeners=new Set<()=>void>();
let attached=false;

function read():VisualViewportState{
 const vv=(globalThis as any).visualViewport as VisualViewport|undefined;
 if(!vv||typeof window==='undefined')return CLOSED;
 const inset=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));
 const editing=typeof document!=='undefined'&&!!document.activeElement&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
 // Keyboard = a large part of the window is covered while a text field has focus (ignores small toolbar changes).
 const keyboard=window.innerHeight-vv.height>120&&editing;
 return keyboard?{keyboard,top:Math.round(vv.offsetTop),height:Math.round(vv.height),inset}:CLOSED;
}
function update(){
 const next=read();
 if(next.keyboard===current.keyboard&&next.top===current.top&&next.height===current.height)return;
 current=next;listeners.forEach(l=>l());
 // The page itself never scrolls (body overflow hidden); undo any scroll iOS applied to reveal a field.
 if(typeof document!=='undefined'&&document.scrollingElement&&document.scrollingElement.scrollTop!==0)document.scrollingElement.scrollTop=0;
}
function attach(){
 if(attached||Platform.OS!=='web'||typeof window==='undefined')return;
 const vv=(globalThis as any).visualViewport as VisualViewport|undefined;if(!vv)return;
 attached=true;
 vv.addEventListener('resize',update);vv.addEventListener('scroll',update);
 // Focus changes may happen without a viewport event (switching fields); keep the focused field in view.
 document.addEventListener('focusin',e=>{
  update();
  const el=e.target as HTMLElement|null;
  if(!el||!/^(INPUT|TEXTAREA)$/.test(el.tagName))return;
  setTimeout(()=>{update();try{el.scrollIntoView({block:'nearest',inline:'nearest'});}catch{/* old browsers */}if(document.scrollingElement)document.scrollingElement.scrollTop=0;},320);
 });
 document.addEventListener('focusout',()=>setTimeout(update,80));
}
const subscribe=(l:()=>void)=>{attach();listeners.add(l);return ()=>{listeners.delete(l);};};
const snapshot=()=>current;

/** Visible area above the on-screen keyboard (web). `keyboard` is false when no keyboard is shown. */
export function useVisualViewport():VisualViewportState{
 return useSyncExternalStore(subscribe,snapshot,()=>CLOSED);
}

/** Height of the keyboard over the page; 0 when closed. Kept for existing callers. */
export function useKeyboardInset():number{
 const v=useVisualViewport();
 return v.keyboard?v.inset:0;
}

/** Style that places a full-screen container over the visible area while the keyboard is open. */
export function useKeyboardFrame():object|undefined{
 const v=useVisualViewport();
 return Platform.OS==='web'&&v.keyboard?{position:'absolute',left:0,right:0,top:v.top,height:v.height}:undefined;
}
