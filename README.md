<div align="center">

# Infinite OS

*A browser-based desktop environment powered by AI*

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge&labelColor=1a1a2e)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-f7df1e?style=for-the-badge&labelColor=1a1a2e&logo=javascript&logoColor=f7df1e)]()
[![Gemini](https://img.shields.io/badge/Gemini-8E75F5?style=for-the-badge&labelColor=1a1a2e&logo=googlegemini&logoColor=8E75F5)]()

</div>

---

## Quick Start

No build step, no dependencies. Serve with any HTTP server:

```bash
git clone https://github.com/TheShovel/infinite-os.git
cd infinite-os
python3 -m http.server 8080
```

---

## Features

**AI App Generation.** Describe any app in the launcher and Gemini generates a fully functional HTML application with a unique SVG icon, access to the OS API, and local persistence.

**Window Manager.** Drag, resize, minimize, maximize, and close windows with full desktop UX. Right-click the desktop for the context menu.

**10 Built-in Apps.** Calculator, Todo List, Note Pad, Paint, Clock, Weather, Chat, Radio, Tic-Tac-Toe, and a generic HTML sandbox.

**Desktop Widgets.** Add live, draggable widgets to the desktop that persist across sessions.

**Customization.** 18 accent colors, custom wallpaper with blur/dim controls, and a customizable desktop menu.

**File System.** LocalStorage-backed filesystem exposed to generated apps via `os.fs` (read, write, list, delete, etc.).

**OS API.** Generated apps get the full `window.os` API: windows, screen, system info, clipboard, dialogs, audio, location, date, shell, settings, and notifications.

---

## Architecture

```
infinite-os/
├── index.html      # Boot screen, desktop, taskbar, launcher
├── style.css       # Complete UI stylesheet
├── app.js          # Window manager, AI integration, settings, OS API
├── templates.js    # Built-in template app generators
├── LICENSE         # MIT license
└── README.md
```

Zero dependencies. Vanilla HTML, CSS, and JavaScript.


