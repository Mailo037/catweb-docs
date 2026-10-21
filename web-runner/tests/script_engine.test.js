/**
 * Script engine semantics (game/JSONScript.md): control flow, scopes, tables,
 * functions and the console. Runs without a DOM.
 */

import { describe, test, expect } from './harness.js';
import { CatWebRuntime } from '../src/runtime.js';

let n = 0;
const gid = () => `z${(n++).toString(36)}`.slice(0, 3);

const P = (value, t = 'string', l) => (l ? { value, t, l } : { value, t });
const V = (name) => P(name, 'string', 'variable');
const ANY = (value) => P(value, 'string', 'any');
const act = (id, ...text) => ({ id: String(id), globalid: gid(), text });

const setVar = (name, value) => act(11, 'Set', V(name), 'to', ANY(value));
const end = () => act(25, 'end');

function site(events, extraElements = []) {
  return {
    favicon: '1', title: 't', background: '#000000',
    webcontent: [...extraElements, { class: 'script', globalid: 'sc', enabled: 'true', content: events }]
  };
}

function onLoad(...actions) {
  return { id: '0', globalid: gid(), x: '5000', y: '5000', text: ['When website loaded...'], actions };
}

async function run(events, extra) {
  const logs = [];
  const rt = new CatWebRuntime(site(events, extra), null, { onLog: (e) => logs.push(e) });
  await rt.start();
  return { rt, logs };
}

describe('Script engine: conditions', () => {
  test('If not equal (19) skips its body when values are equal', async () => {
    const { rt } = await run([onLoad(
      setVar('1', 'a'),
      act(19, 'If', ANY('{1}'), 'is not equal to', ANY('a')), setVar('2', 'ran'), end()
    )]);
    expect(rt.getVariable('2')).toBe(0);
  });

  test('If greater than (20) / lower than (21) compare numerically', async () => {
    const { rt } = await run([onLoad(
      setVar('1', '10'),
      act(20, 'If', ANY('{1}'), 'is greater than', ANY('9')), setVar('2', 'gt'), end(),
      act(21, 'If', ANY('{1}'), 'is lower than', ANY('9')), setVar('3', 'lt'), end()
    )]);
    expect(rt.getVariable('2')).toBe('gt');
    expect(rt.getVariable('3')).toBe(0);
  });

  test('else (112) runs only when the condition is false', async () => {
    const { rt } = await run([onLoad(
      act(18, 'If', ANY('1'), 'is equal to', ANY('2')), setVar('1', 'then'), act(112, 'else'), setVar('1', 'else'), end()
    )]);
    expect(rt.getVariable('1')).toBe('else');
  });

  test('nested Ifs pick the right end', async () => {
    const { rt } = await run([onLoad(
      act(18, 'If', ANY('1'), 'is equal to', ANY('2')),
      act(18, 'If', ANY('1'), 'is equal to', ANY('1')), setVar('1', 'inner'), end(),
      setVar('2', 'outer'),
      end(),
      setVar('3', 'after')
    )]);
    expect(rt.getVariable('1')).toBe(0);
    expect(rt.getVariable('2')).toBe(0);
    expect(rt.getVariable('3')).toBe('after');
  });

  test('If exists (92) / contains (37) / AND (44)', async () => {
    const { rt } = await run([onLoad(
      setVar('1', 'hello world'), setVar('2', '1'),
      act(92, 'If', V('1'), 'exists'), setVar('10', 'yes'), end(),
      act(93, 'If', V('99'), "doesn't exist"), setVar('11', 'yes'), end(),
      act(37, 'If', P('{1}'), 'contains', P('world')), setVar('12', 'yes'), end(),
      act(44, 'If', V('1'), 'AND', V('2')), setVar('13', 'yes'), end()
    )]);
    expect(rt.getVariable('10')).toBe('yes');
    expect(rt.getVariable('11')).toBe('yes');
    expect(rt.getVariable('12')).toBe('yes');
    expect(rt.getVariable('13')).toBe('yes');
  });
});

describe('Script engine: loops', () => {
  test('Repeat (22) runs its body n times', async () => {
    const { rt } = await run([onLoad(
      setVar('1', '0'),
      act(22, 'Repeat', P('5', 'number'), 'times'), act(12, 'Increase', V('1'), 'by', P('2', 'number')), end()
    )]);
    expect(rt.getVariable('1')).toBe(10);
  });

  test('Break (24) inside If leaves Repeat forever (23)', async () => {
    const { rt } = await run([onLoad(
      setVar('1', '0'),
      act(23, 'Repeat forever'),
      act(12, 'Increase', V('1'), 'by', P('1', 'number')),
      act(18, 'If', ANY('{1}'), 'is equal to', ANY('7')), act(24, 'Break'), end(),
      end(),
      setVar('2', 'done')
    )]);
    expect(rt.getVariable('1')).toBe(7);
    expect(rt.getVariable('2')).toBe('done');
  });

  test('a Repeat forever without Wait is stopped and reported, not frozen', async () => {
    const { rt, logs } = await run([onLoad(
      act(23, 'Repeat forever'), act(12, 'Increase', V('1'), 'by', P('1', 'number')), end()
    )]);
    expect(rt.getVariable('1')).toBeGreaterThan(1000);
    expect(logs.some((l) => l.level === 'error' && /without a Wait/.test(l.message))).toBe(true);
  });

  test('Iterate (113) walks an array with l!index / l!value', async () => {
    const { rt } = await run([onLoad(
      act(57, 'Split', P('a,b,c'), P(',', 'string', 'separator'), '→', P('t', 'string', 'table')),
      setVar('1', ''),
      act(113, 'Iterate through', P('t', 'string', 'table'), '({l!index},{l!value})'),
      setVar('1', '{1}{l!index}{l!value}'),
      end()
    )]);
    expect(rt.getVariable('1')).toBe('1a2b3c');
  });
});

describe('Script engine: variables & tables', () => {
  test('local (l!) variables do not leak into globals', async () => {
    const { rt } = await run([onLoad(setVar('l!1', 'local'), setVar('2', '{l!1}'))]);
    expect(rt.getVariable('2')).toBe('local');
    expect(rt.variables.has('1')).toBe(false);
  });

  test('object (o!) variables are listed per script', async () => {
    const { rt } = await run([onLoad(setVar('o!1', '5'))]);
    expect(rt.listVariables().find((v) => v.name === 'o!1')?.value).toBe(5);
  });

  test('tables: set / get entry and dot access', async () => {
    const { rt } = await run([onLoad(
      act(54, 'Create table', P('t', 'string', 'table')),
      act(55, 'Set entry', P('name', 'string', 'entry'), 'of', P('t', 'string', 'table'), 'to', ANY('cat')),
      act(56, 'Get entry', P('name', 'string', 'entry'), 'of', P('t', 'string', 'table'), '→', V('1')),
      setVar('2', 'hi {t.name}')
    )]);
    expect(rt.getVariable('1')).toBe('cat');
    expect(rt.getVariable('2')).toBe('hi cat');
  });

  test('math blocks mutate the variable', async () => {
    const { rt } = await run([onLoad(
      setVar('1', '7'),
      act(14, 'Multiply', V('1'), 'by', P('3', 'number')),
      act(41, V('1'), 'modulo', P('4', 'number')),
      setVar('2', '2.5'), act(16, 'Round', V('2'))
    )]);
    expect(rt.getVariable('1')).toBe(1);
    expect(rt.getVariable('2')).toBe(3);
  });

  test('string blocks: upper, concatenate, replace, length', async () => {
    const { rt } = await run([onLoad(
      act(70, 'Upper', P('cat'), '→', V('1')),
      act(109, 'Concatenate', P('{1}'), 'with', P('web'), '→', V('2')),
      act(43, 'Replace', P('web'), 'in', V('2'), 'by', P('WEB')),
      act(48, 'Get length of', P('{2}'), '→', V('3'))
    )]);
    expect(rt.getVariable('1')).toBe('CAT');
    expect(rt.getVariable('2')).toBe('CATWEB');
    expect(rt.getVariable('3')).toBe(6);
  });
});

describe('Script engine: functions & console', () => {
  test('Run function (87) stores the Return (115) value', async () => {
    const fn = {
      id: '6', globalid: gid(), x: '4000', y: '4000',
      text: ['Define function', P('10', 'string', 'function')],
      actions: [act(115, 'Return', ANY('{70}!'))]
    };
    const { rt } = await run([fn, onLoad(
      setVar('70', 'hi'),
      act(87, 'Run function', P('10', 'string', 'function'), P([], 'tuple'), '→', P('1', 'string', 'variable?'))
    )]);
    expect(rt.getVariable('1')).toBe('hi!');
  });

  test('Run function (132) behaves like 87', async () => {
    const fn = {
      id: '6', globalid: gid(), x: '4000', y: '4000',
      text: ['Define function', P('10', 'string', 'function')],
      actions: [act(115, 'Return', ANY('{70}!'))]
    };
    const { rt } = await run([fn, onLoad(
      setVar('70', 'hi'),
      act(132, 'Run function', P('10', 'string', 'function'), P([], 'tuple'), '→', P('1', 'string', 'variable?'))
    )]);
    expect(rt.getVariable('1')).toBe('hi!');
  });

  test('calling an undefined function logs an error and stops the event', async () => {
    const { rt, logs } = await run([onLoad(
      act(87, 'Run function', P('nope', 'string', 'function'), P([], 'tuple'), '→', P('', 'string', 'variable?')),
      setVar('1', 'after')
    )]);
    expect(rt.getVariable('1')).toBe(0);
    expect(logs.some((l) => l.level === 'error' && /nope/.test(l.message))).toBe(true);
  });

  test('Log / Warn reach onLog; Error (2) stops the event', async () => {
    const { rt, logs } = await run([onLoad(
      setVar('1', '3'),
      act(0, 'Log', P('value {1}', 'any')),
      act(1, 'Warn', P('careful', 'any')),
      act(2, 'Error', P('boom', 'any')),
      setVar('2', 'unreachable')
    )]);
    expect(logs.map((l) => `${l.level}:${l.message}`).join('|')).toBe('log:value 3|warn:careful|error:boom');
    expect(rt.getVariable('2')).toBe(0);
  });

  test('unsupported blocks are reported once instead of failing silently', async () => {
    const { logs } = await run([onLoad(act(80, 'If middle mouse button down'), end(), act(999, 'x'), act(999, 'x'))]);
    expect(logs.filter((l) => l.level === 'info').length).toBe(1);
  });

  test('events closest to the canvas centre start first', async () => {
    const order = [];
    const far = { ...onLoad(act(0, 'Log', P('far', 'any'))), x: '9000', y: '9000' };
    const near = { ...onLoad(act(0, 'Log', P('near', 'any'))), x: '5010', y: '5000' };
    const rt = new CatWebRuntime(site([far, near]), null, { onLog: (e) => order.push(e.message) });
    await rt.start();
    expect(order.join(',')).toBe('near,far');
  });
});
