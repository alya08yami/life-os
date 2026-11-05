import React,{useRef,useState} from 'react';
import {Platform,Pressable,TextInput,View} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {Icon,type IconName} from '../components/Icon';
import {useSoftMotion} from '../design/motion';
import {SwipeableRow,useSwipeRow} from '../design/SwipeableRow';
import {palette,shadows} from '../design/system';
import {usePlanner} from './context';
import {useTabState} from './navigation';
import {Action,SegmentedTabs,T} from './ui';

/**
 * «Отношения» in Soft Future. The four tabs keep their records and states; each gets its own quiet symbol:
 * Идеи — heart, Секс — flame, Ссоры — conversation (records, not tasks), Подарки — gift.
 * Marking, undo, editing and archiving are the existing actions; only the wording of the done block differs.
 */
type Tab='Идеи'|'Секс'|'Ссоры'|'Подарки';
const TABS:Tab[]=['Идеи','Секс','Ссоры','Подарки'];
const LOOK:Record<Tab,{icon:IconName;color:string;soft:string;done:string;doneVerb:string;empty:string;placeholder:string}>={
 'Идеи':{icon:'heart',color:'#A0697F',soft:'#C9B3BE',done:'Выполнено',doneVerb:'выполнено',empty:'Здесь будут идеи для вас двоих.',placeholder:'Напишите идею…'},
 'Секс':{icon:'flame',color:'#8E5F79',soft:'#BFA3B3',done:'Попробовали',doneVerb:'попробовали',empty:'Здесь будут ваши идеи для близости. Они не показываются в общем поиске.',placeholder:'Напишите идею…'},
 'Ссоры':{icon:'chat',color:'#6F6876',soft:'#B7B0BA',done:'Обсудили',doneVerb:'обсудили',empty:'Здесь можно спокойно записывать, что произошло и о чём договорились.',placeholder:'Что произошло?'},
 'Подарки':{icon:'gift',color:'#A57D72',soft:'#CDB7B0',done:'Подарено',doneVerb:'подарено',empty:'Здесь будут идеи подарков.',placeholder:'Идея подарка…'},
};
const shortDate=(at?:string)=>at?new Date(at).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';

export function SoftRelationships({items,adding,closeAdd,open}:{items:RecordObject[];adding:boolean;closeAdd:()=>void;open:(o:RecordObject)=>void}){
 const {mark,patch,create}=usePlanner();
 const {reduced}=useSoftMotion();
 const [tab,setTab]=useTabState('relationships.tab','Идеи');
 const current=(TABS.includes(tab as Tab)?tab:'Идеи') as Tab;
 const look=LOOK[current];
 const [showDone,setShowDone]=useState(true);
 const [editing,setEditing]=useState<string>();
 const [error,setError]=useState('');
 const [settling,setSettling]=useState<string[]>([]);
 const saving=useRef(false);
 const busy=useRef(new Set<string>());
 const rows=items.filter(item=>item.type==='relationship'&&(item.data.category??'Идеи')===current);
 const active=rows.filter(item=>item.status!=='completed');
 const completed=rows.filter(item=>item.status==='completed');
 const isFight=current==='Ссоры';

 const save=async(item:RecordObject|undefined,value:string)=>{
  const title=value.trim();if(!title||saving.current)return;saving.current=true;setError('');
  try{if(item){await patch(item.id,{title});setEditing(undefined);}else{await create('relationship','relationships',title,{category:current});closeAdd();}}
  catch{setError('Не удалось сохранить. Попробуйте ещё раз.');}
  finally{saving.current=false;}
 };
 /** Mark once: the symbol fills, then the record moves to the done block (with «Отменить» in the toast). */
 const finish=(item:RecordObject)=>{
  if(busy.current.has(item.id))return;busy.current.add(item.id);
  setSettling(s=>[...s,item.id]);
  setTimeout(()=>{mark(item,'complete').catch(()=>setError('Не удалось отметить. Попробуйте ещё раз.')).finally(()=>{busy.current.delete(item.id);setSettling(s=>s.filter(id=>id!==item.id));});},reduced?0:240);
 };
 const reopen=(item:RecordObject)=>{if(busy.current.has(item.id))return;busy.current.add(item.id);patch(item.id,{status:'active',completedAt:undefined}).catch(()=>{}).finally(()=>busy.current.delete(item.id));};
 const archive=(item:RecordObject)=>patch(item.id,{archivedAt:new Date().toISOString()});

 const row=(item:RecordObject,i:number)=>{
  const done=item.status==='completed';const filling=settling.includes(item.id);
  if(editing===item.id)return <View key={item.id} style={{padding:6,borderTopWidth:i?1:0,borderColor:'rgba(41,38,45,0.08)'}}>
   <Entry initial={item.title} placeholder={look.placeholder} onSave={v=>save(item,v)} onClose={()=>setEditing(undefined)}/>
  </View>;
  const body=<Row item={item} first={i===0} look={look} done={done} filling={filling} fight={isFight}
   onToggle={isFight&&!done?undefined:()=>done?reopen(item):finish(item)} onOpen={()=>open(item)} onEdit={()=>setEditing(item.id)}/>;
  if(done)return <React.Fragment key={item.id}>{body}</React.Fragment>;
  return <SwipeableRow key={item.id} testID={'swipe-'+item.id} surface="#faf7f8" collapseOnComplete
   complete={isFight?undefined:{label:look.done,icon:look.icon,onCommit:()=>new Promise<void>(resolve=>{finish(item);setTimeout(resolve,reduced?0:260);})}}
   actions={[{key:'edit',label:'Изменить',icon:'edit',onPress:()=>open(item)},{key:'archive',label:'В архив',icon:'package',tone:'muted',collapse:true,onPress:()=>archive(item)}]}>{body}</SwipeableRow>;
 };
 const surface={backgroundColor:'rgba(251,249,250,0.94)',borderRadius:18,borderWidth:1,borderColor:'rgba(41,38,45,0.06)',overflow:'hidden' as const,...shadows[1]};
 return <>
  <SegmentedTabs values={TABS} value={current} activeColor={look.color} onChange={value=>{setEditing(undefined);setError('');closeAdd();setTab(value);}}/>
  {adding&&<View style={{...surface,padding:6}}><Entry key={current} initial="" placeholder={look.placeholder} onSave={v=>save(undefined,v)} onClose={closeAdd}/></View>}
  {!!error&&<T size={12.5} color={palette.danger}>{error}</T>}
  {active.length>0
   ?<View style={surface}>{active.map(row)}</View>
   :!adding&&<View style={{paddingVertical:22,paddingHorizontal:24,alignItems:'center',gap:10}}>
     <Icon name={look.icon} size={26} color={look.soft}/>
     <T center size={13.5} color={palette.inkMuted} style={{lineHeight:20}}>{rows.length?'Всё '+look.doneVerb+'. Новые записи — через «+» сверху.':look.empty}</T>
    </View>}
  {completed.length>0&&<>
   <Pressable accessibilityRole="button" accessibilityState={{expanded:showDone}} onPress={()=>setShowDone(!showDone)}
    style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:40,paddingHorizontal:4,marginTop:4}}>
    <View style={{flexDirection:'row',alignItems:'baseline',gap:7}}><T size={14} bold color="#4f4852">{look.done}</T><T size={13} color="#8a8189">{completed.length}</T></View>
    <Icon name={showDone?'up':'down'} size={15} color="#8a8189"/>
   </Pressable>
   {showDone&&<View style={surface}>{completed.map(row)}</View>}
  </>}
 </>;
}

function Row({item,first,look,done,filling,fight,onToggle,onOpen,onEdit}:{item:RecordObject;first:boolean;look:typeof LOOK[Tab];done:boolean;filling:boolean;fight:boolean;onToggle?:()=>void;onOpen:()=>void;onEdit:()=>void}){
 const swipe=useSwipeRow();
 const filled=done||filling;
 const note=(item.notes||item.description||'').trim();
 const symbol=<Icon name={look.icon} size={fight?19:20} color={done?look.soft:look.color} filled={filled&&!fight}/>;
 return <View style={{flexDirection:'row',alignItems:'flex-start',minHeight:48,borderTopWidth:first?0:1,borderColor:'rgba(41,38,45,0.08)'}}>
  {onToggle
   ?<Pressable accessibilityRole={fight?'button':'checkbox'} accessibilityState={fight?undefined:{checked:filled}} aria-checked={fight?undefined:filled}
     accessibilityLabel={fight?'Вернуть: '+item.title:item.title} onPress={onToggle} hitSlop={4}
     style={{width:46,minHeight:48,alignItems:'center',justifyContent:'flex-start',paddingTop:14}}>{symbol}</Pressable>
   :<View style={{width:46,minHeight:48,alignItems:'center',paddingTop:14}}>{symbol}</View>}
  <Pressable accessibilityRole="button" accessibilityLabel={'Открыть: '+item.title} accessibilityHint="Долгое нажатие — быстро изменить текст"
   onPress={onOpen} onLongPress={swipe.openActions?onEdit:onEdit} style={{flex:1,minWidth:0,paddingVertical:13,paddingRight:14}}>
   {fight
    ?<>
      <View style={{flexDirection:'row',alignItems:'flex-start',gap:10}}>
       <T size={14.5} bold={!done} color={done?'#7d747c':palette.ink} style={{flex:1,lineHeight:20}}>{item.title}</T>
       <T size={12} color="#8a8189" style={{lineHeight:20}}>{shortDate(item.createdAt)}</T>
      </View>
      {!!note&&<T size={13.5} lines={done?2:4} color={done?'#8a8189':'#5f5862'} style={{lineHeight:19.5,marginTop:3}}>{note}</T>}
      {done&&<T size={12} color="#8a8189" style={{marginTop:4}}>Обсудили {shortDate(item.completedAt)} · нажмите на значок, чтобы вернуть</T>}
     </>
    :<>
      <T size={14.5} color={done?'#7d747c':palette.ink} style={{lineHeight:21}}>{item.title}</T>
      {!!note&&!done&&<T size={13} lines={2} color="#8a8189" style={{lineHeight:18,marginTop:2}}>{note}</T>}
      {done&&!!item.completedAt&&<T size={12} color="#8a8189" style={{marginTop:2}}>{shortDate(item.completedAt)}</T>}
     </>}
  </Pressable>
 </View>;
}

function Entry({initial,placeholder,onSave,onClose}:{initial:string;placeholder:string;onSave:(value:string)=>void;onClose:()=>void}){
 const [value,setValue]=useState(initial);
 return <View style={{flexDirection:'row',alignItems:'center',borderRadius:13,backgroundColor:'rgba(96,87,97,0.07)',paddingLeft:12}}>
  <TextInput autoFocus accessibilityLabel={initial?'Текст записи':'Новая запись'} placeholder={placeholder} placeholderTextColor="#8a8189" value={value} onChangeText={setValue}
   onSubmitEditing={()=>onSave(value)} returnKeyType="done" multiline={false}
   style={{flex:1,minWidth:0,minHeight:44,fontFamily:'Inter',fontSize:14.5,color:palette.ink,...(Platform.OS==='web'?({outlineStyle:'none'} as object):null)}}/>
  <Action icon="close" label="Отмена" onPress={onClose}/>
  <Action icon="check" label="Сохранить" color={palette.mauve} onPress={()=>onSave(value)}/>
 </View>;
}
