import {handoffKeyboard} from '../design/keyboard-handoff';
import {instant} from '../design/instant';
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useVisualViewport} from '../design/keyboard';
import {router,usePathname,useLocalSearchParams} from 'expo-router';
import {Icon} from './Icon';
import {C,T,ConfirmationSheet,Primary,Action} from '../planner/ui';
import {sections} from '../planner/seed';
export const navigationItems=[{path:'/',key:'homeTab',icon:'house',title:'Главная'},{path:'/shift-calendar',key:'search',icon:'calendar',title:'Календарь'},{path:'/add',key:'addObject',icon:'plus',title:''},{path:'/notifications',key:'notifications',icon:'bell',title:'Уведомления'},{path:'/profile',key:'profile',icon:'user',title:'Профиль'}] as const;
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
 const path=usePathname();const params=useLocalSearchParams<{section:string}>();const [add,setAdd]=useState(false);const [handover,setHandover]=useState(false);
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
  // Close the menu right now: its modal hands focus back to the «+» button as it goes, so that has to be over
  // before the keyboard hand-off takes focus.
  instant(()=>{setHandover(true);close();});
  // The editor opens on the section screen: keep the keyboard for its title across the screen change.
  handoffKeyboard();
  router.push({pathname:'/planner',params:{section,type,category,add:'1',voice}});
 };
 const section=params.section??(path.includes('wishlist')?'shopping':path.startsWith('/section/')?path.split('/')[2]:path.includes('health')?'health':undefined);
 const choices:{title:string;type:string;category?:string}[]|null=section==='health'?[{title:'Добавить обследование',type:'checkup'},{title:'Добавить препарат',type:'medication'},{title:'Загрузить анализ',type:'analysis'}]:section==='food'?[{title:'Добавить рецепт',type:'recipe'},{title:'Добавить блюдо',type:'dish'}]:section==='home'?[{title:'Добавить задачу',type:'homeTask'},{title:'Добавить идею',type:'homeTask',category:'Идеи'}]:null;
 const warm=theme==='warm';
 // Soft Future keeps one LIFE OS bar everywhere; «Дела» is reached from a button inside «Работа» instead.
 const links=notes&&!warm&&theme!=='soft'?[navigationItems[0],{path:'/tasks',icon:'tasks',title:'Дела'} as const,navigationItems[2],navigationItems[1],navigationItems[4]]:navigationItems;
 const safeBottom=useSafeAreaInsets().bottom;
 // The bar steps aside while the on-screen keyboard is open, as in native iPhone apps.
 const keyboardOpen=useVisualViewport().keyboard;
 // Dark theme: the old grey (#797985) almost vanished on the dark bar; a lighter lavender grey keeps ~4.8:1 contrast.
 const inactive=theme==='dark'?'#A9A3C2':'#797985';
 if(keyboardOpen)return null;
 return <>{theme==='soft'?<SoftNavBar links={links} path={path} open={add} onNavigate={target=>path==='/'?softNavigate(target as any):router.push(target as any)} onAdd={()=>(setHandover(false),setAdd(true))}/>:<View style={{backgroundColor:theme==='minimal'?minimalSurfaces.navigation:C.paper,borderTopWidth:1,borderColor:warm?C.line:theme==='minimal'?'#c9ced8':'#eeece9',flexDirection:'row',paddingHorizontal:10,paddingTop:8,paddingBottom:10,minHeight:70,...(warm?{marginHorizontal:20,marginBottom:Math.max(12,safeBottom),borderRadius:32,borderWidth:1}:notes?{marginHorizontal:20,marginBottom:Math.max(12,safeBottom),borderRadius:20,borderTopWidth:0}:{paddingBottom:10+safeBottom})}}>{links.map(x=><Pressable key={x.path} accessibilityRole="tab" accessibilityLabel={x.title||'Добавить'} aria-selected={path===x.path} accessibilityState={{selected:path===x.path}} onPress={()=>x.icon==='plus'?(setHandover(false),setAdd(true)):path!==x.path&&router.push(x.path as any)} style={{flex:1,alignItems:'center',justifyContent:'center',gap:4}}>{x.icon==='plus'?<View style={{width:49,height:49,borderRadius:25,backgroundColor:warm?warmSurfaces.selection:theme==='mist'?'#6d72cf':theme==='minimal'?'#fff':'#786c63',alignItems:'center',justifyContent:'center'}}><Icon name="plus" color={warm||theme==='minimal'?C.ink:'#fff'} size={26}/></View>:<><Icon name={x.icon} filled={!warm&&x.icon==='house'&&path==='/'} color={warm?warmSurfaces.icon:path===x.path?C.ink:inactive} size={warm?24:22}/>{!warm&&<T size={9} color={path===x.path?C.ink:inactive}>{x.title}</T>}</>}</Pressable>)}</View>}<ConfirmationSheet visible={add} skipExit={handover} title="Добавить" onClose={close} headerTitle={<View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingLeft:36}}><T bold size={20}>Добавить</T><Action icon="mic" label={listening?'Остановить диктовку':'Диктовать голосом'} color={listening?C.red:C.ink} onPress={dictate}/></View>}>
 {listening&&<T center size={12}>Слушаю…</T>}
 {!!voiceError&&<T center size={12} color={C.red}>{voiceError}</T>}
 {(!!spoken||!!voiceError)&&<TextInput accessibilityLabel="Текст записи" value={spoken} onChangeText={setSpoken} placeholder="Название записи" maxLength={200} style={{minHeight:44,padding:10,borderRadius:12,backgroundColor:C.paper,color:C.ink,textAlign:'center'}}/>}
 {section
  ?<View style={{gap:6}}>
    {(choices??sections.filter(s=>s.id===section).map(s=>({title:s.title.replace('\n',' '),type:undefined as string|undefined,category:undefined as string|undefined}))).map(choice=><AddMenuRow key={choice.title} title={choice.title} icon={sections.find(s=>s.id===section)?.icon} onPress={()=>openEditor(section,choice.type,choice.category)}/>)}
    <Pressable accessibilityRole="button" onPress={()=>{const voice=spoken.trim()?stageVoiceDraft(spoken.trim()):undefined;close();router.push({pathname:'/add',params:{voice}});}} style={{minHeight:44,alignItems:'center',justifyContent:'center'}}><T size={13.5} color={C.muted}>Другой раздел</T></Pressable>
   </View>
  :<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    {sections.map(s=><AddMenuTile key={s.id} title={s.title} icon={s.icon} onPress={()=>openEditor(s.id)}/>)}
   </View>}</ConfirmationSheet></>;
}

/** Quick add inside a section: a compact row with a thin icon. */
export function AddMenuRow({title,onPress,icon}:{title:string;onPress:()=>void;icon?:string}){const C=usePlannerColors();
 return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>({minHeight:52,borderRadius:16,backgroundColor:pressed?C.lavender:C.paper,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:12})}>
  <View style={{width:32,height:32,borderRadius:16,backgroundColor:C.lavender,alignItems:'center',justifyContent:'center'}}><Icon name={(icon??'plus') as any} size={17} color={C.ink}/></View>
  <T size={14.5} style={{flex:1}}>{title}</T>
  <Icon name="plus" size={16} color={C.muted}/>
 </Pressable>;
}
/** Quick add from anywhere: an even grid of the 12 sections, each a small tile with its thin icon and short name. */
function AddMenuTile({title,icon,onPress}:{title:string;icon:string;onPress:()=>void}){const C=usePlannerColors();
 return <Pressable accessibilityRole="button" accessibilityLabel={'Добавить: '+title.replace('\n',' ')} onPress={onPress}
  style={({pressed})=>({width:'31.6%',minHeight:84,borderRadius:16,backgroundColor:pressed?C.lavender:C.paper,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center',gap:7,paddingHorizontal:4,paddingVertical:10})}>
  <Icon name={icon as any} size={21} color={C.ink}/>
  <T size={12} center lines={2} style={{lineHeight:15}}>{title}</T>
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
 const safeBottom=useSafeAreaInsets().bottom;
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
 return <View style={{backgroundColor:path==='/'?gradients.background[gradients.background.length-1]:'#f4f0f2'}}><View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{flexDirection:'row',marginHorizontal:16,marginBottom:Math.max(12,safeBottom),paddingVertical:7,borderRadius:30,
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
