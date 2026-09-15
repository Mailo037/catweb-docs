/**
 * CatWeb Styling Modifiers Engine
 *
 * Implements Roblox GUI styling modifiers:
 *   - UICorner: border-radius calculation from UDim (pills 9999px, percentage, pixel offsets)
 *   - UIStroke: border and contextual text outlines (inset box-shadow to conform with border-radius)
 *   - UIGradient: linear gradients with ColorSequence/NumberSequence and Roblox-to-CSS angle transformation
 *
 * Compatible with modern browsers and Node.js.
 * Zero external dependencies.
 */

import { parseUDim } from './coordinates.js';

/**
 * Converts a hex color string to rgba format with the given alpha transparency.
 *
 * @param {string} hex - Hex color string (#fff, #ffffff, or without #)
 * @param {number} [alpha=1] - Alpha value (0.0 to 1.0)
 * @returns {string} CSS rgba() string or original hex if alpha is 1
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
  let cleanHex = hex.trim().replace(/^#/, '');

  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    const a = Math.max(0, Math.min(1, parseFloat(alpha) || 0));
    if (a >= 1) return `#${cleanHex}`;
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
  }

  return hex;
}

/**
 * Parses a ColorSequence string or array.
 * e.g. '[[0,"#3b82f6"],[1,"#1d4ed8"]]' or [[0, "#3b82f6"], [1, "#1d4ed8"]]
 *
 * @param {string|Array} input
 * @returns {Array<[number, string]>} Array of [position, hexColor] stops
 */
export function parseColorSequence(input) {
  if (!input) return [[0, '#ffffff'], [1, '#ffffff']];
  if (Array.isArray(input)) return input;

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Manual regex fallback if not standard JSON
      const stops = [];
      const regex = /\[\s*([\d.]+)\s*,\s*["']?([#a-zA-Z0-9]+)["']?\s*\]/g;
      let m;
      while ((m = regex.exec(input)) !== null) {
        stops.push([parseFloat(m[1]), m[2].startsWith('#') ? m[2] : `#${m[2]}`]);
      }
      if (stops.length > 0) return stops;
    }
  }

  return [[0, '#ffffff'], [1, '#ffffff']];
}

/**
 * Parses a NumberSequence string or array (used for transparency stops).
 * e.g. '[[0, 0], [1, 0.5]]'
 *
 * @param {string|Array} input
 * @returns {Array<[number, number]>} Array of [position, numberValue] stops
 */
export function parseNumberSequence(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      const stops = [];
      const regex = /\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/g;
      let m;
      while ((m = regex.exec(input)) !== null) {
        stops.push([parseFloat(m[1]), parseFloat(m[2])]);
      }
      return stops;
    }
  }
  return [];
}

/**
 * Applies Roblox UICorner modifier to a DOM element.
 *
 * Parses UDim radius:
 *   - Scale >= 1: full pill / circle (border-radius: 9999px)
 *   - Scale > 0, Offset == 0: percentage (border-radius: 50%)
 *   - Scale > 0, Offset > 0: calc(scale% + offset px)
 *   - Offset only: pixel value (border-radius: 8px)
 *
 * @param {HTMLElement} domElement
 * @param {object} cornerNode - UICorner element node
 */
export function applyUICorner(domElement, cornerNode) {
  if (!domElement || !cornerNode) return;
  const radiusVal = cornerNode.radius ?? '0,8';

  try {
    const u = parseUDim(radiusVal);

    if (u.scale >= 1) {
      domElement.style.borderRadius = '9999px';
    } else if (u.scale > 0 && u.offset === 0) {
      domElement.style.borderRadius = `${u.scale * 100}%`;
    } else if (u.scale > 0 && u.offset > 0) {
      domElement.style.borderRadius = `calc(${u.scale * 100}% + ${u.offset}px)`;
    } else {
      domElement.style.borderRadius = `${u.offset}px`;
    }
  } catch {
    domElement.style.borderRadius = '8px';
  }
}

/**
 * Applies Roblox UIStroke modifier to a DOM element.
 *
 * Supports two stroke modes:
 *   - "Border": Conforms to border-radius without expanding container layout box.
 *     Emulated via `box-shadow: inset 0 0 0 ${thickness}px ${color}`.
 *   - "Contextual": On text elements, applies `-webkit-text-stroke: ${thickness}px ${color}`.
 *
 * @param {HTMLElement} domElement
 * @param {object} strokeNode - UIStroke element node
 */
export function applyUIStroke(domElement, strokeNode) {
  if (!domElement || !strokeNode) return;

  const thickness = parseFloat(strokeNode.stroke_thickness) || 1;
  const rawColor = strokeNode.stroke_color || '#000000';
  const transparency = parseFloat(strokeNode.stroke_transparency) || 0;
  const color = (transparency > 0) ? hexToRgba(rawColor, 1 - transparency) : rawColor;
  const mode = strokeNode.stroke_mode || 'Border';

  if (mode === 'Border') {
    domElement.style.boxShadow = `inset 0 0 0 ${thickness}px ${color}`;
  } else if (mode === 'Contextual') {
    domElement.style.WebkitTextStroke = `${thickness}px ${color}`;
    if (domElement.style.setProperty) {
      domElement.style.setProperty('-webkit-text-stroke', `${thickness}px ${color}`);
    }
  }
}

/**
 * Applies Roblox UIGradient modifier to a DOM element.
 *
 * Converts Roblox gradient rotation (where 0 deg is horizontal left-to-right)
 * to CSS linear-gradient angle:
 *   theta_css = (theta_roblox + 90) mod 360
 *
 * @param {HTMLElement} domElement
 * @param {object} gradientNode - UIGradient element node
 */
export function applyUIGradient(domElement, gradientNode) {
  if (!domElement || !gradientNode || !gradientNode.gradient_color) return;

  try {
    const colorStops = parseColorSequence(gradientNode.gradient_color);
    const transparencyStops = parseNumberSequence(gradientNode.gradient_transparency);

    // Roblox 0 deg = horizontal (left to right) -> CSS 90deg
    // Roblox 90 deg = vertical (top to bottom) -> CSS 180deg
    const robloxDeg = parseFloat(gradientNode.rotation) || 0;
    const cssDeg = ((Math.round(robloxDeg) + 90) % 360 + 360) % 360;

    const formattedStops = colorStops.map(([pos, hex]) => {
      let finalColor = hex.startsWith('#') ? hex : `#${hex}`;
      if (transparencyStops.length > 0) {
        // Interpolate transparency if provided
        const tStop = transparencyStops.find(t => Math.abs(t[0] - pos) < 0.05);
        if (tStop) {
          finalColor = hexToRgba(finalColor, 1 - tStop[1]);
        }
      }
      return `${finalColor} ${Math.round(pos * 100)}%`;
    });

    const gradientCss = `linear-gradient(${cssDeg}deg, ${formattedStops.join(', ')})`;
    domElement.style.backgroundImage = gradientCss;
  } catch { /* ignore styling error gracefully */ }
}

/**
 * Applies background color and background transparency according to Roblox GUI semantics.
 * In Roblox GUI, BackgroundTransparency (0 = fully opaque, 1 = fully invisible) controls ONLY
 * the background fill of the specific GuiObject. It NEVER applies CSS opacity or affects
 * any child elements or child text.
 *
 * @param {HTMLElement} domElement
 * @param {string|undefined} bgColor - Hex or CSS color string
 * @param {string|number|undefined} bgTrans - Transparency scalar (0.0 = opaque, 1.0 = invisible)
 */
export function applyBackgroundStyling(domElement, bgColor, bgTrans) {
  if (!domElement || !domElement.style) return;

  if (bgTrans !== undefined && bgTrans !== null && bgTrans !== '') {
    const trans = Math.max(0, Math.min(1, parseFloat(bgTrans) || 0));
    if (trans >= 1) {
      domElement.style.backgroundColor = 'transparent';
    } else if (trans <= 0) {
      domElement.style.backgroundColor = bgColor || '';
    } else {
      const baseColor = bgColor || '#ffffff';
      domElement.style.backgroundColor = hexToRgba(baseColor, 1 - trans);
    }
  } else if (bgColor) {
    domElement.style.backgroundColor = bgColor;
  }
}

/**
 * Applies text/font color and text transparency according to Roblox GUI semantics.
 * In Roblox GUI, TextTransparency (0 = fully opaque, 1 = fully invisible) controls ONLY
 * the text color of the specific element. It NEVER affects child elements or backgrounds.
 *
 * @param {HTMLElement} domElement
 * @param {string|undefined} fontColor - Hex or CSS color string
 * @param {string|number|undefined} fontTrans - Transparency scalar (0.0 = opaque, 1.0 = invisible)
 */
export function applyTextStyling(domElement, fontColor, fontTrans) {
  if (!domElement || !domElement.style) return;

  if (fontTrans !== undefined && fontTrans !== null && fontTrans !== '') {
    const trans = Math.max(0, Math.min(1, parseFloat(fontTrans) || 0));
    if (trans >= 1) {
      domElement.style.color = 'transparent';
    } else if (trans <= 0) {
      domElement.style.color = fontColor || '';
    } else {
      const baseColor = fontColor || '#000000';
      domElement.style.color = hexToRgba(baseColor, 1 - trans);
    }
  } else if (fontColor) {
    domElement.style.color = fontColor;
  }
}

