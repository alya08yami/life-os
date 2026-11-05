import React,{useState} from 'react';import {View} from 'react-native';import {router,useLocalSearchParams} from 'expo-router';
import {getLifecycle} from '@life-os/domain/lifecycle';import {useApp} from '../src/context';import {AppShell} from '../src/components/AppShell';import {Button,Card,Chips,Empty,Label} from '../src/design/primitives';import {ItemRow} from '../src/features/ItemRow';import {discardImage} from '../src/data/images';
const views=['hidden','archived','trashed'] as const;
export default function SavedManagement(){const {view}=useLocalSearchParams<{view?:string}>();const {t,state,repo,run,busy}=useApp();const [filter,setFilter]=useState<typeof views[number]>(views.includes(view as typeof views[number])?view as typeof views[number]:'hidden');const [purging,setPurging]=useState<string>();const rows=state.items.filter(i=>getLifecycle(i)===filter);
  return <AppShell title={t('savedManagement')} onBack={()=>router.replace('/profile')}><Chips values={views} value={filter} onChange={v=>{setFilter(v);setPurging(undefined);}} label={t}/><Label muted size={12}>{t('lifecycleHint')}</Label>
    {rows.length?rows.map(item=><Card key={item.id}><ItemRow item={item}/><Button quiet disabled={busy} onPress={()=>{run(()=>repo.setLifecycle(item.id,'active')).catch(()=>{});}}>{t('restore')}</Button>
      {filter==='trashed'&&(purging===item.id?<View style={{gap:12}}><Label>{t('purgeQuestion')}</Label><Button danger disabled={busy} onPress={()=>{run(()=>repo.purge(item.id)).then(removed=>{for(const a of removed?.attachments??[])discardImage(a).catch(()=>{});setPurging(undefined);}).catch(()=>{});}}>{t('confirmPurge')}</Button><Button quiet disabled={busy} onPress={()=>setPurging(undefined)}>{t('cancel')}</Button></View>:<Button quiet disabled={busy} onPress={()=>setPurging(item.id)}>{t('purge')}</Button>)}
    </Card>):<Empty/>}
  </AppShell>;
}
