# Privacy Permissions Usage

These are the permissions that Border Patrol uses and why they are needed. This is used on the chrome web store privacy policy and permissions sections, and should be kept up to date with the actual permissions declared in `manifest.json` and used in the codebase.

## Single purpose description

Visually inspect webpage layouts by outlining HTML elements and showing box model details.

## Permission justification

Border Patrol requires the following permissions to function properly.

Scripting:

> The scripting permission is used in conjunction with activeTab and host_permissions to inject content scripts and CSS into web pages. This is necessary to render the visual outlines and the inspector overlay directly onto the page content as intended by the extension's features.

Storage:

> The storage permission is used to save and retrieve user settings, per-tab state, and feature configurations. This alThe storage permission is used to save and load the extension's settings (like border size and style) and the per-tab state (whether border or inspector mode is enabled for a specific tab) locally within the user's browser. This data is stored only on the user's machine and is not transmitted or shared externally.

ActiveTab:

> The activeTab permission is used to allow the extension to interact with the user's currently active tab only when the user explicitly invokes the extension (e.g., by clicking the extension's icon or using its keyboard shortcut). This is necessary to inject content scripts and CSS, update the action icon, and send messages related to the active tab.

Downloads:

> The downloads permission is exclusively required to enable Border Patrol's "Screenshot Capture" feature, allowing users to save an image of the current webpage (with the extension's outlines applied) directly to their local machine. This action is always initiated explicitly by the user clicking the "Take Screenshot" button, and Border Patrol does not access, collect, transmit, or store any user data or Browse history in relation to this permission or for any other purpose.

ContextMenus:

> ContextMenu is used for quick access to toggling any of the modes by right clicking to open the context menu the selecting the mode. This is added to provide users with even faster access to Border Patrol's core functionality.

Offscreen:

> The "offscreen" permission is required solely to enable the extension’s full page screenshot functionality. No other features use this permission.

Host Permission:

> The host_permissions with <all_urls> is essential for Border Patrol's core functionality. It is required to inject content scripts and CSS into any web page the user visits.
> Injection occurs automatically when a page finishes loading or when the user switches tabs, as well as via user-initiated actions (icon click, command).
> While the activeTab permission covers user-initiated injections, it does not grant permission for injections triggered solely by navigation or tab switching events when the user has not just interacted with the extension icon.
> Therefore, <all_urls> is necessary to ensure Border Patrol reliably injects its scripts and provides visual feedback on page structure and the box model as the user browses normally across all websites.
> No user data from pages is collected or transmitted externally; access is solely for injecting visual debugging tools onto page content.
