export function redirectSystemPath({path}:{path:string;initial:boolean}){try{const url=new URL(path,'lifeos://app');return url.hostname==='expo-sharing'?'/handle-share':path;}catch{return '/inbox';}}
