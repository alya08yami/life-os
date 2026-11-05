/**
 * Backup files in the browser / installed web app.
 * Saving: the system share sheet («Сохранить в Файлы») where the browser can share files — iPhone and iPad,
 * including Chrome on iOS and the home-screen app — otherwise an ordinary download. Must be called directly from a
 * tap, so the backup text is prepared beforehand.
 * Nothing is uploaded anywhere: the file goes straight from this device to the place the user picks.
 */
export type SaveResult='shared'|'downloaded'|'cancelled';
const appleTouch=()=>{const n=globalThis.navigator;return !!n&&(/iPad|iPhone|iPod/.test(n.userAgent)||(n.platform==='MacIntel'&&n.maxTouchPoints>1));};
export function canShareFile(name='life-os-backup.json'):boolean{
 try{const n=globalThis.navigator as Navigator&{canShare?:(d:ShareData)=>boolean};return appleTouch()&&typeof n.share==='function'&&!!n.canShare?.({files:[new File(['{}'],name,{type:'application/json'})]});}catch{return false;}
}
export async function saveBackupFile(json:string,name='life-os-backup-'+new Date().toISOString().slice(0,10)+'.json',preferShare=true):Promise<SaveResult>{
 if(preferShare&&canShareFile(name)){
  const file=new File([json],name,{type:'application/json'});
  try{await navigator.share({files:[file],title:name});return 'shared';}
  catch(e){if((e as Error)?.name==='AbortError')return 'cancelled';/* fall through to a download */}
 }
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return 'downloaded';
}
export function pickBackupFile():Promise<string|undefined>{return new Promise((resolve,reject)=>{
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
 input.oncancel=()=>resolve(undefined);
 input.onchange=()=>{const file=input.files?.[0];if(!file){resolve(undefined);return;}if(file.size>200*1024*1024){reject(new Error('backup_too_large'));return;}file.text().then(resolve,reject);};
 input.click();
});}
