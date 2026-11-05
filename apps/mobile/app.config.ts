import type {ConfigContext,ExpoConfig} from 'expo/config';
export default ({config}:ConfigContext):ExpoConfig=>{const base=process.env.LIFE_OS_WEB_BASE_PATH??'';if(base&&!/^\/[a-zA-Z0-9._-]+$/.test(base))throw new Error('Invalid web base path');return {...config,name:config.name??'LIFE OS',slug:config.slug??'life-os',experiments:{...config.experiments,...(base?{baseUrl:base}:{})}};};
