import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useKeyboardFrame} from './keyboard';
import {Animated,Easing,Modal,PanResponder,Pressable,View,type StyleProp,type ViewStyle} from 'react-native';
import {useApp} from '../context';
import {useDesignScope,useReducedMotion} from './scope';
import {easing,gestures,motion,spring} from './system';
import {useBackOverlay} from '../planner/navigation';

/**
 * Soft Motion is active only in the Soft Future theme and never inside a frozen zone («Покупки и желания»),
 * so every other theme and the frozen screens keep their exact previous behaviour.
 */
export function useSoftMotion(){
 const theme=useApp().state.settings.theme;
 const scope=useDesignScope();
 const reduced=useReducedMotion();
 return {enabled:theme==='soft'&&scope!=='frozen',reduced};
}
export const ease=(curve:readonly number[])=>Easing.bezier(curve[0],curve[1],curve[2],curve[3]);

/**
 * Bottom sheet / menu with Soft Motion: the scrim fades in, the panel rises with a gentle spring,
 * and on close both play backwards before the Modal unmounts (so closing is never an abrupt cut).
 * With reduce-motion the panel only fades. When Soft Motion is off it behaves like the previous Modal.
 */
/**
 * `skipExit`: close at once, without the exit animation. Used when closing hands over to a field elsewhere
 * (a menu item that opens an editor): while a sheet plays its exit it is still a modal and pulls focus back into
 * itself, which would close the iPhone keyboard the next field just opened.
 */
export function SoftSheet({visible,onRequestClose,children,panelStyle,align='bottom',legacyAnimation='slide',skipExit=false}:{
 visible:boolean;onRequestClose:()=>void;children:React.ReactNode;panelStyle?:StyleProp<ViewStyle>;
 align?:'bottom'|'center';legacyAnimation?:'slide'|'fade';skipExit?:boolean;
}){
 const {enabled,reduced}=useSoftMotion();
 // «Назад» (swipe / system / header) closes the open sheet first, instead of rolling back the screen under it.
 useBackOverlay(visible,onRequestClose);
 // While the iPhone keyboard is open the sheet sits over the visible area above it (see design/keyboard).
 const frame=useKeyboardFrame(true);
 const [mounted,setMounted]=useState(visible);
 const progress=useRef(new Animated.Value(0)).current;
 // Drag down to close — only from the top strip of a bottom sheet, so scrolling inside the sheet never conflicts.
 const drag=useRef(new Animated.Value(0)).current;
 // The sheet's container fills the window, so the panel's layout y is its top on screen (transforms aside).
 const panelTop=useRef<number|null>(null);
 const closeRef=useRef(onRequestClose);closeRef.current=onRequestClose;
 const dragResponder=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>false,
  // start must be in the top strip of the panel (the finger start = current position − distance moved)
  onMoveShouldSetPanResponder:(_,g)=>{const start=g.moveY-g.dy;return panelTop.current!==null&&start>=panelTop.current-4&&start<=panelTop.current+36&&g.dy>6&&Math.abs(g.dy)>Math.abs(g.dx);},
  onPanResponderMove:(_,g)=>drag.setValue(Math.max(0,g.dy)),
  onPanResponderRelease:(_,g)=>{
   if(g.dy>gestures.sheetDismiss||g.vy>gestures.flingVelocity)closeRef.current();
   else Animated.spring(drag,{toValue:0,...spring.snappy,useNativeDriver:true}).start();
  },
  onPanResponderTerminate:()=>Animated.spring(drag,{toValue:0,...spring.snappy,useNativeDriver:true}).start(),
 }),[]);
 useEffect(()=>{
  if(!enabled)return;
  if(visible){
   drag.setValue(0);
   setMounted(true);
   progress.stopAnimation();
   if(reduced)Animated.timing(progress,{toValue:1,duration:motion.press,useNativeDriver:true}).start();
   else Animated.spring(progress,{toValue:1,...spring.sheet,useNativeDriver:true}).start();
  }else if(mounted){
   Animated.timing(progress,{toValue:0,duration:reduced?motion.press:motion.menu,easing:ease(easing.exit),useNativeDriver:true})
    .start(({finished})=>{if(finished)setMounted(false);});
  }
 },[visible,enabled,reduced]);
 if(!enabled)return <Modal visible={visible} transparent animationType={skipExit&&!visible?'none':legacyAnimation} onRequestClose={onRequestClose}>
  <View style={[{flex:1,backgroundColor:'#0005',justifyContent:align==='bottom'?'flex-end':'center',alignItems:'center'},frame]}>
   <Pressable accessibilityLabel="Закрыть" onPress={onRequestClose} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
   <View style={[{width:'100%'},panelStyle]}>{children}</View>
  </View>
 </Modal>;
 const rise=progress.interpolate({inputRange:[0,1],outputRange:reduced?[0,0]:[align==='bottom'?48:12,0]});
 const scale=progress.interpolate({inputRange:[0,1],outputRange:reduced||align==='bottom'?[1,1]:[0.96,1]});
 // `visible` counts at once (not only after the mount effect): the sheet's fields are in the page in the same render
 // as the tap that opened it, so an autofocused field gets the keyboard on the first tap (see design/instant).
 return <Modal visible={visible||mounted&&!skipExit} transparent animationType="none" onRequestClose={onRequestClose}>
  <View style={[{flex:1,justifyContent:align==='bottom'?'flex-end':'center',alignItems:'center'},frame]}>
   <Animated.View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(30,26,34,0.34)',opacity:progress}}/>
   <Pressable accessibilityLabel="Закрыть" onPress={onRequestClose} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
   <Animated.View {...(align==='bottom'?dragResponder.panHandlers:{})} onLayout={e=>{panelTop.current=e.nativeEvent.layout.y;}} style={[{width:'100%',opacity:progress,transform:[{translateY:Animated.add(rise,drag)},{scale}]},panelStyle]}>
    {children}
   </Animated.View>
  </View>
 </Modal>;
}

/** Items appear one after another with a short delay (capped so long lists never feel slow). */
export function StaggerIn({index,children,style}:{index:number;children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 const {enabled,reduced}=useSoftMotion();
 const value=useRef(new Animated.Value(enabled&&!reduced?0:1)).current;
 useEffect(()=>{
  if(!enabled||reduced){value.setValue(1);return;}
  Animated.timing(value,{toValue:1,duration:motion.tab,delay:60+Math.min(index,6)*motion.stagger,easing:ease(easing.enter),useNativeDriver:true}).start();
 },[]);
 return <Animated.View style={[style,{opacity:value,transform:[{translateY:value.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}]}>{children}</Animated.View>;
}

/** New screen content settles in softly: a short fade with a few pixels of rise. */
export function FadeRise({children,style,play=true}:{children:React.ReactNode;style?:StyleProp<ViewStyle>;play?:boolean}){
 const {enabled,reduced}=useSoftMotion();
 const active=enabled&&play;
 const value=useRef(new Animated.Value(active?0:1)).current;
 useEffect(()=>{
  if(!active){value.setValue(1);return;}
  Animated.timing(value,{toValue:1,duration:reduced?motion.press:motion.cardExpand,easing:ease(easing.enter),useNativeDriver:true}).start();
 },[]);
 if(!active)return <View style={style}>{children}</View>;
 return <Animated.View style={[style,{opacity:value,transform:[{translateY:value.interpolate({inputRange:[0,1],outputRange:reduced?[0,0]:[10,0]})}]}]}>{children}</Animated.View>;
}
