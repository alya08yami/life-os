import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import type {Attachment} from '@life-os/domain';
import {validateAttachment} from '@life-os/domain';
async function fromAsset(asset:ImagePicker.ImagePickerAsset):Promise<Attachment>{const file=asset.file;if(!file)throw new Error('invalid_image');
  if(asset.width*asset.height>20_000_000)throw new Error('invalid_image');
  const attachment:Attachment={id:Crypto.randomUUID(),mime:file.type,size:file.size,uri:'pending'};validateAttachment(attachment);
  attachment.uri=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('image_read_failed'));reader.readAsDataURL(file);});
  const image=new globalThis.Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('image_read_failed'));image.src=attachment.uri;});
  const canvas=document.createElement('canvas');const scale=Math.min(1,640/image.naturalWidth,640/image.naturalHeight);canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const context=canvas.getContext('2d');if(!context)throw new Error('image_thumbnail_failed');context.drawImage(image,0,0,canvas.width,canvas.height);attachment.thumbnailUri=canvas.toDataURL('image/jpeg',.82);
  return attachment;
}
export async function pickImage():Promise<Attachment|undefined>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1});return result.canceled?undefined:fromAsset(result.assets[0]);}
export async function pickImages():Promise<Attachment[]>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1,allowsMultipleSelection:true,selectionLimit:10});return result.canceled?[]:Promise.all(result.assets.slice(0,10).map(fromAsset));}
export async function recognitionImage(a:Attachment):Promise<{base64:string;mime:string}>{const uri=a.thumbnailUri??a.uri;const match=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(uri);if(!match)throw new Error('invalid_image');return {mime:match[1],base64:match[2]};}

export async function discardImage(_attachment:Attachment):Promise<void>{/* Image bytes are owned by the IndexedDB item row. */}

export async function takePhoto():Promise<Attachment|undefined>{const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:1});return result.canceled?undefined:fromAsset(result.assets[0]);}
export async function importImageUri(_uri:string,_mime?:string):Promise<Attachment>{throw new Error('not_available');}
