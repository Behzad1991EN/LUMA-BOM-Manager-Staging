# LUMA BOM Manager V3.11 — Browser-based App

This package is the browser-based JavaScript conversion of LUMA BOM Manager Version 3.11 (27.07.2026).

## How to open the app

1. Extract the complete ZIP folder.
2. Keep all files together in the same folder.
3. Double-click **LUMA_BOM_Manager_V3.11.html**.
4. The app opens in your default browser. Chrome, Edge, Safari, and other modern browsers can be used.

No Python installation, terminal command, localhost server, or internet connection is required.

## Important files

- `LUMA_BOM_Manager_V3.11.html` — recommended file for users to open.
- `index.html` — equivalent browser entry file.
- `style.css` — user-interface styling.
- `data.js` — internal Part Master data.
- `engine.js` — engineering and BOM calculation logic.
- `app.js` — browser interface, workspace/project management, sketch, and export behavior.
- `xlsx-lite.js` — local native `.xlsx` workbook generator.
- `KSI-Logo.png` — application logo.

## Workspace files

**Save** and **Save As** download a `.luma` workspace file. Use **Open** to load that file later.

A browser is not allowed to silently overwrite an arbitrary file on the computer. Therefore, unlike the Windows desktop app, Save creates a browser download rather than writing directly back to the original file path.

Unsaved changes are also stored as browser recovery data when the browser permits local storage. If local storage is restricted for local files, the app still works, but automatic recovery may not be available.

## Excel export

**Active Project** creates one native `.xlsx` workbook for the active project.

The workbook follows the V3.11 Windows application structure with these worksheets:

1. Project Summary
2. Inputs
3. Custom Bearing Rules
4. Selected Arrays
5. Project BOM

**All Projects** lets you select multiple projects and downloads one separate `.xlsx` workbook per selected project. Your browser may ask for permission to allow multiple downloads.

## Tracker sketch

The Tracker Sketch tab follows the V3.11 application logic and can save a 3600 × 2100 PNG image with 300 DPI metadata.

## Editing

For development, open the complete folder in Visual Studio Code. Keep the file names and relative file locations unchanged unless you also update the references in the HTML file.
