import {test} from 'node:test';import assert from 'node:assert/strict';
import {scanDemoRecords,removeDemoRecords} from '../apps/mobile/src/planner/demo-records.ts';

const T0='2026-11-01T10:00:00.000Z';
let n=0;
const rec=(type:string,section:string,title:string,extra:Record<string,any>={})=>({id:'id-'+(++n),ownerId:'local',type,section,title,description:'',status:'active',createdAt:T0,updatedAt:T0,attachments:[],notes:'',data:{},...extra}) as any;
const seedNotes=['WORK','Здоровье','Goals','Pre-pvt','Идеи','Анализы родителям','Webcam','PVT part 2','PVT part 1'].map((t,i)=>rec('note','work',t,{description:i===1?'Родинки':'Запишите мысли и планы…',pinned:i<3,data:{tab:'Работа',html:'<p>x</p>'}}));
const fresh={version:1,objects:seedNotes.map(o=>({...o,id:'fresh-'+o.id,createdAt:'2030-01-01T00:00:00.000Z',updatedAt:'2030-01-01T00:00:00.000Z'})),history:[],notificationSettings:{},dismissed:[]} as any;
const clone=(o:any,patch:any={})=>({...structuredClone(o),...patch});

test('unchanged first-launch notes are candidates; edited, archived, later or migrated ones are not', ()=>{
 const objects=seedNotes.map(o=>clone(o));
 objects[0]=clone(objects[0],{updatedAt:'2026-11-02T00:00:00.000Z'});           // WORK edited
 objects[1]=clone(objects[1],{description:'Родинки, УЗИ'});                       // «Здоровье» note text differs
 objects[2]=clone(objects[2],{archivedAt:'2026-11-03T00:00:00.000Z'});           // archived
 objects.push(rec('note','work','Идеи',{createdAt:'2026-11-05T00:00:00.000Z',updatedAt:'2026-11-05T00:00:00.000Z',description:'Запишите мысли и планы…',data:{tab:'Работа',html:'<p>x</p>'}})); // user's own later note with same title
 objects.push(clone(seedNotes[6],{id:'migrated-abc'}));
 objects.push(rec('checkup','health','Здоровье')); // unrelated record named like the category
 const scan=scanDemoRecords({version:1,objects,history:[],notificationSettings:{},dismissed:[]} as any,fresh);
 assert.equal(scan.batchTime,T0);
 assert.deepEqual(scan.candidates.map(o=>o.title).sort(),['Pre-pvt','PVT part 1','PVT part 2','Webcam','Анализы родителям','Идеи'].sort());
 const reasons=Object.fromEntries(scan.lookalikes.map(l=>[l.object.id,l.reason]));
 assert.equal(reasons[objects[0].id],'запись изменялась');
 assert.equal(reasons[objects[1].id],'содержимое отличается от примера');
 assert.equal(reasons[objects[2].id],'запись в архиве');
 assert.equal(reasons['migrated-abc'],'перенесено из ваших прежних данных');
 assert.ok(!scan.candidates.some(o=>o.type==='checkup'));
});

test('a record with its own purchase/completion history is not offered', ()=>{
 const objects=seedNotes.map(o=>clone(o));
 const scan=scanDemoRecords({version:1,objects,history:[{id:'h1',objectId:objects[5].id,action:'complete',at:T0}],notificationSettings:{},dismissed:[]} as any,fresh);
 assert.ok(!scan.candidates.some(o=>o.id===objects[5].id));
});

test('too few look-alikes: no batch is assumed and nothing is offered', ()=>{
 const objects=seedNotes.slice(0,3).map(o=>clone(o));
 const scan=scanDemoRecords({version:1,objects,history:[],notificationSettings:{},dismissed:[]} as any,fresh);
 assert.equal(scan.candidates.length,0);
});

test('removal touches only the chosen ids and their first-launch history', ()=>{
 const objects=seedNotes.map(o=>clone(o));
 const state={version:1,objects,history:[{id:'initial-'+objects[3].id,objectId:objects[3].id},{id:'h2',objectId:objects[4].id}],notificationSettings:{a:1},dismissed:[]} as any;
 const next=removeDemoRecords(state,new Set([objects[3].id]));
 assert.equal(next.objects.length,objects.length-1);
 assert.deepEqual(next.history.map((h:any)=>h.id),['h2']);
 assert.deepEqual(next.notificationSettings,{a:1});
});
