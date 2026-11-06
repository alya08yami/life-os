import React,{createContext,useCallback,useContext,useEffect,useRef} from 'react';
import {Animated,Platform,type StyleProp,type ViewStyle} from 'react-native';
import {router,useFocusEffect,useRootNavigationState,type Href} from 'expo-router';
import {useReducedMotion} from './scope';

/**
 * Screen transitions · horizontal slide (all themes).
 *
 * The route changes immediately on tap — no cover, no waiting for an animation before the screen exists.
 * The new screen's content then slides in a short distance from the right (forward) or from the left (back) while
 * fading from 85 % to full. The bottom bar and the page background never move. Reduce Motion: no movement.
 *
 * Direction is read from the root stack: a deeper stack index is "forward", a shallower one "back" (covers the
 * header back button, the swipe-back gesture, browser/system Back and notifications/search opening a record).
 */
type Rect={x:number;y:number;width:number;height:number};
const Context=createContext<{navigate:(href:Href,rect?:Rect)=>void}>({navigate:href=>router.push(href)});
export const useSoftNavigation=()=>useContext(Context);

let direction:'forward'|'back'|'none'='none';
let lastIndex=-1;let lastKey='';
/** Tracks the root stack so screens know which way to slide in. */
function DirectionTracker(){
 const state=useRootNavigationState() as {index?:number;routes?:{key:string}[]}|undefined;
 const index=state?.index??0;const key=state?.routes?.[index]?.key??'';
 if(key!==lastKey){direction=lastIndex<0?'none':index>lastIndex?'forward':index<lastIndex?'back':'none';lastIndex=index;lastKey=key;}
 return null;
}

export function SoftTransitionProvider({children}:{children:React.ReactNode}){
 const navigate=useCallback((href:Href)=>{router.push(href);},[]);
 return <Context.Provider value={{navigate}}><DirectionTracker/>{children}</Context.Provider>;
}

const DISTANCE=28;
/** Wraps a screen's content (not its header background or bottom bar) with the slide-in. */
export function ScreenSlide({children,style,enabled=true}:{children:React.ReactNode;style?:StyleProp<ViewStyle>;enabled?:boolean}){
 const reduced=useReducedMotion();
 const x=useRef(new Animated.Value(0)).current;const o=useRef(new Animated.Value(1)).current;
 const first=useRef(true);
 const play=useCallback(()=>{
  const dir=direction;direction='none';
  if(!enabled||reduced||dir==='none'){x.setValue(0);o.setValue(1);return;}
  x.setValue(dir==='forward'?DISTANCE:-DISTANCE);o.setValue(0.85);
  Animated.parallel([
   Animated.timing(x,{toValue:0,duration:220,easing:t=>1-Math.pow(1-t,3),useNativeDriver:Platform.OS!=='web'}),
   Animated.timing(o,{toValue:1,duration:180,useNativeDriver:Platform.OS!=='web'}),
  ]).start();
 },[enabled,reduced]);
 useFocusEffect(useCallback(()=>{play();first.current=false;},[play]));
 useEffect(()=>()=>{x.stopAnimation();o.stopAnimation();},[]);
 return <Animated.View style={[{flex:1,opacity:o,transform:[{translateX:x}]},style]}>{children}</Animated.View>;
}
