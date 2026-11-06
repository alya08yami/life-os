import React,{useCallback,useEffect,useState} from 'react';
import {Platform,Pressable,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Frame,T,usePlannerColors} from '../src/planner/ui';

/**
 * Screen diagnostics (read-only): what the installed web app on this device reports about the top safe area,
 * so the haze under the Dynamic Island can be traced to its real cause. Nothing is stored or sent anywhere.
 */
type Report=Record<string,string>;

function measure(insets:{top:number;bottom:number;left:number;right:number}):Report{
 if(Platform.OS!=='web'||typeof window==='undefined')return {'Платформа':Platform.OS};
 const probe=document.createElement('div');
 probe.style.cssText='position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
 document.body.appendChild(probe);
 const cs=getComputedStyle(probe);
 const env={top:cs.paddingTop,right:cs.paddingRight,bottom:cs.paddingBottom,left:cs.paddingLeft};
 probe.remove();
 const vv=window.visualViewport;
 const meta=(name:string)=>document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')??'—';
 const standalone=(navigator as unknown as {standalone?:boolean}).standalone;
 const root=document.getElementById('root');
 const firstChild=root?.firstElementChild as HTMLElement|null|undefined;
 return {
  'Установленное приложение (standalone)':String(window.matchMedia('(display-mode: standalone)').matches)+(standalone!==undefined?' · navigator.standalone='+standalone:''),
  'env(safe-area-inset-top)':env.top,
  'env(safe-area-inset-bottom)':env.bottom,
  'env left / right':env.left+' / '+env.right,
  'Отступ сверху в приложении':insets.top+'px',
  'Отступ снизу в приложении':insets.bottom+'px',
  'Окно (innerWidth × innerHeight)':window.innerWidth+' × '+window.innerHeight,
  'Экран (screen)':screen.width+' × '+screen.height+' · DPR '+window.devicePixelRatio,
  'visualViewport':vv?`${Math.round(vv.width)} × ${Math.round(vv.height)} · offsetTop ${Math.round(vv.offsetTop)} · scale ${vv.scale}`:'нет',
  'Прокрутка документа':String(document.scrollingElement?.scrollTop??0),
  'viewport':meta('viewport'),
  'status-bar-style':meta('apple-mobile-web-app-status-bar-style'),
  'theme-color':meta('theme-color'),
  'Фон body':getComputedStyle(document.body).backgroundColor,
  'Верх корня приложения':firstChild?Math.round(firstChild.getBoundingClientRect().top)+'px':'—',
  'Браузер':navigator.userAgent,
 };
}

export default function Diagnostics(){
 const C=usePlannerColors();
 const insets=useSafeAreaInsets();
 const [report,setReport]=useState<Report>({});
 const [copied,setCopied]=useState(false);
 const refresh=useCallback(()=>setReport(measure(insets)),[insets]);
 useEffect(()=>{refresh();},[refresh]);
 // Safe-area boundary line, attached straight to <body>: screens slide with a transform, and a fixed element inside a
 // transformed ancestor would be positioned relative to that ancestor instead of the screen.
 useEffect(()=>{if(Platform.OS!=='web'||typeof document==='undefined')return;const line=document.createElement('div');line.setAttribute('aria-hidden','true');line.style.cssText='position:fixed;left:0;right:0;top:env(safe-area-inset-top);height:1px;background:#e5484d;pointer-events:none;z-index:2147483647';document.body.appendChild(line);return ()=>line.remove();},[]);
 const text=Object.entries(report).map(([k,v])=>k+': '+v).join('\n');
 return <Frame title="Диагностика экрана">
  <T muted size={13}>Только чтение: значения этого устройства для поиска причины размытия под Dynamic Island. Ничего не сохраняется и никуда не отправляется.</T>
  <T size={13}>Откройте этот экран в установленном приложении, сразу после запуска, и пришлите текст ниже (кнопка «Скопировать»). Если сверху видно размытие — посмотрите, где проходит красная линия: это граница безопасной зоны, которую сообщает iPhone.</T>
  <View style={{borderRadius:18,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,padding:14,gap:9}}>
   {Object.entries(report).map(([k,v])=><View key={k} style={{gap:2}}><T size={12} muted>{k}</T><T size={13}>{v}</T></View>)}
  </View>
  <View style={{flexDirection:'row',gap:10}}>
   <Pressable accessibilityRole="button" onPress={refresh} style={{flex:1,minHeight:44,borderRadius:14,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'}}><T>Обновить</T></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{navigator.clipboard?.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});}} style={{flex:1,minHeight:44,borderRadius:14,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'}}><T>{copied?'Скопировано':'Скопировать'}</T></Pressable>
  </View>
 </Frame>;
}
