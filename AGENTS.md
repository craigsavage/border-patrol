# Agents Instructions

This repository is a Manifest V3 browser extension built with TypeScript, React, Ant Design, SCSS, Rollup, and Jest.

## Architecture

- **Background service worker:** `src/background.ts` (entry point; imports messaging handlers and tab state management)
- **Content script:** `src/scripts/main-content.ts` (injected entry point; imports feature modules: `border.ts`, `overlay.ts`, `measurement.ts`, `ruler.ts`, `fullpage.ts`)
- **Popup UI:** `src/popup/menu.tsx` (React + Ant Design; hooks in `src/popup/hooks/`, components in `src/popup/components/`)
- **Offscreen document:** `src/offscreen/offscreen.ts` (handles async operations like full-page screenshots; runs in isolated context)
- **Shared helpers:** `src/scripts/utils/` and `src/background/utils/` (exported TS declarations in `src/types/`)
- **Styling:** Main SCSS bundle in `src/styles/main-content.scss`; shadow-DOM component styles compiled from `*.shadow.scss` files as CSS strings

## Build & Scripts

- Do not edit `dist/`, `dist-zips/`, `bundle-report.html`, or generated docs output unless the task is specifically about generated artifacts.
- Source of truth is under `src/`, `tests/`, `scripts/`, and root config files. Build outputs are produced through Rollup; keep entry-point assumptions aligned with `rollup.config.js`.
- **Common commands:** `npm run build` (production Rollup), `npm run dev` (watch), `npm test` (Jest), `npm run typecheck` (tsc).
- **Config & entry points:** `rollup.config.js`, `tsconfig.json`, `manifest.json`.
- **Key source files:** `src/background.ts`, `src/scripts/main-content.ts`, `src/popup/menu.tsx`, `src/offscreen/offscreen.ts`.

## Code Style

- Prefer small, targeted changes that preserve the existing file layout and naming.
- Follow the existing TypeScript style: strict typing, function components, async Chrome API calls, and early returns for guard clauses.
- Add concise docstrings (JSDoc-style) to all exported functions and major helpers. Docstrings should briefly describe purpose, parameters, and return values where relevant.
- Code should be clean and modular. Avoid large functions, break complex logic into smaller related pieces if necessary.
- Keep comments sparse elsewhere. Add them only where the logic is not obvious.
- Reuse existing helpers before adding new ones.
- Keep popup logic in hooks/components and extension runtime logic in background or content-script modules.
- Use descriptive variable and function names to enhance readability without needing excessive comments.

## Extension Behavior Constraints

- Preserve restricted-page handling via `isRestrictedUrl` and related guards before injecting scripts or enabling features.
- Preserve messaging contracts between popup, background, and content scripts. If you add a new action, update all relevant senders and listeners.
- Store per-tab state in `chrome.storage.local` keyed by tab ID; read global settings like border size/style from storage.
- Avoid duplicate content-script injection; keep background-side checks and Manifest V3 compatibility.
- The four primary feature modes — Border, Inspector, Measurement, and Ruler — each follow the same pattern: a popup toggle, a `TabState` field, a background message handler (`TOGGLE_*`/`UPDATE_*`), a content-script module in `src/scripts/`, and a keyboard shortcut (Alt+Shift+B/I/M/R). Maintain this contract when adding modes.

## UI And Styling

- Popup UI uses Ant Design components plus local SCSS.
- Reuse the existing visual language and avoid introducing a second styling approach.
- If a popup change adds user-facing copy, wire it through the translation system instead of hardcoding strings.

## Localization

- Locale files live in `src/_locales/<locale>/messages.json`.
- When adding or renaming a translation key used by the popup, update every supported locale: `en`, `es`, `de`, and `fr`.
- Keep translation keys stable and descriptive.

## Testing

- Run tests with `npm test`.
- Jest is configured with `jsdom` and path aliases for `scripts/*`.
- Add or update tests when changing pure helpers, formatting logic, URL restriction behavior, or other logic that can be exercised outside Chrome runtime integration.
- Prefer focused unit tests under `tests/src/` over broad rewrites.

## Documentation And Contribution Notes

- If a behavior change affects usage, permissions, shortcuts, or screenshots, update `README.md` and related docs as needed.
- If a behavior change affects usage, permissions, shortcuts, or screenshots, update `README.md` and related docs as needed.
- The repository uses `dev` as the default development branch; `main` is reserved for releases. Verify your working branch before pushing.

## Practical Defaults For Copilot

- Inspect related background, popup, and content-script files together before larger refactors.
- Fix root causes rather than adding one-off conditionals.
- Avoid adding dependencies unless absolutely necessary.

---

Keep this file updated for contributors.
