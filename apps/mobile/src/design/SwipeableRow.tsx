import React,{createContext,useContext,useMemo,useRef,useState} from 'react';
import {Animated,Dimensions,PanResponder,Platform,Pressable,View} from 'react-native';
import {Icon,type IconName} from '../components/Icon';
import {Text} from 'react-native';
import {useSoftMotion,ease} from './motion';
import {easing,gestures,motion,palette,shadows,spring} from './system';

/**
 * Gesture Navigation · swipeable list row (Soft Future only; elsewhere it renders the row untouched).
 *
 * Right swipe  → the row's main action ("Выполнено" / "Куплено"), committed past ~⅓ of the width or with a quick fling.
 * Left swipe   → reveals a small set of real actions (edit, archive…); tapping the row or swiping back closes it.
 * Safety: starts only for a clearly horizontal move (slop + |dx| > 1.6·|dy|), never from the outer screen edges
 * (system back / app swipe-back live there), never commits on a short accidental move, one open row at a time.
 * Every action stays reachable without gestures (checkbox, card, menu) and through screen-reader actions.
 */
export type SwipeAction={key:string;label:string;icon:IconName;onPress:()=>unknown;tone?:'neutral'|'muted'|'danger';
 /** The action removes the row from the list (e.g. archive): collapse it smoothly first. */
 collapse?:boolean};
type Props={
 children:React.ReactNode;
 complete?:{label:string;icon?:IconName;onCommit:()=>Promise<unknown>|unknown};
 actions?:SwipeAction[];
 /** Row disappears from the list after the main action: collapse it smoothly instead of letting the list jump. */
 collapseOnComplete?:boolean;
 /** Opaque colour under the moving row (matches the list surface). */
 surface:string;
 testID?:string;
};
const ACTION_WIDTH=78;
const toneColor={neutral:palette.slate,muted:palette.mauve,danger:palette.danger};
const RowContext=createContext<{openActions?:()=>void}>({});
/** Lets a row's own long-press open the same actions as a left swipe. */
export const useSwipeRow=()=>useContext(RowContext);

let openRow:{close:()=>void}|null=null;

export function SwipeableRow(props:Props){
 const {enabled}=useSoftMotion();
 if(!enabled)return <>{props.children}</>;
 return <ActiveSwipeableRow {...props}/>;
}

function ActiveSwipeableRow({children,complete,actions=[],collapseOnComplete=false,surface,testID}:Props){
 const {reduced}=useSoftMotion();
 const x=useRef(new Animated.Value(0)).current;
 const height=useRef(new Animated.Value(0)).current;
 const measured=useRef(0);
 const [collapsing,setCollapsing]=useState(false);
 const [active,setActive]=useState(false);
 const [open,setOpen]=useState(false);
 const width=useRef(0);
 const base=useRef(0);
 const busy=useRef(false);
 const isOpen=useRef(false);
 const actionsWidth=actions.length*ACTION_WIDTH;
 const self=useRef<{close:()=>void}>({close:()=>{}});
 const mounted=useRef(true);
 React.useEffect(()=>()=>{mounted.current=false;},[]);
 const collapse=()=>new Promise<void>(resolve=>{
  if(!measured.current){resolve();return;}
  height.setValue(measured.current);setCollapsing(true);
  Animated.timing(height,{toValue:0,duration:reduced?motion.press:motion.listReflow,easing:ease(easing.standard),useNativeDriver:false}).start(()=>resolve());
 });
 /** If the list keeps the row after all (e.g. it stays as completed), bring it back instead of leaving a gap. */
 const reappearIfKept=()=>setTimeout(()=>{if(!mounted.current)return;Animated.timing(height,{toValue:measured.current,duration:motion.listReflow,useNativeDriver:false}).start(()=>{setCollapsing(false);});x.setValue(0);setActive(false);busy.current=false;},1500);
 // Own velocity tracking (last ~80 ms of movement): gestureState.vx is unreliable on some platforms.
 const samples=useRef<{t:number;dx:number}[]>([]);
 const velocity=()=>{const list=samples.current;if(list.length<2)return 0;const last=list[list.length-1];const first=list.find(s=>last.t-s.t<=80)??list[0];const dt=last.t-first.t;return dt>0?(last.dx-first.dx)/dt:0;};

 const settle=(to:number,done?:()=>void)=>{
  const anim=reduced?Animated.timing(x,{toValue:to,duration:motion.press,useNativeDriver:true}):Animated.spring(x,{toValue:to,...spring.snappy,useNativeDriver:true});
  anim.start(()=>done?.());
 };
 const close=()=>{isOpen.current=false;setOpen(false);if(openRow===self.current)openRow=null;settle(0,()=>setActive(false));};
 self.current.close=close;
 const openActions=()=>{
  if(!actions.length||busy.current)return;
  if(openRow&&openRow!==self.current)openRow.close();
  openRow=self.current;isOpen.current=true;setOpen(true);setActive(true);settle(-actionsWidth);
 };
 const commit=()=>{
  if(!complete||busy.current)return;
  busy.current=true;
  Animated.timing(x,{toValue:width.current||400,duration:reduced?motion.press:180,easing:ease(easing.exit),useNativeDriver:true}).start(async()=>{
   const restore=()=>{settle(0,()=>setActive(false));busy.current=false;};
   try{
    if(collapseOnComplete){await collapse();await complete.onCommit();reappearIfKept();return;}
    await complete.onCommit();
    // The row stays in the list in its new state: slide it back in.
    restore();
   }catch{
    setCollapsing(false);restore();
   }
  });
 };

 const responder=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponderCapture:(_,g)=>{
   if(busy.current)return false;
   const screen=Dimensions.get('window').width;
   const edge=gestures.edgeGuard+4;
   // gestureState.x0 is only filled after the grant, so derive where the finger started from the current position.
   const startX=g.moveX-g.dx;
   if(startX<edge||startX>screen-edge)return false;
   if(Math.abs(g.dx)<gestures.slop||Math.abs(g.dx)<gestures.horizontalRatio*Math.abs(g.dy))return false;
   if(isOpen.current)return true;
   return g.dx>0?!!complete:actions.length>0;
  },
  onPanResponderGrant:()=>{
   if(openRow&&openRow!==self.current)openRow.close();
   x.stopAnimation(value=>{base.current=value;});
   samples.current=[];
   setActive(true);
  },
  onPanResponderMove:(_,g)=>{
   samples.current.push({t:Date.now(),dx:g.dx});if(samples.current.length>12)samples.current.shift();
   let d=base.current+g.dx;
   if(d>0&&!complete)d=d*0.15;
   if(d<0&&!actions.length)d=d*0.15;
   if(d<-actionsWidth)d=-actionsWidth+(d+actionsWidth)*0.25;
   if(width.current&&d>width.current)d=width.current;
   x.setValue(d);
  },
  onPanResponderTerminationRequest:()=>false,
  onPanResponderRelease:(_,g)=>{
   const d=base.current+g.dx;
   const vx=velocity()||g.vx;
   if(d>0){
    const far=width.current&&d>width.current*gestures.rowCommit;
    const fling=vx>gestures.flingVelocity&&d>48;
    if(complete&&!isOpen.current&&(far||fling)){commit();return;}
    close();return;
   }
   if(actions.length&&(-d>actionsWidth*0.45||vx<-gestures.flingVelocity))openActions();
   else close();
  },
  onPanResponderTerminate:()=>{if(isOpen.current)settle(-actionsWidth);else close();},
 }),[complete,actions.length,actionsWidth,reduced]);

 const doneOpacity=x.interpolate({inputRange:[0,28],outputRange:[0,1],extrapolate:'clamp'});
 const actionsOpacity=x.interpolate({inputRange:[-28,0],outputRange:[1,0],extrapolate:'clamp'});
 const a11y=[...(complete?[{name:'complete',label:complete.label}]:[]),...actions.map(a=>({name:a.key,label:a.label}))];
 return <Animated.View testID={testID} onLayout={e=>{width.current=e.nativeEvent.layout.width;if(!collapsing)measured.current=e.nativeEvent.layout.height;}}
  accessibilityActions={a11y} onAccessibilityAction={e=>{const name=e.nativeEvent.actionName;if(name==='complete')commit();else actions.find(a=>a.key===name)?.onPress();}}
  style={[{overflow:'hidden'},collapsing?{height,opacity:height.interpolate({inputRange:[0,Math.max(1,measured.current)],outputRange:[0,1]})}:null,
   Platform.OS==='web'?({touchAction:'pan-y'} as object):null]}>
  {active&&complete&&<Animated.View pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:palette.positive,borderRadius:14,opacity:doneOpacity,flexDirection:'row',alignItems:'center',paddingLeft:18,gap:8}}>
   <Icon name={complete.icon??'check'} color="#fff" size={18}/><Text style={{color:'#fff',fontFamily:'Inter',fontSize:13,fontWeight:'600'}}>{complete.label}</Text>
  </Animated.View>}
  {active&&actions.length>0&&<Animated.View style={{position:'absolute',top:0,bottom:0,right:0,width:actionsWidth,flexDirection:'row',opacity:actionsOpacity}}>
   {actions.map(action=><Pressable key={action.key} accessibilityRole="button" accessibilityLabel={action.label}
    onPress={async()=>{
     if(action.collapse&&!busy.current){busy.current=true;isOpen.current=false;setOpen(false);if(openRow===self.current)openRow=null;await collapse();try{await action.onPress();reappearIfKept();}catch{setCollapsing(false);x.setValue(0);setActive(false);busy.current=false;}return;}
     close();action.onPress();}}
    style={{width:ACTION_WIDTH,alignItems:'center',justifyContent:'center',gap:4,backgroundColor:toneColor[action.tone??'neutral']}}>
    <Icon name={action.icon} color="#fff" size={18}/><Text style={{color:'#fff',fontFamily:'Inter',fontSize:11}}>{action.label}</Text>
   </Pressable>)}
  </Animated.View>}
  <Animated.View {...responder.panHandlers} style={[{transform:[{translateX:x}]},active?{backgroundColor:surface,borderRadius:14,...shadows[2]}:null]}>
   <RowContext.Provider value={{openActions}}>{children}</RowContext.Provider>
   {open&&<Pressable accessibilityLabel="Закрыть действия" onPress={close} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>}
  </Animated.View>
 </Animated.View>;
}
