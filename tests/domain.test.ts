import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, makeItem, safeUrl } from '../packages/domain/src/index.ts';

test('purchase rules propose without executing and support three languages', () => {
  for (const text of ['Нужно купить корм коту', 'Треба купити корм коту', 'Buy cat food']) {
    assert.deepEqual(classify(text), { kind: 'shopping_item', category: 'shopping', source: 'rule' });
    assert.equal(makeItem({text}).inboxStatus, 'unprocessed');
  }
});
test('uncertain text has no invented classification', () => {
  assert.equal(classify('Интересная мысль о будущем'), null);
  assert.equal(classify('Напомни купить корм'), null);
});
test('empty and oversized input are rejected, links use only http protocols', () => {
  assert.throws(() => makeItem({text:'   '}), /empty/);
  assert.throws(() => makeItem({text:'x'.repeat(20001)}), /long/);
  assert.equal(safeUrl('javascript:alert(1)'), undefined);
  assert.equal(safeUrl('data:text/html,hi'), undefined);
  assert.equal(safeUrl('https://example.com/recipe'), 'https://example.com/recipe');
});
test('movie recipe and product carry typed manual metadata without invented fields', () => {
  const movie = makeItem({text:'Arrival',kind:'movie',details:{year:2016,watchStatus:'want'}});
  assert.equal(movie.kind, 'movie');
  assert.deepEqual(movie.details, {year:2016,watchStatus:'want'});
  const recipe = makeItem({text:'Soup',kind:'recipe',details:{ingredients:['Water'],steps:['Boil']}});
  assert.deepEqual(recipe.details, {ingredients:['Water'],steps:['Boil']});
  assert.throws(() => makeItem({text:'Cream',kind:'product',details:{priceMinor:-1,currency:'USD'}}), /price/);
});
