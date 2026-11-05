const {spawnSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const base=process.env.LIFE_OS_WEB_BASE_PATH||'/life-os';
if(!/^\/[a-zA-Z0-9._-]+$/.test(base))throw new Error('Invalid base path');
const result=spawnSync(process.execPath,['scripts/expo.cjs','export','--platform','web','--output-dir','dist-pages'],{cwd:root,stdio:'inherit',env:{...process.env,LIFE_OS_WEB_BASE_PATH:base,EXPO_PUBLIC_STATIC_PREVIEW:'true'}});if(result.status!==0)process.exit(result.status??1);
const dir=path.join(root,'apps/mobile/dist-pages');fs.writeFileSync(path.join(dir,'.nojekyll'),'');fs.copyFileSync(path.join(dir,'index.html'),path.join(dir,'404.html'));
console.log('GitHub Pages build ready: '+dir);
