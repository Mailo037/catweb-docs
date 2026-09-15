/**
 * CatWeb Element Inspector & Overlay Engine
 *
 * Provides live DOM inspection, global ID registry, interactive hover
 * bounding boxes with tooltips, click-to-inspect element selection,
 * and comprehensive detail drawer reporting:
 *   - Element class, alias, globalid, order, z-index
 *   - Computed pixel dimensions and declared UDim2 coordinates
 *   - Applied modifiers (UICorner, UIStroke, UIGradient, layouts, padding)
 *
 */

import { parseUDim2, formatUDimCss } from './coordinates.js';
import {
  applyUICorner,
  applyUIStroke,
  applyUIPadding,
  applyUIGradient,
  applyBackgroundStyling,
  applyTextStyling
} from './styling.js';
import { renderScriptBlocks } from './script_blocks.js';

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
      onDocumentChange: null,
      treeContainer: null,
      propsContainer: null,
      tabTreeBtn: null,
      tabPropsBtn: null,
      ...options
    };

    this.enabled = false;
    this.selectedGlobalId = null;
    this.registry = new Map(); // globalid -> { domElement, jsonNode, modifiers }
    this.hoverOverlay = null;
    this.selectOverlay = null;
    this.tooltip = null;
    this.kastentippPopup = null;
    this.activeTab = 'tree';
    this.documentTree = null;
    this.domRoot = null;

    // View containers
    if (this.drawerElement) {
      this.treeContainer = this.options.treeContainer || this.drawerElement.querySelector?.('#inspectorTreeView');
      this.propsContainer = this.options.propsContainer || this.drawerElement.querySelector?.('#inspectorPropsView') || this.drawerElement;
    } else {
      this.treeContainer = this.options.treeContainer || null;
      this.propsContainer = this.options.propsContainer || null;
    }

    this.tabTreeBtn = this.options.tabTreeBtn || null;
    this.tabPropsBtn = this.options.tabPropsBtn || null;

    this._boundOnPointerMove = this._onPointerMove.bind(this);
    this._boundOnPointerLeave = this._onPointerLeave.bind(this);
    this._boundOnClick = this._onClick.bind(this);

    this._createOverlayElements();
    this._createKastentippPopup();
    this._setupTabButtons();
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
   * Creates floating Kastentipp popup for modifier badges.
   * @private
   */
  _createKastentippPopup() {
    if (typeof document === 'undefined') return;
    let existing = document.getElementById('cwKastentippPopup');
    if (existing) {
      this.kastentippPopup = existing;
      return;
    }
    const pop = document.createElement('div');
    pop.id = 'cwKastentippPopup';
    pop.className = 'cw-kastentipp-popup';
    pop.style.display = 'none';
    if (document.body && document.body.appendChild) {
      document.body.appendChild(pop);
    }
    this.kastentippPopup = pop;
  }

  /**
   * Sets up tab button listeners if available.
   * @private
   */
  _setupTabButtons() {
    if (this.tabTreeBtn) {
      this.tabTreeBtn.addEventListener('click', () => this.switchTab('tree'));
    }
    if (this.tabPropsBtn) {
      this.tabPropsBtn.addEventListener('click', () => this.switchTab('props'));
    }
  }

  /**
   * Switches active inspector tab ('tree' or 'props').
   * @param {'tree'|'props'} tab
   */
  switchTab(tab) {
    this.activeTab = tab;
    if (this.tabTreeBtn) {
      this.tabTreeBtn.classList.toggle('active', tab === 'tree');
    }
    if (this.tabPropsBtn) {
      this.tabPropsBtn.classList.toggle('active', tab === 'props');
    }
    if (this.treeContainer) {
      this.treeContainer.classList.toggle('hidden', tab !== 'tree');
    }
    if (this.propsContainer && this.propsContainer !== this.drawerElement) {
      this.propsContainer.classList.toggle('hidden', tab !== 'props');
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
    this.documentTree = documentTree;
    this.domRoot = domRoot;

    if (!documentTree || !domRoot) {
      if (this.treeContainer) this.treeContainer.innerHTML = '';
      return;
    }

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
      this.registry.set(gid, {
        globalid: gid,
        domElement: domEl || null,
        jsonNode: node,
        modifiers
      });
    }

    // Render tree view
    this._renderTree();

    // Refresh active selection if still present
    if (this.selectedGlobalId && this.registry.has(this.selectedGlobalId)) {
      this.selectElement(this.selectedGlobalId);
    } else {
      this.clearSelection();
    }
  }

  /**
   * Renders the complete Element Hierarchy Tree into treeContainer.
   * @private
   */
  _renderTree() {
    if (!this.treeContainer) return;
    const doc = this.treeContainer.ownerDocument || this.canvasContainer?.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc) return;

    if (!this.documentTree) {
      this.treeContainer.innerHTML = '';
      return;
    }

    let totalVisual = 0;
    let totalStyling = 0;
    let totalScripts = 0;

    // Count statistics
    for (const entry of this.registry.values()) {
      const cls = entry.jsonNode?.class || '';
      if (cls === 'script') {
        totalScripts++;
      } else {
        totalVisual++;
      }
      totalStyling += (entry.modifiers?.length || 0);
    }

    // Determine root items
    let rootItems = [];
    if (Array.isArray(this.documentTree)) {
      rootItems = this.documentTree;
    } else if (this.documentTree && Array.isArray(this.documentTree.webcontent)) {
      rootItems = this.documentTree.webcontent;
    } else if (this.documentTree && typeof this.documentTree === 'object') {
      rootItems = [this.documentTree];
    }

    // Build tree DOM
    const treeList = doc.createElement('div');
    treeList.className = 'cw-tree-list';

    const renderNodeItem = (node, depth = 0) => {
      if (!node || typeof node !== 'object') return null;

      const cls = node.class || 'Element';
      if (this._isModifier(cls)) return null; // Styling modifiers are displayed via compact badges

      const gid = node.globalid || '';
      const entry = this.registry.get(gid);
      const modifiers = entry?.modifiers || [];

      // Collect visual child elements
      const rawChildren = node.children || node.webcontent || [];
      const visualChildren = [];
      if (Array.isArray(rawChildren)) {
        for (const child of rawChildren) {
          if (child && typeof child === 'object' && !this._isModifier(child.class)) {
            visualChildren.push(child);
          }
        }
      }

      const itemWrap = doc.createElement('div');
      itemWrap.className = 'cw-tree-item-wrap';

      const row = doc.createElement('div');
      row.className = 'cw-tree-row';
      if (this.selectedGlobalId && this.selectedGlobalId === gid) {
        row.classList.add('active');
      }
      row.setAttribute('data-tree-gid', gid);
      row.style.paddingLeft = `${depth * 14 + 8}px`;

      // Expand/Collapse arrow
      const arrow = doc.createElement('span');
      arrow.className = 'cw-tree-arrow';
      if (visualChildren.length > 0) {
        arrow.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        arrow.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const childrenContainer = itemWrap.querySelector('.cw-tree-children');
          if (childrenContainer) {
            const isCollapsed = childrenContainer.classList.toggle('collapsed');
            arrow.classList.toggle('collapsed', isCollapsed);
          }
        });
      } else {
        arrow.innerHTML = `<span class="cw-tree-dot"></span>`;
      }
      row.appendChild(arrow);

      // Icon
      const icon = doc.createElement('span');
      icon.className = 'cw-tree-icon';
      icon.innerHTML = this._getElementIcon(cls);
      row.appendChild(icon);

      // Label & Tag
      const labelWrap = doc.createElement('div');
      labelWrap.className = 'cw-tree-label-wrap';

      const nameSpan = doc.createElement('span');
      nameSpan.className = 'cw-tree-name';
      nameSpan.textContent = node.alias ? `#${node.alias}` : cls;
      labelWrap.appendChild(nameSpan);

      const clsTag = doc.createElement('span');
      clsTag.className = 'cw-tree-cls-tag';
      clsTag.textContent = cls;
      labelWrap.appendChild(clsTag);

      if (gid) {
        const idBadge = doc.createElement('span');
        idBadge.className = 'cw-tree-id-tag';
        idBadge.textContent = gid;
        labelWrap.appendChild(idBadge);
      }

      row.appendChild(labelWrap);

      // Compact Styling Modifier Badge ("nicht der Länge nach")
      if (modifiers.length > 0) {
        const modBadge = doc.createElement('span');
        modBadge.className = 'cw-tree-mod-badge';
        modBadge.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
          </svg>
          <span>${modifiers.length} Styling-${modifiers.length === 1 ? 'Element' : 'Elemente'}</span>
        `;

        modBadge.addEventListener('mouseenter', () => {
          this._showKastentipp(modBadge, modifiers, node);
        });
        modBadge.addEventListener('mouseleave', () => {
          this._hideKastentipp();
        });

        row.appendChild(modBadge);
      }

      // Script Event Count Badge
      if (cls === 'script') {
        const events = node.content || [];
        const scriptBadge = doc.createElement('span');
        scriptBadge.className = 'cw-tree-script-badge';
        scriptBadge.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span>${events.length} ${events.length === 1 ? 'Event' : 'Events'}</span>
        `;
        row.appendChild(scriptBadge);
      }

      // Row click: Select element & switch to properties view
      row.addEventListener('click', () => {
        if (gid) {
          this.selectElement(gid);
          this.switchTab('props');
        }
      });

      // Row hover: Highlight element on canvas
      row.addEventListener('mouseenter', () => {
        if (entry?.domElement) {
          this._positionBox(this.hoverOverlay, entry.domElement);
          if (this.tooltip) {
            const w = Math.round(entry.domElement.offsetWidth || 0);
            const h = Math.round(entry.domElement.offsetHeight || 0);
            const modTxt = modifiers.length ? ` • ${modifiers.length} Styling-Elemente` : '';
            this.tooltip.textContent = `<${cls}> ${node.alias ? '#' + node.alias : ''} [${gid}]${modTxt} • ${w}×${h}px`;
          }
        }
      });
      row.addEventListener('mouseleave', () => {
        this.hideHover();
      });

      itemWrap.appendChild(row);

      // Render visual children
      if (visualChildren.length > 0) {
        const childrenBox = doc.createElement('div');
        childrenBox.className = 'cw-tree-children';
        for (const ch of visualChildren) {
          const chEl = renderNodeItem(ch, depth + 1);
          if (chEl) childrenBox.appendChild(chEl);
        }
        itemWrap.appendChild(childrenBox);
      }

      return itemWrap;
    };

    for (const item of rootItems) {
      const el = renderNodeItem(item, 0);
      if (el) treeList.appendChild(el);
    }

    this.treeContainer.innerHTML = '';

    // Summary Header
    const summaryBar = doc.createElement('div');
    summaryBar.className = 'cw-tree-summary-bar';
    summaryBar.innerHTML = `
      <div class="cw-tree-stat"><strong>${totalVisual}</strong> Elemente</div>
      <div class="cw-tree-stat muted"><strong>${totalStyling}</strong> Styling-Elemente</div>
      ${totalScripts > 0 ? `<div class="cw-tree-stat muted"><strong>${totalScripts}</strong> Scripts</div>` : ''}
    `;
    this.treeContainer.appendChild(summaryBar);
    this.treeContainer.appendChild(treeList);
  }

  /**
   * Returns clean inline SVG icon based on element class.
   * @private
   */
  _getElementIcon(cls) {
    if (!cls) return '';
    if (cls === 'Frame' || cls === 'ScrollingFrame') {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
    }
    if (cls === 'TextLabel') {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`;
    }
    if (cls.startsWith('TextButton') || cls.startsWith('ImageButton')) {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
    }
    if (cls.startsWith('ImageLabel')) {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    }
    if (cls === 'TextBox') {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="12" y2="6"></line><line x1="4" y1="18" x2="16" y2="18"></line></svg>`;
    }
    if (cls === 'script') {
      return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
    }
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
  }

  /**
   * Displays the floating dark "Kastentipp" tooltip for styling modifiers.
   * @private
   */
  _showKastentipp(badgeEl, modifiers, node) {
    if (!this.kastentippPopup || !badgeEl) return;

    const listHtml = modifiers.map(m => {
      let detail = '';
      if (m.class === 'UICorner') detail = `radius: <code>${m.radius || '0,8'}</code>`;
      else if (m.class === 'UIStroke') detail = `<code>${m.stroke_thickness || '1'}px ${m.stroke_color || '#000'}</code>`;
      else if (m.class === 'UIPadding') detail = `<code>T:${m.top||0} B:${m.bottom||0} L:${m.left||0} R:${m.right||0}</code>`;
      else if (m.class === 'UIListLayout') detail = `<code>${m.direction || 'Vertical'}, gap: ${m.padding || '0,0'}</code>`;
      else if (m.class === 'UIGradient') detail = `<code>${m.rotation || '0'}°</code>`;
      else if (m.class === 'UIGridLayout') detail = `<code>cell: ${m.size || '{0,100},{0,100}'}</code>`;
      else if (m.class === 'UIFlexItem') detail = `<code>grow: ${m.grow_ratio||0}</code>`;
      else detail = m.class;

      return `
        <div class="cw-kastentipp-row">
          <span class="cw-kt-name">${m.class}</span>
          <span class="cw-kt-val">${detail}</span>
        </div>
      `;
    }).join('');

    this.kastentippPopup.innerHTML = `
      <div class="cw-kastentipp-header">
        <span class="cw-kt-title">${node.alias ? '#' + node.alias : node.class}</span>
        <span class="cw-kt-count">${modifiers.length} Styling-${modifiers.length === 1 ? 'Element' : 'Elemente'}</span>
      </div>
      <div class="cw-kastentipp-list">
        ${listHtml}
      </div>
    `;

    // Position floating card next to badge
    if (typeof window !== 'undefined' && badgeEl.getBoundingClientRect) {
      const rect = badgeEl.getBoundingClientRect();
      const popW = 240;
      let left = rect.left - popW - 10;
      if (left < 10) left = rect.right + 10;
      let top = rect.top - 10;
      if (top + 160 > window.innerHeight) top = window.innerHeight - 170;
      if (top < 10) top = 10;

      this.kastentippPopup.style.left = `${Math.round(left)}px`;
      this.kastentippPopup.style.top = `${Math.round(top)}px`;
    }
    this.kastentippPopup.style.display = 'block';
  }

  /**
   * Hides the Kastentipp popup.
   * @private
   */
  _hideKastentipp() {
    if (this.kastentippPopup) {
      this.kastentippPopup.style.display = 'none';
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
   * highlights tree node, and populates live property editor.
   *
   * @param {string} globalid
   */
  selectElement(globalid) {
    if (this._isSelecting) return;
    this._isSelecting = true;
    try {
      const entry = this.registry.get(globalid);
      if (!entry) {
        this.clearSelection();
        return;
      }

      this.selectedGlobalId = globalid;
      if (entry.domElement) {
        this._positionBox(this.selectOverlay, entry.domElement);
      } else if (this.selectOverlay) {
        this.selectOverlay.style.display = 'none';
      }

      // Highlight row in tree
      if (this.treeContainer) {
        const activeRows = this.treeContainer.querySelectorAll('.cw-tree-row.active');
        activeRows.forEach(r => r.classList.remove('active'));
        const targetRow = this.treeContainer.querySelector(`[data-tree-gid="${globalid}"]`);
        if (targetRow) {
          targetRow.classList.add('active');
        }
      }

      if (this.drawerElement || this.propsContainer) {
        this._renderDrawer(entry);
      }

      if (typeof this.options.onSelect === 'function') {
        this.options.onSelect(entry);
      }
    } finally {
      this._isSelecting = false;
    }
  }

  /**
   * Repositions selection overlay without rebuilding drawer DOM or firing callbacks.
   * Used during zoom recalculations to prevent layout thrashing and infinite loops.
   */
  repositionOverlays() {
    if (this.selectedGlobalId) {
      const entry = this.registry.get(this.selectedGlobalId);
      if (entry?.domElement) {
        this._positionBox(this.selectOverlay, entry.domElement);
      }
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
    if (this.treeContainer) {
      const activeRows = this.treeContainer.querySelectorAll('.cw-tree-row.active');
      activeRows.forEach(r => r.classList.remove('active'));
    }

    const container = this.propsContainer || this.drawerElement;
    if (container) {
      container.innerHTML = `
        <div class="cw-inspector-empty">
          <div class="cw-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div class="cw-empty-title">No Element Selected</div>
          <div class="cw-empty-sub">Click any element on the preview canvas or in the Elements tree to inspect and edit.</div>
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
    if (e && e.pointerType === 'touch') return;

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

    // Update tooltip with compact styling indicator ("nicht der Länge nach")
    if (this.tooltip) {
      const cls = entry.jsonNode?.class || elWithGid.tagName.toLowerCase();
      const alias = entry.jsonNode?.alias ? ` #${entry.jsonNode.alias}` : '';
      const w = Math.round(elWithGid.offsetWidth || 0);
      const h = Math.round(elWithGid.offsetHeight || 0);
      const modCount = entry.modifiers?.length || 0;
      const modText = modCount > 0 ? ` • ${modCount} Styling-Elemente` : '';
      this.tooltip.textContent = `<${cls}>${alias} [${gid}]${modText} • ${w}×${h}px`;
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
      this.switchTab('props');
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
   * Renders dedicated visual script block view for script elements.
   * @private
   */
  _renderScriptDrawer(container, entry) {
    const node = entry.jsonNode || {};
    const gid = entry.globalid;
    const events = node.content || [];
    const totalActions = events.reduce((acc, evt) => acc + (evt.actions?.length || 0), 0);

    // Build map of globalid -> alias across registry
    const aliases = new Map();
    for (const [id, regEntry] of this.registry.entries()) {
      if (regEntry.jsonNode?.alias) {
        aliases.set(id, regEntry.jsonNode.alias);
      }
    }

    container.innerHTML = `
      <!-- Script Header -->
      <div class="cw-inspector-header">
        <div class="cw-header-meta">
          <span class="cw-class-tag cw-class-script">script</span>
          ${node.alias ? `<span class="cw-alias-tag">#${escapeHtml(node.alias)}</span>` : ''}
        </div>
        <div class="cw-id-badge" title="Global ID">
          <span>ID: <strong>${escapeHtml(gid)}</strong></span>
        </div>
      </div>

      <!-- Quick Action Navigation -->
      <div class="cw-inspector-actions-bar">
        <button type="button" class="cw-btn cw-btn-sm cw-action-back-tree" title="Return to element tree">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Elements Tree</span>
        </button>
        <button type="button" class="cw-btn cw-btn-sm cw-action-deselect" title="Deselect element">Deselect</button>
      </div>

      <!-- Script Meta & Enabled Toggle -->
      <div class="cw-inspector-section">
        <div class="cw-section-title">Script Configuration</div>
        <div class="cw-field-row">
          <label class="cw-field-lbl">Alias</label>
          <input type="text" class="cw-input cw-live-field" data-prop="alias" value="${escapeHtml(node.alias || '')}" placeholder="script_alias">
        </div>
        <div class="cw-field-row">
          <label class="cw-field-lbl">Enabled</label>
          <label class="cw-toggle-switch">
            <input type="checkbox" class="cw-live-field" data-prop="enabled" ${node.enabled !== 'false' && node.enabled !== false ? 'checked' : ''}>
            <span class="cw-toggle-track"></span>
          </label>
        </div>
        <div class="cw-metrics-grid">
          <div class="cw-metric-box">
            <span class="cw-metric-lbl">Events</span>
            <span class="cw-metric-num">${events.length}</span>
          </div>
          <div class="cw-metric-box">
            <span class="cw-metric-lbl">Actions</span>
            <span class="cw-metric-num">${totalActions}</span>
          </div>
        </div>
      </div>

      <!-- Visual Script Blocks Section -->
      <div class="cw-inspector-section">
        <div class="cw-section-title cw-script-blocks-header">
          <span>Visual Script Blocks</span>
          <span class="cw-section-count">${events.length} ${events.length === 1 ? 'Stack' : 'Stacks'}</span>
        </div>
        <div class="cw-script-canvas-mount"></div>
      </div>
    `;

    // Mount Visual Script Blocks
    const mountEl = container.querySelector('.cw-script-canvas-mount');
    if (mountEl) {
      const doc = container.ownerDocument ||
        (typeof document !== 'undefined' ? document : null) ||
        (typeof globalThis !== 'undefined' ? globalThis.document : null);

      const blocksDom = renderScriptBlocks(node, {
        document: doc,
        elementAliases: aliases,
        onTriggerEvent: (script, eventNode) => {
          if (typeof this.options.onTriggerEvent === 'function') {
            this.options.onTriggerEvent(script, eventNode);
          }
        },
        onHighlightObject: (targetGid) => {
          const elEntry = this.registry.get(targetGid);
          if (elEntry?.domElement) {
            this._positionBox(this.hoverOverlay, elEntry.domElement);
            setTimeout(() => this.hideHover(), 2000);
          }
        },
        onPlayAudio: (assetId) => {
          if (typeof this.options.onPlayAudio === 'function') {
            this.options.onPlayAudio(assetId);
          }
        }
      });
      mountEl.appendChild(blocksDom);
    }

    // Attach Action Listeners
    const backBtn = container.querySelector('.cw-action-back-tree');
    if (backBtn) backBtn.addEventListener('click', () => this.switchTab('tree'));

    const deselectBtn = container.querySelector('.cw-action-deselect');
    if (deselectBtn) deselectBtn.addEventListener('click', () => this.clearSelection());

    // Alias & Enabled input listeners
    const inputs = container.querySelectorAll('.cw-live-field');
    inputs.forEach(input => {
      const prop = input.getAttribute('data-prop');
      const handler = () => {
        let val = input.value;
        if (input.type === 'checkbox') val = input.checked ? 'true' : 'false';
        this.updateElementProperty(gid, prop, val);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });
  }

  /**
   * Renders structured detail view & live visual property editor in propsContainer.
   * @private
   */
  _renderDrawer(entry) {
    const container = this.propsContainer || this.drawerElement;
    if (!container) return;

    const node = entry.jsonNode || {};
    const el = entry.domElement || {};
    const gid = entry.globalid;

    if (node.class === 'script') {
      this._renderScriptDrawer(container, entry);
      return;
    }

    const computedWidth = el.offsetWidth || Math.round(el.getBoundingClientRect?.().width || 0);
    const computedHeight = el.offsetHeight || Math.round(el.getBoundingClientRect?.().height || 0);

    const isTextElement = (node.class && (node.class.includes('Text') || node.class === 'TextBox')) || node.text !== undefined;
    const subtype = node.class?.includes('?') ? node.class.split('?')[1] : null;

    // Helper for safe hex color
    const safeHex = (val, fallback = '#ffffff') => {
      if (!val || typeof val !== 'string') return fallback;
      val = val.trim();
      if (!val.startsWith('#')) val = '#' + val;
      return /^#[0-9a-fA-F]{6}$/.test(val) ? val : fallback;
    };

    const formatModUDim = (val) => {
      if (val === undefined || val === null) return '0,0';
      if (typeof val === 'object') {
        return `${val.scale || 0},${val.offset || 0}`;
      }
      return String(val);
    };

    // Modifiers edit rows
    const modifiersHtml = (entry.modifiers || []).map((m, idx) => {
      let editControls = '';
      if (m.class === 'UICorner') {
        editControls = `
          <div class="cw-mod-input-row">
            <span class="cw-field-lbl">Radius</span>
            <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="radius" value="${escapeHtml(m.radius || '0,8')}">
          </div>
        `;
      } else if (m.class === 'UIStroke') {
        editControls = `
          <div class="cw-mod-input-row">
            <span class="cw-field-lbl">Thickness</span>
            <input type="number" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="stroke_thickness" value="${escapeHtml(m.stroke_thickness || '1')}">
            <span class="cw-field-lbl">Color</span>
            <div class="cw-color-input-wrap">
              <input type="color" class="cw-color-picker" data-mod-idx="${idx}" data-mod-field="stroke_color" value="${safeHex(m.stroke_color, '#27272a')}">
              <input type="text" class="cw-input cw-input-sm cw-hex-input" data-mod-idx="${idx}" data-mod-field="stroke_color" value="${escapeHtml(m.stroke_color || '#27272a')}">
            </div>
          </div>
        `;
      } else if (m.class === 'UIPadding') {
        editControls = `
          <div class="cw-mod-padding-grid">
            <div class="cw-mod-field-col">
              <label class="cw-field-lbl">Top Padding</label>
              <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="top" value="${escapeHtml(formatModUDim(m.top))}" placeholder="0,0">
            </div>
            <div class="cw-mod-field-col">
              <label class="cw-field-lbl">Bottom Padding</label>
              <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="bottom" value="${escapeHtml(formatModUDim(m.bottom))}" placeholder="0,0">
            </div>
            <div class="cw-mod-field-col">
              <label class="cw-field-lbl">Left Padding</label>
              <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="left" value="${escapeHtml(formatModUDim(m.left))}" placeholder="0,0">
            </div>
            <div class="cw-mod-field-col">
              <label class="cw-field-lbl">Right Padding</label>
              <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="right" value="${escapeHtml(formatModUDim(m.right))}" placeholder="0,0">
            </div>
          </div>
        `;
      } else if (m.class === 'UIListLayout') {
        editControls = `
          <div class="cw-mod-padding-grid">
            <div class="cw-mod-field-col">
              <label class="cw-field-lbl">Direction</label>
              <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="fill_direction" value="${escapeHtml(m.fill_direction || m.direction || 'Vertical')}" placeholder="Vertical">
            </div>
            <div class="cw-mod-field-col">
              <label class="cw-field-lbl">Padding / Gap</label>
              <input type="text" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="padding" value="${escapeHtml(m.padding || '0,0')}" placeholder="0,0">
            </div>
          </div>
        `;
      } else if (m.class === 'UIGradient') {
        editControls = `
          <div class="cw-mod-input-row">
            <span class="cw-field-lbl">Rotation</span>
            <input type="number" class="cw-input cw-input-sm" data-mod-idx="${idx}" data-mod-field="rotation" value="${escapeHtml(m.rotation || '0')}" placeholder="0">
            <span class="cw-unit-lbl">deg</span>
          </div>
        `;
      } else {
        editControls = `<span class="cw-mod-val">${escapeHtml(JSON.stringify(m))}</span>`;
      }

      return `
        <div class="cw-drawer-mod-card">
          <div class="cw-mod-card-header">
            <span class="cw-mod-name">${m.class}</span>
            <span class="cw-mod-id">[${m.globalid || ''}]</span>
          </div>
          ${editControls}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <!-- Header -->
      <div class="cw-inspector-header">
        <div class="cw-header-meta">
          <span class="cw-class-tag">${node.class || 'Element'}</span>
          ${subtype ? `<span class="cw-subtype-tag">?${escapeHtml(subtype)}</span>` : ''}
          ${node.alias ? `<span class="cw-alias-tag">#${escapeHtml(node.alias)}</span>` : ''}
        </div>
        <div class="cw-id-badge" title="Global ID">
          <span>ID: <strong>${escapeHtml(gid)}</strong></span>
        </div>
      </div>

      <!-- Quick Action Navigation -->
      <div class="cw-inspector-actions-bar">
        <button type="button" class="cw-btn cw-btn-sm cw-action-back-tree" title="Return to element tree">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Elements Tree</span>
        </button>
        <button type="button" class="cw-btn cw-btn-sm cw-action-deselect" title="Deselect element">Deselect</button>
      </div>

      <!-- Live Editable Content Section -->
      ${isTextElement ? `
        <div class="cw-inspector-section">
          <div class="cw-section-title">Text Content</div>
          <div class="cw-field-group">
            <input type="text" class="cw-input cw-live-field" data-prop="text" value="${escapeHtml(node.text || '')}" placeholder="Text content...">
          </div>
        </div>
      ` : ''}

      <!-- Live Editable Appearance Section -->
      <div class="cw-inspector-section">
        <div class="cw-section-title">Appearance &amp; Style</div>

        <div class="cw-field-row">
          <label class="cw-field-lbl">Background</label>
          <div class="cw-color-input-wrap">
            <input type="color" class="cw-color-picker" data-prop="background_color" value="${safeHex(node.background_color, '#1c1c1f')}">
            <input type="text" class="cw-input cw-hex-input cw-live-field" data-prop="background_color" value="${escapeHtml(node.background_color || '')}" placeholder="#1c1c1f">
          </div>
        </div>

        ${isTextElement ? `
          <div class="cw-field-row">
            <label class="cw-field-lbl">Text Color</label>
            <div class="cw-color-input-wrap">
              <input type="color" class="cw-color-picker" data-prop="font_color" value="${safeHex(node.font_color, '#ffffff')}">
              <input type="text" class="cw-input cw-hex-input cw-live-field" data-prop="font_color" value="${escapeHtml(node.font_color || '')}" placeholder="#ffffff">
            </div>
          </div>

          <div class="cw-field-row">
            <label class="cw-field-lbl">Font Size</label>
            <div class="cw-number-input-wrap">
              <input type="number" class="cw-input cw-live-field" data-prop="font_size" min="8" max="120" value="${parseInt(node.font_size, 10) || 14}">
              <span class="cw-unit-lbl">px</span>
            </div>
          </div>

          <div class="cw-field-row">
            <label class="cw-field-lbl">Text Transparency</label>
            <div class="cw-slider-wrap">
              <input type="range" class="cw-range-slider cw-live-field" data-prop="font_transparency" min="0" max="1" step="0.05" value="${parseFloat(node.font_transparency ?? node.text_transparency) || 0}">
              <span class="cw-slider-val">${parseFloat(node.font_transparency ?? node.text_transparency) || 0}</span>
            </div>
          </div>
        ` : ''}

        <div class="cw-field-row">
          <label class="cw-field-lbl">Bg Transparency</label>
          <div class="cw-slider-wrap">
            <input type="range" class="cw-range-slider cw-live-field" data-prop="background_transparency" min="0" max="1" step="0.05" value="${parseFloat(node.background_transparency) || 0}">
            <span class="cw-slider-val">${parseFloat(node.background_transparency) || 0}</span>
          </div>
        </div>

        <div class="cw-field-row">
          <label class="cw-field-lbl">Visible</label>
          <label class="cw-toggle-switch">
            <input type="checkbox" class="cw-live-field" data-prop="visible" ${node.visible !== 'false' ? 'checked' : ''}>
            <span class="cw-toggle-track"></span>
          </label>
        </div>
      </div>

      <!-- Live Editable Coordinates Section (UDim2) -->
      <div class="cw-inspector-section">
        <div class="cw-section-title">Coordinates &amp; Sizing (UDim2)</div>
        <div class="cw-field-row">
          <label class="cw-field-lbl">Position</label>
          <input type="text" class="cw-input cw-live-field" data-prop="position" value="${escapeHtml(node.position || '{0,0},{0,0}')}">
        </div>
        <div class="cw-field-row">
          <label class="cw-field-lbl">Size</label>
          <input type="text" class="cw-input cw-live-field" data-prop="size" value="${escapeHtml(node.size || '{0,0},{0,0}')}">
        </div>
        <div class="cw-field-row-split">
          <div class="cw-half-field">
            <label class="cw-field-lbl">Z-Index</label>
            <input type="number" class="cw-input cw-live-field" data-prop="z_index" value="${node.z_index || '1'}">
          </div>
          <div class="cw-half-field">
            <label class="cw-field-lbl">Order</label>
            <input type="number" class="cw-input cw-live-field" data-prop="order" value="${node.order || '0'}">
          </div>
        </div>
      </div>

      <!-- Attached Styling Modifiers Editor -->
      ${modifiersHtml ? `
        <div class="cw-inspector-section">
          <div class="cw-section-title">Attached Modifiers (${entry.modifiers.length})</div>
          <div class="cw-modifiers-list">
            ${modifiersHtml}
          </div>
        </div>
      ` : ''}

      <!-- Computed Dimensions Metrics -->
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
    `;

    // Attach Action Listeners
    const backBtn = container.querySelector?.('.cw-action-back-tree');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.switchTab('tree'));
    }

    const deselectBtn = container.querySelector?.('.cw-action-deselect');
    if (deselectBtn) {
      deselectBtn.addEventListener('click', () => this.clearSelection());
    }

    // Attach Property Input Listeners
    const inputs = container.querySelectorAll?.('.cw-live-field, .cw-color-picker') || [];
    inputs.forEach(input => {
      const field = input.getAttribute('data-prop');
      const handleUpdate = () => {
        let val = input.value;
        if (input.type === 'checkbox') {
          val = input.checked ? 'true' : 'false';
        }

        // Color picker sync with sibling text input
        if (input.classList.contains('cw-color-picker')) {
          const hexInput = input.parentElement?.querySelector('.cw-hex-input');
          if (hexInput) hexInput.value = val;
        } else if (input.classList.contains('cw-hex-input')) {
          const colorInput = input.parentElement?.querySelector('.cw-color-picker');
          if (colorInput && /^#[0-9a-fA-F]{6}$/.test(val)) colorInput.value = val;
        }

        // Slider value label sync
        if (input.type === 'range') {
          const valLabel = input.parentElement?.querySelector('.cw-slider-val');
          if (valLabel) valLabel.textContent = val;
        }

        this.updateElementProperty(gid, field, val);
      };

      input.addEventListener('input', handleUpdate);
      input.addEventListener('change', handleUpdate);
    });

    // Attach Modifier Input Listeners
    const modInputs = container.querySelectorAll?.('[data-mod-idx]') || [];
    modInputs.forEach(input => {
      const modIdx = parseInt(input.getAttribute('data-mod-idx'), 10);
      const modField = input.getAttribute('data-mod-field');
      const handleModUpdate = () => {
        let val = input.value;

        // Color picker sync
        if (input.classList.contains('cw-color-picker')) {
          const hexInput = input.parentElement?.querySelector('.cw-hex-input');
          if (hexInput) hexInput.value = val;
        } else if (input.classList.contains('cw-hex-input')) {
          const colorInput = input.parentElement?.querySelector('.cw-color-picker');
          if (colorInput && /^#[0-9a-fA-F]{6}$/.test(val)) colorInput.value = val;
        }

        this.updateModifierProperty(gid, modIdx, modField, val);
      };

      input.addEventListener('input', handleModUpdate);
      input.addEventListener('change', handleModUpdate);
    });
  }

  /**
   * Updates a single property on a registered element with live DOM & JSON sync.
   *
   * @param {string} gid
   * @param {string} property
   * @param {*} value
   */
  updateElementProperty(gid, property, value) {
    const entry = this.registry.get(gid);
    if (!entry) return;

    const node = entry.jsonNode;
    const el = entry.domElement;
    node[property] = value;

    if (el && el.style) {
      if (property === 'text') {
        if (el.firstChild && el.firstChild.nodeType === 3) {
          el.firstChild.nodeValue = value;
        } else {
          el.textContent = value;
        }
        if (el.value !== undefined) el.value = value;
      } else if (property === 'background_color') {
        applyBackgroundStyling(el, value, node.background_transparency);
      } else if (property === 'background_transparency') {
        applyBackgroundStyling(el, node.background_color, value);
        if (el.style.opacity) el.style.opacity = '';
      } else if (property === 'font_color') {
        applyTextStyling(el, value, node.font_transparency ?? node.text_transparency);
      } else if (property === 'font_transparency' || property === 'text_transparency') {
        node.font_transparency = value;
        node.text_transparency = value;
        applyTextStyling(el, node.font_color, value);
      } else if (property === 'font_size') {
        el.style.fontSize = `${value}px`;
      } else if (property === 'visible') {
        el.style.display = value === 'false' ? 'none' : '';
      } else if (property === 'position') {
        try {
          const uPos = parseUDim2(value);
          el.style.left = formatUDimCss(uPos.scaleX, uPos.offsetX);
          el.style.top = formatUDimCss(uPos.scaleY, uPos.offsetY);
        } catch {}
      } else if (property === 'size') {
        try {
          const uSz = parseUDim2(value);
          el.style.width = formatUDimCss(uSz.scaleX, uSz.offsetX);
          el.style.height = formatUDimCss(uSz.scaleY, uSz.offsetY);
        } catch {}
      } else if (property === 'z_index') {
        el.style.zIndex = String(value);
      } else if (property === 'order') {
        if (el.setAttribute) el.setAttribute('data-order', String(value));
      }

      // Re-align selection box
      this._positionBox(this.selectOverlay, el);
    }

    // Update label in tree if text/alias was changed
    if (this.treeContainer && (property === 'text' || property === 'alias')) {
      const treeRow = this.treeContainer.querySelector?.(`[data-tree-gid="${gid}"] .cw-tree-name`);
      if (treeRow) {
        treeRow.textContent = node.alias ? `#${node.alias}` : (node.class || 'Element');
      }
    }

    // Fire document change callback
    if (typeof this.options.onDocumentChange === 'function') {
      this.options.onDocumentChange(this.documentTree);
    }
  }

  /**
   * Updates an attached modifier's property.
   *
   * @param {string} gid
   * @param {number} modIdx
   * @param {string} field
   * @param {*} value
   */
  updateModifierProperty(gid, modIdx, field, value) {
    const entry = this.registry.get(gid);
    if (!entry || !entry.modifiers || !entry.modifiers[modIdx]) return;

    const mod = entry.modifiers[modIdx];
    mod[field] = value;
    const el = entry.domElement;

    if (el) {
      if (mod.class === 'UICorner') {
        applyUICorner(el, mod);
        this._positionBox(this.selectOverlay, el);
      } else if (mod.class === 'UIStroke') {
        applyUIStroke(el, mod);
      } else if (mod.class === 'UIPadding') {
        applyUIPadding(el, mod);
        this._positionBox(this.selectOverlay, el);
      } else if (mod.class === 'UIGradient') {
        applyUIGradient(el, mod);
      }
    }

    if (typeof this.options.onDocumentChange === 'function') {
      this.options.onDocumentChange(this.documentTree);
    }
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
    if (this.kastentippPopup && this.kastentippPopup.parentNode) {
      this.kastentippPopup.parentNode.removeChild(this.kastentippPopup);
    }
    this.registry.clear();
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
