const fs=require('node:fs/promises');const path=require('node:path');const sharp=require('sharp');
(async()=>{
  const assets=JSON.parse(await fs.readFile('assets-manifest.local.json','utf8'));const root='apps/mobile/assets';await fs.mkdir(root+'/editorial',{recursive:true});await fs.mkdir(root+'/fonts',{recursive:true});
  for(const asset of assets){await sharp(asset.path).resize(640,640,{fit:'cover'}).jpeg({quality:84,mozjpeg:true}).toFile(`${root}/editorial/${asset.name}.jpg`);}
  for(const [folder,file,name] of [['cormorantgaramond','CormorantGaramond[wght].ttf','CormorantGaramond'],['manrope','Manrope[wght].ttf','Manrope']]){
    for(const [source,destination] of [[file,name+'.ttf'],['OFL.txt',name+'-OFL.txt']]){const r=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/'+folder+'/'+encodeURIComponent(source));if(!r.ok)throw new Error('Font download '+r.status);await fs.writeFile(root+'/fonts/'+destination,Buffer.from(await r.arrayBuffer()));}
  }
  await fs.writeFile(root+'/editorial/README.md','# Editorial assets\n\nGenerated with the built-in imagegen tool for LIFE OS. Unbranded illustrative/demo photography, not photographs of real offers.\n\n'+assets.map(x=>'## '+x.name+'\n'+x.prompt+'\n').join('\n')+'\nAll project images optimized to 640×640 JPEG; no runtime image API. Fonts downloaded from Google Fonts official google/fonts repository; OFL licenses are bundled in ../fonts.\n');
  console.log('Prepared '+assets.length+' local photographs and two OFL fonts.');
})().catch(e=>{console.error(e);process.exitCode=1;});
