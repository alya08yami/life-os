import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addDays,calendarDay,calendarDefaults,cycleForecast,periodHistory,upgradeDefaultShiftSchedule,monthCells,reminderPlan,reconcileReminders,removeCycleDay,shiftIndex,shiftColors,validDay,type CalendarEvent} from '../packages/domain/src/shift-calendar.ts';

const audit={id:'record',ownerId:'test',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
const event:CalendarEvent={...audit,title:'Ортодонт',date:'2026-10-06',time:'14:00',reminderEnabled:true,reminderOffsetMinutes:30,soundId:'soft',vibrationEnabled:true,notificationId:'shift-event:record'};
const fixture=()=>({...calendarDefaults('test','Europe/Kyiv'),events:[event],cycles:[{...audit,startDate:'2026-10-04',endDate:'2026-10-08'}],migraines:[{...audit,date:event.date}],personal:[{...audit,date:event.date}]});

test('four day shift repeats, including a non-first anchor',()=>{
 const {schedule}=fixture();
 assert.deepEqual(Array.from({length:8},(_,i)=>shiftIndex(schedule,addDays(schedule.anchorDate,i-1))),[0,1,2,3,0,1,2,3]);
 assert.equal(shiftIndex({...schedule,anchorShiftType:'DAY_OFF'},'2026-11-05'),0);
});
test('shift runs continuously across months, years and DST boundaries',()=>{
 const {schedule}=fixture();
 for(const date of ['2026-10-31','2026-12-31','2026-10-25']){
  assert.equal(shiftIndex(schedule,addDays(date,1)),(shiftIndex(schedule,date)+1)%4);
 }
 assert.equal(monthCells('2026-10')[0],'2026-09-28');
 assert.equal(validDay('2026-02-30'),false);
});
test('before anchor uses positive modulo',()=>{
 const {schedule}=fixture();
 assert.equal(shiftIndex(schedule,'2026-11-02'),3);
 assert.equal(shiftIndex(schedule,'2026-11-03'),0);
});
test('first, second and nonworking shifts retain their defined date colors',()=>{
 const data=fixture();
 for(const [i,expected] of shiftColors.entries()){
  assert.equal(calendarDay(data,addDays('2026-11-03',i),'','').color,expected);
 }
});
test('pink range has five contiguous days and keeps shift colors',()=>{
 const data=fixture();
 const pink=monthCells('2026-10').filter(date=>calendarDay(data,date,'','').cycle);
 assert.deepEqual(pink,['2026-10-04','2026-10-05','2026-10-06','2026-10-07','2026-10-08']);
 assert.equal(calendarDay(data,'2026-10-06','','').color,shiftColors[0]);
 assert.equal(calendarDay(data,'2026-10-07','','').color,shiftColors[1]);
});
test('range crosses a month and can be split by clearing one date',()=>{
 const data=fixture();
 data.cycles=[{...audit,startDate:'2026-10-30',endDate:'2026-11-03'}];
 assert.ok(calendarDay(data,'2026-11-02','','').cycle);
 const ranges=removeCycleDay(data.cycles,'2026-11-01','second',audit.updatedAt);
 assert.deepEqual(ranges.map(range=>[range.startDate,range.endDate]),[['2026-10-30','2026-10-31'],['2026-11-02','2026-11-03']]);
});
test('three markers have a fixed order, and today and selection are independent',()=>{
 const day=calendarDay(fixture(),event.date,event.date,event.date);
 assert.deepEqual(day.markers,['migraine','personal','event']);
 assert.ok(day.cycle&&day.today&&day.selected&&day.eventLine);
 assert.equal(day.color,shiftColors[0]);
});
test('hidden private marker is still available in day details',()=>{
 const data=fixture();
 data.preferences.showPersonalMarkers=false;
 const day=calendarDay(data,event.date,'','');
 assert.equal(day.personal,true);
 assert.deepEqual(day.markers,['migraine','event']);
});
test('events add one flag and one line, until the last event is deleted',()=>{
 const data=fixture();
 data.events=[{...event,id:'later',time:'16:00'},event,{...event,id:'new',createdAt:'2026-01-02T00:00:00Z'}];
 let day=calendarDay(data,event.date,'','');
 assert.deepEqual(day.events.map(item=>item.id),['record','new','later']);
 assert.equal(day.markers.filter(marker=>marker==='event').length,1);
 data.events=data.events.slice(1);
 assert.equal(calendarDay(data,event.date,'','').eventLine,true);
 data.events=[];
 day=calendarDay(data,event.date,'','');
 assert.equal(day.eventLine,false);
 assert.ok(!day.markers.includes('event'));
});
test('changing event date moves the flag and line to the new date',()=>{
 const data=fixture();
 data.events=[{...event,date:'2026-11-01'}];
 assert.equal(calendarDay(data,event.date,'','').eventLine,false);
 assert.equal(calendarDay(data,'2026-11-01','','').eventLine,true);
});
test('time, sound and deletion reconcile native reminders and preserve local wall time',()=>{
 const data=fixture();
 const [old]=reminderPlan(data,0);
 assert.equal(new Date(old.at).toISOString(),'2026-10-06T10:30:00.000Z');
 assert.deepEqual(reconcileReminders([old],[old]),{cancel:[],schedule:[]});
 data.events=[{...event,time:'15:00',soundId:'short'}];
 const [next]=reminderPlan(data,0);
 assert.deepEqual(reconcileReminders([next],[old]),{cancel:[old.id],schedule:[next]});
 assert.equal(next.at-old.at,3600000);
 data.events=[];
 assert.deepEqual(reconcileReminders(reminderPlan(data,0),[next]),{cancel:[old.id],schedule:[]});
});

test('November 4 is second shift for new and legacy default calendars',()=>{
 const data=fixture();
 assert.equal(shiftIndex(data.schedule,'2026-11-04'),1);
 const legacy={...data,schedule:{...data.schedule,anchorDate:'2026-10-01',anchorShiftType:'FIRST_SHIFT' as const}};
 assert.equal(shiftIndex(upgradeDefaultShiftSchedule(legacy).schedule,'2026-11-04'),1);
 assert.equal(upgradeDefaultShiftSchedule({...legacy,schedule:{...legacy.schedule,updatedAt:'2026-10-12T00:00:00Z'}}).schedule.anchorDate,'2026-10-01');
});
test('forecast repeats five days from the recorded start, and a new period resets it',()=>{
 const data=fixture();
 assert.equal(cycleForecast(data,'2026-10-03'),undefined);
 assert.equal(cycleForecast(data,'2026-10-18'),'ovulation');
 assert.equal(cycleForecast(data,'2026-10-13'),'fertile');
 assert.equal(cycleForecast(data,'2026-10-19'),'fertile');
 assert.deepEqual(Array.from({length:7},(_,i)=>cycleForecast(data,addDays('2026-10-31',i))),[undefined,'period','period','period','period','period',undefined]);
 data.preferences.cycleLength=34;
 assert.equal(cycleForecast(data,'2026-11-07'),'period');
 data.cycles.push({...audit,id:'new',startDate:'2026-11-06',endDate:'2026-11-10'});
 assert.equal(calendarDay(data,'2026-11-07','','').forecast,undefined);
 assert.equal(cycleForecast(data,'2026-12-10'),'period');
});

test('period history counts recorded days and intervals between starts across years',()=>{
 const audit={ownerId:'test',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
 const previous={...audit,id:'previous',startDate:'2025-12-29',endDate:'2026-01-02'};
 const latest={...audit,id:'latest',startDate:'2026-01-26',endDate:'2026-01-29'};
 assert.deepEqual(periodHistory([previous,latest]),[
  {range:latest,periodLength:4,cycleLength:undefined},
  {range:previous,periodLength:5,cycleLength:28},
 ]);
});
