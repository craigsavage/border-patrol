# Border Patrol – CSS Debugger & Element Outliner

Are you tired of digging through complex CSS and hovering endlessly in DevTools just to figure out element boundaries, margins, and padding? **Border Patrol** is the free and open-source Chrome extension built to solve that frustration!

It's a powerful visual debugging tool that instantly reveals the structure and box model of any webpage. Perfect for web developers, designers, and QA testers, it makes understanding layouts, identifying spacing issues, and debugging CSS problems faster and more intuitive than ever before.

## ✨ Key Features

- **Instant Visual Outlining:** Apply color-coded outlines to _every_ HTML element on a page with a single click or shortcut. See nested structures and element boundaries at a glance.
- **Visualize the Box Model:** Clearly visualize element boundaries, margins, and padding, helping you understand element spacing and dimensions.
- **Detailed Element Inspector:** Activate Inspector Mode and simply hover over any element on the page to view a real-time overlay displaying its tag name, precise dimensions (`width` x `height`), and computed border, margin, and padding styles.
- **Measurement Mode:** Click any two elements to instantly measure the pixel distance between them. Selected elements are highlighted with a color-coded overlay, and a dashed connector line with the distance in px is drawn between them. Press `Escape` to reset.
- **Ruler Mode:** Toggle a pixel ruler along the top and left edges of the page. Rulers display page coordinates (updated as you scroll), with tick marks every 50 px and labels every 200 px. A blush-colored crosshair line on each ruler tracks your mouse position in real time. Fully theme-aware — responds to the extension's dark mode setting.
- **Border Mode Settings:** Tailor the outlines to your preference by easily adjusting their size (from `1px` to `3px`) and style (`solid, dashed, dotted, double`) via the extension's intuitive popup menu.
- **Screenshot Capture:** Capture screenshots of the page with Border Mode outlines applied. Choose between two modes:
  - **Visible**: Captures only the currently visible portion of the page (the viewport).
  - **Full Page**: Captures the entire scrollable page, automatically scrolling and stitching together all content (even content outside the viewport). This is ideal for documentation, bug reports, or sharing a complete layout snapshot.
- **Right-Click Context Menu:** Quickly toggle any mode directly from the browser's right-click context menu — no need to open the popup.
- **Dark Mode:** Save your eyes by switching between Light and Dark mode in the popup menu.
- **Language Support:** Currently supports translations for Spanish, French, and German. More to come...

### 📸 Screenshots / Demo

|                                               Border Mode                                               |                                               Inspector Mode                                               |
| :-----------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------: |
| ![Border Mode Example](https://github.com/user-attachments/assets/9f4be5bf-344b-4ce1-999c-c7078b1b807c) | ![Inspector Mode Example](https://github.com/user-attachments/assets/c72c259b-8638-4ad0-a12b-0d2938d92679) |

### How to Use

1. Navigate to any webpage you want to inspect or debug.
2. Click the Border Patrol extension icon in your browser toolbar (_**Pro tip**: pin the extension so you can access it faster_), use a keyboard shortcut, or **right-click anywhere on the page** and select an option from the **Border Patrol** context menu.
3. **Border Mode**: Toggle the "Toggle Border Mode" switch to apply colorful outlines to all elements on the page. Use the "Border Settings" controls to adjust the outline size and style to your liking.
   - Adjust outline **size** and **style** using the controls under **Border Settings**.
4. **Toggle Inspector Mode:** Use the "Toggle Inspector Mode" switch in the popup to activate the element information overlay. Hover over elements to see their details.
5. **Toggle Measurement Mode:** Use the "Toggle Measurement Mode" switch in the popup to measure the distance between any two elements.
   - Hover over an element to preview it with a blue highlight.
   - Click to select it as the **first** element (green highlight + "1st" badge).
   - Click a second element to select it (green highlight + "2nd" badge) — a dashed line and distance in `px` appear between them.
   - Press `Escape` or click again to reset the selection.
6. **Toggle Ruler Mode:** Use the "Ruler Mode" switch in the popup to show a pixel ruler along the top and left edges of the viewport. The rulers stay in sync as you scroll, and a crosshair line follows your mouse on both axes.

### Right-Click Context Menu

Right-click anywhere on a page to access the **Border Patrol** sub-menu and instantly toggle any mode without opening the popup:

- **Toggle Border Mode**
- **Toggle Inspector Mode**
- **Toggle Measurement Mode**
- **Toggle Ruler Mode**

### Keyboard Shortcuts

Toggle Border Patrol ON or OFF instantly with a customizable keyboard shortcut.

- Toggle Border Mode: `Alt` + `Shift` + `B` (Default)
- Toggle Inspector Mode: `Alt` + `Shift` + `I` (Default)
- Toggle Measurement Mode: `Alt` + `Shift` + `M` (Default)
- Toggle Ruler Mode: `Alt` + `Shift` + `R` (Default)

You can customize these shortcuts in your Chrome browser by navigating to `chrome://extensions/shortcuts`.

### Contributing

Border Patrol is an open-source project that thrives on community contributions, embracing transparency and collaboration. We welcome and value contributions, whether it's a new feature idea, bug fix, or code improvement, to continually enhance the project.

Please see the [CONTRIBUTING](CONTRIBUTING.md) file for more detailed guidelines on contributing. Pull requests should target the `dev` branch.

### Feedback and Support 💬

For bug reports, feature requests, or general feedback, please open an issue on the [Border Patrol GitHub Issues page](https://github.com/craigsavage/border-patrol/issues).

### License

Border Patrol is released under the [Apache-2.0 License](https://github.com/craigsavage/border-patrol/blob/main/LICENSE) 📄.
