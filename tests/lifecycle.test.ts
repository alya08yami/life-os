import {test} from 'node:test';import assert from 'node:assert/strict';import {indexedDB} from 'fake-indexeddb';
import {Repository} from '../packages/domain/src/repository.ts';import {createWebStore} from '../apps/mobile/src/data/storage.web.ts';
import {getLifecycle,isActive,isSearchable} from '../packages/domain/src/lifecycle.ts';
const setup=()=>{const name='lifecycle-'+crypto.randomUUID();return {name,repo:new Repository(createWebStore(name,indexedDB))};};
test('old v1 items default to active and hide/restore never delete content or attachments',async()=>{
  const {name,repo}=setup();const item=await repo.add({text:'Original',attachments:[{id:'image',uri:'data:image/png;base64,AA==',mime:'image/png',size:1}]},true);
  assert.equal(getLifecycle(item),'active');
  await repo.setLifecycle(item.id,'hidden');const next=new Repository(createWebStore(name,indexedDB));const hidden=(await next.snapshot()).items[0];
  assert.equal(isActive(hidden),false);assert.equal(isSearchable(hidden),true);assert.equal(hidden.attachments[0].uri,'data:image/png;base64,AA==');
  await next.setLifecycle(item.id,'active');assert.equal((await next.snapshot()).items[0].body,'Original');
});
test('archive and trash differ; edit preserves archive and trash blocks writes until restored',async()=>{
  const {repo}=setup();const item=await repo.add({text:'Record'},true);const archived=await repo.setLifecycle(item.id,'archived');
  const edited=await repo.edit(item.id,archived.version,{text:'Changed'});assert.equal(getLifecycle(edited),'archived');
  await repo.setLifecycle(item.id,'trashed');assert.equal((await repo.search('Changed')).length,0);
  const trashed=(await repo.snapshot()).items[0];assert.equal(isSearchable(trashed),false);
  await assert.rejects(repo.edit(item.id,trashed.version,{text:'Lost change'}),/item_trashed/);
  await repo.setLifecycle(item.id,'active');assert.equal((await repo.search('Changed')).length,1);
});
test('only explicit purge removes a trashed parent and never cascades to independent shopping',async()=>{
  const {repo}=setup();const recipe=await repo.add({text:'Recipe',kind:'recipe',details:{ingredients:['Carrot'],steps:['Cook']}},true);
  await repo.ingredientsToShopping(recipe.id,['Carrot']);await assert.rejects(repo.purge(recipe.id),/trash_required/);
  await repo.setLifecycle(recipe.id,'trashed');assert.equal((await repo.snapshot()).items.length,2);
  const removed=await repo.purge(recipe.id);assert.equal(removed?.id,recipe.id);
  const rows=(await repo.snapshot()).items;assert.equal(rows.length,1);assert.equal(rows[0].body,'Carrot');assert.equal(rows[0].sourceItemId,recipe.id);
});

test('legacy remove now means recoverable trash and category changes preserve product data',async()=>{
  const {repo}=setup();const product=await repo.add({text:'Lamp',kind:'product',details:{brand:'Known',variant:'Large',productCategory:'other',priceMinor:1250,currency:'UAH'}},true);
  await repo.categorize(product.id,'home');await repo.remove(product.id);
  const trashed=(await repo.snapshot()).items[0];assert.equal(getLifecycle(trashed),'trashed');
  await repo.setLifecycle(product.id,'active');const restored=(await repo.snapshot()).items[0];
  assert.equal(restored.kind,'product');if(restored.kind==='product'){assert.equal(restored.details.productCategory,'home');assert.equal(restored.details.brand,'Known');assert.equal(restored.details.priceMinor,1250);}
});
