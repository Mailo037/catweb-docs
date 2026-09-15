/**
 * CatWeb Element Inspector & Overlay Engine
 *
 * Provides live DOM inspection, global ID registry, interactive hover
 * bounding boxes with tooltips, click-to-inspect element selection,
 * and comprehensive detail drawer reporting:
 *   - Element class, alias, globalid, order, z-index
 *   - Computed pixel dimensions and declared UDim2 coordinates
 *   - Applied modifiers (UICorner, UIStroke, UIGradient, layouts, padding)
 *   - Live property values & button subtypes
 *
 * Zero external dependencies.
 */

export class CatWebInspector {
  /**
   * @param {HTMLElement} canvasContainer - Container holding the preview canvas
   * @param {HTMLElement} [drawerElement] - Detail drawer container element
   * @param {object} [options={}] - Configuration options
   */
  constructor(canvasContainer, drawerElement = null, options = {}) {
    this.canvasContainer = canvasContainer;
    this.drawerElement = drawerElement;
    this.options = {
      highlightColor: 'rgba(255, 255, 255, 0.45)',
      selectColor: '#3b82f6',
      onSelect: null,
      ...options
    };

    this.enabled = false;
    this.selectedGlobalId = null;
    this.registry = new Map(); // globalid -> { domElement, jsonNode, modifiers }
    this.hoverOverlay = null;
    this.selectOverlay = null;
    this.tooltip = null;

    this._boundOnPointerMove = this._onPointerMove.bind(this);
    this._boundOnPointerLeave = this._onPointerLeave.bind(this);
    this._boundOnClick = this._onClick.bind(this);

    this._createOverlayElements();
  }

  /**
   * Creates overlay DOM bounding boxes and tooltip inside canvas container.
   * @private
   */
  _createOverlayElements() {
    if (!this.canvasContainer || !this.canvasContainer.ownerDocument) return;
    const doc = this.canvasContainer.ownerDocument;

    // Hover bounding box
    this.hoverOverlay = doc.createElement('div');
    this.hoverOverlay.className = 'cw-inspector-hover-box';
    this.hoverOverlay.style.position = 'absolute';
    this.hoverOverlay.style.pointerEvents = 'none';
    this.hoverOverlay.style.display = 'none';
    this.hoverOverlay.style.border = '1.5px dashed ' + this.options.highlightColor;
    this.hoverOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
    this.hoverOverlay.style.zIndex = '9998';
    this.hoverOverlay.style.transition = 'all 0.05s ease-out';
    this.hoverOverlay.style.boxSizing = 'border-box';
    this.hoverOverlay.style.borderRadius = '4px';

    // Hover tooltip
    this.tooltip = doc.createElement('div');
    this.tooltip.className = 'cw-inspector-tooltip';
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.top = '-28px';
    this.tooltip.style.left = '0';
    this.tooltip.style.padding = '3px 8px';
    this.tooltip.style.backgroundColor = '#18181b';
    this.tooltip.style.color = '#f4f4f5';
    this.tooltip.style.fontSize = '11px';
    this.tooltip.style.fontFamily = 'var(--cw-font-mono, monospace)';
    this.tooltip.style.fontWeight = '500';
    this.tooltip.style.borderRadius = '6px';
    this.tooltip.style.whiteSpace = 'nowrap';
    this.tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    this.tooltip.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    this.hoverOverlay.appendChild(this.tooltip);

    // Selection bounding box
    this.selectOverlay = doc.createElement('div');
    this.selectOverlay.className = 'cw-inspector-select-box';
    this.selectOverlay.style.position = 'absolute';
    this.selectOverlay.style.pointerEvents = 'none';
    this.selectOverlay.style.display = 'none';
    this.selectOverlay.style.border = '2px solid ' + this.options.selectColor;
    this.selectOverlay.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
    this.selectOverlay.style.zIndex = '9999';
    this.selectOverlay.style.boxSizing = 'border-box';
    this.selectOverlay.style.borderRadius = '4px';

    if (this.canvasContainer.appendChild) {
      this.canvasContainer.appendChild(this.hoverOverlay);
      this.canvasContainer.appendChild(this.selectOverlay);
    }
  }

  /**
   * Indexes and registers all elements in the document tree and rendered DOM.
   *
   * @param {object|Array} documentTree
   * @param {HTMLElement} domRoot
   */
  setTree(documentTree, domRoot) {
    this.registry.clear();
    if (!documentTree || !domRoot) return;

    // Collect JSON nodes and their attached modifiers
    const jsonMap = new Map(); // globalid -> { node, modifiers: [] }

    const traverse = (node) => {
      if (!node || typeof node !== 'object') return;

      if (node.globalid) {
        const modifiers = [];
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            if (this._isModifier(child?.class)) {
              modifiers.push(child);
            }
          }
        }
        jsonMap.set(node.globalid, { node, modifiers });
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) traverse(child);
      }
      if (Array.isArray(node.webcontent)) {
        for (const child of node.webcontent) traverse(child);
      }
    };

    if (Array.isArray(documentTree)) {
      for (const item of documentTree) traverse(item);
    } else {
      traverse(documentTree);
    }

    // Match with DOM elements
    for (const [gid, { node, modifiers }] of jsonMap.entries()) {
      let domEl = null;
      if (domRoot.querySelector) {
        domEl = domRoot.querySelector(`[data-globalid="${gid}"]`);
      }
      if (domEl) {
        this.registry.set(gid, {
          globalid: gid,
          domElement: domEl,
          jsonNode: node,
          modifiers
        });
      }
    }

    // Refresh active selection if still present
    if (this.selectedGlobalId && this.registry.has(this.selectedGlobalId)) {
      this.selectElement(this.selectedGlobalId);
    } else {
      this.clearSelection();
    }
  }

  /**
   * Helper to identify modifier classes.
   * @private
   */
  _isModifier(cls) {
    if (!cls) return false;
    return [
      'UICorner', 'UIStroke', 'UIGradient', 'UIPadding',
      'UIListLayout', 'UIGridLayout', 'UIAspectRatioConstraint',
      'UISizeConstraint', 'UITextSizeConstraint', 'UIFlexItem'
    ].includes(cls);
  }

  /**
   * Enables the inspector mode.
   */
  enable() {
    this.enabled = true;
    if (this.canvasContainer && this.canvasContainer.addEventListener) {
      this.canvasContainer.addEventListener('pointermove', this._boundOnPointerMove);
      this.canvasContainer.addEventListener('pointerleave', this._boundOnPointerLeave);
      this.canvasContainer.addEventListener('click', this._boundOnClick, true);
    }
    if (this.canvasContainer && this.canvasContainer.classList) {
      this.canvasContainer.classList.add('cw-inspect-mode');
    }
  }

  /**
   * Disables the inspector mode.
   */
  disable() {
    this.enabled = false;
    this.hideHover();
    if (this.canvasContainer && this.canvasContainer.removeEventListener) {
      this.canvasContainer.removeEventListener('pointermove', this._boundOnPointerMove);
      this.canvasContainer.removeEventListener('pointerleave', this._boundOnPointerLeave);
      this.canvasContainer.removeEventListener('click', this._boundOnClick, true);
    }
    if (this.canvasContainer && this.canvasContainer.classList) {
      this.canvasContainer.classList.remove('cw-inspect-mode');
    }
  }

  /**
   * Toggles the inspector mode on/off.
   * @returns {boolean} New state
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  /**
   * Returns whether inspector is currently active.
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Retrieves registered descriptor for a global ID.
   * @param {string} globalid
   * @returns {object|null}
   */
  getDescriptor(globalid) {
    return this.registry.get(globalid) || null;
  }

  /**
   * Selects an element by global ID, shows persistent selection overlay,
   * and populates detail drawer.
   *
   * @param {string} globalid
   */
  selectElement(globalid) {
    const entry = this.registry.get(globalid);
    if (!entry) {
      this.clearSelection();
      return;
    }

    this.selectedGlobalId = globalid;
    this._positionBox(this.selectOverlay, entry.domElement);

    if (this.drawerElement) {
      this._renderDrawer(entry);
    }

    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(entry);
    }
  }

  /**
   * Clears selection highlight and detail drawer.
   */
  clearSelection() {
    this.selectedGlobalId = null;
    if (this.selectOverlay) {
      this.selectOverlay.style.display = 'none';
    }
    if (this.drawerElement) {
      this.drawerElement.innerHTML = `
        <div class="cw-inspector-empty">
          <div class="cw-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div class="cw-empty-title">No element selected</div>
          <div class="cw-empty-sub">Click any element on the preview canvas or an error card to inspect.</div>
        </div>
      `;
    }
    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(null);
    }
  }

  /**
   * Hides the hover overlay.
   */
  hideHover() {
    if (this.hoverOverlay) {
      this.hoverOverlay.style.display = 'none';
    }
  }

  /**
   * Handles pointermove to highlight hovered elements.
   * @private
   */
  _onPointerMove(e) {
    if (!this.enabled) return;

    // Find nearest ancestor with data-globalid
    const target = e.target;
    if (!target || !target.closest) return;

    const elWithGid = target.closest('[data-globalid]');
    if (!elWithGid || elWithGid === this.hoverOverlay || elWithGid === this.selectOverlay) {
      this.hideHover();
      return;
    }

    const gid = elWithGid.getAttribute('data-globalid');
    const entry = this.registry.get(gid);
    if (!entry) {
      this.hideHover();
      return;
    }

    this._positionBox(this.hoverOverlay, elWithGid);

    // Update tooltip
    if (this.tooltip) {
      const cls = entry.jsonNode?.class || elWithGid.tagName.toLowerCase();
      const alias = entry.jsonNode?.alias ? ` #${entry.jsonNode.alias}` : '';
      const w = Math.round(elWithGid.offsetWidth || 0);
      const h = Math.round(elWithGid.offsetHeight || 0);
      this.tooltip.textContent = `<${cls}>${alias} [${gid}] ${w}×${h}px`;
    }
  }

  /**
   * Handles pointer leave from canvas container.
   * @private
   */
  _onPointerLeave() {
    this.hideHover();
  }

  /**
   * Handles click to inspect and select element.
   * @private
   */
  _onClick(e) {
    if (!this.enabled) return;

    const target = e.target;
    if (!target || !target.closest) return;

    const elWithGid = target.closest('[data-globalid]');
    if (elWithGid) {
      e.preventDefault();
      e.stopPropagation();
      const gid = elWithGid.getAttribute('data-globalid');
      this.selectElement(gid);
    }
  }

  /**
   * Calculates bounds of target DOM element relative to canvas container
   * and positions overlay box.
   * @private
   */
  _positionBox(overlayBox, targetElement) {
    if (!overlayBox || !targetElement) return;

    let cRect = { left: 0, top: 0, width: 0, height: 0 };
    if (this.canvasContainer && typeof this.canvasContainer.getBoundingClientRect === 'function') {
      cRect = this.canvasContainer.getBoundingClientRect();
    }

    const containerW = this.canvasContainer?.offsetWidth || this.canvasContainer?.clientWidth || 0;
    const containerH = this.canvasContainer?.offsetHeight || this.canvasContainer?.clientHeight || 0;
    const scaleX = (containerW > 0 && cRect.width > 0) ? (cRect.width / containerW) : 1;
    const scaleY = (containerH > 0 && cRect.height > 0) ? (cRect.height / containerH) : 1;

    let tRect = { left: 0, top: 0, width: 0, height: 0 };
    if (typeof targetElement.getBoundingClientRect === 'function') {
      tRect = targetElement.getBoundingClientRect();
    } else {
      // Fallback for MockElement
      tRect = {
        left: parseFloat(targetElement.style?.left) || 0,
        top: parseFloat(targetElement.style?.top) || 0,
        width: parseFloat(targetElement.style?.width) || targetElement.offsetWidth || 100,
        height: parseFloat(targetElement.style?.height) || targetElement.offsetHeight || 100
      };
    }

    const relLeft = ((tRect.left || 0) - (cRect.left || 0)) / scaleX;
    const relTop = ((tRect.top || 0) - (cRect.top || 0)) / scaleY;
    const width = (tRect.width || targetElement.offsetWidth || 0) / scaleX;
    const height = (tRect.height || targetElement.offsetHeight || 0) / scaleY;

    overlayBox.style.left = `${Math.round(relLeft)}px`;
    overlayBox.style.top = `${Math.round(relTop)}px`;
    overlayBox.style.width = `${Math.max(2, Math.round(width))}px`;
    overlayBox.style.height = `${Math.max(2, Math.round(height))}px`;

    // Match corner radius of target element for a sleek faithful bounding box
    try {
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const compRadius = window.getComputedStyle(targetElement).borderRadius;
        if (compRadius) {
          overlayBox.style.borderRadius = compRadius;
        }
      }
    } catch {
      // fallback
    }

    // Smart tooltip positioning: prevent cutoff at the top of the canvas
    if (this.tooltip && overlayBox === this.hoverOverlay) {
      if (relTop < 32) {
        this.tooltip.style.top = 'calc(100% + 6px)';
      } else {
        this.tooltip.style.top = '-28px';
      }
    }

    overlayBox.style.display = 'block';
  }

  /**
   * Renders structured detail view in drawer element.
   * @private
   */
  _renderDrawer(entry) {
    if (!this.drawerElement) return;

    const node = entry.jsonNode || {};
    const el = entry.domElement || {};
    const gid = entry.globalid;

    const computedWidth = el.offsetWidth || Math.round(el.getBoundingClientRect?.().width || 0);
    const computedHeight = el.offsetHeight || Math.round(el.getBoundingClientRect?.().height || 0);

    const modifiersList = (entry.modifiers || []).map(m => {
      let modDetail = '';
      if (m.class === 'UICorner') modDetail = `radius: ${m.radius || '0,8'}`;
      else if (m.class === 'UIStroke') modDetail = `${m.stroke_thickness || '1'}px ${m.stroke_color || '#000'}`;
      else if (m.class === 'UIGradient') modDetail = `rotation: ${m.rotation || '0'}°`;
      else if (m.class === 'UIListLayout') modDetail = `${m.direction || 'Vertical'}, gap: ${m.padding || '0,0'}`;
      else if (m.class === 'UIGridLayout') modDetail = `cell: ${m.size || '{0,100},{0,100}'}`;
      else if (m.class === 'UIPadding') modDetail = `T:${m.top||0} B:${m.bottom||0} L:${m.left||0} R:${m.right||0}`;
      else if (m.class === 'UIFlexItem') modDetail = `grow: ${m.grow_ratio||0}, shrink: ${m.shrink_ratio||0}`;
      else modDetail = m.class;

      return `
        <div class="cw-drawer-mod-pill">
          <span class="cw-mod-name">${m.class}</span>
          <span class="cw-mod-val">${modDetail}</span>
        </div>
      `;
    }).join('');

    const properties = [
      { label: 'Class', value: node.class || 'Unknown' },
      { label: 'Alias', value: node.alias || '—' },
      { label: 'Global ID', value: gid },
      { label: 'Position (UDim2)', value: node.position || '{0,0},{0,0}' },
      { label: 'Size (UDim2)', value: node.size || '{0,0},{0,0}' },
      { label: 'Anchor Point', value: node.anchor || '0,0' },
      { label: 'Z-Index', value: node.z_index || '1' },
      { label: 'Order', value: node.order || '0' },
      { label: 'Background Color', value: node.background_color || '—', isColor: !!node.background_color },
      { label: 'Transparency', value: node.background_transparency || '0' },
      { label: 'Visible', value: node.visible !== 'false' ? 'true' : 'false' },
      { label: 'Canvas Clip', value: node.canvas || 'false' }
    ];

    if (node.text !== undefined) {
      properties.push({ label: 'Text', value: node.text });
      properties.push({ label: 'Font', value: node.font || 'SourceSans' });
      properties.push({ label: 'Font Size', value: node.font_size || '14' });
      properties.push({ label: 'Text Color', value: node.font_color || '#000000', isColor: !!node.font_color });
      properties.push({ label: 'Align X', value: node.align_x || 'Left' });
    }

    if (node.image_id || node.image) {
      properties.push({ label: 'Asset ID', value: node.image_id || node.image });
      properties.push({ label: 'Scale Type', value: node.scale_type || 'Stretch' });
    }

    const subtype = node.class?.includes('?') ? node.class.split('?')[1] : null;
    if (subtype) {
      properties.push({ label: 'Subtype', value: `?${subtype}` });
      if (node.href) properties.push({ label: 'Link Href', value: node.href });
      if (node.robux_amount) properties.push({ label: 'Robux Amount', value: node.robux_amount });
      if (node.product) properties.push({ label: 'Product ID', value: node.product });
    }

    const propRows = properties.map(p => `
      <div class="cw-prop-row">
        <span class="cw-prop-lbl">${p.label}</span>
        <span class="cw-prop-val">
          ${p.isColor ? `<span class="cw-color-chip" style="background-color:${p.value}"></span>` : ''}
          ${escapeHtml(String(p.value))}
        </span>
      </div>
    `).join('');

    this.drawerElement.innerHTML = `
      <div class="cw-inspector-header">
        <div class="cw-header-meta">
          <span class="cw-class-tag">${node.class || 'Element'}</span>
          ${node.alias ? `<span class="cw-alias-tag">#${node.alias}</span>` : ''}
        </div>
        <div class="cw-id-badge" title="Global ID">
          <span>ID: <strong>${escapeHtml(gid)}</strong></span>
        </div>
      </div>

      <div class="cw-inspector-section">
        <div class="cw-section-title">Computed dimensions</div>
        <div class="cw-metrics-grid">
          <div class="cw-metric-box">
            <span class="cw-metric-lbl">Width</span>
            <span class="cw-metric-num">${computedWidth}px</span>
          </div>
          <div class="cw-metric-box">
            <span class="cw-metric-lbl">Height</span>
            <span class="cw-metric-num">${computedHeight}px</span>
          </div>
        </div>
      </div>

      ${modifiersList ? `
        <div class="cw-inspector-section">
          <div class="cw-section-title">Applied modifiers (${entry.modifiers.length})</div>
          <div class="cw-modifiers-list">
            ${modifiersList}
          </div>
        </div>
      ` : ''}

      <div class="cw-inspector-section">
        <div class="cw-section-title">Properties</div>
        <div class="cw-props-table">
          ${propRows}
        </div>
      </div>
    `;
  }

  /**
   * Destroys inspector instance and cleans up DOM.
   */
  destroy() {
    this.disable();
    if (this.hoverOverlay && this.hoverOverlay.parentNode) {
      this.hoverOverlay.parentNode.removeChild(this.hoverOverlay);
    }
    if (this.selectOverlay && this.selectOverlay.parentNode) {
      this.selectOverlay.parentNode.removeChild(this.selectOverlay);
    }
    this.registry.clear();
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
