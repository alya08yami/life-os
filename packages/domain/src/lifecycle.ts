import type {Item,Lifecycle} from './index.ts';
export function getLifecycle(item:Item):Lifecycle{return item.lifecycle??'active';}
export function isActive(item:Item):boolean{return getLifecycle(item)==='active';}
export function isSearchable(item:Item):boolean{return getLifecycle(item)!=='trashed';}
