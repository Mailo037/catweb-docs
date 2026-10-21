/**
 * CatWeb Interactive Scripting Engine
 *
 * Executes CatWeb JSONScript (see game/JSONScript.md) against the rendered DOM:
 *   - Events: 0 loaded, 1 pressed, 2 key pressed, 3 mouse enters, 5 mouse leaves,
 *     6 define function, 8 input submitted, 9 message received, 10 object changed,
 *     11 mouse down, 12 mouse up, 13 right clicked, 16 any key pressed.
 *   - Flat control flow: every If variant, else (112), Repeat (22), Repeat forever (23),
 *     Iterate (113), Break (24) and end (25) are matched in a pre-pass, so blocks nest
 *     correctly without nested `actions` arrays.
 *   - Variable scopes: global {1}, object {o!1} (per script), local {l!1} (per run),
 *     plus table access {tbl.key} / {arr.1}.
 *
 * Execution is synchronous until the first Wait, so callers that don't await still see
 * the result of everything before it. Actions the browser can't simulate (purchases,
 * cross-site messaging, …) are skipped and reported once through `onLog`.
 *
 * Zero external dependencies.
 */

import { playSyntheticAudio, resolveRobloxAsset } from './assets.js';
import { udim2ToCss } from './coordinates.js';
import { applyBackgroundStyling, applyTextStyling } from './styling.js';

/* ============================================================
 * BLOCK TABLES
 * ============================================================ */

/** Condition blocks: each opens a body that runs until its matching `end` (25). */
const IF_IDS = new Set([
  '18', '19', '20', '21', '125', '126', '37', '38', '92', '93',
  '44', '45', '46', '47', '79', '80', '81', '82', '108', '103', '104', '105'
]);
/** Loop blocks: also closed by `end` (25). */
const LOOP_IDS = new Set(['22', '23', '113']);

/** Events whose first parameter is the object they listen on. */
const TARGETED_EVENTS = {
  '1': 'click',
  '3': 'mouseenter',
  '5': 'mouseleave',
  '8': 'submit',
  '11': 'mousedown',
  '12': 'mouseup',
  '13': 'contextmenu'
};

/** Human-readable names, used in console messages. */
export const ACTION_NAMES = {
  '0': 'Log', '1': 'Warn', '2': 'Error', '3': 'Wait', '4': 'Redirect', '5': 'Play audio',
  '8': 'Make invisible', '9': 'Make visible', '10': 'Set text', '11': 'Set variable',
  '12': 'Increase', '13': 'Decrease', '14': 'Multiply', '15': 'Divide', '16': 'Round',
  '17': 'Floor', '18': 'If equal', '19': 'If not equal', '20': 'If greater than',
  '21': 'If lower than', '22': 'Repeat', '23': 'Repeat forever', '24': 'Break', '25': 'end',
  '26': 'Play looped audio', '27': 'Random number', '28': 'Audio', '30': 'Get text from input',
  '31': 'Set property', '32': 'Broadcast across page', '33': 'Broadcast across site',
  '34': 'Set cookie', '36': 'Get cookie', '37': 'If contains', '38': "If doesn't contain",
  '39': 'Get property', '40': 'Raise to power', '41': 'Modulo', '42': 'Substring',
  '43': 'Replace', '44': 'If AND', '45': 'If OR', '46': 'If NOR', '47': 'If XOR',
  '48': 'String length', '49': 'Duplicate', '50': 'Delete object', '54': 'Create table',
  '55': 'Set entry', '56': 'Get entry', '57': 'Split string', '58': 'Parent object',
  '59': 'Array length', '62': 'Delete cookie', '66': 'Set entry (object)', '69': 'Lowercase',
  '70': 'Uppercase', '78': 'Ceil', '79': 'If left mouse down', '80': 'If middle mouse down',
  '81': 'If right mouse down', '82': 'If key down', '84': 'Get viewport size',
  '85': 'Get cursor position', '87': 'Run function', '88': 'Tween', '89': 'Insert',
  '90': 'Delete entry', '91': 'Remove at position', '92': 'If exists', '93': "If doesn't exist",
  '96': 'Delete variable', '103': 'If is ancestor', '104': 'If is child', '105': 'If is descendant',
  '106': 'Set image', '108': 'If dark theme', '109': 'Concatenate', '110': 'Join',
  '112': 'else', '113': 'Iterate', '114': 'Run math function', '115': 'Return',
  '117': 'Get URL', '119': 'Hex to RGB', '121': 'RGB to hex', '125': 'If greater or equal',
  '126': 'If lower or equal',
  '7': 'Stop all audio', '35': 'Increase cookie', '51': 'Get username', '52': 'Get user ID',
  '53': 'Get display name', '63': 'Run function in background', '67': 'Get query parameter',
  '68': 'Get unix timestamp', '71': 'Format current date', '72': 'Format from unix',
  '73': 'Set volume', '74': 'Stop audio', '75': 'Pause audio', '76': 'Resume audio',
  '77': 'Set speed', '83': 'Get tick', '94': 'Set audio property', '95': 'Get audio property',
  '97': 'Get parent', '98': 'Find ancestor', '99': 'Find child', '100': 'Find descendant',
  '101': 'Get children', '102': 'Get descendants', '107': 'Set avatar image',
  '116': 'Get server unix timestamp', '118': 'Get timezone', '120': 'Hex to HSV',
  '122': 'HSV to hex', '123': 'Lerp color', '127': 'Get objects at position',
  '128': 'Run function protected', '129': 'Get asset info', '130': 'Broadcast cross-site',
  '131': 'Set entry (function)', '132': 'Run function', '133': 'Run function in background',
  '134': 'Run function protected', '135': 'Set mouse icon', '138': 'Set attribute',
  '139': 'Get attribute', '140': 'Attribute action'
};

export const EVENT_NAMES = {
  '0': 'When website loaded', '1': 'When button pressed', '2': 'When key pressed',
  '3': 'When mouse enters', '5': 'When mouse leaves', '6': 'Define function',
  '7': 'When avatar item bought', '8': 'When input submitted', '9': 'When message received',
  '10': 'When object changed', '11': 'When mouse down', '12': 'When mouse up',
  '13': 'When right clicked', '14': 'When cross-site message received',
  '15': 'When donation completed', '16': 'When any key pressed'
};

/** Script property names (Title Case) → JSON keys, for Get/Set/Tween. */
const PROPERTY_KEYS = {
  text: 'text', contenttext: 'text', textcolor: 'font_color', textcolor3: 'font_color',
  fontcolor: 'font_color', backgroundcolor: 'background_color', backgroundcolor3: 'background_color',
  visible: 'visible', position: 'position', size: 'size', rotation: 'rotation',
  backgroundtransparency: 'background_transparency', transparency: 'background_transparency',
  texttransparency: 'font_transparency', fonttransparency: 'font_transparency',
  order: 'order', layoutorder: 'order', zindex: 'z_index', fontsize: 'font_size', textsize: 'font_size',
  placeholder: 'placeholder', image: 'image_id', imagecolor: 'image_color',
  imagetransparency: 'image_transparency', anchor: 'anchor', anchorpoint: 'anchor', tooltip: 'tooltip'
};

const TWEEN_EASINGS = {
  linear: 'linear',
  sine: { In: 'cubic-bezier(0.12, 0, 0.39, 0)', Out: 'cubic-bezier(0.61, 1, 0.88, 1)', InOut: 'cubic-bezier(0.37, 0, 0.63, 1)' },
  quad: { In: 'cubic-bezier(0.11, 0, 0.5, 0)', Out: 'cubic-bezier(0.5, 1, 0.89, 1)', InOut: 'cubic-bezier(0.45, 0, 0.55, 1)' },
  cubic: { In: 'cubic-bezier(0.32, 0, 0.67, 0)', Out: 'cubic-bezier(0.33, 1, 0.68, 1)', InOut: 'cubic-bezier(0.65, 0, 0.35, 1)' },
  back: { In: 'cubic-bezier(0.36, 0, 0.66, -0.56)', Out: 'cubic-bezier(0.34, 1.56, 0.64, 1)', InOut: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' }
};

const BREAK = { signal: 'break' };
const STOP = { signal: 'stop' };

/** Synchronous steps allowed before a Repeat loop must Wait, so a runaway loop can't freeze the tab. */
const MAX_STEPS_WITHOUT_WAIT = 100000;

class ScriptError extends Error {}

/* ============================================================
 * RUNTIME
 * ============================================================ */

export class CatWebRuntime {
  /**
   * @param {object|Array} documentTree - CatWeb document (Full Site or Snippet array)
   * @param {HTMLElement} [domRoot] - Root DOM container where the tree is rendered
   * @param {object} [options]
   * @param {boolean} [options.audioEnabled=true]
   * @param {(entry: {level: string, message: string, time: number, eventGid?: string, actionGid?: string, scriptGid?: string}) => void} [options.onLog]
   * @param {(name: string, value: any, scope: string) => void} [options.onVariableChange]
   * @param {(action: object, event: object) => void} [options.onAction]
   * @param {(assetId: string) => void} [options.onAudio]
   * @param {(gid: string, prop: string, value: any) => void} [options.onPropertyChange]
   * @param {(url: string) => void} [options.onRedirect]
   * @param {Map} [options.cookies] - Cookie jar; pass the same Map to keep cookies across reloads
   * @param {string} [options.url] - Value returned by "Get URL"
   */
  constructor(documentTree, domRoot = null, options = {}) {
    this.tree = documentTree;
    this.domRoot = domRoot;
    this.options = {
      audioEnabled: true,
      logActions: false,
      url: 'catweb://site.rbx',
      ...options
    };

    this.variables = new Map();          // global scope
    this.objectVariables = new Map();    // script globalid -> Map
    this.cookies = this.options.cookies instanceof Map ? this.options.cookies : new Map();
    this.elementsByGlobalId = new Map();
    this.parentByGlobalId = new Map();
    this.scripts = [];
    this.functions = new Map();          // name -> { script, node }
    this.scriptOfEvent = new Map();      // event node -> script node
    this.logs = [];
    this.activeTimeouts = new Set();
    this.domListeners = [];
    this.lastAudioPlayed = null;
    this.isRunning = false;

    this._generation = 0;
    this._stepsWithoutWait = 0;
    this._reported = new Set();
    this._pressedKeys = new Set();
    this._mouseButtons = new Set();
    this._cursor = { x: 0, y: 0 };
    this._changeDepth = 0;
    this._jumpTables = new WeakMap();
    this._dupCounter = 0;

    this._indexTree(documentTree);
  }

  /* ---------------- lifecycle ---------------- */

  /** @private */
  _indexTree(root) {
    const traverse = (node, parent) => {
      if (!node || typeof node !== 'object') return;

      if (node.globalid) {
        this.elementsByGlobalId.set(node.globalid, node);
        if (parent?.globalid) this.parentByGlobalId.set(node.globalid, parent.globalid);
      }

      if (node.class === 'script' && node.enabled !== 'false' && node.enabled !== false) {
        this.scripts.push(node);
        for (const block of (Array.isArray(node.content) ? node.content : [])) {
          if (!block || typeof block !== 'object') continue;
          this.scriptOfEvent.set(block, node);
          if (String(block.id) === '6') {
            const name = params(block)[0]?.value;
            if (name !== undefined && !this.functions.has(String(name))) {
              this.functions.set(String(name), { script: node, node: block });
            }
          }
        }
      }

      if (Array.isArray(node.children)) for (const child of node.children) traverse(child, node);
      if (Array.isArray(node.webcontent)) for (const child of node.webcontent) traverse(child, null);
    };

    if (Array.isArray(root)) {
      for (const item of root) traverse(item, null);
    } else {
      traverse(root, null);
    }
  }

  /**
   * Attaches DOM listeners and fires "When website loaded" (event 0).
   * @returns {Promise<void>}
   */
  start() {
    this.isRunning = true;
    this._bindDomListeners();
    return this.triggerEvent(null, 0);
  }

  /** Stops every running event, pending Wait and DOM listener. */
  stop() {
    this.isRunning = false;
    this._generation++;
    for (const tid of this.activeTimeouts) clearTimeout(tid);
    this.activeTimeouts.clear();
    this._unbindDomListeners();
  }

  destroy() {
    this.stop();
    this.variables.clear();
    this.objectVariables.clear();
    this.elementsByGlobalId.clear();
    this.scripts = [];
    this.functions.clear();
  }

  /* ---------------- variables ---------------- */

  /**
   * Reads a global variable (unset variables read as 0).
   * @param {string|number} varId
   */
  getVariable(varId) {
    const key = String(varId);
    return this.variables.has(key) ? this.variables.get(key) : 0;
  }

  /**
   * Writes a global variable.
   * @param {string|number} varId
   * @param {any} val
   */
  setVariable(varId, val) {
    const key = String(varId);
    this.variables.set(key, val);
    this.options.onVariableChange?.(key, val, 'global');
  }

  /**
   * Lists every variable with its scope, for the Variables panel.
   * @returns {Array<{name: string, scope: 'global'|'object', script?: string, value: any}>}
   */
  listVariables() {
    const out = [];
    for (const [name, value] of this.variables) out.push({ name, scope: 'global', value });
    for (const [script, store] of this.objectVariables) {
      for (const [name, value] of store) out.push({ name: `o!${name}`, scope: 'object', script, value });
    }
    return out;
  }

  /** @private Returns [store, key] for a variable name like "1", "o!x" or "l!x". */
  _scopeOf(name, ctx) {
    const raw = stripBraces(String(name ?? ''));
    if (raw.startsWith('o!')) {
      const sid = ctx?.script?.globalid ?? '';
      if (!this.objectVariables.has(sid)) this.objectVariables.set(sid, new Map());
      return [this.objectVariables.get(sid), raw.slice(2), 'object'];
    }
    if (raw.startsWith('l!')) {
      return [ctx?.locals ?? new Map(), raw.slice(2), 'local'];
    }
    return [this.variables, raw, 'global'];
  }

  /** @private Reads a variable (with table paths) → { found, value }. */
  _lookup(name, ctx) {
    const raw = stripBraces(String(name ?? ''));
    const [head, ...path] = splitPath(raw);
    const [store, key] = this._scopeOf(head, ctx);
    if (!store.has(key)) return { found: false, value: undefined };
    let value = store.get(key);
    for (const seg of path) {
      if (Array.isArray(value)) {
        value = value[Number(seg) - 1];
      } else if (value && typeof value === 'object') {
        value = value[seg];
      } else {
        return { found: false, value: undefined };
      }
      if (value === undefined) return { found: false, value: undefined };
    }
    return { found: true, value };
  }

  /** @private */
  _readVar(name, ctx) {
    return this._lookup(name, ctx).value;
  }

  /** @private */
  _writeVar(name, value, ctx) {
    if (name === undefined || name === null || String(name).trim() === '') return;
    const [store, key, scope] = this._scopeOf(name, ctx);
    store.set(key, value);
    if (scope === 'global') this.options.onVariableChange?.(key, value, scope);
    else if (scope === 'object') this.options.onVariableChange?.(`o!${key}`, value, scope);
  }

  /** @private */
  _deleteVar(name, ctx) {
    const [store, key, scope] = this._scopeOf(name, ctx);
    store.delete(key);
    if (scope !== 'local') this.options.onVariableChange?.(scope === 'object' ? `o!${key}` : key, undefined, scope);
  }

  /**
   * Replaces {var} placeholders in a string. Unset numeric globals read as 0 (like
   * getVariable); other unknown names stay as written.
   * @param {string} text
   * @param {object} [ctx]
   */
  resolveTemplate(text, ctx = null) {
    if (typeof text !== 'string') return text;
    return text.replace(/\{([^{}\s,]+)\}/g, (match, name) => {
      const { found, value } = this._lookup(name, ctx);
      if (found) return formatValue(value);
      return /^\d+$/.test(name) ? '0' : match;
    });
  }

  /**
   * Compares two values with a comparison phrase ("is equal to", "is greater than", ">=", …).
   * @param {any} op1
   * @param {any} op2
   * @param {string} compStr
   */
  _evaluateComparison(op1, op2, compStr) {
    const op = legacyOperator({ id: '18', text: [String(compStr)] }) || 'eq';
    return compare(toNumberIfNumeric(String(op1)), toNumberIfNumeric(String(op2)), op);
  }

  /**
   * Resolves an <any> value. A field that is exactly one {variable} keeps the variable's
   * type (so tables and numbers survive); otherwise numeric text becomes a number.
   * @private
   */
  _resolveAny(raw, ctx) {
    if (typeof raw !== 'string') return raw;
    const whole = /^\{([^{}\s,]+)\}$/.exec(raw);
    if (whole) {
      const { found, value } = this._lookup(whole[1], ctx);
      if (found) return value;
    }
    const str = this.resolveTemplate(raw, ctx);
    return toNumberIfNumeric(str);
  }

  /* ---------------- events ---------------- */

  /**
   * Fires every event block with this ID (and, for targeted events, this object).
   * Matching events start in canvas order (closest to 5000,5000 first) and run concurrently.
   *
   * @param {string|null} targetGlobalId
   * @param {number|string} eventId
   * @param {object} [eventData] - { locals?: object } extra local variables for the run
   * @returns {Promise<void>}
   */
  triggerEvent(targetGlobalId, eventId, eventData = null) {
    const evtIdStr = String(eventId);
    const matches = [];

    for (const sc of this.scripts) {
      for (const evt of (sc.content || [])) {
        if (!evt || String(evt.id) !== evtIdStr) continue;
        if (TARGETED_EVENTS[evtIdStr] || evtIdStr === '10') {
          const target = params(evt)[0]?.value;
          if (target && targetGlobalId && this._resolveObjectId(target, null) !== targetGlobalId) continue;
        }
        if (evtIdStr === '2' && eventData?.key !== undefined) {
          const wanted = params(evt)[0]?.value;
          if (!keyMatches(wanted, eventData)) continue;
        }
        matches.push({ sc, evt });
      }
    }

    matches.sort((a, b) => distanceToCenter(a.evt) - distanceToCenter(b.evt));
    const runs = matches.map(({ sc, evt }) => {
      const locals = new Map(Object.entries(eventData?.locals || {}));
      return this._runEvent(evt, { script: sc, event: evt, locals });
    });
    return Promise.all(runs).then(() => undefined);
  }

  /**
   * Runs one event block on demand (used by the "Run" buttons in the block viewer).
   * @param {object} eventNode
   * @returns {Promise<void>}
   */
  executeEventNode(eventNode) {
    if (!eventNode || !Array.isArray(eventNode.actions)) return Promise.resolve();
    const script = this.scriptOfEvent.get(eventNode) || null;
    return this._runEvent(eventNode, { script, event: eventNode, locals: new Map() });
  }

  /** @private */
  _runEvent(evt, ctx) {
    const actions = Array.isArray(evt.actions) ? evt.actions : [];
    return this._drive(this._runRange(actions, 0, actions.length, ctx), ctx).catch((err) => {
      if (err instanceof ScriptError) {
        this._log('error', err.message, ctx, err.action);
      } else {
        this._log('error', `Runtime error: ${err?.message || err}`, ctx);
      }
    });
  }

  /**
   * Steps a block generator synchronously, pausing only on yielded promises (Wait).
   * @private
   */
  _drive(gen) {
    const generation = this._generation;
    return new Promise((resolve, reject) => {
      const step = (input, isError) => {
        try {
          while (true) {
            const r = isError ? gen.throw(input) : gen.next(input);
            isError = false;
            input = undefined;
            if (r.done) return resolve(r.value);
            if (r.value && typeof r.value.then === 'function') {
              r.value.then(
                (v) => { if (this._generation === generation) step(v, false); else resolve(STOP); },
                (e) => step(e, true)
              );
              return;
            }
          }
        } catch (err) {
          reject(err);
        }
      };
      step(undefined, false);
    });
  }

  /* ---------------- control flow ---------------- */

  /** @private Matches every opener with its `end` and `else`. */
  _jumpTable(actions) {
    let table = this._jumpTables.get(actions);
    if (table) return table;
    table = { end: new Map(), else: new Map() };
    const stack = [];
    actions.forEach((act, i) => {
      const id = String(act?.id);
      if (IF_IDS.has(id) || LOOP_IDS.has(id)) {
        stack.push({ i, id });
      } else if (id === '112') {
        for (let s = stack.length - 1; s >= 0; s--) {
          if (IF_IDS.has(stack[s].id)) {
            if (!table.else.has(stack[s].i)) table.else.set(stack[s].i, i);
            break;
          }
          break;
        }
      } else if (id === '25') {
        const open = stack.pop();
        if (open) table.end.set(open.i, i);
      }
    });
    for (const open of stack) table.end.set(open.i, actions.length);
    this._jumpTables.set(actions, table);
    return table;
  }

  /** @private Runs actions[start, end). Returns BREAK, STOP, {signal:'return'} or undefined. */
  *_runRange(actions, start, end, ctx) {
    const jt = this._jumpTable(actions);
    let i = start;
    while (i < end) {
      const act = actions[i];
      if (!act || typeof act !== 'object') { i++; continue; }
      const id = String(act.id);

      if (this.options.logActions) console.log(`[CatWebRuntime] Action ${id} (globalid: ${act.globalid})`);
      this.options.onAction?.(act, ctx.event);

      if (++this._stepsWithoutWait > MAX_STEPS_WITHOUT_WAIT) {
        throw new ScriptError(`Stopped: ${MAX_STEPS_WITHOUT_WAIT.toLocaleString('en-US')} blocks ran without a Wait. Add a Wait inside Repeat loops.`, act);
      }

      if (IF_IDS.has(id)) {
        const blockEnd = Math.min(jt.end.get(i) ?? end, end);
        const elseAt = jt.else.get(i);
        const cond = this._evalCondition(act, ctx);
        let res;
        if (cond) res = yield* this._runRange(actions, i + 1, elseAt !== undefined && elseAt < blockEnd ? elseAt : blockEnd, ctx);
        else if (elseAt !== undefined && elseAt < blockEnd) res = yield* this._runRange(actions, elseAt + 1, blockEnd, ctx);
        if (res) return res;
        i = blockEnd + 1;
        continue;
      }

      if (LOOP_IDS.has(id)) {
        const blockEnd = Math.min(jt.end.get(i) ?? end, end);
        const res = yield* this._runLoop(act, id, actions, i + 1, blockEnd, ctx);
        if (res) return res;
        i = blockEnd + 1;
        continue;
      }

      if (id === '24') return BREAK;
      if (id === '25' || id === '112') { i++; continue; }

      const res = yield* this._execAction(act, id, ctx);
      if (res) return res;
      i++;
    }
    return undefined;
  }

  /** @private */
  *_runLoop(act, id, actions, bodyStart, bodyEnd, ctx) {
    const p = params(act);
    const runBody = function* () {
      const res = yield* this._runRange(actions, bodyStart, bodyEnd, ctx);
      if (res === BREAK) return 'break';
      if (res) return res;
      return undefined;
    }.bind(this);

    if (id === '22') {
      const times = Math.floor(this._num(p[0], ctx));
      for (let n = 0; n < times; n++) {
        const res = yield* runBody();
        if (res === 'break') break;
        if (res) return res;
      }
      return undefined;
    }

    if (id === '23') {
      while (true) {
        const res = yield* runBody();
        if (res === 'break') break;
        if (res) return res;
      }
      return undefined;
    }

    // 113: Iterate through <table> ({l!index},{l!value})
    const table = this._readVar(p[0]?.value, ctx);
    const entries = Array.isArray(table)
      ? table.map((v, idx) => [idx + 1, v])
      : (table && typeof table === 'object' ? Object.entries(table) : []);
    for (const [key, value] of entries) {
      ctx.locals.set('index', key);
      ctx.locals.set('value', value);
      const res = yield* runBody();
      if (res === 'break') break;
      if (res) return res;
    }
    return undefined;
  }

  /** @private */
  _evalCondition(act, ctx) {
    const id = String(act.id);
    const p = params(act);
    const str = (slot) => String(this._str(slot, ctx));

    switch (id) {
      case '18': case '19': case '20': case '21': case '125': case '126': {
        const a = this._resolveAny(p[0]?.value ?? '', ctx);
        const b = this._resolveAny(p[1]?.value ?? '', ctx);
        const op = { '18': 'eq', '19': 'ne', '20': 'gt', '21': 'lt', '125': 'ge', '126': 'le' }[id];
        return compare(a, b, legacyOperator(act) || op);
      }
      case '37': return str(p[0]).includes(str(p[1]));
      case '38': return !str(p[0]).includes(str(p[1]));
      case '92': return this._lookup(p[0]?.value, ctx).found;
      case '93': return !this._lookup(p[0]?.value, ctx).found;
      case '44': case '45': case '46': case '47': {
        const a = truthy(this._readVar(p[0]?.value, ctx));
        const b = truthy(this._readVar(p[1]?.value, ctx));
        if (id === '44') return a && b;
        if (id === '45') return a || b;
        if (id === '46') return !(a || b);
        return a !== b;
      }
      case '79': return this._mouseButtons.has(0);
      case '80': return this._mouseButtons.has(1);
      case '81': return this._mouseButtons.has(2);
      case '82': {
        const wanted = String(p[0]?.value ?? '').toLowerCase();
        for (const k of this._pressedKeys) if (k === wanted) return true;
        return false;
      }
      case '108': return true; // the runner always shows the dark theme
      case '103': case '104': case '105': {
        const a = this._resolveObjectId(p[0]?.value, ctx);
        const b = this._resolveObjectId(p[1]?.value, ctx);
        if (id === '104') return this.parentByGlobalId.get(b) === a ? false : this.parentByGlobalId.get(a) === b;
        if (id === '103') return this._isAncestor(a, b);
        return this._isAncestor(b, a);
      }
      default:
        return false;
    }
  }

  /** @private Is `ancestorGid` an ancestor of `gid`? */
  _isAncestor(ancestorGid, gid) {
    let cur = this.parentByGlobalId.get(gid);
    let guard = 0;
    while (cur && guard++ < 10000) {
      if (cur === ancestorGid) return true;
      cur = this.parentByGlobalId.get(cur);
    }
    return false;
  }

  /* ---------------- actions ---------------- */

  /** @private Executes one non-control action. */
  *_execAction(act, id, ctx) {
    const p = params(act);
    const varSlot = p.find((s) => s.l === 'variable' || s.l === 'var');

    switch (id) {
      // Console
      case '0': this._log('log', formatValue(this._resolveAny(p[0]?.value ?? '', ctx)), ctx, act); return;
      case '1': this._log('warn', formatValue(this._resolveAny(p[0]?.value ?? '', ctx)), ctx, act); return;
      case '2': this._log('error', formatValue(this._resolveAny(p[0]?.value ?? '', ctx)), ctx, act); return STOP;

      // Wait
      case '3': {
        const seconds = Math.max(0, this._num(p[0], ctx));
        yield this._sleep(seconds > 0 ? seconds : 1 / 60);
        return;
      }

      // Navigation
      case '4': {
        const url = this._str(p[0], ctx);
        this._log('info', `Redirect to "${url}" (not followed in the Web Runner)`, ctx, act);
        this.options.onRedirect?.(url);
        return;
      }
      case '117': this._writeVar(varSlot?.value ?? p[0]?.value, this.options.url, ctx); return;

      // Audio
      case '5': case '26': {
        const assetId = String(this._str(p.find((s) => s.l === 'id' || s.assetbrowser === 'audio') ?? p[0], ctx));
        if (assetId) {
          this.lastAudioPlayed = assetId;
          if (this.options.audioEnabled) playSyntheticAudio(assetId);
          this.options.onAudio?.(assetId);
          const out = p.find((s) => s.l === 'variable?' || s.l === 'variable');
          if (out?.value) this._writeVar(out.value, `audio:${assetId}`, ctx);
          if (id === '26') this._reportOnce('loop-audio', 'Play looped audio plays once in the Web Runner.', ctx, act);
        }
        return;
      }

      // Looks
      case '8': case '9':
        this._applyPropertyToElement(this._resolveObjectId(p[0]?.value, ctx), 'Visible', id === '9' ? 'true' : 'false', ctx);
        return;
      case '10':
        this._applyPropertyToElement(this._resolveObjectId(p[0]?.value, ctx), 'Text', this._str(p[1], ctx), ctx);
        return;
      case '30': {
        const gid = this._resolveObjectId(p[0]?.value, ctx);
        const dom = this._domOf(gid);
        const text = dom && 'value' in dom ? dom.value : (this.elementsByGlobalId.get(gid)?.text ?? '');
        this._writeVar(varSlot?.value, toNumberIfNumeric(String(text)), ctx);
        return;
      }
      case '31': case '88': {
        const prop = p.find((s) => s.l === 'property');
        const obj = p.find((s) => s.t === 'object' || s.l === 'button' || s.l === 'object' || s.l === 'input');
        const val = p.find((s) => s !== prop && s !== obj && (s.t === 'any' || s.l === 'any' || s.l === 'value'));
        if (!prop || !obj) return;
        const gid = this._resolveObjectId(obj.value, ctx);
        const value = val ? formatValue(this._resolveAny(val.value, ctx)) : '';
        if (id === '88') this._prepareTween(gid, p, ctx);
        this._applyPropertyToElement(gid, String(prop.value), value, ctx);
        return;
      }
      case '39': {
        const prop = p.find((s) => s.l === 'property');
        const obj = p.find((s) => s.t === 'object');
        const node = this.elementsByGlobalId.get(this._resolveObjectId(obj?.value, ctx));
        const key = propertyKey(prop?.value);
        const value = node ? (node[key] ?? '') : '';
        this._writeVar(varSlot?.value, toNumberIfNumeric(String(value)), ctx);
        return;
      }
      case '106': {
        const gid = this._resolveObjectId(p[0]?.value, ctx);
        this._applyPropertyToElement(gid, 'Image', this._str(p[1], ctx), ctx);
        return;
      }
      case '49': {
        const gid = this._resolveObjectId(p[0]?.value, ctx);
        const newGid = this._duplicate(gid);
        if (newGid) this._writeVar(varSlot?.value ?? p[1]?.value, newGid, ctx);
        return;
      }
      case '50': {
        const gid = this._resolveObjectId(p[0]?.value, ctx);
        this._domOf(gid)?.remove?.();
        this.elementsByGlobalId.delete(gid);
        return;
      }
      case '58': {
        const child = this._resolveObjectId(p[0]?.value, ctx);
        const parent = this._resolveObjectId(p[1]?.value, ctx);
        const childDom = this._domOf(child);
        const parentDom = this._domOf(parent);
        if (childDom && parentDom?.appendChild) parentDom.appendChild(childDom);
        if (this.elementsByGlobalId.has(child)) this.parentByGlobalId.set(child, parent);
        return;
      }

      // Variables & math
      case '11': this._writeVar(varSlot?.value, this._resolveAny(p.find((s) => s !== varSlot)?.value ?? '', ctx), ctx); return;
      case '96': this._deleteVar(varSlot?.value ?? p[0]?.value, ctx); return;
      case '12': case '13': case '14': case '15': case '40': case '41': {
        const target = varSlot ?? p[0];
        const operand = p.find((s) => s !== target);
        const a = Number(this._readVar(target?.value, ctx)) || 0;
        const b = this._num(operand, ctx);
        const result = {
          '12': a + b, '13': a - b, '14': a * b, '15': a / b, '40': a ** b,
          '41': b === 0 ? NaN : a - Math.floor(a / b) * b
        }[id];
        this._writeVar(target?.value, result, ctx);
        return;
      }
      case '16': case '17': case '78': {
        const target = varSlot ?? p[0];
        const a = Number(this._readVar(target?.value, ctx)) || 0;
        const fn = { '16': (x) => Math.sign(x) * Math.round(Math.abs(x)), '17': Math.floor, '78': Math.ceil }[id];
        this._writeVar(target?.value, fn(a), ctx);
        return;
      }
      case '27': {
        const lo = Math.ceil(this._num(p[1], ctx));
        const hi = Math.floor(this._num(p[2], ctx));
        const [min, max] = lo <= hi ? [lo, hi] : [hi, lo];
        this._writeVar(p[0]?.value, min + Math.floor(Math.random() * (max - min + 1)), ctx);
        return;
      }
      case '114': {
        const fnName = String(p[0]?.value ?? '').replace(/^math\./, '');
        const tuple = p.find((s) => s.t === 'tuple');
        const args = (Array.isArray(tuple?.value) ? tuple.value : []).map((a) => {
          const v = this._str(a, ctx);
          return typeof v === 'string' && v.length === 1 && isNaN(Number(v)) ? v.charCodeAt(0) : Number(v);
        });
        const out = p.filter((s) => s !== tuple && s !== p[0]).pop();
        this._writeVar(out?.value, runMathFunction(fnName, args), ctx);
        return;
      }

      // Strings
      case '42': {
        const target = varSlot ?? p[0];
        const s = String(formatValue(this._readVar(target?.value, ctx) ?? ''));
        const start = Math.max(1, Math.floor(this._num(p[1], ctx)));
        const endIdx = Math.floor(this._num(p[2], ctx));
        this._writeVar(target?.value, s.substring(start - 1, endIdx), ctx);
        return;
      }
      case '43': {
        const target = varSlot ?? p[1];
        const s = String(formatValue(this._readVar(target?.value, ctx) ?? ''));
        const find = String(this._str(p[0], ctx));
        const repl = String(this._str(p[2], ctx));
        this._writeVar(target?.value, find ? s.split(find).join(repl) : s, ctx);
        return;
      }
      case '48': {
        const s = String(this._str(p[0], ctx));
        const bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : s.length;
        this._writeVar(varSlot?.value ?? p[1]?.value, bytes, ctx);
        return;
      }
      case '57': {
        const s = String(this._str(p[0], ctx));
        const sep = String(this._str(p[1], ctx));
        const out = p.find((s2) => s2.l === 'table') ?? p[2];
        this._writeVar(out?.value, (sep ? s.split(sep) : [...s]).map(toNumberIfNumeric), ctx);
        return;
      }
      case '69': this._writeVar(varSlot?.value, String(this._str(p[0], ctx)).toLowerCase(), ctx); return;
      case '70': this._writeVar(varSlot?.value, String(this._str(p[0], ctx)).toUpperCase(), ctx); return;
      case '109': this._writeVar(varSlot?.value, `${this._str(p[0], ctx)}${this._str(p[1], ctx)}`, ctx); return;
      case '119': {
        const hex = String(this._str(p[0], ctx)).replace('#', '');
        const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex.slice(0, 6);
        const n = parseInt(full, 16);
        this._writeVar(varSlot?.value, isNaN(n) ? '' : `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`, ctx);
        return;
      }
      case '121': {
        const [r, g, b] = String(this._str(p[0], ctx)).split(',').map((x) => Math.max(0, Math.min(255, Math.round(Number(x) || 0))));
        const hex = '#' + [r, g, b].map((x) => (x ?? 0).toString(16).padStart(2, '0')).join('');
        this._writeVar(varSlot?.value, hex, ctx);
        return;
      }

      // Tables
      case '54': this._writeVar(p[0]?.value, {}, ctx); return;
      case '55': case '66': {
        const table = this._table(p[1]?.value, ctx);
        if (!table) return;
        const key = String(this._str(p[0], ctx));
        const value = id === '66' ? this._resolveObjectId(p[2]?.value, ctx) : this._resolveAny(p[2]?.value ?? '', ctx);
        this._writeVar(p[1].value, setEntry(table, key, value), ctx);
        return;
      }
      case '56': {
        const table = this._table(p[1]?.value, ctx);
        const key = String(this._str(p[0], ctx));
        const value = table ? (Array.isArray(table) ? table[Number(key) - 1] : table[key]) : undefined;
        if (value === undefined) this._deleteVar(varSlot?.value ?? p[2]?.value, ctx);
        else this._writeVar(varSlot?.value ?? p[2]?.value, value, ctx);
        return;
      }
      case '90': {
        const table = this._table(p[1]?.value, ctx);
        if (!table) return;
        const key = String(this._str(p[0], ctx));
        if (Array.isArray(table)) table.splice(Number(key) - 1, 1);
        else delete table[key];
        this._writeVar(p[1].value, table, ctx);
        return;
      }
      case '89': {
        const arrSlot = p.find((s) => s.l === 'array') ?? p[2];
        const arr = this._array(arrSlot?.value, ctx);
        if (!arr) return;
        const value = this._resolveAny(p[0]?.value ?? '', ctx);
        const posRaw = this._str(p[1], ctx);
        const pos = posRaw === '' ? arr.length + 1 : Math.floor(Number(posRaw)) || arr.length + 1;
        arr.splice(Math.max(0, Math.min(arr.length, pos - 1)), 0, value);
        this._writeVar(arrSlot.value, arr, ctx);
        return;
      }
      case '91': {
        const arrSlot = p.find((s) => s.l === 'array') ?? p[1];
        const arr = this._array(arrSlot?.value, ctx);
        if (!arr) return;
        const posRaw = this._str(p[0], ctx);
        const pos = posRaw === '' ? arr.length : Math.floor(Number(posRaw)) || arr.length;
        arr.splice(pos - 1, 1);
        this._writeVar(arrSlot.value, arr, ctx);
        return;
      }
      case '59': {
        const t = this._readVar(p[0]?.value, ctx);
        this._writeVar(varSlot?.value ?? p[1]?.value, Array.isArray(t) ? t.length : (t && typeof t === 'object' ? Object.keys(t).length : 0), ctx);
        return;
      }
      case '110': {
        const t = this._readVar(p[0]?.value, ctx);
        const sep = String(this._str(p[1], ctx));
        this._writeVar(varSlot?.value ?? p[2]?.value, Array.isArray(t) ? t.map(formatValue).join(sep) : '', ctx);
        return;
      }

      // Environment
      case '84': {
        const w = this.domRoot?.offsetWidth || this.domRoot?.clientWidth || 1920;
        const h = this.domRoot?.offsetHeight || this.domRoot?.clientHeight || 1080;
        this._writeVar(p[0]?.value, w, ctx);
        this._writeVar(p[1]?.value, h, ctx);
        return;
      }
      case '85':
        this._writeVar(p[0]?.value, Math.round(this._cursor.x), ctx);
        this._writeVar(p[1]?.value, Math.round(this._cursor.y), ctx);
        return;
      case '32': case '33': {
        const message = formatValue(this._resolveAny(p[0]?.value ?? '', ctx));
        this._log('info', `Broadcast "${message}" (delivered to this page only)`, ctx, act);
        this.triggerEvent(null, 9, { locals: { messageContent: message, messageSenderId: 1, messageSenderName: 'Player' } });
        return;
      }

      // Cookies
      case '34': this.cookies.set(String(this._str(p[0], ctx)), this._resolveAny(p[1]?.value ?? '', ctx)); return;
      case '36': {
        const name = String(this._str(p[0], ctx));
        if (this.cookies.has(name)) this._writeVar(varSlot?.value ?? p[1]?.value, this.cookies.get(name), ctx);
        else this._deleteVar(varSlot?.value ?? p[1]?.value, ctx);
        return;
      }
      case '62': this.cookies.delete(String(this._str(p[0], ctx))); return;

      // Functions (87 is the deprecated form of 132; both stop the event when the function is missing)
      case '132':
      case '87': {
        const name = String(p.find((s) => s.l === 'function')?.value ?? p[0]?.value ?? '');
        const fn = this.functions.get(name);
        if (!fn) throw new ScriptError(`Function "${name}" is not defined (Run function stops the event in strict mode).`, act);
        const tuple = p.find((s) => s.t === 'tuple');
        const locals = new Map();
        const overrides = Array.isArray(fn.node.variable_overrides) ? fn.node.variable_overrides : [];
        (Array.isArray(tuple?.value) ? tuple.value : []).forEach((arg, idx) => {
          const name2 = overrides[idx]?.value;
          if (name2 !== undefined) locals.set(stripBraces(String(name2)).replace(/^l!/, ''), this._resolveAny(arg?.value ?? '', ctx));
        });
        const fnActions = Array.isArray(fn.node.actions) ? fn.node.actions : [];
        const res = yield* this._runRange(fnActions, 0, fnActions.length, { script: fn.script, event: fn.node, locals });
        if (res === STOP) return STOP;
        const out = p.find((s) => s.l === 'variable?' || s.l === 'variable');
        if (out?.value && res?.signal === 'return') this._writeVar(out.value, res.value, ctx);
        return;
      }
      case '115':
        return { signal: 'return', value: this._resolveAny(p[0]?.value ?? '', ctx) };

      default:
        this._reportOnce(`action-${id}`, `${ACTION_NAMES[id] || `Action ${id}`} (id ${id}) isn't simulated in the Web Runner and was skipped.`, ctx, act);
        return;
    }
  }

  /* ---------------- helpers ---------------- */

  /** @private Resolves a parameter to a string (templates applied). */
  _str(slot, ctx) {
    if (!slot) return '';
    const v = slot.value;
    if (typeof v !== 'string') return v ?? '';
    return this.resolveTemplate(v, ctx);
  }

  /** @private Resolves a parameter to a number (non-numeric → 0). */
  _num(slot, ctx) {
    const n = Number(this._resolveAny(slot?.value ?? '', ctx));
    return Number.isFinite(n) ? n : 0;
  }

  /** @private */
  _table(name, ctx) {
    const t = this._readVar(name, ctx);
    if (t && typeof t === 'object') return t;
    if (name !== undefined) this._log('warn', `"${name}" is not a table. Create it with "Create table" first.`, ctx);
    return null;
  }

  /** @private */
  _array(name, ctx) {
    const t = this._readVar(name, ctx);
    if (Array.isArray(t)) return t;
    if (t && typeof t === 'object' && Object.keys(t).length === 0) return [];
    if (name !== undefined) this._log('warn', `"${name}" is not an array.`, ctx);
    return null;
  }

  /**
   * Turns an <object> value into a globalid: plain IDs, {variables} holding an ID,
   * or "(parent)" for the script's parent element.
   * @private
   */
  _resolveObjectId(value, ctx) {
    if (value === undefined || value === null) return '';
    const raw = String(value);
    if (raw === '(parent)') return this.parentByGlobalId.get(ctx?.script?.globalid) ?? '';
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const { found, value: v } = this._lookup(raw.slice(1, -1), ctx);
      return found ? String(v) : raw;
    }
    if (!this.elementsByGlobalId.has(raw)) {
      const { found, value: v } = this._lookup(raw, ctx);
      if (found && this.elementsByGlobalId.has(String(v))) return String(v);
    }
    return raw;
  }

  /** @private */
  _domOf(gid) {
    if (!gid || !this.domRoot?.querySelector) return null;
    try {
      return this.domRoot.querySelector(`[data-globalid="${cssEscape(gid)}"]`);
    } catch {
      return null;
    }
  }

  /** @private */
  _duplicate(gid) {
    const sourceNode = this.elementsByGlobalId.get(gid);
    if (!sourceNode) return null;
    let newGid;
    do {
      newGid = `~${(this._dupCounter++).toString(36)}`;
    } while (this.elementsByGlobalId.has(newGid));
    const clonedNode = JSON.parse(JSON.stringify(sourceNode));
    clonedNode.globalid = newGid;
    this.elementsByGlobalId.set(newGid, clonedNode);
    const parent = this.parentByGlobalId.get(gid);
    if (parent) this.parentByGlobalId.set(newGid, parent);

    const dom = this._domOf(gid);
    if (dom?.cloneNode && dom.parentNode) {
      const copy = dom.cloneNode(true);
      copy.setAttribute?.('data-globalid', newGid);
      dom.parentNode.insertBefore(copy, dom.nextSibling);
      this._rebindClone(gid, newGid, copy);
    }
    return newGid;
  }

  /** @private Clones keep working with events written for their source object. */
  _rebindClone(sourceGid, newGid, domEl) {
    for (const [evtId, domType] of Object.entries(TARGETED_EVENTS)) {
      if (domType === 'submit') continue;
      const listens = this.scripts.some((sc) => (sc.content || []).some((evt) =>
        String(evt?.id) === evtId && params(evt)[0]?.value === sourceGid));
      if (!listens) continue;
      this._listen(domEl, domType, (e) => {
        if (domType === 'contextmenu') e.preventDefault?.();
        this.triggerEvent(sourceGid, evtId, { locals: { clone: newGid } });
      });
    }
  }

  /** @private */
  _prepareTween(gid, p, ctx) {
    const dom = this._domOf(gid);
    if (!dom?.style) return;
    const time = this._num(p.find((s) => s.l === 'time') ?? p.find((s) => s.t === 'number'), ctx) || 0.3;
    const style = String(p.find((s) => s.l === 'style')?.value ?? 'Quad').toLowerCase();
    const dir = String(p.find((s) => s.l === 'direction')?.value ?? 'Out');
    const curve = TWEEN_EASINGS[style];
    const easing = typeof curve === 'string' ? curve : (curve?.[dir] ?? 'ease');
    dom.style.transition = `all ${time}s ${easing}`;
  }

  /** @private */
  _sleep(seconds) {
    this._stepsWithoutWait = 0;
    return new Promise((resolve) => {
      const tid = setTimeout(() => {
        this.activeTimeouts.delete(tid);
        this._stepsWithoutWait = 0;
        resolve();
      }, seconds * 1000);
      this.activeTimeouts.add(tid);
    });
  }

  /** @private */
  _log(level, message, ctx = null, act = null) {
    const entry = {
      level,
      message: String(message),
      time: Date.now(),
      scriptGid: ctx?.script?.globalid,
      eventGid: ctx?.event?.globalid,
      eventName: ctx?.event ? (EVENT_NAMES[String(ctx.event.id)] || `Event ${ctx.event.id}`) : undefined,
      actionGid: act?.globalid
    };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.options.onLog?.(entry);
  }

  /** @private */
  _reportOnce(key, message, ctx, act) {
    if (this._reported.has(key)) return;
    this._reported.add(key);
    this._log('info', message, ctx, act);
  }

  /* ---------------- DOM wiring ---------------- */

  /** @private */
  _listen(el, type, handler) {
    if (!el?.addEventListener) return;
    el.addEventListener(type, handler);
    this.domListeners.push({ el, type, handler });
  }

  /**
   * Binds clicks, hovers, mouse buttons, input submits and keys to their events.
   * @private
   */
  _bindDomListeners() {
    if (!this.domRoot) return;

    const targets = new Map(); // gid -> Set<eventId>
    let wantsKeys = false;
    for (const sc of this.scripts) {
      for (const evt of (sc.content || [])) {
        const evtId = String(evt?.id);
        if (TARGETED_EVENTS[evtId]) {
          const gid = params(evt)[0]?.value;
          if (!gid) continue;
          if (!targets.has(gid)) targets.set(gid, new Set());
          targets.get(gid).add(evtId);
        }
        if (evtId === '2' || evtId === '16') wantsKeys = true;
      }
    }

    for (const [gid, evtSet] of targets) {
      const domEl = this._domOf(gid);
      if (!domEl) continue;
      for (const evtId of evtSet) {
        const type = TARGETED_EVENTS[evtId];
        if (type === 'submit') {
          this._listen(domEl, 'keydown', (e) => {
            if (!this.isRunning || e.key !== 'Enter') return;
            this.triggerEvent(gid, 8, e);
          });
          continue;
        }
        this._listen(domEl, type, (e) => {
          if (!this.isRunning) return;
          if (type === 'contextmenu') e.preventDefault?.();
          this.triggerEvent(gid, evtId, e);
        });
      }
    }

    // Pointer state for "If mouse button down" and "Get cursor position"
    this._listen(this.domRoot, 'mousedown', (e) => this._mouseButtons.add(e.button ?? 0));
    this._listen(this.domRoot, 'mousemove', (e) => {
      const rect = this.domRoot.getBoundingClientRect?.();
      if (!rect) return;
      const scale = this.domRoot.offsetWidth ? rect.width / this.domRoot.offsetWidth : 1;
      this._cursor = { x: (e.clientX - rect.left) / (scale || 1), y: (e.clientY - rect.top) / (scale || 1) };
    });
    const doc = this.domRoot.ownerDocument;
    const win = doc?.defaultView;
    if (win) this._listen(win, 'mouseup', (e) => this._mouseButtons.delete(e.button ?? 0));

    if (doc) {
      this._listen(doc, 'keydown', (e) => {
        if (!this.isRunning || isTypingTarget(e.target)) return;
        for (const name of keyNames(e)) this._pressedKeys.add(name);
        if (!wantsKeys || e.repeat) return;
        this.triggerEvent(null, 2, { key: e.key, code: e.code });
        this.triggerEvent(null, 16, { locals: { key: robloxKeyName(e) } });
      });
      this._listen(doc, 'keyup', (e) => {
        for (const name of keyNames(e)) this._pressedKeys.delete(name);
      });
    }
  }

  /**
   * True when the page has a "When <key> pressed" event for this key, so the app
   * can leave the key to the site instead of using it as a shortcut.
   * @param {KeyboardEvent} e
   */
  listensForKey(e) {
    return this.scripts.some((sc) => (sc.content || []).some((evt) =>
      String(evt?.id) === '2' && keyMatches(params(evt)[0]?.value, e)));
  }

  /** @private */
  _unbindDomListeners() {
    for (const { el, type, handler } of this.domListeners) {
      el?.removeEventListener?.(type, handler);
    }
    this.domListeners = [];
  }

  /**
   * Applies a script property (Title Case name) to an element's JSON node and DOM.
   * @private
   */
  _applyPropertyToElement(targetGid, propName, resolvedVal, ctx = null) {
    const actualGid = this._resolveObjectId(targetGid, ctx);
    const targetNode = this.elementsByGlobalId.get(actualGid);
    const domEl = this._domOf(actualGid);
    const normalizedProp = String(propName).replace(/\s+/g, '').toLowerCase();
    const key = PROPERTY_KEYS[normalizedProp];

    if (!targetNode && !domEl) {
      this._log('warn', `Set ${propName}: no element with globalid "${actualGid}"`, ctx);
      return;
    }

    if (key === 'text') {
      if (targetNode) targetNode.text = resolvedVal;
      if (domEl) {
        if (domEl.tagName === 'INPUT' || domEl.tagName === 'TEXTAREA') domEl.value = resolvedVal;
        else domEl.textContent = resolvedVal;
      }
    } else if (key === 'font_color') {
      if (targetNode) targetNode.font_color = resolvedVal;
      if (domEl?.style) applyTextStyling(domEl, resolvedVal, targetNode ? (targetNode.font_transparency ?? targetNode.text_transparency) : undefined);
    } else if (key === 'background_color') {
      if (targetNode) targetNode.background_color = resolvedVal;
      if (domEl?.style) applyBackgroundStyling(domEl, resolvedVal, targetNode ? targetNode.background_transparency : undefined);
    } else if (key === 'visible') {
      const isVisible = resolvedVal !== 'false' && resolvedVal !== false;
      if (targetNode) targetNode.visible = isVisible ? 'true' : 'false';
      if (domEl?.style) domEl.style.display = isVisible ? '' : 'none';
    } else if (key === 'position' || key === 'size') {
      if (targetNode) targetNode[key] = resolvedVal;
      if (domEl?.style) {
        try {
          const css = udim2ToCss(resolvedVal);
          if (key === 'position') { domEl.style.left = css.left; domEl.style.top = css.top; }
          else { domEl.style.width = css.width; domEl.style.height = css.height; }
        } catch {
          this._log('warn', `${propName}: "${resolvedVal}" is not a UDim2 like {0,0},{0,100}`, ctx);
        }
      }
    } else if (key === 'background_transparency') {
      if (targetNode) targetNode.background_transparency = resolvedVal;
      if (domEl?.style) {
        applyBackgroundStyling(domEl, targetNode ? targetNode.background_color : undefined, resolvedVal);
        if (domEl.style.opacity) domEl.style.opacity = '';
      }
    } else if (key === 'font_transparency') {
      if (targetNode) {
        targetNode.font_transparency = resolvedVal;
        targetNode.text_transparency = resolvedVal;
      }
      if (domEl?.style) applyTextStyling(domEl, targetNode ? targetNode.font_color : undefined, resolvedVal);
    } else if (key === 'order') {
      if (targetNode) targetNode.order = String(resolvedVal);
      if (domEl?.style) domEl.style.order = String(resolvedVal);
    } else if (key === 'rotation') {
      if (targetNode) targetNode.rotation = String(resolvedVal);
      if (domEl?.style) domEl.style.rotate = `${Number(resolvedVal) || 0}deg`;
    } else if (key === 'z_index') {
      if (targetNode) targetNode.z_index = String(resolvedVal);
      if (domEl?.style) domEl.style.zIndex = String(resolvedVal);
    } else if (key === 'font_size') {
      if (targetNode) targetNode.font_size = String(resolvedVal);
      if (domEl?.style && !isNaN(Number(resolvedVal))) domEl.style.fontSize = `${Number(resolvedVal)}px`;
    } else if (key === 'image_id') {
      const id = String(resolvedVal).replace(/^rbxassetid:\/\//, '');
      if (targetNode) { targetNode.image_id = id; targetNode.image = `rbxassetid://${id}`; }
      if (domEl) {
        const resolved = resolveRobloxAsset(id);
        domEl.setAttribute?.('data-asset-type', resolved.type);
        if (resolved.type === 'svg' || resolved.type === 'badge') domEl.innerHTML = resolved.content;
      }
    } else if (key && targetNode) {
      targetNode[key] = resolvedVal;
      if (key === 'placeholder') domEl?.setAttribute?.('placeholder', resolvedVal);
      if (key === 'tooltip') domEl?.setAttribute?.('title', resolvedVal);
    } else {
      this._reportOnce(`prop-${normalizedProp}`, `Property "${propName}" isn't simulated in the Web Runner.`, ctx);
    }

    this.options.onPropertyChange?.(actualGid, propName, resolvedVal);

    // "When <object> changed" (event 10); depth guard stops change → set → change loops.
    if (this._changeDepth < 8 && this.scripts.some((sc) => (sc.content || []).some((e) => String(e?.id) === '10'))) {
      this._changeDepth++;
      try {
        this.triggerEvent(actualGid, 10);
      } finally {
        this._changeDepth--;
      }
    }
  }
}

/* ============================================================
 * PURE HELPERS
 * ============================================================ */

/** Parameter objects of a block's `text`, in order. */
function params(block) {
  return Array.isArray(block?.text) ? block.text.filter((t) => t && typeof t === 'object') : [];
}

function stripBraces(s) {
  return s.startsWith('{') && s.endsWith('}') ? s.slice(1, -1) : s;
}

/** "tbl.a.1" → ["tbl", "a", "1"], keeping scope prefixes like "l!tbl" intact. */
function splitPath(name) {
  return String(name).split('.');
}

function toNumberIfNumeric(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  if (trimmed === '' || !/^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(trimmed)) return str;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : str;
}

/** Formats a value the way CatWeb prints it in text. */
export function formatValue(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'nan';
    if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
    return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(14)));
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v) || typeof v === 'object') {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

function truthy(v) {
  if (v === undefined || v === null || v === false) return false;
  if (v === 0 || v === '' || v === '0' || v === 'false') return false;
  return true;
}

function compare(a, b, op) {
  const na = Number(a);
  const nb = Number(b);
  const numeric = a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb);
  if (op === 'eq') return numeric ? na === nb : formatValue(a) === formatValue(b);
  if (op === 'ne') return numeric ? na !== nb : formatValue(a) !== formatValue(b);
  if (!numeric) return false; // CatWeb compares order numerically only
  if (op === 'gt') return na > nb;
  if (op === 'lt') return na < nb;
  if (op === 'ge') return na >= nb;
  if (op === 'le') return na <= nb;
  return false;
}

/** Older exports write every comparison as id 18 with the operator in the text. */
function legacyOperator(act) {
  if (String(act.id) !== '18') return null;
  const words = (act.text || []).filter((t) => typeof t === 'string').map((t) => t.trim().toLowerCase());
  for (const w of words) {
    if (w === 'is not equal to' || w === '!=' || w === '~=') return 'ne';
    if (w === 'is greater than' || w === '>') return 'gt';
    if (w === 'is lower than' || w === 'is less than' || w === '<') return 'lt';
    if (w.startsWith('is greater') && w.includes('equal') || w === '>=') return 'ge';
    if ((w.startsWith('is lower') || w.startsWith('is less')) && w.includes('equal') || w === '<=') return 'le';
  }
  return null;
}

function setEntry(table, key, value) {
  if (Array.isArray(table)) {
    const idx = Number(key);
    if (Number.isInteger(idx) && idx >= 1) {
      table[idx - 1] = value;
      return table;
    }
    return table; // arrays can't hold keys
  }
  // Setting index 1 on an empty table turns it into an array (see CatDocs "Tables").
  if (key === '1' && Object.keys(table).length === 0) return [value];
  table[key] = value;
  return table;
}

function distanceToCenter(evt) {
  const x = Number(evt?.x);
  const y = Number(evt?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return Infinity;
  return Math.hypot(x - 5000, y - 5000);
}

function propertyKey(name) {
  const norm = String(name ?? '').replace(/\s+/g, '').toLowerCase();
  return PROPERTY_KEYS[norm] || String(name ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

function runMathFunction(name, args) {
  if (name === 'pi') return Math.PI;
  if (name === 'huge') return Infinity;
  const fns = {
    abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan, atan2: Math.atan2,
    ceil: Math.ceil, cos: Math.cos, cosh: Math.cosh, deg: (x) => x * 180 / Math.PI, exp: Math.exp,
    floor: Math.floor, log: (x, b) => (b ? Math.log(x) / Math.log(b) : Math.log(x)), log10: Math.log10,
    max: Math.max, min: Math.min, pow: Math.pow, rad: (x) => x * Math.PI / 180, sin: Math.sin,
    sinh: Math.sinh, sqrt: Math.sqrt, tan: Math.tan, tanh: Math.tanh, sign: Math.sign,
    round: (x) => Math.sign(x) * Math.round(Math.abs(x)),
    clamp: (x, lo, hi) => Math.min(Math.max(x, lo), hi),
    fmod: (a, b) => a % b,
    random: (a, b) => (a === undefined ? Math.random() : b === undefined ? 1 + Math.floor(Math.random() * a) : a + Math.floor(Math.random() * (b - a + 1)))
  };
  const fn = fns[name];
  return fn ? fn(...args) : NaN;
}

function cssEscape(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/["\\]/g, '\\$&');
}

function isTypingTarget(t) {
  const tag = t?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(t?.isContentEditable);
}

const DIGIT_NAMES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const SPECIAL_KEYS = {
  ' ': 'Space', Enter: 'Return', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  Shift: 'LeftShift', Control: 'LeftControl', Alt: 'LeftAlt', Escape: 'Escape', Backspace: 'Backspace', Tab: 'Tab'
};

/** Roblox KeyCode name for a browser key event ("a" → "A", "1" → "One", " " → "Space"). */
function robloxKeyName(e) {
  const key = e?.key ?? '';
  if (SPECIAL_KEYS[key]) return SPECIAL_KEYS[key];
  if (/^[a-z]$/i.test(key)) return key.toUpperCase();
  if (/^\d$/.test(key)) return DIGIT_NAMES[Number(key)];
  return key;
}

/** Every lowercase name a key event can be matched by. */
function keyNames(e) {
  const names = new Set([String(e?.key ?? '').toLowerCase(), robloxKeyName(e).toLowerCase()]);
  if (e?.code) names.add(String(e.code).toLowerCase().replace(/^key/, ''));
  names.delete('');
  return names;
}

function keyMatches(wanted, e) {
  if (wanted === undefined || wanted === null || wanted === '') return true;
  return keyNames(e).has(String(wanted).trim().toLowerCase());
}
