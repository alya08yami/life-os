/**
 * Movie catalog client (TMDB through the LIFE OS Cloudflare Worker).
 *
 * The Worker holds the TMDB token as a secret; this client only knows the Worker's public address, so nothing
 * secret is ever bundled into the app. Same routes and response shape as `apps/server` (/catalog/*):
 *   GET {CATALOG_URL}/search?query=…&locale=ru  → {results:[{id,mediaType,title,originalTitle,description,year,posterPath}],attribution}
 *   GET {CATALOG_URL}/movie/{id} | /tv/{id}      → {id,title,originalTitle,year,description,genres,runtimeMinutes,posterPath,trailerUrl,attribution}
 * Override the address at build time with EXPO_PUBLIC_CATALOG_URL (a public URL, not a secret).
 */
export const CATALOG_URL=(process.env.EXPO_PUBLIC_CATALOG_URL||'https://life-os-tmdb.alya-08yami.workers.dev').replace(/\/+$/,'');
export const TMDB_ATTRIBUTION='This product uses the TMDB API but is not endorsed or certified by TMDB.';

export type CatalogMediaType='movie'|'tv';
export type CatalogResult={id:number;mediaType:CatalogMediaType;title:string;originalTitle?:string;description?:string;year?:string;posterPath?:string};
export type CatalogDetails={id:number;mediaType:CatalogMediaType;title:string;originalTitle?:string;year?:number;description?:string;genres:string[];runtimeMinutes?:number;posterPath?:string;trailerUrl?:string};
export type CatalogErrorCode='offline'|'unavailable'|'rate_limited'|'invalid';
export class CatalogError extends Error{constructor(public code:CatalogErrorCode){super(code);}}

const PATH=/^\/[A-Za-z0-9_.-]+$/;
const text=(v:unknown,max=2000)=>typeof v==='string'&&v.trim()?v.trim().slice(0,max):undefined;
const safePath=(v:unknown)=>typeof v==='string'&&PATH.test(v)?v:undefined;
const trailer=(v:unknown)=>typeof v==='string'&&/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{6,30}$/.test(v)?v:undefined;

/** TMDB image address for a poster path; small sizes for lists and the grid, w500 for the film page. */
export const posterUrl=(path:string|undefined,size:'w92'|'w185'|'w342'|'w500'='w500')=>path&&PATH.test(path)?`https://image.tmdb.org/t/p/${size}${path}`:undefined;

async function get(path:string,signal?:AbortSignal):Promise<any>{
 const timeout=new AbortController();
 const timer=setTimeout(()=>timeout.abort(),12000);
 const abort=()=>timeout.abort();
 signal?.addEventListener('abort',abort);
 let response:Response;
 try{response=await fetch(CATALOG_URL+path,{headers:{accept:'application/json'},signal:timeout.signal});}
 catch(e){
  if(signal?.aborted)throw e;                       // the caller cancelled (a newer search) — not an error to show
  throw new CatalogError(timeout.signal.aborted?'unavailable':'offline');
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 if(response.status===429)throw new CatalogError('rate_limited');
 if(response.status===400)throw new CatalogError('invalid');
 if(!response.ok)throw new CatalogError('unavailable');
 try{return await response.json();}catch{throw new CatalogError('unavailable');}
}

export async function searchCatalog(query:string,locale:string,signal?:AbortSignal):Promise<CatalogResult[]>{
 const q=query.trim();
 if(q.length<2||q.length>200)throw new CatalogError('invalid');
 const data=await get(`/search?query=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}`,signal);
 if(!data||!Array.isArray(data.results))throw new CatalogError('unavailable');
 return data.results.flatMap((r:any):CatalogResult[]=>{
  const id=Number(r?.id);const mediaType=r?.mediaType==='tv'?'tv':r?.mediaType==='movie'?'movie':undefined;const title=text(r?.title,300);
  if(!Number.isInteger(id)||id<=0||!mediaType||!title)return [];
  return [{id,mediaType,title,originalTitle:text(r.originalTitle,300),description:text(r.description),year:/^\d{4}$/.test(String(r.year??''))?String(r.year):undefined,posterPath:safePath(r.posterPath)}];
 });
}

export async function catalogDetails(mediaType:CatalogMediaType,id:number,locale:string,signal?:AbortSignal):Promise<CatalogDetails>{
 if(!Number.isInteger(id)||id<=0)throw new CatalogError('invalid');
 const d=await get(`/${mediaType}/${id}?locale=${encodeURIComponent(locale)}`,signal);
 const title=text(d?.title,300);
 if(!d||Number(d.id)!==id||!title)throw new CatalogError('unavailable');
 const year=Number(d.year);
 return {id,mediaType,title,originalTitle:text(d.originalTitle,300),year:Number.isInteger(year)&&year>1800&&year<3000?year:undefined,description:text(d.description),
  genres:Array.isArray(d.genres)?d.genres.map((g:unknown)=>text(g,60)).filter(Boolean).slice(0,6) as string[]:[],
  runtimeMinutes:Number.isInteger(d.runtimeMinutes)&&d.runtimeMinutes>0?d.runtimeMinutes:undefined,posterPath:safePath(d.posterPath),trailerUrl:trailer(d.trailerUrl)};
}

/** Catalog identity stored with a film, so the same film is recognised later (e.g. «уже в коллекции»). */
export const catalogId=(mediaType:CatalogMediaType,id:number)=>`${mediaType}:${id}`;

export const catalogErrorText:Record<CatalogErrorCode,string>={
 offline:'Нет подключения к интернету. Проверьте сеть и попробуйте ещё раз.',
 unavailable:'Каталог фильмов сейчас не отвечает. Попробуйте позже или добавьте фильм вручную.',
 rate_limited:'Слишком много запросов подряд. Подождите минуту и попробуйте снова.',
 invalid:'Введите хотя бы два символа названия.',
};
