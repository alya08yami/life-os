import {withCompactExamples} from './data/compact-examples';
import {withRefreshExamples} from './data/refresh-examples';
import {referenceImages} from './data/reference-images';
import {filmImages} from './data/film-images';
import {withExamples,withHealthExamples,withMovieArtwork,withReferenceExamples} from './data/examples';
import {exampleImages} from './data/example-images';
import React,{createContext,useContext,useState,useEffect,useCallback} from 'react';
import * as Crypto from 'expo-crypto';
import {initialState} from '@life-os/domain';
import type {State} from '@life-os/domain';
import {Repository} from '@life-os/domain/repository';
import {createStore} from './data/storage';
import {translate} from './i18n';
import type {TextKey} from './i18n';
import {portableBackup,hydrateBackup} from './data/portable';
import {commitAndRefresh} from './operations';
type AppContext={profileId:string;importGuest:()=>Promise<number>;state:State;repo:Repository;ready:boolean;busy:boolean;error:string;dismiss:()=>void;reload:()=>Promise<void>;run:<T>(action:()=>Promise<T>)=>Promise<T>;t:(k:TextKey)=>string};
const Context=createContext<AppContext|null>(null);
export function AppProvider({children,profileId='life-os-v1'}:{children:React.ReactNode;profileId?:string}){
  const [store]=useState(()=>createStore(profileId));
  const [repo]=useState(()=>new Repository(store,()=>Crypto.randomUUID()));
  const [state,setState]=useState(initialState);const [ready,setReady]=useState(false);const [pending,setPending]=useState(0);const [error,setError]=useState('');
  const reload=useCallback(async()=>{try{setState(await repo.snapshot());setReady(true);setError('');}catch(e){setError('storage');throw e;}},[repo]);
  useEffect(()=>{store.transact(s=>[withCompactExamples(withRefreshExamples(withReferenceExamples(withMovieArtwork(withHealthExamples(withExamples(s,exampleImages)),filmImages),referenceImages,filmImages),exampleImages)),undefined]).then(reload).catch(()=>setError('storage'));},[reload,store]);
  const run=async<T,>(action:()=>Promise<T>)=>{setPending(x=>x+1);setError('');try{return await commitAndRefresh(action,reload,()=>setError('refresh'));}catch(e){setError(e instanceof Error&&e.message==='conflict'?'conflict':'error');throw e;}finally{setPending(x=>x-1);}};
  const importGuest=async()=>{if(profileId==='life-os-v1')return 0;const guest=new Repository(createStore('life-os-v1'));const backup=await portableBackup(await guest.snapshot());const hydrated=await hydrateBackup(backup,(await repo.snapshot()).items.map(i=>i.id));return repo.importBackup(hydrated);};
  return <Context.Provider value={{profileId,importGuest,state,repo,ready,busy:pending>0,error,dismiss:()=>setError(''),reload,run,t:k=>translate(state.settings.locale,k)}}>{children}</Context.Provider>;
}
export function useApp(){const ctx=useContext(Context);if(!ctx)throw new Error('AppProvider missing');return ctx;}
