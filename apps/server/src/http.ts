import {createServer} from 'node:http';import type {IncomingMessage,ServerResponse} from 'node:http';import {ApiError,LifeServer} from './service.ts';
async function body(req:IncomingMessage):Promise<any>{if(!String(req.headers['content-type']??'').startsWith('application/json'))throw new ApiError('json_required',415);const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>(req.url?.includes('/items')?45:5)*1024*1024)throw new ApiError('payload_too_large',413);chunks.push(Buffer.from(chunk));}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new ApiError('invalid_json');}}
export function apiServer(service:LifeServer){return createServer(async(req,res)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');const send=(status:number,data:unknown)=>{res.writeHead(status);res.end(JSON.stringify(data));};try{
 if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host??''))throw new ApiError('host_forbidden',403);
 const origin=req.headers.origin;if(origin&&!/^http:\/\/(127\.0\.0\.1|localhost):(8081|8787)$/.test(origin))throw new ApiError('origin_forbidden',403);
 const url=new URL(req.url??'/','http://127.0.0.1');const path=url.pathname.replace(/^\/api/,'');const method=req.method??'GET';const ip=req.socket.remoteAddress??'local';
 if(path==='/health'&&method==='GET'){send(200,{ok:true,capabilities:service.capabilities()});return;}
 if(path==='/auth/register'&&method==='POST'){const b=await body(req);send(201,service.register(b.username,b.password,b.setupCode,ip));return;}
 if(path==='/auth/login'&&method==='POST'){const b=await body(req);send(200,service.login(b.username,b.password,ip));return;}
 const raw=req.headers.authorization?.replace(/^Bearer /,'')??'';const user=service.authenticate(raw);
 if(path==='/auth/logout'&&method==='POST'){service.logout(raw);send(200,{ok:true});return;}
 if(path==='/me'&&method==='GET'){send(200,{user,usage:service.usage(user.id),capabilities:service.capabilities()});return;}
 if(path==='/account/export'&&method==='GET'){send(200,service.exportAccount(user.id));return;}
 if(path==='/account/clear-ai'&&method==='POST'){service.clearAIContent(user.id);send(200,{ok:true});return;}
 if(path==='/account/delete'&&method==='POST'){const b=await body(req);service.deleteAccount(user.id,b.confirmation);send(200,{ok:true});return;}
 if(path==='/tasks'&&method==='GET'){send(200,{items:service.sharedTasks(user.id)});return;}
 if(path==='/spaces'&&method==='GET'){send(200,{spaces:service.spaces(user.id)});return;}
 if(path==='/spaces'&&method==='POST'){const b=await body(req);send(201,service.createSpace(user.id,b.title));return;}
 if(path==='/invites/accept'&&method==='POST'){const b=await body(req);send(200,service.accept(user.id,b.invitation));return;}
 const parts=path.split('/').filter(Boolean);
 if(parts[0]==='spaces'&&parts[1]){const id=parts[1];if(parts.length===2&&method==='GET'){send(200,service.space(user.id,id));return;}if(parts[2]==='invites'&&method==='POST'){const b=await body(req);send(201,service.invite(user.id,id,b.username));return;}if(parts[2]==='members'&&parts[3]&&method==='DELETE'){service.removeMember(user.id,id,parts[3]);send(200,{ok:true});return;}if(parts[2]==='items'&&parts.length===3&&method==='POST'){const b=await body(req);send(201,service.addShared(user.id,id,b.input,b.assignedTo));return;}if(parts[2]==='items'&&parts[3]&&method==='PATCH'){send(200,service.updateShared(user.id,id,parts[3],await body(req)));return;}}
 if(path==='/places/resolve'&&method==='POST'){const b=await body(req);send(200,await service.places(user.id,b.link));return;}
 if(path==='/ai/recognize'&&method==='POST'){send(200,await service.recognize(user.id,await body(req)));return;}
 if(path==='/catalog/search'&&method==='GET'){send(200,await service.catalog(user.id,url.searchParams.get('query')??'',url.searchParams.get('locale')??'en'));return;}
 if(parts[0]==='catalog'&&parts[1]&&parts[2]&&method==='GET'){send(200,await service.catalogDetail(user.id,parts[2],parts[1],url.searchParams.get('locale')??'en'));return;}
 throw new ApiError('not_found',404);
 }catch(error){if(!res.headersSent){const status=error instanceof ApiError?error.status:error instanceof SyntaxError?400:400;send(status,{error:error instanceof ApiError?error.message:'invalid_request'});}else res.end();}});}
