/**
 * CatWeb AI Protocol & Headless Snapshot Engine
 *
 * Provides a standardized protocol for AI models, agents, and external tools
 * to submit CatWeb JSON and receive either:
 *   1. Validation / diagnostic errors (if invalid), OR
 *   2. A high-resolution rendered image (PNG / SVG Data URL) of the canvas.
 *
 * Supported interfaces:
 *   - URL Query & Hash Protocol: ?json=... or #data=...
 *   - Window PostMessage Protocol: { type: 'catweb:render', json: ... }
 *   - Programmatic API: window.CatWebAPI.render(json) -> Promise<result>
 *   - Global Result Anchor: window.__CATWEB_RESULT__
 *
 * Zero external dependencies.
 */

import { validateCatWeb } from './validator.js';

/**
 * Captures the preview canvas DOM element into an image data URL.
 *
 * In browser environments with HTML5 Canvas:
 *   Converts the rendered DOM into an SVG <foreignObject>, renders to canvas,
 *   and outputs a PNG data URL (data:image/png;base64,...).
 * In Node.js / headless mock environments:
 *   Outputs an SVG data URL (data:image/svg+xml;charset=utf-8,...).
 *
 * @param {HTMLElement} canvasElement - The CatWeb canvas DOM element (1920x1080)
 * @param {object} [options={}]
 * @param {number} [options.width=1920]
 * @param {number} [options.height=1080]
 * @param {string} [options.format='png'] - 'png' or 'svg'
 * @returns {Promise<{ mime: string, dataUrl: string, width: number, height: number }>}
 */
export async function captureCanvasImage(canvasElement, options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const format = options.format || 'png';

  if (!canvasElement) {
    throw new Error('No canvas element provided for image capture.');
  }

  // Extract HTML and collect critical CSS styling
  const rawHtml = canvasElement.innerHTML || '';
  const bgColor = canvasElement.style?.backgroundColor || '#09090b';

  // Build self-contained SVG foreignObject wrapper
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>
        * { box-sizing: border-box; }
        .cw-element { position: absolute; pointer-events: auto; }
        .cw-class-frame { display: block; }
        .cw-class-textlabel, .cw-class-textbutton { display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .cw-class-imagebutton { display: flex; align-items: center; justify-content: center; }
      </style>
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <foreignObject width="${width}" height="${height}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px; height:${height}px; position:relative; overflow:hidden; background-color:${bgColor};">
          ${rawHtml}
        </div>
      </foreignObject>
    </svg>
  `.trim();

  const svgBase64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(svgData)))
    : (typeof Buffer !== 'undefined' ? Buffer.from(svgData).toString('base64') : '');

  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  // If running in browser and PNG is requested, rasterize via HTML5 Canvas
  if (format === 'png' && typeof document !== 'undefined' && typeof Image !== 'undefined') {
    try {
      const pngDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(svgDataUrl);
              return;
            }
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
          } catch (canvasErr) {
            resolve(svgDataUrl);
          }
        };
        img.onerror = () => {
          resolve(svgDataUrl);
        };
        img.src = svgDataUrl;
      });

      return {
        mime: 'image/png',
        dataUrl: pngDataUrl,
        width,
        height
      };
    } catch {
      // Fallback to SVG data URL
    }
  }

  return {
    mime: 'image/svg+xml',
    dataUrl: svgDataUrl,
    width,
    height
  };
}

/**
 * Executes an AI render request:
 *   1. Parses JSON (if string).
 *   2. Validates against schema (tools/validate.js).
 *   3. If invalid: returns `{ success: false, errors: [...] }`.
 *   4. If valid: renders on canvas and captures image:
 *      returns `{ success: true, image: dataUrl, format: ..., elementCount: ... }`.
 *
 * @param {string|object|Array} jsonPayload
 * @param {object} appInstance - The CatWebRunnerApp instance
 * @param {object} [options={}]
 * @returns {Promise<object>} Result payload
 */
export async function handleAiRenderRequest(jsonPayload, appInstance, options = {}) {
  let parsedJson = jsonPayload;

  // 1. JSON String parsing
  if (typeof jsonPayload === 'string') {
    try {
      parsedJson = JSON.parse(jsonPayload);
    } catch (parseErr) {
      const result = {
        success: false,
        format: null,
        elementCount: 0,
        errors: [
          {
            code: 'JSON_SYNTAX_ERROR',
            message: `Malformed JSON: ${parseErr.message}`,
            path: '$',
            severity: 'error'
          }
        ],
        warnings: []
      };
      if (typeof window !== 'undefined') window.__CATWEB_RESULT__ = result;
      return result;
    }
  }

  // 2. Schema Validation
  const validation = validateCatWeb(parsedJson);

  if (!validation.valid) {
    const result = {
      success: false,
      format: validation.format || 'unknown',
      elementCount: validation.stats?.elementCount || 0,
      errors: validation.errors,
      warnings: validation.warnings || []
    };
    if (typeof window !== 'undefined') window.__CATWEB_RESULT__ = result;
    return result;
  }

  // 3. Render in Web Runner Application
  try {
    if (appInstance && typeof appInstance.loadDocument === 'function') {
      appInstance.loadDocument(parsedJson);
    }

    const canvasEl = appInstance?.previewCanvas || (typeof document !== 'undefined' ? document.getElementById('previewCanvas') : null);
    const imgResult = await captureCanvasImage(canvasEl, options);

    const result = {
      success: true,
      format: validation.format || appInstance?.currentFormat || 'snippet',
      elementCount: validation.stats?.elementCount || 0,
      image: imgResult.dataUrl,
      mime: imgResult.mime,
      width: imgResult.width,
      height: imgResult.height,
      errors: [],
      warnings: validation.warnings || []
    };

    if (typeof window !== 'undefined') window.__CATWEB_RESULT__ = result;
    return result;
  } catch (renderErr) {
    const result = {
      success: false,
      format: validation.format || 'unknown',
      elementCount: validation.stats?.elementCount || 0,
      errors: [
        {
          code: 'RENDER_EXCEPTION',
          message: `Internal rendering error: ${renderErr.message}`,
          path: '$',
          severity: 'error'
        }
      ],
      warnings: []
    };
    if (typeof window !== 'undefined') window.__CATWEB_RESULT__ = result;
    return result;
  }
}

/**
 * Initializes AI Protocol listeners (URL params, Hash, postMessage) on the application shell.
 *
 * @param {object} appInstance - Active CatWebRunnerApp instance
 */
export function initAiProtocol(appInstance) {
  if (typeof window === 'undefined') return;

  // 1. Expose public programmatic API
  window.CatWebAPI = {
    render: (json, opts) => handleAiRenderRequest(json, appInstance, opts),
    captureImage: (opts) => captureCanvasImage(appInstance.previewCanvas, opts),
    validate: (json) => validateCatWeb(json)
  };

  // 2. Window PostMessage Listener (for Iframes & Parent Agent Automation)
  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'catweb:render') {
      const requestId = data.requestId || null;
      const result = await handleAiRenderRequest(data.json, appInstance, data.options || {});

      const response = {
        type: 'catweb:render_result',
        requestId,
        ...result
      };

      // Reply back to source window
      if (event.source && typeof event.source.postMessage === 'function') {
        const targetOrigin = event.origin && event.origin !== 'null' ? event.origin : '*';
        event.source.postMessage(response, targetOrigin);
      }
    }
  });

  // 3. Check URL Query Parameters & Hash on startup
  setTimeout(() => {
    checkUrlPayload(appInstance);
  }, 100);
}

/**
 * Inspects location.search and location.hash for incoming JSON payloads.
 *
 * @private
 */
async function checkUrlPayload(appInstance) {
  if (typeof window === 'undefined' || !window.location) return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    let payload = null;

    // Check ?json=<encoded_json>
    if (urlParams.has('json')) {
      payload = urlParams.get('json');
    }

    // Check ?url=<raw_json_url>
    if (!payload && urlParams.has('url')) {
      const targetUrl = urlParams.get('url');
      try {
        const resp = await fetch(targetUrl);
        if (resp.ok) payload = await resp.text();
      } catch (fetchErr) {
        console.warn('[CatWebAPI] Failed to fetch remote payload URL:', fetchErr);
      }
    }

    // Check #json=<encoded_json> or #data=<base64_json>
    if (!payload && window.location.hash) {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('json=')) {
        payload = decodeURIComponent(hash.slice(5));
      } else if (hash.startsWith('data=')) {
        const b64 = hash.slice(5);
        payload = decodeURIComponent(escape(atob(b64)));
      }
    }

    if (payload) {
      const shouldExportImage = urlParams.get('render') === 'image' || urlParams.get('export') === 'image';
      const result = await handleAiRenderRequest(payload, appInstance, { format: 'png' });

      if (shouldExportImage && result.success && result.image) {
        // Automatically trigger image view or download if requested
        const viewerLink = document.createElement('a');
        viewerLink.href = result.image;
        viewerLink.download = 'catweb_preview.png';
        viewerLink.title = 'Rendered CatWeb Preview';
        console.log('[CatWebAPI] Render completed successfully. Result stored in window.__CATWEB_RESULT__');
      }
    }
  } catch (err) {
    console.warn('[CatWebAPI] URL payload initialization error:', err);
  }
}
