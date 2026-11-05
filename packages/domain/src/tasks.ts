import type {Item} from './index.ts';
import {isActive} from './lifecycle.ts';
export type TaskFilter='all'|'today'|'week'|'later'|'completed'|'recurring';
export function selectTasks(items:Item[],filter:TaskFilter,today:string):Item[]{
  const end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+6);const weekEnd=end.toISOString().slice(0,10);
  return items.filter(item=>{
    if(!isActive(item)||item.inboxStatus!=='confirmed'||!['task','shopping_item'].includes(item.kind))return false;
    if(filter==='completed')return item.completed||item.kind==='task'&&!!item.details.history?.length;
    if(filter==='recurring')return item.kind==='task'&&!!item.details.recurrence;
    if(item.completed)return false;
    if(filter==='all')return true;
    const due=item.kind==='task'?item.details.dueDate:undefined;
    if(filter==='today')return !!due&&due<=today;
    if(filter==='week')return !!due&&due<=weekEnd;
    return !due||due>weekEnd;
  });
}
export function localCalendarDate(date=new Date()):string{return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
