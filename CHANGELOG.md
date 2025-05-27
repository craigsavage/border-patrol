# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

WIP

## [1.2.1] - 2025-05-19

### Added

- `CODE_OF_CONDUCT.md`: Guidelines for community behavior
- `SECURITY.md`: Security policies and procedures
- `CONTRIBUTING.md`: Contribution guidelines for developers
- `LICENSE`: Licensing information for the project

### Changed

- `README.md`: Updated with new project information, installation instructions, and usage examples
- `manifest.json`: Updated extension description to better reflect functionality

## [1.2.0] - 2025-05-17

### Added

- Element Inspector Overlay feature displaying information about hovered elements
- Add visual highlighting for hovered elements in inspect mode to enhance user experience

### Changed

- Restructure files for better code organization and clarity:
  - Moved `icons/` under assets/ folder.
  - Moved popup menu files under a `popup/` folder.
  - Renamed `css/` to `styles/`.
- Convert popup menu to a module for reusability and reduced code duplication
- Improve popup menu robustness by utilizing the `isRestrictedUrl` function
- Improve logging control by conditionally enabling debug logs
- Add logic for `onRemoved` to clean up data for closed tabs
- Enable inspector mode per-tab instead of globally
- Update cache keys for centralized per-tab management of border and inspector modes
- Add `get/set` tab state functions for centralized management
- Enhanced overlay with company branding, including company name, improved semantic structure, and updated highlight color.
- Refactored code for improved readability and reusability:
  - Streamlined code structure and clarity by extracting helper functions, introducing constants, and renaming functions.
  - Enhanced maintainability and debugging with updated terminology and reinstated error logging.
- Updated menu text logo to match original design, applying primary color (`#2374ab`), dashed border, and improving CSS organization.
- Updated overlay positioning for a smoother visual experience, including continuous `mousemove` updates, throttling for repositioning, and performance improvements.

### Removed

- Removed `content_scripts` from manifest as scripts are now handled programmatically
- Removed On/Off badge text from the extension icon

### Fixed

- Fix issues with the popup menu's UI state not updating correctly
- Fix critical issues with connection and state syncing, improving state management reliability and ensuring proper script injection into browser tabs
- Fixed borders application on fresh install by applying default borders, improving error handling, and corrected default border style.
- Fixed keyboard shortcut for toggling borders:
  - Changed the shortcut to `Alt+Shift+B` to avoid conflicts.
  - Implemented a `chrome.commands.onCommand` listener in the background script to handle shortcut commands.
- Fixed inspector mode persistence after extension reload by cleaning up DOM elements and preventing script injection on restricted pages.
- Fixed inspector mode overlay position on scroll or when the console is open by adjusting position calculations with scroll values and ensuring proper display.
