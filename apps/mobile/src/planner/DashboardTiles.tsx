import {useApp} from '../context';
import Svg,{Defs,LinearGradient,Stop,Rect} from 'react-native-svg';
import {usePlannerColors} from './ui';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Animated,PanResponder,Platform,Pressable,View} from 'react-native';
import {router} from 'expo-router';
import {Icon} from '../components/Icon';
import {usePlanner} from './context';
import {sections} from './seed';
import {C,T} from './ui';

const mistGradients=[['#9ad2ee','#8a91dc'],['#b3a8ef','#8e8ade'],['#a5e0ed','#8eb1e8']];
const mistGradientOrder=[0,1,2,1,0,1,2,1,0,1,2,1];
const tiles=[...sections,{id:'shift-calendar' as const,title:'Мой календарь',icon:'calendar' as const,color:'#f3e9ed',ink:'#a45478'}];
type Tile=typeof tiles[number];


function TileButton({tile,index,width,count,editing,wiggle,onEdit,onHide,onMove}:{
 tile:Tile;index:number;width:number;count:number;editing:boolean;wiggle:Animated.Value;
 onEdit:()=>void;onHide:()=>void;onMove:(target:number)=>void;
}){
 const {theme}=useApp().state.settings;
 const minimal=theme==='minimal';
 const mist=theme==='mist';
 const columns=minimal?1:3;
 const rowHeight=minimal?58:120;
 const gradient=React.useId().replace(/[^a-z0-9]/gi,'');
 const [dragging,setDragging]=useState(false);
 const offset=useRef(new Animated.ValueXY()).current;
 const pan=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponderCapture:(_,g)=>editing&&Math.hypot(g.dx,g.dy)>6,
  onPanResponderGrant:()=>setDragging(true),
  onPanResponderMove:(_,g)=>offset.setValue({x:g.dx,y:g.dy}),
  onPanResponderRelease:(_,g)=>{
   const column=Math.max(0,Math.min(columns-1,index%columns+Math.round(g.dx/(width*(minimal?3:1)))));
   const row=Math.max(0,Math.floor(index/columns)+Math.round(g.dy/rowHeight));
   onMove(Math.min(count-1,row*columns+column));
   offset.setValue({x:0,y:0});
   setDragging(false);
  },
  onPanResponderTerminate:()=>{offset.setValue({x:0,y:0});setDragging(false);},
  onPanResponderTerminationRequest:()=>false,
 }),[editing,index,width,count,onMove,offset,columns,rowHeight,minimal]);
 const title=tile.title.replace('\n',' ');
 const open=()=>{
  if(editing)return;
  if(tile.id==='shift-calendar')router.push('/shift-calendar');
  else if(tile.id==='shopping')router.push('/wishlist');
  else router.push({pathname:'/section/[section]',params:{section:tile.id}});
 };
 return <Animated.View {...pan.panHandlers} style={{
  width:minimal?'100%':'33.333%',height:rowHeight,padding:4,zIndex:dragging?2:0,
  transform:[{translateX:offset.x},{translateY:offset.y}],
  ...(Platform.OS==='web'&&editing?{touchAction:'none' as const}:{}),
 }}>
  <Animated.View style={{flex:1,transform:[{rotate:editing&&!dragging?wiggle.interpolate({
   inputRange:[-1,1],outputRange:index%2?['-1.5deg','1.5deg']:['1.5deg','-1.5deg'],
  }):'0deg'}]}}>
   <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={open} onLongPress={onEdit}
    accessibilityActions={[{name:'edit',label:'Редактировать плитки'}]}
    onAccessibilityAction={onEdit}
    style={{flex:1,backgroundColor:minimal?'transparent':tile.color,borderRadius:minimal?0:19,borderBottomWidth:minimal?1:0,borderColor:'#5f5862',overflow:'hidden',flexDirection:minimal?'row':'column',alignItems:'center',justifyContent:minimal?'space-between':'center',gap:12,padding:8}}>
    {mist&&<View pointerEvents="none" style={{position:'absolute',inset:0}}><Svg width="100%" height="100%"><Defs><LinearGradient id={gradient} x2="100%" y2="100%"><Stop offset={0} stopColor={mistGradients[mistGradientOrder[index%mistGradientOrder.length]][0]}/><Stop offset={1} stopColor={mistGradients[mistGradientOrder[index%mistGradientOrder.length]][1]}/></LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#'+gradient+')'}/></Svg></View>}
    {!minimal&&<View style={mist?{zIndex:1}:undefined}><Icon name={tile.icon} size={mist?27:30} strokeWidth={mist?2:undefined} color={mist?'#fff':tile.ink}/></View>}
    <T center={!minimal} size={minimal?19.2:12} style={minimal?{fontWeight:'300'}:mist?{minHeight:35,textAlignVertical:'center'}:undefined} color={mist?'#fff':undefined}>{minimal?title:tile.title}</T>
    {minimal&&<Icon name="next" size={18} color="#716975"/>}
   </Pressable>
   {editing&&<Pressable accessibilityRole="button" accessibilityLabel={'Скрыть: '+title} onPress={onHide} hitSlop={8}
    style={{position:'absolute',top:4,left:4,width:13,height:13,borderRadius:6.5,backgroundColor:"#737373",alignItems:'center',justifyContent:'center'}}>
    <T color="#fff" size={8}>−</T>
   </Pressable>}
  </Animated.View>
 </Animated.View>;
}

export function DashboardTiles(){const C=usePlannerColors();
 const {state,update}=usePlanner();
 const [editing,setEditing]=useState(false);
 const [width,setWidth]=useState(0);
 const wiggle=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  if(!editing)return;
  const loop=Animated.loop(Animated.sequence([
   Animated.timing(wiggle,{toValue:1,duration:115,useNativeDriver:true,isInteraction:false}),
   Animated.timing(wiggle,{toValue:-1,duration:115,useNativeDriver:true,isInteraction:false}),
  ]));
  loop.start();
  return ()=>{loop.stop();wiggle.setValue(0);};
 },[editing,wiggle]);
 const [error,setError]=useState(false);
 const save=(change:Parameters<typeof update>[0])=>{
  setError(false);
  void update(change).catch(()=>setError(true));
 };
 const order=[...new Set([...(state?.dashboardOrder??[]),...tiles.map(tile=>tile.id)])];
 const ordered=order.flatMap(id=>tiles.filter(tile=>tile.id===id));
 const visible=ordered.filter(tile=>state?.notificationSettings['visible.'+tile.id]!==false);
 const hidden=ordered.filter(tile=>!visible.includes(tile));
 const show=(id:string,visible:boolean)=>save(current=>({
  ...current,notificationSettings:{...current.notificationSettings,['visible.'+id]:visible},
 }));
 const move=(from:number,to:number)=>{
  if(from===to)return;
  const reordered=visible.map(tile=>tile.id);
  const [id]=reordered.splice(from,1);
  reordered.splice(to,0,id);
  save(current=>({...current,dashboardOrder:[...reordered,...hidden.map(tile=>tile.id)]}));
 };
 return <>
  {editing&&<Pressable accessibilityRole="button" onPress={()=>setEditing(false)} style={{alignSelf:'flex-end',padding:10}}>
   <T color={C.purple} bold>Готово</T>
  </Pressable>}
  <View onLayout={event=>setWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'wrap',marginHorizontal:-4}}>
   {visible.map((tile,index)=><TileButton key={tile.id} tile={tile} index={index} width={width/3||1} count={visible.length}
    editing={editing} wiggle={wiggle} onEdit={()=>setEditing(true)} onHide={()=>show(tile.id,false)} onMove={to=>move(index,to)}/>)}
  </View>
  {hidden.length>0&&<View style={{gap:6}}>
   {!editing&&visible.length===0&&<Pressable onPress={()=>setEditing(true)}><T color={C.purple}>Редактировать плитки</T></Pressable>}
   {editing&&hidden.map(tile=><Pressable key={tile.id} accessibilityRole="button" onPress={()=>show(tile.id,true)} style={{padding:8}}>
    <T color={C.purple}>＋ Вернуть «{tile.title.replace('\n',' ')}»</T>
   </Pressable>)}
  </View>}
  {error&&<T color={C.red}>Не удалось сохранить плитки. Попробуй ещё раз.</T>}
 </>;
}
