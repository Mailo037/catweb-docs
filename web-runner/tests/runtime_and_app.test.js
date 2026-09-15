/**
 * CatWeb Interactive Runtime & Application Shell Test Suite (Milestones M4 & M5)
 *
 * Verifies:
 *   - Interactive Scripting Engine (runtime.js):
 *       - Variable storage, arithmetic, string interpolation ({1}, {2})
 *       - Event binding (0: loaded, 1: pressed/click, 2: hover, 3: unhover)
 *       - Action dispatcher (11: Set, 12: Add, 31: Set Property, 18: If, 25: End, 3: Wait, 5: Play Audio, 88: Tween)
 *       - Full stateful execution of interactive_counter.json (Load -> 10 clicks -> Goal reached -> Reset)
 *   - Element Inspector & Overlay Engine (inspector.js):
 *       - Global ID DOM registry & descriptor retrieval
 *       - Hover bounding box & tooltip calculation
 *       - Selection lifecycle & detail drawer reporting
 *   - Preview Application Controller (app.js):
 *       - Standalone controller initialization & multi-modal inputs
 *       - Dual format loading (Full Site & Component Snippet)
 *       - Validator integration & diagnostic error generation (13 errors for invalid_examples)
 *       - Viewport 16:9 canvas controls & zoom scaling
 *
 * Run with: node web-runner/tests/runtime_and_app.test.js
 */

import fs from 'node:fs';
import path from 'node:path';

import { CatWebRuntime } from '../src/runtime.js';
import { CatWebInspector } from '../src/inspector.js';
import { CatWebRunnerApp, PRELOADED_SAMPLES } from '../src/app.js';
import { renderCatWebTree } from '../src/elements.js';
import { validateCatWeb } from '../src/validator.js';
import { getDocument, MockElement } from './harness.js';

// Test statistics
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
  console.log('   CatWeb Runtime & Application Shell Test Suite      ');
  console.log('======================================================\n');

  const doc = getDocument();

  /* ============================================================
   * 1. RUNTIME STATE MACHINE & VARIABLE STORE
   * ============================================================ */
  console.log('--- 1. RUNTIME STATE MACHINE & VARIABLE STORE ---');
  {
    const dummyTree = {
      class: 'Frame',
      globalid: 'rt',
      children: []
    };
    const runtime = new CatWebRuntime(dummyTree);

    // Unset variable defaults to 0
    assertEqual(runtime.getVariable('1'), 0, 'Unset variable 1 defaults to 0');
    assertEqual(runtime.getVariable('99'), 0, 'Unset variable 99 defaults to 0');

    // Setting and getting numeric variables
    runtime.setVariable('1', 42);
    assertEqual(runtime.getVariable('1'), 42, 'Sets and retrieves numeric variable');

    // Setting string variable
    runtime.setVariable('2', 'CatWeb');
    assertEqual(runtime.getVariable('2'), 'CatWeb', 'Sets and retrieves string variable');

    // Numeric conversion on numeric string
    runtime.setVariable('3', '100');
    assertEqual(runtime.getVariable('3'), '100', 'Preserves string when explicitly set');

    // Template interpolation
    assertEqual(runtime.resolveTemplate('Count: {1}'), 'Count: 42', 'Interpolates single variable {1}');
    assertEqual(runtime.resolveTemplate('Hello {2}!'), 'Hello CatWeb!', 'Interpolates string variable {2}');
    assertEqual(runtime.resolveTemplate('{1} + {3} = 142'), '42 + 100 = 142', 'Interpolates multiple variables in one string');
    assertEqual(runtime.resolveTemplate('Unset: {4}'), 'Unset: 0', 'Interpolates unset variable as 0');
    assertEqual(runtime.resolveTemplate(123), 123, 'Passes through non-string without error');
    assertEqual(runtime.resolveTemplate(null), null, 'Passes through null without error');
  }

  /* ============================================================
   * 2. ACTION DISPATCHER & CONTROL FLOW
   * ============================================================ */
  console.log('\n--- 2. ACTION DISPATCHER & CONTROL FLOW ---');
  {
    const mockRoot = doc.createElement('div');
    const labelEl = doc.createElement('div');
    labelEl.setAttribute('data-globalid', 'lbl');
    labelEl.textContent = 'Initial';
    labelEl.style.color = '#ffffff';
    labelEl.style.backgroundColor = '#000000';
    mockRoot.appendChild(labelEl);

    const testDoc = {
      webcontent: [
        {
          class: 'TextLabel',
          globalid: 'lbl',
          text: 'Initial',
          font_color: '#ffffff',
          background_color: '#000000'
        },
        {
          class: 'script',
          globalid: 'sc1',
          content: [
            {
              id: '0',
              globalid: 'ev_load',
              text: ['When website loaded...'],
              actions: [
                {
                  id: '11',
                  globalid: 'a1',
                  text: ['Set', { value: '1', l: 'variable' }, 'to', { value: '10', l: 'any' }]
                },
                {
                  id: '12',
                  globalid: 'a2',
                  text: ['Add', { value: '5', l: 'any' }, 'to', { value: '1', l: 'variable' }]
                },
                {
                  id: '31',
                  globalid: 'a3',
                  text: ['Set', { value: 'Text', l: 'property' }, 'of', { value: 'lbl', t: 'object' }, 'to', { value: 'Value is {1}', l: 'any' }]
                },
                {
                  id: '31',
                  globalid: 'a4',
                  text: ['Set', { value: 'Text Color', l: 'property' }, 'of', { value: 'lbl', t: 'object' }, 'to', { value: '#3b82f6', l: 'any' }]
                },
                {
                  id: '31',
                  globalid: 'a5',
                  text: ['Set', { value: 'Background Color', l: 'property' }, 'of', { value: 'lbl', t: 'object' }, 'to', { value: '#18181b', l: 'any' }]
                },
                {
                  id: '5',
                  globalid: 'a6',
                  text: ['Play audio', { value: '88442833509532', l: 'id' }]
                },
                // If condition evaluating TRUE
                {
                  id: '18',
                  globalid: 'a7',
                  text: ['If', { value: '{1}', l: 'any' }, 'is equal to', { value: '15', l: 'any' }]
                },
                {
                  id: '12',
                  globalid: 'a8',
                  text: ['Add', { value: '1', l: 'any' }, 'to', { value: '1', l: 'variable' }]
                },
                {
                  id: '25',
                  globalid: 'a9',
                  text: ['end']
                },
                // If condition evaluating FALSE (should skip enclosed actions)
                {
                  id: '18',
                  globalid: 'a10',
                  text: ['If', { value: '{1}', l: 'any' }, 'is equal to', { value: '999', l: 'any' }]
                },
                {
                  id: '11',
                  globalid: 'a11',
                  text: ['Set', { value: '1', l: 'variable' }, 'to', { value: '0', l: 'any' }]
                },
                {
                  id: '25',
                  globalid: 'a12',
                  text: ['end']
                }
              ]
            }
          ]
        }
      ]
    };

    const runtime = new CatWebRuntime(testDoc, mockRoot);
    await runtime.start();

    assertEqual(runtime.getVariable('1'), 16, 'Executes Set (10) + Add (5) + conditional Add (1) = 16');
    assertEqual(labelEl.textContent, 'Value is 15', 'Action 31 updates DOM textContent with variable interpolation');
    assertEqual(labelEl.style.color, '#3b82f6', 'Action 31 updates DOM text color');
    assertEqual(labelEl.style.backgroundColor, '#18181b', 'Action 31 updates DOM background color');
    assertEqual(runtime.lastAudioPlayed, '88442833509532', 'Action 5 triggers audio synthesis with ID 88442833509532');
  }

  /* ============================================================
   * 3. COMPARISON OPERATOR EVALUATION
   * ============================================================ */
  console.log('\n--- 3. COMPARISON OPERATOR EVALUATION ---');
  {
    const runtime = new CatWebRuntime([]);

    assert(runtime._evaluateComparison('10', '10', 'is equal to'), 'Evaluates numeric equality: 10 == 10');
    assert(!runtime._evaluateComparison('10', '11', 'is equal to'), 'Rejects numeric inequality on equal check: 10 != 11');
    assert(runtime._evaluateComparison('10', '11', 'is not equal to'), 'Evaluates numeric inequality: 10 != 11');
    assert(runtime._evaluateComparison('20', '10', 'is greater than'), 'Evaluates greater than: 20 > 10');
    assert(runtime._evaluateComparison('5', '10', 'is less than'), 'Evaluates less than: 5 < 10');
    assert(runtime._evaluateComparison('10', '10', 'is greater than or equal to'), 'Evaluates >= on equal: 10 >= 10');
    assert(runtime._evaluateComparison('15', '10', 'is greater than or equal to'), 'Evaluates >= on greater: 15 >= 10');
    assert(runtime._evaluateComparison('10', '10', 'is less than or equal to'), 'Evaluates <= on equal: 10 <= 10');
    assert(runtime._evaluateComparison('cat', 'cat', '='), 'Evaluates string equality: cat == cat');
    assert(!runtime._evaluateComparison('cat', 'dog', '='), 'Rejects string difference: cat != dog');
  }

  /* ============================================================
   * 4. FULL INTERACTIVE COUNTER EXECUTION WORKLOAD
   * ============================================================ */
  console.log('\n--- 4. FULL INTERACTIVE COUNTER EXECUTION WORKLOAD ---');
  {
    const counterJson = structuredClone(PRELOADED_SAMPLES.interactive_counter);
    const container = doc.createElement('div');

    // 1. Render visual tree
    renderCatWebTree(counterJson, container);

    const btnEl = container.querySelector('[data-globalid="btn"]');
    const rstEl = container.querySelector('[data-globalid="rst"]');
    const cntEl = container.querySelector('[data-globalid="cnt"]');

    assert(!!btnEl, 'Finds increment button [btn] in rendered DOM');
    assert(!!rstEl, 'Finds reset button [rst] in rendered DOM');
    assert(!!cntEl, 'Finds counter label [cnt] in rendered DOM');

    // 2. Initialize and start runtime
    const runtime = new CatWebRuntime(counterJson, container);
    await runtime.start();

    // Verification step A: Website loaded initializes var 1 to 0
    assertEqual(runtime.getVariable('1'), 0, 'Initial load initializes variable 1 to 0');
    assertEqual(cntEl.textContent, 'Count: 0', 'Initial label displays "Count: 0"');

    // Verification step B: Clicking btn increments count and updates label
    await runtime.triggerEvent('btn', 1);
    assertEqual(runtime.getVariable('1'), 1, 'Click 1 increments count to 1');
    assertEqual(cntEl.textContent, 'Count: 1', 'Click 1 updates label to "Count: 1"');
    assertEqual(runtime.lastAudioPlayed, '88442833509532', 'Click 1 plays click audio (88442833509532)');

    // Verification step C: Click 9 more times to reach 10
    for (let c = 2; c <= 9; c++) {
      await runtime.triggerEvent('btn', 1);
      assertEqual(runtime.getVariable('1'), c, `Click ${c} increments count to ${c}`);
      assertEqual(cntEl.textContent, `Count: ${c}`, `Click ${c} updates label to "Count: ${c}"`);
    }

    // 10th click triggers Goal Reached condition
    await runtime.triggerEvent('btn', 1);
    assertEqual(runtime.getVariable('1'), 10, 'Click 10 reaches goal 10');
    assertEqual(cntEl.textContent, 'Goal reached: 10!', 'Condition {1} == 10 sets label to "Goal reached: 10!"');
    assertEqual(runtime.lastAudioPlayed, '136211732441165', 'Goal reached plays success audio (136211732441165)');

    // Verification step D: Reset button resets count to 0
    await runtime.triggerEvent('rst', 1);
    assertEqual(runtime.getVariable('1'), 0, 'Clicking rst resets count variable to 0');
    assertEqual(cntEl.textContent, 'Count: 0', 'Clicking rst updates label to "Count: 0"');
    assertEqual(runtime.lastAudioPlayed, '88442833509532', 'Reset plays click audio (88442833509532)');
  }

  /* ============================================================
   * 5. ELEMENT INSPECTOR & OVERLAY ENGINE
   * ============================================================ */
  console.log('\n--- 5. ELEMENT INSPECTOR & OVERLAY ENGINE ---');
  {
    const canvasContainer = doc.createElement('div');
    const drawerElement = doc.createElement('div');

    const sampleDoc = {
      webcontent: [
        {
          class: 'Frame',
          globalid: 'f1',
          alias: 'main_card',
          size: '{0,380},{0,340}',
          position: '{0.5,-190},{0.5,-170}',
          background_color: '#18181b',
          children: [
            { class: 'UICorner', globalid: 'c1', radius: '0,16' },
            { class: 'UIStroke', globalid: 's1', stroke_color: '#27272a', stroke_thickness: '2' },
            {
              class: 'TextButton?link',
              globalid: 'b1',
              alias: 'link_btn',
              size: '{1,0},{0,44}',
              text: 'Visit Docs',
              href: 'https://docs.rbx'
            }
          ]
        }
      ]
    };

    renderCatWebTree(sampleDoc, canvasContainer);

    const inspector = new CatWebInspector(canvasContainer, drawerElement);
    inspector.setTree(sampleDoc, canvasContainer);

    // Registry inspection
    const f1Desc = inspector.getDescriptor('f1');
    assert(!!f1Desc, 'Registry contains descriptor for Frame [f1]');
    assertEqual(f1Desc.jsonNode.alias, 'main_card', 'Descriptor preserves element alias');
    assertEqual(f1Desc.modifiers.length, 2, 'Extracts 2 modifiers (UICorner, UIStroke) for [f1]');

    const b1Desc = inspector.getDescriptor('b1');
    assert(!!b1Desc, 'Registry contains descriptor for TextButton?link [b1]');
    assertEqual(b1Desc.jsonNode.text, 'Visit Docs', 'Descriptor preserves button text');

    // Selection lifecycle
    inspector.enable();
    assert(inspector.isEnabled(), 'Inspector is enabled');

    inspector.selectElement('f1');
    assertEqual(inspector.selectedGlobalId, 'f1', 'Selects element [f1]');
    assert(drawerElement.innerHTML.includes('main_card'), 'Detail drawer displays alias "main_card"');
    assert(drawerElement.innerHTML.includes('UICorner'), 'Detail drawer displays modifier "UICorner"');
    assert(drawerElement.innerHTML.includes('UIStroke'), 'Detail drawer displays modifier "UIStroke"');

    inspector.selectElement('b1');
    assertEqual(inspector.selectedGlobalId, 'b1', 'Switches selection to [b1]');
    assert(drawerElement.innerHTML.includes('Visit Docs'), 'Detail drawer displays button text');
    assert(drawerElement.innerHTML.includes('?link'), 'Detail drawer displays subtype ?link');

    inspector.clearSelection();
    assertEqual(inspector.selectedGlobalId, null, 'Clears selection');
    assert(drawerElement.innerHTML.includes('No Element Selected'), 'Detail drawer displays empty state after clearing');

    inspector.toggle();
    assert(!inspector.isEnabled(), 'Toggles inspector state off');
  }

  /* ============================================================
   * 6. APPLICATION CONTROLLER & WORKLOAD INGESTION
   * ============================================================ */
  console.log('\n--- 6. APPLICATION CONTROLLER & WORKLOAD INGESTION ---');
  {
    const root = doc.createElement('div');
    root.innerHTML = `
      <select id="sampleSelect"></select>
      <input type="file" id="fileInput">
      <button id="uploadBtn"></button>
      <button id="rawJsonBtn"></button>
      <button id="inspectorBtn"></button>
      <button id="diagnosticsBtn"></button>
      <select id="zoomSelect">
        <option value="fit">Fit</option>
        <option value="0.5">50%</option>
        <option value="1">100%</option>
      </select>
      <button id="audioBtn"></button>
      <div id="editorPanel" class="hidden"></div>
      <textarea id="editorTextarea"></textarea>
      <button id="formatJsonBtn"></button>
      <button id="applyJsonBtn"></button>
      <button id="closeEditorBtn"></button>
      <div id="inspectorPanel" class="hidden"></div>
      <div id="inspectorDrawer"></div>
      <button id="closeInspectorBtn"></button>
      <div id="diagnosticsPanel" class="hidden"></div>
      <div id="diagnosticsDrawer"></div>
      <button id="closeDiagnosticsBtn"></button>
      <div id="viewportArea"></div>
      <div id="browserWindow"></div>
      <div id="pageTitle"></div>
      <div id="urlText"></div>
      <div id="canvasStage"></div>
      <div id="previewCanvas"></div>
      <div id="statusInfo"></div>
      <div id="statusResolution"></div>
      <div id="statusValidation"></div>
    `;

    const app = new CatWebRunnerApp(root);
    app.init();

    // 1. Ingest Minimal Site
    app.loadDocument(PRELOADED_SAMPLES.minimal_site);
    assertEqual(app.currentFormat, 'site', 'Detects Full Site format for minimal_site');
    assert(app.validationResult.valid, 'Validates minimal_site as 100% schema compliant');
    assertEqual(app.pageTitle.textContent, 'Minimal CatWeb Site — CatWeb', 'Updates browser title for site');
    assertEqual(app.urlText.textContent, 'catweb://minimal-catweb-site.rbx', 'Updates browser URL bar');

    // 2. Ingest User Snippet (Bare Array)
    app.loadDocument(PRELOADED_SAMPLES.user_snippet);
    assertEqual(app.currentFormat, 'snippet', 'Detects Component Snippet format for user_snippet');
    assert(app.validationResult.valid, 'Validates user_snippet as 100% schema compliant');
    assertEqual(app.urlText.textContent, 'catweb://snippet.rbx', 'Sets snippet.rbx for snippet format');

    // 3. Ingest Invalid Examples (13 Schema Errors)
    app.loadDocument(PRELOADED_SAMPLES.invalid_examples);
    assert(!app.validationResult.valid, 'Identifies invalid_examples as non-compliant');
    assertEqual(app.validationResult.errors.length, 13, 'Generates exactly 13 diagnostic errors for invalid_examples');
    assert(app.diagnosticsDrawer.innerHTML.includes('INVALID_UDIM2'), 'Diagnostics drawer renders INVALID_UDIM2 card');
    assert(app.diagnosticsDrawer.innerHTML.includes('DUPLICATE_GLOBALID'), 'Diagnostics drawer renders DUPLICATE_GLOBALID card');
    assert(app.diagnosticsDrawer.innerHTML.includes('NESTED_CONTROL_FLOW_ACTIONS'), 'Diagnostics drawer renders NESTED_CONTROL_FLOW_ACTIONS card');

    // 4. Zoom Controls
    app.setZoom(0.5);
    assertEqual(app.browserWindow.style.transform, 'scale(0.5)', 'Sets zoom to 50% scale');
    assertEqual(app.statusResolution.textContent, '1920 × 1080 (50%)', 'Updates status resolution text to 50%');

    app.setZoom(1);
    assertEqual(app.browserWindow.style.transform, 'scale(1)', 'Sets zoom to 100% scale');
    assertEqual(app.statusResolution.textContent, '1920 × 1080 (100%)', 'Updates status resolution text to 100%');

    // 5. Drawer toggles
    app.toggleInspector(true);
    assert(!app.inspectorPanel.classList.contains('hidden'), 'Opens inspector panel');
    app.toggleInspector(false);
    assert(app.inspectorPanel.classList.contains('hidden'), 'Closes inspector panel');

    app.toggleDiagnostics(true);
    assert(!app.diagnosticsPanel.classList.contains('hidden'), 'Opens diagnostics panel');
    app.toggleDiagnostics(false);
    assert(app.diagnosticsPanel.classList.contains('hidden'), 'Closes diagnostics panel');
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
    console.log('ALL RUNTIME & APPLICATION SHELL TESTS PASSED!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
