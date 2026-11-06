import {Platform} from 'react-native';
import * as Font from 'expo-font';

/**
 * «Шрифт приложения» — five typefaces with full Cyrillic (Inter is built in; the others are subset to Latin + Cyrillic
 * and loaded only when chosen or previewed, then kept by the service worker's cache). Independent of the theme.
 * Web/PWA: the chosen face replaces Inter across the interface via one CSS rule; Inter needs no override at all.
 */
export type FontId='inter'|'manrope'|'onest'|'golos'|'rubik';
export const fontOptions:{id:FontId;label:string;family:string;module?:number}[]=[
 {id:'inter',label:'Inter',family:'Inter'},
 {id:'manrope',label:'Manrope',family:'LifeOS Manrope',module:require('../../assets/fonts/Manrope.ttf')},
 {id:'onest',label:'Onest',family:'LifeOS Onest',module:require('../../assets/fonts/Onest.ttf')},
 {id:'golos',label:'Golos Text',family:'LifeOS Golos',module:require('../../assets/fonts/GolosText.ttf')},
 {id:'rubik',label:'Rubik',family:'LifeOS Rubik',module:require('../../assets/fonts/Rubik.ttf')},
];
export const FONT_PREFERENCE='app.font';
export const fontPreview='Съешь ещё этих мягких булок · 1 234,50 ₴';
const loaded=new Set<FontId>(['inter']);

/** Registers the font face (web) so it can be previewed or applied. Resolves when the face is ready. */
export async function ensureFont(id:FontId):Promise<void>{
 if(Platform.OS!=='web'||loaded.has(id)||typeof document==='undefined')return;
 const option=fontOptions.find(f=>f.id===id);if(!option?.module)return;
 loaded.add(id);
 // One variable face covering all weights, shown with «swap» so text never waits for the file.
 try{await Font.loadAsync({[option.family]:{uri:option.module,display:'swap',weight:'100 900'} as any});}
 catch{loaded.delete(id);/* offline and not cached yet: the interface keeps Inter */}
}

/** Applies the chosen font to the whole interface (web/PWA). */
export function applyFont(id:FontId){
 if(Platform.OS!=='web'||typeof document==='undefined')return;
 const option=fontOptions.find(f=>f.id===id)??fontOptions[0];
 let style=document.getElementById('life-os-font') as HTMLStyleElement|null;
 if(option.id==='inter'){style?.remove();return;}
 void ensureFont(option.id);
 if(!style){style=document.createElement('style');style.id='life-os-font';document.head.appendChild(style);}
 style.textContent=`#root, #root *:not(svg):not(svg *) { font-family: '${option.family}', Inter, system-ui, sans-serif !important; }`;
 try{localStorage.setItem('life-os.font',option.id);}catch{/* private mode */}
}
export const isFontId=(v:unknown):v is FontId=>fontOptions.some(f=>f.id===v);
