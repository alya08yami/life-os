import React, {useEffect,useRef} from 'react';
import {AccessibilityInfo,Animated,Platform,View} from 'react-native';
import {StatusCheckbox} from './ui';

let audio: AudioContext | undefined;

function playChime(){
  if(Platform.OS!=='web'||typeof AudioContext==='undefined')return;
  try{
    audio ??= new AudioContext();
    const context=audio;
    void context.resume().then(()=>{
      const now=context.currentTime;
      [659.25,783.99,1046.50,1318.51].forEach((frequency,index)=>{
        const start=now+index*0.055;
        const note=context.createOscillator();
        const volume=context.createGain();
        note.type='triangle';
        note.frequency.value=frequency;
        volume.gain.setValueAtTime(0.001,start);
        volume.gain.exponentialRampToValueAtTime((index===3?0.035:0.09),start+0.012);
        volume.gain.exponentialRampToValueAtTime(0.001,start+0.27);
        note.connect(volume).connect(context.destination);
        note.onended=()=>{note.disconnect();volume.disconnect();};
        note.start(start);
        note.stop(start+0.28);
      });
    }).catch(()=>{});
  }catch{}
}

export function HabitCheckbox({checked,onPress,outline}:{checked:boolean;onPress:()=>void;outline?:string}){
  const pulse=useRef(new Animated.Value(1)).current;
  const reduced=useRef(false);
  useEffect(()=>{
    if(Platform.OS==='web'){
      const query=window.matchMedia('(prefers-reduced-motion: reduce)');
      const sync=()=>{reduced.current=query.matches;};
      sync();
      query.addEventListener('change',sync);
      return ()=>{query.removeEventListener('change',sync);pulse.stopAnimation();};
    }
    const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>{reduced.current=value;});
    void AccessibilityInfo.isReduceMotionEnabled().then(value=>{reduced.current=value;});
    return ()=>{listener.remove();pulse.stopAnimation();};
  },[pulse]);
  return <View style={{alignItems:'center',justifyContent:'center',zIndex:1}}>
    <StatusCheckbox checked={checked} tone="green" outline={outline} onPress={()=>{
      if(!checked){
        playChime();
        if(!reduced.current){
          pulse.stopAnimation();
          pulse.setValue(0);
          Animated.timing(pulse,{toValue:1,duration:540,useNativeDriver:true}).start();
        }
      }
      onPress();
    }}/>
    <Animated.View pointerEvents="none" accessible={false} style={{
      position:'absolute',width:25,height:25,borderRadius:13,borderWidth:2,borderColor:'#56b793',
      opacity:pulse.interpolate({inputRange:[0,0.2,1],outputRange:[0.85,1,0]}),
      transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[0.7,2.15]})}],
    }}/>
  </View>;
}
