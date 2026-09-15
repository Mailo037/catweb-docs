/**
 * CatWeb Core Engine Test Suite
 *
 * Tests parser.js, validator.js, coordinates.js, and layout.js against official fixtures.
 * Run with: node web-runner/tests/core_engine.test.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseCatWebJson,
  detectFormat,
  getRootElements,
  normalizeCatWeb,
  findJsonLineColumn
} from '../src/parser.js';

import {
  validateCatWeb,
  validateInput
} from '../src/validator.js';

import {
  parseUDim2,
  parseUDim,
  parseVector2,
  udimToCss,
  udim2ToCss,
  resolveElementSizeCss,
  anchorToCss,
  zIndexToCss,
  computePixelBounds
} from '../src/coordinates.js';

import {
  extractModifiers,
  sortChildrenByLayoutOrder,
  resolveListLayoutStyles,
  resolveGridLayoutStyles,
  resolvePaddingStyles,
  resolveFlexItemStyles,
  resolveConstraintStyles,
  computeContainerLayout,
  computeChildLayout
} from '../src/layout.js';

// Test runner state
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  assert(actualStr === expectedStr, `${message} (Expected: ${expectedStr}, Got: ${actualStr})`);
}

console.log('====================================================');
console.log('CATWEB CORE ENGINE VERIFICATION SUITE');
console.log('====================================================\n');

/* ------------------------------------------------------------
 * 1. Parser & Normalizer Tests
 * ------------------------------------------------------------ */
console.log('--- 1. PARSER & NORMALIZER ENGINE ---');

// Format detection
const siteData = { favicon: '123', title: 'Test', background: '#000', webcontent: [] };
const snippetData = [{ class: 'Frame', globalid: 'f1' }, { class: 'TextLabel', globalid: 't1' }];
assertEqual(detectFormat(siteData), 'site', 'Detects Full Site format');
assertEqual(detectFormat(snippetData), 'snippet', 'Detects Component Snippet format');
assertEqual(detectFormat({ foo: 'bar' }), 'unknown', 'Detects unknown format');

// Root elements
assertEqual(getRootElements(snippetData).length, 2, 'Extracts multi-root sibling elements from snippet');
assertEqual(getRootElements(siteData).length, 0, 'Extracts root elements from full site');

// Line/Column syntax error reporting
const badJson = '{\n  "class": "Frame",\n  "broken": ,\n  "valid": "yes"\n}';
const parseRes = parseCatWebJson(badJson);
assert(!parseRes.success, 'Syntax error correctly caught in parseCatWebJson');
assert(parseRes.error && parseRes.error.line > 0, `Line detected: line ${parseRes.error?.line}, col ${parseRes.error?.column}`);
assert(parseRes.error?.snippet.includes('^'), 'Error snippet includes caret pointing to column');

// Normalizer
const unnormalized = {
  class: 'Frame',
  visible: true,
  order: 42,
  background_color: '2563eb',
  layout_order: 5,
  direction: 'vertical',
  children: [
    { class: 'TextLabel', font_size: 16, order: 1 }
  ]
};

const normRes = normalizeCatWeb(unnormalized);
const normData = normRes.normalized;
assertEqual(normData.visible, 'true', 'Normalizer coerces boolean to quoted string');
assertEqual(normData.order, '5', 'Normalizer remapped layout_order to order');
assertEqual(normData.background_color, '#2563eb', 'Normalizer auto-prefixed # to hex color');
assertEqual(normData.direction, 'Vertical', 'Normalizer corrected enum casing');
assertEqual(normData.children[0].font_size, '16', 'Normalizer coerced child font_size to quoted string');
assert(normRes.repairs.length >= 5, `Normalizer tracked ${normRes.repairs.length} repair actions`);

/* ------------------------------------------------------------
 * 2. Validator Engine Tests against Official Fixtures
 * ------------------------------------------------------------ */
console.log('\n--- 2. SEMANTIC VALIDATOR ENGINE (OFFICIAL FIXTURES) ---');

const minimalSiteRaw = fs.readFileSync('skills/catweb/examples/minimal_site.json', 'utf8');
const v1 = validateCatWeb(minimalSiteRaw);
assert(v1.valid === true, 'minimal_site.json is 100% VALID');
assertEqual(v1.format, 'site', 'minimal_site.json identified as site');
assertEqual(v1.errors.length, 0, 'minimal_site.json has 0 errors');
assertEqual(v1.stats.elementsCount, 30, 'minimal_site.json element count matches 30');

const counterRaw = fs.readFileSync('skills/catweb/examples/interactive_counter.json', 'utf8');
const v2 = validateCatWeb(counterRaw);
assert(v2.valid === true, 'interactive_counter.json is 100% VALID');
assertEqual(v2.format, 'site', 'interactive_counter.json identified as site');
assertEqual(v2.errors.length, 0, 'interactive_counter.json has 0 errors');
assertEqual(v2.stats.elementsCount, 20, 'interactive_counter.json element count matches 20');
assertEqual(v2.stats.scriptsCount, 1, 'interactive_counter.json script count matches 1');

const userSnippetRaw = fs.readFileSync('tools/test_fixtures/user_snippet.json', 'utf8');
const v3 = validateCatWeb(userSnippetRaw);
assert(v3.valid === true, 'user_snippet.json is 100% VALID');
assertEqual(v3.format, 'snippet', 'user_snippet.json identified as snippet');
assertEqual(v3.errors.length, 0, 'user_snippet.json has 0 errors');
assertEqual(v3.stats.elementsCount, 22, 'user_snippet.json element count matches 22');

const invalidRaw = fs.readFileSync('tools/test_fixtures/invalid_examples.json', 'utf8');
const v4 = validateCatWeb(invalidRaw);
assert(v4.valid === false, 'invalid_examples.json is correctly marked INVALID');
assertEqual(v4.errors.length, 13, 'invalid_examples.json caught exactly 13 errors');

const errorCodes = new Set(v4.errors.map(e => e.code));
const expectedCodes = [
  'INVALID_UDIM2',
  'INVALID_HEX_COLOR',
  'RAW_BOOLEAN_SCALAR',
  'FORBIDDEN_PROPERTY',
  'DUPLICATE_GLOBALID',
  'RAW_NUMBER_SCALAR',
  'NESTED_CONTROL_FLOW_ACTIONS',
  'INVALID_GLOBALID',
  'INVALID_SCRIPT_PROPERTY',
  'WRONG_WAIT_BLOCK_ID',
  'UNRESOLVED_OBJECT_REFERENCE'
];

for (const code of expectedCodes) {
  assert(errorCodes.has(code), `Caught expected error code "${code}"`);
}

/* ------------------------------------------------------------
 * 3. Coordinate Mathematics & CSS Converter Tests
 * ------------------------------------------------------------ */
console.log('\n--- 3. COORDINATE MATHEMATICS & CSS ENGINE ---');

// UDim2 parsing
const u1 = parseUDim2('{0.5, 20},{1, -40}');
assertEqual(u1, { scaleX: 0.5, offsetX: 20, scaleY: 1, offsetY: -40 }, 'parseUDim2 parses scale and offsets with negatives');

const uZero = parseUDim2('');
assertEqual(uZero, { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 }, 'parseUDim2 defaults safely on empty input');

// UDim parsing
const ud1 = parseUDim('0, 16');
assertEqual(ud1, { scale: 0, offset: 16 }, 'parseUDim parses scale and offset');

// Vector2 parsing
const v2d = parseVector2('0.5, 0.5');
assertEqual(v2d, { x: 0.5, y: 0.5 }, 'parseVector2 parses 2D vector');

// udimToCss string formatting
assertEqual(udimToCss(0, 0), '0px', 'udimToCss(0, 0) -> "0px"');
assertEqual(udimToCss(0, 16), '16px', 'udimToCss(0, 16) -> "16px"');
assertEqual(udimToCss(1, 0), '100%', 'udimToCss(1, 0) -> "100%"');
assertEqual(udimToCss(0.5, 10), 'calc(50% + 10px)', 'udimToCss(0.5, 10) -> "calc(50% + 10px)"');
assertEqual(udimToCss(1, -56), 'calc(100% - 56px)', 'udimToCss(1, -56) -> "calc(100% - 56px)"');

// Auto sizes
assertEqual(resolveElementSizeCss('auto').width, 'max-content', 'resolveElementSizeCss("auto") width is max-content');
assertEqual(resolveElementSizeCss('auto_y', '0, 200').width, '200px', 'resolveElementSizeCss("auto_y", "0, 200") width is 200px');
assertEqual(resolveElementSizeCss('auto_y').height, 'max-content', 'resolveElementSizeCss("auto_y") height is max-content');

// AnchorPoint and Rotation
const aCenter = anchorToCss('0.5,0.5', 45);
assertEqual(aCenter.transformOrigin, '50% 50%', 'Anchor transformOrigin is 50% 50%');
assertEqual(aCenter.transform, 'translate(-50%, -50%) rotate(45deg)', 'Anchor transform combines translation and rotation');

const aTopLeft = anchorToCss('0,0', 0);
assertEqual(aTopLeft.transformOrigin, '0% 0%', 'Top-left anchor transformOrigin is 0% 0%');
assertEqual(aTopLeft.transform, 'none', 'Top-left anchor without rotation has transform: none');

// Stacking / z-index
assertEqual(zIndexToCss('10'), 10, 'zIndexToCss("10") -> 10');
assertEqual(zIndexToCss(''), 1, 'zIndexToCss("") -> 1 default');

// Exact pixel bounds calculation
const pb = computePixelBounds('{0.5, 0},{0.5, 0}', '{0.5, 0},{0.5, 0}', { width: 1000, height: 600 }, '0.5, 0.5');
assertEqual(pb.left, 250, 'Pixel bounds left is 250');
assertEqual(pb.top, 150, 'Pixel bounds top is 150');
assertEqual(pb.width, 500, 'Pixel bounds width is 500');
assertEqual(pb.height, 300, 'Pixel bounds height is 300');
assertEqual(pb.right, 750, 'Pixel bounds right is 750');
assertEqual(pb.bottom, 450, 'Pixel bounds bottom is 450');

/* ------------------------------------------------------------
 * 4. Layout Modifier & Container Engine Tests
 * ------------------------------------------------------------ */
console.log('\n--- 4. LAYOUT MODIFIER ENGINE ---');

// Modifier extraction
const containerNode = {
  class: 'Frame',
  children: [
    { class: 'UIListLayout', direction: 'Horizontal', padding: '0, 8', alignment_horizontal: 'Center', alignment_vertical: 'Center', horizontal_flex: 'Fill' },
    { class: 'UIPadding', top: '0, 10', bottom: '0, 10', left: '0, 15', right: '0, 15' },
    { class: 'UIAspectRatioConstraint', ratio: '1.7777777' },
    { class: 'TextLabel', globalid: 'c2', order: '2' },
    { class: 'TextButton', globalid: 'c1', order: '1', children: [{ class: 'UIFlexItem', grow_ratio: '2', flex_mode: 'Grow' }] }
  ]
};

const extracted = extractModifiers(containerNode);
assert(extracted.listLayout !== null, 'UIListLayout extracted');
assert(extracted.padding !== null, 'UIPadding extracted');
assert(extracted.aspectRatio !== null, 'UIAspectRatioConstraint extracted');
assertEqual(extracted.visualChildren.length, 2, 'Extracted 2 visual children, skipping modifiers');

// LayoutOrder sorting
const sortedChildren = sortChildrenByLayoutOrder(extracted.visualChildren);
assertEqual(sortedChildren[0].globalid, 'c1', 'First visual child sorted to order 1');
assertEqual(sortedChildren[1].globalid, 'c2', 'Second visual child sorted to order 2');

// Container layout resolution
const containerLayout = computeContainerLayout(containerNode);
assertEqual(containerLayout.layoutType, 'flex', 'Container layout type is flex');
assertEqual(containerLayout.containerStyles['aspect-ratio'], '1.7777777', 'Container aspect-ratio constraint applied');
assertEqual(containerLayout.hostStyles['flex-direction'], 'row', 'Horizontal direction mapped to row');
assertEqual(containerLayout.hostStyles['gap'], '8px', 'Padding 0, 8 mapped to gap 8px');
assertEqual(containerLayout.hostStyles['padding-top'], '10px', 'UIPadding top mapped to 10px');
assertEqual(containerLayout.hostStyles['padding-left'], '15px', 'UIPadding left mapped to 15px');

// Child layout resolution
const child1Layout = computeChildLayout(sortedChildren[0], containerLayout.layoutType, containerLayout.modifiers);
assertEqual(child1Layout.positionMode, 'relative', 'Child inside flex layout has positionMode relative');
assertEqual(child1Layout.childStyles.position, 'relative', 'Child inside flex has position: relative');
assertEqual(child1Layout.childStyles.order, '1', 'Child has order 1');
assertEqual(child1Layout.childStyles['flex-grow'], '2', 'Child UIFlexItem grow_ratio 2 applied');

// Grid Layout resolution
const gridContainer = {
  class: 'Frame',
  children: [
    { class: 'UIGridLayout', size: '{0, 180},{0, 120}', padding: '0, 16', alignment_horizontal: 'Left', fill_direction_max_cells: '4' },
    { class: 'Frame', globalid: 'g1', order: '1' }
  ]
};

const gridLayout = computeContainerLayout(gridContainer);
assertEqual(gridLayout.layoutType, 'grid', 'Container layout type is grid');
assertEqual(gridLayout.hostStyles['grid-template-columns'], 'repeat(4, 180px)', 'Grid columns use max_cells count');
assertEqual(gridLayout.hostStyles['grid-auto-rows'], '120px', 'Grid row size matches cell height');
assertEqual(gridLayout.hostStyles['column-gap'], '16px', 'Grid padding mapped to column-gap 16px');

const gridChildLayout = computeChildLayout(gridContainer.children[1], gridLayout.layoutType);
assertEqual(gridChildLayout.positionMode, 'relative', 'Grid child has positionMode relative');
assertEqual(gridChildLayout.childStyles.width, '100%', 'Grid child takes 100% cell width');
assertEqual(gridChildLayout.childStyles.height, '100%', 'Grid child takes 100% cell height');

// Summary report
console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL CORE ENGINE VERIFICATION TESTS PASSED!');
}
