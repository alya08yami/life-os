const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const cwd=path.join(root,'apps/mobile');
const cli=require.resolve('expo/bin/cli',{paths:[cwd]});
const child=spawn(process.execPath,['--max-old-space-size=384','--max-semi-space-size=4',cli,...process.argv.slice(2)],{cwd,stdio:'inherit',env:{...process.env,UV_THREADPOOL_SIZE:'2',EXPO_NO_TELEMETRY:'1',EXPO_OFFLINE:'1',EXPO_HOME:path.join(root,'.expo-home')}});
child.on('exit',code=>process.exit(code??1));
