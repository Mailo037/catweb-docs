#!/usr/bin/env node
/**
 * CatWeb AI Render HTTP API Server
 *
 * Lightweight, zero-dependency Node.js HTTP server.
 * Allows AI models, external agents, and automated tools to send CatWeb JSON
 * and receive either:
 *   - HTTP 400 with diagnostic errors if invalid, OR
 *   - HTTP 200 with a rendered image (Data URL or raw SVG/image) if valid.
 *
 * Endpoints:
 *   GET  /health           - Health check and documentation
 *   POST /render           - Ingests JSON, returns { success, image, errors }
 *   POST /api/render       - Alias for /render
 *
 * Usage:
 *   node tools/api_server.js
 *   PORT=8080 node tools/api_server.js
 */

import http from 'node:http';
import { validateCatWeb } from '../web-runner/src/validator.js';
import { renderCatWebTree } from '../web-runner/src/elements.js';
import { getDocument } from '../web-runner/tests/harness.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Renders CatWeb JSON into an SVG image representation using the mock DOM engine.
 *
 * @param {object|Array} parsedJson
 * @param {number} [width=1920]
 * @param {number} [height=1080]
 * @returns {string} SVG Data URL
 */
export function renderSvgSnapshot(parsedJson, width = 1920, height = 1080) {
  const doc = getDocument();
  const canvas = doc.createElement('div');
  canvas.style.position = 'relative';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.overflow = 'hidden';
  canvas.style.backgroundColor = '#09090b';

  renderCatWebTree(parsedJson, canvas);

  const rawHtml = canvas.innerHTML || '';
  const bgColor = canvas.style.backgroundColor || '#09090b';

  const svg = `
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

  const b64 = Buffer.from(svg).toString('base64');
  return {
    svgString: svg,
    dataUrl: `data:image/svg+xml;base64,${b64}`,
    width,
    height
  };
}

/**
 * Handles incoming render requests.
 */
export function handleRenderPayload(payloadString, options = {}) {
  let parsed;
  try {
    parsed = typeof payloadString === 'string' ? JSON.parse(payloadString) : payloadString;
  } catch (err) {
    return {
      statusCode: 400,
      body: {
        success: false,
        format: null,
        elementCount: 0,
        errors: [
          {
            code: 'JSON_SYNTAX_ERROR',
            message: `Malformed JSON: ${err.message}`,
            path: '$',
            severity: 'error'
          }
        ],
        warnings: []
      }
    };
  }

  // Handle wrapped payload { "json": ... }
  const targetDoc = (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.json !== undefined)
    ? parsed.json
    : parsed;

  const validation = validateCatWeb(targetDoc);

  if (!validation.valid) {
    return {
      statusCode: 400,
      body: {
        success: false,
        format: validation.format || 'unknown',
        elementCount: validation.stats?.elementCount || 0,
        errors: validation.errors,
        warnings: validation.warnings || []
      }
    };
  }

  // Render valid tree into snapshot image
  const width = options.width || 1920;
  const height = options.height || 1080;
  const snapshot = renderSvgSnapshot(targetDoc, width, height);

  return {
    statusCode: 200,
    rawSvg: snapshot.svgString,
    body: {
      success: true,
      format: validation.format || 'snippet',
      elementCount: validation.stats?.elementCount || 0,
      image: snapshot.dataUrl,
      mime: 'image/svg+xml',
      width,
      height,
      errors: [],
      warnings: validation.warnings || []
    }
  };
}

/**
 * Creates and starts the HTTP server.
 */
export function createServer() {
  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // GET /health or GET /
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'CatWeb AI Render API',
        version: '1.0.0',
        endpoints: {
          'POST /render': 'Submit CatWeb JSON to validate and receive either errors or rendered image data URL.',
          'GET /health': 'Health status check.'
        },
        exampleRequest: {
          method: 'POST',
          url: '/render',
          headers: { 'Content-Type': 'application/json' },
          body: {
            json: [
              {
                class: 'Frame',
                globalid: 'f1',
                size: '{0,400},{0,200}',
                background_color: '#3b82f6',
                children: [
                  {
                    class: 'TextLabel',
                    globalid: 't1',
                    size: '{1,0},{1,0}',
                    text: 'Hello AI from CatWeb!'
                  }
                ]
              }
            ]
          }
        }
      }, null, 2));
      return;
    }

    // POST /render or POST /api/render
    if (req.method === 'POST' && (url.pathname === '/render' || url.pathname === '/api/render')) {
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk;
        if (bodyData.length > 20 * 1024 * 1024) { // 20 MB limit
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, errors: [{ code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 20MB limit.' }] }));
          req.destroy();
        }
      });

      req.on('end', () => {
        const wantsRawImage = url.searchParams.get('format') === 'raw_image' || req.headers.accept === 'image/svg+xml';
        const result = handleRenderPayload(bodyData);

        if (wantsRawImage && result.statusCode === 200 && result.rawSvg) {
          res.writeHead(200, {
            'Content-Type': 'image/svg+xml',
            'Content-Disposition': 'inline; filename="catweb_render.svg"'
          });
          res.end(result.rawSvg);
          return;
        }

        res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.body, null, 2));
      });
      return;
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found. Use POST /render' }));
  });

  return server;
}

// Start server if executed directly
if (process.argv[1] && process.argv[1].endsWith('api_server.js')) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  CatWeb AI Render API Server running on port ${PORT} `);
    console.log(`  URL: http://localhost:${PORT}/render               `);
    console.log(`======================================================\n`);
  });
}
