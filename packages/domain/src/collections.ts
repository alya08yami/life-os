import {validateRecurrence} from './recurrence.ts';
import type {RecurrenceRule} from './recurrence.ts';
export type TripStop={placeId:string;day?:string};
export type ScenarioStep={id:string;title:string;dueDate?:string;dueTime?:string;recurrence?:RecurrenceRule};
export type CollectionDetails={
  place:{city?:string;country?:string;address?:string;latitude?:number;longitude?:number;placeId?:string;mapUrl?:string;visitStatus:'want'|'visited';notes?:string};
  trip:{startDate?:string;endDate?:string;participants:string[];stops:TripStop[];bookings:string[];notes?:string};
  garment:{clothingCategory:'clothing'|'shoes'|'accessories';color?:string;season?:string;brand?:string;notes?:string};
  outfit:{garmentIds:string[];occasion?:string;season?:string;notes?:string};
  room:{notes?:string};interior:{roomId?:string;notes?:string};
  appliance:{model?:string;purchasedOn?:string;warrantyUntil?:string;manualUrl?:string;notes?:string};
  scenario:{steps:ScenarioStep[];notes?:string};
  list:{listType:'tasks'|'shopping';notes?:string};
  project:{status:'active'|'paused'|'done';notes?:string};idea:{projectId?:string;notes?:string};material:{projectId?:string;notes?:string};
};
export const collectionKinds=['place','trip','garment','outfit','room','interior','appliance','scenario','list','project','idea','material'] as const;
export type CollectionKind=typeof collectionKinds[number];
export type CollectionVariant={[K in CollectionKind]:{kind:K;details:CollectionDetails[K]}}[CollectionKind];
export function isCollectionKind(kind:string):kind is CollectionKind{return (collectionKinds as readonly string[]).includes(kind);}
export {calendarDate} from './dates.ts';
import {calendarDate} from './dates.ts';

const text=(value:unknown,max=10000):string|undefined=>{if(value===undefined||value==='')return;if(typeof value!=='string'||value.length>max)throw new Error('invalid_field');return value.trim()||undefined;};
const strings=(v:unknown,max=200):string[]=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>max||v.some(x=>typeof x!=='string'||!x.trim()||x.length>2000))throw new Error('invalid_field');return [...new Set(v.map(x=>x.trim()))];};
export function collectionDetails(kind:CollectionKind,input:unknown):CollectionVariant['details']{
  if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))throw new Error('invalid_details');
  const d=(input??{}) as Record<string,unknown>;const out:Record<string,unknown>={};
  const fields:Record<CollectionKind,string[]>={place:['city','country','address','placeId','notes'],trip:['notes'],garment:['color','season','brand','notes'],outfit:['occasion','season','notes'],room:['notes'],interior:['roomId','notes'],appliance:['model','notes'],scenario:['notes'],list:['notes'],project:['notes'],idea:['projectId','notes'],material:['projectId','notes']};
  for(const key of fields[kind]){const v=text(d[key]);if(v)out[key]=v;}
  const enumField=(key:string,values:string[],fallback:string)=>{const v=d[key]??fallback;if(!values.includes(String(v)))throw new Error('invalid_status');out[key]=v;};
  const date=(key:string)=>{if(d[key])out[key]=calendarDate(d[key]);};
  const url=(key:string)=>{const v=text(d[key],2000);if(v){const u=new URL(v);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error('invalid_url');out[key]=u.href;}};
  if(kind==='place'){enumField('visitStatus',['want','visited'],'want');url('mapUrl');for(const [key,max] of [['latitude',90],['longitude',180]] as const){if(d[key]!==undefined){if(typeof d[key]!=='number'||!Number.isFinite(d[key])||Math.abs(d[key])>max)throw new Error('invalid_coordinates');out[key]=d[key];}}if((d.latitude===undefined)!==(d.longitude===undefined))throw new Error('invalid_coordinates');}
  if(kind==='trip'){date('startDate');date('endDate');if(out.startDate&&out.endDate&&String(out.endDate)<String(out.startDate))throw new Error('invalid_date');out.participants=strings(d.participants,30);out.bookings=strings(d.bookings,100);const stops=d.stops??[];if(!Array.isArray(stops)||stops.length>100)throw new Error('invalid_stops');const seen=new Set<string>();out.stops=stops.map(s=>{if(!s||typeof s.placeId!=='string'||!s.placeId||seen.has(s.placeId))throw new Error('invalid_stops');seen.add(s.placeId);const day=s.day?calendarDate(s.day):undefined;if(day&&(out.startDate&&day<String(out.startDate)||out.endDate&&day>String(out.endDate)))throw new Error('invalid_date');return {placeId:s.placeId,...(day?{day}:{})};});}
  if(kind==='garment')enumField('clothingCategory',['clothing','shoes','accessories'],'clothing');
  if(kind==='outfit')out.garmentIds=strings(d.garmentIds,100);
  if(kind==='appliance'){date('purchasedOn');date('warrantyUntil');url('manualUrl');}
  if(kind==='project')enumField('status',['active','paused','done'],'active');
  if(kind==='list')enumField('listType',['tasks','shopping'],'tasks');
  if(kind==='scenario'){const steps=d.steps??[];if(!Array.isArray(steps)||steps.length>200)throw new Error('invalid_scenario');const seen=new Set<string>();out.steps=steps.map(s=>{if(!s||typeof s.id!=='string'||!s.id||seen.has(s.id)||!text(s.title,2000))throw new Error('invalid_scenario');seen.add(s.id);if(s.dueTime!==undefined&&(typeof s.dueTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.dueTime)))throw new Error('invalid_time');const recurrence=validateRecurrence(s.recurrence);if(recurrence&&!s.dueDate)throw new Error('invalid_date');return {id:s.id,title:s.title.trim(),...(s.dueDate?{dueDate:calendarDate(s.dueDate)}:{}),...(recurrence?{recurrence}:{}),...(s.dueTime?{dueTime:s.dueTime}:{})};});}
  return out as CollectionVariant['details'];
}
