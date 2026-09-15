/**
 * CatWeb Responsive Toolbar Overflow Manager & Context Menu
 *
 * Implements Priority+ navigation for the top toolbar:
 *   - Measures available toolbar width vs item widths.
 *   - Progressively collapses items that would overflow offscreen into a sleek context menu.
 *   - Supports nested submenus ("menu in menu") for pickers like Zoom and Samples.
 *   - Automatically restores items to the toolbar when screen space is available.
 *   - Hides the "···" overflow trigger when all items fit.
 */

export const OVERFLOW_CONFIG = [
  // Priority 1: First to collapse into context menu (rightmost secondary actions)
  {
    id: 'aiApi',
    priority: 1,
    selector: '#aiApiBtn',
    label: 'AI / Export Image',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    action: (app) => {
      const btn = app.root.querySelector('#aiApiBtn');
      btn?.click?.();
    }
  },
  {
    id: 'audio',
    priority: 2,
    selector: '#audioBtn',
    getLabel: (app) => (app.audioEnabled ? 'Audio: On' : 'Audio: Muted'),
    getIcon: (app) =>
      app.audioEnabled
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    action: (app) => {
      const btn = app.root.querySelector('#audioBtn');
      btn?.click?.();
    },
    isActive: (app) => Boolean(app.audioEnabled)
  },
  {
    id: 'diagnostics',
    priority: 3,
    selector: '#diagnosticsBtn',
    label: 'Diagnostics',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    action: (app) => {
      app.toggleDiagnostics?.();
    },
    isActive: (app) => !app.diagnosticsPanel?.classList?.contains('hidden')
  },
  {
    id: 'inspector',
    priority: 4,
    selector: '#inspectorBtn',
    label: 'Inspect Elements',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    action: (app) => {
      app.toggleInspector?.();
    },
    isActive: (app) => !app.inspectorPanel?.classList?.contains('hidden')
  },
  {
    id: 'zoom',
    priority: 5,
    selector: '#zoomItem',
    label: 'Zoom Level',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
    type: 'submenu',
    getSubmenuItems: () => [
      { label: 'Fit Window', value: 'fit' },
      { label: '50%', value: '0.5' },
      { label: '75%', value: '0.75' },
      { label: '100%', value: '1' },
      { label: '125%', value: '1.25' },
      { label: '150%', value: '1.5' }
    ],
    getCurrentValue: (app) => String(app.currentZoom || 'fit'),
    onSelectSubmenu: (app, val) => {
      app.setZoom?.(val);
    }
  },
  {
    id: 'rawJson',
    priority: 6,
    selector: '#rawJsonBtn',
    label: 'Raw JSON Editor',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    action: (app) => {
      app.toggleEditor?.();
    },
    isActive: (app) => !app.editorPanel?.classList?.contains('hidden')
  },
  {
    id: 'upload',
    priority: 7,
    selector: '#uploadBtn',
    label: 'Upload JSON',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    action: (app) => {
      app.fileInput?.click?.();
    }
  },
  {
    id: 'sample',
    priority: 8,
    selector: '#sampleItem',
    label: 'Load Sample',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    type: 'submenu',
    getSubmenuItems: () => [
      { label: 'Interactive Counter', value: 'interactive_counter' },
      { label: 'Minimal CatWeb Site', value: 'minimal_site' },
      { label: 'User Component Snippet', value: 'user_snippet' },
      { label: 'Valid Snippet', value: 'valid_snippet' },
      { label: 'Invalid Examples', value: 'invalid_examples' }
    ],
    getCurrentValue: (app) => app.sampleSelect?.value || 'interactive_counter',
    onSelectSubmenu: (app, val) => {
      if (app.sampleSelect) {
        app.sampleSelect.value = val;
        app.sampleSelect._syncCustomSelect?.();
        app.sampleSelect.dispatchEvent(new Event('change'));
      }
    }
  }
];

export class CatWebOverflowManager {
  /**
   * @param {object} app - The CatWebRunnerApp instance
   * @param {object} [options={}] - Options
   */
  constructor(app, options = {}) {
    this.app = app;
    this.root = app.root;
    this.options = {
      bufferWidth: 20, // safety pixel buffer
      overflowBtnWidth: 38, // width reserved for the "···" button
      gap: 8,
      ...options
    };

    this.toolbar = null;
    this.brand = null;
    this.container = null;
    this.overflowBtn = null;
    this.dropdown = null;
    this.isOpen = false;
    this.activeSubmenuId = null;
    this.overflowedItemIds = new Set();
    this.intrinsicWidths = new Map();

    this._boundOnResize = this.updateLayout.bind(this);
    this._boundOnDocClick = this._onDocClick.bind(this);
    this._boundOnKeyDown = this._onKeyDown.bind(this);
    this._resizeObserver = null;
  }

  /**
   * Initializes the overflow manager and binds listeners.
   */
  init() {
    if (!this.root || !this.root.querySelector) return;

    this.toolbar = this.root.querySelector?.('.cw-toolbar') || this.root;
    this.brand = this.root.querySelector?.('.cw-brand');
    this.container = this.root.querySelector?.('#overflowMenuContainer');
    this.overflowBtn = this.root.querySelector?.('#overflowMenuBtn');
    this.dropdown = this.root.querySelector?.('#overflowMenuDropdown');

    if (this.overflowBtn) {
      this.overflowBtn.addEventListener('click', (e) => {
        e.stopPropagation?.();
        this.toggleMenu();
      });
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('click', this._boundOnDocClick);
      document.addEventListener('keydown', this._boundOnKeyDown);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._boundOnResize);
    }

    if (typeof ResizeObserver !== 'undefined' && this.toolbar) {
      this._resizeObserver = new ResizeObserver(() => {
        this.updateLayout();
      });
      this._resizeObserver.observe(this.toolbar);
    }

    // Measure intrinsic widths and calculate initial layout
    this.measureIntrinsicWidths();
    this.updateLayout();
  }

  /**
   * Measures and caches the natural unclipped width of each toolbar item.
   */
  measureIntrinsicWidths() {
    if (!this.toolbar) return;

    for (const config of OVERFLOW_CONFIG) {
      const el = this.root.querySelector?.(config.selector);
      if (el) {
        // Temporarily ensure item is visible for measurement
        const prevDisplay = el.style.display;
        if (prevDisplay === 'none') {
          el.style.display = '';
        }
        const width = el.offsetWidth || (typeof window !== 'undefined' && el.getBoundingClientRect ? el.getBoundingClientRect().width : 0) || this._estimateFallbackWidth(config.id);
        if (width > 0) {
          this.intrinsicWidths.set(config.id, width);
        }
        if (prevDisplay === 'none') {
          el.style.display = 'none';
        }
      }
    }
  }

  /**
   * Fallback width estimation if element has not rendered yet or in mock DOM.
   * @private
   */
  _estimateFallbackWidth(id) {
    switch (id) {
      case 'sample': return 160;
      case 'upload': return 105;
      case 'rawJson': return 95;
      case 'zoom': return 125;
      case 'inspector': return 85;
      case 'diagnostics': return 100;
      case 'audio': return 95;
      case 'aiApi': return 130;
      default: return 90;
    }
  }

  /**
   * Evaluates available space and updates which items are displayed on the toolbar
   * vs collapsed into the overflow context menu.
   */
  updateLayout() {
    if (!this.toolbar) return;

    const toolbarWidth = this.toolbar.clientWidth || this.toolbar.offsetWidth || 1200;
    const brandWidth = this.brand?.offsetWidth || (typeof window !== 'undefined' && this.brand?.getBoundingClientRect ? this.brand.getBoundingClientRect().width : 0) || 140;
    const gap = this.options.gap;
    const overflowBtnWidth = this.options.overflowBtnWidth;

    // Available width for items if NO overflow button is present
    const maxAvailable = toolbarWidth - brandWidth - 32; // 32px padding

    // Compute total width of all items
    let totalItemsWidth = 0;
    for (const config of OVERFLOW_CONFIG) {
      const w = this.intrinsicWidths.get(config.id) || this._estimateFallbackWidth(config.id);
      totalItemsWidth += w + gap;
    }

    // Determine how many items must be overflowed
    const newlyOverflowed = new Set();

    if (totalItemsWidth > maxAvailable) {
      // Space is exceeded. Reserve space for overflow button
      const availableWithOverflowBtn = maxAvailable - overflowBtnWidth - gap;
      let remainingCapacity = availableWithOverflowBtn;

      // Items sorted by priority descending (priority 8 stays longest, priority 1 collapses first)
      const sortedConfigs = [...OVERFLOW_CONFIG].sort((a, b) => b.priority - a.priority);

      // Determine items that fit from the most important down to least important
      const fittingIds = new Set();
      for (const config of sortedConfigs) {
        const itemW = (this.intrinsicWidths.get(config.id) || this._estimateFallbackWidth(config.id)) + gap;
        if (remainingCapacity >= itemW) {
          fittingIds.add(config.id);
          remainingCapacity -= itemW;
        } else {
          // Doesn't fit in remaining capacity
          newlyOverflowed.add(config.id);
        }
      }

      // Mark any remaining configs not in fittingIds as overflowed
      for (const config of OVERFLOW_CONFIG) {
        if (!fittingIds.has(config.id)) {
          newlyOverflowed.add(config.id);
        }
      }
    }

    // Apply visibility to toolbar DOM elements
    for (const config of OVERFLOW_CONFIG) {
      const el = this.root.querySelector?.(config.selector);
      if (el) {
        if (newlyOverflowed.has(config.id)) {
          el.classList.add('is-overflowed');
          el.style.display = 'none';
        } else {
          el.classList.remove('is-overflowed');
          el.style.display = '';
        }
      }
    }

    this.overflowedItemIds = newlyOverflowed;

    // Show/hide overflow button and update context menu
    if (newlyOverflowed.size > 0) {
      if (this.container) {
        this.container.style.display = 'flex';
      }
      this.renderMenuContent();
    } else {
      if (this.container) {
        this.container.style.display = 'none';
      }
      if (this.isOpen) {
        this.closeMenu();
      }
    }
  }

  /**
   * Determines if the context menu should operate in drilldown mode
   * (used on mobile / narrow viewports so submenus never open inline or clip offscreen).
   * @returns {boolean}
   */
  isDrilldownMode() {
    if (this.forceDrilldownMode !== undefined) {
      return Boolean(this.forceDrilldownMode);
    }
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 540 ||
      Boolean(window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth <= 768)
    );
  }

  /**
   * Renders the items inside the overflow context menu based on overflowed items.
   */
  renderMenuContent() {
    if (!this.dropdown) return;

    // Filter configs that are currently overflowed
    const activeConfigs = OVERFLOW_CONFIG.filter((c) => this.overflowedItemIds.has(c.id));

    if (activeConfigs.length === 0) {
      this.dropdown.innerHTML = '';
      return;
    }

    // DRILLDOWN SUBMENU VIEW:
    // If in drilldown mode and a submenu is active, render ONLY the dedicated submenu view with Back button.
    // This guarantees that submenus NEVER expand inline between items of the main context menu.
    if (this.isDrilldownMode() && this.activeSubmenuId) {
      const subConfig = activeConfigs.find((c) => c.id === this.activeSubmenuId);
      if (subConfig && subConfig.type === 'submenu') {
        const subLabel = typeof subConfig.getLabel === 'function' ? subConfig.getLabel(this.app) : subConfig.label;
        const subItems = subConfig.getSubmenuItems?.(this.app) || [];
        const currentVal = subConfig.getCurrentValue?.(this.app);

        let html = `
          <div class="cw-context-menu-inner cw-context-subview">
            <div class="cw-context-back-header" data-action="back-to-main" title="Zurück">
              <span class="cw-context-back-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </span>
              <span class="cw-context-back-title">${escapeHtml(subLabel)}</span>
            </div>
            <div class="cw-context-divider"></div>
            <div class="cw-context-subitems-list">
              ${subItems
                .map((sub) => {
                  const isSelected = sub.value === currentVal;
                  return `
                    <div class="cw-context-subitem ${isSelected ? 'selected' : ''}" data-sub-value="${escapeHtml(sub.value)}" data-parent-id="${subConfig.id}">
                      <span class="cw-context-check">${isSelected ? '✓' : ''}</span>
                      <span class="cw-context-label">${escapeHtml(sub.label)}</span>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
        this.dropdown.innerHTML = html;
        this._attachMenuListeners();
        return;
      }
    }

    // MAIN CONTEXT MENU VIEW
    let html = '<div class="cw-context-menu-inner">';

    for (const config of activeConfigs) {
      const label = typeof config.getLabel === 'function' ? config.getLabel(this.app) : config.label;
      const icon = typeof config.getIcon === 'function' ? config.getIcon(this.app) : config.icon;
      const isActive = typeof config.isActive === 'function' ? config.isActive(this.app) : false;

      if (config.type === 'submenu') {
        const subItems = config.getSubmenuItems?.(this.app) || [];
        const currentVal = config.getCurrentValue?.(this.app);
        const currentItem = subItems.find((s) => s.value === currentVal);
        const currentLabel = currentItem ? currentItem.label : currentVal;

        const isSubmenuOpen = !this.isDrilldownMode() && this.activeSubmenuId === config.id;

        html += `
          <div class="cw-context-item has-submenu ${isSubmenuOpen ? 'submenu-open' : ''}" data-action="toggle-sub" data-id="${config.id}">
            <span class="cw-context-icon">${icon}</span>
            <span class="cw-context-label">${escapeHtml(label)}</span>
            <span class="cw-context-badge">${escapeHtml(currentLabel)}</span>
            <span class="cw-context-arrow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
            ${!this.isDrilldownMode() ? `
            <div class="cw-context-submenu ${isSubmenuOpen ? 'open' : 'hidden'}" data-submenu-for="${config.id}">
              ${subItems
                .map((sub) => {
                  const isSelected = sub.value === currentVal;
                  return `
                    <div class="cw-context-subitem ${isSelected ? 'selected' : ''}" data-sub-value="${escapeHtml(sub.value)}" data-parent-id="${config.id}">
                      <span class="cw-context-check">${isSelected ? '✓' : ''}</span>
                      <span class="cw-context-label">${escapeHtml(sub.label)}</span>
                    </div>
                  `;
                })
                .join('')}
            </div>
            ` : ''}
          </div>
        `;
      } else {
        html += `
          <div class="cw-context-item ${isActive ? 'active' : ''}" data-action="exec" data-id="${config.id}">
            <span class="cw-context-icon">${icon}</span>
            <span class="cw-context-label">${escapeHtml(label)}</span>
            ${isActive ? '<span class="cw-context-dot"></span>' : ''}
          </div>
        `;
      }
    }

    html += '</div>';
    this.dropdown.innerHTML = html;

    // Attach listeners inside the dropdown
    this._attachMenuListeners();
  }

  /**
   * Binds click and hover listeners for context menu items and submenus.
   * @private
   */
  _attachMenuListeners() {
    if (!this.dropdown) return;

    // Back to main menu header (drilldown mode)
    const backBtn = this.dropdown.querySelector('[data-action="back-to-main"]');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation?.();
        this.activeSubmenuId = null;
        this.renderMenuContent();
      });
    }

    // Standard action items
    const actionItems = this.dropdown.querySelectorAll('[data-action="exec"]');
    for (const item of actionItems) {
      item.addEventListener('click', (e) => {
        e.stopPropagation?.();
        const id = item.getAttribute('data-id');
        const cfg = OVERFLOW_CONFIG.find((c) => c.id === id);
        if (cfg && typeof cfg.action === 'function') {
          cfg.action(this.app);
        }
        this.closeMenu();
      });

      // Hover on action item closes desktop floating flyout submenu
      item.addEventListener('mouseenter', () => {
        if (!this.isDrilldownMode()) {
          this.activeSubmenuId = null;
          this.dropdown.querySelectorAll('.cw-context-submenu').forEach((el) => {
            el.classList.add('hidden');
            el.classList.remove('open');
          });
          this.dropdown.querySelectorAll('[data-action="toggle-sub"]').forEach((el) => {
            el.classList.remove('submenu-open');
          });
        }
      });
    }

    // Submenu triggers
    const subTriggers = this.dropdown.querySelectorAll('[data-action="toggle-sub"]');
    for (const trigger of subTriggers) {
      const id = trigger.getAttribute('data-id');
      const submenu = trigger.querySelector('.cw-context-submenu');

      // Click: Drilldown view on mobile / narrow screen; toggle floating flyout on desktop
      trigger.addEventListener('click', (e) => {
        e.stopPropagation?.();
        if (this.isDrilldownMode()) {
          this.activeSubmenuId = id;
          this.renderMenuContent();
        } else {
          if (this.activeSubmenuId === id) {
            this.activeSubmenuId = null;
            submenu?.classList.add('hidden');
            submenu?.classList.remove('open');
            trigger.classList.remove('submenu-open');
          } else {
            this.activeSubmenuId = id;
            this.dropdown.querySelectorAll('.cw-context-submenu').forEach((el) => {
              el.classList.add('hidden');
              el.classList.remove('open');
            });
            this.dropdown.querySelectorAll('[data-action="toggle-sub"]').forEach((el) => {
              el.classList.remove('submenu-open');
            });
            submenu?.classList.remove('hidden');
            submenu?.classList.add('open');
            trigger.classList.add('submenu-open');
          }
        }
      });

      // Hover open on desktop pointer (flyout panel to the left)
      trigger.addEventListener('mouseenter', () => {
        if (!this.isDrilldownMode() && typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches) {
          this.activeSubmenuId = id;
          this.dropdown.querySelectorAll('.cw-context-submenu').forEach((el) => {
            el.classList.add('hidden');
            el.classList.remove('open');
          });
          this.dropdown.querySelectorAll('[data-action="toggle-sub"]').forEach((el) => {
            el.classList.remove('submenu-open');
          });
          submenu?.classList.remove('hidden');
          submenu?.classList.add('open');
          trigger.classList.add('submenu-open');
        }
      });
    }

    // Submenu item selection (both in desktop flyout and mobile drilldown)
    const subItems = this.dropdown.querySelectorAll('.cw-context-subitem');
    for (const subItem of subItems) {
      subItem.addEventListener('click', (e) => {
        e.stopPropagation?.();
        const parentId = subItem.getAttribute('data-parent-id');
        const val = subItem.getAttribute('data-sub-value');
        const cfg = OVERFLOW_CONFIG.find((c) => c.id === parentId);
        if (cfg && typeof cfg.onSelectSubmenu === 'function') {
          cfg.onSelectSubmenu(this.app, val);
        }
        this.closeMenu();
      });
    }
  }

  /**
   * Toggles the overflow context menu open/closed.
   */
  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Opens the overflow context menu.
   */
  openMenu() {
    if (!this.dropdown || !this.overflowBtn) return;
    this.activeSubmenuId = null;
    this.renderMenuContent();
    this.dropdown.classList.remove('hidden');
    this.dropdown.classList.add('open');
    this.overflowBtn.classList.add('active');
    this.overflowBtn.setAttribute('aria-expanded', 'true');
    this.isOpen = true;
  }

  /**
   * Closes the overflow context menu and any open submenus.
   */
  closeMenu() {
    if (!this.dropdown || !this.overflowBtn) return;
    this.dropdown.classList.add('hidden');
    this.dropdown.classList.remove('open');
    this.overflowBtn.classList.remove('active');
    this.overflowBtn.setAttribute('aria-expanded', 'false');
    this.isOpen = false;
    this.activeSubmenuId = null;
  }

  /**
   * Handles document click to close menu on outside clicks.
   * @private
   */
  _onDocClick(e) {
    if (!this.isOpen) return;
    if (this.container && !this.container.contains(e.target)) {
      this.closeMenu();
    }
  }

  /**
   * Handles escape key to close menu.
   * @private
   */
  _onKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.closeMenu();
    }
  }

  /**
   * Destroys listeners and observers.
   */
  destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this._boundOnDocClick);
      document.removeEventListener('keydown', this._boundOnKeyDown);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._boundOnResize);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
