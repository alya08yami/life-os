import {StyleSheet} from 'react-native';
import {useApp} from '../context';
import {usePlannerColors} from './ui';
import React,{useState} from 'react';
import {Pressable,TextInput,View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {localDate} from '@life-os/domain/planner';
import {addDays,calendarDay,cycleLength,monthCells,periodDays,shiftIndex,shiftLabels,shiftTypes,validDay,validTime,type CalendarEvent,type MigraineIntensity,type ShiftCalendarData,type ShiftSchedule,type SoundId} from '@life-os/domain/shift-calendar';
import {Action,C,ConfirmationSheet,Frame,Input,Primary,SegmentedTabs,T} from './ui';
import {StepBoundary,goBack,useStepState} from './navigation';
import {cardStyle,dateLabel,DayEvents,DayOption,DaySummary,MonthGrid,MonthStatistics,ShiftLegend,ShiftRows,shiftPink} from './ShiftCalendarView';
import {PeriodHistory} from './PeriodHistory';
import {ShiftEventForm,Toggle} from './ShiftEventForm';

const tabs=['Календарь','Список','Статистика','Месячные'] as const;
type Tab=typeof tabs[number];
type Panel=
 | {kind:'event';event:CalendarEvent;existing:boolean;confirmDelete?:boolean}
 | {kind:'personal';checked:boolean}
 | {kind:'migraine';checked:boolean;intensity?:MigraineIntensity}
 | {kind:'cycle';start:string;rangeId?:string}
 | {kind:'length';value:string}
 | {kind:'schedule';schedule:ShiftSchedule}
 | {kind:'quick';event:CalendarEvent}
 | {kind:'settings'};
type Props={
 data:ShiftCalendarData;save:(next:ShiftCalendarData)=>Promise<void>;
 reminderWarning?:string;permission:()=>void;preview:(sound:SoundId)=>void;
};
function SaveButton({onPress,disabled=false}:{onPress:()=>void;disabled?:boolean}){
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{backgroundColor:shiftPink,borderRadius:12,padding:12,opacity:disabled?.6:1}}>
  <T center bold color="#a22960">{disabled?'Сохраняю…':'Сохранить'}</T>
 </Pressable>;
}
export function ShiftCalendar(props:Props){
 return <StepBoundary><CalendarContent {...props}/></StepBoundary>;
}
export function CalendarContent({data,save,reminderWarning,permission,preview,inlineDate,onDismiss}:Props&{inlineDate?:string;onDismiss?:()=>void}){const C=usePlannerColors();const {theme}=useApp().state.settings;
 const {eventId,date:linkedDate,quick}=useLocalSearchParams<{eventId?:string;date?:string;quick?:string}>();
 const linked=data.events.find(event=>event.id===eventId);
 const today=localDate();
 const openedDay=inlineDate??(linkedDate&&validDay(linkedDate)?linkedDate:undefined);
 const [selected,setSelected]=useState(linked?.date??openedDay??today);
 const [month,setMonth]=useState(selected.slice(0,7));
 const [tab,setTab]=useState<Tab>('Календарь');
 const [detail,setDetail]=useStepState('shifts.detail',!!eventId);
 const [panel,setPanel]=useState<Panel|undefined>(linked?{kind:'event',event:linked,existing:true}:undefined);
 const [notice,setNotice]=useState<{text:string;previous?:ShiftCalendarData}|undefined>(eventId&&!linked?{text:'Событие уже удалено'}:undefined);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const day=calendarDay(data,selected,today,selected);
 const migraine=data.migraines.find(item=>item.date===selected);
 const show=(next:Panel)=>{setError('');setPanel(next);};
 const select=(date:string)=>{setSelected(date);setMonth(date.slice(0,7));};
 const moveMonth=(delta:number)=>{
  const [year,m]=month.split('-').map(Number);
  const next=new Date(Date.UTC(year,m-1+delta,1)).toISOString().slice(0,7);
  setMonth(next);setSelected(next===today.slice(0,7)?today:next+'-01');
 };
 const commit=async(next:ShiftCalendarData,text:string,undo=true)=>{
  if(busy)return false;
  setBusy(true);setError('');
  try{await save(next);setPanel(undefined);setNotice({text,previous:undo?data:undefined});return true;}
  catch{setError('Не удалось сохранить изменения. Попробуйте ещё раз.');return false;}
  finally{setBusy(false);}
 };
 React.useEffect(()=>{
  if(!notice)return;
  const timer=setTimeout(()=>setNotice(undefined),8500);
  return ()=>clearTimeout(timer);
 },[notice]);
 const audit=()=>{
  const at=new Date().toISOString();
  return {id:globalThis.crypto.randomUUID(),ownerId:data.preferences.ownerId,createdAt:at,updatedAt:at};
 };
 const newEvent=(date:string)=>{
  const fields=audit();
  return {...fields,title:'',date,time:'14:00',reminderEnabled:false,
   reminderOffsetMinutes:data.preferences.defaultReminderOffsetMinutes,soundId:data.preferences.defaultSoundId,
   vibrationEnabled:data.preferences.defaultVibrationEnabled,notificationId:'shift-event:'+fields.id};
 };
 const openEvent=(event?:CalendarEvent)=>{
  show({kind:'event',event:event??newEvent(selected),existing:!!event});
 };
 const saveEvent=async(event:CalendarEvent,existing:boolean)=>{
  if(!event.title.trim()||!validDay(event.date)||!validTime(event.time)){setError('Введите название, дату ГГГГ-ММ-ДД и время ЧЧ:ММ.');return;}
  if(event.reminderEnabled&&(!Number.isSafeInteger(event.reminderOffsetMinutes)||event.reminderOffsetMinutes<0||event.reminderOffsetMinutes>525600)){
   setError('Введите целое число минут от 0 до 525600.');return;
  }
  if(existing&&!data.events.some(item=>item.id===event.id)){setError('Событие уже удалено.');return;}
  const next={...event,title:event.title.trim(),reminderOffsetMinutes:event.reminderEnabled?event.reminderOffsetMinutes:data.preferences.defaultReminderOffsetMinutes,updatedAt:new Date().toISOString()};
  const events=existing?data.events.map(item=>item.id===event.id?next:item):[...data.events,next];
  if(await commit({...data,events},existing?'Событие обновлено':'Событие добавлено'))select(event.date);
 };
 // Opened from the home week strip: show quick entry for that day right away.
 const quickOpened=React.useRef(false);
 React.useEffect(()=>{
  if(quickOpened.current||linked||!openedDay||(!inlineDate&&quick!=='1'))return;
  quickOpened.current=true;
  show({kind:'quick',event:newEvent(openedDay)});
 },[]);
 const openCycle=()=>show({kind:'cycle',rangeId:day.cycle?.id,start:day.cycle?.startDate??selected});
 const work=(date:string)=>shiftIndex(data.schedule,date)<2;
 const upcomingStart=month===today.slice(0,7)?today:selected;
 const upcoming=Array.from({length:14},(_,index)=>addDays(upcomingStart,index)).filter(work).slice(0,3);
 const dates=monthCells(month).filter(date=>date.startsWith(month));
 const options=<View style={cardStyle}>
  <DayOption icon="frown" color="#9865ba" label="Мигрень" value={migraine?.intensity?'★'.repeat(migraine.intensity)+'☆'.repeat(4-migraine.intensity):day.migraine?'Без оценки':'Не отмечено'} onPress={()=>show({kind:'migraine',checked:true,intensity:migraine?.intensity})}/>
  <DayOption icon="heart" color="#cc5681" label="Половой акт" value={day.personal?'Отмечено':'Не отмечено'} onPress={()=>show({kind:'personal',checked:day.personal})}/>
  <DayOption icon="droplet" color="#cc5681" label="Месячные" value={day.cycle?'Отмечено':'Нет'} onPress={openCycle}/>
 </View>;
 const summary=<DaySummary data={data} date={selected} onPress={detail?undefined:()=>setDetail(true)}/>;
 const events=<DayEvents events={day.events} onAdd={()=>openEvent()} onEdit={openEvent}/>;
 const saveMarker=(kind:'migraine'|'personal',checked:boolean,intensity?:MigraineIntensity)=>{
  if(kind==='migraine'){
   const remaining=data.migraines.filter(item=>item.date!==selected);
   const record={...(migraine??audit()),date:selected,intensity,updatedAt:new Date().toISOString()};
   void commit({...data,migraines:checked?[...remaining,record]:remaining},checked?'Мигрень отмечена':'Отметка удалена');
   return;
  }
  const key='personal';
  const list=data[key];
  if(list.some(item=>item.date===selected)===checked){setPanel(undefined);return;}
  void commit({...data,[key]:checked?[...list,{...audit(),date:selected}]:list.filter(item=>item.date!==selected)},
   checked?'Половой акт отмечен':'Отметка удалена');
 };
 const saveCycle=(start:string,end:string,rangeId?:string)=>{
  if(!validDay(start)||!validDay(end)||start>end){setError('Введите даты начала и окончания в формате ГГГГ-ММ-ДД.');return;}
  const old=data.cycles.find(item=>item.id===rangeId);
  const next={...(old??audit()),startDate:start,endDate:end,updatedAt:new Date().toISOString()};
  void commit({...data,cycles:[...data.cycles.filter(item=>item.id!==rangeId),next]},'Дни цикла обновлены');
 };
 const closePanel=()=>{if(!busy){setPanel(undefined);onDismiss?.();}};
 const feedback=<>
  {!panel&&!!error&&<T color={C.red}>{error}</T>}
  {notice&&<View accessibilityLiveRegion="polite" style={{...cardStyle,flexDirection:'row',alignItems:'center',gap:10,padding:12}}>
   <T size={12} style={{flex:1}}>{notice.text}</T>
   {notice.previous&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>void commit(notice.previous!,'Действие отменено',false)}><T color={C.purple} size={12}>Отменить</T></Pressable>}
   <Action icon="close" label="Закрыть сообщение" onPress={()=>setNotice(undefined)}/>
  </View>}
 </>;
 const mist=theme==='mist';
 const calendar=<Frame centerTitle headerColor={mist?'#fff':undefined} title={detail?dateLabel(selected):'Мой календарь'} onBack={goBack}
  right={<Action icon="more" color={mist?'#fff':undefined} label="Настройки календаря" onPress={()=>show({kind:'settings'})}/>}>
  {!detail&&<SegmentedTabs swipe mistHeader={mist} transparentTrack={theme==='minimal'} values={[...tabs]} value={tab} onChange={value=>setTab(value as Tab)}/>}
  {detail?<>{summary}{events}{options}</>:tab==='Месячные'?
   <PeriodHistory data={data} onEdit={range=>show({kind:'cycle',rangeId:range.id,start:range.startDate})}
    onAdd={()=>show({kind:'cycle',start:today})}/>:<>
   <View style={mist&&tab==='Календарь'?{backgroundColor:'#f8f8ff',borderRadius:24,padding:10,gap:10}:{gap:14}}>
   <MonthGrid data={data} month={month} today={today} selected={selected} onSelect={date=>{select(date);show({kind:'quick',event:newEvent(date)});}} onMonth={moveMonth} mode={tab==='Календарь'?'grid':'heading'}/>
   {tab==='Календарь'&&<><ShiftLegend/>{summary}</>}
   </View>
   {tab==='Календарь'?<>
    {events}
    <View style={cardStyle}>
     <View style={{padding:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:5}}>
      <T size={13} bold>Ближайшие смены</T>
      <Pressable accessibilityRole="button" onPress={()=>setTab('Список')}><T size={11} color="#3868bd">Смотреть все ›</T></Pressable>
     </View>
     <ShiftRows data={data} dates={upcoming}/>
    </View>
    <Primary onPress={()=>show({kind:'schedule',schedule:{...data.schedule,anchorDate:selected,anchorShiftType:shiftTypes[day.shift]}})}>＋ Добавить смену</Primary>{options}
   </>:tab==='Список'?<View style={{...cardStyle,backgroundColor:C.paper,borderColor:C.line,borderRadius:20,overflow:'hidden'}}>{dates.filter(date=>{
    const entry=calendarDay(data,date,today,selected);
    return work(date)||entry.events.length||entry.migraine||entry.personal||entry.cycle;
   }).map((date,index)=>{
    const entry=calendarDay(data,date,today,selected);
    // Agenda row: the date on the left, the shift and the day's entries on the right — easy to scan down the month.
    const d=new Date(date+'T12:00:00');const isToday=date===today;
    const marks=[entry.cycle?'Месячные':'',entry.migraine?'Мигрень':'',entry.personal?'Половой акт':''].filter(Boolean);
    return <Pressable accessibilityRole="button" accessibilityLabel={dateLabel(date)+', '+shiftLabels[entry.shift]} key={date} onPress={()=>{select(date);setDetail(true);}} style={({pressed})=>({flexDirection:'row',gap:14,paddingVertical:11,paddingHorizontal:14,borderTopWidth:index?StyleSheet.hairlineWidth:0,borderColor:C.line,backgroundColor:pressed?C.lavender:'transparent'})}>
     <View style={{width:40,alignItems:'center'}}>
      <T bold size={18} color={isToday?C.purple:C.ink} style={{lineHeight:22}}>{d.getDate()}</T>
      <T size={11} muted>{d.toLocaleDateString('ru-RU',{weekday:'short'})}</T>
     </View>
     <View style={{flex:1,gap:4,justifyContent:'center'}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:7}}>
       {entry.shift<2&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:entry.shift===0?'#D9AE76':'#7986A8'}}/>}
       <T size={13.5} bold={entry.shift<2}>{shiftLabels[entry.shift]}</T>
      </View>
      {entry.events.map(event=><T key={event.id} size={13} lines={2}><T size={13} muted>{event.time} </T>{event.title}</T>)}
      {!!marks.length&&<T size={12} muted>{marks.join(' · ')}</T>}
     </View>
    </Pressable>;
   })}</View>:<MonthStatistics data={data} month={month}/>}
  </>}
  {feedback}
 </Frame>;
 return <>
  {!inlineDate&&calendar}
  {inlineDate&&feedback}
  {panel&&<ConfirmationSheet visible title={panel.kind==='event'?(panel.confirmDelete?'Удалить событие?':panel.existing?'Редактировать событие':'Новое событие'):panel.kind==='quick'?dateLabel(selected):panel.kind==='cycle'?'Месячные':panel.kind==='migraine'?'Мигрень':panel.kind==='personal'?'Половой акт':panel.kind==='schedule'?'Настроить цикл смен':'Настройки календаря'} onClose={closePanel}>
   {panel.kind==='quick'?<>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
     <TextInput accessibilityLabel="Название события" placeholder="Название события" placeholderTextColor={C.muted} value={panel.event.title} onChangeText={title=>setPanel({...panel,event:{...panel.event,title}})} onSubmitEditing={()=>void saveEvent(panel.event,false)} style={{flex:1,minHeight:44,paddingHorizontal:12,borderRadius:12,backgroundColor:C.paper,color:C.ink}}/>
     <TextInput accessibilityLabel="Время события" value={panel.event.time} onChangeText={time=>setPanel({...panel,event:{...panel.event,time}})} maxLength={5} style={{minHeight:44,width:62,textAlign:'center',borderRadius:12,backgroundColor:C.paper,color:C.ink}}/>
     <Pressable accessibilityRole="button" accessibilityLabel="Сохранить событие" disabled={busy||!panel.event.title.trim()} onPress={()=>void saveEvent(panel.event,false)} style={{padding:10}}><T bold color={C.purple}>✓</T></Pressable>
    </View>
    <DayOption icon="bell" label="Событие с напоминанием" value="" color="#6573b4" onPress={()=>show({kind:'event',existing:false,event:{...panel.event,reminderEnabled:true}})}/>
    {options}
    {!!day.events.length&&events}
   </>:panel.kind==='event'?(panel.confirmDelete?<>
    <T>Удалить событие «{data.events.find(item=>item.id===panel.event.id)?.title??panel.event.title}»?</T>
    <Primary disabled={busy} onPress={()=>void commit({...data,events:data.events.filter(event=>event.id!==panel.event.id)},'Событие удалено')}>Удалить</Primary>
    <Primary quiet onPress={()=>setPanel({...panel,confirmDelete:false})}>Назад</Primary>
   </>:<>
    <ShiftEventForm event={panel.event} onChange={event=>setPanel({...panel,event})} reminderWarning={reminderWarning} onPermission={permission} preview={preview}/>
    <SaveButton disabled={busy} onPress={()=>void saveEvent(panel.event,panel.existing)}/>
    {panel.existing&&<Primary quiet onPress={()=>setPanel({...panel,confirmDelete:true})}>Удалить событие</Primary>}
   </>):panel.kind==='migraine'||panel.kind==='personal'?<>
    <T muted>{dateLabel(selected)}</T>
    <Toggle label={panel.kind==='migraine'?'Отметить мигрень':'Отметить половой акт'} value={panel.checked} onChange={checked=>setPanel({...panel,checked})}/>
    {panel.kind==='migraine'&&panel.checked&&<View style={{gap:6}}>
     <T muted size={12}>Интенсивность мигрени</T>
     <View style={{flexDirection:'row',gap:6}}>
      {([1,2,3,4] as const).map(value=><Pressable key={value} accessibilityRole="radio"
       accessibilityLabel={value+' из 4'} accessibilityState={{checked:panel.intensity===value}}
       onPress={()=>setPanel({...panel,intensity:value})} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}>
       <T size={26} color="#9865ba">{value<=(panel.intensity??0)?'★':'☆'}</T>
      </Pressable>)}
     </View>
    </View>}
    <SaveButton disabled={busy} onPress={()=>saveMarker(panel.kind,panel.checked,panel.kind==='migraine'?panel.intensity:undefined)}/>
   </>:panel.kind==='cycle'?<>
    <Input label="Первый день месячных" placeholder="ГГГГ-ММ-ДД" value={panel.start} onChange={start=>setPanel({...panel,start})}/>
    <T muted size={12}>Отметятся пять дней подряд, включая первый.</T>
    <SaveButton disabled={busy} onPress={()=>{
     if(!validDay(panel.start)){setError('Введите дату в формате ГГГГ-ММ-ДД.');return;}
     saveCycle(panel.start,addDays(panel.start,periodDays-1),panel.rangeId);
    }}/>
    {panel.rangeId&&<Primary quiet onPress={()=>void commit({...data,cycles:data.cycles.filter(range=>range.id!==panel.rangeId)},'Отметка месячных удалена')}>Удалить отметку месячных</Primary>}
   </>:panel.kind==='schedule'?<>
    <Input label="Опорная дата" placeholder="ГГГГ-ММ-ДД" value={panel.schedule.anchorDate} onChange={anchorDate=>setPanel({...panel,schedule:{...panel.schedule,anchorDate}})}/>
    {shiftTypes.map((type,index)=><Pressable key={type} accessibilityRole="radio" accessibilityState={{checked:panel.schedule.anchorShiftType===type}} onPress={()=>setPanel({...panel,schedule:{...panel.schedule,anchorShiftType:type}})} style={{padding:8,borderRadius:9,backgroundColor:panel.schedule.anchorShiftType===type?shiftPink:C.paper}}><T>{shiftLabels[index]}</T></Pressable>)}
    <SaveButton disabled={busy} onPress={()=>{
     if(!validDay(panel.schedule.anchorDate)){setError('Введите опорную дату в формате ГГГГ-ММ-ДД.');return;}
     void commit({...data,schedule:{...panel.schedule,updatedAt:new Date().toISOString()}},'График смен обновлён');
    }}/>
   </>:panel.kind==='length'?<>
    <Input label="Длительность цикла, дней (24–34)" number value={panel.value} onChange={value=>setPanel({...panel,value})}/>
    <SaveButton disabled={busy} onPress={()=>{
     const value=Number(panel.value);
     if(cycleLength(value)!==value){setError('Введите целое число от 24 до 34.');return;}
     void commit({...data,preferences:{...data.preferences,cycleLength:value}},'Длительность цикла сохранена');
    }}/>
   </>:<>
    <Primary quiet onPress={()=>show({kind:'length',value:String(cycleLength(data.preferences.cycleLength))})}>Длительность цикла · {cycleLength(data.preferences.cycleLength)} дн.</Primary>
    <Toggle label="Показывать сердечки в календаре" value={data.preferences.showPersonalMarkers} onChange={showPersonalMarkers=>void commit({...data,preferences:{...data.preferences,showPersonalMarkers}},'Настройки сохранены')}/>
    <Primary quiet onPress={()=>show({kind:'schedule',schedule:data.schedule})}>Настроить цикл смен</Primary>
    <Primary quiet onPress={permission}>Настройки уведомлений</Primary>
    {!!reminderWarning&&<T muted size={12}>{reminderWarning}</T>}
   </>}
   {!!error&&<T color={C.red}>{error}</T>}
   <Primary quiet onPress={closePanel}>Отмена</Primary>
  </ConfirmationSheet>}
 </>;
}
