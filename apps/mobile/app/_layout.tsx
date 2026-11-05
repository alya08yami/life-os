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
import {View,Text} from 'react-native';
import {colors} from '../src/design/tokens';
function Routes(){const {state,ready}=useApp();return <SafeAreaView style={{flex:1,backgroundColor:colors[state.settings.theme].bg}} edges={['top','left','right']}><WebInteractionStyles/><StatusBar style={state.settings.theme==='dark'?'light':'dark'}/><SwipeBack><Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}/></SwipeBack>{ready&&<ShiftNotificationSync data={state.planner?.shiftCalendar}/>}</SafeAreaView>;}
function LocalProfile(){const {session}=useApi();const path=usePathname();const profileId=session?'life-os-user-'+session.user.id:'life-os-v1';const previous=useRef(profileId);useEffect(()=>{if(previous.current!==profileId){previous.current=profileId;router.replace(path as '/');}},[profileId]);return <AppProvider key={profileId} profileId={profileId}><PlannerProvider><NotificationSync/><CatalogProvider><Routes/></CatalogProvider></PlannerProvider></AppProvider>;}
export default function Root(){const [loaded,error]=useFonts({TenorSans:require('../assets/fonts/TenorSans.ttf'),CormorantGaramond:require('../assets/fonts/CormorantGaramond.ttf'),Manrope:require('../assets/fonts/Manrope.ttf')});if(!loaded&&!error)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F8F7F5'}}><Text>LIFE OS</Text></View>;return <SafeAreaProvider><ApiProvider><LocalProfile/></ApiProvider></SafeAreaProvider>;}
