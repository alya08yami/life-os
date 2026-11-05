# GitHub Pages publication

Repository: https://github.com/alya08yami/life-os

Application URL: https://alya08yami.github.io/life-os/

Pages source: `main`, `/ (root)`. The public repository contains the compiled web application, assets and README. Development source, local databases, credentials, dependency caches and private runtime files are not published. The initial source archive upload was removed before commit after automatic review rejected it; publication continued with the web build only.

Local preparation:

```sh
pnpm build:pages
node scripts/prepare-github-upload.cjs
```

`apps/mobile/app.config.ts` uses `LIFE_OS_WEB_BASE_PATH=/life-os` only for the Pages build. The normal local/native configuration remains unchanged. `EXPO_PUBLIC_STATIC_PREVIEW=true` disables server API requests in this static build. The package script flattens hashed assets and rewrites their exact URLs, checks filename collisions, and includes `.nojekyll` plus SPA `404.html`. The upload folder is `/tmp/life-os-github-upload/site`.

Only files in that prepared folder are uploaded. No source archive is included. Browser records belong to the current device/origin and are not uploaded to the public repository. Use local backup export/import to transfer records manually. AI, catalog/Places services, accounts and shared spaces need a separately hosted API.

GitHub connector read access works; write via Git Database API returned 403 (`Resource not accessible by integration`). The build was uploaded through the authenticated GitHub web UI, and Pages was enabled through repository settings. Local source staging and the existing uncommitted project were retained.

## Verified deployment

GitHub Pages run `41516308178`: build, deploy and report-build-status completed successfully. Public root opened successfully at `https://alya08yami.github.io/life-os/`. Verified wishlist navigation, all five loaded images, and direct page reload at `/life-os/wishlist`. Checked responsive layout at 390×844, then restored the browser viewport. No source ZIP was included in the commit.

Reference update deployed in Pages run `41524379360`: all three jobs succeeded. Public root shows Inbox 3, eight sections and the new bottom navigation; wishlist opens the four new editable reference examples. Browser swipe behavior verified in five mobile Playwright scenarios before deployment.

Interaction refresh published 2026-11-03. Pages run `41551869291`: build, deploy and report status succeeded. Published index SHA `b55ef397dc535cdcfdd6049cd00ab309709554eb`; compiled package contains 72 files, no source archive or local records. Public root uses the new Inter overlay tiles without Inbox; application includes home checklist and health/media refresh. See `REFRESH_2026-11-02.md` for feature and AI boundaries.

Liquid Glass redesign published 2026-11-03. Pages run `41553483762` completed successfully (build, deploy, status). Uploaded 34 compiled HTML/JS/JSON files; unchanged public photos/fonts were retained. Design verification is recorded in `GLASS_REDESIGN.md` and `docs/screenshots/glass-*.png`.

Gradient category refinement published 2026-11-03 in successful Pages run `41554556662`. Six changed compiled files uploaded, remaining unchanged chunks/assets retained. Replaced category photos with SVG mesh gradients, labels and highlights; reduced background saturation toward milky white. Home/health/swipe regressions and four-screen visual audit passed.

Compact flows update published 2026-11-03. Pages runs `41558101234` and final `41558300871` completed successfully. Compiled assets only; latest entry `entry-6ea888ffa588495c2bdc62cc6d0dce73.js`. Public dashboard verified after reload with Regular Purchases replacing Wardrobe. Validation: 62 unit tests, six mobile web scenarios, TypeScript, Pages build, and iOS/Android JavaScript exports passed. See `COMPACT_FLOWS.md`.

Approved functional-layout release published 2026-11-03. Commit `2f5ba3f` and Pages run `41719348895` completed successfully (36 seconds). Uploaded 60 compiled files (about 3.1 MB); unchanged assets retained. Public entry references `__common-dceec28e8558bf524d1abb6fc2f20b41.js` and `entry-562d37464e2ba3fc05d34dc1bc8f2418.js`. No source archive, local records, private files or credentials were uploaded. See `APPROVED_SPEC_2026-11-03.md` for delivered behavior, validation and the external-provider boundary.
Public verification after deployment: reloaded the existing user tab, confirmed eleven dashboard sections, new weekly calendar and bottom navigation. Opened Habit and verified editable frequency/reminder fields; returned home, opened Shopping and confirmed the new product images loaded. Left the public home tab open as the deliverable. Source and runtime records remain local.

Weekly-calendar and quick-entry release deployed successfully in Pages run `41726477830` (33 seconds), 2026-11-03 23:57 Europe/Kiev. Uploaded 31 changed compiled files; existing image/font assets retained. Current entry: `entry-fb68c5c0d5dd068f242917e0561f59dd.js`; shared bundle: `__common-12cd8069668dc5d6e7b1f8212848a43c.js`. Validation and interaction details: `QUICK_FLOWS_2026-11-03.md`.
Public verification 2026-11-04: refreshed the existing user tab, confirmed the paged calendar and habit plus, opened Health with Medications selected and no Overview, then Food with Plan selected and aligned day/meal columns. Returned with the previous-step button and left the public home open as the deliverable. No live purchase records were changed during verification.

Meal-cell inline dish entry published 2026-11-04, Pages run `41728499199` succeeded (29 seconds). Three compiled files uploaded; shared bundle `__common-6266b7ccc273effd0be57b1d8f85ee3a.js`. Each empty breakfast/lunch/dinner/snack slot opens a dish title and repeatable ingredient rows with quantity/unit; one transaction saves the dish and selected date/meal. Existing-dish selection retained. Typecheck, web/Pages builds and all eight quick-flow browser tests passed, including ingredient persistence after reload. Public form verified in a temporary tab without saving test records to the user's data.

Section-tab back navigation and regular purchase age colors published 2026-11-04. Pages run `41729093987` succeeded (31 seconds); shared bundle `__common-cc3b84ce53f9783a8f75d800fd56ff6f.js`. Tab selection now clears obsolete local navigation steps; opening details still records a return to the selected tab. Regular purchase age labels use the same stock tone as their plus control. Typecheck, web/Pages builds, 83 unit tests and 9 quick-flow browser tests passed. Public verification confirmed Home → Repair tab → Back returns to the dashboard. No user records changed.

Meal-cell visibility correction published 2026-11-04 in Pages run `41729539432` (31 seconds), shared bundle `__common-bbf44026c86d541b26f5bd166b07aef6.js`. Moved the existing dish/ingredient form into the reusable modal bottom sheet so the selected cell's plus shows inputs immediately, above the calendar. Typecheck and both builds passed. Focused creation/persistence test passed at 390×844; visibility/close test passed at the comment's 615×647 viewport. Screenshot: `screenshots/meal-entry-sheet.png`. Verified the published breakfast plus opens the sheet without modifying user data.

Compact finance day-cell entry published 2026-11-04: commit `254b4b0`, Pages run `41730338656` succeeded (31 seconds), bundle `__common-dc9840ee682f123c8bc5801b2fac2ff1.js`. The decimal input now sits inside the selected day cell beneath its date rather than below the calendar. Enter/blur save behavior and currency suffix retained for income and expense. Typecheck, both builds and two focused finance browser tests passed, including bounding-box verification at 615×647. Screenshot: `screenshots/finance-cell-entry.png`. Public verification opened October 8 and confirmed its input is nested in the selected day; no transaction created.
