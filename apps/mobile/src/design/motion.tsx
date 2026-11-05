import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Modal,Pressable,View,type StyleProp,type ViewStyle} from 'react-native';
import {useApp} from '../context';
import {useDesignScope,useReducedMotion} from './scope';
import {easing,motion,spring} from './system';

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
export function SoftSheet({visible,onRequestClose,children,panelStyle,align='bottom',legacyAnimation='slide'}:{
 visible:boolean;onRequestClose:()=>void;children:React.ReactNode;panelStyle?:StyleProp<ViewStyle>;
 align?:'bottom'|'center';legacyAnimation?:'slide'|'fade';
}){
 const {enabled,reduced}=useSoftMotion();
 const [mounted,setMounted]=useState(visible);
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  if(!enabled)return;
  if(visible){
   setMounted(true);
   progress.stopAnimation();
   if(reduced)Animated.timing(progress,{toValue:1,duration:motion.press,useNativeDriver:true}).start();
   else Animated.spring(progress,{toValue:1,...spring.sheet,useNativeDriver:true}).start();
  }else if(mounted){
   Animated.timing(progress,{toValue:0,duration:reduced?motion.press:motion.menu,easing:ease(easing.exit),useNativeDriver:true})
    .start(({finished})=>{if(finished)setMounted(false);});
  }
 },[visible,enabled,reduced]);
 if(!enabled)return <Modal visible={visible} transparent animationType={legacyAnimation} onRequestClose={onRequestClose}>
  <View style={{flex:1,backgroundColor:'#0005',justifyContent:align==='bottom'?'flex-end':'center',alignItems:'center'}}>
   <Pressable accessibilityLabel="Закрыть" onPress={onRequestClose} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
   <View style={[{width:'100%'},panelStyle]}>{children}</View>
  </View>
 </Modal>;
 const rise=progress.interpolate({inputRange:[0,1],outputRange:reduced?[0,0]:[align==='bottom'?48:12,0]});
 const scale=progress.interpolate({inputRange:[0,1],outputRange:reduced||align==='bottom'?[1,1]:[0.96,1]});
 return <Modal visible={mounted} transparent animationType="none" onRequestClose={onRequestClose}>
  <View style={{flex:1,justifyContent:align==='bottom'?'flex-end':'center',alignItems:'center'}}>
   <Animated.View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(30,26,34,0.34)',opacity:progress}}/>
   <Pressable accessibilityLabel="Закрыть" onPress={onRequestClose} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
   <Animated.View style={[{width:'100%',opacity:progress,transform:[{translateY:rise},{scale}]},panelStyle]}>{children}</Animated.View>
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
