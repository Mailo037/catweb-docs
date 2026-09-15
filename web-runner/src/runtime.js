/**
 * CatWeb Interactive Scripting Engine & State Machine
 *
 * Implements client-side variable storage, template interpolation ({1}, {2}),
 * event binding (0: loaded, 1: pressed, 2: hover, 3: unhover), and action
 * dispatching (11: Set, 12: Add, 31: Set Property, 18: If, 25: End, 3: Wait,
 * 5: Play Audio, 88: Tween).
 *
 * Fully integrated with CatWeb Visual Elements and Web Audio synthesis.
 * Zero external dependencies.
 */

import { playSyntheticAudio } from './assets.js';
import { udim2ToCss } from './coordinates.js';

export class CatWebRuntime {
  /**
   * @param {object|Array} documentTree - CatWeb document (Full Site or Snippet array)
   * @param {HTMLElement} [domRoot] - Root DOM container where tree is rendered
   * @param {object} [options={}] - Configuration options
   */
  constructor(documentTree, domRoot = null, options = {}) {
    this.tree = documentTree;
    this.domRoot = domRoot;
    this.options = {
      audioEnabled: true,
      logActions: false,
      ...options
    };

    this.variables = new Map();
    this.elementsByGlobalId = new Map();
    this.scripts = [];
    this.activeTimeouts = new Set();
    this.domListeners = [];
    this.lastAudioPlayed = null;
    this.isRunning = false;

    this._indexTree(documentTree);
  }

  /**
   * Deeply indexes all elements and active scripts in the document tree.
   * @private
   */
  _indexTree(root) {
    const traverse = (node) => {
      if (!node || typeof node !== 'object') return;

      if (node.globalid) {
        this.elementsByGlobalId.set(node.globalid, node);
      }

      if (node.class === 'script') {
        if (node.enabled !== 'false' && node.enabled !== false) {
          this.scripts.push(node);
        }
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) traverse(child);
      }
      if (Array.isArray(node.webcontent)) {
        for (const child of node.webcontent) traverse(child);
      }
    };

    if (Array.isArray(root)) {
      for (const item of root) traverse(item);
    } else {
      traverse(root);
    }
  }

  /**
   * Starts the runtime engine: attaches DOM event listeners and triggers Event 0 (loaded).
   * @returns {Promise<void>}
   */
  start() {
    this.isRunning = true;
    this._bindDomListeners();
    // Trigger "When website loaded" (Event 0)
    return this.triggerEvent(null, 0);
  }

  /**
   * Stops the runtime and clears timeouts and active listeners.
   */
  stop() {
    this.isRunning = false;
    for (const tid of this.activeTimeouts) {
      clearTimeout(tid);
    }
    this.activeTimeouts.clear();
    this._unbindDomListeners();
  }

  /**
   * Destroys the runtime instance.
   */
  destroy() {
    this.stop();
    this.variables.clear();
    this.elementsByGlobalId.clear();
    this.scripts = [];
  }

  /**
   * Retrieves a variable value from store (defaults to 0 if not set).
   * @param {string|number} varId
   * @returns {any}
   */
  getVariable(varId) {
    const key = String(varId);
    if (this.variables.has(key)) {
      return this.variables.get(key);
    }
    return 0;
  }

  /**
   * Sets a variable in the store and notifies callbacks.
   * @param {string|number} varId
   * @param {any} val
   */
  setVariable(varId, val) {
    const key = String(varId);
    this.variables.set(key, val);
    if (typeof this.options.onVariableChange === 'function') {
      this.options.onVariableChange(key, val);
    }
  }

  /**
   * Resolves template placeholders in text strings, e.g. "{1}" -> value of variable 1.
   * @param {string} text
   * @returns {string}
   */
  resolveTemplate(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/\{(\d+)\}/g, (match, varId) => {
      const val = this.getVariable(varId);
      return val !== undefined && val !== null ? String(val) : '0';
    });
  }

  /**
   * Binds interactive DOM listeners for button clicks and hover states.
   * @private
   */
  _bindDomListeners() {
    if (!this.domRoot) return;

    // Collect target globalids needed for event 1 (click), event 2 (hover), event 3 (unhover)
    const targetMap = new Map(); // targetGid -> Set of event IDs

    for (const sc of this.scripts) {
      for (const evt of (sc.content || [])) {
        const evtId = String(evt.id);
        if (['1', '2', '3'].includes(evtId)) {
          const targetSlot = evt.text?.find(item => item && typeof item === 'object' && (item.t === 'object' || item.l === 'button' || item.l === 'object'));
          const targetGid = targetSlot?.value;
          if (targetGid) {
            if (!targetMap.has(targetGid)) targetMap.set(targetGid, new Set());
            targetMap.get(targetGid).add(evtId);
          }
        }
      }
    }

    // Attach listeners to DOM elements matching data-globalid or buttons
    for (const [gid, evtSet] of targetMap.entries()) {
      const domEl = this.domRoot.querySelector ? this.domRoot.querySelector(`[data-globalid="${gid}"]`) : null;
      if (!domEl) continue;

      if (evtSet.has('1')) {
        const clickHandler = (e) => {
          if (!this.isRunning) return;
          this.triggerEvent(gid, 1, e);
        };
        domEl.addEventListener('click', clickHandler);
        this.domListeners.push({ el: domEl, type: 'click', handler: clickHandler });
      }

      if (evtSet.has('2')) {
        const enterHandler = (e) => {
          if (!this.isRunning) return;
          this.triggerEvent(gid, 2, e);
        };
        domEl.addEventListener('mouseenter', enterHandler);
        this.domListeners.push({ el: domEl, type: 'mouseenter', handler: enterHandler });
      }

      if (evtSet.has('3')) {
        const leaveHandler = (e) => {
          if (!this.isRunning) return;
          this.triggerEvent(gid, 3, e);
        };
        domEl.addEventListener('mouseleave', leaveHandler);
        this.domListeners.push({ el: domEl, type: 'mouseleave', handler: leaveHandler });
      }
    }
  }

  /**
   * Unbinds all registered DOM listeners.
   * @private
   */
  _unbindDomListeners() {
    for (const { el, type, handler } of this.domListeners) {
      if (el && typeof el.removeEventListener === 'function') {
        el.removeEventListener(type, handler);
      }
    }
    this.domListeners = [];
  }

  /**
   * Triggers an event by ID on an optional target global ID.
   *
   * @param {string|null} targetGlobalId
   * @param {number|string} eventId
   * @param {object} [eventData]
   * @returns {Promise<void>}
   */
  async triggerEvent(targetGlobalId, eventId, eventData = null) {
    const evtIdStr = String(eventId);

    for (const sc of this.scripts) {
      const content = sc.content || [];
      for (const evt of content) {
        if (String(evt.id) === evtIdStr) {
          // If targeted event (1: pressed, 2: hover, 3: unhover), check target globalid match
          if (['1', '2', '3'].includes(evtIdStr)) {
            const targetSlot = evt.text?.find(item => item && typeof item === 'object' && (item.t === 'object' || item.l === 'button' || item.l === 'object'));
            if (targetSlot && targetGlobalId && targetSlot.value !== targetGlobalId) {
              continue; // Target does not match
            }
          }

          await this._executeActions(evt.actions || [], evt);
        }
      }
    }
  }

  /**
   * Executes a flat list of script actions.
   * @private
   */
  async _executeActions(actions, currentEvent) {
    let i = 0;
    while (i < actions.length) {
      if (!this.isRunning && currentEvent?.id !== '0') break;

      const act = actions[i];
      if (!act) {
        i++;
        continue;
      }
      const actId = String(act.id);

      if (this.options.logActions) {
        console.log(`[CatWebRuntime] Action ${actId} (globalid: ${act.globalid})`);
      }

      if (typeof this.options.onAction === 'function') {
        this.options.onAction(act, currentEvent);
      }

      switch (actId) {
        case '11': {
          // Set <variable> to <any>
          // ["Set", {"value":"1","t":"string","l":"variable"}, "to", {"value":"0","t":"string","l":"any"}]
          const varSlot = act.text?.find(item => item && typeof item === 'object' && item.l === 'variable');
          const valSlot = act.text?.find(item => item && typeof item === 'object' && (item.l === 'any' || item.t === 'any'));

          if (varSlot && valSlot) {
            const varName = varSlot.value;
            const rawVal = valSlot.value;
            const resolvedStr = this.resolveTemplate(rawVal);

            // Store numeric value if string cleanly represents a number
            const numVal = Number(resolvedStr);
            const finalVal = (!isNaN(numVal) && resolvedStr.trim() !== '') ? numVal : resolvedStr;

            this.setVariable(varName, finalVal);
          }
          break;
        }

        case '12': {
          // Add <any> to <variable>
          // ["Add", {"value":"1","t":"string","l":"any"}, "to", {"value":"1","t":"string","l":"variable"}]
          const valSlot = act.text?.find(item => item && typeof item === 'object' && (item.l === 'any' || item.t === 'any'));
          const varSlot = act.text?.find(item => item && typeof item === 'object' && item.l === 'variable');

          if (varSlot && valSlot) {
            const deltaStr = this.resolveTemplate(valSlot.value);
            const delta = Number(deltaStr) || 0;
            const current = Number(this.getVariable(varSlot.value)) || 0;
            this.setVariable(varSlot.value, current + delta);
          }
          break;
        }

        case '31': {
          // Set <property> of <object> to <any>
          // ["Set", {"value":"Text","t":"string","l":"property"}, "of", {"value":"cnt","t":"object"}, "to", {"value":"Count: {1}","t":"any"}]
          const propSlot = act.text?.find(item => item && typeof item === 'object' && item.l === 'property');
          const objSlot = act.text?.find(item => item && typeof item === 'object' && item.t === 'object');
          const valSlot = act.text?.find(item => item && typeof item === 'object' && (item.l === 'any' || item.t === 'any'));

          if (propSlot && objSlot && valSlot) {
            const propName = propSlot.value;
            const targetGid = objSlot.value;
            const resolvedVal = this.resolveTemplate(valSlot.value);

            this._applyPropertyToElement(targetGid, propName, resolvedVal);
          }
          break;
        }

        case '18': {
          // If <any> <comparison> <any>
          // ["If", {"value":"{1}","t":"string","l":"any"}, "is equal to", {"value":"10","t":"string","l":"any"}]
          const operands = (act.text || []).filter(item => item && typeof item === 'object' && (item.l === 'any' || item.t === 'any'));
          const op1Val = operands[0] ? this.resolveTemplate(operands[0].value) : '';
          const op2Val = operands[1] ? this.resolveTemplate(operands[1].value) : '';

          // Determine comparison operator string
          const compStr = act.text?.find(item => typeof item === 'string' && item.trim() !== 'If')?.trim().toLowerCase() || 'is equal to';

          const conditionMet = this._evaluateComparison(op1Val, op2Val, compStr);

          if (!conditionMet) {
            // Skip forward to matching Action 25 ('end')
            let depth = 1;
            while (i + 1 < actions.length && depth > 0) {
              i++;
              const nextActId = String(actions[i]?.id);
              if (nextActId === '18' || nextActId === '22' || nextActId === '23') {
                depth++;
              } else if (nextActId === '25') {
                depth--;
              }
            }
          }
          break;
        }

        case '25': {
          // End of control block: no-op in straight execution
          break;
        }

        case '3': {
          // Wait <number> seconds
          // ["Wait", {"value":"1","t":"number"}, "seconds"]
          const secSlot = act.text?.find(item => item && typeof item === 'object' && (item.t === 'number' || item.l === 'any'));
          const seconds = secSlot ? (parseFloat(this.resolveTemplate(secSlot.value)) || 0) : 0;

          if (seconds > 0) {
            await new Promise(resolve => {
              const tid = setTimeout(() => {
                this.activeTimeouts.delete(tid);
                resolve();
              }, seconds * 1000);
              this.activeTimeouts.add(tid);
            });
          }
          break;
        }

        case '5': {
          // Play audio <id>
          // ["Play audio", {"value":"88442833509532","t":"string","l":"id","assetbrowser":"audio"}, "→", ...]
          const idSlot = act.text?.find(item => item && typeof item === 'object' && (item.l === 'id' || item.assetbrowser === 'audio'));
          const assetId = idSlot ? this.resolveTemplate(idSlot.value) : '';

          if (assetId) {
            this.lastAudioPlayed = assetId;
            if (this.options.audioEnabled) {
              playSyntheticAudio(assetId);
            }
            if (typeof this.options.onAudio === 'function') {
              this.options.onAudio(assetId);
            }
          }
          break;
        }

        case '88': {
          // Tween <property> of <object> to <any> in <time> seconds
          // ["Tween", {"value":"Position","l":"property"}, "of", {"value":"obj","t":"object"}, "to", {"value":"..."}, "in", {"value":"0.5","t":"number"}, "seconds"]
          const propSlot = act.text?.find(item => item && typeof item === 'object' && item.l === 'property');
          const objSlot = act.text?.find(item => item && typeof item === 'object' && item.t === 'object');
          const valSlot = act.text?.find(item => item && typeof item === 'object' && (item.l === 'any' || item.t === 'any'));
          const timeSlot = act.text?.find(item => item && typeof item === 'object' && item.t === 'number');

          if (propSlot && objSlot && valSlot) {
            const propName = propSlot.value;
            const targetGid = objSlot.value;
            const resolvedVal = this.resolveTemplate(valSlot.value);
            const duration = timeSlot ? (parseFloat(this.resolveTemplate(timeSlot.value)) || 0.3) : 0.3;

            // Apply transition on DOM element
            const domEl = this.domRoot?.querySelector ? this.domRoot.querySelector(`[data-globalid="${targetGid}"]`) : null;
            if (domEl && domEl.style) {
              domEl.style.transition = `all ${duration}s ease`;
            }

            this._applyPropertyToElement(targetGid, propName, resolvedVal);
          }
          break;
        }

        default:
          if (this.options.logActions) {
            console.warn(`[CatWebRuntime] Unhandled action id: ${actId}`);
          }
          break;
      }

      i++;
    }
  }

  /**
   * Evaluates comparison between two operands based on comparison string.
   * @private
   */
  _evaluateComparison(op1, op2, compStr) {
    const num1 = Number(op1);
    const num2 = Number(op2);
    const isBothNumeric = !isNaN(num1) && !isNaN(num2) && String(op1).trim() !== '' && String(op2).trim() !== '';

    switch (compStr) {
      case 'is equal to':
      case '==':
      case '=':
        return isBothNumeric ? num1 === num2 : String(op1) === String(op2);

      case 'is not equal to':
      case '!=':
      case '~=':
        return isBothNumeric ? num1 !== num2 : String(op1) !== String(op2);

      case 'is greater than':
      case '>':
        return isBothNumeric ? num1 > num2 : String(op1) > String(op2);

      case 'is less than':
      case '<':
        return isBothNumeric ? num1 < num2 : String(op1) < String(op2);

      case 'is greater than or equal to':
      case '>=':
        return isBothNumeric ? num1 >= num2 : String(op1) >= String(op2);

      case 'is less than or equal to':
      case '<=':
        return isBothNumeric ? num1 <= num2 : String(op1) <= String(op2);

      default:
        return String(op1) === String(op2);
    }
  }

  /**
   * Applies property change to target element in both JSON tree and DOM.
   * @private
   */
  _applyPropertyToElement(targetGid, propName, resolvedVal) {
    const targetNode = this.elementsByGlobalId.get(targetGid);
    const domEl = this.domRoot?.querySelector ? this.domRoot.querySelector(`[data-globalid="${targetGid}"]`) : null;

    const normalizedProp = propName.replace(/\s+/g, '').toLowerCase();

    // 1. Text / Content Text
    if (normalizedProp === 'text' || normalizedProp === 'contenttext') {
      if (targetNode) targetNode.text = resolvedVal;
      if (domEl) {
        if (domEl.tagName === 'INPUT' || domEl.tagName === 'TEXTAREA') {
          domEl.value = resolvedVal;
        } else {
          domEl.textContent = resolvedVal;
        }
      }
    }
    // 2. Text Color / TextColor3
    else if (normalizedProp === 'textcolor' || normalizedProp === 'textcolor3') {
      if (targetNode) targetNode.font_color = resolvedVal;
      if (domEl && domEl.style) domEl.style.color = resolvedVal;
    }
    // 3. Background Color / BackgroundColor3
    else if (normalizedProp === 'backgroundcolor' || normalizedProp === 'backgroundcolor3') {
      if (targetNode) targetNode.background_color = resolvedVal;
      if (domEl && domEl.style) domEl.style.backgroundColor = resolvedVal;
    }
    // 4. Visible
    else if (normalizedProp === 'visible') {
      const isVisible = resolvedVal !== 'false' && resolvedVal !== false;
      if (targetNode) targetNode.visible = isVisible ? 'true' : 'false';
      if (domEl && domEl.style) {
        domEl.style.display = isVisible ? '' : 'none';
      }
    }
    // 5. Position
    else if (normalizedProp === 'position') {
      if (targetNode) targetNode.position = resolvedVal;
      if (domEl && domEl.style) {
        try {
          const css = udim2ToCss(resolvedVal);
          domEl.style.left = css.left;
          domEl.style.top = css.top;
        } catch {
          // Ignore invalid coordinate
        }
      }
    }
    // 6. Size
    else if (normalizedProp === 'size') {
      if (targetNode) targetNode.size = resolvedVal;
      if (domEl && domEl.style) {
        try {
          const css = udim2ToCss(resolvedVal);
          domEl.style.width = css.width;
          domEl.style.height = css.height;
        } catch {
          // Ignore invalid coordinate
        }
      }
    }
    // 7. Background Transparency
    else if (normalizedProp === 'backgroundtransparency' || normalizedProp === 'transparency') {
      if (targetNode) targetNode.background_transparency = resolvedVal;
      if (domEl && domEl.style) {
        const trans = parseFloat(resolvedVal) || 0;
        domEl.style.opacity = String(Math.max(0, Math.min(1, 1 - trans)));
      }
    }
    // 8. Order / LayoutOrder
    else if (normalizedProp === 'order' || normalizedProp === 'layoutorder') {
      if (targetNode) targetNode.order = String(resolvedVal);
      if (domEl && domEl.style) domEl.style.order = String(resolvedVal);
    }

    if (typeof this.options.onPropertyChange === 'function') {
      this.options.onPropertyChange(targetGid, propName, resolvedVal);
    }
  }
}
