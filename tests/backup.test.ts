import {test} from 'node:test';import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {Repository} from '../packages/domain/src/repository.ts';
import {initialState,validateState} from '../packages/domain/src/index.ts';
import type {State} from '../packages/domain/src/index.ts';
import type {RecordObject} from '../packages/domain/src/planner.ts';
import {createBackup,serializeBackup,parseBackup,migrateState,backupFileName,BackupError,BACKUP_FORMAT} from '../packages/domain/src/backup.ts';
import {createWebStore} from '../apps/mobile/src/data/storage.web.ts';

// Synthetic test data only, in throw-away databases with random names. No real user storage is opened.
const at='2026-11-05T10:00:00.000Z';
const png='data:image/png;base64,'+Buffer.from(Array.from({length:2048},(_,i)=>i%251)).toString('base64');
const pdf='data:application/pdf;base64,'+Buffer.from('%PDF-1.4 test file').toString('base64');
const rec=(id:string,section:RecordObject['section'],type:string,title:string,extra:Partial<RecordObject>={}):RecordObject=>({id,ownerId:'local',type,section,title,description:'',notes:'',status:'active',createdAt:at,updatedAt:at,attachments:[],data:{},...extra});
function sample():State{
 const objects:RecordObject[]=[
  rec('m1','movies','movie','Интерстеллар',{notes:'Пересмотреть',favorite:true,data:{rating:9,watched:true,catalogId:'movie:157336',posterUrl:'https://image.tmdb.org/t/p/w500/abc.jpg',catalogSource:'TMDB'}}),
  rec('s1','shopping','product','Кроссовки',{attachments:[{id:'f1',name:'photo.png',mime:'image/png',size:2048,uri:png}],data:{list:'Обувь',price:3200}}),
  rec('r1','relationships','relationship','Личное',{notes:'приватная заметка',data:{category:'Секс'}}),
  rec('h1','home','homeTask','Полить цветы',{status:'completed',completedAt:at}),
  rec('w1','work','note','Документ',{attachments:[{id:'f2',name:'doc.pdf',mime:'application/pdf',size:18,uri:pdf}]}),
  rec('g1','regular','regular','Кофе',{purchasedAt:at,data:{durationPerUnit:14,purchasedQuantity:1}}),
 ];
 return validateState({...initialState(),settings:{locale:'ru',theme:'soft'},appliedTemplates:['examples.v1'],uiPreferences:{'home.order':'movies,shopping'},
  planner:{version:1,objects,history:[{id:'hist1',objectId:'g1',action:'purchase',at,quantity:1} as any],notificationSettings:{'visible.finance':false},dismissed:['notice-1']}});
}
const db=()=>'backup-test-'+crypto.randomUUID();

test('full cycle: export → restore into a separate store → identical records, photos and files',async()=>{
 const source=new Repository(createWebStore(db(),indexedDB));
 await source.replaceAll(sample());
 const original=await source.snapshot();
 const text=serializeBackup(createBackup(original,at,'LIFE OS 1.0.0'));
 const parsed=parseBackup(text);
 assert.equal(parsed.legacy,false);assert.equal(parsed.createdAt,at);
 assert.equal(parsed.summary.records,6);assert.equal(parsed.summary.files,2);assert.equal(parsed.summary.externalImages,0);
 const target=new Repository(createWebStore(db(),indexedDB));
 await target.replaceAll(parsed.state);
 const restored=await target.snapshot();
 assert.deepEqual(restored,original);
 const photo=restored.planner!.objects.find(o=>o.id==='s1')!.attachments[0];
 assert.equal(photo.uri,png);assert.equal(Buffer.from(photo.uri.split(',')[1],'base64').length,2048);
 assert.equal(restored.planner!.objects.find(o=>o.id==='w1')!.attachments[0].uri,pdf);
 assert.equal(restored.settings.theme,'soft');assert.deepEqual(restored.planner!.dismissed,['notice-1']);
 assert.equal(restored.planner!.history[0].objectId,'g1');
 const movie=restored.planner!.objects.find(o=>o.id==='m1')!;assert.equal(movie.data.rating,9);assert.equal(movie.notes,'Пересмотреть');
});

test('restore replaces current data completely and survives reopening the database',async()=>{
 const name=db();const repo=new Repository(createWebStore(name,indexedDB));
 await repo.replaceAll({...sample(),planner:{...sample().planner!,objects:[rec('x1','home','homeTask','Будет заменено')],history:[]}});
 await repo.replaceAll(sample());
 const reopened=await new Repository(createWebStore(name,indexedDB)).snapshot();
 assert.deepEqual(reopened.planner!.objects.map(o=>o.id).sort(),['g1','h1','m1','r1','s1','w1']);
});

test('damaged or foreign files are rejected and leave stored data untouched',async()=>{
 const name=db();const repo=new Repository(createWebStore(name,indexedDB));await repo.replaceAll(sample());const before=await repo.snapshot();
 const good=serializeBackup(createBackup(before,at,'LIFE OS 1.0.0'));
 const cases:[string,string][]=[
  [good.slice(0,good.length/2),'not_json'],
  ['{"hello":"world"}','not_backup'],
  ['[1,2,3]','not_backup'],
  [JSON.stringify({format:BACKUP_FORMAT,formatVersion:99,state:before}),'newer'],
  [JSON.stringify({format:BACKUP_FORMAT,formatVersion:1,state:{...before,schemaVersion:2}}),'newer'],
  [JSON.stringify({format:BACKUP_FORMAT,formatVersion:1,state:{...before,planner:{...before.planner,objects:[{id:'bad'}]}}}),'invalid'],
  [JSON.stringify({format:BACKUP_FORMAT,formatVersion:1}),'invalid'],
 ];
 for(const [text,code] of cases)assert.throws(()=>parseBackup(text),(e:unknown)=>e instanceof BackupError&&e.code===code,code);
 // A store-level failure aborts the whole transaction: nothing is half-written.
 await assert.rejects(repo.replaceAll({...before,planner:{...before.planner!,objects:[{id:'bad'} as any]}}));
 assert.deepEqual(await new Repository(createWebStore(name,indexedDB)).snapshot(),before);
});

test('backups from earlier versions (bare state JSON) are still accepted',()=>{
 const legacy=JSON.stringify(sample());
 const parsed=parseBackup(legacy);assert.equal(parsed.legacy,true);assert.equal(parsed.summary.records,6);
});

test('backup carries no secrets and only links for TMDB posters',()=>{
 const text=serializeBackup(createBackup(sample(),at,'LIFE OS 1.0.0'));
 assert.doesNotMatch(text,/eyJhbGciOi|api_key|Authorization|TMDB_READ_ACCESS_TOKEN/);
 const parsed=parseBackup(text);assert.equal(parsed.state.planner!.objects.find(o=>o.id==='m1')!.data.posterUrl,'https://image.tmdb.org/t/p/w500/abc.jpg');
});

test('migration hook keeps current data as is and refuses data from a newer version',()=>{
 const s=sample();assert.equal(migrateState(s),s);
 assert.throws(()=>migrateState({...s,schemaVersion:2}),(e:unknown)=>e instanceof BackupError&&e.code==='newer');
 assert.equal(backupFileName(new Date(2026,10,5)),'life-os-backup-2026-11-05.json');
});

test('a store with data from a newer version is not overwritten',async()=>{
 const name=db();const repo=new Repository(createWebStore(name,indexedDB));await repo.replaceAll(sample());
 // Simulate a future app having written schemaVersion 2.
 await new Promise<void>((resolve,reject)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>{const tx=r.result.transaction('meta','readwrite');const m=tx.objectStore('meta');const g=m.get('state');g.onsuccess=()=>m.put({...g.result,schemaVersion:2},'state');tx.oncomplete=()=>{r.result.close();resolve();};tx.onerror=()=>reject(tx.error);};r.onerror=()=>reject(r.error);});
 const fresh=new Repository(createWebStore(name,indexedDB));
 await assert.rejects(fresh.plannerUpdate(()=>({version:1,objects:[],history:[],notificationSettings:{},dismissed:[]})));
 const raw=await new Promise<any>((resolve)=>{const r=indexedDB.open(name,1);r.onsuccess=()=>{const g=r.result.transaction('items').objectStore('items').getAll();g.onsuccess=()=>{r.result.close();resolve(g.result);};};});
 assert.equal(raw.length,0); // planner records live in meta; items table untouched
});
