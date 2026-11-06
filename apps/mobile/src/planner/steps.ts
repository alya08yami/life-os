/** Pure back-step rules shared by planner/navigation (kept free of React so unit tests can load it). */
export type StepScope={cache:Map<string,unknown>;history:Map<string,unknown>[];sticky:Set<string>};
const same=(a:unknown,b:unknown)=>a===b||JSON.stringify(a)===JSON.stringify(b);
/** True when restoring `old` would change nothing visible (sticky keys are never restored). */
export function redundant(scope:StepScope,old:Map<string,unknown>){for(const [k,v] of old){if(scope.sticky.has(k))continue;if(!same(v,scope.cache.get(k)))return false;}return true;}
/** Drops trailing steps that became no-ops (a layer closed in place). */
export function dropRedundant(scope:StepScope){while(scope.history.length&&redundant(scope,scope.history[scope.history.length-1]!))scope.history.pop();}
/** Pops the latest meaningful step; returns the values to restore (sticky keys excluded) or undefined when none left. */
export function popStep(scope:StepScope):Map<string,unknown>|undefined{
 while(scope.history.length){const old=scope.history.pop()!;if(redundant(scope,old))continue;const restore=new Map<string,unknown>();for(const [k,v] of old){if(scope.sticky.has(k))continue;restore.set(k,v);scope.cache.set(k,v);}return restore;}
 return undefined;
}
