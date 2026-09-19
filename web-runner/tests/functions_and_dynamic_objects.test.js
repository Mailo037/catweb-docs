/**
 * Test Suite: Functions, Dynamic Object Variables & Event Limits
 * Verifies Action 87 (Run function), Action 115 (Return),
 * dynamic object variables from Duplicate (49), and the 120 actions/event limit.
 */

import { describe, test, it, expect } from './harness.js';
import { validateInput, CatWebRuntime } from './reference_adapter.js';
import { getActionCategory } from '../src/script_blocks.js';

describe('Functions, Dynamic Object Variables & Limits', () => {

  describe('1. Functions Action IDs (87 & 115)', () => {
    test('1.1 validates Run function (87) and Return (115) without errors', () => {
      const site = {
        favicon: '16944769468',
        title: 'Function Test',
        background: '#0f0f11',
        webcontent: [
          {
            class: 'Frame',
            globalid: 'm1',
            alias: 'main',
            size: '{1,0},{1,0}',
            position: '{0,0},{0,0}'
          },
          {
            class: 'script',
            globalid: 's1',
            alias: 'fn_script',
            content: [
              {
                id: '6',
                globalid: 'f1',
                text: ['Define function', { value: 'calculate', t: 'string', l: 'function' }],
                actions: [
                  {
                    id: '11',
                    globalid: 'a1',
                    text: ['Set', { value: '1', t: 'string', l: 'variable' }, 'to', { value: '42', t: 'string', l: 'any' }]
                  },
                  {
                    id: '115',
                    globalid: 'a2',
                    text: ['Return', { value: '{1}', t: 'string', l: 'any' }]
                  }
                ]
              },
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions: [
                  {
                    id: '87',
                    globalid: 'a3',
                    text: ['Run function', { value: 'calculate', t: 'string', l: 'function' }, { value: [], t: 'tuple' }, '→', { value: '2', t: 'string', l: 'variable?' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = validateInput(site);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('1.2 categorizes Action 87 and Action 115 as function category', () => {
      expect(getActionCategory('87').name).toBe('Functions');
      expect(getActionCategory('115').name).toBe('Functions');
    });
  });

  describe('2. Dynamically Duplicated Object Variables', () => {
    test('2.1 accepts Duplicate (49) returning to numeric variable and subsequent {1} object reference', () => {
      const site = {
        favicon: '16944769468',
        title: 'Duplicate Test',
        background: '#0f0f11',
        webcontent: [
          {
            class: 'TextLabel',
            globalid: 'cd',
            alias: 'card_proto',
            size: '{0,200},{0,100}',
            position: '{0,0},{0,0}',
            text: 'Original'
          },
          {
            class: 'script',
            globalid: 's1',
            alias: 'dup_script',
            content: [
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions: [
                  {
                    id: '49',
                    globalid: 'a1',
                    text: ['Duplicate', { value: 'cd', t: 'object' }, '→', { value: '1', t: 'string', l: 'variable' }]
                  },
                  {
                    id: '31',
                    globalid: 'a2',
                    text: ['Set', { value: 'Text', t: 'string', l: 'property' }, 'of', { value: '{1}', t: 'object' }, 'to', { value: 'Cloned Element', t: 'any' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = validateInput(site);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('2.2 accepts scoped object variable {o!clone} and reserved keyword Page in object slots', () => {
      const site = {
        favicon: '16944769468',
        title: 'Scoped Object Var Test',
        background: '#0f0f11',
        webcontent: [
          {
            class: 'Frame',
            globalid: 'bx',
            alias: 'box',
            size: '{0,100},{0,100}',
            position: '{0,0},{0,0}'
          },
          {
            class: 'script',
            globalid: 's1',
            alias: 'scoped_script',
            content: [
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions: [
                  {
                    id: '49',
                    globalid: 'a1',
                    text: ['Duplicate', { value: 'bx', t: 'object' }, '→', { value: 'o!clone', t: 'string', l: 'variable' }]
                  },
                  {
                    id: '31',
                    globalid: 'a2',
                    text: ['Set', { value: 'Background Color', t: 'string', l: 'property' }, 'of', { value: '{o!clone}', t: 'object' }, 'to', { value: '#ff0000', t: 'any' }]
                  },
                  {
                    id: '31',
                    globalid: 'a3',
                    text: ['Set', { value: 'Visible', t: 'string', l: 'property' }, 'of', { value: 'Page', t: 'object' }, 'to', { value: 'true', t: 'any' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = validateInput(site);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('2.3 still catches truly non-existent static element references as UNRESOLVED_OBJECT_REFERENCE', () => {
      const site = {
        favicon: '16944769468',
        title: 'Invalid Target Test',
        background: '#0f0f11',
        webcontent: [
          {
            class: 'Frame',
            globalid: 'bx',
            size: '{0,100},{0,100}',
            position: '{0,0},{0,0}'
          },
          {
            class: 'script',
            globalid: 's1',
            content: [
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions: [
                  {
                    id: '31',
                    globalid: 'a1',
                    text: ['Set', { value: 'Text', t: 'string', l: 'property' }, 'of', { value: 'ghost_element', t: 'object' }, 'to', { value: 'hi', t: 'any' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = validateInput(site);
      expect(result.valid).toBe(false);
      const err = result.errors.find(e => e.code === 'UNRESOLVED_OBJECT_REFERENCE');
      expect(err).toBeTruthy();
      expect(err.message).toContain('ghost_element');
    });
  });

  describe('3. 120 Actions Per Event Limit', () => {
    test('3.1 emits EVENT_ACTION_LIMIT_EXCEEDED warning when an event has 121 actions', () => {
      const actions = [];
      for (let i = 0; i < 121; i++) {
        actions.push({
          id: '0',
          globalid: `k${i % 100}`,
          text: ['Log', { value: `msg ${i}`, t: 'any' }]
        });
      }

      const site = {
        favicon: '16944769468',
        title: 'Limit Test',
        background: '#0f0f11',
        webcontent: [
          {
            class: 'script',
            globalid: 's1',
            content: [
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions
              }
            ]
          }
        ]
      };

      const result = validateInput(site);
      const warn = result.warnings.find(w => w.code === 'EVENT_ACTION_LIMIT_EXCEEDED');
      expect(warn).toBeTruthy();
      expect(warn.message).toContain('121 actions');
      expect(warn.message).toContain('limit is 120 actions per event');
    });

    test('3.2 does not emit EVENT_ACTION_LIMIT_EXCEEDED warning when an event has 120 actions', () => {
      const actions = [];
      for (let i = 0; i < 120; i++) {
        actions.push({
          id: '0',
          globalid: `m${i % 100}`,
          text: ['Log', { value: `msg ${i}`, t: 'any' }]
        });
      }

      const site = {
        favicon: '16944769468',
        title: 'Limit OK Test',
        background: '#0f0f11',
        webcontent: [
          {
            class: 'script',
            globalid: 's1',
            content: [
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions
              }
            ]
          }
        ]
      };

      const result = validateInput(site);
      const warn = result.warnings.find(w => w.code === 'EVENT_ACTION_LIMIT_EXCEEDED');
      expect(warn).toBeUndefined();
    });
  });

  describe('4. Interactive Runtime Execution for Functions & Duplication', () => {
    test('4.1 runtime executes Action 49 Duplicate and applies property to dynamic object {1}', () => {
      const doc = {
        webcontent: [
          {
            class: 'TextLabel',
            globalid: 't1',
            alias: 'label_proto',
            text: 'Initial'
          },
          {
            class: 'script',
            globalid: 's1',
            content: [
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions: [
                  {
                    id: '49',
                    globalid: 'a1',
                    text: ['Duplicate', { value: 't1', t: 'object' }, '→', { value: '1', t: 'string', l: 'variable' }]
                  },
                  {
                    id: '31',
                    globalid: 'a2',
                    text: ['Set', { value: 'Text', t: 'string', l: 'property' }, 'of', { value: '{1}', t: 'object' }, 'to', { value: 'Cloned Dynamic Text', t: 'any' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const runtime = new CatWebRuntime(doc, null);
      runtime.start();

      const clonedId = runtime.getVariable('1');
      expect(typeof clonedId).toBe('string');
      expect(clonedId.length).toBeGreaterThan(0);

      const clonedNode = runtime.elementsByGlobalId.get(clonedId);
      expect(clonedNode).toBeTruthy();
      expect(clonedNode.text).toBe('Cloned Dynamic Text');
    });

    test('4.2 runtime executes Action 87 (Run function) and Action 115 (Return)', () => {
      const doc = {
        webcontent: [
          {
            class: 'script',
            globalid: 's1',
            content: [
              {
                id: '6',
                globalid: 'fn1',
                text: ['Define function', { value: 'do_math', t: 'string', l: 'function' }],
                actions: [
                  {
                    id: '11',
                    globalid: 'f_act1',
                    text: ['Set', { value: '10', t: 'string', l: 'variable' }, 'to', { value: '100', t: 'string', l: 'any' }]
                  },
                  {
                    id: '115',
                    globalid: 'f_ret',
                    text: ['Return', { value: '0', t: 'string', l: 'any' }]
                  },
                  {
                    id: '11',
                    globalid: 'f_unreachable',
                    text: ['Set', { value: '10', t: 'string', l: 'variable' }, 'to', { value: '999', t: 'string', l: 'any' }]
                  }
                ]
              },
              {
                id: '0',
                globalid: 'e1',
                text: ['When website loaded...'],
                actions: [
                  {
                    id: '87',
                    globalid: 'a1',
                    text: ['Run function', { value: 'do_math', t: 'string', l: 'function' }, { value: [], t: 'tuple' }, '→', { value: '', t: 'string', l: 'variable?' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const runtime = new CatWebRuntime(doc, null);
      runtime.start();

      // Variable 10 should be 100 because Return (115) prevented reaching 999
      expect(runtime.getVariable('10')).toBe(100);
    });
  });

});
