---
name: catweb-development
description: >-
  Comprehensive guide, specification, and block reference for building 2D websites and visual block scripting in CatWeb (Roblox). Use whenever asked to create, edit, debug, convert, or script a CatWeb website or generate CatWeb JSON.
---

# CatWeb Development Skill (Roblox v2.18.2.3)

CatWeb is a Roblox game where players create 2D websites using a custom JSON-based UI layout schema and a visual block-based scripting system. Sites exist within an in-game simulated web browser (`.rbx` domain).

When the user asks for a website in the context of CatWeb, **NEVER** write HTML, CSS, or Lua/JavaScript. You must generate a single, strictly valid CatWeb site JSON object.

---

## 1. Output Contract & Hard Invariants (CRITICAL)

Breaking any of these rules causes immediate import rejection (`[INVALIDATED]`) or silent publish failure:

1. **Top-level full site is a JSON object:** Must contain `favicon`, `title`, `background`, and `webcontent` (array containing exactly one root element).
2. **Every scalar value is a quoted string:** Numbers, booleans, and nulls must be strings (`"font_size": "16"`, `"visible": "true"`, `"radius": "0,8"`). Never output raw numbers or raw booleans in properties.
3. **No JSON comments:** `//` and `/* */` break the parser. The output must be 100% valid JSON.
4. **Hex colors always keep `#`:** Always `"#1a1a1a"`, never `"1a1a1a"`.
5. **`globalid` format:** Exactly 2–3 alphanumeric characters (`[A-Za-z0-9]{2,3}`), strictly unique across the entire file (e.g. `"rt"`, `"nb"`, `"b1"`, `"sc1"`).
6. **`alias` format:** Unique, lowercase descriptive identifier (`"navbar"`, `"hero_btn"`, `"counter_lbl"`). Used for readability in the editor; scripts resolve via `globalid`.
7. **Layout order key is `"order"`:** NEVER `"layout_order"`. Writing `"layout_order"` throws a fatal `[INVALIDATED] default not found for property layout_order` import error.
8. **Always use `sort: "LayoutOrder"`:** When using `UIListLayout` or `UIGridLayout`, use `sort: "LayoutOrder"` and assign an integer `"order"` string to children (`"1"`, `"2"`, `"3"`). Avoid `sort: "Name"`.
9. **UI and scripts live in ONE JSON file:** Scripts are elements with `"class": "script"` inside `webcontent`. Never split scripts and UI into separate files (global IDs regenerate upon separate import).
10. **Two Separate Vocabularies:** Never confuse JSON authoring keys with Script display names:
    - **JSON Authoring Keys (snake_case):** Used directly on elements in `webcontent` (`background_color`, `font_color`, `stroke_thickness`, `size` for grid cells, `order`).
    - **Script Display Names (Title Case):** Used ONLY inside script action parameters (`"Background Color"`, `"Text Color"`, `"Thickness"`, `"Cell Size"`, `"Order"`, `"Text"`, `"Visible"`).
11. **Flat Control Flow in Scripts:** Control flow actions (`If` `18`, `Repeat` `22`, `Repeat forever` `23`) must **NEVER** contain a nested `actions: [...]` property. Their body consists of flat sibling actions in the event's `actions` array, terminated by `end` (`25`).

---

## 2. Top-Level Site Architecture

```json
{
  "favicon": "16944769468",
  "title": "My CatWeb Site",
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

### Page Root Architecture Patterns

#### Pattern A: Sites with Sticky Navbar (Standard / Recommended)
The root element is a non-scrolling `Frame` (`size: "{1,0},{1,0}"`). The navbar and body scroller are **direct siblings**:
```text
Root Frame {1,0},{1,0} (background_color: "#0f0f11")
  ├── Navbar Frame {1,0},{0,56} (z_index: "10", stays fixed at top)
  └── Body ScrollingFrame {1,0},{1,-56} (position: "{0,0},{0,56}", canvassize: "auto_y")
       └── Page Container Frame (size: "auto_y", width: "{1,0}", UIListLayout Vertical)
            ├── Hero Section
            ├── Content Section
            └── Footer
```
> [!CAUTION]
> Never nest the `ScrollingFrame` inside the navbar `Frame`! If nested, content will be clipped to the navbar's height.

#### Pattern B: Simple Single Scroller
For sites without fixed UI headers, the root element can be a single `ScrollingFrame` with `canvassize: "auto_y"`.

---

## 3. Layout & Positioning Fundamentals

### 3.1 Coordinate & Sizing Types
- **UDim2 Format:** `"{xScale,xOffset},{yScale,yOffset}"`
  - Scale (`0`–`1`): fraction of parent dimension (`1` = 100%, `0.5` = 50%).
  - Offset (pixels): pixel integer added to scale (`0,56` = 56px).
- **UDim Format:** `"scale,offset"` used by `radius`, `padding`, `width`, `height` (e.g. `"0,16"` = 16px).
- **Auto-Sizing:**
  - `"auto"`: Both axes shrink/expand to fit child content (ideal for buttons, chips, tags).
  - `"auto_y"` + `"width": "{1,0}"`: Height expands to fit content, width matches parent (sections, cards, lists).
  - `"auto_x"` + `"height": "{0,32}"`: Width expands to fit content, fixed height (pills, badges).

### 3.2 Centering Elements
CatWeb does **not** have an auto-margin or center property. To center horizontally:
- Set `position`: `"{0.5,0},{yScale,yOffset}"`
- Set `anchor`: `"0.5,0"` (or `"0.5,0.5"` for full 2D centering)

### 3.3 Canonical Inset & Padding Pattern
**Never** fake padding by manually offsetting `position` and shrinking `size`. Always attach a `UIPadding` modifier element to the container, and allow the child element to fill (`size: "{1,0},{1,0}"`).

---

## 4. UI Element Reference

### Visual Elements

#### `Frame`
Container element for grouping and visual surfaces:
```json
{
  "class": "Frame",
  "globalid": "f1",
  "alias": "card",
  "size": "{1,0},{0,120}",
  "position": "{0,0},{0,0}",
  "background_color": "#18181b",
  "background_transparency": "0",
  "order": "1",
  "children": []
}
```

#### `ScrollingFrame`
Scrollable container element:
```json
{
  "class": "ScrollingFrame",
  "globalid": "sf",
  "alias": "main_scroll",
  "size": "{1,0},{1,-56}",
  "position": "{0,0},{0,56}",
  "canvassize": "auto_y",
  "scrollbar_thickness": "6",
  "scrollbar_color": "#3f3f46",
  "scrollbar_transparency": "0",
  "background_transparency": "1",
  "children": []
}
```

#### `TextLabel`
Text display element:
```json
{
  "class": "TextLabel",
  "globalid": "tl",
  "alias": "heading",
  "size": "{1,0},{0,32}",
  "position": "{0,0},{0,0}",
  "text": "Hello World",
  "font": "GothamBold",
  "font_size": "24",
  "font_color": "#ffffff",
  "align_x": "Left",
  "align_y": "Center",
  "wrap": "true",
  "truncate": "AtEnd",
  "background_transparency": "1"
}
```
*Valid Fonts:* `"SourceSans"`, `"SourceSansBold"`, `"Gotham"`, `"GothamBold"`, `"GothamBlack"`, `"AmaticSC"`, `"ComicSans"`.
*Align X:* `"Left"`, `"Center"`, `"Right"`. *Align Y:* `"Top"`, `"Center"`, `"Bottom"`.

#### `TextButton`
Interactive clickable button:
```json
{
  "class": "TextButton",
  "globalid": "btn",
  "alias": "primary_btn",
  "size": "auto",
  "position": "{0,0},{0,0}",
  "text": "Click Me",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#2563eb",
  "auto_color": "true",
  "children": [
    { "class": "UIPadding", "globalid": "bp", "top": "0,10", "bottom": "0,10", "left": "0,20", "right": "0,20" },
    { "class": "UICorner", "globalid": "bc", "radius": "0,8" }
  ]
}
```

#### `TextButton?link` (Hyperlink)
Navigates to another CatWeb domain or subpage:
```json
{
  "class": "TextButton?link",
  "globalid": "lk",
  "alias": "nav_link",
  "size": "auto",
  "position": "{0,0},{0,0}",
  "text": "About Us",
  "font": "SourceSans",
  "font_size": "14",
  "font_color": "#60a5fa",
  "href": "about.rbx",
  "new_tab": "false",
  "background_transparency": "1"
}
```

#### `TextButton?transfer` (Donation)
Prompts a Robux donation to the site owner:
```json
{
  "class": "TextButton?transfer",
  "globalid": "dn",
  "alias": "donate_btn",
  "size": "{0,140},{0,38}",
  "text": "Donate 50 R$",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#16a34a",
  "robux_amount": "50",
  "transfer_id": "1"
}
```

#### `TextButton?avataritem`
Prompts in-game purchase of a Roblox catalog accessory/clothing:
```json
{
  "class": "TextButton?avataritem",
  "globalid": "ai",
  "alias": "buy_item",
  "size": "{0,140},{0,38}",
  "text": "Get Item",
  "font": "GothamBold",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#7c3aed",
  "product": "12345678"
}
```

#### `TextBox`
Interactive text input:
```json
{
  "class": "TextBox",
  "globalid": "tb",
  "alias": "user_input",
  "size": "{1,0},{0,40}",
  "position": "{0,0},{0,0}",
  "text": "",
  "placeholder": "Enter username...",
  "placeholder_color": "#71717a",
  "font": "SourceSans",
  "font_size": "14",
  "font_color": "#ffffff",
  "background_color": "#27272a",
  "editable": "true",
  "multiline": "false"
}
```

#### `ImageLabel`
Image display:
```json
{
  "class": "ImageLabel",
  "globalid": "im",
  "alias": "icon",
  "size": "{0,24},{0,24}",
  "position": "{0,0},{0,0}",
  "image_id": "76297972789266",
  "image": "rbxassetid://76297972789266",
  "image_color": "#ffffff",
  "scale_type": "Fit",
  "background_transparency": "1"
}
```
*`scale_type`:* `"Fit"`, `"Crop"`, `"Stretch"`, `"Tile"`, `"Slice"`.

#### `Folder`
Non-visual organizational container:
```json
{
  "class": "Folder",
  "globalid": "fd",
  "alias": "section_group",
  "children": []
}
```

---

### Styling Modifier Elements (Children of Visual Elements)

1. **`UICorner`:** Rounds corners.
   ```json
   { "class": "UICorner", "globalid": "c1", "radius": "0,8" }
   ```
2. **`UIStroke`:** Border / outline.
   ```json
   { "class": "UIStroke", "globalid": "s1", "stroke_color": "#27272a", "stroke_thickness": "1", "stroke_transparency": "0", "stroke_mode": "Border" }
   ```
3. **`UIPadding`:** Inner padding.
   ```json
   { "class": "UIPadding", "globalid": "p1", "top": "0,16", "bottom": "0,16", "left": "0,20", "right": "0,20" }
   ```
4. **`UIListLayout`:** Flexbox list layout.
   ```json
   {
     "class": "UIListLayout",
     "globalid": "ll",
     "direction": "Vertical",
     "padding": "0,12",
     "sort": "LayoutOrder",
     "alignment_horizontal": "Left",
     "alignment_vertical": "Top",
     "horizontal_flex": "None",
     "vertical_flex": "None"
   }
   ```
5. **`UIGridLayout`:** Grid layout. Note: cell size key is `"size"`!
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
6. **`UIGradient`:** Color gradient.
   ```json
   {
     "class": "UIGradient",
     "globalid": "g1",
     "gradient_color": "[[0,\"#3b82f6\"],[1,\"#1d4ed8\"]]",
     "gradient_transparency": "[[0,0],[1,0]]",
     "rotation": "90"
   }
   ```

---

## 5. JSONScript Block Scripting Engine

Scripts are elements placed inside `webcontent`:
```json
{
  "class": "script",
  "globalid": "sc1",
  "alias": "main_logic",
  "enabled": "true",
  "content": []
}
```

### 5.1 Event Block Structure
Events are top-level items inside `content`:
```json
{
  "id": "1",
  "text": ["When", {"value": "btn", "t": "object", "l": "button"}, "pressed..."],
  "globalid": "ev1",
  "x": "4900",
  "y": "4900",
  "width": "350",
  "actions": []
}
```

### 5.2 The Flat Control Flow Rule
Actions inside `actions` are executed sequentially.
> [!WARNING]
> Control flow blocks (`If` `18`, `Repeat` `22`, etc.) MUST NEVER have an `actions: [...]` property!
> All child actions must be **flat sibling elements** following the control block, terminated by an `end` block (`id: "25"`).

Example flat structure:
```json
"actions": [
  {
    "id": "18",
    "text": ["If", {"value": "{1}", "t": "string", "l": "any"}, "is equal to", {"value": "5", "t": "string", "l": "any"}],
    "globalid": "if1"
  },
  {
    "id": "31",
    "text": ["Set", {"value": "tl", "t": "object"}, "property", {"value": "Text", "t": "property"}, "to", {"value": "Reached 5!", "t": "any"}],
    "globalid": "st1"
  },
  {
    "id": "25",
    "text": ["end"],
    "globalid": "en1"
  }
]
```

### 5.3 Variable Scoping & Anti-Moderation
- **Anti-Moderation Rule:** ALWAYS use numbers for variable names: `{1}`, `{2}`, `{10}`. Words like `{score}` or `{name}` often get censored by Roblox into `{######}`.
- Global variable: `{1}` (accessible across scripts).
- Object variable: `{o!1}` (scoped to current script).
- Local variable: `{l!1}` (scoped to event/function).

### 5.4 Parameter Shape Rules (`t` and `l`)
- **Bare `{"t": "any"}` (No `l` property):**
  - Action `31` Set Property (value slot)
  - Action `88` Tween ("to" value slot)
  - Action `0` Log, `1` Warn, `2` Error, `34` Set Cookie
- **`{"t": "string", "l": "any"}` (Has `l: "any"`):**
  - Action `11` Set Variable
  - Action `12` Add to Variable
  - Both operands of all comparison actions (`18`, `19`, `20`, `21`, `125`, `126`)

### 5.5 High-Frequency Block Reference

#### Events
| ID | Event | Exact `text` Array |
|---|---|---|
| `0` | When website loaded | `["When website loaded..."]` |
| `1` | When button pressed | `["When", {"value":"btn","t":"object","l":"button"}, "pressed..."]` |
| `2` | When key pressed | `["When", {"value":"key","t":"key"}, "pressed..."]` |
| `3` | When mouse enters | `["When mouse enters", {"value":"obj","t":"object"}, "..."]` |
| `5` | When mouse leaves | `["When mouse leaves", {"value":"obj","t":"object"}, "..."]` |
| `6` | Define function | `["Define function", {"value":"10","t":"string","l":"function"}]` |
| `8` | When input submitted | `["When", {"value":"inp","t":"object","l":"input"}, "submitted..."]` |
| `15` | When donation completed | `["When donation completed..."]` |

#### Common Actions
| ID | Action | Exact `text` Array |
|---|---|---|
| `11` | Set Variable | `["Set", {"value":"1","t":"string","l":"variable"}, "to", {"value":"0","t":"string","l":"any"}]` |
| `12` | Add to Variable | `["Add", {"value":"1","t":"string","l":"any"}, "to", {"value":"1","t":"string","l":"variable"}]` |
| `31` | Set Property | `["Set", {"value":"obj","t":"object"}, "property", {"value":"Text","t":"property"}, "to", {"value":"Hello","t":"any"}]` |
| `39` | Get Property | `["Get property", {"value":"Text","t":"property"}, "of", {"value":"obj","t":"object"}, "into", {"value":"1","t":"string","l":"variable"}]` |
| `48` | Play Sound | `["Play sound", {"value":"6895079853","t":"id","assetbrowser":"sound"}]` |
| `88` | Tween Property | `["Tween", {"value":"obj","t":"object"}, "property", {"value":"Background Color","t":"property"}, "to", {"value":"#2563eb","t":"any"}, "duration", {"value":"0.3","t":"number"}, "easing", {"value":"Quad","t":"easing"}, "direction", {"value":"Out","t":"direction"}]` |
| `24` | Wait | `["Wait", {"value":"1","t":"number"}, "seconds"]` |
| `4` | Redirect | `["Redirect to", {"value":"other.rbx","t":"string","href":"true"}]` |
| `18` | If equal | `["If", {"value":"{1}","t":"string","l":"any"}, "is equal to", {"value":"10","t":"string","l":"any"}]` |
| `20` | If greater than | `["If", {"value":"{1}","t":"string","l":"any"}, "is greater than", {"value":"0","t":"string","l":"any"}]` |
| `21` | If lower than | `["If", {"value":"{1}","t":"string","l":"any"}, "is lower than", {"value":"10","t":"string","l":"any"}]` |
| `22` | Repeat (N times) | `["Repeat", {"value":"5","t":"number"}, "times"]` |
| `23` | Repeat forever | `["Repeat forever"]` |
| `25` | End (Closes If/Repeat) | `["end"]` |
| `87` | Run Function | `["Run function", {"value":"10","t":"string","l":"function"}]` |

---

## 6. Curated Asset Quick Reference

### High-Frequency Lucide Icons (Pure White, 256x256)
| Icon Name | Asset ID | Usage |
|---|---|---|
| `house` | `128490289676597` | Home / Navbar |
| `search` | `76297972789266` | Search bar |
| `user-round` | `117017076630548` | User profile |
| `settings` | `123045282429289` | Settings gear |
| `mail` | `114078871101444` | Contact / Messages |
| `star` | `73775766036081` | Ratings / Favorites |
| `heart` | `81821025513215` | Likes |
| `arrow-left` | `132053311021067` | Back button |
| `arrow-right` | `86341424256591` | Forward / CTA suffix |
| `plus` | `128762341789893` | Add / Create |
| `x` | `97241930499310` | Close modal / Dismiss |
| `bell` | `130734329855948` | Notifications |
| `check` | `99802726511524` | Success checkmark |
| `external-link` | `122444800533384` | Outbound link |
| `copy` | `130977740797889` | Copy clipboard |
| `lock` | `99601667182985` | Security / Locked |

### UI Audio Asset IDs
| Sound Name | Asset ID | Usage |
|---|---|---|
| `button_click` | `6895079853` | Standard button clicks |
| `switch_toggle` | `9114223170` | Toggle switch |
| `modal_open` | `9114221580` | Opening a dialog |
| `modal_close` | `9114221798` | Closing a dialog |
| `success_chime` | `9069609268` | Success feedback |
| `error_buzz` | `9069608937` | Validation / error |
| `notification_ding` | `9069609071` | Alerts / pings |

---

## 7. Pre-flight Validation Checklist

Before outputting any CatWeb JSON, verify all 10 checks:

1. [ ] Output is a single JSON object with `favicon`, `title`, `background`, and `webcontent`.
2. [ ] Every scalar value is a quoted string (`"font_size": "16"`, `"visible": "true"`).
3. [ ] No comments (`//` or `/* */`) anywhere.
4. [ ] All hex colors start with `#` (`"#ffffff"`).
5. [ ] Every `globalid` is 2–3 alphanumeric characters (`[A-Za-z0-9]{2,3}`) and strictly unique.
6. [ ] Layout order key is `"order"`, NEVER `"layout_order"`.
7. [ ] Grid layout cell size key is `"size"`, NEVER `"cell_size"`.
8. [ ] UI authoring properties are in `snake_case`, script property display names are in `Title Case`.
9. [ ] No control flow actions contain an `actions: [...]` property; all branches are flat siblings ending with `{"id":"25","text":["end"]}`.
10. [ ] Script variables use pure numbers (`{1}`, `{2}`) to prevent Roblox moderation filtering.
