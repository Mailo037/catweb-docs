/**
 * CatWeb Test Reference Adapter
 * Bridges test suites with production modules in web-runner/src/ (when present)
 * or authoritative specification reference shims (during earlier milestones).
 */

import { validateCatWeb, VALID_CLASSES, VALID_SCRIPT_PROPERTIES, VALID_VALUES } from '../../tools/validate.js';
import { getDocument, MockElement } from './harness.js';
import { applyBackgroundStyling, applyTextStyling } from '../src/styling.js';

// Curated 84 Lucide icon asset IDs from game/Assets.md
export const KNOWN_LUCIDE_ICONS = new Map([
  ['128490289676597', 'house'],
  ['76297972789266', 'search'],
  ['117017076630548', 'user-round'],
  ['123045282429289', 'settings'],
  ['114078871101444', 'mail'],
  ['73775766036081', 'star'],
  ['81821025513215', 'heart'],
  ['132053311021067', 'arrow-left'],
  ['86341424256591', 'arrow-right'],
  ['128762341789893', 'plus'],
  ['97241930499310', 'x'],
  ['130734329855948', 'bell'],
  ['99802726511524', 'check'],
  ['122444800533384', 'external-link'],
  ['130977740797889', 'copy'],
  ['99601667182985', 'lock'],
  ['107783162934966', 'image-default'],
  ['70877710889686', 'sample-badge'],
  ['16944769468', 'catweb-favicon']
]);

// Confirmed UI Audio Asset IDs from game/Assets.md
export const KNOWN_AUDIO_ASSETS = new Map([
  ['88442833509532', { name: 'click', freq: 600, duration: 0.05 }],
  ['107511012621133', { name: 'hover', freq: 440, duration: 0.03 }],
  ['94316899429786', { name: 'toggle', freq: 750, duration: 0.06 }],
  ['136211732441165', { name: 'success', freq: 880, duration: 0.2 }],
  ['131661013076677', { name: 'error', freq: 220, duration: 0.25 }],
  ['131039887376992', { name: 'notification', freq: 520, duration: 0.15 }],
  ['5485567028', { name: 'send', freq: 660, duration: 0.1 }],
  ['119137729729534', { name: 'transition', freq: 330, duration: 0.18 }]
]);

/* ============================================================
 * MODULE RESOLUTION & FALLBACK IMPLEMENTATION
 * ============================================================ */

// 1. Ingestion & Validation
export function validateInput(rawJson) {
  let data = null;
  let format = 'invalid';

  if (typeof rawJson === 'string') {
    try {
      data = JSON.parse(rawJson);
    } catch (err) {
      return {
        valid: false,
        format: 'invalid',
        data: null,
        errors: [{ path: '$', code: 'JSON_SYNTAX_ERROR', message: err.message }],
        warnings: [],
        stats: { elementCount: 0, scriptCount: 0, idCount: 0 }
      };
    }
  } else if (rawJson && typeof rawJson === 'object') {
    data = rawJson;
  } else {
    return {
      valid: false,
      format: 'invalid',
      data: null,
      errors: [{ path: '$', code: 'INVALID_INPUT_TYPE', message: 'Input must be a JSON string or object/array' }],
      warnings: [],
      stats: { elementCount: 0, scriptCount: 0, idCount: 0 }
    };
  }

  const res = validateCatWeb(data, { strict: true });
  return {
    valid: res.valid,
    format: res.format,
    data,
    errors: res.errors,
    warnings: res.warnings,
    stats: {
      elementCount: res.stats?.elementsCount ?? 0,
      scriptCount: res.stats?.scriptsCount ?? 0,
      idCount: res.stats?.globalIdsCount ?? 0,
      elementsCount: res.stats?.elementsCount ?? 0,
      scriptsCount: res.stats?.scriptsCount ?? 0,
      globalIdsCount: res.stats?.globalIdsCount ?? 0,
      ...res.stats
    }
  };
}

export function normalizeInput(inputData) {
  if (!inputData) return inputData;
  const clone = JSON.parse(JSON.stringify(inputData));

  function normalizeNode(node) {
    if (!node || typeof node !== 'object') return;

    // Coerce layout_order -> order
    if ('layout_order' in node) {
      if (!('order' in node)) {
        node.order = String(node.layout_order);
      }
      delete node.layout_order;
    }

    // Coerce cell_size -> size on UIGridLayout
    if (node.class === 'UIGridLayout' && 'cell_size' in node) {
      if (!('size' in node)) {
        node.size = String(node.cell_size);
      }
      delete node.cell_size;
    }

    // Coerce anchor_point -> anchor
    if ('anchor_point' in node) {
      if (!('anchor' in node)) {
        node.anchor = String(node.anchor_point);
      }
      delete node.anchor_point;
    }

    // Coerce raw numbers & booleans to strings
    for (const key of Object.keys(node)) {
      if (key === 'children' || key === 'content' || key === 'webcontent' || key === 'actions' || key === 'text') continue;
      const val = node[key];
      if (typeof val === 'number') {
        node[key] = String(val);
      } else if (typeof val === 'boolean') {
        node[key] = val ? 'true' : 'false';
      } else if (typeof val === 'string' && /^[0-9a-fA-F]{6}$/.test(val) && key.includes('color')) {
        node[key] = '#' + val;
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) normalizeNode(child);
    }
  }

  if (Array.isArray(clone)) {
    for (const item of clone) normalizeNode(item);
  } else if (clone && typeof clone === 'object') {
    if (Array.isArray(clone.webcontent)) {
      for (const item of clone.webcontent) normalizeNode(item);
    }
    if (clone.background && /^[0-9a-fA-F]{6}$/.test(clone.background)) {
      clone.background = '#' + clone.background;
    }
  }
  return clone;
}

// 2. Coordinate & Layout Engine
const UDIM2_REGEX = /^\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}\s*,\s*\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}$/;
const UDIM_REGEX = /^(-?[\d.]+)\s*,\s*(-?[\d.]+)$/;
const VECTOR2_REGEX = /^(-?[\d.]+)\s*,\s*(-?[\d.]+)$/;

export function parseUDim2(str) {
  if (typeof str !== 'string') throw new Error(`parseUDim2 requires string, received ${typeof str}`);
  const match = str.trim().match(UDIM2_REGEX);
  if (!match) throw new Error(`Invalid UDim2 coordinate format: "${str}"`);
  return {
    scaleX: parseFloat(match[1]),
    offsetX: parseFloat(match[2]),
    scaleY: parseFloat(match[3]),
    offsetY: parseFloat(match[4])
  };
}

export function parseUDim(str) {
  if (typeof str !== 'string') throw new Error(`parseUDim requires string, received ${typeof str}`);
  const match = str.trim().match(UDIM_REGEX);
  if (!match) throw new Error(`Invalid UDim format: "${str}"`);
  return {
    scale: parseFloat(match[1]),
    offset: parseFloat(match[2])
  };
}

export function parseVector2(str) {
  if (typeof str !== 'string') throw new Error(`parseVector2 requires string, received ${typeof str}`);
  const match = str.trim().match(VECTOR2_REGEX);
  if (!match) throw new Error(`Invalid Vector2 format: "${str}"`);
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2])
  };
}

export function udim2ToCss(udim2Str, isPosition = false) {
  if (!udim2Str || udim2Str === 'auto' || udim2Str === 'auto_x' || udim2Str === 'auto_y') {
    return { left: '0px', top: '0px', width: 'auto', height: 'auto' };
  }
  const u = parseUDim2(udim2Str);
  const xProp = isPosition ? 'left' : 'width';
  const yProp = isPosition ? 'top' : 'height';
  return {
    [xProp]: `calc(${u.scaleX * 100}% + ${u.offsetX}px)`,
    [yProp]: `calc(${u.scaleY * 100}% + ${u.offsetY}px)`
  };
}

export function anchorToCss(anchorStr, rotationDeg = 0) {
  let ax = 0;
  let ay = 0;
  if (anchorStr) {
    const v = parseVector2(anchorStr);
    ax = v.x;
    ay = v.y;
  }
  const rot = parseFloat(rotationDeg) || 0;
  const transformOrigin = `calc(${ax * 100}%) calc(${ay * 100}%)`;
  const transform = `translate(calc(-1 * ${ax * 100}%), calc(-1 * ${ay * 100}%)) rotate(${rot}deg)`;
  return { transformOrigin, transform };
}

export function applyLayoutModifiers(containerElement, layoutModifierNode, childrenList = []) {
  if (!containerElement || !layoutModifierNode) return;
  const modClass = layoutModifierNode.class;

  if (modClass === 'UIListLayout') {
    const isHoriz = layoutModifierNode.direction === 'Horizontal';
    containerElement.style.display = 'flex';
    containerElement.style.flexDirection = isHoriz ? 'row' : 'column';

    let gapPx = 0;
    if (layoutModifierNode.padding) {
      try {
        const p = parseUDim(layoutModifierNode.padding);
        gapPx = p.offset;
        containerElement.style.gap = `${p.offset}px`;
      } catch { /* ignore */ }
    }

    const alignH = layoutModifierNode.alignment_horizontal || 'Left';
    const alignV = layoutModifierNode.alignment_vertical || 'Top';

    if (isHoriz) {
      containerElement.style.justifyContent = alignH === 'Center' ? 'center' : (alignH === 'Right' ? 'flex-end' : 'flex-start');
      containerElement.style.alignItems = alignV === 'Center' ? 'center' : (alignV === 'Bottom' ? 'flex-end' : 'flex-start');
    } else {
      containerElement.style.alignItems = alignH === 'Center' ? 'center' : (alignH === 'Right' ? 'flex-end' : 'flex-start');
      containerElement.style.justifyContent = alignV === 'Center' ? 'center' : (alignV === 'Bottom' ? 'flex-end' : 'flex-start');
    }

    if (layoutModifierNode.wrap_list === 'true') {
      containerElement.style.flexWrap = 'wrap';
    }

    // Sort children by order
    for (let i = 0; i < childrenList.length; i++) {
      const child = childrenList[i];
      if (child.style) {
        child.style.position = 'relative';
        const ord = parseInt(child.getAttribute?.('data-order') || child.dataset?.order || '0', 10);
        child.style.order = String(ord);
      }
    }
  } else if (modClass === 'UIGridLayout') {
    containerElement.style.display = 'grid';
    let cellW = 100;
    let cellH = 100;
    if (layoutModifierNode.size) {
      try {
        const s = parseUDim2(layoutModifierNode.size);
        cellW = s.offsetX || 100;
        cellH = s.offsetY || 100;
      } catch { /* ignore */ }
    }

    let gapX = 0;
    let gapY = 0;
    if (layoutModifierNode.padding) {
      try {
        if (layoutModifierNode.padding.startsWith('{')) {
          const p = parseUDim2(layoutModifierNode.padding);
          gapX = p.offsetX;
          gapY = p.offsetY;
        } else {
          const p = parseUDim(layoutModifierNode.padding);
          gapX = p.offset;
          gapY = p.offset;
        }
      } catch { /* ignore */ }
    }

    containerElement.style.gridTemplateColumns = `repeat(auto-fill, minmax(${cellW}px, 1fr))`;
    containerElement.style.gridAutoRows = `${cellH}px`;
    containerElement.style.gap = `${gapY}px ${gapX}px`;

    for (const child of childrenList) {
      if (child.style) {
        child.style.position = 'relative';
        const ord = parseInt(child.getAttribute?.('data-order') || child.dataset?.order || '0', 10);
        child.style.order = String(ord);
      }
    }
  } else if (modClass === 'UIPadding') {
    const parseSide = (val) => {
      if (!val) return '0px';
      try {
        const u = parseUDim(val);
        return `calc(${u.scale * 100}% + ${u.offset}px)`;
      } catch {
        return '0px';
      }
    };
    if (layoutModifierNode.top) containerElement.style.paddingTop = parseSide(layoutModifierNode.top);
    if (layoutModifierNode.bottom) containerElement.style.paddingBottom = parseSide(layoutModifierNode.bottom);
    if (layoutModifierNode.left) containerElement.style.paddingLeft = parseSide(layoutModifierNode.left);
    if (layoutModifierNode.right) containerElement.style.paddingRight = parseSide(layoutModifierNode.right);
  } else if (modClass === 'UIFlexItem') {
    if (layoutModifierNode.grow_ratio) {
      containerElement.style.flexGrow = String(layoutModifierNode.grow_ratio);
    }
    if (layoutModifierNode.shrink_ratio) {
      containerElement.style.flexShrink = String(layoutModifierNode.shrink_ratio);
    }
    if (layoutModifierNode.flex_mode === 'Fill') {
      containerElement.style.flex = '1 1 0%';
    } else if (layoutModifierNode.flex_mode === 'Grow') {
      containerElement.style.flexGrow = '1';
    } else if (layoutModifierNode.flex_mode === 'Shrink') {
      containerElement.style.flexShrink = '1';
    }
  }
}

// 3. Visual Elements & Styling
export function resolveRobloxAsset(assetStrOrId) {
  if (!assetStrOrId) {
    return { type: 'badge', content: '<svg class="cw-asset-badge"><text>NO ASSET</text></svg>' };
  }
  let id = String(assetStrOrId);
  const match = id.match(/(\d+)/);
  if (match) id = match[1];

  if (KNOWN_LUCIDE_ICONS.has(id)) {
    const iconName = KNOWN_LUCIDE_ICONS.get(id);
    return {
      type: 'svg',
      iconName,
      content: `<svg class="cw-icon cw-icon-${iconName}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M...icon" /></svg>`
    };
  }

  if (KNOWN_AUDIO_ASSETS.has(id)) {
    const audioInfo = KNOWN_AUDIO_ASSETS.get(id);
    return {
      type: 'audio',
      id,
      name: audioInfo.name,
      freq: audioInfo.freq,
      duration: audioInfo.duration
    };
  }

  return {
    type: 'badge',
    id,
    content: `<svg class="cw-asset-fallback" viewBox="0 0 100 100"><rect width="100" height="100" fill="#27272a" /><text x="50" y="50" fill="#a1a1aa" font-size="10" text-anchor="middle">RBX ${id}</text></svg>`
  };
}

export function applyUICorner(domElement, cornerNode) {
  if (!domElement || !cornerNode || !cornerNode.radius) return;
  try {
    const u = parseUDim(cornerNode.radius);
    if (u.scale >= 1) {
      domElement.style.borderRadius = '9999px';
    } else if (u.scale > 0 && u.offset === 0) {
      domElement.style.borderRadius = `${u.scale * 100}%`;
    } else if (u.scale > 0 && u.offset > 0) {
      domElement.style.borderRadius = `calc(${u.scale * 100}% + ${u.offset}px)`;
    } else {
      domElement.style.borderRadius = `${u.offset}px`;
    }
  } catch { /* ignore */ }
}

export function applyUIStroke(domElement, strokeNode) {
  if (!domElement || !strokeNode) return;
  const thickness = parseFloat(strokeNode.stroke_thickness) || 1;
  const color = strokeNode.stroke_color || '#000000';
  const mode = strokeNode.stroke_mode || 'Border';

  if (mode === 'Border') {
    domElement.style.boxShadow = `inset 0 0 0 ${thickness}px ${color}`;
  } else if (mode === 'Contextual') {
    domElement.style.WebkitTextStroke = `${thickness}px ${color}`;
  }
}

export function applyUIGradient(domElement, gradientNode) {
  if (!domElement || !gradientNode || !gradientNode.gradient_color) return;
  try {
    let stops = [];
    if (typeof gradientNode.gradient_color === 'string') {
      stops = JSON.parse(gradientNode.gradient_color);
    } else if (Array.isArray(gradientNode.gradient_color)) {
      stops = gradientNode.gradient_color;
    }

    const robloxDeg = parseFloat(gradientNode.rotation) || 0;
    const cssDeg = (robloxDeg + 90) % 360;
    const stopStrs = stops.map(([pos, hex]) => `${hex} ${Math.round(pos * 100)}%`).join(', ');
    domElement.style.backgroundImage = `linear-gradient(${cssDeg}deg, ${stopStrs})`;
  } catch { /* ignore */ }
}

export function renderElement(elementNode, parentDomElement = null, context = {}) {
  const doc = getDocument();
  if (!elementNode || !elementNode.class) return null;

  const el = doc.createElement('div');
  el.className = `cw-node cw-${elementNode.class.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (elementNode.globalid) {
    el.setAttribute('data-globalid', elementNode.globalid);
  }
  if (elementNode.alias) {
    el.setAttribute('data-alias', elementNode.alias);
  }
  if (elementNode.order) {
    el.setAttribute('data-order', elementNode.order);
  }

  // Positioning & Sizing
  if (elementNode.position) {
    const pos = udim2ToCss(elementNode.position, true);
    if (pos.left) el.style.left = pos.left;
    if (pos.top) el.style.top = pos.top;
    el.style.position = 'absolute';
  }
  if (elementNode.size) {
    if (elementNode.size === 'auto') {
      el.style.width = 'fit-content';
      el.style.height = 'fit-content';
    } else if (elementNode.size === 'auto_y') {
      el.style.height = 'auto';
      if (elementNode.width) {
        try {
          const u = parseUDim(elementNode.width);
          el.style.width = `calc(${u.scale * 100}% + ${u.offset}px)`;
        } catch { /* ignore */ }
      }
    } else if (elementNode.size === 'auto_x') {
      el.style.width = 'auto';
      if (elementNode.height) {
        try {
          const u = parseUDim(elementNode.height);
          el.style.height = `calc(${u.scale * 100}% + ${u.offset}px)`;
        } catch { /* ignore */ }
      }
    } else {
      const sz = udim2ToCss(elementNode.size, false);
      if (sz.width) el.style.width = sz.width;
      if (sz.height) el.style.height = sz.height;
    }
  }

  // Anchor & Rotation
  if (elementNode.anchor || elementNode.rotation) {
    const a = anchorToCss(elementNode.anchor, elementNode.rotation);
    el.style.transformOrigin = a.transformOrigin;
    el.style.transform = a.transform;
  }

  // Background & Transparency (Roblox semantics: affects ONLY background, NEVER children)
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

  // Button Subtype badges (applies to any class containing '?')
  const cls = elementNode.class;
  if (cls.includes('?')) {
    const subtype = cls.split('?')[1];
    el.setAttribute('data-subtype', subtype);
    if (elementNode.href) el.setAttribute('data-href', elementNode.href);
    if (elementNode.robux_amount) el.setAttribute('data-robux', elementNode.robux_amount);
    if (elementNode.product) el.setAttribute('data-product', elementNode.product);
  }

  // Element-Specific Attributes & Tag specialization
  if (cls === 'ScrollingFrame') {
    el.style.overflowY = 'auto';
    if (elementNode.scrollbar_thickness) {
      el.style.scrollbarWidth = `${elementNode.scrollbar_thickness}px`;
    }
  } else if (cls === 'TextLabel' || cls.startsWith('TextButton') || cls === 'TextBox') {
    if (elementNode.text !== undefined) {
      el.textContent = elementNode.text;
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

    if (cls === 'TextBox') {
      if (elementNode.placeholder) {
        el.setAttribute('placeholder', elementNode.placeholder);
      }
      if (elementNode.editable === 'false') {
        el.setAttribute('readonly', 'true');
      }
    }
  } else if (cls.startsWith('ImageLabel') || cls.startsWith('ImageButton')) {
    const assetId = elementNode.image_id || elementNode.image;
    const resolved = resolveRobloxAsset(assetId);
    el.setAttribute('data-asset-type', resolved.type);
    if (resolved.type === 'svg' || resolved.type === 'badge') {
      el.innerHTML = resolved.content;
    }
    if (elementNode.scale_type) {
      el.setAttribute('data-scale-type', elementNode.scale_type);
    }
  }

  // Modifiers inside children (UICorner, UIStroke, UIGradient, Layouts, UIFlexItem)
  const nonModifierChildren = [];
  const layoutModifiers = [];

  if (Array.isArray(elementNode.children)) {
    for (const childNode of elementNode.children) {
      const childCls = childNode.class;
      if (childCls === 'UICorner') {
        applyUICorner(el, childNode);
      } else if (childCls === 'UIStroke') {
        applyUIStroke(el, childNode);
      } else if (childCls === 'UIGradient') {
        applyUIGradient(el, childNode);
      } else if (childCls === 'UIFlexItem') {
        applyLayoutModifiers(el, childNode);
      } else if (childCls === 'UIListLayout' || childCls === 'UIGridLayout' || childCls === 'UIPadding') {
        layoutModifiers.push(childNode);
      } else {
        const renderedChild = renderElement(childNode, el, context);
        if (renderedChild) nonModifierChildren.push(renderedChild);
      }
    }
  }

  // Apply layout modifiers to container
  for (const layoutNode of layoutModifiers) {
    applyLayoutModifiers(el, layoutNode, nonModifierChildren);
  }

  if (parentDomElement) {
    parentDomElement.appendChild(el);
  }
  return el;
}

// 4. Interactive Scripting Engine
export class CatWebRuntime {
  constructor(documentTree, domRoot) {
    this.tree = documentTree;
    this.domRoot = domRoot;
    this.variables = new Map();
    this.elementsByGlobalId = new Map();
    this.scripts = [];
    this._indexTree(documentTree);
  }

  _indexTree(root) {
    const traverse = (node) => {
      if (!node) return;
      if (node.globalid) {
        this.elementsByGlobalId.set(node.globalid, node);
      }
      if (node.class === 'script' && node.enabled !== 'false') {
        this.scripts.push(node);
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

  start() {
    this.triggerEvent(null, 0); // When website loaded
  }

  getVariable(varId) {
    const key = String(varId);
    return this.variables.has(key) ? this.variables.get(key) : 0;
  }

  setVariable(varId, value) {
    this.variables.set(String(varId), value);
  }

  triggerEvent(targetGlobalId, eventId) {
    const evtIdStr = String(eventId);
    for (const sc of this.scripts) {
      const content = sc.content || [];
      for (const evt of content) {
        if (evt.id === evtIdStr) {
          // If button press event (id "1"), verify target globalid
          if (evtIdStr === '1') {
            const targetSlot = evt.text?.find(item => typeof item === 'object' && item.t === 'object');
            if (targetSlot && targetGlobalId && targetSlot.value !== targetGlobalId) {
              continue;
            }
          }
          this._executeActions(evt.actions || []);
        }
      }
    }
  }

  _executeActions(actions) {
    let i = 0;
    while (i < actions.length) {
      const act = actions[i];
      const actId = act.id;

      if (actId === '11') {
        // Set variable
        const varSlot = act.text?.find(item => typeof item === 'object' && item.l === 'variable');
        const valSlot = act.text?.find(item => typeof item === 'object' && item.l === 'any');
        if (varSlot && valSlot) {
          const resolvedVal = this._resolveTemplate(valSlot.value);
          this.setVariable(varSlot.value, isNaN(Number(resolvedVal)) ? resolvedVal : Number(resolvedVal));
        }
      } else if (actId === '12') {
        // Add to variable
        const valSlot = act.text?.find(item => typeof item === 'object' && item.l === 'any');
        const varSlot = act.text?.find(item => typeof item === 'object' && item.l === 'variable');
        if (varSlot && valSlot) {
          const delta = Number(this._resolveTemplate(valSlot.value)) || 0;
          const current = Number(this.getVariable(varSlot.value)) || 0;
          this.setVariable(varSlot.value, current + delta);
        }
      } else if (actId === '31') {
        // Set property
        const propSlot = act.text?.find(item => typeof item === 'object' && item.l === 'property');
        const objSlot = act.text?.find(item => typeof item === 'object' && item.t === 'object');
        const valSlot = act.text?.find(item => typeof item === 'object' && (item.t === 'any' || item.l === 'any'));
        if (propSlot && objSlot && valSlot) {
          const targetGid = objSlot.value;
          const propName = propSlot.value;
          const resolvedVal = this._resolveTemplate(valSlot.value);
          const targetNode = this.elementsByGlobalId.get(targetGid);
          if (targetNode) {
            if (propName === 'Text') targetNode.text = resolvedVal;
            if (propName === 'Visible') targetNode.visible = resolvedVal;
            if (propName === 'Background Color') targetNode.background_color = resolvedVal;
          }
          if (this.domRoot) {
            const domEl = this.domRoot.querySelector(`[data-globalid="${targetGid}"]`);
            if (domEl) {
              if (propName === 'Text') domEl.textContent = resolvedVal;
              if (propName === 'Visible') domEl.style.display = resolvedVal === 'false' ? 'none' : '';
              if (propName === 'Background Color') domEl.style.backgroundColor = resolvedVal;
            }
          }
        }
      } else if (actId === '18') {
        // If condition
        const operands = act.text?.filter(item => typeof item === 'object' && item.l === 'any') || [];
        const op1 = operands[0];
        const op2 = operands[1];
        const val1 = this._resolveTemplate(op1?.value);
        const val2 = this._resolveTemplate(op2?.value);
        const conditionMet = String(val1) === String(val2);

        if (!conditionMet) {
          // Skip until matching 'end' block (id 25)
          let depth = 1;
          while (i + 1 < actions.length && depth > 0) {
            i++;
            if (actions[i].id === '18' || actions[i].id === '22' || actions[i].id === '23') depth++;
            if (actions[i].id === '25') depth--;
          }
        }
      } else if (actId === '5') {
        // Play audio
        this.lastAudioPlayed = act.text?.find(item => typeof item === 'object' && item.l === 'id')?.value;
      }
      i++;
    }
  }

  _resolveTemplate(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/\{(\d+)\}/g, (_, varId) => {
      return String(this.getVariable(varId));
    });
  }
}
