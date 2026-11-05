import {goBack} from '../../planner/navigation';
import {ProductHero} from './ProductHero';
import {RelatedSource} from '../RelatedSource';
import {ProductOffersEditor} from '../ProductOffersEditor';
import {ProductActions} from '../ProductActions';
import {RelatedTasks} from '../RelatedTasks';
import {SourcePreview} from '../SourcePreview';
import {getLifecycle} from '@life-os/domain/lifecycle';
import {CardActionsMenu} from '../CardActionsMenu';
import React,{useState} from 'react';import {View,Pressable,Linking} from 'react-native';import {router,useLocalSearchParams} from 'expo-router';
import {safeUrl} from '@life-os/domain';import {pricePresentation,offerPriceChange} from '@life-os/domain/catalog';
import {useApp} from '../../context';import {useCatalog} from '../../catalog/CatalogContext';import {demoProducts,productModel} from '../../catalog/demo';import {AppShell} from '../../components/AppShell';import {CatalogImage} from '../../components/CatalogImage';import {ImageViewer} from '../../components/ImageViewer';import {Icon,IconButton} from '../../components/Icon';import {Heading,Label,Button,Empty,useColors} from '../../design/primitives';import {ItemForm} from '../ItemForm';
export function ProductDetailScreen(){const {id,mode,edit}=useLocalSearchParams<{id:string;mode?:string;edit?:string}>();const {state,t,repo,run,busy}=useApp();const {demoFavorites,favoriteDemo}=useCatalog();const [editing,setEditing]=useState(edit==='1');const [deleting,setDeleting]=useState(false);const [zoom,setZoom]=useState(false);const c=useColors();
  const real=state.items.find(x=>x.id===id&&x.kind==='product');const source=mode==='demo'?demoProducts.find(x=>x.id===id):real?.kind==='product'?productModel(real):undefined;
  if(!source)return <AppShell title={t('product')} onBack={goBack}><Empty/></AppShell>;
  const lifecycle=real?getLifecycle(real):'active';const trashed=lifecycle==='trashed';const product={...source,favorite:source.demo?demoFavorites.has(id):source.favorite};const details=product.details;const price=pricePresentation(details);
  const money=(minor:number,currency:string)=>new Intl.NumberFormat(state.settings.locale==='en'?'en-US':state.settings.locale==='uk'?'uk-UA':'ru-UA',{style:'currency',currency,maximumFractionDigits:2}).format(minor/100);
  const toggle=()=>product.demo?favoriteDemo(product.id):run(()=>repo.favorite(product.id,!product.favorite)).catch(()=>{});
  const fullImage=real?.attachments[0]?{uri:real.attachments[0].uri}:product.image;
  const open=(url:string)=>{const valid=safeUrl(url);if(valid)Linking.openURL(valid).catch(()=>{});};
  return <AppShell title={t('product')} onBack={goBack} right={<IconButton name="heart" label={t(product.favorite?'removeFavorite':'addFavorite')+': '+product.title} filled={product.favorite} onPress={toggle} disabled={busy||trashed}/>}>
    {product.demo&&<Label muted size={11}>{t('demoDetail')}</Label>}
    {lifecycle!=='active'&&<View style={{gap:12}}><Label>{t(lifecycle)}</Label><Button disabled={busy} onPress={()=>{run(()=>repo.setLifecycle(id,'active')).catch(()=>{});}}>{t('restore')}</Button></View>}
    {editing&&real&&!trashed?<><ItemForm contextual item={real} onSaved={()=>setEditing(false)}/><Button quiet onPress={()=>setEditing(false)}>{t('cancel')}</Button></>:<>
      <ProductHero product={product} real={real} onZoom={()=>setZoom(true)}/>
      <View style={{gap:6}}><Heading size={34}>{product.title}</Heading><Label>{details.brand}{details.model?' · '+details.model:''}</Label>{details.variant&&<Label muted size={12}>{details.variant}</Label>}{product.description!==product.title&&<Label muted size={13}>{product.description}</Label>}</View>
      <View style={{padding:18,borderWidth:1,borderColor:c.line,borderRadius:16,gap:12}}>{price?<><Heading size={28}>{price.source==='offer'&&!product.demo?t('from')+' ':''}{money(price.amountMinor,price.currency)}</Heading><Label size={11} muted>{t(product.demo||product.example?'examplePrice':price.source==='manual'?'manualPrice':'offers')}</Label>{!product.demo&&offerPriceChange(details)&&<Label size={12}>{offerPriceChange(details)==='up'?t('priceRose'):offerPriceChange(details)==='down'?t('priceDropped'):''}</Label>} {price.totalMinor!==undefined&&<Label size={12}>{t('deliveredTotal')}: {money(price.totalMinor,price.currency)}</Label>}</>:<Label muted>{t('priceUnknown')}</Label>}
      {product.demo&&price?[0,1,2].map((n)=><View key={n} style={{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:c.line,paddingTop:12}}><Label size={13}>{t('demo')} {String.fromCharCode(65+n)}</Label><Label size={13}>{money(price.amountMinor+n*15000,price.currency)}</Label></View>):(details.offers??[]).length?(details.offers??[]).map(o=><Pressable key={o.id} accessibilityRole="link" accessibilityLabel={o.store} onPress={()=>open(o.sourceUrl)} style={{borderTopWidth:1,borderTopColor:c.line,paddingTop:12,gap:6}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Label>{o.store}</Label><View style={{flexDirection:'row',gap:8,alignItems:'center'}}><Label>{money(o.priceMinor,o.currency)}</Label><Icon name="external" size={16}/></View></View><Label muted size={11}>{o.variant} · {t('observedAt')}: {o.observedAt.slice(0,10)}</Label><Label muted size={11}>{o.shippingMinor!==undefined?t('shipping')+': '+money(o.shippingMinor,o.currency):t('shippingUnknown')} · {t(o.availability&&o.availability!=='unknown'?o.availability:'unknown')}</Label></Pressable>):<Label size={12} muted>{t('noOffers')}</Label>}
      </View>
      {!product.demo&&real?.kind==='product'&&!trashed&&<><RelatedSource item={real}/><ProductOffersEditor item={real}/><ProductActions key={real.id} item={real}/><RelatedTasks item={real}/><SourcePreview item={real}/></>}
      {details.attributes&&<Label>{details.attributes}</Label>}{details.ingredientsText&&<Label>{details.ingredientsText}</Label>}{details.volume&&<Label>{details.volume}</Label>}
      {product.demo?<Label muted size={12}>{t('demoReadOnly')}</Label>:<>
        {real&&<CardActionsMenu item={real} onEdit={()=>setEditing(true)}/>}
        {!trashed&&<><Button onPress={()=>setEditing(true)}>{t('edit')}</Button>
        {deleting?<View style={{gap:10}}><Label>{t('trashQuestion')}</Label><Button danger onPress={()=>{run(()=>repo.setLifecycle(id,'trashed')).then(()=>{router.replace('/');}).catch(()=>{});}}>{t('delete')}</Button><Button quiet onPress={()=>setDeleting(false)}>{t('cancel')}</Button></View>:<Button quiet onPress={()=>setDeleting(true)}>{t('delete')}</Button>}</>}
      </>}
    </>}
    <ImageViewer visible={zoom} onClose={()=>setZoom(false)} source={fullImage} label={product.title}/>
  </AppShell>;
}
