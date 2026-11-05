import {goBack} from '../../src/planner/navigation';
import {MovieDetailScreen} from '../../src/features/MovieDetailScreen';
import {RelatedSource} from '../../src/features/RelatedSource';
import {RecognitionReview} from '../../src/features/RecognitionReview';
import {isCollectionKind} from '@life-os/domain/collections';
import {CollectionContent} from '../../src/features/CollectionContent';
import {MovieContent} from '../../src/features/MovieContent';
import {TaskContent} from '../../src/features/TaskContent';
import {RelatedTasks} from '../../src/features/RelatedTasks';
import {SourcePreview} from '../../src/features/SourcePreview';
import {getLifecycle} from '@life-os/domain/lifecycle';
import {CardActionsMenu} from '../../src/features/CardActionsMenu';
import {RecipeContent} from '../../src/features/RecipeContent';
import React,{useState} from 'react';
import {View,Image,Linking} from 'react-native';
import {router,useLocalSearchParams,Redirect} from 'expo-router';
import {classify,kinds,safeUrl} from '@life-os/domain';
import type {Kind,Category} from '@life-os/domain';
import {useApp} from '../../src/context';
import {Screen,Card,Label,Button,Chips,Empty} from '../../src/ui';
import {kindKey,categoryKey} from '../../src/i18n';
import {ItemForm} from '../../src/features/ItemForm';

export default function Detail(){const {id,edit}=useLocalSearchParams<{id:string;edit?:string}>();const {state,repo,run,t,busy}=useApp();const item=state.items.find(x=>x.id===id);const [editing,setEditing]=useState(edit==='1');const [deleting,setDeleting]=useState(false);const suggestion=item?classify(item.body):null;const [kind,setKind]=useState<Kind|undefined>();const [category,setCategory]=useState<Category|undefined>();
  if(!item)return <Screen title={t('saved')} onBack={goBack}><Empty/></Screen>;
  if(item.tags?.includes('rich-note'))return <Redirect href={{pathname:'/section/[section]',params:{section:'work',note:item.id}}}/>;
  const movieItem=state.items.find(x=>x.id===id&&x.kind==='movie');if(movieItem?.kind==='movie')return <MovieDetailScreen item={movieItem} initialEdit={edit==='1'}/>;
  const lifecycle=getLifecycle(item);const trashed=lifecycle==='trashed';
  const selectedKind=kind??suggestion?.kind??item.kind;const selectedCategory=category??suggestion?.category??item.category;
  const open=(url:string)=>{const safe=safeUrl(url);if(safe)Linking.openURL(safe).catch(()=>{});};
  const remove=async()=>{await run(()=>repo.setLifecycle(item.id,'trashed'));router.replace('/');};
  return <Screen title={item.title} subtitle={`${t(kindKey(item.kind))} · ${t(categoryKey(item.category))}`} onBack={goBack}>
    {lifecycle!=='active'&&<Card><Label>{t(lifecycle)}</Label><Button disabled={busy} onPress={()=>{run(()=>repo.setLifecycle(item.id,'active')).catch(()=>{});}}>{t('restore')}</Button></Card>}
    {editing&&!trashed&&isCollectionKind(item.kind)?<Button onPress={()=>router.push({pathname:'/collection-form',params:{kind:item.kind,id:item.id}})}>{t('edit')}</Button>:editing&&!trashed?<><ItemForm key={item.version} item={item} onSaved={()=>setEditing(false)}/><Button quiet onPress={()=>setEditing(false)}>{t('cancel')}</Button></>:<>
    {!trashed&&item.inboxStatus==='unprocessed'&&item.processing?.status!=='needs_review'&&<Card><Label weight="600">{t('review')}</Label><Label muted size={13}>{t(suggestion?'rule':'manual')}</Label><Chips values={kinds} value={selectedKind} onChange={setKind} label={v=>t(kindKey(v))}/><Chips values={['general','home','work','shopping','entertainment','food'] as const} value={selectedCategory} onChange={setCategory} label={v=>t(categoryKey(v))}/><Button disabled={busy} onPress={()=>{run(()=>repo.confirm(item.id,item.version,selectedKind,selectedCategory)).catch(()=>{});}}>{t('confirm')}</Button></Card>}
    {!trashed&&<RecognitionReview key={item.id+':'+item.version} item={item} onEdit={()=>setEditing(true)}/>}
    <Card>{!isCollectionKind(item.kind)&&(item.body!==item.title||['note','link','image','task','shopping_item'].includes(item.kind))&&<Label>{item.body}</Label>}{item.kind==='movie'&&item.details.posterUrl&&<Image source={{uri:item.details.posterUrl}} accessibilityLabel={item.title+' poster'} style={{width:100,height:90,alignSelf:'center',resizeMode:'contain'}}/>}{item.attachments.map(a=><Image key={a.id} source={{uri:a.uri}} accessibilityLabel={item.title} style={{width:item.kind==='movie'?100:'100%',height:item.kind==='movie'?90:280,alignSelf:'center',borderRadius:14,resizeMode:'contain'}}/>)}
    {item.kind==='task'&&<><Label muted>{t(item.details.priority)}{item.details.dueDate?' · '+item.details.dueDate:''}</Label></>}
    {item.kind==='movie'&&<><MovieContent item={item} readOnly={trashed}/>{item.details.trailerUrl&&<Button quiet onPress={()=>open(item.details.trailerUrl!)}>{t('openTrailer')} ↗</Button>}</>}
    {item.kind==='task'&&<TaskContent key={item.id+':'+item.version} item={item}/>}
    {isCollectionKind(item.kind)&&<CollectionContent item={item}/>}
    {item.kind==='recipe'&&<RecipeContent key={item.id+':'+item.details.servings} recipe={item} readOnly={trashed}/>}
    {item.kind==='product'&&<><Label muted>{[item.details.brand,item.details.model].filter(Boolean).join(' · ')}</Label>{item.details.priceMinor!==undefined&&<Label weight="600">{(item.details.priceMinor/100).toFixed(2)} {item.details.currency}</Label>}</>}
    <RelatedSource item={item}/><SourcePreview item={item}/>{!!item.tags?.length&&<Label muted>{item.tags.join(' · ')}</Label>}{!trashed&&item.inboxStatus==='confirmed'&&!['task','shopping_item'].includes(item.kind)&&<RelatedTasks item={item}/>}
    {item.kind==='shopping_item'&&!trashed&&<Button quiet onPress={()=>{run(()=>repo.shoppingToProduct(item.id)).then(()=>router.replace({pathname:'/product/[id]',params:{id:item.id}})).catch(()=>{});}}>{t('wishlist')}</Button>}
    {!trashed&&<View style={{flexDirection:'row',gap:10,flexWrap:'wrap'}}><Button quiet onPress={()=>isCollectionKind(item.kind)?router.push({pathname:'/collection-form',params:{kind:item.kind,id:item.id}}):setEditing(true)}>{t('edit')}</Button>{item.inboxStatus==='confirmed'&&['task','shopping_item'].includes(item.kind)&&<Button disabled={busy||item.kind==='task'&&item.details.recurrence?.paused} onPress={()=>{run(()=>repo.complete(item.id,!item.completed)).catch(()=>{});}}>{t(item.completed?'undo':'complete')}</Button>}<CardActionsMenu item={item} onEdit={()=>isCollectionKind(item.kind)?router.push({pathname:'/collection-form',params:{kind:item.kind,id:item.id}}):setEditing(true)}/></View>}</Card>
    {!trashed&&(deleting?<Card><Label>{t('trashQuestion')}</Label><Button danger disabled={busy} onPress={()=>{remove().catch(()=>{});}}>{t('delete')}</Button><Button quiet onPress={()=>setDeleting(false)}>{t('cancel')}</Button></Card>:<Button quiet onPress={()=>setDeleting(true)}>{t('delete')}</Button>)}
    </>}
  </Screen>;}
