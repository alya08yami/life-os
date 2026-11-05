import type {Item,State} from '@life-os/domain';import {validateState} from '@life-os/domain';
export async function portableItem(item:Item):Promise<Item>{return item;}
export async function portableBackup(state:State):Promise<State>{return state;}
export async function hydrateBackup(value:unknown,_knownIds:string[]):Promise<State>{return validateState(value);}
