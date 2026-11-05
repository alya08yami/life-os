import React,{useState,useRef} from 'react';
import {View,Image} from 'react-native';
import type {Item,Kind,Category,Attachment,ItemInput,MovieDetails,RecipeDetails,ProductDetails,TaskDetails,ProductCategory} from '@life-os/domain';
import {kinds} from '@life-os/domain';
import {isCollectionKind} from '@life-os/domain/collections';
import {TaskFields,taskDraft,taskExtra} from './TaskFields';
import type {TextKey} from '../i18n';
import {useApp} from '../context';
import {Button,Card,Field,Chips,Label} from '../ui';
import {RecipeAmountFields,draftAmounts,readAmounts} from './RecipeAmountFields';
import {kindKey,categoryKey} from '../i18n';
import {pickImage,discardImage,takePhoto} from '../data/images';
const categories:Category[]=['general','home','work','shopping','entertainment','food'];
export function ItemForm({item,defaultKind='note',defaultCategory,onSaved,fixedKind=false,confirmedOnCreate=false,contextual=false,initialAttachments=[]}:{item?:Item;defaultKind?:Kind;defaultCategory?:Category;fixedKind?:boolean;confirmedOnCreate?:boolean;onSaved?:(item:Item)=>void;contextual?:boolean;initialAttachments?:Attachment[]}){
  const {repo,run,busy,t}=useApp();
  const [text,setText]=useState((contextual?item?.title:item?.body)??'');const [title,setTitle]=useState(item?.title??'');
  const [kind,setKind]=useState<Kind>(item?.kind??defaultKind);const [category,setCategory]=useState<Category>(item?.category??defaultCategory??(contextual?'shopping':'general'));
  const [sourceUrl,setSourceUrl]=useState(item?.sourceUrl??'');const [attachments,setAttachments]=useState<Attachment[]>(item?.attachments??initialAttachments);
  const movie=item?.kind==='movie'?item.details:undefined;const recipe=item?.kind==='recipe'?item.details:undefined;const product=item?.kind==='product'?item.details:undefined;const task=item?.kind==='task'?item.details:undefined;
  const [year,setYear]=useState(movie?.year?.toString()??'');const [director,setDirector]=useState(movie?.director??'');const [trailer,setTrailer]=useState(movie?.trailerUrl??'');const [watch,setWatch]=useState<MovieDetails['watchStatus']>(movie?.watchStatus??'want');
  const [ingredients,setIngredients]=useState(recipe?.ingredients.join('\n')??'');const [steps,setSteps]=useState(recipe?.steps.join('\n')??'');const [servings,setServings]=useState(recipe?.servings?.toString()??'');
  const [amounts,setAmounts]=useState(()=>draftAmounts(recipe?.ingredientAmounts));const [cookMinutes,setCookMinutes]=useState(recipe?.cookMinutes?.toString()??'');const [recipeNotes,setRecipeNotes]=useState(recipe?.notes??'');
  const ingredientLines=[...new Set(ingredients.split('\n').map(x=>x.trim()).filter(Boolean))];
  const [brand,setBrand]=useState(product?.brand??'');const [model,setModel]=useState(product?.model??'');const [price,setPrice]=useState(product?.priceMinor!==undefined?(product.priceMinor/100).toString():'');const [currency,setCurrency]=useState(product?.currency??'UAH');
  const [productCategory,setProductCategory]=useState<ProductCategory>(product?.productCategory??'other');const [variant,setVariant]=useState(product?.variant??'');
  const [due,setDue]=useState(task?.dueDate??'');const [priority,setPriority]=useState<TaskDetails['priority']>(task?.priority??'normal');
  const [extraTask,setExtraTask]=useState(()=>taskDraft(task));
  const movieKeys=['originalTitle','genres','runtimeMinutes','description','rating','notes','season','episode','totalSeasons','episodesPerSeason'] as const;
  const [movieExtra,setMovieExtra]=useState<Record<string,string>>(()=>Object.fromEntries(movieKeys.map(k=>[k,Array.isArray(movie?.[k])?(movie[k] as string[]).join(', '):String(movie?.[k]??'')])));const [mediaType,setMediaType]=useState<'movie'|'series'>(movie?.mediaType??'movie');
  const [tagText,setTagText]=useState(item?.tags?.join(', ')??'');const [plannedDate,setPlannedDate]=useState(recipe?.plannedDate??'');
  const [productExtra,setProductExtra]=useState({attributes:product?.attributes??'',ingredientsText:product?.ingredientsText??'',volume:product?.volume??''});
  const [shoppingQty,setShoppingQty]=useState(item?.kind==='shopping_item'?String(item.details.quantity??''):'');const [shoppingUnit,setShoppingUnit]=useState(item?.kind==='shopping_item'?item.details.unit??'':'');
  const [status,setStatus]=useState('');const [picking,setPicking]=useState(false);
  const [showFields,setShowFields]=useState(fixedKind||!!item||defaultKind!=='note');
  const saving=useRef(false);
  const editVersion=useRef(item?.version);
  const attach=async(camera=false)=>{setPicking(true);setStatus('');try{const a=await (camera?takePhoto():pickImage());if(a)setAttachments(old=>[...old,a]);}catch(e){setStatus(t(e instanceof Error&&e.message==='image_permission'?'permissionDenied':'imageError'));}finally{setPicking(false);}};
  const submit=async()=>{if(saving.current)return;saving.current=true;setStatus('');try{
    let details:ItemInput['details'];
    if(kind==='movie')details={mediaType,...Object.fromEntries(Object.entries(movieExtra).filter(([key,value])=>!!value.trim()&&(mediaType==='series'||!['season','episode','totalSeasons','episodesPerSeason'].includes(key))).map(([key,value])=>[key,key==='genres'?value.split(',').map(s=>s.trim()).filter(Boolean):['runtimeMinutes','rating','season','episode','totalSeasons','episodesPerSeason'].includes(key)?Number(value):value])),watchStatus:watch,...(year?{year:Number(year)}:{}),...(director?{director}:{}),...(trailer?{trailerUrl:trailer}:{})} satisfies MovieDetails;
    if(kind==='recipe')details={ingredients:ingredientLines,steps:steps.split('\n'),ingredientAmounts:readAmounts(ingredientLines,amounts),notes:recipeNotes,...(plannedDate?{plannedDate}:{}),...(cookMinutes?{cookMinutes:Number(cookMinutes)}:{}),...(servings?{servings:Number(servings)}:{})} satisfies RecipeDetails;
    if(kind==='product')details={...product,...productExtra,brand,model,productCategory,variant,priceMinor:undefined,currency:undefined,...(product?.offers?{offers:product.offers,currency:currency.toUpperCase()}:{}),...(price?{priceMinor:Math.round(Number(price.replace(',','.'))*100),currency:currency.toUpperCase()}:{})} satisfies ProductDetails;
    if(kind==='shopping_item')details={...(shoppingQty?{quantity:Number(shoppingQty.replace(',','.'))}:{}),...(shoppingUnit?{unit:shoppingUnit}:{})};
    if(kind==='task')details={...taskExtra(extraTask,task),priority,...(due?{dueDate:due}:{})} satisfies TaskDetails;
    const body=contextual&&item&&item.body!==item.title?item.body:text;
    const input:ItemInput={text:body||title||(attachments.length?t('photo'):''),title:contextual?text:title,tags:tagText.split(',').map(x=>x.trim()).filter(Boolean),kind:showFields?kind:undefined,category,sourceUrl,attachments,details};
    const saved=await run(()=>item?repo.edit(item.id,editVersion.current??item.version,input):repo.add(input,contextual||confirmedOnCreate));
    for(const old of item?.attachments??[])if(!saved.attachments.some(a=>a.id===old.id))discardImage(old).catch(()=>{});
    setStatus(t('savedHint'));if(!item){setText('');setTitle('');setSourceUrl('');setAttachments([]);setIngredients('');setSteps('');setAmounts({});setServings('');setCookMinutes('');setRecipeNotes('');setYear('');setDirector('');setTrailer('');setBrand('');setModel('');setPrice('');setDue('');setTagText('');setPlannedDate('');setExtraTask(taskDraft());setMovieExtra(Object.fromEntries(movieKeys.map(k=>[k,''])));setMediaType('movie');setWatch('want');setShoppingQty('');setShoppingUnit('');setProductExtra({attributes:'',ingredientsText:'',volume:''});setVariant('');setCurrency('UAH');setProductCategory('other');setPriority('normal');setKind(defaultKind);setCategory(defaultCategory??(contextual?'shopping':'general'));setShowFields(fixedKind||defaultKind!=='note');}onSaved?.(saved);
  }catch{setStatus(t('error'));}finally{saving.current=false;}};
  return <Card>
    <Field label={t(contextual?'title':'text')} value={text} onChangeText={setText} multiline placeholder={contextual?undefined:t('captureHint')} style={{minHeight:contextual?54:120}} testID="capture-text"/>
    {!showFields&&<Button quiet onPress={()=>setShowFields(true)}>{t('kind')} ＋</Button>}
    {showFields&&<>{!contextual&&<>{!fixedKind&&<><Label muted size={13}>{t('kind')}</Label><Chips values={kinds.filter(k=>!isCollectionKind(k))} value={kind} onChange={setKind} label={v=>t(kindKey(v))}/></>}
    <Field label={t('title')} value={title} onChangeText={setTitle}/>
    {!fixedKind&&<><Label muted size={13}>{t('category')}</Label><Chips values={categories} value={category} onChange={setCategory} label={v=>t(categoryKey(v))}/></>}</>}
    <Field label={t('url')} value={sourceUrl} onChangeText={setSourceUrl} autoCapitalize="none" keyboardType="url"/></>}
    {kind==='shopping_item'&&<><Field label={t('quantity')} value={shoppingQty} onChangeText={setShoppingQty} keyboardType="decimal-pad"/><Field label={t('unit')} value={shoppingUnit} onChangeText={setShoppingUnit}/></>}
    {kind==='task'&&<><Field label={t('due')} value={due} onChangeText={setDue} placeholder="2026-11-02"/><Chips values={['normal','high'] as const} value={priority} onChange={setPriority} label={v=>t(v)}/><TaskFields draft={extraTask} onChange={setExtraTask}/></>}
    {kind==='movie'&&<><Field label={t('year')} value={year} onChangeText={setYear} keyboardType="numeric"/><Field label={t('director')} value={director} onChangeText={setDirector}/><Field label={t('trailer')} value={trailer} onChangeText={setTrailer} autoCapitalize="none"/><Chips values={['movie','series'] as const} value={mediaType} onChange={setMediaType} label={v=>t(v)}/>{movieKeys.filter(k=>mediaType==='series'||!['season','episode','totalSeasons','episodesPerSeason'].includes(k)).map(key=><Field key={key} label={t(key==='season'?'seasonNumber':key as TextKey)} value={movieExtra[key]} onChangeText={value=>setMovieExtra(old=>({...old,[key]:value}))} multiline={key==='notes'||key==='description'}/>)}<Chips values={['want','watching','watched','favorite'] as const} value={watch} onChange={setWatch} label={v=>t(v)}/></>}
    {kind==='recipe'&&<><Field label={t('ingredients')} value={ingredients} onChangeText={setIngredients} multiline style={{minHeight:90}}/><Label muted size={12}>{t('recipeAmountsHint')}</Label><RecipeAmountFields ingredients={ingredientLines} draft={amounts} onChange={setAmounts} disabled={busy}/><Field label={t('steps')} value={steps} onChangeText={setSteps} multiline style={{minHeight:90}}/><Field label={t('servings')} value={servings} onChangeText={setServings} keyboardType="numeric"/><Field label={t('cookMinutes')} value={cookMinutes} onChangeText={setCookMinutes} keyboardType="numeric"/><Field label={t('recipeNotes')} value={recipeNotes} onChangeText={setRecipeNotes} multiline/><Field label={t('plannedDate')} value={plannedDate} onChangeText={setPlannedDate}/></>}
    {kind==='product'&&<><Chips values={['beauty','clothing','tech','home','other'] as const} value={productCategory} onChange={setProductCategory} label={v=>t(v)}/><Field label={t('brand')} value={brand} onChangeText={setBrand}/><Field label={t('model')} value={model} onChangeText={setModel}/><Field label={t('variant')} value={variant} onChangeText={setVariant}/><Field label={t('price')} value={price} onChangeText={setPrice} keyboardType="decimal-pad"/><Field label={t('currency')} value={currency} onChangeText={setCurrency} autoCapitalize="characters"/>{(['attributes','ingredientsText','volume'] as const).map(key=><Field key={key} label={t(key)} value={productExtra[key]} onChangeText={value=>setProductExtra(old=>({...old,[key]:value}))} multiline/>)}</>}
    {showFields&&<Field label={t('tags')} value={tagText} onChangeText={setTagText}/>}
    {attachments.map(a=><View key={a.id} style={{gap:8}}><Image source={{uri:a.uri}} style={{width:'100%',height:180,borderRadius:12,resizeMode:'contain'}}/><Button quiet onPress={()=>{setAttachments(old=>old.filter(x=>x.id!==a.id));if(!item?.attachments.some(x=>x.id===a.id))discardImage(a).catch(()=>{});}}>{t('removeImage')}</Button></View>)}
    <View style={{flexDirection:'row',gap:10,flexWrap:'wrap'}}><Button quiet onPress={()=>{void attach();}} disabled={busy||picking||attachments.length>=3}>{t('image')}</Button><Button quiet onPress={()=>{void attach(true);}} disabled={busy||picking||attachments.length>=3}>{t('takePhoto')}</Button><Button testID="save-item" onPress={()=>{void submit();}} disabled={busy||picking||(!text.trim()&&!attachments.length&&!(showFields&&title.trim()))}>{t(item?'save':contextual?'createProduct':confirmedOnCreate?'addCard':'add')}</Button></View>
    {!!status&&<Label size={13}>{status}</Label>}
  </Card>;
}
