import {initialState,validateState,copyState} from './index.ts';
import type {State} from './index.ts';
import type {Store} from './repository.ts';
export interface SqlTx {all(sql:string):Promise<{payload:string}[]>;run(sql:string,args:(string|number|null)[]):Promise<void>}
export interface SqlDriver {initialize(sql:string):Promise<void>;transaction<T>(fn:(tx:SqlTx)=>Promise<T>):Promise<T>}
export const schemaSql='CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS meta (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL); PRAGMA user_version = 1;';
export function createSqlStore(driver:SqlDriver):Store {
  let ready:Promise<void>|undefined;let queue:Promise<unknown>=Promise.resolve();
  return {transact<T>(fn:(s:State)=>[State,T]):Promise<T>{
    const run=async()=>{await (ready??=driver.initialize(schemaSql));return driver.transaction(async tx=>{
      const rows=await tx.all('SELECT payload FROM items');const metadata=await tx.all("SELECT payload FROM meta WHERE id = 'state'");
      const before=validateState({...initialState(),...(metadata.length?JSON.parse(metadata[0].payload):{}),items:rows.map(x=>JSON.parse(x.payload))});
      const [next,result]=fn(copyState(before));validateState(next);
      const ids=new Set(next.items.map(x=>x.id));for(const item of before.items)if(!ids.has(item.id))await tx.run('DELETE FROM items WHERE id = ?',[item.id]);
      const old=new Map(before.items.map(x=>[x.id,JSON.stringify(x)]));for(const item of next.items){const payload=JSON.stringify(item);if(old.get(item.id)!==payload)await tx.run('INSERT OR REPLACE INTO items (id, payload) VALUES (?, ?)',[item.id,payload]);}
      const {items:_,...info}=next;await tx.run("INSERT OR REPLACE INTO meta (id, payload) VALUES ('state', ?)",[JSON.stringify(info)]);return result;
    });};
    const result=queue.then(run);queue=result.catch(()=>{});return result;
  }};
}
