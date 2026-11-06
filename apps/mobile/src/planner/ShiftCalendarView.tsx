import {calendarPeriodFill as periodPink,minimalSurfaces,mistCalendar,warmSurfaces} from '../design/themes';
import {useApp} from '../context';
import {usePlannerColors} from './ui';
import Svg,{Circle,Path} from 'react-native-svg';
import React from 'react';
import {PanResponder,Platform,Pressable,View} from 'react-native';
import {addDays,calendarDay,monthCells,shiftIndex,shiftLabels,shiftColors,workingHours,type ShiftCalendarData,type CalendarEvent} from '@life-os/domain/shift-calendar';
import {Icon,type IconName} from '../components/Icon';
import {Action,C,T} from './ui';

export const shiftPink='#f5dce5';
/*
 * Calendar visual language — every kind of information has its own channel so nothing overlaps:
 *  • shift      → coloured stripe along the top of the cell (amber = first, blue = second)
 *  • period     → rose fill; forecast → dashed rose outline; fertile / ovulation → mint fill
 *  • event      → whole cell filled deep navy with a white number (must not be missed)
 *  • marks      → tiny icons under the number: red heart (sex), violet sad face (migraine)
 *  • today      → number in a circle (dark; white on an event day)
 */
const forecastRose='#cc467d';
const ovulationDot={width:6,height:6,borderRadius:3,backgroundColor:'#429568'} as const;
export const shiftBlue=shiftColors[1];
const markerStyles={migraine:{icon:'frown',color:'#8e5cc4'},personal:{icon:'heart',color:'#e0435e'},event:{icon:'flag',color:'#2c3550'}} as const;
export const eventFill='#2c3550';
export type MarkKind=keyof typeof markerStyles;
const monthFormat=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'});
const dateFormat=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',weekday:'long',timeZone:'UTC'});
export const dateLabel=(date:string)=>{
 const parts=Object.fromEntries(dateFormat.formatToParts(new Date(date+'T12:00:00Z')).map(part=>[part.type,part.value]));
 return parts.day+' '+parts.month+', '+parts.weekday;
};
const cap=(s:string)=>s[0].toUpperCase()+s.slice(1);
export const cardStyle={backgroundColor:'#faf8f5',borderRadius:14,borderWidth:1,borderColor:'#ede8e3'} as const;

/** Top stripe showing the shift of the day. */
const firstShiftStripe="#FFFF99";
const secondShiftStripe="#7FC7FF";
export function ShiftStripe({shift,height=4}:{shift:number;height?:number}){
 if(shift>1)return null;
 return <View pointerEvents="none" accessible={false} aria-hidden testID={'shift-stripe-'+(shift+1)}
  style={{position:'absolute',top:0,left:0,right:0,height,backgroundColor:shift===0?firstShiftStripe:secondShiftStripe}}/>;
}
/** Tiny filled heart (sex mark). White outline keeps it readable on a navy event cell. */
export function HeartMark({size=11}:{size?:number}){
 return <Svg width={size} height={size} viewBox="0 0 24 24">
  <Path d="M12 21.2l-1.4-1.3C5.4 15.3 2 12.2 2 8.4 2 5.3 4.4 3 7.4 3c1.8 0 3.5.8 4.6 2.1C13.1 3.8 14.8 3 16.6 3 19.6 3 22 5.3 22 8.4c0 3.8-3.4 6.9-8.6 11.5L12 21.2z"
   fill={markerStyles.personal.color} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round"/>
 </Svg>;
}
/** Tiny sad face (migraine mark): violet disc, white eyes, frown and slanted brows. */
export function MigraineMark({size=11}:{size?:number}){
 return <Svg width={size} height={size} viewBox="0 0 24 24">
  <Path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21z" fill={markerStyles.migraine.color} stroke="#fff" strokeWidth={1.4}/>
  <Path d="M6.8 8.2l3 1.2M17.2 8.2l-3 1.2" stroke="#fff" strokeWidth={1.7} strokeLinecap="round"/>
  <Path d="M8.6 11.9h.01M15.4 11.9h.01" stroke="#fff" strokeWidth={2.6} strokeLinecap="round"/>
  <Path d="M8 17.4c1.1-1.4 2.5-2.1 4-2.1s2.9.7 4 2.1" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none"/>
 </Svg>;
}
/** Marks under the day number. Events are shown by the cell fill; their hidden node keeps the order for tests and screen readers. */
export function MarkDots({markers,size=11,ovulation=false}:{markers:MarkKind[];size?:number;ovulation?:boolean}){
 return <View testID="shift-markers" style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:2,height:size+2}}>
  {ovulation&&<View testID="marker-ovulation" style={ovulationDot}/>}
  {markers.map(kind=><View key={kind} testID={'marker-'+kind} style={kind==='event'?{width:0,height:0}:undefined}>
   {kind==='migraine'?<MigraineMark size={size}/>:kind==='personal'?<HeartMark size={size}/>:null}
  </View>)}
 </View>;
}
/** On an event day the fill is taken, so a period day keeps a rose bar along the bottom. */
export function PeriodBar({day}:{day:{cycle?:unknown;events?:unknown[]}}){
 if(!hasEvent(day)||!day.cycle)return null;
 return <View pointerEvents="none" style={{position:'absolute',bottom:0,left:0,right:0,height:4,backgroundColor:periodPink}}/>;
}
/** Dashed rose outline for a forecast period day. */
export const dayOutline=(day:{forecast?:string})=>day.forecast==='period'?{borderColor:forecastRose,borderWidth:1.5,borderStyle:'dashed' as const}:undefined;
export const hasEvent=(day:{events?:unknown[]})=>!!day.events?.length;
export function dayTint(day:{cycle?:unknown;forecast?:string;events?:unknown[]},minimal=false,mist=false){
 return hasEvent(day)?(minimal?minimalSurfaces.event:mist?mistCalendar.event:eventFill):day.cycle?(mist?mistCalendar.period:periodPink):undefined;
}
export function Marker({kind,size=13}:{kind:keyof typeof markerStyles;size?:number}){
 const {icon,color}=markerStyles[kind];
 if(kind==='personal')return <HeartMark size={size}/>;
 if(kind==='migraine')return <MigraineMark size={size}/>;
 return <Icon name={icon} color={color} size={size} strokeWidth={1.725}/>;
}
export function ShiftBadge({shift,size=38}:{shift:number;size?:number}){
 return <View style={{height:size,width:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',backgroundColor:['#fbf0d8','#e9eefb','#eeece9','#eeece9'][shift]}}>
  <T bold size={size*.52} color={shiftColors[shift]}>{['1','2','–','○'][shift]}</T>
 </View>;
}
export function MonthGrid({data,month,today,selected,onSelect,onMonth,mode='grid'}:{data:ShiftCalendarData;month:string;today:string;selected:string;onSelect:(day:string)=>void;onMonth:(delta:number)=>void;mode?:'grid'|'heading'}){
 const C=usePlannerColors();
 const {theme}=useApp().state.settings;
 const minimal=theme==='minimal';
 const mist=theme==='mist';
 const warm=theme==='warm';
 const dates=monthCells(month);
 const swipe=React.useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponderCapture:(_,g)=>Math.abs(g.dx)>12&&Math.abs(g.dx)>1.5*Math.abs(g.dy),
  onPanResponderTerminationRequest:()=>false, // the month swipe stays with the calendar, not the screen's tabs
  onPanResponderRelease:(_,g)=>{
   if(Math.abs(g.dx)>48&&Math.abs(g.dx)>Math.abs(g.dy))onMonth(g.dx<0?1:-1);
  },
 }),[onMonth]);
 return <View style={{gap:6,...(mist?{backgroundColor:C.paper,borderRadius:20,padding:9}:{})}}> 
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
   <Action icon="back" label="Предыдущий месяц" onPress={()=>onMonth(-1)}/>
   <T bold size={minimal?29:19}>{cap(monthFormat.format(new Date(month+'-01T12:00:00Z')).replace(/ г\.$/,''))}</T>
   <Action icon="next" label="Следующий месяц" onPress={()=>onMonth(1)}/>
  </View>
  {mode==='grid'&&<><View style={{flexDirection:'row',paddingVertical:5}}>
   {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(name=><T key={name} size={10} muted={mist} center style={{flex:1}}>{name}</T>)}
  </View>
  <View {...swipe.panHandlers} style={{gap:3,...(Platform.OS==='web'?{touchAction:'pan-y' as const}:{})}}>{Array.from({length:dates.length/7},(_,week)=><View key={week} style={{flexDirection:'row',gap:3}}>
   {dates.slice(week*7,week*7+7).map(date=>{
    const day=calendarDay(data,date,today,selected);
    const inMonth=date.startsWith(month);
    return <Pressable key={date} testID={'shift-day-'+date} accessibilityRole="button" aria-selected={day.selected} accessibilityState={{selected:day.selected}} accessibilityLabel={[date,shiftLabels[day.shift],day.cycle&&'месячные',day.forecast==='period'&&'прогноз месячных',day.forecast==='ovulation'&&'предполагаемая овуляция',day.forecast==='fertile'&&'фертильное окно',day.migraine&&'мигрень',day.markers.includes('personal')&&'половой акт',day.events.length>0&&'событие',day.today&&'сегодня'].filter(Boolean).join(', ')} onPress={()=>onSelect(date)} style={{
     flex:1,minWidth:0,aspectRatio:.77,maxHeight:69,borderRadius:8,borderWidth:1,
     borderColor:warm?C.line:mist?'#edecf8':'#efeae6',backgroundColor:dayTint(day,minimal,mist)??(minimal?'transparent':C.paper),opacity:inMonth?1:day.forecast==='period'?.75:.42,overflow:'hidden',
     ...dayOutline(day),...(day.selected?{borderColor:warm?warmSurfaces.selection:minimal?C.ink:hasEvent(day)?'#b9a8ff':'#8f72b8',borderWidth:hasEvent(day)?2:1.5,borderStyle:'solid' as const}:{}),
     alignItems:'center',justifyContent:'flex-start',paddingTop:8,gap:3,
    }}>
     <ShiftStripe shift={day.shift}/>
     <PeriodBar day={day}/>
     <View style={{width:24,height:24,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:day.today?(minimal?minimalSurfaces.today:hasEvent(day)?'#fff':mist?mistCalendar.event:warm?warmSurfaces.selection:'#1f2433'):'transparent'}}>
      {day.today&&<View testID="shift-today" style={{position:'absolute',width:0,height:0}}/>}
      <T size={14} bold={day.selected||day.today||hasEvent(day)} color={minimal?C.ink:hasEvent(day)?(day.today?(mist?C.ink:eventFill):'#fff'):day.today?'#fff':C.ink}>{Number(date.slice(-2))}</T>
     </View>
     <MarkDots markers={day.markers} ovulation={day.forecast==='ovulation'}/>
    </Pressable>;
   })}
  </View>)}</View></>}
 </View>;
}
function Swatch({fill,outline,stripe}:{fill?:string;outline?:string;stripe?:string}){
 return <View style={{width:16,height:14,borderRadius:4,overflow:'hidden',backgroundColor:fill??'#f8f5f0',
  borderColor:outline??'#e5dfd9',borderWidth:outline?1.5:1,borderStyle:outline?'dashed':'solid'}}>
  {stripe&&<View style={{height:3,backgroundColor:stripe}}/>}
 </View>;
}
export function MonthStatistics({data,month}:{data:ShiftCalendarData;month:string}){
 const C=usePlannerColors();
 const {theme}=useApp().state.settings;
 const categories=[
  {label:'События',color:theme==='minimal'?minimalSurfaces.event:theme==='mist'?mistCalendar.event:eventFill,count:data.events.filter(event=>event.date.startsWith(month)).length},
  {label:'Мигрень',color:markerStyles.migraine.color,count:data.migraines.filter(entry=>entry.date.startsWith(month)).length},
  {label:'Половой акт',color:markerStyles.personal.color,count:data.personal.filter(entry=>entry.date.startsWith(month)).length},
 ];
 const total=categories.reduce((sum,item)=>sum+item.count,0);
 const circumference=2*Math.PI*61;
 let offset=0;
 return <View style={{...cardStyle,backgroundColor:theme==='minimal'?minimalSurfaces.calendarCard:C.paper,borderColor:C.line,padding:16,gap:12}}>
  <T center bold size={16}>Статистика за месяц</T>
  <View accessible={false} aria-hidden style={{alignItems:'center'}}>
   <Svg width={164} height={164} viewBox="0 0 164 164">
    <Circle cx={82} cy={82} r={61} fill="none" stroke={C.line} strokeWidth={20}/>
    {categories.filter(item=>item.count>0).map(item=>{
     const length=circumference*item.count/total;
     const start=offset;
     offset+=length;
     return <Circle key={item.label} cx={82} cy={82} r={61} rotation={-90} originX={82} originY={82}
      fill="none" stroke={item.color} strokeWidth={20} strokeDasharray={total===item.count?undefined:[length,circumference-length]}
      strokeDashoffset={-start}/>;
    })}
   </Svg>
  </View>
  {categories.map(item=><View key={item.label} style={{flexDirection:'row',alignItems:'center',gap:9}}>
   <View style={{width:10,height:10,borderRadius:5,backgroundColor:item.color}}/>
   <T size={13} style={{flex:1}}>{item.label}</T><T size={13} bold>{item.count}</T>
  </View>)}
 </View>;
}

export function ShiftLegend(){
 const C=usePlannerColors();
 const {theme}=useApp().state.settings;
 const legend:[React.ReactNode,string][]=[
  [<Swatch stripe={firstShiftStripe}/>,'Первая смена'],[<Swatch stripe={secondShiftStripe}/>,'Вторая смена'],[<Swatch fill={theme==='mist'?mistCalendar.period:periodPink}/>,'Месячные'],
  [<Swatch fill={theme==='minimal'?minimalSurfaces.event:theme==='mist'?mistCalendar.event:eventFill}/>,'Событие'],[<MigraineMark size={13}/>,'Мигрень'],[<HeartMark size={13}/>,'Половой акт'],
  [<Swatch outline={forecastRose}/>,'Прогноз месячных'],[<View style={ovulationDot}/>,'Прогноз овуляции'],
 ];
 return <View style={{...cardStyle,backgroundColor:theme==='minimal'?minimalSurfaces.calendarCard:C.paper,borderColor:C.line,padding:10,gap:9}}>{[0,3,6].map(start=><View key={start} style={{flexDirection:'row',gap:3}}>
  {legend.slice(start,start+3).map(([icon,label])=><View key={label} style={{flex:1,flexDirection:'row',alignItems:'center',gap:6}}>
   <View style={{width:18,alignItems:'center'}}>{icon}</View><T size={10.8} style={{flexShrink:1}}>{label}</T>
  </View>)}
 </View>)}</View>;
}
export function DaySummary({data,date,onPress}:{data:ShiftCalendarData;date:string;onPress?:()=>void}){const C=usePlannerColors();
 const minimal=useApp().state.settings.theme==='minimal';
 const index=shiftIndex(data.schedule,date),hours=workingHours(data.schedule,index);
 return <Pressable accessibilityRole={onPress?'button':undefined} onPress={onPress} style={{...cardStyle,backgroundColor:minimal?minimalSurfaces.calendarCard:C.paper,borderColor:minimal?'transparent':C.line,borderRadius:minimal?19:cardStyle.borderRadius,padding:12,gap:8}}>
  <T bold size={15}>{dateLabel(date)}</T>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
   <ShiftBadge shift={index}/><View style={{flex:1}}><T bold size={13}>{shiftLabels[index]}</T>{!!hours&&<T size={12} muted>{hours}</T>}</View>
   {onPress&&<Icon name="next" color={C.muted} size={17}/>}
  </View>
 </Pressable>;
}
export function DayEvents({events,onAdd,onEdit}:{events:CalendarEvent[];onAdd:()=>void;onEdit:(event:CalendarEvent)=>void}){const C=usePlannerColors();
 return <View style={{...cardStyle,backgroundColor:C.paper,borderColor:C.line}}>
  <View style={{paddingLeft:12,paddingRight:4,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T bold size={14}>События</T><Action icon="plus" label="Добавить событие" color={shiftColors[1]} onPress={onAdd}/></View>
  {events.map(event=><Pressable key={event.id} accessibilityRole="button" accessibilityLabel={event.time+' '+event.title} onPress={()=>onEdit(event)} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:9,padding:10,borderTopWidth:1,borderColor:'#ede8e3'}}>
   <T muted size={12}>{event.time}</T><Marker kind="event"/><T style={{flex:1}} lines={2} size={13}>{event.title}</T>
   {event.reminderEnabled&&<Icon name="bell" color={shiftColors[1]} size={15}/>}<Icon name="next" size={15} color={C.muted}/>
  </Pressable>)}
  {!events.length&&<View style={{padding:12,gap:5}}><T muted size={12}>На этот день событий нет</T><Pressable accessibilityRole="button" onPress={onAdd}><T color={shiftColors[1]} size={13}>＋ Добавить событие</T></Pressable></View>}
 </View>;
}
export function ShiftRows({data,dates}:{data:ShiftCalendarData;dates:string[]}){
 return <>{dates.map(date=>{
  const shift=shiftIndex(data.schedule,date);
  return <View key={date} style={{paddingHorizontal:9,paddingVertical:5,flexDirection:'row',alignItems:'center',gap:7,borderTopWidth:1,borderColor:'#ede8e3'}}>
   <ShiftBadge shift={shift} size={23}/><T style={{flex:1}} size={11}>{dateLabel(date)}</T>
   <T muted size={10} style={{flex:1}}>{shiftLabels[shift]}</T><T muted size={10}>{workingHours(data.schedule,shift)}</T>
  </View>;
 })}</>;
}
export function DayOption({icon,label,value,color,onPress}:{icon:IconName;label:string;value:string;color:string;onPress:()=>void}){const C=usePlannerColors();
 return <Pressable accessibilityRole="button" accessibilityLabel={label+' — '+value} onPress={onPress} style={{minHeight:46,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:12,borderBottomWidth:1,borderColor:'#ede8e3'}}>
  <Icon name={icon} size={19} color={color}/><T style={{flex:1}} size={13}>{label}</T><T size={11} muted>{value}</T><Icon name="next" size={15} color={C.muted}/>
 </Pressable>;
}
