# CatWeb Script JSON Format (v2.17.2.0)

## Overview

This document specifies the JSON structure for CatWeb scripts. For scripting logic and action details, see **CatDocs**. For UI element structure, see the UI JSON Spec.

**Current Version:** v2.17.2.0

---

## Root Structure

Scripts use a **mandatory array wrapper**:

```json
[
  {
    "class": "script",
    "content": [...],
    "globalid": "script_main",
    "enabled": "true"
  }
]
```

**Requirements:**
- Root MUST be an array (not an object)
- Multiple scripts can coexist in the array
- Each script operates independently but shares global variables
- **NEVER add comments to JSON** - they break parsing

---

## Script Object

```json
{
  "class": "script",
  "content": [event_blocks...],
  "globalid": "unique_id",
  "enabled": "true"
}
```

| Property | Required | Description |
|----------|----------|-------------|
| class | Yes | Always `"script"` |
| content | Yes | Array of event objects |
| globalid | Yes | Unique identifier |
| enabled | No | `"true"` or `"false"` (default: `"true"`) |

---

## Event Block Structure

```json
{
  "y": "4695",
  "x": "4703",
  "globalid": "+!",
  "id": "0",
  "text": ["When website loaded..."],
  "actions": [action_objects...],
  "width": "350",
  "variable_overrides": []
}
```

### Event Properties

| Property | Required | Description |
|----------|----------|-------------|
| y | Yes | Vertical position (string numeric) |
| x | Yes | Horizontal position (string numeric) |
| globalid | Yes | Event unique ID (any string) |
| id | Yes | Event type identifier (see Event IDs) |
| text | Yes | Event descriptor with parameters |
| actions | Yes | Array of action objects |
| width | Yes | Visual width in editor |
| variable_overrides | Conditional | Only for function definitions (id: 6) |

### Event Positioning

- **Coordinates:** String-encoded numbers for visual layout
- **Priority:** Events closer to workspace center execute first
- **Parallel Execution:** Multiple events run simultaneously
- **Canvas Size:** 9992×9992 pixels, centered by default

**Best Practice:** Place important events near center (x: ~5000, y: ~5000)

### Function Definition Events

```json
{
  "id": "6",
  "text": ["Define function", {"value": "funcName", "t": "string", "l": "function"}],
  "variable_overrides": [
    {"value": "arg1"},
    {"value": "arg2"}
  ],
  "actions": [...],
  "width": "722"
}
```

Parameters become local variables: `l!arg1`, `l!arg2`

---

## Action Block Structure

```json
{
  "id": "18",
  "text": [
    "If ",
    {"value": "var1", "t": "string", "l": "any"},
    " is equal to ",
    {"value": "var2", "t": "string", "l": "any"}
  ],
  "globalid": "rU"
}
```

### Action Properties

| Property | Required | Description |
|----------|----------|-------------|
| id | Yes | Action type identifier |
| text | Yes | Mixed array of strings and parameters |
| globalid | Yes | Action unique ID |
| help | No | **ONLY for comment actions (id: 124)** |

**WARNING:** Using `help` on non-comment actions creates invalid JSON

---

## Block Control Actions

### If-Else-End Pattern

```json
[
  {
    "id": "18",
    "text": ["If", {"value": "x", "l": "any", "t": "string"}, " is equal to ", {"value": "y", "l": "any", "t": "string"}],
    "globalid": "Fo"
  },
  // True condition actions...
  {
    "id": "112",
    "text": ["else"],
    "globalid": "3Q"
  },
  // False condition actions...
  {
    "id": "25",
    "text": ["end"],
    "globalid": "v5"
  }
]
```

**Note:** `else` blocks consume action slots. For efficiency, consider multiple independent `if` conditions.

### Loop Structures

```json
[
  {
    "id": "22",
    "text": ["Repeat ", {"value": "5", "t": "number"}, " times"],
    "globalid": "loop_start"
  },
  // Loop body...
  {
    "id": "25",
    "text": ["end"],
    "globalid": "loop_end"
  }
]
```

---

## Parameter Objects

### Type System

| Type | JSON Format | Validation | Example |
|------|-------------|------------|---------|
| any | `{"value": "content", "t": "any", "l": "any"}` | Accepts any value | `{"value": "{var}", "t": "any", "l": "any"}` |
| string | `{"value": "text", "t": "string", "l": "variable"}` | Converts to string | `{"value": "hello", "t": "string"}` |
| number | `{"value": "123", "t": "number", "l": "any"}` | Non-numeric → 0 | `{"value": "42", "t": "number"}` |
| object | `{"value": "Button1", "t": "object"}` | Must reference valid element | See Object References below |
| variable | `{"value": "varName", "t": "string", "l": "variable"}` | Variable existence | `{"value": "counter", "t": "string", "l": "variable"}` |
| tuple | `{"value": [param1, param2...], "t": "tuple"}` | Max 6 parameters | See Tuple Structure below |

### Optional Types

Add `?` to label for optional parameters:

```json
{"value": "", "t": "string", "l": "variable?"}
```

Empty optional fields are safely ignored.

### Types vs Labels

- **Type (`t`)**: Defines accepted data type (strict validation)
- **Label (`l`)**: Describes what value represents (contextual)
- Cannot create custom type/label combinations

---

## Object References

```json
// Direct element (uses globalid)
{"value": "SubmitButton", "t": "object"}

// Script parent
{"value": "(parent)", "t": "object"}

// Object variable (runtime)
{"value": "{objVar}", "t": "object"}

// Scoped object variable
{"value": "{o!scopedObj}", "t": "object"}
```

**CRITICAL:** Scripts reference objects via **globalid** (not alias). When JSON is imported, globalids regenerate - keep UI + scripts in ONE JSON file.

**Recommended:** Use `(parent)` for scripts operating within their parent element instead of hardcoding globalids.

---

## Tuple Parameters

```json
{
  "value": [
    {"value": "firstArg", "t": "string", "l": "any"},
    {"value": "secondArg", "t": "number", "l": "any"},
    {"value": "thirdArg", "t": "string", "l": "any"}
  ],
  "t": "tuple"
}
```

Max 6 parameters per tuple.

---

## Variable Scoping

```json
// Global (any script)
{"value": "{globalVar}", "t": "any", "l": "any"}

// Object (same script)
{"value": "{o!objectVar}", "t": "any", "l": "any"}

// Local (same event)
{"value": "{l!localVar}", "t": "any", "l": "any"}
```

**Direct Table Entry Access:**
```json
// Access table entries directly
{"value": "{table.entry}", "t": "any", "l": "any"}

// Works with nested tables
{"value": "{table.entry.subentry}", "t": "any", "l": "any"}

// Works with arrays (use numbers)
{"value": "{array.1}", "t": "any", "l": "any"}
```

---

## Event & Action IDs

### Events

| ID | Event |
|----|-------|
| 0 | When website loaded... |
| 1 | When `<button>` pressed... |
| 2 | When `<key>` pressed... |
| 3 | When mouse enters `<object>`... |
| 5 | When mouse leaves `<object>`... |
| 6 | Define function `<function>` |
| 7 | When `<donation>` bought... |
| 8 | When `<input>` submitted... |
| 9 | When message received... |
| 10 | When `<object>` changed... |
| 11 | When mouse down on `<button>`... |
| 12 | When mouse up on `<button>`... |
| 13 | When `<button>` right clicked... |
| 14 | When cross-site message received... |

### Actions

| ID | Action |
|----|--------|
| 0 | Log `<any>` |
| 1 | Warn `<any>` |
| 2 | Error `<any>` |
| 3 | Wait `<number>` seconds |
| 4 | Redirect to `<string>` |
| 5 | Play audio `<id>` → `<variable?>` |
| 8 | Make `<object>` invisible |
| 9 | Make `<object>` visible |
| 10 | Set `<object>` text to `<string>` |
| 11 | Set `<variable>` to `<any>` |
| 12 | Increase `<variable>` by `<number>` |
| 13 | Decrease `<variable>` by `<number>` |
| 14 | Multiply `<variable>` by `<number>` |
| 15 | Divide `<variable>` by `<number>` |
| 16 | Round `<variable>` |
| 17 | Floor `<variable>` |
| 18 | If `<any>` is equal to `<any>` |
| 19 | If `<any>` is not equal to `<any>` |
| 20 | If `<any>` is greater than `<any>` |
| 21 | If `<any>` is lower than `<any>` |
| 22 | Repeat `<number>` times |
| 23 | Repeat forever |
| 24 | break |
| 25 | end |
| 26 | Play looped audio `<id>` → `<variable?>` |
| 27 | Set `<var>` to random `<n>` - `<n>` |
| 30 | Get text from `<input>` → `<variable>` |
| 31 | Set `<property>` of `<object>` to `<any>` |
| 32 | Broadcast `<message>` across page |
| 33 | Broadcast `<message>` across site |
| 34 | Set `<cookie>` to `<any>` |
| 35 | Increase `<cookie>` by `<number>` |
| 36 | Get cookie `<cookie>` → `<variable>` |
| 37 | If `<string>` contains `<string>` |
| 38 | If `<string>` doesn't contain `<string>` |
| 39 | Get `<property>` of `<object>` → `<variable>` |
| 40 | Raise `<variable>` to the power of `<number>` |
| 41 | `<variable>` modulo `<number>` |
| 42 | Sub `<variable>` `<start>` - `<end>` |
| 43 | Replace `<string>` in `<variable>` by `<string>` |
| 44 | If `<variable>` AND `<variable>` |
| 45 | If `<variable>` OR `<variable>` |
| 46 | If `<variable>` NOR `<variable>` |
| 47 | If `<variable>` XOR `<variable>` |
| 48 | Get length of `<string>` → `<variable>` |
| 49 | Duplicate `<object>` → `<variable>` |
| 50 | Delete `<object>` |
| 51 | Get local username → `<variable>` |
| 52 | Get local user ID → `<variable>` |
| 53 | Get local display name → `<variable>` |
| 54 | Create table `<table>` |
| 55 | Set entry `<entry>` of `<table>` to `<any>` |
| 56 | Get entry `<entry>` of`<table>` → `<variable>` |
| 57 | Split `<string>` `<separator>` → `<table>` |
| 58 | Parent `<object>` under `<object>` |
| 59 | Get length of `<array>` → `<variable>` |
| 62 | Delete cookie `<cookie>` |´
| 63 | Run function in background `<function>` `<tuple?>` |
| 66 | Set entry `<entry>` of `<table>` to `<object>` |
| 67 | Get query string parameter `<string>` → `<variable>` |
| 68 | Get unix timestamp → `<variable>` |
| 69 | Lower `<string>` → `<variable>` |
| 70 | Upper `<string>` → `<variable>` |
| 71 | Format current date/time `<format>` → `<variable>` |
| 72 | Format from unix `<number>` `<format>` → `<variable>` |
| 73 | Set volume of `<variable>` to `<number>` |
| 74 | Stop audio `<variable>` |
| 75 | Pause audio `<variable>` |
| 76 | Resume audio `<variable>` |
| 77 | Set speed of `<variable>` to `<number>` |
| 78 | Ceil `<variable>` |
| 79 | If left mouse button down |
| 80 | If middle mouse button down |
| 81 | If right mouse button down |
| 82 | If `<key>` down |
| 83 | Get tick → `<variable>` |
| 84 | Get viewport size → `<x>` `<y>` |
| 85 | Get cursor position → `<x>` `<y>` |
| 87 | Run function `<function>` `<tuple>` → `<variable?>` |
| 88 | Tween `<property>` of `<object>` to `<any>` - `<time>` `<style>` `<direction>` |
| 89 | Insert `<any>` at position `<number?>` of `<array>` |
| 90 | Delete entry `<entry>` of `<table>` |
| 91 | Remove entry at position `<number?>` of `<array>` |
| 92 | If `<variable>` exists |
| 93 | If `<variable>` doesn't exist |
| 94 | Set `<property>` of `<variable>` to `<any>` |
| 95 | Get `<property>` of `<variable>` to `<any>` |
| 96 | Delete `<variable>` |
| 97 | Get parent of `<object>` → `<variable>` |
| 98 | Find ancestor named `<string>` in `<object>` → `<variable>` |
| 99 | Find child named `<string>` in `<object>` → `<variable>` |
| 100 | Find descendant named `<string>` in `<object>` → `<variable>` |
| 101 | Get children of `<object>` → `<table>` |
| 102 | Get descendants of `<object>` → `<table>` |
| 103 | If `<object>` is ancestor of `<object>` |
| 104 | If `<object>` is child of `<object>` |
| 105 | If `<object>` is descendant of `<object>` |
| 106 | Set `<object>` image to `<id>` |
| 107 | Set `<object>` image to avatar of `<userid>` `<resolution?>` |
| 108 | If dark theme enabled |
| 109 | Concatenate `<string>` with `<string>` → `<variable>` |
| 110 | Join `<array>` using `<string>` → `<variable?>` |
| 112 | else |
| 113 | Iterate through `<table>` ({l!index},{l!value}) |
| 114 | Run math function `<function>` `<tuple>` → `<variable>` |
| 115 | Return `<any>` |
| 116 | Get server unix timestamp → `<variable>` |
| 117 | Get URL → `<variable>` |
| 118 | Get timezone → `<variable>` |
| 119 | Convert `<hex>` to RGB → `<variable>` |
| 120 | Convert `<hex>` to HSV → `<variable>` |
| 121 | Convert `<RGB>` to hex → `<variable>` |
| 122 | Convert `<HSV>` to hex → `<variable>` |
| 123 | Lerp `<hex>` to `<hex>` by `<alpha>` → `<variable>` |
| 124 | `<comment>` |
| 125 | If `<any>` is greater or equal to `<any>` |
| 126 | If `<any>` is lower or equal to `<any>` |
| 127 | Get objects at position `<x>` `<y>` → `<array>` |
| 128 | Run function protected `<function>` `<tuple?>` → `<success_variable>` `<variable?>` |
| 129 | Get `<info>` of asset `<id>` → `<variable>` |
| 130 | Broadcast `<message>`cross-site to `<page>` |
 |

**More information:** See CatDocs reference
- If you see some missing Ids, its most likely because some actions are deprecated
- See CatDocs reference

### ID Collisions

Events and actions have separate ID spaces. Use event IDs for events, action IDs for actions.

Example collision: ID 0 = "When website loaded" (event) OR "Log `<any>`" (action)

---

## Complex Patterns

### Function Call with Tuple

```json
{
  "id": "87",
  "text": [
    "Run function ",
    {"value": "calculate", "t": "string", "l": "function"},
    " ",
    {
      "value": [
        {"value": "arg1", "t": "string", "l": "any"},
        {"value": "arg2", "t": "number", "l": "any"}
      ],
      "t": "tuple"
    },
    " → ",
    {"value": "result", "l": "variable", "t": "string"}
  ],
  "globalid": "func_call"
}
```

### Table Iteration

```json
{
  "id": "113",
  "text": [
    "Iterate through ",
    {"value": "dataTable", "t": "string", "l": "table"},
    " ({l!index},{l!value})"
  ],
  "globalid": "iterate"
}
```

`{l!index}` and `{l!value}` are fixed local variables created automatically.

### Property Manipulation

```json
{
  "id": "31",
  "text": [
    "Set ",
    {"value": "BackgroundColor", "t": "string", "l": "property"},
    " of ",
    {"value": "TargetFrame", "t": "object"},
    " to ",
    {"value": "#ff0000", "t": "string", "l": "any"}
  ],
  "globalid": "set_prop"
}
```

---

## Comment Actions

```json
{
  "id": "124",
  "text": [{"value": "Documentation comment", "t": "string", "l": "comment"}],
  "globalid": "comment_1",
  "help": "Optional help text for editor"
}
```

**CRITICAL:** `help` key ONLY valid for id: 124. Using elsewhere = invalid JSON.

---

## Validation Rules

### Required Fields
- All objects: `globalid`
- Events: `y`, `x`, `id`, `text`, `actions`, `width`
- Actions: `id`, `text`, `globalid`
- Scripts: `class`, `content`, `globalid`

### Type Constraints
- Coordinates (`y`, `x`): String-encoded numbers
- IDs (`id`): String-encoded numbers matching known actions/events
- `globalid`: Must be unique across entire JSON
- `width`: String-encoded number

### Forbidden Patterns
- ❌ `warning` key (does not exist in valid CatWeb JSON)
- ❌ `help` key (ONLY on comment actions, id: 124)
- ❌ Invalid type combinations
- ❌ Comments in JSON

### Block Structure Rules
- Every block starter (if, repeat, iterate) needs matching `end`
- `else` (id: 112) must follow conditional and precede `end`
- Function definitions cannot nest
- Max 6 tuple parameters

---

## Best Practices for AI Generation

### DO ✓
- **Keep UI + scripts in ONE JSON** - globalid regeneration on import breaks references
- **Use `(parent)` references** instead of hardcoding globalids when possible
- **Use clear placeholder names** for object references (e.g., "SubmitButton")
- **Remind users to link objects** in the explorer
- **Use short unique globalids** - 2-3 character mix (letters/numbers/symbols)
- **Increment coordinates logically** - y +100-200 vertical, x +350-400 horizontal
- **Center important events** - around x: 5000, y: 5000
- **Balance else blocks** - they consume action slots (120 max per event)
- **Use comment actions** (id: 124) for documentation

### DON'T ✗
- **NEVER add comments to JSON** - they break parsing
- **Don't use `help` on non-comment actions** - invalid JSON
- **Don't nest functions** - not supported
- **Don't call functions recursively** without delays
- **Don't forget globalid uniqueness**

---

## Limits

- **Actions per event:** 120
- **Actions per script:** 3,600 (30 events × 120)
- **Events per script:** 30
- **Tuple parameters:** 6 max
- **Runtime objects:** 1,000 max

---

## Example: Complete Function

```json
[
  {
    "class": "script",
    "globalid": "main_script",
    "content": [
      {
        "id": "6",
        "text": ["Define function ", {"value": "greetUser", "t": "string", "l": "function"}],
        "variable_overrides": [
          {"value": "username"}
        ],
        "x": "5000",
        "y": "5000",
        "width": "500",
        "globalid": "func_def",
        "actions": [
          {
            "id": "11",
            "text": [
              "Set variable ",
              {"value": "message", "t": "string", "l": "variable"},
              " to ",
              {"value": "Hello, {l!username}!", "t": "any", "l": "any"}
            ],
            "globalid": "set_msg"
          },
          {
            "id": "115",
            "text": ["Return ", {"value": "{message}", "t": "any", "l": "any"}],
            "globalid": "return"
          }
        ]
      },
      {
        "id": "0",
        "text": ["When website loaded..."],
        "x": "5000",
        "y": "5200",
        "width": "350",
        "globalid": "on_load",
        "actions": [
          {
            "id": "87",
            "text": [
              "Run function ",
              {"value": "greetUser", "t": "string", "l": "function"},
              " ",
              {
                "value": [
                  {"value": "Player", "t": "string", "l": "any"}
                ],
                "t": "tuple"
              },
              " → ",
              {"value": "greeting", "t": "string", "l": "variable"}
            ],
            "globalid": "call_func"
          },
          {
            "id": "0",
            "text": ["Log ", {"value": "{greeting}", "t": "any", "l": "any"}],
            "globalid": "log"
          }
        ]
      }
    ]
  }
]
```

---

## Cross-References

- **For action details & logic:** See CatDocs (main reference)
- **For UI structure:** See CatWeb UI JSON Spec
- **Usage:** This document pairs with CatDocs for complete scripting knowledge