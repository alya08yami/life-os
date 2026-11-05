# Актуальное состояние — 2 ноября 2026

Полная матрица карточек, серверных функций и оставшихся внешних ограничений: [FINAL_IMPLEMENTATION.md](docs/FINAL_IMPLEMENTATION.md). Численные результаты проверок: [verification.md](docs/verification.md). Ниже сохранена история предыдущих этапов; её ограничения могут быть уже закрыты.

Новые слои: типизированные collections/recurrence/vault в domain; контекстные формы и детали всех разделов; платформенные file/crypto/share/notification adapters; настоящий SQLite HTTP API с ACL, AI gateway и TMDB adapter. ApiProvider хранит сессию вне keyed AppProvider, отдельного для каждого локального профиля. Медицинские записи не входят в обычные items, поиск или общий доступ.

---

# LIFE OS — Frontend Architecture

## Существующий фундамент
Expo 58 / React Native / Expo Router / TypeScript. Сохраняются общий domain, Repository, SQLite/IndexedDB, Inbox и поиск. Backend/AI-архитектура не изменяется. Старые сохранённые записи schema v1 читаются без destructive migration; новые UI-поля optional.

## Структура
```text
src/design/tokens.ts                    цвета, font families, шкалы, spacing, radii
src/components/Icon.tsx                 line icons из единого набора
src/components/AppShell.tsx             header/menu, ошибки, layout, loading
src/components/VisualGrid.tsx           виртуализированная двухколоночная сетка
src/components/CategoryTile.tsx         фото + название
src/components/CatalogImage.tsx         cache/thumbnail/fallback
src/design/primitives.tsx              доступные Chips, typography/forms/buttons
src/components/AddItemBottomSheet.tsx   только доступные способы импорта
src/components/ProductCard.tsx          product-specific price/favorite
src/components/MediaCards.tsx           отдельные MovieCard, RecipeCard и PlaceCard
src/catalog/demo.ts                     fixtures вне реального хранилища
src/catalog/CatalogContext.tsx          mode и demo session preferences
src/features/wishlist/                  grid filters/sort/create/detail
app/(tabs)/index.tsx                    CategoryDashboard
app/wishlist.tsx                       реальные/демо хотелки
app/product/[id].tsx                    product detail, источник mode в route
app/section/[section].tsx               остальные пространства и честные boundaries
```

Общие layout/media primitives не знают API или Repository. Специализированные карточки получают display model и callbacks. ProductCard не рендерит фильмы/медицинские поля. Контроллеры/feature screens выбирают данные и выполняют команды через useApp.

## Данные и цены
Общий Item сохраняется. ProductDetails дополняется productCategory, variant, offers/price provenance; favorite — optional common field. Price selector группирует offers по currency и точному variant; неизвестные/несопоставимые/устаревшие предложения не дают «минимальную актуальную цену». До интеграции магазинов ручная цена подписана «указано вручную», demo — «пример цены».

Favorite writes — идемпотентное задание boolean в транзакции. Фильтры/сортировка и видимость категорий сохраняются в optional UI preferences. Отдельные catalog view models нормализуют личные Item и demo fixtures; favorites демо остаются только в demo session и не вызывают Repository. UI preferences могут сохраняться в metadata независимо от режима, без записи demo items. Удаление реальных данных остаётся с подтверждением.

## Навигация и расширение

Основные вкладки: Home (`/`), Search (`/search`), Add (`/add`), My tasks (`/tasks`), Profile (`/profile`). Legacy `/inbox` и `/spaces` сохранены как скрытые вкладки без кнопок в tab bar. Главная и новая вкладка используют один экран My tasks; `/section/tasks` остаётся совместимым маршрутом.

`/customize-home` использует `home-preferences` для порядка, избранного и скрытия разделов. `/saved-management` разделяет hidden/archived/trashed и выполняет restore/purge. Lifecycle selectors применяются в основных коллекциях; поиск включает hidden/archived с подписью, исключает trashed. Старые записи без lifecycle считаются active.

`/compare-products` сравнивает 2–3 подтверждённых active product. Domain `selectComparison` проверяет допустимость выбора, `pricePresentation` учитывает currency/variant/availability/date и shipping. Demo mode не смешивает fixtures с личными записями.
Главная → категория → grid → detail. Add внутри категории открывает sheet, затем минимальную форму известного типа/категории. Не добавляются промежуточные вопросы. Inbox остаётся универсальной точкой захвата.

Хотелки и product detail реализуются полностью в рамках локальных возможностей. Movies/recipes получают отдельные reusable cards и локальный просмотр. Home открывает реальные шаблоны; work/tasks — существующие записи. Health показывает только функциональную структуру будущего модуля без ввода медицинских данных. Travel/wardrobe дают честное состояние подготовки; AI, маршруты, outfit generation, live prices не имитируются.

Дальнейшие sections получают собственные feature modules, сохраняя AppShell/VisualGrid/FilterChips/media/error primitives. План раннего protected AI gateway и системного share остаётся отдельным этапом.

По второму референсу реализованы компактная главная, My tasks/Inbox, скрытие категорий и реальная связь recipe → selected ingredients → shopping. `sourceItemId` хранит происхождение покупки; атомарное добавление проверяет выбранные ингредиенты против исходного рецепта и не дублирует незавершённые связанные позиции. My tasks объединяет task и shopping_item. Остальные связи описаны в `docs/PRODUCT_CONNECTIONS.md`.

## Проверка
Domain tests: price provenance/variant/currency/staleness, sorting/filtering, persistent favorite/UI preferences и отсутствие demo seeds. Regression tests существующего хранения/Inbox.
UI: главная (2 columns) → wishlist → filters/sort → demo detail → mode switch → manual product add → own detail/favorite/reload → edit/delete. Проверить узкий 360 px и широкий 1280 px, dark mode, отсутствие переполнения и runtime errors. Проверка web не заменяет Android/iOS.

## Recipe quantities increment

`packages/domain/src/recipes.ts` пересчитывает только явные ingredientAmounts относительно сохранённых servings; ingredients:string[] остаётся совместимым форматом и идентичностью строки. cookMinutes и notes optional. Числовая валидация — в domain, не только в форме.

`RecipeAmountFields` переиспользуется в ItemForm и перед переносом в покупки; `RecipeContent` управляет preview порций и вкладками. Покупки сохраняют sourceItemId + sourceIngredient независимо от отображаемого количества и последующего переименования. Поля source metadata сохраняются при edit/confirm/categorize. Нет destructive migration или сетевых обращений.
