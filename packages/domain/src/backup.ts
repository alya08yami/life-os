/**
 * LIFE OS backup file format.
 *
 * A backup is the whole local State (every section's records, purchase/completion history, notification
 * read marks, settings and theme, home layout, the encrypted health vault) wrapped in a small envelope with a
 * format version and creation date. Photos and files the user added are stored inside records as data: URLs,
 * so they travel inside the same file. Nothing here talks to the network.
 *
 * Older backups (the bare State JSON written by earlier versions) are still accepted.
 */
import {validateState} from './index.ts';
import type {State} from './index.ts';

export const BACKUP_FORMAT='life-os-backup';
export const BACKUP_VERSION=1;
/** Latest local data format this build understands. */
export const STATE_SCHEMA_VERSION=1;

export type BackupSummary={records:number;history:number;sections:Record<string,number>;files:number;filesBytes:number;externalImages:number;items:number;healthVault:boolean};
export type BackupEnvelope={format:typeof BACKUP_FORMAT;formatVersion:number;createdAt:string;app:string;summary:BackupSummary;state:State};
export type ParsedBackup={state:State;createdAt?:string;app?:string;summary:BackupSummary;legacy:boolean};
export type BackupErrorCode='not_json'|'not_backup'|'newer'|'invalid'|'too_large';
export class BackupError extends Error{code:BackupErrorCode;constructor(code:BackupErrorCode){super(code);this.code=code;}}

export const MAX_BACKUP_BYTES=200*1024*1024;

/**
 * Brings stored data up to the current format. Version 1 is current, so nothing changes today; the hook exists
 * so a future format change upgrades old data step by step instead of rejecting or resetting it.
 * Data written by a newer app version is refused (never truncated or overwritten).
 */
export function migrateState(value:unknown):unknown{
 const v=value as {schemaVersion?:unknown}|null;
 if(!v||typeof v!=='object')return value;
 if(typeof v.schemaVersion==='number'&&v.schemaVersion>STATE_SCHEMA_VERSION)throw new BackupError('newer');
 // Future: if(v.schemaVersion===1) value=upgrade1to2(value) …
 return value;
}

const dataBytes=(uri:unknown)=>typeof uri==='string'&&uri.startsWith('data:')?Math.floor((uri.length-uri.indexOf(',')-1)*.75):0;

/** What the backup contains, shown before saving and before restoring. */
export function backupSummary(state:State):BackupSummary{
 const sections:Record<string,number>={};let files=0,filesBytes=0,externalImages=0;
 const objects=state.planner?.objects??[];
 for(const o of objects){
  sections[o.section]=(sections[o.section]??0)+1;
  for(const f of o.attachments){if(f.uri.startsWith('data:')){files++;filesBytes+=dataBytes(f.uri);}else externalImages++;}
  for(const value of Object.values(o.data??{}))if(typeof value==='string'&&value.startsWith('data:image/')){files++;filesBytes+=dataBytes(value);}
 }
 for(const item of state.items)for(const a of item.attachments??[]){if(a.uri.startsWith('data:')){files++;filesBytes+=dataBytes(a.uri);}else externalImages++;}
 return {records:objects.length,history:state.planner?.history.length??0,sections,files,filesBytes,externalImages,items:state.items.length,healthVault:!!state.vault};
}

export function createBackup(state:State,createdAt:string,app:string):BackupEnvelope{
 const copy=validateState(JSON.parse(JSON.stringify(state)));
 return {format:BACKUP_FORMAT,formatVersion:BACKUP_VERSION,createdAt,app,summary:backupSummary(copy),state:copy};
}

export function serializeBackup(envelope:BackupEnvelope):string{return JSON.stringify(envelope);}

/** Reads a backup file. Throws BackupError and never touches stored data. */
export function parseBackup(text:string):ParsedBackup{
 if(text.length>MAX_BACKUP_BYTES)throw new BackupError('too_large');
 let raw:any;
 try{raw=JSON.parse(text);}catch{throw new BackupError('not_json');}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new BackupError('not_backup');
 const legacy=raw.format===undefined&&raw.schemaVersion!==undefined;
 if(!legacy){
  if(raw.format!==BACKUP_FORMAT)throw new BackupError('not_backup');
  if(typeof raw.formatVersion!=='number'||raw.formatVersion>BACKUP_VERSION)throw new BackupError('newer');
  if(!raw.state||typeof raw.state!=='object')throw new BackupError('invalid');
 }
 let state:State;
 try{state=validateState(migrateState(legacy?raw:raw.state));}
 catch(e){if(e instanceof BackupError)throw e;throw new BackupError('invalid');}
 return {state,createdAt:legacy||typeof raw.createdAt!=='string'?undefined:raw.createdAt,app:legacy?undefined:String(raw.app??''),summary:backupSummary(state),legacy};
}

/** File name with the local date, e.g. life-os-backup-2026-11-05.json */
export function backupFileName(date:Date){const p=(n:number)=>String(n).padStart(2,'0');return `life-os-backup-${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}.json`;}
