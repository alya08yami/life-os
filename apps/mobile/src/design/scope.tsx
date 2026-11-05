import React,{createContext,useContext,useEffect,useState} from 'react';
import {AccessibilityInfo,Platform} from 'react-native';
import {useApp} from '../context';

/**
 * Design scope.
 * 'system' — screens that adopt the new LIFE OS design system (later stages).
 * 'frozen' — screens that must keep their current look exactly, e.g. «Покупки и желания» (Хотелки).
 * Shared components (Frame, bottom bar, sheets) will check this before applying new styling,
 * so wrapping a route in <FrozenDesign> isolates it from the redesign.
 * Shared components call useEffectiveTheme() instead of reading settings.theme directly.
 */
export type DesignScope='system'|'frozen';
const ScopeContext=createContext<DesignScope>('system');
export function FrozenDesign({children}:{children:React.ReactNode}){
 return <ScopeContext.Provider value="frozen">{children}</ScopeContext.Provider>;
}
export const useDesignScope=()=>useContext(ScopeContext);
/**
 * Theme that a component should draw with. Inside a frozen zone the new Soft Future theme falls back to the
 * classic light look, so «Покупки и желания» stays exactly as it was. Existing themes are unaffected.
 */
export function useEffectiveTheme(){
 const theme=useApp().state.settings.theme;
 const scope=useContext(ScopeContext);
 return scope==='frozen'&&theme==='soft'?'light':theme;
}

/** True when the user asked the OS (or browser) to reduce motion. */
export function useReducedMotion(){
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{
  if(Platform.OS==='web'){
   const query=typeof window!=='undefined'&&window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):undefined;
   if(!query)return;
   const sync=()=>setReduced(query.matches);
   sync();query.addEventListener('change',sync);
   return ()=>query.removeEventListener('change',sync);
  }
  let alive=true;
  void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive)setReduced(value);});
  const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  return ()=>{alive=false;listener.remove();};
 },[]);
 return reduced;
}
