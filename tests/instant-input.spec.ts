import {test,expect,type Page} from '@playwright/test';
/**
 * First-tap input (iPhone rule): the field must be focused *while the tap is being handled* — iOS opens the keyboard
 * only then. Every focus() call is recorded together with the event being dispatched at that moment
 * (window.event); a focus that happens later (timer, animation end, next render) has no event.
 * Chromium cannot show the iOS keyboard, so this checks the condition iOS needs, not the keyboard itself.
 */
test.use({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
async function instrument(page:Page){await page.addInitScript(()=>{const w=window as any;w.__focusLog=[];const orig=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(this:HTMLElement,...a:any[]){w.__focusLog.push({stack:this.dataset.keyboardHandoff||this.getAttribute('aria-label')?'':String(new Error().stack).split('\n').slice(2,6).join(' < '),label:this.dataset.keyboardHandoff?'handoff':(this.getAttribute('aria-label')||this.getAttribute('placeholder')||this.tagName),event:(window.event as Event|undefined)?.type??null});return orig.apply(this,a as any);};});}
const clear=(page:Page)=>page.evaluate(()=>{(window as any).__focusLog=[];});
async function focusedDuringTap(page:Page,label:RegExp){
 await page.waitForTimeout(400);
 const log:{label:string;event:string|null}[]=await page.evaluate(()=>(window as any).__focusLog);
 const active=await page.evaluate(()=>{const e=document.activeElement as HTMLElement|null;return e?.getAttribute('aria-label')||e?.getAttribute('placeholder')||e?.tagName||'';});
 // The keyboard must open during the tap: either the field itself or the screen-change hand-off is focused then,
 // and the caret must end up in the expected field.
 const hit=log.find(l=>label.test(l.label))??null;const first=log[0]??null;
 const viaHandoff=first?.label==='handoff';
 // Via hand-off: the last focus before the real field must be the hand-off itself (nothing dropped the keyboard in between).
 const targetIndex=log.findIndex(l=>label.test(l.label));const before=targetIndex>0?log[targetIndex-1]:null;
 const kept=!viaHandoff||before?.label==='handoff';
 return {active,kept,event:viaHandoff?(label.test(active)&&kept?first!.event:null):hit?.event??null,viaHandoff,log:log.map((l:any)=>l.label+'@'+l.event+(l.stack?' ['+l.stack.slice(0,300)+']':'')).join(', ')};
}
const gesture=/^(touchend|click|pointerup|mouseup|keydown)$/;
const themes=['Soft Future','Тёплый минимализм','Минимал · Типографика Inter'];
async function useTheme(page:Page,label:string){await page.goto('/settings');await page.getByText('Тема оформления',{exact:true}).click();const option=page.getByRole('radio',{name:label});if(await option.getAttribute('aria-checked')!=='true')await option.click();await page.waitForTimeout(300);}

for(const theme of themes)test.describe(theme,()=>{
test.beforeEach(async({page})=>{await instrument(page);await useTheme(page,theme);await page.goto('/');await expect(page.getByRole('button',{name:'Покупки и желания',exact:true})).toBeVisible();});
const cases:[string,(p:Page)=>Promise<void>,RegExp][]=[
 ['раздел: «+» → «Название»',async p=>{await p.getByRole('button',{name:'Дом и уют',exact:true}).tap();await p.waitForTimeout(500);await clear(p);await p.getByRole('button',{name:'Добавить',exact:true}).first().tap();},/^Название$/],
 ['поиск на главной',async p=>{await clear(p);await p.getByRole('button',{name:'Поиск',exact:true}).first().tap();},/Найти в LIFE OS/],
 ['«Работа и идеи»: новая заметка',async p=>{await p.getByRole('button',{name:'Работа и идеи',exact:true}).tap();await p.waitForTimeout(500);await clear(p);await p.getByRole('button',{name:'Новая заметка',exact:true}).tap();},/Заголовок заметки/],
 ['«Доходы и расходы»: день',async p=>{await p.getByRole('button',{name:'Доходы и расходы',exact:true}).tap();await p.waitForTimeout(500);await clear(p);await p.getByRole('button',{name:/^Добавить доход \d{4}-\d{2}-\d{2}/}).nth(9).tap();},/Сумма дохода/],
 ['«Питание»: ячейка плана',async p=>{await p.getByRole('button',{name:'Питание',exact:true}).tap();await p.waitForTimeout(500);await clear(p);await p.getByRole('button',{name:/ · Добавить$/}).first().tap();},/Название блюда в плане/],
 ['нижняя панель «+» → раздел',async p=>{await p.getByRole('tab',{name:'Добавить'}).or(p.getByRole('button',{name:'Добавить',exact:true})).first().tap();await p.waitForTimeout(500);await clear(p);await p.getByText('Дом и уют',{exact:true}).last().tap();},/^Название$/],
 ['«Отношения»: «+»',async p=>{await p.getByRole('button',{name:'Отношения',exact:true}).tap();await p.waitForTimeout(500);await clear(p);await p.getByRole('button',{name:'Добавить запись',exact:true}).tap();},/./],
 ['привычка на главной: «+»',async p=>{await clear(p);await p.getByRole('button',{name:'Добавить привычку',exact:true}).tap();},/./],
];
// Every category whose header «+» opens an editor or a search field directly.
for(const section of ['Покупки и желания','Здоровье','Гардероб','Фильмы','Поездки','Родители','Регулярные покупки'])cases.push(['категория «'+section+'»: «+»',async p=>{await p.getByRole('button',{name:section,exact:true}).first().tap();await p.waitForTimeout(600);await clear(p);await p.getByRole('button',{name:/^(Добавить|Найти и добавить фильм)$/}).first().tap();},/./]);
for(const [name,act,label] of cases)test('первое касание: '+name,async({page})=>{
 await act(page);const r=await focusedDuringTap(page,label);
 console.log(name,'→',JSON.stringify(r));expect(r.active).toMatch(label);
 expect(r.event,'focus must happen during the tap ('+r.log+')').toMatch(gesture);
});

test('просмотр записи не открывает клавиатуру',async({page})=>{
 await page.getByRole('button',{name:'Дом и уют',exact:true}).tap();await page.waitForTimeout(500);await clear(page);
 await page.getByText('Помыть полы',{exact:true}).first().tap();await page.waitForTimeout(500);
 const active=await page.evaluate(()=>document.activeElement?.tagName);
 expect(active).not.toMatch(/INPUT|TEXTAREA/);
});

test('«Работа и идеи» с add=1 открывает только редактор заметки',async({page})=>{
 await page.goto('/planner?section=work&add=1');await page.waitForTimeout(1500);
 await expect(page.getByLabel('Заголовок заметки')).toBeVisible();
 await expect(page.getByText('Добавить',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Сохранить',{exact:true})).toHaveCount(0);
});
});
