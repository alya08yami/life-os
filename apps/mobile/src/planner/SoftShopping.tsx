import React,{useState} from 'react';
import {Image,Pressable,ScrollView,Share,View} from 'react-native';
import type {RecordObject} from '@life-os/domain/planner';
import {comparableOffers} from '@life-os/domain/planner';
import {Icon} from '../components/Icon';
import {SoftPressable} from '../design/SoftPressable';
import {palette,shadows} from '../design/system';
import {usePlanner} from './context';
import {T,pictureSource} from './ui';

/**
 * «Покупки и желания» in Soft Future: dense, calm product rows and a product page that reads top-down.
 * Prices come from exactly the same calculation as before (confirmed offers → lowest price, else the saved price);
 * discounts, favourites, purchase marks, offers and links are the existing data and actions.
 */
export const productPrice=(item:RecordObject)=>{
 const d=item.data;
 const offers=comparableOffers({brand:d.brand,model:d.model,package:d.variant},d.currency??'₴',d.offers??[]);
 return {offers,price:offers[0]?.price??d.price,currency:d.currency??'₴'};
};
const money=(value:any,currency:string)=>`${Number(value).toLocaleString('ru-RU')} ${currency}`;
const surface={backgroundColor:'rgba(251,249,250,0.94)',borderRadius:18,borderWidth:1,borderColor:'rgba(41,38,45,0.06)',overflow:'hidden' as const,...shadows[1]};

function Discount({value,large=false}:{value:any;large?:boolean}){
 return <View style={{paddingHorizontal:large?8:6,paddingVertical:large?3:2,borderRadius:7,backgroundColor:'rgba(78,138,120,0.12)'}}>
  <T size={large?12.5:11.5} bold color="#2F6B5A">{String(value)}%</T>
 </View>;
}

export function SoftProductList({rows,open,lists,list,setList,showLists}:{rows:RecordObject[];open:(o:RecordObject)=>void;lists:string[];list:string;setList:(v:string)=>void;showLists:boolean}){
 return <>
  {showLists&&(lists.length
   ?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,paddingRight:4}}>
     {['',...lists].map(name=>{const on=list===name;return <Pressable key={name||'all'} accessibilityRole="button" accessibilityState={{selected:on}} aria-selected={on} onPress={()=>setList(name)}
      style={{minHeight:36,paddingHorizontal:13,borderRadius:18,justifyContent:'center',backgroundColor:on?palette.graphite:'rgba(251,249,250,0.94)',borderWidth:1,borderColor:on?palette.graphite:'rgba(41,38,45,0.08)'}}>
      <T size={13} color={on?'#f4f0f2':palette.ink}>{name||'Все списки'}</T>
     </Pressable>;})}
    </ScrollView>
   :<T size={13} color={palette.inkMuted} style={{paddingHorizontal:4}}>Списков пока нет. Укажите «Список покупок» в карточке товара — он появится здесь.</T>)}
  {rows.length>0&&<View style={{...surface,paddingVertical:2}}>{rows.map((item,i)=><ProductRow key={item.id} item={item} first={i===0} onPress={()=>open(item)}/>)}</View>}
 </>;
}

function ProductRow({item,first,onPress}:{item:RecordObject;first:boolean;onPress:()=>void}){
 const {patch}=usePlanner();
 const [failed,setFailed]=useState(false);
 const source=pictureSource(item);
 const {price,currency}=productPrice(item);
 const bought=item.status==='completed';
 return <View style={{flexDirection:'row',alignItems:'center',minHeight:64,borderTopWidth:first?0:1,borderColor:'rgba(41,38,45,0.08)',marginHorizontal:first?0:0}}>
  <SoftPressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress}
   style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,paddingLeft:12}}>
   {source&&!failed&&<Image source={source} resizeMode="cover" onError={()=>setFailed(true)} style={{width:48,height:48,borderRadius:12,backgroundColor:'#eee8eb'}}/>}
   <View style={{flex:1,minWidth:0,gap:3}}>
    <T size={14} lines={2} color={bought?'#7d747c':palette.ink} style={{lineHeight:19}}>{item.title}</T>
    <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',columnGap:8,rowGap:3}}>
     {price?<T size={15.5} bold color={bought?'#7d747c':palette.ink} style={{letterSpacing:-0.2}}>от {money(price,currency)}</T>
      :<T size={13} color="#8a8189">Цена не найдена</T>}
     {!!item.data.discount&&!bought&&<Discount value={item.data.discount}/>}
     {bought&&<View style={{flexDirection:'row',alignItems:'center',gap:3}}><Icon name="check" size={13} color={palette.positive} strokeWidth={2}/><T size={12} color="#2F6B5A">Куплено</T></View>}
    </View>
   </View>
  </SoftPressable>
  <Pressable accessibilityRole="button" accessibilityLabel={'Желание: '+item.title} accessibilityState={{selected:!!item.favorite}} aria-selected={!!item.favorite}
   onPress={()=>patch(item.id,{favorite:!item.favorite}).catch(()=>{})} style={{width:48,height:56,alignItems:'center',justifyContent:'center'}}>
   <Icon name="heart" size={20} filled={!!item.favorite} color={item.favorite?palette.danger:'#a39aa2'}/>
  </Pressable>
 </View>;
}

/** Product page. Colour/size selection state belongs to the caller, exactly as before. */
export function SoftProductDetail({item,color,setColor,size,setSize,link,onSave}:{item:RecordObject;color:number;setColor:(i:number)=>void;size:string;setSize:(s:string)=>void;link:(url:string)=>void;onSave:()=>void}){
 const {patch,mark}=usePlanner();
 const [failed,setFailed]=useState(false);
 const d=item.data;
 const {offers,price,currency}=productPrice(item);
 const source=pictureSource(item);
 const identity=[d.brand,d.model].filter(Boolean).join(' ');
 const bought=item.status==='completed';
 return <View style={{gap:16}}>
  {source&&!failed&&<Image source={source} resizeMode="cover" onError={()=>setFailed(true)} style={{width:'100%',height:220,borderRadius:20,backgroundColor:'#eee8eb'}}/>}
  <View style={{gap:6}}>
   <T size={23} bold style={{letterSpacing:-0.3,lineHeight:29}}>{item.title}</T>
   {!!identity&&identity.toLocaleLowerCase('ru')!==item.title.toLocaleLowerCase('ru')&&<T size={13.5} color={palette.inkMuted}>{identity}</T>}
   <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10,marginTop:4}}>
    {price?<T size={26} bold style={{letterSpacing:-0.4,lineHeight:32}}>от {money(price,currency)}</T>:<T size={15} color="#8a8189">Цена не найдена</T>}
    {!!d.discount&&<Discount value={d.discount} large/>}
   </View>
  </View>
  {(d.colors??[]).length>0&&<View style={{gap:8}}>
   <T size={12.5} color={palette.inkMuted}>Цвет</T>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
    {(d.colors??[]).map((s:string,i:number)=><Pressable key={s} accessibilityRole="button" accessibilityLabel={'Цвет '+(i+1)} accessibilityState={{selected:color===i}} aria-selected={color===i} onPress={()=>setColor(i)} hitSlop={6}
     style={{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:color===i?palette.graphite:'transparent'}}>
     <View style={{width:26,height:26,borderRadius:13,backgroundColor:s,borderWidth:1,borderColor:'rgba(41,38,45,0.15)'}}/>
    </Pressable>)}
   </View>
  </View>}
  {d.sizes?.length>0&&<View style={{gap:8}}>
   <T size={12.5} color={palette.inkMuted}>Размер</T>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
    {d.sizes.map((s:string)=>{const on=size===s;return <Pressable key={s} accessibilityRole="button" accessibilityState={{selected:on}} aria-selected={on} onPress={()=>setSize(s)}
     style={{minWidth:52,height:40,paddingHorizontal:10,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:on?palette.graphite:'rgba(41,38,45,0.06)'}}>
     <T size={13.5} bold={on} color={on?'#f4f0f2':palette.ink}>{s}</T>
    </Pressable>;})}
   </View>
  </View>}
  <View style={{gap:8}}>
   <T size={15} bold>Где дешевле</T>
   {offers.length>0?<View style={surface}>{offers.map((offer:any,i:number)=><Pressable key={i} accessibilityRole="link" accessibilityLabel={offer.store+', '+offer.price+' '+currency} onPress={()=>link(offer.url)}
    style={{flexDirection:'row',alignItems:'center',gap:10,minHeight:52,paddingHorizontal:14,borderTopWidth:i?1:0,borderColor:'rgba(41,38,45,0.08)'}}>
    <Icon name="bag" size={18} color="#6E6670"/>
    <T size={14.5} lines={1} style={{flex:1}}>{offer.store}</T>
    {i===0&&<T size={11.5} color="#2F6B5A">дешевле всего</T>}
    <T size={14.5} bold={i===0} color={i===0?'#2F6B5A':palette.ink}>{money(offer.price,currency)}</T>
    <Icon name="next" size={15} color="#b0a8b0"/>
   </Pressable>)}</View>
   :<T size={13} color={palette.inkMuted} style={{lineHeight:19}}>{d.example?'Демонстрационный товар. Актуальные предложения магазинов не загружены.':'Добавьте ссылку на магазин или подключите поиск предложений.'}</T>}
   {!!d.sourceUrl&&<Pressable accessibilityRole="link" onPress={()=>link(d.sourceUrl)} style={{minHeight:40,justifyContent:'center'}}><T size={13.5} color={palette.mauve}>Открыть магазин ↗</T></Pressable>}
  </View>
  <View style={{gap:8}}>
   <SoftPressable accessibilityRole="button" accessibilityState={{selected:!!item.favorite}} aria-selected={!!item.favorite}
    onPress={()=>patch(item.id,{favorite:!item.favorite,data:{...d,selectedColor:color,selectedSize:size}}).catch(()=>{})}
    style={{minHeight:48,borderRadius:14,backgroundColor:item.favorite?palette.graphite:'rgba(251,249,250,0.94)',borderWidth:item.favorite?0:1,borderColor:'rgba(41,38,45,0.1)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}}>
    <Icon name="heart" size={17} filled={!!item.favorite} color={item.favorite?'#f4f0f2':palette.ink}/><T size={14} bold color={item.favorite?'#f4f0f2':palette.ink}>{item.favorite?'В желаниях':'Добавить в желания'}</T>
   </SoftPressable>
   <View style={{flexDirection:'row',gap:8}}>
    <Secondary icon="check" label={bought?'Куплено ✓':'Куплено'} selected={bought} onPress={()=>bought?patch(item.id,{status:'active',purchasedAt:undefined}).catch(()=>{}):mark(item,'purchase').catch(()=>{})}/>
    <Secondary icon="bookmark" label="Сохранить" onPress={onSave}/>
    <Secondary icon="share" label="Поделиться" onPress={()=>Share.share({message:item.title+(d.sourceUrl?' '+d.sourceUrl:'')}).catch(()=>{})}/>
   </View>
  </View>
 </View>;
}

function Secondary({icon,label,onPress,selected=false}:{icon:'check'|'bookmark'|'share';label:string;onPress:()=>void;selected?:boolean}){
 return <SoftPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress}
  style={{flex:1,minHeight:56,borderRadius:13,backgroundColor:selected?'rgba(78,138,120,0.12)':'rgba(251,249,250,0.94)',borderWidth:1,borderColor:'rgba(41,38,45,0.08)',alignItems:'center',justifyContent:'center',gap:3,paddingHorizontal:4}}>
  <Icon name={icon} size={17} color={selected?'#2F6B5A':palette.ink}/><T size={12} lines={1} color={selected?'#2F6B5A':palette.ink}>{label}</T>
 </SoftPressable>;
}
