import {ShiftNotificationSync} from '../src/data/shift-notifications';
import {WebInteractionStyles} from '../src/components/WebInteractionStyles';
import {PlannerProvider} from '../src/planner/context';
import {SwipeBack} from '../src/components/SwipeBack';
import '../src/data/vault-runtime';
import {NotificationSync} from '../src/NotificationSync';
import {ApiProvider,useApi} from '../src/ApiContext';
import React,{useEffect,useRef} from 'react';
import {Stack,router,usePathname} from 'expo-router';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {AppProvider,useApp} from '../src/context';
import {CatalogProvider} from '../src/catalog/CatalogContext';
import {useFonts} from 'expo-font';
import {View,Platform} from 'react-native';
import {colors} from '../src/design/tokens';
import {gradients} from '../src/design/system';
import {SoftTransitionProvider} from '../src/design/transition';
import {useKeyboardFrame} from '../src/design/keyboard';
/** Background for the first frames: the theme remembered from the last launch (graphite only for the Soft Future home). */
function bootColor(){
 if(Platform.OS!=='web'||typeof window==='undefined')return '#f4f0f2';
 let theme='soft';try{theme=localStorage.getItem('life-os.theme')||'soft';}catch{/* private mode */}
 const home=/^\/(life-os\/?)?$/.test(window.location.pathname);
 if(theme==='soft')return home?gradients.background[0]:'#f4f0f2';
 return (colors as Record<string,{bg:string}>)[theme]?.bg??'#f4f0f2';
}
function Routes(){const {state,ready}=useApp();const path=usePathname();
 // Soft Future: the home screen starts on graphite, so the status-bar area and icons follow it.
 const softHome=state.settings.theme==='soft'&&path==='/';
 // Colour under the status bar: graphite on the Soft Future home screen, the light milk-rose top of the inner-screen wash
 // in Soft Future, each theme's own background elsewhere. The installed web app on iOS 26 tints the status-bar area with the
 // page's body background (theme-color is no longer reliable there), so body, <meta name="theme-color"> and the safe area
 // all get the same colour — no dark haze over light screens.
 const bar=softHome?gradients.background[0]:state.settings.theme==='soft'?'#f4f0f2':colors[state.settings.theme].bg;
 useEffect(()=>{if(Platform.OS!=='web'||typeof document==='undefined'||!ready)return;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',bar);document.documentElement.style.backgroundColor=bar;document.body.style.backgroundColor=bar;
  // Remember the theme for the next launch, so the very first frame (before data loads) already has the right colours.
  try{localStorage.setItem('life-os.theme',state.settings.theme);}catch{/* private mode */}},[bar,ready,state.settings.theme]);
 const keyboardFrame=useKeyboardFrame();
 // Until stored settings are loaded, show only the remembered background: no default theme flashing first.
 if(!ready)return <View style={{flex:1,backgroundColor:bootColor()}}/>;
 return <SafeAreaView style={[{flex:1,backgroundColor:bar},keyboardFrame]} edges={['top','left','right']}><WebInteractionStyles/><StatusBar style={state.settings.theme==='dark'||softHome?'light':'dark'}/><SoftTransitionProvider><SwipeBack><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}/></SwipeBack></SoftTransitionProvider>{ready&&<ShiftNotificationSync data={state.planner?.shiftCalendar}/>}</SafeAreaView>;}
function LocalProfile(){const {session}=useApi();const path=usePathname();const profileId=session?'life-os-user-'+session.user.id:'life-os-v1';const previous=useRef(profileId);useEffect(()=>{if(previous.current!==profileId){previous.current=profileId;router.replace(path as '/');}},[profileId]);return <AppProvider key={profileId} profileId={profileId}><PlannerProvider><NotificationSync/><CatalogProvider><Routes/></CatalogProvider></PlannerProvider></AppProvider>;}
export default function Root(){const [loaded,error]=useFonts({Inter:require('../assets/fonts/Inter.ttf')});if(!loaded&&!error)return <View style={{flex:1,backgroundColor:bootColor()}}/>;return <SafeAreaProvider><ApiProvider><LocalProfile/></ApiProvider></SafeAreaProvider>;}
