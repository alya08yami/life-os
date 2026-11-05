# LIFE OS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Execution is inline, as requested by the user; do not stop for a second approval.

**Goal:** Рабочий локальный органайзер с Inbox, навигацией, списками и типизированными карточками, готовый к раннему защищённому AI gateway.
**Architecture:** Общие TypeScript domain/contracts, независимый repository, IndexedDB для web и SQLite/постоянные файлы для native. Expo Router связывает реальные формы и сохранённые объекты. AI и incoming share объявляются доступными только после живой интеграции и платформенной проверки.
**Tech Stack:** Expo, React Native, TypeScript, pnpm, Node test runner, IndexedDB, expo-sqlite.
**Spec:** D:/life-os/docs/superpowers/specs/2026-11-02-life-os-design.md с поправками пользователя от 2 ноября.

## Global Constraints
- Новый проект строго D:/life-os; существующие проекты не трогать.
- AI-ключи только backend; первый срез не отправляет пользовательский контент вовне.
- Без фиктивных ответов/кнопок; Android/iOS не объявлять проверенными по web build.
- RU/UK/EN, две темы, ручной fallback, подтверждение классификации.

## Review Focus
- Повторное подтверждение и применение шаблона не создают дублей (task 1/2).
- Ошибка записи не показывает успех и не теряет исходный ввод (task 2/3).
- URL javascript/data не открывается как внешняя ссылка (task 1/3).
- Сохранённое изображение переживает перезагрузку, MIME/размер ограничены (task 2/3).
- Пустые/повреждённые данные и конкурирующие операции не уничтожают записи (task 2).

### Task 1: Контракты и domain
Files: packages/domain/src/{index,templates}.ts, tests/domain.test.ts; root package.json/tsconfig.
Interface: Item discriminated union; classify(text): Suggestion | null; createItem(input): Item; updateItem(item, patch): Item; applyTemplate(state,id,locale): State.
- [x] Написать тесты покупки RU/UK/EN, неоднозначного ввода, пустого текста, опасных URL, типизированных recipe/movie/product.
- [x] Запустить тесты и увидеть отсутствие реализации; затем реализовать validation/rules/types.
- [x] Запустить весь suite; сохранить результат в progress.md.

### Task 2: Persistent repository
Files: packages/domain/src/repository.ts; apps/mobile/src/data/{storage.web,storage.native}.ts; tests/repository.test.ts.
Interface: Store.transact<T>(fn:(State)=>[State,T]):Promise<T>; Repository list/save/confirm/update/remove/settings/template. Объект имеет id, version, inbox status; confirm без копирования сущности.
- [x] Тесты реального IndexedDB: restart, confirm twice, version conflict, delete/search, template twice, transaction abort.
- [x] RED → реализовать IndexedDB atomic transaction, SQLite adapter и очередь; GREEN.
- [x] Отдельно проверить native SQL через Node sqlite с тем же SQL schema/codec, не считать это проверкой телефона.

### Task 3: Expo UI
Files: apps/mobile/app/{_layout,(tabs)/_layout,(tabs)/index,(tabs)/inbox,(tabs)/spaces,(tabs)/search,item/[id],settings}.tsx; src/{ui,context,i18n,features}.
Interface: Provider exposes repository/state/reload/mutate; forms call Repository, never provider SDK.
- [x] Реальные формы add/edit/confirm/delete/complete, ручные movie/recipe/product поля; домашние шаблоны с preview.
- [x] Persist image blobs in web and copy native picker files to permanent directory; keep input on error.
- [x] Проверить typecheck, Expo web production export и browser smoke: create→confirm→search→edit→reload→delete; image reload; settings; templates.

### Task 4: Delivery and next gateway
Files: README.md, docs/verification.md, .env.example, packages/contracts/src/recognition.ts, docs/superpowers/progress.md.
- [x] Зафиксировать typed recognition contract и backend threat boundaries; не создавать открытый AI endpoint.
- [x] Документировать запуск, фактические проверки, неподключённый AI/share/cloud и следующий этап.
- [x] Финальный обзор кода, исправление существенных проблем, повтор affected checks, git status/commit при доступной identity.

## Roadmap после foundation
1. Closed AI gateway + durable quota/cache + provisioning; совместимость incoming share на device development builds.
2. Полный movie flow с vision и каталогом, затем recipe/product extraction в те же типы.
3. Supabase Auth/PostgreSQL/RLS/private storage и явный local import.
4. Секретарь, напоминания, семейные функции; остальные пространства постепенно.

## Итог выполнения
Все четыре задачи foundation выполнены; детали и выявленные/исправленные проблемы записаны в `../progress.md` и `../../verification.md`. Gateways, share и cloud из следующего этапа не считаются реализованными. Нативная работоспособность не заявляется.
