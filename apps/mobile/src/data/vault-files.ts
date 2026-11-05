import type {VaultFile} from '@life-os/domain/vault';
export const privateFilesSupported=false;
export async function pickPrivateDocument():Promise<VaultFile|undefined>{throw new Error('not_available');}
export function openPrivateDocument(_file:VaultFile):void{}
