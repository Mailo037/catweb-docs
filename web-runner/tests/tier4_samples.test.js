/**
 * Tier 4: Real-World Workload Test Suite
 * Validates official sample sites and fixtures against the full parser, layout, and runtime engines.
 */

import { describe, test, it, expect } from './harness.js';
import {
  validateInput,
  renderElement,
  resolveRobloxAsset,
  CatWebRuntime
} from './reference_adapter.js';
import { getDocument } from './harness.js';
import {
  FIXTURE_MINIMAL_SITE_JSON,
  FIXTURE_INTERACTIVE_COUNTER_JSON,
  FIXTURE_USER_SNIPPET_JSON,
  FIXTURE_VALID_SNIPPET_JSON,
  FIXTURE_INVALID_EXAMPLES_JSON
} from './fixtures_data.js';

describe('Tier 4: Real-World Workloads', () => {

  // Workload 1: Minimal CatWeb Site
  describe('Workload 1: skills/catweb/examples/minimal_site.json', () => {
    test('1.1 passes strict semantic validation with 0 errors and 30 unique elements', () => {
      expect(FIXTURE_MINIMAL_SITE_JSON).toBeTruthy();
      const res = validateInput(FIXTURE_MINIMAL_SITE_JSON);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('site');
      expect(res.errors.length).toBe(0);
      expect(res.stats.elementCount).toBe(30);
      expect(res.stats.idCount).toBe(30);
    });

    test('1.2 renders root frame and extracts page title and background', () => {
      const data = JSON.parse(FIXTURE_MINIMAL_SITE_JSON);
      expect(data.title).toBe('Minimal CatWeb Site');
      expect(data.background).toBe('#0f0f11');
      expect(data.favicon).toBe('16944769468');

      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      expect(page.children.length).toBeGreaterThan(0);
      const rootFrame = page.children[0];
      expect(rootFrame.getAttribute('data-alias')).toBe('root');
      expect(rootFrame.style.backgroundColor).toBe('#0f0f11');
    });

    test('1.3 renders sticky navbar frame with z_index: "10"', () => {
      const data = JSON.parse(FIXTURE_MINIMAL_SITE_JSON);
      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      const navbar = page.querySelector('[data-alias="navbar"]');
      expect(navbar).toBeTruthy();
      expect(navbar.style.zIndex).toBe('10');
      expect(navbar.style.height).toBe('calc(0% + 56px)');
    });

    test('1.4 renders body ScrollingFrame with canvassize: "auto_y"', () => {
      const data = JSON.parse(FIXTURE_MINIMAL_SITE_JSON);
      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      const scroller = page.querySelector('.cw-scrollingframe');
      expect(scroller).toBeTruthy();
      expect(scroller.style.overflowY).toBe('auto');
      expect(scroller.style.top).toBe('calc(0% + 56px)');
    });

    test('1.5 resolves site favicon and thumbnail asset IDs through asset resolver', () => {
      const data = JSON.parse(FIXTURE_MINIMAL_SITE_JSON);
      const favAsset = resolveRobloxAsset(data.favicon);
      expect(favAsset).toBeTruthy();
      expect(favAsset.type).toBe('svg');

      const thumbAsset = resolveRobloxAsset(data.thumbnail);
      expect(thumbAsset).toBeTruthy();
      expect(thumbAsset.type).toBe('svg');
    });
  });

  // Workload 2: Interactive Counter Site
  describe('Workload 2: skills/catweb/examples/interactive_counter.json', () => {
    test('2.1 passes strict semantic validation with 0 errors and 20 elements', () => {
      expect(FIXTURE_INTERACTIVE_COUNTER_JSON).toBeTruthy();
      const res = validateInput(FIXTURE_INTERACTIVE_COUNTER_JSON);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('site');
      expect(res.errors.length).toBe(0);
      expect(res.stats.elementCount).toBe(20);
    });

    test('2.2 renders centered layout card and interactive buttons', () => {
      const data = JSON.parse(FIXTURE_INTERACTIVE_COUNTER_JSON);
      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      const card = page.querySelector('[data-alias="counter_card"]');
      expect(card).toBeTruthy();
      expect(card.style.width).toBe('calc(0% + 380px)');
      expect(card.style.height).toBe('calc(0% + 340px)');

      const btn = page.querySelector('[data-alias="click_btn"]');
      const rst = page.querySelector('[data-alias="reset_btn"]');
      const cnt = page.querySelector('[data-alias="count_label"]');
      expect(btn).toBeTruthy();
      expect(rst).toBeTruthy();
      expect(cnt).toBeTruthy();
    });

    test('2.3 initializes runtime and verifies initial variable state', () => {
      const data = JSON.parse(FIXTURE_INTERACTIVE_COUNTER_JSON);
      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      const runtime = new CatWebRuntime(data, page);
      runtime.start(); // triggers event 0 (website loaded)
      expect(runtime.getVariable(1)).toBe(0);
    });

    test('2.4 increments counter variable and updates text label on button click', () => {
      const data = JSON.parse(FIXTURE_INTERACTIVE_COUNTER_JSON);
      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      const runtime = new CatWebRuntime(data, page);
      runtime.start();

      // Trigger button click on btn (globalid "btn")
      runtime.triggerEvent("btn", 1);
      expect(runtime.getVariable(1)).toBe(1);
      const cntLabel = page.querySelector('[data-alias="count_label"]');
      expect(cntLabel.textContent).toBe('Count: 1');

      // Click again
      runtime.triggerEvent("btn", 1);
      expect(runtime.getVariable(1)).toBe(2);
      expect(cntLabel.textContent).toBe('Count: 2');
    });

    test('2.5 triggers conditional goal reaching when counter reaches 10 and resets on rst click', () => {
      const data = JSON.parse(FIXTURE_INTERACTIVE_COUNTER_JSON);
      const doc = getDocument();
      const page = doc.createElement('div');
      for (const el of data.webcontent) {
        renderElement(el, page);
      }
      const runtime = new CatWebRuntime(data, page);
      runtime.start();

      // Click 10 times to reach goal
      for (let i = 0; i < 10; i++) {
        runtime.triggerEvent("btn", 1);
      }
      expect(runtime.getVariable(1)).toBe(10);
      const cntLabel = page.querySelector('[data-alias="count_label"]');
      expect(cntLabel.textContent).toBe('Goal reached: 10!');
      expect(runtime.lastAudioPlayed).toBe('136211732441165');

      // Click reset button (globalid "rst")
      runtime.triggerEvent("rst", 1);
      expect(runtime.getVariable(1)).toBe(0);
      expect(cntLabel.textContent).toBe('Count: 0');
    });
  });

  // Workload 3: User Component Snippet
  describe('Workload 3: tools/test_fixtures/user_snippet.json', () => {
    test('3.1 passes strict semantic validation with 22 elements and 0 errors', () => {
      expect(FIXTURE_USER_SNIPPET_JSON).toBeTruthy();
      const res = validateInput(FIXTURE_USER_SNIPPET_JSON);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('snippet');
      expect(res.errors.length).toBe(0);
      expect(res.stats.elementCount).toBe(22);
    });

    test('3.2 parses 13 unwrapped root sibling elements', () => {
      const data = JSON.parse(FIXTURE_USER_SNIPPET_JSON);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(13);
    });

    test('3.3 renders modifier elements under root Frame "P+"', () => {
      const data = JSON.parse(FIXTURE_USER_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const pPlus = container.querySelector('[data-globalid="P+"]');
      expect(pPlus).toBeTruthy();
      expect(pPlus.style.display).toBe('grid'); // UIGridLayout applied
    });

    test('3.4 safely handles printable ASCII global IDs with spaces, slashes, and symbols', () => {
      const data = JSON.parse(FIXTURE_USER_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const allElements = container.querySelectorAll('[data-globalid]');
      const gids = allElements.map(el => el.getAttribute('data-globalid'));

      expect(gids).toContain('\\4');
      expect(gids).toContain(' i');
      expect(gids).toContain('*w');
      expect(gids).toContain('e|');
      expect(gids).toContain('K}');
    });

    test('3.5 renders button subtypes (link, transfer, avataritem) declared in snippet', () => {
      const data = JSON.parse(FIXTURE_USER_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const allSubtypes = container.querySelectorAll('[data-subtype]').map(el => el.getAttribute('data-subtype'));
      expect(allSubtypes).toContain('link');
      expect(allSubtypes).toContain('transfer');
      expect(allSubtypes).toContain('avataritem');
    });
  });

  // Workload 4: Valid Component Snippet
  describe('Workload 4: tools/test_fixtures/valid_snippet.json', () => {
    test('4.1 passes strict semantic validation with 4 elements and 0 errors', () => {
      expect(FIXTURE_VALID_SNIPPET_JSON).toBeTruthy();
      const res = validateInput(FIXTURE_VALID_SNIPPET_JSON);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('snippet');
      expect(res.errors.length).toBe(0);
      expect(res.stats.elementCount).toBe(4);
    });

    test('4.2 renders centered card frame with exact pixel dimensions and offset positioning', () => {
      const data = JSON.parse(FIXTURE_VALID_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const card = container.querySelector('[data-globalid="cd"]');
      expect(card).toBeTruthy();
      expect(card.style.width).toBe('calc(0% + 300px)');
      expect(card.style.height).toBe('calc(0% + 180px)');
      expect(card.style.left).toBe('calc(50% + -150px)');
      expect(card.style.top).toBe('calc(50% + -90px)');
    });

    test('4.3 applies UICorner radius 12px to card frame', () => {
      const data = JSON.parse(FIXTURE_VALID_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const card = container.querySelector('[data-globalid="cd"]');
      expect(card.style.borderRadius).toBe('12px');
    });

    test('4.4 applies UIStroke border styling to card frame', () => {
      const data = JSON.parse(FIXTURE_VALID_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const card = container.querySelector('[data-globalid="cd"]');
      expect(card.style.boxShadow).toBe('inset 0 0 0 1px #33333f');
    });

    test('4.5 renders inset TextLabel "Component Snippet"', () => {
      const data = JSON.parse(FIXTURE_VALID_SNIPPET_JSON);
      const doc = getDocument();
      const container = doc.createElement('div');
      for (const node of data) {
        renderElement(node, container);
      }
      const label = container.querySelector('[data-globalid="tx"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toBe('Component Snippet');
      expect(label.style.fontSize).toBe('16px');
      expect(label.style.textAlign).toBe('center');
    });
  });

  // Workload 5: Invalid Examples Diagnostic Suite
  describe('Workload 5: tools/test_fixtures/invalid_examples.json', () => {
    test('5.1 correctly fails validation with exactly 13 diagnostic errors', () => {
      expect(FIXTURE_INVALID_EXAMPLES_JSON).toBeTruthy();
      const res = validateInput(FIXTURE_INVALID_EXAMPLES_JSON);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBe(13);
    });

    test('5.2 catches coordinate and color violations (INVALID_UDIM2, INVALID_HEX_COLOR)', () => {
      const res = validateInput(FIXTURE_INVALID_EXAMPLES_JSON);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('INVALID_UDIM2');
      expect(codes).toContain('INVALID_HEX_COLOR');
    });

    test('5.3 catches unquoted scalar violations (RAW_BOOLEAN_SCALAR, RAW_NUMBER_SCALAR)', () => {
      const res = validateInput(FIXTURE_INVALID_EXAMPLES_JSON);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('RAW_BOOLEAN_SCALAR');
      expect(codes).toContain('RAW_NUMBER_SCALAR');
    });

    test('5.4 catches forbidden properties and duplicate globalids', () => {
      const res = validateInput(FIXTURE_INVALID_EXAMPLES_JSON);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('FORBIDDEN_PROPERTY');
      expect(codes).toContain('DUPLICATE_GLOBALID');
    });

    test('5.5 catches script structural errors (NESTED_CONTROL_FLOW_ACTIONS, WRONG_WAIT_BLOCK_ID, UNRESOLVED_OBJECT_REFERENCE)', () => {
      const res = validateInput(FIXTURE_INVALID_EXAMPLES_JSON);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('NESTED_CONTROL_FLOW_ACTIONS');
      expect(codes).toContain('WRONG_WAIT_BLOCK_ID');
      expect(codes).toContain('UNRESOLVED_OBJECT_REFERENCE');
    });
  });

});
