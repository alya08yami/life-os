import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexedDB } from 'fake-indexeddb';
import { Repository } from '../packages/domain/src/repository.ts';
import { createWebStore } from '../apps/mobile/src/data/storage.web.ts';

const setup=()=>{const name='test-'+crypto.randomUUID();return {name,repo:new Repository(createWebStore(name,indexedDB))};};
test('writes survive a new repository and confirmation is idempotent',async()=>{
  const {name,repo}=setup();const item=await repo.add({text:'Нужно купить корм'});
  await repo.confirm(item.id,1,'shopping_item','shopping');
  await repo.confirm(item.id,1,'shopping_item','shopping');
  const next=new Repository(createWebStore(name,indexedDB));
  const rows=(await next.snapshot()).items;
  assert.equal(rows.length,1);assert.equal(rows[0].inboxStatus,'confirmed');assert.equal(rows[0].kind,'shopping_item');
});
test('concurrent additions are not lost and stale edits are rejected',async()=>{
  const {repo}=setup();await Promise.all(Array.from({length:8},(_,i)=>repo.add({text:'Note '+i})));
  const item=(await repo.snapshot()).items[0];
  await repo.edit(item.id,item.version,{text:'Changed'});
  await assert.rejects(repo.edit(item.id,item.version,{text:'Overwritten'}),/conflict/);
  assert.equal((await repo.snapshot()).items.length,8);
});
test('template is atomic and repeat application does not duplicate tasks',async()=>{
  const {repo}=setup();await repo.applyTemplate('quick','ru');await repo.applyTemplate('quick','ru');
  const rows=(await repo.snapshot()).items;assert.equal(rows.length,3);assert.ok(rows.every(x=>x.kind==='task'&&x.category==='home'&&x.inboxStatus==='confirmed'));
});
test('image is durable, metadata is searchable, remove and completion persist',async()=>{
  const {name,repo}=setup();const item=await repo.add({text:'Крем',attachments:[{id:'a',uri:'data:image/png;base64,AA==',mime:'image/png',size:1}]});
  const next=new Repository(createWebStore(name,indexedDB));assert.equal((await next.snapshot()).items[0].attachments[0].uri,'data:image/png;base64,AA==');
  assert.equal((await next.search('КРЕМ')).length,1);
  await next.confirm(item.id,1,'shopping_item','shopping');await next.complete(item.id,true);
  assert.equal((await next.snapshot()).items[0].completed,true);
  await next.remove(item.id);assert.equal((await next.search('крем')).length,0);
});
test('aborted mutations preserve data and settings survive restart',async()=>{
  const {name,repo}=setup();await repo.add({text:'Keep me'});
  await assert.rejects(repo.add({text:''}),/empty/);
  await assert.rejects(repo.configure({locale:'invalid',theme:'dark'} as never),/storage_invalid/);
  await repo.configure({locale:'uk',theme:'dark'});
  const s=await new Repository(createWebStore(name,indexedDB)).snapshot();assert.equal(s.items.length,1);assert.deepEqual(s.settings,{locale:'uk',theme:'dark'});
});
test('concurrent partial settings updates preserve both independent choices',async()=>{
  const {repo}=setup();await Promise.all([repo.configure({locale:'uk'}),repo.configure({theme:'dark'})]);
  assert.deepEqual((await repo.snapshot()).settings,{locale:'uk',theme:'dark'});
});
