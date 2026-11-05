import {pickPrivateDocument,openPrivateDocument} from '../data/vault-files.native';
import type {FileRef} from '@life-os/domain/planner';
export async function pickFile(documentsOnly=false):Promise<FileRef|undefined>{const f=await pickPrivateDocument(documentsOnly);return f?{id:f.id,name:f.name,mime:f.mime,uri:f.dataUrl,size:Math.ceil(f.dataUrl.length*.75)}:undefined;}
export function openFile(f:FileRef){openPrivateDocument({id:f.id,name:f.name,mime:f.mime as any,dataUrl:f.uri});}
