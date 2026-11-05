import {validatePlanner} from './planner.ts';
import type {PlannerState} from './planner.ts';
import {validateVault,validateMedicalRecords} from './vault.ts';
import type {EncryptedVault,MedicalRecord} from './vault.ts';
import {collectionKinds,isCollectionKind,collectionDetails,calendarDate} from './collections.ts';
import type {CollectionVariant} from './collections.ts';
import {validateRecurrence} from './recurrence.ts';
import type {RecurrenceRule,TaskExecution} from './recurrence.ts';
export type Locale = 'ru' | 'uk' | 'en';
export type Lifecycle='active'|'hidden'|'archived'|'trashed';
export type Category = 'general' | 'home' | 'work' | 'shopping' | 'entertainment' | 'food';
export const kinds = ['note','link','image','task','shopping_item','movie','recipe','product',...collectionKinds] as const;
export type Kind = typeof kinds[number];
export type Attachment = {id:string; uri:string; thumbnailUri?:string; mime:string; size:number};
export type ProcessingState={status:'pending'|'processing'|'needs_review'|'processed'|'failed';candidate?:ItemInput;error?:string;costMicroUsd?:number;cached?:boolean;originalText?:string};
export type MovieDetails = {year?:number; watchStatus:'want'|'watching'|'watched'|'favorite';mediaType?:'movie'|'series';originalTitle?:string;genres?:string[];runtimeMinutes?:number;description?:string;rating?:number;notes?:string;season?:number;episode?:number;totalSeasons?:number;episodesPerSeason?:number; director?:string; trailerUrl?:string; catalogId?:string;posterUrl?:string};
export type IngredientAmount = {ingredient:string;quantity:number;unit?:string};
export type RecipeDetails = {caloriesPerServing?:number;ingredients:string[]; steps:string[]; servings?:number; ingredientAmounts?:IngredientAmount[];cookMinutes?:number;notes?:string;plannedDate?:string};
export type ProductCategory='beauty'|'clothing'|'tech'|'home'|'other';
export type PriceOffer={id:string;store:string;priceMinor:number;currency:string;variant:string;observedAt:string;sourceUrl:string;previousPriceMinor?:number;shippingMinor?:number;availability?:'in_stock'|'out_of_stock'|'unknown'};
export type ProductDetails = {brand?:string; model?:string; priceMinor?:number; currency?:string;productCategory?:ProductCategory;variant?:string;offers?:PriceOffer[];purchasedOn?:string;repurchaseDays?:number;attributes?:string;ingredientsText?:string;volume?:string;priceAlert?:{mode:'any'|'target'|'percent';value?:number;enabled:boolean}};
export type ShoppingDetails={quantity?:number;unit?:string};
export type TaskDetails = {priority:'normal'|'high'; dueDate?:string;dueTime?:string;recurrence?:RecurrenceRule;anchorDay?:number;history?:TaskExecution[]};
export type Base = {id:string; title:string; body:string; category:Category; sourceUrl?:string; sourceItemId?:string; sourceIngredient?:string;sourceStepId?:string; attachments:Attachment[]; inboxStatus:'unprocessed'|'confirmed'; completed:boolean; favorite?:boolean; processing?:ProcessingState; tags?:string[]; lifecycle?:Lifecycle;lifecycleChangedAt?:string;version:number; createdAt:string; updatedAt:string};
export type Item = Base & (
  | {kind:'movie'; details:MovieDetails}
  | {kind:'recipe'; details:RecipeDetails}
  | {kind:'product'; details:ProductDetails}
  | {kind:'task'; details:TaskDetails}
  | CollectionVariant
  | {kind:'shopping_item';details:ShoppingDetails}
  | {kind:'note'|'link'|'image'; details:Record<string,never>}
);
export type Suggestion = {kind:Kind; category:Category; source:'rule'};
export type ItemInput = {text:string; title?:string; tags?:string[]; kind?:Kind; category?:Category; sourceUrl?:string; attachments?:Attachment[]; details?:unknown; id?:string};
export type Settings = {locale:Locale; theme:'light'|'dark'|'minimal'|'mist'|'warm'|'soft'};
export type State = {schemaVersion:1; planner?:PlannerState; items:Item[];vault?:EncryptedVault;healthRecords?:MedicalRecord[]; settings:Settings; appliedTemplates:string[];uiPreferences?:Record<string,string>};
export function initialState():State { return {schemaVersion:1,items:[],settings:{locale:'ru',theme:'light'},appliedTemplates:[]}; }
/** Domain state is JSON data on both storage adapters; no Hermes structuredClone dependency. */
export function copyState(state:State):State{return JSON.parse(JSON.stringify(state)) as State;}
export function safeUrl(value:string):string|undefined {
  try { const u=new URL(value.trim()); return ['https:','http:'].includes(u.protocol) && !u.username && !u.password ? u.href : undefined; } catch { return undefined; }
}
export function classify(text:string):Suggestion|null {
  const t=text.toLocaleLowerCase();
  const buy=/(?:\b(?:buy|purchase)\b|купить|купити|покупк)/u.test(t);
  const task=/(?:\b(?:remind|todo)\b|напомни|нагадати|нагадуй)/u.test(t);
  if(buy && task) return null;
  if(buy) return {kind:'shopping_item',category:'shopping',source:'rule'};
  if(task) return {kind:'task',category:'general',source:'rule'};
  return null;
}
function stringField(value:unknown,max=5000):string|undefined {
  if(value===undefined || value==='') return undefined;
  if(typeof value!=='string' || value.length>max) throw new Error('invalid_field');
  return value.trim()||undefined;
}
function detailsFor(kind:Kind,value:unknown):Item['details'] {
  if(value!==undefined && (typeof value!=='object'||value===null||Array.isArray(value))) throw new Error('invalid_details');
  const d=(value??{}) as Record<string,unknown>;
  if(isCollectionKind(kind))return collectionDetails(kind,value);
  if(kind==='movie') {
    const year=d.year;
    if(year!==undefined && (!Number.isInteger(year)||Number(year)<1888||Number(year)>2200)) throw new Error('invalid_year');
    const watchStatus=d.watchStatus??'want';
    if(!['want','watching','watched','favorite'].includes(String(watchStatus))) throw new Error('invalid_status');
    const result:MovieDetails={watchStatus:watchStatus as MovieDetails['watchStatus']};
    if(year!==undefined) result.year=Number(year);
    for(const key of ['director','catalogId'] as const) {const v=stringField(d[key],300);if(v)result[key]=v;}
    if(d.mediaType!==undefined){if(!['movie','series'].includes(String(d.mediaType)))throw new Error('invalid_status');result.mediaType=d.mediaType as 'movie'|'series';}
    for(const key of ['originalTitle','description','notes'] as const){const v=stringField(d[key],10000);if(v)result[key]=v;}
    if(d.genres!==undefined){if(!Array.isArray(d.genres)||d.genres.length>30||d.genres.some(x=>typeof x!=='string'||x.length>100))throw new Error('invalid_field');result.genres=d.genres as string[];}
    for(const key of ['runtimeMinutes','season','episode','totalSeasons','episodesPerSeason'] as const)if(d[key]!==undefined){if(!Number.isInteger(d[key])||Number(d[key])<1||Number(d[key])>10000)throw new Error('invalid_progress');result[key]=Number(d[key]);}
    if(result.totalSeasons&&result.season&&result.season>result.totalSeasons||result.episodesPerSeason&&result.episode&&result.episode>result.episodesPerSeason)throw new Error('invalid_progress');
    if(d.rating!==undefined){if(typeof d.rating!=='number'||!Number.isFinite(d.rating)||d.rating<0||d.rating>10)throw new Error('invalid_rating');result.rating=d.rating;}
    const poster=stringField(d.posterUrl,2000);if(poster){const url=new URL(poster);if(url.origin!=='https://image.tmdb.org'||!/^\/t\/p\/w500\/[a-zA-Z0-9_.-]+$/.test(url.pathname))throw new Error('invalid_url');result.posterUrl=url.href;}
    const url=stringField(d.trailerUrl,2000); if(url){if(!safeUrl(url))throw new Error('invalid_url');result.trailerUrl=safeUrl(url);}
    return result;
  }
  if(kind==='recipe') {
    const lines=(v:unknown):string[]=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>200||v.some(x=>typeof x!=='string'||x.length>2000))throw new Error('invalid_recipe');return v.map(x=>String(x).trim()).filter(Boolean);};
    const result:RecipeDetails={ingredients:lines(d.ingredients),steps:lines(d.steps)};
    if(d.caloriesPerServing!==undefined){if(typeof d.caloriesPerServing!=='number'||!Number.isFinite(d.caloriesPerServing)||d.caloriesPerServing<=0||d.caloriesPerServing>20000)throw new Error('invalid_calories');result.caloriesPerServing=d.caloriesPerServing;}
    if(d.servings!==undefined){if(!Number.isInteger(d.servings)||Number(d.servings)<1||Number(d.servings)>1000)throw new Error('invalid_servings');result.servings=Number(d.servings);}
    if(d.cookMinutes!==undefined){if(!Number.isInteger(d.cookMinutes)||Number(d.cookMinutes)<1||Number(d.cookMinutes)>10080)throw new Error('invalid_recipe');result.cookMinutes=Number(d.cookMinutes);}
    if(d.plannedDate)result.plannedDate=calendarDate(d.plannedDate);
    const notes=stringField(d.notes,10000);if(notes)result.notes=notes;
    if(d.ingredientAmounts!==undefined){
      if(!Array.isArray(d.ingredientAmounts)||d.ingredientAmounts.length>200)throw new Error('invalid_ingredient');
      const seen=new Set<string>();result.ingredientAmounts=d.ingredientAmounts.map(raw=>{
        const a=raw as IngredientAmount;
        if(!a||typeof a.ingredient!=='string'||!result.ingredients.includes(a.ingredient)||seen.has(a.ingredient)||typeof a.quantity!=='number'||!Number.isFinite(a.quantity)||a.quantity<=0||a.quantity>1000000)throw new Error('invalid_ingredient');
        seen.add(a.ingredient);const unit=stringField(a.unit,40);return {ingredient:a.ingredient,quantity:a.quantity,...(unit?{unit}:{})};
      });
    }
    return result;
  }
  if(kind==='product') {
    const result:ProductDetails={};
    for(const key of ['brand','model'] as const){const v=stringField(d[key],300);if(v)result[key]=v;}
    if(d.productCategory!==undefined){if(!['beauty','clothing','tech','home','other'].includes(String(d.productCategory)))throw new Error('invalid_product_category');result.productCategory=d.productCategory as ProductCategory;}
    for(const key of ['attributes','ingredientsText','volume'] as const){const v=stringField(d[key],10000);if(v)result[key]=v;}
    if(d.purchasedOn)result.purchasedOn=calendarDate(d.purchasedOn);
    if(d.repurchaseDays!==undefined){if(!Number.isInteger(d.repurchaseDays)||Number(d.repurchaseDays)<1||Number(d.repurchaseDays)>3650)throw new Error('invalid_recurrence');result.repurchaseDays=Number(d.repurchaseDays);}
    if(d.priceAlert!==undefined){const a=d.priceAlert as ProductDetails['priceAlert'];if(!a||!['any','target','percent'].includes(a.mode)||typeof a.enabled!=='boolean'||a.mode!=='any'&&(typeof a.value!=='number'||!Number.isFinite(a.value)||a.value<=0||a.mode==='percent'&&a.value>100))throw new Error('invalid_alert');result.priceAlert={mode:a.mode,enabled:a.enabled,...(a.value!==undefined?{value:a.value}:{})};}
    const variant=stringField(d.variant,200);if(variant)result.variant=variant;
    if(d.priceMinor!==undefined){if(!Number.isSafeInteger(d.priceMinor)||Number(d.priceMinor)<0)throw new Error('invalid_price');result.priceMinor=Number(d.priceMinor);if(typeof d.currency!=='string'||!/^[A-Z]{3}$/.test(d.currency))throw new Error('invalid_currency');result.currency=d.currency;}
    if(d.offers!==undefined){if(!Array.isArray(d.offers)||d.offers.length>50)throw new Error('invalid_offers');result.offers=d.offers.map(raw=>{const o=raw as PriceOffer;if(o?.observedAt)calendarDate(o.observedAt.slice(0,10));if(!o||!stringField(o.id,100)||!stringField(o.store,100)||!Number.isSafeInteger(o.priceMinor)||o.priceMinor<0||!/^[A-Z]{3}$/.test(o.currency)||typeof o.variant!=='string'||o.variant.length>200||!Number.isFinite(Date.parse(o.observedAt))||!safeUrl(o.sourceUrl)||o.previousPriceMinor!==undefined&&(!Number.isSafeInteger(o.previousPriceMinor)||o.previousPriceMinor<0))throw new Error('invalid_offers');if(o.shippingMinor!==undefined&&(!Number.isSafeInteger(o.shippingMinor)||o.shippingMinor<0||!Number.isSafeInteger(o.priceMinor+o.shippingMinor))||o.availability!==undefined&&!['in_stock','out_of_stock','unknown'].includes(o.availability))throw new Error('invalid_offers');return {...o};});if(d.currency!==undefined){if(typeof d.currency!=='string'||!/^[A-Z]{3}$/.test(d.currency))throw new Error('invalid_currency');result.currency=d.currency;}}
    return result;
  }
  if(kind==='shopping_item'){const result:ShoppingDetails={};if(d.quantity!==undefined){if(typeof d.quantity!=='number'||!Number.isFinite(d.quantity)||d.quantity<=0||d.quantity>1000000)throw new Error('invalid_quantity');result.quantity=d.quantity;}const unit=stringField(d.unit,40);if(unit)result.unit=unit;return result;}
  if(kind==='task') {
    if(d.priority!==undefined&&!['normal','high'].includes(String(d.priority)))throw new Error('invalid_priority');
    const result:TaskDetails={priority:(d.priority??'normal') as TaskDetails['priority']};
    if(d.dueDate){const date=String(d.dueDate);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('invalid_date');result.dueDate=date;}
    if(d.dueTime!==undefined){if(typeof d.dueTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.dueTime))throw new Error('invalid_time');result.dueTime=d.dueTime;}
    const recurrence=validateRecurrence(d.recurrence);if(recurrence){if(!result.dueDate)throw new Error('invalid_date');result.recurrence=recurrence;}
    if(d.anchorDay!==undefined){if(!Number.isInteger(d.anchorDay)||Number(d.anchorDay)<1||Number(d.anchorDay)>31)throw new Error('invalid_date');result.anchorDay=Number(d.anchorDay);}
    if(d.history!==undefined){if(!Array.isArray(d.history)||d.history.length>10000)throw new Error('invalid_history');result.history=d.history.map(h=>{if(!h||!['completed','skipped'].includes(h.action)||!Number.isFinite(Date.parse(h.finishedAt)))throw new Error('invalid_history');return {scheduledDate:calendarDate(h.scheduledDate),finishedAt:h.finishedAt,action:h.action};});}
    return result;
  }
  return {};
}
export function validateAttachment(a:Attachment):void {
  if(!['image/jpeg','image/png','image/webp'].includes(a.mime)||!Number.isInteger(a.size)||a.size<1||a.size>10*1024*1024||!a.uri||!a.id)throw new Error('invalid_image');
}
export function makeItem(input:ItemInput):Item {
  const text=input.text.trim();
  if(!text)throw new Error('empty');
  if(text.length>20000)throw new Error('long');
  const kind=input.kind??(safeUrl(text)?'link':input.attachments?.length?'image':'note');
  if(!kinds.includes(kind))throw new Error('invalid_kind');
  const category=input.category??'general';
  if(!['general','home','work','shopping','entertainment','food'].includes(category))throw new Error('invalid_category');
  const attachments=input.attachments??[];
  if(attachments.length>3)throw new Error('too_many_images');
  attachments.forEach(validateAttachment);
  const source=input.sourceUrl?.trim(); if(source&&!safeUrl(source))throw new Error('invalid_url');
  if(input.tags!==undefined&&(!Array.isArray(input.tags)||input.tags.length>30||input.tags.some(x=>typeof x!=='string'||x.length>100)))throw new Error('invalid_tags');
  const now=new Date().toISOString();
  return {id:input.id??globalThis.crypto.randomUUID(),title:(input.title?.trim()||text.split('\n')[0]).slice(0,120),body:text,kind,category,...(input.tags?{tags:[...new Set(input.tags.map(x=>x.trim()).filter(Boolean))]}:{}),sourceUrl:source?safeUrl(source):safeUrl(text),details:detailsFor(kind,input.details),attachments,inboxStatus:'unprocessed',completed:false,version:1,createdAt:now,updatedAt:now} as Item;
}
export function validateState(value:unknown):State {
  const s=value as State;
  if(!s||s.schemaVersion!==1||!Array.isArray(s.items)||!Array.isArray(s.appliedTemplates)||!s.settings||!['ru','uk','en'].includes(s.settings.locale)||!['light','dark','minimal','mist','warm','soft'].includes(s.settings.theme))throw new Error('storage_invalid');
  if(s.uiPreferences!==undefined&&(typeof s.uiPreferences!=='object'||s.uiPreferences===null||Array.isArray(s.uiPreferences)||Object.entries(s.uiPreferences).some(([k,v])=>k.length>80||typeof v!=='string'||v.length>120)||Object.keys(s.uiPreferences).length>50))throw new Error('storage_invalid');
  if(s.planner!==undefined)validatePlanner(s.planner);
  if(s.vault!==undefined)validateVault(s.vault);
  if(s.healthRecords!==undefined)validateMedicalRecords(s.healthRecords);
  const ids=new Set<string>();
  for(const item of s.items){if(!item.id||ids.has(item.id)||!Number.isInteger(item.version)||item.version<1||!['unprocessed','confirmed'].includes(item.inboxStatus)||typeof item.completed!=='boolean'||item.lifecycle!==undefined&&!['active','hidden','archived','trashed'].includes(item.lifecycle)||item.lifecycleChangedAt!==undefined&&!Number.isFinite(Date.parse(item.lifecycleChangedAt)))throw new Error('storage_invalid');ids.add(item.id);if(item.processing){if(!['pending','processing','needs_review','processed','failed'].includes(item.processing.status))throw new Error('storage_invalid');if(item.processing.candidate)makeItem(item.processing.candidate);}
    makeItem({...item,text:item.body});}
  return s;
}
