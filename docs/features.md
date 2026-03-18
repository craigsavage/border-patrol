# Border Patrol Features

The Border Patrol extension offers a suite of tools to help web developers analyze and debug their pages. This document provides an overview of all features currently available in the extension, along with instructions on how to use them effectively.

## Modes

Border Patrol has four primary modes that can be toggled on or off independently. Each mode provides a different set of visual debugging tools. Note: All modes are designed to work together seamlessly, so you can enable multiple modes at once for a comprehensive debugging experience.

### Border Mode

Draws a configurable border around every element on the page to make layout structure immediately visible. Border Mode is useful for spotting unexpected margins, padding, and nesting. You can adjust border color, thickness, and style from the extension popup, and changes apply live to the active tab.

### Inspector Mode

Lets you inspect individual elements by hovering and clicking on the page. As you move the mouse, the currently hovered element is highlighted; clicking an element locks the highlight and shows details such as its tag name, classes, approximate size, and box-model information. Use this mode to quickly understand which DOM node corresponds to what you see on screen.

### Measurement Mode

Enables on-page measurements so you can check spacing and alignment without leaving the browser. Click and drag between two points to draw a measurement overlay that shows pixel distances horizontally and vertically. Measurements snap to element edges where possible, helping you verify consistent gutters, padding, and alignment across your layout.

### Ruler Mode

Toggle a pixel ruler along the top and left edges of the page. Rulers display page coordinates (updated as you scroll), with tick marks every 50 px and labels every 200 px. A blush-colored crosshair line on each ruler tracks your mouse position in real time. Fully theme-aware — responds to the extension's dark mode setting.

## Screenshot Tool

Border Patrol also includes a screenshot tool for capturing what you see while using the visual debugging modes. From the extension popup, you can trigger a screenshot of the current tab; the captured image respects any active modes and overlays so you can share or document layout issues. Screenshots are saved via the browser's standard download flow.
