import {test} from 'node:test';import assert from 'node:assert/strict';
import {arrangeHome,reorderHome} from '../packages/domain/src/home-preferences.ts';
import {selectTasks} from '../packages/domain/src/tasks.ts';
import {makeItem} from '../packages/domain/src/index.ts';
const sections=[{id:'wishlist'},{id:'home'},{id:'food'},{id:'travel'}];
test('home order ignores unknown/duplicate ids and preserves newly added sections',()=>{
  const prefs={'home.order':JSON.stringify(['travel','unknown','travel','wishlist'])};
  assert.deepEqual(arrangeHome(sections,prefs).map(x=>x.id),['travel','wishlist','home','food']);
  assert.deepEqual(arrangeHome(sections,{'home.order':'broken'}).map(x=>x.id),['wishlist','home','food','travel']);
});
test('hidden sections stay accessible to customization and favorites are pinned without deleting',()=>{
  const prefs={'category.home':'hidden','category.favorite.travel':'true'};
  assert.deepEqual(arrangeHome(sections,prefs).map(x=>x.id),['travel','wishlist','food']);
  assert.equal(arrangeHome(sections,prefs,{includeHidden:true,favoritesFirst:false}).length,4);
  assert.deepEqual(reorderHome(['wishlist','home','food'],'food','up'),['wishlist','food','home']);
  assert.deepEqual(reorderHome(['wishlist','home'],'wishlist','up'),['wishlist','home']);
});
test('task views show explicit tasks/purchases, retain completed history and respect calendar dates',()=>{
  const task=(text:string,dueDate?:string,completed=false)=>({...makeItem({text,kind:'task',details:{priority:'normal',...(dueDate?{dueDate}:{})}}),inboxStatus:'confirmed' as const,completed});
  const rows=[task('Overdue','2026-10-30'),task('Today','2026-11-02'),task('Soon','2026-11-05'),task('Later','2026-12-01'),task('Undated'),task('Done','2026-11-02',true),{...makeItem({text:'Film',kind:'movie'}),inboxStatus:'confirmed' as const}];
  assert.deepEqual(selectTasks(rows,'today','2026-11-02').map(x=>x.title),['Overdue','Today']);
  assert.deepEqual(selectTasks(rows,'week','2026-11-02').map(x=>x.title),['Overdue','Today','Soon']);
  assert.deepEqual(selectTasks(rows,'later','2026-11-02').map(x=>x.title),['Later','Undated']);
  assert.deepEqual(selectTasks(rows,'completed','2026-11-02').map(x=>x.title),['Done']);
});
