// Package compiled assets only; never traverse source, credentials, databases or attachments.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),input=path.join(root,'apps/mobile/dist-pages'),out='/tmp/life-os-approved-upload',prior=process.env.LIFE_OS_RELEASE_BASELINE||'/tmp/life-os-github-upload/site';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
fs.mkdirSync(out,{recursive:true});for(const f of fs.readdirSync(out))fs.rmSync(path.join(out,f),{recursive:true,force:true});
const files=walk(input),names=new Set();for(const f of files){const n=path.basename(f);if(names.has(n))throw Error('Flattened filename collision: '+n);names.add(n);}
const replace=files.map(f=>['/life-os/'+path.relative(input,f).split(path.sep).join('/'),'/life-os/'+path.basename(f)]).sort((a,b)=>b[0].length-a[0].length);
const changed=[];for(const f of files){const n=path.basename(f);let bytes=fs.readFileSync(f);if(/\.(html|js|css|json)$/.test(f)){let s=bytes.toString();for(const [a,b] of replace)s=s.split(a).join(b);bytes=Buffer.from(s);}fs.writeFileSync(path.join(out,n),bytes);const old=path.join(prior,n);if(!fs.existsSync(old)||!bytes.equals(fs.readFileSync(old)))changed.push(path.join(out,n));}
fs.writeFileSync('/tmp/life-os-approved-upload-files.json',JSON.stringify(changed));console.log(JSON.stringify({out,files:files.length,changed:changed.length,bytes:changed.reduce((s,f)=>s+fs.statSync(f).size,0)}));
