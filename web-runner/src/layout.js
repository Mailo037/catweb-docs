/**
 * CatWeb Layout Modifier & Container Engine
 *
 * Implements Roblox UIListLayout, UIGridLayout, UIPadding, UIFlexItem,
 * and constraint emulation (UIAspectRatioConstraint, UISizeConstraint).
 *
 * Employs a two-tier container model:
 *   Outer node (.cw-node) handles external positioning/bounds/anchor/rotation.
 *   Inner host (.cw-layout-host) handles layout flow (flex/grid/absolute) and padding insets.
 *
 * Compatible with modern browsers and Node.js.
 * Zero external dependencies.
 */

import { parseUDim, parseUDim2, parseVector2, udimToCss } from './coordinates.js';

export const MODIFIER_CLASSES = new Set([
  'UIListLayout',
  'UIGridLayout',
  'UIPadding',
  'UIFlexItem',
  'UIAspectRatioConstraint',
  'UISizeConstraint',
  'UITextSizeConstraint',
  'UICorner',
  'UIStroke',
  'UIGradient'
]);

export const NON_VISUAL_CLASSES = new Set([
  ...MODIFIER_CLASSES,
  'Folder',
  'script'
]);

/**
 * Checks if an element class is a layout or styling modifier.
 *
 * @param {string} className
 * @returns {boolean}
 */
export function isModifierClass(className) {
  return MODIFIER_CLASSES.has(className);
}

/**
 * Checks if an element class is a rendered visual control.
 *
 * @param {string} className
 * @returns {boolean}
 */
export function isVisualClass(className) {
  return !NON_VISUAL_CLASSES.has(className);
}

/**
 * Extracts modifier elements and separates them from visual children.
 *
 * @param {object} elementNode - CatWeb element node
 * @returns {{
 *   listLayout: object | null,
 *   gridLayout: object | null,
 *   padding: object | null,
 *   flexItem: object | null,
 *   aspectRatio: object | null,
 *   sizeConstraint: object | null,
 *   textSizeConstraint: object | null,
 *   visualChildren: Array<object>,
 *   allChildren: Array<object>
 * }}
 */
export function extractModifiers(elementNode) {
  const result = {
    listLayout: null,
    gridLayout: null,
    padding: null,
    flexItem: null,
    aspectRatio: null,
    sizeConstraint: null,
    textSizeConstraint: null,
    visualChildren: [],
    allChildren: []
  };

  if (!elementNode || !Array.isArray(elementNode.children)) {
    return result;
  }

  result.allChildren = elementNode.children;

  for (const child of elementNode.children) {
    if (!child || typeof child !== 'object') continue;

    switch (child.class) {
      case 'UIListLayout':
        result.listLayout = child;
        break;
      case 'UIGridLayout':
        result.gridLayout = child;
        break;
      case 'UIPadding':
        result.padding = child;
        break;
      case 'UIFlexItem':
        result.flexItem = child;
        break;
      case 'UIAspectRatioConstraint':
        result.aspectRatio = child;
        break;
      case 'UISizeConstraint':
        result.sizeConstraint = child;
        break;
      case 'UITextSizeConstraint':
        result.textSizeConstraint = child;
        break;
      default:
        if (isVisualClass(child.class)) {
          result.visualChildren.push(child);
        }
        break;
    }
  }

  return result;
}

/**
 * Sorts child elements by their "order" property (ascending) per CatWeb LayoutOrder specification.
 *
 * @param {Array<object>} childrenList
 * @returns {Array<object>} Stable-sorted copy of children list
 */
export function sortChildrenByLayoutOrder(childrenList) {
  if (!Array.isArray(childrenList)) return [];

  return childrenList.map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderA = parseInt(a.item?.order ?? 0, 10) || 0;
      const orderB = parseInt(b.item?.order ?? 0, 10) || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.index - b.index;
    })
    .map(wrapper => wrapper.item);
}

/**
 * Computes CSS styles for UIListLayout container.
 *
 * @param {object} listLayout - UIListLayout element
 * @returns {Record<string, string>}
 */
export function resolveListLayoutStyles(listLayout) {
  if (!listLayout) return {};

  const isHorizontal = listLayout.direction === 'Horizontal';
  const flexDirection = isHorizontal ? 'row' : 'column';

  // Padding (UDim scale + offset) maps to CSS gap
  let gap = '0px';
  if (listLayout.padding) {
    gap = udimToCss(listLayout.padding);
  }

  // Alignments
  // In Vertical: alignment_vertical is main axis, alignment_horizontal is cross axis
  // In Horizontal: alignment_horizontal is main axis, alignment_vertical is cross axis
  const alignHoriz = listLayout.alignment_horizontal || 'Left';
  const alignVert = listLayout.alignment_vertical || 'Top';

  const mapHorizToJustify = { 'Left': 'flex-start', 'Center': 'center', 'Right': 'flex-end' };
  const mapHorizToItems = { 'Left': 'flex-start', 'Center': 'center', 'Right': 'flex-end' };
  const mapVertToJustify = { 'Top': 'flex-start', 'Center': 'center', 'Bottom': 'flex-end' };
  const mapVertToItems = { 'Top': 'flex-start', 'Center': 'center', 'Bottom': 'flex-end' };

  let justifyContent = isHorizontal ? (mapHorizToJustify[alignHoriz] || 'flex-start') : (mapVertToJustify[alignVert] || 'flex-start');
  let alignItems = isHorizontal ? (mapVertToItems[alignVert] || 'flex-start') : (mapHorizToItems[alignHoriz] || 'flex-start');

  // Flex extensions: horizontal_flex and vertical_flex
  const hFlex = listLayout.horizontal_flex;
  const vFlex = listLayout.vertical_flex;

  const flexDistributions = {
    'SpaceBetween': 'space-between',
    'SpaceAround': 'space-around',
    'SpaceEvenly': 'space-evenly'
  };

  if (isHorizontal) {
    if (hFlex && flexDistributions[hFlex]) {
      justifyContent = flexDistributions[hFlex];
    }
    if (vFlex === 'Fill') {
      alignItems = 'stretch';
    }
  } else {
    // Vertical
    if (vFlex && flexDistributions[vFlex]) {
      justifyContent = flexDistributions[vFlex];
    }
    if (hFlex === 'Fill') {
      alignItems = 'stretch';
    }
  }

  const styles = {
    display: 'flex',
    'flex-direction': flexDirection,
    'justify-content': justifyContent,
    'align-items': alignItems,
    gap
  };

  if (listLayout.wrap_list === 'true') {
    styles['flex-wrap'] = 'wrap';
  }

  return styles;
}

/**
 * Computes CSS styles for UIGridLayout container.
 *
 * @param {object} gridLayout - UIGridLayout element
 * @returns {Record<string, string>}
 */
export function resolveGridLayoutStyles(gridLayout) {
  if (!gridLayout) return {};

  // Cell size: CatWeb JSON uses "size" (UDim2)
  let cellW = '100px';
  let cellH = '100px';
  if (gridLayout.size) {
    const parsedSize = parseUDim2(gridLayout.size);
    cellW = udimToCss(parsedSize.scaleX, parsedSize.offsetX);
    cellH = udimToCss(parsedSize.scaleY, parsedSize.offsetY);
  }

  // Padding (UDim or UDim2)
  let gapX = '0px';
  let gapY = '0px';
  if (gridLayout.padding) {
    if (gridLayout.padding.includes('{')) {
      const parsedPad = parseUDim2(gridLayout.padding);
      gapX = udimToCss(parsedPad.scaleX, parsedPad.offsetX);
      gapY = udimToCss(parsedPad.scaleY, parsedPad.offsetY);
    } else {
      const parsedUDim = parseUDim(gridLayout.padding);
      const gapCss = udimToCss(parsedUDim.scale, parsedUDim.offset);
      gapX = gapCss;
      gapY = gapCss;
    }
  }

  // Alignment
  const alignHoriz = gridLayout.alignment_horizontal || 'Center';
  const alignVert = gridLayout.alignment_vertical || 'Top';

  const mapHorizToJustify = { 'Left': 'start', 'Center': 'center', 'Right': 'end' };
  const mapVertToAlign = { 'Top': 'start', 'Center': 'center', 'Bottom': 'end' };

  const styles = {
    display: 'grid',
    'grid-template-columns': `repeat(auto-fill, ${cellW})`,
    'grid-auto-rows': cellH,
    'column-gap': gapX,
    'row-gap': gapY,
    'justify-content': mapHorizToJustify[alignHoriz] || 'center',
    'align-content': mapVertToAlign[alignVert] || 'start'
  };

  if (gridLayout.fill_direction_max_cells) {
    const maxCells = parseInt(gridLayout.fill_direction_max_cells, 10);
    if (!isNaN(maxCells) && maxCells > 0) {
      styles['grid-template-columns'] = `repeat(${maxCells}, ${cellW})`;
    }
  }

  return styles;
}

/**
 * Computes CSS styles for UIPadding insets.
 *
 * @param {object} paddingNode - UIPadding element
 * @returns {Record<string, string>}
 */
export function resolvePaddingStyles(paddingNode) {
  if (!paddingNode) return {};

  const top = paddingNode.top ? udimToCss(paddingNode.top) : '0px';
  const right = paddingNode.right ? udimToCss(paddingNode.right) : '0px';
  const bottom = paddingNode.bottom ? udimToCss(paddingNode.bottom) : '0px';
  const left = paddingNode.left ? udimToCss(paddingNode.left) : '0px';

  return {
    'padding-top': top,
    'padding-right': right,
    'padding-bottom': bottom,
    'padding-left': left,
    'box-sizing': 'border-box'
  };
}

/**
 * Computes CSS styles for UIFlexItem modifier on a child element.
 *
 * @param {object} flexItem - UIFlexItem element
 * @param {boolean} [parentFills=false] - Whether parent layout has Fill flex distribution
 * @returns {Record<string, string>}
 */
export function resolveFlexItemStyles(flexItem, parentFills = false) {
  const styles = {};
  const grow = flexItem?.grow_ratio !== undefined ? parseFloat(flexItem.grow_ratio) : (parentFills ? 1 : 0);
  const shrink = flexItem?.shrink_ratio !== undefined ? parseFloat(flexItem.shrink_ratio) : 1;
  const mode = flexItem?.flex_mode || (parentFills ? 'Fill' : 'None');

  switch (mode) {
    case 'Grow':
      styles['flex-grow'] = String(grow || 1);
      styles['flex-shrink'] = '0';
      styles['flex-basis'] = 'auto';
      break;
    case 'Shrink':
      styles['flex-grow'] = '0';
      styles['flex-shrink'] = String(shrink || 1);
      styles['flex-basis'] = 'auto';
      break;
    case 'Fill':
      styles['flex-grow'] = String(grow || 1);
      styles['flex-shrink'] = String(shrink || 1);
      styles['flex-basis'] = 'auto';
      break;
    case 'None':
    default:
      if (grow > 0 || shrink !== 1) {
        styles['flex-grow'] = String(grow);
        styles['flex-shrink'] = String(shrink);
      } else {
        styles['flex'] = '0 0 auto';
      }
      break;
  }

  if (flexItem?.item_line_alignment) {
    const alignMap = {
      'Automatic': 'auto',
      'Left': 'flex-start',
      'Top': 'flex-start',
      'Center': 'center',
      'Right': 'flex-end',
      'Bottom': 'flex-end',
      'Stretch': 'stretch'
    };
    if (alignMap[flexItem.item_line_alignment]) {
      styles['align-self'] = alignMap[flexItem.item_line_alignment];
    }
  }

  return styles;
}

/**
 * Computes CSS styles for constraints (UIAspectRatioConstraint, UISizeConstraint).
 *
 * @param {object} [aspectRatioNode]
 * @param {object} [sizeConstraintNode]
 * @returns {Record<string, string>}
 */
export function resolveConstraintStyles(aspectRatioNode, sizeConstraintNode) {
  const styles = {};

  if (aspectRatioNode?.ratio) {
    const ratioNum = parseFloat(aspectRatioNode.ratio);
    if (!isNaN(ratioNum) && ratioNum > 0) {
      styles['aspect-ratio'] = String(ratioNum);
    }
  }

  if (sizeConstraintNode) {
    if (sizeConstraintNode.min_size) {
      const minVec = parseVector2(sizeConstraintNode.min_size);
      if (minVec.x > 0) styles['min-width'] = `${minVec.x}px`;
      if (minVec.y > 0) styles['min-height'] = `${minVec.y}px`;
    }
    if (sizeConstraintNode.max_size) {
      const maxVec = parseVector2(sizeConstraintNode.max_size);
      if (maxVec.x > 0 && maxVec.x < 100000) styles['max-width'] = `${maxVec.x}px`;
      if (maxVec.y > 0 && maxVec.y < 100000) styles['max-height'] = `${maxVec.y}px`;
    }
  }

  return styles;
}

/**
 * Computes layout metadata and styles for a container and its inner host.
 *
 * @param {object} containerNode - The container element node
 * @returns {{
 *   layoutType: 'flex' | 'grid' | 'absolute',
 *   containerStyles: Record<string, string>,
 *   hostStyles: Record<string, string>,
 *   hostClasses: Array<string>,
 *   sortedVisualChildren: Array<object>,
 *   modifiers: ReturnType<typeof extractModifiers>
 * }}
 */
export function computeContainerLayout(containerNode) {
  const modifiers = extractModifiers(containerNode);
  const { listLayout, gridLayout, padding, aspectRatio, sizeConstraint } = modifiers;

  let layoutType = 'absolute';
  const containerStyles = {};
  const hostStyles = {};
  const hostClasses = ['cw-layout-host'];

  // Apply constraints to container
  Object.assign(containerStyles, resolveConstraintStyles(aspectRatio, sizeConstraint));

  // Determine layout manager
  if (gridLayout) {
    layoutType = 'grid';
    hostClasses.push('cw-grid-layout');
    Object.assign(hostStyles, resolveGridLayoutStyles(gridLayout));
  } else if (listLayout) {
    layoutType = 'flex';
    hostClasses.push('cw-flex-layout');
    Object.assign(hostStyles, resolveListLayoutStyles(listLayout));
  } else {
    layoutType = 'absolute';
    hostClasses.push('cw-absolute-layout');
  }

  // Apply padding to host
  if (padding) {
    Object.assign(hostStyles, resolvePaddingStyles(padding));
  }

  // Sort visual children by LayoutOrder if in layout
  const sortedVisualChildren = (layoutType !== 'absolute')
    ? sortChildrenByLayoutOrder(modifiers.visualChildren)
    : modifiers.visualChildren;

  return {
    layoutType,
    containerStyles,
    hostStyles,
    hostClasses,
    sortedVisualChildren,
    modifiers
  };
}

/**
 * Computes child positioning and layout styles relative to its parent's layout mode.
 *
 * @param {object} childNode - Visual child element
 * @param {'flex' | 'grid' | 'absolute'} parentLayoutType
 * @param {object} [parentModifiers]
 * @returns {{
 *   positionMode: 'relative' | 'absolute',
 *   childStyles: Record<string, string>,
 *   childClasses: Array<string>
 * }}
 */
export function computeChildLayout(childNode, parentLayoutType = 'absolute', parentModifiers = null) {
  const childStyles = {};
  const childClasses = ['cw-node'];
  let positionMode = 'absolute';

  const childModifiers = extractModifiers(childNode);
  Object.assign(childStyles, resolveConstraintStyles(childModifiers.aspectRatio, childModifiers.sizeConstraint));

  if (parentLayoutType === 'flex') {
    positionMode = 'relative';
    childClasses.push('cw-node-layout-child');
    childStyles['position'] = 'relative';

    const orderNum = parseInt(childNode.order ?? 0, 10);
    if (!isNaN(orderNum)) {
      childStyles['order'] = String(orderNum);
    }

    const parentFills = (parentModifiers?.listLayout?.direction === 'Horizontal' && parentModifiers?.listLayout?.horizontal_flex === 'Fill') ||
      (parentModifiers?.listLayout?.direction === 'Vertical' && parentModifiers?.listLayout?.vertical_flex === 'Fill');

    Object.assign(childStyles, resolveFlexItemStyles(childModifiers.flexItem, parentFills));

  } else if (parentLayoutType === 'grid') {
    positionMode = 'relative';
    childClasses.push('cw-node-layout-child');
    childStyles['position'] = 'relative';
    childStyles['width'] = '100%';
    childStyles['height'] = '100%';

    const orderNum = parseInt(childNode.order ?? 0, 10);
    if (!isNaN(orderNum)) {
      childStyles['order'] = String(orderNum);
    }
  } else {
    // Absolute layout
    positionMode = 'absolute';
    childStyles['position'] = 'absolute';
  }

  return {
    positionMode,
    childStyles,
    childClasses
  };
}

/**
 * Helper to apply layout modifier styles directly to DOM container elements.
 *
 * @param {HTMLElement} containerDom - Outer container DOM element
 * @param {HTMLElement} hostDom - Inner layout host DOM element
 * @param {object} containerNode - CatWeb element node
 */
export function applyLayoutModifiers(containerDom, hostDom, containerNode) {
  if (!containerDom || !containerNode) return;

  const layout = computeContainerLayout(containerNode);

  for (const [key, val] of Object.entries(layout.containerStyles)) {
    containerDom.style.setProperty(key, val);
  }

  if (hostDom) {
    for (const cls of layout.hostClasses) {
      hostDom.classList.add(cls);
    }
    for (const [key, val] of Object.entries(layout.hostStyles)) {
      hostDom.style.setProperty(key, val);
    }
  }
}
