import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeItem} from '../packages/domain/src/index.ts';
import {pricePresentation,selectProducts,selectComparison,offerPriceChange} from '../packages/domain/src/catalog.ts';
const now=Date.parse('2026-11-02T12:00:00Z');
const quote={id:'a',store:'Store',priceMinor:10000,currency:'UAH',variant:'50 ml',observedAt:'2026-11-01T12:00:00Z',sourceUrl:'https://example.com/a'};

test('known shipping ranks delivered totals, unavailable and mismatched offers cannot win',()=>{
  const p=pricePresentation({variant:'50 ml',currency:'UAH',offers:[{...quote,shippingMinor:5000},{...quote,id:'b',priceMinor:12000,shippingMinor:0},{...quote,id:'c',priceMinor:1,availability:'out_of_stock'}]},now);
  assert.equal(p?.offerId,'b');assert.equal(p?.totalMinor,12000);
  const unknown=pricePresentation({variant:'50 ml',offers:[{...quote,shippingMinor:0},{...quote,id:'b',priceMinor:9000}]},now);
  assert.equal(unknown?.totalMinor,undefined);assert.equal(unknown?.offerId,'b');
});

test('price history reports a rise separately and price-drop sorting uses comparable offer history',()=>{
  const rise={variant:'50 ml',offers:[{...quote,previousPriceMinor:9000}]};
  assert.equal(offerPriceChange(rise,now),'up');assert.equal(pricePresentation(rise,now)?.dropped,false);
  const a=makeItem({text:'No history',kind:'product',details:{priceMinor:1,currency:'UAH'}});
  const b=makeItem({text:'Lower price',kind:'product',details:{variant:'50 ml',offers:[{...quote,previousPriceMinor:15000}]}});
  assert.deepEqual(selectProducts([a,b],{filter:'all',sort:'price_dropped',currency:'UAH'},now).map(x=>x.title),['Lower price','No history']);
});

test('comparison requires two or three distinct active saved products; home category roundtrips',()=>{
  const a={...makeItem({id:'a',text:'Lamp',kind:'product',details:{productCategory:'home'}}),inboxStatus:'confirmed' as const};
  const b={...makeItem({id:'b',text:'Chair',kind:'product'}),inboxStatus:'confirmed' as const};
  assert.deepEqual(selectComparison([a,b],['b','a']).map(i=>i.id),['b','a']);
  assert.equal(selectProducts([a,b],{filter:'home',sort:'title',currency:'UAH'}).length,1);
  assert.throws(()=>selectComparison([a,b],['a']),/comparison_count/);assert.throws(()=>selectComparison([a,b],['a','a']),/comparison_count/);
  assert.throws(()=>selectComparison([a,{...b,lifecycle:'trashed'}],['a','b']),/comparison_unavailable/);
  assert.throws(()=>makeItem({text:'Invalid',kind:'product',details:{offers:[{...quote,shippingMinor:-1}]}}),/invalid_offers/);
});

test('catalog sorting uses delivered totals only when all ranked prices have known shipping',()=>{
  const a=makeItem({text:'A',kind:'product',details:{variant:'50 ml',offers:[{...quote,priceMinor:10000,shippingMinor:90000}]}});
  const b=makeItem({text:'B',kind:'product',details:{variant:'50 ml',offers:[{...quote,priceMinor:20000,shippingMinor:0}]}});
  const opts={filter:'all' as const,sort:'price_asc' as const,currency:'UAH'};
  assert.deepEqual(selectProducts([a,b],opts,now).map(x=>x.title),['B','A']);
  const c=makeItem({text:'C',kind:'product',details:{priceMinor:15000,currency:'UAH'}});
  assert.deepEqual(selectProducts([a,b,c],opts,now).map(x=>x.title),['A','C','B']);
});
