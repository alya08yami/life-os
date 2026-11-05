import type {CatalogSource as ImageSourcePropType} from '../components/CatalogImage';
import type {ProductDetails,Item} from '@life-os/domain';
export const editorial={
 reading:require('../../assets/editorial/reference-reading.jpg'),wellness:require('../../assets/editorial/reference-wellness.jpg'),
 health:require('../../assets/editorial/health-natural.jpg'),ideas:require('../../assets/editorial/ideas-natural.jpg'),
  perfume:require('../../assets/editorial/perfume.jpg'),home:require('../../assets/editorial/home-natural.jpg'),food:require('../../assets/editorial/food-natural.jpg'),cinema:require('../../assets/editorial/cinema-natural.jpg'),travel:require('../../assets/editorial/travel-natural.jpg'),wardrobe:require('../../assets/editorial/wardrobe-natural.jpg'),work:require('../../assets/editorial/work-natural.jpg'),headphones:require('../../assets/editorial/headphones.jpg'),bag:require('../../assets/editorial/bag-natural.jpg'),lamp:require('../../assets/editorial/lamp.jpg')
} satisfies Record<string,ImageSourcePropType>;
export type ProductModel={id:string;title:string;description:string;image?:ImageSourcePropType;details:ProductDetails;favorite:boolean;demo:boolean;example?:boolean;createdAt:string};
/** Immutable display fixtures: never seeded or passed to Repository.add. */
export const demoProducts:ProductModel[]=[
  {id:'demo-perfume',title:'Atelier 04',description:'Eau de parfum · poire & freesia',image:editorial.perfume,details:{brand:'Atelier',model:'Poire & Freesia',variant:'50 ml',productCategory:'beauty',priceMinor:499000,currency:'UAH'},favorite:false,demo:true,createdAt:'2026-11-02T12:00:00Z'},
  {id:'demo-headphones',title:'Studio Audio',description:'Wireless over-ear headphones',image:editorial.headphones,details:{brand:'Studio',model:'Over-ear',productCategory:'tech',priceMinor:1949000,currency:'UAH'},favorite:false,demo:true,createdAt:'2026-11-01T12:00:00Z'},
  {id:'demo-bag',title:'Épure',description:'Leather shoulder bag',image:editorial.bag,details:{brand:'Épure',model:'Mini',productCategory:'clothing',priceMinor:1520000,currency:'UAH'},favorite:false,demo:true,createdAt:'2026-10-31T12:00:00Z'},
  {id:'demo-lamp',title:'Forma',description:'Ceramic table lamp',image:editorial.lamp,details:{brand:'Forma',model:'Mushroom',productCategory:'home',priceMinor:879000,currency:'UAH'},favorite:false,demo:true,createdAt:'2026-10-30T12:00:00Z'}
];
export function productModel(item:Item&{kind:'product'}):ProductModel{const a=item.attachments[0];return {id:item.id,title:item.title,description:item.body,image:a?.thumbnailUri?{uri:a.thumbnailUri}:undefined,details:item.details,favorite:!!item.favorite,demo:false,example:item.tags?.includes('Пример'),createdAt:item.createdAt};}
