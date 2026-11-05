import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';
import {colors} from './tokens';
import {gradients} from './system';
import {useEffectiveTheme} from './scope';
import React from 'react';import {View} from 'react-native';import type {ViewStyle} from 'react-native';import {useApp} from '../context';
export const glassSurface=(dark=false):ViewStyle=>({backgroundColor:dark?'#282C40':'#FBFAF9',borderWidth:1,borderColor:dark?'#45485B':'#EEECEA'});
export const gloss=(_primary=false,_dark=false):ViewStyle=>({});
export function GlassBackdrop({notes=false,home=false}:{notes?:boolean;home?:boolean}={}){
 const theme=useEffectiveTheme();
 // Soft Future: the home screen sits on the graphite → rose gradient; regular screens on a light milk → rose wash for readability.
 const soft=theme==='soft'?(home?[...gradients.background]:['#f4f0f2','#efe7eb','#e8dde3']):undefined;
 const notesGradient=notes&&theme==='mist';
 const stops=soft??(theme==='warm'?['#f8f5f1','#f5f1ec','#f8f5f1']:notesGradient?['#9e9de0','#c8c7ed','#f4f3fc']:theme==='minimal'?['#f1dbe2','#eae2e9','#d9e0eb']:theme==='mist'?['#8589e3','#a1b2ee','#eef0ff']:undefined);
 const id=React.useId().replace(/[^a-z0-9]/gi,'');
 return <View pointerEvents="none" style={{position:'absolute',inset:0,backgroundColor:colors[theme].bg}}>
  {stops&&<Svg width="100%" height="100%"><Defs><LinearGradient id={id} x1="0%" y1="0%" x2={theme==='mist'&&!notesGradient?'30%':'0%'} y2="100%">
   {stops.map((color,index)=><Stop key={color} offset={soft?(soft.length===5?gradients.backgroundStops[index]:index/(soft.length-1)):[0,theme==='mist'&&!notesGradient?0.4:0.5,theme==='mist'&&!notesGradient?0.72:1][index]} stopColor={color}/>)}
  </LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#'+id+')'}/></Svg>}
 </View>;
}
