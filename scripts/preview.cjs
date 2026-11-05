// Starts only local production preview + real API. Test fixtures are never used here.
const {spawn}=require('node:child_process');const path=require('node:path');const fs=require('node:fs');const root=path.resolve(__dirname,'..');
if(!fs.existsSync(path.join(root,'apps/mobile/dist/index.html'))){console.error('Build the web app first: pnpm build:web');process.exit(1);}
const children=[spawn(process.execPath,['--env-file-if-exists=.env','apps/server/src/main.ts'],{cwd:root,stdio:'inherit'}),spawn(process.execPath,['scripts/serve-web.cjs'],{cwd:root,stdio:'inherit'})];let stopping=false,exitCode=0,closed=0;
function stop(code){if(stopping)return;stopping=true;exitCode=code;for(const child of children)if(child.exitCode===null)child.kill('SIGTERM');const timer=setTimeout(()=>{for(const child of children)if(child.exitCode===null)child.kill('SIGKILL');},5000);timer.unref();}
for(const child of children){child.on('error',()=>stop(1));child.on('exit',code=>{closed++;if(!stopping)stop(code??1);if(closed===children.length)process.exit(exitCode);});}process.on('SIGINT',()=>stop(0));process.on('SIGTERM',()=>stop(0));
