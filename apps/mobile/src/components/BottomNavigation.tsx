import {minimalSurfaces,warmSurfaces,softHome} from '../design/themes';
import {useEffectiveTheme,useReducedMotion} from '../design/scope';
import {SoftPressable} from '../design/SoftPressable';
import {useSoftNavigation} from '../design/transition';
import {StaggerIn,ease} from '../design/motion';
import {blur,gradients,motion,shadows,spring} from '../design/system';
import {Animated} from 'react-native';
import {useApp} from '../context';
import {usePlannerColors} from '../planner/ui';
import {stageVoiceDraft} from '../planner/voiceDraft';
import React,{useEffect,useRef,useState} from 'react';
import {View,Pressable,Platform,TextInput} from 'react-native';
import {router,usePathname,useLocalSearchParams} from 'expo-router';
import {Icon} from './Icon';
import {C,T,ConfirmationSheet,Primary,Action} from '../planner/ui';
import {sections} from '../planner/seed';
export const navigationItems=[{path:'/',key:'homeTab',icon:'house',title:'Главная'},{path:'/search',key:'search',icon:'search',title:'Поиск'},{path:'/add',key:'addObject',icon:'plus',title:''},{path:'/notifications',key:'notifications',icon:'bell',title:'Уведомления'},{path:'/profile',key:'profile',icon:'user',title:'Профиль'}] as const;
type Recognition = {
 lang: string;
 onresult: ((event: {results: ArrayLike<ArrayLike<{transcript: string}>>})=>void) | null;
 onerror: ((event: {error:string})=>void) | null;
 onend: (()=>void) | null;
 start:()=>void;
 stop:()=>void;
 abort:()=>void;
};

export function BottomNavigation({notes=false}:{notes?:boolean}={}){const C=usePlannerColors();
 const theme=useEffectiveTheme();
 const {navigate:softNavigate}=useSoftNavigation();
 const path=usePathname();const params=useLocalSearchParams<{section:string}>();const [add,setAdd]=useState(false);
 const [spoken,setSpoken]=useState('');
 const [listening,setListening]=useState(false);
 const [voiceError,setVoiceError]=useState('');
 const recognition=useRef<Recognition|null>(null);
 const stopVoice=()=>{
  const current=recognition.current;
  recognition.current=null;
  if(current){current.onend=null;current.onerror=null;current.onresult=null;current.abort();}
 };
 useEffect(()=>stopVoice,[]);
 const close=()=>{stopVoice();setListening(false);setSpoken('');setVoiceError('');setAdd(false);};
 const dictate=()=>{
  if(recognition.current){recognition.current.stop();return;}
  setVoiceError('');
  const browser=globalThis as typeof globalThis & {
   SpeechRecognition?:new()=>Recognition;
   webkitSpeechRecognition?:new()=>Recognition;
  };
  const Speech=browser.SpeechRecognition??browser.webkitSpeechRecognition;
  if(Platform.OS!=='web'||!Speech){setVoiceError('Диктовка недоступна в этом браузере. Можно ввести текст вручную.');return;}
  const current=new Speech();
  recognition.current=current;
  current.lang='ru-RU';
  current.onresult=event=>setSpoken(event.results[0][0].transcript.trim().slice(0,200));
  current.onerror=event=>setVoiceError(event.error==='not-allowed'?'Разрешите доступ к микрофону или введите текст вручную.':'Не удалось распознать речь. Попробуйте ещё раз или введите текст.');
  current.onend=()=>{recognition.current=null;setListening(false);};
  try{current.start();setListening(true);}
  catch{stopVoice();setVoiceError('Не удалось включить микрофон. Можно ввести текст вручную.');}
 };
 const openEditor=(section?:string,type?:string,category?:string)=>{
  const title=spoken.trim();
  const voice=title?stageVoiceDraft(title):undefined;
  close();
  router.push({pathname:'/planner',params:{section,type,category,add:'1',voice}});
 };
 const section=params.section??(path.includes('wishlist')?'shopping':path.startsWith('/section/')?path.split('/')[2]:path.includes('health')?'health':undefined);
 const choices:{title:string;type:string;category?:string}[]|null=section==='health'?[{title:'Добавить обследование',type:'checkup'},{title:'Добавить препарат',type:'medication'},{title:'Загрузить анализ',type:'analysis'}]:section==='food'?[{title:'Добавить рецепт',type:'recipe'},{title:'Добавить блюдо',type:'dish'}]:section==='home'?[{title:'Добавить задачу',type:'homeTask'},{title:'Добавить идею',type:'homeTask',category:'Идеи'}]:null;
 const warm=theme==='warm';
 const links=notes&&!warm?[navigationItems[0],{path:'/tasks',icon:'tasks',title:'Дела'} as const,navigationItems[2],navigationItems[1],navigationItems[4]]:navigationItems;
 return <>{theme==='soft'?<SoftNavBar links={links} path={path} open={add} onNavigate={target=>path==='/'?softNavigate(target as any):router.push(target as any)} onAdd={()=>setAdd(true)}/>:<View style={{backgroundColor:theme==='minimal'?minimalSurfaces.navigation:C.paper,borderTopWidth:1,borderColor:warm?C.line:theme==='minimal'?'#c9ced8':'#eeece9',flexDirection:'row',paddingHorizontal:10,paddingTop:8,paddingBottom:10,minHeight:70,...(warm?{marginHorizontal:20,marginBottom:12,borderRadius:32,borderWidth:1}:notes?{marginHorizontal:20,marginBottom:12,borderRadius:20,borderTopWidth:0}:{})}}>{links.map(x=><Pressable key={x.path} accessibilityRole="tab" accessibilityLabel={x.title||'Добавить'} aria-selected={path===x.path} accessibilityState={{selected:path===x.path}} onPress={()=>x.icon==='plus'?setAdd(true):path!==x.path&&router.push(x.path as any)} style={{flex:1,alignItems:'center',justifyContent:'center',gap:4}}>{x.icon==='plus'?<View style={{width:49,height:49,borderRadius:25,backgroundColor:warm?warmSurfaces.selection:theme==='mist'?'#6d72cf':theme==='minimal'?'#fff':'#786c63',alignItems:'center',justifyContent:'center'}}><Icon name="plus" color={warm||theme==='minimal'?C.ink:'#fff'} size={26}/></View>:<><Icon name={x.icon} filled={!warm&&x.icon==='house'&&path==='/'} color={warm?warmSurfaces.icon:path===x.path?C.ink:'#797985'} size={warm?24:22}/>{!warm&&<T size={9} color={path===x.path?C.ink:'#797985'}>{x.title}</T>}</>}</Pressable>)}</View>}<ConfirmationSheet visible={add} title="Добавить" onClose={close} headerTitle={<View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingLeft:36}}><T bold size={20}>Добавить</T><Action icon="mic" label={listening?'Остановить диктовку':'Диктовать голосом'} color={listening?C.red:C.ink} onPress={dictate}/></View>}>
 {listening&&<T center size={12}>Слушаю…</T>}
 {!!voiceError&&<T center size={12} color={C.red}>{voiceError}</T>}
 {(!!spoken||!!voiceError)&&<TextInput accessibilityLabel="Текст записи" value={spoken} onChangeText={setSpoken} placeholder="Название записи" maxLength={200} style={{minHeight:44,padding:10,borderRadius:12,backgroundColor:C.paper,color:C.ink,textAlign:'center'}}/>}
 {choices?choices.map((choice,index)=>{const row=<AddMenuRow key={choice.title} title={choice.title} onPress={()=>openEditor(section,choice.type,choice.category)}/>;return theme==='soft'?<StaggerIn key={choice.title} index={index}>{row}</StaggerIn>:row;}):sections.filter(s=>!section||s.id===section).map((s,index)=>{const row=<AddMenuRow key={s.id} title={s.title.replace('\n',' ')} onPress={()=>openEditor(s.id)}/>;return theme==='soft'?<StaggerIn key={s.id} index={index}>{row}</StaggerIn>:row;})}{section&&<Primary quiet onPress={()=>{const voice=spoken.trim()?stageVoiceDraft(spoken.trim()):undefined;close();router.push({pathname:'/add',params:{voice}});}}>Другой раздел</Primary>}</ConfirmationSheet></>;
}

export function AddMenuRow({title,onPress}:{title:string;onPress:()=>void}){const C=usePlannerColors();
 return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={{minHeight:46,borderRadius:24,backgroundColor:'#eeecea',flexDirection:'row',alignItems:'center',justifyContent:'center',paddingHorizontal:16,gap:10}}>
  <Icon name="plus" size={18} color={C.ink}/>
  <T size={14} center style={{flexShrink:1}}>{title}</T>
 </Pressable>;
}

/**
 * Soft Future bottom bar: dark glass, same items as before. A soft pill slides to the active item;
 * the other icons stay still. Blur is applied on web only (native has no blur without extra libraries).
 */
function SoftNavBar({links,path,open,onNavigate,onAdd}:{links:readonly {path:string;icon:string;title:string}[];path:string;open:boolean;onNavigate:(path:string)=>void;onAdd:()=>void}){
 const reduced=useReducedMotion();
 // «+» turns into «×» while the add panel is open
 const turn=useRef(new Animated.Value(0)).current;
 useEffect(()=>{Animated.timing(turn,{toValue:open?1:0,duration:reduced?0:motion.menu,easing:ease([0.2,0,0,1]),useNativeDriver:true}).start();},[open,reduced]);
 const [width,setWidth]=useState(0);
 const index=links.findIndex(x=>x.path===path&&x.icon!=='plus');
 const slot=width/links.length;
 const x=useRef(new Animated.Value(0)).current;
 const visible=useRef(new Animated.Value(0)).current;
 const placed=useRef(false);
 useEffect(()=>{
  if(!slot)return;
  const target=Math.max(index,0)*slot;
  Animated.timing(visible,{toValue:index>=0?1:0,duration:reduced?0:motion.tab,useNativeDriver:true}).start();
  if(!placed.current||reduced){x.setValue(target);placed.current=true;return;}
  Animated.spring(x,{toValue:target,...spring.snappy,useNativeDriver:true}).start();
 },[index,slot,reduced,x,visible]);
 // The strip behind the floating bar continues the screen background (gradient end on home, light wash elsewhere).
 return <View style={{backgroundColor:path==='/'?gradients.background[gradients.background.length-1]:'#e8dde3'}}><View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{flexDirection:'row',marginHorizontal:16,marginBottom:12,paddingVertical:7,borderRadius:30,
  backgroundColor:softHome.navBar,borderWidth:1,borderColor:softHome.navLine,...shadows[3],
  ...(Platform.OS==='web'?{backdropFilter:`blur(${blur.bar}px) saturate(140%)`} as object:{})}}>
  {slot>0&&<Animated.View pointerEvents="none" style={{position:'absolute',top:7,bottom:7,left:0,width:slot,paddingHorizontal:8,opacity:visible,transform:[{translateX:x}]}}>
   <View style={{flex:1,borderRadius:22,backgroundColor:softHome.navIndicator}}/>
  </Animated.View>}
  {links.map(item=>{
   const active=item.path===path;
   if(item.icon==='plus')return <View key={item.path} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
    <SoftPressable accessibilityRole="button" accessibilityLabel="Добавить" onPress={onAdd}
     style={{width:48,height:48,borderRadius:24,backgroundColor:softHome.plus,alignItems:'center',justifyContent:'center',...shadows[2]}}>
     <Animated.View style={{transform:[{rotate:turn.interpolate({inputRange:[0,1],outputRange:['0deg','45deg']})}]}}><Icon name="plus" color={softHome.plusInk} size={24} strokeWidth={1.6}/></Animated.View>
    </SoftPressable>
   </View>;
   return <Pressable key={item.path} accessibilityRole="tab" accessibilityLabel={item.title} aria-selected={active} accessibilityState={{selected:active}}
    onPress={()=>{if(!active)onNavigate(item.path);}} style={{flex:1,minHeight:52,alignItems:'center',justifyContent:'center',gap:3}}>
    <Icon name={item.icon as any} color={active?softHome.text:softHome.muted} size={21} strokeWidth={1.5}/>
    <T size={9} color={active?softHome.text:softHome.muted}>{item.title}</T>
   </Pressable>;
  })}
 </View></View>;
}
