/**
 * CatWeb Web Runner & Renderer — Main Application Controller
 *
 * Coordinates document ingestion, semantic validation, visual rendering,
 * interactive runtime execution, viewport scaling, element inspection,
 * and diagnostic error reporting.
 *
 * Runs zero-dependency in modern browsers (file:// or static server) and Node.js.
 */

import { parseCatWebJson, normalizeCatWeb, detectFormat } from './parser.js';
import { validateCatWeb } from './validator.js';
import { renderCatWebTree } from './elements.js';
import { CatWebRuntime } from './runtime.js';
import { CatWebInspector } from './inspector.js';
import { playSyntheticAudio } from './assets.js';
import { initAiProtocol, captureCanvasImage, handleAiRenderRequest } from './api_protocol.js';
import { CatWebOverflowManager } from './overflow_menu.js';

/**
 * Preloaded canonical CatWeb fixtures embedded for 100% offline file:// compatibility.
 */
export const PRELOADED_SAMPLES = {
  minimal_site: {
    "favicon": "16944769468",
    "title": "Minimal CatWeb Site",
    "background": "#0f0f11",
    "thumbnail_id": "16944769468",
    "thumbnail": "rbxassetid://16944769468",
    "webcontent": [
      {
        "class": "Frame",
        "globalid": "nb",
        "alias": "navbar",
        "size": "{1,0},{0,56}",
        "position": "{0,0},{0,0}",
        "background_color": "#18181b",
        "background_transparency": "0",
        "z_index": "10",
        "children": [
          { "class": "UIStroke", "globalid": "ns", "stroke_color": "#27272a", "stroke_thickness": "1", "stroke_transparency": "0" },
          { "class": "UIPadding", "globalid": "np", "top": "0,0", "bottom": "0,0", "left": "0,20", "right": "0,20" },
          { "class": "UIListLayout", "globalid": "nl", "direction": "Horizontal", "alignment_vertical": "Center", "padding": "0,16", "sort": "LayoutOrder" },
          { "class": "ImageLabel", "globalid": "nlo", "alias": "nav_logo", "size": "{0,32},{0,32}", "order": "1", "image_id": "128490289676597", "image": "rbxassetid://128490289676597", "image_color": "#ffffff", "background_transparency": "1" },
          { "class": "TextLabel", "globalid": "nt", "alias": "nav_title", "size": "{0,120},{1,0}", "order": "2", "text": "CatWeb", "font": "GothamBold", "font_size": "18", "font_color": "#ffffff", "align_x": "Left", "align_y": "Center", "background_transparency": "1" },
          { "class": "Frame", "globalid": "nsp", "alias": "nav_spacer", "size": "{0,0},{0,0}", "order": "3", "background_transparency": "1", "children": [{ "class": "UIFlexItem", "globalid": "nfi", "flex_mode": "Fill", "grow_ratio": "1" }] },
          { "class": "TextButton?link", "globalid": "nbl", "alias": "nav_docs_btn", "size": "{0,80},{0,36}", "order": "4", "text": "Docs", "font": "Gotham", "font_size": "14", "font_color": "#a1a1aa", "background_color": "#27272a", "auto_color": "true", "href": "docs.rbx", "children": [{ "class": "UICorner", "globalid": "nbc", "radius": "0,6" }] }
        ]
      },
      {
        "class": "ScrollingFrame",
        "globalid": "bd",
        "alias": "body",
        "size": "{1,0},{1,-56}",
        "position": "{0,0},{0,56}",
        "canvassize": "auto_y",
        "background_transparency": "1",
        "scrollbar_thickness": "6",
        "scrollbar_color": "#3f3f46",
        "children": [
          { "class": "UIPadding", "globalid": "bp", "top": "0,32", "bottom": "0,48", "left": "0,32", "right": "0,32" },
          { "class": "UIListLayout", "globalid": "bl", "direction": "Vertical", "alignment_horizontal": "Center", "padding": "0,24", "sort": "LayoutOrder" },
          {
            "class": "Frame", "globalid": "hr", "alias": "hero", "size": "{0,680},{0,180}", "order": "1", "background_color": "#18181b", "background_transparency": "0",
            "children": [
              { "class": "UICorner", "globalid": "hc", "radius": "0,12" },
              { "class": "UIStroke", "globalid": "hs", "stroke_color": "#27272a", "stroke_thickness": "1", "stroke_transparency": "0" },
              { "class": "UIPadding", "globalid": "hp", "top": "0,28", "bottom": "0,28", "left": "0,32", "right": "0,32" },
              { "class": "UIListLayout", "globalid": "hl", "direction": "Vertical", "padding": "0,10", "sort": "LayoutOrder" },
              { "class": "TextLabel", "globalid": "ht", "alias": "hero_title", "size": "{1,0},{0,36}", "order": "1", "text": "Welcome to CatWeb", "font": "GothamBold", "font_size": "28", "font_color": "#ffffff", "align_x": "Left", "align_y": "Center", "background_transparency": "1" },
              { "class": "TextLabel", "globalid": "hd", "alias": "hero_desc", "size": "{1,0},{0,44}", "order": "2", "text": "A minimal, clean 2D website template built for the simulated Roblox browser.", "font": "Gotham", "font_size": "14", "font_color": "#a1a1aa", "align_x": "Left", "align_y": "Top", "wrap": "true", "background_transparency": "1" }
            ]
          }
        ]
      }
    ]
  },

  interactive_counter: {
    "favicon": "16944769468",
    "title": "Interactive Counter",
    "background": "#0f0f11",
    "thumbnail_id": "16944769468",
    "thumbnail": "rbxassetid://16944769468",
    "webcontent": [
      {
        "class": "Frame", "globalid": "rt", "alias": "root", "size": "{1,0},{1,0}", "position": "{0,0},{0,0}", "background_color": "#0f0f11", "background_transparency": "0",
        "children": [
          { "class": "UIPadding", "globalid": "rp", "top": "0,24", "bottom": "0,24", "left": "0,24", "right": "0,24" },
          { "class": "UIListLayout", "globalid": "rl", "direction": "Vertical", "alignment_horizontal": "Center", "alignment_vertical": "Center", "padding": "0,16" },
          {
            "class": "Frame", "globalid": "cd", "alias": "counter_card", "size": "{0,380},{0,340}", "background_color": "#18181b", "background_transparency": "0",
            "children": [
              { "class": "UICorner", "globalid": "cc", "radius": "0,16" },
              { "class": "UIStroke", "globalid": "cs", "stroke_color": "#27272a", "stroke_thickness": "1", "stroke_transparency": "0" },
              { "class": "UIPadding", "globalid": "cp", "top": "0,28", "bottom": "0,28", "left": "0,28", "right": "0,28" },
              { "class": "UIListLayout", "globalid": "cl", "direction": "Vertical", "padding": "0,16", "sort": "LayoutOrder", "alignment_horizontal": "Center", "alignment_vertical": "Center" },
              { "class": "TextLabel", "globalid": "ch", "alias": "card_title", "size": "{1,0},{0,28}", "order": "1", "text": "CatWeb Counter", "font": "GothamBold", "font_size": "20", "font_color": "#ffffff", "align_x": "Center", "align_y": "Center", "background_transparency": "1" },
              {
                "class": "Frame", "globalid": "df", "alias": "display_box", "size": "{1,0},{0,72}", "order": "2", "background_color": "#09090b", "background_transparency": "0",
                "children": [
                  { "class": "UICorner", "globalid": "dc", "radius": "0,8" },
                  { "class": "UIStroke", "globalid": "ds", "stroke_color": "#27272a", "stroke_thickness": "1", "stroke_transparency": "0" },
                  { "class": "TextLabel", "globalid": "cnt", "alias": "count_label", "size": "{1,0},{1,0}", "position": "{0,0},{0,0}", "text": "Count: 0", "font": "GothamBold", "font_size": "32", "font_color": "#3b82f6", "align_x": "Center", "align_y": "Center", "background_transparency": "1" }
                ]
              },
              {
                "class": "TextButton", "globalid": "btn", "alias": "click_btn", "size": "{1,0},{0,48}", "order": "3", "text": "Click to Count (+1)", "font": "GothamBold", "font_size": "16", "font_color": "#ffffff", "background_color": "#2563eb", "auto_color": "true",
                "children": [
                  { "class": "UICorner", "globalid": "bc", "radius": "0,8" },
                  { "class": "UIPadding", "globalid": "bp", "top": "0,10", "bottom": "0,10", "left": "0,20", "right": "0,20" }
                ]
              },
              {
                "class": "TextButton", "globalid": "rst", "alias": "reset_btn", "size": "{1,0},{0,38}", "order": "4", "text": "Reset Counter", "font": "Gotham", "font_size": "14", "font_color": "#a1a1aa", "background_color": "#27272a", "auto_color": "true",
                "children": [
                  { "class": "UICorner", "globalid": "rc", "radius": "0,6" },
                  { "class": "UIPadding", "globalid": "rbp", "top": "0,8", "bottom": "0,8", "left": "0,16", "right": "0,16" }
                ]
              }
            ]
          },
          {
            "class": "script", "globalid": "sc1", "alias": "counter_logic", "enabled": "true",
            "content": [
              {
                "id": "0", "globalid": "ev0", "text": ["When website loaded..."],
                "actions": [
                  { "id": "11", "globalid": "ac0", "text": ["Set", {"value":"1","t":"string","l":"variable"}, "to", {"value":"0","t":"string","l":"any"}] }
                ]
              },
              {
                "id": "1", "globalid": "ev1", "text": ["When", {"value":"btn","t":"object","l":"button"}, "pressed..."],
                "actions": [
                  { "id": "12", "globalid": "ac1", "text": ["Add", {"value":"1","t":"string","l":"any"}, "to", {"value":"1","t":"string","l":"variable"}] },
                  { "id": "31", "globalid": "ac2", "text": ["Set", {"value":"Text","t":"string","l":"property"}, "of", {"value":"cnt","t":"object"}, "to", {"value":"Count: {1}","t":"any"}] },
                  { "id": "5", "globalid": "ac3", "text": ["Play audio", {"value":"88442833509532","t":"string","l":"id","assetbrowser":"audio"}, "→", {"value":"","t":"string","l":"variable?"}] },
                  { "id": "18", "globalid": "ac4", "text": ["If", {"value":"{1}","t":"string","l":"any"}, "is equal to", {"value":"10","t":"string","l":"any"}] },
                  { "id": "31", "globalid": "ac5", "text": ["Set", {"value":"Text","t":"string","l":"property"}, "of", {"value":"cnt","t":"object"}, "to", {"value":"Goal reached: {1}!","t":"any"}] },
                  { "id": "5", "globalid": "ac6", "text": ["Play audio", {"value":"136211732441165","t":"string","l":"id","assetbrowser":"audio"}, "→", {"value":"","t":"string","l":"variable?"}] },
                  { "id": "25", "globalid": "ac7", "text": ["end"] }
                ]
              },
              {
                "id": "1", "globalid": "ev2", "text": ["When", {"value":"rst","t":"object","l":"button"}, "pressed..."],
                "actions": [
                  { "id": "11", "globalid": "ac8", "text": ["Set", {"value":"1","t":"string","l":"variable"}, "to", {"value":"0","t":"string","l":"any"}] },
                  { "id": "31", "globalid": "ac9", "text": ["Set", {"value":"Text","t":"string","l":"property"}, "of", {"value":"cnt","t":"object"}, "to", {"value":"Count: 0","t":"any"}] },
                  { "id": "5", "globalid": "aca", "text": ["Play audio", {"value":"88442833509532","t":"string","l":"id","assetbrowser":"audio"}, "→", {"value":"","t":"string","l":"variable?"}] }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  user_snippet: [
    {
      "class": "Frame", "globalid": "P+", "alias": "user_card", "size": "{0,320},{0,420}", "position": "{0.5,-160},{0.5,-210}", "background_color": "#1c1c1f",
      "children": [
        { "class": "UICorner", "globalid": "\\4", "radius": "0,14" },
        { "class": "UIStroke", "globalid": " i", "stroke_color": "#2c2c30", "stroke_thickness": "1" },
        { "class": "UIGradient", "globalid": "*w", "rotation": "45", "color": [ { "time": 0, "color": "#222226" }, { "time": 1, "color": "#18181b" } ] },
        { "class": "UIPadding", "globalid": "e|", "top": "0,20", "bottom": "0,20", "left": "0,20", "right": "0,20" },
        { "class": "UIListLayout", "globalid": "K}", "direction": "Vertical", "alignment_horizontal": "Center", "padding": "0,14", "sort": "LayoutOrder" },
        { "class": "ImageLabel", "globalid": "av", "alias": "avatar", "size": "{0,80},{0,80}", "order": "1", "image_id": "117017076630548", "children": [{ "class": "UICorner", "globalid": "ac", "radius": "1,0" }] },
        { "class": "TextLabel", "globalid": "nm", "alias": "user_name", "size": "{1,0},{0,24}", "order": "2", "text": "Player One", "font": "GothamBold", "font_size": "18", "font_color": "#ffffff", "align_x": "Center", "background_transparency": "1" },
        { "class": "TextButton?link", "globalid": "lb", "alias": "profile_link", "size": "{1,0},{0,36}", "order": "3", "text": "View Profile", "href": "profile.rbx", "children": [{ "class": "UICorner", "globalid": "lc", "radius": "0,6" }] },
        { "class": "TextButton?transfer", "globalid": "tb", "alias": "tip_btn", "size": "{1,0},{0,36}", "order": "4", "text": "Tip Player (10 R$)", "robux_amount": "10", "children": [{ "class": "UICorner", "globalid": "tc", "radius": "0,6" }] },
        { "class": "ImageButton?avataritem", "globalid": "ib", "alias": "item_btn", "size": "{0,36},{0,36}", "order": "5", "image_id": "73775766036081", "product": "12345678" }
      ]
    }
  ],

  valid_snippet: [
    {
      "class": "Frame", "globalid": "c1", "alias": "card", "size": "{0,300},{0,180}", "position": "{0.5,-150},{0.5,-90}", "background_color": "#1e293b",
      "children": [
        { "class": "UICorner", "globalid": "c2", "radius": "0,12" },
        { "class": "UIStroke", "globalid": "c3", "stroke_color": "#334155", "stroke_thickness": "1" },
        { "class": "TextLabel", "globalid": "c4", "alias": "label", "size": "{1,0},{1,0}", "text": "Component Snippet", "font_size": "20", "font_color": "#ffffff", "align_x": "Center", "align_y": "Center", "background_transparency": "1" }
      ]
    }
  ],

  invalid_examples: [
    {
      "class": "Frame",
      "globalid": "c1",
      "size": "0,300,0,180",
      "background_color": "2563eb",
      "visible": true,
      "layout_order": "1",
      "children": [
        { "class": "UICorner", "globalid": "c1", "radius": "0,12" },
        { "class": "TextLabel", "globalid": "c2", "order": 2, "text": "Invalid", "font_size": "16" }
      ]
    },
    {
      "class": "script",
      "globalid": "sc1",
      "content": [
        {
          "id": "1",
          "globalid": "invalid_long_id",
          "text": ["When", { "value": "btn", "t": "object" }, "pressed..."],
          "actions": [
            {
              "id": "18",
              "globalid": "a1",
              "text": ["If", { "value": "1", "t": "string", "l": "any" }, "is equal to", { "value": "1", "t": "string", "l": "any" }],
              "actions": [
                { "id": "31", "globalid": "a2", "text": ["Set", { "value": "InvalidProperty", "t": "string", "l": "property" }, "of", { "value": "missing_obj", "t": "object" }, "to", { "value": "val", "t": "any" }] }
              ]
            },
            {
              "id": "24",
              "globalid": "a3",
              "text": ["Wait", { "value": "1", "t": "number" }, "seconds"]
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Transforms a native <select> element into a sleek, accessible Codex/Vercel-style
 * custom dropdown menu while keeping the native element fully synced for tests and events.
 *
 * @param {HTMLSelectElement} selectEl
 * @param {object} [options={}]
 * @param {boolean} [options.alignRight=false] - Right-aligns dropdown menu card
 * @returns {object|null} Controller with sync() and destroy() methods
 */
export function initCustomSelect(selectEl, options = {}) {
  if (!selectEl || !selectEl.parentNode) return null;
  if (selectEl._customSelect) return selectEl._customSelect;

  const doc = selectEl.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;

  // Hide the native select visually while keeping it active in DOM for test harness/events
  if (selectEl.classList?.add) {
    selectEl.classList.add('cw-select-native-hidden');
  }
  if (selectEl.setAttribute) {
    selectEl.setAttribute('tabindex', '-1');
    selectEl.setAttribute('aria-hidden', 'true');
  }

  const container = doc.createElement('div');
  container.className = 'cw-custom-select' + (options.alignRight ? ' cw-align-right' : '');

  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cw-custom-select-trigger';
  if (trigger.setAttribute) {
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
  }

  const labelSpan = doc.createElement('span');
  labelSpan.className = 'cw-custom-select-label';

  const arrowSpan = doc.createElement('span');
  arrowSpan.className = 'cw-custom-select-arrow';
  arrowSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  trigger.appendChild(labelSpan);
  trigger.appendChild(arrowSpan);
  container.appendChild(trigger);

  const menu = doc.createElement('div');
  menu.className = 'cw-custom-select-menu hidden';
  if (menu.setAttribute) {
    menu.setAttribute('role', 'listbox');
  }
  container.appendChild(menu);

  // Insert container directly after selectEl in DOM
  if (selectEl.parentNode.insertBefore) {
    selectEl.parentNode.insertBefore(container, selectEl.nextSibling);
  } else if (selectEl.parentNode.appendChild) {
    selectEl.parentNode.appendChild(container);
  }

  const checkSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  function syncOptions() {
    menu.innerHTML = '';
    const opts = selectEl.options ? Array.from(selectEl.options) : (selectEl.children || []).filter(c => c.tagName === 'OPTION');
    const curVal = selectEl.value;
    let selectedText = '';

    for (const opt of opts) {
      const val = opt.value !== undefined ? opt.value : (opt.getAttribute ? opt.getAttribute('value') : '') || '';
      const text = opt.textContent || opt.innerText || val;
      const isSelected = (val === curVal) || (!curVal && opt.selected);

      if (isSelected || !selectedText) {
        selectedText = text;
      }

      const item = doc.createElement('div');
      item.className = 'cw-custom-select-item' + (isSelected ? ' active' : '');
      if (item.setAttribute) {
        item.setAttribute('role', 'option');
        item.setAttribute('data-value', val);
        item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      }

      const itemText = doc.createElement('span');
      itemText.className = 'cw-custom-select-item-text';
      itemText.textContent = text;
      item.appendChild(itemText);

      const itemCheck = doc.createElement('span');
      itemCheck.className = 'cw-custom-select-check';
      itemCheck.innerHTML = checkSvg;
      item.appendChild(itemCheck);

      item.addEventListener('click', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (selectEl.value !== val) {
          selectEl.value = val;
          closeMenu();
          syncSelected();
          if (typeof Event !== 'undefined') {
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (typeof selectEl.dispatchEvent === 'function') {
            selectEl.dispatchEvent({ type: 'change', bubbles: true });
          }
        } else {
          closeMenu();
        }
      });

      menu.appendChild(item);
    }

    labelSpan.textContent = selectedText;
  }

  function syncSelected() {
    const curVal = selectEl.value;
    const items = menu.querySelectorAll ? menu.querySelectorAll('.cw-custom-select-item') : (menu.children || []);
    let selectedText = '';

    for (const item of items) {
      const val = item.getAttribute ? item.getAttribute('data-value') : item.dataset?.value;
      const textEl = item.querySelector ? item.querySelector('.cw-custom-select-item-text') : null;
      const text = textEl ? textEl.textContent : (item.textContent || '');
      const isSelected = (val === curVal);

      if (isSelected) {
        if (item.classList?.add) item.classList.add('active');
        if (item.setAttribute) item.setAttribute('aria-selected', 'true');
        selectedText = text;
      } else {
        if (item.classList?.remove) item.classList.remove('active');
        if (item.setAttribute) item.setAttribute('aria-selected', 'false');
      }
    }

    if (selectedText) {
      labelSpan.textContent = selectedText;
    }
  }

  function openMenu() {
    if (doc.querySelectorAll) {
      const allMenus = doc.querySelectorAll('.cw-custom-select-menu:not(.hidden)');
      for (const m of allMenus) {
        if (m !== menu) {
          if (m.classList?.add) m.classList.add('hidden');
          const p = m.parentNode?.querySelector?.('.cw-custom-select-trigger');
          if (p?.classList?.remove) p.classList.remove('active');
        }
      }
    }
    syncOptions();
    if (menu.classList?.remove) menu.classList.remove('hidden');
    if (trigger.classList?.add) trigger.classList.add('active');
    if (trigger.setAttribute) trigger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (menu.classList?.add) menu.classList.add('hidden');
    if (trigger.classList?.remove) trigger.classList.remove('active');
    if (trigger.setAttribute) trigger.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const isHidden = menu.classList?.contains ? menu.classList.contains('hidden') : true;
    if (isHidden) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  trigger.addEventListener('click', toggleMenu);

  const onNativeChange = () => {
    syncSelected();
  };
  selectEl.addEventListener('change', onNativeChange);

  const onDocClick = (e) => {
    let cur = e?.target;
    let inside = false;
    while (cur) {
      if (cur === container) {
        inside = true;
        break;
      }
      cur = cur.parentNode;
    }
    if (!inside) {
      closeMenu();
    }
  };

  const onDocKeydown = (e) => {
    if (e?.key === 'Escape' || e?.keyCode === 27) {
      closeMenu();
    }
  };

  if (typeof doc.addEventListener === 'function') {
    doc.addEventListener('click', onDocClick);
    doc.addEventListener('keydown', onDocKeydown);
  }

  syncOptions();

  const controller = {
    container,
    trigger,
    menu,
    sync: syncSelected,
    syncOptions,
    destroy() {
      if (typeof doc.removeEventListener === 'function') {
        doc.removeEventListener('click', onDocClick);
        doc.removeEventListener('keydown', onDocKeydown);
      }
      if (typeof selectEl.removeEventListener === 'function') {
        selectEl.removeEventListener('change', onNativeChange);
      }
      if (selectEl.classList?.remove) {
        selectEl.classList.remove('cw-select-native-hidden');
      }
      if (selectEl.removeAttribute) {
        selectEl.removeAttribute('tabindex');
        selectEl.removeAttribute('aria-hidden');
      }
      delete selectEl._customSelect;
      delete selectEl._syncCustomSelect;
      if (container.parentNode && container.parentNode.removeChild) {
        container.parentNode.removeChild(container);
      }
    }
  };

  selectEl._customSelect = controller;
  selectEl._syncCustomSelect = syncSelected;
  return controller;
}

export class CatWebRunnerApp {
  /**
   * @param {HTMLElement} [rootContainer] - Root DOM container of the application shell
   * @param {object} [options={}] - Configuration options
   */
  constructor(rootContainer = null, options = {}) {
    this.root = rootContainer || (typeof document !== 'undefined' ? document.body : null);
    this.options = {
      defaultSample: 'interactive_counter',
      canvasWidth: 1920,
      canvasHeight: 1080,
      ...options
    };

    this.currentDocument = null;
    this.currentFormat = 'site';
    this.validationResult = null;
    this.runtime = null;
    this.inspector = null;
    this.currentZoom = 'fit';
    this.audioEnabled = true;

    // DOM element references
    this.sampleSelect = null;
    this.sampleSelectCtrl = null;
    this.fileInput = null;
    this.uploadBtn = null;
    this.rawJsonBtn = null;
    this.inspectorBtn = null;
    this.diagnosticsBtn = null;
    this.zoomSelect = null;
    this.zoomSelectCtrl = null;
    this.audioBtn = null;

    this.editorPanel = null;
    this.editorTextarea = null;
    this.formatJsonBtn = null;
    this.applyJsonBtn = null;
    this.closeEditorBtn = null;

    this.inspectorPanel = null;
    this.inspectorDrawer = null;
    this.closeInspectorBtn = null;

    this.diagnosticsPanel = null;
    this.diagnosticsDrawer = null;
    this.closeDiagnosticsBtn = null;

    this.viewportArea = null;
    this.canvasZoomWrapper = null;
    this.browserWindow = null;
    this.pageTitle = null;
    this.urlText = null;
    this.canvasStage = null;
    this.previewCanvas = null;

    this.statusInfo = null;
    this.statusResolution = null;
    this.statusValidation = null;

    this.overflowManager = null;

    this._boundOnResize = this._onResize.bind(this);
    this._resizeObserver = null;
  }

  /**
   * Initializes the application shell, DOM listeners, and loads initial sample.
   */
  init() {
    if (!this.root || !this.root.querySelector) return;

    // 1. Locate DOM elements
    this.sampleSelect = this.root.querySelector('#sampleSelect');
    this.fileInput = this.root.querySelector('#fileInput');
    this.uploadBtn = this.root.querySelector('#uploadBtn');
    this.rawJsonBtn = this.root.querySelector('#rawJsonBtn');
    this.inspectorBtn = this.root.querySelector('#inspectorBtn');
    this.diagnosticsBtn = this.root.querySelector('#diagnosticsBtn');
    this.zoomSelect = this.root.querySelector('#zoomSelect');
    this.audioBtn = this.root.querySelector('#audioBtn');

    this.editorPanel = this.root.querySelector('#editorPanel');
    this.editorTextarea = this.root.querySelector('#editorTextarea');
    this.formatJsonBtn = this.root.querySelector('#formatJsonBtn');
    this.applyJsonBtn = this.root.querySelector('#applyJsonBtn');
    this.closeEditorBtn = this.root.querySelector('#closeEditorBtn');

    this.inspectorPanel = this.root.querySelector('#inspectorPanel');
    this.inspectorDrawer = this.root.querySelector('#inspectorDrawer');
    this.inspectorTabTree = this.root.querySelector('#inspectorTabTree');
    this.inspectorTabProps = this.root.querySelector('#inspectorTabProps');
    this.inspectorTreeView = this.root.querySelector('#inspectorTreeView');
    this.inspectorPropsView = this.root.querySelector('#inspectorPropsView');
    this.closeInspectorBtn = this.root.querySelector('#closeInspectorBtn');

    this.diagnosticsPanel = this.root.querySelector('#diagnosticsPanel');
    this.diagnosticsDrawer = this.root.querySelector('#diagnosticsDrawer');
    this.closeDiagnosticsBtn = this.root.querySelector('#closeDiagnosticsBtn');

    this.viewportArea = this.root.querySelector('#viewportArea');
    this.canvasZoomWrapper = this.root.querySelector('#canvasZoomWrapper');
    this.browserWindow = this.root.querySelector('#browserWindow');
    this.pageTitle = this.root.querySelector('#pageTitle');
    this.urlText = this.root.querySelector('#urlText');
    this.canvasStage = this.root.querySelector('#canvasStage');
    this.previewCanvas = this.root.querySelector('#previewCanvas');

    this.statusInfo = this.root.querySelector('#statusInfo');
    this.statusResolution = this.root.querySelector('#statusResolution');
    this.statusValidation = this.root.querySelector('#statusValidation');

    // 2. Bind Toolbar Events
    if (this.sampleSelect) {
      this.sampleSelectCtrl = initCustomSelect(this.sampleSelect);
      this.sampleSelect.addEventListener('change', () => {
        const sampleKey = this.sampleSelect.value;
        if (PRELOADED_SAMPLES[sampleKey]) {
          this.loadDocument(PRELOADED_SAMPLES[sampleKey]);
        }
        if (this.overflowManager) {
          this.overflowManager.measureIntrinsicWidths();
          this.overflowManager.updateLayout();
        }
      });
    }

    if (this.uploadBtn && this.fileInput) {
      this.uploadBtn.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.loadDocument(evt.target?.result);
        };
        reader.readAsText(file);
      });
    }

    if (this.rawJsonBtn) {
      this.rawJsonBtn.addEventListener('click', () => this.toggleEditor());
    }
    if (this.closeEditorBtn) {
      this.closeEditorBtn.addEventListener('click', () => this.toggleEditor(false));
    }

    if (this.formatJsonBtn && this.editorTextarea) {
      this.formatJsonBtn.addEventListener('click', () => {
        try {
          const parsed = JSON.parse(this.editorTextarea.value);
          this.editorTextarea.value = JSON.stringify(parsed, null, 2);
        } catch (err) {
          alert('Invalid JSON syntax: ' + err.message);
        }
      });
    }

    if (this.applyJsonBtn && this.editorTextarea) {
      this.applyJsonBtn.addEventListener('click', () => {
        this.loadDocument(this.editorTextarea.value);
      });
    }

    if (this.inspectorBtn) {
      this.inspectorBtn.addEventListener('click', () => this.toggleInspector());
    }
    if (this.closeInspectorBtn) {
      this.closeInspectorBtn.addEventListener('click', () => this.toggleInspector(false));
    }

    if (this.diagnosticsBtn) {
      this.diagnosticsBtn.addEventListener('click', () => this.toggleDiagnostics());
    }
    if (this.closeDiagnosticsBtn) {
      this.closeDiagnosticsBtn.addEventListener('click', () => this.toggleDiagnostics(false));
    }

    if (this.zoomSelect) {
      this.zoomSelectCtrl = initCustomSelect(this.zoomSelect, { alignRight: true });
      this.zoomSelect.addEventListener('change', () => {
        this.setZoom(this.zoomSelect.value);
      });
    }

    if (this.audioBtn) {
      const audioIconOn = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
      const audioIconOff = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

      this.audioBtn.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        if (this.runtime) this.runtime.options.audioEnabled = this.audioEnabled;
        this.audioBtn.innerHTML = `${this.audioEnabled ? audioIconOn : audioIconOff}<span>${this.audioEnabled ? 'Audio' : 'Muted'}</span>`;
        this.audioBtn.classList.toggle('active', this.audioEnabled);
        this.overflowManager?.renderMenuContent();
      });
    }

    // 3. Drag & Drop Handling on Viewport Area
    if (this.viewportArea) {
      this.viewportArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        this.viewportArea.classList.add('cw-dragover');
      });
      this.viewportArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.viewportArea.classList.add('cw-dragover');
      });
      this.viewportArea.addEventListener('dragleave', (e) => {
        if (!this.viewportArea.contains(e.relatedTarget)) {
          this.viewportArea.classList.remove('cw-dragover');
        }
      });
      this.viewportArea.addEventListener('drop', (e) => {
        e.preventDefault();
        this.viewportArea.classList.remove('cw-dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.loadDocument(evt.target?.result);
          };
          reader.readAsText(file);
        }
      });
    }

    // 4. Window & Viewport Resize Listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._boundOnResize);
    }
    if (typeof ResizeObserver !== 'undefined' && this.viewportArea) {
      this._resizeObserver = new ResizeObserver(() => {
        this._onResize();
      });
      this._resizeObserver.observe(this.viewportArea);
    }

    // 5. Initialize Inspector
    if (this.canvasStage) {
      this.inspector = new CatWebInspector(this.canvasStage, this.inspectorDrawer, {
        treeContainer: this.inspectorTreeView,
        propsContainer: this.inspectorPropsView,
        tabTreeBtn: this.inspectorTabTree,
        tabPropsBtn: this.inspectorTabProps,
        onSelect: (entry) => {
          if (entry) {
            if (this.inspectorPanel?.classList?.contains('hidden')) {
              this.toggleInspector(true);
            }
            this.inspector?.switchTab('props');
          }
        },
        onTriggerEvent: (scriptNode, eventNode) => {
          if (this.runtime && typeof this.runtime.executeEventNode === 'function') {
            this.runtime.executeEventNode(eventNode);
          }
        },
        onPlayAudio: (assetId) => {
          if (this.audioEnabled) {
            playSyntheticAudio(assetId);
          }
        },
        onDocumentChange: (updatedTree) => {
          this.currentDocument = updatedTree;
          if (this.editorTextarea) {
            try {
              this.editorTextarea.value = JSON.stringify(updatedTree, null, 2);
            } catch {}
          }
        }
      });
    }

    // 6. Initialize AI Protocol & Image Export Modal
    this.aiApiBtn = this.root.querySelector('#aiApiBtn');
    this.aiApiModal = this.root.querySelector('#aiApiModal');
    this.closeAiModalBtn = this.root.querySelector('#closeAiModalBtn');
    this.downloadPngBtn = this.root.querySelector('#downloadPngBtn');
    this.copyDataUrlBtn = this.root.querySelector('#copyDataUrlBtn');
    this.exportStatusHint = this.root.querySelector('#exportStatusHint');

    if (this.aiApiBtn && this.aiApiModal) {
      this.aiApiBtn.addEventListener('click', () => {
        if (this.aiApiModal.classList?.remove) {
          this.aiApiModal.classList.remove('hidden');
        }
      });
    }

    if (this.closeAiModalBtn && this.aiApiModal) {
      this.closeAiModalBtn.addEventListener('click', () => {
        if (this.aiApiModal.classList?.add) {
          this.aiApiModal.classList.add('hidden');
        }
      });
    }

    if (this.aiApiModal) {
      this.aiApiModal.addEventListener('click', (e) => {
        if (e.target === this.aiApiModal && this.aiApiModal.classList?.add) {
          this.aiApiModal.classList.add('hidden');
        }
      });
    }

    if (this.downloadPngBtn) {
      this.downloadPngBtn.addEventListener('click', async () => {
        try {
          if (this.exportStatusHint) this.exportStatusHint.textContent = 'Generating snapshot...';
          const snap = await captureCanvasImage(this.previewCanvas, { format: 'png' });
          if (typeof document !== 'undefined') {
            const a = document.createElement('a');
            a.href = snap.dataUrl;
            const fileName = (this.currentDocument?.title || 'catweb_render').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.png';
            a.download = fileName;
            a.click();
          }
          if (this.exportStatusHint) {
            this.exportStatusHint.textContent = 'PNG downloaded!';
            setTimeout(() => { if (this.exportStatusHint) this.exportStatusHint.textContent = ''; }, 3000);
          }
        } catch (err) {
          if (this.exportStatusHint) this.exportStatusHint.textContent = 'Export error: ' + err.message;
        }
      });
    }

    if (this.copyDataUrlBtn) {
      this.copyDataUrlBtn.addEventListener('click', async () => {
        try {
          if (this.exportStatusHint) this.exportStatusHint.textContent = 'Generating data URL...';
          const snap = await captureCanvasImage(this.previewCanvas, { format: 'png' });
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(snap.dataUrl);
            if (this.exportStatusHint) {
              this.exportStatusHint.textContent = 'Data URL copied to clipboard!';
              setTimeout(() => { if (this.exportStatusHint) this.exportStatusHint.textContent = ''; }, 3000);
            }
          } else if (typeof prompt !== 'undefined') {
            prompt('Copy Data URL:', snap.dataUrl);
          }
        } catch (err) {
          if (this.exportStatusHint) this.exportStatusHint.textContent = 'Copy failed: ' + err.message;
        }
      });
    }

    initAiProtocol(this);

    // 7. Initialize Responsive Toolbar Overflow Manager
    this.overflowManager = new CatWebOverflowManager(this);
    this.overflowManager.init();

    // 8. Load Initial Document
    const defaultKey = this.options.defaultSample;
    const initialContent = PRELOADED_SAMPLES[defaultKey] || PRELOADED_SAMPLES.interactive_counter;
    if (initialContent) {
      this.loadDocument(initialContent);
    }
  }

  /**
   * Loads, validates, and renders a CatWeb JSON string or object.
   *
   * @param {string|object|Array} rawJsonOrObj
   */
  loadDocument(rawJsonOrObj) {
    let parsedData = null;
    let jsonString = '';

    if (typeof rawJsonOrObj === 'string') {
      jsonString = rawJsonOrObj;
      try {
        parsedData = JSON.parse(rawJsonOrObj);
      } catch (err) {
        this.showSyntaxError(err, rawJsonOrObj);
        return;
      }
    } else if (rawJsonOrObj && typeof rawJsonOrObj === 'object') {
      parsedData = rawJsonOrObj;
      try {
        jsonString = JSON.stringify(rawJsonOrObj, null, 2);
      } catch {
        jsonString = '';
      }
    } else {
      return;
    }

    this.currentDocument = parsedData;

    // Update raw editor textarea
    if (this.editorTextarea && this.editorTextarea.value !== jsonString) {
      this.editorTextarea.value = jsonString;
    }

    // Run Semantic Validation
    const validation = validateCatWeb(parsedData);
    this.validationResult = validation;
    this.currentFormat = validation.format;

    // Surface diagnostics
    this.showDiagnostics(validation.errors || [], validation.warnings || []);

    // Clean up previous runtime
    if (this.runtime) {
      this.runtime.destroy();
      this.runtime = null;
    }

    // Clear preview canvas
    if (this.previewCanvas) {
      this.previewCanvas.innerHTML = '';
      this.previewCanvas.style.backgroundColor = '';
    }

    // Update Browser Window Chrome (Title, URL, Favicon)
    this._updateBrowserChrome(parsedData, validation.format);

    // Render CatWeb DOM tree
    let renderableData = parsedData;
    if (!validation.valid) {
      // Coerce/normalize for preview display so user can inspect invalid inputs
      try {
        renderableData = normalizeCatWeb(parsedData);
      } catch {
        renderableData = parsedData;
      }
    }

    if (this.previewCanvas) {
      renderCatWebTree(renderableData, this.previewCanvas);
    }

    // Initialize & Start Runtime
    if (this.previewCanvas) {
      this.runtime = new CatWebRuntime(renderableData, this.previewCanvas, {
        audioEnabled: this.audioEnabled
      });
      this.runtime.start();
    }

    // Update Inspector Registry
    if (this.inspector && this.previewCanvas) {
      this.inspector.setTree(renderableData, this.previewCanvas);
    }

    // Update Status Bar Statistics
    this._updateStatusBar(validation);

    // Apply Zoom / Fit
    this.setZoom(this.currentZoom);
  }

  /**
   * Updates simulated browser window title, URL bar, and site background.
   * @private
   */
  _updateBrowserChrome(data, format) {
    if (format === 'site' && data && !Array.isArray(data)) {
      if (this.pageTitle) {
        this.pageTitle.textContent = data.title ? `${data.title} — CatWeb` : 'CatWeb Site';
      }
      if (this.urlText) {
        const slug = (data.title || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        this.urlText.textContent = `catweb://${slug}.rbx`;
      }
      if (data.background && this.canvasStage) {
        this.canvasStage.style.backgroundColor = data.background;
      }
    } else {
      if (this.pageTitle) {
        this.pageTitle.textContent = 'Component Snippet — CatWeb';
      }
      if (this.urlText) {
        this.urlText.textContent = 'catweb://snippet.rbx';
      }
      if (this.canvasStage) {
        this.canvasStage.style.backgroundColor = '#0f0f11';
      }
    }
  }

  /**
   * Updates status bar counters and validation indicator.
   * @private
   */
  _updateStatusBar(validation) {
    if (this.statusInfo) {
      const stats = validation.stats || {};
      const elCount = stats.elementsCount ?? stats.elementCount ?? 0;
      const scCount = stats.scriptsCount ?? stats.scriptCount ?? 0;
      const gidCount = stats.globalIdsCount ?? stats.idCount ?? 0;
      const fmtLabel = validation.format === 'site' ? 'Full Site' : 'Snippet';

      this.statusInfo.textContent = `[${fmtLabel}] ${elCount} elements • ${scCount} scripts • ${gidCount} global IDs`;
    }

    if (this.statusValidation) {
      if (validation.valid) {
        this.statusValidation.className = 'cw-badge-pill success';
        this.statusValidation.innerHTML = '<span class="cw-status-dot"></span> Valid';
      } else {
        const errLen = validation.errors?.length || 0;
        this.statusValidation.className = 'cw-badge-pill error';
        this.statusValidation.innerHTML = `<span class="cw-status-dot error"></span> ${errLen} error${errLen === 1 ? '' : 's'}`;
      }
    }
  }

  /**
   * Surfaces syntax errors in raw JSON input.
   */
  showSyntaxError(err, rawText) {
    this.showDiagnostics([{
      code: 'JSON_SYNTAX_ERROR',
      path: '$',
      message: err.message,
      suggestion: 'Verify matching braces, brackets, and quotes in the JSON editor.'
    }]);

    if (this.statusValidation) {
      this.statusValidation.className = 'cw-badge-pill error';
      this.statusValidation.innerHTML = '<span class="cw-status-dot error"></span> Syntax error';
    }
  }

  /**
   * Populates structured diagnostic error cards.
   *
   * @param {Array<object>} errors
   * @param {Array<object>} [warnings=[]]
   */
  showDiagnostics(errors = [], warnings = []) {
    const checkIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const alertIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

    // Update toolbar button badge
    if (this.diagnosticsBtn) {
      if (errors.length === 0) {
        this.diagnosticsBtn.innerHTML = `${checkIcon}<span>Diagnostics</span>`;
        this.diagnosticsBtn.classList.remove('error');
      } else {
        this.diagnosticsBtn.innerHTML = `${alertIcon}<span>Diagnostics</span><span class="cw-count-pill">${errors.length}</span>`;
        this.diagnosticsBtn.classList.add('error');
      }
    }

    if (!this.diagnosticsDrawer) return;

    if (errors.length === 0 && warnings.length === 0) {
      this.diagnosticsDrawer.innerHTML = `
        <div class="cw-inspector-empty">
          <div class="cw-empty-icon" style="color: var(--cw-status-success);">${checkIcon}</div>
          <div class="cw-empty-title">All schema checks passed</div>
          <div class="cw-empty-sub">The document complies 100% with CatWeb invariants.</div>
        </div>
      `;
      return;
    }

    const cards = [];

    // Render error cards
    for (const err of errors) {
      const gidMatch = err.path?.match(/\[['"]?([\x20-\x7E]{2,3})['"]?\]/) || err.message?.match(/globalid ["']([^"']+)["']/);
      const gid = err.globalid || (gidMatch ? gidMatch[1] : null);

      cards.push(`
        <div class="cw-diag-card" data-gid="${gid || ''}">
          <div class="cw-diag-header">
            <span class="cw-diag-code">${escapeHtml(err.code || 'VALIDATION_ERROR')}</span>
            ${gid ? `<span class="cw-diag-gid">ID: ${escapeHtml(gid)}</span>` : ''}
          </div>
          <div class="cw-diag-path">${escapeHtml(err.path || '$')}</div>
          <div class="cw-diag-msg">${escapeHtml(err.message || '')}</div>
          ${err.suggestion ? `<div class="cw-diag-sug">${escapeHtml(err.suggestion)}</div>` : ''}
        </div>
      `);
    }

    // Render warning cards
    for (const warn of warnings) {
      cards.push(`
        <div class="cw-diag-card warning">
          <div class="cw-diag-header">
            <span class="cw-diag-code">${escapeHtml(warn.code || 'WARNING')}</span>
          </div>
          <div class="cw-diag-path">${escapeHtml(warn.path || '$')}</div>
          <div class="cw-diag-msg">${escapeHtml(warn.message || '')}</div>
          ${warn.suggestion ? `<div class="cw-diag-sug">${escapeHtml(warn.suggestion)}</div>` : ''}
        </div>
      `);
    }

    this.diagnosticsDrawer.innerHTML = `
      <div class="cw-diagnostics-list">
        ${cards.join('')}
      </div>
    `;

    // Attach click listeners to error cards to highlight offending element
    const renderedCards = this.diagnosticsDrawer.querySelectorAll('.cw-diag-card');
    for (const card of renderedCards) {
      const gid = card.getAttribute('data-gid');
      if (gid) {
        card.addEventListener('click', () => {
          this.selectElement(gid);
        });
      }
    }
  }

  /**
   * Sets canvas zoom scaling factor.
   *
   * @param {'fit'|number|string} zoom
   */
  setZoom(zoom) {
    this.currentZoom = zoom;
    if (!this.browserWindow || !this.viewportArea) return;

    let scale = 1.0;
    let label = '';

    const targetW = this.options.canvasWidth;
    const targetH = this.options.canvasHeight + 36; // include titlebar

    if (zoom === 'fit') {
      this.viewportArea.classList.remove('cw-scrollable');
      const areaW = Math.max(320, (this.viewportArea.clientWidth || 1000) - 48);
      const areaH = Math.max(240, (this.viewportArea.clientHeight || 700) - 48);

      const scaleX = areaW / targetW;
      const scaleY = areaH / targetH;
      scale = Math.min(scaleX, scaleY);
      label = `${targetW} × ${this.options.canvasHeight} (Fit ${Math.round(scale * 100)}%)`;
    } else {
      this.viewportArea.classList.add('cw-scrollable');
      scale = parseFloat(zoom) || 1.0;
      label = `${this.options.canvasWidth} × ${this.options.canvasHeight} (${Math.round(scale * 100)}%)`;
    }

    if (this.canvasZoomWrapper) {
      this.canvasZoomWrapper.style.width = `${Math.round(targetW * scale)}px`;
      this.canvasZoomWrapper.style.height = `${Math.round(targetH * scale)}px`;
      this.browserWindow.style.transformOrigin = '0 0';
    } else {
      this.browserWindow.style.transformOrigin = 'center center';
    }

    this.browserWindow.style.transform = `scale(${scale})`;

    if (this.statusResolution) {
      this.statusResolution.textContent = label;
    }

    if (this.zoomSelect && this.zoomSelect.value !== String(zoom)) {
      this.zoomSelect.value = String(zoom);
      this.zoomSelect._syncCustomSelect?.();
    }

    this.overflowManager?.renderMenuContent();

    if (this.inspector && this.inspector.selectedGlobalId) {
      this.inspector.repositionOverlays();
    }
  }

  /**
   * Handles window resize to maintain responsive Fit zoom.
   * @private
   */
  _onResize() {
    if (this.currentZoom === 'fit') {
      this.setZoom('fit');
    }
  }

  /**
   * Toggles Element Inspector mode & panel.
   * @param {boolean} [enable]
   */
  toggleInspector(enable = null) {
    const isEnabled = Boolean(this.inspector?.isEnabled());
    const nextState = enable !== null ? enable : !isEnabled;
    const isVisible = Boolean(this.inspectorPanel && !this.inspectorPanel.classList.contains('hidden'));

    if (nextState === isEnabled && nextState === isVisible) {
      return;
    }

    if (nextState) {
      this.inspector?.enable();
      if (this.inspectorPanel) this.inspectorPanel.classList.remove('hidden');
      if (this.inspectorBtn) this.inspectorBtn.classList.add('active');
      if (!this.inspector?.selectedGlobalId) {
        this.inspector?.switchTab('tree');
      }
    } else {
      this.inspector?.disable();
      if (this.inspectorPanel) this.inspectorPanel.classList.add('hidden');
      if (this.inspectorBtn) this.inspectorBtn.classList.remove('active');
    }

    this.overflowManager?.renderMenuContent();

    if (this.currentZoom === 'fit') {
      this.setZoom('fit');
    }
  }

  /**
   * Toggles Diagnostics panel visibility.
   * @param {boolean} [show]
   */
  toggleDiagnostics(show = null) {
    if (!this.diagnosticsPanel) return;
    const isHidden = this.diagnosticsPanel.classList.contains('hidden');
    const nextShow = show !== null ? show : isHidden;

    if (nextShow) {
      this.diagnosticsPanel.classList.remove('hidden');
      if (this.diagnosticsBtn) this.diagnosticsBtn.classList.add('active');
    } else {
      this.diagnosticsPanel.classList.add('hidden');
      if (this.diagnosticsBtn) this.diagnosticsBtn.classList.remove('active');
    }

    this.overflowManager?.renderMenuContent();

    if (this.currentZoom === 'fit') {
      this.setZoom('fit');
    }
  }

  /**
   * Toggles Raw JSON Editor panel.
   * @param {boolean} [show]
   */
  toggleEditor(show = null) {
    if (!this.editorPanel) return;
    const isHidden = this.editorPanel.classList.contains('hidden');
    const nextShow = show !== null ? show : isHidden;

    if (nextShow) {
      this.editorPanel.classList.remove('hidden');
      if (this.rawJsonBtn) this.rawJsonBtn.classList.add('active');
    } else {
      this.editorPanel.classList.add('hidden');
      if (this.rawJsonBtn) this.rawJsonBtn.classList.remove('active');
    }

    this.overflowManager?.renderMenuContent();

    if (this.currentZoom === 'fit') {
      this.setZoom('fit');
    }
  }

  /**
   * Selects and highlights an element by global ID.
   * @param {string} globalid
   */
  selectElement(globalid) {
    this.toggleInspector(true);
    if (this.inspector) {
      this.inspector.selectElement(globalid);
    }
  }

  /**
   * Destroys application and listeners.
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._boundOnResize);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this.overflowManager) {
      this.overflowManager.destroy();
      this.overflowManager = null;
    }
    if (this.sampleSelectCtrl) {
      this.sampleSelectCtrl.destroy();
      this.sampleSelectCtrl = null;
    }
    if (this.zoomSelectCtrl) {
      this.zoomSelectCtrl.destroy();
      this.zoomSelectCtrl = null;
    }
    if (this.runtime) {
      this.runtime.destroy();
      this.runtime = null;
    }
    if (this.inspector) {
      this.inspector.destroy();
      this.inspector = null;
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Auto-bootstrap in browser environment if index.html is loaded
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const startApp = () => {
    if (!window.__CATWEB_APP__) {
      const app = new CatWebRunnerApp(document.body);
      app.init();
      window.__CATWEB_APP__ = app;
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
}
