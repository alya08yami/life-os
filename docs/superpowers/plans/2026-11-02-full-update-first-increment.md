# LIFE OS Full Spec — First Increment Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. User explicitly instructs audit → plan → begin implementation; do not pause for a second approval.

**Goal:** Закрыть общий UI/home/navigation и локальные product/core пробелы нового ТЗ без переписывания фундамента.
**Architecture:** Existing typed Repository/adapters; optional schema-v1 lifecycle metadata, centralized home preferences and price/compare selectors; feature screens consume commands, demo remains isolated.
**Tech Stack:** Existing Expo Router/RN/TypeScript/SQLite/IndexedDB/Playwright, no new runtime framework.
**Spec:** docs/requirements/2026-11-02-full-update.md; audit/sequence docs/UPDATE_AUDIT.md.

## Global Constraints
- D:/life-os, preserve existing user records and staged foundation/editorial work.
- No DROP/clear/secret in client. Missing lifecycle means active.
- Hide/archive/trash are distinct and recoverable; purge explicit. Source children never cascade-delete.
- Unsupported AI/notifications/shared/maps catalogue remain honest capability boundaries.

## Review Focus
- Old schema-v1 records survive lifecycle/edit/restart without implicit field reset.
- Hidden sections/items retain content and can be reached/restored through settings.
- Trashed attachments remain until permanent purge; search/task/inbox views agree about lifecycle.
- A low item price is not a proven low delivered total when shipping is unknown.
- Navigation retains old direct routes and central Add creates real records.

### Task 1 — Home/Nav
Files: domain/home-preferences.ts; catalog/sections, AppShell, tokens, tab layout/add/tasks/profile; customize-home screen.
- [x] RED/green for preference order/favorite/hidden, unknown/duplicate ids and persistence.
- [x] Five actual tabs; preserve Inbox/library direct links. UI for reorder/hide/favorite/open hidden.
- [x] Typecheck, web export, focused Chrome preference/nav flow; update progress/files list.

### Task 2 — Saved item lifecycle
Files: domain/index/repository/lifecycle; CardActionsMenu, management screen, existing details/grids/search/inbox/tasks.
- [x] RED/green old-data compatibility, hide/archive/trash/restore, edit preservation, source child survival and purge.
- [x] Apply selectors consistently; move UI delete to trash, file cleanup only after permanent purge.
- [x] Menu/restore UI, confirmation and real management collections. Whole suite/build/Chrome A scenario.

### Task 3 — Product comparison and price semantics
Files: domain/catalog, WishlistScreen/ProductDetail/ProductCard, compare screen, SortControl, ItemForm.
- [x] RED/green Home category, price-drop sort, shipping/availability/provenance and 2–3 product validation.
- [x] Actual local compare, no invented attributes/AI conclusions. Manual/demo price source stays visible.
- [x] Whole suite/typecheck/export, Chrome compare and fractional price regression.

### Task 4 — Review and delivery
- [x] Whole increment review by current agent, fixes, affected checks and screenshots completed. Independent reviewer was not run; see docs/verification.md.
- [x] Audit status, changed files, verification and remaining stages documented; preview updated.

Later sections/AI/native/shared work follows the audited roadmap, not dozens of placeholder screens in this change.
