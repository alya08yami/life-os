import type {PlannerState,RecordObject} from '@life-os/domain/planner';

/**
 * Finding records that the first launch created as examples (planner/seed.ts → initializePlanner).
 *
 * A record is offered for removal only when ALL of these hold:
 * - it belongs to the first-launch batch: its creation time equals the one shared by the seeded records;
 * - it was never changed: updatedAt === createdAt, not archived, and no purchase/completion history of its own
 *   (only the `initial-…` entries the first launch wrote);
 * - its content is exactly what the first launch writes today (type, section, title, text, status, flags, data);
 * - it is not a record carried over from older data (ids `medical-…` / `migrated-…`).
 * A title match alone is never enough. Records that look like examples but fail a check are listed separately,
 * with the reason, and cannot be selected.
 */
export type DemoLookalike={object:RecordObject;reason:string};
export type DemoScan={batchTime?:string;candidates:RecordObject[];lookalikes:DemoLookalike[]};

/** Data fields that legitimately differ between launches (dates of the week, current year). */
const TIME_FIELDS=new Set(['plan','year','plannedDate']);
const signature=(o:Pick<RecordObject,'type'|'section'|'title'>)=>o.type+'\u0000'+o.section+'\u0000'+o.title;
const stable=(value:unknown):string=>JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const dataOf=(o:RecordObject)=>Object.fromEntries(Object.entries(o.data??{}).filter(([k])=>!TIME_FIELDS.has(k)));
const attachmentsOf=(o:RecordObject)=>(o.attachments??[]).map(a=>[a.name,a.mime,a.uri]);

function sameContent(a:RecordObject,b:RecordObject){
 return a.description===b.description&&a.status===b.status&&(a.notes??'')===(b.notes??'')&&!!a.pinned===!!b.pinned&&!!a.favorite===!!b.favorite
  &&(a.completedAt??'')===(b.completedAt??'')&&stable(dataOf(a))===stable(dataOf(b))&&stable(attachmentsOf(a))===stable(attachmentsOf(b));
}

/** `fresh` = what the first launch would write now (initializePlanner([])), used as the reference for content. */
export function scanDemoRecords(state:PlannerState|undefined,fresh:PlannerState):DemoScan{
 if(!state)return {candidates:[],lookalikes:[]};
 const reference=new Map<string,RecordObject[]>();
 for(const o of fresh.objects){const key=signature(o);reference.set(key,[...(reference.get(key)??[]),o]);}
 const lookalikes=state.objects.filter(o=>reference.has(signature(o)));
 // The first-launch batch: the creation time shared by the most example-shaped records (all seeded at one instant).
 const counts=new Map<string,number>();
 for(const o of lookalikes)counts.set(o.createdAt,(counts.get(o.createdAt)??0)+1);
 let batchTime:string|undefined;let best=0;
 for(const [time,count] of counts)if(count>best){best=count;batchTime=time;}
 if(best<5)batchTime=undefined;
 const ownHistory=new Map<string,number>();
 for(const h of state.history??[])if(!String(h.id).startsWith('initial-'))ownHistory.set(h.objectId,(ownHistory.get(h.objectId)??0)+1);
 const candidates:RecordObject[]=[];const rejected:DemoLookalike[]=[];
 for(const o of lookalikes){
  const reason=
   o.id.startsWith('medical-')||o.id.startsWith('migrated-')?'перенесено из ваших прежних данных':
   !batchTime||o.createdAt!==batchTime?'создано не при первом запуске':
   o.updatedAt!==o.createdAt?'запись изменялась':
   o.archivedAt?'запись в архиве':
   ownHistory.has(o.id)?'есть отметки покупок или выполнения':
   !(reference.get(signature(o))??[]).some(r=>sameContent(o,r))?'содержимое отличается от примера':
   undefined;
  if(reason)rejected.push({object:o,reason});else candidates.push(o);
 }
 return {batchTime,candidates,lookalikes:rejected};
}

/** Removes exactly the given records (and their first-launch history entries); everything else is untouched. */
export function removeDemoRecords(state:PlannerState,ids:ReadonlySet<string>):PlannerState{
 return {...state,objects:state.objects.filter(o=>!ids.has(o.id)),history:(state.history??[]).filter(h=>!(ids.has(h.objectId)&&String(h.id).startsWith('initial-')))};
}
