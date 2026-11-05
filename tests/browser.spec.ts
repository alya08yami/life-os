import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{page.on('pageerror',error=>console.error('App runtime:',error.message));});
test.afterEach(async({page})=>{expect(await page.pageErrors()).toEqual([]);});
test('organizer persists and connects capture, confirmation, search, edit and delete',async({page})=>{
  await page.goto('http://127.0.0.1:8081');
  await expect(page.getByRole('button',{name:'Хотелки',exact:true})).toBeVisible();
  await page.screenshot({path:'docs/screenshots/today-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Входящие',exact:true}).click();
  await expect(page.getByRole('radio',{name:'К разбору',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Добавить',exact:true}).click();
  await page.getByTestId('capture-text').fill('Нужно купить корм коту');
  await page.getByTestId('save-item').click();
  await page.getByRole('button',{name:/Нужно купить корм коту/}).click();
  await expect(page.getByText(/Предложение по правилу/)).toBeVisible();
  await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  await expect(page.getByRole('button',{name:'Отметить выполненным',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Редактировать',exact:true}).click();
  await page.getByRole('textbox',{name:'Название',exact:true}).fill('Корм для кота');
  await page.getByRole('button',{name:'Сохранить изменения',exact:true}).click();
  await expect(page.getByRole('button',{name:'Редактировать',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByText('Корм для кота',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Назад',exact:true}).click();
  await page.getByRole('tab',{name:'Поиск'}).click();
  await page.getByRole('textbox',{name:'Поиск',exact:true}).fill('корм');
  await page.getByRole('button',{name:'Корм для кота',exact:true}).click();
  await page.getByRole('button',{name:'Удалить',exact:true}).click();
  await page.getByRole('button',{name:'Удалить',exact:true}).click();
  await expect(page.getByText('Корм для кота',{exact:true})).toHaveCount(0);
});
test('image bytes survive reload in the browser',async({page})=>{
  await page.goto('http://127.0.0.1:8081/inbox');
  await page.getByRole('button',{name:'Добавить',exact:true}).click();
  await page.getByTestId('capture-text').fill('Screenshot test');
  const chooser=page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'Добавить изображение',exact:true}).click();
  await (await chooser).setFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=','base64')});
  await expect(page.getByRole('button',{name:'Убрать изображение',exact:true})).toBeVisible();
  await page.getByTestId('save-item').click();
  await page.getByRole('button',{name:/Screenshot test/}).click();
  await expect(page).toHaveURL(/\/item\//);
  await page.reload();
  await expect(page.getByRole('img',{name:'Screenshot test',exact:true})).toBeVisible();
});
test('home template and language/theme settings persist',async({page})=>{
  await page.goto('http://127.0.0.1:8081/spaces');
  await page.getByRole('button',{name:'＋ 3',exact:true}).first().click();
  await page.getByRole('button',{name:'Добавить задачи',exact:true}).click();
  await expect(page.getByRole('button',{name:'Убрать вещи по местам',exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:8081/settings');
  await page.getByRole('radio',{name:'English',exact:true}).click();
  await page.getByRole('radio',{name:'Dark',exact:true}).click();
  await expect(page.getByRole('radio',{name:'Dark',exact:true})).toBeChecked();
  await page.reload();
  await expect(page.getByRole('radio',{name:'Dark',exact:true})).toBeChecked();
  await expect(page.getByText('Your space',{exact:true})).toBeVisible();
  await page.screenshot({path:'docs/screenshots/settings-dark.png',fullPage:true});
});
for(const fixture of [
  {kind:'movie',text:'Arrival',fields:[['Год','2016'],['Режиссёр','Denis Villeneuve']],expected:'2016 · Denis Villeneuve'},
  {kind:'recipe',text:'Simple soup',fields:[['Ингредиенты · по одному на строку','Water\nCarrot'],['Шаги · по одному на строку','Boil water\nAdd carrot']],expected:'○ Carrot'},
  {kind:'product',text:'Daily cream',fields:[['Бренд','Example brand'],['Модель','Daily'],['Цена','12.50']],expected:'12.50 UAH'}
])test('manual '+fixture.kind+' card preserves its typed fields',async({page})=>{
  await page.goto('http://127.0.0.1:8081/inbox?kind='+fixture.kind);
  await page.getByTestId('capture-text').fill(fixture.text);
  for(const [name,value] of fixture.fields)await page.getByRole('textbox',{name,exact:true}).fill(value);
  await page.getByTestId('save-item').click();
  await page.getByRole('button',{name:new RegExp(fixture.text)}).click();
  await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  if(fixture.kind==='recipe')await page.getByRole('radio',{name:'Ингредиенты',exact:true}).click();
  await expect(page.getByText(fixture.expected,{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Подтвердить',exact:true})).toHaveCount(0);
});
test('persistent storage errors keep a usable retry control',async({page})=>{
  await page.addInitScript(()=>{IDBFactory.prototype.open=function(){throw new DOMException('blocked','SecurityError');};});
  await page.goto('http://127.0.0.1:8081');
  await expect(page.getByText(/Не удалось открыть хранилище/)).toBeVisible();
  await page.getByRole('button',{name:'Повторить',exact:true}).click();
  await expect(page.getByRole('button',{name:'Повторить',exact:true})).toBeVisible();
});
