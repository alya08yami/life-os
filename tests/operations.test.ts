import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commitAndRefresh} from '../apps/mobile/src/operations.ts';
test('a committed write remains successful when refreshing fails',async()=>{
  let committed=0;let refreshFailed=false;
  const result=await commitAndRefresh(async()=>{committed++;return 'saved-id';},async()=>{throw new Error('disk');},()=>{refreshFailed=true;});
  assert.equal(result,'saved-id');assert.equal(committed,1);assert.equal(refreshFailed,true);
});
test('failed writes reject instead of reporting successful capture',async()=>{
  let refreshed=false;
  await assert.rejects(commitAndRefresh(async()=>{throw new Error('quota');},async()=>{refreshed=true;},()=>{}),/quota/);
  assert.equal(refreshed,false);
});
