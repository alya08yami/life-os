import {usePlannerColors} from './ui';
import React from 'react';
import {Pressable,Switch,View} from 'react-native';
import {type CalendarEvent,type SoundId} from '@life-os/domain/shift-calendar';
import {C,DatePicker,Input,T} from './ui';
import {shiftPink} from './ShiftCalendarView';

export const soundLabels:Record<SoundId,string>={default:'Стандартный',soft:'Мягкий',short:'Короткий',bright:'Заметный',silent:'Без звука, только вибрация'};
const offsets=[[0,'В момент события'],[15,'За 15 минут'],[30,'За 30 минут'],[60,'За 1 час'],[120,'За 2 часа'],[1440,'За 1 день']] as const;

export function Toggle({label,value,onChange}:{label:string;value:boolean;onChange:(value:boolean)=>void}){
 return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
  <T size={13} style={{flex:1}}>{label}</T><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{true:'#cd8da5',false:'#e1dce0'}}/>
 </View>;
}
function Choices({label,options,value,onChange}:{label:string;options:readonly (readonly [string,string])[];value:string;onChange:(value:string)=>void}){const C=usePlannerColors();
 const [open,setOpen]=React.useState(false);
 return <View style={{gap:4}}>
  <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,padding:10,borderWidth:1,borderColor:C.line,borderRadius:10}}>
   <T size={12}>{label}</T><T size={12} muted style={{flexShrink:1}}>{options.find(option=>option[0]===value)?.[1]}　›</T>
  </Pressable>
  {open&&options.map(([key,title])=><Pressable key={key} accessibilityRole="radio" accessibilityState={{checked:value===key}} onPress={()=>{onChange(key);setOpen(false);}} style={{padding:9,borderRadius:9,backgroundColor:value===key?shiftPink:C.paper}}><T size={13}>{title}</T></Pressable>)}
 </View>;
}
export function ShiftEventForm({event,onChange,reminderWarning,onPermission,preview}:{event:CalendarEvent;onChange:(event:CalendarEvent)=>void;reminderWarning?:string;onPermission:()=>void;preview:(sound:SoundId)=>void}){const C=usePlannerColors();
 const [custom,setCustom]=React.useState(!offsets.some(([value])=>value===event.reminderOffsetMinutes));
 const [offset,setOffset]=React.useState(String(event.reminderOffsetMinutes));
 const change=(patch:Partial<CalendarEvent>)=>onChange({...event,...patch});
 return <>
  <Input label="Название" value={event.title} onChange={title=>change({title})}/>
  <DatePicker label="Дата" value={event.date} onChange={date=>change({date})}/>
  <Input label="Время" placeholder="ЧЧ:ММ" value={event.time} onChange={time=>change({time})}/>
  <Toggle label="Напомнить о событии" value={event.reminderEnabled} onChange={reminderEnabled=>{change({reminderEnabled});if(reminderEnabled)preview(event.soundId);}}/>
  {event.reminderEnabled&&<>
   <Choices label="Когда напомнить" value={custom?'custom':String(event.reminderOffsetMinutes)} options={[...offsets.map(([n,label])=>[String(n),label] as const),['custom','Выбрать своё время']]} onChange={value=>{
    setCustom(value==='custom');
    if(value==='custom'){change({reminderOffsetMinutes:offset.trim()?Number(offset):-1});return;}
    change({reminderOffsetMinutes:Number(value)});
   }}/>
   {custom&&<Input label="За сколько минут" number value={offset} onChange={value=>{setOffset(value);change({reminderOffsetMinutes:value.trim()?Number(value):-1});}}/>}
   <Choices label="Звук напоминания" value={event.soundId} options={Object.entries(soundLabels)} onChange={value=>{
    const soundId=value as SoundId;
    change({soundId,...(soundId==='silent'?{vibrationEnabled:true}:{})});
    preview(soundId);
   }}/>
   <Toggle label="Вибрация" value={event.vibrationEnabled} onChange={vibrationEnabled=>change({vibrationEnabled})}/>
   {!!reminderWarning&&<View style={{gap:5}}><T size={12} muted>{reminderWarning}</T><Pressable accessibilityRole="button" onPress={onPermission}><T size={12} color={C.purple}>Настройки уведомлений</T></Pressable></View>}
  </>}
 </>;
}
