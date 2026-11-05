import React, {useState} from 'react';
import {Pressable, View} from 'react-native';
import {addDays, cycleLength, periodDays, periodHistory, type ShiftCalendarData, type CycleRange} from '@life-os/domain/shift-calendar';
import {Icon} from '../components/Icon';
import {Primary, T, usePlannerColors} from './ui';

const rose='#d64769';
const dateFormat=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const format=(date:string)=>dateFormat.format(new Date(date+'T12:00:00Z')).replace(/ г\.$/,'');

export function PeriodHistory({data,onEdit,onAdd}:{data:ShiftCalendarData;onEdit:(range:CycleRange)=>void;onAdd:()=>void}){
 const C=usePlannerColors();
 const [showForecast,setShowForecast]=useState(false);
 const rows=periodHistory(data.cycles);
 const expectedLength=cycleLength(data.preferences.cycleLength);
 const next=rows[0]&&addDays(rows[0].range.startDate,expectedLength);
 const scale=Math.max(expectedLength,...rows.map(row=>Math.max(row.periodLength,row.cycleLength??0)));
 return <View style={{backgroundColor:C.paper,borderRadius:22,padding:16,gap:12}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
   <T size={21} bold>История</T>
   {!!next&&<Pressable accessibilityRole="button" accessibilityState={{expanded:showForecast}}
    onPress={()=>setShowForecast(value=>!value)} style={{paddingVertical:8}}>
    <T color={C.red} bold size={13}>Прогноз</T>
   </Pressable>}
  </View>
  {showForecast&&next&&<View style={{padding:12,borderRadius:12,backgroundColor:C.lavender,gap:4}}>
   <T size={13} bold>Ожидаемые даты по последней отметке</T>
   <T size={13}>{format(next)} — {format(addDays(next,periodDays-1))}</T>
  </View>}
  {!rows.length&&<T muted>Здесь появятся даты отмеченных месячных.</T>}
  {rows.map(({range,periodLength,cycleLength:actualLength})=>{
   const dates=format(range.startDate)+' — '+format(range.endDate);
   const trackLength=Math.max(periodLength,actualLength??expectedLength);
   return <Pressable key={range.id} accessibilityRole="button"
    accessibilityLabel={dates+', месячные: '+periodLength+' дн.'+(actualLength? ', цикл: '+actualLength+' дн.':'')}
    onPress={()=>onEdit(range)} style={({pressed})=>({opacity:pressed?.65:1,flexDirection:'row',alignItems:'center',gap:10,minHeight:52})}>
    <View style={{flex:1,gap:5}}>
     <T bold size={12}>{dates}</T>
     <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
      <View style={{flex:1}}>
       <View style={{width:`${trackLength/scale*100}%`,height:16,borderRadius:8,backgroundColor:C.line}}>
        <View style={{width:`${periodLength/trackLength*100}%`,minWidth:21,height:16,borderRadius:8,backgroundColor:rose,justifyContent:'center'}}>
         <T center size={10} color="#fff">{periodLength}</T>
        </View>
       </View>
      </View>
      <T size={11} muted style={{width:22}}>{actualLength??''}</T>
     </View>
    </View>
    <Icon name="next" color={C.muted} size={17}/>
   </Pressable>;
  })}
  <Primary quiet onPress={onAdd}>＋ Отметить месячные</Primary>
 </View>;
}
