# CatWeb UI JSON Specification (v2.15.0.3)

## Overview

CatWeb is a Roblox game where players create 2D websites using JSON-based UI definitions. This document covers the UI/visual structure specification. For scripting logic, see the CatDocs reference.

**Current Version:** v2.15.0.3  
**TLD:** `.rbx` (CatWeb-specific, not real internet TLD)

---

## Quick Start

### Basic Page Structure

```json
[
  {
    "class": "Frame",
    "globalid": "root_frame",
    "size": "{1,0},{1,0}",
    "background_color": "#1a1a1a",
    "children": [
      // All your UI elements go here
    ]
  }
]
```

**Critical Rules:**
- Root must be a JSON array
- Only ONE root element per page (typically a Frame)
- All other elements nest inside `children`
- **NEVER add comments to JSON** - they break parsing

---

## Core Concepts

### IDs & References

**globalid** (required)
- Internal unique identifier
- Used by scripts for object references (NOT alias)
- Can be any string (letters/numbers/symbols)
- **IMPORTANT:** When JSON is imported, globalids are regenerated
  - Always keep UI + scripts in ONE JSON file
  - Scripts reference objects via globalid internally

**alias** (optional)
- Human-readable name shown in explorer
- Safe to rename without breaking functionality
- Not used by scripts

### UDim2 Format

All position/size properties: `"{scaleX,offsetX},{scaleY,offsetY}"`

- **scale**: 0-1 (percentage of parent) - `0.5` = 50%
- **offset**: pixels - `20` = 20 pixels

**Examples:**
```
"{0.5,0},{0.5,0}"    - centered, 50% width/height
"{1,0},{1,0}"        - fills entire parent
"{0.9,-10},{0.8,20}" - 90% width - 10px, 80% height + 20px
```

**Best Practice:** Use scale for responsiveness, offset for fine-tuning

### Auto-Sizing

Dynamic sizing modes:
- `"auto"` - Both width and height fit content
- `"auto_x"` - Width fits content, height uses scale/offset
- `"auto_y"` - Height fits content, width uses scale/offset

```json
{
  "class": "TextLabel",
  "size": "auto_x",
  "height": "0, 32",
  "text": "Dynamic Width Label"
}
```

### Alternative Size Properties

```json
{
  "width": "0, 150",   // UDim format
  "height": "0, 32"    // UDim format
}
```

### Color Format

- Hex with/without `#`: `"#ff0000"` or `"ff0000"`
- RGB auto-converts: `"255,0,0"` → `"#ff0000"`

### Transparency

String from `"0"` (opaque) to `"1"` (invisible)

---

## Required Properties

Every element must have:

```json
{
  "class": "Frame",
  "globalid": "unique_id",
  "size": "{1,0},{1,0}",
  "children": []
}
```

---

## Common Properties

Apply to most visual elements (Frame, ScrollingFrame, TextLabel, TextButton, TextBox, ImageLabel, etc.):

```json
{
  "alias": "MyElement",
  "position": "{0,0},{0,0}",
  "anchor": "0.5,0.5",           // 0-1, "0.5,0.5" = center
  "background_color": "#ffffff",
  "background_transparency": "0",
  "visible": "true",
  "rotation": "45",              // degrees (string)
  "z_index": "1",                // layer order (higher = on top)
  "order": "1",                  // layout/rendering order
  "canvas": "true",              // canvas rendering mode
  "width": "0, 150",             // explicit width override
  "height": "0, 32"              // explicit height override
}
```

**Anchor Point Guide:**
- `"0,0"` = top-left
- `"0.5,0.5"` = center
- `"1,1"` = bottom-right

---

## Element Classes

### Frame
Basic container with only common properties.

```json
{
  "class": "Frame",
  "globalid": "container",
  "size": "{0.5,0},{0.5,0}",
  "background_color": "#2a2a2a",
  "children": []
}
```

---

### ScrollingFrame
Scrollable container.

```json
{
  "class": "ScrollingFrame",
  "globalid": "scroll",
  "canvassize": "{0,0},{2,0}",      // content size (can exceed frame)
  "scrollbar_thickness": "12",
  "scrollbar_color": "#4a4a4a",
  "scrollbar_transparency": "0"
}
```

---

### TextLabel
Non-interactive text display.

```json
{
  "class": "TextLabel",
  "globalid": "label",
  "text": "Hello World",
  "font": "GothamBold",             // Gotham, GothamBold, SourceSans, Roboto
  "font_size": "scaled",            // "scaled" or number ("24")
  "font_color": "#ffffff",
  "font_weight": "Medium",          // Regular, Medium, Bold
  "font_style": "Normal",           // Normal, Italic
  "font_transparency": "0",
  "align_x": "Center",              // Left, Center, Right
  "align_y": "Center",              // Top, Center, Bottom
  "line_height": "1",               // spacing multiplier ("1.5")
  "rich": "false",                  // rich text formatting
  "wrap": "true",                   // text wrapping
  "truncate": "AtEnd"               // AtEnd, None, SplitWord
}
```

**Rendering Limits:**
- Display: ~16,000-32,000 characters (exceeding = TEXT_OVERLOAD)
- Total: 200,000 characters max

---

### TextButton
Clickable button with text. Same as TextLabel plus:

```json
{
  "class": "TextButton",
  "auto_color": "true"  // automatic hover color change
}
```

---

### TextBox
User input field. Same as TextLabel plus:

```json
{
  "class": "TextBox",
  "placeholder": "Enter text...",
  "placeholder_color": "#888888",
  "editable": "true",
  "multiline": "false"
}
```

---

### ImageLabel
Displays images.

```json
{
  "class": "ImageLabel",
  "globalid": "img",
  "image_id": "16944769468",        // Roblox asset ID (numbers only)
  "image": "rbxassetid://16944769468",
  "image_transparency": "0",
  "image_color": "#ffffff",         // tint color
  "resample_mode": "Default",
  "scale_type": "Stretch"           // Crop, Fit, Slice, Stretch, Tile
}
```

**9-Slice Scaling:**

```json
{
  "scale_type": "Slice",
  "slice_center": "128, 128, 128, 128"  // left, top, right, bottom (pixels)
}
```

**Note:** Use `✨ Set image` action in scripts for automatic high-res loading

---

### TextButton?link
Button that opens URLs.

```json
{
  "class": "TextButton?link",
  "href": "example.rbx",
  "new_tab": "false"
}
```

---

### TextButton?donation
Button prompting Roblox purchases.

```json
{
  "class": "TextButton?donation",
  "product": "1506394485",
  "product_type": "GamePass",       // GamePass, Asset, Product
  "thanks_href": ""                 // optional redirect after purchase
}
```

---

### Folder
Invisible organizational container (not rendered).

```json
{
  "class": "Folder",
  "globalid": "components",
  "children": []
}
```

---

### script
Contains CatWeb scripting logic. See CatDocs for full scripting specification.

```json
{
  "class": "script",
  "alias": "MyScript",
  "globalid": "script_1",
  "enabled": "true",
  "content": [
    // Event objects with actions (see CatDocs)
  ]
}
```

**Script Object References:**
- Scripts reference objects via **globalid** (not alias)
- Use `(parent)` to reference script's parent element
- Recommended: Use `(parent)` over hardcoded globalids when possible

---

## Styling Elements

**CRITICAL:** Styling elements must be children of visual elements.

### UICorner
Rounds corners.

```json
{
  "class": "UICorner",
  "globalid": "corner",
  "radius": "0.1,0"  // "1,0" = circle, "0,12" = 12px radius
}
```

---

### UIStroke
Adds border/outline.

```json
{
  "class": "UIStroke",
  "globalid": "stroke",
  "stroke_color": "#000000",
  "stroke_thickness": "2",
  "stroke_transparency": "0",
  "stroke_mode": "Border",          // Border, Contextual
  "stroke_type": "Round"            // Round, Miter, Bevel
}
```

---

### UIGradient
Color gradient.

```json
{
  "class": "UIGradient",
  "globalid": "gradient",
  "gradient_color": "[[0,\"ff0000\"],[1,\"0000ff\"]]",
  "gradient_transparency": "[[0,0],[1,1]]",
  "rotation": "90",
  "gradient_offset": "0,0"
}
```

**Format:** `[[position, "color"], ...]` where position is 0-1

---

### UIPadding
Internal spacing.

```json
{
  "class": "UIPadding",
  "globalid": "padding",
  "top": "0,10",
  "left": "0,10",
  "right": "0,10",
  "bottom": "0,10"
}
```

---

### UIListLayout
Arranges children in list.

```json
{
  "class": "UIListLayout",
  "globalid": "list",
  "direction": "Vertical",          // Vertical, Horizontal
  "padding": "0,12",
  "alignment_horizontal": "Center",
  "alignment_vertical": "Top",
  "sort": "LayoutOrder",
  "wrap_list": "false"
}
```

---

### UIGridLayout
Arranges children in grid.

```json
{
  "class": "UIGridLayout",
  "globalid": "grid",
  "size": "{0.3,0},{0.3,0}",
  "padding": "0,10",
  "alignment_horizontal": "Center",
  "alignment_vertical": "Top",
  "sort": "LayoutOrder"
}
```

---

### UIAspectRatioConstraint
Maintains aspect ratio.

```json
{
  "class": "UIAspectRatioConstraint",
  "globalid": "aspect",
  "ratio": "1.77"  // 1 = 1:1, 1.77 = 16:9, 0.56 = 9:16
}
```

---

### UISizeConstraint
Limits element size.

```json
{
  "class": "UISizeConstraint",
  "globalid": "constraint",
  "min_size": "100,100",
  "max_size": "500,500"  // "inf" for unlimited
}
```

---

### UITextSizeConstraint
Limits text size scaling (text elements only).

```json
{
  "class": "UITextSizeConstraint",
  "globalid": "text_constraint",
  "min_text_size": "12",
  "max_text_size": "16"
}
```

---

## Limits & Constraints

- **Element limit:** 100 (free) / 200 (premium)
- **Root elements:** 1 per page
- **Text rendering:** ~16k-32k visible, 200k total
- **Runtime objects:** 1000 max (including script-created)
- **Variable storage:** 5MB total per page
- **Subdomains:** 3 (free) / 5 (premium)
- **Pages:** 15 (free) / 30 (premium)

---

## Best Practices for AI Generation

### DO ✓
- **Use scale-based sizing** for responsiveness
- **Keep UI + scripts in ONE JSON** to prevent globalid regeneration breaking references
- **Use meaningful aliases** for objects referenced in scripts
- **Use `(parent)` references** in scripts instead of hardcoding globalids when possible
- **Nest styling elements** properly inside visual elements
- **Test anchor points** - `"0.5,0.5"` for centering
- **Use Folders** to organize (don't count toward render but do toward limit)
- **Use `auto_x`/`auto_y`** for dynamic sizing
- **Add UITextSizeConstraint** with `font_size: "scaled"`

### DON'T ✗
- **NEVER add comments to JSON** - they break parsing
- **Don't use raw numbers/objects** for UDim2 - always strings
- **Don't put children in multiple root elements**
- **Don't nest layouts inside layouts**
- **Don't forget `#` in colors** (works without but be consistent)
- **Don't use 9-slice unnecessarily**

---

## Common Patterns

**Centering:**
```json
{
  "position": "{0.5,0},{0.5,0}",
  "anchor": "0.5,0.5",
  "size": "{0.5,0},{0.5,0}"
}
```

**Full-screen background:**
```json
{
  "position": "{0,0},{0,0}",
  "size": "{1,0},{1,0}",
  "z_index": "-1"
}
```

**Dynamic-width button:**
```json
{
  "class": "TextButton",
  "size": "auto_x",
  "height": "0, 32",
  "children": [
    {
      "class": "UIPadding",
      "globalid": "pad",
      "left": "0,16",
      "right": "0,16"
    }
  ]
}
```

---

## Available Fonts

- `Gotham` (regular)
- `GothamBold`
- `SourceSans` (default)
- `Roboto`
- All standard Roblox fonts

**Font Weights:** Regular, Medium, Bold  
**Font Styles:** Normal, Italic

---

## Quick Reference Table

| Property | Type | Range/Options | Default |
|----------|------|---------------|---------|
| position | string (UDim2) | Any | `"{0,0},{0,0}"` |
| size | string (UDim2) | Any, "auto", "auto_x", "auto_y" | Required |
| anchor | string | `"0-1,0-1"` | `"0,0"` |
| background_transparency | string | `"0"` - `"1"` | `"0"` |
| rotation | string | Any number | `"0"` |
| z_index | string (int) | Any integer | `"0"` |
| visible | string | `"true"` / `"false"` | `"true"` |
| font_size | string | `"scaled"` or number | `"scaled"` |
| align_x | string | Left, Center, Right | `"Center"` |
| align_y | string | Top, Center, Bottom | `"Center"` |
| wrap | string | `"true"` / `"false"` | `"true"` |

---

## Cross-References

- **For scripting logic:** See CatDocs (main reference document)
- **For script JSON structure:** See json-rulings.md (pairs with CatDocs)
- **For CatWeb game info:** Premium costs 119 Robux, Cookies gamepass 35 Robux (regional pricing may apply)

---

## Example: Complete Card Component

```json
[
  {
    "class": "Frame",
    "globalid": "root",
    "size": "{1,0},{1,0}",
    "background_color": "#000000",
    "children": [
      {
        "class": "Frame",
        "globalid": "card",
        "alias": "ProfileCard",
        "size": "{0.4,0},{0.6,0}",
        "position": "{0.5,0},{0.5,0}",
        "anchor": "0.5,0.5",
        "background_color": "#2a2a2a",
        "children": [
          {
            "class": "UICorner",
            "globalid": "corner",
            "radius": "0,16"
          },
          {
            "class": "ImageLabel",
            "globalid": "avatar",
            "alias": "Avatar",
            "size": "{0,120},{0,120}",
            "position": "{0.5,0},{0,30}",
            "anchor": "0.5,0",
            "image_id": "16944769468",
            "image": "rbxassetid://16944769468",
            "background_transparency": "1",
            "children": [
              {
                "class": "UICorner",
                "globalid": "avatar_corner",
                "radius": "1,0"
              }
            ]
          },
          {
            "class": "TextLabel",
            "globalid": "username",
            "alias": "Username",
            "size": "{0.8,0},{0,40}",
            "position": "{0.5,0},{0,170}",
            "anchor": "0.5,0",
            "background_transparency": "1",
            "text": "Username",
            "font": "GothamBold",
            "font_size": "24",
            "font_color": "#ffffff",
            "align_x": "Center",
            "align_y": "Center"
          }
        ]
      }
    ]
  }
]
```