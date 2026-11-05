import type {TextKey} from '../i18n';import type {IconName} from '../components/Icon';import type {editorial} from './demo';
export const dashboardCategories:{id:string;key:TextKey;image?:keyof typeof editorial;icon?:IconName}[]=[
  {id:'wishlist',key:'wishlist',image:'reading'},{id:'home',key:'home',image:'home'},{id:'health',key:'health',image:'wellness'},{id:'food',key:'nutrition',image:'food'},
  {id:'movies',key:'movies',image:'cinema'},{id:'travel',key:'travel',image:'travel'},{id:'regular',key:'regularPurchases',icon:'bag'},{id:'work',key:'workIdeas',image:'work'}
];
