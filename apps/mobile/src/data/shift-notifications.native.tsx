import {useEffect,useState} from 'react';
import {AppState,Linking,Platform} from 'react-native';
import {useApp} from '../context';
import {router} from 'expo-router';
import * as Notifications from 'expo-notifications';
import {reconcileReminders,reminderPlan,type ShiftCalendarData,type SoundId} from '@life-os/domain/shift-calendar';

const filenames={default:'default',soft:'shift-soft.wav',short:'shift-short.wav',bright:'shift-bright.wav',silent:false} as const;
let queue=Promise.resolve();
export function previewShiftSound(_sound:SoundId){}
export function useShiftPermission(){
 const {state}=useApp();
 const [granted,setGranted]=useState<boolean>();
 useEffect(()=>{
  const check=()=>void Notifications.getPermissionsAsync().then(result=>setGranted(result.granted)).catch(()=>setGranted(false));
  check();
  const listener=AppState.addEventListener('change',status=>{if(status==='active')check();});
  return ()=>listener.remove();
 },[]);
 const request=()=>void (async()=>{
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('shift-calendar',{name:'Мой календарь',importance:Notifications.AndroidImportance.HIGH});
  const current=await Notifications.getPermissionsAsync();
  if(!current.canAskAgain&&!current.granted){await Linking.openSettings();return;}
  const result=await Notifications.requestPermissionsAsync();
  setGranted(result.granted);
  if(result.granted)sync(state.planner?.shiftCalendar);
 })().catch(()=>setGranted(false));
 return {request,warning:granted===false?'Разрешите уведомления в настройках приложения. Событие всё равно сохранится.':Platform.OS==='ios'?'Вибрацию уведомлений на iPhone определяют настройки системы.':undefined};
}
Notifications.setNotificationHandler({
 handleNotification:async notification=>({
  shouldShowBanner:true,shouldShowList:true,shouldSetBadge:false,
  shouldPlaySound:notification.request.content.data?.silent!==true,
 }),
});
function sync(data?:ShiftCalendarData){
 const execute=async()=>{
  const permission=await Notifications.getPermissionsAsync();
  const plan=permission.granted&&data?reminderPlan(data):[];
  const scheduled=(await Notifications.getAllScheduledNotificationsAsync()).filter(item=>item.identifier.startsWith('shift-event:'));
  const changes=reconcileReminders(plan,scheduled.map(item=>({id:item.identifier,version:item.content.data?.version})));
  for(const id of changes.cancel)await Notifications.cancelScheduledNotificationAsync(id);
  for(const item of changes.schedule){
   const sound=filenames[item.sound];
   const channelId='shift-'+item.sound+'-'+Number(item.vibration);
   if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channelId,{
    name:'События календаря',importance:Notifications.AndroidImportance.HIGH,sound:sound||null,enableVibrate:item.vibration,
   });
   await Notifications.scheduleNotificationAsync({
    identifier:item.id,
    content:{title:item.title,body:item.body,sound,data:{shiftEventId:item.eventId,version:item.version,silent:!sound}},
    trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(item.at),channelId},
   });
  }
 };
 queue=queue.then(execute).catch(error=>{console.warn('Could not schedule shift reminder',error);});
}
export function ShiftNotificationSync({data}:{data?:ShiftCalendarData}){
 useEffect(()=>{
  sync(data);
  const sub=AppState.addEventListener('change',status=>{if(status==='active')sync(data);});
  return ()=>sub.remove();
 },[data]);
 useEffect(()=>{
  const open=(response:Notifications.NotificationResponse)=>{
   const id=response.notification.request.content.data?.shiftEventId;
   if(typeof id==='string'){
    router.push({pathname:'/shift-calendar',params:{eventId:id}});
    void Notifications.clearLastNotificationResponseAsync();
   }
  };
  const sub=Notifications.addNotificationResponseReceivedListener(open);
  const last=Notifications.getLastNotificationResponse();
  if(last)open(last);
  return ()=>sub.remove();
 },[]);
 return null;
}
