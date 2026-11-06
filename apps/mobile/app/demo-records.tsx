import React,{useMemo,useState} from 'react';
import {Pressable,View} from 'react-native';
import type {PlannerState,RecordObject} from '@life-os/domain/planner';
import {Icon} from '../src/components/Icon';
import {usePlanner} from '../src/planner/context';
import {initializePlanner,sections} from '../src/planner/seed';
import {removeDemoRecords,scanDemoRecords} from '../src/planner/demo-records';
import {ConfirmationSheet,Frame,T,usePlannerColors} from '../src/planner/ui';

/**
 * Профиль → Демо-записи: records the first launch created as examples. Nothing is removed automatically:
 * the user ticks individual records, then confirms. Only unchanged records of verified first-launch origin can be
 * ticked (see planner/demo-records.ts); look-alikes are shown with the reason and stay untouched.
 */
const typeLabel:Record<string,string>={note:'Заметка',product:'Товар',transaction:'Операция',movie:'Фильм',relationship:'Идея',garment:'Вещь',place:'Место',regular:'Регулярная покупка',checkup:'Обследование',medication:'Лекарство',homeTask:'Дело',dish:'Блюдо',recipe:'Рецепт',habit:'Привычка'};
const sectionTitle=(id:string)=>sections.find(s=>s.id===id)?.title.replace('\n',' ')??id;
const detail=(o:RecordObject)=>[typeLabel[o.type]??o.type,o.type==='transaction'&&o.data.amount!==undefined?o.data.amount+' '+(o.data.currency??'')+(o.data.plannedDate?' · '+o.data.plannedDate:''):'',o.type==='note'&&o.description?'«'+o.description.split('\n')[0].slice(0,40)+'»':''].filter(Boolean).join(' · ');

export default function DemoRecords(){
 const C=usePlannerColors();
 const {state,update}=usePlanner();
 const fresh=useMemo(()=>initializePlanner([]),[]);
 const scan=useMemo(()=>scanDemoRecords(state,fresh),[state,fresh]);
 const [picked,setPicked]=useState<Set<string>>(new Set());
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [removed,setRemoved]=useState<{objects:RecordObject[];history:PlannerState['history']}|null>(null);
 const valid=new Set(scan.candidates.map(o=>o.id));
 const selected=[...picked].filter(id=>valid.has(id));
 const groups=sections.map(s=>({id:s.id,items:scan.candidates.filter(o=>o.section===s.id)})).filter(g=>g.items.length);
 const toggle=(id:string)=>setPicked(p=>{const n=new Set(p);if(n.has(id))n.delete(id);else n.add(id);return n;});
 const toggleGroup=(ids:string[])=>setPicked(p=>{const n=new Set(p);const all=ids.every(id=>n.has(id));ids.forEach(id=>all?n.delete(id):n.add(id));return n;});
 const remove=async()=>{
  if(!state||!selected.length)return;
  const ids=new Set(selected);setBusy(true);setError('');
  const objects=state.objects.filter(o=>ids.has(o.id));const history=(state.history??[]).filter(h=>ids.has(h.objectId)&&String(h.id).startsWith('initial-'));
  try{
   // Re-check inside the write: only records that are still unchanged examples are removed.
   await update(s=>{const still=new Set(scanDemoRecords(s,fresh).candidates.map(o=>o.id));return removeDemoRecords(s,new Set([...ids].filter(id=>still.has(id))));});
   setRemoved({objects,history});setPicked(new Set());setConfirm(false);
  }catch{setError('Не удалось удалить. Записи не изменены.');}
  finally{setBusy(false);}
 };
 const restore=async()=>{
  if(!removed)return;setBusy(true);
  try{await update(s=>{const known=new Set(s.objects.map(o=>o.id));const knownH=new Set((s.history??[]).map(h=>h.id));return {...s,objects:[...s.objects,...removed.objects.filter(o=>!known.has(o.id))],history:[...(s.history??[]),...removed.history.filter(h=>!knownH.has(h.id))]};});setRemoved(null);}
  catch{setError('Не удалось вернуть записи.');}
  finally{setBusy(false);}
 };
 const card={borderRadius:18,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,overflow:'hidden' as const};
 return <Frame title="Демо-записи">
  <T muted size={13}>Записи-примеры, которые приложение создало при первом запуске. Ничего не удаляется автоматически: отметьте нужные записи и подтвердите удаление. Перед удалением рекомендуем сохранить резервную копию.</T>
  {removed&&<View style={[card,{padding:14,flexDirection:'row',alignItems:'center',gap:10}]}><T size={13} style={{flex:1}}>Удалено записей: {removed.objects.length}</T><Pressable accessibilityRole="button" disabled={busy} onPress={()=>{void restore();}} hitSlop={8}><T size={13} bold color={C.purple}>Вернуть</T></Pressable></View>}
  {!!error&&<T size={13} color={C.red}>{error}</T>}
  {!state?null:!groups.length?<View style={[card,{padding:18}]}><T muted center>Неизменённых демо-записей не найдено.</T></View>:groups.map(g=>{const ids=g.items.map(o=>o.id);const all=ids.every(id=>picked.has(id));return <View key={g.id} style={{gap:8}}>
   <View style={{flexDirection:'row',alignItems:'center'}}><T size={12} muted bold style={{flex:1}}>{sectionTitle(g.id)} · {g.items.length}</T><Pressable accessibilityRole="button" onPress={()=>toggleGroup(ids)} hitSlop={8}><T size={12} color={C.purple}>{all?'Снять все':'Выбрать все'}</T></Pressable></View>
   <View style={card}>{g.items.map((o,i)=>{const on=picked.has(o.id);return <Pressable key={o.id} accessibilityRole="checkbox" accessibilityState={{checked:on}} onPress={()=>toggle(o.id)} style={{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:14,paddingVertical:11,borderTopWidth:i?1:0,borderTopColor:C.line}}>
    <View style={{width:22,height:22,borderRadius:7,borderWidth:1.5,borderColor:on?C.ink:C.muted,backgroundColor:on?C.ink:'transparent',alignItems:'center',justifyContent:'center'}}>{on&&<Icon name="check" size={14} color={C.paper}/>}</View>
    <View style={{flex:1,minWidth:0}}><T size={14} lines={1}>{o.title}</T><T size={12} muted lines={1}>{detail(o)}</T></View>
   </Pressable>;})}</View>
  </View>;})}
  {!!scan.lookalikes.length&&<View style={{gap:8}}>
   <T size={12} muted bold>Похожи на примеры, но не предлагаются к удалению · {scan.lookalikes.length}</T>
   <View style={card}>{scan.lookalikes.map(({object:o,reason},i)=><View key={o.id} style={{paddingHorizontal:14,paddingVertical:10,borderTopWidth:i?1:0,borderTopColor:C.line}}><T size={14} lines={1}>{o.title}</T><T size={12} muted>{sectionTitle(o.section)} · {reason}</T></View>)}</View>
   <T size={12} muted>Эти записи изменялись или их происхождение нельзя подтвердить. При необходимости их можно удалить вручную в своём разделе.</T>
  </View>}
  {!!selected.length&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>setConfirm(true)} style={{minHeight:48,borderRadius:16,backgroundColor:C.paper,borderWidth:1,borderColor:C.red,alignItems:'center',justifyContent:'center'}}><T bold color={C.red}>Удалить выбранные · {selected.length}</T></Pressable>}
  <ConfirmationSheet visible={confirm} compact title={'Удалить '+selected.length+' '+(selected.length===1?'запись':'записей')+'?'} onClose={()=>{if(!busy)setConfirm(false);}}>
   <T size={13} muted>Будут удалены только отмеченные демо-записи. Остальные записи, разделы и категории не изменятся.</T>
   <View style={{gap:4}}>{scan.candidates.filter(o=>picked.has(o.id)).slice(0,12).map(o=><T key={o.id} size={13}>• {o.title} <T size={12} muted>({sectionTitle(o.section)})</T></T>)}{selected.length>12&&<T size={12} muted>…и ещё {selected.length-12}</T>}</View>
   <View style={{flexDirection:'row',gap:10}}>
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>setConfirm(false)} style={{flex:1,minHeight:46,borderRadius:14,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'}}><T>Отмена</T></Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>{void remove();}} style={{flex:1,minHeight:46,borderRadius:14,backgroundColor:C.red,alignItems:'center',justifyContent:'center'}}><T bold color="#fff">{busy?'Удаление…':'Удалить'}</T></Pressable>
   </View>
  </ConfirmationSheet>
 </Frame>;
}
