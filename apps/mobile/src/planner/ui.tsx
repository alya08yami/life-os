import {GlassBackdrop} from '../design/glass';
import {useHorizontalSwipe} from '../design/swipe';
import {ScreenSlide} from '../design/transition';
import {useKeyboardInset} from '../design/keyboard';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useEffectiveTheme} from '../design/scope';
import {SoftSheet,useSoftMotion,FadeRise} from '../design/motion';
import {spring} from '../design/system';
import {SwipeableRow,useSwipeRow} from '../design/SwipeableRow';
import {colors} from '../design/tokens';
import {retiredMealPhotoKeys,ukrainianMealPhotos} from './meal-photos';
import {goBack,useBackOverlay} from './navigation';
import {instant} from '../design/instant';
import React,{useState,useCallback,useRef,useEffect} from 'react';
import {View,Text,Pressable,ScrollView,TextInput,Modal,ActivityIndicator,Image,Animated,Platform} from 'react-native';
import {router,usePathname,useFocusEffect} from 'expo-router';
import {BottomNavigation} from '../components/BottomNavigation';
import {Icon} from '../components/Icon';import type {IconName} from '../components/Icon';
import {usePlanner} from './context';import {useApp} from '../context';
import {pickFile,openFile} from './files';import type {FileRef,Tone,RecordObject} from '@life-os/domain/planner';
export const C={bg:'#f6f5f3',paper:'#fbfaf9',ink:'#0b142b',muted:'#85858e',line:'#eae7e5',lavender:'#e8e6fa',purple:'#171b79',green:'#299868',yellow:'#d99a32',red:'#e85c69'};
export function usePlannerColors(){
 const theme=useEffectiveTheme();
 if(theme==='light')return C;
 const palette=colors[theme];
 return {...C,bg:palette.bg,paper:palette.card,ink:palette.text,muted:palette.muted,line:palette.line,lavender:palette.accent,purple:palette.onAccent,...(theme==='warm'?{green:palette.positive,red:palette.danger}: {})};
}
export const tones:Record<Tone,string>={neutral:'#92949c',green:C.green,yellow:C.yellow,red:C.red};
export function T({children,size=14,bold=false,muted=false,color,center=false,style,lines}:{children:React.ReactNode;size?:number;bold?:boolean;muted?:boolean;color?:string;center?:boolean;style?:any;lines?:number}){const C=usePlannerColors();return <Text numberOfLines={lines} style={{fontFamily:'Inter',fontSize:size,lineHeight:size*1.45,color:color??(muted?C.muted:C.ink),fontWeight:bold?'600':'400',textAlign:center?'center':'left',...style}}>{children}</Text>;}
export function Action({icon,label,onPress,color,filled=false}:{icon:IconName;label:string;onPress:()=>void;color?:string;filled?:boolean}){const C=usePlannerColors();return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={()=>instant(onPress)} style={{width:36,height:38,alignItems:'center',justifyContent:'center'}}><Icon name={icon} color={color??C.ink} filled={filled} size={21}/></Pressable>;}
export function AppHeader(props:{title:string;onBack?:()=>void;right?:React.ReactNode;centerTitle?:boolean;color?:string}){return useSoftMotion().enabled?<SoftAppHeader {...props}/>:<ClassicAppHeader {...props}/>;}
/**
 * Soft Future header: one style everywhere — back, title on the left, actions on the right, one line.
 * A long title first steps down a little (never below 18 px); if it still does not fit (very narrow phones),
 * it moves to its own full-width line under the buttons instead of wrapping or shrinking further.
 */
function SoftAppHeader({title,onBack=goBack,right,color,centerTitle=false}:{title:string;onBack?:()=>void;right?:React.ReactNode;centerTitle?:boolean;color?:string}){
 const [natural,setNatural]=useState(0);const [room,setRoom]=useState(0);
 const fit=natural&&room?room/natural:1;
 const size=fit>=1?21:Math.floor(21*fit*10)/10;
 const stacked=!!natural&&!!room&&size<18;
 // An explicit centerTitle (e.g. «Мой календарь») is kept; the old hard-coded centred sections now align like the rest.
 const label=(sz:number,lines=1)=><T color={color} lines={lines} size={sz} bold center={centerTitle} style={{letterSpacing:-0.2}}>{title}</T>;
 return <View>
  {/* invisible measurement of the title's natural one-line width at the full size */}
  <View pointerEvents="none" style={{position:'absolute',opacity:0,left:0,top:0,flexDirection:'row'}} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
   <Text onLayout={e=>setNatural(e.nativeEvent.layout.width)} style={{fontFamily:'Inter',fontWeight:'600',fontSize:21,letterSpacing:-0.2,...({whiteSpace:'nowrap'} as object)}} numberOfLines={1}>{title}</Text>
  </View>
  <View style={{minHeight:60,flexDirection:'row',alignItems:'center',gap:6}}>
   <Action icon="back" label="Назад" color={color} onPress={onBack}/>
   <View style={{flex:1,minWidth:0}} onLayout={e=>setRoom(e.nativeEvent.layout.width)}>{!stacked&&label(Math.max(18,size))}</View>
   {right}
  </View>
  {stacked&&<View style={{paddingHorizontal:4,marginTop:-6,marginBottom:6}}>{label(21,2)}</View>}
 </View>;
}
function ClassicAppHeader({title,onBack=goBack,right,centerTitle=false,color}:{title:string;onBack?:()=>void;right?:React.ReactNode;centerTitle?:boolean;color?:string}){return <View style={{minHeight:60,flexDirection:'row',alignItems:'center',gap:6}}><Action icon="back" label="Назад" color={color} onPress={onBack}/><T color={color} lines={2} center={centerTitle||['Работа','Доходы и расходы','Отношения'].includes(title)} size={21} bold style={{flex:1}}>{title}</T>{right}</View>;}
/**
 * Swiping between a screen's main tabs. A screen's primary tab bar opts in with `swipe`; Frame then lets a horizontal
 * swipe over the screen's content select the neighbouring tab (no wrap-around at the first/last tab). Secondary tab
 * bars (filters, form options) never take part.
 */
type TabSwipeTarget={values:string[];value:string;onChange:(s:string)=>void};
const TabSwipeContext=React.createContext<{current:TabSwipeTarget|null}|null>(null);
function TabSwipeArea({children}:{children:React.ReactNode}){
 const target=useRef<TabSwipeTarget|null>(null);
 const step=(delta:number)=>{const t=target.current;if(!t)return;const i=t.values.indexOf(t.value);const next=t.values[i+delta];if(i>=0&&next!==undefined)t.onChange(next);};
 const swipe=useHorizontalSwipe({onNext:()=>step(1),onPrev:()=>step(-1),guard:()=>!!target.current});
 return <TabSwipeContext.Provider value={target}><View {...swipe.panHandlers} style={[{flex:1},swipe.style]}>{children}</View></TabSwipeContext.Provider>;
}
export function SegmentedTabs(props:{values:string[];value:string;onChange:(s:string)=>void;transparentTrack?:boolean;mistHeader?:boolean;
 /** This is the screen's main tab bar: horizontal swipes over the content switch between its tabs. */ swipe?:boolean;
 /** Soft Future: tab widths follow their labels (keeps mixed short/long labels on one line). */ fit?:boolean;
 /** Soft Future: colour of the active label (e.g. each «Отношения» tab has its own accent). */ activeColor?:string}){const soft=useSoftMotion();const area=React.useContext(TabSwipeContext);const {swipe,...rest}=props;
 useEffect(()=>{if(!swipe||!area)return;area.current={values:props.values,value:props.value,onChange:props.onChange};});
 useEffect(()=>()=>{if(swipe&&area)area.current=null;},[swipe,area]);
 props=rest as typeof props;return soft.enabled&&!props.mistHeader?<SoftSegmentedTabs {...props} reduced={soft.reduced}/>:<ClassicSegmentedTabs {...props}/>;}
/** Soft Motion tabs: one highlight slides between tabs instead of jumping; labels stay still. */
function SoftSegmentedTabs({values,value,onChange,transparentTrack=false,reduced,fit=false,activeColor}:{values:string[];value:string;onChange:(s:string)=>void;transparentTrack?:boolean;reduced:boolean;fit?:boolean;activeColor?:string}){const C=usePlannerColors();
 const [width,setWidth]=useState(0);const slot=values.length?(width-6)/values.length:0;const index=Math.max(0,values.indexOf(value));
 // `fit`: each tab takes room in proportion to its label, so a long label («Хочу посмотреть») stays on one line next to short ones.
 const [cells,setCells]=useState<{x:number;w:number}[]>([]);
 const cell=fit?cells[index]:slot?{x:3+index*slot,w:slot}:undefined;
 const x=React.useRef(new Animated.Value(0)).current;const w=React.useRef(new Animated.Value(0)).current;const placed=React.useRef(false);
 React.useEffect(()=>{if(!cell||!cell.w)return;if(!placed.current||reduced){x.setValue(cell.x);w.setValue(cell.w);placed.current=true;return;}
  Animated.parallel([Animated.spring(x,{toValue:cell.x,...spring.snappy,useNativeDriver:false}),Animated.spring(w,{toValue:cell.w,...spring.snappy,useNativeDriver:false})]).start();},[index,cell?.x,cell?.w,reduced]);
 const small=fit&&width>0&&width<300;
 return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{flexDirection:'row',backgroundColor:transparentTrack?'transparent':C.paper,borderRadius:19,padding:3,marginBottom:14}}>
  {!!cell?.w&&<Animated.View pointerEvents="none" style={{position:'absolute',top:3,bottom:3,left:0,width:w,borderRadius:16,backgroundColor:C.lavender,transform:[{translateX:x}]}}/>}
  {values.map((s,i)=><Pressable accessibilityRole="tab" aria-selected={value===s} accessibilityState={{selected:value===s}} key={s} onPress={()=>onChange(s)}
   onLayout={fit?e=>{const {x:cx,width:cw}=e.nativeEvent.layout;setCells(old=>{const next=[...old];next[i]={x:cx,w:cw};return next;});}:undefined}
   style={{flex:fit?s.length+(width<360?2:6):1,minWidth:0,paddingVertical:9,paddingHorizontal:fit?(width<360?1:6):0,borderRadius:16,alignItems:'center'}}><T size={small?12:12.65} lines={fit?1:undefined} bold={s===value} color={s===value?activeColor??C.purple:C.muted}>{s}</T></Pressable>)}
 </View>;}
function ClassicSegmentedTabs({values,value,onChange,transparentTrack=false,mistHeader=false}:{values:string[];value:string;onChange:(s:string)=>void;transparentTrack?:boolean;mistHeader?:boolean}){const C=usePlannerColors();return <View style={{flexDirection:'row',gap:4,backgroundColor:mistHeader?'rgba(255,255,255,.24)':transparentTrack?'transparent':C.paper,borderRadius:19,padding:3,marginBottom:14}}>{values.map(s=><Pressable accessibilityRole="tab" aria-selected={value===s} accessibilityState={{selected:value===s}} key={s} onPress={()=>onChange(s)} style={{flex:1,minWidth:0,paddingVertical:9,borderRadius:16,backgroundColor:s===value?(mistHeader?'rgba(89,107,213,.29)':C.lavender):'transparent',alignItems:'center'}}><T size={12.65} bold={s===value} color={mistHeader?'#fff':s===value?C.purple:C.muted}>{s}</T></Pressable>)}</View>;}
export function Primary({children,onPress,quiet=false,disabled=false}:{children:React.ReactNode;onPress:()=>void;quiet?:boolean;disabled?:boolean}){const C=usePlannerColors();return <Pressable accessibilityRole="button" disabled={disabled} onPress={()=>instant(onPress)} style={{opacity:disabled?.5:1,padding:13,minHeight:44,borderRadius:21,backgroundColor:quiet?C.paper:C.lavender,borderWidth:quiet?0:2,borderColor:'#fff',alignItems:'center',justifyContent:'center'}}><T color={quiet?C.ink:C.purple}>{children}</T></Pressable>;}
export function Input({label,value,onChange,multiline=false,placeholder,number=false,onBlur,autoFocus=false,onSubmit}:{label?:string;value:string;onChange:(s:string)=>void;multiline?:boolean;placeholder?:string;number?:boolean;onBlur?:()=>void;autoFocus?:boolean;onSubmit?:()=>void}){const C=usePlannerColors();const [focused,setFocused]=useState(false);return <View style={{gap:5}}>{label&&<T size={12}>{label}</T>}<TextInput accessibilityLabel={label??placeholder} value={value} onChangeText={onChange} onFocus={()=>setFocused(true)} onBlur={()=>{setFocused(false);onBlur?.();}} multiline={multiline} autoFocus={autoFocus} onSubmitEditing={onSubmit} returnKeyType={onSubmit?'done':undefined} inputMode={number?'decimal':undefined} keyboardType={number?'decimal-pad':'default'} placeholder={placeholder} placeholderTextColor={C.muted} style={{fontFamily:'Inter',fontSize:14,color:C.ink,backgroundColor:C.paper,borderColor:focused?C.muted:C.line,borderWidth:1,...(Platform.OS==='web'?{outlineStyle:'none'} as object:{}),borderRadius:13,padding:12,minHeight:44,...(multiline?{minHeight:120,textAlignVertical:'top' as const}:{})}}/></View>;}
export function StatusCheckbox({checked,tone='green',onPress,outline,size=18}:{checked:boolean;tone?:Tone;onPress:()=>void;outline?:string;size?:number}){const C=usePlannerColors();return <Pressable accessibilityRole="checkbox" aria-checked={checked} accessibilityState={{checked}} onPress={onPress} hitSlop={size>18?12:10} style={{width:size,height:size,borderRadius:size>18?6:5,borderWidth:1,borderColor:checked?tones[tone]:outline??C.muted,backgroundColor:checked?tones[tone]:'transparent',alignItems:'center',justifyContent:'center'}}>{checked&&<Icon name="check" size={size>18?14:13} color="#fff"/>}</Pressable>;}
export function DateLabel({date}:{date?:string}){return date?<T size={11} muted>{new Date(date).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</T>:null;}
/** `swipe` (Дом, Родители): in Soft Future swipe right = done, left = edit / archive. Health lists never pass it. */
export function CheckableListItem(props:{item:RecordObject;onCheck:()=>void;onPress?:()=>void;subtitle?:string;right?:React.ReactNode;tone?:Tone;swipe?:boolean;surface?:string;
 /** The row stays in the list after being checked (e.g. tab «Все»): slide it back instead of collapsing. */ keepOnComplete?:boolean}){
 const {patch}=usePlanner();const {item,onCheck,onPress,swipe=false}=props;const done=item.status==='completed';
 const row=<CheckableRowBody {...props}/>;
 if(!swipe)return row;
 return <SwipeableRow testID={'swipe-'+item.id} surface={props.surface??'#faf7f8'} collapseOnComplete={!props.keepOnComplete}
  complete={done||item.purchasedAt?undefined:{label:'Выполнено',onCommit:()=>onCheck()}}
  actions={[...(onPress?[{key:'edit',label:'Изменить',icon:'edit' as const,onPress}]:[]),
   {key:'archive',label:'В архив',icon:'package' as const,tone:'muted' as const,collapse:true,onPress:()=>patch(item.id,{archivedAt:new Date().toISOString()})}]}>{row}</SwipeableRow>;
}
function CheckableRowBody(props:{item:RecordObject;onCheck:()=>void;onPress?:()=>void;subtitle?:string;right?:React.ReactNode;tone?:Tone}){return useSoftMotion().enabled?<SoftCheckableRowBody {...props}/>:<ClassicCheckableRowBody {...props}/>;}
/** Soft Future checklist row (Дом и уют, Родители, Чек-ап…): same checkbox and actions, roomier type and touch area. */
function SoftCheckableRowBody({item,onCheck,onPress,subtitle,right,tone='green'}:{item:RecordObject;onCheck:()=>void;onPress?:()=>void;subtitle?:string;right?:React.ReactNode;tone?:Tone}){const C=usePlannerColors();const swipeRow=useSwipeRow();const done=item.status==='completed';
 return <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:48,paddingVertical:10,borderBottomWidth:1,borderColor:'rgba(41,38,45,0.07)'}}>
  <View style={{width:24,alignItems:'center'}}><StatusCheckbox checked={done||!!item.purchasedAt} tone={tone} onPress={onCheck} outline="#9a919a" size={20}/></View>
  <Pressable onPress={onPress} onLongPress={swipeRow.openActions??onPress} style={{flex:1,minWidth:0}}>
   <T size={14.5} color={done?'#8a8189':C.ink} style={{lineHeight:20,...(done?{textDecorationLine:'line-through'}:null)}}>{item.title}</T>
   {subtitle&&<T size={12} color={tone==='red'||tone==='yellow'?tones[tone]:'#8a8189'}>{subtitle}</T>}
  </Pressable>
  {right??<DateLabel date={item.completedAt}/>}
 </View>;}
function ClassicCheckableRowBody({item,onCheck,onPress,subtitle,right,tone='green'}:{item:RecordObject;onCheck:()=>void;onPress?:()=>void;subtitle?:string;right?:React.ReactNode;tone?:Tone}){const swipeRow=useSwipeRow();const done=item.status==='completed';return <View style={{flexDirection:'row',alignItems:'center',gap:13,minHeight:43,paddingVertical:9,borderBottomWidth:1,borderColor:'#efedeb'}}><StatusCheckbox checked={done||!!item.purchasedAt} tone={tone} onPress={onCheck}/><Pressable onPress={onPress} onLongPress={swipeRow.openActions??onPress} style={{flex:1,minWidth:0}}><T size={13} muted={done} style={done?{textDecorationLine:'line-through'}:undefined}>{item.title}</T>{subtitle&&<T size={11} muted color={tone==='red'||tone==='yellow'?tones[tone]:undefined}>{subtitle}</T>}</Pressable>{right??<DateLabel date={item.completedAt}/>}</View>;}
export function EmptyState({text='Пока пусто. Нажмите «+», чтобы добавить первую запись.'}:{text?:string}){return <View style={{padding:28,alignItems:'center'}}><T muted center>{text}</T></View>;}
export function LoadingState(){const C=usePlannerColors();return <View style={{padding:40}}><ActivityIndicator color={C.purple}/></View>;}
export function ErrorState(){const C=usePlannerColors();const {error,dismiss}=useApp();return error?<Pressable onPress={dismiss} style={{padding:12,backgroundColor:'#fbe7e8',borderRadius:12}}><T color={C.red}>{error==='quota'?'Не хватает места в хранилище браузера — запись не сохранена. Сохраните резервную копию в «Профиле» и удалите крупные фото. Закрыть':error==='storage'?'Не удалось открыть хранилище. Данные не перезаписаны — перезапустите приложение. Закрыть':'Не удалось сохранить. Проверьте хранилище и повторите действие. Закрыть'}</T></Pressable>:null;}
export function UndoToast(){const {toast,undo,setToast}=usePlanner();return toast?<View style={{position:'absolute',bottom:90,left:14,right:14,padding:14,borderRadius:17,backgroundColor:'#252b3b',flexDirection:'row',gap:10,alignItems:'center',zIndex:100}}><T size={12} color="#fff" style={{flex:1}}>{toast.text}</T><Pressable onPress={()=>toast.historyId?undo().catch(()=>{}):setToast(null)}><T size={12} color="#dad5ff">{toast.historyId?'Отменить':'Закрыть'}</T></Pressable></View>:null;}
export function ConfirmationSheet({visible,title,children,onClose,compact=false,headerTitle,skipExit=false}:{visible:boolean;title:string;children:React.ReactNode;onClose:()=>void;compact?:boolean;headerTitle?:React.ReactNode;skipExit?:boolean}){const C=usePlannerColors();const soft=useSoftMotion();const keyboard=useKeyboardInset();const safeBottom=useSafeAreaInsets().bottom;const lift={paddingBottom:22+(keyboard?0:safeBottom)};useBackOverlay(visible&&!soft.enabled,onClose);
 // Soft Future: same sheet, but it rises with a soft spring over a fading scrim and plays backwards on close.
 if(soft.enabled)return <SoftSheet visible={visible} skipExit={skipExit} onRequestClose={onClose} panelStyle={{backgroundColor:C.bg,borderTopLeftRadius:25,borderTopRightRadius:25,padding:22,...lift,maxHeight:compact?'62%':'88%'}}><View style={{flexDirection:'row',alignItems:'center',marginBottom:14}}>{headerTitle??<T bold size={20} style={{flex:1}}>{title}</T>}<Action icon="close" label="Закрыть" onPress={onClose}/></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:14,paddingBottom:25}}>{children}</ScrollView></SoftSheet>;
 return <Modal visible={visible} transparent animationType={skipExit&&!visible?'none':'slide'} onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#0005',justifyContent:'flex-end'}}><Pressable onPress={onClose} style={{flex:1}}/><View style={{backgroundColor:C.bg,borderTopLeftRadius:25,borderTopRightRadius:25,padding:22,...lift,maxHeight:compact?'62%':'88%'}}><View style={{flexDirection:'row',alignItems:'center',marginBottom:14}}>{headerTitle??<T bold size={20} style={{flex:1}}>{title}</T>}<Action icon="close" label="Закрыть" onPress={onClose}/></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:14,paddingBottom:25}}>{children}</ScrollView></View></View></Modal>;}
export function AttachmentPicker({files,onChange,documentsOnly=false}:{files:FileRef[];onChange:(f:FileRef[])=>void;documentsOnly?:boolean}){const C=usePlannerColors();const [error,setError]=useState('');return <View style={{gap:7}}><Primary quiet onPress={()=>pickFile(documentsOnly).then(f=>{if(f)onChange([...files,f]);}).catch(e=>setError(e.message))}>{documentsOnly?'＋ Документ':'＋ Фото или документ'}</Primary>{error&&<T color={C.red}>{error}</T>}{files.filter(f=>!documentsOnly||!f.mime.startsWith('image/')).map(f=><View key={f.id} style={{flexDirection:'row',gap:8,alignItems:'center'}}><Pressable style={{flex:1}} onPress={()=>openFile(f)}><T size={12}>▧ {f.name}</T></Pressable><Action icon="close" label={'Убрать '+f.name} onPress={()=>onChange(files.filter(x=>x.id!==f.id))}/></View>)}</View>;}
const images:Record<string,any>={note0:require('../../assets/approved/note0.jpg'),note1:require('../../assets/approved/note1.jpg'),note2:require('../../assets/approved/note2.jpg'),note3:require('../../assets/approved/note3.jpg'),note4:require('../../assets/approved/note4.jpg'),note5:require('../../assets/approved/note5.jpg'),note6:require('../../assets/approved/note6.jpg'),note7:require('../../assets/approved/note7.jpg'),note8:require('../../assets/approved/note8.jpg'),shoe:require('../../assets/approved/shoe.jpg'),dyson:require('../../assets/approved/dyson.jpg'),bag:require('../../assets/approved/bag.jpg'),watch:require('../../assets/approved/watch.jpg'),plant:require('../../assets/approved/plant.jpg'),vitamin:require('../../assets/approved/vitamin.jpg'),magnesium:require('../../assets/approved/magnesium.jpg'),iron:require('../../assets/approved/iron.jpg'),bowl:require('../../assets/approved/bowl.jpg'),pancakes:require('../../assets/approved/pancakes.jpg'),chicken:require('../../assets/approved/chicken.jpg'),oatmeal:require('../../assets/approved/oatmeal.jpg'),casserole:require('../../assets/approved/casserole.jpg'),soup:require('../../assets/approved/soup.jpg'),laptop:require('../../assets/approved/laptop.jpg'),paper:require('../../assets/approved/paper.jpg')};
const originalMealPhotos=[['oatmeal','Овсянка'],['pancakes','Панкейки'],['casserole','Запеканка'],['bowl','Боул'],['chicken','Курица с овощами'],['soup','Крем-суп']] as const;
const mealPhotos=[
 ...ukrainianMealPhotos,
 ...originalMealPhotos.map(([key,label])=>({key,label,source:images[key]})),
];
const mealPhotoSources=new Map<string,number>(mealPhotos.map(({key,source})=>[key,source]));
const normalizeMealName=(value:string)=>value.trim().toLowerCase().replace(/ё/g,'е').replace(/[«»"]/g,'');
export function MealPhotoPicker({value,onChange,dishTitle}:{value?:string;onChange:(key:string)=>void;dishTitle?:string}){const C=usePlannerColors();
 const [expanded,setExpanded]=useState(false);
 const [query,setQuery]=useState('');
 const titleQuery=normalizeMealName(dishTitle??'');
 const suggesting=!expanded&&titleQuery.length>=2;
 const search=expanded?normalizeMealName(query):titleQuery;
 const matching=mealPhotos.filter(({key,label})=>!retiredMealPhotoKeys.has(key)&&normalizeMealName(label).includes(search));
 // A longer dish title can still match a shorter catalog label, e.g. "Омлет с овощами".
 const firstWord=titleQuery.split(/\s+/)[0];
 const related=suggesting&&!matching.length&&firstWord.length>=3
  ?mealPhotos.filter(({key,label})=>!retiredMealPhotoKeys.has(key)&&normalizeMealName(label).startsWith(firstWord))
  :matching;
 const visiblePhotos=expanded?matching:suggesting?related.slice(0,6):[];
 const selected=mealPhotos.find(photo=>photo.key===value);
 return <View style={{gap:8}}>
  <Primary quiet onPress={()=>setExpanded(!expanded)}>{expanded?'Свернуть фотографии':selected?'Фото: '+selected.label:'Выбрать готовое фото'}</Primary>
  {expanded&&<Input placeholder="Поиск фото блюда" value={query} onChange={setQuery}/>}
  {expanded&&!matching.length&&<T muted>Фото по этому запросу не найдено</T>}
  {suggesting&&visiblePhotos.length>0&&<T size={12} muted>Подходящие фото</T>}
  {visiblePhotos.length>0&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
   {visiblePhotos.map(({key,label,source})=><Pressable key={key} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{selected:key===value}} onPress={()=>onChange(key===value?'':key)}
    style={{width:86,alignItems:'center',padding:4,borderRadius:12,backgroundColor:key===value?C.lavender:C.paper}}>
    <Image source={source} resizeMode="cover" style={{width:76,height:60,borderRadius:8}}/>
    <T center size={10}>{label}</T>
   </Pressable>)}
  </View>}
 </View>;
}
/** The image a record shows: the user's own attached image first, then a TMDB poster, then a bundled photo. */
export function pictureSource(item:RecordObject):any{const file=item.attachments.find(f=>f.mime.startsWith('image/'));return file?{uri:file.uri}:item.data.posterUrl&&/^https:\/\/image\.tmdb\.org\//.test(item.data.posterUrl)?{uri:item.data.posterUrl}:(mealPhotoSources.get(item.data.imageKey)??images[item.data.imageKey]);}
export function Picture({item,size=65,height,style}:{item:RecordObject;size?:number;height?:number;style?:any}){const source=pictureSource(item);return source?<Image source={source} resizeMode="cover" style={{width:size,height:height??size,borderRadius:12,backgroundColor:'#eeecea',...style}}/>:<View style={{width:size,height:height??size,borderRadius:12,backgroundColor:'#eeecea',alignItems:'center',justifyContent:'center',...style}}><Icon name="image" color="#b1adb0" size={25}/></View>;}
export function Frame({title,children,right,header=true,onBack,centerTitle=false,headerColor,notesLayout}:{title:string;children:React.ReactNode;right?:React.ReactNode;header?:boolean;onBack?:()=>void;centerTitle?:boolean;headerColor?:string;notesLayout?:'list'|'editor'}){const C=usePlannerColors();const {state}=usePlanner();const [focused,setFocused]=useState(false);useFocusEffect(useCallback(()=>{setFocused(true);return ()=>setFocused(false);},[]));const path=usePathname();const tab=['/','/search','/add','/tasks','/profile','/notifications','/inbox','/spaces'].includes(path);return <View style={{flex:1,backgroundColor:C.bg,alignItems:'center'}}><GlassBackdrop notes={!!notesLayout} home={path==='/'}/><ScreenSlide enabled={!tab} style={{width:'100%',maxWidth:500,paddingHorizontal:20}}>{header&&<AppHeader color={headerColor} title={title} centerTitle={centerTitle} right={right} onBack={onBack}/>}<ErrorState/>{state?<TabSwipeArea><ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:25,gap:14,flexGrow:notesLayout==='editor'?1:undefined}}>{children}</ScrollView></TabSwipeArea>:<LoadingState/>}</ScreenSlide>{!tab&&notesLayout!=='editor'&&<View style={{width:'100%',maxWidth:500}}><BottomNavigation notes={notesLayout==='list'}/></View>}{focused&&<UndoToast/>}</View>;}
export function DatePicker({label,value,onChange}:{label:string;value:string;onChange:(s:string)=>void}){const C=usePlannerColors();const [expanded,setExpanded]=useState(false);const [month,setMonth]=useState(()=>new Date((value||new Date().toISOString().slice(0,10))+'T12:00:00'));const monthSwipe=useHorizontalSwipe({onNext:()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1)),onPrev:()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))});const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7,count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();return <View style={{gap:8}}><Input label={label} value={value} onChange={onChange} placeholder="ГГГГ-ММ-ДД"/><Pressable onPress={()=>setExpanded(!expanded)}><T size={12} color={C.purple}>▦ {expanded?'Скрыть календарь':'Выбрать в календаре'}</T></Pressable>{expanded&&<View style={{padding:10,borderRadius:15,backgroundColor:C.paper,gap:8}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Action icon="back" label="Предыдущий месяц" onPress={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}/><T bold>{month.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</T><Action icon="next" label="Следующий месяц" onPress={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}/></View><View style={{flexDirection:'row'}}>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(s=><T key={s} center size={10} muted style={{width:'14.285%'}}>{s}</T>)}</View><View {...monthSwipe.panHandlers} style={[{flexDirection:'row',flexWrap:'wrap'},monthSwipe.style]}>{Array.from({length:offset+count},(_,i)=>{const n=i-offset+1,key=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;return <View key={i} style={{width:'14.285%',padding:2}}>{n>0&&<Pressable accessibilityLabel={key} onPress={()=>{onChange(key);setExpanded(false);}} style={{height:34,alignItems:'center',justifyContent:'center',backgroundColor:value===key?C.lavender:'transparent',borderRadius:10}}><T size={12}>{n}</T></Pressable>}</View>;})}</View></View>}</View>;}
