/**
 * CatWeb Test Harness
 * Lightweight, zero-dependency test runner, assertions, and mock DOM for Node.js and Browser.
 */

// Safe circular stringifier
export function safeStringify(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return JSON.stringify(val);
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`;

  if (val && typeof val === 'object') {
    if (val.tagName) {
      const gid = typeof val.getAttribute === 'function' ? val.getAttribute('data-globalid') : '';
      const cls = val.className || '';
      return `<${val.tagName}${gid ? ' data-globalid="' + gid + '"' : ''}${cls ? ' class="' + cls + '"' : ''}>`;
    }
    try {
      const seen = new WeakSet();
      return JSON.stringify(val, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      });
    } catch {
      return '[Complex Object]';
    }
  }
  return String(val);
}

// Safe deep equality helper with cycle detection
export function deepEqual(a, b, seen = new WeakSet()) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') {
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
      return true;
    }
    return false;
  }

  if (seen.has(a) || seen.has(b)) return true;
  seen.add(a);
  seen.add(b);

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key], seen)) return false;
  }

  return true;
}

// Lightweight Mock DOM Node
export class MockElement {
  constructor(tagName) {
    this.tagName = (tagName || 'DIV').toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.style = this._createStyleObject();
    this.classList = this._createClassList();
    this._textContent = '';
    this._value = '';
    this._ownerDocument = null;
  }

  get ownerDocument() {
    return this._ownerDocument || (this.parentNode ? this.parentNode.ownerDocument : null);
  }

  set ownerDocument(doc) {
    this._ownerDocument = doc;
  }

  get textContent() {
    if (this.children.length === 0) {
      if (this._textContent) return this._textContent;
      if (this._innerHTML) return this._innerHTML.replace(/<[^>]+>/g, '').trim();
      return '';
    }
    return this.children.map(c => c.textContent).join('');
  }

  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(val) {
    this.textContent = val;
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = String(val);
  }

  get className() {
    return this.classList.value;
  }

  set className(val) {
    this.classList.value = String(val);
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  set innerHTML(html) {
    this._innerHTML = String(html || '');
    this.children = [];
    if (!html) return;

    // Parse child tags into MockElement instances
    const tagRegex = /<([a-zA-Z0-9_-]+)([^>]*)>(?:([\s\S]*?)<\/\1>)?/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1];
      const attrStr = match[2];
      const text = match[3] || '';
      const child = new MockElement(tagName);
      child.ownerDocument = this.ownerDocument;
      child.parentNode = this;
      if (text) {
        if (text.includes('<')) {
          child.innerHTML = text;
        } else {
          child.textContent = text;
        }
      }

      if (attrStr) {
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          const name = attrMatch[1];
          const val = attrMatch[2] !== undefined ? attrMatch[2] : '';
          child.setAttribute(name, val);
          if (name === 'id') child.attributes['id'] = val;
        }
      }
      this.children.push(child);
    }
  }

  setAttribute(name, value) {
    const val = String(value);
    this.attributes[name] = val;
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = val;
    }
    if (name === 'class') {
      this.className = val;
    }
    if (name === 'value') {
      this.value = val;
    }
  }

  getAttribute(name) {
    if (name in this.attributes) return this.attributes[name];
    if (name === 'class') return this.className;
    if (name === 'value') return this.value;
    return null;
  }

  hasAttribute(name) {
    return name in this.attributes || (name === 'class' && Boolean(this.className));
  }

  removeAttribute(name) {
    delete this.attributes[name];
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      delete this.dataset[key];
    }
    if (name === 'class') {
      this.classList.value = '';
    }
  }

  appendChild(child) {
    if (!child) return child;
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  addEventListener(type, listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(l => l !== listener);
  }

  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const evt = typeof event === 'string' ? { type, target: this, currentTarget: this } : event;
    evt.target = this;
    evt.currentTarget = this;
    const handlers = this.listeners[type] || [];
    for (const h of handlers) {
      h.call(this, evt);
    }
    return true;
  }

  click() {
    this.dispatchEvent('click');
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const check = (node) => {
      if (this._matchesSelector(node, selector)) {
        matches.push(node);
      }
      for (const child of node.children) {
        check(child);
      }
    };
    for (const child of this.children) {
      check(child);
    }
    return matches;
  }

  _matchesSelector(node, sel) {
    if (!sel || !node) return false;
    // ID match #id
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return node.getAttribute('id') === id;
    }
    // Tag match
    if (sel.toUpperCase() === node.tagName) return true;
    // Class match .foo
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      return Boolean(node.classList?.contains(cls));
    }
    // Attribute match [attr="val"] or [attr], supports compound like [data-action="toggle-sub"][data-id="zoom"]
    if (sel.includes('[')) {
      const attrMatches = sel.match(/\[([^\]]+)\]/g);
      if (attrMatches && attrMatches.join('') === sel) {
        return attrMatches.every((bracket) => {
          const inner = bracket.slice(1, -1);
          const eqIdx = inner.indexOf('=');
          if (eqIdx === -1) {
            return node.hasAttribute(inner.trim());
          }
          const attrName = inner.slice(0, eqIdx).trim();
          let attrVal = inner.slice(eqIdx + 1).trim();
          if ((attrVal.startsWith('"') && attrVal.endsWith('"')) || (attrVal.startsWith("'") && attrVal.endsWith("'"))) {
            attrVal = attrVal.slice(1, -1);
          }
          return node.getAttribute(attrName) === attrVal;
        });
      }
    }
    return false;
  }

  getBoundingClientRect() {
    return {
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600
    };
  }

  _createClassList() {
    const classes = new Set();
    const self = this;
    return {
      add(...names) {
        for (const n of names) if (n) classes.add(n);
        self.attributes.class = this.value;
      },
      remove(...names) {
        for (const n of names) classes.delete(n);
        self.attributes.class = this.value;
      },
      contains(name) {
        return classes.has(name);
      },
      toggle(name) {
        if (classes.has(name)) {
          classes.delete(name);
          return false;
        } else {
          classes.add(name);
          return true;
        }
      },
      get value() {
        return Array.from(classes).join(' ');
      },
      set value(v) {
        classes.clear();
        if (v) {
          v.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
        }
      }
    };
  }

  _createStyleObject() {
    const store = {};
    return new Proxy(store, {
      get(target, prop) {
        if (prop === 'setProperty') {
          return (key, value) => { target[key] = String(value); };
        }
        if (prop === 'getPropertyValue') {
          return (key) => target[key] || '';
        }
        return target[prop] || '';
      },
      set(target, prop, value) {
        target[prop] = String(value);
        return true;
      }
    });
  }
}

export class MockDocument {
  constructor() {
    this.body = new MockElement('BODY');
  }

  createElement(tagName) {
    const el = new MockElement(tagName);
    el.ownerDocument = this;
    return el;
  }

  getElementById(id) {
    return this.body.querySelector(`[id="${id}"]`);
  }

  querySelector(selector) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.body.querySelectorAll(selector);
  }
}

// Global DOM environment provider
export function getDocument() {
  if (typeof window !== 'undefined' && window.document) {
    return window.document;
  }
  return new MockDocument();
}

// Assertion Matcher with Lazy Message Evaluation & Safe Stringification
export class Expectation {
  constructor(actual, isNot = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  _assert(condition, messageFn) {
    const passed = this.isNot ? !condition : Boolean(condition);
    if (!passed) {
      const msg = typeof messageFn === 'function' ? messageFn() : messageFn;
      throw new Error(this.isNot ? `Expected NOT: ${msg}` : msg);
    }
  }

  toBe(expected) {
    this._assert(
      this.actual === expected,
      () => `Expected ${safeStringify(this.actual)} to be ${safeStringify(expected)}`
    );
  }

  toEqual(expected) {
    this._assert(
      deepEqual(this.actual, expected),
      () => `Expected ${safeStringify(this.actual)} to equal ${safeStringify(expected)}`
    );
  }

  toBeTruthy() {
    this._assert(
      Boolean(this.actual),
      () => `Expected ${safeStringify(this.actual)} to be truthy`
    );
  }

  toBeFalsy() {
    this._assert(
      !this.actual,
      () => `Expected ${safeStringify(this.actual)} to be falsy`
    );
  }

  toBeNull() {
    this._assert(
      this.actual === null,
      () => `Expected ${safeStringify(this.actual)} to be null`
    );
  }

  toBeDefined() {
    this._assert(
      this.actual !== undefined,
      () => `Expected value to be defined`
    );
  }

  toBeUndefined() {
    this._assert(
      this.actual === undefined,
      () => `Expected ${safeStringify(this.actual)} to be undefined`
    );
  }

  toContain(item) {
    let contains = false;
    if (typeof this.actual === 'string') {
      contains = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      contains = this.actual.some(el => deepEqual(el, item));
    } else if (this.actual && typeof this.actual === 'object') {
      contains = item in this.actual;
    }
    this._assert(
      contains,
      () => `Expected ${safeStringify(this.actual)} to contain ${safeStringify(item)}`
    );
  }

  toMatch(pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    this._assert(
      regex.test(String(this.actual)),
      () => `Expected ${safeStringify(this.actual)} to match pattern ${pattern}`
    );
  }

  toBeGreaterThan(num) {
    this._assert(
      this.actual > num,
      () => `Expected ${this.actual} to be greater than ${num}`
    );
  }

  toBeLessThan(num) {
    this._assert(
      this.actual < num,
      () => `Expected ${this.actual} to be less than ${num}`
    );
  }

  toBeGreaterThanOrEqual(num) {
    this._assert(
      this.actual >= num,
      () => `Expected ${this.actual} to be >= ${num}`
    );
  }

  toBeLessThanOrEqual(num) {
    this._assert(
      this.actual <= num,
      () => `Expected ${this.actual} to be <= ${num}`
    );
  }

  toThrow(expectedMessagePattern) {
    let threw = false;
    let caughtError = null;
    if (typeof this.actual !== 'function') {
      throw new Error(`toThrow() requires a function input`);
    }
    try {
      this.actual();
    } catch (err) {
      threw = true;
      caughtError = err;
    }

    if (expectedMessagePattern && threw) {
      const msg = caughtError?.message || String(caughtError);
      const match = expectedMessagePattern instanceof RegExp
        ? expectedMessagePattern.test(msg)
        : msg.includes(expectedMessagePattern);
      this._assert(
        match,
        () => `Expected function error "${msg}" to match ${expectedMessagePattern}`
      );
      return;
    }

    this._assert(threw, () => `Expected function to throw an error, but it succeeded`);
  }

  toHaveProperty(prop, optVal) {
    const hasProp = this.actual != null && Object.prototype.hasOwnProperty.call(this.actual, prop);
    if (arguments.length > 1) {
      this._assert(
        hasProp && deepEqual(this.actual[prop], optVal),
        () => `Expected property "${prop}" with value ${safeStringify(optVal)}`
      );
    } else {
      this._assert(hasProp, () => `Expected object to have property "${prop}"`);
    }
  }
}

export function expect(actual) {
  return new Expectation(actual);
}

// Test Suite Collection and Runner
class TestRegistry {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
  }

  describe(name, fn) {
    const suite = {
      name,
      parent: this.currentSuite,
      tests: [],
      suites: [],
      beforeEachHooks: [],
      afterEachHooks: []
    };

    if (this.currentSuite) {
      this.currentSuite.suites.push(suite);
    } else {
      this.suites.push(suite);
    }

    const prev = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prev;
    }
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {
        this.test(name, fn);
      });
      return;
    }
    this.currentSuite.tests.push({ name, fn });
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEachHooks.push(fn);
    }
  }

  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEachHooks.push(fn);
    }
  }

  async runAll(onProgress = null) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: [],
      durationMs: 0
    };

    const startTime = Date.now();

    const runSuite = async (suite, path = []) => {
      const fullSuitePath = [...path, suite.name];
      const suiteResult = {
        name: suite.name,
        path: fullSuitePath,
        tests: [],
        suites: []
      };

      for (const t of suite.tests) {
        results.total++;
        const testResult = {
          name: t.name,
          fullTitle: [...fullSuitePath, t.name].join(' > '),
          passed: false,
          error: null,
          durationMs: 0
        };

        const tStart = Date.now();
        try {
          for (const hook of suite.beforeEachHooks) {
            await hook();
          }
          await t.fn();
          testResult.passed = true;
          results.passed++;
        } catch (err) {
          testResult.passed = false;
          testResult.error = err;
          results.failed++;
        } finally {
          for (const hook of suite.afterEachHooks) {
            try { await hook(); } catch { /* ignore hook cleanup errors */ }
          }
          testResult.durationMs = Date.now() - tStart;
          suiteResult.tests.push(testResult);
          if (onProgress) onProgress(testResult);
        }
      }

      for (const childSuite of suite.suites) {
        const childRes = await runSuite(childSuite, fullSuitePath);
        suiteResult.suites.push(childRes);
      }

      return suiteResult;
    };

    for (const suite of this.suites) {
      const res = await runSuite(suite);
      results.suites.push(res);
    }

    results.durationMs = Date.now() - startTime;
    return results;
  }

  clear() {
    this.suites = [];
    this.currentSuite = null;
  }
}

export const registry = new TestRegistry();
export const describe = registry.describe.bind(registry);
export const test = registry.test.bind(registry);
export const it = test;
export const beforeEach = registry.beforeEach.bind(registry);
export const afterEach = registry.afterEach.bind(registry);
