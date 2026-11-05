const {getDefaultConfig}=require('expo/metro-config');const http=require('node:http');
const config=getDefaultConfig(__dirname);config.maxWorkers=1;
const previous=config.server?.enhanceMiddleware;
config.server={...config.server,enhanceMiddleware:(middleware,server)=>{const next=previous?previous(middleware,server):middleware;return (req,res,...args)=>{if(!req.url?.startsWith('/api/'))return next(req,res,...args);const upstream=http.request({host:'127.0.0.1',port:8787,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:8787'}},reply=>{res.writeHead(reply.statusCode??502,reply.headers);reply.pipe(res);});upstream.setTimeout(60000,()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent)res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'server_unavailable'}));});req.pipe(upstream);};}};
module.exports=config;
