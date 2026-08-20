# LUMA BOM Manager V3.40
This package is the JavaScript conversion of LUMA BOM Manager Version 3.40 (20.08.2026).

## Phone and tablet layout

At 1024 px and below, the fixed sidebar becomes a menu drawer opened from the header. Tabs scroll horizontally, input forms stack as space becomes limited, engineering tables retain their own horizontal scrolling, and buttons and dialogs use touch-friendly sizing. The desktop layout remains unchanged on wider screens.

## Workspace files

The workspace toolbar contains **New**, **Open**, **Rename**, and **Save** icon buttons. Hover over an icon to see its name. The current workspace name is shown beside the **WORKSPACE** heading, and new sessions start with the name **Sample**.

**Save** asks where to store the `.luma` workspace file when the browser supports the system file picker. Otherwise, it uses the browser's normal download behavior. Use **Open** to load that file later.

All file-producing actions—including Part Master Save, Excel exports, and high-resolution Tracker Sketch images—request a file or folder location when the browser supports native file pickers. Part Master Save uses that one system dialog for both the filename and location, with **Active Project Name Part Master.json** as the suggested filename. Browsers without that capability use their normal download behavior.

Unsaved changes are also stored as browser recovery data when the browser permits local storage. If local storage is restricted for local files, the app still works, but automatic recovery may not be available.

## Table editing

Double-click an editable table cell to enter edit mode. Part Master Material and Weight are editable there and are used as the read-only Material and Weight values in Project BOM. Mouse clicks inside the editor can reposition the text caret without closing the editor. Press **Enter** or click outside to save; press **Escape** to cancel.

## Excel export

**Active Project** creates one native `.xlsx` workbook for the active project and asks where to save it when supported by the browser.

**All Projects** lets you select multiple projects and asks for one destination folder for the separate `.xlsx` workbooks when supported. Otherwise, the files use the browser's normal multiple-download behavior.

## Analysis

The **Analysis** tab opens on a home page with six destinations: **Steel Structure Cost**, **Electrical Cost**, **Major Components Cost**, **Fasteners Cost**, **Total Project Cost**, and **Fastener Packaging**. Each destination has an icon-only Back button that returns to the Analysis home.

Steel Structure cost has two saved pricing modes: **Material Mode** uses unit weight and material price per kilogram, while **Part Mode** lets you register a separate unit price for every steel-structure BOM item. The Analysis home and Total Project Cost use the currently selected steel mode. Electrical, Major Components, and Fasteners use their own unit prices registered against current Project BOM items. Total Project Cost keeps different currencies separate.

Fastener Packaging creates installation kits for eight connection sections. It shows quantity per package, package count, and required quantity. Fastener contingency remains in the Project BOM and is not divided between installation packages.

## Temporary calculation note

PV Module Support Plate (`k001099` / `PLUSS00173BZ00`) is temporarily calculated as:

**PV Module Support Plate = Hat rail + Z rail**
