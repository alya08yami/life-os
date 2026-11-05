import {cycleForecast} from '@life-os/domain/shift-calendar';
import {dayOutline} from './ShiftCalendarView';
import {useApp} from '../context';
import {calendarPeriodFill,mistCalendar} from '../design/themes';
import {usePlannerColors} from './ui';
import {useSoftMotion} from '../design/motion';
import {SoftProductList} from './SoftShopping';
import {router} from 'expo-router';
import {SoftPressable} from '../design/SoftPressable';
import {palette} from '../design/system';
import {MealPlan} from './MealPlan';
import {useStepState,useTabState} from './navigation';
import {object} from './seed';
import React,{useState,useRef} from 'react';import {View,Pressable,Linking,ScrollView,TextInput} from 'react-native';import type {RecordObject} from '@life-os/domain/planner';import {localDate,comparableOffers} from '@life-os/domain/planner';import {usePlanner} from './context';import {T,C,Primary,SegmentedTabs,Picture,Action,EmptyState,Input,DateLabel} from './ui';import {Icon} from '../components/Icon';import {WeekCalendar} from './Dashboard';import type {ListProps} from './Lists';
export function ProductCard({item,onPress}:{item:RecordObject;onPress:()=>void}){const C=usePlannerColors();const {patch}=usePlanner();const matches=comparableOffers({brand:item.data.brand,model:item.data.model,package:item.data.variant},item.data.currency??'₴',item.data.offers??[]);const price=matches[0]?.price??item.data.price;return <View style={{flexDirection:'row',padding:10,backgroundColor:C.paper,borderRadius:17,gap:12,alignItems:'center'}}><Pressable onPress={onPress} style={{flex:1,gap:4}}><T size={13}>{item.title}</T><T size={14} bold>{price?`от ${Number(price).toLocaleString('ru-RU')} ${item.data.currency??'₴'}`:'Цена не найдена'}</T>{!!item.data.discount&&<View style={{alignSelf:'flex-start',backgroundColor:'#deede1',borderRadius:10,paddingHorizontal:7,paddingVertical:2}}><T size={11} color="#188844">{item.data.discount}%</T></View>}</Pressable><Action icon="heart" label={'Желание: '+item.title} filled={!!item.favorite} color={item.favorite?'#e86d73':'#96949b'} onPress={()=>patch(item.id,{favorite:!item.favorite}).catch(()=>{})}/></View>;}
export function Shopping({items,open,add}:ListProps){const softShop=useSoftMotion().enabled;const [tab,setTab]=useTabState('shopping.tab','Все');const [query,setQuery]=useStepState('shopping.query','',false);const [list,setList]=useStepState('shopping.list','',false);const rows=items.filter(o=>o.type==='product'&&(tab!=='Желания'||o.favorite)&&(tab!=='Куплено'||o.status==='completed')&&o.title.toLowerCase().includes(query.toLowerCase())&&(tab!=='Списки'||!list||o.data.list===list));if(softShop){const lists=[...new Set(items.filter(o=>o.type==='product'&&typeof o.data.list==='string'&&o.data.list.trim()).map(o=>String(o.data.list).trim()))].sort((x,y)=>x.localeCompare(y,'ru'));return <><SegmentedTabs values={['Все','Желания','Списки','Куплено']} value={tab} onChange={setTab}/><SoftProductList rows={rows} open={open} lists={lists} list={list} setList={setList} showLists={tab==='Списки'}/>{!rows.length&&<EmptyState text={tab==='Желания'?'Отметьте сердечком то, что хочется купить.':tab==='Куплено'?'Купленные товары появятся здесь.':undefined}/>}<Primary quiet onPress={()=>add('product')}>＋ Добавить товар</Primary></>;}return <><SegmentedTabs values={['Все','Желания','Списки','Куплено']} value={tab} onChange={setTab}/>{tab==='Списки'&&<Input label="Название списка" value={list} onChange={setList}/>}<View style={{gap:9}}>{rows.map(o=><ProductCard key={o.id} item={o} onPress={()=>open(o)}/>)}</View>{!rows.length&&<EmptyState/>}<Primary quiet onPress={()=>add('product')}>＋ Добавить товар</Primary></>;}
export function NotesGrid({items,open,tab}:Pick<ListProps,'items'|'open'>&{tab:string}){
 const C=usePlannerColors();
 const {patch}=usePlanner();
 const [query,setQuery]=useStepState('work.query','',false);
 const [newest,setNewest]=useState(true);
 const rows=items.filter(item=>item.type==='note'&&(item.data.tab??'Работа')===tab&&
  [item.title,item.description].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  .sort((a,b)=>(newest?1:-1)*b.updatedAt.localeCompare(a.updatedAt));
 const pinned=rows.filter(item=>item.pinned);
 const soft=useSoftMotion().enabled;
 if(soft)return <SoftNotes rows={rows} pinned={pinned} open={open} query={query} setQuery={setQuery} newest={newest} setNewest={setNewest}/>;
 const grid=(notes:RecordObject[])=><View style={{flexDirection:'row',flexWrap:'wrap',marginHorizontal:-5}}>
  {notes.map(item=><View key={item.id} style={{width:'33.333%',padding:5}}>
   <View style={{flex:1,borderRadius:15,padding:10,backgroundColor:C.paper}}>
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>open(item)} style={{flex:1,gap:7}}>
     <View style={{paddingHorizontal:3,gap:3,flex:1}}>
      <T bold size={15} lines={1} style={{paddingRight:23}}>{item.title}</T>
      <T muted size={11} lines={2} style={{minHeight:30}}>{item.description.trim()||'Заметка без текста'}</T>
      <View style={{borderTopWidth:1,borderColor:C.line,paddingVertical:5,flexDirection:'row',justifyContent:'space-between'}}>
       <DateLabel date={item.updatedAt}/>{item.favorite&&<T size={11} color={C.purple}>★</T>}
      </View>
     </View>
    </Pressable>
    <View style={{position:'absolute',right:8,top:8,borderRadius:9,backgroundColor:C.paper}}>
     <Pressable accessibilityRole="button" accessibilityLabel={(item.pinned?'Открепить: ':'Закрепить: ')+item.title}
      accessibilityState={{selected:!!item.pinned}} onPress={()=>patch(item.id,{pinned:!item.pinned}).catch(()=>{})} style={{padding:7}}>
      <Icon name="bookmark" size={15} color={C.purple} filled={!!item.pinned}/>
     </Pressable>
    </View>
   </View>
  </View>)}
 </View>;
 return <>
  <View style={{flexDirection:'row',alignItems:'center',gap:9,borderRadius:13,backgroundColor:C.paper,paddingHorizontal:12}}>
   <Icon name="search" size={19} color={C.ink}/>
   <TextInput value={query} onChangeText={setQuery} accessibilityLabel="Поиск по заметкам" placeholder="Поиск по заметкам"
    placeholderTextColor={C.muted} style={{flex:1,minHeight:44,fontFamily:'Inter',fontSize:14,color:C.ink}}/>
  </View>
  {pinned.length>0&&<View style={{gap:5,marginTop:7}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
    <T size={18} bold>Закреплено</T><T size={12} muted>Заметки · {pinned.length}</T>
   </View>
   {grid(pinned)}
  </View>}
  <View style={{gap:5,marginTop:8}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
    <T size={18} bold>Все заметки</T>
    <Pressable accessibilityRole="button" accessibilityLabel={newest?'Сначала новые':'Сначала старые'} onPress={()=>setNewest(value=>!value)} style={{padding:6}}>
     <T muted size={12}>По дате {newest?'↓':'↑'}</T>
    </Pressable>
   </View>
   {rows.length?grid(rows):<EmptyState text={query?'Заметки не найдены':'Пока нет заметок'}/>}
  </View>
 </>;
}
/**
 * «Работа и идеи» in Soft Future: pinned notes in a compact horizontal strip, all other notes in two readable columns.
 * A pinned note is shown once (in the strip) — only the presentation changes; search, sorting and pinning are the same.
 */
function SoftNotes({rows,pinned,open,query,setQuery,newest,setNewest}:{rows:RecordObject[];pinned:RecordObject[];open:(o:RecordObject)=>void;query:string;setQuery:(v:string)=>void;newest:boolean;setNewest:(f:(v:boolean)=>boolean)=>void}){
 const C=usePlannerColors();const {patch}=usePlanner();
 const rest=rows.filter(item=>!item.pinned);
 const [width,setWidth]=useState(0);
 const columns=width>=600?3:2;
 const card={backgroundColor:'rgba(251,249,250,0.94)',borderRadius:15,borderWidth:1,borderColor:'rgba(41,38,45,0.06)'};
 const preview=(item:RecordObject)=>item.description.trim()||'Заметка без текста';
 const pin=(item:RecordObject)=><Pressable accessibilityRole="button" accessibilityLabel={(item.pinned?'Открепить: ':'Закрепить: ')+item.title}
  accessibilityState={{selected:!!item.pinned}} aria-selected={!!item.pinned} hitSlop={6} onPress={()=>patch(item.id,{pinned:!item.pinned}).catch(()=>{})}
  style={{width:36,height:36,alignItems:'center',justifyContent:'center',marginTop:-8,marginRight:-8}}>
  <Icon name="bookmark" size={15} color={item.pinned?palette.mauve:'#a39aa2'} filled={!!item.pinned}/>
 </Pressable>;
 return <>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <View style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:9,borderRadius:13,backgroundColor:'rgba(251,249,250,0.94)',paddingHorizontal:12}}>
    <Icon name="search" size={18} color={palette.inkMuted}/>
    <TextInput value={query} onChangeText={setQuery} accessibilityLabel="Поиск по заметкам" placeholder="Поиск по заметкам"
     placeholderTextColor={C.muted} style={{flex:1,minWidth:0,minHeight:44,fontFamily:'Inter',fontSize:14,color:C.ink}}/>
   </View>
   {/* Quick way to «Мои дела» (it used to live in this screen's own bottom bar). */}
   <SoftPressable accessibilityRole="button" accessibilityLabel="Мои дела" onPress={()=>router.push('/tasks')}
    style={{minHeight:44,borderRadius:13,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(251,249,250,0.94)',borderWidth:1,borderColor:'rgba(41,38,45,0.07)'}}>
    <Icon name="tasks" size={17} color={palette.ink}/><T size={13.5}>Дела</T>
   </SoftPressable>
  </View>
  {pinned.length>0&&<View style={{gap:8,marginTop:6}}>
   <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between'}}>
    <T size={17} bold>Закреплено</T><T size={12} muted>{pinned.length}</T>
   </View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingRight:4}}>
    {pinned.map(item=><SoftPressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>open(item)}
     style={{...card,width:156,paddingVertical:10,paddingLeft:12,paddingRight:10}}>
     <View style={{flexDirection:'row',alignItems:'flex-start',gap:4}}>
      <T size={14} bold lines={1} style={{flex:1}}>{item.title}</T>{pin(item)}
     </View>
     <T size={12} muted lines={1} style={{marginTop:-4}}>{preview(item)}</T>
    </SoftPressable>)}
   </ScrollView>
  </View>}
  <View style={{gap:8,marginTop:6}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
    <T size={17} bold>{pinned.length?'Остальные заметки':'Все заметки'}</T>
    <Pressable accessibilityRole="button" accessibilityLabel={newest?'Сначала новые':'Сначала старые'} onPress={()=>setNewest(value=>!value)} style={{minHeight:36,justifyContent:'center',paddingHorizontal:6}}>
     <T muted size={12.5}>По дате {newest?'↓':'↑'}</T>
    </Pressable>
   </View>
   {rest.length?<View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    {width>0&&rest.map(item=><SoftPressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>open(item)}
     style={{...card,width:(width-8*(columns-1))/columns,minHeight:112,padding:12}}>
     <View style={{flexDirection:'row',alignItems:'flex-start',gap:4}}>
      <T size={15} bold lines={2} style={{flex:1,lineHeight:19}}>{item.title}</T>{pin(item)}
     </View>
     <T size={13} lines={3} color={palette.inkMuted} style={{lineHeight:18,marginTop:2,flex:1}}>{preview(item)}</T>
     <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
      <T size={11.5} color="#8a8189">{new Date(item.updatedAt).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</T>
      {item.favorite&&<T size={12} color={palette.mauve}>★</T>}
     </View>
    </SoftPressable>)}
   </View>:<EmptyState text={query?'Заметки не найдены':pinned.length?'Все заметки закреплены':'Пока нет заметок'}/>}
  </View>
 </>;
}
export function Food({items,open,add}:ListProps){const C=usePlannerColors();const {patch}=usePlanner();const [tab,setTab]=useTabState('food.tab','План');const [category,setCategory]=useTabState('food.category','Все');const [query,setQuery]=useStepState('food.query','',false);const rows=items.filter(o=>o.type===(tab==='Мои блюда'?'dish':'recipe')&&(category==='Все'||o.data.category===category)&&o.title.toLowerCase().includes(query.toLowerCase()));return <><SegmentedTabs values={['План','Мои блюда','Рецепты']} value={tab} onChange={setTab}/>{tab==='План'?<MealPlan items={items} open={open}/>:<><Input placeholder={tab==='Мои блюда'?'Поиск по блюдам…':'Поиск рецептов…'} value={query} onChange={setQuery}/><SegmentedTabs values={['Все','Завтраки','Обеды','Ужины','Перекусы']} value={category} onChange={setCategory}/>{rows.map(o=><Pressable key={o.id} onPress={()=>open(o)} style={{padding:9,backgroundColor:C.paper,borderRadius:16,flexDirection:'row',gap:12,alignItems:'center'}}><Picture item={o} size={66}/><View style={{flex:1,gap:5}}><T size={13}>{o.title}</T><T size={11} muted>{o.data.calories??'—'} ккал　Б {o.data.protein??'—'}　Ж {o.data.fat??'—'}　У {o.data.carbs??'—'}</T></View><Action icon="heart" filled={!!o.favorite} color={o.favorite?C.red:C.muted} label={'Избранное: '+o.title} onPress={()=>patch(o.id,{favorite:!o.favorite}).catch(()=>{})}/></Pressable>)}{!rows.length&&<EmptyState/>}</>}</>;}
export function Finance({items,open,add}:ListProps){const C=usePlannerColors();const soft=useSoftMotion().enabled;const {theme}=useApp().state.settings;const periodFill=theme==='mist'?mistCalendar.period:calendarPeriodFill;const {state,update,setToast}=usePlanner();const [direction,setDirection]=useTabState('finance.direction','Доходы');const [currency,setCurrency]=useStepState('finance.currency','$');const [month,setMonthKey]=useStepState('finance.month','2026-10-01',false);const monthDate=new Date(month+'T12:00:00');const [selected,setSelected]=useStepState('finance.date','',false);const [entryOpen,setEntryOpen,replaceEntryOpen]=useStepState('finance.entry',false);const [amount,setAmount]=useState('');const [error,setError]=useState('');const session=useRef<{id:number;date:string;direction:string;currency:string;value:string;original:string;entryIds:string[];saving:boolean}|null>(null);const sequence=useRef(0);const [noteOpen,setNoteOpen,replaceNoteOpen]=useStepState('finance.noteOpen',false);const [note,setNote]=useState('');const noteDraft=useRef(''),noteSaving=useRef(false);const [showNotes,setShowNotes]=useStepState('finance.notes',true);
const rows=items.filter(o=>o.type==='transaction'&&(o.data.currency??'$')===currency&&(o.data.direction??'Доходы')===direction&&String(o.data.plannedDate??localDate(o.createdAt)).startsWith(month.slice(0,7)));const total=rows.reduce((s,o)=>s+Math.round(Number(o.data.amount??0)*100),0)/100;const days=new Set(rows.map(o=>o.data.plannedDate??localDate(o.createdAt)));const count=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0).getDate(),offset=(monthDate.getDay()+6)%7;const softFin=soft;const colored=softFin?(direction==='Доходы'?'#2F6B5A':'#9A3A52'):direction==='Доходы'?C.green:'#f34f78',tint=softFin?(direction==='Доходы'?'#DDEBE4':'#F4DFE5'):direction==='Доходы'?'#e3efe3':'#fbe7e7';const moveMonth=(by:number)=>setMonthKey(localDate(new Date(monthDate.getFullYear(),monthDate.getMonth()+by,1)));
const enter=(date:string, entries:RecordObject[]=[], value='')=>{
  session.current={id:++sequence.current,date,direction,currency,value,original:value,entryIds:entries.map(entry=>entry.id),saving:false};
  setSelected(date);
  setAmount(value);
  setError('');
  setEntryOpen(true);
};
const saveAmount=async()=>{
  const draft=session.current;
  if(!draft||draft.saving)return;
  const clean=draft.value.trim().replace(',','.');
  const close=()=>{
    if(session.current?.id!==draft.id)return;
    session.current=null;
    replaceEntryOpen(false);
    setAmount('');
    setError('');
  };
  if(clean===draft.original){close();return;}
  if(clean&&(!/^\d+(?:\.\d{1,2})?$/.test(clean)||!Number.isFinite(Number(clean))||Number(clean)<=0)){
    setError('Введите сумму больше нуля, до двух знаков после запятой.');
    return;
  }
  draft.saving=true;
  const entry=clean?object('transaction','finance',draft.direction==='Доходы'?'Доход':'Расход',{
    amount:Number(clean),direction:draft.direction,currency:draft.currency,plannedDate:draft.date,
  }):null;
  const entryIds=new Set(draft.entryIds);
  try{
    await update(s=>({...s,objects:[...s.objects.filter(o=>!entryIds.has(o.id)),...(entry?[entry]:[])]}));
    close();
    setToast({text:entry?'Сохранено: '+Number(clean).toLocaleString('ru-RU')+' '+draft.currency:'Сумма удалена'});
  }catch{
    draft.saving=false;
    if(session.current?.id===draft.id)setError('Не удалось сохранить сумму. Попробуйте ещё раз.');
  }
};
const saveNote=async()=>{const text=noteDraft.current.trim();if(noteSaving.current)return;if(!text){replaceNoteOpen(false);return;}noteSaving.current=true;const escaped=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');const o=object('note','finance',text.split('\n')[0].slice(0,120),{tab:'Финансы',html:'<p>'+escaped+'</p>'});o.description=text;try{await update(s=>({...s,objects:[...s.objects,o]}));setNote('');noteDraft.current='';replaceNoteOpen(false);setShowNotes(true);}catch{setError('Не удалось сохранить заметку.');}finally{noteSaving.current=false;}};
return <><SegmentedTabs values={['Доходы','Расходы']} value={direction} onChange={setDirection}/>{new Set(items.filter(o=>o.type==='transaction').map(o=>o.data.currency??'$')).size>1&&<SegmentedTabs values={[...new Set(items.filter(o=>o.type==='transaction').map(o=>String(o.data.currency??'$')))]} value={currency} onChange={setCurrency}/>}<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Action icon="back" label="Предыдущий месяц" onPress={()=>moveMonth(-1)}/><T bold size={18}>{monthDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).replace(' г.','')}</T><Action icon="next" label="Следующий месяц" onPress={()=>moveMonth(1)}/></View><View style={{paddingHorizontal:20,paddingVertical:soft?14:16,borderRadius:24,backgroundColor:soft?'rgba(251,249,250,0.94)':C.paper,borderWidth:1,borderColor:soft?'rgba(41,38,45,0.06)':'#fff',alignItems:'center',gap:soft?2:7}}><T center size={soft?12.5:13} color={soft?palette.inkMuted:undefined}>{soft?(direction==='Доходы'?'Доходы за месяц':'Расходы за месяц'):'Всего за месяц'}</T><T center size={soft?30:18.5} bold color={colored} style={soft?{letterSpacing:-0.5,lineHeight:38}:undefined}>{total.toLocaleString('ru-RU')} {currency}</T></View><View style={{flexDirection:'row'}}>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(s=><T key={s} center size={12} color={soft?palette.inkMuted:undefined} style={{width:'14.285%'}}>{s}</T>)}</View><View style={{flexDirection:'row',flexWrap:'wrap',marginHorizontal:-2}}>{Array.from({length:Math.ceil((count+offset)/7)*7},(_,i)=>{const d=new Date(monthDate.getFullYear(),monthDate.getMonth(),i-offset+1),key=localDate(d);const dayEntries=rows.filter(o=>(o.data.plannedDate??localDate(o.createdAt))===key);const value=dayEntries.reduce((s,o)=>s+Math.round(Number(o.data.amount??0)*100),0)/100;const active=d.getMonth()===monthDate.getMonth();const calendar=state?.shiftCalendar;
const periodDay=calendar?.cycles.some(({startDate,endDate})=>startDate<=key&&key<=endDate);
const forecast=calendar&&!periodDay?cycleForecast(calendar,key):undefined;
const forecastOutline=dayOutline({forecast});
return <View key={i} style={{width:'14.285%',padding:2}}><Pressable accessibilityRole="button" accessibilityLabel={(direction==='Доходы'?'Добавить доход ':'Добавить расход ')+key+(periodDay?', месячные':forecastOutline?', прогноз месячных':'')} onPress={()=>{if(!entryOpen||selected!==key)enter(key);}} style={{height:soft?64:72,borderRadius:12,borderWidth:1,borderColor:periodDay&&selected===key?C.purple:soft?(selected===key?palette.graphite:value?'rgba(41,38,45,0.10)':'rgba(41,38,45,0.05)'):'#fff',backgroundColor:periodDay?periodFill:selected===key?(soft?'rgba(251,249,250,1)':C.lavender):value?tint:soft?'rgba(251,249,250,0.72)':theme==='warm'?C.paper:'#f4f2f0',alignItems:'center',justifyContent:'center',gap:soft?4:7,opacity:active?1:forecastOutline ? 0.75 : 0.35,...forecastOutline}}><T size={14} bold={soft&&value>0} color={periodDay?'#101014':undefined}>{d.getDate()}</T>{entryOpen&&selected===key?<View style={{width:'100%',paddingHorizontal:2}}><TextInput key={session.current?.id} autoFocus selectTextOnFocus accessibilityLabel={direction==='Доходы'?'Сумма дохода':'Сумма расхода'} value={amount} keyboardType="decimal-pad" inputMode="decimal" placeholder="0" returnKeyType="done" onChangeText={v=>{setAmount(v);if(session.current)session.current.value=v;}} onSubmitEditing={()=>saveAmount()} onBlur={()=>saveAmount()} style={{width:'100%',textAlign:'center',fontFamily:'Inter',fontSize:12,color:periodDay?'#101014':C.ink,paddingVertical:5,paddingHorizontal:2,borderWidth:1,borderColor:C.line,borderRadius:11}}/></View>:value>0&&<Pressable accessibilityRole="button" accessibilityLabel={'Изменить сумму '+key} onPress={e=>{e.stopPropagation();enter(key,dayEntries,String(value));}}><T size={soft?11.5:11} bold={soft} color={periodDay?(direction==='Доходы'?'#176547':'#9b2648'):colored}>{value} {currency}</T></Pressable>}</Pressable></View>;})}</View>{error&&<T size={12} color={C.red}>{error}</T>}<View style={{padding:soft?16:18,borderRadius:23,backgroundColor:soft?'rgba(251,249,250,0.94)':C.paper,borderWidth:soft?1:0,borderColor:'rgba(41,38,45,0.06)',flexDirection:'row',gap:15}}><View style={{flex:1,gap:soft?3:5}}><T size={soft?12.5:14} color={soft?palette.inkMuted:undefined}>Дней с {direction==='Доходы'?'доходом':'расходами'}</T><T bold size={soft?22:19}>{days.size}{soft?<T size={13} color={palette.inkMuted}>{' из '+count}</T>:null}</T>{!soft&&<T size={14}>из {count} дней</T>}</View><View style={{width:1,backgroundColor:C.line}}/><View style={{flex:1,gap:soft?3:5}}><T size={soft?12.5:14} color={soft?palette.inkMuted:undefined}>Средний {direction==='Доходы'?'доход':'расход'} в день</T><T bold size={soft?22:19}>{days.size?Math.round(total/days.size):0} {currency}</T></View></View>{selected&&rows.filter(o=>(o.data.plannedDate??localDate(o.createdAt))===selected).map(o=><Pressable key={o.id} onPress={()=>open(o)} style={{padding:10,borderRadius:12,backgroundColor:C.paper}}><T>{o.title}　{o.data.amount} {currency}</T></Pressable>)}<View style={{flexDirection:'row',alignItems:'center'}}><Pressable style={{flex:1}} onPress={()=>setShowNotes(!showNotes)}><T bold size={17}>Заметки　{items.filter(o=>o.type==='note').length}</T></Pressable><Action icon="plus" label="Добавить заметку к финансам" onPress={()=>{setNoteOpen(true);setShowNotes(true);}}/></View>{noteOpen&&<TextInput autoFocus accessibilityLabel="Новая заметка к финансам" placeholder="Напишите заметку…" value={note} onChangeText={v=>{setNote(v);noteDraft.current=v;}} onSubmitEditing={()=>saveNote()} onBlur={()=>saveNote()} style={{fontFamily:'Inter',fontSize:14,color:C.ink,padding:13,borderRadius:13,backgroundColor:C.paper,borderWidth:1,borderColor:C.line}}/>}{showNotes&&items.filter(o=>o.type==='note').map(o=><Pressable key={o.id} onPress={()=>open(o)} style={{padding:12,borderRadius:13,backgroundColor:C.paper}}><T>{o.title}</T></Pressable>)}</>;}
