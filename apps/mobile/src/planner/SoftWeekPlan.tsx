import {instant} from '../design/instant';
import React,{useEffect,useRef,useState} from 'react';
import {useHorizontalSwipe} from '../design/swipe';
import {Image,Platform,Pressable,ScrollView,View} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {Icon} from '../components/Icon';
import {FadeRise} from '../design/motion';
import {SoftPressable} from '../design/SoftPressable';
import {palette,shadows} from '../design/system';
import {Action,T,pictureSource} from './ui';
import {shiftDay,weekStart} from './WeekSlider';

/**
 * «Питание → План» in Soft Future: the week as horizontally scrolling day columns (photo + full dish name in every
 * filled cell), snapping column by column, plus the chosen day's list underneath with the full names.
 * Data, actions and the four meals are the existing ones; only the presentation differs.
 */
export const MEALS=['Завтрак','Обед','Ужин','Перекус'] as const;
const DAYS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const GAP=8;
const range=(monday:string)=>{
 const f=(d:string,o:Intl.DateTimeFormatOptions)=>new Date(d+'T12:00:00').toLocaleDateString('ru-RU',o);
 const end=shiftDay(monday,6);
 return new Date(monday+'T12:00:00').getMonth()===new Date(end+'T12:00:00').getMonth()
  ?`${f(monday,{day:'numeric'})} – ${f(end,{day:'numeric',month:'long'})}`
  :`${f(monday,{day:'numeric',month:'short'})} – ${f(end,{day:'numeric',month:'short'})}`;
};

export function SoftWeekPlan({date,setDate,dishes,open,assign}:{date:string;setDate:(d:string)=>void;dishes:RecordObject[];open:(o:RecordObject)=>void;assign:(slot:{date:string;meal:string})=>void}){
 const monday=weekStart(date);
 const days=DAYS.map((label,i)=>({label,key:shiftDay(monday,i)}));
 const selected=Math.max(0,days.findIndex(d=>d.key===date));
 const dish=(key:string,meal:string)=>dishes.find(d=>d.data.plan?.some((p:any)=>p.date===key&&p.meal===meal));
 const [width,setWidth]=useState(0);
 // Wide enough for normal text: about 3⅓ columns on a regular phone (a hint that the week continues), never narrower than 92 px.
 const column=width?Math.max(92,Math.floor((width-GAP*3)/3.35)):0;
 const scroll=useRef<React.ElementRef<typeof ScrollView>>(null);
 const [offset,setOffset]=useState(0);
 // On opening and on a new week, the chosen day is shown at once, with the previous day next to it.
 useEffect(()=>{if(!column)return;const x=Math.max(0,(selected-1)*(column+GAP));scroll.current?.scrollTo({x,animated:false});setOffset(x);},[column,monday]);
 const today=new Date();const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const weekSwipe=useHorizontalSwipe({onNext:()=>setDate(shiftDay(date,7)),onPrev:()=>setDate(shiftDay(date,-7))});
 return <View style={{gap:8}} accessibilityLabel="План питания">
  {/* Week switching by swipe lives on this header row: the day cards below already scroll horizontally on their own. */}
  <View {...weekSwipe.panHandlers} style={[{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},weekSwipe.style]}>
   <Action icon="back" label="Предыдущая неделя · План питания" onPress={()=>setDate(shiftDay(date,-7))}/>
   <T size={13.5} color={palette.inkMuted}>{range(monday)}</T>
   <Action icon="next" label="Следующая неделя · План питания" onPress={()=>setDate(shiftDay(date,7))}/>
  </View>
  {/* The right screen edge belongs to the app's swipe-back gesture: the scrolling week stops just short of it. */}
  <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{marginRight:10}}>
   {column>0&&<ScrollView testID="meal-week" ref={scroll} horizontal showsHorizontalScrollIndicator={false}
    snapToInterval={column+GAP} snapToAlignment="start" decelerationRate="fast" disableIntervalMomentum
    scrollEventThrottle={32} onScroll={e=>setOffset(e.nativeEvent.contentOffset.x)}
    // iOS/Android snap via snapToInterval; the web build gets the same column snapping from CSS scroll-snap.
    style={Platform.OS==='web'?({scrollSnapType:'x mandatory',overscrollBehaviorX:'contain'} as object):undefined}
    contentContainerStyle={{gap:GAP,paddingRight:2}}>
    {days.map(({label,key},i)=>{const on=i===selected;return <View key={key} testID={'meal-day-'+key}
     style={{...(Platform.OS==='web'?({scrollSnapAlign:'start'} as object):null),width:column,borderRadius:16,padding:7,paddingBottom:9,backgroundColor:on?'rgba(251,249,250,0.98)':'rgba(251,249,250,0.74)',
      borderWidth:on?1.5:1,borderColor:on?palette.graphite:'rgba(41,38,45,0.06)',...(on?shadows[1]:null)}}>
     <Pressable accessibilityRole="button" accessibilityState={{selected:on}} aria-selected={on} accessibilityLabel={'День плана '+key} onPress={()=>setDate(key)}
      style={{flexDirection:'row',alignItems:'baseline',gap:5,paddingHorizontal:7,minHeight:30,paddingTop:4,borderRadius:10,backgroundColor:on?palette.graphite:'transparent'}}>
      <T size={15.5} bold color={on?'#f4f0f2':palette.ink}>{new Date(key+'T12:00:00').getDate()}</T>
      <T size={12} color={on?'rgba(244,240,242,0.78)':key===todayKey?palette.dustyRose:palette.inkMuted} bold={key===todayKey}>{label}</T>
     </Pressable>
     {MEALS.map(meal=>{const o=dish(key,meal);return <View key={meal} style={{marginTop:5}}>
      <T size={9.5} color="#8a8189" bold style={{letterSpacing:0.5,textTransform:'uppercase',marginHorizontal:2,marginBottom:2,lineHeight:12}}>{meal}</T>
      <MealCell o={o} width={column-14} meal={meal} day={key} onPress={()=>o?open(o):instant(()=>assign({date:key,meal}))} onLongPress={()=>assign({date:key,meal})}/>
     </View>;})}
    </View>;})}
   </ScrollView>}
  </View>
  <View style={{flexDirection:'row',justifyContent:'center',gap:5}} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
   {days.map((d,i)=>{const first=column?Math.round(offset/(column+GAP)):0;const visible=i>=first&&i<first+3;return <View key={d.key}
    style={{width:i===selected?14:5,height:5,borderRadius:3,backgroundColor:i===selected?palette.graphite:visible?'rgba(41,38,45,0.34)':'rgba(41,38,45,0.14)'}}/>;})}
  </View>
  <FadeRise key={date} style={{gap:8,marginTop:2}}>
   <T size={15} bold>{new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'}).replace(/^./,c=>c.toUpperCase())}</T>
   <View style={{backgroundColor:'rgba(251,249,250,0.94)',borderRadius:18,borderWidth:1,borderColor:'rgba(41,38,45,0.06)',overflow:'hidden',...shadows[1]}}>
    {MEALS.map((meal,i)=>{const o=dish(date,meal);const source=o&&pictureSource(o);return <SoftPressable key={meal} accessibilityRole="button"
     accessibilityLabel={meal+(o?' · '+o.title:' · Добавить')} onPress={()=>o?open(o):instant(()=>assign({date,meal}))} onLongPress={()=>assign({date,meal})}
     style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:9,paddingHorizontal:12,minHeight:58,borderTopWidth:i?1:0,borderColor:'rgba(41,38,45,0.08)'}}>
     {o&&source?<Image source={source} resizeMode="cover" style={{width:44,height:44,borderRadius:11,backgroundColor:'#eee8eb'}}/>
      :<View style={{width:44,height:44,borderRadius:11,borderWidth:1,borderStyle:'dashed',borderColor:'rgba(41,38,45,0.18)',alignItems:'center',justifyContent:'center'}}><Icon name={o?'soup':'plus'} size={16} color="#a99ea6"/></View>}
     <View style={{flex:1,minWidth:0}}>
      <T size={11.5} color="#7d747c">{meal}</T>
      <T size={14.5} color={o?palette.ink:palette.inkMuted} style={{lineHeight:20}}>{o?o.title:'Добавить блюдо'}</T>
     </View>
     {o&&<Icon name="next" size={16} color="#b0a8b0"/>}
    </SoftPressable>;})}
   </View>
  </FadeRise>
 </View>;
}

function MealCell({o,width,meal,day,onPress,onLongPress}:{o?:RecordObject;width:number;meal:string;day:string;onPress:()=>void;onLongPress:()=>void}){
 const source=o?pictureSource(o):undefined;
 const [failed,setFailed]=useState(false);
 if(!o)return <Pressable accessibilityRole="button" accessibilityLabel={meal+' · '+day+' · Добавить'} onPress={onPress} onLongPress={onLongPress}
  style={{width,height:Math.round(width*0.6),borderRadius:9,borderWidth:1,borderStyle:'dashed',borderColor:'rgba(41,38,45,0.16)',alignItems:'center',justifyContent:'center',marginBottom:49.5}}>
  <Icon name="plus" size={14} color="#bdb3bb"/>
 </Pressable>;
 // Long single words get a slightly smaller size instead of being broken in the middle.
 const long=o.title.split(/\s+/).some(w=>w.length>11);
 return <SoftPressable accessibilityRole="button" accessibilityLabel={meal+' · '+day+' · '+o.title} onPress={onPress} onLongPress={onLongPress} style={{width}}>
  {source&&!failed
   ?<Image source={source} resizeMode="cover" onError={()=>setFailed(true)} style={{width,height:Math.round(width*0.6),borderRadius:9,backgroundColor:'#eee8eb'}}/>
   :<View style={{width,height:Math.round(width*0.6),borderRadius:9,backgroundColor:'#ede5ea',alignItems:'center',justifyContent:'center'}}><Icon name="soup" size={18} color="#a99ea6"/></View>}
  <T size={long?11.5:12.5} lines={3} color={palette.ink} style={{lineHeight:15.5,marginTop:3,marginHorizontal:1,minHeight:46.5}}>{o.title}</T>
 </SoftPressable>;
}
