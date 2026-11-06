import React,{useState} from 'react';
import {Image,Linking,PixelRatio,Pressable,Share,View,useWindowDimensions} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {Icon} from '../components/Icon';
import {SoftPressable} from '../design/SoftPressable';
import {palette,shadows} from '../design/system';
import {usePlanner} from './context';
import {openFile} from './files';
import {DateLabel,SegmentedTabs,T,pictureSource,usePlannerColors} from './ui';
import {Attribution,MovieSearchSheet} from './MovieSearch';

/**
 * «Фильмы» in Soft Future: a vertical poster collection and a calm film page.
 * Only presentation lives here — the records, statuses, rating and links are the existing ones.
 */

const GAP=8;
/** TMDB serves several widths of the same poster: pick a light one for the grid, never the original. */
function sized(source:any,width:number){
 const uri:string|undefined=source?.uri;
 if(!uri||!/^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\//.test(uri))return source;
 const px=width*PixelRatio.get();
 return {uri:uri.replace(/\/t\/p\/w\d+\//,`/t/p/${px>185?'w342':'w185'}/`)};
}

export function MovieGrid({rows,open,showWatched}:{rows:RecordObject[];open:(o:RecordObject)=>void;showWatched:boolean}){
 const [width,setWidth]=useState(0);
 // 3 posters with their names on a phone (2 on very narrow screens), more on tablets.
 const columns=width>=560?5:width>0&&width<300?2:3;
 const gap=12;
 const poster=width?Math.floor((width-gap*(columns-1))/columns):0;
 return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'wrap',columnGap:gap,rowGap:16}}>
  {poster>0&&rows.map(item=><PosterTile key={item.id} item={item} width={poster} watched={showWatched&&item.status==='completed'} onPress={()=>open(item)}/>)}
 </View>;
}

function PosterTile({item,width,watched,onPress}:{item:RecordObject;width:number;watched:boolean;onPress:()=>void}){
 const [failed,setFailed]=useState(false);
 const source=pictureSource(item);
 const height=Math.round(width*1.5);
 const year=item.data.year;
 const rating=Number(item.data.rating);
 return <SoftPressable accessibilityRole="button" onPress={onPress}
  accessibilityLabel={[item.title,year,watched?'просмотрено':undefined,rating>0?'оценка '+rating:undefined].filter(Boolean).join(', ')}
  style={{width,gap:6}}>
  <View style={{width,height,borderRadius:12,overflow:'hidden',backgroundColor:'#ebe3e7',borderWidth:1,borderColor:'rgba(41,38,45,0.06)'}}>
   {source&&!failed
    ?<Image source={sized(source,width)} resizeMode="cover" onError={()=>setFailed(true)} style={{width,height}}/>
    :<TitleTile year={year}/>}
   {watched&&<View style={{position:'absolute',top:6,right:6,width:22,height:22,borderRadius:11,backgroundColor:'rgba(43,41,49,0.74)',alignItems:'center',justifyContent:'center'}}>
    <Icon name="check" size={12} color="#f4f0f2" strokeWidth={2.4}/>
   </View>}
  </View>
  {/* Name under the poster — never over the picture — up to two lines. */}
  <View style={{gap:1}}>
   <T size={13} lines={2} color="#29262D" style={{lineHeight:17}}>{item.title}</T>
   {(!!year||rating>0)&&<T size={11.5} lines={1} color="#8a8189" style={{lineHeight:15}}>{[year,rating>0?'★ '+rating:undefined].filter(Boolean).join(' · ')}</T>}
  </View>
 </SoftPressable>;
}

/** A film without a cover: a calm tile with a film icon (the name is shown under the tile). */
function TitleTile({year,title}:{year?:string|number;title?:string}){
 return <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:6,padding:10,backgroundColor:'#ebe3e7'}}>
  <Icon name="play" size={22} color="#a99ea6"/>
  {!!title&&<T size={15} center lines={4} color="#4f4852">{title}</T>}
  {!!year&&<T size={11} color="#8a8189">{year}</T>}
 </View>;
}

const RATINGS=[0,1,2,3,4,5,6,7,8,9,10];

export function MovieDetail({item,onEdit}:{item:RecordObject;onEdit:()=>void}){
 const C=usePlannerColors();
 const {patch,mark,update}=usePlanner();
 const {width:screen}=useWindowDimensions();
 const [error,setError]=useState('');
 const [failed,setFailed]=useState(false);
 const [contentWidth,setContentWidth]=useState(0);
 const [posterSearch,setPosterSearch]=useState(false);
 const d=item.data;
 // Side by side only when the content column itself is wide enough (tablets); on phones the poster sits on top.
 const wide=contentWidth>=440;
 const link=(url:string)=>{try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))throw Error();Linking.openURL(u.href).catch(()=>setError('Не удалось открыть ссылку'));}catch{setError('Укажите корректную ссылку в настройках');}};
 const watched=item.status==='completed';
 const setStatus=(value:string)=>{if((value==='Просмотрено')===watched)return;(watched?patch(item.id,{status:'active',completedAt:undefined}):mark(item,'complete')).catch(()=>{});};
 const rating=typeof d.rating==='number'&&Number.isFinite(d.rating)?d.rating:undefined;
 const rate=(value:number)=>{
  setError('');
  // Tapping the chosen mark again removes it (the field is dropped, as if it was never set).
  const saved=rating===value
   ?update(s=>({...s,objects:s.objects.map(o=>{if(o.id!==item.id)return o;const {rating:_removed,...data}=o.data;return {...o,data,updatedAt:new Date().toISOString()};})}))
   :patch(item.id,{data:{rating:value}});
  saved.catch(()=>setError('Не удалось сохранить оценку'));
 };
 const poster=item.attachments.find(f=>f.mime.startsWith('image/'));
 const source=pictureSource(item);
 const trailer:string|undefined=d.trailerUrl;
 const description=(item.description||d.description||'').trim();
 const facts=[d.originalTitle&&d.originalTitle!==item.title?d.originalTitle:undefined,d.year,
  Array.isArray(d.genres)&&d.genres.length?d.genres.join(', '):undefined,
  d.runtimeMinutes?`${Math.floor(d.runtimeMinutes/60)?Math.floor(d.runtimeMinutes/60)+' ч ':''}${d.runtimeMinutes%60} мин`:undefined].filter(Boolean);
 const posterWidth=wide?160:Math.min(200,Math.round(screen*0.52));
 const hasCover=!!source&&!failed;
 const otherFiles=item.attachments.filter(f=>f!==poster);
 const one=contentWidth>=RATINGS.length*36+(RATINGS.length-1)*4;

 const cover=<Pressable accessibilityRole={poster?'imagebutton':'image'} accessibilityLabel={poster?'Открыть обложку':'Постер: '+item.title}
  disabled={!poster} onPress={()=>poster&&openFile(poster)}
  style={{width:posterWidth,height:Math.round(posterWidth*1.5),borderRadius:16,overflow:'hidden',backgroundColor:'#e6dde2',...shadows[2],alignSelf:wide?'flex-start':'center'}}>
  {source&&!failed?<Image source={source} resizeMode="cover" onError={()=>setFailed(true)} style={{width:'100%',height:'100%'}}/>:<TitleTile title={item.title} year={d.year}/>}
 </Pressable>;

 const head=<View style={{gap:4,flex:wide?1:undefined}}>
  <T size={24} bold style={{letterSpacing:-0.3,lineHeight:30}}>{item.title}</T>
  {facts.length>0&&<T size={13.5} color={palette.inkMuted}>{facts.join(' · ')}</T>}
  <View style={{gap:8,marginTop:12}}>
   <SoftPressable accessibilityRole="button" accessibilityLabel={trailer?'Смотреть трейлер':'Найти трейлер на YouTube'}
    onPress={()=>link(trailer??'https://www.youtube.com/results?search_query='+encodeURIComponent(item.title+(d.year?' '+d.year:'')+' трейлер'))}
    style={{minHeight:44,borderRadius:13,backgroundColor:palette.graphite,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,paddingHorizontal:14}}>
    <Icon name={trailer?'play':'search'} size={16} color="#f4f0f2"/><T size={13.5} bold color="#f4f0f2">{trailer?'Смотреть трейлер':'Найти трейлер'}</T>
   </SoftPressable>
   <View style={{flexDirection:'row',gap:8}}>
    <Secondary icon="heart" filled={!!item.favorite} label={item.favorite?'В избранном':'В избранное'}
     onPress={()=>patch(item.id,{favorite:!item.favorite}).catch(()=>{})}/>
    <Secondary icon="share" label="Поделиться" onPress={()=>Share.share({message:item.title}).catch(()=>{})}/>
   </View>
   {!!d.sourceUrl&&d.sourceUrl!==trailer&&<Pressable accessibilityRole="link" onPress={()=>link(d.sourceUrl)} style={{minHeight:36,justifyContent:'center'}}>
    <T size={13} color={palette.mauve}>Страница фильма ↗</T>
   </Pressable>}
  </View>
 </View>;

 return <View style={{gap:18}} onLayout={e=>setContentWidth(e.nativeEvent.layout.width)}>
  {/* Without a cover there is no empty poster block: the title leads the page. */}
  {wide&&hasCover?<View style={{flexDirection:'row',gap:20}}>{cover}{head}</View>:<>{hasCover&&cover}{head}</>}
  <View style={{gap:6}}>
   <SegmentedTabs values={['Хочу посмотреть','Просмотрено']} value={watched?'Просмотрено':'Хочу посмотреть'} onChange={setStatus}/>
   {watched&&item.completedAt&&<View style={{flexDirection:'row',gap:4,paddingHorizontal:4}}><T size={12} muted>Просмотрено</T><DateLabel date={item.completedAt}/></View>}
  </View>
  <View style={{gap:8}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
    <T size={13} bold color={palette.inkMuted}>Моя оценка{rating!==undefined?` · ${rating} из 10`:''}</T>
    {rating!==undefined&&<Pressable accessibilityRole="button" onPress={()=>rate(rating)} style={{minHeight:32,justifyContent:'center',paddingHorizontal:4}}><T size={12.5} color={palette.mauve}>Убрать</T></Pressable>}
   </View>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>
    {RATINGS.map(value=>{const on=rating===value;return <Pressable key={value} accessibilityRole="button" accessibilityLabel={'Оценка '+value} accessibilityState={{selected:on}} aria-selected={on}
     onPress={()=>rate(value)}
     style={{height:40,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:on?palette.graphite:'rgba(41,38,45,0.06)',
      width:contentWidth?(one?(contentWidth-4*(RATINGS.length-1))/RATINGS.length:(contentWidth-4*5)/6):36}}>
     <T size={13.5} bold={on} color={on?'#f4f0f2':C.ink}>{value}</T>
    </Pressable>;})}
   </View>
  </View>
  {!!description&&<View style={{gap:6}}><T size={13} bold color={palette.inkMuted}>Описание</T><T size={14.5} style={{lineHeight:22}}>{description}</T></View>}
  <View style={{gap:6}}>
   <T size={13} bold color={palette.inkMuted}>Заметка</T>
   <Pressable accessibilityRole="button" accessibilityLabel={item.notes?'Изменить заметку':'Добавить заметку'} onPress={onEdit}
    style={{padding:13,borderRadius:14,backgroundColor:'rgba(251,249,250,0.94)',borderWidth:1,borderColor:'rgba(41,38,45,0.07)'}}>
    {item.notes?<T size={14} style={{lineHeight:21}}>{item.notes}</T>:<T size={13.5} muted>Добавить заметку…</T>}
   </Pressable>
  </View>
  {otherFiles.map(f=><Pressable key={f.id} accessibilityRole="link" onPress={()=>openFile(f)} style={{minHeight:36,justifyContent:'center'}}><T size={13} color={palette.mauve}>{f.name} ↗</T></Pressable>)}
  {!!error&&<T size={12.5} color={C.red}>{error}</T>}
  {/* Poster from the catalog: only for a film without any cover; nothing else of the film is changed. */}
  {!source&&<SoftPressable accessibilityRole="button" onPress={()=>setPosterSearch(true)}
   style={{minHeight:46,borderRadius:13,borderWidth:1,borderColor:'rgba(41,38,45,0.12)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7}}>
   <Icon name="image" size={16} color={palette.ink}/><T size={13.5}>Найти постер</T>
  </SoftPressable>}
  {(d.catalogSource==='TMDB'||/^https:\/\/image\.tmdb\.org\//.test(String(d.posterUrl??'')))&&<Attribution/>}
  {posterSearch&&<MovieSearchSheet mode={{kind:'poster',item}} onClose={()=>setPosterSearch(false)}/>}
 </View>;
}

function Secondary({icon,label,onPress,filled=false}:{icon:'heart'|'share';label:string;onPress:()=>void;filled?:boolean}){
 return <SoftPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={icon==='heart'?{selected:filled}:undefined} aria-selected={icon==='heart'?filled:undefined} onPress={onPress}
  style={{flex:1,minHeight:44,borderRadius:13,backgroundColor:'rgba(251,249,250,0.94)',borderWidth:1,borderColor:'rgba(41,38,45,0.08)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingHorizontal:8}}>
  <Icon name={icon} size={16} color={filled?palette.danger:palette.ink} filled={filled}/><T size={13} lines={1}>{label}</T>
 </SoftPressable>;
}
