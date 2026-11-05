import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Image,Platform,Pressable,ScrollView,TextInput,View} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {Icon} from '../components/Icon';
import {useApp} from '../context';
import {SoftPressable} from '../design/SoftPressable';
import {palette} from '../design/system';
import {CatalogError,catalogDetails,catalogErrorText,catalogId,posterUrl,searchCatalog,TMDB_ATTRIBUTION,type CatalogDetails,type CatalogResult} from '../catalog/movies';
import {usePlanner} from './context';
import {ConfirmationSheet,T,pictureSource,usePlannerColors} from './ui';

/**
 * Film search (TMDB via the LIFE OS Worker) in a bottom sheet.
 * mode 'add'    — pick a result, check the preview, add it to «Фильмы» (never chosen automatically, even for one result).
 * mode 'poster' — for a film already in the collection without a cover: pick the matching film, compare, confirm;
 *                 only the poster and catalog id are written — title, year, rating, notes and status stay as they are.
 */
type Mode={kind:'add'}|{kind:'poster';item:RecordObject};
type Phase={step:'search'}|{step:'loading';result:CatalogResult}|{step:'preview';result:CatalogResult;details:CatalogDetails};

export function MovieSearchSheet({mode,onClose,onManual,onOpen}:{mode:Mode;onClose:()=>void;onManual?:()=>void;onOpen?:(o:RecordObject)=>void}){
 const {state:app}=useApp();const locale=app.settings.locale||'ru';
 const {state,create,patch,setToast}=usePlanner();
 const initial=mode.kind==='poster'?mode.item.title:'';
 const [query,setQuery]=useState(initial);
 const [results,setResults]=useState<CatalogResult[]|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string>('');
 const [phase,setPhase]=useState<Phase>({step:'search'});
 const [saving,setSaving]=useState(false);
 const [attempt,setAttempt]=useState(0);
 const current=useRef<AbortController|null>(null);

 // Debounced search; a newer query cancels the older request.
 useEffect(()=>{
  const q=query.trim();
  current.current?.abort();
  if(q.length<2){setResults(null);setLoading(false);setError('');return;}
  const controller=new AbortController();current.current=controller;
  setLoading(true);setError('');
  const timer=setTimeout(()=>{
   searchCatalog(q,locale,controller.signal)
    .then(rows=>{if(!controller.signal.aborted){setResults(rows);setLoading(false);}})
    .catch(e=>{if(controller.signal.aborted)return;setResults(null);setLoading(false);setError(e instanceof CatalogError?catalogErrorText[e.code]:catalogErrorText.unavailable);});
  },q===initial.trim()&&attempt===0?0:450);
  return ()=>{clearTimeout(timer);controller.abort();};
 },[query,attempt]);

 const choose=async(result:CatalogResult)=>{
  setPhase({step:'loading',result});setError('');
  try{const details=await catalogDetails(result.mediaType,result.id,locale);setPhase({step:'preview',result,details});}
  catch(e){setPhase({step:'search'});setError(e instanceof CatalogError?catalogErrorText[e.code]:catalogErrorText.unavailable);}
 };
 const existing=(r:CatalogResult)=>state?.objects.find(o=>o.type==='movie'&&!o.archivedAt&&o.data.catalogId===catalogId(r.mediaType,r.id));

 const confirm=async(result:CatalogResult,details:CatalogDetails)=>{
  if(saving)return;setSaving(true);setError('');
  const poster=posterUrl(details.posterPath??result.posterPath,'w500');
  const identity={catalogId:catalogId(result.mediaType,result.id),catalogMediaType:result.mediaType,tmdbId:result.id,
   ...(poster?{posterUrl:poster,posterPath:details.posterPath??result.posterPath}:{}),catalogSource:'TMDB'};
  try{
   if(mode.kind==='poster'){
    await patch(mode.item.id,{data:identity});
    setToast({text:'Постер сохранён'});
   }else{
    const data:Record<string,unknown>={...identity,mediaType:result.mediaType==='tv'?'series':'movie',
     ...(details.year?{year:details.year}:result.year?{year:Number(result.year)}:{}),
     ...(details.originalTitle&&details.originalTitle!==details.title?{originalTitle:details.originalTitle}:{}),
     ...(details.description?{description:details.description}:{}),
     ...(details.genres.length?{genres:details.genres}:{}),
     ...(details.runtimeMinutes?{runtimeMinutes:details.runtimeMinutes}:{}),
     ...(details.trailerUrl?{trailerUrl:details.trailerUrl}:{})};
    const o=await create('movie','movies',details.title,data);
    setToast({text:'«'+o.title+'» — в коллекции'});
   }
   onClose();
  }catch{setError('Не удалось сохранить. Попробуйте ещё раз.');setSaving(false);}
 };

 const title=mode.kind==='poster'?'Найти постер':'Найти фильм';
 return <ConfirmationSheet visible title={title} onClose={onClose}>
  <View style={{gap:12}}>
   {phase.step==='preview'
    ?<Preview mode={mode} result={phase.result} details={phase.details} saving={saving} already={mode.kind==='add'?existing(phase.result):undefined}
      onBack={()=>setPhase({step:'search'})} onConfirm={()=>confirm(phase.result,phase.details)} onOpen={o=>{onClose();onOpen?.(o);}}/>
    :<>
     <View style={{flexDirection:'row',alignItems:'center',gap:8,borderRadius:13,backgroundColor:'rgba(96,87,97,0.07)',paddingLeft:12}}>
      <Icon name="search" size={17} color={palette.inkMuted}/>
      <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Название фильма или сериала" placeholderTextColor="#8a8189"
       accessibilityLabel="Название фильма для поиска" returnKeyType="search" autoCorrect={false}
       style={{flex:1,minWidth:0,minHeight:44,fontFamily:'Inter',fontSize:15,color:palette.ink,...(Platform.OS==='web'?({outlineStyle:'none'} as object):null)}}/>
      {loading&&<ActivityIndicator style={{marginRight:12}} color={palette.mauve}/>}
     </View>
     {mode.kind==='poster'&&<T size={12.5} color={palette.inkMuted}>Выберите именно ваш фильм — сохранится только постер. Название, год, оценка, заметка и статус не изменятся.</T>}
     {!!error&&<View style={{gap:8}}>
      <T size={13} color={palette.danger} style={{lineHeight:19}}>{error}</T>
      <View style={{flexDirection:'row',gap:8}}>
       <Pressable accessibilityRole="button" onPress={()=>setAttempt(a=>a+1)} style={{minHeight:40,paddingHorizontal:14,borderRadius:12,backgroundColor:palette.graphite,justifyContent:'center'}}><T size={13.5} bold color="#f4f0f2">Повторить</T></Pressable>
       {onManual&&<Pressable accessibilityRole="button" onPress={()=>{onClose();onManual();}} style={{minHeight:40,paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:'rgba(41,38,45,0.12)',justifyContent:'center'}}><T size={13.5}>Добавить вручную</T></Pressable>}
      </View>
     </View>}
     {!error&&!loading&&results===null&&<T size={13} color={palette.inkMuted}>Введите название — на русском или в оригинале. Фильм выбираете вы, автоматически ничего не добавляется.</T>}
     {!error&&!loading&&results?.length===0&&<T size={13} color={palette.inkMuted}>Ничего не найдено. Попробуйте другое написание или оригинальное название.</T>}
     {!!results?.length&&<ScrollView style={{maxHeight:380}} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
      {results.map((r,i)=>{const busy=phase.step==='loading'&&phase.result.id===r.id&&phase.result.mediaType===r.mediaType;const own=mode.kind==='add'?existing(r):undefined;
       return <SoftPressable key={r.mediaType+r.id} accessibilityRole="button" disabled={phase.step==='loading'}
        accessibilityLabel={[r.title,r.year,r.mediaType==='tv'?'сериал':'фильм',own?'уже в коллекции':undefined].filter(Boolean).join(', ')} onPress={()=>choose(r)}
        style={{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:8,borderTopWidth:i?1:0,borderColor:'rgba(41,38,45,0.08)',opacity:phase.step==='loading'&&!busy?0.5:1}}>
        <Poster uri={posterUrl(r.posterPath,'w92')} width={40} title={r.title}/>
        <View style={{flex:1,minWidth:0,gap:2}}>
         <T size={14.5} lines={2} style={{lineHeight:19}}>{r.title}</T>
         <T size={12} lines={1} color="#7d747c">{[r.year,r.mediaType==='tv'?'Сериал':'Фильм',r.originalTitle&&r.originalTitle!==r.title?r.originalTitle:undefined].filter(Boolean).join(' · ')}</T>
         {own&&<T size={11.5} color="#2F6B5A">Уже в коллекции</T>}
        </View>
        {busy?<ActivityIndicator color={palette.mauve}/>:<Icon name="next" size={16} color="#b0a8b0"/>}
       </SoftPressable>;})}
     </ScrollView>}
     {mode.kind==='add'&&onManual&&!error&&<Pressable accessibilityRole="button" onPress={()=>{onClose();onManual();}} style={{minHeight:40,justifyContent:'center'}}><T size={13.5} color={palette.mauve}>Добавить вручную, без каталога</T></Pressable>}
    </>}
   {!!error&&phase.step==='preview'&&<T size={13} color={palette.danger}>{error}</T>}
   <Attribution/>
  </View>
 </ConfirmationSheet>;
}

function Preview({mode,result,details,saving,already,onBack,onConfirm,onOpen}:{mode:Mode;result:CatalogResult;details:CatalogDetails;saving:boolean;already?:RecordObject;onBack:()=>void;onConfirm:()=>void;onOpen:(o:RecordObject)=>void}){
 const facts=[details.year??result.year,result.mediaType==='tv'?'Сериал':'Фильм',details.genres.slice(0,3).join(', ')||undefined,
  details.runtimeMinutes?`${Math.floor(details.runtimeMinutes/60)?Math.floor(details.runtimeMinutes/60)+' ч ':''}${details.runtimeMinutes%60} мин`:undefined].filter(Boolean).join(' · ');
 const next=posterUrl(details.posterPath??result.posterPath,'w342');
 const existingCover=mode.kind==='poster'?pictureSource(mode.item):undefined;
 return <View style={{gap:12}}>
  <Pressable accessibilityRole="button" onPress={onBack} style={{flexDirection:'row',alignItems:'center',gap:4,minHeight:36,alignSelf:'flex-start'}}>
   <Icon name="back" size={16} color={palette.mauve}/><T size={13.5} color={palette.mauve}>К результатам</T>
  </Pressable>
  {mode.kind==='poster'
   ?<View style={{flexDirection:'row',gap:14,justifyContent:'center'}}>
     <View style={{alignItems:'center',gap:6}}><Poster source={existingCover} width={104} title={mode.item.title}/><T size={11.5} color="#7d747c">Сейчас</T></View>
     <Icon name="next" size={18} color="#b0a8b0"/>
     <View style={{alignItems:'center',gap:6}}><Poster uri={next} width={104} title={details.title}/><T size={11.5} color="#7d747c">Постер TMDB</T></View>
    </View>
   :<View style={{flexDirection:'row',gap:14}}>
     <Poster uri={next} width={104} title={details.title}/>
     <View style={{flex:1,minWidth:0,gap:4}}>
      <T size={17} bold style={{lineHeight:22}}>{details.title}</T>
      {!!details.originalTitle&&details.originalTitle!==details.title&&<T size={12.5} color="#7d747c">{details.originalTitle}</T>}
      <T size={12.5} color={palette.inkMuted} style={{lineHeight:18}}>{facts}</T>
     </View>
    </View>}
  {mode.kind==='poster'&&<View style={{gap:2}}><T size={14.5} bold>{details.title}</T><T size={12.5} color={palette.inkMuted}>{facts}</T></View>}
  {!!details.description&&<T size={13.5} lines={5} color="#3d3940" style={{lineHeight:19.5}}>{details.description}</T>}
  {mode.kind==='poster'&&!next&&<T size={13} color={palette.danger}>У этого варианта нет постера в TMDB.</T>}
  {already
   ?<View style={{gap:8}}><T size={13} color="#2F6B5A">Этот фильм уже есть в вашей коллекции.</T>
     <Pressable accessibilityRole="button" onPress={()=>onOpen(already)} style={{minHeight:46,borderRadius:13,backgroundColor:palette.graphite,alignItems:'center',justifyContent:'center'}}><T size={14} bold color="#f4f0f2">Открыть</T></Pressable></View>
   :<Pressable accessibilityRole="button" disabled={saving||(mode.kind==='poster'&&!next)} onPress={onConfirm}
     style={{minHeight:48,borderRadius:13,backgroundColor:palette.graphite,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,opacity:saving||(mode.kind==='poster'&&!next)?0.55:1}}>
     {saving&&<ActivityIndicator color="#f4f0f2"/>}<T size={14} bold color="#f4f0f2">{mode.kind==='poster'?'Сохранить постер':'Добавить в коллекцию'}</T>
    </Pressable>}
 </View>;
}

function Poster({uri,source,width,title}:{uri?:string;source?:any;width:number;title:string}){
 const [failed,setFailed]=useState(false);
 const src=source??(uri?{uri}:undefined);
 const height=Math.round(width*1.5);
 return <View style={{width,height,borderRadius:width>60?12:7,overflow:'hidden',backgroundColor:'#e6dde2',alignItems:'center',justifyContent:'center'}}>
  {src&&!failed?<Image source={src} resizeMode="cover" onError={()=>setFailed(true)} style={{width,height}} accessibilityLabel={'Постер: '+title}/>
   :<Icon name="image" size={width>60?20:14} color="#a99ea6"/>}
 </View>;
}

/** TMDB attribution, as its terms require: the logo (less prominent than ours) and the notice. */
export function Attribution(){
 const C=usePlannerColors();
 return <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingTop:4}} accessibilityLabel={'Источник данных: TMDB. '+TMDB_ATTRIBUTION}>
  <Image source={require('../../assets/attribution/tmdb.png')} resizeMode="contain" style={{width:66,height:19}} accessibilityIgnoresInvertColors/>
  <T size={11.5} color={C.muted} style={{flex:1,lineHeight:16}}>{TMDB_ATTRIBUTION}</T>
 </View>;
}
