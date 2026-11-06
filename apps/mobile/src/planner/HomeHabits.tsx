import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {habitCount,markHabit,localDate} from '@life-os/domain/planner';
import type {RecordObject} from '@life-os/domain/planner';
import {usePlanner} from './context';
import {ConfirmationSheet,Input,Primary,T,usePlannerColors} from './ui';
import {HabitCheckbox} from './HabitCheckbox';
import {Icon} from '../components/Icon';
import {useApp} from '../context';
import {softHome,warmSurfaces,minimalSurfaces} from '../design/themes';
import {radii,shadows} from '../design/system';

const DAYS=['П','В','С','Ч','П','С','В'];
const weekDay=(date:string,index:number)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7)+index);return localDate(d);};

/**
 * «Привычки» on the home screen: one block, a row per habit (today's check, name, the week's day circles).
 * «+» opens a small form right here; a tap on a habit's name opens rename / archive / delete. Habits stay their own
 * records (type «habit»), separate from home chores. Each habit's marks are independent and saved with the record.
 */
export function HomeHabits({habits,date}:{habits:RecordObject[];date:string}){
 const C=usePlannerColors();const {patch,create,update}=usePlanner();const theme=useApp().state.settings.theme;
 const soft=theme==='soft',warm=theme==='warm';
 const ink=warm?warmSurfaces.icon:soft?softHome.text:'#6d6a86';
 const [adding,setAdding]=useState(false);const [name,setName]=useState('');
 const [editing,setEditing]=useState<RecordObject|null>(null);const [rename,setRename]=useState('');const [confirmDelete,setConfirmDelete]=useState(false);
 const toggle=(habit:RecordObject,day:string)=>{patch(habit.id,markHabit(habit,day,new Date().toISOString())).catch(()=>{});};
 const add=()=>{const title=name.trim();if(!title)return;create('habit','home',title,{frequency:1,days:[0,1,2,3,4,5,6]}).catch(()=>{});setName('');setAdding(false);};
 const save=()=>{if(!editing)return;const title=rename.trim();if(title&&title!==editing.title)patch(editing.id,{title}).catch(()=>{});setEditing(null);};
 const archive=()=>{if(!editing)return;patch(editing.id,{archivedAt:new Date().toISOString()}).catch(()=>{});setEditing(null);};
 const remove=()=>{if(!editing)return;const id=editing.id;update(s=>({...s,objects:s.objects.filter(o=>o.id!==id)})).catch(()=>{});setConfirmDelete(false);setEditing(null);};
 const card=soft?{paddingHorizontal:14,paddingTop:8,paddingBottom:10,borderRadius:radii.card,backgroundColor:softHome.glass,borderWidth:1,borderColor:softHome.glassBorder,gap:2,...shadows[1]}
  :{paddingHorizontal:12,paddingTop:6,paddingBottom:8,borderRadius:16,backgroundColor:theme==='minimal'?minimalSurfaces.habit:C.paper,gap:2};
 return <View style={card} accessibilityLabel="Привычки">
  <View style={{flexDirection:'row',alignItems:'center',gap:6,minHeight:32}}>
   <Icon name="cat" size={16} color={ink}/>
   <T bold={!warm} size={warm?14:12} color={ink} style={{flex:1}}>Привычки</T>
   <Pressable accessibilityRole="button" accessibilityLabel="Добавить привычку" onPress={()=>{setName('');setAdding(true);}} hitSlop={8} style={{width:32,height:32,alignItems:'center',justifyContent:'center'}}>
    <Icon name="plus" size={17} color={ink}/>
   </Pressable>
  </View>
  {habits.map(habit=>{const done=habitCount(habit,date)>=Number(habit.data.frequency??1);return <View key={habit.id} style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:40}}>
   <HabitCheckbox checked={done} outline={soft?softHome.muted:undefined} onPress={()=>toggle(habit,date)}/>
   <Pressable accessibilityRole="button" accessibilityLabel={'Привычка «'+habit.title+'»: изменить'} onPress={()=>{setEditing(habit);setRename(habit.title);setConfirmDelete(false);}} style={{flex:1,minHeight:40,justifyContent:'center'}}>
    <T size={13} color={soft?softHome.text:undefined} lines={1}>{habit.title}</T>
   </Pressable>
   {DAYS.map((label,i)=>{const day=weekDay(date,i);const on=habitCount(habit,day)>=Number(habit.data.frequency??1);return <Pressable key={i} accessibilityRole="checkbox" aria-checked={on} accessibilityState={{checked:on}} accessibilityLabel={habit.title+', '+new Date(day+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})} onPress={()=>toggle(habit,day)} hitSlop={{top:6,bottom:6}} style={{width:17,alignItems:'center',gap:3}}>
    <T size={9} muted={!soft} color={soft?softHome.muted:undefined}>{label}</T>
    <View style={{width:12,height:12,borderRadius:6,backgroundColor:on?(soft?softHome.text:'#7cbd9d'):soft?'rgba(244,240,242,0.18)':'#e3e0ea',borderWidth:day===date&&!on?1:0,borderColor:soft?softHome.muted:'#b9b4c8'}}/>
   </Pressable>;})}
  </View>;})}
  {!habits.length&&<Pressable accessibilityRole="button" onPress={()=>{setName('');setAdding(true);}} style={{minHeight:40,justifyContent:'center'}}><T size={13} color={soft?softHome.muted:C.muted}>Добавьте первую привычку — например, «Вода» или «Прогулка».</T></Pressable>}

  <ConfirmationSheet visible={adding} title="Новая привычка" compact onClose={()=>setAdding(false)}>
   <Input placeholder="Название" value={name} onChange={setName} autoFocus onSubmit={add}/>
   <Primary disabled={!name.trim()} onPress={add}>Добавить</Primary>
  </ConfirmationSheet>
  <ConfirmationSheet visible={!!editing} title="Привычка" compact onClose={()=>{setEditing(null);setConfirmDelete(false);}}>
   {!confirmDelete?<>
    <Input placeholder="Название" value={rename} onChange={setRename} onSubmit={save}/>
    <Primary disabled={!rename.trim()} onPress={save}>Сохранить</Primary>
    <View style={{flexDirection:'row',gap:10}}>
     <View style={{flex:1}}><Primary quiet onPress={archive}>В архив</Primary></View>
     <View style={{flex:1}}><Primary quiet onPress={()=>setConfirmDelete(true)}>Удалить</Primary></View>
    </View>
   </>:<>
    <T>Удалить привычку «{editing?.title}» вместе со всеми отметками? Это нельзя отменить.</T>
    <Pressable accessibilityRole="button" onPress={remove} style={{minHeight:46,borderRadius:21,backgroundColor:'#b4474f',alignItems:'center',justifyContent:'center'}}><T bold color="#fff">Удалить</T></Pressable>
    <Primary quiet onPress={()=>setConfirmDelete(false)}>Отмена</Primary>
   </>}
  </ConfirmationSheet>
 </View>;
}
