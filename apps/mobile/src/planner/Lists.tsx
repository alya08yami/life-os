import {usePlannerColors} from './ui';
import {useStepState,useTabState} from './navigation';
import * as Crypto from 'expo-crypto';
import {Icon} from '../components/Icon';
import React,{useState,useRef,useEffect} from 'react';import {SwipeableRow} from '../design/SwipeableRow';import {useSoftMotion} from '../design/motion';import {View,Pressable,Linking,Animated,TextInput} from 'react-native';import type {RecordObject} from '@life-os/domain/planner';import {medicationStock,regularStock,urgencySort,completeProgress,elapsedDays,localDate,restoreCompleted} from '@life-os/domain/planner';import {usePlanner} from './context';import {T,C,Primary,SegmentedTabs,CheckableListItem,Picture,Action,DateLabel,EmptyState,StatusCheckbox,ConfirmationSheet,Input,AttachmentPicker} from './ui';
export type ListProps={items:RecordObject[];open:(o:RecordObject)=>void;add:(type?:string,data?:any)=>void};
function MedicineGlyph(){return <View style={{width:38,height:42,borderRadius:15,backgroundColor:'#eeedf6',alignItems:'center',justifyContent:'center'}}><Icon name="pill" size={25} color="#8b839d"/></View>;}
/** Russian plural: plural(2,['день','дня','дней']) → 'дня'. */
export function plural(n:number,[one,few,many]:[string,string,string]){const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many;}
const STOCK_LABEL:Record<string,string>={red:'Заканчивается',yellow:'Скоро закончится',green:'Хватает'};
/**
 * Soft Future medication card: name and regimen first, then the stock with a written status next to its colour
 * (never colour alone) and the last purchase in calm grey. Same data, same calculation, same «+».
 */
function SoftMedicationCard({item,onPress,onTap}:{item:RecordObject;onPress:()=>void;onTap:()=>void}){
 const C=usePlannerColors();const stock=medicationStock(item);const d=item.data;
 const ink={red:'#9A3A52',yellow:'#8A6420',green:'#2F6B5A'} as Record<string,string>;
 const bg={red:'rgba(181,72,95,0.12)',yellow:'rgba(185,138,62,0.15)',green:'rgba(78,138,120,0.13)'} as Record<string,string>;
 const days=stock.remainingDays;const ago=item.purchasedAt?elapsedDays(item.purchasedAt):null;
 return <View style={{backgroundColor:'rgba(251,249,250,0.94)',borderRadius:16,borderWidth:1,borderColor:'rgba(41,38,45,0.06)',flexDirection:'row',gap:12,paddingVertical:12,paddingLeft:12,paddingRight:6,alignItems:'center'}}>
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={'Открыть: '+item.title} style={{flex:1,minWidth:0,flexDirection:'row',gap:12,alignItems:'flex-start'}}>
   <View style={{width:38,height:38,borderRadius:19,backgroundColor:'rgba(96,87,97,0.08)',alignItems:'center',justifyContent:'center',marginTop:1}}><Icon name="bottle" size={19} color="#6E6670"/></View>
   <View style={{flex:1,minWidth:0,gap:2}}>
    <T size={15} bold style={{lineHeight:20}}>{item.title}</T>
    <T size={13} color="#5f5862">{d.tabletsPerDay??'—'} таб. в день · {d.tabletsPerPackage??'—'} в пачке</T>
    <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:6,marginTop:5}}>
     {days===null
      ?<T size={12.5} color={C.purple}>Настроить расчёт</T>
      :<><View style={{paddingHorizontal:7,paddingVertical:2,borderRadius:7,backgroundColor:bg[stock.tone]??'rgba(41,38,45,0.06)'}}><T size={11.5} bold color={ink[stock.tone]??C.ink}>{STOCK_LABEL[stock.tone]??'Запас'}</T></View>
       <T size={12.5} color={C.ink}>{stock.remainingTablets} таб. · на {days} {plural(days,['день','дня','дней'])}</T></>}
    </View>
    <T size={12} color="#8a8189" style={{marginTop:2}}>{ago===null?'Покупка ещё не отмечена':ago===0?'Куплено сегодня':`Куплено ${ago} ${plural(ago,['день','дня','дней'])} назад`}</T>
   </View>
  </Pressable>
  <View style={{width:44,alignItems:'center',justifyContent:'center',alignSelf:'stretch'}}><PurchasePlus item={item} onTap={onTap}/></View>
 </View>;
}
export function MedicationCard(props:{item:RecordObject;onPress:()=>void;onTap:()=>void}){return useSoftMotion().enabled?<SoftMedicationCard {...props}/>:<ClassicMedicationCard {...props}/>;}
function ClassicMedicationCard({item,onPress,onTap}:{item:RecordObject;onPress:()=>void;onTap:()=>void}){const C=usePlannerColors();const stock=medicationStock(item);return <View style={{backgroundColor:C.paper,borderRadius:16,flexDirection:'row',gap:11,padding:12,alignItems:'center'}}><Pressable onPress={onPress}><MedicineGlyph/></Pressable><Pressable onPress={onPress} style={{flex:1,gap:3}}><T size={14.95} bold>{item.title}</T><T size={12.65} muted>{item.data.tabletsPerDay??'—'} таб. в день · {item.data.tabletsPerPackage??'—'} в пачке</T><T size={11.5} color={purchaseColor(item)}>{item.purchasedAt?'Куплено '+elapsedDays(item.purchasedAt)+' дн. назад':'Покупка ещё не отмечена'}</T>{stock.remainingDays===null?<T size={12.65} color={C.purple}>Настроить расчёт</T>:<T size={12.65} color={stock.tone==='red'?C.red:stock.tone==='yellow'?C.yellow:C.green}>{stock.remainingTablets} таб. · {stock.remainingDays} дней</T>}</Pressable><PurchasePlus item={item} onTap={onTap}/></View>;}
function PurchasePlus({item,onTap}:{item:RecordObject;onTap:()=>void}){const C=usePlannerColors();const {quickPurchase}=usePlanner();const [count,setCount]=useState(0);const burst=useRef({id:'',last:0,count:0});const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);const anim=useRef(new Animated.Value(0)).current;useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);const tap=()=>{const now=Date.now();if(now-burst.current.last>650)burst.current={id:Crypto.randomUUID(),last:now,count:0};burst.current.last=now;burst.current.count++;const quantity=burst.current.count;setCount(quantity);onTap();anim.stopAnimation();anim.setValue(0);Animated.timing(anim,{toValue:1,duration:850,useNativeDriver:true}).start();if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setCount(0),900);quickPurchase(item,quantity,burst.current.id,new Date(now).toISOString()).catch(()=>{});};const color=count?C.green:purchaseColor(item);return <View style={{width:34,alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel={'Купить: '+item.title} onPress={tap} hitSlop={5} style={{width:34,height:34,borderRadius:17,backgroundColor:item.type==='medication'?color+'26':'transparent',alignItems:'center',justifyContent:'center'}}><Icon name="plus" size={23} color={color}/></Pressable>{count>0&&<Animated.View pointerEvents="none" style={{position:'absolute',top:-4,right:0,opacity:anim.interpolate({inputRange:[0,.7,1],outputRange:[1,1,0]}),transform:[{translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-22]})}]}}><View style={{minWidth:19,height:19,paddingHorizontal:4,borderRadius:10,backgroundColor:C.green,alignItems:'center',justifyContent:'center'}}><T size={11} color="#fff">{count}</T></View></Animated.View>}</View>;}
function PurchaseHistory({items,type,open}:{items:RecordObject[];type:string;open:(o:RecordObject)=>void}){const C=usePlannerColors();const {state}=usePlanner();const all=state?.objects.filter(o=>o.type===type)??items;const history=state?.history.filter(h=>h.action==='purchase'&&all.some(o=>o.id===h.objectId&&o.type===type)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))??[];return <View style={{gap:8}}>{!history.length&&<EmptyState text="Пока нет покупок. Отметьте товар купленным."/>}{history.map(h=>{const o=all.find(o=>o.id===h.objectId)!;return <Pressable key={h.id} onPress={()=>open(o)} style={{padding:12,backgroundColor:C.paper,borderRadius:15,flexDirection:'row',gap:13,alignItems:'center'}}>{type==='medication'&&<MedicineGlyph/>}<View style={{flex:1}}><T size={14}>{o.title}</T><T size={11} muted>{h.quantity} {type==='medication'?'уп.':'шт.'}</T></View><T size={11} muted>{new Date(h.at).toLocaleString('ru-RU')}</T></Pressable>;})}</View>;}
/** Regular purchases: in Soft Future a right swipe = «Куплено» (one unit, the same quick purchase as «+», with undo). Medications never use it. */
function RegularRow({item,surface,onSettings,children}:{item:RecordObject;surface:string;onSettings:()=>void;children:React.ReactNode}){
 const {quickPurchase}=usePlanner();
 return <SwipeableRow testID={'swipe-'+item.id} surface={surface}
  complete={{label:'Куплено',icon:'check',onCommit:()=>quickPurchase(item,1,Crypto.randomUUID(),new Date().toISOString())}}
  actions={[{key:'settings',label:'Настроить',icon:'settings',onPress:onSettings}]}>{children}</SwipeableRow>;
}
const REGULAR_LABEL:Record<string,string>={red:'Пора покупать',yellow:'Скоро понадобится',green:'Есть запас'};
/** Soft Future row of «Регулярные покупки»: name up to two lines, written status next to its colour, last purchase in grey. */
function SoftRegularBody({item,open,hold}:{item:RecordObject;open:()=>void;hold:()=>void}){
 const C=usePlannerColors();const stock=regularStock(item);const ago=item.purchasedAt?elapsedDays(item.purchasedAt):null;
 const ink={red:'#9A3A52',yellow:'#8A6420',green:'#2F6B5A'} as Record<string,string>;
 const dot={red:'#B5485F',yellow:'#B98A3E',green:'#4E8A78'} as Record<string,string>;
 return <View style={{flexDirection:'row',alignItems:'center',gap:10,minHeight:56,paddingVertical:6,borderBottomWidth:1,borderColor:'rgba(41,38,45,0.07)'}}>
  <Pressable accessibilityRole="button" accessibilityLabel={'Настройки: '+item.title} onLongPress={open} onAccessibilityTap={open} style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:10}}>
   <View style={{width:28,alignItems:'center'}}><Icon name={supplyIcon(item.title)} size={19} color="#6E6670"/></View>
   <View style={{flex:1,minWidth:0,gap:1}}>
    <T size={14.5} lines={2} style={{lineHeight:19}}>{item.title}</T>
    {REGULAR_LABEL[stock.tone]&&<View style={{flexDirection:'row',alignItems:'center',gap:5}}><View style={{width:6,height:6,borderRadius:3,backgroundColor:dot[stock.tone]}}/><T size={12} bold color={ink[stock.tone]}>{REGULAR_LABEL[stock.tone]}</T></View>}
    <T size={12} color="#7d747c">{ago===null?'Настроить период':ago===0?'Куплено сегодня':`Куплено ${ago} ${plural(ago,['день','дня','дней'])} назад`}</T>
   </View>
  </Pressable>
  <View style={{width:44,alignItems:'center'}}><PurchasePlus item={item} onTap={hold}/></View>
 </View>;
}
export function SupplyList({items,open,add,medication=false}:ListProps&{medication?:boolean}){const C=usePlannerColors();const softList=useSoftMotion().enabled;const [tab,setTab]=useTabState('supply.'+(medication?'medicine':'regular'),'Список');const [held,setHeld]=useState(false);const order=useRef<string[]>([]),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);const type=medication?'medication':'regular';const rows=items.filter(o=>o.type===type);let sorted=urgencySort(rows);if(held)sorted=[...sorted].sort((a,b)=>order.current.indexOf(a.id)-order.current.indexOf(b.id));else order.current=sorted.map(o=>o.id);const hold=()=>{setHeld(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setHeld(false),1100);};return <><SegmentedTabs swipe values={[medication?'Текущие':'Список','Куплено недавно']} value={tab==='Список'&&medication?'Текущие':tab} onChange={setTab}/>{tab==='Куплено недавно'?<PurchaseHistory items={rows} type={type} open={open}/>:<View style={{gap:medication?8:0,backgroundColor:medication?'transparent':C.paper,borderRadius:17,paddingHorizontal:medication?0:9}}>{sorted.map(o=>medication?<MedicationCard key={o.id} item={o} onPress={()=>open(o)} onTap={hold}/>:<RegularRow key={o.id} item={o} surface={C.paper} onSettings={()=>open(o)}>{softList?<SoftRegularBody item={o} open={()=>open(o)} hold={hold}/>:<View style={{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:5,borderBottomWidth:1,borderColor:C.line}}><Pressable accessibilityRole="button" accessibilityLabel={'Настройки: '+o.title} onLongPress={()=>open(o)} onAccessibilityTap={()=>open(o)} style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:8,minHeight:42}}><View style={{width:34,alignItems:'center'}}><Icon name={supplyIcon(o.title)} size={19} color={C.muted}/></View><View style={{flex:1,minWidth:0}}><T size={13}>{o.title}</T><T size={10} color={purchaseColor(o)}>{o.purchasedAt?'Куплено '+elapsedDays(o.purchasedAt)+' дн. назад':'Настроить период'}</T></View></Pressable><PurchasePlus item={o} onTap={hold}/></View>}</RegularRow>)}</View>}<Primary quiet onPress={()=>add(type)}>＋ Добавить {medication?'препарат':'покупку'}</Primary></>;}
export function Checkups({items,open,add}:ListProps){const {mark,patch}=usePlanner();const [year,setYear]=useState(new Date().getFullYear());const rows=items.filter(o=>o.type==='checkup'&&Number(o.data.year??new Date(o.createdAt).getFullYear())===year);const p=completeProgress(rows);return <><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Action icon="back" label="Предыдущий год" onPress={()=>setYear(year-1)}/><T bold size={17} style={{flex:1}}>Ежегодный чек-ап {year}</T><Action icon="plus" label="Добавить обследование" onPress={()=>add('checkup',{year})}/><Action icon="next" label="Следующий год" onPress={()=>setYear(year+1)}/></View><T muted size={12}>{p.done} из {p.total} выполнено</T><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><View style={{height:9,borderRadius:5,backgroundColor:'#e7e5e4',flex:1,overflow:'hidden'}}><View style={{width:`${p.percent}%`,height:9,backgroundColor:'#7cbd9d'}}/></View><T muted size={11}>{p.percent}%</T></View><View style={{gap:0}}>{[...rows].sort((a,b)=>Number(a.status==='completed')-Number(b.status==='completed')).map(o=><CheckableListItem key={o.id} item={o} onPress={()=>open(o)} onCheck={()=>o.status==='completed'?patch(o.id,{status:'active',completedAt:undefined}).catch(()=>{}):mark(o,'complete').catch(()=>{})}/>)}</View>{!rows.length&&<EmptyState/>}<Primary quiet onPress={()=>add('checkup',{year})}>＋ Добавить пункт</Primary></>;}
export function AnalysisList({items,open,add}:ListProps){const C=usePlannerColors();const [year,setYear]=useStepState<number|string|null>('analysis.year',null);const [compare,setCompare]=useState('');const rows=items.filter(o=>o.type==='analysis');const docYear=(o:RecordObject):number|string=>o.data.year?Number(o.data.year):'Без даты';const years=[...new Set<number|string>([new Date().getFullYear(),...rows.map(docYear)])].sort((a,b)=>String(b).localeCompare(String(a)));return <>{year===null?<View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{years.map(y=><Pressable key={y} onPress={()=>setYear(y)} style={{width:'47%',backgroundColor:C.paper,borderRadius:18,padding:18,gap:10,minHeight:120}}><T bold size={24}>{y}</T><T size={11} muted>{rows.filter(o=>docYear(o)===y).length} документов</T>{rows.filter(o=>docYear(o)===y).slice(0,3).map((o,i)=><View key={o.id} style={{backgroundColor:'#eeecea',padding:4,borderRadius:5,marginTop:i?-4:0}}><T size={10}>{o.title}</T></View>)}</Pressable>)}</View>:<><Primary quiet onPress={()=>setYear(null)}>Все годы</Primary><T bold size={20}>{year}</T>{rows.filter(o=>docYear(o)===year).map(o=><Pressable key={o.id} onPress={()=>open(o)} style={{padding:15,backgroundColor:C.paper,borderRadius:15}}><T>{o.title}</T><T size={11} muted>{o.attachments.length} файлов · {o.data.confirmed?'значения проверены':'требует проверки'}</T></Pressable>)}</>}<Primary onPress={()=>add('analysis',{year:typeof year==='number'?year:new Date().getFullYear()})}>＋ Загрузить анализ</Primary><Input label="Сравнить показатель по годам" placeholder="Например, витамин D" value={compare} onChange={setCompare}/>{compare&&rows.filter(o=>o.data.confirmed).flatMap(o=>(o.data.values??[]).filter((v:any)=>v.name?.toLowerCase().includes(compare.toLowerCase())).map((v:any,i:number)=><T key={o.id+i} size={12}>{o.data.year} · {v.name}: {v.value} {v.unit} · {v.reference}</T>))}</>;}
export function HomeTasks({items,open,add}:ListProps){const C=usePlannerColors();const {mark,patch,update}=usePlanner();const [tab,setTab]=useTabState('home.tab','Убрать');const [settling,setSettling]=useState<string[]>([]);const rows=items.filter(o=>o.type==='homeTask'&&(tab==='Выполнено'?o.status==='completed':o.status!=='completed'&&o.data.category===tab)).sort((a,b)=>Number(settling.includes(a.id))-Number(settling.includes(b.id)));const finish=(o:RecordObject)=>{if(o.status==='completed'){update(s=>restoreCompleted(s,o.id,new Date().toISOString())).catch(()=>{});return;}if(settling.includes(o.id))return;setSettling(s=>[...s,o.id]);setTimeout(()=>{mark(o,'complete').catch(()=>{}).finally(()=>setSettling(s=>s.filter(id=>id!==o.id)));},260);};return <><SegmentedTabs swipe fit values={['Убрать','Починить','Идеи','Выполнено']} value={tab} onChange={setTab}/><View style={{backgroundColor:C.paper,borderRadius:16,paddingHorizontal:12}}>{rows.map(o=><CheckableListItem key={o.id} swipe={tab!=='Выполнено'} surface={C.paper} item={settling.includes(o.id)?{...o,status:'completed',completedAt:new Date().toISOString()}:o} onPress={()=>open(o)} onCheck={()=>finish(o)} subtitle={tab==='Выполнено'?o.data.category:undefined}/>)}</View>{!rows.length&&<EmptyState/>}<Primary quiet onPress={()=>add('homeTask',{category:tab==='Выполнено'?'Убрать':tab})}>＋ Добавить {tab==='Идеи'?'идею':'задачу'}</Primary></>;}
export function Relationships({items,adding,closeAdd}:{items:RecordObject[];adding:boolean;closeAdd:()=>void}){const C=usePlannerColors();
  const {mark,patch,create}=usePlanner();
  const [tab,setTab]=useTabState('relationships.tab','Идеи');
  const [showDone,setShowDone]=useState(true);
  const [editing,setEditing]=useState<string>();
  const [draft,setDraft]=useState('');
  const [error,setError]=useState('');
  const saving=useRef(false);
  const rows=items.filter(item=>item.type==='relationship'&&(item.data.category??'Идеи')===tab);
  const active=rows.filter(item=>item.status!=='completed');
  const completed=rows.filter(item=>item.status==='completed');
  const save=async(item:RecordObject|undefined,value:string)=>{
    const title=value.trim();
    if(!title||saving.current)return;
    saving.current=true;
    setError('');
    try{
      if(item){await patch(item.id,{title});setEditing(undefined);}
      else{await create('relationship','relationships',title,{category:tab});closeAdd();}
    }catch{setError('Не удалось сохранить. Попробуйте ещё раз.');}
    finally{saving.current=false;}
  };
  const row=(item:RecordObject)=>{
    const done=item.status==='completed',key=item.id;
    return <View key={key} style={{flexDirection:'row',alignItems:'center',gap:9,minHeight:49,borderBottomWidth:1,borderColor:C.line}}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:done}} accessibilityLabel={item.title} onPress={()=>{(done?patch(item.id,{status:'active',completedAt:undefined}):mark(item,'complete')).catch(()=>{});}} style={{padding:9}}>
        <Icon name="heart" size={22} filled color={done?'#a8a7af':'#e88eac'}/>
      </Pressable>
      {editing===key?<View style={{flex:1}}><RelationshipEntry initial={draft} onSave={value=>save(item,value)} onClose={()=>setEditing(undefined)}/></View>:
        <Pressable accessibilityRole="button" accessibilityLabel={'Редактировать: '+item.title} onLongPress={()=>{setDraft(item.title);setEditing(key);}} onPress={undefined} onAccessibilityTap={()=>{setDraft(item.title);setEditing(key);}} style={{flex:1,paddingVertical:11}}>
          <T size={14} muted={done} style={done?{textDecorationLine:'line-through'}:undefined}>{item.title}</T><DateLabel date={item.completedAt}/>
        </Pressable>}
    </View>;
  };
  return <><SegmentedTabs swipe values={['Идеи','Секс','Ссоры','Подарки']} value={tab} onChange={value=>{setEditing(undefined);setError('');closeAdd();setTab(value);}}/>
    {adding&&<RelationshipEntry key={tab} initial="" onSave={value=>save(undefined,value)} onClose={closeAdd}/>}
    {!!error&&<T size={12} color={C.red}>{error}</T>}
    {active.length>0?<View style={{backgroundColor:C.paper,borderRadius:18,paddingHorizontal:8}}>{active.map(row)}</View>:!rows.length&&!adding&&<EmptyState text="Пока пусто. Добавьте запись через плюсик сверху."/>}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:showDone}} onPress={()=>setShowDone(!showDone)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:8}}>
      <T bold size={16}>Выполнено  {completed.length}</T><Icon name={showDone?'up':'down'} size={16}/>
    </Pressable>
    {showDone&&completed.length>0&&<View style={{backgroundColor:C.paper,borderRadius:18,paddingHorizontal:8}}>{completed.map(row)}</View>}
  </>;
}
function RelationshipEntry({initial,onSave,onClose}:{initial:string;onSave:(value:string)=>void;onClose:()=>void}){const C=usePlannerColors();
  const [value,setValue]=useState(initial);
  return <View style={{flexDirection:'row',alignItems:'center',borderRadius:13,backgroundColor:C.lavender,paddingLeft:12}}>
    <TextInput autoFocus accessibilityLabel={initial?'Текст записи':'Новая запись'} placeholder="Напишите идею…" value={value} onChangeText={setValue} onSubmitEditing={()=>onSave(value)} returnKeyType="done" style={{flex:1,minWidth:0,minHeight:44,fontFamily:'Inter',fontSize:14,color:C.ink}}/>
    <Action icon="close" label="Отмена" onPress={onClose}/>
    <Action icon="check" label="Сохранить" color={C.purple} onPress={()=>onSave(value)}/>
  </View>;
}

function purchaseColor(item:RecordObject){
  const tone=item.type==='medication'?medicationStock(item).tone:regularStock(item).tone;
  return tone==='red'?C.red:tone==='yellow'?C.yellow:tone==='green'?C.green:C.muted;
}

function supplyIcon(title:string):React.ComponentProps<typeof Icon>['name']{
  const name=title.toLocaleLowerCase('ru');
  if(/мыло|пенка/.test(name))return 'bubbles';
  if(/бумага|салфетки|полотенца/.test(name))return 'scroll';
  if(/зубн/.test(name))return 'brush';
  if(/корм|наполнитель/.test(name))return 'paw';
  if(/сыворотка|тоник/.test(name))return 'pipette';
  if(/шампунь|крем|маска|гель/.test(name))return 'bottle';
  return 'package';
}
