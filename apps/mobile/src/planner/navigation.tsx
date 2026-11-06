import React,{createContext,useContext,useRef,useState,useEffect,useCallback} from 'react';
import {BackHandler} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import {dropRedundant,popStep} from './steps';

/**
 * Local back steps inside one screen (open editor, open record, open entry…).
 *
 * A step is a snapshot of the screen's step keys taken right before a recorded change. «Назад» restores the latest
 * snapshot that actually differs from the current state.
 *
 * Keys declared with `record=false` (selected day, month, search text, list choice) are *sticky*: they describe where
 * the user is, not an open layer, so «Назад» never rolls them back. Otherwise every day tapped in a calendar was
 * replayed one by one on the way back.
 *
 * When a layer is closed in place (saved / cancelled without «Назад»), the step that opened it becomes a no-op;
 * it is dropped right away so a later «Назад» does not reopen or replay it.
 */
type Scope={cache:Map<string,unknown>;listeners:Map<string,(v:any)=>void>;history:Map<string,unknown>[];pending:boolean;sticky:Set<string>};
const Context=createContext<Scope|null>(null);let active:Scope|undefined;

/**
 * Layers that close on «Назад» before anything else (bottom sheets, menus). The most recently opened one wins.
 * Registered by the sheet components while visible.
 */
const overlays:{id:number;close:()=>void}[]=[];let overlaySeq=0;let closingOverlay=false;
export function useBackOverlay(visible:boolean,close:()=>void){
 const ref=useRef(close);ref.current=close;
 useEffect(()=>{if(!visible)return;const id=++overlaySeq;overlays.push({id,close:()=>ref.current()});return ()=>{const i=overlays.findIndex(o=>o.id===id);if(i>=0)overlays.splice(i,1);};},[visible]);
}

export function goBack(fallback?:()=>void){
 // A sheet whose own close handler calls goBack (common: onClose={goBack}) must not re-enter the overlay step.
 const overlay=closingOverlay?undefined:overlays[overlays.length-1];
 if(overlay){closingOverlay=true;try{overlay.close();}finally{closingOverlay=false;}return;}
 if(active){const restore=popStep(active);if(restore){active.pending=false;for(const [key,value] of restore)active.listeners.get(key)?.(value);return;}}
 if(typeof fallback==='function')fallback();else if(router.canGoBack())router.back();else router.replace((backFallback??'/') as '/');
}
/** Where «Назад» leads when the screen was opened directly (no history): set by screens like a record opened from a link. */
let backFallback:string|undefined;
export function useBackFallback(route:string|undefined){useFocusEffect(useCallback(()=>{backFallback=route;return ()=>{if(backFallback===route)backFallback=undefined;};},[route]));}
export function StepBoundary({children}:{children:React.ReactNode}){const scope=useRef<Scope>({cache:new Map(),listeners:new Map(),history:[],pending:false,sticky:new Set()}).current;useFocusEffect(useCallback(()=>{active=scope;const h=BackHandler.addEventListener('hardwareBackPress',()=>{goBack();return true;});return ()=>{if(active===scope)active=undefined;h.remove();};},[scope]));return <Context.Provider value={scope}>{children}</Context.Provider>;}
/**
 * Persist section navigation while its editor is open; one event creates one back step.
 * Returns [value, set (records a step unless the key is sticky), replace (never records; drops steps it made no-op)].
 */
export function useStepState<T>(key:string,initial:T|(()=>T),record=true):[T,React.Dispatch<React.SetStateAction<T>>,React.Dispatch<React.SetStateAction<T>>]{
 const scope=useContext(Context);
 if(scope&&!record)scope.sticky.add(key);
 const [value,setValue]=useState<T>(()=>{if(scope?.cache.has(key))return scope.cache.get(key) as T;const v=typeof initial==='function'?(initial as ()=>T)():initial;scope?.cache.set(key,v);return v;});
 useEffect(()=>{scope?.listeners.set(key,setValue);return ()=>{scope?.listeners.delete(key);};},[scope,key]);
 const set=useCallback((action:React.SetStateAction<T>,remember=record)=>{
  const before=scope?.cache.has(key)?scope.cache.get(key) as T:value;
  const next=typeof action==='function'?(action as (v:T)=>T)(before):action;
  if(Object.is(before,next))return;
  if(scope){
   if(remember&&!scope.pending){scope.history.push(new Map(scope.cache));if(scope.history.length>80)scope.history.shift();scope.pending=true;queueMicrotask(()=>{scope.pending=false;});}
   scope.cache.set(key,next);
   if(!remember)dropRedundant(scope);
  }
  setValue(next);
 },[scope,key,value,record]);
 return [value,set,action=>set(action,false)];
}

/** Switching a section tab starts a fresh local back stack. Details still record steps. */
export function useTabState<T>(key:string,initial:T|(()=>T)){
 const scope=useContext(Context);const [value,,replace]=useStepState(key,initial,false);
 const select:React.Dispatch<React.SetStateAction<T>>=action=>{const before=scope?.cache.get(key) as T??value;const next=typeof action==='function'?(action as (v:T)=>T)(before):action;if(Object.is(before,next))return;if(scope){scope.history=[];scope.pending=false;}replace(next);};
 return [value,select] as const;
}

