import {useMemo,useRef} from 'react';
import {getVisualViewport} from './keyboard';
import {Dimensions,PanResponder,Platform,type GestureResponderHandlers} from 'react-native';

/**
 * Horizontal swipe on one specific area (a calendar grid, a tab's content) — never a global handler.
 *
 * Priorities: vertical scrolling wins (the gesture is claimed only when clearly horizontal); swipes starting at either
 * screen edge are left to back gestures; nested horizontal carousels and row actions claim their own touches
 * first (we only capture in the bubble phase, after children decline). Left = next, right = previous.
 */
export function useHorizontalSwipe({onNext,onPrev,enabled=true,threshold=56,guard}:{onNext?:()=>void;onPrev?:()=>void;enabled?:boolean;threshold?:number;guard?:()=>boolean}):{panHandlers:GestureResponderHandlers;style:object}{
 const handlers=useRef({onNext,onPrev,enabled,guard});handlers.current={onNext,onPrev,enabled,guard};
 const pan=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponder:(e,g)=>{
   const h=handlers.current;if(!h.enabled||(h.guard&&!h.guard()))return false;
   if(keyboardOpen())return false; // typing: never switch anything
   if(insideHorizontalScroller(e))return false; // a carousel scrolls itself
   const startX=g.moveX-g.dx;
   // Edges belong to back gestures: the app's swipe-back starts at the right edge, browsers' at the left edge.
   if(startX<28||startX>Dimensions.get('window').width-28)return false;
   if(Math.abs(g.dx)<16||Math.abs(g.dx)<2*Math.abs(g.dy))return false;
   return g.dx<0?!!h.onNext:!!h.onPrev;
  },
  // Once a horizontal swipe belongs to this area (a calendar grid inside a tabbed screen), outer areas cannot take it over.
  onPanResponderTerminationRequest:()=>false,
  onPanResponderRelease:(_,g)=>{
   const h=handlers.current;
   if(Math.abs(g.dx)<threshold||Math.abs(g.dx)<1.5*Math.abs(g.dy))return;
   if(g.dx<0)h.onNext?.();else h.onPrev?.();
  },
 }),[threshold]);
 return {panHandlers:pan.panHandlers,style:Platform.OS==='web'?{touchAction:'pan-y'}:{}};
}

const keyboardOpen=()=>getVisualViewport().keyboard;
/** Web: true when the touch started inside an element that scrolls horizontally (a carousel such as the week of dishes). */
function insideHorizontalScroller(e:unknown):boolean{
 if(Platform.OS!=='web'||typeof window==='undefined')return false;
 let el=((e as {target?:unknown}).target??(e as {nativeEvent?:{target?:unknown}}).nativeEvent?.target) as HTMLElement|null|undefined;
 for(let i=0;el&&i<30;i++,el=el.parentElement){
  if(el.scrollWidth>el.clientWidth+2){const o=getComputedStyle(el).overflowX;if(o==='auto'||o==='scroll')return true;}
 }
 return false;
}
