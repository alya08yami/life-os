# Актуальное состояние — 2 ноября 2026

Полная матрица карточек, серверных функций и оставшихся внешних ограничений: [FINAL_IMPLEMENTATION.md](FINAL_IMPLEMENTATION.md). Численные результаты проверок: [verification.md](verification.md). Ниже сохранена история предыдущих этапов; её ограничения могут быть уже закрыты.

Новые слои: типизированные collections/recurrence/vault в domain; контекстные формы и детали всех разделов; платформенные file/crypto/share/notification adapters; настоящий SQLite HTTP API с ACL, AI gateway и TMDB adapter. ApiProvider хранит сессию вне keyed AppProvider, отдельного для каждого локального профиля. Медицинские записи не входят в обычные items, поиск или общий доступ.

---

# LIFE OS — аудит полного обновления

Дата: 2 ноября 2026. Источник требований: `requirements/2026-11-02-full-update.md`. Это аудит существующего проекта D:/life-os, не предложение создать новый.

## 1. Технологии и фактическая инфраструктура
- Expo 58.0.22, React Native 0.88.1, React 19.3, Expo Router, TypeScript, pnpm 11.
- Локальные SQLite/native и IndexedDB/web адаптеры; domain Repository с атомарными изменениями и optimistic version.
- expo-image, image picker/manipulator, local OFL fonts Cormorant Garamond/Manrope, Lucide SVG icons, tokens для двух тем и RU/UK/EN.
- Node test runner, Node SQLite, fake-indexeddb; Playwright/Chrome; web production export.
- Backend API, PostgreSQL/Supabase Auth/RLS, AI gateway, push scheduler и cloud sync пока существуют только как архитектурный план/DTO. Не являются работающими интеграциями.
- Baseline перед обновлением: 19 unit/storage тестов прошли. История предыдущей web-проверки — 12 Chrome сценариев. Android/iOS на устройствах не проверены.

## 2. Существующие экраны и переиспользование
Работают: category dashboard; wishlist grid и product detail; universal Inbox с manual/rule review; общий поиск; library/spaces с домашними шаблонами; unified tasks/shopping; generic item detail и формы; settings, theme/language/category visibility. Sections movies/recipes показывают локальные карточки; health/travel/wardrobe в основном boundaries будущих модулей.

Переиспользуем: AppShell/SectionHeader/LoadingState/ErrorState, design primitives, Icon/IconButton, VisualGrid, CategoryTile, CatalogImage/ImageViewer, ProductCard, MovieCard/RecipeCard/PlaceCard, AddItemBottomSheet, ItemForm, ItemRow, RecipeShopping; Repository, selectors и platform storage. Demo fixtures/session остаются отдельно от real items.

## 3. Соответствие ТЗ
| Область | Уже есть | Расхождения |
| --- | --- | --- |
| Дизайн | Молочная палитра, serif/sans, фото, две темы, нет мотивационных hero/counters | Уточнить palette и semantic price state, единые actions/source previews |
| Главная | 8 категорий, My tasks/Inbox, скрытие с сохранением | Нет reorder, favorites, специального пункта настройки главной |
| Навигация | 4 tabs, deep links/Back | Нужны Home/Search/Add/My tasks/Profile; старые Inbox/library routes сохранить |
| Хотелки | CRUD, images, filters/sort/favorite, demo separation, manual prices | Нет Home filter, price-drop sort, lifecycle, compare, purchased/repurchase, live offers/alerts |
| Продукт | Source, variant, typed offers/date, original viewer | Нет shipping/availability, контролируемой корзины и сравнения; live prices не подключены |
| Дом | Подразделы, 3 атомарных reusable шаблона | Нет custom rooms, appliance records, editable scenario builder и recurrence |
| My tasks | task + shopping, complete/undo, due date/priority, source link | Нет calendar tabs/history view, recurrence, snooze/notifications/assignment |
| Inbox | Text/link/image, pending/processed grid, review/fallback | Нет multi-file AI job states, batch recognition, retry/cost UI, incoming system share |
| Рецепты | Manual structured ingredients/steps/servings; selected ingredients → shopping, source/idempotence | Нет quantities/scaling, cook time/nutrition, meal planning/video extraction |
| Фильмы | Manual year/director/trailer/status, grid | Нет watching/series progress/ratings, catalog lookup/posters/ambiguous choice |
| Поездки | Category/boundary, reusable PlaceCard | Переименовать; нужны place/trip entities, real CRUD и Maps URL links |
| Здоровье | Только неинтерактивная структура и явное ограничение | Medical records не хранить до access/encryption/consent design |
| Гардероб | Визуальная категория, reusable media | Нет garment/outfit entities, local compose |
| Работа | Notes/tasks/category | Нет lightweight project/material links и tabs |
| Общие пространства | Архитектура workspace/membership | Реального server auth/ACL/invitations нет |
| Поиск | Local text/details search | Нет tags/category indexing, semantic adapter, lifecycle badges |
| Архив/скрытое/корзина | Сейчас delete физически удаляет запись | Нужны раздельные статусы, restore, explicit permanent purge и сохранение children |
| Уведомления/AI | Capability unavailable, нет ключей в клиенте | Нужны отдельные защищённые интеграции и device QA |

## 4. Данные и миграции
Сейчас items и metadata сохраняются в JSON payload; schemaVersion=1, SQL tables items/meta и IndexedDB stores items/meta. Для ближайшего инкремента нужны optional lifecycle/lifecycleChangedAt и расширение typed ProductOffer/ProductCategory. Home preferences укладываются в существующий metadata map: порядок, hidden/favorite флаги. Старые записи без lifecycle считаются active. Новая версия читает старый формат; DROP/clear/пересоздание stores не требуется.

Скрытие, архив и корзина не удаляют файлы. Только явно подтверждённый purge вызывает физическое удаление item и его собственных attachments. При этом source-linked shopping/task не удаляются каскадом. Конвертация recipe→shopping больше не считает trashed позиции существующими активными покупками. Edit/confirm обязаны сохранять lifecycle и source metadata.

Для следующих этапов нужны структурированные equivalents recurrence rules/executions, places/trips/trip_places, garments/outfits, projects/relations, memberships/invitations, notification prefs и AI jobs/usage ledger. Их нельзя заменять произвольными notes под новым названием. Полные SQL/RLS migrations относятся к cloud этапу, не к косметическому UI update.

Архитектурное ограничение: snapshot repository читает весь небольшой личный набор, включая embedded original image bytes web. Перед крупными коллекциями отделить media blobs от metadata и добавить cursor-based reads/поиск. Сейчас сохраняем интерфейс Repository; первый инкремент не делает широкую storage-миграцию. Локальная БД не заявляется зашифрованной или готовой для медицинских/совместных данных.

## 5. Интеграции и внешние зависимости
| Интеграция | Что требуется |
| --- | --- |
| AI vision/text/audio/video | Защищённый backend, provider credentials/billing, session auth, rate/size limits, durable quota/cache/ledger, explicit consent. Не открытый paid endpoint |
| TMDB/catalog | Server read access token/API key, terms/attribution и commercial eligibility; нет токена — только manual films. [Официальная auth документация](https://developer.themoviedb.org/docs/authentication-application) |
| Внешний Google Maps | Maps URLs с api=1, URL encoding; API key не нужен. Это не Places lookup. [Официальные Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) |
| Places/embedded maps | Отдельный ключ/OAuth, billing и key restrictions, quotas/field masks, policies/photos/attribution. Цены в этом аудите не обещаются. [Places usage/billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) |
| Магазины/цены/alerts | Разрешённые feeds/API, variant/currency/shipping/availability provenance, refresh scheduler, timestamp/history; не произвольные выдуманные scraper results |
| Notifications | User permissions, native builds, timezone/DST, quiet hours, dedupe/cancel, credentials для remote push и реальные устройства. [Expo notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| Incoming share | Config plugin/native extensions, development build и cold/warm device tests; Expo Go/web не являются доказательством |
| Shared spaces | Server identity/ACL/RLS, private storage, invitation lifecycle, membership checks и два test users; не имитация локальными avatar fixtures |

## 6. Что реализуем сразу
Следующий проверяемый инкремент: единая навигация и настройка главной (reorder/hide/favorite/open hidden), новые palette tokens, название «Поездки»; единый non-destructive lifecycle для текущих supported entities; управление/восстановление через Profile; wishlist Home filter/price-drop sort; сравнение 2–3 локально сохранённых товаров без AI. Базовые My tasks tabs и source metadata используют текущие данные.

Это завершает общий UI этап и часть product/core mechanisms. Не означает выполнение всех критериев A–H: live recognition, recurrence notification, place/trip CRUD и shared privacy ещё требуют следующих поставок.

## 7. Поэтапная дорожная карта
1. **Аудит и общий UI**: этот документ, full spec copy, home/nav/preferences; data compatibility checks.
2. **Локальный product/core increment**: hide/archive/trash/restore/purge, product compare, real lifecycle in search/inbox/tasks; критерий A и регрессии B/G.
3. **Section CRUD**: полноценные recipe/movie/series models, Home rooms/scenarios, place/trip с Maps URLs, garment/outfit; критерии B/C/D. По одному модулю с собственными тестами и change list.
4. **Recurring и Inbox pipeline**: schedule rules/execution history, local task tabs, multi-capture/job state model; экспорт/backup и media storage scaling. Напоминания — отдельный native QA gate.
5. **Ранний защищённый AI**: genuine provider calls, review/cost/failure/cache; batch Inbox + первый movie scenario. До полной family/cloud infrastructure, без client secrets. Критерий F только после живой проверки.
6. **External services/native share**: catalog, Places/embedded maps по потребности, licensed offers/price tracking, development builds и device verification; notification часть E.
7. **Shared/cloud/medical/monetization**: Supabase/Auth/RLS/private files, actual invitations, personal-data isolation, consent/encryption, export/purge/backups, затем entitlements. Критерий H на реальном backend с двумя accounts.

## 8. Риски и стоп-условия
Нет destructive migration или автоматического сброса текущего browser storage. Нет фальшивых prices, AI results, participants, notifications, fabricated medical advice или hidden network uploads. Архив не очищает source-linked independent objects. Неизвестные поля сравнения остаются неизвестными. Workstation web проверки не заменяют native QA.

## 9. Завершение первого инкремента на macOS

Реализованы пять вкладок и сохранение старых маршрутов; порядок/избранное/скрытие разделов; lifecycle active/hidden/archived/trashed, восстановление и отдельный purge; фильтры задач; категория товаров «Дом», сортировка снижения цены и сравнение 2–3 локальных товаров. Неизвестные значения в сравнении остаются неизвестными. Shipping используется для ранжирования только при сопоставимых известных суммах.

При итоговой проверке исправлены переход «Мои дела» на главной (теперь /tasks), блокировка повторных restore/purge во время записи и native accessibility state переключателя раздела. Browser tests ожидают появления элементов целевого экрана и завершения восстановления перед reload, а не только отправки клика.

Проверка кода выполнена текущим агентом; отдельного независимого reviewer в этой сессии не было. Следующий продуктовый этап остаётся пунктом 3 дорожной карты (Section CRUD), затем recurring/Inbox pipeline и защищённый AI. Этот инкремент не закрывает полное ТЗ.

## 10. Следующий инкремент — рецепты

Начат этап Section CRUD с рецептов: реализованы optional количества/единицы, время приготовления, заметки, preview пересчёта порций, вкладки detail и корректировка перед покупками. Stable sourceIngredient сохраняет dedupe при изменении порций и названия shopping item. Это частичное закрытие раздела «Питание»: меню по датам, nutrition, видеораспознавание и внешнее sharing остаются следующими работами; данные для них не имитируются.
