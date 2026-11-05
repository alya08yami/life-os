/**
 * Finishes a web export for installation as an app:
 *  - fills the base path into index.html (manifest, icons, service worker registration);
 *  - writes sw.js with this build's file list and a build id derived from the files' contents.
 * Usage: node scripts/finalize-web.cjs <export dir> [base path, e.g. /life-os]
 */
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const dir=path.resolve(process.argv[2]||'apps/mobile/dist');const base=process.argv[3]??'';
if(base&&!/^\/[a-zA-Z0-9._-]+$/.test(base))throw new Error('Invalid base path');
const indexFile=path.join(dir,'index.html');
let html=fs.readFileSync(indexFile,'utf8');
if(!html.includes('%BASE%')&&!html.includes('name="life-os-base"'))throw new Error('index.html is not the LIFE OS template (apps/mobile/public/index.html)');
html=html.split('%BASE%').join(base);fs.writeFileSync(indexFile,html);
const skip=new Set(['sw.js','404.html','metadata.json','.nojekyll']);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(dir).map(f=>path.relative(dir,f).split(path.sep).join('/')).filter(f=>!skip.has(f)).sort();
const hash=crypto.createHash('sha256');for(const f of files){hash.update(f);hash.update(fs.readFileSync(path.join(dir,f)));}
const build=hash.digest('hex').slice(0,16);
const urls=files.map(f=>f==='index.html'?base+'/':base+'/'+encodeURI(f));
const template=fs.readFileSync(path.join(__dirname,'sw-template.js'),'utf8');
fs.writeFileSync(path.join(dir,'sw.js'),template.replace('__BUILD__',()=>build).replace("'__BASE__'",()=>JSON.stringify(base)).replace('__PRECACHE__',()=>JSON.stringify(urls)));
const bytes=files.reduce((n,f)=>n+fs.statSync(path.join(dir,f)).size,0);
console.log(`Web app finalized: build ${build}, ${files.length} files (${(bytes/1048576).toFixed(1)} MB) for offline start, base "${base||'/'}"`);
