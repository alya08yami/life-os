import {useSyncExternalStore} from 'react';
import {Platform} from 'react-native';

/**
 * On-screen keyboard in the browser / installed web app (iPhone).
 *
 * iOS does not resize the page for the keyboard: it shrinks the *visual* viewport and may pan it (offsetTop > 0) to
 * reveal the focused field. While the keyboard is open, the app root and bottom sheets are placed over exactly that
 * visible area, so the content sits above the keyboard and scrolls inside its own ScrollView.
 *
 * Stability rules (iOS fires dozens of visualViewport events while the keyboard slides):
 * - React only hears about the keyboard opening or closing (one render each way). The visible area itself is written
 *   to CSS variables (`--lifeos-vv-top`, `--lifeos-vv-height`) once per animation frame, so the app tree never
 *   re-renders during the keyboard animation and the focused field is never re-created.
 * - The focused field is revealed by scrolling only its own scroll container, and only if it is actually hidden;
 *   the document itself is not scrolled (that fought with iOS and made fields jump).
 * Native returns "no keyboard": the system handles it.
 */
export type VisualViewportState={keyboard:boolean;top:number;pageTop:number;height:number;inset:number};
const CLOSED:VisualViewportState={keyboard:false,top:0,pageTop:0,height:0,inset:0};
let current=CLOSED;
let open=false;
const listeners=new Set<()=>void>();
let attached=false;
let frame=0;

const editable=(el:Element|null|undefined):el is HTMLElement=>!!el&&(/^(INPUT|TEXTAREA)$/.test(el.tagName)||(el as HTMLElement).isContentEditable===true);

function read():VisualViewportState{
 const vv=(globalThis as any).visualViewport as VisualViewport|undefined;
 if(!vv||typeof window==='undefined')return CLOSED;
 const inset=Math.max(0,Math.round(window.innerHeight-vv.height-vv.offsetTop));
 const editing=typeof document!=='undefined'&&editable(document.activeElement);
 // Keyboard = a large part of the window is covered while a text field has focus (ignores small toolbar changes).
 const keyboard=window.innerHeight-vv.height>120&&editing;
 // pageTop = document scroll + visual offset: the visible area in page coordinates, so the frame stays right even if
 // iOS scrolled the document to reveal the field (no need to fight that scroll while typing).
 return keyboard?{keyboard,top:Math.round(vv.offsetTop),pageTop:Math.round(vv.pageTop??vv.offsetTop),height:Math.round(vv.height),inset}:CLOSED;
}
function apply(){
 frame=0;
 const next=read();
 current=next;
 const root=typeof document!=='undefined'?document.documentElement:undefined;
 if(root&&next.keyboard){root.style.setProperty('--lifeos-vv-top',next.top+'px');root.style.setProperty('--lifeos-vv-page-top',next.pageTop+'px');root.style.setProperty('--lifeos-vv-height',next.height+'px');}
 // The page never scrolls (body overflow hidden); only undo a document scroll iOS left behind once the keyboard is gone.
 if(!next.keyboard&&typeof document!=='undefined'&&document.scrollingElement&&document.scrollingElement.scrollTop!==0)document.scrollingElement.scrollTop=0;
 if(next.keyboard!==open){open=next.keyboard;listeners.forEach(l=>l());}
}
function schedule(){if(frame)return;frame=typeof requestAnimationFrame==='function'?requestAnimationFrame(apply):(setTimeout(apply,16) as unknown as number);}

/** Scrolls the field's nearest scrollable ancestor (never the document) so the field is inside the visible area. */
function reveal(el:HTMLElement){
 const vv=(globalThis as any).visualViewport as VisualViewport|undefined;
 const top=vv?vv.offsetTop:0;const bottom=top+(vv?vv.height:window.innerHeight);
 const rect=el.getBoundingClientRect();const margin=16;
 if(rect.top>=top+margin&&rect.bottom<=bottom-margin)return;
 let parent=el.parentElement;
 while(parent&&parent!==document.body){const style=getComputedStyle(parent);if(/(auto|scroll)/.test(style.overflowY)&&parent.scrollHeight>parent.clientHeight)break;parent=parent.parentElement;}
 if(!parent||parent===document.body)return;
 const delta=rect.bottom>bottom-margin?rect.bottom-(bottom-margin):rect.top-(top+margin);
 parent.scrollTop+=delta;
}

function attach(){
 if(attached||Platform.OS!=='web'||typeof window==='undefined')return;
 const vv=(globalThis as any).visualViewport as VisualViewport|undefined;if(!vv)return;
 attached=true;
 vv.addEventListener('resize',schedule);vv.addEventListener('scroll',schedule);
 // Focus changes may happen without a viewport event (switching fields); keep the focused field in view once the
 // keyboard has settled.
 let revealTimer:ReturnType<typeof setTimeout>|undefined;
 document.addEventListener('focusin',e=>{
  schedule();
  const el=e.target as HTMLElement|null;
  if(!editable(el))return;
  if(revealTimer)clearTimeout(revealTimer);
  revealTimer=setTimeout(()=>{if(document.activeElement===el){apply();try{reveal(el);}catch{/* old browsers */}}},320);
 });
 document.addEventListener('focusout',()=>setTimeout(schedule,80));
}
const subscribe=(l:()=>void)=>{attach();listeners.add(l);return ()=>{listeners.delete(l);};};
/** Snapshot changes only when the keyboard opens or closes, so subscribers render twice per editing session at most. */
let openSnapshot:VisualViewportState=CLOSED;
const snapshot=()=>{if(openSnapshot.keyboard!==open)openSnapshot=open?{...current,keyboard:true}:CLOSED;return openSnapshot;};

/** Current state without subscribing (for gesture handlers). */
export function getVisualViewport():VisualViewportState{attach();return read();}
/** Whether the keyboard is open (web). Numbers are a snapshot from the moment it opened; live values are in CSS vars. */
export function useVisualViewport():VisualViewportState{
 return useSyncExternalStore(subscribe,snapshot,()=>CLOSED);
}

/** Height of the keyboard when it opened; 0 when closed. Kept for existing callers (they only test for > 0). */
export function useKeyboardInset():number{
 const v=useVisualViewport();
 return v.keyboard?Math.max(1,v.inset):0;
}

/**
 * Style that places a full-screen container over the visible area while the keyboard is open (live via CSS vars).
 * `fixed`: the container lives in a fixed-position layer (Modal / sheet) — it follows the visual offset only;
 * otherwise (the app root, in page flow) it follows the page position, which includes any document scroll iOS made.
 */
export function useKeyboardFrame(fixed=false):object|undefined{
 const v=useVisualViewport();
 return Platform.OS==='web'&&v.keyboard?{position:'absolute',left:0,right:0,top:(fixed?'var(--lifeos-vv-top, 0px)':'var(--lifeos-vv-page-top, 0px)') as unknown as number,height:'var(--lifeos-vv-height, 100%)' as unknown as number}:undefined;
}
