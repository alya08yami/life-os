# Approved LIFE OS implementation
The four newly attached images supersede previous visual directions. Detected screens: home; product list/detail/add; health checkup; medication list/settings/purchase history; regular list/settings; home active/completed; food overview/week/dishes/detail/add/recipes; work notes grid; relationships; finance income/expense.

The only version of each shown screen in this submission is the latest. Home has nine tiles, the specification eleven sections: continue the three-column grid for regular purchases and finance. The relationship image is a distinct additional screen, not a newer version of Work.

Structure: `packages/domain/src/planner.ts` contains models and pure calculations, histories and undo. `apps/mobile/src/planner/` contains shared UI, context/persistence bridge and feature compositions. Repository persists planner state in the existing transactional IndexedDB/SQLite metadata alongside legacy records. Original records are retained. User-created legacy records migrate once with stable IDs. Approved sample objects are explicitly local examples. No fabricated live prices/OCR results.

Components: AppHeader, BottomNavigation, SegmentedTabs, CheckableListItem, StatusCheckbox, ProductCard, MedicationCard, AttachmentPicker, EmptyState, LoadingState, ErrorState, DateLabel, NotesEditor, ConfirmationSheet, UndoToast. Keep field calculations outside UI. Exact timestamp fields and append-only purchase/completion histories. Local calendar day arithmetic avoids 23/25-hour DST errors.

External integrations come after UI/local behavior validation. Current public GitHub Pages hosting cannot hold private API keys or run background server/OCR/catalog jobs. Such features require an authenticated hosted backend and configured providers. Local/manual workflows must remain usable when providers are unavailable.

## Implemented local release
- Approved neutral surfaces, lavender tabs, three-column dashboard, centered LIFE OS, weekly calendar and habit category/name hierarchy. New navigation: Home, Search, Add, Notifications, Profile. Eleven primary sections; Relationships from the Work image is an additional profile destination.
- Habit weekday/frequency editing, exact marking instants with separately selected calendar day, history, reminder time, pause/archive. Calendar filters planned objects.
- Compact product list with favorites; full-width detail, size/color where explicitly present, manual stores and exact-model confirmation. Unconfirmed/different-model/different-currency offers do not compete. Duplicate detection uses title/brand/model/variant.
- Annual checkup year/progress/completion/restoration, editable appointments with calendar, medication supply configuration and append-only purchase history; status/urgency calculations are pure functions.
- Regular supplies with percentages or days, multiple-unit durations, purchase confirmation and history. Undo restores purchase counters without discarding later settings edits.
- Home categories, completion date, settling phase, Completed tab, restoration, recurring occurrence creation and undo.
- Food overview, recipes/dishes, editable/reorderable ingredients, quantities/units, ingredient-to-shopping transfer, source files, weekly assignment. Work/Business note grid and rich editor with headings, text size, bold/italic/underline/strike, lists/checklists, undo/redo, pin/favorite, attachments and autosave.
- Analyses retain original files and manually reviewed values, group by analysis year (unknown dates remain Unknown), permit comparison of confirmed values. Original legacy records and medical files migrate without removing the old library.
- Finance month grid computes transaction totals and active-day averages, supports separate currencies, income/expense entry and notes. The reference's displayed totals/days conflict with the pictured transactions; totals and weekdays are calculated from actual records, not copied as false aggregates.
- Global search with section/date/status/attachment filters; deduplicated in-app notifications and global/section/object toggles; recoverable deletion confirmation, archive and backup merge.

## Verified checks
80 unit/integration tests pass, including stock, multi-unit duration, transitions, sorting, exact dates, DST, history, undo, recurrence, persistence and matching. Nine mobile browser scenarios passed together, and the corrected habit direct-link scenario passed separately. Web/Pages builds and TypeScript pass. iOS/Android JavaScript exports pass; physical native device behavior was not tested. Screenshots: `docs/screenshots/approved-*.png` (390 x 844).

## External service boundary
The live local API reports ai=false, catalog=false, places=false, notifications=false and cloudSync=false. GitHub Pages is the client build only. The optional review interface can use the existing authenticated AI/TMDB/Places gateway once that backend is hosted and configured. Original materials and manual forms work without it. No external calls are made merely by viewing records.

Real store discovery/price refresh, automatic lab OCR (including PDF), video/link extraction, background push delivery and cloud sync are not completed integrations in this release. These require a hosted backend and configured providers; they are not simulated as successful operations. Existing AI extraction reads supplied text/images and never claims to watch linked videos. Notes full rich formatting is verified in the mobile browser; native fallback remains text-based.
