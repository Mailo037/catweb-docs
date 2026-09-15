/**
 * CatWeb Visual Elements & Styling Engine Test Suite (Milestone M3)
 *
 * Verifies:
 *   - 3-Tier Roblox Asset Fallback System (84 Lucide SVGs, procedural fallback badge, Web Audio synthesis)
 *   - Styling Modifiers (UICorner, UIStroke, UIGradient)
 *   - Visual Elements Factory (Frame, ScrollingFrame, TextLabel, TextScaled, TextButton, TextBox, ImageLabel, ImageButton, Button Subtypes)
 *   - Layout Modifier Integration (UIListLayout, UIGridLayout, UIPadding, UIFlexItem)
 *   - Real-world fixture tree rendering (minimal_site.json, interactive_counter.json, user_snippet.json)
 *
 * Run with: node web-runner/tests/visual_elements.test.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  KNOWN_LUCIDE_ICONS,
  KNOWN_AUDIO_ASSETS,
  LUCIDE_ICON_SVGS,
  resolveRobloxAsset,
  getLucideSvg,
  getProceduralAssetBadgeSvg,
  playSyntheticAudio
} from '../src/assets.js';

import {
  applyUICorner,
  applyUIStroke,
  applyUIGradient,
  hexToRgba,
  parseColorSequence,
  parseNumberSequence
} from '../src/styling.js';

import {
  renderElement,
  renderCatWebTree,
  renderRichText,
  computeTextScaledFontSize,
  getActiveDocument
} from '../src/elements.js';

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
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    const errMsg = `${message} — Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
    failures.push(errMsg);
    console.error(`  ✗ FAIL: ${errMsg}`);
  }
}

console.log('\n======================================================');
console.log('  CatWeb Visual Elements & Styling Engine Test Suite  ');
console.log('======================================================\n');

/* ------------------------------------------------------------
 * 1. ASSET ENGINE & 3-TIER RESOLVER TESTS
 * ------------------------------------------------------------ */
console.log('--- 1. ASSET ENGINE & 3-TIER RESOLVER ---');

// Tier 1: Known Lucide Icons
assertEqual(KNOWN_LUCIDE_ICONS.size >= 84, true, 'At least 84 verified Lucide icon IDs registered');

const searchAsset = resolveRobloxAsset('76297972789266');
assertEqual(searchAsset.type, 'svg', 'Resolves known ID 76297972789266 to type "svg"');
assertEqual(searchAsset.iconName, 'search', 'Identified as icon "search"');
assert(searchAsset.content.includes('cw-icon-search'), 'SVG content includes "cw-icon-search" class');
assert(searchAsset.content.includes('<svg') && searchAsset.content.includes('</svg>'), 'SVG content is valid element');

const houseUri = resolveRobloxAsset('rbxassetid://128490289676597');
assertEqual(houseUri.type, 'svg', 'Parses rbxassetid:// protocol prefix');
assertEqual(houseUri.iconName, 'house', 'Identified as icon "house"');
assert(houseUri.content.includes('cw-icon-house'), 'SVG content includes "cw-icon-house"');

// Spot check diverse icons from directory
const testIconIds = [
  ['117017076630548', 'user-round'],
  ['123045282429289', 'settings'],
  ['73775766036081', 'star'],
  ['81821025513215', 'heart'],
  ['132053311021067', 'arrow-left'],
  ['86341424256591', 'arrow-right'],
  ['128762341789893', 'plus'],
  ['97241930499310', 'x'],
  ['99802726511524', 'check'],
  ['82968254856227', 'clock'],
  ['99601667182985', 'lock'],
  ['122444800533384', 'external-link'],
  ['130977740797889', 'copy'],
  ['132473860015433', 'globe'],
  ['136802848902260', 'flame'],
  ['134524065816559', 'ban']
];

for (const [id, expectedName] of testIconIds) {
  const a = resolveRobloxAsset(id);
  assert(a.type === 'svg' && a.iconName === expectedName, `Icon ID ${id} maps to "${expectedName}"`);
}

// Tier 2: Procedural Fallback Badge for Unknown Assets
const unknownAsset = resolveRobloxAsset('99999999999');
assertEqual(unknownAsset.type, 'badge', 'Resolves unknown asset ID to type "badge"');
assert(unknownAsset.content.includes('cw-asset-fallback'), 'Fallback badge contains "cw-asset-fallback" class');
assert(unknownAsset.content.includes('RBX 99999999999'), 'Fallback badge displays asset ID badge');
assert(unknownAsset.content.includes('<path d="M60 26 L88 42'), 'Fallback badge contains isometric cube geometry');

// Empty / Null asset string handling
const emptyAsset = resolveRobloxAsset('');
assertEqual(emptyAsset.type, 'badge', 'Empty asset string returns badge');
assert(emptyAsset.content.includes('NO ASSET'), 'Empty asset badge displays "NO ASSET"');

const nullAsset = resolveRobloxAsset(null);
assertEqual(nullAsset.type, 'badge', 'Null asset returns badge');

// Tier 3: Web Audio Synthesis for UI Sounds
assertEqual(KNOWN_AUDIO_ASSETS.size, 8, '8 confirmed UI audio assets registered');

const clickAudio = resolveRobloxAsset('88442833509532');
assertEqual(clickAudio.type, 'audio', 'Resolves click sound ID to type "audio"');
assertEqual(clickAudio.name, 'click', 'Click audio identified as "click"');
assertEqual(clickAudio.freq, 600, 'Click audio frequency is 600Hz');
assert(typeof clickAudio.play === 'function', 'Audio object exposes play() function');

const successAudio = resolveRobloxAsset('136211732441165');
assertEqual(successAudio.name, 'success', 'Success audio identified as "success"');
assertEqual(successAudio.freq, 880, 'Success audio frequency is 880Hz');

// Test audio synthesis simulation in headless Node.js
const synthResult = playSyntheticAudio('88442833509532');
assertEqual(synthResult.success, true, 'playSyntheticAudio succeeds in headless mode without crashing');
assertEqual(synthResult.simulated, true, 'playSyntheticAudio returns simulated: true in Node environment');
assertEqual(synthResult.id, '88442833509532', 'playSyntheticAudio preserves sound ID');

/* ------------------------------------------------------------
 * 2. STYLING MODIFIERS ENGINE TESTS
 * ------------------------------------------------------------ */
console.log('\n--- 2. STYLING MODIFIERS ENGINE ---');

// UICorner
const mockCornerEl = new MockElement('div');
applyUICorner(mockCornerEl, { class: "UICorner", radius: "0,8" });
assertEqual(mockCornerEl.style.borderRadius, '8px', 'UICorner pixel radius "0,8" -> 8px');

applyUICorner(mockCornerEl, { class: "UICorner", radius: "1,0" });
assertEqual(mockCornerEl.style.borderRadius, '9999px', 'UICorner full pill radius "1,0" -> 9999px');

applyUICorner(mockCornerEl, { class: "UICorner", radius: "0.5,0" });
assertEqual(mockCornerEl.style.borderRadius, '50%', 'UICorner percentage radius "0.5,0" -> 50%');

applyUICorner(mockCornerEl, { class: "UICorner", radius: "0.1,10" });
assertEqual(mockCornerEl.style.borderRadius, 'calc(10% + 10px)', 'UICorner combined radius "0.1,10" -> calc(10% + 10px)');

// UIStroke
const mockStrokeEl = new MockElement('div');
applyUIStroke(mockStrokeEl, {
  class: "UIStroke",
  stroke_thickness: "2",
  stroke_color: "#2563eb",
  stroke_mode: "Border"
});
assertEqual(mockStrokeEl.style.boxShadow, 'inset 0 0 0 2px #2563eb', 'UIStroke Border mode produces inset box-shadow');

applyUIStroke(mockStrokeEl, {
  class: "UIStroke",
  stroke_thickness: "1",
  stroke_color: "#ffffff",
  stroke_mode: "Contextual"
});
assertEqual(mockStrokeEl.style.WebkitTextStroke, '1px #ffffff', 'UIStroke Contextual mode produces -webkit-text-stroke');

applyUIStroke(mockStrokeEl, {
  class: "UIStroke",
  stroke_thickness: "4",
  stroke_color: "#ff0000",
  stroke_transparency: "0.5",
  stroke_mode: "Border"
});
assert(mockStrokeEl.style.boxShadow.includes('rgba(255, 0, 0, 0.5)'), 'UIStroke handles stroke_transparency with rgba');

// UIGradient
const mockGradEl = new MockElement('div');
applyUIGradient(mockGradEl, {
  class: "UIGradient",
  gradient_color: '[[0,"#3b82f6"],[1,"#1d4ed8"]]',
  rotation: "0"
});
assert(mockGradEl.style.backgroundImage.includes('linear-gradient(90deg'), 'UIGradient converts Roblox 0 deg to CSS 90deg');
assert(mockGradEl.style.backgroundImage.includes('#3b82f6 0%'), 'UIGradient includes start color stop 0%');
assert(mockGradEl.style.backgroundImage.includes('#1d4ed8 100%'), 'UIGradient includes end color stop 100%');

applyUIGradient(mockGradEl, {
  class: "UIGradient",
  gradient_color: '[[0,"#000000"],[1,"#ffffff"]]',
  rotation: "90"
});
assert(mockGradEl.style.backgroundImage.includes('linear-gradient(180deg'), 'UIGradient converts Roblox 90 deg to CSS 180deg');

applyUIGradient(mockGradEl, {
  class: "UIGradient",
  gradient_color: '[[0,"#000000"],[1,"#ffffff"]]',
  rotation: "360"
});
assert(mockGradEl.style.backgroundImage.includes('linear-gradient(90deg'), 'UIGradient wraps 360 deg rotation modulo 360 to 90deg');

/* ------------------------------------------------------------
 * 3. VISUAL ELEMENTS FACTORY & DOM RENDERER TESTS
 * ------------------------------------------------------------ */
console.log('\n--- 3. VISUAL ELEMENTS FACTORY & DOM RENDERER ---');

// Frame
const frameEl = renderElement({
  class: "Frame",
  globalid: "f_test",
  alias: "main_card",
  size: "{0,300},{0,200}",
  position: "{0.5,-150},{0.5,-100}",
  background_color: "#18181b",
  background_transparency: "0.2",
  canvas: "true",
  z_index: "5"
});
assert(frameEl !== null, 'renderElement returns created Frame element');
assertEqual(frameEl.getAttribute('data-globalid'), 'f_test', 'Preserves data-globalid attribute');
assertEqual(frameEl.getAttribute('data-alias'), 'main_card', 'Preserves data-alias attribute');
assertEqual(frameEl.style.width, 'calc(0% + 300px)', 'UDim2 size width calc');
assertEqual(frameEl.style.height, 'calc(0% + 200px)', 'UDim2 size height calc');
assertEqual(frameEl.style.left, 'calc(50% - 150px)', 'UDim2 position left calc');
assertEqual(frameEl.style.top, 'calc(50% - 100px)', 'UDim2 position top calc');
assertEqual(frameEl.style.backgroundColor, '#18181b', 'Background color applied');
assertEqual(parseFloat(frameEl.style.opacity), 0.8, 'Background transparency 0.2 -> opacity 0.8');
assertEqual(frameEl.style.overflow, 'hidden', 'canvas="true" maps to overflow: hidden');
assertEqual(frameEl.style.zIndex, '5', 'z_index applied');

// ScrollingFrame
const scrollEl = renderElement({
  class: "ScrollingFrame",
  globalid: "sf_test",
  size: "{1,0},{1,-56}",
  position: "{0,0},{0,56}",
  canvassize: "auto_y",
  scrollbar_thickness: "8",
  background_transparency: "1"
});
assertEqual(scrollEl.style.overflowY, 'auto', 'ScrollingFrame overflow-y is auto');
assertEqual(scrollEl.style.overflowX, 'hidden', 'ScrollingFrame overflow-x is hidden');
assertEqual(scrollEl.style.scrollbarWidth, '8px', 'Scrollbar thickness applied');
assertEqual(scrollEl.getAttribute('data-canvassize'), 'auto_y', 'canvassize metadata preserved');
assertEqual(parseFloat(scrollEl.style.opacity), 0, 'background_transparency "1" -> opacity 0');

// TextLabel
const textEl = renderElement({
  class: "TextLabel",
  globalid: "tl_test",
  text: "CatWeb Rocks!",
  font_color: "#ffffff",
  font_size: "18",
  font_weight: "Bold",
  align_x: "Center",
  wrap: "true",
  truncate: "AtEnd"
});
assertEqual(textEl.textContent, 'CatWeb Rocks!', 'TextLabel text content rendered');
assertEqual(textEl.style.color, '#ffffff', 'Font color applied');
assertEqual(textEl.style.fontSize, '18px', 'Font size applied in pixels');
assertEqual(textEl.style.fontWeight, 'Bold', 'Font weight applied');
assertEqual(textEl.style.textAlign, 'center', 'Horizontal alignment mapped to lowercase');
assertEqual(textEl.style.whiteSpace, 'nowrap', 'truncate: "AtEnd" sets nowrap');
assertEqual(textEl.style.textOverflow, 'ellipsis', 'truncate: "AtEnd" sets textOverflow: ellipsis');

// RichText
const richHtml = renderRichText('<b>Bold</b> and <i>Italic</i> and <font color="#3b82f6">Blue</font>');
assert(richHtml.includes('<b>Bold</b>'), 'Renders <b> tag');
assert(richHtml.includes('<i>Italic</i>'), 'Renders <i> tag');
assert(richHtml.includes('<span style="color:#3b82f6">Blue</span>'), 'Renders <font color> tag');

// TextScaled
const scaledTextEl = renderElement({
  class: "TextLabel",
  globalid: "sc_test",
  text: "Adaptive Text",
  font_size: "scaled"
});
assertEqual(scaledTextEl.getAttribute('data-text-scaled'), 'true', 'Sets data-text-scaled="true"');
const optFontSize = computeTextScaledFontSize("Adaptive Text", 200, 50);
assert(optFontSize >= 12 && optFontSize <= 35, `computeTextScaledFontSize calculates sane optimal size (${optFontSize}px)`);

// TextButton & ImageButton
const btnEl = renderElement({
  class: "TextButton",
  globalid: "btn_test",
  text: "Submit Form",
  background_color: "#2563eb",
  font_color: "#ffffff"
});
assert(btnEl.className.includes('cw-textbutton'), 'Has cw-textbutton class');
assertEqual(btnEl.style.cursor, 'pointer', 'Button has pointer cursor');
let btnWasClicked = false;
btnEl.addEventListener('click', () => { btnWasClicked = true; });
btnEl.click();
assertEqual(btnWasClicked, true, 'TextButton dispatches click event');

// Button Subtypes: ?link, ?transfer, ?avataritem, ?donation
const linkBtn = renderElement({
  class: "TextButton?link",
  globalid: "lk_test",
  text: "Go to Wiki",
  href: "wiki.rbx",
  new_tab: "true"
});
assertEqual(linkBtn.getAttribute('data-subtype'), 'link', 'Subtype link attribute');
assertEqual(linkBtn.getAttribute('data-href'), 'wiki.rbx', 'Link href preserved');
assertEqual(linkBtn.getAttribute('data-new-tab'), 'true', 'Link new_tab preserved');

const transferBtn = renderElement({
  class: "TextButton?transfer",
  globalid: "tr_test",
  text: "Tip 100",
  robux_amount: "100"
});
assertEqual(transferBtn.getAttribute('data-subtype'), 'transfer', 'Subtype transfer attribute');
assertEqual(transferBtn.getAttribute('data-robux'), '100', 'Robux amount preserved');

const avatarBtn = renderElement({
  class: "ImageButton?avataritem",
  globalid: "av_test",
  product: "88776655",
  product_type: "Hat"
});
assertEqual(avatarBtn.getAttribute('data-subtype'), 'avataritem', 'Subtype avataritem attribute');
assertEqual(avatarBtn.getAttribute('data-product'), '88776655', 'Avatar product ID preserved');
assertEqual(avatarBtn.getAttribute('data-product-type'), 'Hat', 'Avatar product type preserved');

const donationBtn = renderElement({
  class: "TextButton?donation",
  globalid: "dn_test",
  robux_amount: "50"
});
assertEqual(donationBtn.getAttribute('data-subtype'), 'donation', 'Subtype donation attribute');
assertEqual(donationBtn.getAttribute('data-robux'), '50', 'Donation robux amount preserved');

// TextBox
const textBoxEl = renderElement({
  class: "TextBox",
  globalid: "tx_test",
  placeholder: "Enter search terms...",
  placeholder_color: "#9ca3af",
  editable: "false",
  text: "Initial Query"
});
assertEqual(textBoxEl.getAttribute('placeholder'), 'Enter search terms...', 'TextBox placeholder attribute');
assertEqual(textBoxEl.getAttribute('readonly'), 'true', 'editable="false" sets readonly attribute');
assertEqual(textBoxEl.textContent, 'Initial Query', 'Initial text assigned');
textBoxEl.value = 'New Value';
assertEqual(textBoxEl.value, 'New Value', 'Interactive value mutation supported');

// ImageLabel with Lucide Icon & Fallback Badge
const imgLucide = renderElement({
  class: "ImageLabel",
  globalid: "img_lucide",
  image_id: "128490289676597",
  image_color: "#3b82f6",
  scale_type: "Fit"
});
assertEqual(imgLucide.getAttribute('data-asset-type'), 'svg', 'Known image ID resolves to type "svg"');
assert(imgLucide.innerHTML.includes('cw-icon-house'), 'ImageLabel renders inline house SVG');
assertEqual(imgLucide.getAttribute('data-scale-type'), 'Fit', 'scale_type attribute preserved');
assertEqual(imgLucide.style.color, '#3b82f6', 'image_color applied to color style for vector tinting');

const imgFallback = renderElement({
  class: "ImageLabel",
  globalid: "img_bad",
  image_id: "876543210987"
});
assertEqual(imgFallback.getAttribute('data-asset-type'), 'badge', 'Unknown image ID resolves to type "badge"');
assert(imgFallback.innerHTML.includes('cw-asset-fallback'), 'ImageLabel renders procedural fallback badge');
assert(imgFallback.innerHTML.includes('RBX 876543210987'), 'Badge displays asset ID');

/* ------------------------------------------------------------
 * 4. LAYOUT MODIFIERS INTEGRATION TESTS
 * ------------------------------------------------------------ */
console.log('\n--- 4. LAYOUT MODIFIERS INTEGRATION ---');

// Frame with UIListLayout and ordered children
const listContainer = renderElement({
  class: "Frame",
  globalid: "list_cont",
  children: [
    { class: "UIListLayout", direction: "Horizontal", padding: "0,16", alignment_horizontal: "Center", alignment_vertical: "Center" },
    { class: "Frame", globalid: "child_c", order: "3" },
    { class: "Frame", globalid: "child_a", order: "1" },
    { class: "Frame", globalid: "child_b", order: "2" }
  ]
});
assertEqual(listContainer.children.length, 3, 'Container has 3 visual children rendered');
assertEqual(listContainer.style.display, 'flex', 'Container has display: flex');
assertEqual(listContainer.style.flexDirection, 'row', 'Horizontal direction maps to flex-direction: row');
assertEqual(listContainer.style.gap, '16px', 'Padding 0,16 maps to gap: 16px');
assertEqual(listContainer.children[0].style.order, '3', 'Child 0 has order: 3');
assertEqual(listContainer.children[1].style.order, '1', 'Child 1 has order: 1');
assertEqual(listContainer.children[2].style.order, '2', 'Child 2 has order: 2');
assertEqual(listContainer.children[0].style.position, 'relative', 'List child has position: relative');

// Frame with UIGridLayout
const gridContainer = renderElement({
  class: "Frame",
  globalid: "grid_cont",
  children: [
    { class: "UIGridLayout", size: "{0,120},{0,80}", padding: "0,12" },
    { class: "Frame", globalid: "grid_c1" }
  ]
});
assertEqual(gridContainer.style.display, 'grid', 'Grid container has display: grid');
assertEqual(gridContainer.style.gridAutoRows, '80px', 'Grid cell height mapped');
assertEqual(gridContainer.children[0].style.width, '100%', 'Grid child has 100% width');
assertEqual(gridContainer.children[0].style.height, '100%', 'Grid child has 100% height');

// Frame with UIPadding
const padContainer = renderElement({
  class: "Frame",
  globalid: "pad_cont",
  children: [
    { class: "UIPadding", top: "0,20", bottom: "0,20", left: "0,30", right: "0,30" },
    { class: "TextLabel", globalid: "inner_lbl", text: "Padded" }
  ]
});
assertEqual(padContainer.style.paddingTop, 'calc(0% + 20px)', 'UIPadding top applied');
assertEqual(padContainer.style.paddingLeft, 'calc(0% + 30px)', 'UIPadding left applied');

// UIFlexItem on child
const flexParent = renderElement({
  class: "Frame",
  globalid: "fp",
  children: [
    { class: "UIListLayout", direction: "Horizontal" },
    {
      class: "Frame",
      globalid: "flex_item_1",
      children: [{ class: "UIFlexItem", grow_ratio: "3", shrink_ratio: "0" }]
    },
    {
      class: "Frame",
      globalid: "flex_item_2",
      children: [{ class: "UIFlexItem", flex_mode: "Fill" }]
    }
  ]
});
assertEqual(flexParent.children[0].style.flexGrow, '3', 'Child 1 receives flexGrow: 3');
assertEqual(flexParent.children[0].style.flexShrink, '0', 'Child 1 receives flexShrink: 0');
assertEqual(flexParent.children[1].style.flex, '1 1 0%', 'Child 2 receives flex: 1 1 0% for Fill mode');

/* ------------------------------------------------------------
 * 5. REAL-WORLD FIXTURE TREE RENDERING TESTS
 * ------------------------------------------------------------ */
console.log('\n--- 5. REAL-WORLD FIXTURE TREE RENDERING ---');

// 5.1 Minimal Site
const minSitePath = 'skills/catweb/examples/minimal_site.json';
const minSiteJson = fs.readFileSync(minSitePath, 'utf8');
const minSiteData = JSON.parse(minSiteJson);
const doc = getDocument();
const minSiteRoot = doc.createElement('div');
const renderedMinSite = renderCatWebTree(minSiteData, minSiteRoot);

assertEqual(renderedMinSite.length, 1, 'minimal_site.json renders 1 root element');
assertEqual(minSiteRoot.style.backgroundColor, '#0f0f11', 'Site background color applied to root canvas');
const minNavbar = minSiteRoot.querySelector('[data-alias="navbar"]');
assert(minNavbar !== null, 'Finds sticky navbar in minimal_site');
assertEqual(minNavbar.style.zIndex, '10', 'Navbar has z_index: 10');
const minDocsLink = minSiteRoot.querySelector('[data-alias="docs_link"]');
assert(minDocsLink !== null, 'Finds docs link button');
assertEqual(minDocsLink.getAttribute('data-subtype'), 'link', 'Docs link has data-subtype="link"');
assertEqual(minDocsLink.getAttribute('data-href'), 'docs.rbx', 'Docs link has href="docs.rbx"');

// 5.2 Interactive Counter
const counterPath = 'skills/catweb/examples/interactive_counter.json';
const counterJson = fs.readFileSync(counterPath, 'utf8');
const counterData = JSON.parse(counterJson);
const counterRoot = doc.createElement('div');
const renderedCounter = renderCatWebTree(counterData, counterRoot);

assertEqual(renderedCounter.length, 1, 'interactive_counter.json renders 1 root element');
const counterCard = counterRoot.querySelector('[data-alias="counter_card"]') || counterRoot.querySelector('[data-globalid="cd"]');
assert(counterCard !== null, 'Finds centered counter card');
const countDisplay = counterRoot.querySelector('[data-alias="count_label"]') || counterRoot.querySelector('[data-globalid="cnt"]');
assert(countDisplay !== null, 'Finds count display label');
const incButton = counterRoot.querySelector('[data-alias="click_btn"]') || counterRoot.querySelector('[data-globalid="btn"]');
assert(incButton !== null, 'Finds increment button');
const rstButton = counterRoot.querySelector('[data-alias="reset_btn"]') || counterRoot.querySelector('[data-globalid="rst"]');
assert(rstButton !== null, 'Finds reset button');

// 5.3 User Snippet (13 root elements, special ASCII global IDs)
const snippetPath = 'tools/test_fixtures/user_snippet.json';
const snippetJson = fs.readFileSync(snippetPath, 'utf8');
const snippetData = JSON.parse(snippetJson);
const snippetRoot = doc.createElement('div');
const renderedSnippet = renderCatWebTree(snippetData, snippetRoot);

assertEqual(renderedSnippet.length >= 11, true, `user_snippet.json renders multiple root elements (${renderedSnippet.length})`);
// Test special ASCII globalid preservation
const backslashNode = snippetRoot.querySelector('[data-globalid="\\4"]');
assert(backslashNode !== null, 'Preserves backslash ASCII globalid "\\4"');
const spaceNode = snippetRoot.querySelector('[data-globalid=" i"]');
assert(spaceNode !== null, 'Preserves leading space ASCII globalid " i"');
const starNode = snippetRoot.querySelector('[data-globalid="*w"]');
assert(starNode !== null, 'Preserves asterisk ASCII globalid "*w"');

console.log('\n======================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('======================================================\n');

if (failedTests > 0) {
  console.error('FAILED ASSERTIONS:');
  failures.forEach((f, idx) => console.error(`  ${idx + 1}) ${f}`));
  process.exit(1);
} else {
  console.log('ALL VISUAL ELEMENTS & STYLING ENGINE TESTS PASSED!\n');
  process.exit(0);
}
