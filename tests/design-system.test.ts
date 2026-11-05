import test from 'node:test';
import assert from 'node:assert/strict';
import {motion,shadows,gestures,reducedDuration,gradients,surfaces} from '../apps/mobile/src/design/system.ts';

test('motion durations stay inside the agreed ranges',()=>{
 assert.ok(motion.press>=100&&motion.press<=160);
 assert.ok(motion.tab>=180&&motion.tab<=250);
 assert.ok(motion.menu>=180&&motion.menu<=260);
 assert.ok(motion.drawer>=220&&motion.drawer<=300);
 assert.ok(motion.cardExpand>=300&&motion.cardExpand<=420);
 assert.ok(motion.screen>=350&&motion.screen<=500);
 assert.ok(motion.listReflow>=220&&motion.listReflow<=350);
});
test('reduced motion makes transitions instant',()=>{
 assert.equal(reducedDuration(motion.screen,true),0);
 assert.equal(reducedDuration(motion.screen,false),motion.screen);
});
test('shadow depth increases with elevation and stays soft',()=>{
 const values=[1,2,3,4].map(level=>Number(shadows[level as 1].shadowOpacity));
 for(let i=1;i<values.length;i++)assert.ok(values[i]>values[i-1]);
 assert.ok(Math.max(...values)<=0.2);
});
test('gesture thresholds protect against accidental actions',()=>{
 assert.ok(gestures.slop>=10);
 assert.ok(gestures.horizontalRatio>1);
 assert.ok(gestures.rowCommit>=0.25&&gestures.rowCommit<=0.5);
});
test('one background gradient with matching stops; content surface is denser than glass',()=>{
 assert.equal(gradients.background.length,gradients.backgroundStops.length);
 const alpha=(rgba:string)=>Number(rgba.match(/[\d.]+\)$/)![0].slice(0,-1));
 assert.ok(alpha(surfaces.content.fill)>alpha(surfaces.glass.fill));
});
