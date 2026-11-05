import {Image} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import {File,Directory,Paths} from 'expo-file-system';
import {manipulateAsync,SaveFormat} from 'expo-image-manipulator';
import type {Attachment} from '@life-os/domain';
import {validateAttachment} from '@life-os/domain';
async function fromAsset(asset:ImagePicker.ImagePickerAsset):Promise<Attachment>{
if(asset.width*asset.height>20_000_000)throw new Error('invalid_image');
  const source=new File(asset.uri);const id=Crypto.randomUUID();const mime=asset.mimeType??source.type;
  const attachment:Attachment={id,mime,size:source.size,uri:source.uri};validateAttachment(attachment);
  const directory=new Directory(Paths.document,'attachments');directory.create({idempotent:true,intermediates:true});
  const target=new File(directory,id+(mime==='image/png'?'.png':mime==='image/webp'?'.webp':'.jpg'));source.copy(target);attachment.uri=target.uri;
  const thumb=await manipulateAsync(target.uri,[{resize:asset.width>=asset.height?{width:640}:{height:640}}],{compress:.82,format:SaveFormat.JPEG});const thumbFile=new File(directory,id+'-thumb.jpg');new File(thumb.uri).copy(thumbFile);attachment.thumbnailUri=thumbFile.uri;return attachment;
}
export async function pickImage():Promise<Attachment|undefined>{const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted)throw new Error('image_permission');const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1});return result.canceled?undefined:fromAsset(result.assets[0]);}
export async function pickImages():Promise<Attachment[]>{const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted)throw new Error('image_permission');const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1,allowsMultipleSelection:true,selectionLimit:10});return result.canceled?[]:Promise.all(result.assets.slice(0,10).map(fromAsset));}
export async function recognitionImage(a:Attachment):Promise<{base64:string;mime:string}>{return {base64:await new File(a.thumbnailUri??a.uri).base64(),mime:a.thumbnailUri?'image/jpeg':a.mime};}
export async function discardImage(a:Attachment):Promise<void>{const directory=new Directory(Paths.document,'attachments');const prefix=directory.uri.replace(/\/?$/,'/');for(const uri of [a.uri,a.thumbnailUri]){if(uri?.startsWith(prefix)){const file=new File(uri);if(file.exists)file.delete();}}}

export async function importImageUri(uri:string,mime?:string):Promise<Attachment>{const source=new File(uri);const size=await new Promise<{width:number;height:number}>((resolve,reject)=>Image.getSize(uri,(width,height)=>resolve({width,height}),reject));return fromAsset({uri,width:size.width,height:size.height,mimeType:mime??source.type,fileSize:source.size});}
export async function takePhoto():Promise<Attachment|undefined>{const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error('image_permission');const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:1});return result.canceled?undefined:fromAsset(result.assets[0]);}
