# LIFE OS — единая система Soft Future / Soft Glass / Depth & Layers / Soft Motion / Gesture Navigation

План внедрения. Этап 1 — аудит и фундамент (5 ноября 2026).

## 1. Аудит

**Стек.** Expo 58, React Native 0.88, react-native-web 0.21, expo-router (Stack), react-native-svg, lucide-react-native, expo-font (Inter — вариативный, Cormorant Garamond, Manrope). Нет react-native-reanimated и react-native-gesture-handler. Анимации сейчас — встроенный `Animated`, жесты — `PanResponder`.

**Темы.** Пять тем в `state.settings.theme`: `light`, `dark`, `minimal`, `mist`, `warm`. Переключаются в Настройках, выбор сохраняется в хранилище.
- Палитры — `src/design/tokens.ts` (`colors[theme]`) и `src/design/themes.ts` (доп. поверхности для minimal / mist / warm).
- Фон — `src/design/glass.tsx` (`GlassBackdrop`, SVG-градиент).
- Планировщик берёт цвета через `usePlannerColors()` (`src/planner/ui.tsx`), старые экраны — через `useColors()` (`src/design/primitives.tsx`).

**Два слоя интерфейса.**
- `src/planner/*` (новый): `Frame`, `AppHeader`, `SegmentedTabs`, `Primary`, `ConfirmationSheet`, `UndoToast`, `StatusCheckbox`, `CheckableListItem`. Это главная, календарь, здоровье, питание, дом, работа, финансы.
- `src/features/*` + `src/components/AppShell.tsx` (старый): Хотелки, путешествия, гардероб, фильмы, карточки.

**Жёсткие цвета.** Около 350 hex-значений прямо в компонентах: planner ≈195, components ≈62, design ≈80, features ≈17. Именно они мешают единой системе.

**Анимации.**
- `HabitCheckbox` — пульс и звук, уважает «уменьшить движение».
- `DashboardTiles` / `DragTile` — покачивание и перетаскивание плиток.
- `SwipeBack` — свайп назад от правого края.
- `Lists` — счётчик быстрой покупки.
- `ProductCard`.
- Переходов между экранами, кроме стандартного slide, нет. Индикатор вкладок не анимируется.

**Жесты.**
- `PanResponder`: перетаскивание плиток, свайп месяца в календаре (`ShiftCalendarView`), листание недели (`WeekSlider` — ScrollView с paging), `SwipeBack`.
- 6 мест с `onLongPress`.
- Свайпов по строкам списков нет.

**Модальные окна.** `Modal` в 10 местах. Основная шторка — `ConfirmationSheet` в `ui.tsx`. Перетаскиванием она не закрывается.

**Доступность.** «Уменьшить движение» учитывают только `HabitCheckbox` и `WebInteractionStyles`.

## 2. Хотелки («Покупки и желания»): как не задеть

Маршруты и экраны:
- `/wishlist` → `PlannerScreen section="shopping"` → `planner/Catalogs.tsx` (`Shopping`) + `components/ProductCard.tsx`;
- `/product/[id]` → `features/wishlist/ProductDetailScreen.tsx`;
- `/compare-products`.

Они делят с остальными `Frame`, `BottomNavigation`, `ConfirmationSheet` и `usePlannerColors`, поэтому одной правкой этих компонентов Хотелки изменились бы.

Решение — `src/design/scope.tsx`:
- контекст `FrozenDesign`;
- в этапе 2 эти три маршрута оборачиваются в `<FrozenDesign>`;
- общие компоненты проверяют `useDesignScope()` и внутри замороженной зоны рисуют ровно как сейчас;
- файлы Хотелок (`Catalogs.tsx#Shopping`, `ProductCard`, `features/wishlist/*`) не правятся вообще.

Проверка — скриншот-тест «до/после» для `/wishlist` и `/product/[id]`.

## 3. Фундамент (сделано на этапе 1)

| Файл | Что |
|---|---|
| `apps/mobile/src/design/system.ts` | Единые токены: palette, gradients, surfaces (glass / content / elevated), opacity, blur, borders, radii, spacing, touch, typography, shadows (уровни 0–4), zIndex, motion, easing, spring, depthMotion, gestures, reducedDuration |
| `apps/mobile/src/design/scope.tsx` | `FrozenDesign` / `useDesignScope` для изоляции Хотелок, `useReducedMotion()` |
| `tests/design-system.test.ts` | Длительности в диапазонах брифа, мягкость теней, пороги жестов, плотность поверхностей |

Ни один существующий файл не изменён, никто пока не импортирует новые модули, поэтому внешний вид прежний.

## 4. План по этапам и файлам

**Этап 2 — главная и нижняя навигация.**
- Новая тема `soft` в существующем переключателе (`packages/domain/src/index.ts` — тип и валидация `Settings.theme`; `design/tokens.ts`, `design/themes.ts`, `app/settings.tsx`). Остальные темы остаются.
- `design/glass.tsx`: градиент графит → серо-розовый для `soft`.
- `planner/ui.tsx`: `usePlannerColors` + новые `useSurface(level)` / `shadow(level)`.
- `planner/Dashboard.tsx`, `planner/DashboardTiles.tsx`: стеклянные карточки, тонкие контуры, реакция на нажатие (scale 0.975, 130 мс).
- `components/BottomNavigation.tsx`: стеклянная панель, плавная подложка активного пункта.
- `app/wishlist.tsx`, `app/product/[id].tsx`, `app/compare-products.tsx`: обёртка `FrozenDesign`.

**Этап 3 — Soft Motion.**
- Переход «карточка → страница»: на этом стеке надёжного shared-element нет, поэтому сделаем упрощённый вариант. Снимок рамки плитки (`measureInWindow`) расширяется до экрана (transform / opacity, 360 мс), затем `router.push`; при возврате — обратное сжатие.
- `SegmentedTabs`: анимированная подложка.
- `ConfirmationSheet` → шторка с жестом вниз и приглушением фона.
- «+»: превращение в «×» и задержанное появление действий.
- Контекстные меню (`features/CardActionsMenu.tsx`).

**Этап 4 — жесты и списки.**
- Новый `SwipeableRow` на `PanResponder` + `Animated`, пороги из `gestures`.
- Свайп вправо — выполнено, влево — действия; только существующие операции. Удаление — через существующую отмену.
- Подключение в `planner/Lists.tsx`, `CheckableListItem`. Перестроение списков — `LayoutAnimation` (нативно), на web — CSS-переходы.

**Этап 5 — календарь и здоровье.**
- `ShiftCalendarView` / `ShiftCalendar`: плавная подложка выбранного дня, направленное листание недель.
- `features/HealthScreen.tsx`, `ProtectedHealthScreen.tsx`: плотные content-поверхности, контраст. Расчёты не трогаем.

**Этап 6 — остальные разделы**, кроме Хотелок: питание, фильмы (сетка 4 в ряд сохраняется), поездки, гардероб, работа.

**Этап 7 — полировка**: контраст, узкие экраны, конфликт жестов, производительность.

## 5. Зависимости

По умолчанию — без новых библиотек: `Animated` + `PanResponder` + `LayoutAnimation`.

`react-native-reanimated` и `react-native-gesture-handler` дали бы более плавные свайпы на телефоне, но требуют пересборки нативного приложения (dev build) и меняют модель жестов. Предлагаю решить на этапе 4 после проверки свайпов на `PanResponder`.

## 6. Риски

- **Палитра.** Бриф задаёт графит → серо-розовый, а ранее одобрены «Сиреневый туман» и «Минимал-типографика». Предложение: Soft Future — отдельная тема в переключателе, ваши темы не исчезают.
- **350 жёстких цветов.** Без переноса в токены часть экранов не подхватит тему. Переносим поэтапно, начиная с общих компонентов.
- **Стекло и blur на web и Android.** `backdropFilter` нормально работает только в браузере, на Android blur в RN без библиотек недоступен. Стекло делаем полупрозрачной заливкой + контуром + тенью, blur — только на web и только для шторок и панели.
- **Переход «карточка → страница».** Без reanimated он упрощённый. Нужно не сломать `SwipeBack` и системное «назад».
- **Свайпы строк против вертикальной прокрутки и `SwipeBack` с правого края** — защищаем порогами `gestures.slop`, `horizontalRatio`, `edgeGuard`.
- **Git.** В папке проекта нет ни одного коммита, все файлы только в индексе. Коммит сейчас захватил бы весь проект, включая чужие незавершённые изменения, поэтому коммит не создан.
- **Проверка.** Всё проверено только в браузере (web export), на телефоне не проверялось.
