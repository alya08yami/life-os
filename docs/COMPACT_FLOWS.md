# Compact lists, health and notes — 2026-11-03

- Replaced the wardrobe dashboard entry with Regular purchases. Two adjacent columns (Products / Other), thirteen requested editable/checkable examples and per-column plus controls. Legacy wardrobe route opens Regular purchases; existing garment records remain recoverable in storage.
- Shared compact checklist uses 12px circles inside larger clickable rows, no row rules, reduced vertical spacing. Inline add/edit commits on Enter or blur, ignores blanks and suppresses duplicate submissions; errors retain the draft. Home uses the same add flow.
- Design chat: centered title and AI sparkle icon; no example room photo, canned dialogue or extra save-material action. Photo/file, question and send retained. Real provider boundary remains unchanged.
- Larger left product image with actions on the right. Movie detail uses a normal poster and compact favourite/trailer/share/task actions. Card back buttons return to Home.
- Health: three small square menu tiles; personal check-up list replaces age/sex template and source links. Doctor calendar supports month navigation, selected date, adding visits on that date and assigning dates to existing entries. Medicine lists have compact edit/archive controls, inline autosave and a pill-marked Tabletki.ua link; synthetic instructions are not displayed.
- Metrics/documents are grouped by actual saved year. Undated legacy records are explicitly kept under Without date; no dates inferred. Users can create year folders and upload into the selected year. AI discussion and recoverable archive retained.
- Fixed VisualGrid header insets so Food filter chips do not clip at the left edge.
- Work/Ideas: paper editor, horizontal note switcher, bold/italic/underline and ordered/unordered lists in the browser. Plain-text paste and allowed-tag/attribute stripping guard stored HTML. Plain text remains searchable; rich markup is stored in idea notes. Serialized saves preserve per-document identity and prevent duplicate notes. Opening a rich note from an item link routes to its editor. Native fallback retains a text editor; full browser selection formatting was validated in the web app.

Validation: TypeScript passed. 62 unit tests passed (including seed idempotency and rich-note sanitization). Six new mobile Playwright scenarios passed; final purchases/editor refinements were rechecked with two targeted scenarios. Web/Pages and iOS/Android JS exports passed. Native device execution and the complete older browser suite were not rerun. Screenshots: compact-regular/home/calendar/years/product/notes.png.

No live AI requests, external messages, real medical uploads, or source archive publication were performed. Browser tests used isolated synthetic data.
