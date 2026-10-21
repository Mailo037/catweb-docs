# CatWeb UI JSON Specification (v2.18.3.1)

## Overview

CatWeb is a Roblox game where players build 2D websites using JSON-based UI and a visual block-based scripting system. The user interface visually represents a web browser environment.

- **Current Version:** v2.18.3.1 (with Unlimited Update rollouts)  
- **TLD:** `.rbx` (CatWeb-specific, not real internet TLD)

---

## Output Contract & Hard Invariants

1. **Two Supported JSON Formats (Full Site Object vs. Component Snippet Array):**
   - **Full Site (JSON Object):** Contains `favicon`, `title`, `background`, and `webcontent` (array containing one or more root elements). Used for publishing/importing whole sites.
   - **Component / Snippet (Bare JSON Array):** Modular components, UI packs, or snippets do **NOT** require the wrapper object (`favicon`, `background`, `webcontent`). A bare JSON array `[ { ... }, { ... } ]` can be directly imported or shared.
2. **Multiple Root Elements Allowed:** Neither `webcontent` nor snippet arrays are restricted to a single root container. You can have multiple direct sibling elements at the root level separated by commas.
3. **Every scalar value is a quoted string:** No raw numbers, booleans, or nulls (`"font_size": "16"` or `"scaled"`, `"visible": "true"`, never raw numbers or booleans).
4. **No comments in JSON:** `//` or `/* */` break the importer completely. All JSON must be strictly valid.
5. **Hex colors keep `#`:** Always `"#1a1a1a"`, never `"1a1a1a"`. The one exception on elements is `UIGradient` stops, which drop it (§7).
6. **`globalid` format:** 2–3 printable ASCII characters, unique across the whole file (elements, script events and actions share one namespace). CatWeb itself generates IDs like `"~O"` or `"}L"`; when you write your own, letters and digits are safest (`"bt"`, `"e1"`).
7. **`alias` format:** Unique across the file, lowercase descriptive label (e.g. `navbar`, `hero_btn`, `statcard1`). Used in editor only; scripts resolve by `globalid`.
8. **Layout order key is `"order"`:** Never `"layout_order"`. Using `"layout_order"` throws a fatal `[INVALIDATED] default not found for property layout_order` import error.
9. **Always use `sort: "LayoutOrder"`:** When using `UIListLayout` or `UIGridLayout`, use `sort: "LayoutOrder"` and assign an integer `"order"` string to children. Avoid `sort: "Name"`.
10. **UI and scripts live in ONE file:** Scripts are elements with `"class": "script"` inside `webcontent` (or snippet array). Never split into separate files (globalids regenerate on import).
11. **Two separate vocabularies:** Never confuse JSON authoring keys (snake_case) with Script display names (Title Case).
12. **Only documented keys:** Each element may use the common properties (§5) plus its own class's keys (§6, §7). Anything else aborts the import (§5.1).
13. **No emoji or arrow glyphs in site text** (`✕`, `→`, `★`). Use an icon from [Assets.md](Assets.md) instead.
14. **Aim for under 500 elements per page** (§12). It isn't a hard limit, but bigger pages can be very slow or fail to load.

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
| `globalid` | string | 2–3 printable ASCII chars (`"bt"`, `"~O"`) | Required | Unique across the whole file; scripts reference elements by it |
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
| `attributes` | array | `[{"name":{"value":"1"},"value":{"value":"499"}}]` | None | Custom data scripts read and write (§5.2) |
| `mouse_icon` | string | Bare asset ID | None | Cursor while hovering, desktop only |

### 5.1 Unknown Keys Fail the Import

Any key not listed for that class (a typo, an invented key, or a key from another class) aborts the import with `[INVALIDATED] default not found for property <key>`.

- CSS-like names don't exist on elements: `padding`, `gap`, `margin`, `border-radius`, `clips`. Use the modifier children in §7.
- Text keys (`font`, `wrap`, `align_x` …) don't belong on a `Frame`, and modifiers take no `position`, `size` or `anchor`.
- `layout_order`, `cell_size` and `anchor_point` are the most common cases (§1).

### 5.2 Attributes

Any element can carry name/value pairs that scripts read and write with Set / Get attribute (`138` / `139`, see [JSONScript.md](JSONScript.md) §7.7). Use them for state, IDs or per-card settings so one handler can serve many elements:

```json
{
  "class": "Frame",
  "globalid": "pc",
  "alias": "pricecard",
  "size": "{0,240},{0,160}",
  "attributes": [
    {"name": {"value": "1"}, "value": {"value": "499"}},
    {"name": {"value": "2"}, "value": {"value": "pro"}}
  ]
}
```

Both name and value are strings. Name attributes with numbers, like variables, and leave `attributes` out when unused.

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
Never use a `Frame` for anything that looks clickable (nav items, tabs, chips, linking cards, toggles). A `Frame` can't respond to a click; use a `TextButton`.

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
*Note on `canvassize`:* Use `"auto_y"` so the scroll canvas automatically expands to fit stacked children. `"auto_x"` suits carousels, `"auto_xy"` is rare, and a UDim2 sets a fixed canvas. **Never bare `"auto"`.**

Other keys: `scrollbar_top_image_id`, `scrollbar_mid_image_id`, `scrollbar_bottom_image_id` (custom scrollbar art). Only use a `ScrollingFrame` when content really overflows a fixed-height area; for content that merely grows, a `Frame` with `size: "auto_y"` is enough.

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
*Rendering limits:* ~16,000–32,000 characters visible per element (exceeding causes `TEXT_OVERLOAD`; plan for ~20,000), 200,000 total characters per page.

- `text` supports `\n`. With `"rich": "true"` it also accepts `<b>`, `<i>` and `<font color="#4e9bff">`.
- **Values:** `font_size` a number string or `"scaled"` · `font_weight` `Thin` … `Heavy` · `font_style` `Normal` / `Italic` · `align_x` `Left` / `Center` / `Right` · `align_y` `Top` / `Center` / `Bottom` · `truncate` `AtEnd` / `None` / `SplitWord`.
- Use fixed pixel `font_size` by default. `"scaled"` is for text that must shrink to fit a container that resizes a lot; using it everywhere makes sizes unpredictable and flattens hierarchy.

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
`auto_color: "true"` darkens the button slightly on press, giving feedback without a script. Buttons drive `When pressed` (`1`), mouse enter / leave / down / up (`3` / `5` / `11` / `12`) and right click (`13`).

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
`href` is a CatWeb path (`"mysite.rbx/docs"`), optionally with a query string (`"mysite.rbx/docs?view=intro"`, read with action `67`). Use a plain `TextButton` + `Redirect to` (`4`) only when the destination depends on runtime logic.

### TextButton?transfer (Donation)
Button prompting a Roblox purchase (game pass, asset or developer product).
```json
{
  "class": "TextButton?transfer",
  "globalid": "dn",
  "alias": "donate_btn",
  "size": "{0,160},{0,40}",
  "position": "{0,0},{0,0}",
  "text": "Support the project",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#16a34a",
  "product": "123456789",
  "product_type": "Product",
  "thanks_href": "mysite.rbx/thanks"
}
```
- The class is `TextButton?transfer`, **never** `TextButton?donation` (the default label says "Donation", but that's its `text`).
- `product_type`: `"GamePass"` / `"Asset"` / `"Product"`. `thanks_href` is optional.
- Completion fires `When donation completed...` (`15`), which carries no object, so one handler can't tell which button fired.

> [!NOTE]
> Earlier versions of this page showed `robux_amount` / `transfer_id`. Those keys aren't in the current SiteGPT key list for this class; prefer `product` / `product_type` and test any other key in the game before relying on it.

### TextButton?avataritem
Button prompting an in-experience purchase of a Roblox avatar item (accessory, clothing, etc.). It takes the `TextButton` keys.
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
  "background_color": "#7c3aed"
}
```
Completion fires `When <avataritem> bought...` (`7`), which **does** carry the button as its object, so one handler can serve several buttons.

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
`text` is the live value and starts as `""`; the hint goes in `placeholder`. Read it with `Get text from` (`30`); Enter fires `When <input> submitted` (`8`). `multiline: "true"` makes a text area, and `editable: "false"` a read-only, copyable output field. Also accepts `rich`, `align_x`, `align_y`.

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

`image` (`rbxassetid://N`) and `image_id` (`N`) must name the **same** asset when you write them yourself. CatWeb's own exports sometimes contain two different IDs; if they disagree, `image_id` is the one to trust. `image_color` tints the image (the icon library is pure white so it tints cleanly), and a `UIAspectRatioConstraint` child keeps the natural ratio.

### ImageButton
Clickable image. Takes every `ImageLabel` key plus `auto_color`, and fires the same events as `TextButton`. Swap the image at runtime with `Set image` (`106`), e.g. for a menu / close toggle.
```json
{
  "class": "ImageButton",
  "globalid": "mt",
  "alias": "menu_toggle",
  "size": "{0,24},{0,24}",
  "position": "{0,0},{0,0}",
  "image_id": "84352806499655",
  "image": "rbxassetid://84352806499655",
  "image_color": "#ffffff",
  "scale_type": "Fit",
  "auto_color": "true",
  "background_transparency": "1"
}
```

### ImageButton?link
Image that navigates: `ImageButton` plus `href` and `new_tab`.
```json
{
  "class": "ImageButton?link",
  "globalid": "bl",
  "alias": "brand_logo",
  "size": "{0,28},{0,28}",
  "position": "{0,0},{0,0}",
  "image_id": "128490289676597",
  "image": "rbxassetid://128490289676597",
  "href": "mysite.rbx/home",
  "new_tab": "false",
  "image_color": "#ffffff",
  "scale_type": "Fit",
  "auto_color": "true",
  "background_transparency": "1"
}
```

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
A `Folder` takes only `globalid`, `alias` and `children`. It tidies the editor tree but can't lay anything out; use a `Frame` for grouping that affects layout. Never put styling modifiers directly inside a `Folder`.

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
> Styling elements must always be child elements of a visual element (e.g. inside `Frame`, `TextButton`, `ImageLabel`). They modify their parent. Never place them as siblings, at the root, or inside a `Folder`, and never give them `position`, `size` or `anchor`: a modifier carrying `position` aborts the import.

### UICorner
Rounds the parent element's corners.
```json
{
  "class": "UICorner",
  "globalid": "c1",
  "radius": "0,12"
}
```
*`radius`:* `"0,12"` = 12px radius; `"1,0"` = full pill / circle. A scale radius such as `"0.1,0"` grows with the parent, which suits parents that are themselves sized in scale.

**Per-corner radii:** `radius_top_left`, `radius_top_right`, `radius_bottom_left`, `radius_bottom_right` override the base `radius` for one corner each. A chat bubble with a sharp bottom-left corner:
```json
{
  "class": "UICorner",
  "globalid": "bc",
  "radius": "0,16",
  "radius_bottom_left": "0,0"
}
```
These keys exist only on `UICorner`.

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

### UIShadow
Drop shadow under the parent. Good for anything that floats (modals, dropdowns, a featured card).
```json
{
  "class": "UIShadow",
  "globalid": "sh",
  "shadow_color": "#000000",
  "shadow_transparency": "0.6",
  "shadow_offset": "{0,0},{0,4}",
  "shadow_spread": "{0,0},{0,0}",
  "blur_radius": "0,12",
  "z_index": "0"
}
```
`shadow_offset` and `shadow_spread` are UDim2, `blur_radius` is a UDim. Use pixel offsets. The validator accepts `UIShadow` (and checks `shadow_color` / `shadow_transparency`), but the Web Runner doesn't draw the shadow yet.

### UIGradient
Applies color and transparency gradients across the parent.
```json
{
  "class": "UIGradient",
  "globalid": "g1",
  "gradient_color": "[[0,\"3b82f6\"],[1,\"1d4ed8\"]]",
  "gradient_transparency": "[[0,0],[1,0]]",
  "rotation": "90",
  "gradient_offset": "0,0"
}
```
*Note:* `gradient_color` is a stringified array of `[position, "hex"]` stops (position `0`–`1`). CatWeb's editor writes the stops **without** `#`, and that's the form to use; the Web Runner accepts both. `rotation` is in degrees (`"90"` = top to bottom). Spend 2–3 gradients per page, not one on every surface.

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

`padding` is the gap **between** children, not inner padding (that's `UIPadding`). Use `horizontal_flex` on a horizontal layout and `vertical_flex` on a vertical one: `"Fill"` stretches children into the leftover space, `"SpaceBetween"` / `"SpaceAround"` / `"SpaceEvenly"` spread fixed-size children (nav bars, pricing tiers).

### UIFlexItem
Opts one child out of its parent `UIListLayout`'s flex distribution. It has no keys of its own and only means something inside a `UIListLayout`.
```json
{"class": "UIFlexItem", "globalid": "fx"}
```

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

Cells are uniform, so a grid suits card galleries; for rows of different heights use a `UIListLayout`.

### Constraints
- **`UIAspectRatioConstraint`:** `{"class": "UIAspectRatioConstraint", "globalid": "ar", "ratio": "1.777"}` (maintains aspect ratio, e.g. 16:9 = `1.777`).
- **`UISizeConstraint`:** `{"class": "UISizeConstraint", "globalid": "sc", "min_size": "200,100", "max_size": "800,600"}`. Values are `"x,y"` pixel pairs; `"inf"` means no limit.
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
- **Weight carries hierarchy too:** body Regular / Medium, headings Bold / SemiBold.

### Beyond Competent

The tokens give clean, correct pages. Three more levers, used deliberately:

1. **Commit to the concept.** Match palette and tone to the subject instead of a generic template with the name swapped in: an ocean site gets abyss blue / teal with an aqua accent, not a default grey dashboard.
2. **Add depth 2–3 times per page:** a `UIGradient` on the hero or one accent card, an accent-tinted surface behind a key stat, a `UIShadow` under something floating, or a glass panel ([Assets.md](Assets.md) Pattern 5).
3. **Add motion.** Tweens are cheap: hover lift / brighten on cards and buttons, a fade or slide-in on load ([JSONScript.md](JSONScript.md) §7.7).

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

Chips use `size: "auto"`, **never** a fixed `width`: a fixed width makes every chip the same size and the row overflows. Tabs use the same row, usually without the pill background and with an underline `Frame` under the active tab.

### Stacking Sections
Sections placed at the same position overlap. Put them in a parent `Frame` with a vertical `UIListLayout` (Recipe A), each at `position: "{0,0},{0,0}"` with its own `order`. The layout is the only source of vertical placement.

### Anchor Reference
`"0,0"` top-left (default) · `"0.5,0"` top-center · `"0.5,0.5"` center · `"1,0"` top-right · `"0,0.5"` / `"1,0.5"` left / right middle · `"0,1"` / `"0.5,1"` / `"1,1"` bottom.

---

## 10. Available Fonts

- `SourceSans` (default body font)
- `Gotham` (clean modern sans)
- `GothamBold` (standard heading font)
- `Roboto`
- `BuilderSans` / `BuilderSansBold`
- Any valid font asset from the Roblox Creator Store

For a custom font, put its numeric asset ID in `font`. `font_weight` and `font_style` work with any base font. `BuilderSansMedium` suits body and nav text.

---

## 11. Responsive Design

CatWeb is **always landscape**. Never design a stacked portrait layout; shrink or collapse elements as the width decreases.

- **Viewport polling:** on load, `Repeat forever` → `Wait` 0.05–0.2 s (shorter reacts faster but costs more) → `Get viewport size` (`84`) → below a threshold hide the nav items and show a menu button, above it restore → `end`. Resize with Set property `Size` (flat UDim2) and toggle with `Make visible` / `Make invisible`. [Assets.md](Assets.md) Pattern 4 is a complete example.
- **Sidebars:** make the sidebar its own `ScrollingFrame` (`canvassize: "auto_y"`) as a **sibling** of the main scroller, not nested inside it:
  ```
  Root Frame                     {1,0},{1,0}
    ├─ Sidebar ScrollingFrame    {0,240},{1,0}   z_index "10"
    └─ Main ScrollingFrame       {1,-240},{1,0}  position {0,240},{0,0}
  ```
  Combine with polling to shrink it to icons or hide it on narrow screens.
- **Binary swap:** two complete layouts as sibling `Frame`s, toggled by width. Simple, but doubles the element count.
- **Scale-only:** if every size and position uses scale, the layout degrades gracefully with no script at all.

---

## 12. Element Budget

**Keep every page under 500 elements.** This is a guideline, not a CatWeb limit: bigger pages still import, but can be very slow or fail to load. Only go over it when the page really needs that much, and say so.

- **Everything in `webcontent` counts:** visual elements, every modifier (`UICorner`, `UIStroke`, `UIPadding`, `UIListLayout` …), `Folder`s and `script` elements. Events and actions inside a script don't.
- **Plan the count before a big page.** A card with a corner, stroke, padding, layout, icon and two labels is 8 elements, so 30 cards is already 240.
- **To cut elements:** drop modifiers that change nothing (a `UIStroke` on a transparent frame, padding of 0), use one layout instead of nested wrappers, and split long content across pages with `TextButton?link`.
- **Repeated items:** build one hidden template and `Duplicate` (`49`) it from a script. Duplicates count toward the 2,000 runtime-object limit.

Separately, every site has one **cost limit** that elements, modifiers, events and actions all add to (see [CatDocs.md](CatDocs.md)). A site over it can be edited but not published.

---

## 13. Cross-References

- **Scripting & Block Logic:** See [JSONScript.md](JSONScript.md) for action shapes, event bindings, and scripting invariants.
- **Assets, Icons, Sounds & Patterns:** See [Assets.md](Assets.md) for verified Roblox icon IDs, sound IDs, interactive component templates, and the anti-filter string decoder.
- **Complete Reference:** See [CatDocs.md](CatDocs.md).