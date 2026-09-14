#!/usr/bin/env node
/**
 * CatWeb JSON Semantic Validator (Roblox v2.18.2.3)
 * Comprehensive validator enforcing structural, scalar, styling, and script invariants.
 *
 * Usage:
 *   node tools/validate.js <file-or-directory> [...]
 *   node tools/validate.js --help
 */

import fs from 'node:fs';
import path from 'node:path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

/* ============================================================
 * SPECIFICATION CONSTANTS & DICTIONARIES
 * ============================================================ */

export const VALID_CLASSES = new Set([
  'Frame', 'ScrollingFrame', 'TextLabel', 'TextButton', 'TextBox', 'ImageLabel',
  'TextButton?link', 'TextButton?donation', 'TextButton?transfer', 'TextButton?avataritem',
  'Folder', 'script',
  'UICorner', 'UIStroke', 'UIGradient', 'UIPadding', 'UIListLayout', 'UIGridLayout',
  'UIAspectRatioConstraint', 'UISizeConstraint', 'UITextSizeConstraint'
]);

export const VALID_VALUES = {
  visible:              ['true', 'false'],
  auto_color:           ['true', 'false'],
  canvas:               ['true', 'false'],
  rich:                 ['true', 'false'],
  wrap:                 ['true', 'false'],
  truncate_text:        ['true', 'false'],
  multiline:            ['true', 'false'],
  editable:             ['true', 'false'],
  new_tab:              ['true', 'false'],
  enabled:              ['true', 'false'],
  wrap_list:            ['true', 'false'],
  align_x:              ['Left', 'Center', 'Right'],
  align_y:              ['Top', 'Center', 'Bottom'],
  font_weight:          ['Thin', 'ExtraLight', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Heavy'],
  font_style:           ['Normal', 'Italic'],
  truncate:             ['AtEnd', 'None', 'SplitWord'],
  scale_type:           ['Crop', 'Fit', 'Slice', 'Stretch', 'Tile'],
  resample_mode:        ['Default', 'Pixelated'],
  stroke_mode:          ['Border', 'Contextual'],
  stroke_type:          ['Round', 'Miter', 'Bevel'],
  direction:            ['Vertical', 'Horizontal'],
  alignment_horizontal: ['Left', 'Center', 'Right'],
  alignment_vertical:   ['Top', 'Center', 'Bottom'],
  horizontal_flex:      ['None', 'Fill', 'SpaceAround', 'SpaceBetween', 'SpaceEvenly'],
  vertical_flex:        ['None', 'Fill', 'SpaceAround', 'SpaceBetween', 'SpaceEvenly'],
  sort:                 ['LayoutOrder', 'Name'],
  product_type:         ['GamePass', 'Asset', 'Product']
};

export const COLOR_KEYS = new Set([
  'background_color', 'font_color', 'placeholder_color',
  'stroke_color', 'scrollbar_color', 'image_color', 'outline_color'
]);

export const TRANSPARENCY_KEYS = new Set([
  'background_transparency', 'font_transparency', 'image_transparency',
  'stroke_transparency', 'scrollbar_transparency'
]);

// Authoritative Event IDs (§7.1)
export const EVENT_IDS = new Set([
  '0', '1', '2', '3', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'
]);

// Authoritative Action IDs (§7.2 - §7.8)
export const ACTION_IDS = new Set([
  // Logging & Timing
  '0', '1', '2', '3',
  // System & Environment
  '4', '32', '33', '84', '85', '117', '34', '36', '62',
  // Objects & Display
  '8', '9', '10', '30', '31', '39', '49', '50', '58', '88', '106',
  // Variables & Math
  '11', '12', '13', '14', '15', '16', '17', '27', '40', '41', '78', '96', '114',
  // Strings & Conversions
  '42', '43', '48', '57', '69', '70', '109', '119', '121',
  // Audio
  '5', '26', '28',
  // Tables & Arrays
  '54', '55', '56', '59', '66', '89', '90', '91', '110', '113',
  // Conditionals & Loops
  '18', '19', '20', '21', '22', '23', '24', '25', '37', '38', '44', '45', '46', '47',
  '79', '80', '81', '82', '92', '93', '103', '104', '105', '108', '112', '125', '126'
]);

// Control flow actions that must NEVER have nested actions arrays
export const CONTROL_FLOW_ACTION_IDS = new Set([
  '18', '19', '20', '21', '125', '126', '37', '38', '92', '93',
  '44', '45', '46', '47', '79', '80', '81', '82', '108', '103', '104', '105',
  '112', '22', '23'
]);

const FORBIDDEN_PROPERTY_MAP = {
  layout_order: 'order',
  cell_size: 'size',
  anchor_point: 'anchor'
};

const UDIM2_REGEX = /^\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}\s*,\s*\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}$/;
const UDIM_REGEX = /^(-?[\d.]+)\s*,\s*(-?[\d.]+)$/;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
const GLOBAL_ID_REGEX = /^[A-Za-z0-9_~;.-]{2,3}$/;

/* ============================================================
 * CORE VALIDATOR
 * ============================================================ */

/**
 * Validates a CatWeb JSON string or JavaScript object.
 *
 * @param {string|object|Array} input - CatWeb site/snippet JSON
 * @param {object} [options]
 * @param {boolean} [options.strict=true] - If true, warnings are emitted for non-numeric variables etc.
 * @returns {object} { valid, format, errors, warnings, stats }
 */
export function validateCatWeb(input, options = {}) {
  const strict = options.strict !== false;
  const errors = [];
  const warnings = [];

  const stats = {
    elementsCount: 0,
    scriptsCount: 0,
    eventsCount: 0,
    actionsCount: 0,
    globalIdsCount: 0,
    uniqueAliasesCount: 0
  };

  let data;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return {
        valid: false,
        format: 'unknown',
        errors: [{
          path: '$',
          code: 'INVALID_JSON_SYNTAX',
          message: `JSON syntax error: ${err.message}`,
          suggestion: 'Ensure the input is well-formed JSON without trailing commas or comments.'
        }],
        warnings: [],
        stats
      };
    }
  } else {
    data = input;
  }

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      format: 'unknown',
      errors: [{
        path: '$',
        code: 'INVALID_ROOT',
        message: 'Root must be either a Full Site JSON object or a Component Snippet JSON array.',
        suggestion: 'Provide either { favicon, title, background, webcontent: [...] } or [ { class: "Frame", ... } ].'
      }],
      warnings: [],
      stats
    };
  }

  // Determine format
  let format = 'unknown';
  let rootElements = [];

  if (Array.isArray(data)) {
    format = 'snippet';
    rootElements = data;
    if (rootElements.length === 0) {
      errors.push({
        path: '$',
        code: 'EMPTY_SNIPPET',
        message: 'Component snippet array is empty.',
        suggestion: 'Include at least one element in the snippet array.'
      });
    }
  } else {
    format = 'site';
    const requiredRootKeys = ['favicon', 'title', 'background', 'webcontent'];
    for (const key of requiredRootKeys) {
      if (!(key in data)) {
        errors.push({
          path: `$`,
          code: 'MISSING_ROOT_KEY',
          message: `Full Site object is missing required root key "${key}".`,
          suggestion: `Add "${key}" to the root JSON object.`
        });
      }
    }

    if (data.favicon !== undefined) {
      if (typeof data.favicon !== 'string' || !/^\d+$/.test(data.favicon)) {
        errors.push({
          path: '$.favicon',
          code: 'INVALID_FAVICON',
          message: `Favicon must be a numeric Roblox asset ID as a quoted string (found: ${JSON.stringify(data.favicon)}).`,
          suggestion: 'Provide a numeric asset ID string like "16944769468".'
        });
      }
    }

    if (data.background !== undefined) {
      if (typeof data.background !== 'string' || !HEX_COLOR_REGEX.test(data.background)) {
        errors.push({
          path: '$.background',
          code: 'INVALID_BACKGROUND_COLOR',
          message: `Root background color must be a valid hex string starting with '#' (found: ${JSON.stringify(data.background)}).`,
          suggestion: 'Format as hex code, e.g. "#0f0f11".'
        });
      }
    }

    if (data.webcontent !== undefined) {
      if (!Array.isArray(data.webcontent)) {
        errors.push({
          path: '$.webcontent',
          code: 'INVALID_WEBCONTENT',
          message: 'Root "webcontent" must be an array of element objects.',
          suggestion: 'Set "webcontent": [ ... ]'
        });
      } else {
        rootElements = data.webcontent;
        if (rootElements.length === 0) {
          warnings.push({
            path: '$.webcontent',
            code: 'EMPTY_WEBCONTENT',
            message: '"webcontent" array is empty.',
            suggestion: 'Add UI elements or scripts to "webcontent".'
          });
        }
      }
    }
  }

  // Cross-reference tracking
  const declaredGlobalIds = new Map(); // globalid -> path
  const declaredAliases = new Map();   // alias -> path
  const referencedObjectIds = [];     // { id, path, context }

  // Recursive element traversal
  function validateElement(element, currentPath) {
    if (!element || typeof element !== 'object' || Array.isArray(element)) {
      errors.push({
        path: currentPath,
        code: 'INVALID_ELEMENT_NODE',
        message: `Expected element to be an object, but got ${Array.isArray(element) ? 'array' : typeof element}.`,
        suggestion: 'Element must be a JSON object with at least a "class" property.'
      });
      return;
    }

    stats.elementsCount++;

    // Check class
    const elClass = element.class;
    if (typeof elClass !== 'string' || !VALID_CLASSES.has(elClass)) {
      errors.push({
        path: `${currentPath}.class`,
        code: 'INVALID_CLASS',
        message: `Unknown or missing element class: ${JSON.stringify(elClass)}.`,
        suggestion: `Allowed classes: ${Array.from(VALID_CLASSES).join(', ')}.`
      });
    }

    // Check globalid
    if (element.globalid !== undefined) {
      const gid = element.globalid;
      if (typeof gid !== 'string' || !GLOBAL_ID_REGEX.test(gid)) {
        errors.push({
          path: `${currentPath}.globalid`,
          code: 'INVALID_GLOBALID_FORMAT',
          message: `globalid "${gid}" is invalid. It must be 2-3 characters matching ^[A-Za-z0-9_~;.-]{2,3}$.`,
          suggestion: 'Use a compact 2-3 character identifier like "5m", "rt", "b1", "sc".'
        });
      } else {
        if (declaredGlobalIds.has(gid)) {
          errors.push({
            path: `${currentPath}.globalid`,
            code: 'DUPLICATE_GLOBALID',
            message: `Duplicate globalid "${gid}" detected! (First declared at ${declaredGlobalIds.get(gid)}).`,
            suggestion: 'Every globalid in the entire document must be strictly unique.'
          });
        } else {
          declaredGlobalIds.set(gid, currentPath);
          stats.globalIdsCount++;
        }
      }
    } else if (elClass !== 'Folder') {
      warnings.push({
        path: currentPath,
        code: 'MISSING_GLOBALID',
        message: `Element of class "${elClass}" has no "globalid".`,
        suggestion: 'Assign a unique 2-3 character globalid to allow scripting and styling references.'
      });
    }

    // Check alias
    if (element.alias !== undefined) {
      if (typeof element.alias !== 'string') {
        errors.push({
          path: `${currentPath}.alias`,
          code: 'INVALID_ALIAS',
          message: 'Property "alias" must be a string.',
          suggestion: 'Provide a lowercase string label like "hero_container".'
        });
      } else {
        if (declaredAliases.has(element.alias)) {
          warnings.push({
            path: `${currentPath}.alias`,
            code: 'DUPLICATE_ALIAS',
            message: `Duplicate alias "${element.alias}" detected (also used at ${declaredAliases.get(element.alias)}).`,
            suggestion: 'Aliases are recommended to be unique for clarity in the CatWeb editor hierarchy.'
          });
        } else {
          declaredAliases.set(element.alias, currentPath);
          stats.uniqueAliasesCount++;
        }
      }
    }

    // Check properties & scalars
    for (const [key, val] of Object.entries(element)) {
      const propPath = `${currentPath}.${key}`;

      // 1. Forbidden properties
      if (FORBIDDEN_PROPERTY_MAP[key]) {
        const correct = FORBIDDEN_PROPERTY_MAP[key];
        errors.push({
          path: propPath,
          code: 'FORBIDDEN_PROPERTY',
          message: `Forbidden property "${key}" found! CatWeb throws fatal [INVALIDATED] import rejection for this.`,
          suggestion: `Replace "${key}" with "${correct}".`
        });
      }

      // 2. Strict Scalar Typings (Invariant: Every scalar must be quoted string)
      if (key !== 'children' && key !== 'content' && key !== 'actions' && key !== 'text') {
        if (val === null) {
          errors.push({
            path: propPath,
            code: 'RAW_NULL_SCALAR',
            message: `Raw null value found at "${key}". In CatWeb, all scalars must be quoted strings.`,
            suggestion: `Remove the property or set it to a valid string value.`
          });
        } else if (typeof val === 'number') {
          errors.push({
            path: propPath,
            code: 'RAW_NUMBER_SCALAR',
            message: `Raw number ${val} found at "${key}". In CatWeb, all numbers must be quoted strings.`,
            suggestion: `Wrap the number in quotes: "${val}".`
          });
        } else if (typeof val === 'boolean') {
          errors.push({
            path: propPath,
            code: 'RAW_BOOLEAN_SCALAR',
            message: `Raw boolean ${val} found at "${key}". In CatWeb, all booleans must be quoted strings ("true" or "false").`,
            suggestion: `Wrap the boolean in quotes: "${val}".`
          });
        }
      }

      // 3. Coordinate validation
      if (typeof val === 'string') {
        if (key === 'position' || (key === 'size' && elClass !== 'UIGridLayout')) {
          if (val !== 'auto' && val !== 'auto_x' && val !== 'auto_y' && !UDIM2_REGEX.test(val)) {
            errors.push({
              path: propPath,
              code: 'INVALID_UDIM2',
              message: `Invalid UDim2 coordinate format: "${val}".`,
              suggestion: 'Expected format: "{xScale,xOffset},{yScale,yOffset}" (e.g. "{1,0},{0,40}").'
            });
          }
        } else if (key === 'size' && elClass === 'UIGridLayout') {
          if (!UDIM2_REGEX.test(val)) {
            errors.push({
              path: propPath,
              code: 'INVALID_GRID_SIZE',
              message: `Invalid UIGridLayout cell size format: "${val}".`,
              suggestion: 'Expected UDim2 cell size format: "{xScale,xOffset},{yScale,yOffset}" (e.g. "{0,180},{0,120}").'
            });
          }
        } else if (key === 'radius' && elClass === 'UICorner') {
          if (!UDIM_REGEX.test(val)) {
            errors.push({
              path: propPath,
              code: 'INVALID_UDIM_RADIUS',
              message: `Invalid UICorner radius format: "${val}".`,
              suggestion: 'Expected UDim format: "scale,offset" (e.g. "0,8" for 8px, or "1,0" for pill/circle).'
            });
          }
        } else if (key === 'anchor') {
          if (!/^\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/.test(val)) {
            errors.push({
              path: propPath,
              code: 'INVALID_ANCHOR',
              message: `Invalid anchor format: "${val}".`,
              suggestion: 'Expected format: "x,y" with values from 0 to 1 (e.g. "0.5,0.5" for center).'
            });
          }
        }

        // 4. Hex colors
        if (COLOR_KEYS.has(key)) {
          if (!HEX_COLOR_REGEX.test(val)) {
            errors.push({
              path: propPath,
              code: 'INVALID_HEX_COLOR',
              message: `Invalid hex color code: "${val}". Must start with '#' and contain 3, 4, 6, or 8 hex characters.`,
              suggestion: `Format as a hex string like "#1a1a1a" or "#ffffff".`
            });
          }
        }

        // 5. Transparencies
        if (TRANSPARENCY_KEYS.has(key)) {
          const num = parseFloat(val);
          if (isNaN(num) || num < 0 || num > 1) {
            errors.push({
              path: propPath,
              code: 'INVALID_TRANSPARENCY',
              message: `Invalid transparency value: "${val}". Must be a decimal number string between 0 and 1.`,
              suggestion: 'Use "0" for opaque, "1" for invisible, or "0.5" for 50% transparency.'
            });
          }
        }

        // 6. Enums
        if (VALID_VALUES[key]) {
          const allowed = VALID_VALUES[key];
          if (!allowed.includes(val)) {
            const match = allowed.find(a => a.toLowerCase() === val.toLowerCase());
            errors.push({
              path: propPath,
              code: 'INVALID_ENUM_VALUE',
              message: `Invalid value "${val}" for enum property "${key}".`,
              suggestion: match
                ? `Value is case-sensitive. Did you mean "${match}"?`
                : `Allowed values: ${allowed.map(v => `"${v}"`).join(', ')}.`
            });
          }
        }
      }
    }

    // Special class: Script
    if (elClass === 'script') {
      validateScriptElement(element, currentPath);
    }

    // Recurse children
    if (element.children !== undefined) {
      if (!Array.isArray(element.children)) {
        errors.push({
          path: `${currentPath}.children`,
          code: 'INVALID_CHILDREN',
          message: 'Property "children" must be an array of element objects.',
          suggestion: 'Format as "children": [ ... ]'
        });
      } else {
        for (let i = 0; i < element.children.length; i++) {
          validateElement(element.children[i], `${currentPath}.children[${i}]`);
        }
      }
    }
  }

  // Script Element Validator
  function validateScriptElement(scriptEl, scriptPath) {
    stats.scriptsCount++;

    if (scriptEl.enabled !== undefined && scriptEl.enabled !== 'true' && scriptEl.enabled !== 'false') {
      errors.push({
        path: `${scriptPath}.enabled`,
        code: 'INVALID_ENABLED',
        message: `Script property "enabled" must be "true" or "false" string (found: ${JSON.stringify(scriptEl.enabled)}).`,
        suggestion: 'Set "enabled": "true" or "enabled": "false".'
      });
    }

    if (!Array.isArray(scriptEl.content)) {
      errors.push({
        path: `${scriptPath}.content`,
        code: 'INVALID_SCRIPT_CONTENT',
        message: 'Script element must contain an array in property "content".',
        suggestion: 'Set "content": [ ... ] containing event and function blocks.'
      });
      return;
    }

    if (scriptEl.content.length > 30) {
      warnings.push({
        path: `${scriptPath}.content`,
        code: 'SCRIPT_EVENT_LIMIT_EXCEEDED',
        message: `Script contains ${scriptEl.content.length} events (CatWeb recommendation/limit is max 30 events per script).`,
        suggestion: 'Split logic across multiple script elements.'
      });
    }

    let scriptTotalActions = 0;

    for (let i = 0; i < scriptEl.content.length; i++) {
      const block = scriptEl.content[i];
      const blockPath = `${scriptPath}.content[${i}]`;

      if (!block || typeof block !== 'object') {
        errors.push({
          path: blockPath,
          code: 'INVALID_BLOCK',
          message: 'Script content entry must be an event or function block object.',
          suggestion: 'Provide an event block object.'
        });
        continue;
      }

      stats.eventsCount++;

      // Event ID
      if (typeof block.id !== 'string' || !EVENT_IDS.has(block.id)) {
        errors.push({
          path: `${blockPath}.id`,
          code: 'INVALID_EVENT_ID',
          message: `Unknown or invalid event ID "${block.id}".`,
          suggestion: `Valid event IDs: ${Array.from(EVENT_IDS).join(', ')}.`
        });
      }

      // Event globalid
      if (block.globalid) {
        if (typeof block.globalid !== 'string' || !GLOBAL_ID_REGEX.test(block.globalid)) {
          errors.push({
            path: `${blockPath}.globalid`,
            code: 'INVALID_GLOBALID',
            message: `Event globalid "${block.globalid}" is invalid. Must match ^[A-Za-z0-9_~;.-]{2,3}$.`,
            suggestion: 'Use a compact 2-3 character identifier.'
          });
        } else {
          if (declaredGlobalIds.has(block.globalid)) {
            errors.push({
              path: `${blockPath}.globalid`,
              code: 'DUPLICATE_GLOBALID',
              message: `Duplicate globalid "${block.globalid}" on event! (First declared at ${declaredGlobalIds.get(block.globalid)}).`,
              suggestion: 'Make all globalids unique.'
            });
          } else {
            declaredGlobalIds.set(block.globalid, blockPath);
            stats.globalIdsCount++;
          }
        }
      }

      // Event text array
      if (!Array.isArray(block.text)) {
        errors.push({
          path: `${blockPath}.text`,
          code: 'INVALID_EVENT_TEXT',
          message: 'Event "text" must be an array of strings and parameter objects, never a flat string.',
          suggestion: 'Format as ["When", {"value": "btn", "t": "object", "l": "button"}, "pressed..."]'
        });
      } else {
        inspectTextArray(block.text, `${blockPath}.text`);
      }

      // Actions array
      if (block.actions !== undefined) {
        if (!Array.isArray(block.actions)) {
          errors.push({
            path: `${blockPath}.actions`,
            code: 'INVALID_ACTIONS_ARRAY',
            message: 'Event "actions" must be an array.',
            suggestion: 'Set "actions": [ ... ]'
          });
        } else {
          if (block.actions.length > 120) {
            warnings.push({
              path: `${blockPath}.actions`,
              code: 'EVENT_ACTION_LIMIT_EXCEEDED',
              message: `Event contains ${block.actions.length} actions (CatWeb limit is 120 actions per event).`,
              suggestion: 'Decompose long action sequences using functions or broadcasts.'
            });
          }

          scriptTotalActions += block.actions.length;

          function validateActionList(actionsList, listPath) {
            for (let a = 0; a < actionsList.length; a++) {
              const action = actionsList[a];
              const actPath = `${listPath}[${a}]`;

              if (!action || typeof action !== 'object') {
                errors.push({
                  path: actPath,
                  code: 'INVALID_ACTION_NODE',
                  message: 'Action must be an object.',
                  suggestion: 'Provide an action block object with "id", "globalid", and "text".'
                });
                continue;
              }

              stats.actionsCount++;

              // Action ID
              if (typeof action.id !== 'string' || !ACTION_IDS.has(action.id)) {
                errors.push({
                  path: `${actPath}.id`,
                  code: 'INVALID_ACTION_ID',
                  message: `Unknown or invalid action ID "${action.id}".`,
                  suggestion: `Action ID must match a confirmed CatWeb block ID.`
                });
              }

              // Action globalid
              if (action.globalid) {
                if (typeof action.globalid !== 'string' || !GLOBAL_ID_REGEX.test(action.globalid)) {
                  errors.push({
                    path: `${actPath}.globalid`,
                    code: 'INVALID_GLOBALID',
                    message: `Action globalid "${action.globalid}" is invalid. Must match ^[A-Za-z0-9_~;.-]{2,3}$.`,
                    suggestion: 'Use a compact 2-3 character identifier.'
                  });
                } else {
                  if (declaredGlobalIds.has(action.globalid)) {
                    errors.push({
                      path: `${actPath}.globalid`,
                      code: 'DUPLICATE_GLOBALID',
                      message: `Duplicate globalid "${action.globalid}" on action! (First declared at ${declaredGlobalIds.get(action.globalid)}).`,
                      suggestion: 'Make all globalids unique.'
                    });
                  } else {
                    declaredGlobalIds.set(action.globalid, actPath);
                    stats.globalIdsCount++;
                  }
                }
              }

              // HARD INVARIANT: Flat control flow (no nested actions array)
              if (CONTROL_FLOW_ACTION_IDS.has(action.id)) {
                if (action.actions !== undefined) {
                  errors.push({
                    path: `${actPath}.actions`,
                    code: 'NESTED_CONTROL_FLOW_ACTIONS',
                    message: `Control flow action (id "${action.id}") contains a nested "actions" array! In CatWeb, control flow must be FLAT sibling actions ending with an "end" (id 25) block.`,
                    suggestion: 'Remove nested "actions" and place body actions as flat siblings after this block, followed by an "end" block.'
                  });
                  if (Array.isArray(action.actions)) {
                    validateActionList(action.actions, `${actPath}.actions`);
                  }
                }
              }

              // Action text array
              if (!Array.isArray(action.text)) {
                errors.push({
                  path: `${actPath}.text`,
                  code: 'INVALID_ACTION_TEXT',
                  message: 'Action "text" must be an array of strings and parameter objects.',
                  suggestion: 'Format as an array matching the block specification.'
                });
              } else {
                inspectTextArray(action.text, `${actPath}.text`);

                // Special Check: Property Manipulation (31 Set, 39 Get, 88 Tween)
                if (['31', '39', '88'].includes(action.id)) {
                  const propItem = action.text.find(it => it && typeof it === 'object' && it.l === 'property');
                  if (propItem && typeof propItem.value === 'string') {
                    const val = propItem.value;
                    const firstChar = val.charAt(0);
                    if (firstChar !== firstChar.toUpperCase() || val.includes('_')) {
                      errors.push({
                        path: `${actPath}.text`,
                        code: 'INVALID_SCRIPT_PROPERTY_CASE',
                        message: `Script property name "${val}" must be Title Case (e.g. "Background Color", "Text", "Order"), not snake_case!`,
                        suggestion: `Change "${val}" to Title Case equivalent.`
                      });
                    }
                  }
                }

                // Special Check: Wait block action ID
                if (action.id === '22' || action.id === '23' || action.id === '24') {
                  const firstString = action.text[0];
                  if (typeof firstString === 'string' && firstString.toLowerCase().includes('wait')) {
                    errors.push({
                      path: `${actPath}.id`,
                      code: 'WRONG_WAIT_BLOCK_ID',
                      message: `Wait action cannot use loop ID "${action.id}". Wait is Action ID "3" under the Logic category!`,
                      suggestion: 'Change action ID to "3".'
                    });
                  }
                }
              }
            }
          }

          validateActionList(block.actions, `${blockPath}.actions`);
        }
      }
    }

    if (scriptTotalActions > 3600) {
      warnings.push({
        path: scriptPath,
        code: 'SCRIPT_TOTAL_ACTION_LIMIT_EXCEEDED',
        message: `Script contains ${scriptTotalActions} total actions (CatWeb max recommendation is 3,600).`,
        suggestion: 'Decompose across multiple scripts.'
      });
    }
  }

  // Inspect parameter slots in action/event text arrays
  function inspectTextArray(textArray, arrayPath) {
    for (let i = 0; i < textArray.length; i++) {
      const item = textArray[i];
      const itemPath = `${arrayPath}[${i}]`;

      if (typeof item === 'string') {
        continue;
      }

      if (!item || typeof item !== 'object') {
        errors.push({
          path: itemPath,
          code: 'INVALID_TEXT_PARAMETER_SLOT',
          message: `Text array item must be either a string literal or a parameter object. Found: ${typeof item}.`,
          suggestion: 'Provide a parameter object: { "value": ..., "t": ... }'
        });
        continue;
      }

      // Check slot type
      if (!item.t || typeof item.t !== 'string') {
        errors.push({
          path: `${itemPath}.t`,
          code: 'MISSING_SLOT_TYPE',
          message: 'Parameter slot is missing type property "t".',
          suggestion: 'Add "t": "string" | "number" | "object" | "key" | "any" | "tuple" | "id".'
        });
      }

      // Check object reference
      if (item.t === 'object' && typeof item.value === 'string') {
        referencedObjectIds.push({
          id: item.value,
          path: `${itemPath}.value`
        });
      }

      // Moderation warning for variable names
      if (strict && item.l === 'variable' && typeof item.value === 'string') {
        if (!/^\d+$/.test(item.value) && !/^l!\d+$/.test(item.value) && !/^o!\d+$/.test(item.value)) {
          warnings.push({
            path: `${itemPath}.value`,
            code: 'POTENTIAL_MODERATION_VARIABLE',
            message: `Variable name "${item.value}" is not numeric. Roblox text filters often moderate named variables into "######".`,
            suggestion: `Consider using numeric global variables like "1", "2" or scoped "l!1".`
          });
        }
      }
    }
  }

  // Traverse all root elements
  for (let i = 0; i < rootElements.length; i++) {
    const elPath = format === 'site' ? `$.webcontent[${i}]` : `$[${i}]`;
    validateElement(rootElements[i], elPath);
  }

  // Post-pass: Verify referenced object IDs exist in document
  const reservedObjectKeywords = new Set(['(parent)', '(self)', '(page)', '(root)', 'parent', 'self']);
  for (const ref of referencedObjectIds) {
    if (!reservedObjectKeywords.has(ref.id) && !declaredGlobalIds.has(ref.id)) {
      errors.push({
        path: ref.path,
        code: 'UNRESOLVED_OBJECT_REFERENCE',
        message: `Script references object with globalid "${ref.id}", but no element with this globalid exists in the document!`,
        suggestion: `Ensure the target element exists and has "globalid": "${ref.id}".`
      });
    }
  }

  return {
    valid: errors.length === 0,
    format,
    errors,
    warnings,
    stats
  };
}

/* ============================================================
 * CLI FORMATTER & RUNNER
 * ============================================================ */

function printIssue(issue, isError = true) {
  const badge = isError
    ? `${colors.bgRed}${colors.white}${colors.bold} FAIL ${colors.reset}`
    : `${colors.bgYellow}${colors.white}${colors.bold} WARN ${colors.reset}`;

  const codeColor = isError ? colors.red : colors.yellow;

  console.log(`  ${badge} ${codeColor}${colors.bold}[${issue.code}]${colors.reset} at ${colors.cyan}${issue.path}${colors.reset}`);
  console.log(`    ${colors.white}${issue.message}${colors.reset}`);
  if (issue.suggestion) {
    console.log(`    ${colors.dim}Suggestion: ${issue.suggestion}${colors.reset}`);
  }
  console.log('');
}

export function validateFile(filePath, options = {}) {
  const fullPath = path.resolve(filePath);
  const relPath = path.relative(process.cwd(), fullPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.bgRed}${colors.white}${colors.bold} NOT FOUND ${colors.reset} ${colors.red}${relPath}${colors.reset}`);
    return { valid: false, errorsCount: 1, warningsCount: 0 };
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  const result = validateCatWeb(raw, options);

  console.log(`\n${colors.bold}━━━ Validating ${colors.cyan}${relPath}${colors.reset} (${colors.magenta}${result.format.toUpperCase()}${colors.reset}) ━━━`);

  if (result.valid && result.warnings.length === 0) {
    console.log(`  ${colors.bgGreen}${colors.white}${colors.bold} PASS ${colors.reset} ${colors.green}All CatWeb invariants satisfied! (0 errors, 0 warnings)${colors.reset}`);
  } else {
    for (const err of result.errors) {
      printIssue(err, true);
    }
    for (const warn of result.warnings) {
      printIssue(warn, false);
    }
  }

  // Print stats
  const { stats } = result;
  console.log(`  ${colors.dim}Stats: ${stats.elementsCount} elements | ${stats.scriptsCount} scripts | ${stats.eventsCount} events | ${stats.actionsCount} actions | ${stats.globalIdsCount} unique IDs${colors.reset}`);

  return {
    valid: result.valid,
    errorsCount: result.errors.length,
    warningsCount: result.warnings.length,
    stats
  };
}

// CLI execution check
const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));

if (isDirectCli) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
${colors.bold}${colors.cyan}CatWeb JSON Semantic Validator${colors.reset} (Roblox v2.18.2.3)

${colors.bold}Usage:${colors.reset}
  node tools/validate.js <path-to-json-or-dir> [...]

${colors.bold}Options:${colors.reset}
  --no-strict   Disable anti-moderation warnings for variable names
  -h, --help    Show this help message

${colors.bold}Examples:${colors.reset}
  node tools/validate.js skills/catweb/examples/minimal_site.json
  node tools/validate.js skills/catweb/examples/
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const strict = !args.includes('--no-strict');
  const targetPaths = args.filter(a => !a.startsWith('-'));

  function collectFiles(p) {
    const resolved = path.resolve(p);
    if (!fs.existsSync(resolved)) return [p];
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      const results = [];
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          results.push(...collectFiles(path.join(resolved, entry.name)));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          results.push(path.join(resolved, entry.name));
        }
      }
      return results;
    }
    return [resolved];
  }

  const allFiles = targetPaths.flatMap(collectFiles);

  for (const file of allFiles) {
    totalFiles++;
    const res = validateFile(file, { strict });
    totalErrors += res.errorsCount;
    totalWarnings += res.warningsCount;
  }

  console.log(`\n${colors.bold}========================================${colors.reset}`);
  console.log(`${colors.bold}Summary:${colors.reset} ${totalFiles} file(s) scanned.`);
  if (totalErrors > 0) {
    console.log(`${colors.red}${colors.bold}FAILED with ${totalErrors} error(s) and ${totalWarnings} warning(s).${colors.reset}`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`${colors.green}${colors.bold}PASSED with 0 errors ${colors.reset}${colors.yellow}(${totalWarnings} warning(s)).${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.green}${colors.bold}PASSED: All files 100% valid CatWeb JSON!${colors.reset}`);
    process.exit(0);
  }
}
