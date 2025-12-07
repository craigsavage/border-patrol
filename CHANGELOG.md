# Changelog

All notable changes to this project will be documented in this file.

## [1.5.1] - 2025-12-06

### Added

- Added translations for English, Spanish, and German.
- Added a language selector to the site footer.

## [1.5.0] - 2025-12-01

### Added

- Setup testing framework to improve code reliability and prevent future regressions.

### Changed

- Migrated the codebase from JavaScript to TypeScript for improved type safety and maintainability.

## [1.4.3] - 2025-09-12

### Added

- Added a new script to automatically generate `changelog.html` from `CHANGELOG.md`, streamlining the build process.
- Implemented automated compression of the `dist` folder, streamlining the release process.
- Added keyboard shortcut display to the popup UI for both Border Mode and Inspector Mode. Users can now view the current shortcut and access a direct link to the browser's extension settings for customization.

## [1.4.2] - 2025-09-02

### Fixed

- Fixed Rollup configuration issue causing error on development builds.

## [1.4.1] - 2025-09-01

### Added

- Added new keyboard shortcut (`"Alt+Shift+I"`) for toggling inspector mode.

### Changed

- Enhanced Inspector Mode overlay with element grouping, text-related, and appearance properties.
- Improved display text formatting and added color preview box in the Inspector Mode overlay.

### Fixed

- Fixed style conflicts between inspector mode and host page text.

## [1.4.0] - 2025-07-30

### Added

- Added dark mode support to the extension's popup UI.
- Integrated Sass and a Rollup/PostCSS pipeline for streamlined, optimized, and isolated CSS bundling per component.

### Changed

- Now highlights all box model areas (margin, border, padding, content) for enhanced CSS layout visualization.
- Refactored Popup component to use React for improved maintainability and scalability.
- Updated Popup UI to utilize Ant Design, providing a more modern and consistent user experience.
- Self-host font assets for faster load times, improved reliability, and enhanced privacy.
- App version now directly injected from `package.json` into the UI's footer at build time, ensuring consistent display.

## [1.3.2] - 2025-06-29

### Fixed

- Border outlines are now applied to dynamically added elements.

## [1.3.1] - 2025-06-27

### Added

- Added the CHANGELOG to the landing page website, making it easier for users to stay informed about the latest features and improvements.
- Implemented a script to automate the synchronization of version numbers across multiple files.
- Added feedback for users when attempting to take a screenshot without the necessary downloads permission.

### Changed

- Updated popup menu to display the version number and include a link to the website, replacing the previous GitHub link.

### Fixed

- Improved error handling for tab lifecycle events and restricted pages.

## [1.3.0] - 2025-06-21

### Added

- Added Rollup bundler to Border Patrol to improve build process and performance.
- Popup now includes a "Take Screenshot" button to capture and download the current tab as an image.
- Launched a comprehensive landing page featuring an intuitive layout, enhanced visuals, and clear feature explanations to improve user onboarding and engagement.

### Changed

- Redesigned the Border Patrol logo with the 'Grandstander' font for a modern, distinctive look.
- Updated popup checkboxes to modern toggle switches with smooth animations and consistent styling.

### Fixed

- Border formatting issue causing multiple border info to be shown inline.

## [1.2.4] - 2025-06-08

### Fixed

- Resolved a critical issue that could cause JavaScript errors in the extension popup, preventing the UI from displaying correctly or initializing properly.

## [1.2.3] - 2025-06-07

### Changed

- Improved the popup interface to clearly indicate when the extension cannot be used on restricted pages and disabled inputs for better user clarity.
- Enabled Border Patrol to work on local files, supporting local development environments.

### Fixed

- Resolved an error that prevented inspector mode from working on SVG and Path elements.
- Prevented Border Mode styles from unintentionally affecting the Inspector Overlay, ensuring a cleaner view of the extension's own elements.
- Improved border information display in the Inspector Overlay to only show relevant details when a border is actually visible.
- Cleaned up redundant positioning logic and unnecessary async declarations.

## [1.2.2] - 2025-05-28

### Added

- Enhanced inspector overlay with element ID, classes, display property, and the full BP Blue color palette for improved information and visuals.

### Fixed

- Resolved issues causing errors when tabs were closed or navigated away, improving stability.
- Corrected the inspector overlay's position, so it no longer shifts when you scroll.
- Improved compatibility with various websites by preventing site styles from disrupting the extension's appearance.
- Resolved an error that occurred when inspecting SVG icons.
- Ensured the inspector overlay's text size remains consistent across different websites.

## [1.2.1] - 2025-05-19

### Added

- Added community guidelines (Code of Conduct).
- Added security policies.
- Added guidelines for contributors.
- Included project licensing information.

### Changed

- Updated `README` with fresh project details and improved instructions.
- Updated extension description in the manifest file for clarity.

## [1.2.0] - 2025-05-17

### Added

- Introduced an Element Inspector Overlay to show details about elements you hover over.
- Added visual highlighting for hovered elements in inspect mode.

### Changed

- Improved internal file organization for better future development.
- Refactored the popup menu for more efficient and robust functionality.
- Made the popup menu more reliable on restricted web pages.
- Inspector mode can now be enabled per individual tab, not just globally.
- Improved how border and inspector mode settings are saved and managed per tab.
- Added centralized functions for managing tab states.
- Updated the overlay with company branding for a more professional look.
- Significant internal code improvements for better performance and easier future updates.
- Refreshed the menu text logo to match the brand's design.
- Smoother and more responsive overlay positioning when you move your mouse.

### Removed

- Streamlined script injection for better performance.
- Removed `"On/Off"` text from the extension icon for a cleaner look.

### Fixed

- Resolved issues where the popup menu's display wasn't updating correctly.
- Fixed critical connection and state synchronization issues for more reliable functionality.
- Borders now apply correctly immediately after installation.
- Changed the keyboard shortcut for toggling borders to `"Alt+Shift+B"` to avoid conflicts and ensure it works reliably.
- Inspector mode now correctly deactivates after extension reload or on restricted pages.
- Corrected inspector overlay position when scrolling or with the console open.
- Improved resource management by cleaning up data when tabs are closed.

## [1.1.0] - 2025-03-18

### Added

- Introduced a new official brand logo for Border Patrol.
- Added a popup menu to easily customize border size and style, with instant updates.
- Included an Enable/Disable toggle in the extension popup.
- Added colored outlines to elements based on their type, making website structure easier to understand.

### Changed

- Updated all extension icons to the new brand logo.

### Fixed

- Resolved an issue where borders would disappear after page reloads or tab switches.
- Ensured borders are correctly removed when the extension is disabled.
