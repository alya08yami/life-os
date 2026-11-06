import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {Animated,BackHandler,PanResponder,Platform,Pressable,ScrollView,View,useWindowDimensions} from 'react-native';
import {router,usePathname,type Href} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon,type IconName} from './Icon';
import {T,usePlannerColors} from '../planner/ui';
import {sections} from '../planner/seed';
import {useApp} from '../context';
import {useReducedMotion} from '../design/scope';
import {softHome} from '../design/themes';

/**
 * ☰ side menu (Navicon reference): a translucent glass panel slides in from the left over a soft dim; profile on top,
 * compact items with thin icons, «Разделы» opens the 12 sections in place. Closes on a tap outside, a swipe to the
 * left, Back, or after choosing. One instance for the whole app, opened from the home header.
 */
const Ctx=createContext<{open:()=>void}>({open:()=>{}});
export const useNavDrawer=()=>useContext(Ctx);

type Item={key:string;label:string;icon:IconName;href:Href;match:(p:string)=>boolean};
const ITEMS:Item[]=[
 {key:'home',label:'Главная',icon:'house',href:'/',match:p=>p==='/'},
 {key:'calendar',label:'Календарь',icon:'calendar',href:'/shift-calendar',match:p=>p.startsWith('/shift-calendar')},
];
const AFTER:Item[]=[
 {key:'tasks',label:'Мои дела',icon:'tasks',href:'/tasks',match:p=>p==='/tasks'},
 {key:'search',label:'Поиск',icon:'search',href:'/search',match:p=>p==='/search'},
 {key:'settings',label:'Настройки',icon:'settings',href:'/settings',match:p=>p.startsWith('/settings')},
];
const sectionHref=(id:string):Href=>id==='shopping'?'/wishlist':{pathname:'/section/[section]',params:{section:id}} as Href;

export function NavDrawerProvider({children}:{children:React.ReactNode}){
 const [visible,setVisible]=useState(false);
 const open=useCallback(()=>setVisible(true),[]);
 return <Ctx.Provider value={{open}}>{children}<NavDrawer visible={visible} onClose={()=>setVisible(false)}/></Ctx.Provider>;
}

function NavDrawer({visible,onClose}:{visible:boolean;onClose:()=>void}){
 const theme=useApp().state.settings.theme;const C=usePlannerColors();const reduced=useReducedMotion();
 const {width}=useWindowDimensions();const insets=useSafeAreaInsets();const path=usePathname();
 const panel=Math.min(320,Math.round(width*0.76));
 const x=useRef(new Animated.Value(-panel)).current;const dim=useRef(new Animated.Value(0)).current;
 const [mounted,setMounted]=useState(false);const [sectionsOpen,setSectionsOpen]=useState(false);
 const native=Platform.OS!=='web';
 useEffect(()=>{
  if(visible){setMounted(true);x.setValue(reduced?0:-panel);dim.setValue(0);
   Animated.parallel([Animated.timing(x,{toValue:0,duration:reduced?0:260,easing:t=>1-Math.pow(1-t,3),useNativeDriver:native}),Animated.timing(dim,{toValue:1,duration:reduced?120:220,useNativeDriver:native})]).start();}
  else if(mounted){Animated.parallel([Animated.timing(x,{toValue:reduced?0:-panel,duration:reduced?0:200,useNativeDriver:native}),Animated.timing(dim,{toValue:0,duration:reduced?100:200,useNativeDriver:native})]).start(()=>{setMounted(false);setSectionsOpen(false);});}
 },[visible]);
 useEffect(()=>{if(!visible)return;const h=BackHandler.addEventListener('hardwareBackPress',()=>{onClose();return true;});return ()=>h.remove();},[visible]);
 const closeRef=useRef(onClose);closeRef.current=onClose;
 const swipe=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponder:(_,g)=>g.dx<-12&&Math.abs(g.dx)>1.5*Math.abs(g.dy),
  onPanResponderMove:(_,g)=>x.setValue(Math.min(0,g.dx)),
  onPanResponderRelease:(_,g)=>{if(g.dx<-60||g.vx<-0.5)closeRef.current();else Animated.timing(x,{toValue:0,duration:160,useNativeDriver:native}).start();},
 }),[]);
 if(!mounted)return null;
 const soft=theme==='soft';
 const ink=soft?softHome.text:C.ink;const muted=soft?softHome.muted:C.muted;
 const surface=soft?{backgroundColor:'rgba(96,88,99,0.66)',borderColor:'rgba(255,255,255,0.16)'}:{backgroundColor:C.paper,borderColor:C.line};
 const activeBg=soft?'rgba(244,240,242,0.14)':C.lavender;
 const go=(href:Href)=>{onClose();setTimeout(()=>router.push(href),0);};
 const Row=({icon,label,active,onPress,right,indent=false}:{icon:IconName;label:string;active?:boolean;onPress:()=>void;right?:React.ReactNode;indent?:boolean})=>
  <Pressable accessibilityRole="button" accessibilityLabel={label} aria-current={active?'page':undefined} onPress={onPress}
   style={({pressed})=>({minHeight:indent?46:54,flexDirection:'row',alignItems:'center',gap:indent?13:16,paddingLeft:indent?28:16,paddingRight:14,borderRadius:18,
    backgroundColor:active?activeBg:pressed?(soft?'rgba(244,240,242,0.08)':C.lavender):'transparent',borderWidth:active?1:0,borderColor:soft?'rgba(255,255,255,0.10)':C.line})}>
   <Icon name={icon} size={indent?18:21} color={indent?muted:ink}/>
   <T size={indent?14.5:16} color={ink} style={{flex:1}}>{label}</T>
   {right}
  </Pressable>;
 return <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:1000}} pointerEvents="box-none">
  <Animated.View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:soft?'rgba(20,18,24,0.45)':'rgba(30,26,34,0.28)',opacity:dim}}>
   <Pressable accessibilityLabel="Закрыть меню" onPress={onClose} style={{flex:1}}/>
  </Animated.View>
  <Animated.View accessibilityRole="menu" accessibilityLabel="Меню" {...swipe.panHandlers}
   style={{position:'absolute',top:0,bottom:0,left:0,width:panel,borderTopRightRadius:30,borderBottomRightRadius:30,borderWidth:1,borderLeftWidth:0,...surface,
    paddingTop:18,paddingBottom:insets.bottom+16,paddingHorizontal:14,
    shadowColor:'#000',shadowOpacity:0.25,shadowRadius:30,shadowOffset:{width:8,height:0},
    ...(Platform.OS==='web'?{backdropFilter:'blur(26px) saturate(140%)'} as object:{}),
    transform:[{translateX:x}],opacity:reduced?dim:1}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Мой профиль" onPress={()=>go('/profile')}
    style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:14,padding:8,paddingRight:10,borderRadius:22,marginBottom:22,backgroundColor:pressed?activeBg:'transparent'})}>
    <View style={{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center',backgroundColor:soft?'rgba(244,240,242,0.12)':C.lavender,borderWidth:1,borderColor:soft?'rgba(255,255,255,0.14)':C.line}}>
     <Icon name="user" size={23} color={ink}/>
    </View>
    <T size={16} color={ink} style={{flex:1}}>Мой профиль</T>
    <Icon name="next" size={18} color={muted}/>
   </Pressable>
   <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{gap:4}}>
    {ITEMS.map(item=><Row key={item.key} icon={item.icon} label={item.label} active={item.match(path)} onPress={()=>go(item.href)}/>)}
    <Row icon="layers" label="Разделы" onPress={()=>setSectionsOpen(v=>!v)} right={<View style={{transform:[{rotate:sectionsOpen?'180deg':'0deg'}]}}><Icon name="chevronDown" size={18} color={muted}/></View>}/>
    {sectionsOpen&&sections.map(s=><Row key={s.id} indent icon={s.icon as IconName} label={s.title.replace('\n',' ')} active={path==='/section/'+s.id||(s.id==='shopping'&&path==='/wishlist')} onPress={()=>go(sectionHref(s.id))}/>)}
    {AFTER.map(item=><Row key={item.key} icon={item.icon} label={item.label} active={item.match(path)} onPress={()=>go(item.href)}/>)}
   </ScrollView>
  </Animated.View>
 </View>;
}
