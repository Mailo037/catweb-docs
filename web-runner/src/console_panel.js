/**
 * Bottom console dock: script output (Log / Warn / Error, runtime errors, skipped
 * blocks) and a live view of every global and object variable.
 */

import { formatValue } from './runtime.js';

const MAX_ENTRIES = 400;

export class ConsolePanel {
  /**
   * @param {HTMLElement} root - The dock element (#consoleDock)
   * @param {object} [options]
   * @param {(gid: string) => void} [options.onReveal] - Clicking a block reference
   * @param {(counts: {error: number, warn: number}) => void} [options.onCountsChange]
   * @param {() => void} [options.onClose]
   */
  constructor(root, options = {}) {
    this.root = root;
    this.options = options;
    this.entries = [];
    this.counts = { error: 0, warn: 0 };
    this.tab = 'console';
    this._getVariables = () => [];
    this._varFrame = null;

    this.list = root.querySelector('#consoleList');
    this.varsView = root.querySelector('#consoleVars');
    this.countEl = root.querySelector('#consoleCount');

    root.querySelector('#consoleClearBtn')?.addEventListener('click', () => this.clear());
    root.querySelector('#consoleCloseBtn')?.addEventListener('click', () => this.options.onClose?.());
    for (const btn of root.querySelectorAll('[data-console-tab]')) {
      btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-console-tab')));
    }
    this.list?.addEventListener('click', (e) => {
      const ref = e.target.closest('[data-reveal]');
      if (ref) this.options.onReveal?.(ref.getAttribute('data-reveal'));
    });
    this._bindResize(root.querySelector('.cw-console-resize'));
    this.render();
  }

  isOpen() {
    return !this.root.classList.contains('hidden');
  }

  /** Removes all entries (e.g. when a new document is loaded). */
  clear() {
    this.entries = [];
    this.counts = { error: 0, warn: 0 };
    this.options.onCountsChange?.(this.counts);
    this.render();
  }

  /**
   * Adds one runtime log entry.
   * @param {{level: string, message: string, time: number, eventGid?: string, actionGid?: string, eventName?: string}} entry
   */
  add(entry) {
    const last = this.entries[this.entries.length - 1];
    if (last && last.level === entry.level && last.message === entry.message && last.actionGid === entry.actionGid) {
      last.repeat = (last.repeat || 1) + 1;
      last.time = entry.time;
    } else {
      this.entries.push({ ...entry });
      if (this.entries.length > MAX_ENTRIES) this.entries.shift();
    }
    if (entry.level === 'error') this.counts.error++;
    if (entry.level === 'warn') this.counts.warn++;
    this.options.onCountsChange?.(this.counts);
    this._scheduleRender();
  }

  /** Supplies the variable source for the Variables tab. */
  watchVariables(getter) {
    this._getVariables = getter || (() => []);
    this.refreshVariables();
  }

  /** Re-renders the Variables tab on the next frame (cheap to call often). */
  refreshVariables() {
    if (this.tab !== 'variables' || !this.isOpen() || this._varFrame) return;
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    this._varFrame = raf(() => {
      this._varFrame = null;
      this._renderVariables();
    });
  }

  switchTab(tab) {
    this.tab = tab === 'variables' ? 'variables' : 'console';
    for (const btn of this.root.querySelectorAll('[data-console-tab]')) {
      btn.classList.toggle('active', btn.getAttribute('data-console-tab') === this.tab);
    }
    this.list?.classList.toggle('hidden', this.tab !== 'console');
    this.varsView?.classList.toggle('hidden', this.tab !== 'variables');
    if (this.tab === 'variables') this._renderVariables();
  }

  render() {
    this._renderEntries();
    if (this.countEl) {
      const n = this.entries.length;
      this.countEl.textContent = n ? String(n) : '';
    }
  }

  /** @private */
  _scheduleRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    raf(() => {
      this._renderPending = false;
      this.render();
    });
  }

  /** @private */
  _renderEntries() {
    if (!this.list) return;
    if (!this.entries.length) {
      this.list.innerHTML = `<div class="cw-console-empty">Script output appears here. Use <b>Log</b>, <b>Warn</b> or <b>Error</b> blocks, or click a button in the preview.</div>`;
      return;
    }
    const stick = this.list.scrollTop + this.list.clientHeight >= this.list.scrollHeight - 24;
    this.list.innerHTML = this.entries.map((e) => {
      const time = new Date(e.time).toLocaleTimeString('en-GB', { hour12: false });
      const ref = e.actionGid || e.eventGid;
      const where = ref
        ? `<button type="button" class="cw-console-ref" data-reveal="${escapeHtml(ref)}" title="Show this block in the script view">${escapeHtml(e.eventName ? `${e.eventName} · ` : '')}${escapeHtml(ref)}</button>`
        : '';
      const repeat = e.repeat > 1 ? `<span class="cw-console-repeat">${e.repeat}</span>` : '';
      return `<div class="cw-console-row ${escapeHtml(e.level)}">
        <span class="cw-console-time">${time}</span>
        <span class="cw-console-level">${levelLabel(e.level)}</span>
        <span class="cw-console-msg">${escapeHtml(e.message)}</span>${repeat}${where}
      </div>`;
    }).join('');
    if (stick) this.list.scrollTop = this.list.scrollHeight;
  }

  /** @private */
  _renderVariables() {
    if (!this.varsView) return;
    const vars = this._getVariables() || [];
    if (!vars.length) {
      this.varsView.innerHTML = '<div class="cw-console-empty">No variables yet. They appear here as soon as a script sets one.</div>';
      return;
    }
    vars.sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name, undefined, { numeric: true }));
    this.varsView.innerHTML = `<table class="cw-vars-table">
      <thead><tr><th>Variable</th><th>Scope</th><th>Value</th></tr></thead>
      <tbody>${vars.map((v) => `<tr>
        <td class="cw-vars-name">{${escapeHtml(v.name)}}</td>
        <td class="cw-vars-scope">${escapeHtml(v.scope)}${v.script ? ` · ${escapeHtml(v.script)}` : ''}</td>
        <td class="cw-vars-value ${typeOf(v.value)}">${escapeHtml(formatValue(v.value))}</td>
      </tr>`).join('')}</tbody></table>`;
  }

  /** @private Drag the top edge to resize the dock. */
  _bindResize(handle) {
    if (!handle) return;
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = this.root.offsetHeight;
      const move = (ev) => {
        const h = Math.max(110, Math.min(window.innerHeight * 0.7, startH + startY - ev.clientY));
        this.root.style.height = `${h}px`;
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }
}

function levelLabel(level) {
  return { log: 'log', warn: 'warn', error: 'error', info: 'runner' }[level] || level;
}

function typeOf(v) {
  if (typeof v === 'number') return 'num';
  if (Array.isArray(v) || (v && typeof v === 'object')) return 'table';
  return 'str';
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
