/** A refresh failure must never turn an already committed write into a retryable write. */
export async function commitAndRefresh<T>(action:()=>Promise<T>,refresh:()=>Promise<void>,onRefreshError:()=>void):Promise<T>{
  const result=await action();
  try{await refresh();}catch{onRefreshError();}
  return result;
}
