/**
 * Tier 1: Feature Coverage Test Suite
 * Validates core functionality across all 20 primary features (≥5 tests per feature).
 */

import { describe, test, it, expect, beforeEach } from './harness.js';
import {
  validateInput,
  normalizeInput,
  parseUDim2,
  parseUDim,
  parseVector2,
  udim2ToCss,
  anchorToCss,
  applyLayoutModifiers,
  applyUICorner,
  applyUIStroke,
  applyUIGradient,
  renderElement,
  resolveRobloxAsset,
  CatWebRuntime,
  KNOWN_LUCIDE_ICONS,
  KNOWN_AUDIO_ASSETS
} from './reference_adapter.js';
import { getDocument } from './harness.js';

describe('Tier 1: Feature Coverage', () => {

  // Feature 1: Dual Root Ingestion
  describe('Feature 1: Dual Root Ingestion', () => {
    test('1.1 ingests a valid Full Site object with required root keys', () => {
      const site = {
        favicon: "16944769468",
        title: "Test Site",
        background: "#0f0f11",
        webcontent: [{ class: "Frame", globalid: "f1" }]
      };
      const result = validateInput(site);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('site');
      expect(result.errors.length).toBe(0);
    });

    test('1.2 ingests a valid Component Snippet bare array', () => {
      const snippet = [
        { class: "Frame", globalid: "f1", size: "{1,0},{1,0}" },
        { class: "TextLabel", globalid: "t1", text: "Hello" }
      ];
      const result = validateInput(snippet);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('snippet');
      expect(result.errors.length).toBe(0);
    });

    test('1.3 parses raw JSON strings for both site and snippet formats', () => {
      const siteJson = JSON.stringify({
        favicon: "12345",
        title: "Site JSON",
        background: "#ffffff",
        webcontent: []
      });
      const resSite = validateInput(siteJson);
      expect(resSite.valid).toBe(true);
      expect(resSite.format).toBe('site');

      const snipJson = JSON.stringify([{ class: "Frame", globalid: "f0" }]);
      const resSnip = validateInput(snipJson);
      expect(resSnip.valid).toBe(true);
      expect(resSnip.format).toBe('snippet');
    });

    test('1.4 flags missing required root keys in Full Site objects', () => {
      const incompleteSite = {
        title: "No Favicon or Background",
        webcontent: []
      };
      const result = validateInput(incompleteSite);
      expect(result.valid).toBe(false);
      const codes = result.errors.map(e => e.code);
      expect(codes).toContain('MISSING_ROOT_KEY');
    });

    test('1.5 flags empty Component Snippet arrays as invalid', () => {
      const emptySnippet = [];
      const result = validateInput(emptySnippet);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_SNIPPET');
    });
  });

  // Feature 2: Multi-Root Sibling Elements
  describe('Feature 2: Multi-Root Sibling Elements', () => {
    test('2.1 allows multiple unwrapped root elements in a component snippet', () => {
      const snippet = [
        { class: "Frame", globalid: "r1" },
        { class: "ImageLabel", globalid: "r2" },
        { class: "TextButton", globalid: "r3" }
      ];
      const result = validateInput(snippet);
      expect(result.valid).toBe(true);
      expect(result.stats.elementCount).toBe(3);
    });

    test('2.2 allows multiple sibling elements inside site webcontent array', () => {
      const site = {
        favicon: "16944769468",
        title: "Multi-root Site",
        background: "#111111",
        webcontent: [
          { class: "Frame", globalid: "nb", alias: "navbar" },
          { class: "ScrollingFrame", globalid: "sf", alias: "body" },
          { class: "Frame", globalid: "ft", alias: "footer" }
        ]
      };
      const result = validateInput(site);
      expect(result.valid).toBe(true);
      expect(result.stats.elementCount).toBe(3);
    });

    test('2.3 renders multiple root elements sequentially into DOM container', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const elements = [
        { class: "Frame", globalid: "a1" },
        { class: "TextLabel", globalid: "a2", text: "Sibling" }
      ];
      for (const el of elements) {
        renderElement(el, container);
      }
      expect(container.children.length).toBe(2);
      expect(container.children[0].getAttribute('data-globalid')).toBe('a1');
      expect(container.children[1].getAttribute('data-globalid')).toBe('a2');
    });

    test('2.4 preserves independent order values across multi-root siblings', () => {
      const snippet = [
        { class: "Frame", globalid: "s1", order: "2" },
        { class: "Frame", globalid: "s2", order: "1" }
      ];
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of snippet) {
        renderElement(node, container);
      }
      expect(container.children[0].getAttribute('data-order')).toBe('2');
      expect(container.children[1].getAttribute('data-order')).toBe('1');
    });

    test('2.5 renders sibling roots containing their own independent child trees', () => {
      const snippet = [
        { class: "Frame", globalid: "c1", children: [{ class: "TextLabel", globalid: "t1", text: "Child 1" }] },
        { class: "Frame", globalid: "c2", children: [{ class: "TextLabel", globalid: "t2", text: "Child 2" }] }
      ];
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of snippet) {
        renderElement(node, container);
      }
      expect(container.children[0].children.length).toBe(1);
      expect(container.children[1].children.length).toBe(1);
    });
  });

  // Feature 3: UDim2 Parsing & Conversion
  describe('Feature 3: UDim2 Parsing & Conversion', () => {
    test('3.1 parses standard {scaleX, offsetX}, {scaleY, offsetY} string', () => {
      const u = parseUDim2('{1, 20}, {0.5, -10}');
      expect(u.scaleX).toBe(1);
      expect(u.offsetX).toBe(20);
      expect(u.scaleY).toBe(0.5);
      expect(u.offsetY).toBe(-10);
    });

    test('3.2 parses negative and decimal coordinates', () => {
      const u = parseUDim2('{-0.25, -50}, {-0.75, 12.5}');
      expect(u.scaleX).toBe(-0.25);
      expect(u.offsetX).toBe(-50);
      expect(u.scaleY).toBe(-0.75);
      expect(u.offsetY).toBe(12.5);
    });

    test('3.3 converts position UDim2 to CSS left and top calc expressions', () => {
      const css = udim2ToCss('{0.5, 10}, {0.2, -5}', true);
      expect(css.left).toBe('calc(50% + 10px)');
      expect(css.top).toBe('calc(20% + -5px)');
    });

    test('3.4 converts size UDim2 to CSS width and height calc expressions', () => {
      const css = udim2ToCss('{1, 0}, {0, 56}', false);
      expect(css.width).toBe('calc(100% + 0px)');
      expect(css.height).toBe('calc(0% + 56px)');
    });

    test('3.5 handles auto-sizing keywords gracefully in udim2ToCss', () => {
      const cssAuto = udim2ToCss('auto');
      expect(cssAuto.width).toBe('auto');
      expect(cssAuto.height).toBe('auto');

      const cssAutoY = udim2ToCss('auto_y');
      expect(cssAutoY.height).toBe('auto');
    });
  });

  // Feature 4: AnchorPoint Translation
  describe('Feature 4: AnchorPoint Translation', () => {
    test('4.1 translates top-left anchor "0,0" to origin (0%, 0%)', () => {
      const res = anchorToCss('0,0');
      expect(res.transformOrigin).toBe('calc(0%) calc(0%)');
      expect(res.transform).toBe('translate(calc(-1 * 0%), calc(-1 * 0%)) rotate(0deg)');
    });

    test('4.2 translates center anchor "0.5,0.5" to 50% shift', () => {
      const res = anchorToCss('0.5,0.5');
      expect(res.transformOrigin).toBe('calc(50%) calc(50%)');
      expect(res.transform).toBe('translate(calc(-1 * 50%), calc(-1 * 50%)) rotate(0deg)');
    });

    test('4.3 translates bottom-right anchor "1,1" to 100% shift', () => {
      const res = anchorToCss('1,1');
      expect(res.transformOrigin).toBe('calc(100%) calc(100%)');
      expect(res.transform).toBe('translate(calc(-1 * 100%), calc(-1 * 100%)) rotate(0deg)');
    });

    test('4.4 combines anchor translation with non-zero rotation angle', () => {
      const res = anchorToCss('0.5,0.5', 45);
      expect(res.transform).toContain('rotate(45deg)');
      expect(res.transformOrigin).toBe('calc(50%) calc(50%)');
    });

    test('4.5 defaults omitted anchor to "0,0" and 0deg rotation', () => {
      const res = anchorToCss(null, null);
      expect(res.transformOrigin).toBe('calc(0%) calc(0%)');
      expect(res.transform).toBe('translate(calc(-1 * 0%), calc(-1 * 0%)) rotate(0deg)');
    });
  });

  // Feature 5: Stacking & Z-Index
  describe('Feature 5: Stacking & Z-Index', () => {
    test('5.1 applies integer z_index directly to style.zIndex', () => {
      const node = { class: "Frame", globalid: "f1", z_index: "10" };
      const el = renderElement(node);
      expect(el.style.zIndex).toBe('10');
    });

    test('5.2 handles negative z_index strings correctly', () => {
      const node = { class: "Frame", globalid: "f2", z_index: "-1" };
      const el = renderElement(node);
      expect(el.style.zIndex).toBe('-1');
    });

    test('5.3 handles zero z_index string correctly', () => {
      const node = { class: "Frame", globalid: "f3", z_index: "0" };
      const el = renderElement(node);
      expect(el.style.zIndex).toBe('0');
    });

    test('5.4 preserves stacking order when multiple siblings declare z_index', () => {
      const doc = getDocument();
      const root = doc.createElement('div');
      const el1 = renderElement({ class: "Frame", globalid: "z1", z_index: "5" }, root);
      const el2 = renderElement({ class: "Frame", globalid: "z2", z_index: "20" }, root);
      expect(parseInt(el1.style.zIndex, 10)).toBeLessThan(parseInt(el2.style.zIndex, 10));
    });

    test('5.5 leaves zIndex undefined when z_index is omitted', () => {
      const node = { class: "Frame", globalid: "f4" };
      const el = renderElement(node);
      expect(el.style.zIndex).toBe('');
    });
  });

  // Feature 6: UIListLayout Emulation
  describe('Feature 6: UIListLayout Emulation', () => {
    test('6.1 sets flex-direction: column for Vertical direction', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const listMod = { class: "UIListLayout", direction: "Vertical" };
      applyLayoutModifiers(container, listMod, []);
      expect(container.style.display).toBe('flex');
      expect(container.style.flexDirection).toBe('column');
    });

    test('6.2 sets flex-direction: row for Horizontal direction', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const listMod = { class: "UIListLayout", direction: "Horizontal" };
      applyLayoutModifiers(container, listMod, []);
      expect(container.style.display).toBe('flex');
      expect(container.style.flexDirection).toBe('row');
    });

    test('6.3 applies padding offset to flex gap', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const listMod = { class: "UIListLayout", padding: "0,16" };
      applyLayoutModifiers(container, listMod, []);
      expect(container.style.gap).toBe('16px');
    });

    test('6.4 applies alignment_horizontal and alignment_vertical mappings', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const listMod = {
        class: "UIListLayout",
        direction: "Vertical",
        alignment_horizontal: "Center",
        alignment_vertical: "Center"
      };
      applyLayoutModifiers(container, listMod, []);
      expect(container.style.alignItems).toBe('center');
      expect(container.style.justifyContent).toBe('center');
    });

    test('6.5 assigns CSS order and relative positioning to children based on data-order', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const c1 = doc.createElement('div');
      c1.setAttribute('data-order', '2');
      const c2 = doc.createElement('div');
      c2.setAttribute('data-order', '1');
      container.appendChild(c1);
      container.appendChild(c2);

      const listMod = { class: "UIListLayout", sort: "LayoutOrder" };
      applyLayoutModifiers(container, listMod, [c1, c2]);

      expect(c1.style.position).toBe('relative');
      expect(c1.style.order).toBe('2');
      expect(c2.style.order).toBe('1');
    });
  });

  // Feature 7: UIGridLayout Emulation
  describe('Feature 7: UIGridLayout Emulation', () => {
    test('7.1 sets display: grid on container', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const gridMod = { class: "UIGridLayout" };
      applyLayoutModifiers(container, gridMod, []);
      expect(container.style.display).toBe('grid');
    });

    test('7.2 parses cell size UDim2 and sets grid-template-columns and grid-auto-rows', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const gridMod = { class: "UIGridLayout", size: "{0,180},{0,120}" };
      applyLayoutModifiers(container, gridMod, []);
      expect(container.style.gridTemplateColumns).toBe('repeat(auto-fill, minmax(180px, 1fr))');
      expect(container.style.gridAutoRows).toBe('120px');
    });

    test('7.3 parses UDim padding and applies grid gap', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const gridMod = { class: "UIGridLayout", padding: "0,12" };
      applyLayoutModifiers(container, gridMod, []);
      expect(container.style.gap).toBe('12px 12px');
    });

    test('7.4 parses UDim2 2D padding and sets separate row and column gap', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const gridMod = { class: "UIGridLayout", padding: "{0,10},{0,20}" };
      applyLayoutModifiers(container, gridMod, []);
      expect(container.style.gap).toBe('20px 10px');
    });

    test('7.5 sets relative positioning and order property on grid items', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const item = doc.createElement('div');
      item.setAttribute('data-order', '5');
      container.appendChild(item);

      const gridMod = { class: "UIGridLayout" };
      applyLayoutModifiers(container, gridMod, [item]);
      expect(item.style.position).toBe('relative');
      expect(item.style.order).toBe('5');
    });
  });

  // Feature 8: UIPadding Insets
  describe('Feature 8: UIPadding Insets', () => {
    test('8.1 applies pixel top and bottom padding insets', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const padMod = { class: "UIPadding", top: "0,16", bottom: "0,24" };
      applyLayoutModifiers(container, padMod);
      expect(container.style.paddingTop).toBe('calc(0% + 16px)');
      expect(container.style.paddingBottom).toBe('calc(0% + 24px)');
    });

    test('8.2 applies pixel left and right padding insets', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const padMod = { class: "UIPadding", left: "0,12", right: "0,12" };
      applyLayoutModifiers(container, padMod);
      expect(container.style.paddingLeft).toBe('calc(0% + 12px)');
      expect(container.style.paddingRight).toBe('calc(0% + 12px)');
    });

    test('8.3 applies scale percentage padding insets', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const padMod = { class: "UIPadding", top: "0.1,0", left: "0.05,0" };
      applyLayoutModifiers(container, padMod);
      expect(container.style.paddingTop).toBe('calc(10% + 0px)');
      expect(container.style.paddingLeft).toBe('calc(5% + 0px)');
    });

    test('8.4 applies combined scale and offset padding insets', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const padMod = { class: "UIPadding", right: "0.05,10" };
      applyLayoutModifiers(container, padMod);
      expect(container.style.paddingRight).toBe('calc(5% + 10px)');
    });

    test('8.5 gracefully ignores omitted padding sides without throwing', () => {
      const doc = getDocument();
      const container = doc.createElement('div');
      const padMod = { class: "UIPadding", top: "0,10" };
      applyLayoutModifiers(container, padMod);
      expect(container.style.paddingTop).toBe('calc(0% + 10px)');
      expect(container.style.paddingBottom).toBe('');
    });
  });

  // Feature 9: UIFlexItem Modifiers
  describe('Feature 9: UIFlexItem Modifiers', () => {
    test('9.1 applies grow_ratio to style.flexGrow', () => {
      const doc = getDocument();
      const item = doc.createElement('div');
      const flexMod = { class: "UIFlexItem", grow_ratio: "2" };
      applyLayoutModifiers(item, flexMod);
      expect(item.style.flexGrow).toBe('2');
    });

    test('9.2 applies shrink_ratio to style.flexShrink', () => {
      const doc = getDocument();
      const item = doc.createElement('div');
      const flexMod = { class: "UIFlexItem", shrink_ratio: "0.5" };
      applyLayoutModifiers(item, flexMod);
      expect(item.style.flexShrink).toBe('0.5');
    });

    test('9.3 sets flex: 1 1 0% for flex_mode: "Fill"', () => {
      const doc = getDocument();
      const item = doc.createElement('div');
      const flexMod = { class: "UIFlexItem", flex_mode: "Fill" };
      applyLayoutModifiers(item, flexMod);
      expect(item.style.flex).toBe('1 1 0%');
    });

    test('9.4 sets flexGrow: 1 for flex_mode: "Grow"', () => {
      const doc = getDocument();
      const item = doc.createElement('div');
      const flexMod = { class: "UIFlexItem", flex_mode: "Grow" };
      applyLayoutModifiers(item, flexMod);
      expect(item.style.flexGrow).toBe('1');
    });

    test('9.5 sets flexShrink: 1 for flex_mode: "Shrink"', () => {
      const doc = getDocument();
      const item = doc.createElement('div');
      const flexMod = { class: "UIFlexItem", flex_mode: "Shrink" };
      applyLayoutModifiers(item, flexMod);
      expect(item.style.flexShrink).toBe('1');
    });
  });

  // Feature 10: Frame Rendering
  describe('Feature 10: Frame Rendering', () => {
    test('10.1 renders element with class cw-node cw-frame and data-globalid', () => {
      const el = renderElement({ class: "Frame", globalid: "f1" });
      expect(el.className).toContain('cw-node');
      expect(el.className).toContain('cw-frame');
      expect(el.getAttribute('data-globalid')).toBe('f1');
    });

    test('10.2 applies background_color hex code', () => {
      const el = renderElement({ class: "Frame", globalid: "f2", background_color: "#18181b" });
      expect(el.style.backgroundColor).toBe('#18181b');
    });

    test('10.3 applies background_transparency to background color without affecting opacity or children', () => {
      const el = renderElement({ class: "Frame", globalid: "f3", background_color: "#18181b", background_transparency: "0.2" });
      expect(el.style.backgroundColor).toBe('rgba(24, 24, 27, 0.8)');
      expect(el.style.opacity).toBe('');
    });

    test('10.4 applies overflow: hidden when canvas is "true"', () => {
      const el = renderElement({ class: "Frame", globalid: "f4", canvas: "true" });
      expect(el.style.overflow).toBe('hidden');
    });

    test('10.5 hides element when visible is "false"', () => {
      const el = renderElement({ class: "Frame", globalid: "f5", visible: "false" });
      expect(el.style.display).toBe('none');
    });
  });

  // Feature 11: ScrollingFrame Rendering
  describe('Feature 11: ScrollingFrame Rendering', () => {
    test('11.1 renders element with overflow-y: auto for scrolling', () => {
      const el = renderElement({ class: "ScrollingFrame", globalid: "sf1" });
      expect(el.style.overflowY).toBe('auto');
    });

    test('11.2 applies scrollbar_thickness to style.scrollbarWidth', () => {
      const el = renderElement({ class: "ScrollingFrame", globalid: "sf2", scrollbar_thickness: "8" });
      expect(el.style.scrollbarWidth).toBe('8px');
    });

    test('11.3 renders ScrollingFrame with canvassize: "auto_y" without errors', () => {
      const el = renderElement({ class: "ScrollingFrame", globalid: "sf3", canvassize: "auto_y" });
      expect(el).toBeTruthy();
    });

    test('11.4 renders nested children inside ScrollingFrame container', () => {
      const el = renderElement({
        class: "ScrollingFrame",
        globalid: "sf4",
        children: [
          { class: "Frame", globalid: "c1" },
          { class: "Frame", globalid: "c2" }
        ]
      });
      expect(el.children.length).toBe(2);
    });

    test('11.5 supports full transparency on ScrollingFrame background', () => {
      const el = renderElement({ class: "ScrollingFrame", globalid: "sf5", background_transparency: "1" });
      expect(el.style.backgroundColor).toBe('transparent');
      expect(el.style.opacity).toBe('');
    });
  });

  // Feature 12: TextLabel Rendering
  describe('Feature 12: TextLabel Rendering', () => {
    test('12.1 renders text content accurately', () => {
      const el = renderElement({ class: "TextLabel", globalid: "tl1", text: "Hello CatWeb" });
      expect(el.textContent).toBe('Hello CatWeb');
    });

    test('12.2 applies font_color and font_size', () => {
      const el = renderElement({ class: "TextLabel", globalid: "tl2", text: "Test", font_color: "#ff00ff", font_size: "20" });
      expect(el.style.color).toBe('#ff00ff');
      expect(el.style.fontSize).toBe('20px');
    });

    test('12.3 sets data-text-scaled="true" when font_size is "scaled"', () => {
      const el = renderElement({ class: "TextLabel", globalid: "tl3", text: "Scaled", font_size: "scaled" });
      expect(el.getAttribute('data-text-scaled')).toBe('true');
    });

    test('12.4 applies horizontal text alignment', () => {
      const elLeft = renderElement({ class: "TextLabel", globalid: "tl4a", align_x: "Left" });
      expect(elLeft.style.textAlign).toBe('left');
      const elCenter = renderElement({ class: "TextLabel", globalid: "tl4b", align_x: "Center" });
      expect(elCenter.style.textAlign).toBe('center');
      const elRight = renderElement({ class: "TextLabel", globalid: "tl4c", align_x: "Right" });
      expect(elRight.style.textAlign).toBe('right');
    });

    test('12.5 applies text wrapping styles when wrap is "true"', () => {
      const el = renderElement({ class: "TextLabel", globalid: "tl5", wrap: "true" });
      expect(el.style.whiteSpace).toBe('normal');
      expect(el.style.wordBreak).toBe('break-word');
    });
  });

  // Feature 13: TextButton & States
  describe('Feature 13: TextButton & States', () => {
    test('13.1 renders TextButton with text and button class', () => {
      const el = renderElement({ class: "TextButton", globalid: "tb1", text: "Click Here" });
      expect(el.className).toContain('cw-textbutton');
      expect(el.textContent).toBe('Click Here');
    });

    test('13.2 dispatches click event listeners attached to element', () => {
      const el = renderElement({ class: "TextButton", globalid: "tb2", text: "Tap" });
      let clicked = false;
      el.addEventListener('click', () => { clicked = true; });
      el.click();
      expect(clicked).toBe(true);
    });

    test('13.3 renders custom button background_color and font_color', () => {
      const el = renderElement({
        class: "TextButton",
        globalid: "tb3",
        text: "Styled",
        background_color: "#2563eb",
        font_color: "#ffffff"
      });
      expect(el.style.backgroundColor).toBe('#2563eb');
      expect(el.style.color).toBe('#ffffff');
    });

    test('13.4 renders TextButton?link with data-subtype and data-href attributes', () => {
      const el = renderElement({
        class: "TextButton?link",
        globalid: "tb4",
        text: "Visit rbx",
        href: "home.rbx"
      });
      expect(el.getAttribute('data-subtype')).toBe('link');
      expect(el.getAttribute('data-href')).toBe('home.rbx');
    });

    test('13.5 renders TextButton?transfer with robux_amount metadata', () => {
      const el = renderElement({
        class: "TextButton?transfer",
        globalid: "tb5",
        text: "Donate",
        robux_amount: "50"
      });
      expect(el.getAttribute('data-subtype')).toBe('transfer');
      expect(el.getAttribute('data-robux')).toBe('50');
    });
  });

  // Feature 14: TextBox Rendering
  describe('Feature 14: TextBox Rendering', () => {
    test('14.1 renders TextBox with placeholder attribute', () => {
      const el = renderElement({ class: "TextBox", globalid: "tx1", placeholder: "Search..." });
      expect(el.getAttribute('placeholder')).toBe('Search...');
    });

    test('14.2 sets readonly when editable is "false"', () => {
      const el = renderElement({ class: "TextBox", globalid: "tx2", editable: "false" });
      expect(el.getAttribute('readonly')).toBe('true');
    });

    test('14.3 renders initial text content', () => {
      const el = renderElement({ class: "TextBox", globalid: "tx3", text: "Default Value" });
      expect(el.textContent).toBe('Default Value');
    });

    test('14.4 applies font and background color styling', () => {
      const el = renderElement({
        class: "TextBox",
        globalid: "tx4",
        background_color: "#27272a",
        font_color: "#ffffff"
      });
      expect(el.style.backgroundColor).toBe('#27272a');
      expect(el.style.color).toBe('#ffffff');
    });

    test('14.5 supports interactive input updates', () => {
      const el = renderElement({ class: "TextBox", globalid: "tx5", text: "Initial" });
      el.value = 'Updated User Input';
      expect(el.value).toBe('Updated User Input');
    });
  });

  // Feature 15: ImageLabel Rendering
  describe('Feature 15: ImageLabel Rendering', () => {
    test('15.1 maps curated Lucide asset ID to inline SVG', () => {
      const el = renderElement({ class: "ImageLabel", globalid: "im1", image_id: "76297972789266" });
      expect(el.getAttribute('data-asset-type')).toBe('svg');
      expect(el.innerHTML).toContain('cw-icon-search');
    });

    test('15.2 provides fallback badge SVG for unknown asset ID', () => {
      const el = renderElement({ class: "ImageLabel", globalid: "im2", image_id: "99999999999" });
      expect(el.getAttribute('data-asset-type')).toBe('badge');
      expect(el.innerHTML).toContain('cw-asset-fallback');
    });

    test('15.3 parses rbxassetid:// URI to extract numeric asset ID', () => {
      const el = renderElement({ class: "ImageLabel", globalid: "im3", image: "rbxassetid://128490289676597" });
      expect(el.getAttribute('data-asset-type')).toBe('svg');
      expect(el.innerHTML).toContain('cw-icon-house');
    });

    test('15.4 applies scale_type attribute', () => {
      const el = renderElement({ class: "ImageLabel", globalid: "im4", scale_type: "Fit" });
      expect(el.getAttribute('data-scale-type')).toBe('Fit');
    });

    test('15.5 applies background_transparency: "1" to render transparent container', () => {
      const el = renderElement({ class: "ImageLabel", globalid: "im5", background_transparency: "1" });
      expect(el.style.backgroundColor).toBe('transparent');
      expect(el.style.opacity).toBe('');
    });
  });

  // Feature 16: ImageButton Rendering
  describe('Feature 16: ImageButton Rendering', () => {
    test('16.1 renders clickable ImageButton with class and globalid', () => {
      const el = renderElement({ class: "ImageButton", globalid: "ib1" });
      expect(el.className).toContain('cw-imagebutton');
      expect(el.getAttribute('data-globalid')).toBe('ib1');
    });

    test('16.2 renders ImageButton?link with data-subtype and href', () => {
      const el = renderElement({
        class: "ImageButton?link",
        globalid: "ib2",
        href: "dashboard.rbx",
        image_id: "128490289676597"
      });
      expect(el.getAttribute('data-subtype')).toBe('link');
      expect(el.getAttribute('data-href')).toBe('dashboard.rbx');
    });

    test('16.3 dispatches click event on ImageButton', () => {
      const el = renderElement({ class: "ImageButton", globalid: "ib3" });
      let clicked = false;
      el.addEventListener('click', () => { clicked = true; });
      el.click();
      expect(clicked).toBe(true);
    });

    test('16.4 renders ImageButton?avataritem with product ID attribute', () => {
      const el = renderElement({
        class: "ImageButton?avataritem",
        globalid: "ib4",
        product: "98765432"
      });
      expect(el.getAttribute('data-subtype')).toBe('avataritem');
      expect(el.getAttribute('data-product')).toBe('98765432');
    });

    test('16.5 sets scale_type on ImageButton', () => {
      const el = renderElement({ class: "ImageButton", globalid: "ib5", scale_type: "Crop" });
      expect(el.getAttribute('data-scale-type')).toBe('Crop');
    });
  });

  // Feature 17: UICorner Modifier
  describe('Feature 17: UICorner Modifier', () => {
    test('17.1 applies pixel border-radius from UDim "0,8"', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUICorner(el, { class: "UICorner", radius: "0,8" });
      expect(el.style.borderRadius).toBe('8px');
    });

    test('17.2 applies pill/circle border-radius 9999px from scale "1,0"', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUICorner(el, { class: "UICorner", radius: "1,0" });
      expect(el.style.borderRadius).toBe('9999px');
    });

    test('17.3 applies percentage border-radius from scale fraction "0.5,0"', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUICorner(el, { class: "UICorner", radius: "0.5,0" });
      expect(el.style.borderRadius).toBe('50%');
    });

    test('17.4 applies calc expression for combined scale and offset "0.1,10"', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUICorner(el, { class: "UICorner", radius: "0.1,10" });
      expect(el.style.borderRadius).toBe('calc(10% + 10px)');
    });

    test('17.5 automatically applies to parent Frame when declared as child', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "fc",
        children: [{ class: "UICorner", radius: "0,12" }]
      });
      expect(el.style.borderRadius).toBe('12px');
    });
  });

  // Feature 18: UIStroke Modifier
  describe('Feature 18: UIStroke Modifier', () => {
    test('18.1 applies inner box-shadow for stroke_mode: "Border"', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIStroke(el, {
        class: "UIStroke",
        stroke_thickness: "2",
        stroke_color: "#2563eb",
        stroke_mode: "Border"
      });
      expect(el.style.boxShadow).toBe('inset 0 0 0 2px #2563eb');
    });

    test('18.2 applies -webkit-text-stroke for stroke_mode: "Contextual"', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIStroke(el, {
        class: "UIStroke",
        stroke_thickness: "1",
        stroke_color: "#ffffff",
        stroke_mode: "Contextual"
      });
      expect(el.style.WebkitTextStroke).toBe('1px #ffffff');
    });

    test('18.3 defaults stroke_mode to Border when omitted', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIStroke(el, { class: "UIStroke", stroke_thickness: "3", stroke_color: "#ff0000" });
      expect(el.style.boxShadow).toBe('inset 0 0 0 3px #ff0000');
    });

    test('18.4 defaults stroke_thickness to 1 when omitted', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIStroke(el, { class: "UIStroke", stroke_color: "#00ff00" });
      expect(el.style.boxShadow).toBe('inset 0 0 0 1px #00ff00');
    });

    test('18.5 automatically applies to parent Frame when declared as child', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "fs",
        children: [{ class: "UIStroke", stroke_thickness: "2", stroke_color: "#33333f" }]
      });
      expect(el.style.boxShadow).toBe('inset 0 0 0 2px #33333f');
    });
  });

  // Feature 19: UIGradient Modifier
  describe('Feature 19: UIGradient Modifier', () => {
    test('19.1 parses gradient_color stops array and creates CSS linear-gradient', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIGradient(el, {
        class: "UIGradient",
        gradient_color: '[[0,"#3b82f6"],[1,"#1d4ed8"]]',
        rotation: "0"
      });
      expect(el.style.backgroundImage).toContain('linear-gradient');
      expect(el.style.backgroundImage).toContain('#3b82f6 0%');
      expect(el.style.backgroundImage).toContain('#1d4ed8 100%');
    });

    test('19.2 converts Roblox 0 deg (horizontal) to CSS 90 deg', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIGradient(el, {
        class: "UIGradient",
        gradient_color: '[[0,"#000000"],[1,"#ffffff"]]',
        rotation: "0"
      });
      expect(el.style.backgroundImage).toContain('90deg');
    });

    test('19.3 converts Roblox 90 deg (vertical top-to-bottom) to CSS 180 deg', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIGradient(el, {
        class: "UIGradient",
        gradient_color: '[[0,"#000000"],[1,"#ffffff"]]',
        rotation: "90"
      });
      expect(el.style.backgroundImage).toContain('180deg');
    });

    test('19.4 wraps rotation angles modulo 360 deg', () => {
      const doc = getDocument();
      const el = doc.createElement('div');
      applyUIGradient(el, {
        class: "UIGradient",
        gradient_color: '[[0,"#000000"],[1,"#ffffff"]]',
        rotation: "360"
      });
      expect(el.style.backgroundImage).toContain('90deg');
    });

    test('19.5 automatically applies to parent Frame when declared as child', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "fg",
        children: [{
          class: "UIGradient",
          gradient_color: '[[0,"#ff0000"],[1,"#0000ff"]]',
          rotation: "0"
        }]
      });
      expect(el.style.backgroundImage).toContain('linear-gradient');
    });
  });

  // Feature 20: Asset Fallbacks & Resolution
  describe('Feature 20: Asset Fallbacks & Resolution', () => {
    test('20.1 resolves known Lucide icon asset ID to inline SVG type', () => {
      const asset = resolveRobloxAsset('128490289676597');
      expect(asset.type).toBe('svg');
      expect(asset.iconName).toBe('house');
    });

    test('20.2 resolves unknown asset ID to styled badge fallback type', () => {
      const asset = resolveRobloxAsset('9876543210');
      expect(asset.type).toBe('badge');
      expect(asset.content).toContain('RBX 9876543210');
    });

    test('20.3 resolves confirmed UI Audio asset ID to audio metadata', () => {
      const asset = resolveRobloxAsset('88442833509532');
      expect(asset.type).toBe('audio');
      expect(asset.name).toBe('click');
      expect(asset.freq).toBe(600);
    });

    test('20.4 extracts numeric ID from rbxassetid:// protocol prefix', () => {
      const asset = resolveRobloxAsset('rbxassetid://76297972789266');
      expect(asset.type).toBe('svg');
      expect(asset.iconName).toBe('search');
    });

    test('20.5 handles null or empty asset strings gracefully without error', () => {
      const asset = resolveRobloxAsset('');
      expect(asset.type).toBe('badge');
      expect(asset.content).toContain('NO ASSET');
    });
  });

});
