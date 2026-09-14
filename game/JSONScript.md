# CatWeb Script JSON Specification (v2.18.2.3)

## Overview

This document specifies the exact JSON schema and execution rules for CatWeb's visual block-scripting system.
Scripts in CatWeb are **not Lua or JavaScript** — they are represented entirely as JSON objects (`"class": "script"`) containing event triggers and sequential action blocks.

- **Current Version:** v2.18.2.3
- **Script Compilation:** Scripts are compiled at runtime for native execution speed without legacy interpreter throttling.

---

## 1. Output Contract & Hard Script Invariants

Breaking any of these rules causes either a fatal import error (`[INVALIDATED]`) or a silent publish failure:

1. **Scripts are elements in `webcontent`:** Always write `"class": "script"` as an element in `webcontent`. Never create a top-level root `"script"` key.
2. **UI and scripts live in ONE JSON file:** Never split scripts and UI into separate imports. Cross-references between scripts and elements rely on `globalid`, which regenerates upon separate import.
3. **Only confirmed action/event IDs:** Every action or event must use an ID from the authoritative table below (§7). Never invent or guess IDs.
4. **`text` is always an array:** Never emit a flat string for `text`. It must be an array alternating between literal strings and parameter objects:
   `"text": ["Set (1)", {"value":"1","t":"string","l":"variable"}, "to (val)", {"value":"val","t":"string","l":"any"}]`
5. **Control flow is FLAT (no nested `actions`):** Actions like `If` (`18`), `Repeat` (`22`), or `Repeat forever` (`23`) must **never** contain an `actions: [...]` property. Their body is a flat list of sibling actions in the event's `actions` array, terminated by `end` (`25`). Nesting `actions` inside a control action throws `[INVALIDATED SCRIPT CONTENT] invalid entry $actions detected`.
6. **Functions are top-level `content` entries:** `Define function` (`6`) is a top-level sibling of event blocks in the script's `content` array. Never nest a function inside an event's `actions`.
7. **Variable names should be numbers:** To prevent Roblox's text filter from moderating variable names into `######`, name variables with integers: `{1}`, `{2}`, `{3}` (global), `{o!1}` (object-scoped), `{l!1}` (local).
8. **Never bare numbers in `variable_overrides` (§4):** Bare numbers in function `variable_overrides` collide with numeric globals and block publishing. Avoid formal parameters and pass inputs through global variables.
9. **Object references use `globalid`:** Never use `alias` to reference elements in scripts. Always supply the exact 2–3 character `globalid` (or `"(parent)"`).
10. **`t` and `l` are FIXED per parameter slot (§5):** Do not infer parameter types from what the value looks like. Each action ID defines an exact `t` and `l` per slot.

---

## 2. Two Separate Vocabularies

When writing property manipulation actions (`31` Set Property, `39` Get Property, `88` Tween):

- **Script Display Names (Title Case):** Used inside script action parameters.
  - Examples: `"Background Color"`, `"Text Color"`, `"Thickness"`, `"Cell Size"`, `"Order"`, `"Text"`, `"Visible"`.
- **JSON Authoring Keys (snake_case):** Used on element definitions in `webcontent`.
  - Examples: `background_color`, `font_color`, `stroke_thickness`, `size`, `order`.

> [!CAUTION]
> Never use JSON authoring keys in scripts (`"background_color"` fails in script actions; use `"Background Color"`).

---

## 3. Script Node & Event Structure

### 3.1 Script Element Container
```json
{
  "class": "script",
  "globalid": "sc1",
  "alias": "main_logic",
  "enabled": "true",
  "content": [
    /* Top-level Event blocks and Function Definition blocks */
  ]
}
```

- **Limits:** Max 30 events per script, 120 actions per event, 3,600 actions per script total. Multiple scripts share global variables.

### 3.2 Event Block Shape
```json
{
  "id": "1",
  "text": ["When (btn)", {"value": "btn", "t": "object", "l": "button"}, "pressed..."],
  "globalid": "ev1",
  "x": "4900",
  "y": "4900",
  "width": "350",
  "actions": [
    /* Flat list of action blocks in execution order */
  ]
}
```

- `x`, `y`, `width` define visual positioning on the 9992×9992 canvas in the CatWeb editor.
- Events run concurrently. When triggered simultaneously, events positioned closer to the canvas center `(5000, 5000)` execute first.

---

## 4. Function Definition & Parameter Trap

A function is defined as a top-level block inside `content`:

```json
{
  "id": "6",
  "text": ["Define function (10)", {"value": "10", "t": "string", "l": "function"}],
  "globalid": "fn1",
  "x": "4900",
  "y": "5200",
  "width": "350",
  "actions": [
    /* function body reading global {70} */
    {
      "id": "115",
      "text": ["Return (0)", {"value": "0", "t": "string", "l": "any"}],
      "globalid": "ret1"
    }
  ]
}
```

> [!WARNING]
> **The Publish-Blocking Trap:**
> If you add `variable_overrides: [{"value": "1"}]` with numeric names, it creates an unresolvable collision between `{l!1}` and global `{1}`. The site imports fine, but **CatWeb refuses to publish**.
> 
> **Best Practice:** Omit `variable_overrides`. Pass function arguments by setting designated global variables (e.g. `{70}`, `{71}`) immediately before calling `87 Run function`, and read those globals inside the function.

---

## 5. The Parameter Slot Rule (`t` and `l`)

Every parameter object has a fixed shape determined by CatWeb's internal action schema:
`{"value": "...", "t": "<type>", "l": "<role>"}`

### 5.1 The Two Different "any" Shapes
Confusing these two causes fatal publishing failures:
- **Bare `{"t": "any"}` (No `l` key):**
  - Action `0` (Log)
  - Action `1` (Warn)
  - Action `2` (Error)
  - Action `31` (Set Property — value slot)
  - Action `88` (Tween — "to" value slot)
  - Action `34` (Set Cookie)
- **`{"t": "string", "l": "any"}` (Has `l: "any"`):**
  - Action `11` (Set Variable)
  - Action `55` (Set Table Entry)
  - Action `89` (Insert At Position)
  - Action `115` (Return Value)
  - Both operands of all comparison actions (`18`, `19`, `20`, `21`, `125`, `126`)

### 5.2 Critical Non-Obvious Parameter Slots
- **`20` vs `21` Direction:** Action `20` is *is greater than*, Action `21` is *is lower than*. Swapping them silently inverts logic.
- **`27` (Random Number):** The variable parameter takes `{"t": "string", "l": "var"}`, **not** `"l": "variable"`.
- **`4` (Redirect):** Uses `{"t": "string", "href": "true"}`, not an `"l"` key.
- **`30` (Get Text from Input):** Object parameter uses `{"t": "object", "l": "input"}`.
- **`106` (Set Image):** Uses `{"t": "id", "assetbrowser": "image"}`.
- **Comparisons (`18`–`21`, `125`, `126`):** Both operands are `{"t": "string", "l": "any"}`, even if comparing variables.

---

## 6. Variables & Scoping

| Scope | Syntax in Text | Format in Variable Slot | Description |
|---|---|---|---|
| **Global** | `{1}`, `{score}` | `"1"`, `"score"` | Accessible across all scripts on the page |
| **Object** | `{o!1}`, `{o!myVar}` | `"o!1"`, `"o!myVar"` | Scoped to the current script |
| **Local** | `{l!1}`, `{l!idx}` | `"l!1"`, `"l!idx"` | Scoped to current event or function execution |
| **Table Item** | `{table.entry}` | — | Reads property `entry` of table `table` |
| **Array Item** | `{arr.1}` | — | Reads 1-based index 1 of array `arr` |

> [!TIP]
> **Anti-Moderation Rule:** Always use pure numbers for variable names (`{1}`, `{2}`, `{10}`). Words like `{count}`, `{player}`, or `{admin}` can trigger Roblox's automated filter and turn into `{######}`.

---

## 7. Authoritative Block Reference

Transcribed directly from CatWeb's confirmed block-palette export (16 Events, 122 Actions).

### 7.1 Events (Top-Level in `content`)

| ID | Event | Exact `text` Array |
|---|---|---|
| `0` | When website loaded | `["When website loaded..."]` |
| `1` | When button pressed | `["When", {"value":"btn","t":"object","l":"button"}, "pressed..."]` |
| `2` | When key pressed | `["When", {"value":"key","t":"key"}, "pressed..."]` |
| `3` | When mouse enters | `["When mouse enters", {"value":"obj","t":"object"}, "..."]` |
| `5` | When mouse leaves | `["When mouse leaves", {"value":"obj","t":"object"}, "..."]` |
| `6` | Define function | `["Define function", {"value":"fn","t":"string","l":"function"}]` |
| `7` | When avatar item bought | `["When", {"value":"btn","t":"object","l":"avataritem"}, "bought..."]` |
| `8` | When input submitted | `["When", {"value":"inp","t":"object","l":"input"}, "submitted..."]` |
| `9` | When message received | `["When message received..."]` |
| `10` | When object changed | `["When", {"value":"obj","t":"object"}, "changed..."]` |
| `11` | When mouse down on | `["When mouse down on", {"value":"btn","t":"object","l":"button"}, "..."]` |
| `12` | When mouse up on | `["When mouse up on", {"value":"btn","t":"object","l":"button"}, "..."]` |
| `13` | When button right clicked | `["When", {"value":"btn","t":"object","l":"button"}, "right clicked..."]` |
| `14` | When cross-site message received | `["When cross-site message received..."]` |
| `15` | When donation completed | `["When donation completed..."]` |
| `16` | When any key pressed | `["When any key pressed..."]` |

### 7.2 Actions — Control Flow & Conditionals (Flat Siblings)

| ID | Action | Exact `text` Array |
|---|---|---|
| `18` | If equal | `["If", {"value":"a","t":"string","l":"any"}, "is equal to", {"value":"b","t":"string","l":"any"}]` |
| `19` | If not equal | `["If", {"value":"a","t":"string","l":"any"}, "is not equal to", {"value":"b","t":"string","l":"any"}]` |
| `20` | If greater than | `["If", {"value":"a","t":"string","l":"any"}, "is greater than", {"value":"b","t":"string","l":"any"}]` |
| `125` | If greater or equal | `["If", {"value":"a","t":"string","l":"any"}, "is greater or equal to", {"value":"b","t":"string","l":"any"}]` |
| `21` | If lower than | `["If", {"value":"a","t":"string","l":"any"}, "is lower than", {"value":"b","t":"string","l":"any"}]` |
| `126` | If lower or equal | `["If", {"value":"a","t":"string","l":"any"}, "is lower or equal to", {"value":"b","t":"string","l":"any"}]` |
| `37` | If contains | `["If", {"value":"str","t":"string"}, "contains", {"value":"sub","t":"string"}]` |
| `38` | If doesn't contain | `["If", {"value":"str","t":"string"}, "doesn't contain", {"value":"sub","t":"string"}]` |
| `92` | If exists | `["If", {"value":"1","t":"string","l":"variable"}, "exists"]` |
| `93` | If doesn't exist | `["If", {"value":"1","t":"string","l":"variable"}, "doesn't exist"]` |
| `44` | If AND | `["If", {"value":"1","t":"string","l":"variable"}, "AND", {"value":"2","t":"string","l":"variable"}]` |
| `45` | If OR | `["If", {"value":"1","t":"string","l":"variable"}, "OR", {"value":"2","t":"string","l":"variable"}]` |
| `46` | If NOR | `["If", {"value":"1","t":"string","l":"variable"}, "NOR", {"value":"2","t":"string","l":"variable"}]` |
| `47` | If XOR | `["If", {"value":"1","t":"string","l":"variable"}, "XOR", {"value":"2","t":"string","l":"variable"}]` |
| `79` | If left mouse down | `["If left mouse button down"]` |
| `80` | If middle mouse down | `["If middle mouse button down"]` |
| `81` | If right mouse down | `["If right mouse button down"]` |
| `82` | If key down | `["If", {"value":"key","t":"key"}, "down"]` |
| `108` | If dark theme | `["If dark theme enabled"]` |
| `103` | If is ancestor | `["If", {"value":"o1","t":"object"}, "is ancestor of", {"value":"o2","t":"object"}]` |
| `104` | If is child | `["If", {"value":"o1","t":"object"}, "is child of", {"value":"o2","t":"object"}]` |
| `105` | If is descendant | `["If", {"value":"o1","t":"object"}, "is descendant of", {"value":"o2","t":"object"}]` |
| `112` | else | `["else"]` |
| `25` | end | `["end"]` |
| `22` | Repeat n times | `["Repeat", {"value":"5","t":"number"}, "times"]` |
| `23` | Repeat forever | `["Repeat forever"]` |
| `24` | Break | `["Break"]` |

### 7.3 Actions — Logging & Timing

| ID | Action | Exact `text` Array |
|---|---|---|
| `0` | Log | `["Log", {"value":"msg","t":"any"}]` |
| `1` | Warn | `["Warn", {"value":"msg","t":"any"}]` |
| `2` | Error | `["Error", {"value":"msg","t":"any"}]` |
| `3` | Wait seconds | `["Wait", {"value":"1","t":"number"}, "seconds"]` |

### 7.4 Actions — Variables & Math

| ID | Action | Exact `text` Array |
|---|---|---|
| `11` | Set variable | `["Set", {"value":"1","t":"string","l":"variable"}, "to", {"value":"val","t":"string","l":"any"}]` |
| `96` | Delete variable | `["Delete", {"value":"1","t":"string","l":"variable"}]` |
| `12` | Increase by | `["Increase", {"value":"1","t":"string","l":"variable"}, "by", {"value":"1","t":"number"}]` |
| `13` | Decrease by | `["Decrease", {"value":"1","t":"string","l":"variable"}, "by", {"value":"1","t":"number"}]` |
| `14` | Multiply by | `["Multiply", {"value":"1","t":"string","l":"variable"}, "by", {"value":"2","t":"number"}]` |
| `15` | Divide by | `["Divide", {"value":"1","t":"string","l":"variable"}, "by", {"value":"2","t":"number"}]` |
| `40` | Raise to power | `["Raise", {"value":"1","t":"string","l":"variable"}, "to the power of", {"value":"2","t":"number"}]` |
| `41` | Modulo | `[{"value":"1","t":"string","l":"variable"}, "modulo", {"value":"2","t":"number"}]` |
| `16` | Round | `["Round", {"value":"1","t":"string","l":"variable"}]` |
| `17` | Floor | `["Floor", {"value":"1","t":"string","l":"variable"}]` |
| `78` | Ceil | `["Ceil", {"value":"1","t":"string","l":"variable"}]` |
| `27` | Random range | `["Set", {"value":"1","t":"string","l":"var"}, "to random", {"value":"1","t":"number","l":"n"}, "-", {"value":"10","t":"number","l":"n"}]` |
| `114` | Run math function | `["Run math function", {"value":"math.sin","t":"string","l":"function"}, {"value":[],"t":"tuple"}, "→", {"value":"1","t":"string","l":"variable"}]` |

### 7.5 Actions — Strings & Conversions

| ID | Action | Exact `text` Array |
|---|---|---|
| `42` | Substring | `["Sub", {"value":"1","t":"string","l":"variable"}, {"value":"1","t":"number","l":"start"}, "-", {"value":"5","t":"number","l":"end"}]` |
| `43` | Replace string | `["Replace", {"value":"old","t":"string"}, "in", {"value":"1","t":"string","l":"variable"}, "by", {"value":"new","t":"string"}]` |
| `48` | String length | `["Get length of", {"value":"str","t":"string"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `57` | Split string | `["Split", {"value":"str","t":"string"}, {"value":",","t":"string","l":"separator"}, "→", {"value":"tbl","t":"string","l":"table"}]` |
| `69` | Lowercase | `["Lower", {"value":"str","t":"string"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `70` | Uppercase | `["Upper", {"value":"str","t":"string"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `109` | Concatenate | `["Concatenate", {"value":"a","t":"string"}, "with", {"value":"b","t":"string"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `119` | Hex to RGB | `["Convert", {"value":"#ffffff","t":"string","l":"hex"}, "to RGB", "→", {"value":"1","t":"string","l":"variable"}]` |
| `121` | RGB to Hex | `["Convert RGB", {"value":"255,255,255","t":"string","l":"rgb"}, "to hex", "→", {"value":"1","t":"string","l":"variable"}]` |

### 7.6 Actions — Tables & Arrays

| ID | Action | Exact `text` Array |
|---|---|---|
| `54` | Create table | `["Create table", {"value":"tbl","t":"string","l":"table"}]` |
| `55` | Set entry (value) | `["Set entry", {"value":"key","t":"string","l":"entry"}, "of", {"value":"tbl","t":"string","l":"table"}, "to", {"value":"val","t":"string","l":"any"}]` |
| `66` | Set entry (object) | `["Set entry", {"value":"key","t":"string","l":"entry"}, "of", {"value":"tbl","t":"string","l":"table"}, "to", {"value":"obj","t":"object"}]` |
| `56` | Get entry | `["Get entry", {"value":"key","t":"string","l":"entry"}, "of", {"value":"tbl","t":"string","l":"table"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `90` | Delete entry | `["Delete entry", {"value":"key","t":"string","l":"entry"}, "of", {"value":"tbl","t":"string","l":"table"}]` |
| `89` | Insert at position | `["Insert", {"value":"val","t":"string","l":"any"}, "at position", {"value":"1","t":"number","l":"number?"}, "of", {"value":"arr","t":"string","l":"array"}]` |
| `91` | Remove at position | `["Remove entry at position", {"value":"1","t":"number","l":"number?"}, "of", {"value":"arr","t":"string","l":"array"}]` |
| `59` | Array length | `["Get length of", {"value":"arr","t":"string","l":"array"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `113` | Iterate through | `["Iterate through", {"value":"tbl","t":"string","l":"table"}, "({l!index},{l!value})"]` |
| `110` | Join array | `["Join", {"value":"arr","t":"string","l":"array"}, "using", {"value":",","t":"string","l":"string"}, "→", {"value":"1","t":"string","l":"variable"}]` |

### 7.7 Actions — Objects & Display

| ID | Action | Exact `text` Array |
|---|---|---|
| `8` | Make invisible | `["Make", {"value":"obj","t":"object"}, "invisible"]` |
| `9` | Make visible | `["Make", {"value":"obj","t":"object"}, "visible"]` |
| `10` | Set text | `["Set", {"value":"obj","t":"object"}, "text to", {"value":"Hello","t":"string"}]` |
| `30` | Get text from input | `["Get text from", {"value":"inp","t":"object","l":"input"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `31` | Set property | `["Set", {"value":"Background Color","t":"string","l":"property"}, "of", {"value":"obj","t":"object"}, "to", {"value":"#ff0000","t":"any"}]` |
| `39` | Get property | `["Get", {"value":"Text","t":"string","l":"property"}, "of", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `88` | Tween property | `["Tween", {"value":"Position","t":"string","l":"property"}, "of", {"value":"obj","t":"object"}, "to", {"value":"{0,0},{0,100}","t":"any"}, "-", {"value":"0.3","t":"number","l":"time"}, {"value":"Quad","t":"string","l":"style"}, {"value":"Out","t":"string","l":"direction"}]` |
| `106` | Set image | `["Set", {"value":"img","t":"object"}, "image to", {"value":"16944769468","t":"id","assetbrowser":"image"}]` |
| `49` | Duplicate object | `["Duplicate", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `50` | Delete object | `["Delete", {"value":"obj","t":"object"}]` |
| `58` | Parent object | `["Parent", {"value":"child","t":"object"}, "under", {"value":"parent","t":"object"}]` |

### 7.8 Actions — System & Environment

| ID | Action | Exact `text` Array |
|---|---|---|
| `4` | Redirect | `["Redirect to", {"value":"home.rbx","t":"string","href":"true"}]` |
| `32` | Broadcast page | `["Broadcast", {"value":"msg","t":"string"}, "across page"]` |
| `33` | Broadcast site | `["Broadcast", {"value":"msg","t":"string"}, "across site"]` |
| `84` | Get viewport size | `["Get viewport size", "→", {"value":"1","t":"string","l":"x"}, {"value":"2","t":"string","l":"y"}]` |
| `85` | Get cursor position | `["Get cursor position", "→", {"value":"1","t":"string","l":"x"}, {"value":"2","t":"string","l":"y"}]` |
| `117` | Get URL | `["Get URL", "→", {"value":"1","t":"string","l":"variable"}]` |
| `34` | Set cookie | `["Set cookie", {"value":"ck","t":"string","l":"cookie"}, "to", {"value":"val","t":"any"}]` |
| `36` | Get cookie | `["Get cookie", {"value":"ck","t":"string","l":"cookie"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `62` | Delete cookie | `["Delete cookie", {"value":"ck","t":"string","l":"cookie"}]` |

---

## 8. Complete Worked Examples

### 8.1 Button Click Counter with Boundary
```json
{
  "id": "1",
  "globalid": "e_btn",
  "x": "5000",
  "y": "5000",
  "width": "350",
  "text": ["When", {"value": "inc_btn", "t": "object", "l": "button"}, "pressed..."],
  "actions": [
    {
      "id": "93",
      "globalid": "chk_init",
      "text": ["If", {"value": "1", "t": "string", "l": "variable"}, "doesn't exist"]
    },
    {
      "id": "11",
      "globalid": "init_val",
      "text": ["Set", {"value": "1", "t": "string", "l": "variable"}, "to", {"value": "0", "t": "string", "l": "any"}]
    },
    {
      "id": "25",
      "globalid": "end_init",
      "text": ["end"]
    },
    {
      "id": "12",
      "globalid": "inc_val",
      "text": ["Increase", {"value": "1", "t": "string", "l": "variable"}, "by", {"value": "1", "t": "number"}]
    },
    {
      "id": "10",
      "globalid": "update_txt",
      "text": ["Set", {"value": "count_lbl", "t": "object"}, "text to", {"value": "Count: {1}", "t": "string"}]
    }
  ]
}
```

### 8.2 Math Function (`114`) Example
Calling `math.sin` with tuple parameter:
```json
{
  "id": "114",
  "globalid": "calc_sin",
  "text": [
    "Run math function",
    {"value": "sin", "t": "string", "l": "function"},
    {
      "value": [
        {"value": "1.57079", "t": "number", "l": "any"}
      ],
      "t": "tuple"
    },
    "→",
    {"value": "2", "t": "string", "l": "variable"}
  ]
}
```

---

## 9. Cross-References

- **UI Structure:** See [UIGPT.md](UIGPT.md).
- **Icons, Sound IDs & Component Templates:** See [Assets.md](Assets.md).
- **General Game Reference:** See [CatDocs.md](CatDocs.md).