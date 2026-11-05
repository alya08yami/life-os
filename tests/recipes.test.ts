import {test} from 'node:test';import assert from 'node:assert/strict';import {indexedDB} from 'fake-indexeddb';
import {makeItem} from '../packages/domain/src/index.ts';
import {recipeAmounts,ingredientLabel} from '../packages/domain/src/recipes.ts';
import {Repository} from '../packages/domain/src/repository.ts';import {createWebStore} from '../apps/mobile/src/data/storage.web.ts';
const details={ingredients:['Carrot','Salt'],steps:['Cook'],servings:2,ingredientAmounts:[{ingredient:'Carrot',quantity:100,unit:'g'}],cookMinutes:25,notes:'Family recipe'};
test('recipe quantities scale only explicit amounts and never mutate the base recipe',()=>{
  const amounts=recipeAmounts(details,3);assert.deepEqual(amounts,[{ingredient:'Carrot',quantity:150,unit:'g'}]);
  assert.equal(ingredientLabel('Carrot',amounts[0]),'Carrot — 150 g');assert.equal(ingredientLabel('Salt'),'Salt');
  assert.equal(details.ingredientAmounts[0].quantity,100);
  assert.deepEqual(recipeAmounts({ingredients:['Salt'],steps:[]}),[]);
  assert.throws(()=>recipeAmounts({ingredients:[],steps:[]},4),/invalid_servings/);
  for(const n of [0,1.5,1001,NaN])assert.throws(()=>recipeAmounts(details,n),/invalid_servings/);
  assert.notEqual(ingredientLabel('Spice',{ingredient:'Spice',quantity:0.0000001}),'Spice — 0');
});
test('recipe validation rejects invented, duplicate and invalid amounts without breaking legacy text',()=>{
  const base={text:'Soup',kind:'recipe' as const};
  assert.equal(makeItem({...base,details}).kind,'recipe');
  for(const ingredientAmounts of [[{ingredient:'Missing',quantity:1}],[{ingredient:'Salt',quantity:0}],[{ingredient:'Salt',quantity:NaN}],[{ingredient:'Salt',quantity:1},{ingredient:'Salt',quantity:2}]])assert.throws(()=>makeItem({...base,details:{...details,ingredientAmounts}}),/invalid_ingredient/);
  for(const cookMinutes of [0,-1,1.5])assert.throws(()=>makeItem({...base,details:{...details,cookMinutes}}),/invalid_recipe/);
  const legacy=makeItem({...base,details:{ingredients:['200 g flour','Salt to taste'],steps:['Mix']}});
  assert.deepEqual(legacy.details,{ingredients:['200 g flour','Salt to taste'],steps:['Mix']});
});
test('recipe metadata persists through edit and reopening; shopping uses quantities and stable source dedupe',async()=>{
  const name='recipes-'+crypto.randomUUID(),repo=new Repository(createWebStore(name,indexedDB));
  const recipe=await repo.add({text:'Soup',kind:'recipe',details},true);
  await repo.ingredientsToShopping(recipe.id,['Carrot','Salt'],{servings:4});
  await repo.ingredientsToShopping(recipe.id,['Carrot'],{servings:6});
  let rows=(await repo.snapshot()).items.filter(x=>x.kind==='shopping_item');assert.equal(rows.length,2);assert.ok(rows.some(x=>x.body==='Carrot — 200 g'));assert.ok(rows.some(x=>x.body==='Salt'));
  const carrot=rows.find(x=>x.sourceIngredient==='Carrot')!;
  const edited=await repo.edit(carrot.id,carrot.version,{text:'Custom shopping title',kind:'shopping_item'});assert.equal(edited.sourceIngredient,'Carrot');
  await repo.ingredientsToShopping(recipe.id,['Carrot']);assert.equal((await repo.snapshot()).items.filter(x=>x.kind==='shopping_item').length,2);
  await repo.complete(carrot.id,true);await repo.ingredientsToShopping(recipe.id,['Carrot'],{amounts:[{ingredient:'Carrot',quantity:75,unit:'g'}]});
  const restarted=new Repository(createWebStore(name,indexedDB));const saved=(await restarted.snapshot()).items.find(x=>x.id===recipe.id)!;assert.deepEqual(saved.details,details);
  assert.ok((await restarted.snapshot()).items.some(x=>x.body==='Carrot — 75 g'));
  await assert.rejects(repo.ingredientsToShopping(recipe.id,['Salt'],{amounts:[{ingredient:'Carrot',quantity:5}]}),/invalid_ingredient/);
  await repo.setLifecycle(recipe.id,'trashed');await assert.rejects(repo.ingredientsToShopping(recipe.id,['Salt']),/invalid_recipe/);
});
