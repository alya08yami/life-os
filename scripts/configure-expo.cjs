const fs=require('node:fs');
const path=require('node:path');
const versions=JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('expo/package.json',{paths:[path.resolve('apps/mobile')]})),'bundledNativeModules.json'),'utf8'));
const names=['react','react-dom','react-native','react-native-web','expo-router','expo-sqlite','expo-image-picker','expo-image','expo-font','expo-image-manipulator','react-native-svg','expo-file-system','expo-crypto','expo-linking','expo-constants','expo-status-bar','react-native-safe-area-context','react-native-screens','@expo/metro-runtime'];
const file='apps/mobile/package.json';const p=JSON.parse(fs.readFileSync(file,'utf8'));
for(const name of names){if(!versions[name])throw new Error('No compatible version: '+name);p.dependencies[name]=versions[name];}
fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
const root=JSON.parse(fs.readFileSync('package.json','utf8'));root.devDependencies['@types/react']='~19.2.0';fs.writeFileSync('package.json',JSON.stringify(root,null,2)+'\n');
console.log(p.dependencies);
