# Design QA — App-wide compact iOS visual system

- Source visual truth: user-provided TBP ERP People-page screenshot in this conversation.
- Source pixels: 1914 × 866 at the user's stated 80% browser zoom.
- Implementation: the running ERP at `http://localhost:5173`, with the shared style applied to every route.
- Intended viewport: 1914 × 866 CSS pixels at device scale factor 1 and browser zoom 100%.
- Implementation screenshots: not captured; the integrated browser connection is unavailable and direct Playwright capture still requires user approval.
- State: authenticated light-theme ERP, covering shared shell, dashboard/module pages, forms, tables, dialogs, menus, settings, and authentication.

## Full-view comparison evidence

Browser-rendered evidence is blocked. The implementation now applies the selected source's compact typography and component proportions through shared primitives and global workspace tokens rather than page-specific duplication.

## Focused region comparison evidence

Pending browser capture. Focused checks are required for the application shell, dashboard cards, a data table, a form, and a dialog at 100% browser zoom.

## Fidelity surfaces

- Fonts and typography: SF Pro-compatible system stack, optical rendering, tighter tracking, compact shared type scale, and tabular numeric data are implemented.
- Spacing and layout rhythm: shared cards, fields, controls, tables, page gutters, and modal padding are reduced to match the approved People density.
- Colors and visual tokens: the established TBP neutral, orange accent, semantic colors, translucent surfaces, and subtle borders are preserved.
- Image quality and assets: existing TBP logo and employee/avatar assets are preserved; no replacement artwork was introduced.
- Copy and content: unchanged.

## Findings

- [P2] App-wide browser-rendered evidence unavailable.
  - Location: all ERP routes at desktop and mobile breakpoints.
  - Evidence: typecheck, tests, build, and live HMR pass, but visual captures are unavailable through the integrated browser connection.
  - Impact: route-specific wrapping and overflow cannot yet be visually signed off.
  - Fix: capture representative authenticated routes at 1914 × 866 and one mobile breakpoint, then compare with the approved visual language.

## Comparison history

- People-page density pass: approved visually by the user.
- App-wide pass: shared component and global token implementation complete; browser evidence pending.

## Primary interactions tested

- API and workflow tests: 25/25 passing.
- TypeScript typecheck: passing for API and web workspaces.
- Production web build: passing.
- Live development preview: running with successful HMR updates.
- Browser console and route-by-route visual interaction checks: pending browser capture approval.

final result: blocked
