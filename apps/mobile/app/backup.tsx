import React,{useState} from 'react';
import {Pressable,StyleSheet,View} from 'react-native';
import {useApp} from '../src/context';
import {Frame,T,Primary,ConfirmationSheet,usePlannerColors} from '../src/planner/ui';
import {Icon} from '../src/components/Icon';
import {saveBackupFile,pickBackupFile,canShareFile} from '../src/data/backup-files';
import {hydrateBackup} from '../src/data/portable';
import {createBackup,serializeBackup,parseBackup,backupSummary,backupFileName,BackupError} from '@life-os/domain/backup';
import type {BackupSummary,ParsedBackup} from '@life-os/domain/backup';

const APP_RELEASE='LIFE OS 1.0.0';
const LAST_SAVED='backup.lastSavedAt';

const mb=(bytes:number)=>bytes<1024*1024?Math.max(1,Math.round(bytes/1024))+' КБ':(bytes/1024/1024).toFixed(1).replace('.',',')+' МБ';
const when=(iso?:string)=>{if(!iso)return '';const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleString('ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';};
const plural=(n:number,one:string,few:string,many:string)=>{const a=n%10,b=n%100;return n+' '+(a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many);};
const errorText:Record<string,string>={
 not_json:'Этот файл не читается как резервная копия: он повреждён или это другой файл. Ваши данные не изменены.',
 not_backup:'Это не резервная копия LIFE OS. Выберите файл life-os-backup-….json. Ваши данные не изменены.',
 newer:'Копия создана более новой версией LIFE OS. Обновите приложение и попробуйте снова. Ваши данные не изменены.',
 invalid:'Копия повреждена или неполная, восстановить её нельзя. Ваши данные не изменены.',
 too_large:'Файл слишком большой для резервной копии LIFE OS. Ваши данные не изменены.',
};

function Contents({summary}:{summary:BackupSummary}){
 return <View style={{gap:3}}>
  <T>{plural(summary.records,'запись','записи','записей')} во всех разделах</T>
  {summary.history>0&&<T size={13} muted>{plural(summary.history,'отметка','отметки','отметок')} «выполнено» и «куплено»</T>}
  <T size={13} muted>{summary.files?`Ваши фото и файлы: ${summary.files} (${mb(summary.filesBytes)}) — внутри копии`:'Ваших фото и файлов нет'}</T>
  <T size={13} muted>Настройки, тема, порядок разделов, прочитанные уведомления</T>
  {summary.items>0&&<T size={13} muted>Записи предыдущей библиотеки: {summary.items}</T>}
  {summary.healthVault&&<T size={13} muted>Защищённые медицинские записи — в зашифрованном виде, нужен прежний пароль</T>}
  {summary.externalImages>0&&<T size={13} muted>Постеры TMDB и другие картинки по ссылкам ({summary.externalImages}) хранятся как ссылки и загрузятся снова при интернете</T>}
 </View>;
}

export default function Backup(){
 const C=usePlannerColors();
 const {state,repo,run,ready,busy}=useApp();
 const [message,setMessage]=useState<{text:string;error?:boolean}|null>(null);
 const [picked,setPicked]=useState<ParsedBackup|null>(null);
 const [confirm,setConfirm]=useState(false);
 const lastSaved=state.uiPreferences?.[LAST_SAVED];
 const summary=ready?backupSummary(state):undefined;
 const share=canShareFile();
 const card=[styles.card,{backgroundColor:C.paper,borderColor:C.line}];

 /** Synchronous up to the share sheet, so iPhone keeps the tap that allows sharing a file. */
 const save=(afterSave?:()=>void)=>{
  if(!ready)return;
  let json:string;
  try{json=serializeBackup(createBackup(state,new Date().toISOString(),APP_RELEASE));}
  catch{setMessage({text:'Не удалось подготовить копию. Данные не изменены.',error:true});return;}
  saveBackupFile(json,backupFileName(new Date())).then(result=>{
   if(result==='cancelled'){setMessage({text:'Сохранение отменено. Копия не создана.'});return;}
   setMessage({text:result==='shared'?'Копия передана. Убедитесь, что выбрали «Сохранить в Файлы» или другое надёжное место.':'Файл копии скачан. Он в папке «Загрузки» или в приложении «Файлы».'});
   run(()=>repo.preference(LAST_SAVED,new Date().toISOString())).catch(()=>{});
   afterSave?.();
  }).catch(()=>setMessage({text:'Не удалось сохранить файл. Попробуйте ещё раз.',error:true}));
 };
 const choose=()=>{setMessage(null);pickBackupFile().then(text=>{
  if(text===undefined)return;
  try{setPicked(parseBackup(text));}
  catch(e){setPicked(null);setMessage({text:errorText[e instanceof BackupError?e.code:'invalid']??errorText.invalid,error:true});}
 }).catch(e=>setMessage({text:(e as Error)?.message==='backup_too_large'?errorText.too_large:'Не удалось прочитать файл. Ваши данные не изменены.',error:true}));};
 const replace=()=>{if(!picked)return;setConfirm(false);
  run(()=>repo.replaceAll(picked.state)).then(count=>{setPicked(null);setMessage({text:`Данные восстановлены из копии: ${plural(count,'запись','записи','записей')}.`});})
   .catch(()=>setMessage({text:'Восстановить не удалось. Текущие данные остались без изменений.',error:true}));};
 const merge=()=>{if(!picked)return;
  run(async()=>repo.importBackup(await hydrateBackup(picked.state,state.items.map(i=>i.id)))).then(()=>{setPicked(null);setMessage({text:'Недостающие записи добавлены. Существующие записи не изменены.'});})
   .catch(()=>setMessage({text:'Добавить записи не удалось. Текущие данные остались без изменений.',error:true}));};

 return <Frame title="Резервная копия">
  <T muted>Все записи LIFE OS хранятся только на этом устройстве — в этом браузере или в установленном приложении. Копия — это файл, который вы сохраняете сами, например в «Файлы» или iCloud Drive. LIFE OS никуда его не отправляет.</T>

  <T size={12} muted bold>Сохранить</T>
  <View style={card}>
   <View style={styles.block}>
    {summary?<Contents summary={summary}/>:<T muted>Загрузка данных…</T>}
    <Primary disabled={!ready||busy} onPress={()=>save()}>Сохранить копию</Primary>
    <T size={12} muted>{lastSaved?'Последняя копия: '+when(lastSaved)+'. ':'Копий ещё не было. '}{share?'Откроется меню «Поделиться» — выберите «Сохранить в Файлы».':'Файл скачается в папку «Загрузки».'}</T>
   </View>
  </View>

  <T size={12} muted bold>Восстановить</T>
  <View style={card}>
   <View style={styles.block}>
    {!picked?<>
     <T size={13} muted>Выберите файл life-os-backup-….json. Перед заменой данных LIFE OS покажет, что в копии, и спросит подтверждение.</T>
     <Primary quiet disabled={!ready||busy} onPress={choose}>Восстановить из копии</Primary>
    </>:<>
     <View style={styles.pickedHead}><Icon name="package" size={18} color={C.purple}/><T bold style={{flex:1}}>{picked.createdAt?'Копия от '+when(picked.createdAt):'Копия старого формата'}</T></View>
     <Contents summary={picked.summary}/>
     <Primary disabled={busy} onPress={()=>setConfirm(true)}>Заменить данные этой копией</Primary>
     <Primary quiet disabled={busy} onPress={merge}>Только добавить недостающие записи</Primary>
     <Pressable accessibilityRole="button" onPress={()=>setPicked(null)} style={styles.link} hitSlop={6}><T color={C.muted}>Отмена</T></Pressable>
    </>}
   </View>
  </View>

  {!!message&&<View accessibilityRole="alert" aria-live="polite" style={[styles.message,{backgroundColor:message.error?'#fbe7e8':C.lavender}]}><T color={message.error?C.red:C.purple}>{message.text}</T></View>}

  <T size={12} muted>Файл копии не зашифрован и содержит все личные записи, включая «Отношения». Храните его в надёжном месте и не отправляйте посторонним.</T>

  <ConfirmationSheet visible={confirm} title="Заменить данные?" onClose={()=>setConfirm(false)}>
   <T>Все текущие записи и настройки на этом устройстве будут заменены содержимым копии{picked?.createdAt?' от '+when(picked.createdAt):''}. Записи, которых нет в копии, исчезнут. Отменить это действие нельзя.</T>
   <T size={13} muted>Сначала сохраните текущие данные отдельной копией — так их можно будет вернуть.</T>
   <Primary quiet disabled={busy} onPress={()=>save()}>Сначала сохранить текущую копию</Primary>
   <Pressable accessibilityRole="button" disabled={busy} onPress={replace} style={[styles.danger,{opacity:busy?.5:1}]}><T bold color="#fff">Заменить данные</T></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>setConfirm(false)} style={styles.link} hitSlop={6}><T color={C.muted}>Отмена</T></Pressable>
  </ConfirmationSheet>
 </Frame>;
}

const styles=StyleSheet.create({
 card:{borderWidth:StyleSheet.hairlineWidth,borderRadius:20,overflow:'hidden'},
 block:{padding:14,gap:12},
 pickedHead:{flexDirection:'row',alignItems:'center',gap:8},
 link:{minHeight:44,alignItems:'center',justifyContent:'center'},
 message:{borderRadius:14,padding:12},
 danger:{minHeight:46,borderRadius:21,backgroundColor:'#b4474f',alignItems:'center',justifyContent:'center',padding:12},
});
