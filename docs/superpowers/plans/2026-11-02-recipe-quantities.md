# Recipe CRUD — quantities increment

Продолжение этапа 3 UPDATE_AUDIT: один проверяемый модуль, без изменения framework, очистки хранилища или имитации AI.

- Совместимость: ingredients:string[] и steps:string[] остаются; ingredientAmounts/cookMinutes/notes optional в schema v1.
- Количества указываются вручную и привязаны к точному названию ингредиента. Существующий свободный текст не разбирается автоматически.
- Количество порций в detail — предпросмотр, не перезапись оригинала; неизвестные quantities остаются неизвестными.
- Покупки: выбор ингредиентов, корректировка количества, stable sourceIngredient для dedupe после смены порций/названия shopping item. Завершённые/trashed покупки не блокируют новый перенос. Существующие незавершённые позиции не заменяются.
- UI: время приготовления и notes в форме, вкладки recipe/ingredients/notes, время на карточке каталога, избранное.
- Проверки: domain scaling/validation/legacy/persistence/dedupe, browser create→confirm→scale→shopping override→reload→edit→source navigation.

Вне инкремента: меню по датам, рекомендации, видеораспознавание, нутриенты, внешнее sharing. Калорийность не рассчитывается и не выдумывается. Native QA остаётся отдельным этапом.

## Результат

Инкремент реализован. 33 unit/storage tests, typecheck и web export проходят. Общий Chrome suite 19/19; после финальных recipe UI изменений три затронутых сценария повторно 3/3. Screenshot recipe-quantities визуально проверен. Перечень файлов: domain index/recipes/repository/package exports; ItemForm, RecipeAmountFields, RecipeContent, RecipeShopping; item detail, section catalog, MediaCards, i18n; recipes tests и адаптация manual recipe browser assertion; README/UI_ARCHITECTURE/UPDATE_AUDIT/verification.

Следующий локальный модуль: фильмы/сериалы (статусы, прогресс и ручные оценки), затем расширение домашних сценариев. AI gateway и platform integrations остаются отдельными проверяемыми поставками.
