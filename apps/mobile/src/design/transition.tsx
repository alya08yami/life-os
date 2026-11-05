import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {Animated,View,useWindowDimensions} from 'react-native';
import {router,usePathname,type Href} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useApp} from '../context';
import {useReducedMotion} from './scope';
import {softHome} from './themes';
import {easing,motion,radii,zIndex} from './system';
import {ease} from './motion';

/**
 * Soft Motion · dark home ↔ light screens (Soft Future only).
 *
 * Opening a category: the tapped glass card grows to the screen while its surface turns, gradually, into the milk
 * colour of the light screens; the route is pushed underneath and the cover dissolves — no white flash, no colour jump.
 * Other exits from home (search, settings, calendar…) use a soft milk veil instead of the card.
 * Returning to home plays the same thing backwards, starting from a fully light cover in the very same render
 * in which home reappears, so the dark gradient comes back without a flicker.
 * Reduce-motion: no movement, only a short cross-fade.
 */
type Rect={x:number;y:number;width:number;height:number};
type Departure={kind:'card';rect:Rect}|{kind:'veil'};
type Cover={departure:Departure;phase:'open'|'close'};
const MILK='#f4f0f2';
/** Space kept for the dark bottom bar, which stays visible above light screens. */
const NAV_RESERVE=84;

const Context=createContext<{navigate:(href:Href,rect?:Rect)=>void}>({navigate:href=>router.push(href)});
export const useSoftNavigation=()=>useContext(Context);

export function SoftTransitionProvider({children}:{children:React.ReactNode}){
 const soft=useApp().state.settings.theme==='soft';
 const path=usePathname();
 const reduced=useReducedMotion();
 const {width,height}=useWindowDimensions();
 const insets=useSafeAreaInsets();
 const progress=useRef(new Animated.Value(0)).current; // 0 = source (card / nothing), 1 = full milk cover
 const fade=useRef(new Animated.Value(1)).current;
 const [cover,setCover]=useState<Cover|null>(null);
 const departure=useRef<Departure|null>(null);
 const busy=useRef(false);
 const previous=useRef(path);
 const pendingReturn=useRef<Cover|null>(null);

 // Returning home: decide during render so the light cover is in the same frame as the home screen.
 let shown=cover;
 if(soft&&path==='/'&&previous.current!=='/'&&departure.current&&cover?.phase!=='close'){
  pendingReturn.current={departure:departure.current,phase:'close'};
  progress.setValue(1);fade.setValue(1);
  shown=pendingReturn.current;
 }
 if(previous.current!==path)previous.current=path;

 useEffect(()=>{
  const back=pendingReturn.current;
  if(!back)return;
  pendingReturn.current=null;departure.current=null;
  setCover(back);
  const duration=reduced?motion.press:back.departure.kind==='card'?motion.cardExpand:motion.tab+60;
  Animated.timing(progress,{toValue:0,duration,easing:ease(easing.standard),useNativeDriver:false})
   .start(()=>{setCover(null);busy.current=false;});
 },[path]);

 const navigate=useCallback((href:Href,rect?:Rect)=>{
  if(!soft){router.push(href);return;}
  if(busy.current)return; // ignore rapid repeated taps while a transition runs
  busy.current=true;
  const dep:Departure=rect&&!reduced?{kind:'card',rect:{...rect,y:rect.y-insets.top}}:{kind:'veil'};
  departure.current=dep;
  progress.setValue(0);fade.setValue(1);
  setCover({departure:dep,phase:'open'});
  const duration=reduced?motion.press:dep.kind==='card'?motion.cardExpand:motion.tab;
  Animated.timing(progress,{toValue:1,duration,easing:ease(easing.standard),useNativeDriver:false}).start(()=>{
   router.push(href);
   // give the light screen a couple of frames to paint under the cover, then dissolve it
   setTimeout(()=>Animated.timing(fade,{toValue:0,duration:reduced?motion.press:motion.tab,easing:ease(easing.exit),useNativeDriver:false})
    .start(()=>{setCover(null);busy.current=false;}),48);
  });
 },[soft,reduced,insets.top]);

 const full={x:0,y:0,width,height:Math.max(0,height-insets.top-NAV_RESERVE)};
 return <Context.Provider value={{navigate}}>
  {children}
  {soft&&shown&&<View pointerEvents="auto" style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:zIndex.modal}}>
   {shown.departure.kind==='card'
    ?<CardCover from={shown.departure.rect} to={full} progress={progress} fade={fade}/>
    :<Animated.View style={{position:'absolute',left:0,top:0,width:full.width,height:full.height,backgroundColor:MILK,
      opacity:Animated.multiply(progress,fade)}}/>}
  </View>}
 </Context.Provider>;
}

function CardCover({from,to,progress,fade}:{from:Rect;to:Rect;progress:Animated.Value;fade:Animated.Value}){
 const lerp=(a:number,b:number)=>progress.interpolate({inputRange:[0,1],outputRange:[a,b]});
 // The glass layer fades out while the milk layer fades in: the surface changes gradually, never mid-animation.
 const glass=progress.interpolate({inputRange:[0,0.06,0.55,1],outputRange:[0,1,0.5,0]});
 const milk=progress.interpolate({inputRange:[0,0.25,1],outputRange:[0,0.12,1]});
 return <Animated.View style={{position:'absolute',overflow:'hidden',opacity:fade,
  left:lerp(from.x,to.x),top:lerp(from.y,to.y),width:lerp(from.width,to.width),height:lerp(from.height,to.height),
  borderRadius:lerp(radii.card,0)}}>
  <Animated.View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:softHome.glass,borderWidth:1,borderColor:softHome.glassBorder,borderRadius:radii.card,opacity:glass}}/>
  <Animated.View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:MILK,opacity:milk}}/>
 </Animated.View>;
}
