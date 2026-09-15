/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Validates edge conditions, extreme values, invariants, and error resilience (≥5 tests per category).
 */

import { describe, test, it, expect } from './harness.js';
import {
  validateInput,
  normalizeInput,
  parseUDim2,
  parseUDim,
  parseVector2,
  udim2ToCss,
  anchorToCss,
  renderElement
} from './reference_adapter.js';
import { getDocument } from './harness.js';

describe('Tier 2: Boundary & Corner Cases', () => {

  // Category 1: Zero and Negative Sizes
  describe('Boundary 1: Zero and Negative Sizes', () => {
    test('1.1 parses pure zero size UDim2 {0,0},{0,0}', () => {
      const u = parseUDim2('{0,0},{0,0}');
      expect(u.scaleX).toBe(0);
      expect(u.offsetX).toBe(0);
      expect(u.scaleY).toBe(0);
      expect(u.offsetY).toBe(0);
      const css = udim2ToCss('{0,0},{0,0}', false);
      expect(css.width).toBe('calc(0% + 0px)');
      expect(css.height).toBe('calc(0% + 0px)');
    });

    test('1.2 parses negative offset sizes {1,-56},{1,-100}', () => {
      const u = parseUDim2('{1,-56},{1,-100}');
      expect(u.offsetX).toBe(-56);
      expect(u.offsetY).toBe(-100);
      const css = udim2ToCss('{1,-56},{1,-100}', false);
      expect(css.width).toBe('calc(100% + -56px)');
      expect(css.height).toBe('calc(100% + -100px)');
    });

    test('1.3 parses negative scale fractions {-0.5,0},{-0.5,0}', () => {
      const u = parseUDim2('{-0.5,0},{-0.5,0}');
      expect(u.scaleX).toBe(-0.5);
      expect(u.scaleY).toBe(-0.5);
      const css = udim2ToCss('{-0.5,0},{-0.5,0}', false);
      expect(css.width).toBe('calc(-50% + 0px)');
      expect(css.height).toBe('calc(-50% + 0px)');
    });

    test('1.4 parses both negative scale and negative offset {-1,-50},{-0.5,-20}', () => {
      const u = parseUDim2('{-1,-50},{-0.5,-20}');
      expect(u.scaleX).toBe(-1);
      expect(u.offsetX).toBe(-50);
      expect(u.scaleY).toBe(-0.5);
      expect(u.offsetY).toBe(-20);
    });

    test('1.5 renders element with zero-dimension UDim2 without crashing', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "z0",
        size: "{0,0},{0,0}"
      });
      expect(el.style.width).toBe('calc(0% + 0px)');
      expect(el.style.height).toBe('calc(0% + 0px)');
    });
  });

  // Category 2: Scale-Only Coordinates
  describe('Boundary 2: Scale-Only Coordinates', () => {
    test('2.1 computes 100% dimensions for full scale {1,0},{1,0}', () => {
      const css = udim2ToCss('{1,0},{1,0}', false);
      expect(css.width).toBe('calc(100% + 0px)');
      expect(css.height).toBe('calc(100% + 0px)');
    });

    test('2.2 computes 50% width and 25% height for fractional scale {0.5,0},{0.25,0}', () => {
      const css = udim2ToCss('{0.5,0},{0.25,0}', false);
      expect(css.width).toBe('calc(50% + 0px)');
      expect(css.height).toBe('calc(25% + 0px)');
    });

    test('2.3 converts scale-only position {0.5,0},{0.5,0} for center placement', () => {
      const css = udim2ToCss('{0.5,0},{0.5,0}', true);
      expect(css.left).toBe('calc(50% + 0px)');
      expect(css.top).toBe('calc(50% + 0px)');
    });

    test('2.4 handles multi-decimal precision scale like 0.333333', () => {
      const u = parseUDim2('{0.333333,0},{0.666667,0}');
      expect(u.scaleX).toBe(0.333333);
      expect(u.scaleY).toBe(0.666667);
      expect(u.offsetX).toBe(0);
      expect(u.offsetY).toBe(0);
    });

    test('2.5 renders scale-only element maintaining percentage width in DOM', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "sc1",
        size: "{1,0},{0.5,0}"
      });
      expect(el.style.width).toContain('100%');
      expect(el.style.height).toContain('50%');
    });
  });

  // Category 3: Offset-Only Coordinates
  describe('Boundary 3: Offset-Only Coordinates', () => {
    test('3.1 computes fixed pixel size {0,300},{0,180}', () => {
      const css = udim2ToCss('{0,300},{0,180}', false);
      expect(css.width).toBe('calc(0% + 300px)');
      expect(css.height).toBe('calc(0% + 180px)');
    });

    test('3.2 computes fixed pixel position {0,56},{0,56}', () => {
      const css = udim2ToCss('{0,56},{0,56}', true);
      expect(css.left).toBe('calc(0% + 56px)');
      expect(css.top).toBe('calc(0% + 56px)');
    });

    test('3.3 computes negative offset-only coordinates {0,-20},{0,-40}', () => {
      const css = udim2ToCss('{0,-20},{0,-40}', true);
      expect(css.left).toBe('calc(0% + -20px)');
      expect(css.top).toBe('calc(0% + -40px)');
    });

    test('3.4 parses large pixel offsets up to 10000px', () => {
      const u = parseUDim2('{0,10000},{0,5000}');
      expect(u.offsetX).toBe(10000);
      expect(u.offsetY).toBe(5000);
    });

    test('3.5 renders offset-only element with fixed pixel calculations in DOM', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "of1",
        size: "{0,250},{0,150}",
        position: "{0,10},{0,20}"
      });
      expect(el.style.width).toBe('calc(0% + 250px)');
      expect(el.style.height).toBe('calc(0% + 150px)');
      expect(el.style.left).toBe('calc(0% + 10px)');
      expect(el.style.top).toBe('calc(0% + 20px)');
    });
  });

  // Category 4: Deeply Nested Containers
  describe('Boundary 4: Deeply Nested Containers', () => {
    test('4.1 renders 5 levels of deeply nested Frames without stack overflow', () => {
      const nested = {
        class: "Frame", globalid: "L1",
        children: [{
          class: "Frame", globalid: "L2",
          children: [{
            class: "Frame", globalid: "L3",
            children: [{
              class: "Frame", globalid: "L4",
              children: [{
                class: "Frame", globalid: "L5",
                children: [{ class: "TextLabel", globalid: "L6", text: "Deep" }]
              }]
            }]
          }]
        }]
      };
      const root = renderElement(nested);
      expect(root.getAttribute('data-globalid')).toBe('L1');
      const l5 = root.querySelector('[data-globalid="L5"]');
      expect(l5).toBeTruthy();
      const l6 = root.querySelector('[data-globalid="L6"]');
      expect(l6).toBeTruthy();
      expect(l6.textContent).toBe('Deep');
    });

    test('4.2 preserves parent-child relationships through 5 levels', () => {
      const nested = {
        class: "Frame", globalid: "p1",
        children: [{
          class: "Frame", globalid: "p2",
          children: [{
            class: "Frame", globalid: "p3",
            children: [{ class: "Frame", globalid: "p4" }]
          }]
        }]
      };
      const el1 = renderElement(nested);
      const el2 = el1.children[0];
      const el3 = el2.children[0];
      const el4 = el3.children[0];
      expect(el4.getAttribute('data-globalid')).toBe('p4');
      expect(el4.parentNode).toBe(el3);
      expect(el3.parentNode).toBe(el2);
      expect(el2.parentNode).toBe(el1);
    });

    test('4.3 propagates clipping across nested hierarchy', () => {
      const nested = {
        class: "Frame", globalid: "c_root", canvas: "true",
        children: [{
          class: "Frame", globalid: "c_sub", canvas: "false",
          children: [{ class: "Frame", globalid: "c_leaf", canvas: "true" }]
        }]
      };
      const root = renderElement(nested);
      expect(root.style.overflow).toBe('hidden');
      const sub = root.querySelector('[data-globalid="c_sub"]');
      expect(sub.style.overflow).toBe('');
      const leaf = root.querySelector('[data-globalid="c_leaf"]');
      expect(leaf.style.overflow).toBe('hidden');
    });

    test('4.4 resolves z-index across nested container scopes', () => {
      const nested = {
        class: "Frame", globalid: "z_root", z_index: "1",
        children: [{
          class: "Frame", globalid: "z_mid", z_index: "10",
          children: [{ class: "Frame", globalid: "z_inner", z_index: "5" }]
        }]
      };
      const root = renderElement(nested);
      const mid = root.querySelector('[data-globalid="z_mid"]');
      const inner = root.querySelector('[data-globalid="z_inner"]');
      expect(root.style.zIndex).toBe('1');
      expect(mid.style.zIndex).toBe('10');
      expect(inner.style.zIndex).toBe('5');
    });

    test('4.5 validates 5-level nested site structure without schema errors', () => {
      const site = {
        favicon: "12345",
        title: "Deep Site",
        background: "#000000",
        webcontent: [{
          class: "Frame", globalid: "a1",
          children: [{
            class: "Frame", globalid: "a2",
            children: [{
              class: "Frame", globalid: "a3",
              children: [{
                class: "Frame", globalid: "a4",
                children: [{ class: "Frame", globalid: "a5" }]
              }]
            }]
          }]
        }]
      };
      const res = validateInput(site);
      expect(res.valid).toBe(true);
      expect(res.stats.elementCount).toBe(5);
    });
  });

  // Category 5: Missing Optional Properties
  describe('Boundary 5: Missing Optional Properties', () => {
    test('5.1 supplies default opacity 1 when background_transparency is omitted', () => {
      const el = renderElement({ class: "Frame", globalid: "o1" });
      expect(el.style.opacity).toBe('');
    });

    test('5.2 treats visible as true when omitted', () => {
      const el = renderElement({ class: "Frame", globalid: "o2" });
      expect(el.style.display).not.toBe('none');
    });

    test('5.3 defaults anchor to top-left (0%, 0%) when omitted', () => {
      const el = renderElement({ class: "Frame", globalid: "o3" });
      expect(el.style.transformOrigin).toBe('');
      expect(el.style.transform).toBe('');
    });

    test('5.4 defaults stroke_thickness to 1 and stroke_color to #000000 when omitted', () => {
      const el = renderElement({
        class: "Frame",
        globalid: "o4",
        children: [{ class: "UIStroke" }]
      });
      expect(el.style.boxShadow).toBe('inset 0 0 0 1px #000000');
    });

    test('5.5 defaults rotation to 0deg when omitted', () => {
      const res = anchorToCss('0.5,0.5', null);
      expect(res.transform).toContain('rotate(0deg)');
    });
  });

  // Category 6: Unquoted Scalars Detection & Rejection
  describe('Boundary 6: Unquoted Scalars Detection & Rejection', () => {
    test('6.1 detects and rejects raw numeric scalar for order', () => {
      const snippet = [{ class: "Frame", globalid: "f1", order: 1 }];
      const res = validateInput(snippet);
      expect(res.valid).toBe(false);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('RAW_NUMBER_SCALAR');
    });

    test('6.2 detects and rejects raw boolean scalar for visible', () => {
      const snippet = [{ class: "Frame", globalid: "f2", visible: true }];
      const res = validateInput(snippet);
      expect(res.valid).toBe(false);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('RAW_BOOLEAN_SCALAR');
    });

    test('6.3 detects and rejects raw boolean scalar for canvas', () => {
      const snippet = [{ class: "Frame", globalid: "f3", canvas: false }];
      const res = validateInput(snippet);
      expect(res.valid).toBe(false);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('RAW_BOOLEAN_SCALAR');
    });

    test('6.4 normalizer coerces raw numbers to quoted strings', () => {
      const input = [{ class: "Frame", globalid: "f4", order: 5, z_index: 2 }];
      const normalized = normalizeInput(input);
      expect(normalized[0].order).toBe('5');
      expect(normalized[0].z_index).toBe('2');
    });

    test('6.5 normalizer coerces raw booleans to quoted strings', () => {
      const input = [{ class: "Frame", globalid: "f5", visible: true, canvas: false }];
      const normalized = normalizeInput(input);
      expect(normalized[0].visible).toBe('true');
      expect(normalized[0].canvas).toBe('false');
    });
  });

  // Category 7: Forbidden Properties Rejection
  describe('Boundary 7: Forbidden Properties Rejection', () => {
    test('7.1 rejects layout_order and suggests "order"', () => {
      const snippet = [{ class: "Frame", globalid: "fb1", layout_order: "1" }];
      const res = validateInput(snippet);
      expect(res.valid).toBe(false);
      const err = res.errors.find(e => e.code === 'FORBIDDEN_PROPERTY');
      expect(err).toBeTruthy();
      expect(err.message).toContain('layout_order');
      expect(err.suggestion).toContain('order');
    });

    test('7.2 rejects cell_size and suggests "size"', () => {
      const snippet = [{ class: "UIGridLayout", globalid: "fb2", cell_size: "{0,100},{0,100}" }];
      const res = validateInput(snippet);
      expect(res.valid).toBe(false);
      const err = res.errors.find(e => e.code === 'FORBIDDEN_PROPERTY');
      expect(err).toBeTruthy();
      expect(err.message).toContain('cell_size');
      expect(err.suggestion).toContain('size');
    });

    test('7.3 rejects anchor_point and suggests "anchor"', () => {
      const snippet = [{ class: "Frame", globalid: "fb3", anchor_point: "0.5,0.5" }];
      const res = validateInput(snippet);
      expect(res.valid).toBe(false);
      const err = res.errors.find(e => e.code === 'FORBIDDEN_PROPERTY');
      expect(err).toBeTruthy();
      expect(err.message).toContain('anchor_point');
      expect(err.suggestion).toContain('anchor');
    });

    test('7.4 normalizer safely converts layout_order to order', () => {
      const input = [{ class: "Frame", globalid: "fb4", layout_order: "3" }];
      const normalized = normalizeInput(input);
      expect(normalized[0].order).toBe('3');
      expect('layout_order' in normalized[0]).toBe(false);
    });

    test('7.5 normalizer safely converts cell_size to size on UIGridLayout', () => {
      const input = [{ class: "UIGridLayout", globalid: "fb5", cell_size: "{0,80},{0,80}" }];
      const normalized = normalizeInput(input);
      expect(normalized[0].size).toBe('{0,80},{0,80}');
      expect('cell_size' in normalized[0]).toBe(false);
    });
  });

  // Category 8: Boundary Z-Indices
  describe('Boundary 8: Boundary Z-Indices', () => {
    test('8.1 applies z_index "0" cleanly without fallback to default', () => {
      const el = renderElement({ class: "Frame", globalid: "bz1", z_index: "0" });
      expect(el.style.zIndex).toBe('0');
    });

    test('8.2 applies large positive z_index "999999"', () => {
      const el = renderElement({ class: "Frame", globalid: "bz2", z_index: "999999" });
      expect(el.style.zIndex).toBe('999999');
    });

    test('8.3 applies negative z_index "-999"', () => {
      const el = renderElement({ class: "Frame", globalid: "bz3", z_index: "-999" });
      expect(el.style.zIndex).toBe('-999');
    });

    test('8.4 preserves relative DOM stacking order when siblings share same z-index', () => {
      const doc = getDocument();
      const parent = doc.createElement('div');
      const elA = renderElement({ class: "Frame", globalid: "za", z_index: "5" }, parent);
      const elB = renderElement({ class: "Frame", globalid: "zb", z_index: "5" }, parent);
      expect(parent.children[0]).toBe(elA);
      expect(parent.children[1]).toBe(elB);
      expect(elA.style.zIndex).toBe('5');
      expect(elB.style.zIndex).toBe('5');
    });

    test('8.5 parses integer string values in z_index without NaN', () => {
      const el = renderElement({ class: "Frame", globalid: "bz5", z_index: "42" });
      expect(isNaN(parseInt(el.style.zIndex, 10))).toBe(false);
      expect(parseInt(el.style.zIndex, 10)).toBe(42);
    });
  });

  // Category 9: Extreme Rotations
  describe('Boundary 9: Extreme Rotations', () => {
    test('9.1 handles 0 deg rotation', () => {
      const res = anchorToCss('0,0', 0);
      expect(res.transform).toContain('rotate(0deg)');
    });

    test('9.2 handles 90 deg rotation', () => {
      const res = anchorToCss('0.5,0.5', 90);
      expect(res.transform).toContain('rotate(90deg)');
    });

    test('9.3 handles 180 deg rotation', () => {
      const res = anchorToCss('0.5,0.5', 180);
      expect(res.transform).toContain('rotate(180deg)');
    });

    test('9.4 handles negative rotation angle -45 deg', () => {
      const res = anchorToCss('0.5,0.5', -45);
      expect(res.transform).toContain('rotate(-45deg)');
    });

    test('9.5 handles multi-revolution angle 720 deg', () => {
      const res = anchorToCss('0,0', 720);
      expect(res.transform).toContain('rotate(720deg)');
    });
  });

  // Category 10: Invalid UDim2 Strings
  describe('Boundary 10: Invalid UDim2 Strings', () => {
    test('10.1 throws error on missing braces "{1,0}"', () => {
      expect(() => parseUDim2('{1,0}')).toThrow('Invalid UDim2 coordinate format');
    });

    test('10.2 throws error on 3-tuple numbers "{1,0,5},{0,0}"', () => {
      expect(() => parseUDim2('{1,0,5},{0,0}')).toThrow('Invalid UDim2 coordinate format');
    });

    test('10.3 throws error on non-numeric text "{abc,0},{0,0}"', () => {
      expect(() => parseUDim2('{abc,0},{0,0}')).toThrow('Invalid UDim2 coordinate format');
    });

    test('10.4 throws error on empty string ""', () => {
      expect(() => parseUDim2('')).toThrow('Invalid UDim2 coordinate format');
    });

    test('10.5 handles extra spaces within valid coordinate "{  0.5 ,  10 } , { -0.2 , 0 }"', () => {
      const u = parseUDim2('{  0.5 ,  10 } , { -0.2 , 0 }');
      expect(u.scaleX).toBe(0.5);
      expect(u.offsetX).toBe(10);
      expect(u.scaleY).toBe(-0.2);
      expect(u.offsetY).toBe(0);
    });
  });

});
