import {minimalSurfaces} from '../design/themes';
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
 const {theme}=useApp().state.settings;
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
 const links=notes?[navigationItems[0],{path:'/tasks',icon:'tasks',title:'Дела'} as const,navigationItems[2],navigationItems[1],navigationItems[4]]:navigationItems;
 return <><View style={{backgroundColor:theme==='minimal'?minimalSurfaces.navigation:C.paper,borderTopWidth:1,borderColor:theme==='minimal'?'#c9ced8':'#eeece9',flexDirection:'row',paddingHorizontal:10,paddingTop:8,paddingBottom:10,minHeight:70,...(notes?{marginHorizontal:20,marginBottom:12,borderRadius:20,borderTopWidth:0}:{})}}>{links.map(x=><Pressable key={x.path} accessibilityRole="tab" accessibilityLabel={x.title||'Добавить'} aria-selected={path===x.path} accessibilityState={{selected:path===x.path}} onPress={()=>x.icon==='plus'?setAdd(true):path!==x.path&&router.push(x.path as any)} style={{flex:1,alignItems:'center',justifyContent:'center',gap:4}}>{x.icon==='plus'?<View style={{width:49,height:49,borderRadius:25,backgroundColor:theme==='mist'?'#6d72cf':theme==='minimal'?'#fff':'#786c63',alignItems:'center',justifyContent:'center'}}><Icon name="plus" color={theme==='minimal'?C.ink:'#fff'} size={26}/></View>:<><Icon name={x.icon} filled={x.icon==='house'&&path==='/'} color={path===x.path?C.ink:'#797985'} size={22}/><T size={9} color={path===x.path?C.ink:'#797985'}>{x.title}</T></>}</Pressable>)}</View><ConfirmationSheet visible={add} title="Добавить" onClose={close} headerTitle={<View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingLeft:36}}><T bold size={20}>Добавить</T><Action icon="mic" label={listening?'Остановить диктовку':'Диктовать голосом'} color={listening?C.red:C.ink} onPress={dictate}/></View>}>
 {listening&&<T center size={12}>Слушаю…</T>}
 {!!voiceError&&<T center size={12} color={C.red}>{voiceError}</T>}
 {(!!spoken||!!voiceError)&&<TextInput accessibilityLabel="Текст записи" value={spoken} onChangeText={setSpoken} placeholder="Название записи" maxLength={200} style={{minHeight:44,padding:10,borderRadius:12,backgroundColor:C.paper,color:C.ink,textAlign:'center'}}/>}
 {choices?choices.map(choice=><AddMenuRow key={choice.title} title={choice.title} onPress={()=>openEditor(section,choice.type,choice.category)}/>):sections.filter(s=>!section||s.id===section).map(s=><AddMenuRow key={s.id} title={s.title.replace('\n',' ')} onPress={()=>openEditor(s.id)}/>)}{section&&<Primary quiet onPress={()=>{const voice=spoken.trim()?stageVoiceDraft(spoken.trim()):undefined;close();router.push({pathname:'/add',params:{voice}});}}>Другой раздел</Primary>}</ConfirmationSheet></>;
}

export function AddMenuRow({title,onPress}:{title:string;onPress:()=>void}){const C=usePlannerColors();
 return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={{minHeight:46,borderRadius:24,backgroundColor:'#eeecea',flexDirection:'row',alignItems:'center',justifyContent:'center',paddingHorizontal:16,gap:10}}>
  <Icon name="plus" size={18} color={C.ink}/>
  <T size={14} center style={{flexShrink:1}}>{title}</T>
 </Pressable>;
}
