import React,{useState} from 'react';
import {Modal,ScrollView,View} from 'react-native';
import {router} from 'expo-router';
import {isCollectionKind} from '@life-os/domain/collections';
import type {Category,Item,ProductCategory} from '@life-os/domain';
import {getLifecycle} from '@life-os/domain/lifecycle';
import {useApp} from '../context';
import {IconButton} from '../components/Icon';
import {SectionHeader} from '../components/AppShell';
import {Button,Label,useColors} from '../design/primitives';
import {SoftSheet,useSoftMotion} from '../design/motion';
import {shadows} from '../design/system';

/** Every destructive action is soft deletion. Files stay until an explicit purge. */
export function CardActionsMenu({item,onEdit,onChanged}:{item:Item;onEdit?:()=>void;onChanged?:()=>void}){
  const {t,repo,run,busy}=useApp();const c=useColors();const [open,setOpen]=useState(false);const [step,setStep]=useState<'menu'|'category'|'trash'>('menu');
  const lifecycle=getLifecycle(item);
  const done=(action:()=>Promise<unknown>)=>{run(action).then(()=>{setOpen(false);onChanged?.();}).catch(()=>{});};
  const categories:readonly(Category|ProductCategory)[]=item.kind==='product'?['beauty','clothing','tech','home','other']:['general','home','work','shopping','entertainment','food'];
  const softMotion=useSoftMotion();
  const panel={width:'100%' as const,maxWidth:680,maxHeight:'85%' as const,backgroundColor:c.bg,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20};
  // Soft Future: the menu rises softly above a fading scrim and has a higher depth (elevated shadow); other themes unchanged.
  const menuShell=(content:React.ReactNode)=>softMotion.enabled
   ?<SoftSheet visible={open} onRequestClose={()=>setOpen(false)} panelStyle={[panel,{alignSelf:'center'},shadows[3]]}>{content}</SoftSheet>
   :<Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}><View style={{flex:1,backgroundColor:'#0005',justifyContent:'flex-end',alignItems:'center'}}><View style={panel}>{content}</View></View></Modal>;
  return <><IconButton name="more" label={t('cardActions')+': '+item.title} disabled={busy} onPress={()=>{setStep('menu');setOpen(true);}}/>
    {menuShell(<>
      <SectionHeader title={t(step==='category'?'category':'cardActions')} onBack={()=>step==='menu'?setOpen(false):setStep('menu')}/>
      <ScrollView contentContainerStyle={{gap:12,paddingBottom:24}}><Label weight="600">{item.title}</Label>
      {step==='category'?categories.map(category=><Button key={category} quiet onPress={()=>done(()=>repo.categorize(item.id,category))}>{t(category)}</Button>):step==='trash'?<><Label>{t('trashQuestion')}</Label><Button danger onPress={()=>done(()=>repo.setLifecycle(item.id,'trashed'))}>{t('delete')}</Button></>:<>
        <Button quiet onPress={()=>{setOpen(false);router.push({pathname:item.kind==='product'?'/product/[id]':'/item/[id]',params:{id:item.id}});}}>{t('openCard')}</Button>
        {lifecycle!=='trashed'&&<><Button quiet onPress={()=>{setOpen(false);if(onEdit)onEdit();else if(isCollectionKind(item.kind))router.push({pathname:'/collection-form',params:{kind:item.kind,id:item.id}});else router.push({pathname:item.kind==='product'?'/product/[id]':'/item/[id]',params:{id:item.id,edit:'1'}});}}>{t('edit')}</Button><Button quiet onPress={()=>setStep('category')}>{t('moveCategory')}</Button></>}
        {lifecycle!=='trashed'&&<Button quiet onPress={()=>done(()=>repo.favorite(item.id,!item.favorite))}>{t(item.favorite?'removeFavorite':'addFavorite')}</Button>}
        {lifecycle!=='active'&&<Button onPress={()=>done(()=>repo.setLifecycle(item.id,'active'))}>{t('restore')}</Button>}
        {lifecycle==='active'&&<Button quiet onPress={()=>done(()=>repo.setLifecycle(item.id,'hidden'))}>{t('hideCard')}</Button>}
        {lifecycle!=='trashed'&&lifecycle!=='archived'&&<Button quiet onPress={()=>done(()=>repo.setLifecycle(item.id,'archived'))}>{t('archiveCard')}</Button>}
        {lifecycle!=='trashed'&&<Button quiet onPress={()=>setStep('trash')}>{t('delete')}</Button>}
      </>}
      <Button quiet onPress={()=>setOpen(false)}>{t('close')}</Button></ScrollView>
    </>)}
  </>;
}
