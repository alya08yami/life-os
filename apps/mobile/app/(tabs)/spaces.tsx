import {isActive} from '@life-os/domain/lifecycle';
import React,{useState,useEffect} from 'react';
import {View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {templates} from '@life-os/domain/templates';
import type {TemplateId} from '@life-os/domain/templates';
import type {Kind} from '@life-os/domain';
import {useApp} from '../../src/context';
import {Screen,Card,Label,Chips,Button,Empty} from '../../src/ui';
import {ItemRow} from '../../src/features/ItemRow';
import {kindKey} from '../../src/i18n';
const filters=['all','task','shopping_item','note','movie','recipe','product','home'] as const;
type Filter=typeof filters[number];
export default function Spaces(){const {t,state,repo,run,busy}=useApp();const params=useLocalSearchParams<{filter?:string}>();const [filter,setFilter]=useState<Filter>('all');const [preview,setPreview]=useState<TemplateId|null>(null);
  useEffect(()=>{if(filters.includes(params.filter as Filter))setFilter(params.filter as Filter);},[params.filter]);
  const rows=state.items.filter(x=>isActive(x)&&x.inboxStatus==='confirmed'&&(filter==='all'||filter==='home'&&x.category==='home'||filter==='note'&&['note','link','image'].includes(x.kind)||x.kind===filter));
  return <Screen title={t('spaces')} subtitle={t('tagline')}><Chips values={filters} value={filter} onChange={setFilter} label={v=>v==='all'?t('all'):v==='home'?t('home'):v==='note'?t('library'):t(kindKey(v))}/>
    <Card><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Label weight="600" size={20}>{filter==='all'?t('saved'):filter==='home'?t('home'):filter==='note'?t('library'):t(kindKey(filter))}</Label><Button quiet onPress={()=>router.push({pathname:'/inbox',params:{kind:filter==='all'||filter==='home'?'note':filter}})}>＋</Button></View>{rows.length?rows.map(item=><ItemRow key={item.id} item={item}/>):<Empty/>}</Card>
    <View style={{gap:8}}><Label size={22} weight="600">{t('templates')}</Label><Label muted>{t('templatesHint')}</Label></View>
    {(Object.keys(templates) as TemplateId[]).map(id=>{const data=templates[id][state.settings.locale];const applied=state.appliedTemplates.includes(id);return <Card key={id}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}><Label weight="600">{data.name}</Label><Button quiet onPress={()=>setPreview(preview===id?null:id)}>{preview===id?'−':'＋'} {data.tasks.length}</Button></View>{preview===id&&<>{data.tasks.map(text=><Label key={text} muted>○  {text}</Label>)}<Button disabled={busy||applied} onPress={()=>{run(()=>repo.applyTemplate(id,state.settings.locale)).catch(()=>{});}}>{t(applied?'applied':'apply')}</Button></>}</Card>;})}
  </Screen>;}
