import {test,expect} from '@playwright/test';
const shots='docs/screenshots';
/** «Доходы и расходы» opens on the current month; the example operations are in October 2026. */
async function toOctober2026(page:import('@playwright/test').Page){const now=new Date();const diff=(now.getFullYear()-2026)*12+now.getMonth()-9;for(let i=0;i<diff;i++)await page.getByRole('button',{name:'Предыдущий месяц',exact:true}).click();for(let i=0;i<-diff;i++)await page.getByRole('button',{name:'Следующий месяц',exact:true}).click();await expect(page.getByText('октябрь 2026')).toBeVisible();}
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.getByRole('button',{name:'Покупки и желания',exact:true})).toBeVisible();});
test('home weeks slide and multiple habits keep only one exercise label',async({page})=>{const habits=page.getByRole('button',{name:/^Привычка «.+»: изменить$/});await expect(page.getByRole('button',{name:'Привычка «Упражнения»: изменить',exact:true})).toHaveCount(1);await expect(page.getByText('0/1',{exact:true})).toHaveCount(0);const before=await page.getByRole('button',{name:/^\d{4}-\d{2}-\d{2} — добавить запись$/}).first().getAttribute('aria-label');await page.getByRole('button',{name:'Следующая неделя · Мой календарь',exact:true}).click();await expect(page.getByRole('button',{name:before!,exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Добавить привычку',exact:true}).click();await page.getByLabel('Название',{exact:true}).fill('Пить воду');await page.getByRole('button',{name:'Добавить',exact:true}).last().click();await expect(habits).toHaveCount(2);await expect(page.getByText('Пить воду',{exact:true})).toBeVisible();await page.reload();await expect(habits).toHaveCount(2);await page.screenshot({path:shots+'/quick-home.png'});});
test('shopping is a plain list and back returns to that list',async({page})=>{await page.getByRole('button',{name:'Покупки и желания',exact:true}).click();await expect(page.getByText('New Balance 530',{exact:true})).toBeVisible();await expect(page.locator('img:visible')).toHaveCount(0);await page.getByText('New Balance 530',{exact:true}).click();await expect(page.getByText('Где дешевле',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Назад',exact:true}).click();await expect(page.getByRole('tab',{name:'Желания',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Привычка',exact:true})).toHaveCount(0);await page.screenshot({path:shots+'/quick-shopping.png'});});
test('health opens medication first, glyphs replace photos and purchase is instant',async({page})=>{await page.getByRole('button',{name:'Здоровье',exact:true}).click();await expect(page.getByRole('tab',{name:'Лекарства',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tab',{name:'Обзор',exact:true})).toHaveCount(0);await expect(page.locator('img:visible')).toHaveCount(0);await page.getByRole('button',{name:'Купить: Магний',exact:true}).click();await page.getByRole('button',{name:'Купить: Магний',exact:true}).click();await expect(page.getByText('Магний — куплено 2 уп.',{exact:true})).toBeVisible();await expect(page.getByText('Отметить покупку',{exact:true})).toHaveCount(0);await page.getByRole('tab',{name:'Куплено недавно',exact:true}).click();await expect(page.getByText('Магний',{exact:true})).toHaveCount(2);await page.getByRole('tab',{name:'Текущие',exact:true}).click();await expect(page.getByRole('button',{name:'Купить: Магний',exact:true})).toBeVisible();await page.screenshot({path:shots+'/quick-medications.png'});});
test('regular plus counts rapid taps, animates quantity and preserves purchase history',async({page})=>{await page.getByRole('button',{name:'Регулярные покупки',exact:true}).click();const plus=page.getByRole('button',{name:'Купить: Зубная паста',exact:true});await plus.click();await plus.click();await plus.click();await expect(page.getByText('Зубная паста — куплено 3 шт.',{exact:true})).toBeVisible();await expect(page.getByText('Отметить покупку',{exact:true})).toHaveCount(0);await page.getByRole('tab',{name:'Куплено недавно',exact:true}).click();await expect(page.getByText('3 шт.',{exact:true})).toBeVisible();await expect(page.getByText('Зубная паста',{exact:true})).toHaveCount(2);await page.getByRole('tab',{name:'Список',exact:true}).click();await expect(plus).toBeVisible();await page.waitForTimeout(700);await plus.click();await expect(page.getByText('Зубная паста — куплено 1 шт.',{exact:true})).toBeVisible();await page.getByRole('tab',{name:'Куплено недавно',exact:true}).click();await expect(page.getByText('Зубная паста',{exact:true})).toHaveCount(3);await page.reload();await expect(plus).toBeVisible();await page.screenshot({path:shots+'/quick-regular.png'});});
test('food opens aligned weekly plan, saves and applies a weekly template, detail returns one step',async({page})=>{await page.getByRole('button',{name:'Питание',exact:true}).click();await expect(page.getByRole('tab',{name:'План',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByText('Сегодня',{exact:true})).toHaveCount(0);await expect(page.getByRole('tab',{name:'Ингредиенты',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Добавить',exact:true}).click();await expect(page.getByText('Добавить блюдо',{exact:true})).toBeVisible();await expect(page.getByText('Сканировать фото',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Закрыть',exact:true}).click();await page.getByRole('button',{name:'Сохранить неделю как шаблон',exact:true}).click();await page.getByLabel('Название шаблона недели',{exact:true}).fill('Неделя QA');await page.getByText('Сохранить шаблон',{exact:true}).click();await expect(page.getByText('Неделя QA',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Следующая неделя · План питания',exact:true}).click();await page.getByText('Применить к этой неделе',{exact:true}).last().click();await expect(page.getByText('Шаблон применён к выбранной неделе',{exact:true})).toBeVisible();const meal=page.getByRole('button',{name:/^Завтрак · \d{4}-\d{2}-\d{2} · Овсянка/}).first();await expect(meal).toBeVisible();await meal.click();await expect(page.getByText('Ингредиенты',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Назад',exact:true}).click();await expect(page.getByRole('tab',{name:'План',exact:true})).toHaveAttribute('aria-selected','true');await expect(meal).toBeVisible();await page.getByText('Закрыть',{exact:true}).click();await page.getByRole('tab',{name:'План',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:shots+'/quick-plan.png'});});
test('finance day tap focuses decimal input and blur saves a single dollar amount; notes inline',async({page})=>{await page.getByRole('button',{name:'Доходы и расходы',exact:true}).click();await toOctober2026(page);await expect(page.getByText('＋ Добавить доход',{exact:true})).toHaveCount(0);const cell=page.getByRole('button',{name:'Добавить доход 2026-10-06',exact:true});await cell.click();const input=page.getByLabel('Сумма дохода',{exact:true});await expect(input).toBeFocused();await expect(input).toHaveAttribute('inputmode','decimal');await input.fill('25,50');await input.press('Tab');await expect(input).toHaveCount(0);await expect(cell).toContainText('25.5 $');await page.getByRole('tab',{name:'Расходы',exact:true}).click();const expense=page.getByRole('button',{name:'Добавить расход 2026-10-06',exact:true});await expense.click();const expenseInput=page.getByLabel('Сумма расхода',{exact:true});await expect(expenseInput).toBeFocused();await expenseInput.fill('10');await expenseInput.press('Enter');await expect(expenseInput).toHaveCount(0);await expect(expense).toContainText('10 $');await page.getByRole('button',{name:'Добавить заметку к финансам',exact:true}).click();const note=page.getByLabel('Новая заметка к финансам',{exact:true});await expect(note).toBeFocused();await note.fill('Проверить бюджет недели');await note.press('Enter');await expect(note).toHaveCount(0);await expect(page.getByText('Проверить бюджет недели',{exact:true})).toHaveCount(1);await page.reload();await expect(page.getByText('Проверить бюджет недели',{exact:true})).toHaveCount(1);await toOctober2026(page);await page.getByRole('button',{name:'Добавить доход 2026-10-06',exact:true}).waitFor();await expect(page.getByRole('button',{name:'Добавить доход 2026-10-06',exact:true})).toContainText('25.5 $');await page.screenshot({path:shots+'/quick-finance.png'});});
test('calendar responds to horizontal week swipe and the search back step retains the query',async({page})=>{const old=await page.getByRole('button',{name:/^\d{4}-\d{2}-\d{2} — добавить запись$/}).first().getAttribute('aria-label');await page.getByTestId('week-slider-Мой календарь').hover();await page.mouse.wheel(350,0);await expect(page.getByRole('button',{name:old!,exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Поиск',exact:true}).first().click();await page.getByPlaceholder('Найти в LIFE OS…').fill('New Balance 530');await page.getByText('New Balance 530',{exact:true}).click();await expect(page.getByText('Где дешевле',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Назад',exact:true}).click();await expect(page.getByPlaceholder('Найти в LIFE OS…')).toHaveValue('New Balance 530');});
test('meal cell creates a dish with ingredients in the selected slot and persists it',async({page})=>{await page.getByRole('button',{name:'Питание',exact:true}).click();const cell=page.getByRole('button',{name:/^Завтрак · .* · Добавить$/}).first();const label=await cell.getAttribute('aria-label');await cell.click();const entry=page.getByLabel('Название блюда в плане',{exact:true});await expect(entry).toBeInViewport();await expect(page.getByLabel('Ингредиент 1',{exact:true})).toBeInViewport();await entry.fill('Омлет QA');await page.getByLabel('Ингредиент 1',{exact:true}).fill('Яйца');await page.getByLabel('Количество 1',{exact:true}).fill('2');await page.getByLabel('Единица 1',{exact:true}).fill('шт.');await page.getByText('Добавить в план',{exact:true}).click();const saved=page.getByRole('button',{name:label!.replace('Добавить','Омлет QA'),exact:true});await expect(saved).toBeVisible();await saved.click();await expect(page.getByText('Яйца',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Назад',exact:true}).click();await page.reload();await expect(saved).toBeVisible();});

test('section tabs do not create back steps but details return to the selected tab',async({page})=>{
 await page.getByRole('button',{name:'Дом и уют',exact:true}).click();
 await page.getByRole('tab',{name:'Починить',exact:true}).click();
 await page.getByRole('button',{name:'Назад',exact:true}).click();
 await expect(page.getByRole('button',{name:'Добавить привычку',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Регулярные покупки',exact:true}).click();
 await page.getByRole('tab',{name:'Куплено недавно',exact:true}).click();
 await page.getByText('Зубная паста',{exact:true}).first().click();
 await expect(page.getByText('Частота покупки',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Назад',exact:true}).click();
 await expect(page.getByRole('tab',{name:'Куплено недавно',exact:true})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'Назад',exact:true}).click();
 await expect(page.getByRole('button',{name:'Добавить привычку',exact:true})).toBeVisible();
});
test('meal plus opens visible entry sheet at the commented viewport',async({page})=>{await page.setViewportSize({width:615,height:647});await page.getByRole('button',{name:'Питание',exact:true}).click();await page.getByRole('button',{name:/^Завтрак · .* · Добавить$/}).first().click();await expect(page.getByLabel('Название блюда в плане',{exact:true})).toBeInViewport();await expect(page.getByLabel('Ингредиент 1',{exact:true})).toBeInViewport();await page.screenshot({path:shots+'/meal-entry-sheet.png'});await page.getByRole('button',{name:'Закрыть',exact:true}).click();await expect(page.getByLabel('Название блюда в плане',{exact:true})).toHaveCount(0);});

test('finance entry stays inside the tapped calendar cell',async({page})=>{await page.setViewportSize({width:615,height:647});await page.getByRole('button',{name:'Доходы и расходы',exact:true}).click();await toOctober2026(page);const cell=page.getByRole('button',{name:'Добавить доход 2026-10-08',exact:true});await cell.click();const input=page.getByLabel('Сумма дохода',{exact:true});await expect(input).toBeFocused();await expect(input).toBeInViewport();const box=await input.boundingBox(),parent=await cell.boundingBox();expect(box!.width).toBeLessThan(80);expect(box!.y).toBeGreaterThanOrEqual(parent!.y);expect(box!.y+box!.height).toBeLessThanOrEqual(parent!.y+parent!.height);await input.fill('42');await page.screenshot({path:shots+'/finance-cell-entry.png'});await input.press('Enter');await expect(cell).toContainText('42 $');await expect(input).toHaveCount(0);});
test('relationships opens from dashboard with the four reference tabs',async({page})=>{
 await page.getByRole('button',{name:'Отношения',exact:true}).click();
 for(const name of ['Идеи','Секс','Ссоры','Подарки'])await expect(page.getByRole('tab',{name,exact:true})).toBeVisible();
 await expect(page.getByText('Оставить записку в ланче',{exact:true})).toBeVisible();
 // A completed idea is listed once, under «Выполнено».
 await expect(page.getByText('Сходить на свидание',{exact:true})).toHaveCount(1);
});
test('clearing a saved finance amount removes it after reload',async({page})=>{
 await page.getByRole('button',{name:'Доходы и расходы',exact:true}).click();await toOctober2026(page);
 for(const [direction,kind] of [['Доходы','доход'],['Расходы','расход']]){
  await page.getByRole('tab',{name:direction,exact:true}).click();
  const date='2026-10-01';
  const edit=page.getByRole('button',{name:'Изменить сумму '+date,exact:true});
  await edit.click();
  const input=page.getByRole('textbox',{name:/Сумма (дохода|расхода)/});
  await expect(input).toBeFocused();
  await input.fill('');
  await input.press('Enter');
  await expect(page.getByText('Сумма удалена',{exact:true})).toBeVisible();
  await expect(edit).toHaveCount(0);
  await page.reload();
  await toOctober2026(page);
  await page.getByRole('tab',{name:direction,exact:true}).click();
  await expect(page.getByRole('button',{name:'Добавить '+kind+' '+date,exact:true})).toHaveText('1');
 }
});
test('relationship entries add and edit in place in the selected category',async({page})=>{
 await page.getByRole('button',{name:'Отношения',exact:true}).click();
 await page.getByRole('tab',{name:'Подарки',exact:true}).click();
 await page.getByRole('button',{name:'Добавить запись',exact:true}).click();
 const entry=page.getByRole('textbox',{name:'Новая запись',exact:true});
 await expect(entry).toBeFocused();
 await entry.fill('Билеты на концерт');
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();
 await page.getByRole('button',{name:'Редактировать: Билеты на концерт',exact:true}).click({delay:650});
 const edit=page.getByRole('textbox',{name:'Текст записи',exact:true});
 await expect(edit).toBeFocused();
 await edit.fill('Билеты в театр');
 await edit.press('Enter');
 await expect(page.getByRole('checkbox',{name:'Билеты в театр',exact:true})).toBeVisible();
});

test('shift calendar keeps marks centered and persists day changes',async({page})=>{
 await page.getByRole('button',{name:'Мой календарь',exact:true}).last().click();
 const cell=page.locator('[data-testid^="shift-day-"][aria-label$="сегодня"]');
 await expect(cell).toHaveCount(1);
 const date=(await cell.getAttribute('data-testid'))!.slice('shift-day-'.length);
 // Tapping a day opens its quick sheet (event name, migraine, intimacy, period); the sheet is the last copy in the page.
 const sheetOption=(name:string)=>page.getByRole('button',{name,exact:true}).last();
 const markers=cell.getByTestId('shift-markers');
 const verify=async(order:string[])=>{
  const children=markers.locator('[data-testid^="marker-"]');
  await expect(children).toHaveCount(order.length);
  const bounds=await markers.boundingBox();
  const first=await children.first().boundingBox();
  const last=await children.last().boundingBox();
  expect(Math.abs((first!.x+last!.x+last!.width)/2-(bounds!.x+bounds!.width/2))).toBeLessThan(1);
  expect(await children.evaluateAll(items=>items.map(item=>item.getAttribute('data-testid')))).toEqual(order.map(kind=>'marker-'+kind));
 };
 await cell.click();
 await sheetOption('Мигрень — Не отмечено').click();
 // Choosing «Мигрень» already means marking it: the switch starts on.
 await expect(page.getByLabel('Отметить мигрень',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();
 await verify(['migraine']);
 await cell.click();
 await sheetOption('Половой акт — Не отмечено').click();
 await page.getByLabel('Отметить половой акт',{exact:true}).click();
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();
 await verify(['migraine','personal']);
 await cell.click();
 await page.getByLabel('Название события',{exact:true}).fill('Встреча');
 await page.getByRole('button',{name:'Сохранить событие',exact:true}).click();
 for(const width of [320,390,430]){
  await page.setViewportSize({width,height:844});
  await verify(['migraine','personal','event']);
 }
 await expect(cell.getByTestId('marker-event')).toHaveCount(1);
 await expect(cell.getByTestId('shift-today')).toHaveCount(1);
 await page.reload();
 await expect(page.getByTestId('shift-day-'+date).getByTestId('marker-event')).toHaveCount(1);
 await page.getByRole('button',{name:'14:00 Встреча',exact:true}).first().click();
 await page.getByRole('button',{name:'Удалить событие',exact:true}).click();
 await page.getByRole('button',{name:'Удалить',exact:true}).click();
 await expect(page.getByTestId('shift-day-'+date).getByTestId('marker-event')).toHaveCount(0);
 await page.getByRole('button',{name:'Отменить',exact:true}).click();
 await expect(page.getByTestId('shift-day-'+date).getByTestId('marker-event')).toHaveCount(1);
 await page.getByRole('button',{name:'Следующий месяц',exact:true}).click();
 await expect(page.getByRole('button',{name:'14:00 Встреча',exact:true})).toHaveCount(0);
});