# LIFE OS Editorial UI Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Пользователь явно запросил реализацию по приложенному ТЗ; дополнительный approval не нужен.

**Goal:** Переход от dashboard планировщика к визуальному lifestyle-каталогу с рабочими хотелками.
**Architecture:** Design tokens + reusable media/layout primitives + специализированные cards; существующие Repository и adapters сохраняются. Demo fixtures отделены от настоящих items.
**Tech Stack:** Expo Router, React Native, TypeScript, expo-image, SVG line icons, локальные OFL fonts.
**Spec:** DESIGN_SYSTEM.md, UI_ARCHITECTURE.md и пользовательское ТЗ от 2 ноября.

## Global Constraints
- Не менять backend без необходимости; не выдумывать AI/цены/успешное сохранение.
- Две колонки, без hero/мотивации/счётчиков; все новые строки RU/UK/EN.
- Существующие записи не сбрасывать; optional новые metadata и prefs.

## Review Focus
- Demo ни при каких действиях не попадает в real Repository.
- Currency/variant/stale offer не создают ложный минимум или стрелку снижения.
- Heart не открывает detail и сохраняется после reload для own items.
- Direct-link/back и закрытие sheet не оставляют ловушек навигации.
- Image grid не читает большие original, новые uploads получают thumbnail.

### Task 1: Model and selectors
Files: domain/index.ts, repository.ts, catalog.ts; tests/catalog.test.ts.
- [x] RED для цены, sort/filter и idempotent favorites/preferences.
- [x] Optional metadata и selectors, без изменения old data; GREEN whole suite.

### Task 2: Design primitives and assets
Files: src/design, components, catalog/demo.ts, assets/editorial, assets/fonts.
- [x] Tokens/fonts/line icons/AppShell, grid/cards, явно отдельный demo mode.
- [x] Оптимизированные локальные editorial assets; licenses/prompts documented.

### Task 3: Screens and workflows
Files: dashboard, wishlist, product detail, section route, AddItemBottomSheet, ItemForm.
- [x] Dashboard двухколоночный, wishlist filter/sort/favorite/detail.
- [x] Contextual real add без повторной категории, действующие link/gallery/manual.
- [x] Остальные разделы используют специальные карточки/честные empty states.

### Task 4: Verification
- [x] Existing unit/storage tests, typecheck и Expo web export.
- [x] Browser regression и новый catalog flow на 360/1280, screenshots + visual inspection.
- [x] Independent review, исправления, actual verification report, launch preview.
