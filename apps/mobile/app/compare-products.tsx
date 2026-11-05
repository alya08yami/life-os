import {useCatalog} from '../src/catalog/CatalogContext';
import React,{useState} from 'react';import {View,ScrollView,Pressable} from 'react-native';import {router,useLocalSearchParams} from 'expo-router';
import {selectProducts,selectComparison,pricePresentation,formatPrice} from '@life-os/domain/catalog';
import {useApp} from '../src/context';import {demoProducts,productModel} from '../src/catalog/demo';import type {ProductModel} from '../src/catalog/demo';
import {AppShell} from '../src/components/AppShell';import {CatalogImage} from '../src/components/CatalogImage';import {Heading,Label,Card,Empty,useColors} from '../src/design/primitives';import type {TextKey} from '../src/i18n';

import {FrozenDesign} from '../src/design/scope';
// Part of «Покупки и желания»: frozen, keeps its current look under every theme.
export default function CompareProducts(){return <FrozenDesign><CompareProductsScreen/></FrozenDesign>;}
function CompareProductsScreen(){
  const {mode,ids}=useLocalSearchParams<{mode?:string;ids?:string}>();const {state,t,busy}=useApp();const {setComparison}=useCatalog();const c=useColors();const demo=mode==='demo';
  const personal=selectProducts(state.items.filter(i=>i.inboxStatus==='confirmed'),{filter:'all',sort:'title',currency:'UAH'});
  const products=demo?demoProducts:personal.map(productModel);
  const [selected,setSelected]=useState<string[]>(()=>[...new Set((ids??'').split(','))].filter(id=>products.some(p=>p.id===id)).slice(0,3));
  const validIds=selected.filter(id=>products.some(p=>p.id===id));
  let compared:ProductModel[]=[];
  if(validIds.length>=2)compared=demo?validIds.map(id=>products.find(p=>p.id===id)!):selectComparison(personal,validIds).map(productModel);
  const toggle=(id:string)=>{const next=selected.includes(id)?selected.filter(v=>v!==id):selected.length<3?[...selected,id]:selected;setSelected(next);setComparison(next);};
  const fact=(key:TextKey,read:(product:ProductModel)=>string)=> <View key={key} style={{flexDirection:'row',borderBottomWidth:1,borderBottomColor:c.line}}><View style={{width:100,padding:12}}><Label size={12} muted>{t(key)}</Label></View>{compared.map(product=><View key={product.id} style={{width:150,padding:12}}><Label size={12}>{read(product)}</Label></View>)}</View>;
  return <AppShell title={t('comparison')} onBack={()=>router.replace('/wishlist')}><Label>{t('comparisonChoose')}</Label>{demo&&<Label muted size={11}>{t('demoNotice')}</Label>}
    <Card>{products.length?products.map(product=>{const checked=validIds.includes(product.id),disabled=busy||!checked&&validIds.length>=3;return <Pressable key={product.id} accessibilityRole="checkbox" accessibilityLabel={product.title} aria-checked={checked} accessibilityState={{checked,disabled}} disabled={disabled} onPress={()=>toggle(product.id)} style={{minHeight:48,flexDirection:'row',gap:12,alignItems:'center',opacity:disabled?.45:1}}><View style={{width:22,height:22,borderWidth:1,borderColor:c.accent,borderRadius:6,alignItems:'center',justifyContent:'center',backgroundColor:checked?c.soft:'transparent'}}><Label>{checked?'✓':''}</Label></View><Label>{product.title}</Label></Pressable>;}):<Empty/>}<Label muted size={11}>{validIds.length}/3 · {t('comparisonLimit')}</Label></Card>
    {!!compared.length&&<ScrollView horizontal showsHorizontalScrollIndicator><View testID="comparison-table" style={{borderRadius:18,borderWidth:1,borderColor:c.line,overflow:'hidden'}}><View style={{flexDirection:'row'}}><View style={{width:100}}/>{compared.map(product=><View key={product.id} style={{width:150,padding:10,gap:8}}><CatalogImage source={product.image} label={product.title} ratio={.9}/><Heading size={23}>{product.title}</Heading></View>)}</View>
      {fact('brand',p=>p.details.brand??t('unknown'))}{fact('model',p=>p.details.model??t('unknown'))}{fact('variant',p=>p.details.variant??t('unknown'))}
      {fact('price',p=>{const price=pricePresentation(p.details);return price?formatPrice(price.amountMinor,price.currency,state.settings.locale)+' · '+t(p.demo?'examplePrice':price.source==='manual'?'manualPrice':'offers'):t('priceUnknown');})}
      {fact('deliveredTotal',p=>{const price=pricePresentation(p.details);return price?.totalMinor!==undefined?formatPrice(price.totalMinor,price.currency,state.settings.locale):t('shippingUnknown');})}
      {fact('volume',p=>p.details.volume??t('unknown'))}{fact('attributes',p=>p.details.attributes??t('unknown'))}{fact('ingredientsText',p=>p.details.ingredientsText??t('unknown'))}{fact('stores',p=>p.details.offers?.map(o=>o.store).join(', ')||t('unknown'))}{fact('availability',p=>{const price=pricePresentation(p.details);const availability=p.details.offers?.find(o=>o.id===price?.offerId)?.availability;return t(availability??'unknown');})}
      {fact('observedAt',p=>{const price=pricePresentation(p.details);return p.details.offers?.find(o=>o.id===price?.offerId)?.observedAt.slice(0,10)??t('unknown');})}
    </View></ScrollView>}
    <Label muted size={12}>{t('comparisonFacts')}</Label>
  </AppShell>;
}
