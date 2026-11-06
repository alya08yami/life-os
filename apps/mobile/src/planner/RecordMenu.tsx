import React,{useState} from 'react';
import {Pressable} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {ContextMenu,type MenuItem} from '../design/ContextMenu';
import {usePlanner} from './context';
import {ConfirmationSheet,T,Primary} from './ui';

/**
 * «•••» on a record's card: the few actions people use — edit, duplicate, archive, delete — in a compact dropdown
 * instead of scrolling to the bottom of the full edit form. Deleting asks first; archiving can be undone from the archive.
 */
export function RecordMenu({item,onEdit,onGone,extra=[]}:{item:RecordObject;onEdit?:()=>void;onGone:()=>void;extra?:MenuItem[]}){
 const {create,patch,update,setToast}=usePlanner();
 const [confirm,setConfirm]=useState(false);
 const duplicate=async()=>{
  const copy=await create(item.type,item.section,item.title+' (копия)',{...item.data});
  await patch(copy.id,{description:item.description,notes:item.notes,attachments:item.attachments});
  setToast({text:'Создана копия «'+item.title+'»'});
 };
 const archive=()=>{patch(item.id,{archivedAt:item.archivedAt?undefined:new Date().toISOString()}).then(()=>{setToast({text:item.archivedAt?'Возвращено из архива':'Перенесено в архив'});if(!item.archivedAt)onGone();}).catch(()=>{});};
 const remove=()=>{const id=item.id;setConfirm(false);update(s=>({...s,objects:s.objects.filter(o=>o.id!==id)})).then(onGone).catch(()=>{});};
 const items:MenuItem[]=[
  ...(onEdit?[{key:'edit',label:'Редактировать',icon:'edit' as const,onPress:onEdit}]:[]),
  ...extra,
  {key:'copy',label:'Дублировать',icon:'copy',onPress:()=>{duplicate().catch(()=>{});}},
  {key:'archive',label:item.archivedAt?'Вернуть из архива':'В архив',icon:'archive',onPress:archive},
  {key:'delete',label:'Удалить',icon:'trash',danger:true,onPress:()=>setConfirm(true)},
 ];
 return <>
  <ContextMenu items={items} label={'Действия: '+item.title}/>
  <ConfirmationSheet visible={confirm} title="Удалить навсегда?" compact onClose={()=>setConfirm(false)}>
   <T>«{item.title}» будет удалено из LIFE OS вместе с фото и заметками. Это нельзя отменить. Чтобы просто убрать из виду, выберите «В архив».</T>
   <Pressable accessibilityRole="button" onPress={remove} style={{minHeight:46,borderRadius:21,backgroundColor:'#b4474f',alignItems:'center',justifyContent:'center'}}><T bold color="#fff">Удалить</T></Pressable>
   <Primary quiet onPress={()=>setConfirm(false)}>Отмена</Primary>
  </ConfirmationSheet>
 </>;
}
