/**
 * Keyboard hand-off across a screen change (iPhone web app) — used ONLY when a tap opens another screen whose
 * first field should take the keyboard (search, «+» menu → editor).
 *
 * Why: iOS opens the keyboard only for a field focused during the tap. Within one screen `design/instant` does that
 * with the real field. A new screen, however, is rendered by the router after the tap (expo-router queues navigation
 * in a transition), so its field cannot be focused in time.
 *
 * How: during the tap a real, visually hidden text field takes focus (the keyboard opens); when the new screen's
 * field focuses itself (autoFocus), focus — and the open keyboard — move to it. If no field takes over within
 * 1.5 s, the hidden field lets go, so the keyboard never stays open by itself. It never holds text and is not read.
 * While the hand-off is pending, focus that lands on something that is not a text field (a closing menu returning
 * focus to the button that opened it) is taken straight back, so the keyboard is not dropped on the way.
 */
let bridge:HTMLInputElement|null=null;
let timer:ReturnType<typeof setTimeout>|undefined;
let pending=false;
const editable=(el:EventTarget|null):boolean=>el instanceof HTMLElement&&(/^(INPUT|TEXTAREA)$/.test(el.tagName)||el.isContentEditable);
function finish(){pending=false;document.removeEventListener('focusin',guard,true);if(timer){clearTimeout(timer);timer=undefined;}}
function guard(event:FocusEvent){
 if(!pending||!bridge)return;
 const target=event.target;
 if(target===bridge)return;
 if(editable(target)){finish();return;} // the real field took over: done
 try{bridge.focus({preventScroll:true});}catch{finish();}
}
function element(){
 if(bridge&&document.body.contains(bridge))return bridge;
 const input=document.createElement('input');
 input.type='text';input.tabIndex=-1;input.setAttribute('aria-hidden','true');input.setAttribute('autocomplete','off');input.dataset.keyboardHandoff='true';
 // Inside the visible area (no scroll jump), 16 px (no iOS zoom), invisible and not clickable.
 input.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;margin:0;pointer-events:none;caret-color:transparent;z-index:-1';
 document.body.appendChild(input);bridge=input;return input;
}
export function handoffKeyboard(){
 if(typeof document==='undefined')return;
 const input=element();
 finish();
 try{input.focus({preventScroll:true});}catch{return;}
 pending=true;document.addEventListener('focusin',guard,true);
 timer=setTimeout(()=>{finish();if(document.activeElement===input)input.blur();},1500);
}
