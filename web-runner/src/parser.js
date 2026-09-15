/**
 * CatWeb JSON Parser & Normalizer Engine
 * 
 * Ingests CatWeb documents (Full Site objects and Component Snippet arrays),
 * computes line/column diagnostics for syntax errors, detects document format,
 * and provides a tolerant normalization pipeline for preview rendering.
 *
 * Compatible with ES modules in modern browsers and Node.js.
 * Zero external dependencies.
 */

// Forbidden properties map to their canonical replacements
export const FORBIDDEN_PROPERTY_MAP = {
  layout_order: 'order',
  cell_size: 'size',
  anchor_point: 'anchor'
};

// Known color keys where hex codes must start with '#'
export const COLOR_KEYS = new Set([
  'background_color',
  'font_color',
  'placeholder_color',
  'stroke_color',
  'scrollbar_color',
  'image_color',
  'outline_color'
]);

// Enum mapping for case normalization
export const ENUM_CASE_MAP = {
  visible: { 'true': 'true', 'false': 'false' },
  auto_color: { 'true': 'true', 'false': 'false' },
  canvas: { 'true': 'true', 'false': 'false' },
  rich: { 'true': 'true', 'false': 'false' },
  wrap: { 'true': 'true', 'false': 'false' },
  truncate_text: { 'true': 'true', 'false': 'false' },
  multiline: { 'true': 'true', 'false': 'false' },
  editable: { 'true': 'true', 'false': 'false' },
  new_tab: { 'true': 'true', 'false': 'false' },
  enabled: { 'true': 'true', 'false': 'false' },
  wrap_list: { 'true': 'true', 'false': 'false' },
  align_x: { 'left': 'Left', 'center': 'Center', 'right': 'Right' },
  align_y: { 'top': 'Top', 'center': 'Center', 'bottom': 'Bottom' },
  font_weight: {
    'thin': 'Thin',
    'extralight': 'ExtraLight',
    'regular': 'Regular',
    'medium': 'Medium',
    'semibold': 'SemiBold',
    'bold': 'Bold',
    'extrabold': 'ExtraBold',
    'heavy': 'Heavy'
  },
  font_style: { 'normal': 'Normal', 'italic': 'Italic' },
  truncate: { 'atend': 'AtEnd', 'none': 'None', 'splitword': 'SplitWord' },
  scale_type: { 'crop': 'Crop', 'fit': 'Fit', 'slice': 'Slice', 'stretch': 'Stretch', 'tile': 'Tile' },
  resample_mode: { 'default': 'Default', 'pixelated': 'Pixelated' },
  stroke_mode: { 'border': 'Border', 'contextual': 'Contextual' },
  stroke_type: { 'round': 'Round', 'miter': 'Miter', 'bevel': 'Bevel' },
  direction: { 'vertical': 'Vertical', 'horizontal': 'Horizontal' },
  alignment_horizontal: { 'left': 'Left', 'center': 'Center', 'right': 'Right' },
  alignment_vertical: { 'top': 'Top', 'center': 'Center', 'bottom': 'Bottom' },
  horizontal_flex: {
    'none': 'None',
    'fill': 'Fill',
    'spacearound': 'SpaceAround',
    'spacebetween': 'SpaceBetween',
    'spaceevenly': 'SpaceEvenly'
  },
  vertical_flex: {
    'none': 'None',
    'fill': 'Fill',
    'spacearound': 'SpaceAround',
    'spacebetween': 'SpaceBetween',
    'spaceevenly': 'SpaceEvenly'
  },
  sort: { 'layoutorder': 'LayoutOrder', 'name': 'Name' },
  product_type: { 'gamepass': 'GamePass', 'asset': 'Asset', 'product': 'Product' }
};

/**
 * Calculates 1-based line and column from a character offset or SyntaxError.
 *
 * @param {string} text - Raw input JSON text
 * @param {number|Error} positionOrError - Character index or Error object
 * @returns {{ line: number, column: number, snippet: string }}
 */
export function findJsonLineColumn(text, positionOrError) {
  if (typeof text !== 'string') {
    return { line: 1, column: 1, snippet: '' };
  }

  let index = -1;

  if (typeof positionOrError === 'number') {
    index = positionOrError;
  } else if (positionOrError && positionOrError.message) {
    // V8 format: "... at position 123"
    const posMatch = positionOrError.message.match(/at position (\d+)/i);
    if (posMatch) {
      index = parseInt(posMatch[1], 10);
    } else {
      // JSC / SpiderMonkey format: "line 2 column 5"
      const lineColMatch = positionOrError.message.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        const line = parseInt(lineColMatch[1], 10);
        const column = parseInt(lineColMatch[2], 10);
        const lines = text.split(/\r?\n/);
        const targetLine = lines[line - 1] || '';
        const caret = ' '.repeat(Math.max(0, column - 1)) + '^';
        return { line, column, snippet: `${targetLine}\n${caret}` };
      }
    }
  }

  if (index < 0 || index > text.length) {
    index = Math.min(Math.max(0, index), text.length);
  }

  const lines = text.substring(0, index).split(/\r?\n/);
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  // Build snippet with context lines
  const allLines = text.split(/\r?\n/);
  const startLine = Math.max(0, line - 2);
  const endLine = Math.min(allLines.length, line + 2);
  const snippetLines = [];

  for (let i = startLine; i < endLine; i++) {
    const lineNum = (i + 1).toString().padStart(4, ' ');
    const marker = (i + 1 === line) ? '> ' : '  ';
    snippetLines.push(`${marker}${lineNum} | ${allLines[i]}`);
    if (i + 1 === line) {
      const indent = ' '.repeat(6 + column);
      snippetLines.push(`${indent}^`);
    }
  }

  return {
    line,
    column,
    snippet: snippetLines.join('\n')
  };
}

/**
 * Detects the root format of a CatWeb JSON structure.
 *
 * @param {any} data - Parsed data object or array
 * @returns {'site' | 'snippet' | 'unknown'}
 */
export function detectFormat(data) {
  if (Array.isArray(data)) {
    return 'snippet';
  }
  if (data && typeof data === 'object') {
    if ('webcontent' in data || ('title' in data && 'favicon' in data)) {
      return 'site';
    }
  }
  return 'unknown';
}

/**
 * Parses raw JSON string into a structured CatWeb representation with error reporting.
 *
 * @param {string|object|Array} input - JSON string or pre-parsed object/array
 * @param {object} [options]
 * @param {boolean} [options.tolerant=false] - If true, applies tolerant normalization
 * @returns {{
 *   success: boolean,
 *   format: 'site' | 'snippet' | 'unknown',
 *   data: any,
 *   rawText: string,
 *   repairs: Array<{ path: string, message: string, from: any, to: any }>,
 *   error: { message: string, line: number, column: number, snippet: string } | null
 * }}
 */
export function parseCatWebJson(input, options = {}) {
  const tolerant = options.tolerant === true;
  let rawText = '';
  let data = null;
  let error = null;

  if (typeof input === 'string') {
    rawText = input;
    try {
      data = JSON.parse(input);
    } catch (err) {
      const lineCol = findJsonLineColumn(input, err);
      return {
        success: false,
        format: 'unknown',
        data: null,
        rawText,
        repairs: [],
        error: {
          message: err.message,
          line: lineCol.line,
          column: lineCol.column,
          snippet: lineCol.snippet
        }
      };
    }
  } else {
    data = input;
    try {
      rawText = JSON.stringify(input, null, 2);
    } catch {
      rawText = '';
    }
  }

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      format: 'unknown',
      data: null,
      rawText,
      repairs: [],
      error: {
        message: 'Root must be a JSON object (Full Site) or an array (Component Snippet).',
        line: 1,
        column: 1,
        snippet: ''
      }
    };
  }

  const format = detectFormat(data);
  let repairs = [];

  if (tolerant) {
    const normResult = normalizeCatWeb(data, options);
    data = normResult.normalized;
    repairs = normResult.repairs;
  }

  return {
    success: true,
    format,
    data,
    rawText,
    repairs,
    error: null
  };
}

/**
 * Extracts root elements list regardless of whether the document is a Full Site or Snippet.
 * Supports multi-root sibling elements directly.
 *
 * @param {any} data - Parsed CatWeb document
 * @returns {Array<any>} Array of top-level element nodes
 */
export function getRootElements(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && Array.isArray(data.webcontent)) {
    return data.webcontent;
  }
  return [];
}

/**
 * Deeply normalizes a CatWeb document to coerce unquoted numbers/booleans,
 * prefix hex colors with '#', remap forbidden properties, and canonicalize enum casing.
 *
 * @param {any} inputData - Parsed CatWeb object or array
 * @param {object} [options]
 * @param {boolean} [options.coerceNumbers=true]
 * @param {boolean} [options.coerceBooleans=true]
 * @param {boolean} [options.prefixHexColors=true]
 * @param {boolean} [options.fixForbiddenProperties=true]
 * @param {boolean} [options.normalizeEnums=true]
 * @returns {{ normalized: any, repairs: Array<{ path: string, message: string, from: any, to: any }> }}
 */
export function normalizeCatWeb(inputData, options = {}) {
  const coerceNumbers = options.coerceNumbers !== false;
  const coerceBooleans = options.coerceBooleans !== false;
  const prefixHexColors = options.prefixHexColors !== false;
  const fixForbidden = options.fixForbiddenProperties !== false;
  const normalizeEnums = options.normalizeEnums !== false;

  const repairs = [];

  function normalizeNode(node, currentPath) {
    if (node === null || typeof node !== 'object') {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map((item, idx) => normalizeNode(item, `${currentPath}[${idx}]`));
    }

    const output = {};

    for (const [rawKey, rawVal] of Object.entries(node)) {
      let key = rawKey;
      let val = rawVal;
      const propPath = `${currentPath}.${key}`;

      // 1. Remap forbidden properties (e.g. layout_order -> order)
      if (fixForbidden && FORBIDDEN_PROPERTY_MAP[key]) {
        const canonicalKey = FORBIDDEN_PROPERTY_MAP[key];
        repairs.push({
          path: propPath,
          message: `Remapped forbidden property "${key}" to "${canonicalKey}".`,
          from: key,
          to: canonicalKey
        });
        key = canonicalKey;
      }

      // 2. Normalize values on elements
      // Skip deep structures like children, content, actions, text (they have dedicated handlers)
      if (key === 'children' || key === 'content' || key === 'actions') {
        output[key] = normalizeNode(val, propPath);
        continue;
      }

      if (key === 'text' && Array.isArray(val)) {
        // Parameter slots in action/event text arrays
        output[key] = val.map((slot, sIdx) => {
          if (slot && typeof slot === 'object') {
            return normalizeNode(slot, `${propPath}[${sIdx}]`);
          }
          return slot;
        });
        continue;
      }

      // Value coercions
      if (coerceNumbers && typeof val === 'number') {
        const stringVal = String(val);
        repairs.push({
          path: propPath,
          message: `Coerced raw number ${val} to quoted string "${stringVal}".`,
          from: val,
          to: stringVal
        });
        val = stringVal;
      } else if (coerceBooleans && typeof val === 'boolean') {
        const stringVal = val ? 'true' : 'false';
        repairs.push({
          path: propPath,
          message: `Coerced raw boolean ${val} to quoted string "${stringVal}".`,
          from: val,
          to: stringVal
        });
        val = stringVal;
      } else if (typeof val === 'string') {
        // Hex color prefixing
        if (prefixHexColors && (COLOR_KEYS.has(key) || key === 'background')) {
          if (/^[0-9a-fA-F]{3,8}$/.test(val)) {
            const prefixed = `#${val}`;
            repairs.push({
              path: propPath,
              message: `Auto-prefixed '#' to hex color "${val}" -> "${prefixed}".`,
              from: val,
              to: prefixed
            });
            val = prefixed;
          }
        }

        // Enum case normalization
        if (normalizeEnums && ENUM_CASE_MAP[key]) {
          const lower = val.toLowerCase();
          const canonical = ENUM_CASE_MAP[key][lower];
          if (canonical && canonical !== val) {
            repairs.push({
              path: propPath,
              message: `Normalized enum casing "${val}" to "${canonical}".`,
              from: val,
              to: canonical
            });
            val = canonical;
          }
        }
      }

      output[key] = val;
    }

    return output;
  }

  const normalized = normalizeNode(inputData, '$');

  return {
    normalized,
    repairs
  };
}
