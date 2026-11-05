import {test} from 'node:test';import assert from 'node:assert/strict';
import {pricePresentation,selectProducts,formatPrice} from '../packages/domain/src/catalog.ts';
import {makeItem} from '../packages/domain/src/index.ts';
import {Repository} from '../packages/domain/src/repository.ts';
import {createWebStore} from '../apps/mobile/src/data/storage.web.ts';
import {indexedDB} from 'fake-indexeddb';
const now=Date.parse('2026-11-02T12:00:00Z');
const quote={id:'q1',store:'Example',priceMinor:499000,currency:'UAH',variant:'50ml',observedAt:'2026-11-01T12:00:00Z',sourceUrl:'https://example.com/item',previousPriceMinor:529000};
test('only comparable current offers produce a found minimum and price drop',()=>{
  const details={variant:'50ml',currency:'UAH',offers:[quote,{...quote,id:'q2',priceMinor:100,variant:'10ml'},{...quote,id:'q3',priceMinor:50,currency:'USD'}]};
  assert.deepEqual(pricePresentation(details,now),{source:'offer',amountMinor:499000,currency:'UAH',dropped:true,offerId:'q1'});
});
test('manual price, stale and unsafe offers never claim a current deal',()=>{
  assert.deepEqual(pricePresentation({priceMinor:1250,currency:'UAH'},now),{source:'manual',amountMinor:1250,currency:'UAH',dropped:false});
  assert.equal(pricePresentation({variant:'50ml',currency:'UAH',offers:[{...quote,observedAt:'2025-01-01T00:00:00Z'}]},now),undefined);
  assert.equal(pricePresentation({variant:'50ml',currency:'UAH',offers:[{...quote,sourceUrl:'javascript:alert(1)'}]},now),undefined);
});
test('catalog price formatting preserves actual fractional prices',()=>{
  assert.match(formatPrice(1250,'UAH','en'),/12\.50/);assert.match(formatPrice(49,'UAH','en'),/0\.49/);
});
test('sorting and filters keep missing or different-currency prices out of false rankings',()=>{
  const a=makeItem({text:'A cream',kind:'product',details:{productCategory:'beauty',priceMinor:2500,currency:'UAH'}});
  const b=makeItem({text:'B bag',kind:'product',details:{productCategory:'clothing',priceMinor:1250,currency:'UAH'}});
  const c=makeItem({text:'C lamp',kind:'product'});
  assert.deepEqual(selectProducts([a,b,c],{filter:'all',sort:'price_asc',currency:'UAH'},now).map(x=>x.title),['B bag','A cream','C lamp']);
  assert.deepEqual(selectProducts([a,b,c],{filter:'beauty',sort:'title',currency:'UAH'},now).map(x=>x.title),['A cream']);
});
test('favorite and catalog preferences persist without seeding demo products',async()=>{
  const name='catalog-'+crypto.randomUUID();const repo=new Repository(createWebStore(name,indexedDB));
  assert.equal((await repo.snapshot()).items.length,0);
  const item=await repo.add({text:'My cream',kind:'product',details:{productCategory:'beauty'}});
  await repo.favorite(item.id,true);await repo.favorite(item.id,true);
  await repo.preference('wishlist.filter','beauty');
  const next=await new Repository(createWebStore(name,indexedDB)).snapshot();
  assert.equal(next.items.length,1);assert.equal(next.items[0].favorite,true);assert.equal(next.uiPreferences?.['wishlist.filter'],'beauty');
});
test('recipe ingredients become linked shopping items once and only after selection',async()=>{
  const repo=new Repository(createWebStore('recipe-'+crypto.randomUUID(),indexedDB));
  const recipe=await repo.add({text:'Soup',kind:'recipe',details:{ingredients:['Water','Carrot','Salt'],steps:['Boil']}},true);
  await repo.ingredientsToShopping(recipe.id,['Carrot','Salt']);
  await repo.ingredientsToShopping(recipe.id,['Carrot','Salt']);
  const rows=(await repo.snapshot()).items.filter(x=>x.kind==='shopping_item');
  assert.equal(rows.length,2);assert.deepEqual(rows.map(x=>x.title).sort(),['Carrot','Salt']);assert.ok(rows.every(x=>x.sourceItemId===recipe.id));
  await assert.rejects(repo.ingredientsToShopping(recipe.id,['Invented ingredient']),/invalid_ingredient/);
});
