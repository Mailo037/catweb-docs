/**
 * CatWeb Visual Elements Engine & DOM Factory
 *
 * Implements DOM element creation and tree rendering for all CatWeb visual elements:
 *   - Frame (containers with background, opacity, clipping)
 *   - ScrollingFrame (scrollable containers with auto/UDim2 canvas and custom scrollbars)
 *   - TextLabel, TextButton, TextBox (RichText, scaling, alignments, input states)
 *   - Button Subtypes (?link, ?transfer, ?avataritem, ?donation)
 *   - ImageLabel, ImageButton (3-tier asset fallback, tinting, scaling)
 *   - Direct integration with coordinates.js, layout.js, styling.js, and assets.js.
 *
 * Compatible with modern browsers and Node.js (via Mock DOM).
 * Zero external dependencies.
 */

import {
  parseUDim,
  parseUDim2,
  parseVector2,
  udim2ToCss,
  formatUDimCss,
  resolveElementSizeCss,
  anchorToCss,
  zIndexToCss
} from './coordinates.js';

import {
  applyLayoutModifiers as applyLayoutModEngine,
  computeContainerLayout,
  computeChildLayout,
  extractModifiers,
  sortChildrenByLayoutOrder,
  resolveFlexItemStyles,
  resolveConstraintStyles,
  isModifierClass,
  isVisualClass
} from './layout.js';

import {
  applyUICorner,
  applyUIStroke,
  applyUIGradient,
  applyUIPadding,
  applyBackgroundStyling,
  applyTextStyling,
  hexToRgba
} from './styling.js';

import {
  resolveRobloxAsset,
  KNOWN_LUCIDE_ICONS,
  KNOWN_AUDIO_ASSETS,
  getLucideSvg,
  getProceduralAssetBadgeSvg
} from './assets.js';

/**
 * Gets the active DOM document instance (supporting browser global, context, or fallback).
 *
 * @param {object} [context]
 * @returns {Document}
 */
export function getActiveDocument(context = {}) {
  if (context?.document) return context.document;
  if (typeof document !== 'undefined') return document;
  if (typeof globalThis !== 'undefined' && globalThis.document) return globalThis.document;

  // Standalone lightweight Mock Document for bare Node environments without harness
  return createFallbackMockDocument();
}

/**
 * Minimal fallback mock document for standalone Node execution.
 */
function createFallbackMockDocument() {
  class MinimalMockElement {
    constructor(tagName) {
      this.tagName = (tagName || 'DIV').toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.attributes = {};
      this.dataset = {};
      this.listeners = {};
      this.style = {};
      this.classList = {
        _classes: new Set(),
        add(...cls) { cls.forEach(c => this._classes.add(c)); },
        remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
        contains(c) { return this._classes.has(c); },
        get value() { return Array.from(this._classes).join(' '); },
        set value(v) { this._classes = new Set((v || '').split(/\s+/).filter(Boolean)); }
      };
      this._textContent = '';
      this._value = '';
      this._innerHTML = '';
    }

    get className() { return this.classList.value; }
    set className(val) { this.classList.value = val; }

    get textContent() {
      if (this.children.length === 0) return this._textContent;
      return this.children.map(c => c.textContent).join('');
    }
    set textContent(val) {
      this._textContent = String(val);
      this.children = [];
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) { this._innerHTML = String(val); }

    get value() { return this._value; }
    set value(v) { this._value = String(v); }

    setAttribute(name, val) {
      this.attributes[name] = String(val);
      if (name.startsWith('data-')) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        this.dataset[key] = String(val);
      }
      if (name === 'class') this.className = val;
    }

    getAttribute(name) {
      if (name in this.attributes) return this.attributes[name];
      if (name === 'class') return this.className;
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
    }

    appendChild(child) {
      if (!child) return child;
      if (child.parentNode) child.parentNode.removeChild(child);
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

    addEventListener(type, fn) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(fn);
    }

    removeEventListener(type, fn) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter(l => l !== fn);
    }

    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event.type;
      const fns = this.listeners[type] || [];
      for (const fn of fns) fn(event);
      return true;
    }

    click() {
      this.dispatchEvent({ type: 'click', target: this });
    }

    querySelector(selector) {
      const matches = this.querySelectorAll(selector);
      return matches.length > 0 ? matches[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];
      const match = (el) => {
        if (!el || typeof el.getAttribute !== 'function') return false;
        if (selector.startsWith('[data-globalid="') && selector.endsWith('"]')) {
          const gid = selector.slice(17, -2);
          return el.getAttribute('data-globalid') === gid;
        }
        if (selector.startsWith('[data-alias="') && selector.endsWith('"]')) {
          const alias = selector.slice(13, -2);
          return el.getAttribute('data-alias') === alias;
        }
        if (selector.startsWith('.')) {
          return el.classList.contains(selector.slice(1));
        }
        return false;
      };

      const traverse = (node) => {
        for (const child of node.children) {
          if (match(child)) results.push(child);
          traverse(child);
        }
      };
      traverse(this);
      return results;
    }
  }

  return {
    createElement(tag) {
      return new MinimalMockElement(tag);
    }
  };
}

/**
 * Sanitizes and renders basic Roblox RichText markup tags.
 * Supports: <b>, <i>, <u>, <s>, and <font color="...">.
 *
 * @param {string} text
 * @returns {string} Safe HTML string
 */
export function renderRichText(text) {
  if (!text) return '';
  let safe = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  safe = safe
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<b>$1</b>')
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<i>$1</i>')
    .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>')
    .replace(/&lt;s&gt;(.*?)&lt;\/s&gt;/gi, '<s>$1</s>')
    .replace(/&lt;font\s+color=["']?(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)["']?&gt;(.*?)&lt;\/font&gt;/gi, '<span style="color:$1">$2</span>');

  return safe;
}

/**
 * Dynamic font scaling calculator for TextScaled elements.
 * Estimates optimal font size fitting bounding container dimensions.
 *
 * @param {string} text
 * @param {number} containerWidth
 * @param {number} containerHeight
 * @param {object} [options]
 * @returns {number} Optimal font size in pixels
 */
export function computeTextScaledFontSize(text, containerWidth, containerHeight, options = {}) {
  const minSize = options.minSize || 8;
  const maxSize = options.maxSize || 120;
  if (!text || containerWidth <= 0 || containerHeight <= 0) return minSize;

  let low = minSize;
  let high = maxSize;
  let optimal = minSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const charW = mid * 0.55;
    const lineH = mid * 1.25;
    const charsPerLine = Math.max(1, Math.floor(containerWidth / charW));
    const lines = String(text).split('\n');
    let totalLines = 0;
    let maxLineW = 0;

    for (const l of lines) {
      const len = l.length || 1;
      maxLineW = Math.max(maxLineW, len * charW);
      totalLines += Math.ceil(len / charsPerLine);
    }

    const fitsW = options.wrap ? true : maxLineW <= containerWidth;
    const fitsH = (totalLines * lineH) <= containerHeight;

    if (fitsW && fitsH) {
      optimal = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return optimal;
}

/**
 * Factory and renderer for a single CatWeb element node into DOM.
 *
 * @param {object} elementNode - CatWeb element definition object
 * @param {HTMLElement} [parentDomElement=null] - Optional parent DOM node to append into
 * @param {object} [context={}] - Context containing document or runtime handles
 * @returns {HTMLElement|null} The created DOM element
 */
export function renderElement(elementNode, parentDomElement = null, context = {}) {
  if (!elementNode || !elementNode.class) return null;

  const doc = getActiveDocument(context);
  const fullClass = String(elementNode.class).trim();
  const [baseClass, subtype] = fullClass.split('?');

  // Create base element container
  const el = doc.createElement('div');
  const classSlug = baseClass.toLowerCase().replace(/[^a-z0-9]/g, '-');
  el.className = `cw-node cw-${classSlug}`;

  // Preserve core metadata attributes for inspection & scripting
  if (elementNode.globalid) {
    el.setAttribute('data-globalid', elementNode.globalid);
  }
  if (elementNode.alias) {
    el.setAttribute('data-alias', elementNode.alias);
  }
  if (elementNode.order !== undefined) {
    el.setAttribute('data-order', String(elementNode.order));
  }

  // Button subtype handling (?link, ?transfer, ?avataritem, ?donation)
  if (subtype) {
    el.setAttribute('data-subtype', subtype);
    el.classList.add(`cw-subtype-${subtype}`);

    if (elementNode.href) el.setAttribute('data-href', elementNode.href);
    if (elementNode.new_tab) el.setAttribute('data-new-tab', elementNode.new_tab);
    if (elementNode.robux_amount) el.setAttribute('data-robux', elementNode.robux_amount);
    if (elementNode.product) el.setAttribute('data-product', elementNode.product);
    if (elementNode.product_type) el.setAttribute('data-product-type', elementNode.product_type);
  }

  // Positioning via UDim2
  if (elementNode.position) {
    const uPos = parseUDim2(elementNode.position);
    el.style.left = formatUDimCss(uPos.scaleX, uPos.offsetX);
    el.style.top = formatUDimCss(uPos.scaleY, uPos.offsetY);
    el.style.position = 'absolute';
  }

  // Sizing via UDim2 or auto keywords
  if (elementNode.size) {
    if (elementNode.size === 'auto') {
      el.style.width = 'fit-content';
      el.style.height = 'fit-content';
    } else if (elementNode.size === 'auto_y') {
      el.style.height = 'auto';
      if (elementNode.width) {
        try {
          const uW = parseUDim(elementNode.width);
          el.style.width = formatUDimCss(uW.scale, uW.offset);
        } catch {
          el.style.width = '100%';
        }
      } else {
        el.style.width = '100%';
      }
    } else if (elementNode.size === 'auto_x') {
      el.style.width = 'auto';
      if (elementNode.height) {
        try {
          const uH = parseUDim(elementNode.height);
          el.style.height = formatUDimCss(uH.scale, uH.offset);
        } catch {
          el.style.height = 'auto';
        }
      } else {
        el.style.height = 'auto';
      }
    } else {
      const uSz = parseUDim2(elementNode.size);
      el.style.width = formatUDimCss(uSz.scaleX, uSz.offsetX);
      el.style.height = formatUDimCss(uSz.scaleY, uSz.offsetY);
    }
  }

  // AnchorPoint translation & rotation
  if (elementNode.anchor || elementNode.rotation) {
    const a = anchorToCss(elementNode.anchor, elementNode.rotation);
    el.style.transformOrigin = a.transformOrigin;
    el.style.transform = a.transform;
  }

  // Background color & transparency (Roblox GUI semantics: affects ONLY this element, NEVER children)
  applyBackgroundStyling(el, elementNode.background_color, elementNode.background_transparency);

  // Visibility & Z-Index
  if (elementNode.visible === 'false') {
    el.style.display = 'none';
  }
  if (elementNode.z_index !== undefined) {
    el.style.zIndex = String(elementNode.z_index);
  }

  // Canvas / Clipping
  if (elementNode.canvas === 'true') {
    el.style.overflow = 'hidden';
  }

  // Class-Specific Attributes & Tag specialization
  if (baseClass === 'ScrollingFrame') {
    el.style.overflowY = 'auto';
    el.style.overflowX = 'hidden';
    if (elementNode.scrollbar_thickness) {
      el.style.scrollbarWidth = `${elementNode.scrollbar_thickness}px`;
    }
    if (elementNode.canvassize) {
      el.setAttribute('data-canvassize', elementNode.canvassize);
    }
  } else if (baseClass === 'TextLabel' || baseClass === 'TextButton' || baseClass === 'TextBox') {
    if (elementNode.text !== undefined) {
      el.textContent = elementNode.text;
      el.value = elementNode.text;
    }
    const fontTrans = elementNode.font_transparency !== undefined ? elementNode.font_transparency : elementNode.text_transparency;
    applyTextStyling(el, elementNode.font_color, fontTrans);

    if (elementNode.font_size) {
      if (elementNode.font_size === 'scaled') {
        el.setAttribute('data-text-scaled', 'true');
      } else {
        el.style.fontSize = `${elementNode.font_size}px`;
      }
    }
    if (elementNode.font_weight) {
      el.style.fontWeight = elementNode.font_weight;
    }
    if (elementNode.align_x) {
      el.style.textAlign = elementNode.align_x.toLowerCase();
    }
    if (elementNode.wrap === 'true') {
      el.style.whiteSpace = 'normal';
      el.style.wordBreak = 'break-word';
    }

    if (elementNode.truncate === 'AtEnd') {
      el.style.textOverflow = 'ellipsis';
      el.style.overflow = 'hidden';
      el.style.whiteSpace = 'nowrap';
    } else if (elementNode.truncate === 'SplitWord') {
      el.style.wordBreak = 'break-all';
    }

    if (elementNode.rich === 'true' && elementNode.text) {
      el.innerHTML = renderRichText(elementNode.text);
    }

    if (baseClass === 'TextBox') {
      if (elementNode.placeholder) {
        el.setAttribute('placeholder', elementNode.placeholder);
      }
      if (elementNode.editable === 'false') {
        el.setAttribute('readonly', 'true');
      }
    }

    if (baseClass === 'TextButton') {
      el.style.cursor = 'pointer';
      el.style.userSelect = 'none';
    }
  } else if (baseClass === 'ImageLabel' || baseClass === 'ImageButton') {
    const assetId = elementNode.image_id || elementNode.image;
    const resolved = resolveRobloxAsset(assetId);
    el.setAttribute('data-asset-type', resolved.type);

    if (resolved.type === 'svg' || resolved.type === 'badge') {
      el.innerHTML = resolved.content;
    }

    if (elementNode.scale_type) {
      el.setAttribute('data-scale-type', elementNode.scale_type);
    }

    if (elementNode.image_color) {
      el.style.color = elementNode.image_color;
    }

    if (elementNode.image_transparency !== undefined) {
      const itrans = Math.max(0, Math.min(1, parseFloat(elementNode.image_transparency) || 0));
      const innerImg = el.querySelector?.('svg, img, .cw-asset-badge');
      if (innerImg && innerImg.style) {
        innerImg.style.opacity = String(1 - itrans);
      } else {
        el.style.opacity = String(1 - itrans);
      }
    }

    if (baseClass === 'ImageButton') {
      el.style.cursor = 'pointer';
      el.style.userSelect = 'none';
    }
  }

  // Modifiers & Children Processing
  const visualChildren = [];
  const layoutModifiers = [];

  if (Array.isArray(elementNode.children)) {
    for (const childNode of elementNode.children) {
      if (!childNode || typeof childNode !== 'object') continue;
      const childCls = childNode.class;

      if (childCls === 'UICorner') {
        applyUICorner(el, childNode);
      } else if (childCls === 'UIStroke') {
        applyUIStroke(el, childNode);
      } else if (childCls === 'UIGradient') {
        applyUIGradient(el, childNode);
      } else if (childCls === 'UIFlexItem') {
        // UIFlexItem directly modifies this container when declared as child
        if (childNode.grow_ratio) el.style.flexGrow = String(childNode.grow_ratio);
        if (childNode.shrink_ratio) el.style.flexShrink = String(childNode.shrink_ratio);
        if (childNode.flex_mode === 'Fill') {
          el.style.flex = '1 1 0%';
        } else if (childNode.flex_mode === 'Grow') {
          el.style.flexGrow = '1';
        } else if (childNode.flex_mode === 'Shrink') {
          el.style.flexShrink = '1';
        }
      } else if (childCls === 'UIAspectRatioConstraint') {
        if (childNode.ratio) el.style.aspectRatio = String(childNode.ratio);
      } else if (childCls === 'UISizeConstraint') {
        if (childNode.min_size) {
          const min = parseVector2(childNode.min_size);
          if (min.x > 0) el.style.minWidth = `${min.x}px`;
          if (min.y > 0) el.style.minHeight = `${min.y}px`;
        }
        if (childNode.max_size) {
          const max = parseVector2(childNode.max_size);
          if (max.x > 0 && max.x < 100000) el.style.maxWidth = `${max.x}px`;
          if (max.y > 0 && max.y < 100000) el.style.maxHeight = `${max.y}px`;
        }
      } else if (childCls === 'UIListLayout' || childCls === 'UIGridLayout' || childCls === 'UIPadding') {
        layoutModifiers.push(childNode);
      } else if (childCls !== 'Folder' && childCls !== 'script') {
        visualChildren.push(childNode);
      }
    }
  }

  // Apply layout modifiers (UIListLayout, UIGridLayout, UIPadding) to container
  let hasFlexLayout = false;
  let hasGridLayout = false;

  for (const mod of layoutModifiers) {
    if (mod.class === 'UIListLayout') {
      hasFlexLayout = true;
      const isHoriz = mod.direction === 'Horizontal';
      el.style.display = 'flex';
      el.style.flexDirection = isHoriz ? 'row' : 'column';

      if (mod.padding) {
        try {
          const p = parseUDim(mod.padding);
          el.style.gap = `${p.offset}px`;
        } catch { /* ignore */ }
      }

      const alignH = mod.alignment_horizontal || 'Left';
      const alignV = mod.alignment_vertical || 'Top';

      if (isHoriz) {
        el.style.justifyContent = alignH === 'Center' ? 'center' : (alignH === 'Right' ? 'flex-end' : 'flex-start');
        el.style.alignItems = alignV === 'Center' ? 'center' : (alignV === 'Bottom' ? 'flex-end' : 'flex-start');
      } else {
        el.style.alignItems = alignH === 'Center' ? 'center' : (alignH === 'Right' ? 'flex-end' : 'flex-start');
        el.style.justifyContent = alignV === 'Center' ? 'center' : (alignV === 'Bottom' ? 'flex-end' : 'flex-start');
      }

      if (mod.wrap_list === 'true') {
        el.style.flexWrap = 'wrap';
      }
    } else if (mod.class === 'UIGridLayout') {
      hasGridLayout = true;
      el.style.display = 'grid';

      let cellW = 100;
      let cellH = 100;
      if (mod.size) {
        try {
          const s = parseUDim2(mod.size);
          cellW = s.offsetX || 100;
          cellH = s.offsetY || 100;
        } catch { /* ignore */ }
      }

      let gapX = 0;
      let gapY = 0;
      if (mod.padding) {
        try {
          if (mod.padding.startsWith('{')) {
            const p = parseUDim2(mod.padding);
            gapX = p.offsetX;
            gapY = p.offsetY;
          } else {
            const p = parseUDim(mod.padding);
            gapX = p.offset;
            gapY = p.offset;
          }
        } catch { /* ignore */ }
      }

      el.style.gridTemplateColumns = `repeat(auto-fill, minmax(${cellW}px, 1fr))`;
      el.style.gridAutoRows = `${cellH}px`;
      el.style.gap = `${gapY}px ${gapX}px`;
    } else if (mod.class === 'UIPadding') {
      applyUIPadding(el, mod);
    }
  }

  // Render visual children into container
  for (const childNode of visualChildren) {
    const renderedChild = renderElement(childNode, el, context);
    if (renderedChild) {
      if (hasFlexLayout || hasGridLayout) {
        renderedChild.style.position = 'relative';
        const orderVal = parseInt(childNode.order ?? renderedChild.getAttribute?.('data-order') ?? 0, 10) || 0;
        renderedChild.style.order = String(orderVal);

        if (hasGridLayout) {
          renderedChild.style.width = '100%';
          renderedChild.style.height = '100%';
        }
      }
    }
  }

  if (parentDomElement && typeof parentDomElement.appendChild === 'function') {
    parentDomElement.appendChild(el);
  }

  return el;
}

/**
 * Renders an entire CatWeb document (Full Site or Component Snippet) into a target container.
 *
 * @param {object|Array} catWebDoc - Parsed CatWeb site object or snippet array
 * @param {HTMLElement} targetContainer - Target DOM element
 * @param {object} [context={}]
 * @returns {Array<HTMLElement>} Created root elements
 */
export function renderCatWebTree(catWebDoc, targetContainer, context = {}) {
  if (!catWebDoc || !targetContainer) return [];

  const createdRoots = [];

  if (Array.isArray(catWebDoc)) {
    // Component Snippet: multiple root elements
    for (const item of catWebDoc) {
      const el = renderElement(item, targetContainer, context);
      if (el) createdRoots.push(el);
    }
  } else if (catWebDoc && typeof catWebDoc === 'object') {
    // Full Site: apply background and render webcontent
    if (catWebDoc.background) {
      targetContainer.style.backgroundColor = catWebDoc.background;
    }
    const webcontent = Array.isArray(catWebDoc.webcontent) ? catWebDoc.webcontent : [];
    for (const item of webcontent) {
      const el = renderElement(item, targetContainer, context);
      if (el) createdRoots.push(el);
    }
  }

  return createdRoots;
}
