import {cleanNoteHtml} from '../data/note-format';
import React,{useRef,useEffect,useState} from 'react';import {Platform,View,Pressable,TextInput} from 'react-native';import {Label,useColors} from '../ui';
export function RichNoteEditor({initial,onChange,onBlur,compact=false,more=false,afterBody}:{initial:string;onChange:(html:string,text:string)=>void;onBlur:()=>void;compact?:boolean;more?:boolean;afterBody?:React.ReactNode}){const c=useColors();const ref=useRef<HTMLDivElement|null>(null);const [native,setNative]=useState(initial.replace(/<[^>]+>/g,''));const initialRef=useRef(initial);useEffect(()=>{if(Platform.OS==='web'&&ref.current)ref.current.innerHTML=cleanNoteHtml(initialRef.current);},[]);const changed=()=>{if(ref.current)onChange(cleanNoteHtml(ref.current.innerHTML),ref.current.innerText);};const command=(cmd:string,arg?:string)=>{if(Platform.OS==='web'){ref.current?.focus();document.execCommand(cmd,false,arg);changed();}else{const next=cmd==='bold'?native+' **текст**':cmd==='italic'?native+' _текст_':native+'\n1. ';setNative(next);onChange(next,next);}};const tools=[{label:'Заголовок',text:compact?'H1':'H',cmd:'formatBlock',arg:compact?'h1':'h2'},{label:'Крупный текст',text:'A+',cmd:'fontSize',arg:'5'},{label:'Обычный текст',text:'A',cmd:'fontSize',arg:'3'},{label:'Зачёркнутый',text:'S',cmd:'strikeThrough'},{label:'Чек-лист',text:'☑',cmd:'insertHTML',arg:'<p><input type="checkbox"> Пункт</p>'},{label:'Отменить',text:'↶',cmd:'undo'},{label:'Повторить',text:'↷',cmd:'redo'},{label:'Жирный',text:'B',cmd:'bold'},{label:'Курсив',text:'I',cmd:'italic'},{label:'Подчёркнутый',text:'U',cmd:'underline'},{label:'Нумерованный список',text:'1. ≡',cmd:'insertOrderedList'},{label:'Список',text:'•',cmd:'insertUnorderedList'}];
const order=[0,7,8,9,4,10,11,5,6];
const toolbar=(indices:number[],single=false)=><View style={{flexDirection:'row',gap:single?0:6,flexWrap:single?'nowrap':'wrap',
 borderRadius:single?13:0,backgroundColor:single?c.soft:undefined,padding:single?3:0}}>
 {indices.map(index=>{
  const tool=tools[index];
  return <Pressable key={tool.label} accessibilityRole="button" accessibilityLabel={tool.label}
   onPress={()=>command(tool.cmd,tool.arg)}
   {...(Platform.OS==='web'?{onMouseDown:(event:any)=>event.preventDefault()} as any:{})}
   style={{flex:single?1:undefined,minWidth:single?0:36,minHeight:37,borderRadius:9,backgroundColor:single&&index!==0?undefined:c.soft,
    alignItems:'center',justifyContent:'center'}}>
   <Label size={13} weight="600">{tool.text}</Label>
  </Pressable>;
 })}
</View>;
const body=Platform.OS==='web'?React.createElement('div',{ref,role:'textbox','aria-label':'Текст заметки',contentEditable:true,'data-note-placeholder':compact?'Запишите мысли и планы…':undefined,suppressContentEditableWarning:true,onInput:changed,onClick:(e:any)=>{if(e.target instanceof HTMLInputElement){if(e.target.checked)e.target.setAttribute('checked','');else e.target.removeAttribute('checked');changed();}},onBlur,onDrop:(e:any)=>{e.preventDefault();document.execCommand('insertText',false,e.dataTransfer.getData('text/plain'));changed();},onPaste:(e:any)=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));changed();},style:{fontFamily:'TenorSans',fontSize:16,lineHeight:1.8,minHeight:compact?84:340,outline:'none',color:c.text,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}):<TextInput accessibilityLabel="Текст заметки" value={native} onChangeText={v=>{setNative(v);onChange(v,v);}} onBlur={onBlur} multiline placeholder="Запишите мысли и планы…" style={{fontFamily:'TenorSans',fontSize:16,lineHeight:27,minHeight:compact?84:340,color:c.text}}/>;
return <View style={{gap:12,flex:1}}>
 {!compact&&toolbar(tools.map((_,index)=>index))}
 {compact&&more&&toolbar([1,2,3])}
 {compact&&Platform.OS==='web'&&React.createElement('style',null,'[data-note-placeholder]:empty::before {content:attr(data-note-placeholder);color:#9994ad;pointer-events:none}')}
 {body}
 {afterBody}
 {compact&&<View style={{marginTop:'auto'}}>{toolbar(order,true)}</View>}
</View>;}
