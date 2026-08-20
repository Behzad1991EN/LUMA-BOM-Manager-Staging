# LUMA BOM Manager V3.30
This package is the JavaScript conversion of LUMA BOM Manager Version 3.30 (19.08.2026).
## Workspace files

The workspace toolbar contains **New**, **Open**, **Rename**, and **Save** icon buttons. Hover over an icon to see its name. The current workspace name is shown beside the **WORKSPACE** heading, and new sessions start with the name **Sample**.

**Save** asks where to store the `.luma` workspace file when the browser supports the system file picker. Otherwise, it uses the browser's normal download behavior. Use **Open** to load that file later.

All file-producing actions—including Part Master Save As, Excel exports, and high-resolution Tracker Sketch images—request a file or folder location when the browser supports native file pickers. Browsers without that capability use their normal download behavior.

Unsaved changes are also stored as browser recovery data when the browser permits local storage. If local storage is restricted for local files, the app still works, but automatic recovery may not be available.

## Table editing

Double-click an editable table cell to enter edit mode. Mouse clicks inside the editor can reposition the text caret without closing the editor. Press **Enter** or click outside to save; press **Escape** to cancel.

## Excel export

**Active Project** creates one native `.xlsx` workbook for the active project and asks where to save it when supported by the browser.

**All Projects** lets you select multiple projects and asks for one destination folder for the separate `.xlsx` workbooks when supported. Otherwise, the files use the browser's normal multiple-download behavior.

## Analysis

The **Analysis** tab opens on a home page with six destinations: **Steel Structure Cost**, **Electrical Cost**, **Major Components Cost**, **Fasteners Cost**, **Total Project Cost**, and **Fastener Packaging**. Each destination has an icon-only Back button that returns to the Analysis home.

Steel Structure cost uses material price per kilogram. Electrical, Major Components, and Fasteners use unit prices registered against current Project BOM items. Total Project Cost combines the calculated categories while keeping different currencies separate.

Fastener Packaging creates installation kits for eight connection sections. It shows quantity per package, package count, and required quantity. Fastener contingency remains in the Project BOM and is not divided between installation packages.

## Temporary calculation note

PV Module Support Plate (`k001099` / `PLUSS00173BZ00`) is temporarily calculated as:

**PV Module Support Plate = Hat rail + Z rail**
