# CatWeb UI JSON Specification (v2.18.2.3)

## Overview

CatWeb is a Roblox game where players build 2D websites using JSON-based UI and a visual block-based scripting system. The user interface visually represents a web browser environment.

- **Current Version:** v2.18.2.3  
- **TLD:** `.rbx` (CatWeb-specific, not real internet TLD)

---

## Output Contract & Hard Invariants

1. **Two Supported JSON Formats (Full Site Object vs. Component Snippet Array):**
   - **Full Site (JSON Object):** Contains `favicon`, `title`, `background`, and `webcontent` (array containing one or more root elements). Used for publishing/importing whole sites.
   - **Component / Snippet (Bare JSON Array):** Modular components, UI packs, or snippets do **NOT** require the wrapper object (`favicon`, `background`, `webcontent`). A bare JSON array `[ { ... }, { ... } ]` can be directly imported or shared.
2. **Multiple Root Elements Allowed:** Neither `webcontent` nor snippet arrays are restricted to a single root container. You can have multiple direct sibling elements at the root level separated by commas.
3. **Every scalar value is a quoted string:** No raw numbers, booleans, or nulls (`"font_size": "16"` or `"scaled"`, `"visible": "true"`, never raw numbers or booleans).
4. **No comments in JSON:** `//` or `/* */` break the importer completely. All JSON must be strictly valid.
5. **Hex colors keep `#`:** Always `"#1a1a1a"`, never `"1a1a1a"`.
6. **`globalid` format:** 2–3 characters, strictly unique across the whole file. No spaces or quotes.
7. **`alias` format:** Unique across the file, lowercase descriptive label (e.g. `navbar`, `hero_btn`, `statcard1`). Used in editor only; scripts resolve by `globalid`.
8. **Layout order key is `"order"`:** Never `"layout_order"`. Using `"layout_order"` throws a fatal `[INVALIDATED] default not found for property layout_order` import error.
9. **Always use `sort: "LayoutOrder"`:** When using `UIListLayout` or `UIGridLayout`, use `sort: "LayoutOrder"` and assign an integer `"order"` string to children. Avoid `sort: "Name"`.
10. **UI and scripts live in ONE file:** Scripts are elements with `"class": "script"` inside `webcontent` (or snippet array). Never split into separate files (globalids regenerate on import).
11. **Two separate vocabularies:** Never confuse JSON authoring keys (snake_case) with Script display names (Title Case).

---

## 1. Two Separate Vocabularies (CRITICAL)

CatWeb has two independent naming systems that describe properties:

| Context | Style | Examples | Where Used |
|---|---|---|---|
| **JSON Authoring Keys** | snake_case | `background_color`, `font_color`, `stroke_thickness`, `size` (for grid cell size), `order` | Written directly on elements in `webcontent` |
| **Script Display Names** | Title Case | `Background Color`, `Text Color`, `Thickness`, `Cell Size`, `Order` | Used ONLY inside script action parameters (Get / Set / Tween) |

> [!WARNING]
> **NEVER derive one from the other:**
> - Writing `"cell_size"` in a `UIGridLayout` JSON throws fatal `[INVALIDATED] default not found for property cell_size` (the JSON key is `"size"`).
> - Writing `"layout_order"` in a child element throws fatal `[INVALIDATED] default not found for property layout_order` (the JSON key is `"order"`).
> - Writing `"background_color"` inside a script Set Property block fails at runtime (the script property name is `"Background Color"`).

---

## 2. Top-Level File Structure

### 2.1 Full Site Object
When exporting or importing a full website, the root is a JSON **object**:

```json
{
  "favicon": "16944769468",
  "title": "My Website",
  "background": "#0f0f11",
  "webcontent": [
    {
      "class": "Frame",
      "globalid": "rt",
      "alias": "root",
      "size": "{1,0},{1,0}",
      "position": "{0,0},{0,0}",
      "background_color": "#0f0f11",
      "children": []
    }
  ],
  "thumbnail_id": "16944769468",
  "thumbnail": "rbxassetid://16944769468"
}
```

| Key | Required | Description |
|---|---|---|
| `favicon` | Yes | Numeric Roblox asset ID (no prefix) |
| `title` | Yes | Page title shown in the tab |
| `background` | Yes | Fallback hex background color |
| `webcontent` | Yes | Array containing root elements (single container or multiple siblings) |
| `thumbnail_id` | No | Numeric asset ID for page thumbnail |
| `thumbnail` | No | Full `rbxassetid://` URI for page thumbnail |

### 2.2 Component / Snippet Array (Unwrapped Sibling Elements)
When sharing or importing a component, widget, or button pack without a full site, the root can simply be a JSON **array**. Multiple elements can exist completely unwrapped side-by-side in the array without any parent wrapper frame:

```json
[
  {
    "class": "Frame",
    "globalid": "5m",
    "background_color": "#c8c8c8",
    "size": "{0.1, 0},{0.1, 0}",
    "children": [
      {
        "class": "TextLabel",
        "globalid": "KR",
        "text": "Text",
        "font_size": "scaled",
        "rich": "false",
        "align_x": "Center",
        "align_y": "Center",
        "background_transparency": "1",
        "size": "{0.1, 0},{0.1, 0}",
        "children": []
      },
      {
        "class": "ScrollingFrame",
        "globalid": "~O",
        "canvassize": "{0, 0},{2, 0}",
        "background_color": "#c8c8c8",
        "size": "{0.1, 0},{0.1, 0}"
      }
    ]
  },
  {
    "class": "ImageLabel",
    "globalid": "db",
    "image_id": "107783162934966",
    "image": "rbxassetid://70877710889686",
    "size": "{0.1, 0},{0.1, 0}",
    "children": []
  },
  {
    "class": "ImageButton?link",
    "globalid": "d;",
    "image_id": "107783162934966",
    "image": "rbxassetid://70877710889686",
    "size": "{0.1, 0},{0.1, 0}"
  }
]
```

> [!NOTE]
> Scripts are placed inside `webcontent` (or the snippet array) as elements with `"class": "script"`, typically nested under a Frame or alongside sibling elements. A top-level root `"script"` key throws `[INVALIDATED] invalid property script`.

---

## 3. Page Root Architecture

### Pattern A: Sites with Sticky Navbar (Recommended)
The root element is a non-scrolling `Frame` (`size: "{1,0},{1,0}"`). The navbar and body scroller are **siblings**:

```
Root Frame {1,0},{1,0} (non-scrolling)
  ├── Navbar Frame {1,0},{0,56} (z_index: "10", stays fixed at top)
  └── Body ScrollingFrame {1,0},{1,-56} (position: "{0,0},{0,56}", canvassize: "auto_y")
       └── Page Container Frame (size: "auto_y", width: "{1,0}", UIListLayout Vertical)
            ├── Hero Section
            ├── Features Section
            └── Footer
```

> [!CAUTION]
> **Never nest the `ScrollingFrame` inside the navbar `Frame`!** If nested, content will be clipped to the navbar's 56px height.

### Pattern B: Simple Single Scroller
For sites without a sticky navbar, use one `ScrollingFrame` as the root element with `canvassize: "auto_y"`.

---

## 4. Layout & Positioning Fundamentals

### 4.1 UDim2 Format
Position and Size use the UDim2 string format: `"{xScale,xOffset},{yScale,yOffset}"`
- **Scale (0–1):** Percentage of parent container (`1` = 100%, `0.5` = 50%).
- **Offset (pixels):** Exact pixel values added to scale (`0, 56` = 56px).

Single-axis UDim (used by `radius`, `padding`, `width`, `height`): `"scale,offset"` (e.g. `"0,16"` = 16px, `"1,0"` = 100%).

### 4.2 Auto-Sizing
| Sizing Value | Behavior | Common Use Cases |
|---|---|---|
| `"auto"` | Both axes adjust to fit content | Buttons, badges, chips, tags |
| `"auto_y"` + `"width": "{1,0}"` | Height expands with content, width fixed | Sections, cards, stacked lists |
| `"auto_x"` + `"height": "{0,32}"` | Width expands with content, height fixed | Pill tags, tab buttons |

### 4.3 Centering Fixed-Width Blocks
CatWeb does **not** have an auto-center property. A fixed-width container inside a full-width parent will hug the left edge by default.
To center horizontally:
- Set `position` x to `0.5`: `"position": "{0.5,0},{yScale,yOffset}"`
- Set `anchor` x to `0.5`: `"anchor": "0.5,0"` (or `"0.5,0.5"` for full center)

### 4.4 Canonical Inset & Padding Pattern
**Never** fake padding by offsetting `position` and shrinking `size`. Always attach a `UIPadding` child to the container, and allow the child element to fill (`size: "{1,0},{1,0}"`):

```json
{
  "class": "Frame",
  "globalid": "bx",
  "alias": "card_box",
  "size": "{1,0},{0,80}",
  "position": "{0,0},{0,0}",
  "background_color": "#1f1f23",
  "children": [
    {
      "class": "UIPadding",
      "globalid": "pd",
      "left": "0,20",
      "right": "0,20",
      "top": "0,16",
      "bottom": "0,16"
    },
    {
      "class": "TextLabel",
      "globalid": "tx",
      "alias": "card_text",
      "size": "{1,0},{1,0}",
      "position": "{0,0},{0,0}",
      "text": "Card Content",
      "font": "SourceSans",
      "font_size": "16",
      "font_color": "#ffffff",
      "align_x": "Left",
      "align_y": "Center",
      "background_transparency": "1"
    }
  ]
}
```

---

## 5. Common Properties

Properties supported across visual elements:

| Property | Type | Range / Format | Default | Notes |
|---|---|---|---|---|
| `class` | string | Element class name | Required | See Section 6 |
| `globalid` | string | `[A-Za-z0-9]{2,3}` | Required | Unique identifier for scripts |
| `alias` | string | Lowercase string | Optional | Human-readable editor label |
| `position` | string | UDim2 `"{xS,xO},{yS,yO}"` | `"{0,0},{0,0}"` | Element position |
| `size` | string | UDim2 / `"auto"` / `"auto_x"` / `"auto_y"` | Required | Element size |
| `width` | string | UDim `"scale,offset"` | None | Used alongside `auto_y` |
| `height` | string | UDim `"scale,offset"` | None | Used alongside `auto_x` |
| `anchor` | string | `"x,y"` (0 to 1) | `"0,0"` | `"0.5,0.5"` = center |
| `background_color` | string | Hex code `"#rrggbb"` | `"#ffffff"` | Keep leading `#` |
| `background_transparency` | string | `"0"` (opaque) to `"1"` (invisible) | `"0"` | Decimal string |
| `visible` | string | `"true"` / `"false"` | `"true"` | Controls visibility |
| `rotation` | string | Degrees string (`"0"`–`"360"`) | `"0"` | Rotation angle |
| `z_index` | string | Integer string | `"1"` | Higher renders on top |
| `order` | string | Integer string | None | Layout order for UIListLayout |
| `tooltip` | string | Text string | None | Displayed on hover |
| `children` | array | Array of child element objects | `[]` | Nested children |

---

## 6. Element Classes

### Frame
Generic 2D container element.
```json
{
  "class": "Frame",
  "globalid": "f1",
  "alias": "container",
  "size": "{1,0},{0,200}",
  "position": "{0,0},{0,0}",
  "background_color": "#18181b",
  "background_transparency": "0",
  "children": []
}
```

### ScrollingFrame
Scrollable container element.
```json
{
  "class": "ScrollingFrame",
  "globalid": "sf",
  "alias": "scroller",
  "size": "{1,0},{1,0}",
  "position": "{0,0},{0,0}",
  "canvassize": "auto_y",
  "scrollbar_thickness": "8",
  "scrollbar_color": "#3f3f46",
  "scrollbar_transparency": "0",
  "background_transparency": "1",
  "children": []
}
```
*Note on `canvassize`:* Use `"auto_y"` so the scroll canvas automatically expands to fit stacked children.

### TextLabel
Text display element.
```json
{
  "class": "TextLabel",
  "globalid": "tl",
  "alias": "heading",
  "size": "{1,0},{0,32}",
  "position": "{0,0},{0,0}",
  "text": "Welcome to CatWeb",
  "font": "GothamBold",
  "font_size": "24",
  "font_color": "#f4f4f5",
  "font_weight": "Bold",
  "font_style": "Normal",
  "font_transparency": "0",
  "align_x": "Left",
  "align_y": "Center",
  "line_height": "1",
  "wrap": "true",
  "truncate": "AtEnd",
  "background_transparency": "1"
}
```
*Rendering limits:* ~16,000–32,000 characters visible per element (exceeding causes `TEXT_OVERLOAD`), 200,000 total characters per page.

### TextButton
Clickable button element with text. Supports all `TextLabel` properties plus:
```json
{
  "class": "TextButton",
  "globalid": "bt",
  "alias": "cta_button",
  "size": "auto",
  "position": "{0,0},{0,0}",
  "text": "Click Here",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#2563eb",
  "auto_color": "true",
  "children": [
    {
      "class": "UIPadding",
      "globalid": "bp",
      "top": "0,10",
      "bottom": "0,10",
      "left": "0,20",
      "right": "0,20"
    },
    {
      "class": "UICorner",
      "globalid": "bc",
      "radius": "0,8"
    }
  ]
}
```

### TextButton?link
Hyperlink button opening a `.rbx` URL.
```json
{
  "class": "TextButton?link",
  "globalid": "lk",
  "alias": "nav_link",
  "size": "auto",
  "position": "{0,0},{0,0}",
  "text": "Documentation",
  "font": "SourceSans",
  "font_size": "14",
  "font_color": "#93c5fd",
  "href": "docs.rbx",
  "new_tab": "false",
  "background_transparency": "1"
}
```

### TextButton?transfer (Donation)
Button prompting a Robux transfer/donation to the site owner.
```json
{
  "class": "TextButton?transfer",
  "globalid": "dn",
  "alias": "donate_btn",
  "size": "{0,160},{0,40}",
  "position": "{0,0},{0,0}",
  "text": "Donate 50 R$",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#16a34a",
  "robux_amount": "50",
  "transfer_id": "1"
}
```

### TextButton?avataritem
Button prompting an in-experience purchase of a Roblox avatar item (accessory, clothing, etc.).
```json
{
  "class": "TextButton?avataritem",
  "globalid": "ai",
  "alias": "buy_item_btn",
  "size": "{0,160},{0,40}",
  "position": "{0,0},{0,0}",
  "text": "Get Item",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#7c3aed",
  "product": "12345678"
}
```

### TextBox
Interactive text input field.
```json
{
  "class": "TextBox",
  "globalid": "tb",
  "alias": "search_input",
  "size": "{1,0},{0,40}",
  "position": "{0,0},{0,0}",
  "text": "",
  "placeholder": "Type search query...",
  "placeholder_color": "#71717a",
  "font": "SourceSans",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#27272a",
  "editable": "true",
  "multiline": "false"
}
```

### ImageLabel
Image display element.
```json
{
  "class": "ImageLabel",
  "globalid": "im",
  "alias": "hero_banner",
  "size": "{1,0},{0,240}",
  "position": "{0,0},{0,0}",
  "image_id": "16944769468",
  "image": "rbxassetid://16944769468",
  "image_color": "#ffffff",
  "image_transparency": "0",
  "scale_type": "Fit",
  "background_transparency": "1"
}
```
*Scaling modes:* `"Fit"`, `"Crop"`, `"Stretch"`, `"Tile"`, `"Slice"`. For UI icons, refer to the verified icon table in `game/Assets.md`.

### Folder
Organizational container that has no visual representation and takes no layout space.
```json
{
  "class": "Folder",
  "globalid": "fd",
  "alias": "component_group",
  "children": []
}
```

### script
Contains block-based scripts. Must be an element in `webcontent`. See `game/JSONScript.md` for full scripting specifications.
```json
{
  "class": "script",
  "globalid": "s1",
  "alias": "page_controller",
  "enabled": "true",
  "content": []
}
```

---

## 7. Styling Modifier Elements

> [!IMPORTANT]
> Styling elements must always be child elements of a visual element (e.g. inside `Frame`, `TextButton`, `ImageLabel`). They modify their parent.

### UICorner
Rounds the parent element's corners.
```json
{
  "class": "UICorner",
  "globalid": "c1",
  "radius": "0,12"
}
```
*`radius`:* `"0,12"` = 12px radius; `"1,0"` = full pill / circle.

### UIStroke
Adds a border or outline to the parent.
```json
{
  "class": "UIStroke",
  "globalid": "s1",
  "stroke_color": "#3f3f46",
  "stroke_thickness": "1",
  "stroke_transparency": "0",
  "stroke_mode": "Border"
}
```
*`stroke_mode`:* `"Border"` (outer) or `"Contextual"`.

### UIGradient
Applies color and transparency gradients across the parent.
```json
{
  "class": "UIGradient",
  "globalid": "g1",
  "gradient_color": "[[0,\"#3b82f6\"],[1,\"#1d4ed8\"]]",
  "gradient_transparency": "[[0,0],[1,0]]",
  "rotation": "90",
  "gradient_offset": "0,0"
}
```
*Note:* Every hex color inside `gradient_color` must keep its `#`.

### UIPadding
Defines inner margins / padding for the parent element.
```json
{
  "class": "UIPadding",
  "globalid": "p1",
  "top": "0,16",
  "bottom": "0,16",
  "left": "0,24",
  "right": "0,24"
}
```

### UIListLayout (Flexbox & Lists)
Lays out children in a row or column with spacing and flex controls.
```json
{
  "class": "UIListLayout",
  "globalid": "ll",
  "direction": "Vertical",
  "padding": "0,16",
  "sort": "LayoutOrder",
  "alignment_horizontal": "Left",
  "alignment_vertical": "Top",
  "vertical_flex": "None",
  "horizontal_flex": "None",
  "wrap_list": "false"
}
```

| Key | Values | Description |
|---|---|---|
| `direction` | `"Vertical"`, `"Horizontal"` | Layout flow axis |
| `padding` | UDim string (e.g. `"0,16"`) | Gap between child items in pixels |
| `sort` | `"LayoutOrder"` | Orders children by their integer `"order"` property |
| `alignment_horizontal` | `"Left"`, `"Center"`, `"Right"` | Cross/main alignment |
| `alignment_vertical` | `"Top"`, `"Center"`, `"Bottom"` | Cross/main alignment |
| `horizontal_flex` | `"None"`, `"Fill"`, `"SpaceAround"`, `"SpaceBetween"`, `"SpaceEvenly"` | Flex distribution along horizontal axis |
| `vertical_flex` | `"None"`, `"Fill"`, `"SpaceAround"`, `"SpaceBetween"`, `"SpaceEvenly"` | Flex distribution along vertical axis |
| `wrap_list` | `"true"`, `"false"` | Wraps overflowing horizontal children to a new line (ideal for chips/tags) |

### UIGridLayout
Arranges children in a grid.
```json
{
  "class": "UIGridLayout",
  "globalid": "gl",
  "size": "{0,180},{0,120}",
  "padding": "0,16",
  "sort": "LayoutOrder",
  "alignment_horizontal": "Center",
  "alignment_vertical": "Top"
}
```
> [!IMPORTANT]
> The cell size JSON key is `"size"`, **not** `"cell_size"`.

### Constraints
- **`UIAspectRatioConstraint`:** `{"class": "UIAspectRatioConstraint", "globalid": "ar", "ratio": "1.777"}` (maintains aspect ratio, e.g. 16:9 = `1.777`).
- **`UISizeConstraint`:** `{"class": "UISizeConstraint", "globalid": "sc", "min_size": "200,100", "max_size": "800,600"}`.
- **`UITextSizeConstraint`:** `{"class": "UITextSizeConstraint", "globalid": "tc", "min_text_size": "12", "max_text_size": "28"}`.

---

## 8. Design Tokens (Visual Polish Guide)

Ad-hoc sizes and spacing create visually weak pages. Use this consistent scale:

- **Spacing & Padding (px):** `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`.
- **Corner Radii (px):** `6`–`8` buttons/inputs, `12`–`16` cards/panels, `1,0` pill/circle tags.
- **Typography Scale:**
  - `11`–`12`: Caption, badge, small metadata
  - `13`–`15`: Body text, navigation links, table cells (Regular / Medium)
  - `16`–`18`: Card titles, subheadings (SemiBold / Bold)
  - `20`–`24`: Section headers, modal titles (Bold)
  - `28`–`36`: Hero headlines, prominent stat numbers (Bold)
- **Surfaces & Borders:** Always add a 1px `UIStroke` one step lighter than the background on dark cards. Two adjacent surfaces without border separation blend together into an unreadable block.

---

## 9. Common Layout Recipes

### Recipe A: Stacked Page Sections
```json
{
  "class": "Frame",
  "globalid": "pc",
  "alias": "page_container",
  "size": "auto_y",
  "width": "{1,0}",
  "position": "{0,0},{0,0}",
  "background_transparency": "1",
  "children": [
    {
      "class": "UIListLayout",
      "globalid": "pl",
      "direction": "Vertical",
      "padding": "0,32",
      "sort": "LayoutOrder"
    },
    {
      "class": "Frame",
      "globalid": "s1",
      "alias": "hero_section",
      "order": "1",
      "size": "auto_y",
      "width": "{1,0}",
      "position": "{0,0},{0,0}",
      "background_color": "#111827",
      "children": []
    },
    {
      "class": "Frame",
      "globalid": "s2",
      "alias": "features_section",
      "order": "2",
      "size": "auto_y",
      "width": "{1,0}",
      "position": "{0,0},{0,0}",
      "background_color": "#1f2937",
      "children": []
    }
  ]
}
```

### Recipe B: Horizontal Wrapping Chips / Tags
```json
{
  "class": "Frame",
  "globalid": "cr",
  "alias": "chip_row",
  "size": "auto_y",
  "width": "{1,0}",
  "position": "{0,0},{0,0}",
  "background_transparency": "1",
  "children": [
    {
      "class": "UIListLayout",
      "globalid": "cl",
      "direction": "Horizontal",
      "padding": "0,8",
      "sort": "LayoutOrder",
      "wrap_list": "true"
    },
    {
      "class": "TextButton",
      "globalid": "c1",
      "alias": "chip_1",
      "order": "1",
      "size": "auto",
      "position": "{0,0},{0,0}",
      "text": "Technology",
      "font": "SourceSans",
      "font_size": "12",
      "font_color": "#e4e4e7",
      "background_color": "#27272a",
      "children": [
        { "class": "UIPadding", "globalid": "cp1", "top": "0,6", "bottom": "0,6", "left": "0,12", "right": "0,12" },
        { "class": "UICorner", "globalid": "cc1", "radius": "1,0" }
      ]
    }
  ]
}
```

---

## 10. Available Fonts

- `SourceSans` (default body font)
- `Gotham` (clean modern sans)
- `GothamBold` (standard heading font)
- `Roboto`
- `BuilderSans` / `BuilderSansBold`
- Any valid font asset from the Roblox Creator Store

---

## 11. Cross-References

- **Scripting & Block Logic:** See [JSONScript.md](JSONScript.md) for action shapes, event bindings, and scripting invariants.
- **Assets, Icons, Sounds & Patterns:** See [Assets.md](Assets.md) for verified Roblox icon IDs, sound IDs, interactive component templates, and the anti-filter string decoder.
- **Complete Reference:** See [CatDocs.md](CatDocs.md).