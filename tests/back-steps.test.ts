import {test} from 'node:test';import assert from 'node:assert/strict';
import {dropRedundant,popStep,type StepScope} from '../apps/mobile/src/planner/steps.ts';

/** Mirrors useStepState: `open` records a step before changing, `replace` never records and drops no-op steps. */
function scope(initial:Record<string,unknown>,sticky:string[]):StepScope&{open:(k:string,v:unknown)=>void;replace:(k:string,v:unknown)=>void}{
 const s:StepScope={cache:new Map(Object.entries(initial)),history:[],sticky:new Set(sticky)};
 return Object.assign(s,{
  open:(k:string,v:unknown)=>{s.history.push(new Map(s.cache));s.cache.set(k,v);},
  replace:(k:string,v:unknown)=>{s.cache.set(k,v);dropRedundant(s);},
 });
}

test('finance calendar: Back after several saved days does not replay old days', ()=>{
 const s=scope({'finance.date':'','finance.entry':false},['finance.date']);
 for(const day of ['2026-11-03','2026-11-05','2026-11-09']){s.replace('finance.date',day);s.open('finance.entry',true);s.replace('finance.entry',false);}
 assert.equal(s.history.length,0);
 assert.equal(popStep(s),undefined,'Back leaves the screen instead of stepping through dates');
 assert.equal(s.cache.get('finance.date'),'2026-11-09');
});

test('Back while an entry is open closes it and keeps the selected day', ()=>{
 const s=scope({'finance.date':'','finance.entry':false},['finance.date']);
 s.replace('finance.date','2026-11-03');s.open('finance.entry',true);
 s.replace('finance.date','2026-11-07'); // tapped another day while the field was open
 const restore=popStep(s);
 assert.deepEqual([...restore!],[['finance.entry',false]]);
 assert.equal(s.cache.get('finance.date'),'2026-11-07');
 assert.equal(popStep(s),undefined);
});

test('nested layers still step back one at a time', ()=>{
 const s=scope({'screen.selected':undefined,'screen.editing':false},[]);
 s.open('screen.selected','a');s.open('screen.editing',true);
 assert.deepEqual([...popStep(s)!],[['screen.selected','a'],['screen.editing',false]]);
 assert.deepEqual([...popStep(s)!],[['screen.selected',undefined],['screen.editing',false]]);
 assert.equal(popStep(s),undefined);
});

test('closing an editor in place does not drop the step of the record under it', ()=>{
 const s=scope({'screen.selected':undefined,'screen.editing':false},[]);
 s.open('screen.selected','a');s.open('screen.editing',true);s.replace('screen.editing',false);
 assert.equal(s.history.length,1);
 assert.deepEqual([...popStep(s)!],[['screen.selected',undefined],['screen.editing',false]]);
});
