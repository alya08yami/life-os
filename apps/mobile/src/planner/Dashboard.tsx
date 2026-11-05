import {CalendarContent} from './ShiftCalendar';
import {useShiftPermission,previewShiftSound} from '../data/shift-notifications';
import {minimalSurfaces,warmSurfaces,softHome} from '../design/themes';
import {shadows,radii} from '../design/system';
import {SoftPressable} from '../design/SoftPressable';
import {useSoftNavigation} from '../design/transition';
import {usePlannerColors} from './ui';
import React,{useState} from 'react';
import {View,Pressable} from 'react-native';
import {router} from 'expo-router';
import {localDate,habitCount,markHabit} from '@life-os/domain/planner';
import {calendarDay,calendarDefaults,upgradeDefaultShiftSchedule,type ShiftCalendarData} from '@life-os/domain/shift-calendar';
import {DashboardTiles} from './DashboardTiles';
import {HabitCheckbox} from './HabitCheckbox';
import {WeekSlider,shiftDay} from './WeekSlider';
import {Frame,T,C,Action,DateLabel} from './ui';
import {Icon} from '../components/Icon';
import {usePlanner} from './context';
import {useApp} from '../context';
import {MarkDots,ShiftStripe,PeriodBar,dayTint,dayOutline,hasEvent,eventFill} from './ShiftCalendarView';

const WEEKDAYS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const HABIT_DAYS=['П','В','С','Ч','П','С','В'];

/** Week strip used on other screens (food, etc.): plain day picker without calendar marks. */
export function WeekCalendar({selected,onSelect}:{selected:string;onSelect:(d:string)=>void}){const C=usePlannerColors();
 return <WeekSlider date={selected} onChange={onSelect}>{monday=>
  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
   {WEEKDAYS.map((s,i)=>{
    const date=shiftDay(monday,i);
    const active=date===selected;
    return <Pressable key={s} onPress={()=>onSelect(date)} accessibilityRole="button" accessibilityLabel={date}
     style={{width:'13%',alignItems:'center',borderRadius:16,paddingVertical:10,gap:9,backgroundColor:active?'#e1ddfb':'transparent'}}>
     <T size={11} muted={!active} color={active?C.purple:undefined}>{s}</T>
     <T size={13.6} bold={active}>{new Date(date+'T12:00:00').getDate()}</T>
    </Pressable>;
   })}
  </View>}
 </WeekSlider>;
}

const openCalendar=()=>router.push('/shift-calendar');

/** Home week strip: shows marks from «Мой календарь»; tapping a day opens quick entry for that day. */
function HomeWeek({selected,onChange,onDayPress,calendar}:{selected:string;onChange:(d:string)=>void;onDayPress:(d:string)=>void;calendar:ShiftCalendarData}){const C=usePlannerColors();
 const {theme}=useApp().state.settings;
 const minimal=theme==='minimal';
 const mist=theme==='mist';
 const warm=theme==='warm';
 const soft=theme==='soft';
 const {navigate}=useSoftNavigation();
 const today=localDate();
 return <WeekSlider date={selected} onChange={onChange} onLabelPress={warm?undefined:soft?()=>navigate('/shift-calendar'):openCalendar} hideRange={warm} label="Мой календарь">{monday=>
  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:2}}>
   {WEEKDAYS.map((name,i)=>{
    const date=shiftDay(monday,i);
    const day=calendarDay(calendar,date,today,selected);
    const active=date===selected;
    const tint=dayTint(day,minimal,mist);
    const event=hasEvent(day);
    if(soft){
     // Soft Future: glass day cells; event days are dense milk cells so they cannot be missed.
     const fill=event?softHome.event:day.cycle?softHome.period:day.forecast==='ovulation'?softHome.ovulation:day.forecast==='fertile'?softHome.fertile:softHome.glass;
     const ink=event?softHome.eventInk:softHome.text;
     return <SoftPressable key={name} testID={'home-day-'+date} accessibilityRole="button"
      accessibilityLabel={date+(day.events.length?', событий: '+day.events.length:'')+' — добавить запись'}
      onPress={()=>{onChange(date);onDayPress(date);}}
      style={{width:'13.4%',alignItems:'center',borderRadius:radii.control,paddingTop:9,paddingBottom:6,gap:3,overflow:'hidden',minHeight:76,
       backgroundColor:fill,borderWidth:1,borderColor:active?softHome.text:softHome.glassBorder,...(day.forecast==='period'&&!event?{borderStyle:'dashed' as const,borderColor:softHome.period}:{})}}>
      <ShiftStripe shift={day.shift} height={2}/>
      <PeriodBar day={day}/>
      <T size={10.5} color={event?softHome.eventInk:softHome.muted} style={{letterSpacing:0.3}}>{name}</T>
      <View style={{width:26,height:26,borderRadius:13,alignItems:'center',justifyContent:'center',
       ...(day.today?{borderWidth:1.3,borderColor:ink}:{})}}>
       <T size={14} bold={day.today||event} color={ink}>{new Date(date+'T12:00:00').getDate()}</T>
      </View>
      <MarkDots markers={day.markers} size={9} ovulation={day.forecast==='ovulation'}/>
     </SoftPressable>;
    }
    return <Pressable key={name} testID={'home-day-'+date} accessibilityRole="button"
     accessibilityLabel={date+(day.events.length?', событий: '+day.events.length:'')+' — добавить запись'}
     onPress={()=>{onChange(date);onDayPress(date);}}
     style={{width:'13.4%',alignItems:'center',borderRadius:10,paddingTop:8,paddingBottom:5,gap:2,overflow:'hidden',
      borderWidth:warm?0:1,borderColor:mist?'rgba(255,255,255,.42)':'#efeae6',...dayOutline(day),...(active&&!mist&&!warm?{borderColor:event?'#b9a8ff':'#8f72b8',borderWidth:event?2:1.5,borderStyle:'solid' as const}:{}),
      minHeight:mist||warm?76:undefined,backgroundColor:(warm&&active?warmSurfaces.selection:mist&&(active||event)?'#686bd1':tint)??(mist?'rgba(255,255,255,.18)':minimal||warm?'transparent':active?C.lavender:C.paper)}}>
     {!warm&&<ShiftStripe shift={day.shift} height={3}/>}
     <PeriodBar day={day}/>
     <T size={11} muted={!active&&!event} color={warm&&active?'#fff':mist?'#fff':event&&!minimal?'#c9cfe3':active?C.purple:undefined}>{name}</T>
     <View style={{width:26,height:26,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:day.today?(warm?'#fff':mist?'#fff':minimal?minimalSurfaces.today:event?'#fff':'#1f2433'):'transparent'}}>
      <T size={14} bold={active||day.today||event} color={warm?(active&&!day.today||event&&!day.today?'#fff':warmSurfaces.icon):mist?(day.today?'#5457b9':active||event?'#fff':C.ink):minimal?C.ink:event?(day.today?eventFill:'#fff'):day.today?'#fff':undefined}>{new Date(date+'T12:00:00').getDate()}</T>
     </View>
     <MarkDots markers={day.markers} size={9} ovulation={day.forecast==='ovulation'}/>
    </Pressable>;
   })}
  </View>}
 </WeekSlider>;
}

function weekDayKey(date:string,index:number){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7)+index);return localDate(d);}
function dashboardHabits(state:ReturnType<typeof usePlanner>['state']){
 const objects=state?.objects??[];
 const habits=objects.filter(o=>o.type==='habit'&&!o.archivedAt);
 const exercises=habits.filter(o=>o.section==='home'&&o.title==='Упражнения');
 const isUntouchedSeed=(o:typeof exercises[number])=>
  !o.data.executions?.length&&
  objects.some(other=>other.type==='product'&&other.data.example&&other.createdAt===o.createdAt);
 const primary=exercises.find(o=>!isUntouchedSeed(o))??exercises[0];
 return habits.filter(o=>!exercises.includes(o)||o===primary||!isUntouchedSeed(o));
}

function Logo(){
 const {theme}=useApp().state.settings;
 if(theme==='minimal')return <View style={{height:50,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
  <T bold size={20}>LIFE OS</T>
  <View style={{backgroundColor:'#fff',borderRadius:24}}><Action icon="settings" label="Настройки" onPress={()=>router.push('/settings')}/></View>
 </View>;
 const {navigate}=useSoftNavigation();
 if(theme==='soft')return <View style={{flexDirection:'row',alignItems:'center',height:56}}>
  <View style={{width:36}}/>
  <View style={{flex:1,alignItems:'center'}}>
   <T center size={15} color={softHome.text} style={{fontFamily:'Inter',fontWeight:'300',letterSpacing:7,paddingLeft:7}}>LIFE OS</T>
  </View>
  <Action icon="settings" label="Настройки" color={softHome.text} onPress={()=>navigate('/settings')}/>
 </View>;
 const warm=theme==='warm';
 const color=theme==='mist'?'#fff':warm?'#242120':'#7d716a';
 return <View style={{flexDirection:'row',alignItems:'center',height:warm?68:50}}>
  <View style={{width:36}}/>
  <View style={{flex:1,alignItems:'center'}}>
   {/* paddingLeft compensates the trailing letter spacing so the word stays optically centred */}
   <T center size={warm?24:20} color={color} style={{fontFamily:'Inter',letterSpacing:warm?6:5,paddingLeft:warm?6:5,lineHeight:warm?32:24,fontWeight:warm?'300':'400'}}>LIFE OS</T>
  </View>
  <Action icon="settings" label="Настройки" color={warm?warmSurfaces.icon:color} onPress={()=>router.push('/settings')}/>
 </View>;
}

export function Dashboard(){const C=usePlannerColors();
 const {state,patch,update}=usePlanner();
 const {warning,request}=useShiftPermission();
 const [quickEntry,setQuickEntry]=useState<{date:string;sequence:number}>();
 const entrySequence=React.useRef(0);
 const {profileId,state:app}=useApp();
 const [date,setDate]=useState(localDate());
 const [fallback]=useState(()=>calendarDefaults(profileId,Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'));
 const calendar=upgradeDefaultShiftSchedule(state?.shiftCalendar??fallback);
 const habits=dashboardHabits(state);
 const warm=app.settings.theme==='warm';
 const soft=app.settings.theme==='soft';
 const {navigate}=useSoftNavigation();
 const habitInk=warm?warmSurfaces.icon:soft?softHome.text:'#6d6a86';
 const addHabit=()=>router.push({pathname:'/planner' as any,params:{section:'home',type:'habit',add:'1'}});
 const scheduled=state?.objects.filter(o=>o.data.plannedDate===date&&!o.archivedAt&&o.type!=='habit')??[];
 return <Frame title="LIFE OS" header={false}>
  <Logo/>
  <HomeWeek selected={date} onChange={setDate} onDayPress={day=>setQuickEntry({date:day,sequence:++entrySequence.current})} calendar={calendar}/>
  <View style={warm?{backgroundColor:warmSurfaces.panel,borderRadius:22,borderWidth:1,borderColor:C.line,padding:12,gap:9}:app.settings.theme==='mist'?{backgroundColor:'#f7f7ff',borderRadius:24,padding:10,gap:10}:{gap:soft?12:14}}>
  {habits.map(habit=>{const Card=soft?SoftPressable:Pressable;return <Card key={habit.id} accessibilityRole="button" accessibilityLabel="Привычка"
   onPress={()=>(soft?navigate:router.push)({pathname:'/planner' as any,params:{section:'home',id:habit.id}})}
   style={soft?{paddingHorizontal:14,paddingTop:8,paddingBottom:12,borderRadius:radii.card,backgroundColor:softHome.glass,borderWidth:1,borderColor:softHome.glassBorder,gap:5,...shadows[1]}
    :{paddingHorizontal:12,paddingTop:6,paddingBottom:10,borderRadius:16,backgroundColor:app.settings.theme==='minimal'?minimalSurfaces.habit:C.paper,gap:4}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
    <Icon name="cat" size={16} color={habitInk}/>
    <T bold={!warm} size={warm?14:12} color={habitInk} style={{flex:1}}>Привычка</T>
    <Pressable accessibilityRole="button" accessibilityLabel="Добавить привычку" onPress={addHabit} hitSlop={8}
     style={{width:28,height:28,alignItems:'center',justifyContent:'center'}}>
     <Icon name="plus" size={17} color={habitInk}/>
    </Pressable>
   </View>
   <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
    <HabitCheckbox checked={habitCount(habit,date)>=Number(habit.data.frequency??1)} outline={soft?softHome.muted:undefined}
     onPress={()=>{patch(habit.id,markHabit(habit,date,new Date().toISOString())).catch(()=>{});}}/>
    <T size={13} color={soft?softHome.text:undefined} style={{flex:1}} lines={1}>{habit.title}</T>
    {HABIT_DAYS.map((day,i)=><View key={i} style={{alignItems:'center',gap:3}}>
     <T size={9} muted={!soft} color={soft?softHome.muted:undefined}>{day}</T>
     <View style={{width:12,height:12,borderRadius:6,backgroundColor:habitCount(habit,weekDayKey(date,i))>=Number(habit.data.frequency??1)?(soft?softHome.text:'#7cbd9d'):soft?'rgba(244,240,242,0.18)':habit.data.days?.includes((i+1)%7)?'#dedbe7':'#e9e7ee'}}/>
    </View>)}
   </View>
  </Card>;})}
  {!habits.length&&<Pressable onPress={addHabit} style={{padding:12,borderRadius:16,backgroundColor:soft?softHome.glass:C.lavender}}><T size={13} color={soft?softHome.text:undefined}>＋ Добавить привычку</T></Pressable>}
  {scheduled.map(o=><Pressable key={o.id} onPress={()=>router.push({pathname:'/planner' as any,params:{section:o.section,id:o.id}})} style={{padding:10,borderRadius:12,backgroundColor:C.paper}}><T size={12}>{o.title}</T><DateLabel date={o.data.plannedDate}/></Pressable>)}
  <DashboardTiles/>
  </View>
  {quickEntry&&<CalendarContent key={quickEntry.sequence} inlineDate={quickEntry.date} onDismiss={()=>setQuickEntry(undefined)}
   data={calendar} save={next=>update(current=>({...current,shiftCalendar:next}))}
   reminderWarning={warning} permission={request} preview={previewShiftSound}/>}
 </Frame>;
}
