import * as SQLite from 'expo-sqlite';
import {createSqlStore} from '@life-os/domain/sql-store';
import type {Store} from '@life-os/domain/repository';
export function createStore(name='life-os-v1'):Store {
  if(!/^[a-zA-Z0-9_-]{1,150}$/.test(name))throw new Error('invalid_profile');
  const opening=SQLite.openDatabaseAsync(name==='life-os-v1'?'life-os.db':name+'.db');
  return createSqlStore({
    initialize:async sql=>{const db=await opening;const version=await db.getFirstAsync<{user_version:number}>('PRAGMA user_version');if(version&&version.user_version>1)throw new Error('storage_version');await db.execAsync(sql);},
    transaction:async fn=>{const db=await opening;let result:Awaited<ReturnType<typeof fn>>;await db.withExclusiveTransactionAsync(async tx=>{result=await fn({all:sql=>tx.getAllAsync<{payload:string}>(sql),run:async(sql,args)=>{await tx.runAsync(sql,args);}});});return result!;}
  });
}
