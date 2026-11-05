import {getLifecycle} from '@life-os/domain/lifecycle';
import {CardActionsMenu} from './CardActionsMenu';
import React from 'react';
import {View,Pressable} from 'react-native';
import {router} from 'expo-router';
import type {Item} from '@life-os/domain';
import {useApp} from '../context';
import {useColors,Label} from '../ui';
import {kindKey,categoryKey} from '../i18n';
import {SwipeableRow} from '../design/SwipeableRow';
/** `swipe` (used on «Мои дела»): Soft Future swipe right = done, left = edit / archive. Elsewhere the row is unchanged. */
export function ItemRow({item,swipe=false}:{item:Item;swipe?:boolean}){const {t,repo,run,busy}=useApp();const c=useColors();const lifecycle=getLifecycle(item);const actionable=lifecycle!=='trashed'&&item.inboxStatus==='confirmed'&&['task','shopping_item'].includes(item.kind);
 const row=<RowBody item={item} actionable={actionable} lifecycle={lifecycle}/>;
 if(!swipe||!actionable||item.completed)return row;
 const paused=item.kind==='task'&&!!item.details.recurrence?.paused;
 return <SwipeableRow testID={'swipe-'+item.id} surface="#faf7f8" collapseOnComplete
  complete={paused?undefined:{label:t('done'),onCommit:()=>run(()=>repo.complete(item.id,true))}}
  actions={[
   {key:'edit',label:'Изменить',icon:'edit',onPress:()=>router.push({pathname:'/item/[id]',params:{id:item.id,edit:'1'}})},
   {key:'archive',label:'В архив',icon:'package',tone:'muted',onPress:()=>{run(()=>repo.setLifecycle(item.id,'archived')).catch(()=>{});}},
  ]}>{row}</SwipeableRow>;
}
function RowBody({item,actionable,lifecycle}:{item:Item;actionable:boolean;lifecycle:ReturnType<typeof getLifecycle>}){const {t,repo,run,busy}=useApp();const c=useColors();return <View style={{flexDirection:'row',gap:8,paddingVertical:6,borderBottomWidth:0,borderBottomColor:c.line,alignItems:'center'}}>
  {actionable&&<Pressable disabled={busy||item.kind==='task'&&item.details.recurrence?.paused} hitSlop={9} accessibilityRole="checkbox" aria-checked={item.completed} accessibilityState={{checked:item.completed}} accessibilityLabel={t(item.completed?'undo':'complete')+': '+item.title} onPress={()=>{run(()=>repo.complete(item.id,!item.completed)).catch(()=>{});}} style={{width:12,height:12,borderWidth:1,borderColor:c.accent,borderRadius:6,alignItems:'center',justifyContent:'center',backgroundColor:item.completed?c.soft:undefined}}><Label size={8}>{item.completed?'✓':''}</Label></Pressable>}
  <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={()=>router.push({pathname:item.kind==='product'?'/product/[id]':'/item/[id]',params:{id:item.id}})} style={{flex:1,gap:3}}><TextTitle title={item.title} completed={item.completed}/><Label muted size={12}>{t(kindKey(item.kind))} · {t(categoryKey(item.category))}{item.kind==='task'&&item.details.dueDate?' · '+item.details.dueDate+(item.details.recurrence?' · '+t('recurring'):''):''}{item.inboxStatus==='unprocessed'?' · '+t('review'):''}{lifecycle!=='active'?' · '+t(lifecycle):''}</Label></Pressable><CardActionsMenu item={item}/>
  </View>;}
function TextTitle({title,completed}:{title:string;completed:boolean}){const c=useColors();return <Label muted={completed} weight="500">{title}</Label>;}
