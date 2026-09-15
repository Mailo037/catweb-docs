/**
 * CatWeb Visual Script Block Renderer
 *
 * Translates CatWeb JSONScript structures (events, conditions, actions, loops,
 * variables, and control flow) into interactive, authentic Scratch/CatWeb-style
 * visual blocks with category colors, C-block indentation, and token chips.
 *
 * Compatible with modern browsers and Node.js (via Mock DOM).
 * Zero external dependencies.
 */

export const BLOCK_CATEGORIES = {
  EVENT: {
    name: 'Event',
    bg: '#d97706',
    border: '#b45309',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
  },
  VARIABLE: {
    name: 'Variables',
    bg: '#ea580c',
    border: '#c2410c',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M9 9l6 6M15 9l-6 6"></path></svg>'
  },
  LOOKS: {
    name: 'Looks',
    bg: '#7c3aed',
    border: '#6d28d9',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
  },
  LOGIC: {
    name: 'Logic',
    bg: '#ca8a04',
    border: '#a16207',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>'
  },
  LOOP: {
    name: 'Loops',
    bg: '#0891b2',
    border: '#0e7490',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>'
  },
  AUDIO: {
    name: 'Audio',
    bg: '#db2777',
    border: '#be185d',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>'
  },
  STRING: {
    name: 'Strings',
    bg: '#059669',
    border: '#047857',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>'
  },
  FUNCTION: {
    name: 'Functions',
    bg: '#2563eb',
    border: '#1d4ed8',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 4l-4 8h-4l-4 8"></path></svg>'
  },
  CONTROL: {
    name: 'Control',
    bg: '#475569',
    border: '#334155',
    text: '#ffffff',
    icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>'
  }
};

/**
 * Maps an action ID to its block category.
 *
 * @param {string|number} actionId
 * @returns {object} Block category descriptor
 */
export function getActionCategory(actionId) {
  const idStr = String(actionId);
  switch (idStr) {
    case '11': // Set Variable
    case '12': // Add to Variable
      return BLOCK_CATEGORIES.VARIABLE;

    case '31': // Set Property
    case '39': // Get Property
    case '88': // Tween Property
      return BLOCK_CATEGORIES.LOOKS;

    case '3':  // Wait
    case '18': // If equal
    case '19': // If not equal
    case '20': // If greater than
    case '21': // If less than
    case '125': // If >=
    case '126': // If <=
      return BLOCK_CATEGORIES.LOGIC;

    case '22': // Repeat N times
    case '23': // Repeat forever
    case '24': // Break
      return BLOCK_CATEGORIES.LOOP;

    case '25': // end
      return BLOCK_CATEGORIES.CONTROL;

    case '5':  // Play audio
    case '26': // Play looped audio
      return BLOCK_CATEGORIES.AUDIO;

    case '48': // String length
      return BLOCK_CATEGORIES.STRING;

    case '6':  // Define function
    case '87': // Run function
      return BLOCK_CATEGORIES.FUNCTION;

    default:
      return BLOCK_CATEGORIES.CONTROL;
  }
}

/**
 * Checks if an action opens a C-block indentation scope.
 *
 * @param {string|number} actionId
 * @returns {boolean}
 */
export function isScopeOpener(actionId) {
  const idStr = String(actionId);
  return ['18', '19', '20', '21', '125', '126', '22', '23'].includes(idStr);
}

/**
 * Checks if an action closes a C-block indentation scope.
 *
 * @param {string|number} actionId
 * @returns {boolean}
 */
export function isScopeCloser(actionId) {
  return String(actionId) === '25';
}

/**
 * Renders an array of tokens (strings and slot objects) as HTML elements.
 *
 * @param {Array<string|object>} tokens
 * @param {object} [options={}]
 * @param {Map} [options.elementAliases] - Map of globalid -> alias for pretty chip display
 * @returns {string} HTML string of token chips
 */
export function renderTokensHtml(tokens, options = {}) {
  if (!Array.isArray(tokens)) return '';
  const aliases = options.elementAliases || new Map();

  return tokens.map(item => {
    if (!item) return '';

    // Plain text token keyword
    if (typeof item === 'string') {
      return `<span class="cw-token-text">${escapeHtml(item)}</span>`;
    }

    // Token slot object
    if (typeof item === 'object') {
      const val = item.value ?? '';
      const slotType = item.t || 'string';
      const slotLabel = item.l || '';

      // Target Object Slot
      if (slotType === 'object' || slotLabel === 'button' || slotLabel === 'object' || slotLabel === 'input') {
        const alias = aliases.get(val);
        const displayLabel = alias ? `#${alias}` : val;
        return `
          <span class="cw-chip cw-chip-object" data-target-gid="${escapeHtml(val)}" title="Target Object [${escapeHtml(val)}]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>
            <span>${escapeHtml(displayLabel)}</span>
          </span>
        `;
      }

      // Variable Slot (e.g. {1})
      if (slotLabel === 'variable' || /^{\d+}$/.test(String(val))) {
        const varName = String(val).replace(/[{}]/g, '');
        return `
          <span class="cw-chip cw-chip-variable" title="Variable {${escapeHtml(varName)}}">
            <span class="cw-var-prefix">{</span>
            <span class="cw-var-num">${escapeHtml(varName)}</span>
            <span class="cw-var-suffix">}</span>
          </span>
        `;
      }

      // Property Name Slot (e.g. Text, Background Color)
      if (slotLabel === 'property') {
        return `
          <span class="cw-chip cw-chip-property" title="Property">
            <span>${escapeHtml(val)}</span>
          </span>
        `;
      }

      // Audio Asset Slot
      if (item.assetbrowser === 'audio' || slotLabel === 'id') {
        return `
          <span class="cw-chip cw-chip-audio" title="Audio Asset ID ${escapeHtml(val)}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>${escapeHtml(val)}</span>
            ${val ? `
              <button type="button" class="cw-btn-audio-preview" data-audio-id="${escapeHtml(val)}" title="Preview sound">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
            ` : ''}
          </span>
        `;
      }

      // Literal Number Slot
      if (slotType === 'number' || slotLabel === 'time') {
        return `
          <span class="cw-chip cw-chip-number">
            <span>${escapeHtml(val)}</span>
          </span>
        `;
      }

      // General Expression / Any Slot
      return `
        <span class="cw-chip cw-chip-any">
          <span>${escapeHtml(val)}</span>
        </span>
      `;
    }

    return '';
  }).join(' ');
}

/**
 * Renders complete visual block structure for a CatWeb script element.
 *
 * Reconstructs nested C-block indentation from flat CatWeb control flow actions
 * (`If`/`Repeat` ... `end`).
 *
 * @param {object} scriptNode - Script element node with `content` array
 * @param {object} [options={}]
 * @param {Function} [options.onTriggerEvent] - Callback (scriptNode, eventNode) => void
 * @param {Function} [options.onHighlightObject] - Callback (gid) => void
 * @param {Function} [options.onPlayAudio] - Callback (assetId) => void
 * @param {Map} [options.elementAliases] - Map of globalid -> alias
 * @returns {HTMLElement} Container DOM element with rendered visual blocks
 */
export function renderScriptBlocks(scriptNode, options = {}) {
  const doc = options.document ||
    (typeof document !== 'undefined' ? document : null) ||
    (typeof globalThis !== 'undefined' ? globalThis.document : null);

  const container = doc && typeof doc.createElement === 'function'
    ? doc.createElement('div')
    : {
        className: 'cw-script-canvas',
        classList: { contains: (c) => c === 'cw-script-canvas', value: 'cw-script-canvas' },
        children: [],
        style: {},
        innerHTML: '',
        appendChild: function(c) { this.children.push(c); return c; },
        getAttribute: () => null,
        hasAttribute: () => false,
        querySelector: () => null,
        querySelectorAll: () => []
      };
  container.className = 'cw-script-canvas';

  const events = scriptNode?.content || [];

  if (events.length === 0) {
    container.innerHTML = `
      <div class="cw-script-empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <span>No events or actions defined in this script.</span>
      </div>
    `;
    return container;
  }

  // Render each event stack
  events.forEach((evt, evtIdx) => {
    const eventCard = doc && typeof doc.createElement === 'function'
      ? doc.createElement('div')
      : {
          className: 'cw-event-stack',
          classList: { contains: (c) => c === 'cw-event-stack', value: 'cw-event-stack' },
          children: [],
          innerHTML: ''
        };
    eventCard.className = 'cw-event-stack';

    // 1. Hat Event Block
    const hatCategory = BLOCK_CATEGORIES.EVENT;
    const hatTokensHtml = renderTokensHtml(evt.text || ['When event...'], options);
    const eventGid = evt.globalid || `evt_${evtIdx}`;

    const hatHtml = `
      <div class="cw-block cw-block-event" data-event-gid="${escapeHtml(eventGid)}" style="--cw-block-bg: ${hatCategory.bg}; --cw-block-border: ${hatCategory.border};">
        <div class="cw-hat-notch"></div>
        <div class="cw-block-content">
          <span class="cw-block-icon">${hatCategory.icon}</span>
          <div class="cw-block-tokens">${hatTokensHtml}</div>
          <button type="button" class="cw-btn-run-event" data-run-evt="${escapeHtml(eventGid)}" title="Run / Test this event">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Run</span>
          </button>
        </div>
      </div>
    `;

    // 2. Action Stack (with C-block nested indentation)
    const rawActions = evt.actions || [];
    let actionsHtml = '';
    let currentIndent = 0;

    rawActions.forEach((act, actIdx) => {
      const actId = String(act.id);
      const cat = getActionCategory(actId);
      const actGid = act.globalid || `act_${actIdx}`;
      const isCloser = isScopeCloser(actId);
      const isOpener = isScopeOpener(actId);

      if (isCloser && currentIndent > 0) {
        currentIndent--;
      }

      const tokensHtml = renderTokensHtml(act.text || [], options);

      // Block markup
      actionsHtml += `
        <div class="cw-action-row ${isCloser ? 'cw-action-end' : ''}" style="margin-left: ${currentIndent * 18}px;">
          <div class="cw-block cw-block-action" data-action-gid="${escapeHtml(actGid)}" style="--cw-block-bg: ${cat.bg}; --cw-block-border: ${cat.border};">
            <div class="cw-block-content">
              <span class="cw-block-icon">${cat.icon}</span>
              <div class="cw-block-tokens">${tokensHtml}</div>
              <span class="cw-block-id-tag">${escapeHtml(actGid)}</span>
            </div>
          </div>
        </div>
      `;

      if (isOpener) {
        currentIndent++;
      }
    });

    const fullEventHtml = `
      ${hatHtml}
      <div class="cw-actions-stack">
        ${actionsHtml || '<div class="cw-action-empty-hint">No actions attached to this event</div>'}
      </div>
    `;

    if (doc) {
      eventCard.innerHTML = fullEventHtml;
      container.appendChild(eventCard);
    } else {
      container.innerHTML += `<div class="cw-event-stack">${fullEventHtml}</div>`;
    }
  });

  // Attach interactive listeners
  if (doc && container.querySelectorAll) {
    // Run Event Button
    const runBtns = container.querySelectorAll('.cw-btn-run-event');
    runBtns.forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const evtGid = btn.getAttribute('data-run-evt');
        const foundEvt = events.find(e => e.globalid === evtGid || `evt_${events.indexOf(e)}` === evtGid);
        if (typeof options.onTriggerEvent === 'function' && foundEvt) {
          options.onTriggerEvent(scriptNode, foundEvt);
        }
      });
    });

    // Target Object Chip Click -> Highlight in canvas
    const objChips = container.querySelectorAll('.cw-chip-object');
    objChips.forEach(chip => {
      chip.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const targetGid = chip.getAttribute('data-target-gid');
        if (typeof options.onHighlightObject === 'function' && targetGid) {
          options.onHighlightObject(targetGid);
        }
      });
    });

    // Audio Preview Button
    const audioBtns = container.querySelectorAll('.cw-btn-audio-preview');
    audioBtns.forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const assetId = btn.getAttribute('data-audio-id');
        if (typeof options.onPlayAudio === 'function' && assetId) {
          options.onPlayAudio(assetId);
        }
      });
    });
  }

  return container;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
