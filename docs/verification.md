# Проверка деталей, сравнения и переработанных разделов — 2 ноября 2026

- `pnpm test`: **55 passed, 0 failed**. Добавлены Google Maps pin parser, Haversine, блокировка посторонних hosts/HTTP, официальный Places adapter с синтетическим fetch, отсутствие ключа в URL, attribution, полные health примеры и сохранение отредактированных movie записей.
- TypeScript и web export: exit 0 после финального кода.
- iOS/Android Hermes JS export: exit 0 после финального кода, ~4.1 MB. Expo prebuild config с foreground-only location plugin: exit 0. Устройства и разрешения ОС не проверены.
- Chrome: **38 различных сценариев прошли**. Общий прогон: 37 passed, один новый тест измерял старую каталожную картинку до окончания перехода. Исправлено ожидание URL и heading детали. После финальных изменений ручного порядка и политики кэша Google повторно проверены затронутые `home-refresh` + `refinements`: **7 passed (31.5s)**.
- Реально проверены: зелёные checkbox-весы и сравнение двух товаров, thumbnail товара ≤125×105; шесть health категорий/документы; сезоны и сохранение outfit; создание рабочей идеи; вставка Maps ссылки и сортировка по расстоянию при синтетической geolocation; drag с сохранением после reload; пять разных movie иллюстраций и быстрые трейлеры; detail movie 100×90.
- Ранние проверки выявили конфликт браузерного image drag с перемещением плитки: добавлен слой захвата в edit mode. Найдены неоднозначные accessible названия фото/названия места: различены. Внешний Google adapter не проверялся живым ключом; synthetic fetch явно отделён от live API.
- Скриншоты: `wishlist-scales.png`, `health-documents.png`, `travel-list.png`, `home-reordered.png`, `movies-artwork.png`. Иллюстрации фильмов сгенерированы и не выдаются за официальные постеры.
- `git diff --check`: exit 0. В web export не обнаружены Google/OpenAI/TMDB secret variable names или тестовый registration code. Питание не менялось.

Google Places требует серверный ключ и аккаунт. Фото показываются временно с авторами и без записи в attachments/backup; для Google фото выставлена политика `cachePolicy=none`. Получение и воспроизведение внешних видео на устройстве пользователя не подтверждалось; проверены ссылки и кнопки. Старые проекты/материалы и защищённое здоровье сохранены.

Ниже — история прежних проверок.

---

# Проверка обновления главной и примеров — 2 ноября 2026

- Unit/storage/API/crypto: **52 passed, 0 failed**. Новые проверки: все разделы получают по пять основных примеров, существующие записи сохраняются, повторная установка и удаление не возвращают примеры; обычные healthRecords сохраняются без пароля и корректно объединяются в backup.
- TypeScript, production web export, iOS/Android JS export: exit 0. Native permissions и устройства этим не проверены.
- Chrome: **33 различных сценария прошли**. Финальный общий прогон: 31 passed, два новых теста перезагружали страницу до окончания сохранения. Добавлено ожидание наблюдаемого сохранённого состояния; оба повторно прошли — **2 passed (17.9s)**. Код приложения после общего прогона не менялся.
- Проверены реальные долгий тап → покачивание → скрытие → reload → возврат плитки; наличие примеров во всех 11 разделах; открытие/создание/reload здоровья без пароля и исключение из поиска. Старый зашифрованный vault тоже продолжает проходить прежний отдельный сценарий.
- Исправлены найденные неудобства: неподвижный overlay кнопки «−», импорт большого JSON через краткое состояние загруженного файла. Во время раннего прогона сборка была пересоздана и вызвала два HTTP 404; повторный общий прогон выполнен на неизменной готовой сборке.
- Скриншоты: `screenshots/home-natural.png`, `home-edit-natural.png`, `health-no-password.png`. Новые изображения и prompts: `apps/mobile/assets/editorial/README.md`.
- `git diff --check`: exit 0. Данные пользователя не очищались; новые примеры устанавливаются однократно при следующем открытии обновлённой сборки.

Ниже сохранены проверки предыдущих этапов. Обязательный пароль относится только к старому защищённому хранилищу.

---

# Финальная проверка всех разделов — 2 ноября 2026

- `pnpm test`: **50 passed, 0 failed**. Домен, IndexedDB/SQLite, постоянный API после restart, ACL/сессии/квоты, шифрование и web/native crypto interoperability.
- `pnpm typecheck`: exit 0 после финальных изменений.
- `pnpm build:web`: exit 0, production export в `apps/mobile/dist`.
- Browser: **31 различных сценарий прошёл**. В общем прогоне 30 passed и 1 test-navigation failure; тест искал tab на экране вне tab navigator. Исправлен переход через видимую кнопку «Назад». Затронутый `server-ui.spec.ts` повторно прошёл целиком: **3 passed (17.5s)**, включая два аккаунта/отзыв доступа, честную недоступность AI, отдельную библиотеку аккаунта и явное копирование с сохранением офлайн-оригинала. Остальные 28 сценариев прошли в общем прогоне; повторно не запускались без новых изменений кода.
- Первый общий прогон также выявил потерю query-параметров при начальном router.replace. Исправлено: перенаправление теперь только при смене профиля. Все три затронутые формы прошли в последующем общем прогоне.
- `node scripts/expo.cjs export --platform ios --platform android --output-dir dist-native`: exit 0 после финального кода, обе Hermes bundles ~3.6 MB. Это JS export, не установленный native binary и не проверка устройства.
- Expo prebuild config: exit 0; notifications/dev-client/sharing plugins разрешаются. Generated config проверялся в `/tmp/life-os-expo-config.json`.
- `git diff --check`: exit 0. В production web export не найдены имена provider secrets, setup-code или строка тестового registration code.
- Визуально просмотрены сохранённые screenshots: поездка/порядок/дни, private health с синтетическим PDF, shared space, рецепты и сравнение. Скриншоты тестовые, без пользовательских данных.

API browser tests используют отдельный in-memory fixture server и синтетические аккаунты. OpenAI fetch в provider contract test замокан. Живой AI/TMDB не тестировался и ключи не добавлялись. Ни браузерные тесты Chrome, ни fixture API не трогают существующий IAB IndexedDB и постоянную `.local` базу пользователя.

Камера, native receiving Share, ОС permissions, delivery уведомлений, физические Android/iOS, публичный cloud backend, реальные магазины, оплата и live external APIs не объявляются проверенными. Полная матрица: [FINAL_IMPLEMENTATION.md](FINAL_IMPLEMENTATION.md).

Ниже — история ранних этапов. Утверждения о прежних отсутствующих функциях не описывают текущую поставку.

---

# Рецепты — проверка инкремента, macOS, 2 ноября 2026

- Unit/storage: **33 passed**, включая новые scaling/validation/legacy compatibility, metadata persistence и стабильный ingredient dedupe после edit/reload.
- TypeScript: exit 0 после последних изменений.
- Production web export: exit 0 после последних изменений.
- Общий Chrome suite: **19 passed (1.2m)**.
- После добавления иконок избранного и улучшения подписей detail повторно проверены три затронутых recipe-сценария: **3 passed (14.8s)**, page errors отсутствуют.
- Визуально просмотрен `screenshots/recipe-quantities.png`: количество, неизвестная соль без выдуманного количества, вкладки, время приготовления, редактирование.

Новый browser flow: создать рецепт с Carrot 100 g / Salt без количества, порции 2, время 25 минут и заметку → подтвердить → пересчитать на 4 порции → увидеть 200 g → заблокировать перенос при 0 порций → поправить покупку до 175 g и исключить Salt → reload сохраняет исходные 2 порции → отредактировать заметку без потери 100 g → повторный перенос не дублирует незавершённую покупку → перейти к исходному рецепту → сохранить избранное в каталоге после reload.

Старый свободный текст не разбирается автоматически. Поля optional, schema v1 сохранена, данные не очищались. Нет AI/видеоимпорта, расчёта калорий, meal planning или внешней отправки. Android/iOS на устройствах не проверены. Проверка кода выполнена текущим агентом.

---

# Итоговая проверка текущего инкремента — macOS, 2 ноября 2026

- `pnpm test`: 30 passed, 0 failed (Node 24.22.1; IndexedDB и SQLite).
- `pnpm typecheck`: exit 0 после исправлений.
- `pnpm build:web`: exit 0, production export в `apps/mobile/dist`, 985 modules.
- Chrome: финальный общий прогон — **18 passed (1.1m)**; после каждого сценария нет page errors.
- Визуально просмотрены screenshots `full-update-home.png` и `full-update-compare.png`: сетка, новая нижняя навигация, сравнение с неизвестными значениями и дробной ценой.

Первый Chrome прогон нашёл две гонки тестов: клик по «Добавить» до появления радио «К разбору» в целевом Inbox; reload до завершения восстановления. Тесты теперь ждут эти наблюдаемые состояния. Исправленный organizer flow отдельно прошёл (5.3s), остальные 17 сценариев прошли в предыдущем общем запуске. Это не использует фиксированных пауз или force-click.

Код: исправлены маршрут «Мои дела» на главной, блокировки restore/purge во время записи, native accessibility state переключателей. `pnpm preview` добавлен для общего запуска на macOS/Windows; README обновлён. Независимый reviewer не запускался; review выполнен текущим агентом. Новые секреты и интеграции не добавлялись.

Android/iOS на устройствах, AI gateway, внешние каталоги/цены, уведомления, native Share и облачная синхронизация не проверены и не объявляются работающими.

---

# Проверка LIFE OS foundation

## Editorial UI и связи — обновление 2 ноября

Текущий результат: `pnpm test` — **19 passed, 0 failed**; `pnpm typecheck` — exit 0; `pnpm build:web` — exit 0; полный Chrome suite — **12 passed (44.8s)** с проверкой `page.pageErrors()` после каждого сценария.

После последней защиты checkbox на время записи: web export и typecheck повторно exit 0; два затронутых recipe-сценария — 2 passed (10.1s). Для чистого screenshot после закрытия sort-sheet отдельно повторён demo flow — 1 passed (7.7s). Ошибочный CLI-фильтр одного промежуточного запуска исправлен; это не ошибка приложения.

Новые browser checks: двухколоночный dashboard на 360×950 и 1280×950, отсутствие горизонтального overflow, menu/settings; demo фильтры и sorting/favorite/detail, отсутствие demo в personal search; contextual add без выбора kind/category, favorite после reload, изменение названия/цены и удаление; recipe → selected ingredients → shopping и обратный source link; скрытие раздела на главной после reload. Все прежние organizer/storage/recovery сценарии сохранены и проходят.

Визуально просмотрены реальные screenshots: `screenshots/catalog-360.png`, `screenshots/catalog-1280.png`, `screenshots/wishlist-demo.png`, `screenshots/product-demo.png`, `screenshots/wishlist-personal.png`, `screenshots/settings-dark.png`. Это screenshots работающего приложения, не UI-мокапы.

Новые domain checks: сопоставимость offer currency/variant/date, stale/unsafe prices, сохранение дробной цены, фильтрация/сортировка, favorite/prefs persistence, выбранные ингредиенты и отсутствие повторных незавершённых покупок. Старый schema v1 сохранён, поля optional; разрушительных миграций или demo seeds нет.

Независимый code review: исправлены потеря currency при edit offer-only product, округление дробных цен в grid, открытие legacy original без thumbnail и cleanup original/thumbnail при удалении native product. Дополнительно form version фиксируется на начало редактирования, сохранённое описание не заменяется названием. Native file cleanup проверен чтением/типами; физические устройства по-прежнему не тестировались.

Performance evidence: прямые icon imports сократили Metro graph 2951→971 modules и common bundle 2.6 MB→248 KB. Десять local JPEG 640×640 имеют размер 27–111 KB; fonts локальные с OFL licenses. Runtime performance и large-library stress tests отдельно не проводились. Текущий snapshot repository всё ещё загружает личные metadata/embedded image bytes целиком: разделение original blobs и metadata — следующая storage-оптимизация перед крупными библиотеками.

Native Android/iOS, AI/catalog endpoints, live price comparison, bulk recognition, recurrence/notifications и sharing не заявляются работающими. Demo favorites session-only; UI preferences записываются отдельно от real items. Camera option — сообщение недоступности, не действующая имитация.

Ниже сохранена история проверки исходного фундамента.

Дата: 2 ноября 2026. Среда: Windows, Node 24.22.1, pnpm 11.25.0; Expo 58.0.22, React 19.3.0, React Native 0.88.1. Устройства Android/iOS не использовались.

## Подтверждено

| Проверка | Результат |
| --- | --- |
| TypeScript `pnpm typecheck` | exit 0 |
| `pnpm build:web` | exit 0; Expo production web export, 810 modules; `apps/mobile/dist` |
| `pnpm test` | 13 passed, 0 failed, exit 0; финальный прогон 1.44s |
| `pnpm exec playwright test --timeout=20000` | 7 passed, 22.9s; Google Chrome, viewport 430×932 |

Browser suite использует настоящий React Native Web UI, настоящий IndexedDB и изолированный browser context; тестовые записи не добавляются в пользовательское хранилище. Проверено:

1. Главный экран → Inbox → текст покупки → предложение по правилу → подтверждение → изменение названия → reload → поиск → удаление.
2. Загрузка настоящего PNG через file picker, сохранение и отображение после reload.
3. Добавление домашнего шаблона, переключение на English/dark и сохранение настроек после reload.
4. Ручная movie-карточка с годом и режиссёром.
5. Ручная recipe-карточка с ингредиентами и шагами.
6. Ручная product-карточка с брендом, моделью и ценой.
7. Ошибка initial storage и повторной загрузки сохраняет понятное сообщение и доступный Retry.

Unit/storage suite проверяет: правила трёх языков, неоднозначный ввод, пустой/слишком длинный текст, недоверенные URL, typed metadata, успешный commit при ошибке refresh, отказ записи, IndexedDB reopening/idempotent confirm, конкурентные добавления и optimistic version, повторный шаблон, изображение/поиск/complete/delete, rollback/settings и конкурентный partial settings merge. SQL codec проверен на настоящем Node SQLite; IndexedDB — через fake-indexeddb в unit suite и настоящий browser IndexedDB в smoke suite.

Независимый code review выявил четыре ошибки согласованности UI: редактирование во время сохранения, ошибочное повторение уже сохранённого capture после failed refresh, перезапись настроек и исчезновение Retry. Они исправлены; повторная проверка reviewer выявила условный Hook, также исправленный. Browser QA нашёл неработающий Back после deep-link reload и несовместимость accessibilityState с web ARIA; исправлены и покрыты повторным suite.

## Ограничения проверки

- Нативные Android/iOS сборки, камера/разрешения, image picker и файл после перезапуска телефона не проверялись.
- Не проверены EAS signing, Share Extension/Android incoming intent, push и store packaging.
- AI gateway, живые provider/catalog API, стоимость запросов, Supabase/Auth/RLS/cloud sync не реализованы в foundation. Наличие DTO не означает работающую интеграцию.
- UI smoke выполнен в Chrome на узком viewport, не на Safari или физических устройствах. Полный accessibility audit не проводился.
- Native cleanup временных/отсоединённых draft-изображений требует отдельного lifecycle pass перед публичным релизом; медицинские данные и обещание полного шифрования отсутствуют.

## Среда и воспроизводимость

Первые установки/сборки завершались OOM. Снижены network/child concurrency, Metro workers=1, V8 heap/semi-space и UV threadpool. Финальная web-сборка прошла. Expo telemetry выключена, Expo home перенесён внутрь проекта; пользовательский профиль не используется для cache записи. В этой sandbox npm network и Chrome localhost требовали разрешённого escalated запуска. Playwright сам управляет preview server; отдельный работающий server для тестов не требуется. Стандартный launcher пользователя указан в README.

Скриншоты: `screenshots/today-mobile.png`, `screenshots/settings-dark.png`.

### Reference layout and right-edge back gesture
Mobile 390×844: five reference-ui Playwright scenarios passed (home, wishlist comparison/detail, inbox selection, travel filtering/add form, right-edge back across tabs and nested routes). Center and vertical gestures do not navigate. TypeScript passed. Unit suite: 56 passed. These new scenarios replace layout assumptions in older browser tests; the complete older browser suite was not rerun. No physical phone testing claimed.

### 2026-11-03 interaction refresh
60 unit tests passed; TypeScript passed. Six mobile refresh-ui scenarios plus the existing right-edge swipe regression passed. JS exports for iOS and Android completed. Public build includes Inter, checklist/home, split wishlist hero, three health sections and horizontal movie/series shelves. AI is server-dependent; social-video audio/frame import is not connected. See docs/REFRESH_2026-11-02.md for boundaries and screening sources.
