/**
 * CatWeb Script Workspace — a full-screen block editor.
 *
 * Mirrors the in-game script editor: every event stack sits at its own `x`/`y` on the
 * 9992×9992 canvas (centre 5000,5000). You can pan and zoom, drag a stack by its hat
 * block (writes `x`/`y` back to the JSON), edit any slot value inline, and add, move or
 * delete blocks. Every edit goes through `onChange(document)` so the JSON editor,
 * validator and live preview stay in sync.
 *
 * Browser-only (needs a real DOM); the app only creates it when the container exists.
 */

import {
  CATEGORIES, EVENT_TEMPLATES, ACTION_TEMPLATES, OPENER_IDS,
  actionCategory, eventCategory, cloneText, templateLabel
} from './block_library.js';

const CANVAS_SIZE = 9992;
const CANVAS_CENTER = 5000;
const INDENT_PX = 16;
const MIN_SCALE = 0.15;
const MAX_SCALE = 2;
const GID_CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const ICONS = {
  grip: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  play: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  plus: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  up: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  trash: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  fit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  minus: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  restart: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  close: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  script: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
};

export class ScriptWorkspace {
  /**
   * @param {HTMLElement} container - Empty element that becomes the workspace
   * @param {object} options
   * @param {(doc: object|Array) => void} options.onChange - Called after every edit
   * @param {(script: object, event: object) => void} [options.onRunEvent]
   * @param {(gid: string) => void} [options.onSelectObject]
   * @param {() => void} [options.onRestart]
   * @param {() => void} [options.onClose]
   * @param {string[]} [options.properties] - Script property names for autocomplete
   */
  constructor(container, options = {}) {
    this.root = container;
    this.options = options;
    this.doc = null;
    this.scripts = [];
    this.activeScriptGid = null;
    this.view = { x: 0, y: 0, scale: 0.8 };
    this._fittedFor = null;
    this._flashTimers = new Map();
    this._errors = new Map();
    this._invalid = new Set();
    this._palette = null;

    this._build();
  }

  /* ---------------- public API ---------------- */

  isOpen() {
    return !this.root.classList.contains('hidden');
  }

  open() {
    this.root.classList.remove('hidden');
    this.render();
    if (this._fittedFor !== this.activeScriptGid) this.fit();
  }

  close() {
    this._closePalette();
    this.root.classList.add('hidden');
    this.options.onClose?.();
  }

  /**
   * Shows a (new) document. Keeps the open script tab and the camera when possible.
   * @param {object|Array} doc
   */
  setDocument(doc) {
    this.doc = doc;
    this.scripts = collectScripts(doc);
    if (!this.scripts.some((s) => s.globalid === this.activeScriptGid)) {
      this.activeScriptGid = this.scripts[0]?.globalid ?? null;
      this._fittedFor = null;
    }
    this._errors.clear();
    if (this.isOpen()) {
      this.render();
      if (this._fittedFor !== this.activeScriptGid) this.fit();
    } else {
      this._renderTabs();
    }
  }

  /** Marks blocks named in validator errors (by globalid). */
  setDiagnostics(errors = []) {
    this._invalid = new Set(errors.map((e) => e.globalid).filter(Boolean));
    if (this.isOpen()) this._applyMarkers();
  }

  /** Briefly highlights a block while the runtime executes it. */
  flash(gid) {
    if (!gid || !this.isOpen()) return;
    const el = this.world.querySelector(`[data-gid="${cssEscape(gid)}"]`);
    if (!el) return;
    el.classList.add('is-running');
    clearTimeout(this._flashTimers.get(gid));
    this._flashTimers.set(gid, setTimeout(() => el.classList.remove('is-running'), 350));
  }

  /** Attaches a runtime error to a block and shows it on the canvas. */
  markError(gid, message) {
    if (!gid) return;
    this._errors.set(gid, message);
    if (this.isOpen()) this._applyMarkers();
  }

  /**
   * Opens the workspace on the script that contains this event/action and centres it.
   * @param {string} gid
   */
  reveal(gid) {
    for (const sc of this.scripts) {
      const hit = (sc.content || []).some((evt) => evt?.globalid === gid || (evt?.actions || []).some((a) => a?.globalid === gid));
      if (hit) {
        this.activeScriptGid = sc.globalid;
        this._fittedFor = sc.globalid;
        break;
      }
    }
    this.open();
    const el = this.world.querySelector(`[data-gid="${cssEscape(gid)}"]`);
    if (!el) return;
    const vr = this.viewport.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    this.view.x += vr.left + vr.width / 2 - (er.left + er.width / 2);
    this.view.y += vr.top + vr.height / 3 - (er.top + er.height / 2);
    this._applyView();
    el.classList.add('is-revealed');
    setTimeout(() => el.classList.remove('is-revealed'), 1600);
  }

  /** Zooms and pans so every stack of the open script is visible. */
  fit() {
    this._fittedFor = this.activeScriptGid;
    const stacks = [...this.world.querySelectorAll('.cw-ws-stack')];
    const vw = this.viewport.clientWidth || 1000;
    const vh = this.viewport.clientHeight || 600;
    if (!stacks.length) {
      this.view = { scale: 0.8, x: vw / 2 - CANVAS_CENTER * 0.8, y: vh / 2 - CANVAS_CENTER * 0.8 };
      this._applyView();
      return;
    }
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const s of stacks) {
      const x = parseFloat(s.style.left); const y = parseFloat(s.style.top);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + s.offsetWidth); maxY = Math.max(maxY, y + s.offsetHeight);
    }
    const pad = 48;
    const scale = clamp(Math.min((vw - pad * 2) / (maxX - minX || 1), (vh - pad * 2) / (maxY - minY || 1), 1), MIN_SCALE, MAX_SCALE);
    this.view = {
      scale,
      x: (vw - (maxX - minX) * scale) / 2 - minX * scale,
      y: Math.max(pad, (vh - (maxY - minY) * scale) / 2) - minY * scale
    };
    this._applyView();
  }

  /* ---------------- building ---------------- */

  /** @private */
  _build() {
    this.root.classList.add('cw-ws');
    this.root.innerHTML = `
      <div class="cw-ws-bar">
        <div class="cw-ws-tabs" role="tablist" aria-label="Scripts"></div>
        <button type="button" class="cw-ws-btn" data-ws="add-event" title="Add an event block">${ICONS.plus}<span>Event</span></button>
        <div class="cw-ws-spacer"></div>
        <div class="cw-ws-zoom">
          <button type="button" class="cw-ws-icon-btn" data-ws="zoom-out" title="Zoom out (−)">${ICONS.minus}</button>
          <button type="button" class="cw-ws-zoom-label" data-ws="zoom-reset" title="Reset to 100%">100%</button>
          <button type="button" class="cw-ws-icon-btn" data-ws="zoom-in" title="Zoom in (+)">${ICONS.plus}</button>
          <button type="button" class="cw-ws-icon-btn" data-ws="fit" title="Show all blocks (0)">${ICONS.fit}</button>
        </div>
        <button type="button" class="cw-ws-btn" data-ws="restart" title="Reload the page and run all scripts again (R)">${ICONS.restart}<span>Restart page</span></button>
        <button type="button" class="cw-ws-icon-btn" data-ws="close" title="Back to preview (Esc)">${ICONS.close}</button>
      </div>
      <div class="cw-ws-viewport" tabindex="0" aria-label="Script canvas">
        <div class="cw-ws-world"></div>
        <div class="cw-ws-empty hidden"></div>
        <div class="cw-ws-hint">Drag the background to pan · Ctrl + wheel to zoom · drag a hat block to move it · click any value to edit</div>
      </div>
      <datalist id="cwWsObjects"></datalist>
      <datalist id="cwWsProps"></datalist>
    `;
    this.tabs = this.root.querySelector('.cw-ws-tabs');
    this.viewport = this.root.querySelector('.cw-ws-viewport');
    this.world = this.root.querySelector('.cw-ws-world');
    this.empty = this.root.querySelector('.cw-ws-empty');
    this.zoomLabel = this.root.querySelector('.cw-ws-zoom-label');
    this.objectList = this.root.querySelector('#cwWsObjects');
    this.propList = this.root.querySelector('#cwWsProps');
    this.propList.innerHTML = (this.options.properties || []).map((p) => `<option value="${escapeHtml(p)}"></option>`).join('');

    this.root.querySelector('.cw-ws-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-ws]');
      if (!btn) return;
      const action = btn.getAttribute('data-ws');
      if (action === 'close') this.close();
      else if (action === 'fit') this.fit();
      else if (action === 'zoom-in') this._zoomBy(1.2);
      else if (action === 'zoom-out') this._zoomBy(1 / 1.2);
      else if (action === 'zoom-reset') this._zoomTo(1);
      else if (action === 'restart') this.options.onRestart?.();
      else if (action === 'add-event') this._openPalette(btn, 'event');
    });

    this.tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-script]');
      if (tab) {
        this.activeScriptGid = tab.getAttribute('data-script');
        this.render();
        this.fit();
      } else if (e.target.closest('[data-ws-add-script]')) {
        this._addScript();
      }
    });

    this._bindCanvas();
  }

  /** @private Pan, zoom, stack dragging and inline editing. */
  _bindCanvas() {
    const vp = this.viewport;

    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = vp.getBoundingClientRect();
        this._zoomBy(Math.exp(-e.deltaY * 0.0025), e.clientX - rect.left, e.clientY - rect.top);
      } else {
        this.view.x -= e.shiftKey ? e.deltaY : e.deltaX;
        this.view.y -= e.shiftKey ? 0 : e.deltaY;
        this._applyView();
      }
    }, { passive: false });

    vp.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      const interactive = e.target.closest('input, button, select, .cw-ws-palette');
      if (interactive) return;
      const hat = e.target.closest('.cw-ws-hat');
      this._closePalette();
      if (hat && e.button === 0) this._startStackDrag(e, hat.closest('.cw-ws-stack'));
      else if (!e.target.closest('.cw-ws-block')) this._startPan(e);
    });

    vp.addEventListener('keydown', (e) => {
      if (e.target.closest('input')) return;
      if (e.key === '+' || e.key === '=') this._zoomBy(1.2);
      else if (e.key === '-') this._zoomBy(1 / 1.2);
      else if (e.key === '0') this.fit();
      else return;
      e.preventDefault();
      e.stopPropagation();
    });

    // Inline slot editing
    this.world.addEventListener('input', (e) => {
      const input = e.target.closest('.cw-ws-input');
      if (input) fitInput(input);
    });
    this.world.addEventListener('change', (e) => {
      const input = e.target.closest('.cw-ws-input');
      if (input) this._commitSlot(input);
    });
    this.world.addEventListener('keydown', (e) => {
      const input = e.target.closest('.cw-ws-input');
      if (!input) return;
      e.stopPropagation(); // keep app shortcuts out of the inputs
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') {
        input.value = input.getAttribute('data-original') ?? input.value;
        input.blur();
      }
    });

    this.world.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      e.stopPropagation();
      const kind = btn.getAttribute('data-act');
      const stackEl = btn.closest('.cw-ws-stack');
      const evt = this._eventAt(stackEl);
      const row = btn.closest('.cw-ws-block');
      const index = row ? Number(row.getAttribute('data-index')) : -1;

      if (kind === 'run') this.options.onRunEvent?.(this._activeScript(), evt);
      else if (kind === 'add') this._openPalette(btn, 'action', { evt, index: row ? index + 1 : (evt.actions || []).length });
      else if (kind === 'up') this._moveAction(evt, index, -1);
      else if (kind === 'down') this._moveAction(evt, index, 1);
      else if (kind === 'delete') this._deleteAction(evt, index);
      else if (kind === 'delete-event') this._deleteEvent(evt);
      else if (kind === 'object') this.options.onSelectObject?.(btn.getAttribute('data-gid'));
    });
  }

  /* ---------------- rendering ---------------- */

  render() {
    this._renderTabs();
    this._renderObjectList();
    this._aliases = new Map();
    walk(this.doc, (node) => { if (node.globalid && node.alias) this._aliases.set(String(node.globalid), node.alias); });
    const script = this._activeScript();
    this.world.innerHTML = '';

    if (!script) {
      this.empty.classList.remove('hidden');
      this.empty.innerHTML = `
        <div class="cw-ws-empty-title">This page has no scripts yet</div>
        <div class="cw-ws-empty-sub">Scripts are elements with <code>"class": "script"</code>. Add one to start placing blocks.</div>
        <button type="button" class="cw-ws-btn primary" data-ws-add-script>${ICONS.plus}<span>Add script</span></button>`;
      this.empty.querySelector('[data-ws-add-script]').addEventListener('click', () => this._addScript());
      return;
    }
    this.empty.classList.add('hidden');

    const content = Array.isArray(script.content) ? script.content : [];
    if (!content.length) {
      this.empty.classList.remove('hidden');
      this.empty.innerHTML = `
        <div class="cw-ws-empty-title">No blocks in “${escapeHtml(script.alias || script.globalid)}”</div>
        <div class="cw-ws-empty-sub">Start with an event — for example “When website loaded”.</div>`;
    }

    content.forEach((evt, i) => {
      if (!evt || typeof evt !== 'object') return;
      this.world.appendChild(this._renderStack(evt, i));
    });
    for (const input of this.world.querySelectorAll('.cw-ws-input')) fitInput(input);
    this._applyMarkers();
    this._applyView();
  }

  /** @private */
  _renderTabs() {
    this.tabs.innerHTML = this.scripts.map((sc) => {
      const events = (sc.content || []).length;
      const active = sc.globalid === this.activeScriptGid;
      const off = sc.enabled === 'false' ? ' <span class="cw-ws-tab-off">off</span>' : '';
      return `<button type="button" role="tab" aria-selected="${active}" class="cw-ws-tab${active ? ' active' : ''}" data-script="${escapeHtml(sc.globalid)}">
        ${ICONS.script}<span>${escapeHtml(sc.alias || sc.globalid)}</span><span class="cw-ws-tab-count">${events}</span>${off}</button>`;
    }).join('') + `<button type="button" class="cw-ws-tab add" data-ws-add-script title="Add a script element">${ICONS.plus}</button>`;
  }

  /** @private */
  _renderObjectList() {
    const opts = [];
    walk(this.doc, (node) => {
      if (node.globalid && node.class && node.class !== 'script') {
        opts.push(`<option value="${escapeHtml(node.globalid)}">${escapeHtml(node.alias ? `${node.alias} · ${node.class}` : node.class)}</option>`);
      }
    });
    opts.push('<option value="(parent)">parent of this script</option>');
    this.objectList.innerHTML = opts.join('');
  }

  /** @private */
  _renderStack(evt, index) {
    const fallback = fallbackPosition(index);
    const x = finiteOr(evt.x, fallback.x);
    const y = finiteOr(evt.y, fallback.y);
    const width = clamp(finiteOr(evt.width, 350), 220, 900);
    const cat = eventCategory(evt.id);

    const stack = document.createElement('div');
    stack.className = 'cw-ws-stack';
    stack.setAttribute('data-index', String(index));
    stack.style.left = `${x}px`;
    stack.style.top = `${y}px`;
    stack.style.width = `${width}px`;

    const isFunction = String(evt.id) === '6';
    stack.innerHTML = `
      <div class="cw-ws-hat${isFunction ? ' is-function' : ''}" data-gid="${escapeHtml(evt.globalid || '')}" style="--c:${cat.color}">
        <span class="cw-ws-grip" title="Drag to move">${ICONS.grip}</span>
        <div class="cw-ws-tokens">${this._tokensHtml(evt.text)}</div>
        <span class="cw-ws-coords">${Math.round(x)}, ${Math.round(y)}</span>
        ${isFunction ? '' : `<button type="button" class="cw-ws-run" data-act="run" title="Run this event now">${ICONS.play}<span>Run</span></button>`}
        <button type="button" class="cw-ws-tool" data-act="delete-event" title="Delete this event and its blocks">${ICONS.trash}</button>
      </div>
      <div class="cw-ws-body">${this._actionsHtml(evt.actions || [])}</div>
      <button type="button" class="cw-ws-add" data-act="add">${ICONS.plus}<span>Add block</span></button>
    `;
    return stack;
  }

  /** @private */
  _actionsHtml(actions) {
    const rails = []; // colours of the open C-blocks
    return actions.map((act, i) => {
      if (!act || typeof act !== 'object') return '';
      const id = String(act.id);
      const cat = actionCategory(id);
      if (id === '25' && rails.length) rails.pop();
      const depth = id === '112' && rails.length ? rails.length - 1 : rails.length;
      const guides = rails.slice(0, depth).map((c, k) => `<span class="cw-ws-rail" style="left:${k * INDENT_PX + 5}px;--c:${c}"></span>`).join('');
      const kind = id === '25' ? ' is-end' : id === '112' ? ' is-else' : OPENER_IDS.has(id) ? ' is-opener' : '';
      const html = `
        <div class="cw-ws-row" style="padding-left:${depth * INDENT_PX}px">
          ${guides}
          <div class="cw-ws-block${kind}" data-index="${i}" data-gid="${escapeHtml(act.globalid || '')}" style="--c:${cat.color}" title="${escapeHtml(cat.name)} · id ${escapeHtml(id)}">
            <div class="cw-ws-tokens">${this._tokensHtml(act.text)}</div>
            <span class="cw-ws-gid">${escapeHtml(act.globalid || '')}</span>
            <span class="cw-ws-tools">
              <button type="button" class="cw-ws-tool" data-act="add" title="Insert a block below">${ICONS.plus}</button>
              <button type="button" class="cw-ws-tool" data-act="up" title="Move up">${ICONS.up}</button>
              <button type="button" class="cw-ws-tool" data-act="down" title="Move down">${ICONS.down}</button>
              <button type="button" class="cw-ws-tool" data-act="delete" title="Delete block">${ICONS.trash}</button>
            </span>
          </div>
        </div>`;
      if (OPENER_IDS.has(id)) rails.push(cat.color);
      return html;
    }).join('') || '<div class="cw-ws-empty-body">No blocks yet</div>';
  }

  /** @private Renders a block's `text` with editable inputs for every slot. */
  _tokensHtml(text) {
    if (!Array.isArray(text)) return '';
    return text.map((tok, i) => {
      if (typeof tok === 'string') return `<span class="cw-ws-word">${escapeHtml(tok)}</span>`;
      if (!tok || typeof tok !== 'object') return '';
      if (tok.t === 'tuple') {
        const n = Array.isArray(tok.value) ? tok.value.length : 0;
        return `<span class="cw-ws-chip tuple" title="Tuple arguments (edit in the JSON editor)">( ${n ? `${n} arg${n === 1 ? '' : 's'}` : 'no args'} )</span>`;
      }
      const value = typeof tok.value === 'string' || typeof tok.value === 'number' ? String(tok.value) : JSON.stringify(tok.value ?? '');
      const kind = slotKind(tok);
      const list = kind === 'object' ? ' list="cwWsObjects"' : kind === 'property' ? ' list="cwWsProps"' : '';
      const role = tok.l || tok.t || 'value';
      const input = `<input class="cw-ws-input ${kind}" data-slot="${i}" value="${escapeHtml(value)}" data-original="${escapeHtml(value)}" placeholder="${escapeHtml(role)}" spellcheck="false" autocomplete="off" title="${escapeHtml(`<${role}>`)}"${list}>`;
      if (kind === 'variable') return `<span class="cw-ws-chip variable">{${input}}</span>`;
      if (kind === 'object') {
        const alias = this._aliases?.get(value);
        const aliasHtml = alias ? `<span class="cw-ws-alias">${escapeHtml(alias)}</span>` : '';
        return `<span class="cw-ws-chip object">${input}${aliasHtml}<button type="button" class="cw-ws-chip-go" data-act="object" data-gid="${escapeHtml(value)}" title="Select this element in the preview">↗</button></span>`;
      }
      return `<span class="cw-ws-chip ${kind}">${input}</span>`;
    }).join('');
  }

  /** @private */
  _applyMarkers() {
    for (const el of this.world.querySelectorAll('[data-gid]')) {
      const gid = el.getAttribute('data-gid');
      const err = this._errors.get(gid);
      el.classList.toggle('has-error', Boolean(err) || this._invalid.has(gid));
      if (err) el.setAttribute('data-error', err);
      else el.removeAttribute('data-error');
    }
  }

  /** @private */
  _applyView() {
    const { x, y, scale } = this.view;
    this.world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    this.viewport.style.backgroundPosition = `${x}px ${y}px`;
    this.viewport.style.backgroundSize = `${24 * scale}px ${24 * scale}px`;
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  /* ---------------- camera ---------------- */

  /** @private */
  _zoomTo(scale, cx = null, cy = null) {
    const next = clamp(scale, MIN_SCALE, MAX_SCALE);
    const px = cx ?? this.viewport.clientWidth / 2;
    const py = cy ?? this.viewport.clientHeight / 2;
    const wx = (px - this.view.x) / this.view.scale;
    const wy = (py - this.view.y) / this.view.scale;
    this.view = { scale: next, x: px - wx * next, y: py - wy * next };
    this._applyView();
  }

  /** @private */
  _zoomBy(factor, cx, cy) {
    this._zoomTo(this.view.scale * factor, cx, cy);
  }

  /** @private */
  _startPan(e) {
    const start = { x: e.clientX, y: e.clientY, vx: this.view.x, vy: this.view.y };
    this.viewport.classList.add('is-panning');
    const move = (ev) => {
      this.view.x = start.vx + ev.clientX - start.x;
      this.view.y = start.vy + ev.clientY - start.y;
      this._applyView();
    };
    const up = () => {
      this.viewport.classList.remove('is-panning');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /** @private Drags a stack; on drop writes the new x/y into the event JSON. */
  _startStackDrag(e, stack) {
    if (!stack) return;
    e.preventDefault();
    const evt = this._eventAt(stack);
    const coords = stack.querySelector('.cw-ws-coords');
    const startLeft = parseFloat(stack.style.left);
    const startTop = parseFloat(stack.style.top);
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    stack.classList.add('is-dragging');

    const move = (ev) => {
      const dx = (ev.clientX - start.x) / this.view.scale;
      const dy = (ev.clientY - start.y) / this.view.scale;
      if (!moved && Math.hypot(dx, dy) * this.view.scale < 3) return;
      moved = true;
      const nx = clamp(Math.round(startLeft + dx), 0, CANVAS_SIZE);
      const ny = clamp(Math.round(startTop + dy), 0, CANVAS_SIZE);
      stack.style.left = `${nx}px`;
      stack.style.top = `${ny}px`;
      if (coords) coords.textContent = `${nx}, ${ny}`;
    };
    const up = () => {
      stack.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!moved || !evt) return;
      evt.x = String(Math.round(parseFloat(stack.style.left)));
      evt.y = String(Math.round(parseFloat(stack.style.top)));
      if (evt.width === undefined) evt.width = '350';
      this._fittedFor = this.activeScriptGid;
      this._emit();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /* ---------------- editing ---------------- */

  /** @private */
  _activeScript() {
    return this.scripts.find((s) => s.globalid === this.activeScriptGid) || null;
  }

  /** @private */
  _eventAt(stackEl) {
    const script = this._activeScript();
    const idx = Number(stackEl?.getAttribute('data-index'));
    return script && Number.isInteger(idx) ? script.content[idx] : null;
  }

  /** @private */
  _commitSlot(input) {
    const stack = input.closest('.cw-ws-stack');
    const evt = this._eventAt(stack);
    if (!evt) return;
    const row = input.closest('.cw-ws-block');
    const owner = row ? evt.actions?.[Number(row.getAttribute('data-index'))] : evt;
    const slot = owner?.text?.[Number(input.getAttribute('data-slot'))];
    if (!slot || typeof slot !== 'object') return;
    if (String(slot.value) === input.value) return;
    slot.value = input.value;
    this._emit();
  }

  /** @private */
  _moveAction(evt, index, dir) {
    const list = evt?.actions;
    const to = index + dir;
    if (!Array.isArray(list) || to < 0 || to >= list.length) return;
    [list[index], list[to]] = [list[to], list[index]];
    this._emit();
  }

  /** @private Deleting an If/Repeat also removes its matching `end`, keeping the body. */
  _deleteAction(evt, index) {
    const list = evt?.actions;
    if (!Array.isArray(list) || !list[index]) return;
    const id = String(list[index].id);
    if (OPENER_IDS.has(id)) {
      let depth = 0;
      for (let j = index + 1; j < list.length; j++) {
        const jid = String(list[j]?.id);
        if (OPENER_IDS.has(jid)) depth++;
        else if (jid === '25') {
          if (depth === 0) { list.splice(j, 1); break; }
          depth--;
        }
      }
    }
    list.splice(index, 1);
    this._emit();
  }

  /** @private */
  _deleteEvent(evt) {
    const script = this._activeScript();
    if (!script || !evt) return;
    const n = (evt.actions || []).length;
    if (n > 0 && typeof confirm === 'function' && !confirm(`Delete this event and its ${n} block${n === 1 ? '' : 's'}?`)) return;
    script.content = script.content.filter((e) => e !== evt);
    this._emit();
  }

  /** @private */
  _insertAction(evt, index, template) {
    if (!evt) return;
    if (!Array.isArray(evt.actions)) evt.actions = [];
    const used = collectGlobalIds(this.doc);
    const blocks = [{ id: template.id, globalid: newGlobalId(used), text: cloneText(template) }];
    if (template.opens) blocks.push({ id: '25', globalid: newGlobalId(used), text: ['end'] });
    evt.actions.splice(clamp(index, 0, evt.actions.length), 0, ...blocks);
    this._emit();
  }

  /** @private New events land in the middle of what you're looking at. */
  _insertEvent(template) {
    const script = this._activeScript();
    if (!script) return;
    if (!Array.isArray(script.content)) script.content = [];
    const used = collectGlobalIds(this.doc);
    const cx = (this.viewport.clientWidth / 2 - this.view.x) / this.view.scale;
    const cy = (this.viewport.clientHeight / 3 - this.view.y) / this.view.scale;
    script.content.push({
      id: template.id,
      text: cloneText(template),
      globalid: newGlobalId(used),
      x: String(clamp(Math.round(cx - 175), 0, CANVAS_SIZE)),
      y: String(clamp(Math.round(cy), 0, CANVAS_SIZE)),
      width: '350',
      actions: []
    });
    this._fittedFor = this.activeScriptGid;
    this._emit();
  }

  /** @private */
  _addScript() {
    if (!this.doc) return;
    const used = collectGlobalIds(this.doc);
    const script = { class: 'script', globalid: newGlobalId(used), alias: `script_${this.scripts.length + 1}`, enabled: 'true', content: [] };
    const list = Array.isArray(this.doc) ? this.doc : (Array.isArray(this.doc.webcontent) ? this.doc.webcontent : (this.doc.webcontent = []));
    list.push(script);
    this.activeScriptGid = script.globalid;
    this._fittedFor = null;
    this._emit();
  }

  /** @private */
  _emit() {
    this.options.onChange?.(this.doc);
  }

  /* ---------------- block palette ---------------- */

  /** @private */
  _openPalette(anchor, mode, target = null) {
    this._closePalette();
    const templates = mode === 'event' ? EVENT_TEMPLATES : ACTION_TEMPLATES;
    const pal = document.createElement('div');
    pal.className = 'cw-ws-palette';
    pal.innerHTML = `
      <input class="cw-ws-palette-search" placeholder="${mode === 'event' ? 'Search events…' : 'Search blocks… (e.g. if, wait, tween)'}" spellcheck="false" autocomplete="off">
      <div class="cw-ws-palette-list" role="listbox"></div>`;
    this.root.appendChild(pal);

    const list = pal.querySelector('.cw-ws-palette-list');
    const search = pal.querySelector('.cw-ws-palette-search');
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      let html = '';
      let lastCat = null;
      templates.forEach((t, i) => {
        const label = templateLabel(t);
        const cat = CATEGORIES[t.cat];
        if (q && !`${label} ${cat.name} ${t.id}`.toLowerCase().includes(q)) return;
        if (t.cat !== lastCat) {
          html += `<div class="cw-ws-palette-cat">${escapeHtml(cat.name)}</div>`;
          lastCat = t.cat;
        }
        html += `<button type="button" class="cw-ws-palette-item" data-i="${i}" style="--c:${cat.color}"><span class="cw-ws-palette-dot"></span><span>${escapeHtml(label)}</span><span class="cw-ws-palette-id">${t.id}</span></button>`;
      });
      list.innerHTML = html || '<div class="cw-ws-palette-none">No matching blocks</div>';
    };
    draw();

    const pick = (i) => {
      const t = templates[i];
      this._closePalette();
      if (mode === 'event') this._insertEvent(t);
      else this._insertAction(target.evt, target.index, t);
    };
    search.addEventListener('input', draw);
    search.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') this._closePalette();
      if (e.key === 'Enter') {
        const first = list.querySelector('.cw-ws-palette-item');
        if (first) pick(Number(first.getAttribute('data-i')));
      }
    });
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.cw-ws-palette-item');
      if (item) pick(Number(item.getAttribute('data-i')));
    });

    // Position next to the anchor, kept inside the workspace
    const rr = this.root.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const w = 320; const h = Math.min(420, rr.height - 24);
    pal.style.left = `${clamp(ar.left - rr.left, 8, rr.width - w - 8)}px`;
    pal.style.top = `${clamp(ar.bottom - rr.top + 6, 8, rr.height - h - 8)}px`;
    pal.style.maxHeight = `${h}px`;
    search.focus();

    this._palette = pal;
    this._paletteOutside = (e) => {
      if (!pal.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) this._closePalette();
    };
    setTimeout(() => document.addEventListener('pointerdown', this._paletteOutside), 0);
  }

  /** @private */
  _closePalette() {
    if (!this._palette) return;
    this._palette.remove();
    this._palette = null;
    document.removeEventListener('pointerdown', this._paletteOutside);
  }

  destroy() {
    this._closePalette();
    for (const t of this._flashTimers.values()) clearTimeout(t);
    this.root.innerHTML = '';
  }
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, fn)); return; }
  fn(node);
  if (Array.isArray(node.webcontent)) node.webcontent.forEach((n) => walk(n, fn));
  if (Array.isArray(node.children)) node.children.forEach((n) => walk(n, fn));
}

function collectScripts(doc) {
  const out = [];
  walk(doc, (n) => { if (n.class === 'script') out.push(n); });
  return out;
}

/** Every globalid in the file — elements, events and actions share one namespace. */
export function collectGlobalIds(doc) {
  const ids = new Set();
  walk(doc, (n) => {
    if (n.globalid) ids.add(String(n.globalid));
    if (n.class === 'script') {
      for (const evt of (n.content || [])) {
        if (evt?.globalid) ids.add(String(evt.globalid));
        for (const a of (evt?.actions || [])) if (a?.globalid) ids.add(String(a.globalid));
      }
    }
  });
  return ids;
}

/** A fresh 2-character globalid (3 when 2-character IDs run out). */
export function newGlobalId(used) {
  for (const len of [2, 3]) {
    for (let tries = 0; tries < 400; tries++) {
      let id = '';
      for (let i = 0; i < len; i++) id += GID_CHARS[Math.floor(Math.random() * GID_CHARS.length)];
      if (!used.has(id)) { used.add(id); return id; }
    }
  }
  throw new Error('No free globalid left');
}

function slotKind(tok) {
  if (tok.t === 'object' || tok.l === 'button' || tok.l === 'input' || tok.l === 'avataritem') return 'object';
  if (tok.l === 'variable' || tok.l === 'variable?' || tok.l === 'var' || tok.l === 'x' || tok.l === 'y') return 'variable';
  if (tok.l === 'property') return 'property';
  if (tok.t === 'number' || tok.l === 'time') return 'number';
  if (tok.t === 'key') return 'key';
  if (tok.assetbrowser || tok.l === 'id' || tok.t === 'id') return 'asset';
  if (tok.l === 'table' || tok.l === 'array' || tok.l === 'function' || tok.l === 'cookie' || tok.l === 'entry') return 'name';
  return 'text';
}

/** Sizes an input to its text (or placeholder) so values are never cut off. */
function fitInput(input) {
  const cs = getComputedStyle(input);
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
  probe.textContent = input.value || input.placeholder || '';
  input.parentNode.appendChild(probe);
  const text = probe.offsetWidth;
  probe.remove();
  const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  input.style.width = `${Math.min(420, Math.ceil(text + pad + 4))}px`;
}

function fallbackPosition(i) {
  return { x: 4300 + (i % 3) * 420, y: 4600 + Math.floor(i / 3) * 360 };
}

function finiteOr(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function cssEscape(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/["\\]/g, '\\$&');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
