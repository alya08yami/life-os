import {test,expect} from '@playwright/test';
test.afterEach(async({page})=>{expect(await page.pageErrors()).toEqual([]);});
test('home configuration persists order, favorites and hidden sections with an open path',async({page})=>{
  await page.goto('http://127.0.0.1:8081');
  for(const name of ['Главная','Поиск','Добавить','Мои дела','Профиль'])await expect(page.getByRole('tab',{name,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Хотелки',exact:true}).click({delay:600});
  await page.getByRole('button',{name:'Вернуть разделы',exact:true}).click();
  await page.getByRole('button',{name:'Выше: Дом',exact:true}).click();
  await page.getByRole('button',{name:'В избранное: Поездки',exact:true}).click();
  await page.getByRole('checkbox',{name:'Показывать раздел: Гардероб',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Показывать раздел: Гардероб',exact:true})).not.toBeChecked();
  await page.getByRole('button',{name:'Открыть раздел: Гардероб',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Гардероб',exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:8081');
  await expect(page.getByRole('button',{name:'Гардероб',exact:true})).toHaveCount(0);
  const trip=await page.getByRole('button',{name:'Поездки',exact:true}).boundingBox(),home=await page.getByRole('button',{name:'Дом',exact:true}).boundingBox();
  expect(trip).not.toBeNull();expect(home).not.toBeNull();expect(Math.abs(trip!.y-home!.y)).toBeLessThan(2);expect(trip!.x).toBeLessThan(home!.x);
  await page.screenshot({path:'docs/screenshots/full-update-home.png',fullPage:true});
});
test('central Add and Profile are real routes and a note does not create a task',async({page})=>{
  await page.goto('http://127.0.0.1:8081');
  await page.getByRole('button',{name:'Мои дела',exact:true}).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('radio',{name:'Выполненные',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Добавить',exact:true}).click();
  await page.getByTestId('capture-text').fill('Navigation note');await page.getByTestId('save-item').click();
  await expect(page).toHaveURL(/\/item\//);
  await page.goto('http://127.0.0.1:8081/profile');
  await expect(page.getByText('Локальный профиль',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Мои дела',exact:true}).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('button',{name:'Navigation note',exact:true})).toHaveCount(0);
  await page.goto('http://127.0.0.1:8081/inbox');
  await expect(page.getByRole('button',{name:'Navigation note',exact:true})).toBeVisible();
});
test('legacy Inbox and library direct routes remain available',async({page})=>{
  await page.goto('http://127.0.0.1:8081/inbox');
  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByRole('heading',{name:'Входящие',exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:8081/spaces');
  await expect(page).toHaveURL(/\/spaces$/);
  await expect(page.getByRole('heading',{name:'Пространства',exact:true})).toBeVisible();
});

test('hide, archive, trash and restoration preserve an existing record across reload',async({page})=>{
  await page.goto('http://127.0.0.1:8081/add');
  await page.getByTestId('capture-text').fill('Lifecycle record');await page.getByTestId('save-item').click();
  await expect(page).toHaveURL(/\/item\//);const detail=page.url();
  await page.getByRole('button',{name:'Действия с карточкой: Lifecycle record',exact:true}).click();
  await page.getByRole('button',{name:'Скрыть карточку',exact:true}).click();
  await expect(page.getByText('Скрытое',{exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:8081/inbox');await expect(page.getByRole('button',{name:'Lifecycle record',exact:true})).toHaveCount(0);
  await page.goto('http://127.0.0.1:8081/search');await page.getByRole('textbox',{name:'Поиск',exact:true}).fill('Lifecycle record');
  await expect(page.getByRole('button',{name:'Lifecycle record',exact:true})).toContainText('Скрытое');
  await page.goto(detail);await page.getByRole('button',{name:'Восстановить',exact:true}).click();
  await page.getByRole('button',{name:'Действия с карточкой: Lifecycle record',exact:true}).click();
  await page.getByRole('button',{name:'В архив',exact:true}).click();await expect(page.getByText('Архив',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Действия с карточкой',exact:true,includeHidden:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Удалить',exact:true}).click();await page.getByRole('button',{name:'Удалить',exact:true}).click();
  await expect(page).toHaveURL(/\/spaces$/);
  await page.goto('http://127.0.0.1:8081/search');await page.getByRole('textbox',{name:'Поиск',exact:true}).fill('Lifecycle record');
  await expect(page.getByText('Ничего не найдено',{exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:8081/saved-management?view=trashed');
  await page.reload();await expect(page.getByRole('button',{name:'Lifecycle record',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Восстановить',exact:true}).click();
  await expect(page.getByRole('button',{name:'Lifecycle record',exact:true})).toHaveCount(0);
  await page.goto(detail);await expect(page.getByText('Lifecycle record',{exact:true}).filter({visible:true}).last()).toBeVisible();
  await expect(page.getByRole('button',{name:'Редактировать',exact:true})).toBeVisible();
});

test('local comparison uses saved products and keeps unknown facts and demo isolated',async({page})=>{
  for(const [title,price] of [['Saved lamp','12.50'],['Saved chair','']]){
    await page.goto('http://127.0.0.1:8081/wishlist');
    await page.getByRole('button',{name:'Добавить',exact:true}).click();await page.getByRole('button',{name:'Ввести вручную',exact:true}).click();
    await page.getByRole('textbox',{name:'Название',exact:true}).fill(title);
    await page.getByRole('dialog',{name:'Добавить товар',exact:true}).getByRole('radio',{name:'Дом',exact:true}).click();
    await page.getByRole('textbox',{name:'Цена',exact:true}).fill(price);
    await page.getByRole('button',{name:'Добавить товар',exact:true}).click();await expect(page).toHaveURL(/\/product\//);
  }
  await page.getByRole('button',{name:'Сравнить',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Saved chair',exact:true})).toBeChecked();
  await page.getByRole('checkbox',{name:'Saved lamp',exact:true}).click();
  const table=page.getByTestId('comparison-table');await expect(table).toBeVisible();
  await expect(table.getByText(/12,50/)).toBeVisible();await expect(table.getByText('Цена не указана',{exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:'Atelier 04',exact:true})).toHaveCount(0);
  await page.screenshot({path:'docs/screenshots/full-update-compare.png',fullPage:true});
  await page.goto('http://127.0.0.1:8081/compare-products?mode=demo');
  await expect(page.getByRole('checkbox',{name:'Saved lamp',exact:true})).toHaveCount(0);
  for(const title of ['Atelier 04','Studio Audio','Épure'])await page.getByRole('checkbox',{name:title,exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Forma',exact:true})).toBeDisabled();
});

test('product photo survives hide/restore; permanent deletion requires its own confirmation',async({page})=>{
  await page.goto('http://127.0.0.1:8081/wishlist');
  await page.getByRole('button',{name:'Добавить',exact:true}).click();await page.getByRole('button',{name:'Ввести вручную',exact:true}).click();
  await page.getByRole('textbox',{name:'Название',exact:true}).fill('Photo lamp');
  const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Добавить изображение',exact:true}).click();
  await (await chooser).setFiles({name:'lamp.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=','base64')});
  await expect(page.getByRole('button',{name:'Убрать изображение',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Добавить товар',exact:true}).click();await expect(page).toHaveURL(/\/product\//);const detail=page.url();
  await page.getByRole('button',{name:'Действия с карточкой: Photo lamp',exact:true}).click();await page.getByRole('button',{name:'Скрыть карточку',exact:true}).click();
  await expect(page.getByText('Скрытое',{exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:8081/saved-management');await page.getByRole('button',{name:'Восстановить',exact:true}).click();
  await expect(page.getByRole('button',{name:'Photo lamp',exact:true})).toHaveCount(0);
  await page.goto(detail);await expect(page.getByRole('img',{name:'Photo lamp',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Удалить',exact:true}).click();await page.getByRole('button',{name:'Удалить',exact:true}).click();await expect(page).toHaveURL(/\/wishlist$/);
  await page.goto('http://127.0.0.1:8081/saved-management?view=trashed');
  await page.getByRole('button',{name:'Удалить навсегда',exact:true}).click();
  await expect(page.getByRole('button',{name:'Photo lamp',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Подтвердить удаление навсегда',exact:true}).click();
  await expect(page.getByRole('button',{name:'Photo lamp',exact:true})).toHaveCount(0);await page.reload();await expect(page.getByRole('button',{name:'Photo lamp',exact:true})).toHaveCount(0);
});
