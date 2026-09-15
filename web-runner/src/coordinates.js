/**
 * CatWeb Coordinate Mathematics & CSS Converter Engine
 *
 * Provides Roblox UDim2, UDim, and Vector2 coordinate calculations,
 * pixel dimension resolvers, AnchorPoint transforms, and responsive CSS calc() strings.
 *
 * Compatible with modern browsers and Node.js.
 * Zero external dependencies.
 */

import { UDIM2_REGEX, UDIM_REGEX } from './validator.js';

export const VECTOR2_REGEX = /^\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/;

/**
 * Parses a UDim2 string: "{scaleX, offsetX},{scaleY, offsetY}"
 *
 * @param {string|object} input
 * @returns {{ scaleX: number, offsetX: number, scaleY: number, offsetY: number }}
 */
export function parseUDim2(input) {
  if (input && typeof input === 'object') {
    return {
      scaleX: parseFloat(input.scaleX ?? input.sx ?? 0) || 0,
      offsetX: parseFloat(input.offsetX ?? input.ox ?? 0) || 0,
      scaleY: parseFloat(input.scaleY ?? input.sy ?? 0) || 0,
      offsetY: parseFloat(input.offsetY ?? input.oy ?? 0) || 0
    };
  }

  if (typeof input !== 'string') {
    return { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 };
  }

  const match = input.match(UDIM2_REGEX);
  if (!match) {
    return { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 };
  }

  return {
    scaleX: parseFloat(match[1]),
    offsetX: parseFloat(match[2]),
    scaleY: parseFloat(match[3]),
    offsetY: parseFloat(match[4])
  };
}

/**
 * Parses a UDim string: "scale,offset"
 *
 * @param {string|object} input
 * @returns {{ scale: number, offset: number }}
 */
export function parseUDim(input) {
  if (input && typeof input === 'object') {
    return {
      scale: parseFloat(input.scale ?? input.s ?? 0) || 0,
      offset: parseFloat(input.offset ?? input.o ?? 0) || 0
    };
  }

  if (typeof input !== 'string') {
    return { scale: 0, offset: 0 };
  }

  const match = input.match(UDIM_REGEX);
  if (!match) {
    return { scale: 0, offset: 0 };
  }

  return {
    scale: parseFloat(match[1]),
    offset: parseFloat(match[2])
  };
}

/**
 * Parses a 2D Vector string: "x,y"
 *
 * @param {string|object} input
 * @returns {{ x: number, y: number }}
 */
export function parseVector2(input) {
  if (input && typeof input === 'object') {
    return {
      x: parseFloat(input.x ?? 0) || 0,
      y: parseFloat(input.y ?? 0) || 0
    };
  }

  if (typeof input !== 'string') {
    return { x: 0, y: 0 };
  }

  const match = input.match(VECTOR2_REGEX);
  if (!match) {
    return { x: 0, y: 0 };
  }

  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2])
  };
}

/**
 * Converts a UDim (scale and offset) to an optimized responsive CSS dimension string.
 *
 * @param {number|string|object} scaleOrUDim - Scale number or UDim string/object
 * @param {number} [offset] - Offset in pixels (if first arg is scale)
 * @returns {string} CSS calc string or pixel/percent shorthand
 */
export function udimToCss(scaleOrUDim, offset) {
  let s = 0;
  let o = 0;

  if (typeof scaleOrUDim === 'string' || (scaleOrUDim && typeof scaleOrUDim === 'object')) {
    const parsed = parseUDim(scaleOrUDim);
    s = parsed.scale;
    o = parsed.offset;
  } else {
    s = parseFloat(scaleOrUDim) || 0;
    o = parseFloat(offset) || 0;
  }

  // Optimize generated CSS
  if (s === 0 && o === 0) {
    return '0px';
  }
  if (s === 0) {
    return `${o}px`;
  }
  if (o === 0) {
    return `${s * 100}%`;
  }
  if (o > 0) {
    return `calc(${s * 100}% + ${o}px)`;
  }
  return `calc(${s * 100}% - ${Math.abs(o)}px)`;
}

/**
 * Converts a UDim2 position or size to CSS declarations.
 *
 * @param {string|object} udim2Input - UDim2 string or parsed object
 * @param {boolean} [isPosition=false] - If true returns { left, top }, else { width, height }
 * @returns {{ left?: string, top?: string, width?: string, height?: string, x: string, y: string }}
 */
export function udim2ToCss(udim2Input, isPosition = false) {
  const u = parseUDim2(udim2Input);
  const xCss = udimToCss(u.scaleX, u.offsetX);
  const yCss = udimToCss(u.scaleY, u.offsetY);

  if (isPosition) {
    return {
      left: xCss,
      top: yCss,
      x: xCss,
      y: yCss
    };
  }

  return {
    width: xCss,
    height: yCss,
    x: xCss,
    y: yCss
  };
}

/**
 * Resolves sizing with support for auto-sizing keywords ("auto", "auto_x", "auto_y").
 *
 * @param {string} [sizeStr] - Element size property
 * @param {string} [widthStr] - Optional UDim width (used with auto_y)
 * @param {string} [heightStr] - Optional UDim height (used with auto_x)
 * @returns {{ width: string, height: string, isAutoWidth: boolean, isAutoHeight: boolean }}
 */
export function resolveElementSizeCss(sizeStr, widthStr, heightStr) {
  if (sizeStr === 'auto') {
    return {
      width: 'max-content',
      height: 'max-content',
      isAutoWidth: true,
      isAutoHeight: true
    };
  }

  if (sizeStr === 'auto_x') {
    const hCss = heightStr ? udimToCss(heightStr) : (sizeStr ? udim2ToCss(sizeStr).height : 'auto');
    return {
      width: 'max-content',
      height: hCss,
      isAutoWidth: true,
      isAutoHeight: false
    };
  }

  if (sizeStr === 'auto_y') {
    const wCss = widthStr ? udimToCss(widthStr) : (sizeStr ? udim2ToCss(sizeStr).width : '100%');
    return {
      width: wCss || '100%',
      height: 'max-content',
      isAutoWidth: false,
      isAutoHeight: true
    };
  }

  const { width, height } = udim2ToCss(sizeStr || '{0,0},{0,0}');
  return {
    width,
    height,
    isAutoWidth: false,
    isAutoHeight: false
  };
}

/**
 * Computes CSS transform and transform-origin for Roblox AnchorPoint and rotation.
 * In Roblox, rotation rotates strictly around the element's AnchorPoint.
 *
 * @param {string|object} [anchorInput="0,0"] - Vector2 anchor "x,y"
 * @param {number|string} [rotationInput=0] - Rotation angle in degrees
 * @returns {{ transformOrigin: string, transform: string, ax: number, ay: number, rotation: number }}
 */
export function anchorToCss(anchorInput, rotationInput = 0) {
  const { x: ax, y: ay } = parseVector2(anchorInput || '0,0');
  const rot = parseFloat(rotationInput) || 0;

  const transformOrigin = `${ax * 100}% ${ay * 100}%`;

  // Translate origin by -anchor * 100%
  let transform = '';
  const tx = ax !== 0 ? `${-ax * 100}%` : '0%';
  const ty = ay !== 0 ? `${-ay * 100}%` : '0%';

  if (ax !== 0 || ay !== 0) {
    transform = `translate(${tx}, ${ty})`;
  }

  if (rot !== 0) {
    transform = transform ? `${transform} rotate(${rot}deg)` : `rotate(${rot}deg)`;
  }

  return {
    transformOrigin,
    transform: transform || 'none',
    ax,
    ay,
    rotation: rot
  };
}

/**
 * Converts CatWeb z_index property to CSS z-index.
 *
 * @param {string|number} [zIndex]
 * @returns {number} CSS z-index integer
 */
export function zIndexToCss(zIndex) {
  if (zIndex === undefined || zIndex === null || zIndex === '') {
    return 1;
  }
  const parsed = parseInt(zIndex, 10);
  return isNaN(parsed) ? 1 : parsed;
}

/**
 * Computes exact pixel bounding box dimensions relative to parent bounds.
 *
 * @param {string|object} posInput - Position UDim2
 * @param {string|object} sizeInput - Size UDim2
 * @param {{ width: number, height: number }} parentBounds - Parent dimensions in pixels
 * @param {string|object} [anchorInput="0,0"] - AnchorPoint Vector2
 * @returns {{ left: number, top: number, width: number, height: number, right: number, bottom: number }}
 */
export function computePixelBounds(posInput, sizeInput, parentBounds, anchorInput = '0,0') {
  const pW = parentBounds?.width || 0;
  const pH = parentBounds?.height || 0;

  const pos = parseUDim2(posInput);
  const sz = parseUDim2(sizeInput);
  const { x: ax, y: ay } = parseVector2(anchorInput);

  const rawWidth = pW * sz.scaleX + sz.offsetX;
  const rawHeight = pH * sz.scaleY + sz.offsetY;

  const width = Math.max(0, Math.round(rawWidth));
  const height = Math.max(0, Math.round(rawHeight));

  const refX = pW * pos.scaleX + pos.offsetX;
  const refY = pH * pos.scaleY + pos.offsetY;

  const left = Math.round(refX - width * ax);
  const top = Math.round(refY - height * ay);

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  };
}

/**
 * Formats a UDim scale and offset into a CSS calc() expression.
 *
 * @param {number|string} scale
 * @param {number|string} offset
 * @returns {string} CSS calc() expression
 */
export function formatUDimCss(scale, offset) {
  const s = parseFloat(scale) || 0;
  const o = parseFloat(offset) || 0;
  if (o === 0) {
    return `calc(${s * 100}% + 0px)`;
  }
  if (o > 0) {
    return `calc(${s * 100}% + ${o}px)`;
  }
  return `calc(${s * 100}% - ${Math.abs(o)}px)`;
}

