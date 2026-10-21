# CatDocs - CatWeb Complete Reference (v2.18.3.1)

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

**CatWeb** is a Roblox game where players can create 2D websites using JSON-based UI and a visual block-based scripting system. The user interface visually represents a web browser environment.

**Current Version:** v2.18.3.1 (with Unlimited Update rollouts)  
**TLD:** `.rbx` (CatWeb-specific, not real internet)

### Cross-References
- **UI JSON Structure:** See [UIGPT.md](UIGPT.md)
- **Script JSON Format & Authoritative Blocks:** See [JSONScript.md](JSONScript.md)
- **Assets, Icons, Sounds & Patterns:** See [Assets.md](Assets.md)

---

## CatWeb Basics

### Platform Features & Limits

**Runtime Object Limit:**
- **2,000 objects** (increased from 1,000 in v2.18.3.0) created dynamically by scripts during execution.

**Element & Cost Limits:**
- **Legacy Object Limit:** 100 elements (Free) / 400 elements (Premium).
- **Cost Limit Transition (Unlimited Update):** The fixed object limits (100 / 400) are being replaced by a unified **Cost Limit** based on total elements, styling elements, script events, and script actions.
  - Effectively allows **unlimited elements (∞)** within a balanced site cost budget.
  - **Exceeding Cost Limit:** You can still freely edit and collaborate on your website, but publishing is blocked until brought back within cost limits. The editor only halts if exceeded by a massive margin.
  - **Tripled Script Limits:** Individual event limit per script tripled from 30 → **90 events**, and action limit per event tripled from 120 → **360 actions** (up to 32,400 total script actions).
  - **Rollout:** Premium members receive immediate access at launch, with full rollout to all players over subsequent weeks.

**Free Tier:**
- Standard Cost Limit budget (previously 100 elements)
- 1 free site
- 3 subdomains
- 15 pages per site

**Premium ($3.74 USD / 299 Robux):**
- Early access to new Cost Limit (previously 400 element limit)
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

### Sharing Elements / Pages

**Export via Upload (Default):**
- Uploads are now the **default option** when exporting or importing elements in the editor.
- Generates a unique 6-character code that can be shared and imported without moderation tagging issues.
- You can assign a custom name to your upload (max 50 characters).
- Track usage statistics showing how many times your upload code was imported.

**Export via JSON:**
- Exports raw JSON snippet or site object.
- Trailing and leading whitespace is stripped automatically upon import.
- Useful for external backup and direct code generation.

### Ads Portal

- **Campaign Management:** Previously created campaigns can now be renamed directly inside Ads Portal.
- **Custom Starter Bids:** Choose initial bids when creating an ad campaign.
- **Metrics:** Click-Through Rate (CTR) is rounded to the nearest decimal.
- **Discover Ads:** Fully released for community promotion.

---

## UI Elements

### Element Types (12 total)

**Visual Elements:**
1. **Frame** - Basic container (`Frame`)
2. **Text** - Display text (`TextLabel`, 20k char render limit, 200k total for every object displaying text)
3. **Image** - Display static images (`ImageLabel`)
4. **Link** - Clickable text URL button (`TextButton?link`)
5. **Button** - Interactive text button (`TextButton`)
6. **Donation** - Prompt Robux transfer button (`TextButton?transfer`; the class is never `TextButton?donation`, "Donation" is only its default label)
7. **Avatar Item** - Prompt avatar item purchase button (`TextButton?avataritem`)
8. **Input** - Text input field (`TextBox`)
9. **Scroller** - Scrollable container (`ScrollingFrame`)
10. **Image Button** - Interactive clickable image button (`ImageButton`)
11. **Image Link** - Clickable image URL link button (`ImageButton?link`)

**Non-Visual Elements:**
12. **Script** - Contains scripting logic (`script`)
13. **Folder** - Organizational container (not rendered, `Folder`)

### Styling Elements (9 total)

Applied to visual elements only:
1. **Outline** - Border/stroke (`UIStroke`)
2. **Corner** - Rounded corners (`UICorner`)
3. **List** - Vertical/horizontal list layout (`UIListLayout`)
4. **Grid** - Grid layout (`UIGridLayout`)
5. **Aspect Ratio** - Maintain aspect ratio (`UIAspectRatioConstraint`)
6. **Constraint** - Size limits (`UISizeConstraint`)
7. **Gradient** - Color gradients (`UIGradient`)
8. **Padding** - Internal spacing (`UIPadding`)
9. **Text Size Constraint** - Size limits for text (`UITextSizeConstraint`)

**Note:** In the new Cost Limit system, each element (visual, styling, and non-visual) contributes toward the site's overall cost budget.

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
- Tooltip (supported on interactive/content elements; throws script error if accessed on unsupported elements)
- Clips Descendants
- Mouse Icon (custom cursor asset ID or preset displayed when hovering over the element)

**Specific Properties:**

**Text/Button/Link/Input:**
- Text content
- Font (Gotham, GothamBold, SourceSans, Roboto, etc. When using fonts from Roblox, use the asset ID: `https://create.roblox.com/store/fonts`)
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

**Button & Image Button (additional):**
- Automatic Color (boolean, supported on Button, Image Button, Link, Image Link)

**Image / Image Button / Image Link:**
- Image ID (Roblox asset ID)
- Image Transparency
- Tint / Image Color
- Scale Type (Crop, Fit, Slice, Stretch, Tile)
  - When "Slice" - Slice Center, Slice Scale
  - When "Tile" - Tile Size (UDim2)
- Resample Mode (Default, Pixelated)
- Rect Offset, Rect Size
- Is Loaded (Get property: boolean indicating whether the asset has finished loading)

**Input (additional):**
- Placeholder
- Placeholder Color
- Editable (true/false)
- Multi-Line (true/false)

**Link & Image Link (additional):**
- Reference (URL string - can be set or reset using `Set property`)
- Open in new tab (true/false)
- Automatic Color

**Donation (additional):**
- Robux Amount (default: `50`, scriptable amount of Robux to transfer)
- Identifier (tracking string identifier for purchase callback)
- Transfer ID (post-purchase to identify what got bought)
- Automatic Color

**Avatar Item (additional):**
- Item ID (Roblox asset ID, only for avatar items)
- Automatic Color

**Scroller (additional):**
- Canvas Size (auto_x, auto_y, auto, UDim2)
- Scrollbar Color
- Scrollbar Transparency
- Scrollbar Thickness

---

## Scripting System

### Core Concepts

**Scripts:**
- Element type that contains events and actions (`"class": "script"`)
- Can be placed anywhere in UI hierarchy
- Multiple scripts per page allowed
- Share global variables and functions
- Runtime object creation limit: **2,000 objects**

**Events (Triggers):**
- Start execution when conditions met
- Run in parallel with priority (closer to center `5000, 5000` = executes first)
- Canvas: 9992×9992 pixels (centered by default)
- Limit: **90 events per script** (tripled from 30 in Unlimited Update)
- Each event holds max **360 actions** (tripled from 120 in Unlimited Update)

**Actions (Blocks):**
- Execute sequentially within an event
- Total capacity: up to **32,400 actions per script** (90 events × 360 actions)
- 16 action types (categories)
- New Script Editor features include updated suggestions menu and empty `<any>` field support in `Set property`

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

**⚡ Run function `<function>` `<tuple>` → `<variable?>`**
- Executes function and yields until return
- Optional return value
- **Strict Mode (v2.18.3.0+):** Throws a fatal script error if the target function is not found.
- **Compatibility Mode (Deprecated variant):** Emits a console warning if the function is not found, allowing execution to continue.

**⚡ Run function in background `<function>` `<tuple>`**
- Executes function asynchronously without yielding
- No return value; continues immediately
- **Strict Mode (v2.18.3.0+):** Errors if the function is not found.
- **Compatibility Mode (Deprecated variant):** Warns if the function is not found.

**⚡ Run function protected `<function>` `<tuple>` → `<success_variable>` `<variable?>`**
- Executes function and yields safely
- If the function errors or fails: sets `<success_variable>` to `false` and `<variable?>` to the error message.
- If the function succeeds: sets `<success_variable>` to `true` and `<variable?>` to the function's return value (if any).
- **Strict Mode (v2.18.3.0+):** Errors if the function is not defined.
- **Compatibility Mode (Deprecated variant):** Warns if the function is not defined.

**⚡ Return `<any>`**
- Returns value from function
- Stops execution (like Error but without logging an error message)
- Can also be used outside functions to terminate event execution early

**Note:** Functions are compiled into native representations under Script Compilation. Functions called in rapid succession have minimal overhead compared to legacy interpreters, but loops inside functions remain the most efficient pattern.

---

## Properties Reference

Properties for Get/Set/Tween actions. Not all properties work with all actions.
- **Set Property Value Slot:** The `Set property` action accepts an empty `<any>` field (as of v2.18.3.1).
- **Page Properties:** Using `Set property`, `Get property`, or `Tween property` on the Page (`Title`, `Icon`) strictly throws an error if the property does not exist on the Page.
- **Tooltip Property:** Restricted to supported elements; accessing `Tooltip` via script on an unsupported element throws a script error.

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
| Automatic Color | (Get, Set) | Boolean - TextButton, ImageButton, Link, ImageLink, Donation, Avatar Item |
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
| Font | (Get, Set) | Font name or font asset ID |
| Font Style | (Get, Set) | Normal, Italic |
| Font Weight | (Get, Set) | Regular, Medium, Bold |
| Horizontal Alignment | (Get, Set) | Left, Center, Right |
| Icon | (Get, Set) | String (Page favicon or element icon) |
| Identifier | (Get, Set) | String - Donation element tracking identifier |
| Image ID | (Get, Set) | Roblox asset ID |
| Image Rect Offset | (Get, Set, Tween) | Vector2 string |
| Image Rect Size | (Get, Set, Tween) | Vector2 string |
| Image Transparency | (Get, Set, Tween) | 0-1 - ImageLabel, ImageButton, ImageLink |
| Is Loaded | (Get) | Read-only boolean - ImageLabel, ImageButton, ImageLink |
| Item ID | (Get, Set) | Roblox asset ID - Avatar Item element only |
| Layer | (Get, Set) | Z-index integer |
| Left Padding | (Get, Set, Tween) | UDim format |
| Line Height | (Get, Set, Tween) | Number |
| List Padding | (Get, Set, Tween) | UDim - UIListLayout only |
| Max Visible Graphemes | (Get, Set, Tween) | Integer - text elements |
| Maximum Size | (Get, Set, Tween) | Vector2 - UISizeConstraint only |
| Minimum Size | (Get, Set, Tween) | Vector2 - UISizeConstraint only |
| Minimum Text Size | (Get, Set) | Integer - UITextSizeConstraint only |
| Maximum Text Size | (Get, Set) | Integer - UITextSizeConstraint only |
| Mouse Icon | (Get, Set) | Asset ID string - custom mouse cursor when hovering over element |
| Name | (Get, Set) | Internal element name |
| Offset | (Get, Set, Tween) | Vector2 - UIGradient only |
| Order | (Get, Set) | Layout order integer |
| Outline Color | (Get, Set, Tween) | Hex - UIStroke only |
| Outline Thickness | (Get, Set, Tween) | Number - UIStroke only |
| Outline Transparency | (Get, Set, Tween) | 0-1 - UIStroke only |
| Placeholder | (Get, Set) | String - TextBox only |
| Placeholder Color | (Get, Set, Tween) | Hex - TextBox only |
| Position | (Get, Set, Tween) | UDim2 format |
| Product Type | (Get, Set) | Legacy Donation element only |
| Radius | (Get, Set, Tween) | UDim - UICorner only |
| Ratio | (Get, Set) | Number - UIAspectRatioConstraint only |
| Reference | (Get, Set) | URL string - Link, ImageLink (resettable via Set property) |
| Resample Mode | (Get, Set) | ImageLabel, ImageButton, ImageLink |
| Rich | (Get, Set) | Boolean - rich text |
| Right Padding | (Get, Set, Tween) | UDim format |
| Robux Amount | (Get, Set) | Integer - Donation element (defaults to 50 Robux) |
| Rotation | (Get, Set, Tween) | Degrees |
| Scale Type | (Get, Set) | ImageLabel, ImageButton, ImageLink |
| Selection Start | (Get, Set) | Integer - TextBox only |
| Size | (Get, Set, Tween) | UDim2 format |
| Slice Center | (Get, Set) | Rect - ImageLabel, ImageButton, ImageLink |
| Slice Scale | (Get, Set, Tween) | Number - ImageLabel, ImageButton, ImageLink |
| Sort Order | (Get, Set) | Layout elements only |
| Stroke Mode | (Get, Set) | UIStroke only |
| Text | (Get, Set) | Text content |
| Text Bounds | (Get) | Read-only Vector2 - actual text size |
| Text Color | (Get, Set, Tween) | Hex string |
| Text Size | (Get, Set, Tween) | Number |
| Text Transparency | (Get, Set, Tween) | 0-1 |
| Tile Size | (Get, Set, Tween) | UDim2 - ImageLabel, ImageButton, ImageLink |
| Tint | (Get, Set, Tween) | Hex - ImageLabel, ImageButton, ImageLink |
| Title | (Get, Set) | String (Page title) |
| Tooltip | (Get, Set) | String (supported interactive elements only) |
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

### Persistent / Cross-User Data (Relay Account)

CatWeb has no server-side storage: variables and tables are per visitor and reset on refresh, and cookies are per visitor. To save data across sessions or share it **between** users, simulate a backend with an **always-online alt account** parked on one fixed page (e.g. `api.<site>.rbx`) that acts as a relay. Only build this when the site really needs shared state (leaderboards, global counters, saves, live presence).

> [!IMPORTANT]
> **Prerequisite:** the site owner must keep that Roblox account online on that page 24/7. Without it there is no datastore.

- **Store = the alt's cookies** (`34` set, `36` get, `35` increase, `62` delete): persistent, ~10 KB total. Never use variables or tables as the store; they vanish on a crash or update.
- **Transport = broadcasts.** `Broadcast across page` (`32`) in both directions. The alt listens with `When message received` (`9`), which exposes `{messageContent}`, `{messageSenderName}` and `{messageSenderId}`. Messages are capped at 979 bytes; chunk anything larger.
- **Protocol:** prefix every message with a one-character op code and use `|` as separator: `<op>|<key>|<value>`, with `G` get, `P` post, `R` reply, `H` heartbeat.
- **Keep payloads numeric** (`P|7|500`). Broadcast content really does pass through the filter; digits and spaces don't get tagged. Payloads with letters (a username, free text) need the decoder ([Assets.md](Assets.md) §4).

**POST** (client saves): the client broadcasts `P|<key>|<value>`. The alt's `When message received` splits `{messageContent}` by `|` (`57`), reads entry 1 as the op (`56`), and on `If op is equal to "P"` (`18`) reads entries 2 and 3 and sets the cookie `{messageSenderName}_{key}` to the value (`34`), then `end` (`25`).

**GET** (client reads): the client broadcasts `G|<key>`. The alt reads cookie `{messageSenderName}_{key}` (`36`) and replies `R|<key>|<value>` (`32`). The client's own `When message received` filters for the `R` prefix and updates its UI.

**Online check**, either: **pull** (client sends `H`, marks the server offline if no `H` reply arrives within ~5 s) or **push** (the alt broadcasts `H` every ~3 s; clients mark it offline after ~5 s of silence, which costs fewer requests).

> [!CAUTION]
> **Security is mandatory.** Every visitor on the page sees every broadcast and can forge any request. The alt must key all data by `{messageSenderName}`, **never** trust a username inside the payload, and drop malformed or oversized messages. Concurrent POSTs to one key are last-write-wins, so keep keys per user.

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
| Elements | Cost limit (legacy: 100) | Cost limit (legacy: 400) |
| Recommended elements per page | < 500 | < 500 |
| Sites | 1 | 3 |
| Subdomains | 3 | 5 |
| Pages | 15 | 30 |
| Variables | 5MB | 5MB |
| Cookies | 10kB per site* | 10kB per site* |
| Runtime Objects | 2000 | 2000 |
| Actions per Event | 360 | 360 |
| Events per Script | 90 | 90 |
| Actions per Frame | 400 | 400 |
| Tuple Parameters | 6 | 6 |
| Playing Sounds | 150 | 150 |
| Broadcast Size | 979 bytes | 979 bytes |
| Broadcast Rate | 5/2s (page) | 5/2s (page) |
| Cross-site Broadcast Size | 979 bytes | 979 bytes |
| Cross-site Broadcast Rate | 5/20s (Uncached) 5/2s (Cached) | 5/20s (Uncached) 5/2s (Cached) |

*Requires Cookies gamepass (separate purchase)

The 500-element figure is a guideline, not a CatWeb limit: pages above it still import but can be very slow or fail to load. Every element in `webcontent` counts (modifiers, `Folder`s and `script` elements included); events and actions inside a script don't. See [UIGPT.md](UIGPT.md) §12 for ways to cut the count.

---

## Cross-References

- **UI JSON Structure:** [UIGPT.md](UIGPT.md) - Complete element and styling reference
- **Script JSON Format:** [JSONScript.md](JSONScript.md) - Authoritative block shapes and rules
- **Assets, Icons & Patterns:** [Assets.md](Assets.md) - Verified icons, sounds, component templates, and string decoder
- **Roblox Resources:** 
  - [AudioPlayer Properties](https://create.roblox.com/docs/reference/engine/classes/AudioPlayer#properties)
  - [DateTime Formatting](https://create.roblox.com/docs/reference/engine/datatypes/DateTime)

---

## Version History

**v2.18.2.3:** `<-- Newest`
- Changed the "Set property" action behaviors and stability.
- Improvements to Script Compilation performance and reliability.
- Fixes for donation handling and UI color settings.

**v2.18.0.0 – v2.18.2.0:**
- **Script Compilation Full Release:** Scripts are compiled for optimized execution without legacy action limit throttling.
- Cross-site table broadcasts supported.
- Analytics portal enhancements.

**v2.17.3.0:**
- Added Donation element as well as an Avatar Item element.
- Legacy Donation element deprecated.

**v2.17.2.0:**
- Object Scope Functions: `o!<functionName>`.
- Milestone Badges: Earn Milestone Badges for every year you're on CatWeb.
- Script Search & Jump to Error.
- Uploads: Easily share elements or a page with a 6-character code without filter tags.
- Ads Portal & Discover Ads.

---

## Final Notes

**For AI Assistants:**
- Use this document as the primary CatWeb conceptual reference.
- Pair with [JSONScript.md](JSONScript.md) for valid script JSON generation.
- Consult [UIGPT.md](UIGPT.md) for UI element schemas.
- Use [Assets.md](Assets.md) for valid icon asset IDs and sound IDs.
- Keep UI + scripts in a single JSON file.

**For Users:**
- This is the complete CatWeb scripting reference.
- Check Tips & Tricks for advanced techniques.
- Report outdated information to developers.
- Join the community for support and examples.