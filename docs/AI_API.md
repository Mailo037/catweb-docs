# CatWeb Web Runner — AI Agent API Documentation

This guide explains how AI models, autonomous agents, and external automation tools can interact with the **CatWeb Web Runner** hosted directly on GitHub Pages:

> **Live Production Endpoint:**  
> [**`https://mailo037.github.io/catweb-docs/`**](https://mailo037.github.io/catweb-docs/)

The runner provides an automated **"JSON In $\to$ Error or Image Out"** contract. Given a CatWeb JSON site or component snippet, it will return either:
1. **A rendered image (PNG / SVG Data URL)** with full 1920×1080 Roblox GUI canvas emulation, OR
2. **A structured list of diagnostic validation errors** if the JSON violates schema or semantic rules.

Zero API keys or authentication required; it is 100% client-side and hosted on GitHub Pages.

---

## 1. Quick Reference: Supported Protocols

| Protocol | Best For | Mechanism |
| :--- | :--- | :--- |
| **`#data=<base64>` (Hash Fragment)** | Large JSON sites / Snippets | Base64-encoded JSON in URL hash; avoids browser URL length limits |
| **`?json=<encoded>` (Query String)** | Quick snippets, sharing, direct links | URL-encoded JSON string; optional `&render=image` |
| **`?url=<remote_url>`** | Public GitHub / Raw URLs | Fetches remote JSON file, validates, and renders |
| **`window.__CATWEB_RESULT__`** | Headless AI agents (Playwright/Puppeteer) | Global JavaScript anchor updated upon render/validation completion |
| **`window.postMessage`** | Iframes / Webview integration | Two-way cross-window message exchange |
| **`window.CatWebAPI`** | In-page scripts / Browser consoles | Direct async JavaScript API: `render()`, `validate()`, `captureImage()` |
| **Local Node HTTP Server** | Backend pipelines / `curl` / Docker | `POST http://localhost:3000/render` via `tools/api_server.js` |

---

## 2. Response Schema Specification

Every interface returns a standardized result payload:

### Success Response (`success: true`)
Returned when the JSON passes semantic validation and renders successfully onto the canvas:

```json
{
  "success": true,
  "format": "site",
  "elementCount": 24,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAA...",
  "mime": "image/png",
  "width": 1920,
  "height": 1080,
  "errors": [],
  "warnings": []
}
```

### Validation Error Response (`success: false`)
Returned when the JSON contains syntax errors, invalid coordinates, forbidden properties, or unquoted scalars:

```json
{
  "success": false,
  "format": "snippet",
  "elementCount": 0,
  "errors": [
    {
      "code": "INVALID_UDIM2",
      "message": "Size property \"{1,0}\" is invalid. Must be in UDim2 format: \"{scaleX,offsetX},{scaleY,offsetY}\".",
      "path": "$[0].size",
      "severity": "error"
    },
    {
      "code": "RAW_NUMBER_SCALAR",
      "message": "Property \"font_size\" must be a quoted string, but received raw number (16).",
      "path": "$[0].font_size",
      "severity": "error"
    }
  ],
  "warnings": []
}
```

---

## 3. Headless Automation for AI Agents (Recommended)

AI agents with headless browser tools (such as Playwright, Puppeteer, or Chrome DevTools MCP) can render and capture CatWeb sites in seconds.

### Python (Playwright)

```python
import base64
import json
from playwright.sync_api import sync_playwright

catweb_json = [
    {
        "class": "Frame",
        "globalid": "bx",
        "alias": "card",
        "size": "{0,400},{0,250}",
        "position": "{0.5,-200},{0.5,-125}",
        "background_color": "#18181b",
        "children": [
            { "class": "UICorner", "globalid": "cr", "radius": "0,12" },
            { "class": "UIStroke", "globalid": "st", "stroke_color": "#27272a", "stroke_thickness": "1" },
            { "class": "TextLabel", "globalid": "tl", "size": "{1,0},{1,0}", "text": "Hello AI!", "font": "GothamBold", "font_size": "24", "font_color": "#ffffff" }
        ]
    }
]

# 1. Base64 encode the JSON
b64_data = base64.b64encode(json.dumps(catweb_json).encode('utf-8')).decode('utf-8')
target_url = f"https://mailo037.github.io/catweb-docs/#data={b64_data}"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto(target_url)

    # 2. Wait for the runner to finish validation and rendering
    page.wait_for_function("() => window.__CATWEB_RESULT__ !== undefined")

    # 3. Read the result payload
    result = page.evaluate("() => window.__CATWEB_RESULT__")

    if result["success"]:
        print(f"Rendered {result['format']} ({result['elementCount']} elements) successfully!")
        image_data_url = result["image"] # data:image/png;base64,...
        # Save image to file:
        header, encoded = image_data_url.split(",", 1)
        with open("output_preview.png", "wb") as f:
            f.write(base64.b64decode(encoded))
        print("Saved preview to output_preview.png")
    else:
        print("Validation errors detected:")
        for err in result["errors"]:
            print(f" - [{err['code']}] {err['message']} at {err['path']}")

    browser.close()
```

### Node.js (Playwright / Puppeteer)

```javascript
import { chromium } from 'playwright';

const catwebSnippet = [
  {
    class: "Frame",
    globalid: "c1",
    size: "{0,320},{0,180}",
    position: "{0.5,-160},{0.5,-90}",
    background_color: "#09090b",
    children: [
      { class: "UICorner", globalid: "rc", radius: "0,8" },
      { class: "TextLabel", globalid: "lb", size: "{1,0},{1,0}", text: "Rendered via AI API", font_size: "16", font_color: "#3b82f6" }
    ]
  }
];

const b64 = Buffer.from(JSON.stringify(catwebSnippet)).toString('base64');
const url = `https://mailo037.github.io/catweb-docs/#data=${b64}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url);

// Wait for the result anchor to populate
await page.waitForFunction(() => window.__CATWEB_RESULT__ !== undefined);
const result = await page.evaluate(() => window.__CATWEB_RESULT__);

if (result.success) {
  console.log(`Success! PNG Data URL length: ${result.image.length}`);
} else {
  console.error('Validation failed:', result.errors);
}

await browser.close();
```

---

## 4. URL Hash Protocol (`#data=...`)

When dealing with large JSON documents (such as full site objects with complex visual scripting), placing the JSON inside URL query parameters (`?json=...`) may exceed HTTP server or browser URI limits. The `#data=` hash fragment protocol solves this:

1. Stringify your JSON: `JSON.stringify(siteObject)`
2. Encode in UTF-8 Base64:
   - Node.js: `Buffer.from(jsonStr).toString('base64')`
   - Python: `base64.b64encode(json_str.encode('utf-8')).decode('utf-8')`
   - Browser: `btoa(unescape(encodeURIComponent(jsonStr)))`
3. Append as hash:
   ```
   https://mailo037.github.io/catweb-docs/#data=<BASE64>
   ```

Upon loading, the page extracts `#data=`, decodes it, validates it with `validateCatWeb()`, renders it onto the 1920×1080 Roblox GUI canvas, and sets `window.__CATWEB_RESULT__`.

---

## 5. URL Query Parameters Protocol (`?json=...` & `?url=...`)

For short snippets or direct links:

### Encode in Query String
```
https://mailo037.github.io/catweb-docs/?json=%5B%7B%22class%22%3A%22Frame%22%2C%22globalid%22%3A%22cd%22%7D%5D
```

### Auto-Export / Download Image
Add `&render=image` or `&export=image`:
```
https://mailo037.github.io/catweb-docs/?json=<ENCODED>&render=image
```

### Remote URL Ingestion
If your JSON is hosted on GitHub Gist, Raw GitHub, or an external CDN:
```
https://mailo037.github.io/catweb-docs/?url=https://raw.githubusercontent.com/.../mysite.json
```

---

## 6. Window PostMessage Protocol (Iframes & Webviews)

If you are embedding the CatWeb Runner inside an `<iframe>` within your agent UI or application:

```javascript
// 1. Listen for responses from CatWeb Runner
window.addEventListener('message', (event) => {
  if (event.data?.type === 'catweb:render_result') {
    const { requestId, success, image, errors } = event.data;
    console.log(`Result for request ${requestId}:`, success ? 'Rendered OK' : errors);
  }
});

// 2. Dispatch render request to the iframe
const iframe = document.getElementById('catwebRunnerIframe');
iframe.contentWindow.postMessage({
  type: 'catweb:render',
  requestId: 'req_001',
  json: myCatWebJson,
  options: {
    format: 'png' // or 'svg'
  }
}, '*');
```

---

## 7. In-Page Programmatic API (`window.CatWebAPI`)

When running inside the browser context, `window.CatWebAPI` provides direct access:

```javascript
// 1. Render and capture image:
const result = await window.CatWebAPI.render(myJson, { format: 'png' });
if (result.success) {
  console.log(result.image); // data:image/png;base64,...
} else {
  console.error(result.errors);
}

// 2. Validate without rendering:
const validation = window.CatWebAPI.validate(myJson);
console.log('Is valid:', validation.valid);

// 3. Snapshot current canvas:
const snapshot = await window.CatWebAPI.captureImage({ format: 'png' });
```

---

## 8. Local Alternative: Zero-Dependency Node.js API Server

For offline environments, continuous integration (CI/CD), or terminal pipelines without a browser:

```bash
# 1. Start the server
node tools/api_server.js
# Running on http://localhost:3000
```

### Render JSON via `curl`
```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d '{"json": [ {"class": "Frame", "globalid": "cd", "size": "{0,300},{0,300}", "background_color": "#1e293b"} ] }'
```

### Response
```json
{
  "success": true,
  "format": "snippet",
  "elementCount": 1,
  "image": "data:image/svg+xml;base64,...",
  "mime": "image/svg+xml",
  "width": 1920,
  "height": 1080,
  "errors": [],
  "warnings": []
}
```

---

## 9. Summary for AI System Prompts / Tool Schemas

When instructing an AI to generate and test CatWeb sites, you can provide this prompt snippet:

> **CatWeb Preview & Validation Protocol:**  
> When you produce CatWeb JSON, you can verify it by opening:  
> `https://mailo037.github.io/catweb-docs/#data=<BASE64_ENCODED_JSON>`  
> The page immediately exposes `window.__CATWEB_RESULT__` with either `{ success: true, image: ... }` or `{ success: false, errors: [...] }`.
