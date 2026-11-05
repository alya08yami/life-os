import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';
import {colors} from './tokens';
import React from 'react';import {View} from 'react-native';import type {ViewStyle} from 'react-native';import {useApp} from '../context';
export const glassSurface=(dark=false):ViewStyle=>({backgroundColor:dark?'#282C40':'#FBFAF9',borderWidth:1,borderColor:dark?'#45485B':'#EEECEA'});
export const gloss=(_primary=false,_dark=false):ViewStyle=>({});
export function GlassBackdrop({notes=false}:{notes?:boolean}={}){
 const {theme}=useApp().state.settings;
 const notesGradient=notes&&theme==='mist';
 const stops=notesGradient?['#9e9de0','#c8c7ed','#f4f3fc']:theme==='minimal'?['#f1dbe2','#eae2e9','#d9e0eb']:theme==='mist'?['#8589e3','#a1b2ee','#eef0ff']:undefined;
 const id=React.useId().replace(/[^a-z0-9]/gi,'');
 return <View pointerEvents="none" style={{position:'absolute',inset:0,backgroundColor:colors[theme].bg}}>
  {stops&&<Svg width="100%" height="100%"><Defs><LinearGradient id={id} x1="0%" y1="0%" x2={theme==='mist'&&!notesGradient?'30%':'0%'} y2="100%">
   {stops.map((color,index)=><Stop key={color} offset={[0,theme==='mist'&&!notesGradient?0.4:0.5,theme==='mist'&&!notesGradient?0.72:1][index]} stopColor={color}/>)}
  </LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#'+id+')'}/></Svg>}
 </View>;
}
