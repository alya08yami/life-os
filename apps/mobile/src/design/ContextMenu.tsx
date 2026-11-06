import React,{useRef,useState} from 'react';
import {Animated,Modal,Platform,Pressable,useWindowDimensions} from 'react-native';
import {Icon,type IconName} from '../components/Icon';
import {T,usePlannerColors} from '../planner/ui';
import {useApp} from '../context';
import {useReducedMotion} from './scope';

export type MenuItem={key:string;label:string;icon:IconName;onPress:()=>void;danger?:boolean};

/**
 * «•••» — a light context menu for quick actions on one item (Navicon reference): a small rounded glass card that
 * drops down from the button with a few rows (thin icon + label), the destructive one in red. Closes on a tap outside,
 * on Back and after choosing. Only real actions are passed in.
 */
export function ContextMenu({items,label='Ещё',color,size=20}:{items:MenuItem[];label?:string;color?:string;size?:number}){
 const C=usePlannerColors();const theme=useApp().state.settings.theme;const reduced=useReducedMotion();
 const {width:screen,height:screenH}=useWindowDimensions();
 const button=useRef<any>(null);
 const [anchor,setAnchor]=useState<{x:number;y:number;w:number;h:number}|null>(null);
 const progress=useRef(new Animated.Value(0)).current;
 const open=()=>{button.current?.measureInWindow((x:number,y:number,w:number,h:number)=>{setAnchor({x,y,w,h});progress.setValue(0);Animated.timing(progress,{toValue:1,duration:reduced?90:170,useNativeDriver:Platform.OS!=='web'}).start();});};
 const close=(then?:()=>void)=>{Animated.timing(progress,{toValue:0,duration:reduced?60:120,useNativeDriver:Platform.OS!=='web'}).start(()=>{setAnchor(null);then?.();});};
 const soft=theme==='soft';
 const card=soft?{backgroundColor:'rgba(251,249,250,0.97)',borderColor:'rgba(41,38,45,0.08)'}:{backgroundColor:C.paper,borderColor:C.line};
 const W=Math.min(260,screen-32);
 const rowH=50;const height=items.length*rowH+12;
 const below=anchor?anchor.y+anchor.h+6+height<screenH-16:true;
 const top=anchor?(below?anchor.y+anchor.h+6:Math.max(16,anchor.y-6-height)):0;
 const left=anchor?Math.max(16,Math.min(screen-16-W,anchor.x+anchor.w-W)):0;
 return <>
  <Pressable ref={button} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{expanded:!!anchor}} aria-expanded={!!anchor} hitSlop={6} onPress={open}
   style={({pressed})=>({width:40,height:40,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:pressed||anchor?(soft?'rgba(41,38,45,0.07)':C.lavender):'transparent'})}>
   <Icon name="more" size={size} color={color??C.ink}/>
  </Pressable>
  <Modal visible={!!anchor} transparent animationType="none" onRequestClose={()=>close()}>
   <Pressable accessibilityLabel="Закрыть меню" onPress={()=>close()} style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(30,26,34,0.08)'}}/>
   {anchor&&<Animated.View accessibilityRole="menu" style={{position:'absolute',top,left,width:W,borderRadius:20,borderWidth:1,paddingVertical:6,...card,
    shadowColor:'#1E1A22',shadowOpacity:0.16,shadowRadius:24,shadowOffset:{width:0,height:10},elevation:8,
    ...(Platform.OS==='web'?{backdropFilter:'blur(18px) saturate(140%)'} as object:{}),
    opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:reduced?[0,0]:[below?-6:6,0]})},{scale:progress.interpolate({inputRange:[0,1],outputRange:reduced?[1,1]:[0.97,1]})}]}}>
    {items.map(item=><Pressable key={item.key} accessibilityRole="menuitem" accessibilityLabel={item.label} onPress={()=>close(item.onPress)}
     style={({pressed})=>({height:rowH,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:16,marginHorizontal:6,borderRadius:14,backgroundColor:pressed?(soft?'rgba(41,38,45,0.06)':C.lavender):'transparent'})}>
     <Icon name={item.icon} size={19} color={item.danger?'#C2545D':C.ink}/>
     <T size={15} color={item.danger?'#C2545D':C.ink}>{item.label}</T>
    </Pressable>)}
   </Animated.View>}
  </Modal>
 </>;
}
