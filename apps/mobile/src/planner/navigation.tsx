import React,{createContext,useContext,useRef,useState,useEffect,useCallback} from 'react';
import {BackHandler} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
type Scope={cache:Map<string,unknown>;listeners:Map<string,(v:any)=>void>;history:Map<string,unknown>[];pending:boolean};
const Context=createContext<Scope|null>(null);let active:Scope|undefined;
export function goBack(fallback?:()=>void){while(active?.history.length){const old=active.history.pop()!;if([...old].every(([k,v])=>JSON.stringify(v)===JSON.stringify(active!.cache.get(k))))continue;active.pending=false;const current=active.cache;active.cache=new Map(old);for(const [key,listener] of active.listeners){if(old.has(key))listener(old.get(key));else if(current.has(key))active.cache.set(key,current.get(key));}return;}if(typeof fallback==='function')fallback();else if(router.canGoBack())router.back();else router.replace('/');}
export function StepBoundary({children}:{children:React.ReactNode}){const scope=useRef<Scope>({cache:new Map(),listeners:new Map(),history:[],pending:false}).current;useFocusEffect(useCallback(()=>{active=scope;const h=BackHandler.addEventListener('hardwareBackPress',()=>{goBack();return true;});return ()=>{if(active===scope)active=undefined;h.remove();};},[scope]));return <Context.Provider value={scope}>{children}</Context.Provider>;}
/** Persist section navigation while its editor is open; one event creates one back step. */
export function useStepState<T>(key:string,initial:T|(()=>T),record=true):[T,React.Dispatch<React.SetStateAction<T>>,React.Dispatch<React.SetStateAction<T>>]{const scope=useContext(Context);const [value,setValue]=useState<T>(()=>{if(scope?.cache.has(key))return scope.cache.get(key) as T;const v=typeof initial==='function'?(initial as ()=>T)():initial;scope?.cache.set(key,v);return v;});useEffect(()=>{scope?.listeners.set(key,setValue);return ()=>{scope?.listeners.delete(key);};},[scope,key]);const set=useCallback((action:React.SetStateAction<T>,remember=record)=>{const before=scope?.cache.has(key)?scope.cache.get(key) as T:value;const next=typeof action==='function'?(action as (v:T)=>T)(before):action;if(Object.is(before,next))return;if(scope){if(remember&&!scope.pending){scope.history.push(new Map(scope.cache));if(scope.history.length>80)scope.history.shift();scope.pending=true;queueMicrotask(()=>{scope.pending=false;});}scope.cache.set(key,next);}setValue(next);},[scope,key,value,record]);return [value,set,action=>set(action,false)];}

/** Switching a section tab starts a fresh local back stack. Details still record steps. */
export function useTabState<T>(key:string,initial:T|(()=>T)){
 const scope=useContext(Context);const [value,,replace]=useStepState(key,initial,false);
 const select:React.Dispatch<React.SetStateAction<T>>=action=>{const before=scope?.cache.get(key) as T??value;const next=typeof action==='function'?(action as (v:T)=>T)(before):action;if(Object.is(before,next))return;if(scope){scope.history=[];scope.pending=false;}replace(next);};
 return [value,select] as const;
}
