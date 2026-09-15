/**
 * CatWeb AI Render Protocol & HTTP API Test Suite
 *
 * Verifies:
 *   - AI protocol JSON handling: valid payloads yield image data URL
 *   - Diagnostic error mapping: invalid payloads yield structured errors
 *   - Malformed JSON handling: syntax errors produce JSON_SYNTAX_ERROR
 *   - Standalone Node.js HTTP server: POST /render responds correctly for valid and invalid data
 *
 * Run with: node web-runner/tests/api_protocol.test.js
 */

import http from 'node:http';
import { handleAiRenderRequest, captureCanvasImage } from '../src/api_protocol.js';
import { createServer, handleRenderPayload } from '../../tools/api_server.js';
import { getDocument } from './harness.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const cond = actual === expected;
  assert(cond, `${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   CatWeb AI Render Protocol & HTTP API Test Suite    ');
  console.log('======================================================\n');

  const doc = getDocument();

  /* ============================================================
   * 1. VALID CATWEB JSON RENDERING
   * ============================================================ */
  console.log('--- 1. VALID CATWEB JSON RENDERING ---');
  {
    const validSnippet = [
      {
        class: 'Frame',
        globalid: 'f1',
        alias: 'test_card',
        size: '{0,400},{0,200}',
        background_color: '#18181b',
        children: [
          {
            class: 'TextLabel',
            globalid: 't1',
            alias: 'test_title',
            size: '{1,0},{1,0}',
            text: 'Hello AI Agent!'
          }
        ]
      }
    ];

    const mockApp = {
      previewCanvas: doc.createElement('div'),
      currentFormat: 'snippet',
      loadDocument: () => {}
    };

    const result = await handleAiRenderRequest(validSnippet, mockApp);

    assert(result.success === true, 'Valid snippet request succeeds with success: true');
    assertEqual(result.format, 'snippet', 'Identifies format as snippet');
    assert(typeof result.image === 'string' && result.image.startsWith('data:image/'), 'Returns image data URL');
    assertEqual(result.errors.length, 0, 'Returns empty errors array');
    assertEqual(result.width, 1920, 'Default snapshot width is 1920');
    assertEqual(result.height, 1080, 'Default snapshot height is 1080');
  }

  /* ============================================================
   * 2. INVALID CATWEB JSON DIAGNOSTICS
   * ============================================================ */
  console.log('\n--- 2. INVALID CATWEB JSON DIAGNOSTICS ---');
  {
    const invalidDoc = [
      {
        class: 'Frame',
        globalid: 'f1',
        size: 'bad_udim2',
        background_color: 'invalid_hex',
        children: []
      }
    ];

    const mockApp = {
      previewCanvas: doc.createElement('div'),
      currentFormat: 'snippet',
      loadDocument: () => {}
    };

    const result = await handleAiRenderRequest(invalidDoc, mockApp);

    assert(result.success === false, 'Invalid document request returns success: false');
    assert(result.errors.length > 0, 'Returns non-empty errors array');
    const hasUdimErr = result.errors.some(e => e.code === 'INVALID_UDIM2');
    assert(hasUdimErr, 'Detects INVALID_UDIM2 error code');
    const hasColorErr = result.errors.some(e => e.code === 'INVALID_HEX_COLOR');
    assert(hasColorErr, 'Detects INVALID_HEX_COLOR error code');
  }

  /* ============================================================
   * 3. MALFORMED JSON STRING HANDLING
   * ============================================================ */
  console.log('\n--- 3. MALFORMED JSON STRING HANDLING ---');
  {
    const malformed = '{"class": "Frame", broken json...';
    const result = await handleAiRenderRequest(malformed, null);

    assert(result.success === false, 'Malformed JSON string returns success: false');
    assertEqual(result.errors.length, 1, 'Returns exactly 1 error for malformed JSON');
    assertEqual(result.errors[0].code, 'JSON_SYNTAX_ERROR', 'Error code is JSON_SYNTAX_ERROR');
    assert(result.errors[0].message.includes('Malformed JSON'), 'Error message describes JSON parse failure');
  }

  /* ============================================================
   * 4. DIRECT HTTP API PAYLOAD HANDLER
   * ============================================================ */
  console.log('\n--- 4. DIRECT HTTP API PAYLOAD HANDLER ---');
  {
    const validJsonStr = JSON.stringify([
      {
        class: 'TextButton',
        globalid: 'tb',
        size: '{0,200},{0,50}',
        text: 'Click Me'
      }
    ]);

    const apiResult = handleRenderPayload(validJsonStr);
    assertEqual(apiResult.statusCode, 200, 'HTTP handler returns statusCode 200 for valid JSON');
    assert(apiResult.body.success === true, 'HTTP handler body has success: true');
    assert(typeof apiResult.body.image === 'string', 'HTTP handler body contains image string');
    assert(typeof apiResult.rawSvg === 'string', 'HTTP handler provides rawSvg representation');

    // Wrapped JSON: { "json": [...] }
    const wrappedStr = JSON.stringify({
      json: [
        {
          class: 'Frame',
          globalid: 'fw',
          size: '{1,0},{1,0}'
        }
      ]
    });
    const wrappedResult = handleRenderPayload(wrappedStr);
    assertEqual(wrappedResult.statusCode, 200, 'HTTP handler handles wrapped { "json": ... } format');
    assert(wrappedResult.body.success === true, 'Wrapped format body has success: true');

    // Invalid JSON payload
    const invalidJsonStr = JSON.stringify([
      {
        class: 'Frame',
        globalid: 'x',
        order: 1 // Raw number scalar
      }
    ]);
    const invalidApiResult = handleRenderPayload(invalidJsonStr);
    assertEqual(invalidApiResult.statusCode, 400, 'HTTP handler returns statusCode 400 for invalid JSON');
    assert(invalidApiResult.body.success === false, 'HTTP handler body has success: false');
    assert(invalidApiResult.body.errors.some(e => e.code === 'RAW_NUMBER_SCALAR'), 'HTTP handler reports RAW_NUMBER_SCALAR');
  }

  /* ============================================================
   * 5. STANDALONE HTTP API SERVER ENDPOINTS
   * ============================================================ */
  console.log('\n--- 5. STANDALONE HTTP API SERVER ENDPOINTS ---');
  {
    const server = createServer();
    const TEST_PORT = 3199;

    await new Promise((resolve) => server.listen(TEST_PORT, resolve));

    try {
      // 1. GET /health
      const healthResp = await makeHttpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/health',
        method: 'GET'
      });
      assertEqual(healthResp.statusCode, 200, 'GET /health returns HTTP 200');
      assert(healthResp.body.status === 'ok', 'Health status is "ok"');
      assert(healthResp.body.service === 'CatWeb AI Render API', 'Identifies as CatWeb AI Render API');

      // 2. POST /render with valid JSON
      const postValidResp = await makeHttpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/render',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        json: [
          {
            class: 'Frame',
            globalid: 'cd',
            size: '{0,300},{0,300}',
            background_color: '#27272a'
          }
        ]
      }));

      assertEqual(postValidResp.statusCode, 200, 'POST /render with valid JSON returns HTTP 200');
      assert(postValidResp.body.success === true, 'POST /render response has success: true');
      assert(typeof postValidResp.body.image === 'string', 'POST /render response contains image data URL');

      // 3. POST /render with invalid JSON
      const postInvalidResp = await makeHttpRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/render',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({
        json: [
          {
            class: 'Frame',
            globalid: 'f1',
            size: 'not_a_valid_udim2'
          }
        ]
      }));

      assertEqual(postInvalidResp.statusCode, 400, 'POST /render with invalid JSON returns HTTP 400');
      assert(postInvalidResp.body.success === false, 'POST /render response has success: false');
      assert(postInvalidResp.body.errors.length > 0, 'POST /render response lists diagnostic errors');
      assert(postInvalidResp.body.errors[0].code === 'INVALID_UDIM2', 'POST /render identifies INVALID_UDIM2');

    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  /* ============================================================
   * TEST RESULTS SUMMARY
   * ============================================================ */
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    console.error('FAILURES:');
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  } else {
    console.log('ALL AI PROTOCOL & API TESTS PASSED!\n');
    process.exit(0);
  }
}

function makeHttpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsedBody = data;
        try {
          parsedBody = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
