import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createSqlStore} from '../packages/domain/src/sql-store.ts';
import {Repository} from '../packages/domain/src/repository.ts';
test('SQLite adapter persists rows and rolls back failed mutations',async()=>{
  const db=new DatabaseSync(':memory:');
  const store=createSqlStore({
    initialize:async sql=>{db.exec(sql);},
    transaction:async fn=>{db.exec('BEGIN IMMEDIATE');try{const value=await fn({all:async(sql)=>db.prepare(sql).all() as {payload:string}[],run:async(sql,args)=>{db.prepare(sql).run(...args);}});db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}}
  });
  const repo=new Repository(store);const item=await repo.add({text:'SQLite note'});
  await assert.rejects(store.transact(s=>{s.items=[];throw new Error('abort');}),/abort/);
  assert.equal((await repo.snapshot()).items[0].id,item.id);
  assert.equal(db.prepare('SELECT count(*) AS n FROM items').get()?.n,1);
  db.close();
});
