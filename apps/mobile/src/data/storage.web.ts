import {initialState,validateState,copyState} from '@life-os/domain';
import {migrateState} from '@life-os/domain/backup';
import type {State} from '@life-os/domain';
import type {Store} from '@life-os/domain/repository';
/** Quota errors differ by browser: QuotaExceededError (Chrome, Safari), NS_ERROR_DOM_QUOTA_REACHED (Firefox). */
const isQuota=(e:unknown)=>!!e&&typeof e==='object'&&/quota/i.test(String((e as {name?:string}).name??''));
let persistenceRequested=false;
/** Asks the browser not to evict LIFE OS data under storage pressure. Best effort: the browser may decline. */
function requestPersistence(){if(persistenceRequested)return;persistenceRequested=true;try{const s=(globalThis.navigator as Navigator|undefined)?.storage;if(s?.persisted&&s.persist)s.persisted().then(p=>p||s.persist()).catch(()=>{});}catch{/* not supported */}}
export function createWebStore(name='life-os-v1',factory:IDBFactory=globalThis.indexedDB):Store {
  let opening:Promise<IDBDatabase>|undefined;
  const open=()=>opening??=new Promise((resolve,reject)=>{
    if(!factory){reject(new Error('storage_unavailable'));return;}
    const req=factory.open(name,1);
    req.onupgradeneeded=()=>{req.result.createObjectStore('items',{keyPath:'id'});req.result.createObjectStore('meta');};
    req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();opening=undefined;};requestPersistence();resolve(req.result);};
    req.onerror=()=>{opening=undefined;reject(req.error);};req.onblocked=()=>reject(new Error('storage_blocked'));
  });
  return {async transact<T>(fn:(s:State)=>[State,T]):Promise<T>{const db=await open();return new Promise<T>((resolve,reject)=>{
    const tx=db.transaction(['items','meta'],'readwrite');const items=tx.objectStore('items');const meta=tx.objectStore('meta');
    const rows=items.getAll();const info=meta.get('state');let pending=2;let result:T;let failure:unknown;
    const loaded=()=>{if(--pending)return;try{
      const before=validateState(migrateState({...initialState(),...info.result,items:rows.result}));
      const [next,value]=fn(copyState(before));validateState(next);result=value;
      const nextIds=new Set(next.items.map(x=>x.id));for(const item of before.items)if(!nextIds.has(item.id))items.delete(item.id);
      const old=new Map(before.items.map(x=>[x.id,JSON.stringify(x)]));for(const item of next.items)if(old.get(item.id)!==JSON.stringify(item))items.put(item);
      const {items:_,...metadata}=next;meta.put(metadata,'state');
    }catch(e){failure=e;tx.abort();}};
    rows.onsuccess=loaded;info.onsuccess=loaded;tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(isQuota(tx.error)||isQuota(failure)?new Error('storage_full'):failure??tx.error??new Error('storage_aborted'));tx.onerror=()=>{failure??=tx.error;};
  });}};
}
export const createStore=createWebStore;
