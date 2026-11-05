import {safeUrl} from './index.ts';
import {isActive} from './lifecycle.ts';
import type {Item,ProductDetails,ProductCategory} from './index.ts';
export type ProductFilter='all'|ProductCategory;
export type ProductSort='recent'|'price_asc'|'price_desc'|'price_dropped'|'title';
export type PricePresentation={source:'manual'|'offer';amountMinor:number;currency:string;dropped:boolean;offerId?:string;totalMinor?:number};
export function formatPrice(amountMinor:number,currency:string,locale:string):string{return new Intl.NumberFormat(locale==='uk'?'uk-UA':locale==='ru'?'ru-UA':'en-US',{style:'currency',currency,minimumFractionDigits:amountMinor%100===0?0:2,maximumFractionDigits:2}).format(amountMinor/100);}
export function pricePresentation(details:ProductDetails,now=Date.now()):PricePresentation|undefined {
  const currencies=new Set(details.offers?.map(x=>x.currency));
  const currency=details.currency??(currencies.size===1?[...currencies][0]:undefined);
  const offers=(details.offers??[]).filter(o=>currency&&o.currency===currency&&o.variant===(details.variant??'')&&o.availability!=='out_of_stock'&&Number.isSafeInteger(o.priceMinor)&&o.priceMinor>=0&&safeUrl(o.sourceUrl)&&Date.parse(o.observedAt)<=now&&now-Date.parse(o.observedAt)<=7*86400000);
  // Unknown shipping never turns into a fabricated delivered minimum.
  const delivered=offers.length>0&&offers.every(o=>o.shippingMinor!==undefined);
  offers.sort((a,b)=>(a.priceMinor+(delivered?a.shippingMinor!:0))-(b.priceMinor+(delivered?b.shippingMinor!:0)));
  if(offers.length){const o=offers[0];return {source:'offer',amountMinor:o.priceMinor,currency:o.currency,dropped:o.previousPriceMinor!==undefined&&o.previousPriceMinor>o.priceMinor,offerId:o.id,...(delivered?{totalMinor:o.priceMinor+o.shippingMinor!}:{})};}
  if(details.priceMinor!==undefined&&details.currency)return {source:'manual',amountMinor:details.priceMinor,currency:details.currency,dropped:false};
  return undefined;
}
export function offerPriceChange(details:ProductDetails,now=Date.now()):'up'|'down'|'same'|undefined{const price=pricePresentation(details,now);const offer=details.offers?.find(o=>o.id===price?.offerId);if(!offer||offer.previousPriceMinor===undefined)return undefined;return offer.priceMinor>offer.previousPriceMinor?'up':offer.priceMinor<offer.previousPriceMinor?'down':'same';}
export function priceSortBasis(details:ProductDetails[],currency:string,now=Date.now()):'delivered'|'item'{const prices=details.map(d=>pricePresentation(d,now)).filter(p=>p?.currency===currency);return prices.length>0&&prices.every(p=>p?.totalMinor!==undefined)?'delivered':'item';}
export function selectComparison(items:Item[],ids:string[]):(Item&{kind:'product'})[]{if(ids.length<2||ids.length>3||new Set(ids).size!==ids.length)throw new Error('comparison_count');return ids.map(id=>{const item=items.find(i=>i.id===id);if(!item||item.kind!=='product'||!isActive(item)||item.inboxStatus!=='confirmed')throw new Error('comparison_unavailable');return item;});}
export function selectProducts(items:Item[],options:{filter:ProductFilter;sort:ProductSort;currency:string},now=Date.now()):(Item&{kind:'product'})[]{
  const rows=items.filter((i):i is Item&{kind:'product'}=>isActive(i)&&i.kind==='product'&&(options.filter==='all'||(i.details.productCategory??'other')===options.filter));
  const delivered=priceSortBasis(rows.map(i=>i.details),options.currency,now)==='delivered';
  return rows.sort((a,b)=>{
    if(options.sort==='title')return a.title.localeCompare(b.title);
    if(options.sort==='recent')return b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id);
    if(options.sort==='price_dropped')return Number(!!pricePresentation(b.details,now)?.dropped)-Number(!!pricePresentation(a.details,now)?.dropped)||b.createdAt.localeCompare(a.createdAt)||a.title.localeCompare(b.title);
    const pa=pricePresentation(a.details,now),pb=pricePresentation(b.details,now);
    const va=pa?.currency===options.currency?(delivered?pa.totalMinor:pa.amountMinor):undefined,vb=pb?.currency===options.currency?(delivered?pb.totalMinor:pb.amountMinor):undefined;
    if(va===undefined)return vb===undefined?a.title.localeCompare(b.title):1;if(vb===undefined)return -1;
    return (options.sort==='price_asc'?va-vb:vb-va)||a.title.localeCompare(b.title);
  });
}
