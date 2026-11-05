import React,{useRef} from 'react';
import {Animated,Easing,Pressable,type PressableProps,type StyleProp,type ViewStyle} from 'react-native';
import {depthMotion,easing,motion,opacity,spring} from './system';
import {useReducedMotion} from './scope';

const AnimatedPressable=Animated.createAnimatedComponent(Pressable);

/**
 * Soft Motion touch feedback: the surface sinks in slightly (scale) on press and settles back with a soft spring.
 * With "reduce motion" on, it only dims briefly — no movement.
 */
export function SoftPressable({style,children,onPressIn,onPressOut,disabled,...rest}:Omit<PressableProps,'style'|'children'>&{style?:StyleProp<ViewStyle>;children?:React.ReactNode}){
 const reduced=useReducedMotion();
 const scale=useRef(new Animated.Value(1)).current;
 const dim=useRef(new Animated.Value(1)).current;
 const press=(down:boolean)=>{
  if(reduced){Animated.timing(dim,{toValue:down?opacity.pressed:1,duration:down?motion.press:motion.press*1.5,useNativeDriver:true}).start();return;}
  if(down)Animated.timing(scale,{toValue:depthMotion.pressScale,duration:motion.press,easing:Easing.bezier(...easing.standard),useNativeDriver:true}).start();
  else Animated.spring(scale,{toValue:1,...spring.soft,useNativeDriver:true}).start();
 };
 return <AnimatedPressable {...rest} disabled={disabled}
  onPressIn={event=>{press(true);onPressIn?.(event);}}
  onPressOut={event=>{press(false);onPressOut?.(event);}}
  style={[style,{transform:[{scale}],opacity:dim}]}>
  {children}
 </AnimatedPressable>;
}
