# Border Patrol Copilot Instructions

This repository is a Manifest V3 browser extension built with TypeScript, React, Ant Design, SCSS, Rollup, and Jest.

## Architecture

- Treat `src/background.ts` as the background service worker entry point.
- Treat `src/scripts/main-content.ts` as the injected content-script entry point. It pulls in `border.ts`, `overlay.ts`, and `main-content.scss`.
- Treat `src/popup/menu.tsx` as the popup entry point. Popup UI lives under `src/popup/` and uses React function components plus custom hooks.
- Shared browser-extension helpers live under `src/scripts/` and `src/scripts/utils/`.
- Shared TypeScript declarations live under `src/types/`.

## Build And Generated Output

- Do not edit `dist/`, `dist-zips/`, `bundle-report.html`, or generated docs output unless the task is specifically about generated artifacts.
- Source of truth is under `src/`, `tests/`, `scripts/`, and root config files.
- Build outputs are produced through Rollup. Keep entry-point assumptions aligned with `rollup.config.js`.

## Code Style

- Prefer small, targeted changes that preserve the existing file layout and naming.
- Follow the existing TypeScript style: strict typing, function components, async Chrome API calls, and early returns for guard clauses.
- Keep comments sparse. Add them only where the logic is not obvious.
- Reuse existing helpers before adding new ones.
- Keep popup logic in hooks/components and extension runtime logic in background or content-script modules.

## Extension Behavior Constraints

- Preserve restricted-page handling via `isRestrictedUrl` and related guards before injecting scripts or enabling features.
- Preserve messaging contracts between popup, background, and content scripts. If you add a new action, update all relevant senders and listeners.
- Tab-specific state is stored in `chrome.storage.local` keyed by tab ID. Global settings like border size and style are also read from storage. Keep that split consistent unless the task requires redesign.
- Be careful with content-script injection. Avoid duplicate injection logic and keep background-side checks in place.
- Keep Manifest V3 compatibility. Do not introduce APIs or patterns that require persistent background pages.

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
- The repository currently uses `main` as the default branch. If contribution docs mention `dev`, verify the current branch strategy before repeating that guidance.

## Practical Defaults For Copilot

- Before larger refactors, inspect related background, popup, and content-script files together because many features span all three.
- Prefer fixing root causes over adding one-off conditionals.
- Avoid adding dependencies unless the current stack cannot solve the problem cleanly.

---

Update this file as needed to keep instructions accurate and helpful for future contributors.
