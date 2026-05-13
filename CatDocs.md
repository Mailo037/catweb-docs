# CatDocs - CatWeb Complete Reference (v2.17.3.0)

## Table of Contents

1. [Introduction](#introduction)
2. [CatWeb Basics](#catweb-basics)
3. [UI Elements](#ui-elements)
4. [Scripting System](#scripting-system)
5. [Events](#events)
6. [Actions](#actions)
7. [Properties Reference](#properties-reference)
8. [Script Formatting](#script-formatting)
9. [Tips & Tricks](#tips--tricks)

---

## Introduction

**CatWeb** is a Roblox game where players can create 2D websites using JSON-based UI and a visual block-based scripting system. The user interface is claimed by the owner to visually represent Chrome.

**Current Version:** v2.17.3.0 
**TLD:** `.rbx` (CatWeb-specific, not real internet)

### Cross-References
- **UI JSON Structure:** See CatWeb UI JSON Spec
- **Script JSON Format:** See json-rulings.md (pairs with this document)

---

## CatWeb Basics

### Platform Features

**Free Tier:**
- 100 element limit
- 1 free site
- 3 subdomains
- 15 pages per site

**Premium ($3.74 USD / 299 Robux):**
- 400 element limit
- 3 free sites
- 5 subdomains
- 30 pages per site
- Premium chat tag
- Does NOT include Cookies gamepass
- Custom Themes
- Profile Icon

**Cookies Gamepass ($0.99 USD / 80 Robux):**
- Enables Cookies action type (local storage)
- 10kB storage limit per site

**Extra Domain ($0.29 USD / 29 Robux):**
- 1 extra domain

### Technical Specs

**Color System:**
- Hex codes (with/without `#`): `#ff0000` or `ff0000`
- RGB auto-converts to hex: `255,0,0` → `#ff0000`

**Coordinate System:**
- Scale + Offset format
- Position: `{scaleX,offsetX},{scaleY,offsetY}`
- Size: `{scaleX,offsetX},{scaleY,offsetY}`
- Radius: `scale,offset` (1 in scale = full circle, offset in dp)

**Display:**
- Landscape mode only
- No portrait support planned

### Sharing Elements/pages

**Export via JSON:**
- You will get a JSON which you can share
- Stuff can tag when importing

**Export via Upload:**
- You will get a unique 6 character code which you can share
- Nothing will tag when importing
- You can assign a name to your upload (max. 50 characters)
- You can see how many times your upload code has been used

---

## UI Elements

### Element Types (10 total)

**Visual Elements:**
1. **Frame** - Basic container
2. **Text** - Display text (20k char render limit, 200k total for every object displaying text)
3. **Image** - Display images
4. **Link** - Clickable URL button (also has a text property - 20k char render limit, 200k total for every object displaying text)
5. **Button** - Interactive button (also has a text property - 20k char render limit, 200k total for every object displaying text)
6. **Donation** - Prompt transfer button (also has a text property - 20k char render limit, 200k total for every object displaying text), this button does not support passes or developer products, only a amount of robux
7. **Avatar Item** - Prompt purchase button (also has a text property - 20k char render limit, 200k total for every object displaying text), this button will only support avatar items, no passes or developer products
8. **Input** - Text input field (also has a text property - 20k char render limit, 200k total for every object displaying text)
9. **Scroller** - Scrollable container

**Non-Visual Elements:**
10. **Script** - Contains scripting logic
11. **Folder** - Organizational container (not rendered)

### Styling Elements (9 total)

Applied to visual elements only:
1. **Outline** - Border/stroke
2. **Corner** - Rounded corners
3. **List** - Vertical/horizontal list layout
4. **Grid** - Grid layout
5. **Aspect Ratio** - Maintain aspect ratio
6. **Constraint** - Size limits
7. **Gradient** - Color gradients
8. **Padding** - Internal spacing
9. **Text Size Constraint** - Size limits for text

**Note:** Each element (including styling and Non-Visual Elements) counts as 1 toward the limit.

### Element Properties

All visual elements share:
- Background Color
- Background Transparency
- Position (UDim2)
- Size (auto_y, auto_x, auto, UDim2)
- Anchor Point
- Rotation
- Layer (z-index)
- Visibility
- Order (if parented with a list)
- Tooltip
- Clips Descendants

**Specific Properties:**

**Text/Button/Link/Input:**
- Text content
- Font (Gotham, GothamBold, SourceSans, Roboto, etc.. The fonts available are the ones that Roblox provides on this site "https://create.roblox.com/store/fonts". When using fonts from their site you have to use the asset id not the name of the font.)
- Font Size ("scaled" or number)
- Font Weight (Thin, ExtraLight, Regular, Medium, SemiBold, Bold, ExtraBold, Heavy)
- Font Style (Normal, Italic)
- Horizontal Alignment (Left, Center, Right)
- Vertical Alignment (Top, Center, Bottom)
- Text Color
- Text Transparency (0-1)
- Line Height (0-3)
- Rich text support (https://create.roblox.com/docs/ui/rich-text)
- Text wrapping
- Text truncation (AtEnd, None, SplitWord)

**Button (additional):**
- Automatic Color

**Input (additional):**
- Placeholder
- Placeholder Color
- Editable (true/false)
- Multi-Line (true/false)

**Link (additional):**
- Reference (URL)
- Open in new tab (true/false)
- Automatic Color

**Donation (additional):**
- Robux Amount (any amount of robux)
- Transfer ID (post-purchase to identify what got bought)
- Automatic Color

**Avatar Item (additional):**
- Item ID (Roblox asset, only from avatar items)
- Automatic Color

**Scroller (additional):**
- Canvas Size (auto_x, auto_y, auto, UDim2)
- Scrollbar Color
- Scrollbar Transparency
- Scrollbar Thickness

**Image:**
- Image ID (Roblox asset)
- Image Transparency
- Tint
- Scale Type (Crop, Fit, Slice, Stretch, Tile)
  - When "Slice" - Slice Center, Slice Scale
  - When "Tile" - Tile Size (UDim2)
- Resample Mode (Default, Pixelated)

---

## Scripting System

### Core Concepts

**Scripts:**
- Element type that contains events and actions
- Can be placed anywhere in UI hierarchy
- Multiple scripts per page allowed
- Share global variables and functions

**Events (Triggers):**
- Start execution when conditions met
- Run in parallel with priority (closer to center = executes first)
- Canvas: 9992×9992 pixels (centered by default)
- Max 30 events per script
- Each event holds max 120 actions

**Actions (Blocks):**
- Execute sequentially within an event
- Total capacity: 3,600 per script (30 events × 120 actions)
- 16 action types (categories)

**Variables:**
- Dynamic typing (type changes with usage)
- Three scopes:
  - **Global**: `{varName}` - accessible by all scripts/events
  - **Object**: `{o!varName}` - accessible within same script
  - **Local**: `{l!varName}` - accessible within declaring event only
- Direct table entry access: `{table.entry}`, `{table.entry.subentry}`, `{array.1}`
- Referenced with `{}` in most fields (not needed for `<variable>` or `<table>` fields)

**Object References:**
- Scripts reference objects via **globalid** (not alias)
- Use `(parent)` to reference script's parent element
- Object variables store references dynamically

**Audio Variables:**
- Store audio instances
- Manipulated with Audio actions

**Field Types:**
- `<any>` - accepts anything (strings, numbers, tables, variables)
- `<string>` - converts to string
- `<number>` - converts to number (non-numeric → 0)
- `<object>` - element reference (globalid), object variable, or `(parent)`
- `<variable>` - variable name (no `{}` needed)
- `<table>` / `<array>` - table/array name
- `<tuple>` - expandable parameters (max 6)
- `<property>` - property name (see Properties Reference)
- `<key>` - keyboard key (PC only)
- `<id>` - Roblox asset ID
- `<userid>` - Roblox user ID
- `<function>` - function name
- Optional fields end with `?` (e.g., `<variable?>`)

**Special Behaviors:**
- Math actions are **mutable** (modify variable directly)
- Variables can be overwritten by subsequent actions
- No embedding expressions in fields - only raw values
- Scripts restart when page loads (use Cookies for persistence)
- Functions declared at runtime (no nesting, no recursion without delay)

---

## Events

### Event Types (9 total)

**🌐 When website loaded**
- Triggers when site fully loaded
- No parameters

**👆 When `<button>` pressed**
- Requires Button element
- `<button>` - button to monitor

**👆 When `<button>` right clicked**
- Requires Button element
- `<button>` - button to monitor

**⌨️ When `<key>` pressed**
- PC only (mobile can edit)
- `<key>` - keyboard key

**🖱️ When mouse enters `<object>`**
- Triggers on mouse enter
- `<object>` - any visual element

**🖱️ When mouse leaves `<object>`**
- Triggers on mouse leave
- `<object>` - any visual element

**🖱️ When mouse down on `<button>`**
- Triggers on mouse down
- `<button>` - button to monitor

**🖱️ When mouse up on `<button>`**
- Triggers on mouse up
- `<button>` - button to monitor

**💵 When `<donation>` bought**
- Triggers on purchase completion
- `<donation>` - Donation element

**💵 When donation completed**
- Triggers on purchase completion
- The completion progress can take a while

**⌨️ When `<input>` submitted**
- Triggers on Enter key press
- `<input>` - Input element

**🔄 When `<object>` changed**
- Triggers on object change
- `<object>` - any object, even works on the site itself

**🛜 When message received**
- Triggers on broadcast reception
- Auto-creates local variables:
  - `l!messageContent` - message text
  - `l!messageSenderId` - sender's user ID
  - `l!messageSenderName` - sender's username

**🛜 When cross-site message received**
- Triggers on cross-site broadcast reception
- Auto-creates local variables:
  - `l!sourceDomain` - sender's domain (e.g. catweb.rbx)
  - `l!messageContent` - message text
  - `l!messageSenderId` - sender's user ID
  - `l!messageSenderName` - sender's username


**⚡ Define function `<function>`**
- Creates reusable function
- `<function>` - function name (letters/numbers/symbols)
- Supports parameters via `variable_overrides` (become `l!param` variables)
- Called with Run function actions
  - Run function in background `<function>` `<tuple?>`
  - Run function `<function>` `<tuple?>` -> `<variable?>` (the function can return a value)
  - Run function protected `<function>` `<tuple?>` -> `<success_variable>` `<variable?>` (the function can return a value. `<success_variable>` will either be set to true or false depending on if the function ran successfully. If not `<variable?>` will be set to the error message.)   


---

## Actions

### Action Types (16 categories)

Actions formatted with emojis (see Script Formatting section).

---

### Console

**📄 Log `<any>`**
- Logs to console

**⚠️ Warn `<any>`**
- Logs yellow text to console

**❌ Error `<any>`**
- Logs error and stops event execution
- Only affects current event (other events continue)

---

### Logic

**💡 Wait `<number>` seconds**
- Pauses execution

**💡 If `<any>` is equal to `<any>`**
- Conditional execution (equality)

**💡 If `<any>` is not equal to `<any>`**
- Conditional execution (inequality)

**💡 If `<any>` is greater than `<any>`**
- Numeric comparison only

**💡 If `<any>` is greater or equal to `<any>`**
- Numeric comparison only

**💡 If `<any>` is lower than `<any>`**
- Numeric comparison only

**💡 If `<any>` is lower or equal to `<any>`**
- Numeric comparison only

**💡 If `<string>` contains `<string>`**
- String substring check

**💡 If `<string>` doesn't contain `<string>`**
- String not-contains check

**💡 If `<variable>` exists**
- Variable existence check

**💡 If `<variable>` doesn't exist**
- Variable non-existence check

**💡 If `<variable>` AND `<variable>`**
- AND gate (empty strings/zeroes = false)

**💡 If `<variable>` OR `<variable>`**
- OR gate (empty strings/zeroes = false)

**💡 If `<variable>` NOR `<variable>`**
- NOR gate (empty strings/zeroes = false)

**💡 If `<variable>` XOR `<variable>`**
- XOR gate (empty strings/zeroes = false)

**💡 else**
- Executes if previous condition false
- Place inside if block before `end`

---

### Loops

**Note:** No traditional for/while loops. Use Repeat actions with Break for conditional loops.

**🔁 Repeat `<number>` times**
- Fixed iteration count
- Can nest loops

**🔁 Repeat forever**
- Infinite loop
- Use with Break for conditional loops

**🔁 Break**
- Exits current loop
- Works with If blocks for conditional exit

---

### Looks

**✨ Make `<object>` invisible**
- Hides visual element

**✨ Make `<object>` visible**
- Shows visual element

**✨ Set `<object>` text to `<string>`**
- Updates text content

**✨ Set `<object>` image to `<id>`**
- Loads image at highest resolution
- Yields until loaded
- May fallback to thumbnail if rate-limited

**✨ Set `<object>` image to avatar of `<userid>` `<resolution?>`**
- Loads user avatar headshot
- Resolution: High (150×150), Medium (60×60), Low (48×48)
- Auto-selects if empty

**✨ Set `<property>` of `<object>` to `<any>`**
- Modifies object property (see Properties Reference)

**✨ Get `<property>` of `<object>` → `<variable>`**
- Retrieves object property
- Returns non-table values (use Split string for UDim2/pairs)

**✨ Get text from `<input>` → `<variable>`**
- Retrieves Input element text

**✨ Tween `<property>` of `<object>` to `<any>` - `<time>` `<style>` `<direction>`**
- Animates property over time (seconds)
- Styles: Linear, Sine, Back, Quad, Quart, Quint, Bounce, Elastic, Exponential, Circular, Cubic
- Directions: In, Out, InOut

**✨ Duplicate `<object>` → `<variable>`**
- Clones object to object variable
- Max 1,000 runtime objects

**✨ Delete `<object>`**
- Removes object from UI

**✨ If dark theme enabled**
- Conditional execution for dark mode

**✨ Get objects at position `<x>` `<y>` → `<array>`**
- Returns an array of all objects occupying the given screen position, sorted in the order they appear on-screen from top to bottom.

**✨ Get `<info>` of asset `<id>` → `<variable>`**
- Returns information about a Roblox asset using the provided item ID.
- This action performs a network request, may yield, and can fail if too many requests are sent or for other reasons. Consider using this in a protected function to catch any potential errors. Requesting asset information caches the result, so it is safe to call this further on the same asset to get more info.

**Get Product Info Limit (per page):**
- 5 product requests per 2 seconds
- Doesnt work on GamePasses or DeveloperProducts (due to roblox limitations)

---

### Hierarchy

**↕ Parent `<object>` under `<object>`**
- Changes parent-child relationship

**↕ Get parent of `<object>` → `<variable>`**
- Returns parent as object variable

**↕ Find ancestor named `<string>` in `<object>` → `<variable>`**
- Finds first ancestor with name
- Ancestor = any object containing this as descendant

**↕ Find child named `<string>` in `<object>` → `<variable>`**
- Finds first direct child with name

**↕ Find descendant named `<string>` in `<object>` → `<variable>`**
- Finds first descendant with name (recursive search)

**↕ Get children of `<object>` → `<table>`**
- Returns all direct children as table

**↕ Get descendants of `<object>` → `<table>`**
- Returns all descendants as table (recursive)

**↕ If `<object>` is ancestor of `<object>`**
- Conditional ancestry check

**↕ If `<object>` is child of `<object>`**
- Conditional direct child check

**↕ If `<object>` is descendant of `<object>`**
- Conditional descendant check

---

### Navigation

**🔗 Get URL → `<variable>`**
- Returns current URL with query parameters

**🔗 Redirect to `<string>`**
- Navigates to URL
- Supports query parameters: `example.rbx?first=true&second=value`
- No `catweb://` links
- ROBLOX filters may block invalid URLs

**🔗 Get query string parameter `<string>` → `<variable>`**
- Extracts parameter from URL
- Example: `example.rbx?first=true` → "first" returns "true"

---

### Math & Variables

**📝 Set variable `<variable>` to `<any>`**
- Creates/updates variable
- Supports all types (strings, numbers, tables, objects)
- Use scope prefixes: `o!name` (object), `l!name` (local)

**➕ Increase `<variable>` by `<number>`**
- Addition (mutable)
- Non-numeric variables → 0

**➖ Subtract `<variable>` by `<number>`**
- Subtraction (mutable)

**✖️ Multiply `<variable>` by `<number>`**
- Multiplication (mutable)

**➗ Divide `<variable>` by `<number>`**
- Division (mutable)

**🔢 Raise `<variable>` to the power of `<number>`**
- Exponentiation (mutable)
- Example: 2² = 4

**🔢 `<variable>` modulo `<number>`**
- Remainder operation (mutable)
- Example: 10 % 3 = 1

**🔢 Round `<variable>`**
- Rounds to nearest integer (mutable)
- 1.2→1, 1.5→2, 1.8→2

**🔢 Floor `<variable>`**
- Rounds down (mutable)
- 1.2→1, 1.5→1, 1.8→1

**🔢 Ceil `<variable>`**
- Rounds up (mutable)
- 1.2→2, 1.5→2, 1.8→2

**🔢 Run math function `<function>` `<tuple>` → `<variable>`**
- Executes Luau math library functions
- Special: Single non-numeric character → ASCII (e.g., "A"→65)
- Special values: `<function>` = "pi" or "huge" (ignore tuple)

**🔢 Set `<var>` to random `<n>` - `<n>`**
- Random integer in range (inclusive)

**🔢 Delete `<variable>`**
- Removes variable from memory

**Note:** Math actions modify input variable directly (no return).

---

### Audio

**🔊 Play audio `<id>` → `<variable?>`**
- Plays audio once
- Optional: store as audio variable

**🔊 Play looped audio `<id>` → `<variable?>`**
- Plays audio on loop
- Optional: store as audio variable

**🔊 Set volume of `<variable>` to `<number>`**
- Range: 0-10 (default: 0.5)
- `<variable>` must be audio variable

**🔊 Set speed of `<variable>` to `<number>`**
- Range: 0-20 (default: 1)
- `<variable>` must be audio variable

**🔊 Set `<property>` of `<variable>` to `<any>`**
- Modifies audio property
- See: [Roblox AudioPlayer Properties](https://create.roblox.com/docs/reference/engine/classes/AudioPlayer#properties)

**🔊 Get `<property>` of `<variable>` → `<variable>`**
- Retrieves audio property

**🔊 Stop audio `<variable>`**
- Stops playback (cannot resume)

**🔊 Pause audio `<variable>`**
- Pauses playback (can resume)

**🔊 Resume audio `<variable>`**
- Resumes paused audio

**🔊 Stop all audio**
- Stops all playing audio (cannot resume)

**Limits:** Max 150 concurrent playing sounds

---

### Input

**🖱️ If left mouse button down**
- Checks if left click/touch active
- Use in loops for fast detection

**🖱️ If middle mouse button down**
- Checks if middle click active

**🖱️ If right mouse button down**
- Checks if right click active

**🖱️ If `<key>` down**
- Checks if key held (not one-time press)
- Different from "When `<key>` pressed" event

**🖱️ Get viewport size → `<x>` `<y>`**
- Returns viewport dimensions in pixels
- Creates two variables

**🖱️ Get cursor position → `<x>` `<y>`**
- Returns cursor coordinates in pixels
- Creates two variables

---

### Network

**🛜 Broadcast `<message>` across page**
- Sends message to all players on current page
- Received by "When message received" event
- Uses ROBLOX MessagingService (same limitations)

**🛜 Broadcast `<message>` across site**
- Sends message to all players across entire site
- Received by "When message received" event

**Broadcast Limits (per page):**
- Max 979 bytes per message content
- Max 5 broadcasts per 2 seconds

**🛜 Broadcast `<message>` cross-site `<page>`**
- Sends message to all players across entered site
- Received by "When cross-sitemessage received" event

**Cross-site Broadcast Limits (per page):**
- Max 979 bytes per message content
- Cross-Site Broadcasts (Uncached) - 4 broadcasts per 20 seconds
- Site Broadcasts (Cached) - 5 broadcasts per 2 seconds

**🛜 Get local username → `<variable>`**
- Returns visitor's ROBLOX username

**🛜 Get local display name → `<variable>`**
- Returns visitor's display name

**🛜 Get local user ID → `<variable>`**
- Returns visitor's user ID

---

### Cookies

**Requires Cookies Gamepass ($0.35 USD / 35 Robux)**

**🍪 Set `<cookie>` to `<any>`**
- Stores data locally (persistent across visits)
- Accepts tables, strings, numbers (not objects)
- 10kB limit per site

**🍪 Increase `<cookie>` by `<number>`**
- Increments numeric cookie
- Creates cookie if doesn't exist

**🍪 Delete `<cookie>`**
- Removes cookie

**🍪 Get cookie `<cookie>` → `<variable>`**
- Retrieves cookie value

**Performance:** ~1 cookie creation per 0.05s

---

### Time

**🕔 Get unix timestamp → `<variable>`**
- Seconds since January 1, 1970 (local)
- Can be falsified by system settings

**🕔 Get server unix timestamp → `<variable>`**
- Seconds since January 1, 1970 (server)
- Yields (requests server)
- Cannot be falsified

**🕔 Get tick → `<variable>`**
- Seconds since January 1, 1970 with decimals

**🕔 Get timezone → `<variable>`**
- Returns UTC offset in hours
- Example: 1 = UTC+1, -1 = UTC-1, 0 = UTC

**🕔 Format current date/time `<format>` → `<variable>`**
- Formats local timestamp
- `LT` or `LTS` = current time
- `LL` = current date
- See: [Roblox DateTime Formatting](https://create.roblox.com/docs/reference/engine/datatypes/DateTime)

**🕔 Format from unix `<number>` `<format>` → `<variable>`**
- Formats timestamp from unix seconds (local)

---

### Color

**🎨 Convert `<hex>` to RGB → `<variable>`**
- Hex → RGB string
- Example: "#ff00aa" → "255, 0, 170"
- Leading `#` ignored

**🎨 Convert `<hex>` to HSV → `<variable>`**
- Hex → HSV values

**🎨 Convert `<RGB>` to hex → `<variable>`**
- RGB → hex code

**🎨 Convert `<HSV>` to hex → `<variable>`**
- HSV → hex code

**🎨 Lerp `<hex>` to `<hex>` by `<alpha>` → `<variable>`**
- Linear interpolation between colors
- `<alpha>`: 0-1 (0 = first color, 1 = second color)
- Example: "#ff0000" to "#0000ff" by 0.5 = "#800080"

---

### Strings

**Tt Sub `<variable>` `<start>`-`<end>`**
- Extracts substring (mutable)
- Example: "hello" sub 2-4 → "ell"

**Tt Replace `<string>` in `<variable>` by `<string>`**
- Find-replace (mutable)
- Example: "Hello world" replace "world" with "there" → "Hello there"

**Tt Get length of `<string>` → `<variable>`**
- Returns byte length
- Example: "hello" = 5, "hello 😀" = 10 (emoji = 4 bytes)

**Tt Split string `<string>` `<separator>` → `<table>`**
- Splits into table
- Example: "hello/world" split "/" → {"hello", "world"}

**Tt Lower `<string>` → `<variable>`**
- Converts to lowercase
- Example: "HELLO" → "hello"

**Tt Upper `<string>` → `<variable>`**
- Converts to uppercase
- Example: "hello" → "HELLO"

**Tt Concatenate `<string>` with `<string>` → `<variable>`**
- Combines strings
- Note: `Set {var} to {var} extra text` is slightly faster (~0.01-0.1s)

**Escape Sequences:**
- Standard: `\n` (newline), `\t` (tab), etc.
- ASCII Hex: `\xXX` (max `\x7F` / 127)
- Unicode Hex: `\u{XXXX}` (e.g., `\u{2605}` = ★)

---

### Tables

**☰ Create table `<table>`**
- Creates empty table
- Key-value pairs OR array (not both)

**CRITICAL:** Setting index 1 converts to array permanently (no more key-value pairs).

**☰ Set entry `<entry>` of `<table>` to `<any>`**
- Sets key-value pair or array element

**☰ Set entry `<entry>` of `<table>` to `<object>`**
- Stores object variable in table

**☰ Get entry `<entry>` of `<table>` → `<variable>`**
- Retrieves table entry

**☰ Delete entry `<entry>` of `<table>`**
- Removes table entry

**☰ Insert `<any>` at position `<number?>` of `<array>`**
- Adds to array
- Position optional (default: end)

**☰ Remove entry at position `<number?>` of `<array>`**
- Removes from array
- Position optional (default: last)

**☰ Get length of `<table>` → `<variable>`**
- Returns entry count (arrays only)

**☰ Iterate through `<table>` ({l!index},{l!value})**
- Loops through table
- Auto-creates `l!index` and `l!value` (fixed names)

**☰ Join `<array>` using `<string>` → `<variable>`**
- Joins array with separator
- Example: {"hello","world","test"} join "|" → "hello|world|test"

**Direct Entry Access:**
- Use dot notation in variables: `{table.entry}`
- Works with nesting: `{table.entry.subentry}`
- Works with arrays: `{array.1}`

---

### Functions

**⚡ Run function in background `<function>` `<tuple>`**
- Executes function without waiting
- No return value
- Continues immediately

**⚡ Run function `<function>` `<tuple>` → `<variable?>`**
- Executes function and waits
- Optional return value

**⚡ Run function protected `<function>` `<tuple>` → `<success_variable>` `<variable?>`**
- Executes function and waits
- If the function fails (errors), it will set `<success_variable>` to false and `<variable?>` to the error message. If the function succeeds, it will set `<success_variable>` to true and `<variable?>` to the return value of the function, if there is one.

**⚡ Return `<any>`**
- Returns value from function
- Stops execution (like Error but no output)
- Can also be used outside of functions

**Note:** Major overhead when calling functions repeatedly. Normal scripts: ~10k+ actions/sec. Function loops: ~75-95% of normal scripts. Loops INSIDE functions are fine.

---

## Properties Reference

Properties for Get/Set/Tween actions. Not all properties work with all actions.

### Legend
- **(Get)** - Read-only, Get action only
- **(Get, Set)** - Get and Set actions
- **(Get, Set, Tween)** - All three actions
- **(Element-specific)** - Limited to certain element types

### Complete Property List

| Property | Actions | Notes |
|----------|---------|-------|
| Absolute Position | (Get) | Returns "X, Y" string - use Split string |
| Absolute Size | (Get) | Returns "X, Y" string - use Split string |
| Alias | (Get, Set) | Element name |
| Anchor Point | (Get, Set, Tween) | UDim2 format |
| Automatic Color | (Get, Set) | Boolean - TextButton only |
| Background Color | (Get, Set, Tween) | Hex string |
| Background Transparency | (Get, Set, Tween) | 0-1 |
| Bottom Padding | (Get, Set, Tween) | UDim format |
| Canvas Position | (Get, Set, Tween) | UDim2 - ScrollingFrame only |
| Canvas Size | (Get, Set, Tween) | UDim2 - ScrollingFrame only |
| Cell Padding | (Get, Set, Tween) | UDim2 - UIGridLayout only |
| Cell Size | (Get, Set, Tween) | UDim2 - UIGridLayout only |
| Clips Descendants | (Get, Set) | Boolean |
| Content Text | (Get) | Read-only text content |
| Cursor Position | (Get) | Integer - TextBox only |
| Direction | (Get, Set) | UIListLayout only |
| Editable | (Get, Set) | Boolean - TextBox only |
| Font | (Get, Set) | Font name |
| Font Style | (Get, Set) | Normal, Italic |
| Font Weight | (Get, Set) | Regular, Medium, Bold |
| Horizontal Alignment | (Get, Set) | Left, Center, Right |
| Icon | (Get, Set) | String |
| Image ID | (Get, Set) | Roblox asset ID |
| Image Rect Offset | (Get, Set, Tween) | Vector2 string |
| Image Rect Size | (Get, Set, Tween) | Vector2 string |
| Image Transparency | (Get, Set, Tween) | 0-1 - ImageLabel only |
| Is Loaded | (Get) | Read-only boolean - ImageLabel only |
| Item ID | (Get, Set) | Donation element only |
| Layer | (Get, Set) | Z-index integer |
| Left Padding | (Get, Set, Tween) | UDim format |
| Line Height | (Get, Set, Tween) | Number |
| List Padding | (Get, Set, Tween) | UDim - UIListLayout only |
| Max Visible Graphemes | (Get, Set, Tween) | Integer - text elements |
| Maximum Size | (Get, Set, Tween) | Vector2 - UISizeConstraint only |
| Minimum Size | (Get, Set, Tween) | Vector2 - UISizeConstraint only |
| Minimum Text Size | (Get, Set) | Integer - UITextSizeConstraint only |
| Maximum Text Size | (Get, Set) | Integer - UITextSizeConstraint only |
| Name | (Get, Set) | Internal element name |
| Offset | (Get, Set, Tween) | Vector2 - UIGradient only |
| Order | (Get, Set) | Layout order integer |
| Outline Color | (Get, Set, Tween) | Hex - UIStroke only |
| Outline Thickness | (Get, Set, Tween) | Number - UIStroke only |
| Outline Transparency | (Get, Set, Tween) | 0-1 - UIStroke only |
| Placeholder | (Get, Set) | String - TextBox only |
| Placeholder Color | (Get, Set, Tween) | Hex - TextBox only |
| Position | (Get, Set, Tween) | UDim2 format |
| Product Type | (Get, Set) | Donation element only |
| Radius | (Get, Set, Tween) | UDim - UICorner only |
| Ratio | (Get, Set) | Number - UIAspectRatioConstraint only |
| Reference | (Get, Set) | URL string - Link/Donation |
| Resample Mode | (Get, Set) | ImageLabel only |
| Rich | (Get, Set) | Boolean - rich text |
| Right Padding | (Get, Set, Tween) | UDim format |
| Rotation | (Get, Set, Tween) | Degrees |
| Scale Type | (Get, Set) | ImageLabel only |
| Selection Start | (Get, Set) | Integer - TextBox only |
| Size | (Get, Set, Tween) | UDim2 format |
| Slice Center | (Get, Set) | Rect - ImageLabel only |
| Slice Scale | (Get, Set, Tween) | Number - ImageLabel only |
| Sort Order | (Get, Set) | Layout elements only |
| Stroke Mode | (Get, Set) | UIStroke only |
| Text | (Get, Set) | Text content |
| Text Bounds | (Get) | Read-only Vector2 - actual text size |
| Text Color | (Get, Set, Tween) | Hex string |
| Text Size | (Get, Set, Tween) | Number |
| Text Transparency | (Get, Set, Tween) | 0-1 |
| Tile Size | (Get, Set, Tween) | UDim2 - ImageLabel only |
| Tint | (Get, Set, Tween) | Hex - ImageLabel only |
| Title | (Get, Set) | String |
| Tooltip | (Get, Set) | String |
| Top Padding | (Get, Set, Tween) | UDim format |
| Truncate Text | (Get, Set) | Boolean |
| Vertical Alignment | (Get, Set) | Top, Center, Bottom |
| Visible | (Get, Set) | Boolean |
| Wrap List | (Get, Set) | Boolean - UIListLayout only |
| Wrap Text | (Get, Set) | Boolean |

### Property Notes

**UDim2 Properties (Position, Size, etc.):**
- Get action returns as string, not table
- Use Split string to extract values
- Example: Position returns "{0.5,100},{0.3,-50}"

**Absolute Size/Position:**
- Return "X, Y" format (e.g., "1920, 1080")
- Use Split string with ", " separator to get usable values

**Tween Limitations:**
- Some properties don't tween smoothly (e.g., boolean values)
- Complex types (UDim2) may have unexpected behavior
- Test tweens before relying on them

---

## Script Formatting

When generating scripts, use emoji formatting for clarity.

### Action Type Emojis

| Action Type | Emoji | Notes |
|-------------|-------|-------|
| Console | 📄 (Log), ⚠️ (Warn), ❌ (Error) | Specific per action |
| Logic | 💡 | All actions |
| Loops | 🔁 | All actions |
| Looks | ✨ | All actions |
| Hierarchy | ↕ | All actions |
| Navigation | 🔗 | All actions |
| Math & Variables | 📝 (Set), ➕ (Increase), ➖ (Subtract), ✖️ (Multiply), ➗ (Divide), 🔢 (Others) | Specific emojis for common math |
| Audio | 🔊 | All actions |
| Input | 🖱️ | All actions |
| Network | 🛜 | All actions |
| Cookies | 🍪 | All actions |
| Time | 🕔 | All actions |
| Color | 🎨 | All actions |
| Strings | Tt | Not an emoji |
| Tables | ☰ | All actions |
| Functions | ⚡ | All actions |

### Event Emojis

| Event | Emoji |
|-------|-------|
| When website loaded | 🌐 |
| When `<button>` pressed | 👆 |
| When `<button>` right clicked | 👆 |
| When `<key>` pressed | ⌨️ |
| When mouse enters `<object>` | 🖱️ |
| When mouse leaves `<object>` | 🖱️ |
| When mouse down on `<button>` | 🖱️ |
| When mouse up on `<button>` | 🖱️ |
| When `<donation>` bought | 💵 |
| When donation completed | 💵 |
| When `<input>` submitted | ⌨️ |
| When `<object>` changed | 🔄 |
| When message received | 🛜 |
| When cross-site message received | 🛜 |
| Define function `<function>` | ⚡ |

### Formatting Example

```
🌐 When website loaded
  📝 Set variable <counter> to <0>
  🔁 Repeat <10> times
    ✨ Set <Text> of <ScoreLabel> to <{counter}>
    ➕ Increase <counter> by <1>
    💡 Wait <1> seconds
  🔁 end
```

### Best Practices

**DO:**
- Use clear placeholder names (e.g., "SubmitButton", "WelcomeText")
- Remind users to link placeholders to actual objects
- Tell users to add missing objects if needed
- Use emoji formatting consistently
- Inform users about Cookies gamepass requirement when needed
- Ask for confirmation when using premium features

**DON'T:**
- Over-simplify unless asked
- Use non-CatWeb features
- Assume external coding/APIs
- Optimize beyond CatWeb's system

---

## Tips & Tricks

### Performance Optimization

**Script Performance:**
- Normal barebone script: ~10k actions/second
- Function calls in loops: ~100-500 actions/second (major overhead)
- Loops INSIDE functions: perfectly fine
- Performance depends on user's machine (scripts run locally)

**Object Variables vs Find Child:**
- Store frequently accessed objects in variables
- Avoid repeated search operations

**Layout Optimization:**
- Use `order` property with layouts
- Don't manually position everything

### Data Management

**Variable Limits:**
- Total: 5MB per page
- Exceeding throws error

**Cookies Storage:**
- 10kB per site
- Fast creation: ~1 per 0.05s
- Exceeding throws error

**Long Arrays:**
- Use Split string function to create from delimiter-separated strings
- More efficient than individual inserts

### Broadcasting

**Broadcast Limits (per page):**
- 979 bytes per message content (down from 700)
- 5 broadcasts per 2 seconds (down from 8 per 10s)
- Uses ROBLOX MessagingService foundation
- Messages automatically tagged by system

**Cross-site Broadcast Limits (per page):**
- Max 979 bytes per message content
- Cross-Site Broadcasts (Uncached) - 4 broadcasts per 20 seconds
- Site Broadcasts (Cached) - 5 broadcasts per 2 seconds

**Best Practices:**
- Keep messages concise
- Don't spam broadcasts
- Consider page vs site scope

### Get Product Info

**Get Product Info Limit (per page):**
- 5 product requests per 2 seconds
- Doesnt work on GamePasses or DeveloperProducts (due to roblox limitations)

### Custom Encoders

**Number Bypass:**
- Numbers aren't censored in CatWeb
- Valid website domains also uncensored (except parameters)
- ASCII conversion: `Run math function floor` on single character → ASCII code
- Example: "A" → 65
- Used for large dictionaries/lists that would be censored

### Table Behavior

**Critical Conversion:**
- Setting index 1 permanently converts table to array
- Can't add key-value pairs after array conversion
- Plan data structure carefully

### Special Pages

**Recently Added:**
- 404 (Not Found)
- 403 (Private Page / Banned)
- Replaces old overlay system for banned visitors

### Server-Side Scripting

**Developer Statement:**
- Server-side scripting will NOT be added
- Datastores will NOT be added
- Decision for security and exploit prevention

### Escape Sequences

**Supported:**
- Standard: `\n`, `\t`, etc.
- ASCII Hex: `\xXX` (max `\x7F`)
- Unicode Hex: `\u{XXXX}` (e.g., `\u{2605}` = ★)

### Audio Limits

- Max 150 concurrent playing sounds
- Use Stop all audio to clear

### Element Organization

**Folders:**
- Don't count toward render limit
- Still count toward element limit
- Use for organization

**Nesting Depth:**
- No hard limit
- Keep reasonable for performance

### JSON Import Behavior

**globalid Regeneration:**
- All globalids regenerate on import
- Breaks script references if UI + scripts split
- **Always keep UI + scripts in ONE JSON file**

### Object Reference Strategy

**Best Practice:**
- Use `(parent)` for scripts operating within parent
- Avoids hardcoded globalid references
- More maintainable when restructuring

---

## Limits Summary

| Item | Free | Premium |
|------|------|---------|
| Elements | 100 | 200 |
| Sites | 1 | 3 |
| Subdomains | 3 | 5 |
| Pages | 15 | 30 |
| Variables | 5MB | 5MB |
| Cookies | N/A* | N/A* |
| Runtime Objects | 1000 | 1000 |
| Actions per Event | 120 | 120 |
| Events per Script | 30 | 30 |
| Actions per Frame | 400 | 400 |
| Tuple Parameters | 6 | 6 |
| Playing Sounds | 150 | 150 |
| Broadcast Size | 979 bytes | 979 bytes |
| Broadcast Rate | 5/2s (page) | 5/2s (page) |
| Cross-site Broadcast Size | 979 bytes | 979 bytes |
| Cross-site Broadcast Rate | 5/20s (Uncached) 5/2s (Cached) | 5/20s (Uncached) 5/2s (Cached) |

*Requires Cookies gamepass (separate purchase)

---

## Cross-References

- **UI JSON Structure:** CatWeb UI JSON Spec - Complete element and styling reference
- **Script JSON Format:** json-rulings.md - Pairs with this document for JSON generation
- **Roblox Resources:** 
  - [AudioPlayer Properties](https://create.roblox.com/docs/reference/engine/classes/AudioPlayer#properties)
  - [DateTime Formatting](https://create.roblox.com/docs/reference/engine/datatypes/DateTime)

---

## Version History

**v2.17.3.0:** `<-- Newest`
- Added Donation element as well as an Avatar Item element
- Legacy Donation element got deprecated: Legacy Donation element. If you currently sell passes or developer products within your website, make sure to migrate to the Donation or Avatar Item element before May 29th.

**v2.17.2.0:**
- Object Scope Functions: `o!<functionName>`
- Milestone Badges: Earn Milestone Badges for every year youre on CatWeb
- Script Search & Jump to Error
- Uploads: Easily share elements, or an page with a 6 character code, instantly without tags.
- Ads Portal & Discover Ads

---

## Final Notes

**For AI Assistants:**
- Use this document as primary CatWeb reference
- Pair with json-rulings.md for JSON generation
- UI JSON Spec provides element structure details
- Never assume features not documented here
- Ask for clarification on ambiguous requests
- Inform users of gamepass requirements
- Remind users to link object references
- Keep UI + scripts in single JSON

**For Users:**
- This is the complete CatWeb scripting reference
- Check Tips & Tricks for advanced techniques
- Report outdated information to developers
- Join community for support and examples