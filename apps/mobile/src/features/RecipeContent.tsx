import {AiWorkspace} from './AiWorkspace';
import React,{useState} from 'react';import {View} from 'react-native';import type {Item} from '@life-os/domain';import {recipeAmounts,ingredientLabel,validServings} from '@life-os/domain/recipes';import {Label,Chips,Field,Button} from '../ui';import {useApp} from '../context';import {RecipeShopping} from './RecipeShopping';
export function RecipeContent({recipe,readOnly=false}:{recipe:Item&{kind:'recipe'};readOnly?:boolean}){
  const {t,repo,run,busy}=useApp();const details=recipe.details;const [tab,setTab]=useState<'recipeTab'|'recipeIngredientTab'|'notesTab'>('recipeTab');const [plannedDate,setPlannedDate]=useState(details.plannedDate??'');const [servings,setServings]=useState(String(details.servings??''));
  const valid=!details.servings||validServings(Number(servings));const target=details.servings&&valid?Number(servings):undefined;const amounts=recipeAmounts(details,target);
  return <View style={{gap:14}}>{details.cookMinutes!==undefined&&<Label>{t('cookingTime')}: {details.cookMinutes} {t('minutesShort')}</Label>}
    {details.caloriesPerServing!==undefined&&<Label>{details.caloriesPerServing} ккал / порция · из сохранённого рецепта</Label>}
    {!readOnly&&<Button quiet disabled={busy} onPress={()=>{run(()=>repo.favorite(recipe.id,!recipe.favorite)).catch(()=>{});}}>{t(recipe.favorite?'removeFavorite':'addFavorite')}</Button>}
    {details.servings?<><Field label={t('servings')} value={servings} onChangeText={setServings} keyboardType="numeric" editable={!readOnly}/><Label muted size={12}>{t('servingPreview')}</Label>{!valid&&<Label>{t('recipeInvalidNumber')}</Label>}</>:<Label muted size={12}>{t('noBaseServings')}</Label>}
    {!readOnly&&recipe.inboxStatus==='confirmed'&&<RecipeShopping recipe={recipe} servings={target} disabled={!valid}/>}
    {!readOnly&&<><Field label={t('plannedDate')} value={plannedDate} onChangeText={setPlannedDate}/><Button quiet disabled={!plannedDate} onPress={()=>{run(()=>repo.updateDetails(recipe.id,recipe.version,{...details,plannedDate})).catch(()=>{});}}>{t('planRecipe')}</Button>{details.plannedDate&&<Label>{t('plannedDate')}: {details.plannedDate}</Label>}</>}
    {!readOnly&&<><Button quiet onPress={()=>setTab('notesTab')}>Просчитать калорийность</Button>{tab==='notesTab'&&<AiWorkspace purpose="calories" title="Калорийность рецепта" prompt={'Recipe: '+recipe.title+' Ingredients: '+JSON.stringify(details.ingredientAmounts??details.ingredients)+' Servings: '+(details.servings??'unknown')} example="Вы: Рассчитай калорийность порции.\nИИ: Укажите вес каждого ингредиента, количество масла и число порций. Без этих данных точный расчёт невозможен."/>}</>}
    <Chips values={['recipeTab','recipeIngredientTab','notesTab'] as const} value={tab} onChange={setTab} label={t}/>
    {tab==='recipeTab'&&<><Label weight="600">{t('cookingSteps')}</Label>{details.steps.length?details.steps.map((step,i)=><Label key={i}>{i+1}. {step}</Label>):<Label muted>{t('unknown')}</Label>}</>}
    {tab==='recipeIngredientTab'&&<><Label weight="600">{t('recipeIngredientTab')}</Label>{details.ingredients.map((ingredient,i)=><Label key={i}>○ {ingredientLabel(ingredient,amounts.find(a=>a.ingredient===ingredient))}</Label>)}</>}
    {tab==='notesTab'&&<Label>{details.notes||t('noRecipeNotes')}</Label>}
  </View>;
}
