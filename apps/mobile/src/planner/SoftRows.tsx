import React,{useState} from 'react';
import {Image,Linking,Pressable,View} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {Icon} from '../components/Icon';
import {SoftPressable} from '../design/SoftPressable';
import {palette} from '../design/system';
import {T,pictureSource} from './ui';

/**
 * «Поездки» and «Гардероб» rows in Soft Future: compact cards, a real photo when there is one,
 * otherwise a small neutral symbol instead of an empty grey picture. Same records, links and actions.
 */
export function SoftPlaceRow({item,section,onPress}:{item:RecordObject;section:'travel'|'wardrobe';onPress:()=>void}){
 const [failed,setFailed]=useState(false);
 const source=pictureSource(item);
 const photo=!!source&&!failed;
 const d=item.data;
 const visited=section==='travel'&&item.status==='completed';
 const subtitle:string|undefined=section==='travel'?d.address:d.season;
 const date=item.completedAt?new Date(item.completedAt).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):undefined;
 return <SoftPressable accessibilityRole="button" accessibilityLabel={[item.title,subtitle,visited?'посещено':undefined].filter(Boolean).join(', ')} onPress={onPress}
  style={{flexDirection:'row',alignItems:'center',gap:12,padding:10,paddingRight:12,minHeight:section==='wardrobe'&&photo?84:68,borderRadius:16,
   backgroundColor:'rgba(251,249,250,0.94)',borderWidth:1,borderColor:'rgba(41,38,45,0.06)'}}>
  {photo
   ?<Image source={source} resizeMode="cover" onError={()=>setFailed(true)}
     style={{width:section==='wardrobe'?60:56,height:section==='wardrobe'?64:56,borderRadius:12,backgroundColor:'#eee8eb'}}/>
   :<View style={{width:44,height:44,marginHorizontal:section==='wardrobe'?8:6,borderRadius:22,backgroundColor:'rgba(96,87,97,0.08)',alignItems:'center',justifyContent:'center'}}>
     <Icon name={section==='travel'?'map':'shirt'} size={19} color="#6E6670"/>
    </View>}
  <View style={{flex:1,minWidth:0,gap:2}}>
   <T size={15} bold lines={2} style={{lineHeight:20}}>{item.title}</T>
   {!!subtitle&&<T size={13} lines={2} color="#5f5862">{subtitle}</T>}
   {(visited||section==='travel'&&d.sourceUrl)&&<View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',columnGap:12,rowGap:2,marginTop:3}}>
    {visited&&<View style={{flexDirection:'row',alignItems:'center',gap:4}}>
     <Icon name="check" size={13} color={palette.positive} strokeWidth={2}/><T size={12.5} color="#2F6B5A">Посещено{date?' · '+date:''}</T>
    </View>}
    {section==='travel'&&!!d.sourceUrl&&<Pressable accessibilityRole="link" accessibilityLabel={'Открыть в Google Maps: '+item.title} hitSlop={8}
     onPress={()=>Linking.openURL(d.sourceUrl).catch(()=>{})} style={{minHeight:28,justifyContent:'center'}}>
     <T size={12.5} color={palette.mauve}>Открыть в картах ↗</T>
    </Pressable>}
   </View>}
  </View>
 </SoftPressable>;
}
