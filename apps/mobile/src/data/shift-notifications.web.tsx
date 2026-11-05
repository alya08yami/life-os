import React,{useEffect,useState} from 'react';
import {View} from 'react-native';
import {router} from 'expo-router';
import {reminderPlan,type ReminderPlan,type SoundId,type ShiftCalendarData} from '@life-os/domain/shift-calendar';
import {Action,C,T} from '../planner/ui';

let audio:AudioContext|undefined;
const frequencies={default:[523,659],soft:[392,523],short:[660],bright:[523,784,1047]};
export function previewShiftSound(sound:SoundId){
 if(sound==='silent'||typeof AudioContext==='undefined')return;
 try{
  audio??=new AudioContext();
  const context=audio;
  void context.resume().then(()=>{
   frequencies[sound].forEach((frequency,index)=>{
    const start=context.currentTime+index*.13;
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.001,start);
    gain.gain.exponentialRampToValueAtTime(sound==='soft'?.04:.095,start+.015);
    gain.gain.exponentialRampToValueAtTime(.001,start+.24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    oscillator.start(start);oscillator.stop(start+.25);
   });
  }).catch(()=>{});
 }catch{}
}
export function useShiftPermission(){
 const [status,setStatus]=useState(()=>typeof Notification==='undefined'?'unsupported':Notification.permission);
 const request=()=>{
  if(typeof Notification!=='undefined')void Notification.requestPermission().then(setStatus).catch(()=>setStatus('denied'));
 };
 const warning=status==='denied'?'Уведомления заблокированы. Разрешите их в настройках сайта в браузере. Напоминание появится внутри открытого LIFE OS.':
  status==='unsupported'?'На этом устройстве напоминания доступны внутри открытого LIFE OS.':
  'В веб-версии напоминания работают, пока LIFE OS открыт.';
 return {warning,request};
}
export function ShiftNotificationSync({data}:{data?:ShiftCalendarData}){
 const [active,setActive]=useState<ReminderPlan>();
 useEffect(()=>{
  if(!data)return;
  let remaining=reminderPlan(data);
  const timer=setInterval(()=>{
   const now=Date.now();
   const due=remaining.filter(item=>item.at<=now);
   remaining=remaining.filter(item=>item.at>now);
   for(const item of due){
    setActive(item);
    previewShiftSound(item.sound);
    if(item.vibration&&typeof navigator.vibrate==='function')navigator.vibrate([100,60,100]);
    if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
     try{
      const notice=new Notification(item.title,{body:item.body,tag:item.id,silent:true});
      notice.onclick=()=>{window.focus();router.push({pathname:'/shift-calendar',params:{eventId:item.eventId}});notice.close();};
     }catch{/* Mobile browsers can require a service worker. The in-app banner remains available. */}
    }
   }
  },1000);
  return ()=>clearInterval(timer);
 },[data]);
 if(!active)return null;
 return <View style={{position:'absolute',top:8,left:12,right:12,zIndex:1000,padding:10,borderRadius:14,backgroundColor:C.lavender,flexDirection:'row',alignItems:'center',gap:8}}>
  <View style={{flex:1}}><T bold lines={2}>{active.title}</T><T size={12}>{active.body}</T></View>
  <Action icon="next" label="Открыть событие" onPress={()=>{router.push({pathname:'/shift-calendar',params:{eventId:active.eventId}});setActive(undefined);}}/>
  <Action icon="close" label="Закрыть напоминание" onPress={()=>setActive(undefined)}/>
 </View>;
}
