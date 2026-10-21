# CatWeb for AI Agents — Start Here

CatWeb is a Roblox game where people build 2D websites. A CatWeb page is **one JSON file**: UI elements plus block scripts. It is never HTML, CSS, Lua or JavaScript.

This page is the short version. Read it first, then open the detailed docs only for the part you need.

---

## 1. Which file answers which question

| You need to… | Read |
|---|---|
| Lay out UI (classes, sizes, padding, lists, grids) | [`game/UIGPT.md`](game/UIGPT.md) |
| Make it look good, responsive, or fit the element budget | [`game/UIGPT.md`](game/UIGPT.md) §8, §11, §12 |
| Write scripts (event/action IDs, exact slot shapes) | [`game/JSONScript.md`](game/JSONScript.md) §3.3 and §7 |
| Check a script before shipping | [`game/JSONScript.md`](game/JSONScript.md) §9 |
| Use icons, sounds or ready-made components | [`game/Assets.md`](game/Assets.md) |
| Save data across visits or share it between users | [`game/CatDocs.md`](game/CatDocs.md), "Persistent / Cross-User Data" |
| Look up a game limit, property name or behaviour | [`game/CatDocs.md`](game/CatDocs.md) |
| Render or validate from code (URL, postMessage, HTTP) | [`docs/AI_API.md`](docs/AI_API.md) |
| Copy a complete, valid page | [`skills/catweb/examples/click_counter_minimal.json`](skills/catweb/examples/click_counter_minimal.json) |

---

## 2. Rules that break an import

Each of these makes CatWeb reject the file (`[INVALIDATED]`) or refuse to publish it. The validator catches all of them.

1. **Every value is a string.** `"font_size": "16"`, `"visible": "true"` — never `16` or `true`.
2. **Every `globalid` is 2–3 printable ASCII characters**, unique across the file — on elements, events *and* actions (`"bt"`, `"e1"`, `"a7"`). Not `"click_btn"`.
3. **Scripts reference elements by `globalid`**, never by `alias`.
4. **Colours keep `#`:** `"#1a1a1a"`. Exception: `UIGradient` stops drop it (`"[[0,\"4e9bff\"],[1,\"7274e0\"]]"`).
5. **Use `order`, not `layout_order`. Use `size` (not `cell_size`) on `UIGridLayout`. Use `anchor`, not `anchor_point`.**
6. **JSON keys are snake_case; script property names are Title Case.** `background_color` on an element, `"Background Color"` inside a Set/Get/Tween block.
7. **Control flow is flat.** `If`, `Repeat` and friends never get a nested `actions` array; their body follows them in the same list and ends with `{"id":"25","text":["end"]}`.
8. **Use only event/action IDs from [`JSONScript.md` §7](game/JSONScript.md).** Never guess an ID.
9. **Name variables with numbers** (`{1}`, `{o!2}`, `{l!3}`). Words like `{score}` can be censored to `{######}` by Roblox.
10. **No comments in JSON.**
11. **Only documented keys.** Any key not listed for that class fails with `default not found for property <key>`. CSS-style keys (`padding`, `gap`, `margin`, `border-radius`) don't exist; use modifier children. The validator only catches the keys in rule 5, so check the class tables in [`UIGPT.md`](game/UIGPT.md).

Also keep in mind (not import errors, but they break pages): `20` is *greater than* and `21` is *lower than* (swapping them silently inverts the condition), no emoji or arrow glyphs in site text (use icons), keep pages under ~500 elements, and center fixed-width blocks with `position` x `0.5` + `anchor` x `0.5`.

---

## 3. The shape of a page

```json
{
  "favicon": "16944769468",
  "title": "My Page",
  "background": "#0f0f11",
  "webcontent": [
    { "class": "Frame", "globalid": "rt", "size": "{1,0},{1,0}", "background_color": "#0f0f11", "children": [
      { "class": "TextButton", "globalid": "bt", "text": "Click me", "size": "{0,200},{0,44}" },
      { "class": "script", "globalid": "sc", "enabled": "true", "content": [ "…event blocks…" ] }
    ]}
  ]
}
```

- A **component or snippet** can be a bare array `[ {…}, {…} ]` instead of the object.
- Sizes and positions are UDim2: `"{scaleX,offsetX},{scaleY,offsetY}"`. `"{1,0},{0,56}"` = full width, 56 px high.
- Scripts are elements (`"class": "script"`) inside `webcontent`, never a top-level key.

## 4. The shape of a script

```json
{
  "id": "1", "globalid": "e1", "x": "5000", "y": "4800", "width": "350",
  "text": ["When", {"value": "bt", "t": "object", "l": "button"}, "pressed..."],
  "actions": [
    {"id": "12", "globalid": "a1", "text": ["Increase", {"value": "1", "t": "string", "l": "variable"}, "by", {"value": "1", "t": "number"}]},
    {"id": "18", "globalid": "a2", "text": ["If", {"value": "{1}", "t": "string", "l": "any"}, "is equal to", {"value": "10", "t": "string", "l": "any"}]},
    {"id": "0",  "globalid": "a3", "text": ["Log", {"value": "Reached {1}", "t": "any"}]},
    {"id": "25", "globalid": "a4", "text": ["end"]}
  ]
}
```

- `text` alternates words and **slots**. Each slot is `{"value": …, "t": type, "l": role}`; copy `t`/`l` exactly from the table in JSONScript §7 — they are fixed per block, not guessed from the value.
- `{1}` inside a text value is replaced by variable 1. A `<variable>` slot takes the bare name `"1"`.
- `x`/`y` place the block stack on the 9992×9992 editor canvas (centre `5000,5000`).

---

## 5. Workflow

1. **Write** the JSON (start from the example file above).
2. **Validate:** `node tools/validate.js page.json` — fix every `FAIL` until it prints `PASSED`.
3. **Preview & test the scripts** in the Web Runner: `npm run serve`, or open [the live runner](https://mailo037.github.io/catweb-docs/) and paste the JSON.
   - **Scripts** (`B`) shows every event stack at its `x`/`y`; click **Run** on an event to execute it.
   - **Console** (`C`) shows `Log`/`Warn`/`Error` output, runtime errors with the block's `globalid`, and live variable values.
4. From code, render a PNG or get errors via [`docs/AI_API.md`](docs/AI_API.md).

### Fixing validator errors

| Code | What it means | Fix |
|---|---|---|
| `RAW_NUMBER_SCALAR` / `RAW_BOOLEAN_SCALAR` / `RAW_NULL_SCALAR` | A value isn't a string | Quote it: `"16"`, `"true"` |
| `INVALID_GLOBALID` / `INVALID_GLOBALID_FORMAT` | ID is too long or empty | Use 2–3 characters: `"e1"` |
| `DUPLICATE_GLOBALID` | Two things share an ID | Give one of them a new ID (events and actions count too) |
| `FORBIDDEN_PROPERTY` | `layout_order` / `cell_size` / `anchor_point` | Use `order` / `size` / `anchor` |
| `NESTED_CONTROL_FLOW_ACTIONS` | `actions` inside an If/Repeat | Flatten the body and close it with `end` (25) |
| `UNRESOLVED_OBJECT_REFERENCE` | Script names an element that doesn't exist | Use the element's `globalid`, not its alias |
| `INVALID_ACTION_ID` / `INVALID_EVENT_ID` | Unknown block ID | Pick the ID from JSONScript §7 |
| `INVALID_SCRIPT_PROPERTY` | Property name isn't a script name | Use the Title Case name (`"Text Color"`) |
| `WRONG_WAIT_BLOCK_ID` | Wait written with a loop ID | Wait is action `3` |
| `INVALID_HEX_COLOR` | Colour without `#` or malformed | `"#rrggbb"` |
| `POTENTIAL_MODERATION_VARIABLE` (warning) | Word-named variable | Rename to a number |

---

## 6. What the Web Runner simulates

The runner executes scripts in the browser so you can test logic before importing. It covers:

- **Events:** website loaded, button pressed / right-clicked / mouse down / mouse up, mouse enters / leaves, key pressed, any key pressed, input submitted, object changed, message received (from Broadcast on the same page), functions.
- **Control flow:** all `If` variants incl. `else`, `Repeat`, `Repeat forever` (stopped with an error if it never Waits), `Break`, `Iterate`, `Return`.
- **Variables** in all three scopes, tables/arrays with `{tbl.key}` access, math, strings, colours, cookies (kept until the tab closes), Set/Get/Tween property, duplicate/delete/parent objects, functions with return values.

Not simulated (skipped with a note in the Console): purchases and donations, cross-site messages, avatar images, server time, asset info. A page that works in the runner can still hit Roblox limits or moderation in the game, so test there before publishing.
