/**
 * Native: the system opens the keyboard for a focused field whenever it is focused, so no special handling.
 * See instant.web.ts for the iPhone web-app rule.
 */
export function instant(fn:()=>void){fn();}
/** Wraps a press handler with `instant`. */
export const instantly=<A extends unknown[]>(fn:(...args:A)=>void)=>(...args:A)=>instant(()=>fn(...args));
