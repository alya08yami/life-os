import {usePlannerColors} from './ui';
import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {Icon,type IconName} from '../components/Icon';
import {object} from './seed';
import {usePlanner} from './context';
import {Action,C,ConfirmationSheet,EmptyState,Input,Primary,SegmentedTabs,T} from './ui';

const examples=[
 ['head','Головная боль','zap','#f5e6ee','#a34e7c'],
 ['stomach','Боль в животе','soup','#faeee3','#ae702d'],
 ['throat','Боль в горле','user','#e8edfa','#465bb1'],
 ['nose','Насморк','wind','#e7f0e9','#347659'],
 ['fever','Повышенная температура','thermometer','#fae8eb','#b04461'],
 ['skin','Проблемы с кожей','leaf','#e7f0e9','#347659'],
 ['sleep','Проблемы со сном','moon','#efe9fa','#6452a4'],
 ['period','Менструальная боль','droplet','#fae8eb','#b04461'],
 ['tired','Усталость','battery','#e6f1f7','#26779a'],
 ['immune','Снижение иммунитета','shield','#f6ede3','#8e7055'],
] as const;
export function conditionTitle(id:string){return examples.find(([key])=>'condition-'+key===id)?.[1];}
const tabs=['Препараты','Полезности','Заметки'] as const;
type Group=typeof tabs[number];
type Entry={id:string;title:string;body:string};
type Draft={group?:Group;id?:string;title:string;body:string};
const blank:Draft={title:'',body:''};
const starterResources:Entry[]=[
 {id:'resource-neck',title:'Упражнения для снятия напряжения в шее',body:''},
 {id:'resource-breath',title:'Техники дыхания',body:''},
 {id:'resource-rest',title:'Отдых',body:''},
 {id:'resource-doctor',title:'Вопросы для врача',body:''},
];

function Badge({icon,background='#e9eafa',color=C.purple,size=42}:{icon:IconName;background?:string;color?:string;size?:number}){
 return <View style={{width:size,height:size,borderRadius:size/2,backgroundColor:background,alignItems:'center',justifyContent:'center'}}>
  <Icon name={icon} color={color} size={size*0.51}/>
 </View>;
}

export function Conditions({selected,onSelect}:{selected?:string;onSelect:(id:string)=>void}){const C=usePlannerColors();
 const {state,update}=usePlanner();
 const [query,setQuery]=useState('');
 const [tab,setTab]=useState<Group>('Препараты');
 const [draft,setDraft]=useState<Draft>();
 const [editing,setEditing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const records=state?.objects.filter(item=>item.type==='condition'&&!item.archivedAt)??[];
 const rows=[
  ...examples.map(([id,title,icon,background,color])=>({id:'condition-'+id,title,icon,background,color})),
  ...records.filter(item=>!examples.some(([id])=>item.id==='condition-'+id)).map(item=>({id:item.id,title:item.title,icon:'activity' as const,background:'#e8edfa',color:C.purple})),
 ];
 const row=rows.find(item=>item.id===selected);
 const saved=records.find(item=>item.id===selected);
 const title=saved?.title??row?.title??'';
 const subtitle=saved?.description??(selected==='condition-head'?'Личные записи о симптомах':'');
 const entries=(saved?.data.entries??(selected==='condition-head'?{'Полезности':starterResources}:{})) as Partial<Record<Group,Entry[]>>;
 const change=async (value:Draft)=>{
  const name=value.title.trim();
  if(!name||busy)return;
  setBusy(true);
  setError('');
  try{
   const created=object('condition','health',name);
   if(!selected){
    await update(current=>({...current,objects:[...current.objects,{...created,description:value.body.trim()}]}));
   }else if(value.group){
    const group=value.group;
    const entry={id:value.id??created.id,title:name,body:value.body.trim()};
    const list=entries[group]??[];
    await persist({entries:{...entries,[group]:value.id?list.map(item=>item.id===value.id?entry:item):[...list,entry]}});
   }else await persist({},name,value.body.trim());
   setDraft(undefined);
   setEditing(false);
  }catch{setError('Не удалось сохранить запись. Попробуйте ещё раз.');}
  finally{setBusy(false);}
 };
 const persist=async(data:Record<string,unknown>,name=title,description=subtitle)=>{
  if(!selected)return;
  await update(current=>{
   const old=current.objects.find(item=>item.id===selected);
   const next={...(old??object('condition','health',name)),id:selected,title:name,description,
    updatedAt:new Date().toISOString(),data:{...old?.data,...data}};
   return {...current,objects:old?current.objects.map(item=>item.id===selected?next:item):[...current.objects,next]};
  });
 };
 const start=(value:Draft,edit=true)=>{setError('');setDraft(value);setEditing(edit);};
 const card=(group:Group,icon:IconName)=>{
  const list=entries[group]??[];
  return <View key={group} style={{borderRadius:17,backgroundColor:C.paper,paddingHorizontal:12}}>
   <View style={{minHeight:59,flexDirection:'row',alignItems:'center',gap:10}}>
    <Badge icon={icon} size={36}/><T bold size={16} style={{flex:1}}>{group}</T>
    <Action icon="plus" label={'Добавить: '+group} onPress={()=>start({...blank,group})}/>
   </View>
   {list.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>start({...item,group},false)} onLongPress={()=>start({...item,group})} style={{minHeight:54,flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderColor:C.line}}>
    <Badge icon={icon} size={34}/><T size={13} style={{flex:1}}>{item.title}</T><Icon name="next" size={17} color={C.muted}/>
   </Pressable>)}
   {!list.length&&<T muted size={12} style={{paddingBottom:14}}>Здесь появятся ваши записи.</T>}
   {group==='Препараты'&&<T muted size={11} style={{paddingBottom:12}}>Личный список. Добавляйте препараты по назначению врача.</T>}
  </View>;
 };
 const matching=rows.filter(item=>(records.find(record=>record.id===item.id)?.title??item.title).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 return <>
  {row?<><View style={{padding:13,borderRadius:18,backgroundColor:C.paper,flexDirection:'row',alignItems:'center',gap:12}}>
   <Badge {...row} size={56}/>
   <Pressable style={{flex:1}} onLongPress={()=>start({title,body:subtitle})}><T bold size={19}>{title}</T>{!!subtitle&&<T muted size={12}>{subtitle}</T>}</Pressable>
   <Action icon="heart" label={saved?.data.favorite?'Убрать из избранного':'В избранное'} filled={!!saved?.data.favorite} onPress={()=>void persist({favorite:!saved?.data.favorite}).catch(()=>setError('Не удалось обновить избранное.'))}/>
  </View>
  <SegmentedTabs values={[...tabs]} value={tab} onChange={value=>setTab(value as Group)}/>
  {tab==='Препараты'?<>{card('Препараты','pill')}{card('Полезности','bulb')}</>:tab==='Полезности'?card('Полезности','bulb'):card('Заметки','edit')}
  <T muted size={11}>Удерживайте запись, чтобы изменить её.</T>
  </>:<>
   <Input label="Поиск заболеваний" placeholder="Например: головная боль" value={query} onChange={setQuery}/>
   {matching.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>{setTab('Препараты');setError('');onSelect(item.id);}} style={{padding:9,borderRadius:15,backgroundColor:item.id==='condition-head'?'#f5eaf0':C.paper,flexDirection:'row',alignItems:'center',gap:13}}>
    <Badge {...item}/><T size={15} style={{flex:1}}>{records.find(record=>record.id===item.id)?.title??item.title}</T><Icon name="next" size={17} color={C.muted}/>
   </Pressable>)}
   {!matching.length&&<EmptyState text="Ничего не найдено"/>}
   <Primary onPress={()=>start(blank)}>＋ Добавить ситуацию</Primary>
  </>}
  {!draft&&!!error&&<T color={C.red}>{error}</T>}
  {draft&&<ConfirmationSheet visible compact title={editing?(draft.id?'Редактировать':'Запись'):draft.title} onClose={()=>{if(!busy)setDraft(undefined);}}>
   {editing?<><Input label="Название" value={draft.title} onChange={title=>setDraft({...draft,title})}/>
    <Input label="Описание или заметка" multiline value={draft.body} onChange={body=>setDraft({...draft,body})}/>
    {!!error&&<T color={C.red}>{error}</T>}
    <Primary disabled={busy||!draft.title.trim()} onPress={()=>void change(draft)}>Сохранить</Primary>
   </>:<><T>{draft.body||'Описание пока не добавлено.'}</T><Primary quiet onPress={()=>setEditing(true)}>Редактировать</Primary></>}
  </ConfirmationSheet>}
 </>;
}
