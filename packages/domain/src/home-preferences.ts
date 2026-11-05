type Section={id:string};
export function arrangeHome<T extends Section>(sections:readonly T[],prefs:Record<string,string>={},options:{includeHidden?:boolean;favoritesFirst?:boolean}={}):T[]{
  let requested:string[]=[];try{const parsed=JSON.parse(prefs['home.order']??'[]');if(Array.isArray(parsed))requested=parsed.filter((x):x is string=>typeof x==='string');}catch{/* Old/malformed UI preferences do not affect saved content. */}
  const known=new Map(sections.map(x=>[x.id,x]));const ids=[...new Set([...requested,...sections.map(x=>x.id)])].filter(id=>known.has(id));
  const rows=ids.map(id=>known.get(id)!).filter(x=>options.includeHidden||prefs['category.'+x.id]!=='hidden');
  return options.favoritesFirst===false?rows:rows.sort((a,b)=>Number(prefs['category.favorite.'+b.id]==='true')-Number(prefs['category.favorite.'+a.id]==='true'));
}
export function reorderHome(ids:readonly string[],id:string,direction:'up'|'down'):string[]{const next=[...ids];const from=next.indexOf(id),to=from+(direction==='up'?-1:1);if(from>=0&&to>=0&&to<next.length)[next[from],next[to]]=[next[to],next[from]];return next;}
