# CatWeb Script JSON Specification (v2.18.3.1)

## Overview

This document specifies the exact JSON schema and execution rules for CatWeb's visual block-scripting system.
Scripts in CatWeb are **not Lua or JavaScript** — they are represented entirely as JSON objects (`"class": "script"`) containing event triggers and sequential action blocks.

- **Current Version:** v2.18.3.1 (with Unlimited Update rollouts)
- **Script Compilation:** Scripts are compiled at runtime for native execution speed without legacy interpreter throttling.
- **Runtime Object Limit:** 2,000 objects (created dynamically by scripts).

---

## 1. Output Contract & Hard Script Invariants

Breaking any of these rules causes either a fatal import error (`[INVALIDATED]`) or a silent publish failure:

1. **Scripts are elements in `webcontent`:** Always write `"class": "script"` as an element in `webcontent`. Never create a top-level root `"script"` key.
2. **UI and scripts live in ONE JSON file:** Never split scripts and UI into separate imports. Cross-references between scripts and elements rely on `globalid`, which regenerates upon separate import.
3. **Only confirmed action/event IDs:** Every action or event must use an ID from the authoritative table below (§7). Never invent or guess IDs.
4. **`text` is always an array:** Never emit a flat string for `text`. It must be an array alternating between literal strings and parameter objects:
   `"text": ["Set (1)", {"value":"1","t":"string","l":"variable"}, "to (val)", {"value":"val","t":"string","l":"any"}]`
   The `(1)` / `(val)` suffixes are optional editor annotations (§3.4).
5. **Control flow is FLAT (no nested `actions`):** Actions like `If` (`18`), `Repeat` (`22`), or `Repeat forever` (`23`) must **never** contain an `actions: [...]` property. Their body is a flat list of sibling actions in the event's `actions` array, terminated by `end` (`25`). Nesting `actions` inside a control action throws `[INVALIDATED SCRIPT CONTENT] invalid entry $actions detected`.
6. **Functions are top-level `content` entries:** `Define function` (`6`) is a top-level sibling of event blocks in the script's `content` array. Never nest a function inside an event's `actions`.
7. **Variable names should be numbers:** To prevent Roblox's text filter from moderating variable names into `######`, name variables with integers: `{1}`, `{2}`, `{3}` (global), `{o!1}` (object-scoped), `{l!1}` (local).
8. **Never bare numbers in `variable_overrides` (§4):** Bare numbers in function `variable_overrides` collide with numeric globals and block publishing. Avoid formal parameters and pass inputs through global variables.
9. **Object references use `globalid`:** Never use `alias` to reference elements in scripts. Always supply the exact 2–3 character `globalid` (or `"(parent)"`).
   Events and actions need a `globalid` too, with the same format: 2–3 printable ASCII characters (`"e1"`, `"a7"`, `"~O"`). Descriptive IDs like `"btn_click"` fail validation.
10. **`t` and `l` are FIXED per parameter slot (§5):** Do not infer parameter types from what the value looks like. Each action ID defines an exact `t` and `l` per slot.
11. **`Set property` accepts empty `<any>`:** As of v2.18.3.1, Action `31` accepts an empty value in the `<any>` parameter slot.
12. **Page property validation:** Setting, getting, or tweening a property on Page strictly errors if the property does not exist on Page (`Title`, `Icon`).
13. **Control-flow blocks are never top-level:** `If`, `Repeat`, `Repeat forever` and `Iterate` are actions. As a top-level `content` entry they throw `[INVALIDATED SCRIPT CONTENT] ID missing or invalid in event`; put them inside an event (usually `When website loaded`).
14. **Parameter objects carry only `value`, `t`, `l`, and (where §7 shows them) `assetbrowser` / `href`.** An invented key such as `t2` imports but blocks publishing with `invalid entry $t2 detected`.
15. **Every event and function block needs `x`, `y` and `width`.**

---

## 2. Two Separate Vocabularies

When writing property manipulation actions (`31` Set Property, `39` Get Property, `88` Tween):

- **Script Display Names (Title Case):** Used inside script action parameters.
  - Examples: `"Background Color"`, `"Text Color"`, `"Thickness"`, `"Cell Size"`, `"Order"`, `"Text"`, `"Visible"`, `"Mouse Icon"`.
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

- **Limits:** Up to **90 events per script** (tripled from 30) and **360 actions per event** (tripled from 120), allowing up to 32,400 total actions per script under the Unlimited Update. Dynamic runtime objects are capped at **2,000 objects**. Multiple scripts share global variables.

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

### 3.3 How a Script Runs (Execution Model)

Read this once; it explains most "why doesn't my script work" questions.

1. **An event fires** (page load, click, key, …). Every event block with that ID (and, for `When <button> pressed`, that button) starts a run.
2. **Actions run top to bottom** in the event's flat `actions` list.
3. **Blocks that open a body** — every `If …` (18–21, 37, 38, 44–47, 79–82, 92, 93, 103–105, 108, 125, 126), `Repeat` (22), `Repeat forever` (23) and `Iterate` (113) — run everything up to their matching `end` (25). Bodies can nest; each opener needs its own `end`.
4. **`else` (112)** sits between an `If` and its `end`. The part before `else` runs when the condition is true, the part after it when it is false.
5. **`Break` (24)** leaves the innermost loop. **`Return` (115)** leaves the function (or ends the event). **`Error` (2)** logs and ends the current event only.
6. **`Wait` (3)** pauses this run; other events keep running. A `Repeat forever` needs a `Wait` inside, or it freezes the page.
7. **`{…}` in a text field is replaced by a variable's value** (`"Count: {1}"`). Slots marked `<variable>` / `<table>` take the bare name (`"1"`, not `"{1}"`).

```
When website loaded
├─ Set {1} to 0
├─ Repeat 3 times          ← opener
│   ├─ Increase {1} by 1
│   └─ If {1} is equal to 2 ← nested opener
│       └─ Log "two"
│      end                 ← closes the If
│  end                     ← closes the Repeat
└─ Log "done: {1}"         → "done: 3"
```

A value set inside a loop in one event may not exist yet when another event first reads it. Guard the read with `If <var> exists` (`92`) or a short `Wait`.

### 3.4 The `()` Annotation Convention

You may append a copy of a parameter's value in parentheses to the literal segment **directly before** it, e.g. `"is equal to (10)"`. It only makes the block readable in the editor; the importer ignores it.

- Never change `value`, `t` or `l` for an annotation. Removing every annotation must give the bare block.
- Keep the real connective words: `"is equal to (10)"`, never `"== (10)"`.
- **Never add a new segment** for an annotation. A parameter that directly follows another parameter (Tween style/direction, the Split separator, a tuple) gets none.
- Mirror the `value` exactly; for a variable, show its name.

```json
{"id":"18","globalid":"a1","text":["If ({40})",{"value":"{40}","t":"string","l":"any"},"is equal to (10)",{"value":"10","t":"string","l":"any"}]}
```

The bare form (`"If"`, `"is equal to"`) is equally valid and is what the examples in this file use.

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
      "globalid": "r1"
    }
  ]
}
```

> [!WARNING]
> **The Publish-Blocking Trap:**
> If you add `variable_overrides: [{"value": "1"}]` with numeric names, it creates an unresolvable collision between `{l!1}` and global `{1}`. The site imports fine, but **CatWeb refuses to publish**.
> 
> **Best Practice:** Omit `variable_overrides`. Pass function arguments by setting designated global variables (e.g. `{70}`, `{71}`) immediately before calling `132 Run function` (or the deprecated `87`, see §7.9), and read those globals inside the function.
>
> Word-named parameters (`{"value":"el"}`) don't block publishing, but they break the numeric-variable rule (§6). The decoder's `d`/`e` functions in [Assets.md](Assets.md) use a numeric parameter; they are copied verbatim and are not a model to follow.

- A function name must not collide with a variable name: a function called `70` while `{70}` holds a table is a real clash.

---

## 5. The Parameter Slot Rule (`t` and `l`)

Every parameter object has a fixed shape determined by CatWeb's internal action schema:
`{"value": "...", "t": "<type>", "l": "<role>"}`

### 5.1 The Three Different "any" Shapes
Confusing these imports fine and then fails to publish:
- **Bare `{"t": "any"}` (No `l` key):**
  - Action `0` (Log)
  - Action `1` (Warn)
  - Action `2` (Error)
  - Action `31` (Set Property — value slot)
  - Action `88` (Tween — "to" value slot)
  - Action `94` (Set Audio Property — value slot)
  - Action `34` (Set Cookie)
- **`{"t": "string", "l": "any"}` (Has `l: "any"`):**
  - Action `11` (Set Variable)
  - Action `55` (Set Table Entry)
  - Action `89` (Insert At Position)
  - Action `115` (Return Value)
  - Both operands of all comparison actions (`18`, `19`, `20`, `21`, `125`, `126`)
- **`{"t": "any", "l": "any?"}`:**
  - Action `138` (Set Attribute — value slot) only

### 5.2 Critical Non-Obvious Parameter Slots
- **`20` vs `21` Direction:** Action `20` is *is greater than*, Action `21` is *is lower than*. Swapping them silently inverts logic.
- **`27` (Random Number):** The variable parameter takes `{"t": "string", "l": "var"}`, **not** `"l": "variable"`.
- **`4` (Redirect):** Uses `{"t": "string", "href": "true"}`, not an `"l"` key.
- **`30` (Get Text from Input):** Object parameter uses `{"t": "object", "l": "input"}`.
- **`106` (Set Image):** Uses `{"t": "id", "assetbrowser": "image"}`.
- **Comparisons (`18`–`21`, `125`, `126`):** Both operands are `{"t": "string", "l": "any"}`, even if comparing variables.
- **`44`–`47` (AND / OR / NOR / XOR):** Both operands are `{"t": "string", "l": "variable"}`, even though they hold booleans.
- **`127` (Get objects at position):** x and y are `{"t": "string"}` with `l` `x` / `y`, not `t: "number"`.
- **`135` (Set mouse icon):** The id slot is `{"t": "id", "assetbrowser": "image", "l": "id?"}`.
- **`114` (Run math function):** No literal segment between the function name and the tuple, and the output is **required** (`l: "variable"`, no `?`).
- **A slot holding a variable reference is usually *not* `l: "variable"`.** Copy each slot's `t`/`l` from §7 for that exact action `id`; never infer it from what the value looks like.

---

## 6. Variables & Scoping

| Scope | Syntax in Text | Format in Variable Slot | Description |
|---|---|---|---|
| **Global** | `{1}`, `{score}` | `"1"`, `"score"` | Accessible across all scripts on the page |
| **Object** | `{o!1}`, `{o!myVar}` | `"o!1"`, `"o!myVar"` | Scoped to the current script |
| **Local** | `{l!1}`, `{l!idx}` | `"l!1"`, `"l!idx"` | Scoped to current event or function execution |
| **Table Item** | `{table.entry}` | — | Reads property `entry` of table `table` |
| **Array Item** | `{arr.1}` | — | Reads 1-based index 1 of array `arr` |

### 6.1 Dynamically Duplicated Object Variables
When duplicating UI elements via Action `49` (`Duplicate <object> → <variable>`), the duplicated element's reference is returned into the designated variable (e.g. `"1"` or `"o!clone"`).

To manipulate or target the duplicated object in subsequent actions (such as `Set property`, `Tween property`, or `Parent object`), pass the variable in the `<object>` slot with curly braces:
- Example: `{"value": "{1}", "t": "object"}`
- Scoped Example: `{"value": "{o!clone}", "t": "object"}`

The validator and runtime recognize these variable patterns and do not require the variable name to be a pre-declared static element `globalid`.

> [!NOTE]
> Older guides report that in the game an object slot needs **double** braces to dereference a variable (`{"value":"{{l!2}}","t":"object"}`), and that single braces leave `<object>` empty and fail with `Argument #1 missing or null`. The Web Runner resolves the single-brace form. If a duplicated object doesn't resolve in game, try the double-brace form.

> [!TIP]
> **Anti-Moderation Rule:** Always use pure numbers for variable names (`{1}`, `{2}`, `{10}`). Words like `{count}`, `{player}`, or `{admin}` can trigger Roblox's automated filter and turn into `{######}`.

### 6.2 Scope Pitfalls & Numbering

- **`{o!N}` is private to its script element**, even though it "sounds" wider than local. Two different `script` elements never see each other's `o!` variables. If two scripts need a value, use a global `{N}`.
- **Pick a numbering scheme and stick to it**, e.g. state in the low tens, colours in the 210s, temporaries in the 70s–120s.
- Exceptions to numeric names: the built-in `{l!index}` / `{l!value}` from `Iterate through`, event values such as `{messageContent}`, and the decoder in [Assets.md](Assets.md).
- Math actions (`12`–`17`, `40`, `41`, `78`) change the variable in place. Everything resets on page load except cookies.
- Setting index `1` on a table permanently turns it into an array.

### 6.3 Repeated Literals & Hex Colours

- **Store repeated literals once.** A string or colour used 3+ times in scripts (accent colours, tween style) should be set once on load into a numeric variable and read as `{N}`. Recommended from 2 uses.
- **Where `#` goes:**
  - Element properties keep it: `"background_color": "#111827"`.
  - `UIGradient` stops drop it: `"[[0,\"4e9bff\"],[1,\"7274e0\"]]"` (see [UIGPT.md](UIGPT.md)).
  - Script values may drop it: Set property, Tween targets and stored colours accept `"ffffff"` as well as `"#ffffff"`. Storing the bare hex in a numeric variable is the safest form, since inline literals are filter-prone.

### 6.4 Runtime Pitfalls

- **Initialise a variable before using it as a table key.** `Get entry` on a missing key leaves the target variable **unset**, so a later `If {v} exists` guard on that same variable can't help. `Set {v} to 0` before the read.
- **Keep `Wait` outside `If` guards inside `Repeat forever`.** If the only `Wait` sits in a branch that stops running, the loop spins without yielding and surfaces as a stack overflow.
- **Cap runtime object creation.** `Duplicate` in an endless loop hits the 2,000 runtime-object limit.
- **Duplicates keep their events.** A handler bound inside a template also fires for its duplicates.

---

## 7. Authoritative Block Reference

Transcribed directly from CatWeb's confirmed block-palette export (16 events, 131 actions). The literal words between slots are fixed text; only the slot objects (`t`, `l`, `assetbrowser`, `href`) are checked, so copy those exactly.

> [!IMPORTANT]
> **Web Runner coverage.** `tools/validate.js` accepts every ID in this section. IDs marked **†** aren't simulated by the Web Runner: it skips them with a note in the Console. They import and run in the game, so test pages that depend on them in CatWeb itself.

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
| `114` | Run math function | `["Run math function", {"value":"sin","t":"string","l":"function"}, {"value":[],"t":"tuple"}, "→", {"value":"1","t":"string","l":"variable"}]` |

> [!NOTE]
> **Action `12`:** the bundled sample sites (and older exports) write it as `["Add", {"value":"1","t":"string","l":"any"}, "to", {"value":"1","t":"string","l":"variable"}]` — amount first, variable second. The palette export above is `Increase <variable> by <number>`. The Web Runner accepts both; when in doubt, use the table shape.
>
> **Action `114`:** `<function>` is a Luau `math` function name such as `sin`, `floor` or `max` (the runner also accepts `math.sin`). `pi` and `huge` return the constant and ignore the tuple.

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
| `107` † | Set avatar image | `["Set", {"value":"img","t":"object"}, "image to avatar of", {"value":"1","t":"number","l":"userid"}, {"value":"","t":"string","l":"resolution?"}]` |
| `127` † | Get objects at position | `["Get objects at position", {"value":"100","t":"string","l":"x"}, {"value":"200","t":"string","l":"y"}, "→", {"value":"1","t":"string","l":"array"}]` |
| `129` † | Get asset info | `["Get", {"value":"Name","t":"string","l":"info"}, "of asset", {"value":"16944769468","t":"string","l":"id"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `138` † | Set attribute | `["Set", {"value":"1","t":"string","l":"attribute"}, "of", {"value":"obj","t":"object"}, "to", {"value":"val","t":"any","l":"any?"}]` |
| `139` † | Get attribute | `["Get", {"value":"1","t":"string","l":"attribute"}, "of", {"value":"obj","t":"object"}, "→", {"value":"2","t":"string","l":"variable"}]` |

> [!NOTE]
> Attributes are name/value pairs stored on an element (see `attributes` in [UIGPT.md](UIGPT.md)). They let one handler serve many cards: read the card's own ID or price with `139` instead of keeping a lookup table. A third attribute block, `140` †, exists; its shape isn't transcribed here, so don't generate it. `135` † Set mouse icon also exists (id slot shape in §5.2), but its text segments aren't transcribed either.

**Tween (`88`) values:** styles `Linear` `Sine` `Back` `Quad` `Quart` `Quint` `Bounce` `Elastic` `Exponential` `Circular` `Cubic`; directions `In` `Out` `InOut`. The style and direction slots follow each other directly with no text segment in between. Set/Tween accept braced (`"{1,0},{1,-41}"`) or flat (`"1,0,1,-41"`) UDim2 values, but **Position tween targets must be flat**: `"-1,0,0,0"` (off-screen left), `"0,0,0,0"` or `"0"` (origin). Not every property tweens smoothly; test first.

### 7.7b Actions — Hierarchy

| ID | Action | Exact `text` Array |
|---|---|---|
| `97` † | Get parent | `["Get parent of", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `99` † | Find child | `["Find child named", {"value":"row1","t":"string"}, "in", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `98` † | Find ancestor | `["Find ancestor named", {"value":"card","t":"string"}, "in", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `100` † | Find descendant | `["Find descendant named", {"value":"title","t":"string"}, "in", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `101` † | Get children | `["Get children of", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"table"}]` |
| `102` † | Get descendants | `["Get descendants of", {"value":"obj","t":"object"}, "→", {"value":"1","t":"string","l":"table"}]` |

`98`–`100` are the only blocks that match on an element's **alias** (its name); every other object slot takes a `globalid`.

### 7.8 Actions — System & Environment

| ID | Action | Exact `text` Array |
|---|---|---|
| `4` | Redirect | `["Redirect to", {"value":"home.rbx","t":"string","href":"true"}]` |
| `117` | Get URL | `["Get URL →", {"value":"1","t":"string","l":"variable"}]` |
| `67` † | Get query parameter | `["Get query string parameter", {"value":"view","t":"string"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `32` | Broadcast page | `["Broadcast", {"value":"msg","t":"string","l":"message"}, "across page"]` |
| `33` | Broadcast site | `["Broadcast", {"value":"msg","t":"string","l":"message"}, "across site"]` |
| `130` † | Broadcast cross-site | `["Broadcast", {"value":"msg","t":"string","l":"message"}, "cross-site to", {"value":"other.rbx","t":"string","l":"page","href":"true"}]` |
| `84` | Get viewport size | `["Get viewport size →", {"value":"1","t":"string","l":"x"}, {"value":"2","t":"string","l":"y"}]` |
| `85` | Get cursor position | `["Get cursor position →", {"value":"1","t":"string","l":"x"}, {"value":"2","t":"string","l":"y"}]` |
| `51` † | Get username | `["Get local username →", {"value":"1","t":"string","l":"variable"}]` |
| `53` † | Get display name | `["Get local display name →", {"value":"1","t":"string","l":"variable"}]` |
| `52` † | Get user ID | `["Get local user ID →", {"value":"1","t":"string","l":"variable"}]` |

`When message received` (event `9`) exposes `{messageContent}`, `{messageSenderName}` and `{messageSenderId}`. Broadcast payloads pass through Roblox's filter, so keep them numeric where you can (see the relay datastore in [CatDocs.md](CatDocs.md)).

### 7.8a Actions — Cookies

Cookie actions require the **Cookies gamepass**.

| ID | Action | Exact `text` Array |
|---|---|---|
| `34` | Set cookie | `["Set", {"value":"ck","t":"string","l":"cookie"}, "to", {"value":"val","t":"any"}]` |
| `35` † | Increase cookie | `["Increase", {"value":"ck","t":"string","l":"cookie"}, "by", {"value":"1","t":"number"}]` |
| `36` | Get cookie | `["Get cookie", {"value":"ck","t":"string","l":"cookie"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `62` | Delete cookie | `["Delete cookie", {"value":"ck","t":"string","l":"cookie"}]` |

### 7.8c Actions — Time & Date

| ID | Action | Exact `text` Array |
|---|---|---|
| `68` † | Get unix timestamp | `["Get unix timestamp →", {"value":"1","t":"string","l":"variable"}]` |
| `116` † | Get server unix timestamp | `["Get server unix timestamp →", {"value":"1","t":"string","l":"variable"}]` |
| `83` † | Get tick | `["Get tick →", {"value":"1","t":"string","l":"variable"}]` |
| `118` † | Get timezone | `["Get timezone →", {"value":"1","t":"string","l":"variable"}]` |
| `71` † | Format current date | `["Format current date/time", {"value":"YYYY-MM-DD","t":"string","l":"format"}, "→", {"value":"1","t":"string","l":"variable"}]` |
| `72` † | Format from unix | `["Format from unix", {"value":"{1}","t":"number"}, {"value":"YYYY-MM-DD","t":"string","l":"format"}, "→", {"value":"2","t":"string","l":"variable"}]` |

Format strings follow Roblox [`DateTime:FormatLocalTime`](https://create.roblox.com/docs/reference/engine/datatypes/DateTime).

### 7.8d Actions — Colour

| ID | Action | Exact `text` Array |
|---|---|---|
| `119` | Hex to RGB | `["Convert", {"value":"ffffff","t":"string","l":"hex"}, "to RGB →", {"value":"1","t":"string","l":"variable"}]` |
| `120` † | Hex to HSV | `["Convert", {"value":"ffffff","t":"string","l":"hex"}, "to HSV →", {"value":"1","t":"string","l":"variable"}]` |
| `121` | RGB to hex | `["Convert", {"value":"255,255,255","t":"string","l":"RGB"}, "to hex →", {"value":"1","t":"string","l":"variable"}]` |
| `122` † | HSV to hex | `["Convert", {"value":"0,0,1","t":"string","l":"HSV"}, "to hex →", {"value":"1","t":"string","l":"variable"}]` |
| `123` † | Lerp colour | `["Lerp", {"value":"000000","t":"string","l":"hex"}, "to", {"value":"ffffff","t":"string","l":"hex"}, "by", {"value":"0.5","t":"number","l":"alpha"}, "→", {"value":"1","t":"string","l":"variable"}]` |

### 7.8b Actions — Audio

| ID | Action | Exact `text` Array |
|---|---|---|
| `5` | Play audio | `["Play audio", {"value":"88442833509532","t":"string","l":"id","assetbrowser":"audio"}, "→", {"value":"","t":"string","l":"variable?"}]` |
| `26` | Play looped audio | `["Play looped audio", {"value":"88442833509532","t":"string","l":"id","assetbrowser":"audio"}, "→", {"value":"","t":"string","l":"variable?"}]` |
| `73` † | Set volume | `["Set volume of", {"value":"1","t":"string","l":"variable"}, "to", {"value":"0.5","t":"number"}]` |
| `77` † | Set speed | `["Set speed of", {"value":"1","t":"string","l":"variable"}, "to", {"value":"1.2","t":"number"}]` |
| `74` † | Stop audio | `["Stop audio", {"value":"1","t":"string","l":"variable"}]` |
| `75` † | Pause audio | `["Pause audio", {"value":"1","t":"string","l":"variable"}]` |
| `76` † | Resume audio | `["Resume audio", {"value":"1","t":"string","l":"variable"}]` |
| `7` † | Stop all audio | `["Stop all audio"]` |
| `94` † | Set audio property | `["Set", {"value":"Volume","t":"string","l":"property"}, "of", {"value":"1","t":"string","l":"variable"}, "to", {"value":"0.5","t":"any"}]` |
| `95` † | Get audio property | `["Get", {"value":"Volume","t":"string","l":"property"}, "of", {"value":"1","t":"string","l":"variable"}, "→", {"value":"2","t":"string","l":"variable"}]` |

Capture the handle from `5`/`26` in the `variable?` slot to control the sound later. Audio property names follow Roblox's [AudioPlayer](https://create.roblox.com/docs/reference/engine/classes/AudioPlayer#properties).

> [!CAUTION]
> Audio is `5` / `26`, **never `48`** (`48` is *String length*). Sound IDs are listed in [Assets.md](Assets.md). Action `28` is accepted by the validator but its slot shape isn't transcribed yet — don't generate it.

### 7.9 Actions — Functions

| ID | Action | Exact `text` Array |
|---|---|---|
| `132` | Run function | `["Run function", {"value":"fn","t":"string","l":"function"}, {"value":[],"t":"tuple"}, "→", {"value":"1","t":"string","l":"variable?"}]` |
| `133` † | Run in background | `["Run function in background", {"value":"fn","t":"string","l":"function"}, {"value":[],"t":"tuple"}]` |
| `134` † | Run function protected | `["Run function protected", {"value":"fn","t":"string","l":"function"}, {"value":[],"t":"tuple"}, "→", {"value":"1","t":"string","l":"success_variable?"}, {"value":"2","t":"string","l":"variable?"}]` |
| `115` | Return | `["Return", {"value":"val","t":"string","l":"any"}]` |
| `131` † | Set entry (function) | `["Set entry", {"value":"key","t":"string","l":"entry"}, "of", {"value":"tbl","t":"string","l":"table"}, "to", {"value":"fn","t":"string","l":"function"}]` |

**Deprecated:** `87` Run function, `63` † Run in background and `128` † Run function protected have the same shapes as `132` / `133` / `134`, but only warn when the function is missing (Compatibility Mode, see below). They still run, and the validator accepts them. Write `132`–`134`. The Web Runner runs `132` and `87` (both strictly) and skips the background and protected variants.

- **Tuples are always explicit arrays**, even empty: `{"value":[],"t":"tuple"}`, never a bare `{"t":"tuple"}`. One argument: `{"value":[{"value":"{40}","t":"string","l":"any"}],"t":"tuple"}`. Max 6 tuple parameters.
- Your own functions take no arguments (§4), so pass `[]` and set globals first. Arguments are for built-ins and the decoder.

> [!NOTE]
> - **Function Declaration:** Functions are defined at the top-level of `content` using Event ID `6` (`Define function`). Calling a function via Action `87` pauses execution until the function returns (or terminates via Action `115`). To avoid exceeding action limits, break complex routines into helper functions.
> - **Strict Mode vs Compatibility Mode (v2.18.3.0+):** CatWeb features two operational modes for function execution blocks (`Run function`, `Run function in background`, `Run function protected`):
>   1. **Strict Mode (New standard):** If the requested function name is not found, execution immediately terminates with a fatal runtime script error, preventing silent failures.
>   2. **Compatibility Mode (Deprecated legacy variant):** Emits a console warning if the target function is not defined, continuing execution past the call.

---

## 8. Complete Worked Examples

### 8.1 Button Click Counter (validated)

A complete, importable site lives in [`skills/catweb/examples/click_counter_minimal.json`](../skills/catweb/examples/click_counter_minimal.json) and passes `node tools/validate.js`. Its button event looks like this — `bt` is the button's `globalid`, `lb` the label's:

```json
{
  "id": "1",
  "globalid": "e1",
  "x": "5000",
  "y": "4800",
  "width": "350",
  "text": ["When", {"value": "bt", "t": "object", "l": "button"}, "pressed..."],
  "actions": [
    {"id": "12", "globalid": "a1", "text": ["Increase", {"value": "1", "t": "string", "l": "variable"}, "by", {"value": "1", "t": "number"}]},
    {"id": "10", "globalid": "a2", "text": ["Set", {"value": "lb", "t": "object"}, "text to", {"value": "Clicks: {1}", "t": "string"}]},
    {"id": "18", "globalid": "a3", "text": ["If", {"value": "{1}", "t": "string", "l": "any"}, "is equal to", {"value": "10", "t": "string", "l": "any"}]},
    {"id": "10", "globalid": "a4", "text": ["Set", {"value": "lb", "t": "object"}, "text to", {"value": "Goal reached!", "t": "string"}]},
    {"id": "112", "globalid": "a5", "text": ["else"]},
    {"id": "0", "globalid": "a6", "text": ["Log", {"value": "Clicked {1} times", "t": "any"}]},
    {"id": "25", "globalid": "a7", "text": ["end"]}
  ]
}
```

Note what makes it valid: short `globalid`s on every block, the button referenced by `globalid` (not alias), a flat `If … else … end`, and `{1}` inside text fields but a bare `"1"` in the `<variable>` slot.

### 8.2 Math Function (`114`) Example
Calling `math.sin` with tuple parameter:
```json
{
  "id": "114",
  "globalid": "m1",
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

Use only Luau `math` names (`abs`, `sqrt`, `min`, `max`, …). For two arguments add a second tuple entry. Prefer the dedicated `Round` / `Floor` / `Ceil` (`16` / `17` / `78`) over routing those through `114`.

### 8.3 Loops + Math + Tables

Builds a table of square roots for 1–5 with `Repeat` (`22`), `Run math function` (`114`) and `Set entry` (`55`), then reads it back with `Iterate through` (`113`):

```json
{
  "class": "script", "globalid": "sc4", "alias": "sqrttable", "enabled": "true",
  "content": [
    {"id": "0", "globalid": "e0", "x": "4900", "y": "4900", "width": "360", "text": ["When website loaded..."],
     "actions": [
       {"id": "54",  "globalid": "a1",  "text": ["Create table", {"value": "1", "t": "string", "l": "table"}]},
       {"id": "11",  "globalid": "a2",  "text": ["Set", {"value": "2", "t": "string", "l": "variable"}, "to", {"value": "0", "t": "string", "l": "any"}]},
       {"id": "22",  "globalid": "a3",  "text": ["Repeat", {"value": "5", "t": "number"}, "times"]},
       {"id": "12",  "globalid": "a4",  "text": ["Increase", {"value": "2", "t": "string", "l": "variable"}, "by", {"value": "1", "t": "number"}]},
       {"id": "114", "globalid": "a5",  "text": ["Run math function", {"value": "sqrt", "t": "string", "l": "function"}, {"value": [{"value": "{2}", "t": "string", "l": "any"}], "t": "tuple"}, "→", {"value": "3", "t": "string", "l": "variable"}]},
       {"id": "55",  "globalid": "a6",  "text": ["Set entry", {"value": "{2}", "t": "string", "l": "entry"}, "of", {"value": "1", "t": "string", "l": "table"}, "to", {"value": "{3}", "t": "string", "l": "any"}]},
       {"id": "25",  "globalid": "a7",  "text": ["end"]},
       {"id": "113", "globalid": "a8",  "text": ["Iterate through", {"value": "1", "t": "string", "l": "table"}, "({l!index},{l!value})"]},
       {"id": "0",   "globalid": "a9",  "text": ["Log", {"value": "{l!value}", "t": "any"}]},
       {"id": "25",  "globalid": "a10", "text": ["end"]}
     ]}
  ]
}
```

- `{2}` is increased **before** it's used as both the argument and the entry index, so entries run 1–5, never 0.
- Each tuple entry is a full slot object (`{"value":…,"t":"string","l":"any"}`), not a bare string.
- One `end` per opener: `a7` closes the `Repeat`, `a10` the `Iterate`.

---

## 9. Pre-Flight Checklist

Run it when writing a script (fix every failure) and when reviewing one (report every failure):

1. Every `id` exists in §7 and every slot matches its shape exactly: same keys, same `t`, same `l`, nothing added.
2. Top-level `content` entries are only events or `Define function`; only those carry `actions`.
3. Every `If` / `Repeat` / `Iterate` has exactly one matching `end`, in order. `else` sits before its `If`'s `end` and has no `end` of its own.
4. `20` / `21` match the intended direction (greater / lower).
5. Tuples are explicit arrays.
6. `globalid`s are unique; object slots hold real element `globalid`s, never aliases.
7. Variables are numeric; bare names in `variable` / `table` / `array` slots, braces where a value is read.
8. Every event and function has `x`, `y`, `width`.
9. `text` arrays have exactly the segments shown in §7 (annotations appended, §3.4).
10. No deprecated function IDs (`87`, `63`, `128`); use `132`–`134` (§7.9).

---

## 10. Cross-References

- **UI Structure:** See [UIGPT.md](UIGPT.md).
- **Icons, Sound IDs & Component Templates:** See [Assets.md](Assets.md).
- **General Game Reference:** See [CatDocs.md](CatDocs.md).