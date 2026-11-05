import type {RecipeDetails,IngredientAmount} from './index.ts';
export function validServings(value:number):boolean{return Number.isInteger(value)&&value>=1&&value<=1000;}
/** Only explicit amounts are scaled. Legacy text remains verbatim. */
export function recipeAmounts(details:RecipeDetails,servings?:number):IngredientAmount[]{
  if(servings!==undefined&&(!validServings(servings)||!details.servings))throw new Error('invalid_servings');
  const ratio=servings===undefined?1:servings/details.servings!;
  return (details.ingredientAmounts??[]).map(a=>({...a,quantity:a.quantity*ratio}));
}
export function ingredientLabel(ingredient:string,amount?:IngredientAmount):string{
  return amount?ingredient+' — '+Number(amount.quantity.toPrecision(6))+(amount.unit?' '+amount.unit:''):ingredient;
}
