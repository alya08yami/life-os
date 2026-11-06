// react-dom ships without type declarations here; only flushSync is used.
// @ts-ignore
import {flushSync} from 'react-dom';
/**
 * First-tap input on iPhone (installed web app / Safari).
 *
 * iOS shows the keyboard only when a field is focused *during* the tap that asked for it. React normally renders
 * the result of a tap a little later, so a field that appears because of the tap (an editor, a search field, an
 * inline row) gets its focus after the gesture is over: the caret shows, but the keyboard needs a second tap.
 *
 * `instant(fn)` applies the tap's state change synchronously (flushSync): the new field is in the page and React
 * focuses it (autoFocus) before the tap handler returns — still inside the gesture, so the keyboard opens at once.
 * The real field is focused; there is no hidden stand-in input.
 */
export function instant(fn:()=>void){
 // flushSync is unavailable only while React is already rendering; then the change simply runs normally.
 // Never run the action twice: if it already ran and threw, the error is passed on.
 let ran=false;
 try{flushSync(()=>{ran=true;fn();});}catch(error){if(ran)throw error;fn();}
}
export const instantly=<A extends unknown[]>(fn:(...args:A)=>void)=>(...args:A)=>instant(()=>fn(...args));
