# CatWeb Docs

Everything you need to know about building in **CatWeb** (Roblox) — the Roblox game where you build 2D websites with JSON-based UI and a visual block-scripting system.

> Targeting CatWeb version **v2.18.2.3**

---

## Included Documents

1. [CatDocs - Overall explanation & reference](game/CatDocs.md)
2. [JSONScript - Guide for scripting & authoritative block shapes](game/JSONScript.md)
3. [UIGPT - Guide on how to use the custom JSON format & element schema](game/UIGPT.md)
4. [Assets & Patterns - Icons, sounds, reusable components & string decoder](game/Assets.md)
5. [Documents regarding CatWeb development and the Discord group](guild/)


If you are asked to make a site with CatWeb in the context, assume a CatWeb JSON site object is required (with `favicon`, `title`, `background`, and `webcontent`), and not real-life HTML code — refer to the [UIGPT documentation](game/UIGPT.md) and [Assets & Patterns](game/Assets.md).

---

## Related Repos

- [`catweb-additional-resources`](https://github.com/Mailo037/catweb-additional-resources) — community drop-box of ready-to-import JSONs and full sites (login pages, button packs, full portfolio sites, etc.). See its [`template/`](https://github.com/Mailo037/catweb-additional-resources/tree/main/template) folder if you want to submit your own.
- [`catweb-mcp`](https://github.com/Mailo037/catweb-mcp) — MCP server that indexes these docs + `catweb-additional-resources` so AI agents (Claude, etc.) can search by section, tag, or author and pull just the relevant slice into chat. See its README for setup.

If something isn't covered in these docs, the additional-resources repo is the next place to look.

---

## Developer & AI Tooling: Semantic Validator (`tools/validate.js`)

Always validate your CatWeb JSON files before importing them into Roblox CatWeb or finishing an AI generation task! The built-in validator performs deep semantic checks beyond basic JSON parsing:

```bash
# Validate a single site or component snippet
node tools/validate.js path/to/site.json

# Validate an entire folder recursively
node tools/validate.js skills/catweb/examples/

# Disable anti-moderation variable warnings
node tools/validate.js mysite.json --no-strict
```

### What it checks:
- **Avoids fatal `[INVALIDATED]` Roblox errors:** Rejects forbidden properties like `layout_order` (must be `order`), `cell_size` (must be `size`), and `anchor_point` (must be `anchor`).
- **Strict String Scalars:** Ensures all numbers, booleans, and nulls are strings (`"font_size": "16"`, `"visible": "true"`).
- **Coordinate Formats:** Validates `UDim2` (`"{1,0},{0,50}"`), `UDim` radius/padding (`"0,8"`), and `anchor` (`"0.5,0.5"`).
- **Complete Class Whitelist:** Recognizes all visual elements, button subtypes (`TextButton?*`, `ImageButton?*`), layout modifiers, and `UIFlexItem`.
- **Script Engine Invariants:** Validates flat control flows (no nested `actions`), Wait block Action ID `3`, and exact Title Case script property names against all 89 official CatWeb properties.
- **Global ID Uniqueness:** Enforces 2–3 printable ASCII characters (`^[\x20-\x7E]{2,3}$`) and global uniqueness across the entire file tree.

---

## Web Runner & Renderer (`web-runner/`)

Preview and interact with CatWeb JSON sites directly in your web browser without entering Roblox!

- **Public Live Version:** [**https://mailo037.github.io/catweb-docs/**](https://mailo037.github.io/catweb-docs/) (hosted automatically via GitHub Pages)
- **Standalone Web App:** Open `web-runner/index.html` or `index.html` directly in any browser (or serve locally via `npx serve web-runner`).
- **Direct JSON Ingestion:** Paste full site objects (`webcontent`) or raw component snippets, drag-and-drop `.json` files, or pick from official sample presets.
- **Accurate Roblox GUI Emulation:**
  - Full `UDim2` scaling and pixel offset calculations with anchor points (`"0.5,0.5"`).
  - Layout modifiers: `UIListLayout` (flex column/row with padding and ordering), `UIGridLayout`, `UIPadding` (4-direction insets), and `UIFlexItem` (`grow_ratio`, `shrink_ratio`, `flex_mode`).
  - Styling modifiers: `UICorner` (border-radius), `UIStroke` (inset borders/outlines), and `UIGradient`.
  - Visual elements: `Frame`, `ScrollingFrame` (canvas scrolling), `TextLabel`, `TextButton`, `TextBox`, `ImageLabel`, `ImageButton` (including `?link`, `?transfer`, `?avataritem`).
  - Roblox asset fallbacks and audio synthesis (`Play Sound` emulation via Web Audio API).
- **Interactive Script Runtime & Visual Block Viewer:** Dispatches button clicks, manages variables, displays authentic Scratch/CatWeb-style visual block stacks with C-block indentation, and allows running events on demand.
- **Live Visual Inspector & Property Editor:** Click any element to inspect its class, `globalid`, parent hierarchy, and live properties with two-way AST synchronization.
- **Automated Test Suite (406 Tests):**
  ```bash
  node web-runner/tests/runner.js              # 200 unit and integration tests
  node web-runner/tests/runtime_and_app.test.js # 173 runtime and editor tests
  node web-runner/tests/api_protocol.test.js    # 33 AI protocol & API server tests
  ```

---

## AI Render Protocol & Image API (JSON In $\to$ Error or Image Out)

An automated protocol and API designed specifically for AI models and external tools to validate CatWeb JSON and receive **either structured diagnostic errors OR a rendered image (PNG / SVG Data URL)**:

### 1. HTTP API Server (`tools/api_server.js`)
Zero-dependency Node.js HTTP server:
```bash
# Start local API server on port 3000
node tools/api_server.js
```
Send a request:
```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d '{"json": [ {"class": "Frame", "globalid": "cd", "size": "{0,300},{0,300}"} ] }'
```
- **If Valid (HTTP 200):**
  ```json
  {
    "success": true,
    "format": "snippet",
    "elementCount": 1,
    "image": "data:image/svg+xml;base64,...",
    "width": 1920,
    "height": 1080,
    "errors": []
  }
  ```
- **If Invalid (HTTP 400):**
  ```json
  {
    "success": false,
    "format": "snippet",
    "elementCount": 0,
    "errors": [
      {
        "code": "INVALID_UDIM2",
        "message": "Invalid UDim2 coordinate format...",
        "path": "$.webcontent[0].size"
      }
    ]
  }
  ```

### 2. CLI Tool (`tools/render_image.js`)
```bash
# Render to SVG image or exit with code 1 and display diagnostics
node tools/render_image.js site.json preview.svg

# Output full JSON payload to stdout
node tools/render_image.js site.json --json
```

### 3. Web URL Protocol (GitHub Pages)
```
https://mailo037.github.io/catweb-docs/?json=<URL_ENCODED_JSON>&render=image
# or with Base64 hash:
https://mailo037.github.io/catweb-docs/#data=<BASE64_JSON>
```
The result is automatically rendered and accessible in `window.__CATWEB_RESULT__`.

### 4. Window PostMessage (Iframes & Browser Automation)
```javascript
window.postMessage({ type: 'catweb:render', json: siteJson }, '*');
window.addEventListener('message', (e) => {
  if (e.data.type === 'catweb:render_result') {
    if (e.data.success) {
      console.log('Image Data URL:', e.data.image);
    } else {
      console.error('Validation errors:', e.data.errors);
    }
  }
});
```

---

## AI / Agent Usage & Skill Package

This repository provides an all-in-one **Agent Skill** (`skills/catweb/`) that encapsulates the full CatWeb specifications, hard output invariants, schema rules, and block engine definitions so any AI assistant can generate 100% valid, importable CatWeb JSON sites and scripts:

- [`skills/catweb/SKILL.md`](skills/catweb/SKILL.md) (and native workspace mirror [`.agents/skills/catweb/SKILL.md`](.agents/skills/catweb/SKILL.md)): Complete specification, output invariants, layout architecture patterns, element schemas, JSONScript block engine reference, asset IDs, and pre-flight checklist.
- [`skills/catweb/examples/minimal_site.json`](skills/catweb/examples/minimal_site.json): Production-ready minimal site implementing the standard sticky navbar + scrolling body architecture.
- [`skills/catweb/examples/interactive_counter.json`](skills/catweb/examples/interactive_counter.json): Complete interactive site featuring button click events, numeric variable incrementing (`{1}`), `Set Property` text updates, UI audio playback, and flat control flow.

### How to use with any AI Assistant / Agent:

1. **Workspace Agent Discovery (Cursor / Windsurf / Antigravity):** The skill is installed at `.agents/skills/catweb/SKILL.md` and `skills/catweb/SKILL.md`, enabling automatic discovery and mounting by workspace agents.
2. **Claude Projects / Custom GPTs:** Upload [`skills/catweb/SKILL.md`](skills/catweb/SKILL.md) as project knowledge or paste its contents into the system instructions.
3. **Direct Chat / LLM Prompting:** Copy the contents of [`skills/catweb/SKILL.md`](skills/catweb/SKILL.md) into your prompt along with your site idea (e.g. *"Create a portfolio site for CatWeb following this skill file"*).
4. **CatWeb MCP Server:** If you prefer on-demand search and retrieval, use [`catweb-mcp`](https://github.com/Mailo037/catweb-mcp) with tools like `get_doc` and `search`.

---

# Credits

Big thanks to **@sytesn** on Discord, or [**@quitism**](https://github.com/quitism) on Github, for providing initial docs, and **DevsLovePizza** for the SiteGPT specifications, confirmed block palette schemas, and token architectures.
The docs are modified and kept up to date by me.